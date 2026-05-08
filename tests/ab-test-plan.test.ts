import { describe, expect, it } from "vitest";

import { buildABTestPlan } from "@/lib/ab-test-plan";
import { buildAutoRecommendations } from "@/lib/auto-recommendations";
import { buildFacebookCaptionVariants } from "@/lib/facebook-caption-variants";
import { buildFacebookHookVariants } from "@/lib/facebook-hook-variants";
import { analyzeFacebookReelsPackage } from "@/lib/facebook-reels-scoring";
import { analyzeStoryModePackage } from "@/lib/story-mode-qa";
import { USA_STORY_MODE_PRESETS } from "@/lib/story-mode-presets";
import { HabitatRegion, StoryMode, ViralLane } from "@/types";

import type { GeneratedPackage, ReelPerformanceRecord } from "@/types";

const BAIT_PATTERN = /\b(comment yes|comment no|like if|tag a friend|share this|react to vote)\b/i;
const UNSAFE_PATTERN = /\b(gore|blood|bloody|visible injury|torn flesh|exposed injury)\b/i;

function makePackage(overrides: Partial<GeneratedPackage> = {}) {
  return {
    imagePrompt:
      "Photorealistic Yellowstone wildlife first-frame hook with Grizzly Mother, cub, and Male Grizzly in clean survival tension.",
    negativePrompt: "no gore, no blood, no visible injury",
    thumbnailPrompt: "Grizzly Mother protection moment",
    voiceoverLine: "The mother moved before the threat got closer.",
    runwayShots: ["establish", "pressure", "peak", "resolve"],
    klingShots: ["establish", "pressure", "peak", "resolve"],
    motionStrength: 5,
    capCutPlan: "20-second Reels edit",
    clipChaining: "Runway/Kling/Kling/Runway",
    hook: "The mother moved before the threat got closer",
    hook2026: ["The mother moved before the threat got closer"],
    caption: "A grizzly mother shields her cub as the Yellowstone standoff tightens.",
    caption2026: "A grizzly mother shields her cub as the Yellowstone standoff tightens.",
    cta: "What did you notice first?",
    hashtags: "#WildlifeReels #AnimalStories #YellowstoneWildlife #NatureReels #WildlifeDocumentary",
    tenIdeas: [],
    shotPlan: [
      { engine: "RUNWAY", duration: 5, prompt: "establish first-frame hook" },
      { engine: "KLING", duration: 5, prompt: "pressure build" },
      { engine: "KLING", duration: 5, prompt: "peak survival beat" },
      { engine: "RUNWAY", duration: 5, prompt: "unresolved final frame" },
    ],
    runwayBundle: "Runway shot 1 and 4",
    klingBundle: "Kling shot 2 and 3",
    routingNote: "Hybrid Runway/Kling/Kling/Runway Reels workflow",
    storyMode: StoryMode.MOTHER_BABY,
    viralLane: ViralLane.TENDERNESS,
    habitatRegion: HabitatRegion.YELLOWSTONE,
    subjectA: "Grizzly Mother",
    subjectB: "Male Grizzly",
    offspringLabel: "cub",
    ...overrides,
  } as GeneratedPackage;
}

function makeRecord(overrides: Partial<ReelPerformanceRecord> = {}) {
  return {
    id: "record_1",
    generationId: "generation_1",
    createdAt: "2026-05-08T00:00:00.000Z",
    updatedAt: "2026-05-08T00:00:00.000Z",
    storyMode: StoryMode.MOTHER_BABY,
    viralLane: ViralLane.TENDERNESS,
    habitatRegion: HabitatRegion.YELLOWSTONE,
    subjectA: "Grizzly Mother",
    subjectB: "Male Grizzly",
    presetId: "yellowstone-grizzly-mother-protects-cubs",
    presetName: "Yellowstone Grizzly Mother Protects Cubs",
    hookUsed: "The mother moved before the threat got closer",
    captionUsed: "A grizzly mother shields her cub as the Yellowstone standoff tightens.",
    hashtagsUsed: [
      "#WildlifeReels",
      "#AnimalStories",
      "#YellowstoneWildlife",
      "#NatureReels",
      "#WildlifeDocumentary",
    ],
    views: 100000,
    threeSecondViews: 78000,
    averageWatchTimeSeconds: 18,
    durationSeconds: 20,
    likes: 6000,
    comments: 900,
    shares: 1800,
    saves: 1300,
    followsGained: 400,
    ...overrides,
  } satisfies ReelPerformanceRecord;
}

function makePlan() {
  const pkg = makePackage();
  const recommendation = buildAutoRecommendations({
    savedRecords: [makeRecord(), makeRecord({ id: "record_2", generationId: "generation_2" }), makeRecord({ id: "record_3", generationId: "generation_3" })],
    currentPackage: pkg,
    storyModePresets: USA_STORY_MODE_PRESETS,
  });

  return buildABTestPlan({
    currentPackage: pkg,
    recommendation,
    facebookScore: analyzeFacebookReelsPackage(pkg),
    storyModeQA: analyzeStoryModePackage(pkg),
    hookVariants: buildFacebookHookVariants(pkg),
    captionVariants: buildFacebookCaptionVariants(pkg),
  });
}

describe("A/B test plan", () => {
  it("returns 3 unique variants when hook and caption data exists", () => {
    const plan = makePlan();

    expect(plan.variants).toHaveLength(3);
    expect(new Set(plan.variants.map((variant) => variant.hook))).toHaveLength(3);
    expect(new Set(plan.variants.map((variant) => variant.caption))).toHaveLength(3);
  });

  it("keeps captions short and hashtag sets exactly 5", () => {
    const plan = makePlan();

    for (const variant of plan.variants) {
      expect(variant.caption.length).toBeLessThanOrEqual(150);
      expect(variant.hashtags).toHaveLength(5);
      expect(variant.hashtags.every((tag) => tag.startsWith("#"))).toBe(true);
    }
  });

  it("avoids unsafe wording and engagement bait", () => {
    const plan = makePlan();

    for (const variant of plan.variants) {
      const text = `${variant.hook} ${variant.caption} ${variant.hashtags.join(" ")}`;
      expect(text).not.toMatch(UNSAFE_PATTERN);
      expect(text).not.toMatch(BAIT_PATTERN);
    }
  });
});
