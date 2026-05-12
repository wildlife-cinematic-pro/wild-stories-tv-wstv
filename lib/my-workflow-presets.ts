import { StoryMode } from "@/types";
import type {
  AIProvider,
  ActionStylePreset,
  AnimalVibe,
  Arc,
  CameraAnglePreset,
  ContentLane,
  DepthMode,
  DurationLane,
  EmotionalTone,
  EncounterMode,
  EndingMode,
  HabitatPreset,
  HabitatRegion,
  HookFamily,
  KlingModel,
  RealismMode,
  RunwayModel,
  Season,
  TimeOfDay,
  VideoModelProviderGroup,
  ViralLane,
  ViolenceLevel,
  Weather,
} from "@/types";

export const MY_WORKFLOW_PRESETS_STORAGE_KEY = "wstv.myWorkflowPresets.v1";
export const MY_WORKFLOW_PRESET_VERSION = 1;

export type MyWorkflowPresetSnapshot = {
  storyMode: StoryMode;
  subjectA?: string;
  subjectB?: string;
  predator: string;
  prey: string;
  habitatRegion: HabitatRegion;
  season: Season;
  timeOfDay: TimeOfDay;
  actionStyle: ActionStylePreset;
  animalVibe: AnimalVibe;
  arc: Arc;
  cameraAnglePreset: CameraAnglePreset;
  contentLane: ContentLane;
  depthMode: DepthMode;
  emotionalTone: EmotionalTone;
  encounterMode: EncounterMode;
  endingMode: EndingMode;
  hookMode: HookFamily | "all";
  strictOriginalityGuard: boolean;
  viralLane: ViralLane;
  violenceLevel: ViolenceLevel;
  weather: Weather;
  runwayModel: RunwayModel;
  klingModel: KlingModel;
  selectedVideoModelId?: string;
  selectedVideoProviderGroup?: VideoModelProviderGroup;
  autoSelectRecommendedVideoModel?: boolean;
  activeProvider: AIProvider;
  autoFallback: boolean;
  habitat?: HabitatPreset;
  durationLane?: DurationLane;
  fastPublishMode?: boolean;
  realismMode?: RealismMode;
  motionOnlyI2V?: boolean;
  referenceLock?: boolean;
  singleActionRule?: boolean;
  microMotion?: boolean;
  heroVeo?: boolean;
};

export type MyWorkflowPreset = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  version: typeof MY_WORKFLOW_PRESET_VERSION;
  snapshot: MyWorkflowPresetSnapshot;
};

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getDefaultStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function generatePresetId(now: string): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 10);

  return `my_workflow_${now.replace(/[^0-9]/g, "")}_${random}`;
}

function formatEnumLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function buildMyWorkflowPresetName(
  snapshot: Pick<MyWorkflowPresetSnapshot, "storyMode" | "subjectA" | "subjectB" | "predator" | "prey">
): string {
  const storyMode = formatEnumLabel(snapshot.storyMode);
  const subjectA = safeString(snapshot.subjectA) || snapshot.predator;
  const subjectB = safeString(snapshot.subjectB) || snapshot.prey;

  return `${storyMode}: ${subjectA} vs ${subjectB}`;
}

