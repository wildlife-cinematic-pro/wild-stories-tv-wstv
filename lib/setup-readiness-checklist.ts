import {
  HabitatRegion,
  StoryMode,
  ViolenceLevel,
  type ActionStylePreset,
  type AIProvider,
  type KlingModel,
  type RunwayModel,
  type Season,
  type TimeOfDay,
} from "@/types";

import { areAnimalNamesEquivalent } from "@/lib/story-mode-animal-pairings";
import { evaluateHabitatCompatibility } from "@/lib/story-mode-habitat-quality";
import { evaluateStoryModePairQuality } from "@/lib/story-mode-pair-quality";

export type SetupReadinessOverall = "ready" | "caution" | "needs-review";
export type SetupReadinessItemStatus = "pass" | "caution" | "fail";

export type SetupReadinessChecklistItem = {
  id: string;
  label: string;
  status: SetupReadinessItemStatus;
  detail: string;
};

export type SetupReadinessChecklist = {
  overall: SetupReadinessOverall;
  score: number;
  items: SetupReadinessChecklistItem[];
};

type BuildSetupReadinessChecklistArgs = {
  storyMode: StoryMode;
  subjectA?: string;
  subjectB?: string;
  habitatRegion: HabitatRegion;
  season: Season;
  timeOfDay: TimeOfDay;
  animalOptions: string[];
  violenceLevel: ViolenceLevel;
  actionStyle?: ActionStylePreset;
  activeProvider?: AIProvider;
  runwayModel?: RunwayModel;
  klingModel?: KlingModel;
};

const USA_VIRAL_ANIMALS = [
  "Bald Eagle",
  "Coyote",
  "Bison",
  "American Bison",
  "Bison Herd",
  "Wolf Pack",
  "Wolf",
  "Grizzly Bear",
  "Grizzly Mother",
  "Male Grizzly",
  "Black Bear",
  "Mountain Lion",
  "White-tailed Deer",
  "Mule Deer",
  "Bull Elk",
  "Bull Elk A",
  "Bull Elk B",
  "Elk Herd",
  "Moose",
  "Caribou Herd",
  "Trout",
  "Salmon",
  "Sockeye Salmon",
  "Red Fox",
  "Raven",
  "Osprey",
];

const ONE_SUBJECT_STORY_MODES = new Set<StoryMode>([
  StoryMode.WEATHER_SURVIVAL,
  StoryMode.MIGRATION,
]);

function hasValue(value?: string) {
  return Boolean(value?.trim());
}

function includesAnimal(options: string[], value?: string) {
  return options.some((option) => areAnimalNamesEquivalent(option, value));
}

function statusScore(status: SetupReadinessItemStatus) {
  if (status === "pass") return 100;
  if (status === "caution") return 65;
  return 25;
}

function buildOverall(items: SetupReadinessChecklistItem[]) {
  if (items.some((item) => item.status === "fail")) return "needs-review";
  if (items.some((item) => item.status === "caution")) return "caution";
  return "ready";
}

function buildScore(items: SetupReadinessChecklistItem[]) {
  const total = items.reduce((sum, item) => sum + statusScore(item.status), 0);
  return Math.round(total / items.length);
}

function buildCompletenessItem({
  storyMode,
  subjectA,
  subjectB,
}: Pick<BuildSetupReadinessChecklistArgs, "storyMode" | "subjectA" | "subjectB">): SetupReadinessChecklistItem {
  const hasSubjectA = hasValue(subjectA);
  const hasSubjectB = hasValue(subjectB);
  const needsOnlySubjectA = ONE_SUBJECT_STORY_MODES.has(storyMode);

  if (!hasSubjectA) {
    return {
      id: "story-mode-completeness",
      label: "Story mode fields",
      status: "fail",
      detail: "Primary story subject is missing.",
    };
  }

  if (!needsOnlySubjectA && !hasSubjectB) {
    return {
      id: "story-mode-completeness",
      label: "Story mode fields",
      status: "fail",
      detail: "Second story subject is missing.",
    };
  }

  if (needsOnlySubjectA && !hasSubjectB) {
    return {
      id: "story-mode-completeness",
      label: "Story mode fields",
      status: "caution",
      detail: "Core animal is set; route or hazard text can stay custom.",
    };
  }

  return {
    id: "story-mode-completeness",
    label: "Story mode fields",
    status: "pass",
    detail: needsOnlySubjectA
      ? "Animal plus route or hazard text are filled."
      : "Required story subjects are filled.",
  };
}

