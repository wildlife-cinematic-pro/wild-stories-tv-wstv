"use client";

import { useEffect, useMemo, useState } from "react";

import { buildABTestPlan, type ABTestPlanVariant } from "@/lib/ab-test-plan";
import {
  buildAutoRecommendations,
  type AutoRecommendationResult,
} from "@/lib/auto-recommendations";
import { buildFacebookCaptionVariants } from "@/lib/facebook-caption-variants";
import { buildFacebookHookVariants } from "@/lib/facebook-hook-variants";
import { analyzeFacebookReelsPackage } from "@/lib/facebook-reels-scoring";
import { analyzeStoryModePackage } from "@/lib/story-mode-qa";
import {
  formatStoryModePresetLabel,
  USA_STORY_MODE_PRESETS,
  type StoryModePreset,
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
            <li key={item}>* {item}</li>
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

function buildVariantCopyText(variant: ABTestPlanVariant) {
  return [
    "Hook:",
    variant.hook,
    "",
    "Caption:",
    variant.caption,
    "",
    "Hashtags:",
    variant.hashtags.join(" "),
  ].join("\n");
}

function ABVariantCard({
  variant,
  copied,
  onCopy,
}: {
  variant: ABTestPlanVariant;
  copied: boolean;
  onCopy: (variant: ABTestPlanVariant) => void;
}) {
  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-amber-700 dark:text-amber-200">
          Variant {variant.label}
        </span>
        <button
          type="button"
          onClick={() => onCopy(variant)}
          className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-elevated)] px-3 py-1.5 text-[10px] font-bold text-[color:var(--text)] hover:bg-[color:var(--surface-muted)] active:scale-95"
        >
          {copied ? "Copied" : `Copy ${variant.label}`}
        </button>
      </div>
      <p className="mt-3 text-xs font-black text-[color:var(--text)]">{variant.hook}</p>
      <p className="mt-2 text-xs leading-relaxed text-[color:var(--muted)]">
        {variant.caption}
      </p>
      <p className="mt-2 break-words text-[11px] font-semibold text-cyan-700 dark:text-cyan-200">
        {variant.hashtags.join(" ")}
      </p>
      <div className="mt-3 grid gap-2 text-[11px] leading-relaxed text-[color:var(--muted)] sm:grid-cols-2">
        <p>
          <span className="font-bold text-[color:var(--text)]">Focus:</span> {variant.testFocus}
        </p>
        <p>
          <span className="font-bold text-[color:var(--text)]">Signal:</span> {variant.expectedSignal}
        </p>
      </div>
    </div>
  );
}

