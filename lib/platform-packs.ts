// ─────────────────────────────────────────────────────────────
// lib/platform-packs.ts
// WSTV — Platform Packs, Hooks, Captions, CTAs, Hashtags
//
// RULES:
//   • Pure functions only — no React, no useState, no UI
//   • All data and functions exported for use in buildPackage()
//
// RESEARCH SOURCES (2025–2026):
//   • Meta official: original content prioritized for CMP beta
//   • Social Insider Jan 2026: 60-90s reels peak performance
//   • Shortimize Nov 2025: first 1-2 hours = 80% viral potential
//   • OpusClip Feb 2026: first 3 seconds = scroll stopper
//   • HookAgency Jan 2026: USA posting time windows
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
  count?: 3 | 4 | 5;
};

// ─────────────────────────────────────────────────────────────
// 1. VIRAL HOOKS  (legacy — one hook per arc)
// ─────────────────────────────────────────────────────────────
const VIRAL_HOOKS: Partial<Record<Arc, (predator: string, prey: string) => string>> = {
    "Ambush attack": (predator, prey) =>
    `The ${prey.toLowerCase()} looked up too late and the ${predator.toLowerCase()} was already there. ⚠️`,

    "Chase and takedown": (predator, prey) =>
    `Once the ${predator.toLowerCase()} committed, the ${prey.toLowerCase()} lost space fast. ⚡`,

  "Defender stands ground": (predator) =>
    `Nobody expected this ${predator.toLowerCase()} to hold its ground. 🦬`,

  "Giant vs giant clash": (predator, prey) =>
    `${predator} vs ${prey} — two giants, one brutal moment. 🔥`,

  "Territory dominance battle": (_predator, prey) =>
    `The ${prey.toLowerCase()} crossed the wrong boundary. 👀`,

    "Pack hunting strategy": (_predator, prey) =>
    `The ${prey.toLowerCase()} was already losing the field before it reacted. 🧠`,

  "Predator vs predator fight": () =>
    `Two apex predators. One territory. No room to back down. 💥`,

    "Escape from danger": (_predator, prey) =>
    `This ${prey.toLowerCase()} had almost no time to read the danger. ⚡`,
};

// ─────────────────────────────────────────────────────────────
// 2. 2026 HOOKS  (3 variants per arc — danger / curiosity / reversal)
// ─────────────────────────────────────────────────────────────
const HOOKS_2026: Partial<Record<Arc, (predator: string, prey: string) => string[]>> = {
    "Ambush attack": (predator, prey) => [
    `The ${prey.toLowerCase()} looked up too late. ⚠️`,
    `The ${predator.toLowerCase()} was already inside the danger zone. 👀`,
    `One quiet second flipped into open panic. 🔥`,
  ],
    "Chase and takedown": (predator, prey) => [
    `The ${predator.toLowerCase()} committed and the escape window vanished. ⚡`,
    `The ${prey.toLowerCase()} reacted fast. The gap still closed. 😳`,
    `For a beat it looked open. Then the chase flipped. 🎬`,
  ],
  "Defender stands ground": (predator, prey) => [
    `Nobody expected this ${predator.toLowerCase()} to hold position. 🦬`,
    `The ${prey.toLowerCase()} thought this was an easy push. It wasn't. 🔥`,
    `The easy push turned into a hard stop instantly. 👀`,
  ],
  "Giant vs giant clash": (predator, prey) => [
    `${predator} and ${prey} were too close for either one to back off. 🔥`,
    `One heavy step turned this into a real collision. 👀`,
    `It looked like a standoff until the impact flipped the moment. ⚠️`,
  ],
  "Territory dominance battle": (predator, prey) => [
    `The ${prey.toLowerCase()} crossed the wrong boundary. ⚠️`,
    `This is ${predator}'s ground and the ${prey.toLowerCase()} felt it instantly. 🔥`,
    `One step too far turned a warning into a full answer. 👀`,
  ],
    "Pack hunting strategy": (predator, prey) => [
    `The ${prey.toLowerCase()} was already losing space before it reacted. ⚠️`,
    `This is why ${predator.toLowerCase()}s feel dangerous before full contact. 🧠`,
    `It looked wide open until the escape lane vanished. 👀`,
  ],
  "Predator vs predator fight": (predator, prey) => [
    `Two apex predators. One space. No safe outcome. 💥`,
    `${predator} vs ${prey} — this turned violent instantly. 🔥`,
    `One bad read flipped control immediately. 👀`,
  ],
  "Escape from danger": (predator, prey) => [
    `This ${prey.toLowerCase()} had less than a second to react. ⚡`,
    `The ${predator.toLowerCase()} moved before the ${prey.toLowerCase()} read the danger. 👁️`,
    `It looked finished until one move changed the outcome. 😳`,
  ],
};

