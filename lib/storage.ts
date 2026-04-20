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
  WorkflowPresetCloudSession,
  PromptVersion,
  AIProvider,
  ContentLane,
  RunwayModel,
  KlingModel,
  RealismMode,
  ShareState,
  Weather,
  DepthMode,
  PredatorInfo,
  CustomPredatorForm,
  HabitatPreset,
} from "@/types";

import { weatherOptions, depthModes, habitatOptions } from "@/lib/model-specs";
import { contentLaneOptions, isContentLane } from "@/lib/content-lanes";
import {
  getSafeDefaultWorkflowPresetId,
  normalizeWorkflowPresetPacks,
  normalizeWorkflowPresets,
} from "@/lib/workflow-presets";

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
const WORKFLOW_PRESET_CLOUD_SESSION_KEY = "wildlife_workflow_preset_cloud_session_v1";

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
  habitat?: HabitatPreset;
  contentLane?: ContentLane;
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
  const defaultArc = typeof obj.defaultArc === "string" ? obj.defaultArc.trim() : "Ambush attack";
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
      defaultArc: typeof info?.defaultArc === "string" ? info.defaultArc : "Ambush attack",
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

export function readWorkflowPresetCloudSession():
  | WorkflowPresetCloudSession
  | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(WORKFLOW_PRESET_CLOUD_SESSION_KEY);
    const parsed = raw ? safeJsonParse<unknown>(raw) : null;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return undefined;
    }

    const record = parsed as Record<string, unknown>;
    const accountId =
      typeof record.accountId === "string" ? record.accountId.trim() : "";
    if (!accountId) return undefined;

    return {
      accountId,
      connectedAt:
        typeof record.connectedAt === "string"
          ? record.connectedAt
          : new Date(0).toISOString(),
    };
  } catch {
    return undefined;
  }
}

export function writeWorkflowPresetCloudSession(
  session: WorkflowPresetCloudSession | undefined
): void {
  if (typeof window === "undefined") return;
  try {
    if (!session?.accountId) {
      localStorage.removeItem(WORKFLOW_PRESET_CLOUD_SESSION_KEY);
      return;
    }

    localStorage.setItem(
      WORKFLOW_PRESET_CLOUD_SESSION_KEY,
      JSON.stringify(session)
    );
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

/** Read predator / prey / arc / weather / depth from URL params */
export function readShareState(): Partial<ShareState> {
  if (typeof window === "undefined") return {};
  const sp = new URLSearchParams(window.location.search);
  const w = sp.get(QS.weather);
  const d = sp.get(QS.depth);
  const h = sp.get(QS.habitat);
  const cl = sp.get(QS.contentLane);

  return {
    predator: sp.get(QS.predator) ?? undefined,
    prey: sp.get(QS.prey) ?? undefined,
    arc: sp.get(QS.arc) ?? undefined,
    weather: w && isWeather(w) ? w : undefined,
    depthMode: d && isDepth(d) ? d : undefined,
    habitat: h && isHabitatPreset(h) ? h : undefined,
    contentLane: cl && isContentLane(cl) ? cl : undefined,
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
