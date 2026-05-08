import { describe, expect, it } from "vitest";

import { buildAutoRecommendations } from "@/lib/auto-recommendations";
import { USA_STORY_MODE_PRESETS } from "@/lib/story-mode-presets";
import { HabitatRegion, StoryMode, ViralLane, type ReelPerformanceRecord } from "@/types";

function makeRecord(overrides: Partial<ReelPerformanceRecord> = {}): ReelPerformanceRecord {
  return {
    id: overrides.id ?? "record_1",
    generationId: overrides.generationId ?? "generation_1",
    createdAt: "2026-05-08T00:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-05-08T00:10:00.000Z",
    storyMode: StoryMode.MOTHER_BABY,
    viralLane: ViralLane.TENDERNESS,
    habitatRegion: HabitatRegion.YELLOWSTONE,
    presetId: "yellowstone-grizzly-mother-protects-cubs",
    presetName: "Yellowstone Grizzly Mother Protects Cubs",
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

function weakRecord(overrides: Partial<ReelPerformanceRecord> = {}): ReelPerformanceRecord {
  return makeRecord({
    id: "weak_record",
    generationId: "weak_generation",
    storyMode: StoryMode.RIVAL_CLASH,
    viralLane: ViralLane.POWER,
    habitatRegion: HabitatRegion.GREAT_PLAINS,
    presetId: "bison-bulls-dominance-clash",
    presetName: "Bison Bulls Dominance Clash",
    subjectA: "Bison Bull A",
    subjectB: "Bison Bull B",
    views: 90,
    threeSecondViews: 10,
    averageWatchTimeSeconds: 1,
    durationSeconds: 25,
    likes: 1,
    comments: 0,
    shares: 0,
    saves: 0,
    followsGained: 0,
    ...overrides,
  });
}

describe("auto recommendations", () => {
  it("returns needs-more-data with a strong fallback preset when no records exist", () => {
    const result = buildAutoRecommendations({
      savedRecords: [],
      storyModePresets: USA_STORY_MODE_PRESETS,
    });

    expect(result.status).toBe("needs-more-data");
    expect(result.nextBestStoryMode).toBe(StoryMode.MOTHER_BABY);
    expect(result.nextBestPresetId).toBe("yellowstone-grizzly-mother-protects-cubs");
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(100);
  });

  it("keeps fewer than 3 saved records in learning mode", () => {
    const result = buildAutoRecommendations({
      savedRecords: [makeRecord()],
      storyModePresets: USA_STORY_MODE_PRESETS,
    });

    expect(result.status).toBe("learning");
    expect(result.warnings.join(" ")).toMatch(/at least 3/i);
  });

  it("recommends Mother & Baby when that mode has high performance", () => {
    const result = buildAutoRecommendations({
      savedRecords: [
        makeRecord({ id: "mother_1", generationId: "mother_1" }),
        makeRecord({ id: "mother_2", generationId: "mother_2", shares: 1000 }),
        makeRecord({ id: "mother_3", generationId: "mother_3", saves: 850 }),
        weakRecord(),
      ],
      storyModePresets: USA_STORY_MODE_PRESETS,
    });

    expect(result.status).toBe("ready");
    expect(result.nextBestStoryMode).toBe(StoryMode.MOTHER_BABY);
    expect(result.nextBestPresetName).toMatch(/Grizzly Mother|Moose Cow/);
    expect(result.recommendedHookStyle).toBe("emotion");
  });

  it("adds weak story modes to the avoid list", () => {
    const result = buildAutoRecommendations({
      savedRecords: [
        makeRecord({ id: "winner_1", generationId: "winner_1" }),
        makeRecord({ id: "winner_2", generationId: "winner_2" }),
        makeRecord({ id: "winner_3", generationId: "winner_3" }),
        weakRecord({ id: "weak_rival", updatedAt: "2026-05-08T01:00:00.000Z" }),
      ],
      storyModePresets: USA_STORY_MODE_PRESETS,
    });

    expect(result.avoidList.join(" ")).toMatch(/Rival Clash/i);
  });

  it("keeps confidence finite and clamped", () => {
    const result = buildAutoRecommendations({
      savedRecords: [makeRecord({ views: 0, durationSeconds: 0, averageWatchTimeSeconds: 0 })],
      storyModePresets: USA_STORY_MODE_PRESETS,
    });

    expect(Number.isFinite(result.confidence)).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(100);
  });

  it("ignores unsafe records when choosing the recommendation", () => {
    const result = buildAutoRecommendations({
      savedRecords: [
        makeRecord({
          id: "unsafe_1",
          generationId: "unsafe_1",
          storyMode: StoryMode.RIVAL_CLASH,
          presetId: "bull-elk-rut-standoff",
          presetName: "Bull Elk Rut Standoff",
          hookUsed: "Blood and gore decide the standoff",
          captionUsed: "Visible injury makes the clash extreme.",
          views: 200000,
          shares: 5000,
          saves: 4000,
        }),
        makeRecord({ id: "safe_1", generationId: "safe_1" }),
        makeRecord({ id: "safe_2", generationId: "safe_2" }),
        makeRecord({ id: "safe_3", generationId: "safe_3" }),
      ],
      storyModePresets: USA_STORY_MODE_PRESETS,
    });

    expect(result.nextBestStoryMode).toBe(StoryMode.MOTHER_BABY);
    expect(result.warnings.join(" ")).toMatch(/unsafe/i);
    expect(result.avoidList.join(" ")).toMatch(/unsafe wording/i);
  });

  it("returns preset id and name when a matching best preset exists", () => {
    const result = buildAutoRecommendations({
      savedRecords: [
        makeRecord({ id: "one", generationId: "one" }),
        makeRecord({ id: "two", generationId: "two" }),
        makeRecord({ id: "three", generationId: "three" }),
      ],
      storyModePresets: USA_STORY_MODE_PRESETS,
    });

    expect(result.nextBestPresetId).toBe("yellowstone-grizzly-mother-protects-cubs");
    expect(result.nextBestPresetName).toBe("Yellowstone Grizzly Mother Protects Cubs");
  });
});
