import { describe, expect, it } from "vitest";

import { buildUSViewsModeReport } from "@/lib/usViewsMode";

describe("US Views Mode wording", () => {
  it("keeps weak-setup recovery guidance specific and Facebook-first", () => {
    const report = buildUSViewsModeReport({
      durationLane: "long",
      contentLane: "Pack Hunt",
      concept: {
        predator: "Gray Wolf",
        prey: "Bull Elk",
        environment: "generic field edge",
        arc: "Pack hunting strategy",
        contentLane: "Pack Hunt",
      },
      openingFrame: {
        fullBodyReadable: false,
        threatReadable: false,
        subjectSeparation: false,
        environmentClear: false,
        emotionalReadImmediate: false,
      },
      caption: "This shocking wildlife moment is insane.",
      hashtags: ["#wildlife", "#usa", "#wolf", "#elk"],
      originalityConfirmed: false,
      hookText: "You won't believe this wolf moment.",
      ctaText: "Comment who wins.",
      audienceScore: {
        total: 52,
        speciesScore: 18,
        environmentScore: 18,
        arcScore: 16,
        summary:
          "Weak U.S. appeal; consider more iconic North American wildlife or setting.",
      },
      openingFrameScore: {
        total: 40,
        summary: "Weak opening frame.",
      },
      publishGuardReport: {
        isPass: false,
        pass: false,
        warnings: ["warning"],
        blockers: ["blocker"],
        fixes: ["Lead with species, timing, or behavior instead of hype."],
        summary: "Packaging needs cleanup before a Facebook-safe publish test.",
      },
      performanceSnapshot: {
        durationLane: "long",
        hookFamily: "danger",
        sampleSize: 12,
        averageWatchTimeSeconds: 30,
        completionRate: 0.5,
        shareRate: 0.02,
        summary: "Long-lane benchmark is soft.",
      },
    });

    const joined = `${report.summary} ${report.nextActions.join(" ")}`.toLowerCase();

    expect(joined).toMatch(/facebook-safe publish test/);
    expect(joined).toMatch(/frame 1/);
    expect(joined).toMatch(/species/);
    expect(joined).toMatch(/short lane/);
    expect(joined).not.toMatch(/balanced first-frame clarity|context fit/);
  });

  it("keeps strong setup summaries clean when the package is ready", () => {
    const report = buildUSViewsModeReport({
      durationLane: "short",
      contentLane: "Escape",
      concept: {
        predator: "Mountain Lion",
        prey: "White-tailed Deer",
        environment: "Rocky Mountain meadow",
        arc: "Escape from danger",
        contentLane: "Escape",
      },
      openingFrame: {
        fullBodyReadable: true,
        threatReadable: true,
        subjectSeparation: true,
        environmentClear: true,
        emotionalReadImmediate: true,
      },
      caption: "The deer spotted the danger late, and the mountain lion had already closed the angle.",
      hashtags: ["#wildlife", "#usa", "#mountainlion", "#whitetaileddeer", "#survival"],
      originalityConfirmed: true,
      hookText: "The mountain lion moved before the deer found a clean turn.",
      ctaText: "Would you have spotted the danger in time?",
      audienceScore: {
        total: 86,
        speciesScore: 35,
        environmentScore: 26,
        arcScore: 21,
        summary: "Strong U.S. appeal with iconic wildlife and setting.",
      },
      openingFrameScore: {
        total: 100,
        summary: "Strong first-frame stop power.",
      },
      publishGuardReport: {
        isPass: true,
        pass: true,
        warnings: [],
        blockers: [],
        fixes: [],
        summary: "Packaging is clean, documentary, and within the default Facebook-safe publish guard.",
      },
      performanceSnapshot: {
        durationLane: "short",
        hookFamily: "danger",
        sampleSize: 24,
        averageWatchTimeSeconds: 22,
        completionRate: 0.77,
        shareRate: 0.05,
        summary: "Short-lane benchmark is healthy.",
      },
    });

    expect(report.shouldPublish).toBe(true);
    expect(report.summary.toLowerCase()).toContain("facebook-safe publish guard");
    expect(report.nextActions).toHaveLength(0);
  });
});
