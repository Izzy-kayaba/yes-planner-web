// Purpose: implements app/api/v1/admin/platform/staff/route.ts for the Yes Planner web application.
import { ObjectId, type Document, type Filter } from "mongodb";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { recordAdminAuditEvent } from "@/lib/auth/admin-audit";
import { requirePlatformApiPermission } from "@/lib/auth/platform-admin";
import { isPlatformStaffRole, platformStaffRoles } from "@/lib/auth/roles";
import { ensureMongoIndexes, mongoDb } from "@/lib/mongodb";
import { paginatedResult, parsePagination } from "@/lib/api/pagination";
import { escapedAdminSearch, parseAdminSearch } from "@/lib/admin/search";
import {
  canInvitePlatformStaffRole,
  canManagePlatformStaffTarget,
} from "@/lib/auth/platform-permissions";

const staffChangeSchema = z.object({
  userId: z.string().regex(/^[a-f\d]{24}$/i),
  role: z.enum(platformStaffRoles),
  action: z.enum(["grant", "revoke"]),
});

const staffDeleteSchema = z.object({
  userId: z.string().regex(/^[a-f\d]{24}$/i),
});

export async function GET(request: Request) {
  const authorization = await requirePlatformApiPermission(request.headers, "platform_staff.view");
  if (authorization.error) return authorization.error;
  const searchParams = new URL(request.url).searchParams;
  const pagination = parsePagination(searchParams, 25, 100);
  if (!pagination) {
    return NextResponse.json({ message: "Invalid pagination parameters." }, { status: 400 });
  }
  const search = parseAdminSearch(searchParams);
  if (search === null) {
    return NextResponse.json(
      { message: "Search must be 100 characters or fewer." },
      { status: 400 },
    );
  }
  const platformRole = searchParams.get("platformRole");
  const filterByPlatformRole = platformRole && platformRole !== "all";
  await ensureMongoIndexes();
  const users = mongoDb.collection("user");
  const filterClauses: Filter<Document>[] = [{ platformRoles: { $exists: true, $ne: [] } }];
  if (search) {
    filterClauses.push({
      $or: [
        { name: { $regex: escapedAdminSearch(search), $options: "i" } },
        { email: { $regex: escapedAdminSearch(search), $options: "i" } },
        { accountType: { $regex: escapedAdminSearch(search), $options: "i" } },
        { role: { $regex: escapedAdminSearch(search), $options: "i" } },
        { platformRoles: { $regex: escapedAdminSearch(search), $options: "i" } },
      ],
    });
  }
  if (filterByPlatformRole) {
    filterClauses.push({ platformRoles: platformRole });
  }
  const filter: Filter<Document> = filterClauses.length ? { $and: filterClauses } : {};
  const sortBy = searchParams.get("sort");
  const sort: Record<string, 1 | -1> =
    sortBy === "name"
      ? { name: 1, _id: 1 }
      : sortBy === "email"
        ? { email: 1, _id: 1 }
        : { createdAt: -1, _id: -1 };
  const totalItems = await users.countDocuments(filter);
  const staff = await users
    .find(filter, { projection: { name: 1, email: 1, role: 1, accountType: 1, platformRoles: 1 } })
    .sort(sort)
    .skip(pagination.skip)
    .limit(pagination.pageSize)
    .toArray();
  return NextResponse.json(
    paginatedResult(
      staff.map((user) => ({
        id: String(user._id),
        name: String(user.name ?? ""),
        email: String(user.email ?? ""),
        accountType: String(user.accountType ?? user.role ?? ""),
        platformRoles: [
          ...new Set([
            ...(Array.isArray(user.platformRoles)
              ? user.platformRoles.filter(isPlatformStaffRole)
              : []),
          ]),
        ],
      })),
      pagination.page,
      pagination.pageSize,
      totalItems,
    ),
  );
}

const createStaffSchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/),
  role: z.enum(platformStaffRoles),
});

