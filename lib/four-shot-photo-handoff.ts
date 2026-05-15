import type { FourShotPhotoInput } from "@/lib/four-shot-photo-system";

export const FOUR_SHOT_PHOTO_HANDOFF_KEY = "wstv-four-shot-photo-handoff";

type TextLike = string | number | boolean | null | undefined;

export type FourShotPhotoBuildSetup = {
  source?: TextLike;
  predator?: TextLike;
  prey?: TextLike;
  subjectA?: TextLike;
  subjectB?: TextLike;
  habitatRegion?: TextLike;
  habitat?: TextLike;
  finalEnvironment?: TextLike;
  environment?: TextLike;
  lighting?: TextLike;
  weather?: TextLike;
  timeOfDay?: TextLike;
  season?: TextLike;
  aspectRatio?: TextLike;
  animalVibe?: TextLike;
  realismMode?: TextLike;
  referenceLock?: TextLike;
  sceneDescription?: TextLike;
  predatorIdentityNotes?: TextLike;
  preyIdentityNotes?: TextLike;
  createdAt?: TextLike;
};

export type FourShotPhotoHandoffPayload = FourShotPhotoBuildSetup & {
  source: string;
  createdAt: string;
};

type StorageLike = Pick<Storage, "getItem">;

function cleanText(value: TextLike): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function firstText(...values: TextLike[]): string {
  for (const value of values) {
    const cleaned = cleanText(value);
    if (cleaned) return cleaned;
  }
  return "";
}

function joinUseful(parts: string[], separator: string): string {
  return parts.filter(Boolean).join(separator);
}

export function resolveFourShotPhotoEnvironment(setup: FourShotPhotoBuildSetup): string {
  const explicitEnvironment = firstText(setup.finalEnvironment, setup.environment);
  if (explicitEnvironment) return explicitEnvironment;

  const habitatRegion = cleanText(setup.habitatRegion);
  const habitat = cleanText(setup.habitat);
  const sceneDescription = cleanText(setup.sceneDescription);
  const habitatLabel = habitat && habitat.toLowerCase() !== "auto" ? habitat : "";
  const environment = joinUseful([habitatRegion, habitatLabel], ", ");

  if (environment && sceneDescription) return environment + ". Scene context: " + sceneDescription;
  return environment || sceneDescription;
}

export function resolveFourShotPhotoLighting(setup: FourShotPhotoBuildSetup): string {
  const explicitLighting = cleanText(setup.lighting);
  if (explicitLighting) return explicitLighting;

  const timeOfDay = cleanText(setup.timeOfDay);
  const weather = cleanText(setup.weather);
  if (timeOfDay && weather && timeOfDay.toLowerCase() !== weather.toLowerCase()) {
    return timeOfDay + ", " + weather;
  }
  return timeOfDay || weather;
}

function buildIdentityNotes(role: "predator" | "prey", animal: string, setup: FourShotPhotoBuildSetup): string {
  const directNotes = cleanText(role === "predator" ? setup.predatorIdentityNotes : setup.preyIdentityNotes);
  if (directNotes) return directNotes;

  const details = [
    animal ? animal + " from current Build setup" : "current Build setup subject",
    cleanText(setup.animalVibe) ? "animal vibe: " + cleanText(setup.animalVibe) : "",
    cleanText(setup.realismMode) ? "realism mode: " + cleanText(setup.realismMode) : "",
    cleanText(setup.referenceLock) ? "reference lock: " + cleanText(setup.referenceLock) : "",
    "stable anatomy",
    "correct species scale",
    "clean full-body silhouette",
    role === "predator" ? "grounded paws and threat-aware gaze" : "grounded hooves or paws and readable threat awareness",
  ];

  return joinUseful(details, ", ");
}

