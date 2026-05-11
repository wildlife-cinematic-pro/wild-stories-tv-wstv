import { describe, expect, it } from "vitest";

import { evaluateStoryModePairQuality } from "@/lib/story-mode-pair-quality";
import { HabitatRegion, StoryMode, type Season } from "@/types";

const animalOptions = [
  "Bald Eagle",
  "Coyote",
  "Red Fox",
  "Raven",
  "Bison",
  "American Bison",
  "Bison Herd",
  "Wolf Pack",
  "Wolf",
  "Grizzly Bear",
  "Grizzly Mother",
  "Male Grizzly",
  "Black Bear",
  "Mountain Lion",
  "White-tailed Deer",
  "Bull Elk",
  "Bull Elk A",
  "Bull Elk B",
  "Elk Herd",
  "Moose",
  "Caribou Herd",
  "Trout",
  "Salmon",
  "Sockeye Salmon",
  "Fish",
];

function quality(input: {
  storyMode: StoryMode;
  subjectA: string;
  subjectB?: string;
  habitatRegion?: HabitatRegion;
  season?: Season;
}) {
  return evaluateStoryModePairQuality({
    habitatRegion: input.habitatRegion ?? HabitatRegion.YELLOWSTONE,
    season: input.season ?? "FALL",
    animalOptions,
    ...input,
  });
}

describe("evaluateStoryModePairQuality", () => {
  it("scores Bison Herd vs Wolf Pack in Herd Defense as strong", () => {
    expect(
      quality({
        storyMode: StoryMode.HERD_DEFENSE,
        subjectA: "Bison Herd",
        subjectB: "Wolf Pack",
      }).level
    ).toBe("strong");
  });

  it("scores Grizzly Mother vs Male Grizzly in Mother & Baby as strong", () => {
    expect(
      quality({
        storyMode: StoryMode.MOTHER_BABY,
        subjectA: "Grizzly Mother",
        subjectB: "Male Grizzly",
      }).level
    ).toBe("strong");
  });

  it("scores Bull Elk A vs Bull Elk B in Rival Clash as strong", () => {
    expect(
      quality({
        storyMode: StoryMode.RIVAL_CLASH,
        subjectA: "Bull Elk A",
        subjectB: "Bull Elk B",
      }).level
    ).toBe("strong");
  });

  it("flags Bull Elk A vs Bald Eagle in Rival Clash as weak", () => {
    const result = quality({
      storyMode: StoryMode.RIVAL_CLASH,
      subjectA: "Bull Elk A",
      subjectB: "Bald Eagle",
    });

    expect(result.level).toBe("weak");
    expect(result.suggestions[0]).toMatch(/Bull Elk A vs Bull Elk B/i);
  });

  it("scores Bald Eagle vs Trout in Fishing Strike as strong", () => {
    expect(
      quality({
        storyMode: StoryMode.FISHING_STRIKE,
        subjectA: "Bald Eagle",
        subjectB: "Trout",
        habitatRegion: HabitatRegion.ALASKA,
      }).level
    ).toBe("strong");
  });

  it("flags Bald Eagle vs Bison in Fishing Strike as weak", () => {
    const result = quality({
      storyMode: StoryMode.FISHING_STRIKE,
      subjectA: "Bald Eagle",
      subjectB: "Bison",
    });

    expect(result.level).toBe("weak");
    expect(result.reasons[0]).toMatch(/fish or a food source/i);
  });

  it("scores White-tailed Deer vs Mountain Lion in Near-Miss as strong", () => {
    expect(
      quality({
        storyMode: StoryMode.NEAR_MISS,
        subjectA: "White-tailed Deer",
        subjectB: "Mountain Lion",
      }).level
    ).toBe("strong");
  });

  it("ignores subjectB animal scoring for Weather Survival", () => {
    const result = quality({
      storyMode: StoryMode.WEATHER_SURVIVAL,
      subjectA: "American Bison",
      subjectB: "Wolf Pack",
      season: "WINTER",
    });

    expect(result.level).toBe("strong");
    expect(result.reasons.join(" ")).toMatch(/weather-survival|Winter/i);
    expect(result.warnings).toEqual([]);
  });

  it("ignores subjectB animal scoring for Migration", () => {
    const result = quality({
      storyMode: StoryMode.MIGRATION,
      subjectA: "Caribou Herd",
      subjectB: "Wolf Pack",
    });

    expect(result.level).toBe("strong");
    expect(result.reasons.join(" ")).toMatch(/Crossing type stays/i);
    expect(result.warnings).toEqual([]);
  });

  it("returns caution for unknown custom pairs without crashing", () => {
    const result = quality({
      storyMode: StoryMode.SCAVENGER_CONFLICT,
      subjectA: "Moon Cat",
      subjectB: "River Dragon",
    });

    expect(result.level).toBe("caution");
    expect(result.reasons[0]).toMatch(/custom/i);
  });
});
