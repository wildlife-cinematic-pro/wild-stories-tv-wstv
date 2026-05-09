import { describe, expect, it } from "vitest";

import {
  EASTERN_TIME_ZONE,
  getEasternCreatorContext,
  getNorthernHemisphereSeason,
  getSeasonalRealismAdvice,
} from "@/lib/seasonal-realism-advisor";
import { HabitatRegion, StoryMode, ViralLane } from "@/types";

import type { SeasonalRealismAdviceInput } from "@/lib/seasonal-realism-advisor";

describe("seasonal realism advisor", () => {
  it("uses America/New_York for Eastern creator context", () => {
    const context = getEasternCreatorContext(new Date("2026-05-09T12:00:00Z"));

    expect(context.timeZone).toBe(EASTERN_TIME_ZONE);
    expect(context.label).toBe("US Eastern Time / ET");
    expect(context.currentSeason).toBe("SPRING");
    expect(context.dateLabel).toContain("2026");
  });

  it("detects northern hemisphere seasons from dates", () => {
    expect(getNorthernHemisphereSeason(new Date("2026-03-15T00:00:00Z"))).toBe("SPRING");
    expect(getNorthernHemisphereSeason(new Date("2026-07-15T00:00:00Z"))).toBe("SUMMER");
    expect(getNorthernHemisphereSeason(new Date("2026-10-15T00:00:00Z"))).toBe("FALL");
    expect(getNorthernHemisphereSeason(new Date("2026-01-15T00:00:00Z"))).toBe("WINTER");
  });

  it("flags summer plus blizzard as a mismatch and suggests winter", () => {
    const advice = getSeasonalRealismAdvice({
      storyMode: StoryMode.WEATHER_SURVIVAL,
      habitatRegion: HabitatRegion.YELLOWSTONE,
      season: "SUMMER",
      weather: "Golden Hour",
      weatherHazard: "BLIZZARD",
      subjectA: "American Bison",
      subjectB: "Blizzard Wind",
      viralLane: ViralLane.SURVIVAL,
    });

    expect(advice.status).toBe("mismatch");
    expect(advice.suggestedSeason).toBe("WINTER");
    expect(advice.recommendation).toContain("creative override");
  });

  it("flags Everglades snow or blizzard combinations", () => {
    const advice = getSeasonalRealismAdvice({
      storyMode: StoryMode.PREDATOR_VS_PREY,
      habitatRegion: HabitatRegion.EVERGLADES,
      season: "WINTER",
      weather: "Winter Blizzard",
      predator: "Alligator",
      prey: "White-tailed Deer",
      viralLane: ViralLane.TENSION,
    });

    expect(advice.status).toBe("mismatch");
    expect(advice.warnings.join(" ")).toContain("Everglades");
    expect(advice.warnings.join(" ")).toContain("Alligator");
  });

  it("marks Yellowstone fall rival clash as a strong match", () => {
    const advice = getSeasonalRealismAdvice({
      storyMode: StoryMode.RIVAL_CLASH,
      habitatRegion: HabitatRegion.YELLOWSTONE,
      season: "FALL",
      weather: "Golden Hour",
      subjectA: "Bull Elk A",
      subjectB: "Bull Elk B",
      viralLane: ViralLane.POWER,
    });

    expect(advice.status).toBe("strong");
    expect(advice.passes.join(" ")).toContain("elk rut");
  });

  it("marks Alaska salmon fishing strike in summer or fall as a strong match", () => {
    for (const season of ["SUMMER", "FALL"] as const) {
      const advice = getSeasonalRealismAdvice({
        storyMode: StoryMode.FISHING_STRIKE,
        habitatRegion: HabitatRegion.ALASKA,
        season,
        weather: "Golden Hour",
        subjectA: "Grizzly Bear",
        subjectB: "Sockeye Salmon",
        viralLane: ViralLane.SURVIVAL,
      });

      expect(advice.status).toBe("strong");
      expect(advice.passes.join(" ")).toContain("salmon run");
    }
  });

  it("does not mutate the selected season automatically", () => {
    const input: SeasonalRealismAdviceInput = {
      storyMode: StoryMode.WEATHER_SURVIVAL,
      habitatRegion: HabitatRegion.YELLOWSTONE,
      season: "SUMMER",
      weather: "Golden Hour",
      weatherHazard: "BLIZZARD",
      subjectA: "American Bison",
      viralLane: ViralLane.SURVIVAL,
    };

    const advice = getSeasonalRealismAdvice(input);

    expect(input.season).toBe("SUMMER");
    expect(advice.suggestedSeason).toBe("WINTER");
  });

  it("supports apply-suggested-season behavior without changing other fields", () => {
    const input: SeasonalRealismAdviceInput = {
      storyMode: StoryMode.WEATHER_SURVIVAL,
      habitatRegion: HabitatRegion.YELLOWSTONE,
      season: "SUMMER",
      weatherHazard: "BLIZZARD",
      subjectA: "American Bison",
      subjectB: "Blizzard Wind",
      viralLane: ViralLane.SURVIVAL,
    };
    const advice = getSeasonalRealismAdvice(input);
    const next = { ...input, season: advice.suggestedSeason ?? input.season };

    expect(next.season).toBe("WINTER");
    expect(next.storyMode).toBe(input.storyMode);
    expect(next.subjectA).toBe(input.subjectA);
    expect(next.subjectB).toBe(input.subjectB);
  });
});
