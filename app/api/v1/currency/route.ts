import { NextResponse } from "next/server";

export const runtime = "nodejs";

function detectedCountry(request: Request) {
  if (process.env.NODE_ENV !== "production" && process.env.DEVELOPMENT_COUNTRY) {
    const configuredCountry = process.env.DEVELOPMENT_COUNTRY.toUpperCase();
    return configuredCountry === "SA" ? "ZA" : configuredCountry;
  }
  const headerCountry = (
    request.headers.get("x-vercel-ip-country") ??
    request.headers.get("cf-ipcountry") ??
    request.headers.get("x-country-code") ??
    ""
  ).toUpperCase();
  if (headerCountry) return headerCountry === "SA" ? "ZA" : headerCountry;

  // Localhost has no IP-country header. Browser hints are sufficient here
  // because location only controls whether the optional ZAR display is shown.
  const locale = request.headers.get("x-yes-locale")?.toUpperCase() ?? "";
  const timeZone = request.headers.get("x-yes-time-zone") ?? "";
  return locale.endsWith("-ZA") || timeZone === "Africa/Johannesburg" ? "ZA" : "";
}

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
  const southAfrican = detectedCountry(request) === "ZA";
  if (!southAfrican) {
    return NextResponse.json({
      country: detectedCountry(request) || null,
      southAfrican: false,
      usdToZarRate: null,
    });
  }
  const rate = await usdToZarRate().catch(() => null);
  return NextResponse.json(
    { country: "ZA", southAfrican: true, usdToZarRate: rate },
    { headers: { "Cache-Control": "private, max-age=3600" } },
  );
}
