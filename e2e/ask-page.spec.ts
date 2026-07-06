import { test, expect, type Page, type ConsoleMessage } from "@playwright/test";

let errors: string[] = [];

async function ask(page: Page, text: string) {
  await page.getByTestId("ask-trac-input").fill(text);
  await page.getByTestId("ask-trac-send").click();
}

test.beforeAll(async ({ playwright }) => {
  const ctx = await playwright.request.newContext({
    baseURL: "http://localhost:3000",
  });
  try {
    await ctx.post("/api/chat", {
      data: { messages: [{ role: "user", content: "warmup" }] },
      timeout: 90_000,
    });
  } catch {
    // ignore
  }
  await ctx.dispose();
});

test.beforeEach(async ({ page }) => {
  errors = [];
  page.on("console", (m: ConsoleMessage) => {
    if (m.type() === "error") errors.push(`console: ${m.text()}`);
  });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
});

test.afterEach(() => {
  expect(errors, `unexpected browser errors:\n${errors.join("\n")}`).toHaveLength(0);
});

test("nav links from home to the dedicated /ask page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation").getByRole("link", { name: "Ask" }).click();
  await expect(page).toHaveURL(/\/ask$/);
  await expect(
    page.getByRole("heading", { name: /ask me anything about trac/i }),
  ).toBeVisible();
});

test("chatbot-first empty state offers suggestions and hides the floating widget", async ({ page }) => {
  await page.goto("/ask");
  await expect(page.getByTestId("ask-page")).toBeVisible();
  await expect(page.getByTestId("suggestion")).toHaveCount(4);
  // the floating launcher is suppressed on the dedicated page
  await expect(page.getByTestId("ask-trac-launcher")).toHaveCount(0);
});

test("renders a rich markdown answer with an inline html card on the page", async ({ page }) => {
  await page.goto("/ask");
  await ask(page, "What did he build at Edge8 AI?");
  const msg = page.getByTestId("assistant-message").first();
  await expect(msg).toContainText(/Edge8|Trac/i);
  await expect(msg.locator("strong").first()).toBeVisible();
  await expect(msg.locator(".md-content li").first()).toBeVisible();
  await expect(page.getByTestId("html-inline").first()).toBeVisible();
});

test("renders a pre-templated component on the page", async ({ page }) => {
  await page.goto("/ask");
  await ask(page, "Compare the LMS and Travel Buddy projects");
  await expect(page.getByTestId("ui-comparison")).toBeVisible();
});

test("renders a sandboxed generated-HTML artifact on the page", async ({ page }) => {
  await page.goto("/ask");
  await ask(page, "Design a one-page recruiter summary");
  const frame = page.getByTestId("artifact-frame");
  await expect(frame).toBeVisible();
  const sandbox = (await frame.getAttribute("sandbox")) ?? "";
  expect(sandbox).not.toContain("allow-scripts");
  expect(sandbox).not.toContain("allow-same-origin");
});
