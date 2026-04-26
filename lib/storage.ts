// ─────────────────────────────────────────────────────────────
// lib/storage.ts
// WSTV — localStorage, URL Share State & Download Utilities
//
// Contains:
//   • Storage keys + limits
//   • safeJsonParse, newId
//   • History read/write
//   • Settings read/write
//   • Custom predators read/write (list + auto-migrate from old map format)
//   • Favorites read/write
//   • Prompt versions read/write
//   • URL share state (readShareState, writeShareState, buildShareLink)
//   • Download helpers (downloadText, downloadJson)
//
// RULES:
//   • No React. No useState. No UI imports.
//   • All localStorage calls wrapped in try/catch — never throws.
//   • SSR safe — all window/localStorage calls guarded with
//     typeof window !== "undefined".
// ─────────────────────────────────────────────────────────────

import type {
  HistoryEntry,
  SavedPrompt,
  SavedWorkflowPreset,
  SavedWorkflowPresetPack,
  PromptVersion,
  AIProvider,
  CameraAnglePreset,
  ContentLane,
  DurationLane,
  HookFamily,
  RunwayModel,
  KlingModel,
  RealismMode,
  ShareState,
  Weather,
  DepthMode,
  PredatorInfo,
  CustomPredatorForm,
  HabitatPreset,
  PipelineStyle,
  WildlifeScopeMode,
  BuildWorkflowPresetSnapshot,
  GeneratedPackage,
  PackageLockState,
  RealGenerationEvidenceNotes,
  RealGenerationEvidenceRecommendation,
  RealGenerationEvidenceRecord,
  RealGenerationEvidenceScores,
  PerformanceTrackerEntry,
} from "@/types";
import type { PublishFlowSummary } from "@/lib/build-package";

import { weatherOptions, depthModes, habitatOptions } from "@/lib/model-specs";
import { contentLaneOptions, isContentLane } from "@/lib/content-lanes";
import { normalizeArcValue } from "@/lib/page-build-helpers";
import {
  cameraAnglePresetOptions,
  isCameraAnglePreset,
} from "@/lib/camera-angle-presets";
import { createDefaultPackageLockState } from "@/lib/package-section-locks";
import {
  clampRealGenerationEvidenceScore,
  createEmptyRealGenerationEvidenceNotes,
  calculateRealGenerationEvidenceOverallScore,
  normalizeRealGenerationEvidenceAttachments,
  sortRealGenerationEvidenceRecords,
  suggestRealGenerationEvidenceRecommendation,
} from "@/lib/real-generation-evidence";
import {
  getSafeDefaultWorkflowPresetId,
  normalizeWorkflowPresetPacks,
  normalizeWorkflowPresetSnapshot,
  normalizeWorkflowPresets,
} from "@/lib/workflow-presets";
import { normalizePerformanceTrackerEntry } from "@/lib/performance-tracker";

// ─────────────────────────────────────────────────────────────
// KEYS & LIMITS
// ─────────────────────────────────────────────────────────────
const HISTORY_KEY = "wildlife_history_v2";
const SETTINGS_KEY = "wildlife_settings_v3";
const CUSTOM_PREDATORS_KEY = "wildlife_custom_predators_v1";
const FAVORITES_KEY = "wildlife_favorites_v1";
const VERSIONS_KEY = "wildlife_versions_v1";
const WORKFLOW_PRESETS_KEY = "wildlife_workflow_presets_v1";
const WORKFLOW_PRESET_PACKS_KEY = "wildlife_workflow_preset_packs_v1";
const DEFAULT_WORKFLOW_PRESET_KEY = "wildlife_default_workflow_preset_v1";
const WORKFLOW_PRESET_LIBRARY_SELECTION_KEY =
  "wildlife_workflow_preset_library_selection_v1";
const LAST_GENERATED_OUTPUT_KEY = "wildlife_last_generated_output_v1";
const REAL_GENERATION_EVIDENCE_KEY = "wildlife_real_generation_evidence_v1";
const MONETIZED_PAGE_PERFORMANCE_KEY = "wildlife_monetized_page_performance_v1";

export const MAX_HISTORY = 20;
export const MAX_FAVORITES = 50;

