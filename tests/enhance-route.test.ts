import { describe, expect, expectTypeOf, it } from "vitest";
import {
  normalizeClaudeVisionMimeType,
  parseProviderJsonObject,
} from "@/lib/enhance-provider";
import {
  copyPolishResponseSchema,
  mediaAnalysisSchema,
  type MediaAnalysisPayload,
} from "@/lib/schemas";
import type { MediaAnalysisResult } from "@/types";

describe("media analysis schema alignment", () => {
  const validPayload: MediaAnalysisPayload = {
    animalName: "Mountain Lion",
    coatDescription: "Short tawny coat with visible shoulder definition.",
    environment: "Rocky Mountain meadow",
    lighting: "Golden hour side light",
    suggestedArc: "Ambush attack",
    suggestedDepth: "Balanced Depth",
    weather: "Golden Hour",
    timeOfDay: "sunrise",
    driftRisk: "MEDIUM",
    isVideo: false,
    imagePromptInject: "Same mountain lion identity, same meadow, same light.",
    videoMotionInject: "Slow push-in, subtle grass motion, lion holds pressure.",
  };

  it("keeps the shared schema and exported type aligned", () => {
    expectTypeOf<MediaAnalysisResult>().toEqualTypeOf<MediaAnalysisPayload>();
    expect(mediaAnalysisSchema.safeParse(validPayload).success).toBe(true);
  });

  it("rejects dead fields that are not part of the shared payload", () => {
    const withDeadField = {
      ...validPayload,
      animalSpecies: "Puma concolor",
    };

    expect(mediaAnalysisSchema.safeParse(withDeadField).success).toBe(false);
  });
});

describe("enhance route provider helpers", () => {
  it("requires at least one usable copy-polish field", () => {
    expect(copyPolishResponseSchema.safeParse({}).success).toBe(false);
    expect(
      copyPolishResponseSchema.safeParse({
        imagePrompt: "Keep the same mountain lion identity, same scene continuity, cleaner prompt wording.",
      }).success
    ).toBe(true);
  });

  it("normalizes Claude image/jpg uploads to image/jpeg", () => {
    expect(normalizeClaudeVisionMimeType("image/jpg")).toBe("image/jpeg");
    expect(normalizeClaudeVisionMimeType("IMAGE/JPEG")).toBe("image/jpeg");
    expect(normalizeClaudeVisionMimeType("image/gif")).toBe("image/gif");
  });

  it("rejects unsupported Claude vision mime types", () => {
    expect(normalizeClaudeVisionMimeType("image/bmp")).toBeNull();
    expect(normalizeClaudeVisionMimeType("video/mp4")).toBeNull();
  });

  it("parses JSON-only provider output and rejects malformed text", () => {
    expect(parseProviderJsonObject('{"hook":"A","caption":"B"}', "Gemini enhancement")).toEqual({
      hook: "A",
      caption: "B",
    });

    expect(() =>
      parseProviderJsonObject("Hook: A\nCaption: B", "Gemini enhancement")
    ).toThrow(/non-JSON output/i);

    expect(() =>
      parseProviderJsonObject('{"hook":"A"', "Claude enhancement")
    ).toThrow(/non-JSON output|malformed JSON/i);
  });
});
