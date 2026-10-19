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
  const regionalPrefix = country === "ZA" ? "/za" : null;
  const hasRegionalPrefix = pathname === "/za" || pathname.startsWith("/za/");

  // A detected South African visitor gets a stable regional URL for public and authenticated pages.
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

  // Rewrite internally so /za/dashboard resolves to the existing /dashboard page without duplicating routes.
  const url = request.nextUrl.clone();
  url.pathname = pathname === "/za" ? "/" : pathname.slice("/za".length);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-country-code", "ZA");
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