// ─────────────────────────────────────────────────────────────
// CORE HELPERS
// ─────────────────────────────────────────────────────────────

/** Safe JSON parse — returns null on any error, never throws */
export function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Unique ID — timestamp (base-36) + random suffix */
export function newId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

// ─────────────────────────────────────────────────────────────
// HISTORY
// ─────────────────────────────────────────────────────────────

export function readHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? safeJsonParse<HistoryEntry[]>(raw) ?? [] : [];
  } catch {
    return [];
  }
}

export function writeHistory(entries: HistoryEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)));
  } catch {}
}

// ─────────────────────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────────────────────

export type StoredSettings = {
  activeProvider?: AIProvider;
  runwayModel?: RunwayModel;
  klingModel?: KlingModel;

  // Quality toggles — optional, persist if you want them sticky
  realismMode?: RealismMode;
  motionOnlyI2V?: boolean;
  referenceLock?: boolean;
  singleActionRule?: boolean;
  microMotion?: boolean;
  heroVeo?: boolean;
  autoApplyHighDrift?: boolean;
  durationLane?: DurationLane;
  hookMode?: HookFamily | "all";
  fastPublishMode?: boolean;
  strictOriginalityGuard?: boolean;
  habitat?: HabitatPreset;
  contentLane?: ContentLane;
  cameraAnglePreset?: CameraAnglePreset;
  wildlifeScopeMode?: WildlifeScopeMode;
};

export function readSettings(): StoredSettings {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? safeJsonParse<StoredSettings>(raw) ?? {} : {};
  } catch {
    return {};
  }
}

export function writeSettings(settings: StoredSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}

// ─────────────────────────────────────────────────────────────
// CUSTOM PREDATORS
// Preferred storage format: CustomPredatorForm[]
// Backward-compat: supports old map format Record<string, PredatorInfo>
// ─────────────────────────────────────────────────────────────

function isDriftRisk(x: unknown): x is "LOW" | "MEDIUM" | "HIGH" {
  return x === "LOW" || x === "MEDIUM" || x === "HIGH";
}

function normalizeCustomPredatorForm(x: unknown): CustomPredatorForm | null {
  if (!x || typeof x !== "object") return null;
  const obj = x as Record<string, unknown>;

  const name = typeof obj.name === "string" ? obj.name.trim() : "";
  if (!name) return null;

  const prey = typeof obj.prey === "string" ? obj.prey.trim() : "Deer";
  const environment = typeof obj.environment === "string" ? obj.environment.trim() : "Savanna";
  const defaultArc = normalizeArcValue(obj.defaultArc, "Ambush attack");
  const driftRisk = isDriftRisk(obj.driftRisk) ? obj.driftRisk : "MEDIUM";

  return { name, prey, environment, defaultArc, driftRisk };
}

