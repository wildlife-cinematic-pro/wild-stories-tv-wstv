import type { Weather } from "@/types";

import { weatherVariants } from "@/lib/predator-data";

// [House] Observed practical prompt budget; vendor hard limit not yet confirmed.
export const KLING_CHAR_LIMIT = 2500;

export function validateKlingPromptLength(prompt: string): {
  length: number;
  isOver: boolean;
  remaining: number;
  warning: string | null;
} {
  const length = prompt.length;
  const isOver = length > KLING_CHAR_LIMIT;
  const remaining = KLING_CHAR_LIMIT - length;

  return {
    length,
    isOver,
    remaining,
    warning: isOver
      ? `⚠️ Kling prompt ${length} chars — limit ${Math.abs(remaining)} chars le nacheko. Kling le silently truncate garxa!`
      : null,
  };
}

const SOCIAL_COPY_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\btakedown\b/gi, "capture"],
  [/\bbite\b/gi, "grip"],
  [/\bmaul\b/gi, "overpower"],
  [/\bkill\b/gi, "defeat"],
  [/\broll\b/gi, "tumble"],
];

export function finalizeGenerationText(input: string): string {
  return String(input ?? "")
    .replace(/\.\s*\./g, ". ")
    .replace(/([!?])\s*([!?])/g, "$1 ")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function sanitizeSocialCopyText(input: string): string {
  let out = finalizeGenerationText(input);
  for (const [re, repl] of SOCIAL_COPY_REPLACEMENTS) out = out.replace(re, repl);
  return finalizeGenerationText(out);
}

export function finalizePrompt(input: string): string {
  return finalizeGenerationText(input);
}

function normalizeBrokenSceneTail(input: string): string {
  return finalizeGenerationText(input)
    .replace(/\bClear U\.\s*$/g, "Clear U.S. wildlife setup.")
    .replace(/\bClear U\.S\s*$/g, "Clear U.S. wildlife setup.")
    .replace(/\bClear U\.S\.\s*$/g, "Clear U.S. wildlife setup.");
}

export function clipPromptContext(input: string, maxChars = 150): string {
  const compact = normalizeBrokenSceneTail(input);
  if (compact.length <= maxChars) return compact;

  const words = compact.split(/\s+/).filter(Boolean);
  let wordSafe = "";

  for (const word of words) {
    const next = wordSafe ? `${wordSafe} ${word}` : word;
    if (next.length > maxChars) break;
    wordSafe = next;
  }

  const resolved = normalizeBrokenSceneTail(wordSafe.replace(/[,:;/-]+$/g, ""));

  if (!resolved) return compact.trim();
  return /[.!?]$/.test(resolved) ? resolved : `${resolved}.`;
}

export function stripLegacyImageFlags(input: string): string {
  return finalizeGenerationText(
    String(input ?? "")
      .replace(/--ar\s+\S+/gi, "")
      .replace(/--style\s+\S+/gi, "")
      .replace(/--v\s+\S+/gi, "")
      .replace(/--q\s+\S+/gi, "")
      .replace(/--s\s+\S+/gi, "")
  );
}

export function sanitizeRunwayFPS(prompt: string): string {
  return prompt.replace(/\b30\s*fps\b/gi, "").replace(/\b30fps\b/gi, "").trim();
}

export function sanitizeRunwayNegative(prompt: string): string {
  const negativeStart = /^(?:no|never|avoid|do not|don't)\b/i;
  const sentences = prompt.match(/[^.!?]+[.!?]?/g) ?? [prompt];

  const kept = sentences.filter((sentence) => {
    const trimmed = sentence.trim();
    if (!trimmed) return false;

    const normalized = trimmed.replace(/^[–—-]\s*/, "");
    if (!negativeStart.test(normalized)) return true;

    const body = normalized.replace(/[.!?]+$/, "");
    const parts = body
      .split(/[;,]/)
      .map((part) => part.trim())
      .filter(Boolean);

    const allNegative =
      parts.length > 0 && parts.every((part) => negativeStart.test(part));

    return !allNegative;
  });

  return kept
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;!?])/g, "$1")
    .trim();
}

