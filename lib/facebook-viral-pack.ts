import type { Arc } from "@/types";

import { makeFacebookCaption } from "@/lib/prompt-tools";

export type FacebookViralPackInput = {
  predatorName: string;
  preyName: string;
  arcName: Arc;
  environmentName: string;
  tone?: "documentary" | "danger" | "survival" | "mystery";
  aiDisclosure?: boolean;
};

export type FacebookViralPack = {
  caption150: string;
  hashtags: string[];
  hookText: string;
  pinnedComment: string;
  aiDisclosureLine?: string;
  safetyNote: string;
};

const ARC_HOOKS: Record<Arc, string> = {
  "Ambush attack": "This ambush turns fast",
  "Predator vs predator fight": "Only one holds the line",
  "Chase and takedown": "The escape lane is closing",
  "Escape from danger": "The gap is almost gone",
  "Territory dominance battle": "Who owns this ground?",
  "Pack hunting strategy": "The pressure line tightens",
  "Defender stands ground": "It refuses to give ground",
  "Giant vs giant clash": "The impact is coming",
};

function clampToLength(input: string, maxChars: number): string {
  const clean = String(input ?? "").replace(/\s+/g, " ").trim();
  if (clean.length <= maxChars) return clean;

  const words = clean.split(/\s+/).filter(Boolean);
  let output = "";
  for (const word of words) {
    const next = output ? `${output} ${word}` : word;
    if (next.length > maxChars) break;
    output = next;
  }
  return output.trim();
}

export function buildFacebookViralPack(
  input: FacebookViralPackInput
): FacebookViralPack {
  const captionData = makeFacebookCaption({
    predatorName: input.predatorName,
    preyName: input.preyName,
    arcName: input.arcName,
    environmentName: input.environmentName,
    tone: input.tone,
  });

  return {
    caption150: clampToLength(captionData.caption, 150),
    hashtags: captionData.hashtags.slice(0, 5),
    hookText: clampToLength(ARC_HOOKS[input.arcName] ?? "Wildlife pressure builds", 45),
    pinnedComment: `Would you bet on ${input.predatorName} or ${input.preyName} in this ${input.environmentName} setup?`,
    aiDisclosureLine: input.aiDisclosure
      ? "AI-generated cinematic wildlife scene."
      : undefined,
    safetyNote:
      "No blood, no gore, no visible wounds. Documentary survival tension only.",
  };
}
