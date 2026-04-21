import type { Arc, ContentLane, HabitatPreset, HookFamily } from "@/types";

type LaneCopyBuilder = (predator: string, prey: string) => string;

type ContentLaneConfig = {
  preferredArcs: Arc[];
  nearbyArcs: Arc[];
  preferredHabitats: HabitatPreset[];
  preferredHookFamily: HookFamily;
  laneTag: string;
  predatorKeywords: string[];
  preyKeywords: string[];
  habitatKeywords: string[];
  habitatClause: string;
  hooks: [LaneCopyBuilder, LaneCopyBuilder, LaneCopyBuilder];
  shortLead: LaneCopyBuilder;
  longLead: LaneCopyBuilder;
};

const predatorOnly = (builder: (predator: string) => string): LaneCopyBuilder =>
  (predator, prey) => {
    void prey;
    return builder(predator);
  };

const preyOnly = (builder: (prey: string) => string): LaneCopyBuilder =>
  (predator, prey) => {
    void predator;
    return builder(prey);
  };

const constantLaneCopy = (builder: () => string): LaneCopyBuilder =>
  (predator, prey) => {
    void predator;
    void prey;
    return builder();
  };

export const contentLaneOptions: ContentLane[] = [
  "Auto",
  "Pack Hunt",
  "Defender",
  "Fishing Strike",
  "Rut Battle",
  "Escape",
];