// ─────────────────────────────────────────────────────────────
// 3. VIRAL CAPTIONS  (legacy — one caption per arc)
// ─────────────────────────────────────────────────────────────
const VIRAL_CAPTIONS: Partial<Record<Arc, (predator: string, prey: string, env: string) => string>> = {
  "Ambush attack": (predator, prey, env) =>
    `Deep in the ${env}, the ${prey.toLowerCase()} looked safe for one second too long. The ${predator.toLowerCase()} had already closed the distance — and from that instant, survival turned into pure reaction. Nature rarely gives a warning. ⚠️`,
  "Chase and takedown": (predator, prey, env) =>
    `Across the ${env}, the ${predator.toLowerCase()} committed fully and the ${prey.toLowerCase()} had only seconds to respond. What makes this moment powerful is not just the speed — it is the instant when the outcome starts to shift. ⚡`,
  "Defender stands ground": (predator, prey, env) =>
    `In the ${env}, every instinct said move. This ${predator.toLowerCase()} did the opposite. When the ${prey.toLowerCase()} kept pressing forward, the encounter stopped feeling like a chase and started feeling like a statement. 🦬`,
  "Giant vs giant clash": (predator, prey, env) =>
    `Two massive animals met in the ${env}, and neither wanted to yield space. A ${predator.toLowerCase()} and a ${prey.toLowerCase()} bring a different kind of tension — slower, heavier, and much more violent once contact happens. 🔥`,
  "Territory dominance battle": (predator, prey, env) =>
    `In the ${env}, the line between passing through and crossing the wrong boundary is tiny. The ${prey.toLowerCase()} stepped in anyway, and the ${predator.toLowerCase()} answered immediately. Territory in the wild is never symbolic — it is enforced. 👀`,
  "Pack hunting strategy": (predator, prey, env) =>
    `At first, the ${prey.toLowerCase()} looked free. Then the shape of the trap became clear. In the ${env}, the ${predator.toLowerCase()} is dangerous not because of chaos, but because every movement feels coordinated before the prey even realizes it. 🧠`,
  "Predator vs predator fight": (predator, prey, env) =>
    `A ${predator.toLowerCase()} and a ${prey.toLowerCase()} in the ${env} creates a different kind of pressure — no easy retreat, no harmless bluff, and almost no margin for error. These confrontations feel rare because both animals understand the cost. 💥`,
  "Escape from danger": (predator, prey, env) =>
    `Everything in the ${env} changed in an instant. The ${prey.toLowerCase()} had almost no time to process the danger before the ${predator.toLowerCase()} was already moving. In moments like this, survival comes down to one decision made fast enough. ⚡`,
};

