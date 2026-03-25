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
const VIRAL_HOOKS: Partial<Record<Arc, (p: string, r: string) => string>> = {
  "Ambush attack":              (p, r) => `The ${r.toLowerCase()} noticed the ${p.toLowerCase()} too late. ⚠️`,
  "Chase and takedown":         (p, r) => `Once the ${p.toLowerCase()} locked in, the ${r.toLowerCase()} had seconds. ⚡`,
  "Defender stands ground":     (p, r) => `Nobody expected this ${p.toLowerCase()} to hold its ground. 🦬`,
  "Giant vs giant clash":       (p, r) => `${p} vs ${r} — two giants, one brutal moment. 🔥`,
  "Territory dominance battle": (p, r) => `The ${r.toLowerCase()} crossed the wrong boundary. 👀`,
  "Pack hunting strategy":      (p, r) => `The ${r.toLowerCase()} was already surrounded. It just didn't know it yet. 🧠`,
  "Predator vs predator fight": (p, r) => `Two apex predators. One territory. No room to back down. 💥`,
  "Escape from danger":         (p, r) => `This ${r.toLowerCase()} had less than a second to react. ⚡`,
};

// ─────────────────────────────────────────────────────────────
// 2. 2026 HOOKS  (3 variants per arc — A/B/C test ready)
// Research: First 3 seconds = scroll stopper [OpusClip Feb 2026]
// Research: First 1-2 hours = 80% viral potential [Shortimize 2025]
// ─────────────────────────────────────────────────────────────
const HOOKS_2026: Partial<Record<Arc, (p: string, r: string) => string[]>> = {
  "Ambush attack": (p, r) => [
    `The ${r.toLowerCase()} looked the wrong way for one second. ⚠️`,
    `The ${p.toLowerCase()} was already in range before the ${r.toLowerCase()} moved. 👀`,
    `One silent step changed everything for this ${r.toLowerCase()}. 🔥`,
  ],
  "Chase and takedown": (p, r) => [
    `Once the ${p.toLowerCase()} started running, the ${r.toLowerCase()} was in trouble. ⚡`,
    `The ${r.toLowerCase()} reacted fast — just not fast enough. 😳`,
    `This chase was decided the moment the ${p.toLowerCase()} locked in. 🎬`,
  ],
  "Defender stands ground": (p, r) => [
    `Nobody expected this ${p.toLowerCase()} to stand its ground. 🦬`,
    `The ${r.toLowerCase()} thought this ${p.toLowerCase()} would run. It didn't. 🔥`,
    `One refusal to move changed the entire encounter. 👀`,
  ],
  "Giant vs giant clash": (p, r) => [
    `${p} vs ${r} — two giants, zero mercy. 🔥`,
    `When two giants meet, size stops mattering and timing decides everything. 👁️`,
    `This is the kind of clash wildlife crews wait years to capture. 🎬`,
  ],
  "Territory dominance battle": (p, r) => [
    `The ${r.toLowerCase()} crossed the wrong boundary. ⚠️`,
    `This is ${p}'s territory — and the ${r.toLowerCase()} felt it instantly. 🔥`,
    `One step too far, and the whole mood changed. 👀`,
  ],
  "Pack hunting strategy": (p, r) => [
    `The ${r.toLowerCase()} was already surrounded. It just didn't know it yet. 🧠`,
    `This is why ${p.toLowerCase()}s don't hunt alone. 🐺`,
    `One signal — then the whole trap closed. ⚡`,
  ],
  "Predator vs predator fight": (p, r) => [
    `Two apex predators. One territory. No backing down. 💥`,
    `${p} vs ${r} — the kind of encounter that turns instantly violent. 🔥`,
    `When predators meet like this, one mistake is all it takes. 👀`,
  ],
  "Escape from danger": (p, r) => [
    `This ${r.toLowerCase()} had less than a second to react. ⚡`,
    `The ${p.toLowerCase()} was already moving before the ${r.toLowerCase()} understood the danger. 👁️`,
    `Survival came down to one decision and almost no time. 😳`,
  ],
};

