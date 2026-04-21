// ─────────────────────────────────────────────────────────────
// lib/platform-packs.ts
// WSTV — Platform Packs, Hooks, Captions, CTAs, Hashtags
//
// RULES:
//   • Pure functions only — no React, no useState, no UI
//   • All data and functions exported for use in buildPackage()
//
// PACKAGING GOAL:
//   • Clean, original, U.S.-readable social packaging
//   • Strong first-line hooks and short publish-safe captions
//   • Exactly 5 hashtags and a separate tags field
// ─────────────────────────────────────────────────────────────

import type {
  Arc,
  ContentLane,
  FacebookCoverFramePreset,
  FacebookCoverFramePresetScore,
  FacebookCoverFrameRanking,
  FacebookCoverFrameTextPreset,
  FacebookFirstFrameOverlayPreset,
  FacebookFrameChoice,
  FacebookFrameHeuristics,
  FacebookFrameHeuristicLevel,
  FacebookFrameSubjectFit,
  FacebookOverlayPreset,
  FacebookOverlayPresetScore,
  FacebookOverlayRecommendation,
  FacebookPack,
  FirstFrameOverlayGuidance,
  HookFormattingPreset,
  HookOverlayVariant,
  InstagramPack,
  PlatformPack,
  TikTokPack,
  YouTubeShortsPack,
} from "@/types";
import {
  buildContentLaneHooks,
  buildContentLaneLongCaptionLead,
  buildContentLaneShortCaptionLead,
  getContentLaneHashtag,
} from "@/lib/content-lanes";

const HOOK_FAMILY_ORDER = ["danger", "curiosity", "reversal"] as const;

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

export const HOOK_OVERLAY_MAX_LINE_LENGTH = 28;
export const HOOK_OVERLAY_MAX_LINES = 2;
export const FACEBOOK_COVER_FRAME_MAX_LINE_LENGTH = 26;
export const FACEBOOK_COVER_FRAME_MAX_LINES = 2;

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

const OBSERVATIONAL_SIGNAL_PATTERN =
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

// ─────────────────────────────────────────────────────────────
// 1. VIRAL HOOKS  (legacy — one hook per arc)
// ─────────────────────────────────────────────────────────────
const VIRAL_HOOKS: Partial<Record<Arc, (predator: string, prey: string) => string>> = {
  "Ambush attack": (predator, prey) =>
    `The ${prey.toLowerCase()} looked up too late. The ${predator.toLowerCase()} was already there.`,

  "Chase and takedown": (predator, prey) =>
    `Once the ${predator.toLowerCase()} committed, the ${prey.toLowerCase()} lost space fast.`,

  "Defender stands ground": (predator) =>
    `This ${predator.toLowerCase()} refused to yield once the push arrived.`,

  "Giant vs giant clash": (predator, prey) =>
    `${predator} and ${prey} got too close. One heavy step broke the standoff.`,

  "Territory dominance battle": (_predator, prey) =>
    `The ${prey.toLowerCase()} stepped into claimed ground.`,

  "Pack hunting strategy": (_predator, prey) =>
    `The ${prey.toLowerCase()} was already losing the open break before it reacted.`,

  "Predator vs predator fight": () =>
    `Two apex predators met too close. There was no safe outcome.`,

  "Escape from danger": (_predator, prey) =>
    `This ${prey.toLowerCase()} had almost no time to find the exit.`,
};

// ─────────────────────────────────────────────────────────────
// 2. 2026 HOOKS  (3 variants per arc — danger / curiosity / reversal)
// ─────────────────────────────────────────────────────────────
const HOOKS_2026: Partial<Record<Arc, (predator: string, prey: string) => string[]>> = {
  "Ambush attack": (predator, prey) => [
    `The ${prey.toLowerCase()} looked up after the ${predator.toLowerCase()} had already closed the space.`,
    `The ${predator.toLowerCase()} had already eaten the distance before the ${prey.toLowerCase()} turned.`,
    `The first quiet second ended with the danger already moving.`,
  ],
  "Chase and takedown": (predator, prey) => [
    `The ${predator.toLowerCase()} committed and the ${prey.toLowerCase()} lost clean running room.`,
    `The ${prey.toLowerCase()} reacted fast, but the closing angle was already there.`,
    `The opening looked wide until the pursuit folded inward.`,
  ],
  "Defender stands ground": (predator, prey) => [
    `The ${predator.toLowerCase()} held position and reset the whole encounter.`,
    `The ${prey.toLowerCase()} kept pressing, but the stance never opened.`,
    `An easy push met a braced stand instead.`,
  ],
  "Giant vs giant clash": (predator, prey) => [
    `${predator} and ${prey} were already too tight for a clean reset.`,
    `The shoulder line was set before either animal committed.`,
    `A slow standoff turned heavy once the footing gave way.`,
  ],
  "Territory dominance battle": (predator, prey) => [
    `The ${prey.toLowerCase()} stepped onto ground the ${predator.toLowerCase()} was already claiming.`,
    `The warning showed before the full response landed.`,
    `One step changed the encounter from posture to enforcement.`,
  ],
  "Pack hunting strategy": (predator, prey) => [
    `The ${prey.toLowerCase()} was losing the open break before full flight.`,
    `The ${predator.toLowerCase()} pursuit was organized before full contact.`,
    `The field looked open until the angles folded inward.`,
  ],
  "Predator vs predator fight": (predator, prey) => [
    `Two apex predators met at a distance with no easy reset.`,
    `${predator} and ${prey} measured each other before either gave ground.`,
    `Control shifted as soon as one animal gave up clean position.`,
  ],
  "Escape from danger": (predator, prey) => [
    `The ${prey.toLowerCase()} had one clear chance to find daylight.`,
    `The ${predator.toLowerCase()} moved before the ${prey.toLowerCase()} found a clean turn.`,
    `It looked over until one survival move opened a gap.`,
  ],
};

// ─────────────────────────────────────────────────────────────
// 3. VIRAL CAPTIONS  (legacy — one caption per arc)
// ─────────────────────────────────────────────────────────────
const VIRAL_CAPTIONS: Partial<Record<Arc, (predator: string, prey: string, env: string) => string>> = {
  "Ambush attack": (predator, prey, env) =>
    `In the ${env}, the ${prey.toLowerCase()} lost one second and the ${predator.toLowerCase()} used it. The danger becomes clear before the full move lands.`,
  "Chase and takedown": (predator, prey, env) =>
    `Across the ${env}, the ${predator.toLowerCase()} committed early and the ${prey.toLowerCase()} had almost no time to recover. The closing angle is the real story beat.`,
  "Defender stands ground": (predator, prey, env) =>
    `In the ${env}, every instinct said move. This ${predator.toLowerCase()} stayed put, and that choice shifted the encounter once the ${prey.toLowerCase()} kept pressing.`,
  "Giant vs giant clash": (predator, prey, env) =>
    `Two heavy animals met in the ${env}, and neither wanted to give space. The shoulder weight and footing show the impact before it arrives.`,
  "Territory dominance battle": (predator, prey, env) =>
    `In the ${env}, the claim was already clear before the response landed. The ${prey.toLowerCase()} stepped into it, and the ${predator.toLowerCase()} answered right away.`,
  "Pack hunting strategy": (predator, prey, env) =>
    `At first, the ${prey.toLowerCase()} looked free. Then the trap shape appeared. In the ${env}, the ${predator.toLowerCase()} wins position before full contact.`,
  "Predator vs predator fight": (predator, prey, env) =>
    `A ${predator.toLowerCase()} and a ${prey.toLowerCase()} in the ${env} create a slower kind of tension. Both animals understand the cost of a bad step, so every movement matters more.`,
  "Escape from danger": (predator, prey, env) =>
    `Everything in the ${env} changed in a second. The ${prey.toLowerCase()} had almost no time to process the danger before the ${predator.toLowerCase()} was already moving.`,
};

