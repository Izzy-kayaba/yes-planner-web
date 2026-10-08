import { NextResponse } from "next/server";
import { requirePlatformApiPermission } from "@/lib/auth/platform-admin";
import { listAdminWeddings } from "@/lib/admin/directories";

export async function GET(request: Request) {
  const authorization = await requirePlatformApiPermission(request.headers, "weddings.view");
  if (authorization.error) return authorization.error;
  const result = await listAdminWeddings(new URL(request.url).searchParams);
  if (!result) {
    return NextResponse.json({ message: "Invalid pagination parameters." }, { status: 400 });
  }
  return NextResponse.json(result);
}