// ─────────────────────────────────────────────────────────────
// 3. VIRAL CAPTIONS  (legacy — one caption per arc)
// ─────────────────────────────────────────────────────────────
const VIRAL_CAPTIONS: Partial<Record<Arc, (p: string, r: string, env: string) => string>> = {
  "Ambush attack": (p, r, env) =>
    `Deep in the ${env}, the ${r.toLowerCase()} looked safe for one second too long. The ${p.toLowerCase()} had already closed the distance — and from that instant, survival turned into pure reaction. Nature rarely gives a warning. ⚠️`,
  "Chase and takedown": (p, r, env) =>
    `Across the ${env}, the ${p.toLowerCase()} committed fully and the ${r.toLowerCase()} had only seconds to respond. What makes this moment powerful is not just the speed — it is the instant when the outcome starts to shift. ⚡`,
  "Defender stands ground": (p, r, env) =>
    `In the ${env}, every instinct said move. This ${p.toLowerCase()} did the opposite. When the ${r.toLowerCase()} kept pressing forward, the encounter stopped feeling like a chase and started feeling like a statement. 🦬`,
  "Giant vs giant clash": (p, r, env) =>
    `Two massive animals met in the ${env}, and neither wanted to yield space. A ${p.toLowerCase()} and a ${r.toLowerCase()} bring a different kind of tension — slower, heavier, and much more violent once contact happens. 🔥`,
  "Territory dominance battle": (p, r, env) =>
    `In the ${env}, the line between passing through and crossing the wrong boundary is tiny. The ${r.toLowerCase()} stepped in anyway, and the ${p.toLowerCase()} answered immediately. Territory in the wild is never symbolic — it is enforced. 👀`,
  "Pack hunting strategy": (p, r, env) =>
    `At first, the ${r.toLowerCase()} looked free. Then the shape of the trap became clear. In the ${env}, the ${p.toLowerCase()} pack is dangerous not because of chaos, but because every movement feels coordinated before the prey even realizes it. 🧠`,
  "Predator vs predator fight": (p, r, env) =>
    `A ${p.toLowerCase()} and a ${r.toLowerCase()} in the ${env} creates a different kind of pressure — no easy retreat, no harmless bluff, and almost no margin for error. These confrontations feel rare because both animals understand the cost. 💥`,
  "Escape from danger": (p, r, env) =>
    `Everything in the ${env} changed in an instant. The ${r.toLowerCase()} had almost no time to process the danger before the ${p.toLowerCase()} was already moving. In moments like this, survival comes down to one decision made fast enough. ⚡`,
};

// ─────────────────────────────────────────────────────────────
// 4. 2026 STORY CAPTION  (5-part structure per arc)
// Research: Storytelling + emotion + CTA = viral formula
// Research: Medium-length posts 80-150 chars = best engagement
// ─────────────────────────────────────────────────────────────
const CAPTIONS_2026: Partial<Record<Arc, (p: string, r: string, env: string) => string>> = {
  "Ambush attack": (p, r, env) =>
    `In the ${env}, the warning came too late. ⚠️\n\nThe ${r.toLowerCase()} looked safe for a moment, but the ${p.toLowerCase()} had already closed the distance. That is what makes ambushes feel so brutal — the danger is real before the prey fully understands it.\n\nAt what second did you realize the turn was coming? 👇\n\nFollow for wildlife moments with real tension. 🔥`,
  "Chase and takedown": (p, r, env) =>
    `Across the ${env}, this became a pure speed test. ⚡\n\nThe ${p.toLowerCase()} committed fully, and the ${r.toLowerCase()} had only a tiny window to react. The wild is full of movement, but moments like this show how quickly one chase can become a decision.\n\nDid you think the ${r.toLowerCase()} had a chance? 👇\n\nFollow for high-retention wildlife cinema. 🎬`,
  "Defender stands ground": (p, r, env) =>
    `In the ${env}, every instinct said move. This ${p.toLowerCase()} did the opposite. 🦬\n\nWhen the ${r.toLowerCase()} kept pressing forward, the encounter changed completely. It stopped feeling like fear and started feeling like dominance.\n\nDid you expect it to hold position? 👇\n\nFollow for wildlife that breaks expectations. 🔥`,
  "Giant vs giant clash": (p, r, env) =>
    `Two huge animals met in the ${env}, and neither wanted to give space. 🔥\n\nA ${p.toLowerCase()} and a ${r.toLowerCase()} create a different kind of tension — slower, heavier, and much more violent the second contact happens.\n\nWho do you think controls the moment first? 👇\n\nFollow for giant-animal clashes that feel cinematic. 🌍`,
  "Territory dominance battle": (p, r, env) =>
    `In the ${env}, territory is never symbolic. 👀\n\nThe ${r.toLowerCase()} stepped into the wrong space, and the ${p.toLowerCase()} answered immediately. In the wild, boundaries are enforced, not discussed.\n\nWould you have backed off earlier? 👇\n\nFollow for raw dominance moments in nature. 🔥`,
  "Pack hunting strategy": (p, r, env) =>
    `At first, the ${r.toLowerCase()} looked free. Then the trap became visible. 🧠\n\nIn the ${env}, the ${p.toLowerCase()} pack is dangerous because every movement feels coordinated before the prey fully reads the pattern.\n\nDid you notice the setup before the pressure closed in? 👇\n\nFollow for smart wildlife sequences, not just loud ones. 🎬`,
  "Predator vs predator fight": (p, r, env) =>
    `Two apex predators. One territory. No safe outcome. 💥\n\nA ${p.toLowerCase()} facing a ${r.toLowerCase()} in the ${env} feels intense because both animals understand the cost of a bad decision. These moments escalate fast.\n\nWhich animal did you trust more here? 👇\n\nFollow for rare predator-vs-predator tension. 🔥`,
  "Escape from danger": (p, r, env) =>
    `Everything changed in under a second. ⚡\n\nThe ${r.toLowerCase()} had almost no time to process the danger before the ${p.toLowerCase()} was already moving. Survival at this level is less about power and more about one correct reaction.\n\nDid you think it escaped in time? 👇\n\nFollow for wildlife moments that hit instantly. 🎬`,
};

