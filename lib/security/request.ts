import { NextResponse, type NextRequest } from "next/server";

type RateEntry = { count: number; resetAt: number };
const buckets = new Map<string, RateEntry>();

export function clientAddress(request: Request) {
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim() ??
    "unknown"
  );
}

export function rateLimit(request: Request, key: string, options: { limit: number; windowMs: number }) {
  const now = Date.now();
  const bucketKey = `${key}:${clientAddress(request)}`;
  const existing = buckets.get(bucketKey);
  const entry = !existing || existing.resetAt <= now
    ? { count: 0, resetAt: now + options.windowMs }
    : existing;
  entry.count += 1;
  buckets.set(bucketKey, entry);
  if (buckets.size > 10_000) {
    for (const [storedKey, stored] of buckets) if (stored.resetAt <= now) buckets.delete(storedKey);
  }
  return {
    allowed: entry.count <= options.limit,
    retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
  };
}

export function rateLimitResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { message: "Too many requests. Please try again later." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}

export function sameOriginMutation(request: NextRequest) {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) return true;
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}