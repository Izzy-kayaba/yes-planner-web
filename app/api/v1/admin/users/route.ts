import { NextResponse } from "next/server";
import { requirePlatformApiPermission } from "@/lib/auth/platform-admin";
import { ensureMongoIndexes, mongoDb } from "@/lib/mongodb";
import { paginatedResult, parsePagination } from "@/lib/api/pagination";
import { escapedAdminSearch, parseAdminSearch } from "@/lib/admin/search";

// Limit this list to System Admins and project only fields needed by the admin screen.
export async function GET(request: Request) {
  const authorization = await requirePlatformApiPermission(request.headers, "users.view");
  if (authorization.error) return authorization.error;
  const searchParams = new URL(request.url).searchParams;
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
