import { describe, expect, it } from "vitest";

import {
  evaluateMasterImagePrompt,
  getMasterImageFixPrompt,
} from "@/lib/master-image-quality";

describe("master image quality gate", () => {
  it("passes a strong reference prompt", () => {
    const report = evaluateMasterImagePrompt({
      prompt:
        "Photorealistic wildlife documentary master image, 9:16 vertical. Full-body readable grizzly and bison with grounded paw and hoof contact, clean spacing, thumbnail-safe first-frame composition, stable anatomy, Yellowstone habitat continuity, and no blood, no gore, no visible wounds.",
      predatorName: "Grizzly Bear",
      preyName: "Bison",
      environmentName: "Yellowstone meadow",
    });

    expect(report.passed).toBe(true);
    expect(report.score).toBeGreaterThanOrEqual(80);
    expect(report.checks.every((check) => check.passed || check.severity !== "danger")).toBe(true);
  });

  it("fails a weak prompt and returns a usable fix line", () => {
    const report = evaluateMasterImagePrompt({
      prompt: "Epic animal clash in the wild.",
      predatorName: "Wolf Pack",
      preyName: "Moose",
      environmentName: "boreal marsh edge",
    });

    const fix = getMasterImageFixPrompt(report);

    expect(report.passed).toBe(false);
    expect(report.checks.find((check) => check.id === "vertical-framing")?.passed).toBe(false);
    expect(fix).toContain("Add 9:16 vertical framing language.");
    expect(fix).toContain("Add grounded paw, hoof, or foot contact.");
  });
});
