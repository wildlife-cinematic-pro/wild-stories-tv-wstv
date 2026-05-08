"use client";

import {
  analyzeFacebookReelsPackage,
  type FacebookReelsScoreResult,
} from "@/lib/facebook-reels-scoring";
import { buildFacebookHookVariants } from "@/lib/facebook-hook-variants";
import { buildFacebookCaptionVariants } from "@/lib/facebook-caption-variants";

import type { GeneratedPackage } from "@/types";

const statusTone: Record<FacebookReelsScoreResult["status"], string> = {
  strong:
    "border-emerald-400/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
  good: "border-cyan-400/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-200",
  "needs-work":
    "border-amber-400/30 bg-amber-500/10 text-amber-700 dark:text-amber-200",
  risky: "border-red-400/30 bg-red-500/10 text-red-700 dark:text-red-200",
};

const dimensionLabels: Record<keyof FacebookReelsScoreResult["dimensions"], string> = {
  firstFrameHook: "First Frame",
  retentionCurve: "Retention",
  replayValue: "Replay",
  usaAudienceFit: "USA Fit",
  storyClarity: "Clarity",
  originalitySignal: "Originality",
  safetyMonetizationFit: "Safety",
  captionSearchFit: "Caption",
  platformFormatFit: "Format",
};

function copyCaptionText(caption: string, hashtags: string[]) {
  return `${caption}\n\n${hashtags.join(" ")}`;
}

export default function FacebookReelsOptimizerCard({
  data,
  onCopy,
}: {
  data: GeneratedPackage;
  onCopy: (text: string) => void | Promise<unknown>;
}) {
  const result = analyzeFacebookReelsPackage(data);
  const hooks = buildFacebookHookVariants(data);
  const captions = buildFacebookCaptionVariants(data);

  return (
    <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
            Facebook Reels Optimizer
          </p>
          <h3 className="mt-1 text-base font-black text-[color:var(--text)]">
            {result.totalScore}/100
          </h3>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[color:var(--muted)]">
            Optimizes for original, motion-first, non-graphic USA wildlife
            Reels.
          </p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${statusTone[result.status]}`}
        >
          {result.status.replace("-", " ")}
        </span>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-3">
        {Object.entries(result.dimensions).map(([key, value]) => (
          <div
            key={key}
            className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-2"
          >
            <div className="flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[color:var(--muted)]">
              <span>{dimensionLabels[key as keyof typeof dimensionLabels]}</span>
              <span>{value}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
              <div
                className={`h-full rounded-full ${
                  value >= 85
                    ? "bg-emerald-500"
                    : value >= 70
                      ? "bg-cyan-500"
                      : value >= 50
                        ? "bg-amber-500"
                        : "bg-red-500"
                }`}
                style={{ width: `${Math.max(4, Math.min(100, value))}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-200">
            What Works
          </p>
          <ul className="mt-2 space-y-1 text-xs leading-relaxed text-[color:var(--muted)]">
            {result.passes.slice(0, 3).map((pass) => (
              <li key={pass}>• {pass}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-700 dark:text-amber-200">
            Fixes
          </p>
          {result.warnings.length > 0 || result.fixes.length > 0 ? (
            <ul className="mt-2 space-y-1 text-xs leading-relaxed text-[color:var(--muted)]">
              {[...result.warnings.slice(0, 2), ...result.fixes.slice(0, 2)].map(
                (item) => (
                  <li key={item}>• {item}</li>
                )
              )}
            </ul>
          ) : (
            <p className="mt-2 text-xs leading-relaxed text-[color:var(--muted)]">
              No platform warnings detected.
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <div className="rounded-xl border border-sky-400/20 bg-sky-500/10 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-sky-700 dark:text-sky-200">
              Ranked Hooks
            </p>
            <span className="text-[10px] font-semibold text-[color:var(--muted)]">
              90 chars max
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {hooks.map((variant) => (
              <div
                key={`${variant.rank}-${variant.hook}`}
                className="rounded-lg border border-sky-400/20 bg-[color:var(--surface-elevated)] p-2"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-[color:var(--text)]">
                      {variant.rank}. {variant.hook}
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.08em] text-[color:var(--muted)]">
                      {variant.style} · {variant.score}/100
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onCopy(variant.hook)}
                    className="rounded-lg bg-sky-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-sky-500 active:scale-95"
                  >
                    Copy Hook
                  </button>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-[color:var(--muted)]">
                  {variant.reason}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-indigo-400/20 bg-indigo-500/10 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-indigo-700 dark:text-indigo-200">
              Ranked Captions
            </p>
            <span className="text-[10px] font-semibold text-[color:var(--muted)]">
              5 hashtags each
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {captions.map((variant) => (
              <div
                key={`${variant.rank}-${variant.caption}`}
                className="rounded-lg border border-indigo-400/20 bg-[color:var(--surface-elevated)] p-2"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-xs font-bold text-[color:var(--text)]">
                      {variant.rank}. {variant.caption}
                    </p>
                    <p className="mt-1 break-words text-[11px] leading-relaxed text-indigo-700 dark:text-indigo-200">
                      {variant.hashtags.join(" ")}
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.08em] text-[color:var(--muted)]">
                      {variant.score}/100 · {variant.reason}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onCopy(copyCaptionText(variant.caption, variant.hashtags))
                    }
                    className="rounded-lg bg-indigo-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-indigo-500 active:scale-95"
                  >
                    Copy Caption
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
