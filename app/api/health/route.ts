import { NextResponse } from "next/server";
import { mongoDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await mongoDb.command({ ping: 1 });
    return NextResponse.json({ status: "healthy" });
  } catch {
    return NextResponse.json({ status: "unavailable" }, { status: 503 });
  }
}
