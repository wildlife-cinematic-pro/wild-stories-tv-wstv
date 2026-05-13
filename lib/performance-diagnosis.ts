import type { PerformanceTrackerEntry } from "@/types";

export type PerformanceDiagnosisReportContext = {
  actualPerformanceTier: string;
};

function getMetricNumber(value: number | "" | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Builds a short deterministic diagnosis from viral packaging and monetization signals. */
export function buildPerformanceWonLostSummary(
  entry: PerformanceTrackerEntry,
  report: PerformanceDiagnosisReportContext
): string {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const hookScore = getMetricNumber(entry.firstSecondHookScore);
  const thumbnailScore = getMetricNumber(entry.thumbnailQualityScore);
  const watchPercent = getMetricNumber(entry.watchPercentage) ?? getMetricNumber(entry.completionRate);
  const views = getMetricNumber(entry.views);
  const engagement =
    (getMetricNumber(entry.shares) ?? 0) +
    (getMetricNumber(entry.comments) ?? 0) +
    (getMetricNumber(entry.reactions) ?? 0);
  const engagementRate = views && views > 0 ? (engagement / views) * 100 : null;
  const rpm = getMetricNumber(entry.rpm);
  const earnings = getMetricNumber(entry.estimatedEarnings) ?? getMetricNumber(entry.earningsUsd);

  if (hookScore !== null) {
    if (hookScore >= 80) strengths.push("a strong first-second hook");
    else if (hookScore < 60) weaknesses.push("the first second did not stop the scroll fast enough");
  }

  if (thumbnailScore !== null) {
    if (thumbnailScore >= 80) strengths.push("a clear thumbnail/cover frame");
    else if (thumbnailScore < 60) weaknesses.push("the thumbnail did not make the animal conflict readable");
  }

  if (watchPercent !== null) {
    if (watchPercent >= 50) strengths.push("healthy retention");
    else if (watchPercent < 35) weaknesses.push("weak retention after the opening beat");
  }

  if (engagementRate !== null) {
    if (engagementRate >= 1.5) strengths.push("strong share/comment/reaction pull");
    else if (engagementRate < 0.4) weaknesses.push("low engagement for the view count");
  }

  if (rpm !== null || earnings !== null) {
    if ((rpm ?? 0) >= 4 || (earnings ?? 0) >= 20) strengths.push("solid monetization signal");
    else if ((rpm ?? 0) > 0 || (earnings ?? 0) > 0) weaknesses.push("monetization stayed modest");
  }

  if (strengths.length && weaknesses.length) {
    return "Mixed result: won on " + strengths.slice(0, 2).join(" and ") + " but lost on " + weaknesses.slice(0, 2).join(" and ") + ".";
  }

  if (strengths.length) {
    return "Likely won because of " + strengths.slice(0, 3).join(", ") + ".";
  }

  if (weaknesses.length) {
    return "Likely lost because " + weaknesses.slice(0, 3).join(", ") + ".";
  }

  if (report.actualPerformanceTier !== "No live data") {
    return "Live result is " + report.actualPerformanceTier + "; add hook, thumbnail, and engagement notes to sharpen the diagnosis.";
  }

  return "Add hook, thumbnail, retention, and engagement data to diagnose why this reel won or lost.";
}
