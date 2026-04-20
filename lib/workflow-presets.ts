import type {
  AIProvider,
  AnimalVibe,
  Arc,
  BuildWorkflowPresetSnapshot,
  ContentLane,
  DepthMode,
  DurationLane,
  EmotionalTone,
  HabitatPreset,
  HookFamily,
  KlingModel,
  RealismMode,
  RunwayModel,
  SavedWorkflowPreset,
} from "@/types";

import {
  arcs,
  depthModes,
  habitatOptions,
  KLING_MODELS,
  RUNWAY_MODELS,
  weatherOptions,
} from "@/lib/model-specs";
import { contentLaneOptions } from "@/lib/content-lanes";
import { animalVibes, emotionalTones } from "@/lib/predator-data";

export const MAX_WORKFLOW_PRESETS = 40;

const realismModes: RealismMode[] = [
  "Balanced",
  "High Naturalism",
  "Reference Locked",
];
const hookModes: Array<HookFamily | "all"> = [
  "all",
  "danger",
  "curiosity",
  "reversal",
];
const aiProviders: AIProvider[] = ["none", "claude", "gemini"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function cleanBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function pickOption<T extends string>(
  value: unknown,
  options: readonly T[],
  fallback: T
): T {
  return typeof value === "string" && (options as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

function makePresetId(now = Date.now()): string {
  return `preset_${now.toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function buildWorkflowPresetName(
  snapshot: BuildWorkflowPresetSnapshot
): string {
  const laneLead =
    snapshot.contentLane === "Auto" ? "Wildlife" : snapshot.contentLane;
  const durationLead = snapshot.durationLane === "long" ? "Long Lane" : "Short Form";
  return `${laneLead} ${durationLead} - ${snapshot.predator} vs ${snapshot.prey}`;
}

export function normalizeWorkflowPresetSnapshot(
  value: unknown
): BuildWorkflowPresetSnapshot | null {
  if (!isRecord(value)) return null;

  const predator = cleanString(value.predator);
  const prey = cleanString(value.prey);
  if (!predator || !prey) return null;

  const sceneDescription = cleanString(value.sceneDescription);
  const sceneDescriptionMode = pickOption(
    value.sceneDescriptionMode,
    ["auto", "manual"] as const,
    sceneDescription ? "manual" : "auto"
  );

  return {
    predator,
    prey,
    contentLane: pickOption<ContentLane>(
      value.contentLane,
      contentLaneOptions,
      "Auto"
    ),
    arc: pickOption<Arc>(value.arc, arcs, "Ambush attack"),
    habitat: pickOption<HabitatPreset>(value.habitat, habitatOptions, "Auto"),
    weather: pickOption(value.weather, weatherOptions, "Golden Hour"),
    durationLane: pickOption<DurationLane>(
      value.durationLane,
      ["short", "long"],
      "short"
    ),
    fastPublishMode: cleanBoolean(value.fastPublishMode, true),
    strictOriginalityGuard: cleanBoolean(value.strictOriginalityGuard, true),
    hookMode: pickOption<HookFamily | "all">(value.hookMode, hookModes, "all"),
    depthMode: pickOption<DepthMode>(
      value.depthMode,
      depthModes,
      "Balanced Depth"
    ),
    emotionalTone: pickOption<EmotionalTone>(
      value.emotionalTone,
      emotionalTones,
      "Raw Tension"
    ),
    animalVibe: pickOption<AnimalVibe>(
      value.animalVibe,
      animalVibes,
      "National Geographic Wild"
    ),
    realismMode: pickOption<RealismMode>(
      value.realismMode,
      realismModes,
      "Reference Locked"
    ),
    motionOnlyI2V: cleanBoolean(value.motionOnlyI2V, true),
    referenceLock: cleanBoolean(value.referenceLock, true),
    singleActionRule: cleanBoolean(value.singleActionRule, true),
    microMotion: cleanBoolean(value.microMotion, true),
    heroVeo: cleanBoolean(value.heroVeo, false),
    autoApplyHighDrift: cleanBoolean(value.autoApplyHighDrift, false),
    runwayModel: pickOption<RunwayModel>(
      value.runwayModel,
      RUNWAY_MODELS,
      RUNWAY_MODELS[0]
    ),
    klingModel: pickOption<KlingModel>(
      value.klingModel,
      KLING_MODELS,
      KLING_MODELS[0]
    ),
    activeProvider: pickOption<AIProvider>(
      value.activeProvider,
      aiProviders,
      "none"
    ),
    sceneDescriptionMode,
    sceneDescription,
    sceneDescriptionTouched: cleanBoolean(
      value.sceneDescriptionTouched,
      sceneDescriptionMode === "manual" && sceneDescription.length > 0
    ),
  };
}

export function normalizeWorkflowPreset(
  value: unknown
): SavedWorkflowPreset | null {
  if (!isRecord(value)) return null;

  const id = cleanString(value.id);
  const name = cleanString(value.name);
  const snapshot = normalizeWorkflowPresetSnapshot(value.snapshot);
  if (!id || !name || !snapshot) return null;

  const createdAt = cleanString(value.createdAt, new Date(0).toISOString());
  const updatedAt = cleanString(value.updatedAt, createdAt);

  return { id, name, createdAt, updatedAt, snapshot };
}

export function normalizeWorkflowPresets(value: unknown): SavedWorkflowPreset[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  return value
    .map(normalizeWorkflowPreset)
    .filter((preset): preset is SavedWorkflowPreset => Boolean(preset))
    .filter((preset) => {
      if (seen.has(preset.id)) return false;
      seen.add(preset.id);
      return true;
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, MAX_WORKFLOW_PRESETS);
}

export function createWorkflowPreset(
  snapshot: BuildWorkflowPresetSnapshot,
  options: { id?: string; name?: string; now?: string; timestamp?: number } = {}
): SavedWorkflowPreset {
  const normalizedSnapshot = normalizeWorkflowPresetSnapshot(snapshot);
  if (!normalizedSnapshot) {
    throw new Error("Invalid workflow preset snapshot");
  }

  const now = options.now ?? new Date(options.timestamp ?? Date.now()).toISOString();
  const name = cleanString(options.name) || buildWorkflowPresetName(normalizedSnapshot);

  return {
    id: options.id ?? makePresetId(options.timestamp),
    name,
    createdAt: now,
    updatedAt: now,
    snapshot: normalizedSnapshot,
  };
}

export function saveWorkflowPreset(
  presets: SavedWorkflowPreset[],
  snapshot: BuildWorkflowPresetSnapshot,
  options: { id?: string; name?: string; now?: string; timestamp?: number } = {}
): SavedWorkflowPreset[] {
  const preset = createWorkflowPreset(snapshot, options);
  return normalizeWorkflowPresets([
    preset,
    ...presets.filter((item) => item.id !== preset.id),
  ]);
}

export function updateWorkflowPreset(
  presets: SavedWorkflowPreset[],
  id: string,
  snapshot: BuildWorkflowPresetSnapshot,
  options: { name?: string; now?: string } = {}
): SavedWorkflowPreset[] {
  const normalizedSnapshot = normalizeWorkflowPresetSnapshot(snapshot);
  if (!normalizedSnapshot) return normalizeWorkflowPresets(presets);

  const now = options.now ?? new Date().toISOString();
  return normalizeWorkflowPresets(
    presets.map((preset) =>
      preset.id === id
        ? {
            ...preset,
            name: cleanString(options.name, preset.name) || preset.name,
            updatedAt: now,
            snapshot: normalizedSnapshot,
          }
        : preset
    )
  );
}

export function deleteWorkflowPreset(
  presets: SavedWorkflowPreset[],
  id: string
): SavedWorkflowPreset[] {
  return normalizeWorkflowPresets(presets.filter((preset) => preset.id !== id));
}

export function getSafeDefaultWorkflowPresetId(
  presets: SavedWorkflowPreset[],
  defaultPresetId: string | null | undefined
): string | undefined {
  if (!defaultPresetId) return undefined;
  return presets.some((preset) => preset.id === defaultPresetId)
    ? defaultPresetId
    : undefined;
}

export function resolveDefaultWorkflowPreset(
  presets: SavedWorkflowPreset[],
  defaultPresetId: string | null | undefined
): SavedWorkflowPreset | undefined {
  const safeDefaultId = getSafeDefaultWorkflowPresetId(presets, defaultPresetId);
  return safeDefaultId
    ? presets.find((preset) => preset.id === safeDefaultId)
    : undefined;
}

export function areWorkflowPresetSnapshotsEqual(
  a: BuildWorkflowPresetSnapshot,
  b: BuildWorkflowPresetSnapshot
): boolean {
  return JSON.stringify(normalizeWorkflowPresetSnapshot(a)) ===
    JSON.stringify(normalizeWorkflowPresetSnapshot(b));
}
