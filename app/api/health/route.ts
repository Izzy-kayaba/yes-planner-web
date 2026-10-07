import { NextResponse } from "next/server";
import { mongoDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

// Keep this check independent of user sign-in so monitors can detect database outages.
export async function GET() {
  try {
    await mongoDb.command({ ping: 1 });
    return NextResponse.json({ status: "healthy" });
  } catch (error) {
    // Keep connection details out of the response while leaving a useful
    // diagnosis in the deployment logs.
    const failure = error as { name?: string; code?: string | number; message?: string };
    console.error("MongoDB health check failed", {
      name: failure.name ?? "UnknownError",
      code: failure.code ?? "unknown",
      message: failure.message?.replace(/mongodb(?:\+srv)?:\/\/[^\s]+/gi, "<redacted>"),
    });
    return NextResponse.json({ status: "unavailable" }, { status: 503 });
  }
}
