import { StoryMode } from "@/types";

import { predatorData } from "@/lib/predator-data";

type StoryModePairing = {
  subjectA: string[];
  subjectB: string[];
};

type PairedSubjectBOptionsArgs = {
  storyMode: StoryMode;
  subjectA?: string;
  animalOptions: string[];
  currentValue?: string;
};

type PairedSubjectAOptionsArgs = {
  storyMode: StoryMode;
  subjectB?: string;
  animalOptions: string[];
  currentValue?: string;
};

const ALIAS_TO_CANONICAL: Record<string, string> = {
  "american bison": "bison",
  "bison herd": "bison",
  "bison mother": "bison",
  "bison bull": "bison bull",
  "bison bull a": "bison bull",
  "bison bull b": "bison bull",
  "grizzly mother": "grizzly bear",
  "male grizzly": "grizzly bear",
  "moose cow": "moose",
  "moose calf": "moose",
  "moose bull": "moose",
  "bull moose": "moose",
  "bull elk": "bull elk",
  "bull elk a": "bull elk",
  "bull elk b": "bull elk",
  "elk cow": "elk",
  "elk herd": "elk",
  "caribou herd": "caribou",
  "wolf pack": "wolf",
  "arctic wolf pack": "arctic wolf",
  doe: "white-tailed deer",
  deer: "white-tailed deer",
  rabbit: "rabbit",
  jackrabbit: "rabbit",
  "snowshoe hare": "rabbit",
  hare: "rabbit",
  salmon: "salmon",
  "sockeye salmon": "salmon",
  trout: "trout",
  fish: "fish",
  cougar: "mountain lion",
  puma: "mountain lion",
};

