import { describe, expect, it } from "vitest";

import {
  buildRealGenerationEvidenceLabel,
  calculateRealGenerationEvidenceOverallScore,
  createDefaultRealGenerationEvidenceScores,
  getRealGenerationEvidenceAttachmentSlots,
  getRealGenerationEvidenceGenerationId,
  removeRealGenerationEvidenceAttachmentMetadata,
  suggestRealGenerationEvidenceRecommendation,
  upsertRealGenerationEvidenceAttachmentMetadata,
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

  it("replaces attachment metadata by slot and removes it cleanly", () => {
    const first = {
      id: "attachment_1",
      slot: "master-still",
      mediaKind: "image",
      fileName: "master-1.png",
      mimeType: "image/png",
      sizeBytes: 1024,
      storedAt: "2026-04-24T00:00:00.000Z",
    } as const;
    const replacement = {
      ...first,
      id: "attachment_2",
      fileName: "master-2.png",
      storedAt: "2026-04-24T01:00:00.000Z",
    } as const;

    const withFirst = upsertRealGenerationEvidenceAttachmentMetadata([], first);
    const withReplacement = upsertRealGenerationEvidenceAttachmentMetadata(
      withFirst,
      replacement
    );

    expect(withReplacement).toHaveLength(1);
    expect(withReplacement[0]?.id).toBe("attachment_2");
    expect(
      removeRealGenerationEvidenceAttachmentMetadata(withReplacement, "master-still")
    ).toEqual([]);
  });

  it("only surfaces the optional seedance slot when the package has seedance output", () => {
    const basePkg = {
      predatorName: "Bald Eagle",
      preyName: "Salmon",
      arcName: "Fishing Strike",
      hook: "The strike window is already closing.",
      imagePrompt: "Bald eagle above the riverbank.",
      caption: "The fish turns right at the surface break.",
    };

    expect(
      getRealGenerationEvidenceAttachmentSlots(basePkg as never).map((slot) => slot.slot)
    ).not.toContain("seedance-output");
    expect(
      getRealGenerationEvidenceAttachmentSlots({
        ...basePkg,
        seedanceShots: ["Seedance shot 1"],
      } as never).map((slot) => slot.slot)
    ).toContain("seedance-output");
  });
});
