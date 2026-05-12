"use client";

import { useEffect, useState } from "react";

import MediaAnalyzer from "@/components/MediaAnalyzer";
import QualityPanel, { type QualityPanelProps } from "@/components/QualityPanel";
import { FeaturedModelCard } from "@/components/build/model-cards";

import {
  VIDEO_MODEL_GROUP_LABELS,
  VIDEO_MODEL_GROUP_ORDER,
  getSceneBasedVideoModelRecommendations,
  getVideoModelCapabilitiesByGroup,
  getVideoModelSelectionPatch,
  resolveAutoSelectedVideoModel,
  type VideoModelCapability,
  type VideoModelSceneRecommendation,
} from "@/lib/video-model-capabilities";
import {
  analyzePromptHealth,
  buildEnginePromptRecommendation,
  type EnginePromptMode,
} from "@/lib/prompt-health";
import type { QualityRecommendations } from "@/lib/recommendations";
import type {
  AIProvider,
  ActionStylePreset,
  Arc,
  ContentLane,
  DurationLane,
  HabitatPreset,
  HookFamily,
  KlingModel,
  MediaAnalysisResult,
  OpeningFrameScore,
  PredatorInfo,
  PublishGuardReport,
  RunwayModel,
  USAudienceScoreResult,
  Weather,
  VideoModelProviderGroup,
} from "@/types";

const ACTION_STYLE_OPTIONS: ActionStylePreset[] = [
  "Natural tension",
  "Viral chase",
  "Close-contact fight",
  "Ambush burst",
  "Forced retreat",
];

function tierLabel(value: VideoModelCapability["realismTier"]): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function CapabilityInfoCard({
  capability,
  badge = "Route",
  selected = false,
  recommended = false,
  bestForScene = false,
  autoSelected = false,
  onSelect,
}: {
  capability: VideoModelCapability;
  badge?: string;
  selected?: boolean;
  recommended?: boolean;
  bestForScene?: boolean;
  autoSelected?: boolean;
  onSelect?: () => void;
}) {
  const verificationLabel = capability.needsVerification
    ? "Needs verification"
    : "Verified in app";
  const patch = getVideoModelSelectionPatch(capability.id);
  const routeLabel =
    capability.providerGroup === "RUNWAY_THIRD_PARTY"
      ? "Third-party workflow"
      : capability.providerGroup === "SEEDANCE_DIRECT"
        ? "Optional route"
        : "Direct selectable";

  return (
    <button
      type="button"
      data-testid={`video-model-card-${capability.id}`}
      onClick={onSelect}
      aria-pressed={selected}
      className={`w-full rounded-2xl border px-3.5 py-3.5 text-left shadow-sm transition-all active:scale-[0.99] ${
        selected
          ? "border-indigo-300 bg-indigo-50 shadow-indigo-100/80"
          : "border-gray-200 bg-white shadow-gray-100/70 hover:border-indigo-200 hover:bg-indigo-50/40"
      }`}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600">
            {badge}
          </span>
          {selected && (
            <span className="rounded-full bg-indigo-600 px-2 py-1 text-[10px] font-semibold text-white">
              {autoSelected ? "Auto-selected" : "✓ Selected"}
            </span>
          )}
          {recommended && (
            <span className="rounded-full bg-sky-100 px-2 py-1 text-[10px] font-semibold text-sky-700">
              Recommended
            </span>
          )}
          {bestForScene && (
            <span className="rounded-full bg-violet-100 px-2 py-1 text-[10px] font-semibold text-violet-700">
              Best for this scene
            </span>
          )}
        </div>
        <span
          className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
            capability.needsVerification
              ? "bg-amber-100 text-amber-800"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {verificationLabel}
        </span>
      </div>
      <div className="text-sm font-semibold tracking-tight text-gray-900">
        {capability.label}
      </div>
      <p className="mt-1 text-xs leading-relaxed text-gray-600">
        {capability.recommendedUse}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-semibold">
        <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">
          Realism {tierLabel(capability.realismTier)}
        </span>
        <span className="rounded-full bg-rose-50 px-2 py-1 text-rose-700">
          Action {tierLabel(capability.actionTier)}
        </span>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">
          {capability.provider}
        </span>
        <span className="rounded-full bg-indigo-50 px-2 py-1 text-indigo-700">
          {routeLabel}
        </span>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
        {capability.wildlifeUseCase}
      </p>
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500">
        {patch?.runwayModel
          ? "Syncs legacy Runway model"
          : patch?.klingModel
            ? "Syncs legacy Kling model"
            : "Expanded model only"}
      </p>
    </button>
  );
}

