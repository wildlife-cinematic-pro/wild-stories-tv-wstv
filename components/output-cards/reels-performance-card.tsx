"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";

import { buildFacebookCaptionVariants } from "@/lib/facebook-caption-variants";
import { buildFacebookHookVariants } from "@/lib/facebook-hook-variants";
import {
  deleteReelPerformanceRecord,
  findReelPerformanceByGenerationId,
  upsertReelPerformanceRecord,
} from "@/lib/reels-performance-storage";
import { analyzeReelPerformance } from "@/lib/reels-performance-scoring";

import type { GeneratedPackage, ReelPerformanceRecord } from "@/types";

type FormState = {
  views: string;
  threeSecondViews: string;
  averageWatchTimeSeconds: string;
  durationSeconds: string;
  likes: string;
  comments: string;
  shares: string;
  saves: string;
  followsGained: string;
  postedAt: string;
  hookUsed: string;
  captionUsed: string;
  notes: string;
};

const statusTone: Record<ReturnType<typeof analyzeReelPerformance>["status"], string> = {
  winner: "border-emerald-400/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
  solid: "border-cyan-400/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-200",
  "needs-work": "border-amber-400/30 bg-amber-500/10 text-amber-700 dark:text-amber-200",
  weak: "border-red-400/30 bg-red-500/10 text-red-700 dark:text-red-200",
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

function toNumber(value: string, fallback = 0): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : fallback;
}

function toOptionalNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : undefined;
}

function buildFormState(
  data: GeneratedPackage,
  existing: ReelPerformanceRecord | null
): FormState {
  return {
    views: numberText(existing?.views),
    threeSecondViews: numberText(existing?.threeSecondViews),
    averageWatchTimeSeconds: numberText(existing?.averageWatchTimeSeconds),
    durationSeconds: numberText(existing?.durationSeconds ?? 25),
    likes: numberText(existing?.likes),
    comments: numberText(existing?.comments),
    shares: numberText(existing?.shares),
    saves: numberText(existing?.saves),
    followsGained: numberText(existing?.followsGained),
    postedAt: existing?.postedAt ?? "",
    hookUsed: existing?.hookUsed ?? data.hook ?? "",
    captionUsed: existing?.captionUsed ?? data.caption ?? "",
    notes: existing?.notes ?? "",
  };
}

function recordLabel(record: ReelPerformanceRecord): string {
  return [record.subjectA, record.subjectB].filter(Boolean).join(" vs ") || record.generationId;
}

