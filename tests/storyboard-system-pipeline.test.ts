import { describe, expect, it } from "vitest";

import { formatFinalImagePrompt, formatImagePrompt } from "../storyboard_system/pipeline.mjs";

const storyboard = {
  aspectRatio: "9:16",
  continuityRules: ["preserve subject identity from storyboard references"],
};

const scene = {
  id: 1,
  name: "opening_tension",
  description: "opening tension between a grizzly bear and American bison",
  camera: "slightly low angle wildlife previsualization framing",
  motion: "slow controlled push-in",
  subject: "large bison in the foreground and grizzly bear at readable distance",
  action: "the bison stands grounded while the grizzly tests the pressure line without contact",
  lighting: "soft late-day light",
  environment: "Yellowstone-style meadow with sage, stones, distant pine edge, and rolling hills",
};

describe("storyboard system pencil prompt formatting", () => {
  it("builds storyboard image prompts with pencil, graphite, storyboard, and previsualization language", () => {
    const prompt = formatImagePrompt(scene, storyboard);

    expect(prompt).toContain("Create a single 9:16 vertical storyboard frame in pencil sketch style");
    expect(prompt).toContain("grayscale sketch");
    expect(prompt).toContain("black-and-white graphite drawing");
    expect(prompt).toContain("visible pencil strokes");
    expect(prompt).toContain("rough but clean linework");
    expect(prompt).toContain("light paper texture");
    expect(prompt).toContain("soft shading");
    expect(prompt).toContain("cinematic storyboard composition");
    expect(prompt).toContain("professional film previsualization style");
    expect(prompt).toContain("realistic animal anatomy");
    expect(prompt).toContain("realistic wildlife behavior");
    expect(prompt).toContain("lightly sketched but readable");
  });

  it("forbids color rendering, final photoreal art, poster polish, cartoon, anime, and 3D style", () => {
    const prompt = formatFinalImagePrompt(scene, storyboard);

    expect(prompt).toContain("no color rendering");
    expect(prompt).toContain("no photorealistic final illustration");
    expect(prompt).toContain("no polished poster look");
    expect(prompt).toContain("no cartoon style");
    expect(prompt).toContain("no anime style");
    expect(prompt).toContain("no 3D style");
  });

  it("does not reuse old cinematic master-image or photorealistic documentary wording", () => {
    const prompt = formatFinalImagePrompt(scene, storyboard);

    expect(prompt).not.toMatch(/cinematic wildlife documentary master image/i);
    expect(prompt).not.toMatch(/photorealistic wildlife documentary/i);
    expect(prompt).not.toMatch(/naturalistic lighting/i);
    expect(prompt).not.toMatch(/golden-hour realism/i);
    expect(prompt).not.toMatch(/polished master image/i);
  });
});
