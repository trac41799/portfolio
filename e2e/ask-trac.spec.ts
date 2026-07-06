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
  await expect(page.getByTestId("assistant-message").first()).toContainText(/Edge8|Trac/i);
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
