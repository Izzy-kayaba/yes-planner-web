import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { z } from "zod";
import { recordAdminAuditEvent } from "@/lib/auth/admin-audit";
import { requirePlatformApiPermission } from "@/lib/auth/platform-admin";
import { accountTypes, isPlatformStaffRole } from "@/lib/auth/roles";
import { ensureMongoIndexes, mongoDb } from "@/lib/mongodb";
import { paginatedResult, parsePagination } from "@/lib/api/pagination";
import { escapedAdminSearch, parseAdminSearch } from "@/lib/admin/search";

// Limit this list to System Admins and project only fields needed by the admin screen.
export async function GET(request: Request) {
  const authorization = await requirePlatformApiPermission(request.headers, "users.view");
  if (authorization.error) return authorization.error;
  const searchParams = new URL(request.url).searchParams;
  const detailUserId = searchParams.get("userId");
  if (detailUserId) {
    if (!/^[a-f\d]{24}$/i.test(detailUserId)) {
      return NextResponse.json({ message: "Provide a valid user." }, { status: 400 });
    }
    const user = await mongoDb.collection("user").findOne({ _id: new ObjectId(detailUserId) });
    if (!user) return NextResponse.json({ message: "User not found." }, { status: 404 });
    return NextResponse.json(await userAdministrationDetails(user));
  }
  const pagination = parsePagination(searchParams);
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
  await ensureMongoIndexes();
  const usersCollection = mongoDb.collection("user");
  const searchExpression = search ? { $regex: escapedAdminSearch(search), $options: "i" } : null;
  const filter: Record<string, unknown> = {};
  if (searchExpression) {
    filter.$or = [
      { name: searchExpression },
      { email: searchExpression },
      { role: searchExpression },
      { accountType: searchExpression },
    ];
  }
  const accountType = searchParams.get("accountType");
  if (accountType && accountType !== "all") {
    filter.$and = [
      {
        $or: [
          { accountType },
          { role: accountType },
          ...(accountType === "Vendor" ? [{ role: "Planner" }] : []),
        ],
      },
    ];
  }
  const totalItems = await usersCollection.countDocuments(filter);
  const sortBy = searchParams.get("sort");
  const sort: Record<string, 1 | -1> =
    sortBy === "name"
      ? { name: 1, _id: 1 }
      : sortBy === "email"
        ? { email: 1, _id: 1 }
        : { createdAt: -1, _id: -1 };
  const users = await mongoDb
    .collection("user")
    .find(filter, {
      projection: { name: 1, email: 1, role: 1, accountType: 1, createdAt: 1, image: 1 },
    })
    .sort(sort)
    .skip(pagination.skip)
    .limit(pagination.pageSize)
    .toArray();
  const items = users.map((user: Record<string, unknown>) => ({
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    accountType: user.accountType ?? (user.role === "Planner" ? "Vendor" : user.role),
    image: user.image ?? null,
    createdAt: user.createdAt,
  }));
  return NextResponse.json(
    paginatedResult(items, pagination.page, pagination.pageSize, totalItems),
  );
}

const userUpdateSchema = z.object({
  userId: z.string().regex(/^[a-f\d]{24}$/i),
  name: z.string().trim().min(2).max(160).optional(),
  firstName: z.string().trim().max(80).optional(),
  lastName: z.string().trim().max(80).optional(),
  phoneNumber: z.string().trim().max(40).optional(),
  accountType: z.enum(accountTypes).optional(),
  emailVerified: z.boolean().optional(),
  status: z.enum(["Active", "Suspended"]).optional(),
  banReason: z.string().trim().max(240).optional(),
  revokeSessions: z.boolean().optional(),
});

const userDeleteSchema = z.object({
  userId: z.string().regex(/^[a-f\d]{24}$/i),
});

