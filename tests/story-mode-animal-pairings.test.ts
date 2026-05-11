import { describe, expect, it } from "vitest";

import {
  getPairedSubjectBOptions,
  normalizeAnimalName,
} from "@/lib/story-mode-animal-pairings";
import { getStoryModeAnimalOptions } from "@/lib/story-mode-subject-options";
import { StoryMode } from "@/types";

const animalOptions = [
  "Bald Eagle",
  "Coyote",
  "Red Fox",
  "Raven",
  "Bison",
  "American Bison",
  "Wolf Pack",
  "Wolf",
  "Grizzly Bear",
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
  "Fish",
];

describe("story-mode animal pairings", () => {
  it("normalizes common story-mode animal aliases", () => {
    expect(normalizeAnimalName("Bison Herd")).toBe("bison");
    expect(normalizeAnimalName("Grizzly Mother")).toBe("grizzly bear");
    expect(normalizeAnimalName("Bull Elk A")).toBe("bull elk");
    expect(normalizeAnimalName("Wolf Pack")).toBe("wolf");
  });

  it("prioritizes Wolf Pack and Grizzly Bear for Bison Herd defense", () => {
    const options = getPairedSubjectBOptions({
      storyMode: StoryMode.HERD_DEFENSE,
      subjectA: "Bison Herd",
      animalOptions,
    });

    expect(options.slice(0, 2)).toEqual(["Wolf Pack", "Grizzly Bear"]);
  });

  it("prioritizes Male Grizzly for Grizzly Mother protection", () => {
    const options = getPairedSubjectBOptions({
      storyMode: StoryMode.MOTHER_BABY,
      subjectA: "Grizzly Mother",
      animalOptions,
    });

    expect(options[0]).toBe("Male Grizzly");
  });

  it("prioritizes Bull Elk B for Bull Elk A rival clash", () => {
    const options = getPairedSubjectBOptions({
      storyMode: StoryMode.RIVAL_CLASH,
      subjectA: "Bull Elk A",
      animalOptions,
    });

    expect(options.slice(0, 2)).toEqual(["Bull Elk B", "Bull Elk"]);
  });

  it("prioritizes Mountain Lion and Coyote for White-tailed Deer near-miss", () => {
    const options = getPairedSubjectBOptions({
      storyMode: StoryMode.NEAR_MISS,
      subjectA: "White-tailed Deer",
      animalOptions,
    });

    expect(options.slice(0, 2)).toEqual(["Mountain Lion", "Coyote"]);
  });

  it("prioritizes fish-only food sources for Bald Eagle fishing strike", () => {
    const options = getPairedSubjectBOptions({
      storyMode: StoryMode.FISHING_STRIKE,
      subjectA: "Bald Eagle",
      animalOptions,
    });

    expect(options.slice(0, 4)).toEqual([
      "Trout",
      "Salmon",
      "Sockeye Salmon",
      "Fish",
    ]);
    expect(options.slice(0, 4)).not.toContain("Coyote");
  });

  it("prioritizes Coyote, Red Fox, and Raven for Bald Eagle scavenger conflict", () => {
    const options = getPairedSubjectBOptions({
      storyMode: StoryMode.SCAVENGER_CONFLICT,
      subjectA: "Bald Eagle",
      animalOptions,
    });

    expect(options.slice(0, 3)).toEqual(["Coyote", "Red Fox", "Raven"]);
  });

  it("does not animal-filter Weather Survival subjectB", () => {
    expect(
      getPairedSubjectBOptions({
        storyMode: StoryMode.WEATHER_SURVIVAL,
        subjectA: "American Bison",
        animalOptions,
      })
    ).toEqual([]);
  });

  it("does not animal-filter Migration subjectB", () => {
    expect(
      getPairedSubjectBOptions({
        storyMode: StoryMode.MIGRATION,
        subjectA: "Elk Herd",
        animalOptions,
      })
    ).toEqual([]);
  });

  it("preserves current custom values even when they are not matched", () => {
    const options = getPairedSubjectBOptions({
      storyMode: StoryMode.HERD_DEFENSE,
      subjectA: "Bison Herd",
      animalOptions,
      currentValue: "Custom Threat Animal",
    });

    expect(options[0]).toBe("Custom Threat Animal");
    expect(options).toContain("Wolf Pack");
  });

  it("falls back to USA viral animal options after matched pairings", () => {
    const options = getStoryModeAnimalOptions({
      storyMode: StoryMode.HERD_DEFENSE,
      field: "subjectB",
      subjectA: "Bison Herd",
      animalOptions,
      currentValue: "Custom Threat Animal",
    });

    expect(options.slice(0, 3)).toEqual([
      "Custom Threat Animal",
      "Wolf Pack",
      "Grizzly Bear",
    ]);
    expect(options).toContain("Bald Eagle");
    expect(options).toContain("Mountain Lion");
  });
});
