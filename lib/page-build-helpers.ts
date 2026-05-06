import { arcs, depthModes, weatherOptions } from "@/lib/model-specs";
import { buildQaSafeSceneDescription } from "@/lib/scene-description-optimizer";

import type {
  Arc,
  ContentLane,
  DepthMode,
  HabitatPreset,
  PipelineStyle,
  PredatorInfo,
  Weather,
} from "@/types";

export type DriftRisk = PredatorInfo["driftRisk"];

export type NormalizedPreset = {
  prey: string[];
  environment: string;
  lighting: string;
  cameraGear: string;
  texture: string;
  defaultArc: Arc;
  driftRisk: DriftRisk;
};

export function formatPipelineStyleLabel(style: PipelineStyle): string {
  return style === "long-hybrid-4-shot"
    ? "Hybrid 4-shot (50s)"
    : "Hybrid 4-shot";
}

export function buildAutoSceneDescription({
  predator,
  prey,
  arc,
  habitat,
  environment,
  weather = "Golden Hour",
  contentLane = "Auto",
  variant = 0,
}: {
  predator: string;
  prey: string;
  arc: Arc;
  habitat: HabitatPreset;
  environment: string;
  weather?: Weather;
  contentLane?: ContentLane;
  variant?: number;
}): string {
  return buildQaSafeSceneDescription({
    predator,
    prey,
    arc,
    habitat,
    weather,
    contentLane,
    finalEnvironment: environment,
    variant,
  });
}

function toDriftRisk(value: unknown): DriftRisk {
  if (value === "LOW" || value === "MEDIUM" || value === "HIGH") return value;

  if (typeof value === "number" && Number.isFinite(value)) {
    if (value < 0.34) return "LOW";
    if (value < 0.67) return "MEDIUM";
    return "HIGH";
  }

  return "MEDIUM";
}

export function normalizeArcValue(value: unknown, fallback: Arc = "Ambush attack"): Arc {
  if (typeof value !== "string") return fallback;
  return normalizeArcSuggestion(value) ?? fallback;
}

export function normalizePreset(input: unknown, fallback: NormalizedPreset): NormalizedPreset {
  const obj = (input ?? {}) as Record<string, unknown>;
  const prey =
    Array.isArray(obj.prey) && obj.prey.every((item) => typeof item === "string")
      ? (obj.prey as string[])
      : fallback.prey;
  const environment =
    typeof obj.environment === "string" ? obj.environment : fallback.environment;
  const lighting = typeof obj.lighting === "string" ? obj.lighting : fallback.lighting;
  const cameraGear =
    typeof obj.cameraGear === "string" ? obj.cameraGear : fallback.cameraGear;
  const texture = typeof obj.texture === "string" ? obj.texture : fallback.texture;
  const defaultArc = normalizeArcValue(obj.defaultArc, fallback.defaultArc);
  const driftRisk = toDriftRisk(obj.driftRisk);

  return {
    prey: prey.length ? prey : fallback.prey,
    environment,
    lighting,
    cameraGear,
    texture,
    defaultArc,
    driftRisk,
  };
}

export function normalizeWeatherSuggestion(value: string | undefined): Weather | null {
  if (!value) return null;
  if ((weatherOptions as readonly string[]).includes(value)) return value as Weather;

  const normalized = value.toLowerCase();

  if (normalized.includes("golden") || normalized.includes("sunset")) return "Golden Hour";
  if (normalized.includes("overcast") || normalized.includes("cloud")) return "Overcast";
  if (normalized.includes("storm") || normalized.includes("rain") || normalized.includes("thunder")) return "Storm";
  if (normalized.includes("dawn") || normalized.includes("sunrise")) return "Dawn";
  if (normalized.includes("midday") || normalized.includes("noon") || normalized.includes("heat")) return "Midday Heat";
  if (normalized.includes("blizzard") || normalized.includes("whiteout")) return "Winter Blizzard";
  if (normalized.includes("frozen dusk") || normalized.includes("blue hour")) return "Frozen Dusk";
  if (normalized.includes("snow") || normalized.includes("winter")) return "Winter Blizzard";

  return null;
}

export function normalizeDepthSuggestion(value: string | undefined): DepthMode | null {
  if (!value) return null;
  if ((depthModes as readonly string[]).includes(value)) return value as DepthMode;

  const normalized = value.toLowerCase();

  if (normalized.includes("cinematic blur") || normalized.includes("shallow")) {
    return "Cinematic Blur";
  }
  if (normalized.includes("balanced")) return "Balanced Depth";
  if (
    normalized.includes("deep focus") ||
    normalized.includes("detailed") ||
    normalized.includes("deep")
  ) {
    return "Detailed Background";
  }

  return null;
}

export function normalizeArcSuggestion(value: string | undefined): Arc | null {
  if (!value) return null;
  if ((arcs as readonly string[]).includes(value)) return value as Arc;

  const normalized = value.toLowerCase();

  if (normalized.includes("ambush")) return "Ambush attack";
  if (normalized.includes("pack")) return "Pack hunting strategy";
  if (normalized.includes("escape")) return "Escape from danger";
  if (normalized.includes("territory") || normalized.includes("dominance")) {
    return "Territory dominance battle";
  }
  if (normalized.includes("predator") && normalized.includes("fight")) {
    return "Predator vs predator fight";
  }
  if (
    normalized.includes("standoff") ||
    normalized.includes("stands ground") ||
    normalized.includes("defender")
  ) {
    return "Defender stands ground";
  }
  if (normalized.includes("giant") || normalized.includes("clash")) {
    return "Giant vs giant clash";
  }
  if (normalized.includes("chase") || normalized.includes("takedown")) {
    return "Chase and takedown";
  }

  return null;
}
