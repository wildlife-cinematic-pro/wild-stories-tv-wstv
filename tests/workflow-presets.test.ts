import { describe, expect, it } from "vitest";

import type { BuildWorkflowPresetSnapshot } from "@/types";
import {
  buildWorkflowPresetExportPayload,
  buildWorkflowPresetPackExportPayload,
  createWorkflowPreset,
  createWorkflowPresetPack,
  deleteWorkflowPreset,
  getSafeDefaultWorkflowPresetId,
  mergeWorkflowPresetImport,
  mergeWorkflowPresetImportJson,
  mergeWorkflowPresetPackImport,
  mergeWorkflowPresetPackImportJson,
  normalizeWorkflowPresetPack,
  normalizeWorkflowPresetSnapshot,
  resolveDefaultWorkflowPreset,
  saveWorkflowPresetPack,
  saveWorkflowPreset,
  stringifyWorkflowPresetPackExportPayload,
  stringifyWorkflowPresetExportPayload,
  updateWorkflowPreset,
  WORKFLOW_TEST_PRESETS,
} from "@/lib/workflow-presets";

function makeSnapshot(
  overrides: Partial<BuildWorkflowPresetSnapshot> = {}
): BuildWorkflowPresetSnapshot {
  return {
    predator: "Wolf Pack",
    prey: "Bull Elk",
    wildlifeScopeMode: "USA / Canada Wildlife",
    contentLane: "Pack Hunt",
    actionStyle: "Natural tension",
    cameraAnglePreset: "Auto",
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
    expect(preset.snapshot.wildlifeScopeMode).toBe("USA / Canada Wildlife");
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
      wildlifeScopeMode: "USA / Canada Wildlife",
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

  it("keeps legacy world-animal presets loadable by defaulting them to World Wide Wildlife", () => {
    const normalized = normalizeWorkflowPresetSnapshot({
      predator: "Lion",
      prey: "Zebra",
      arc: "Chase and takedown",
    });

    expect(normalized?.wildlifeScopeMode).toBe("World Wide Wildlife");
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

  it("exports a preset pack with versioned metadata", () => {
    const first = createWorkflowPreset(makeSnapshot(), {
      id: "preset-pack-hunt",
      name: "USA Pack Hunt Starter",
      now: "2026-04-20T00:00:00.000Z",
    });
    const second = createWorkflowPreset(
      makeSnapshot({
        contentLane: "Escape",
        arc: "Escape from danger",
        prey: "Mule Deer",
      }),
      {
        id: "preset-escape",
        name: "Escape Fast Publish",
        now: "2026-04-20T01:00:00.000Z",
      }
    );
    const pack = createWorkflowPresetPack([first, second], {
      id: "pack-usa-starter",
      name: "USA Pack Hunt Starter Pack",
      description: "Fast publish presets for grouped predator pressure.",
      tags: ["USA", "Pack Hunt", "Fast Publish", "USA"],
      now: "2026-04-20T02:00:00.000Z",
    });

    const payload = buildWorkflowPresetPackExportPayload(pack, {
      exportedAt: "2026-04-20T03:00:00.000Z",
    });
    const json = stringifyWorkflowPresetPackExportPayload(payload!);

    expect(payload).toMatchObject({
      schema: "wstv.workflow-preset-pack",
      version: 1,
      source: "wild-stories-tv-wstv",
      exportedAt: "2026-04-20T03:00:00.000Z",
      metadata: {
        presetCount: 2,
        tags: ["USA", "Pack Hunt", "Fast Publish"],
      },
    });
    expect(JSON.parse(json).pack.name).toBe("USA Pack Hunt Starter Pack");
  });

  it("imports preset pack JSON and keeps pack metadata visible", () => {
    const preset = createWorkflowPreset(makeSnapshot(), {
      id: "preset-defender-pack",
      name: "Defender Calf Protection",
      now: "2026-04-20T00:00:00.000Z",
    });
    const pack = createWorkflowPresetPack([preset], {
      id: "pack-defender",
      name: "Defender Calf Protection Pack",
      description: "Hold-ground setups for U.S. wildlife defenders.",
      tags: ["Defender", "Calf"],
      now: "2026-04-20T02:00:00.000Z",
    });
    const payload = buildWorkflowPresetPackExportPayload(pack, {
      exportedAt: "2026-04-20T03:00:00.000Z",
    });

    const report = mergeWorkflowPresetPackImportJson(
      [],
      stringifyWorkflowPresetPackExportPayload(payload!)
    );

    expect(report.importedCount).toBe(1);
    expect(report.skippedCount).toBe(0);
    expect(report.importedPack).toMatchObject({
      id: "pack-defender",
      name: "Defender Calf Protection Pack",
      description: "Hold-ground setups for U.S. wildlife defenders.",
      tags: ["Defender", "Calf"],
    });
    expect(report.packs[0].presets[0].snapshot.contentLane).toBe("Pack Hunt");
  });

  it("normalizes legacy or partial preset pack data safely", () => {
    const pack = normalizeWorkflowPresetPack({
      id: "legacy-pack",
      name: "Fishing Strike Starter Pack",
      description: "Riverbank strike presets.",
      tags: ["Fishing", "", "Fishing", "Riverbank"],
      presets: [
        {
          name: "Legacy Eagle Strike",
          predator: "Bald Eagle",
          prey: "Salmon",
          contentLane: "Fishing Strike",
          habitat: "Riverbank Reeds",
          sceneDescription: "Eagle over shallow river water.",
        },
      ],
    });

    expect(pack).toMatchObject({
      id: "legacy-pack",
      name: "Fishing Strike Starter Pack",
      tags: ["Fishing", "Riverbank"],
    });
    expect(pack?.presets[0].snapshot).toMatchObject({
      predator: "Bald Eagle",
      prey: "Salmon",
      contentLane: "Fishing Strike",
      habitat: "Riverbank Reeds",
      sceneDescriptionTouched: true,
    });
  });

  it("resolves preset pack id and name collisions without overwriting packs", () => {
    const existingPreset = createWorkflowPreset(makeSnapshot(), {
      id: "preset-existing-pack",
      name: "USA Pack Hunt Starter",
      now: "2026-04-20T00:00:00.000Z",
    });
    const existingPack = createWorkflowPresetPack([existingPreset], {
      id: "pack-shared",
      name: "USA Pack Hunt Starter Pack",
      now: "2026-04-20T01:00:00.000Z",
    });
    const incomingPack = createWorkflowPresetPack([existingPreset], {
      id: "pack-shared",
      name: "USA Pack Hunt Starter Pack",
      now: "2026-04-20T02:00:00.000Z",
    });

    const report = mergeWorkflowPresetPackImport([existingPack], incomingPack);

    expect(report.importedCount).toBe(1);
    expect(report.regeneratedIdCount).toBe(1);
    expect(report.renamedCount).toBe(1);
    expect(report.packs).toHaveLength(2);
    expect(report.importedPack?.id).toBe("pack-shared-imported");
    expect(report.importedPack?.name).toBe(
      "USA Pack Hunt Starter Pack (Imported)"
    );
  });

  it("applies pack presets through the existing safe preset merge path", () => {
    const existingPreset = createWorkflowPreset(makeSnapshot(), {
      id: "preset-shared",
      name: "USA Pack Hunt Starter",
      now: "2026-04-20T00:00:00.000Z",
    });
    const incomingPreset = createWorkflowPreset(
      makeSnapshot({ prey: "Mule Deer" }),
      {
        id: "preset-shared",
        name: "USA Pack Hunt Starter",
        now: "2026-04-20T01:00:00.000Z",
      }
    );
    const pack = createWorkflowPresetPack([incomingPreset], {
      id: "pack-apply",
      name: "USA Pack Hunt Starter Pack",
      now: "2026-04-20T02:00:00.000Z",
    });

    const report = mergeWorkflowPresetImport([existingPreset], pack.presets, {
      currentDefaultPresetId: existingPreset.id,
      preserveImportedDefaultWhenEmpty: false,
    });

    expect(report.importedCount).toBe(1);
    expect(report.regeneratedIdCount).toBe(1);
    expect(report.renamedCount).toBe(1);
    expect(report.defaultPresetId).toBe(existingPreset.id);
    expect(report.importedPresets[0].id).toBe("preset-shared-imported");
    expect(report.importedPresets[0].name).toBe(
      "USA Pack Hunt Starter (Imported)"
    );
  });

  it("protects existing packs when imported pack JSON is invalid", () => {
    const preset = createWorkflowPreset(makeSnapshot(), {
      id: "preset-existing",
      name: "USA Pack Hunt Starter",
      now: "2026-04-20T00:00:00.000Z",
    });
    const existingPack = createWorkflowPresetPack([preset], {
      id: "pack-existing",
      name: "USA Pack Hunt Starter Pack",
      now: "2026-04-20T01:00:00.000Z",
    });

    const report = mergeWorkflowPresetPackImportJson([existingPack], "{nope");

    expect(report.importedCount).toBe(0);
    expect(report.skippedCount).toBe(1);
    expect(report.packs).toEqual([existingPack]);
    expect(report.warnings[0]).toMatch(/could not be parsed/i);
  });

  it("saves preset packs through a normalized local library shape", () => {
    const preset = createWorkflowPreset(makeSnapshot(), {
      id: "preset-rut",
      name: "Rut Battle Cinematic",
      now: "2026-04-20T00:00:00.000Z",
    });

    const packs = saveWorkflowPresetPack([], [preset], {
      id: "pack-rut",
      name: "Rut Battle Cinematic Pack",
      description: "Dominance posture and giant-clash setups.",
      tags: ["Rut Battle"],
      now: "2026-04-20T01:00:00.000Z",
    });

    expect(packs).toHaveLength(1);
    expect(packs[0]).toMatchObject({
      id: "pack-rut",
      name: "Rut Battle Cinematic Pack",
      description: "Dominance posture and giant-clash setups.",
      tags: ["Rut Battle"],
    });
    expect(packs[0].presets[0].snapshot.arc).toBe("Pack hunting strategy");
  });

  it("ships creator QA test presets with valid setup-only snapshots", () => {
    expect(WORKFLOW_TEST_PRESETS).toHaveLength(5);

    for (const preset of WORKFLOW_TEST_PRESETS) {
      expect(preset.id.length).toBeGreaterThan(0);
      expect(preset.label.length).toBeGreaterThan(0);
      expect(preset.summary.length).toBeGreaterThan(0);
      expect(preset.snapshot.predator.length).toBeGreaterThan(0);
      expect(preset.snapshot.prey.length).toBeGreaterThan(0);
      expect(preset.snapshot.activeProvider).toBe("none");
      expect(preset.snapshot.sceneDescriptionMode).toBe("auto");
      expect(preset.snapshot.sceneDescription).toBe("");
      expect(preset.snapshot.sceneDescriptionTouched).toBe(false);
    }
  });

  it("keeps water-focused presets on waterline-compatible habitats", () => {
    const crocodilePreset = WORKFLOW_TEST_PRESETS.find((preset) => preset.id === "crocodile-warthog");
    const eaglePreset = WORKFLOW_TEST_PRESETS.find((preset) => preset.id === "bald-eagle-salmon");

    expect(crocodilePreset?.snapshot.habitat).toBe("Riverbank Reeds");
    expect(crocodilePreset?.snapshot.cameraAnglePreset).toBe("Waterline");
    expect(eaglePreset?.snapshot.habitat).toBe("Riverbank Reeds");
    expect(eaglePreset?.snapshot.cameraAnglePreset).toBe("Waterline");
  });

  it("keeps arctic and open-lane presets in compatible habitats", () => {
    const polarPreset = WORKFLOW_TEST_PRESETS.find((preset) => preset.id === "polar-bear-arctic-fox");
    const wolfPreset = WORKFLOW_TEST_PRESETS.find((preset) => preset.id === "wolf-pack-bull-elk");

    expect(polarPreset?.snapshot.habitat).toBe("Snow Field Tundra");
    expect(polarPreset?.snapshot.weather).toBe("Overcast");
    expect(wolfPreset?.snapshot.habitat).toBe("Rocky Mountain Meadow");
    expect(wolfPreset?.snapshot.arc).toBe("Pack hunting strategy");
  });
});