export default function AutoRecommendationsCard({
  data,
  onCopy,
  onApplyStoryModePreset,
}: {
  data: GeneratedPackage;
  onCopy?: (text: string) => void | Promise<unknown>;
  onApplyStoryModePreset?: (preset: StoryModePreset) => void;
}) {
  const [records, setRecords] = useState<ReelPerformanceRecord[]>([]);
  const [applyNotice, setApplyNotice] = useState<string | null>(null);
  const [copiedVariant, setCopiedVariant] = useState<ABTestPlanVariant["label"] | null>(null);

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

  const facebookScore = useMemo(() => analyzeFacebookReelsPackage(data), [data]);
  const storyModeQA = useMemo(() => analyzeStoryModePackage(data), [data]);
  const hookVariants = useMemo(() => buildFacebookHookVariants(data), [data]);
  const captionVariants = useMemo(() => buildFacebookCaptionVariants(data), [data]);

  const recommendation = useMemo(
    () =>
      buildAutoRecommendations({
        savedRecords: records,
        currentPackage: data,
        storyModePresets: USA_STORY_MODE_PRESETS,
        facebookScore,
        storyModeQA,
      }),
    [data, facebookScore, records, storyModeQA]
  );

  const recommendedPreset = useMemo(
    () =>
      USA_STORY_MODE_PRESETS.find(
        (preset) => preset.id === recommendation.nextBestPresetId
      ),
    [recommendation.nextBestPresetId]
  );

  const abTestPlan = useMemo(
    () =>
      buildABTestPlan({
        currentPackage: data,
        recommendation,
        facebookScore,
        storyModeQA,
        hookVariants,
        captionVariants,
      }),
    [captionVariants, data, facebookScore, hookVariants, recommendation, storyModeQA]
  );

  const subjects = [
    recommendation.recommendedSubjects?.subjectA,
    recommendation.recommendedSubjects?.subjectB,
  ]
    .filter(Boolean)
    .join(" + ");

  function handleApplyRecommendedPreset() {
    if (!recommendedPreset || !onApplyStoryModePreset) return;
    onApplyStoryModePreset(recommendedPreset);
    setApplyNotice("Recommended preset applied. Review Step 1, then generate.");
  }

  async function handleCopyVariant(variant: ABTestPlanVariant) {
    await onCopy?.(buildVariantCopyText(variant));
    setCopiedVariant(variant.label);
    window.setTimeout(() => setCopiedVariant(null), 1600);
  }

  const canApplyRecommendedPreset = Boolean(recommendedPreset && onApplyStoryModePreset);

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
            {canApplyRecommendedPreset ? "Action available" : "Display only"}
          </span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-[color:var(--muted)]">
          {canApplyRecommendedPreset
            ? "Apply the recommended USA Story Mode Preset with the same Step 1 preset flow. This does not auto-generate, post, scrape, or call any backend/API."
            : "Apply manually from USA Story Mode Presets. This panel does not auto-apply, auto-generate, post, scrape, or call any backend/API."}
        </p>
        {recommendation.recommendedCaptionStyle && (
          <p className="mt-2 text-xs leading-relaxed text-[color:var(--muted)]">
            Caption style: {recommendation.recommendedCaptionStyle}
          </p>
        )}
        {recommendedPreset && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {canApplyRecommendedPreset ? (
              <button
                type="button"
                onClick={handleApplyRecommendedPreset}
                className="rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-4 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-500/20 active:scale-95 dark:text-emerald-200"
              >
                Apply Recommended Preset
              </button>
            ) : null}
            <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-1 text-[10px] font-bold text-[color:var(--muted)]">
              {recommendedPreset.name}
            </span>
          </div>
        )}
        {applyNotice && (
          <p className="mt-3 rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-2 text-xs font-semibold text-emerald-700 dark:text-emerald-200">
            {applyNotice}
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

      <div className="mt-4 rounded-xl border border-indigo-400/20 bg-indigo-500/10 p-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-indigo-700 dark:text-indigo-200">
              Next A/B Test Plan
            </p>
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-[color:var(--muted)]">
              {abTestPlan.hypothesis}
            </p>
          </div>
          <span className="rounded-full border border-indigo-400/30 bg-indigo-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-indigo-700 dark:text-indigo-200">
            A/B/C
          </span>
        </div>
        <div className="mt-3 grid gap-3 xl:grid-cols-3">
          {abTestPlan.variants.map((variant) => (
            <ABVariantCard
              key={variant.label}
              variant={variant}
              copied={copiedVariant === variant.label}
              onCopy={handleCopyVariant}
            />
          ))}
        </div>
        <div className="mt-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3 text-xs leading-relaxed text-[color:var(--muted)]">
          <p>
            <span className="font-bold text-[color:var(--text)]">Success metric:</span>{" "}
            {abTestPlan.successMetric}
          </p>
          <ul className="mt-2 space-y-1">
            {abTestPlan.runNotes.slice(0, 3).map((note) => (
              <li key={note}>* {note}</li>
            ))}
          </ul>
        </div>
      </div>

      {recommendation.warnings.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-500/10 p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-700 dark:text-amber-200">
            Learning Notes
          </p>
          <ul className="mt-2 space-y-1 text-xs leading-relaxed text-[color:var(--muted)]">
            {recommendation.warnings.map((warning) => (
              <li key={warning}>* {warning}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
