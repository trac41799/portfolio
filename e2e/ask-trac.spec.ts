import { test, expect, type Page, type ConsoleMessage } from "@playwright/test";

let errors: string[] = [];

async function openPanel(page: Page) {
  await page.getByTestId("ask-trac-launcher").click();
  await expect(page.getByTestId("ask-trac-dialog")).toBeVisible();
}

async function ask(page: Page, text: string) {
  await page.getByTestId("ask-trac-input").fill(text);
  await page.getByTestId("ask-trac-send").click();
}

test.beforeAll(async ({ playwright }) => {
  // Warm the /api/chat route so Next's lazy dev compilation doesn't make the
  // first in-test request time out.
  const ctx = await playwright.request.newContext({
    baseURL: "http://localhost:3000",
  });
  try {
    await ctx.post("/api/chat", {
      data: { messages: [{ role: "user", content: "warmup" }] },
      timeout: 90_000,
    });
  } catch {
    // ignore — the real assertions live in the tests
  }
  await ctx.dispose();
});

test.beforeEach(async ({ page }) => {
  errors = [];
  page.on("console", (m: ConsoleMessage) => {
    if (m.type() === "error") errors.push(`console: ${m.text()}`);
  });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  await page.goto("/");
});

test.afterEach(() => {
  expect(errors, `unexpected browser errors:\n${errors.join("\n")}`).toHaveLength(0);
});

test("AC-E1: launcher opens the assistant dialog", async ({ page }) => {
  await openPanel(page);
  await expect(page.getByTestId("ask-trac-launcher")).toHaveAccessibleName(/ask about trac/i);
});

test("AC-E2: a factual question streams a reasoning trail and a grounded answer", async ({ page }) => {
  await openPanel(page);
  await ask(page, "What did he build at Edge8 AI?");
  await expect(page.getByTestId("reasoning-trail")).toBeVisible();
  const msg = page.getByTestId("assistant-message").first();
  await expect(msg).toContainText(/Edge8|Trac/i);
  // markdown is parsed (not shown as raw text): bold + list render as real elements
  await expect(msg.locator("strong").first()).toBeVisible();
  await expect(msg.locator(".md-content li").first()).toBeVisible();
  // the inline generative-UI (html-inline) card renders in its sandboxed host
  await expect(page.getByTestId("html-inline").first()).toBeVisible();
  // the raw fence language must never leak as visible text
  await expect(page.getByText("html-inline")).toHaveCount(0);
  await expect(page.getByText("```")).toHaveCount(0);
});

test("AC-E3: a comparison request renders a comparison component", async ({ page }) => {
  await openPanel(page);
  await ask(page, "Compare the LMS and Travel Buddy projects");
  await expect(page.getByTestId("ui-comparison")).toBeVisible();
});

test("AC-E4: an open-ended request renders a sandboxed artifact iframe", async ({ page }) => {
  await openPanel(page);
  await ask(page, "Design a one-page recruiter summary");
  const frame = page.getByTestId("artifact-frame");
  await expect(frame).toBeVisible();
  const sandbox = await frame.getAttribute("sandbox");
  expect(sandbox ?? "").not.toContain("allow-scripts");
  expect(sandbox ?? "").not.toContain("allow-same-origin");
});

test("AC-E5: clicking a follow-up chip streams a second answer", async ({ page }) => {
  await openPanel(page);
  await ask(page, "What did he build at Edge8 AI?");
  await expect(page.getByTestId("assistant-message")).toHaveCount(1);
  const chip = page.getByTestId("followup").first();
  await expect(chip).toBeVisible();
  await chip.click();
  await expect(page.getByTestId("assistant-message")).toHaveCount(2);
});

test("AC: seeded suggestions are offered before the first message", async ({ page }) => {
  await openPanel(page);
  await expect(page.getByTestId("suggestion")).toHaveCount(4);
});
