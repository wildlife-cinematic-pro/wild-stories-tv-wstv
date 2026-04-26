import type {
  GeneratedPackage,
  MonetizedFacebookBoostRecommendation,
  MonetizedFacebookPerformanceTier,
  MonetizedFacebookPromptRecommendation,
  MonetizedFacebookReport,
  MonetizedFacebookScores,
  MonetizedFacebookVerdict,
  PerformanceTrackerEntry,
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
  const oneMinuteViews = readMetric(entry.oneMinuteViews);
  const threeSecondViews = readMetric(entry.threeSecondViews);
  if (oneMinuteViews === null || threeSecondViews === null || threeSecondViews <= 0) {
    return null;
  }
  return oneMinuteViews / threeSecondViews;
}

/** Calculates a share rate from shares versus reach when both exist. */
function getShareRate(entry?: PerformanceTrackerEntry | null): number | null {
  if (!entry) return null;
  const shares = readMetric(entry.shares);
  const reach = readMetric(entry.reach);
  if (shares === null || reach === null || reach <= 0) {
    return null;
  }
  return shares / reach;
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

/** Classifies the actual performance data into a useful monetization tier. */
function getActualPerformanceTier(
  performance: PerformanceTrackerEntry | undefined,
  revenuePotentialScore: number,
  repeatViewerScore: number,
  boostWorthyScore: number
): MonetizedFacebookPerformanceTier {
  if (!hasLivePerformanceData(performance)) {
    return "No live data yet";
  }

  const watchPercentage = readMetric(performance?.watchPercentage);
  const averageWatchTimeSeconds = readMetric(performance?.averageWatchTimeSeconds);
  const oneMinuteRate = getOneMinuteRate(performance);
  const estimatedEarnings = readMetric(performance?.estimatedEarnings) ?? readMetric(performance?.earningsUsd);
  const rpm = readMetric(performance?.rpm);
  const shares = readMetric(performance?.shares);
  const followsGained = readMetric(performance?.followsGained);
  const reach = readMetric(performance?.reach);

  if (
    boostWorthyScore >= 85 &&
    ((watchPercentage !== null && watchPercentage >= 60) ||
      (oneMinuteRate !== null && oneMinuteRate >= 0.15) ||
      (estimatedEarnings !== null && estimatedEarnings >= 40) ||
      (rpm !== null && rpm >= 6) ||
      (shares !== null && shares >= 75))
  ) {
    return "Breakout";
  }

  if (
    repeatViewerScore >= 70 &&
    ((watchPercentage !== null && watchPercentage >= 45) ||
      (averageWatchTimeSeconds !== null && averageWatchTimeSeconds >= 15) ||
      (oneMinuteRate !== null && oneMinuteRate >= 0.08) ||
      (estimatedEarnings !== null && estimatedEarnings >= 10) ||
      (rpm !== null && rpm >= 4) ||
      (shares !== null && shares >= 20))
  ) {
    return "Strong";
  }

  if (
    revenuePotentialScore >= 55 &&
    ((watchPercentage !== null && watchPercentage >= 30) ||
      (averageWatchTimeSeconds !== null && averageWatchTimeSeconds >= 8) ||
      (followsGained !== null && followsGained >= 3) ||
      (reach !== null && reach >= 1000))
  ) {
    return "Developing";
  }

  return "Weak";
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

  const performanceTier = getActualPerformanceTier(
    performance,
    revenuePotentialScore,
    repeatViewerScore,
    boostWorthyScore
  );
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
    readiness.scores.monetisationSafetyScore >= 8 &&
    readiness.scores.shareIntentScore >= 8 &&
    readiness.scores.commentDepthIntentScore >= 7 &&
    adSafeConflictScore >= 80 &&
    revenuePotentialScore >= 80 &&
    repeatViewerScore >= 70 &&
    (performanceTier === "Strong" || performanceTier === "Breakout" || performanceTier === "No live data yet") &&
    (!hasRevenueData || revenueSignalStrong)
  ) {
    verdict = "Monetized Winner";
  } else if (adSafeConflictScore >= 70 && revenuePotentialScore >= 60 && repeatViewerScore >= 55) {
    verdict = "Safe Growth Candidate";
  } else {
    verdict = "Needs Packaging Fix";
  }

  const boostRecommendation: MonetizedFacebookBoostRecommendation =
    readiness.scores.monetisationSafetyScore >= 8 &&
    adSafeConflictScore >= 75 &&
    readiness.scores.shareIntentScore >= 8 &&
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
            performanceTier === "No live data yet"
              ? "Wait for live Facebook retention and revenue data before you spend on distribution."
              : adSafeConflictScore < 75
                ? "The package still needs cleaner ad-safe packaging before you put budget behind it."
                : readiness.scores.shareIntentScore < 8
                  ? "The behavioural beat is not strong enough yet to justify paid amplification."
                  : "Live performance is not strong enough yet to justify a boost.",
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
    performanceTier === "No live data yet"
      ? "No live Facebook data yet. Publish first, then import reach, three-second views, one-minute views, watch percentage, and RPM before deciding on paid boost."
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

  return {
    scores,
    verdict,
    summary: buildVerdictSummary(verdict, boostRecommendation, performanceTier),
    boostRecommendation,
    actualPerformanceTier: performanceTier,
    promptRecommendations,
    improvementNotes,
  };
}