function mapToCustomList(map: Record<string, unknown>): CustomPredatorForm[] {
  // map is Record<animalName, PredatorInfo-ish>
  const out: CustomPredatorForm[] = [];
  for (const [nameRaw, v] of Object.entries(map)) {
    const name = String(nameRaw ?? "").trim();
    if (!name) continue;

    const info = v as Partial<PredatorInfo> | undefined;
    const preyArr = Array.isArray(info?.prey) ? info?.prey : [];
    const prey = preyArr.length ? preyArr.join(", ") : "Deer";

    out.push({
      name,
      prey,
      environment: typeof info?.environment === "string" ? info.environment : "Savanna",
      defaultArc: normalizeArcValue(info?.defaultArc, "Ambush attack"),
      driftRisk: isDriftRisk(info?.driftRisk) ? info!.driftRisk! : "MEDIUM",
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Read custom predators as a LIST (CustomPredatorForm[]).
 * If storage contains old MAP format, auto-migrates to list and rewrites storage.
 */
export function readCustomPredators(): CustomPredatorForm[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_PREDATORS_KEY);
    if (!raw) return [];

    const parsed = safeJsonParse<unknown>(raw);
    if (!parsed) return [];

    // New format: array of forms
    if (Array.isArray(parsed)) {
      return parsed
        .map(normalizeCustomPredatorForm)
        .filter((x): x is CustomPredatorForm => Boolean(x));
    }

    // Old format: map object
    if (parsed && typeof parsed === "object") {
      const list = mapToCustomList(parsed as Record<string, unknown>);
      // migrate
      try {
        localStorage.setItem(CUSTOM_PREDATORS_KEY, JSON.stringify(list));
      } catch {}
      return list;
    }

    return [];
  } catch {
    return [];
  }
}

/** Write custom predators as LIST (CustomPredatorForm[]). */
export function writeCustomPredators(list: CustomPredatorForm[]): void {
  if (typeof window === "undefined") return;
  try {
    const cleaned = list
      .map(normalizeCustomPredatorForm)
      .filter((x): x is CustomPredatorForm => Boolean(x))
      .sort((a, b) => a.name.localeCompare(b.name));
    localStorage.setItem(CUSTOM_PREDATORS_KEY, JSON.stringify(cleaned));
  } catch {}
}

/**
 * Backward-compat helper:
 * Read as MAP (Record<string, PredatorInfo-ish>).
 * Only use if some legacy code still expects map format.
 */
export function readCustomPredatorMap<T extends Record<string, unknown>>(): T {
  if (typeof window === "undefined") return {} as T;
  try {
    const raw = localStorage.getItem(CUSTOM_PREDATORS_KEY);
    if (!raw) return {} as T;
    const parsed = safeJsonParse<unknown>(raw);

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as T;
    }
    // if list is stored, return empty map (caller should migrate)
    return {} as T;
  } catch {
    return {} as T;
  }
}

/**
 * Backward-compat helper:
 * Write MAP format.
 * Prefer writeCustomPredators(list) going forward.
 */
export function writeCustomPredatorMap(data: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CUSTOM_PREDATORS_KEY, JSON.stringify(data));
  } catch {}
}

// ─────────────────────────────────────────────────────────────
// WORKFLOW PRESETS
// ─────────────────────────────────────────────────────────────

export function readWorkflowPresets(): SavedWorkflowPreset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WORKFLOW_PRESETS_KEY);
    return raw ? normalizeWorkflowPresets(safeJsonParse<unknown>(raw)) : [];
  } catch {
    return [];
  }
}

export function writeWorkflowPresets(presets: SavedWorkflowPreset[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      WORKFLOW_PRESETS_KEY,
      JSON.stringify(normalizeWorkflowPresets(presets))
    );
  } catch {}
}

export function readDefaultWorkflowPresetId(
  presets: SavedWorkflowPreset[] = readWorkflowPresets()
): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(DEFAULT_WORKFLOW_PRESET_KEY);
    return getSafeDefaultWorkflowPresetId(presets, raw);
  } catch {
    return undefined;
  }
}

export function writeDefaultWorkflowPresetId(id: string | undefined): void {
  if (typeof window === "undefined") return;
  try {
    if (id) {
      localStorage.setItem(DEFAULT_WORKFLOW_PRESET_KEY, id);
    } else {
      localStorage.removeItem(DEFAULT_WORKFLOW_PRESET_KEY);
    }
  } catch {}
}

export function readWorkflowPresetPacks(): SavedWorkflowPresetPack[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WORKFLOW_PRESET_PACKS_KEY);
    return raw ? normalizeWorkflowPresetPacks(safeJsonParse<unknown>(raw)) : [];
  } catch {
    return [];
  }
}

export function writeWorkflowPresetPacks(
  packs: SavedWorkflowPresetPack[]
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      WORKFLOW_PRESET_PACKS_KEY,
      JSON.stringify(normalizeWorkflowPresetPacks(packs))
    );
  } catch {}
}

export function readWorkflowPresetLibrarySelection(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(WORKFLOW_PRESET_LIBRARY_SELECTION_KEY);
    return typeof raw === "string" && raw.trim() ? raw.trim() : undefined;
  } catch {
    return undefined;
  }
}

export function writeWorkflowPresetLibrarySelection(
  libraryId: string | undefined
): void {
  if (typeof window === "undefined") return;
  try {
    if (libraryId) {
      localStorage.setItem(WORKFLOW_PRESET_LIBRARY_SELECTION_KEY, libraryId);
    } else {
      localStorage.removeItem(WORKFLOW_PRESET_LIBRARY_SELECTION_KEY);
    }
  } catch {}
}



