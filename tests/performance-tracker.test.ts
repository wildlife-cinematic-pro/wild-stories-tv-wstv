import { describe, expect, it } from "vitest";

import {
  buildBlankPerformanceTrackerEntry,
  normalizePerformanceTrackerEntry,
  parsePerformanceTrackerEntryJson,
  serializePerformanceTrackerEntriesAsCsv,
  serializePerformanceTrackerEntryAsCsvRow,
  serializePerformanceTrackerEntryAsJson,
} from "@/lib/performance-tracker";

describe("performance tracker helper", () => {
  it("builds a blank monetized Facebook template and exports JSON + CSV", () => {
    const entry = buildBlankPerformanceTrackerEntry({
      generationId: "generation_123",
      contentId: "content_123",
      predator: "Wolf Pack",
      prey: "Bull Elk",
      arc: "Pack hunting strategy",
      durationLane: "medium",
      hookFamily: "danger",
      title: "Wolf pack pressure closes fast",
      conceptLabel: "Wolf Pack vs Bull Elk • Pack hunting strategy",
      notes: "",
    });

    expect(entry.generationId).toBe("generation_123");
    expect(entry.contentId).toBe("content_123");
    expect(entry.animalPair).toBe("Wolf Pack vs Bull Elk");
    expect(entry.durationLane).toBe("medium");
    expect(entry.hookFamily).toBe("danger");
    expect(entry.reach).toBe("");
    expect(entry.estimatedEarnings).toBe("");
    expect(entry.firstSecondHookScore).toBe("");
    expect(entry.thumbnailQualityScore).toBe("");
    expect(entry.aiToolUsed).toBe("");
    expect(entry.promptVersion).toBe("");
    expect(entry.promptVersionKey).toBe("");
    expect(entry.promptVersionLabel).toBe("");
    expect(entry.whyWonLostSummary).toBe("");
    expect(entry.recordId).toBe("generation-123");

    const json = serializePerformanceTrackerEntryAsJson(entry);
    const csv = serializePerformanceTrackerEntryAsCsvRow(entry, true);

    expect(json).toContain(`"conceptLabel": "Wolf Pack vs Bull Elk • Pack hunting strategy"`);
    expect(csv).toContain("generationId,contentId,postUrl,title,conceptLabel,publishedAt");
    expect(csv).toContain(
      "notes,firstSecondHookScore,thumbnailQualityScore,aiToolUsed,promptVersion,promptVersionKey,promptVersionLabel,whyWonLostSummary"
    );
    expect(csv).toContain("Wolf Pack vs Bull Elk");
  });

  it("normalizes imported performance data and clears invalid numeric values", () => {
    const entry = normalizePerformanceTrackerEntry({
      source: "facebook_csv",
      generationId: "generation_456",
      contentId: "content_456",
      predator: "Mountain Lion",
      prey: "Mule Deer",
      durationLane: "short",
      hookFamily: "danger",
      reach: "12,000",
      views: "54,000",
      threeSecondViews: 5400,
      averageWatchTimeSeconds: "01:05",
      rpm: "$5.4",
      monetizedPlays: -2,
      linkClicks: "oops",
      firstSecondHookScore: "88",
      thumbnailQualityScore: "101",
      aiToolUsed: "Runway+Kling",
      promptVersion: "v12",
      promptVersionKey: "Mountain Lion|Mule Deer|Escape from danger",
      promptVersionLabel: "Winner A",
      whyWonLostSummary: "Likely won because of hook and cover.",
      notes: "Strong replay loop without bait.",
    });

    expect(entry.source).toBe("facebook_csv");
    expect(entry.generationId).toBe("generation_456");
    expect(entry.contentId).toBe("content_456");
    expect(entry.reach).toBe(12000);
    expect(entry.views).toBe(54000);
    expect(entry.threeSecondViews).toBe(5400);
    expect(entry.averageWatchTimeSeconds).toBe(65);
    expect(entry.rpm).toBe(5.4);
    expect(entry.monetizedPlays).toBe("");
    expect(entry.linkClicks).toBe("");
    expect(entry.firstSecondHookScore).toBe(88);
    expect(entry.thumbnailQualityScore).toBe("");
    expect(entry.aiToolUsed).toBe("Runway+Kling");
    expect(entry.promptVersion).toBe("v12");
    expect(entry.promptVersionKey).toBe("Mountain Lion|Mule Deer|Escape from danger");
    expect(entry.promptVersionLabel).toBe("Winner A");
    expect(entry.whyWonLostSummary).toBe("Likely won because of hook and cover.");
    expect(entry.notes).toBe("Strong replay loop without bait.");

    expect(normalizePerformanceTrackerEntry({ aiToolUsed: "Bad Tool" }).aiToolUsed).toBe("");
    expect(normalizePerformanceTrackerEntry({ firstSecondHookScore: 0 }).firstSecondHookScore).toBe("");
    expect(normalizePerformanceTrackerEntry({ thumbnailQualityScore: 100 }).thumbnailQualityScore).toBe(100);
  });

  it("parses valid JSON imports and rejects invalid JSON", () => {
    const parsed = parsePerformanceTrackerEntryJson(
      JSON.stringify({
        generationId: "generation_789",
        predator: "Grizzly Bear",
        prey: "Bison",
        title: "Grizzly Bear pressure line",
        estimatedEarnings: 28,
        firstSecondHookScore: 91,
      })
    );

    expect(parsed?.generationId).toBe("generation_789");
    expect(parsed?.estimatedEarnings).toBe(28);
    expect(parsed?.firstSecondHookScore).toBe(91);
    expect(parsed?.thumbnailQualityScore).toBe("");
    expect(parsed?.aiToolUsed).toBe("");
    expect(parsed?.promptVersion).toBe("");
    expect(parsed?.whyWonLostSummary).toBe("");
    expect(parsePerformanceTrackerEntryJson("{ bad json")).toBeNull();
  });

  it("exports multiple normalized rows as CSV", () => {
    const first = buildBlankPerformanceTrackerEntry({ generationId: "generation_1", title: "First post" });
    const second = buildBlankPerformanceTrackerEntry({ generationId: "generation_2", title: "Second post" });

    const csv = serializePerformanceTrackerEntriesAsCsv([first, second]);

    expect(csv).toContain("generationId,contentId,postUrl,title,conceptLabel,publishedAt");
    expect(csv).toContain("generation_1");
    expect(csv).toContain("generation_2");
  });
});
