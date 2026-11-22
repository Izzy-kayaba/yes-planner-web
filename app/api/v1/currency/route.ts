import { NextResponse } from "next/server";
import { appendZaPath, detectCountry } from "@/lib/country";
import { currencyForCountry } from "@/lib/currency";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const country = detectCountry(request);
  return NextResponse.json(
    {
      country: country || null,
      currency: currencyForCountry(country),
      southAfrican: country === "ZA",
      regionalPath: appendZaPath("/", country),
    },
    { headers: { "Cache-Control": "private, max-age=3600" } },
  );
}