const REAL_GENERATION_EVIDENCE_SCHEMA = "wstv.real-generation-evidence";
const MAX_REAL_GENERATION_EVIDENCE_RECORDS = 30;

type RealGenerationEvidenceStore = {
  schema: typeof REAL_GENERATION_EVIDENCE_SCHEMA;
  version: 1;
  records: RealGenerationEvidenceRecord[];
};

function isRealGenerationEvidenceRecommendation(
  value: unknown
): value is RealGenerationEvidenceRecommendation {
  return value === "keep" || value === "retry-with-fixes" || value === "retry";
}

function isPipelineStyle(value: unknown): value is PipelineStyle {
  return value === "4-shot" || value === "long-hybrid-4-shot";
}

function normalizeRealGenerationEvidenceScores(
  value: unknown
): RealGenerationEvidenceScores | null {
  if (!isObjectRecord(value)) return null;

  return {
    firstFrameReadability: clampRealGenerationEvidenceScore(Number(value.firstFrameReadability)),
    spacingClarity: clampRealGenerationEvidenceScore(Number(value.spacingClarity)),
    worldLightingContinuity: clampRealGenerationEvidenceScore(Number(value.worldLightingContinuity)),
    anatomyPhysicsRealism: clampRealGenerationEvidenceScore(Number(value.anatomyPhysicsRealism)),
    actionReadability: clampRealGenerationEvidenceScore(Number(value.actionReadability)),
    facebookOpeningStrength: clampRealGenerationEvidenceScore(Number(value.facebookOpeningStrength)),
  };
}

function normalizeRealGenerationEvidenceNotes(
  value: unknown
): RealGenerationEvidenceNotes {
  if (!isObjectRecord(value)) return createEmptyRealGenerationEvidenceNotes();

  return {
    strongPoints: typeof value.strongPoints === "string" ? value.strongPoints.trim() : "",
    driftObserved: typeof value.driftObserved === "string" ? value.driftObserved.trim() : "",
    failedPoints: typeof value.failedPoints === "string" ? value.failedPoints.trim() : "",
    retryPlan: typeof value.retryPlan === "string" ? value.retryPlan.trim() : "",
    masterStill: typeof value.masterStill === "string" ? value.masterStill.trim() : "",
    runway: typeof value.runway === "string" ? value.runway.trim() : "",
    kling: typeof value.kling === "string" ? value.kling.trim() : "",
    seedance: typeof value.seedance === "string" ? value.seedance.trim() : "",
  };
}

function normalizeRealGenerationEvidenceRecord(
  value: unknown
): RealGenerationEvidenceRecord | null {
  if (!isObjectRecord(value)) return null;

  const id = typeof value.id === "string" ? value.id.trim() : "";
  const generationId = typeof value.generationId === "string" ? value.generationId.trim() : "";
  const generationLabel =
    typeof value.generationLabel === "string" ? value.generationLabel.trim() : "";
  const capturedAt = typeof value.capturedAt === "string" ? value.capturedAt.trim() : "";
  const predatorName = typeof value.predatorName === "string" ? value.predatorName.trim() : "";
  const preyName = typeof value.preyName === "string" ? value.preyName.trim() : "";
  const arcName = typeof value.arcName === "string" ? value.arcName.trim() : "";
  const scores = normalizeRealGenerationEvidenceScores(value.scores);

  if (!id || !generationId || !generationLabel || !capturedAt || !predatorName || !preyName || !arcName || !scores) {
    return null;
  }

  const suggestedRecommendation = isRealGenerationEvidenceRecommendation(
    value.suggestedRecommendation
  )
    ? value.suggestedRecommendation
    : suggestRealGenerationEvidenceRecommendation(scores);
  const userRecommendation = isRealGenerationEvidenceRecommendation(value.userRecommendation)
    ? value.userRecommendation
    : suggestedRecommendation;
  const overallScore = Number.isFinite(Number(value.overallScore))
    ? Math.max(0, Math.min(100, Math.round(Number(value.overallScore))))
    : calculateRealGenerationEvidenceOverallScore(scores);
  const attachments = normalizeRealGenerationEvidenceAttachments(value.attachments);

  return {
    id,
    generationId,
    generationLabel,
    generatedAt: typeof value.generatedAt === "string" ? value.generatedAt.trim() : undefined,
    capturedAt,
    predatorName,
    preyName,
    arcName,
    pipelineStyle: isPipelineStyle(value.pipelineStyle) ? value.pipelineStyle : undefined,
    scores,
    overallScore,
    suggestedRecommendation,
    userRecommendation,
    notes: normalizeRealGenerationEvidenceNotes(value.notes),
    attachments: attachments.length > 0 ? attachments : undefined,
  };
}

