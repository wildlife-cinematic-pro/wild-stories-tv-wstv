import {
  EncounterMode,
  EndingMode,
  StoryMode,
  ViralLane,
  ViolenceLevel,
} from "@/types";

import type {
  ActionStylePreset,
  AnimalVibe,
  Arc,
  CameraAnglePreset,
  ContentLane,
  DepthMode,
  EmotionalTone,
  HookFamily,
  TimeOfDay,
  Weather,
} from "@/types";

export type StorySetupTunerId =
  | "more-viral"
  | "more-nat-geo"
  | "more-cinematic"
  | "safer-non-graphic";

export type StorySetupTunerPatch = {
  actionStyle?: ActionStylePreset;
  animalVibe?: AnimalVibe;
  arc?: Arc;
  cameraAnglePreset?: CameraAnglePreset;
  contentLane?: ContentLane;
  depthMode?: DepthMode;
  emotionalTone?: EmotionalTone;
  encounterMode?: EncounterMode;
  endingMode?: EndingMode;
  hookMode?: HookFamily | "all";
  strictOriginalityGuard?: boolean;
  timeOfDay?: TimeOfDay;
  viralLane?: ViralLane;
  violenceLevel?: ViolenceLevel;
  weather?: Weather;
};

export type StorySetupTunerResult = {
  id: StorySetupTunerId;
  label: string;
  helper: string;
  patch: StorySetupTunerPatch;
  adjustedControls: string[];
};

type BuildStorySetupTunerPatchArgs = {
  id: StorySetupTunerId;
  storyMode: StoryMode;
};

const TUNER_LABELS: Record<StorySetupTunerId, Pick<StorySetupTunerResult, "label" | "helper">> = {
  "more-viral": {
    label: "Make More Viral",
    helper: "Raises tension, hook pressure, and shareable motion using existing controls.",
  },
  "more-nat-geo": {
    label: "Make More Nat Geo",
    helper: "Leans into believable documentary behavior and cleaner realism.",
  },
  "more-cinematic": {
    label: "Make More Cinematic",
    helper: "Pushes golden-hour mood, stronger camera language, and depth.",
  },
  "safer-non-graphic": {
    label: "Safer Non-Graphic",
    helper: "Favors standoff, escape, and display-only survival framing.",
  },
};

function safeContentLane(storyMode: StoryMode): ContentLane {
  switch (storyMode) {
    case StoryMode.HERD_DEFENSE:
    case StoryMode.MOTHER_BABY:
    case StoryMode.WEATHER_SURVIVAL:
      return "Defender";
    case StoryMode.FISHING_STRIKE:
      return "Fishing Strike";
    case StoryMode.RIVAL_CLASH:
      return "Rut Battle";
    default:
      return "Escape";
  }
}

function controlNames(patch: StorySetupTunerPatch) {
  const labels: Partial<Record<keyof StorySetupTunerPatch, string>> = {
    actionStyle: "Action Style",
    animalVibe: "Instinct Style",
    arc: "Conflict Arc",
    cameraAnglePreset: "Camera Angle",
    contentLane: "Content Lane",
    depthMode: "Cinematic Depth",
    emotionalTone: "Tension Level",
    encounterMode: "Encounter",
    endingMode: "Ending",
    hookMode: "Hook Mode",
    strictOriginalityGuard: "Originality Guard",
    timeOfDay: "Time of Day",
    viralLane: "Viral Lane",
    violenceLevel: "Violence Level",
    weather: "Scene Atmosphere",
  };

  return Object.keys(patch).map(
    (key) => labels[key as keyof StorySetupTunerPatch] ?? key
  );
}

export function buildStorySetupTunerPatch({
  id,
  storyMode,
}: BuildStorySetupTunerPatchArgs): StorySetupTunerResult {
  const label = TUNER_LABELS[id];
  let patch: StorySetupTunerPatch;

  switch (id) {
    case "more-viral":
      patch = {
        actionStyle: "Viral chase",
        animalVibe: "Raw Nature Unfiltered",
        arc: "Ambush attack",
        contentLane: storyMode === StoryMode.RIVAL_CLASH ? "Rut Battle" : "Escape",
        emotionalTone: "Raw Tension",
        encounterMode: EncounterMode.ESCALATION,
        hookMode: "danger",
        viralLane: ViralLane.TENSION,
        violenceLevel: ViolenceLevel.IMPLIED_PRESSURE,
      };
      break;
    case "more-nat-geo":
      patch = {
        actionStyle: "Natural tension",
        animalVibe: "National Geographic Wild",
        cameraAnglePreset: "Side profile",
        contentLane: safeContentLane(storyMode),
        depthMode: "Detailed Background",
        emotionalTone: "Calm Dominance",
        encounterMode: EncounterMode.FIRST_CONTACT,
        hookMode: "curiosity",
        strictOriginalityGuard: true,
        violenceLevel: ViolenceLevel.DISPLAY_ONLY,
      };
      break;
    case "more-cinematic":
      patch = {
        animalVibe: "Slow Motion Nature",
        cameraAnglePreset: "Low-angle power",
        depthMode: "Cinematic Blur",
        emotionalTone: "Haunting Stillness",
        timeOfDay: "GOLDEN_HOUR",
        viralLane: ViralLane.AWE,
        weather: "Golden Hour",
      };
      break;
    case "safer-non-graphic":
      patch = {
        actionStyle: "Forced retreat",
        animalVibe: "BBC Earth Documentary",
        arc: "Escape from danger",
        contentLane: safeContentLane(storyMode),
        emotionalTone: "Silent Dread",
        encounterMode: EncounterMode.PEAK_TENSION,
        endingMode:
          storyMode === StoryMode.MOTHER_BABY
            ? EndingMode.PROTECTED_EXIT
            : EndingMode.ESCAPE,
        hookMode: "curiosity",
        strictOriginalityGuard: true,
        viralLane: ViralLane.UNDERDOG,
        violenceLevel: ViolenceLevel.DISPLAY_ONLY,
      };
      break;
  }

  return {
    id,
    ...label,
    patch,
    adjustedControls: controlNames(patch),
  };
}

export const STORY_SETUP_TUNER_IDS: StorySetupTunerId[] = [
  "more-viral",
  "more-nat-geo",
  "more-cinematic",
  "safer-non-graphic",
];
