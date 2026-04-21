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
  PlatformPack,
  FacebookPack,
  InstagramPack,
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
  /\b(pressure|spacing|boundary|timing|posture|waterline|window|lane|stance|distance|footing|surface break|read|looked|turn|ground|clash|angle|territory|warning-step|breakaway|survival)\b/i;

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
    `This ${predator.toLowerCase()} refused to yield once the pressure arrived.`,

  "Giant vs giant clash": (predator, prey) =>
    `${predator} and ${prey} got too close. One heavy step changed the standoff.`,

  "Territory dominance battle": (_predator, prey) =>
    `The ${prey.toLowerCase()} crossed the wrong boundary.`,

  "Pack hunting strategy": (_predator, prey) =>
    `The ${prey.toLowerCase()} was already losing space before it reacted.`,

  "Predator vs predator fight": () =>
    `Two apex predators met too close. There was no safe outcome.`,

  "Escape from danger": (_predator, prey) =>
    `This ${prey.toLowerCase()} had almost no time to read the danger.`,
};

// ─────────────────────────────────────────────────────────────
// 2. 2026 HOOKS  (3 variants per arc — danger / curiosity / reversal)
// ─────────────────────────────────────────────────────────────
const HOOKS_2026: Partial<Record<Arc, (predator: string, prey: string) => string[]>> = {
  "Ambush attack": (predator, prey) => [
    `The ${prey.toLowerCase()} looked up after the ${predator.toLowerCase()} had already closed the space.`,
    `The ${predator.toLowerCase()} was inside the read before the ${prey.toLowerCase()} changed direction.`,
    `A quiet opening turned into visible pressure in one beat.`,
  ],
  "Chase and takedown": (predator, prey) => [
    `The ${predator.toLowerCase()} committed and the ${prey.toLowerCase()} lost clean running room.`,
    `The ${prey.toLowerCase()} reacted fast, but the closing angle was already there.`,
    `The lane looked open until the pursuit tightened.`,
  ],
  "Defender stands ground": (predator, prey) => [
    `The ${predator.toLowerCase()} held position and changed the whole read.`,
    `The ${prey.toLowerCase()} kept pressing, but the stance never opened.`,
    `What looked like an easy push turned into a hard boundary.`,
  ],
  "Giant vs giant clash": (predator, prey) => [
    `${predator} and ${prey} were already too tight for a clean reset.`,
    `The weight shift was visible before the full contact landed.`,
    `A slow standoff turned into impact once the footing gave way.`,
  ],
  "Territory dominance battle": (predator, prey) => [
    `The ${prey.toLowerCase()} stepped across a boundary the ${predator.toLowerCase()} was already holding.`,
    `The warning was readable before the full response landed.`,
    `One step changed the encounter from posture to enforcement.`,
  ],
  "Pack hunting strategy": (predator, prey) => [
    `The ${prey.toLowerCase()} was losing the escape lane before it broke into full flight.`,
    `The ${predator.toLowerCase()} pressure was organized before full contact.`,
    `The field looked open until the pursuit angles closed.`,
  ],
  "Predator vs predator fight": (predator, prey) => [
    `Two apex predators met at a distance with no easy reset.`,
    `${predator} and ${prey} read each other before the pressure fully tightened.`,
    `Control shifted as soon as one animal gave up clean position.`,
  ],
  "Escape from danger": (predator, prey) => [
    `The ${prey.toLowerCase()} had one clear chance to break the line.`,
    `The ${predator.toLowerCase()} moved before the ${prey.toLowerCase()} found a clean turn.`,
    `It looked closed until one survival move reopened the lane.`,
  ],
};

