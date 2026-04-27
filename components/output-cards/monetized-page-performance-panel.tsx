"use client";

import { useMemo, useState, type ChangeEvent } from "react";

import type {
  GeneratedPackage,
  PerformanceTrackerEntry,
  PredictedVsActualMetricComparison,
} from "@/types";

import {
  buildCsvGrowthDoctorSummary,
  formatCsvGrowthDoctorSummary,
  importFacebookInsightsCsv,
  isFacebookInsightsCsvFile,
  matchFacebookInsightsRecord,
} from "@/lib/facebook-insights";
import { buildMonetizedFacebookReport } from "@/lib/facebook-monetization-engine";
import {
  buildBlankPerformanceTrackerEntry,
  parsePerformanceTrackerEntryJson,
  serializePerformanceTrackerEntriesAsCsv,
  serializePerformanceTrackerEntriesAsJson,
  serializePerformanceTrackerEntryAsCsvRow,
  serializePerformanceTrackerEntryAsJson,
} from "@/lib/performance-tracker";
import { getRealGenerationEvidenceGenerationId } from "@/lib/real-generation-evidence";
import {
  clearImportedMonetizedPagePerformanceRecords,
  readMonetizedPagePerformanceHistory,
  readMonetizedPagePerformanceForGeneration,
  upsertMonetizedPagePerformanceRecord,
  upsertMonetizedPagePerformanceRecords,
} from "@/lib/storage";

type TextFieldKey =
  | "postUrl"
  | "title"
  | "conceptLabel"
  | "publishedAt"
  | "notes";

type NumberFieldKey =
  | "reach"
  | "threeSecondViews"
  | "oneMinuteViews"
  | "averageWatchTimeSeconds"
  | "watchPercentage"
  | "shares"
  | "comments"
  | "reactions"
  | "followsGained"
  | "profileVisits"
  | "linkClicks"
  | "estimatedEarnings"
  | "rpm"
  | "monetizedPlays";

const SCORE_META = [
  {
    key: "revenuePotentialScore",
    label: "Revenue potential",
    detail: "How strong the package looks for monetized upside once safety, retention, and earnings signals are blended.",
    accent: "border-emerald-200 bg-emerald-50 text-emerald-900",
  },
  {
    key: "adSafeConflictScore",
    label: "Ad-safe conflict",
    detail: "How clean the packaging looks for ad-safety and sponsor scrutiny despite the wildlife tension.",
    accent: "border-sky-200 bg-sky-50 text-sky-900",
  },
  {
    key: "sponsorFitScore",
    label: "Sponsor fit",
    detail: "How comfortably this version can sit next to sponsorship without feeling graphic, bait-led, or messy.",
    accent: "border-indigo-200 bg-indigo-50 text-indigo-900",
  },
  {
    key: "repeatViewerScore",
    label: "Repeat viewer",
    detail: "How likely this package is to earn replay behaviour from opening beat, retention, and clear escalation.",
    accent: "border-violet-200 bg-violet-50 text-violet-900",
  },
  {
    key: "followerConversionScore",
    label: "Follower conversion",
    detail: "How much this package can turn view interest into follows, profile visits, or owned audience growth.",
    accent: "border-amber-200 bg-amber-50 text-amber-900",
  },
  {
    key: "boostWorthyScore",
    label: "Boost worthy",
    detail: "How ready this package is for paid amplification once safety, repeat-viewer, and revenue signals align.",
    accent: "border-rose-200 bg-rose-50 text-rose-900",
  },
] as const;

