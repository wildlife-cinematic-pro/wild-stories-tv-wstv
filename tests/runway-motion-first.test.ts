import { describe, expect, it } from "vitest";

import {
  buildRunwayMotionFirstPrompt,
  makeRunwaySafePrompt,
  validateRunwayMotionFirstPrompt,
} from "@/lib/prompt-builders/runway-motion-first";

describe("runway motion-first prompt builder", () => {
  it("builds a compact motion-first prompt without negative-prompt wording", () => {
    const prompt = buildRunwayMotionFirstPrompt({
      predatorName: "Grizzly Bear",
      preyName: "Bison",
      environmentName: "Yellowstone valley",
      arcName: "Defender stands ground",
      shotRole: "opening",
      durationSeconds: 5,
      cameraMove: "Slow documentary push-in.",
      sceneDesc: "The bison reads the pressure line first.",
      safetyMode: "clean",
    });

    expect(prompt).toContain("Image-to-video from the same source image.");
    expect(prompt).toContain("Slow documentary push-in.");
    expect(prompt).toContain("same terrain, lighting, spacing");
    expect(prompt).toContain("no gore");
    expect(prompt.toLowerCase()).not.toContain("negative prompt");
  });

  it("strips dense image-generation clutter while preserving continuity and motion", () => {
    const safe = makeRunwaySafePrompt(
      "Image-to-video from the same source image. Ultra-detailed 8k CGI wildlife frame. Negative prompt: gore, blood. Slow push-in. Preserve the same terrain."
    );

    expect(safe).toContain("Image-to-video from the same source image.");
    expect(safe).toContain("Slow push-in.");
    expect(safe).toContain("Preserve the same terrain.");
    expect(safe.toLowerCase()).not.toContain("negative prompt");
    expect(safe.toLowerCase()).not.toContain("8k");
    expect(safe.toLowerCase()).not.toContain("cgi");
  });

  it("validates continuity, camera, motion, and safety", () => {
    const valid = validateRunwayMotionFirstPrompt(
      buildRunwayMotionFirstPrompt({
        predatorName: "Wolf Pack",
        preyName: "Bull Elk",
        environmentName: "snowy forest edge",
        arcName: "Pack hunting strategy",
        shotRole: "pressure",
        durationSeconds: 5,
        sceneDesc: "The pack compresses the lane while the elk looks for one break line.",
        safetyMode: "clean",
      })
    );

    const invalid = validateRunwayMotionFirstPrompt(
      "Ultra-detailed beast render with negative prompt: gore."
    );

    expect(valid.passed).toBe(true);
    expect(valid.score).toBeGreaterThanOrEqual(75);
    expect(invalid.passed).toBe(false);
    expect(invalid.warnings).toContain("Missing camera motion cue.");
    expect(invalid.warnings).toContain("Runway prompt still contains negative-prompt wording.");
  });
});
