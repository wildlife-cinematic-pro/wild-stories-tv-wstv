import { describe, expect, it } from "vitest";

import { buildCinematicStoryboard, type CinematicStoryboardInput } from "@/lib/storyboard-shot-builder";
import { HabitatRegion, StoryMode, ViolenceLevel } from "@/types";

const baseInput: CinematicStoryboardInput = {
  storyMode: StoryMode.PREDATOR_VS_PREY,
  subjectA: "Wolf Pack",
  subjectB: "Bull Elk",
  predator: "Wolf Pack",
  prey: "Bull Elk",
  habitatRegion: HabitatRegion.YELLOWSTONE,
  season: "FALL",
  timeOfDay: "GOLDEN_HOUR",
  actionStyle: "Natural tension",
  animalVibe: "National Geographic Wild",
  arc: "Defender stands ground",
  cameraAnglePreset: "Low-angle power",
  contentLane: "Defender",
  depthMode: "Balanced Depth",
  emotionalTone: "Raw Tension",
  violenceLevel: ViolenceLevel.IMPLIED_PRESSURE,
  weather: "Golden Hour",
};

function allCopyablePromptText(input: CinematicStoryboardInput = baseInput) {
  const storyboard = buildCinematicStoryboard(input);
  return storyboard.shots
    .flatMap((shot) => [
      shot.imagePrompts.nanoBanana2,
      shot.imagePrompts.gptImage2,
      shot.imagePrompts.grokImagine,
      shot.motionPrompts.kling,
    ])
    .join("\n");
}

describe("cinematic USA viral storyboard builder", () => {
  it("builds exactly 4 shots with 5 seconds each and 20 seconds total", () => {
    const storyboard = buildCinematicStoryboard(baseInput);

    expect(storyboard.shots).toHaveLength(4);
    expect(storyboard.summary.totalShots).toBe(4);
    expect(storyboard.summary.totalMotionDurationSeconds).toBe(20);
    expect(storyboard.summary.totalMotionDurationLabel).toBe("20s");
    expect(storyboard.shots.map((shot) => shot.durationSeconds)).toEqual([5, 5, 5, 5]);
    expect(storyboard.shots.map((shot) => shot.timeRangeLabel)).toEqual([
      "0:00-0:05",
      "0:05-0:10",
      "0:10-0:15",
      "0:15-0:20",
    ]);
  });

  it("includes exactly three image prompt engines and Kling-only motion prompts for each shot", () => {
    const storyboard = buildCinematicStoryboard(baseInput);

    for (const shot of storyboard.shots) {
      expect(Object.keys(shot.imagePrompts)).toEqual(["nanoBanana2", "gptImage2", "grokImagine"]);
      expect(shot.imagePrompts.nanoBanana2).toContain("Nano Banana 2");
      expect(shot.imagePrompts.gptImage2).toContain("GPT Image 2");
      expect(shot.imagePrompts.grokImagine).toContain("Grok Imagine");
      expect(Object.keys(shot.motionPrompts)).toEqual(["kling"]);
      expect(shot.motionPrompts.kling).toContain("Kling motion prompt");
      expect(shot.motionPrompts.kling).toContain("Duration: 5 seconds");
      expect("runway" in shot.motionPrompts).toBe(false);
      expect("seedance" in shot.motionPrompts).toBe(false);
    }
  });

  it("keeps copyable storyboard prompts free of aspect-ratio and non-storyboard engine wording", () => {
    const promptText = allCopyablePromptText();

    expect(promptText).not.toMatch(
      /\b(?:9:16|16:9|vertical|horizontal|portrait|landscape|aspect ratio|AR|Runway|Seedance|mobile vertical frame)\b/i
    );
  });

  it("applies cinematic USA viral style language to copyable prompts", () => {
    const promptText = allCopyablePromptText();

    expect(promptText).toContain("Strong first-frame hook");
    expect(promptText).toContain("full-body readability");
    expect(promptText).toContain("clean subject separation");
    expect(promptText).toContain("one clear action lane");
    expect(promptText).toContain("clear foreground/midground/background depth");
    expect(promptText).toContain("cinematic wildlife documentary realism");
    expect(promptText).toContain("non-graphic survival pressure");
    expect(promptText).toContain("replay-worthy final frame");
  });

  it.each([
    StoryMode.PREDATOR_VS_PREY,
    StoryMode.HERD_DEFENSE,
    StoryMode.MOTHER_BABY,
    StoryMode.RIVAL_CLASH,
    StoryMode.NEAR_MISS,
    StoryMode.FISHING_STRIKE,
    StoryMode.WEATHER_SURVIVAL,
    StoryMode.MIGRATION,
    StoryMode.SCAVENGER_CONFLICT,
  ])("preserves 4-shot structure for %s", (storyMode) => {
    const storyboard = buildCinematicStoryboard({
      ...baseInput,
      storyMode,
      subjectA: storyMode === StoryMode.SCAVENGER_CONFLICT ? "Bald Eagle" : baseInput.subjectA,
      subjectB: storyMode === StoryMode.SCAVENGER_CONFLICT ? "Coyote" : baseInput.subjectB,
      foodItem: storyMode === StoryMode.SCAVENGER_CONFLICT ? "Deer carcass zone" : undefined,
    });

    expect(storyboard.shots).toHaveLength(4);
    expect(storyboard.shots.map((shot) => shot.role)).toEqual(["hook", "pressure", "peak", "resolve"]);
    expect(storyboard.shots.every((shot) => shot.durationSeconds === 5)).toBe(true);
  });

  it("keeps Scavenger Conflict food-zone wording non-graphic and animal-free", () => {
    const promptText = allCopyablePromptText({
      ...baseInput,
      storyMode: StoryMode.SCAVENGER_CONFLICT,
      subjectA: "Bald Eagle",
      subjectB: "Coyote",
      foodItem: "Deer carcass zone",
    });

    expect(promptText).toContain("non-graphic food claim zone");
    expect(promptText).toContain("food source obscured");
    expect(promptText).toContain("no visible carcass detail");
    expect(promptText).toContain("no blood");
    expect(promptText).toContain("no gore");
  });

  it("is deterministic for the same build input", () => {
    expect(buildCinematicStoryboard(baseInput)).toEqual(buildCinematicStoryboard(baseInput));
  });
});