const CURATED_PAIRINGS: Partial<Record<StoryMode, StoryModePairing[]>> = {
  [StoryMode.HERD_DEFENSE]: [
    {
      subjectA: ["Bison Herd", "Bison", "American Bison"],
      subjectB: ["Wolf Pack", "Grizzly Bear", "Wolf", "Coyote"],
    },
    {
      subjectA: ["Elk Herd", "Elk", "Bull Elk"],
      subjectB: ["Wolf Pack", "Mountain Lion", "Grizzly Bear", "Wolf"],
    },
    {
      subjectA: ["Caribou Herd", "Caribou"],
      subjectB: ["Wolf Pack", "Grizzly Bear", "Wolf"],
    },
    {
      subjectA: ["Moose", "Moose Cow"],
      subjectB: ["Wolf Pack", "Grizzly Bear", "Wolf", "Mountain Lion"],
    },
    {
      subjectA: ["Musk Ox Herd", "Musk Ox"],
      subjectB: ["Arctic Wolf Pack", "Wolf Pack", "Polar Bear", "Wolverine"],
    },
    {
      subjectA: ["Cape Buffalo"],
      subjectB: ["Lion Pack", "Lion", "Hyena Pack", "Crocodile"],
    },
  ],
  [StoryMode.MOTHER_BABY]: [
    {
      subjectA: ["Grizzly Mother", "Grizzly Bear"],
      subjectB: ["Male Grizzly", "Wolf Pack"],
    },
    {
      subjectA: ["Moose Cow", "Moose"],
      subjectB: ["Grizzly Bear", "Wolf Pack", "Wolf"],
    },
    {
      subjectA: ["White-tailed Deer", "Deer", "Doe"],
      subjectB: ["Coyote", "Mountain Lion", "Bobcat", "Wolf"],
    },
    {
      subjectA: ["Elk Cow", "Elk"],
      subjectB: ["Wolf Pack", "Mountain Lion", "Grizzly Bear"],
    },
    {
      subjectA: ["Bison Mother", "Bison", "American Bison"],
      subjectB: ["Wolf Pack", "Grizzly Bear"],
    },
    {
      subjectA: ["Black Bear"],
      subjectB: ["Grizzly Bear", "Wolf Pack", "Mountain Lion"],
    },
  ],
  [StoryMode.RIVAL_CLASH]: [
    {
      subjectA: ["Bull Elk A", "Bull Elk"],
      subjectB: ["Bull Elk B", "Bull Elk"],
    },
    {
      subjectA: ["Bison Bull A", "Bison Bull", "Bison"],
      subjectB: ["Bison Bull B", "Bison Bull", "American Bison"],
    },
    {
      subjectA: ["Moose Bull", "Moose"],
      subjectB: ["Bull Moose", "Moose"],
    },
    {
      subjectA: ["Bighorn Ram", "Ram"],
      subjectB: ["Bighorn Ram", "Ram"],
    },
    {
      subjectA: ["Grizzly Bear"],
      subjectB: ["Male Grizzly", "Grizzly Bear"],
    },
    {
      subjectA: ["Wolf"],
      subjectB: ["Wolf", "Wolf Pack"],
    },
    {
      subjectA: ["Mountain Lion"],
      subjectB: ["Mountain Lion", "Cougar", "Puma"],
    },
  ],
  [StoryMode.NEAR_MISS]: [
    {
      subjectA: ["White-tailed Deer"],
      subjectB: ["Mountain Lion", "Coyote", "Wolf Pack", "Wolf"],
    },
    {
      subjectA: ["Mule Deer"],
      subjectB: ["Mountain Lion", "Cougar", "Wolf Pack"],
    },
    {
      subjectA: ["Elk", "Bull Elk"],
      subjectB: ["Wolf Pack", "Mountain Lion", "Grizzly Bear"],
    },
    {
      subjectA: ["Caribou"],
      subjectB: ["Wolf Pack", "Grizzly Bear", "Wolf"],
    },
    {
      subjectA: ["Moose", "Moose Calf"],
      subjectB: ["Wolf Pack", "Grizzly Bear"],
    },
    {
      subjectA: ["Rabbit", "Jackrabbit", "Snowshoe Hare"],
      subjectB: ["Red Fox", "Coyote", "Bobcat", "Golden Eagle", "Bald Eagle"],
    },
    {
      subjectA: ["Trout", "Salmon", "Fish"],
      subjectB: ["Bald Eagle", "Osprey", "Grizzly Bear", "Black Bear"],
    },
  ],
  [StoryMode.FISHING_STRIKE]: [
    {
      subjectA: ["Bald Eagle"],
      subjectB: ["Trout", "Salmon", "Sockeye Salmon", "Fish"],
    },
    {
      subjectA: ["Osprey"],
      subjectB: ["Trout", "Fish", "Salmon"],
    },
    {
      subjectA: ["Grizzly Bear"],
      subjectB: ["Sockeye Salmon", "Salmon", "Trout", "Fish"],
    },
    {
      subjectA: ["Black Bear"],
      subjectB: ["Salmon", "Trout", "Fish"],
    },
    {
      subjectA: ["Brown Bear"],
      subjectB: ["Salmon", "Sockeye Salmon", "Trout"],
    },
  ],
  [StoryMode.SCAVENGER_CONFLICT]: [
    {
      subjectA: ["Bald Eagle"],
      subjectB: ["Coyote", "Red Fox", "Raven", "Black Bear"],
    },
    {
      subjectA: ["Coyote"],
      subjectB: ["Bald Eagle", "Red Fox", "Bobcat", "Raven"],
    },
    {
      subjectA: ["Grizzly Bear"],
      subjectB: ["Wolf Pack", "Raven", "Coyote", "Black Bear"],
    },
    {
      subjectA: ["Black Bear"],
      subjectB: ["Coyote", "Wolf Pack", "Bald Eagle"],
    },
    {
      subjectA: ["Mountain Lion"],
      subjectB: ["Coyote", "Wolf Pack", "Black Bear"],
    },
    {
      subjectA: ["Wolf Pack"],
      subjectB: ["Grizzly Bear", "Coyote", "Raven"],
    },
    {
      subjectA: ["Red Fox"],
      subjectB: ["Coyote", "Bald Eagle", "Raven"],
    },
  ],
};

function normalizeRaw(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, " ");
}

export function normalizeAnimalName(value: string) {
  const normalized = normalizeRaw(value);
  return ALIAS_TO_CANONICAL[normalized] ?? normalized;
}