type Step2EngineQualityProps = {
  qualityReco: QualityRecommendations;
  autoApplyHighDrift: boolean;
  hasUndoQuality: boolean;
  onToggleAutoApplyHighDrift: () => void;
  onUndoRecommendedQuality: () => void;
  onApplyRecommendedQuality: () => void;
  marketMode: string;
  durationLane: DurationLane;
  hookMode: HookFamily | "all";
  fastPublishMode: boolean;
  strictOriginalityGuard: boolean;
  previewAudienceScore: USAudienceScoreResult;
  previewOpeningFrameScore: OpeningFrameScore;
  previewPublishGuardReport: PublishGuardReport;
  runwayModel: RunwayModel;
  klingModel: KlingModel;
  selectedVideoModelId: string;
  selectedVideoProviderGroup: VideoModelProviderGroup;
  autoSelectRecommendedVideoModel: boolean;
  onVideoModelSelectionChange: (modelId: string) => void;
  onAutoSelectRecommendedVideoModelChange: (value: boolean) => void;
  qualityPanelProps: QualityPanelProps;
  activeProvider: AIProvider;
  mediaAnalysis: MediaAnalysisResult | null;
  onMediaAnalysisComplete: (result: MediaAnalysisResult) => void;
  onClearMediaAnalysis: () => void;
  sceneDescription: string;
  actionStyle: ActionStylePreset;
  sceneDescriptionMode: "auto" | "manual";
  sceneDescriptionTouched: boolean;
  sceneMode: "romanized" | "english";
  onActionStyleChange: (style: ActionStylePreset) => void;
  onSceneModeChange: (mode: "romanized" | "english") => void;
  onAutoFillSceneDescription: () => void;
  onRegenerateSceneDescription: () => void;
  onSceneDescriptionChange: (value: string) => void;
  predator: string;
  prey: string;
  arc: Arc;
  habitat: HabitatPreset;
  weather: Weather;
  finalEnvironment: string;
  contentLane: ContentLane;
  driftRisk: PredatorInfo["driftRisk"];
  onDurationLaneChange: (lane: DurationLane) => void;
  onHookModeChange: (mode: HookFamily | "all") => void;
  onToggleFastPublishMode: () => void;
  onToggleStrictOriginalityGuard: () => void;
  onBack: () => void;
  onContinue: () => void;
};

