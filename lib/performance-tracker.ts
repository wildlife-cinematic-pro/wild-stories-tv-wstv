import type { Arc, ContentLane, HookFamily, PerformanceTrackerEntry } from "@/types";

export const PERFORMANCE_TRACKER_CSV_HEADER = [
  "generationId",
  "postUrl",
  "title",
  "conceptLabel",
  "publishedAt",
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
  "reach",
  "firstHourViews",
  "threeSecondViews",
  "threeSecondHoldRate",
  "oneMinuteViews",
  "averageWatchTimeSeconds",
  "watchPercentage",
  "completionRate",
  "shares",
  "comments",
  "reactions",
  "followsGained",
  "profileVisits",
  "linkClicks",
  "usaFollowerPercent",
  "earningsUsd",
  "estimatedEarnings",
  "rpm",
  "monetizedPlays",
  "notes",
] as const;

type PerformanceTrackerSeed = Partial<
  Pick<
    PerformanceTrackerEntry,
    | "generationId"
    | "postUrl"
    | "title"
    | "conceptLabel"
    | "publishedAt"
    | "postedAtJST"
    | "postedAtEST"
    | "animalPair"
    | "predator"
    | "prey"
    | "habitat"
    | "durationLane"
    | "reach"
    | "firstHourViews"
    | "threeSecondViews"
    | "threeSecondHoldRate"
    | "oneMinuteViews"
    | "averageWatchTimeSeconds"
    | "watchPercentage"
    | "completionRate"
    | "shares"
    | "comments"
    | "reactions"
    | "followsGained"
    | "profileVisits"
    | "linkClicks"
    | "usaFollowerPercent"
    | "earningsUsd"
    | "estimatedEarnings"
    | "rpm"
    | "monetizedPlays"
    | "notes"
  >
> & {
  arc?: Arc | "";
  hookFamily?: HookFamily | "";
  contentLane?: ContentLane | "";
};

/** Coerces arbitrary input into a trimmed text value. */
function coerceTextValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Coerces arbitrary input into a non-negative numeric tracker value or an empty field. */
function coerceNumericValue(value: unknown): number | "" {
  if (value === "" || value === null || value === undefined) return "";
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(numeric) || numeric < 0) {
    return "";
  }

  return numeric;
}

