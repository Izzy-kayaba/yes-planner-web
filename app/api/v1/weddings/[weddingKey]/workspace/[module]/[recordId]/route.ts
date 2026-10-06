import { NextResponse } from "next/server";
import type { WorkspaceModule } from "@/lib/api/contracts";
import { canUseWorkspaceModule, isWorkspaceModule } from "@/lib/auth/permissions";
import { requireApiSession, type AuthorizedSession } from "@/lib/auth/session";
import { resolveWeddingOwner } from "@/lib/auth/wedding-access";
import { mongoDb } from "@/lib/mongodb";
import { validateWorkspaceMoney } from "@/lib/api/workspace-validation";
import { after } from "next/server";
import { notifyWeddingParticipants } from "@/lib/whatsapp";
import { validateConnectedVendor } from "@/lib/vendors/connected";

type RouteContext = {
  params: Promise<{ weddingKey: string; module: string; recordId: string }>;
};
type AuthorizationResult =
  | { error: NextResponse; session?: never; resourceOwnerId?: never; params?: never }
  | {
      error?: never;
      session: AuthorizedSession;
      resourceOwnerId: string;
      params: { weddingKey: string; module: WorkspaceModule; recordId: string };
    };

async function authorize(
  request: Request,
  context: RouteContext,
  action: "update" | "delete",
): Promise<AuthorizationResult> {
  const authentication = await requireApiSession(request.headers);
  if (authentication.error) return { error: authentication.error };
  const params = await context.params;
  if (!isWorkspaceModule(params.module)) {
    return { error: NextResponse.json({ message: "Unknown workspace module." }, { status: 404 }) };
  }
  if (!canUseWorkspaceModule(authentication.session.user.role, params.module, action)) {
    return {
      error: NextResponse.json(
        { message: "You do not have permission to change this module." },
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

export async function PUT(request: Request, context: RouteContext) {
  const authorization = await authorize(request, context, "update");
  if (authorization.error) return authorization.error;
  const value = await request.json().catch(() => null);
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return NextResponse.json({ message: "A JSON object is required." }, { status: 400 });
  }
  const { id, ...data } = value as Record<string, unknown>;
  const moneyError = validateWorkspaceMoney(authorization.params.module, data);
  if (moneyError) return NextResponse.json({ message: moneyError }, { status: 400 });
  const vendorError = await validateConnectedVendor(
    authorization.resourceOwnerId,
    authorization.params.weddingKey,
    authorization.params.module,
    data,
  );
  if (vendorError) return NextResponse.json({ message: vendorError }, { status: 400 });
  const filter = {
    ownerUserId: authorization.resourceOwnerId,
    weddingKey: authorization.params.weddingKey,
    module: authorization.params.module,
    recordId: authorization.params.recordId,
    deletedAt: { $exists: false },
  };
  const result = await mongoDb
    .collection("workspaceItems")
    .findOneAndUpdate(
      filter,
      { $set: { data, updatedAt: new Date() } },
      { returnDocument: "after" },
    );
  if (!result) return NextResponse.json({ message: "Record not found." }, { status: 404 });
  after(() =>
    notifyWeddingParticipants(
      authorization.params.weddingKey,
      authorization.session.user.id,
      `A ${authorization.params.module} item was updated in Yes Planner.`,
    ),
  );
  return NextResponse.json({ ...data, id: authorization.params.recordId });
}

export async function DELETE(request: Request, context: RouteContext) {
  const authorization = await authorize(request, context, "delete");
  if (authorization.error) return authorization.error;
  const result = await mongoDb.collection("workspaceItems").updateOne(
    {
      ownerUserId: authorization.resourceOwnerId,
      weddingKey: authorization.params.weddingKey,
      module: authorization.params.module,
      recordId: authorization.params.recordId,
      deletedAt: { $exists: false },
    },
    { $set: { deletedAt: new Date(), updatedAt: new Date() } },
  );
  if (!result.matchedCount)
    return NextResponse.json({ message: "Record not found." }, { status: 404 });
  after(() =>
    notifyWeddingParticipants(
      authorization.params.weddingKey,
      authorization.session.user.id,
      `A ${authorization.params.module} item was removed in Yes Planner.`,
    ),
  );
  return new NextResponse(null, { status: 204 });
}
