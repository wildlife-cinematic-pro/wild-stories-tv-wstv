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

  await expect(
    page.locator("button[aria-current=\"step\"]").filter({ hasText: "Wildlife Setup" })
  ).toBeVisible();
  await expect(page.getByText("Wildlife Focus", { exact: true })).toBeVisible();
  await expect(
    page
      .getByText(/Sign in to keep My Library synced across devices/i)
      .filter({ visible: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign In" })).toBeDisabled();
  await page.getByRole("button", { name: /Continue.*Engine & Quality/i }).click();

  await expect(
    page.locator("button[aria-current=\"step\"]").filter({ hasText: "Engine & Quality" })
  ).toBeVisible();
  await expect(page.getByText("Image Prompt Engine")).toBeVisible();
  await page.getByRole("button", { name: /Continue.*Generate/i }).click();

  await expect(
    page.locator("button[aria-current=\"step\"]").filter({ hasText: "Generate" })
  ).toBeVisible();
  await expect(page.getByText("Generate for Reels")).toBeVisible();
  await page.getByRole("button", { name: /Generate.*vs/i }).click();

  await expect(page.getByText("Generated Output")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("tablist", { name: /Output workspace navigation/i })).toBeVisible();
  await expect(page.getByRole("tab", { name: /Overview workspace/i })).toHaveAttribute(
    "aria-selected",
    "true"
  );

  await page.locator('[data-workspace-tab="advanced"]').click();
  await expect(page.getByRole("tab", { name: /Advanced workspace/i })).toHaveAttribute(
    "aria-selected",
    "true"
  );
  await expect(page.getByText(/Advanced workspace research/i)).toBeVisible();

  await page.locator('[data-workspace-tab="overview"]').click();
  const copyAllButton = page.getByRole("button", { name: /Copy (Full Package|All Output)/i });
  const copyAllHandle = await copyAllButton.elementHandle();
  expect(copyAllHandle).not.toBeNull();

  await copyAllHandle!.click();
  await expect
    .poll(() => copyAllHandle!.evaluate((button) => button.textContent ?? ""))
    .toMatch(/Copied/);

  await page.locator('[data-workspace-tab="evidence"]').click();
  await expect(page.getByTestId("real-generation-evidence-panel")).toBeVisible();
  await page.locator('input[data-evidence-slot="master-still"]').setInputFiles({
    name: "master-still.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4////fwAJ+wP9KobjigAAAABJRU5ErkJggg==",
      "base64"
    ),
  });
  await expect(page.getByTestId("real-generation-evidence-save-notice")).toHaveText(
    /Master Still attached to this evidence pass\./i
  );
  await expect(page.getByText(/master-still\.png/i)).toBeVisible();
  await page.getByLabel(/What looked strong\?/i).fill("Strong first frame and clean spacing.");
  await page.getByRole("button", { name: /Save Evidence Pass/i }).click();
  await expect(page.getByTestId("real-generation-evidence-save-notice")).toHaveText(
    /Evidence saved for this generation\./i
  );

  await page.locator('[data-workspace-tab="publishing"]').click();
  await expect(page.getByTestId("facebook-publish-readiness-panel")).toBeVisible();
  await expect(page.getByText(/Latest evidence call/i)).toBeVisible();

  await page.reload();

  await expect(page.getByTestId("last-generated-restore-notice")).toHaveText(
    /Restored your last generated output from this browser\./i
  );
  await expect(page.getByText("Generated Output", { exact: true })).toBeVisible();
  await page.locator('[data-workspace-tab="evidence"]').click();
  await expect(page.getByLabel(/What looked strong\?/i)).toHaveValue(
    /Strong first frame and clean spacing\./i
  );
  await expect(page.getByText(/master-still\.png/i)).toBeVisible();
  await page.locator('[data-workspace-tab="publishing"]').click();
  await expect(page.getByTestId("facebook-publish-readiness-panel")).toBeVisible();
  await expect(page.getByText(/Latest evidence call/i)).toBeVisible();
});
