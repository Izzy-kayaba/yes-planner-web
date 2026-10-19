import "server-only";

import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { genericOAuth } from "better-auth/plugins";
import { mongoClient, mongoDb } from "@/lib/mongodb";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/email";
import { mapInstagramProfile, type InstagramProfile } from "@/lib/auth/instagram";

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
  // Use the deployment's public host first so OAuth callbacks cannot inherit a stale URL.
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
  if (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PHASE !== "phase-production-build"
  ) {
    throw new Error("BETTER_AUTH_URL is required when the application runs in production.");
  }
  return "http://localhost:3000";
}

// Keep the deployment URL canonical while allowing browser requests from the live and staging hosts.
function getTrustedAuthOrigins() {
  return (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const instagramPlugin = genericOAuth({
  config: instagramConfigured
    ? [
        {
          providerId: "instagram",
          clientId: process.env.INSTAGRAM_CLIENT_ID!,
          clientSecret: process.env.INSTAGRAM_CLIENT_SECRET!,
          authorizationUrl: "https://www.instagram.com/oauth/authorize",
          tokenUrl: "https://api.instagram.com/oauth/access_token",
          scopes: ["instagram_business_basic"],
          pkce: false,
          getUserInfo: async (tokens) => {
            if (!tokens.accessToken) return null;
            const response = await fetch(
              `https://graph.instagram.com/me?fields=user_id,username&access_token=${encodeURIComponent(tokens.accessToken)}`,
            );
            if (!response.ok) return null;
            const profile = (await response.json()) as InstagramProfile;
            return mapInstagramProfile(profile);
          },
        },
      ]
    : [],
});

export const auth = betterAuth({
  appName: "Yes Planner",
  baseURL: getAuthBaseUrl(),
  trustedOrigins: getTrustedAuthOrigins(),
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
      // Wait for Resend before reporting success so password-reset failures are not hidden.
      await sendPasswordResetEmail(user.email, url);
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      // Use the same awaited delivery path as password reset and admin test email.
      await sendVerificationEmail(user.email, url);
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
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
        // Planner remains readable only so existing sessions can be migrated safely.
        type: ["SystemAdmin", "Couple", "Planner", "Venue", "Vendor", "Guest"],
        required: true,
        defaultValue: "Couple",
        input: false,
      },
      accountType: {
        type: ["Couple", "Venue", "Vendor", "Guest"],
        required: false,
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
