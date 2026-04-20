import { describe, expect, it } from "vitest";

import type { BuildWorkflowPresetSnapshot } from "@/types";
import {
  buildWorkflowPresetExportPayload,
  createWorkflowPreset,
  deleteWorkflowPreset,
  getSafeDefaultWorkflowPresetId,
  mergeWorkflowPresetImport,
  mergeWorkflowPresetImportJson,
  normalizeWorkflowPresetSnapshot,
  resolveDefaultWorkflowPreset,
  saveWorkflowPreset,
  stringifyWorkflowPresetExportPayload,
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

  it("exports a single preset with versioned portable JSON metadata", () => {
    const preset = createWorkflowPreset(makeSnapshot(), {
      id: "preset-pack-hunt",
      name: "USA Fast Pack Hunt",
      now: "2026-04-20T00:00:00.000Z",
    });

    const payload = buildWorkflowPresetExportPayload([preset], {
      defaultPresetId: preset.id,
      exportedAt: "2026-04-20T02:00:00.000Z",
    });
    const json = stringifyWorkflowPresetExportPayload(payload);

    expect(payload).toMatchObject({
      schema: "wstv.workflow-presets",
      version: 1,
      source: "wild-stories-tv-wstv",
      exportedAt: "2026-04-20T02:00:00.000Z",
      defaultPresetId: "preset-pack-hunt",
      metadata: { presetCount: 1 },
    });
    expect(JSON.parse(json).presets[0].name).toBe("USA Fast Pack Hunt");
  });

  it("exports all presets and omits unsafe default ids", () => {
    const first = createWorkflowPreset(makeSnapshot(), {
      id: "preset-one",
      name: "USA Fast Pack Hunt",
      now: "2026-04-20T00:00:00.000Z",
    });
    const second = createWorkflowPreset(
      makeSnapshot({ contentLane: "Escape", arc: "Escape from danger" }),
      {
        id: "preset-two",
        name: "Escape Fast Publish",
        now: "2026-04-20T01:00:00.000Z",
      }
    );

    const payload = buildWorkflowPresetExportPayload([first, second], {
      defaultPresetId: "missing",
      exportedAt: "2026-04-20T02:00:00.000Z",
    });

    expect(payload.presets).toHaveLength(2);
    expect(payload.defaultPresetId).toBeUndefined();
    expect(payload.metadata.presetCount).toBe(2);
  });

  it("imports valid preset JSON and preserves the imported default only when no current default exists", () => {
    const preset = createWorkflowPreset(makeSnapshot(), {
      id: "preset-imported-default",
      name: "Winter Pressure Long Lane",
      now: "2026-04-20T00:00:00.000Z",
    });
    const payload = buildWorkflowPresetExportPayload([preset], {
      defaultPresetId: preset.id,
      exportedAt: "2026-04-20T02:00:00.000Z",
    });

    const report = mergeWorkflowPresetImportJson(
      [],
      stringifyWorkflowPresetExportPayload(payload),
      { preserveImportedDefaultWhenEmpty: true }
    );

    expect(report.importedCount).toBe(1);
    expect(report.defaultPresetId).toBe("preset-imported-default");
    expect(report.presets[0].snapshot.contentLane).toBe("Pack Hunt");
  });

  it("imports legacy partial preset data through compatibility normalization", () => {
    const report = mergeWorkflowPresetImport([], {
      name: "Legacy Fishing Strike",
      predator: "Bald Eagle",
      prey: "Salmon",
      contentLane: "Fishing Strike",
      arc: "Unknown old arc",
      habitat: "Old river",
      sceneDescription: "Eagle over shallow river water.",
    });

    expect(report.importedCount).toBe(1);
    expect(report.skippedCount).toBe(0);
    expect(report.presets[0].name).toBe("Legacy Fishing Strike");
    expect(report.presets[0].snapshot).toMatchObject({
      predator: "Bald Eagle",
      prey: "Salmon",
      contentLane: "Fishing Strike",
      arc: "Ambush attack",
      habitat: "Auto",
      sceneDescriptionMode: "manual",
      sceneDescriptionTouched: true,
    });
  });

  it("resolves id and name collisions without overwriting existing presets", () => {
    const existing = createWorkflowPreset(makeSnapshot(), {
      id: "preset-shared",
      name: "USA Fast Pack Hunt",
      now: "2026-04-20T00:00:00.000Z",
    });
    const incoming = createWorkflowPreset(
      makeSnapshot({ prey: "Mule Deer" }),
      {
        id: "preset-shared",
        name: "USA Fast Pack Hunt",
        now: "2026-04-20T01:00:00.000Z",
      }
    );

    const report = mergeWorkflowPresetImport([existing], [incoming], {
      currentDefaultPresetId: existing.id,
      preserveImportedDefaultWhenEmpty: true,
    });

    expect(report.importedCount).toBe(1);
    expect(report.regeneratedIdCount).toBe(1);
    expect(report.renamedCount).toBe(1);
    expect(report.defaultPresetId).toBe(existing.id);
    expect(report.presets.map((preset) => preset.id)).toContain("preset-shared");
    expect(report.importedPresets[0].id).toBe("preset-shared-imported");
    expect(report.importedPresets[0].name).toBe("USA Fast Pack Hunt (Imported)");
  });

  it("keeps existing presets safe when imported JSON is invalid", () => {
    const existing = createWorkflowPreset(makeSnapshot(), {
      id: "preset-existing",
      name: "USA Fast Pack Hunt",
      now: "2026-04-20T00:00:00.000Z",
    });

    const report = mergeWorkflowPresetImportJson([existing], "{not-json", {
      currentDefaultPresetId: existing.id,
    });

    expect(report.importedCount).toBe(0);
    expect(report.presets).toEqual([existing]);
    expect(report.defaultPresetId).toBe(existing.id);
    expect(report.warnings[0]).toMatch(/could not be parsed/i);
  });
});
