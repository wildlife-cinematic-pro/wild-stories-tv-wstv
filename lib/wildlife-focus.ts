import { habitatPromptMap } from "@/lib/habitat-presets";
import {
  getWildlifeLeadCatalogEntry,
  getWildlifeLeadCatalogForScope,
  normalizeCatalogAnimalName,
  type WildlifeLeadCatalogEntry,
} from "@/lib/wildlife-lead-catalog";

import type { HabitatPreset, WildlifeScopeMode } from "@/types";

export type CanonicalWildlifeScopeMode = Exclude<
  WildlifeScopeMode,
  "USA Wildlife" | "World Wildlife"
>;

type HabitatTag =
  | "coast"
  | "desert"
  | "forest"
  | "jungle"
  | "meadow"
  | "mountain"
  | "open"
  | "rainforest"
  | "river"
  | "savanna"
  | "snow"
  | "swamp"
  | "tundra"
  | "wetland"
  | "woodland";

export type WildlifeFocusBadge =
  | "Kling 15s"
  | "Facebook-safe"
  | "No gore"
  | "Fast hook"
  | "Water ambush"
  | "Pack pressure"
  | "Defender"
  | "Chase pressure"
  | "Near-clash"
  | "Low drift";

type WildlifeFocusPairing = {
  predator: string;
  prey: string;
  environments: [string, ...string[]];
  habitatTags: HabitatTag[];
  safeArcLabel?: string;
  badges?: WildlifeFocusBadge[];
  safetyDefaults?: string[];
  kling15Primary?: boolean;
  promptTemplateHint?: string;
};

type WildlifeEnvironmentProfile = {
  primaryHabitats: string[];
  secondaryHabitats: string[];
  regionTags: string[];
  weatherAtmosphereSuggestions: string[];
  shortEnvironmentString: string;
  goodSceneContexts: string[];
  likelyHabitatTags: HabitatTag[];
};

type WildlifeFocusDefinition = {
  helperText: string;
  animals: string[];
  defaultPairing: WildlifeFocusPairing;
  pairings: WildlifeFocusPairing[];
};

export const FACEBOOK_SAFE_SURVIVAL_DEFAULTS = [
  "No blood",
  "No gore",
  "No visible wounds",
  "No torn flesh",
  "No graphic injury",
  "No death close-up",
  "Documentary survival tension",
  "Natural wildlife behavior",
  "Realistic animal physics",
  "Clean anatomy",
] as const;

export const FACEBOOK_SAFE_SURVIVAL_HINT =
  "No blood, no gore, no visible wounds. Documentary survival tension only.";

const LEGACY_SCOPE_ALIASES: Record<string, CanonicalWildlifeScopeMode> = {
  "USA Wildlife": "USA / Canada Wildlife",
  "World Wildlife": "World Wide Wildlife",
};

const ANIMAL_ALIASES: Record<string, string> = {
  Elk: "Bull Elk",
  Deer: "White-tailed Deer",
  Fox: "Red Fox",
  "European Bison": "Bison",
  Wisent: "Bison",
  Goanna: "Monitor Lizard",
  Cougar: "Mountain Lion",
  Puma: "Mountain Lion",
  Bear: "Brown Bear",
  Eagle: "Golden Eagle",
  Shark: "Great White Shark",
  Snake: "Rattlesnake",
  "African Lion Male": "Lion",
  "Arctic Wolf": "Wolf",
  Turtle: "Tortoise",
};

const HABITAT_PRESET_TAGS: Record<Exclude<HabitatPreset, "Auto">, HabitatTag[]> = {
  "Open Prairie Grassland": ["open", "meadow"],
  "Dry Prairie Plain": ["open", "desert"],
  "Everglades Marsh": ["swamp", "wetland", "river"],
  "Riverbank Reeds": ["river", "wetland"],
  "Forest Clearing": ["forest", "woodland", "meadow"],
  "Cypress Swamp Edge": ["swamp", "wetland", "forest"],
  "Rocky Mountain Meadow": ["mountain", "meadow", "forest"],
  "Snow Field Tundra": ["snow", "tundra", "open"],
  "Desert Scrubland": ["desert", "open"],
  "Coastal Cliffline": ["coast", "mountain"],
};

function uniqueBadges(badges: WildlifeFocusBadge[]): WildlifeFocusBadge[] {
  return Array.from(new Set(badges));
}

function buildViralPairing(input: {
  predator: string;
  prey: string;
  environments: [string, ...string[]];
  habitatTags: HabitatTag[];
  safeArcLabel: string;
  badges?: WildlifeFocusBadge[];
  promptTemplateHint?: string;
}): WildlifeFocusPairing {
  return {
    predator: input.predator,
    prey: input.prey,
    environments: input.environments,
    habitatTags: input.habitatTags,
    safeArcLabel: input.safeArcLabel,
    badges: uniqueBadges([
      "Kling 15s",
      "Facebook-safe",
      "No gore",
      "Fast hook",
      ...(input.badges ?? []),
    ]),
    safetyDefaults: [...FACEBOOK_SAFE_SURVIVAL_DEFAULTS],
    kling15Primary: true,
    promptTemplateHint: input.promptTemplateHint,
  };
}

function buildDocumentaryPairing(input: {
  predator: string;
  prey: string;
  environments: [string, ...string[]];
  habitatTags: HabitatTag[];
  safeArcLabel?: string;
  badges?: WildlifeFocusBadge[];
  promptTemplateHint?: string;
}): WildlifeFocusPairing {
  return {
    predator: input.predator,
    prey: input.prey,
    environments: input.environments,
    habitatTags: input.habitatTags,
    safeArcLabel: input.safeArcLabel,
    badges: input.badges ? uniqueBadges(input.badges) : undefined,
    promptTemplateHint: input.promptTemplateHint,
  };
}

export const wildlifeScopeOptions: CanonicalWildlifeScopeMode[] = [
  "USA / Canada Wildlife",
  "USA Viral Wildlife",
  "Europe Wildlife",
  "Norway / Scandinavia Wildlife",
  "Australia Wildlife",
  "Global Viral Wildlife",
  "Low Drift First Test",
  "World Wide Wildlife",
];

const WILDLIFE_FOCUS_DEFINITIONS: Record<
  CanonicalWildlifeScopeMode,
  WildlifeFocusDefinition
