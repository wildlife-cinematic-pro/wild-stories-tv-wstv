type AiHandoffPromptInput = {
  predator: string;
  prey: string;
  storyMode?: string;
  subjectPairLabel?: string;
  habitatRegion?: string;
  season?: string;
  timeOfDay?: string;
  environmentName?: string;
  sceneDescription?: string;
  workflowLabel?: string;
  qaScore?: number;
  qaStatus?: "Ready" | "Needs review" | "Risky";
  qaTopFixes?: string[];
  imagePrompt?: string;
  gptImage2Prompt?: string;
  thumbnailPrompt?: string;
  negativePrompt?: string;
  videoPrompt?: string;
  runwayPrompts?: string[];
  klingPrompts?: string[];
  seedancePrompts?: string[];
  hybridShots?: string[];
  shotLabels?: string[];
  hook?: string;
  hook2026?: string[];
  caption?: string;
  cta?: string;
  hashtags?: string;
};

const STRICT_GUARDRAILS = [
  "Treat the animal pair as the global source of truth.",
  "Do not change animal identities.",
  "Do not introduce random species, substitute animals, or background animal cameos.",
  "Do not change habitat unless explicitly asked.",
  "Do not add or remove shots.",
  "Do not change engine names.",
  "Do not change workflow type, engine routing, model routing, package schema, captions schema, or storyboard logic.",
  "Do not create animal mismatch, habitat drift, shot drift, engine drift, or workflow drift.",
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

function formatCompactList(label: string, values: string[] | undefined, maxItems = 4, maxLength = 420) {
  const items = (values ?? [])
    .map((value) => compactText(value, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);

  if (items.length === 0) {
    return "";
  }

  return `${label}:\n${items.map((item, index) => `${index + 1}. ${item}`).join("\n")}`;
}

function buildContextLines(input: AiHandoffPromptInput) {
  const fixes = (input.qaTopFixes ?? [])
    .map((fix) => compactText(fix, 180))
    .filter(Boolean)
    .slice(0, 3);

  const lines = [
    "App context: WSTV wildlife prompt generator",
    `Global animal source of truth: ${input.predator} vs ${input.prey}`,
    input.subjectPairLabel ? `Subject label: ${input.subjectPairLabel}` : "",
    input.storyMode ? `Story mode: ${input.storyMode}` : "",
    input.workflowLabel ? `Workflow: ${input.workflowLabel}` : "",
    input.habitatRegion ? `Habitat region: ${input.habitatRegion}` : "",
    input.environmentName ? `Environment: ${compactText(input.environmentName, 180)}` : "",
    input.season ? `Season: ${input.season}` : "",
    input.timeOfDay ? `Time of day: ${input.timeOfDay}` : "",
    input.sceneDescription
      ? `Scene description: ${compactText(input.sceneDescription, 260)}`
      : "",
    input.qaStatus ? `Final QA: ${input.qaStatus}${input.qaScore ? ` (${input.qaScore}/100)` : ""}` : "",
    fixes.length > 0 ? `Top QA fixes: ${fixes.join(" | ")}` : "",
    input.imagePrompt ? `Image prompt: ${compactText(input.imagePrompt)}` : "",
    input.gptImage2Prompt ? `GPT Image 2 prompt: ${compactText(input.gptImage2Prompt)}` : "",
    input.thumbnailPrompt ? `Thumbnail prompt: ${compactText(input.thumbnailPrompt, 300)}` : "",
    input.negativePrompt ? `Negative prompt: ${compactText(input.negativePrompt, 260)}` : "",
    input.videoPrompt ? `Video prompt: ${compactText(input.videoPrompt)}` : "",
    formatCompactList("Hybrid 4-shot / shot plan labels", input.shotLabels, 6, 180),
    formatCompactList("Hybrid 4-shot prompts", input.hybridShots, 4, 520),
    formatCompactList("Runway prompts", input.runwayPrompts, 4, 520),
    formatCompactList("Kling prompts", input.klingPrompts, 4, 520),
    formatCompactList("Seedance prompts", input.seedancePrompts, 3, 420),
    input.hook ? `Primary hook: ${compactText(input.hook, 160)}` : "",
    formatCompactList("Hook variants", input.hook2026, 4, 160),
    input.caption ? `Caption: ${compactText(input.caption, 220)}` : "",
    input.cta ? `CTA: ${compactText(input.cta, 160)}` : "",
    input.hashtags ? `Hashtags: ${compactText(input.hashtags, 180)}` : "",
  ];

  return lines.filter(Boolean).join("\n");
}

function buildGuardrailBlock() {
  return STRICT_GUARDRAILS.map((line) => `- ${line}`).join("\n");
}

function buildAnimalLockBlock(input: AiHandoffPromptInput) {
  return [
    `Animal lock: ${input.predator} vs ${input.prey}.`,
    `Allowed animal identities: ${input.predator}; ${input.prey}.`,
    "If any other animal appears as a subject, treat it as drift.",
    "Do not add other species unless the source package explicitly names them as part of the locked pair.",
  ].join("\n");
}

function buildFinalValidationBlock() {
  return [
    "Before returning, run this silent validation pass:",
    "- animal pair consistency",
    "- habitat consistency",
    "- workflow consistency",
    "- engine consistency",
    "- shot count consistency",
    "- no random species injection",
    "- no random environment drift",
    "- no duplicated wording",
    "- no contradictory motion instructions",
    "If a mismatch is found, repair it before output while preserving the requested mode.",
  ].join("\n");
}

function buildModelOptimizationBlock() {
  return [
    "Optimized for Claude Sonnet, ChatGPT GPT-5, and Codex refinement workflows.",
    "Minimize drift, lazy rewrites, species hallucination, prompt shortening, and structure loss.",
    "Maximize continuity preservation, cinematic clarity, documentary realism, and animal identity lock.",
  ].join("\n");
}

export function buildReviewOnlyPrompt(input: AiHandoffPromptInput) {
  return [
    "Review Only mode for WSTV wildlife cinematic QA.",
    "Act as a professional wildlife prompt QA reviewer, not a rewriting assistant.",
    "Do not rewrite the package.",
    "Do not regenerate prompts.",
    "Do not explain the full package.",
    "Return concise findings only.",
    "",
    "Review priorities, in order:",
    "- animal consistency",
    "- habitat consistency",
    "- readability",
    "- first-frame hook clarity",
    "- prompt drift risk",
    "- overlong wording",
    "- weak tension wording",
    "- missing animal names",
    "- unrealistic wildlife behavior",
    "- Facebook replay weakness",
    "- thumbnail weakness",
    "",
    "Required score block:",
    "- Hook clarity: __/100",
    "- Animal consistency: __/100",
    "- Viral readability: __/100",
    "- Motion clarity: __/100",
    "- Facebook replay potential: __/100",
    "",
    "Output format:",
    "- concise bullet findings",
    "- no rewriting",
    "- no explanations",
    "- no package regeneration",
    "",
    "Animal lock:",
    buildAnimalLockBlock(input),
    "",
    buildModelOptimizationBlock(),
    "",
    "Review validation:",
    "Run the same animal, habitat, workflow, engine, and shot-count validation before scoring. In Review Only mode, report mismatches as findings instead of rewriting them.",
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
    "Polish Only mode for WSTV wildlife cinematic workflow refinement.",
    "Polish the actual full package, not just captions.",
    "Preserve structure.",
    "Preserve headings.",
    "Preserve animal identities.",
    "Preserve engine names and sections.",
    "Preserve shot count.",
    "Preserve line breaks as much as possible.",
    "Preserve meaning.",
    "Preserve habitat.",
    "Preserve workflow type.",
    "Preserve formatting.",
    "",
    "Polish these sections when present:",
    "- Hybrid 4-shot prompts",
    "- Runway prompts",
    "- Kling prompts",
    "- image prompts",
    "- scene description",
    "- hooks",
    "- captions",
    "",
    "Improve:",
    "- cinematic readability",
    "- tension flow",
    "- documentary realism",
    "- first-frame hook clarity",
    "- Facebook replay value",
    "- cleaner motion wording",
    "- clearer animal visibility",
    "- stronger environmental grounding",
    "- less repetition",
    "- more professional National Geographic / BBC Earth wildlife language",
    "",
    "Hybrid 4-shot priority:",
    "- continuity image wording",
    "- Runway motion wording",
    "- Kling cinematic movement wording",
    "- environmental continuity",
    "- first-frame readability",
    "- grounded motion",
    "- realistic spacing",
    "",
    "Strictly avoid:",
    "- adding extra shots",
    "- adding timestamps if absent",
    "- adding gore, blood, or visible injury",
    "- changing habitat",
    "- changing animal pair",
    "- changing workflow type",
    "- changing engine names",
    "- bloating prompts",
    "Return polished text only.",
    "No explanation.",
    "",
    "Animal lock:",
    buildAnimalLockBlock(input),
    "",
    buildModelOptimizationBlock(),
    "",
    buildFinalValidationBlock(),
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
    "Fix Weak Section mode for WSTV wildlife cinematic QA.",
    "Repair only the weakest inconsistent section without rewriting the package.",
    "Use the current QA, warnings, and package context to detect the weakest section.",
    "Do not rewrite the full package.",
    "Keep the rest unchanged.",
    "Return only the revised weak section.",
    "",
    `Weak section focus: ${compactText(weakestSectionNote, 220)}`,
    "",
    "Validation scope:",
    "- scene description",
    "- image prompt",
    "- Runway prompts",
    "- Kling prompts",
    "- captions",
    "- hooks",
    "- shot labels",
    "",
    "Strictly prevent:",
    "- animal mismatch",
    "- habitat drift",
    "- shot drift",
    "- engine drift",
    "- workflow drift",
    "",
    "If mismatch exists:",
    "- return only the corrected weak section",
    "- replace drifted animal names with the locked animal pair where the section requires subjects",
    "- do not rewrite unrelated sections",
    "",
    "Animal lock:",
    buildAnimalLockBlock(input),
    "",
    buildModelOptimizationBlock(),
    "",
    buildFinalValidationBlock(),
    "",
    "Strict guardrails:",
    buildGuardrailBlock(),
    "",
    "Current package context:",
    buildContextLines(input),
  ].join("\n");
}

export type { AiHandoffPromptInput };
