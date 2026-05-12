import { describe, expect, it } from "vitest";

import { KLING_MODELS, RUNWAY_MODELS } from "@/lib/model-specs";
import {
  VIDEO_MODEL_CAPABILITIES,
  VIDEO_MODEL_GROUP_ORDER,
  getDefaultSelectedVideoModelId,
  getSceneBasedVideoModelRecommendations,
  getVideoModelCapabilitiesByGroup,
  getVideoModelSelectionPatch,
  resolveAutoSelectedVideoModel,
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


  it("maps old presets to a safe default selected video model", () => {
    expect(
      getDefaultSelectedVideoModelId({
        runwayModel: "Gen-4.5",
        klingModel: "Kling 3.0 Pro",
      })
    ).toBe("runway-gen-4-5");

    expect(
      getDefaultSelectedVideoModelId({
        selectedVideoModelId: "seedance-2",
        runwayModel: "Gen-4",
      })
    ).toBe("seedance-2");
  });

  it("maps expanded selections without corrupting legacy model fields", () => {
    expect(getVideoModelSelectionPatch("runway-gen-4-turbo")).toMatchObject({
      selectedVideoModelId: "runway-gen-4-turbo",
      selectedVideoProviderGroup: "RUNWAY_NATIVE",
      runwayModel: "Gen-4 Turbo",
    });

    expect(getVideoModelSelectionPatch("kling-3-0-pro")).toMatchObject({
      selectedVideoModelId: "kling-3-0-pro",
      selectedVideoProviderGroup: "KLING_DIRECT",
      klingModel: "Kling 3.0 Pro",
    });

    for (const id of ["seedance-2", "runway-aleph", "kling-03-4k", "kling-3-0-motion-control"]) {
      const patch = getVideoModelSelectionPatch(id);
      expect(patch?.selectedVideoModelId).toBe(id);
      expect(patch).not.toHaveProperty("runwayModel");
      expect(patch).not.toHaveProperty("klingModel");
    }
  });

  it("marks recommendations as legacy-sync or expanded-only", () => {
    const pressure = getSceneBasedVideoModelRecommendations({
      actionStyle: "Close-contact fight",
      arc: "Territory dominance battle",
      contentLane: "Defender",
    });

    expect(
      getSceneBasedVideoModelRecommendations({
        actionStyle: "Natural tension",
        arc: "Pack hunting strategy",
        contentLane: "Pack Hunt",
      }).find((entry) => entry.label === "Kling 3.0 Pro")
    ).toMatchObject({
      selectionMode: "legacy-sync",
      legacyTarget: { engine: "kling", model: "Kling 3.0 Pro" },
    });

    for (const label of ["Kling 03 4K", "Kling 3.0 Motion Control"]) {
      expect(pressure.find((entry) => entry.label === label)).toMatchObject({
        selectionMode: "expanded-only",
        bestFor: expect.stringMatching(/route|selection/i),
      });
    }
  });

  it("keeps auto-select off from mutating selected model and applies top recommendation when on", () => {
    const recommendations = getSceneBasedVideoModelRecommendations({
      actionStyle: "Viral chase",
      arc: "Escape from danger",
      contentLane: "Escape",
    });

    expect(
      resolveAutoSelectedVideoModel({
        autoSelectRecommendedVideoModel: false,
        currentSelectedVideoModelId: "runway-gen-4-5",
        recommendations,
      })
    ).toBe("runway-gen-4-5");

    expect(
      resolveAutoSelectedVideoModel({
        autoSelectRecommendedVideoModel: true,
        currentSelectedVideoModelId: "runway-gen-4-5",
        recommendations,
      })
    ).toBe("seedance-2");
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
