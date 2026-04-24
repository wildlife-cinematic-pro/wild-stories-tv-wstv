import type { Arc } from "@/types";

import { buildContentLaneHooks } from "@/lib/content-lanes";

import {
  finalizeHookCopy,
  HOOK_FAMILY_ORDER,
  type HookBuildOptions,
  type HookFamilySupport,
} from "@/lib/platform-packs/shared";

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

const VIRAL_CTAS: Partial<Record<Arc, string>> = {
  "Ambush attack": "Which second gave the ambush away?",
  "Chase and takedown": "Which turn mattered most?",
  "Defender stands ground": "What told you the stand would hold?",
  "Giant vs giant clash": "Which body shift made contact feel inevitable?",
  "Territory dominance battle": "Would you have noticed the claim earlier?",
  "Pack hunting strategy": "Which angle closed the escape first?",
  "Predator vs predator fight": "Which animal gave up position first?",
  "Escape from danger": "Would you have spotted the danger in time?",
};

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

export function buildHook(predator: string, prey: string, arc: Arc): string {
  const raw =
    VIRAL_HOOKS[arc]?.(predator, prey) ??
    `${predator} vs ${prey} — one wrong move changes everything.`;

  return finalizeHookCopy(raw);
}

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

export function buildCTA(arc: Arc): string {
  return VIRAL_CTAS[arc] ?? "What moment changed the outcome for you?";
}
