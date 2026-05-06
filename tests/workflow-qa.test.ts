import { describe, expect, it } from "vitest";

import { buildWorkflowQaSummary } from "@/lib/workflow-qa";
import type { GeneratedPackage } from "@/types";

function makePackage(overrides: Partial<GeneratedPackage> = {}): GeneratedPackage {
  return {
    imagePrompt:
      "Grizzly Bear and Bison, full body, slow push-in, no blood, no gore, no visible wounds.",
    negativePrompt: "blood, gore, visible wounds",
    thumbnailPrompt: "Clean wildlife thumbnail",
    voiceoverLine: "Voice line",
    runwayShots: ["Slow push-in as the grizzly steps forward and the bison reacts."],
    klingShots: ["Handheld pressure beat as the grizzly surges and the bison pivots."],
    motionStrength: 70,
    capCutPlan: "CapCut plan",
    clipChaining: "HIGH",
    hook: "Hook",
    hook2026: ["Hook"],
    caption: "Grizzly Bear vs Bison in a raw documentary clash.",
    caption2026: "Long caption",
    cta: "CTA",
    hashtags: "#grizzly #bison #wildlife #documentary #reels",
    tenIdeas: [],
    shotPlan: [],
    runwayBundle: "Runway bundle",
    klingBundle: "Kling bundle",
    routingNote: "Hybrid route",
    ...overrides,
  };
}

describe("buildWorkflowQaSummary", () => {
  it("returns Ready when scene, prompt, and output all look strong", () => {
    const summary = buildWorkflowQaSummary({
      predator: "Grizzly Bear",
      prey: "Bison",
      arc: "Giant vs giant clash",
      contentLane: "Auto",
      habitat: "Auto",
      weather: "Golden Hour",
      depthMode: "Balanced Depth",
      cameraAnglePreset: "Front full-body",
      emotionalTone: "Raw Tension",
      animalVibe: "National Geographic Wild",
      finalEnvironment: "Yellowstone meadow with clean subject spacing",
      sceneDescription:
        "Slow push-in camera as the grizzly steps once and the bison braces in place with dry grass movement.",
      pkg: makePackage(),
    });

    expect(summary.status).toBe("Ready");
    expect(summary.items.every((item) => item.status === "pass")).toBe(true);
  });

  it("returns Needs review for mixed warnings", () => {
    const summary = buildWorkflowQaSummary({
      predator: "Wolf Pack",
      prey: "Bull Elk",
      arc: "Pack hunting strategy",
      contentLane: "Auto",
      habitat: "Forest Clearing",
      weather: "Overcast",
      depthMode: "Balanced Depth",
      cameraAnglePreset: "Front full-body",
      emotionalTone: "Raw Tension",
      animalVibe: "National Geographic Wild",
      finalEnvironment: "forest clearing",
      sceneDescription:
        "The wolves move toward the elk while the camera follows the action.",
      pkg: makePackage({
        predatorName: "Wolf Pack",
        preyName: "Bull Elk",
        caption: "",
        hashtags: "",
      }),
    });

    expect(summary.status).toBe("Needs review");
    expect(summary.items.some((item) => item.status === "warning")).toBe(true);
  });

  it("returns Risky when generated output is seriously incomplete", () => {
    const summary = buildWorkflowQaSummary({
      predator: "Crocodile",
      prey: "Warthog",
      arc: "Ambush attack",
      contentLane: "Fishing Strike",
      habitat: "Auto",
      weather: "Golden Hour",
      depthMode: "Balanced Depth",
      cameraAnglePreset: "Front full-body",
      emotionalTone: "Raw Tension",
      animalVibe: "National Geographic Wild",
      finalEnvironment: "",
      sceneDescription: "Avoid multiple beats and do not cut to another shot.",
      pkg: makePackage({
        runwayShots: [],
        klingShots: [],
        caption: "",
        hashtags: "",
        imagePrompt: "Crocodile and Warthog only.",
        negativePrompt: "",
      }),
    });

    expect(summary.status).toBe("Risky");
    expect(summary.items.some((item) => item.status === "fail")).toBe(true);
  });

  it("limits top fixes to 3 items", () => {
    const summary = buildWorkflowQaSummary({
      predator: "Golden Eagle",
      prey: "Rabbit",
      arc: "Near-clash",
      contentLane: "Auto",
      habitat: "Forest Clearing",
      weather: "Noon",
      depthMode: "Flat",
      cameraAnglePreset: "Wide",
      emotionalTone: "Neutral",
      animalVibe: "Neutral",
      finalEnvironment: "",
      sceneDescription: "Do not cut to shot 2 without any camera cue.",
      pkg: makePackage({
        runwayShots: [],
        klingShots: [],
        caption: "",
        hashtags: "",
        negativePrompt: "",
      }),
    });

    expect(summary.topFixes.length).toBeLessThanOrEqual(3);
  });
});
