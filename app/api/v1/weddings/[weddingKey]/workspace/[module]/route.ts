import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import type { WorkspaceModule } from "@/lib/api/contracts";
import { canUseWorkspaceModule, isWorkspaceModule } from "@/lib/auth/permissions";
import { requireApiSession, type AuthorizedSession } from "@/lib/auth/session";
import { resolveWeddingOwner } from "@/lib/auth/wedding-access";
import { ensureMongoIndexes, mongoDb } from "@/lib/mongodb";
import { validateWorkspaceMoney } from "@/lib/api/workspace-validation";
import { after } from "next/server";
import { notifyWeddingParticipants } from "@/lib/whatsapp";

type RouteContext = { params: Promise<{ weddingKey: string; module: string }> };
type AccessResult =
  | { error: NextResponse; session?: never; resourceOwnerId?: never; params?: never }
  | {
      error?: never;
      session: AuthorizedSession;
      resourceOwnerId: string;
      params: { weddingKey: string; module: WorkspaceModule };
    };

function publicRecord(document: Record<string, unknown>) {
  const { _id, ownerUserId, weddingKey, module, recordId, createdAt, updatedAt, data, ...rest } =
    document;
  return { ...(data as Record<string, unknown>), ...rest, id: recordId };
}

function recordData(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const { id, ...data } = value as Record<string, unknown>;
  return data;
}

async function access(
  request: Request,
  context: RouteContext,
  action: "read" | "create",
): Promise<AccessResult> {
  const authentication = await requireApiSession(request.headers);
  if (authentication.error) return { error: authentication.error };
  const params = await context.params;
  if (!isWorkspaceModule(params.module)) {
    return { error: NextResponse.json({ message: "Unknown workspace module." }, { status: 404 }) };
  }
  if (!canUseWorkspaceModule(authentication.session.user.role, params.module, action)) {
    return {
      error: NextResponse.json(
        { message: "You do not have permission to use this module." },
        { status: 403 },
      ),
    };
  }
  const resourceOwnerId = await resolveWeddingOwner(authentication.session, params.weddingKey);
  if (!resourceOwnerId) {
    return { error: NextResponse.json({ message: "Wedding not found." }, { status: 404 }) };
  }
  return {
    session: authentication.session,
    resourceOwnerId,
    params: { ...params, module: params.module },
  };
}

export async function GET(request: Request, context: RouteContext) {
  const authorization = await access(request, context, "read");
  if (authorization.error) return authorization.error;
  await ensureMongoIndexes();
  const records = await mongoDb
    .collection("workspaceItems")
    .find({
      ownerUserId: authorization.resourceOwnerId,
      weddingKey: authorization.params.weddingKey,
      module: authorization.params.module,
      deletedAt: { $exists: false },
    })
    .sort({ createdAt: 1 })
    .toArray();
  return NextResponse.json(records.map((record: Record<string, unknown>) => publicRecord(record)));
}

export async function POST(request: Request, context: RouteContext) {
  const authorization = await access(request, context, "create");
  if (authorization.error) return authorization.error;
  const data = recordData(await request.json().catch(() => null));
  if (!data) return NextResponse.json({ message: "A JSON object is required." }, { status: 400 });
  const moneyError = validateWorkspaceMoney(authorization.params.module, data);
  if (moneyError) return NextResponse.json({ message: moneyError }, { status: 400 });

  await ensureMongoIndexes();
  const now = new Date();
  const document = {
    ownerUserId: authorization.resourceOwnerId,
    weddingKey: authorization.params.weddingKey,
    module: authorization.params.module,
    recordId: randomUUID(),
    data,
    createdAt: now,
    updatedAt: now,
  };
  await mongoDb.collection("workspaceItems").insertOne(document);
  after(() =>
    notifyWeddingParticipants(
      authorization.params.weddingKey,
      authorization.session.user.id,
      `A new ${authorization.params.module} item was added in Vow Planner.`,
    ),
  );
  return NextResponse.json(publicRecord(document), { status: 201 });
}
