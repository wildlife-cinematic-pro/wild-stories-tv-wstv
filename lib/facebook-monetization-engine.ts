import type {
  ActualFacebookPerformanceBand,
  ActualFacebookPerformanceScores,
  GeneratedPackage,
  MonetizedFacebookBoostRecommendation,
  MonetizedFacebookPerformanceTier,
  MonetizedFacebookPromptRecommendation,
  MonetizedFacebookReport,
  MonetizedFacebookScores,
  MonetizedFacebookVerdict,
  PerformanceTrackerEntry,
  PredictedVsActualMetricComparison,
  PredictedVsActualStatus,
  WinnerRemixRecommendation,
} from "@/types";

import { buildFacebookPublishReadinessReport } from "@/lib/facebook-publish-readiness";
import {
  hasBaitLikeCopy,
  hasForcedEngagementCopy,
  validateCaptionCTA,
} from "@/lib/platform-packs";

const GRAPHIC_PACKAGING_PATTERN =
  /\b(gore|bloody|ripped apart|torn open|kill shot|brutal death|bloodbath|massacre|guts|decapitated)\b/i;
const FACEBOOK_AI_REMINDER =
  "⚠️ Reminder: Label this content as AI-generated before publishing to comply with Meta policy and SynthID detection.";

/** Clamps a monetization score into the 0-100 range. */
function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

