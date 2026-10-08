import { ObjectId, type Document, type Filter } from "mongodb";
import { NextResponse } from "next/server";
import { z } from "zod";
import { recordAdminAuditEvent } from "@/lib/auth/admin-audit";
import { requirePlatformApiPermission } from "@/lib/auth/platform-admin";
import { isPlatformStaffRole, platformStaffRoles } from "@/lib/auth/roles";
import { ensureMongoIndexes, mongoDb } from "@/lib/mongodb";
import { paginatedResult, parsePagination } from "@/lib/api/pagination";
import { escapedAdminSearch, parseAdminSearch } from "@/lib/admin/search";

const staffChangeSchema = z.object({
  userId: z.string().regex(/^[a-f\d]{24}$/i),
  role: z.enum(platformStaffRoles),
  action: z.enum(["grant", "revoke"]),
});

export async function GET(request: Request) {
  const authorization = await requirePlatformApiPermission(
    request.headers,
    "platform_staff.manage",
  );
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
  const filterClauses: Filter<Document>[] = [];
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
    filterClauses.push(
      platformRole === "SuperAdmin"
        ? { $or: [{ platformRoles: platformRole }, { role: "SystemAdmin" }] }
        : { platformRoles: platformRole },
    );
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
            ...(user.role === "SystemAdmin" ? ["SuperAdmin" as const] : []),
          ]),
        ],
      })),
      pagination.page,
      pagination.pageSize,
      totalItems,
    ),
  );
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

  if (parsed.data.role === "SuperAdmin" && parsed.data.action === "revoke") {
    const superAdminCount = await users.countDocuments({
      $or: [{ platformRoles: "SuperAdmin" }, { role: "SystemAdmin" }],
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
