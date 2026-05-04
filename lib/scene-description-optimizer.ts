import type { Arc, ContentLane, HabitatPreset, Weather } from "@/types";

type SceneDescriptionOptimizerInput = {
  predator: string;
  prey: string;
  arc: Arc;
  habitat: HabitatPreset;
  weather: Weather;
  contentLane: ContentLane;
  finalEnvironment: string;
  sceneDescription?: string;
  variant?: number;
};

const DIRECT_WATER_PREDATORS = [
  "crocodile",
  "alligator",
  "caiman",
  "nile crocodile",
  "saltwater crocodile",
] as const;
const CONDITIONAL_WATER_PREDATORS = ["bear", "bald eagle", "eagle", "jaguar"] as const;
const WATER_PREY = [
  "salmon",
  "fish",
  "trout",
  "seal",
  "duck",
  "water buffalo",
  "frog",
  "crayfish",
] as const;
const WATER_ENVIRONMENT_TERMS = [
  "river",
  "water",
  "marsh",
  "swamp",
  "coast",
  "shore",
  "lake",
  "ocean",
  "surf",
  "fjord",
  "creek",
  "reeds",
  "wetland",
  "waterline",
  "mudbank",
  "waterhole",
] as const;
const HEAVY_DEFENDER_TERMS = [
  "bison",
  "moose",
  "bull elk",
  "musk ox",
  "cape buffalo",
  "water buffalo",
  "rhinoceros",
  "elephant",
] as const;
const CHASE_ARCS = new Set<Arc>([
  "Chase and takedown",
  "Escape from danger",
  "Pack hunting strategy",
]);

function cleanWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function toLower(value: string): string {
  return cleanWhitespace(value).toLowerCase();
}

function includesAny(value: string, candidates: readonly string[]): boolean {
  const lowerValue = toLower(value);
  return candidates.some((candidate) => lowerValue.includes(candidate));
}

function compactEnvironmentLabel(habitat: HabitatPreset, finalEnvironment: string): string {
  const base = habitat === "Auto" ? finalEnvironment : habitat;
  const firstSegment = String(base ?? "")
    .split(/[.]/)[0]
    .split(",")[0]
    .replace(/\s+/g, " ")
    .trim();

  if (!firstSegment) return "open wildlife habitat";

  return firstSegment
    .replace(/^the\s+/i, "")
    .replace(/\bwith\b.*$/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function weatherPhrase(weather: Weather): string {
  switch (weather) {
    case "Golden Hour":
      return " in golden-hour light";
    case "Dawn":
      return " at dawn";
    case "Overcast":
      return " under overcast light";
    case "Storm":
      return " under storm light";
    case "Midday Heat":
      return " in hard midday light";
    case "Winter Blizzard":
      return " in blowing winter light";
    case "Frozen Dusk":
      return " at frozen dusk";
    default:
      return "";
  }
}

function isWaterCompatible(predator: string, prey: string, environment: string, contentLane: ContentLane): boolean {
  const predatorLower = toLower(predator);
  const preyLower = toLower(prey);
  const environmentLower = toLower(environment);

  if (contentLane === "Fishing Strike") return true;
  if (includesAny(predatorLower, DIRECT_WATER_PREDATORS)) return true;
  if (includesAny(preyLower, WATER_PREY)) return true;
  if (includesAny(environmentLower, WATER_ENVIRONMENT_TERMS)) return true;

  return (
    includesAny(predatorLower, CONDITIONAL_WATER_PREDATORS) &&
    (includesAny(preyLower, WATER_PREY) || includesAny(environmentLower, WATER_ENVIRONMENT_TERMS))
  );
}

function isHeavyDefenderPair(predator: string, prey: string, arc: Arc, contentLane: ContentLane): boolean {
  if (arc === "Defender stands ground" || contentLane === "Defender") return true;
  return includesAny(predator, HEAVY_DEFENDER_TERMS) || includesAny(prey, HEAVY_DEFENDER_TERMS);
}

function isChaseLane(arc: Arc, contentLane: ContentLane): boolean {
  return contentLane === "Escape" || contentLane === "Pack Hunt" || CHASE_ARCS.has(arc);
}

function finalizeDescription(value: string): string {
  const compact = cleanWhitespace(value);
  if (compact.length <= 260) return compact;

  const words = compact.split(" ");
  let trimmed = "";
  for (const word of words) {
    const next = trimmed ? `${trimmed} ${word}` : word;
    if (next.length > 256) break;
    trimmed = next;
  }

  const safe = trimmed.replace(/[,:;\-]+$/g, "").trim();
  return /[.!?]$/.test(safe) ? safe : `${safe}.`;
}

export function buildQaSafeSceneDescription({
  predator,
  prey,
  arc,
  habitat,
  weather,
  contentLane,
  finalEnvironment,
  variant = 0,
}: SceneDescriptionOptimizerInput): string {
  const setting = compactEnvironmentLabel(habitat, finalEnvironment);
  const weatherTail = weatherPhrase(weather);
  const variantIndex = Math.abs(variant) % 3;

  const predatorMove = ["steps forward", "drives one step forward", "commits one forward step"][variantIndex] ?? "steps forward";
  const preyReact = ["reacts toward cover", "breaks toward cover", "turns toward cover"][variantIndex] ?? "reacts toward cover";
  const chasePredatorMove = ["closes the open lane", "tightens the chase lane", "cuts the escape lane"][variantIndex] ?? "closes the open lane";
  const chasePreyReact = ["bursts toward cover", "breaks hard toward cover", "surges toward cover"][variantIndex] ?? "bursts toward cover";
  const waterPreyReact = ["recoils toward open ground", "kicks toward open ground", "jerks toward open ground"][variantIndex] ?? "recoils toward open ground";
  const heavyPreyReact = ["braces in place", "holds its ground", "plants and braces"][variantIndex] ?? "braces in place";

  if (isWaterCompatible(predator, prey, setting, contentLane)) {
    return finalizeDescription(
      `Slow low push-in near the waterline in ${setting}${weatherTail} as ${predator} surges once and ${prey} ${waterPreyReact}, keeping both animals readable with grounded motion and clean spacing.`
    );
  }

  if (isHeavyDefenderPair(predator, prey, arc, contentLane)) {
    return finalizeDescription(
      `Slow documentary push-in across ${setting}${weatherTail} as ${predator} ${predatorMove} and ${prey} ${heavyPreyReact}, keeping full bodies readable with grounded motion, clear scale, and clean spacing.`
    );
  }

  if (isChaseLane(arc, contentLane)) {
    return finalizeDescription(
      `Slow tracking push-in across ${setting}${weatherTail} as ${predator} ${chasePredatorMove} and ${prey} ${chasePreyReact}, keeping both animals fully readable with grounded motion and clean spacing.`
    );
  }

  return finalizeDescription(
    `Slow push-in through ${setting}${weatherTail} as ${predator} ${predatorMove} and ${prey} ${preyReact}, keeping both animals fully readable with grounded motion, stable scale, and clean spacing.`
  );
}
