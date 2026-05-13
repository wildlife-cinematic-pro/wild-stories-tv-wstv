import type {
  ActualFacebookPerformanceScores,
  CsvGrowthDoctorFinding,
  CsvGrowthDoctorSummary,
  GeneratedPackage,
  GrowthDoctorActionPlan,
  GrowthDoctorRemixAction,
  GrowthDoctorRewriteVariant,
  PerformanceTrackerEntry,
} from "@/types";

import { buildActualFacebookPerformanceScores } from "@/lib/facebook-monetization-engine";
import { buildObservationalCTA } from "@/lib/platform-packs/facebook";
import { normalizePerformanceTrackerEntry } from "@/lib/performance-tracker";

export type FacebookInsightsImportResult = {
  records: PerformanceTrackerEntry[];
  warnings: string[];
};

export type FacebookInsightsMatchResult = {
  record: PerformanceTrackerEntry | null;
  matchedBy: "generationId" | "postUrl" | "title" | "conceptLabel" | "unmatched";
  unmatchedCount: number;
};

const HEADER_ALIASES: Record<string, keyof PerformanceTrackerEntry> = {
  generationid: "generationId",
  generation_id: "generationId",
  contentid: "contentId",
  postid: "contentId",
  post_id: "contentId",
  posturl: "postUrl",
  permalink: "postUrl",
  url: "postUrl",
  title: "title",
  description: "title",
  conceptlabel: "conceptLabel",
  publishedat: "publishedAt",
  date: "publishedAt",
  createdtime: "publishedAt",
  created_time: "publishedAt",
  reach: "reach",
  peoplereached: "reach",
  people_reached: "reach",
  views: "views",
  plays: "views",
  videoviews: "views",
  video_views: "views",
  threesecondviews: "threeSecondViews",
  three_second_views: "threeSecondViews",
  '3secondviews': "threeSecondViews",
  '3secondvideoviews': "threeSecondViews",
  oneminuteviews: "oneMinuteViews",
  one_minute_views: "oneMinuteViews",
  '1minutevideoviews': "oneMinuteViews",
  averagewatchtimeseconds: "averageWatchTimeSeconds",
  averagewatchtime: "averageWatchTimeSeconds",
  avgwatchtime: "averageWatchTimeSeconds",
  avg_watch_time: "averageWatchTimeSeconds",
  watchpercentage: "watchPercentage",
  completionrate: "watchPercentage",
  averagepercentagewatched: "watchPercentage",
  shares: "shares",
  comments: "comments",
  reactions: "reactions",
  likes: "reactions",
  followsgained: "followsGained",
  newfollowers: "followsGained",
  new_followers: "followsGained",
  follows: "followsGained",
  pagevisits: "profileVisits",
  profilevisits: "profileVisits",
  profile_visits: "profileVisits",
  linkclicks: "linkClicks",
  link_clicks: "linkClicks",
  estimatedearnings: "estimatedEarnings",
  earnings: "estimatedEarnings",
  rpm: "rpm",
  revenueper1000plays: "rpm",
  monetizedplays: "monetizedPlays",
  firstsecondhookscore: "firstSecondHookScore",
  first1secondhookscore: "firstSecondHookScore",
  hookscore: "firstSecondHookScore",
  hookqualityscore: "firstSecondHookScore",
  thumbnailqualityscore: "thumbnailQualityScore",
  thumbnailscore: "thumbnailQualityScore",
  coverqualityscore: "thumbnailQualityScore",
  aitoolused: "aiToolUsed",
  aiused: "aiToolUsed",
  toolused: "aiToolUsed",
  promptversion: "promptVersion",
  promptversionkey: "promptVersionKey",
  promptversionlabel: "promptVersionLabel",
  whywonlost: "whyWonLostSummary",
  whywonlostsummary: "whyWonLostSummary",
  wonlostsummary: "whyWonLostSummary",
  diagnosis: "whyWonLostSummary",
  notes: "notes",
};

const NUMERIC_FIELDS = new Set<keyof PerformanceTrackerEntry>([
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
  "firstSecondHookScore",
  "thumbnailQualityScore",
]);

/** Normalizes a CSV header into a comparison-friendly alias key. */
function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
}

/** Normalizes free text for safe fuzzy comparisons. */
function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

/** Returns true when a field contains a non-empty raw value. */
function hasRawValue(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** Parses raw CSV text locally, including quoted values and newlines inside fields. */
function parseCsvRows(input: string): string[][] {
  const rows: string[][] = [];
  let currentCell = "";
  let currentRow: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        currentCell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentCell = "";
      currentRow = [];
      continue;
    }

    currentCell += char;
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  return rows.filter((row) => row.some((cell) => cell.trim().length > 0));
}

/** Builds the package-side candidate strings used when fuzzy matching imported rows. */
function getPackageMatchCandidates(pkg: GeneratedPackage): {
  title: string[];
  conceptLabel: string[];
} {
  const titleCandidates = [
    pkg.platformPack?.facebook.hook,
    pkg.hook,
    pkg.hook2026?.[0],
  ]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map(normalizeText);

  const conceptText = [pkg.predatorName, pkg.preyName].filter(Boolean).join(" vs ");
  const conceptLabel = [conceptText, pkg.arcName].filter(Boolean).join(" • ");

  return {
    title: titleCandidates,
    conceptLabel: [conceptLabel, conceptText]
      .filter((value) => value.trim().length > 0)
      .map(normalizeText),
  };
}

/** Returns a cautious fuzzy-match score between two short Facebook content labels. */
function getFuzzyMatchScore(left: string, right: string): number {
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.length >= 18 && (left.includes(right) || right.includes(left))) return 0.92;

  const leftTokens = new Set(left.split(" ").filter(Boolean));
  const rightTokens = new Set(right.split(" ").filter(Boolean));
  const overlap = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const baseline = Math.max(leftTokens.size, rightTokens.size, 1);
  return overlap / baseline;
}

/** Parses pasted Facebook Insights CSV text into normalized local performance records. */
export function importFacebookInsightsCsv(
  csvText: string
): FacebookInsightsImportResult {
  const rows = parseCsvRows(csvText.trim());
  if (rows.length === 0) {
    return { records: [], warnings: ["No CSV rows found."] };
  }

  const [headerRow, ...dataRows] = rows;
  const headers = headerRow.map((header) => HEADER_ALIASES[normalizeHeader(header)] ?? null);
  const records: PerformanceTrackerEntry[] = [];
  const warnings: string[] = [];

  if (headers.every((header) => header === null)) {
    warnings.push("No supported Facebook Insights columns were recognized in the pasted CSV.");
  }

  dataRows.forEach((row, rowIndex) => {
    const raw: Record<string, string> = {};

    headers.forEach((header, headerIndex) => {
      if (!header) return;
      const cell = row[headerIndex]?.trim() ?? "";
      if (!cell) return;
      if (!raw[header]) {
        raw[header] = cell;
      }
    });

    if (Object.keys(raw).length === 0) {
      return;
    }

    const normalized = normalizePerformanceTrackerEntry(
      {
        ...raw,
        source: "facebook_csv",
        generationId: raw.generationId ?? "",
        contentId: raw.contentId ?? "",
      },
      {
        source: "facebook_csv",
        generationId: raw.generationId ?? "",
        contentId: raw.contentId ?? "",
        postUrl: raw.postUrl ?? "",
        title: raw.title ?? "",
        conceptLabel: raw.conceptLabel ?? "",
        publishedAt: raw.publishedAt ?? "",
        notes: raw.notes ?? "",
      }
    );

    if (
      !normalized.generationId &&
      !normalized.contentId &&
      !normalized.postUrl &&
      !normalized.title &&
      !normalized.conceptLabel
    ) {
      warnings.push(`Row ${rowIndex + 2}: missing identifier fields (generationId/contentId/postUrl/title/conceptLabel).`);
    }

    Object.entries(raw).forEach(([key, value]) => {
      if (!hasRawValue(value)) return;
      if (!NUMERIC_FIELDS.has(key as keyof PerformanceTrackerEntry)) return;
      const normalizedValue = normalized[key as keyof PerformanceTrackerEntry];
      if (normalizedValue === "") {
        warnings.push(`Row ${rowIndex + 2}: could not parse numeric field \"${key}\" from \"${value}\".`);
      }
    });

    records.push(normalized);
  });

  return {
    records,
    warnings,
  };
}

