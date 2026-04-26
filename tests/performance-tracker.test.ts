import { describe, expect, it } from "vitest";

import {
  buildBlankPerformanceTrackerEntry,
  normalizePerformanceTrackerEntry,
  parsePerformanceTrackerEntryJson,
  serializePerformanceTrackerEntryAsCsvRow,
  serializePerformanceTrackerEntryAsJson,
} from "@/lib/performance-tracker";

describe("performance tracker helper", () => {
  it("builds a blank monetized Facebook template and exports JSON + CSV", () => {
    const entry = buildBlankPerformanceTrackerEntry({
      generationId: "generation_123",
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
    expect(entry.animalPair).toBe("Wolf Pack vs Bull Elk");
    expect(entry.durationLane).toBe("medium");
    expect(entry.hookFamily).toBe("danger");
    expect(entry.reach).toBe("");
    expect(entry.estimatedEarnings).toBe("");

    const json = serializePerformanceTrackerEntryAsJson(entry);
    const csv = serializePerformanceTrackerEntryAsCsvRow(entry, true);

    expect(json).toContain(`"conceptLabel": "Wolf Pack vs Bull Elk • Pack hunting strategy"`);
    expect(csv).toContain("generationId,postUrl,title,conceptLabel,publishedAt");
    expect(csv).toContain("Wolf Pack vs Bull Elk");
  });

  it("normalizes imported performance data and clears invalid numeric values", () => {
    const entry = normalizePerformanceTrackerEntry({
      generationId: "generation_456",
      predator: "Mountain Lion",
      prey: "Mule Deer",
      durationLane: "short",
      hookFamily: "danger",
      reach: "12000",
      threeSecondViews: 5400,
      rpm: "5.4",
      monetizedPlays: -2,
      linkClicks: "oops",
      notes: "Strong replay loop without bait.",
    });

    expect(entry.generationId).toBe("generation_456");
    expect(entry.reach).toBe(12000);
    expect(entry.threeSecondViews).toBe(5400);
    expect(entry.rpm).toBe(5.4);
    expect(entry.monetizedPlays).toBe("");
    expect(entry.linkClicks).toBe("");
    expect(entry.notes).toBe("Strong replay loop without bait.");
  });

  it("parses valid JSON imports and rejects invalid JSON", () => {
    const parsed = parsePerformanceTrackerEntryJson(
      JSON.stringify({
        generationId: "generation_789",
        predator: "Grizzly Bear",
        prey: "Bison",
        title: "Grizzly Bear pressure line",
        estimatedEarnings: 28,
      })
    );

    expect(parsed?.generationId).toBe("generation_789");
    expect(parsed?.estimatedEarnings).toBe(28);
    expect(parsePerformanceTrackerEntryJson("{ bad json" )).toBeNull();
  });
});