> = {
  "USA / Canada Wildlife": {
    helperText:
      "Familiar North American megafauna, wetlands, and birds of prey that viewers in the U.S. and Canada recognize fast.",
    animals: [
      "Grizzly Bear",
      "Brown Bear",
      "Black Bear",
      "Wolf",
      "Wolf Pack",
      "Bison",
      "Moose",
      "Bull Elk",
      "White-tailed Deer",
      "Bald Eagle",
      "Golden Eagle",
      "Mountain Lion",
      "Cougar",
      "Coyote",
      "Bobcat",
      "Lynx",
      "Alligator",
      "Raccoon",
      "Wild Horse",
    ],
    defaultPairing: {
      predator: "Grizzly Bear",
      prey: "Bison",
      environments: ["snowy mountain valley", "open snowy plain"],
      habitatTags: ["mountain", "snow", "open"],
    },
    pairings: [
      {
        predator: "Grizzly Bear",
        prey: "Bison",
        environments: ["snowy mountain valley", "open snowy plain"],
        habitatTags: ["mountain", "snow", "open"],
      },
      {
        predator: "Wolf Pack",
        prey: "Bull Elk",
        environments: ["winter forest edge", "open snowfield"],
        habitatTags: ["forest", "snow", "open"],
      },
      {
        predator: "Mountain Lion",
        prey: "White-tailed Deer",
        environments: ["rocky forest slope", "pine ridge"],
        habitatTags: ["mountain", "forest", "woodland"],
      },
      {
        predator: "Bald Eagle",
        prey: "Fish",
        environments: ["cold river edge", "lake edge"],
        habitatTags: ["river", "coast"],
      },
      {
        predator: "Alligator",
        prey: "White-tailed Deer",
        environments: ["swamp waterline", "marsh edge"],
        habitatTags: ["swamp", "wetland"],
      },
      {
        predator: "Moose",
        prey: "Wolf Pack",
        environments: ["boreal lake edge", "snowy forest"],
        habitatTags: ["forest", "snow", "river"],
      },
      {
        predator: "Black Bear",
        prey: "Bull Elk",
        environments: ["mountain forest clearing"],
        habitatTags: ["forest", "mountain", "meadow"],
      },
    ],
  },
  "USA Viral Wildlife": {
    helperText:
      "USA audience first. Yellowstone, Alaska, Everglades, Rockies, and North American survival encounters with Facebook-safe documentary tension.",
    animals: [
      "Grizzly Bear",
      "Black Bear",
      "Wolf Pack",
      "Mountain Lion",
      "Coyote",
      "Bobcat",
      "Bald Eagle",
      "Golden Eagle",
      "Alligator",
      "Bison",
      "Moose",
      "Bull Elk",
      "Polar Bear",
      "Wolverine",
    ],
    defaultPairing: buildViralPairing({
      predator: "Grizzly Bear",
      prey: "Bison",
      environments: ["Yellowstone open prairie grassland", "snowy mountain valley"],
      habitatTags: ["meadow", "open", "mountain"],
      safeArcLabel: "Defender stands ground",
      badges: ["Defender", "Low drift"],
      promptTemplateHint: "Hold a wide confrontation lane, heavy body mass, and a cliffhanger push-pull finish.",
    }),
    pairings: [
      buildViralPairing({
        predator: "Grizzly Bear",
        prey: "Bison",
        environments: ["Yellowstone open prairie grassland", "snowy mountain valley"],
        habitatTags: ["meadow", "open", "mountain"],
        safeArcLabel: "Defender stands ground",
        badges: ["Defender", "Low drift"],
        promptTemplateHint: "Hold a wide confrontation lane, heavy body mass, and a cliffhanger push-pull finish.",
      }),
      buildViralPairing({
        predator: "Grizzly Bear",
        prey: "Moose",
        environments: ["willow marsh edge", "boreal lake edge"],
        habitatTags: ["river", "wetland", "forest"],
        safeArcLabel: "Near-clash",
        badges: ["Defender"],
      }),
      buildViralPairing({
        predator: "Grizzly Bear",
        prey: "Bull Elk",
        environments: ["Rocky Mountain autumn meadow", "high meadow treeline"],
        habitatTags: ["mountain", "meadow", "forest"],
        safeArcLabel: "Near-clash",
        badges: ["Defender"],
      }),
      buildViralPairing({
        predator: "Wolf Pack",
        prey: "Moose",
        environments: ["boreal lake edge", "snowy valley corridor"],
        habitatTags: ["forest", "river", "snow"],
        safeArcLabel: "Pack pressure",
        badges: ["Pack pressure", "Low drift"],
      }),
      buildViralPairing({
        predator: "Wolf Pack",
        prey: "Bull Elk",
        environments: ["Rocky Mountain forest edge", "open snowfield"],
        habitatTags: ["forest", "snow", "open"],
        safeArcLabel: "Pack pressure",
        badges: ["Pack pressure", "Low drift"],
      }),
      buildViralPairing({
        predator: "Wolf Pack",
        prey: "Bison",
        environments: ["windy prairie opening", "Yellowstone valley floor"],
        habitatTags: ["open", "meadow", "snow"],
        safeArcLabel: "Defender stands ground",
        badges: ["Pack pressure", "Defender"],
      }),
      buildViralPairing({
        predator: "Mountain Lion",
        prey: "Mule Deer",
        environments: ["Rocky Mountain forest edge", "brushy ridge shelf"],
        habitatTags: ["forest", "mountain", "woodland"],
        safeArcLabel: "Ambush tension",
        badges: ["Low drift"],
      }),
      buildViralPairing({
        predator: "Mountain Lion",
        prey: "Bighorn Sheep",
        environments: ["rocky cliff shelf", "alpine ridge ledge"],
        habitatTags: ["mountain", "open"],
        safeArcLabel: "Cliffhanger survival tension",
        badges: ["Near-clash"],
      }),
      buildViralPairing({
        predator: "Coyote",
        prey: "Jackrabbit",
        environments: ["sagebrush flat", "dry prairie scrub edge"],
        habitatTags: ["open", "desert", "woodland"],
        safeArcLabel: "Chase pressure",
        badges: ["Chase pressure"],
      }),
      buildViralPairing({
        predator: "Coyote",
        prey: "Rabbit",
        environments: ["brushline opening", "cold field edge"],
        habitatTags: ["open", "woodland", "meadow"],
        safeArcLabel: "Last-second escape",
        badges: ["Chase pressure"],
      }),
      buildViralPairing({
        predator: "Bobcat",
        prey: "Rabbit",
        environments: ["rocky brush pocket", "desert scrub edge"],
        habitatTags: ["desert", "open", "woodland"],
        safeArcLabel: "Ambush tension",
        badges: ["Low drift"],
      }),
      buildViralPairing({
        predator: "Bobcat",
        prey: "Quail",
        environments: ["scrub grass opening", "low brush wash"],
        habitatTags: ["desert", "open", "woodland"],
        safeArcLabel: "Sudden lunge",
        badges: ["Fast hook"],
      }),
      buildViralPairing({
        predator: "Bald Eagle",
        prey: "Salmon",
        environments: ["Alaskan river mouth", "cold shallows"],
        habitatTags: ["river", "coast", "forest"],
        safeArcLabel: "Fishing strike",
        badges: ["Fast hook", "Low drift"],
      }),
      buildViralPairing({
        predator: "Bald Eagle",
        prey: "Trout",
        environments: ["mountain river bend", "lakeshore shallows"],
        habitatTags: ["river", "coast", "mountain"],
        safeArcLabel: "Sudden lunge",
        badges: ["Fast hook", "Low drift"],
      }),
      buildViralPairing({
        predator: "Golden Eagle",
        prey: "Rabbit",
        environments: ["highland meadow", "open ridge shelf"],
        habitatTags: ["meadow", "mountain", "open"],
        safeArcLabel: "Sudden lunge",
        badges: ["Fast hook"],
      }),
      buildViralPairing({
        predator: "Golden Eagle",
        prey: "Fox",
        environments: ["windy alpine slope", "rocky highland edge"],
        habitatTags: ["mountain", "open", "meadow"],
        safeArcLabel: "Near-clash",
        badges: ["Fast hook"],
      }),
      buildViralPairing({
        predator: "Alligator",
        prey: "Wild Boar",
        environments: ["muddy Everglades waterline", "cypress swamp edge"],
        habitatTags: ["swamp", "wetland", "river"],
        safeArcLabel: "Waterhole ambush",
        badges: ["Water ambush", "Low drift"],
      }),
      buildViralPairing({
        predator: "Alligator",
        prey: "White-tailed Deer",
        environments: ["dark marsh edge", "tannin-water shoreline"],
        habitatTags: ["swamp", "wetland", "river"],
        safeArcLabel: "Sudden lunge",
        badges: ["Water ambush", "Low drift"],
      }),
      buildViralPairing({
        predator: "Black Bear",
        prey: "Salmon",
        environments: ["Smoky Mountain creek crossing", "cold river pocket"],
        habitatTags: ["river", "forest", "mountain"],
        safeArcLabel: "Fishing strike",
        badges: ["Fast hook"],
      }),
      buildViralPairing({
        predator: "Polar Bear",
        prey: "Seal",
        environments: ["Arctic ice edge", "open sea lead"],
        habitatTags: ["snow", "coast", "open"],
        safeArcLabel: "Ambush tension",
        badges: ["Low drift"],
      }),
      buildViralPairing({
        predator: "Polar Bear",
        prey: "Arctic Fox",
        environments: ["wind-scoured ice shelf", "snow ridge"],
        habitatTags: ["snow", "tundra", "open"],
        safeArcLabel: "Chase pressure",
        badges: ["Chase pressure"],
      }),
      buildViralPairing({
        predator: "Wolverine",
        prey: "Reindeer",
        environments: ["snowy tundra cut", "boreal treeline opening"],
        habitatTags: ["snow", "tundra", "forest"],
        safeArcLabel: "Defender stands ground",
        badges: ["Defender"],
      }),
      buildViralPairing({
        predator: "Wolverine",
        prey: "Rabbit",
        environments: ["wind-packed snowfield", "subarctic brush lane"],
        habitatTags: ["snow", "open", "woodland"],
        safeArcLabel: "Last-second escape",
        badges: ["Chase pressure"],
      }),
      buildViralPairing({
        predator: "Bison",
        prey: "Wolf Pack",
        environments: ["Yellowstone open range", "snowy valley floor"],
        habitatTags: ["open", "meadow", "snow"],
        safeArcLabel: "Defender stands ground",
        badges: ["Defender", "Pack pressure"],
      }),
      buildViralPairing({
        predator: "Moose",
        prey: "Wolf Pack",
        environments: ["willow marsh edge", "snowy boreal trail"],
        habitatTags: ["forest", "river", "snow"],
        safeArcLabel: "Defender stands ground",
        badges: ["Defender", "Pack pressure"],
      }),
    ],
  },
  "Europe Wildlife": {
    helperText:
      "Woodland, highland, and forest-edge wildlife with strong European recognition and clean animal spacing.",
    animals: [
      "Brown Bear",
      "Wolf",
      "Wolf Pack",
      "Red Deer",
      "Stag",
      "Roe Deer",
      "Red Fox",
      "Wild Boar",
      "Lynx",
      "Badger",
      "Golden Eagle",
      "Hare",
      "Bison",
      "Owl",
    ],
    defaultPairing: {
      predator: "Wolf",
      prey: "Red Deer",
      environments: ["misty forest clearing"],
      habitatTags: ["forest", "woodland", "meadow"],
    },
    pairings: [
      {
        predator: "Wolf",
        prey: "Red Deer",
        environments: ["misty forest clearing"],
        habitatTags: ["forest", "woodland", "meadow"],
      },
      {
        predator: "Brown Bear",
        prey: "Wild Boar",
        environments: ["dense woodland", "forest edge"],
        habitatTags: ["forest", "woodland"],
      },
      {
        predator: "Golden Eagle",
        prey: "Hare",
        environments: ["highland meadow", "rocky slope"],
        habitatTags: ["meadow", "mountain", "open"],
      },
      {
        predator: "Lynx",
        prey: "Roe Deer",
        environments: ["snowy woodland", "forest edge"],
        habitatTags: ["forest", "woodland", "snow"],
      },
      {
        predator: "Stag",
        prey: "Stag",
        environments: ["autumn forest clearing"],
        habitatTags: ["forest", "woodland", "meadow"],
      },
      {
        predator: "Red Fox",
        prey: "Rabbit",
        environments: ["meadow edge", "hedgerow"],
        habitatTags: ["meadow", "woodland", "open"],
      },
      {
        predator: "Bison",
        prey: "Wolf Pack",
        environments: ["forest meadow", "snowy woodland"],
        habitatTags: ["forest", "meadow", "snow"],
      },
    ],
  },
  "Norway / Scandinavia Wildlife": {
    helperText:
      "Tundra, boreal forest, fjord, and Arctic-edge wildlife suited to Scandinavian and Norwegian visual storytelling.",
    animals: [
      "Moose",
      "Reindeer",
      "Brown Bear",
      "Wolf",
      "Arctic Fox",
      "Wolverine",
      "Lynx",
      "Musk Ox",
      "Golden Eagle",
      "White-tailed Eagle",
      "Seal",
      "Orca",
      "Red Fox",
      "Polar Bear",
    ],
    defaultPairing: {
      predator: "Wolf Pack",
      prey: "Reindeer",
      environments: ["snowy tundra", "boreal forest edge"],
      habitatTags: ["tundra", "snow", "forest"],
    },
    pairings: [
      {
        predator: "Wolf Pack",
        prey: "Reindeer",
        environments: ["snowy tundra", "boreal forest edge"],
        habitatTags: ["tundra", "snow", "forest"],
      },
      {
        predator: "Brown Bear",
        prey: "Moose",
        environments: ["boreal lake edge", "snowy forest"],
        habitatTags: ["forest", "river", "snow"],
      },
      {
        predator: "Golden Eagle",
        prey: "Arctic Fox",
        environments: ["snowy ridge", "tundra slope"],
        habitatTags: ["snow", "tundra", "mountain"],
      },
      {
        predator: "Wolverine",
        prey: "Reindeer",
        environments: ["arctic tundra", "snowfield"],
        habitatTags: ["tundra", "snow", "open"],
      },
      {
        predator: "Musk Ox",
        prey: "Wolf Pack",
        environments: ["arctic tundra ridge"],
        habitatTags: ["tundra", "snow", "open"],
      },
      {
        predator: "Orca",
        prey: "Seal",
        environments: ["icy fjord", "cold coastal water"],
        habitatTags: ["coast", "river", "snow"],
      },
      {
        predator: "White-tailed Eagle",
        prey: "Fish",
        environments: ["fjord shoreline", "cold lake edge"],
        habitatTags: ["coast", "river", "mountain"],
      },
    ],
  },
  "Australia Wildlife": {
    helperText:
      "Outback, rainforest-edge, coastal, reptile, and marsupial wildlife for high-recognition Australian setups.",
    animals: [
      "Kangaroo",
      "Dingo",
      "Saltwater Crocodile",
      "Freshwater Crocodile",
      "Koala",
      "Wombat",
      "Emu",
      "Cassowary",
      "Tasmanian Devil",
      "Wedge-tailed Eagle",
      "Monitor Lizard",
      "Great White Shark",
      "Seal",
      "Snake",
    ],
    defaultPairing: {
      predator: "Dingo",
      prey: "Kangaroo",
      environments: ["dusty outback grassland", "dry scrubland"],
      habitatTags: ["open", "desert", "woodland"],
    },
    pairings: [
      {
        predator: "Dingo",
        prey: "Kangaroo",
        environments: ["dusty outback grassland", "dry scrubland"],
        habitatTags: ["open", "desert", "woodland"],
      },
      {
        predator: "Saltwater Crocodile",
        prey: "Kangaroo",
        environments: ["muddy riverbank", "waterline crossing"],
        habitatTags: ["river", "wetland", "swamp"],
      },
      {
        predator: "Wedge-tailed Eagle",
        prey: "Snake",
        environments: ["dry ridge", "open scrubland"],
        habitatTags: ["open", "desert", "mountain"],
      },
      {
        predator: "Cassowary",
        prey: "Dingo",
        environments: ["tropical rainforest edge"],
        habitatTags: ["rainforest", "woodland"],
      },
      {
        predator: "Great White Shark",
        prey: "Seal",
        environments: ["surf line", "coastal water"],
        habitatTags: ["coast", "open"],
      },
      {
        predator: "Monitor Lizard",
        prey: "Snake",
        environments: ["rocky dry scrubland"],
        habitatTags: ["desert", "open", "woodland"],
      },
    ],
  },
  "Global Viral Wildlife": {
    helperText:
      "Fast viral attack, ambush, chase, and survival encounters for Kling Direct 15s. No blood, no gore, no visible wounds.",
    animals: [
      "Crocodile",
      "Nile Crocodile",
      "Saltwater Crocodile",
      "Alligator",
      "Lion",
      "Tiger",
      "Leopard",
      "Cheetah",
      "Hyena",
      "African Wild Dog",
      "Grizzly Bear",
      "Wolf Pack",
      "Mountain Lion",
      "Coyote",
      "Bobcat",
      "Bald Eagle",
      "Golden Eagle",
      "Great White Shark",
      "Orca",
      "Leopard Seal",
      "Snow Leopard",
      "Komodo Dragon",
      "Jaguar",
      "Harpy Eagle",
    ],
    defaultPairing: buildViralPairing({
      predator: "Crocodile",
      prey: "Warthog",
      environments: [
        "dry-season African muddy waterhole",
        "shallow brown water with cracked mud",
      ],
      habitatTags: ["river", "wetland", "savanna"],
      safeArcLabel: "Waterhole ambush",
      badges: ["Water ambush", "Low drift"],
      promptTemplateHint:
        "Start from the provided master image and stage a 4-shot muddy waterline ambush that ends in unresolved escape pressure.",
    }),
    pairings: [
      buildViralPairing({
        predator: "Crocodile",
        prey: "Warthog",
        environments: [
          "dry-season African muddy waterhole",
          "shallow brown water with cracked mud",
        ],
        habitatTags: ["river", "wetland", "savanna"],
        safeArcLabel: "Waterhole ambush",
        badges: ["Water ambush", "Low drift"],
        promptTemplateHint:
          "Warthog drinks at muddy edge, crocodile barely visible, explosive lunge, unresolved escape pressure.",
      }),
      buildViralPairing({
        predator: "Crocodile",
        prey: "Zebra",
        environments: ["muddy river crossing", "reed-lined bank"],
        habitatTags: ["river", "wetland", "savanna"],
        safeArcLabel: "River crossing danger",
        badges: ["Water ambush"],
      }),
      buildViralPairing({
        predator: "Crocodile",
        prey: "Wildebeest",
        environments: ["muddy crossing lane", "shallow floodplain channel"],
        habitatTags: ["river", "wetland", "savanna"],
        safeArcLabel: "Sudden lunge",
        badges: ["Water ambush"],
      }),
      buildViralPairing({
        predator: "Nile Crocodile",
        prey: "Warthog",
        environments: ["dry-season waterhole edge", "muddy African bank"],
        habitatTags: ["river", "wetland", "savanna"],
        safeArcLabel: "Waterhole ambush",
        badges: ["Water ambush", "Low drift"],
      }),
      buildViralPairing({
        predator: "Nile Crocodile",
        prey: "Zebra",
        environments: ["wide African river crossing", "murky bank channel"],
        habitatTags: ["river", "wetland", "savanna"],
        safeArcLabel: "River crossing danger",
        badges: ["Water ambush", "Low drift"],
      }),
      buildViralPairing({
        predator: "Nile Crocodile",
        prey: "Wildebeest",
        environments: ["murky crossing current", "reed-framed flood channel"],
        habitatTags: ["river", "wetland", "savanna"],
        safeArcLabel: "Sudden lunge",
        badges: ["Water ambush", "Low drift"],
      }),
      buildViralPairing({
        predator: "Nile Crocodile",
        prey: "Cape Buffalo",
        environments: ["muddy river crossing", "deep brown channel edge"],
        habitatTags: ["river", "wetland", "savanna"],
        safeArcLabel: "Defender stands ground",
        badges: ["Water ambush", "Defender"],
      }),
      buildViralPairing({
        predator: "Saltwater Crocodile",
        prey: "Water Buffalo",
        environments: ["mangrove river mouth", "tropical estuary edge"],
        habitatTags: ["river", "swamp", "wetland"],
        safeArcLabel: "Waterhole ambush",
        badges: ["Water ambush", "Low drift"],
      }),
      buildViralPairing({
        predator: "Saltwater Crocodile",
        prey: "Wild Boar",
        environments: ["mangrove shallows", "muddy tidal bank"],
        habitatTags: ["river", "swamp", "wetland"],
        safeArcLabel: "Sudden lunge",
        badges: ["Water ambush", "Low drift"],
      }),
      buildViralPairing({
        predator: "Saltwater Crocodile",
        prey: "Deer",
        environments: ["tropical creek mouth", "shallow estuary channel"],
        habitatTags: ["river", "wetland", "swamp"],
        safeArcLabel: "River crossing danger",
        badges: ["Water ambush"],
      }),
      buildViralPairing({
        predator: "Alligator",
        prey: "Wild Boar",
        environments: ["muddy Everglades waterline", "cypress swamp edge"],
        habitatTags: ["swamp", "wetland", "river"],
        safeArcLabel: "Waterhole ambush",
        badges: ["Water ambush", "Low drift"],
      }),
      buildViralPairing({
        predator: "Alligator",
        prey: "White-tailed Deer",
        environments: ["marsh shoreline", "dark tannin-water edge"],
        habitatTags: ["swamp", "wetland", "river"],
        safeArcLabel: "Sudden lunge",
        badges: ["Water ambush", "Low drift"],
      }),
      buildViralPairing({
        predator: "Alligator",
        prey: "Raccoon",
        environments: ["night marsh edge", "shallow cypress channel"],
        habitatTags: ["swamp", "wetland", "river"],
        safeArcLabel: "Ambush tension",
        badges: ["Water ambush"],
      }),
      buildViralPairing({
        predator: "Jaguar",
        prey: "Caiman",
        environments: ["Amazon muddy bank", "tropical river margin"],
        habitatTags: ["river", "jungle", "rainforest"],
        safeArcLabel: "Near-clash",
        badges: ["Water ambush", "Low drift"],
      }),
      buildViralPairing({
        predator: "Jaguar",
        prey: "Wild Boar",
        environments: ["tropical forest floor", "riverbank game trail"],
        habitatTags: ["jungle", "forest", "river"],
        safeArcLabel: "Sudden lunge",
        badges: ["Chase pressure"],
      }),
      buildViralPairing({
        predator: "Jaguar",
        prey: "Deer",
        environments: ["dense river forest", "shadowed jungle opening"],
        habitatTags: ["jungle", "forest", "river"],
        safeArcLabel: "Ambush tension",
        badges: ["Low drift"],
      }),
      buildViralPairing({
        predator: "Great White Shark",
        prey: "Seal",
        environments: ["surf line", "cold open ocean break"],
        habitatTags: ["coast", "open"],
        safeArcLabel: "Sudden lunge",
        badges: ["Fast hook", "Low drift"],
      }),
      buildViralPairing({
        predator: "Great White Shark",
        prey: "Sea Lion",
        environments: ["seal colony surf zone", "whitewash channel"],
        habitatTags: ["coast", "open"],
        safeArcLabel: "Near-clash",
        badges: ["Fast hook"],
      }),
      buildViralPairing({
        predator: "Orca",
        prey: "Seal",
        environments: ["cold coastal water", "ice-edge channel"],
        habitatTags: ["coast", "open", "snow"],
        safeArcLabel: "Sudden lunge",
        badges: ["Fast hook", "Low drift"],
      }),
      buildViralPairing({
        predator: "Orca",
        prey: "Sea Lion",
        environments: ["rocky coastal break", "cold Pacific surface lane"],
        habitatTags: ["coast", "open"],
        safeArcLabel: "Chase pressure",
        badges: ["Fast hook"],
      }),
      buildViralPairing({
        predator: "Orca",
        prey: "Dolphin",
        environments: ["open coastal corridor", "storm-dark surface water"],
        habitatTags: ["coast", "open"],
        safeArcLabel: "Near-clash",
        badges: ["Fast hook"],
      }),
      buildViralPairing({
        predator: "Leopard Seal",
        prey: "Penguin",
        environments: ["Antarctic ice edge", "freezing open-water lane"],
        habitatTags: ["coast", "snow", "open"],
        safeArcLabel: "Sudden lunge",
        badges: ["Fast hook", "Low drift"],
      }),
      buildViralPairing({
        predator: "Leopard Seal",
        prey: "Seal Pup",
        environments: ["ice floe edge", "polar shallows"],
        habitatTags: ["coast", "snow", "open"],
        safeArcLabel: "Ambush tension",
        badges: ["Fast hook"],
      }),
      buildViralPairing({
        predator: "Leopard Seal",
        prey: "Squid",
        environments: ["under-ice channel", "dark polar water"],
        habitatTags: ["coast", "open", "snow"],
        safeArcLabel: "Chase pressure",
        badges: ["Fast hook"],
      }),
      buildViralPairing({
        predator: "Lion",
        prey: "Zebra",
        environments: ["savanna golden hour grassland", "dust plain"],
        habitatTags: ["savanna", "open"],
        safeArcLabel: "Chase pressure",
        badges: ["Chase pressure"],
      }),
      buildViralPairing({
        predator: "Lion",
        prey: "Wildebeest",
        environments: ["dry grassland run lane", "river crossing approach"],
        habitatTags: ["savanna", "open", "river"],
        safeArcLabel: "Cliffhanger survival tension",
        badges: ["Chase pressure"],
      }),
      buildViralPairing({
        predator: "Lion",
        prey: "Antelope",
        environments: ["short-grass savanna", "acacia shadow edge"],
        habitatTags: ["savanna", "open", "woodland"],
        safeArcLabel: "Sudden lunge",
        badges: ["Chase pressure"],
      }),
      buildViralPairing({
        predator: "Cheetah",
        prey: "Gazelle",
        environments: ["open savanna sprint lane", "dry grass track"],
        habitatTags: ["savanna", "open"],
        safeArcLabel: "Chase pressure",
        badges: ["Chase pressure"],
      }),
      buildViralPairing({
        predator: "Cheetah",
        prey: "Antelope",
        environments: ["short-grass plain", "sun-baked chase corridor"],
        habitatTags: ["savanna", "open"],
        safeArcLabel: "Last-second escape",
        badges: ["Chase pressure"],
      }),
      buildViralPairing({
        predator: "Cheetah",
        prey: "Deer",
        environments: ["open scrub plain", "dust-light field lane"],
        habitatTags: ["open", "savanna", "woodland"],
        safeArcLabel: "Last-second escape",
        badges: ["Chase pressure"],
      }),
      buildViralPairing({
        predator: "Hyena",
        prey: "Wildebeest",
        environments: ["dusty savanna lane", "river crossing aftermath"],
        habitatTags: ["savanna", "open", "river"],
        safeArcLabel: "Pack pressure",
        badges: ["Pack pressure"],
      }),
      buildViralPairing({
        predator: "Hyena",
        prey: "Antelope",
        environments: ["dry bushveld run lane", "scrub opening"],
        habitatTags: ["savanna", "open", "woodland"],
        safeArcLabel: "Chase pressure",
        badges: ["Pack pressure"],
      }),
      buildViralPairing({
        predator: "Hyena",
        prey: "Zebra",
        environments: ["low grass run corridor", "dusty waterhole edge"],
        habitatTags: ["savanna", "open", "river"],
        safeArcLabel: "Near-clash",
        badges: ["Pack pressure"],
      }),
      buildViralPairing({
        predator: "African Wild Dog",
        prey: "Antelope",
        environments: ["open bushveld lane", "red-dirt grass track"],
        habitatTags: ["savanna", "open", "woodland"],
        safeArcLabel: "Pack pressure",
        badges: ["Pack pressure"],
      }),
      buildViralPairing({
        predator: "African Wild Dog",
        prey: "Gazelle",
        environments: ["dry savanna chase lane", "low scrub opening"],
        habitatTags: ["savanna", "open"],
        safeArcLabel: "Chase pressure",
        badges: ["Pack pressure"],
      }),
      buildViralPairing({
        predator: "African Wild Dog",
        prey: "Deer",
        environments: ["bushveld edge", "wide field opening"],
        habitatTags: ["savanna", "woodland", "open"],
        safeArcLabel: "Last-second escape",
        badges: ["Pack pressure"],
      }),
      buildViralPairing({
        predator: "Leopard",
        prey: "Antelope",
        environments: ["rocky savanna shelf", "woodland edge"],
        habitatTags: ["savanna", "open", "woodland"],
        safeArcLabel: "Ambush tension",
        badges: ["Low drift"],
      }),
      buildViralPairing({
        predator: "Leopard",
        prey: "Deer",
        environments: ["shadowed treeline corridor", "rocky brush opening"],
        habitatTags: ["woodland", "forest", "open"],
        safeArcLabel: "Sudden lunge",
        badges: ["Low drift"],
      }),
      buildViralPairing({
        predator: "Leopard",
        prey: "Wild Boar",
        environments: ["thorn scrub edge", "rocky streambank"],
        habitatTags: ["woodland", "open", "river"],
        safeArcLabel: "Near-clash",
        badges: ["Low drift"],
      }),
      buildViralPairing({
        predator: "Tiger",
        prey: "Wild Boar",
        environments: ["dense jungle river edge", "monsoon forest floor"],
        habitatTags: ["jungle", "river", "forest"],
        safeArcLabel: "Ambush tension",
        badges: ["Low drift"],
      }),
      buildViralPairing({
        predator: "Tiger",
        prey: "Deer",
        environments: ["humid jungle opening", "bamboo forest edge"],
        habitatTags: ["jungle", "forest", "rainforest"],
        safeArcLabel: "Sudden lunge",
        badges: ["Low drift"],
      }),
      buildViralPairing({
        predator: "Tiger",
        prey: "Goat",
        environments: ["forest riverbank trail", "wet jungle shelf"],
        habitatTags: ["jungle", "forest", "river"],
        safeArcLabel: "Chase pressure",
        badges: ["Low drift"],
      }),
      buildViralPairing({
        predator: "Snow Leopard",
        prey: "Mountain Goat",
        environments: ["snowy cliff shelf", "high alpine ledge"],
        habitatTags: ["mountain", "snow", "open"],
        safeArcLabel: "Cliffhanger survival tension",
        badges: ["Near-clash", "Low drift"],
      }),
      buildViralPairing({
        predator: "Snow Leopard",
        prey: "Ibex",
        environments: ["windy high ridge", "rocky snow face"],
        habitatTags: ["mountain", "snow", "open"],
        safeArcLabel: "Near-clash",
        badges: ["Near-clash", "Low drift"],
      }),
      buildViralPairing({
        predator: "Snow Leopard",
        prey: "Marmot",
        environments: ["rocky alpine meadow", "snow-patch slope"],
        habitatTags: ["mountain", "meadow", "snow"],
        safeArcLabel: "Sudden lunge",
        badges: ["Fast hook", "Low drift"],
      }),
      buildViralPairing({
        predator: "Komodo Dragon",
        prey: "Deer",
        environments: ["dry island scrubland", "sun-baked trail cut"],
        habitatTags: ["desert", "open", "woodland"],
        safeArcLabel: "Sudden lunge",
        badges: ["Fast hook", "Low drift"],
      }),
      buildViralPairing({
        predator: "Komodo Dragon",
        prey: "Wild Boar",
        environments: ["dusty island clearing", "thorny game trail"],
        habitatTags: ["desert", "open", "woodland"],
        safeArcLabel: "Near-clash",
        badges: ["Defender", "Low drift"],
      }),
      buildViralPairing({
        predator: "Komodo Dragon",
        prey: "Water Buffalo",
        environments: ["dry waterhole edge", "open volcanic flat"],
        habitatTags: ["open", "desert", "woodland"],
        safeArcLabel: "Defender stands ground",
        badges: ["Defender", "Low drift"],
      }),
      buildViralPairing({
        predator: "Grizzly Bear",
        prey: "Bison",
        environments: ["Yellowstone valley floor", "open snowy plain"],
        habitatTags: ["open", "meadow", "mountain"],
        safeArcLabel: "Defender stands ground",
        badges: ["Defender", "Low drift"],
      }),
      buildViralPairing({
        predator: "Grizzly Bear",
        prey: "Moose",
        environments: ["willow marsh edge", "mountain lake margin"],
        habitatTags: ["river", "wetland", "forest"],
        safeArcLabel: "Near-clash",
        badges: ["Defender"],
      }),
      buildViralPairing({
        predator: "Grizzly Bear",
        prey: "Bull Elk",
        environments: ["Rocky Mountain meadow", "treeline clearing"],
        habitatTags: ["mountain", "meadow", "forest"],
        safeArcLabel: "Near-clash",
        badges: ["Defender"],
      }),
      buildViralPairing({
        predator: "Wolf Pack",
        prey: "Moose",
        environments: ["boreal lake edge", "snowy valley corridor"],
        habitatTags: ["forest", "river", "snow"],
        safeArcLabel: "Pack pressure",
        badges: ["Pack pressure", "Low drift"],
      }),
      buildViralPairing({
        predator: "Wolf Pack",
        prey: "Bull Elk",
        environments: ["Rocky Mountain forest edge", "open snowfield"],
        habitatTags: ["forest", "snow", "open"],
        safeArcLabel: "Pack pressure",
        badges: ["Pack pressure", "Low drift"],
      }),
      buildViralPairing({
        predator: "Wolf Pack",
        prey: "Bison",
        environments: ["windy prairie opening", "Yellowstone valley floor"],
        habitatTags: ["open", "meadow", "snow"],
        safeArcLabel: "Defender stands ground",
        badges: ["Pack pressure", "Defender"],
      }),
      buildViralPairing({
        predator: "Mountain Lion",
        prey: "Mule Deer",
        environments: ["Rocky Mountain forest edge", "brushy ridge shelf"],
        habitatTags: ["forest", "mountain", "woodland"],
        safeArcLabel: "Ambush tension",
        badges: ["Low drift"],
      }),
      buildViralPairing({
        predator: "Mountain Lion",
        prey: "Bighorn Sheep",
        environments: ["rocky cliff shelf", "alpine ridge ledge"],
        habitatTags: ["mountain", "open"],
        safeArcLabel: "Cliffhanger survival tension",
        badges: ["Near-clash"],
      }),
      buildViralPairing({
        predator: "Mountain Lion",
        prey: "White-tailed Deer",
        environments: ["forest edge", "pine ridge"],
        habitatTags: ["forest", "woodland", "mountain"],
        safeArcLabel: "Last-second escape",
        badges: ["Low drift"],
      }),
      buildViralPairing({
        predator: "Coyote",
        prey: "Jackrabbit",
        environments: ["sagebrush flat", "dry prairie scrub edge"],
        habitatTags: ["open", "desert", "woodland"],
        safeArcLabel: "Chase pressure",
        badges: ["Chase pressure"],
      }),
      buildViralPairing({
        predator: "Coyote",
        prey: "Rabbit",
        environments: ["brushline opening", "cold field edge"],
        habitatTags: ["open", "woodland", "meadow"],
        safeArcLabel: "Last-second escape",
        badges: ["Chase pressure"],
      }),
      buildViralPairing({
        predator: "Coyote",
        prey: "Quail",
        environments: ["dry grass pocket", "desert scrub lane"],
        habitatTags: ["open", "desert", "woodland"],
        safeArcLabel: "Sudden lunge",
        badges: ["Fast hook"],
      }),
      buildViralPairing({
        predator: "Bobcat",
        prey: "Rabbit",
        environments: ["rocky brush pocket", "desert scrub edge"],
        habitatTags: ["desert", "open", "woodland"],
        safeArcLabel: "Ambush tension",
        badges: ["Low drift"],
      }),
      buildViralPairing({
        predator: "Bobcat",
        prey: "Quail",
        environments: ["scrub grass opening", "low brush wash"],
        habitatTags: ["desert", "open", "woodland"],
        safeArcLabel: "Sudden lunge",
        badges: ["Fast hook"],
      }),
      buildViralPairing({
        predator: "Bobcat",
        prey: "Squirrel",
        environments: ["brushy woodland edge", "rock pocket trail"],
        habitatTags: ["woodland", "forest", "open"],
        safeArcLabel: "Fast hook",
        badges: ["Fast hook"],
      }),
      buildViralPairing({
        predator: "Bald Eagle",
        prey: "Salmon",
        environments: ["Alaskan river mouth", "cold shallows"],
        habitatTags: ["river", "coast", "forest"],
        safeArcLabel: "Fishing strike",
        badges: ["Fast hook", "Low drift"],
      }),
      buildViralPairing({
        predator: "Bald Eagle",
        prey: "Trout",
        environments: ["mountain river bend", "lakeshore shallows"],
        habitatTags: ["river", "coast", "mountain"],
        safeArcLabel: "Sudden lunge",
        badges: ["Fast hook", "Low drift"],
      }),
      buildViralPairing({
        predator: "Bald Eagle",
        prey: "Rabbit",
        environments: ["open river meadow", "brushy shoreline edge"],
        habitatTags: ["river", "meadow", "woodland"],
        safeArcLabel: "Last-second escape",
        badges: ["Fast hook"],
      }),
      buildViralPairing({
        predator: "Golden Eagle",
        prey: "Rabbit",
        environments: ["highland meadow", "open ridge shelf"],
        habitatTags: ["meadow", "mountain", "open"],
        safeArcLabel: "Sudden lunge",
        badges: ["Fast hook"],
      }),
      buildViralPairing({
        predator: "Golden Eagle",
        prey: "Fox",
        environments: ["windy alpine slope", "rocky highland edge"],
        habitatTags: ["mountain", "open", "meadow"],
        safeArcLabel: "Near-clash",
        badges: ["Fast hook"],
      }),
      buildViralPairing({
        predator: "Golden Eagle",
        prey: "Marmot",
        environments: ["rocky meadow shelf", "high ridge grass patch"],
        habitatTags: ["mountain", "meadow", "open"],
        safeArcLabel: "Sudden lunge",
        badges: ["Fast hook"],
      }),
      buildViralPairing({
        predator: "Harpy Eagle",
        prey: "Monkey",
        environments: ["Amazon canopy break", "dense rainforest interior"],
        habitatTags: ["rainforest", "jungle", "forest"],
        safeArcLabel: "Sudden lunge",
        badges: ["Fast hook"],
      }),
      buildViralPairing({
        predator: "Harpy Eagle",
        prey: "Sloth",
        environments: ["canopy branch line", "humid green canopy"],
        habitatTags: ["rainforest", "jungle", "forest"],
        safeArcLabel: "Ambush tension",
        badges: ["Fast hook"],
      }),
      buildViralPairing({
        predator: "Harpy Eagle",
        prey: "Iguana",
        environments: ["rainforest opening", "low canopy branch network"],
        habitatTags: ["rainforest", "forest", "jungle"],
        safeArcLabel: "Sudden lunge",
        badges: ["Fast hook"],
      }),
    ],
  },
  "Low Drift First Test": {
    helperText:
      "Safest recognizable pairings for AI video consistency, clean subject spacing, and conservative first-frame reads.",
    animals: [
      "Brown Bear",
      "Grizzly Bear",
      "Bison",
      "Wolf",
      "Wolf Pack",
      "Bull Elk",
      "Moose",
      "White-tailed Deer",
      "Lion",
      "Bald Eagle",
      "Crocodile",
      "Alligator",
      "Kangaroo",
      "Dingo",
      "Orca",
      "Tiger",
      "Wild Boar",
      "Great White Shark",
    ],
    defaultPairing: {
      predator: "Grizzly Bear",
      prey: "Bison",
      environments: ["snowy mountain valley"],
      habitatTags: ["mountain", "snow", "open"],
    },
    pairings: [
      {
        predator: "Grizzly Bear",
        prey: "Bison",
        environments: ["snowy mountain valley"],
        habitatTags: ["mountain", "snow", "open"],
      },
      {
        predator: "Wolf Pack",
        prey: "Bull Elk",
        environments: ["winter forest edge"],
        habitatTags: ["forest", "snow"],
      },
      {
        predator: "Mountain Lion",
        prey: "White-tailed Deer",
        environments: ["forest edge", "pine ridge"],
        habitatTags: ["forest", "woodland", "mountain"],
      },
      {
        predator: "Bald Eagle",
        prey: "Fish",
        environments: ["cold river edge"],
        habitatTags: ["river", "coast"],
      },
      {
        predator: "Lion",
        prey: "Wildebeest",
        environments: ["savanna golden hour grassland"],
        habitatTags: ["savanna", "open"],
      },
      {
        predator: "Tiger",
        prey: "Wild Boar",
        environments: ["dense jungle river edge"],
        habitatTags: ["jungle", "river", "forest"],
      },
      {
        predator: "Orca",
        prey: "Seal",
        environments: ["cold coastal water"],
        habitatTags: ["coast", "snow"],
      },
      {
        predator: "Dingo",
        prey: "Kangaroo",
        environments: ["dusty outback grassland"],
        habitatTags: ["open", "desert"],
      },
    ],
  },
  "World Wide Wildlife": {
    helperText:
      "Broad worldwide wildlife library for scenic, documentary, and flexible animal pairings.",
    animals: [
      "Grizzly Bear",
      "Brown Bear",
      "Black Bear",
      "Wolf",
      "Wolf Pack",
      "Bison",
      "Moose",
      "Bull Elk",
      "White-tailed Deer",
      "Mountain Lion",
      "Coyote",
      "Bobcat",
      "Bald Eagle",
      "Golden Eagle",
      "Alligator",
      "Crocodile",
      "Nile Crocodile",
      "Saltwater Crocodile",
      "Lion",
      "Tiger",
      "Leopard",
      "Cheetah",
      "Hyena",
      "African Wild Dog",
      "Jaguar",
      "Snow Leopard",
      "Komodo Dragon",
      "Orca",
      "Great White Shark",
      "Leopard Seal",
      "Seal",
      "Kangaroo",
      "Dingo",
      "Red Fox",
      "Wolverine",
      "River Otter",
      "Beaver",
    ],
    defaultPairing: buildDocumentaryPairing({
      predator: "Mountain Lion",
      prey: "White-tailed Deer",
      environments: ["forest edge", "pine ridge"],
      habitatTags: ["forest", "woodland", "mountain"],
      safeArcLabel: "Documentary encounter",
    }),
    pairings: [
      buildDocumentaryPairing({
        predator: "Grizzly Bear",
        prey: "Bull Elk",
        environments: ["Rocky Mountain meadow", "mountain valley"],
        habitatTags: ["mountain", "meadow", "forest"],
        safeArcLabel: "Documentary encounter",
        badges: ["Low drift"],
      }),
      buildDocumentaryPairing({
        predator: "Wolf Pack",
        prey: "Bull Elk",
        environments: ["forest edge", "snowfield"],
        habitatTags: ["forest", "snow", "open"],
        safeArcLabel: "Documentary encounter",
        badges: ["Low drift"],
      }),
      buildDocumentaryPairing({
        predator: "Bald Eagle",
        prey: "Salmon",
        environments: ["cold river edge", "Alaskan shallows"],
        habitatTags: ["river", "coast", "forest"],
        safeArcLabel: "Scenic action beat",
        badges: ["Low drift"],
      }),
      buildDocumentaryPairing({
        predator: "Alligator",
        prey: "White-tailed Deer",
        environments: ["marsh edge", "Everglades shoreline"],
        habitatTags: ["swamp", "wetland", "river"],
        safeArcLabel: "Waterline tension",
      }),
      buildDocumentaryPairing({
        predator: "Lion",
        prey: "Zebra",
        environments: ["savanna golden hour grassland", "dry grass plain"],
        habitatTags: ["savanna", "open"],
        safeArcLabel: "Savanna encounter",
      }),
      buildDocumentaryPairing({
        predator: "Tiger",
        prey: "Deer",
        environments: ["dense jungle river edge", "humid forest path"],
        habitatTags: ["jungle", "forest", "river"],
        safeArcLabel: "Jungle encounter",
      }),
      buildDocumentaryPairing({
        predator: "Leopard",
        prey: "Antelope",
        environments: ["rocky savanna", "woodland edge"],
        habitatTags: ["savanna", "open", "woodland"],
        safeArcLabel: "Savanna encounter",
      }),
      buildDocumentaryPairing({
        predator: "Jaguar",
        prey: "Caiman",
        environments: ["tropical jungle riverbank", "muddy Amazon edge"],
        habitatTags: ["river", "jungle", "rainforest"],
        safeArcLabel: "River encounter",
      }),
      buildDocumentaryPairing({
        predator: "Orca",
        prey: "Seal",
        environments: ["cold coastal water", "icy fjord"],
        habitatTags: ["coast", "open", "snow"],
        safeArcLabel: "Cold-water encounter",
      }),
      buildDocumentaryPairing({
        predator: "Great White Shark",
        prey: "Seal",
        environments: ["surf line", "cold open ocean"],
        habitatTags: ["coast", "open"],
        safeArcLabel: "Coastal encounter",
      }),
      buildDocumentaryPairing({
        predator: "Snow Leopard",
        prey: "Mountain Goat",
        environments: ["snowy ridge", "high alpine ledge"],
        habitatTags: ["mountain", "snow", "open"],
        safeArcLabel: "Mountain encounter",
      }),
      buildDocumentaryPairing({
        predator: "Kangaroo",
        prey: "Dingo",
        environments: ["dusty outback grassland", "dry scrubland"],
        habitatTags: ["open", "desert", "woodland"],
        safeArcLabel: "Outback tension",
      }),
    ],
  },
};

