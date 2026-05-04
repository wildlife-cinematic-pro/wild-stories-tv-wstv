import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(__dirname, "..");

describe("output workspace accessibility source guards", () => {
  it("keeps semantic tab roles in the reusable workspace shell", () => {
    const workspaceSidebar = readFileSync(
      path.join(repoRoot, "components/workspace/WorkspaceSidebar.tsx"),
      "utf8"
    );
    const workspaceShell = readFileSync(
      path.join(repoRoot, "components/workspace/WorkspaceShell.tsx"),
      "utf8"
    );

    expect(workspaceSidebar).toContain('role="tablist"');
    expect(workspaceSidebar).toContain('role="tab"');
    expect(workspaceSidebar).toContain('aria-selected={active}');
    expect(workspaceSidebar).toContain('aria-controls={`workspace-panel-${item.id}`}');
    expect(workspaceShell).toContain('role="tabpanel"');
  });

  it("keeps active step semantics, fast-publish essentials, and header image nav source", () => {
    const appPage = readFileSync(path.join(repoRoot, "app/page.tsx"), "utf8");
    const fastPublishPanel = readFileSync(
      path.join(repoRoot, "components/output-cards/fast-publish-panel.tsx"),
      "utf8"
    );
    const promptsWorkspace = readFileSync(
      path.join(repoRoot, "components/output-cards/workspaces/PromptsWorkspace.tsx"),
      "utf8"
    );

    expect(appPage).toContain('aria-current={step === s.step ? "step" : undefined}');
    expect(appPage).toContain('aria-label="Build steps"');
    expect(appPage).toContain('href="/image"');
    expect(appPage).toContain('href="/storyboard"');
    expect(appPage.indexOf('href="/image"')).toBeLessThan(
      appPage.indexOf('href="/storyboard"')
    );
    expect(fastPublishPanel).toContain('Daily copy-ready essentials');
    expect(fastPublishPanel).toContain('1. Master Image Prompt');
    expect(fastPublishPanel).toContain('5. Shot 4 Runway');
    expect(fastPublishPanel).toContain('7. 5 Hashtags');
    expect(promptsWorkspace).toContain('GPT Image 2 Backup Prompt');
    expect(promptsWorkspace).toContain('Creator QA Pack');
    expect(promptsWorkspace).toContain('Copy Fix Prompt');
    expect(promptsWorkspace).toContain('Copy Caption');
  });
});
