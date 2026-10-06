export function normalizeCountry(country: string | null | undefined) {
  const normalized = country?.trim().toUpperCase() ?? "";
  return normalized === "SA" ? "ZA" : normalized;
}

export function detectCountry(request: Request) {
  if (process.env.NODE_ENV !== "production" && process.env.DEVELOPMENT_COUNTRY) {
    return normalizeCountry(process.env.DEVELOPMENT_COUNTRY);
  }
  const headerCountry = normalizeCountry(
    request.headers.get("x-vercel-ip-country") ??
      request.headers.get("cf-ipcountry") ??
      request.headers.get("x-country-code"),
  );
  if (headerCountry) return headerCountry;
  const locale = request.headers.get("x-yes-locale")?.toUpperCase() ?? "";
  const timeZone = request.headers.get("x-yes-time-zone") ?? "";
  return locale.endsWith("-ZA") || timeZone === "Africa/Johannesburg" ? "ZA" : "";
}

export function appendZaPath(pathname: string, country: string | null | undefined) {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (normalizeCountry(country) !== "ZA" || path === "/za" || path.startsWith("/za/")) return path;
  return path === "/" ? "/za" : `/za${path}`;
}