const ACTUAL_SCORE_META = [
  {
    key: "actualPerformanceScore",
    label: "Actual performance",
    detail: "Weighted live result across retention, engagement, revenue, and conversion.",
    accent: "border-cyan-200 bg-cyan-50 text-cyan-900",
  },
  {
    key: "actualRevenueScore",
    label: "Actual revenue",
    detail: "How strong the imported RPM, earnings, and monetized-play signals look.",
    accent: "border-emerald-200 bg-emerald-50 text-emerald-900",
  },
  {
    key: "actualEngagementScore",
    label: "Actual engagement",
    detail: "How strongly real viewers shared, commented, and reacted once the post was live.",
    accent: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-900",
  },
  {
    key: "actualRetentionScore",
    label: "Actual retention",
    detail: "How well the clip held live attention through watch time, watch %, and one-minute hold.",
    accent: "border-violet-200 bg-violet-50 text-violet-900",
  },
  {
    key: "actualFollowerConversionScore",
    label: "Actual conversion",
    detail: "How effectively the post turned viewers into follows, visits, or owned actions.",
    accent: "border-amber-200 bg-amber-50 text-amber-900",
  },
] as const;

const TEXT_FIELDS: Array<{
  key: TextFieldKey;
  label: string;
  placeholder: string;
}> = [
  {
    key: "postUrl",
    label: "Post URL",
    placeholder: "https://www.facebook.com/...",
  },
  {
    key: "title",
    label: "Post title",
    placeholder: "Mountain Lion pressure closes fast",
  },
  {
    key: "conceptLabel",
    label: "Concept label",
    placeholder: "Mountain Lion vs Mule Deer • Escape from danger",
  },
  {
    key: "publishedAt",
    label: "Published at",
    placeholder: "2026-04-27 08:30 EST",
  },
];

const NUMBER_FIELDS: Array<{
  key: NumberFieldKey;
  label: string;
  placeholder: string;
}> = [
  { key: "reach", label: "Reach", placeholder: "120000" },
  { key: "threeSecondViews", label: "3-second views", placeholder: "54000" },
  { key: "oneMinuteViews", label: "1-minute views", placeholder: "5800" },
  {
    key: "averageWatchTimeSeconds",
    label: "Average watch time (s)",
    placeholder: "16.4",
  },
  { key: "watchPercentage", label: "Watch %", placeholder: "47" },
  { key: "shares", label: "Shares", placeholder: "340" },
  { key: "comments", label: "Comments", placeholder: "190" },
  { key: "reactions", label: "Reactions", placeholder: "1600" },
  { key: "followsGained", label: "Follows gained", placeholder: "120" },
  { key: "profileVisits", label: "Profile visits", placeholder: "420" },
  { key: "linkClicks", label: "Link clicks", placeholder: "35" },
  { key: "estimatedEarnings", label: "Estimated earnings", placeholder: "42" },
  { key: "rpm", label: "RPM", placeholder: "5.4" },
  { key: "monetizedPlays", label: "Monetized plays", placeholder: "21000" },
];

/** Builds the seeded local performance record for the current generated package. */
function buildPerformanceSeed(
  data: GeneratedPackage,
  generationId: string
): Partial<PerformanceTrackerEntry> {
  return {
    generationId,
    title: data.platformPack?.facebook.hook ?? data.hook,
    conceptLabel: [data.predatorName, data.preyName]
      .filter(Boolean)
      .join(" vs ")
      .concat(data.arcName ? ` • ${data.arcName}` : ""),
    predator: data.predatorName ?? "",
    prey: data.preyName ?? "",
    habitat: data.environmentName ?? "",
    arc: data.arcName ?? "",
    durationLane: data.durationLane ?? "short",
    hookFamily: data.hookFamily ?? "",
    contentLane: "Auto",
  };
}

/** Picks the best current local performance record for the active package. */
function buildInitialEntry(
  data: GeneratedPackage,
  generationId: string,
  seed: Partial<PerformanceTrackerEntry>,
  history: PerformanceTrackerEntry[]
): PerformanceTrackerEntry {
  const exact = readMonetizedPagePerformanceForGeneration(generationId);
  if (exact) return exact;

  const matched = matchFacebookInsightsRecord(history, data, generationId).record;
  if (matched) return matched;

  return buildBlankPerformanceTrackerEntry(seed);
}

