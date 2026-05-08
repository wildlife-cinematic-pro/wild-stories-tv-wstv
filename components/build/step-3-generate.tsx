"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import ConceptVariantLab from "@/components/build/concept-variant-lab";
import GenerationOutputBoundary from "@/components/build/generation-output-boundary";
import Runway2026ProductionAssistantCard from "@/components/build/runway-2026-production-assistant-card";
import SectionLockControls from "@/components/build/section-lock-controls";
import OutputCards from "@/components/OutputCards";

import {
  buildFixWeakSectionPrompt,
  buildPolishOnlyPrompt,
  buildReviewOnlyPrompt,
} from "@/lib/ai-handoff-prompts";
import type { PublishFlowSummary } from "@/lib/build-package";
import { buildCreatorQaPack } from "@/lib/creator-qa-pack";
import { buildPinnedOutputComparison } from "@/lib/creator-qa-run-history";
import type {
  CreatorQaRun,
  PinnedGeneratedOutput,
} from "@/lib/creator-qa-run-history";
import { analyzeOutputReadiness } from "@/lib/output-readiness";
import { formatPipelineStyleLabel } from "@/lib/page-build-helpers";
import type { StoryModePreset } from "@/lib/story-mode-presets";
import { buildRunway2026AssistantPack } from "@/lib/runway-2026-production-assistant";
import { buildWorkflowQaSummary } from "@/lib/workflow-qa";
import {
  COPY_POLISH_PROVIDER_CONFIGS,
  formatCopyPolishFallbackPlan,
  type CopyPolishProviderAvailability,
} from "@/lib/copy-polish-providers";
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

type ProviderAvailabilityMap = Record<AIProvider, CopyPolishProviderAvailability>;

