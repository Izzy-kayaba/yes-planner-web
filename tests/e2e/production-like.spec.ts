import { expect, test } from "@playwright/test";

test("registration and password login complete in the production build", async ({ page }) => {
  await page.goto("/register");
  await expect(page.locator("#auth-email")).toBeVisible();
  await page.locator("#auth-first-name").fill("Browser");
  await page.locator("#auth-last-name").fill("Test");
  await page.locator("#auth-email").fill(`browser-${Date.now()}@example.test`);
  await page.locator("#auth-phone-number").fill("821234567");
  await page.locator("#auth-password").fill("BrowserTest123!");
  await page.getByRole("button", { name: /create my workspace/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/login");
  await page.locator("#auth-email").fill("browser@example.test");
  await page.locator("#auth-password").fill("BrowserTest123!");
  await page.getByRole("button", { name: /continue/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("guest, table and meal setup persists across workspace navigation", async ({ page }) => {
  await page.goto("/weddings/ruth-izzy/food-drinks");
  await page.getByRole("button", { name: /add meal option/i }).click();
  await page.getByLabel("Meal option name").fill("Browser tasting menu");
  await page.getByLabel("Starter").fill("Garden salad");
  await page.getByLabel("Main course").fill("Roast vegetables");
  await page.getByLabel("Dessert").fill("Lemon tart");
  await page.getByRole("button", { name: /save changes/i }).click();
  await expect(page.getByRole("heading", { name: "Browser tasting menu" })).toBeVisible();

  await page.goto("/weddings/ruth-izzy/seating");
  await page.getByRole("button", { name: /add table/i }).click();
  await page.getByLabel("Table name").fill("Browser family table");
  await page.getByLabel("Capacity").fill("8");
  await page.getByRole("button", { name: /save changes/i }).click();
  await expect(page.getByRole("heading", { name: "Browser family table" })).toBeVisible();

  await page.goto("/weddings/ruth-izzy/guests");
  await page.getByRole("button", { name: /add guest/i }).click();
  await page.getByLabel("Guest name").fill("Browser Guest");
  await page.locator("#phoneNumber").fill("821234568");
  await page.locator("#email").fill("browser-guest@example.test");
  await page.getByRole("button", { name: "Group" }).click();
  await page.getByRole("option", { name: "Friends" }).click();
  await page.getByRole("button", { name: "RSVP", exact: true }).click();
  await page.getByRole("option", { name: "Pending" }).click();
  await page.getByRole("button", { name: "Meal preference" }).click();
  await page.getByRole("option", { name: "Browser tasting menu" }).click();
  await page.getByRole("button", { name: "Table" }).click();
  await page.getByRole("option", { name: "Browser family table" }).click();
  await page.getByRole("button", { name: /save changes/i }).click();
  await expect(page.getByText("Browser Guest")).toBeVisible();
});

test("marketplace search, language, theme and mobile navigation work", async ({ page }) => {
  await page.goto("/marketplace");
  await page.getByPlaceholder(/search photographers/i).fill("Lumen");
  await page.getByRole("button", { name: /search vendors/i }).click();
  await expect(page.getByRole("heading", { name: "Lumen & Lace" })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
  await page.getByRole("complementary").getByRole("button", { name: "Close navigation" }).click();
  await page.getByRole("button", { name: "Use dark theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Preferred language" }).click();
  await page.getByRole("option", { name: "FR" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.getByText("Tableau de bord", { exact: true })).toBeVisible();
});

test("document upload and deletion work in the browser", async ({ page }) => {
  await page.goto("/weddings/ruth-izzy/documents");
  const name = `browser-upload-${Date.now()}.txt`;
  await page.locator("#document-upload").setInputFiles({
    name,
    mimeType: "text/plain",
    buffer: Buffer.from("Browser test document"),
  });
  await expect(page.getByText(name)).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: `Delete ${name}` }).click();
  await expect(page.getByText(name)).toHaveCount(0);
});

test("public metadata and robots rules are present", async ({ page, request }) => {
  await page.goto("/register");
  await expect(page).toHaveTitle(/\S+/);
  const response = await request.get("/robots.txt");
  expect(response.ok()).toBeTruthy();
  const robots = await response.text();
  expect(robots).toContain("Disallow: /admin/");
  expect(robots).toContain("Disallow: /weddings/");
  expect(robots).toContain("Sitemap:");
});

test.describe("staging-only workflows", () => {
  const coupleEmail = process.env.E2E_COUPLE_EMAIL;
  const couplePassword = process.env.E2E_COUPLE_PASSWORD;
  const allowMutations = process.env.E2E_ALLOW_MUTATIONS === "true";

  test("couple login and onboarding are reachable", async ({ page }) => {
    test.skip(!process.env.E2E_BASE_URL || !coupleEmail || !couplePassword);
    await page.goto("/login");
    await page.locator("#auth-email").fill(coupleEmail!);
    await page.locator("#auth-password").fill(couplePassword!);
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto("/onboarding");
    await expect(
      page.getByRole("heading", { name: /personalise your workspace|wedding details/i }),
    ).toBeVisible();
  });

  test("staging deployment health endpoint is healthy", async ({ request }) => {
    test.skip(!process.env.E2E_BASE_URL, "Requires a configured staging deployment URL.");
    const response = await request.get("/api/health");
    expect(response.ok()).toBeTruthy();
    expect(await response.json()).toEqual({ status: "healthy" });
  });

  test("vendor discovery and request submission are available", async ({ page }) => {
    test.skip(
      !allowMutations ||
        !process.env.E2E_BASE_URL ||
        !coupleEmail ||
        !couplePassword ||
        !process.env.E2E_VENDOR_ID,
      "Requires a dedicated staging couple account, test vendor and explicit mutation approval.",
    );
    await page.goto("/login");
    await page.locator("#auth-email").fill(coupleEmail!);
    await page.locator("#auth-password").fill(couplePassword!);
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto(`/marketplace/${encodeURIComponent(process.env.E2E_VENDOR_ID!)}`);
    await expect(page.getByRole("heading", { name: "Send a request" })).toBeVisible();
    await page.getByRole("button", { name: "Service" }).click();
    await page.getByRole("option").first().click();
    await page.locator("#vendor-request-message").fill("Production browser test request.");
    await page.getByRole("button", { name: /send request/i }).click();
    await expect(page.getByText("Request sent to vendor.")).toBeVisible();
  });

  test("uploaded document records can be deleted", async ({ page }) => {
    test.skip(
      !allowMutations ||
        !process.env.E2E_BASE_URL ||
        !coupleEmail ||
        !couplePassword ||
        !process.env.E2E_WEDDING_ID,
      "Requires a dedicated staging account, test wedding and explicit mutation approval.",
    );
    await page.goto("/login");
    await page.locator("#auth-email").fill(coupleEmail!);
    await page.locator("#auth-password").fill(couplePassword!);
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    const name = `browser-upload-${Date.now()}.txt`;
    await page.goto(`/weddings/${encodeURIComponent(process.env.E2E_WEDDING_ID!)}/documents`);
    await page.locator("#document-upload").setInputFiles({
      name,
      mimeType: "text/plain",
      buffer: Buffer.from("Browser test document"),
    });
    await expect(page.getByText(name)).toBeVisible();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: `Delete ${name}` }).click();
    await expect(page.getByText(name)).toHaveCount(0);
  });

  test("messaging can be exercised with an accepted staging conversation", async ({ page }) => {
    test.skip(
      !allowMutations || !process.env.E2E_BASE_URL || !coupleEmail || !couplePassword,
      "Requires a dedicated staging account and explicit mutation approval.",
    );
    await page.goto("/login");
    await page.locator("#auth-email").fill(coupleEmail!);
    await page.locator("#auth-password").fill(couplePassword!);
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto("/messages");
    const composer = page.getByRole("textbox", { name: "Message" });
    if (!(await composer.isVisible().catch(() => false))) {
      test.skip(true, "This staging account has no accepted vendor conversation.");
    }
    await composer.fill("Production browser test message.");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText("Production browser test message.")).toBeVisible();
  });
});
