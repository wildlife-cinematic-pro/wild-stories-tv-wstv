"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";

import { buildABTestPlan, type ABTestPlan, type ABTestPlanVariant } from "@/lib/ab-test-plan";
import { buildAutoRecommendations } from "@/lib/auto-recommendations";
import {
  deleteABExperimentRecord,
  findABExperimentByGenerationId,
  upsertABExperimentRecord,
  AB_EXPERIMENT_STORAGE_EVENT,
} from "@/lib/ab-experiment-storage";
import { analyzeABExperiment } from "@/lib/ab-experiment-scoring";
import { buildFacebookCaptionVariants } from "@/lib/facebook-caption-variants";
import { buildFacebookHookVariants } from "@/lib/facebook-hook-variants";
import { analyzeFacebookReelsPackage } from "@/lib/facebook-reels-scoring";
import {
  readReelPerformanceRecords,
  REELS_PERFORMANCE_STORAGE_EVENT,
} from "@/lib/reels-performance-storage";
import { analyzeStoryModePackage } from "@/lib/story-mode-qa";
import { USA_STORY_MODE_PRESETS } from "@/lib/story-mode-presets";

import type {
  ABExperimentRecord,
  ABExperimentVariantRecord,
  GeneratedPackage,
  ReelPerformanceRecord,
} from "@/types";

type VariantFormState = Record<
  ABExperimentVariantRecord["label"],
  {
    views: string;
    threeSecondViews: string;
    averageWatchTimeSeconds: string;
    durationSeconds: string;
    likes: string;
    comments: string;
    shares: string;
    saves: string;
    followsGained: string;
    notes: string;
  }
>;

const analysisTone: Record<ReturnType<typeof analyzeABExperiment>["status"], string> = {
  waiting: "border-slate-400/30 bg-slate-500/10 text-slate-700 dark:text-slate-200",
  "needs-more-data": "border-amber-400/30 bg-amber-500/10 text-amber-700 dark:text-amber-200",
  "winner-found": "border-emerald-400/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
};

function getGenerationId(data: GeneratedPackage): string {
  return (
    data.generationId ||
    [data.subjectA ?? data.predatorName, data.subjectB ?? data.preyName, data.generatedAt]
      .filter(Boolean)
      .join("|") ||
    "current-generated-package"
  );
}

function numberText(value: number | undefined): string {
  return value === undefined ? "" : String(value);
}

function toOptionalNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : undefined;
}

function variantRecordFromPlan(
  variant: ABTestPlanVariant,
  existing?: ABExperimentVariantRecord
): ABExperimentVariantRecord {
  return {
    label: variant.label,
    hook: variant.hook,
    caption: variant.caption,
    hashtags: variant.hashtags,
    testFocus: variant.testFocus,
    expectedSignal: variant.expectedSignal,
    views: existing?.views,
    threeSecondViews: existing?.threeSecondViews,
    averageWatchTimeSeconds: existing?.averageWatchTimeSeconds,
    durationSeconds: existing?.durationSeconds,
    likes: existing?.likes,
    comments: existing?.comments,
    shares: existing?.shares,
    saves: existing?.saves,
    followsGained: existing?.followsGained,
    notes: existing?.notes,
  };
}

function buildVariantFormState(
  plan: ABTestPlan,
  existing: ABExperimentRecord | null
): VariantFormState {
  return plan.variants.reduce((forms, variant) => {
    const existingVariant = existing?.variants.find(
      (candidate) => candidate.label === variant.label
    );
    forms[variant.label] = {
      views: numberText(existingVariant?.views),
      threeSecondViews: numberText(existingVariant?.threeSecondViews),
      averageWatchTimeSeconds: numberText(existingVariant?.averageWatchTimeSeconds),
      durationSeconds: numberText(existingVariant?.durationSeconds ?? 25),
      likes: numberText(existingVariant?.likes),
      comments: numberText(existingVariant?.comments),
      shares: numberText(existingVariant?.shares),
      saves: numberText(existingVariant?.saves),
      followsGained: numberText(existingVariant?.followsGained),
      notes: existingVariant?.notes ?? "",
    };
    return forms;
  }, {} as VariantFormState);
}

