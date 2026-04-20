import type {
  CloudPresetLibrary,
  CloudPresetLibraryMergeReport,
  SavedWorkflowPreset,
  SavedWorkflowPresetPack,
} from "@/types";

import {
  areWorkflowPresetSnapshotsEqual,
  buildWorkflowPresetName,
  getSafeDefaultWorkflowPresetId,
  normalizeWorkflowPresetPack,
  normalizeWorkflowPresetPacks,
  normalizeWorkflowPresets,
} from "@/lib/workflow-presets";

export const CLOUD_PRESET_LIBRARY_SCHEMA = "wstv.workflow-preset-library";
export const CLOUD_PRESET_LIBRARY_VERSION = 1;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function normalizeTimestamp(value: string | undefined): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function cleanAccountId(value: unknown): string {
  return cleanString(value).toLowerCase().slice(0, 120);
}

function getUniqueName(
  originalName: string,
  usedNames: Set<string>,
  suffixLabel: string
): string {
  const base = cleanString(originalName, suffixLabel);
  if (!usedNames.has(base)) {
    usedNames.add(base);
    return base;
  }

  let candidate = `${base} (${suffixLabel})`;
  let suffix = 2;
  while (usedNames.has(candidate)) {
    candidate = `${base} (${suffixLabel} ${suffix})`;
    suffix += 1;
  }

  usedNames.add(candidate);
  return candidate;
}

function sortByUpdatedAtDesc<T extends { updatedAt: string; createdAt?: string }>(
  a: T,
  b: T
): number {
  const updatedDelta = normalizeTimestamp(b.updatedAt) - normalizeTimestamp(a.updatedAt);
  if (updatedDelta !== 0) return updatedDelta;
  const createdDelta =
    normalizeTimestamp(b.createdAt) - normalizeTimestamp(a.createdAt);
  if (createdDelta !== 0) return createdDelta;
  return 0;
}

function serializeComparableValue(value: unknown): string {
  return JSON.stringify(value);
}

function chooseLatestPreset(
  localPreset: SavedWorkflowPreset,
  cloudPreset: SavedWorkflowPreset
): { preset: SavedWorkflowPreset; conflictResolved: boolean } {
  const localTime = normalizeTimestamp(localPreset.updatedAt);
  const cloudTime = normalizeTimestamp(cloudPreset.updatedAt);
  const sameSnapshot = areWorkflowPresetSnapshotsEqual(
    localPreset.snapshot,
    cloudPreset.snapshot
  );
  const sameName = localPreset.name === cloudPreset.name;

  if (cloudTime > localTime) {
    return {
      preset: cloudPreset,
      conflictResolved: !sameSnapshot || !sameName,
    };
  }

  if (localTime > cloudTime) {
    return {
      preset: localPreset,
      conflictResolved: !sameSnapshot || !sameName,
    };
  }

  return {
    preset:
      serializeComparableValue(cloudPreset).length >
      serializeComparableValue(localPreset).length
        ? cloudPreset
        : localPreset,
    conflictResolved: !sameSnapshot || !sameName,
  };
}

function chooseLatestPack(
  localPack: SavedWorkflowPresetPack,
  cloudPack: SavedWorkflowPresetPack
): { pack: SavedWorkflowPresetPack; conflictResolved: boolean } {
  const localTime = normalizeTimestamp(localPack.updatedAt);
  const cloudTime = normalizeTimestamp(cloudPack.updatedAt);
  const sameContent =
    serializeComparableValue(localPack.presets) ===
      serializeComparableValue(cloudPack.presets) &&
    localPack.name === cloudPack.name &&
    localPack.description === cloudPack.description &&
    serializeComparableValue(localPack.tags ?? []) ===
      serializeComparableValue(cloudPack.tags ?? []);

  if (cloudTime > localTime) {
    return { pack: cloudPack, conflictResolved: !sameContent };
  }

  if (localTime > cloudTime) {
    return { pack: localPack, conflictResolved: !sameContent };
  }

  return {
    pack:
      serializeComparableValue(cloudPack).length >
      serializeComparableValue(localPack).length
        ? cloudPack
        : localPack,
    conflictResolved: !sameContent,
  };
}

