import { analyzeReelPerformance } from "@/lib/reels-performance-scoring";

import type { ReelPerformanceRecord } from "@/types";

export type ReelPerformanceGroupInsight = {
  label: string;
  count: number;
  averageScore: number;
};

export type ReelPerformanceInsights = {
  bestStoryMode: ReelPerformanceGroupInsight | null;
  bestViralLane: ReelPerformanceGroupInsight | null;
  bestHabitatRegion: ReelPerformanceGroupInsight | null;
  bestSubjectPair: ReelPerformanceGroupInsight | null;
  bestHookUsed: ReelPerformanceGroupInsight | null;
  bestCaptionUsed: ReelPerformanceGroupInsight | null;
  topRecords: Array<{ record: ReelPerformanceRecord; score: number }>;
  weakestRecords: Array<{ record: ReelPerformanceRecord; score: number }>;
};

function labelOrUnknown(value: string | undefined, fallback: string): string {
  return value?.trim() || fallback;
}

function subjectPair(record: ReelPerformanceRecord): string {
  return [record.subjectA, record.subjectB].filter(Boolean).join(" vs ") || "Unknown subjects";
}

function formatGroupLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function bestGroup(
  records: ReelPerformanceRecord[],
  getKey: (record: ReelPerformanceRecord) => string | undefined,
  fallback: string,
  shouldFormat = true
): ReelPerformanceGroupInsight | null {
  const groups = new Map<string, { count: number; totalScore: number }>();

  for (const record of records) {
    const key = labelOrUnknown(getKey(record), fallback);
    const score = analyzeReelPerformance(record).score;
    const existing = groups.get(key) ?? { count: 0, totalScore: 0 };
    groups.set(key, { count: existing.count + 1, totalScore: existing.totalScore + score });
  }

  const sorted = Array.from(groups.entries())
    .map(([label, value]) => ({
      label: shouldFormat ? formatGroupLabel(label) : label,
      count: value.count,
      averageScore: Math.round(value.totalScore / value.count),
    }))
    .sort((a, b) => b.averageScore - a.averageScore || b.count - a.count);

  return sorted[0] ?? null;
}

export function buildPerformanceInsights(
  records: ReelPerformanceRecord[]
): ReelPerformanceInsights {
  const ranked = records
    .map((record) => ({ record, score: analyzeReelPerformance(record).score }))
    .sort((a, b) => b.score - a.score || b.record.updatedAt.localeCompare(a.record.updatedAt));

  return {
    bestStoryMode: bestGroup(records, (record) => record.storyMode, "Unknown mode"),
    bestViralLane: bestGroup(records, (record) => record.viralLane, "Unknown lane"),
    bestHabitatRegion: bestGroup(records, (record) => record.habitatRegion, "Unknown habitat"),
    bestSubjectPair: bestGroup(records, subjectPair, "Unknown subjects", false),
    bestHookUsed: bestGroup(records, (record) => record.hookUsed, "No hook saved", false),
    bestCaptionUsed: bestGroup(records, (record) => record.captionUsed, "No caption saved", false),
    topRecords: ranked.slice(0, 5),
    weakestRecords: [...ranked].reverse().slice(0, 3),
  };
}