type CatalogBackedWildlifeScopeMode =
  | "USA / Canada Wildlife"
  | "USA Viral Wildlife"
  | "Global Viral Wildlife"
  | "World Wide Wildlife";

function isCatalogBackedWildlifeScopeMode(
  mode: CanonicalWildlifeScopeMode
): mode is CatalogBackedWildlifeScopeMode {
  return (
    mode === "USA / Canada Wildlife" ||
    mode === "USA Viral Wildlife" ||
    mode === "Global Viral Wildlife" ||
    mode === "World Wide Wildlife"
  );
}

function buildCatalogPairing(
  lead: WildlifeLeadCatalogEntry,
  opposing: WildlifeLeadCatalogEntry["opposingProfiles"][number],
  mode: CatalogBackedWildlifeScopeMode
): WildlifeFocusPairing {
  const input = {
    predator: lead.leadAnimal,
    prey: opposing.animal,
    environments: opposing.environments as [string, ...string[]],
    habitatTags: opposing.habitatTags as HabitatTag[],
    safeArcLabel: opposing.safeArcLabel,
    badges: opposing.badges as WildlifeFocusBadge[],
    promptTemplateHint: opposing.promptTemplateHint,
  };

  if (mode === "Global Viral Wildlife" || mode === "USA Viral Wildlife") {
    return buildViralPairing(input);
  }

  return buildDocumentaryPairing(input);
}