function matchesAnimal(value: string | undefined, candidate: string) {
  if (!value?.trim()) return false;
  return normalizeAnimalName(value) === normalizeAnimalName(candidate);
}

function uniqueOptions(options: Array<string | undefined>) {
  const seen = new Set<string>();

  return options.filter((option): option is string => {
    const normalized = normalizeRaw(option ?? "");
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

function expandWithAvailableAliases(suggestions: string[], animalOptions: string[]) {
  const suggestionKeys = new Set(suggestions.map(normalizeAnimalName));
  const availableAliases = animalOptions.filter((option) =>
    suggestionKeys.has(normalizeAnimalName(option))
  );

  return uniqueOptions([...suggestions, ...availableAliases]);
}

function getCuratedSubjectBOptions(storyMode: StoryMode, subjectA?: string) {
  if (!subjectA?.trim()) return [];

  return uniqueOptions(
    (CURATED_PAIRINGS[storyMode] ?? []).flatMap((pairing) =>
      pairing.subjectA.some((candidate) => matchesAnimal(subjectA, candidate))
        ? pairing.subjectB
        : []
    )
  );
}

function getCuratedSubjectAOptions(storyMode: StoryMode, subjectB?: string) {
  if (!subjectB?.trim()) return [];

  return uniqueOptions(
    (CURATED_PAIRINGS[storyMode] ?? []).flatMap((pairing) =>
      pairing.subjectB.some((candidate) => matchesAnimal(subjectB, candidate))
        ? pairing.subjectA
        : []
    )
  );
}

function getPredatorPreyOptions(subjectA?: string) {
  if (!subjectA?.trim()) return [];

  return uniqueOptions(
    Object.entries(predatorData).flatMap(([predator, info]) =>
      matchesAnimal(subjectA, predator) ? info.prey : []
    )
  );
}

function getReversePredatorOptions(subjectA?: string) {
  if (!subjectA?.trim()) return [];

  return uniqueOptions(
    Object.entries(predatorData).flatMap(([predator, info]) =>
      info.prey.some((prey) => matchesAnimal(subjectA, prey)) ? [predator] : []
    )
  );
}

function getPredatorSubjectAOptions(subjectB?: string) {
  if (!subjectB?.trim()) return [];

  return uniqueOptions(
    Object.entries(predatorData).flatMap(([predator, info]) =>
      matchesAnimal(subjectB, predator) ? info.prey : []
    )
  );
}

function getReverseSubjectAOptions(subjectB?: string) {
  if (!subjectB?.trim()) return [];

  return uniqueOptions(
    Object.entries(predatorData).flatMap(([predator, info]) =>
      info.prey.some((prey) => matchesAnimal(subjectB, prey)) ? [predator] : []
    )
  );
}

function canPairSubjectB(storyMode: StoryMode) {
  return (
    storyMode !== StoryMode.WEATHER_SURVIVAL &&
    storyMode !== StoryMode.MIGRATION
  );
}

export function getPairedSubjectBOptions({
  storyMode,
  subjectA,
  animalOptions,
  currentValue,
}: PairedSubjectBOptionsArgs) {
  if (!canPairSubjectB(storyMode)) {
    return uniqueOptions([currentValue]);
  }

  const pairedOptions = expandWithAvailableAliases(
    uniqueOptions([
      ...getCuratedSubjectBOptions(storyMode, subjectA),
      ...getPredatorPreyOptions(subjectA),
      ...getReversePredatorOptions(subjectA),
    ]),
    animalOptions
  );

  return uniqueOptions([currentValue, ...pairedOptions]);
}

export function getPairedSubjectAOptions({
  storyMode,
  subjectB,
  animalOptions,
  currentValue,
}: PairedSubjectAOptionsArgs) {
  if (!canPairSubjectB(storyMode)) {
    return uniqueOptions([currentValue]);
  }

  const pairedOptions = expandWithAvailableAliases(
    uniqueOptions([
      ...getCuratedSubjectAOptions(storyMode, subjectB),
      ...getPredatorSubjectAOptions(subjectB),
      ...getReverseSubjectAOptions(subjectB),
    ]),
    animalOptions
  );

  return uniqueOptions([currentValue, ...pairedOptions]);
}
