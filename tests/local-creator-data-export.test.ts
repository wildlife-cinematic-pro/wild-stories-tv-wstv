import { describe, expect, it } from "vitest";

import { serializeLocalCreatorDataExport } from "@/lib/local-creator-data-export";

describe("local creator data export", () => {
  it("returns readable valid JSON with local-only metadata", () => {
    const json = serializeLocalCreatorDataExport({
      exportedAt: "2026-05-08T00:00:00.000Z",
      performanceRecords: [],
      abExperiments: [],
    });

    const parsed = JSON.parse(json) as {
      schemaVersion: number;
      exportedAt: string;
      source: string;
      note: string;
      performanceRecords: unknown[];
      abExperiments: unknown[];
    };

    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.exportedAt).toBe("2026-05-08T00:00:00.000Z");
    expect(parsed.source).toBe("wstv-local-browser");
    expect(parsed.note).toContain("No Facebook API");
    expect(parsed.performanceRecords).toEqual([]);
    expect(parsed.abExperiments).toEqual([]);
  });
});
