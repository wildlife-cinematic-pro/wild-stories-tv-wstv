import type { GeneratedPackage } from "@/types";

type UsageTrackedPackage = Pick<
  GeneratedPackage,
  | "usAudienceScore"
  | "hookFamily"
  | "publishGuardReport"
  | "predatorName"
  | "preyName"
  | "arcName"
>;

export function getUsageRisk(data: UsageTrackedPackage): "low" | "medium" | "high" {
  if ((data.publishGuardReport?.blockers?.length ?? 0) > 0) return "high";
  if (data.publishGuardReport?.isPass === false) return "high";
  if ((data.publishGuardReport?.warnings?.length ?? 0) > 0) return "medium";
  return "low";
}

export function buildUsagePayload(data: UsageTrackedPackage) {
  return {
    score: data.usAudienceScore?.total ?? 0,
    hook: data.hookFamily ?? "unknown",
    risk: getUsageRisk(data),
    predatorName: data.predatorName ?? "unknown",
    preyName: data.preyName ?? "unknown",
    arcName: data.arcName ?? "unknown",
    timestamp: new Date().toISOString(),
  };
}

export function trackUsage(event: string, data: unknown) {
  try {
    const raw = JSON.parse(localStorage.getItem("wstv_history") || "[]");
    const prev = Array.isArray(raw) ? raw : [];
    prev.push({
      event,
      data,
      time: new Date().toISOString(),
    });
    localStorage.setItem("wstv_history", JSON.stringify(prev.slice(-100)));
  } catch {}
}
