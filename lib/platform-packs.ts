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
  PlatformPack,
  FacebookPack,
  InstagramPack,
  TikTokPack,
  YouTubeShortsPack,
} from "@/types";

const HOOK_FAMILY_ORDER = ["danger", "curiosity", "reversal"] as const;

export type HookFamilySupport = (typeof HOOK_FAMILY_ORDER)[number];
export type CaptionMode = "default" | "us-only";
export type CaptionOptions = {
  mode?: CaptionMode;
};
export type HashtagOptions = {
  count?: number;
};

// ─────────────────────────────────────────────────────────────
// 1. VIRAL HOOKS  (legacy — one hook per arc)
// ─────────────────────────────────────────────────────────────
const VIRAL_HOOKS: Partial<Record<Arc, (predator: string, prey: string) => string>> = {
  "Ambush attack": (predator, prey) =>
    `The ${prey.toLowerCase()} looked up too late. The ${predator.toLowerCase()} was already there.`,

  "Chase and takedown": (predator, prey) =>
    `Once the ${predator.toLowerCase()} committed, the ${prey.toLowerCase()} lost space fast.`,

  "Defender stands ground": (predator) =>
    `Nobody expected this ${predator.toLowerCase()} to hold its ground.`,

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
    `The ${prey.toLowerCase()} looked up too late.`,
    `The ${predator.toLowerCase()} was already inside the danger zone.`,
    `One quiet second turned into open pressure.`,
  ],
  "Chase and takedown": (predator, prey) => [
    `The ${predator.toLowerCase()} committed and the escape window vanished.`,
    `The ${prey.toLowerCase()} reacted fast. The gap still closed.`,
    `For a beat it looked open. Then the chase flipped.`,
  ],
  "Defender stands ground": (predator, prey) => [
    `Nobody expected this ${predator.toLowerCase()} to hold position.`,
    `The ${prey.toLowerCase()} thought this was an easy push. It wasn't.`,
    `The easy push turned into a hard stop instantly.`,
  ],
  "Giant vs giant clash": (predator, prey) => [
    `${predator} and ${prey} were too close for either one to back off.`,
    `One heavy step turned this into a real collision.`,
    `It looked like a standoff until the impact flipped the moment.`,
  ],
  "Territory dominance battle": (predator, prey) => [
    `The ${prey.toLowerCase()} crossed the wrong boundary.`,
    `This is ${predator}'s ground and the ${prey.toLowerCase()} felt it instantly.`,
    `One step too far turned a warning into a full answer.`,
  ],
  "Pack hunting strategy": (predator, prey) => [
    `The ${prey.toLowerCase()} was already losing space before it reacted.`,
    `This is why ${predator.toLowerCase()}s feel dangerous before full contact.`,
    `It looked wide open until the escape lane vanished.`,
  ],
  "Predator vs predator fight": (predator, prey) => [
    `Two apex predators. One space. No safe outcome.`,
    `${predator} and ${prey} turned this into open pressure instantly.`,
    `One bad read flipped control immediately.`,
  ],
  "Escape from danger": (predator, prey) => [
    `This ${prey.toLowerCase()} had less than a second to react.`,
    `The ${predator.toLowerCase()} moved before the ${prey.toLowerCase()} read the danger.`,
    `It looked finished until one move changed the outcome.`,
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
    `In the ${env}, the danger was readable before the full move.\n\nThe ${prey.toLowerCase()} looked up too late and the ${predator.toLowerCase()} was already inside the pressure zone. That is what makes a real ambush hit so hard on screen: no long setup, just one bad second and immediate pressure.\n\nAt what point did the outcome start to feel inevitable?`,
  "Chase and takedown": (predator, prey, env) =>
    `Across the ${env}, the escape window disappeared fast.\n\nThe ${predator.toLowerCase()} committed cleanly and the ${prey.toLowerCase()} had almost no time to reset. What makes this kind of chase work on short-form is how clearly the pressure builds from the first stride.\n\nDid the ${prey.toLowerCase()} ever have enough space to recover?`,
  "Defender stands ground": (predator, prey, env) =>
    `In the ${env}, every instinct said move. This ${predator.toLowerCase()} did the opposite.\n\nWhen the ${prey.toLowerCase()} kept pressing forward, the encounter stopped feeling like pressure and started feeling like a statement. The hold is what makes the moment memorable.\n\nDid you expect it to stand its ground that long?`,
  "Giant vs giant clash": (predator, prey, env) =>
    `Two huge animals met in the ${env}, and neither wanted to give space.\n\nA ${predator.toLowerCase()} and a ${prey.toLowerCase()} create a different kind of tension: slower, heavier, and much more violent the second contact happens.\n\nWho controlled the moment first?`,
  "Territory dominance battle": (predator, prey, env) =>
    `In the ${env}, territory is never symbolic.\n\nThe ${prey.toLowerCase()} stepped into the wrong space and the ${predator.toLowerCase()} answered immediately. The whole encounter works because the boundary is readable before the full reaction lands.\n\nWould you have backed off earlier?`,
  "Pack hunting strategy": (predator, prey, env) =>
    `At first, the ${prey.toLowerCase()} looked mobile. Then the space started disappearing.\n\nIn the ${env}, the ${predator.toLowerCase()} becomes dangerous before full contact because the pressure is already organized. It is timing, spacing, angle control, and a closing escape lane.\n\nAt what point did the ${prey.toLowerCase()} start losing the field?`,
  "Predator vs predator fight": (predator, prey, env) =>
    `Two apex predators. No safe outcome.\n\nA ${predator.toLowerCase()} facing a ${prey.toLowerCase()} in the ${env} feels intense because both animals understand the cost of a bad decision. These encounters escalate fast once control starts to shift.\n\nWhich animal looked more in control first?`,
  "Escape from danger": (predator, prey, env) =>
    `Everything changed in under a second in the ${env}.\n\nThe ${prey.toLowerCase()} had almost no time to react before the ${predator.toLowerCase()} moved. In moments like this, survival comes down to one decision made fast enough.\n\nDid the ${prey.toLowerCase()} escape in time?`,
};