// ─────────────────────────────────────────────────────────────
// 3. VIRAL CAPTIONS  (legacy — one caption per arc)
// ─────────────────────────────────────────────────────────────
const VIRAL_CAPTIONS: Partial<Record<Arc, (predator: string, prey: string, env: string) => string>> = {
  "Ambush attack": (predator, prey, env) =>
    `In the ${env}, the ${prey.toLowerCase()} lost one second and the ${predator.toLowerCase()} used it. The whole moment works because the pressure becomes readable immediately.`,
  "Chase and takedown": (predator, prey, env) =>
    `Across the ${env}, the ${predator.toLowerCase()} committed early and the ${prey.toLowerCase()} had almost no time to recover. The shift in control is the real story beat.`,
  "Defender stands ground": (predator, prey, env) =>
    `In the ${env}, every instinct said move. This ${predator.toLowerCase()} stayed put, and that choice changed the whole read once the ${prey.toLowerCase()} kept pressing.`,
  "Giant vs giant clash": (predator, prey, env) =>
    `Two heavy animals met in the ${env}, and neither wanted to give space. The tension lands because the weight transfer is visible before the real impact.`,
  "Territory dominance battle": (predator, prey, env) =>
    `In the ${env}, the boundary was already clear before the response landed. The ${prey.toLowerCase()} stepped into it, and the ${predator.toLowerCase()} answered right away.`,
  "Pack hunting strategy": (predator, prey, env) =>
    `At first, the ${prey.toLowerCase()} looked free. Then the shape of the trap became readable. In the ${env}, the ${predator.toLowerCase()} wins space before full contact.`,
  "Predator vs predator fight": (predator, prey, env) =>
    `A ${predator.toLowerCase()} and a ${prey.toLowerCase()} in the ${env} creates a different kind of pressure. Both animals understand the cost of a bad read, so every movement matters more.`,
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
    `${predator} and ${prey} got too close. One heavy step changed the standoff.`,
  "Territory dominance battle": (predator, prey) =>
    `The ${prey.toLowerCase()} crossed the wrong line. The ${predator.toLowerCase()} answered immediately.`,
  "Pack hunting strategy": (predator, prey) =>
    `The ${prey.toLowerCase()} looked free for a second. Then the ${predator.toLowerCase()} closed the escape lane.`,
  "Predator vs predator fight": (predator, prey) =>
    `${predator} and ${prey} met too close. One bad read shifted control fast.`,
  "Escape from danger": (predator, prey) =>
    `The ${predator.toLowerCase()} moved first. The ${prey.toLowerCase()} had almost no time to turn.`,
};

const CAPTIONS_2026: Partial<Record<Arc, (predator: string, prey: string, env: string) => string>> = {
  "Ambush attack": (predator, prey, env) =>
    `In the ${env}, the danger was readable before the full move.

The ${prey.toLowerCase()} looked up too late and the ${predator.toLowerCase()} was already inside the pressure zone. That is what makes a real ambush land on screen: no long setup, just one bad second and immediate pressure.

What changed the outcome first?`,
  "Chase and takedown": (predator, prey, env) =>
    `Across the ${env}, the escape window disappeared fast.

The ${predator.toLowerCase()} committed cleanly and the ${prey.toLowerCase()} had almost no time to reset. What makes this kind of chase work on short-form is how clearly the pressure builds from the first stride.

Which movement changed the read?`,
  "Defender stands ground": (predator, prey, env) =>
    `In the ${env}, every instinct said move. This ${predator.toLowerCase()} did the opposite.

When the ${prey.toLowerCase()} kept pressing forward, the encounter stopped feeling like pressure and started feeling like a boundary. The hold is what makes the moment memorable.

What made the pressure feel obvious?`,
  "Giant vs giant clash": (predator, prey, env) =>
    `Two huge animals met in the ${env}, and neither wanted to give space.

A ${predator.toLowerCase()} and a ${prey.toLowerCase()} create a different kind of tension: slower, heavier, and driven by posture before the full contact lands.

Which shift in posture changed the read?`,
  "Territory dominance battle": (predator, prey, env) =>
    `In the ${env}, territory is never symbolic.

The ${prey.toLowerCase()} stepped into the wrong space and the ${predator.toLowerCase()} answered immediately. The whole encounter works because the boundary is readable before the full reaction lands.

Would you have read the boundary earlier?`,
  "Pack hunting strategy": (predator, prey, env) =>
    `At first, the ${prey.toLowerCase()} looked mobile. Then the space started disappearing.

In the ${env}, the ${predator.toLowerCase()} becomes dangerous before full contact because the pressure is already organized. It is timing, spacing, angle control, and a closing escape lane.

What made the pressure feel obvious first?`,
  "Predator vs predator fight": (predator, prey, env) =>
    `Two apex predators. No easy reset.

A ${predator.toLowerCase()} facing a ${prey.toLowerCase()} in the ${env} feels intense because both animals understand the cost of a bad decision. These encounters escalate fast once control starts to shift.

Which movement changed the read first?`,
  "Escape from danger": (predator, prey, env) =>
    `Everything changed in under a second in the ${env}.

The ${prey.toLowerCase()} had almost no time to react before the ${predator.toLowerCase()} moved. In moments like this, survival comes down to one decision made fast enough.

Would you have read the danger earlier?`,
};

