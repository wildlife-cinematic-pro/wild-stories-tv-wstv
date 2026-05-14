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
      shot.imagePrompts.gptImage2Long,
      shot.imagePrompts.gptImage2Short,
      shot.imagePrompts.nanoBanana2Long,
      shot.imagePrompts.nanoBanana2Short,
      shot.motionPrompts.kling,
    ])
    .join("\n");
}

describe("pencil storyboard shot builder", () => {
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

  it("outputs GPT Image 2 and Nano Banana 2 long/short prompt variants plus Kling-only motion prompts", () => {
    const storyboard = buildCinematicStoryboard(baseInput);

    expect(storyboard.summary.imagePromptVariants).toEqual([
      "GPT Image 2 — Long Version",
      "GPT Image 2 — Short Version",
      "Nano Banana 2 — Long Version",
      "Nano Banana 2 — Short Version",
    ]);

    for (const shot of storyboard.shots) {
      expect(Object.keys(shot.imagePrompts)).toEqual([
        "gptImage2Long",
        "gptImage2Short",
        "nanoBanana2Long",
        "nanoBanana2Short",
      ]);
      expect(shot.imagePrompts.gptImage2Long).toMatch(/^Shot \d — /);
      expect(shot.imagePrompts.gptImage2Short).toMatch(/^Shot \d — /);
      expect(shot.imagePrompts.nanoBanana2Long).toMatch(/^Shot \d — /);
      expect(shot.imagePrompts.nanoBanana2Short).toMatch(/^Shot \d — /);
      expect(Object.keys(shot.motionPrompts)).toEqual(["kling"]);
      expect(shot.motionPrompts.kling).toContain("Kling image-to-video, 5 seconds");
      expect("runway" in shot.motionPrompts).toBe(false);
      expect("seedance" in shot.motionPrompts).toBe(false);
    }
  });

  it("keeps storyboard image prompt bodies free of engine-heading labels and comma fragments", () => {
    const storyboard = buildCinematicStoryboard(baseInput);
    const imagePrompts = storyboard.shots.flatMap((shot) => [
      shot.imagePrompts.gptImage2Long,
      shot.imagePrompts.gptImage2Short,
      shot.imagePrompts.nanoBanana2Long,
      shot.imagePrompts.nanoBanana2Short,
    ]);

    for (const prompt of imagePrompts) {
      expect(prompt).not.toMatch(/^Nano Banana 2 reference-stable cinematic master image prompt/i);
      expect(prompt).not.toMatch(/^GPT Image 2 cinematic master image prompt/i);
      expect(prompt).not.toMatch(/^(Nano Banana 2|GPT Image 2) prompt\./i);
      expect(prompt).not.toMatch(/Shot [1-4],/);
      expect(prompt).toMatch(/^Shot [1-4] — /);
      expect(prompt).toContain("Both animals must be full-body visible, fully readable, correctly scaled, grounded, and clearly separated.");
      expect(prompt).toContain("Do not crop heads, backs, legs, hooves, paws, tails, horns, shoulders, or body mass.");
    }

    expect(storyboard.shots[3].imagePrompts.nanoBanana2Long).toContain(
      "Shot 4 — Resolve / Unresolved Replay Ending"
    );
  });

  it("keeps storyboard image prompts explicit about 9:16 vertical frames without non-storyboard engine wording", () => {
    const storyboard = buildCinematicStoryboard(baseInput);
    const imagePrompts = storyboard.shots.flatMap((shot) => [
      shot.imagePrompts.gptImage2Long,
      shot.imagePrompts.gptImage2Short,
      shot.imagePrompts.nanoBanana2Long,
      shot.imagePrompts.nanoBanana2Short,
    ]);
    const promptText = allCopyablePromptText();

    for (const prompt of imagePrompts) {
      expect(prompt).toContain("9:16 vertical");
      expect(prompt).toContain("Both animals must be full-body visible, fully readable, correctly scaled, grounded, and clearly separated.");
    }

    expect(promptText).not.toMatch(/\b(?:Runway|Seedance|mobile vertical frame)\b/i);
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

  it("includes the exact full-body and no-cropping rules in every storyboard image variant", () => {
    const storyboard = buildCinematicStoryboard(baseInput);
    const imagePrompts = storyboard.shots.flatMap((shot) => [
      shot.imagePrompts.gptImage2Long,
      shot.imagePrompts.gptImage2Short,
      shot.imagePrompts.nanoBanana2Long,
      shot.imagePrompts.nanoBanana2Short,
    ]);

    for (const prompt of imagePrompts) {
      expect(prompt).toContain("Both animals must be full-body visible, fully readable, correctly scaled, grounded, and clearly separated.");
      expect(prompt).toContain("Do not crop heads, backs, legs, hooves, paws, tails, horns, shoulders, or body mass.");
    }
  });

  it("applies pencil storyboard style language to copyable image prompts", () => {
    const promptText = allCopyablePromptText();

    expect(promptText).toContain("pencil sketch style");
    expect(promptText).toContain("grayscale sketch");
    expect(promptText).toContain("black-and-white graphite drawing");
    expect(promptText).toContain("visible pencil strokes");
    expect(promptText).toContain("rough but clean linework");
    expect(promptText).toContain("light paper texture");
    expect(promptText).toContain("soft shading");
    expect(promptText).toContain("cinematic storyboard composition");
    expect(promptText).toContain("professional film previsualization style");
    expect(promptText).toContain("mobile-readable composition");
    expect(promptText).toContain("one clear action lane");
    expect(promptText).toContain("realistic wildlife behavior");
  });

  it("forbids color, photoreal final art, poster, cartoon, anime, and 3D styling in storyboard prompts", () => {
    const promptText = allCopyablePromptText();

    expect(promptText).toContain("no color rendering");
    expect(promptText).toContain("no photorealistic final illustration");
    expect(promptText).toContain("no polished final illustration");
    expect(promptText).toContain("no polished poster look");
    expect(promptText).toContain("no cartoon style");
    expect(promptText).toContain("no anime style");
    expect(promptText).toContain("no 3D style");
  });

  it("does not reuse photorealistic master-image wording for storyboard image prompts", () => {
    const promptText = allCopyablePromptText();

    expect(promptText).not.toContain("cinematic wildlife documentary master image");
    expect(promptText).not.toContain("photorealistic wildlife documentary");
    expect(promptText).not.toContain("National Geographic Wild");
    expect(promptText).not.toContain("golden-hour realism");
    expect(promptText).not.toContain("polished master image");
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

