import { describe, expect, it } from "vitest";

import type { GeneratedPackage } from "@/types";

import {
  buildCsvGrowthDoctorSummary,
  buildGrowthDoctorActionPlan,
  findBestFollowerConversionRecord,
  findBestPerformingRecord,
  findHighestRpmRecord,
  findMostShareableRecord,
  findWorstRetentionRecord,
  formatCsvGrowthDoctorSummary,
  formatGrowthDoctorActionPlan,
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

describe("facebook insights growth doctor actions", () => {
  it("returns no actions when the growth doctor summary is empty", () => {
    const plan = buildGrowthDoctorActionPlan(buildCsvGrowthDoctorSummary([]));

    expect(plan.actionCount).toBe(0);
    expect(plan.actions).toEqual([]);
    expect(formatGrowthDoctorActionPlan(plan)).toMatch(/Action count: 0/i);
  });

  it("builds weak-first-three-seconds actions with explicit animal identity and a short Kling variant", () => {
    const summary = buildCsvGrowthDoctorSummary([
      makePerformanceRecord({
        title: "Weak opener bear",
        predator: "Brown Bear",
        prey: "Bison",
        animalPair: "Brown Bear vs Bison",
        habitat: "Snowy mountain valley",
        arc: "Giant vs giant clash",
        reach: 64000,
        views: 70000,
        threeSecondViews: 22000,
        oneMinuteViews: 3800,
        averageWatchTimeSeconds: 9,
        watchPercentage: 26,
        shares: 24,
        comments: 51,
        followsGained: 5,
        estimatedEarnings: 3,
        rpm: 1.1,
        monetizedPlays: 1900,
      }),
    ]);

    const plan = buildGrowthDoctorActionPlan(summary, {
      pkg: makePackage({
        predatorName: "Brown Bear",
        preyName: "Bison",
        environmentName: "Snowy mountain valley",
        arcName: "Giant vs giant clash",
      }),
    });

    const runwayAction = plan.actions.find(
      (action) => action.id === "weak-first-three-seconds-first-frame-rewrite"
    );
    const klingAction = plan.actions.find(
      (action) => action.id === "weak-first-three-seconds-two-second-hook"
    );

    expect(runwayAction?.variant.promptRewrite).toContain("Brown Bear (left)");
    expect(runwayAction?.variant.promptRewrite).toContain("Bison (right)");
    expect(runwayAction?.variant.promptRewrite.toLowerCase()).not.toContain("left subject");
    expect(runwayAction?.variant.promptRewrite.toLowerCase()).not.toContain("right subject");
    expect(klingAction?.variant.engineTarget).toBe("Kling");
    expect((klingAction?.variant.promptRewrite.length ?? 999)).toBeLessThan(220);
  });

  it("creates monetized-safe rewrite actions for high reach but low earnings", () => {
    const summary = buildCsvGrowthDoctorSummary([
      makePerformanceRecord({
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

    const plan = buildGrowthDoctorActionPlan(summary, { pkg: makePackage() });
    const docAction = plan.actions.find(
      (action) => action.id === "high-reach-low-earnings-documentary-rewrite"
    );
    const captionAction = plan.actions.find(
      (action) => action.id === "high-reach-low-earnings-sponsor-caption"
    );

    expect(docAction?.recommendedAction).toMatch(/documentary-safe/i);
    expect(captionAction?.variant.captionRewrite).toBeTruthy();
    expect(captionAction?.variant.captionRewrite ?? "").not.toMatch(/like if|share if|comment yes|tag a friend/i);
  });

  it("creates share-trigger and series actions when shares or follows lag behind audience quality", () => {
    const summary = buildCsvGrowthDoctorSummary([
      makePerformanceRecord({
        title: "Debate Fox",
        predator: "Wolf",
        prey: "Elk",
        animalPair: "Wolf vs Elk",
        habitat: "Winter forest edge",
        arc: "Pack hunting strategy",
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
      }),
    ]);

    const plan = buildGrowthDoctorActionPlan(summary, { pkg: makePackage() });
    const shareAction = plan.actions.find(
      (action) => action.id === "high-comments-low-shares-share-trigger"
    );
    const followAction = plan.actions.find(
      (action) => action.id === "high-retention-low-follows-series-cta"
    );

    expect(shareAction?.variant.captionRewrite).toMatch(/\?$/m);
    expect(shareAction?.variant.captionRewrite ?? "").not.toMatch(/like if|share if|comment yes|tag a friend/i);
    expect(followAction?.variant.captionRewrite).toMatch(/series/i);
  });

  it("creates controlled boost guidance for low reach and high rpm", () => {
    const summary = buildCsvGrowthDoctorSummary([
      makePerformanceRecord({
        title: "Breakout Bear",
        predator: "Brown Bear",
        prey: "Bison",
        animalPair: "Brown Bear vs Bison",
        habitat: "Snowy mountain valley",
        arc: "Giant vs giant clash",
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
    ]);

    const plan = buildGrowthDoctorActionPlan(summary, {
      pkg: makePackage(),
      adSafeConflictScore: 88,
      boostWorthyScore: 84,
    });
    const boostAction = plan.actions.find(
      (action) => action.id === "low-reach-high-rpm-boost-plan"
    );

    expect(boostAction?.recommendedAction).toMatch(/controlled boost/i);
    expect(boostAction?.variant.promptRewrite).toMatch(/AI-generated disclosure reminder/i);
  });

  it("creates winner remix pack actions and formats them for copy/export", () => {
    const summary = buildCsvGrowthDoctorSummary([
      makePerformanceRecord({
        title: "Winner Orca",
        predator: "Orca",
        prey: "Seal",
        animalPair: "Orca vs Seal",
        habitat: "Cold coastal water",
        arc: "Escape from danger",
        reach: 18000,
        views: 26000,
        threeSecondViews: 21000,
        oneMinuteViews: 7200,
        averageWatchTimeSeconds: 22,
        watchPercentage: 68,
        shares: 260,
        comments: 120,
        followsGained: 45,
        estimatedEarnings: 49,
        rpm: 7.4,
        monetizedPlays: 8800,
      }),
    ]);

    const plan = buildGrowthDoctorActionPlan(summary, {
      pkg: makePackage({ predatorName: "Orca", preyName: "Seal", environmentName: "Cold coastal water" }),
      adSafeConflictScore: 90,
      boostWorthyScore: 86,
    });
    const exportText = formatGrowthDoctorActionPlan(plan);

    expect(plan.actions.some((action) => action.title === "Winner short-cut remix")).toBe(true);
    expect(plan.actions.some((action) => action.title === "Winner 20–30s story cut")).toBe(true);
    expect(plan.actions.some((action) => action.title === "Winner series continuation")).toBe(true);
    expect(exportText).toMatch(/Action count:/i);
    expect(exportText).toMatch(/Prompt rewrite:/i);
    expect(exportText).toMatch(/Caption \/ CTA rewrite:/i);
  });

  it("falls back gracefully when package context is missing", () => {
    const summary = buildCsvGrowthDoctorSummary([
      makePerformanceRecord({
        title: "Generic imported post",
        predator: "",
        prey: "",
        animalPair: "",
        habitat: "",
        reach: 8000,
        views: 12000,
        threeSecondViews: 3200,
        oneMinuteViews: 800,
        averageWatchTimeSeconds: 6,
        watchPercentage: 18,
        shares: 8,
        comments: 12,
        followsGained: 1,
        estimatedEarnings: 1,
        rpm: 1.2,
        monetizedPlays: 1400,
      }),
    ]);

    const plan = buildGrowthDoctorActionPlan(summary);

    expect(plan.actionCount).toBeGreaterThan(0);
    expect(plan.actions[0]?.variant.promptRewrite.length).toBeGreaterThan(0);
  });
});
