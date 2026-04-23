"use client";

import { useMemo } from "react";

import type { GeneratedPackage } from "@/types";

import {
  buildFacebookPublishReadinessReport,
  type FacebookPublishReadinessScores,
} from "@/lib/facebook-publish-readiness";
import { getRealGenerationEvidenceGenerationId } from "@/lib/real-generation-evidence";
import { readRealGenerationEvidenceForGeneration } from "@/lib/storage";

const SCORE_META: Array<{
  key: keyof FacebookPublishReadinessScores;
  label: string;
  detail: string;
  accent: string;
}> = [
  {
    key: "originalityConfidence",
    label: "Originality confidence",
    detail: "How safely original the hook, caption, and CTA feel for Facebook wildlife packaging.",
    accent: "border-emerald-200 bg-emerald-50 text-emerald-900",
  },
  {
    key: "firstFrameHookReadability",
    label: "First-frame hook readability",
    detail: "How quickly the opening hook should read in the first seconds of the reel.",
    accent: "border-violet-200 bg-violet-50 text-violet-900",
  },
  {
    key: "hookOverlayClarity",
    label: "Hook overlay clarity",
    detail: "How usable the Facebook overlay recommendation looks for a real first-frame test.",
    accent: "border-sky-200 bg-sky-50 text-sky-900",
  },
  {
    key: "captionUsefulness",
    label: "Caption usefulness",
    detail: "Whether the caption helps the publish and stays clear of spammy filler.",
    accent: "border-amber-200 bg-amber-50 text-amber-900",
  },
  {
    key: "hashtagHygiene",
    label: "Hashtag hygiene",
    detail: "Count, uniqueness, and clean formatting for the Facebook-ready tag set.",
    accent: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-900",
  },
  {
    key: "packagingQuality",
    label: "Visible packaging quality",
    detail: "How strong the total packaging looks once cover-frame, overlay, and guard status are combined.",
    accent: "border-cyan-200 bg-cyan-50 text-cyan-900",
  },
];

function formatScore(score: number): string {
  return `${Math.max(0, Math.min(100, Math.round(score)))}/100`;
}

function getVerdictAccent(verdict: string): string {
  switch (verdict) {
    case "ready-to-publish":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    case "review-packaging-before-publish":
      return "border-amber-200 bg-amber-50 text-amber-900";
    default:
      return "border-rose-200 bg-rose-50 text-rose-900";
  }
}

export function FacebookPublishReadinessPanel({ data }: { data: GeneratedPackage }) {
  const generationId = useMemo(
    () => getRealGenerationEvidenceGenerationId(data),
    [data]
  );
  const evidenceRecord = useMemo(
    () => readRealGenerationEvidenceForGeneration(generationId),
    [generationId]
  );
  const report = useMemo(
    () => buildFacebookPublishReadinessReport(data, evidenceRecord),
    [data, evidenceRecord]
  );

  return (
    <div
      className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
      data-testid="facebook-publish-readiness-panel"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <div className="text-sm font-extrabold text-gray-900">
            Facebook Publish Readiness
          </div>
          <p className="mt-1 text-xs leading-relaxed text-gray-600">
            Final pre-post check for Facebook wildlife reels. This blends the current package,
            publish guard, and latest real-generation evidence so you can decide whether to post,
            revise the packaging, or retry before publishing.
          </p>
        </div>
        <div
          className={`rounded-2xl border px-4 py-3 text-right ${getVerdictAccent(
            report.verdict
          )}`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wide opacity-80">
            Current verdict
          </div>
          <div className="mt-1 text-lg font-black">{report.verdictLabel}</div>
          <div className="mt-1 text-xs font-semibold">{formatScore(report.overallScore)}</div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm leading-relaxed text-gray-700">
        {report.summary}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {SCORE_META.map((item) => (
          <div key={item.key} className={`rounded-2xl border p-3 ${item.accent}`}>
            <div className="text-[11px] font-bold uppercase tracking-wide opacity-80">
              {item.label}
            </div>
            <div className="mt-2 text-2xl font-black">
              {formatScore(report.scores[item.key])}
            </div>
            <p className="mt-1 text-xs leading-relaxed opacity-85">{item.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="text-sm font-extrabold text-gray-900">Why this is the current call</div>
          <div className="mt-3 space-y-2">
            {report.reasons.map((reason, index) => (
              <div
                key={`${reason}-${index}`}
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs leading-relaxed text-gray-700"
              >
                {reason}
              </div>
            ))}
          </div>

          {report.publishGuardWarnings.length > 0 && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <div className="text-xs font-bold uppercase tracking-wide text-amber-700">
                Current publish guard warnings
              </div>
              <div className="mt-2 space-y-2">
                {report.publishGuardWarnings.map((warning, index) => (
                  <div
                    key={`${warning}-${index}`}
                    className="rounded-lg border border-white/80 bg-white px-3 py-2 text-xs leading-relaxed text-amber-900"
                  >
                    {warning}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="text-sm font-extrabold text-gray-900">Evidence connection</div>
            {report.evidenceContext ? (
              <div className="mt-3 rounded-xl border border-cyan-200 bg-cyan-50 p-3 text-xs leading-relaxed text-cyan-900">
                <div className="font-bold">Latest evidence call</div>
                <div className="mt-1">
                  {report.evidenceContext.recommendationLabel} • {formatScore(report.evidenceContext.overallScore)}
                </div>
                <p className="mt-2 text-cyan-800">{report.evidenceContext.note}</p>
              </div>
            ) : (
              <div className="mt-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-3 text-xs leading-relaxed text-gray-600">
                No saved evidence pass yet for this generation. Once you test real outputs,
                save one evidence review and it will show up here.
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="text-sm font-extrabold text-gray-900">Before you post</div>
            <div className="mt-3 space-y-2">
              {report.reminders.map((reminder, index) => (
                <div
                  key={`${reminder}-${index}`}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs leading-relaxed text-gray-700"
                >
                  {reminder}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