/** Reads a numeric metric from the local performance record or returns null when it is missing. */
function readMetric(value: number | "" | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Averages only the numeric values present in a list and falls back when none exist. */
function averagePresent(values: Array<number | null | undefined>, fallback = 0): number {
  const usable = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (usable.length === 0) return fallback;
  return clampScore(usable.reduce((sum, value) => sum + value, 0) / usable.length);
}

/** Converts thresholded metrics into a 0-100 score. */
function scoreFromThresholds(value: number | null, tiers: Array<[number, number]>): number {
  if (value === null) return 0;
  for (const [threshold, score] of tiers) {
    if (value >= threshold) {
      return score;
    }
  }
  return 0;
}

/** Safely divides one metric by another, returning null when the denominator is missing or invalid. */
function safeRate(numerator: number | null, denominator: number | null): number | null {
  if (numerator === null || denominator === null || denominator <= 0) {
    return null;
  }
  return numerator / denominator;
}

/** Returns the Facebook-facing hook for the current package. */
function getFacebookHook(pkg: GeneratedPackage): string {
  return pkg.platformPack?.facebook.hook ?? pkg.hook;
}

/** Returns the Facebook-facing caption for the current package. */
function getFacebookCaption(pkg: GeneratedPackage): string {
  return pkg.platformPack?.facebook.caption ?? pkg.caption;
}

/** Returns true when the package already has any meaningful live Facebook performance data. */
function hasLivePerformanceData(entry?: PerformanceTrackerEntry | null): boolean {
  if (!entry) return false;
  return [
    entry.reach,
    entry.views,
    entry.threeSecondViews,
    entry.oneMinuteViews,
    entry.averageWatchTimeSeconds,
    entry.watchPercentage,
    entry.shares,
    entry.comments,
    entry.followsGained,
    entry.estimatedEarnings,
    entry.earningsUsd,
    entry.rpm,
    entry.monetizedPlays,
  ].some((value) => readMetric(value) !== null);
}

/** Calculates the deep-retention rate from one-minute views versus three-second views when both exist. */
function getOneMinuteRate(entry?: PerformanceTrackerEntry | null): number | null {
  if (!entry) return null;
  return safeRate(readMetric(entry.oneMinuteViews), readMetric(entry.threeSecondViews));
}

/** Calculates the share rate from shares versus reach when both exist. */
function getShareRate(entry?: PerformanceTrackerEntry | null): number | null {
  if (!entry) return null;
  return safeRate(readMetric(entry.shares), readMetric(entry.reach));
}

/** Calculates the comment rate from comments versus reach when both exist. */
function getCommentRate(entry?: PerformanceTrackerEntry | null): number | null {
  if (!entry) return null;
  return safeRate(readMetric(entry.comments), readMetric(entry.reach));
}

/** Calculates the follow rate from follows gained versus reach when both exist. */
function getFollowRate(entry?: PerformanceTrackerEntry | null): number | null {
  if (!entry) return null;
  return safeRate(readMetric(entry.followsGained), readMetric(entry.reach));
}

/** Calculates the link-click rate from clicks versus reach when both exist. */
function getLinkClickRate(entry?: PerformanceTrackerEntry | null): number | null {
  if (!entry) return null;
  return safeRate(readMetric(entry.linkClicks), readMetric(entry.reach));
}

/** Calculates the reaction rate from reactions versus reach when both exist. */
function getReactionRate(entry?: PerformanceTrackerEntry | null): number | null {
  if (!entry) return null;
  return safeRate(readMetric(entry.reactions), readMetric(entry.reach));
}

/** Detects bait-like or graphic packaging risk inside the current Facebook copy. */
function hasRiskyPackaging(pkg: GeneratedPackage): boolean {
  const combined = `${getFacebookHook(pkg)} ${getFacebookCaption(pkg)} ${pkg.cta ?? ""}`.trim();
  return (
    hasBaitLikeCopy(combined) ||
    hasForcedEngagementCopy(combined) ||
    GRAPHIC_PACKAGING_PATTERN.test(combined)
  );
}

/** Scores how much revenue potential the package has once safety, intent, and any live earnings data are combined. */
function scoreRevenuePotential(
  pkg: GeneratedPackage,
  performance: PerformanceTrackerEntry | undefined,
  readiness: ReturnType<typeof buildFacebookPublishReadinessReport>
): number {
  const watchPercentage = readMetric(performance?.watchPercentage);
  const averageWatchTimeSeconds = readMetric(performance?.averageWatchTimeSeconds);
  const rpm = readMetric(performance?.rpm);
  const estimatedEarnings = readMetric(performance?.estimatedEarnings) ?? readMetric(performance?.earningsUsd);

  let score =
    25 +
    readiness.scores.monetisationSafetyScore * 3 +
    readiness.scores.shareIntentScore * 2 +
    readiness.scores.commentDepthIntentScore * 1.5 +
    readiness.scores.ownedFunnelConversionIntentScore * 1.5;

  score += watchPercentage !== null ? (watchPercentage >= 55 ? 10 : watchPercentage >= 40 ? 6 : 2) : 0;
  score +=
    averageWatchTimeSeconds !== null
      ? averageWatchTimeSeconds >= 18
        ? 8
        : averageWatchTimeSeconds >= 12
          ? 5
          : 2
      : 0;
  score += rpm !== null ? (rpm >= 8 ? 10 : rpm >= 4 ? 6 : rpm >= 2 ? 3 : 0) : 0;
  score +=
    estimatedEarnings !== null
      ? estimatedEarnings >= 50
        ? 7
        : estimatedEarnings >= 15
          ? 4
          : estimatedEarnings > 0
            ? 2
            : 0
      : 0;

  if (hasRiskyPackaging(pkg)) {
    score -= 20;
  }

  return clampScore(score);
}

/** Scores how ad-safe the package looks for monetized Facebook distribution and potential sponsor scrutiny. */
function scoreAdSafeConflict(
  pkg: GeneratedPackage,
  readiness: ReturnType<typeof buildFacebookPublishReadinessReport>
): number {
  let score =
    30 +
    readiness.scores.monetisationSafetyScore * 5 +
    readiness.scores.originalityConfidence * 0.2 +
    (readiness.publishGuardPass === true ? 10 : readiness.publishGuardPass === false ? -15 : 0) +
    (validateCaptionCTA(getFacebookCaption(pkg)) ? 5 : -5);

  score -= Math.min(15, readiness.publishGuardWarnings.length * 5);

  if (hasRiskyPackaging(pkg)) {
    score -= 25;
  }

  return clampScore(score);
}

/** Scores how comfortable the package looks for sponsor-safe usage while staying documentary and non-bait. */
function scoreSponsorFit(
  pkg: GeneratedPackage,
  readiness: ReturnType<typeof buildFacebookPublishReadinessReport>
): number {
  let score =
    28 +
    readiness.scores.monetisationSafetyScore * 4 +
    readiness.scores.commentDepthIntentScore * 2 +
    readiness.scores.captionUsefulness * 0.18 +
    readiness.scores.hookOverlayClarity * 0.1;

  if (hasRiskyPackaging(pkg)) {
    score -= 20;
  }

  return clampScore(score);
}

/** Scores the likelihood that the package will create repeat viewing once live retention metrics are considered. */
function scoreRepeatViewer(
  performance: PerformanceTrackerEntry | undefined,
  readiness: ReturnType<typeof buildFacebookPublishReadinessReport>
): number {
  const watchPercentage = readMetric(performance?.watchPercentage);
  const averageWatchTimeSeconds = readMetric(performance?.averageWatchTimeSeconds);
  const oneMinuteRate = getOneMinuteRate(performance);
  const shareRate = getShareRate(performance);

  let score =
    20 +
    readiness.scores.shareIntentScore * 3 +
    readiness.scores.commentDepthIntentScore * 2 +
    readiness.scores.firstFrameHookReadability * 0.15;

  score += watchPercentage !== null ? (watchPercentage >= 55 ? 15 : watchPercentage >= 40 ? 9 : 3) : 0;
  score +=
    averageWatchTimeSeconds !== null
      ? averageWatchTimeSeconds >= 18
        ? 10
        : averageWatchTimeSeconds >= 12
          ? 6
          : 2
      : 0;
  score +=
    oneMinuteRate !== null
      ? oneMinuteRate >= 0.18
        ? 10
        : oneMinuteRate >= 0.08
          ? 6
          : 2
      : 0;
  score += shareRate !== null ? (shareRate >= 0.015 ? 5 : shareRate >= 0.005 ? 3 : 0) : 0;

  return clampScore(score);
}

/** Scores how well the package can convert viewers into followers, profile visits, or owned actions. */
function scoreFollowerConversion(
  performance: PerformanceTrackerEntry | undefined,
  readiness: ReturnType<typeof buildFacebookPublishReadinessReport>
): number {
  const followsGained = readMetric(performance?.followsGained);
  const profileVisits = readMetric(performance?.profileVisits);
  const linkClicks = readMetric(performance?.linkClicks);

  let score =
    10 +
    readiness.scores.ownedFunnelConversionIntentScore * 5 +
    readiness.scores.commentDepthIntentScore * 2;

  score += followsGained !== null ? (followsGained >= 20 ? 12 : followsGained >= 5 ? 7 : 3) : 0;
  score += profileVisits !== null ? (profileVisits >= 50 ? 8 : profileVisits >= 10 ? 5 : 2) : 0;
  score += linkClicks !== null ? (linkClicks >= 15 ? 8 : linkClicks >= 5 ? 4 : 1) : 0;

  return clampScore(score);
}

/** Scores whether the post is worth boosting after safety, repeat-viewer, and monetization factors are combined. */
function scoreBoostWorthy(
  performance: PerformanceTrackerEntry | undefined,
  readiness: ReturnType<typeof buildFacebookPublishReadinessReport>,
  revenuePotentialScore: number,
  adSafeConflictScore: number,
  sponsorFitScore: number,
  repeatViewerScore: number,
  followerConversionScore: number
): number {
  let score = clampScore(
    revenuePotentialScore * 0.25 +
      adSafeConflictScore * 0.25 +
      sponsorFitScore * 0.15 +
      repeatViewerScore * 0.2 +
      followerConversionScore * 0.15
  );

  if (!hasLivePerformanceData(performance)) {
    score = Math.min(score, 69);
  }

  if (readiness.scores.monetisationSafetyScore < 7) {
    score = Math.min(score, 49);
  }

  return clampScore(score);
}

/** Scores revenue performance from actual live RPM, earnings, and monetized-play data. */
function scoreActualRevenue(entry?: PerformanceTrackerEntry): number {
  const rpm = readMetric(entry?.rpm);
  const earnings = readMetric(entry?.estimatedEarnings) ?? readMetric(entry?.earningsUsd);
  const monetizedPlays = readMetric(entry?.monetizedPlays);
  const views = readMetric(entry?.views) ?? readMetric(entry?.threeSecondViews);
  const monetizedPlayRate = safeRate(monetizedPlays, views);

  return averagePresent([
    scoreFromThresholds(rpm, [
      [8, 96],
      [6, 86],
      [4, 74],
      [2, 58],
      [0.01, 42],
    ]),
    scoreFromThresholds(earnings, [
      [100, 94],
      [40, 82],
      [15, 70],
      [5, 54],
      [0.01, 38],
    ]),
    scoreFromThresholds(monetizedPlayRate, [
      [0.4, 90],
      [0.25, 76],
      [0.12, 62],
      [0.05, 48],
      [0.01, 34],
    ]),
  ]);
}

/** Scores actual engagement strength from shares, comments, and reactions relative to reach. */
function scoreActualEngagement(entry?: PerformanceTrackerEntry): number {
  const shares = readMetric(entry?.shares);
  const comments = readMetric(entry?.comments);
  const reactions = readMetric(entry?.reactions);
  const shareRate = getShareRate(entry);
  const commentRate = getCommentRate(entry);
  const reactionRate = getReactionRate(entry);

  return averagePresent([
    shareRate !== null
      ? scoreFromThresholds(shareRate, [
          [0.003, 95],
          [0.0015, 82],
          [0.0008, 66],
          [0.0003, 48],
          [0.0001, 32],
        ])
      : scoreFromThresholds(shares, [
          [250, 88],
          [120, 74],
          [40, 58],
          [10, 42],
          [1, 28],
        ]),
    commentRate !== null
      ? scoreFromThresholds(commentRate, [
          [0.0025, 92],
          [0.001, 78],
          [0.0005, 62],
          [0.0002, 45],
          [0.00005, 28],
        ])
      : scoreFromThresholds(comments, [
          [180, 90],
          [80, 74],
          [25, 58],
          [8, 42],
          [1, 28],
        ]),
    reactionRate !== null
      ? scoreFromThresholds(reactionRate, [
          [0.015, 88],
          [0.007, 74],
          [0.003, 60],
          [0.001, 42],
          [0.00025, 26],
        ])
      : scoreFromThresholds(reactions, [
          [2000, 84],
          [900, 70],
          [300, 56],
          [80, 40],
          [1, 24],
        ]),
  ]);
}

/** Scores actual retention quality from watch percentage, average watch time, and one-minute hold rate. */
function scoreActualRetention(entry?: PerformanceTrackerEntry): number {
  const watchPercentage = readMetric(entry?.watchPercentage) ?? readMetric(entry?.completionRate);
  const averageWatchTimeSeconds = readMetric(entry?.averageWatchTimeSeconds);
  const oneMinuteRate = getOneMinuteRate(entry);

  return averagePresent([
    scoreFromThresholds(watchPercentage, [
      [65, 96],
      [50, 82],
      [35, 64],
      [22, 44],
      [1, 24],
    ]),
    scoreFromThresholds(averageWatchTimeSeconds, [
      [20, 94],
      [15, 80],
      [10, 62],
      [6, 44],
      [1, 24],
    ]),
    scoreFromThresholds(oneMinuteRate, [
      [0.22, 95],
      [0.12, 82],
      [0.06, 64],
      [0.025, 46],
      [0.005, 24],
    ]),
  ]);
}

/** Scores actual follower and owned-action conversion from follows, visits, and clicks relative to reach. */
function scoreActualFollowerConversion(entry?: PerformanceTrackerEntry): number {
  const followsGained = readMetric(entry?.followsGained);
  const profileVisits = readMetric(entry?.profileVisits);
  const linkClicks = readMetric(entry?.linkClicks);
  const followRate = getFollowRate(entry);
  const clickRate = getLinkClickRate(entry);
  const visitRate = safeRate(profileVisits, readMetric(entry?.reach));

  return averagePresent([
    followRate !== null
      ? scoreFromThresholds(followRate, [
          [0.0012, 94],
          [0.0006, 78],
          [0.00025, 60],
          [0.0001, 42],
          [0.00003, 24],
        ])
      : scoreFromThresholds(followsGained, [
          [120, 90],
          [50, 74],
          [15, 58],
          [4, 40],
          [1, 24],
        ]),
    visitRate !== null
      ? scoreFromThresholds(visitRate, [
          [0.006, 90],
          [0.003, 74],
          [0.001, 58],
          [0.0004, 42],
          [0.0001, 24],
        ])
      : scoreFromThresholds(profileVisits, [
          [400, 88],
          [150, 72],
          [40, 56],
          [10, 40],
          [1, 24],
        ]),
    clickRate !== null
      ? scoreFromThresholds(clickRate, [
          [0.0012, 88],
          [0.0005, 72],
          [0.0002, 56],
          [0.00005, 40],
          [0.00001, 24],
        ])
      : scoreFromThresholds(linkClicks, [
          [40, 86],
          [15, 70],
          [5, 54],
          [1, 38],
        ]),
  ]);
}

/** Maps an actual performance score to a human-friendly band. */
function getActualPerformanceBand(score: number, hasData: boolean): ActualFacebookPerformanceBand {
  if (!hasData) return "Insufficient data";
  if (score >= 85) return "Breakout";
  if (score >= 70) return "Strong";
  if (score >= 50) return "Average";
  return "Weak";
}

/** Builds the live actual Facebook performance scorecard from imported metrics. */
function buildActualPerformanceScores(
  performance: PerformanceTrackerEntry | undefined
): ActualFacebookPerformanceScores {
  const hasData = hasLivePerformanceData(performance);
  if (!hasData) {
    return {
      actualPerformanceScore: 0,
      actualRevenueScore: 0,
      actualEngagementScore: 0,
      actualRetentionScore: 0,
      actualFollowerConversionScore: 0,
      band: "Insufficient data",
    };
  }

  const actualRevenueScore = scoreActualRevenue(performance);
  const actualEngagementScore = scoreActualEngagement(performance);
  const actualRetentionScore = scoreActualRetention(performance);
  const actualFollowerConversionScore = scoreActualFollowerConversion(performance);

  const weightedSignals: Array<{ score: number; weight: number }> = [
    { score: actualRetentionScore, weight: 0.35 },
    { score: actualEngagementScore, weight: 0.25 },
    { score: actualRevenueScore, weight: 0.2 },
    { score: actualFollowerConversionScore, weight: 0.2 },
  ].filter((entry) => entry.score > 0);

  const actualPerformanceScore = weightedSignals.length
    ? clampScore(
        weightedSignals.reduce((sum, entry) => sum + entry.score * entry.weight, 0) /
          weightedSignals.reduce((sum, entry) => sum + entry.weight, 0)
      )
    : 0;

  return {
    actualPerformanceScore,
    actualRevenueScore,
    actualEngagementScore,
    actualRetentionScore,
    actualFollowerConversionScore,
    band: getActualPerformanceBand(actualPerformanceScore, hasData),
  };
}

/** Scores how strongly actual shares validated the predicted share-intent model. */
function scoreActualShareValidation(entry?: PerformanceTrackerEntry): number {
  const shareRate = getShareRate(entry);
  return shareRate !== null
    ? scoreFromThresholds(shareRate, [
        [0.003, 96],
        [0.0015, 82],
        [0.0008, 66],
        [0.0003, 48],
        [0.0001, 28],
      ])
    : scoreFromThresholds(readMetric(entry?.shares), [
        [250, 90],
        [120, 74],
        [40, 58],
        [10, 42],
        [1, 24],
      ]);
}

/** Scores how strongly actual comments validated the predicted discussion-depth model. */
function scoreActualCommentValidation(entry?: PerformanceTrackerEntry): number {
  const commentRate = getCommentRate(entry);
  return averagePresent([
    commentRate !== null
      ? scoreFromThresholds(commentRate, [
          [0.0025, 94],
          [0.001, 78],
          [0.0005, 62],
          [0.0002, 44],
          [0.00005, 26],
        ])
      : scoreFromThresholds(readMetric(entry?.comments), [
          [180, 90],
          [80, 74],
          [25, 58],
          [8, 42],
          [1, 24],
        ]),
    scoreFromThresholds(getOneMinuteRate(entry), [
      [0.18, 90],
      [0.1, 76],
      [0.05, 60],
      [0.02, 42],
      [0.005, 24],
    ]),
  ]);
}

/** Converts two scores into an overperformed / matched / underperformed label. */
function getPredictedVsActualStatus(
  predictedScore: number,
  actualScore: number,
  hasActualData: boolean
): PredictedVsActualStatus {
  if (!hasActualData || actualScore <= 0) return "insufficient-data";
  const delta = actualScore - predictedScore;
  if (delta >= 20) return "overperformed";
  if (delta <= -20) return "underperformed";
  return "matched";
}

/** Builds the likely-reason copy for one predicted-vs-actual comparison row. */
function buildLikelyReason(
  label: string,
  status: PredictedVsActualStatus
): string {
  switch (status) {
    case "overperformed":
      return `${label} beat the pre-publish model once the clip hit real Facebook distribution.`;
    case "underperformed":
      return `${label} landed below the pre-publish expectation once real viewers had to hold, share, or convert.`;
    case "matched":
      return `${label} is landing close to the pre-publish prediction, so the packaging model is reading the audience fairly well.`;
    default:
      return `There is not enough imported Facebook data yet to compare ${label.toLowerCase()} against the predicted score.`;
  }
}

/** Builds the next-step recommendation copy for one predicted-vs-actual comparison row. */
function buildNextRecommendation(
  label: string,
  status: PredictedVsActualStatus,
  actualScores: ActualFacebookPerformanceScores
): string {
  if (status === "insufficient-data") {
    return "Import reach, retention, engagement, and revenue rows before making the next remix or boost decision.";
  }

  if (label === "Overall") {
    if (status === "overperformed") {
      return "Turn this into a short cut, story cut, and series continuation while the behaviour is clearly working.";
    }
    if (actualScores.actualRetentionScore < 50) {
      return "Rewrite the first-frame hook and opening two seconds before you scale or remix this concept.";
    }
    if (actualScores.actualRevenueScore < 50) {
      return "Keep the concept, but tighten the monetized-safe packaging and ad-friendly caption framing.";
    }
    return "Refine the packaging before you turn this into a broader monetized rollout.";
  }

  if (label === "Share intent") {
    return status === "overperformed"
      ? "Build a share-trigger remix and a series follow-up while the behaviour still feels fresh."
      : "Tighten the single behavioural beat so the clip gives people a clearer reason to share it.";
  }

  if (label === "Comment depth") {
    return status === "overperformed"
      ? "Keep the observational discussion prompt and turn the strongest debate into a still-post or localized caption variant."
      : "Sharpen the observational question so comments become analysis instead of shallow reactions.";
  }

  if (label === "Monetisation safety") {
    return status === "overperformed"
      ? "Preserve the current clean-danger framing if you remix or boost this concept."
      : "Reduce bait-adjacent or graphic phrasing before you spend more distribution on this package.";
  }

  if (label === "Owned funnel") {
    return status === "overperformed"
      ? "Lean into the page or series CTA because the audience is already converting cleanly."
      : "Add a stronger page, series, or original-content CTA so the post does more than just distribute.";
  }

  if (label === "Revenue potential") {
    return status === "overperformed"
      ? "Keep the same monetized-safe framing and use this package as a benchmark for future reels."
      : "If revenue is lagging, try a cleaner monetized-safe rewrite before testing more budget.";
  }

  return status === "overperformed"
    ? "This package is outperforming the model, so it is worth controlled expansion."
    : "Do not boost yet. Improve the packaging first, then retest with fresh imported data.";
}

/** Builds one predicted-vs-actual comparison row. */
function buildMetricComparison(
  label: string,
  predictedScore: number,
  actualScore: number,
  hasActualData: boolean,
  actualScores: ActualFacebookPerformanceScores
): PredictedVsActualMetricComparison {
  const status = getPredictedVsActualStatus(predictedScore, actualScore, hasActualData);
  return {
    label,
    predictedScore: clampScore(predictedScore),
    actualScore: clampScore(actualScore),
    status,
    likelyReason: buildLikelyReason(label, status),
    nextRecommendation: buildNextRecommendation(label, status, actualScores),
  };
}

/** Builds remix, rewrite, and boost guidance from real imported Facebook performance. */
function buildWinnerRemixRecommendations(
  performance: PerformanceTrackerEntry | undefined,
  actualScores: ActualFacebookPerformanceScores,
  scores: MonetizedFacebookScores,
  boostRecommendation: MonetizedFacebookBoostRecommendation,
  riskyPackaging: boolean
): WinnerRemixRecommendation[] {
  const recommendations: WinnerRemixRecommendation[] = [];
  const band = actualScores.band;
  const shareRate = getShareRate(performance) ?? 0;
  const commentRate = getCommentRate(performance) ?? 0;
  const reach = readMetric(performance?.reach) ?? 0;
  const rpm = readMetric(performance?.rpm) ?? 0;
  const retentionStrong = actualScores.actualRetentionScore >= 70;
  const retentionWeak = hasLivePerformanceData(performance) && actualScores.actualRetentionScore < 50;
  const sharesStrong = shareRate >= 0.008 || (readMetric(performance?.shares) ?? 0) >= 120;
  const commentsStrong = commentRate >= 0.003 || (readMetric(performance?.comments) ?? 0) >= 80;
  const followsWeak = hasLivePerformanceData(performance) && actualScores.actualFollowerConversionScore < 50;
  const revenueWeak = hasLivePerformanceData(performance) && actualScores.actualRevenueScore < 50;

  if (band === "Breakout" || band === "Strong") {
    recommendations.push(
      {
        label: "8–12s short cut",
        reason: "The current reel has enough live signal to justify a tighter replay-first cut that leans harder into the winning behavioural beat.",
      },
      {
        label: "20–30s story cut",
        reason: "Stretch the same concept into a cleaner escalation-and-aftermath story cut while the audience is already proving it can hold attention.",
      },
      {
        label: "Feed discussion still post",
        reason: "Turn the best freeze-frame moment into a still post so the existing discussion energy can spill into feed comments.",
      },
      {
        label: "Translated/localized caption variant",
        reason: "Localize the discussion-led caption while keeping the same clean hook and behavioural structure that already worked.",
      }
    );
  }

  if (boostRecommendation.shouldBoost && !riskyPackaging) {
    recommendations.push({
      label: "Boost candidate",
      reason: "Safety, share intent, and imported performance are aligned enough for a controlled paid boost test.",
    });
  }

  if (scores.sponsorFitScore >= 75 && !riskyPackaging) {
    recommendations.push({
      label: "Sponsor-safe cut",
      reason: "Package a sponsor-safe version with the same clean-danger framing because the concept already sits well inside ad-safe boundaries.",
    });
  }

  if (sharesStrong && retentionStrong) {
    recommendations.push({
      label: "Series continuation",
      reason: "Strong shares plus strong retention say the audience wants this as a continuing wildlife series, not a one-off post.",
    });
  }

  if (reach >= 50000 && revenueWeak) {
    recommendations.push({
      label: "Monetized-safe rewrite",
      reason: "Reach is coming in, but RPM or earnings are lagging, so keep the concept and rewrite the packaging for cleaner monetized performance.",
    });
  }

  if (commentsStrong && !sharesStrong) {
    recommendations.push({
      label: "Share-trigger rewrite",
      reason: "Comments are strong but shares are soft, so tighten the opening beat and outcome framing to give viewers a clearer share trigger.",
    });
  }

  if (retentionStrong && followsWeak) {
    recommendations.push({
      label: "Stronger Page or series CTA",
      reason: "Retention is already working, so the next lift should come from a clearer page, follow, or series-continuation cue.",
    });
  }

  if (rpm >= 4 && reach > 0 && reach < 10000 && !riskyPackaging) {
    recommendations.push({
      label: "Controlled boost test",
      reason: "RPM is healthy but reach is still constrained, so a small paid test is worth considering once the organic pattern is stable.",
    });
  }

  if (retentionWeak) {
    recommendations.push({
      label: "First-frame and hook rewrite",
      reason: "Weak retention is the clearest signal to rewrite the first frame, opening beat, and early hook before producing more variants.",
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      label: "Hold for more live data",
      reason: "Import more reach, retention, engagement, and revenue data before making a confident remix or boost decision.",
    });
  }

  return recommendations.filter(
    (recommendation, index, all) =>
      all.findIndex((candidate) => candidate.label === recommendation.label) === index
  );
}

/** Builds a copyable packaging block for a recommended monetized Facebook version. */
function buildPromptRecommendation(
  label: string,
  hook: string,
  caption: string,
  cta: string,
  reason: string,
  includeReminder = false
): MonetizedFacebookPromptRecommendation {
  const sections = [
    `Hook:\n${hook}`,
    `Caption:\n${caption}`,
    cta ? `CTA:\n${cta}` : "",
    includeReminder ? `Reminder:\n${FACEBOOK_AI_REMINDER}` : "",
  ].filter(Boolean);

  return {
    label,
    packageText: sections.join("\n\n"),
    reason,
  };
}

/** Builds the human-readable monetized verdict summary text. */
function buildVerdictSummary(
  verdict: MonetizedFacebookVerdict,
  boostRecommendation: MonetizedFacebookBoostRecommendation,
  performanceTier: MonetizedFacebookPerformanceTier
): string {
  switch (verdict) {
    case "Monetized Winner":
      return `This package is reading like a monetized winner: safety is clean, the behavioural beat is strong, and the current performance profile looks ${performanceTier.toLowerCase()}. ${boostRecommendation.reason}`;
    case "Viral But Risky":
      return `The viral pull is strong, but safety or sponsor risk is still too close to the line. ${boostRecommendation.reason}`;
    case "Safe Growth Candidate":
      return `This package looks safe enough to scale carefully, but it still wants stronger retention or conversion proof before you treat it like a revenue winner. ${boostRecommendation.reason}`;
    case "Needs Packaging Fix":
      return `The underlying concept is usable, but the Facebook packaging still needs cleanup before you lean on it for monetized distribution. ${boostRecommendation.reason}`;
    default:
      return `Do not boost this package yet. ${boostRecommendation.reason}`;
  }
}

/** Builds the monetized Facebook performance report from the generated package and optional live Facebook data. */
export function buildMonetizedFacebookReport(
  pkg: GeneratedPackage,
  performance?: PerformanceTrackerEntry
): MonetizedFacebookReport {
  const readiness = buildFacebookPublishReadinessReport(pkg);
  const revenuePotentialScore = scoreRevenuePotential(pkg, performance, readiness);
  const adSafeConflictScore = scoreAdSafeConflict(pkg, readiness);
  const sponsorFitScore = scoreSponsorFit(pkg, readiness);
  const repeatViewerScore = scoreRepeatViewer(performance, readiness);
  const followerConversionScore = scoreFollowerConversion(performance, readiness);
  const boostWorthyScore = scoreBoostWorthy(
    performance,
    readiness,
    revenuePotentialScore,
    adSafeConflictScore,
    sponsorFitScore,
    repeatViewerScore,
    followerConversionScore
  );
  const scores: MonetizedFacebookScores = {
    revenuePotentialScore,
    adSafeConflictScore,
    sponsorFitScore,
    repeatViewerScore,
    followerConversionScore,
    boostWorthyScore,
  };

  const actualScores = buildActualPerformanceScores(performance);
  const performanceTier: MonetizedFacebookPerformanceTier = actualScores.band;
  const hasRevenueData =
    readMetric(performance?.estimatedEarnings) !== null ||
    readMetric(performance?.earningsUsd) !== null ||
    readMetric(performance?.rpm) !== null;
  const revenueSignalStrong =
    (readMetric(performance?.rpm) ?? 0) >= 4 ||
    (readMetric(performance?.estimatedEarnings) ?? readMetric(performance?.earningsUsd) ?? 0) >= 15;
  const riskyPackaging = hasRiskyPackaging(pkg);

  let verdict: MonetizedFacebookVerdict;
  if (adSafeConflictScore < 45 || readiness.scores.monetisationSafetyScore <= 4 || riskyPackaging) {
    verdict = "Do Not Boost";
  } else if (
    readiness.scores.shareIntentScore >= 8 &&
    readiness.scores.commentDepthIntentScore >= 7 &&
    (adSafeConflictScore < 75 || readiness.publishGuardPass === false)
  ) {
    verdict = "Viral But Risky";
  } else if (
    readiness.scores.monetisationSafetyScore >= 7 &&
    readiness.scores.shareIntentScore >= 7 &&
    readiness.scores.commentDepthIntentScore >= 6 &&
    adSafeConflictScore >= 75 &&
    revenuePotentialScore >= 75 &&
    repeatViewerScore >= 65 &&
    (performanceTier === "Strong" || performanceTier === "Breakout" || performanceTier === "Insufficient data") &&
    (!hasRevenueData || revenueSignalStrong)
  ) {
    verdict = "Monetized Winner";
  } else if (adSafeConflictScore >= 70 && revenuePotentialScore >= 60 && repeatViewerScore >= 55) {
    verdict = "Safe Growth Candidate";
  } else {
    verdict = "Needs Packaging Fix";
  }

  const boostRecommendation: MonetizedFacebookBoostRecommendation =
    readiness.scores.monetisationSafetyScore >= 7 &&
    adSafeConflictScore >= 70 &&
    readiness.scores.shareIntentScore >= 7 &&
    (performanceTier === "Strong" || performanceTier === "Breakout")
      ? {
          shouldBoost: true,
          label: "Boost this post",
          reason:
            performanceTier === "Breakout"
              ? "Live data already looks breakout-level and the packaging stays clean enough for paid amplification."
              : "Live data is strong, the packaging is ad-safe, and the share beat is strong enough to justify a controlled boost test.",
        }
      : {
          shouldBoost: false,
          label: "Do not boost yet",
          reason:
            performanceTier === "Insufficient data"
              ? "Wait for live Facebook retention and revenue data before you spend on distribution."
              : adSafeConflictScore < 75
                ? "The package still needs cleaner ad-safe packaging before you put budget behind it."
                : readiness.scores.shareIntentScore < 8
                  ? "The behavioural beat is not strong enough yet to justify paid amplification."
                  : "Live performance is not strong enough yet to justify a boost.",
        };

  const shareValidationScore = scoreActualShareValidation(performance);
  const commentValidationScore = scoreActualCommentValidation(performance);
  const boostOutcomeScore = clampScore(
    actualScores.actualPerformanceScore * 0.5 +
      actualScores.actualRevenueScore * 0.25 +
      adSafeConflictScore * 0.25
  );
  const hasActualData = actualScores.band !== "Insufficient data";

  const predictedVsActual = {
    overall: buildMetricComparison(
      "Overall",
      readiness.overallScore,
      actualScores.actualPerformanceScore,
      hasActualData,
      actualScores
    ),
    shareIntent: buildMetricComparison(
      "Share intent",
      readiness.scores.shareIntentScore * 10,
      shareValidationScore,
      hasActualData,
      actualScores
    ),
    commentDepthIntent: buildMetricComparison(
      "Comment depth",
      readiness.scores.commentDepthIntentScore * 10,
      commentValidationScore,
      hasActualData,
      actualScores
    ),
    monetisationSafety: buildMetricComparison(
      "Monetisation safety",
      readiness.scores.monetisationSafetyScore * 10,
      adSafeConflictScore,
      true,
      actualScores
    ),
    ownedFunnelConversionIntent: buildMetricComparison(
      "Owned funnel",
      readiness.scores.ownedFunnelConversionIntentScore * 10,
      actualScores.actualFollowerConversionScore,
      hasActualData,
      actualScores
    ),
    revenuePotential: buildMetricComparison(
      "Revenue potential",
      revenuePotentialScore,
      actualScores.actualRevenueScore,
      hasActualData,
      actualScores
    ),
    boostWorthy: buildMetricComparison(
      "Boost worthy",
      boostWorthyScore,
      boostOutcomeScore,
      hasActualData,
      actualScores
    ),
  };

  const improvementNotes = [
    readiness.scores.shareIntentScore < 8
      ? "Tighten the opening around one dominant behavioural beat so replay value and shares rise faster."
      : null,
    readiness.scores.commentDepthIntentScore < 7
      ? "End the caption on a sharper observational discussion question so comments become analysis instead of shallow replies."
      : null,
    readiness.scores.monetisationSafetyScore < 8
      ? "Clean up any bait-adjacent or graphic framing before you scale this into monetized distribution."
      : null,
    readiness.scores.ownedFunnelConversionIntentScore < 5
      ? "Add a light page, series, or original-content conversion angle so the post does more than distribute."
      : null,
    performanceTier === "Insufficient data"
      ? "No live Facebook data yet. Publish first, then import reach, three-second views, one-minute views, watch percentage, and RPM before deciding on paid boost."
      : null,
    actualScores.actualRevenueScore < 50 && (readMetric(performance?.reach) ?? 0) >= 50000
      ? "Reach is present but revenue is soft. Keep the concept and test a cleaner monetized-safe caption package."
      : null,
    actualScores.actualRetentionScore < 50 && hasActualData
      ? "Live retention is the weak point right now, so treat first-frame readability and the opening hook as the first rewrite target."
      : null,
    actualScores.actualFollowerConversionScore < 50 && actualScores.actualRetentionScore >= 70
      ? "Retention is strong but follow conversion is lagging, so the next iteration should push a clearer page or series CTA."
      : null,
    boostRecommendation.shouldBoost
      ? "This is one of the cleaner candidates for a paid test. Keep the disclosure label and current packaging intact when boosting."
      : null,
  ].filter((note): note is string => Boolean(note));

  const hook = getFacebookHook(pkg);
  const longCaption = getFacebookCaption(pkg);
  const shortCaption = pkg.caption || longCaption;
  const promptRecommendations = {
    bestViralVersion: buildPromptRecommendation(
      "Best viral version",
      hook,
      longCaption,
      pkg.cta,
      "Use the strongest behavioural beat and the longer discussion-led caption when the goal is replay value and comment depth."
    ),
    bestMonetizedSafeVersion: buildPromptRecommendation(
      "Best monetized-safe version",
      hook,
      longCaption,
      pkg.cta,
      "Use the current Facebook packaging when you want the cleanest balance of monetisation safety, share intent, and documentary tone.",
      true
    ),
    bestSponsorSafeVersion: buildPromptRecommendation(
      "Best sponsor-safe version",
      hook,
      shortCaption,
      pkg.cta,
      "Use the shorter caption package when you want the cleanest sponsor-facing version with less copy density and lower packaging risk.",
      true
    ),
  };

  const winnerRemixRecommendations = buildWinnerRemixRecommendations(
    performance,
    actualScores,
    scores,
    boostRecommendation,
    riskyPackaging
  );

  return {
    scores,
    actualScores,
    verdict,
    summary: buildVerdictSummary(verdict, boostRecommendation, performanceTier),
    boostRecommendation,
    actualPerformanceTier: performanceTier,
    predictedVsActual,
    promptRecommendations,
    winnerRemixRecommendations,
    improvementNotes,
  };
}
