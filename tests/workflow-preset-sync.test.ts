import { describe, expect, it } from "vitest";

import type { BuildWorkflowPresetSnapshot } from "@/types";

import {
  createWorkflowPreset,
  createWorkflowPresetPack,
} from "@/lib/workflow-presets";
import {
  buildLocalOnlyCloudPresetLibrary,
  getCloudPresetLibraryFingerprint,
  mergeCloudPresetLibraries,
  normalizeCloudAccountId,
  normalizeCloudPresetLibrary,
} from "@/lib/workflow-preset-sync";

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

describe("workflow preset cloud sync", () => {
  it("prefers the newer preset when local and cloud share the same id", () => {
    const localPreset = createWorkflowPreset(makeSnapshot(), {
      id: "preset-shared",
      name: "USA Pack Hunt Starter",
      now: "2026-04-20T00:00:00.000Z",
    });
    const cloudPreset = createWorkflowPreset(
      makeSnapshot({ prey: "Mule Deer", fastPublishMode: false }),
      {
        id: "preset-shared",
        name: "USA Pack Hunt Starter",
        now: "2026-04-20T02:00:00.000Z",
      }
    );

    const localLibrary = buildLocalOnlyCloudPresetLibrary("team-usa", {
      presets: [localPreset],
      defaultPresetId: localPreset.id,
      updatedAt: "2026-04-20T00:00:00.000Z",
    });
    const cloudLibrary = buildLocalOnlyCloudPresetLibrary("team-usa", {
      presets: [cloudPreset],
      defaultPresetId: cloudPreset.id,
      updatedAt: "2026-04-20T02:00:00.000Z",
    });

    const report = mergeCloudPresetLibraries(localLibrary, cloudLibrary, {
      now: "2026-04-20T03:00:00.000Z",
    });

    expect(report.library.presets).toHaveLength(1);
    expect(report.library.presets[0].snapshot.prey).toBe("Mule Deer");
    expect(report.presetConflictCount).toBe(1);
    expect(report.conflictResolved).toBe(true);
  });

  it("renames name collisions safely when ids differ across local and cloud", () => {
    const localPreset = createWorkflowPreset(makeSnapshot(), {
      id: "preset-local",
      name: "USA Pack Hunt Starter",
      now: "2026-04-20T01:00:00.000Z",
    });
    const cloudPreset = createWorkflowPreset(
      makeSnapshot({ predator: "Coyote Pack" }),
      {
        id: "preset-cloud",
        name: "USA Pack Hunt Starter",
        now: "2026-04-20T00:00:00.000Z",
      }
    );

    const report = mergeCloudPresetLibraries(
      buildLocalOnlyCloudPresetLibrary("team-usa", {
        presets: [localPreset],
      }),
      buildLocalOnlyCloudPresetLibrary("team-usa", {
        presets: [cloudPreset],
      }),
      { now: "2026-04-20T03:00:00.000Z" }
    );

    expect(report.library.presets).toHaveLength(2);
    expect(report.presetRenameCount).toBe(1);
    expect(report.library.presets.map((preset) => preset.name)).toEqual([
      "USA Pack Hunt Starter",
      "USA Pack Hunt Starter (Synced)",
    ]);
  });

  it("falls back cleanly to the local library when no cloud data exists", () => {
    const preset = createWorkflowPreset(makeSnapshot(), {
      id: "preset-local-only",
      name: "Escape Fast Publish",
      now: "2026-04-20T00:00:00.000Z",
    });
    const localLibrary = buildLocalOnlyCloudPresetLibrary("team-usa", {
      presets: [preset],
      defaultPresetId: preset.id,
      updatedAt: "2026-04-20T00:00:00.000Z",
    });

    const report = mergeCloudPresetLibraries(localLibrary, null, {
      now: "2026-04-20T01:00:00.000Z",
    });

    expect(getCloudPresetLibraryFingerprint(report.library)).toBe(
      getCloudPresetLibraryFingerprint(localLibrary)
    );
    expect(report.conflictResolved).toBe(false);
    expect(report.library.defaultPresetId).toBe(preset.id);
  });

  it("keeps default preset ids safe and can fall back to a valid cloud default", () => {
    const localPreset = createWorkflowPreset(makeSnapshot(), {
      id: "preset-local",
      name: "USA Pack Hunt Starter",
      now: "2026-04-20T00:00:00.000Z",
    });
    const cloudPreset = createWorkflowPreset(
      makeSnapshot({ contentLane: "Escape", arc: "Escape from danger" }),
      {
        id: "preset-cloud-default",
        name: "Escape Fast Publish",
        now: "2026-04-20T02:00:00.000Z",
      }
    );

    const report = mergeCloudPresetLibraries(
      buildLocalOnlyCloudPresetLibrary("team-usa", {
        presets: [localPreset],
        defaultPresetId: "missing-local-default",
      }),
      buildLocalOnlyCloudPresetLibrary("team-usa", {
        presets: [cloudPreset],
        defaultPresetId: cloudPreset.id,
      }),
      { now: "2026-04-20T03:00:00.000Z" }
    );

    expect(report.library.defaultPresetId).toBe("preset-cloud-default");
    expect(report.usedCloudDefault).toBe(true);
  });

  it("merges preset packs compatibly alongside presets", () => {
    const sharedPreset = createWorkflowPreset(makeSnapshot(), {
      id: "preset-shared",
      name: "Rut Battle Cinematic",
      now: "2026-04-20T00:00:00.000Z",
    });
    const localPack = createWorkflowPresetPack([sharedPreset], {
      id: "pack-rut",
      name: "Rut Battle Cinematic Pack",
      description: "Older local version.",
      now: "2026-04-20T00:00:00.000Z",
    });
    const cloudPack = createWorkflowPresetPack([sharedPreset], {
      id: "pack-rut",
      name: "Rut Battle Cinematic Pack",
      description: "Newer cloud version.",
      tags: ["Rut Battle", "Cinematic"],
      now: "2026-04-20T02:00:00.000Z",
    });

    const report = mergeCloudPresetLibraries(
      buildLocalOnlyCloudPresetLibrary("team-usa", {
        presets: [sharedPreset],
        presetPacks: [localPack],
      }),
      buildLocalOnlyCloudPresetLibrary("team-usa", {
        presets: [sharedPreset],
        presetPacks: [cloudPack],
      }),
      { now: "2026-04-20T03:00:00.000Z" }
    );

    expect(report.library.presetPacks).toHaveLength(1);
    expect(report.library.presetPacks[0].description).toBe("Newer cloud version.");
    expect(report.library.presetPacks[0].tags).toEqual([
      "Rut Battle",
      "Cinematic",
    ]);
    expect(report.packConflictCount).toBe(1);
  });

  it("normalizes cloud library input safely and refuses invalid account ids", () => {
    const normalized = normalizeCloudPresetLibrary(
      {
        accountId: "TEAM-USA",
        presets: [],
        presetPacks: [],
        defaultPresetId: "missing",
      },
      { accountId: "fallback" }
    );

    expect(normalized?.accountId).toBe("team-usa");
    expect(normalized?.defaultPresetId).toBeUndefined();
    expect(normalizeCloudAccountId(" x ")).toBeUndefined();
  });
});
