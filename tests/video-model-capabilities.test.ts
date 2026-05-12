import { describe, expect, it } from "vitest";

import { KLING_MODELS, RUNWAY_MODELS } from "@/lib/model-specs";
import {
  VIDEO_MODEL_CAPABILITIES,
  VIDEO_MODEL_GROUP_ORDER,
  getSceneBasedVideoModelRecommendations,
  getVideoModelCapabilitiesByGroup,
} from "@/lib/video-model-capabilities";

describe("video model capabilities", () => {
  it("covers the future-proof workflow taxonomy", () => {
    expect(VIDEO_MODEL_GROUP_ORDER).toEqual([
      "RUNWAY_NATIVE",
      "RUNWAY_THIRD_PARTY",
      "KLING_DIRECT",
      "SEEDANCE_DIRECT",
    ]);

    for (const group of VIDEO_MODEL_GROUP_ORDER) {
      expect(getVideoModelCapabilitiesByGroup(group).length).toBeGreaterThan(0);
    }
  });

  it("preserves existing Runway and direct Kling selector values", () => {
    for (const model of RUNWAY_MODELS) {
      expect(VIDEO_MODEL_CAPABILITIES.some((capability) => capability.label === model)).toBe(true);
    }

    for (const model of KLING_MODELS) {
      expect(VIDEO_MODEL_CAPABILITIES.some((capability) => capability.label === model)).toBe(true);
    }
  });

  it("adds requested new model capability coverage", () => {
    expect(VIDEO_MODEL_CAPABILITIES.map((capability) => capability.label)).toEqual(
      expect.arrayContaining([
        "Gen-4.5",
        "Gen-4",
        "Gen-4 Turbo",
        "Aleph",
        "Kling 3.0 Motion Control",
        "Kling 03 4K",
        "Seedance 2",
      ])
    );
  });

  it("marks uncertain third-party/direct details as needing verification", () => {
    for (const label of ["Aleph", "Kling 3.0 Motion Control", "Kling 03 4K", "Seedance 2"]) {
      const capability = VIDEO_MODEL_CAPABILITIES.find((entry) => entry.label === label);
      expect(capability?.needsVerification).toBe(true);
      expect(capability?.house.length).toBeGreaterThan(0);
      expect(capability?.official).toEqual([]);
    }
  });

  it("recommends Kling pressure routes for grounded conflict scenes", () => {
    const recommendations = getSceneBasedVideoModelRecommendations({
      actionStyle: "Close-contact fight",
      arc: "Territory dominance battle",
      contentLane: "Defender",
    });

    expect(recommendations.slice(0, 3).map((entry) => entry.label)).toEqual(
      expect.arrayContaining(["Kling 03 4K", "Kling 3.0 Motion Control"])
    );
  });

  it("recommends Seedance 2 for fast chase/action scenes", () => {
    const recommendations = getSceneBasedVideoModelRecommendations({
      actionStyle: "Viral chase",
      arc: "Escape from danger",
      contentLane: "Escape",
    });

    expect(recommendations[0].label).toBe("Seedance 2");
  });

  it("keeps recommendations deterministic", () => {
    const input = {
      actionStyle: "Natural tension" as const,
      arc: "Pack hunting strategy" as const,
      contentLane: "Pack Hunt" as const,
    };

    expect(getSceneBasedVideoModelRecommendations(input)).toEqual(
      getSceneBasedVideoModelRecommendations(input)
    );
  });
});
