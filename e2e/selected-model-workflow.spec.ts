import { expect, test, type Page } from "@playwright/test";

async function openFreshBuild(page: Page) {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
  await expect(
    page.locator('button[aria-current="step"]').filter({ hasText: "Wildlife Setup" })
  ).toBeVisible();
}

async function goToEngineQuality(page: Page) {
  await page.getByRole("button", { name: /Continue.*Engine & Quality/i }).click();
  await expect(
    page.locator('button[aria-current="step"]').filter({ hasText: "Engine & Quality" })
  ).toBeVisible();
  await expect(page.getByText("Model Profile", { exact: true })).toBeVisible();
}

async function selectVideoModel(page: Page, modelId: string) {
  const card = page.getByTestId(`video-model-card-${modelId}`);
  await expect(card).toBeVisible();
  await card.click();
  await expect(card).toContainText("✓ Selected");
  return card;
}

async function generateOutput(page: Page) {
  await page.getByRole("button", { name: /Continue.*Generate/i }).click();
  await expect(
    page.locator('button[aria-current="step"]').filter({ hasText: "Generate" })
  ).toBeVisible();
  await page.getByRole("button", { name: /Generate.*vs/i }).click();
  await expect(page.getByText("Generated Output", { exact: true })).toBeVisible({
    timeout: 30_000,
  });
}

test("selected video model cards can be selected from Step 2", async ({ page }) => {
  await openFreshBuild(page);
  await goToEngineQuality(page);

  await expect(page.getByText("Recommended for this scene", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Auto-select best model for scene: OFF/i })
  ).toBeVisible();

  await selectVideoModel(page, "seedance-2");
  await selectVideoModel(page, "kling-03-4k");
  const alephCard = await selectVideoModel(page, "runway-aleph");

  await expect(alephCard).toContainText("Aleph");
  await expect(page.getByText(/edit\/manipulate existing footage only/i)).toBeVisible();
});

test("generated Video workspace shows selected-model workflow panels with Hybrid protected", async ({
  page,
}) => {
  await openFreshBuild(page);
  await goToEngineQuality(page);
  await selectVideoModel(page, "runway-aleph");
  await generateOutput(page);

  await page.locator('[data-workspace-tab="video"]').click();
  await expect(page.getByRole("tab", { name: /Video workspace/i })).toHaveAttribute(
    "aria-selected",
    "true"
  );

  const primaryRoute = page.getByTestId("video-primary-route-panel");
  await expect(primaryRoute).toBeVisible();
  await expect(primaryRoute).toContainText("Primary Route: Hybrid 4-shot");
  await expect(primaryRoute).toContainText("Aleph");
  await expect(primaryRoute).toContainText(/Source footage required/i);

  await expect(page.getByText("Model-specific prompt guidance", { exact: true })).toBeVisible();
  await expect(page.getByText("Production Checklist", { exact: true })).toBeVisible();

  const workflowQa = page.getByTestId("workflow-qa-card");
  await expect(workflowQa).toBeVisible();
  await expect(workflowQa).toContainText("Workflow QA");
  await expect(workflowQa).toContainText("Hybrid is primary; selected model remains guidance.");

  const productionPack = page.getByTestId("production-pack-export-card");
  await expect(productionPack).toBeVisible();
  await expect(productionPack).toContainText("Production Pack Export");

  await expect(productionPack.getByRole("button", { name: "Copy Production Pack" })).toBeVisible();
  await expect(productionPack.getByRole("button", { name: "Copy Short Pack" })).toBeVisible();
  await expect(productionPack.getByRole("button", { name: "Copy Full Pack" })).toBeVisible();
});
