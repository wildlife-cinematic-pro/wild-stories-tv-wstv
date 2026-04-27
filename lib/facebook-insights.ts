import type {
  ActualFacebookPerformanceScores,
  CsvGrowthDoctorFinding,
  CsvGrowthDoctorSummary,
  GeneratedPackage,
  PerformanceTrackerEntry,
} from "@/types";

import { buildActualFacebookPerformanceScores } from "@/lib/facebook-monetization-engine";
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
