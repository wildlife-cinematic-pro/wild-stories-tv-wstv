import type { GeneratedPackage } from "@/types";

export type DecisionLabel = "PUBLISH" | "DO NOT PUBLISH" | "REWORK";

export type DecisionResult = {
  score: number;
  hook: string;
  risk: "low" | "medium" | "high";
  hasBlockers: boolean;
  isPass: boolean;
  canPublish: boolean;
  label: DecisionLabel;
  color: string;
};

type DecisionInput = Pick<
  GeneratedPackage,
  "usAudienceScore" | "hookFamily" | "publishGuardReport"
>;

function getDecisionRisk(data: DecisionInput): "low" | "medium" | "high" {
  if ((data.publishGuardReport?.blockers?.length ?? 0) > 0) return "high";
  if (data.publishGuardReport?.isPass === false) return "high";
  if ((data.publishGuardReport?.warnings?.length ?? 0) > 0) return "medium";
  return "low";
}

export function getDecisionLabel(
  score: number,
  hasBlockers: boolean,
  isPass: boolean
): DecisionLabel {
  if (score < 50) return "REWORK";
  if (score >= 75 && isPass && !hasBlockers) return "PUBLISH";
  return "DO NOT PUBLISH";
}

export function getDecisionColor(
  canPublish: boolean,
  label?: DecisionLabel
): string {
  if (label === "REWORK") return "text-yellow-400";
  return canPublish ? "text-green-400" : "text-red-400";
}

export function getDecision(data: DecisionInput): DecisionResult {
  const score = data.usAudienceScore?.total ?? 0;
  const hook = data.hookFamily ?? "unknown";
  const hasBlockers = (data.publishGuardReport?.blockers?.length ?? 0) > 0;
  const isPass = data.publishGuardReport?.isPass === true;
  const canPublish = score >= 75 && isPass && !hasBlockers;
  const label = getDecisionLabel(score, hasBlockers, isPass);

  return {
    score,
    hook,
    risk: getDecisionRisk(data),
    hasBlockers,
    isPass,
    canPublish,
    label,
    color: getDecisionColor(canPublish, label),
  };
}