function normalizeRealGenerationEvidenceStore(
  value: unknown
): RealGenerationEvidenceStore | null {
  if (!isObjectRecord(value)) return null;
  if (value.schema !== REAL_GENERATION_EVIDENCE_SCHEMA || value.version !== 1) {
    return null;
  }
  if (!Array.isArray(value.records)) return null;

  const records = sortRealGenerationEvidenceRecords(
    value.records
      .map((entry) => normalizeRealGenerationEvidenceRecord(entry))
      .filter((entry): entry is RealGenerationEvidenceRecord => Boolean(entry))
  ).slice(0, MAX_REAL_GENERATION_EVIDENCE_RECORDS);

  if (value.records.length > 0 && records.length === 0) {
    return null;
  }

  return {
    schema: REAL_GENERATION_EVIDENCE_SCHEMA,
    version: 1,
    records,
  };
}

export function readRealGenerationEvidenceHistory(): RealGenerationEvidenceRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(REAL_GENERATION_EVIDENCE_KEY);
    if (!raw) return [];

    const normalized = normalizeRealGenerationEvidenceStore(safeJsonParse<unknown>(raw));
    if (!normalized) {
      localStorage.removeItem(REAL_GENERATION_EVIDENCE_KEY);
      return [];
    }

    return normalized.records;
  } catch {
    return [];
  }
}

export function writeRealGenerationEvidenceHistory(
  records: RealGenerationEvidenceRecord[]
): void {
  if (typeof window === "undefined") return;
  try {
    const cleaned = sortRealGenerationEvidenceRecords(
      records
        .map((record) => normalizeRealGenerationEvidenceRecord(record))
        .filter((record): record is RealGenerationEvidenceRecord => Boolean(record))
    ).slice(0, MAX_REAL_GENERATION_EVIDENCE_RECORDS);

    localStorage.setItem(
      REAL_GENERATION_EVIDENCE_KEY,
      JSON.stringify({
        schema: REAL_GENERATION_EVIDENCE_SCHEMA,
        version: 1,
        records: cleaned,
      } satisfies RealGenerationEvidenceStore)
    );
  } catch {}
}

export function readRealGenerationEvidenceForGeneration(
  generationId: string
): RealGenerationEvidenceRecord | undefined {
  const cleanId = generationId.trim();
  if (!cleanId) return undefined;
  return readRealGenerationEvidenceHistory().find(
    (record) => record.generationId === cleanId
  );
}

export function upsertRealGenerationEvidenceRecord(
  record: RealGenerationEvidenceRecord
): void {
  const cleaned = normalizeRealGenerationEvidenceRecord(record);
  if (!cleaned) return;

  const next = [
    cleaned,
    ...readRealGenerationEvidenceHistory().filter(
      (entry) => entry.generationId !== cleaned.generationId
    ),
  ];

  writeRealGenerationEvidenceHistory(next);
}

type MonetizedPagePerformanceStore = {
  schema: "wstv.monetized-page-performance";
  version: 1;
  records: PerformanceTrackerEntry[];
};

const MONETIZED_PAGE_PERFORMANCE_SCHEMA = "wstv.monetized-page-performance";
const MAX_MONETIZED_PAGE_PERFORMANCE_RECORDS = 100;

