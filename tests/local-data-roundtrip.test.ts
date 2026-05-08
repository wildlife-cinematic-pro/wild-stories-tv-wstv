import { afterEach, describe, expect, it, vi } from "vitest";

import { deleteABExperimentRecord, readABExperimentRecords, writeABExperimentRecords } from "@/lib/ab-experiment-storage";
import { serializeLocalCreatorDataExport } from "@/lib/local-creator-data-export";
import { restoreLocalCreatorDataFromJson } from "@/lib/local-creator-data-import";
import {
  deleteReelPerformanceRecord,
  readReelPerformanceRecords,
  writeReelPerformanceRecords,
} from "@/lib/reels-performance-storage";
import {
  HabitatRegion,
  StoryMode,
  ViralLane,
  type ABExperimentRecord,
  type ReelPerformanceRecord,
} from "@/types";

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
  id: string,
  overrides: Partial<ReelPerformanceRecord> = {}
): ReelPerformanceRecord {
  return {
    id,
    generationId: "golden_generation",
    createdAt: "2026-05-08T00:00:00.000Z",
    updatedAt: "2026-05-08T00:10:00.000Z",
    storyMode: StoryMode.MOTHER_BABY,
    viralLane: ViralLane.TENDERNESS,
    habitatRegion: HabitatRegion.YELLOWSTONE,
    subjectA: "Grizzly Mother",
    subjectB: "Male Grizzly",
    views: 1200,
    likes: 110,
    comments: 22,
    shares: 34,
    saves: 18,
    ...overrides,
  };
}

function makeExperiment(
  id: string,
  overrides: Partial<ABExperimentRecord> = {}
): ABExperimentRecord {
  return {
    id,
    generationId: "golden_generation",
    createdAt: "2026-05-08T00:00:00.000Z",
    updatedAt: "2026-05-08T00:10:00.000Z",
    title: "Golden A/B Plan",
    hypothesis: "Test which safe wildlife hook keeps more viewers.",
    storyMode: StoryMode.MOTHER_BABY,
    viralLane: ViralLane.TENDERNESS,
    habitatRegion: HabitatRegion.YELLOWSTONE,
    subjectA: "Grizzly Mother",
    subjectB: "Male Grizzly",
    status: "running",
    variants: [
      {
        label: "A",
        hook: "The mother moved first.",
        caption: "A Yellowstone protection beat builds fast.",
        hashtags: [
          "#WildlifeReels",
          "#AnimalStories",
          "#YellowstoneWildlife",
          "#NatureReels",
          "#WildlifeDocumentary",
        ],
        testFocus: "First-frame protection hook",
        expectedSignal: "Higher retention",
      },
    ],
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("local creator data roundtrip regression guard", () => {
  it("restores exported JSON with merge mode", () => {
    installLocalStorageMock();
    writeReelPerformanceRecords([makePerformanceRecord("existing_perf")]);
    writeABExperimentRecords([makeExperiment("existing_ab")]);

    const exportedJson = serializeLocalCreatorDataExport({
      performanceRecords: [makePerformanceRecord("imported_perf")],
      abExperiments: [makeExperiment("imported_ab")],
      exportedAt: "2026-05-08T01:00:00.000Z",
    });

    const result = restoreLocalCreatorDataFromJson(exportedJson, { mode: "merge" });

    expect(result.ok).toBe(true);
    expect(readReelPerformanceRecords().map((record) => record.id).sort()).toEqual([
      "existing_perf",
      "imported_perf",
    ]);
    expect(readABExperimentRecords().map((record) => record.id).sort()).toEqual([
      "existing_ab",
      "imported_ab",
    ]);
  });

  it("restores exported JSON with replace mode and removes old records", () => {
    installLocalStorageMock();
    writeReelPerformanceRecords([makePerformanceRecord("old_perf")]);
    writeABExperimentRecords([makeExperiment("old_ab")]);

    const exportedJson = serializeLocalCreatorDataExport({
      performanceRecords: [makePerformanceRecord("new_perf")],
      abExperiments: [makeExperiment("new_ab")],
    });

    const result = restoreLocalCreatorDataFromJson(exportedJson, { mode: "replace" });

    expect(result.ok).toBe(true);
    expect(readReelPerformanceRecords().map((record) => record.id)).toEqual(["new_perf"]);
    expect(readABExperimentRecords().map((record) => record.id)).toEqual(["new_ab"]);
  });

  it("does not modify localStorage when import JSON is malformed", () => {
    installLocalStorageMock();
    writeReelPerformanceRecords([makePerformanceRecord("safe_perf")]);
    writeABExperimentRecords([makeExperiment("safe_ab")]);

    expect(() =>
      restoreLocalCreatorDataFromJson("{bad json", { mode: "replace" })
    ).toThrow(/could not be parsed/i);

    expect(readReelPerformanceRecords().map((record) => record.id)).toEqual(["safe_perf"]);
    expect(readABExperimentRecords().map((record) => record.id)).toEqual(["safe_ab"]);
  });

  it("keeps schemaVersion 1 exports supported", () => {
    installLocalStorageMock();
    const exportedJson = serializeLocalCreatorDataExport({
      performanceRecords: [makePerformanceRecord("schema_perf")],
      abExperiments: [makeExperiment("schema_ab")],
    });
    const parsed = JSON.parse(exportedJson) as { schemaVersion: number };

    expect(parsed.schemaVersion).toBe(1);
    expect(restoreLocalCreatorDataFromJson(exportedJson, { mode: "merge" }).ok).toBe(true);
  });

  it("delete helpers keep restored local data manageable", () => {
    installLocalStorageMock();
    writeReelPerformanceRecords([
      makePerformanceRecord("perf_keep"),
      makePerformanceRecord("perf_delete"),
    ]);
    writeABExperimentRecords([makeExperiment("ab_keep"), makeExperiment("ab_delete")]);

    deleteReelPerformanceRecord("perf_delete");
    deleteABExperimentRecord("ab_delete");

    expect(readReelPerformanceRecords().map((record) => record.id)).toEqual(["perf_keep"]);
    expect(readABExperimentRecords().map((record) => record.id)).toEqual(["ab_keep"]);
  });
});

