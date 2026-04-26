import { describe, expect, it } from "vitest";

import type { GeneratedPackage, PerformanceTrackerEntry } from "@/types";

import { buildMonetizedFacebookReport } from "@/lib/facebook-monetization-engine";

function buildBasePlatformPack() {
  return {
    facebook: {
      hook: "Mountain lion pressure closes before the mule deer clears the break.",
      caption:
        "Mountain lion pressure closes before the mule deer finds a clean turn.\n\nWhat changed the outcome first?",
      hashtags:
        "#MountainLion #MuleDeer #WildlifeReel #PredatorPrey #NatureShorts",
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
      publishReminders: [
        "⚠️ Reminder: Label this content as AI-generated before publishing to comply with Meta policy and SynthID detection.",
      ],
    },
    instagram: {
      hook: "Mountain lion pressure closes before the mule deer clears the break.",
      caption:
        "Mountain lion pressure closes before the mule deer finds a clean turn.\n\nWhat changed the outcome first?",
      hashtags:
        "#MountainLion #MuleDeer #WildlifeReel #PredatorPrey #NatureShorts",
      bestTime: "7:30 PM EST",
    },
    tiktok: {
      hook: "Mountain lion pressure closes before the mule deer clears the break.",
      caption: "Mountain lion pressure closes before the mule deer finds a clean turn.",
      hashtags:
        "#MountainLion #MuleDeer #WildlifeReel #PredatorPrey #NatureShorts",
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
    imagePrompt:
      "Mountain lion and mule deer hold one readable opening frame in a dry meadow edge.",
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
    caption:
      "Mountain lion pressure closes before the mule deer finds a clean turn.\n\nWhat changed the outcome first?",
    caption2026:
      "Mountain lion pressure closes before the mule deer finds a clean turn.\n\nWhat changed the outcome first?",
    cta: "What changed the outcome first?",
    altTextPrompt:
      "AI-generated cinematic wildlife scene showing Mountain Lion and Mule Deer during an Escape from danger sequence. Wild Stories TV original content.",
    hashtags:
      "#MountainLion #MuleDeer #WildlifeReel #PredatorPrey #NatureShorts",
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
    durationLane: "short",
    hookFamily: "danger",
    ...overrides,
  };
}

function makePerformance(
  overrides: Partial<PerformanceTrackerEntry> = {}
): PerformanceTrackerEntry {
  return {
    generationId: "generation_1",
    postUrl: "https://facebook.com/post/1",
    title: "Mountain lion pressure closes fast",
    conceptLabel: "Mountain Lion vs Mule Deer • Escape from danger",
    publishedAt: "2026-04-27 08:30 EST",
    postedAtJST: "",
    postedAtEST: "",
    animalPair: "Mountain Lion vs Mule Deer",
    predator: "Mountain Lion",
    prey: "Mule Deer",
    habitat: "Dry meadow edge",
    arc: "Escape from danger",
    durationLane: "short",
    hookFamily: "danger",
    contentLane: "Escape",
    reach: 120000,
    firstHourViews: 18000,
    threeSecondViews: 62000,
    threeSecondHoldRate: 52,
    oneMinuteViews: 14000,
    averageWatchTimeSeconds: 19,
    watchPercentage: 58,
    completionRate: 44,
    shares: 260,
    comments: 170,
    reactions: 3200,
    followsGained: 95,
    profileVisits: 410,
    linkClicks: 22,
    usaFollowerPercent: 78,
    earningsUsd: 31,
    estimatedEarnings: 31,
    rpm: 5.8,
    monetizedPlays: 21000,
    notes: "Strong repeat-viewer and earnings signal.",
    ...overrides,
  };
}

describe("facebook monetization engine", () => {
  it("marks a strong, safe, high-retention package as a monetized winner", () => {
    const report = buildMonetizedFacebookReport(makePackage(), makePerformance());

    expect(report.verdict).toBe("Monetized Winner");
    expect(report.boostRecommendation.label).toBe("Boost this post");
    expect(report.scores.revenuePotentialScore).toBeGreaterThanOrEqual(80);
    expect(report.scores.boostWorthyScore).toBeGreaterThanOrEqual(80);
    expect(report.actualPerformanceTier).toMatch(/Strong|Breakout/);
  });

  it("blocks boosting when no live Facebook data exists yet", () => {
    const report = buildMonetizedFacebookReport(makePackage());

    expect(report.actualPerformanceTier).toBe("No live data yet");
    expect(report.boostRecommendation.label).toBe("Do not boost yet");
    expect(report.boostRecommendation.reason).toMatch(/Wait for live Facebook retention/i);
  });

  it("flags viral packaging as risky when engagement pull is strong but safety is softer", () => {
    const report = buildMonetizedFacebookReport(
      makePackage({
        publishGuardReport: {
          isPass: false,
          warnings: ["Hook feels too hot for a clean monetized post."],
        },
        usViewsModeReport: {
          ...makePackage().usViewsModeReport!,
          publishGuard: {
            isPass: false,
            warnings: ["Hook feels too hot for a clean monetized post."],
          },
        },
      })
    );

    expect(report.verdict).toBe("Viral But Risky");
    expect(report.summary).toMatch(/viral pull is strong/i);
  });

  it("routes graphic or bait-led packaging away from boosting", () => {
    const report = buildMonetizedFacebookReport(
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
          warnings: ["Packaging is too graphic for monetized distribution."],
        },
      })
    );

    expect(report.verdict).toBe("Do Not Boost");
    expect(report.boostRecommendation.label).toBe("Do not boost yet");
    expect(report.summary).toMatch(/Do not boost this package yet/i);
  });

  it("keeps moderate but safe packages in the safe growth lane", () => {
    const report = buildMonetizedFacebookReport(
      makePackage({
        hook: "Mountain lion tracks the mule deer along a dry meadow edge.",
        caption:
          "Mountain lion tracks the mule deer along a dry meadow edge.\n\nWhat did you notice first?",
        caption2026:
          "Mountain lion tracks the mule deer along a dry meadow edge.\n\nWhat did you notice first?",
        platformPack: {
          ...buildBasePlatformPack(),
          facebook: {
            ...buildBasePlatformPack().facebook,
            hook: "Mountain lion tracks the mule deer along a dry meadow edge.",
            caption:
              "Mountain lion tracks the mule deer along a dry meadow edge.\n\nWhat did you notice first?",
          },
        },
        hookFamily: "curiosity",
      })
    );

    expect(report.verdict).toBe("Safe Growth Candidate");
    expect(report.boostRecommendation.label).toBe("Do not boost yet");
  });
});
