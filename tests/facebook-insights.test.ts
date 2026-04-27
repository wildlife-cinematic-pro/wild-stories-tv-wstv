import { describe, expect, it } from "vitest";

import type { GeneratedPackage } from "@/types";

import {
  importFacebookInsightsCsv,
  matchFacebookInsightsRecord,
} from "@/lib/facebook-insights";
import { buildBlankPerformanceTrackerEntry } from "@/lib/performance-tracker";

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
    caption: "Mountain lion pressure closes before the mule deer finds a clean turn.",
    caption2026: "Mountain lion pressure closes before the mule deer finds a clean turn.",
    cta: "What changed the outcome first?",
    hashtags: "#MountainLion #MuleDeer",
    tenIdeas: [],
    shotPlan: [],
    runwayBundle: "Runway bundle",
    klingBundle: "Kling bundle",
    routingNote: "Default route.",
    durationLane: "short",
    hookFamily: "danger",
    ...overrides,
  };
}

describe("facebook insights import", () => {
  it("parses common Facebook Insights aliases into normalized records", () => {
    const csv = [
      "generation_id,permalink,description,created_time,people_reached,3-second video views,1-minute video views,average watch time,average percentage watched,shares,comments,new_followers,profile_visits,link_clicks,estimated earnings,revenue per 1000 plays,monetized plays,notes",
      'generation_1,https://facebook.com/post/1,"Mountain lion pressure closes fast",2026-04-27 08:30 EST,120000,62000,14000,01:12,58,260,170,95,410,22,31,5.8,21000,"Strong repeat-viewer and earnings signal."',
    ].join("\n");

    const result = importFacebookInsightsCsv(csv);

    expect(result.warnings).toEqual([]);
    expect(result.records).toHaveLength(1);
    expect(result.records[0]).toMatchObject({
      source: "facebook_csv",
      generationId: "generation_1",
      postUrl: "https://facebook.com/post/1",
      title: "Mountain lion pressure closes fast",
      reach: 120000,
      threeSecondViews: 62000,
      oneMinuteViews: 14000,
      averageWatchTimeSeconds: 72,
      watchPercentage: 58,
      shares: 260,
      comments: 170,
      followsGained: 95,
      profileVisits: 410,
      linkClicks: 22,
      estimatedEarnings: 31,
      rpm: 5.8,
      monetizedPlays: 21000,
      notes: "Strong repeat-viewer and earnings signal.",
    });
  });

  it("returns warnings for malformed numeric fields and missing identifiers", () => {
    const csv = [
      "title,reach,shares,unknown_col",
      ",oops,not-a-number,ignored",
    ].join("\n");

    const result = importFacebookInsightsCsv(csv);

    expect(result.records).toHaveLength(1);
    expect(result.warnings.join(" ")).toMatch(/missing identifier fields/i);
    expect(result.warnings.join(" ")).toMatch(/could not parse numeric field/i);
    expect(result.records[0].reach).toBe("");
    expect(result.records[0].shares).toBe("");
  });

  it("matches imported rows by generation id first and falls back to title or concept label", () => {
    const generationMatch = buildBlankPerformanceTrackerEntry({
      source: "facebook_csv",
      generationId: "generation_123",
      title: "Mountain lion pressure closes before the mule deer clears the break.",
      conceptLabel: "Mountain Lion vs Mule Deer • Escape from danger",
    });
    const titleMatch = buildBlankPerformanceTrackerEntry({
      source: "facebook_csv",
      title: "Mountain lion pressure closes before the mule deer clears the break.",
      conceptLabel: "Other title",
    });
    const conceptMatch = buildBlankPerformanceTrackerEntry({
      source: "facebook_csv",
      title: "Different title",
      conceptLabel: "Mountain Lion vs Mule Deer • Escape from danger",
    });

    const pkg = makePackage();

    expect(matchFacebookInsightsRecord([generationMatch], pkg, "generation_123").matchedBy).toBe(
      "generationId"
    );
    expect(matchFacebookInsightsRecord([titleMatch], pkg, "generation_missing").matchedBy).toBe(
      "title"
    );
    expect(matchFacebookInsightsRecord([conceptMatch], pkg, "generation_missing").matchedBy).toBe(
      "conceptLabel"
    );
  });

  it("keeps unmatched imported records separate when no safe match exists", () => {
    const unmatched = buildBlankPerformanceTrackerEntry({
      source: "facebook_csv",
      title: "Completely different concept",
      conceptLabel: "Other animal pair",
    });

    const result = matchFacebookInsightsRecord([unmatched], makePackage(), "generation_missing");

    expect(result.record).toBeNull();
    expect(result.matchedBy).toBe("unmatched");
    expect(result.unmatchedCount).toBe(1);
  });
});
