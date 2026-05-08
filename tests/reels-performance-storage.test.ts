import { afterEach, describe, expect, it, vi } from "vitest";

import {
  deleteReelPerformanceRecord,
  findReelPerformanceByGenerationId,
  readReelPerformanceRecords,
  upsertReelPerformanceRecord,
  writeReelPerformanceRecords,
} from "@/lib/reels-performance-storage";
import { HabitatRegion, StoryMode, ViralLane, type ReelPerformanceRecord } from "@/types";

const STORAGE_KEY = "wstv_reels_performance_v1";

function installLocalStorageMock() {
  const store = new Map<string, string>();

  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  });

  vi.stubGlobal("window", {
    dispatchEvent: vi.fn(),
  });

  return store;
}

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
    hashtagsUsed: ["#WildlifeReels", "#AnimalStories"],
    views: 10000,
    threeSecondViews: 7000,
    averageWatchTimeSeconds: 19,
    durationSeconds: 25,
    likes: 800,
    comments: 120,
    shares: 260,
    saves: 140,
    followsGained: 45,
    notes: "Strong protection hook.",
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("reels performance storage", () => {
  it("writes and reads a versioned localStorage payload", () => {
    const store = installLocalStorageMock();

    writeReelPerformanceRecords([makeRecord()]);

    const raw = store.get(STORAGE_KEY);
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw ?? "{}")).toMatchObject({ version: 1 });
    expect(readReelPerformanceRecords()).toHaveLength(1);
    expect(readReelPerformanceRecords()[0]).toMatchObject({
      generationId: "generation_1",
      storyMode: StoryMode.MOTHER_BABY,
      views: 10000,
    });
  });

  it("returns an empty array for malformed localStorage payloads", () => {
    installLocalStorageMock();
    localStorage.setItem(STORAGE_KEY, "{ bad json");

    expect(readReelPerformanceRecords()).toEqual([]);
  });

  it("upserts by id and can find by generation id", () => {
    installLocalStorageMock();

    upsertReelPerformanceRecord(makeRecord({ views: 1000 }));
    upsertReelPerformanceRecord(makeRecord({ views: 5000, likes: 300 }));

    expect(readReelPerformanceRecords()).toHaveLength(1);
    expect(findReelPerformanceByGenerationId("generation_1")?.views).toBe(5000);
    expect(findReelPerformanceByGenerationId("missing_generation")).toBeNull();
  });

  it("drops malformed records and omits undefined fields", () => {
    const store = installLocalStorageMock();

    writeReelPerformanceRecords([
      makeRecord({ threeSecondViews: undefined, followsGained: undefined }),
      { id: "bad" } as ReelPerformanceRecord,
    ]);

    const records = readReelPerformanceRecords();
    expect(records).toHaveLength(1);

    const rawRecord = JSON.parse(store.get(STORAGE_KEY) ?? "{}").records[0];
    expect(rawRecord.threeSecondViews).toBeUndefined();
    expect(rawRecord.followsGained).toBeUndefined();
  });

  it("deletes records by id", () => {
    installLocalStorageMock();

    upsertReelPerformanceRecord(makeRecord());
    deleteReelPerformanceRecord("record_1");

    expect(readReelPerformanceRecords()).toEqual([]);
  });
});