// ─────────────────────────────────────────────────────────────
// 5. CTAs
// ─────────────────────────────────────────────────────────────
const VIRAL_CTAS: Partial<Record<Arc, string>> = {
  "Defender stands ground":     "Did you expect that outcome? Drop your reaction below 👇 Follow for daily wildlife that breaks expectations.",
  "Giant vs giant clash":       "Who won? Comment your pick below 👇 Follow for the wildest clashes on the internet.",
  "Territory dominance battle": "Would you have run? Comment below 👇 Follow for raw nature content every day.",
};

// ─────────────────────────────────────────────────────────────
// 6. HASHTAGS
// ─────────────────────────────────────────────────────────────
const USA_HASHTAGS: Partial<Record<Arc, string>> = {
  "Defender stands ground": "#wildlife #viral #nature #yellowstone #wildlifeencounter #unexpected #animalbattle #naturaldocumentary #wildanimals #viralreels",
  "Giant vs giant clash":   "#wildlife #viral #nature #animalbattle #giantanimals #wildfight #naturaldocumentary #viralvideo #wildanimals #shocking",
};

// ─────────────────────────────────────────────────────────────
// 7. RECOMMENDED HOOK INDEX
// Which of the 3 hook variants to highlight by default per arc.
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
export function buildHook(p: string, r: string, arc: Arc): string {
  const raw =
    VIRAL_HOOKS[arc]?.(p, r) ??
    `${p} vs ${r} — one wrong move changes everything.`;
  return raw.length > 72 ? `${raw.slice(0, 69)}...` : raw;
}

/** 3-variant 2026 hooks for A/B testing. Max 78 chars each. */
export function build2026Hook(p: string, r: string, arc: Arc): string[] {
  const hooks =
    HOOKS_2026[arc]?.(p, r) ?? [
      `${p} vs ${r} — one wrong move changes everything. 🔥`,
      `Nature gives almost no warning. 👀`,
      `This moment turned in less than a second. ⚡`,
    ];
  return hooks.map((h) => (h.length > 78 ? `${h.slice(0, 75)}...` : h));
}

/** Legacy caption — trimmed to 220 chars */
export function buildCaption(p: string, r: string, env: string, arc: Arc): string {
  const raw =
    VIRAL_CAPTIONS[arc]?.(p, r, env) ??
    `${p} and ${r} collide in the ${env}, and the mood changes instantly. This ${arc.toLowerCase()} sequence feels tense, physical, and completely unforgiving from the first movement.`;
  return raw.length > 220 ? `${raw.slice(0, 217)}...` : raw;
}