export function sanitizeRunwayPrompt(prompt: string): string {
  return sanitizeRunwayNegative(sanitizeRunwayFPS(prompt))
    .replace(/\(no contact yet\)/gi, "(contact has not landed yet)")
    .replace(/no contact yet/gi, "contact has not landed yet")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function sanitizeImageEnv(env: string): string {
  return String(env ?? "")
    .replace(/\s*with geothermal steam/gi, "")
    .replace(/\bgeothermal steam\b/gi, "")
    .replace(/\bsteam vents?\b/gi, "")
    .replace(/\bsmoke plumes?\b/gi, "")
    .replace(/\bdust clouds?\b/gi, "")
    .replace(/\bdust haze\b/gi, "")
    .replace(/\bfog\b/gi, "")
    .replace(/\bmist\b/gi, "")
    .replace(/\bhaze\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/,\s*,/g, ",")
    .replace(/,\s*\./g, ".")
    .trim();
}

export function sanitizeWeatherPhrase(phrase: string): string {
  return String(phrase ?? "")
    .replace(/\bbreath steam visible\b/gi, "clean cold-air clarity")
    .replace(/\bvisible breath vapor\b/gi, "clean cold-air clarity")
    .replace(/\bvisible breath in [^,.;]+/gi, "clean cold-air clarity")
    .replace(/\bvisible breath\b/gi, "clean cold-air clarity")
    .replace(/\bbreath vapor\b/gi, "clean cold-air clarity")
    .replace(/\bbreath mist\b/gi, "clean cold-air clarity")
    .replace(/\bbreath clouds\b/gi, "clean cold-air clarity")
    .replace(/\bmouth vapor\b/gi, "clean cold-air clarity")
    .replace(/\bnose steam\b/gi, "clean cold-air clarity")
    .replace(/\bsteam\b/gi, "")
    .replace(/\bdust clouds?\b/gi, "clear air")
    .replace(/\bdust haze\b/gi, "clear air")
    .replace(/\bfog\b/gi, "")
    .replace(/\bmist\b/gi, "")
    .replace(/\bhaze\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/,\s*,/g, ",")
    .replace(/,\s*\./g, ".")
    .trim();
}

export function sanitizeLightingPhrase(lighting: string, weather: Weather): string {
  const cleanLighting = String(lighting ?? "")
    .replace(/\b8k raw\b/gi, "")
    .replace(/\braw\b/gi, "")
    .replace(/,?\s*\bwarm\s+\d{3,5}[Kk]\s*colou?r\s*temperature/gi, "")
    .replace(/,?\s*\bwarm\s+\d{3,5}[Kk]\b/gi, "")
    .replace(/,?\s*\d{3,5}[Kk]\s*colou?r\s*temperature/gi, "")
    .replace(/,?\s*\d{3,5}[Kk]\b/gi, "")
    .replace(/,?\s*clean ambush readability/gi, "")
    .replace(/\bbacklit dust clouds?\b/gi, "clean warm rim light")
    .replace(/\bdust clouds?\b/gi, "clear air")
    .replace(/\bdust haze\b/gi, "clear air")
    .replace(/\bsoft atmospheric haze\b/gi, "clear air")
    .replace(/\batmospheric mist\b/gi, "clear air")
    .replace(/\bthin ground mist\b/gi, "clear air")
    .replace(/\blow mist at ground level\b/gi, "clear air")
    .replace(/\bdrifting fog\b/gi, "clear air")
    .replace(/\bfog\b/gi, "")
    .replace(/\bmist\b/gi, "")
    .replace(/\bhaze\b/gi, "")
    .replace(/\bvisible breath vapor\b/gi, "clean cold-air clarity")
    .replace(/\bvisible breath\b/gi, "clean cold-air clarity")
    .replace(/\bbreath steam visible\b/gi, "clean cold-air clarity")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/,\s*,/g, ",")
    .replace(/,\s*\./g, ".")
    .replace(/,?\s*dusty\s+atmosphere/gi, "")
    .replace(/,?\s*amber\s+dust\s+in\s+air/gi, "")
    .replace(/,?\s*dry\s+field\s+dust/gi, "")
    .replace(/,?\s*dust\s+motes[^,]*/gi, "")
    .replace(/,?\s*\bdust\b/gi, "")
    .replace(/\bdusty\b/gi, "")
    .trim();

  const weatherLighting = sanitizeWeatherPhrase(weatherVariants[weather]);

  if (!cleanLighting) return weatherLighting;
  if (!weatherLighting) return cleanLighting;
  if (cleanLighting.toLowerCase().includes(weatherLighting.toLowerCase())) {
    return cleanLighting;
  }

  return `${cleanLighting}, ${weatherLighting}`;
}

