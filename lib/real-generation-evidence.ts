import type {
  GeneratedPackage,
  PipelineStyle,
  RealGenerationEvidenceNotes,
  RealGenerationEvidenceRecommendation,
  RealGenerationEvidenceRecord,
  RealGenerationEvidenceScores,
} from "@/types";

export const REAL_GENERATION_EVIDENCE_SCORE_KEYS = [
  "firstFrameReadability",
  "spacingClarity",
  "worldLightingContinuity",
  "anatomyPhysicsRealism",
  "actionReadability",
  "facebookOpeningStrength",
] as const satisfies readonly (keyof RealGenerationEvidenceScores)[];

const RECOMMENDATION_LABELS: Record<RealGenerationEvidenceRecommendation, string> = {
  keep: "Keep",
  "retry-with-fixes": "Retry with fixes",
  retry: "Retry",
};

export function clampRealGenerationEvidenceScore(value: number): number {
  if (!Number.isFinite(value)) return 3;
  return Math.max(1, Math.min(5, Math.round(value)));
}

export function createDefaultRealGenerationEvidenceScores(
  value = 3
): RealGenerationEvidenceScores {
  const score = clampRealGenerationEvidenceScore(value);

  return {
    firstFrameReadability: score,
    spacingClarity: score,
    worldLightingContinuity: score,
    anatomyPhysicsRealism: score,
    actionReadability: score,
    facebookOpeningStrength: score,
  };
}

export function createEmptyRealGenerationEvidenceNotes(): RealGenerationEvidenceNotes {
  return {
    strongPoints: "",
    driftObserved: "",
    failedPoints: "",
    retryPlan: "",
    masterStill: "",
    runway: "",
    kling: "",
    seedance: "",
  };
}

export function normalizeRealGenerationEvidenceNotes(
  notes: Partial<RealGenerationEvidenceNotes> | null | undefined
): RealGenerationEvidenceNotes {
  const safe = notes ?? {};

  return {
    strongPoints: String(safe.strongPoints ?? "").trim(),
    driftObserved: String(safe.driftObserved ?? "").trim(),
    failedPoints: String(safe.failedPoints ?? "").trim(),
    retryPlan: String(safe.retryPlan ?? "").trim(),
    masterStill: String(safe.masterStill ?? "").trim(),
    runway: String(safe.runway ?? "").trim(),
    kling: String(safe.kling ?? "").trim(),
    seedance: String(safe.seedance ?? "").trim(),
  };
}

export function calculateRealGenerationEvidenceOverallScore(
  scores: RealGenerationEvidenceScores
): number {
  const total = REAL_GENERATION_EVIDENCE_SCORE_KEYS.reduce(
    (sum, key) => sum + clampRealGenerationEvidenceScore(scores[key]),
    0
  );
  const average = total / REAL_GENERATION_EVIDENCE_SCORE_KEYS.length;
  return Math.round(((average - 1) / 4) * 100);
}

export function suggestRealGenerationEvidenceRecommendation(
  scores: RealGenerationEvidenceScores
): RealGenerationEvidenceRecommendation {
  const overall = calculateRealGenerationEvidenceOverallScore(scores);
  const criticalLow =
    clampRealGenerationEvidenceScore(scores.firstFrameReadability) <= 2 ||
    clampRealGenerationEvidenceScore(scores.anatomyPhysicsRealism) <= 2;

  if (
    overall >= 78 &&
    !criticalLow &&
    clampRealGenerationEvidenceScore(scores.spacingClarity) >= 3 &&
    clampRealGenerationEvidenceScore(scores.actionReadability) >= 3
  ) {
    return "keep";
  }

  if (overall >= 50) {
    return "retry-with-fixes";
  }

  return "retry";
}

export function formatRealGenerationEvidenceRecommendation(
  recommendation: RealGenerationEvidenceRecommendation
): string {
  return RECOMMENDATION_LABELS[recommendation];
}

export function getRealGenerationEvidenceGenerationId(pkg: GeneratedPackage): string {
  const explicitId = String(pkg.generationId ?? "").trim();
  if (explicitId) return explicitId;

  return [
    pkg.predatorName ?? "predator",
    pkg.preyName ?? "prey",
    String(pkg.arcName ?? "arc"),
    pkg.pipelineStyle ?? "pipeline",
    pkg.generatedAt ?? "",
    pkg.hook ?? "",
  ]
    .map((part) => String(part).trim())
    .filter(Boolean)
    .join("|");
}

export function buildRealGenerationEvidenceLabel(pkg: GeneratedPackage): string {
  const matchup = `${pkg.predatorName ?? "Predator"} vs ${pkg.preyName ?? "Prey"}`;
  const arc = String(pkg.arcName ?? "Wildlife package").trim();
  const pipeline = (pkg.pipelineStyle ?? "4-shot") as PipelineStyle;
  const stamp = String(pkg.generatedAt ?? "").trim();
  const timeLabel = stamp ? stamp.slice(0, 16).replace("T", " ") : "Latest output";
  return `${matchup} • ${arc} • ${pipeline} • ${timeLabel}`;
}

export function sortRealGenerationEvidenceRecords(
  records: RealGenerationEvidenceRecord[]
): RealGenerationEvidenceRecord[] {
  return [...records].sort((left, right) =>
    right.capturedAt.localeCompare(left.capturedAt)
  );
}

export function buildRealGenerationEvidenceSummary(
  record: Pick<RealGenerationEvidenceRecord, "overallScore" | "userRecommendation">
): string {
  return `${formatRealGenerationEvidenceRecommendation(record.userRecommendation)} • ${record.overallScore}/100`;
}