/** Normalizes the monetized performance store payload from localStorage. */
function normalizeMonetizedPagePerformanceStore(
  value: unknown
): MonetizedPagePerformanceStore | null {
  if (!isObjectRecord(value)) return null;
  if (value.schema !== MONETIZED_PAGE_PERFORMANCE_SCHEMA || value.version !== 1) {
    return null;
  }
  if (!Array.isArray(value.records)) return null;

  const records = value.records
    .map((record) => normalizePerformanceTrackerEntry(record))
    .filter((record) => Boolean(record.generationId || record.postUrl || record.title || record.animalPair))
    .slice(0, MAX_MONETIZED_PAGE_PERFORMANCE_RECORDS);

  return {
    schema: MONETIZED_PAGE_PERFORMANCE_SCHEMA,
    version: 1,
    records,
  };
}

/** Reads the locally stored monetized Facebook performance records. */
export function readMonetizedPagePerformanceHistory(): PerformanceTrackerEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MONETIZED_PAGE_PERFORMANCE_KEY);
    if (!raw) return [];

    const normalized = normalizeMonetizedPagePerformanceStore(safeJsonParse<unknown>(raw));
    if (!normalized) {
      localStorage.removeItem(MONETIZED_PAGE_PERFORMANCE_KEY);
      return [];
    }

    return normalized.records;
  } catch {
    return [];
  }
}

/** Writes the locally stored monetized Facebook performance history. */
export function writeMonetizedPagePerformanceHistory(
  records: PerformanceTrackerEntry[]
): void {
  if (typeof window === "undefined") return;
  try {
    const cleaned = records
      .map((record) => normalizePerformanceTrackerEntry(record))
      .filter((record) => Boolean(record.generationId || record.postUrl || record.title || record.animalPair))
      .slice(0, MAX_MONETIZED_PAGE_PERFORMANCE_RECORDS);

    localStorage.setItem(
      MONETIZED_PAGE_PERFORMANCE_KEY,
      JSON.stringify({
        schema: MONETIZED_PAGE_PERFORMANCE_SCHEMA,
        version: 1,
        records: cleaned,
      } satisfies MonetizedPagePerformanceStore)
    );
  } catch {}
}

/** Reads the locally stored monetized performance record for one generation. */
export function readMonetizedPagePerformanceForGeneration(
  generationId: string
): PerformanceTrackerEntry | undefined {
  const cleanId = generationId.trim();
  if (!cleanId) return undefined;
  return readMonetizedPagePerformanceHistory().find(
    (record) => record.generationId === cleanId
  );
}

/** Upserts one locally stored monetized performance record for the current generation. */
export function upsertMonetizedPagePerformanceRecord(
  record: PerformanceTrackerEntry
): void {
  const cleaned = normalizePerformanceTrackerEntry(record);
  const cleanId = cleaned.generationId?.trim();
  if (!cleanId) return;

  const next = [
    cleaned,
    ...readMonetizedPagePerformanceHistory().filter(
      (entry) => entry.generationId !== cleanId
    ),
  ];

  writeMonetizedPagePerformanceHistory(next);
}

export type LastGeneratedOutputRecord = {
  schema: "wstv.last-generated-output";
  version: 1;
  storedAt: string;
  snapshot: BuildWorkflowPresetSnapshot;
  pkg: GeneratedPackage;
  publishFlowSummary: PublishFlowSummary | null;
  packageLocks: PackageLockState;
};

export const LAST_GENERATED_OUTPUT_WRITE_DEBOUNCE_MS = 250;

export function createLastGeneratedOutputDebouncer(
  write: (record: LastGeneratedOutputRecord) => void,
  delayMs = LAST_GENERATED_OUTPUT_WRITE_DEBOUNCE_MS
) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return {
    schedule(record: LastGeneratedOutputRecord) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        timeoutId = null;
        write(record);
      }, delayMs);
    },
    cancel() {
      if (!timeoutId) return;
      clearTimeout(timeoutId);
      timeoutId = null;
    },
  };
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeGeneratedPackage(value: unknown): GeneratedPackage | null {
  if (!isObjectRecord(value)) return null;

  const pkg = value as GeneratedPackage;
  if (
    typeof pkg.imagePrompt !== "string" ||
    typeof pkg.hook !== "string" ||
    typeof pkg.caption !== "string"
  ) {
    return null;
  }

  return pkg;
}

