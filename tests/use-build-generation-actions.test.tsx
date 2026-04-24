// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import type { SetStateAction } from "react";
import { describe, expect, it, vi } from "vitest";

import { useBuildGenerationActions } from "@/hooks/use-build-generation-actions";
import { buildOpeningFrameInput, type PublishFlowSummary } from "@/lib/build-package";
import { createDefaultPackageLockState } from "@/lib/package-section-locks";
import type { GeneratedPackage, PredatorInfo } from "@/types";

function makeExistingPackage(): GeneratedPackage {
  return {
    imagePrompt: "Existing image prompt",
    negativePrompt: "",
    thumbnailPrompt: "Existing thumbnail prompt",
    voiceoverLine: "Existing voiceover line",
    runwayShots: ["Runway shot 1"],
    klingShots: ["Kling shot 1"],
    motionStrength: 55,
    capCutPlan: "Existing CapCut plan",
    clipChaining: "Existing clip chaining",
    hook: "Existing hook",
    hook2026: ["Existing hook"],
    caption: "Existing caption",
    caption2026: "Existing caption",
    cta: "Existing CTA",
    hashtags: "#wildlife #mountainlion #deer #wstv #reels",
    tenIdeas: [],
    shotPlan: [],
    runwayBundle: "Runway bundle",
    klingBundle: "Kling bundle",
    routingNote: "Route through the default package flow.",
    predatorName: "Mountain Lion",
    preyName: "White-tailed Deer",
    arcName: "Ambush attack",
    cameraAnglePreset: "Auto",
  };
}

function makePreset(): PredatorInfo {
  return {
    prey: ["White-tailed Deer", "Mule Deer"],
    environment: "Rocky Mountain meadow",
    lighting: "golden hour rim light",
    cameraGear: "Canon EOS R5, 200mm wildlife lens",
    texture: "natural fur breakup and clean paw detail",
    defaultArc: "Ambush attack",
    driftRisk: "MEDIUM",
  };
}

describe("useBuildGenerationActions", () => {
  it("keeps the previous generated package visible during a fresh generate", async () => {
    const setPkg = vi.fn<(value: SetStateAction<GeneratedPackage | null>) => void>();
    const setPublishFlowSummary = vi.fn<
      (value: SetStateAction<PublishFlowSummary | null>) => void
    >();
    const setPackageLocks = vi.fn();
    const setIsGenerating = vi.fn();
    const setIsRegeneratingUnlocked = vi.fn();
    const setError = vi.fn();
    const onGenerated = vi.fn();

    const existingPackage = makeExistingPackage();
    const { result } = renderHook(() =>
      useBuildGenerationActions({
        predator: "Mountain Lion",
        prey: "White-tailed Deer",
        arc: "Ambush attack",
        previewArc: "Ambush attack",
        contentLane: "Auto",
        cameraAnglePreset: "Auto",
        weather: "Golden Hour",
        depthMode: "Balanced Depth",
        emotionalTone: "Raw Tension",
        animalVibe: "BBC Earth Documentary",
        runwayModel: "Gen-4.5",
        klingModel: "Kling 3.0 Pro",
        durationLane: "long",
        marketMode: "US_ONLY",
        fastPublishMode: false,
        strictOriginalityGuard: true,
        selectedPipelineStyle: "long-hybrid-4-shot",
        finalEnvironment: "Rocky Mountain meadow",
        preset: makePreset(),
        sceneDescription: "Readable mountain standoff with clean spacing and first-frame tension.",
        mediaAnalysis: null,
        activeProvider: "none",
        activePromotedPublishCopyOverride: null,
        previewHook2026: ["The deer turns too late."],
        previewPrimaryHook: "The deer turns too late.",
        previewShortCaption: "A readable mountain standoff breaks in seconds.",
        previewLongCaption:
          "A mountain lion closes the gap on a white-tailed deer in a clean readable opening that holds tension before the pressure snaps shut.",
        previewHashtags: "#wildlife #mountainlion #whitetaileddeer #wstv #reels",
        previewTags: "wildlife,mountain lion,white-tailed deer",
        previewRecommendedHookIndex: 0,
        previewHookFamily: "danger",
        previewAudienceScore: {
          total: 86,
          speciesScore: 28,
          environmentScore: 29,
          arcScore: 29,
          summary: "Strong U.S. wildlife concept with clear conflict.",
        },
        previewOpeningFrameInput: buildOpeningFrameInput(
          "Ambush attack",
          "Balanced Depth",
          true,
          true,
          true,
          false,
          "danger"
        ),
        previewOpeningFrameScore: {
          total: 82,
          summary: "Opening frame reads clearly.",
        },
        previewPerformanceSnapshot: null,
        realismMode: "Reference Locked",
        motionOnlyI2V: true,
        referenceLock: true,
        singleActionRule: true,
        microMotion: true,
        heroVeo: false,
        pkg: existingPackage,
        packageLocks: createDefaultPackageLockState(),
        setPkg,
        setPackageLocks,
        setPublishFlowSummary,
        setIsGenerating,
        setIsRegeneratingUnlocked,
        setError,
        onGenerated,
      })
    );

    await act(async () => {
      await result.current.handleGenerate();
    });

    expect(setPkg).not.toHaveBeenCalledWith(null);
    expect(setPublishFlowSummary).not.toHaveBeenCalledWith(null);
    expect(setPkg).toHaveBeenCalled();
    expect(onGenerated).toHaveBeenCalledTimes(1);
  });
});