const CAPTIONS_2026_US_ONLY: Partial<Record<Arc, (predator: string, prey: string, env: string) => string>> = {
  "Ambush attack": (predator, prey, env) =>
    `In the ${env}, the danger read immediately.

The ${prey.toLowerCase()} looked up too late and the ${predator.toLowerCase()} was already inside the pressure zone. The whole moment lands because the setup is clear and the pressure arrives fast.

What changed the outcome first?`,
  "Chase and takedown": (predator, prey, env) =>
    `Across the ${env}, the escape window closed fast.

The ${predator.toLowerCase()} committed early and the ${prey.toLowerCase()} never looked fully reset. The sequence works because the speed is obvious right away.

Which movement changed the read?`,
  "Defender stands ground": (predator, prey, env) =>
    `In the ${env}, every instinct said move. This ${predator.toLowerCase()} stayed put.

Once the ${prey.toLowerCase()} kept pressing forward, the encounter shifted from pressure to control. The refusal to give space is the whole story beat.

What made the pressure feel obvious?`,
  "Giant vs giant clash": (predator, prey, env) =>
    `Two huge animals met in the ${env}, and neither gave ground.

A ${predator.toLowerCase()} and a ${prey.toLowerCase()} create a slower kind of violence because the weight transfer is readable before the hit.

Which shift in posture changed the read?`,
  "Territory dominance battle": (predator, prey, env) =>
    `In the ${env}, the boundary was clear before the full answer came.

The ${prey.toLowerCase()} stepped into the wrong space and the ${predator.toLowerCase()} answered right away. The whole moment works because the warning is visible before the reaction peaks.

Would you have read the boundary earlier?`,
  "Pack hunting strategy": (predator, prey, env) =>
    `At first, the ${prey.toLowerCase()} looked free. Then the lane disappeared.

In the ${env}, the ${predator.toLowerCase()} feels dangerous because the pressure is organized before full contact. The spacing does most of the work.

What made the pressure feel obvious first?`,
  "Predator vs predator fight": (predator, prey, env) =>
    `Two apex predators met in the ${env}, and neither had room for a harmless mistake.

The tension works because both animals understand the cost of giving up position. Once control shifts, the whole clip changes.

Which movement changed the read first?`,
  "Escape from danger": (predator, prey, env) =>
    `Everything changed fast in the ${env}.

The ${prey.toLowerCase()} had almost no time to react before the ${predator.toLowerCase()} moved. The whole beat depends on one survival read made under pressure.

Would you have read the danger earlier?`,
};

// ─────────────────────────────────────────────────────────────
// 5. CTAs
// ─────────────────────────────────────────────────────────────
const VIRAL_CTAS: Partial<Record<Arc, string>> = {
  "Ambush attack":
    "What changed the outcome first?",
  "Chase and takedown":
    "Which movement changed the read?",
  "Defender stands ground":
    "What made the pressure feel obvious?",
  "Giant vs giant clash":
    "Which shift in posture changed the read?",
  "Territory dominance battle":
    "Would you have read the boundary earlier?",
  "Pack hunting strategy":
    "What made the pressure feel obvious first?",
  "Predator vs predator fight":
    "Which movement changed the read first?",
  "Escape from danger":
    "Would you have read the danger earlier?",
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

  if (!resolved) return compact.trim();
  return /[.!?]$/.test(resolved) ? resolved : `${resolved}.`;
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
      `It looked settled for a second. Then the pressure flipped.`,
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
    `${predator} and ${prey} collide in the ${cleanEnv}, and the whole sequence turns on one immediate shift in pressure.`;

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

  const facebook: FacebookPack = {
    hook: hooks[0],
    caption: longCaption,
    hashtags,
    tags,
        bestTime: "Start by testing weekday morning and midday windows, then refine with your own Facebook Insights while keeping the opening motion readable immediately.",
        cmpNote:
      "Keep the packaging original, keep overlay text in the upper safe zone, and make sure the reel reads clearly with or without sound.",
        strategyNote:
      "Pin the reel with the clearest species read, immediate motion, and strongest documentary tension in frame 1.",
  };

  const instagram: InstagramPack = {
    hook: hooks[1],
    caption: shortCaption,
    hashtags,
    bestTime: "Start by testing afternoon and evening windows, then refine from account Insights while keeping the opening motion readable instantly.",
    strategyNote: "Keep the first line species-clear, use upper safe-zone text, and let the opening frame show readable pressure immediately.",
  };

  const tiktok: TikTokPack = {
    hook: hooks[2],
    caption: shortCaption,
    hashtags,
    bestTime: "Start by testing late afternoon to evening and refine from retention signals while keeping the tension visible immediately.",
    strategyNote: "Use readable opening motion, support both sound-on and sound-off viewing, and avoid dead-static setup before the tension is visible.",
  };

  const youtube_shorts: YouTubeShortsPack = {
    title: `${predator} vs ${prey} — ${arc} | Wild Stories TV`,
    description: longCaption,
    tags,
    bestTime: "Keep a consistent cadence and judge performance with your own retention and return-viewer signals.",
    strategyNote: "Write a searchable title and keep the opening seconds documentary, readable, and clearly original before the sequence escalates.",
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