/** Finds the best locally stored Facebook performance record for the current generated package. */
export function matchFacebookInsightsRecord(
  records: PerformanceTrackerEntry[],
  pkg: GeneratedPackage,
  generationId: string
): FacebookInsightsMatchResult {
  const importedRecords = records.filter((record) => record.source === "facebook_csv");
  const exactGenerationMatch = importedRecords.find(
    (record) => record.generationId?.trim() && record.generationId === generationId.trim()
  );
  if (exactGenerationMatch) {
    return {
      record: exactGenerationMatch,
      matchedBy: "generationId",
      unmatchedCount: importedRecords.filter((record) => record.recordId !== exactGenerationMatch.recordId).length,
    };
  }

  const currentManualRecord = records.find(
    (record) => record.source !== "facebook_csv" && record.generationId === generationId.trim()
  );

  if (currentManualRecord?.postUrl?.trim()) {
    const exactPostUrlMatch = importedRecords.find(
      (record) => record.postUrl?.trim() && record.postUrl === currentManualRecord.postUrl
    );
    if (exactPostUrlMatch) {
      return {
        record: exactPostUrlMatch,
        matchedBy: "postUrl",
        unmatchedCount: importedRecords.filter(
          (record) => record.recordId !== exactPostUrlMatch.recordId
        ).length,
      };
    }
  }

  const { title: titleCandidates, conceptLabel: conceptCandidates } = getPackageMatchCandidates(pkg);

  let bestTitleMatch: PerformanceTrackerEntry | null = null;
  let bestTitleScore = 0;
  for (const record of importedRecords) {
    const title = normalizeText(record.title ?? "");
    if (!title) continue;
    const score = Math.max(...titleCandidates.map((candidate) => getFuzzyMatchScore(candidate, title)), 0);
    if (score > bestTitleScore) {
      bestTitleScore = score;
      bestTitleMatch = record;
    }
  }
  if (bestTitleMatch && bestTitleScore >= 0.68) {
    return {
      record: bestTitleMatch,
      matchedBy: "title",
      unmatchedCount: importedRecords.filter((record) => record.recordId !== bestTitleMatch?.recordId).length,
    };
  }

  let bestConceptMatch: PerformanceTrackerEntry | null = null;
  let bestConceptScore = 0;
  for (const record of importedRecords) {
    const concept = normalizeText(record.conceptLabel ?? record.animalPair ?? "");
    if (!concept) continue;
    const score = Math.max(...conceptCandidates.map((candidate) => getFuzzyMatchScore(candidate, concept)), 0);
    if (score > bestConceptScore) {
      bestConceptScore = score;
      bestConceptMatch = record;
    }
  }
  if (bestConceptMatch && bestConceptScore >= 0.72) {
    return {
      record: bestConceptMatch,
      matchedBy: "conceptLabel",
      unmatchedCount: importedRecords.filter((record) => record.recordId !== bestConceptMatch?.recordId).length,
    };
  }

  return {
    record: currentManualRecord ?? null,
    matchedBy: currentManualRecord ? "generationId" : "unmatched",
    unmatchedCount: importedRecords.length,
  };
}


/** Returns true when an uploaded file looks like a Facebook Insights CSV. */
export function isFacebookInsightsCsvFile(fileLike: {
  name: string;
  type?: string | null;
}): boolean {
  const fileName = fileLike.name.toLowerCase();
  const mimeType = (fileLike.type ?? "").toLowerCase();
  return fileName.endsWith(".csv") || mimeType === "text/csv";
}