function dedupeWildlifeFocusPairings(
  pairings: WildlifeFocusPairing[]
): WildlifeFocusPairing[] {
  const seen = new Set<string>();
  const next: WildlifeFocusPairing[] = [];

  for (const pairing of pairings) {
    const key = getWildlifeFocusPairingKey(pairing);
    if (seen.has(key)) continue;
    seen.add(key);
    next.push(pairing);
  }

  return next;
}

function buildCatalogFocusDefinition(
  mode: CatalogBackedWildlifeScopeMode
): WildlifeFocusDefinition {
  const helperText = WILDLIFE_FOCUS_DEFINITIONS[mode].helperText;
  const catalog = getWildlifeLeadCatalogForScope(mode);
  const animals = catalog.map((entry) => entry.leadAnimal);
  const pairings = dedupeWildlifeFocusPairings(
    catalog.flatMap((entry) =>
      entry.opposingProfiles.map((opposing) =>
        buildCatalogPairing(entry, opposing, mode)
      )
    )
  );

  const defaultLead = catalog[0];
  const defaultOpposing = defaultLead?.opposingProfiles[0];
  const defaultPairing =
    defaultLead && defaultOpposing
      ? buildCatalogPairing(defaultLead, defaultOpposing, mode)
      : WILDLIFE_FOCUS_DEFINITIONS[mode].defaultPairing;

  return {
    helperText,
    animals,
    defaultPairing,
    pairings,
  };
}

