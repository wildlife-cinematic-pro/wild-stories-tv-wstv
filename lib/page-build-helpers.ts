import { arcs, depthModes, weatherOptions } from "@/lib/model-specs";

import type {
  Arc,
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

function buildSceneLeadSentence(
  predator: string,
  prey: string,
  arc: Arc,
  variant = 0
): string {
  const predatorLower = predator.toLowerCase();
  const preyLower = prey.toLowerCase();
  const variantIndex = Math.abs(variant) % 3;

  switch (arc) {
    case "Ambush attack":
      return [
        `The ${preyLower} looks up too late as the ${predatorLower} closes in.`,
        `The ${predatorLower} is already in range before the ${preyLower} reads the danger.`,
        `The ${preyLower} reacts late. The ${predatorLower} is already inside the moment.`,
      ][variantIndex] ?? "";
    case "Chase and takedown":
      return [
        `The ${predatorLower} commits first. The ${preyLower} has no time to reset.`,
        `The ${preyLower} loses space fast once the ${predatorLower} commits.`,
        `The ${predatorLower} drives the pace. The ${preyLower} never gets clear.`,
      ][variantIndex] ?? "";
    case "Defender stands ground":
      return [
        `The ${preyLower} keeps pressing. This ${predatorLower} never gives ground.`,
        `The ${predatorLower} holds position and the ${preyLower} walks into real pressure.`,
        `The ${preyLower} pushes closer. The ${predatorLower} refuses to move.`,
      ][variantIndex] ?? "";
    case "Giant vs giant clash":
      return [
        `${predator} and ${prey} get too close. One heavy step changes the standoff.`,
        `${predator} and ${prey} hold the same space too long. The clash turns fast.`,
        `${predator} and ${prey} stay chest-to-chest. The pressure shifts on one step.`,
      ][variantIndex] ?? "";
    case "Territory dominance battle":
      return [
        `The ${preyLower} crosses the wrong line. The ${predatorLower} answers immediately.`,
        `The ${predatorLower} reads the boundary first. The ${preyLower} pays for it.`,
        `The ${preyLower} steps too far in. The ${predatorLower} takes control fast.`,
      ][variantIndex] ?? "";
    case "Pack hunting strategy":
      return [
        `The ${preyLower} looks free for a second. Then the ${predatorLower} closes the lane.`,
        `The ${predatorLower} takes away the escape lane before the ${preyLower} can reset.`,
        `The ${preyLower} still has room, then the ${predatorLower} turns the spacing tight.`,
      ][variantIndex] ?? "";
    case "Predator vs predator fight":
      return [
        `${predator} and ${prey} meet too close. One bad read shifts control fast.`,
        `${predator} and ${prey} hold the same ground. One move changes the balance.`,
        `${predator} and ${prey} square up early. The control flips on one mistake.`,
      ][variantIndex] ?? "";
    case "Escape from danger":
      return [
        `The ${predatorLower} moves first. The ${preyLower} has almost no time to turn.`,
        `The ${preyLower} reads the danger late as the ${predatorLower} closes fast.`,
        `The ${predatorLower} commits instantly. The ${preyLower} is already under pressure.`,
      ][variantIndex] ?? "";
    default:
      return `${predator} and ${prey} get too close. The pressure turns readable fast.`;
  }
}

function compactSceneHabitatLabel(habitat: HabitatPreset, environment: string): string {
  const base = habitat === "Auto" ? environment : habitat;
  const cleaned = String(base ?? "")
    .split(/[.,]/)[0]
    .replace(/\bwith\b.*$/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return cleaned
    .split(/\s+/)
    .slice(0, 4)
    .join(" ")
    .toLowerCase();
}

function finalizeAutoSceneDescription(raw: string, maxChars = 120): string {
  const compact = String(raw ?? "").replace(/\s+/g, " ").trim();
  const sentences =
    compact.match(/[^.!?]+[.!?]?/g)?.map((sentence) => sentence.trim()).filter(Boolean) ?? [];
  const limited = (sentences.length ? sentences : [compact]).slice(0, 2).join(" ");

  if (limited.length <= maxChars) return limited;

  const firstSentence = sentences[0] ?? compact;
  if (firstSentence.length <= maxChars) return firstSentence;

  const words = firstSentence.split(/\s+/).filter(Boolean);
  let wordSafe = "";

  for (const word of words) {
    const next = wordSafe ? `${wordSafe} ${word}` : word;
    if (next.length > maxChars) break;
    wordSafe = next;
  }

  const resolved = wordSafe.replace(/[,:;/-]+$/g, "").trim();

  if (!resolved) return firstSentence.trim();
  return /[.!?]$/.test(resolved) ? resolved : `${resolved}.`;
}

export function buildAutoSceneDescription({
  predator,
  prey,
  arc,
  habitat,
  environment,
  variant = 0,
}: {
  predator: string;
  prey: string;
  arc: Arc;
  habitat: HabitatPreset;
  environment: string;
  variant?: number;
}): string {
  const variantIndex = Math.abs(variant) % 3;
  const lead = buildSceneLeadSentence(predator, prey, arc, variantIndex);
  const habitatLabel = compactSceneHabitatLabel(habitat, environment);
  const safeHabitatLabel = habitatLabel || "wildlife habitat";
  const context = [
    "Clear U.S. wildlife setup.",
    `Readable ${safeHabitatLabel} for a U.S. wildlife reel.`,
    "Fast U.S. wildlife opener with clear tension.",
  ][variantIndex] ?? "Clear U.S. wildlife setup.";

  return finalizeAutoSceneDescription(`${lead} ${context}`);
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
