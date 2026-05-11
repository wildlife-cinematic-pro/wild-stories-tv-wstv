import { describe, expect, it } from "vitest";

import { evaluateHabitatCompatibility } from "@/lib/story-mode-habitat-quality";
import { HabitatRegion, StoryMode, type Season } from "@/types";

const animalOptions = [
  "Alligator",
  "American Bison",
  "Bald Eagle",
  "Bison Herd",
  "Bull Elk A",
  "Bull Elk B",
  "Coyote",
  "Grizzly Bear",
  "Mountain Lion",
  "Polar Bear",
  "Sockeye Salmon",
  "Trout",
  "White-tailed Deer",
  "Wolf Pack",
];

function evaluate({
  storyMode,
  subjectA,
  subjectB,
  habitatRegion,
  season = "SUMMER",
}: {
  storyMode: StoryMode;
  subjectA: string;
  subjectB?: string;
  habitatRegion: HabitatRegion;
  season?: Season;
}) {
  return evaluateHabitatCompatibility({
    storyMode,
    subjectA,
    subjectB,
    habitatRegion,
    season,
    timeOfDay: "GOLDEN_HOUR",
    animalOptions,
  });
}

describe("evaluateHabitatCompatibility", () => {
  it("scores Bison Herd and Wolf Pack in Yellowstone as strong", () => {
    const quality = evaluate({
      storyMode: StoryMode.HERD_DEFENSE,
      subjectA: "Bison Herd",
      subjectB: "Wolf Pack",
      habitatRegion: HabitatRegion.YELLOWSTONE,
    });

    expect(quality.level).toBe("strong");
    expect(quality.label).toBe("Habitat fit: Strong");
  });

  it("scores Bald Eagle and Trout in Alaska as strong", () => {
    const quality = evaluate({
      storyMode: StoryMode.FISHING_STRIKE,
      subjectA: "Bald Eagle",
      subjectB: "Trout",
      habitatRegion: HabitatRegion.ALASKA,
    });

    expect(quality.level).toBe("strong");
  });

  it("scores White-tailed Deer and Coyote in Appalachia as strong or good", () => {
    const quality = evaluate({
      storyMode: StoryMode.NEAR_MISS,
      subjectA: "White-tailed Deer",
      subjectB: "Coyote",
      habitatRegion: HabitatRegion.APPALACHIA,
    });

    expect(["strong", "good"]).toContain(quality.level);
  });

  it("flags Alligator in Yellowstone as weak", () => {
    const quality = evaluate({
      storyMode: StoryMode.NEAR_MISS,
      subjectA: "Alligator",
      subjectB: "Coyote",
      habitatRegion: HabitatRegion.YELLOWSTONE,
    });

    expect(quality.level).toBe("weak");
    expect(quality.label).toBe("Habitat mismatch");
  });

  it("flags Polar Bear in Great Plains as weak", () => {
    const quality = evaluate({
      storyMode: StoryMode.HERD_DEFENSE,
      subjectA: "American Bison",
      subjectB: "Polar Bear",
      habitatRegion: HabitatRegion.GREAT_PLAINS,
    });

    expect(quality.level).toBe("weak");
  });

  it("scores Grizzly Bear and Sockeye Salmon in Alaska as strong", () => {
    const quality = evaluate({
      storyMode: StoryMode.FISHING_STRIKE,
      subjectA: "Grizzly Bear",
      subjectB: "Sockeye Salmon",
      habitatRegion: HabitatRegion.ALASKA,
    });

    expect(quality.level).toBe("strong");
  });

  it("scores Bull Elk rival clash in Rocky Mountains as strong or good", () => {
    const quality = evaluate({
      storyMode: StoryMode.RIVAL_CLASH,
      subjectA: "Bull Elk A",
      subjectB: "Bull Elk B",
      habitatRegion: HabitatRegion.ROCKY_MOUNTAINS,
      season: "FALL",
    });

    expect(["strong", "good"]).toContain(quality.level);
  });

  it("returns caution for a custom unknown animal", () => {
    const quality = evaluate({
      storyMode: StoryMode.HERD_DEFENSE,
      subjectA: "Moon Antelope",
      subjectB: "Wolf Pack",
      habitatRegion: HabitatRegion.YELLOWSTONE,
    });

    expect(quality.level).toBe("caution");
  });

  it("scores American Bison in winter Yellowstone Weather Survival as strong", () => {
    const quality = evaluate({
      storyMode: StoryMode.WEATHER_SURVIVAL,
      subjectA: "American Bison",
      subjectB: "Blizzard Wind",
      habitatRegion: HabitatRegion.YELLOWSTONE,
      season: "WINTER",
    });

    expect(quality.level).toBe("strong");
  });
});
