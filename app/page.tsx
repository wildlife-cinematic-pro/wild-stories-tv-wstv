"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildSoundDesignPack,
  getAnimalBehavior,
  buildCapCutScript,
  shouldBuildTwoPartViralPreset,
  buildTwoPartViralPreset,
} from "@/lib/workflow-packs";

import type {
  AIProvider,
  Arc,
  DepthMode,
  EmotionalTone,
  AnimalVibe,
  Weather,
  RealismMode,
  GeneratedPackage,
  MediaAnalysisResult,
  PredatorInfo,
  RunwayModel,
  KlingModel,
  CustomPredatorForm,
  PromptVersion,
  ImagePromptTarget,
  HabitatPreset,
} from "@/types";

import {
  appendPromptVersion,
  getNextVersionNumber,
  makePromptVersionKey,
} from "@/lib/versioning";
import { enhanceResponseSchema } from "@/lib/schemas";
import {
  hasUsableGeneratedPackageEnhancements,
  mergeGeneratedPackage,
  type GeneratedPackageEnhancements,
} from "@/lib/generated-package";

import { getQualityRecommendations } from "@/lib/recommendations";

import {
  predatorData,
  suggestArc,
  emotionalTones,
  animalVibes,
  buildFiveShotCinematic,
  buildFiveShotViral,
  buildWatchTimeReport,
  suggestHabitat,
} from "@/lib/predator-data";

import {
  arcs,
  weatherOptions,
  habitatOptions,
  depthModes,
  arcMotionStrength,
  RUNWAY_MODELS,
  KLING_MODELS,
} from "@/lib/model-specs";

import {
  buildImagePrompt,
  buildSeedanceShots,
  buildShotImagePlan,
  buildRunwayShots,
  buildKlingShots,
  buildKlingNative15s,
  buildKlingSixShot,
  buildNegativePrompt,
  buildThumbnailPrompt,
  buildVoiceoverLine,
  buildCapCutPlan,
  buildClipChaining,
  build10Ideas,
  buildQualitySummary,
  buildReferenceWorkflow,
  buildNaturalismChecklist,
} from "@/lib/prompt-builders";

import {
  build2026Hook,
  build2026Caption,
  buildCTA,
  buildHashtags,
  buildPlatformPack,
  buildSEOTitle,
  buildAltTextPrompt,
  getRecommendedHookIndex,
} from "@/lib/platform-packs";

import {
  readSettings,
  writeSettings,
  readCustomPredators,
  writeCustomPredators,
  readShareState,
  writeShareState,
} from "@/lib/storage";
import { habitatPromptMap } from "@/lib/habitat-presets";

import QualityPanel from "@/components/QualityPanel";
import OutputCards from "@/components/OutputCards";
import MediaAnalyzer from "@/components/MediaAnalyzer";
import SettingsDrawer from "@/components/SettingsDrawer";
import WSTVWorkflowDiagram from "@/components/WSTVWorkflowDiagram";
import RunwayOfficialWorkflowDiagram from "@/components/RunwayOfficialWorkflowDiagram";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type SafeMediaAnalysis = MediaAnalysisResult & {
  imagePromptInject?: string;
  image?: string;
  video?: string;
};

type DriftRisk = PredatorInfo["driftRisk"];

type NormalizedPreset = {
  prey: string[];
  environment: string;
  lighting: string;
  cameraGear: string;
  texture: string;
  defaultArc: string;
  driftRisk: DriftRisk;
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
const DEFAULT_ARC: Arc = "Ambush attack";
const DEFAULT_WEATHER: Weather = "Golden Hour";
const DEFAULT_HABITAT: HabitatPreset = "Auto";
const DEFAULT_DEPTH_MODE: DepthMode = "Balanced Depth";
const DEFAULT_EMOTIONAL_TONE: EmotionalTone = "Raw Tension";
const DEFAULT_ANIMAL_VIBE: AnimalVibe = "National Geographic Wild";

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function toDriftRisk(v: unknown): DriftRisk {
  if (v === "LOW" || v === "MEDIUM" || v === "HIGH") return v;
  if (typeof v === "number" && Number.isFinite(v)) {
    if (v < 0.34) return "LOW";
    if (v < 0.67) return "MEDIUM";
    return "HIGH";
  }
  return "MEDIUM";
}

function normalizePreset(input: unknown, fallback: NormalizedPreset): NormalizedPreset {
  const obj = (input ?? {}) as Record<string, unknown>;
  const prey =
    Array.isArray(obj.prey) && obj.prey.every((x) => typeof x === "string")
      ? (obj.prey as string[])
      : fallback.prey;
  const environment = typeof obj.environment === "string" ? obj.environment : fallback.environment;
  const lighting = typeof obj.lighting === "string" ? obj.lighting : fallback.lighting;
  const cameraGear = typeof obj.cameraGear === "string" ? obj.cameraGear : fallback.cameraGear;
  const texture = typeof obj.texture === "string" ? obj.texture : fallback.texture;
  const defaultArc = typeof obj.defaultArc === "string" ? obj.defaultArc : fallback.defaultArc;
  const driftRisk = toDriftRisk(obj.driftRisk);
  return {
    prey: prey.length ? prey : fallback.prey,
    environment, lighting, cameraGear, texture, defaultArc, driftRisk,
  };
}

function normalizeWeatherSuggestion(value: string | undefined): Weather | null {
  if (!value) return null;
  if ((weatherOptions as readonly string[]).includes(value)) return value as Weather;
  const normalized = value.toLowerCase();
  if (normalized.includes("golden") || normalized.includes("sunset")) return "Golden Hour";
  if (normalized.includes("overcast") || normalized.includes("cloud")) return "Overcast";
  if (normalized.includes("storm") || normalized.includes("rain") || normalized.includes("thunder")) return "Storm";
  if (normalized.includes("dawn") || normalized.includes("sunrise")) return "Dawn";
  if (normalized.includes("midday") || normalized.includes("noon") || normalized.includes("heat")) return "Midday Heat";
  if (normalized.includes("blizzard") || normalized.includes("whiteout")) return "Winter Blizzard";
  if (normalized.includes("frozen dusk") || normalized.includes("blue hour")) return "Frozen Dusk";
  if (normalized.includes("snow") || normalized.includes("winter")) return "Winter Blizzard";
  return null;
}

function normalizeDepthSuggestion(value: string | undefined): DepthMode | null {
  if (!value) return null;
  if ((depthModes as readonly string[]).includes(value)) return value as DepthMode;
  const normalized = value.toLowerCase();
  if (normalized.includes("cinematic blur") || normalized.includes("shallow")) return "Cinematic Blur";
  if (normalized.includes("balanced")) return "Balanced Depth";
  if (normalized.includes("deep focus") || normalized.includes("detailed") || normalized.includes("deep")) return "Detailed Background";
  return null;
}

function normalizeArcSuggestion(value: string | undefined): Arc | null {
  if (!value) return null;
  if ((arcs as readonly string[]).includes(value)) return value as Arc;
  const normalized = value.toLowerCase();
  if (normalized.includes("ambush")) return "Ambush attack";
  if (normalized.includes("pack")) return "Pack hunting strategy";
  if (normalized.includes("escape")) return "Escape from danger";
  if (normalized.includes("territory") || normalized.includes("dominance")) return "Territory dominance battle";
  if (normalized.includes("predator") && normalized.includes("fight")) return "Predator vs predator fight";
  if (normalized.includes("standoff") || normalized.includes("stands ground") || normalized.includes("defender")) return "Defender stands ground";
  if (normalized.includes("giant") || normalized.includes("clash")) return "Giant vs giant clash";
  if (normalized.includes("chase") || normalized.includes("takedown")) return "Chase and takedown";
  return null;
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function ModelCard({
  active, tag, title, subtitle, onClick, tone,
}: {
  active: boolean; tag: string; title: string; subtitle: string; onClick: () => void; tone: "green" | "blue";
}) {
  const isGreen = tone === "green";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border p-3 text-left transition-all active:scale-[0.99] ${
        active
          ? isGreen ? "border-green-400 bg-green-50" : "border-blue-400 bg-blue-50"
          : "border-gray-200 bg-white hover:bg-gray-50"
      }`}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold ${isGreen ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
          {tag}
        </span>
        {active && (
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold ${isGreen ? "bg-green-600 text-white" : "bg-blue-600 text-white"}`}>
            ✓ Selected
          </span>
        )}
      </div>
      <div className="text-sm font-bold text-gray-900">{title}</div>
      <div className="mt-0.5 text-xs leading-relaxed text-gray-500">{subtitle}</div>
    </button>
  );
}

