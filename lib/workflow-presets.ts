import {
  EncounterMode,
  EndingMode,
  HabitatRegion,
  StoryMode,
  ViralLane,
  ViolenceLevel,
} from "@/types";

import type {
  AIProvider,
  ActionStylePreset,
  AnimalVibe,
  Arc,
  BuildWorkflowPresetSnapshot,
  CameraAnglePreset,
  ContentLane,
  WildlifeScopeMode,
  DepthMode,
  EmotionalTone,
  HabitatPreset,
  HookFamily,
  KlingModel,
  RealismMode,
  RunwayModel,
  SavedWorkflowPresetPack,
  Season,
  SavedWorkflowPreset,
  WorkflowPresetExportPayload,
  WorkflowPresetImportReport,
  WorkflowPresetPackExportPayload,
  TimeOfDay,
  VideoModelProviderGroup,
  WorkflowPresetPackImportReport,
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
import { cameraAnglePresetOptions } from "@/lib/camera-angle-presets";
import { formatDurationLaneLabel, isDurationLane } from "@/lib/duration-lanes";
import {
  animalVibes,
  emotionalTones,
  isUSAWildlifeAnimal,
} from "@/lib/predator-data";
import {
  getDefaultSelectedVideoModelId,
  getVideoModelCapabilityById,
} from "@/lib/video-model-capabilities";
import { normalizeWildlifeScopeMode } from "@/lib/wildlife-focus";

export const MAX_WORKFLOW_PRESETS = 40;
export const MAX_WORKFLOW_PRESET_PACKS = 24;
export const WORKFLOW_PRESET_EXPORT_SCHEMA = "wstv.workflow-presets";
export const WORKFLOW_PRESET_EXPORT_VERSION = 1;
export const WORKFLOW_PRESET_PACK_EXPORT_SCHEMA = "wstv.workflow-preset-pack";
export const WORKFLOW_PRESET_PACK_EXPORT_VERSION = 1;

const storyModeOptions = Object.values(StoryMode);
const encounterModeOptions = Object.values(EncounterMode);
const endingModeOptions = Object.values(EndingMode);
const viralLaneOptions = Object.values(ViralLane);
const habitatRegionOptions = Object.values(HabitatRegion);
const seasonOptions: Season[] = [
  "SPRING",
  "SUMMER",
  "FALL",
  "WINTER",
  "MIGRATION_SEASON",
];
const timeOfDayOptions: TimeOfDay[] = [
  "DAWN",
  "GOLDEN_HOUR",
  "MIDDAY",
  "DUSK",
  "BLUE_HOUR",
  "NIGHT",
];

export type WorkflowTestPreset = {
  id: string;
  label: string;
  summary: string;
  snapshot: BuildWorkflowPresetSnapshot;
};

export const WORKFLOW_TEST_PRESETS: WorkflowTestPreset[] = [
  {
    id: "crocodile-warthog",
    label: "Crocodile vs Warthog",
    summary: "Water ambush test",
    snapshot: {
      predator: "Crocodile",
      prey: "Warthog",
      wildlifeScopeMode: "Global Viral Wildlife",
      contentLane: "Fishing Strike",
      actionStyle: "Natural tension",
      cameraAnglePreset: "Waterline",
      arc: "Ambush attack",
      habitat: "Riverbank Reeds",
      weather: "Golden Hour",
      durationLane: "short",
      fastPublishMode: true,
      strictOriginalityGuard: true,
      hookMode: "all",
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
      runwayModel: RUNWAY_MODELS[0],
      klingModel: KLING_MODELS[0],
      activeProvider: "gemini",
      sceneDescriptionMode: "auto",
      sceneDescription: "",
      sceneDescriptionTouched: false,
    },
  },
  {
    id: "black-bear-ground-squirrel",
    label: "Black Bear vs Ground Squirrel",
    summary: "Small-prey forest read test",
    snapshot: {
      predator: "Black Bear",
      prey: "Ground Squirrel",
      wildlifeScopeMode: "USA Wildlife",
      contentLane: "Auto",
      actionStyle: "Natural tension",
      cameraAnglePreset: "Front full-body",
      arc: "Ambush attack",
      habitat: "Forest Clearing",
      weather: "Golden Hour",
      durationLane: "short",
      fastPublishMode: true,
      strictOriginalityGuard: true,
      hookMode: "all",
      depthMode: "Balanced Depth",
      emotionalTone: "Silent Dread",
      animalVibe: "BBC Earth Documentary",
      realismMode: "Reference Locked",
      motionOnlyI2V: true,
      referenceLock: true,
      singleActionRule: true,
      microMotion: true,
      heroVeo: false,
      autoApplyHighDrift: false,
      runwayModel: RUNWAY_MODELS[0],
      klingModel: KLING_MODELS[0],
      activeProvider: "gemini",
      sceneDescriptionMode: "auto",
      sceneDescription: "",
      sceneDescriptionTouched: false,
    },
  },
  {
    id: "polar-bear-arctic-fox",
    label: "Polar Bear vs Arctic Fox",
    summary: "Snow habitat realism test",
    snapshot: {
      predator: "Polar Bear",
      prey: "Arctic Fox",
      wildlifeScopeMode: "World Wide Wildlife",
      contentLane: "Escape",
      actionStyle: "Natural tension",
      cameraAnglePreset: "Front full-body",
      arc: "Escape from danger",
      habitat: "Snow Field Tundra",
      weather: "Overcast",
      durationLane: "short",
      fastPublishMode: true,
      strictOriginalityGuard: true,
      hookMode: "all",
      depthMode: "Detailed Background",
      emotionalTone: "Desperate Survival",
      animalVibe: "BBC Earth Documentary",
      realismMode: "Reference Locked",
      motionOnlyI2V: true,
      referenceLock: true,
      singleActionRule: true,
      microMotion: true,
      heroVeo: false,
      autoApplyHighDrift: false,
      runwayModel: RUNWAY_MODELS[0],
      klingModel: KLING_MODELS[0],
      activeProvider: "gemini",
      sceneDescriptionMode: "auto",
      sceneDescription: "",
      sceneDescriptionTouched: false,
    },
  },
  {
    id: "wolf-pack-bull-elk",
    label: "Wolf Pack vs Bull Elk",
    summary: "Open-lane pack pressure test",
    snapshot: {
      predator: "Wolf Pack",
      prey: "Bull Elk",
      wildlifeScopeMode: "USA / Canada Wildlife",
      contentLane: "Pack Hunt",
      actionStyle: "Natural tension",
      cameraAnglePreset: "Front full-body",
      arc: "Pack hunting strategy",
      habitat: "Rocky Mountain Meadow",
      weather: "Dawn",
      durationLane: "short",
      fastPublishMode: true,
      strictOriginalityGuard: true,
      hookMode: "all",
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
      runwayModel: RUNWAY_MODELS[0],
      klingModel: KLING_MODELS[0],
      activeProvider: "gemini",
      sceneDescriptionMode: "auto",
      sceneDescription: "",
      sceneDescriptionTouched: false,
    },
  },
  {
    id: "bald-eagle-salmon",
    label: "Bald Eagle vs Salmon",
    summary: "Fishing strike readability test",
    snapshot: {
      predator: "Bald Eagle",
      prey: "Salmon",
      wildlifeScopeMode: "USA / Canada Wildlife",
      contentLane: "Fishing Strike",
      actionStyle: "Natural tension",
      cameraAnglePreset: "Waterline",
      arc: "Ambush attack",
      habitat: "Riverbank Reeds",
      weather: "Golden Hour",
      durationLane: "short",
      fastPublishMode: true,
      strictOriginalityGuard: true,
      hookMode: "all",
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
      runwayModel: RUNWAY_MODELS[0],
      klingModel: KLING_MODELS[0],
      activeProvider: "gemini",
      sceneDescriptionMode: "auto",
      sceneDescription: "",
      sceneDescriptionTouched: false,
    },
  },
];

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
const aiProviders: AIProvider[] = [
  "gemini",
  "openai",
  "claude",
  "groq",
  "openrouter",
  "huggingface",
  "none",
];
const actionStylePresets: ActionStylePreset[] = [
  "Natural tension",
  "Viral chase",
  "Close-contact fight",
  "Ambush burst",
  "Forced retreat",
];

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

function pickViolenceLevel(value: unknown): ViolenceLevel {
  return value === 2 || value === 3
    ? (value as ViolenceLevel)
    : ViolenceLevel.DISPLAY_ONLY;
}

function cleanOptionalString(value: unknown): string | undefined {
  const text = cleanString(value);
  return text || undefined;
}

function makePresetId(now = Date.now()): string {
  return `preset_${now.toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function makePresetPackId(now = Date.now()): string {
  return `preset_pack_${now.toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

function makeImportedPresetId(
  originalId: string,
  usedIds: Set<string>,
  index: number
): string {
  const safeBase = originalId
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  const base = safeBase || `imported-preset-${index + 1}`;

  let candidate = `${base}-imported`;
  let suffix = 2;
  while (usedIds.has(candidate)) {
    candidate = `${base}-imported-${suffix}`;
    suffix += 1;
  }

  usedIds.add(candidate);
  return candidate;
}

function makeImportedPresetPackId(
  originalId: string,
  usedIds: Set<string>,
  index: number
): string {
  const safeBase = originalId
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  const base = safeBase || `imported-preset-pack-${index + 1}`;

  let candidate = `${base}-imported`;
  let suffix = 2;
  while (usedIds.has(candidate)) {
    candidate = `${base}-imported-${suffix}`;
    suffix += 1;
  }

  usedIds.add(candidate);
  return candidate;
}

function getUniquePresetName(name: string, usedNames: Set<string>): string {
  const base = cleanString(name, "Imported Workflow Preset");
  if (!usedNames.has(base)) {
    usedNames.add(base);
    return base;
  }

  let candidate = `${base} (Imported)`;
  let suffix = 2;
  while (usedNames.has(candidate)) {
    candidate = `${base} (Imported ${suffix})`;
    suffix += 1;
  }

  usedNames.add(candidate);
  return candidate;
}

function getUniquePresetPackName(name: string, usedNames: Set<string>): string {
  const base = cleanString(name, "Imported Preset Pack");
  if (!usedNames.has(base)) {
    usedNames.add(base);
    return base;
  }

  let candidate = `${base} (Imported)`;
  let suffix = 2;
  while (usedNames.has(candidate)) {
    candidate = `${base} (Imported ${suffix})`;
    suffix += 1;
  }

  usedNames.add(candidate);
  return candidate;
}

function cleanPresetPackTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  return value
    .map((item) => cleanString(item))
    .filter(Boolean)
    .map((item) => item.slice(0, 40))
    .filter((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 8);
}

export function buildWorkflowPresetName(
  snapshot: BuildWorkflowPresetSnapshot
): string {
  const laneLead =
    snapshot.contentLane === "Auto" ? "Wildlife" : snapshot.contentLane;
  const durationLead = `${formatDurationLaneLabel(snapshot.durationLane)} Lane`;
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
  const defaultWildlifeScopeMode: WildlifeScopeMode = isUSAWildlifeAnimal(predator)
    ? "USA / Canada Wildlife"
    : "World Wide Wildlife";
  const sceneDescriptionMode = pickOption(
    value.sceneDescriptionMode,
    ["auto", "manual"] as const,
    sceneDescription ? "manual" : "auto"
  );
  const runwayModel = pickOption<RunwayModel>(
    value.runwayModel,
    RUNWAY_MODELS,
    RUNWAY_MODELS[0]
  );
  const klingModel = pickOption<KlingModel>(
    value.klingModel,
    KLING_MODELS,
    KLING_MODELS[0]
  );
  const selectedVideoModelId = getDefaultSelectedVideoModelId({
    selectedVideoModelId: cleanString(value.selectedVideoModelId) || undefined,
    runwayModel,
    klingModel,
  });
  const selectedVideoModel = getVideoModelCapabilityById(selectedVideoModelId);
  const selectedVideoProviderGroup =
    selectedVideoModel?.providerGroup ??
    (cleanString(value.selectedVideoProviderGroup) as VideoModelProviderGroup) ??
    "RUNWAY_NATIVE";

  return {
    predator,
    prey,
    storyMode: pickOption(value.storyMode, storyModeOptions, StoryMode.PREDATOR_VS_PREY),
    encounterMode: pickOption(
      value.encounterMode,
      encounterModeOptions,
      EncounterMode.PEAK_TENSION
    ),
    endingMode: pickOption(value.endingMode, endingModeOptions, EndingMode.ESCAPE),
    viralLane: pickOption(value.viralLane, viralLaneOptions, ViralLane.TENSION),
    violenceLevel: pickViolenceLevel(value.violenceLevel),
    habitatRegion: pickOption(
      value.habitatRegion,
      habitatRegionOptions,
      HabitatRegion.YELLOWSTONE
    ),
    subjectA: cleanOptionalString(value.subjectA) ?? predator,
    subjectB: cleanOptionalString(value.subjectB) ?? prey,
    ...(typeof value.groupCount === "number" ? { groupCount: value.groupCount } : {}),
    offspringLabel: pickOption(
      value.offspringLabel,
      ["cub", "fawn", "calf", "pup", "kit"] as const,
      "cub"
    ),
    strikeMethod: pickOption(
      value.strikeMethod,
      ["POUNCE", "DIVE", "SWIPE", "CHASE", "AMBUSH"] as const,
      "AMBUSH"
    ),
    escapeDirection: pickOption(
      value.escapeDirection,
      ["WATER", "UPHILL", "BRUSH", "OPEN_FIELD"] as const,
      "BRUSH"
    ),
    weatherHazard: pickOption(
      value.weatherHazard,
      ["BLIZZARD", "ICE", "FLOOD", "DROUGHT", "HEAT"] as const,
      "BLIZZARD"
    ),
    rutSeason: cleanBoolean(value.rutSeason, false),
    ...(cleanOptionalString(value.foodItem)
      ? { foodItem: cleanOptionalString(value.foodItem) }
      : {}),
    season: pickOption(value.season, seasonOptions, "FALL"),
    timeOfDay: pickOption(value.timeOfDay, timeOfDayOptions, "GOLDEN_HOUR"),
    wildlifeScopeMode: normalizeWildlifeScopeMode(
      value.wildlifeScopeMode,
      defaultWildlifeScopeMode
    ),
    contentLane: pickOption<ContentLane>(
      value.contentLane,
      contentLaneOptions,
      "Auto"
    ),
    actionStyle: pickOption<ActionStylePreset>(
      value.actionStyle,
      actionStylePresets,
      "Natural tension"
    ),
    cameraAnglePreset: pickOption<CameraAnglePreset>(
      value.cameraAnglePreset,
      cameraAnglePresetOptions,
      "Auto"
    ),
    arc: pickOption<Arc>(value.arc, arcs, "Ambush attack"),
    habitat: pickOption<HabitatPreset>(value.habitat, habitatOptions, "Auto"),
    weather: pickOption(value.weather, weatherOptions, "Golden Hour"),
    durationLane: isDurationLane(value.durationLane)
      ? value.durationLane
      : "short",
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
    runwayModel,
    klingModel,
    selectedVideoModelId,
    selectedVideoProviderGroup,
    autoSelectRecommendedVideoModel: cleanBoolean(
      value.autoSelectRecommendedVideoModel,
      false
    ),
    activeProvider: pickOption<AIProvider>(
      value.activeProvider,
      aiProviders,
      "gemini"
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

function normalizeWorkflowPresetImportCandidate(
  value: unknown,
  fallbackIndex: number
): SavedWorkflowPreset | null {
  const normalizedPreset = normalizeWorkflowPreset(value);
  if (normalizedPreset) return normalizedPreset;

  if (!isRecord(value)) return null;

  const snapshotSource = isRecord(value.snapshot) ? value.snapshot : value;
  const snapshot = normalizeWorkflowPresetSnapshot(snapshotSource);
  if (!snapshot) return null;

  const now = new Date(0).toISOString();
  const id = cleanString(value.id, `imported-preset-${fallbackIndex + 1}`);
  const name =
    cleanString(value.name) ||
    cleanString(value.label) ||
    buildWorkflowPresetName(snapshot);

  return {
    id,
    name,
    createdAt: cleanString(value.createdAt, now),
    updatedAt: cleanString(value.updatedAt, now),
    snapshot,
  };
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

function normalizeWorkflowPresetPackPresets(
  value: unknown
): SavedWorkflowPreset[] {
  if (!Array.isArray(value)) return [];

  return normalizeWorkflowPresets(
    value.map((item, index) =>
      normalizeWorkflowPresetImportCandidate(item, index)
    )
  );
}

export function normalizeWorkflowPresetPack(
  value: unknown
): SavedWorkflowPresetPack | null {
  if (!isRecord(value)) return null;

  const id = cleanString(value.id);
  const name = cleanString(value.name);
  const presets = normalizeWorkflowPresetPackPresets(value.presets);
  if (!id || !name || presets.length === 0) return null;

  const createdAt = cleanString(value.createdAt, new Date(0).toISOString());
  const updatedAt = cleanString(value.updatedAt, createdAt);
  const description = cleanString(value.description);
  const tags = cleanPresetPackTags(value.tags);

  return {
    id,
    name,
    description,
    ...(tags.length ? { tags } : {}),
    createdAt,
    updatedAt,
    presets,
  };
}

function normalizeWorkflowPresetPackImportCandidate(
  value: unknown,
  fallbackIndex: number
): SavedWorkflowPresetPack | null {
  const normalizedPack = normalizeWorkflowPresetPack(value);
  if (normalizedPack) return normalizedPack;

  if (!isRecord(value)) return null;

  const presets = normalizeWorkflowPresetPackPresets(value.presets);
  if (presets.length === 0) return null;

  const now = new Date(0).toISOString();
  const id = cleanString(value.id, `imported-preset-pack-${fallbackIndex + 1}`);
  const name =
    cleanString(value.name) ||
    cleanString(value.label) ||
    "Imported Preset Pack";
  const description = cleanString(value.description);
  const tags = cleanPresetPackTags(value.tags);

  return {
    id,
    name,
    description,
    ...(tags.length ? { tags } : {}),
    createdAt: cleanString(value.createdAt, now),
    updatedAt: cleanString(value.updatedAt, now),
    presets,
  };
}

export function normalizeWorkflowPresetPacks(
  value: unknown
): SavedWorkflowPresetPack[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  return value
    .map(normalizeWorkflowPresetPack)
    .filter((pack): pack is SavedWorkflowPresetPack => Boolean(pack))
    .filter((pack) => {
      if (seen.has(pack.id)) return false;
      seen.add(pack.id);
      return true;
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, MAX_WORKFLOW_PRESET_PACKS);
}

export function buildWorkflowPresetExportPayload(
  presets: SavedWorkflowPreset[],
  options: { defaultPresetId?: string; exportedAt?: string } = {}
): WorkflowPresetExportPayload {
  const normalizedPresets = normalizeWorkflowPresets(presets);
  const defaultPresetId = getSafeDefaultWorkflowPresetId(
    normalizedPresets,
    options.defaultPresetId
  );

  return {
    schema: WORKFLOW_PRESET_EXPORT_SCHEMA,
    version: WORKFLOW_PRESET_EXPORT_VERSION,
    source: "wild-stories-tv-wstv",
    exportedAt: options.exportedAt ?? new Date().toISOString(),
    ...(defaultPresetId ? { defaultPresetId } : {}),
    presets: normalizedPresets,
    metadata: {
      presetCount: normalizedPresets.length,
    },
  };
}

export function stringifyWorkflowPresetExportPayload(
  payload: WorkflowPresetExportPayload
): string {
  return JSON.stringify(payload, null, 2);
}

export function buildWorkflowPresetPackExportPayload(
  pack: SavedWorkflowPresetPack,
  options: { exportedAt?: string } = {}
): WorkflowPresetPackExportPayload | null {
  const normalizedPack = normalizeWorkflowPresetPack(pack);
  if (!normalizedPack) return null;

  return {
    schema: WORKFLOW_PRESET_PACK_EXPORT_SCHEMA,
    version: WORKFLOW_PRESET_PACK_EXPORT_VERSION,
    source: "wild-stories-tv-wstv",
    exportedAt: options.exportedAt ?? new Date().toISOString(),
    pack: normalizedPack,
    metadata: {
      presetCount: normalizedPack.presets.length,
      tags: normalizedPack.tags ?? [],
    },
  };
}

export function stringifyWorkflowPresetPackExportPayload(
  payload: WorkflowPresetPackExportPayload
): string {
  return JSON.stringify(payload, null, 2);
}

function extractWorkflowPresetImportItems(value: unknown): {
  items: unknown[];
  defaultPresetId?: string;
} {
  if (Array.isArray(value)) return { items: value };
  if (!isRecord(value)) return { items: [] };

  if (Array.isArray(value.presets)) {
    return {
      items: value.presets,
      defaultPresetId: cleanString(value.defaultPresetId) || undefined,
    };
  }

  if (isRecord(value.preset)) {
    return {
      items: [value.preset],
      defaultPresetId: cleanString(value.defaultPresetId) || undefined,
    };
  }

  return { items: [value] };
}

export function mergeWorkflowPresetImport(
  existingPresets: SavedWorkflowPreset[],
  importValue: unknown,
  options: {
    currentDefaultPresetId?: string;
    preserveImportedDefaultWhenEmpty?: boolean;
  } = {}
): WorkflowPresetImportReport {
  const existing = normalizeWorkflowPresets(existingPresets);
  const { items, defaultPresetId: importedDefaultPresetId } =
    extractWorkflowPresetImportItems(importValue);
  const usedIds = new Set(existing.map((preset) => preset.id));
  const usedNames = new Set(existing.map((preset) => preset.name));
  const importedPresets: SavedWorkflowPreset[] = [];
  const importedIdMap = new Map<string, string>();
  const warnings: string[] = [];
  let skippedCount = 0;
  let renamedCount = 0;
  let regeneratedIdCount = 0;

  items.forEach((item, index) => {
    const normalized = normalizeWorkflowPresetImportCandidate(item, index);
    if (!normalized) {
      skippedCount += 1;
      warnings.push(`Skipped invalid preset at position ${index + 1}.`);
      return;
    }

    const originalId = normalized.id;
    const originalName = normalized.name;
    let id = originalId;
    if (usedIds.has(id)) {
      id = makeImportedPresetId(originalId, usedIds, index);
      regeneratedIdCount += 1;
    } else {
      usedIds.add(id);
    }

    const name = getUniquePresetName(originalName, usedNames);
    if (name !== originalName) renamedCount += 1;

    importedIdMap.set(originalId, id);
    importedPresets.push({
      ...normalized,
      id,
      name,
    });
  });

  const mergedPresets = normalizeWorkflowPresets([
    ...importedPresets,
    ...existing,
  ]);
  let nextDefaultPresetId = getSafeDefaultWorkflowPresetId(
    mergedPresets,
    options.currentDefaultPresetId
  );

  if (
    !nextDefaultPresetId &&
    options.preserveImportedDefaultWhenEmpty &&
    importedDefaultPresetId
  ) {
    nextDefaultPresetId = getSafeDefaultWorkflowPresetId(
      mergedPresets,
      importedIdMap.get(importedDefaultPresetId) ?? importedDefaultPresetId
    );
  }

  return {
    presets: mergedPresets,
    importedPresets,
    importedCount: importedPresets.length,
    skippedCount,
    renamedCount,
    regeneratedIdCount,
    defaultPresetId: nextDefaultPresetId,
    warnings,
  };
}

export function mergeWorkflowPresetImportJson(
  existingPresets: SavedWorkflowPreset[],
  jsonText: string,
  options: {
    currentDefaultPresetId?: string;
    preserveImportedDefaultWhenEmpty?: boolean;
  } = {}
): WorkflowPresetImportReport {
  try {
    return mergeWorkflowPresetImport(
      existingPresets,
      JSON.parse(jsonText) as unknown,
      options
    );
  } catch {
    return {
      presets: normalizeWorkflowPresets(existingPresets),
      importedPresets: [],
      importedCount: 0,
      skippedCount: 0,
      renamedCount: 0,
      regeneratedIdCount: 0,
      defaultPresetId: getSafeDefaultWorkflowPresetId(
        existingPresets,
        options.currentDefaultPresetId
      ),
      warnings: ["Import failed because the JSON could not be parsed."],
    };
  }
}

function extractWorkflowPresetPackImportItem(value: unknown): unknown {
  if (!isRecord(value)) return null;
  if (isRecord(value.pack)) return value.pack;
  return value;
}

export function mergeWorkflowPresetPackImport(
  existingPacks: SavedWorkflowPresetPack[],
  importValue: unknown
): WorkflowPresetPackImportReport {
  const existing = normalizeWorkflowPresetPacks(existingPacks);
  const packValue = extractWorkflowPresetPackImportItem(importValue);
  const usedIds = new Set(existing.map((pack) => pack.id));
  const usedNames = new Set(existing.map((pack) => pack.name));
  const warnings: string[] = [];

  const normalized = normalizeWorkflowPresetPackImportCandidate(packValue, 0);
  if (!normalized) {
    return {
      packs: existing,
      importedCount: 0,
      skippedCount: 1,
      renamedCount: 0,
      regeneratedIdCount: 0,
      warnings: ["Import failed because the preset pack data was invalid."],
    };
  }

  const originalId = normalized.id;
  const originalName = normalized.name;
  let id = originalId;
  let regeneratedIdCount = 0;
  if (usedIds.has(id)) {
    id = makeImportedPresetPackId(originalId, usedIds, 0);
    regeneratedIdCount = 1;
  } else {
    usedIds.add(id);
  }

  const name = getUniquePresetPackName(originalName, usedNames);
  const renamedCount = name !== originalName ? 1 : 0;
  const importedPack: SavedWorkflowPresetPack = {
    ...normalized,
    id,
    name,
  };
  const packs = normalizeWorkflowPresetPacks([importedPack, ...existing]);

  return {
    packs,
    importedPack,
    importedCount: 1,
    skippedCount: 0,
    renamedCount,
    regeneratedIdCount,
    warnings,
  };
}

export function mergeWorkflowPresetPackImportJson(
  existingPacks: SavedWorkflowPresetPack[],
  jsonText: string
): WorkflowPresetPackImportReport {
  try {
    return mergeWorkflowPresetPackImport(
      existingPacks,
      JSON.parse(jsonText) as unknown
    );
  } catch {
    return {
      packs: normalizeWorkflowPresetPacks(existingPacks),
      importedCount: 0,
      skippedCount: 1,
      renamedCount: 0,
      regeneratedIdCount: 0,
      warnings: ["Pack import failed because the JSON could not be parsed."],
    };
  }
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

export function createWorkflowPresetPack(
  presets: SavedWorkflowPreset[],
  options: {
    id?: string;
    name?: string;
    description?: string;
    tags?: string[];
    now?: string;
    timestamp?: number;
  } = {}
): SavedWorkflowPresetPack {
  const normalizedPresets = normalizeWorkflowPresets(presets);
  if (normalizedPresets.length === 0) {
    throw new Error("Preset pack requires at least one valid workflow preset");
  }

  const now = options.now ?? new Date(options.timestamp ?? Date.now()).toISOString();
  const tags = cleanPresetPackTags(options.tags);

  return {
    id: options.id ?? makePresetPackId(options.timestamp),
    name: cleanString(options.name, "Untitled Preset Pack"),
    description: cleanString(options.description),
    ...(tags.length ? { tags } : {}),
    createdAt: now,
    updatedAt: now,
    presets: normalizedPresets,
  };
}

export function saveWorkflowPresetPack(
  packs: SavedWorkflowPresetPack[],
  presets: SavedWorkflowPreset[],
  options: {
    id?: string;
    name?: string;
    description?: string;
    tags?: string[];
    now?: string;
    timestamp?: number;
  } = {}
): SavedWorkflowPresetPack[] {
  const pack = createWorkflowPresetPack(presets, options);
  return normalizeWorkflowPresetPacks([
    pack,
    ...packs.filter((item) => item.id !== pack.id),
  ]);
}

export function deleteWorkflowPresetPack(
  packs: SavedWorkflowPresetPack[],
  id: string
): SavedWorkflowPresetPack[] {
  return normalizeWorkflowPresetPacks(packs.filter((pack) => pack.id !== id));
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