const CONTENT_LANE_CONFIG: Record<Exclude<ContentLane, "Auto">, ContentLaneConfig> = {
  "Pack Hunt": {
    preferredArcs: ["Pack hunting strategy"],
    nearbyArcs: ["Pack hunting strategy", "Chase and takedown", "Escape from danger"],
    preferredHabitats: [
      "Open Prairie Grassland",
      "Rocky Mountain Meadow",
      "Forest Clearing",
    ],
    preferredHookFamily: "danger",
    laneTag: "#packhunt",
    predatorKeywords: ["wolf pack", "wolf", "african wild dog", "orca", "dolphin", "chimpanzee"],
    preyKeywords: [
      "bull elk",
      "elk",
      "bison",
      "moose",
      "deer",
      "antelope",
      "gazelle",
      "buffalo",
      "wildebeest",
    ],
    habitatKeywords: ["pack angle", "open break", "closing angle", "pursuit shape"],
    habitatClause: "with open-country angle control and clean pack spacing",
    hooks: [
      preyOnly(
        (prey) =>
          `The ${prey.toLowerCase()} still had daylight, but the pack had already split the escape path.`
      ),
      constantLaneCopy(
        () => "The pursuit stopped feeling like speed once the angles started working together."
      ),
      constantLaneCopy(
        () => "Open country became a narrowing trap as the pack widened the chase."
      ),
    ],
    shortLead: constantLaneCopy(() => "The pack shape forms before contact."),
    longLead: constantLaneCopy(
      () =>
        "The pack shape forms before contact, with the chase already narrowing from both sides."
    ),
  },
  Defender: {
    preferredArcs: ["Defender stands ground"],
    nearbyArcs: [
      "Defender stands ground",
      "Territory dominance battle",
      "Giant vs giant clash",
    ],
    preferredHabitats: [
      "Forest Clearing",
      "Open Prairie Grassland",
      "Rocky Mountain Meadow",
    ],
    preferredHookFamily: "reversal",
    laneTag: "#defender",
    predatorKeywords: [
      "bison",
      "moose",
      "bull elk",
      "elk",
      "musk ox",
      "cape buffalo",
      "beaver",
      "skunk",
      "wild boar",
    ],
    preyKeywords: [
      "bison",
      "moose",
      "bull elk",
      "elk",
      "musk ox",
      "cape buffalo",
      "wild boar",
    ],
    habitatKeywords: ["hold your ground", "grounded footing", "defender", "stand ground"],
    habitatClause: "with grounded footing and clear hold-your-ground spacing",
    hooks: [
      predatorOnly(
        (predator) =>
          `The ${predator.toLowerCase()} refused to yield, and the warning step stopped the push.`
      ),
      constantLaneCopy(
        () => "The bluff was visible before the challenger committed."
      ),
      constantLaneCopy(
        () => "A forward rush met a planted stance instead of open space."
      ),
    ],
    shortLead: constantLaneCopy(() => "The planted stance changes the sequence."),
    longLead: constantLaneCopy(
      () =>
        "The planted stance changes the sequence because the warning step appears before the push peaks."
    ),
  },
  "Fishing Strike": {
    preferredArcs: ["Ambush attack", "Chase and takedown"],
    nearbyArcs: ["Ambush attack", "Chase and takedown", "Escape from danger"],
    preferredHabitats: [
      "Riverbank Reeds",
      "Everglades Marsh",
      "Cypress Swamp Edge",
      "Coastal Cliffline",
    ],
    preferredHookFamily: "danger",
    laneTag: "#fishingstrike",
    predatorKeywords: [
      "bald eagle",
      "eagle",
      "grizzly bear",
      "bear",
      "alligator",
      "crocodile",
      "jaguar",
      "river otter",
      "dolphin",
      "orca",
      "shark",
      "polar bear",
    ],
    preyKeywords: [
      "salmon",
      "trout",
      "fish",
      "mackerel",
      "sardines",
      "seal",
      "duck",
      "crayfish",
      "frog",
    ],
    habitatKeywords: ["waterline", "shoreline", "river", "shallows", "strike window"],
    habitatClause: "with clean strike windows and open waterline separation",
    hooks: [
      preyOnly(
        (prey) =>
          `The strike window closed at the waterline before the ${prey.toLowerCase()} could turn.`
      ),
      constantLaneCopy(
        () => "The shallow-bank scene looked calm until the timing snapped shut."
      ),
      constantLaneCopy(
        () => "One surface break turned a quiet frame into a clean strike."
      ),
    ],
    shortLead: constantLaneCopy(() => "The strike window closes at the waterline."),
    longLead: constantLaneCopy(
      () => "The strike window closes at the waterline before the frame has time to settle."
    ),
  },
  "Rut Battle": {
    preferredArcs: ["Territory dominance battle", "Giant vs giant clash"],
    nearbyArcs: [
      "Territory dominance battle",
      "Giant vs giant clash",
      "Defender stands ground",
    ],
    preferredHabitats: [
      "Rocky Mountain Meadow",
      "Open Prairie Grassland",
      "Dry Prairie Plain",
      "Snow Field Tundra",
    ],
    preferredHookFamily: "curiosity",
    laneTag: "#rutbattle",
    predatorKeywords: [
      "bull elk",
      "elk",
      "bison",
      "moose",
      "musk ox",
      "cape buffalo",
      "wild boar",
    ],
    preyKeywords: [
      "bull elk",
      "elk",
      "bison",
      "moose",
      "musk ox",
      "cape buffalo",
      "wild boar",
    ],
    habitatKeywords: ["antler clash", "open footing", "dominance", "rut", "shoulder line"],
    habitatClause: "with open footing, antler room, and clear rut-season standoff spacing",
    hooks: [
      constantLaneCopy(
        () => "The antler line told the story before contact landed."
      ),
      constantLaneCopy(
        () => "The territorial claim showed in the shoulders before the crash."
      ),
      constantLaneCopy(
        () => "A balanced standoff turned heavy once the footing shifted."
      ),
    ],
    shortLead: constantLaneCopy(() => "The rut-season claim is visible before contact."),
    longLead: constantLaneCopy(
      () =>
        "The rut-season claim is visible before contact because the shoulder line and footing are already set."
    ),
  },
  Escape: {
    preferredArcs: ["Escape from danger"],
    nearbyArcs: ["Escape from danger", "Ambush attack", "Chase and takedown"],
    preferredHabitats: [
      "Open Prairie Grassland",
      "Forest Clearing",
      "Rocky Mountain Meadow",
    ],
    preferredHookFamily: "danger",
    laneTag: "#escape",
    predatorKeywords: ["coyote", "wolf", "mountain lion", "cougar", "puma", "bobcat"],
    preyKeywords: [
      "deer",
      "rabbit",
      "antelope",
      "gazelle",
      "goat",
      "fox",
      "calf",
      "opossum",
      "pheasant",
    ],
    habitatKeywords: ["breakaway", "survival", "field transition", "open gap"],
    habitatClause: "with clear breakaway gaps and survival spacing",
    hooks: [
      preyOnly((prey) => `The ${prey.toLowerCase()} found one narrow breakaway window.`),
      constantLaneCopy(
        () => "The near miss became clear before the chase fully closed."
      ),
      constantLaneCopy(() => "A finished-looking moment reopened for one survival move."),
    ],
    shortLead: constantLaneCopy(() => "The breakaway window is smaller than it looks."),
    longLead: constantLaneCopy(
      () =>
        "The breakaway window is smaller than it looks, and the survival move has to happen before the chase fully closes."
    ),
  },
};

function normalizeText(value: string): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesKeyword(value: string, keywords: string[]): boolean {
  const normalized = normalizeText(value);
  return keywords.some((keyword) => normalized.includes(keyword));
}

function getContentLaneConfig(contentLane: ContentLane): ContentLaneConfig | null {
  return contentLane === "Auto" ? null : CONTENT_LANE_CONFIG[contentLane];
}

