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
  "Mother Defense",
  "Herd Defense",
  "Giant Standoff",
  "Predator Pressure",
  "Escape Lane",
  "Swamp Ambush",
  "Winter Survival",
  "Territory Clash",
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
  "Mother Defense": {
    preferredArcs: ["Defender stands ground", "Escape from danger"],
    nearbyArcs: ["Defender stands ground", "Escape from danger", "Territory dominance battle"],
    preferredHabitats: ["Forest Clearing", "Rocky Mountain Meadow", "Open Prairie Grassland"],
    preferredHookFamily: "reversal",
    laneTag: "#motherdefense",
    predatorKeywords: ["mother", "grizzly", "bear", "moose", "bison", "elk", "lioness", "wolf"],
    preyKeywords: ["cub", "calf", "fawn", "pup", "kit", "young", "offspring"],
    habitatKeywords: ["shelter", "body line", "protective stance", "close to mother"],
    habitatClause: "with protective mother-and-young spacing and a clear shelter line",
    hooks: [
      predatorOnly((predator) => `The ${predator.toLowerCase()} held the line before the threat could close space.`),
      constantLaneCopy(() => "The protective stance reads before the pressure peaks."),
      constantLaneCopy(() => "One body line kept the young animal sheltered without hiding the scene."),
    ],
    shortLead: constantLaneCopy(() => "The protective body line changes the read."),
    longLead: constantLaneCopy(() => "The protective body line changes the read because the young animal stays visible and sheltered."),
  },
  "Herd Defense": {
    preferredArcs: ["Defender stands ground", "Pack hunting strategy"],
    nearbyArcs: ["Defender stands ground", "Pack hunting strategy", "Giant vs giant clash"],
    preferredHabitats: ["Open Prairie Grassland", "Dry Prairie Plain", "Rocky Mountain Meadow"],
    preferredHookFamily: "reversal",
    laneTag: "#herddefense",
    predatorKeywords: ["bison", "buffalo", "musk ox", "elk", "moose", "herd"],
    preyKeywords: ["wolf", "wolf pack", "coyote", "lion", "hyena", "predator"],
    habitatKeywords: ["herd wall", "defensive ring", "calf shelter", "group spacing"],
    habitatClause: "with herd-wall spacing and a readable defensive ring",
    hooks: [
      constantLaneCopy(() => "The herd shape formed before the pressure reached the center."),
      constantLaneCopy(() => "The defensive ring made the open ground feel smaller."),
      constantLaneCopy(() => "A scattered field turned into a wall before the pack could split it."),
    ],
    shortLead: constantLaneCopy(() => "The herd wall forms before contact."),
    longLead: constantLaneCopy(() => "The herd wall forms before contact, keeping the defensive shape clear from the first frame."),
  },
  "Giant Standoff": {
    preferredArcs: ["Giant vs giant clash", "Territory dominance battle"],
    nearbyArcs: ["Giant vs giant clash", "Territory dominance battle", "Defender stands ground"],
    preferredHabitats: ["Open Prairie Grassland", "Rocky Mountain Meadow", "Snow Field Tundra"],
    preferredHookFamily: "curiosity",
    laneTag: "#giantstandoff",
    predatorKeywords: ["bison", "moose", "elk", "musk ox", "bear", "elephant", "rhino", "hippo"],
    preyKeywords: ["bison", "moose", "elk", "musk ox", "bear", "elephant", "rhino", "hippo"],
    habitatKeywords: ["standoff", "shoulder line", "heavy footing", "body weight"],
    habitatClause: "with wide standoff spacing and heavy-footed silhouette reads",
    hooks: [
      constantLaneCopy(() => "The standoff was visible in the shoulder line before either animal moved."),
      constantLaneCopy(() => "Two heavy silhouettes made the space feel charged before contact."),
      constantLaneCopy(() => "The footing shift gave away the standoff first."),
    ],
    shortLead: constantLaneCopy(() => "The standoff reads in the shoulder line."),
    longLead: constantLaneCopy(() => "The standoff reads in the shoulder line before either animal commits to the next move."),
  },
  "Predator Pressure": {
    preferredArcs: ["Ambush attack", "Chase and takedown"],
    nearbyArcs: ["Ambush attack", "Chase and takedown", "Escape from danger"],
    preferredHabitats: ["Forest Clearing", "Rocky Mountain Meadow", "Open Prairie Grassland"],
    preferredHookFamily: "danger",
    laneTag: "#predatorpressure",
    predatorKeywords: ["wolf", "mountain lion", "cougar", "bear", "coyote", "bobcat", "lion", "tiger", "leopard"],
    preyKeywords: ["deer", "elk", "rabbit", "antelope", "gazelle", "calf", "fawn"],
    habitatKeywords: ["pressure line", "closing distance", "danger zone", "readable distance"],
    habitatClause: "with a clear pressure line and readable predator distance",
    hooks: [
      predatorOnly((predator) => `The ${predator.toLowerCase()} was already shaping the pressure line.`),
      constantLaneCopy(() => "The danger beat arrived before the chase opened fully."),
      constantLaneCopy(() => "The pressure was readable before the subject reacted."),
    ],
    shortLead: constantLaneCopy(() => "The pressure line is readable early."),
    longLead: constantLaneCopy(() => "The pressure line is readable early, so the danger beat lands before the full chase begins."),
  },
  "Escape Lane": {
    preferredArcs: ["Escape from danger", "Chase and takedown"],
    nearbyArcs: ["Escape from danger", "Chase and takedown", "Ambush attack"],
    preferredHabitats: ["Open Prairie Grassland", "Forest Clearing", "Rocky Mountain Meadow"],
    preferredHookFamily: "danger",
    laneTag: "#escapelane",
    predatorKeywords: ["wolf", "coyote", "mountain lion", "cougar", "bear", "bobcat"],
    preyKeywords: ["deer", "elk", "rabbit", "antelope", "gazelle", "calf", "fawn"],
    habitatKeywords: ["escape lane", "breakaway", "open gap", "turning room"],
    habitatClause: "with one clean escape lane and visible turning room",
    hooks: [
      constantLaneCopy(() => "One escape lane stayed open for less than a second."),
      preyOnly((prey) => `The ${prey.toLowerCase()} had one clean turn before the pressure closed.`),
      constantLaneCopy(() => "The whole scene turns on whether the opening stays wide enough."),
    ],
    shortLead: constantLaneCopy(() => "One escape lane stays readable."),
    longLead: constantLaneCopy(() => "One escape lane stays readable, making the survival beat clear without graphic escalation."),
  },
  "Swamp Ambush": {
    preferredArcs: ["Ambush attack", "Escape from danger"],
    nearbyArcs: ["Ambush attack", "Escape from danger", "Chase and takedown"],
    preferredHabitats: ["Everglades Marsh", "Cypress Swamp Edge", "Riverbank Reeds"],
    preferredHookFamily: "danger",
    laneTag: "#swampambush",
    predatorKeywords: ["alligator", "crocodile", "jaguar", "snake", "heron", "bobcat"],
    preyKeywords: ["deer", "boar", "fish", "duck", "frog", "calf", "fawn"],
    habitatKeywords: ["swamp", "marsh", "cypress", "waterline", "muddy bank"],
    habitatClause: "with swamp-edge cover and clean waterline separation",
    hooks: [
      constantLaneCopy(() => "The swamp edge gave away the ambush before the water moved."),
      constantLaneCopy(() => "A quiet waterline turned into the warning sign."),
      constantLaneCopy(() => "The cover looked still until the pressure line appeared."),
    ],
    shortLead: constantLaneCopy(() => "The swamp edge hides the pressure early."),
    longLead: constantLaneCopy(() => "The swamp edge hides the pressure early while the subjects stay readable and separated."),
  },
  "Winter Survival": {
    preferredArcs: ["Escape from danger", "Defender stands ground"],
    nearbyArcs: ["Escape from danger", "Defender stands ground", "Pack hunting strategy"],
    preferredHabitats: ["Snow Field Tundra", "Rocky Mountain Meadow", "Forest Clearing"],
    preferredHookFamily: "danger",
    laneTag: "#wintersurvival",
    predatorKeywords: ["wolf", "fox", "lynx", "coyote", "polar bear", "bear", "eagle"],
    preyKeywords: ["deer", "elk", "caribou", "hare", "rabbit", "seal", "calf", "fawn"],
    habitatKeywords: ["snow", "winter", "ice", "frozen", "whiteout"],
    habitatClause: "with winter footing, visible breath, and clean snowfield spacing",
    hooks: [
      constantLaneCopy(() => "The snow made every survival step easier to read."),
      preyOnly((prey) => `The ${prey.toLowerCase()} had to find traction before the pressure closed.`),
      constantLaneCopy(() => "Winter footing turned the escape into the story beat."),
    ],
    shortLead: constantLaneCopy(() => "The winter footing changes the survival read."),
    longLead: constantLaneCopy(() => "The winter footing changes the survival read because every track and turn stays visible."),
  },
  "Territory Clash": {
    preferredArcs: ["Territory dominance battle", "Predator vs predator fight"],
    nearbyArcs: ["Territory dominance battle", "Predator vs predator fight", "Giant vs giant clash"],
    preferredHabitats: ["Forest Clearing", "Rocky Mountain Meadow", "Dry Prairie Plain"],
    preferredHookFamily: "curiosity",
    laneTag: "#territoryclash",
    predatorKeywords: ["bear", "wolf", "lion", "tiger", "leopard", "elk", "bison", "moose"],
    preyKeywords: ["bear", "wolf", "lion", "tiger", "leopard", "elk", "bison", "moose"],
    habitatKeywords: ["territory", "claim line", "boundary", "warning step"],
    habitatClause: "with a visible claim line and readable territorial spacing",
    hooks: [
      constantLaneCopy(() => "The claim line was visible before the clash started."),
      constantLaneCopy(() => "One warning step turned the space into territory."),
      constantLaneCopy(() => "The boundary mattered before either animal committed."),
    ],
    shortLead: constantLaneCopy(() => "The claim line is visible early."),
    longLead: constantLaneCopy(() => "The claim line is visible early, keeping the territorial clash readable without graphic escalation."),
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

const RUT_BATTLE_SPECIES = [
  "bull elk",
  "elk",
  "moose",
  "white tailed deer",
  "white-tailed deer",
  "mule deer",
  "deer",
  "caribou",
  "reindeer",
] as const;

function isRutBattleSpeciesPair(predator: string, prey: string): boolean {
  const predatorText = normalizeText(predator);
  const preyText = normalizeText(prey);
  const predatorMatch = RUT_BATTLE_SPECIES.some((species) =>
    predatorText.includes(species)
  );
  const preyMatch = RUT_BATTLE_SPECIES.some((species) =>
    preyText.includes(species)
  );

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
    case "Mother Defense":
    case "Herd Defense":
      return predatorMatch || preyMatch || arcMatch;
    case "Giant Standoff":
    case "Territory Clash":
      return predatorMatch || preyMatch || arcMatch;
    case "Predator Pressure":
    case "Swamp Ambush":
      return predatorMatch || arcMatch;
    case "Escape":
    case "Escape Lane":
    case "Winter Survival":
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
    const isRutLane = input.contentLane === "Rut Battle";
    let mismatchScore = isRutLane ? 38 : 54;
    if (config.nearbyArcs.includes(input.arc)) mismatchScore += isRutLane ? 4 : 6;
    if (config.preferredHookFamily === input.hookFamily) {
      mismatchScore += isRutLane ? 2 : 3;
    }
    return Math.min(isRutLane ? 46 : 68, mismatchScore);
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