const CAPTIONS_2026_US_ONLY: Partial<Record<Arc, (predator: string, prey: string, env: string) => string>> = {
  "Ambush attack": (predator, prey, env) =>
    `In the ${env}, the danger read immediately.\n\nThe ${prey.toLowerCase()} looked up too late and the ${predator.toLowerCase()} was already inside the pressure zone. The whole moment lands because the setup is clear and the pressure arrives fast.\n\nWhat second made the situation feel lost?`,
  "Chase and takedown": (predator, prey, env) =>
    `Across the ${env}, the escape window closed fast.\n\nThe ${predator.toLowerCase()} committed early and the ${prey.toLowerCase()} never looked fully reset. The sequence works because the speed is obvious right away.\n\nDid it ever feel like the chase reopened?`,
  "Defender stands ground": (predator, prey, env) =>
    `In the ${env}, every instinct said move. This ${predator.toLowerCase()} stayed put.\n\nOnce the ${prey.toLowerCase()} kept pressing forward, the encounter shifted from pressure to control. The refusal to give space is the whole story beat.\n\nWhen did the balance start to flip?`,
  "Giant vs giant clash": (predator, prey, env) =>
    `Two huge animals met in the ${env}, and neither gave ground.\n\nA ${predator.toLowerCase()} and a ${prey.toLowerCase()} create a slower kind of violence because the weight transfer is readable before the hit.\n\nWhich step changed the whole sequence?`,
  "Territory dominance battle": (predator, prey, env) =>
    `In the ${env}, the boundary was clear before the full answer came.\n\nThe ${prey.toLowerCase()} stepped into the wrong space and the ${predator.toLowerCase()} answered right away. The whole moment works because the warning is visible before the reaction peaks.\n\nWould you have backed off sooner?`,
  "Pack hunting strategy": (predator, prey, env) =>
    `At first, the ${prey.toLowerCase()} looked free. Then the lane disappeared.\n\nIn the ${env}, the ${predator.toLowerCase()} feels dangerous because the pressure is organized before full contact. The spacing does most of the work.\n\nWhat moment made the escape feel closed?`,
  "Predator vs predator fight": (predator, prey, env) =>
    `Two apex predators met in the ${env}, and neither had room for a harmless mistake.\n\nThe tension works because both animals understand the cost of giving up position. Once control shifts, the whole clip changes.\n\nWho looked settled first?`,
  "Escape from danger": (predator, prey, env) =>
    `Everything changed fast in the ${env}.\n\nThe ${prey.toLowerCase()} had almost no time to react before the ${predator.toLowerCase()} moved. The whole beat depends on one survival read made under pressure.\n\nWhat move gave the ${prey.toLowerCase()} a chance?`,
};

