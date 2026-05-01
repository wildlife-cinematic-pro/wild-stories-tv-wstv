import type { WildlifeScopeMode } from "@/types";

export type WildlifeLeadCategory =
  | "predator"
  | "defender"
  | "escape"
  | "documentary"
  | "wildlife";

export type WildlifeCatalogHabitatTag =
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

export type WildlifeCatalogBadge =
  | "USA viral"
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

export type WildlifeOpposingProfile = {
  animal: string;
  environments: [string, ...string[]];
  habitatTags: WildlifeCatalogHabitatTag[];
  safeArcLabel: string;
  badges: WildlifeCatalogBadge[];
  promptTemplateHint: string;
};

export type WildlifeLeadCatalogEntry = {
  leadAnimal: string;
  normalizedName: string;
  aliases: string[];
  viralRank: number;
  usaPriority: number;
  category: WildlifeLeadCategory;
  defaultOpposingAnimal: string;
  opposingAnimals: [string, ...string[]];
  primaryEnvironments: [string, ...string[]];
  secondaryEnvironments: string[];
  badges: WildlifeCatalogBadge[];
  safeArcLabels: string[];
  habitatTags: WildlifeCatalogHabitatTag[];
  promptTemplateHints: string[];
  safetyDefaults: string[];
  opposingProfiles: [WildlifeOpposingProfile, ...WildlifeOpposingProfile[]];
};

const ANIMAL_ALIASES: Record<string, string> = {
  "Elk": "Bull Elk",
  "Deer": "White-tailed Deer",
  "Fox": "Red Fox",
  "European Bison": "Bison",
  "Wisent": "Bison",
  "Goanna": "Monitor Lizard",
  "Cougar": "Mountain Lion",
  "Puma": "Mountain Lion",
  "Bear": "Brown Bear",
  "Eagle": "Golden Eagle",
  "Shark": "Great White Shark",
  "Snake": "Rattlesnake",
  "African Lion Male": "Lion",
  "Arctic Wolf": "Wolf",
  "American Alligator": "Alligator"
};

export function normalizeCatalogAnimalName(name: string): string {
  return ANIMAL_ALIASES[name] ?? name;
}

export const WORLD_WIDE_WILDLIFE_LEADS = [
  "Grizzly Bear",
  "Black Bear",
  "Wolf Pack",
  "Mountain Lion",
  "Bald Eagle",
  "Alligator",
  "Great White Shark",
  "Orca",
  "Bison",
  "Moose",
  "Bull Elk",
  "Polar Bear",
  "Wolverine",
  "Coyote",
  "Bobcat",
  "Golden Eagle",
  "White-tailed Deer",
  "Wild Boar",
  "Caribou",
  "Reindeer",
  "Mountain Goat",
  "Bighorn Sheep",
  "Mule Deer",
  "Sea Lion",
  "Wolf",
  "Brown Bear",
  "Lynx",
  "River Otter",
  "Red Fox",
  "Great Horned Owl",
  "Raccoon",
  "Salmon",
  "Rabbit",
  "Jackrabbit",
  "Quail",
  "Beaver",
  "Badger",
  "Black Mamba",
  "Crocodile",
  "Nile Crocodile",
  "Saltwater Crocodile",
  "Jaguar",
  "Lion",
  "Lion Pack",
  "Tiger",
  "Siberian Tiger",
  "Leopard",
  "Cheetah",
  "Hyena",
  "African Wild Dog",
  "Snow Leopard",
  "Komodo Dragon",
  "Harpy Eagle",
  "Leopard Seal",
  "Cape Buffalo",
  "Water Buffalo",
  "Warthog",
  "Gazelle",
  "Impala",
  "Antelope",
  "Zebra",
  "Wildebeest",
  "Elephant",
  "Rhinoceros",
  "Hippopotamus",
  "Gorilla",
  "Chimpanzee",
  "Anaconda",
  "Python",
  "King Cobra",
  "Caiman",
  "Tiger Shark",
  "Bull Shark",
  "Red Deer",
  "Pronghorn",
  "Roe Deer",
  "Arctic Fox",
  "White-tailed Eagle",
  "Seal",
  "Dolphin",
  "Wild Horse",
  "Kangaroo",
  "Dingo",
  "Freshwater Crocodile",
  "Koala",
  "Wombat",
  "Emu",
  "Cassowary",
  "Wedge-tailed Eagle",
  "Monitor Lizard",
  "Goat",
  "Ibex",
  "Tasmanian Devil",
  "Peregrine Falcon",
  "Musk Ox",
  "Hare",
  "Giraffe",
  "Opossum",
  "Rattlesnake",
  "Skunk"
] as const;
export const USA_VIRAL_WILDLIFE_LEADS = [
  "Grizzly Bear",
  "Black Bear",
  "Wolf Pack",
  "Mountain Lion",
  "Bald Eagle",
  "Alligator",
  "Great White Shark",
  "Orca",
  "Bison",
  "Moose",
  "Bull Elk",
  "Polar Bear",
  "Wolverine",
  "Coyote",
  "Bobcat",
  "Golden Eagle",
  "White-tailed Deer",
  "Wild Boar",
  "Caribou",
  "Reindeer",
  "Mountain Goat",
  "Bighorn Sheep",
  "Mule Deer",
  "Sea Lion",
  "Wolf",
  "Lynx",
  "River Otter",
  "Red Fox",
  "Great Horned Owl",
  "Beaver",
  "Raccoon",
  "Salmon",
  "Rabbit",
  "Jackrabbit",
  "Quail",
  "Badger",
  "Pronghorn"
] as const;
export const GLOBAL_VIRAL_WILDLIFE_LEADS = [
  "Crocodile",
  "Nile Crocodile",
  "Saltwater Crocodile",
  "Jaguar",
  "Lion",
  "Lion Pack",
  "Tiger",
  "Siberian Tiger",
  "Leopard",
  "Cheetah",
  "Hyena",
  "African Wild Dog",
  "Snow Leopard",
  "Komodo Dragon",
  "Harpy Eagle",
  "Leopard Seal",
  "Cape Buffalo",
  "Water Buffalo",
  "Warthog",
  "Gazelle",
  "Impala",
  "Antelope",
  "Zebra",
  "Wildebeest",
  "Elephant",
  "Rhinoceros",
  "Hippopotamus",
  "Gorilla",
  "Chimpanzee",
  "Anaconda",
  "Python",
  "King Cobra",
  "Caiman",
  "Tiger Shark",
  "Bull Shark"
] as const;
export const USA_CANADA_WILDLIFE_LEADS = [
  "Grizzly Bear",
  "Black Bear",
  "Wolf Pack",
  "Mountain Lion",
  "Bald Eagle",
  "Alligator",
  "Great White Shark",
  "Orca",
  "Bison",
  "Moose",
  "Bull Elk",
  "Polar Bear",
  "Wolverine",
  "Coyote",
  "Bobcat",
  "Golden Eagle",
  "White-tailed Deer",
  "Wild Boar",
  "Caribou",
  "Reindeer",
  "Mountain Goat",
  "Bighorn Sheep",
  "Mule Deer",
  "Sea Lion",
  "Wolf",
  "Lynx",
  "River Otter",
  "Red Fox",
  "Great Horned Owl",
  "Beaver",
  "Raccoon",
  "Salmon",
  "Rabbit",
  "Jackrabbit",
  "Quail",
  "Badger",
  "Pronghorn",
  "Musk Ox",
  "Arctic Fox",
  "Wild Horse"
] as const;

