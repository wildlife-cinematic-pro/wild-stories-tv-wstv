"use client";

import ConceptVariantLab from "@/components/build/concept-variant-lab";
import GenerationOutputBoundary from "@/components/build/generation-output-boundary";
import SectionLockControls from "@/components/build/section-lock-controls";
import OutputCards from "@/components/OutputCards";

import type { PublishFlowSummary } from "@/lib/build-package";
import { analyzeOutputReadiness } from "@/lib/output-readiness";
import { formatPipelineStyleLabel } from "@/lib/page-build-helpers";
import { buildWorkflowQaSummary } from "@/lib/workflow-qa";
import type {
  AIProvider,
  ConceptVariant,
  ConceptVariantLabWinners,
  ContentLane,
  GeneratedPackage,
  PackageLockKey,
  PackageLockState,
  PromptVersion,
} from "@/types";

type Step3GenerateProps = {
  predator: string;
  prey: string;
  contentLane: ContentLane;
  activeProvider: AIProvider;
  arc: string;
  habitat: string;
  weather: string;
  depthMode: string;
  cameraAnglePreset: string;
  emotionalTone: string;
  animalVibe: string;
  finalEnvironment: string;
  sceneDescription: string;
  onActiveProviderChange: (provider: AIProvider) => void;
  onGenerate: () => void;
  onRegenerateUnlocked: () => void;
  isGenerating: boolean;
  isRegeneratingUnlocked: boolean;
  error: string;
  pkg: GeneratedPackage | null;
  packageLocks: PackageLockState;
  onTogglePackageLock: (key: PackageLockKey) => void;
  onSetPackageLocks: (locks: PackageLockState) => void;
  publishFlowSummary: PublishFlowSummary | null;
  conceptVariants: ConceptVariant[];
  conceptVariantWinners: ConceptVariantLabWinners;
  activeConceptVariantId: string | null;
  onPromoteConceptVariant: (variant: ConceptVariant) => void;
  onAutoCleanupConceptVariant: (variant: ConceptVariant) => void;
  onRestoreVersion: (version: PromptVersion) => void;
  lastGeneratedRestoreNotice?: string | null;
  onDismissLastGeneratedRestoreNotice?: () => void;
  onBack: () => void;
};

