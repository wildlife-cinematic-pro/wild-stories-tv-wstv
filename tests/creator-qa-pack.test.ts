import { describe, expect, it } from "vitest";

import { buildCreatorQaPack } from "@/lib/creator-qa-pack";
import type { GeneratedPackage } from "@/types";

const data: GeneratedPackage = {
  predatorName: "Grizzly Bear",
  preyName: "Bison",
  arcName: "Defender stands ground",
  environmentName: "Yellowstone valley",
  imagePrompt:
    "Photorealistic wildlife documentary master image,  Full-body readable grizzly and bison with grounded paw and hoof contact, clean spacing, thumbnail-safe first-frame composition, stable anatomy, Yellowstone habitat continuity, and no blood, no gore, no visible wounds.",
  gptImage2Prompt: "backup",
  negativePrompt:
    "blood, gore, visible wounds, extra limbs, duplicate animals, humans, fences, text, watermark, cartoon, wrong habitat, duplicate animals",
  thumbnailPrompt: "thumb",
  voiceoverLine: "voice",
  runwayShots: ["r1", "r2", "r3", "r4"],
  klingShots: ["k1", "k2", "k3", "k4"],
  seedanceShots: ["s1", "s2", "s3", "s4"],
  motionStrength: 70,
  capCutPlan: "capcut",
  clipChaining: "clip",
  hook: "hook",
  hook2026: ["hook a"],
  caption: "caption",
  caption2026: "caption long",
  cta: "cta",
  hashtags: "#one #two #three #four #five",
  tenIdeas: ["idea"],
  shotPlan: [],
  runwayBundle: "rb",
  klingBundle: "kb",
  routingNote: "route",
  sceneDesc: "The bison lowers its head once while the grizzly shifts weight defensively.",
};

describe("creator QA pack", () => {
  it("builds copy-ready QA pack sections from the pure utilities", () => {
    const pack = buildCreatorQaPack(data);

    expect(pack.masterImageScore).toBeGreaterThanOrEqual(80);
    expect(pack.masterImageFixPrompt.length).toBeGreaterThan(0);
    expect(pack.runwayMotionFirstPrompt).toContain("Image-to-video from the same source image.");
    expect(pack.compactNegativePrompt.split(", ").length).toBeLessThanOrEqual(14);
    expect(pack.facebookCaption.length).toBeLessThanOrEqual(150);
    expect(pack.facebookHashtags.split(" ")).toHaveLength(5);
    expect(pack.failureRepairPrompt).toContain("Repair pass:");
    expect(pack.summaryText).toContain("MASTER IMAGE QUALITY");
    expect(pack.summaryText).toContain("FAILURE REPAIR PROMPT");
  });
});
