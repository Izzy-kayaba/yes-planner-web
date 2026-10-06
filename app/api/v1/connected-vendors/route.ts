import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/session";
import { resolveWeddingOwner } from "@/lib/auth/wedding-access";
import { getConnectedVendors } from "@/lib/vendors/connected";

export async function GET(request: Request) {
  const authentication = await requireApiSession(request.headers);
  if (authentication.error) return authentication.error;
  const weddingKey = new URL(request.url).searchParams.get("weddingKey")?.trim();
  if (!weddingKey) return NextResponse.json({ message: "Wedding is required." }, { status: 400 });
  const ownerUserId = await resolveWeddingOwner(authentication.session, weddingKey);
  if (!ownerUserId) return NextResponse.json({ message: "Wedding not found." }, { status: 404 });
  const profiles = await getConnectedVendors(ownerUserId, weddingKey);
  return NextResponse.json(
    profiles.map((profile) => ({
      id: String(profile.ownerUserId),
      name: String(profile.businessName),
      services: Array.isArray(profile.services) ? profile.services.map(String) : [],
    })),
  );
}