async function customerDataExists(userIds: string[]) {
  const [wedding, business] = await Promise.all([
    mongoDb.collection("weddingProfiles").findOne({ ownerUserId: { $in: userIds } }),
    mongoDb.collection("vendorProfiles").findOne({ ownerUserId: { $in: userIds } }),
  ]);
  return Boolean(wedding || business);
}

async function userAdministrationDetails(user: Record<string, unknown>) {
  const userIds = [...new Set([String(user._id), String(user.id ?? "")].filter(Boolean))];
  const [accounts, sessions, weddings, businesses] = await Promise.all([
    mongoDb
      .collection("account")
      .find({ userId: { $in: userIds } }, { projection: { providerId: 1 } })
      .toArray(),
    mongoDb.collection("session").countDocuments({ userId: { $in: userIds } }),
    mongoDb
      .collection("weddingProfiles")
      .find(
        { ownerUserId: { $in: userIds } },
        { projection: { displayName: 1, weddingKey: 1, weddingDate: 1, venue: 1 } },
      )
      .toArray(),
    mongoDb
      .collection("vendorProfiles")
      .find(
        { ownerUserId: { $in: userIds } },
        { projection: { businessName: 1, services: 1, claimed: 1 } },
      )
      .toArray(),
  ]);
  const providers = [...new Set(accounts.map((account) => String(account.providerId)))];
  return {
    id: String(user._id),
    email: String(user.email ?? ""),
    name: String(user.name ?? ""),
    firstName: String(user.firstName ?? ""),
    lastName: String(user.lastName ?? ""),
    phoneNumber: String(user.phoneNumber ?? ""),
    image: user.image ?? null,
    accountType: user.accountType ?? (user.role === "Planner" ? "Vendor" : user.role),
    platformRoles: Array.isArray(user.platformRoles)
      ? user.platformRoles.filter(isPlatformStaffRole)
      : [],
    status: user.banned === true ? "Suspended" : "Active",
    banReason: String(user.banReason ?? ""),
    emailVerified: user.emailVerified === true,
    linkedProviders: providers.filter((provider) => provider !== "credential"),
    hasPassword: providers.includes("credential"),
    activeSessionCount: sessions,
    ownership: {
      weddings: weddings.map((wedding) => ({
        id: String(wedding._id),
        name: String(wedding.displayName ?? "Wedding"),
        weddingKey: String(wedding.weddingKey ?? ""),
        weddingDate: String(wedding.weddingDate ?? ""),
        venue: String(wedding.venue ?? ""),
      })),
      businesses: businesses.map((business) => ({
        id: String(business._id),
        name: String(business.businessName ?? "Business"),
        services: Array.isArray(business.services)
          ? business.services.filter((service): service is string => typeof service === "string")
          : [],
        claimed: business.claimed === true,
      })),
    },
  };
}

