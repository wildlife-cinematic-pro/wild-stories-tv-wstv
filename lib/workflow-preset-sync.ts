import type {
  CloudPresetLibrary,
  CloudPresetLibraryMergeReport,
  SavedWorkflowPreset,
  SavedWorkflowPresetPack,
  WorkflowPresetAuthUser,
  WorkflowPresetLibraryRecord,
  WorkflowPresetLibraryRole,
  WorkflowPresetSharedLibraryMember,
  WorkflowPresetSharedLibraryStoredRecord,
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
export const CLOUD_PRESET_LIBRARY_VERSION = 2;

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

function cleanEmail(value: unknown): string {
  return cleanString(value).toLowerCase().slice(0, 160);
}

function normalizeMemberRole(value: unknown): WorkflowPresetLibraryRole | undefined {
  return value === "owner" || value === "editor" || value === "viewer"
    ? value
    : undefined;
}

function normalizeSharedLibraryMembers(
  value: unknown,
  ownerUserId: string
): WorkflowPresetSharedLibraryMember[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  return value
    .map((item) => {
      if (!isRecord(item)) return null;

      const userId = cleanString(item.userId).slice(0, 120);
      const email = cleanEmail(item.email);
      const role =
        userId === ownerUserId
          ? "owner"
          : normalizeMemberRole(item.role) ?? "viewer";
      if (!userId || !email) return null;

      return {
        userId,
        email,
        role,
        addedAt: cleanString(item.addedAt, new Date(0).toISOString()),
      };
    })
    .filter(
      (member): member is WorkflowPresetSharedLibraryMember => Boolean(member)
    )
    .filter((member) => {
      if (seen.has(member.userId)) return false;
      seen.add(member.userId);
      return true;
    })
    .sort((a, b) => {
      if (a.role === "owner" && b.role !== "owner") return -1;
      if (b.role === "owner" && a.role !== "owner") return 1;
      return a.email.localeCompare(b.email);
    });
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

export function normalizeCloudLibraryId(value: unknown): string | undefined {
  const libraryId = cleanString(value)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  return libraryId.length >= 3 ? libraryId : undefined;
}

export function buildPersonalCloudLibraryId(userId: string): string {
  const safeUserId = normalizeCloudLibraryId(userId);
  if (!safeUserId) {
    throw new Error("A valid user id is required to build the personal library id.");
  }
  return `personal_${safeUserId}`;
}

export function normalizeWorkflowPresetLibraryRole(
  value: unknown,
  fallback: WorkflowPresetLibraryRole = "viewer"
): WorkflowPresetLibraryRole {
  return normalizeMemberRole(value) ?? fallback;
}

export function canWriteWorkflowPresetLibrary(
  role: WorkflowPresetLibraryRole
): boolean {
  return role === "owner" || role === "editor";
}

export function canManageWorkflowPresetLibrary(
  role: WorkflowPresetLibraryRole
): boolean {
  return role === "owner";
}

export function normalizeCloudPresetLibrary(
  value: unknown,
  options: { libraryId?: string } = {}
): CloudPresetLibrary | null {
  if (!isRecord(value)) return null;

  const libraryId = normalizeCloudLibraryId(value.libraryId ?? options.libraryId);
  if (!libraryId) return null;

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
    libraryId,
    updatedAt: cleanString(value.updatedAt, new Date(0).toISOString()),
    ...(defaultPresetId ? { defaultPresetId } : {}),
    presets,
    presetPacks,
  };
}

export function createCloudPresetLibrary(
  libraryId: string,
  input: {
    presets?: SavedWorkflowPreset[];
    presetPacks?: SavedWorkflowPresetPack[];
    defaultPresetId?: string;
    updatedAt?: string;
  } = {}
): CloudPresetLibrary {
  const safeLibraryId = normalizeCloudLibraryId(libraryId);
  if (!safeLibraryId) {
    throw new Error("Cloud preset library id is required");
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
    libraryId: safeLibraryId,
    updatedAt: input.updatedAt ?? new Date().toISOString(),
    ...(defaultPresetId ? { defaultPresetId } : {}),
    presets,
    presetPacks,
  };
}

export function buildLocalOnlyCloudPresetLibrary(
  libraryId: string,
  input: {
    presets?: SavedWorkflowPreset[];
    presetPacks?: SavedWorkflowPresetPack[];
    defaultPresetId?: string;
    updatedAt?: string;
  } = {}
): CloudPresetLibrary {
  return createCloudPresetLibrary(libraryId, input);
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

export function mergeCloudPresetLibraries(
  localLibrary: CloudPresetLibrary,
  cloudLibrary: CloudPresetLibrary | null,
  options: { now?: string } = {}
): CloudPresetLibraryMergeReport {
  const normalizedLocal = createCloudPresetLibrary(
    localLibrary.libraryId,
    localLibrary
  );
  const normalizedCloud =
    cloudLibrary && cloudLibrary.libraryId === normalizedLocal.libraryId
      ? createCloudPresetLibrary(cloudLibrary.libraryId, cloudLibrary)
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

  const library = createCloudPresetLibrary(normalizedLocal.libraryId, {
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

export function getSharedLibraryMember(
  members: WorkflowPresetSharedLibraryMember[] | undefined,
  userId: string
): WorkflowPresetSharedLibraryMember | undefined {
  return members?.find((member) => member.userId === userId);
}

export function normalizeWorkflowPresetSharedStoredRecord(
  value: unknown
): WorkflowPresetSharedLibraryStoredRecord | null {
  if (!isRecord(value)) return null;

  const id = normalizeCloudLibraryId(value.id);
  const ownerUserId = normalizeCloudLibraryId(value.ownerUserId);
  if (!id || !ownerUserId) return null;

  const data = normalizeCloudPresetLibrary(value.data, { libraryId: id });
  if (!data) return null;

  const members = normalizeSharedLibraryMembers(value.members, ownerUserId);
  const ownerMember =
    getSharedLibraryMember(members, ownerUserId) ??
    ({
      userId: ownerUserId,
      email: cleanEmail(value.ownerEmail),
      role: "owner",
      addedAt: cleanString(value.createdAt, new Date(0).toISOString()),
    } satisfies WorkflowPresetSharedLibraryMember);

  return {
    id,
    scope: "shared",
    name: cleanString(value.name, "Shared Library"),
    description: cleanString(value.description),
    createdAt: cleanString(value.createdAt, new Date(0).toISOString()),
    updatedAt: cleanString(value.updatedAt, new Date(0).toISOString()),
    ownerUserId,
    members: [ownerMember, ...members.filter((member) => member.userId !== ownerUserId)],
    data,
  };
}

export function buildPersonalWorkflowPresetLibraryRecord(
  user: WorkflowPresetAuthUser,
  library: CloudPresetLibrary
): WorkflowPresetLibraryRecord {
  return {
    id: library.libraryId,
    scope: "personal",
    name: "My Library",
    description: `Personal preset library for ${user.displayName || user.email}.`,
    createdAt: user.createdAt,
    updatedAt: library.updatedAt,
    role: "owner",
    canWrite: true,
    canManage: false,
    ownerUserId: user.id,
    data: library,
  };
}

export function buildSharedWorkflowPresetLibraryRecord(
  storedRecord: WorkflowPresetSharedLibraryStoredRecord,
  userId: string
): WorkflowPresetLibraryRecord | null {
  const member =
    storedRecord.ownerUserId === userId
      ? {
          userId,
          email:
            getSharedLibraryMember(storedRecord.members, userId)?.email ?? "",
          role: "owner" as const,
          addedAt: storedRecord.createdAt,
        }
      : getSharedLibraryMember(storedRecord.members, userId);
  if (!member) return null;

  return {
    id: storedRecord.id,
    scope: "shared",
    name: storedRecord.name,
    description: storedRecord.description,
    createdAt: storedRecord.createdAt,
    updatedAt: storedRecord.updatedAt,
    role: member.role,
    canWrite: canWriteWorkflowPresetLibrary(member.role),
    canManage: canManageWorkflowPresetLibrary(member.role),
    ownerUserId: storedRecord.ownerUserId,
    members: storedRecord.members,
    data: storedRecord.data,
  };
}

