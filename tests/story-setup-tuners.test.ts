import { describe, expect, it } from "vitest";

import {
  STORY_SETUP_TUNER_IDS,
  buildStorySetupTunerPatch,
  type StorySetupTunerPatch,
} from "@/lib/story-setup-tuners";
import {
  EncounterMode,
  EndingMode,
  StoryMode,
  ViralLane,
  ViolenceLevel,
} from "@/types";

function patchKeys(patch: StorySetupTunerPatch) {
  return Object.keys(patch);
}

describe("buildStorySetupTunerPatch", () => {
  it("More Viral returns a high-action patch", () => {
    const result = buildStorySetupTunerPatch({
      id: "more-viral",
      storyMode: StoryMode.NEAR_MISS,
    });

    expect(result.patch).toMatchObject({
      actionStyle: "Viral chase",
      animalVibe: "Raw Nature Unfiltered",
      emotionalTone: "Raw Tension",
      encounterMode: EncounterMode.ESCALATION,
      hookMode: "danger",
      viralLane: ViralLane.TENSION,
      violenceLevel: ViolenceLevel.IMPLIED_PRESSURE,
    });
  });

  it("More Nat Geo returns a documentary and realistic patch", () => {
    const result = buildStorySetupTunerPatch({
      id: "more-nat-geo",
      storyMode: StoryMode.HERD_DEFENSE,
    });

    expect(result.patch).toMatchObject({
      actionStyle: "Natural tension",
      animalVibe: "National Geographic Wild",
      cameraAnglePreset: "Side profile",
      contentLane: "Defender",
      depthMode: "Detailed Background",
      emotionalTone: "Calm Dominance",
      violenceLevel: ViolenceLevel.DISPLAY_ONLY,
    });
  });

  it("More Cinematic prefers Golden Hour and cinematic settings", () => {
    const result = buildStorySetupTunerPatch({
      id: "more-cinematic",
      storyMode: StoryMode.FISHING_STRIKE,
    });

    expect(result.patch).toMatchObject({
      animalVibe: "Slow Motion Nature",
      cameraAnglePreset: "Low-angle power",
      depthMode: "Cinematic Blur",
      timeOfDay: "GOLDEN_HOUR",
      viralLane: ViralLane.AWE,
      weather: "Golden Hour",
    });
  });

  it("Safer Non-Graphic returns a display-only safe patch", () => {
    const result = buildStorySetupTunerPatch({
      id: "safer-non-graphic",
      storyMode: StoryMode.MOTHER_BABY,
    });

    expect(result.patch).toMatchObject({
      actionStyle: "Forced retreat",
      animalVibe: "BBC Earth Documentary",
      arc: "Escape from danger",
      endingMode: EndingMode.PROTECTED_EXIT,
      hookMode: "curiosity",
      strictOriginalityGuard: true,
      violenceLevel: ViolenceLevel.DISPLAY_ONLY,
    });
  });

  it("no tuner changes subjects or habitat fields", () => {
    const forbiddenKeys = [
      "subjectA",
      "subjectB",
      "predator",
      "prey",
      "habitat",
      "habitatRegion",
    ];

    for (const id of STORY_SETUP_TUNER_IDS) {
      const result = buildStorySetupTunerPatch({
        id,
        storyMode: StoryMode.SCAVENGER_CONFLICT,
      });

      expect(patchKeys(result.patch)).not.toEqual(
        expect.arrayContaining(forbiddenKeys)
      );
    }
  });
});
