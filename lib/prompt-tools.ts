import type { Arc } from "@/types";

const PRIORITY_NEGATIVE_TERMS = [
  "blood",
  "gore",
  "visible wounds",
  "extra limbs",
  "duplicate animals",
  "fused bodies",
  "distorted anatomy",
  "floating animals",
  "humans",
  "vehicles",
  "fences",
  "text",
  "watermark",
  "cartoon",
  "cgi",
  "excessive blur",
  "wrong habitat",
] as const;

export type FacebookCaptionInput = {
  predatorName: string;
  preyName: string;
  arcName?: Arc | string;
  environmentName?: string;
  tone?: string;
};

function normalizeText(input: string): string {
  return String(input ?? "")
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .trim();
}

function toSentenceChunks(input: string): string[] {
  const sentences = normalizeText(input).match(/[^.!?]+[.!?]?/g);
  return (sentences ?? [normalizeText(input)]).map((sentence) => sentence.trim()).filter(Boolean);
}

function wordSafeTrim(input: string, maxChars: number): string {
  const clean = normalizeText(input);
  if (clean.length <= maxChars) return clean;

  const words = clean.split(/\s+/).filter(Boolean);
  let output = "";
  for (const word of words) {
    const next = output ? `${output} ${word}` : word;
    if (next.length > maxChars) break;
    output = next;
  }

  return (output || clean.slice(0, maxChars)).replace(/[,:;/-]+$/g, "").trim();
}

function clampSentenceList(sentences: string[], maxChars: number): string {
  let output = "";
  for (const sentence of sentences) {
    const next = output ? `${output} ${sentence}` : sentence;
    if (next.length > maxChars) break;
    output = next;
  }

  return output ? normalizeText(output) : wordSafeTrim(sentences.join(" "), maxChars);
}

function cleanNegativeTerm(term: string): string {
  return normalizeText(
    term
      .replace(/^negative prompt\s*:\s*/i, "")
      .replace(/[.;]+$/g, "")
      .toLowerCase()
  );
}

function uniqueTerms(terms: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const term of terms) {
    const clean = cleanNegativeTerm(term);
    if (!clean || seen.has(clean)) continue;
    seen.add(clean);
    output.push(clean);
  }

  return output;
}

function removeRepeatedClauses(input: string): string {
  const clauses = normalizeText(input)
    .split(/,\s+/)
    .map((clause) => clause.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const output: string[] = [];
  for (const clause of clauses) {
    const key = clause.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(clause);
  }

  return normalizeText(output.join(", "));
}

export function clampPrompt(input: string, maxChars: number): string {
  const clean = normalizeText(input);
  if (clean.length <= maxChars) return clean;

  return clampSentenceList(toSentenceChunks(clean), maxChars);
}

export function reduceNegativePrompt(input: string, maxTerms: number): string {
  const rawTerms = normalizeText(input)
    .split(",")
    .map((term) => term.trim())
    .filter(Boolean);
  const unique = uniqueTerms(rawTerms);

  const prioritized = PRIORITY_NEGATIVE_TERMS.filter((term) => unique.includes(term));
  const remainder = unique.filter((term) => !prioritized.includes(term as (typeof PRIORITY_NEGATIVE_TERMS)[number]));
  const selected = [...prioritized, ...remainder].slice(0, maxTerms);

  return selected.join(", ");
}

export function makeKlingSafePrompt(input: string, maxChars = 2500): string {
  const cleaned = removeRepeatedClauses(
    normalizeText(input)
      .replace(/\bnegative prompt\s*:\s*[^.]+\.?/gi, "")
      .replace(/\bno\s*,\s*no\b/gi, "no")
      .replace(/\b(gory|graphic injury|torn flesh|dismemberment)\b/gi, "")
      .replace(/\s{2,}/g, " ")
  );

  return clampPrompt(cleaned, maxChars);
}

export function makeFacebookCaption(input: FacebookCaptionInput): {
  caption: string;
  hashtags: string[];
} {
  const toneLead =
    input.tone === "mystery"
      ? "What happens next?"
      : input.tone === "survival"
        ? "Survival pressure builds."
        : input.tone === "danger"
          ? "Danger closes fast."
          : "Wildlife tension, frame one.";

  const captionBase = `${toneLead} ${input.predatorName} vs ${input.preyName} in ${input.environmentName ?? "a locked natural habitat"}. Documentary-safe survival tension.`;
  const caption = clampPrompt(captionBase, 150);

  const baseTags = [
    "#WildlifeReels",
    `#${input.predatorName.replace(/[^A-Za-z0-9]/g, "")}`,
    `#${input.preyName.replace(/[^A-Za-z0-9]/g, "")}`,
    "#NatureDocumentary",
    "#USAWildlife",
  ];

  return {
    caption,
    hashtags: baseTags.slice(0, 5),
  };
}
