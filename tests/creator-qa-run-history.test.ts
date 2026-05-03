import { describe, expect, it } from "vitest";

import {
  appendCreatorQaRun,
  buildCreatorQaRun,
  MAX_CREATOR_QA_RUNS,
  type CreatorQaRun,
} from "@/lib/creator-qa-run-history";
import type { GeneratedPackage } from "@/types";

function makePackage(overrides: Partial<GeneratedPackage> = {}): GeneratedPackage {
  return {
    imagePrompt:
      "Crocodile and Warthog, slow push-in, waterline tension, no blood, no gore, no visible wounds.",
    negativePrompt: "blood, gore, visible wounds",
    thumbnailPrompt: "Clean wildlife thumbnail",
    voiceoverLine: "Voice line",
    runwayShots: [
      "Slow push-in as the crocodile surges once and the warthog recoils toward open ground.",
    ],
    klingShots: [
      "Handheld pressure beat as the crocodile bursts forward and the warthog breaks toward cover.",
    ],
    seedanceShots: ["Balanced documentary motion handoff."],
    motionStrength: 70,
    capCutPlan: "CapCut plan",
    clipChaining: "HIGH",
    hook: "Hook",
    hook2026: ["Hook"],
    caption: "Crocodile vs Warthog in a raw documentary ambush.",
    caption2026: "Long caption",
    cta: "CTA",
    hashtags: "#crocodile #warthog #wildlife #documentary #reels",
    tenIdeas: [],
    shotPlan: [],
    runwayBundle: "Runway bundle",
    klingBundle: "Kling bundle",
    routingNote: "Hybrid route",
    generationId: "gen-1",
    generatedAt: "2026-05-04T10:00:00.000Z",
    predatorName: "Crocodile",
    preyName: "Warthog",
    ...overrides,
  };
}

describe("creator QA run history", () => {
  it("builds a compact run summary from the current workflow", () => {
    const run = buildCreatorQaRun({
      presetName: "Crocodile vs Warthog",
      predator: "Crocodile",
      prey: "Warthog",
      arc: "Ambush attack",
      contentLane: "Fishing Strike",
      habitat: "Riverbank Reeds",
      weather: "Golden Hour",
      depthMode: "Balanced Depth",
      cameraAnglePreset: "Waterline",
      emotionalTone: "Raw Tension",
      animalVibe: "National Geographic Wild",
      finalEnvironment: "Riverbank reeds with clean waterline spacing",
      sceneDescription:
        "Slow low push-in near the waterline as Crocodile surges once and Warthog recoils toward open ground, keeping both animals readable with grounded motion and clean spacing.",
      pkg: makePackage(),
    });

    expect(run.presetName).toBe("Crocodile vs Warthog");
    expect(run.predator).toBe("Crocodile");
    expect(run.prey).toBe("Warthog");
    expect(run.finalQaStatus).toBeDefined();
    expect(run.finalQaScore).toBeGreaterThan(0);
    expect(run.promptHealthLabel).toBeDefined();
    expect(run.outputReady).toBe(true);
  });

  it("keeps only the latest five runs", () => {
    const history = Array.from({ length: MAX_CREATOR_QA_RUNS + 2 }, (_, index) => ({
      id: `run-${index}`,
      createdAt: `2026-05-04T10:0${index}:00.000Z`,
      predator: "Wolf Pack",
      prey: "Bull Elk",
      finalQaScore: 80 + index,
      finalQaStatus: "Needs review" as const,
      promptHealthLabel: "Good" as const,
      outputReady: index % 2 === 0,
    })).reduce<CreatorQaRun[]>((runs, run) => appendCreatorQaRun(runs, run), []);

    expect(history).toHaveLength(MAX_CREATOR_QA_RUNS);
    expect(history[0].id).toBe(`run-${MAX_CREATOR_QA_RUNS + 1}`);
    expect(history.at(-1)?.id).toBe("run-2");
  });

  it("replaces an existing run with the same id instead of duplicating it", () => {
    const first = buildCreatorQaRun({
      id: "shared-run",
      predator: "Bald Eagle",
      prey: "Salmon",
      arc: "Ambush attack",
      contentLane: "Fishing Strike",
      habitat: "Riverbank Reeds",
      weather: "Golden Hour",
      depthMode: "Balanced Depth",
      cameraAnglePreset: "Waterline",
      emotionalTone: "Raw Tension",
      animalVibe: "National Geographic Wild",
      finalEnvironment: "Alaska river reeds",
      sceneDescription:
        "Slow low push-in near the waterline as Bald Eagle drops once and Salmon thrashes toward open current, keeping both animals readable with grounded motion and clean spacing.",
      pkg: makePackage({ generationId: "shared-run", predatorName: "Bald Eagle", preyName: "Salmon" }),
    });
    const updated = { ...first, finalQaScore: 91 };

    const history = appendCreatorQaRun(appendCreatorQaRun([], first), updated);

    expect(history).toHaveLength(1);
    expect(history[0].finalQaScore).toBe(91);
  });
});
