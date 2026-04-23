import { expect, test } from "@playwright/test";

test("main build flow generates output, keeps workspace tabs reachable, and shows copy feedback", async ({
  page,
  context,
  baseURL,
}) => {
  if (baseURL) {
    await context.grantPermissions(["clipboard-read", "clipboard-write"], {
      origin: baseURL,
    });
  }

  await page.goto("/");

  await expect(page.getByText("Wildlife Focus")).toBeVisible();
  await expect(
    page
      .getByText(/Sign in to keep My Library synced across devices/i)
      .filter({ visible: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign In" })).toBeDisabled();
  await page.getByRole("button", { name: /Continue.*Engine & Quality/i }).click();

  await expect(page.getByText("Image Prompt Engine")).toBeVisible();
  await page.getByRole("button", { name: /Continue.*Generate/i }).click();

  await expect(page.getByText("Generate for Reels")).toBeVisible();
  await page.getByRole("button", { name: /Generate.*vs/i }).click();

  await expect(page.getByText("Generated Output")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('[data-workspace-tab="overview"]')).toBeVisible();

  await page.locator('[data-workspace-tab="advanced"]').click();
  await expect(page.getByText(/Advanced workspace research/i)).toBeVisible();

  await page.locator('[data-workspace-tab="overview"]').click();
  const copyAllButton = page.getByRole("button", { name: /Copy All Packs/i });
  const copyAllHandle = await copyAllButton.elementHandle();
  expect(copyAllHandle).not.toBeNull();

  await copyAllHandle!.click();
  await expect
    .poll(() => copyAllHandle!.evaluate((button) => button.textContent ?? ""))
    .toMatch(/Copied/);

  await page.reload();

  await expect(page.getByTestId("last-generated-restore-notice")).toHaveText(
    /Restored your last generated output from this browser\./i
  );
  await expect(page.getByText("Generated Output", { exact: true })).toBeVisible();
  await expect(page.locator('[data-workspace-tab="overview"]')).toBeVisible();
});
