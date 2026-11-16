import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { rateLimit, rateLimitResponse } from "@/lib/security/request";

// Better Auth handles its sign-in, sign-out, verification, and OAuth callback endpoints here.
const handler = toNextJsHandler(auth);

export async function GET(request: Request) {
  const limit = rateLimit(request, "auth-get", { limit: 120, windowMs: 60_000 });
  return limit.allowed ? handler.GET(request) : rateLimitResponse(limit.retryAfterSeconds);
}

export async function POST(request: Request) {
  const limit = rateLimit(request, "auth-post", { limit: 30, windowMs: 60_000 });
  return limit.allowed ? handler.POST(request) : rateLimitResponse(limit.retryAfterSeconds);
}
