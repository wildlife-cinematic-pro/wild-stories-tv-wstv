import type { DurationLane, HookFamily, PerformanceSnapshot } from "@/types";

type PerformanceMemoryRow = {
  durationLane: DurationLane;
  hookFamily: HookFamily;
  watchTimeSeconds: number;
  completionRate: number;
  shareRate: number;
};

const DEFAULT_ROWS: PerformanceMemoryRow[] = [
  { durationLane: "short", hookFamily: "danger", watchTimeSeconds: 24, completionRate: 0.78, shareRate: 0.11 },
  { durationLane: "short", hookFamily: "danger", watchTimeSeconds: 25, completionRate: 0.8, shareRate: 0.1 },
  { durationLane: "short", hookFamily: "curiosity", watchTimeSeconds: 21, completionRate: 0.73, shareRate: 0.08 },
  { durationLane: "short", hookFamily: "curiosity", watchTimeSeconds: 22, completionRate: 0.74, shareRate: 0.09 },
  { durationLane: "short", hookFamily: "reversal", watchTimeSeconds: 20, completionRate: 0.71, shareRate: 0.09 },
  { durationLane: "short", hookFamily: "reversal", watchTimeSeconds: 21, completionRate: 0.72, shareRate: 0.1 },
  { durationLane: "medium", hookFamily: "danger", watchTimeSeconds: 31, completionRate: 0.68, shareRate: 0.11 },
  { durationLane: "medium", hookFamily: "danger", watchTimeSeconds: 32, completionRate: 0.69, shareRate: 0.12 },
  { durationLane: "medium", hookFamily: "curiosity", watchTimeSeconds: 33, completionRate: 0.7, shareRate: 0.11 },
  { durationLane: "medium", hookFamily: "curiosity", watchTimeSeconds: 34, completionRate: 0.71, shareRate: 0.12 },
  { durationLane: "medium", hookFamily: "reversal", watchTimeSeconds: 30, completionRate: 0.67, shareRate: 0.1 },
  { durationLane: "medium", hookFamily: "reversal", watchTimeSeconds: 31, completionRate: 0.68, shareRate: 0.11 },
  { durationLane: "long", hookFamily: "danger", watchTimeSeconds: 47, completionRate: 0.63, shareRate: 0.12 },
  { durationLane: "long", hookFamily: "danger", watchTimeSeconds: 48, completionRate: 0.64, shareRate: 0.13 },
  { durationLane: "long", hookFamily: "curiosity", watchTimeSeconds: 51, completionRate: 0.69, shareRate: 0.14 },
  { durationLane: "long", hookFamily: "curiosity", watchTimeSeconds: 53, completionRate: 0.7, shareRate: 0.15 },
  { durationLane: "long", hookFamily: "reversal", watchTimeSeconds: 49, completionRate: 0.66, shareRate: 0.13 },
  { durationLane: "long", hookFamily: "reversal", watchTimeSeconds: 50, completionRate: 0.67, shareRate: 0.14 },
];

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function buildSummary(snapshot: PerformanceSnapshot): string {
  return `${snapshot.durationLane.toUpperCase()} lane benchmark favors ${snapshot.hookFamily} hooks with ${round(
    snapshot.averageWatchTimeSeconds,
    1
  )}s average watch time, ${round(snapshot.completionRate * 100, 1)}% completion, and ${round(
    snapshot.shareRate * 100,
    1
  )}% share rate on Facebook-style reels.`;
}

export class PerformanceMemory {
  private rows: PerformanceMemoryRow[];

  constructor(rows: PerformanceMemoryRow[] = DEFAULT_ROWS) {
    this.rows = [...rows];
  }

  add(snapshot: PerformanceMemoryRow): void {
    this.rows.push(snapshot);
  }

  getSnapshot(durationLane: DurationLane, hookFamily: HookFamily): PerformanceSnapshot | null {
    const rows = this.rows.filter(
      (row) => row.durationLane === durationLane && row.hookFamily === hookFamily
    );
    if (rows.length === 0) return null;

    const averageWatchTimeSeconds =
      rows.reduce((total, row) => total + row.watchTimeSeconds, 0) / rows.length;
    const completionRate =
      rows.reduce((total, row) => total + row.completionRate, 0) / rows.length;
    const shareRate = rows.reduce((total, row) => total + row.shareRate, 0) / rows.length;

    const snapshot: PerformanceSnapshot = {
      durationLane,
      hookFamily,
      sampleSize: rows.length,
      averageWatchTimeSeconds: round(averageWatchTimeSeconds),
      completionRate: round(completionRate, 4),
      shareRate: round(shareRate, 4),
      summary: "",
    };

    snapshot.summary = buildSummary(snapshot);
    return snapshot;
  }

  getBestHookFamily(durationLane: DurationLane): HookFamily | null {
    const hookFamilies: HookFamily[] = ["danger", "curiosity", "reversal"];
    const ranked = hookFamilies
      .map((hookFamily) => this.getSnapshot(durationLane, hookFamily))
      .filter((snapshot): snapshot is PerformanceSnapshot => snapshot !== null)
      .sort((a, b) => {
        const aScore =
          a.averageWatchTimeSeconds * 0.55 +
          a.completionRate * 100 * 0.3 +
          a.shareRate * 100 * 0.15;
        const bScore =
          b.averageWatchTimeSeconds * 0.55 +
          b.completionRate * 100 * 0.3 +
          b.shareRate * 100 * 0.15;
        return bScore - aScore;
      });

    return ranked[0]?.hookFamily ?? null;
  }

  getTopSnapshotForDurationLane(durationLane: DurationLane): PerformanceSnapshot | null {
    const hookFamily = this.getBestHookFamily(durationLane);
    return hookFamily ? this.getSnapshot(durationLane, hookFamily) : null;
  }
}

export const defaultPerformanceMemory = new PerformanceMemory();

export function getPerformanceSnapshot(
  durationLane: DurationLane,
  hookFamily: HookFamily
): PerformanceSnapshot | null {
  return defaultPerformanceMemory.getSnapshot(durationLane, hookFamily);
}

export function getBestHookFamilyForDurationLane(
  durationLane: DurationLane
): HookFamily | null {
  return defaultPerformanceMemory.getBestHookFamily(durationLane);
}

export function getTopSnapshotForDurationLane(
  durationLane: DurationLane
): PerformanceSnapshot | null {
  return defaultPerformanceMemory.getTopSnapshotForDurationLane(durationLane);
}
