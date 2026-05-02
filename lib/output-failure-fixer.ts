export type OutputFailureType =
  | "dust"
  | "extra-limbs"
  | "duplicate-animals"
  | "identity-drift"
  | "wrong-habitat"
  | "bad-ground-contact"
  | "cropped-body"
  | "too-much-camera-shake"
  | "gore-or-injury"
  | "unreadable-action"
  | "lighting-drift";

export type OutputFailureFix = {
  type: OutputFailureType;
  likelyCause: string;
  promptFix: string;
  negativePromptAdditions: string[];
  preventionRule: string;
};

type FailureDefinition = {
  type: OutputFailureType;
  keywords: RegExp[];
  likelyCause: string;
  promptFix: string;
  negativePromptAdditions: string[];
  preventionRule: string;
};

const FAILURE_LIBRARY: FailureDefinition[] = [
  {
    type: "dust",
    keywords: [/\bdhulo\b/i, /\bdust\b/i, /\bdirt spray\b/i, /\bdebris\b/i],
    likelyCause: "Ground detail or action language is encouraging loose particle spray.",
    promptFix:
      "Keep the ground clean and firm, no dust clouds, no dirt spray, and no debris burst during movement.",
    negativePromptAdditions: ["dust cloud", "dirt spray", "debris particles", "ground powder"],
    preventionRule: "If the frame must stay clean, say firm ground contact and no dust in the base prompt.",
  },
  {
    type: "extra-limbs",
    keywords: [/\bextra leg\b/i, /\bextra limbs?\b/i, /\btoo many legs\b/i],
    likelyCause: "Pose complexity or overlap is confusing the anatomy read.",
    promptFix:
      "Stable anatomy, correct limb count, clean silhouette separation, and no overlapping limb tangles.",
    negativePromptAdditions: ["extra limbs", "extra legs", "duplicated paws", "distorted anatomy"],
    preventionRule: "Keep full-body readability and avoid stacked limb poses in the source frame.",
  },
  {
    type: "duplicate-animals",
    keywords: [/\bduplicate\b/i, /\bsame animal two times\b/i, /\btwo predators\b/i],
    likelyCause: "Identity locking is weak or the prompt repeats the subject.",
    promptFix:
      "Exactly one lead animal and one opposing animal only, no duplicate animals, preserve the same source identity.",
    negativePromptAdditions: ["duplicate animals", "extra animal", "cloned animal"],
    preventionRule: "Say exactly one of each animal when the composition should stay two-subject only.",
  },
  {
    type: "identity-drift",
    keywords: [/\bidentity drift\b/i, /\bwrong animal\b/i, /\bturns into\b/i, /\bdrift\b/i],
    likelyCause: "The prompt is restating too much or not locking the source frame strongly enough.",
    promptFix:
      "Preserve the same source image identity, same markings, same scale, and same subject spacing with minimal restatement.",
    negativePromptAdditions: ["identity drift", "species change", "wrong markings"],
    preventionRule: "For i2v, keep identity in the image and keep the prompt motion-first.",
  },
  {
    type: "wrong-habitat",
    keywords: [/\bwrong habitat\b/i, /\bwrong environment\b/i, /\bdesert in swamp\b/i, /\bhabitat\b/i],
    likelyCause: "Habitat continuity is not locked tightly enough.",
    promptFix:
      "Preserve the same habitat, terrain, background depth, and region-correct environment with no habitat swap.",
    negativePromptAdditions: ["wrong habitat", "wrong biome", "mismatched environment"],
    preventionRule: "Name the habitat once and keep continuity language compact but explicit.",
  },
  {
    type: "bad-ground-contact",
    keywords: [/\bkhutta\b/i, /\bhoof\b/i, /\bpaw\b/i, /\bfloating\b/i, /\bground contact\b/i],
    likelyCause: "The body mass and footing are not anchored to the terrain strongly enough.",
    promptFix:
      "Grounded paw and hoof contact, believable weight transfer, stable footing, and no floating body parts.",
    negativePromptAdditions: ["floating animals", "floating paws", "broken footing"],
    preventionRule: "Always ask for grounded contact and readable body mass in the still and motion prompts.",
  },
  {
    type: "cropped-body",
    keywords: [/\bcrop(?:ped)?\b/i, /\bhead cut\b/i, /\bfeet cut\b/i, /\bcut off\b/i],
    likelyCause: "Framing is too tight for the action or the subjects are entering the edge of frame.",
    promptFix:
      "Keep both animals full-body visible, not cropped, with clear margin around head, feet, and tail.",
    negativePromptAdditions: ["cropped body", "cut off feet", "cut off head"],
    preventionRule: "Use wide framing and full-body readability before asking for faster motion.",
  },
  {
    type: "too-much-camera-shake",
    keywords: [/\bcamera shake\b/i, /\btoo shaky\b/i, /\bshaky\b/i],
    likelyCause: "The motion language is too chaotic for the shot length.",
    promptFix:
      "Use restrained natural camera shake only, keep the action readable, and avoid chaotic handheld swings.",
    negativePromptAdditions: ["excessive camera shake", "chaotic handheld blur"],
    preventionRule: "One camera move only, with readable subject spacing.",
  },
  {
    type: "gore-or-injury",
    keywords: [/\bgore\b/i, /\bblood\b/i, /\binjury\b/i, /\bwound\b/i],
    likelyCause: "The action language is too explicit or the safety line is missing.",
    promptFix:
      "No blood, no gore, no visible wounds, documentary survival tension only, readable non-graphic pressure.",
    negativePromptAdditions: ["blood", "gore", "visible wounds", "graphic injury"],
    preventionRule: "Keep the scene unresolved or pressure-focused instead of describing injury.",
  },
  {
    type: "unreadable-action",
    keywords: [/\bunreadable\b/i, /\btoo messy\b/i, /\bchaotic action\b/i],
    likelyCause: "Too many actions or overlapping bodies are competing in one beat.",
    promptFix:
      "Use one dominant action, keep both bodies readable, and preserve one clear attack or escape lane.",
    negativePromptAdditions: ["chaotic overlap", "unreadable action"],
    preventionRule: "Keep one primary action per shot and one clear camera move.",
  },
  {
    type: "lighting-drift",
    keywords: [/\blighting drift\b/i, /\bwrong light\b/i, /\blight changed\b/i],
    likelyCause: "Continuity language is not holding the time-of-day or exposure steady enough.",
    promptFix:
      "Preserve the same lighting direction, same time-of-day feel, and same exposure balance from the source frame.",
    negativePromptAdditions: ["lighting drift", "wrong time of day", "exposure shift"],
    preventionRule: "Repeat lighting continuity once, then let the image carry the rest.",
  },
];

