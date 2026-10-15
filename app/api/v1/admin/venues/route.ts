// Purpose: implements app/api/v1/admin/venues/route.ts for the Yes Planner web application.
import { NextResponse } from "next/server";
import { requirePlatformApiPermission } from "@/lib/auth/platform-admin";
import { listAdminBusinesses } from "@/lib/admin/directories";
import { handleAdminBusinessMutation } from "@/lib/admin/business-mutations";

export async function GET(request: Request) {
  const authorization = await requirePlatformApiPermission(request.headers, "venues.view");
  if (authorization.error) return authorization.error;
  const result = await listAdminBusinesses(new URL(request.url).searchParams, true);
  if (!result) {
    return NextResponse.json({ message: "Invalid pagination parameters." }, { status: 400 });
  }
  return NextResponse.json(result);
}

export function POST(request: Request) {
  return handleAdminBusinessMutation(request, true, "POST");
}

export function PATCH(request: Request) {
  return handleAdminBusinessMutation(request, true, "PATCH");
}

export function DELETE(request: Request) {
  return handleAdminBusinessMutation(request, true, "DELETE");
}
