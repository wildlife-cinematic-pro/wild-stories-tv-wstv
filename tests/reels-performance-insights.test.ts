import { describe, expect, it } from "vitest";

import { buildPerformanceInsights } from "@/lib/reels-performance-insights";
import { HabitatRegion, StoryMode, ViralLane, type ReelPerformanceRecord } from "@/types";

function makeRecord(overrides: Partial<ReelPerformanceRecord> = {}): ReelPerformanceRecord {
  return {
    id: "record_1",
    generationId: "generation_1",
    createdAt: "2026-05-08T00:00:00.000Z",
    updatedAt: "2026-05-08T00:10:00.000Z",
    storyMode: StoryMode.MOTHER_BABY,
    viralLane: ViralLane.TENDERNESS,
    habitatRegion: HabitatRegion.YELLOWSTONE,
    subjectA: "Grizzly Mother",
    subjectB: "Male Grizzly",
    hookUsed: "The mother moved before the threat got closer",
    captionUsed: "A grizzly mother shields her cub as Yellowstone pressure builds.",
    views: 50000,
    threeSecondViews: 36000,
    averageWatchTimeSeconds: 20,
    durationSeconds: 25,
    likes: 2800,
    comments: 450,
    shares: 900,
    saves: 600,
    followsGained: 250,
    ...overrides,
  };
}

describe("reels performance insights", () => {
  it("identifies the best story mode by average score", () => {
    const insights = buildPerformanceInsights([
      makeRecord({ id: "winner", storyMode: StoryMode.MOTHER_BABY }),
      makeRecord({
        id: "weak",
        generationId: "generation_2",
        storyMode: StoryMode.WEATHER_SURVIVAL,
        views: 100,
        threeSecondViews: 20,
        averageWatchTimeSeconds: 2,
        durationSeconds: 25,
        likes: 1,
        comments: 0,
        shares: 0,
        saves: 0,
        followsGained: 0,
      }),
    ]);

    expect(insights.bestStoryMode?.label).toBe("Mother Baby");
    expect(insights.topRecords[0].record.id).toBe("winner");
    expect(insights.weakestRecords[0].record.id).toBe("weak");
  });

  it("groups by viral lane, habitat, subject pair, hook, and caption", () => {
    const insights = buildPerformanceInsights([
      makeRecord({
        viralLane: ViralLane.TENDERNESS,
        habitatRegion: HabitatRegion.YELLOWSTONE,
        subjectA: "Moose Cow",
        subjectB: "Wolf Pack",
        hookUsed: "The mother moved first",
        captionUsed: "A moose cow shields her calf",
      }),
    ]);

    expect(insights.bestViralLane?.label).toBe("Tenderness");
    expect(insights.bestHabitatRegion?.label).toBe("Yellowstone");
    expect(insights.bestSubjectPair?.label).toBe("Moose Cow vs Wolf Pack");
    expect(insights.bestHookUsed?.label).toBe("The mother moved first");
    expect(insights.bestCaptionUsed?.label).toBe("A moose cow shields her calf");
  });

  it("returns empty insight groups for no records", () => {
    const insights = buildPerformanceInsights([]);

    expect(insights.bestStoryMode).toBeNull();
    expect(insights.topRecords).toEqual([]);
    expect(insights.weakestRecords).toEqual([]);
  });
});