function resolvePresetNameCollisions(presets: SavedWorkflowPreset[]) {
  const usedNames = new Set<string>();
  let renamedCount = 0;

  const resolved = [...presets]
    .sort(sortByUpdatedAtDesc)
    .map((preset) => {
      const fallbackName = buildWorkflowPresetName(preset.snapshot);
      const nextName = getUniqueName(
        cleanString(preset.name, fallbackName),
        usedNames,
        "Synced"
      );
      if (nextName !== preset.name) renamedCount += 1;
      return nextName === preset.name ? preset : { ...preset, name: nextName };
    });

  return {
    presets: resolved,
    renamedCount,
  };
}

function resolvePackNameCollisions(packs: SavedWorkflowPresetPack[]) {
  const usedNames = new Set<string>();
  let renamedCount = 0;

  const resolved = [...packs]
    .sort(sortByUpdatedAtDesc)
    .map((pack) => {
      const nextName = getUniqueName(
        cleanString(pack.name, "Synced Preset Pack"),
        usedNames,
        "Synced"
      );
      if (nextName !== pack.name) renamedCount += 1;
      return nextName === pack.name ? pack : { ...pack, name: nextName };
    });

  return {
    packs: resolved,
    renamedCount,
  };
}

export function normalizeCloudPresetLibrary(
  value: unknown,
  options: { accountId?: string } = {}
): CloudPresetLibrary | null {
  if (!isRecord(value)) return null;

  const accountId = cleanAccountId(value.accountId ?? options.accountId);
  if (!accountId) return null;

  const presets = normalizeWorkflowPresets(value.presets);
  const presetPacks = normalizeWorkflowPresetPacks(value.presetPacks);
  const defaultPresetId = getSafeDefaultWorkflowPresetId(
    presets,
    cleanString(value.defaultPresetId) || undefined
  );

  return {
    schema: CLOUD_PRESET_LIBRARY_SCHEMA,
    version: CLOUD_PRESET_LIBRARY_VERSION,
    source: "wild-stories-tv-wstv",
    accountId,
    updatedAt: cleanString(value.updatedAt, new Date(0).toISOString()),
    ...(defaultPresetId ? { defaultPresetId } : {}),
    presets,
    presetPacks,
  };
}

export function createCloudPresetLibrary(
  accountId: string,
  input: {
    presets?: SavedWorkflowPreset[];
    presetPacks?: SavedWorkflowPresetPack[];
    defaultPresetId?: string;
    updatedAt?: string;
  } = {}
): CloudPresetLibrary {
  const safeAccountId = cleanAccountId(accountId);
  if (!safeAccountId) {
    throw new Error("Cloud preset library account ID is required");
  }

  const presets = normalizeWorkflowPresets(input.presets ?? []);
  const presetPacks = normalizeWorkflowPresetPacks(input.presetPacks ?? []);
  const defaultPresetId = getSafeDefaultWorkflowPresetId(
    presets,
    input.defaultPresetId
  );

  return {
    schema: CLOUD_PRESET_LIBRARY_SCHEMA,
    version: CLOUD_PRESET_LIBRARY_VERSION,
    source: "wild-stories-tv-wstv",
    accountId: safeAccountId,
    updatedAt: input.updatedAt ?? new Date().toISOString(),
    ...(defaultPresetId ? { defaultPresetId } : {}),
    presets,
    presetPacks,
  };
}

export function getCloudPresetLibraryFingerprint(
  library: Pick<CloudPresetLibrary, "defaultPresetId" | "presets" | "presetPacks">
): string {
  return JSON.stringify({
    defaultPresetId: library.defaultPresetId,
    presets: normalizeWorkflowPresets(library.presets),
    presetPacks: normalizeWorkflowPresetPacks(library.presetPacks),
  });
}

export function buildLocalOnlyCloudPresetLibrary(
  accountId: string,
  input: {
    presets?: SavedWorkflowPreset[];
    presetPacks?: SavedWorkflowPresetPack[];
    defaultPresetId?: string;
    updatedAt?: string;
  } = {}
): CloudPresetLibrary {
  return createCloudPresetLibrary(accountId, input);
}