function getWildlifeFocusDefinition(
  mode: CanonicalWildlifeScopeMode
): WildlifeFocusDefinition {
  if (isCatalogBackedWildlifeScopeMode(mode)) {
    return buildCatalogFocusDefinition(mode);
  }

  return WILDLIFE_FOCUS_DEFINITIONS[mode];
}

const ENVIRONMENT_PROFILES: Record<string, WildlifeEnvironmentProfile> = {
  "Grizzly Bear": {
    primaryHabitats: ["mountain forest", "alpine meadow", "river valley"],
    secondaryHabitats: ["snowy mountain valley", "open meadow"],
    regionTags: ["North America", "Yellowstone", "Canada"],
    weatherAtmosphereSuggestions: ["cold morning", "mist", "snowfall", "overcast"],
    shortEnvironmentString: "snowy mountain valley",
    goodSceneContexts: ["standoff", "territory clash", "river crossing"],
    likelyHabitatTags: ["mountain", "forest", "meadow", "snow", "river", "open"],
  },
  "Brown Bear": {
    primaryHabitats: ["boreal forest", "highland woodland", "lake edge"],
    secondaryHabitats: ["snowy forest", "meadow edge"],
    regionTags: ["Europe", "Scandinavia"],
    weatherAtmosphereSuggestions: ["cold dawn", "fog", "overcast", "light snowfall"],
    shortEnvironmentString: "boreal lake edge",
    goodSceneContexts: ["standoff", "forest pressure", "river approach"],
    likelyHabitatTags: ["forest", "woodland", "river", "snow", "mountain"],
  },
  Bison: {
    primaryHabitats: ["prairie", "grassland", "open valley"],
    secondaryHabitats: ["snowy plains", "open range"],
    regionTags: ["North America", "Europe"],
    weatherAtmosphereSuggestions: ["wind", "snow dust", "golden hour", "overcast"],
    shortEnvironmentString: "open snowy plain",
    goodSceneContexts: ["charge standoff", "ground hold", "herd pressure"],
    likelyHabitatTags: ["open", "meadow", "snow"],
  },
  Moose: {
    primaryHabitats: ["boreal forest", "lake edge", "wetland"],
    secondaryHabitats: ["snowy forest", "marsh edge"],
    regionTags: ["North America", "Scandinavia"],
    weatherAtmosphereSuggestions: ["mist", "snowfall", "cold morning"],
    shortEnvironmentString: "boreal lake edge",
    goodSceneContexts: ["lake-edge standoff", "forest crossing"],
    likelyHabitatTags: ["forest", "river", "wetland", "snow"],
  },
  "Wolf Pack": {
    primaryHabitats: ["winter forest", "tundra edge", "mountain valley"],
    secondaryHabitats: ["open snowfield", "pine forest"],
    regionTags: ["North America", "Europe", "Scandinavia"],
    weatherAtmosphereSuggestions: ["snow", "fog", "dusk"],
    shortEnvironmentString: "winter forest edge",
    goodSceneContexts: ["pack pressure", "narrowing chase lanes"],
    likelyHabitatTags: ["forest", "snow", "tundra", "open", "mountain"],
  },
  "Bald Eagle": {
    primaryHabitats: ["river", "lake edge", "coastal forest"],
    secondaryHabitats: ["cliffside", "cold river valley"],
    regionTags: ["North America"],
    weatherAtmosphereSuggestions: ["river mist", "golden hour", "overcast"],
    shortEnvironmentString: "cold river edge",
    goodSceneContexts: ["fishing strike", "shoreline glide"],
    likelyHabitatTags: ["river", "coast", "forest", "mountain"],
  },
  "Red Deer": {
    primaryHabitats: ["forest clearing", "highland meadow", "misty woodland"],
    secondaryHabitats: ["autumn forest edge"],
    regionTags: ["Europe"],
    weatherAtmosphereSuggestions: ["fog", "golden hour", "autumn mist"],
    shortEnvironmentString: "misty forest clearing",
    goodSceneContexts: ["rut standoff", "woodland escape"],
    likelyHabitatTags: ["forest", "woodland", "meadow", "open"],
  },
  Reindeer: {
    primaryHabitats: ["tundra", "snowy plateau", "boreal forest edge"],
    secondaryHabitats: ["arctic plain"],
    regionTags: ["Scandinavia", "Arctic"],
    weatherAtmosphereSuggestions: ["snowfall", "arctic wind", "pale winter light"],
    shortEnvironmentString: "snowy tundra",
    goodSceneContexts: ["pack pressure", "migration line"],
    likelyHabitatTags: ["tundra", "snow", "forest", "open"],
  },
  "Musk Ox": {
    primaryHabitats: ["arctic tundra", "snowy ridge"],
    secondaryHabitats: ["rocky tundra"],
    regionTags: ["Arctic", "Scandinavia"],
    weatherAtmosphereSuggestions: ["blizzard", "arctic wind", "low winter sun"],
    shortEnvironmentString: "arctic tundra ridge",
    goodSceneContexts: ["defender stand", "pack pressure"],
    likelyHabitatTags: ["tundra", "snow", "open", "mountain"],
  },
  Kangaroo: {
    primaryHabitats: ["outback grassland", "eucalyptus woodland", "dry scrubland"],
    secondaryHabitats: ["open plain"],
    regionTags: ["Australia"],
    weatherAtmosphereSuggestions: ["harsh sun", "dusty golden hour", "heat haze"],
    shortEnvironmentString: "dusty outback grassland",
    goodSceneContexts: ["escape cut", "dry-ridge standoff"],
    likelyHabitatTags: ["open", "desert", "woodland"],
  },
  Dingo: {
    primaryHabitats: ["outback plain", "dry scrubland", "desert edge"],
    secondaryHabitats: ["eucalyptus woodland"],
    regionTags: ["Australia"],
    weatherAtmosphereSuggestions: ["dust", "heat haze", "golden hour"],
    shortEnvironmentString: "dry outback scrubland",
    goodSceneContexts: ["pack pressure", "outback pursuit"],
    likelyHabitatTags: ["open", "desert", "woodland"],
  },
  Alligator: {
    primaryHabitats: ["riverbank", "swamp", "wetland", "muddy waterline"],
    secondaryHabitats: ["marsh edge"],
    regionTags: ["North America"],
    weatherAtmosphereSuggestions: ["humid haze", "dawn mist"],
    shortEnvironmentString: "muddy riverbank",
    goodSceneContexts: ["waterline ambush", "marsh crossing"],
    likelyHabitatTags: ["river", "swamp", "wetland"],
  },
  Crocodile: {
    primaryHabitats: ["riverbank", "swamp", "wetland", "muddy waterline"],
    secondaryHabitats: ["marsh edge"],
    regionTags: ["Global", "Australia", "Africa"],
    weatherAtmosphereSuggestions: ["humid haze", "dawn mist"],
    shortEnvironmentString: "muddy riverbank",
    goodSceneContexts: ["river crossing", "water ambush"],
    likelyHabitatTags: ["river", "swamp", "wetland"],
  },
  Orca: {
    primaryHabitats: ["coastal water", "icy fjord", "open ocean", "surf line"],
    secondaryHabitats: ["cold coastal water"],
    regionTags: ["Scandinavia", "Global", "North Pacific"],
    weatherAtmosphereSuggestions: ["stormy water", "cold mist", "overcast"],
    shortEnvironmentString: "cold coastal water",
    goodSceneContexts: ["ice-edge pursuit", "shoreline breach"],
    likelyHabitatTags: ["coast", "river", "snow", "open"],
  },
  Seal: {
    primaryHabitats: ["coastal water", "ice edge", "surf line"],
    secondaryHabitats: ["cold harbor water"],
    regionTags: ["Scandinavia", "Australia", "Global"],
    weatherAtmosphereSuggestions: ["cold mist", "overcast", "storm swell"],
    shortEnvironmentString: "cold coastal water",
    goodSceneContexts: ["ice-edge scramble", "surf escape"],
    likelyHabitatTags: ["coast", "snow", "open"],
  },
  Lion: {
    primaryHabitats: ["savanna", "dry grassland", "river crossing"],
    secondaryHabitats: ["dust plain"],
    regionTags: ["Africa", "Global"],
    weatherAtmosphereSuggestions: ["golden hour", "dust", "heat haze"],
    shortEnvironmentString: "savanna golden hour grassland",
    goodSceneContexts: ["chase cut", "territory walk-in"],
    likelyHabitatTags: ["savanna", "open", "river"],
  },
  Tiger: {
    primaryHabitats: ["dense jungle", "river forest", "monsoon forest"],
    secondaryHabitats: ["bamboo forest edge"],
    regionTags: ["Asia", "Global"],
    weatherAtmosphereSuggestions: ["humid mist", "rain", "low light"],
    shortEnvironmentString: "dense jungle river edge",
    goodSceneContexts: ["ambush lane", "river-edge pressure"],
    likelyHabitatTags: ["jungle", "river", "forest", "rainforest"],
  },
  "Great White Shark": {
    primaryHabitats: ["coastal water", "surf line", "open ocean"],
    secondaryHabitats: ["cold coastal water"],
    regionTags: ["Australia", "Global"],
    weatherAtmosphereSuggestions: ["overcast swell", "cold mist", "storm wash"],
    shortEnvironmentString: "surf line",
    goodSceneContexts: ["surface breach", "shoreline strike"],
    likelyHabitatTags: ["coast", "open"],
  },
};