function buildSafetyItem(
  violenceLevel: ViolenceLevel
): SetupReadinessChecklistItem {
  if (
    violenceLevel === ViolenceLevel.DISPLAY_ONLY ||
    violenceLevel === ViolenceLevel.IMPLIED_PRESSURE
  ) {
    return {
      id: "safety",
      label: "Safety / non-graphic",
      status: "pass",
      detail: "Non-graphic safety setting is ready.",
    };
  }

  return {
    id: "safety",
    label: "Safety / non-graphic",
    status: "caution",
    detail: "Use display-only or implied pressure for the safest output.",
  };
}

function buildViralItem({
  subjectA,
  subjectB,
  storyMode,
  actionStyle,
}: Pick<
  BuildSetupReadinessChecklistArgs,
  "subjectA" | "subjectB" | "storyMode" | "actionStyle"
>): SetupReadinessChecklistItem {
  const subjectAIsViral = includesAnimal(USA_VIRAL_ANIMALS, subjectA);
  const subjectBIsViral =
    ONE_SUBJECT_STORY_MODES.has(storyMode) ||
    !hasValue(subjectB) ||
    includesAnimal(USA_VIRAL_ANIMALS, subjectB);
  const hasViralAction =
    actionStyle === "Viral chase" || actionStyle === "Ambush burst";

  if (subjectAIsViral && subjectBIsViral) {
    return {
      id: "viral-readiness",
      label: "USA viral readiness",
      status: "pass",
      detail: hasViralAction
        ? "USA-viral animals plus high-action setup."
        : "USA-viral animals are in place.",
    };
  }

  return {
    id: "viral-readiness",
    label: "USA viral readiness",
    status: "caution",
    detail: "Setup can work, but USA-viral animal pull is lower.",
  };
}

function buildEngineItem({
  activeProvider,
  runwayModel,
  klingModel,
}: Pick<
  BuildSetupReadinessChecklistArgs,
  "activeProvider" | "runwayModel" | "klingModel"
>): SetupReadinessChecklistItem {
  if (runwayModel && klingModel && activeProvider) {
    return {
      id: "engine-output",
      label: "Engine / output",
      status: "pass",
      detail: "Engine, model, and output path selections are present.",
    };
  }

  if (runwayModel && klingModel) {
    return {
      id: "engine-output",
      label: "Engine / output",
      status: "caution",
      detail: "Core models are selected; polish provider is unknown.",
    };
  }

  return {
    id: "engine-output",
    label: "Engine / output",
    status: "fail",
    detail: "Required model selections are missing.",
  };
}

export function buildSetupReadinessChecklist({
  storyMode,
  subjectA,
  subjectB,
  habitatRegion,
  season,
  timeOfDay,
  animalOptions,
  violenceLevel,
  actionStyle,
  activeProvider,
  runwayModel,
  klingModel,
}: BuildSetupReadinessChecklistArgs): SetupReadinessChecklist {
  const pairQuality = evaluateStoryModePairQuality({
    storyMode,
    subjectA,
    subjectB,
    habitatRegion,
    season,
    animalOptions,
  });
  const habitatQuality = evaluateHabitatCompatibility({
    storyMode,
    subjectA,
    subjectB,
    habitatRegion,
    season,
    timeOfDay,
    animalOptions,
  });
  const items: SetupReadinessChecklistItem[] = [
    {
      id: "pair-quality",
      label: "Pair quality",
      status:
        pairQuality.level === "strong" || pairQuality.level === "good"
          ? "pass"
          : pairQuality.level === "caution"
            ? "caution"
            : "fail",
      detail: pairQuality.reasons[0] ?? pairQuality.label,
    },
    {
      id: "habitat-fit",
      label: "Habitat fit",
      status:
        habitatQuality.level === "strong" || habitatQuality.level === "good"
          ? "pass"
          : habitatQuality.level === "caution"
            ? "caution"
            : "fail",
      detail: habitatQuality.reasons[0] ?? habitatQuality.label,
    },
    buildSafetyItem(violenceLevel),
    buildCompletenessItem({ storyMode, subjectA, subjectB }),
    buildViralItem({ storyMode, subjectA, subjectB, actionStyle }),
    buildEngineItem({ activeProvider, runwayModel, klingModel }),
  ];

  return {
    overall: buildOverall(items),
    score: buildScore(items),
    items,
  };
}
