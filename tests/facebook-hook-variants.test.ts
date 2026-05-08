import { describe, expect, it } from "vitest";

import { buildFacebookHookVariants } from "@/lib/facebook-hook-variants";
import { StoryMode } from "@/types";

import type { GeneratedPackage } from "@/types";

const BAIT_PATTERN = /\b(comment yes|comment no|like if|tag a friend|share this|react to vote)\b/i;

function makePackage(storyMode: StoryMode, overrides: Partial<GeneratedPackage> = {}) {
  return {
    storyMode,
    subjectA: "Grizzly Mother",
    subjectB: "Male Grizzly",
    predatorName: "Mountain Lion",
    preyName: "White-tailed Deer",
    offspringLabel: "cub",
    foodItem: "salmon run",
    ...overrides,
  } as GeneratedPackage;
}

describe("facebook hook variants", () => {
  it("returns 5 hooks within 90 characters and avoids engagement bait", () => {
    const variants = buildFacebookHookVariants(makePackage(StoryMode.MOTHER_BABY));

    expect(variants).toHaveLength(5);
    for (const variant of variants) {
      expect(variant.hook.length).toBeLessThanOrEqual(90);
      expect(variant.hook).not.toMatch(BAIT_PATTERN);
      expect(variant.rank).toBeGreaterThanOrEqual(1);
    }
  });

  it("returns predator vs prey hooks with chase or escape pressure", () => {
    const variants = buildFacebookHookVariants(
      makePackage(StoryMode.PREDATOR_VS_PREY, {
        subjectA: "Mountain Lion",
        subjectB: "White-tailed Deer",
      })
    );

    expect(variants.map((variant) => variant.hook).join(" ")).toMatch(
      /escape|chase|lane|prey/i
    );
  });

  it("gives every non-predator mode at least one relevant hook phrase", () => {
    const expectations: Array<[StoryMode, RegExp]> = [
      [StoryMode.HERD_DEFENSE, /herd|wall|formation/i],
      [StoryMode.MOTHER_BABY, /mother|cub|protection/i],
      [StoryMode.RIVAL_CLASH, /rival|standoff|dominance/i],
      [StoryMode.NEAR_MISS, /escape|last-second|brush/i],
      [StoryMode.FISHING_STRIKE, /strike|splash|water/i],
      [StoryMode.WEATHER_SURVIVAL, /weather|storm|wind/i],
      [StoryMode.MIGRATION, /crossing|route|herd/i],
      [StoryMode.SCAVENGER_CONFLICT, /food|claim|zone/i],
    ];

    for (const [storyMode, pattern] of expectations) {
      const text = buildFacebookHookVariants(makePackage(storyMode))
        .map((variant) => variant.hook)
        .join(" ");

      expect(text).toMatch(pattern);
    }
  });
});