/** Reads a numeric performance metric and normalizes empty values to null. */
function readNumericMetric(value: number | "" | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Safely divides two metrics and returns null when the denominator is missing or invalid. */
function safeMetricRate(numerator: number | null, denominator: number | null): number | null {
  if (numerator === null || denominator === null || denominator <= 0) {
    return null;
  }

  return numerator / denominator;
}

/** Returns true when a record has enough imported metrics to support actual-score analysis. */
function hasActualPerformanceData(scores: ActualFacebookPerformanceScores): boolean {
  return scores.band !== "Insufficient data";
}

/** Formats a human-friendly record label for Growth Doctor findings and exports. */
function formatGrowthDoctorRecordLabel(record: PerformanceTrackerEntry | null): string {
  if (!record) return "Insufficient data";

  return (
    record.title?.trim() ||
    record.conceptLabel?.trim() ||
    record.postUrl?.trim() ||
    record.generationId?.trim() ||
    record.contentId?.trim() ||
    "Imported Facebook post"
  );
}

/** Formats a short metric string for Growth Doctor summaries. */
function formatGrowthDoctorMetric(label: string, value: number | null, suffix = ""): string {
  if (value === null) return `${label}: Insufficient data`;
  const formatted = Number.isInteger(value) ? value.toLocaleString() : value.toFixed(2);
  return `${label}: ${formatted}${suffix}`;
}

/** Formats a percentage metric for Growth Doctor findings. */
function formatGrowthDoctorPercent(label: string, value: number | null): string {
  if (value === null) return `${label}: Insufficient data`;
  return `${label}: ${(value * 100).toFixed(2)}%`;
}

/** Creates a consistent Growth Doctor finding payload. */
function buildGrowthDoctorFinding(
  id: CsvGrowthDoctorFinding["id"],
  label: string,
  record: PerformanceTrackerEntry | null,
  keyMetric: string,
  diagnosis: string,
  recommendedAction: string
): CsvGrowthDoctorFinding {
  return {
    id,
    label,
    record,
    keyMetric,
    diagnosis,
    recommendedAction,
  };
}

/** Computes all actual-performance helper values needed by the Growth Doctor dashboard. */
function getGrowthDoctorMetrics(record: PerformanceTrackerEntry) {
  const actualScores = buildActualFacebookPerformanceScores(record);
  const reach = readNumericMetric(record.reach);
  const views = readNumericMetric(record.views);
  const threeSecondViews = readNumericMetric(record.threeSecondViews);
  const shares = readNumericMetric(record.shares);
  const comments = readNumericMetric(record.comments);
  const followsGained = readNumericMetric(record.followsGained);
  const estimatedEarnings =
    readNumericMetric(record.estimatedEarnings) ?? readNumericMetric(record.earningsUsd);
  const rpm = readNumericMetric(record.rpm);

  return {
    actualScores,
    reach,
    rpm,
    estimatedEarnings,
    shareRate: safeMetricRate(shares, reach),
    commentRate: safeMetricRate(comments, reach),
    followRate: safeMetricRate(followsGained, reach),
    threeSecondViewRate: safeMetricRate(threeSecondViews, views),
  };
}

/** Finds the imported record with the strongest overall actual-performance score. */
export function findBestPerformingRecord(
  records: PerformanceTrackerEntry[]
): PerformanceTrackerEntry | null {
  const ranked = records
    .map((record) => ({ record, metrics: getGrowthDoctorMetrics(record) }))
    .filter(({ metrics }) => hasActualPerformanceData(metrics.actualScores))
    .sort(
      (left, right) =>
        right.metrics.actualScores.actualPerformanceScore -
        left.metrics.actualScores.actualPerformanceScore
    );

  return ranked[0]?.record ?? null;
}

/** Finds the imported record with the weakest actual-retention score. */
export function findWorstRetentionRecord(
  records: PerformanceTrackerEntry[]
): PerformanceTrackerEntry | null {
  const ranked = records
    .map((record) => ({ record, metrics: getGrowthDoctorMetrics(record) }))
    .filter(({ metrics }) => hasActualPerformanceData(metrics.actualScores))
    .sort(
      (left, right) =>
        left.metrics.actualScores.actualRetentionScore -
        right.metrics.actualScores.actualRetentionScore
    );

  return ranked[0]?.record ?? null;
}

/** Finds the imported record with the highest RPM. */
export function findHighestRpmRecord(
  records: PerformanceTrackerEntry[]
): PerformanceTrackerEntry | null {
  const ranked = records
    .map((record) => ({ record, rpm: readNumericMetric(record.rpm) }))
    .filter((entry): entry is { record: PerformanceTrackerEntry; rpm: number } => entry.rpm !== null)
    .sort((left, right) => right.rpm - left.rpm);

  return ranked[0]?.record ?? null;
}

/** Finds the imported record with the strongest share signal relative to reach. */
export function findMostShareableRecord(
  records: PerformanceTrackerEntry[]
): PerformanceTrackerEntry | null {
  const ranked = records
    .map((record) => {
      const metrics = getGrowthDoctorMetrics(record);
      return {
        record,
        score:
          metrics.shareRate ??
          readNumericMetric(record.shares) ??
          -1,
      };
    })
    .filter((entry) => entry.score >= 0)
    .sort((left, right) => right.score - left.score);

  return ranked[0]?.record ?? null;
}

/** Finds the imported record with the strongest follower-conversion score. */
export function findBestFollowerConversionRecord(
  records: PerformanceTrackerEntry[]
): PerformanceTrackerEntry | null {
  const ranked = records
    .map((record) => ({ record, metrics: getGrowthDoctorMetrics(record) }))
    .filter(({ metrics }) => hasActualPerformanceData(metrics.actualScores))
    .sort(
      (left, right) =>
        right.metrics.actualScores.actualFollowerConversionScore -
        left.metrics.actualScores.actualFollowerConversionScore
    );

  return ranked[0]?.record ?? null;
}

/** Builds recommendation strings from the available Growth Doctor issue findings. */
export function buildGrowthDoctorRecommendations(
  summary: CsvGrowthDoctorSummary
): string[] {
  const recommendations = summary.findings
    .filter((finding) =>
      [
        "high-reach-low-earnings",
        "high-retention-low-follows",
        "high-comments-low-shares",
        "weak-first-three-seconds",
        "worst-retention",
      ].includes(finding.id)
    )
    .map((finding) => finding.recommendedAction);

  return [...new Set(recommendations)];
}

/** Builds the local-only CSV Growth Doctor dashboard summary across imported records. */
export function buildCsvGrowthDoctorSummary(
  records: PerformanceTrackerEntry[]
): CsvGrowthDoctorSummary {
  if (records.length === 0) {
    return {
      importedRecordCount: 0,
      findings: [],
      bestPerformingPost: null,
      worstRetentionPost: null,
      highestRpmPost: null,
      mostShareablePost: null,
      bestFollowerConversionPost: null,
      lowReachHighRpmCandidate: null,
      highReachLowEarningsIssue: null,
      highRetentionLowFollowersIssue: null,
      highCommentsLowSharesIssue: null,
      weakFirstThreeSecondsIssue: null,
      biggestIssue: null,
      boostCandidates: [],
      rewriteRecommendations: [],
    };
  }

  const bestPerformingRecord = findBestPerformingRecord(records);
  const worstRetentionRecord = findWorstRetentionRecord(records);
  const highestRpmRecord = findHighestRpmRecord(records);
  const mostShareableRecord = findMostShareableRecord(records);
  const bestFollowerConversionRecord = findBestFollowerConversionRecord(records);

  const lowReachHighRpmRecord =
    records
      .map((record) => ({ record, metrics: getGrowthDoctorMetrics(record) }))
      .filter(
        ({ metrics }) =>
          (metrics.reach ?? 0) > 0 &&
          (metrics.reach ?? 0) < 10000 &&
          (metrics.rpm ?? 0) >= 4
      )
      .sort((left, right) => (right.metrics.rpm ?? 0) - (left.metrics.rpm ?? 0))[0]?.record ?? null;

  const highReachLowEarningsRecord =
    records
      .map((record) => ({ record, metrics: getGrowthDoctorMetrics(record) }))
      .filter(
        ({ metrics }) =>
          (metrics.reach ?? 0) >= 50000 && metrics.actualScores.actualRevenueScore < 50
      )
      .sort((left, right) => (right.metrics.reach ?? 0) - (left.metrics.reach ?? 0))[0]?.record ?? null;

  const highRetentionLowFollowersRecord =
    records
      .map((record) => ({ record, metrics: getGrowthDoctorMetrics(record) }))
      .filter(
        ({ metrics }) =>
          metrics.actualScores.actualRetentionScore >= 70 &&
          metrics.actualScores.actualFollowerConversionScore < 50
      )
      .sort(
        (left, right) =>
          right.metrics.actualScores.actualRetentionScore -
          left.metrics.actualScores.actualRetentionScore
      )[0]?.record ?? null;

  const highCommentsLowSharesRecord =
    records
      .map((record) => ({ record, metrics: getGrowthDoctorMetrics(record) }))
      .filter(
        ({ record, metrics }) =>
          (((metrics.commentRate ?? 0) >= 0.001) || ((readNumericMetric(record.comments) ?? 0) >= 80)) &&
          ((metrics.shareRate ?? 0) < 0.0008 && ((readNumericMetric(record.shares) ?? 0) < 40))
      )
      .sort((left, right) => (right.metrics.commentRate ?? 0) - (left.metrics.commentRate ?? 0))[0]?.record ?? null;

  const weakFirstThreeSecondsRecord =
    records
      .map((record) => ({ record, metrics: getGrowthDoctorMetrics(record) }))
      .filter(
        ({ metrics }) =>
          metrics.threeSecondViewRate !== null && metrics.threeSecondViewRate < 0.55
      )
      .sort((left, right) => (left.metrics.threeSecondViewRate ?? 1) - (right.metrics.threeSecondViewRate ?? 1))[0]?.record ?? null;

  const bestPerformingPost = bestPerformingRecord
    ? buildGrowthDoctorFinding(
        "best-performing",
        "Best performing post",
        bestPerformingRecord,
        formatGrowthDoctorMetric(
          "Actual performance",
          getGrowthDoctorMetrics(bestPerformingRecord).actualScores.actualPerformanceScore,
          "/100"
        ),
        `This post is currently the strongest all-around live performer in the imported CSV set.`,
        "Use this as the benchmark package when you build the next remix or sequel."
      )
    : null;

  const worstRetentionPost = worstRetentionRecord
    ? buildGrowthDoctorFinding(
        "worst-retention",
        "Worst retention post",
        worstRetentionRecord,
        formatGrowthDoctorMetric(
          "Retention score",
          getGrowthDoctorMetrics(worstRetentionRecord).actualScores.actualRetentionScore,
          "/100"
        ),
        "This post is losing viewers faster than the rest of the imported set.",
        "Rewrite the first frame and first 2-second motion hook before producing more variants."
      )
    : null;

  const highestRpmPost = highestRpmRecord
    ? buildGrowthDoctorFinding(
        "highest-rpm",
        "Highest RPM post",
        highestRpmRecord,
        formatGrowthDoctorMetric("RPM", getGrowthDoctorMetrics(highestRpmRecord).rpm),
        "This post is monetizing most efficiently across the imported CSV set.",
        "Protect the current monetized-safe framing and reuse it as the revenue reference version."
      )
    : null;

  const mostShareablePost = mostShareableRecord
    ? buildGrowthDoctorFinding(
        "most-shareable",
        "Most shareable post",
        mostShareableRecord,
        formatGrowthDoctorPercent(
          "Share rate",
          getGrowthDoctorMetrics(mostShareableRecord).shareRate
        ),
        "This post is creating the strongest share behavior relative to its reach.",
        "Use its behavioural beat as the share-trigger reference for future rewrites."
      )
    : null;

  const bestFollowerConversionPost = bestFollowerConversionRecord
    ? buildGrowthDoctorFinding(
        "best-follower-conversion",
        "Best follower conversion post",
        bestFollowerConversionRecord,
        formatGrowthDoctorMetric(
          "Follower conversion",
          getGrowthDoctorMetrics(bestFollowerConversionRecord).actualScores.actualFollowerConversionScore,
          "/100"
        ),
        "This post is converting viewers into follows, visits, or owned actions more effectively than the rest.",
        "Reuse its Page or series framing when you want growth that compounds beyond reach."
      )
    : null;

  const lowReachHighRpmCandidate = lowReachHighRpmRecord
    ? buildGrowthDoctorFinding(
        "low-reach-high-rpm",
        "Low reach but high RPM candidate",
        lowReachHighRpmRecord,
        `${formatGrowthDoctorMetric("Reach", getGrowthDoctorMetrics(lowReachHighRpmRecord).reach)} • ${formatGrowthDoctorMetric("RPM", getGrowthDoctorMetrics(lowReachHighRpmRecord).rpm)}`,
        "This post is monetizing well despite limited distribution.",
        "Controlled boost candidate if monetization safety is high."
      )
    : null;

  const highReachLowEarningsIssue = highReachLowEarningsRecord
    ? buildGrowthDoctorFinding(
        "high-reach-low-earnings",
        "High reach but low earnings issue",
        highReachLowEarningsRecord,
        `${formatGrowthDoctorMetric("Reach", getGrowthDoctorMetrics(highReachLowEarningsRecord).reach)} • ${formatGrowthDoctorMetric("Revenue score", getGrowthDoctorMetrics(highReachLowEarningsRecord).actualScores.actualRevenueScore, "/100")}`,
        "Distribution is arriving, but the monetized outcome is lagging the attention signal.",
        "Rewrite packaging toward a monetized-safe documentary angle."
      )
    : null;

  const highRetentionLowFollowersIssue = highRetentionLowFollowersRecord
    ? buildGrowthDoctorFinding(
        "high-retention-low-follows",
        "High retention but low followers issue",
        highRetentionLowFollowersRecord,
        `${formatGrowthDoctorMetric("Retention score", getGrowthDoctorMetrics(highRetentionLowFollowersRecord).actualScores.actualRetentionScore, "/100")} • ${formatGrowthDoctorMetric("Follower conversion", getGrowthDoctorMetrics(highRetentionLowFollowersRecord).actualScores.actualFollowerConversionScore, "/100")}`,
        "Viewers are staying, but the post is not converting enough of that attention into follows or owned audience growth.",
        "Strengthen Page/series CTA."
      )
    : null;

  const highCommentsLowSharesIssue = highCommentsLowSharesRecord
    ? buildGrowthDoctorFinding(
        "high-comments-low-shares",
        "High comments but low shares issue",
        highCommentsLowSharesRecord,
        `${formatGrowthDoctorPercent("Comment rate", getGrowthDoctorMetrics(highCommentsLowSharesRecord).commentRate)} • ${formatGrowthDoctorPercent("Share rate", getGrowthDoctorMetrics(highCommentsLowSharesRecord).shareRate)}`,
        "The discussion prompt is landing, but people still do not feel enough share impulse from the packaging.",
        "Add a stronger share-trigger rewrite."
      )
    : null;

  const weakFirstThreeSecondsIssue = weakFirstThreeSecondsRecord
    ? buildGrowthDoctorFinding(
        "weak-first-three-seconds",
        "Weak first 3 seconds issue",
        weakFirstThreeSecondsRecord,
        formatGrowthDoctorPercent(
          "3-second views / views",
          getGrowthDoctorMetrics(weakFirstThreeSecondsRecord).threeSecondViewRate
        ),
        "The early hold is soft compared with the rest of the imported set, so the opening motion is not sticking quickly enough.",
        "Rewrite first frame and first 2-second motion hook."
      )
    : null;

  const findings = [
    bestPerformingPost,
    worstRetentionPost,
    highestRpmPost,
    mostShareablePost,
    bestFollowerConversionPost,
    lowReachHighRpmCandidate,
    highReachLowEarningsIssue,
    highRetentionLowFollowersIssue,
    highCommentsLowSharesIssue,
    weakFirstThreeSecondsIssue,
  ].filter((finding): finding is CsvGrowthDoctorFinding => Boolean(finding));

  const biggestIssue =
    highReachLowEarningsIssue ??
    weakFirstThreeSecondsIssue ??
    highRetentionLowFollowersIssue ??
    highCommentsLowSharesIssue ??
    worstRetentionPost ??
    null;

  const boostCandidates = [
    lowReachHighRpmCandidate,
    bestPerformingPost?.record && ["Strong", "Breakout"].includes(getGrowthDoctorMetrics(bestPerformingPost.record).actualScores.band)
      ? buildGrowthDoctorFinding(
          "best-performing",
          "Best performer boost candidate",
          bestPerformingPost.record,
          formatGrowthDoctorMetric(
            "Actual performance",
            getGrowthDoctorMetrics(bestPerformingPost.record).actualScores.actualPerformanceScore,
            "/100"
          ),
          "This post has the strongest combined live performance signal in the imported set.",
          "Boost only if monetization safety and packaging quality remain high."
        )
      : null,
  ].filter((finding): finding is CsvGrowthDoctorFinding => Boolean(finding));

  const summary: CsvGrowthDoctorSummary = {
    importedRecordCount: records.length,
    findings,
    bestPerformingPost,
    worstRetentionPost,
    highestRpmPost,
    mostShareablePost,
    bestFollowerConversionPost,
    lowReachHighRpmCandidate,
    highReachLowEarningsIssue,
    highRetentionLowFollowersIssue,
    highCommentsLowSharesIssue,
    weakFirstThreeSecondsIssue,
    biggestIssue,
    boostCandidates,
    rewriteRecommendations: [],
  };

  summary.rewriteRecommendations = buildGrowthDoctorRecommendations(summary);
  return summary;
}

/** Formats a copyable plain-text Growth Doctor summary for local export. */
export function formatCsvGrowthDoctorSummary(
  summary: CsvGrowthDoctorSummary
): string {
  if (summary.importedRecordCount === 0) {
    return "CSV Growth Doctor\n\nImported records: 0\nNo imported Facebook Insights records are available yet.";
  }

  const bestPerformer = summary.bestPerformingPost
    ? `${formatGrowthDoctorRecordLabel(summary.bestPerformingPost.record)} — ${summary.bestPerformingPost.keyMetric}`
    : "Insufficient data";
  const highestRpm = summary.highestRpmPost
    ? `${formatGrowthDoctorRecordLabel(summary.highestRpmPost.record)} — ${summary.highestRpmPost.keyMetric}`
    : "Insufficient data";
  const biggestIssue = summary.biggestIssue
    ? `${summary.biggestIssue.label}: ${formatGrowthDoctorRecordLabel(summary.biggestIssue.record)} — ${summary.biggestIssue.recommendedAction}`
    : "No major issue detected yet.";
  const boostCandidates =
    summary.boostCandidates.length > 0
      ? summary.boostCandidates
          .map((candidate) => `${formatGrowthDoctorRecordLabel(candidate.record)} — ${candidate.recommendedAction}`)
          .join("\n- ")
      : "None yet.";
  const rewrites =
    summary.rewriteRecommendations.length > 0
      ? summary.rewriteRecommendations.map((recommendation) => `- ${recommendation}`).join("\n")
      : "- No rewrite recommendations yet.";

  return [
    "CSV Growth Doctor",
    "",
    `Imported records: ${summary.importedRecordCount}`,
    `Best performer: ${bestPerformer}`,
    `Highest RPM: ${highestRpm}`,
    `Biggest issue: ${biggestIssue}`,
    "Boost candidates:",
    summary.boostCandidates.length > 0 ? `- ${boostCandidates}` : boostCandidates,
    "Rewrite recommendations:",
    rewrites,
  ].join("\n");
}

type GrowthDoctorActionPlanOptions = {
  pkg?: GeneratedPackage | null;
  adSafeConflictScore?: number | null;
  boostWorthyScore?: number | null;
};

type GrowthDoctorActionContext = {
  predator: string;
  prey: string;
  leftSubject: string;
  rightSubject: string;
  environment: string;
  arc: string;
  pairLabel: string;
  recordLabel: string;
};

const ACTION_PRIORITY_ORDER = {
  high: 0,
  medium: 1,
  low: 2,
} as const;

const WINNER_FINDING_IDS: CsvGrowthDoctorFinding["id"][] = [
  "best-performing",
  "highest-rpm",
  "most-shareable",
  "best-follower-conversion",
];

function compactActionText(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function parseAnimalPairLabel(value: string | null | undefined): {
  predator: string;
  prey: string;
} {
  const pairText = compactActionText(value);
  if (!pairText) {
    return { predator: "", prey: "" };
  }

  const match = pairText.split(/\bvs\.?\b/i).map((part) => part.trim()).filter(Boolean);
  if (match.length >= 2) {
    return {
      predator: match[0],
      prey: match[1],
    };
  }

  return { predator: pairText, prey: "" };
}

function formatSubjectWithSide(subject: string, side: "left" | "right"): string {
  return subject ? `${subject} (${side})` : `the ${side} subject`;
}

function buildActionSimplePrompt(context: GrowthDoctorActionContext, actionBeat: string): string {
  const pair = context.prey ? `${context.predator} and ${context.prey}` : context.predator || context.pairLabel;
  return compactActionText(
    `${pair} in ${context.environment}, ${actionBeat}, natural light, wildlife cinematic realism.`
  );
}

function buildActionContext(
  record: PerformanceTrackerEntry | null,
  pkg?: GeneratedPackage | null
): GrowthDoctorActionContext {
  const pairFromRecord = parseAnimalPairLabel(record?.animalPair ?? record?.conceptLabel ?? record?.title ?? "");
  const predator =
    compactActionText(record?.predator) ||
    compactActionText(pkg?.predatorName) ||
    pairFromRecord.predator ||
    "lead animal";
  const prey =
    compactActionText(record?.prey) ||
    compactActionText(pkg?.preyName) ||
    pairFromRecord.prey ||
    "rival animal";
  const environment =
    compactActionText(record?.habitat) ||
    compactActionText(pkg?.environmentName) ||
    "readable natural habitat";
  const arc = compactActionText(record?.arc) || compactActionText(pkg?.arcName) || "wildlife confrontation";
  const pairLabel =
    predator && prey
      ? `${predator} vs ${prey}`
      : compactActionText(record?.animalPair) || compactActionText(record?.conceptLabel) || predator;

  return {
    predator,
    prey,
    leftSubject: formatSubjectWithSide(predator, "left"),
    rightSubject: formatSubjectWithSide(prey, "right"),
    environment,
    arc,
    pairLabel,
    recordLabel: formatGrowthDoctorRecordLabel(record),
  };
}

function buildRunwayActionPrompt(
  context: GrowthDoctorActionContext,
  leftAction: string,
  rightAction: string,
  cameraMove: string,
  closing = "natural light, one clear action beat, wildlife realism."
): string {
  return compactActionText(
    `${context.leftSubject} ${leftAction} in ${context.environment}. ${context.rightSubject} ${rightAction}. ${cameraMove}, ${closing}`
  );
}

function buildKlingActionPrompt(
  context: GrowthDoctorActionContext,
  leadAction: string,
  reaction: string,
  cameraMove = "tight side track"
): string {
  return compactActionText(
    `${context.leftSubject} ${leadAction} while ${context.rightSubject} ${reaction} in ${context.environment}, ${cameraMove}, realistic wildlife motion.`
  );
}

function buildSeedanceActionPrompt(
  context: GrowthDoctorActionContext,
  setupBeat: string,
  actionBeat: string,
  reactionBeat: string,
  editNote?: string
): string {
  return [
    `0-2s: ${setupBeat}`,
    `2-4s: ${actionBeat}`,
    `4-6s: ${reactionBeat}`,
    editNote ? `Edit note: ${editNote}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildFacebookCaptionRewrite(
  context: GrowthDoctorActionContext,
  leadLine: string
): string {
  const cta = buildObservationalCTA(context.pairLabel, context.arc);
  return `${compactActionText(leadLine)}\n\n${cta}`;
}

function trimActionBlock(value: string): string {
  return value
    .split("\n")
    .map((line) => compactActionText(line))
    .filter((line, index, lines) => line.length > 0 || (index > 0 && index < lines.length - 1))
    .join("\n")
    .trim();
}

function buildActionVariant(
  label: string,
  engineTarget: GrowthDoctorRewriteVariant["engineTarget"],
  promptRewrite: string,
  captionRewrite?: string
): GrowthDoctorRewriteVariant {
  return {
    label,
    engineTarget,
    promptRewrite: trimActionBlock(promptRewrite),
    captionRewrite: captionRewrite ? trimActionBlock(captionRewrite) : undefined,
  };
}

function buildGrowthDoctorAction(input: {
  id: string;
  finding: CsvGrowthDoctorFinding;
  title: string;
  diagnosis: string;
  whyItMatters: string;
  recommendedAction: string;
  priority: GrowthDoctorRemixAction["priority"];
  nextStep: string;
  variant: GrowthDoctorRewriteVariant;
}): GrowthDoctorRemixAction {
  return {
    id: input.id,
    sourceFindingId: input.finding.id,
    sourceFindingLabel: input.finding.label,
    title: input.title,
    diagnosis: input.diagnosis,
    whyItMatters: input.whyItMatters,
    recommendedAction: input.recommendedAction,
    priority: input.priority,
    nextStep: input.nextStep,
    variant: input.variant,
  };
}

function buildWeakFirstThreeSecondsActions(
  finding: CsvGrowthDoctorFinding,
  context: GrowthDoctorActionContext
): GrowthDoctorRemixAction[] {
  return [
    buildGrowthDoctorAction({
      id: `${finding.id}-first-frame-rewrite`,
      finding,
      title: "First-frame identity rewrite",
      diagnosis: finding.diagnosis,
      whyItMatters:
        "If the species identity and motion beat are not readable immediately, the post loses hold before retention and monetization can compound.",
      recommendedAction:
        "Make both animals readable in frame one, then start the pressure beat immediately.",
      priority: "high",
      nextStep: "Replace the opener before making any new publish variant.",
      variant: buildActionVariant(
        "Runway first-frame rewrite",
        "Runway",
        buildRunwayActionPrompt(
          context,
          "is already fully readable and shifts forward on frame one",
          "braces instantly and answers with one visible defensive move",
          "slow push-in, eye-level"
        )
      ),
    }),
    buildGrowthDoctorAction({
      id: `${finding.id}-two-second-hook`,
      finding,
      title: "First 2-second motion hook rewrite",
      diagnosis: finding.diagnosis,
      whyItMatters:
        "A sharper first movement gives Facebook viewers a reason to stay through the first hold window.",
      recommendedAction:
        "Start the clip with one immediate pressure-and-reaction beat instead of a slow settle.",
      priority: "high",
      nextStep: "Use this as the short clean test prompt for the next opening-motion iteration.",
      variant: buildActionVariant(
        "Kling motion-hook rewrite",
        "Kling",
        buildKlingActionPrompt(
          context,
          "snaps one decisive step forward",
          "recoils in the same beat"
        )
      ),
    }),
    buildGrowthDoctorAction({
      id: `${finding.id}-short-cut`,
      finding,
      title: "8–12s short-cut remix",
      diagnosis: finding.diagnosis,
      whyItMatters:
        "A short edit cut lets you isolate the strongest hook without dragging viewers through unnecessary setup.",
      recommendedAction:
        "Trim the idea down to one setup beat, one decisive move, and one reaction beat.",
      priority: "medium",
      nextStep: "Build the final 8–12s edit from one clean 5s or 10s generation plus trims and selected holds.",
      variant: buildActionVariant(
        "Seedance short-cut rewrite",
        "Seedance",
        buildSeedanceActionPrompt(
          context,
          `${context.leftSubject} and ${context.rightSubject} lock into one readable frame in ${context.environment}.`,
          `${context.leftSubject} commits one immediate pressure beat.`,
          `${context.rightSubject} reacts in a way that makes the outcome readable.`,
          "Build the final 8–12s cut from one clean 5s or 10s generation plus trims."
        )
      ),
    }),
    buildGrowthDoctorAction({
      id: `${finding.id}-simple-prompt`,
      finding,
      title: "Stronger SIMPLE PROMPT variant",
      diagnosis: finding.diagnosis,
      whyItMatters:
        "A cleaner simple prompt gives you a fast-copy opener that keeps the subject identity and action readable.",
      recommendedAction:
        "Keep the prompt to one dominant action with both animals named clearly.",
      priority: "medium",
      nextStep: "Use this as the fast-copy version when you want a clean reset on the opening beat.",
      variant: buildActionVariant(
        "Fast-copy simple prompt",
        "Runway",
        buildActionSimplePrompt(context, "immediate readable pressure and recoil")
      ),
    }),
  ];
}

function buildWorstRetentionActions(
  finding: CsvGrowthDoctorFinding,
  context: GrowthDoctorActionContext
): GrowthDoctorRemixAction[] {
  return [
    buildGrowthDoctorAction({
      id: `${finding.id}-retention-rescue`,
      finding,
      title: "Retention rescue opener",
      diagnosis: finding.diagnosis,
      whyItMatters:
        "When retention is weakest on one post, the opening is usually too slow or the payoff arrives too late.",
      recommendedAction:
        "Cut the setup down and reveal the pressure or escape turn earlier.",
      priority: "high",
      nextStep: "Use this opener before you build any longer sequel cut.",
      variant: buildActionVariant(
        "Runway retention rewrite",
        "Runway",
        buildRunwayActionPrompt(
          context,
          "starts the pressure beat immediately instead of waiting through setup",
          "shows the escape or brace response in the same opening window",
          "steady push-in"
        )
      ),
    }),
    buildGrowthDoctorAction({
      id: `${finding.id}-single-action`,
      finding,
      title: "Clearer single-action cut",
      diagnosis: finding.diagnosis,
      whyItMatters:
        "One clean action is easier to hold than a muddy sequence with multiple competing motions.",
      recommendedAction:
        "Strip the shot down to one decisive movement and one readable outcome hint.",
      priority: "high",
      nextStep: "Use this as the short clean test before producing a wider remix.",
      variant: buildActionVariant(
        "Kling single-action rewrite",
        "Kling",
        buildKlingActionPrompt(
          context,
          "drives one clear forward action",
          "answers with one readable survival move"
        )
      ),
    }),
    buildGrowthDoctorAction({
      id: `${finding.id}-earlier-payoff`,
      finding,
      title: "Earlier payoff timeline",
      diagnosis: finding.diagnosis,
      whyItMatters:
        "If payoff arrives earlier, viewers understand why the clip is worth finishing.",
      recommendedAction:
        "Land the visible turn by beat two and remove slow atmospheric setup.",
      priority: "medium",
      nextStep: "Use this structure when you rebuild the story cut or longer edit.",
      variant: buildActionVariant(
        "Seedance payoff rewrite",
        "Seedance",
        buildSeedanceActionPrompt(
          context,
          `${context.leftSubject} and ${context.rightSubject} enter already locked into the conflict.`,
          `${context.leftSubject} commits the single decisive move.`,
          `${context.rightSubject} reveals the payoff beat clearly before the clip drifts.`,
          "Remove slow setup and land the visible turn by beat two."
        )
      ),
    }),
  ];
}

function buildHighCommentsLowSharesActions(
  finding: CsvGrowthDoctorFinding,
  context: GrowthDoctorActionContext
): GrowthDoctorRemixAction[] {
  return [
    buildGrowthDoctorAction({
      id: `${finding.id}-share-trigger`,
      finding,
      title: "Share-trigger caption rewrite",
      diagnosis: finding.diagnosis,
      whyItMatters:
        "Strong comments with weak shares usually means the discussion is working but the packaging lacks a strong replay or share impulse.",
      recommendedAction:
        "Reframe the post around the one body shift or behaviour beat people will want to point out to someone else.",
      priority: "high",
      nextStep: "Swap the caption first, then test whether shares lift without bait language.",
      variant: buildActionVariant(
        "Facebook share-trigger rewrite",
        "Facebook copy",
        "Center the post around the exact body shift that changes the scene.",
        buildFacebookCaptionRewrite(
          context,
          `The one body shift that changes this ${context.pairLabel.toLowerCase()} sequence happens before the full outcome arrives.`
        )
      ),
    }),
    buildGrowthDoctorAction({
      id: `${finding.id}-watch-again`,
      finding,
      title: "Watch-again beat rewrite",
      diagnosis: finding.diagnosis,
      whyItMatters:
        "A replayable turning point is one of the cleanest ways to convert comments into shares.",
      recommendedAction:
        "Stage the turning point so it is readable enough that viewers want to watch again and point it out.",
      priority: "medium",
      nextStep: "Use this when rebuilding the visual version of the same concept.",
      variant: buildActionVariant(
        "Runway watch-again rewrite",
        "Runway",
        buildRunwayActionPrompt(
          context,
          "shows the exact body shift that changes the pressure line",
          "loses or gains position in the same readable beat",
          "slow lateral track"
        )
      ),
    }),
    buildGrowthDoctorAction({
      id: `${finding.id}-share-timeline`,
      finding,
      title: "Replay-ready timeline variant",
      diagnosis: finding.diagnosis,
      whyItMatters:
        "A tighter sequence can make the turning point easier to spot and easier to share.",
      recommendedAction:
        "Build the whole sequence around one turn viewers can rewatch instantly.",
      priority: "medium",
      nextStep: "Use this structure for the next remix test if comments keep outpacing shares.",
      variant: buildActionVariant(
        "Seedance replay rewrite",
        "Seedance",
        buildSeedanceActionPrompt(
          context,
          `${context.leftSubject} and ${context.rightSubject} enter with clear spacing and readable tension.`,
          `${context.leftSubject} makes the one move that changes the lane.`,
          `${context.rightSubject} reacts in a way viewers can immediately replay to study.`,
          "Keep the turning point readable enough for repeat viewing."
        )
      ),
    }),
  ];
}

function buildHighRetentionLowFollowsActions(
  finding: CsvGrowthDoctorFinding,
  context: GrowthDoctorActionContext
): GrowthDoctorRemixAction[] {
  return [
    buildGrowthDoctorAction({
      id: `${finding.id}-series-cta`,
      finding,
      title: "Page / series CTA rewrite",
      diagnosis: finding.diagnosis,
      whyItMatters:
        "If retention is strong but follows lag, the post is entertaining people without clearly positioning the page as a series worth returning to.",
      recommendedAction:
        "Add recurring-series framing without turning the caption into direct engagement bait.",
      priority: "high",
      nextStep: "Test this caption rewrite on the next follow-up post in the same lane.",
      variant: buildActionVariant(
        "Facebook series CTA rewrite",
        "Facebook copy",
        "Frame the post as part of a recurring wildlife behaviour series.",
        buildFacebookCaptionRewrite(
          context,
          `${context.pairLabel} under pressure, tracked as part of a recurring WSTV wildlife behaviour series with one readable turning point.`
        )
      ),
    }),
    buildGrowthDoctorAction({
      id: `${finding.id}-series-continuation`,
      finding,
      title: "Recurring series continuation prompt",
      diagnosis: finding.diagnosis,
      whyItMatters:
        "Series continuation gives strong-retention concepts another chance to compound into owned audience growth.",
      recommendedAction:
        "Create the next episode around the same behavior pattern, not a random new action.",
      priority: "medium",
      nextStep: "Use the same behavioural lane and keep the page identity obvious in the publish copy.",
      variant: buildActionVariant(
        "Runway continuation rewrite",
        "Runway",
        buildRunwayActionPrompt(
          context,
          "re-enters the same behaviour pattern from a new readable angle",
          "answers with one continuation move that clearly extends the sequence",
          "measured push-in"
        )
      ),
    }),
    buildGrowthDoctorAction({
      id: `${finding.id}-publishing-note`,
      finding,
      title: "Follow-conversion publishing note",
      diagnosis: finding.diagnosis,
      whyItMatters:
        "Owned audience growth compounds future monetized distribution more than one-off reach spikes.",
      recommendedAction:
        "Keep the series framing in the post package and preserve the AI-generated disclosure reminder in the publish checklist.",
      priority: "medium",
      nextStep: "Pair the next caption test with the existing disclosure reminder and Page-positioning notes.",
      variant: buildActionVariant(
        "Publishing follow-conversion plan",
        "Publishing",
        `Keep ${context.recordLabel} framed as part of a recurring WSTV behaviour series, preserve the AI-generated disclosure reminder, and compare follows gained against the current baseline.`
      ),
    }),
  ];
}

function buildHighReachLowEarningsActions(
  finding: CsvGrowthDoctorFinding,
  context: GrowthDoctorActionContext
): GrowthDoctorRemixAction[] {
  return [
    buildGrowthDoctorAction({
      id: `${finding.id}-documentary-rewrite`,
      finding,
      title: "Monetized-safe documentary rewrite",
      diagnosis: finding.diagnosis,
      whyItMatters:
        "If reach is high but earnings are weak, the packaging may be attracting attention without converting into clean monetized performance.",
      recommendedAction:
        "Reframe the concept as a documentary-safe wildlife sequence with clean danger and no exaggerated brutality.",
      priority: "high",
      nextStep: "Use this rewrite before you test another reach-first package.",
      variant: buildActionVariant(
        "Publishing monetized-safe rewrite",
        "Publishing",
        `Repackage ${context.pairLabel} as a documentary-safe sequence: keep one readable action, remove graphic language, preserve the AI-generated disclosure reminder, and compare RPM against the current version.`
      ),
    }),
    buildGrowthDoctorAction({
      id: `${finding.id}-sponsor-caption`,
      finding,
      title: "Sponsor-safe caption variant",
      diagnosis: finding.diagnosis,
      whyItMatters:
        "Cleaner captions make it easier for monetization and sponsorship signals to align with the attention the post is already earning.",
      recommendedAction:
        "Shift the caption toward readable animal behaviour and away from shock wording.",
      priority: "high",
      nextStep: "Test this caption against the current high-reach version and compare RPM movement.",
      variant: buildActionVariant(
        "Facebook sponsor-safe caption",
        "Facebook copy",
        "Use cleaner documentary framing in the caption while keeping the same central behaviour beat.",
        buildFacebookCaptionRewrite(
          context,
          `${context.pairLabel} holds on one readable documentary-style pressure beat with the outcome decided by positioning, not shock wording.`
        )
      ),
    }),
    buildGrowthDoctorAction({
      id: `${finding.id}-sponsor-cut`,
      finding,
      title: "Sponsor-safe visual cut",
      diagnosis: finding.diagnosis,
      whyItMatters:
        "A cleaner visual angle can keep attention while reducing monetization drag from overly graphic or chaotic framing.",
      recommendedAction:
        "Favor readable full-body spacing, cleaner camera distance, and one decisive motion beat.",
      priority: "medium",
      nextStep: "Use this as the visual remix when the current post pulls reach but under-earns.",
      variant: buildActionVariant(
        "Runway sponsor-safe cut",
        "Runway",
        buildRunwayActionPrompt(
          context,
          "presses forward with clear full-body spacing and visible restraint",
          "holds ground or gives one readable step without chaotic overlap",
          "slow dolly in"
        )
      ),
    }),
  ];
}

function buildLowReachHighRpmActions(
  finding: CsvGrowthDoctorFinding,
  context: GrowthDoctorActionContext,
  options: GrowthDoctorActionPlanOptions
): GrowthDoctorRemixAction[] {
  const safeToBoost = (options.adSafeConflictScore ?? 0) >= 70 && (options.boostWorthyScore ?? 0) >= 70;
  return [
    buildGrowthDoctorAction({
      id: `${finding.id}-boost-plan`,
      finding,
      title: "Controlled boost plan",
      diagnosis: finding.diagnosis,
      whyItMatters:
        "High RPM with low reach often means the content is monetizing well but has not received enough clean distribution yet.",
      recommendedAction: safeToBoost
        ? "Run a controlled boost test on the cleanest monetized-safe version."
        : "Hold the boost until the current package clears stronger ad-safety and boost-worthiness checks.",
      priority: "high",
      nextStep: safeToBoost
        ? "Keep the AI-generated disclosure reminder in place and test a small paid push against the organic baseline."
        : "Tighten the packaging first, then revisit boost eligibility.",
      variant: buildActionVariant(
        "Publishing controlled boost plan",
        "Publishing",
        safeToBoost
          ? `Run a controlled paid test on ${context.recordLabel} with the current monetized-safe framing, preserve the AI-generated disclosure reminder, and compare RPM against the organic baseline.`
          : `Do not boost ${context.recordLabel} yet. Keep the monetized-safe framing, raise ad-safety confidence, and recheck boost-worthiness before paid spend.`
      ),
    }),
    buildGrowthDoctorAction({
      id: `${finding.id}-paid-test-variant-a`,
      finding,
      title: "Safer paid-test variant A",
      diagnosis: finding.diagnosis,
      whyItMatters:
        "A safer visual variant lets you test distribution without sacrificing the strong RPM signal.",
      recommendedAction:
        "Keep the same core behaviour but simplify the opening and maintain clean documentary spacing.",
      priority: "medium",
      nextStep: "Use this as the first paid-test creative if the current package is safe enough to boost.",
      variant: buildActionVariant(
        "Runway paid-test variant",
        "Runway",
        buildRunwayActionPrompt(
          context,
          "holds one clear pressure line with readable body spacing",
          "answers with one clean defensive move",
          "slow side push"
        )
      ),
    }),
    buildGrowthDoctorAction({
      id: `${finding.id}-paid-test-variant-b`,
      finding,
      title: "Safer paid-test caption variant",
      diagnosis: finding.diagnosis,
      whyItMatters:
        "A paid test needs copy that stays monetized-safe while still making the wildlife tension understandable fast.",
      recommendedAction:
        "Keep the caption observational, sponsor-safe, and centered on one behavioural turn.",
      priority: "medium",
      nextStep: "Pair this caption with the safest visual variant when you run a controlled paid test.",
      variant: buildActionVariant(
        "Facebook paid-test caption",
        "Facebook copy",
        "Use a cleaner documentary-style paid-test caption with the same core behaviour beat.",
        buildFacebookCaptionRewrite(
          context,
          `${context.pairLabel} turns on one readable behaviour shift in ${context.environment}, framed for clean documentary-style viewing.`
        )
      ),
    }),
  ];
}

function buildWinnerActionPack(
  finding: CsvGrowthDoctorFinding,
  context: GrowthDoctorActionContext,
  options: GrowthDoctorActionPlanOptions
): GrowthDoctorRemixAction[] {
  const safeToBoost = (options.adSafeConflictScore ?? 0) >= 70 && (options.boostWorthyScore ?? 0) >= 70;
  return [
    buildGrowthDoctorAction({
      id: `${finding.id}-winner-short-cut`,
      finding,
      title: "Winner short-cut remix",
      diagnosis: finding.diagnosis,
      whyItMatters:
        "Winning live behaviour deserves a shorter edit cut that can reach colder audiences fast.",
      recommendedAction:
        "Turn the strongest behaviour beat into an 8–12s short cut with one decisive motion line.",
      priority: "high",
      nextStep: "Build the final 8–12s cut from one clean 5s or 10s generation plus trims.",
      variant: buildActionVariant(
        "Kling winner short cut",
        "Kling",
        `${buildKlingActionPrompt(context, "drives the single winning pressure beat", "shows the decisive reaction")} Build the final edit as an 8–12s cut from one clean 5s or 10s generation.`
      ),
    }),
    buildGrowthDoctorAction({
      id: `${finding.id}-winner-story-cut`,
      finding,
      title: "Winner 20–30s story cut",
      diagnosis: finding.diagnosis,
      whyItMatters:
        "A longer story cut lets you stretch a proven winner into a clearer escalation sequence without changing the underlying behaviour beat.",
      recommendedAction:
        "Expand the winning concept into a short story with setup, escalation, and aftermath.",
      priority: "medium",
      nextStep: "Use this for the next medium-length sequel or story-driven retest.",
      variant: buildActionVariant(
        "Seedance story-cut rewrite",
        "Seedance",
        buildSeedanceActionPrompt(
          context,
          `${context.leftSubject} and ${context.rightSubject} establish the same winning tension beat in ${context.environment}.`,
          `${context.leftSubject} repeats the decisive move that made the original version work.`,
          `${context.rightSubject} reveals the aftermath clearly enough to support a 20–30s story cut.`,
          "Expand this into a 20–30s story cut while keeping the same behaviour anchor."
        )
      ),
    }),
    buildGrowthDoctorAction({
      id: `${finding.id}-winner-localized-caption`,
      finding,
      title: "Localized caption variant",
      diagnosis: finding.diagnosis,
      whyItMatters:
        "Winning concepts often travel further when the caption is simplified for broader discussion without losing the core behaviour beat.",
      recommendedAction:
        "Create a cleaner caption variant that keeps the same behaviour hook and discussion angle.",
      priority: "medium",
      nextStep: "Use this when you test alternate audience framing or localization.",
      variant: buildActionVariant(
        "Facebook localized caption",
        "Facebook copy",
        "Rewrite the winner caption in simpler, broader wording while keeping the same observational question.",
        buildFacebookCaptionRewrite(
          context,
          `${context.pairLabel} turns on one readable behaviour shift that viewers can understand instantly, even without extra context.`
        )
      ),
    }),
    buildGrowthDoctorAction({
      id: `${finding.id}-winner-series`,
      finding,
      title: "Winner series continuation",
      diagnosis: finding.diagnosis,
      whyItMatters:
        "A true winner should feed a repeatable sequel path, not remain a one-off post.",
      recommendedAction:
        "Continue the same behavioural idea with a new setup angle and the same core payoff logic.",
      priority: "medium",
      nextStep: "Keep the series framing and compare follower lift against the original winner.",
      variant: buildActionVariant(
        "Runway winner continuation",
        "Runway",
        buildRunwayActionPrompt(
          context,
          "re-enters the same proven behaviour pattern from a fresh readable angle",
          "answers with the reaction that makes the series continuation obvious",
          "measured push-in"
        )
      ),
    }),
    buildGrowthDoctorAction({
      id: `${finding.id}-winner-sponsor-safe`,
      finding,
      title: "Winner sponsor-safe cut",
      diagnosis: finding.diagnosis,
      whyItMatters:
        "A winning post is more reusable when you also keep a cleaner sponsor-safe version on hand.",
      recommendedAction:
        "Preserve the winning behaviour beat but widen the spacing and keep the language documentary-safe.",
      priority: "medium",
      nextStep: "Use this variant when the same concept needs a cleaner monetized or sponsor-ready pass.",
      variant: buildActionVariant(
        "Runway sponsor-safe winner",
        "Runway",
        buildRunwayActionPrompt(
          context,
          "keeps the proven behaviour beat with cleaner full-body spacing",
          "reacts clearly without chaotic overlap or shock framing",
          "slow dolly in"
        )
      ),
    }),
    buildGrowthDoctorAction({
      id: `${finding.id}-winner-boost-guidance`,
      finding,
      title: "Winner boost guidance",
      diagnosis: finding.diagnosis,
      whyItMatters:
        "A winner can be a boost candidate, but only when monetization safety still holds under broader distribution.",
      recommendedAction: safeToBoost
        ? "Use the cleanest winner version as a controlled boost candidate."
        : "Keep the winner organic until safety and boost-worthiness are stronger.",
      priority: safeToBoost ? "high" : "medium",
      nextStep: safeToBoost
        ? "Test a small paid push while keeping the AI-generated disclosure reminder active."
        : "Refine the sponsor-safe winner cut before considering paid amplification.",
      variant: buildActionVariant(
        "Publishing winner boost plan",
        "Publishing",
        safeToBoost
          ? `Use ${context.recordLabel} as a controlled boost candidate, preserve the AI-generated disclosure reminder, and compare paid RPM against the organic winner baseline.`
          : `Do not boost ${context.recordLabel} yet. Keep the winner organic, refine the sponsor-safe version, and re-evaluate once safety remains high.`
      ),
    }),
  ];
}

function dedupeGrowthDoctorActions(actions: GrowthDoctorRemixAction[]): GrowthDoctorRemixAction[] {
  const seen = new Set<string>();
  return actions.filter((action) => {
    if (seen.has(action.id)) {
      return false;
    }
    seen.add(action.id);
    return true;
  });
}

/** Builds a local-only action plan that converts CSV Growth Doctor findings into copy-paste rewrites. */
export function buildGrowthDoctorActionPlan(
  summary: CsvGrowthDoctorSummary,
  options: GrowthDoctorActionPlanOptions = {}
): GrowthDoctorActionPlan {
  if (summary.importedRecordCount === 0) {
    return {
      importedRecordCount: 0,
      actionCount: 0,
      generatedLocally: true,
      actions: [],
    };
  }

  const actions: GrowthDoctorRemixAction[] = [];

  summary.findings.forEach((finding) => {
    const context = buildActionContext(finding.record, options.pkg);

    switch (finding.id) {
      case "weak-first-three-seconds":
        actions.push(...buildWeakFirstThreeSecondsActions(finding, context));
        break;
      case "worst-retention":
        actions.push(...buildWorstRetentionActions(finding, context));
        break;
      case "high-comments-low-shares":
        actions.push(...buildHighCommentsLowSharesActions(finding, context));
        break;
      case "high-retention-low-follows":
        actions.push(...buildHighRetentionLowFollowsActions(finding, context));
        break;
      case "high-reach-low-earnings":
        actions.push(...buildHighReachLowEarningsActions(finding, context));
        break;
      case "low-reach-high-rpm":
        actions.push(...buildLowReachHighRpmActions(finding, context, options));
        break;
      default:
        break;
    }
  });

  const winnerFinding =
    summary.bestPerformingPost ??
    summary.highestRpmPost ??
    summary.mostShareablePost ??
    summary.bestFollowerConversionPost;

  if (winnerFinding && WINNER_FINDING_IDS.includes(winnerFinding.id)) {
    actions.push(
      ...buildWinnerActionPack(
        winnerFinding,
        buildActionContext(winnerFinding.record, options.pkg),
        options
      )
    );
  }

  const deduped = dedupeGrowthDoctorActions(actions).sort((left, right) => {
    const priorityDelta = ACTION_PRIORITY_ORDER[left.priority] - ACTION_PRIORITY_ORDER[right.priority];
    if (priorityDelta !== 0) return priorityDelta;
    return left.title.localeCompare(right.title);
  });

  return {
    importedRecordCount: summary.importedRecordCount,
    actionCount: deduped.length,
    generatedLocally: true,
    actions: deduped,
  };
}

/** Formats a copyable plain-text Growth Doctor action plan for local export. */
export function formatGrowthDoctorActionPlan(
  plan: GrowthDoctorActionPlan
): string {
  if (plan.actionCount === 0) {
    return [
      "Growth Doctor Actions",
      "",
      `Imported records: ${plan.importedRecordCount}`,
      "Action count: 0",
      "No action-ready CSV Growth Doctor findings are available yet.",
    ].join("\n");
  }

  return [
    "Growth Doctor Actions",
    "",
    `Imported records: ${plan.importedRecordCount}`,
    `Action count: ${plan.actionCount}`,
    "Generated locally: yes",
    "",
    ...plan.actions.flatMap((action, index) => {
      const lines = [
        `${index + 1}. [${action.priority.toUpperCase()}] ${action.title}`,
        `Finding: ${action.sourceFindingLabel}`,
        `Engine: ${action.variant.engineTarget}`,
        `Diagnosis: ${action.diagnosis}`,
        `Why it matters: ${action.whyItMatters}`,
        `Recommended action: ${action.recommendedAction}`,
        "Prompt rewrite:",
        action.variant.promptRewrite,
      ];
      if (action.variant.captionRewrite) {
        lines.push("Caption / CTA rewrite:", action.variant.captionRewrite);
      }
      lines.push(`Next step: ${action.nextStep}`);
      return [...lines, ""];
    }),
  ].join("\n").trim();
}

