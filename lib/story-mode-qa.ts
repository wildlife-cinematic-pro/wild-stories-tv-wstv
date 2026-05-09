import { StoryMode, ViolenceLevel } from "@/types";

import {
  STORY_MODE_PRESET_LABELS,
  formatStoryModePresetLabel,
} from "@/lib/story-mode-presets";

import type { GeneratedPackage } from "@/types";

export type StoryModeQAStatus = "ready" | "needs-review" | "unsafe";

export type StoryModeQAResult = {
  score: number;
  status: StoryModeQAStatus;
  flags: string[];
  passes: string[];
  storyModeLabel: string;
  viralLaneLabel: string;
  violenceLevelLabel: string;
};

const MODE_SIGNAL_PATTERNS: Record<StoryMode, RegExp[]> = {
  [StoryMode.PREDATOR_VS_PREY]: [/predator/i, /prey/i, /survival lane/i],
  [StoryMode.HERD_DEFENSE]: [/herd/i, /defensive|defense|formation/i],
  [StoryMode.MOTHER_BABY]: [/mother/i, /cub|calf|fawn|pup|kit|offspring/i, /protect|shield/i],
  [StoryMode.RIVAL_CLASH]: [/rival|dominance|standoff/i, /rut|antler|horn|body display/i],
  [StoryMode.NEAR_MISS]: [/near[- ]miss|last[- ]second|escape lane/i, /escape|cuts?/i],
  [StoryMode.FISHING_STRIKE]: [/fishing|waterline|river|salmon|trout/i, /swipe|dive|strike/i],
  [StoryMode.WEATHER_SURVIVAL]: [/weather|blizzard|ice|flood|drought|heat/i, /survival|endurance/i],
  [StoryMode.MIGRATION]: [/migration|crossing|route/i, /herd movement|lead animals/i],
  [StoryMode.SCAVENGER_CONFLICT]: [/scavenger|food zone|food claim|ownership/i, /guard|claim line|challenger/i],
};

const UNSAFE_PATTERNS = [
  /\bblood\b/i,
  /\bgore\b/i,
  /\binjury\b/i,
  /\bbloody\b/i,
  /\bblood[-\s]splattered\b/i,
  /\bbloodbath\b/i,
  /\bgory\b/i,
  /\btorn flesh\b/i,
  /\bexposed injury\b/i,
  /\bvisible wound(s)?\b/i,
  /\bbroken bone(s)?\b/i,
  /\bdead animal\b/i,
  /\bgraphic injury\b/i,
];

const DIRECT_CONTACT_PATTERNS = [
  /\bdirect contact\b/i,
  /\bphysical contact\b/i,
  /\bcollision\b/i,
  /\bimpact\b/i,
  /\bstrike impact\b/i,
  /\bbite\b/i,
  /\bbiting\b/i,
  /\bclash(es|ing)?\b/i,
  /\bstruggle\b/i,
];

function collectPackageText(data: GeneratedPackage) {
  const chunks = [
    data.imagePrompt,
    data.gptImage2Prompt,
    data.thumbnailPrompt,
    data.voiceoverLine,
    data.hook,
    data.caption,
    data.caption2026,
    data.runwayBundle,
    data.klingBundle,
    data.routingNote,
    data.referenceWorkflow,
    data.qualitySummary,
    data.structuredPrompts?.imagePrompt?.fullText,
    data.structuredPrompts?.gptImage2Prompt?.fullText,
    ...(data.structuredPrompts?.workflowShots?.map((shot) => shot.fullText) ?? []),
    ...(data.shotImagePlan?.map((shot) => shot.prompt) ?? []),
    ...(data.shotPlan?.map((shot) => shot.prompt) ?? []),
    ...(data.runwayShots ?? []),
    ...(data.klingShots ?? []),
    data.platformPack?.facebook?.hook,
    data.platformPack?.facebook?.caption,
  ];

  return chunks.filter(Boolean).join("\n").toLowerCase();
}