function isRutBattleSpeciesPair(predator: string, prey: string): boolean {
  const rutSpecies = [
    "bull elk",
    "elk",
    "bison",
    "moose",
    "musk ox",
    "cape buffalo",
    "wild boar",
  ];
  const predatorText = normalizeText(predator);
  const preyText = normalizeText(prey);
  const predatorMatch = rutSpecies.some((species) => predatorText.includes(species));
  const preyMatch = rutSpecies.some((species) => preyText.includes(species));

  return predatorMatch && preyMatch;
}

export function isContentLane(value: string): value is ContentLane {
  return (contentLaneOptions as readonly string[]).includes(value);
}

export function getPreferredArcsForContentLane(contentLane: ContentLane): Arc[] {
  return getContentLaneConfig(contentLane)?.preferredArcs ?? [];
}

export function getNearbyArcsForContentLane(contentLane: ContentLane): Arc[] {
  return getContentLaneConfig(contentLane)?.nearbyArcs ?? [];
}

export function getPreferredHabitatsForContentLane(
  contentLane: ContentLane
): HabitatPreset[] {
  return getContentLaneConfig(contentLane)?.preferredHabitats ?? [];
}

export function getPreferredHookFamilyForContentLane(
  contentLane: ContentLane
): HookFamily | null {
  return getContentLaneConfig(contentLane)?.preferredHookFamily ?? null;
}

export function rankPreyOptionsForContentLane(
  contentLane: ContentLane,
  _predator: string,
  preyOptions: string[]
): string[] {
  const config = getContentLaneConfig(contentLane);
  if (!config) return preyOptions;

  const scored = preyOptions.map((option, index) => {
    const score = config.preyKeywords.reduce(
      (total, keyword) => total + (normalizeText(option).includes(keyword) ? 1 : 0),
      0
    );

    return { option, index, score };
  });

  const bestScore = Math.max(...scored.map((item) => item.score), 0);
  if (bestScore <= 0) return preyOptions;

  return [...scored]
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.index - right.index;
    })
    .map((item) => item.option);
}

export function isContentLaneCompatible(
  contentLane: ContentLane,
  predator: string,
  prey: string,
  arc?: Arc
): boolean {
  const config = getContentLaneConfig(contentLane);
  if (!config) return false;

  const predatorMatch = includesKeyword(predator, config.predatorKeywords);
  const preyMatch = includesKeyword(prey, config.preyKeywords);
  const arcMatch = arc ? config.preferredArcs.includes(arc) : false;

  switch (contentLane) {
    case "Pack Hunt":
      return predatorMatch || arcMatch;
    case "Fishing Strike":
      return predatorMatch || preyMatch || arcMatch;
    case "Rut Battle":
      return isRutBattleSpeciesPair(predator, prey);
    case "Defender":
      return predatorMatch || preyMatch || arcMatch;
    case "Escape":
      return preyMatch || arcMatch || predatorMatch;
    default:
      return false;
  }
}

export function getLaneBiasedArc(
  contentLane: ContentLane,
  predator: string,
  prey: string,
  suggestedArc: Arc
): Arc {
  const preferredArcs = getPreferredArcsForContentLane(contentLane);
  if (contentLane === "Auto" || preferredArcs.length === 0) return suggestedArc;
  if (preferredArcs.includes(suggestedArc)) return suggestedArc;
  if (!isContentLaneCompatible(contentLane, predator, prey, suggestedArc)) {
    return suggestedArc;
  }

  return preferredArcs[0] ?? suggestedArc;
}

export function applyContentLaneEnvironmentBias(
  contentLane: ContentLane,
  predator: string,
  prey: string,
  environment: string,
  arc?: Arc
): string {
  const config = getContentLaneConfig(contentLane);
  if (!config) return environment;
  if (!isContentLaneCompatible(contentLane, predator, prey, arc)) return environment;

  const normalized = normalizeText(environment);
  if (config.habitatKeywords.some((keyword) => normalized.includes(keyword))) {
    return environment;
  }

  return `${String(environment ?? "").replace(/[.,]\s*$/g, "")} ${config.habitatClause}`;
}

export function buildContentLaneHooks(
  contentLane: ContentLane,
  predator: string,
  prey: string,
  arc?: Arc
): string[] | null {
  const config = getContentLaneConfig(contentLane);
  if (!config) return null;
  if (!isContentLaneCompatible(contentLane, predator, prey, arc)) return null;

  return config.hooks.map((buildHook) => buildHook(predator, prey));
}

export function buildContentLaneShortCaptionLead(
  contentLane: ContentLane,
  predator: string,
  prey: string,
  arc?: Arc
): string | null {
  const config = getContentLaneConfig(contentLane);
  if (!config) return null;
  if (!isContentLaneCompatible(contentLane, predator, prey, arc)) return null;
  return config.shortLead(predator, prey);
}

