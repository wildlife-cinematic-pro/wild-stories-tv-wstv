import { describe, expect, it } from "vitest";

import {
  analyzePromptHealth,
  buildEnginePromptRecommendation,
} from "@/lib/prompt-health";

describe("analyzePromptHealth", () => {
  it("lowers score when negative wording is present", () => {
    const report = analyzePromptHealth({
      prompt:
        "Do not show blood. Avoid blur. Slow push-in as the wolf lunges and the elk reacts.",
      predatorName: "Wolf",
      preyName: "Elk",
    });

    expect(report.detectedRisks).toContain("negative wording");
    expect(report.score).toBeLessThan(85);
  });

  it("lowers score for multi-shot overload", () => {
    const report = analyzePromptHealth({
      prompt:
        "Shot 1, 0-3s: the crocodile waits. Shot 2, 3-6s: cut to the ambush trigger. Shot 3, 6-10s: the warthog recoils.",
      predatorName: "Crocodile",
      preyName: "Warthog",
    });

    expect(report.detectedRisks).toContain("multi-shot overload");
    expect(["Needs Review", "Risky"]).toContain(report.label);
  });

  it("scores a simple motion prompt highly", () => {
    const report = analyzePromptHealth({
      prompt:
        "Slow documentary push-in as the grizzly steps forward once and the bison lowers its head. Grass moves lightly in the same dawn field.",
      predatorName: "Grizzly",
      preyName: "Bison",
    });

    expect(["Strong", "Good"]).toContain(report.label);
    expect(report.detectedRisks).not.toContain("multi-shot overload");
  });

  it("recommends runway-safe mode for a compact one-shot prompt", () => {
    const report = analyzePromptHealth({
      prompt:
        "Slow push-in as the bald eagle drops once and the salmon breaks the waterline below.",
      predatorName: "Bald Eagle",
      preyName: "Salmon",
    });

    expect(report.recommendedMode).toBe("runway-safe");
  });

  it("marks a long shot-timed prompt as needs review or risky", () => {
    const report = analyzePromptHealth({
      prompt:
        "Shot 1, 0-3s: locked camera on the wolf pack while the herd circles. Shot 2, 3-6s: cut to a handheld burst as the camera races left. Shot 3, 6-10s: do not lose the bison, avoid blur, and keep adding pressure while the scene keeps shifting and the pack keeps moving around the frame.",
      predatorName: "Wolf Pack",
      preyName: "Bison",
    });

    expect(["Needs Review", "Risky"]).toContain(report.label);
  });
});

describe("buildEnginePromptRecommendation", () => {
  it("builds a runway-safe recommendation without negative phrasing", () => {
    const recommendation = buildEnginePromptRecommendation({
      prompt:
        "Do not show blood. Slow push-in as the wolf lunges and the elk reacts.",
      predatorName: "Wolf",
      preyName: "Elk",
      mode: "runway-safe",
    });

    expect(recommendation.prompt.toLowerCase()).not.toContain("do not");
    expect(recommendation.prompt.toLowerCase()).toContain("image-to-video");
  });
});
