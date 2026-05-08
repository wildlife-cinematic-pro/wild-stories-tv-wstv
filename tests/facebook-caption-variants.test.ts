import { describe, expect, it } from "vitest";

import { buildFacebookCaptionVariants } from "@/lib/facebook-caption-variants";
import { HabitatRegion, StoryMode } from "@/types";

import type { GeneratedPackage } from "@/types";

const BAIT_PATTERN = /\b(comment yes|comment no|like if|tag a friend|share this|react to vote)\b/i;
const UNSAFE_PATTERN = /\b(gore|blood|bloody|visible injury|torn flesh|exposed injury)\b/i;

function makePackage(storyMode: StoryMode, overrides: Partial<GeneratedPackage> = {}) {
  return {
    storyMode,
    subjectA: "Grizzly Mother",
    subjectB: "Male Grizzly",
    predatorName: "Mountain Lion",
    preyName: "White-tailed Deer",
    offspringLabel: "cub",
    habitatRegion: HabitatRegion.YELLOWSTONE,
    foodItem: "salmon run",
    ...overrides,
  } as GeneratedPackage;
}

describe("facebook caption variants", () => {
  it("returns 5 short captions with exactly 5 hashtags each", () => {
    const variants = buildFacebookCaptionVariants(makePackage(StoryMode.MOTHER_BABY));

    expect(variants).toHaveLength(5);
    for (const variant of variants) {
      expect(variant.caption.length).toBeLessThanOrEqual(150);
      expect(variant.caption).not.toMatch(BAIT_PATTERN);
      expect(variant.caption).not.toMatch(UNSAFE_PATTERN);
      expect(variant.hashtags).toHaveLength(5);
      expect(variant.hashtags.every((tag) => tag.startsWith("#"))).toBe(true);
    }
  });

  it("keeps Predator vs Prey captions mode-aware", () => {
    const text = buildFacebookCaptionVariants(
      makePackage(StoryMode.PREDATOR_VS_PREY, {
        subjectA: "Mountain Lion",
        subjectB: "White-tailed Deer",
      })
    )
      .map((variant) => variant.caption)
      .join(" ");

    expect(text).toMatch(/predator|prey|chase|escape lane|survival/i);
  });

  it("gives every non-predator mode at least one relevant caption phrase", () => {
    const expectations: Array<[StoryMode, RegExp]> = [
      [StoryMode.HERD_DEFENSE, /herd|defensive|formation/i],
      [StoryMode.MOTHER_BABY, /mother|cub|protect|shield/i],
      [StoryMode.RIVAL_CLASH, /rival|dominance|standoff/i],
      [StoryMode.NEAR_MISS, /escape|near-miss|last-second/i],
      [StoryMode.FISHING_STRIKE, /strike|splash|waterline|river/i],
      [StoryMode.WEATHER_SURVIVAL, /weather|storm|survival|hazard/i],
      [StoryMode.MIGRATION, /migration|crossing|route/i],
      [StoryMode.SCAVENGER_CONFLICT, /food|claim|challenger|owner/i],
    ];

    for (const [storyMode, pattern] of expectations) {
      const text = buildFacebookCaptionVariants(makePackage(storyMode))
        .map((variant) => variant.caption)
        .join(" ");

      expect(text).toMatch(pattern);
    }
  });
});
