import { describe, expect, it } from "vitest";

import {
  formatStoryModeGenerateCtaLabel,
  formatStoryModeSubjectPair,
} from "@/lib/story-mode-prompt-context";
import { StoryMode } from "@/types";

describe("formatStoryModeSubjectPair", () => {
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
});
