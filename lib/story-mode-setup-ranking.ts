import {
  STORY_MODE_PRESET_LABELS,
  USA_STORY_MODE_PRESETS,
  type StoryModePreset,
} from "@/lib/story-mode-presets";
import { evaluateHabitatCompatibility } from "@/lib/story-mode-habitat-quality";
import { areAnimalNamesEquivalent } from "@/lib/story-mode-animal-pairings";
import { evaluateStoryModePairQuality } from "@/lib/story-mode-pair-quality";

import { HabitatRegion, StoryMode, type Season, type TimeOfDay } from "@/types";

type RankStoryModeSetupsArgs = {
  storyMode: StoryMode;
  habitatRegion: HabitatRegion;
  season: Season;
  timeOfDay: TimeOfDay;
  animalOptions: string[];
};

export type RankedStoryModeSetup = {
  id: string;
  label: string;
  storyMode: StoryMode;
  subjectA: string;
  subjectB: string;
  habitatRegion: HabitatRegion;
  season: Season;
  timeOfDay: TimeOfDay;
  score: number;
  pairScore: number;
  habitatScore: number;
  viralBonus: number;
  reasons: string[];
};

type SetupOverride = Partial<
  Pick<StoryModePreset, "habitatRegion" | "season" | "timeOfDay">
>;

const SETUP_OVERRIDES: Record<string, SetupOverride> = {
  "bison-herd-wall-vs-wolves": {
    habitatRegion: HabitatRegion.YELLOWSTONE,
  },
  "yellowstone-grizzly-mother-protects-cubs": {
    season: "SPRING",
  },
  "bald-eagle-river-strike": {
    habitatRegion: HabitatRegion.ALASKA,
    timeOfDay: "GOLDEN_HOUR",
  },
  "deer-last-second-brush-escape": {
    habitatRegion: HabitatRegion.ROCKY_MOUNTAINS,
  },
  "bald-eagle-vs-coyote-food-zone": {
    habitatRegion: HabitatRegion.YELLOWSTONE,
    season: "FALL",
  },
};

const USA_VIRAL_PRIORITY = [
  "Bald Eagle",
  "Coyote",
  "Bison",
  "Bison Herd",
  "American Bison",
  "Wolf Pack",
  "Grizzly Bear",
  "Grizzly Mother",
  "Male Grizzly",
  "Black Bear",
  "Mountain Lion",
  "White-tailed Deer",
  "Bull Elk",
  "Bull Elk A",
  "Bull Elk B",
  "Elk Herd",
  "Moose",
  "Caribou Herd",
  "Trout",
  "Salmon",
  "Sockeye Salmon",
];

function includesAnimal(options: string[], value?: string) {
  return options.some((option) => areAnimalNamesEquivalent(option, value));
}

function getViralBonus(subjectA: string, subjectB: string) {
  let bonus = 0;
  if (includesAnimal(USA_VIRAL_PRIORITY, subjectA)) bonus += 10;
  if (includesAnimal(USA_VIRAL_PRIORITY, subjectB)) bonus += 10;
  if (
    includesAnimal(["Bald Eagle", "Bison Herd", "Grizzly Bear", "Grizzly Mother"], subjectA) ||
    includesAnimal(["Wolf Pack", "Coyote", "Mountain Lion", "Sockeye Salmon"], subjectB)
  ) {
    bonus += 4;
  }

  return bonus;
}

function withSetupOverride(preset: StoryModePreset) {
  const override = SETUP_OVERRIDES[preset.id] ?? {};
  return {
    ...preset,
    habitatRegion: override.habitatRegion ?? preset.habitatRegion,
    season: override.season ?? preset.season,
    timeOfDay: override.timeOfDay ?? preset.timeOfDay,
  };
}

function buildReasons({
  preset,
  pairLabel,
  habitatLabel,
  viralBonus,
}: {
  preset: StoryModePreset;
  pairLabel: string;
  habitatLabel: string;
  viralBonus: number;
}) {
  return [
    `${STORY_MODE_PRESET_LABELS[preset.storyMode]} setup: ${pairLabel}.`,
    habitatLabel,
    viralBonus > 0 ? "USA viral animals are weighted up." : "Useful fallback setup.",
  ];
}

export function rankStoryModeSetups({
  storyMode,
  habitatRegion,
  season,
  timeOfDay,
  animalOptions,
}: RankStoryModeSetupsArgs): RankedStoryModeSetup[] {
  const ranked = USA_STORY_MODE_PRESETS.map((preset, index) => {
    const setup = withSetupOverride(preset);
    const pairQuality = evaluateStoryModePairQuality({
      storyMode: setup.storyMode,
      subjectA: setup.subjectA,
      subjectB: setup.subjectB,
      habitatRegion: setup.habitatRegion,
      season: setup.season,
      animalOptions,
    });
    const habitatQuality = evaluateHabitatCompatibility({
      storyMode: setup.storyMode,
      subjectA: setup.subjectA,
      subjectB: setup.subjectB,
      habitatRegion: setup.habitatRegion,
      season: setup.season,
      timeOfDay: setup.timeOfDay,
      animalOptions,
    });
    const viralBonus = getViralBonus(setup.subjectA, setup.subjectB);
    const score = pairQuality.score + habitatQuality.score + viralBonus;
    const modePriority =
      storyMode === StoryMode.PREDATOR_VS_PREY || setup.storyMode === storyMode
        ? 1
        : 0;
    const contextPriority =
      (setup.habitatRegion === habitatRegion ? 1 : 0) +
      (setup.season === season ? 1 : 0) +
      (setup.timeOfDay === timeOfDay ? 1 : 0);

    return {
      id: setup.id,
      label: setup.name,
      storyMode: setup.storyMode,
      subjectA: setup.subjectA,
      subjectB: setup.subjectB,
      habitatRegion: setup.habitatRegion,
      season: setup.season,
      timeOfDay: setup.timeOfDay,
      score,
      pairScore: pairQuality.score,
      habitatScore: habitatQuality.score,
      viralBonus,
      reasons: buildReasons({
        preset: setup,
        pairLabel: pairQuality.label,
        habitatLabel: habitatQuality.label,
        viralBonus,
      }),
      modePriority,
      contextPriority,
      isWeak: pairQuality.level === "weak" || habitatQuality.level === "weak",
      index,
    };
  });

  const preferred =
    ranked.filter((setup) => !setup.isWeak).length >= 3
      ? ranked.filter((setup) => !setup.isWeak)
      : ranked;

  return preferred
    .sort((a, b) => {
      if (b.modePriority !== a.modePriority) {
        return b.modePriority - a.modePriority;
      }
      if (b.score !== a.score) return b.score - a.score;
      if (b.contextPriority !== a.contextPriority) {
        return b.contextPriority - a.contextPriority;
      }
      return a.index - b.index;
    })
    .map((setup) => ({
      id: setup.id,
      label: setup.label,
      storyMode: setup.storyMode,
      subjectA: setup.subjectA,
      subjectB: setup.subjectB,
      habitatRegion: setup.habitatRegion,
      season: setup.season,
      timeOfDay: setup.timeOfDay,
      score: setup.score,
      pairScore: setup.pairScore,
      habitatScore: setup.habitatScore,
      viralBonus: setup.viralBonus,
      reasons: setup.reasons,
    }));
}
