import { afterEach, describe, expect, it, vi } from "vitest";

import {
  deleteABExperimentRecord,
  findABExperimentByGenerationId,
  readABExperimentRecords,
  upsertABExperimentRecord,
  writeABExperimentRecords,
} from "@/lib/ab-experiment-storage";
import {
  HabitatRegion,
  StoryMode,
  ViralLane,
  type ABExperimentRecord,
} from "@/types";

const STORAGE_KEY = "wstv_ab_experiments_v1";

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

function makeExperiment(
  overrides: Partial<ABExperimentRecord> = {}
): ABExperimentRecord {
  return {
    id: "abexp_1",
    generationId: "generation_1",
    createdAt: "2026-05-08T00:00:00.000Z",
    updatedAt: "2026-05-08T00:10:00.000Z",
    title: "Next A/B Test Plan",
    hypothesis: "Test which hook-caption pair wins.",
    storyMode: StoryMode.MOTHER_BABY,
    viralLane: ViralLane.TENDERNESS,
    habitatRegion: HabitatRegion.YELLOWSTONE,
    subjectA: "Grizzly Mother",
    subjectB: "Male Grizzly",
    status: "running",
    variants: [
      {
        label: "A",
        hook: "The mother moved first",
        caption: "A protective Yellowstone moment builds fast.",
        hashtags: ["#WildlifeReels", "#AnimalStories", "#NatureReels"],
        testFocus: "Baseline hook.",
        expectedSignal: "Retention lift.",
        views: 1000,
        likes: 80,
      },
      {
        label: "B",
        hook: "The cub stayed close",
        caption: "A quiet protection beat turns tense.",
        hashtags: ["#WildlifeReels", "#YellowstoneWildlife"],
        testFocus: "Emotion hook.",
        expectedSignal: "Save lift.",
      },
      {
        label: "C",
        hook: "The treeline changed the scene",
        caption: "One distance cue changes the story.",
        hashtags: ["#WildlifeReels", "#NatureShorts"],
        testFocus: "Mystery hook.",
        expectedSignal: "Replay lift.",
      },
    ],
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("A/B experiment storage", () => {
  it("writes and reads a versioned localStorage payload", () => {
    const store = installLocalStorageMock();

    writeABExperimentRecords([makeExperiment()]);

    const raw = store.get(STORAGE_KEY);
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw ?? "{}")).toMatchObject({ version: 1 });
    expect(readABExperimentRecords()).toHaveLength(1);
    expect(readABExperimentRecords()[0]).toMatchObject({
      generationId: "generation_1",
      storyMode: StoryMode.MOTHER_BABY,
      variants: expect.arrayContaining([
        expect.objectContaining({ label: "A", hook: "The mother moved first" }),
      ]),
    });
  });

  it("returns an empty array for malformed localStorage payloads", () => {
    installLocalStorageMock();
    localStorage.setItem(STORAGE_KEY, "{ bad json");

    expect(readABExperimentRecords()).toEqual([]);
  });

  it("upserts by id and finds by generation id", () => {
    installLocalStorageMock();

    upsertABExperimentRecord(makeExperiment({ status: "planned" }));
    upsertABExperimentRecord(makeExperiment({ status: "completed", winnerLabel: "B" }));

    expect(readABExperimentRecords()).toHaveLength(1);
    expect(findABExperimentByGenerationId("generation_1")?.status).toBe("completed");
    expect(findABExperimentByGenerationId("generation_1")?.winnerLabel).toBe("B");
    expect(findABExperimentByGenerationId("missing_generation")).toBeNull();
  });

  it("drops malformed records and omits undefined variant metrics", () => {
    const store = installLocalStorageMock();

    writeABExperimentRecords([
      makeExperiment({
        variants: [
          {
            label: "A",
            hook: "The mother moved first",
            caption: "A protective Yellowstone moment builds fast.",
            hashtags: ["#WildlifeReels"],
            testFocus: "Baseline hook.",
            expectedSignal: "Retention lift.",
            views: undefined,
          },
        ],
      }),
      { id: "bad" } as ABExperimentRecord,
    ]);

    const records = readABExperimentRecords();
    expect(records).toHaveLength(1);
    expect(records[0].variants).toHaveLength(1);

    const rawVariant = JSON.parse(store.get(STORAGE_KEY) ?? "{}").records[0].variants[0];
    expect(rawVariant.views).toBeUndefined();
  });

  it("deletes records by id and preserves A/B/C labels", () => {
    installLocalStorageMock();

    upsertABExperimentRecord(makeExperiment());
    expect(readABExperimentRecords()[0].variants.map((variant) => variant.label)).toEqual([
      "A",
      "B",
      "C",
    ]);

    deleteABExperimentRecord("abexp_1");

    expect(readABExperimentRecords()).toEqual([]);
  });
});