export default function Step2EngineQuality({
  qualityReco,
  autoApplyHighDrift,
  hasUndoQuality,
  onToggleAutoApplyHighDrift,
  onUndoRecommendedQuality,
  onApplyRecommendedQuality,
  marketMode,
  durationLane,
  hookMode,
  fastPublishMode,
  strictOriginalityGuard,
  previewAudienceScore,
  previewOpeningFrameScore,
  previewPublishGuardReport,
  runwayModel,
  klingModel,
  selectedVideoModelId,
  selectedVideoProviderGroup,
  autoSelectRecommendedVideoModel,
  onVideoModelSelectionChange,
  onAutoSelectRecommendedVideoModelChange,
  qualityPanelProps,
  activeProvider,
  mediaAnalysis,
  onMediaAnalysisComplete,
  onClearMediaAnalysis,
  sceneDescription,
  actionStyle,
  sceneDescriptionMode,
  sceneDescriptionTouched,
  sceneMode,
  onActionStyleChange,
  onSceneModeChange,
  onAutoFillSceneDescription,
  onRegenerateSceneDescription,
  onSceneDescriptionChange,
  predator,
  prey,
  arc,
  habitat,
  weather,
  finalEnvironment,
  contentLane,
  driftRisk,
  onDurationLaneChange,
  onHookModeChange,
  onToggleFastPublishMode,
  onToggleStrictOriginalityGuard,
  onBack,
  onContinue,
}: Step2EngineQualityProps) {
  const promptHealth = analyzePromptHealth({
    prompt: sceneDescription,
    predatorName: predator,
    preyName: prey,
    arc,
    weather,
    contentLane,
    habitat,
    finalEnvironment,
  });
  const [promptModeOverride, setPromptModeOverride] =
    useState<EnginePromptMode | null>(null);
  const [optimizedPromptCopied, setOptimizedPromptCopied] = useState(false);
  const activePromptMode = promptModeOverride ?? promptHealth.recommendedMode;
  const promptRecommendation = buildEnginePromptRecommendation({
    prompt: sceneDescription,
    predatorName: predator,
    preyName: prey,
    arc,
    weather,
    contentLane,
    habitat,
    finalEnvironment,
    mode: activePromptMode,
  });
  const promptHealthColor =
    promptHealth.severity === "success"
      ? "border-emerald-100 bg-emerald-50/80 text-emerald-900"
      : promptHealth.severity === "info"
        ? "border-sky-100 bg-sky-50/80 text-sky-900"
        : promptHealth.severity === "warning"
          ? "border-amber-100 bg-amber-50/80 text-amber-900"
          : "border-rose-100 bg-rose-50/80 text-rose-900";

  const handleApplyOptimizedPrompt = () => {
    onSceneDescriptionChange(promptRecommendation.prompt);
  };

  const handleCopyOptimizedPrompt = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(promptRecommendation.prompt);
      setOptimizedPromptCopied(true);
      globalThis.setTimeout(() => setOptimizedPromptCopied(false), 1600);
    } catch {
      // Fail gracefully when clipboard access is unavailable.
    }
  };

  const sceneModelRecommendations = getSceneBasedVideoModelRecommendations({
    runwayModel,
    klingModel,
    actionStyle,
    arc,
    contentLane,
  }).slice(0, 4);

  const bestSceneRecommendation = sceneModelRecommendations[0];

  const handleSelectVideoModel = (modelId: string) => {
    onVideoModelSelectionChange(modelId);
  };

  const handleApplySceneRecommendation = (
    recommendation: VideoModelSceneRecommendation
  ) => {
    handleSelectVideoModel(recommendation.id);
  };

  useEffect(() => {
    const nextModelId = resolveAutoSelectedVideoModel({
      autoSelectRecommendedVideoModel,
      currentSelectedVideoModelId: selectedVideoModelId,
      recommendations: sceneModelRecommendations,
    });

    if (nextModelId !== selectedVideoModelId) {
      onVideoModelSelectionChange(nextModelId);
    }
  }, [
    autoSelectRecommendedVideoModel,
    onVideoModelSelectionChange,
    sceneModelRecommendations,
    selectedVideoModelId,
  ]);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">
                🛡 Quality Automation
              </h3>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  qualityReco.level === "HIGH"
                    ? "bg-red-100 text-red-700"
                    : qualityReco.level === "MEDIUM"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {qualityReco.level} drift
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onToggleAutoApplyHighDrift}
                className={`rounded-2xl border px-3.5 py-2 text-xs font-semibold transition-all active:scale-95 ${
                  autoApplyHighDrift
                    ? "border-gray-900 bg-gray-900 text-white shadow-sm shadow-gray-300/60"
                    : "border-gray-200 bg-white text-gray-600 shadow-sm shadow-gray-100/80 hover:bg-gray-50"
                }`}
              >
                {autoApplyHighDrift ? "⚡ Auto: ON" : "⚡ Auto: OFF"}
              </button>
              <button
                type="button"
                disabled={!hasUndoQuality}
                onClick={onUndoRecommendedQuality}
                className="rounded-2xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-600 shadow-sm shadow-gray-100/80 hover:bg-gray-50 disabled:opacity-40 active:scale-95"
              >
                ↩ Undo
              </button>
              <button
                type="button"
                onClick={onApplyRecommendedQuality}
                className="rounded-2xl bg-gray-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-gray-300/60 hover:bg-black active:scale-95"
              >
                ✅ Apply
              </button>
            </div>
          </div>

          {qualityReco.warnings.length > 0 ? (
            <div className="space-y-2">
              {qualityReco.warnings.map((warning) => (
                <div
                  key={warning.id}
                  className={`rounded-xl border p-3 ${
                    warning.severity === "danger"
                      ? "border-red-200 bg-red-50"
                      : warning.severity === "warning"
                        ? "border-amber-200 bg-amber-50"
                        : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="text-xs font-semibold text-gray-900">
                    {warning.title}
                  </div>
                  <div className="mt-0.5 text-xs text-gray-600">{warning.detail}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
              ✅ No critical warnings — quality settings look good.
            </div>
          )}

          {qualityReco.why.length > 0 && (
            <div className="mt-2 text-xs text-gray-400">
              <span className="font-semibold text-gray-500">Why:</span>{" "}
              {qualityReco.why.join(" • ")}
            </div>
          )}

          <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800">
            <div className="font-semibold">Publish path</div>
            <div className="mt-0.5">
              Inputs → U.S. score → Opening score → Publish guard → Final output
            </div>
            <div className="mt-1 text-blue-700">
              Suggested lane:{" "}
              <span className="font-semibold uppercase">{qualityReco.suggestedLane}</span> •{" "}
              {qualityReco.publishSafeRecommendation}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">
              Market & Publish Flow
            </h3>
            <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-semibold text-blue-700">
              {marketMode}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-gray-500">
                Duration Lane
              </label>
              <select
                value={durationLane}
                onChange={(event) => onDurationLaneChange(event.target.value as DurationLane)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900"
              >
                <option value="short">Short — 20s final edit</option>
                <option value="medium">Medium — 35s final edit</option>
                <option value="long">Long — 40s safe generation</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-gray-500">
                Hook Mode
              </label>
              <select
                value={hookMode}
                onChange={(event) =>
                  onHookModeChange(event.target.value as HookFamily | "all")
                }
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900"
              >
                <option value="all">All hook variants</option>
                <option value="danger">Danger</option>
                <option value="curiosity">Curiosity</option>
                <option value="reversal">Reversal</option>
              </select>
            </div>
          </div>

          <div className="mt-4 grid gap-2 md:grid-cols-2">
            <button
              type="button"
              onClick={onToggleFastPublishMode}
              className={`rounded-2xl border px-3.5 py-2 text-xs font-semibold transition-all active:scale-95 ${
                fastPublishMode
                  ? "border-gray-900 bg-gray-900 text-white shadow-sm shadow-gray-300/60"
                  : "border-gray-200 bg-white text-gray-600 shadow-sm shadow-gray-100/80 hover:bg-gray-50"
              }`}
            >
              {fastPublishMode ? "⚡ Fast Publish: ON" : "⚡ Fast Publish: OFF"}
            </button>
            <button
              type="button"
              onClick={onToggleStrictOriginalityGuard}
              className={`rounded-2xl border px-3.5 py-2 text-xs font-semibold transition-all active:scale-95 ${
                strictOriginalityGuard
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-100/70"
                  : "border-gray-200 bg-white text-gray-600 shadow-sm shadow-gray-100/80 hover:bg-gray-50"
              }`}
            >
              {strictOriginalityGuard
                ? "🛡 Originality Guard: ON"
                : "🛡 Originality Guard: OFF"}
            </button>
          </div>

          <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs text-gray-600">
            <div>
              <span className="font-semibold text-gray-700">U.S. score:</span>{" "}
              {previewAudienceScore.total}/100
            </div>
            <div className="mt-1">
              <span className="font-semibold text-gray-700">Opening score:</span>{" "}
              {previewOpeningFrameScore.total}/100
            </div>
            <div className="mt-1">
              <span className="font-semibold text-gray-700">Publish guard:</span>{" "}
              {previewPublishGuardReport.isPass ? "Pass" : "Needs cleanup"}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">
              Model Profile
            </h3>
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-medium text-gray-500">
              grouped by workflow
            </span>
          </div>

          <div className="mb-4">
            <FeaturedModelCard
              active
              tag="HYBRID"
              title="Hybrid 4-shot"
              subtitle="Primary WSTV production path — hybrid 4-shot continuity."
              note="Default continuity path = Runway Shot 1 → Kling Shot 2 → Kling Shot 3 → Runway Shot 4. Seedance remains available in the generated package as an optional full 4-shot bundle."
              activeLabel="✓ Primary default"
              onClick={() => {}}
            />
          </div>

          <div className="mb-4 rounded-2xl border border-gray-100 bg-gray-50 px-3.5 py-2.5 text-[11px] font-medium leading-relaxed text-gray-600">
            Video models are now organized by workflow role. Every card can be
            selected through the new expanded video model field, while legacy
            Runway/Kling fields stay intact for old presets and prompt generation.
          </div>

          <div className="mb-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-indigo-700">
                  Recommended for this scene
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-indigo-800">
                  Uses current action style, arc, and content lane. Auto-select is
                  off by default; when enabled it updates the expanded selected model,
                  and legacy Runway/Kling fields only sync for matching legacy models.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-indigo-700">
                  {sceneModelRecommendations.length} picks
                </span>
                <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-gray-600">
                  {VIDEO_MODEL_GROUP_LABELS[selectedVideoProviderGroup]}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onAutoSelectRecommendedVideoModelChange(
                      !autoSelectRecommendedVideoModel
                    )
                  }
                  className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold transition-all active:scale-[0.98] ${
                    autoSelectRecommendedVideoModel
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-100"
                  }`}
                >
                  Auto-select best model for scene: {autoSelectRecommendedVideoModel ? "ON" : "OFF"}
                </button>
              </div>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {sceneModelRecommendations.map((recommendation) => {
                const patch = getVideoModelSelectionPatch(recommendation.id);
                const isSelected = selectedVideoModelId === recommendation.id;
                const isAutoSelected =
                  autoSelectRecommendedVideoModel &&
                  bestSceneRecommendation?.id === recommendation.id &&
                  isSelected;

                return (
                  <div
                    key={recommendation.id}
                    className={`rounded-xl border px-3 py-2.5 ${
                      isSelected
                        ? "border-indigo-300 bg-white shadow-sm shadow-indigo-100"
                        : "border-indigo-100 bg-white/85"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-gray-900">
                        {recommendation.label}
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {isSelected && (
                          <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                            {isAutoSelected ? "Auto-selected" : "✓ Selected"}
                          </span>
                        )}
                        {bestSceneRecommendation?.id === recommendation.id && (
                          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
                            Best for this scene
                          </span>
                        )}
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                          Recommended
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            recommendation.selectionMode === "legacy-sync"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {recommendation.selectionMode === "legacy-sync"
                            ? "Direct selectable"
                            : "Third-party route"}
                        </span>
                      </div>
                    </div>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-gray-700">
                      <span className="font-semibold text-gray-900">Why:</span>{" "}
                      {recommendation.reason}
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-gray-600">
                      <span className="font-semibold text-gray-800">Best for:</span>{" "}
                      {recommendation.bestFor}
                    </p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                      {patch?.runwayModel
                        ? "Updates selected model and legacy Runway model"
                        : patch?.klingModel
                          ? "Updates selected model and legacy Kling model"
                          : "Updates expanded selected model only"}
                    </p>
                    <button
                      type="button"
                      disabled={isSelected}
                      onClick={() => handleApplySceneRecommendation(recommendation)}
                      className="mt-2 rounded-xl border border-indigo-200 bg-indigo-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm shadow-indigo-100 transition-all hover:bg-indigo-700 disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-500 disabled:shadow-none active:scale-[0.98]"
                    >
                      {isSelected ? "Recommended model selected" : "Apply Recommended Model"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {VIDEO_MODEL_GROUP_ORDER.map((group) => {
              const capabilities = getVideoModelCapabilitiesByGroup(group);
              const isRunwayNative = group === "RUNWAY_NATIVE";
              const isDirectKling = group === "KLING_DIRECT";

              return (
                <div key={group} className="space-y-2">
                  <div className="mb-1 flex items-center gap-2">
                    <div
                      className={`h-[2px] w-8 rounded-full ${
                        isRunwayNative
                          ? "bg-green-400"
                          : isDirectKling
                            ? "bg-blue-400"
                            : group === "RUNWAY_THIRD_PARTY"
                              ? "bg-amber-400"
                              : "bg-purple-400"
                      }`}
                    />
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                        isRunwayNative
                          ? "bg-green-100 text-green-700"
                          : isDirectKling
                            ? "bg-blue-100 text-blue-700"
                            : group === "RUNWAY_THIRD_PARTY"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {VIDEO_MODEL_GROUP_LABELS[group]}
                    </span>
                  </div>

                  {capabilities.map((capability) => {
                    const isRecommended = sceneModelRecommendations.some(
                      (recommendation) => recommendation.id === capability.id
                    );
                    const isBestForScene = bestSceneRecommendation?.id === capability.id;
                    const isSelected = selectedVideoModelId === capability.id;
                    const isAutoSelected =
                      autoSelectRecommendedVideoModel && isBestForScene && isSelected;

                    return (
                      <CapabilityInfoCard
                        key={capability.id}
                        capability={capability}
                        badge={
                          group === "RUNWAY_THIRD_PARTY"
                            ? "Third-party workflow"
                            : group === "SEEDANCE_DIRECT"
                              ? "Optional route"
                              : "Direct selectable"
                        }
                        selected={isSelected}
                        recommended={isRecommended}
                        bestForScene={isBestForScene}
                        autoSelected={isAutoSelected}
                        onSelect={() => handleSelectVideoModel(capability.id)}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-green-100 bg-green-50 px-3.5 py-3 text-xs leading-relaxed text-green-900">
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-green-700">
                Runway I2V rule
              </div>
              <ul className="mt-2 space-y-1 text-[11px] text-green-800">
                <li>• Gen-4 Turbo: cheap first structure tests</li>
                <li>• Gen-4.5: final cinematic wildlife hero shots</li>
                <li>• Motion/camera/physics only; reference images carry identity</li>
                <li>• Preserve @lead_animal, @opposite_animal, @environment</li>
              </ul>
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-3.5 py-3 text-xs leading-relaxed text-blue-900">
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-blue-700">
                Action routing rule
              </div>
              <ul className="mt-2 space-y-1 text-[11px] text-blue-800">
                <li>• Kling: grounded animal pressure and body mechanics</li>
                <li>• Seedance 2: fast chase/action and retention pacing</li>
                <li>• Aleph: edit/manipulate existing footage only</li>
                <li>• Never add gore, blood, visible injury, or kill-result wording</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
          <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">
            Quality Toggles
          </h3>
          <QualityPanel {...qualityPanelProps} />
          <div className="mt-4 border-t border-gray-100 pt-4">
            <label className="mb-1.5 block text-[11px] font-medium text-gray-500">
              Image Prompt Engine
            </label>
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900">
              Nano Banana 2 primary image master prompt
            </div>
            <div className="mt-2 text-xs leading-relaxed text-gray-500">
              Image prompt generation is fixed to the Nano Banana path. Runway and
              Kling stay motion/video only.
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50 p-3 text-xs text-violet-700">
            <div className="mb-1 font-semibold">Reference tags</div>
            <div className="space-y-0.5 text-[11px]">
              <div>
                Lead animal →{" "}
                <code className="rounded bg-white px-1 py-0.5 text-violet-800">
                  @lead_animal
                </code>
              </div>
              <div>
                Opposing animal →{" "}
                <code className="rounded bg-white px-1 py-0.5 text-violet-800">
                  @opposite_animal
                </code>
              </div>
              <div>
                Environment plate →{" "}
                <code className="rounded bg-white px-1 py-0.5 text-violet-800">
                  @environment
                </code>
              </div>
            </div>
            <div className="mt-1.5 text-violet-500">
              Video prompts मा appearance नलेख — reference image नै identity हो।
            </div>
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">
              📎 Media Upload
            </h3>
            <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[10px] font-semibold text-purple-600">
              Auto Analyze
            </span>
          </div>
          <MediaAnalyzer
            activeProvider={activeProvider}
            analysis={mediaAnalysis}
            onAnalysisComplete={onMediaAnalysisComplete}
            onClear={onClearMediaAnalysis}
          />
        </section>

        <section className="rounded-2xl border border-orange-200 bg-orange-50 p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-orange-500">
                Scene Description
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-orange-700">
                Short auto-fill by default for a fast U.S. wildlife / Facebook
                Reels setup. Edit anytime.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                  sceneDescriptionMode === "auto"
                    ? "bg-orange-600 text-white"
                    : "bg-white text-orange-700"
                }`}
              >
                {sceneDescriptionMode === "auto" ? "Auto Mode" : "Manual Mode"}
              </span>
              {sceneDescriptionMode === "manual" && sceneDescriptionTouched && (
                <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-gray-600">
                  Protected from overwrite
                </span>
              )}
            </div>
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="w-full rounded-xl border border-orange-200 bg-white/75 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-orange-700">
                    Action Style
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-orange-700">
                    Close-contact fight automatically unlocks Kling&apos;s faster clash path so you do not need to type trigger words by hand.
                  </p>
                </div>
                <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[10px] font-semibold text-orange-800">
                  {actionStyle}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {ACTION_STYLE_OPTIONS.map((style) => {
                  const isActive = actionStyle === style;
                  return (
                    <button
                      key={style}
                      type="button"
                      onClick={() => onActionStyleChange(style)}
                      className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                        isActive
                          ? "border-orange-700 bg-orange-700 text-white"
                          : "border-orange-200 bg-white text-orange-700 hover:bg-orange-100"
                      }`}
                    >
                      {style}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex overflow-hidden rounded-xl border border-orange-200 bg-white">
              {(["romanized", "english"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onSceneModeChange(mode)}
                  className={`px-3 py-2 text-xs font-semibold transition-all ${
                    sceneMode === mode
                      ? "bg-orange-600 text-white"
                      : "text-orange-600 hover:bg-orange-50"
                  }`}
                >
                  {mode === "romanized" ? "Nepali Romanized" : "Direct English"}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={onAutoFillSceneDescription}
              className="rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-100"
            >
              Auto Fill
            </button>
            <button
              type="button"
              onClick={onRegenerateSceneDescription}
              className="rounded-xl border border-orange-200 bg-orange-100 px-3 py-2 text-xs font-semibold text-orange-800 hover:bg-orange-200"
            >
              Regenerate
            </button>
            <button
              type="button"
              onClick={onAutoFillSceneDescription}
              className="rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Reset to Auto
            </button>
          </div>

          <textarea
            value={sceneDescription}
            onChange={(event) => onSceneDescriptionChange(event.target.value)}
            placeholder={
              sceneMode === "romanized"
                ? "jastei: bag le bakhra lai khedaera..."
                : "Write a short scene description in English..."
            }
            className="min-h-[120px] w-full resize-none rounded-xl border border-orange-200 bg-white p-3.5 text-sm text-gray-900 outline-none placeholder:text-gray-400"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] leading-relaxed text-orange-700">
            <span>
              {sceneDescriptionMode === "auto"
                ? "Auto mode updates with setup changes until you edit manually."
                : "Manual mode will not be overwritten. Blank is still allowed if you want no extra scene guidance."}
            </span>
            <span className="rounded-full bg-white px-2.5 py-1 font-semibold text-gray-600">
              {sceneDescription.trim().length === 0
                ? "Blank allowed"
                : `${sceneDescription.trim().length} chars`}
            </span>
          </div>
        </section>

        <section className={`rounded-2xl border p-5 sm:p-6 ${promptHealthColor}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] opacity-70">
                Prompt Health
              </h3>
              <p className="mt-1 text-xs leading-relaxed opacity-80">
                Check whether the current scene description is clean for Runway,
                Kling, or a balanced hybrid pass.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]">
                {promptHealth.label}
              </span>
              <span className="rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-semibold">
                {promptHealth.score}/100
              </span>
            </div>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl bg-white/70 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] opacity-70">
                Top issues
              </div>
              <div className="mt-2 space-y-1.5 text-[11px] leading-relaxed">
                {promptHealth.issues.slice(0, 3).map((issue) => (
                  <p key={issue}>• {issue}</p>
                ))}
              </div>
            </div>
            <div className="rounded-xl bg-white/70 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] opacity-70">
                Best fixes
              </div>
              <div className="mt-2 space-y-1.5 text-[11px] leading-relaxed">
                {promptHealth.fixes.slice(0, 3).map((fix) => (
                  <p key={fix}>• {fix}</p>
                ))}
              </div>
            </div>
          </div>

          {promptHealth.detectedRisks.length > 0 && (
            <div className="mt-3 rounded-xl bg-white/70 p-3 text-[11px] leading-relaxed">
              <span className="font-semibold">Detected risks:</span>{" "}
              {promptHealth.detectedRisks.join(" • ")}
            </div>
          )}

          <div className="mt-3 rounded-xl bg-white/70 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] opacity-70">
                Recommended mode
              </div>
              <span className="rounded-full border border-white/80 bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]">
                {promptHealth.recommendedMode}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {([
                "runway-safe",
                "kling-action",
                "universal",
              ] as const).map((mode) => {
                const isActive = activePromptMode === mode;
                const isRecommended = promptHealth.recommendedMode === mode;

                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPromptModeOverride(mode)}
                    className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] transition-all active:scale-[0.98] ${
                      isActive
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
                    }`}
                  >
                    {mode}
                    {isRecommended ? " • Recommended" : ""}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed opacity-80">
              These chips only change the local optimizer preview. They do not
              rewrite the generated package automatically.
            </p>
          </div>

          <div className="mt-3 rounded-xl bg-white/70 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] opacity-70">
              Engine-specific prompt optimizer
            </div>
            <p className="mt-1 text-xs font-semibold">{promptRecommendation.title}</p>
            <p className="mt-1 text-[11px] leading-relaxed opacity-80">
              {promptRecommendation.summary}
            </p>
            <div className="mt-3 rounded-xl border border-slate-700 bg-slate-900 p-3 text-[11px] font-medium leading-relaxed text-white shadow-sm">
              {promptRecommendation.prompt}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleApplyOptimizedPrompt}
                className="rounded-xl bg-gray-900 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-black active:scale-[0.98]"
              >
                Apply Optimized Prompt
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleCopyOptimizedPrompt();
                }}
                className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-800 shadow-sm hover:bg-gray-50 active:scale-[0.98]"
              >
                {optimizedPromptCopied ? "Copied" : "Copy Optimized Prompt"}
              </button>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed opacity-80">
              Apply replaces the current scene description. Copy only copies the preview.
            </p>
            <div className="mt-3 space-y-1 text-[11px] leading-relaxed opacity-85">
              {promptRecommendation.reasons.map((reason) => (
                <p key={reason}>• {reason}</p>
              ))}
            </div>
          </div>
        </section>

        <div className="rounded-[24px] border border-gray-200 bg-white p-4 shadow-sm shadow-gray-100/80 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">
                Current Setup
              </div>
              <div className="mt-1 text-sm font-semibold text-gray-900">
                {predator} vs {prey}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-600">
                  {arc}
                </span>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-500">
                  {weather}
                </span>
              </div>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                driftRisk === "HIGH"
                  ? "bg-red-100 text-red-700"
                  : driftRisk === "MEDIUM"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {driftRisk} drift
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-gray-200/80 pt-5 lg:col-span-2">
        <button
          type="button"
          onClick={onBack}
          className="rounded-2xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 shadow-sm shadow-gray-100/80 hover:bg-gray-50 active:scale-[0.98]"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="rounded-2xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-gray-300/70 hover:bg-black active:scale-[0.98]"
        >
          Continue → Generate
        </button>
      </div>
    </div>
  );
}