// ─────────────────────────────────────────────────────────────
// 4. 2026 CAPTIONS
// ─────────────────────────────────────────────────────────────
const SHORT_CAPTIONS_2026: Partial<Record<Arc, (predator: string, prey: string, env: string) => string>> = {
  "Ambush attack": (predator, prey) =>
    `The ${prey.toLowerCase()} looked up too late. The ${predator.toLowerCase()} was already inside the danger zone.`,
  "Chase and takedown": (predator, prey) =>
    `The ${predator.toLowerCase()} committed first. The ${prey.toLowerCase()} had no time to reset.`,
  "Defender stands ground": (predator, prey) =>
    `The ${prey.toLowerCase()} kept pressing. This ${predator.toLowerCase()} never gave ground.`,
  "Giant vs giant clash": (predator, prey) =>
    `${predator} and ${prey} got too close. One heavy step broke the standoff.`,
  "Territory dominance battle": (predator, prey) =>
    `The ${prey.toLowerCase()} crossed the wrong line. The ${predator.toLowerCase()} answered immediately.`,
  "Pack hunting strategy": (predator, prey) =>
    `The ${prey.toLowerCase()} looked free for a second. Then the ${predator.toLowerCase()} folded the angles inward.`,
  "Predator vs predator fight": (predator, prey) =>
    `${predator} and ${prey} met too close. One bad step shifted control fast.`,
  "Escape from danger": (predator, prey) =>
    `The ${predator.toLowerCase()} moved first. The ${prey.toLowerCase()} had almost no time to turn.`,
};

const CAPTIONS_2026: Partial<Record<Arc, (predator: string, prey: string, env: string) => string>> = {
  "Ambush attack": (predator, prey, env) =>
    `In the ${env}, the danger was visible before the full move.

The ${prey.toLowerCase()} looked up too late and the ${predator.toLowerCase()} was already inside striking distance. That is what makes a real ambush land on screen: no long setup, just one bad second and immediate danger.

Which second gave the ambush away?`,
  "Chase and takedown": (predator, prey, env) =>
    `Across the ${env}, the escape window disappeared fast.

The ${predator.toLowerCase()} committed cleanly and the ${prey.toLowerCase()} had almost no time to reset. What makes this kind of chase work on short-form is how clearly the closing angle shows from the first stride.

Which turn mattered most?`,
  "Defender stands ground": (predator, prey, env) =>
    `In the ${env}, every instinct said move. This ${predator.toLowerCase()} did the opposite.

When the ${prey.toLowerCase()} kept moving forward, the encounter stopped feeling like a bluff and started feeling like a real stand. The hold is what makes the moment memorable.

What told you the stand would hold?`,
  "Giant vs giant clash": (predator, prey, env) =>
    `Two huge animals met in the ${env}, and neither wanted to give space.

A ${predator.toLowerCase()} and a ${prey.toLowerCase()} create a slower kind of tension: heavy shoulders, set footing, and posture before the full contact lands.

Which body shift made contact feel inevitable?`,
  "Territory dominance battle": (predator, prey, env) =>
    `In the ${env}, territory is never symbolic.

The ${prey.toLowerCase()} stepped into the wrong space and the ${predator.toLowerCase()} answered immediately. The whole encounter works because the claim is visible before the full reaction lands.

Would you have noticed the claim earlier?`,
  "Pack hunting strategy": (predator, prey, env) =>
    `At first, the ${prey.toLowerCase()} looked mobile. Then the space started disappearing.

In the ${env}, the ${predator.toLowerCase()} becomes dangerous before full contact because the pursuit is already organized. It is timing, spacing, angle control, and a closing path.

Which angle closed the escape first?`,
  "Predator vs predator fight": (predator, prey, env) =>
    `Two apex predators. No easy reset.

A ${predator.toLowerCase()} facing a ${prey.toLowerCase()} in the ${env} feels intense because both animals understand the cost of a bad decision. These encounters escalate fast once control starts to shift.

Which animal gave up position first?`,
  "Escape from danger": (predator, prey, env) =>
    `Everything changed in under a second in the ${env}.

The ${prey.toLowerCase()} had almost no time to react before the ${predator.toLowerCase()} moved. In moments like this, survival comes down to one decision made fast enough.

Would you have spotted the danger in time?`,
};

const CAPTIONS_2026_US_ONLY: Partial<Record<Arc, (predator: string, prey: string, env: string) => string>> = {
  "Ambush attack": (predator, prey, env) =>
    `In the ${env}, the ambush gives itself away early.

The ${prey.toLowerCase()} looked up too late and the ${predator.toLowerCase()} was already inside striking distance. The moment lands because the setup stays clear and the danger arrives without a long windup.

Which second gave the ambush away?`,
  "Chase and takedown": (predator, prey, env) =>
    `Across the ${env}, the running room disappeared fast.

The ${predator.toLowerCase()} committed early and the ${prey.toLowerCase()} never looked fully reset. The sequence works because the closing angle is obvious right away.

Which turn mattered most?`,
  "Defender stands ground": (predator, prey, env) =>
    `In the ${env}, every instinct said move. This ${predator.toLowerCase()} stayed planted.

Once the ${prey.toLowerCase()} kept pressing forward, the encounter shifted from a push to a stand. The refusal to give ground is the whole story beat.

What told you the stand would hold?`,
  "Giant vs giant clash": (predator, prey, env) =>
    `Two huge animals met in the ${env}, and neither gave ground.

A ${predator.toLowerCase()} and a ${prey.toLowerCase()} create a slower kind of tension because shoulder weight and footing show the hit before it arrives.

Which body shift made contact feel inevitable?`,
  "Territory dominance battle": (predator, prey, env) =>
    `In the ${env}, the claim was visible before the answer came.

The ${prey.toLowerCase()} stepped onto held ground and the ${predator.toLowerCase()} answered right away. The moment works because the warning is visible before the reaction peaks.

Would you have noticed the claim earlier?`,
  "Pack hunting strategy": (predator, prey, env) =>
    `At first, the ${prey.toLowerCase()} looked free. Then the opening started shrinking.

In the ${env}, the ${predator.toLowerCase()} feels dangerous because the angles organize before contact. The chase shape does most of the work.

Which angle closed the escape first?`,
  "Predator vs predator fight": (predator, prey, env) =>
    `Two apex predators met in the ${env}, and neither had room for a harmless mistake.

The tension works because both animals understand the cost of giving up position. Once control shifts, the whole clip changes.

Which animal gave up position first?`,
  "Escape from danger": (predator, prey, env) =>
    `Everything changed fast in the ${env}.

The ${prey.toLowerCase()} had almost no time to react before the ${predator.toLowerCase()} moved. The whole beat depends on one breakaway decision made fast enough.

Would you have spotted the danger in time?`,
};

// ─────────────────────────────────────────────────────────────
// 5. CTAs
// ─────────────────────────────────────────────────────────────
const VIRAL_CTAS: Partial<Record<Arc, string>> = {
  "Ambush attack":
    "Which second gave the ambush away?",
  "Chase and takedown":
    "Which turn mattered most?",
  "Defender stands ground":
    "What told you the stand would hold?",
  "Giant vs giant clash":
    "Which body shift made contact feel inevitable?",
  "Territory dominance battle":
    "Would you have noticed the claim earlier?",
  "Pack hunting strategy":
    "Which angle closed the escape first?",
  "Predator vs predator fight":
    "Which animal gave up position first?",
  "Escape from danger":
    "Would you have spotted the danger in time?",
};

// ─────────────────────────────────────────────────────────────
// 6. HASHTAGS
// ─────────────────────────────────────────────────────────────
const BASE_HASHTAGS: Partial<Record<Arc, string[]>> = {
  "Ambush attack": ["#wildlife", "#ambush", "#usa"],
  "Chase and takedown": ["#wildlife", "#wildlifechase", "#usa"],
  "Defender stands ground": ["#wildlife", "#animalbehavior", "#usa"],
  "Giant vs giant clash": ["#wildlife", "#animalclash", "#usa"],
  "Territory dominance battle": ["#wildlife", "#territory", "#usa"],
  "Pack hunting strategy": ["#wildlife", "#packhunting", "#usa"],
  "Predator vs predator fight": ["#wildlife", "#predatorclash", "#usa"],
  "Escape from danger": ["#wildlife", "#survival", "#usa"],
};

