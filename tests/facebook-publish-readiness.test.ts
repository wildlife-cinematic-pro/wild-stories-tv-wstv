import { describe, expect, it } from "vitest";

import type { GeneratedPackage, RealGenerationEvidenceRecord } from "@/types";

import { buildFacebookPublishReadinessReport } from "@/lib/facebook-publish-readiness";

function buildBasePlatformPack() {
  return {
    facebook: {
      hook: "Mountain lion pressure closes before the mule deer clears the break.",
      caption: "Mountain lion pressure closes before the mule deer finds a clean turn.\n\nWhat changed the outcome first?",
      pinnedComment: "Wild Crew — did you spot the tell before it happened?",
      hashtags: "#MountainLion #MuleDeer #WildlifeReel #PredatorPrey #NatureShorts",
      bestTime: "7:30 PM EST",
      cmpNote: "Documentary tone.",
      overlayGuidance: {
        placement: "Upper safe zone",
        textLength: "1-2 short lines",
        opener: "Readable motion in frame 1",
        audio: "Works sound-on or sound-off",
        tone: "Documentary, non-clickbait",
      },
      facebookOverlayRecommendation: {
        recommended: {
          preset: "facebook_species_first",
          label: "Facebook species-first opener",
          text: "Mountain Lion\nPressure closes fast",
          score: 84,
          reason: "Species-first opener fits the frame.",
          frameHeuristics: {
            speciesReadability: "high",
            textAnimalCollisionRisk: "low",
            silhouetteConflictRisk: "low",
            leftRightSubjectFit: "strong",
            frame1Choice: "species-first",
            summary: "Strong species read with low text collision risk.",
          },
        },
        alternatives: [],
        reason: "Species-first opener stays clean and readable.",
      },
      facebookCoverFrameRanking: {
        best: {
          preset: "species_pressure",
          label: "Species + pressure",
          text: "Mountain Lion\nPressure closes fast",
          score: 82,
          reasons: ["Species is clear", "Pressure line stays short"],
          frameHeuristics: {
            speciesReadability: "high",
            textAnimalCollisionRisk: "low",
            silhouetteConflictRisk: "low",
            leftRightSubjectFit: "strong",
            frame1Choice: "species-first",
            summary: "Strong cover-frame clarity.",
          },
        },
        ranked: [],
        reason: "Species + pressure reads fastest.",
      },
    },
    instagram: {
      hook: "Mountain lion pressure closes before the mule deer clears the break.",
      caption: "Mountain lion pressure closes before the mule deer finds a clean turn.\n\nWhat changed the outcome first?",
      pinnedComment: "Wild Crew — did you spot the tell before it happened?",
      hashtags: "#MountainLion #MuleDeer #WildlifeReel #PredatorPrey #NatureShorts",
      bestTime: "7:30 PM EST",
    },
    tiktok: {
      hook: "Mountain lion pressure closes before the mule deer clears the break.",
      caption: "Mountain lion pressure closes before the mule deer finds a clean turn.",
      hashtags: "#MountainLion #MuleDeer #WildlifeReel #PredatorPrey #NatureShorts",
      bestTime: "7:30 PM EST",
    },
    youtube_shorts: {
      title: "Mountain Lion vs Mule Deer",
      description: "Mountain lion pressure closes before the mule deer finds a clean turn.",
      tags: "mountain lion,mule deer,wildlife reel,predator prey,nature shorts",
      bestTime: "7:30 PM EST",
    },
  } as const;
}

