import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

// Better Auth handles its sign-in, sign-out, verification, and OAuth callback endpoints here.
export const { GET, POST } = toNextJsHandler(auth);
