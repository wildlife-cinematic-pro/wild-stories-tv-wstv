import type { GeneratedPackage } from "@/types";

import { buildFacebookPublishReadinessReport } from "@/lib/facebook-publish-readiness";

export type UsageEvent =
  | "copy_all_packs"
  | "export_txt"
  | "publish_action"
  | "view_output"
  | "open_workspace";

type UsageTrackedPackage = GeneratedPackage;

type UsagePayload = ReturnType<typeof buildUsagePayload> & {
  tab?: string;
};

type UsageRecord = {
  event: UsageEvent;
  data: UsagePayload | Record<string, unknown>;
  time: string;
};

type UsageSummary = {
  totalEvents: number;
  publishCount: number;
  avgScore: number;
  avgShareIntentScore: number;
  avgCommentDepthIntentScore: number;
  avgMonetisationSafetyScore: number;
  avgOwnedFunnelConversionIntentScore: number;
  topHooks: string[];
};

const STORAGE_KEY = "wstv_history";
const HISTORY_LIMIT = 100;
const DEDUPE_WINDOW_MS = 1000;

export function getUsageRisk(data: UsageTrackedPackage): "low" | "medium" | "high" {
  if ((data.publishGuardReport?.blockers?.length ?? 0) > 0) return "high";
  if (data.publishGuardReport?.isPass === false) return "high";
  if ((data.publishGuardReport?.warnings?.length ?? 0) > 0) return "medium";
  return "low";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function coerceNumericScore(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function averageRounded(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function getComparablePayload(data: unknown) {
  if (!isRecord(data)) return data;
  const comparable = { ...data };
  delete comparable.timestamp;
  return comparable;
}

/**
 * Builds the shared local analytics payload for a generated package.
 */
export function buildUsagePayload(data: UsageTrackedPackage) {
  const readiness = buildFacebookPublishReadinessReport(data);

  return {
    score: data.usAudienceScore?.total ?? 0,
    hook: data.hookFamily ?? "unknown",
    risk: getUsageRisk(data),
    predatorName: data.predatorName ?? "unknown",
    preyName: data.preyName ?? "unknown",
    arcName: data.arcName ?? "unknown",
    shareIntentScore: readiness.scores.shareIntentScore,
    commentDepthIntentScore: readiness.scores.commentDepthIntentScore,
    monetisationSafetyScore: readiness.scores.monetisationSafetyScore,
    ownedFunnelConversionIntentScore:
      readiness.scores.ownedFunnelConversionIntentScore,
    timestamp: new Date().toISOString(),
  };
}

function normalizeUsageRecord(value: unknown): UsageRecord | null {
  if (!isRecord(value)) return null;
  const event = value.event;
  const time = value.time;
  const data = isRecord(value.data) ? value.data : {};

  if (
    event !== "copy_all_packs" &&
    event !== "export_txt" &&
    event !== "publish_action" &&
    event !== "view_output" &&
    event !== "open_workspace"
  ) {
    return null;
  }

  return {
    event,
    data,
    time: typeof time === "string" ? time : new Date(0).toISOString(),
  };
}

function readUsageHistory(): UsageRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw
      .map(normalizeUsageRecord)
      .filter((entry): entry is UsageRecord => entry !== null);
  } catch {
    return [];
  }
}

function writeUsageHistory(history: UsageRecord[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(history.slice(-HISTORY_LIMIT))
    );
  } catch {}
}

/**
 * Records one local usage event without changing the storage backend.
 */
export function recordEvent(event: UsageEvent, data: unknown = {}) {
  if (typeof window === "undefined") return;

  try {
    const prev = readUsageHistory();
    const normalizedData = isRecord(data) ? data : {};
    const nextRecord: UsageRecord = {
      event,
      data: normalizedData,
      time: new Date().toISOString(),
    };
    const lastRecord = prev[prev.length - 1];

    if (lastRecord) {
      const timeDiff =
        new Date(nextRecord.time).getTime() - new Date(lastRecord.time).getTime();
      const sameEvent = lastRecord.event === nextRecord.event;
      const samePayload =
        JSON.stringify(getComparablePayload(lastRecord.data)) ===
        JSON.stringify(getComparablePayload(nextRecord.data));

      if (sameEvent && samePayload && timeDiff < DEDUPE_WINDOW_MS) {
        return;
      }
    }

    const nextHistory = [...prev, nextRecord];
    writeUsageHistory(nextHistory);
    window.dispatchEvent(new CustomEvent("wstv-usage-updated"));
  } catch {}
}

export function trackUsage(event: UsageEvent, data: unknown = {}) {
  recordEvent(event, data);
}

/**
 * Returns aggregate local usage analytics, including averages for the new Facebook intent scores.
 */
export function getSummary(): UsageSummary {
  const history = readUsageHistory();
  const scores = history
    .map((entry) =>
      typeof entry.data.score === "number" && Number.isFinite(entry.data.score)
        ? entry.data.score
        : null
    )
    .filter((value): value is number => value !== null);
  const shareIntentScores = history.map((entry) =>
    coerceNumericScore(entry.data.shareIntentScore)
  );
  const commentDepthIntentScores = history.map((entry) =>
    coerceNumericScore(entry.data.commentDepthIntentScore)
  );
  const monetisationSafetyScores = history.map((entry) =>
    coerceNumericScore(entry.data.monetisationSafetyScore)
  );
  const ownedFunnelConversionIntentScores = history.map((entry) =>
    coerceNumericScore(entry.data.ownedFunnelConversionIntentScore)
  );
  const hookCounts = new Map<string, number>();

  history.forEach((entry) => {
    if (typeof entry.data.hook !== "string" || !entry.data.hook.trim()) return;
    const hook = entry.data.hook.trim();
    hookCounts.set(hook, (hookCounts.get(hook) ?? 0) + 1);
  });

  const topHooks = [...hookCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([hook]) => hook);

  return {
    totalEvents: history.length,
    publishCount: history.filter((entry) => entry.event === "publish_action").length,
    avgScore: averageRounded(scores),
    avgShareIntentScore: averageRounded(shareIntentScores),
    avgCommentDepthIntentScore: averageRounded(commentDepthIntentScores),
    avgMonetisationSafetyScore: averageRounded(monetisationSafetyScores),
    avgOwnedFunnelConversionIntentScore: averageRounded(
      ownedFunnelConversionIntentScores
    ),
    topHooks,
  };
}

export function getUsageStats() {
  return getSummary();
}