export function handoffToFourShotInput(payload: FourShotPhotoBuildSetup | null | undefined): Partial<FourShotPhotoInput> {
  if (!payload) return {};

  const predator = firstText(payload.predator, payload.subjectA);
  const prey = firstText(payload.prey, payload.subjectB);
  const environment = resolveFourShotPhotoEnvironment(payload);
  const lighting = resolveFourShotPhotoLighting(payload);
  const season = cleanText(payload.season);
  const aspectRatio = cleanText(payload.aspectRatio);

  const input: Partial<FourShotPhotoInput> = {};
  if (predator) input.predator = predator;
  if (prey) input.prey = prey;
  if (environment) input.environment = environment;
  if (lighting) input.lighting = lighting;
  if (season) input.season = season;
  if (aspectRatio) input.aspectRatio = aspectRatio;
  if (predator) input.predatorIdentityNotes = buildIdentityNotes("predator", predator, payload);
  if (prey) input.preyIdentityNotes = buildIdentityNotes("prey", prey, payload);
  return input;
}

function hasFourShotPhotoParams(params: URLSearchParams): boolean {
  const keys = [
    "predator",
    "prey",
    "subjectA",
    "subjectB",
    "environment",
    "finalEnvironment",
    "habitatRegion",
    "habitat",
    "lighting",
    "weather",
    "timeOfDay",
    "season",
    "aspectRatio",
    "animalVibe",
    "realismMode",
    "referenceLock",
    "sceneDescription",
    "predatorIdentityNotes",
    "preyIdentityNotes",
  ];
  return keys.some((key) => cleanText(params.get(key)) !== "");
}

export function paramsToFourShotInput(params: URLSearchParams): Partial<FourShotPhotoInput> {
  if (!hasFourShotPhotoParams(params)) return {};

  return handoffToFourShotInput({
    predator: params.get("predator"),
    prey: params.get("prey"),
    subjectA: params.get("subjectA"),
    subjectB: params.get("subjectB"),
    environment: params.get("environment"),
    finalEnvironment: params.get("finalEnvironment"),
    habitatRegion: params.get("habitatRegion"),
    habitat: params.get("habitat"),
    lighting: params.get("lighting"),
    weather: params.get("weather"),
    timeOfDay: params.get("timeOfDay"),
    season: params.get("season"),
    aspectRatio: params.get("aspectRatio"),
    animalVibe: params.get("animalVibe"),
    realismMode: params.get("realismMode"),
    referenceLock: params.get("referenceLock"),
    sceneDescription: params.get("sceneDescription"),
    predatorIdentityNotes: params.get("predatorIdentityNotes"),
    preyIdentityNotes: params.get("preyIdentityNotes"),
    source: params.get("source"),
  });
}

export function resolveFourShotPhotoInitialInput(
  defaults: FourShotPhotoInput,
  handoff: FourShotPhotoBuildSetup | null | undefined,
  params: URLSearchParams
): FourShotPhotoInput {
  return {
    ...defaults,
    ...handoffToFourShotInput(handoff),
    ...paramsToFourShotInput(params),
  };
}

export function buildFourShotPhotoHandoffPayloadFromBuildSetup(
  setup: FourShotPhotoBuildSetup,
  createdAt = new Date().toISOString()
): FourShotPhotoHandoffPayload {
  const predator = firstText(setup.predator, setup.subjectA);
  const prey = firstText(setup.prey, setup.subjectB);
  const environment = resolveFourShotPhotoEnvironment(setup);
  const lighting = resolveFourShotPhotoLighting(setup);

  return {
    ...setup,
    source: cleanText(setup.source) || "build",
    predator,
    prey,
    environment,
    lighting,
    season: cleanText(setup.season),
    aspectRatio: cleanText(setup.aspectRatio) || "9:16",
    createdAt,
  };
}

function resolveStorage(storage?: StorageLike): StorageLike | null {
  if (storage) return storage;
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function loadFourShotPhotoHandoffPayload(storage?: StorageLike): FourShotPhotoHandoffPayload | null {
  const resolvedStorage = resolveStorage(storage);
  if (!resolvedStorage) return null;

  try {
    const raw = resolvedStorage.getItem(FOUR_SHOT_PHOTO_HANDOFF_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FourShotPhotoHandoffPayload;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}
