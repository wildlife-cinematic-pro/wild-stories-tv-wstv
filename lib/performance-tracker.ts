import type {
  Arc,
  ContentLane,
  HookFamily,
  PerformanceTrackerAiToolUsed,
  PerformanceTrackerEntry,
} from "@/types";

export const PERFORMANCE_TRACKER_CSV_HEADER = [
  "generationId",
  "contentId",
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
  "views",
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
  "firstSecondHookScore",
  "thumbnailQualityScore",
  "aiToolUsed",
  "promptVersion",
  "promptVersionKey",
  "promptVersionLabel",
  "whyWonLostSummary",
] as const;

const VALID_ARCS: Arc[] = [
  "Ambush attack",
  "Predator vs predator fight",
  "Chase and takedown",
  "Escape from danger",
  "Territory dominance battle",
  "Pack hunting strategy",
  "Defender stands ground",
  "Giant vs giant clash",
];

export const PERFORMANCE_TRACKER_AI_TOOL_OPTIONS: PerformanceTrackerAiToolUsed[] = [
  "Kling",
  "Runway",
  "Seedance",
  "Runway+Kling",
  "Runway+Seedance",
  "Kling+Seedance",
  "Other",
];

type PerformanceTrackerSeed = Partial<
  Pick<
    PerformanceTrackerEntry,
    | "recordId"
    | "source"
    | "generationId"
    | "contentId"
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
    | "views"
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
    | "firstSecondHookScore"
    | "thumbnailQualityScore"
    | "aiToolUsed"
    | "promptVersion"
    | "promptVersionKey"
    | "promptVersionLabel"
    | "whyWonLostSummary"
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

  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0 ? value : "";
  }

  if (typeof value !== "string") return "";

  const trimmed = value.trim();
  if (!trimmed) return "";

  const normalized = trimmed.replace(/[,$%]/g, "").replace(/\s+/g, " ").trim();
  const numeric = Number(normalized);

  if (!Number.isFinite(numeric) || numeric < 0) {
    return "";
  }

  return numeric;
}

/** Coerces score fields into the supported 1-100 range. */
function coerceScoreValue(value: unknown): number | "" {
  const numeric = coerceNumericValue(value);
  if (numeric === "") return "";
  return numeric >= 1 && numeric <= 100 ? numeric : "";
}

/** Coerces duration-like strings such as mm:ss into seconds for average watch time. */
function coerceDurationSecondsValue(value: unknown): number | "" {
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0 ? value : "";
  }

  if (typeof value !== "string") {
    return coerceNumericValue(value);
  }

  const trimmed = value.trim();
  if (!trimmed) return "";

  if (/^\d+(?:\.\d+)?$/.test(trimmed)) {
    return coerceNumericValue(trimmed);
  }

  const parts = trimmed.split(":").map((part) => Number(part));
  if (parts.some((part) => !Number.isFinite(part) || part < 0)) {
    return "";
  }

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  return "";
}