/** Escapes a single CSV cell for export. */
function escapeCsvValue(value: string | number | "" | undefined): string {
  const text = String(value ?? "");
  if (/[,"\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/** Narrows unknown input to a plain record for safe normalization. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** Builds a blank local performance template that can be filled manually or imported later. */
export function buildBlankPerformanceTrackerEntry(
  seed: PerformanceTrackerSeed = {}
): PerformanceTrackerEntry {
  const predator = seed.predator ?? "";
  const prey = seed.prey ?? "";
  const animalPair =
    seed.animalPair ?? [predator, prey].filter(Boolean).join(" vs ");

  return {
    generationId: seed.generationId ?? "",
    postUrl: seed.postUrl ?? "",
    title: seed.title ?? "",
    conceptLabel: seed.conceptLabel ?? "",
    publishedAt: seed.publishedAt ?? "",
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
    reach: seed.reach ?? "",
    firstHourViews: seed.firstHourViews ?? "",
    threeSecondViews: seed.threeSecondViews ?? "",
    threeSecondHoldRate: seed.threeSecondHoldRate ?? "",
    oneMinuteViews: seed.oneMinuteViews ?? "",
    averageWatchTimeSeconds: seed.averageWatchTimeSeconds ?? "",
    watchPercentage: seed.watchPercentage ?? "",
    completionRate: seed.completionRate ?? "",
    shares: seed.shares ?? "",
    comments: seed.comments ?? "",
    reactions: seed.reactions ?? "",
    followsGained: seed.followsGained ?? "",
    profileVisits: seed.profileVisits ?? "",
    linkClicks: seed.linkClicks ?? "",
    usaFollowerPercent: seed.usaFollowerPercent ?? "",
    earningsUsd: seed.earningsUsd ?? "",
    estimatedEarnings: seed.estimatedEarnings ?? "",
    rpm: seed.rpm ?? "",
    monetizedPlays: seed.monetizedPlays ?? "",
    notes: seed.notes ?? "",
  };
}

/** Normalizes imported or stored performance data into the local tracker shape. */
export function normalizePerformanceTrackerEntry(
  value: unknown,
  seed: PerformanceTrackerSeed = {}
): PerformanceTrackerEntry {
  const base = buildBlankPerformanceTrackerEntry(seed);
  const source = isRecord(value) ? value : {};

  return {
    generationId: coerceTextValue(source.generationId) || base.generationId,
    postUrl: coerceTextValue(source.postUrl) || base.postUrl,
    title: coerceTextValue(source.title) || base.title,
    conceptLabel: coerceTextValue(source.conceptLabel) || base.conceptLabel,
    publishedAt: coerceTextValue(source.publishedAt) || base.publishedAt,
    postedAtJST: coerceTextValue(source.postedAtJST) || base.postedAtJST,
    postedAtEST: coerceTextValue(source.postedAtEST) || base.postedAtEST,
    animalPair: coerceTextValue(source.animalPair) || base.animalPair,
    predator: coerceTextValue(source.predator) || base.predator,
    prey: coerceTextValue(source.prey) || base.prey,
    habitat: coerceTextValue(source.habitat) || base.habitat,
    arc: (coerceTextValue(source.arc) as Arc | "") || base.arc,
    durationLane:
      source.durationLane === "medium" ||
      source.durationLane === "long" ||
      source.durationLane === "short"
        ? source.durationLane
        : base.durationLane,
    hookFamily:
      source.hookFamily === "danger" ||
      source.hookFamily === "curiosity" ||
      source.hookFamily === "reversal"
        ? source.hookFamily
        : base.hookFamily,
    contentLane:
      source.contentLane === "Auto" ||
      source.contentLane === "Pack Hunt" ||
      source.contentLane === "Defender" ||
      source.contentLane === "Fishing Strike" ||
      source.contentLane === "Rut Battle" ||
      source.contentLane === "Escape"
        ? source.contentLane
        : base.contentLane,
    reach: coerceNumericValue(source.reach),
    firstHourViews: coerceNumericValue(source.firstHourViews),
    threeSecondViews: coerceNumericValue(source.threeSecondViews),
    threeSecondHoldRate: coerceNumericValue(source.threeSecondHoldRate),
    oneMinuteViews: coerceNumericValue(source.oneMinuteViews),
    averageWatchTimeSeconds: coerceNumericValue(source.averageWatchTimeSeconds),
    watchPercentage: coerceNumericValue(source.watchPercentage),
    completionRate: coerceNumericValue(source.completionRate),
    shares: coerceNumericValue(source.shares),
    comments: coerceNumericValue(source.comments),
    reactions: coerceNumericValue(source.reactions),
    followsGained: coerceNumericValue(source.followsGained),
    profileVisits: coerceNumericValue(source.profileVisits),
    linkClicks: coerceNumericValue(source.linkClicks),
    usaFollowerPercent: coerceNumericValue(source.usaFollowerPercent),
    earningsUsd: coerceNumericValue(source.earningsUsd),
    estimatedEarnings: coerceNumericValue(source.estimatedEarnings),
    rpm: coerceNumericValue(source.rpm),
    monetizedPlays: coerceNumericValue(source.monetizedPlays),
    notes: coerceTextValue(source.notes) || base.notes,
  };
}

/** Parses a pasted JSON payload into a normalized performance record or returns null if the JSON is invalid. */
export function parsePerformanceTrackerEntryJson(
  raw: string,
  seed: PerformanceTrackerSeed = {}
): PerformanceTrackerEntry | null {
  try {
    return normalizePerformanceTrackerEntry(JSON.parse(raw), seed);
  } catch {
    return null;
  }
}

/** Serializes a performance tracker entry as pretty JSON for copy/export. */
export function serializePerformanceTrackerEntryAsJson(
  entry: PerformanceTrackerEntry
): string {
  return JSON.stringify(entry, null, 2);
}

/** Serializes a performance tracker entry as a CSV row, with an optional header. */
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
