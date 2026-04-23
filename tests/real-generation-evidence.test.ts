import { describe, expect, it } from "vitest";

import {
  buildRealGenerationEvidenceLabel,
  calculateRealGenerationEvidenceOverallScore,
  createDefaultRealGenerationEvidenceScores,
  getRealGenerationEvidenceGenerationId,
  suggestRealGenerationEvidenceRecommendation,
} from "@/lib/real-generation-evidence";

describe("real-generation evidence scoring", () => {
  it("scores the default neutral evidence set at a mid-range overall score", () => {
    const scores = createDefaultRealGenerationEvidenceScores();

    expect(calculateRealGenerationEvidenceOverallScore(scores)).toBe(50);
    expect(suggestRealGenerationEvidenceRecommendation(scores)).toBe(
      "retry-with-fixes"
    );
  });

  it("recommends keep only when the critical categories stay strong", () => {
    const keepScores = {
      firstFrameReadability: 5,
      spacingClarity: 4,
      worldLightingContinuity: 4,
      anatomyPhysicsRealism: 4,
      actionReadability: 4,
      facebookOpeningStrength: 5,
    } as const;
    const retryScores = {
      ...keepScores,
      firstFrameReadability: 2,
    } as const;

    expect(suggestRealGenerationEvidenceRecommendation(keepScores)).toBe("keep");
    expect(suggestRealGenerationEvidenceRecommendation(retryScores)).toBe(
      "retry-with-fixes"
    );
  });

  it("builds a stable generation fallback key and label from the generated package", () => {
    const pkg = {
      predatorName: "Mountain Lion",
      preyName: "White-tailed Deer",
      arcName: "Escape from danger",
      pipelineStyle: "4-shot",
      hook: "Mountain lion pressure closes fast.",
      imagePrompt: "Mountain lion and deer share one frame.",
      caption: "A deer has one clean exit lane left.",
      generatedAt: "2026-04-24T00:00:00.000Z",
    };

    expect(getRealGenerationEvidenceGenerationId(pkg as never)).toContain(
      "Mountain Lion|White-tailed Deer|Escape from danger"
    );
    expect(buildRealGenerationEvidenceLabel(pkg as never)).toContain(
      "Mountain Lion vs White-tailed Deer"
    );
  });
});