function makePackage(overrides: Partial<GeneratedPackage> = {}): GeneratedPackage {
  return {
    imagePrompt: "Mountain lion and mule deer hold one readable opening frame in a dry meadow edge.",
    negativePrompt: "",
    thumbnailPrompt: "Mountain lion vs mule deer",
    voiceoverLine: "The deer has one clean exit lane left.",
    runwayShots: ["Shot 1"],
    klingShots: ["Shot 1"],
    motionStrength: 64,
    capCutPlan: "Cut on the turn.",
    clipChaining: "Hold the left-to-right line.",
    predatorName: "Mountain Lion",
    preyName: "Mule Deer",
    arcName: "Escape from danger",
    hook: "Mountain lion pressure closes before the mule deer clears the break.",
    hook2026: ["Mountain lion pressure closes before the mule deer clears the break."],
    caption: "Mountain lion pressure closes before the mule deer finds a clean turn.\n\nWhat changed the outcome first?",
    caption2026: "Mountain lion pressure closes before the mule deer finds a clean turn.\n\nWhat changed the outcome first?",
    cta: "What changed the outcome first?",
    altTextPrompt:
      "AI-generated cinematic wildlife scene showing Mountain Lion and Mule Deer during an Escape from danger sequence. Wild Stories TV original AI wildlife scene — produced for cinematic storytelling.",
    hashtags: "#MountainLion #MuleDeer #WildlifeReel #PredatorPrey #NatureShorts",
    tenIdeas: [],
    shotPlan: [],
    runwayBundle: "Runway bundle",
    klingBundle: "Kling bundle",
    routingNote: "Default route.",
    platformPack: buildBasePlatformPack(),
    openingFrameScore: {
      total: 86,
      summary: "Opening frame reads cleanly.",
    },
    usAudienceScore: {
      total: 84,
      speciesScore: 28,
      environmentScore: 28,
      arcScore: 28,
      summary: "Strong U.S. wildlife setup.",
    },
    publishGuardReport: {
      isPass: true,
      warnings: [],
    },
    usViewsModeReport: {
      durationLane: "short",
      hookFamily: "danger",
      audienceScore: {
        total: 84,
        speciesScore: 28,
        environmentScore: 28,
        arcScore: 28,
        summary: "Strong U.S. wildlife setup.",
      },
      openingFrameScore: {
        total: 86,
        summary: "Opening frame reads cleanly.",
      },
      publishGuard: {
        isPass: true,
        warnings: [],
      },
      shouldPublish: true,
      summary: "Good to publish.",
      nextActions: ["Post the current package."],
    },
    ...overrides,
  };
}

function makeEvidence(
  overrides: Partial<RealGenerationEvidenceRecord> = {}
): RealGenerationEvidenceRecord {
  return {
    id: "evidence_1",
    generationId: "generation_1",
    generationLabel: "Mountain Lion vs Mule Deer • Escape from danger • 4-shot • 2026-04-24 00:00",
    generatedAt: "2026-04-24T00:00:00.000Z",
    capturedAt: "2026-04-24T01:00:00.000Z",
    predatorName: "Mountain Lion",
    preyName: "Mule Deer",
    arcName: "Escape from danger",
    pipelineStyle: "4-shot",
    scores: {
      firstFrameReadability: 5,
      spacingClarity: 4,
      worldLightingContinuity: 4,
      anatomyPhysicsRealism: 4,
      actionReadability: 4,
      facebookOpeningStrength: 5,
    },
    overallScore: 85,
    suggestedRecommendation: "keep",
    userRecommendation: "keep",
    notes: {
      strongPoints: "Opening frame stayed clean.",
      driftObserved: "",
      failedPoints: "",
      retryPlan: "",
      masterStill: "",
      runway: "",
      kling: "",
      seedance: "",
    },
    ...overrides,
  };
}