function normalizeAnimalName(name: string): string {
  return normalizeCatalogAnimalName(ANIMAL_ALIASES[name] ?? name);
}

function getCatalogEnvironmentProfile(
  animal: string
): WildlifeEnvironmentProfile | null {
  const entry = getWildlifeLeadCatalogEntry(animal);
  if (!entry) return null;

  return {
    primaryHabitats: [...entry.primaryEnvironments],
    secondaryHabitats: [...entry.secondaryEnvironments],
    regionTags: [],
    weatherAtmosphereSuggestions: [],
    shortEnvironmentString: entry.primaryEnvironments[0],
    goodSceneContexts: [...entry.safeArcLabels],
    likelyHabitatTags: [...(entry.habitatTags as HabitatTag[])],
  };
}

function getWildlifeEnvironmentProfile(
  animal: string
): WildlifeEnvironmentProfile | null {
  return (
    ENVIRONMENT_PROFILES[normalizeAnimalName(animal)] ??
    getCatalogEnvironmentProfile(animal)
  );
}

export function getWildlifeFocusPairingKey(pairing: {
  predator: string;
  prey: string;
}): string {
  return `${normalizeAnimalName(pairing.predator)}::${normalizeAnimalName(pairing.prey)}`;
}

function pairingMatches(
  pairing: WildlifeFocusPairing,
  predator: string,
  prey: string
): boolean {
  return (
    getWildlifeFocusPairingKey(pairing) ===
    getWildlifeFocusPairingKey({ predator, prey })
  );
}

