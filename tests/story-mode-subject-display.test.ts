import { describe, expect, it } from "vitest";

import { STORY_MODE_OPTIONS } from "@/lib/story-mode-selector-options";
import { getStoryModeImageSetupGuidance } from "@/lib/story-mode-image-setup-guidance";
import {
  formatStoryModeGenerateCtaLabel,
  formatStoryModeSubjectPair,
} from "@/lib/story-mode-prompt-context";
import {
  getStoryModeSubjectDefaults,
  getStoryModeSubjectOverrideFlags,
  hasStoryModeSubjectOverride,
} from "@/lib/story-mode-subject-defaults";
import { StoryMode } from "@/types";

describe("formatStoryModeSubjectPair", () => {

  it("uses USA-native Facebook Reels examples in the story mode selector", () => {
    const examples = new Map(
      STORY_MODE_OPTIONS.map((option) => [option.value, option.example])
    );

    expect(examples.get(StoryMode.PREDATOR_VS_PREY)).toBe(
      "Mountain Lion vs Mule Deer"
    );
    expect(examples.get(StoryMode.HERD_DEFENSE)).toBe(
      "Bison Herd vs Wolf Pack"
    );
    expect(examples.get(StoryMode.MOTHER_BABY)).toBe(
      "Grizzly Mother Protects Cubs"
    );
    expect(examples.get(StoryMode.RIVAL_CLASH)).toBe(
      "Bull Elk Rut Standoff"
    );
    expect(examples.get(StoryMode.NEAR_MISS)).toBe(
      "Deer Last-Second Brush Escape"
    );
    expect(examples.get(StoryMode.FISHING_STRIKE)).toBe(
      "Bald Eagle River Strike"
    );
    expect(examples.get(StoryMode.WEATHER_SURVIVAL)).toBe(
      "Yellowstone Bison Blizzard"
    );
    expect(examples.get(StoryMode.MIGRATION)).toBe(
      "Elk Herd Migration Lane"
    );
    expect(examples.get(StoryMode.SCAVENGER_CONFLICT)).toBe(
      "Bald Eagle vs Coyote Claim"
    );
  });

  it("adds image setup guidance only for non-Predator story modes", () => {
    expect(getStoryModeImageSetupGuidance(StoryMode.PREDATOR_VS_PREY)).toBeUndefined();

    expect(getStoryModeImageSetupGuidance(StoryMode.HERD_DEFENSE)).toContain(
      "readable herd formation"
    );
    expect(getStoryModeImageSetupGuidance(StoryMode.MOTHER_BABY)).toContain(
      "sheltered visible offspring"
    );
    expect(getStoryModeImageSetupGuidance(StoryMode.RIVAL_CLASH)).toContain(
      "two similar rivals facing off"
    );
    expect(getStoryModeImageSetupGuidance(StoryMode.NEAR_MISS)).toContain(
      "one clear escape lane"
    );
    expect(getStoryModeImageSetupGuidance(StoryMode.FISHING_STRIKE)).toContain(
      "waterline target"
    );
    expect(getStoryModeImageSetupGuidance(StoryMode.WEATHER_SURVIVAL)).toContain(
      "no predator requirement"
    );
    expect(getStoryModeImageSetupGuidance(StoryMode.MIGRATION)).toContain(
      "visible crossing obstacle"
    );
    expect(getStoryModeImageSetupGuidance(StoryMode.SCAVENGER_CONFLICT)).toContain(
      "no carcass detail or blood"
    );
  });
  it("keeps predator vs prey labels for the default story mode", () => {
    expect(
      formatStoryModeSubjectPair({
        storyMode: StoryMode.PREDATOR_VS_PREY,
        predator: "Mountain Lion",
        prey: "White-tailed Deer",
      })
    ).toBe("Mountain Lion vs White-tailed Deer");
  });

  it("uses mode-specific subjects for herd defense", () => {
    expect(
      formatStoryModeSubjectPair({
        storyMode: StoryMode.HERD_DEFENSE,
        predator: "Mountain Lion",
        prey: "White-tailed Deer",
        subjectA: "Bison Herd",
        subjectB: "Wolf Pack",
      })
    ).toBe("Bison Herd vs Wolf Pack");
  });

  it("uses weather hazard display subjects when no old prey label should appear", () => {
    expect(
      formatStoryModeSubjectPair({
        storyMode: StoryMode.WEATHER_SURVIVAL,
        predator: "Mountain Lion",
        prey: "White-tailed Deer",
        subjectA: "American Bison",
      })
    ).toBe("American Bison vs Blizzard Wind");
  });
  it("formats clear mode-aware generate CTA labels", () => {
    expect(
      formatStoryModeGenerateCtaLabel({
        storyMode: StoryMode.PREDATOR_VS_PREY,
        predator: "Mountain Lion",
        prey: "White-tailed Deer",
      })
    ).toBe("Predator vs Prey: Mountain Lion vs White-tailed Deer");

    expect(
      formatStoryModeGenerateCtaLabel({
        storyMode: StoryMode.MOTHER_BABY,
        subjectA: "Grizzly Mother",
        subjectB: "Male Grizzly",
        offspringLabel: "cub",
      })
    ).toBe("Mother & Baby: Grizzly Mother protects Cub");

    expect(
      formatStoryModeGenerateCtaLabel({
        storyMode: StoryMode.MIGRATION,
        subjectA: "Caribou Herd",
        subjectB: "River Crossing",
      })
    ).toBe("Migration Crossing: Caribou Herd at River Crossing");
  });


  it("formats stable current setup labels for every story mode", () => {
    const cases = [
      {
        storyMode: StoryMode.PREDATOR_VS_PREY,
        predator: "Mountain Lion",
        prey: "White-tailed Deer",
        expected: "Predator vs Prey: Mountain Lion vs White-tailed Deer",
      },
      {
        storyMode: StoryMode.HERD_DEFENSE,
        subjectA: "Bison Herd",
        subjectB: "Wolf Pack",
        expected: "Herd Defense: Bison Herd vs Wolf Pack",
      },
      {
        storyMode: StoryMode.MOTHER_BABY,
        subjectA: "Grizzly Mother",
        subjectB: "Male Grizzly",
        offspringLabel: "cub" as const,
        expected: "Mother & Baby: Grizzly Mother protects Cub",
      },
      {
        storyMode: StoryMode.RIVAL_CLASH,
        subjectA: "Bull Elk A",
        subjectB: "Bull Elk B",
        expected: "Rival Clash: Bull Elk A vs Bull Elk B",
      },
      {
        storyMode: StoryMode.NEAR_MISS,
        subjectA: "White-tailed Deer",
        subjectB: "Mountain Lion",
        expected: "Near-Miss Escape: White-tailed Deer escapes Mountain Lion",
      },
      {
        storyMode: StoryMode.FISHING_STRIKE,
        subjectA: "Grizzly Bear",
        subjectB: "Sockeye Salmon",
        expected: "Fishing Strike: Grizzly Bear vs Sockeye Salmon",
      },
      {
        storyMode: StoryMode.WEATHER_SURVIVAL,
        subjectA: "American Bison",
        expected: "Weather Survival: American Bison vs Blizzard Wind",
      },
      {
        storyMode: StoryMode.MIGRATION,
        subjectA: "Caribou Herd",
        subjectB: "River Crossing",
        expected: "Migration Crossing: Caribou Herd at River Crossing",
      },
      {
        storyMode: StoryMode.SCAVENGER_CONFLICT,
        subjectA: "Bald Eagle",
        subjectB: "Coyote",
        expected: "Scavenger Conflict: Bald Eagle vs Coyote",
      },
    ];

    for (const testCase of cases) {
      expect(formatStoryModeGenerateCtaLabel(testCase)).toBe(testCase.expected);
    }
  });

  it("does not mark smart defaults as manual overrides", () => {
    const herdDefaults = getStoryModeSubjectDefaults(StoryMode.HERD_DEFENSE);

    expect(hasStoryModeSubjectOverride(StoryMode.HERD_DEFENSE, herdDefaults)).toBe(
      false
    );
    expect(getStoryModeSubjectOverrideFlags(StoryMode.HERD_DEFENSE, herdDefaults)).toMatchObject({
      subjectA: false,
      subjectB: false,
      groupCount: false,
    });
  });

  it("marks changed mode-specific subject values as manual overrides", () => {
    const flags = getStoryModeSubjectOverrideFlags(StoryMode.HERD_DEFENSE, {
      subjectA: "Musk Ox Herd",
      subjectB: "Wolf Pack",
      groupCount: 12,
    });

    expect(flags.subjectA).toBe(true);
    expect(flags.subjectB).toBe(false);
    expect(flags.groupCount).toBe(false);
    expect(hasStoryModeSubjectOverride(StoryMode.HERD_DEFENSE, {
      subjectA: "Musk Ox Herd",
      subjectB: "Wolf Pack",
      groupCount: 12,
    })).toBe(true);
  });

  it("returns smart defaults that reset weather survival display labels", () => {
    const defaults = getStoryModeSubjectDefaults(StoryMode.WEATHER_SURVIVAL);

    expect(defaults).toMatchObject({
      subjectA: "American Bison",
      subjectB: "Blizzard Wind",
      groupCount: 8,
      weatherHazard: "BLIZZARD",
    });
    expect(formatStoryModeGenerateCtaLabel({
      storyMode: StoryMode.WEATHER_SURVIVAL,
      ...defaults,
    })).toBe("Weather Survival: American Bison vs Blizzard Wind");
  });

});
