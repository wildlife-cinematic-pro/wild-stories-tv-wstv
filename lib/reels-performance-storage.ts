import {
  HabitatRegion,
  StoryMode,
  ViralLane,
  type ReelPerformanceRecord,
} from "@/types";

const STORAGE_KEY = "wstv_reels_performance_v1";
const STORAGE_VERSION = 1;

export const REELS_PERFORMANCE_STORAGE_EVENT = "wstv:reels-performance-updated";

type StoredPayload = {
  version: number;
  records: unknown[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isEnumValue<T extends Record<string, string | number>>(
  enumObject: T,
  value: unknown
): value is T[keyof T] {
  return Object.values(enumObject).includes(value as T[keyof T]);
}

function optionalText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function optionalTextArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const cleaned = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  return cleaned.length ? cleaned : undefined;
}

function requiredNonNegativeNumber(value: unknown, fallback = 0): number {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : fallback;
}

function optionalNonNegativeNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : undefined;
}

function omitUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined)
  ) as T;
}

export function normalizeReelPerformanceRecord(
  value: unknown
): ReelPerformanceRecord | null {
  if (!isRecord(value)) return null;

  const id = optionalText(value.id);
  const generationId = optionalText(value.generationId);
  const createdAt = optionalText(value.createdAt);
  const updatedAt = optionalText(value.updatedAt);

  if (!id || !generationId || !createdAt || !updatedAt) return null;

  return omitUndefined({
    id,
    generationId,
    createdAt,
    updatedAt,
    postedAt: optionalText(value.postedAt),
    storyMode: isEnumValue(StoryMode, value.storyMode) ? value.storyMode : undefined,
    viralLane: isEnumValue(ViralLane, value.viralLane) ? value.viralLane : undefined,
    habitatRegion: isEnumValue(HabitatRegion, value.habitatRegion)
      ? value.habitatRegion
      : undefined,
    subjectA: optionalText(value.subjectA),
    subjectB: optionalText(value.subjectB),
    presetId: optionalText(value.presetId),
    presetName: optionalText(value.presetName),
    hookUsed: optionalText(value.hookUsed),
    captionUsed: optionalText(value.captionUsed),
    hashtagsUsed: optionalTextArray(value.hashtagsUsed),
    views: requiredNonNegativeNumber(value.views),
    threeSecondViews: optionalNonNegativeNumber(value.threeSecondViews),
    averageWatchTimeSeconds: optionalNonNegativeNumber(value.averageWatchTimeSeconds),
    durationSeconds: optionalNonNegativeNumber(value.durationSeconds),
    likes: requiredNonNegativeNumber(value.likes),
    comments: requiredNonNegativeNumber(value.comments),
    shares: requiredNonNegativeNumber(value.shares),
    saves: requiredNonNegativeNumber(value.saves),
    followsGained: optionalNonNegativeNumber(value.followsGained),
    notes: optionalText(value.notes),
  } satisfies ReelPerformanceRecord);
}

function parseStoredPayload(raw: string | null): StoredPayload | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return { version: STORAGE_VERSION, records: parsed };
    }
    if (!isRecord(parsed) || !Array.isArray(parsed.records)) return null;
    return {
      version: Number(parsed.version) || STORAGE_VERSION,
      records: parsed.records,
    };
  } catch {
    return null;
  }
}

function emitStorageEvent(): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new Event(REELS_PERFORMANCE_STORAGE_EVENT));
  } catch {}
}

export function readReelPerformanceRecords(): ReelPerformanceRecord[] {
  if (typeof localStorage === "undefined") return [];

  try {
    const payload = parseStoredPayload(localStorage.getItem(STORAGE_KEY));
    if (!payload) return [];
    return payload.records
      .map((record) => normalizeReelPerformanceRecord(record))
      .filter((record): record is ReelPerformanceRecord => Boolean(record))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    return [];
  }
}

export function writeReelPerformanceRecords(
  records: ReelPerformanceRecord[]
): void {
  if (typeof localStorage === "undefined") return;

  try {
    const normalized = records
      .map((record) => normalizeReelPerformanceRecord(record))
      .filter((record): record is ReelPerformanceRecord => Boolean(record));

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: STORAGE_VERSION, records: normalized })
    );
    emitStorageEvent();
  } catch {}
}

export function upsertReelPerformanceRecord(
  record: ReelPerformanceRecord
): ReelPerformanceRecord | null {
  const normalized = normalizeReelPerformanceRecord(record);
  if (!normalized) return null;

  const existing = readReelPerformanceRecords();
  const next = [
    normalized,
    ...existing.filter((candidate) => candidate.id !== normalized.id),
  ];
  writeReelPerformanceRecords(next);
  return normalized;
}

export function deleteReelPerformanceRecord(id: string): void {
  const trimmedId = id.trim();
  if (!trimmedId) return;
  writeReelPerformanceRecords(
    readReelPerformanceRecords().filter((record) => record.id !== trimmedId)
  );
}

export function findReelPerformanceByGenerationId(
  generationId: string
): ReelPerformanceRecord | null {
  const trimmedGenerationId = generationId.trim();
  if (!trimmedGenerationId) return null;

  return (
    readReelPerformanceRecords().find(
      (record) => record.generationId === trimmedGenerationId
    ) ?? null
  );
}
