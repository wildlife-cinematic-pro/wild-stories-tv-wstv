import { describe, expect, it } from "vitest";

import {
  getDefaultDirectWorkspace,
  resolveDirectWorkspaceTab,
} from "@/components/output-cards/workspaces/direct-workspace-utils";
import type { GeneratedPackage } from "@/types";

function pkg(overrides: Partial<GeneratedPackage>): GeneratedPackage {
  return {
    predatorName: "Lion",
    preyName: "Wildebeest",
    arcName: "Ambush attack",
    imagePrompt: "image",
    negativePrompt: "negative",
    thumbnailPrompt: "thumb",
    voiceoverLine: "voice",
    runwayShots: [],
    klingShots: [],
    seedanceShots: [],
    seedanceWorkflowGuide: "guide",
    shotImagePlan: [],
    motionStrength: 70,
    capCutPlan: "capcut",
    clipChaining: "chain",
    hook: "hook",
    caption: "caption",
    cta: "cta",
    hashtags: [],
    tags: [],
    tenIdeas: [],
    shotPlan: [],
    runwayBundle: "",
    klingBundle: "",
    ...overrides,
  };
}

describe("Direct workspace defaults", () => {
  it("defaults OutputCards direct workspace to Kling when Kling direct output exists", () => {
    expect(
      getDefaultDirectWorkspace(
        pkg({
          seedanceMultiShotPrompt: "seedance prompt",
          klingFramesPrompt: "kling frames prompt",
        })
      )
    ).toBe("kling15");
  });

  it("falls back to Seedance when Kling direct output is missing", () => {
    expect(getDefaultDirectWorkspace(pkg({ seedanceMultiShotPrompt: "seedance prompt" }))).toBe(
      "seedance"
    );
  });

  it("keeps a valid selected direct tab and otherwise prefers Kling before Seedance", () => {
    expect(
      resolveDirectWorkspaceTab({
        selected: "seedance",
        hasKlingDirect: true,
        hasSeedance: true,
      })
    ).toBe("seedance");

    expect(
      resolveDirectWorkspaceTab({
        selected: "kling15",
        hasKlingDirect: false,
        hasSeedance: true,
      })
    ).toBe("seedance");

    expect(
      resolveDirectWorkspaceTab({
        selected: "seedance",
        hasKlingDirect: true,
        hasSeedance: false,
      })
    ).toBe("kling15");

    expect(
      resolveDirectWorkspaceTab({
        selected: "kling15",
        hasKlingDirect: false,
        hasSeedance: false,
      })
    ).toBeNull();
  });
});
