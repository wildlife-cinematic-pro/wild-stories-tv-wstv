import { expect, test } from "@playwright/test";

async function openWorkflowPresetLibrary(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: /Workflow Preset Library/i }).click();
}

test("preset panel local workflow saves, updates, defaults, exports, and creates a pack", async ({
  page,
}) => {
  await page.goto("/");
  await openWorkflowPresetLibrary(page);

  await expect(page.getByText("Saved Workflow Templates")).toBeVisible();
  await expect(
    page
      .getByText(/Sign in to keep My Library synced across devices/i)
      .filter({ visible: true })
  ).toBeVisible();

  const presetNameInput = page.getByLabel("Workflow preset name");
  await presetNameInput.fill("QA Local Preset");
  await page.getByRole("button", { name: "Save Current as Preset" }).click();
  await expect(page.getByTestId("workflow-preset-status")).toHaveText(
    "Saved QA Local Preset to My Library."
  );

  await presetNameInput.fill("QA Local Preset v2");
  await page.getByRole("button", { name: "Update Preset" }).click();
  await expect(page.getByTestId("workflow-preset-status")).toHaveText(
    "Updated QA Local Preset v2 in My Library."
  );

  await page.getByRole("button", { name: "Load Preset" }).click();
  await expect(page.getByTestId("workflow-preset-status")).toHaveText(
    "Loaded QA Local Preset v2 from My Library into the main workflow."
  );

  await page.getByRole("button", { name: "Set as Default" }).click();
  await expect(page.getByTestId("workflow-preset-status")).toHaveText(
    "Set QA Local Preset v2 as the default preset for My Library."
  );
  await expect(page.getByRole("button", { name: "Clear Default" })).toBeVisible();

  await page.getByRole("button", { name: "Export Preset" }).click();
  await expect(page.getByTestId("workflow-preset-status")).toHaveText(
    "Downloaded QA Local Preset v2 as portable JSON."
  );

  await page.getByRole("button", { name: "Select All" }).click();
  await page.getByLabel("Workflow preset pack name").fill("QA Team Pack");
  await page.getByRole("button", { name: "Create Pack from Selected Presets" }).click();
  await expect(page.getByText("Created QA Team Pack with 1 preset.")).toBeVisible();
});

test("signed-in preset panel shows cloud controls and can create a shared library", async ({
  page,
}) => {
  const now = "2026-04-23T00:00:00.000Z";
  const session = {
    user: {
      id: "user-qa",
      email: "owner@example.com",
      displayName: "Owner QA",
      createdAt: now,
    },
    issuedAt: now,
    expiresAt: "2026-05-23T00:00:00.000Z",
  };
  const personalLibrary = {
    id: "personal",
    scope: "personal",
    name: "My Library",
    description: "Personal cloud library backed by your signed-in account.",
    createdAt: now,
    updatedAt: now,
    role: "owner",
    canWrite: true,
    canManage: false,
    data: {
      schema: "wstv.workflow-preset-library",
      version: 2,
      source: "wild-stories-tv-wstv",
      libraryId: "personal_user-qa",
      updatedAt: now,
      presets: [],
      presetPacks: [],
    },
  };
  const sharedLibrary = {
    id: "library-field-team",
    scope: "shared",
    name: "Field Team Library",
    description: "QA shared presets",
    createdAt: now,
    updatedAt: now,
    role: "owner",
    canWrite: true,
    canManage: true,
    members: [
      {
        userId: "user-qa",
        email: "owner@example.com",
        role: "owner",
        addedAt: now,
      },
    ],
    data: {
      schema: "wstv.workflow-preset-library",
      version: 2,
      source: "wild-stories-tv-wstv",
      libraryId: "library-field-team",
      updatedAt: now,
      presets: [],
      presetPacks: [],
    },
  };

  await page.route("**/api/preset-library/session", async (route) => {
    const method = route.request().method();
    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          available: true,
          session,
          message: "Signed in as owner@example.com.",
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ available: true, session: null, message: "Signed out." }),
    });
  });

  await page.route("**/api/preset-library/shared", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        available: true,
        library: sharedLibrary,
        message: "Created shared library Field Team Library.",
      }),
    });
  });

  await page.route("**/api/preset-library", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        available: true,
        catalog: {
          personalLibrary,
          sharedLibraries: [],
        },
      }),
    });
  });

  await page.goto("/");
  await openWorkflowPresetLibrary(page);

  await expect(page.getByText("owner@example.com", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sync Now" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign Out" })).toBeVisible();
  await expect(page.getByText(/Shared libraries \(optional\)/i)).toBeVisible();

  await page.getByLabel("Shared library name").fill("Field Team Library");
  await page.getByLabel("Shared library description").fill("QA shared presets");
  await page.getByRole("button", { name: "New Shared Library" }).click();

  await expect(
    page.getByText("Created shared library Field Team Library. You are the owner.")
  ).toBeVisible();
  await expect(page.getByLabel("Preset library context")).toHaveValue(
    "library-field-team"
  );
  await expect(page.getByText("Field Team Library - owner access.")).toBeVisible();
  await expect(page.getByLabel("Shared library member email")).toBeVisible();
  await expect(page.getByLabel("Shared library member role")).toBeVisible();
});