export function buildContentLaneLongCaptionLead(
  contentLane: ContentLane,
  predator: string,
  prey: string,
  arc?: Arc
): string | null {
  const config = getContentLaneConfig(contentLane);
  if (!config) return null;
  if (!isContentLaneCompatible(contentLane, predator, prey, arc)) return null;
  return config.longLead(predator, prey);
}

export function getContentLaneHashtag(
  contentLane: ContentLane,
  predator: string,
  prey: string,
  arc?: Arc
): string | null {
  const config = getContentLaneConfig(contentLane);
  if (!config) return null;
  if (!isContentLaneCompatible(contentLane, predator, prey, arc)) return null;
  return config.laneTag;
}

export function getUSAudienceLaneBonus(input: {
  contentLane?: ContentLane;
  predator: string;
  prey: string;
  environment: string;
  arc: string;
}): number {
  const contentLane = input.contentLane ?? "Auto";
  const config = getContentLaneConfig(contentLane);
  if (!config) return 0;

  let bonus = 0;
  const arc = input.arc as Arc;

  if (!isContentLaneCompatible(contentLane, input.predator, input.prey, arc)) {
    return 0;
  }

  if (config.preferredArcs.includes(arc)) bonus += 4;
  if (includesKeyword(input.predator, config.predatorKeywords)) bonus += 2;
  if (includesKeyword(input.prey, config.preyKeywords)) bonus += 2;
  if (includesKeyword(input.environment, config.habitatKeywords)) bonus += 2;

  return Math.min(8, bonus);
}

export function scoreContentLaneFit(input: {
  contentLane: ContentLane;
  predator: string;
  prey: string;
  arc: Arc;
  habitat: HabitatPreset;
  hookFamily: HookFamily;
  environment: string;
}): number {
  if (input.contentLane === "Auto") return 84;

  const config = getContentLaneConfig(input.contentLane);
  if (!config) return 84;

  const compatible = isContentLaneCompatible(
    input.contentLane,
    input.predator,
    input.prey,
    input.arc
  );

  if (!compatible) {
    let mismatchScore = 54;
    if (config.nearbyArcs.includes(input.arc)) mismatchScore += 6;
    if (config.preferredHookFamily === input.hookFamily) mismatchScore += 3;
    return Math.min(68, mismatchScore);
  }

  let score = 74;

  if (config.preferredArcs.includes(input.arc)) score += 12;
  else if (config.nearbyArcs.includes(input.arc)) score += 8;

  if (config.preferredHabitats.includes(input.habitat)) score += 8;
  else if (input.habitat === "Auto") score += 5;

  if (config.preferredHookFamily === input.hookFamily) score += 6;
  if (includesKeyword(input.environment, config.habitatKeywords)) score += 6;
  if (includesKeyword(input.predator, config.predatorKeywords)) score += 4;
  if (includesKeyword(input.prey, config.preyKeywords)) score += 4;

  return Math.min(100, score);
}

export function getContentLaneWinnerLabels(contentLane: ContentLane): {
  overall: string;
  fastPublish: string;
  spotlight: string;
  realism: string;
  summary: string;
} {
  switch (contentLane) {
    case "Pack Hunt":
      return {
        overall: "Best pack overall",
        fastPublish: "Best chase geometry",
        spotlight: "Best pack opener",
        realism: "Best grounded pursuit",
        summary:
          "Variants stay inside group pursuit shape, closing angles, and nearby escape beats.",
      };
    case "Defender":
      return {
        overall: "Best defender overall",
        fastPublish: "Best warning step",
        spotlight: "Best defender tension",
        realism: "Best grounded stand",
        summary:
          "Variants stay inside hold-ground tension, warning-step posture, and realistic defender stands.",
      };
    case "Fishing Strike":
      return {
        overall: "Best strike overall",
        fastPublish: "Best fast strike",
        spotlight: "Best fishing opener",
        realism: "Best grounded waterline",
        summary:
          "Variants stay inside waterline timing, shallow strike setups, and realistic takedown beats.",
      };
    case "Rut Battle":
      return {
        overall: "Best rut overall",
        fastPublish: "Best rut escalation",
        spotlight: "Best rut clash",
        realism: "Best grounded rut posture",
        summary:
          "Variants stay inside antler posture, shoulder-line escalation, and rut-season footing.",
      };
    case "Escape":
      return {
        overall: "Best escape overall",
        fastPublish: "Best breakaway burst",
        spotlight: "Best escape payoff",
        realism: "Best grounded survival",
        summary:
          "Variants stay inside near-miss tension, survival spacing, and believable breakaway payoffs.",
      };
    default:
      return {
        overall: "Best overall",
        fastPublish: "Best for fast publish",
        spotlight: "Strongest opening",
        realism: "Best realism",
        summary:
          "Variants explore nearby hook, arc, habitat, and duration shifts before the final package build.",
      };
  }
}
