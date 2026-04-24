import type { ContentLane } from "@/types";

export const HOOK_OVERLAY_MAX_LINE_LENGTH = 28;
export const HOOK_OVERLAY_MAX_LINES = 2;
export const FACEBOOK_COVER_FRAME_MAX_LINE_LENGTH = 26;
export const FACEBOOK_COVER_FRAME_MAX_LINES = 2;

export const HOOK_FAMILY_ORDER = ["danger", "curiosity", "reversal"] as const;

export type HookFamilySupport = (typeof HOOK_FAMILY_ORDER)[number];
export type CaptionMode = "default" | "us-only";
export type HookBuildOptions = {
  contentLane?: ContentLane;
};
export type CaptionOptions = {
  mode?: CaptionMode;
  contentLane?: ContentLane;
};
export type HashtagOptions = {
  count?: number;
  contentLane?: ContentLane;
};

const CLICKBAIT_PATTERNS = [
  /\byou won['’]t believe\b/i,
  /\bwait for it\b/i,
  /\bnobody expected\b/i,
  /\bwatch till the end\b/i,
  /\bwatch to the end\b/i,
  /\bcomment who wins\b/i,
  /\bcomment below\b/i,
  /\btag a friend\b/i,
  /\bshare before it(?:'|’)s gone\b/i,
  /\blike if you agree\b/i,
] as const;

const HYPE_FILLER_PATTERNS = [
  /\bshocking\b/i,
  /\bbrutal\b/i,
  /\binsane\b/i,
  /\bcraziest\b/i,
  /\bunbelievable\b/i,
] as const;

export const OBSERVATIONAL_SIGNAL_PATTERN =
  /\b(pressure|spacing|claim|timing|posture|waterline|window|stance|distance|footing|surface break|brace|turn|ground|clash|angle|territory|warning-step|breakaway|survival|antler|shoulder|standoff|pursuit|strike|contact)\b/i;

const FORCED_ENGAGEMENT_PATTERN =
  /\b(who wins\??|comment below|tag a friend|watch till the end|watch to the end|like if you agree|share before it(?:'|’)s gone)\b/i;

export function hasBaitLikeCopy(text: string): boolean {
  const compact = String(text ?? "");
  return [...CLICKBAIT_PATTERNS, ...HYPE_FILLER_PATTERNS].some((pattern) =>
    pattern.test(compact)
  );
}

export function hasForcedEngagementCopy(text: string): boolean {
  return FORCED_ENGAGEMENT_PATTERN.test(String(text ?? ""));
}

export function evaluateHookCopyQuality(
  text: string,
  predator = "",
  prey = ""
): {
  score: number;
  hasSpeciesClarity: boolean;
  hasObservationalTone: boolean;
  hasBait: boolean;
} {
  const compact = normalizeCopy(text);
  const lower = compact.toLowerCase();
  const speciesTerms = [predator, prey]
    .map((value) => normalizeCopy(value).toLowerCase())
    .filter(Boolean);
  const hasSpeciesClarity = speciesTerms.some((term) => lower.includes(term));
  const hasObservationalTone = OBSERVATIONAL_SIGNAL_PATTERN.test(lower);
  const hasBait = hasBaitLikeCopy(compact) || hasForcedEngagementCopy(compact);

  let score = 40;
  if (hasSpeciesClarity) score += 20;
  if (hasObservationalTone) score += 20;
  if (!hasBait) score += 15;
  if (compact.length > 0 && compact.length <= 96) score += 5;

  return {
    score: Math.max(0, Math.min(100, score)),
    hasSpeciesClarity,
    hasObservationalTone,
    hasBait,
  };
}

export function sanitizeSocialEnv(env: string): string {
  return String(env ?? "")
    .replace(/\s*with geothermal steam/gi, "")
    .replace(/\bgeothermal steam\b/gi, "")
    .replace(/\bsteam vents?\b/gi, "")
    .replace(/\bmist\b/gi, "")
    .replace(/\bhaze\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+,/g, ",")
    .trim();
}

export function normalizeCopy(text: string): string {
  return String(text ?? "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;!?])/g, "$1")
    .trim();
}

export function splitSentences(text: string): string[] {
  return (
    normalizeCopy(text)
      .match(/[^.!?]+[.!?]?/g)
      ?.map((sentence) => normalizeCopy(sentence))
      .filter(Boolean) ?? []
  );
}

export function trimAtWordBoundary(text: string, maxChars: number): string {
  const compact = normalizeCopy(text);
  if (compact.length <= maxChars) return compact;

  const words = compact.split(/\s+/).filter(Boolean);
  let wordSafe = "";
  for (const word of words) {
    const next = wordSafe ? `${wordSafe} ${word}` : word;
    if (next.length > maxChars) break;
    wordSafe = next;
  }
  const resolved = normalizeCopy(wordSafe.replace(/[,:;/-]+$/g, ""));
  const terminalQuestionOrBang = compact.match(/[!?]$/)?.[0];

  if (!resolved) return compact.trim();
  if (/[.!?]$/.test(resolved)) return resolved;
  if (
    terminalQuestionOrBang &&
    `${resolved}${terminalQuestionOrBang}`.length <= maxChars
  ) {
    return `${resolved}${terminalQuestionOrBang}`;
  }
  return `${resolved}.`;
}

export function finalizeHookCopy(raw: string): string {
  const compact = normalizeCopy(raw);
  const limitedSentences =
    splitSentences(compact).slice(0, 2).join(" ") || compact;
  return trimAtWordBoundary(limitedSentences.trim(), 96);
}

export function toHashtag(value: string): string {
  const compact = String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "")
    .trim();
  return compact ? `#${compact}` : "";
}

export function toTag(value: string): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
