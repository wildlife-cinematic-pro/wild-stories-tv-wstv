import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(__dirname, "..");

describe("output workspace accessibility source guards", () => {
  it("keeps semantic tab roles on the output workspace rail", () => {
    const outputCards = readFileSync(
      path.join(repoRoot, "components/OutputCards.tsx"),
      "utf8"
    );
    const sharedPanels = readFileSync(
      path.join(repoRoot, "components/output-cards/shared-panels.tsx"),
      "utf8"
    );

    expect(outputCards).toContain('role="tablist"');
    expect(sharedPanels).toContain('role="tab"');
    expect(sharedPanels).toContain('aria-selected={active}');
    expect(sharedPanels).toContain('aria-controls={panelId}');
  });

  it("keeps active step semantics and fast-publish essentials in source", () => {
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
    expect(fastPublishPanel).toContain('Daily copy-ready essentials');
    expect(fastPublishPanel).toContain('1. Master Image Prompt');
    expect(fastPublishPanel).toContain('5. Shot 4 Runway');
    expect(fastPublishPanel).toContain('7. 5 Hashtags');
    expect(promptsWorkspace).toContain('GPT Image 2 Backup Prompt');
  });
});