function getPairingsForPredator(
  mode: CanonicalWildlifeScopeMode,
  predator: string
): WildlifeFocusPairing[] {
  const normalizedPredator = normalizeAnimalName(predator);
  return getWildlifeFocusDefinition(mode).pairings.filter(
    (pairing) =>
      normalizeAnimalName(pairing.predator) === normalizedPredator ||
      normalizeAnimalName(pairing.prey) === normalizedPredator
  );
}

export function isWildlifeScopeMode(value: unknown): value is WildlifeScopeMode {
  return (
    typeof value === "string" &&
    (value === "USA Wildlife" ||
      (wildlifeScopeOptions as readonly string[]).includes(value))
  );
}

export function normalizeWildlifeScopeMode(
  value: unknown,
  fallback: CanonicalWildlifeScopeMode = "USA / Canada Wildlife"
): CanonicalWildlifeScopeMode {
  if (typeof value !== "string") return fallback;
  if ((wildlifeScopeOptions as readonly string[]).includes(value)) {
    return value as CanonicalWildlifeScopeMode;
  }
  return LEGACY_SCOPE_ALIASES[value] ?? fallback;
}

export function getWildlifeScopeHelperText(
  mode: WildlifeScopeMode
): string {
  return getWildlifeFocusDefinition(normalizeWildlifeScopeMode(mode)).helperText;
}

