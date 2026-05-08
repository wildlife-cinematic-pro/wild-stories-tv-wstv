import type { ABExperimentRecord, ReelPerformanceRecord } from "@/types";

export type LocalCreatorDataExport = {
  schemaVersion: 1;
  exportedAt: string;
  source: "wstv-local-browser";
  note: string;
  performanceRecords: ReelPerformanceRecord[];
  abExperiments: ABExperimentRecord[];
};

export function buildLocalCreatorDataExport({
  performanceRecords,
  abExperiments,
  exportedAt = new Date().toISOString(),
}: {
  performanceRecords: ReelPerformanceRecord[];
  abExperiments: ABExperimentRecord[];
  exportedAt?: string;
}): LocalCreatorDataExport {
  return {
    schemaVersion: 1,
    exportedAt,
    source: "wstv-local-browser",
    note: "Manual WSTV creator tracking export. No Facebook API, scraping, posting, or automatic generation is included.",
    performanceRecords,
    abExperiments,
  };
}

export function serializeLocalCreatorDataExport(input: {
  performanceRecords: ReelPerformanceRecord[];
  abExperiments: ABExperimentRecord[];
  exportedAt?: string;
}): string {
  return JSON.stringify(buildLocalCreatorDataExport(input), null, 2);
}
