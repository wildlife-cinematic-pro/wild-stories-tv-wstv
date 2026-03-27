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

// ─────────────────────────────────────────────────────────────
// 1. VIRAL HOOKS  (legacy — one hook per arc)
// ─────────────────────────────────────────────────────────────
const VIRAL_HOOKS: Partial<Record<Arc, (predator: string, prey: string) => string>> = {
  "Ambush attack": (predator, prey) =>
    `The ${prey.toLowerCase()} noticed the ${predator.toLowerCase()} too late. ⚠️`,
  "Chase and takedown": (predator, prey) =>
    `Once the ${predator.toLowerCase()} locked in, the ${prey.toLowerCase()} had seconds. ⚡`,
  "Defender stands ground": (predator) =>
    `Nobody expected this ${predator.toLowerCase()} to hold its ground. 🦬`,
  "Giant vs giant clash": (predator, prey) =>
    `${predator} vs ${prey} — two giants, one brutal moment. 🔥`,
  "Territory dominance battle": (_predator, prey) =>
    `The ${prey.toLowerCase()} crossed the wrong boundary. 👀`,
  "Pack hunting strategy": (_predator, prey) =>
    `The ${prey.toLowerCase()} was already surrounded. It just didn't know it yet. 🧠`,
  "Predator vs predator fight": () =>
    `Two apex predators. One territory. No room to back down. 💥`,
  "Escape from danger": (_predator, prey) =>
    `This ${prey.toLowerCase()} had less than a second to react. ⚡`,
};

