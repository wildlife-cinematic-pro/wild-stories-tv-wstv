import { habitatPromptMap } from "@/lib/habitat-presets";

import type { HabitatPreset, WildlifeScopeMode } from "@/types";

export type CanonicalWildlifeScopeMode = Exclude<
  WildlifeScopeMode,
  "USA Wildlife"
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

type WildlifeFocusPairing = {
  predator: string;
  prey: string;
  environments: [string, ...string[]];
  habitatTags: HabitatTag[];
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

const LEGACY_SCOPE_ALIASES: Record<string, CanonicalWildlifeScopeMode> = {
  "USA Wildlife": "USA / Canada Wildlife",
};

const ANIMAL_ALIASES: Record<string, string> = {
  Elk: "Bull Elk",
  Deer: "White-tailed Deer",
  Fox: "Red Fox",
  "European Bison": "Bison",
  Wisent: "Bison",
  Goanna: "Monitor Lizard",
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

export const wildlifeScopeOptions: CanonicalWildlifeScopeMode[] = [
  "USA / Canada Wildlife",
  "Europe Wildlife",
  "Norway / Scandinavia Wildlife",
  "Australia Wildlife",
  "Global Viral Wildlife",
  "Low Drift First Test",
  "World Wildlife",
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
      "Worldwide high-recognition animals for fast Facebook tests, while staying inside the app’s current modeled species.",
    animals: [
      "Lion",
      "Tiger",
      "Leopard",
      "Cheetah",
      "Hyena",
      "Bear",
      "Wolf",
      "Wolf Pack",
      "Eagle",
      "Crocodile",
      "Alligator",
      "Great White Shark",
      "Orca",
      "Snake",
      "Bison",
      "Moose",
      "White-tailed Deer",
      "Kangaroo",
      "Dingo",
      "Mountain Lion",
      "Grizzly Bear",
      "Brown Bear",
      "Bull Elk",
      "Wild Boar",
    ],
    defaultPairing: {
      predator: "Lion",
      prey: "Wildebeest",
      environments: ["savanna golden hour grassland", "dust plain"],
      habitatTags: ["savanna", "open"],
    },
    pairings: [
      {
        predator: "Lion",
        prey: "Wildebeest",
        environments: ["savanna golden hour grassland", "dust plain"],
        habitatTags: ["savanna", "open"],
      },
      {
        predator: "Tiger",
        prey: "Wild Boar",
        environments: ["dense jungle river edge", "river forest"],
        habitatTags: ["jungle", "river", "forest"],
      },
      {
        predator: "Leopard",
        prey: "Antelope",
        environments: ["rocky savanna", "woodland edge"],
        habitatTags: ["savanna", "open", "woodland"],
      },
      {
        predator: "Cheetah",
        prey: "Gazelle",
        environments: ["open savanna", "dry grassland"],
        habitatTags: ["savanna", "open"],
      },
      {
        predator: "Hyena",
        prey: "Wildebeest",
        environments: ["dusty savanna", "river crossing"],
        habitatTags: ["savanna", "open", "river"],
      },
      {
        predator: "Crocodile",
        prey: "Zebra",
        environments: ["muddy river crossing"],
        habitatTags: ["river", "wetland"],
      },
      {
        predator: "Orca",
        prey: "Seal",
        environments: ["cold coastal water", "ice edge"],
        habitatTags: ["coast", "snow"],
      },
      {
        predator: "Great White Shark",
        prey: "Seal",
        environments: ["surf line", "open ocean"],
        habitatTags: ["coast", "open"],
      },
      {
        predator: "Bear",
        prey: "Bison",
        environments: ["snow valley", "open plain"],
        habitatTags: ["snow", "open", "mountain"],
      },
      {
        predator: "Wolf Pack",
        prey: "Bull Elk",
        environments: ["winter forest edge"],
        habitatTags: ["forest", "snow"],
      },
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
  "World Wildlife": {
    helperText:
      "Restores the full built-in list while keeping custom animals available and manual habitat choice unchanged.",
    animals: [],
    defaultPairing: {
      predator: "Mountain Lion",
      prey: "White-tailed Deer",
      environments: ["forest edge"],
      habitatTags: ["forest", "woodland"],
    },
    pairings: [],
  },
};

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
  return ANIMAL_ALIASES[name] ?? name;
}

function pairingMatches(
  pairing: WildlifeFocusPairing,
  predator: string,
  prey: string
): boolean {
  return (
    normalizeAnimalName(pairing.predator) === normalizeAnimalName(predator) &&
    normalizeAnimalName(pairing.prey) === normalizeAnimalName(prey)
  );
}

function getPairingsForPredator(
  mode: CanonicalWildlifeScopeMode,
  predator: string
): WildlifeFocusPairing[] {
  const normalizedPredator = normalizeAnimalName(predator);
  return WILDLIFE_FOCUS_DEFINITIONS[mode].pairings.filter(
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
  return WILDLIFE_FOCUS_DEFINITIONS[normalizeWildlifeScopeMode(mode)].helperText;
}

export function getWildlifeScopeDefaultSelection(
  mode: WildlifeScopeMode
): { predator: string; prey: string; environment: string } {
  const definition = WILDLIFE_FOCUS_DEFINITIONS[normalizeWildlifeScopeMode(mode)];
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
  if (canonicalMode === "World Wildlife") return true;
  return WILDLIFE_FOCUS_DEFINITIONS[canonicalMode].animals.some(
    (animal) => normalizeAnimalName(animal) === normalizeAnimalName(predator)
  );
}

export function isPairCompatibleWithWildlifeScope(
  predator: string,
  prey: string,
  mode: WildlifeScopeMode
): boolean {
  const canonicalMode = normalizeWildlifeScopeMode(mode);
  if (canonicalMode === "World Wildlife") return true;
  return WILDLIFE_FOCUS_DEFINITIONS[canonicalMode].pairings.some((pairing) =>
    pairingMatches(pairing, predator, prey)
  );
}

export function filterPredatorOptionsByWildlifeScope(
  options: string[],
  mode: WildlifeScopeMode
): string[] {
  const canonicalMode = normalizeWildlifeScopeMode(mode);
  const unique = Array.from(new Set(options));
  if (canonicalMode === "World Wildlife") return unique;

  const rank = new Map(
    WILDLIFE_FOCUS_DEFINITIONS[canonicalMode].animals.map((animal, index) => [
      normalizeAnimalName(animal),
      index,
    ])
  );

  return unique
    .filter((option) => rank.has(normalizeAnimalName(option)))
    .sort((a, b) => {
      const ai = rank.get(normalizeAnimalName(a)) ?? Number.MAX_SAFE_INTEGER;
      const bi = rank.get(normalizeAnimalName(b)) ?? Number.MAX_SAFE_INTEGER;
      return ai - bi || a.localeCompare(b);
    });
}

export function filterPreyOptionsByWildlifeScope(
  predator: string,
  preyOptions: string[],
  mode: WildlifeScopeMode
): string[] {
  const canonicalMode = normalizeWildlifeScopeMode(mode);
  const unique = Array.from(new Set(preyOptions));
  if (canonicalMode === "World Wildlife") return unique;

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
  if (canonicalMode === "World Wildlife") return fallback;

  {
    const pairing = WILDLIFE_FOCUS_DEFINITIONS[canonicalMode].pairings.find(
      (item) => pairingMatches(item, predator, prey)
    );
    if (pairing) return pairing.environments[0];
  }

  const predatorProfile = ENVIRONMENT_PROFILES[normalizeAnimalName(predator)];
  if (predatorProfile) return predatorProfile.shortEnvironmentString;

  const preyProfile = ENVIRONMENT_PROFILES[normalizeAnimalName(prey)];
  if (preyProfile) return preyProfile.shortEnvironmentString;

  return fallback;
}

export function getRegionalWildlifeStep1Hint(
  mode: WildlifeScopeMode,
  predator: string,
  prey: string
): string {
  const canonicalMode = normalizeWildlifeScopeMode(mode);
  if (canonicalMode === "World Wildlife") {
    return "World Wildlife keeps the full built-in list and lets the current animal pair drive the environment read.";
  }

  const suggestedEnvironment = getWildlifeFocusEnvironmentSuggestion(
    canonicalMode,
    predator,
    prey,
    "animal-compatible terrain"
  );

  return `${canonicalMode} biases this setup toward ${suggestedEnvironment} so viewers read the animals and the terrain faster.`;
}

export function getWildlifeHabitatCompatibilityGuidance(input: {
  mode: WildlifeScopeMode;
  predator: string;
  prey: string;
  habitat: HabitatPreset;
}): { label: string; message: string; isWarning: boolean } | null {
  const canonicalMode = normalizeWildlifeScopeMode(input.mode);
  if (canonicalMode === "World Wildlife") return null;

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
  const profile = ENVIRONMENT_PROFILES[normalizeAnimalName(input.predator)];
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
  return WILDLIFE_FOCUS_DEFINITIONS[normalizeWildlifeScopeMode(mode)].pairings;
}

export function getSupportedWildlifeFocusAnimals(
  mode: WildlifeScopeMode
): string[] {
  const canonicalMode = normalizeWildlifeScopeMode(mode);
  if (canonicalMode === "World Wildlife") return [];
  return [...WILDLIFE_FOCUS_DEFINITIONS[canonicalMode].animals];
}

export function getWildlifeFocusEnvironmentProfiles() {
  return ENVIRONMENT_PROFILES;
}

export function getHabitatPresetPrompt(
  habitat: Exclude<HabitatPreset, "Auto">
): string {
  return habitatPromptMap[habitat];
}