function hasVariantMetrics(variant: ABExperimentVariantRecord): boolean {
  return [
    variant.views,
    variant.threeSecondViews,
    variant.averageWatchTimeSeconds,
    variant.likes,
    variant.comments,
    variant.shares,
    variant.saves,
    variant.followsGained,
  ].some((value) => value !== undefined && value > 0);
}

function statusFromVariants(
  variants: ABExperimentVariantRecord[],
  analysis: ReturnType<typeof analyzeABExperiment>
): ABExperimentRecord["status"] {
  if (analysis.status === "winner-found") return "completed";
  return variants.some(hasVariantMetrics) ? "running" : "planned";
}

function scoreForLabel(
  analysis: ReturnType<typeof analyzeABExperiment>,
  label: ABExperimentVariantRecord["label"]
) {
  return analysis.variantScores.find((score) => score.label === label);
}

function makeDraftExperiment({
  data,
  generationId,
  plan,
  existingExperiment,
  form,
}: {
  data: GeneratedPackage;
  generationId: string;
  plan: ABTestPlan;
  existingExperiment: ABExperimentRecord | null;
  form: VariantFormState;
}): ABExperimentRecord {
  const now = new Date().toISOString();
  const variants = plan.variants.map((variant) => {
    const existingVariant = existingExperiment?.variants.find(
      (candidate) => candidate.label === variant.label
    );
    const variantForm = form[variant.label];
    return {
      ...variantRecordFromPlan(variant, existingVariant),
      views: toOptionalNumber(variantForm?.views ?? ""),
      threeSecondViews: toOptionalNumber(variantForm?.threeSecondViews ?? ""),
      averageWatchTimeSeconds: toOptionalNumber(
        variantForm?.averageWatchTimeSeconds ?? ""
      ),
      durationSeconds: toOptionalNumber(variantForm?.durationSeconds ?? ""),
      likes: toOptionalNumber(variantForm?.likes ?? ""),
      comments: toOptionalNumber(variantForm?.comments ?? ""),
      shares: toOptionalNumber(variantForm?.shares ?? ""),
      saves: toOptionalNumber(variantForm?.saves ?? ""),
      followsGained: toOptionalNumber(variantForm?.followsGained ?? ""),
      notes: variantForm?.notes.trim() || undefined,
    } satisfies ABExperimentVariantRecord;
  });
  const preliminary: ABExperimentRecord = {
    id: existingExperiment?.id ?? `abexp_${Date.now().toString(36)}`,
    generationId,
    createdAt: existingExperiment?.createdAt ?? now,
    updatedAt: now,
    title: plan.title,
    hypothesis: plan.hypothesis,
    storyMode: data.storyMode,
    viralLane: data.viralLane,
    habitatRegion: data.habitatRegion,
    subjectA: data.subjectA ?? data.predatorName,
    subjectB: data.subjectB ?? data.preyName,
    variants,
    status: "planned",
  };
  const analysis = analyzeABExperiment(preliminary);
  return {
    ...preliminary,
    winnerLabel: analysis.winnerLabel,
    status: statusFromVariants(variants, analysis),
  };
}

function VariantMetricInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="space-y-1 text-[11px] font-bold text-[color:var(--muted)]">
      <span>{label}</span>
      <input
        type="number"
        min="0"
        step="any"
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-2.5 py-2 text-xs text-[color:var(--text)] outline-none focus:border-indigo-400"
      />
    </label>
  );
}

export default function ABExperimentTrackerCard({ data }: { data: GeneratedPackage }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
          A/B Experiment Tracker
        </p>
        <h3 className="mt-1 text-base font-black text-[color:var(--text)]">
          Preparing local experiment tools
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-[color:var(--muted)]">
          The tracker loads after the generated output paints, keeping the main build flow responsive.
        </p>
      </section>
    );
  }

  return <ABExperimentTrackerLoaded data={data} />;
}

