import { expect, test } from "@playwright/test";

test("main header keeps Build / Workflows / Image / Storyboard and routes load", async ({ page }) => {
  await page.goto("/");

  const headerNav = page.locator("header nav").first();
  await expect(headerNav).toContainText("Build");
  await expect(headerNav).toContainText("Workflows");
  await expect(headerNav).toContainText("Image");
  await expect(headerNav).toContainText("Storyboard");

  const headerText = ((await headerNav.textContent()) ?? "").replace(/\s+/g, " ").trim();
  expect(headerText).toContain("Build");
  expect(headerText.indexOf("Build")).toBeLessThan(headerText.indexOf("Workflows"));
  expect(headerText.indexOf("Workflows")).toBeLessThan(headerText.indexOf("Image"));
  expect(headerText.indexOf("Image")).toBeLessThan(headerText.indexOf("Storyboard"));

  await page.goto("/image");
  await expect(page.getByText("World Scenic Wildlife Image Studio")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Nano Banana 2 prompt" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "GPT Image 2 prompt" })).toBeVisible();

  await page.goto("/storyboard");
  await expect(page.getByText("Storyboard").first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Back to Build/i })).toBeVisible();
});