function normalizePublishFlowSummary(
  value: unknown
): PublishFlowSummary | null {
  if (!isObjectRecord(value)) return null;

  const summary = value as PublishFlowSummary;
  if (
    typeof summary.predatorName !== "string" ||
    typeof summary.preyName !== "string" ||
    typeof summary.primaryHook !== "string" ||
    !isObjectRecord(summary.usAudienceScore) ||
    !isObjectRecord(summary.openingFrameScore) ||
    !isObjectRecord(summary.publishGuardReport)
  ) {
    return null;
  }

  return summary;
}

function normalizeLastGeneratedOutput(
  value: unknown
): LastGeneratedOutputRecord | null {
  if (!isObjectRecord(value)) return null;
  if (value.schema !== "wstv.last-generated-output" || value.version !== 1) {
    return null;
  }

  const storedAt = typeof value.storedAt === "string" ? value.storedAt.trim() : "";
  const snapshot = normalizeWorkflowPresetSnapshot(value.snapshot);
  const pkg = normalizeGeneratedPackage(value.pkg);

  if (!storedAt || !snapshot || !pkg) return null;

  return {
    schema: "wstv.last-generated-output",
    version: 1,
    storedAt,
    snapshot,
    pkg,
    publishFlowSummary: normalizePublishFlowSummary(value.publishFlowSummary),
    packageLocks: createDefaultPackageLockState(
      isObjectRecord(value.packageLocks)
        ? (value.packageLocks as Partial<PackageLockState>)
        : undefined
    ),
  };
}

export function readLastGeneratedOutput(): LastGeneratedOutputRecord | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(LAST_GENERATED_OUTPUT_KEY);
    if (!raw) return undefined;

    const normalized = normalizeLastGeneratedOutput(safeJsonParse<unknown>(raw));
    if (!normalized) {
      localStorage.removeItem(LAST_GENERATED_OUTPUT_KEY);
      return undefined;
    }

    return normalized;
  } catch {
    return undefined;
  }
}

export function writeLastGeneratedOutput(record: LastGeneratedOutputRecord): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LAST_GENERATED_OUTPUT_KEY, JSON.stringify(record));
  } catch {}
}

export function clearLastGeneratedOutput(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LAST_GENERATED_OUTPUT_KEY);
  } catch {}
}

// ─────────────────────────────────────────────────────────────
// FAVORITES
// ─────────────────────────────────────────────────────────────

export function readFavorites(): SavedPrompt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? safeJsonParse<SavedPrompt[]>(raw) ?? [] : [];
  } catch {
    return [];
  }
}

export function writeFavorites(favorites: SavedPrompt[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites.slice(0, MAX_FAVORITES)));
  } catch {}
}

// ─────────────────────────────────────────────────────────────
// PROMPT VERSIONS
// Stored as Record<"predator|prey", PromptVersion[]>
// ─────────────────────────────────────────────────────────────

export function readPromptVersions(): Record<string, PromptVersion[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(VERSIONS_KEY);
    return raw ? safeJsonParse<Record<string, PromptVersion[]>>(raw) ?? {} : {};
  } catch {
    return {};
  }
}

export function writePromptVersions(versions: Record<string, PromptVersion[]>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(VERSIONS_KEY, JSON.stringify(versions));
  } catch {}
}

// ─────────────────────────────────────────────────────────────
// URL SHARE STATE
// Short query param keys keep URLs clean.
// ─────────────────────────────────────────────────────────────
const QS = {
  predator: "p",
  prey: "r",
  arc: "a",
  weather: "w",
  depth: "d",
  habitat: "h",
  contentLane: "cl",
  cameraAnglePreset: "ca",
} as const;

function isWeather(x: string): x is Weather {
  return (weatherOptions as string[]).includes(x);
}

function isDepth(x: string): x is DepthMode {
  return (depthModes as string[]).includes(x);
}

function isHabitatPreset(x: string): x is HabitatPreset {
  return (habitatOptions as readonly string[]).includes(x);
}

export function hasShareStateInUrl(): boolean {
  if (typeof window === "undefined") return false;
  const sp = new URLSearchParams(window.location.search);
  return Object.values(QS).some((key) => sp.has(key));
}