function ABExperimentTrackerLoaded({ data }: { data: GeneratedPackage }) {
  const generationId = useMemo(() => getGenerationId(data), [data]);
  const [records, setRecords] = useState<ReelPerformanceRecord[]>([]);
  const [existingExperiment, setExistingExperiment] = useState<ABExperimentRecord | null>(null);
  const [saveStatus, setSaveStatus] = useState("");

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
  const plan = useMemo(
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

  const [form, setForm] = useState<VariantFormState>(() =>
    buildVariantFormState(plan, null)
  );

  useEffect(() => {
    function loadExperiment() {
      const existing = findABExperimentByGenerationId(generationId);
      setExistingExperiment(existing);
      setForm(buildVariantFormState(plan, existing));
      setSaveStatus("");
    }

    loadExperiment();
    window.addEventListener(AB_EXPERIMENT_STORAGE_EVENT, loadExperiment);
    window.addEventListener("storage", loadExperiment);
    return () => {
      window.removeEventListener(AB_EXPERIMENT_STORAGE_EVENT, loadExperiment);
      window.removeEventListener("storage", loadExperiment);
    };
  }, [generationId, plan]);

  const previewExperiment = useMemo(
    () =>
      makeDraftExperiment({
        data,
        generationId,
        plan,
        existingExperiment,
        form,
      }),
    [data, existingExperiment, form, generationId, plan]
  );
  const analysis = useMemo(
    () => analyzeABExperiment(existingExperiment ?? previewExperiment),
    [existingExperiment, previewExperiment]
  );
  const winnerVariant = analysis.winnerLabel
    ? (existingExperiment ?? previewExperiment).variants.find(
        (variant) => variant.label === analysis.winnerLabel
      )
    : undefined;

  function updateField(
    label: ABExperimentVariantRecord["label"],
    field: keyof VariantFormState[ABExperimentVariantRecord["label"]]
  ) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((current) => ({
        ...current,
        [label]: {
          ...current[label],
          [field]: event.target.value,
        },
      }));
    };
  }

  function saveExperiment() {
    const saved = upsertABExperimentRecord(previewExperiment);
    setExistingExperiment(saved);
    setSaveStatus(saved ? "Saved A/B experiment locally" : "Could not save experiment");
  }

  function deleteExperiment() {
    if (!existingExperiment) return;
    deleteABExperimentRecord(existingExperiment.id);
    setExistingExperiment(null);
    setForm(buildVariantFormState(plan, null));
    setSaveStatus("Deleted local A/B experiment");
  }

  return (
    <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
            A/B Experiment Tracker
          </p>
          <h3 className="mt-1 text-base font-black text-[color:var(--text)]">
            Save variants, compare results, promote the winner
          </h3>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[color:var(--muted)]">
            Local-only experiment tracking for the current A/B/C hook-caption plan. No Facebook API,
            scraping, posting, or automatic generation.
          </p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${analysisTone[analysis.status]}`}
        >
          {analysis.status.replaceAll("-", " ")}
          {analysis.winnerLabel ? ` · Winner ${analysis.winnerLabel}` : ""}
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-indigo-400/20 bg-indigo-500/10 p-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-indigo-700 dark:text-indigo-200">
          Experiment Hypothesis
        </p>
        <p className="mt-2 text-xs leading-relaxed text-[color:var(--muted)]">
          {plan.hypothesis}
        </p>
        <p className="mt-2 text-xs font-semibold text-[color:var(--text)]">
          {analysis.summary}
        </p>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-3">
        {plan.variants.map((variant) => {
          const fields = form[variant.label] ?? {
            views: "",
            threeSecondViews: "",
            averageWatchTimeSeconds: "",
            durationSeconds: "25",
            likes: "",
            comments: "",
            shares: "",
            saves: "",
            followsGained: "",
            notes: "",
          };
          const score = scoreForLabel(analysis, variant.label);
          const isWinner = analysis.winnerLabel === variant.label;

          return (
            <article
              key={variant.label}
              className={`rounded-xl border p-3 ${
                isWinner
                  ? "border-emerald-400/30 bg-emerald-500/10"
                  : "border-[color:var(--border)] bg-[color:var(--surface-muted)]"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-amber-700 dark:text-amber-200">
                    Variant {variant.label}
                  </span>
                  <p className="mt-3 text-xs font-black text-[color:var(--text)]">
                    {variant.hook}
                  </p>
                </div>
                <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-elevated)] px-2.5 py-1 text-[10px] font-bold text-[color:var(--muted)]">
                  {score?.score ?? 0}/100
                </span>
              </div>

              <p className="mt-2 text-xs leading-relaxed text-[color:var(--muted)]">
                {variant.caption}
              </p>
              <p className="mt-2 break-words text-[11px] font-semibold text-cyan-700 dark:text-cyan-200">
                {variant.hashtags.join(" ")}
              </p>

              <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <VariantMetricInput label="Views" value={fields.views} onChange={updateField(variant.label, "views")} />
                <VariantMetricInput label="3-sec views" value={fields.threeSecondViews} onChange={updateField(variant.label, "threeSecondViews")} />
                <VariantMetricInput label="Avg watch" value={fields.averageWatchTimeSeconds} onChange={updateField(variant.label, "averageWatchTimeSeconds")} />
                <VariantMetricInput label="Duration" value={fields.durationSeconds} onChange={updateField(variant.label, "durationSeconds")} />
                <VariantMetricInput label="Likes" value={fields.likes} onChange={updateField(variant.label, "likes")} />
                <VariantMetricInput label="Comments" value={fields.comments} onChange={updateField(variant.label, "comments")} />
                <VariantMetricInput label="Shares" value={fields.shares} onChange={updateField(variant.label, "shares")} />
                <VariantMetricInput label="Saves" value={fields.saves} onChange={updateField(variant.label, "saves")} />
                <VariantMetricInput label="Follows" value={fields.followsGained} onChange={updateField(variant.label, "followsGained")} />
              </div>

              <label className="mt-3 block space-y-1 text-[11px] font-bold text-[color:var(--muted)]">
                <span>Notes</span>
                <textarea
                  value={fields.notes}
                  onChange={updateField(variant.label, "notes")}
                  rows={2}
                  placeholder="What changed for this variant?"
                  className="w-full resize-y rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-elevated)] px-2.5 py-2 text-xs text-[color:var(--text)] outline-none focus:border-amber-400"
                />
              </label>

              {score && (
                <div className="mt-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-2 text-[11px] leading-relaxed text-[color:var(--muted)]">
                  <p>
                    <span className="font-bold text-[color:var(--text)]">Strength:</span>{" "}
                    {score.strengths[0]}
                  </p>
                  <p className="mt-1">
                    <span className="font-bold text-[color:var(--text)]">Fix:</span>{" "}
                    {score.fixes[0]}
                  </p>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={saveExperiment}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black uppercase tracking-[0.08em] text-white hover:bg-indigo-500 active:scale-95"
        >
          {existingExperiment ? "Update Experiment" : "Save A/B Experiment"}
        </button>
        {existingExperiment && (
          <button
            type="button"
            onClick={deleteExperiment}
            className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.08em] text-red-700 hover:bg-red-500/20 active:scale-95 dark:text-red-200"
          >
            Delete Experiment
          </button>
        )}
        {saveStatus && (
          <span className="text-xs font-semibold text-[color:var(--muted)]">
            {saveStatus}
          </span>
        )}
      </div>

      {winnerVariant && (
        <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-200">
            Promote Winner Guidance
          </p>
          <div className="mt-2 grid gap-3 text-xs leading-relaxed text-[color:var(--muted)] lg:grid-cols-3">
            <p>
              <span className="font-bold text-[color:var(--text)]">Winning hook:</span>{" "}
              {winnerVariant.hook}
            </p>
            <p>
              <span className="font-bold text-[color:var(--text)]">Winning caption:</span>{" "}
              {winnerVariant.caption}
            </p>
            <p>
              <span className="font-bold text-[color:var(--text)]">Hashtags:</span>{" "}
              {winnerVariant.hashtags.join(" ")}
            </p>
          </div>
          <p className="mt-2 text-xs font-semibold text-[color:var(--text)]">
            Next test: keep Variant {winnerVariant.label}&apos;s hook angle, change only one variable
            at a time, and save the next result in the Reels Performance Tracker.
          </p>
        </div>
      )}

      {existingExperiment && (
        <div className="mt-4 grid gap-2 text-[11px] text-[color:var(--muted)] sm:grid-cols-3">
          <span>Status: {existingExperiment.status}</span>
          <span>Updated: {new Date(existingExperiment.updatedAt).toLocaleDateString()}</span>
          <span>
            Winner: {analysis.winnerLabel ? `Variant ${analysis.winnerLabel}` : "Not enough data"}
          </span>
        </div>
      )}
    </section>
  );
}
