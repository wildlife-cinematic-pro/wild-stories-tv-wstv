import { describe, expect, it } from "vitest";

import {
  buildRunway2026AssistantPack,
  buildRunwayGen45I2VGuidePrompt,
  buildRunwayPromptWriterPack,
  type Runway2026AssistantInput,
} from "@/lib/runway-2026-production-assistant";

const sampleInput: Runway2026AssistantInput = {
  predatorName: "Wild Boar",
  preyName: "Black Bear",
  environmentName: "South Florida Everglades marsh with shallow water channel and muddy banks",
  arcName: "Defender stands ground",
  sceneDescription:
    "Wild Boar on the left drives forward while Black Bear on the right twists under pressure in shallow water.",
  runwayModel: "Gen-4.5",
  klingModel: "Kling 3.0 Pro",
  imagePrompt:
    "Wild Boar on the left and Black Bear on the right, both full-body visible in a marsh waterline corridor with stable anatomy, grounded contact, and clean silhouette separation.",
  runwayShots: [
    "Motion-first opening shot with Wild Boar pressing from the left and Black Bear holding the right bank, both full-body readable, wide 9:16 framing, grounded contact, and clean muddy splash.",
    "Runway settle shot with readable spacing and stable footing.",
  ],
  klingShots: [
    "Pressure beat with both animals fully visible in a wide readable frame.",
    "Action beat with first clash and controlled grapple.",
    "Peak pressure beat with dominant restraint and forced retreat risk.",
  ],
  klingNative15s:
    "15s direct path with first clash by 5 seconds, controlled grapple, and final forced retreat.",
  negativePrompt:
    "blood, gore, visible injury, duplicate animals, cropped bodies, warped anatomy",
  caption: "This clash turned in seconds.",
  hashtags:
    "#WildlifeReels #AnimalEncounter #NatureDrama #WildlifeVideo #FacebookReels",
  mainVideoPrompt:
    "Wild Boar drives forward through shallow water while Black Bear twists under pressure, both full-body visible, wide readable frame, stable anatomy, and grounded paw and hoof contact.",
  failureRepairPromptAleph:
    "Preserve Wild Boar and Black Bear in the original marsh frame. Widen camera if cropped, stabilize camera shake, remove duplicate animal, re-light to source-frame overcast daylight, and keep grounded contact.",
  qaStatus: "Needs review",
  qaScore: 86,
  qaTopFixes: [
    "Keep the muddy-bank attack lane open.",
    "Reduce camera shake in the peak beat.",
  ],
};

describe("Runway 2026 production assistant", () => {
  it("returns deterministic non-empty strings for the full assistant pack", () => {
    const first = buildRunway2026AssistantPack(sampleInput);
    const second = buildRunway2026AssistantPack(sampleInput);

    expect(first).toEqual(second);
    expect(first.gen45I2VPlan.length).toBeGreaterThan(80);
    expect(first.alephRepairGuide.length).toBeGreaterThan(80);
    expect(first.workflowBlueprint.length).toBeGreaterThan(80);
    expect(first.reelRoute.length).toBeGreaterThan(80);
    expect(first.promptWriter.runwayI2VPrompt.length).toBeGreaterThan(80);
    expect(first.promptWriter.referenceImagePrompt.length).toBeGreaterThan(80);
    expect(first.promptWriter.finalMergePrompt.length).toBeGreaterThan(80);
    expect(first.promptWriter.alephRepairPrompt.length).toBeGreaterThan(80);
    expect(first.promptWriter.reelPrompt.length).toBeGreaterThan(80);
  });

  it("mentions motion-first, 24/25fps, 2-10s, and no negative prompt in the Gen-4.5 plan", () => {
    const plan = buildRunwayGen45I2VGuidePrompt(sampleInput);

    expect(plan).toContain("motion");
    expect(plan).toContain("24/25fps");
    expect(plan).toContain("2-10s");
    expect(plan).toContain("Runway has no negative prompt");
  });

  it("builds a paste-ready I2V prompt and reuses the current package runway motion prompt", () => {
    const writerPack = buildRunwayPromptWriterPack(sampleInput);

    expect(writerPack.runwayI2VPrompt).toContain(sampleInput.runwayShots?.[0] ?? "");
    expect(writerPack.runwayI2VPrompt).toContain("Upload the final scene master image or a clean continuity frame");
    expect(writerPack.runwayI2VPrompt).toContain("9:16 vertical");
  });

  it("builds a paste-ready Runway reference image prompt", () => {
    const writerPack = buildRunwayPromptWriterPack(sampleInput);

    expect(writerPack.referenceImagePrompt).toContain("Runway Gen-4 reference image");
    expect(writerPack.referenceImagePrompt).toContain(sampleInput.imagePrompt ?? "");
    expect(writerPack.referenceImagePrompt).toContain("No blood, no gore, no visible wounds, no text, no watermark.");
  });

  it("builds a final merge prompt with exactly 3 active Runway references", () => {
    const writerPack = buildRunwayPromptWriterPack(sampleInput);

    expect(writerPack.finalMergePrompt).toContain(
      "Use exactly 3 active Runway references: @hero_predator, @hero_prey, @env_plate."
    );
    expect(writerPack.finalMergePrompt).toContain("@hero_predator");
    expect(writerPack.finalMergePrompt).toContain("@hero_prey");
    expect(writerPack.finalMergePrompt).toContain("@env_plate");
  });

  it("builds an Aleph repair prompt that treats Aleph as a 5-second repair pass with action verbs", () => {
    const writerPack = buildRunwayPromptWriterPack(sampleInput);

    expect(writerPack.alephRepairPrompt).toContain("Aleph 5-second repair/edit pass");
    expect(writerPack.alephRepairPrompt).toMatch(/remove|change|replace|re-light|re-style|widen|stabilize/i);
  });

  it("builds a 15s route with at least three route options", () => {
    const writerPack = buildRunwayPromptWriterPack(sampleInput);

    expect(writerPack.reelPrompt).toContain("Option A");
    expect(writerPack.reelPrompt).toContain("Option B");
    expect(writerPack.reelPrompt).toContain("Option C");
    expect(writerPack.reelPrompt).toContain(sampleInput.caption ?? "");
    expect(writerPack.reelPrompt).toContain(sampleInput.hashtags ?? "");
  });

  it("keeps the safety language explicit across the assistant pack", () => {
    const pack = buildRunway2026AssistantPack(sampleInput);

    expect(pack.gen45I2VPlan).toContain("No blood, no gore, no visible wounds");
    expect(pack.alephRepairGuide).toContain("No blood, no gore, no visible wounds");
    expect(pack.reelRoute).toContain("No blood, no gore, no visible wounds");
    expect(pack.promptWriter.referenceImagePrompt).toContain(
      "No blood, no gore, no visible wounds"
    );
    expect(pack.promptWriter.finalMergePrompt).toContain(
      "No blood, no gore, no visible wounds"
    );
  });
});