export function shareStateMatchesWorkflowSnapshot(
  shared: Partial<ShareState>,
  snapshot: BuildWorkflowPresetSnapshot
): boolean {
  return (
    (!shared.predator || shared.predator === snapshot.predator) &&
    (!shared.prey || shared.prey === snapshot.prey) &&
    (!shared.arc || shared.arc === snapshot.arc) &&
    (!shared.weather || shared.weather === snapshot.weather) &&
    (!shared.depthMode || shared.depthMode === snapshot.depthMode) &&
    (!shared.habitat || shared.habitat === snapshot.habitat) &&
    (!shared.contentLane || shared.contentLane === snapshot.contentLane) &&
    (!shared.cameraAnglePreset ||
      shared.cameraAnglePreset === snapshot.cameraAnglePreset)
  );
}

/** Read predator / prey / arc / weather / depth from URL params */
export function readShareState(): Partial<ShareState> {
  if (typeof window === "undefined") return {};
  const sp = new URLSearchParams(window.location.search);
  const w = sp.get(QS.weather);
  const d = sp.get(QS.depth);
  const h = sp.get(QS.habitat);
  const cl = sp.get(QS.contentLane);
  const ca = sp.get(QS.cameraAnglePreset);

  return {
    predator: sp.get(QS.predator) ?? undefined,
    prey: sp.get(QS.prey) ?? undefined,
    arc: sp.get(QS.arc) ?? undefined,
    weather: w && isWeather(w) ? w : undefined,
    depthMode: d && isDepth(d) ? d : undefined,
    habitat: h && isHabitatPreset(h) ? h : undefined,
    contentLane: cl && isContentLane(cl) ? cl : undefined,
    cameraAnglePreset: ca && isCameraAnglePreset(ca) ? ca : undefined,
  };
}

/** Write current state to URL without page reload */
export function writeShareState(state: ShareState): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  const sp = url.searchParams;
  const sod = (k: string, v: string) => (v ? sp.set(k, v) : sp.delete(k));

  sod(QS.predator, state.predator);
  sod(QS.prey, state.prey);
  sod(QS.arc, state.arc);
  sod(QS.weather, state.weather);
  sod(QS.depth, state.depthMode);
  sod(QS.habitat, state.habitat);
  sod(QS.contentLane, state.contentLane);
  sod(QS.cameraAnglePreset, state.cameraAnglePreset);

  window.history.replaceState(null, "", url.toString());
}

/** Build a full shareable URL for the current state */
export function buildShareLink(state: ShareState): string {
  if (typeof window === "undefined") return "";
  const url = new URL(window.location.href);
  url.search = "";
  const sp = url.searchParams;

  if (state.predator) sp.set(QS.predator, state.predator);
  if (state.prey) sp.set(QS.prey, state.prey);
  if (state.arc) sp.set(QS.arc, state.arc);
  if (state.weather) sp.set(QS.weather, state.weather);
  if (state.depthMode) sp.set(QS.depth, state.depthMode);
  if (state.habitat) sp.set(QS.habitat, state.habitat);
  if (state.contentLane && (contentLaneOptions as readonly string[]).includes(state.contentLane)) {
    sp.set(QS.contentLane, state.contentLane);
  }
  if (
    state.cameraAnglePreset &&
    (cameraAnglePresetOptions as readonly string[]).includes(state.cameraAnglePreset)
  ) {
    sp.set(QS.cameraAnglePreset, state.cameraAnglePreset);
  }

  return url.toString();
}
// ─────────────────────────────────────────────────────────────
// DOWNLOAD HELPERS  (client-side only)
// ─────────────────────────────────────────────────────────────

/** Trigger a browser download of any object as a .json file */
export function downloadJson(filename: string, data: unknown): void {
  if (typeof window === "undefined") return; // ✅ SSR guard
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = window.URL.createObjectURL(blob);
  const a = window.document.createElement("a");
  a.href = url;
  a.download = filename;
  window.document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

/** Trigger a browser download of any text as a .txt file */
export function downloadText(filename: string, text: string): void {
  if (typeof window === "undefined") return; // ✅ SSR guard
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const a = window.document.createElement("a");
  a.href = url;
  a.download = filename;
  window.document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