describe("facebook publish readiness workflow", () => {
  it("marks a strong package as ready to publish", () => {
    const report = buildFacebookPublishReadinessReport(makePackage(), makeEvidence());

    expect(report.verdict).toBe("ready-to-publish");
    expect(report.overallScore).toBeGreaterThanOrEqual(78);
    expect(report.scores.originalityConfidence).toBeGreaterThanOrEqual(68);
    expect(report.scores.shareIntentScore).toBeGreaterThanOrEqual(7);
    expect(report.scores.commentDepthIntentScore).toBeGreaterThanOrEqual(6);
    expect(report.scores.monetisationSafetyScore).toBeGreaterThanOrEqual(7);
    expect(report.scores.ownedFunnelConversionIntentScore).toBeGreaterThanOrEqual(4);
    expect(report.publishGuardPass).toBe(true);
    expect(report.reminders[0]).toMatch(/AI-generated-content label/i);
  });

  it("routes noisy packaging into review before publish", () => {
    const report = buildFacebookPublishReadinessReport(
      makePackage({
        caption: "Watch till the end and comment below.",
        cta: "Comment below and tag a friend.",
        hashtags: "#MountainLion #MountainLion #WildlifeReel #WatchTillTheEnd #CommentBelow #NatureShorts",
        platformPack: {
          ...buildBasePlatformPack(),
          facebook: {
            ...buildBasePlatformPack().facebook,
            caption: "Watch till the end and comment below.",
            hashtags:
              "#MountainLion #MountainLion #WildlifeReel #WatchTillTheEnd #CommentBelow #NatureShorts",
          },
        },
        publishGuardReport: {
          isPass: false,
          warnings: ["CTA still feels too engagement-led."],
        },
      })
    );

    expect(report.verdict).toBe("review-packaging-before-publish");
    expect(report.scores.captionUsefulness).toBeLessThan(60);
    expect(report.scores.hashtagHygiene).toBeLessThan(65);
    expect(report.publishGuardWarnings).toContain("CTA still feels too engagement-led.");
  });

  it("routes retry evidence into retry content before publish", () => {
    const report = buildFacebookPublishReadinessReport(
      makePackage(),
      makeEvidence({
        overallScore: 34,
        suggestedRecommendation: "retry",
        userRecommendation: "retry",
        notes: {
          strongPoints: "",
          driftObserved: "Shot 2 lost subject spacing.",
          failedPoints: "",
          retryPlan: "Retry the action beat before posting.",
          masterStill: "",
          runway: "",
          kling: "",
          seedance: "",
        },
      })
    );

    expect(report.verdict).toBe("retry-content-before-publish");
    expect(report.evidenceContext?.recommendationLabel).toBe("Retry");
    expect(report.summary).toMatch(/too risky to post/i);
  });

  it("blocks publish-ready verdicts when the caption loses its observational CTA", () => {
    const report = buildFacebookPublishReadinessReport(
      makePackage({
        caption: "Mountain lion pressure closes before the mule deer finds a clean turn.",
        platformPack: {
          ...buildBasePlatformPack(),
          facebook: {
            ...buildBasePlatformPack().facebook,
            caption: "Mountain lion pressure closes before the mule deer finds a clean turn.",
          },
        },
      })
    );

    expect(report.verdict).toBe("review-packaging-before-publish");
    expect(report.scores.commentDepthIntentScore).toBeLessThan(6);
    expect(report.reasons.join(" ")).toMatch(/discussion prompt/i);
  });

  it("drops monetisation safety when bait or graphic packaging appears", () => {
    const report = buildFacebookPublishReadinessReport(
      makePackage({
        caption: "Brutal death and bloodbath wording turns this into shock bait.",
        cta: "Comment YES and tag a friend.",
        platformPack: {
          ...buildBasePlatformPack(),
          facebook: {
            ...buildBasePlatformPack().facebook,
            caption: "Brutal death and bloodbath wording turns this into shock bait.",
          },
        },
        publishGuardReport: {
          isPass: false,
          warnings: ["CTA still feels too engagement-led."],
        },
      })
    );

    expect(report.verdict).toBe("retry-content-before-publish");
    expect(report.scores.monetisationSafetyScore).toBeLessThanOrEqual(3);
  });

  it("keeps owned-funnel conversion intent low when no CTA or brand path is present", () => {
    const report = buildFacebookPublishReadinessReport(
      makePackage({
        cta: "",
        altTextPrompt: "",
      })
    );

    expect(report.scores.ownedFunnelConversionIntentScore).toBeLessThan(4);
  });

});
