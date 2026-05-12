import { describe, expect, it } from "vitest";

import {
  MY_WORKFLOW_PRESETS_STORAGE_KEY,
  buildMyWorkflowPresetName,
  createMyWorkflowPreset,
  deleteMyWorkflowPreset,
  loadMyWorkflowPresets,
  readPresetsFromStorage,
  saveMyWorkflowPresets,
  upsertMyWorkflowPreset,
  type MyWorkflowPresetSnapshot,
  type StorageLike,
} from "@/lib/my-workflow-presets";
import {
  EncounterMode,
  EndingMode,
  HabitatRegion,
  StoryMode,
  ViralLane,
  ViolenceLevel,
} from "@/types";

function memoryStorage(initial: Record<string, string> = {}): StorageLike {
  const data = new Map(Object.entries(initial));

  return {
    getItem(key: string) {
      return data.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      data.set(key, value);
    },
    removeItem(key: string) {
      data.delete(key);
    },
  };
}

function snapshot(
  overrides: Partial<MyWorkflowPresetSnapshot> = {}
): MyWorkflowPresetSnapshot {
  return {
    storyMode: StoryMode.HERD_DEFENSE,
    subjectA: "Bison Herd",
    subjectB: "Wolf Pack",
    predator: "Mountain Lion",
    prey: "White-tailed Deer",
    habitatRegion: HabitatRegion.YELLOWSTONE,
    season: "FALL",
    timeOfDay: "GOLDEN_HOUR",
    actionStyle: "Viral chase",
    animalVibe: "National Geographic Wild",
    arc: "Defender stands ground",
    cameraAnglePreset: "Low-angle power",
    contentLane: "Defender",
    depthMode: "Balanced Depth",
    emotionalTone: "Raw Tension",
    encounterMode: EncounterMode.PEAK_TENSION,
    endingMode: EndingMode.STANDOFF,
    hookMode: "curiosity",
    strictOriginalityGuard: true,
    viralLane: ViralLane.POWER,
    violenceLevel: ViolenceLevel.DISPLAY_ONLY,
    weather: "Golden Hour",
    runwayModel: "Gen-4.5",
    klingModel: "Kling 3.0 Pro",
    selectedVideoModelId: "seedance-2",
    selectedVideoProviderGroup: "SEEDANCE_DIRECT",
    autoSelectRecommendedVideoModel: true,
    activeProvider: "gemini",
    autoFallback: true,
    habitat: "Rocky Mountain Meadow",
    durationLane: "short",
    fastPublishMode: true,
    realismMode: "Reference Locked",
    motionOnlyI2V: true,
    referenceLock: true,
    singleActionRule: true,
    microMotion: true,
    heroVeo: false,
    ...overrides,
  };
}

describe("my workflow presets", () => {
  it("creates a preset from a snapshot", () => {
    const preset = createMyWorkflowPreset(snapshot(), "Bison Wolf Viral", {
      id: "preset_1",
      now: "2026-05-12T00:00:00.000Z",
    });

    expect(preset).toMatchObject({
      id: "preset_1",
      name: "Bison Wolf Viral",
      version: 1,
      createdAt: "2026-05-12T00:00:00.000Z",
      updatedAt: "2026-05-12T00:00:00.000Z",
      snapshot: {
        storyMode: StoryMode.HERD_DEFENSE,
        subjectA: "Bison Herd",
        subjectB: "Wolf Pack",
        selectedVideoModelId: "seedance-2",
        selectedVideoProviderGroup: "SEEDANCE_DIRECT",
        autoSelectRecommendedVideoModel: true,
      },
    });
  });

  it("saves and loads a round trip through storage", () => {
    const storage = memoryStorage();
    const preset = createMyWorkflowPreset(snapshot(), "Bison Wolf Viral", {
      id: "preset_1",
      now: "2026-05-12T00:00:00.000Z",
    });

    expect(saveMyWorkflowPresets([preset], storage)).toBe(true);
    expect(loadMyWorkflowPresets(storage)).toEqual([preset]);
  });

  it("upserts by replacing an existing preset", () => {
    const storage = memoryStorage();
    const first = createMyWorkflowPreset(snapshot(), "First", {
      id: "preset_1",
      now: "2026-05-12T00:00:00.000Z",
    });
    const second = {
      ...first,
      name: "Updated",
      updatedAt: "2026-05-13T00:00:00.000Z",
      snapshot: snapshot({ subjectB: "Grizzly Bear" }),
    };

    saveMyWorkflowPresets([first], storage);
    expect(upsertMyWorkflowPreset(second, storage)).toHaveLength(1);
    expect(loadMyWorkflowPresets(storage)[0]).toMatchObject({
      id: "preset_1",
      name: "Updated",
      createdAt: "2026-05-12T00:00:00.000Z",
      updatedAt: "2026-05-13T00:00:00.000Z",
      snapshot: { subjectB: "Grizzly Bear" },
    });
  });

  it("deletes a preset from storage", () => {
    const storage = memoryStorage();
    const first = createMyWorkflowPreset(snapshot(), "First", { id: "preset_1" });
    const second = createMyWorkflowPreset(snapshot({ subjectA: "Elk Herd" }), "Second", {
      id: "preset_2",
    });

    saveMyWorkflowPresets([first, second], storage);

    expect(deleteMyWorkflowPreset("preset_1", storage)).toEqual([second]);
  });

  it("returns an empty list for corrupt storage data", () => {
    const storage = memoryStorage({
      [MY_WORKFLOW_PRESETS_STORAGE_KEY]: "{not-json",
    });

    expect(readPresetsFromStorage(storage)).toEqual([]);
  });

  it("returns an empty list for version mismatch", () => {
    const storage = memoryStorage({
      [MY_WORKFLOW_PRESETS_STORAGE_KEY]: JSON.stringify({
        version: 999,
        presets: [createMyWorkflowPreset(snapshot(), "Old")],
      }),
    });

    expect(readPresetsFromStorage(storage)).toEqual([]);
  });

  it("builds a deterministic default name", () => {
    expect(buildMyWorkflowPresetName(snapshot())).toBe(
      "Herd Defense: Bison Herd vs Wolf Pack"
    );
  });
});
