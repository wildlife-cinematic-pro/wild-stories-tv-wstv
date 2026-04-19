import { describe, expect, it } from "vitest";

import {
  buildGeneratedPackageDraft,
  buildOpeningFrameInput,
  finalizeGeneratedPackageDraft,
  type GeneratedPackageDraftInput,
} from "@/lib/build-package";

function makeDraftInput(
  overrides: Partial<GeneratedPackageDraftInput> = {}
): GeneratedPackageDraftInput {
  const quality = {
    realismMode: "Reference Locked" as const,
    motionOnlyI2V: true,
    referenceLock: true,
    singleActionRule: true,
    microMotion: true,
    heroVeo: false,
  };

  return {
    predator: "Mountain Lion",
    prey: "Mule Deer",
    presetLighting: "golden hour rim light",
    presetCameraGear: "Canon EOS R5, 200mm wildlife lens",
    presetTexture: "natural fur breakup and clean paw detail",
    presetDriftRisk: "MEDIUM",
    presetForIdeas: {
      prey: ["Mule Deer", "Elk"],
      environment: "Rocky Mountain meadow",
      lighting: "golden hour rim light",
      cameraGear: "Canon EOS R5, 200mm wildlife lens",
      texture: "natural fur breakup and clean paw detail",
      defaultArc: "Ambush attack",
      driftRisk: "MEDIUM",
    },
    finalEnvironment: "Rocky Mountain meadow",
    finalArc: "Ambush attack",
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
    sceneInject:
      "Readable mountain standoff with clean spacing and first-frame tension.",
    quality,
    finalHook2026: [
      "The deer turns too late.",
      "The mountain silence breaks first.",
      "One step changes the whole frame.",
    ],
    finalHook: "The deer turns too late.",
    shortCaption: "A readable mountain standoff breaks in seconds.",
    longCaption:
      "A mountain lion closes the gap on a mule deer in a clean readable opening that holds tension before the pressure snaps shut.",
    hashtags: "#wildlife #nature #mountainlion #muledeer #wstv",
    tags: "wildlife,nature,mountain lion,mule deer",
    recommendedHookIndex: 0,
    hookFamily: "danger",
    usAudienceScore: {
      total: 86,
      speciesScore: 28,
      environmentScore: 29,
      arcScore: 29,
      summary: "Strong U.S. wildlife concept with clear conflict.",
    },
    openingFrameInput: buildOpeningFrameInput(
      "Ambush attack",
      "Balanced Depth",
      true,
      true,
      true,
      false,
      "danger"
    ),
    openingFrameScore: {
      total: 82,
      summary: "Opening frame reads clearly.",
    },
    ...overrides,
  };
}

describe("build-package refactor seam", () => {
  it("builds the primary hybrid draft in Runway / Kling / Kling / Runway order", () => {
    const draft = buildGeneratedPackageDraft(makeDraftInput());

    expect(draft.basePkg.shotPlan.map((shot) => shot.engine)).toEqual([
      "RUNWAY",
      "KLING",
      "KLING",
      "RUNWAY",
    ]);

    expect(
      draft.basePkg.structuredPrompts?.workflowShots?.map(
        (shot) => shot.metadata?.engine
      )
    ).toEqual(["runway", "kling", "kling", "runway"]);
  });

  it("keeps structured prompt fields populated for the UI and preserves the Nano Banana image path", () => {
    const draft = buildGeneratedPackageDraft(makeDraftInput());
    const prompts = draft.basePkg.structuredPrompts;

    expect(prompts?.imagePrompt?.fullText).toBe(draft.basePkg.imagePrompt);
    expect(prompts?.imagePrompt?.pasteReady).toBe(draft.basePkg.imagePrompt);
    expect(prompts?.imagePrompt?.metadata?.engine).toBe("image");
    expect(prompts?.imagePrompt?.fullText).not.toMatch(/--ar\s+9:16/i);
    expect(prompts?.imagePrompt?.fullText).not.toMatch(/--style\s+raw/i);

    expect(prompts?.runwayShots?.[0]?.pasteReady.length).toBeGreaterThan(0);
    expect(prompts?.klingShots?.[1]?.audio).toBeTruthy();
    expect(prompts?.seedanceMultiShot?.fullText).toBe(
      draft.basePkg.seedanceMultiShotPrompt
    );
    expect(prompts?.klingNative15s?.pasteReady.length).toBeGreaterThan(0);
    expect(prompts?.klingSixShot?.pasteReady.length).toBeGreaterThan(0);
  });

  it("finalizes the draft with enhancements while preserving generated extras", () => {
    const draft = buildGeneratedPackageDraft(makeDraftInput());
    const { finalPkg, publishFlowSummary } = finalizeGeneratedPackageDraft(
      draft,
      {
        hook: "The mountain silence breaks first.",
        caption: "Enhanced fast-publish caption.",
        voiceoverLine: "Enhanced voiceover line.",
        aiEnhanced: true,
      }
    );

    expect(finalPkg.hook).toBe("The mountain silence breaks first.");
    expect(finalPkg.caption).toBe("Enhanced fast-publish caption.");
    expect(finalPkg.voiceoverLine).toBe("Enhanced voiceover line.");
    expect(finalPkg.aiEnhanced).toBe(true);
    expect(finalPkg.capCutScript).toEqual(draft.capCutScript);
    expect(finalPkg.usViewsModeReport).toBeDefined();

    expect(publishFlowSummary.predatorName).toBe("Mountain Lion");
    expect(publishFlowSummary.preyName).toBe("Mule Deer");
    expect(publishFlowSummary.durationLane).toBe("long");
    expect(publishFlowSummary.pipelineStyle).toBe("long-hybrid-4-shot");
  });
});
