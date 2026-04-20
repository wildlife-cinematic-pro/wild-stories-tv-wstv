"use client";

import { useEffect, useRef, useState } from "react";

import type {
  AIProvider,
  Arc,
  DepthMode,
  ContentLane,
  EmotionalTone,
  AnimalVibe,
  Weather,
  RealismMode,
  GeneratedPackage,
  MediaAnalysisResult,
  PredatorInfo,
  RunwayModel,
  KlingModel,
  PromptVersion,
  HabitatPreset,
} from "@/types";

import {
  appendPromptVersion,
  getNextVersionNumber,
  makePromptVersionKey,
} from "@/lib/versioning";
import { copyPolishResponseSchema } from "@/lib/schemas";
import {
  hasUsableGeneratedPackageEnhancements,
  type GeneratedPackageEnhancements,
} from "@/lib/generated-package";
import {
  buildGeneratedPackageDraft,
  finalizeGeneratedPackageDraft,
  type PublishFlowSummary,
} from "@/lib/build-package";

import {
  RUNWAY_MODELS,
  KLING_MODELS,
} from "@/lib/model-specs";
import {
  useBuildPreview,
  type DurationLaneMode,
  type HookMode,
  type MarketMode,
  type SceneDescriptionMode,
} from "@/hooks/use-build-preview";
import { useBuildPersistence } from "@/hooks/use-build-persistence";
import { useConceptVariantLab } from "@/hooks/use-concept-variant-lab";
import { useCustomAnimals } from "@/hooks/use-custom-animals";

import SettingsDrawer from "@/components/SettingsDrawer";
import WSTVWorkflowDiagram from "@/components/WSTVWorkflowDiagram";
import RunwayOfficialWorkflowDiagram from "@/components/RunwayOfficialWorkflowDiagram";
import CustomAnimalModal from "@/components/build/custom-animal-modal";
import Step1Setup from "@/components/build/step-1-setup";
import Step2EngineQuality from "@/components/build/step-2-engine-quality";
import Step3Generate from "@/components/build/step-3-generate";

type SafeMediaAnalysis = MediaAnalysisResult & {
  imagePromptInject?: string;
  image?: string;
  video?: string;
};

type Step = 1 | 2 | 3;
type TopTab = "build" | "workflows";
type WorkflowTab = "wstv" | "runway";

type QualityState = {
  realismMode: RealismMode;
  motionOnlyI2V: boolean;
  referenceLock: boolean;
  singleActionRule: boolean;
  microMotion: boolean;
  heroVeo: boolean;
};

// ─── DEFAULTS ────────────────────────────────────────────────────────────────

