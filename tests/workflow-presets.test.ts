import { describe, expect, it } from "vitest";

import type { BuildWorkflowPresetSnapshot } from "@/types";
import {
  createWorkflowPreset,
  deleteWorkflowPreset,
  getSafeDefaultWorkflowPresetId,
  normalizeWorkflowPresetSnapshot,
  resolveDefaultWorkflowPreset,
  saveWorkflowPreset,
  updateWorkflowPreset,
} from "@/lib/workflow-presets";

function makeSnapshot(
  overrides: Partial<BuildWorkflowPresetSnapshot> = {}
): BuildWorkflowPresetSnapshot {
  return {
    predator: "Wolf Pack",
    prey: "Bull Elk",
    contentLane: "Pack Hunt",
    arc: "Pack hunting strategy",
    habitat: "Rocky Mountain Meadow",
    weather: "Dawn",
    durationLane: "short",
    fastPublishMode: true,
    strictOriginalityGuard: true,
    hookMode: "danger",
    depthMode: "Balanced Depth",
    emotionalTone: "Raw Tension",
    animalVibe: "National Geographic Wild",
    realismMode: "Reference Locked",
    motionOnlyI2V: true,
    referenceLock: true,
    singleActionRule: true,
    microMotion: true,
    heroVeo: false,
    autoApplyHighDrift: false,
    runwayModel: "Gen-4.5",
    klingModel: "Kling 3.0 Pro",
    activeProvider: "none",
    sceneDescriptionMode: "auto",
    sceneDescription:
      "A wolf pack pressures a bull elk across an open Rocky Mountain lane.",
    sceneDescriptionTouched: false,
    ...overrides,
  };
}

describe("workflow presets", () => {
  it("saves a named preset with the current state snapshot", () => {
    const snapshot = makeSnapshot();
    const presets = saveWorkflowPreset([], snapshot, {
      id: "preset-pack-hunt",
      name: "USA Fast Pack Hunt",
      now: "2026-04-20T00:00:00.000Z",
    });

    expect(presets).toHaveLength(1);
    expect(presets[0].id).toBe("preset-pack-hunt");
    expect(presets[0].name).toBe("USA Fast Pack Hunt");
    expect(presets[0].snapshot).toEqual(snapshot);
  });

  it("loads a preset snapshot shape compatible with the current build state", () => {
    const snapshot = makeSnapshot({
      contentLane: "Fishing Strike",
      arc: "Ambush attack",
      predator: "Bald Eagle",
      prey: "Salmon",
      habitat: "Riverbank Reeds",
      durationLane: "long",
      fastPublishMode: false,
      hookMode: "curiosity",
      sceneDescriptionMode: "manual",
      sceneDescription: "A bald eagle cuts over shallow river water.",
      sceneDescriptionTouched: true,
    });
    const preset = createWorkflowPreset(snapshot, {
      id: "preset-fishing",
      name: "Fishing Strike Short Form",
      now: "2026-04-20T00:00:00.000Z",
    });

    expect(preset.snapshot.predator).toBe("Bald Eagle");
    expect(preset.snapshot.prey).toBe("Salmon");
    expect(preset.snapshot.contentLane).toBe("Fishing Strike");
    expect(preset.snapshot.arc).toBe("Ambush attack");
    expect(preset.snapshot.durationLane).toBe("long");
    expect(preset.snapshot.hookMode).toBe("curiosity");
    expect(preset.snapshot.sceneDescriptionTouched).toBe(true);
  });

  it("updates an existing preset from the current state without changing its id", () => {
    const original = createWorkflowPreset(makeSnapshot(), {
      id: "preset-defender",
      name: "Defender Calf Protection",
      now: "2026-04-20T00:00:00.000Z",
    });
    const updatedSnapshot = makeSnapshot({
      predator: "Bison",
      prey: "Wolf Pack",
      contentLane: "Defender",
      arc: "Defender stands ground",
      habitat: "Open Prairie Grassland",
      fastPublishMode: false,
    });

    const presets = updateWorkflowPreset(
      [original],
      "preset-defender",
      updatedSnapshot,
      {
        name: "Defender Hold Ground",
        now: "2026-04-20T01:00:00.000Z",
      }
    );

    expect(presets).toHaveLength(1);
    expect(presets[0].id).toBe("preset-defender");
    expect(presets[0].name).toBe("Defender Hold Ground");
    expect(presets[0].createdAt).toBe("2026-04-20T00:00:00.000Z");
    expect(presets[0].updatedAt).toBe("2026-04-20T01:00:00.000Z");
    expect(presets[0].snapshot).toEqual(updatedSnapshot);
  });

  it("deletes a preset and clears unsafe default ids", () => {
    const keep = createWorkflowPreset(makeSnapshot(), {
      id: "preset-keep",
      name: "Escape Fast Publish",
      now: "2026-04-20T00:00:00.000Z",
    });
    const remove = createWorkflowPreset(makeSnapshot({ contentLane: "Rut Battle" }), {
      id: "preset-remove",
      name: "Rut Battle Cinematic",
      now: "2026-04-20T00:00:00.000Z",
    });

    const presets = deleteWorkflowPreset([keep, remove], "preset-remove");

    expect(presets.map((preset) => preset.id)).toEqual(["preset-keep"]);
    expect(getSafeDefaultWorkflowPresetId(presets, "preset-remove")).toBeUndefined();
    expect(getSafeDefaultWorkflowPresetId(presets, "preset-keep")).toBe("preset-keep");
  });

  it("resolves the default preset only when it still exists", () => {
    const preset = createWorkflowPreset(makeSnapshot(), {
      id: "preset-default",
      name: "Winter Pressure Long Lane",
      now: "2026-04-20T00:00:00.000Z",
    });

    expect(resolveDefaultWorkflowPreset([preset], "preset-default")?.name).toBe(
      "Winter Pressure Long Lane"
    );
    expect(resolveDefaultWorkflowPreset([preset], "missing")).toBeUndefined();
  });

  it("normalizes legacy or partial values back into the current safe state shape", () => {
    const normalized = normalizeWorkflowPresetSnapshot({
      predator: "Mountain Lion",
      prey: "White-tailed Deer",
      contentLane: "Unknown Lane",
      arc: "Unknown Arc",
      habitat: "Unknown Habitat",
      weather: "Unknown Weather",
      durationLane: "very long",
      hookMode: "odd",
      depthMode: "fake",
      runwayModel: "old runway",
      klingModel: "old kling",
      activeProvider: "mystery",
      sceneDescription: "Manual deer escape setup.",
    });

    expect(normalized).toMatchObject({
      predator: "Mountain Lion",
      prey: "White-tailed Deer",
      contentLane: "Auto",
      arc: "Ambush attack",
      habitat: "Auto",
      weather: "Golden Hour",
      durationLane: "short",
      hookMode: "all",
      depthMode: "Balanced Depth",
      runwayModel: "Gen-4.5",
      klingModel: "Kling 3.0 Pro",
      activeProvider: "none",
      sceneDescriptionMode: "manual",
      sceneDescriptionTouched: true,
    });
  });
});
