import { getUSAudienceLaneBonus } from "@/lib/content-lanes";

import type { ContentLane, USAudienceScoreResult } from "@/types";

export type USWildlifeTier = "tier1" | "tier2" | "tier3";

export interface USAudienceScoreInput {
  predator: string;
  prey: string;
  environment: string;
  arc: string;
  contentLane?: ContentLane;
}

const TIER_1_SPECIES = new Set([
  "Grizzly Bear",
  "Wolf",
  "Bison",
  "Bull Elk",
  "Moose",
  "Mountain Lion",
  "Bald Eagle",
  "Alligator",
]);

const TIER_1_ENV_PATTERNS = [
  /yellowstone/i,
  /rocky/i,
  /alaska/i,
  /everglades/i,
  /american forest/i,
  /snowy american/i,
  /pacific northwest/i,
];

const TIER_1_ARCS = new Set([
  "Defender stands ground",
  "Giant vs giant clash",
  "Ambush attack",
  "Escape from danger",
  "Predator vs predator fight",
]);

function scoreSpecies(name: string): number {
  if (TIER_1_SPECIES.has(name)) return 35;
  return 18;
}

function scoreEnvironment(environment: string): number {
  return TIER_1_ENV_PATTERNS.some((pattern) => pattern.test(environment)) ? 35 : 18;
}

function scoreArc(arc: string): number {
  return TIER_1_ARCS.has(arc) ? 30 : 15;
}

export function scoreUSAudience(input: USAudienceScoreInput): USAudienceScoreResult {
  const speciesScore = Math.min(35, scoreSpecies(input.predator) + Math.floor(scoreSpecies(input.prey) / 2));
  const environmentScore = scoreEnvironment(input.environment);
  const arcScore = scoreArc(input.arc);
  const laneBonus = getUSAudienceLaneBonus(input);
  const total = Math.min(100, speciesScore + environmentScore + arcScore + laneBonus);

  let summary = "Moderate U.S. appeal.";
  if (total >= 85) summary = "Strong U.S. appeal with iconic wildlife and setting.";
  else if (total >= 70) summary = "Good U.S. appeal; concept is usable for U.S. testing.";
  else if (total < 55) summary = "Weak U.S. appeal; consider more iconic North American wildlife or setting.";

  if (laneBonus >= 4 && total >= 70) {
    summary = `${summary} Lane fit reinforces a familiar U.S. wildlife reel pattern.`;
  }

  return { total, speciesScore, environmentScore, arcScore, summary };
}
