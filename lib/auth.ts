import "server-only";

import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { genericOAuth } from "better-auth/plugins";
import { after } from "next/server";
import { mongoClient, mongoDb } from "@/lib/mongodb";
import { sendPasswordResetEmail } from "@/lib/email";

const googleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const instagramConfigured = Boolean(
  process.env.INSTAGRAM_CLIENT_ID && process.env.INSTAGRAM_CLIENT_SECRET,
);
const mongoTransactionsEnabled =
  process.env.MONGODB_USE_TRANSACTIONS === undefined
    ? process.env.NODE_ENV === "production"
    : process.env.MONGODB_USE_TRANSACTIONS === "true";

function getAuthSecret() {
  if (process.env.BETTER_AUTH_SECRET) return process.env.BETTER_AUTH_SECRET;
  if (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PHASE !== "phase-production-build"
  ) {
    throw new Error("BETTER_AUTH_SECRET is required when the application runs in production.");
  }
  return "yes-planner-development-secret-change-before-production";
}

function getAuthBaseUrl() {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
  if (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PHASE !== "phase-production-build"
  ) {
    throw new Error("BETTER_AUTH_URL is required when the application runs in production.");
  }
  return "http://localhost:3000";
}

const instagramPlugin = genericOAuth({
  config: instagramConfigured
    ? [
        {
          providerId: "instagram",
          clientId: process.env.INSTAGRAM_CLIENT_ID!,
          clientSecret: process.env.INSTAGRAM_CLIENT_SECRET!,
          authorizationUrl: "https://api.instagram.com/oauth/authorize",
          tokenUrl: "https://api.instagram.com/oauth/access_token",
          scopes: ["user_profile", "user_media"],
          pkce: false,
          getUserInfo: async (tokens) => {
            if (!tokens.accessToken) return null;
            const response = await fetch(
              `https://graph.instagram.com/me?fields=id,username&access_token=${encodeURIComponent(tokens.accessToken)}`,
            );
            if (!response.ok) return null;
            const profile = (await response.json()) as { id?: string; username?: string };
            if (!profile.id) return null;
            const username = profile.username?.trim() || `instagram-${profile.id}`;
            return {
              id: profile.id,
              name: username,
              email: `${profile.id}@instagram.yesplanner.invalid`,
              emailVerified: false,
            };
          },
        },
      ]
    : [],
});

export const auth = betterAuth({
  appName: "Yes Planner",
  baseURL: getAuthBaseUrl(),
  secret: getAuthSecret(),
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
  },
  database: mongodbAdapter(mongoDb, {
    client: mongoClient,
    // A standalone local MongoDB server cannot run multi-document transactions.
    transaction: mongoTransactionsEnabled,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    resetPasswordTokenExpiresIn: 3_600,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      after(() => sendPasswordResetEmail(user.email, url));
    },
  },
  socialProviders: googleConfigured
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
      }
    : {},
  user: {
    additionalFields: {
      role: {
        type: ["SystemAdmin", "Couple", "Planner", "Vendor", "Guest"],
        required: true,
        defaultValue: "Couple",
        input: false,
      },
      firstName: { type: "string", required: false, input: false },
      lastName: { type: "string", required: false, input: false },
      phoneNumber: { type: "string", required: false, input: false },
    },
  },
  advanced: { database: { joins: true } },
  plugins: [instagramPlugin],
});

export type AuthSession = typeof auth.$Infer.Session;
