import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import type { WorkspaceModule } from "@/lib/api/contracts";
import { canUseWorkspaceModule, isWorkspaceModule } from "@/lib/auth/permissions";
import { requireApiSession, type AuthorizedSession } from "@/lib/auth/session";
import { resolveWeddingAccess } from "@/lib/auth/wedding-access";
import { mongoDb } from "@/lib/mongodb";
import { validateWorkspaceMoney, validateWorkspaceRecord } from "@/lib/api/workspace-validation";
import { after } from "next/server";
import { notifyWeddingParticipants } from "@/lib/whatsapp";
import { validateConnectedVendor } from "@/lib/vendors/connected";
import { validateGuestSelections } from "@/lib/guests/validation";

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
        { message: "You do not have permission to change this module." },
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
  const recordError = validateWorkspaceRecord(authorization.params.module, data);
  if (recordError) return NextResponse.json({ message: recordError }, { status: 400 });
  const filter = {
    ownerUserId: authorization.resourceOwnerId,
    weddingKey: authorization.params.weddingKey,
    module: authorization.params.module,
    recordId: authorization.params.recordId,
    deletedAt: { $exists: false },
  };
  if (authorization.params.module === "guests") {
    const selectionError = await validateGuestSelections(
      authorization.resourceOwnerId,
      authorization.params.weddingKey,
      data,
    );
    if (selectionError) return NextResponse.json({ message: selectionError }, { status: 400 });
    const existing = await mongoDb.collection("workspaceItems").findOne(filter);
    if (!existing) return NextResponse.json({ message: "Record not found." }, { status: 404 });
    data.inviteToken = existing.data?.inviteToken ?? randomUUID();
  }
  const vendorError = await validateConnectedVendor(
    authorization.resourceOwnerId,
    authorization.params.weddingKey,
    authorization.params.module,
    data,
  );
  if (vendorError) return NextResponse.json({ message: vendorError }, { status: 400 });
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
