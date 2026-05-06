import { describe, expect, it } from "vitest";

import {
  buildGeneratedPackageDraft,
  buildOpeningFrameInput,
  type GeneratedPackageDraftInput,
} from "@/lib/build-package";
import { buildPromptClarityReport } from "@/lib/prompt-clarity";

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
    contentLane: "Auto",
    cameraAnglePreset: "Auto",
    weather: "Golden Hour",
    depthMode: "Balanced Depth",
    emotionalTone: "Raw Tension",
    animalVibe: "BBC Earth Documentary",
    runwayModel: "Gen-4.5",
    klingModel: "Kling 3.0 Pro",
    durationLane: "medium",
    marketMode: "US_ONLY",
    fastPublishMode: false,
    strictOriginalityGuard: true,
    selectedPipelineStyle: "4-shot",
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

describe("prompt clarity report", () => {
  it("always returns simple, primary, and cinematic prompt views", () => {
    const draft = buildGeneratedPackageDraft(makeDraftInput());
    const report = buildPromptClarityReport(draft.basePkg);

    expect(report.simplePrompt.label).toBe("SIMPLE PROMPT (Fast copy)");
    expect(report.simplePrompt.prompt.length).toBeGreaterThan(0);
    expect(report.simplePrompt.prompt.split(/\n/)).toHaveLength(1);
    expect(report.simplePrompt.prompt).toContain("golden-hour rim light");

    expect(report.primaryPrompt.label).toBe("PRIMARY PROMPT (Paste this first)");
    expect(report.primaryPrompt.engine).toContain("Nano Banana 2 / Gemini master still");
    expect(report.primaryPrompt.reason).toContain("Selected automatically");
    expect(report.primaryPrompt.prompt.length).toBeGreaterThan(0);

    expect(report.cinematicPrompt.label).toBe("CINEMATIC PROMPT (Advanced control)");
    expect(report.cinematicPrompt.engine).toContain("Gen-4.5");
    expect(report.cinematicPrompt.prompt.length).toBeGreaterThan(0);
    expect(report.decision.confidenceLevel).toMatch(/High|Medium|Risky/);
    expect(report.debugCandidates.length).toBeGreaterThanOrEqual(5);
  });

  it("builds timeline mode for all four hybrid shots with fixed segment windows", () => {
    const draft = buildGeneratedPackageDraft(
      makeDraftInput({
        durationLane: "long",
        selectedPipelineStyle: "long-hybrid-4-shot",
      })
    );
    const report = buildPromptClarityReport(draft.basePkg);

    expect(report.timelineMode).toHaveLength(4);
    for (const shot of report.timelineMode) {
      expect(shot.segments.map((segment) => segment.window)).toEqual([
        "0–2s",
        "2–4s",
        "4–6s",
      ]);
      expect(shot.generationDurationLabel).toMatch(/^Generation duration: (5|10)s$/);
      expect(shot.editTimelineLabel).toMatch(/^Edit timeline:/);
    }
  });

  it("auto-selects the best prompt candidate by decision score", () => {
    const draft = buildGeneratedPackageDraft(makeDraftInput());
    const badImage =
      "A vague animal smiles in an unbelievable majestic cinematic scene with gorgeous beautiful legendary lighting.";

    const pkg = {
      ...draft.basePkg,
      imagePrompt: badImage,
      structuredPrompts: {
        ...draft.basePkg.structuredPrompts,
        imagePrompt: {
          ...draft.basePkg.structuredPrompts!.imagePrompt!,
          fullText: badImage,
          pasteReady: badImage,
        },
      },
    };

    const report = buildPromptClarityReport(pkg);

    expect(report.decision.selectedKey).toBe("workflow-1");
    expect(report.primaryPrompt.engine).toContain("Gen-4.5 Shot 1");
  });

  it("adds safe mode and fallback recovery for risky primary prompts", () => {
    const draft = buildGeneratedPackageDraft(makeDraftInput());
    const hugeTail = " very".repeat(700);
    const badImage = `A vague animal smiles and laughs while it charges, retreats, pivots, lunges, and spins in an epic majestic incredible unbelievable hyper-detailed stunning gorgeous dramatic cinematic powerful scene.${hugeTail}`;
    const badWorkflow = `A vague animal smiles and then charges, retreats, pivots, lunges, and spins while the camera does a slow push-in and pull-back with static tracking, epic majestic incredible unbelievable hyper-detailed stunning gorgeous dramatic cinematic powerful lighting.${hugeTail}`;

    const brokenPkg = {
      ...draft.basePkg,
      imagePrompt: badImage,
      structuredPrompts: {
        ...draft.basePkg.structuredPrompts,
        imagePrompt: {
          ...draft.basePkg.structuredPrompts!.imagePrompt!,
          fullText: badImage,
          pasteReady: badImage,
        },
        workflowShots: draft.basePkg.structuredPrompts!.workflowShots!.map((shot) => ({
          ...shot,
          fullText: badWorkflow,
          pasteReady: badWorkflow,
        })),
        seedanceMultiShot: {
          ...draft.basePkg.structuredPrompts!.seedanceMultiShot!,
          fullText: "Mountain lion charges mule deer.",
          pasteReady: "Mountain lion charges mule deer.",
        },
      },
    };

    const report = buildPromptClarityReport(brokenPkg);

    expect(report.decision.confidenceLevel).toBe("Risky");
    expect(report.decision.safeModeApplied).toBe(true);
    expect(report.decision.fallback).toBeDefined();
    expect(report.primaryPrompt.engine).toContain("Safe Mode");
    expect(report.primaryPrompt.prompt).not.toContain("smiles and laughs");
  });

  it("flags unclear subjects, unrealistic behavior, conflicting camera, multiple actions, long Kling prompts, and engine hard rules", () => {
    const draft = buildGeneratedPackageDraft(makeDraftInput());
    const hugeTail = " very ".repeat(650);
    const badPrimary =
      "A vague animal smiles dramatically in an epic majestic unbelievable cinematic scene with gorgeous powerful intense beautiful legendary dramatic lighting.";
    const badKling = `A vague animal smiles and then charges, retreats, pivots, lunges, and spins while the camera does a slow push-in and pull-back with static tracking, epic majestic incredible unbelievable hyper-detailed stunning gorgeous dramatic cinematic powerful lighting.${hugeTail}`;
    const badRunway =
      "Mountain lion closes distance on mule deer in rocky meadow, golden-hour rim light, cinematic wildlife realism.";

    const brokenPkg = {
      ...draft.basePkg,
      imagePrompt: badPrimary,
      structuredPrompts: {
        ...draft.basePkg.structuredPrompts,
        imagePrompt: {
          ...draft.basePkg.structuredPrompts!.imagePrompt!,
          fullText: badPrimary,
          pasteReady: badPrimary,
        },
        workflowShots: draft.basePkg.structuredPrompts!.workflowShots!.map((shot, index) =>
          index === 0
            ? {
                ...shot,
                fullText: badRunway,
                pasteReady: badRunway,
              }
            : index === 1
              ? {
                  ...shot,
                  fullText: badKling,
                  pasteReady: badKling,
                  metadata: {
                    ...shot.metadata,
                    durationSeconds: 15,
                  },
                }
              : shot
        ),
        seedanceMultiShot: {
          ...draft.basePkg.structuredPrompts!.seedanceMultiShot!,
          fullText: "Mountain lion charges mule deer.",
          pasteReady: "Mountain lion charges mule deer.",
        },
      },
    };

    const report = buildPromptClarityReport(brokenPkg);
    const ids = report.warnings.map((warning) => warning.id);

    expect(ids).toContain("unclear-subject");
    expect(ids).toContain("multiple-actions");
    expect(ids).toContain("unrealistic-behavior");
    expect(ids).toContain("excessive-adjectives");
    expect(ids).toContain("conflicting-camera");
    expect(ids).toContain("kling-too-long");
    expect(ids).toContain("kling-single-action");
    expect(ids).toContain("runway-camera-clarity");
    expect(ids).toContain("seedance-structured-flow");
    expect(ids).toContain("engine-compliance");
    expect(report.scores.engineComplianceScore).toBeLessThan(100);
    expect(report.scores.pasteReadinessScore).toBeLessThan(90);
  });
});
