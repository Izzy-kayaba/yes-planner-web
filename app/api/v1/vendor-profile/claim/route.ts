import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/session";
import { submitVendorClaim, VendorClaimError } from "@/lib/vendors/claims";

// Create a pending claim for the authenticated business account; admins decide the outcome.
export async function POST(request: Request) {
  const authentication = await requireApiSession(request.headers);
  if (authentication.error) return authentication.error;
  if (!["Vendor", "Venue"].includes(authentication.session.user.role)) {
    return NextResponse.json({ message: "A business account is required." }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  const profileId = typeof body?.profileId === "string" ? body.profileId : "";
  try {
    const result = await submitVendorClaim(profileId, authentication.session.user.id);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof VendorClaimError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    throw error;
  }
}
