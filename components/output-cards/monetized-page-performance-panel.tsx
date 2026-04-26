"use client";

import { useMemo, useState } from "react";

import type { GeneratedPackage, PerformanceTrackerEntry } from "@/types";

import { buildMonetizedFacebookReport } from "@/lib/facebook-monetization-engine";
import {
  buildBlankPerformanceTrackerEntry,
  parsePerformanceTrackerEntryJson,
  serializePerformanceTrackerEntryAsCsvRow,
  serializePerformanceTrackerEntryAsJson,
} from "@/lib/performance-tracker";
import { getRealGenerationEvidenceGenerationId } from "@/lib/real-generation-evidence";
import {
  readMonetizedPagePerformanceForGeneration,
  upsertMonetizedPagePerformanceRecord,
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
  const [entry, setEntry] = useState<PerformanceTrackerEntry>(() => {
    return (
      readMonetizedPagePerformanceForGeneration(generationId) ??
      buildBlankPerformanceTrackerEntry(seed)
    );
  });
  const [importValue, setImportValue] = useState("");
  const [notice, setNotice] = useState("");




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
    });
    upsertMonetizedPagePerformanceRecord(next);
    setEntry(next);
    setNotice("Saved locally for this generation.");
  };

  const importRecord = () => {
    const parsed = parsePerformanceTrackerEntryJson(importValue, {
      ...seed,
      generationId,
    });

    if (!parsed) {
      setNotice("Import failed. Paste valid JSON from the performance template first.");
      return;
    }

    setEntry(parsed);
    upsertMonetizedPagePerformanceRecord(parsed);
    setNotice("Imported JSON and saved it locally for this generation.");
  };

  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <div className="text-sm font-extrabold text-[color:var(--text)]">
            Monetized Page Performance
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[color:var(--muted)]">
            Local-only Facebook Page performance layer for monetized decision-making. Enter live post metrics, compare revenue-aware scores, and decide whether this package is only safe to publish or genuinely worth boosting.
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

      <div className="mt-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 text-sm leading-relaxed text-[color:var(--muted)]">
        {report.summary}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-sm font-extrabold text-[color:var(--text)]">Performance input</div>
              <p className="mt-1 text-xs leading-relaxed text-[color:var(--muted)]">
                Manual entry stays in this browser only. Use JSON import if you already exported a tracker row or saved a copied template.
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

          {notice && (
            <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs leading-relaxed text-cyan-900">
              {notice}
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
              value={importValue}
              onChange={(event) => setImportValue(event.target.value)}
              placeholder="Paste a saved performance JSON payload here, then click Import JSON."
              rows={4}
              className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-sm text-[color:var(--text)] outline-none focus:border-cyan-400"
            />
          </label>

          <button
            type="button"
            onClick={importRecord}
            className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-800 hover:bg-indigo-100 active:scale-95"
          >
            Import JSON
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4">
            <div className="text-sm font-extrabold text-[color:var(--text)]">Boost recommendation</div>
            <div className={`mt-3 rounded-xl border px-3 py-3 text-sm ${report.boostRecommendation.shouldBoost ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
              <div className="font-black">{report.boostRecommendation.label}</div>
              <p className="mt-1 text-xs leading-relaxed">{report.boostRecommendation.reason}</p>
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