// ─────────────────────────────────────────────────────────────
// 4. 2026 CAPTIONS
// ─────────────────────────────────────────────────────────────
const SHORT_CAPTIONS_2026: Partial<Record<Arc, (predator: string, prey: string, env: string) => string>> = {
  "Ambush attack": (predator, prey, env) =>
    `In the ${env}, the ${prey.toLowerCase()} looked up a moment too late and the ${predator.toLowerCase()} was already inside the pressure zone. The whole sequence turns on that lost second.`,
  "Chase and takedown": (predator, prey, env) =>
    `Across the ${env}, the ${predator.toLowerCase()} committed cleanly and the ${prey.toLowerCase()} had almost no time to reset. The tension comes from how fast the escape window closes.`,
  "Defender stands ground": (predator, prey, env) =>
    `In the ${env}, every instinct said move, but this ${predator.toLowerCase()} held position. That decision changed the whole feel of the encounter with the ${prey.toLowerCase()}.`,
  "Giant vs giant clash": (predator, prey, env) =>
    `In the ${env}, a ${predator.toLowerCase()} and a ${prey.toLowerCase()} met at close range and neither gave space. The weight of the moment is what makes the collision land.`,
  "Territory dominance battle": (predator, prey, env) =>
    `In the ${env}, the ${prey.toLowerCase()} crossed into the wrong space and the ${predator.toLowerCase()} answered immediately. The tension comes from how clear the boundary becomes.`,
  "Pack hunting strategy": (predator, prey, env) =>
    `In the ${env}, the ${prey.toLowerCase()} looked mobile at first, but the ${predator.toLowerCase()} took away the escape lane before full contact. The pressure feels organized from the start.`,
  "Predator vs predator fight": (predator, prey, env) =>
    `In the ${env}, a ${predator.toLowerCase()} and a ${prey.toLowerCase()} met with no easy retreat. The tension comes from how quickly one bad read can shift control.`,
  "Escape from danger": (predator, prey, env) =>
    `In the ${env}, the ${prey.toLowerCase()} had almost no time to react before the ${predator.toLowerCase()} moved. The whole clip turns on one survival decision.`,
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
    "At what second did you realize the danger was already there? Comment below 👇 Follow for original wildlife reels.",
    "Chase and takedown":
    "Did the prey ever have enough space to recover? Comment below 👇 Follow for daily wildlife tension.",
  "Defender stands ground":
    "Did you expect that stand? Drop your reaction below 👇 Follow for daily wildlife that breaks expectations.",
  "Giant vs giant clash":
    "Who won this clash? Comment your pick below 👇 Follow for giant-animal encounters.",
  "Territory dominance battle":
    "Would you have backed off earlier? Comment below 👇 Follow for raw dominance moments.",
    "Pack hunting strategy":
    "When did you notice the escape lane disappearing? Comment below 👇 Follow for smart wildlife tension.",
  "Predator vs predator fight":
    "Which animal would you trust more here? Comment below 👇 Follow for rare predator encounters.",
    "Escape from danger":
    "Did the prey read the danger in time? Comment below 👇 Follow for instant-impact wildlife reels.",
};

// ─────────────────────────────────────────────────────────────
// 6. HASHTAGS
// ─────────────────────────────────────────────────────────────
const BASE_HASHTAGS: Partial<Record<Arc, string[]>> = {
  "Ambush attack": ["#wildlife", "#ambush", "#predatorprey"],
  "Chase and takedown": ["#wildlife", "#chase", "#predatorprey"],
  "Defender stands ground": ["#wildlife", "#animalbehavior", "#defender"],
  "Giant vs giant clash": ["#wildlife", "#giantanimals", "#animalclash"],
  "Territory dominance battle": ["#wildlife", "#territory", "#dominance"],
  "Pack hunting strategy": ["#wildlife", "#packhunting", "#predatorprey"],
  "Predator vs predator fight": ["#wildlife", "#predatorfight", "#animalconflict"],
  "Escape from danger": ["#wildlife", "#escape", "#survival"],
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

// ─────────────────────────────────────────────────────────────
// PUBLIC BUILDER FUNCTIONS
// ─────────────────────────────────────────────────────────────

/** Legacy single hook — used in buildPackage routingNote and clip chaining */
export function buildHook(predator: string, prey: string, arc: Arc): string {
  const raw =
    VIRAL_HOOKS[arc]?.(predator, prey) ??
    `${predator} vs ${prey} — one wrong move changes everything.`;

  return raw.length > 72 ? `${raw.slice(0, 69)}...` : raw;
}

/** 3-variant 2026 hooks for A/B testing. Order: danger, curiosity, reversal. */
export function build2026Hook(predator: string, prey: string, arc: Arc): string[] {
  const hooks =
    HOOKS_2026[arc]?.(predator, prey) ?? [
      `${predator} vs ${prey} — one wrong move changes everything. 🔥`,
      `Nature gives almost no warning. 👀`,
      `This moment turned in less than a second. ⚡`,
    ];

  return hooks.map((hook) => (hook.length > 78 ? `${hook.slice(0, 75)}...` : hook));
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
    "Who wins this battle? Comment your guess 👇 Follow for daily wildlife cinema."
  );
}

