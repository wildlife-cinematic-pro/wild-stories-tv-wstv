"use client";

import { getContentLaneWinnerLabels } from "@/lib/content-lanes";
import { formatPipelineStyleLabel } from "@/lib/page-build-helpers";

import type {
  ConceptVariant,
  ConceptVariantLabWinners,
  ConceptVariantWinnerTag,
  ContentLane,
} from "@/types";

type ConceptVariantLabProps = {
  contentLane: ContentLane;
  variants: ConceptVariant[];
  winners: ConceptVariantLabWinners;
  activeVariantId: string | null;
  onPromoteVariant: (variant: ConceptVariant) => void;
  onAutoCleanupVariant: (variant: ConceptVariant) => void;
};

function getWinnerVariant(variants: ConceptVariant[], id?: string): ConceptVariant | null {
  return variants.find((variant) => variant.id === id) ?? null;
}

export default function ConceptVariantLab({
  contentLane,
  variants,
  winners,
  activeVariantId,
  onPromoteVariant,
  onAutoCleanupVariant,
}: ConceptVariantLabProps) {
  if (variants.length === 0) return null;

  const winnerLabels = getContentLaneWinnerLabels(contentLane);
  const tagLabels: Record<ConceptVariantWinnerTag, string> = {
    "best-overall": winnerLabels.overall,
    "best-fast-publish": winnerLabels.fastPublish,
    "strongest-opening": winnerLabels.spotlight,
    "best-strongest-opening": winnerLabels.spotlight,
    "best-realism": winnerLabels.realism,
  };

  const winnerCards = [
    {
      label: winnerLabels.overall,
      variant: getWinnerVariant(variants, winners.bestOverallId),
      score: (variant: ConceptVariant) => variant.overallScore,
    },
    {
      label: winnerLabels.fastPublish,
      variant: getWinnerVariant(variants, winners.bestFastPublishId),
      score: (variant: ConceptVariant) => variant.overallScore,
    },
    {
      label: winnerLabels.spotlight,
      variant: getWinnerVariant(variants, winners.bestStrongestOpeningId),
      score: (variant: ConceptVariant) => variant.openingFrameScore.total,
    },
    {
      label: winnerLabels.realism,
      variant: getWinnerVariant(variants, winners.bestRealismId),
      score: (variant: ConceptVariant) => variant.realismFitScore,
    },
  ];

  return (
    <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.05] p-3.5 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40">
            Concept Variant Lab
          </div>
          <div className="mt-1 text-sm font-semibold text-white">
            Score multiple pre-build directions before generating the final package
          </div>
          <div className="mt-1 text-[11px] leading-relaxed text-white/45">
            {winnerLabels.summary} Promote the winner you want to send into the main generate
            flow.
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/55">
            {variants.length} ranked variants
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/70">
            {contentLane}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {winnerCards.map(({ label, variant, score }) => (
          <div
            key={label}
            className="rounded-2xl border border-white/10 bg-black/15 p-3"
          >
            <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/35">
              {label}
            </div>
            {variant ? (
              <>
                <div className="mt-2 text-sm font-semibold text-white">
                  {variant.label}
                </div>
                <div className="mt-1 text-[11px] text-white/45">{variant.summary}</div>
                <div className="mt-2 text-xs font-semibold text-white/80">
                  {score(variant)}/100
                </div>
              </>
            ) : (
              <div className="mt-2 text-xs text-white/35">No winner yet</div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        {variants.map((variant) => {
          const isActive = activeVariantId === variant.id;
          const showCleanupAction =
            !variant.publishGuardReport.isPass && !variant.publishCleanup?.applied;

          return (
            <div
              key={variant.id}
              className={`rounded-2xl border p-4 transition-all ${
                isActive
                  ? "border-white/20 bg-white/[0.09] shadow-[0_10px_24px_rgba(15,23,42,0.18)]"
                  : "border-white/10 bg-black/15"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-semibold text-white">{variant.label}</div>
                    {variant.winnerTags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/10 bg-white/[0.08] px-2 py-1 text-[10px] font-semibold text-white/70"
                      >
                        {tagLabels[tag]}
                      </span>
                    ))}
                    {variant.publishCleanup?.applied && (
                      <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-[10px] font-semibold text-emerald-100">
                        Cleanup applied
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-[11px] leading-relaxed text-white/45">
                    {variant.summary}
                  </div>
                </div>
                <div className="rounded-full bg-white/[0.08] px-2.5 py-1 text-[10px] font-semibold text-white/75">
                  Overall {variant.overallScore}/100
                </div>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-white/8 bg-white/[0.04] px-3 py-2">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/35">
                    Direction
                  </div>
                  <div className="mt-1 text-xs text-white/80">
                    {variant.arc} • {variant.hookFamily} • {variant.emphasis}
                  </div>
                  <div className="mt-1 text-[11px] text-white/45">
                    {variant.fastPublishMode ? "Fast publish on" : "Cinematic emphasis"} •{" "}
                    {formatPipelineStyleLabel(variant.pipelineStyle)}
                  </div>
                </div>
                <div className="rounded-xl border border-white/8 bg-white/[0.04] px-3 py-2">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/35">
                    Habitat
                  </div>
                  <div className="mt-1 text-xs text-white/80">{variant.habitat}</div>
                  <div className="mt-1 text-[11px] leading-relaxed text-white/45">
                    {variant.finalEnvironment}
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-white/8 bg-white/[0.04] px-3 py-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/35">
                  Hook preview
                </div>
                <div className="mt-1 text-sm font-medium text-white/90">{variant.primaryHook}</div>
                <div className="mt-1 text-[11px] text-white/45">{variant.sceneDescription}</div>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <div className="rounded-xl border border-white/8 bg-white/[0.04] px-3 py-2">
                  <div className="text-[10px] uppercase tracking-[0.08em] text-white/35">U.S.</div>
                  <div className="mt-1 text-sm font-semibold text-white/85">
                    {variant.usAudienceScore.total}/100
                  </div>
                </div>
                <div className="rounded-xl border border-white/8 bg-white/[0.04] px-3 py-2">
                  <div className="text-[10px] uppercase tracking-[0.08em] text-white/35">Opening</div>
                  <div className="mt-1 text-sm font-semibold text-white/85">
                    {variant.openingFrameScore.total}/100
                  </div>
                </div>
                <div className="rounded-xl border border-white/8 bg-white/[0.04] px-3 py-2">
                  <div className="text-[10px] uppercase tracking-[0.08em] text-white/35">Realism</div>
                  <div className="mt-1 text-sm font-semibold text-white/85">
                    {variant.realismFitScore}/100
                  </div>
                </div>
              </div>

              <div className="mt-2 grid gap-2 sm:grid-cols-4">
                <div className="rounded-xl border border-white/8 bg-white/[0.04] px-3 py-2">
                  <div className="text-[10px] uppercase tracking-[0.08em] text-white/35">Lane fit</div>
                  <div className="mt-1 text-sm font-semibold text-white/85">
                    {variant.laneFitScore}/100
                  </div>
                </div>
                <div className="rounded-xl border border-white/8 bg-white/[0.04] px-3 py-2">
                  <div className="text-[10px] uppercase tracking-[0.08em] text-white/35">Fit</div>
                  <div className="mt-1 text-sm font-semibold text-white/85">
                    {variant.fitScore}/100
                  </div>
                </div>
                <div className="rounded-xl border border-white/8 bg-white/[0.04] px-3 py-2">
                  <div className="text-[10px] uppercase tracking-[0.08em] text-white/35">Publish guard</div>
                  <div className="mt-1 text-sm font-semibold text-white/85">
                    {variant.publishGuardReport.isPass ? "Pass" : "Needs cleanup"}
                  </div>
                </div>
                <div className="rounded-xl border border-white/8 bg-white/[0.04] px-3 py-2">
                  <div className="text-[10px] uppercase tracking-[0.08em] text-white/35">Status</div>
                  <div className="mt-1 text-sm font-semibold text-white/85">
                    {variant.publishWorthy ? "Ready to test" : "Review first"}
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-white/8 bg-white/[0.04] px-3 py-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/35">
                  Publish cleanup
                </div>
                <div className="mt-1 text-[11px] leading-relaxed text-white/65">
                  {variant.publishCleanup?.summary ??
                    variant.publishGuardReport.warnings[0] ??
                    "Packaging already reads clean, documentary, and publish-safe."}
                </div>
                {variant.publishCleanup?.notes?.length ? (
                  <ul className="mt-2 space-y-1 text-[11px] text-white/45">
                    {variant.publishCleanup.notes.map((note) => (
                      <li key={note}>• {note}</li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="max-w-2xl text-[11px] text-white/45">
                  {variant.caption}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {showCleanupAction && (
                    <button
                      type="button"
                      onClick={() => onAutoCleanupVariant(variant)}
                      className="rounded-xl border border-white/12 bg-white/[0.06] px-4 py-2 text-xs font-semibold text-white/85 transition-all hover:bg-white/[0.1] active:scale-[0.98]"
                    >
                      Auto cleanup copy
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onPromoteVariant(variant)}
                    disabled={isActive}
                    className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all active:scale-[0.98] ${
                      isActive
                        ? "cursor-default border border-white/10 bg-white/[0.06] text-white/45"
                        : "bg-white text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    {isActive ? "Live in Main Flow" : "Promote to Main Flow"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