function normalizeSnapshot(value: unknown): MyWorkflowPresetSnapshot | null {
  if (!isRecord(value)) return null;

  const storyMode = value.storyMode;
  if (!Object.values(StoryMode).includes(storyMode as StoryMode)) return null;

  const requiredStrings = [
    "predator",
    "prey",
    "habitatRegion",
    "season",
    "timeOfDay",
    "actionStyle",
    "animalVibe",
    "arc",
    "cameraAnglePreset",
    "contentLane",
    "depthMode",
    "emotionalTone",
    "encounterMode",
    "endingMode",
    "hookMode",
    "viralLane",
    "weather",
    "runwayModel",
    "klingModel",
    "activeProvider",
  ];

  if (requiredStrings.some((key) => !safeString(value[key]))) return null;
  if (typeof value.strictOriginalityGuard !== "boolean") return null;
  if (typeof value.violenceLevel !== "number") return null;
  if (typeof value.autoFallback !== "boolean") return null;

  return {
    storyMode: storyMode as StoryMode,
    subjectA: safeString(value.subjectA) || undefined,
    subjectB: safeString(value.subjectB) || undefined,
    predator: safeString(value.predator),
    prey: safeString(value.prey),
    habitatRegion: value.habitatRegion as HabitatRegion,
    season: value.season as Season,
    timeOfDay: value.timeOfDay as TimeOfDay,
    actionStyle: value.actionStyle as ActionStylePreset,
    animalVibe: value.animalVibe as AnimalVibe,
    arc: value.arc as Arc,
    cameraAnglePreset: value.cameraAnglePreset as CameraAnglePreset,
    contentLane: value.contentLane as ContentLane,
    depthMode: value.depthMode as DepthMode,
    emotionalTone: value.emotionalTone as EmotionalTone,
    encounterMode: value.encounterMode as EncounterMode,
    endingMode: value.endingMode as EndingMode,
    hookMode: value.hookMode as HookFamily | "all",
    strictOriginalityGuard: value.strictOriginalityGuard,
    viralLane: value.viralLane as ViralLane,
    violenceLevel: value.violenceLevel as ViolenceLevel,
    weather: value.weather as Weather,
    runwayModel: value.runwayModel as RunwayModel,
    klingModel: value.klingModel as KlingModel,
    selectedVideoModelId: safeString(value.selectedVideoModelId) || undefined,
    selectedVideoProviderGroup: safeString(value.selectedVideoProviderGroup)
      ? (value.selectedVideoProviderGroup as VideoModelProviderGroup)
      : undefined,
    autoSelectRecommendedVideoModel:
      typeof value.autoSelectRecommendedVideoModel === "boolean"
        ? value.autoSelectRecommendedVideoModel
        : undefined,
    activeProvider: value.activeProvider as AIProvider,
    autoFallback: value.autoFallback,
    habitat: safeString(value.habitat) ? (value.habitat as HabitatPreset) : undefined,
    durationLane: safeString(value.durationLane)
      ? (value.durationLane as DurationLane)
      : undefined,
    fastPublishMode:
      typeof value.fastPublishMode === "boolean" ? value.fastPublishMode : undefined,
    realismMode: safeString(value.realismMode)
      ? (value.realismMode as RealismMode)
      : undefined,
    motionOnlyI2V:
      typeof value.motionOnlyI2V === "boolean" ? value.motionOnlyI2V : undefined,
    referenceLock:
      typeof value.referenceLock === "boolean" ? value.referenceLock : undefined,
    singleActionRule:
      typeof value.singleActionRule === "boolean" ? value.singleActionRule : undefined,
    microMotion: typeof value.microMotion === "boolean" ? value.microMotion : undefined,
    heroVeo: typeof value.heroVeo === "boolean" ? value.heroVeo : undefined,
  };
}

function normalizePreset(value: unknown): MyWorkflowPreset | null {
  if (!isRecord(value)) return null;
  if (value.version !== MY_WORKFLOW_PRESET_VERSION) return null;

  const id = safeString(value.id);
  const createdAt = safeString(value.createdAt);
  const updatedAt = safeString(value.updatedAt);
  const snapshot = normalizeSnapshot(value.snapshot);

  if (!id || !createdAt || !updatedAt || !snapshot) return null;

  return {
    id,
    name: safeString(value.name) || buildMyWorkflowPresetName(snapshot),
    createdAt,
    updatedAt,
    version: MY_WORKFLOW_PRESET_VERSION,
    snapshot,
  };
}

