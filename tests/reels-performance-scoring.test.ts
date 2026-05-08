import { describe, expect, it } from "vitest";

import { analyzeReelPerformance } from "@/lib/reels-performance-scoring";
import type { ReelPerformanceRecord } from "@/types";

function makeRecord(overrides: Partial<ReelPerformanceRecord> = {}): ReelPerformanceRecord {
  return {
    id: "record_1",
    generationId: "generation_1",
    createdAt: "2026-05-08T00:00:00.000Z",
    updatedAt: "2026-05-08T00:10:00.000Z",
    views: 50000,
    threeSecondViews: 36000,
    averageWatchTimeSeconds: 20,
    durationSeconds: 25,
    likes: 2800,
    comments: 450,
    shares: 900,
    saves: 600,
    followsGained: 250,
    ...overrides,
  };
}

describe("reels performance scoring", () => {
  it("scores a high-engagement record as winner or solid", () => {
    const insight = analyzeReelPerformance(makeRecord());

    expect(["winner", "solid"]).toContain(insight.status);
    expect(insight.score).toBeGreaterThanOrEqual(70);
    expect(insight.strengths.join(" ")).toMatch(/Watch time|Engagement|Share/i);
  });

  it("handles zero views safely without NaN or Infinity", () => {
    const insight = analyzeReelPerformance(
      makeRecord({
        views: 0,
        threeSecondViews: 0,
        averageWatchTimeSeconds: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0,
        followsGained: 0,
      })
    );

    expect(insight.status).toBe("weak");
    expect(Number.isFinite(insight.score)).toBe(true);
    expect(insight.engagementRate).toBeUndefined();
    expect(insight.shareRate).toBeUndefined();
    expect(insight.followRate).toBeUndefined();
  });

  it("returns finite rates for normal records", () => {
    const insight = analyzeReelPerformance(makeRecord({ views: 10000, shares: 100 }));

    expect(Number.isFinite(insight.score)).toBe(true);
    expect(Number.isFinite(insight.engagementRate)).toBe(true);
    expect(Number.isFinite(insight.shareRate)).toBe(true);
    expect(Number.isFinite(insight.retentionRate)).toBe(true);
  });
});