export function getWildlifeFocusSafetyHint(
  mode: WildlifeScopeMode
): string | null {
  const canonicalMode = normalizeWildlifeScopeMode(mode);
  if (
    canonicalMode === "Global Viral Wildlife" ||
    canonicalMode === "USA Viral Wildlife"
  ) {
    return FACEBOOK_SAFE_SURVIVAL_HINT;
  }
  return null;
}

export function isAttackFocusedWildlifeScope(
  mode: WildlifeScopeMode
): boolean {
  const canonicalMode = normalizeWildlifeScopeMode(mode);
  return (
    canonicalMode === "Global Viral Wildlife" ||
    canonicalMode === "USA Viral Wildlife"
  );
}

export function getWildlifeScopeDefaultSelection(
  mode: WildlifeScopeMode
): { predator: string; prey: string; environment: string } {
  const definition = getWildlifeFocusDefinition(normalizeWildlifeScopeMode(mode));
  return {
    predator: definition.defaultPairing.predator,
    prey: definition.defaultPairing.prey,
    environment: definition.defaultPairing.environments[0],
  };
}

export function isPredatorCompatibleWithWildlifeScope(
  predator: string,
  mode: WildlifeScopeMode
): boolean {
  const canonicalMode = normalizeWildlifeScopeMode(mode);
  return getWildlifeFocusDefinition(canonicalMode).animals.some(
    (animal) => normalizeAnimalName(animal) === normalizeAnimalName(predator)
  );
}

export function isPairCompatibleWithWildlifeScope(
  predator: string,
  prey: string,
  mode: WildlifeScopeMode
): boolean {
  const canonicalMode = normalizeWildlifeScopeMode(mode);
  return getWildlifeFocusDefinition(canonicalMode).pairings.some((pairing) =>
    pairingMatches(pairing, predator, prey)
  );
}

export function filterPredatorOptionsByWildlifeScope(
  options: string[],
  mode: WildlifeScopeMode
): string[] {
  const canonicalMode = normalizeWildlifeScopeMode(mode);
  const available = new Set(options.map((option) => normalizeAnimalName(option)));
  const definition = getWildlifeFocusDefinition(canonicalMode);

  if (!definition.animals.length) {
    return Array.from(new Set(options));
  }

  return definition.animals.filter((animal) =>
    available.has(normalizeAnimalName(animal))
  );
}

export function filterPreyOptionsByWildlifeScope(
  predator: string,
  preyOptions: string[],
  mode: WildlifeScopeMode
): string[] {
  const canonicalMode = normalizeWildlifeScopeMode(mode);
  const unique = Array.from(new Set(preyOptions));

  const allowed = getPairingsForPredator(canonicalMode, predator).map(
    (pairing) =>
      normalizeAnimalName(pairing.predator) === normalizeAnimalName(predator)
        ? normalizeAnimalName(pairing.prey)
        : normalizeAnimalName(pairing.predator)
  );
  if (!allowed.length) return unique;

  const allowedSet = new Set(allowed);
  const filtered = unique.filter((option) =>
    allowedSet.has(normalizeAnimalName(option))
  );

  return filtered.length ? filtered : unique;
}

export function getWildlifeFocusEnvironmentSuggestion(
  mode: WildlifeScopeMode,
  predator: string,
  prey: string,
  fallback: string
): string {
  const canonicalMode = normalizeWildlifeScopeMode(mode);
  const pairing = getWildlifeFocusDefinition(canonicalMode).pairings.find(
    (item) => pairingMatches(item, predator, prey)
  );
  if (pairing) return pairing.environments[0];

  const predatorProfile = getWildlifeEnvironmentProfile(predator);
  if (predatorProfile) return predatorProfile.shortEnvironmentString;

  const preyProfile = getWildlifeEnvironmentProfile(prey);
  if (preyProfile) return preyProfile.shortEnvironmentString;

  return fallback;
}

export function getRegionalWildlifeStep1Hint(
  mode: WildlifeScopeMode,
  predator: string,
  prey: string
): string {
  const canonicalMode = normalizeWildlifeScopeMode(mode);
  const suggestedEnvironment = getWildlifeFocusEnvironmentSuggestion(
    canonicalMode,
    predator,
    prey,
    "animal-compatible terrain"
  );

  if (canonicalMode === "World Wide Wildlife") {
    return `World Wide Wildlife keeps the broader documentary library, but it still steers ${predator} and ${prey} toward ${suggestedEnvironment} so the terrain reads as believable at a glance.`;
  }

  return `${canonicalMode} biases this setup toward ${suggestedEnvironment} so viewers read the animals and the terrain faster.`;
}

export function getWildlifeHabitatCompatibilityGuidance(input: {
  mode: WildlifeScopeMode;
  predator: string;
  prey: string;
  habitat: HabitatPreset;
}): { label: string; message: string; isWarning: boolean } | null {
  const canonicalMode = normalizeWildlifeScopeMode(input.mode);
  const suggestedEnvironment = getWildlifeFocusEnvironmentSuggestion(
    canonicalMode,
    input.predator,
    input.prey,
    "animal-compatible terrain"
  );

  if (input.habitat === "Auto") {
    return {
      label: "Regional environment fit",
      message: `Auto habitat will stay biased toward ${suggestedEnvironment} for this focus mode.`,
      isWarning: false,
    };
  }

  const selectedTags = HABITAT_PRESET_TAGS[input.habitat];
  const profile = getWildlifeEnvironmentProfile(input.predator);
  if (!profile) {
    return {
      label: "Manual habitat override active",
      message: `This focus mode reads most cleanly around ${suggestedEnvironment}. Keep the manual habitat only if that mismatch is intentional.`,
      isWarning: true,
    };
  }

  const isCompatible = selectedTags.some((tag) =>
    profile.likelyHabitatTags.includes(tag)
  );
  if (isCompatible) {
    return {
      label: "Manual habitat still fits",
      message: `${input.habitat} still reads plausibly for ${input.predator}. ${suggestedEnvironment} remains the cleaner regional default if you want a simpler first test.`,
      isWarning: false,
    };
  }

  return {
    label: "Likely habitat mismatch",
    message: `${input.habitat} is a weaker regional fit for ${input.predator}. Safer environment suggestion: ${suggestedEnvironment}.`,
    isWarning: true,
  };
}

export function getWildlifeFocusPairings(
  mode: WildlifeScopeMode
): WildlifeFocusPairing[] {
  return getWildlifeFocusDefinition(normalizeWildlifeScopeMode(mode)).pairings;
}

export function getWildlifeFocusPairingHighlights(
  mode: WildlifeScopeMode,
  predator: string,
  prey: string
): { safeArcLabel: string | null; badges: string[] } {
  const pairing = getWildlifeFocusPairings(mode).find((item) =>
    pairingMatches(item, predator, prey)
  );

  return {
    safeArcLabel: pairing?.safeArcLabel ?? null,
    badges: pairing?.badges ? [...pairing.badges] : [],
  };
}

export function getWildlifeFocusSafetyDefaults(): string[] {
  return [...FACEBOOK_SAFE_SURVIVAL_DEFAULTS];
}

export function getSupportedWildlifeFocusAnimals(
  mode: WildlifeScopeMode
): string[] {
  const canonicalMode = normalizeWildlifeScopeMode(mode);
  return [...getWildlifeFocusDefinition(canonicalMode).animals];
}

export function getWildlifeFocusEnvironmentProfiles() {
  return ENVIRONMENT_PROFILES;
}

export function getHabitatPresetPrompt(
  habitat: Exclude<HabitatPreset, "Auto">
): string {
  return habitatPromptMap[habitat];
}