export default function ReelsPerformanceCard({ data }: { data: GeneratedPackage }) {
  const generationId = useMemo(() => getGenerationId(data), [data]);
  const hookVariants = useMemo(() => buildFacebookHookVariants(data), [data]);
  const captionVariants = useMemo(() => buildFacebookCaptionVariants(data), [data]);
  const [existingRecord, setExistingRecord] = useState<ReelPerformanceRecord | null>(null);
  const [form, setForm] = useState<FormState>(() => buildFormState(data, null));
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    const existing = findReelPerformanceByGenerationId(generationId);
    setExistingRecord(existing);
    setForm(buildFormState(data, existing));
    setSaveStatus("");
  }, [data, generationId]);

  const selectedCaption = captionVariants.find(
    (variant) => variant.caption === form.captionUsed
  );
  const insight = existingRecord ? analyzeReelPerformance(existingRecord) : null;

  function updateField(field: keyof FormState) {
    return (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
    };
  }

  function saveRecord() {
    const now = new Date().toISOString();
    const record = upsertReelPerformanceRecord({
      id: existingRecord?.id ?? `reel_${Date.now().toString(36)}`,
      generationId,
      createdAt: existingRecord?.createdAt ?? now,
      updatedAt: now,
      postedAt: form.postedAt || undefined,
      storyMode: data.storyMode,
      viralLane: data.viralLane,
      habitatRegion: data.habitatRegion,
      subjectA: data.subjectA ?? data.predatorName,
      subjectB: data.subjectB ?? data.preyName,
      hookUsed: form.hookUsed || undefined,
      captionUsed: form.captionUsed || undefined,
      hashtagsUsed: selectedCaption?.hashtags,
      views: toNumber(form.views),
      threeSecondViews: toOptionalNumber(form.threeSecondViews),
      averageWatchTimeSeconds: toOptionalNumber(form.averageWatchTimeSeconds),
      durationSeconds: toOptionalNumber(form.durationSeconds),
      likes: toNumber(form.likes),
      comments: toNumber(form.comments),
      shares: toNumber(form.shares),
      saves: toNumber(form.saves),
      followsGained: toOptionalNumber(form.followsGained),
      notes: form.notes || undefined,
    });

    setExistingRecord(record);
    setSaveStatus(record ? "Saved locally" : "Could not save record");
  }

  function deleteRecord() {
    if (!existingRecord) return;
    deleteReelPerformanceRecord(existingRecord.id);
    setExistingRecord(null);
    setForm(buildFormState(data, null));
    setSaveStatus("Deleted local record");
  }

  return (
    <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
            Reels Performance Tracker
          </p>
          <h3 className="mt-1 text-base font-black text-[color:var(--text)]">
            Manual Facebook learning loop
          </h3>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[color:var(--muted)]">
            Save local-only performance results after posting. No Facebook API,
            scraping, or automatic posting.
          </p>
        </div>
        {insight && (
          <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${statusTone[insight.status]}`}>
            {insight.status.replace("-", " ")} · {insight.score}/100
          </span>
        )}
      </div>

      {existingRecord && insight && (
        <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-bold text-[color:var(--text)]">
              Saved: {recordLabel(existingRecord)}
            </p>
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--muted)]">
              Updated {new Date(existingRecord.updatedAt).toLocaleDateString()}
            </span>
          </div>
          <div className="mt-2 grid gap-2 text-xs text-[color:var(--muted)] sm:grid-cols-4">
            <span>Views: {existingRecord.views.toLocaleString()}</span>
            <span>Engagement: {Math.round((insight.engagementRate ?? 0) * 1000) / 10}%</span>
            <span>Retention: {Math.round((insight.retentionRate ?? 0) * 1000) / 10}%</span>
            <span>Shares: {existingRecord.shares.toLocaleString()}</span>
          </div>
        </div>
      )}

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricInput label="Views" value={form.views} onChange={updateField("views")} />
        <MetricInput label="3-sec views" value={form.threeSecondViews} onChange={updateField("threeSecondViews")} />
        <MetricInput label="Avg watch time" value={form.averageWatchTimeSeconds} onChange={updateField("averageWatchTimeSeconds")} />
        <MetricInput label="Duration" value={form.durationSeconds} onChange={updateField("durationSeconds")} />
        <MetricInput label="Likes" value={form.likes} onChange={updateField("likes")} />
        <MetricInput label="Comments" value={form.comments} onChange={updateField("comments")} />
        <MetricInput label="Shares" value={form.shares} onChange={updateField("shares")} />
        <MetricInput label="Saves" value={form.saves} onChange={updateField("saves")} />
        <MetricInput label="Follows" value={form.followsGained} onChange={updateField("followsGained")} />
        <label className="space-y-1 text-xs font-bold text-[color:var(--muted)]">
          <span>Posted date</span>
          <input
            type="date"
            value={form.postedAt}
            onChange={updateField("postedAt")}
            className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-sm text-[color:var(--text)] outline-none focus:border-cyan-400"
          />
        </label>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <label className="space-y-1 text-xs font-bold text-[color:var(--muted)]">
          <span>Hook used</span>
          <select
            value={form.hookUsed}
            onChange={updateField("hookUsed")}
            className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-sm text-[color:var(--text)] outline-none focus:border-sky-400"
          >
            <option value={data.hook}>{data.hook || "Current package hook"}</option>
            {hookVariants.map((variant) => (
              <option key={variant.hook} value={variant.hook}>
                {variant.rank}. {variant.hook}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-xs font-bold text-[color:var(--muted)]">
          <span>Caption used</span>
          <select
            value={form.captionUsed}
            onChange={updateField("captionUsed")}
            className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-sm text-[color:var(--text)] outline-none focus:border-indigo-400"
          >
            <option value={data.caption}>{data.caption || "Current package caption"}</option>
            {captionVariants.map((variant) => (
              <option key={variant.caption} value={variant.caption}>
                {variant.rank}. {variant.caption}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-4 block space-y-1 text-xs font-bold text-[color:var(--muted)]">
        <span>Notes</span>
        <textarea
          value={form.notes}
          onChange={updateField("notes")}
          rows={3}
          placeholder="What did viewers respond to? What should the next reel test?"
          className="w-full resize-y rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-sm text-[color:var(--text)] outline-none focus:border-amber-400"
        />
      </label>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={saveRecord}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black uppercase tracking-[0.08em] text-white hover:bg-emerald-500 active:scale-95"
        >
          {existingRecord ? "Update Performance" : "Save Performance"}
        </button>
        {existingRecord && (
          <button
            type="button"
            onClick={deleteRecord}
            className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.08em] text-red-700 hover:bg-red-500/20 active:scale-95 dark:text-red-200"
          >
            Delete Record
          </button>
        )}
        {saveStatus && (
          <span className="text-xs font-semibold text-[color:var(--muted)]">
            {saveStatus}
          </span>
        )}
      </div>
    </section>
  );
}

function MetricInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="space-y-1 text-xs font-bold text-[color:var(--muted)]">
      <span>{label}</span>
      <input
        type="number"
        min="0"
        step="any"
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-sm text-[color:var(--text)] outline-none focus:border-emerald-400"
      />
    </label>
  );
}