/** Formats a tracker field for use in controlled form inputs. */
function formatFieldValue(value: string | number | "" | undefined): string {
  return value === undefined || value === null ? "" : String(value);
}

/** Returns the visual accent class for the monetized verdict pill. */
function getVerdictAccent(verdict: string): string {
  switch (verdict) {
    case "Monetized Winner":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    case "Viral But Risky":
      return "border-amber-200 bg-amber-50 text-amber-900";
    case "Safe Growth Candidate":
      return "border-sky-200 bg-sky-50 text-sky-900";
    case "Needs Packaging Fix":
      return "border-orange-200 bg-orange-50 text-orange-900";
    default:
      return "border-rose-200 bg-rose-50 text-rose-900";
  }
}

/** Returns a small accent class for the predicted-vs-actual status chip. */
function getComparisonAccent(status: PredictedVsActualMetricComparison["status"]): string {
  switch (status) {
    case "overperformed":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    case "matched":
      return "border-sky-200 bg-sky-50 text-sky-900";
    case "underperformed":
      return "border-amber-200 bg-amber-50 text-amber-900";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

/** Formats the record-match label shown after CSV import or history lookup. */
function formatMatchLabel(matchType: ReturnType<typeof matchFacebookInsightsRecord>["matchedBy"]): string {
  switch (matchType) {
    case "generationId":
      return "Matched by generation ID";
    case "postUrl":
      return "Matched by post URL";
    case "title":
      return "Matched by title";
    case "conceptLabel":
      return "Matched by concept label";
    default:
      return "No matched import yet";
  }
}

/** Returns the clearest label for a Growth Doctor finding card. */
function formatGrowthDoctorRecordHeading(record: PerformanceTrackerEntry | null): string {
  if (!record) return "Insufficient data";

  return (
    record.title?.trim() ||
    record.conceptLabel?.trim() ||
    record.postUrl?.trim() ||
    record.generationId?.trim() ||
    "Imported Facebook post"
  );
}

export function MonetizedPagePerformancePanel({
  data,
  onCopy,
}: {
  data: GeneratedPackage;
  onCopy: (text: string) => void | Promise<unknown>;
}) {
  const generationId = useMemo(
    () => getRealGenerationEvidenceGenerationId(data),
    [data]
  );
  const seed = useMemo(() => buildPerformanceSeed(data, generationId), [data, generationId]);
  const [history, setHistory] = useState<PerformanceTrackerEntry[]>(() =>
    readMonetizedPagePerformanceHistory()
  );
  const [entry, setEntry] = useState<PerformanceTrackerEntry>(() =>
    buildInitialEntry(data, generationId, seed, readMonetizedPagePerformanceHistory())
  );
  const [jsonImportValue, setJsonImportValue] = useState("");
  const [csvImportValue, setCsvImportValue] = useState("");
  const [notice, setNotice] = useState("");
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [lastImportCount, setLastImportCount] = useState(0);

  const matchedRecord = useMemo(
    () => matchFacebookInsightsRecord(history, data, generationId),
    [history, data, generationId]
  );
  const importedRecords = useMemo(
    () => history.filter((record) => record.source === "facebook_csv"),
    [history]
  );
  const report = useMemo(
    () => buildMonetizedFacebookReport(data, entry),
    [data, entry]
  );
  const jsonValue = useMemo(
    () => serializePerformanceTrackerEntryAsJson(entry),
    [entry]
  );
  const csvValue = useMemo(
    () => serializePerformanceTrackerEntryAsCsvRow(entry, true),
    [entry]
  );
  const importedJsonValue = useMemo(
    () => serializePerformanceTrackerEntriesAsJson(importedRecords),
    [importedRecords]
  );
  const importedCsvValue = useMemo(
    () => serializePerformanceTrackerEntriesAsCsv(importedRecords),
    [importedRecords]
  );
  const growthDoctorSummary = useMemo(
    () => buildCsvGrowthDoctorSummary(importedRecords),
    [importedRecords]
  );
  const growthDoctorSummaryText = useMemo(
    () => formatCsvGrowthDoctorSummary(growthDoctorSummary),
    [growthDoctorSummary]
  );

  const setTextField = (key: TextFieldKey, value: string) => {
    setEntry((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const setNumberField = (key: NumberFieldKey, value: string) => {
    setEntry((current) => ({
      ...current,
      [key]: value.trim() ? Number(value) : "",
    }));
  };

  const saveRecord = () => {
    const next = buildBlankPerformanceTrackerEntry({
      ...seed,
      ...entry,
      generationId,
      source: "manual",
    });
    upsertMonetizedPagePerformanceRecord(next);
    setEntry(next);
    setHistory(readMonetizedPagePerformanceHistory());
    setNotice("Saved locally for this generation.");
  };

  const importJsonRecord = () => {
    const parsed = parsePerformanceTrackerEntryJson(jsonImportValue, {
      ...seed,
      generationId,
      source: "manual",
    });

    if (!parsed) {
      setNotice("Import failed. Paste valid JSON from the performance template first.");
      return;
    }

    const next = buildBlankPerformanceTrackerEntry({
      ...seed,
      ...parsed,
      generationId,
      source: parsed.source ?? "manual",
    });
    upsertMonetizedPagePerformanceRecord(next);
    setEntry(next);
    setHistory(readMonetizedPagePerformanceHistory());
    setNotice("Imported JSON and saved it locally for this generation.");
    setImportWarnings([]);
  };

  /** Imports raw CSV text into local-only history and refreshes the current package match. */
  const applyCsvImport = (
    csvText: string,
    getSuccessNotice: (recordCount: number) => string
  ) => {
    const result = importFacebookInsightsCsv(csvText);
    setImportWarnings(result.warnings);
    setLastImportCount(result.records.length);

    if (result.records.length === 0) {
      setNotice("No importable Facebook Insights rows were found in the CSV.");
      return;
    }

    upsertMonetizedPagePerformanceRecords(result.records);
    const nextHistory = readMonetizedPagePerformanceHistory();
    const nextMatch = matchFacebookInsightsRecord(nextHistory, data, generationId);

    setHistory(nextHistory);
    if (nextMatch.record) {
      setEntry(nextMatch.record);
    }

    setNotice(getSuccessNotice(result.records.length));
  };

  /** Imports the CSV text currently pasted into the textarea. */
  const importCsvRecords = () => {
    applyCsvImport(
      csvImportValue,
      (recordCount) =>
        `Imported ${recordCount} Facebook Insights record${recordCount === 1 ? "" : "s"} locally.`
    );
  };

  /** Handles local CSV file uploads and routes the text through the existing parser. */
  const handleCsvFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      if (!isFacebookInsightsCsvFile(file)) {
        setNotice("Please upload a valid Facebook Insights CSV file.");
        return;
      }

      const text = await file.text();
      setCsvImportValue(text);
      applyCsvImport(
        text,
        (recordCount) =>
          `Uploaded and analyzed ${recordCount} Facebook Insights record${recordCount === 1 ? "" : "s"}.`
      );
    } catch {
      setNotice("CSV upload failed. Please check the file and try again.");
    } finally {
      event.target.value = "";
    }
  };

  const copyImported = (value: string, emptyNotice: string) => {
    if (importedRecords.length === 0) {
      setNotice(emptyNotice);
      return;
    }

    void onCopy(value);
    setNotice(`Copied ${importedRecords.length} imported record${importedRecords.length === 1 ? "" : "s"}.`);
  };

  /** Copies the local-only Growth Doctor summary for quick review or sharing. */
  const copyGrowthDoctorSummary = () => {
    if (growthDoctorSummary.importedRecordCount === 0) {
      setNotice("Import Facebook Insights CSV rows first to build a Growth Doctor summary.");
      return;
    }

    void onCopy(growthDoctorSummaryText);
    setNotice("Copied CSV Growth Doctor summary.");
  };

  const clearImportedRecords = () => {
    clearImportedMonetizedPagePerformanceRecords();
    const nextHistory = readMonetizedPagePerformanceHistory();
    setHistory(nextHistory);
    setEntry(buildInitialEntry(data, generationId, seed, nextHistory));
    setNotice("Cleared imported Facebook Insights rows and kept manual records.");
    setImportWarnings([]);
    setLastImportCount(0);
  };

  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <div className="text-sm font-extrabold text-[color:var(--text)]">
            Monetized Page Performance
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[color:var(--muted)]">
            Local-only Facebook Page performance layer for monetized decision-making. Import Insights CSV, compare predicted versus actual results, and decide what to boost, remake, or rewrite next.
          </p>
        </div>
        <div className={`rounded-2xl border px-4 py-3 text-right ${getVerdictAccent(report.verdict)}`}>
          <div className="text-[11px] font-bold uppercase tracking-wide opacity-80">
            Monetized verdict
          </div>
          <div className="mt-1 text-lg font-black">{report.verdict}</div>
          <div className="mt-1 text-xs font-semibold">
            Tier: {report.actualPerformanceTier}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {SCORE_META.map((item) => (
          <div key={item.key} className={`rounded-2xl border p-3 ${item.accent}`}>
            <div className="text-[11px] font-bold uppercase tracking-wide opacity-80">
              {item.label}
            </div>
            <div className="mt-2 text-2xl font-black">{report.scores[item.key]}/100</div>
            <p className="mt-1 text-xs leading-relaxed opacity-85">{item.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {ACTUAL_SCORE_META.map((item) => (
          <div key={item.key} className={`rounded-2xl border p-3 ${item.accent}`}>
            <div className="text-[11px] font-bold uppercase tracking-wide opacity-80">
              {item.label}
            </div>
            <div className="mt-2 text-2xl font-black">
              {report.actualScores[item.key]}/100
            </div>
            <p className="mt-1 text-xs leading-relaxed opacity-85">{item.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 text-sm leading-relaxed text-[color:var(--muted)]">
        {report.summary}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-sm font-extrabold text-[color:var(--text)]">Performance input</div>
              <p className="mt-1 text-xs leading-relaxed text-[color:var(--muted)]">
                Manual entry and CSV imports stay in this browser only. Import JSON if you already exported a tracker row or copied a saved template.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={saveRecord}
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 active:scale-95"
              >
                Save locally
              </button>
              <button
                type="button"
                onClick={() => onCopy(jsonValue)}
                className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-1.5 text-xs font-bold text-[color:var(--muted)] hover:bg-[color:var(--surface-elevated)] active:scale-95"
              >
                Copy JSON
              </button>
              <button
                type="button"
                onClick={() => onCopy(csvValue)}
                className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-1.5 text-xs font-bold text-[color:var(--muted)] hover:bg-[color:var(--surface-elevated)] active:scale-95"
              >
                Copy CSV
              </button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-xs text-[color:var(--muted)]">
              <div className="font-bold text-[color:var(--text)]">Imported records</div>
              <div className="mt-1 text-lg font-black text-[color:var(--text)]">{importedRecords.length}</div>
            </div>
            <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-xs text-[color:var(--muted)]">
              <div className="font-bold text-[color:var(--text)]">Last CSV import</div>
              <div className="mt-1 text-lg font-black text-[color:var(--text)]">{lastImportCount}</div>
            </div>
            <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-xs text-[color:var(--muted)]">
              <div className="font-bold text-[color:var(--text)]">Current match</div>
              <div className="mt-1 font-semibold text-[color:var(--text)]">{formatMatchLabel(matchedRecord.matchedBy)}</div>
            </div>
            <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-xs text-[color:var(--muted)]">
              <div className="font-bold text-[color:var(--text)]">Unmatched imports</div>
              <div className="mt-1 text-lg font-black text-[color:var(--text)]">{matchedRecord.unmatchedCount}</div>
            </div>
          </div>

          {notice && (
            <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs leading-relaxed text-cyan-900">
              {notice}
            </div>
          )}

          {importWarnings.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <div className="font-bold uppercase tracking-wide">Import warnings</div>
              <div className="mt-2 space-y-1">
                {importWarnings.map((warning, index) => (
                  <div key={`${warning}-${index}`}>{warning}</div>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            {TEXT_FIELDS.map((field) => (
              <label key={field.key} className="space-y-1 text-xs text-[color:var(--muted)]">
                <span className="font-bold text-[color:var(--text)]">{field.label}</span>
                <input
                  type="text"
                  value={formatFieldValue(entry[field.key])}
                  onChange={(event) => setTextField(field.key, event.target.value)}
                  placeholder={field.placeholder}
                  className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-sm text-[color:var(--text)] outline-none focus:border-cyan-400"
                />
              </label>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {NUMBER_FIELDS.map((field) => (
              <label key={field.key} className="space-y-1 text-xs text-[color:var(--muted)]">
                <span className="font-bold text-[color:var(--text)]">{field.label}</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formatFieldValue(entry[field.key])}
                  onChange={(event) => setNumberField(field.key, event.target.value)}
                  placeholder={field.placeholder}
                  className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-sm text-[color:var(--text)] outline-none focus:border-cyan-400"
                />
              </label>
            ))}
          </div>

          <label className="space-y-1 text-xs text-[color:var(--muted)]">
            <span className="font-bold text-[color:var(--text)]">Notes</span>
            <textarea
              value={entry.notes}
              onChange={(event) => setTextField("notes", event.target.value)}
              placeholder="What made this post earn, stall, or feel risky after publishing?"
              rows={4}
              className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-sm text-[color:var(--text)] outline-none focus:border-cyan-400"
            />
          </label>

          <label className="space-y-1 text-xs text-[color:var(--muted)]">
            <span className="font-bold text-[color:var(--text)]">Import JSON</span>
            <textarea
              value={jsonImportValue}
              onChange={(event) => setJsonImportValue(event.target.value)}
              placeholder="Paste a saved performance JSON payload here, then click Import JSON."
              rows={4}
              className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-sm text-[color:var(--text)] outline-none focus:border-cyan-400"
            />
          </label>

          <button
            type="button"
            onClick={importJsonRecord}
            className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-800 hover:bg-indigo-100 active:scale-95"
          >
            Import JSON
          </button>

          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-sm font-extrabold text-[color:var(--text)]">Facebook Insights CSV import</div>
                <p className="mt-1 text-xs leading-relaxed text-[color:var(--muted)]">
                  Paste CSV exported from Facebook Insights. Matching prefers generation ID, then falls back to URL, title, or concept label.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => copyImported(importedJsonValue, "No imported Facebook Insights records to copy yet.")}
                  className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-elevated)] px-3 py-1.5 text-xs font-bold text-[color:var(--muted)] hover:bg-[color:var(--surface-muted)] active:scale-95"
                >
                  Copy imported JSON
                </button>
                <button
                  type="button"
                  onClick={() => copyImported(importedCsvValue, "No imported Facebook Insights records to copy yet.")}
                  className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-elevated)] px-3 py-1.5 text-xs font-bold text-[color:var(--muted)] hover:bg-[color:var(--surface-muted)] active:scale-95"
                >
                  Copy imported CSV
                </button>
                <button
                  type="button"
                  onClick={clearImportedRecords}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-800 hover:bg-rose-100 active:scale-95"
                >
                  Clear imported
                </button>
              </div>
            </div>

            <label className="mt-3 block space-y-1 text-xs text-[color:var(--muted)]">
              <span className="font-bold text-[color:var(--text)]">
                Upload Facebook Insights CSV file
              </span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleCsvFileUpload}
                className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] px-3 py-2 text-sm text-[color:var(--text)] outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-50 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-cyan-900 hover:file:bg-cyan-100"
              />
              <p className="text-[11px] leading-relaxed text-[color:var(--muted)]">
                Upload the CSV exported from Facebook Insights. The system will import rows,
                match the current post by generation ID, URL, title, or concept label, then
                update the actual-performance analysis automatically.
              </p>
            </label>

            <label className="mt-3 block space-y-1 text-xs text-[color:var(--muted)]">
              <span className="font-bold text-[color:var(--text)]">Paste CSV text</span>
              <textarea
                value={csvImportValue}
                onChange={(event) => setCsvImportValue(event.target.value)}
                placeholder="generationId,postUrl,title,reach,3-second video views,1-minute video views,average watch time,shares,comments,estimated earnings,rpm"
                rows={6}
                className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] px-3 py-2 text-sm text-[color:var(--text)] outline-none focus:border-cyan-400"
              />
            </label>

            <button
              type="button"
              onClick={importCsvRecords}
              className="mt-3 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-bold text-cyan-900 hover:bg-cyan-100 active:scale-95"
            >
              Import Facebook Insights CSV
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div
            data-testid="csv-growth-doctor-panel"
            className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-extrabold text-[color:var(--text)]">
                  CSV Growth Doctor
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[color:var(--muted)]">
                  Local-only analysis across every imported Facebook Insights row. Use it to spot
                  winning packages, weak monetization patterns, and the cleanest rewrite or boost
                  opportunities.
                </p>
              </div>
              <button
                type="button"
                onClick={copyGrowthDoctorSummary}
                className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-1.5 text-xs font-bold text-[color:var(--muted)] hover:bg-[color:var(--surface-elevated)] active:scale-95"
              >
                Copy Growth Doctor Summary
              </button>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-xs text-[color:var(--muted)]">
                <div className="font-bold text-[color:var(--text)]">Imported rows analyzed</div>
                <div className="mt-1 text-lg font-black text-[color:var(--text)]">
                  {growthDoctorSummary.importedRecordCount}
                </div>
              </div>
              <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-xs text-[color:var(--muted)]">
                <div className="font-bold text-[color:var(--text)]">Biggest issue</div>
                <div className="mt-1 font-semibold text-[color:var(--text)]">
                  {growthDoctorSummary.biggestIssue?.label ?? "No issue detected yet"}
                </div>
              </div>
              <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-xs text-[color:var(--muted)]">
                <div className="font-bold text-[color:var(--text)]">Boost candidates</div>
                <div className="mt-1 text-lg font-black text-[color:var(--text)]">
                  {growthDoctorSummary.boostCandidates.length}
                </div>
              </div>
            </div>

            {growthDoctorSummary.importedRecordCount === 0 ? (
              <div className="mt-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-3 text-xs leading-relaxed text-[color:var(--muted)]">
                Import Facebook Insights CSV rows to unlock the Growth Doctor dashboard.
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {growthDoctorSummary.findings.map((finding) => (
                  <div
                    key={finding.id}
                    className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wide text-[color:var(--text)]">
                          {finding.label}
                        </div>
                        <div className="mt-1 text-sm font-semibold text-[color:var(--text)]">
                          {formatGrowthDoctorRecordHeading(finding.record)}
                        </div>
                        {finding.record?.conceptLabel && (
                          <p className="mt-1 text-[11px] leading-relaxed text-[color:var(--muted)]">
                            {finding.record.conceptLabel}
                          </p>
                        )}
                      </div>
                      {finding.record?.postUrl ? (
                        <a
                          href={finding.record.postUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-bold text-cyan-700 hover:text-cyan-900"
                        >
                          Open post
                        </a>
                      ) : null}
                    </div>
                    <div className="mt-2 text-xs font-semibold text-[color:var(--text)]">
                      {finding.keyMetric}
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-[color:var(--muted)]">
                      {finding.diagnosis}
                    </p>
                    <p className="mt-1 text-xs font-semibold leading-relaxed text-[color:var(--text)]">
                      Action: {finding.recommendedAction}
                    </p>
                  </div>
                ))}

                {growthDoctorSummary.rewriteRecommendations.length > 0 && (
                  <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3">
                    <div className="text-xs font-bold uppercase tracking-wide text-[color:var(--text)]">
                      Rewrite recommendations
                    </div>
                    <div className="mt-2 space-y-1 text-xs leading-relaxed text-[color:var(--muted)]">
                      {growthDoctorSummary.rewriteRecommendations.map((recommendation) => (
                        <div key={recommendation}>• {recommendation}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4">
            <div className="text-sm font-extrabold text-[color:var(--text)]">Predicted vs actual</div>
            <div className="mt-3 space-y-3">
              {Object.values(report.predictedVsActual).map((comparison) => (
                <div
                  key={comparison.label}
                  className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs font-bold uppercase tracking-wide text-[color:var(--text)]">
                      {comparison.label}
                    </div>
                    <div className={`rounded-full border px-2 py-1 text-[11px] font-bold uppercase tracking-wide ${getComparisonAccent(comparison.status)}`}>
                      {comparison.status}
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-[color:var(--muted)]">
                    <div>Predicted: {comparison.predictedScore}/100</div>
                    <div>Actual: {comparison.actualScore}/100</div>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-[color:var(--muted)]">
                    {comparison.likelyReason}
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-relaxed text-[color:var(--text)]">
                    Next: {comparison.nextRecommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4">
            <div className="text-sm font-extrabold text-[color:var(--text)]">Boost recommendation</div>
            <div className={`mt-3 rounded-xl border px-3 py-3 text-sm ${report.boostRecommendation.shouldBoost ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
              <div className="font-black">{report.boostRecommendation.label}</div>
              <p className="mt-1 text-xs leading-relaxed">{report.boostRecommendation.reason}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4">
            <div className="text-sm font-extrabold text-[color:var(--text)]">Winner remix recommendations</div>
            <div className="mt-3 space-y-2">
              {report.winnerRemixRecommendations.map((recommendation, index) => (
                <div
                  key={`${recommendation.label}-${index}`}
                  className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2"
                >
                  <div className="text-xs font-bold uppercase tracking-wide text-[color:var(--text)]">
                    {recommendation.label}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-[color:var(--muted)]">
                    {recommendation.reason}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4">
            <div className="text-sm font-extrabold text-[color:var(--text)]">What to improve next</div>
            <div className="mt-3 space-y-2">
              {report.improvementNotes.map((note, index) => (
                <div
                  key={`${note}-${index}`}
                  className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-xs leading-relaxed text-[color:var(--muted)]"
                >
                  {note}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4">
            <div className="text-sm font-extrabold text-[color:var(--text)]">Revenue-aware prompt recommendations</div>
            <div className="mt-3 space-y-3">
              {Object.values(report.promptRecommendations).map((recommendation) => (
                <div
                  key={recommendation.label}
                  className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wide text-[color:var(--text)]">
                        {recommendation.label}
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-[color:var(--muted)]">
                        {recommendation.reason}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onCopy(recommendation.packageText)}
                      className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-elevated)] px-3 py-1.5 text-xs font-bold text-[color:var(--muted)] hover:bg-[color:var(--surface-muted)] active:scale-95"
                    >
                      Copy version
                    </button>
                  </div>
                  <pre className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-[color:var(--text)]">
                    {recommendation.packageText}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