export async function POST(request: Request) {
  const authorization = await requirePlatformApiPermission(
    request.headers,
    "platform_staff.manage",
  );
  if (authorization.error) return authorization.error;
  const parsed = createStaffSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Provide valid names, email, password, and platform role." },
      { status: 400 },
    );
  }
  if (
    parsed.data.role === "SuperAdmin" &&
    !canInvitePlatformStaffRole(authorization.access.roles, parsed.data.role)
  ) {
    return NextResponse.json(
      { message: "Only a Super Admin can manage Super Admin access." },
      { status: 403 },
    );
  }
  if (!canInvitePlatformStaffRole(authorization.access.roles, parsed.data.role)) {
    return NextResponse.json({ message: "You cannot create this platform role." }, { status: 403 });
  }

  await ensureMongoIndexes();
  const email = parsed.data.email.toLowerCase();
  const users = mongoDb.collection("user");
  if (await users.findOne({ email }, { projection: { _id: 1 } })) {
    return NextResponse.json(
      { message: "An account already exists with this email." },
      { status: 409 },
    );
  }
  let signupResponse: Response;
  try {
    signupResponse = await auth.api.signUpEmail({
      body: {
        email,
        password: parsed.data.password,
        name: `${parsed.data.firstName} ${parsed.data.lastName}`,
      },
      headers: request.headers,
      asResponse: true,
    });
  } catch (error) {
    console.error("Platform staff account creation failed", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { message: "Platform account creation is temporarily unavailable." },
      { status: 500 },
    );
  }
  if (!signupResponse.ok) return signupResponse;

  const result = await users.updateOne(
    { email },
    {
      $set: {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        role: "Guest",
        accountType: "Guest",
        platformRoles: [parsed.data.role],
        updatedAt: new Date(),
      },
    },
  );
  if (!result.matchedCount) {
    return NextResponse.json(
      { message: "The account was created but platform access was not assigned." },
      { status: 500 },
    );
  }
  await recordAdminAuditEvent({
    actorUserId: authorization.session.user.id,
    permission: "platform_staff.manage",
    action: "platform_staff.created",
    resourceType: "user",
    resourceId: email,
    outcome: "success",
  });
  return NextResponse.json({ status: "created" }, { status: 201 });
}

export async function PATCH(request: Request) {
  const authorization = await requirePlatformApiPermission(
    request.headers,
    "platform_staff.manage",
  );
  if (authorization.error) return authorization.error;
  const parsed = staffChangeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Provide a valid account, role, and action." },
      { status: 400 },
    );
  }
  if (
    parsed.data.role === "SuperAdmin" &&
    !canInvitePlatformStaffRole(authorization.access.roles, parsed.data.role)
  ) {
    return NextResponse.json(
      { message: "Only a Super Admin can manage Super Admin access." },
      { status: 403 },
    );
  }
  const targetId = new ObjectId(parsed.data.userId);
  const users = mongoDb.collection<{
    accountType?: string;
    role?: string;
    platformRoles?: (typeof platformStaffRoles)[number][];
  }>("user");
  const target = await users.findOne(
    { _id: targetId },
    { projection: { accountType: 1, platformRoles: 1, role: 1 } },
  );
  if (!target) return NextResponse.json({ message: "Account not found." }, { status: 404 });

  const targetRoles = Array.isArray(target.platformRoles)
    ? target.platformRoles.filter(isPlatformStaffRole)
    : [];
  if (!canManagePlatformStaffTarget(authorization.access.roles, targetRoles, "update")) {
    return NextResponse.json(
      { message: "You cannot change the role of this platform user." },
      { status: 403 },
    );
  }

  if (parsed.data.role === "SuperAdmin" && parsed.data.action === "revoke") {
    const superAdminCount = await users.countDocuments({
      platformRoles: "SuperAdmin",
    });
    if (superAdminCount <= 1) {
      return NextResponse.json(
        { message: "The last Super Admin cannot be removed." },
        { status: 409 },
      );
    }
  }

  if (parsed.data.action === "grant" && parsed.data.role === "SuperAdmin") {
    await users.updateOne(
      { _id: targetId },
      {
        $addToSet: { platformRoles: parsed.data.role },
        $set: { role: "SystemAdmin" },
        $currentDate: { updatedAt: true },
      },
    );
  } else if (parsed.data.action === "grant") {
    await users.updateOne(
      { _id: targetId },
      { $addToSet: { platformRoles: parsed.data.role }, $currentDate: { updatedAt: true } },
    );
  } else if (parsed.data.role === "SuperAdmin") {
    await users.updateOne(
      { _id: targetId },
      {
        $pull: { platformRoles: parsed.data.role },
        $set: { role: typeof target.accountType === "string" ? target.accountType : "Couple" },
        $currentDate: { updatedAt: true },
      },
    );
  } else {
    await users.updateOne(
      { _id: targetId },
      { $pull: { platformRoles: parsed.data.role }, $currentDate: { updatedAt: true } },
    );
  }
  await recordAdminAuditEvent({
    actorUserId: authorization.session.user.id,
    permission: "platform_staff.manage",
    action: `platform_staff.${parsed.data.action}`,
    resourceType: "user",
    resourceId: parsed.data.userId,
    outcome: "success",
  });
  return NextResponse.json({ status: parsed.data.action });
}

