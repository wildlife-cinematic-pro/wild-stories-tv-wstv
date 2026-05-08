import {
  HabitatRegion,
  StoryMode,
  ViralLane,
  type ABExperimentRecord,
  type ABExperimentVariantRecord,
} from "@/types";

const STORAGE_KEY = "wstv_ab_experiments_v1";
const STORAGE_VERSION = 1;

export const AB_EXPERIMENT_STORAGE_EVENT = "wstv:ab-experiments-updated";

type StoredPayload = {
  version: number;
  records: unknown[];
};

const VARIANT_LABELS = new Set(["A", "B", "C"]);
const STATUS_VALUES = new Set(["planned", "running", "completed"]);

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

function requiredText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function optionalTextArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const cleaned = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  return cleaned.length ? cleaned : undefined;
}

function requiredTextArray(value: unknown): string[] {
  return optionalTextArray(value) ?? [];
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

export function normalizeABExperimentVariantRecord(
  value: unknown
): ABExperimentVariantRecord | null {
  if (!isRecord(value)) return null;

  const label = optionalText(value.label);
  const hook = requiredText(value.hook);
  const caption = requiredText(value.caption);
  const testFocus = requiredText(value.testFocus);
  const expectedSignal = requiredText(value.expectedSignal);

  if (!label || !VARIANT_LABELS.has(label) || !hook || !caption || !testFocus || !expectedSignal) {
    return null;
  }

  return omitUndefined({
    label: label as ABExperimentVariantRecord["label"],
    hook,
    caption,
    hashtags: requiredTextArray(value.hashtags).slice(0, 5),
    testFocus,
    expectedSignal,
    views: optionalNonNegativeNumber(value.views),
    threeSecondViews: optionalNonNegativeNumber(value.threeSecondViews),
    averageWatchTimeSeconds: optionalNonNegativeNumber(value.averageWatchTimeSeconds),
    durationSeconds: optionalNonNegativeNumber(value.durationSeconds),
    likes: optionalNonNegativeNumber(value.likes),
    comments: optionalNonNegativeNumber(value.comments),
    shares: optionalNonNegativeNumber(value.shares),
    saves: optionalNonNegativeNumber(value.saves),
    followsGained: optionalNonNegativeNumber(value.followsGained),
    notes: optionalText(value.notes),
  } satisfies ABExperimentVariantRecord);
}

export function normalizeABExperimentRecord(value: unknown): ABExperimentRecord | null {
  if (!isRecord(value)) return null;

  const id = requiredText(value.id);
  const generationId = requiredText(value.generationId);
  const createdAt = requiredText(value.createdAt);
  const updatedAt = requiredText(value.updatedAt);
  const title = requiredText(value.title);
  const hypothesis = requiredText(value.hypothesis);
  const rawVariants = Array.isArray(value.variants) ? value.variants : [];
  const variants = rawVariants
    .map((variant) => normalizeABExperimentVariantRecord(variant))
    .filter((variant): variant is ABExperimentVariantRecord => Boolean(variant));

  if (!id || !generationId || !createdAt || !updatedAt || !title || !hypothesis || variants.length === 0) {
    return null;
  }

  const winnerLabel = optionalText(value.winnerLabel);
  const status = optionalText(value.status);

  return omitUndefined({
    id,
    generationId,
    createdAt,
    updatedAt,
    title,
    hypothesis,
    storyMode: isEnumValue(StoryMode, value.storyMode) ? value.storyMode : undefined,
    viralLane: isEnumValue(ViralLane, value.viralLane) ? value.viralLane : undefined,
    habitatRegion: isEnumValue(HabitatRegion, value.habitatRegion)
      ? value.habitatRegion
      : undefined,
    subjectA: optionalText(value.subjectA),
    subjectB: optionalText(value.subjectB),
    presetId: optionalText(value.presetId),
    presetName: optionalText(value.presetName),
    variants,
    winnerLabel:
      winnerLabel && VARIANT_LABELS.has(winnerLabel)
        ? (winnerLabel as ABExperimentRecord["winnerLabel"])
        : undefined,
    status:
      status && STATUS_VALUES.has(status)
        ? (status as ABExperimentRecord["status"])
        : "planned",
  } satisfies ABExperimentRecord);
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
    window.dispatchEvent(new Event(AB_EXPERIMENT_STORAGE_EVENT));
  } catch {}
}

export function readABExperimentRecords(): ABExperimentRecord[] {
  if (typeof localStorage === "undefined") return [];

  try {
    const payload = parseStoredPayload(localStorage.getItem(STORAGE_KEY));
    if (!payload) return [];
    return payload.records
      .map((record) => normalizeABExperimentRecord(record))
      .filter((record): record is ABExperimentRecord => Boolean(record))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    return [];
  }
}

export function writeABExperimentRecords(records: ABExperimentRecord[]): void {
  if (typeof localStorage === "undefined") return;

  try {
    const normalized = records
      .map((record) => normalizeABExperimentRecord(record))
      .filter((record): record is ABExperimentRecord => Boolean(record));

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: STORAGE_VERSION, records: normalized })
    );
    emitStorageEvent();
  } catch {}
}

export function upsertABExperimentRecord(
  record: ABExperimentRecord
): ABExperimentRecord | null {
  const normalized = normalizeABExperimentRecord(record);
  if (!normalized) return null;

  const existing = readABExperimentRecords();
  const next = [
    normalized,
    ...existing.filter((candidate) => candidate.id !== normalized.id),
  ];
  writeABExperimentRecords(next);
  return normalized;
}

export function deleteABExperimentRecord(id: string): void {
  const trimmedId = id.trim();
  if (!trimmedId) return;
  writeABExperimentRecords(
    readABExperimentRecords().filter((record) => record.id !== trimmedId)
  );
}

export function findABExperimentByGenerationId(
  generationId: string
): ABExperimentRecord | null {
  const trimmedGenerationId = generationId.trim();
  if (!trimmedGenerationId) return null;

  return (
    readABExperimentRecords().find(
      (record) => record.generationId === trimmedGenerationId
    ) ?? null
  );
}
