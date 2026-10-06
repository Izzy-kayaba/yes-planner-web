export const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
);

export const siteDescription =
  "Plan your wedding, connect with trusted vendors and coordinate every detail in one elegant workspace.";
