import type { Arc, ContentLane, HookFamily, PerformanceTrackerEntry } from "@/types";

export const PERFORMANCE_TRACKER_CSV_HEADER = [
  "postedAtJST",
  "postedAtEST",
  "animalPair",
  "predator",
  "prey",
  "habitat",
  "arc",
  "durationLane",
  "hookFamily",
  "contentLane",
  "firstHourViews",
  "threeSecondHoldRate",
  "averageWatchTimeSeconds",
  "completionRate",
  "usaFollowerPercent",
  "earningsUsd",
  "notes",
] as const;

type PerformanceTrackerSeed = Partial<
  Pick<
    PerformanceTrackerEntry,
    | "postedAtJST"
    | "postedAtEST"
    | "animalPair"
    | "predator"
    | "prey"
    | "habitat"
    | "durationLane"
    | "firstHourViews"
    | "threeSecondHoldRate"
    | "averageWatchTimeSeconds"
    | "completionRate"
    | "usaFollowerPercent"
    | "earningsUsd"
    | "notes"
  >
> & {
  arc?: Arc | "";
  hookFamily?: HookFamily | "";
  contentLane?: ContentLane | "";
};

function escapeCsvValue(value: string | number | ""): string {
  const text = String(value ?? "");
  if (/[,"\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildBlankPerformanceTrackerEntry(
  seed: PerformanceTrackerSeed = {}
): PerformanceTrackerEntry {
  const predator = seed.predator ?? "";
  const prey = seed.prey ?? "";
  const animalPair =
    seed.animalPair ?? [predator, prey].filter(Boolean).join(" vs ");

  return {
    postedAtJST: seed.postedAtJST ?? "",
    postedAtEST: seed.postedAtEST ?? "",
    animalPair,
    predator,
    prey,
    habitat: seed.habitat ?? "",
    arc: seed.arc ?? "",
    durationLane: seed.durationLane ?? "short",
    hookFamily: seed.hookFamily ?? "",
    contentLane: seed.contentLane ?? "",
    firstHourViews: seed.firstHourViews ?? "",
    threeSecondHoldRate: seed.threeSecondHoldRate ?? "",
    averageWatchTimeSeconds: seed.averageWatchTimeSeconds ?? "",
    completionRate: seed.completionRate ?? "",
    usaFollowerPercent: seed.usaFollowerPercent ?? "",
    earningsUsd: seed.earningsUsd ?? "",
    notes: seed.notes ?? "",
  };
}

export function serializePerformanceTrackerEntryAsJson(
  entry: PerformanceTrackerEntry
): string {
  return JSON.stringify(entry, null, 2);
}

export function serializePerformanceTrackerEntryAsCsvRow(
  entry: PerformanceTrackerEntry,
  includeHeader = false
): string {
  const values = PERFORMANCE_TRACKER_CSV_HEADER.map((key) =>
    escapeCsvValue(entry[key])
  ).join(",");

  return includeHeader
    ? `${PERFORMANCE_TRACKER_CSV_HEADER.join(",")}\n${values}`
    : values;
}