const DEFAULT_PROVIDER_AVAILABILITY = COPY_POLISH_PROVIDER_CONFIGS.reduce(
  (acc, provider) => {
    acc[provider.id] = {
      id: provider.id,
      enabled: provider.id === "gemini" || provider.id === "none",
      label: provider.label,
      helperText:
        provider.id === "gemini"
          ? "Current default provider."
          : provider.id === "none"
            ? "Local mode — no API polish will be called."
            : "Future provider — add API key to enable.",
    };
    return acc;
  },
  {} as ProviderAvailabilityMap
);

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
  enhancementNotice?: string | null;
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
  onApplyStoryModePreset?: (preset: StoryModePreset) => void;
  lastGeneratedRestoreNotice?: string | null;
  onDismissLastGeneratedRestoreNotice?: () => void;
  creatorQaRuns: CreatorQaRun[];
  pinnedOutput: PinnedGeneratedOutput | null;
  onPinCurrentOutput: () => void;
  onRestorePinnedOutput: () => void;
  onClearPinnedOutput: () => void;
  onClearCreatorQaRuns: () => void;
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
  enhancementNotice,
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
  onApplyStoryModePreset,
  lastGeneratedRestoreNotice,
  onDismissLastGeneratedRestoreNotice,
  creatorQaRuns,
  pinnedOutput,
  onPinCurrentOutput,
  onRestorePinnedOutput,
  onClearPinnedOutput,
  onClearCreatorQaRuns,
  onBack,
}: Step3GenerateProps) {
  const [isQaDetailsOpen, setIsQaDetailsOpen] = useState(false);
  const [isRecentRunsOpen, setIsRecentRunsOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [providerAvailability, setProviderAvailability] = useState<ProviderAvailabilityMap>(
    DEFAULT_PROVIDER_AVAILABILITY
  );
  const generatedOutputTopRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProviderAvailability() {
      try {
        const res = await fetch("/api/enhance/provider-status", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { providers?: CopyPolishProviderAvailability[] };
        const providers = data.providers;
        if (!isMounted || !Array.isArray(providers)) return;

        setProviderAvailability((current) => {
          const next = { ...current };
          for (const provider of providers) {
            next[provider.id] = provider;
          }
          return next;
        });
      } catch {
        // Keep the conservative local defaults if provider status cannot load.
      }
    }

    void loadProviderAvailability();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const current = providerAvailability[activeProvider];
    if (activeProvider !== "gemini" && activeProvider !== "none" && current && !current.enabled) {
      onActiveProviderChange("gemini");
    }
  }, [activeProvider, onActiveProviderChange, providerAvailability]);

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
  const workflowQa = useMemo(
    () =>
      buildWorkflowQaSummary({
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
      }),
    [
      animalVibe,
      arc,
      cameraAnglePreset,
      contentLane,
      depthMode,
      emotionalTone,
      finalEnvironment,
      habitat,
      pkg,
      predator,
      prey,
      sceneDescription,
      weather,
    ]
  );
  const workflowQaColor =
    workflowQa.status === "Ready"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : workflowQa.status === "Needs review"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-rose-200 bg-rose-50 text-rose-900";
  const quickFixes = workflowQa.topFixes.slice(0, 2);
  const currentOutputPredator = pkg?.predatorName ?? predator;
  const currentOutputPrey = pkg?.preyName ?? prey;
  const pinnedOutputComparison = buildPinnedOutputComparison({
    pinnedOutput,
    currentQaScore: workflowQa.score,
    currentPredator: currentOutputPredator,
    currentPrey: currentOutputPrey,
  });
  const mainVideoPrompt =
    pkg?.wstvMotionPromptFinal ||
    pkg?.runwayShots[0] ||
    pkg?.klingShots[0] ||
    pkg?.seedanceShots?.[0] ||
    "";
  const creatorQaPack = useMemo(() => (pkg ? buildCreatorQaPack(pkg) : null), [pkg]);
  const aiHandoffInput = pkg
    ? {
        predator: currentOutputPredator,
        prey: currentOutputPrey,
        sceneDescription,
        workflowLabel: `${mainEnginePath} • ${durationLaneLabel}`,
        qaScore: workflowQa.score,
        qaStatus: workflowQa.status,
        qaTopFixes: workflowQa.topFixes,
        imagePrompt: pkg.imagePrompt,
        videoPrompt: mainVideoPrompt,
        caption: pkg.caption,
        hashtags: pkg.hashtags,
      }
    : null;
  const runwayAssistantPack = useMemo(() => {
    if (!pkg) {
      return null;
    }

    return buildRunway2026AssistantPack({
      predatorName: pkg.predatorName ?? predator,
      preyName: pkg.preyName ?? prey,
      environmentName: pkg.environmentName ?? finalEnvironment ?? habitat,
      arcName: pkg.arcName ?? arc,
      sceneDescription,
      runwayModel: pkg.modelsUsed?.runway ?? "Gen-4.5",
      klingModel: pkg.modelsUsed?.kling ?? "Kling 3.0 Pro",
      imagePrompt: pkg.imagePrompt,
      runwayShots: pkg.runwayShots,
      klingShots: pkg.klingShots,
      klingNative15s: pkg.klingNative15s,
      negativePrompt: pkg.negativePrompt,
      caption: pkg.caption,
      hashtags: pkg.hashtags,
      mainVideoPrompt,
      failureRepairPromptAleph: creatorQaPack?.failureRepairPromptAleph,
      qaStatus: workflowQa.status,
      qaScore: workflowQa.score,
      qaTopFixes: workflowQa.topFixes,
    });
  }, [
    arc,
    creatorQaPack?.failureRepairPromptAleph,
    finalEnvironment,
    habitat,
    mainVideoPrompt,
    pkg,
    predator,
    prey,
    sceneDescription,
    workflowQa,
  ]);

  const formatPinnedOutputTimestamp = (createdAt: string) => {
    const date = new Date(createdAt);

    return Number.isNaN(date.getTime())
      ? createdAt
      : date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
  };

  const formatCreatorQaRunTimestamp = (createdAt: string, index: number) => {
    if (index === 0) {
      return "Latest";
    }

    const date = new Date(createdAt);

    return Number.isNaN(date.getTime())
      ? createdAt
      : date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
  };

  const getCreatorQaRunStatusClasses = (
    status?: CreatorQaRun["finalQaStatus"]
  ) => {
    if (status === "Ready") {
      return "bg-emerald-100 text-emerald-700";
    }

    if (status === "Needs review") {
      return "bg-amber-100 text-amber-700";
    }

    return "bg-rose-100 text-rose-700";
  };

  const buildFullPackageText = (data: GeneratedPackage) => {
    const sections = [
      ["Image Prompt", data.imagePrompt],
      ["Negative Prompt", data.negativePrompt],
      ["Runway Prompt", data.runwayShots.join("\n\n")],
      ["Kling Prompt", data.klingShots.join("\n\n")],
      ["Seedance Prompt", data.seedanceShots?.join("\n\n") ?? ""],
      ["Caption", data.caption],
      ["Hashtags", data.hashtags],
      ["Routing Note", data.routingNote],
    ].filter(([, body]) => Boolean(body && body.trim()));

    return sections
      .map(([label, body]) => `${label.toUpperCase()}\n${body}`)
      .join("\n\n");
  };

  const handleCopy = async (label: string, text: string | undefined) => {
    if (!text?.trim()) {
      return;
    }

    try {
      if (!navigator?.clipboard?.writeText) {
        setCopyFeedback(null);
        return;
      }

      await navigator.clipboard.writeText(text);
      setCopyFeedback(label);
      window.setTimeout(() => setCopyFeedback((current) => (current === label ? null : current)), 1800);
    } catch {
      setCopyFeedback(null);
    }
  };

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
            {COPY_POLISH_PROVIDER_CONFIGS.map((provider) => {
              const availability =
                providerAvailability[provider.id] ?? DEFAULT_PROVIDER_AVAILABILITY[provider.id];
              const isActive = activeProvider === provider.id;
              const isDisabled = !availability.enabled;
              const buttonClassName = [
                "rounded-2xl border px-4 py-2 text-left text-xs font-semibold transition-all active:scale-95 disabled:cursor-not-allowed disabled:active:scale-100",
                isActive
                  ? "border-white/25 bg-white/10 text-white shadow-sm shadow-black/20"
                  : isDisabled
                    ? "border-white/[0.08] bg-white/[0.02] text-white/25"
                    : "border-white/[0.12] text-white/45 hover:bg-white/[0.06] hover:text-white/70",
              ].join(" ");

              return (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => {
                    if (!isDisabled) onActiveProviderChange(provider.id);
                  }}
                  disabled={isDisabled}
                  title={availability.helperText}
                  aria-label={provider.label + ": " + availability.helperText}
                  className={buttonClassName}
                >
                  <span className="block">
                    {provider.id === "none" ? provider.label : "✦ " + provider.label}
                  </span>
                  {provider.id !== "gemini" && provider.id !== "none" ? (
                    <span className="mt-0.5 block text-[9px] font-medium uppercase tracking-[0.08em] text-white/25">
                      {provider.kind === "fallback" ? "Fallback slot" : "Future slot"}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          <div className="mt-3 rounded-xl border border-white/[0.08] bg-black/15 px-3 py-2 text-[10px] leading-relaxed text-white/35">
            Fallback plan for future: {formatCopyPolishFallbackPlan()}. Disabled providers never receive API calls.
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

      {enhancementNotice && (
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
          <p className="text-sm font-semibold text-sky-900">{enhancementNotice}</p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-700">⚠️ {error}</p>
        </div>
      )}

      {pkg && (
        <GenerationOutputBoundary
          resetKey={`${pkg.hook ?? ""}|${pkg.caption ?? ""}|${pkg.routingNote ?? ""}`}
        >
          <section ref={generatedOutputTopRef}>
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
              <div className="mb-4 overflow-x-auto pb-1">
                <div className="grid min-w-[940px] gap-3 md:grid-cols-2 xl:grid-cols-5">
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
              </div>
            )}

            <div className={`mb-4 rounded-2xl border p-4 shadow-sm ${workflowQaColor}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-70">
                      Final QA Summary
                    </div>
                    <span className="rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-900">
                      {workflowQa.status}
                    </span>
                    <span className="rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-semibold text-gray-900">
                      {workflowQa.score}/100
                    </span>
                  </div>
                  <div className="mt-1 text-sm font-semibold">
                    {pkg.predatorName ?? predator} vs {pkg.preyName ?? prey}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.08em] opacity-80">
                    <span>{mainEnginePath}</span>
                    <span>•</span>
                    <span>{durationLaneLabel}</span>
                    <span>•</span>
                    <span>{publishFlowSummary?.arcName ?? pkg.arcName ?? arc}</span>
                  </div>
                  <div className="mt-2 text-xs leading-relaxed opacity-85">
                    Review prompts before copying into Runway/Kling. Export is advisory and does not upload automatically.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsQaDetailsOpen((current) => !current)}
                  className="rounded-xl border border-white/70 bg-white/75 px-3 py-2 text-xs font-semibold text-gray-900 shadow-sm hover:bg-white active:scale-[0.98]"
                >
                  {isQaDetailsOpen ? "Hide checklist" : "Show checklist"}
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {workflowQa.items.map((item) => (
                  <span
                    key={item.label}
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                      item.status === "pass"
                        ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                        : item.status === "warning"
                          ? "border-amber-200 bg-amber-100 text-amber-700"
                          : "border-rose-200 bg-rose-100 text-rose-700"
                    }`}
                  >
                    {item.label}
                  </span>
                ))}
              </div>

              {quickFixes.length > 0 && (
                <div className="mt-4 rounded-xl border border-white/70 bg-white/70 p-3">
                  <div className="text-[11px] font-semibold text-gray-900">Top fixes</div>
                  <div className="mt-2 space-y-1 text-[10px] leading-relaxed text-gray-700">
                    {quickFixes.map((fix) => (
                      <p key={fix}>• {fix}</p>
                    ))}
                  </div>
                </div>
              )}

              {isQaDetailsOpen && (
                <div className="mt-4 space-y-4">
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
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

                  {outputReadiness && (
                    <div className="rounded-xl border border-white/70 bg-white/70 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-[11px] font-semibold text-gray-900">Output readiness</div>
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
                      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
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
                </div>
              )}
            </div>

            {runwayAssistantPack && (
              <Runway2026ProductionAssistantCard
                pack={runwayAssistantPack}
                onCopy={handleCopy}
                copyFeedback={copyFeedback}
              />
            )}

            {aiHandoffInput && (
              <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      AI Handoff
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      Locked handoff modes for Claude or ChatGPT
                    </div>
                    <div className="mt-1 text-xs leading-relaxed text-slate-500">
                      Copies a ready prompt you can paste into Claude or ChatGPT. Nothing is sent automatically.
                    </div>
                  </div>
                  {copyFeedback && copyFeedback.includes("Prompt") && (
                    <div className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-semibold text-white">
                      {copyFeedback} copied
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        "Polish Prompt",
                        buildPolishOnlyPrompt(aiHandoffInput)
                      )
                    }
                    className="rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-black active:scale-[0.98]"
                  >
                    Copy Polish Only Prompt
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        "Review Prompt",
                        buildReviewOnlyPrompt(aiHandoffInput)
                      )
                    }
                    className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50 active:scale-[0.98]"
                  >
                    Copy Review Only Prompt
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        "Fix Prompt",
                        buildFixWeakSectionPrompt(aiHandoffInput)
                      )
                    }
                    className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50 active:scale-[0.98]"
                  >
                    Copy Fix Weak Section Prompt
                  </button>
                </div>
              </div>
            )}

            <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Quick Export Bar
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    Shortcut copy actions for the current output package
                  </div>
                  <div className="mt-1 text-xs leading-relaxed text-slate-500">
                    Copy shortcuts only. Existing output workspaces and export actions stay available below.
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {copyFeedback && (
                    <div className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-semibold text-white">
                      {copyFeedback} copied
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={onPinCurrentOutput}
                    className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50 active:scale-[0.98]"
                  >
                    Pin This Output
                  </button>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => handleCopy("Full Package", buildFullPackageText(pkg))}
                  className="rounded-xl bg-gray-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-black active:scale-[0.98]"
                >
                  Copy Full Package
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy("Image Prompt", pkg.imagePrompt)}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50 active:scale-[0.98]"
                >
                  Copy Image Prompt
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy("Caption", pkg.caption)}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50 active:scale-[0.98]"
                >
                  Copy Caption
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy("Hashtags", pkg.hashtags)}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50 active:scale-[0.98]"
                >
                  Copy Hashtags
                </button>
              </div>
            </div>

            {pinnedOutput && (
              <div className="mb-4 rounded-2xl border border-violet-200 bg-violet-50 p-4 shadow-sm shadow-violet-100/60">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-500">
                      Pinned Best Output
                    </div>
                    <div className="mt-1 text-sm font-semibold text-violet-950">
                      {pinnedOutput.predator} vs {pinnedOutput.prey}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-violet-700/90">
                      <span className="rounded-full bg-white/85 px-2.5 py-1 text-violet-900">
                        {pinnedOutput.finalQaStatus ?? "Risky"}
                      </span>
                      <span className="rounded-full bg-white/70 px-2.5 py-1 text-violet-900">
                        {pinnedOutput.finalQaScore ?? "--"}/100
                      </span>
                      <span>Saved {formatPinnedOutputTimestamp(pinnedOutput.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={onRestorePinnedOutput}
                      className="rounded-xl bg-violet-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-violet-950 active:scale-[0.98]"
                    >
                      Restore Pinned Output
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          "Pinned Full Package",
                          buildFullPackageText(pinnedOutput.package)
                        )
                      }
                      className="rounded-xl border border-violet-200 bg-white px-3.5 py-2 text-xs font-semibold text-violet-800 shadow-sm hover:bg-violet-100 active:scale-[0.98]"
                    >
                      Copy Pinned Full Package
                    </button>
                    <button
                      type="button"
                      onClick={onClearPinnedOutput}
                      className="rounded-xl border border-violet-200 bg-white px-3.5 py-2 text-xs font-semibold text-violet-800 shadow-sm hover:bg-violet-100 active:scale-[0.98]"
                    >
                      Clear Pinned Output
                    </button>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-violet-200 bg-white/80 p-3 text-xs leading-relaxed text-violet-950">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-semibold">Compare current vs pinned</div>
                    <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-semibold text-violet-800">
                      {pinnedOutputComparison.label}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-xl border border-violet-100 bg-violet-50/70 p-3">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-violet-500">Current</div>
                      <div className="mt-1 font-semibold">{currentOutputPredator} vs {currentOutputPrey}</div>
                      <div className="mt-1 text-[11px] text-violet-900/85">
                        {workflowQa.status} • {workflowQa.score}/100
                      </div>
                    </div>
                    <div className="rounded-xl border border-violet-100 bg-violet-50/70 p-3">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-violet-500">Pinned</div>
                      <div className="mt-1 font-semibold">{pinnedOutput.predator} vs {pinnedOutput.prey}</div>
                      <div className="mt-1 text-[11px] text-violet-900/85">
                        {pinnedOutput.finalQaStatus ?? "Risky"} • {pinnedOutput.finalQaScore ?? "--"}/100
                      </div>
                    </div>
                  </div>
                  {pinnedOutputComparison.pairsDiffer && (
                    <div className="mt-3 space-y-1 text-[11px] text-violet-900/85">
                      <div>Pinned: {pinnedOutputComparison.pinnedPair}</div>
                      <div>Current: {pinnedOutputComparison.currentPair}</div>
                    </div>
                  )}
                  <div className="mt-3 text-[11px] text-violet-900/80">
                    Restore swaps the visible generated package only. Step 1 and Step 2 setup values stay unchanged.
                  </div>
                </div>
              </div>
            )}

            {creatorQaRuns.length > 0 && (
              <div className="mb-4 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setIsRecentRunsOpen((current) => !current)}
                    className="text-left"
                  >
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
                      Recent QA Runs — {creatorQaRuns.length} runs
                    </div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      {isRecentRunsOpen ? "Hide local preset comparisons" : "Show local preset comparisons"}
                    </div>
                    <div className="mt-1 text-xs leading-relaxed text-white/60">
                      Local only. Clears safely and never changes your generated package.
                    </div>
                  </button>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-[10px] font-semibold text-white/70">
                      {creatorQaRuns[0]?.presetName ?? `${creatorQaRuns[0]?.predator} vs ${creatorQaRuns[0]?.prey}`}
                    </span>
                    <button
                      type="button"
                      onClick={onClearCreatorQaRuns}
                      className="rounded-xl border border-white/12 bg-white/8 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/12 active:scale-[0.98]"
                    >
                      Clear History
                    </button>
                  </div>
                </div>

                {isRecentRunsOpen && (
                  <div className="mt-4 grid gap-2">
                    {creatorQaRuns.map((run, index) => (
                      <div
                        key={run.id}
                        className="rounded-xl border border-white/10 bg-white/6 p-3 text-xs text-white/85"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div className="font-semibold text-white">
                              {run.presetName ?? `${run.predator} vs ${run.prey}`}
                            </div>
                            <div className="mt-1 text-[11px] text-white/55">
                              {run.predator} vs {run.prey}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${getCreatorQaRunStatusClasses(run.finalQaStatus)}`}>
                              {run.finalQaStatus ?? "Risky"}
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-[10px] font-semibold text-white/75">
                              {run.finalQaScore ?? "--"}/100
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-white/60">
                          <span>{formatCreatorQaRunTimestamp(run.createdAt, index)}</span>
                          <span>• Prompt health: {run.promptHealthLabel ?? "n/a"}</span>
                          <span>• {run.outputReady ? "Output ready" : "Needs output review"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

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
              <OutputCards
                data={pkg}
                onRestoreVersion={onRestoreVersion}
                onApplyStoryModePreset={onApplyStoryModePreset}
              />
            </div>
          </section>
        </GenerationOutputBoundary>
      )}

      <div className="flex flex-wrap gap-2 border-t border-gray-200/80 pt-5">
        <button
          type="button"
          onClick={onBack}
          className="rounded-2xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 shadow-sm shadow-gray-100/80 hover:bg-gray-50 active:scale-[0.98]"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={() => {
            if (generatedOutputTopRef.current) {
              generatedOutputTopRef.current.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
              return;
            }

            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="rounded-2xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 shadow-sm shadow-gray-100/80 hover:bg-gray-50 active:scale-[0.98]"
        >
          ↑ Top
        </button>
      </div>
    </div>
  );
}