/** 2026 story caption — full 5-part structure, no trimming */
export function build2026Caption(p: string, r: string, env: string, arc: Arc): string {
  return (
    CAPTIONS_2026[arc]?.(p, r, env) ??
    `${p} and ${r} collide in the ${env}. The moment feels immediate, physical, and unforgiving from the first move.\n\nWhich part of the sequence hit hardest for you? 👇\n\nFollow for daily wildlife cinema. 🔥`
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
export function buildHashtags(p: string, r: string, arc: Arc): string {
  const base =
    USA_HASHTAGS[arc] ??
    `#wildlife #nature #animalbattle #wildlifedocumentary #viralreels #naturelovers`;
  return `${base} #${p.toLowerCase().replace(/\s+/g, "")} #${r.toLowerCase().replace(/\s+/g, "")}`;
}

// ─────────────────────────────────────────────────────────────
// PLATFORM PACK  (main export — used in buildPackage)
//
// Assembles all 4 platform outputs in one call.
// Used in buildPackage() → stored in pkg.platformPack
// Rendered by PlatformPackPanel component.
//
// CMP NOTE [Official — Meta]:
//   Facebook Content Monetization beta is invite-only.
//   Eligible formats: reels, photos, stories, text posts.
//   Meta prioritizes original content.
//   Check Professional Dashboard for access and policy status.
// ─────────────────────────────────────────────────────────────
export function buildPlatformPack(
  p: string,
  r: string,
  arc: Arc,
  env: string
): PlatformPack {
  const hooks   = build2026Hook(p, r, arc);
  const caption = build2026Caption(p, r, env, arc);

  const facebook: FacebookPack = {
    hook:    hooks[0],
    caption: caption,
    hashtags: `#Wildlife #${p.replace(/\s+/g, "")} #NatureDocumentary #AnimalBehavior #Reels #OriginalContent`,
    bestTime: "Test weekday 8–10 AM ET and 12–3 PM ET first, then refine with Facebook Insights.",
    cmpNote:  "Facebook Content Monetization beta is invite-only. Eligible formats include reels, photos, stories, and text posts. Meta prioritizes original content.",
    strategyNote: "Use the Page Featured section to pin your strongest welcome reel or conversion asset.",
  };

  const instagram: InstagramPack = {
    hook:    hooks[1],
    caption: `${hooks[1]}\n\n${caption.split("\n\n")[0]}\n\nFollow for daily wildlife cinema.`,
    hashtags: `#wildlife #nature #animalbehavior #reels #documentary #${p.toLowerCase().replace(/\s+/g, "")}`,
    bestTime: "Test afternoon and evening windows, then optimize from account Insights.",
    strategyNote: "Keep the first line punchy and let the visual do most of the work.",
  };

  const tiktok: TikTokPack = {
    hook:    hooks[2],
    caption: `${hooks[2]} Follow for more wildlife cinema.`,
    hashtags: `#wildlife #animals #nature #fyp #documentary #${p.toLowerCase().replace(/\s+/g, "")}`,
    bestTime: "Test late afternoon to evening and refine using retention, not only views.",
    strategyNote: "Use larger caption beats and slightly faster editing language than Facebook.",
  };

  const youtube_shorts: YouTubeShortsPack = {
    title:       `${p} vs ${r} — ${arc} | Wild Stories TV`,
    description: `${caption}\n\nSubscribe for more wildlife cinema.`,
    tags:        `wildlife, ${p.toLowerCase()}, ${r.toLowerCase()}, ${arc.toLowerCase()}, nature documentary, animal behavior, ai wildlife`,
    bestTime:    "Keep a consistent cadence and judge by retention plus returning viewers.",
    strategyNote: "Write a searchable title and make the first description sentence descriptive.",
  };

  return { facebook, instagram, tiktok, youtube_shorts };
}

// ─────────────────────────────────────────────────────────────
// SEO TITLE  (for YouTube Shorts and page metadata)
// ─────────────────────────────────────────────────────────────
export function buildSEOTitle(p: string, r: string, arc: Arc): string {
  return `${p} vs ${r} — ${arc} | Wild Stories TV`;
}

// ─────────────────────────────────────────────────────────────
// ALT TEXT PROMPT  (for accessibility and image metadata)
// ─────────────────────────────────────────────────────────────
export function buildAltTextPrompt(p: string, r: string, env: string, arc: Arc): string {
  return `AI-generated cinematic wildlife scene showing ${p} and ${r} in ${env} during a ${arc.toLowerCase()} sequence. Wild Stories TV original content.`;
}
