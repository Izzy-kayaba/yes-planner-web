import { NextResponse } from "next/server";
import { appendZaPath, detectCountry } from "@/lib/country";

export const runtime = "nodejs";

// Cache the external rate briefly so a page with many prices makes one provider request.
async function usdToZarRate() {
  const response = await fetch("https://api.frankfurter.dev/v2/rate/usd/zar", {
    next: { revalidate: 21_600 },
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) throw new Error("Exchange-rate provider request failed.");
  const result = (await response.json()) as { rate?: number };
  return typeof result.rate === "number" && result.rate > 0 ? result.rate : null;
}

export async function GET(request: Request) {
  const country = detectCountry(request);
  const southAfrican = country === "ZA";
  if (!southAfrican) {
    return NextResponse.json({
      country: country || null,
      southAfrican: false,
      usdToZarRate: null,
      regionalPath: appendZaPath("/", country),
    });
  }
  const rate = await usdToZarRate().catch(() => null);
  return NextResponse.json(
    { country: "ZA", southAfrican: true, usdToZarRate: rate, regionalPath: "/za" },
    { headers: { "Cache-Control": "private, max-age=3600" } },
  );
}