export function mergeCloudPresetLibraries(
  localLibrary: CloudPresetLibrary,
  cloudLibrary: CloudPresetLibrary | null,
  options: { now?: string } = {}
): CloudPresetLibraryMergeReport {
  const normalizedLocal = createCloudPresetLibrary(localLibrary.accountId, localLibrary);
  const normalizedCloud =
    cloudLibrary && cleanAccountId(cloudLibrary.accountId) === normalizedLocal.accountId
      ? createCloudPresetLibrary(cloudLibrary.accountId, cloudLibrary)
      : null;

  if (!normalizedCloud) {
    return {
      library: normalizedLocal,
      presetConflictCount: 0,
      presetRenameCount: 0,
      packConflictCount: 0,
      packRenameCount: 0,
      conflictResolved: false,
      usedCloudDefault: false,
    };
  }

  const mergedPresetMap = new Map<string, SavedWorkflowPreset>();
  let presetConflictCount = 0;
  normalizedLocal.presets.forEach((preset) => {
    mergedPresetMap.set(preset.id, preset);
  });
  normalizedCloud.presets.forEach((cloudPreset) => {
    const localPreset = mergedPresetMap.get(cloudPreset.id);
    if (!localPreset) {
      mergedPresetMap.set(cloudPreset.id, cloudPreset);
      return;
    }

    const merged = chooseLatestPreset(localPreset, cloudPreset);
    if (merged.conflictResolved) presetConflictCount += 1;
    mergedPresetMap.set(cloudPreset.id, merged.preset);
  });

  const resolvedPresetNames = resolvePresetNameCollisions(
    Array.from(mergedPresetMap.values())
  );

  const mergedPackMap = new Map<string, SavedWorkflowPresetPack>();
  let packConflictCount = 0;
  normalizedLocal.presetPacks.forEach((pack) => {
    mergedPackMap.set(pack.id, pack);
  });
  normalizedCloud.presetPacks.forEach((cloudPack) => {
    const localPack = mergedPackMap.get(cloudPack.id);
    if (!localPack) {
      mergedPackMap.set(cloudPack.id, cloudPack);
      return;
    }

    const merged = chooseLatestPack(localPack, cloudPack);
    if (merged.conflictResolved) packConflictCount += 1;
    mergedPackMap.set(cloudPack.id, merged.pack);
  });

  const resolvedPackNames = resolvePackNameCollisions(
    Array.from(mergedPackMap.values())
  );

  const localDefaultPresetId = getSafeDefaultWorkflowPresetId(
    resolvedPresetNames.presets,
    normalizedLocal.defaultPresetId
  );
  const cloudDefaultPresetId = getSafeDefaultWorkflowPresetId(
    resolvedPresetNames.presets,
    normalizedCloud.defaultPresetId
  );
  const defaultPresetId = localDefaultPresetId ?? cloudDefaultPresetId;

  const library = createCloudPresetLibrary(normalizedLocal.accountId, {
    presets: resolvedPresetNames.presets,
    presetPacks: resolvedPackNames.packs.map((pack) => {
      const normalizedPack = normalizeWorkflowPresetPack({
        ...pack,
        presets: pack.presets,
      });
      return normalizedPack ?? pack;
    }),
    defaultPresetId,
    updatedAt:
      presetConflictCount > 0 ||
      resolvedPresetNames.renamedCount > 0 ||
      packConflictCount > 0 ||
      resolvedPackNames.renamedCount > 0 ||
      getCloudPresetLibraryFingerprint(normalizedLocal) !==
        getCloudPresetLibraryFingerprint(normalizedCloud)
        ? options.now ?? new Date().toISOString()
        : normalizedLocal.updatedAt > normalizedCloud.updatedAt
          ? normalizedLocal.updatedAt
          : normalizedCloud.updatedAt,
  });

  return {
    library,
    presetConflictCount,
    presetRenameCount: resolvedPresetNames.renamedCount,
    packConflictCount,
    packRenameCount: resolvedPackNames.renamedCount,
    conflictResolved:
      presetConflictCount > 0 ||
      resolvedPresetNames.renamedCount > 0 ||
      packConflictCount > 0 ||
      resolvedPackNames.renamedCount > 0,
    usedCloudDefault: !localDefaultPresetId && Boolean(cloudDefaultPresetId),
  };
}

export function normalizeCloudAccountId(value: unknown): string | undefined {
  const accountId = cleanAccountId(value);
  return accountId.length >= 3 ? accountId : undefined;
}