export default function Step3Generate({
  predator,
  prey,
  contentLane,
  activeProvider,
  arc,
  habitat,
  weather,
  depthMode,
  cameraAnglePreset,
  emotionalTone,
  animalVibe,
  finalEnvironment,
  sceneDescription,
  onActiveProviderChange,
  onGenerate,
  onRegenerateUnlocked,
  isGenerating,
  isRegeneratingUnlocked,
  error,
  pkg,
  packageLocks,
  onTogglePackageLock,
  onSetPackageLocks,
  publishFlowSummary,
  conceptVariants,
  conceptVariantWinners,
  activeConceptVariantId,
  onPromoteConceptVariant,
  onAutoCleanupConceptVariant,
  onRestoreVersion,
  lastGeneratedRestoreNotice,
  onDismissLastGeneratedRestoreNotice,
  onBack,
}: Step3GenerateProps) {
  const outputReadiness = pkg
    ? analyzeOutputReadiness({
        predatorName: pkg.predatorName ?? predator,
        preyName: pkg.preyName ?? prey,
        imagePrompt: pkg.imagePrompt,
        runwayShots: pkg.runwayShots,
        klingShots: pkg.klingShots,
        seedanceShots: pkg.seedanceShots,
        caption: pkg.caption,
        hashtags: pkg.hashtags,
        negativePrompt: pkg.negativePrompt,
        routingNote: pkg.routingNote,
      })
    : null;
  const mainEnginePath = publishFlowSummary?.pipelineStyle
    ? formatPipelineStyleLabel(publishFlowSummary.pipelineStyle)
    : "Hybrid / selected workflow";
  const durationLaneLabel = publishFlowSummary?.durationLane
    ? publishFlowSummary.durationLane.toUpperCase()
    : pkg?.durationLane
      ? pkg.durationLane.toUpperCase()
      : "Selected lane";
  const workflowQa = buildWorkflowQaSummary({
    predator,
    prey,
    arc,
    contentLane,
    habitat,
    weather,
    depthMode,
    cameraAnglePreset,
    emotionalTone,
    animalVibe,
    finalEnvironment,
    sceneDescription,
    pkg,
  });
  const workflowQaColor =
    workflowQa.status === "Ready"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : workflowQa.status === "Needs review"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-rose-200 bg-rose-50 text-rose-900";

  return (
    <div className="space-y-6">
      <section className="rounded-[24px] bg-gray-900 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.18)] sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40">
            Generate for Reels
          </h3>
          <div className="rounded-full border border-white/[0.08] bg-white/[0.05] px-2.5 py-1 text-[10px] font-semibold text-white/50">
            {predator} vs {prey}
          </div>
        </div>

        <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.06] p-3.5">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-white/40">
            AI Copy &amp; Prompt Polish
          </div>
          <div className="mb-3 text-[11px] text-white/30">
            Optional polish only. Main cinematic 4-shot packs now come from the
            hybrid dispatcher, with Seedance, full Runway, and full Kling bundles
            still included as optional outputs.
          </div>
          <div className="flex flex-wrap gap-2">
            {(["none", "gemini", "claude"] as AIProvider[]).map((provider) => (
              <button
                key={provider}
                type="button"
                onClick={() => onActiveProviderChange(provider)}
                className={`rounded-2xl border px-4 py-2 text-xs font-semibold transition-all active:scale-95 ${
                  activeProvider === provider
                    ? "border-white/25 bg-white/10 text-white shadow-sm shadow-black/20"
                    : "border-white/[0.12] text-white/35 hover:bg-white/[0.06] hover:text-white/60"
                }`}
              >
                {provider === "none"
                  ? "Off (Local)"
                  : provider === "gemini"
                    ? "✦ Gemini"
                    : "✦ Claude"}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-3 text-[11px] text-white/55">
          Flow: 1. Inputs → 2. U.S. score → 3. Opening score → 4. Publish guard →
          5. Final output
        </div>

        <ConceptVariantLab
          contentLane={contentLane}
          variants={conceptVariants}
          winners={conceptVariantWinners}
          activeVariantId={activeConceptVariantId}
          onPromoteVariant={onPromoteConceptVariant}
          onAutoCleanupVariant={onAutoCleanupConceptVariant}
        />

        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating || isRegeneratingUnlocked}
          className="w-full rounded-2xl bg-white py-4 text-sm font-bold text-gray-900 shadow-sm shadow-black/20 transition-all hover:bg-gray-100 disabled:opacity-50 active:scale-[0.98]"
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-900/20 border-t-gray-900" />
              Generating...
            </span>
          ) : (
            `⚡ Generate — ${predator} vs ${prey}`
          )}
        </button>

        {pkg && (
          <SectionLockControls
            locks={packageLocks}
            isRegenerating={isRegeneratingUnlocked}
            onToggleLock={onTogglePackageLock}
            onSetLocks={onSetPackageLocks}
            onRegenerateUnlocked={onRegenerateUnlocked}
          />
        )}
      </section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-700">⚠️ {error}</p>
        </div>
      )}

      {pkg && (
        <GenerationOutputBoundary
          resetKey={`${pkg.hook ?? ""}|${pkg.caption ?? ""}|${pkg.routingNote ?? ""}`}
        >
          <section>
          {lastGeneratedRestoreNotice && (
            <div
              className="mb-4 flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 shadow-sm shadow-sky-100/60"
              data-testid="last-generated-restore-notice"
            >
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-600">
                  Restored Output
                </div>
                <div className="mt-1 font-semibold">
                  {lastGeneratedRestoreNotice}
                </div>
              </div>
              {onDismissLastGeneratedRestoreNotice && (
                <button
                  type="button"
                  onClick={onDismissLastGeneratedRestoreNotice}
                  className="rounded-xl border border-sky-200 bg-white px-3 py-1.5 text-xs font-semibold text-sky-700 shadow-sm shadow-sky-100/70 hover:bg-sky-100 active:scale-[0.98]"
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
          {publishFlowSummary && (
            <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm shadow-gray-200/60">
                <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400">
                  1. User Inputs
                </div>
                <div className="mt-2 text-sm font-semibold text-gray-900">
                  {publishFlowSummary.predatorName} vs {publishFlowSummary.preyName}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {publishFlowSummary.arcName} • {publishFlowSummary.marketMode}
                </div>
              </div>
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm shadow-blue-100/60">
                <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-blue-500">
                  2. U.S. Score
                </div>
                <div className="mt-2 text-sm font-semibold text-blue-900">
                  {publishFlowSummary.usAudienceScore.total}/100
                </div>
                <div className="mt-1 text-xs text-blue-700">
                  {publishFlowSummary.usAudienceScore.summary}
                </div>
              </div>
              <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 shadow-sm shadow-violet-100/60">
                <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-violet-500">
                  3. Opening Score
                </div>
                <div className="mt-2 text-sm font-semibold text-violet-900">
                  {publishFlowSummary.openingFrameScore.total}/100
                </div>
                <div className="mt-1 text-xs text-violet-700">
                  {publishFlowSummary.openingFrameScore.summary}
                </div>
              </div>
              <div
                className={`rounded-2xl border p-4 shadow-sm ${
                  publishFlowSummary.publishGuardReport.isPass
                    ? "border-emerald-200 bg-emerald-50 shadow-emerald-100/60"
                    : "border-amber-200 bg-amber-50 shadow-amber-100/60"
                }`}
              >
                <div
                  className={`text-[10px] font-semibold uppercase tracking-[0.1em] ${
                    publishFlowSummary.publishGuardReport.isPass
                      ? "text-emerald-500"
                      : "text-amber-500"
                  }`}
                >
                  4. Publish Guard
                </div>
                <div
                  className={`mt-2 text-sm font-semibold ${
                    publishFlowSummary.publishGuardReport.isPass
                      ? "text-emerald-900"
                      : "text-amber-900"
                  }`}
                >
                  {publishFlowSummary.publishGuardReport.isPass
                    ? "Pass"
                    : "Needs cleanup"}
                </div>
                <div
                  className={`mt-1 text-xs ${
                    publishFlowSummary.publishGuardReport.isPass
                      ? "text-emerald-700"
                      : "text-amber-700"
                  }`}
                >
                  {publishFlowSummary.publishGuardReport.warnings[0] ??
                    "Packaging is within the default fast-publish guard."}
                </div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm shadow-gray-200/60">
                <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400">
                  5. Final Output
                </div>
                <div className="mt-2 text-sm font-semibold text-gray-900">
                  {publishFlowSummary.durationLane.toUpperCase()} •{" "}
                  {formatPipelineStyleLabel(publishFlowSummary.pipelineStyle)}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Hook: {publishFlowSummary.hookFamily}{" "}
                  {publishFlowSummary.fastPublishMode ? "• Fast publish" : ""}
                </div>
                <div
                  className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                    publishFlowSummary.publishWorthy
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {publishFlowSummary.publishWorthy
                    ? "Publish-worthy"
                    : "Review before publish"}
                </div>
              </div>
            </div>
          )}

          {outputReadiness && (
            <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Output Review
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                        outputReadiness.status === "Ready"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {outputReadiness.status}
                    </span>
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    {pkg.predatorName ?? predator} vs {pkg.preyName ?? prey}
                  </div>
                  <div className="mt-1 text-xs leading-relaxed text-slate-500">
                    Review prompts before copying into Runway/Kling. Export is advisory and does not upload automatically.
                  </div>
                </div>

                <div className="grid min-w-[220px] gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-700 sm:grid-cols-2">
                  <div>
                    <div className="font-semibold text-slate-500">Main engine path</div>
                    <div className="mt-1 font-semibold text-slate-900">{mainEnginePath}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-500">Duration lane</div>
                    <div className="mt-1 font-semibold text-slate-900">{durationLaneLabel}</div>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="font-semibold text-slate-500">Scene arc</div>
                    <div className="mt-1 font-semibold text-slate-900">
                      {publishFlowSummary?.arcName ?? pkg.arcName ?? "Current workflow"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {outputReadiness.items.map((item) => (
                  <div
                    key={item.label}
                    className={`rounded-xl border p-3 text-[11px] leading-relaxed ${
                      item.status === "pass"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                        : "border-amber-200 bg-amber-50 text-amber-900"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold">
                      <span aria-hidden="true">{item.status === "pass" ? "✓" : "!"}</span>
                      <span>{item.label}</span>
                    </div>
                    <div className="mt-1 text-[10px] opacity-90">{item.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={`mb-4 rounded-2xl border p-4 shadow-sm ${workflowQaColor}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-70">
                    Final QA Summary
                  </div>
                  <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-900">
                    {workflowQa.status}
                  </span>
                </div>
                <div className="mt-1 text-sm font-semibold">
                  Overall score: {workflowQa.score}/100
                </div>
                <div className="mt-1 text-xs leading-relaxed opacity-80">
                  Advisory only. Use this card as a final review gate before copying prompts or exporting the package.
                </div>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/70 px-3 py-2 text-xs font-semibold text-gray-900">
                {predator} vs {prey}
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {workflowQa.items.map((item) => (
                <div
                  key={item.label}
                  className={`rounded-xl border bg-white/80 p-3 text-[11px] leading-relaxed ${
                    item.status === "pass"
                      ? "border-emerald-200 text-emerald-900"
                      : item.status === "warning"
                        ? "border-amber-200 text-amber-900"
                        : "border-rose-200 text-rose-900"
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        item.status === "pass"
                          ? "bg-emerald-100 text-emerald-700"
                          : item.status === "warning"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {item.status}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  <div className="mt-1 text-[10px] opacity-90">{item.detail}</div>
                </div>
              ))}
            </div>

            {workflowQa.topFixes.length > 0 && (
              <div className="mt-4 rounded-xl border border-white/70 bg-white/70 p-3">
                <div className="text-[11px] font-semibold text-gray-900">Top fixes</div>
                <div className="mt-2 space-y-1 text-[10px] leading-relaxed text-gray-700">
                  {workflowQa.topFixes.map((fix) => (
                    <p key={fix}>• {fix}</p>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mb-4 rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm shadow-gray-200/60">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                    Generated Output
                  </div>
                  <span className="rounded-full bg-gray-900 px-2.5 py-1 text-[10px] font-semibold text-white/80">
                    Ready to scan
                  </span>
                </div>
                <div className="mt-1 text-sm font-semibold text-gray-800">
                  Prompt pack, workflow guidance, and export-ready copy
                </div>
                <div className="mt-1 text-xs leading-relaxed text-gray-500">
                  Core prompts, workflow notes, and posting assets are grouped
                  below for quick review.
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-semibold text-violet-700">
                  Seedance
                </span>
                <span className="rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-semibold text-green-700">
                  Runway
                </span>
                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-semibold text-blue-700">
                  Kling
                </span>
              </div>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <OutputCards data={pkg} onRestoreVersion={onRestoreVersion} />
          </div>
        </section>
        </GenerationOutputBoundary>
      )}

      <div className="flex gap-2 border-t border-gray-200/80 pt-5">
        <button
          type="button"
          onClick={onBack}
          className="rounded-2xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 shadow-sm shadow-gray-100/80 hover:bg-gray-50 active:scale-[0.98]"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
