"use client";

import { useEffect, useMemo, useState } from "react";

import {
  buildAutoRecommendations,
  type AutoRecommendationResult,
} from "@/lib/auto-recommendations";
import { analyzeFacebookReelsPackage } from "@/lib/facebook-reels-scoring";
import { analyzeStoryModePackage } from "@/lib/story-mode-qa";
import {
  formatStoryModePresetLabel,
  USA_STORY_MODE_PRESETS,
} from "@/lib/story-mode-presets";
import {
  readReelPerformanceRecords,
  REELS_PERFORMANCE_STORAGE_EVENT,
} from "@/lib/reels-performance-storage";

import type { GeneratedPackage, ReelPerformanceRecord } from "@/types";

const statusTone: Record<AutoRecommendationResult["status"], string> = {
  ready:
    "border-emerald-400/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
  learning: "border-cyan-400/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-200",
  "needs-more-data":
    "border-amber-400/30 bg-amber-500/10 text-amber-700 dark:text-amber-200",
};

function formatValue(value: string | number | undefined, fallback = "Not enough data") {
  if (value === undefined || value === null || value === "") return fallback;
  return formatStoryModePresetLabel(value);
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--muted)]">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-black text-[color:var(--text)]">
        {value}
      </p>
    </div>
  );
}

function RecommendationList({
  title,
  items,
  empty,
  tone,
}: {
  title: string;
  items: string[];
  empty: string;
  tone: "emerald" | "amber" | "sky";
}) {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
      : tone === "amber"
        ? "border-amber-400/20 bg-amber-500/10 text-amber-700 dark:text-amber-200"
        : "border-sky-400/20 bg-sky-500/10 text-sky-700 dark:text-sky-200";

  return (
    <div className={`rounded-xl border p-3 ${toneClass}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em]">{title}</p>
      {items.length ? (
        <ul className="mt-2 space-y-1 text-xs leading-relaxed text-[color:var(--muted)]">
          {items.slice(0, 4).map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs leading-relaxed text-[color:var(--muted)]">
          {empty}
        </p>
      )}
    </div>
  );
}

export default function AutoRecommendationsCard({ data }: { data: GeneratedPackage }) {
  const [records, setRecords] = useState<ReelPerformanceRecord[]>([]);

  useEffect(() => {
    function loadRecords() {
      setRecords(readReelPerformanceRecords());
    }

    loadRecords();
    window.addEventListener(REELS_PERFORMANCE_STORAGE_EVENT, loadRecords);
    window.addEventListener("storage", loadRecords);
    return () => {
      window.removeEventListener(REELS_PERFORMANCE_STORAGE_EVENT, loadRecords);
      window.removeEventListener("storage", loadRecords);
    };
  }, []);

  const recommendation = useMemo(
    () =>
      buildAutoRecommendations({
        savedRecords: records,
        currentPackage: data,
        storyModePresets: USA_STORY_MODE_PRESETS,
        facebookScore: analyzeFacebookReelsPackage(data),
        storyModeQA: analyzeStoryModePackage(data),
      }),
    [data, records]
  );

  const subjects = [
    recommendation.recommendedSubjects?.subjectA,
    recommendation.recommendedSubjects?.subjectB,
  ]
    .filter(Boolean)
    .join(" + ");

  return (
    <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
            Auto Recommendations
          </p>
          <h3 className="mt-1 text-base font-black text-[color:var(--text)]">
            {recommendation.confidence}/100 confidence
          </h3>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[color:var(--muted)]">
            Local-only next-idea guidance from saved Reels performance, USA presets,
            Story Mode QA, and Facebook Reels optimizer signals.
          </p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${statusTone[recommendation.status]}`}
        >
          {recommendation.status.replaceAll("-", " ")}
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <MetricPill
          label="Next Story Mode"
          value={formatValue(recommendation.nextBestStoryMode)}
        />
        <MetricPill
          label="Recommended Preset"
          value={recommendation.nextBestPresetName ?? "Apply manually from USA Story Mode Presets"}
        />
        <MetricPill
          label="Viral Lane"
          value={formatValue(recommendation.nextBestViralLane)}
        />
        <MetricPill
          label="Habitat"
          value={formatValue(recommendation.nextBestHabitatRegion)}
        />
        <MetricPill
          label="Hook Style"
          value={formatValue(recommendation.recommendedHookStyle)}
        />
        <MetricPill
          label="Subjects"
          value={subjects || "Use selected Build subjects"}
        />
      </div>

      <div className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-cyan-700 dark:text-cyan-200">
            Apply Guidance
          </p>
          <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-cyan-700 dark:text-cyan-200">
            Display only
          </span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-[color:var(--muted)]">
          Apply manually from USA Story Mode Presets. This Phase 5 panel does not
          auto-apply, auto-generate, post, scrape, or call any backend/API.
        </p>
        {recommendation.recommendedCaptionStyle && (
          <p className="mt-2 text-xs leading-relaxed text-[color:var(--muted)]">
            Caption style: {recommendation.recommendedCaptionStyle}
          </p>
        )}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <RecommendationList
          title="Reasons"
          items={recommendation.reasons}
          empty="Save performance records to create stronger reasons."
          tone="emerald"
        />
        <RecommendationList
          title="Test Next"
          items={recommendation.testIdeas}
          empty="No test ideas yet."
          tone="sky"
        />
        <RecommendationList
          title="Avoid Next"
          items={recommendation.avoidList}
          empty="No weak or unsafe pattern detected yet."
          tone="amber"
        />
      </div>

      {recommendation.warnings.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-500/10 p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-700 dark:text-amber-200">
            Learning Notes
          </p>
          <ul className="mt-2 space-y-1 text-xs leading-relaxed text-[color:var(--muted)]">
            {recommendation.warnings.map((warning) => (
              <li key={warning}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
