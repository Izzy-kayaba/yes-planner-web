import { NextResponse, type NextRequest } from "next/server";
import { detectCountry, normalizeCountry } from "@/lib/country";

// Keep the regional country code in the visible URL while the existing app routes serve the page.
export function proxy(request: NextRequest) {
  if (
    request.nextUrl.hostname === "yes-planner.com" &&
    (request.method === "GET" || request.method === "HEAD")
  ) {
    const canonicalUrl = request.nextUrl.clone();
    canonicalUrl.hostname = "www.yes-planner.com";
    return NextResponse.redirect(canonicalUrl, 308);
  }

  const pathname = request.nextUrl.pathname;
  if (shouldSkipRegionalRouting(pathname)) return NextResponse.next();

  const country = normalizeCountry(detectCountry(request));
  const regionalPrefix = /^[A-Z]{2}$/.test(country) ? `/${country.toLowerCase()}` : null;
  const hasRegionalPrefix = /^\/[a-z]{2}(?:\/|$)/.test(pathname);

  // A detected visitor gets a stable country URL for public and authenticated pages.
  if (
    regionalPrefix &&
    !hasRegionalPrefix &&
    (request.method === "GET" || request.method === "HEAD")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = `${regionalPrefix}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  if (!hasRegionalPrefix) return NextResponse.next();

  // Rewrite internally so /<country>/dashboard resolves to the existing /dashboard page.
  const url = request.nextUrl.clone();
  const regionalCode = pathname.slice(1, 3);
  url.pathname = pathname.length === 3 ? "/" : pathname.slice(3);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-country-code", regionalCode.toUpperCase());
  return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
}

function shouldSkipRegionalRouting(pathname: string) {
  return (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/assets/") ||
    pathname === "/favicon.ico" ||
    /\.[^/]+$/.test(pathname)
  );
}

export const config = {
  matcher: ["/((?!api|_next|assets).*)"],
};
