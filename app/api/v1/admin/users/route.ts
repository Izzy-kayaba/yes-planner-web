import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/session";
import { ensureMongoIndexes, mongoDb } from "@/lib/mongodb";
import { paginatedResult, parsePagination } from "@/lib/api/pagination";

// Limit this list to System Admins and project only fields needed by the admin screen.
export async function GET(request: Request) {
  const authentication = await requireApiSession(request.headers);
  if ("error" in authentication) return authentication.error;
  if (authentication.session.user.role !== "SystemAdmin") {
    return NextResponse.json(
      { message: "System administrator access is required." },
      { status: 403 },
    );
  }
  const pagination = parsePagination(new URL(request.url).searchParams);
  if (!pagination) {
    return NextResponse.json({ message: "Invalid pagination parameters." }, { status: 400 });
  }
  await ensureMongoIndexes();
  const usersCollection = mongoDb.collection("user");
  const totalItems = await usersCollection.countDocuments();
  const users = await mongoDb
    .collection("user")
    .find(
      {},
      { projection: { name: 1, email: 1, role: 1, accountType: 1, createdAt: 1, image: 1 } },
    )
    .sort({ createdAt: -1, _id: -1 })
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