export async function PATCH(request: Request) {
  const authorization = await requirePlatformApiPermission(request.headers, "users.manage");
  if (authorization.error) return authorization.error;
  const parsed = userUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Provide valid user administration details." },
      { status: 400 },
    );
  }
  const { data } = parsed;
  const hasChanges = Object.entries(data).some(
    ([key, value]) => key !== "userId" && value !== undefined && key !== "revokeSessions",
  );
  if (!hasChanges && !data.revokeSessions)
    return NextResponse.json({ message: "Provide at least one change." }, { status: 400 });
  const userId = new ObjectId(data.userId);
  const users = mongoDb.collection("user");
  const before = await users.findOne(
    { _id: userId },
    {
      projection: {
        name: 1,
        firstName: 1,
        lastName: 1,
        phoneNumber: 1,
        accountType: 1,
        emailVerified: 1,
        banned: 1,
        banReason: 1,
      },
    },
  );
  if (!before) return NextResponse.json({ message: "User not found." }, { status: 404 });
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (data.name !== undefined) updates.name = data.name;
  if (data.firstName !== undefined) updates.firstName = data.firstName;
  if (data.lastName !== undefined) updates.lastName = data.lastName;
  if (data.phoneNumber !== undefined) updates.phoneNumber = data.phoneNumber;
  if (data.accountType) {
    updates.accountType = data.accountType;
    updates.role = data.accountType;
  }
  if (data.emailVerified !== undefined) updates.emailVerified = data.emailVerified;
  if (data.status !== undefined) updates.banned = data.status === "Suspended";
  if (data.status === "Suspended")
    updates.banReason = data.banReason ?? "Suspended by platform administration";
  if (data.status === "Active") updates.banReason = null;
  await users.updateOne({ _id: userId }, { $set: updates });
  if (data.revokeSessions)
    await mongoDb
      .collection("session")
      .deleteMany({ userId: { $in: [data.userId, String(before.id ?? "")] } });
  await recordAdminAuditEvent({
    actorUserId: authorization.session.user.id,
    permission: "users.manage",
    action: "user.updated",
    resourceType: "user",
    resourceId: data.userId,
    outcome: "success",
    changes: {
      ...(data.name !== undefined ? { name: { before: before.name ?? "", after: data.name } } : {}),
      ...(data.firstName !== undefined
        ? { firstName: { before: before.firstName ?? "", after: data.firstName } }
        : {}),
      ...(data.lastName !== undefined
        ? { lastName: { before: before.lastName ?? "", after: data.lastName } }
        : {}),
      ...(data.phoneNumber !== undefined
        ? { phoneNumber: { before: before.phoneNumber ?? "", after: data.phoneNumber } }
        : {}),
      ...(data.accountType
        ? { accountType: { before: before.accountType ?? "", after: data.accountType } }
        : {}),
      ...(data.emailVerified !== undefined
        ? { emailVerified: { before: before.emailVerified === true, after: data.emailVerified } }
        : {}),
      ...(data.status !== undefined
        ? {
            status: { before: before.banned === true ? "Suspended" : "Active", after: data.status },
          }
        : {}),
      ...(data.revokeSessions ? { sessions: { before: "active", after: "revoked" } } : {}),
    },
  });
  return NextResponse.json({ status: "updated" });
}

export async function DELETE(request: Request) {
  const authorization = await requirePlatformApiPermission(request.headers, "users.manage");
  if (authorization.error) return authorization.error;
  const parsed = userDeleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ message: "Provide a valid user." }, { status: 400 });
  if (parsed.data.userId === authorization.session.user.id) {
    return NextResponse.json({ message: "You cannot delete your own account." }, { status: 409 });
  }
  const userId = new ObjectId(parsed.data.userId);
  const users = mongoDb.collection("user");
  const user = await users.findOne({ _id: userId }, { projection: { id: 1, platformRoles: 1 } });
  if (!user) return NextResponse.json({ message: "User not found." }, { status: 404 });
  const userIds = [...new Set([parsed.data.userId, String(user.id ?? "")].filter(Boolean))];
  const platformRoles = Array.isArray(user.platformRoles)
    ? user.platformRoles.filter(isPlatformStaffRole)
    : [];
  if (platformRoles.length) {
    return NextResponse.json(
      { message: "Manage platform staff accounts from the Platform staff page." },
      { status: 409 },
    );
  }
  if (await customerDataExists(userIds)) {
    return NextResponse.json(
      { message: "This user owns customer data and cannot be deleted." },
      { status: 409 },
    );
  }
  await Promise.all([
    users.deleteOne({ _id: userId }),
    mongoDb.collection("session").deleteMany({ userId: { $in: userIds } }),
    mongoDb.collection("account").deleteMany({ userId: { $in: userIds } }),
  ]);
  await recordAdminAuditEvent({
    actorUserId: authorization.session.user.id,
    permission: "users.manage",
    action: "user.deleted",
    resourceType: "user",
    resourceId: parsed.data.userId,
    outcome: "success",
  });
  return NextResponse.json({ status: "deleted" });
}