function removeSafetyNegations(text: string) {
  return text
    .replace(/negative prompt:[\s\S]*/gi, "")
    .replace(/\b(no|without|avoid|avoids|forbid|forbids|forbidden)\s+[^.\n]*(gore|blood|visible injur(?:y|ies)|visible wounds?|wounds?|injur(?:y|ies)|graphic injury|torn flesh|exposed injury|broken bones?|contact|clash|bite|strike impact|impact|struggle)[^.\n]*/gi, "")
    .replace(/\bgrounded (paw|hoof|foot)?\s*contact\b/gi, "")
    .replace(/\bnear[- ]contact\b/gi, "")
    .replace(/\bnear[- ]clash\b/gi, "");
}

function includesAllSubjects(text: string, subjects: string[]) {
  return subjects
    .map((subject) => subject.trim().toLowerCase())
    .filter(Boolean)
    .every((subject) => text.includes(subject));
}

function hasAnyPattern(text: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

export function analyzeStoryModePackage(data: GeneratedPackage): StoryModeQAResult {
  const storyMode = data.storyMode ?? StoryMode.PREDATOR_VS_PREY;
  const text = collectPackageText(data);
  const unsafeScanText = removeSafetyNegations(text);
  const flags: string[] = [];
  const passes: string[] = [];
  let score = 100;

  const storyModeLabel =
    STORY_MODE_PRESET_LABELS[storyMode] ?? formatStoryModePresetLabel(storyMode);
  const viralLaneLabel = formatStoryModePresetLabel(data.viralLane ?? "TENSION");
  const violenceLevel = data.violenceLevel ?? ViolenceLevel.DISPLAY_ONLY;
  const violenceLevelLabel = `Level ${Number(violenceLevel)}/3`;

  const modeSignals = MODE_SIGNAL_PATTERNS[storyMode] ?? [];
  if (modeSignals.length === 0 || modeSignals.some((pattern) => pattern.test(text))) {
    passes.push("Story mode language is present in the generated package.");
  } else {
    flags.push(`${storyModeLabel} language is weak or missing.`);
    score -= 14;
  }

  const subjectA = data.subjectA ?? data.predatorName;
  const subjectB = data.subjectB ?? data.preyName;
  if (includesAllSubjects(text, [subjectA ?? "", subjectB ?? ""])) {
    passes.push("Primary and secondary subjects are readable in output text.");
  } else {
    flags.push("Subject A / Subject B are not both clearly represented.");
    score -= 12;
  }

  if (hasAnyPattern(unsafeScanText, UNSAFE_PATTERNS)) {
    flags.push("Unsafe graphic language detected.");
    score -= 45;
  } else {
    passes.push("Non-graphic safety language stays clean.");
  }

  if (
    violenceLevel === ViolenceLevel.DISPLAY_ONLY &&
    hasAnyPattern(unsafeScanText, DIRECT_CONTACT_PATTERNS)
  ) {
    flags.push("Violence Level 1 should avoid direct contact, clash, bite, or impact wording.");
    score -= 22;
  } else {
    passes.push("Violence level wording matches the selected safety setting.");
  }

  if (/facebook|reels|first[- ]frame|hook|replay/.test(text)) {
    passes.push("USA Facebook Reels hook/readability signals are present.");
  } else {
    flags.push("Facebook Reels hook/readability language could be stronger.");
    score -= 8;
  }

  if (/nano banana 2/.test(text) && /gpt image 2/.test(text) && /documentary/.test(text)) {
    passes.push("Image workflow mentions Nano Banana 2, GPT Image 2, and documentary realism.");
  } else {
    flags.push("Image workflow readiness language is incomplete.");
    score -= 10;
  }

  const engineSequence = data.shotPlan?.map((shot) => shot.engine).join("/");
  if (engineSequence === "RUNWAY/KLING/KLING/RUNWAY") {
    passes.push("Hybrid video handoff keeps Runway/Kling/Kling/Runway order.");
  } else {
    flags.push("Hybrid video engine sequence needs review.");
    score -= 10;
  }

  const clampedScore = Math.max(0, Math.min(100, score));
  const status: StoryModeQAStatus = flags.some((flag) =>
    /unsafe graphic/i.test(flag)
  )
    ? "unsafe"
    : clampedScore >= 86 && flags.length === 0
      ? "ready"
      : "needs-review";

  return {
    score: clampedScore,
    status,
    flags,
    passes,
    storyModeLabel,
    viralLaneLabel,
    violenceLevelLabel,
  };
}
