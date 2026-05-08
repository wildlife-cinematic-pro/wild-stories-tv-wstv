import { describe, expect, it } from "vitest";

import { analyzeABExperiment, scoreABVariant } from "@/lib/ab-experiment-scoring";
import type { ABExperimentRecord, ABExperimentVariantRecord } from "@/types";

function makeVariant(
  overrides: Partial<ABExperimentVariantRecord> = {}
): ABExperimentVariantRecord {
  return {
    label: "A",
    hook: "The mother moved first",
    caption: "A protective Yellowstone moment builds fast.",
    hashtags: ["#WildlifeReels", "#AnimalStories", "#NatureReels", "#WildlifeDocumentary", "#USAReels"],
    testFocus: "Baseline hook.",
    expectedSignal: "Retention lift.",
    views: 20000,
    threeSecondViews: 15000,
    averageWatchTimeSeconds: 20,
    durationSeconds: 25,
    likes: 1400,
    comments: 160,
    shares: 420,
    saves: 260,
    followsGained: 80,
    ...overrides,
  };
}

function makeExperiment(
  variants: ABExperimentVariantRecord[]
): ABExperimentRecord {
  return {
    id: "abexp_1",
    generationId: "generation_1",
    createdAt: "2026-05-08T00:00:00.000Z",
    updatedAt: "2026-05-08T00:10:00.000Z",
    title: "Next A/B Test Plan",
    hypothesis: "Test which hook-caption pair wins.",
    status: "running",
    variants,
  };
}

describe("A/B experiment scoring", () => {
  it("scores variants with finite values", () => {
    const score = scoreABVariant(makeVariant());

    expect(Number.isFinite(score.score)).toBe(true);
    expect(score.score).toBeGreaterThan(0);
    expect(score.strengths.join(" ")).toMatch(/Retention|Engagement|Share|view/i);
  });

  it("handles zero views safely without NaN or Infinity", () => {
    const score = scoreABVariant(
      makeVariant({
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

    expect(score.score).toBe(0);
    expect(Number.isFinite(score.score)).toBe(true);
    expect(score.fixes.join(" ")).toMatch(/Add variant performance/i);
  });

  it("finds a winner when one variant is clearly highest", () => {
    const analysis = analyzeABExperiment(
      makeExperiment([
        makeVariant({ label: "A", views: 5000, shares: 20, saves: 10, averageWatchTimeSeconds: 10 }),
        makeVariant({ label: "B", views: 60000, shares: 1200, saves: 800, averageWatchTimeSeconds: 21 }),
        makeVariant({ label: "C", views: 4000, shares: 12, saves: 8, averageWatchTimeSeconds: 9 }),
      ])
    );

    expect(analysis.status).toBe("winner-found");
    expect(analysis.winnerLabel).toBe("B");
  });

  it("waits when no variants have views", () => {
    const analysis = analyzeABExperiment(
      makeExperiment([
        makeVariant({ label: "A", views: undefined }),
        makeVariant({ label: "B", views: undefined }),
        makeVariant({ label: "C", views: undefined }),
      ])
    );

    expect(analysis.status).toBe("waiting");
    expect(analysis.winnerLabel).toBeUndefined();
  });

  it("does not overclaim a winner when scores are close", () => {
    const analysis = analyzeABExperiment(
      makeExperiment([
        makeVariant({ label: "A", views: 10000, shares: 100, saves: 100 }),
        makeVariant({ label: "B", views: 10200, shares: 101, saves: 100 }),
        makeVariant({ label: "C", views: 9800, shares: 98, saves: 95 }),
      ])
    );

    expect(analysis.status).toBe("needs-more-data");
    expect(analysis.winnerLabel).toBeUndefined();
  });
});