const ARC_TAG_LABEL: Record<Arc, string> = {
  "Ambush attack": "ambush predator",
  "Chase and takedown": "wildlife chase",
  "Defender stands ground": "defensive stand",
  "Giant vs giant clash": "giant animal clash",
  "Territory dominance battle": "territory clash",
  "Pack hunting strategy": "pack hunting",
  "Predator vs predator fight": "predator clash",
  "Escape from danger": "escape moment",
};

// ─────────────────────────────────────────────────────────────
// 7. RECOMMENDED HOOK INDEX
// ─────────────────────────────────────────────────────────────
export function getRecommendedHookIndex(arc: Arc): number {
  switch (arc) {
    case "Ambush attack":
    case "Chase and takedown":
    case "Escape from danger":
      return 0;
    case "Defender stands ground":
    case "Territory dominance battle":
    case "Predator vs predator fight":
      return 1;
    case "Giant vs giant clash":
    case "Pack hunting strategy":
      return 2;
    default:
      return 0;
  }
}

// ─────────────────────────────────────────────────────────────
// SOCIAL ENV SANITIZER
// ─────────────────────────────────────────────────────────────
function sanitizeSocialEnv(env: string): string {
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

function normalizeCopy(text: string): string {
  return String(text ?? "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;!?])/g, "$1")
    .trim();
}

function splitSentences(text: string): string[] {
  return (
    normalizeCopy(text)
      .match(/[^.!?]+[.!?]?/g)
      ?.map((sentence) => normalizeCopy(sentence))
      .filter(Boolean) ?? []
  );
}

function trimAtWordBoundary(text: string, maxChars: number): string {
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

function finalizeHookCopy(raw: string): string {
  const compact = normalizeCopy(raw);
  const limitedSentences = (splitSentences(compact).slice(0, 2).join(" ") || compact).trim();
  return trimAtWordBoundary(limitedSentences, 96);
}

function toHashtag(value: string): string {
  const compact = String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "")
    .trim();
  return compact ? `#${compact}` : "";
}

function toTag(value: string): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ─────────────────────────────────────────────────────────────
// PUBLIC BUILDER FUNCTIONS
// ─────────────────────────────────────────────────────────────

/** Legacy single hook — used in buildPackage routingNote and clip chaining */
export function buildHook(predator: string, prey: string, arc: Arc): string {
  const raw =
    VIRAL_HOOKS[arc]?.(predator, prey) ??
    `${predator} vs ${prey} — one wrong move changes everything.`;

  return finalizeHookCopy(raw);
}

/** 3-variant 2026 hooks for A/B testing. Order: danger, curiosity, reversal. */
export function build2026Hook(
  predator: string,
  prey: string,
  arc: Arc,
  options: HookBuildOptions = {}
): string[] {
  const hooks =
    buildContentLaneHooks(options.contentLane ?? "Auto", predator, prey, arc) ??
    HOOKS_2026[arc]?.(predator, prey) ?? [
      `${predator} and ${prey} met too close. One move changed the whole read.`,
      `The space looked open until it closed all at once.`,
      `It looked settled for a second. Then control slipped away.`,
    ];

  return hooks.map((hook) => finalizeHookCopy(hook));
}

/** Named 2026 hook family selector for danger / curiosity / reversal. */
export function build2026HookByFamily(
  predator: string,
  prey: string,
  arc: Arc,
  family: HookFamilySupport,
  options: HookBuildOptions = {}
): string {
  const hooks = build2026Hook(predator, prey, arc, options);
  const index = HOOK_FAMILY_ORDER.indexOf(family);
  return hooks[index] ?? hooks[0] ?? buildHook(predator, prey, arc);
}

/** CTA line — arc-specific or generic fallback */
export function buildCTA(arc: Arc): string {
  return (
    VIRAL_CTAS[arc] ??
    "What moment changed the outcome for you?"
  );
}

function cleanOverlayLine(line: string): string {
  return normalizeCopy(line).replace(/\s*[:;-]\s*$/g, "").trim();
}

function buildOverlayLines(
  text: string,
  maxLineLength = HOOK_OVERLAY_MAX_LINE_LENGTH,
  maxLines = HOOK_OVERLAY_MAX_LINES
): string[] {
  const compact = normalizeCopy(text).replace(/\n+/g, " ").trim();
  if (!compact) return [];

  const words = compact.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let index = 0;

  while (index < words.length && lines.length < maxLines) {
    let line = "";

    while (index < words.length) {
      const candidate = line ? `${line} ${words[index]}` : words[index];
      if (candidate.length > maxLineLength && line) break;
      line = candidate;
      index += 1;
      if (candidate.length > maxLineLength) break;
    }

    if (lines.length === maxLines - 1 && index < words.length) {
      const remainder = [line, ...words.slice(index)].filter(Boolean).join(" ");
      line = trimAtWordBoundary(remainder, maxLineLength).replace(/[.]+$/g, "").trim();
      index = words.length;
    }

    const cleaned = cleanOverlayLine(line);
    if (cleaned) lines.push(cleaned);
  }

  return lines.filter(Boolean).slice(0, maxLines);
}

function findPrimarySpeciesFromHook(
  hook: string,
  predator: string,
  prey: string
): string {
  const compactHook = normalizeCopy(hook).toLowerCase();
  const species = [normalizeCopy(predator), normalizeCopy(prey)].filter(Boolean);
  const ranked = species
    .map((name) => ({ name, index: compactHook.indexOf(name.toLowerCase()) }))
    .filter((entry) => entry.index >= 0)
    .sort((a, b) => a.index - b.index);

  return ranked[0]?.name ?? species[0] ?? "Wildlife";
}

function buildHookPressureCue(hook: string): string {
  const lower = normalizeCopy(hook).toLowerCase();

  if (/(waterline|strike|surface break|shallows?)/.test(lower)) {
    return "Waterline strike";
  }

  if (/(yield|ground|boundary|warning-step|stance)/.test(lower)) {
    return "Hold-ground stand";
  }

  if (/(dominance|territory|clash|footing|antler|shoulder|standoff)/.test(lower)) {
    return "Dominance posture";
  }

  if (/(breakaway|survival)/.test(lower)) {
    return "Breakaway gap";
  }

  if (/(escape lane|pursuit|angles|closing angle|lane|running room)/.test(lower)) {
    return "Closing angle";
  }

  if (/(ambush|danger|too late|closed the space|distance|already moving)/.test(lower)) {
    return "Closing danger";
  }

  if (/(position|measured each other|too close|control shifted|bad step)/.test(lower)) {
    return "Position breaking";
  }

  if (/(pressure|space|read)/.test(lower)) {
    return "Wildlife tension";
  }

  return "Wildlife tension";
}

function buildObservationalHookQuestion(
  hook: string,
  predator: string,
  prey: string
): string {
  const lower = normalizeCopy(hook).toLowerCase();
  const preyName = normalizeCopy(prey) || normalizeCopy(predator);

  if (/(waterline|strike|surface break|shallows?)/.test(lower)) {
    return "When did the strike window close?";
  }

  if (/(yield|ground|boundary|warning-step|stance)/.test(lower)) {
    return "When did the stand become clear?";
  }

  if (/(dominance|territory|clash|footing)/.test(lower)) {
    return "When did the clash become unavoidable?";
  }

  if (/(breakaway|survival)/.test(lower)) {
    return "When did the survival move appear?";
  }

  if (/(escape lane|pursuit|angles|closing angle|lane)/.test(lower)) {
    return "When did the breakaway gap vanish?";
  }

  if (preyName) {
    return `When did the ${preyName} run out of room?`;
  }

  return "Which shift changed the moment?";
}

function createOverlayVariant(
  preset: HookFormattingPreset,
  label: string,
  note: string,
  text: string
): HookOverlayVariant {
  const lines = buildOverlayLines(text);

  return {
    preset,
    label,
    note,
    lines,
    text: lines.join("\n"),
  };
}

function createOverlayVariantFromLines(
  preset: HookFormattingPreset,
  label: string,
  note: string,
  inputLines: string[]
): HookOverlayVariant {
  const lines = inputLines
    .map((line) => cleanOverlayLine(trimAtWordBoundary(line, HOOK_OVERLAY_MAX_LINE_LENGTH)))
    .filter(Boolean)
    .slice(0, HOOK_OVERLAY_MAX_LINES);

  return {
    preset,
    label,
    note,
    lines,
    text: lines.join("\n"),
  };
}

export function buildHookFormattingPresets(
  hook: string,
  predator: string,
  prey: string
): HookOverlayVariant[] {
  const primarySpecies = findPrimarySpeciesFromHook(hook, predator, prey);
  const pressureCue = buildHookPressureCue(hook);
  const documentaryLine = trimAtWordBoundary(
    normalizeCopy(hook),
    HOOK_OVERLAY_MAX_LINE_LENGTH * HOOK_OVERLAY_MAX_LINES
  ).replace(/[.]+$/g, "");

  return [
    createOverlayVariant(
      "species_first",
      "Species-first statement",
      "Lead with the clearest species so the first frame lands immediately.",
      `${primarySpecies}: ${pressureCue.toLowerCase()}.`
    ),
    createOverlayVariant(
      "documentary_tension",
      "Documentary tension line",
      "Keep the observation intact, trimmed for a clean documentary opener.",
      documentaryLine
    ),
    createOverlayVariant(
      "observational_question",
      "Observational question",
      "Use a discussion-safe question that stays observational instead of bait-driven.",
      buildObservationalHookQuestion(hook, predator, prey)
    ),
    createOverlayVariant(
      "short_pressure",
      "Short tension line",
      "Compress the hook into a fast, clean tension cue.",
      pressureCue
    ),
    createOverlayVariantFromLines(
      "two_line_opener",
      "Two-line clean opener",
      "Split species identification and the tension cue into two quick overlay lines.",
      [primarySpecies, pressureCue]
    ),
  ];
}

export function buildFirstFrameOverlayGuidance(): FirstFrameOverlayGuidance {
  return {
    placement:
      "Keep the overlay in the upper safe zone and off the heavier silhouette when the frame already feels crowded.",
    textLength:
      "Use 1 to 2 short lines and keep each line around 28 characters or less for an easy first read. If both animals already fill the frame, prefer one species line plus one cue line.",
    opener:
      "Open on clear motion or visible tension. Avoid a dead-static first beat before the behavior cue is clear.",
    audio:
      "Make the overlay understandable with sound off, while still feeling natural if viewers hear the reel.",
    tone:
      "Keep the wording observational, documentary, and original. Avoid bait phrasing, hype filler, and forced-engagement language.",
  };
}

function createFacebookOverlayPreset(
  preset: FacebookFirstFrameOverlayPreset,
  label: string,
  note: string,
  text: string
): FacebookOverlayPreset {
  const lines = buildOverlayLines(
    text,
    HOOK_OVERLAY_MAX_LINE_LENGTH,
    HOOK_OVERLAY_MAX_LINES
  );

  return {
    preset,
    label,
    note,
    lines,
    text: lines.join("\n"),
  };
}

function createFacebookOverlayPresetFromLines(
  preset: FacebookFirstFrameOverlayPreset,
  label: string,
  note: string,
  inputLines: string[]
): FacebookOverlayPreset {
  const lines = inputLines
    .map((line) =>
      cleanOverlayLine(trimAtWordBoundary(line, HOOK_OVERLAY_MAX_LINE_LENGTH))
    )
    .filter(Boolean)
    .slice(0, HOOK_OVERLAY_MAX_LINES);

  return {
    preset,
    label,
    note,
    lines,
    text: lines.join("\n"),
  };
}

function createFacebookCoverFramePreset(
  preset: FacebookCoverFramePreset,
  label: string,
  note: string,
  text: string
): FacebookCoverFrameTextPreset {
  const lines = buildOverlayLines(
    text,
    FACEBOOK_COVER_FRAME_MAX_LINE_LENGTH,
    FACEBOOK_COVER_FRAME_MAX_LINES
  );

  return {
    preset,
    label,
    note,
    lines,
    text: lines.join("\n"),
  };
}

function createFacebookCoverFramePresetFromLines(
  preset: FacebookCoverFramePreset,
  label: string,
  note: string,
  inputLines: string[]
): FacebookCoverFrameTextPreset {
  const lines = inputLines
    .map((line) =>
      cleanOverlayLine(
        trimAtWordBoundary(line, FACEBOOK_COVER_FRAME_MAX_LINE_LENGTH)
      )
    )
    .filter(Boolean)
    .slice(0, FACEBOOK_COVER_FRAME_MAX_LINES);

  return {
    preset,
    label,
    note,
    lines,
    text: lines.join("\n"),
  };
}

export function buildFacebookFirstFrameOverlayPresets(
  hook: string,
  predator: string,
  prey: string
): FacebookOverlayPreset[] {
  const primarySpecies = findPrimarySpeciesFromHook(hook, predator, prey);
  const pressureCue = buildHookPressureCue(hook);
  const documentaryLine = trimAtWordBoundary(
    normalizeCopy(hook),
    HOOK_OVERLAY_MAX_LINE_LENGTH * HOOK_OVERLAY_MAX_LINES
  ).replace(/[.]+$/g, "");

  return [
    createFacebookOverlayPreset(
      "facebook_species_first",
      "Facebook species-first opener",
      "Best first test for Facebook Reels when species clarity matters most.",
      `${primarySpecies}: ${pressureCue.toLowerCase()}.`
    ),
    createFacebookOverlayPreset(
      "facebook_documentary_tension",
      "Facebook documentary tension opener",
      "Keeps the hook observational while trimming it for first-frame readability.",
      documentaryLine
    ),
    createFacebookOverlayPreset(
      "facebook_short_pressure",
      "Facebook short tension opener",
      "Compact tension language for fast Facebook feed scanning.",
      pressureCue
    ),
    createFacebookOverlayPreset(
      "facebook_observational_question",
      "Facebook observational question opener",
      "Discussion-safe question wording without vote bait or forced engagement.",
      buildObservationalHookQuestion(hook, predator, prey)
    ),
    createFacebookOverlayPresetFromLines(
      "facebook_two_line_readable",
      "Facebook two-line clean opener",
      "Splits species and the tension cue into two clean upper-safe-zone lines.",
      [primarySpecies, pressureCue]
    ),
  ];
}

function buildFacebookCoverFrameQuestion(hook: string): string {
  const lower = normalizeCopy(hook).toLowerCase();

  if (/(waterline|strike|surface break|shallows?)/.test(lower)) {
    return "When did the strike turn?";
  }

  if (/(yield|ground|boundary|warning-step|stance)/.test(lower)) {
    return "When did the line hold?";
  }

  if (/(dominance|territory|clash|footing)/.test(lower)) {
    return "When did the clash turn?";
  }

  if (/(breakaway|survival)/.test(lower)) {
    return "When did escape open?";
  }

  if (/(escape lane|pursuit|angles|closing angle|lane)/.test(lower)) {
    return "When did the opening vanish?";
  }

  return "Which move changed the moment?";
}

export function buildFacebookCoverFramePresets(
  hook: string,
  predator: string,
  prey: string,
  arc: Arc
): FacebookCoverFrameTextPreset[] {
  const primarySpecies = findPrimarySpeciesFromHook(hook, predator, prey);
  const pressureCue = buildHookPressureCue(hook);
  const safeQuestion = buildFacebookCoverFrameQuestion(hook);
  const conflictLine = `${normalizeCopy(predator)} vs ${normalizeCopy(prey)}`;
  const documentaryLine = trimAtWordBoundary(
    normalizeCopy(hook),
    FACEBOOK_COVER_FRAME_MAX_LINE_LENGTH * FACEBOOK_COVER_FRAME_MAX_LINES
  ).replace(/[.]+$/g, "");

  return [
    createFacebookCoverFramePreset(
      "species_pressure",
      "Species + tension",
      "Facebook grid text with species first and a clear tension cue.",
      `${primarySpecies}: ${pressureCue.toLowerCase()}.`
    ),
    createFacebookCoverFramePresetFromLines(
      "species_question",
      "Species + question",
      "Question-style cover copy that asks about the behavior, not engagement.",
      [primarySpecies, safeQuestion]
    ),
    createFacebookCoverFramePreset(
      "conflict_statement",
      "Conflict statement",
      "Simple species-vs-species cover copy for shares and grid previews.",
      conflictLine
    ),
    createFacebookCoverFramePreset(
      "short_documentary",
      "Short documentary line",
      "A concise documentary-style cover line for the selected arc.",
      documentaryLine || `${primarySpecies}: ${arc.toLowerCase()}.`
    ),
    createFacebookCoverFramePresetFromLines(
      "two_line_cover",
      "Two-line cover preset",
      "Two-line cover text for Facebook grid readability and clean share previews.",
      [primarySpecies, pressureCue]
    ),
  ];
}

function clampFacebookScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function facebookSpeciesTerms(predator: string, prey: string): string[] {
  return [normalizeCopy(predator), normalizeCopy(prey)]
    .filter(Boolean)
    .flatMap((name) => {
      const parts = name.split(/\s+/).filter((part) => part.length >= 4);
      return [name, ...parts];
    })
    .map((term) => term.toLowerCase());
}

function hasFacebookSpeciesClarity(
  text: string,
  predator: string,
  prey: string
): boolean {
  const lower = normalizeCopy(text).toLowerCase();
  return facebookSpeciesTerms(predator, prey).some((term) =>
    lower.includes(term)
  );
}

function startsWithFacebookSpecies(
  text: string,
  predator: string,
  prey: string
): boolean {
  const lower = normalizeCopy(text).toLowerCase();
  return [normalizeCopy(predator), normalizeCopy(prey)]
    .filter(Boolean)
    .some((name) => lower.startsWith(name.toLowerCase()));
}

function hasFacebookPressureClarity(text: string): boolean {
  const lower = normalizeCopy(text).toLowerCase();
  return (
    OBSERVATIONAL_SIGNAL_PATTERN.test(lower) ||
    /\b(vs|pressure|strike|clash|boundary|escape|breakaway|dominance|waterline|lane|line|space|read|tension|pursuit|window|ground)\b/i.test(
      lower
    )
  );
}

function hasReadableFacebookLines(lines: string[], maxLineLength: number): boolean {
  return (
    lines.length > 0 &&
    lines.length <= 2 &&
    lines.every((line) => line.length <= maxLineLength)
  );
}

function facebookReason(signals: string[], fallback: string): string {
  const usable = signals.slice(0, 3);
  return usable.length ? usable.join("; ") : fallback;
}

function buildFrame1CallSignal(frame1Choice: FacebookFrameChoice): string {
  return frame1Choice === "species-first"
    ? "supports a species-first frame 1"
    : "supports a tension-first frame 1";
}

function buildFacebookLaneSignal(contentLane: ContentLane): string | null {
  switch (contentLane) {
    case "Pack Hunt":
      return "it matches a closing-angle chase read";
    case "Defender":
      return "it supports a clean hold-ground read";
    case "Fishing Strike":
      return "it matches a fast strike-window read";
    case "Rut Battle":
      return "it keeps rut posture readable";
    case "Escape":
      return "it supports a clean breakaway read";
    default:
      return null;
  }
}

function buildFacebookCoverRecommendationReason(
  best: FacebookCoverFramePresetScore
): string {
  const heuristics = best.frameHeuristics;
  const parts = [
    heuristics?.speciesReadability === "high"
      ? "the species read stays clear at thumbnail size"
      : "the cover stays readable at Facebook size",
    heuristics?.textAnimalCollisionRisk === "low"
      ? "the text avoids crowding the animals"
      : heuristics?.leftRightSubjectFit === "strong"
        ? "the text still fits cleanly in the upper frame"
        : null,
    heuristics?.frame1Choice === "species-first"
      ? "it supports a species-first cover test"
      : "it keeps the tension obvious before playback starts",
  ].filter(Boolean);

  return `Best cover-frame test: ${best.label} because ${parts
    .slice(0, 3)
    .join(", ")}.`;
}

function buildFacebookOverlayRecommendationReason(
  recommended: FacebookOverlayPresetScore,
  contentLane: ContentLane
): string {
  const heuristics = recommended.frameHeuristics;
  const parts = [
    heuristics?.frame1Choice === "species-first"
      ? "it keeps the species read obvious in frame 1"
      : "it gets to the tension immediately in frame 1",
    heuristics?.textAnimalCollisionRisk === "low"
      ? "the overlay stays clear of the animals"
      : heuristics?.leftRightSubjectFit === "strong"
        ? "the overlay stays compact in the upper frame"
        : null,
    buildFacebookLaneSignal(contentLane),
  ].filter(Boolean);

  return `Best first overlay test: ${recommended.label} because ${parts
    .slice(0, 3)
    .join(", ")}.`;
}

function toFrameLevel(score: number): FacebookFrameHeuristicLevel {
  if (score <= 0) return "low";
  if (score === 1) return "medium";
  return "high";
}

function toFrameFit(score: number): FacebookFrameSubjectFit {
  if (score >= 2) return "strong";
  if (score <= -1) return "crowded";
  return "balanced";
}

function titleCaseFrameValue(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function hasBothNamedSpecies(
  text: string,
  predator: string,
  prey: string
): boolean {
  const lower = normalizeCopy(text).toLowerCase();
  const predatorName = normalizeCopy(predator).toLowerCase();
  const preyName = normalizeCopy(prey).toLowerCase();

  return Boolean(
    predatorName &&
      preyName &&
      lower.includes(predatorName) &&
      lower.includes(preyName)
  );
}

function chooseFacebookFrame1Choice(
  hook: string,
  contentLane: ContentLane,
  text = ""
): FacebookFrameChoice {
  const lower = normalizeCopy(`${hook} ${text}`).toLowerCase();

  switch (contentLane) {
    case "Pack Hunt":
    case "Fishing Strike":
    case "Escape":
    case "Defender":
      return "tension-first";
    case "Rut Battle":
      return "species-first";
    default:
      break;
  }

  if (/(waterline|strike|breakaway|pursuit|angle|ambush|escape|danger)/.test(lower)) {
    return "tension-first";
  }

  if (/(warning-step|stance|dominance|territory|clash|footing|shoulder|antler|standoff|claim)/.test(lower)) {
    return "species-first";
  }

  return "species-first";
}

function buildFacebookFrameHeuristics({
  text,
  lines,
  predator,
  prey,
  maxLineLength,
  hook,
  contentLane = "Auto",
  mode,
}: {
  text: string;
  lines: string[];
  predator: string;
  prey: string;
  maxLineLength: number;
  hook: string;
  contentLane?: ContentLane;
  mode: "overlay" | "cover";
}): FacebookFrameHeuristics {
  const compact = normalizeCopy(text);
  const lower = compact.toLowerCase();
  const speciesClear = hasFacebookSpeciesClarity(compact, predator, prey);
  const speciesLead = startsWithFacebookSpecies(compact, predator, prey);
  const hasBothSpecies =
    hasBothNamedSpecies(compact, predator, prey) || /\bvs\b/i.test(compact);
  const longestSpeciesLength = Math.max(
    normalizeCopy(predator).length,
    normalizeCopy(prey).length,
    0
  );
  const longestLine = lines.reduce(
    (max, line) => Math.max(max, line.length),
    0
  );
  const fillRatio = maxLineLength > 0 ? longestLine / maxLineLength : 1;
  const twoLine = lines.length === 2;
  const shortLines =
    lines.length > 0 &&
    lines.every((line) => line.length <= Math.round(maxLineLength * 0.68));
  const frame1Choice = chooseFacebookFrame1Choice(hook, contentLane, compact);

  let speciesScore = 0;
  if (speciesLead) speciesScore += 2;
  if (speciesClear) speciesScore += 1;
  if (!speciesClear) speciesScore -= 2;
  if (hasBothSpecies && longestSpeciesLength >= 14) speciesScore -= 1;

  let collisionScore = 0;
  if (fillRatio > 0.9) collisionScore += 2;
  else if (fillRatio > 0.76) collisionScore += 1;
  if (hasBothSpecies) collisionScore += 1;
  if (longestSpeciesLength >= 14 && fillRatio > 0.7) collisionScore += 1;
  if (/\?/.test(compact) && fillRatio > 0.72) collisionScore += 1;
  if (mode === "cover" && /\bvs\b/i.test(compact)) collisionScore += 1;
  if (twoLine) collisionScore -= 1;
  if (shortLines) collisionScore -= 1;

  let silhouetteScore = 0;
  if (!twoLine && fillRatio > 0.84) silhouetteScore += 2;
  else if (fillRatio > 0.72) silhouetteScore += 1;
  if (hasBothSpecies) silhouetteScore += 1;
  if (
    /(vs|clash|strike|pursuit|warning-step|dominance|territory)/.test(lower) &&
    fillRatio > 0.68
  ) {
    silhouetteScore += 1;
  }
  if (speciesLead && twoLine) silhouetteScore -= 1;
  if (shortLines) silhouetteScore -= 1;

  let fitScore = 0;
  if (twoLine && speciesLead && !hasBothSpecies) fitScore += 2;
  else if (twoLine && !hasBothSpecies) fitScore += 1;
  if (shortLines) fitScore += 1;
  if (hasBothSpecies) fitScore -= 1;
  if (fillRatio > 0.88) fitScore -= 1;

  const speciesReadability =
    speciesScore >= 2 ? "high" : speciesScore >= 0 ? "medium" : "low";
  const textAnimalCollisionRisk = toFrameLevel(collisionScore);
  const silhouetteConflictRisk = toFrameLevel(silhouetteScore);
  const leftRightSubjectFit = toFrameFit(fitScore);

  return {
    speciesReadability,
    textAnimalCollisionRisk,
    silhouetteConflictRisk,
    leftRightSubjectFit,
    frame1Choice,
    summary: `${titleCaseFrameValue(speciesReadability)} species readability, ${textAnimalCollisionRisk} text-animal collision risk, ${silhouetteConflictRisk} silhouette conflict risk, ${leftRightSubjectFit} upper-frame subject fit, ${frame1Choice} frame-1 call.`,
  };
}

function coverFrameChoiceBias(
  preset: FacebookCoverFramePreset,
  frame1Choice: FacebookFrameChoice
): number {
  if (frame1Choice === "species-first") {
    switch (preset) {
      case "species_pressure":
        return 14;
      case "two_line_cover":
        return 12;
      case "species_question":
        return 7;
      case "short_documentary":
        return 4;
      case "conflict_statement":
        return -6;
    }
  }

  switch (preset) {
    case "species_pressure":
      return 14;
    case "short_documentary":
      return 8;
    case "two_line_cover":
      return 8;
    case "species_question":
      return 3;
    case "conflict_statement":
      return -4;
  }

  return 0;
}

function overlayFrameChoiceBias(
  preset: FacebookFirstFrameOverlayPreset,
  frame1Choice: FacebookFrameChoice
): number {
  if (frame1Choice === "species-first") {
    switch (preset) {
      case "facebook_species_first":
        return 16;
      case "facebook_two_line_readable":
        return 12;
      case "facebook_documentary_tension":
        return 4;
      case "facebook_observational_question":
        return 2;
      case "facebook_short_pressure":
        return -2;
    }
  }

  switch (preset) {
    case "facebook_short_pressure":
      return 16;
    case "facebook_documentary_tension":
      return 10;
    case "facebook_two_line_readable":
      return 6;
    case "facebook_observational_question":
      return 4;
    case "facebook_species_first":
      return 0;
  }

  return 0;
}

function scoreFacebookCoverFramePreset(
  preset: FacebookCoverFrameTextPreset,
  predator: string,
  prey: string,
  hook = "",
  contentLane: ContentLane = "Auto"
): FacebookCoverFramePresetScore {
  const signals: string[] = [];
  const text = normalizeCopy(preset.text);
  const speciesClear = hasFacebookSpeciesClarity(text, predator, prey);
  const speciesLead = startsWithFacebookSpecies(text, predator, prey);
  const pressureClear = hasFacebookPressureClarity(text);
  const readable = hasReadableFacebookLines(
    preset.lines,
    FACEBOOK_COVER_FRAME_MAX_LINE_LENGTH
  );
  const bait = hasBaitLikeCopy(text) || hasForcedEngagementCopy(text);
  const frameHeuristics = buildFacebookFrameHeuristics({
    text,
    lines: preset.lines,
    predator,
    prey,
    maxLineLength: FACEBOOK_COVER_FRAME_MAX_LINE_LENGTH,
    hook,
    contentLane,
    mode: "cover",
  });

  let score = 35;

  if (speciesClear) {
    score += 20;
    signals.push("species stays clear at Facebook thumbnail size");
  } else {
    score -= 14;
  }

  if (speciesLead) {
    score += 6;
    signals.push("species leads the cover line");
  }

  if (readable) {
    score += 26;
    signals.push("holds as a compact 1-2 line cover");
  } else {
    score -= 22;
  }

  if (pressureClear) {
    score += 18;
    signals.push("tension cue still reads at thumbnail size");
  } else {
    score -= 10;
  }

  if (!bait) {
    score += 15;
    signals.push("stays documentary and non-bait");
  } else {
    score -= 35;
  }

  if (frameHeuristics.speciesReadability === "high") {
    score += 10;
    signals.push("keeps species readability high");
  } else if (frameHeuristics.speciesReadability === "low") {
    score -= 10;
  }

  if (frameHeuristics.textAnimalCollisionRisk === "low") {
    score += 12;
    signals.push("avoids crowding the animals");
  } else if (frameHeuristics.textAnimalCollisionRisk === "high") {
    score -= 18;
  }

  if (frameHeuristics.silhouetteConflictRisk === "low") {
    score += 8;
    signals.push("keeps text off the main silhouette");
  } else if (frameHeuristics.silhouetteConflictRisk === "high") {
    score -= 14;
  }

  if (frameHeuristics.leftRightSubjectFit === "strong") {
    score += 8;
    signals.push("fits cleanly in the upper frame");
  } else if (frameHeuristics.leftRightSubjectFit === "crowded") {
    score -= 8;
  }

  score += coverFrameChoiceBias(preset.preset, frameHeuristics.frame1Choice);
  signals.push(buildFrame1CallSignal(frameHeuristics.frame1Choice));

  if (preset.preset === "species_pressure") score += 10;
  if (preset.preset === "two_line_cover") score += 8;
  if (preset.preset === "species_question") score += 5;
  if (preset.preset === "conflict_statement" && pressureClear) score += 4;
  if (preset.preset === "conflict_statement" && !pressureClear) score -= 10;

  return {
    preset: preset.preset,
    label: preset.label,
    text: preset.text,
    score: clampFacebookScore(score),
    reasons: signals.length ? signals : ["clean Facebook cover readability"],
    frameHeuristics,
  };
}

export function rankFacebookCoverFramePresets(
  presets: FacebookCoverFrameTextPreset[],
  predator: string,
  prey: string,
  hook = "",
  contentLane: ContentLane = "Auto"
): FacebookCoverFrameRanking | undefined {
  if (!presets.length) return undefined;

  const originalIndex = new Map(
    presets.map((preset, index) => [preset.preset, index] as const)
  );
  const ranked = presets
    .map((preset) =>
      scoreFacebookCoverFramePreset(preset, predator, prey, hook, contentLane)
    )
    .sort(
      (a, b) =>
        b.score - a.score ||
        (originalIndex.get(a.preset) ?? 0) - (originalIndex.get(b.preset) ?? 0)
    );
  const best = ranked[0];

  if (!best) return undefined;

  return {
    best,
    ranked,
    reason: buildFacebookCoverRecommendationReason(best),
  };
}

function laneOverlayPresetBias(
  contentLane: ContentLane,
  preset: FacebookFirstFrameOverlayPreset
): number {
  const bias: Record<
    ContentLane,
    Partial<Record<FacebookFirstFrameOverlayPreset, number>>
  > = {
    Auto: {},
    "Pack Hunt": {
      facebook_short_pressure: 24,
      facebook_two_line_readable: 18,
      facebook_species_first: 10,
      facebook_documentary_tension: 4,
    },
    Defender: {
      facebook_documentary_tension: 24,
      facebook_two_line_readable: 18,
      facebook_observational_question: 10,
      facebook_species_first: 8,
    },
    "Fishing Strike": {
      facebook_short_pressure: 24,
      facebook_two_line_readable: 18,
      facebook_observational_question: 12,
      facebook_species_first: 6,
    },
    "Rut Battle": {
      facebook_documentary_tension: 20,
      facebook_species_first: 18,
      facebook_two_line_readable: 12,
      facebook_observational_question: 4,
    },
    Escape: {
      facebook_short_pressure: 22,
      facebook_observational_question: 18,
      facebook_two_line_readable: 12,
      facebook_species_first: 6,
    },
  };

  return bias[contentLane]?.[preset] ?? 0;
}

function hookOverlayPresetBias(
  hook: string,
  preset: FacebookFirstFrameOverlayPreset
): number {
  const compact = normalizeCopy(hook);
  const lower = compact.toLowerCase();
  let score = 0;

  if (compact.length > 72 && preset === "facebook_documentary_tension") score += 10;
  if (/\?/.test(compact) && preset === "facebook_observational_question") score += 10;
  if (/(waterline|strike|escape lane|breakaway|pursuit|pressure|lane)/.test(lower)) {
    if (preset === "facebook_short_pressure") score += 8;
    if (preset === "facebook_two_line_readable") score += 6;
  }
  if (/(boundary|warning-step|stance|dominance|territory|clash)/.test(lower)) {
    if (preset === "facebook_documentary_tension") score += 8;
    if (preset === "facebook_species_first") score += 5;
  }

  return score;
}

function scoreFacebookOverlayPreset(
  preset: FacebookOverlayPreset,
  hook: string,
  predator: string,
  prey: string,
  contentLane: ContentLane
): FacebookOverlayPresetScore {
  const signals: string[] = [];
  const text = normalizeCopy(preset.text);
  const speciesClear = hasFacebookSpeciesClarity(text, predator, prey);
  const pressureClear = hasFacebookPressureClarity(text);
  const readable = hasReadableFacebookLines(
    preset.lines,
    HOOK_OVERLAY_MAX_LINE_LENGTH
  );
  const bait = hasBaitLikeCopy(text) || hasForcedEngagementCopy(text);
  const laneBias = laneOverlayPresetBias(contentLane, preset.preset);
  const frameHeuristics = buildFacebookFrameHeuristics({
    text,
    lines: preset.lines,
    predator,
    prey,
    maxLineLength: HOOK_OVERLAY_MAX_LINE_LENGTH,
    hook,
    contentLane,
    mode: "overlay",
  });

  let score = 35;

  if (readable) {
    score += 25;
    signals.push("holds as a compact frame-1 overlay");
  } else {
    score -= 20;
  }

  if (speciesClear) {
    score += 14;
    signals.push("keeps the species read obvious");
  }

  if (pressureClear) {
    score += 18;
    signals.push("gets to the behavior cue quickly");
  }

  if (!bait) {
    score += 15;
    signals.push("stays documentary and non-bait");
  } else {
    score -= 40;
  }

  if (frameHeuristics.speciesReadability === "high") {
    score += 8;
    signals.push("keeps species readability high");
  } else if (frameHeuristics.speciesReadability === "low") {
    score -= 8;
  }

  if (frameHeuristics.textAnimalCollisionRisk === "low") {
    score += 10;
    signals.push("avoids crowding the animals");
  } else if (frameHeuristics.textAnimalCollisionRisk === "high") {
    score -= 18;
  }

  if (frameHeuristics.silhouetteConflictRisk === "low") {
    score += 8;
    signals.push("keeps text off the main silhouette");
  } else if (frameHeuristics.silhouetteConflictRisk === "high") {
    score -= 12;
  }

  if (frameHeuristics.leftRightSubjectFit === "strong") {
    score += 8;
    signals.push("fits cleanly in the upper frame");
  } else if (frameHeuristics.leftRightSubjectFit === "crowded") {
    score -= 8;
  }

  if (laneBias > 0) {
    score += laneBias;
    signals.push(buildFacebookLaneSignal(contentLane) ?? "matches the current Facebook test context");
  }

  score += hookOverlayPresetBias(hook, preset.preset);
  score += overlayFrameChoiceBias(preset.preset, frameHeuristics.frame1Choice);
  signals.push(buildFrame1CallSignal(frameHeuristics.frame1Choice));

  return {
    preset: preset.preset,
    label: preset.label,
    text: preset.text,
    score: clampFacebookScore(score),
    reason: facebookReason(signals, "clean frame-1 overlay read"),
    frameHeuristics,
  };
}

export function recommendFacebookOverlayPreset(
  presets: FacebookOverlayPreset[],
  hook: string,
  predator: string,
  prey: string,
  contentLane: ContentLane = "Auto"
): FacebookOverlayRecommendation | undefined {
  if (!presets.length) return undefined;

  const originalIndex = new Map(
    presets.map((preset, index) => [preset.preset, index] as const)
  );
  const tieBreakScore = (entry: FacebookOverlayPresetScore) =>
    laneOverlayPresetBias(contentLane, entry.preset) +
    hookOverlayPresetBias(hook, entry.preset);
  const ranked = presets
    .map((preset) =>
      scoreFacebookOverlayPreset(preset, hook, predator, prey, contentLane)
    )
    .sort(
      (a, b) =>
        b.score - a.score ||
        tieBreakScore(b) - tieBreakScore(a) ||
        (originalIndex.get(a.preset) ?? 0) - (originalIndex.get(b.preset) ?? 0)
    );
  const recommended = ranked[0];

  if (!recommended) return undefined;

  return {
    recommended,
    alternatives: ranked.slice(1, 3),
    reason: buildFacebookOverlayRecommendationReason(recommended, contentLane),
  };
}

function finalizeShortCaption(raw: string): string {
  const compact = normalizeCopy(raw);
  const sentences = splitSentences(compact);
  const limited = (sentences.length ? sentences : [compact]).slice(0, 2).join(" ");

  if (limited.length <= 150) return limited;

  const firstSentence = sentences[0] ?? limited;
  if (firstSentence.length <= 150) return firstSentence;

  return trimAtWordBoundary(firstSentence, 150);
}

function prependContentLaneLead(raw: string, lead: string | null): string {
  if (!lead) return raw;
  const compactLead = normalizeCopy(lead);
  const compactRaw = normalizeCopy(raw);
  if (compactRaw.toLowerCase().startsWith(compactLead.toLowerCase())) {
    return compactRaw;
  }

  return `${compactLead} ${compactRaw}`.replace(/\s+/g, " ").trim();
}

/** Short caption variant — publish-safe by default, trimmed to 150 chars */
export function buildCaption(
  predator: string,
  prey: string,
  env: string,
  arc: Arc,
  options: CaptionOptions = {}
): string {
  const cleanEnv = sanitizeSocialEnv(env);

  const raw =
    SHORT_CAPTIONS_2026[arc]?.(predator, prey, cleanEnv) ??
    VIRAL_CAPTIONS[arc]?.(predator, prey, cleanEnv) ??
    `${predator} and ${prey} collide in the ${cleanEnv}, and the whole sequence turns on one immediate control shift.`;

  const caption =
    options.mode === "us-only"
      ? raw.replace(/\s+—\s+/g, ": ")
      : raw;

  return finalizeShortCaption(
    prependContentLaneLead(
      caption,
      buildContentLaneShortCaptionLead(
        options.contentLane ?? "Auto",
        predator,
        prey,
        arc
      )
    )
  );
}

/** Long caption variant — multi-paragraph story structure, no trimming */
export function build2026Caption(
  predator: string,
  prey: string,
  env: string,
  arc: Arc,
  options: CaptionOptions = {}
): string {
  const cleanEnv = sanitizeSocialEnv(env);

  const baseCaption =
    (options.mode === "us-only" ? CAPTIONS_2026_US_ONLY[arc] : CAPTIONS_2026[arc])?.(
      predator,
      prey,
      cleanEnv
    ) ??
    `${predator} and ${prey} collide in the ${cleanEnv}. The moment feels immediate, physical, and unforgiving from the first move.\n\nWhich part of the sequence changed the outcome for you?`;

  const laneLead = buildContentLaneLongCaptionLead(
    options.contentLane ?? "Auto",
    predator,
    prey,
    arc
  );

  return laneLead ? `${laneLead}\n\n${baseCaption}` : baseCaption;
}

export function buildShortCaption(
  predator: string,
  prey: string,
  env: string,
  arc: Arc,
  options: CaptionOptions = {}
): string {
  return buildCaption(predator, prey, env, arc, options);
}

export function buildLongCaption(
  predator: string,
  prey: string,
  env: string,
  arc: Arc,
  options: CaptionOptions = {}
): string {
  return build2026Caption(predator, prey, env, arc, options);
}

function getArcHashtag(arc: Arc): string {
  return (
    {
      "Ambush attack": "#ambush",
      "Chase and takedown": "#wildlifechase",
      "Defender stands ground": "#animalbehavior",
      "Giant vs giant clash": "#animalclash",
      "Territory dominance battle": "#territory",
      "Pack hunting strategy": "#packhunting",
      "Predator vs predator fight": "#predatorclash",
      "Escape from danger": "#survival",
    }[arc] ?? "#wildlife"
  );
}

/** Hashtag string — always returns exactly 5 clean hashtags. */
export function buildHashtags(
  predator: string,
  prey: string,
  arc: Arc,
  options: HashtagOptions = {}
): string {
  void options;

  const baseTags = BASE_HASHTAGS[arc] ?? ["#wildlife", getArcHashtag(arc), "#usa"];
  const laneTag = getContentLaneHashtag(
    options.contentLane ?? "Auto",
    predator,
    prey,
    arc
  );
  const tags = [
    baseTags[0] ?? "#wildlife",
    toHashtag(predator),
    toHashtag(prey),
    laneTag ?? getArcHashtag(arc),
    baseTags[2] ?? "#usa",
  ].filter(Boolean);

  return [...new Set(tags)].slice(0, 5).join(" ");
}

/** Separate Facebook-style tags field — clean keywords, not hashtags. */
export function buildTags(
  predator: string,
  prey: string,
  arc: Arc
): string {
  const tags = [
    toTag(predator),
    toTag(prey),
    ARC_TAG_LABEL[arc],
    "wildlife",
    "usa nature",
  ].filter(Boolean);

  return [...new Set(tags)].slice(0, 5).join(", ");
}

// ─────────────────────────────────────────────────────────────
// PLATFORM PACK
// ─────────────────────────────────────────────────────────────
export function buildPlatformPack(
  predator: string,
  prey: string,
  arc: Arc,
  env: string,
  contentLane: ContentLane = "Auto"
): PlatformPack {
  const cleanEnv = sanitizeSocialEnv(env);
  const hooks = build2026Hook(predator, prey, arc, { contentLane });
  const shortCaption = buildShortCaption(predator, prey, cleanEnv, arc, {
    mode: "us-only",
    contentLane,
  });
  const longCaption = buildLongCaption(predator, prey, cleanEnv, arc, {
    mode: "us-only",
    contentLane,
  });
  const hashtags = buildHashtags(predator, prey, arc, {
    count: 5,
    contentLane,
  });
  const tags = buildTags(predator, prey, arc);
  const overlayGuidance = buildFirstFrameOverlayGuidance();
  const facebookOverlayPresets = buildFacebookFirstFrameOverlayPresets(
    hooks[0],
    predator,
    prey
  );
  const facebookCoverFramePresets = buildFacebookCoverFramePresets(
    hooks[0],
    predator,
    prey,
    arc
  );

  const facebook: FacebookPack = {
    hook: hooks[0],
    caption: longCaption,
    hashtags,
    tags,
    bestTime:
      "Start with weekday morning or midday, then keep the winner from your own Facebook Insights.",
    cmpNote:
      "Keep the packaging original, keep the overlay in the upper safe zone and clear of the animals, and make sure the reel reads with or without sound.",
    strategyNote:
      "Lead with the clearest species read or the clearest danger beat, then keep the overlay compact and off the main silhouette.",
    overlayGuidance,
    hookFormattingPresets: buildHookFormattingPresets(hooks[0], predator, prey),
    facebookOverlayPresets,
    facebookCoverFramePresets,
    facebookOverlayRecommendation: recommendFacebookOverlayPreset(
      facebookOverlayPresets,
      hooks[0],
      predator,
      prey,
      contentLane
    ),
    facebookCoverFrameRanking: rankFacebookCoverFramePresets(
      facebookCoverFramePresets,
      predator,
      prey,
      hooks[0],
      contentLane
    ),
  };

  const instagram: InstagramPack = {
    hook: hooks[1],
    caption: shortCaption,
    hashtags,
    bestTime:
      "Start by testing afternoon and evening windows, then refine from account Insights while keeping the opening motion clear instantly.",
    strategyNote:
      "Keep the first line species-clear, use upper safe-zone text, and let the opening frame show clear tension immediately.",
  };

  const tiktok: TikTokPack = {
    hook: hooks[2],
    caption: shortCaption,
    hashtags,
    bestTime:
      "Start by testing late afternoon to evening and refine from retention signals while keeping the tension visible immediately.",
    strategyNote:
      "Use clear opening motion, support both sound-on and sound-off viewing, and avoid dead-static setup before the tension is visible.",
  };

  const youtube_shorts: YouTubeShortsPack = {
    title: `${predator} vs ${prey} — ${arc} | Wild Stories TV`,
    description: longCaption,
    tags,
    bestTime:
      "Keep a consistent cadence and judge performance with your own retention and return-viewer signals.",
    strategyNote:
      "Write a searchable title and keep the opening seconds documentary, clear, and visibly original before the sequence escalates.",
  };

  return { facebook, instagram, tiktok, youtube_shorts };
}

// ─────────────────────────────────────────────────────────────
// SEO TITLE
// ─────────────────────────────────────────────────────────────
export function buildSEOTitle(predator: string, prey: string, arc: Arc): string {
  return `${predator} vs ${prey} — ${arc} | Wild Stories TV`;
}

// ─────────────────────────────────────────────────────────────
// ALT TEXT PROMPT
// ─────────────────────────────────────────────────────────────
export function buildAltTextPrompt(
  predator: string,
  prey: string,
  env: string,
  arc: Arc
): string {
  const cleanEnv = sanitizeSocialEnv(env);
  return `AI-generated cinematic wildlife scene showing ${predator} and ${prey} in ${cleanEnv} during a ${arc.toLowerCase()} sequence. Wild Stories TV original content.`;
}