export async function DELETE(request: Request) {
  const authorization = await requirePlatformApiPermission(
    request.headers,
    "platform_staff.manage",
  );
  if (authorization.error) return authorization.error;
  const parsed = staffDeleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Provide a valid platform user." }, { status: 400 });
  }
  if (parsed.data.userId === authorization.session.user.id) {
    return NextResponse.json(
      { message: "You cannot delete your own platform account." },
      { status: 409 },
    );
  }

  const targetId = new ObjectId(parsed.data.userId);
  const users = mongoDb.collection<{
    id?: string;
    platformRoles?: unknown;
  }>("user");
  const target = await users.findOne(
    { _id: targetId },
    { projection: { id: 1, platformRoles: 1 } },
  );
  if (!target) return NextResponse.json({ message: "Account not found." }, { status: 404 });
  const targetRoles = Array.isArray(target.platformRoles)
    ? target.platformRoles.filter(isPlatformStaffRole)
    : [];
  if (!targetRoles.length) {
    return NextResponse.json({ message: "The account is not a platform user." }, { status: 409 });
  }
  if (!canManagePlatformStaffTarget(authorization.access.roles, targetRoles, "delete")) {
    return NextResponse.json({ message: "You cannot delete this platform user." }, { status: 403 });
  }

  const targetUserIds = [...new Set([parsed.data.userId, target.id].filter(Boolean))];
  const [weddingOwner, businessOwner] = await Promise.all([
    mongoDb.collection("weddingProfiles").findOne({ ownerUserId: { $in: targetUserIds } }),
    mongoDb.collection("vendorProfiles").findOne({ ownerUserId: { $in: targetUserIds } }),
  ]);
  if (weddingOwner || businessOwner) {
    return NextResponse.json(
      { message: "Remove platform access instead; this account owns customer data." },
      { status: 409 },
    );
  }

  await Promise.all([
    users.deleteOne({ _id: targetId }),
    mongoDb.collection("session").deleteMany({ userId: { $in: targetUserIds } }),
    mongoDb.collection("account").deleteMany({ userId: { $in: targetUserIds } }),
  ]);
  await recordAdminAuditEvent({
    actorUserId: authorization.session.user.id,
    permission: "platform_staff.manage",
    action: "platform_staff.deleted",
    resourceType: "user",
    resourceId: parsed.data.userId,
    outcome: "success",
  });
  return NextResponse.json({ status: "deleted" });
}
