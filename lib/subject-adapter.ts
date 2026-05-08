import {
  EncounterMode,
  EndingMode,
  HabitatRegion,
  StoryMode,
  ViralLane,
  ViolenceLevel,
} from "@/types";

import type { BuildWorkflowPresetSnapshot } from "@/types";

type SubjectAdapterInput = Partial<BuildWorkflowPresetSnapshot> & {
  leadAnimal?: string;
  opposingAnimal?: string;
  oppositeAnimal?: string;
  predator?: string;
  prey?: string;
};

function firstText(...values: Array<unknown>) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

export function normalizeSubjects<T extends SubjectAdapterInput>(incoming: T) {
  const subjectA = firstText(
    incoming.subjectA,
    incoming.leadAnimal,
    incoming.predator
  );
  const subjectB = firstText(
    incoming.subjectB,
    incoming.opposingAnimal,
    incoming.oppositeAnimal,
    incoming.prey
  );

  return {
    ...incoming,
    storyMode: incoming.storyMode ?? StoryMode.PREDATOR_VS_PREY,
    encounterMode: incoming.encounterMode ?? EncounterMode.PEAK_TENSION,
    endingMode: incoming.endingMode ?? EndingMode.ESCAPE,
    viralLane: incoming.viralLane ?? ViralLane.TENSION,
    violenceLevel: incoming.violenceLevel ?? ViolenceLevel.DISPLAY_ONLY,
    habitatRegion: incoming.habitatRegion ?? HabitatRegion.YELLOWSTONE,
    subjectA: subjectA ?? incoming.subjectA,
    subjectB: subjectB ?? incoming.subjectB,
  };
}