export const WILDLIFE_LEAD_CATALOG: WildlifeLeadCatalogEntry[] = [
  {
    "leadAnimal": "Grizzly Bear",
    "normalizedName": "grizzly-bear",
    "aliases": [],
    "viralRank": 1,
    "usaPriority": 1,
    "category": "predator",
    "defaultOpposingAnimal": "Bison",
    "opposingAnimals": [
      "Bison",
      "Moose",
      "Bull Elk",
      "Wolf Pack",
      "Salmon"
    ],
    "primaryEnvironments": [
      "Yellowstone valley",
      "mountain meadow",
      "salmon river"
    ],
    "secondaryEnvironments": [
      "snowy valley",
      "river corridor"
    ],
    "badges": [
      "USA viral",
      "Defender",
      "Low drift",
      "Pack pressure"
    ],
    "safeArcLabels": [
      "Defender stands ground",
      "Near-clash",
      "Survival encounter"
    ],
    "habitatTags": [
      "mountain",
      "meadow",
      "river",
      "open",
      "snow"
    ],
    "promptTemplateHints": [
      "Use strong shoulder mass, readable spacing, and grounded impact beats."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Bison",
        "environments": [
          "Yellowstone valley floor",
          "open prairie grassland",
          "snowy mountain meadow"
        ],
        "habitatTags": [
          "mountain",
          "meadow",
          "open"
        ],
        "safeArcLabel": "Defender stands ground",
        "badges": [
          "USA viral",
          "Defender",
          "Low drift"
        ],
        "promptTemplateHint": "Keep Grizzly Bear and Bison readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Moose",
        "environments": [
          "willow marsh edge",
          "mountain lake margin"
        ],
        "habitatTags": [
          "forest",
          "river",
          "wetland"
        ],
        "safeArcLabel": "Near-clash",
        "badges": [
          "USA viral",
          "Defender"
        ],
        "promptTemplateHint": "Keep Grizzly Bear and Moose readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Bull Elk",
        "environments": [
          "Rocky Mountain meadow",
          "treeline clearing"
        ],
        "habitatTags": [
          "mountain",
          "meadow",
          "forest"
        ],
        "safeArcLabel": "Near-clash",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Grizzly Bear and Bull Elk readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Wolf Pack",
        "environments": [
          "Yellowstone open meadow",
          "boreal valley cut"
        ],
        "habitatTags": [
          "open",
          "meadow",
          "forest"
        ],
        "safeArcLabel": "Near-clash",
        "badges": [
          "USA viral",
          "Pack pressure"
        ],
        "promptTemplateHint": "Keep Grizzly Bear and Wolf Pack readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Salmon",
        "environments": [
          "Yellowstone valley"
        ],
        "habitatTags": [
          "mountain",
          "meadow",
          "river",
          "open",
          "snow"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Grizzly Bear and Salmon readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Black Bear",
    "normalizedName": "black-bear",
    "aliases": [],
    "viralRank": 2,
    "usaPriority": 2,
    "category": "predator",
    "defaultOpposingAnimal": "White-tailed Deer",
    "opposingAnimals": [
      "White-tailed Deer",
      "Salmon",
      "Rabbit",
      "Ground Squirrel",
      "White-tailed Deer Fawn"
    ],
    "primaryEnvironments": [
      "Appalachian forest and Smoky Mountain creekside with clean foraging lanes and readable prey spacing"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "USA viral",
      "Fast hook"
    ],
    "safeArcLabels": [
      "Ambush tension",
      "Fishing strike",
      "Survival encounter"
    ],
    "habitatTags": [
      "forest",
      "mountain",
      "river"
    ],
    "promptTemplateHints": [
      "Use Black Bear with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "White-tailed Deer",
        "environments": [
          "Appalachian forest edge",
          "brushy creek corridor"
        ],
        "habitatTags": [
          "forest",
          "woodland",
          "river"
        ],
        "safeArcLabel": "Ambush tension",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Black Bear and White-tailed Deer readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Salmon",
        "environments": [
          "Smoky Mountain creek crossing",
          "cold river pocket"
        ],
        "habitatTags": [
          "river",
          "forest",
          "mountain"
        ],
        "safeArcLabel": "Fishing strike",
        "badges": [
          "USA viral",
          "Fast hook"
        ],
        "promptTemplateHint": "Keep Black Bear and Salmon readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Rabbit",
        "environments": [
          "Appalachian forest and Smoky Mountain creekside with clean foraging lanes and readable prey spacing"
        ],
        "habitatTags": [
          "forest",
          "mountain",
          "river"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Black Bear and Rabbit readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Ground Squirrel",
        "environments": [
          "Appalachian forest and Smoky Mountain creekside with clean foraging lanes and readable prey spacing"
        ],
        "habitatTags": [
          "forest",
          "mountain",
          "river"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Black Bear and Ground Squirrel readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "White-tailed Deer Fawn",
        "environments": [
          "Appalachian forest and Smoky Mountain creekside with clean foraging lanes and readable prey spacing"
        ],
        "habitatTags": [
          "forest",
          "mountain",
          "river"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Black Bear and White-tailed Deer Fawn readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Wolf Pack",
    "normalizedName": "wolf-pack",
    "aliases": [],
    "viralRank": 3,
    "usaPriority": 3,
    "category": "predator",
    "defaultOpposingAnimal": "Bison",
    "opposingAnimals": [
      "Bison",
      "Moose",
      "Bull Elk",
      "White-tailed Deer",
      "Mule Deer"
    ],
    "primaryEnvironments": [
      "Rocky Mountain meadow",
      "boreal forest edge",
      "snowy valley corridor"
    ],
    "secondaryEnvironments": [
      "sage valley"
    ],
    "badges": [
      "USA viral",
      "Pack pressure",
      "Defender",
      "Low drift"
    ],
    "safeArcLabels": [
      "Defender stands ground",
      "Pack pressure"
    ],
    "habitatTags": [
      "forest",
      "open",
      "snow",
      "river"
    ],
    "promptTemplateHints": [
      "Favor clear pack spacing and one readable pressure lane."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Bison",
        "environments": [
          "Yellowstone valley floor",
          "windy prairie opening"
        ],
        "habitatTags": [
          "open",
          "meadow",
          "snow"
        ],
        "safeArcLabel": "Defender stands ground",
        "badges": [
          "USA viral",
          "Pack pressure",
          "Defender"
        ],
        "promptTemplateHint": "Keep Wolf Pack and Bison readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Moose",
        "environments": [
          "boreal forest edge",
          "snowy woodland corridor",
          "willow marsh edge"
        ],
        "habitatTags": [
          "forest",
          "snow",
          "river"
        ],
        "safeArcLabel": "Pack pressure",
        "badges": [
          "USA viral",
          "Pack pressure"
        ],
        "promptTemplateHint": "Keep Wolf Pack and Moose readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Bull Elk",
        "environments": [
          "Rocky Mountain forest edge",
          "open snowfield"
        ],
        "habitatTags": [
          "forest",
          "snow",
          "open"
        ],
        "safeArcLabel": "Pack pressure",
        "badges": [
          "USA viral",
          "Pack pressure",
          "Low drift"
        ],
        "promptTemplateHint": "Keep Wolf Pack and Bull Elk readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "White-tailed Deer",
        "environments": [
          "Rocky Mountain meadow"
        ],
        "habitatTags": [
          "forest",
          "open",
          "snow",
          "river"
        ],
        "safeArcLabel": "Pack pressure",
        "badges": [
          "USA viral",
          "Pack pressure"
        ],
        "promptTemplateHint": "Keep Wolf Pack and White-tailed Deer readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Mule Deer",
        "environments": [
          "Rocky Mountain meadow"
        ],
        "habitatTags": [
          "forest",
          "open",
          "snow",
          "river"
        ],
        "safeArcLabel": "Pack pressure",
        "badges": [
          "USA viral",
          "Pack pressure"
        ],
        "promptTemplateHint": "Keep Wolf Pack and Mule Deer readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Mountain Lion",
    "normalizedName": "mountain-lion",
    "aliases": [],
    "viralRank": 4,
    "usaPriority": 4,
    "category": "predator",
    "defaultOpposingAnimal": "White-tailed Deer",
    "opposingAnimals": [
      "White-tailed Deer",
      "Mule Deer",
      "Bighorn Sheep",
      "Coyote",
      "Elk Calf"
    ],
    "primaryEnvironments": [
      "rocky ridge",
      "forest edge",
      "brushy slope"
    ],
    "secondaryEnvironments": [
      "broken treeline meadow"
    ],
    "badges": [
      "USA viral",
      "Low drift",
      "Near-clash"
    ],
    "safeArcLabels": [
      "Ambush tension",
      "Cliffhanger survival tension",
      "Near-clash"
    ],
    "habitatTags": [
      "mountain",
      "forest",
      "woodland",
      "open"
    ],
    "promptTemplateHints": [
      "Use broken cover and clean ambush lanes."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "White-tailed Deer",
        "environments": [
          "rocky ridge"
        ],
        "habitatTags": [
          "mountain",
          "forest",
          "woodland",
          "open"
        ],
        "safeArcLabel": "Ambush tension",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Mountain Lion and White-tailed Deer readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Mule Deer",
        "environments": [
          "rocky ridge",
          "forest edge",
          "brushy slope"
        ],
        "habitatTags": [
          "mountain",
          "forest",
          "woodland"
        ],
        "safeArcLabel": "Ambush tension",
        "badges": [
          "USA viral",
          "Low drift"
        ],
        "promptTemplateHint": "Keep Mountain Lion and Mule Deer readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Bighorn Sheep",
        "environments": [
          "rocky cliff shelf",
          "alpine ridge ledge"
        ],
        "habitatTags": [
          "mountain",
          "open"
        ],
        "safeArcLabel": "Cliffhanger survival tension",
        "badges": [
          "USA viral",
          "Near-clash"
        ],
        "promptTemplateHint": "Keep Mountain Lion and Bighorn Sheep readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Coyote",
        "environments": [
          "brushy slope",
          "rocky woodland shelf"
        ],
        "habitatTags": [
          "mountain",
          "woodland",
          "open"
        ],
        "safeArcLabel": "Near-clash",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Mountain Lion and Coyote readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Elk Calf",
        "environments": [
          "rocky ridge"
        ],
        "habitatTags": [
          "mountain",
          "forest",
          "woodland",
          "open"
        ],
        "safeArcLabel": "Ambush tension",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Mountain Lion and Elk Calf readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Bald Eagle",
    "normalizedName": "bald-eagle",
    "aliases": [],
    "viralRank": 5,
    "usaPriority": 5,
    "category": "predator",
    "defaultOpposingAnimal": "Salmon",
    "opposingAnimals": [
      "Salmon",
      "Rabbit",
      "Trout",
      "Duck"
    ],
    "primaryEnvironments": [
      "cold river bend",
      "lakeshore shallows",
      "rocky river edge"
    ],
    "secondaryEnvironments": [
      "river mouth"
    ],
    "badges": [
      "USA viral",
      "Fast hook",
      "Low drift"
    ],
    "safeArcLabels": [
      "Fishing strike",
      "Sudden lunge"
    ],
    "habitatTags": [
      "river",
      "coast",
      "mountain"
    ],
    "promptTemplateHints": [
      "Keep strike lanes clean with strong wing silhouette readability."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Salmon",
        "environments": [
          "cold river bend",
          "Alaskan river mouth",
          "rocky river edge"
        ],
        "habitatTags": [
          "river",
          "coast",
          "forest"
        ],
        "safeArcLabel": "Fishing strike",
        "badges": [
          "USA viral",
          "Fast hook",
          "Low drift"
        ],
        "promptTemplateHint": "Keep Bald Eagle and Salmon readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Rabbit",
        "environments": [
          "lakeshore grass edge",
          "open riverside flat"
        ],
        "habitatTags": [
          "river",
          "open",
          "meadow"
        ],
        "safeArcLabel": "Sudden lunge",
        "badges": [
          "Fast hook"
        ],
        "promptTemplateHint": "Keep Bald Eagle and Rabbit readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Trout",
        "environments": [
          "cold river bend"
        ],
        "habitatTags": [
          "river",
          "coast",
          "mountain"
        ],
        "safeArcLabel": "Sudden lunge",
        "badges": [
          "USA viral",
          "Fast hook"
        ],
        "promptTemplateHint": "Keep Bald Eagle and Trout readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Duck",
        "environments": [
          "cold river bend"
        ],
        "habitatTags": [
          "river",
          "coast",
          "mountain"
        ],
        "safeArcLabel": "Sudden lunge",
        "badges": [
          "USA viral",
          "Fast hook"
        ],
        "promptTemplateHint": "Keep Bald Eagle and Duck readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Alligator",
    "normalizedName": "alligator",
    "aliases": [],
    "viralRank": 6,
    "usaPriority": 6,
    "category": "predator",
    "defaultOpposingAnimal": "White-tailed Deer",
    "opposingAnimals": [
      "White-tailed Deer",
      "Wild Boar",
      "Raccoon",
      "Large Fish"
    ],
    "primaryEnvironments": [
      "Everglades marsh",
      "cypress swamp edge",
      "muddy waterline"
    ],
    "secondaryEnvironments": [
      "tannin-water marsh edge"
    ],
    "badges": [
      "USA viral",
      "Water ambush",
      "Low drift"
    ],
    "safeArcLabels": [
      "Sudden lunge",
      "Waterhole ambush",
      "Ambush tension",
      "Water ambush"
    ],
    "habitatTags": [
      "swamp",
      "wetland",
      "river"
    ],
    "promptTemplateHints": [
      "Keep the body low at the waterline with explosive but readable ambush motion."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "White-tailed Deer",
        "environments": [
          "swamp edge",
          "tannin-water marsh edge",
          "muddy waterline"
        ],
        "habitatTags": [
          "swamp",
          "wetland",
          "river"
        ],
        "safeArcLabel": "Sudden lunge",
        "badges": [
          "USA viral",
          "Water ambush",
          "Low drift"
        ],
        "promptTemplateHint": "Keep Alligator and White-tailed Deer readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Wild Boar",
        "environments": [
          "muddy Everglades waterline",
          "cypress swamp edge"
        ],
        "habitatTags": [
          "swamp",
          "wetland",
          "river"
        ],
        "safeArcLabel": "Waterhole ambush",
        "badges": [
          "USA viral",
          "Water ambush",
          "Low drift"
        ],
        "promptTemplateHint": "Keep Alligator and Wild Boar readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Raccoon",
        "environments": [
          "night marsh edge",
          "shallow cypress channel"
        ],
        "habitatTags": [
          "swamp",
          "wetland",
          "river"
        ],
        "safeArcLabel": "Ambush tension",
        "badges": [
          "Water ambush"
        ],
        "promptTemplateHint": "Keep Alligator and Raccoon readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Large Fish",
        "environments": [
          "Everglades marsh"
        ],
        "habitatTags": [
          "swamp",
          "wetland",
          "river"
        ],
        "safeArcLabel": "Water ambush",
        "badges": [
          "USA viral",
          "Water ambush"
        ],
        "promptTemplateHint": "Keep Alligator and Large Fish readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Great White Shark",
    "normalizedName": "great-white-shark",
    "aliases": [],
    "viralRank": 7,
    "usaPriority": 7,
    "category": "predator",
    "defaultOpposingAnimal": "Seal",
    "opposingAnimals": [
      "Seal",
      "Sea Lion",
      "Fish",
      "Dolphin"
    ],
    "primaryEnvironments": [
      "cold coastal water",
      "surf line",
      "open ocean break"
    ],
    "secondaryEnvironments": [
      "seal colony whitewash"
    ],
    "badges": [
      "USA viral",
      "Fast hook",
      "Low drift",
      "Water ambush"
    ],
    "safeArcLabels": [
      "Sudden lunge",
      "Near-clash",
      "Water ambush"
    ],
    "habitatTags": [
      "coast",
      "open"
    ],
    "promptTemplateHints": [
      "Keep the shark in ocean or surf environments only."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Seal",
        "environments": [
          "cold coastal water",
          "surf line",
          "seal colony whitewash"
        ],
        "habitatTags": [
          "coast",
          "open"
        ],
        "safeArcLabel": "Sudden lunge",
        "badges": [
          "USA viral",
          "Fast hook",
          "Low drift"
        ],
        "promptTemplateHint": "Keep Great White Shark and Seal readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Sea Lion",
        "environments": [
          "surf line",
          "offshore rocky coast",
          "seal colony wash"
        ],
        "habitatTags": [
          "coast",
          "open"
        ],
        "safeArcLabel": "Near-clash",
        "badges": [
          "USA viral",
          "Fast hook"
        ],
        "promptTemplateHint": "Keep Great White Shark and Sea Lion readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Fish",
        "environments": [
          "cold coastal water"
        ],
        "habitatTags": [
          "coast",
          "open"
        ],
        "safeArcLabel": "Water ambush",
        "badges": [
          "USA viral",
          "Water ambush"
        ],
        "promptTemplateHint": "Keep Great White Shark and Fish readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Dolphin",
        "environments": [
          "cold coastal water"
        ],
        "habitatTags": [
          "coast",
          "open"
        ],
        "safeArcLabel": "Water ambush",
        "badges": [
          "USA viral",
          "Water ambush"
        ],
        "promptTemplateHint": "Keep Great White Shark and Dolphin readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Orca",
    "normalizedName": "orca",
    "aliases": [],
    "viralRank": 8,
    "usaPriority": 8,
    "category": "predator",
    "defaultOpposingAnimal": "Seal",
    "opposingAnimals": [
      "Seal",
      "Sea Lion",
      "Fish",
      "Great White Shark",
      "Dolphin"
    ],
    "primaryEnvironments": [
      "icy fjord",
      "cold coastal channel",
      "open subarctic water"
    ],
    "secondaryEnvironments": [
      "storm-dark Pacific surface lane"
    ],
    "badges": [
      "USA viral",
      "Fast hook",
      "Low drift",
      "Water ambush",
      "Near-clash"
    ],
    "safeArcLabels": [
      "Sudden lunge",
      "Chase pressure",
      "Water ambush",
      "Near-clash"
    ],
    "habitatTags": [
      "coast",
      "open",
      "snow"
    ],
    "promptTemplateHints": [
      "Keep the scene in cold marine water with strong scale readability."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Seal",
        "environments": [
          "icy fjord",
          "cold coastal channel",
          "open subarctic water"
        ],
        "habitatTags": [
          "coast",
          "open",
          "snow"
        ],
        "safeArcLabel": "Sudden lunge",
        "badges": [
          "USA viral",
          "Fast hook",
          "Low drift"
        ],
        "promptTemplateHint": "Keep Orca and Seal readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Sea Lion",
        "environments": [
          "cold coastal channel",
          "rocky coastal break"
        ],
        "habitatTags": [
          "coast",
          "open"
        ],
        "safeArcLabel": "Chase pressure",
        "badges": [
          "USA viral",
          "Fast hook"
        ],
        "promptTemplateHint": "Keep Orca and Sea Lion readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Fish",
        "environments": [
          "icy fjord"
        ],
        "habitatTags": [
          "coast",
          "open",
          "snow"
        ],
        "safeArcLabel": "Water ambush",
        "badges": [
          "USA viral",
          "Water ambush"
        ],
        "promptTemplateHint": "Keep Orca and Fish readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Great White Shark",
        "environments": [
          "cold Pacific offshore water",
          "storm-dark open coast"
        ],
        "habitatTags": [
          "coast",
          "open"
        ],
        "safeArcLabel": "Near-clash",
        "badges": [
          "USA viral",
          "Near-clash"
        ],
        "promptTemplateHint": "Keep Orca and Great White Shark readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Dolphin",
        "environments": [
          "icy fjord"
        ],
        "habitatTags": [
          "coast",
          "open",
          "snow"
        ],
        "safeArcLabel": "Water ambush",
        "badges": [
          "USA viral",
          "Water ambush"
        ],
        "promptTemplateHint": "Keep Orca and Dolphin readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Bison",
    "normalizedName": "bison",
    "aliases": [],
    "viralRank": 9,
    "usaPriority": 9,
    "category": "defender",
    "defaultOpposingAnimal": "Wolf Pack",
    "opposingAnimals": [
      "Wolf Pack",
      "Grizzly Bear",
      "Mountain Lion",
      "Wolf"
    ],
    "primaryEnvironments": [
      "Yellowstone open prairie grassland with dry field depth, cold clean air, and wide defender-readable spacing"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "USA viral",
      "Defender"
    ],
    "safeArcLabels": [
      "Defender stands ground"
    ],
    "habitatTags": [
      "desert",
      "meadow",
      "open",
      "savanna"
    ],
    "promptTemplateHints": [
      "Use Bison with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Wolf Pack",
        "environments": [
          "Yellowstone open prairie grassland with dry field depth, cold clean air, and wide defender-readable spacing"
        ],
        "habitatTags": [
          "desert",
          "meadow",
          "open",
          "savanna"
        ],
        "safeArcLabel": "Defender stands ground",
        "badges": [
          "USA viral",
          "Defender"
        ],
        "promptTemplateHint": "Keep Bison and Wolf Pack readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Grizzly Bear",
        "environments": [
          "Yellowstone open prairie grassland with dry field depth, cold clean air, and wide defender-readable spacing"
        ],
        "habitatTags": [
          "desert",
          "meadow",
          "open",
          "savanna"
        ],
        "safeArcLabel": "Defender stands ground",
        "badges": [
          "USA viral",
          "Defender"
        ],
        "promptTemplateHint": "Keep Bison and Grizzly Bear readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Mountain Lion",
        "environments": [
          "Yellowstone open prairie grassland with dry field depth, cold clean air, and wide defender-readable spacing"
        ],
        "habitatTags": [
          "desert",
          "meadow",
          "open",
          "savanna"
        ],
        "safeArcLabel": "Defender stands ground",
        "badges": [
          "USA viral",
          "Defender"
        ],
        "promptTemplateHint": "Keep Bison and Mountain Lion readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Wolf",
        "environments": [
          "Yellowstone open prairie grassland with dry field depth, cold clean air, and wide defender-readable spacing"
        ],
        "habitatTags": [
          "desert",
          "meadow",
          "open",
          "savanna"
        ],
        "safeArcLabel": "Defender stands ground",
        "badges": [
          "USA viral",
          "Defender"
        ],
        "promptTemplateHint": "Keep Bison and Wolf readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Moose",
    "normalizedName": "moose",
    "aliases": [],
    "viralRank": 10,
    "usaPriority": 10,
    "category": "defender",
    "defaultOpposingAnimal": "Wolf Pack",
    "opposingAnimals": [
      "Wolf Pack",
      "Grizzly Bear",
      "Mountain Lion",
      "Wolf"
    ],
    "primaryEnvironments": [
      "northern lake edge, willow marsh, and open autumn clearing with strong defender-readable spacing"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "USA viral",
      "Defender"
    ],
    "safeArcLabels": [
      "Defender stands ground"
    ],
    "habitatTags": [
      "open",
      "river",
      "wetland"
    ],
    "promptTemplateHints": [
      "Use Moose with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Wolf Pack",
        "environments": [
          "northern lake edge, willow marsh, and open autumn clearing with strong defender-readable spacing"
        ],
        "habitatTags": [
          "open",
          "river",
          "wetland"
        ],
        "safeArcLabel": "Defender stands ground",
        "badges": [
          "USA viral",
          "Defender"
        ],
        "promptTemplateHint": "Keep Moose and Wolf Pack readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Grizzly Bear",
        "environments": [
          "northern lake edge, willow marsh, and open autumn clearing with strong defender-readable spacing"
        ],
        "habitatTags": [
          "open",
          "river",
          "wetland"
        ],
        "safeArcLabel": "Defender stands ground",
        "badges": [
          "USA viral",
          "Defender"
        ],
        "promptTemplateHint": "Keep Moose and Grizzly Bear readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Mountain Lion",
        "environments": [
          "northern lake edge, willow marsh, and open autumn clearing with strong defender-readable spacing"
        ],
        "habitatTags": [
          "open",
          "river",
          "wetland"
        ],
        "safeArcLabel": "Defender stands ground",
        "badges": [
          "USA viral",
          "Defender"
        ],
        "promptTemplateHint": "Keep Moose and Mountain Lion readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Wolf",
        "environments": [
          "northern lake edge, willow marsh, and open autumn clearing with strong defender-readable spacing"
        ],
        "habitatTags": [
          "open",
          "river",
          "wetland"
        ],
        "safeArcLabel": "Defender stands ground",
        "badges": [
          "USA viral",
          "Defender"
        ],
        "promptTemplateHint": "Keep Moose and Wolf readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Bull Elk",
    "normalizedName": "bull-elk",
    "aliases": [],
    "viralRank": 11,
    "usaPriority": 11,
    "category": "defender",
    "defaultOpposingAnimal": "Wolf Pack",
    "opposingAnimals": [
      "Wolf Pack",
      "Grizzly Bear",
      "Mountain Lion",
      "Wolf"
    ],
    "primaryEnvironments": [
      "Rocky Mountain autumn meadow with frost, distant peaks, and strong defender-readable open spacing"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "USA viral",
      "Defender"
    ],
    "safeArcLabels": [
      "Defender stands ground"
    ],
    "habitatTags": [
      "meadow",
      "mountain",
      "open"
    ],
    "promptTemplateHints": [
      "Use Bull Elk with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Wolf Pack",
        "environments": [
          "Rocky Mountain autumn meadow with frost, distant peaks, and strong defender-readable open spacing"
        ],
        "habitatTags": [
          "meadow",
          "mountain",
          "open"
        ],
        "safeArcLabel": "Defender stands ground",
        "badges": [
          "USA viral",
          "Defender"
        ],
        "promptTemplateHint": "Keep Bull Elk and Wolf Pack readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Grizzly Bear",
        "environments": [
          "Rocky Mountain autumn meadow with frost, distant peaks, and strong defender-readable open spacing"
        ],
        "habitatTags": [
          "meadow",
          "mountain",
          "open"
        ],
        "safeArcLabel": "Defender stands ground",
        "badges": [
          "USA viral",
          "Defender"
        ],
        "promptTemplateHint": "Keep Bull Elk and Grizzly Bear readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Mountain Lion",
        "environments": [
          "Rocky Mountain autumn meadow with frost, distant peaks, and strong defender-readable open spacing"
        ],
        "habitatTags": [
          "meadow",
          "mountain",
          "open"
        ],
        "safeArcLabel": "Defender stands ground",
        "badges": [
          "USA viral",
          "Defender"
        ],
        "promptTemplateHint": "Keep Bull Elk and Mountain Lion readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Wolf",
        "environments": [
          "Rocky Mountain autumn meadow with frost, distant peaks, and strong defender-readable open spacing"
        ],
        "habitatTags": [
          "meadow",
          "mountain",
          "open"
        ],
        "safeArcLabel": "Defender stands ground",
        "badges": [
          "USA viral",
          "Defender"
        ],
        "promptTemplateHint": "Keep Bull Elk and Wolf readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Polar Bear",
    "normalizedName": "polar-bear",
    "aliases": [],
    "viralRank": 12,
    "usaPriority": 12,
    "category": "predator",
    "defaultOpposingAnimal": "Seal",
    "opposingAnimals": [
      "Seal",
      "Fish",
      "Arctic Fox"
    ],
    "primaryEnvironments": [
      "Arctic sea ice with open water leads"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "USA viral",
      "Low drift"
    ],
    "safeArcLabels": [
      "Ambush tension",
      "Survival encounter"
    ],
    "habitatTags": [
      "coast",
      "open",
      "snow"
    ],
    "promptTemplateHints": [
      "Use Polar Bear with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Seal",
        "environments": [
          "Arctic ice edge",
          "open sea lead"
        ],
        "habitatTags": [
          "snow",
          "coast",
          "open"
        ],
        "safeArcLabel": "Ambush tension",
        "badges": [
          "USA viral",
          "Low drift"
        ],
        "promptTemplateHint": "Keep Polar Bear and Seal readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Fish",
        "environments": [
          "Arctic sea ice with open water leads"
        ],
        "habitatTags": [
          "coast",
          "open",
          "snow"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Polar Bear and Fish readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Arctic Fox",
        "environments": [
          "Arctic sea ice with open water leads"
        ],
        "habitatTags": [
          "coast",
          "open",
          "snow"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Polar Bear and Arctic Fox readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Wolverine",
    "normalizedName": "wolverine",
    "aliases": [],
    "viralRank": 13,
    "usaPriority": 13,
    "category": "predator",
    "defaultOpposingAnimal": "Rabbit",
    "opposingAnimals": [
      "Rabbit",
      "Reindeer",
      "Beaver",
      "Moose Calf"
    ],
    "primaryEnvironments": [
      "boreal forest and tundra in deep snow"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "USA viral",
      "Defender"
    ],
    "safeArcLabels": [
      "Survival encounter",
      "Defender stands ground"
    ],
    "habitatTags": [
      "forest",
      "snow",
      "tundra"
    ],
    "promptTemplateHints": [
      "Use Wolverine with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Rabbit",
        "environments": [
          "boreal forest and tundra in deep snow"
        ],
        "habitatTags": [
          "forest",
          "snow",
          "tundra"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Wolverine and Rabbit readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Reindeer",
        "environments": [
          "snowy tundra cut",
          "boreal treeline opening"
        ],
        "habitatTags": [
          "snow",
          "tundra",
          "forest"
        ],
        "safeArcLabel": "Defender stands ground",
        "badges": [
          "USA viral",
          "Defender"
        ],
        "promptTemplateHint": "Keep Wolverine and Reindeer readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Beaver",
        "environments": [
          "boreal forest and tundra in deep snow"
        ],
        "habitatTags": [
          "forest",
          "snow",
          "tundra"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Wolverine and Beaver readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Moose Calf",
        "environments": [
          "boreal forest and tundra in deep snow"
        ],
        "habitatTags": [
          "forest",
          "snow",
          "tundra"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Wolverine and Moose Calf readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Coyote",
    "normalizedName": "coyote",
    "aliases": [],
    "viralRank": 14,
    "usaPriority": 14,
    "category": "predator",
    "defaultOpposingAnimal": "White-tailed Deer",
    "opposingAnimals": [
      "White-tailed Deer",
      "Rabbit",
      "Jackrabbit",
      "Quail",
      "White-tailed Deer Fawn"
    ],
    "primaryEnvironments": [
      "sagebrush flat",
      "prairie scrub edge",
      "brushline opening"
    ],
    "secondaryEnvironments": [
      "open field edge"
    ],
    "badges": [
      "USA viral",
      "Fast hook",
      "Chase pressure"
    ],
    "safeArcLabels": [
      "Ambush tension",
      "Last-second escape",
      "Chase pressure",
      "Sudden lunge"
    ],
    "habitatTags": [
      "open",
      "desert",
      "woodland",
      "meadow"
    ],
    "promptTemplateHints": [
      "Use Coyote with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "White-tailed Deer",
        "environments": [
          "sagebrush flat"
        ],
        "habitatTags": [
          "open",
          "desert",
          "woodland",
          "meadow"
        ],
        "safeArcLabel": "Ambush tension",
        "badges": [
          "USA viral",
          "Fast hook"
        ],
        "promptTemplateHint": "Keep Coyote and White-tailed Deer readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Rabbit",
        "environments": [
          "brushline opening",
          "cold field edge"
        ],
        "habitatTags": [
          "open",
          "woodland",
          "meadow"
        ],
        "safeArcLabel": "Last-second escape",
        "badges": [
          "USA viral",
          "Chase pressure"
        ],
        "promptTemplateHint": "Keep Coyote and Rabbit readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Jackrabbit",
        "environments": [
          "sagebrush flat",
          "prairie scrub edge",
          "brushline opening"
        ],
        "habitatTags": [
          "open",
          "desert",
          "woodland"
        ],
        "safeArcLabel": "Chase pressure",
        "badges": [
          "USA viral",
          "Chase pressure"
        ],
        "promptTemplateHint": "Keep Coyote and Jackrabbit readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Quail",
        "environments": [
          "dry brush opening",
          "sage wash edge"
        ],
        "habitatTags": [
          "open",
          "desert",
          "woodland"
        ],
        "safeArcLabel": "Sudden lunge",
        "badges": [
          "USA viral",
          "Fast hook"
        ],
        "promptTemplateHint": "Keep Coyote and Quail readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "White-tailed Deer Fawn",
        "environments": [
          "sagebrush flat"
        ],
        "habitatTags": [
          "open",
          "desert",
          "woodland",
          "meadow"
        ],
        "safeArcLabel": "Ambush tension",
        "badges": [
          "USA viral",
          "Fast hook"
        ],
        "promptTemplateHint": "Keep Coyote and White-tailed Deer Fawn readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Bobcat",
    "normalizedName": "bobcat",
    "aliases": [],
    "viralRank": 15,
    "usaPriority": 15,
    "category": "predator",
    "defaultOpposingAnimal": "Rabbit",
    "opposingAnimals": [
      "Rabbit",
      "Quail",
      "Squirrel",
      "Wild Turkey"
    ],
    "primaryEnvironments": [
      "rocky brush pocket",
      "desert scrub edge",
      "scrub grass opening"
    ],
    "secondaryEnvironments": [
      "low brush wash"
    ],
    "badges": [
      "USA viral",
      "Low drift",
      "Fast hook"
    ],
    "safeArcLabels": [
      "Ambush tension",
      "Sudden lunge"
    ],
    "habitatTags": [
      "desert",
      "open",
      "woodland"
    ],
    "promptTemplateHints": [
      "Use Bobcat with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Rabbit",
        "environments": [
          "rocky brush pocket",
          "desert scrub edge"
        ],
        "habitatTags": [
          "desert",
          "open",
          "woodland"
        ],
        "safeArcLabel": "Ambush tension",
        "badges": [
          "USA viral",
          "Low drift"
        ],
        "promptTemplateHint": "Keep Bobcat and Rabbit readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Quail",
        "environments": [
          "scrub grass opening",
          "low brush wash"
        ],
        "habitatTags": [
          "desert",
          "open",
          "woodland"
        ],
        "safeArcLabel": "Sudden lunge",
        "badges": [
          "USA viral",
          "Fast hook"
        ],
        "promptTemplateHint": "Keep Bobcat and Quail readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Squirrel",
        "environments": [
          "rocky brush pocket"
        ],
        "habitatTags": [
          "desert",
          "open",
          "woodland"
        ],
        "safeArcLabel": "Ambush tension",
        "badges": [
          "USA viral",
          "Fast hook"
        ],
        "promptTemplateHint": "Keep Bobcat and Squirrel readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Wild Turkey",
        "environments": [
          "rocky brush pocket"
        ],
        "habitatTags": [
          "desert",
          "open",
          "woodland"
        ],
        "safeArcLabel": "Ambush tension",
        "badges": [
          "USA viral",
          "Fast hook"
        ],
        "promptTemplateHint": "Keep Bobcat and Wild Turkey readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Golden Eagle",
    "normalizedName": "golden-eagle",
    "aliases": [],
    "viralRank": 16,
    "usaPriority": 16,
    "category": "predator",
    "defaultOpposingAnimal": "Rabbit",
    "opposingAnimals": [
      "Rabbit",
      "Red Fox",
      "Marmot",
      "Pheasant"
    ],
    "primaryEnvironments": [
      "open highland moorland with dramatic sky"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "USA viral",
      "Fast hook"
    ],
    "safeArcLabels": [
      "Sudden lunge",
      "Near-clash"
    ],
    "habitatTags": [
      "mountain",
      "open"
    ],
    "promptTemplateHints": [
      "Use Golden Eagle with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Rabbit",
        "environments": [
          "highland meadow",
          "open ridge shelf"
        ],
        "habitatTags": [
          "meadow",
          "mountain",
          "open"
        ],
        "safeArcLabel": "Sudden lunge",
        "badges": [
          "USA viral",
          "Fast hook"
        ],
        "promptTemplateHint": "Keep Golden Eagle and Rabbit readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Red Fox",
        "environments": [
          "windy alpine slope",
          "rocky highland edge"
        ],
        "habitatTags": [
          "mountain",
          "open",
          "meadow"
        ],
        "safeArcLabel": "Near-clash",
        "badges": [
          "USA viral",
          "Fast hook"
        ],
        "promptTemplateHint": "Keep Golden Eagle and Red Fox readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Marmot",
        "environments": [
          "open highland moorland with dramatic sky"
        ],
        "habitatTags": [
          "mountain",
          "open"
        ],
        "safeArcLabel": "Sudden lunge",
        "badges": [
          "USA viral",
          "Fast hook"
        ],
        "promptTemplateHint": "Keep Golden Eagle and Marmot readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Pheasant",
        "environments": [
          "open highland moorland with dramatic sky"
        ],
        "habitatTags": [
          "mountain",
          "open"
        ],
        "safeArcLabel": "Sudden lunge",
        "badges": [
          "USA viral",
          "Fast hook"
        ],
        "promptTemplateHint": "Keep Golden Eagle and Pheasant readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "White-tailed Deer",
    "normalizedName": "white-tailed-deer",
    "aliases": [],
    "viralRank": 17,
    "usaPriority": 17,
    "category": "defender",
    "defaultOpposingAnimal": "Coyote",
    "opposingAnimals": [
      "Coyote",
      "Bobcat",
      "Alligator",
      "Mountain Lion"
    ],
    "primaryEnvironments": [
      "Midwestern forest edge, brush opening, and field transition at dawn with strong escape-lane readability"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "USA viral"
    ],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "forest",
      "meadow",
      "open",
      "woodland"
    ],
    "promptTemplateHints": [
      "Use White-tailed Deer with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Coyote",
        "environments": [
          "Midwestern forest edge, brush opening, and field transition at dawn with strong escape-lane readability"
        ],
        "habitatTags": [
          "forest",
          "meadow",
          "open",
          "woodland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep White-tailed Deer and Coyote readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Bobcat",
        "environments": [
          "Midwestern forest edge, brush opening, and field transition at dawn with strong escape-lane readability"
        ],
        "habitatTags": [
          "forest",
          "meadow",
          "open",
          "woodland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep White-tailed Deer and Bobcat readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Alligator",
        "environments": [
          "Midwestern forest edge, brush opening, and field transition at dawn with strong escape-lane readability"
        ],
        "habitatTags": [
          "forest",
          "meadow",
          "open",
          "woodland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep White-tailed Deer and Alligator readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Mountain Lion",
        "environments": [
          "Midwestern forest edge, brush opening, and field transition at dawn with strong escape-lane readability"
        ],
        "habitatTags": [
          "forest",
          "meadow",
          "open",
          "woodland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep White-tailed Deer and Mountain Lion readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Wild Boar",
    "normalizedName": "wild-boar",
    "aliases": [],
    "viralRank": 18,
    "usaPriority": 18,
    "category": "wildlife",
    "defaultOpposingAnimal": "Coyote",
    "opposingAnimals": [
      "Coyote",
      "Black Bear",
      "Alligator",
      "Mountain Lion"
    ],
    "primaryEnvironments": [
      "Southern U.S. pine woods, scrub edge, and muddy open ground with strong defender-readable spacing"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "USA viral"
    ],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "desert",
      "forest",
      "open",
      "wetland"
    ],
    "promptTemplateHints": [
      "Use Wild Boar with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Coyote",
        "environments": [
          "Southern U.S. pine woods, scrub edge, and muddy open ground with strong defender-readable spacing"
        ],
        "habitatTags": [
          "desert",
          "forest",
          "open",
          "wetland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Wild Boar and Coyote readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Black Bear",
        "environments": [
          "Southern U.S. pine woods, scrub edge, and muddy open ground with strong defender-readable spacing"
        ],
        "habitatTags": [
          "desert",
          "forest",
          "open",
          "wetland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Wild Boar and Black Bear readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Alligator",
        "environments": [
          "Southern U.S. pine woods, scrub edge, and muddy open ground with strong defender-readable spacing"
        ],
        "habitatTags": [
          "desert",
          "forest",
          "open",
          "wetland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Wild Boar and Alligator readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Mountain Lion",
        "environments": [
          "Southern U.S. pine woods, scrub edge, and muddy open ground with strong defender-readable spacing"
        ],
        "habitatTags": [
          "desert",
          "forest",
          "open",
          "wetland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Wild Boar and Mountain Lion readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Caribou",
    "normalizedName": "caribou",
    "aliases": [],
    "viralRank": 19,
    "usaPriority": 19,
    "category": "defender",
    "defaultOpposingAnimal": "Wolf Pack",
    "opposingAnimals": [
      "Wolf Pack",
      "Grizzly Bear",
      "Brown Bear",
      "Wolverine"
    ],
    "primaryEnvironments": [
      "open tundra migration plain and boreal edge"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "USA viral"
    ],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "forest",
      "meadow",
      "open",
      "snow",
      "tundra"
    ],
    "promptTemplateHints": [
      "Use Caribou with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Wolf Pack",
        "environments": [
          "open tundra migration plain and boreal edge"
        ],
        "habitatTags": [
          "forest",
          "meadow",
          "open",
          "snow",
          "tundra"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Caribou and Wolf Pack readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Grizzly Bear",
        "environments": [
          "open tundra migration plain and boreal edge"
        ],
        "habitatTags": [
          "forest",
          "meadow",
          "open",
          "snow",
          "tundra"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Caribou and Grizzly Bear readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Brown Bear",
        "environments": [
          "open tundra migration plain and boreal edge"
        ],
        "habitatTags": [
          "forest",
          "meadow",
          "open",
          "snow",
          "tundra"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Caribou and Brown Bear readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Wolverine",
        "environments": [
          "open tundra migration plain and boreal edge"
        ],
        "habitatTags": [
          "forest",
          "meadow",
          "open",
          "snow",
          "tundra"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Caribou and Wolverine readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Reindeer",
    "normalizedName": "reindeer",
    "aliases": [],
    "viralRank": 20,
    "usaPriority": 20,
    "category": "defender",
    "defaultOpposingAnimal": "Wolf Pack",
    "opposingAnimals": [
      "Wolf Pack",
      "Arctic Fox",
      "Brown Bear",
      "Wolverine"
    ],
    "primaryEnvironments": [
      "snowy tundra and boreal forest edge"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "USA viral"
    ],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "forest",
      "snow",
      "tundra"
    ],
    "promptTemplateHints": [
      "Use Reindeer with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Wolf Pack",
        "environments": [
          "snowy tundra and boreal forest edge"
        ],
        "habitatTags": [
          "forest",
          "snow",
          "tundra"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Reindeer and Wolf Pack readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Arctic Fox",
        "environments": [
          "snowy tundra and boreal forest edge"
        ],
        "habitatTags": [
          "forest",
          "snow",
          "tundra"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Reindeer and Arctic Fox readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Brown Bear",
        "environments": [
          "snowy tundra and boreal forest edge"
        ],
        "habitatTags": [
          "forest",
          "snow",
          "tundra"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Reindeer and Brown Bear readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Wolverine",
        "environments": [
          "snowy tundra and boreal forest edge"
        ],
        "habitatTags": [
          "forest",
          "snow",
          "tundra"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Reindeer and Wolverine readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Mountain Goat",
    "normalizedName": "mountain-goat",
    "aliases": [],
    "viralRank": 21,
    "usaPriority": 21,
    "category": "defender",
    "defaultOpposingAnimal": "Golden Eagle",
    "opposingAnimals": [
      "Golden Eagle",
      "Mountain Lion",
      "Snow Leopard",
      "Wolf"
    ],
    "primaryEnvironments": [
      "high alpine cliffline and wind-cut ridgeline"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "USA viral"
    ],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "forest",
      "mountain"
    ],
    "promptTemplateHints": [
      "Use Mountain Goat with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Golden Eagle",
        "environments": [
          "high alpine cliffline and wind-cut ridgeline"
        ],
        "habitatTags": [
          "forest",
          "mountain"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Mountain Goat and Golden Eagle readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Mountain Lion",
        "environments": [
          "high alpine cliffline and wind-cut ridgeline"
        ],
        "habitatTags": [
          "forest",
          "mountain"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Mountain Goat and Mountain Lion readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Snow Leopard",
        "environments": [
          "high alpine cliffline and wind-cut ridgeline"
        ],
        "habitatTags": [
          "forest",
          "mountain"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Mountain Goat and Snow Leopard readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Wolf",
        "environments": [
          "high alpine cliffline and wind-cut ridgeline"
        ],
        "habitatTags": [
          "forest",
          "mountain"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Mountain Goat and Wolf readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Bighorn Sheep",
    "normalizedName": "bighorn-sheep",
    "aliases": [],
    "viralRank": 22,
    "usaPriority": 22,
    "category": "wildlife",
    "defaultOpposingAnimal": "Golden Eagle",
    "opposingAnimals": [
      "Golden Eagle",
      "Mountain Lion",
      "Wolf"
    ],
    "primaryEnvironments": [
      "steep Rocky Mountain ledges and alpine grass shelf"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "USA viral"
    ],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "forest",
      "mountain"
    ],
    "promptTemplateHints": [
      "Use Bighorn Sheep with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Golden Eagle",
        "environments": [
          "steep Rocky Mountain ledges and alpine grass shelf"
        ],
        "habitatTags": [
          "forest",
          "mountain"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Bighorn Sheep and Golden Eagle readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Mountain Lion",
        "environments": [
          "steep Rocky Mountain ledges and alpine grass shelf"
        ],
        "habitatTags": [
          "forest",
          "mountain"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Bighorn Sheep and Mountain Lion readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Wolf",
        "environments": [
          "steep Rocky Mountain ledges and alpine grass shelf"
        ],
        "habitatTags": [
          "forest",
          "mountain"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Bighorn Sheep and Wolf readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Mule Deer",
    "normalizedName": "mule-deer",
    "aliases": [],
    "viralRank": 23,
    "usaPriority": 23,
    "category": "defender",
    "defaultOpposingAnimal": "Coyote",
    "opposingAnimals": [
      "Coyote",
      "Mountain Lion",
      "Wolf"
    ],
    "primaryEnvironments": [
      "Rocky Mountain brush meadow and pine edge"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "USA viral"
    ],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "forest",
      "meadow",
      "mountain",
      "woodland"
    ],
    "promptTemplateHints": [
      "Use Mule Deer with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Coyote",
        "environments": [
          "Rocky Mountain brush meadow and pine edge"
        ],
        "habitatTags": [
          "forest",
          "meadow",
          "mountain",
          "woodland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Mule Deer and Coyote readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Mountain Lion",
        "environments": [
          "Rocky Mountain brush meadow and pine edge"
        ],
        "habitatTags": [
          "forest",
          "meadow",
          "mountain",
          "woodland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Mule Deer and Mountain Lion readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Wolf",
        "environments": [
          "Rocky Mountain brush meadow and pine edge"
        ],
        "habitatTags": [
          "forest",
          "meadow",
          "mountain",
          "woodland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Mule Deer and Wolf readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Sea Lion",
    "normalizedName": "sea-lion",
    "aliases": [],
    "viralRank": 24,
    "usaPriority": 24,
    "category": "predator",
    "defaultOpposingAnimal": "Great White Shark",
    "opposingAnimals": [
      "Great White Shark",
      "Orca",
      "Leopard Seal"
    ],
    "primaryEnvironments": [
      "Pacific surf line",
      "rocky haul-out coast",
      "kelp-wash shallows"
    ],
    "secondaryEnvironments": [
      "cold harbor channel"
    ],
    "badges": [
      "USA viral",
      "Fast hook"
    ],
    "safeArcLabels": [
      "Sudden lunge",
      "Chase pressure",
      "Survival encounter"
    ],
    "habitatTags": [
      "coast",
      "open"
    ],
    "promptTemplateHints": [
      "Use Sea Lion with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Great White Shark",
        "environments": [
          "Pacific surf line",
          "offshore rocky coast"
        ],
        "habitatTags": [
          "coast",
          "open"
        ],
        "safeArcLabel": "Sudden lunge",
        "badges": [
          "USA viral",
          "Fast hook"
        ],
        "promptTemplateHint": "Keep Sea Lion and Great White Shark readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Orca",
        "environments": [
          "cold coastal channel",
          "rocky haul-out coast"
        ],
        "habitatTags": [
          "coast",
          "open"
        ],
        "safeArcLabel": "Chase pressure",
        "badges": [
          "USA viral",
          "Fast hook"
        ],
        "promptTemplateHint": "Keep Sea Lion and Orca readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Leopard Seal",
        "environments": [
          "Pacific surf line"
        ],
        "habitatTags": [
          "coast",
          "open"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Sea Lion and Leopard Seal readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Wolf",
    "normalizedName": "wolf",
    "aliases": [],
    "viralRank": 25,
    "usaPriority": 25,
    "category": "predator",
    "defaultOpposingAnimal": "Bull Elk",
    "opposingAnimals": [
      "Bull Elk",
      "White-tailed Deer",
      "Mule Deer",
      "Moose Calf"
    ],
    "primaryEnvironments": [
      "northern Rocky Mountain forest edge, sage valley, and open meadow with clear chase lanes and readable prey spacing"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "USA viral"
    ],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "forest",
      "meadow",
      "mountain",
      "open"
    ],
    "promptTemplateHints": [
      "Use Wolf with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Bull Elk",
        "environments": [
          "northern Rocky Mountain forest edge, sage valley, and open meadow with clear chase lanes and readable prey spacing"
        ],
        "habitatTags": [
          "forest",
          "meadow",
          "mountain",
          "open"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Wolf and Bull Elk readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "White-tailed Deer",
        "environments": [
          "northern Rocky Mountain forest edge, sage valley, and open meadow with clear chase lanes and readable prey spacing"
        ],
        "habitatTags": [
          "forest",
          "meadow",
          "mountain",
          "open"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Wolf and White-tailed Deer readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Mule Deer",
        "environments": [
          "northern Rocky Mountain forest edge, sage valley, and open meadow with clear chase lanes and readable prey spacing"
        ],
        "habitatTags": [
          "forest",
          "meadow",
          "mountain",
          "open"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Wolf and Mule Deer readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Moose Calf",
        "environments": [
          "northern Rocky Mountain forest edge, sage valley, and open meadow with clear chase lanes and readable prey spacing"
        ],
        "habitatTags": [
          "forest",
          "meadow",
          "mountain",
          "open"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Wolf and Moose Calf readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Brown Bear",
    "normalizedName": "brown-bear",
    "aliases": [],
    "viralRank": 26,
    "usaPriority": 999,
    "category": "predator",
    "defaultOpposingAnimal": "Moose",
    "opposingAnimals": [
      "Moose",
      "Bull Elk",
      "Wild Boar",
      "Fish",
      "Red Deer"
    ],
    "primaryEnvironments": [
      "boreal forest and misty highland lake edge"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "USA viral"
    ],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "forest",
      "mountain",
      "river"
    ],
    "promptTemplateHints": [
      "Use Brown Bear with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Moose",
        "environments": [
          "boreal forest and misty highland lake edge"
        ],
        "habitatTags": [
          "forest",
          "mountain",
          "river"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Brown Bear and Moose readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Bull Elk",
        "environments": [
          "boreal forest and misty highland lake edge"
        ],
        "habitatTags": [
          "forest",
          "mountain",
          "river"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Brown Bear and Bull Elk readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Wild Boar",
        "environments": [
          "boreal forest and misty highland lake edge"
        ],
        "habitatTags": [
          "forest",
          "mountain",
          "river"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Brown Bear and Wild Boar readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Fish",
        "environments": [
          "boreal forest and misty highland lake edge"
        ],
        "habitatTags": [
          "forest",
          "mountain",
          "river"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Brown Bear and Fish readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Red Deer",
        "environments": [
          "boreal forest and misty highland lake edge"
        ],
        "habitatTags": [
          "forest",
          "mountain",
          "river"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Brown Bear and Red Deer readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Lynx",
    "normalizedName": "lynx",
    "aliases": [],
    "viralRank": 27,
    "usaPriority": 26,
    "category": "predator",
    "defaultOpposingAnimal": "Rabbit",
    "opposingAnimals": [
      "Rabbit",
      "Red Fox",
      "Hare",
      "Roe Deer"
    ],
    "primaryEnvironments": [
      "snowy woodland edge and dense boreal understory"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "USA viral"
    ],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "forest",
      "snow",
      "woodland"
    ],
    "promptTemplateHints": [
      "Use Lynx with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Rabbit",
        "environments": [
          "snowy woodland edge and dense boreal understory"
        ],
        "habitatTags": [
          "forest",
          "snow",
          "woodland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Lynx and Rabbit readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Red Fox",
        "environments": [
          "snowy woodland edge and dense boreal understory"
        ],
        "habitatTags": [
          "forest",
          "snow",
          "woodland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Lynx and Red Fox readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Hare",
        "environments": [
          "snowy woodland edge and dense boreal understory"
        ],
        "habitatTags": [
          "forest",
          "snow",
          "woodland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Lynx and Hare readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Roe Deer",
        "environments": [
          "snowy woodland edge and dense boreal understory"
        ],
        "habitatTags": [
          "forest",
          "snow",
          "woodland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Lynx and Roe Deer readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "River Otter",
    "normalizedName": "river-otter",
    "aliases": [],
    "viralRank": 28,
    "usaPriority": 27,
    "category": "documentary",
    "defaultOpposingAnimal": "Fish",
    "opposingAnimals": [
      "Fish",
      "Crayfish",
      "Duckling",
      "Frog"
    ],
    "primaryEnvironments": [
      "rocky river rapids and lakeshore reeds in cool morning fog"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "USA viral"
    ],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "coast",
      "mountain",
      "river",
      "wetland"
    ],
    "promptTemplateHints": [
      "Use River Otter with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Fish",
        "environments": [
          "rocky river rapids and lakeshore reeds in cool morning fog"
        ],
        "habitatTags": [
          "coast",
          "mountain",
          "river",
          "wetland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep River Otter and Fish readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Crayfish",
        "environments": [
          "rocky river rapids and lakeshore reeds in cool morning fog"
        ],
        "habitatTags": [
          "coast",
          "mountain",
          "river",
          "wetland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep River Otter and Crayfish readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Duckling",
        "environments": [
          "rocky river rapids and lakeshore reeds in cool morning fog"
        ],
        "habitatTags": [
          "coast",
          "mountain",
          "river",
          "wetland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep River Otter and Duckling readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Frog",
        "environments": [
          "rocky river rapids and lakeshore reeds in cool morning fog"
        ],
        "habitatTags": [
          "coast",
          "mountain",
          "river",
          "wetland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep River Otter and Frog readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Red Fox",
    "normalizedName": "red-fox",
    "aliases": [],
    "viralRank": 29,
    "usaPriority": 28,
    "category": "wildlife",
    "defaultOpposingAnimal": "Rabbit",
    "opposingAnimals": [
      "Rabbit",
      "Mouse",
      "Squirrel",
      "Vole"
    ],
    "primaryEnvironments": [
      "snowy forest edge and suburban park trail at dawn"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "USA viral"
    ],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "forest",
      "snow"
    ],
    "promptTemplateHints": [
      "Use Red Fox with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Rabbit",
        "environments": [
          "snowy forest edge and suburban park trail at dawn"
        ],
        "habitatTags": [
          "forest",
          "snow"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Red Fox and Rabbit readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Mouse",
        "environments": [
          "snowy forest edge and suburban park trail at dawn"
        ],
        "habitatTags": [
          "forest",
          "snow"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Red Fox and Mouse readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Squirrel",
        "environments": [
          "snowy forest edge and suburban park trail at dawn"
        ],
        "habitatTags": [
          "forest",
          "snow"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Red Fox and Squirrel readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Vole",
        "environments": [
          "snowy forest edge and suburban park trail at dawn"
        ],
        "habitatTags": [
          "forest",
          "snow"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Red Fox and Vole readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Great Horned Owl",
    "normalizedName": "great-horned-owl",
    "aliases": [],
    "viralRank": 30,
    "usaPriority": 29,
    "category": "predator",
    "defaultOpposingAnimal": "Rabbit",
    "opposingAnimals": [
      "Rabbit",
      "Mouse",
      "Skunk",
      "Squirrel"
    ],
    "primaryEnvironments": [
      "forest edge and open field under a bright moon with scattered clouds"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "USA viral",
      "Fast hook"
    ],
    "safeArcLabels": [
      "Sudden lunge"
    ],
    "habitatTags": [
      "forest",
      "meadow",
      "open"
    ],
    "promptTemplateHints": [
      "Use Great Horned Owl with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Rabbit",
        "environments": [
          "forest edge and open field under a bright moon with scattered clouds"
        ],
        "habitatTags": [
          "forest",
          "meadow",
          "open"
        ],
        "safeArcLabel": "Sudden lunge",
        "badges": [
          "USA viral",
          "Fast hook"
        ],
        "promptTemplateHint": "Keep Great Horned Owl and Rabbit readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Mouse",
        "environments": [
          "forest edge and open field under a bright moon with scattered clouds"
        ],
        "habitatTags": [
          "forest",
          "meadow",
          "open"
        ],
        "safeArcLabel": "Sudden lunge",
        "badges": [
          "USA viral",
          "Fast hook"
        ],
        "promptTemplateHint": "Keep Great Horned Owl and Mouse readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Skunk",
        "environments": [
          "forest edge and open field under a bright moon with scattered clouds"
        ],
        "habitatTags": [
          "forest",
          "meadow",
          "open"
        ],
        "safeArcLabel": "Sudden lunge",
        "badges": [
          "USA viral",
          "Fast hook"
        ],
        "promptTemplateHint": "Keep Great Horned Owl and Skunk readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Squirrel",
        "environments": [
          "forest edge and open field under a bright moon with scattered clouds"
        ],
        "habitatTags": [
          "forest",
          "meadow",
          "open"
        ],
        "safeArcLabel": "Sudden lunge",
        "badges": [
          "USA viral",
          "Fast hook"
        ],
        "promptTemplateHint": "Keep Great Horned Owl and Squirrel readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Raccoon",
    "normalizedName": "raccoon",
    "aliases": [],
    "viralRank": 31,
    "usaPriority": 31,
    "category": "documentary",
    "defaultOpposingAnimal": "Fish",
    "opposingAnimals": [
      "Fish",
      "Bird Egg",
      "Crayfish",
      "Frog",
      "Mouse"
    ],
    "primaryEnvironments": [
      "suburban backyard and creekside storm drain at night"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "USA viral"
    ],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "river"
    ],
    "promptTemplateHints": [
      "Use Raccoon with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Fish",
        "environments": [
          "suburban backyard and creekside storm drain at night"
        ],
        "habitatTags": [
          "river"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Raccoon and Fish readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Bird Egg",
        "environments": [
          "suburban backyard and creekside storm drain at night"
        ],
        "habitatTags": [
          "river"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Raccoon and Bird Egg readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Crayfish",
        "environments": [
          "suburban backyard and creekside storm drain at night"
        ],
        "habitatTags": [
          "river"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Raccoon and Crayfish readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Frog",
        "environments": [
          "suburban backyard and creekside storm drain at night"
        ],
        "habitatTags": [
          "river"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Raccoon and Frog readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Mouse",
        "environments": [
          "suburban backyard and creekside storm drain at night"
        ],
        "habitatTags": [
          "river"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Raccoon and Mouse readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Salmon",
    "normalizedName": "salmon",
    "aliases": [],
    "viralRank": 32,
    "usaPriority": 32,
    "category": "escape",
    "defaultOpposingAnimal": "Bald Eagle",
    "opposingAnimals": [
      "Bald Eagle",
      "River Otter",
      "Black Bear",
      "Grizzly Bear",
      "Sea Lion"
    ],
    "primaryEnvironments": [
      "spray-lit salmon ladder",
      "glacial riffle shallows",
      "river mouth current seam"
    ],
    "secondaryEnvironments": [
      "cold estuary surge"
    ],
    "badges": [
      "USA viral",
      "Fast hook"
    ],
    "safeArcLabels": [
      "Survival encounter",
      "Fishing strike",
      "Last-second escape"
    ],
    "habitatTags": [
      "river",
      "coast"
    ],
    "promptTemplateHints": [
      "Use Salmon with silver flash readability, current-driven motion, and strong predator-prey geography."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Bald Eagle",
        "environments": [
          "spray-lit salmon ladder",
          "glacial riffle shallows"
        ],
        "habitatTags": [
          "river",
          "coast"
        ],
        "safeArcLabel": "Fishing strike",
        "badges": [
          "USA viral",
          "Fast hook"
        ],
        "promptTemplateHint": "Keep Salmon and Bald Eagle readable with a clean strike lane and bright water separation."
      },
      {
        "animal": "River Otter",
        "environments": [
          "glacial riffle shallows",
          "rocky river seam"
        ],
        "habitatTags": [
          "river",
          "coast"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Salmon and River Otter readable in fast current with crisp splash physics and low-angle chase energy."
      },
      {
        "animal": "Black Bear",
        "environments": [
          "spray-lit salmon ladder",
          "alder-lined river chute"
        ],
        "habitatTags": [
          "river",
          "forest"
        ],
        "safeArcLabel": "Fishing strike",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Salmon and Black Bear readable at the same river crossing with heavy splash beats and grounded footing."
      },
      {
        "animal": "Grizzly Bear",
        "environments": [
          "spray-lit salmon ladder",
          "Yellowstone river chute"
        ],
        "habitatTags": [
          "river",
          "mountain"
        ],
        "safeArcLabel": "Fishing strike",
        "badges": [
          "USA viral",
          "Low drift"
        ],
        "promptTemplateHint": "Keep Salmon and Grizzly Bear readable in the same current with clear body mass, splash arcs, and river depth cues."
      },
      {
        "animal": "Sea Lion",
        "environments": [
          "river mouth current seam",
          "cold estuary surge"
        ],
        "habitatTags": [
          "river",
          "coast"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral",
          "Fast hook"
        ],
        "promptTemplateHint": "Keep Salmon and Sea Lion readable at the estuary edge with a clean current seam and believable near-surface motion."
      }
    ]
  },
  {
    "leadAnimal": "Rabbit",
    "normalizedName": "rabbit",
    "aliases": [],
    "viralRank": 33,
    "usaPriority": 33,
    "category": "escape",
    "defaultOpposingAnimal": "Coyote",
    "opposingAnimals": [
      "Coyote",
      "Bobcat",
      "Red Fox",
      "Golden Eagle",
      "Great Horned Owl"
    ],
    "primaryEnvironments": [
      "brushline opening, meadow edge, and low scrub escape pocket"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "USA viral"
    ],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "desert",
      "meadow",
      "open",
      "woodland"
    ],
    "promptTemplateHints": [
      "Use Rabbit with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Coyote",
        "environments": [
          "brushline opening, meadow edge, and low scrub escape pocket"
        ],
        "habitatTags": [
          "desert",
          "meadow",
          "open",
          "woodland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Rabbit and Coyote readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Bobcat",
        "environments": [
          "brushline opening, meadow edge, and low scrub escape pocket"
        ],
        "habitatTags": [
          "desert",
          "meadow",
          "open",
          "woodland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Rabbit and Bobcat readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Red Fox",
        "environments": [
          "brushline opening, meadow edge, and low scrub escape pocket"
        ],
        "habitatTags": [
          "desert",
          "meadow",
          "open",
          "woodland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Rabbit and Red Fox readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Golden Eagle",
        "environments": [
          "brushline opening, meadow edge, and low scrub escape pocket"
        ],
        "habitatTags": [
          "desert",
          "meadow",
          "open",
          "woodland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Rabbit and Golden Eagle readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Great Horned Owl",
        "environments": [
          "brushline opening, meadow edge, and low scrub escape pocket"
        ],
        "habitatTags": [
          "desert",
          "meadow",
          "open",
          "woodland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Rabbit and Great Horned Owl readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Jackrabbit",
    "normalizedName": "jackrabbit",
    "aliases": [],
    "viralRank": 34,
    "usaPriority": 34,
    "category": "escape",
    "defaultOpposingAnimal": "Coyote",
    "opposingAnimals": [
      "Coyote",
      "Bobcat",
      "Golden Eagle"
    ],
    "primaryEnvironments": [
      "sagebrush flat, dry prairie scrub edge, and open desert chase lane"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "USA viral"
    ],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "desert",
      "meadow",
      "open",
      "woodland"
    ],
    "promptTemplateHints": [
      "Use Jackrabbit with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Coyote",
        "environments": [
          "sagebrush flat, dry prairie scrub edge, and open desert chase lane"
        ],
        "habitatTags": [
          "desert",
          "meadow",
          "open",
          "woodland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Jackrabbit and Coyote readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Bobcat",
        "environments": [
          "sagebrush flat, dry prairie scrub edge, and open desert chase lane"
        ],
        "habitatTags": [
          "desert",
          "meadow",
          "open",
          "woodland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Jackrabbit and Bobcat readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Golden Eagle",
        "environments": [
          "sagebrush flat, dry prairie scrub edge, and open desert chase lane"
        ],
        "habitatTags": [
          "desert",
          "meadow",
          "open",
          "woodland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Jackrabbit and Golden Eagle readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Quail",
    "normalizedName": "quail",
    "aliases": [],
    "viralRank": 35,
    "usaPriority": 35,
    "category": "escape",
    "defaultOpposingAnimal": "Coyote",
    "opposingAnimals": [
      "Coyote",
      "Bobcat",
      "Golden Eagle",
      "Great Horned Owl"
    ],
    "primaryEnvironments": [
      "scrub grass opening, brushy wash edge, and low cover field lane"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "USA viral"
    ],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "desert",
      "meadow",
      "open",
      "woodland"
    ],
    "promptTemplateHints": [
      "Use Quail with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Coyote",
        "environments": [
          "scrub grass opening, brushy wash edge, and low cover field lane"
        ],
        "habitatTags": [
          "desert",
          "meadow",
          "open",
          "woodland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Quail and Coyote readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Bobcat",
        "environments": [
          "scrub grass opening, brushy wash edge, and low cover field lane"
        ],
        "habitatTags": [
          "desert",
          "meadow",
          "open",
          "woodland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Quail and Bobcat readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Golden Eagle",
        "environments": [
          "scrub grass opening, brushy wash edge, and low cover field lane"
        ],
        "habitatTags": [
          "desert",
          "meadow",
          "open",
          "woodland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Quail and Golden Eagle readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Great Horned Owl",
        "environments": [
          "scrub grass opening, brushy wash edge, and low cover field lane"
        ],
        "habitatTags": [
          "desert",
          "meadow",
          "open",
          "woodland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Quail and Great Horned Owl readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Beaver",
    "normalizedName": "beaver",
    "aliases": [],
    "viralRank": 36,
    "usaPriority": 30,
    "category": "documentary",
    "defaultOpposingAnimal": "Coyote",
    "opposingAnimals": [
      "Coyote",
      "River Otter",
      "Black Bear",
      "Wolf"
    ],
    "primaryEnvironments": [
      "freshwater riverbank beside a beaver dam and lodge with strong defender-readable spacing at golden hour"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "USA viral"
    ],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "river"
    ],
    "promptTemplateHints": [
      "Use Beaver with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Coyote",
        "environments": [
          "freshwater riverbank beside a beaver dam and lodge with strong defender-readable spacing at golden hour"
        ],
        "habitatTags": [
          "river"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Beaver and Coyote readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "River Otter",
        "environments": [
          "freshwater riverbank beside a beaver dam and lodge with strong defender-readable spacing at golden hour"
        ],
        "habitatTags": [
          "river"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Beaver and River Otter readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Black Bear",
        "environments": [
          "freshwater riverbank beside a beaver dam and lodge with strong defender-readable spacing at golden hour"
        ],
        "habitatTags": [
          "river"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Beaver and Black Bear readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Wolf",
        "environments": [
          "freshwater riverbank beside a beaver dam and lodge with strong defender-readable spacing at golden hour"
        ],
        "habitatTags": [
          "river"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Beaver and Wolf readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Badger",
    "normalizedName": "badger",
    "aliases": [],
    "viralRank": 37,
    "usaPriority": 36,
    "category": "documentary",
    "defaultOpposingAnimal": "Rattlesnake",
    "opposingAnimals": [
      "Rattlesnake",
      "Ground Squirrel",
      "Pocket Gopher",
      "Prairie Dog"
    ],
    "primaryEnvironments": [
      "open Great Plains grassland and prairie dog town in dusty afternoon heat"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "USA viral"
    ],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "meadow",
      "open",
      "savanna"
    ],
    "promptTemplateHints": [
      "Use Badger with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Rattlesnake",
        "environments": [
          "open Great Plains grassland and prairie dog town in dusty afternoon heat"
        ],
        "habitatTags": [
          "meadow",
          "open",
          "savanna"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Badger and Rattlesnake readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Ground Squirrel",
        "environments": [
          "open Great Plains grassland and prairie dog town in dusty afternoon heat"
        ],
        "habitatTags": [
          "meadow",
          "open",
          "savanna"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Badger and Ground Squirrel readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Pocket Gopher",
        "environments": [
          "open Great Plains grassland and prairie dog town in dusty afternoon heat"
        ],
        "habitatTags": [
          "meadow",
          "open",
          "savanna"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Badger and Pocket Gopher readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Prairie Dog",
        "environments": [
          "open Great Plains grassland and prairie dog town in dusty afternoon heat"
        ],
        "habitatTags": [
          "meadow",
          "open",
          "savanna"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Badger and Prairie Dog readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Black Mamba",
    "normalizedName": "black-mamba",
    "aliases": [],
    "viralRank": 38,
    "usaPriority": 999,
    "category": "predator",
    "defaultOpposingAnimal": "Bird",
    "opposingAnimals": [
      "Bird",
      "Lizard",
      "Rat",
      "Small Mammal"
    ],
    "primaryEnvironments": [
      "rocky African savanna with sparse brush"
    ],
    "secondaryEnvironments": [],
    "badges": [],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "mountain",
      "savanna",
      "woodland"
    ],
    "promptTemplateHints": [
      "Use Black Mamba with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Bird",
        "environments": [
          "rocky African savanna with sparse brush"
        ],
        "habitatTags": [
          "mountain",
          "savanna",
          "woodland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Black Mamba and Bird readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Lizard",
        "environments": [
          "rocky African savanna with sparse brush"
        ],
        "habitatTags": [
          "mountain",
          "savanna",
          "woodland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Black Mamba and Lizard readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Rat",
        "environments": [
          "rocky African savanna with sparse brush"
        ],
        "habitatTags": [
          "mountain",
          "savanna",
          "woodland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Black Mamba and Rat readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Small Mammal",
        "environments": [
          "rocky African savanna with sparse brush"
        ],
        "habitatTags": [
          "mountain",
          "savanna",
          "woodland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Black Mamba and Small Mammal readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Crocodile",
    "normalizedName": "crocodile",
    "aliases": [],
    "viralRank": 39,
    "usaPriority": 999,
    "category": "predator",
    "defaultOpposingAnimal": "Warthog",
    "opposingAnimals": [
      "Warthog",
      "Fish",
      "Antelope",
      "Zebra",
      "Cape Buffalo"
    ],
    "primaryEnvironments": [
      "muddy riverbank in tropical swamp"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "Kling 15s",
      "Water ambush",
      "Low drift"
    ],
    "safeArcLabels": [
      "Waterhole ambush",
      "Water ambush"
    ],
    "habitatTags": [
      "river",
      "swamp",
      "wetland"
    ],
    "promptTemplateHints": [
      "Use Crocodile with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Warthog",
        "environments": [
          "dry-season African muddy waterhole",
          "shallow brown water with cracked mud",
          "sparse reeds and dry yellow grassland"
        ],
        "habitatTags": [
          "river",
          "wetland",
          "savanna"
        ],
        "safeArcLabel": "Waterhole ambush",
        "badges": [
          "Kling 15s",
          "Water ambush",
          "Low drift"
        ],
        "promptTemplateHint": "Warthog drinks at muddy edge while crocodile stays barely visible before a sudden low lunge and unresolved escape pressure."
      },
      {
        "animal": "Fish",
        "environments": [
          "muddy riverbank in tropical swamp"
        ],
        "habitatTags": [
          "river",
          "swamp",
          "wetland"
        ],
        "safeArcLabel": "Water ambush",
        "badges": [
          "Water ambush"
        ],
        "promptTemplateHint": "Keep Crocodile and Fish readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Antelope",
        "environments": [
          "muddy riverbank in tropical swamp"
        ],
        "habitatTags": [
          "river",
          "swamp",
          "wetland"
        ],
        "safeArcLabel": "Water ambush",
        "badges": [
          "Water ambush"
        ],
        "promptTemplateHint": "Keep Crocodile and Antelope readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Zebra",
        "environments": [
          "muddy riverbank in tropical swamp"
        ],
        "habitatTags": [
          "river",
          "swamp",
          "wetland"
        ],
        "safeArcLabel": "Water ambush",
        "badges": [
          "Water ambush"
        ],
        "promptTemplateHint": "Keep Crocodile and Zebra readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Cape Buffalo",
        "environments": [
          "muddy riverbank in tropical swamp"
        ],
        "habitatTags": [
          "river",
          "swamp",
          "wetland"
        ],
        "safeArcLabel": "Water ambush",
        "badges": [
          "Water ambush"
        ],
        "promptTemplateHint": "Keep Crocodile and Cape Buffalo readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Nile Crocodile",
    "normalizedName": "nile-crocodile",
    "aliases": [],
    "viralRank": 40,
    "usaPriority": 999,
    "category": "predator",
    "defaultOpposingAnimal": "Warthog",
    "opposingAnimals": [
      "Warthog",
      "Antelope",
      "Zebra",
      "Wildebeest",
      "Cape Buffalo"
    ],
    "primaryEnvironments": [
      "wide African river crossing with murky water"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "Kling 15s",
      "Water ambush",
      "Low drift"
    ],
    "safeArcLabels": [
      "Waterhole ambush",
      "Water ambush",
      "River crossing danger",
      "Sudden lunge"
    ],
    "habitatTags": [
      "river"
    ],
    "promptTemplateHints": [
      "Use Nile Crocodile with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Warthog",
        "environments": [
          "dry-season African waterhole edge",
          "muddy African bank"
        ],
        "habitatTags": [
          "river",
          "wetland",
          "savanna"
        ],
        "safeArcLabel": "Waterhole ambush",
        "badges": [
          "Kling 15s",
          "Water ambush",
          "Low drift"
        ],
        "promptTemplateHint": "Keep Nile Crocodile and Warthog readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Antelope",
        "environments": [
          "wide African river crossing with murky water"
        ],
        "habitatTags": [
          "river"
        ],
        "safeArcLabel": "Water ambush",
        "badges": [
          "Water ambush"
        ],
        "promptTemplateHint": "Keep Nile Crocodile and Antelope readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Zebra",
        "environments": [
          "wide African river crossing",
          "murky bank channel"
        ],
        "habitatTags": [
          "river",
          "wetland",
          "savanna"
        ],
        "safeArcLabel": "River crossing danger",
        "badges": [
          "Kling 15s",
          "Water ambush"
        ],
        "promptTemplateHint": "Keep Nile Crocodile and Zebra readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Wildebeest",
        "environments": [
          "murky crossing current",
          "reed-framed flood channel"
        ],
        "habitatTags": [
          "river",
          "wetland",
          "savanna"
        ],
        "safeArcLabel": "Sudden lunge",
        "badges": [
          "Kling 15s",
          "Water ambush"
        ],
        "promptTemplateHint": "Keep Nile Crocodile and Wildebeest readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Cape Buffalo",
        "environments": [
          "wide African river crossing with murky water"
        ],
        "habitatTags": [
          "river"
        ],
        "safeArcLabel": "Water ambush",
        "badges": [
          "Water ambush"
        ],
        "promptTemplateHint": "Keep Nile Crocodile and Cape Buffalo readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Saltwater Crocodile",
    "normalizedName": "saltwater-crocodile",
    "aliases": [],
    "viralRank": 41,
    "usaPriority": 999,
    "category": "predator",
    "defaultOpposingAnimal": "White-tailed Deer",
    "opposingAnimals": [
      "White-tailed Deer",
      "Wild Boar",
      "Water Buffalo",
      "Large Fish"
    ],
    "primaryEnvironments": [
      "tropical Australian river mouth and mangrove estuary"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "Water ambush",
      "Kling 15s",
      "Low drift"
    ],
    "safeArcLabels": [
      "Water ambush",
      "Waterhole ambush"
    ],
    "habitatTags": [
      "coast",
      "river",
      "swamp"
    ],
    "promptTemplateHints": [
      "Use Saltwater Crocodile with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "White-tailed Deer",
        "environments": [
          "tropical Australian river mouth and mangrove estuary"
        ],
        "habitatTags": [
          "coast",
          "river",
          "swamp"
        ],
        "safeArcLabel": "Water ambush",
        "badges": [
          "Water ambush"
        ],
        "promptTemplateHint": "Keep Saltwater Crocodile and White-tailed Deer readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Wild Boar",
        "environments": [
          "tropical Australian river mouth and mangrove estuary"
        ],
        "habitatTags": [
          "coast",
          "river",
          "swamp"
        ],
        "safeArcLabel": "Water ambush",
        "badges": [
          "Water ambush"
        ],
        "promptTemplateHint": "Keep Saltwater Crocodile and Wild Boar readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Water Buffalo",
        "environments": [
          "mangrove river mouth",
          "tropical estuary edge"
        ],
        "habitatTags": [
          "river",
          "swamp",
          "wetland"
        ],
        "safeArcLabel": "Waterhole ambush",
        "badges": [
          "Kling 15s",
          "Water ambush",
          "Low drift"
        ],
        "promptTemplateHint": "Keep Saltwater Crocodile and Water Buffalo readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Large Fish",
        "environments": [
          "tropical Australian river mouth and mangrove estuary"
        ],
        "habitatTags": [
          "coast",
          "river",
          "swamp"
        ],
        "safeArcLabel": "Water ambush",
        "badges": [
          "Water ambush"
        ],
        "promptTemplateHint": "Keep Saltwater Crocodile and Large Fish readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Jaguar",
    "normalizedName": "jaguar",
    "aliases": [],
    "viralRank": 42,
    "usaPriority": 999,
    "category": "predator",
    "defaultOpposingAnimal": "White-tailed Deer",
    "opposingAnimals": [
      "White-tailed Deer",
      "Wild Boar",
      "Fish",
      "Caiman"
    ],
    "primaryEnvironments": [
      "tropical jungle riverbank"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "Kling 15s",
      "Water ambush",
      "Low drift"
    ],
    "safeArcLabels": [
      "Ambush tension",
      "Near-clash"
    ],
    "habitatTags": [
      "jungle",
      "river"
    ],
    "promptTemplateHints": [
      "Use Jaguar with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "White-tailed Deer",
        "environments": [
          "tropical jungle riverbank"
        ],
        "habitatTags": [
          "jungle",
          "river"
        ],
        "safeArcLabel": "Ambush tension",
        "badges": [],
        "promptTemplateHint": "Keep Jaguar and White-tailed Deer readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Wild Boar",
        "environments": [
          "tropical jungle riverbank"
        ],
        "habitatTags": [
          "jungle",
          "river"
        ],
        "safeArcLabel": "Ambush tension",
        "badges": [],
        "promptTemplateHint": "Keep Jaguar and Wild Boar readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Fish",
        "environments": [
          "tropical jungle riverbank"
        ],
        "habitatTags": [
          "jungle",
          "river"
        ],
        "safeArcLabel": "Ambush tension",
        "badges": [],
        "promptTemplateHint": "Keep Jaguar and Fish readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Caiman",
        "environments": [
          "Amazon muddy bank",
          "tropical river margin"
        ],
        "habitatTags": [
          "river",
          "jungle",
          "rainforest"
        ],
        "safeArcLabel": "Near-clash",
        "badges": [
          "Kling 15s",
          "Water ambush",
          "Low drift"
        ],
        "promptTemplateHint": "Keep Jaguar and Caiman readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Lion",
    "normalizedName": "lion",
    "aliases": [],
    "viralRank": 43,
    "usaPriority": 999,
    "category": "predator",
    "defaultOpposingAnimal": "White-tailed Deer",
    "opposingAnimals": [
      "White-tailed Deer",
      "Warthog",
      "Wild Boar",
      "Antelope",
      "Zebra"
    ],
    "primaryEnvironments": [
      "African savanna"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "Kling 15s",
      "Fast hook"
    ],
    "safeArcLabels": [
      "Survival encounter",
      "Sudden lunge",
      "Chase pressure"
    ],
    "habitatTags": [
      "savanna"
    ],
    "promptTemplateHints": [
      "Use Lion with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "White-tailed Deer",
        "environments": [
          "African savanna"
        ],
        "habitatTags": [
          "savanna"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Lion and White-tailed Deer readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Warthog",
        "environments": [
          "African savanna"
        ],
        "habitatTags": [
          "savanna"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Lion and Warthog readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Wild Boar",
        "environments": [
          "African savanna"
        ],
        "habitatTags": [
          "savanna"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Lion and Wild Boar readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Antelope",
        "environments": [
          "short-grass savanna",
          "acacia shadow edge"
        ],
        "habitatTags": [
          "savanna",
          "open",
          "woodland"
        ],
        "safeArcLabel": "Sudden lunge",
        "badges": [
          "Kling 15s",
          "Fast hook"
        ],
        "promptTemplateHint": "Keep Lion and Antelope readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Zebra",
        "environments": [
          "savanna golden hour grassland",
          "dry grassland chase lane"
        ],
        "habitatTags": [
          "savanna",
          "open"
        ],
        "safeArcLabel": "Chase pressure",
        "badges": [
          "Kling 15s",
          "Fast hook"
        ],
        "promptTemplateHint": "Keep Lion and Zebra readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Lion Pack",
    "normalizedName": "lion-pack",
    "aliases": [],
    "viralRank": 44,
    "usaPriority": 999,
    "category": "predator",
    "defaultOpposingAnimal": "Warthog",
    "opposingAnimals": [
      "Warthog",
      "Antelope",
      "Zebra",
      "Wildebeest",
      "Cape Buffalo"
    ],
    "primaryEnvironments": [
      "African savanna pressure lane near dry-season waterhole"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "Pack pressure",
      "Kling 15s",
      "Defender"
    ],
    "safeArcLabels": [
      "Pack pressure",
      "Defender stands ground"
    ],
    "habitatTags": [
      "coast",
      "desert",
      "river",
      "savanna"
    ],
    "promptTemplateHints": [
      "Use Lion Pack with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Warthog",
        "environments": [
          "African savanna pressure lane near dry-season waterhole"
        ],
        "habitatTags": [
          "coast",
          "desert",
          "river",
          "savanna"
        ],
        "safeArcLabel": "Pack pressure",
        "badges": [
          "Pack pressure"
        ],
        "promptTemplateHint": "Keep Lion Pack and Warthog readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Antelope",
        "environments": [
          "African savanna pressure lane near dry-season waterhole"
        ],
        "habitatTags": [
          "coast",
          "desert",
          "river",
          "savanna"
        ],
        "safeArcLabel": "Pack pressure",
        "badges": [
          "Pack pressure"
        ],
        "promptTemplateHint": "Keep Lion Pack and Antelope readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Zebra",
        "environments": [
          "African savanna pressure lane near dry-season waterhole"
        ],
        "habitatTags": [
          "coast",
          "desert",
          "river",
          "savanna"
        ],
        "safeArcLabel": "Pack pressure",
        "badges": [
          "Pack pressure"
        ],
        "promptTemplateHint": "Keep Lion Pack and Zebra readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Wildebeest",
        "environments": [
          "African savanna pressure lane near dry-season waterhole"
        ],
        "habitatTags": [
          "coast",
          "desert",
          "river",
          "savanna"
        ],
        "safeArcLabel": "Pack pressure",
        "badges": [
          "Pack pressure"
        ],
        "promptTemplateHint": "Keep Lion Pack and Wildebeest readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Cape Buffalo",
        "environments": [
          "savanna waterhole edge",
          "dusty acacia plain"
        ],
        "habitatTags": [
          "savanna",
          "open",
          "river"
        ],
        "safeArcLabel": "Defender stands ground",
        "badges": [
          "Kling 15s",
          "Pack pressure",
          "Defender"
        ],
        "promptTemplateHint": "Keep Lion Pack and Cape Buffalo readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Tiger",
    "normalizedName": "tiger",
    "aliases": [],
    "viralRank": 45,
    "usaPriority": 999,
    "category": "predator",
    "defaultOpposingAnimal": "White-tailed Deer",
    "opposingAnimals": [
      "White-tailed Deer",
      "Wild Boar",
      "Antelope",
      "Goat"
    ],
    "primaryEnvironments": [
      "dense jungle with mist and wet ground"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "Kling 15s",
      "Low drift"
    ],
    "safeArcLabels": [
      "Sudden lunge",
      "Ambush tension"
    ],
    "habitatTags": [
      "jungle"
    ],
    "promptTemplateHints": [
      "Use Tiger with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "White-tailed Deer",
        "environments": [
          "humid jungle opening",
          "bamboo forest edge"
        ],
        "habitatTags": [
          "jungle",
          "forest",
          "rainforest"
        ],
        "safeArcLabel": "Sudden lunge",
        "badges": [
          "Kling 15s",
          "Low drift"
        ],
        "promptTemplateHint": "Keep Tiger and White-tailed Deer readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Wild Boar",
        "environments": [
          "dense jungle river edge",
          "monsoon forest floor"
        ],
        "habitatTags": [
          "jungle",
          "river",
          "forest"
        ],
        "safeArcLabel": "Ambush tension",
        "badges": [
          "Kling 15s",
          "Low drift"
        ],
        "promptTemplateHint": "Keep Tiger and Wild Boar readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Antelope",
        "environments": [
          "dense jungle with mist and wet ground"
        ],
        "habitatTags": [
          "jungle"
        ],
        "safeArcLabel": "Ambush tension",
        "badges": [],
        "promptTemplateHint": "Keep Tiger and Antelope readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Goat",
        "environments": [
          "dense jungle with mist and wet ground"
        ],
        "habitatTags": [
          "jungle"
        ],
        "safeArcLabel": "Ambush tension",
        "badges": [],
        "promptTemplateHint": "Keep Tiger and Goat readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Siberian Tiger",
    "normalizedName": "siberian-tiger",
    "aliases": [],
    "viralRank": 46,
    "usaPriority": 999,
    "category": "predator",
    "defaultOpposingAnimal": "Bull Elk",
    "opposingAnimals": [
      "Bull Elk",
      "White-tailed Deer",
      "Wild Boar",
      "Brown Bear Cub"
    ],
    "primaryEnvironments": [
      "deep Siberian taiga forest in heavy snowfall"
    ],
    "secondaryEnvironments": [],
    "badges": [],
    "safeArcLabels": [
      "Ambush tension"
    ],
    "habitatTags": [
      "forest",
      "snow"
    ],
    "promptTemplateHints": [
      "Use Siberian Tiger with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Bull Elk",
        "environments": [
          "deep Siberian taiga forest in heavy snowfall"
        ],
        "habitatTags": [
          "forest",
          "snow"
        ],
        "safeArcLabel": "Ambush tension",
        "badges": [],
        "promptTemplateHint": "Keep Siberian Tiger and Bull Elk readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "White-tailed Deer",
        "environments": [
          "deep Siberian taiga forest in heavy snowfall"
        ],
        "habitatTags": [
          "forest",
          "snow"
        ],
        "safeArcLabel": "Ambush tension",
        "badges": [],
        "promptTemplateHint": "Keep Siberian Tiger and White-tailed Deer readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Wild Boar",
        "environments": [
          "deep Siberian taiga forest in heavy snowfall"
        ],
        "habitatTags": [
          "forest",
          "snow"
        ],
        "safeArcLabel": "Ambush tension",
        "badges": [],
        "promptTemplateHint": "Keep Siberian Tiger and Wild Boar readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Brown Bear Cub",
        "environments": [
          "deep Siberian taiga forest in heavy snowfall"
        ],
        "habitatTags": [
          "forest",
          "snow"
        ],
        "safeArcLabel": "Ambush tension",
        "badges": [],
        "promptTemplateHint": "Keep Siberian Tiger and Brown Bear Cub readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Leopard",
    "normalizedName": "leopard",
    "aliases": [],
    "viralRank": 47,
    "usaPriority": 999,
    "category": "predator",
    "defaultOpposingAnimal": "White-tailed Deer",
    "opposingAnimals": [
      "White-tailed Deer",
      "Rabbit",
      "Antelope",
      "Goat"
    ],
    "primaryEnvironments": [
      "rocky canyon"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "Kling 15s",
      "Low drift"
    ],
    "safeArcLabels": [
      "Ambush tension"
    ],
    "habitatTags": [
      "mountain"
    ],
    "promptTemplateHints": [
      "Use Leopard with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "White-tailed Deer",
        "environments": [
          "rocky canyon"
        ],
        "habitatTags": [
          "mountain"
        ],
        "safeArcLabel": "Ambush tension",
        "badges": [],
        "promptTemplateHint": "Keep Leopard and White-tailed Deer readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Rabbit",
        "environments": [
          "rocky canyon"
        ],
        "habitatTags": [
          "mountain"
        ],
        "safeArcLabel": "Ambush tension",
        "badges": [],
        "promptTemplateHint": "Keep Leopard and Rabbit readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Antelope",
        "environments": [
          "rocky savanna shelf",
          "woodland edge"
        ],
        "habitatTags": [
          "savanna",
          "open",
          "woodland"
        ],
        "safeArcLabel": "Ambush tension",
        "badges": [
          "Kling 15s",
          "Low drift"
        ],
        "promptTemplateHint": "Keep Leopard and Antelope readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Goat",
        "environments": [
          "rocky canyon"
        ],
        "habitatTags": [
          "mountain"
        ],
        "safeArcLabel": "Ambush tension",
        "badges": [],
        "promptTemplateHint": "Keep Leopard and Goat readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Cheetah",
    "normalizedName": "cheetah",
    "aliases": [],
    "viralRank": 48,
    "usaPriority": 999,
    "category": "predator",
    "defaultOpposingAnimal": "White-tailed Deer",
    "opposingAnimals": [
      "White-tailed Deer",
      "Rabbit",
      "Gazelle",
      "Antelope"
    ],
    "primaryEnvironments": [
      "open East African savanna with short grass"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "Fast hook",
      "Kling 15s",
      "Chase pressure"
    ],
    "safeArcLabels": [
      "Ambush tension",
      "Chase pressure"
    ],
    "habitatTags": [
      "open",
      "savanna"
    ],
    "promptTemplateHints": [
      "Use Cheetah with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "White-tailed Deer",
        "environments": [
          "open East African savanna with short grass"
        ],
        "habitatTags": [
          "open",
          "savanna"
        ],
        "safeArcLabel": "Ambush tension",
        "badges": [
          "Fast hook"
        ],
        "promptTemplateHint": "Keep Cheetah and White-tailed Deer readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Rabbit",
        "environments": [
          "open East African savanna with short grass"
        ],
        "habitatTags": [
          "open",
          "savanna"
        ],
        "safeArcLabel": "Ambush tension",
        "badges": [
          "Fast hook"
        ],
        "promptTemplateHint": "Keep Cheetah and Rabbit readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Gazelle",
        "environments": [
          "open savanna sprint lane",
          "dry grass track"
        ],
        "habitatTags": [
          "savanna",
          "open"
        ],
        "safeArcLabel": "Chase pressure",
        "badges": [
          "Kling 15s",
          "Chase pressure"
        ],
        "promptTemplateHint": "Keep Cheetah and Gazelle readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Antelope",
        "environments": [
          "open East African savanna with short grass"
        ],
        "habitatTags": [
          "open",
          "savanna"
        ],
        "safeArcLabel": "Ambush tension",
        "badges": [
          "Fast hook"
        ],
        "promptTemplateHint": "Keep Cheetah and Antelope readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Hyena",
    "normalizedName": "hyena",
    "aliases": [],
    "viralRank": 49,
    "usaPriority": 999,
    "category": "predator",
    "defaultOpposingAnimal": "White-tailed Deer",
    "opposingAnimals": [
      "White-tailed Deer",
      "Warthog",
      "Wild Boar",
      "Antelope",
      "Impala"
    ],
    "primaryEnvironments": [
      "dry grassland"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "Pack pressure"
    ],
    "safeArcLabels": [
      "Pack pressure"
    ],
    "habitatTags": [
      "desert",
      "meadow",
      "savanna"
    ],
    "promptTemplateHints": [
      "Use Hyena with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "White-tailed Deer",
        "environments": [
          "dry grassland"
        ],
        "habitatTags": [
          "desert",
          "meadow",
          "savanna"
        ],
        "safeArcLabel": "Pack pressure",
        "badges": [
          "Pack pressure"
        ],
        "promptTemplateHint": "Keep Hyena and White-tailed Deer readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Warthog",
        "environments": [
          "dry grassland"
        ],
        "habitatTags": [
          "desert",
          "meadow",
          "savanna"
        ],
        "safeArcLabel": "Pack pressure",
        "badges": [
          "Pack pressure"
        ],
        "promptTemplateHint": "Keep Hyena and Warthog readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Wild Boar",
        "environments": [
          "dry grassland"
        ],
        "habitatTags": [
          "desert",
          "meadow",
          "savanna"
        ],
        "safeArcLabel": "Pack pressure",
        "badges": [
          "Pack pressure"
        ],
        "promptTemplateHint": "Keep Hyena and Wild Boar readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Antelope",
        "environments": [
          "dry grassland"
        ],
        "habitatTags": [
          "desert",
          "meadow",
          "savanna"
        ],
        "safeArcLabel": "Pack pressure",
        "badges": [
          "Pack pressure"
        ],
        "promptTemplateHint": "Keep Hyena and Antelope readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Impala",
        "environments": [
          "dry grassland"
        ],
        "habitatTags": [
          "desert",
          "meadow",
          "savanna"
        ],
        "safeArcLabel": "Pack pressure",
        "badges": [
          "Pack pressure"
        ],
        "promptTemplateHint": "Keep Hyena and Impala readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "African Wild Dog",
    "normalizedName": "african-wild-dog",
    "aliases": [],
    "viralRank": 50,
    "usaPriority": 999,
    "category": "wildlife",
    "defaultOpposingAnimal": "White-tailed Deer",
    "opposingAnimals": [
      "White-tailed Deer",
      "Rabbit",
      "Gazelle",
      "Antelope",
      "Impala"
    ],
    "primaryEnvironments": [
      "open bushveld savanna at dawn"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "Pack pressure",
      "Kling 15s"
    ],
    "safeArcLabels": [
      "Pack pressure"
    ],
    "habitatTags": [
      "open",
      "savanna"
    ],
    "promptTemplateHints": [
      "Use African Wild Dog with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "White-tailed Deer",
        "environments": [
          "open bushveld savanna at dawn"
        ],
        "habitatTags": [
          "open",
          "savanna"
        ],
        "safeArcLabel": "Pack pressure",
        "badges": [
          "Pack pressure"
        ],
        "promptTemplateHint": "Keep African Wild Dog and White-tailed Deer readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Rabbit",
        "environments": [
          "open bushveld savanna at dawn"
        ],
        "habitatTags": [
          "open",
          "savanna"
        ],
        "safeArcLabel": "Pack pressure",
        "badges": [
          "Pack pressure"
        ],
        "promptTemplateHint": "Keep African Wild Dog and Rabbit readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Gazelle",
        "environments": [
          "open bushveld savanna at dawn"
        ],
        "habitatTags": [
          "open",
          "savanna"
        ],
        "safeArcLabel": "Pack pressure",
        "badges": [
          "Pack pressure"
        ],
        "promptTemplateHint": "Keep African Wild Dog and Gazelle readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Antelope",
        "environments": [
          "open bushveld lane",
          "red-dirt grass track"
        ],
        "habitatTags": [
          "savanna",
          "open",
          "woodland"
        ],
        "safeArcLabel": "Pack pressure",
        "badges": [
          "Kling 15s",
          "Pack pressure"
        ],
        "promptTemplateHint": "Keep African Wild Dog and Antelope readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Impala",
        "environments": [
          "open bushveld savanna at dawn"
        ],
        "habitatTags": [
          "open",
          "savanna"
        ],
        "safeArcLabel": "Pack pressure",
        "badges": [
          "Pack pressure"
        ],
        "promptTemplateHint": "Keep African Wild Dog and Impala readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Snow Leopard",
    "normalizedName": "snow-leopard",
    "aliases": [],
    "viralRank": 51,
    "usaPriority": 999,
    "category": "predator",
    "defaultOpposingAnimal": "Mountain Goat",
    "opposingAnimals": [
      "Mountain Goat",
      "Ibex",
      "Blue Sheep",
      "Marmot"
    ],
    "primaryEnvironments": [
      "high altitude Himalayan rocky terrain with snow"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "Kling 15s",
      "Near-clash",
      "Low drift"
    ],
    "safeArcLabels": [
      "Cliffhanger survival tension",
      "Near-clash",
      "Ambush tension"
    ],
    "habitatTags": [
      "mountain",
      "snow"
    ],
    "promptTemplateHints": [
      "Use Snow Leopard with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Mountain Goat",
        "environments": [
          "snowy cliff shelf",
          "high alpine ledge"
        ],
        "habitatTags": [
          "mountain",
          "snow",
          "open"
        ],
        "safeArcLabel": "Cliffhanger survival tension",
        "badges": [
          "Kling 15s",
          "Near-clash",
          "Low drift"
        ],
        "promptTemplateHint": "Keep Snow Leopard and Mountain Goat readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Ibex",
        "environments": [
          "windy high ridge",
          "rocky snow face"
        ],
        "habitatTags": [
          "mountain",
          "snow",
          "open"
        ],
        "safeArcLabel": "Near-clash",
        "badges": [
          "Kling 15s",
          "Low drift"
        ],
        "promptTemplateHint": "Keep Snow Leopard and Ibex readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Blue Sheep",
        "environments": [
          "high altitude Himalayan rocky terrain with snow"
        ],
        "habitatTags": [
          "mountain",
          "snow"
        ],
        "safeArcLabel": "Ambush tension",
        "badges": [],
        "promptTemplateHint": "Keep Snow Leopard and Blue Sheep readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Marmot",
        "environments": [
          "high altitude Himalayan rocky terrain with snow"
        ],
        "habitatTags": [
          "mountain",
          "snow"
        ],
        "safeArcLabel": "Ambush tension",
        "badges": [],
        "promptTemplateHint": "Keep Snow Leopard and Marmot readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Komodo Dragon",
    "normalizedName": "komodo-dragon",
    "aliases": [],
    "viralRank": 52,
    "usaPriority": 999,
    "category": "predator",
    "defaultOpposingAnimal": "White-tailed Deer",
    "opposingAnimals": [
      "White-tailed Deer",
      "Wild Boar",
      "Water Buffalo",
      "Goat"
    ],
    "primaryEnvironments": [
      "arid Indonesian island scrubland"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "Kling 15s",
      "Fast hook",
      "Low drift"
    ],
    "safeArcLabels": [
      "Sudden lunge",
      "Survival encounter"
    ],
    "habitatTags": [
      "desert"
    ],
    "promptTemplateHints": [
      "Use Komodo Dragon with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "White-tailed Deer",
        "environments": [
          "dry island scrubland",
          "sun-baked trail cut"
        ],
        "habitatTags": [
          "desert",
          "open",
          "woodland"
        ],
        "safeArcLabel": "Sudden lunge",
        "badges": [
          "Kling 15s",
          "Fast hook",
          "Low drift"
        ],
        "promptTemplateHint": "Keep Komodo Dragon and White-tailed Deer readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Wild Boar",
        "environments": [
          "arid Indonesian island scrubland"
        ],
        "habitatTags": [
          "desert"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Komodo Dragon and Wild Boar readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Water Buffalo",
        "environments": [
          "arid Indonesian island scrubland"
        ],
        "habitatTags": [
          "desert"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Komodo Dragon and Water Buffalo readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Goat",
        "environments": [
          "arid Indonesian island scrubland"
        ],
        "habitatTags": [
          "desert"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Komodo Dragon and Goat readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Harpy Eagle",
    "normalizedName": "harpy-eagle",
    "aliases": [],
    "viralRank": 53,
    "usaPriority": 999,
    "category": "predator",
    "defaultOpposingAnimal": "Chimpanzee",
    "opposingAnimals": [
      "Chimpanzee",
      "Iguana",
      "Large Snake",
      "Monkey",
      "Sloth"
    ],
    "primaryEnvironments": [
      "dense Amazon rainforest canopy"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "Kling 15s",
      "Fast hook"
    ],
    "safeArcLabels": [
      "Sudden lunge"
    ],
    "habitatTags": [
      "forest",
      "rainforest"
    ],
    "promptTemplateHints": [
      "Use Harpy Eagle with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Chimpanzee",
        "environments": [
          "dense rainforest canopy gap",
          "humid treetop lane"
        ],
        "habitatTags": [
          "rainforest",
          "jungle",
          "forest"
        ],
        "safeArcLabel": "Sudden lunge",
        "badges": [
          "Kling 15s",
          "Fast hook"
        ],
        "promptTemplateHint": "Keep Harpy Eagle and Chimpanzee readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Iguana",
        "environments": [
          "dense Amazon rainforest canopy"
        ],
        "habitatTags": [
          "forest",
          "rainforest"
        ],
        "safeArcLabel": "Sudden lunge",
        "badges": [
          "Fast hook"
        ],
        "promptTemplateHint": "Keep Harpy Eagle and Iguana readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Large Snake",
        "environments": [
          "dense Amazon rainforest canopy"
        ],
        "habitatTags": [
          "forest",
          "rainforest"
        ],
        "safeArcLabel": "Sudden lunge",
        "badges": [
          "Fast hook"
        ],
        "promptTemplateHint": "Keep Harpy Eagle and Large Snake readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Monkey",
        "environments": [
          "dense Amazon rainforest canopy"
        ],
        "habitatTags": [
          "forest",
          "rainforest"
        ],
        "safeArcLabel": "Sudden lunge",
        "badges": [
          "Fast hook"
        ],
        "promptTemplateHint": "Keep Harpy Eagle and Monkey readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Sloth",
        "environments": [
          "dense Amazon rainforest canopy"
        ],
        "habitatTags": [
          "forest",
          "rainforest"
        ],
        "safeArcLabel": "Sudden lunge",
        "badges": [
          "Fast hook"
        ],
        "promptTemplateHint": "Keep Harpy Eagle and Sloth readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Leopard Seal",
    "normalizedName": "leopard-seal",
    "aliases": [],
    "viralRank": 54,
    "usaPriority": 999,
    "category": "predator",
    "defaultOpposingAnimal": "Fish",
    "opposingAnimals": [
      "Fish",
      "Penguin",
      "Seal Pup",
      "Squid"
    ],
    "primaryEnvironments": [
      "Antarctic ice floe and freezing open water"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "Water ambush",
      "Kling 15s",
      "Fast hook",
      "Low drift"
    ],
    "safeArcLabels": [
      "Water ambush",
      "Sudden lunge"
    ],
    "habitatTags": [
      "open",
      "snow"
    ],
    "promptTemplateHints": [
      "Use Leopard Seal with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Fish",
        "environments": [
          "Antarctic ice floe and freezing open water"
        ],
        "habitatTags": [
          "open",
          "snow"
        ],
        "safeArcLabel": "Water ambush",
        "badges": [
          "Water ambush"
        ],
        "promptTemplateHint": "Keep Leopard Seal and Fish readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Penguin",
        "environments": [
          "Antarctic ice edge",
          "freezing open-water lane"
        ],
        "habitatTags": [
          "coast",
          "snow",
          "open"
        ],
        "safeArcLabel": "Sudden lunge",
        "badges": [
          "Kling 15s",
          "Fast hook",
          "Low drift"
        ],
        "promptTemplateHint": "Keep Leopard Seal and Penguin readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Seal Pup",
        "environments": [
          "Antarctic ice floe and freezing open water"
        ],
        "habitatTags": [
          "open",
          "snow"
        ],
        "safeArcLabel": "Water ambush",
        "badges": [
          "Water ambush"
        ],
        "promptTemplateHint": "Keep Leopard Seal and Seal Pup readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Squid",
        "environments": [
          "Antarctic ice floe and freezing open water"
        ],
        "habitatTags": [
          "open",
          "snow"
        ],
        "safeArcLabel": "Water ambush",
        "badges": [
          "Water ambush"
        ],
        "promptTemplateHint": "Keep Leopard Seal and Squid readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Cape Buffalo",
    "normalizedName": "cape-buffalo",
    "aliases": [],
    "viralRank": 55,
    "usaPriority": 999,
    "category": "defender",
    "defaultOpposingAnimal": "Leopard",
    "opposingAnimals": [
      "Leopard",
      "Crocodile",
      "Hyena Pack",
      "Lion Pack"
    ],
    "primaryEnvironments": [
      "African savanna waterhole at golden hour with dust and dry grass"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "Defender"
    ],
    "safeArcLabels": [
      "Defender stands ground"
    ],
    "habitatTags": [
      "desert",
      "river",
      "savanna"
    ],
    "promptTemplateHints": [
      "Use Cape Buffalo with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Leopard",
        "environments": [
          "African savanna waterhole at golden hour with dust and dry grass"
        ],
        "habitatTags": [
          "desert",
          "river",
          "savanna"
        ],
        "safeArcLabel": "Defender stands ground",
        "badges": [
          "Defender"
        ],
        "promptTemplateHint": "Keep Cape Buffalo and Leopard readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Crocodile",
        "environments": [
          "African savanna waterhole at golden hour with dust and dry grass"
        ],
        "habitatTags": [
          "desert",
          "river",
          "savanna"
        ],
        "safeArcLabel": "Defender stands ground",
        "badges": [
          "Defender"
        ],
        "promptTemplateHint": "Keep Cape Buffalo and Crocodile readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Hyena Pack",
        "environments": [
          "African savanna waterhole at golden hour with dust and dry grass"
        ],
        "habitatTags": [
          "desert",
          "river",
          "savanna"
        ],
        "safeArcLabel": "Defender stands ground",
        "badges": [
          "Defender"
        ],
        "promptTemplateHint": "Keep Cape Buffalo and Hyena Pack readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Lion Pack",
        "environments": [
          "African savanna waterhole at golden hour with dust and dry grass"
        ],
        "habitatTags": [
          "desert",
          "river",
          "savanna"
        ],
        "safeArcLabel": "Defender stands ground",
        "badges": [
          "Defender"
        ],
        "promptTemplateHint": "Keep Cape Buffalo and Lion Pack readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Water Buffalo",
    "normalizedName": "water-buffalo",
    "aliases": [],
    "viralRank": 56,
    "usaPriority": 999,
    "category": "defender",
    "defaultOpposingAnimal": "Tiger",
    "opposingAnimals": [
      "Tiger",
      "Crocodile",
      "Komodo Dragon",
      "Saltwater Crocodile"
    ],
    "primaryEnvironments": [
      "muddy tropical waterhole, reed-framed river edge, and humid floodplain crossing"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "Defender"
    ],
    "safeArcLabels": [
      "Defender stands ground"
    ],
    "habitatTags": [
      "meadow",
      "open",
      "river",
      "wetland"
    ],
    "promptTemplateHints": [
      "Use Water Buffalo with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Tiger",
        "environments": [
          "muddy tropical waterhole, reed-framed river edge, and humid floodplain crossing"
        ],
        "habitatTags": [
          "meadow",
          "open",
          "river",
          "wetland"
        ],
        "safeArcLabel": "Defender stands ground",
        "badges": [
          "Defender"
        ],
        "promptTemplateHint": "Keep Water Buffalo and Tiger readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Crocodile",
        "environments": [
          "muddy tropical waterhole, reed-framed river edge, and humid floodplain crossing"
        ],
        "habitatTags": [
          "meadow",
          "open",
          "river",
          "wetland"
        ],
        "safeArcLabel": "Defender stands ground",
        "badges": [
          "Defender"
        ],
        "promptTemplateHint": "Keep Water Buffalo and Crocodile readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Komodo Dragon",
        "environments": [
          "muddy tropical waterhole, reed-framed river edge, and humid floodplain crossing"
        ],
        "habitatTags": [
          "meadow",
          "open",
          "river",
          "wetland"
        ],
        "safeArcLabel": "Defender stands ground",
        "badges": [
          "Defender"
        ],
        "promptTemplateHint": "Keep Water Buffalo and Komodo Dragon readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Saltwater Crocodile",
        "environments": [
          "muddy tropical waterhole, reed-framed river edge, and humid floodplain crossing"
        ],
        "habitatTags": [
          "meadow",
          "open",
          "river",
          "wetland"
        ],
        "safeArcLabel": "Defender stands ground",
        "badges": [
          "Defender"
        ],
        "promptTemplateHint": "Keep Water Buffalo and Saltwater Crocodile readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Warthog",
    "normalizedName": "warthog",
    "aliases": [],
    "viralRank": 57,
    "usaPriority": 999,
    "category": "defender",
    "defaultOpposingAnimal": "Lion",
    "opposingAnimals": [
      "Lion",
      "Leopard",
      "Hyena",
      "Crocodile",
      "Nile Crocodile"
    ],
    "primaryEnvironments": [
      "dry-season African muddy waterhole edge and cracked yellow grassland"
    ],
    "secondaryEnvironments": [],
    "badges": [],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "coast",
      "desert",
      "meadow",
      "river",
      "savanna",
      "wetland"
    ],
    "promptTemplateHints": [
      "Use Warthog with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Lion",
        "environments": [
          "dry-season African muddy waterhole edge and cracked yellow grassland"
        ],
        "habitatTags": [
          "coast",
          "desert",
          "meadow",
          "river",
          "savanna",
          "wetland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Warthog and Lion readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Leopard",
        "environments": [
          "dry-season African muddy waterhole edge and cracked yellow grassland"
        ],
        "habitatTags": [
          "coast",
          "desert",
          "meadow",
          "river",
          "savanna",
          "wetland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Warthog and Leopard readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Hyena",
        "environments": [
          "dry-season African muddy waterhole edge and cracked yellow grassland"
        ],
        "habitatTags": [
          "coast",
          "desert",
          "meadow",
          "river",
          "savanna",
          "wetland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Warthog and Hyena readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Crocodile",
        "environments": [
          "dry-season African muddy waterhole edge and cracked yellow grassland"
        ],
        "habitatTags": [
          "coast",
          "desert",
          "meadow",
          "river",
          "savanna",
          "wetland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Warthog and Crocodile readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Nile Crocodile",
        "environments": [
          "dry-season African muddy waterhole edge and cracked yellow grassland"
        ],
        "habitatTags": [
          "coast",
          "desert",
          "meadow",
          "river",
          "savanna",
          "wetland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Warthog and Nile Crocodile readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Gazelle",
    "normalizedName": "gazelle",
    "aliases": [],
    "viralRank": 58,
    "usaPriority": 999,
    "category": "defender",
    "defaultOpposingAnimal": "Lion",
    "opposingAnimals": [
      "Lion",
      "Leopard",
      "African Wild Dog",
      "Cheetah"
    ],
    "primaryEnvironments": [
      "open savanna sprint lane, short-grass plain, and dust-light escape corridor"
    ],
    "secondaryEnvironments": [],
    "badges": [],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "meadow",
      "open",
      "savanna"
    ],
    "promptTemplateHints": [
      "Use Gazelle with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Lion",
        "environments": [
          "open savanna sprint lane, short-grass plain, and dust-light escape corridor"
        ],
        "habitatTags": [
          "meadow",
          "open",
          "savanna"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Gazelle and Lion readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Leopard",
        "environments": [
          "open savanna sprint lane, short-grass plain, and dust-light escape corridor"
        ],
        "habitatTags": [
          "meadow",
          "open",
          "savanna"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Gazelle and Leopard readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "African Wild Dog",
        "environments": [
          "open savanna sprint lane, short-grass plain, and dust-light escape corridor"
        ],
        "habitatTags": [
          "meadow",
          "open",
          "savanna"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Gazelle and African Wild Dog readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Cheetah",
        "environments": [
          "open savanna sprint lane, short-grass plain, and dust-light escape corridor"
        ],
        "habitatTags": [
          "meadow",
          "open",
          "savanna"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Gazelle and Cheetah readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Impala",
    "normalizedName": "impala",
    "aliases": [],
    "viralRank": 59,
    "usaPriority": 999,
    "category": "defender",
    "defaultOpposingAnimal": "Lion",
    "opposingAnimals": [
      "Lion",
      "Leopard",
      "Hyena",
      "African Wild Dog",
      "Cheetah"
    ],
    "primaryEnvironments": [
      "acacia savanna edge, low scrub run lane, and dry grass escape corridor"
    ],
    "secondaryEnvironments": [],
    "badges": [],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "desert",
      "open",
      "savanna"
    ],
    "promptTemplateHints": [
      "Use Impala with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Lion",
        "environments": [
          "acacia savanna edge, low scrub run lane, and dry grass escape corridor"
        ],
        "habitatTags": [
          "desert",
          "open",
          "savanna"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Impala and Lion readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Leopard",
        "environments": [
          "acacia savanna edge, low scrub run lane, and dry grass escape corridor"
        ],
        "habitatTags": [
          "desert",
          "open",
          "savanna"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Impala and Leopard readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Hyena",
        "environments": [
          "acacia savanna edge, low scrub run lane, and dry grass escape corridor"
        ],
        "habitatTags": [
          "desert",
          "open",
          "savanna"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Impala and Hyena readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "African Wild Dog",
        "environments": [
          "acacia savanna edge, low scrub run lane, and dry grass escape corridor"
        ],
        "habitatTags": [
          "desert",
          "open",
          "savanna"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Impala and African Wild Dog readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Cheetah",
        "environments": [
          "acacia savanna edge, low scrub run lane, and dry grass escape corridor"
        ],
        "habitatTags": [
          "desert",
          "open",
          "savanna"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Impala and Cheetah readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Antelope",
    "normalizedName": "antelope",
    "aliases": [],
    "viralRank": 60,
    "usaPriority": 999,
    "category": "defender",
    "defaultOpposingAnimal": "Lion",
    "opposingAnimals": [
      "Lion",
      "Leopard",
      "Hyena",
      "African Wild Dog",
      "Cheetah"
    ],
    "primaryEnvironments": [
      "dry savanna grassland, open bushveld lane, and scrub-edge flight corridor"
    ],
    "secondaryEnvironments": [],
    "badges": [],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "desert",
      "meadow",
      "open",
      "savanna"
    ],
    "promptTemplateHints": [
      "Use Antelope with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Lion",
        "environments": [
          "dry savanna grassland, open bushveld lane, and scrub-edge flight corridor"
        ],
        "habitatTags": [
          "desert",
          "meadow",
          "open",
          "savanna"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Antelope and Lion readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Leopard",
        "environments": [
          "dry savanna grassland, open bushveld lane, and scrub-edge flight corridor"
        ],
        "habitatTags": [
          "desert",
          "meadow",
          "open",
          "savanna"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Antelope and Leopard readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Hyena",
        "environments": [
          "dry savanna grassland, open bushveld lane, and scrub-edge flight corridor"
        ],
        "habitatTags": [
          "desert",
          "meadow",
          "open",
          "savanna"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Antelope and Hyena readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "African Wild Dog",
        "environments": [
          "dry savanna grassland, open bushveld lane, and scrub-edge flight corridor"
        ],
        "habitatTags": [
          "desert",
          "meadow",
          "open",
          "savanna"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Antelope and African Wild Dog readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Cheetah",
        "environments": [
          "dry savanna grassland, open bushveld lane, and scrub-edge flight corridor"
        ],
        "habitatTags": [
          "desert",
          "meadow",
          "open",
          "savanna"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Antelope and Cheetah readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Zebra",
    "normalizedName": "zebra",
    "aliases": [],
    "viralRank": 61,
    "usaPriority": 999,
    "category": "wildlife",
    "defaultOpposingAnimal": "Lion",
    "opposingAnimals": [
      "Lion",
      "Leopard",
      "Hyena",
      "Lion Pack",
      "Nile Crocodile"
    ],
    "primaryEnvironments": [
      "savanna grassland and dusty migration lane"
    ],
    "secondaryEnvironments": [],
    "badges": [],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "meadow",
      "savanna"
    ],
    "promptTemplateHints": [
      "Use Zebra with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Lion",
        "environments": [
          "savanna grassland and dusty migration lane"
        ],
        "habitatTags": [
          "meadow",
          "savanna"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Zebra and Lion readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Leopard",
        "environments": [
          "savanna grassland and dusty migration lane"
        ],
        "habitatTags": [
          "meadow",
          "savanna"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Zebra and Leopard readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Hyena",
        "environments": [
          "savanna grassland and dusty migration lane"
        ],
        "habitatTags": [
          "meadow",
          "savanna"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Zebra and Hyena readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Lion Pack",
        "environments": [
          "savanna grassland and dusty migration lane"
        ],
        "habitatTags": [
          "meadow",
          "savanna"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Zebra and Lion Pack readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Nile Crocodile",
        "environments": [
          "savanna grassland and dusty migration lane"
        ],
        "habitatTags": [
          "meadow",
          "savanna"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Zebra and Nile Crocodile readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Wildebeest",
    "normalizedName": "wildebeest",
    "aliases": [],
    "viralRank": 62,
    "usaPriority": 999,
    "category": "wildlife",
    "defaultOpposingAnimal": "Lion",
    "opposingAnimals": [
      "Lion",
      "Hyena",
      "African Wild Dog",
      "Lion Pack",
      "Nile Crocodile"
    ],
    "primaryEnvironments": [
      "savanna migration corridor and river crossing plain"
    ],
    "secondaryEnvironments": [],
    "badges": [],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "meadow",
      "open",
      "river",
      "savanna"
    ],
    "promptTemplateHints": [
      "Use Wildebeest with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Lion",
        "environments": [
          "savanna migration corridor and river crossing plain"
        ],
        "habitatTags": [
          "meadow",
          "open",
          "river",
          "savanna"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Wildebeest and Lion readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Hyena",
        "environments": [
          "savanna migration corridor and river crossing plain"
        ],
        "habitatTags": [
          "meadow",
          "open",
          "river",
          "savanna"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Wildebeest and Hyena readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "African Wild Dog",
        "environments": [
          "savanna migration corridor and river crossing plain"
        ],
        "habitatTags": [
          "meadow",
          "open",
          "river",
          "savanna"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Wildebeest and African Wild Dog readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Lion Pack",
        "environments": [
          "savanna migration corridor and river crossing plain"
        ],
        "habitatTags": [
          "meadow",
          "open",
          "river",
          "savanna"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Wildebeest and Lion Pack readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Nile Crocodile",
        "environments": [
          "savanna migration corridor and river crossing plain"
        ],
        "habitatTags": [
          "meadow",
          "open",
          "river",
          "savanna"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Wildebeest and Nile Crocodile readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Elephant",
    "normalizedName": "elephant",
    "aliases": [],
    "viralRank": 63,
    "usaPriority": 999,
    "category": "defender",
    "defaultOpposingAnimal": "Cape Buffalo",
    "opposingAnimals": [
      "Cape Buffalo",
      "Lion",
      "Hyena",
      "Nile Crocodile"
    ],
    "primaryEnvironments": [
      "African savanna corridor and river crossing plain"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "Defender"
    ],
    "safeArcLabels": [
      "Defender stands ground"
    ],
    "habitatTags": [
      "meadow",
      "open",
      "river",
      "savanna"
    ],
    "promptTemplateHints": [
      "Use Elephant with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Cape Buffalo",
        "environments": [
          "African savanna corridor and river crossing plain"
        ],
        "habitatTags": [
          "meadow",
          "open",
          "river",
          "savanna"
        ],
        "safeArcLabel": "Defender stands ground",
        "badges": [
          "Defender"
        ],
        "promptTemplateHint": "Keep Elephant and Cape Buffalo readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Lion",
        "environments": [
          "African savanna corridor and river crossing plain"
        ],
        "habitatTags": [
          "meadow",
          "open",
          "river",
          "savanna"
        ],
        "safeArcLabel": "Defender stands ground",
        "badges": [
          "Defender"
        ],
        "promptTemplateHint": "Keep Elephant and Lion readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Hyena",
        "environments": [
          "African savanna corridor and river crossing plain"
        ],
        "habitatTags": [
          "meadow",
          "open",
          "river",
          "savanna"
        ],
        "safeArcLabel": "Defender stands ground",
        "badges": [
          "Defender"
        ],
        "promptTemplateHint": "Keep Elephant and Hyena readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Nile Crocodile",
        "environments": [
          "African savanna corridor and river crossing plain"
        ],
        "habitatTags": [
          "meadow",
          "open",
          "river",
          "savanna"
        ],
        "safeArcLabel": "Defender stands ground",
        "badges": [
          "Defender"
        ],
        "promptTemplateHint": "Keep Elephant and Nile Crocodile readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Rhinoceros",
    "normalizedName": "rhinoceros",
    "aliases": [],
    "viralRank": 64,
    "usaPriority": 999,
    "category": "defender",
    "defaultOpposingAnimal": "Cape Buffalo",
    "opposingAnimals": [
      "Cape Buffalo",
      "Lion",
      "Hyena",
      "African Wild Dog"
    ],
    "primaryEnvironments": [
      "dry savanna plain and dusty waterhole track"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "Defender"
    ],
    "safeArcLabels": [
      "Defender stands ground"
    ],
    "habitatTags": [
      "desert",
      "meadow",
      "open",
      "river",
      "savanna"
    ],
    "promptTemplateHints": [
      "Use Rhinoceros with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Cape Buffalo",
        "environments": [
          "dry savanna plain and dusty waterhole track"
        ],
        "habitatTags": [
          "desert",
          "meadow",
          "open",
          "river",
          "savanna"
        ],
        "safeArcLabel": "Defender stands ground",
        "badges": [
          "Defender"
        ],
        "promptTemplateHint": "Keep Rhinoceros and Cape Buffalo readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Lion",
        "environments": [
          "dry savanna plain and dusty waterhole track"
        ],
        "habitatTags": [
          "desert",
          "meadow",
          "open",
          "river",
          "savanna"
        ],
        "safeArcLabel": "Defender stands ground",
        "badges": [
          "Defender"
        ],
        "promptTemplateHint": "Keep Rhinoceros and Lion readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Hyena",
        "environments": [
          "dry savanna plain and dusty waterhole track"
        ],
        "habitatTags": [
          "desert",
          "meadow",
          "open",
          "river",
          "savanna"
        ],
        "safeArcLabel": "Defender stands ground",
        "badges": [
          "Defender"
        ],
        "promptTemplateHint": "Keep Rhinoceros and Hyena readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "African Wild Dog",
        "environments": [
          "dry savanna plain and dusty waterhole track"
        ],
        "habitatTags": [
          "desert",
          "meadow",
          "open",
          "river",
          "savanna"
        ],
        "safeArcLabel": "Defender stands ground",
        "badges": [
          "Defender"
        ],
        "promptTemplateHint": "Keep Rhinoceros and African Wild Dog readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Hippopotamus",
    "normalizedName": "hippopotamus",
    "aliases": [],
    "viralRank": 65,
    "usaPriority": 999,
    "category": "defender",
    "defaultOpposingAnimal": "Cape Buffalo",
    "opposingAnimals": [
      "Cape Buffalo",
      "Lion",
      "Hyena",
      "Lion Pack",
      "Nile Crocodile"
    ],
    "primaryEnvironments": [
      "African river channel and muddy waterhole margin"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "Defender"
    ],
    "safeArcLabels": [
      "Defender stands ground"
    ],
    "habitatTags": [
      "river",
      "wetland"
    ],
    "promptTemplateHints": [
      "Use Hippopotamus with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Cape Buffalo",
        "environments": [
          "African river channel and muddy waterhole margin"
        ],
        "habitatTags": [
          "river",
          "wetland"
        ],
        "safeArcLabel": "Defender stands ground",
        "badges": [
          "Defender"
        ],
        "promptTemplateHint": "Keep Hippopotamus and Cape Buffalo readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Lion",
        "environments": [
          "African river channel and muddy waterhole margin"
        ],
        "habitatTags": [
          "river",
          "wetland"
        ],
        "safeArcLabel": "Defender stands ground",
        "badges": [
          "Defender"
        ],
        "promptTemplateHint": "Keep Hippopotamus and Lion readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Hyena",
        "environments": [
          "African river channel and muddy waterhole margin"
        ],
        "habitatTags": [
          "river",
          "wetland"
        ],
        "safeArcLabel": "Defender stands ground",
        "badges": [
          "Defender"
        ],
        "promptTemplateHint": "Keep Hippopotamus and Hyena readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Lion Pack",
        "environments": [
          "African river channel and muddy waterhole margin"
        ],
        "habitatTags": [
          "river",
          "wetland"
        ],
        "safeArcLabel": "Defender stands ground",
        "badges": [
          "Defender"
        ],
        "promptTemplateHint": "Keep Hippopotamus and Lion Pack readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Nile Crocodile",
        "environments": [
          "African river channel and muddy waterhole margin"
        ],
        "habitatTags": [
          "river",
          "wetland"
        ],
        "safeArcLabel": "Defender stands ground",
        "badges": [
          "Defender"
        ],
        "promptTemplateHint": "Keep Hippopotamus and Nile Crocodile readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Gorilla",
    "normalizedName": "gorilla",
    "aliases": [],
    "viralRank": 66,
    "usaPriority": 999,
    "category": "documentary",
    "defaultOpposingAnimal": "Leopard",
    "opposingAnimals": [
      "Leopard",
      "King Cobra",
      "Python"
    ],
    "primaryEnvironments": [
      "misty montane rainforest edge and jungle clearing"
    ],
    "secondaryEnvironments": [],
    "badges": [],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "forest",
      "jungle",
      "rainforest"
    ],
    "promptTemplateHints": [
      "Use Gorilla with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Leopard",
        "environments": [
          "misty montane rainforest edge and jungle clearing"
        ],
        "habitatTags": [
          "forest",
          "jungle",
          "rainforest"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Gorilla and Leopard readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "King Cobra",
        "environments": [
          "misty montane rainforest edge and jungle clearing"
        ],
        "habitatTags": [
          "forest",
          "jungle",
          "rainforest"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Gorilla and King Cobra readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Python",
        "environments": [
          "misty montane rainforest edge and jungle clearing"
        ],
        "habitatTags": [
          "forest",
          "jungle",
          "rainforest"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Gorilla and Python readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Chimpanzee",
    "normalizedName": "chimpanzee",
    "aliases": [],
    "viralRank": 67,
    "usaPriority": 999,
    "category": "documentary",
    "defaultOpposingAnimal": "Bushbuck Fawn",
    "opposingAnimals": [
      "Bushbuck Fawn",
      "Colobus Monkey",
      "Red River Hog Piglet"
    ],
    "primaryEnvironments": [
      "dense equatorial African rainforest"
    ],
    "secondaryEnvironments": [],
    "badges": [],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "forest",
      "rainforest"
    ],
    "promptTemplateHints": [
      "Use Chimpanzee with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Bushbuck Fawn",
        "environments": [
          "dense equatorial African rainforest"
        ],
        "habitatTags": [
          "forest",
          "rainforest"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Chimpanzee and Bushbuck Fawn readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Colobus Monkey",
        "environments": [
          "dense equatorial African rainforest"
        ],
        "habitatTags": [
          "forest",
          "rainforest"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Chimpanzee and Colobus Monkey readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Red River Hog Piglet",
        "environments": [
          "dense equatorial African rainforest"
        ],
        "habitatTags": [
          "forest",
          "rainforest"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Chimpanzee and Red River Hog Piglet readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Anaconda",
    "normalizedName": "anaconda",
    "aliases": [],
    "viralRank": 68,
    "usaPriority": 999,
    "category": "predator",
    "defaultOpposingAnimal": "White-tailed Deer",
    "opposingAnimals": [
      "White-tailed Deer",
      "Wild Boar",
      "Caiman",
      "Large Fish"
    ],
    "primaryEnvironments": [
      "murky rainforest backwater and flooded reed margin"
    ],
    "secondaryEnvironments": [],
    "badges": [],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "forest",
      "rainforest",
      "wetland"
    ],
    "promptTemplateHints": [
      "Use Anaconda with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "White-tailed Deer",
        "environments": [
          "murky rainforest backwater and flooded reed margin"
        ],
        "habitatTags": [
          "forest",
          "rainforest",
          "wetland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Anaconda and White-tailed Deer readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Wild Boar",
        "environments": [
          "murky rainforest backwater and flooded reed margin"
        ],
        "habitatTags": [
          "forest",
          "rainforest",
          "wetland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Anaconda and Wild Boar readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Caiman",
        "environments": [
          "murky rainforest backwater and flooded reed margin"
        ],
        "habitatTags": [
          "forest",
          "rainforest",
          "wetland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Anaconda and Caiman readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Large Fish",
        "environments": [
          "murky rainforest backwater and flooded reed margin"
        ],
        "habitatTags": [
          "forest",
          "rainforest",
          "wetland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Anaconda and Large Fish readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Python",
    "normalizedName": "python",
    "aliases": [],
    "viralRank": 69,
    "usaPriority": 999,
    "category": "predator",
    "defaultOpposingAnimal": "White-tailed Deer",
    "opposingAnimals": [
      "White-tailed Deer",
      "Bird",
      "Lizard",
      "Monkey"
    ],
    "primaryEnvironments": [
      "humid forest floor and riverbank thicket"
    ],
    "secondaryEnvironments": [],
    "badges": [],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "forest",
      "river"
    ],
    "promptTemplateHints": [
      "Use Python with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "White-tailed Deer",
        "environments": [
          "humid forest floor and riverbank thicket"
        ],
        "habitatTags": [
          "forest",
          "river"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Python and White-tailed Deer readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Bird",
        "environments": [
          "humid forest floor and riverbank thicket"
        ],
        "habitatTags": [
          "forest",
          "river"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Python and Bird readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Lizard",
        "environments": [
          "humid forest floor and riverbank thicket"
        ],
        "habitatTags": [
          "forest",
          "river"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Python and Lizard readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Monkey",
        "environments": [
          "humid forest floor and riverbank thicket"
        ],
        "habitatTags": [
          "forest",
          "river"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Python and Monkey readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "King Cobra",
    "normalizedName": "king-cobra",
    "aliases": [],
    "viralRank": 70,
    "usaPriority": 999,
    "category": "predator",
    "defaultOpposingAnimal": "Rattlesnake",
    "opposingAnimals": [
      "Rattlesnake",
      "Bird",
      "Monitor Lizard",
      "Rat"
    ],
    "primaryEnvironments": [
      "humid jungle edge and bamboo thicket"
    ],
    "secondaryEnvironments": [],
    "badges": [],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "jungle"
    ],
    "promptTemplateHints": [
      "Use King Cobra with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Rattlesnake",
        "environments": [
          "humid jungle edge and bamboo thicket"
        ],
        "habitatTags": [
          "jungle"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep King Cobra and Rattlesnake readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Bird",
        "environments": [
          "humid jungle edge and bamboo thicket"
        ],
        "habitatTags": [
          "jungle"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep King Cobra and Bird readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Monitor Lizard",
        "environments": [
          "humid jungle edge and bamboo thicket"
        ],
        "habitatTags": [
          "jungle"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep King Cobra and Monitor Lizard readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Rat",
        "environments": [
          "humid jungle edge and bamboo thicket"
        ],
        "habitatTags": [
          "jungle"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep King Cobra and Rat readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Caiman",
    "normalizedName": "caiman",
    "aliases": [],
    "viralRank": 71,
    "usaPriority": 999,
    "category": "wildlife",
    "defaultOpposingAnimal": "Anaconda",
    "opposingAnimals": [
      "Anaconda",
      "Crocodile",
      "Jaguar"
    ],
    "primaryEnvironments": [
      "Amazon muddy bank, still backwater channel, and flooded rainforest margin"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "Kling 15s",
      "Water ambush"
    ],
    "safeArcLabels": [
      "Survival encounter",
      "Near-clash"
    ],
    "habitatTags": [
      "forest",
      "rainforest",
      "river",
      "wetland"
    ],
    "promptTemplateHints": [
      "Use Caiman with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Anaconda",
        "environments": [
          "Amazon muddy bank, still backwater channel, and flooded rainforest margin"
        ],
        "habitatTags": [
          "forest",
          "rainforest",
          "river",
          "wetland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Caiman and Anaconda readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Crocodile",
        "environments": [
          "Amazon muddy bank, still backwater channel, and flooded rainforest margin"
        ],
        "habitatTags": [
          "forest",
          "rainforest",
          "river",
          "wetland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Caiman and Crocodile readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Jaguar",
        "environments": [
          "Amazon muddy bank",
          "still backwater channel"
        ],
        "habitatTags": [
          "river",
          "jungle",
          "rainforest"
        ],
        "safeArcLabel": "Near-clash",
        "badges": [
          "Kling 15s",
          "Water ambush"
        ],
        "promptTemplateHint": "Keep Caiman and Jaguar readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Tiger Shark",
    "normalizedName": "tiger-shark",
    "aliases": [],
    "viralRank": 72,
    "usaPriority": 999,
    "category": "predator",
    "defaultOpposingAnimal": "Seal",
    "opposingAnimals": [
      "Seal",
      "Sea Lion",
      "Fish",
      "Sea Turtle"
    ],
    "primaryEnvironments": [
      "warm coastal blue water and reef drop-off"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "Water ambush"
    ],
    "safeArcLabels": [
      "Water ambush"
    ],
    "habitatTags": [
      "coast"
    ],
    "promptTemplateHints": [
      "Use Tiger Shark with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Seal",
        "environments": [
          "warm coastal blue water and reef drop-off"
        ],
        "habitatTags": [
          "coast"
        ],
        "safeArcLabel": "Water ambush",
        "badges": [
          "Water ambush"
        ],
        "promptTemplateHint": "Keep Tiger Shark and Seal readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Sea Lion",
        "environments": [
          "warm coastal blue water and reef drop-off"
        ],
        "habitatTags": [
          "coast"
        ],
        "safeArcLabel": "Water ambush",
        "badges": [
          "Water ambush"
        ],
        "promptTemplateHint": "Keep Tiger Shark and Sea Lion readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Fish",
        "environments": [
          "warm coastal blue water and reef drop-off"
        ],
        "habitatTags": [
          "coast"
        ],
        "safeArcLabel": "Water ambush",
        "badges": [
          "Water ambush"
        ],
        "promptTemplateHint": "Keep Tiger Shark and Fish readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Sea Turtle",
        "environments": [
          "warm coastal blue water and reef drop-off"
        ],
        "habitatTags": [
          "coast"
        ],
        "safeArcLabel": "Water ambush",
        "badges": [
          "Water ambush"
        ],
        "promptTemplateHint": "Keep Tiger Shark and Sea Turtle readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Bull Shark",
    "normalizedName": "bull-shark",
    "aliases": [],
    "viralRank": 73,
    "usaPriority": 999,
    "category": "predator",
    "defaultOpposingAnimal": "Fish",
    "opposingAnimals": [
      "Fish",
      "Dolphin",
      "Sea Turtle",
      "Waterbird"
    ],
    "primaryEnvironments": [
      "murky coastal inlet and river mouth channel"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "Water ambush"
    ],
    "safeArcLabels": [
      "Water ambush"
    ],
    "habitatTags": [
      "coast",
      "river"
    ],
    "promptTemplateHints": [
      "Use Bull Shark with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Fish",
        "environments": [
          "murky coastal inlet and river mouth channel"
        ],
        "habitatTags": [
          "coast",
          "river"
        ],
        "safeArcLabel": "Water ambush",
        "badges": [
          "Water ambush"
        ],
        "promptTemplateHint": "Keep Bull Shark and Fish readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Dolphin",
        "environments": [
          "murky coastal inlet and river mouth channel"
        ],
        "habitatTags": [
          "coast",
          "river"
        ],
        "safeArcLabel": "Water ambush",
        "badges": [
          "Water ambush"
        ],
        "promptTemplateHint": "Keep Bull Shark and Dolphin readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Sea Turtle",
        "environments": [
          "murky coastal inlet and river mouth channel"
        ],
        "habitatTags": [
          "coast",
          "river"
        ],
        "safeArcLabel": "Water ambush",
        "badges": [
          "Water ambush"
        ],
        "promptTemplateHint": "Keep Bull Shark and Sea Turtle readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Waterbird",
        "environments": [
          "murky coastal inlet and river mouth channel"
        ],
        "habitatTags": [
          "coast",
          "river"
        ],
        "safeArcLabel": "Water ambush",
        "badges": [
          "Water ambush"
        ],
        "promptTemplateHint": "Keep Bull Shark and Waterbird readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Red Deer",
    "normalizedName": "red-deer",
    "aliases": [],
    "viralRank": 74,
    "usaPriority": 999,
    "category": "defender",
    "defaultOpposingAnimal": "Brown Bear",
    "opposingAnimals": [
      "Brown Bear",
      "Lynx",
      "Wolf"
    ],
    "primaryEnvironments": [
      "misty forest clearing and highland meadow"
    ],
    "secondaryEnvironments": [],
    "badges": [],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "forest",
      "meadow",
      "mountain"
    ],
    "promptTemplateHints": [
      "Use Red Deer with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Brown Bear",
        "environments": [
          "misty forest clearing and highland meadow"
        ],
        "habitatTags": [
          "forest",
          "meadow",
          "mountain"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Red Deer and Brown Bear readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Lynx",
        "environments": [
          "misty forest clearing and highland meadow"
        ],
        "habitatTags": [
          "forest",
          "meadow",
          "mountain"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Red Deer and Lynx readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Wolf",
        "environments": [
          "misty forest clearing and highland meadow"
        ],
        "habitatTags": [
          "forest",
          "meadow",
          "mountain"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Red Deer and Wolf readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Pronghorn",
    "normalizedName": "pronghorn",
    "aliases": [],
    "viralRank": 75,
    "usaPriority": 37,
    "category": "escape",
    "defaultOpposingAnimal": "Coyote",
    "opposingAnimals": [
      "Coyote",
      "Mountain Lion",
      "Golden Eagle"
    ],
    "primaryEnvironments": [
      "wind-swept sage flat",
      "shortgrass prairie horizon",
      "badlands rim chase lane"
    ],
    "secondaryEnvironments": [
      "open coulee crossing"
    ],
    "badges": [
      "USA viral",
      "Fast hook"
    ],
    "safeArcLabels": [
      "Escape pressure",
      "Chase pressure",
      "Last-second escape"
    ],
    "habitatTags": [
      "open",
      "meadow",
      "woodland"
    ],
    "promptTemplateHints": [
      "Use Pronghorn with long-horizon speed readability, heat shimmer, and clear pursuit lanes."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Coyote",
        "environments": [
          "wind-swept sage flat",
          "shortgrass prairie horizon"
        ],
        "habitatTags": [
          "open",
          "meadow",
          "woodland"
        ],
        "safeArcLabel": "Escape pressure",
        "badges": [
          "USA viral",
          "Fast hook"
        ],
        "promptTemplateHint": "Keep Pronghorn and Coyote readable across the same flat with clean lateral motion and no terrain confusion."
      },
      {
        "animal": "Mountain Lion",
        "environments": [
          "badlands rim chase lane",
          "brushy coulee break"
        ],
        "habitatTags": [
          "open",
          "meadow",
          "woodland"
        ],
        "safeArcLabel": "Near-clash",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Pronghorn and Mountain Lion readable with long sightlines and a believable interception angle."
      },
      {
        "animal": "Golden Eagle",
        "environments": [
          "shortgrass prairie horizon"
        ],
        "habitatTags": [
          "open",
          "meadow"
        ],
        "safeArcLabel": "Last-second escape",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Use a smaller juvenile Pronghorn read only if needed, with a clean aerial strike lane and readable scale."
      }
    ]
  },
  {
    "leadAnimal": "Roe Deer",
    "normalizedName": "roe-deer",
    "aliases": [],
    "viralRank": 76,
    "usaPriority": 999,
    "category": "defender",
    "defaultOpposingAnimal": "Red Fox",
    "opposingAnimals": [
      "Red Fox",
      "Lynx",
      "Wolf"
    ],
    "primaryEnvironments": [
      "forest edge, hedgerow, and snowy woodland pocket"
    ],
    "secondaryEnvironments": [],
    "badges": [],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "forest",
      "snow",
      "woodland"
    ],
    "promptTemplateHints": [
      "Use Roe Deer with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Red Fox",
        "environments": [
          "forest edge, hedgerow, and snowy woodland pocket"
        ],
        "habitatTags": [
          "forest",
          "snow",
          "woodland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Roe Deer and Red Fox readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Lynx",
        "environments": [
          "forest edge, hedgerow, and snowy woodland pocket"
        ],
        "habitatTags": [
          "forest",
          "snow",
          "woodland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Roe Deer and Lynx readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Wolf",
        "environments": [
          "forest edge, hedgerow, and snowy woodland pocket"
        ],
        "habitatTags": [
          "forest",
          "snow",
          "woodland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Roe Deer and Wolf readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Arctic Fox",
    "normalizedName": "arctic-fox",
    "aliases": [],
    "viralRank": 77,
    "usaPriority": 999,
    "category": "wildlife",
    "defaultOpposingAnimal": "Bird Egg",
    "opposingAnimals": [
      "Bird Egg",
      "Hare",
      "Mouse",
      "Seal Pup"
    ],
    "primaryEnvironments": [
      "tundra slope and snow-covered fjord edge"
    ],
    "secondaryEnvironments": [],
    "badges": [],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "coast",
      "snow",
      "tundra"
    ],
    "promptTemplateHints": [
      "Use Arctic Fox with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Bird Egg",
        "environments": [
          "tundra slope and snow-covered fjord edge"
        ],
        "habitatTags": [
          "coast",
          "snow",
          "tundra"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Arctic Fox and Bird Egg readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Hare",
        "environments": [
          "tundra slope and snow-covered fjord edge"
        ],
        "habitatTags": [
          "coast",
          "snow",
          "tundra"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Arctic Fox and Hare readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Mouse",
        "environments": [
          "tundra slope and snow-covered fjord edge"
        ],
        "habitatTags": [
          "coast",
          "snow",
          "tundra"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Arctic Fox and Mouse readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Seal Pup",
        "environments": [
          "tundra slope and snow-covered fjord edge"
        ],
        "habitatTags": [
          "coast",
          "snow",
          "tundra"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Arctic Fox and Seal Pup readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "White-tailed Eagle",
    "normalizedName": "white-tailed-eagle",
    "aliases": [],
    "viralRank": 78,
    "usaPriority": 999,
    "category": "predator",
    "defaultOpposingAnimal": "Fish",
    "opposingAnimals": [
      "Fish",
      "Duck",
      "Seal Pup"
    ],
    "primaryEnvironments": [
      "fjord shoreline and cold coastal lake edge"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "Fast hook"
    ],
    "safeArcLabels": [
      "Sudden lunge"
    ],
    "habitatTags": [
      "coast",
      "river"
    ],
    "promptTemplateHints": [
      "Use White-tailed Eagle with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Fish",
        "environments": [
          "fjord shoreline and cold coastal lake edge"
        ],
        "habitatTags": [
          "coast",
          "river"
        ],
        "safeArcLabel": "Sudden lunge",
        "badges": [
          "Fast hook"
        ],
        "promptTemplateHint": "Keep White-tailed Eagle and Fish readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Duck",
        "environments": [
          "fjord shoreline and cold coastal lake edge"
        ],
        "habitatTags": [
          "coast",
          "river"
        ],
        "safeArcLabel": "Sudden lunge",
        "badges": [
          "Fast hook"
        ],
        "promptTemplateHint": "Keep White-tailed Eagle and Duck readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Seal Pup",
        "environments": [
          "fjord shoreline and cold coastal lake edge"
        ],
        "habitatTags": [
          "coast",
          "river"
        ],
        "safeArcLabel": "Sudden lunge",
        "badges": [
          "Fast hook"
        ],
        "promptTemplateHint": "Keep White-tailed Eagle and Seal Pup readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Seal",
    "normalizedName": "seal",
    "aliases": [],
    "viralRank": 79,
    "usaPriority": 999,
    "category": "predator",
    "defaultOpposingAnimal": "Great White Shark",
    "opposingAnimals": [
      "Great White Shark",
      "Orca",
      "Polar Bear"
    ],
    "primaryEnvironments": [
      "cold coastal water and icy fjord edge"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "Water ambush"
    ],
    "safeArcLabels": [
      "Water ambush"
    ],
    "habitatTags": [
      "coast",
      "snow"
    ],
    "promptTemplateHints": [
      "Use Seal with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Great White Shark",
        "environments": [
          "cold coastal water and icy fjord edge"
        ],
        "habitatTags": [
          "coast",
          "snow"
        ],
        "safeArcLabel": "Water ambush",
        "badges": [
          "Water ambush"
        ],
        "promptTemplateHint": "Keep Seal and Great White Shark readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Orca",
        "environments": [
          "cold coastal water and icy fjord edge"
        ],
        "habitatTags": [
          "coast",
          "snow"
        ],
        "safeArcLabel": "Water ambush",
        "badges": [
          "Water ambush"
        ],
        "promptTemplateHint": "Keep Seal and Orca readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Polar Bear",
        "environments": [
          "cold coastal water and icy fjord edge"
        ],
        "habitatTags": [
          "coast",
          "snow"
        ],
        "safeArcLabel": "Water ambush",
        "badges": [
          "Water ambush"
        ],
        "promptTemplateHint": "Keep Seal and Polar Bear readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Dolphin",
    "normalizedName": "dolphin",
    "aliases": [],
    "viralRank": 80,
    "usaPriority": 999,
    "category": "documentary",
    "defaultOpposingAnimal": "Fish",
    "opposingAnimals": [
      "Fish",
      "Mackerel",
      "Sardines",
      "Squid"
    ],
    "primaryEnvironments": [
      "coastal ocean shallows and estuary mouth with sunbeams and surface chop"
    ],
    "secondaryEnvironments": [],
    "badges": [],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "coast",
      "river"
    ],
    "promptTemplateHints": [
      "Use Dolphin with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Fish",
        "environments": [
          "coastal ocean shallows and estuary mouth with sunbeams and surface chop"
        ],
        "habitatTags": [
          "coast",
          "river"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Dolphin and Fish readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Mackerel",
        "environments": [
          "coastal ocean shallows and estuary mouth with sunbeams and surface chop"
        ],
        "habitatTags": [
          "coast",
          "river"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Dolphin and Mackerel readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Sardines",
        "environments": [
          "coastal ocean shallows and estuary mouth with sunbeams and surface chop"
        ],
        "habitatTags": [
          "coast",
          "river"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Dolphin and Sardines readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Squid",
        "environments": [
          "coastal ocean shallows and estuary mouth with sunbeams and surface chop"
        ],
        "habitatTags": [
          "coast",
          "river"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Dolphin and Squid readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Wild Horse",
    "normalizedName": "wild-horse",
    "aliases": [],
    "viralRank": 81,
    "usaPriority": 999,
    "category": "defender",
    "defaultOpposingAnimal": "Wolf Pack",
    "opposingAnimals": [
      "Wolf Pack",
      "Brown Bear",
      "Mountain Lion"
    ],
    "primaryEnvironments": [
      "open mountain valley and wind-swept grassland"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "USA viral"
    ],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "meadow",
      "mountain",
      "open",
      "savanna"
    ],
    "promptTemplateHints": [
      "Use Wild Horse with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Wolf Pack",
        "environments": [
          "open mountain valley and wind-swept grassland"
        ],
        "habitatTags": [
          "meadow",
          "mountain",
          "open",
          "savanna"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Wild Horse and Wolf Pack readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Brown Bear",
        "environments": [
          "open mountain valley and wind-swept grassland"
        ],
        "habitatTags": [
          "meadow",
          "mountain",
          "open",
          "savanna"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Wild Horse and Brown Bear readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Mountain Lion",
        "environments": [
          "open mountain valley and wind-swept grassland"
        ],
        "habitatTags": [
          "meadow",
          "mountain",
          "open",
          "savanna"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Wild Horse and Mountain Lion readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Kangaroo",
    "normalizedName": "kangaroo",
    "aliases": [],
    "viralRank": 82,
    "usaPriority": 999,
    "category": "defender",
    "defaultOpposingAnimal": "Dingo",
    "opposingAnimals": [
      "Dingo",
      "Saltwater Crocodile",
      "Wedge-tailed Eagle"
    ],
    "primaryEnvironments": [
      "dusty outback grassland and eucalyptus woodland edge"
    ],
    "secondaryEnvironments": [],
    "badges": [],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "desert",
      "forest",
      "meadow",
      "savanna",
      "woodland"
    ],
    "promptTemplateHints": [
      "Use Kangaroo with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Dingo",
        "environments": [
          "dusty outback grassland and eucalyptus woodland edge"
        ],
        "habitatTags": [
          "desert",
          "forest",
          "meadow",
          "savanna",
          "woodland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Kangaroo and Dingo readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Saltwater Crocodile",
        "environments": [
          "dusty outback grassland and eucalyptus woodland edge"
        ],
        "habitatTags": [
          "desert",
          "forest",
          "meadow",
          "savanna",
          "woodland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Kangaroo and Saltwater Crocodile readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Wedge-tailed Eagle",
        "environments": [
          "dusty outback grassland and eucalyptus woodland edge"
        ],
        "habitatTags": [
          "desert",
          "forest",
          "meadow",
          "savanna",
          "woodland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Kangaroo and Wedge-tailed Eagle readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Dingo",
    "normalizedName": "dingo",
    "aliases": [],
    "viralRank": 83,
    "usaPriority": 999,
    "category": "wildlife",
    "defaultOpposingAnimal": "Rabbit",
    "opposingAnimals": [
      "Rabbit",
      "Emu",
      "Kangaroo",
      "Wombat"
    ],
    "primaryEnvironments": [
      "dry outback scrubland and open red-dirt plain"
    ],
    "secondaryEnvironments": [],
    "badges": [],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "desert",
      "meadow",
      "open"
    ],
    "promptTemplateHints": [
      "Use Dingo with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Rabbit",
        "environments": [
          "dry outback scrubland and open red-dirt plain"
        ],
        "habitatTags": [
          "desert",
          "meadow",
          "open"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Dingo and Rabbit readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Emu",
        "environments": [
          "dry outback scrubland and open red-dirt plain"
        ],
        "habitatTags": [
          "desert",
          "meadow",
          "open"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Dingo and Emu readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Kangaroo",
        "environments": [
          "dry outback scrubland and open red-dirt plain"
        ],
        "habitatTags": [
          "desert",
          "meadow",
          "open"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Dingo and Kangaroo readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Wombat",
        "environments": [
          "dry outback scrubland and open red-dirt plain"
        ],
        "habitatTags": [
          "desert",
          "meadow",
          "open"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Dingo and Wombat readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Freshwater Crocodile",
    "normalizedName": "freshwater-crocodile",
    "aliases": [],
    "viralRank": 84,
    "usaPriority": 999,
    "category": "predator",
    "defaultOpposingAnimal": "Fish",
    "opposingAnimals": [
      "Fish",
      "Bird",
      "Kangaroo"
    ],
    "primaryEnvironments": [
      "quiet riverbank and muddy inland waterline"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "Water ambush"
    ],
    "safeArcLabels": [
      "Water ambush"
    ],
    "habitatTags": [
      "river",
      "wetland"
    ],
    "promptTemplateHints": [
      "Use Freshwater Crocodile with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Fish",
        "environments": [
          "quiet riverbank and muddy inland waterline"
        ],
        "habitatTags": [
          "river",
          "wetland"
        ],
        "safeArcLabel": "Water ambush",
        "badges": [
          "Water ambush"
        ],
        "promptTemplateHint": "Keep Freshwater Crocodile and Fish readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Bird",
        "environments": [
          "quiet riverbank and muddy inland waterline"
        ],
        "habitatTags": [
          "river",
          "wetland"
        ],
        "safeArcLabel": "Water ambush",
        "badges": [
          "Water ambush"
        ],
        "promptTemplateHint": "Keep Freshwater Crocodile and Bird readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Kangaroo",
        "environments": [
          "quiet riverbank and muddy inland waterline"
        ],
        "habitatTags": [
          "river",
          "wetland"
        ],
        "safeArcLabel": "Water ambush",
        "badges": [
          "Water ambush"
        ],
        "promptTemplateHint": "Keep Freshwater Crocodile and Kangaroo readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Koala",
    "normalizedName": "koala",
    "aliases": [],
    "viralRank": 85,
    "usaPriority": 999,
    "category": "documentary",
    "defaultOpposingAnimal": "Python",
    "opposingAnimals": [
      "Python",
      "Dingo",
      "Monitor Lizard"
    ],
    "primaryEnvironments": [
      "misty eucalyptus canopy above a dry creek gully"
    ],
    "secondaryEnvironments": [
      "gum woodland fork at dawn"
    ],
    "badges": [],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "forest",
      "woodland"
    ],
    "promptTemplateHints": [
      "Use Koala with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Python",
        "environments": [
          "misty eucalyptus canopy above a dry creek gully"
        ],
        "habitatTags": [
          "forest",
          "woodland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Koala and Python readable in the same eucalyptus canopy with believable branch contact and quiet tension."
      },
      {
        "animal": "Dingo",
        "environments": [
          "gum woodland fork at dawn"
        ],
        "habitatTags": [
          "forest",
          "woodland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Koala and Dingo separated by height and terrain so the threat reads without breaking realism."
      },
      {
        "animal": "Monitor Lizard",
        "environments": [
          "dry creek gully below eucalyptus roots"
        ],
        "habitatTags": [
          "forest",
          "woodland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Koala and Monitor Lizard readable with canopy-to-ground geography and clean habitat continuity."
      }
    ]
  },
  {
    "leadAnimal": "Wombat",
    "normalizedName": "wombat",
    "aliases": [],
    "viralRank": 86,
    "usaPriority": 999,
    "category": "documentary",
    "defaultOpposingAnimal": "Dingo",
    "opposingAnimals": [
      "Dingo",
      "Python",
      "Monitor Lizard"
    ],
    "primaryEnvironments": [
      "burrow mouth on a moonlit grassland bank"
    ],
    "secondaryEnvironments": [
      "scrubland drainage line"
    ],
    "badges": [],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "meadow",
      "open",
      "woodland"
    ],
    "promptTemplateHints": [
      "Use Wombat with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Dingo",
        "environments": [
          "burrow mouth on a moonlit grassland bank"
        ],
        "habitatTags": [
          "meadow",
          "open",
          "woodland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Wombat and Dingo readable around the burrow entrance with grounded dust and believable pursuit distance."
      },
      {
        "animal": "Python",
        "environments": [
          "scrubland drainage line"
        ],
        "habitatTags": [
          "meadow",
          "open",
          "woodland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Wombat and Python readable with low ground tension, clean burrow geography, and no habitat drift."
      },
      {
        "animal": "Monitor Lizard",
        "environments": [
          "sunlit burrow apron and scrub path"
        ],
        "habitatTags": [
          "meadow",
          "open",
          "woodland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Wombat and Monitor Lizard readable with low-angle terrain detail and believable body weight."
      }
    ]
  },
  {
    "leadAnimal": "Emu",
    "normalizedName": "emu",
    "aliases": [],
    "viralRank": 87,
    "usaPriority": 999,
    "category": "documentary",
    "defaultOpposingAnimal": "Dingo",
    "opposingAnimals": [
      "Dingo",
      "Wedge-tailed Eagle",
      "Python"
    ],
    "primaryEnvironments": [
      "windy red-dirt plain and spinifex corridor"
    ],
    "secondaryEnvironments": [
      "open scrub ridge at dawn"
    ],
    "badges": [],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "desert",
      "meadow",
      "open",
      "woodland"
    ],
    "promptTemplateHints": [
      "Use Emu with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Dingo",
        "environments": [
          "windy red-dirt plain and spinifex corridor"
        ],
        "habitatTags": [
          "desert",
          "meadow",
          "open",
          "woodland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Emu and Dingo readable in the same red-dirt corridor with strong leg motion and dust trails."
      },
      {
        "animal": "Wedge-tailed Eagle",
        "environments": [
          "open scrub ridge at dawn"
        ],
        "habitatTags": [
          "desert",
          "meadow",
          "open",
          "woodland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Stage Emu and Wedge-tailed Eagle with open vertical space and a clear chick-defense read."
      },
      {
        "animal": "Python",
        "environments": [
          "spinifex-lined creek bed"
        ],
        "habitatTags": [
          "desert",
          "meadow",
          "open",
          "woodland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Emu and Python readable at ground level with believable scrub density and clean anatomy."
      }
    ]
  },
  {
    "leadAnimal": "Cassowary",
    "normalizedName": "cassowary",
    "aliases": [],
    "viralRank": 88,
    "usaPriority": 999,
    "category": "documentary",
    "defaultOpposingAnimal": "Python",
    "opposingAnimals": [
      "Python",
      "Monitor Lizard",
      "Saltwater Crocodile"
    ],
    "primaryEnvironments": [
      "rainforest creek crossing with tangled buttress roots"
    ],
    "secondaryEnvironments": [
      "wet jungle trail after rain"
    ],
    "badges": [],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "forest",
      "jungle",
      "rainforest",
      "river"
    ],
    "promptTemplateHints": [
      "Use Cassowary with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Python",
        "environments": [
          "rainforest creek crossing with tangled buttress roots"
        ],
        "habitatTags": [
          "forest",
          "jungle",
          "rainforest",
          "river"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Cassowary and Python readable in wet rainforest cover with clean foot placement and root structure."
      },
      {
        "animal": "Monitor Lizard",
        "environments": [
          "wet jungle trail after rain"
        ],
        "habitatTags": [
          "forest",
          "jungle",
          "rainforest"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Cassowary and Monitor Lizard readable in humid understory with believable body mass and low-angle tension."
      },
      {
        "animal": "Saltwater Crocodile",
        "environments": [
          "rainforest creek mouth and muddy bank"
        ],
        "habitatTags": [
          "jungle",
          "rainforest",
          "river",
          "wetland"
        ],
        "safeArcLabel": "Water ambush",
        "badges": [
          "Water ambush"
        ],
        "promptTemplateHint": "Keep Cassowary and Saltwater Crocodile readable at the creek edge with strong waterline geography and no gore."
      }
    ]
  },
  {
    "leadAnimal": "Wedge-tailed Eagle",
    "normalizedName": "wedge-tailed-eagle",
    "aliases": [],
    "viralRank": 89,
    "usaPriority": 999,
    "category": "predator",
    "defaultOpposingAnimal": "Rabbit",
    "opposingAnimals": [
      "Rabbit",
      "Rattlesnake",
      "Kangaroo Joey"
    ],
    "primaryEnvironments": [
      "dry ridge and open scrubland with thermal lift"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "Fast hook"
    ],
    "safeArcLabels": [
      "Sudden lunge"
    ],
    "habitatTags": [
      "desert",
      "mountain",
      "open"
    ],
    "promptTemplateHints": [
      "Use Wedge-tailed Eagle with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Rabbit",
        "environments": [
          "dry ridge and open scrubland with thermal lift"
        ],
        "habitatTags": [
          "desert",
          "mountain",
          "open"
        ],
        "safeArcLabel": "Sudden lunge",
        "badges": [
          "Fast hook"
        ],
        "promptTemplateHint": "Keep Wedge-tailed Eagle and Rabbit readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Rattlesnake",
        "environments": [
          "dry ridge and open scrubland with thermal lift"
        ],
        "habitatTags": [
          "desert",
          "mountain",
          "open"
        ],
        "safeArcLabel": "Sudden lunge",
        "badges": [
          "Fast hook"
        ],
        "promptTemplateHint": "Keep Wedge-tailed Eagle and Rattlesnake readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Kangaroo Joey",
        "environments": [
          "dry ridge and open scrubland with thermal lift"
        ],
        "habitatTags": [
          "desert",
          "mountain",
          "open"
        ],
        "safeArcLabel": "Sudden lunge",
        "badges": [
          "Fast hook"
        ],
        "promptTemplateHint": "Keep Wedge-tailed Eagle and Kangaroo Joey readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Monitor Lizard",
    "normalizedName": "monitor-lizard",
    "aliases": [],
    "viralRank": 90,
    "usaPriority": 999,
    "category": "wildlife",
    "defaultOpposingAnimal": "Rattlesnake",
    "opposingAnimals": [
      "Rattlesnake",
      "Bird Egg",
      "Wombat Joey"
    ],
    "primaryEnvironments": [
      "rocky dry scrubland and sun-baked creek bank"
    ],
    "secondaryEnvironments": [],
    "badges": [],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "desert",
      "mountain",
      "river"
    ],
    "promptTemplateHints": [
      "Use Monitor Lizard with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Rattlesnake",
        "environments": [
          "rocky dry scrubland and sun-baked creek bank"
        ],
        "habitatTags": [
          "desert",
          "mountain",
          "river"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Monitor Lizard and Rattlesnake readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Bird Egg",
        "environments": [
          "rocky dry scrubland and sun-baked creek bank"
        ],
        "habitatTags": [
          "desert",
          "mountain",
          "river"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Monitor Lizard and Bird Egg readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Wombat Joey",
        "environments": [
          "rocky dry scrubland and sun-baked creek bank"
        ],
        "habitatTags": [
          "desert",
          "mountain",
          "river"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Monitor Lizard and Wombat Joey readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Goat",
    "normalizedName": "goat",
    "aliases": [],
    "viralRank": 91,
    "usaPriority": 999,
    "category": "defender",
    "defaultOpposingAnimal": "Tiger",
    "opposingAnimals": [
      "Tiger",
      "Leopard",
      "Komodo Dragon",
      "Mountain Lion",
      "Wolf"
    ],
    "primaryEnvironments": [
      "rocky scrub slope, dry mountain shelf, and broken cliffside trail"
    ],
    "secondaryEnvironments": [],
    "badges": [],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "desert",
      "mountain"
    ],
    "promptTemplateHints": [
      "Use Goat with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Tiger",
        "environments": [
          "rocky scrub slope, dry mountain shelf, and broken cliffside trail"
        ],
        "habitatTags": [
          "desert",
          "mountain"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Goat and Tiger readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Leopard",
        "environments": [
          "rocky scrub slope, dry mountain shelf, and broken cliffside trail"
        ],
        "habitatTags": [
          "desert",
          "mountain"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Goat and Leopard readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Komodo Dragon",
        "environments": [
          "rocky scrub slope, dry mountain shelf, and broken cliffside trail"
        ],
        "habitatTags": [
          "desert",
          "mountain"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Goat and Komodo Dragon readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Mountain Lion",
        "environments": [
          "rocky scrub slope, dry mountain shelf, and broken cliffside trail"
        ],
        "habitatTags": [
          "desert",
          "mountain"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Goat and Mountain Lion readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Wolf",
        "environments": [
          "rocky scrub slope, dry mountain shelf, and broken cliffside trail"
        ],
        "habitatTags": [
          "desert",
          "mountain"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Goat and Wolf readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Ibex",
    "normalizedName": "ibex",
    "aliases": [],
    "viralRank": 92,
    "usaPriority": 999,
    "category": "defender",
    "defaultOpposingAnimal": "Brown Bear",
    "opposingAnimals": [
      "Brown Bear",
      "Snow Leopard",
      "Wolf"
    ],
    "primaryEnvironments": [
      "high alpine ledge, rocky snow face, and narrow mountain escape shelf"
    ],
    "secondaryEnvironments": [],
    "badges": [],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "forest",
      "mountain",
      "snow"
    ],
    "promptTemplateHints": [
      "Use Ibex with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Brown Bear",
        "environments": [
          "high alpine ledge, rocky snow face, and narrow mountain escape shelf"
        ],
        "habitatTags": [
          "forest",
          "mountain",
          "snow"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Ibex and Brown Bear readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Snow Leopard",
        "environments": [
          "high alpine ledge, rocky snow face, and narrow mountain escape shelf"
        ],
        "habitatTags": [
          "forest",
          "mountain",
          "snow"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Ibex and Snow Leopard readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Wolf",
        "environments": [
          "high alpine ledge, rocky snow face, and narrow mountain escape shelf"
        ],
        "habitatTags": [
          "forest",
          "mountain",
          "snow"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Ibex and Wolf readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Tasmanian Devil",
    "normalizedName": "tasmanian-devil",
    "aliases": [],
    "viralRank": 93,
    "usaPriority": 999,
    "category": "wildlife",
    "defaultOpposingAnimal": "Rabbit",
    "opposingAnimals": [
      "Rabbit",
      "Bird",
      "Carrion",
      "Wallaby"
    ],
    "primaryEnvironments": [
      "Tasmanian temperate forest and scrubland"
    ],
    "secondaryEnvironments": [],
    "badges": [],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "desert",
      "forest"
    ],
    "promptTemplateHints": [
      "Use Tasmanian Devil with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Rabbit",
        "environments": [
          "Tasmanian temperate forest and scrubland"
        ],
        "habitatTags": [
          "desert",
          "forest"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Tasmanian Devil and Rabbit readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Bird",
        "environments": [
          "Tasmanian temperate forest and scrubland"
        ],
        "habitatTags": [
          "desert",
          "forest"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Tasmanian Devil and Bird readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Carrion",
        "environments": [
          "Tasmanian temperate forest and scrubland"
        ],
        "habitatTags": [
          "desert",
          "forest"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Tasmanian Devil and Carrion readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Wallaby",
        "environments": [
          "Tasmanian temperate forest and scrubland"
        ],
        "habitatTags": [
          "desert",
          "forest"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Tasmanian Devil and Wallaby readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Peregrine Falcon",
    "normalizedName": "peregrine-falcon",
    "aliases": [],
    "viralRank": 94,
    "usaPriority": 999,
    "category": "predator",
    "defaultOpposingAnimal": "Quail",
    "opposingAnimals": [
      "Quail",
      "Duck",
      "Pheasant",
      "Pigeon"
    ],
    "primaryEnvironments": [
      "urban cliffline and open coastal headland"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "Fast hook"
    ],
    "safeArcLabels": [
      "Sudden lunge"
    ],
    "habitatTags": [
      "coast",
      "mountain",
      "open"
    ],
    "promptTemplateHints": [
      "Use Peregrine Falcon with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Quail",
        "environments": [
          "urban cliffline and open coastal headland"
        ],
        "habitatTags": [
          "coast",
          "mountain",
          "open"
        ],
        "safeArcLabel": "Sudden lunge",
        "badges": [
          "Fast hook"
        ],
        "promptTemplateHint": "Keep Peregrine Falcon and Quail readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Duck",
        "environments": [
          "urban cliffline and open coastal headland"
        ],
        "habitatTags": [
          "coast",
          "mountain",
          "open"
        ],
        "safeArcLabel": "Sudden lunge",
        "badges": [
          "Fast hook"
        ],
        "promptTemplateHint": "Keep Peregrine Falcon and Duck readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Pheasant",
        "environments": [
          "urban cliffline and open coastal headland"
        ],
        "habitatTags": [
          "coast",
          "mountain",
          "open"
        ],
        "safeArcLabel": "Sudden lunge",
        "badges": [
          "Fast hook"
        ],
        "promptTemplateHint": "Keep Peregrine Falcon and Pheasant readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Pigeon",
        "environments": [
          "urban cliffline and open coastal headland"
        ],
        "habitatTags": [
          "coast",
          "mountain",
          "open"
        ],
        "safeArcLabel": "Sudden lunge",
        "badges": [
          "Fast hook"
        ],
        "promptTemplateHint": "Keep Peregrine Falcon and Pigeon readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Musk Ox",
    "normalizedName": "musk-ox",
    "aliases": [],
    "viralRank": 95,
    "usaPriority": 999,
    "category": "wildlife",
    "defaultOpposingAnimal": "Wolf Pack",
    "opposingAnimals": [
      "Wolf Pack",
      "Polar Bear",
      "Wolf",
      "Wolverine"
    ],
    "primaryEnvironments": [
      "open Arctic tundra with snowstorm and ice plains"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "Defender"
    ],
    "safeArcLabels": [
      "Defender stands ground"
    ],
    "habitatTags": [
      "meadow",
      "open",
      "snow",
      "tundra"
    ],
    "promptTemplateHints": [
      "Use Musk Ox with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Wolf Pack",
        "environments": [
          "open Arctic tundra with snowstorm and ice plains"
        ],
        "habitatTags": [
          "meadow",
          "open",
          "snow",
          "tundra"
        ],
        "safeArcLabel": "Defender stands ground",
        "badges": [
          "Defender"
        ],
        "promptTemplateHint": "Keep Musk Ox and Wolf Pack readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Polar Bear",
        "environments": [
          "open Arctic tundra with snowstorm and ice plains"
        ],
        "habitatTags": [
          "meadow",
          "open",
          "snow",
          "tundra"
        ],
        "safeArcLabel": "Defender stands ground",
        "badges": [
          "Defender"
        ],
        "promptTemplateHint": "Keep Musk Ox and Polar Bear readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Wolf",
        "environments": [
          "open Arctic tundra with snowstorm and ice plains"
        ],
        "habitatTags": [
          "meadow",
          "open",
          "snow",
          "tundra"
        ],
        "safeArcLabel": "Defender stands ground",
        "badges": [
          "Defender"
        ],
        "promptTemplateHint": "Keep Musk Ox and Wolf readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Wolverine",
        "environments": [
          "open Arctic tundra with snowstorm and ice plains"
        ],
        "habitatTags": [
          "meadow",
          "open",
          "snow",
          "tundra"
        ],
        "safeArcLabel": "Defender stands ground",
        "badges": [
          "Defender"
        ],
        "promptTemplateHint": "Keep Musk Ox and Wolverine readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Hare",
    "normalizedName": "hare",
    "aliases": [],
    "viralRank": 96,
    "usaPriority": 999,
    "category": "wildlife",
    "defaultOpposingAnimal": "Red Fox",
    "opposingAnimals": [
      "Red Fox",
      "Golden Eagle",
      "Lynx",
      "Owl"
    ],
    "primaryEnvironments": [
      "highland meadow and snowy scrub edge"
    ],
    "secondaryEnvironments": [],
    "badges": [],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "desert",
      "meadow",
      "mountain",
      "snow"
    ],
    "promptTemplateHints": [
      "Use Hare with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Red Fox",
        "environments": [
          "highland meadow and snowy scrub edge"
        ],
        "habitatTags": [
          "desert",
          "meadow",
          "mountain",
          "snow"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Hare and Red Fox readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Golden Eagle",
        "environments": [
          "highland meadow and snowy scrub edge"
        ],
        "habitatTags": [
          "desert",
          "meadow",
          "mountain",
          "snow"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Hare and Golden Eagle readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Lynx",
        "environments": [
          "highland meadow and snowy scrub edge"
        ],
        "habitatTags": [
          "desert",
          "meadow",
          "mountain",
          "snow"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Hare and Lynx readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Owl",
        "environments": [
          "highland meadow and snowy scrub edge"
        ],
        "habitatTags": [
          "desert",
          "meadow",
          "mountain",
          "snow"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Hare and Owl readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Giraffe",
    "normalizedName": "giraffe",
    "aliases": [],
    "viralRank": 97,
    "usaPriority": 999,
    "category": "defender",
    "defaultOpposingAnimal": "Lion",
    "opposingAnimals": [
      "Lion",
      "Hyena",
      "Lion Pack",
      "Nile Crocodile"
    ],
    "primaryEnvironments": [
      "acacia savanna edge and dry grassland opening"
    ],
    "secondaryEnvironments": [],
    "badges": [],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "desert",
      "meadow",
      "open",
      "savanna"
    ],
    "promptTemplateHints": [
      "Use Giraffe with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Lion",
        "environments": [
          "acacia savanna edge and dry grassland opening"
        ],
        "habitatTags": [
          "desert",
          "meadow",
          "open",
          "savanna"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Giraffe and Lion readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Hyena",
        "environments": [
          "acacia savanna edge and dry grassland opening"
        ],
        "habitatTags": [
          "desert",
          "meadow",
          "open",
          "savanna"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Giraffe and Hyena readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Lion Pack",
        "environments": [
          "acacia savanna edge and dry grassland opening"
        ],
        "habitatTags": [
          "desert",
          "meadow",
          "open",
          "savanna"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Giraffe and Lion Pack readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Nile Crocodile",
        "environments": [
          "acacia savanna edge and dry grassland opening"
        ],
        "habitatTags": [
          "desert",
          "meadow",
          "open",
          "savanna"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Giraffe and Nile Crocodile readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Opossum",
    "normalizedName": "opossum",
    "aliases": [],
    "viralRank": 98,
    "usaPriority": 999,
    "category": "documentary",
    "defaultOpposingAnimal": "Rattlesnake",
    "opposingAnimals": [
      "Rattlesnake",
      "Bird Egg",
      "Carrion",
      "Insects",
      "Rat"
    ],
    "primaryEnvironments": [
      "forested creek corridor near neighbourhood backyards at midnight"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "USA viral"
    ],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "forest",
      "open",
      "river"
    ],
    "promptTemplateHints": [
      "Use Opossum with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Rattlesnake",
        "environments": [
          "forested creek corridor near neighbourhood backyards at midnight"
        ],
        "habitatTags": [
          "forest",
          "open",
          "river"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Opossum and Rattlesnake readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Bird Egg",
        "environments": [
          "forested creek corridor near neighbourhood backyards at midnight"
        ],
        "habitatTags": [
          "forest",
          "open",
          "river"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Opossum and Bird Egg readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Carrion",
        "environments": [
          "forested creek corridor near neighbourhood backyards at midnight"
        ],
        "habitatTags": [
          "forest",
          "open",
          "river"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Opossum and Carrion readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Insects",
        "environments": [
          "forested creek corridor near neighbourhood backyards at midnight"
        ],
        "habitatTags": [
          "forest",
          "open",
          "river"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Opossum and Insects readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Rat",
        "environments": [
          "forested creek corridor near neighbourhood backyards at midnight"
        ],
        "habitatTags": [
          "forest",
          "open",
          "river"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Opossum and Rat readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Rattlesnake",
    "normalizedName": "rattlesnake",
    "aliases": [],
    "viralRank": 99,
    "usaPriority": 999,
    "category": "wildlife",
    "defaultOpposingAnimal": "Rabbit",
    "opposingAnimals": [
      "Rabbit",
      "Quail",
      "Lizard",
      "Mouse"
    ],
    "primaryEnvironments": [
      "sun-baked desert scrub and rocky wash"
    ],
    "secondaryEnvironments": [],
    "badges": [],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "desert",
      "mountain"
    ],
    "promptTemplateHints": [
      "Use Rattlesnake with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Rabbit",
        "environments": [
          "sun-baked desert scrub and rocky wash"
        ],
        "habitatTags": [
          "desert",
          "mountain"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Rattlesnake and Rabbit readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Quail",
        "environments": [
          "sun-baked desert scrub and rocky wash"
        ],
        "habitatTags": [
          "desert",
          "mountain"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Rattlesnake and Quail readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Lizard",
        "environments": [
          "sun-baked desert scrub and rocky wash"
        ],
        "habitatTags": [
          "desert",
          "mountain"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Rattlesnake and Lizard readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Mouse",
        "environments": [
          "sun-baked desert scrub and rocky wash"
        ],
        "habitatTags": [
          "desert",
          "mountain"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [],
        "promptTemplateHint": "Keep Rattlesnake and Mouse readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  },
  {
    "leadAnimal": "Skunk",
    "normalizedName": "skunk",
    "aliases": [],
    "viralRank": 100,
    "usaPriority": 999,
    "category": "documentary",
    "defaultOpposingAnimal": "Rattlesnake",
    "opposingAnimals": [
      "Rattlesnake",
      "Bird Egg",
      "Grasshopper",
      "Grubs",
      "Mouse"
    ],
    "primaryEnvironments": [
      "suburban garden edge and brushy field transition at dusk"
    ],
    "secondaryEnvironments": [],
    "badges": [
      "USA viral"
    ],
    "safeArcLabels": [
      "Survival encounter"
    ],
    "habitatTags": [
      "meadow",
      "woodland"
    ],
    "promptTemplateHints": [
      "Use Skunk with realistic habitat continuity, clean anatomy, and readable wildlife tension."
    ],
    "safetyDefaults": [
      "No blood",
      "No gore",
      "No visible wounds",
      "Documentary survival tension",
      "Natural wildlife behavior",
      "Realistic animal physics",
      "Clean anatomy"
    ],
    "opposingProfiles": [
      {
        "animal": "Rattlesnake",
        "environments": [
          "suburban garden edge and brushy field transition at dusk"
        ],
        "habitatTags": [
          "meadow",
          "woodland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Skunk and Rattlesnake readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Bird Egg",
        "environments": [
          "suburban garden edge and brushy field transition at dusk"
        ],
        "habitatTags": [
          "meadow",
          "woodland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Skunk and Bird Egg readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Grasshopper",
        "environments": [
          "suburban garden edge and brushy field transition at dusk"
        ],
        "habitatTags": [
          "meadow",
          "woodland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Skunk and Grasshopper readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Grubs",
        "environments": [
          "suburban garden edge and brushy field transition at dusk"
        ],
        "habitatTags": [
          "meadow",
          "woodland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Skunk and Grubs readable in the same habitat with strong documentary tension and realistic spacing."
      },
      {
        "animal": "Mouse",
        "environments": [
          "suburban garden edge and brushy field transition at dusk"
        ],
        "habitatTags": [
          "meadow",
          "woodland"
        ],
        "safeArcLabel": "Survival encounter",
        "badges": [
          "USA viral"
        ],
        "promptTemplateHint": "Keep Skunk and Mouse readable in the same habitat with strong documentary tension and realistic spacing."
      }
    ]
  }
];

export const WILDLIFE_LEAD_CATALOG_BY_NAME = Object.fromEntries(
  WILDLIFE_LEAD_CATALOG.map((entry) => [entry.leadAnimal, entry])
) as Record<string, WildlifeLeadCatalogEntry>;

export function getWildlifeLeadCatalogEntry(
  animal: string
): WildlifeLeadCatalogEntry | null {
  const normalized = normalizeCatalogAnimalName(animal);
  return (
    WILDLIFE_LEAD_CATALOG.find(
      (entry) =>
        normalizeCatalogAnimalName(entry.leadAnimal) === normalized ||
        entry.aliases.some((alias) => normalizeCatalogAnimalName(alias) === normalized)
    ) ?? null
  );
}

export function getWildlifeLeadCatalogForScope(
  mode: WildlifeScopeMode
): WildlifeLeadCatalogEntry[] {
  const animals =
    mode === "USA Viral Wildlife"
      ? USA_VIRAL_WILDLIFE_LEADS
      : mode === "Global Viral Wildlife"
        ? GLOBAL_VIRAL_WILDLIFE_LEADS
        : mode === "USA / Canada Wildlife"
          ? USA_CANADA_WILDLIFE_LEADS
          : WORLD_WIDE_WILDLIFE_LEADS;

  return animals
    .map((animal) => WILDLIFE_LEAD_CATALOG_BY_NAME[animal])
    .filter(Boolean);
}
