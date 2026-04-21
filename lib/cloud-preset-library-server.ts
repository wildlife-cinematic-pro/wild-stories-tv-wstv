import { get, put } from "@vercel/blob";

import type {
  CloudPresetLibrary,
  WorkflowPresetAuthUser,
  WorkflowPresetLibraryRole,
  WorkflowPresetSharedLibraryStoredRecord,
} from "@/types";

import { readPresetLibraryUserByEmail } from "@/lib/preset-library-auth-server";
import {
  buildPersonalCloudLibraryId,
  canManageWorkflowPresetLibrary,
  createCloudPresetLibrary,
  normalizeCloudLibraryId,
  normalizeCloudPresetLibrary,
  normalizeWorkflowPresetLibraryRole,
  normalizeWorkflowPresetSharedStoredRecord,
} from "@/lib/workflow-preset-sync";

type StoredUserSharedLibraryIndex = {
  userId: string;
  libraryIds: string[];
  updatedAt: string;
};

function getBlobToken(): string | undefined {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  return token || undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function normalizeUserId(value: unknown): string | undefined {
  const userId = cleanString(value)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  return userId.length >= 3 ? userId : undefined;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function makeSharedLibraryId(name: string, now = Date.now()): string {
  const slug = slugify(name) || "shared-library";
  return `library_${slug}_${now.toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function getPersonalLibraryPathname(userId: string): string {
  return `workflow-preset-libraries/v2/personal/${userId}.json`;
}

function getSharedLibraryPathname(libraryId: string): string {
  return `workflow-preset-libraries/v2/shared/${libraryId}.json`;
}

function getUserSharedLibraryIndexPathname(userId: string): string {
  return `workflow-preset-libraries/v2/access/${userId}.json`;
}

async function readJsonBlob(pathname: string): Promise<unknown> {
  const token = getBlobToken();
  if (!token) return null;

  const result = await get(pathname, {
    access: "private",
    token,
    useCache: false,
  });

  if (!result || result.statusCode !== 200 || !result.stream) {
    return null;
  }

  const raw = await new Response(result.stream).text();
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

async function writeJsonBlob(pathname: string, value: unknown): Promise<void> {
  const token = getBlobToken();
  if (!token) {
    throw new Error("Cloud preset library backend is not configured.");
  }

  await put(pathname, JSON.stringify(value, null, 2), {
    access: "private",
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType: "application/json",
    token,
  });
}

function normalizeSharedLibraryIndex(
  value: unknown
): StoredUserSharedLibraryIndex | null {
  if (!isRecord(value)) return null;

  const userId = normalizeUserId(value.userId);
  if (!userId) return null;

  return {
    userId,
    libraryIds: Array.isArray(value.libraryIds)
      ? value.libraryIds
          .map((item) => normalizeCloudLibraryId(item))
          .filter((item): item is string => Boolean(item))
      : [],
    updatedAt: cleanString(value.updatedAt, new Date(0).toISOString()),
  };
}

async function readUserSharedLibraryIndex(
  userId: string
): Promise<StoredUserSharedLibraryIndex> {
  const safeUserId = normalizeUserId(userId);
  if (!safeUserId) {
    return {
      userId: "",
      libraryIds: [],
      updatedAt: new Date(0).toISOString(),
    };
  }

  return (
    normalizeSharedLibraryIndex(
      await readJsonBlob(getUserSharedLibraryIndexPathname(safeUserId))
    ) ?? {
      userId: safeUserId,
      libraryIds: [],
      updatedAt: new Date(0).toISOString(),
    }
  );
}

async function writeUserSharedLibraryIndex(
  userId: string,
  libraryIds: string[]
): Promise<void> {
  const safeUserId = normalizeUserId(userId);
  if (!safeUserId) return;

  const nextIds = Array.from(
    new Set(
      libraryIds
        .map((item) => normalizeCloudLibraryId(item))
        .filter((item): item is string => Boolean(item))
    )
  );

  await writeJsonBlob(getUserSharedLibraryIndexPathname(safeUserId), {
    userId: safeUserId,
    libraryIds: nextIds,
    updatedAt: new Date().toISOString(),
  } satisfies StoredUserSharedLibraryIndex);
}

export function isCloudPresetLibraryConfigured(): boolean {
  return Boolean(getBlobToken());
}

export async function readPersonalPresetLibraryFromStore(
  userId: string
): Promise<CloudPresetLibrary | null> {
  const safeUserId = normalizeUserId(userId);
  const libraryId = safeUserId ? buildPersonalCloudLibraryId(safeUserId) : undefined;
  if (!safeUserId || !libraryId) return null;

  return normalizeCloudPresetLibrary(
    await readJsonBlob(getPersonalLibraryPathname(safeUserId)),
    { libraryId }
  );
}

export async function writePersonalPresetLibraryToStore(
  userId: string,
  library: CloudPresetLibrary
): Promise<CloudPresetLibrary> {
  const safeUserId = normalizeUserId(userId);
  if (!safeUserId) {
    throw new Error("A valid user id is required.");
  }

  const normalizedLibrary = createCloudPresetLibrary(
    buildPersonalCloudLibraryId(safeUserId),
    {
      presets: library.presets,
      presetPacks: library.presetPacks,
      defaultPresetId: library.defaultPresetId,
      updatedAt: new Date().toISOString(),
    }
  );

  await writeJsonBlob(getPersonalLibraryPathname(safeUserId), normalizedLibrary);
  return normalizedLibrary;
}

export async function readSharedPresetLibraryFromStore(
  libraryId: string
): Promise<WorkflowPresetSharedLibraryStoredRecord | null> {
  const safeLibraryId = normalizeCloudLibraryId(libraryId);
  if (!safeLibraryId) return null;

  return normalizeWorkflowPresetSharedStoredRecord(
    await readJsonBlob(getSharedLibraryPathname(safeLibraryId))
  );
}

export async function writeSharedPresetLibraryToStore(
  record: WorkflowPresetSharedLibraryStoredRecord
): Promise<WorkflowPresetSharedLibraryStoredRecord> {
  const normalized = normalizeWorkflowPresetSharedStoredRecord(record);
  if (!normalized) {
    throw new Error("Shared preset library payload is invalid.");
  }

  const nextRecord: WorkflowPresetSharedLibraryStoredRecord = {
    ...normalized,
    updatedAt: new Date().toISOString(),
    data: createCloudPresetLibrary(normalized.id, {
      presets: normalized.data.presets,
      presetPacks: normalized.data.presetPacks,
      defaultPresetId: normalized.data.defaultPresetId,
      updatedAt: new Date().toISOString(),
    }),
  };

  await writeJsonBlob(getSharedLibraryPathname(nextRecord.id), nextRecord);
  return nextRecord;
}

export async function listSharedPresetLibrariesForUser(
  userId: string
): Promise<WorkflowPresetSharedLibraryStoredRecord[]> {
  const safeUserId = normalizeUserId(userId);
  if (!safeUserId) return [];

  const index = await readUserSharedLibraryIndex(safeUserId);
  const libraries = await Promise.all(
    index.libraryIds.map((libraryId) => readSharedPresetLibraryFromStore(libraryId))
  );

  return libraries
    .filter(
      (library): library is WorkflowPresetSharedLibraryStoredRecord =>
        library !== null
    )
    .filter(
      (library) =>
        library.ownerUserId === safeUserId ||
        library.members.some((member) => member.userId === safeUserId)
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function createSharedPresetLibraryInStore(
  owner: WorkflowPresetAuthUser,
  input: { name: string; description?: string }
): Promise<WorkflowPresetSharedLibraryStoredRecord> {
  const safeOwnerUserId = normalizeUserId(owner.id);
  if (!safeOwnerUserId) {
    throw new Error("A valid owner user id is required.");
  }

  const name = cleanString(input.name, "Shared Library").slice(0, 80);
  const description = cleanString(input.description).slice(0, 240);
  const now = new Date().toISOString();
  const libraryId = makeSharedLibraryId(name);

  const record: WorkflowPresetSharedLibraryStoredRecord = {
    id: libraryId,
    scope: "shared",
    name,
    description,
    createdAt: now,
    updatedAt: now,
    ownerUserId: safeOwnerUserId,
    members: [
      {
        userId: safeOwnerUserId,
        email: owner.email,
        role: "owner",
        addedAt: now,
      },
    ],
    data: createCloudPresetLibrary(libraryId, {
      presets: [],
      presetPacks: [],
      updatedAt: now,
    }),
  };

  await writeSharedPresetLibraryToStore(record);
  const ownerIndex = await readUserSharedLibraryIndex(safeOwnerUserId);
  await writeUserSharedLibraryIndex(safeOwnerUserId, [
    ...ownerIndex.libraryIds,
    libraryId,
  ]);

  return record;
}

export async function upsertSharedPresetLibraryMemberInStore(
  libraryId: string,
  input: { email: string; role: WorkflowPresetLibraryRole }
): Promise<WorkflowPresetSharedLibraryStoredRecord> {
  const library = await readSharedPresetLibraryFromStore(libraryId);
  if (!library) {
    throw new Error("Shared preset library was not found.");
  }

  const user = await readPresetLibraryUserByEmail(input.email);
  if (!user) {
    throw new Error("That user does not exist yet. Ask them to create an account first.");
  }

  const nextRole = normalizeWorkflowPresetLibraryRole(input.role, "viewer");
  const now = new Date().toISOString();
  const nextMembers = [...library.members];
  const existingIndex = nextMembers.findIndex((member) => member.userId === user.id);

  if (existingIndex >= 0) {
    const existing = nextMembers[existingIndex];
    nextMembers[existingIndex] =
      existing.role === "owner"
        ? existing
        : {
            ...existing,
            role: nextRole,
          };
  } else {
    nextMembers.push({
      userId: user.id,
      email: user.email,
      role: nextRole,
      addedAt: now,
    });
  }

  const saved = await writeSharedPresetLibraryToStore({
    ...library,
    members: nextMembers,
  });
  const userIndex = await readUserSharedLibraryIndex(user.id);
  await writeUserSharedLibraryIndex(user.id, [...userIndex.libraryIds, saved.id]);
  return saved;
}

export async function removeSharedPresetLibraryMemberFromStore(
  libraryId: string,
  memberUserId: string
): Promise<WorkflowPresetSharedLibraryStoredRecord> {
  const library = await readSharedPresetLibraryFromStore(libraryId);
  const safeMemberUserId = normalizeUserId(memberUserId);
  if (!library || !safeMemberUserId) {
    throw new Error("Shared preset library member could not be removed.");
  }
  if (library.ownerUserId === safeMemberUserId) {
    throw new Error("The library owner cannot be removed.");
  }

  const saved = await writeSharedPresetLibraryToStore({
    ...library,
    members: library.members.filter((member) => member.userId !== safeMemberUserId),
  });

  const memberIndex = await readUserSharedLibraryIndex(safeMemberUserId);
  await writeUserSharedLibraryIndex(
    safeMemberUserId,
    memberIndex.libraryIds.filter((id) => id !== saved.id)
  );

  return saved;
}

export async function assertSharedLibraryOwner(
  libraryId: string,
  userId: string
): Promise<WorkflowPresetSharedLibraryStoredRecord> {
  const library = await readSharedPresetLibraryFromStore(libraryId);
  const safeUserId = normalizeUserId(userId);
  if (!library || !safeUserId || library.ownerUserId !== safeUserId) {
    throw new Error("Only the library owner can manage access.");
  }
  return library;
}

export async function assertSharedLibraryWriteAccess(
  libraryId: string,
  userId: string
): Promise<WorkflowPresetSharedLibraryStoredRecord> {
  const library = await readSharedPresetLibraryFromStore(libraryId);
  const safeUserId = normalizeUserId(userId);
  if (!library || !safeUserId) {
    throw new Error("Shared preset library was not found.");
  }

  const member =
    library.ownerUserId === safeUserId
      ? {
          userId: safeUserId,
          email: "",
          role: "owner" as const,
          addedAt: library.createdAt,
        }
      : library.members.find((item) => item.userId === safeUserId);

  if (!member || !canManageWorkflowPresetLibrary(member.role) && member.role !== "editor") {
    throw new Error("You do not have permission to edit this shared library.");
  }

  return library;
}
