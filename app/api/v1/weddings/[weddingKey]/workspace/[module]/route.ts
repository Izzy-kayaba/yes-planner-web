import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import type { WorkspaceModule } from "@/lib/api/contracts";
import { canUseWorkspaceModule, isWorkspaceModule } from "@/lib/auth/permissions";
import { requireApiSession, type AuthorizedSession } from "@/lib/auth/session";
import { resolveWeddingAccess } from "@/lib/auth/wedding-access";
import { ensureMongoIndexes, mongoDb } from "@/lib/mongodb";
import { validateWorkspaceMoney, validateWorkspaceRecord } from "@/lib/api/workspace-validation";
import { after } from "next/server";
import { notifyWeddingParticipants, sendWhatsAppToPhone } from "@/lib/whatsapp";
import { sendEventEmail } from "@/lib/email";
import { siteUrl } from "@/lib/site";
import { validateConnectedVendor } from "@/lib/vendors/connected";
import { validateGuestSelections } from "@/lib/guests/validation";
import { paginatedResult, parsePagination } from "@/lib/api/pagination";

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

// Resolve owner/collaborator access once, then use that trusted scope in every collection query.
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
  const weddingAccess = await resolveWeddingAccess(authentication.session, params.weddingKey);
  if (!weddingAccess) {
    return { error: NextResponse.json({ message: "Wedding not found." }, { status: 404 }) };
  }
  if (
    !canUseWorkspaceModule(
      authentication.session.user.role,
      params.module,
      action,
      weddingAccess.access,
    )
  ) {
    return {
      error: NextResponse.json(
        { message: "You do not have permission to use this module." },
        { status: 403 },
      ),
    };
  }
  return {
    session: authentication.session,
    resourceOwnerId: weddingAccess.ownerUserId,
    params: { ...params, module: params.module },
  };
}

export async function GET(request: Request, context: RouteContext) {
  const authorization = await access(request, context, "read");
  if (authorization.error) return authorization.error;
  const pagination = parsePagination(new URL(request.url).searchParams);
  if (!pagination) {
    return NextResponse.json({ message: "Invalid pagination parameters." }, { status: 400 });
  }
  await ensureMongoIndexes();
  const filter = {
    ownerUserId: authorization.resourceOwnerId,
    weddingKey: authorization.params.weddingKey,
    module: authorization.params.module,
    deletedAt: { $exists: false },
  };
  const totalItems = await mongoDb.collection("workspaceItems").countDocuments(filter);
  const records = await mongoDb
    .collection("workspaceItems")
    .find(filter)
    .sort({ createdAt: 1, _id: 1 })
    .skip(pagination.skip)
    .limit(pagination.pageSize)
    .toArray();
  return NextResponse.json(
    paginatedResult(
      records.map((record: Record<string, unknown>) => publicRecord(record)),
      pagination.page,
      pagination.pageSize,
      totalItems,
    ),
  );
}

export async function POST(request: Request, context: RouteContext) {
  const authorization = await access(request, context, "create");
  if (authorization.error) return authorization.error;
  const data = recordData(await request.json().catch(() => null));
  if (!data) return NextResponse.json({ message: "A JSON object is required." }, { status: 400 });
  const moneyError = validateWorkspaceMoney(authorization.params.module, data);
  if (moneyError) return NextResponse.json({ message: moneyError }, { status: 400 });
  const recordError = validateWorkspaceRecord(authorization.params.module, data);
  if (recordError) return NextResponse.json({ message: recordError }, { status: 400 });
  if (authorization.params.module === "guests") {
    const selectionError = await validateGuestSelections(
      authorization.resourceOwnerId,
      authorization.params.weddingKey,
      data,
    );
    if (selectionError) return NextResponse.json({ message: selectionError }, { status: 400 });
    data.inviteToken = randomUUID();
  }
  const vendorError = await validateConnectedVendor(
    authorization.resourceOwnerId,
    authorization.params.weddingKey,
    authorization.params.module,
    data,
  );
  if (vendorError) return NextResponse.json({ message: vendorError }, { status: 400 });

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
  if (authorization.params.module === "guests") {
    const invitationUrl = new URL(`/invite/${String(data.inviteToken)}`, siteUrl).toString();
    const invitationMessage = `You have been invited through Yes Planner. RSVP here: ${invitationUrl}`;
    after(() =>
      Promise.allSettled([
        sendWhatsAppToPhone(String(data.phoneNumber), invitationMessage),
        typeof data.email === "string" && data.email
          ? sendEventEmail(data.email, "Wedding invitation", invitationMessage)
          : Promise.resolve(),
      ]),
    );
  }
  after(() =>
    notifyWeddingParticipants(
      authorization.params.weddingKey,
      authorization.session.user.id,
      `A new ${authorization.params.module} item was added in Yes Planner.`,
    ),
  );
  return NextResponse.json(publicRecord(document), { status: 201 });
}
