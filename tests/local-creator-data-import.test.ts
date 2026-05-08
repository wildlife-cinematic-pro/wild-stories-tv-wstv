import { afterEach, describe, expect, it, vi } from "vitest";

import {
  parseLocalCreatorDataImport,
  restoreLocalCreatorDataFromJson,
  validateLocalCreatorDataImport,
} from "@/lib/local-creator-data-import";
import { serializeLocalCreatorDataExport } from "@/lib/local-creator-data-export";
import { readABExperimentRecords, writeABExperimentRecords } from "@/lib/ab-experiment-storage";
import {
  readReelPerformanceRecords,
  writeReelPerformanceRecords,
} from "@/lib/reels-performance-storage";
import { HabitatRegion, StoryMode, ViralLane, type ABExperimentRecord, type ReelPerformanceRecord } from "@/types";

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

function makePerformanceRecord(
  overrides: Partial<ReelPerformanceRecord> = {}
): ReelPerformanceRecord {
  return {
    id: "perf_1",
    generationId: "generation_1",
    createdAt: "2026-05-08T00:00:00.000Z",
    updatedAt: "2026-05-08T00:10:00.000Z",
    storyMode: StoryMode.MOTHER_BABY,
    viralLane: ViralLane.TENDERNESS,
    habitatRegion: HabitatRegion.YELLOWSTONE,
    subjectA: "Grizzly Mother",
    subjectB: "Male Grizzly",
    views: 1000,
    likes: 100,
    comments: 20,
    shares: 30,
    saves: 10,
    ...overrides,
  };
}

function makeExperiment(
  overrides: Partial<ABExperimentRecord> = {}
): ABExperimentRecord {
  return {
    id: "ab_1",
    generationId: "generation_1",
    createdAt: "2026-05-08T00:00:00.000Z",
    updatedAt: "2026-05-08T00:10:00.000Z",
    title: "A/B Plan",
    hypothesis: "Test which hook wins.",
    storyMode: StoryMode.MOTHER_BABY,
    viralLane: ViralLane.TENDERNESS,
    habitatRegion: HabitatRegion.YELLOWSTONE,
    status: "running",
    variants: [
      {
        label: "A",
        hook: "The mother moved first",
        caption: "A Yellowstone protection beat builds fast.",
        hashtags: ["#WildlifeReels"],
        testFocus: "Hook clarity",
        expectedSignal: "Retention",
      },
    ],
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("local creator data import", () => {
  it("parses and validates exported local creator data", () => {
    const json = serializeLocalCreatorDataExport({
      performanceRecords: [makePerformanceRecord()],
      abExperiments: [makeExperiment()],
      exportedAt: "2026-05-08T01:00:00.000Z",
    });

    const result = validateLocalCreatorDataImport(parseLocalCreatorDataImport(json));

    expect(result.ok).toBe(true);
    expect(result.performanceRecords).toHaveLength(1);
    expect(result.abExperiments).toHaveLength(1);
    expect(result.errors).toEqual([]);
  });

  it("rejects invalid JSON and unsupported payloads", () => {
    expect(() => parseLocalCreatorDataImport("{ bad json")).toThrow(/could not be parsed/i);

    const result = validateLocalCreatorDataImport({
      schemaVersion: 99,
      source: "other-tool",
      performanceRecords: [],
      abExperiments: [],
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        "Unsupported Local Data JSON schema version.",
        "This does not look like a WSTV local browser export.",
        "No valid performance records or A/B experiments were found.",
      ])
    );
  });

  it("merges imported records by id without duplicating existing local data", () => {
    installLocalStorageMock();
    writeReelPerformanceRecords([makePerformanceRecord({ id: "existing_perf", views: 50 })]);
    writeABExperimentRecords([makeExperiment({ id: "ab_1", status: "planned" })]);

    const json = serializeLocalCreatorDataExport({
      performanceRecords: [makePerformanceRecord({ id: "perf_1", views: 2000 })],
      abExperiments: [makeExperiment({ id: "ab_1", status: "completed", winnerLabel: "A" })],
    });

    const result = restoreLocalCreatorDataFromJson(json, { mode: "merge" });

    expect(result.ok).toBe(true);
    expect(result.totalPerformanceRecords).toBe(2);
    expect(result.totalABExperiments).toBe(1);
    expect(readReelPerformanceRecords().map((record) => record.id).sort()).toEqual([
      "existing_perf",
      "perf_1",
    ]);
    expect(readABExperimentRecords()[0]).toMatchObject({
      id: "ab_1",
      status: "completed",
      winnerLabel: "A",
    });
  });

  it("replaces local records when replace mode is selected", () => {
    installLocalStorageMock();
    writeReelPerformanceRecords([makePerformanceRecord({ id: "old_perf" })]);
    writeABExperimentRecords([makeExperiment({ id: "old_ab" })]);

    const json = serializeLocalCreatorDataExport({
      performanceRecords: [makePerformanceRecord({ id: "new_perf" })],
      abExperiments: [makeExperiment({ id: "new_ab" })],
    });

    const result = restoreLocalCreatorDataFromJson(json, { mode: "replace" });

    expect(result.ok).toBe(true);
    expect(readReelPerformanceRecords().map((record) => record.id)).toEqual(["new_perf"]);
    expect(readABExperimentRecords().map((record) => record.id)).toEqual(["new_ab"]);
  });

  it("does not change localStorage when JSON parsing fails", () => {
    installLocalStorageMock();
    writeReelPerformanceRecords([makePerformanceRecord({ id: "safe_perf" })]);
    writeABExperimentRecords([makeExperiment({ id: "safe_ab" })]);

    expect(() =>
      restoreLocalCreatorDataFromJson("{ bad json", { mode: "replace" })
    ).toThrow(/could not be parsed/i);

    expect(readReelPerformanceRecords().map((record) => record.id)).toEqual(["safe_perf"]);
    expect(readABExperimentRecords().map((record) => record.id)).toEqual(["safe_ab"]);
  });

  it("skips malformed records with warnings", () => {
    const result = validateLocalCreatorDataImport({
      schemaVersion: 1,
      source: "wstv-local-browser",
      performanceRecords: [makePerformanceRecord(), { id: "bad" }],
      abExperiments: [makeExperiment(), { id: "bad" }],
    });

    expect(result.ok).toBe(true);
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        "1 malformed performance record(s) will be skipped.",
        "1 malformed A/B experiment(s) will be skipped.",
      ])
    );
  });
});
