import { describe, expect, it } from "vitest";

import { rankStoryModeSetups } from "@/lib/story-mode-setup-ranking";
import { HabitatRegion, StoryMode, type Season, type TimeOfDay } from "@/types";

const animalOptions = [
  "American Bison",
  "Bald Eagle",
  "Bison Herd",
  "Black Bear",
  "Bull Elk A",
  "Bull Elk B",
  "Caribou Herd",
  "Coyote",
  "Grizzly Bear",
  "Grizzly Mother",
  "Male Grizzly",
  "Mountain Lion",
  "Sockeye Salmon",
  "Trout",
  "White-tailed Deer",
  "Wolf Pack",
];

function rank({
  storyMode,
  habitatRegion = HabitatRegion.YELLOWSTONE,
  season = "FALL",
  timeOfDay = "GOLDEN_HOUR",
}: {
  storyMode: StoryMode;
  habitatRegion?: HabitatRegion;
  season?: Season;
  timeOfDay?: TimeOfDay;
}) {
  return rankStoryModeSetups({
    storyMode,
    habitatRegion,
    season,
    timeOfDay,
    animalOptions,
  });
}

describe("rankStoryModeSetups", () => {
  it("ranks Bison Herd vs Wolf Pack high for Herd Defense", () => {
    const [top] = rank({ storyMode: StoryMode.HERD_DEFENSE });

    expect(top.subjectA).toBe("Bison Herd");
    expect(top.subjectB).toBe("Wolf Pack");
    expect(top.pairScore).toBeGreaterThanOrEqual(90);
    expect(top.habitatScore).toBeGreaterThanOrEqual(85);
  });

  it("ranks a strong fishing setup first", () => {
    const [top] = rank({ storyMode: StoryMode.FISHING_STRIKE });
    const pair = `${top.subjectA} vs ${top.subjectB}`;

    expect([
      "Bald Eagle vs Trout",
      "Grizzly Bear vs Sockeye Salmon",
    ]).toContain(pair);
    expect(top.habitatScore).toBeGreaterThanOrEqual(85);
  });

  it("ranks Bull Elk A vs Bull Elk B high for Rival Clash", () => {
    const [top] = rank({ storyMode: StoryMode.RIVAL_CLASH });

    expect(top.subjectA).toBe("Bull Elk A");
    expect(top.subjectB).toBe("Bull Elk B");
    expect(top.score).toBeGreaterThanOrEqual(190);
  });

  it("ranks American Bison and Blizzard Wind high for Weather Survival", () => {
    const [top] = rank({
      storyMode: StoryMode.WEATHER_SURVIVAL,
      season: "WINTER",
    });

    expect(top.subjectA).toBe("American Bison");
    expect(top.subjectB).toBe("Blizzard Wind");
    expect(top.season).toBe("WINTER");
    expect(top.habitatScore).toBeGreaterThanOrEqual(90);
  });

  it("keeps weak habitat or pair setups out of the top rank when stronger options exist", () => {
    const [top] = rank({ storyMode: StoryMode.NEAR_MISS });

    expect(top.subjectA).toBe("White-tailed Deer");
    expect(top.subjectB).toBe("Mountain Lion");
    expect(top.habitatScore).toBeGreaterThanOrEqual(70);
  });

  it("returns deterministic ordering", () => {
    const first = rank({ storyMode: StoryMode.PREDATOR_VS_PREY }).map(
      (setup) => setup.id
    );
    const second = rank({ storyMode: StoryMode.PREDATOR_VS_PREY }).map(
      (setup) => setup.id
    );

    expect(second).toEqual(first);
  });
});