export function createMyWorkflowPreset(
  snapshot: MyWorkflowPresetSnapshot,
  name?: string,
  options: { now?: string; id?: string } = {}
): MyWorkflowPreset {
  const now = options.now ?? new Date().toISOString();
  const cleanName = safeString(name) || buildMyWorkflowPresetName(snapshot);

  return {
    id: options.id ?? generatePresetId(now),
    name: cleanName,
    createdAt: now,
    updatedAt: now,
    version: MY_WORKFLOW_PRESET_VERSION,
    snapshot,
  };
}

export function readPresetsFromStorage(
  storage: StorageLike | null = getDefaultStorage()
): MyWorkflowPreset[] {
  if (!storage) return [];

  try {
    const raw = storage.getItem(MY_WORKFLOW_PRESETS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return [];
    if (parsed.version !== MY_WORKFLOW_PRESET_VERSION) return [];
    if (!Array.isArray(parsed.presets)) return [];

    return parsed.presets
      .map(normalizePreset)
      .filter((preset): preset is MyWorkflowPreset => Boolean(preset));
  } catch {
    return [];
  }
}

export function writePresetsToStorage(
  storage: StorageLike | null = getDefaultStorage(),
  presets: MyWorkflowPreset[]
): boolean {
  if (!storage) return false;

  try {
    storage.setItem(
      MY_WORKFLOW_PRESETS_STORAGE_KEY,
      JSON.stringify({
        version: MY_WORKFLOW_PRESET_VERSION,
        presets,
      })
    );
    return true;
  } catch {
    return false;
  }
}

export function loadMyWorkflowPresets(
  storage: StorageLike | null = getDefaultStorage()
): MyWorkflowPreset[] {
  return readPresetsFromStorage(storage);
}

export function saveMyWorkflowPresets(
  presets: MyWorkflowPreset[],
  storage: StorageLike | null = getDefaultStorage()
): boolean {
  return writePresetsToStorage(storage, presets);
}

export function upsertMyWorkflowPresetInList(
  presets: MyWorkflowPreset[],
  preset: MyWorkflowPreset
): MyWorkflowPreset[] {
  const index = presets.findIndex((candidate) => candidate.id === preset.id);
  if (index < 0) return [preset, ...presets];

  return presets.map((candidate, candidateIndex) =>
    candidateIndex === index
      ? {
          ...preset,
          createdAt: candidate.createdAt,
          updatedAt: preset.updatedAt,
        }
      : candidate
  );
}

export function renameMyWorkflowPresetInList(
  presets: MyWorkflowPreset[],
  id: string,
  name: string,
  now = new Date().toISOString()
): MyWorkflowPreset[] {
  const cleanName = safeString(name);
  if (!cleanName) return presets;

  return presets.map((preset) =>
    preset.id === id ? { ...preset, name: cleanName, updatedAt: now } : preset
  );
}

export function deleteMyWorkflowPresetFromList(
  presets: MyWorkflowPreset[],
  id: string
): MyWorkflowPreset[] {
  return presets.filter((preset) => preset.id !== id);
}

export function upsertMyWorkflowPreset(
  preset: MyWorkflowPreset,
  storage: StorageLike | null = getDefaultStorage()
): MyWorkflowPreset[] {
  const next = upsertMyWorkflowPresetInList(readPresetsFromStorage(storage), preset);
  writePresetsToStorage(storage, next);
  return next;
}

export function deleteMyWorkflowPreset(
  id: string,
  storage: StorageLike | null = getDefaultStorage()
): MyWorkflowPreset[] {
  const next = deleteMyWorkflowPresetFromList(readPresetsFromStorage(storage), id);
  writePresetsToStorage(storage, next);
  return next;
}

export function applyMyWorkflowPreset(
  preset: MyWorkflowPreset
): MyWorkflowPresetSnapshot {
  return preset.snapshot;
}

export function canUseMyWorkflowPresetStorage(
  storage: StorageLike | null = getDefaultStorage()
): boolean {
  if (!storage) return false;

  try {
    const key = `${MY_WORKFLOW_PRESETS_STORAGE_KEY}.check`;
    storage.setItem(key, "1");
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
