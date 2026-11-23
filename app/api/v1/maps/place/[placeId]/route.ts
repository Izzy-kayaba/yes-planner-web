import { NextResponse } from "next/server";

export async function GET(_request: Request, context: { params: Promise<{ placeId: string }> }) {
  const { placeId } = await context.params;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (!apiKey || !placeId)
    return NextResponse.json({ message: "Map details are unavailable." }, { status: 503 });
  const response = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
    {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "id,formattedAddress,location,googleMapsUri,displayName",
      },
      cache: "no-store",
    },
  );
  if (!response.ok)
    return NextResponse.json(
      { message: "The selected address could not be loaded." },
      { status: 502 },
    );
  const place = (await response.json()) as {
    formattedAddress?: string;
    location?: { latitude?: number; longitude?: number };
    googleMapsUri?: string;
  };
  return NextResponse.json({
    address: place.formattedAddress ?? "",
    mapUrl: place.googleMapsUri ?? "",
    directionsUrl: place.googleMapsUri ?? "",
    latitude: place.location?.latitude ?? null,
    longitude: place.location?.longitude ?? null,
  });
}
