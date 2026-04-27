import type { GeneratedPackage, PerformanceTrackerEntry } from "@/types";

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
