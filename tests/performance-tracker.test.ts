import { describe, expect, it } from "vitest";

import {
  buildBlankPerformanceTrackerEntry,
  serializePerformanceTrackerEntryAsCsvRow,
  serializePerformanceTrackerEntryAsJson,
} from "@/lib/performance-tracker";

describe("performance tracker helper", () => {
  it("builds a blank USA-ready template and exports JSON + CSV", () => {
    const entry = buildBlankPerformanceTrackerEntry({
      predator: "Wolf Pack",
      prey: "Bull Elk",
      arc: "Pack hunting strategy",
      durationLane: "medium",
      hookFamily: "danger",
      notes: "",
    });

    expect(entry.animalPair).toBe("Wolf Pack vs Bull Elk");
    expect(entry.durationLane).toBe("medium");
    expect(entry.hookFamily).toBe("danger");

    const json = serializePerformanceTrackerEntryAsJson(entry);
    const csv = serializePerformanceTrackerEntryAsCsvRow(entry, true);

    expect(json).toContain(`"durationLane": "medium"`);
    expect(csv).toContain("postedAtJST,postedAtEST,animalPair");
    expect(csv).toContain("Wolf Pack vs Bull Elk");
  });
});