function uniqueByType(items: OutputFailureFix[]): OutputFailureFix[] {
  const seen = new Set<OutputFailureType>();
  return items.filter((item) => {
    if (seen.has(item.type)) return false;
    seen.add(item.type);
    return true;
  });
}

function normalizeText(input: string): string {
  return String(input ?? "").replace(/\s+/g, " ").trim();
}

export function diagnoseOutputFailure(text: string): OutputFailureFix[] {
  const complaint = normalizeText(text);
  if (!complaint) return [];

  const matches = FAILURE_LIBRARY.filter((entry) =>
    entry.keywords.some((keyword) => keyword.test(complaint))
  ).map((entry) => ({
    type: entry.type,
    likelyCause: entry.likelyCause,
    promptFix: entry.promptFix,
    negativePromptAdditions: entry.negativePromptAdditions,
    preventionRule: entry.preventionRule,
  }));

  return uniqueByType(matches);
}

export function buildFailureRepairPrompt(
  fixes: OutputFailureFix[],
  basePrompt: string
): string {
  const uniqueFixes = uniqueByType(fixes);
  const fixText = uniqueFixes.map((fix) => fix.promptFix).join(" ");

  return normalizeText(`${basePrompt} Repair pass: ${fixText}`);
}

export function buildAlephRepairPrompt(
  fixes: OutputFailureFix[],
  basePrompt: string
): string {
  const uniqueFixes = uniqueByType(fixes);
  const prevention = uniqueFixes.map((fix) => fix.preventionRule).join(" ");

  return normalizeText(
    `Continuity repair prompt for the existing wildlife shot. Preserve original timing, subject identity, habitat, and edit intent. ${basePrompt} Fix pass: ${uniqueFixes
      .map((fix) => fix.promptFix)
      .join(" ")} Prevention: ${prevention}`
  );
}