// ─────────────────────────────────────────────────────────────
// 5. CTAs
// ─────────────────────────────────────────────────────────────
const VIRAL_CTAS: Partial<Record<Arc, string>> = {
  "Ambush attack":
    "What second made the danger feel obvious to you?",
  "Chase and takedown":
    "Did the prey ever have enough space to recover?",
  "Defender stands ground":
    "Did you expect that stand to hold?",
  "Giant vs giant clash":
    "Which step changed the standoff for you?",
  "Territory dominance battle":
    "Would you have backed off earlier?",
  "Pack hunting strategy":
    "When did the escape lane start closing?",
  "Predator vs predator fight":
    "Which animal looked more in control first?",
  "Escape from danger":
    "Did the prey read the danger in time?",
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

  const clipped = compact.slice(0, maxChars + 1);
  const wordSafe = normalizeCopy(
    clipped.replace(/\s+\S*$/, "").replace(/[,:;/-]+$/g, "")
  );
  const fallback = normalizeCopy(compact.slice(0, maxChars).replace(/[,:;/-]+$/g, ""));
  const resolved = wordSafe.length >= Math.floor(maxChars * 0.6) ? wordSafe : fallback;

  if (!resolved) return compact.slice(0, maxChars).trim();
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
export function build2026Hook(predator: string, prey: string, arc: Arc): string[] {
  const hooks =
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
  family: HookFamilySupport
): string {
  const hooks = build2026Hook(predator, prey, arc);
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

  return finalizeShortCaption(caption);
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

  return (
    (options.mode === "us-only" ? CAPTIONS_2026_US_ONLY[arc] : CAPTIONS_2026[arc])?.(
      predator,
      prey,
      cleanEnv
    ) ??
    `${predator} and ${prey} collide in the ${cleanEnv}. The moment feels immediate, physical, and unforgiving from the first move.\n\nWhich part of the sequence changed the outcome for you?`
  );
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
  const tags = [
    baseTags[0] ?? "#wildlife",
    toHashtag(predator),
    toHashtag(prey),
    getArcHashtag(arc),
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
  env: string
): PlatformPack {
  const cleanEnv = sanitizeSocialEnv(env);
  const hooks = build2026Hook(predator, prey, arc);
  const shortCaption = buildShortCaption(predator, prey, cleanEnv, arc, { mode: "us-only" });
  const longCaption = buildLongCaption(predator, prey, cleanEnv, arc, { mode: "us-only" });
  const hashtags = buildHashtags(predator, prey, arc, { count: 5 });
  const tags = buildTags(predator, prey, arc);

  const facebook: FacebookPack = {
    hook: hooks[0],
    caption: longCaption,
    hashtags,
    tags,
        bestTime: "Test weekday 8–10 AM ET and 12–3 PM ET first, then refine with Facebook Insights while prioritizing reels with fast readable openings.",
        cmpNote:
      "Facebook Content Monetization beta is invite-only. Eligible formats include reels, photos, stories, and text posts. Meta prioritizes original content and stronger viewer retention signals.",
        strategyNote:
      "Use the Page Featured section to pin the reel with the clearest first-frame tension and fastest readable wildlife setup.",
  };

  const instagram: InstagramPack = {
    hook: hooks[1],
    caption: shortCaption,
    hashtags,
    bestTime: "Test afternoon and evening windows, then optimize from account Insights while keeping the opening frame instantly readable.",
    strategyNote: "Keep the first line punchy and make sure the opening frame shows readable pressure immediately.",
  };

  const tiktok: TikTokPack = {
    hook: hooks[2],
    caption: shortCaption,
    hashtags,
    bestTime: "Test late afternoon to evening and refine using retention, not only views, especially on clips with immediate visible tension.",
    strategyNote: "Use larger caption beats, faster opening language, and no slow setup before the tension is visible.",
  };

  const youtube_shorts: YouTubeShortsPack = {
    title: `${predator} vs ${prey} — ${arc} | Wild Stories TV`,
    description: longCaption,
    tags,
    bestTime: "Keep a consistent cadence and judge by retention plus returning viewers.",
    strategyNote: "Write a searchable title and make the opening seconds instantly readable before the sequence escalates.",
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
