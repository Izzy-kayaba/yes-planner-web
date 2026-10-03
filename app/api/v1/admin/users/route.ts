import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/session";
import { mongoDb } from "@/lib/mongodb";

export async function GET(request: Request) {
  const authentication = await requireApiSession(request.headers);
  if ("error" in authentication) return authentication.error;
  if (authentication.session.user.role !== "SystemAdmin") {
    return NextResponse.json(
      { message: "System administrator access is required." },
      { status: 403 },
    );
  }
  const users = await mongoDb
    .collection("user")
    .find({}, { projection: { name: 1, email: 1, role: 1, createdAt: 1, image: 1 } })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();
  return NextResponse.json(
    users.map((user: Record<string, unknown>) => ({
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image ?? null,
      createdAt: user.createdAt,
    })),
  );
}
