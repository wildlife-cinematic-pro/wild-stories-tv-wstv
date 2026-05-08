import type {
  ABExperimentRecord,
  ABExperimentVariantRecord,
} from "@/types";

export type ABVariantScore = {
  label: ABExperimentVariantRecord["label"];
  score: number;
  strengths: string[];
  fixes: string[];
};

export type ABExperimentAnalysis = {
  winnerLabel?: ABExperimentVariantRecord["label"];
  status: "waiting" | "winner-found" | "needs-more-data";
  variantScores: ABVariantScore[];
  summary: string;
};

function safeRate(numerator: number | undefined, denominator: number | undefined): number | undefined {
  const safeDenominator = Number.isFinite(denominator) && (denominator ?? 0) > 0 ? denominator ?? 0 : 0;
  if (safeDenominator <= 0) return undefined;
  const safeNumerator = Number.isFinite(numerator) && (numerator ?? 0) >= 0 ? numerator ?? 0 : 0;
  return safeNumerator / safeDenominator;
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function viewsScore(views: number | undefined): number {
  const safeViews = Number.isFinite(views) && (views ?? 0) > 0 ? views ?? 0 : 0;
  if (safeViews >= 100_000) return 100;
  if (safeViews >= 50_000) return 90;
  if (safeViews >= 10_000) return 76;
  if (safeViews >= 2_500) return 60;
  if (safeViews >= 500) return 42;
  if (safeViews > 0) return 24;
  return 0;
}

function rateScore(rate: number | undefined, strongRate: number): number {
  if (rate === undefined) return 0;
  return clampScore((rate / strongRate) * 100);
}

export function scoreABVariant(variant: ABExperimentVariantRecord): ABVariantScore {
  const views = Number.isFinite(variant.views) && (variant.views ?? 0) > 0 ? variant.views ?? 0 : 0;
  const engagementCount =
    (variant.likes ?? 0) +
    (variant.comments ?? 0) +
    (variant.shares ?? 0) +
    (variant.saves ?? 0);
  const engagementRate = safeRate(engagementCount, views);
  const shareRate = safeRate(variant.shares, views);
  const saveRate = safeRate(variant.saves, views);
  const followRate = safeRate(variant.followsGained, views);
  const retentionRate = safeRate(
    variant.averageWatchTimeSeconds,
    variant.durationSeconds
  );
  const threeSecondViewRate = safeRate(variant.threeSecondViews, views);

  const score = clampScore(
    viewsScore(views) * 0.14 +
      rateScore(retentionRate, 0.72) * 0.26 +
      rateScore(engagementRate, 0.08) * 0.22 +
      rateScore(shareRate, 0.015) * 0.15 +
      rateScore(saveRate, 0.012) * 0.09 +
      rateScore(followRate, 0.004) * 0.07 +
      rateScore(threeSecondViewRate, 0.65) * 0.07
  );

  const strengths: string[] = [];
  const fixes: string[] = [];

  if (views >= 10_000) strengths.push("Strong view volume for this variant.");
  else fixes.push("Keep testing until this variant has a fair view sample.");

  if ((retentionRate ?? 0) >= 0.7) strengths.push("Retention suggests the hook holds attention.");
  else fixes.push("Tighten the opening promise or shorten slow setup.");

  if ((engagementRate ?? 0) >= 0.06) strengths.push("Engagement rate is a useful signal.");
  else fixes.push("Try a clearer viewer-read caption angle.");

  if ((shareRate ?? 0) >= 0.01) strengths.push("Share rate points to replay/send value.");
  else fixes.push("Make the ending frame more memorable or unresolved.");

  if ((saveRate ?? 0) >= 0.01) strengths.push("Save rate suggests the story angle is reusable.");

  if ((followRate ?? 0) >= 0.003) strengths.push("Follow conversion is promising.");

  if (views === 0) {
    fixes.unshift("Add variant performance after posting.");
  }

  return {
    label: variant.label,
    score,
    strengths: strengths.length ? strengths : ["No standout signal recorded yet."],
    fixes: fixes.length ? fixes : ["Promote this variant style into the next test set."],
  };
}

export function analyzeABExperiment(record: ABExperimentRecord): ABExperimentAnalysis {
  const variantScores = record.variants.map(scoreABVariant);
  const variantsWithViews = record.variants.filter((variant) => (variant.views ?? 0) > 0);

  if (variantsWithViews.length === 0) {
    return {
      status: "waiting",
      variantScores,
      summary: "Waiting for variant performance data before choosing a winner.",
    };
  }

  if (variantsWithViews.length < 2) {
    return {
      status: "needs-more-data",
      variantScores,
      summary: "Add data for at least two variants before promoting a winner.",
    };
  }

  const sorted = [...variantScores].sort((a, b) => b.score - a.score);
  const [top, second] = sorted;

  if (top && second && top.score >= 30 && top.score - second.score >= 8) {
    return {
      winnerLabel: top.label,
      status: "winner-found",
      variantScores,
      summary: `Variant ${top.label} is the clearest winner so far by ${top.score - second.score} points.`,
    };
  }

  return {
    status: "needs-more-data",
    variantScores,
    summary: "Variant scores are close, so keep gathering data before promotion.",
  };
}
