import { describe, expect, it } from "vitest";

import type { GeneratedPackage } from "@/types";

import {
  buildCsvGrowthDoctorSummary,
  findBestFollowerConversionRecord,
  findBestPerformingRecord,
  findHighestRpmRecord,
  findMostShareableRecord,
  findWorstRetentionRecord,
  formatCsvGrowthDoctorSummary,
  importFacebookInsightsCsv,
  isFacebookInsightsCsvFile,
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


function makePerformanceRecord(
  overrides: Partial<ReturnType<typeof buildBlankPerformanceTrackerEntry>> = {}
) {
  return buildBlankPerformanceTrackerEntry({
    source: "facebook_csv",
    generationId: "generation_default",
    title: "Imported wildlife post",
    conceptLabel: "Mountain Lion vs Mule Deer • Escape from danger",
    publishedAt: "2026-04-27 08:30 EST",
    predator: "Mountain Lion",
    prey: "Mule Deer",
    animalPair: "Mountain Lion vs Mule Deer",
    habitat: "Dry meadow edge",
    arc: "Escape from danger",
    durationLane: "short",
    hookFamily: "danger",
    contentLane: "Escape",
    reach: 25000,
    views: 30000,
    threeSecondViews: 22000,
    oneMinuteViews: 6000,
    averageWatchTimeSeconds: 15,
    watchPercentage: 52,
    shares: 80,
    comments: 60,
    reactions: 900,
    followsGained: 15,
    profileVisits: 75,
    linkClicks: 10,
    estimatedEarnings: 12,
    rpm: 3.1,
    monetizedPlays: 9000,
    notes: "Imported from Facebook Insights.",
    ...overrides,
  });
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


describe("facebook insights growth doctor", () => {
  it("accepts csv uploads by extension or csv mime type and rejects non-csv files", () => {
    expect(isFacebookInsightsCsvFile({ name: "insights.csv", type: "text/plain" })).toBe(true);
    expect(isFacebookInsightsCsvFile({ name: "insights-export", type: "text/csv" })).toBe(true);
    expect(isFacebookInsightsCsvFile({ name: "insights.txt", type: "text/plain" })).toBe(false);
  });

  it("returns an empty Growth Doctor summary when no imported records exist", () => {
    const summary = buildCsvGrowthDoctorSummary([]);

    expect(summary.importedRecordCount).toBe(0);
    expect(summary.findings).toEqual([]);
    expect(formatCsvGrowthDoctorSummary(summary)).toMatch(/Imported records: 0/i);
  });

  it("finds the strongest and weakest imported performers across multiple records", () => {
    const breakout = makePerformanceRecord({
      generationId: "generation_breakout",
      title: "Breakout Bear",
      reach: 8000,
      views: 12000,
      threeSecondViews: 9800,
      oneMinuteViews: 3100,
      averageWatchTimeSeconds: 21,
      watchPercentage: 64,
      shares: 220,
      comments: 90,
      followsGained: 6,
      profileVisits: 34,
      linkClicks: 4,
      estimatedEarnings: 44,
      rpm: 6.8,
      monetizedPlays: 6200,
    });
    const weakReachRevenue = makePerformanceRecord({
      generationId: "generation_reach",
      title: "Reach Heavy Deer",
      reach: 155000,
      views: 160000,
      threeSecondViews: 50000,
      oneMinuteViews: 4500,
      averageWatchTimeSeconds: 8,
      watchPercentage: 24,
      shares: 26,
      comments: 55,
      followsGained: 6,
      estimatedEarnings: 2,
      rpm: 0.7,
      monetizedPlays: 1300,
    });
    const commentsNoShares = makePerformanceRecord({
      generationId: "generation_comments",
      title: "Debate Fox",
      reach: 42000,
      views: 47000,
      threeSecondViews: 32000,
      oneMinuteViews: 9800,
      averageWatchTimeSeconds: 18,
      watchPercentage: 57,
      shares: 14,
      comments: 220,
      followsGained: 2,
      estimatedEarnings: 13,
      rpm: 3.4,
      monetizedPlays: 9800,
    });
    const followerLeader = makePerformanceRecord({
      generationId: "generation_follows",
      title: "Follower Orca",
      reach: 12000,
      views: 18000,
      threeSecondViews: 14000,
      oneMinuteViews: 5200,
      averageWatchTimeSeconds: 17,
      watchPercentage: 53,
      shares: 70,
      comments: 85,
      followsGained: 72,
      profileVisits: 260,
      linkClicks: 28,
      estimatedEarnings: 21,
      rpm: 4.2,
      monetizedPlays: 12000,
    });

    const records = [breakout, weakReachRevenue, commentsNoShares, followerLeader];
    const summary = buildCsvGrowthDoctorSummary(records);

    expect(findBestPerformingRecord(records)?.title).toBe("Breakout Bear");
    expect(findWorstRetentionRecord(records)?.title).toBe("Reach Heavy Deer");
    expect(findHighestRpmRecord(records)?.title).toBe("Breakout Bear");
    expect(findMostShareableRecord(records)?.title).toBe("Breakout Bear");
    expect(findBestFollowerConversionRecord(records)?.title).toBe("Follower Orca");

    expect(summary.bestPerformingPost?.record?.title).toBe("Breakout Bear");
    expect(summary.highestRpmPost?.record?.title).toBe("Breakout Bear");
    expect(summary.highReachLowEarningsIssue?.record?.title).toBe("Reach Heavy Deer");
    expect(summary.highCommentsLowSharesIssue?.record?.title).toBe("Debate Fox");
    expect(summary.highRetentionLowFollowersIssue?.record?.title).toBe("Debate Fox");
    expect(summary.lowReachHighRpmCandidate?.record?.title).toBe("Breakout Bear");
    expect(summary.weakFirstThreeSecondsIssue?.record?.title).toBe("Reach Heavy Deer");
    expect(summary.boostCandidates.length).toBeGreaterThan(0);
    expect(summary.rewriteRecommendations).toContain(
      "Rewrite packaging toward a monetized-safe documentary angle."
    );
    expect(summary.rewriteRecommendations).toContain("Add a stronger share-trigger rewrite.");
    expect(summary.rewriteRecommendations).toContain(
      "Rewrite first frame and first 2-second motion hook."
    );
  });

  it("formats a copyable Growth Doctor summary with top wins and issues", () => {
    const summary = buildCsvGrowthDoctorSummary([
      makePerformanceRecord({
        generationId: "generation_breakout",
        title: "Breakout Bear",
        reach: 8000,
        views: 12000,
        threeSecondViews: 9800,
        oneMinuteViews: 3100,
        averageWatchTimeSeconds: 21,
        watchPercentage: 64,
        shares: 220,
        comments: 90,
        followsGained: 28,
        estimatedEarnings: 44,
        rpm: 6.8,
        monetizedPlays: 6200,
      }),
      makePerformanceRecord({
        generationId: "generation_reach",
        title: "Reach Heavy Deer",
        reach: 155000,
        views: 160000,
        threeSecondViews: 50000,
        oneMinuteViews: 4500,
        averageWatchTimeSeconds: 8,
        watchPercentage: 24,
        shares: 26,
        comments: 55,
        followsGained: 6,
        estimatedEarnings: 2,
        rpm: 0.7,
        monetizedPlays: 1300,
      }),
    ]);

    const exportText = formatCsvGrowthDoctorSummary(summary);

    expect(exportText).toMatch(/CSV Growth Doctor/i);
    expect(exportText).toMatch(/Imported records: 2/i);
    expect(exportText).toMatch(/Best performer: Breakout Bear/i);
    expect(exportText).toMatch(/Highest RPM: Breakout Bear/i);
    expect(exportText).toMatch(/Biggest issue:/i);
    expect(exportText).toMatch(/Boost candidates:/i);
    expect(exportText).toMatch(/Rewrite recommendations:/i);
  });
});