/** Short caption variant — trimmed to 220 chars */
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

  return caption.length > 220 ? `${caption.slice(0, 217)}...` : caption;
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

function clampHashtagCount(count?: 3 | 4 | 5): 3 | 4 | 5 {
  return count === 3 || count === 4 || count === 5 ? count : 5;
}

/** Hashtag string — default output stays between 3 and 5 total tags. */
export function buildHashtags(
  predator: string,
  prey: string,
  arc: Arc,
  options: HashtagOptions = {}
): string {
  const predatorTag = `#${predator.toLowerCase().replace(/\s+/g, "")}`;
  const preyTag = `#${prey.toLowerCase().replace(/\s+/g, "")}`;
  const limit = clampHashtagCount(options.count);
  const baseTags = BASE_HASHTAGS[arc] ?? ["#wildlife", "#nature", "#animalbehavior"];

  const tags = [
    baseTags[0] ?? "#wildlife",
    predatorTag,
    preyTag,
    ...baseTags.slice(1),
  ];

  return [...new Set(tags)].slice(0, limit).join(" ");
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

  const facebook: FacebookPack = {
    hook: hooks[0],
    caption: longCaption,
    hashtags: buildHashtags(predator, prey, arc, { count: 5 }),
        bestTime: "Test weekday 8–10 AM ET and 12–3 PM ET first, then refine with Facebook Insights while prioritizing reels with fast readable openings.",
        cmpNote:
      "Facebook Content Monetization beta is invite-only. Eligible formats include reels, photos, stories, and text posts. Meta prioritizes original content and stronger viewer retention signals.",
        strategyNote:
      "Use the Page Featured section to pin the reel with the clearest first-frame tension and fastest readable wildlife setup.",
  };

  const instagram: InstagramPack = {
    hook: hooks[1],
    caption: shortCaption,
    hashtags: buildHashtags(predator, prey, arc, { count: 4 }),
    bestTime: "Test afternoon and evening windows, then optimize from account Insights while keeping the opening frame instantly readable.",
    strategyNote: "Keep the first line punchy and make sure the opening frame shows readable pressure immediately.",
  };

  const tiktok: TikTokPack = {
    hook: hooks[2],
    caption: shortCaption,
    hashtags: buildHashtags(predator, prey, arc, { count: 4 }),
    bestTime: "Test late afternoon to evening and refine using retention, not only views, especially on clips with immediate visible tension.",
    strategyNote: "Use larger caption beats, faster opening language, and no slow setup before the tension is visible.",
  };

  const youtube_shorts: YouTubeShortsPack = {
    title: `${predator} vs ${prey} — ${arc} | Wild Stories TV`,
    description: longCaption,
    tags: `wildlife, ${predator.toLowerCase()}, ${prey.toLowerCase()}, ${arc.toLowerCase()}, nature documentary, animal behavior, ai wildlife`,
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
