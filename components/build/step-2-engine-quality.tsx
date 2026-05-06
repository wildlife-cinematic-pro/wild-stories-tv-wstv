"use client";

import { useState } from "react";

import MediaAnalyzer from "@/components/MediaAnalyzer";
import QualityPanel, { type QualityPanelProps } from "@/components/QualityPanel";
import { FeaturedModelCard, ModelCard } from "@/components/build/model-cards";

import { KLING_MODELS, RUNWAY_MODELS } from "@/lib/model-specs";
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
} from "@/types";

const ACTION_STYLE_OPTIONS: ActionStylePreset[] = [
  "Natural tension",
  "Viral chase",
  "Close-contact fight",
  "Ambush burst",
  "Forced retreat",
];

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
  onRunwayModelChange: (model: RunwayModel) => void;
  onKlingModelChange: (model: KlingModel) => void;
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
  onRunwayModelChange,
  onKlingModelChange,
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
              prompts auto-adapt per model
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

          <div className="mb-4 rounded-2xl border border-gray-100 bg-gray-50 px-3.5 py-2.5 text-[11px] font-medium leading-relaxed text-gray-500">
            Hybrid uses both engines below: choose the Runway model for Shot 1 and
            Shot 4, and the Kling model for Shot 2 and Shot 3. Seedance remains
            available in the generated package as an optional full-bundle route.
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="mb-1 flex items-center gap-2">
                <div className="h-[2px] w-8 rounded-full bg-green-400" />
                <span className="rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-semibold text-green-700">
                  RUNWAY · HYBRID
                </span>
              </div>
              {RUNWAY_MODELS.map((model) => (
                <ModelCard
                  key={model}
                  tone="green"
                  tag="RUNWAY"
                  active={runwayModel === model}
                  title={model}
                  subtitle={
                    model === "Gen-4.5"
                      ? "Best realism, strongest first-frame readability"
                      : model === "Gen-4 Turbo"
                        ? "Fast draft for quick readable opening tests"
                        : "Stable cinematic shots with clear openings"
                  }
                  activeLabel="✓ Used in hybrid"
                  onClick={() => onRunwayModelChange(model)}
                />
              ))}
            </div>
            <div className="space-y-2">
              <div className="mb-1 flex items-center gap-2">
                <div className="h-[2px] w-8 rounded-full bg-blue-400" />
                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-semibold text-blue-700">
                  KLING · HYBRID
                </span>
              </div>
              {KLING_MODELS.map((model) => (
                <ModelCard
                  key={model}
                  tone="blue"
                  tag="KLING"
                  active={klingModel === model}
                  title={model}
                  subtitle={
                    model === "Kling 3.0 Pro"
                      ? "Strong action workflow, best readable openings"
                      : model === "Kling 3.0 Standard"
                        ? "Balanced action with clear subject spacing"
                        : model === "Kling 2.6 Pro"
                          ? "Earlier option for simpler readable action"
                          : model === "Kling 2.5 Turbo Pro"
                            ? "Fast draft for one clean action beat"
                            : "Fast I2V draft option for rough motion tests"
                  }
                  activeLabel="✓ Used in hybrid"
                  onClick={() => onKlingModelChange(model)}
                />
              ))}
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
              Nano Banana 2 — Gemini image master prompt
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
                  @hero_predator
                </code>
              </div>
              <div>
                Opposing animal →{" "}
                <code className="rounded bg-white px-1 py-0.5 text-violet-800">
                  @hero_prey
                </code>
              </div>
              <div>
                Environment plate →{" "}
                <code className="rounded bg-white px-1 py-0.5 text-violet-800">
                  @env_plate
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
