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
      expect(shot.imagePrompts.nanoBanana2).toMatch(/^Shot \d — /);
      expect(shot.imagePrompts.gptImage2).toMatch(/^Shot \d — /);
      expect(shot.imagePrompts.grokImagine).toMatch(/^Shot \d — /);
      expect(Object.keys(shot.motionPrompts)).toEqual(["kling"]);
      expect(shot.motionPrompts.kling).toContain("Kling image-to-video, 5 seconds");
      expect("runway" in shot.motionPrompts).toBe(false);
      expect("seedance" in shot.motionPrompts).toBe(false);
    }
  });


  it("keeps storyboard image prompt bodies free of engine-heading labels and comma fragments", () => {
    const storyboard = buildCinematicStoryboard(baseInput);
    const imagePrompts = storyboard.shots.flatMap((shot) => [
      shot.imagePrompts.nanoBanana2,
      shot.imagePrompts.gptImage2,
      shot.imagePrompts.grokImagine,
    ]);

    for (const prompt of imagePrompts) {
      expect(prompt).not.toMatch(/^Nano Banana 2 reference-stable cinematic master image prompt/i);
      expect(prompt).not.toMatch(/^GPT Image 2 cinematic master image prompt/i);
      expect(prompt).not.toMatch(/^Grok Imagine cinematic master image prompt/i);
      expect(prompt).not.toMatch(/^(Nano Banana 2|GPT Image 2|Grok Imagine) prompt\./i);
      expect(prompt).not.toMatch(/Shot [1-4],/);
      expect(prompt).toMatch(/^Shot [1-4] — /);
      expect(prompt).toContain("Create a cinematic wildlife documentary master image");
    }

    expect(storyboard.shots[3].imagePrompts.nanoBanana2).toContain(
      "Shot 4 — Resolve / Unresolved Replay Ending"
    );
  });

  it("keeps copyable storyboard prompts free of aspect-ratio and non-storyboard engine wording", () => {
    const promptText = allCopyablePromptText();

    expect(promptText).not.toMatch(
      /\b(?:9:16|16:9|vertical|horizontal|portrait|landscape|aspect ratio|AR|Runway|Seedance|mobile vertical frame)\b/i
    );
  });

  it("builds Kling storyboard prompts in a sectioned 5-second image-to-video format", () => {
    const storyboard = buildCinematicStoryboard(baseInput);
    const klingPrompts = storyboard.shots.map((shot) => shot.motionPrompts.kling);

    expect(klingPrompts).toHaveLength(4);

    for (const prompt of klingPrompts) {
      expect(prompt).toContain("Kling image-to-video, 5 seconds");
      expect(prompt).toContain("Use the storyboard image as the first frame");
      expect(prompt).toContain("Subject motion:");
      expect(prompt).toContain("Camera motion:");
      expect(prompt).toContain("Environment motion:");
      expect(prompt).toContain("Continuity:");
      expect(prompt).toContain("Safety:");
      expect(prompt.length).toBeLessThanOrEqual(2500);
      expect(prompt).not.toMatch(
        /\b(?:9:16|16:9|vertical|horizontal|portrait|landscape|aspect ratio|AR|Runway|Seedance|mobile vertical frame)\b/i
      );
    }
  });

  it("uses distinct Kling motion logic for the 4 storyboard beats", () => {
    const storyboard = buildCinematicStoryboard(baseInput);
    const [hook, pressure, peak, resolve] = storyboard.shots.map((shot) => shot.motionPrompts.kling);

    expect(hook).toContain("slow push-in");
    expect(hook).toContain("threat eye-line");
    expect(pressure).toContain("slight lateral track");
    expect(pressure).toContain("closes pressure");
    expect(peak).toContain("strongest chase");
    expect(peak).toContain("no chaotic camera shake");
    expect(resolve).toContain("pulls back slightly");
    expect(resolve).toContain("unresolved survival tension");
    expect(new Set([hook, pressure, peak, resolve]).size).toBe(4);
  });

  it("keeps Scavenger Conflict Kling motion food-zone wording obscured and non-graphic", () => {
    const storyboard = buildCinematicStoryboard({
      ...baseInput,
      storyMode: StoryMode.SCAVENGER_CONFLICT,
      subjectA: "Bald Eagle",
      subjectB: "Coyote",
      foodItem: "Deer carcass zone",
    });

    for (const shot of storyboard.shots) {
      expect(shot.motionPrompts.kling).toContain("food source");
      expect(shot.motionPrompts.kling).toContain("obscured");
      expect(shot.motionPrompts.kling).toContain("non-graphic");
      expect(shot.motionPrompts.kling).toContain("no visible carcass detail");
      expect(shot.motionPrompts.kling.length).toBeLessThanOrEqual(2500);
    }
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

