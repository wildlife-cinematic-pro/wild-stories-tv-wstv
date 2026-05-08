import type { ReelPerformanceInsight, ReelPerformanceRecord } from "@/types";

function safeRate(numerator: number | undefined, denominator: number): number | undefined {
  if (!Number.isFinite(denominator) || denominator <= 0) return undefined;
  const safeNumerator = Number.isFinite(numerator) && (numerator ?? 0) >= 0 ? numerator ?? 0 : 0;
  return safeNumerator / denominator;
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function viewsScore(views: number): number {
  if (views >= 100_000) return 100;
  if (views >= 50_000) return 90;
  if (views >= 10_000) return 76;
  if (views >= 2_500) return 60;
  if (views >= 500) return 42;
  if (views > 0) return 24;
  return 0;
}

function rateScore(rate: number | undefined, strongRate: number): number {
  if (rate === undefined) return 0;
  return clampScore((rate / strongRate) * 100);
}

function statusFromScore(score: number): ReelPerformanceInsight["status"] {
  if (score >= 85) return "winner";
  if (score >= 70) return "solid";
  if (score >= 50) return "needs-work";
  return "weak";
}

export function analyzeReelPerformance(
  record: ReelPerformanceRecord
): ReelPerformanceInsight {
  const views = Number.isFinite(record.views) && record.views > 0 ? record.views : 0;
  const engagementCount = record.likes + record.comments + record.shares + record.saves;
  const engagementRate = safeRate(engagementCount, views);
  const shareRate = safeRate(record.shares, views);
  const saveRate = safeRate(record.saves, views);
  const followRate = safeRate(record.followsGained, views);
  const retentionRate =
    record.averageWatchTimeSeconds !== undefined && record.durationSeconds
      ? safeRate(record.averageWatchTimeSeconds, record.durationSeconds)
      : undefined;
  const threeSecondViewRate = safeRate(record.threeSecondViews, views);

  const totalScore = clampScore(
    viewsScore(views) * 0.15 +
      rateScore(retentionRate, 0.72) * 0.25 +
      rateScore(engagementRate, 0.08) * 0.24 +
      rateScore(shareRate, 0.015) * 0.14 +
      rateScore(saveRate, 0.012) * 0.08 +
      rateScore(followRate, 0.004) * 0.07 +
      rateScore(threeSecondViewRate, 0.65) * 0.07
  );

  const strengths: string[] = [];
  const fixes: string[] = [];

  if (views >= 10_000) strengths.push("Strong view volume for manual tracking.");
  else fixes.push("Test a stronger first-frame hook to lift view volume.");

  if ((retentionRate ?? 0) >= 0.7) strengths.push("Watch time suggests the reel holds attention.");
  else fixes.push("Tighten the first 3 seconds and remove slow setup.");

  if ((engagementRate ?? 0) >= 0.06) strengths.push("Engagement rate is strong for a wildlife Reel.");
  else fixes.push("Use a clearer caption angle that invites real discussion.");

  if ((shareRate ?? 0) >= 0.01) strengths.push("Share rate shows the scene has replay/send value.");
  else fixes.push("Make the final frame more unresolved or surprising.");

  if ((followRate ?? 0) >= 0.003) strengths.push("Follower conversion is tracking well.");
  else fixes.push("Make the series identity and WSTV voice more recognizable.");

  if (views === 0) {
    fixes.unshift("Add views after the Reel has real Facebook data.");
  }

  return {
    score: totalScore,
    retentionRate,
    engagementRate,
    shareRate,
    followRate,
    status: statusFromScore(totalScore),
    strengths: strengths.length ? strengths : ["No major positive signal recorded yet."],
    fixes: fixes.length ? fixes : ["Keep this hook/caption pattern in the test set."],
  };
}