function FeaturedModelCard({
  active,
  tag,
  title,
  subtitle,
  note,
  onClick,
}: {
  active: boolean;
  tag: string;
  title: string;
  subtitle: string;
  note: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`w-full rounded-[1.15rem] border p-4 text-left transition-all active:scale-[0.99] ${
        active
          ? "border-violet-300 bg-gradient-to-br from-violet-50 via-white to-indigo-50 shadow-[0_16px_38px_-24px_rgba(109,40,217,0.42)]"
          : "border-violet-200 bg-white hover:bg-violet-50/50"
      }`}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className={`rounded-lg px-2 py-1 text-[10px] font-extrabold ${
          active ? "bg-violet-100 text-violet-700" : "bg-gray-100 text-gray-500"
        }`}>
          {tag}
        </span>
        <span className={`rounded-lg px-2 py-1 text-[10px] font-extrabold ${
          active ? "bg-violet-600 text-white" : "bg-gray-200 text-gray-600"
        }`}>
          {active ? "✓ Selected" : "Select"}
        </span>
      </div>
      <div className="text-sm font-extrabold text-gray-900">{title}</div>
      <div className="mt-1 text-xs leading-relaxed text-gray-600">{subtitle}</div>
      <div className={`mt-3 rounded-xl border px-3 py-2 text-[11px] font-medium ${
        active
          ? "border-violet-100 bg-white/80 text-violet-700"
          : "border-gray-200 bg-gray-50 text-gray-500"
      }`}>
        {note}
      </div>
    </button>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function Page() {
  // STEP 1
  const [predator, setPredator] = useState(DEFAULT_PREDATOR);
  const [prey, setPrey] = useState(DEFAULT_PREY);
  const [arc, setArc] = useState<Arc>(DEFAULT_ARC);
  const [weather, setWeather] = useState<Weather>(DEFAULT_WEATHER);
  const [habitat, setHabitat] = useState<HabitatPreset>(DEFAULT_HABITAT);
  const [depthMode, setDepthMode] = useState<DepthMode>(DEFAULT_DEPTH_MODE);
  const [emotionalTone, setEmotionalTone] = useState<EmotionalTone>(DEFAULT_EMOTIONAL_TONE);
  const [animalVibe, setAnimalVibe] = useState<AnimalVibe>(DEFAULT_ANIMAL_VIBE);

  // STEP 2
  const [runwayModel, setRunwayModel] = useState<RunwayModel>(RUNWAY_MODELS[0]);
  const [klingModel, setKlingModel] = useState<KlingModel>(KLING_MODELS[0]);
  const [imagePromptTarget, setImagePromptTarget] = useState<ImagePromptTarget>("NANO_BANANA_2");
  const [realismMode, setRealismMode] = useState<RealismMode>("Reference Locked");
  const [motionOnlyI2V, setMotionOnlyI2V] = useState(true);
  const [referenceLock, setReferenceLock] = useState(true);
  const [singleActionRule, setSingleActionRule] = useState(true);
  const [microMotion, setMicroMotion] = useState(true);
  const [heroVeo, setHeroVeo] = useState(false);
  const [autoApplyHighDrift, setAutoApplyHighDrift] = useState(false);
  const [lastQualityBeforeApply, setLastQualityBeforeApply] = useState<QualityState | null>(null);
  const [sceneNepaliRomanized, setSceneNepaliRomanized] = useState("");
  const [sceneMode, setSceneMode] = useState<"romanized" | "english">("romanized");
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

  // Custom animals
  const [customPredators, setCustomPredators] = useState<CustomPredatorForm[]>([]);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [customForm, setCustomForm] = useState<{
    name: string; prey: string; environment: string; defaultArc: string; driftRisk: "LOW" | "MEDIUM" | "HIGH";
  }>({
    name: "", prey: "",
    environment: habitatPromptMap["Rocky Mountain Meadow"],
    defaultArc: "Pack hunting strategy",
    driftRisk: "MEDIUM",
  });

  const predatorOptions = useMemo(() => {
    const base = Object.keys(predatorData);
    const extra = customPredators.map((p) => p.name);
    const usaPriority = [
      "Mountain Lion","Wolf Pack","Grizzly Bear","Alligator","Bison","Coyote","Bald Eagle","Moose",
      "Bull Elk","Black Bear","Cougar","Bobcat","Wolf","Wild Boar","Great Horned Owl","Red Fox",
      "Beaver","River Otter","Badger","Raccoon","White-tailed Deer","Dolphin","Orca","Shark",
    ];
    const all = Array.from(new Set([...base, ...extra]));
    return all.sort((a, b) => {
      const ai = usaPriority.indexOf(a), bi = usaPriority.indexOf(b);
      const aPinned = ai !== -1, bPinned = bi !== -1;
      if (aPinned && bPinned) return ai - bi;
      if (aPinned) return -1;
      if (bPinned) return 1;
      return a.localeCompare(b);
    });
  }, [customPredators]);

  const lionFallback = useMemo<NormalizedPreset>(() => {
    const rawLion = (predatorData as Record<string, unknown>)["Lion"];
    return normalizePreset(rawLion, {
      prey: ["White-tailed Deer"],
      environment: habitatPromptMap["Rocky Mountain Meadow"],
      lighting: "cold dawn light, pale gold horizon glow, thin ground mist, soft natural side light",
      cameraGear: "Nikon Z9, 400mm wildlife lens, long-lens documentary framing",
      texture: "natural fur, feather, or scale detail, grounded body weight, realistic contact with dirt, grass, brush, and uneven terrain",
      driftRisk: "MEDIUM",
      defaultArc: "Ambush attack",
    });
  }, []);

  const preset = useMemo<NormalizedPreset>(() => {
    const raw = (predatorData as Record<string, unknown>)[predator];
    if (raw !== undefined) return normalizePreset(raw, lionFallback);
    const custom = customPredators.find((p) => p.name === predator);
    if (!custom) return lionFallback;
    const preyList = custom.prey.split(",").map((s) => s.trim()).filter(Boolean);
    return normalizePreset({
      prey: preyList.length ? preyList : ["White-tailed Deer"],
      environment: custom.environment || "Rocky Mountain forest edge and open meadow",
      lighting: "cold dawn light, pale gold horizon glow, thin ground mist, soft natural side light",
      cameraGear: "Nikon Z9, 400mm wildlife lens, long-lens documentary framing",
      texture: "natural fur, feather, or scale detail, grounded body weight, realistic contact with dirt, grass, brush, and uneven terrain",
      driftRisk: custom.driftRisk || "MEDIUM",
      defaultArc: custom.defaultArc || "Pack hunting strategy",
    }, lionFallback);
  }, [predator, lionFallback, customPredators]);

  const finalEnvironment =
    habitat === "Auto"
      ? suggestHabitat(predator, prey, preset.environment)
      : habitatPromptMap[habitat];

  const mediaSuggestedArc = useMemo(
    () => normalizeArcSuggestion(mediaAnalysis?.suggestedArc),
    [mediaAnalysis?.suggestedArc]
  );

  const qualityReco = useMemo(() => getQualityRecommendations({
    driftRisk: preset.driftRisk, realismMode, runwayModel, klingModel,
    motionOnlyI2V, referenceLock, singleActionRule, microMotion, heroVeo,
  }), [preset.driftRisk, realismMode, runwayModel, klingModel, motionOnlyI2V, referenceLock, singleActionRule, microMotion, heroVeo]);

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

  useEffect(() => {
    const shared = readShareState();
    if (shared.predator) setPredator(shared.predator);
    if (shared.prey) setPrey(shared.prey);
    if (shared.arc) setArc(shared.arc as Arc);
    if (shared.weather) setWeather(shared.weather);
    if (shared.depthMode) setDepthMode(shared.depthMode);
    if (shared.habitat) setHabitat(shared.habitat);
    const saved = readSettings();
    if (saved?.activeProvider) setActiveProvider(saved.activeProvider);
    if (saved?.runwayModel && (RUNWAY_MODELS as readonly string[]).includes(saved.runwayModel)) setRunwayModel(saved.runwayModel);
    if (saved?.klingModel && (KLING_MODELS as readonly string[]).includes(saved.klingModel)) setKlingModel(saved.klingModel);
    if (saved?.realismMode) setRealismMode(saved.realismMode);
    if (saved?.motionOnlyI2V !== undefined) setMotionOnlyI2V(saved.motionOnlyI2V);
    if (saved?.referenceLock !== undefined) setReferenceLock(saved.referenceLock);
    if (saved?.singleActionRule !== undefined) setSingleActionRule(saved.singleActionRule);
    if (saved?.microMotion !== undefined) setMicroMotion(saved.microMotion);
    if (saved?.heroVeo !== undefined) setHeroVeo(saved.heroVeo);
    if (saved?.habitat) setHabitat(saved.habitat);
    const aa = (saved as Record<string, unknown>)?.autoApplyHighDrift;
    if (typeof aa === "boolean") setAutoApplyHighDrift(aa);
  }, []);

  useEffect(() => {
    writeSettings({ activeProvider, runwayModel, klingModel, realismMode, motionOnlyI2V, referenceLock, singleActionRule, microMotion, heroVeo, autoApplyHighDrift, habitat });
  }, [activeProvider, runwayModel, klingModel, realismMode, motionOnlyI2V, referenceLock, singleActionRule, microMotion, heroVeo, autoApplyHighDrift, habitat]);

  useEffect(() => {
    writeShareState({ predator, prey, arc, weather, depthMode, habitat });
  }, [predator, prey, arc, weather, depthMode, habitat]);

  useEffect(() => {
    const savedCustom = readCustomPredators();
    setCustomPredators(savedCustom);
  }, []);

  useEffect(() => {
    if (!mediaAnalysis) return;
    const nextWeather = normalizeWeatherSuggestion(mediaAnalysis.weather);
    const nextDepthMode = normalizeDepthSuggestion(mediaAnalysis.suggestedDepth);
    if (nextWeather && weather !== nextWeather) setWeather(nextWeather);
    if (nextDepthMode && depthMode !== nextDepthMode) setDepthMode(nextDepthMode);
  }, [mediaAnalysis, weather, depthMode]);

  useEffect(() => {
    if (!preset.prey.length) return;
    const nextPrey = preset.prey.includes(prey) ? prey : preset.prey[0];
    if (prey !== nextPrey) { setPrey(nextPrey); return; }
    const suggestedArc = mediaSuggestedArc ?? (suggestArc(predator, nextPrey, preset.defaultArc) as Arc);
    if (arc !== suggestedArc) setArc(suggestedArc);
  }, [predator, prey, arc, preset.prey, preset.defaultArc, mediaSuggestedArc]);

  async function handleGenerate() {
    setIsGenerating(true);
    setError("");
    setPkg(null);
    try {
      if (!predator || !prey) throw new Error("Missing predator or prey");
      const finalArc = suggestArc(predator, prey, arc) as Arc;
      const safeMedia = (mediaAnalysis ?? null) as SafeMediaAnalysis | null;
      const sceneInjectFromMedia = safeMedia?.imagePromptInject ?? "";
      const sceneInjectFromUser = sceneNepaliRomanized.trim();
      const sceneInject = sceneInjectFromUser.length > 0 ? sceneInjectFromUser : sceneInjectFromMedia;
      const quality = { realismMode, motionOnlyI2V, referenceLock, singleActionRule, microMotion, heroVeo };

      const imagePrompt = buildImagePrompt(predator, prey, finalEnvironment, finalArc, preset.lighting, preset.cameraGear, preset.texture, depthMode, weather, emotionalTone, animalVibe, sceneInject, quality, imagePromptTarget);
      const shotImagePlan = buildShotImagePlan(predator, prey, finalEnvironment, finalArc, weather, quality);
      const runway = buildRunwayShots(predator, prey, finalEnvironment, finalArc, weather, runwayModel, emotionalTone, animalVibe, sceneInject, quality);
      const seedance = buildSeedanceShots(predator, prey, finalEnvironment, finalArc, weather, emotionalTone, animalVibe, sceneInject, quality);
      const kling = buildKlingShots(predator, prey, finalEnvironment, finalArc, weather, klingModel, emotionalTone, animalVibe, sceneInject, quality);
      const klingNative15s = buildKlingNative15s(predator, prey, finalEnvironment, finalArc, weather, klingModel, emotionalTone, animalVibe, sceneInject, quality);
      const klingSixShot = buildKlingSixShot(predator, prey, finalEnvironment, finalArc, weather, klingModel, emotionalTone, animalVibe, sceneInject, quality);
      const negativePromptForKling = buildNegativePrompt(predator, "KLING");
      const thumbnailPrompt = buildThumbnailPrompt(predator, prey, finalEnvironment, weather, emotionalTone, animalVibe);
      const voiceoverLine = buildVoiceoverLine(predator, prey, finalEnvironment, emotionalTone);
      const capCutPlan = buildCapCutPlan(predator, finalArc, weather);
      const clipChaining = buildClipChaining(predator, preset.driftRisk);
      const hook2026 = build2026Hook(predator, prey, finalArc);
      const caption2026 = build2026Caption(predator, prey, finalEnvironment, finalArc);
      const cta = buildCTA(finalArc);
      const hashtags = buildHashtags(predator, prey, finalArc);
      const recommendedHookIndex = getRecommendedHookIndex(finalArc);
      const presetForIdeas = { ...preset, environment: finalEnvironment };
      const tenIdeas = build10Ideas(predator, preset.prey, presetForIdeas as never);
      const platformPack = buildPlatformPack(predator, prey, finalArc, finalEnvironment);
      const seoTitle = buildSEOTitle(predator, prey, finalArc);
      const altTextPrompt = buildAltTextPrompt(predator, prey, finalEnvironment, finalArc);
      const qualitySummary = buildQualitySummary(quality);
      const referenceWorkflow = buildReferenceWorkflow(predator, quality);
      const naturalismChecklist = buildNaturalismChecklist(quality, weather, finalEnvironment);
      const fiveShotCinematic = buildFiveShotCinematic(predator, prey, finalEnvironment, finalArc, weather, runwayModel, klingModel, emotionalTone, animalVibe, quality);
      const fiveShotViral = buildFiveShotViral(predator, prey, finalEnvironment, finalArc, weather, runwayModel, klingModel, emotionalTone, animalVibe, quality);
      const watchTimeReport = buildWatchTimeReport("5-shot", 2);
      const motionStrength = arcMotionStrength[finalArc] ?? 70;
      const soundDesignPack = buildSoundDesignPack(predator, prey, finalEnvironment, finalArc, weather, klingModel);
      const animalBehaviorResult = getAnimalBehavior(predator);

      const basePkg: GeneratedPackage = {
        predatorName: predator, preyName: prey, arcName: finalArc,
        imagePrompt, negativePrompt: negativePromptForKling, thumbnailPrompt, voiceoverLine, shotImagePlan,
        runwayShots: [runway?.shot1 ?? "", runway?.shot2 ?? "", runway?.shot3 ?? "", runway?.shot4 ?? ""],
        klingShots: [kling?.shot1 ?? "", kling?.shot2 ?? "", kling?.shot3 ?? "", kling?.shot4 ?? ""],
        seedanceShots: [seedance.shot1, seedance.shot2, seedance.shot3, seedance.shot4],
        seedanceMultiShotPrompt: seedance.multiShotPrompt,
        seedanceWorkflowGuide: seedance.workflowGuide,
        klingNative15s, klingSixShot, motionStrength, capCutPlan, clipChaining,
        hook: hook2026?.[0] ?? "", hook2026: hook2026 ?? [], recommendedHookIndex,
        caption: caption2026 ?? "", caption2026: caption2026 ?? "", cta, hashtags, tenIdeas,
        shotPlan: [
          { engine: "RUNWAY", title: "Shot 1 — Opening Tension", prompt: runway?.shot1 ?? "", motionStrength, why: "Use Image 1 from the master image for the clean first-frame opening." },
          { engine: "KLING", title: "Shot 2 — Pressure Build", prompt: kling?.shot2 ?? "", motionStrength, why: "Use Image 2 edited from Shot 1 image for a stronger physics-safe pressure build without losing identity." },
          { engine: "KLING", title: "Shot 3 — Peak Action", prompt: kling?.shot3 ?? "", motionStrength, why: "Use Image 3 edited from Shot 2 image for the strongest full-body action beat." },
          { engine: "RUNWAY", title: "Shot 4 — Resolved Tension", prompt: runway?.shot4 ?? "", motionStrength, why: "Use Image 4 edited from Shot 3 image for the readable aftermath or final tension hold." },
        ],
        runwayBundle: [runway?.shot1 ?? "", runway?.shot2 ?? "", runway?.shot3 ?? "", runway?.shot4 ?? ""].join("\n\n---\n\n"),
        klingBundle: [kling?.shot1 ?? "", kling?.shot2 ?? "", kling?.shot3 ?? "", kling?.shot4 ?? ""].join("\n\n---\n\n"),
        routingNote: `4-shot hybrid routing: Image 1 → Shot 1 Opening Tension (Runway ${runwayModel}) | Image 2 → Shot 2 Pressure Build (Kling ${klingModel}) | Image 3 → Shot 3 Peak Action (Kling ${klingModel}) | Image 4 → Shot 4 Resolved Tension (Runway ${runwayModel})`,
        pipelineStyle: "4-shot", fiveShotCinematic, fiveShotViral, watchTimeReport, platformPack,
        seoTitle, altTextPrompt, qualitySummary, referenceWorkflow, naturalismChecklist,
        modelsUsed: { runway: runwayModel, kling: klingModel },
        sceneDesc: sceneInject, soundDesignPack,
        animalBehavior: animalBehaviorResult ?? undefined,
      };

      const capCutScript = buildCapCutScript(predator, prey, finalArc, weather, basePkg, "5-shot");
      const twoPartViralPreset = shouldBuildTwoPartViralPreset(predator, prey, finalArc)
        ? buildTwoPartViralPreset(predator, prey, finalEnvironment, weather, finalArc, runwayModel)
        : null;

      let enhanced: GeneratedPackageEnhancements = {};
      if (activeProvider !== "none") {
        const res = await fetch("/api/enhance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider: activeProvider, predator, prey, env: finalEnvironment, arc: finalArc, weather, emotionalTone, animalVibe, base: { imagePrompt, hook: hook2026?.[0] ?? "", caption: caption2026 ?? "", voiceoverLine } }),
        });
        const data = await res.json().catch(() => ({} as unknown));
        if (!res.ok) throw new Error(((data as Record<string, unknown>)?.error as string) || `AI enhancement failed (${res.status})`);
        const parsedEnhanced = enhanceResponseSchema.safeParse(data);
        if (!parsedEnhanced.success) throw new Error("Invalid AI enhancement response");
        enhanced = {
          ...(parsedEnhanced.data.imagePrompt ? { imagePrompt: parsedEnhanced.data.imagePrompt } : {}),
          ...(parsedEnhanced.data.hook ? { hook: parsedEnhanced.data.hook } : {}),
          ...(parsedEnhanced.data.caption ? { caption: parsedEnhanced.data.caption } : {}),
          ...(parsedEnhanced.data.voiceoverLine ? { voiceoverLine: parsedEnhanced.data.voiceoverLine } : {}),
          aiEnhanced: true,
        };
        if (!hasUsableGeneratedPackageEnhancements(enhanced)) throw new Error("AI enhancement returned no usable prompt updates");
      }

      const finalPkg: GeneratedPackage = mergeGeneratedPackage(basePkg, enhanced, {
        capCutScript,
        ...(twoPartViralPreset ? {
          twoPartViralOverview: twoPartViralPreset.overview,
          twoPartWorkflowGuide: twoPartViralPreset.workflowGuide,
          twoPartPart1Hook: twoPartViralPreset.part1Hook,
          twoPartPart1Caption: twoPartViralPreset.part1Caption,
          twoPartPart1Draft: twoPartViralPreset.part1Draft,
          twoPartPart1Final: twoPartViralPreset.part1Final,
          twoPartPart2Hook: twoPartViralPreset.part2Hook,
          twoPartPart2Caption: twoPartViralPreset.part2Caption,
          twoPartPart2Draft: twoPartViralPreset.part2Draft,
          twoPartPart2Final: twoPartViralPreset.part2Final,
        } : {}),
      });

      setPkg(finalPkg);

      try {
        const key = makePromptVersionKey(finalPkg.predatorName ?? predator, finalPkg.preyName ?? prey, String(finalPkg.arcName ?? arc));
        const v: PromptVersion = {
          version: getNextVersionNumber(key),
          timestamp: new Date().toISOString(),
          imagePrompt: finalPkg.imagePrompt,
          hook: finalPkg.hook ?? "",
          caption: finalPkg.caption ?? "",
          voiceoverLine: finalPkg.voiceoverLine ?? "",
          label: `GENERATE • ${activeProvider === "none" ? "Local" : activeProvider} • ${predator} vs ${prey} • ${String(finalArc ?? arc)}`,
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

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen w-full bg-gray-950">

      {/* ── APP HEADER ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-gray-950/95 backdrop-blur-sm shadow-[0_1px_0_rgba(255,255,255,0.03)]">
        <div className="mx-auto w-full max-w-[var(--main-max-width)] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3 py-3 sm:min-h-[4rem] sm:flex-nowrap">

            {/* Brand */}
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/10 ring-1 ring-white/10">
                <span className="text-[11px] font-black text-white">W</span>
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="truncate text-sm font-black tracking-tight text-white sm:text-[15px]">WILD STORIES TV</span>
                  <span className="hidden text-[10px] font-semibold text-white/40 sm:inline">WSTV Production Studio</span>
                </div>
                <div className="mt-0.5 text-[10px] font-medium text-white/35 sm:hidden">Production Studio</div>
              </div>
            </div>

            {/* Top-level tab switcher */}
            <div className="order-3 w-full sm:order-2 sm:flex sm:flex-1 sm:justify-center">
              <nav className="grid w-full grid-cols-2 items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.06] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:w-auto sm:min-w-[260px] sm:flex-none">
                {([
                  { id: "build" as TopTab, label: "Build", icon: "⚡" },
                  { id: "workflows" as TopTab, label: "Workflows", icon: "⬡" },
                ]).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all sm:px-4 ${
                      activeTab === tab.id
                        ? "bg-white text-gray-900 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.65)]"
                        : "text-white/55 hover:bg-white/[0.05] hover:text-white/85"
                    }`}
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="shrink-0 sm:order-3">
              <SettingsDrawer />
            </div>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          BUILD TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "build" && (
        <div className="mx-auto w-full max-w-[var(--main-max-width)] px-4 py-6 sm:px-6 sm:py-7 lg:px-8">

          {/* Step navigator */}
          <div className="mb-7 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="grid gap-1 md:grid-cols-3">
              {([
                { step: 1 as Step, label: "Wildlife Setup", desc: "Animals, arc, atmosphere" },
                { step: 2 as Step, label: "Engine & Quality", desc: "Model, drift, upload" },
                { step: 3 as Step, label: "Generate", desc: "Run & review output" },
              ]).map((s) => (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setStep(s.step)}
                  className={`flex items-center gap-3 rounded-[1rem] px-3.5 py-3 text-left transition-all sm:px-4 sm:py-3.5 ${
                    step === s.step
                      ? "bg-white text-gray-900 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.55)]"
                      : "text-white/70 hover:bg-white/[0.06]"
                  }`}
                >
                  <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-xs font-black ${
                    step === s.step ? "bg-gray-900 text-white" : "bg-white/10 text-white/50"
                  }`}>
                    {step > s.step ? "✓" : s.step}
                  </div>
                  <div className="min-w-0">
                    <div className={`truncate text-xs font-extrabold sm:text-[13px] ${step === s.step ? "text-gray-900" : "text-white/80"}`}>
                      {s.label}
                    </div>
                    <div className={`mt-0.5 hidden truncate text-[10px] md:block ${step === s.step ? "text-gray-500" : "text-white/35"}`}>
                      {s.desc}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── STEP 1 ───────────────────────────────────────────────────── */}
          {step === 1 && (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">

              {/* Left: Inputs */}
              <div className="space-y-6">

                {/* Animals */}
                <section className="rounded-[1.5rem] border border-gray-200/90 bg-white p-5 shadow-[0_14px_38px_-28px_rgba(15,23,42,0.35)] sm:p-6">
                  <h3 className="mb-5 text-xs font-extrabold uppercase tracking-[0.18em] text-gray-400">Animals</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-500">Lead Animal</label>
                      <select
                        value={predator}
                        onChange={(e) => setPredator(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-gray-400 focus:outline-none"
                      >
                        {predatorOptions.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <p className="mt-1 text-[11px] text-gray-400">Controls the encounter and drives opening pressure.</p>
                      {customPredators.length > 0 && (
                        <p className="mt-0.5 text-[11px] text-gray-400">
                          {customPredators.length} custom animal{customPredators.length > 1 ? "s" : ""} added
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-500">Opposing Animal</label>
                      <select
                        value={prey}
                        onChange={(e) => setPrey(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-gray-400 focus:outline-none"
                      >
                        {preset.prey.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <p className="mt-1 text-[11px] text-gray-400">Filtered for realism from the selected lead animal.</p>
                    </div>
                  </div>
                </section>

                {/* Scene */}
                <section className="rounded-[1.5rem] border border-gray-200/90 bg-white p-5 shadow-[0_14px_38px_-28px_rgba(15,23,42,0.35)] sm:p-6">
                  <h3 className="mb-5 text-xs font-extrabold uppercase tracking-[0.18em] text-gray-400">Scene</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-500">Conflict Arc</label>
                      <select
                        value={arc}
                        disabled
                        className="w-full rounded-xl border border-gray-200 bg-gray-100 px-3 py-2.5 text-sm text-gray-500 cursor-not-allowed"
                      >
                        <option value={arc}>{arc}</option>
                      </select>
                      <p className="mt-1 text-[11px] text-gray-400">Auto-matched from animal pairing.</p>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-500">Scene Atmosphere</label>
                      <select
                        value={weather}
                        onChange={(e) => setWeather(e.target.value as Weather)}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-gray-400 focus:outline-none"
                      >
                        {weatherOptions.map((w) => <option key={w} value={w}>{w}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-500">Cinematic Depth</label>
                      <select
                        value={depthMode}
                        onChange={(e) => setDepthMode(e.target.value as DepthMode)}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-gray-400 focus:outline-none"
                      >
                        {depthModes.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-500">Habitat Override</label>
                      <select
                        value={habitat}
                        onChange={(e) => setHabitat(e.target.value as HabitatPreset)}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-gray-400 focus:outline-none"
                      >
                        {habitatOptions.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                      {habitat !== "Auto" && (
                        <p className="mt-1 text-[11px] text-amber-600 font-medium">⚠ Manual override active</p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-500">Tension Level</label>
                      <select
                        value={emotionalTone}
                        onChange={(e) => setEmotionalTone(e.target.value as EmotionalTone)}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-gray-400 focus:outline-none"
                      >
                        {emotionalTones.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-500">Instinct Style</label>
                      <select
                        value={animalVibe}
                        onChange={(e) => setAnimalVibe(e.target.value as AnimalVibe)}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-gray-400 focus:outline-none"
                      >
                        {animalVibes.map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                  </div>
                </section>

                {/* Actions */}
                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => { setPredator(DEFAULT_PREDATOR); setPrey(DEFAULT_PREY); setArc(DEFAULT_ARC); setWeather(DEFAULT_WEATHER); setHabitat(DEFAULT_HABITAT); setDepthMode(DEFAULT_DEPTH_MODE); setEmotionalTone(DEFAULT_EMOTIONAL_TONE); setAnimalVibe(DEFAULT_ANIMAL_VIBE); }}
                    className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 active:scale-[0.98]"
                  >
                    Reset Defaults
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-black active:scale-[0.98]"
                  >
                    Continue → Engine & Quality
                  </button>
                </div>
              </div>

              {/* Right: Current Setup card (sticky) */}
              <div className="space-y-3 sm:space-y-4">
                {/* Setup preview */}
                <div className="rounded-[1.75rem] border border-gray-200/90 bg-gradient-to-br from-white via-white to-gray-50 p-5 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.45)] lg:sticky lg:top-24 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xs font-extrabold uppercase tracking-[0.18em] text-gray-400">Current Setup</h3>
                      <p className="mt-1 text-[11px] text-gray-500">Live preview of your wildlife build context</p>
                    </div>
                    <span className="rounded-full bg-gray-900 px-2.5 py-1 text-[10px] font-bold text-white/85">Live</span>
                  </div>
                  <div className="mt-4 rounded-[1.25rem] border border-gray-100 bg-gray-50/80 p-4">
                    <div className="text-base font-extrabold text-gray-900">{predator} vs {prey}</div>
                    <div className="mt-1 text-sm text-gray-600">{arc}</div>
                    <div className="mt-1 text-xs text-gray-500">{weather} · {depthMode}</div>
                  </div>
                  <div className="mt-4 grid gap-3">
                    <div className="rounded-2xl border border-gray-100 bg-white/80 p-3.5">
                      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Environment</div>
                      <div className="text-[11px] leading-relaxed text-gray-600">{finalEnvironment}</div>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white/80 px-3.5 py-3">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Drift Risk</span>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${
                        preset.driftRisk === "HIGH" ? "bg-red-100 text-red-700" :
                        preset.driftRisk === "MEDIUM" ? "bg-amber-100 text-amber-700" :
                        "bg-emerald-100 text-emerald-700"
                      }`}>
                        {preset.driftRisk}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Add custom animal */}
                <div className="rounded-[1.5rem] border border-dashed border-gray-300/80 bg-gray-50/75 p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-extrabold uppercase tracking-wide text-gray-700">Custom Animal</div>
                      <div className="mt-0.5 text-[11px] text-gray-500">Add any animal to the list</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setCustomForm({ name: "", prey: "", environment: habitatPromptMap["Rocky Mountain Meadow"], defaultArc: arc || "Pack hunting strategy", driftRisk: preset.driftRisk }); setCustomModalOpen(true); }}
                      className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-100 active:scale-[0.98]"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2 ───────────────────────────────────────────────────── */}
          {step === 2 && (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">

              {/* Left: Models + Quality */}
              <div className="space-y-6">

                {/* Quality Automation */}
                <section className="rounded-[1.5rem] border border-gray-200/90 bg-white p-5 shadow-[0_14px_38px_-28px_rgba(15,23,42,0.35)] sm:p-6">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-extrabold uppercase tracking-[0.18em] text-gray-400">🛡 Quality Automation</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                        qualityReco.level === "HIGH" ? "bg-red-100 text-red-700" :
                        qualityReco.level === "MEDIUM" ? "bg-amber-100 text-amber-700" :
                        "bg-emerald-100 text-emerald-700"
                      }`}>
                        {qualityReco.level} drift
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setAutoApplyHighDrift((v) => !v)}
                        className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                          autoApplyHighDrift ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {autoApplyHighDrift ? "⚡ Auto: ON" : "⚡ Auto: OFF"}
                      </button>
                      <button
                        type="button"
                        disabled={!lastQualityBeforeApply}
                        onClick={undoRecommendedQuality}
                        className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 active:scale-95"
                      >
                        ↩ Undo
                      </button>
                      <button
                        type="button"
                        onClick={applyRecommendedQuality}
                        className="rounded-xl bg-gray-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-black active:scale-95"
                      >
                        ✅ Apply
                      </button>
                    </div>
                  </div>

                  {qualityReco.warnings.length > 0 ? (
                    <div className="space-y-2">
                      {qualityReco.warnings.map((w) => (
                        <div key={w.id} className={`rounded-xl border p-3 ${
                          w.severity === "danger" ? "border-red-200 bg-red-50" :
                          w.severity === "warning" ? "border-amber-200 bg-amber-50" : "border-gray-200 bg-gray-50"
                        }`}>
                          <div className="text-xs font-extrabold text-gray-900">{w.title}</div>
                          <div className="mt-0.5 text-xs text-gray-600">{w.detail}</div>
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
                      <span className="font-bold text-gray-600">Why:</span> {qualityReco.why.join(" • ")}
                    </div>
                  )}
                </section>

                {/* Models */}
                <section className="rounded-[1.5rem] border border-gray-200/90 bg-white p-5 shadow-[0_14px_38px_-28px_rgba(15,23,42,0.35)] sm:p-6">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xs font-extrabold uppercase tracking-[0.18em] text-gray-400">Model Profile</h3>
                    <span className="rounded bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-500">prompts auto-adapt per model</span>
                  </div>
                  <div className="mb-4">
                    <FeaturedModelCard
                      active
                      tag="SEEDANCE"
                      title="Seedance 2.0"
                      subtitle="Primary WSTV 4-shot continuity lane for the current production workflow."
                      note="Main continuity path = Seedance 2.0 Shot 1 → Shot 4. Single current Seedance profile is selected by default, while Runway and Kling stay available below for alternate prompt bundles and fallback workflows."
                      onClick={() => {}}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="mb-2 inline-flex rounded-lg bg-green-100 px-2 py-1 text-[10px] font-extrabold text-green-700">RUNWAY</div>
                      {RUNWAY_MODELS.map((m) => (
                        <ModelCard key={m} tone="green" tag="RUNWAY" active={runwayModel === m} title={m}
                          subtitle={m === "Gen-4.5" ? "Best realism, strongest first-frame readability" : m === "Gen-4 Turbo" ? "Fast draft for quick readable opening tests" : "Stable cinematic shots with clear openings"}
                          onClick={() => setRunwayModel(m)}
                        />
                      ))}
                    </div>
                    <div className="space-y-2">
                      <div className="mb-2 inline-flex rounded-lg bg-blue-100 px-2 py-1 text-[10px] font-extrabold text-blue-700">KLING</div>
                      {KLING_MODELS.map((m) => (
                        <ModelCard key={m} tone="blue" tag="KLING" active={klingModel === m} title={m}
                          subtitle={m === "Kling 3.0 Pro" ? "Strong action workflow, best readable openings" : m === "Kling 3.0 Standard" ? "Balanced action with clear subject spacing" : m === "Kling 2.6 Pro" ? "Earlier option for simpler readable action" : m === "Kling 2.5 Turbo Pro" ? "Fast draft for one clean action beat" : "Fast I2V draft option for rough motion tests"}
                          onClick={() => setKlingModel(m)}
                        />
                      ))}
                    </div>
                  </div>
                </section>

                {/* Quality toggles */}
                <section className="rounded-[1.5rem] border border-gray-200/90 bg-white p-5 shadow-[0_14px_38px_-28px_rgba(15,23,42,0.35)] sm:p-6">
                  <h3 className="mb-5 text-xs font-extrabold uppercase tracking-[0.18em] text-gray-400">Quality Toggles</h3>
                  <QualityPanel
                    realismMode={realismMode} setRealismMode={setRealismMode}
                    motionOnlyI2V={motionOnlyI2V} setMotionOnlyI2V={setMotionOnlyI2V}
                    referenceLock={referenceLock} setReferenceLock={setReferenceLock}
                    singleActionRule={singleActionRule} setSingleActionRule={setSingleActionRule}
                    microMotion={microMotion} setMicroMotion={setMicroMotion}
                    heroVeo={heroVeo} setHeroVeo={setHeroVeo}
                  />
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <label className="mb-1.5 block text-xs font-semibold text-gray-500">Image Prompt Target</label>
                    <select
                      value={imagePromptTarget}
                      onChange={(e) => setImagePromptTarget(e.target.value as ImagePromptTarget)}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900"
                    >
                      <option value="NANO_BANANA_2">Nano Banana 2 — Gemini 3.1 Flash Image (default)</option>
                      <option value="NB2">NB2 (legacy Gemini 2.5 Flash Image)</option>
                      <option value="RUNWAY">Runway Reference</option>
                      <option value="MJ">Midjourney</option>
                    </select>
                  </div>

                  {/* Reference tags */}
                  <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50 p-3 text-xs text-violet-700">
                    <div className="font-semibold mb-1">Reference tags</div>
                    <div className="space-y-0.5 text-[11px]">
                      <div>Lead animal → <code className="rounded bg-white px-1 py-0.5 text-violet-800">@hero_predator</code></div>
                      <div>Opposing animal → <code className="rounded bg-white px-1 py-0.5 text-violet-800">@hero_prey</code></div>
                      <div>Environment plate → <code className="rounded bg-white px-1 py-0.5 text-violet-800">@env_plate</code></div>
                    </div>
                    <div className="mt-1.5 text-violet-500">Video prompts मा appearance नलेख — reference image नै identity हो।</div>
                  </div>
                </section>
              </div>

              {/* Right: Upload + Scene */}
              <div className="space-y-5">

                {/* Media upload */}
                <section className="rounded-[1.5rem] border border-gray-200/90 bg-white p-5 shadow-[0_14px_38px_-28px_rgba(15,23,42,0.35)] sm:p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xs font-extrabold uppercase tracking-[0.18em] text-gray-400">📎 Media Upload</h3>
                    <span className="rounded-lg bg-purple-100 px-2 py-1 text-[10px] font-bold text-purple-700">Auto Analyze</span>
                  </div>
                  <MediaAnalyzer
                    activeProvider={activeProvider}
                    analysis={mediaAnalysis}
                    onAnalysisComplete={setMediaAnalysis}
                    onClear={() => setMediaAnalysis(null)}
                  />
                </section>

                {/* Scene description */}
                <section className="rounded-[1.5rem] border border-orange-200/80 bg-orange-50/85 p-5 shadow-[0_14px_38px_-28px_rgba(194,65,12,0.28)] sm:p-6">
                  <h3 className="mb-4 text-xs font-extrabold uppercase tracking-[0.18em] text-orange-500">Scene Description</h3>
                  <div className="mb-4 flex overflow-hidden rounded-xl border border-orange-200 bg-white">
                    {(["romanized", "english"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setSceneMode(mode)}
                        className={`flex-1 px-3 py-2 text-xs font-bold ${
                          sceneMode === mode ? "bg-orange-600 text-white" : "text-orange-600 hover:bg-orange-50"
                        }`}
                      >
                        {mode === "romanized" ? "Nepali Romanized" : "Direct English"}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={sceneNepaliRomanized}
                    onChange={(e) => setSceneNepaliRomanized(e.target.value)}
                    placeholder={sceneMode === "romanized" ? "jastei: bag le bakhra lai khedaera..." : "Write the scene in English..."}
                    className="min-h-[120px] w-full resize-none rounded-xl border border-orange-200 bg-white p-3.5 text-sm text-gray-900 outline-none placeholder:text-gray-400"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["Example 1", "Example 2", "Example 3"].map((x) => (
                      <button key={x} type="button"
                        onClick={() => setSceneNepaliRomanized(`${x}: bag le bakhra lai khedaera...`)}
                        className="rounded-lg border border-orange-200 bg-orange-100 px-2.5 py-1 text-xs font-bold text-orange-800 hover:bg-orange-200"
                      >
                        {x}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => alert("Auto-translate wiring: optional. For now, this text injects directly into prompts.")}
                      className="ml-auto rounded-xl bg-orange-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-700"
                    >
                      Translate →
                    </button>
                  </div>
                </section>

                {/* Sticky setup summary on desktop */}
                <div className="rounded-[1.5rem] border border-gray-200/90 bg-gradient-to-br from-white to-gray-50 p-5 shadow-[0_14px_38px_-28px_rgba(15,23,42,0.35)]">
                  <div className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-gray-400">Current Setup</div>
                  <div className="text-sm font-extrabold text-gray-900">{predator} vs {prey}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{arc} · {weather}</div>
                  <div className="mt-3 flex items-center justify-between rounded-xl border border-gray-100 bg-white/80 px-3 py-2.5">
                    <span className="text-[11px] text-gray-400">Drift Risk</span>
                    <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                      preset.driftRisk === "HIGH" ? "bg-red-100 text-red-700" :
                      preset.driftRisk === "MEDIUM" ? "bg-amber-100 text-amber-700" :
                      "bg-emerald-100 text-emerald-700"
                    }`}>{preset.driftRisk}</span>
                  </div>
                </div>
              </div>

              {/* Nav */}
              <div className="lg:col-span-2 flex flex-wrap gap-2 pt-2">
                <button type="button" onClick={() => setStep(1)}
                  className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 active:scale-[0.98]">
                  ← Back
                </button>
                <button type="button" onClick={() => setStep(3)}
                  className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-black active:scale-[0.98]">
                  Continue → Generate
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3 ───────────────────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-6">

              {/* Generate card */}
              <section className="rounded-[1.5rem] border border-gray-200/90 bg-white p-5 shadow-[0_14px_38px_-28px_rgba(15,23,42,0.35)] sm:p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xs font-extrabold uppercase tracking-[0.18em] text-gray-400">Generate for Reels</h3>
                  <div className="text-xs text-gray-500 font-medium">{predator} vs {prey}</div>
                </div>

                {/* AI provider */}
                <div className="mb-5 rounded-[1.25rem] border border-gray-100 bg-gray-50/80 p-3.5">
                  <div className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">AI Enhancement</div>
                  <div className="flex flex-wrap gap-2">
                    {(["none", "gemini", "claude"] as AIProvider[]).map((p) => (
                      <button key={p} type="button" onClick={() => setActiveProvider(p)}
                        className={`rounded-xl border px-4 py-2 text-xs font-bold transition-all active:scale-95 ${
                          activeProvider === p ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {p === "none" ? "Off (Local)" : p === "gemini" ? "✦ Gemini" : "✦ Claude"}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full rounded-xl bg-gray-900 py-4 text-sm font-extrabold text-white hover:bg-black disabled:opacity-60 active:scale-[0.98] transition-all"
                >
                  {isGenerating ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Generating...
                    </span>
                  ) : `⚡ Generate — ${predator} vs ${prey}`}
                </button>

                {error && (
                  <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="text-sm font-semibold text-red-700">⚠️ {error}</p>
                  </div>
                )}
              </section>

              {/* Output */}
              {pkg && (
                <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:p-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 px-4 pb-2 pt-4 sm:px-5">
                    <div>
                      <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-white/45">Generated Output</div>
                      <div className="mt-1 text-sm font-semibold text-white/80">Prompt pack, workflow guidance, and export-ready copy</div>
                    </div>
                  </div>
                  <OutputCards
                    data={pkg}
                    onRestoreVersion={(v) => {
                      setPkg((prev) => {
                        if (!prev) return prev;
                        const restored: GeneratedPackage = { ...prev, imagePrompt: v.imagePrompt, hook: v.hook, caption: v.caption, voiceoverLine: v.voiceoverLine ?? prev.voiceoverLine };
                        try {
                          const key = makePromptVersionKey(restored.predatorName ?? predator, restored.preyName ?? prey, String(restored.arcName ?? arc));
                          appendPromptVersion(key, {
                            version: getNextVersionNumber(key),
                            timestamp: new Date().toISOString(),
                            imagePrompt: restored.imagePrompt,
                            hook: restored.hook ?? "",
                            caption: restored.caption ?? "",
                            voiceoverLine: restored.voiceoverLine ?? "",
                            label: `RESTORE v${v.version} • ${predator} vs ${prey}`,
                            performanceNote: "",
                          });
                        } catch { /* ignore */ }
                        return restored;
                      });
                    }}
                  />
                </section>
              )}

              {/* Nav */}
              <div className="flex gap-2">
                <button type="button" onClick={() => setStep(2)}
                  className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 active:scale-[0.98]">
                  ← Back
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          WORKFLOWS TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "workflows" && (
        <div className="mx-auto w-full max-w-[var(--main-max-width)] px-4 py-7 sm:px-6 sm:py-8 lg:px-8">

          {/* Workflow tab selector */}
          <div className="mb-6 space-y-3">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-white/35">Workflow Viewer</div>
                <div className="mt-1 text-sm text-white/55">Switch between the WSTV production continuity map and the Runway-native reference handoff view.</div>
              </div>
              <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.05] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <div className="flex flex-wrap gap-1">
                  {([
                    { id: "wstv" as WorkflowTab, label: "WSTV Custom Workflow", badge: "Primary" },
                    { id: "runway" as WorkflowTab, label: "Runway Official Workflow", badge: "Reference" },
                  ]).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setWorkflowTab(tab.id)}
                      className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                        workflowTab === tab.id ? "bg-white text-gray-900 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.65)]" : "text-white/55 hover:bg-white/[0.05] hover:text-white/85"
                      }`}
                    >
                      {tab.label}
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold ${
                        workflowTab === tab.id
                          ? tab.id === "wstv" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                          : "bg-white/10 text-white/40"
                      }`}>
                        {tab.badge}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="text-xs text-white/35">
              Interactive viewer with drag, zoom, and inspectable continuity wires.
            </div>
          </div>

          {/* Diagram area */}
          <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-gradient-to-b from-gray-900 to-gray-950 shadow-[0_28px_80px_-40px_rgba(0,0,0,0.75)]">
            <div className="border-b border-white/10 px-5 py-4 sm:px-6">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500/70" />
                  <div className="h-2 w-2 rounded-full bg-yellow-500/70" />
                  <div className="h-2 w-2 rounded-full bg-green-500/70" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-300">
                    {workflowTab === "wstv" ? "WSTV · 4-shot production workflow · Seedance 2.0 primary lane" : "Runway Official · 4-shot safe handoff · Gen-4.5 native"}
                  </div>
                  <div className="mt-1 text-[11px] text-gray-500">
                    {workflowTab === "wstv"
                      ? "Production-oriented continuity viewer with Canonical Anchor, preferred Extract Frame handoff, and Last Frame fallback."
                      : "Reference viewer for the Runway-native safe-handoff pattern, manual overrides, and stitched final assembly."}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 sm:p-5">
              {workflowTab === "wstv" ? <WSTVWorkflowDiagram /> : <RunwayOfficialWorkflowDiagram />}
            </div>
          </div>
        </div>
      )}

      {/* ── CUSTOM ANIMAL MODAL ─────────────────────────────────────────────── */}
      {customModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-base font-extrabold text-gray-900">➕ Add Custom Animal</div>
              <button type="button" onClick={() => setCustomModalOpen(false)}
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100">
                Close
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Animal name</label>
                <input value={customForm.name} onChange={(e) => setCustomForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g., Mountain Lion"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Opposing animals (comma-separated)</label>
                <input value={customForm.prey} onChange={(e) => setCustomForm((p) => ({ ...p, prey: e.target.value }))}
                  placeholder="e.g., White-tailed Deer, Elk"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-gray-600">Environment</label>
                <select value={customForm.environment} onChange={(e) => setCustomForm((p) => ({ ...p, environment: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm">
                  {Object.entries(habitatPromptMap).map(([label, prompt]) => (
                    <option key={label} value={prompt}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Default Arc</label>
                <select value={customForm.defaultArc} onChange={(e) => setCustomForm((p) => ({ ...p, defaultArc: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm">
                  {arcs.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Drift Risk</label>
                <select value={customForm.driftRisk} onChange={(e) => setCustomForm((p) => ({ ...p, driftRisk: e.target.value as "LOW" | "MEDIUM" | "HIGH" }))}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm">
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                </select>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const name = customForm.name.trim();
                  if (!name) return;
                  const builtInAnimalExists = Object.prototype.hasOwnProperty.call(predatorData, name);
                  if (builtInAnimalExists) { alert("This animal already exists in the built-in list."); return; }
                  const normalizedName = name.toLowerCase();
                  const normalizedPrey = Array.from(new Set(customForm.prey.split(",").map((item) => item.trim()).filter(Boolean)));
                  const entry: CustomPredatorForm = {
                    name,
                    prey: normalizedPrey.length ? normalizedPrey.join(", ") : "White-tailed Deer",
                    environment: customForm.environment.trim() || habitatPromptMap["Rocky Mountain Meadow"],
                    defaultArc: customForm.defaultArc || "Pack hunting strategy",
                    driftRisk: customForm.driftRisk,
                  };
                  setCustomPredators((prev) => {
                    const next = prev.filter((x) => x.name.trim().toLowerCase() !== normalizedName).concat(entry);
                    writeCustomPredators(next);
                    return next;
                  });
                  setPredator(name);
                  setPrey(normalizedPrey[0] || DEFAULT_PREY);
                  setArc(suggestArc(name, normalizedPrey[0] || DEFAULT_PREY, entry.defaultArc) as Arc);
                  setHabitat(DEFAULT_HABITAT);
                  setCustomModalOpen(false);
                }}
                className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-black active:scale-[0.98]"
              >
                Save & Select
              </button>
              <button
                type="button"
                onClick={() => {
                  const name = customForm.name.trim();
                  if (!name) return;
                  setCustomPredators((prev) => { const next = prev.filter((x) => x.name.trim().toLowerCase() !== name.toLowerCase()); writeCustomPredators(next); return next; });
                  if (predator === name) { setPredator(DEFAULT_PREDATOR); setPrey(DEFAULT_PREY); setArc(DEFAULT_ARC); setWeather(DEFAULT_WEATHER); setHabitat(DEFAULT_HABITAT); setDepthMode(DEFAULT_DEPTH_MODE); setEmotionalTone(DEFAULT_EMOTIONAL_TONE); setAnimalVibe(DEFAULT_ANIMAL_VIBE); }
                  setCustomModalOpen(false);
                }}
                className="rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-bold text-red-700 hover:bg-red-100 active:scale-[0.98]"
              >
                Delete
              </button>
            </div>
            <p className="mt-3 text-[11px] text-gray-400">
              Save गरेपछि यो animal dropdown मा add हुन्छ र future sessions मा पनि रहन्छ (localStorage).
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