export function sanitizeImageTexture(texture: string, env: string): string {
  const isArctic = isArcticEnv(env);

  let out = String(texture ?? "")
    .replace(/\bdusty\b/gi, "")
    .replace(/,?\s*realistic\s+canyon\s+dust/gi, "")
    .replace(/,?\s*dust\s+on\s+(?:coat|muzzle|nose\s+and\s+whiskers|paws\s+and\s+whiskers)/gi, "")
    .replace(/,?\s*red\s+dust\s+on\s+paws/gi, "")
    .replace(/,?\s*mountain\s+dust\s+on\s+paws/gi, "")
    .replace(/\bdust on hooves\b/gi, "clean hooves")
    .replace(/\bmagazine.quality\s+detail\b[^]*?(?:biological authenticity\.?)/gi, "")
    .replace(/\brazor[–—-]sharp on subject\b[^,.]*/gi, "")
    .replace(/,?\s*natural environmental context visible/gi, "")
    .replace(/,?\s*biological authenticity/gi, "")
    .replace(
      /\bfine scent-spray mist visible when threatened\b/gi,
      "raised tail plume and defensive warning posture"
    )
    .replace(/\bvisible breath plumes\b/gi, "clean muzzle detail")
    .replace(/\bvisible breath vapor\b/gi, "clean muzzle detail")
    .replace(/\bvisible breath in [^,.;]+/gi, "clean muzzle detail")
    .replace(/\bvisible breath\b/gi, "clean muzzle detail")
    .replace(/\bbreath plumes\b/gi, "clean muzzle detail")
    .replace(/\bbreath vapor\b/gi, "clean muzzle detail")
    .replace(/\bbreath clouds?( in [^,.;]+)?\b/gi, "clean muzzle detail")
    .replace(/\bbreath mist( in [^,.;]+)?\b/gi, "clean muzzle detail")
    .replace(/\bbreath steam( visible)?\b/gi, "clean muzzle detail")
    .replace(/\bdust clouds?\b/gi, "clean ground-contact detail")
    .replace(/\bsmoke\b/gi, "")
    .replace(/\bmist\b/gi, "")
    .replace(/\bhaze\b/gi, "");

  if (isArctic) {
    out = out
      .replace(/\bsnow kicked from paws\b/gi, "clean snow contact around paws, no kicked-up snow")
      .replace(/\bkicked-up snow\b/gi, "clean snow contact")
      .replace(/\bkicked up snow\b/gi, "clean snow contact")
      .replace(/\bpowder movement\b/gi, "clean snow surface")
      .replace(/\bpowder spray\b/gi, "clean snow surface")
      .replace(/\bdust\b/gi, "clean ground-contact detail");
  } else {
    out = out
      .replace(/\bsnow kicked from paws\b/gi, "natural paw contact with grass and uneven ground")
      .replace(/\bkicked-up snow\b/gi, "natural ground-contact detail")
      .replace(/\bkicked up snow\b/gi, "natural ground-contact detail")
      .replace(/\bpowder movement\b/gi, "natural ground-contact detail")
      .replace(/\bpowder spray\b/gi, "natural ground-contact detail")
      .replace(/\bfrost on guard hairs\b/gi, "sunlit guard hairs")
      .replace(/\bicy fur detail\b/gi, "clean realistic fur texture")
      .replace(/\bsharp icy fur detail\b/gi, "clean realistic fur texture")
      .replace(/\bclean snow contact around paws\b/gi, "natural paw contact with grass and uneven ground")
      .replace(/\bsnow contact around paws\b/gi, "natural paw contact with grass and uneven ground")
      .replace(/\bsnow contact\b/gi, "natural ground-contact detail")
      .replace(/\bdust\b/gi, "clean ground-contact detail");
  }

  return out
    .replace(/\s{2,}/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/,\s*,/g, ",")
    .replace(/,\s*\./g, ".")
    .trim();
}

export function sanitizeVideoBeatText(text: string): string {
  return String(text ?? "")
    .replace(/\bexhales once\b/gi, "settles once")
    .replace(/\bbreath settling\b/gi, "posture settling")
    .replace(/\bbreath visible\b/gi, "posture tight and controlled")
    .replace(/\bheavy breath release\b/gi, "controlled reset")
    .replace(/\bbreath controlled\b/gi, "movement controlled")
    .trim();
}

function isArcticEnv(env: string): boolean {
  const s = String(env ?? "").toLowerCase();
  return (
    s.includes("snow") ||
    s.includes("tundra") ||
    s.includes("ice") ||
    s.includes("glacier") ||
    s.includes("frozen") ||
    s.includes("winter") ||
    s.includes("arctic")
  );
}
