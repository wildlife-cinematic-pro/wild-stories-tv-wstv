// file: app/page.tsx
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

import { getQualityRecommendations } from "@/lib/recommendations";

import {
  predatorData,
  suggestArc,
  emotionalTones,
  animalVibes,
  buildFiveShotCinematic,
  buildFiveShotViral,
  buildWatchTimeReport,
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

type QualityState = {
  realismMode: RealismMode;
  motionOnlyI2V: boolean;
  referenceLock: boolean;
  singleActionRule: boolean;
  microMotion: boolean;
  heroVeo: boolean;
};

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
    environment,
    lighting,
    cameraGear,
    texture,
    defaultArc,
    driftRisk,
  };
}

function StepPill({
  step,
  active,
  label,
  onClick,
}: {
  step: Step;
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-extrabold transition-all active:scale-[0.98] ${
        active
          ? "border-gray-900 bg-gray-900 text-white"
          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
      }`}
    >
      <span
        className={`grid h-5 w-5 place-items-center rounded-full text-[11px] ${
          active ? "bg-white/15" : "bg-gray-100"
        }`}
      >
        {step}
      </span>
      {label}
    </button>
  );
}

function ModelCard({
  active,
  tag,
  title,
  subtitle,
  onClick,
  tone,
}: {
  active: boolean;
  tag: string;
  title: string;
  subtitle: string;
  onClick: () => void;
  tone: "green" | "blue";
}) {
  const isGreen = tone === "green";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border p-4 text-left transition-all active:scale-[0.99] ${
        active
          ? isGreen
            ? "border-green-400 bg-green-50"
            : "border-blue-400 bg-blue-50"
          : "border-gray-200 bg-white hover:bg-gray-50"
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span
          className={`rounded px-2 py-0.5 text-[10px] font-extrabold ${
            isGreen ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
          }`}
        >
          {tag}
        </span>
        {active && (
          <span
            className={`rounded px-2 py-0.5 text-[10px] font-extrabold ${
              isGreen ? "bg-green-600 text-white" : "bg-blue-600 text-white"
            }`}
          >
            Selected
          </span>
        )}
      </div>
      <div className="text-sm font-extrabold text-gray-900">{title}</div>
      <div className="mt-1 text-xs leading-relaxed text-gray-600">{subtitle}</div>
    </button>
  );
}

export default function Page() {
  // STEP 1 (basic inputs)
  const [predator, setPredator] = useState("Wolf Pack");
const [prey, setPrey] = useState("Elk");
const [arc, setArc] = useState<Arc>("Pack hunting strategy");
  const [weather, setWeather] = useState<Weather>("Dawn");
const [habitat, setHabitat] = useState<HabitatPreset>("Auto");
const [depthMode, setDepthMode] = useState<DepthMode>("Balanced Depth");
const [emotionalTone, setEmotionalTone] = useState<EmotionalTone>("Raw Tension");
const [animalVibe, setAnimalVibe] = useState<AnimalVibe>("National Geographic Wild");

  // STEP 2 (engine + quality)
    const [runwayModel, setRunwayModel] = useState<RunwayModel>(RUNWAY_MODELS[0]);
  const [klingModel, setKlingModel] = useState<KlingModel>(KLING_MODELS[0]);
  const [imagePromptTarget, setImagePromptTarget] = useState<ImagePromptTarget>("NANO_BANANA_2");

  const [realismMode, setRealismMode] = useState<RealismMode>("Reference Locked");
  const [motionOnlyI2V, setMotionOnlyI2V] = useState(true);
  const [referenceLock, setReferenceLock] = useState(true);
  const [singleActionRule, setSingleActionRule] = useState(true);
  const [microMotion, setMicroMotion] = useState(true);
  const [heroVeo, setHeroVeo] = useState(false);

  // ✅ Auto-apply + Undo states
  const [autoApplyHighDrift, setAutoApplyHighDrift] = useState(false);
  const [lastQualityBeforeApply, setLastQualityBeforeApply] = useState<QualityState | null>(null);

  const [sceneNepaliRomanized, setSceneNepaliRomanized] = useState("");
  const [sceneMode, setSceneMode] = useState<"romanized" | "english">("romanized");

  const [mediaAnalysis, setMediaAnalysis] = useState<MediaAnalysisResult | null>(null);

  // STEP 3 (generate)
  const [activeProvider, setActiveProvider] = useState<AIProvider>("none");
  const [pkg, setPkg] = useState<GeneratedPackage | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  // Stepper
  const [step, setStep] = useState<Step>(1);

  // ✅ Custom Predators (user-added)
  const [customPredators, setCustomPredators] = useState<CustomPredatorForm[]>([]);
  const [customModalOpen, setCustomModalOpen] = useState(false);

  const [customForm, setCustomForm] = useState<{
    name: string;
    prey: string; // comma separated
    environment: string;
    defaultArc: string;
    driftRisk: "LOW" | "MEDIUM" | "HIGH";
  }>({
    name: "",
    prey: "",
    environment: "",
    defaultArc: "Ambush attack",
    driftRisk: "MEDIUM",
  });

  const predatorOptions = useMemo(() => {
  const base = Object.keys(predatorData);
  const extra = customPredators.map((p) => p.name);

  const usaPriority = [
  "Wolf Pack",
  "Wolf",
    "Mountain Lion",
    "Grizzly Bear",
    "Bald Eagle",
    "Alligator",
    "Bison",
    "Bull Elk",
    "Moose",
    "Cougar",
    "Bobcat",
    "Black Bear",
    "Coyote",
    "Raccoon",
    "Red Fox",
    "Great Horned Owl",
    "Beaver",
    "River Otter",
    "Badger",
    "White-tailed Deer",
    "Wild Boar",
    "Dolphin",
    "Orca",
    "Shark",
  ];

  const all = Array.from(new Set([...base, ...extra]));

  return all.sort((a, b) => {
    const ai = usaPriority.indexOf(a);
    const bi = usaPriority.indexOf(b);

    const aPinned = ai !== -1;
    const bPinned = bi !== -1;

    if (aPinned && bPinned) return ai - bi;
    if (aPinned) return -1;
    if (bPinned) return 1;

    return a.localeCompare(b);
  });
}, [customPredators]);

  const lionFallback = useMemo<NormalizedPreset>(() => {
    const rawLion = (predatorData as Record<string, unknown>)["Lion"];
    return normalizePreset(rawLion, {
      prey: ["Deer"],
      environment: "Savanna",
      lighting: "Natural light",
      cameraGear: "Telephoto lens",
      texture: "Fine fur detail",
      driftRisk: "MEDIUM",
            defaultArc: "Ambush attack",
    });
  }, []);

  // ✅ preset: built-in predatorData else custom predator fallback
  const preset = useMemo<NormalizedPreset>(() => {
    const raw = (predatorData as Record<string, unknown>)[predator];
    if (raw !== undefined) return normalizePreset(raw, lionFallback);

    const custom = customPredators.find((p) => p.name === predator);
    if (!custom) return lionFallback;

    const preyList = custom.prey
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    return normalizePreset(
      {
        prey: preyList.length ? preyList : ["Deer"],
        environment: custom.environment || "Savanna",
        lighting: "Natural light",
        cameraGear: "Telephoto lens",
        texture: "Fine fur detail",
        driftRisk: custom.driftRisk,
                defaultArc: custom.defaultArc || "Ambush attack",
      },
      lionFallback
    );
  }, [predator, lionFallback, customPredators]);

  const finalEnvironment =
  habitat === "Auto" ? preset.environment : habitatPromptMap[habitat];

  // ✅ Quality recommendations (AFTER preset)
  const qualityReco = useMemo(() => {
    return getQualityRecommendations({
      driftRisk: preset.driftRisk,
      realismMode,
      runwayModel,
      klingModel,
      motionOnlyI2V,
      referenceLock,
      singleActionRule,
      microMotion,
      heroVeo,
    });
  }, [
    preset.driftRisk,
    realismMode,
    runwayModel,
    klingModel,
    motionOnlyI2V,
    referenceLock,
    singleActionRule,
    microMotion,
    heroVeo,
  ]);

  function captureCurrentQuality(): QualityState {
    return {
      realismMode,
      motionOnlyI2V,
      referenceLock,
      singleActionRule,
      microMotion,
      heroVeo,
    };
  }

  function applyQualityState(s: QualityState) {
    setRealismMode(s.realismMode);
    setMotionOnlyI2V(s.motionOnlyI2V);
    setReferenceLock(s.referenceLock);
    setSingleActionRule(s.singleActionRule);
    setMicroMotion(s.microMotion);
    setHeroVeo(s.heroVeo);
  }

  function applyRecommendedQuality() {
    // ✅ Save "before" so Undo can restore
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

  // ✅ Auto-apply on HIGH drift (power users) — apply once per combo
  const lastAutoAppliedKeyRef = useRef<string>("");

  useEffect(() => {
    if (!autoApplyHighDrift) return;
    if (qualityReco.level !== "HIGH") return;

    const key = [
      predator,
      prey,
      String(arc),
      preset.driftRisk,
      runwayModel,
      klingModel,
    ].join("|");

    if (lastAutoAppliedKeyRef.current === key) return;
    lastAutoAppliedKeyRef.current = key;

    applyRecommendedQuality();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoApplyHighDrift, qualityReco.level, predator, prey, arc, preset.driftRisk, runwayModel, klingModel]);

  // Load settings
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
    if (saved?.realismMode) setRealismMode(saved.realismMode);
    if (saved?.motionOnlyI2V !== undefined) setMotionOnlyI2V(saved.motionOnlyI2V);
    if (saved?.referenceLock !== undefined) setReferenceLock(saved.referenceLock);
    if (saved?.singleActionRule !== undefined) setSingleActionRule(saved.singleActionRule);
    if (saved?.microMotion !== undefined) setMicroMotion(saved.microMotion);
    if (saved?.heroVeo !== undefined) setHeroVeo(saved.heroVeo);
    if (saved?.habitat) setHabitat(saved.habitat);

    // ✅ persist auto-apply toggle (safe even if older settings type)
    const aa = (saved as Record<string, unknown>)?.autoApplyHighDrift;
    if (typeof aa === "boolean") setAutoApplyHighDrift(aa);
  }, []);

 useEffect(() => {
  writeSettings({
    activeProvider,
    realismMode,
    motionOnlyI2V,
    referenceLock,
    singleActionRule,
    microMotion,
    heroVeo,
    autoApplyHighDrift,
    habitat,
  });
}, [
  activeProvider,
  realismMode,
  motionOnlyI2V,
  referenceLock,
  singleActionRule,
  microMotion,
  heroVeo,
  autoApplyHighDrift,
   habitat,
]);

useEffect(() => {
  writeShareState({
    predator,
    prey,
    arc,
    weather,
    depthMode,
    habitat,
  });
}, [predator, prey, arc, weather, depthMode, habitat]);
  
  // ✅ Load custom predators once
  useEffect(() => {
    const savedCustom = readCustomPredators();
    setCustomPredators(savedCustom);
  }, []);

 useEffect(() => {
  if (!preset.prey.length) return;

  const nextPrey = preset.prey.includes(prey) ? prey : preset.prey[0];

  if (!preset.prey.includes(prey)) {
    setPrey(nextPrey);
  }

  setArc(suggestArc(predator, nextPrey, preset.defaultArc) as Arc);
}, [predator, prey, preset.prey, preset.defaultArc]);

  async function handleGenerate() {
  setIsGenerating(true);
  setError("");
  setPkg(null);

  try {
    console.log("GENERATE PREDATOR =", predator);

    if (!predator || !prey) throw new Error("Missing predator or prey");

      const finalArc = suggestArc(predator, prey, arc) as Arc;

      const safeMedia = (mediaAnalysis ?? null) as SafeMediaAnalysis | null;
      const sceneInjectFromMedia = safeMedia?.imagePromptInject ?? "";
      const sceneInjectFromUser = sceneNepaliRomanized.trim();

      const sceneInject =
        sceneInjectFromUser.length > 0 ? sceneInjectFromUser : sceneInjectFromMedia;

      const quality = {
        realismMode,
        motionOnlyI2V,
        referenceLock,
        singleActionRule,
        microMotion,
        heroVeo,
      };

            const imagePrompt = buildImagePrompt(
        predator,
        prey,
        finalEnvironment,
        finalArc,
        preset.lighting,
        preset.cameraGear,
        preset.texture,
        depthMode,
        weather,
        emotionalTone,
        animalVibe,
        sceneInject,
        quality,
        imagePromptTarget
      );

      const runway = buildRunwayShots(
        predator,
        prey,
        finalEnvironment,
        finalArc,
        weather,
        runwayModel,
        emotionalTone,
        animalVibe,
        sceneInject,
        quality
      );

      const kling = buildKlingShots(
        predator,
        prey,
        finalEnvironment,
        finalArc,
        weather,
        klingModel,
        emotionalTone,
        animalVibe,
        sceneInject,
        quality
      );

      const klingNative15s = buildKlingNative15s(
        predator,
        prey,
        finalEnvironment,
        finalArc,
        weather,
        klingModel,
        emotionalTone,
        animalVibe,
        sceneInject,
        quality
      );

      const klingSixShot = buildKlingSixShot(
        predator,
        prey,
        finalEnvironment,
        finalArc,
        weather,
        klingModel,
        emotionalTone,
        animalVibe,
        sceneInject,
        quality
      );

      const negativePromptForKling = buildNegativePrompt(predator);

     const thumbnailPrompt = buildThumbnailPrompt(
  predator,
  prey,
  finalEnvironment,
  weather,
  emotionalTone,
  animalVibe
);
      const voiceoverLine = buildVoiceoverLine(predator, prey, finalEnvironment, emotionalTone);
      const capCutPlan = buildCapCutPlan(predator, finalArc, weather);
      const clipChaining = buildClipChaining(predator, preset.driftRisk);

      const hook2026 = build2026Hook(predator, prey, finalArc);
      const caption2026 = build2026Caption(predator, prey, finalEnvironment, finalArc);
      const cta = buildCTA(finalArc);
      const hashtags = buildHashtags(predator, prey, finalArc);
      const recommendedHookIndex = getRecommendedHookIndex(finalArc);

      const presetForIdeas = {
  ...preset,
  environment: finalEnvironment,
};
    const tenIdeas = build10Ideas(predator, preset.prey, presetForIdeas as never);

      const platformPack = buildPlatformPack(predator, prey, finalArc, finalEnvironment);
      const seoTitle = buildSEOTitle(predator, prey, finalArc);
      const altTextPrompt = buildAltTextPrompt(predator, prey, finalEnvironment, finalArc);

      const qualitySummary = buildQualitySummary(quality);
      const referenceWorkflow = buildReferenceWorkflow(predator, quality);
      const naturalismChecklist = buildNaturalismChecklist(quality, weather, finalEnvironment);

      const fiveShotCinematic = buildFiveShotCinematic(
        predator,
        prey,
        finalEnvironment,
        finalArc,
        weather,
        runwayModel,
        klingModel,
        emotionalTone,
        animalVibe,
        quality
      );

      const fiveShotViral = buildFiveShotViral(
        predator,
        prey,
        finalEnvironment,
        finalArc,
        weather,
        runwayModel,
        klingModel,
        emotionalTone,
        animalVibe,
        quality
      );

      const watchTimeReport = buildWatchTimeReport("5-shot", 2);
      const motionStrength = arcMotionStrength[finalArc] ?? 70;
    
   const soundDesignPack = buildSoundDesignPack(
  predator,
  prey,
  finalEnvironment,
  finalArc,
  weather,
  klingModel
);

const animalBehaviorResult = getAnimalBehavior(predator);

      const basePkg: GeneratedPackage = {
        predatorName: predator,
        preyName: prey,
        arcName: finalArc,

        imagePrompt,
        negativePrompt: negativePromptForKling,
        thumbnailPrompt,
        voiceoverLine,

        runwayShots: [runway?.shot1 ?? "", runway?.shot2 ?? "", runway?.shot3 ?? ""],
        klingShots: [kling?.shot1 ?? "", kling?.shot2 ?? "", kling?.shot3 ?? ""],

        klingNative15s,
        klingSixShot,

        motionStrength,
        capCutPlan,
        clipChaining,

        hook: hook2026?.[0] ?? "",
        hook2026: hook2026 ?? [],
        recommendedHookIndex,
        caption: caption2026 ?? "",
        caption2026: caption2026 ?? "",
        cta,
        hashtags,
        tenIdeas,

        shotPlan: [
          {
            engine: "RUNWAY",
            title: "Establishing",
            prompt: runway?.shot1 ?? "",
            motionStrength,
            why: "Camera-first cinematic intro",
          },
          {
            engine: "KLING",
            title: "Action",
            prompt: kling?.shot2 ?? "",
            motionStrength,
            why: "Body mechanics + physics peak",
          },
          {
            engine: "RUNWAY",
            title: "Aftermath",
            prompt: runway?.shot3 ?? "",
            motionStrength,
            why: "Cinematic resolve pull-back",
          },
        ],
        runwayBundle: [runway?.shot1 ?? "", runway?.shot2 ?? "", runway?.shot3 ?? ""].join(
          "\n\n---\n\n"
        ),
        klingBundle: [kling?.shot1 ?? "", kling?.shot2 ?? "", kling?.shot3 ?? ""].join(
          "\n\n---\n\n"
        ),
        routingNote: `Shot 1 → Runway ${runwayModel} | Shot 2 → Kling ${klingModel} | Shot 3 → Runway ${runwayModel}`,

        fiveShotCinematic,
        fiveShotViral,
        watchTimeReport,
        platformPack,

        seoTitle,
        altTextPrompt,
        qualitySummary,
        referenceWorkflow,
        naturalismChecklist,
        modelsUsed: { runway: runwayModel, kling: klingModel },
sceneDesc: sceneInject,
soundDesignPack,
animalBehavior: animalBehaviorResult ?? undefined,
      };
    const capCutScript = buildCapCutScript(
  predator,
  prey,
  finalArc,
  weather,
  basePkg,
  "5-shot"
);
    const twoPartViralPreset = shouldBuildTwoPartViralPreset(
  predator,
  prey,
  finalArc
)
  ? buildTwoPartViralPreset(
      predator,
      prey,
      finalEnvironment,
      weather,
      finalArc,
      runwayModel
    )
  : null;
      let enhanced: Partial<GeneratedPackage> = {};

      if (activeProvider !== "none") {
        const res = await fetch("/api/enhance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider: activeProvider,
            predator,
            prey,
            env: finalEnvironment,
            arc: finalArc,
            weather,
            emotionalTone,
            animalVibe,
            base: {
              imagePrompt,
              hook: hook2026?.[0] ?? "",
              caption: caption2026 ?? "",
              voiceoverLine,
            },
          }),
        });

        const data = await res.json().catch(() => ({} as unknown));
        if (!res.ok)
          throw new Error(((data as Record<string, unknown>)?.error as string) || `AI enhancement failed (${res.status})`);

        enhanced = { ...(data as Partial<GeneratedPackage>), aiEnhanced: true };
      }

      const finalPkg: GeneratedPackage = {
  ...enhanced,
  ...basePkg,
  capCutScript,
  ...(twoPartViralPreset
    ? {
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
      }
    : {}),
};

      setPkg(finalPkg);

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
          label: `GENERATE • ${activeProvider === "none" ? "Local" : activeProvider} • ${predator} vs ${prey} • ${String(finalArc ?? arc)}`,
          performanceNote: "",
        };

        appendPromptVersion(key, v);
      } catch {
        // ignore
      }

      setStep(3);
    } catch (e) {

      console.error("[generate error]", e);
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.75)] text-3xl font-extrabold tracking-tight">
          WILD STORIES TV (WSTV)
        </h1>
        <p className="mt-1 text-sm text-white/70 drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]">
  Step 1 → viral wildlife setup. Step 2 → visual engine & quality. Step 3 → generate for reels.
</p>
      </div>

      {/* Stepper */}
      <div className="mb-6 flex flex-wrap gap-2">
  <StepPill step={1} active={step === 1} label="Viral Wildlife Setup" onClick={() => setStep(1)} />
  <StepPill
    step={2}
    active={step === 2}
    label="Visual Engine & Quality"
    onClick={() => setStep(2)}
  />
  <StepPill
    step={3}
    active={step === 3}
    label="Generate for Reels"
    onClick={() => setStep(3)}
  />
</div>

      {/* STEP 1 */}
      {step === 1 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 text-xs font-extrabold uppercase tracking-widest text-gray-600">
            STEP 1
          </div>
          <h2 className="mb-4 text-lg font-extrabold text-gray-900">
  Viral Wildlife Setup
</h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">Apex Predator</label>
              <select
                value={predator}
                onChange={(e) => setPredator(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800"
              >
                {predatorOptions.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              {customPredators.length > 0 && (
                <p className="mt-1 text-[11px] text-gray-500">
                  Custom animals:{" "}
                  <span className="font-semibold text-gray-700">{customPredators.length}</span>
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">Survival Animal</label>
              <div className="flex gap-2">
                <input
                  value={prey}
                  onChange={(e) => setPrey(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800"
                  placeholder="Prey animal"
                />
                {preset.prey.length > 0 && (
                  <select
                    value=""
                    onChange={(e) => e.target.value && setPrey(e.target.value)}
                    className="rounded-lg border border-gray-300 bg-white px-2 py-2 text-xs text-gray-600"
                  >
                    <option value="">Suggestions</option>
                    {preset.prey.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
  <div>
    <label className="mb-1 block text-xs font-semibold text-gray-500">Conflict Arc</label>
    <select
      value={arc}
      onChange={(e) => setArc(e.target.value as Arc)}
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800"
    >
      {arcs.map((a) => (
        <option key={a} value={a}>
          {a}
        </option>
      ))}
    </select>
  </div>

  <div>
    <label className="mb-1 block text-xs font-semibold text-gray-500">Background / Habitat</label>
    <select
      value={habitat}
      onChange={(e) => setHabitat(e.target.value as HabitatPreset)}
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800"
    >
      {habitatOptions.map((h) => (
        <option key={h} value={h}>
          {h}
        </option>
      ))}
    </select>
  </div>

  <div>
    <label className="mb-1 block text-xs font-semibold text-gray-500">Scene Atmosphere</label>
    <select
      value={weather}
      onChange={(e) => setWeather(e.target.value as Weather)}
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800"
    >
      {weatherOptions.map((w) => (
        <option key={w} value={w}>
          {w}
        </option>
      ))}
    </select>
  </div>

  <div>
    <label className="mb-1 block text-xs font-semibold text-gray-500">Cinematic Depth</label>
    <select
      value={depthMode}
      onChange={(e) => setDepthMode(e.target.value as DepthMode)}
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800"
    >
      {depthModes.map((d) => (
        <option key={d} value={d}>
          {d}
        </option>
      ))}
    </select>
  </div>
</div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">
                Tension Level
              </label>
              <select
                value={emotionalTone}
                onChange={(e) => setEmotionalTone(e.target.value as EmotionalTone)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800"
              >
                {emotionalTones.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">Instinct Style</label>
              <select
                value={animalVibe}
                onChange={(e) => setAnimalVibe(e.target.value as AnimalVibe)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800"
              >
                {animalVibes.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-black active:scale-[0.98]"
            >
             Continue → Visual Engine & Quality
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 text-xs font-extrabold uppercase tracking-widest text-gray-600">
            STEP 2
          </div>
          <h2 className="mb-4 text-lg font-extrabold text-gray-900">
  Visual Engine & Quality
</h2>

          {/* ✅ Quality Automation panel */}
          <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-extrabold text-gray-900">🛡️ Quality Automation</div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
                    qualityReco.level === "HIGH"
                      ? "bg-red-100 text-red-700"
                      : qualityReco.level === "MEDIUM"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  Drift: {qualityReco.level}
                </span>
              </div>

              {/* ✅ Right-side controls: Toggle + Undo + Apply */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAutoApplyHighDrift((v) => !v)}
                  className={`rounded-xl border px-3 py-2 text-xs font-extrabold transition-all active:scale-95 ${
                    autoApplyHighDrift
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                  title="When ON, HIGH drift automatically applies recommended settings"
                >
                  {autoApplyHighDrift ? "⚡ Auto-apply: ON" : "⚡ Auto-apply: OFF"}
                </button>

                <button
                  type="button"
                  disabled={!lastQualityBeforeApply}
                  onClick={undoRecommendedQuality}
                  className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-extrabold text-gray-800 hover:bg-gray-50 disabled:opacity-50 active:scale-95"
                >
                  ↩ Undo
                </button>

                <button
                  type="button"
                  onClick={applyRecommendedQuality}
                  className="rounded-xl bg-gray-900 px-4 py-2 text-xs font-extrabold text-white hover:bg-black active:scale-95"
                >
                  ✅ Apply Recommended
                </button>
              </div>
            </div>

            {qualityReco.warnings.length > 0 ? (
              <div className="mt-3 space-y-2">
                {qualityReco.warnings.map((w) => (
                  <div
                    key={w.id}
                    className={`rounded-xl border p-3 text-sm ${
                      w.severity === "danger"
                        ? "border-red-200 bg-red-50"
                        : w.severity === "warning"
                          ? "border-amber-200 bg-amber-50"
                          : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="text-xs font-extrabold text-gray-900">{w.title}</div>
                    <div className="mt-1 text-xs text-gray-700">{w.detail}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                ✅ No critical warnings. Your quality settings look good.
              </div>
            )}

            {qualityReco.why.length > 0 && (
              <div className="mt-3 text-xs text-gray-500">
                <span className="font-extrabold text-gray-700">Why:</span>{" "}
                {qualityReco.why.join(" • ")}
              </div>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            {/* Left: Model Profile */}
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="text-sm font-extrabold text-gray-900">Model Profile</div>
                <span className="rounded bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-600">
                  prompts auto-adapt per model
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="mb-1 inline-flex rounded bg-green-100 px-2 py-0.5 text-[10px] font-extrabold text-green-700">
                    RUNWAY
                  </div>

                  {RUNWAY_MODELS.map((m) => (
                    <ModelCard
                      key={m}
                      tone="green"
                      tag="RUNWAY"
                      active={runwayModel === m}
                      title={m}
                      subtitle={
                        m === "Gen-4.5"
                          ? "Best realism, prompt adherence, hero shots"
                          : m === "Gen-4 Turbo"
                            ? "Fast draft choice — iterate quickly"
                            : "Stable cinematic shots"
                      }
                      onClick={() => setRunwayModel(m)}
                    />
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="mb-1 inline-flex rounded bg-blue-100 px-2 py-0.5 text-[10px] font-extrabold text-blue-700">
                    KLING
                  </div>

                  {KLING_MODELS.map((m) => (
                    <ModelCard
                      key={m}
                      tone="blue"
                      tag="KLING"
                      active={klingModel === m}
                      title={m}
                      subtitle={
                        m === "Kling 3.0 Pro"
                          ? "Strong action workflow — reference-led continuity, audio-capable, multi-shot friendly"
                          : m === "Kling 3.0 Standard"
  ? "Balanced action workflow — strong motion, reference-friendly"
                            : m === "Kling 2.6 Pro"
  ? "Earlier Kling workflow option"
  : m === "Kling 2.5 Turbo Pro"
    ? "Fast draft workflow"
    : "Fast image-to-video draft option"
                      }
                      onClick={() => setKlingModel(m)}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <QualityPanel
                  realismMode={realismMode}
                  setRealismMode={setRealismMode}
                  motionOnlyI2V={motionOnlyI2V}
                  setMotionOnlyI2V={setMotionOnlyI2V}
                  referenceLock={referenceLock}
                  setReferenceLock={setReferenceLock}
                  singleActionRule={singleActionRule}
                  setSingleActionRule={setSingleActionRule}
                  microMotion={microMotion}
                  setMicroMotion={setMicroMotion}
                  heroVeo={heroVeo}
                  setHeroVeo={setHeroVeo}
                />

                <div className="mt-3">
                  <label className="mb-1 block text-xs font-semibold text-gray-500">
                    Image Prompt Target
                  </label>
                  <select
                    value={imagePromptTarget}
                    onChange={(e) => setImagePromptTarget(e.target.value as ImagePromptTarget)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800"
                  >
                    <option value="NANO_BANANA_2">Nano Banana 2 (default)</option>
                    <option value="NB2">NB2 (legacy)</option>
                    <option value="RUNWAY">Runway Reference</option>
                    <option value="MJ">Midjourney</option>
                  </select>
                </div>

                {/* ✅ Reference tags helper (place right under Reference Lock controls) */}
                <div className="mt-2 rounded-lg border border-violet-200 bg-violet-50 p-3 text-xs text-violet-700">
                  <div className="font-semibold">
                    Reference tags (use in Runway/Kling references):
                  </div>
                  <div className="mt-1 space-y-0.5">
                    <div>
                      • Predator master →{" "}
                      <code className="rounded bg-white px-1 py-0.5 text-[11px] text-violet-800">
                        @hero_predator
                      </code>
                    </div>
                    <div>
                      • Prey master →{" "}
                      <code className="rounded bg-white px-1 py-0.5 text-[11px] text-violet-800">
                        @hero_prey
                      </code>
                    </div>
                    <div>
                      • Environment plate →{" "}
                      <code className="rounded bg-white px-1 py-0.5 text-[11px] text-violet-800">
                        @env_plate
                      </code>
                    </div>
                  </div>
                  <div className="mt-2 text-violet-600">
                    Tip: Video prompts मा appearance नलेख — reference image नै identity हो।
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Upload + Custom Predator + Scene Desc */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-extrabold text-gray-900">📎 Upload Wildlife Media</div>
                  <span className="rounded bg-purple-100 px-2 py-1 text-[11px] font-extrabold text-purple-700">
                    Image + Video → Auto Analyze → Same Look Prompts
                  </span>
                </div>

                <MediaAnalyzer
                  activeProvider={activeProvider}
                  analysis={mediaAnalysis}
                  onAnalysisComplete={setMediaAnalysis}
                  onClear={() => setMediaAnalysis(null)}
                />
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-extrabold text-gray-900">Custom Predator</div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-blue-100 px-2 py-1 text-[11px] font-extrabold text-blue-700">
                      AI-powered — any animal
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomForm({
                          name: "",
                          prey: "",
                          environment: finalEnvironment || "",
                          defaultArc: arc,
                          driftRisk: preset.driftRisk,
                        });
                        setCustomModalOpen(true);
                      }}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-blue-700 active:scale-[0.98]"
                    >
                      + Add Any Animal
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-orange-50 p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="text-sm font-extrabold text-gray-900">Scene Description</div>
                </div>

                <div className="mb-2 flex overflow-hidden rounded-xl border border-orange-200 bg-white">
                  <button
                    type="button"
                    onClick={() => setSceneMode("romanized")}
                    className={`flex-1 px-3 py-2 text-xs font-extrabold ${
                      sceneMode === "romanized"
                        ? "bg-orange-600 text-white"
                        : "text-orange-700 hover:bg-orange-50"
                    }`}
                  >
                    Nepali Romanized → Auto Translate
                  </button>
                  <button
                    type="button"
                    onClick={() => setSceneMode("english")}
                    className={`flex-1 px-3 py-2 text-xs font-extrabold ${
                      sceneMode === "english"
                        ? "bg-blue-600 text-white"
                        : "text-blue-700 hover:bg-blue-50"
                    }`}
                  >
                    Direct English
                  </button>
                </div>

                <textarea
                  value={sceneNepaliRomanized}
                  onChange={(e) => setSceneNepaliRomanized(e.target.value)}
                  placeholder={
                    sceneMode === "romanized"
                      ? "jastei: bag le bakhra lai khedaera euta rukh muni lagera bakhra khayo..."
                      : "Write the scene in English..."
                  }
                  className="min-h-[110px] w-full rounded-xl border border-orange-200 bg-white p-3 text-sm text-gray-900 outline-none placeholder:text-gray-400"
                />

                <div className="mt-3 flex flex-wrap gap-2">
                  {["Example 1", "Example 2", "Example 3", "Example 4"].map((x) => (
                    <button
                      key={x}
                      type="button"
                      onClick={() => setSceneNepaliRomanized(`${x}: bag le bakhra lai khedaera...`)}
                      className="rounded-lg border border-orange-200 bg-orange-100 px-3 py-1 text-xs font-extrabold text-orange-800 hover:bg-orange-200 active:scale-95"
                    >
                      {x}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() =>
                      alert(
                        "Auto-translate wiring: optional. For now, this text injects directly into prompts."
                      )
                    }
                    className="ml-auto rounded-xl bg-orange-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-orange-700 active:scale-[0.98]"
                  >
                    Translate to English →
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-extrabold text-gray-800 hover:bg-gray-50 active:scale-[0.98]"
            >
              ← Back (Step 1)
            </button>

            <button
              type="button"
              onClick={() => setStep(3)}
              className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-black active:scale-[0.98]"
            >
              Continue → Generate for Reels
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3 text-xs font-extrabold uppercase tracking-widest text-gray-600">
              STEP 3
            </div>
            <h2 className="mb-3 text-lg font-extrabold text-gray-900">Generate for Reels</h2>

            <div className="mb-3 flex flex-wrap gap-2">
              {(["none", "gemini", "claude"] as AIProvider[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setActiveProvider(p)}
                  className={`rounded-lg border px-4 py-2 text-xs font-semibold transition-all active:scale-95 ${
                    activeProvider === p
                      ? "border-gray-800 bg-gray-900 text-white"
                      : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {p === "none" ? "Off (Local)" : p === "gemini" ? "✦ Gemini" : "✦ Claude"}
                </button>
              ))}
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full rounded-xl bg-gray-900 py-3.5 text-sm font-bold text-white hover:bg-black disabled:opacity-60 active:scale-[0.98]"
            >
              {isGenerating ? "Generating..." : `⚡ Generate — ${predator} vs ${prey}`}
            </button>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-700">⚠️ {error}</p>
              </div>
            )}
          </div>

          {pkg && (
            <OutputCards
              data={pkg}
              onRestoreVersion={(v) => {
                setPkg((prev) => {
                  if (!prev) return prev;

                  const restored: GeneratedPackage = {
                    ...prev,
                    imagePrompt: v.imagePrompt,
                    hook: v.hook,
                    caption: v.caption,
                    voiceoverLine: v.voiceoverLine ?? prev.voiceoverLine,
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
                      label: `RESTORE v${v.version} • ${predator} vs ${prey}`,
                      performanceNote: "",
                    });
                  } catch {
                    // ignore
                  }

                  return restored;
                });
              }}
            />
          )}
        </div>
      )}

      {/* ✅ Custom Predator Modal */}
      {customModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="text-sm font-extrabold text-gray-900">➕ Add Any Animal</div>
              <button
                type="button"
                onClick={() => setCustomModalOpen(false)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-extrabold text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Animal name</label>
                <input
                  value={customForm.name}
                  onChange={(e) => setCustomForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g., Snow Leopard"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  Prey (comma separated)
                </label>
                <input
                  value={customForm.prey}
                  onChange={(e) => setCustomForm((p) => ({ ...p, prey: e.target.value }))}
                  placeholder="e.g., Deer, Goat, Boar"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-gray-600">Environment</label>
                <input
                  value={customForm.environment}
                  onChange={(e) => setCustomForm((p) => ({ ...p, environment: e.target.value }))}
                  placeholder="e.g., Jungle, Snowfield, Riverbank"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Default Arc</label>
                <input
                  value={customForm.defaultArc}
                  onChange={(e) => setCustomForm((p) => ({ ...p, defaultArc: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Drift risk</label>
                <select
                  value={customForm.driftRisk}
                  onChange={(e) =>
                    setCustomForm((p) => ({
                      ...p,
                      driftRisk: e.target.value as "LOW" | "MEDIUM" | "HIGH",
                    }))
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const name = customForm.name.trim();
                  if (!name) return;

                  const entry: CustomPredatorForm = {
                    name,
                    prey: customForm.prey.trim() || "Deer",
                    environment: customForm.environment.trim() || "Savanna",
                    defaultArc: customForm.defaultArc.trim() || "Ambush attack",
                    driftRisk: customForm.driftRisk,
                  };

                  setCustomPredators((prev) => {
                    const next = prev.filter((x) => x.name !== name).concat(entry);
                    writeCustomPredators(next);
                    return next;
                  });

                  setPredator(name);
                  setCustomModalOpen(false);
                }}
                className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-black active:scale-[0.98]"
              >
                Save & Select
              </button>

              <button
                type="button"
                onClick={() => {
                  const name = customForm.name.trim();
                  if (!name) return;
                  setCustomPredators((prev) => {
                    const next = prev.filter((x) => x.name !== name);
                    writeCustomPredators(next);
                    return next;
                  });
                  if (predator === name) setPredator("Lion");
                  setCustomModalOpen(false);
                }}
                className="rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-extrabold text-red-700 hover:bg-red-100 active:scale-[0.98]"
              >
                Delete If Exists
              </button>
            </div>

            <p className="mt-3 text-xs text-gray-500">
              Save गरेपछि यो predator dropdown मा add हुन्छ र future sessions मा पनि रहन्छ (localStorage).
            </p>
          </div>
        </div>
      )}
    <SettingsDrawer />
    </main>
  );
}
