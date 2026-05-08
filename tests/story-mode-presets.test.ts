import { describe, expect, it } from "vitest";

import {
  NON_PREDATOR_STORY_MODES,
  USA_STORY_MODE_PRESETS,
} from "@/lib/story-mode-presets";
import {
  normalizeWorkflowPresetSnapshot,
  WORKFLOW_TEST_PRESETS,
} from "@/lib/workflow-presets";
import {
  EncounterMode,
  EndingMode,
  HabitatRegion,
  StoryMode,
  ViralLane,
  ViolenceLevel,
} from "@/types";

const validStoryModes = new Set(Object.values(StoryMode));
const validEncounterModes = new Set(Object.values(EncounterMode));
const validEndingModes = new Set(Object.values(EndingMode));
const validViralLanes = new Set(Object.values(ViralLane));
const validHabitatRegions = new Set(Object.values(HabitatRegion));
const validViolenceLevels = new Set(Object.values(ViolenceLevel));

describe("story mode presets", () => {
  it("uses valid enum values for every USA story mode preset", () => {
    expect(USA_STORY_MODE_PRESETS.length).toBeGreaterThanOrEqual(16);

    for (const preset of USA_STORY_MODE_PRESETS) {
      expect(validStoryModes.has(preset.storyMode)).toBe(true);
      expect(validEncounterModes.has(preset.encounterMode)).toBe(true);
      expect(validEndingModes.has(preset.endingMode)).toBe(true);
      expect(validViralLanes.has(preset.viralLane)).toBe(true);
      expect(validHabitatRegions.has(preset.habitatRegion)).toBe(true);
      expect(validViolenceLevels.has(preset.violenceLevel)).toBe(true);
      expect(preset.storyMode).not.toBe(StoryMode.PREDATOR_VS_PREY);
    }
  });

  it("provides at least two presets for every non-predator story mode", () => {
    for (const storyMode of NON_PREDATOR_STORY_MODES) {
      const count = USA_STORY_MODE_PRESETS.filter(
        (preset) => preset.storyMode === storyMode
      ).length;

      expect(count).toBeGreaterThanOrEqual(2);
    }
  });

  it("keeps preset defaults non-graphic and Facebook-safe", () => {
    const unsafePattern =
      /\b(blood|gore|visible wound|exposed injury|broken bone|torn flesh)\b/i;

    for (const preset of USA_STORY_MODE_PRESETS) {
      const text = [
        preset.name,
        preset.summary,
        preset.sceneDescription,
        preset.foodItem,
      ]
        .filter(Boolean)
        .join(" ");

      expect(text).not.toMatch(unsafePattern);
      expect(Number(preset.violenceLevel)).toBeGreaterThanOrEqual(1);
      expect(Number(preset.violenceLevel)).toBeLessThanOrEqual(3);
    }
  });

  it("keeps existing Predator vs Prey workflow presets loadable", () => {
    const normalized = normalizeWorkflowPresetSnapshot(
      WORKFLOW_TEST_PRESETS[0].snapshot
    );

    expect(normalized).not.toBeNull();
    expect(normalized?.storyMode).toBe(StoryMode.PREDATOR_VS_PREY);
    expect(normalized?.predator).toBe(WORKFLOW_TEST_PRESETS[0].snapshot.predator);
    expect(normalized?.prey).toBe(WORKFLOW_TEST_PRESETS[0].snapshot.prey);
  });
});
