const configuredSiteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
);

// Use the www host as the single public identity when either production alias is configured.
if (configuredSiteUrl.hostname === "yes-planner.com") {
  configuredSiteUrl.hostname = "www.yes-planner.com";
}

export const siteUrl = configuredSiteUrl;

export const siteDescription =
  "Plan your wedding, connect with trusted vendors and coordinate every detail in one elegant workspace.";
