import { describe, expect, it } from "vitest";

import { analyzeStoryModePackage } from "@/lib/story-mode-qa";
import { StoryMode, ViralLane, ViolenceLevel } from "@/types";

import type { GeneratedPackage } from "@/types";

function makePackage(overrides: Partial<GeneratedPackage> = {}): GeneratedPackage {
  const baseText = [
    "Nano Banana 2 primary master still for WSTV Mother & Baby.",
    "GPT Image 2 backup prompt available.",
    "Photorealistic wildlife documentary master image, 9:16 vertical.",
    "A Grizzly Mother protects two cubs while a Male Grizzly stays at a readable distance.",
    "Facebook Reels first-frame hook with replay value.",
    "Safety: no gore, no blood, no visible injury.",
  ].join("\n");

  return {
    imagePrompt: baseText,
    gptImage2Prompt: baseText,
    negativePrompt: "Negative prompt: gore, blood, visible injury, text, watermark.",
    thumbnailPrompt: baseText,
    voiceoverLine: "The mother moves before the threat does.",
    runwayShots: [],
    klingShots: [],
    motionStrength: 4,
    capCutPlan: "",
    clipChaining: "",
    storyMode: StoryMode.MOTHER_BABY,
    viralLane: ViralLane.TENDERNESS,
    violenceLevel: ViolenceLevel.DISPLAY_ONLY,
    subjectA: "Grizzly Mother",
    subjectB: "Male Grizzly",
    offspringLabel: "cub",
    hook: "The mother moves before the threat does",
    hook2026: [],
    caption: "The mother moves before the threat does\nProtection starts early\nWhat did you notice first?",
    caption2026: "",
    cta: "",
    hashtags: "#WildlifeReels #AnimalEncounter #NatureDrama #WildStoriesTV #FacebookReels",
    tenIdeas: [],
    shotPlan: [
      { engine: "RUNWAY", title: "Shot 1", prompt: baseText, motionStrength: 4 },
      { engine: "KLING", title: "Shot 2", prompt: baseText, motionStrength: 4 },
      { engine: "KLING", title: "Shot 3", prompt: baseText, motionStrength: 4 },
      { engine: "RUNWAY", title: "Shot 4", prompt: baseText, motionStrength: 4 },
    ],
    runwayBundle: baseText,
    klingBundle: baseText,
    routingNote: "Runway/Kling/Kling/Runway",
    structuredPrompts: {
      imagePrompt: {
        fullText: baseText,
        pasteReady: baseText,
        metadata: { engine: "image", title: "Nano Banana 2", variant: "single-shot" },
      },
      gptImage2Prompt: {
        fullText: baseText,
        pasteReady: baseText,
        metadata: { engine: "image", title: "GPT Image 2", variant: "single-shot" },
      },
      workflowShots: [],
    },
    ...overrides,
  } as GeneratedPackage;
}

describe("story mode QA", () => {
  it("marks safe Mother & Baby output as ready", () => {
    const result = analyzeStoryModePackage(makePackage());

    expect(result.status).toBe("ready");
    expect(result.score).toBeGreaterThanOrEqual(86);
    expect(result.flags).toHaveLength(0);
    expect(result.passes.join(" ")).toContain("Non-graphic safety");
  });

  it("flags gore, blood, or injury language as unsafe", () => {
    const result = analyzeStoryModePackage(
      makePackage({
        imagePrompt: "A bloody wildlife frame with gore and visible injury.",
      })
    );

    expect(result.status).toBe("unsafe");
    expect(result.flags.join(" ")).toMatch(/unsafe graphic/i);
  });

  it("flags direct contact language for violence level 1", () => {
    const result = analyzeStoryModePackage(
      makePackage({
        imagePrompt:
          "Nano Banana 2 GPT Image 2 9:16 documentary. Grizzly Mother and Male Grizzly make direct contact with impact.",
      })
    );

    expect(result.status).toBe("needs-review");
    expect(result.flags.join(" ")).toMatch(/Violence Level 1/i);
  });
});
