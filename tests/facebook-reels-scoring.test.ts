import { describe, expect, it } from "vitest";

import { analyzeFacebookReelsPackage } from "@/lib/facebook-reels-scoring";
import {
  HabitatRegion,
  StoryMode,
  ViralLane,
  ViolenceLevel,
} from "@/types";

import type { GeneratedPackage } from "@/types";

function makePackage(overrides: Partial<GeneratedPackage> = {}): GeneratedPackage {
  const baseText = [
    "Original WSTV produced wildlife documentary scene, not a repost or compilation.",
    "Nano Banana 2 primary master still with GPT Image 2 backup, Facebook Reels format.",
    "First-frame hook: Grizzly Mother shields a cub while Male Grizzly stays at the Yellowstone treeline.",
    "Opening establish beat, pressure build, peak protection beat, and unresolved protected exit final frame.",
    "Motion-first Runway Kling Kling Runway workflow with replay value and a hidden body-language tell.",
    "Clean survival tension, no gore, no blood, no visible injury.",
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
    habitatRegion: HabitatRegion.YELLOWSTONE,
    subjectA: "Grizzly Mother",
    subjectB: "Male Grizzly",
    offspringLabel: "cub",
    hook: "The mother moved before the threat got closer",
    hook2026: [],
    caption:
      "A grizzly mother shields her cub as Yellowstone pressure builds. Protection starts early.",
    caption2026: "",
    cta: "",
    hashtags:
      "#WildlifeReels #AnimalStories #YellowstoneWildlife #NatureReels #WildlifeDocumentary",
    tenIdeas: [],
    shotPlan: [
      {
        engine: "RUNWAY",
        title: "Shot 1 Establish",
        prompt: "Opening first-frame hook with both subjects readable.",
        motionStrength: 4,
      },
      {
        engine: "KLING",
        title: "Shot 2 Pressure",
        prompt: "Pressure build as the threat appears at distance.",
        motionStrength: 4,
      },
      {
        engine: "KLING",
        title: "Shot 3 Peak",
        prompt: "Peak protection beat with no contact shown.",
        motionStrength: 4,
      },
      {
        engine: "RUNWAY",
        title: "Shot 4 Resolve",
        prompt: "Unresolved protected exit final frame.",
        motionStrength: 4,
      },
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

describe("facebook reels scoring", () => {
  it("scores a strong Mother & Baby package high", () => {
    const result = analyzeFacebookReelsPackage(makePackage());

    expect(result.status).toBe("strong");
    expect(result.totalScore).toBeGreaterThanOrEqual(85);
    expect(result.passes.join(" ")).toMatch(/First-frame hook/i);
  });

  it("marks gore, blood, or visible injury language as risky", () => {
    const result = analyzeFacebookReelsPackage(
      makePackage({
        imagePrompt: "A bloody wildlife frame with gore and visible injury.",
      })
    );

    expect(result.status).toBe("risky");
    expect(result.dimensions.safetyMonetizationFit).toBeLessThan(50);
    expect(result.warnings.join(" ")).toMatch(/Graphic|monetization-risk/i);
  });

  it("penalizes static slideshow, looping still, and text montage language", () => {
    const result = analyzeFacebookReelsPackage(
      makePackage({
        runwayBundle:
          "Static slideshow with looping stills and a text montage instead of motion-first video.",
      })
    );

    expect(result.dimensions.platformFormatFit).toBeLessThan(80);
    expect(result.warnings.join(" ")).toMatch(/Static|slideshow|montage/i);
  });
});
