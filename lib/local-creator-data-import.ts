import {
  normalizeABExperimentRecord,
  readABExperimentRecords,
  writeABExperimentRecords,
} from "@/lib/ab-experiment-storage";
import type { LocalCreatorDataExport } from "@/lib/local-creator-data-export";
import {
  normalizeReelPerformanceRecord,
  readReelPerformanceRecords,
  writeReelPerformanceRecords,
} from "@/lib/reels-performance-storage";
import type { ABExperimentRecord, ReelPerformanceRecord } from "@/types";

export type LocalCreatorDataRestoreOptions = {
  mode: "merge" | "replace";
};

export type LocalCreatorDataImportPayload = Pick<
  LocalCreatorDataExport,
  "schemaVersion" | "source" | "performanceRecords" | "abExperiments"
> &
  Partial<Pick<LocalCreatorDataExport, "exportedAt" | "note">>;

export type LocalCreatorDataValidationResult = {
  ok: boolean;
  payload?: LocalCreatorDataImportPayload;
  performanceRecords: ReelPerformanceRecord[];
  abExperiments: ABExperimentRecord[];
  errors: string[];
  warnings: string[];
};

export type LocalCreatorDataRestoreResult = LocalCreatorDataValidationResult & {
  mode: LocalCreatorDataRestoreOptions["mode"];
  restoredPerformanceRecords: number;
  restoredABExperiments: number;
  totalPerformanceRecords: number;
  totalABExperiments: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mergeById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  const byId = new Map<string, T>();
  for (const record of existing) byId.set(record.id, record);
  for (const record of incoming) byId.set(record.id, record);
  return Array.from(byId.values()).sort((a, b) => {
    const aUpdated = "updatedAt" in a && typeof a.updatedAt === "string" ? a.updatedAt : "";
    const bUpdated = "updatedAt" in b && typeof b.updatedAt === "string" ? b.updatedAt : "";
    return bUpdated.localeCompare(aUpdated);
  });
}

export function parseLocalCreatorDataImport(jsonText: string): unknown {
  const trimmed = jsonText.trim();
  if (!trimmed) {
    throw new Error("Paste a Local Data JSON export before restoring.");
  }
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    throw new Error("Local Data JSON could not be parsed. Check that the full export was pasted.");
  }
}

export function validateLocalCreatorDataImport(
  payload: unknown
): LocalCreatorDataValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isRecord(payload)) {
    return {
      ok: false,
      performanceRecords: [],
      abExperiments: [],
      errors: ["Import payload must be a JSON object."],
      warnings,
    };
  }

  if (payload.schemaVersion !== 1) {
    errors.push("Unsupported Local Data JSON schema version.");
  }
  if (payload.source !== "wstv-local-browser") {
    errors.push("This does not look like a WSTV local browser export.");
  }
  if (!Array.isArray(payload.performanceRecords)) {
    errors.push("Missing performanceRecords array.");
  }
  if (!Array.isArray(payload.abExperiments)) {
    errors.push("Missing abExperiments array.");
  }

  const rawPerformanceRecords = Array.isArray(payload.performanceRecords)
    ? payload.performanceRecords
    : [];
  const rawABExperiments = Array.isArray(payload.abExperiments)
    ? payload.abExperiments
    : [];

  const performanceRecords = rawPerformanceRecords
    .map((record) => normalizeReelPerformanceRecord(record))
    .filter((record): record is ReelPerformanceRecord => Boolean(record));
  const abExperiments = rawABExperiments
    .map((record) => normalizeABExperimentRecord(record))
    .filter((record): record is ABExperimentRecord => Boolean(record));

  const droppedPerformanceRecords = rawPerformanceRecords.length - performanceRecords.length;
  const droppedABExperiments = rawABExperiments.length - abExperiments.length;
  if (droppedPerformanceRecords > 0) {
    warnings.push(String(droppedPerformanceRecords) + " malformed performance record(s) will be skipped.");
  }
  if (droppedABExperiments > 0) {
    warnings.push(String(droppedABExperiments) + " malformed A/B experiment(s) will be skipped.");
  }
  if (!performanceRecords.length && !abExperiments.length) {
    errors.push("No valid performance records or A/B experiments were found.");
  }

  return {
    ok: errors.length === 0,
    payload: payload as LocalCreatorDataImportPayload,
    performanceRecords,
    abExperiments,
    errors,
    warnings,
  };
}

export function restoreLocalCreatorDataFromJson(
  jsonText: string,
  options: LocalCreatorDataRestoreOptions
): LocalCreatorDataRestoreResult {
  const parsed = parseLocalCreatorDataImport(jsonText);
  const validation = validateLocalCreatorDataImport(parsed);

  if (!validation.ok) {
    return {
      ...validation,
      mode: options.mode,
      restoredPerformanceRecords: 0,
      restoredABExperiments: 0,
      totalPerformanceRecords: readReelPerformanceRecords().length,
      totalABExperiments: readABExperimentRecords().length,
    };
  }

  const nextPerformanceRecords =
    options.mode === "replace"
      ? validation.performanceRecords
      : mergeById(readReelPerformanceRecords(), validation.performanceRecords);
  const nextABExperiments =
    options.mode === "replace"
      ? validation.abExperiments
      : mergeById(readABExperimentRecords(), validation.abExperiments);

  writeReelPerformanceRecords(nextPerformanceRecords);
  writeABExperimentRecords(nextABExperiments);

  return {
    ...validation,
    mode: options.mode,
    restoredPerformanceRecords: validation.performanceRecords.length,
    restoredABExperiments: validation.abExperiments.length,
    totalPerformanceRecords: nextPerformanceRecords.length,
    totalABExperiments: nextABExperiments.length,
  };
}
