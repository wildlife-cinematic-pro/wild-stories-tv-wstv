import { describe, expect, it } from "vitest";

import { buildPerformanceWonLostSummary } from "@/lib/performance-diagnosis";
import { buildBlankPerformanceTrackerEntry } from "@/lib/performance-tracker";

describe("performance panel viral diagnosis", () => {
  it("builds a winning diagnosis from hook, thumbnail, retention, engagement, and earnings", () => {
    const entry = buildBlankPerformanceTrackerEntry({
      firstSecondHookScore: 88,
      thumbnailQualityScore: 84,
      views: 10000,
      watchPercentage: 58,
      shares: 220,
      comments: 80,
      reactions: 900,
      rpm: 5.4,
    });

    expect(
      buildPerformanceWonLostSummary(entry, { actualPerformanceTier: "No live data" })
    ).toMatch(/Likely won because of a strong first-second hook/i);
  });

  it("builds a losing diagnosis from weak hook, cover, retention, and engagement", () => {
    const entry = buildBlankPerformanceTrackerEntry({
      firstSecondHookScore: 42,
      thumbnailQualityScore: 50,
      views: 10000,
      watchPercentage: 24,
      shares: 5,
      comments: 4,
      reactions: 10,
    });

    expect(
      buildPerformanceWonLostSummary(entry, { actualPerformanceTier: "No live data" })
    ).toMatch(/Likely lost because the first second did not stop the scroll/i);
  });

  it("falls back to a data-entry prompt when no viral fields are available", () => {
    const entry = buildBlankPerformanceTrackerEntry();

    expect(
      buildPerformanceWonLostSummary(entry, { actualPerformanceTier: "No live data" })
    ).toMatch(/Add hook, thumbnail, retention, and engagement data/i);
  });
});