// ─────────────────────────────────────────────────────────────
// 2. 2026 HOOKS  (3 variants per arc — A/B/C test ready)
// ─────────────────────────────────────────────────────────────
const HOOKS_2026: Partial<Record<Arc, (predator: string, prey: string) => string[]>> = {
  "Ambush attack": (predator, prey) => [
    `The ${prey.toLowerCase()} looked the wrong way for one second. ⚠️`,
    `The ${predator.toLowerCase()} was already in range before the ${prey.toLowerCase()} moved. 👀`,
    `One silent step changed everything for this ${prey.toLowerCase()}. 🔥`,
  ],
  "Chase and takedown": (predator, prey) => [
    `Once the ${predator.toLowerCase()} started running, the ${prey.toLowerCase()} was in trouble. ⚡`,
    `The ${prey.toLowerCase()} reacted fast — just not fast enough. 😳`,
    `This chase was decided the moment the ${predator.toLowerCase()} locked in. 🎬`,
  ],
  "Defender stands ground": (predator, prey) => [
    `Nobody expected this ${predator.toLowerCase()} to stand its ground. 🦬`,
    `The ${prey.toLowerCase()} thought this ${predator.toLowerCase()} would run. It didn't. 🔥`,
    `One refusal to move changed the entire encounter. 👀`,
  ],
  "Giant vs giant clash": (predator, prey) => [
    `${predator} vs ${prey} — two giants, zero mercy. 🔥`,
    `When two giants meet, size stops mattering and timing decides everything. 👁️`,
    `This is the kind of clash wildlife crews wait years to capture. 🎬`,
  ],
  "Territory dominance battle": (predator, prey) => [
    `The ${prey.toLowerCase()} crossed the wrong boundary. ⚠️`,
    `This is ${predator}'s territory — and the ${prey.toLowerCase()} felt it instantly. 🔥`,
    `One step too far, and the whole mood changed. 👀`,
  ],
  "Pack hunting strategy": (predator, prey) => [
    `The ${prey.toLowerCase()} was already surrounded. It just didn't know it yet. 🧠`,
    `This is why ${predator.toLowerCase()}s don't hunt alone. 🐺`,
    `One signal — then the whole trap closed. ⚡`,
  ],
  "Predator vs predator fight": (predator, prey) => [
    `Two apex predators. One territory. No backing down. 💥`,
    `${predator} vs ${prey} — the kind of encounter that turns instantly violent. 🔥`,
    `When predators meet like this, one mistake is all it takes. 👀`,
  ],
  "Escape from danger": (predator, prey) => [
    `This ${prey.toLowerCase()} had less than a second to react. ⚡`,
    `The ${predator.toLowerCase()} was already moving before the ${prey.toLowerCase()} understood the danger. 👁️`,
    `Survival came down to one decision and almost no time. 😳`,
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
    `At first, the ${prey.toLowerCase()} looked free. Then the shape of the trap became clear. In the ${env}, the ${predator.toLowerCase()} pack is dangerous not because of chaos, but because every movement feels coordinated before the prey even realizes it. 🧠`,
  "Predator vs predator fight": (predator, prey, env) =>
    `A ${predator.toLowerCase()} and a ${prey.toLowerCase()} in the ${env} creates a different kind of pressure — no easy retreat, no harmless bluff, and almost no margin for error. These confrontations feel rare because both animals understand the cost. 💥`,
  "Escape from danger": (predator, prey, env) =>
    `Everything in the ${env} changed in an instant. The ${prey.toLowerCase()} had almost no time to process the danger before the ${predator.toLowerCase()} was already moving. In moments like this, survival comes down to one decision made fast enough. ⚡`,
};

// ─────────────────────────────────────────────────────────────
// 4. 2026 STORY CAPTION
// ─────────────────────────────────────────────────────────────
const CAPTIONS_2026: Partial<Record<Arc, (predator: string, prey: string, env: string) => string>> = {
  "Ambush attack": (predator, prey, env) =>
    `In the ${env}, the warning came too late. ⚠️\n\nThe ${prey.toLowerCase()} looked safe for a moment, but the ${predator.toLowerCase()} had already closed the distance. That is what makes ambushes feel so brutal — the danger is real before the prey fully understands it.\n\nAt what second did you realize the turn was coming? 👇\n\nFollow for wildlife moments with real tension. 🔥`,
  "Chase and takedown": (predator, prey, env) =>
    `Across the ${env}, this became a pure speed test. ⚡\n\nThe ${predator.toLowerCase()} committed fully, and the ${prey.toLowerCase()} had only a tiny window to react. The wild is full of movement, but moments like this show how quickly one chase can become a decision.\n\nDid you think the ${prey.toLowerCase()} had a chance? 👇\n\nFollow for high-retention wildlife cinema. 🎬`,
  "Defender stands ground": (predator, prey, env) =>
    `In the ${env}, every instinct said move. This ${predator.toLowerCase()} did the opposite. 🦬\n\nWhen the ${prey.toLowerCase()} kept pressing forward, the encounter changed completely. It stopped feeling like fear and started feeling like dominance.\n\nDid you expect it to hold position? 👇\n\nFollow for wildlife that breaks expectations. 🔥`,
  "Giant vs giant clash": (predator, prey, env) =>
    `Two huge animals met in the ${env}, and neither wanted to give space. 🔥\n\nA ${predator.toLowerCase()} and a ${prey.toLowerCase()} create a different kind of tension — slower, heavier, and much more violent the second contact happens.\n\nWho do you think controls the moment first? 👇\n\nFollow for giant-animal clashes that feel cinematic. 🌍`,
  "Territory dominance battle": (predator, prey, env) =>
    `In the ${env}, territory is never symbolic. 👀\n\nThe ${prey.toLowerCase()} stepped into the wrong space, and the ${predator.toLowerCase()} answered immediately. In the wild, boundaries are enforced, not discussed.\n\nWould you have backed off earlier? 👇\n\nFollow for raw dominance moments in nature. 🔥`,
  "Pack hunting strategy": (predator, prey, env) =>
    `At first, the ${prey.toLowerCase()} looked free. Then the trap became visible. 🧠\n\nIn the ${env}, the ${predator.toLowerCase()} pack is dangerous because every movement feels coordinated before the prey fully reads the pattern.\n\nDid you notice the setup before the pressure closed in? 👇\n\nFollow for smart wildlife sequences, not just loud ones. 🎬`,
  "Predator vs predator fight": (predator, prey, env) =>
    `Two apex predators. One territory. No safe outcome. 💥\n\nA ${predator.toLowerCase()} facing a ${prey.toLowerCase()} in the ${env} feels intense because both animals understand the cost of a bad decision. These moments escalate fast.\n\nWhich animal did you trust more here? 👇\n\nFollow for rare predator-vs-predator tension. 🔥`,
  "Escape from danger": (predator, prey, env) =>
  `Everything changed in under a second in the ${env}. ⚡\n\nThe ${prey.toLowerCase()} had almost no time to react before the ${predator.toLowerCase()} moved.`
};

// ─────────────────────────────────────────────────────────────
// 5. CTAs
// ─────────────────────────────────────────────────────────────
const VIRAL_CTAS: Partial<Record<Arc, string>> = {
  "Defender stands ground":
    "Did you expect that outcome? Drop your reaction below 👇 Follow for daily wildlife that breaks expectations.",
  "Giant vs giant clash":
    "Who won? Comment your pick below 👇 Follow for the wildest clashes on the internet.",
  "Territory dominance battle":
    "Would you have run? Comment below 👇 Follow for raw nature content every day.",
};

// ─────────────────────────────────────────────────────────────
// 6. HASHTAGS
// ─────────────────────────────────────────────────────────────
const USA_HASHTAGS: Partial<Record<Arc, string>> = {
  "Defender stands ground":
    "#wildlife #viral #nature #yellowstone #wildlifeencounter #unexpected #animalbattle #naturaldocumentary #wildanimals #viralreels",
  "Giant vs giant clash":
    "#wildlife #viral #nature #animalbattle #giantanimals #wildfight #naturaldocumentary #viralvideo #wildanimals #shocking",
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
// PUBLIC BUILDER FUNCTIONS
// ─────────────────────────────────────────────────────────────

/** Legacy single hook — used in buildPackage routingNote and clip chaining */
export function buildHook(predator: string, prey: string, arc: Arc): string {
  const raw =
    VIRAL_HOOKS[arc]?.(predator, prey) ??
    `${predator} vs ${prey} — one wrong move changes everything.`;

  return raw.length > 72 ? `${raw.slice(0, 69)}...` : raw;
}

/** 3-variant 2026 hooks for A/B testing. Max 78 chars each. */
export function build2026Hook(predator: string, prey: string, arc: Arc): string[] {
  const hooks =
    HOOKS_2026[arc]?.(predator, prey) ?? [
      `${predator} vs ${prey} — one wrong move changes everything. 🔥`,
      `Nature gives almost no warning. 👀`,
      `This moment turned in less than a second. ⚡`,
    ];

  return hooks.map((hook) => (hook.length > 78 ? `${hook.slice(0, 75)}...` : hook));
}

/** Legacy caption — trimmed to 220 chars */
export function buildCaption(predator: string, prey: string, env: string, arc: Arc): string {
  const raw =
    VIRAL_CAPTIONS[arc]?.(predator, prey, env) ??
    `${predator} and ${prey} collide in the ${env}, and the mood changes instantly. This ${arc.toLowerCase()} sequence feels tense, physical, and completely unforgiving from the first movement.`;

  return raw.length > 220 ? `${raw.slice(0, 217)}...` : raw;
}

/** 2026 story caption — full 5-part structure, no trimming */
export function build2026Caption(predator: string, prey: string, env: string, arc: Arc): string {
  return (
    CAPTIONS_2026[arc]?.(predator, prey, env) ??
    `${predator} and ${prey} collide in the ${env}. The moment feels immediate, physical, and unforgiving from the first move.\n\nWhich part of the sequence hit hardest for you? 👇\n\nFollow for daily wildlife cinema. 🔥`
  );
}

/** CTA line — arc-specific or generic fallback */
export function buildCTA(arc: Arc): string {
  return (
    VIRAL_CTAS[arc] ??
    `Who wins this battle? Comment your guess 👇 Follow for daily wildlife cinema.`
  );
}

/** Hashtag string — arc-specific base + animal names appended */
export function buildHashtags(predator: string, prey: string, arc: Arc): string {
  const base =
    USA_HASHTAGS[arc] ??
    `#wildlife #nature #animalbattle #wildlifedocumentary #viralreels #naturelovers`;

  return `${base} #${predator.toLowerCase().replace(/\s+/g, "")} #${prey.toLowerCase().replace(/\s+/g, "")}`;
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
  const hooks = build2026Hook(predator, prey, arc);
  const caption = build2026Caption(predator, prey, env, arc);

  const facebook: FacebookPack = {
    hook: hooks[0],
    caption,
    hashtags: `#Wildlife #${predator.replace(/\s+/g, "")} #NatureDocumentary #AnimalBehavior #Reels #OriginalContent`,
    bestTime: "Test weekday 8–10 AM ET and 12–3 PM ET first, then refine with Facebook Insights.",
    cmpNote:
      "Facebook Content Monetization beta is invite-only. Eligible formats include reels, photos, stories, and text posts. Meta prioritizes original content.",
    strategyNote:
      "Use the Page Featured section to pin your strongest welcome reel or conversion asset.",
  };

  const instagram: InstagramPack = {
    hook: hooks[1],
    caption: `${hooks[1]}\n\n${caption.split("\n\n")[0]}\n\nFollow for daily wildlife cinema.`,
    hashtags: `#wildlife #nature #animalbehavior #reels #documentary #${predator.toLowerCase().replace(/\s+/g, "")}`,
    bestTime: "Test afternoon and evening windows, then optimize from account Insights.",
    strategyNote: "Keep the first line punchy and let the visual do most of the work.",
  };

  const tiktok: TikTokPack = {
    hook: hooks[2],
    caption: `${hooks[2]} Follow for more wildlife cinema.`,
    hashtags: `#wildlife #animals #nature #fyp #documentary #${predator.toLowerCase().replace(/\s+/g, "")}`,
    bestTime: "Test late afternoon to evening and refine using retention, not only views.",
    strategyNote: "Use larger caption beats and slightly faster editing language than Facebook.",
  };

  const youtube_shorts: YouTubeShortsPack = {
    title: `${predator} vs ${prey} — ${arc} | Wild Stories TV`,
    description: `${caption}\n\nSubscribe for more wildlife cinema.`,
    tags: `wildlife, ${predator.toLowerCase()}, ${prey.toLowerCase()}, ${arc.toLowerCase()}, nature documentary, animal behavior, ai wildlife`,
    bestTime: "Keep a consistent cadence and judge by retention plus returning viewers.",
    strategyNote: "Write a searchable title and make the first description sentence descriptive.",
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
  return `AI-generated cinematic wildlife scene showing ${predator} and ${prey} in ${env} during a ${arc.toLowerCase()} sequence. Wild Stories TV original content.`;
}