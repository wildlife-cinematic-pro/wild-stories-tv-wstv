import type { GeneratedPackage } from "@/types";

export type OutputReadinessItem = {
  label: string;
  status: "pass" | "warning";
  detail: string;
};

export type OutputReadinessReport = {
  status: "Ready" | "Needs review";
  items: OutputReadinessItem[];
};

type OutputReadinessInput = {
  predatorName?: string;
  preyName?: string;
  imagePrompt?: string;
  runwayShots?: string[];
  klingShots?: string[];
  seedanceShots?: string[];
  caption?: string;
  hashtags?: string;
  negativePrompt?: string;
  routingNote?: string;
};

function safeText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map(String).join("\n").trim();
  return String(value ?? "").trim();
}

function includesAllTerms(text: string, terms: string[]): boolean {
  return terms.every((term) => text.includes(term));
}

function hasCameraCue(text: string): boolean {
  return /(camera|push-?in|handheld|locked|dolly|pan|zoom|tracking|pullback)/i.test(
    text
  );
}

function hasSubjectAction(text: string): boolean {
  return /(moves?|surges?|runs?|reacts?|lunges?|steps?|turns?|charges?|pulls?|drags?|bursts?|chases?)/i.test(
    text
  );
}

function hasSafetyCue(text: string): boolean {
  return /(no blood|no gore|no visible wounds|visible wounds avoided|clean anatomy|facebook-safe|documentary survival tension)/i.test(
    text
  );
}

export function analyzeOutputReadiness(
  input: OutputReadinessInput | GeneratedPackage
): OutputReadinessReport {
  const predator = safeText(input.predatorName).toLowerCase();
  const prey = safeText(input.preyName).toLowerCase();
  const imagePrompt = safeText(input.imagePrompt);
  const runwayText = safeText(input.runwayShots);
  const klingText = safeText(input.klingShots);
  const seedanceText = safeText(input.seedanceShots);
  const caption = safeText(input.caption);
  const hashtags = safeText(input.hashtags);
  const negativePrompt = safeText(input.negativePrompt);
  const routingNote = safeText(input.routingNote);
  const outputText = [
    imagePrompt,
    runwayText,
    klingText,
    seedanceText,
    caption,
    hashtags,
    negativePrompt,
    routingNote,
  ]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();

  const hasIdentity = Boolean(predator && prey) &&
    includesAllTerms(outputText, [predator, prey]);
  const cameraCue = hasCameraCue(outputText);
  const subjectAction = hasSubjectAction(outputText);
  const safetyCue = hasSafetyCue(outputText);
  const engineSections = Boolean(runwayText || klingText || seedanceText);
  const socialPack = Boolean(caption && hashtags);

  const items: OutputReadinessItem[] = [
    {
      label: "Animal identity included",
      status: hasIdentity ? "pass" : "warning",
      detail: hasIdentity
        ? "Both animals are named in the current output pack."
        : "Add the lead and opposing animal names to the exported prompt set.",
    },
    {
      label: "Camera cue included",
      status: cameraCue ? "pass" : "warning",
      detail: cameraCue
        ? "At least one camera movement or framing cue is present."
        : "Add a simple camera cue like push-in, handheld, locked, dolly, or pan.",
    },
    {
      label: "Subject action included",
      status: subjectAction ? "pass" : "warning",
      detail: subjectAction
        ? "The output describes readable movement or reaction."
        : "Add one clear animal action so the motion handoff is easier to test.",
    },
    {
      label: "Safety wording present",
      status: safetyCue ? "pass" : "warning",
      detail: safetyCue
        ? "Safety phrasing is present for non-graphic wildlife output."
        : "Add concise non-graphic safety wording before export.",
    },
    {
      label: "Engine sections available",
      status: engineSections ? "pass" : "warning",
      detail: engineSections
        ? "At least one engine-ready video prompt section is available."
        : "Generate or restore the video prompt sections before exporting.",
    },
    {
      label: "Caption and hashtags available",
      status: socialPack ? "pass" : "warning",
      detail: socialPack
        ? "Social copy is packaged with the output."
        : "Add or regenerate caption and hashtags before posting.",
    },
  ];

  return {
    status: items.every((item) => item.status === "pass")
      ? "Ready"
      : "Needs review",
    items,
  };
}