const DEFAULT_PREDATOR = "Mountain Lion";
const DEFAULT_PREY = "White-tailed Deer";
const DEFAULT_CONTENT_LANE: ContentLane = "Auto";
const DEFAULT_ARC: Arc = "Ambush attack";
const DEFAULT_WEATHER: Weather = "Golden Hour";
const DEFAULT_HABITAT: HabitatPreset = "Auto";
const DEFAULT_DEPTH_MODE: DepthMode = "Balanced Depth";
const DEFAULT_EMOTIONAL_TONE: EmotionalTone = "Raw Tension";
const DEFAULT_ANIMAL_VIBE: AnimalVibe = "National Geographic Wild";

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function Page() {
  // STEP 1
  const [predator, setPredator] = useState(DEFAULT_PREDATOR);
  const [prey, setPrey] = useState(DEFAULT_PREY);
  const [contentLane, setContentLane] = useState<ContentLane>(DEFAULT_CONTENT_LANE);
  const [arc, setArc] = useState<Arc>(DEFAULT_ARC);
  const [conceptArcOverride, setConceptArcOverride] = useState<Arc | null>(null);
  const [weather, setWeather] = useState<Weather>(DEFAULT_WEATHER);
  const [habitat, setHabitat] = useState<HabitatPreset>(DEFAULT_HABITAT);
  const [depthMode, setDepthMode] = useState<DepthMode>(DEFAULT_DEPTH_MODE);
  const [emotionalTone, setEmotionalTone] = useState<EmotionalTone>(DEFAULT_EMOTIONAL_TONE);
  const [animalVibe, setAnimalVibe] = useState<AnimalVibe>(DEFAULT_ANIMAL_VIBE);

  // STEP 2
  const [runwayModel, setRunwayModel] = useState<RunwayModel>(RUNWAY_MODELS[0]);
  const [klingModel, setKlingModel] = useState<KlingModel>(KLING_MODELS[0]);
  const [realismMode, setRealismMode] = useState<RealismMode>("Reference Locked");
  const [motionOnlyI2V, setMotionOnlyI2V] = useState(true);
  const [referenceLock, setReferenceLock] = useState(true);
  const [singleActionRule, setSingleActionRule] = useState(true);
  const [microMotion, setMicroMotion] = useState(true);
  const [heroVeo, setHeroVeo] = useState(false);
  const [autoApplyHighDrift, setAutoApplyHighDrift] = useState(false);
  const [lastQualityBeforeApply, setLastQualityBeforeApply] = useState<QualityState | null>(null);
  const [sceneDescription, setSceneDescription] = useState("");
  const [sceneDescriptionMode, setSceneDescriptionMode] = useState<SceneDescriptionMode>("auto");
  const [sceneDescriptionTouched, setSceneDescriptionTouched] = useState(false);
  const [sceneDescriptionVariant, setSceneDescriptionVariant] = useState(0);
  const [sceneMode, setSceneMode] = useState<"romanized" | "english">("english");
  const [mediaAnalysis, setMediaAnalysis] = useState<MediaAnalysisResult | null>(null);

  // STEP 3
  const [activeProvider, setActiveProvider] = useState<AIProvider>("none");
  const [pkg, setPkg] = useState<GeneratedPackage | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  // Navigation
  const [step, setStep] = useState<Step>(1);
  const [activeTab, setActiveTab] = useState<TopTab>("build");
  const [workflowTab, setWorkflowTab] = useState<WorkflowTab>("wstv");

  const [marketMode] = useState<MarketMode>("US_ONLY");
  const [durationLane, setDurationLane] = useState<DurationLaneMode>("short");
  const [hookMode, setHookMode] = useState<HookMode>("all");
  const [fastPublishMode, setFastPublishMode] = useState(true);
  const [strictOriginalityGuard, setStrictOriginalityGuard] = useState(true);
  const [publishFlowSummary, setPublishFlowSummary] = useState<PublishFlowSummary | null>(null);

  function handleResetDefaults() {
    setPredator(DEFAULT_PREDATOR);
    setPrey(DEFAULT_PREY);
    setContentLane(DEFAULT_CONTENT_LANE);
    setArc(DEFAULT_ARC);
    setConceptArcOverride(null);
    setWeather(DEFAULT_WEATHER);
    setHabitat(DEFAULT_HABITAT);
    setDepthMode(DEFAULT_DEPTH_MODE);
    setEmotionalTone(DEFAULT_EMOTIONAL_TONE);
    setAnimalVibe(DEFAULT_ANIMAL_VIBE);
  }

  useBuildPersistence({
    predator,
    prey,
    arc,
    contentLane,
    weather,
    depthMode,
    habitat,
    activeProvider,
    runwayModel,
    klingModel,
    realismMode,
    motionOnlyI2V,
    referenceLock,
    singleActionRule,
    microMotion,
    heroVeo,
    autoApplyHighDrift,
    setPredator,
    setPrey,
    setArc,
    setContentLane,
    setWeather,
    setDepthMode,
    setHabitat,
    setActiveProvider,
    setRunwayModel,
    setKlingModel,
    setRealismMode,
    setMotionOnlyI2V,
    setReferenceLock,
    setSingleActionRule,
    setMicroMotion,
    setHeroVeo,
    setAutoApplyHighDrift,
  });

  const {
    customPredators,
    customModalOpen,
    customForm,
    predatorOptions,
    setCustomModalOpen,
    setCustomForm,
    openCustomAnimalModal,
    saveCustomAnimal,
    deleteCustomAnimal,
  } = useCustomAnimals({
    currentPredator: predator,
    defaultPrey: DEFAULT_PREY,
    defaultHabitat: DEFAULT_HABITAT,
    onSelectCustomAnimal: (selection) => {
      setPredator(selection.predator);
      setPrey(selection.prey);
      setArc(selection.arc);
      setHabitat(selection.habitat);
    },
    onResetDefaults: handleResetDefaults,
  });

  const {
    preset,
    preyOptions: previewPreyOptions,
    finalEnvironment,
    previewArc,
    selectedPipelineStyle,
    previewHook2026,
    previewPrimaryHook,
    previewShortCaption,
    previewLongCaption,
    previewHashtags,
    previewTags,
    previewRecommendedHookIndex,
    previewOpeningFrameInput,
    previewOpeningFrameScore,
    previewPublishGuardReport,
    previewPerformanceSnapshot,
    previewAudienceScore,
    previewHookFamily,
    qualityReco,
    applyAutoSceneDescription,
    handleSceneDescriptionChange,
    handleSceneDescriptionRegenerate,
  } = useBuildPreview({
    predator,
    prey,
    arc,
    arcOverride: conceptArcOverride,
    contentLane,
    habitat,
    weather,
    depthMode,
    customPredators,
    mediaAnalysis,
    sceneDescriptionMode,
    sceneDescriptionTouched,
    sceneDescriptionVariant,
    durationLane,
    marketMode,
    hookMode,
    fastPublishMode,
    strictOriginalityGuard,
    realismMode,
    runwayModel,
    klingModel,
    motionOnlyI2V,
    referenceLock,
    singleActionRule,
    microMotion,
    heroVeo,
    setPrey,
    setArc,
    setWeather,
    setDepthMode,
    setSceneDescription,
    setSceneDescriptionMode,
    setSceneDescriptionTouched,
    setSceneDescriptionVariant,
  });

  useEffect(() => {
    setConceptArcOverride(null);
  }, [predator, prey, contentLane]);

  const {
    variants: conceptVariants,
    winners: conceptVariantWinners,
    activeVariantId: activeConceptVariantId,
    promoteVariant: promoteConceptVariant,
  } = useConceptVariantLab({
    predator,
    prey,
    contentLane,
    currentArc: previewArc,
    currentHabitat: habitat,
    presetEnvironment: preset.environment,
    presetPrey: preset.prey,
    driftRisk: preset.driftRisk,
    weather,
    depthMode,
    durationLane,
    fastPublishMode,
    strictOriginalityGuard,
    realismMode,
    runwayModel,
    klingModel,
    motionOnlyI2V,
    referenceLock,
    singleActionRule,
    microMotion,
    heroVeo,
    currentHookFamily: previewHookFamily,
    setArc,
    setArcOverride: setConceptArcOverride,
    setHabitat,
    setDurationLane,
    setFastPublishMode,
    setHookMode,
    setSceneDescription,
    setSceneDescriptionMode,
    setSceneDescriptionTouched,
    setSceneDescriptionVariant,
  });

  function captureCurrentQuality(): QualityState {
    return { realismMode, motionOnlyI2V, referenceLock, singleActionRule, microMotion, heroVeo };
  }
  function applyQualityState(s: QualityState) {
    setRealismMode(s.realismMode); setMotionOnlyI2V(s.motionOnlyI2V);
    setReferenceLock(s.referenceLock); setSingleActionRule(s.singleActionRule);
    setMicroMotion(s.microMotion); setHeroVeo(s.heroVeo);
  }
  function applyRecommendedQuality() {
    setLastQualityBeforeApply(captureCurrentQuality());
    const r = qualityReco.recommended;
    if (r.realismMode) setRealismMode(r.realismMode);
    if (r.durationLane) setDurationLane(r.durationLane);
    if (typeof r.motionOnlyI2V === "boolean") setMotionOnlyI2V(r.motionOnlyI2V);
    if (typeof r.referenceLock === "boolean") setReferenceLock(r.referenceLock);
    if (typeof r.singleActionRule === "boolean") setSingleActionRule(r.singleActionRule);
    if (typeof r.microMotion === "boolean") setMicroMotion(r.microMotion);
    if (typeof r.heroVeo === "boolean") setHeroVeo(r.heroVeo);
  }
  function undoRecommendedQuality() {
    if (!lastQualityBeforeApply) return;
    applyQualityState(lastQualityBeforeApply);
    setLastQualityBeforeApply(null);
  }

  const lastAutoAppliedKeyRef = useRef<string>("");
  useEffect(() => {
    if (!autoApplyHighDrift) return;
    if (qualityReco.level !== "HIGH") return;
    const key = [predator, prey, String(arc), preset.driftRisk, runwayModel, klingModel].join("|");
    if (lastAutoAppliedKeyRef.current === key) return;
    lastAutoAppliedKeyRef.current = key;
    applyRecommendedQuality();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoApplyHighDrift, qualityReco.level, predator, prey, arc, preset.driftRisk, runwayModel, klingModel]);

  async function handleGenerate() {
    setIsGenerating(true);
    setError("");
    setPkg(null);
    setPublishFlowSummary(null);
    try {
      if (!predator || !prey) throw new Error("Missing predator or prey");
      const safeMedia = (mediaAnalysis ?? null) as SafeMediaAnalysis | null;
      const sceneInjectFromMedia = safeMedia?.imagePromptInject ?? "";
      const sceneInjectFromUser = sceneDescription.trim();
      const sceneInject = sceneInjectFromUser.length > 0 ? sceneInjectFromUser : sceneInjectFromMedia;
      const quality = { realismMode, motionOnlyI2V, referenceLock, singleActionRule, microMotion, heroVeo };
      const draft = buildGeneratedPackageDraft({
        predator,
        prey,
        presetLighting: preset.lighting,
        presetCameraGear: preset.cameraGear,
        presetTexture: preset.texture,
        presetDriftRisk: preset.driftRisk,
        presetForIdeas: { ...preset, environment: finalEnvironment } as PredatorInfo,
        finalEnvironment,
        finalArc: previewArc,
        contentLane,
        weather,
        depthMode,
        emotionalTone,
        animalVibe,
        runwayModel,
        klingModel,
        durationLane,
        marketMode,
        fastPublishMode,
        strictOriginalityGuard,
        selectedPipelineStyle,
        sceneInject,
        quality,
        finalHook2026: previewHook2026,
        finalHook: previewPrimaryHook || previewHook2026[0] || "",
        shortCaption: previewShortCaption,
        longCaption: previewLongCaption,
        hashtags: previewHashtags,
        tags: previewTags,
        recommendedHookIndex: previewRecommendedHookIndex,
        hookFamily: previewHookFamily,
        usAudienceScore: previewAudienceScore,
        openingFrameInput: previewOpeningFrameInput,
        openingFrameScore: previewOpeningFrameScore,
        performanceSnapshot: previewPerformanceSnapshot,
      });

      let enhanced: GeneratedPackageEnhancements = {};
      if (activeProvider !== "none") {
        const res = await fetch("/api/enhance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider: activeProvider,
            predator,
            prey,
            env: finalEnvironment,
            arc: previewArc,
            weather,
            emotionalTone,
            animalVibe,
            base: {
              imagePrompt: draft.basePkg.imagePrompt,
              hook: draft.basePkg.hook,
              caption: draft.basePkg.caption ?? "",
              voiceoverLine: draft.basePkg.voiceoverLine,
            },
          }),
        });
        const data = await res.json().catch(() => ({} as unknown));
        if (!res.ok) throw new Error(((data as Record<string, unknown>)?.error as string) || `AI polish failed (${res.status})`);
        const parsedEnhanced = copyPolishResponseSchema.safeParse(data);
        if (!parsedEnhanced.success) throw new Error("Invalid AI polish response");
        enhanced = {
          ...(parsedEnhanced.data.imagePrompt ? { imagePrompt: parsedEnhanced.data.imagePrompt } : {}),
          ...(parsedEnhanced.data.hook ? { hook: parsedEnhanced.data.hook } : {}),
          ...(parsedEnhanced.data.caption ? { caption: parsedEnhanced.data.caption } : {}),
          ...(parsedEnhanced.data.voiceoverLine ? { voiceoverLine: parsedEnhanced.data.voiceoverLine } : {}),
          aiEnhanced: true,
        };
        if (!hasUsableGeneratedPackageEnhancements(enhanced)) throw new Error("AI polish returned no usable prompt or copy updates");
      }

      const { finalPkg, publishFlowSummary } = finalizeGeneratedPackageDraft(
        draft,
        enhanced
      );

      setPkg(finalPkg);
      setPublishFlowSummary(publishFlowSummary);

      try {
        const key = makePromptVersionKey(
          finalPkg.predatorName ?? predator,
          finalPkg.preyName ?? prey,
          String(finalPkg.arcName ?? arc)
        );
        const v: PromptVersion = {
          version: getNextVersionNumber(key),
          timestamp: new Date().toISOString(),
          imagePrompt: finalPkg.imagePrompt,
          hook: finalPkg.hook ?? "",
          caption: finalPkg.caption ?? "",
          voiceoverLine: finalPkg.voiceoverLine ?? "",
          label: `GENERATE • ${activeProvider === "none" ? "Local" : activeProvider} • ${predator} vs ${prey} • ${String(previewArc ?? arc)}`,
          performanceNote: "",
        };
        appendPromptVersion(key, v);
      } catch { /* ignore */ }

      setStep(3);
    } catch (e) {
      console.error("[generate error]", e);
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleRestoreVersion(version: PromptVersion) {
    setPkg((prev) => {
      if (!prev) return prev;

      const restored: GeneratedPackage = {
        ...prev,
        imagePrompt: version.imagePrompt,
        hook: version.hook,
        caption: version.caption,
        voiceoverLine: version.voiceoverLine ?? prev.voiceoverLine,
      };

      try {
        const key = makePromptVersionKey(
          restored.predatorName ?? predator,
          restored.preyName ?? prey,
          String(restored.arcName ?? arc)
        );
        appendPromptVersion(key, {
          version: getNextVersionNumber(key),
          timestamp: new Date().toISOString(),
          imagePrompt: restored.imagePrompt,
          hook: restored.hook ?? "",
          caption: restored.caption ?? "",
          voiceoverLine: restored.voiceoverLine ?? "",
          label: `RESTORE v${version.version} • ${predator} vs ${prey}`,
          performanceNote: "",
        });
      } catch {
        // ignore
      }

      return restored;
    });
  }

  const qualityPanelProps = {
    realismMode,
    setRealismMode,
    motionOnlyI2V,
    setMotionOnlyI2V,
    referenceLock,
    setReferenceLock,
    singleActionRule,
    setSingleActionRule,
    microMotion,
    setMicroMotion,
    heroVeo,
    setHeroVeo,
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen w-full bg-gray-50">

      {/* ── APP HEADER — dark cinematic anchor ─────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-gray-950/95 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-[var(--main-max-width)] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3 py-3 sm:min-h-[56px] sm:flex-nowrap">

            {/* Brand */}
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/10 ring-1 ring-white/[0.12]">
                <span className="text-[11px] font-bold text-white">W</span>
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="truncate text-sm font-bold tracking-tight text-white sm:text-[15px]">WILD STORIES TV</span>
                  <span className="hidden text-[10px] font-medium text-white/35 sm:inline">WSTV Production Studio</span>
                </div>
                <div className="mt-0.5 text-[10px] font-medium text-white/30 sm:hidden">Production Studio</div>
              </div>
            </div>

            {/* Top-level tab switcher — compact segmented control */}
            <div className="order-3 flex w-full justify-start sm:order-2 sm:flex-1 sm:justify-center">
              <nav className="inline-flex items-center rounded-2xl border border-white/[0.08] bg-white/[0.04] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                {([
                  { id: "build" as TopTab, label: "Build", icon: "⚡" },
                  { id: "workflows" as TopTab, label: "Workflows", icon: "⬡" },
                ]).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`group flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold tracking-[0.01em] transition-all ${
                      activeTab === tab.id
                        ? "border-white/15 bg-white text-gray-950 shadow-sm"
                        : "border-transparent text-white/50 hover:bg-white/[0.06] hover:text-white/80"
                    }`}
                  >
                    <span
                      className={`grid h-5 w-5 place-items-center rounded-full text-[11px] transition-all ${
                        activeTab === tab.id
                          ? "bg-gray-900/10 text-gray-900"
                          : "bg-white/[0.06] text-white/70 group-hover:bg-white/[0.1] group-hover:text-white"
                      }`}
                    >
                      {tab.icon}
                    </span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="shrink-0 sm:order-3">
              <SettingsDrawer />
            </div>
          </div>

          {activeTab === "build" && (
            <div className="border-t border-white/[0.06] pb-3 pt-2">
              <div className="overflow-hidden rounded-[24px] border border-gray-200/80 bg-gradient-to-b from-gray-100 via-white to-gray-50/95 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                <div className="flex items-center gap-2 overflow-x-auto px-2 py-2.5 sm:px-3">
                  {([
                    { step: 1 as Step, label: "Wildlife Setup" },
                    { step: 2 as Step, label: "Engine & Quality" },
                    { step: 3 as Step, label: "Generate" },
                  ]).map((s, i) => (
                    <div key={s.step} className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setStep(s.step)}
                        className={`flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-left text-xs font-semibold transition-all active:scale-[0.98] ${
                          step === s.step
                            ? "border-gray-900 bg-gray-900 text-white shadow-sm"
                            : step > s.step
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "border-transparent bg-transparent text-gray-400 hover:border-gray-200 hover:bg-gray-50 hover:text-gray-700"
                        }`}
                      >
                        <span
                          className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${
                            step === s.step
                              ? "bg-white/15 text-white"
                              : step > s.step
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {step > s.step ? "✓" : s.step}
                        </span>
                        <span className="flex flex-col items-start leading-none">
                          <span className={`text-[9px] uppercase tracking-[0.14em] ${
                            step === s.step ? "text-white/55" : step > s.step ? "text-emerald-500" : "text-gray-400"
                          }`}>
                            Step {s.step}
                          </span>
                          <span>{s.label}</span>
                        </span>
                      </button>
                      {i < 2 && (
                        <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-300">
                          ›
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          BUILD TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "build" && (
        <>
          {/* Page content */}
          <div className="mx-auto w-full max-w-[var(--main-max-width)] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

            {step === 1 && (
              <Step1Setup
                predator={predator}
                prey={prey}
                contentLane={contentLane}
                arc={arc}
                weather={weather}
                depthMode={depthMode}
                habitat={habitat}
                emotionalTone={emotionalTone}
                animalVibe={animalVibe}
                predatorOptions={predatorOptions}
                preyOptions={previewPreyOptions}
                customPredatorCount={customPredators.length}
                finalEnvironment={finalEnvironment}
                driftRisk={preset.driftRisk}
                onPredatorChange={setPredator}
                onPreyChange={setPrey}
                onContentLaneChange={setContentLane}
                onWeatherChange={setWeather}
                onDepthModeChange={setDepthMode}
                onHabitatChange={setHabitat}
                onEmotionalToneChange={setEmotionalTone}
                onAnimalVibeChange={setAnimalVibe}
                onResetDefaults={handleResetDefaults}
                onContinue={() => setStep(2)}
                onOpenCustomAnimal={() =>
                  openCustomAnimalModal({
                    defaultArc: arc,
                    driftRisk: preset.driftRisk,
                  })
                }
              />
            )}

            {step === 2 && (
              <Step2EngineQuality
                qualityReco={qualityReco}
                autoApplyHighDrift={autoApplyHighDrift}
                hasUndoQuality={Boolean(lastQualityBeforeApply)}
                onToggleAutoApplyHighDrift={() =>
                  setAutoApplyHighDrift((value) => !value)
                }
                onUndoRecommendedQuality={undoRecommendedQuality}
                onApplyRecommendedQuality={applyRecommendedQuality}
                marketMode={marketMode}
                durationLane={durationLane}
                hookMode={hookMode}
                fastPublishMode={fastPublishMode}
                strictOriginalityGuard={strictOriginalityGuard}
                previewAudienceScore={previewAudienceScore}
                previewOpeningFrameScore={previewOpeningFrameScore}
                previewPublishGuardReport={previewPublishGuardReport}
                runwayModel={runwayModel}
                klingModel={klingModel}
                onRunwayModelChange={setRunwayModel}
                onKlingModelChange={setKlingModel}
                qualityPanelProps={qualityPanelProps}
                activeProvider={activeProvider}
                mediaAnalysis={mediaAnalysis}
                onMediaAnalysisComplete={setMediaAnalysis}
                onClearMediaAnalysis={() => setMediaAnalysis(null)}
                sceneDescription={sceneDescription}
                sceneDescriptionMode={sceneDescriptionMode}
                sceneDescriptionTouched={sceneDescriptionTouched}
                sceneMode={sceneMode}
                onSceneModeChange={setSceneMode}
                onAutoFillSceneDescription={() => applyAutoSceneDescription(0)}
                onRegenerateSceneDescription={handleSceneDescriptionRegenerate}
                onSceneDescriptionChange={handleSceneDescriptionChange}
                predator={predator}
                prey={prey}
                arc={arc}
                weather={weather}
                driftRisk={preset.driftRisk}
                onDurationLaneChange={setDurationLane}
                onHookModeChange={setHookMode}
                onToggleFastPublishMode={() => setFastPublishMode((value) => !value)}
                onToggleStrictOriginalityGuard={() =>
                  setStrictOriginalityGuard((value) => !value)
                }
                onBack={() => setStep(1)}
                onContinue={() => setStep(3)}
              />
            )}

            {step === 3 && (
              <Step3Generate
                predator={predator}
                prey={prey}
                contentLane={contentLane}
                activeProvider={activeProvider}
                onActiveProviderChange={setActiveProvider}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
                error={error}
                pkg={pkg}
                publishFlowSummary={publishFlowSummary}
                conceptVariants={conceptVariants}
                conceptVariantWinners={conceptVariantWinners}
                activeConceptVariantId={activeConceptVariantId}
                onPromoteConceptVariant={promoteConceptVariant}
                onRestoreVersion={handleRestoreVersion}
                onBack={() => setStep(2)}
              />
            )}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          WORKFLOWS TAB — scoped dark zone
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "workflows" && (
        <div className="min-h-[calc(100vh-56px)] bg-gray-950">
          <div className="w-full px-4 py-8 sm:px-6 sm:py-10 lg:px-8 xl:px-10 2xl:px-12">

            {/* Workflow tab selector */}
            <div className="mb-7 space-y-3">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-2xl">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/30">Workflow Viewer</div>
                  <div className="mt-1 text-sm text-white/50">Switch between the primary hybrid 4-shot production workflow view and the optional Runway-native reference handoff view.</div>
                </div>
                <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                  <div className="flex flex-wrap gap-1.5">
                    {([
                      {
                        id: "wstv" as WorkflowTab,
                        label: "WSTV Custom Workflow",
                        badge: "Primary",
                        icon: "◈",
                        description: "Production continuity map",
                      },
                      {
                        id: "runway" as WorkflowTab,
                        label: "Runway Official Workflow",
                        badge: "Optional reference",
                        icon: "↗",
                        description: "Native safe-handoff reference",
                      },
                    ]).map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setWorkflowTab(tab.id)}
                        className={`group flex min-w-[240px] items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-all ${
                          workflowTab === tab.id
                            ? "border-white/15 bg-white/[0.96] text-gray-900 shadow-[0_1px_3px_rgba(15,23,42,0.2)]"
                            : "border-transparent text-white/45 hover:border-white/[0.08] hover:bg-white/[0.04] hover:text-white/75"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`grid h-8 w-8 place-items-center rounded-2xl text-sm ${
                              workflowTab === tab.id
                                ? "bg-gray-900/10 text-gray-900"
                                : "bg-white/[0.06] text-white/70 group-hover:bg-white/[0.1] group-hover:text-white"
                            }`}
                          >
                            {tab.icon}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold">{tab.label}</span>
                            <span className={`mt-0.5 block text-[11px] ${
                              workflowTab === tab.id ? "text-gray-500" : "text-white/35 group-hover:text-white/45"
                            }`}>
                              {tab.description}
                            </span>
                          </span>
                        </div>
                        <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                          workflowTab === tab.id
                            ? tab.id === "wstv" ? "bg-violet-100 text-violet-700" : "bg-green-100 text-green-700"
                            : "bg-white/[0.06] text-white/35"
                        }`}>
                          {tab.badge}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-xs text-white/25">
                Interactive viewer with drag, zoom, and inspectable continuity wires. The primary runtime lane is the hybrid 4-shot workflow.
              </div>
            </div>

            {/* Diagram frame */}
            <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-gray-900">
              <div className="border-b border-white/[0.08] px-5 py-4 sm:px-6">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-red-500/60" />
                    <div className="h-2 w-2 rounded-full bg-yellow-500/60" />
                    <div className="h-2 w-2 rounded-full bg-green-500/60" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-300">
                      {workflowTab === "wstv"
                        ? "WSTV · 4-shot production workflow · hybrid primary lane"
                        : "Runway Official · 4-shot safe handoff · Gen-4.5 native"}
                    </div>
                    <div className="mt-0.5 text-[11px] text-gray-500">
                      {workflowTab === "wstv"
                        ? "Production-oriented continuity viewer for the hybrid 4-shot path, with Canonical Anchor, preferred Extract Frame handoff, and Last Frame fallback."
                        : "Optional reference viewer for the Runway-native safe-handoff pattern, manual overrides, and stitched final assembly."}
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-3 sm:p-4 lg:p-5">
                {workflowTab === "wstv" ? <WSTVWorkflowDiagram /> : <RunwayOfficialWorkflowDiagram />}
              </div>
            </div>
          </div>
        </div>
      )}

      <CustomAnimalModal
        open={customModalOpen}
        form={customForm}
        onClose={() => setCustomModalOpen(false)}
        onNameChange={(value) =>
          setCustomForm((prev) => ({ ...prev, name: value }))
        }
        onPreyChange={(value) =>
          setCustomForm((prev) => ({ ...prev, prey: value }))
        }
        onEnvironmentChange={(value) =>
          setCustomForm((prev) => ({ ...prev, environment: value }))
        }
        onDefaultArcChange={(value) =>
          setCustomForm((prev) => ({ ...prev, defaultArc: value }))
        }
        onDriftRiskChange={(value) =>
          setCustomForm((prev) => ({ ...prev, driftRisk: value }))
        }
        onSave={saveCustomAnimal}
        onDelete={deleteCustomAnimal}
      />
    </main>
  );
}