/** Escapes a single CSV cell for export. */
function escapeCsvValue(value: string | number | "" | undefined): string {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/** Narrows unknown input to a plain record for safe normalization. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** Returns a stable local record id for persisted performance rows. */
export function buildPerformanceTrackerRecordId(
  value: Partial<PerformanceTrackerEntry>
): string {
  const explicit = coerceTextValue(value.recordId);
  if (explicit) return explicit;

  const candidates = [
    coerceTextValue(value.generationId),
    coerceTextValue(value.contentId),
    coerceTextValue(value.postUrl),
    [coerceTextValue(value.title), coerceTextValue(value.publishedAt)]
      .filter(Boolean)
      .join("|"),
    [coerceTextValue(value.conceptLabel), coerceTextValue(value.animalPair)]
      .filter(Boolean)
      .join("|"),
  ]
    .filter(Boolean)
    .map((part) =>
      part.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    );

  return candidates[0] ?? "";
}

/** Narrows arbitrary source values into the supported local storage source labels. */
function normalizePerformanceTrackerSource(
  value: unknown,
  fallback: PerformanceTrackerEntry["source"] = "manual"
): PerformanceTrackerEntry["source"] {
  return value === "facebook_csv" || value === "manual" ? value : fallback;
}

/** Narrows arbitrary arc text into the supported tracker arc union. */
function normalizePerformanceTrackerArc(
  value: unknown,
  fallback: Arc | "" = ""
): Arc | "" {
  const text = coerceTextValue(value);
  return VALID_ARCS.includes(text as Arc) ? (text as Arc) : fallback;
}

/** Narrows arbitrary AI tool text into the supported tracker route labels. */
function normalizeAiToolUsed(
  value: unknown,
  fallback: PerformanceTrackerAiToolUsed | "" = ""
): PerformanceTrackerAiToolUsed | "" {
  const text = coerceTextValue(value);
  return PERFORMANCE_TRACKER_AI_TOOL_OPTIONS.includes(text as PerformanceTrackerAiToolUsed)
    ? (text as PerformanceTrackerAiToolUsed)
    : fallback;
}

/** Finalizes a normalized record with derived ids and animal-pair fallbacks. */
function finalizePerformanceTrackerEntry(
  value: PerformanceTrackerEntry
): PerformanceTrackerEntry {
  const animalPair =
    value.animalPair || [value.predator, value.prey].filter(Boolean).join(" vs ");

  return {
    ...value,
    animalPair,
    recordId: buildPerformanceTrackerRecordId({ ...value, animalPair }),
    source: normalizePerformanceTrackerSource(value.source),
  };
}

/** Builds a blank local performance template that can be filled manually or imported later. */
export function buildBlankPerformanceTrackerEntry(
  seed: PerformanceTrackerSeed = {}
): PerformanceTrackerEntry {
  const predator = seed.predator ?? "";
  const prey = seed.prey ?? "";
  const animalPair = seed.animalPair ?? [predator, prey].filter(Boolean).join(" vs ");

  return finalizePerformanceTrackerEntry({
    recordId: seed.recordId,
    source: normalizePerformanceTrackerSource(seed.source, "manual"),
    generationId: seed.generationId ?? "",
    contentId: seed.contentId ?? "",
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
    views: seed.views ?? "",
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
    firstSecondHookScore: seed.firstSecondHookScore ?? "",
    thumbnailQualityScore: seed.thumbnailQualityScore ?? "",
    aiToolUsed: normalizeAiToolUsed(seed.aiToolUsed),
    promptVersion: seed.promptVersion ?? "",
    promptVersionKey: seed.promptVersionKey ?? "",
    promptVersionLabel: seed.promptVersionLabel ?? "",
    whyWonLostSummary: seed.whyWonLostSummary ?? "",
    notes: seed.notes ?? "",
  });
}

/** Normalizes imported or stored performance data into the local tracker shape. */
export function normalizePerformanceTrackerEntry(
  value: unknown,
  seed: PerformanceTrackerSeed = {}
): PerformanceTrackerEntry {
  const base = buildBlankPerformanceTrackerEntry(seed);
  const source = isRecord(value) ? value : {};

  return finalizePerformanceTrackerEntry({
    recordId: coerceTextValue(source.recordId) || base.recordId,
    source: normalizePerformanceTrackerSource(source.source, base.source),
    generationId: coerceTextValue(source.generationId) || base.generationId,
    contentId: coerceTextValue(source.contentId) || base.contentId,
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
    arc: normalizePerformanceTrackerArc(source.arc, base.arc),
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
    views: coerceNumericValue(source.views),
    firstHourViews: coerceNumericValue(source.firstHourViews),
    threeSecondViews: coerceNumericValue(source.threeSecondViews),
    threeSecondHoldRate: coerceNumericValue(source.threeSecondHoldRate),
    oneMinuteViews: coerceNumericValue(source.oneMinuteViews),
    averageWatchTimeSeconds: coerceDurationSecondsValue(source.averageWatchTimeSeconds),
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
    firstSecondHookScore: coerceScoreValue(source.firstSecondHookScore),
    thumbnailQualityScore: coerceScoreValue(source.thumbnailQualityScore),
    aiToolUsed: normalizeAiToolUsed(source.aiToolUsed, base.aiToolUsed),
    promptVersion: coerceTextValue(source.promptVersion) || base.promptVersion,
    promptVersionKey: coerceTextValue(source.promptVersionKey) || base.promptVersionKey,
    promptVersionLabel: coerceTextValue(source.promptVersionLabel) || base.promptVersionLabel,
    whyWonLostSummary: coerceTextValue(source.whyWonLostSummary) || base.whyWonLostSummary,
    notes: coerceTextValue(source.notes) || base.notes,
  });
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

/** Serializes multiple performance tracker entries as pretty JSON. */
export function serializePerformanceTrackerEntriesAsJson(
  entries: PerformanceTrackerEntry[]
): string {
  return JSON.stringify(entries, null, 2);
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

/** Serializes multiple performance tracker entries as CSV text. */
export function serializePerformanceTrackerEntriesAsCsv(
  entries: PerformanceTrackerEntry[],
  includeHeader = true
): string {
  const rows = entries.map((entry) => serializePerformanceTrackerEntryAsCsvRow(entry));
  return includeHeader
    ? [PERFORMANCE_TRACKER_CSV_HEADER.join(","), ...rows].join("\n")
    : rows.join("\n");
}
