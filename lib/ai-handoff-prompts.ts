type AiHandoffPromptInput = {
  predator: string;
  prey: string;
  sceneDescription?: string;
  workflowLabel?: string;
  qaScore?: number;
  qaStatus?: "Ready" | "Needs review" | "Risky";
  qaTopFixes?: string[];
  imagePrompt?: string;
  videoPrompt?: string;
  caption?: string;
  hashtags?: string;
};

const STRICT_GUARDRAILS = [
  "Do not change animal identities.",
  "Do not change habitat unless explicitly asked.",
  "Do not add or remove shots.",
  "Do not change engine names.",
  "Do not change export JSON or schema.",
  "Do not add gore, blood, injury, or graphic violence.",
  "Do not add timestamps or multi-shot structure unless already present.",
  "Do not expand the prompt.",
  "Preserve original structure.",
  "Keep wildlife documentary tone.",
  "Keep meaning intact.",
  "Keep formatting stable.",
];

function compactText(value: string | undefined, maxLength = 420) {
  const normalized = value?.trim().replace(/\s+/g, " ");

  if (!normalized) {
    return "";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

function buildContextLines(input: AiHandoffPromptInput) {
  const fixes = (input.qaTopFixes ?? [])
    .map((fix) => compactText(fix, 180))
    .filter(Boolean)
    .slice(0, 3);

  const lines = [
    "App context: WSTV wildlife prompt generator",
    `Animal pair: ${input.predator} vs ${input.prey}`,
    input.workflowLabel ? `Workflow: ${input.workflowLabel}` : "",
    input.sceneDescription
      ? `Scene description: ${compactText(input.sceneDescription, 260)}`
      : "",
    input.qaStatus ? `Final QA: ${input.qaStatus}${input.qaScore ? ` (${input.qaScore}/100)` : ""}` : "",
    fixes.length > 0 ? `Top QA fixes: ${fixes.join(" | ")}` : "",
    input.imagePrompt ? `Image prompt: ${compactText(input.imagePrompt)}` : "",
    input.videoPrompt ? `Video prompt: ${compactText(input.videoPrompt)}` : "",
    input.caption ? `Caption: ${compactText(input.caption, 220)}` : "",
    input.hashtags ? `Hashtags: ${compactText(input.hashtags, 180)}` : "",
  ];

  return lines.filter(Boolean).join("\n");
}

function buildGuardrailBlock() {
  return STRICT_GUARDRAILS.map((line) => `- ${line}`).join("\n");
}

export function buildReviewOnlyPrompt(input: AiHandoffPromptInput) {
  return [
    "Review only.",
    "List issues briefly.",
    "Do not rewrite the package.",
    "Do not change structure.",
    "Return concise findings only.",
    "",
    "Strict guardrails:",
    buildGuardrailBlock(),
    "",
    "Current package context:",
    buildContextLines(input),
  ].join("\n");
}

export function buildPolishOnlyPrompt(input: AiHandoffPromptInput) {
  return [
    "Polish only.",
    "Preserve structure.",
    "Preserve headings.",
    "Preserve animal identities.",
    "Preserve engine names and sections.",
    "Preserve shot count.",
    "Preserve line breaks as much as possible.",
    "Preserve meaning.",
    "Return polished text only.",
    "No explanation.",
    "",
    "Strict guardrails:",
    buildGuardrailBlock(),
    "",
    "Current package context:",
    buildContextLines(input),
  ].join("\n");
}

export function buildFixWeakSectionPrompt(input: AiHandoffPromptInput) {
  const weakestSectionNote =
    input.qaTopFixes?.filter(Boolean).slice(0, 2).join(" | ") ||
    "Use the current QA or prompt-health warning context to identify the weakest section.";

  return [
    "Fix only the weakest section.",
    "Use the current QA and warning context.",
    "Do not rewrite the full package.",
    "Keep the rest unchanged.",
    "Return only the revised weak section.",
    "",
    `Weak section focus: ${compactText(weakestSectionNote, 220)}`,
    "",
    "Strict guardrails:",
    buildGuardrailBlock(),
    "",
    "Current package context:",
    buildContextLines(input),
  ].join("\n");
}

export type { AiHandoffPromptInput };
