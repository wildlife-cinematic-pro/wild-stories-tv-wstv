import { buildOpeningFrameInput } from "@/lib/build-package";
import {
  applyContentLaneEnvironmentBias,
  getLaneBiasedArc,
  getNearbyArcsForContentLane,
  getPreferredHabitatsForContentLane,
  getPreferredHookFamilyForContentLane,
  scoreContentLaneFit,
} from "@/lib/content-lanes";
import { habitatPromptMap } from "@/lib/habitat-presets";
import { buildAutoSceneDescription } from "@/lib/page-build-helpers";
import { getBestHookFamilyForDurationLane } from "@/lib/performanceMemory";
import {
  build2026HookByFamily,
  buildCTA,
  buildHashtags,
  buildLongCaption,
  buildShortCaption,
} from "@/lib/platform-packs";
import { suggestArc, suggestHabitat } from "@/lib/predator-data";
import { getQualityRecommendations } from "@/lib/recommendations";
import { buildUSViewsModeReport } from "@/lib/usViewsMode";

import type {
  Arc,
  ConceptVariant,
  ConceptVariantEmphasis,
  ConceptVariantLabWinners,
  ConceptVariantWinnerTag,
  ContentLane,
  DepthMode,
  DurationLane,
  HabitatPreset,
  HookFamily,
  KlingModel,
  PipelineStyle,
  PredatorInfo,
  RealismMode,
  RunwayModel,
  Weather,
} from "@/types";

type BlueprintTone =
  | "control"
  | "fast"
  | "opening"
  | "cinematic"
  | "realism"
  | "alternate";

type ConceptVariantBlueprint = {
  label: string;
  summary: string;
  hookFamily: HookFamily;
  arc: Arc;
  habitat: HabitatPreset;
  durationLane: DurationLane;
  fastPublishMode: boolean;
  emphasis: ConceptVariantEmphasis;
  sceneDescriptionVariant: number;
};

export type ConceptVariantLabInput = {
  predator: string;
  prey: string;
  contentLane: ContentLane;
  currentArc: Arc;
  currentHabitat: HabitatPreset;
  presetEnvironment: string;
  presetPrey: string[];
  driftRisk: PredatorInfo["driftRisk"];
  weather: Weather;
  depthMode: DepthMode;
  durationLane: DurationLane;
  fastPublishMode: boolean;
  strictOriginalityGuard: boolean;
  realismMode: RealismMode;
  runwayModel: RunwayModel;
  klingModel: KlingModel;
  motionOnlyI2V: boolean;
  referenceLock: boolean;
  singleActionRule: boolean;
  microMotion: boolean;
  heroVeo: boolean;
  currentHookFamily?: HookFamily;
};

function normalizeText(value: string): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function resolveEnvironment(
  habitat: HabitatPreset,
  predator: string,
  prey: string,
  presetEnvironment: string,
  contentLane: ContentLane,
  arc: Arc
): string {
  const baseEnvironment =
    habitat === "Auto"
      ? suggestHabitat(predator, prey, presetEnvironment)
      : habitatPromptMap[habitat];

  return habitat === "Auto"
    ? applyContentLaneEnvironmentBias(
        contentLane,
        predator,
        prey,
        baseEnvironment,
        arc
      )
    : baseEnvironment;
}

function toPipelineStyle(durationLane: DurationLane): PipelineStyle {
  return durationLane === "long" ? "long-hybrid-4-shot" : "4-shot";
}

function guessHabitatPresetFromEnvironment(
  environment: string
): Exclude<HabitatPreset, "Auto"> {
  const normalized = normalizeText(environment);

  if (/everglades|sawgrass|marsh|wetland/.test(normalized)) return "Everglades Marsh";
  if (/cypress|swamp|moss/.test(normalized)) return "Cypress Swamp Edge";
  if (/river|reed|shore|bank|cattail/.test(normalized)) return "Riverbank Reeds";
  if (/coastal|cliff|ocean|salt air|pacific/.test(normalized)) return "Coastal Cliffline";
  if (/desert|scrub|sandy|creosote/.test(normalized)) return "Desert Scrubland";
  if (/snow|tundra|frozen|arctic|subarctic|ice/.test(normalized)) return "Snow Field Tundra";
  if (/prairie|plain|grassland|sagebrush|great plains/.test(normalized)) {
    return "Open Prairie Grassland";
  }
  if (/rocky|mountain|meadow|ridge|aspen/.test(normalized)) {
    return "Rocky Mountain Meadow";
  }

  return "Forest Clearing";
}

function getAlternateHabitat(
  habitat: Exclude<HabitatPreset, "Auto">
): Exclude<HabitatPreset, "Auto"> {
  const alternateMap: Record<
    Exclude<HabitatPreset, "Auto">,
    Exclude<HabitatPreset, "Auto">
  > = {
    "Rocky Mountain Meadow": "Forest Clearing",
    "Forest Clearing": "Rocky Mountain Meadow",
    "Open Prairie Grassland": "Dry Prairie Plain",
    "Dry Prairie Plain": "Open Prairie Grassland",
    "Everglades Marsh": "Cypress Swamp Edge",
    "Cypress Swamp Edge": "Riverbank Reeds",
    "Riverbank Reeds": "Everglades Marsh",
    "Snow Field Tundra": "Rocky Mountain Meadow",
    "Desert Scrubland": "Dry Prairie Plain",
    "Coastal Cliffline": "Open Prairie Grassland",
  };

  return alternateMap[habitat];
}

function buildPlausibleArcs(currentArc: Arc, suggestedArc: Arc): Arc[] {
  const seed = unique([currentArc, suggestedArc]);

  const map: Record<Arc, Arc[]> = {
    "Ambush attack": ["Escape from danger", "Chase and takedown"],
    "Predator vs predator fight": [
      "Territory dominance battle",
      "Defender stands ground",
    ],
    "Chase and takedown": ["Ambush attack", "Escape from danger"],
    "Escape from danger": ["Ambush attack", "Chase and takedown"],
    "Territory dominance battle": [
      "Defender stands ground",
      "Predator vs predator fight",
    ],
    "Pack hunting strategy": ["Chase and takedown", "Escape from danger"],
    "Defender stands ground": [
      "Territory dominance battle",
      "Predator vs predator fight",
    ],
    "Giant vs giant clash": [
      "Defender stands ground",
      "Territory dominance battle",
    ],
  };

  return unique([...seed, ...(map[suggestedArc] ?? []), ...(map[currentArc] ?? [])]);
}

function buildBlueprintLabel(contentLane: ContentLane, tone: BlueprintTone): string {
  const labels: Record<Exclude<ContentLane, "Auto">, Record<BlueprintTone, string>> = {
    "Pack Hunt": {
      control: "Pack Control",
      fast: "Closing Pressure",
      opening: "Lane Collapse",
      cinematic: "Wide Pursuit",
      realism: "Grounded Pursuit",
      alternate: "Nearby Break",
    },
    Defender: {
      control: "Hold Ground",
      fast: "Warning Step",
      opening: "Defender Read",
      cinematic: "Stand-Off Hold",
      realism: "Grounded Stand",
      alternate: "Counter Pressure",
    },
    "Fishing Strike": {
      control: "Strike Window",
      fast: "Waterline Burst",
      opening: "Fishing Opener",
      cinematic: "Clean Setup",
      realism: "Grounded Waterline",
      alternate: "Late Turn",
    },
    "Rut Battle": {
      control: "Clash Control",
      fast: "Dominance Burst",
      opening: "Rut Opener",
      cinematic: "Standoff Hold",
      realism: "Grounded Clash",
      alternate: "Power Shift",
    },
    Escape: {
      control: "Survival Read",
      fast: "Breakaway Burst",
      opening: "Escape Opener",
      cinematic: "Wide Exit",
      realism: "Grounded Escape",
      alternate: "Late Recovery",
    },
  };

  if (contentLane === "Auto") {
    const autoLabels: Record<BlueprintTone, string> = {
      control: "Baseline Control",
      fast: "Fast Publish",
      opening: "Opening Read",
      cinematic: "Cinematic Hold",
      realism: "Grounded Pass",
      alternate: "Nearby Alternate",
    };

    return autoLabels[tone];
  }

  return labels[contentLane][tone];
}

function buildBlueprintSummary(
  contentLane: ContentLane,
  tone: BlueprintTone
): string {
  if (contentLane === "Auto") {
    const autoSummaries: Record<BlueprintTone, string> = {
      control:
        "Balanced baseline closest to the current setup, scored as the clean control.",
      fast:
        "Fast-publish pressure lane with a tighter opening and a short release rhythm.",
      opening:
        "Opening-frame first pass that pushes immediate threat readability.",
      cinematic:
        "Cinematic hold with a slower payoff lane when the concept can support more build.",
      realism:
        "Realism-weighted pass that keeps the habitat grounded and the pressure more natural.",
      alternate:
        "Nearby alternate story beat that changes the read without forcing a hard concept drift.",
    };

    return autoSummaries[tone];
  }

  const laneSummaries: Record<Exclude<ContentLane, "Auto">, Record<BlueprintTone, string>> = {
    "Pack Hunt": {
      control:
        "Baseline pack-control pass with readable group pressure and clean chase spacing.",
      fast:
        "Fast-publish pack pressure pass that collapses the lane earlier and hits harder upfront.",
      opening:
        "Opening-first pass built around the instant the escape lane disappears.",
      cinematic:
        "Cinematic pursuit pass with wider spacing and a slower pressure build before the turn.",
      realism:
        "Grounded pursuit pass that keeps the pack pressure believable and the lane readable.",
      alternate:
        "Nearby pack-adjacent beat that stays inside chase pressure without drifting out of lane.",
    },
    Defender: {
      control:
        "Baseline defender pass that holds ground early and keeps the posture readable.",
      fast:
        "Fast-publish defender pass built around the warning step and immediate pressure turn.",
      opening:
        "Opening-first defender tension pass that sells the refusal to yield right away.",
      cinematic:
        "Cinematic hold that gives the stand-off room before the defender takes control.",
      realism:
        "Grounded defender pass with cleaner footing, spacing, and believable stand-your-ground pressure.",
      alternate:
        "Nearby defender-adjacent beat that shifts the tension without losing the hold-ground logic.",
    },
    "Fishing Strike": {
      control:
        "Baseline strike-window pass that keeps the waterline read clean and the setup sharp.",
      fast:
        "Fast-publish strike pass with an earlier waterline burst and tighter surface timing.",
      opening:
        "Opening-first fishing pass built around the exact beat where the strike zone closes.",
      cinematic:
        "Cinematic strike setup with calmer water spacing before the hit lands.",
      realism:
        "Grounded waterline pass that keeps the strike believable and the habitat consistent.",
      alternate:
        "Nearby strike-adjacent beat that stays in the shallow-water logic instead of drifting generic.",
    },
    "Rut Battle": {
      control:
        "Baseline rut pass that keeps dominance posture and clash spacing readable from the start.",
      fast:
        "Fast-publish rut pass with a quicker dominance burst and earlier body-language payoff.",
      opening:
        "Opening-first clash pass that sells the stance and pending impact immediately.",
      cinematic:
        "Cinematic rut hold with a slower dominance build before the heavy contact read.",
      realism:
        "Grounded clash pass that keeps the rut-season field feel and heavy-body realism intact.",
      alternate:
        "Nearby rut-adjacent beat that shifts the control without losing the dominance lane.",
    },
    Escape: {
      control:
        "Baseline escape pass that keeps the survival line clean and the pressure readable.",
      fast:
        "Fast-publish escape pass with a tighter near-miss turn and a sharper breakaway beat.",
      opening:
        "Opening-first survival pass built around the instant the exit window reopens.",
      cinematic:
        "Cinematic escape hold with wider spacing before the breakaway payoff lands.",
      realism:
        "Grounded survival pass that keeps the movement believable and the escape lane clean.",
      alternate:
        "Nearby escape-adjacent beat that stays inside survival pressure without drifting into a different reel type.",
    },
  };

  return laneSummaries[contentLane][tone];
}

function getLaneHookFamilyPool(
  contentLane: ContentLane,
  currentHookFamily: HookFamily
): HookFamily[] {
  if (contentLane === "Auto") {
    return unique([
      currentHookFamily,
      "danger" as HookFamily,
      "curiosity" as HookFamily,
      "reversal" as HookFamily,
    ]);
  }

  const preferredHookFamily =
    getPreferredHookFamilyForContentLane(contentLane) ?? currentHookFamily;

  switch (contentLane) {
    case "Defender":
      return unique([preferredHookFamily, "curiosity", "danger", currentHookFamily]);
    case "Rut Battle":
      return unique([preferredHookFamily, "reversal", "danger", currentHookFamily]);
    case "Escape":
      return unique([preferredHookFamily, "reversal", "curiosity", currentHookFamily]);
    default:
      return unique([preferredHookFamily, "curiosity", "reversal", currentHookFamily]);
  }
}

function buildHabitatPool(
  contentLane: ContentLane,
  currentHabitat: HabitatPreset,
  explicitHabitat: Exclude<HabitatPreset, "Auto">
): HabitatPreset[] {
  if (contentLane === "Auto") {
    return unique([
      currentHabitat === "Auto" ? explicitHabitat : currentHabitat,
      explicitHabitat,
      getAlternateHabitat(explicitHabitat),
    ]);
  }

  return unique([
    ...getPreferredHabitatsForContentLane(contentLane),
    currentHabitat === "Auto" ? explicitHabitat : currentHabitat,
    explicitHabitat,
    getAlternateHabitat(explicitHabitat),
  ]);
}

function buildArcPool(
  contentLane: ContentLane,
  currentArc: Arc,
  suggestedArc: Arc
): Arc[] {
  const plausibleArcs = buildPlausibleArcs(currentArc, suggestedArc);

  if (contentLane === "Auto") {
    return plausibleArcs;
  }

  return unique([
    suggestedArc,
    currentArc,
    ...getNearbyArcsForContentLane(contentLane),
    ...plausibleArcs,
  ]).filter((arc) => {
    const nearbyArcs = getNearbyArcsForContentLane(contentLane);
    return nearbyArcs.length === 0 || nearbyArcs.includes(arc) || arc === suggestedArc;
  });
}

function pickFirstMatchingArc(
  arcPool: Arc[],
  priorities: Arc[],
  fallback: Arc
): Arc {
  return priorities.find((arc) => arcPool.includes(arc)) ?? fallback;
}

function buildBlueprints(
  input: ConceptVariantLabInput,
  currentHookFamily: HookFamily,
  suggestedArc: Arc,
  explicitHabitat: Exclude<HabitatPreset, "Auto">
): ConceptVariantBlueprint[] {
  const shortDefaultHook = getBestHookFamilyForDurationLane("short") ?? "danger";
  const longDefaultHook = getBestHookFamilyForDurationLane("long") ?? "curiosity";
  const arcPool = buildArcPool(input.contentLane, input.currentArc, suggestedArc);
  const habitatPool = buildHabitatPool(
    input.contentLane,
    input.currentHabitat,
    explicitHabitat
  );
  const hookFamilyPool = getLaneHookFamilyPool(input.contentLane, currentHookFamily);
  const controlArc = pickFirstMatchingArc(
    arcPool,
    [input.currentArc, suggestedArc, ...arcPool],
    suggestedArc
  );

  if (input.contentLane === "Auto") {
    const openingArc = pickFirstMatchingArc(
      arcPool,
      ["Ambush attack", "Chase and takedown", "Escape from danger"],
      suggestedArc
    );
    const alternateArc = arcPool.find((arc) => arc !== controlArc) ?? suggestedArc;

    return [
      {
        label: buildBlueprintLabel("Auto", "control"),
        summary: buildBlueprintSummary("Auto", "control"),
        hookFamily: currentHookFamily,
        arc: controlArc,
        habitat: habitatPool[0] ?? explicitHabitat,
        durationLane: input.durationLane,
        fastPublishMode: input.fastPublishMode,
        emphasis: "balanced",
        sceneDescriptionVariant: 0,
      },
      {
        label: buildBlueprintLabel("Auto", "fast"),
        summary: buildBlueprintSummary("Auto", "fast"),
        hookFamily: shortDefaultHook,
        arc: suggestedArc,
        habitat: habitatPool[0] ?? explicitHabitat,
        durationLane: "short",
        fastPublishMode: true,
        emphasis: "fast-publish",
        sceneDescriptionVariant: 1,
      },
      {
        label: buildBlueprintLabel("Auto", "opening"),
        summary: buildBlueprintSummary("Auto", "opening"),
        hookFamily: "danger",
        arc: openingArc,
        habitat: habitatPool[1] ?? habitatPool[0] ?? explicitHabitat,
        durationLane: "short",
        fastPublishMode: true,
        emphasis: "balanced",
        sceneDescriptionVariant: 2,
      },
      {
        label: buildBlueprintLabel("Auto", "cinematic"),
        summary: buildBlueprintSummary("Auto", "cinematic"),
        hookFamily: longDefaultHook,
        arc: controlArc,
        habitat: habitatPool[1] ?? habitatPool[0] ?? explicitHabitat,
        durationLane: "long",
        fastPublishMode: false,
        emphasis: "cinematic",
        sceneDescriptionVariant: 0,
      },
      {
        label: buildBlueprintLabel("Auto", "realism"),
        summary: buildBlueprintSummary("Auto", "realism"),
        hookFamily: "curiosity",
        arc: controlArc,
        habitat: explicitHabitat,
        durationLane: "short",
        fastPublishMode: false,
        emphasis: "cinematic",
        sceneDescriptionVariant: 1,
      },
      {
        label: buildBlueprintLabel("Auto", "alternate"),
        summary: buildBlueprintSummary("Auto", "alternate"),
        hookFamily: "reversal",
        arc: alternateArc,
        habitat: habitatPool[2] ?? habitatPool[1] ?? explicitHabitat,
        durationLane: input.durationLane,
        fastPublishMode: input.fastPublishMode,
        emphasis: "balanced",
        sceneDescriptionVariant: 2,
      },
    ];
  }

  const spotlightArcPriorities: Record<Exclude<ContentLane, "Auto">, Arc[]> = {
    "Pack Hunt": ["Pack hunting strategy", "Chase and takedown", "Escape from danger"],
    Defender: ["Defender stands ground", "Territory dominance battle", "Giant vs giant clash"],
    "Fishing Strike": ["Ambush attack", "Chase and takedown", "Escape from danger"],
    "Rut Battle": ["Territory dominance battle", "Giant vs giant clash", "Defender stands ground"],
    Escape: ["Escape from danger", "Ambush attack", "Chase and takedown"],
  };

  const controlHabitat = habitatPool[0] ?? explicitHabitat;
  const pressureHabitat = habitatPool[1] ?? controlHabitat;
  const cinematicHabitat = habitatPool[2] ?? pressureHabitat;
  const alternateArc =
    arcPool.find((arc) => arc !== controlArc && arc !== suggestedArc) ??
    arcPool.find((arc) => arc !== controlArc) ??
    suggestedArc;
  const spotlightArc = pickFirstMatchingArc(
    arcPool,
    spotlightArcPriorities[input.contentLane],
    suggestedArc
  );

  return [
    {
      label: buildBlueprintLabel(input.contentLane, "control"),
      summary: buildBlueprintSummary(input.contentLane, "control"),
      hookFamily: hookFamilyPool[0] ?? currentHookFamily,
      arc: controlArc,
      habitat: controlHabitat,
      durationLane: input.durationLane,
      fastPublishMode: input.fastPublishMode,
      emphasis: "balanced",
      sceneDescriptionVariant: 0,
    },
    {
      label: buildBlueprintLabel(input.contentLane, "fast"),
      summary: buildBlueprintSummary(input.contentLane, "fast"),
      hookFamily: hookFamilyPool[0] ?? shortDefaultHook,
      arc: suggestedArc,
      habitat: pressureHabitat,
      durationLane: "short",
      fastPublishMode: true,
      emphasis: "fast-publish",
      sceneDescriptionVariant: 1,
    },
    {
      label: buildBlueprintLabel(input.contentLane, "opening"),
      summary: buildBlueprintSummary(input.contentLane, "opening"),
      hookFamily: hookFamilyPool[0] ?? "danger",
      arc: spotlightArc,
      habitat: controlHabitat,
      durationLane: "short",
      fastPublishMode: true,
      emphasis: "balanced",
      sceneDescriptionVariant: 2,
    },
    {
      label: buildBlueprintLabel(input.contentLane, "cinematic"),
      summary: buildBlueprintSummary(input.contentLane, "cinematic"),
      hookFamily: hookFamilyPool[1] ?? longDefaultHook,
      arc: controlArc,
      habitat: cinematicHabitat,
      durationLane: "long",
      fastPublishMode: false,
      emphasis: "cinematic",
      sceneDescriptionVariant: 0,
    },
    {
      label: buildBlueprintLabel(input.contentLane, "realism"),
      summary: buildBlueprintSummary(input.contentLane, "realism"),
      hookFamily: hookFamilyPool[1] ?? "curiosity",
      arc: suggestedArc,
      habitat: controlHabitat,
      durationLane: "short",
      fastPublishMode: false,
      emphasis: "cinematic",
      sceneDescriptionVariant: 1,
    },
    {
      label: buildBlueprintLabel(input.contentLane, "alternate"),
      summary: buildBlueprintSummary(input.contentLane, "alternate"),
      hookFamily: hookFamilyPool[2] ?? "reversal",
      arc: alternateArc,
      habitat: pressureHabitat,
      durationLane: input.durationLane,
      fastPublishMode: input.fastPublishMode,
      emphasis: "balanced",
      sceneDescriptionVariant: 2,
    },
  ];
}

function buildPredatorPreyFitScore(prey: string, presetPrey: string[]): number {
  const normalizedPrey = normalizeText(prey);
  const presetNormalized = presetPrey.map(normalizeText);

  if (presetNormalized.includes(normalizedPrey)) return 96;

  const preyTokens = new Set(normalizedPrey.split(" ").filter(Boolean));
  const sharesFamily = presetNormalized.some((candidate) =>
    candidate
      .split(" ")
      .filter(Boolean)
      .some((token) => preyTokens.has(token))
  );

  return sharesFamily ? 84 : 60;
}

function buildHabitatFitScore(
  habitat: HabitatPreset,
  finalEnvironment: string,
  suggestedEnvironment: string,
  currentHabitat: HabitatPreset,
  contentLane: ContentLane
): number {
  const preferredHabitats = getPreferredHabitatsForContentLane(contentLane);

  if (preferredHabitats.includes(habitat)) return 94;
  if (normalizeText(finalEnvironment) === normalizeText(suggestedEnvironment)) return 96;
  if (habitat === "Auto") return 92;
  if (currentHabitat !== "Auto" && habitat === currentHabitat) return 86;
  if (guessHabitatPresetFromEnvironment(suggestedEnvironment) === habitat) return 84;
  return 76;
}

function buildArcFitScore(
  arc: Arc,
  suggestedArc: Arc,
  plausibleArcs: Arc[],
  contentLane: ContentLane
): number {
  const nearbyArcs = getNearbyArcsForContentLane(contentLane);

  if (arc === suggestedArc) return 96;
  if (nearbyArcs.includes(arc)) return 88;
  if (plausibleArcs.includes(arc)) return 82;
  return 68;
}

function buildRealismFitScore(
  variant: Pick<ConceptVariant, "durationLane" | "fastPublishMode">,
  qualityWarnings: ReturnType<typeof getQualityRecommendations>["warnings"],
  publishWorthy: boolean,
  input: ConceptVariantLabInput
): number {
  const severityPenalty = qualityWarnings.reduce((total, warning) => {
    if (warning.severity === "danger") return total + 9;
    if (warning.severity === "warning") return total + 5;
    return total + 1;
  }, 0);

  let score = 82 - severityPenalty;

  if (publishWorthy) score += 8;
  if (input.realismMode === "Reference Locked") score += 4;
  if (input.motionOnlyI2V) score += 3;
  if (input.referenceLock) score += 3;
  if (input.singleActionRule) score += 3;
  if (input.microMotion) score += 2;
  if (!input.heroVeo) score += 2;
  if (!variant.fastPublishMode) score += 1;
  if (variant.durationLane === "short") score += 2;

  return clampScore(score);
}

function buildPerformanceScore(
  averageWatchTimeSeconds: number,
  completionRate: number,
  shareRate: number
): number {
  return clampScore(
    averageWatchTimeSeconds * 1.2 + completionRate * 35 + shareRate * 120
  );
}

function buildLaneSpotlightScore(variant: ConceptVariant, contentLane: ContentLane): number {
  let score = variant.openingFrameScore.total * 0.58 + variant.laneFitScore * 0.32;

  switch (contentLane) {
    case "Pack Hunt":
      if (variant.arc === "Pack hunting strategy") score += 8;
      if (variant.arc === "Chase and takedown") score += 5;
      if (variant.fastPublishMode) score += 4;
      if (variant.hookFamily === "danger") score += 3;
      break;
    case "Defender":
      if (variant.arc === "Defender stands ground") score += 8;
      if (variant.arc === "Territory dominance battle") score += 5;
      if (variant.hookFamily === "reversal") score += 4;
      if (!variant.fastPublishMode) score += 2;
      break;
    case "Fishing Strike":
      if (variant.arc === "Ambush attack" || variant.arc === "Chase and takedown") score += 8;
      if (
        variant.habitat === "Riverbank Reeds" ||
        variant.habitat === "Everglades Marsh" ||
        variant.habitat === "Cypress Swamp Edge" ||
        variant.habitat === "Coastal Cliffline"
      ) {
        score += 6;
      }
      if (variant.hookFamily === "danger") score += 3;
      break;
    case "Rut Battle":
      if (
        variant.arc === "Territory dominance battle" ||
        variant.arc === "Giant vs giant clash"
      ) {
        score += 8;
      }
      if (variant.hookFamily === "curiosity") score += 3;
      if (
        variant.habitat === "Rocky Mountain Meadow" ||
        variant.habitat === "Open Prairie Grassland" ||
        variant.habitat === "Dry Prairie Plain"
      ) {
        score += 4;
      }
      break;
    case "Escape":
      if (variant.arc === "Escape from danger") score += 8;
      if (variant.fastPublishMode) score += 3;
      if (variant.hookFamily === "danger" || variant.hookFamily === "reversal") {
        score += 3;
      }
      break;
    default:
      break;
  }

  return clampScore(score);
}

function attachWinnerTags(
  variants: ConceptVariant[],
  contentLane: ContentLane
): { variants: ConceptVariant[]; winners: ConceptVariantLabWinners } {
  const findBest = (ranker: (variant: ConceptVariant) => number, pool = variants) =>
    [...pool].sort((left, right) => ranker(right) - ranker(left))[0];

  const bestOverall = findBest(
    (variant) => variant.overallScore * 0.9 + variant.laneFitScore * 0.1
  );
  const bestFastPublish = findBest(
    (variant) =>
      variant.fastPublishMode
        ? variant.overallScore * 0.76 + variant.laneFitScore * 0.24
        : -Infinity,
    variants.filter((variant) => variant.fastPublishMode)
  );
  const strongestOpening = findBest((variant) =>
    buildLaneSpotlightScore(variant, contentLane)
  );
  const bestRealism = findBest(
    (variant) => variant.realismFitScore * 0.74 + variant.laneFitScore * 0.26
  );

  const winnerTagsById = new Map<string, Set<ConceptVariantWinnerTag>>();
  const addTag = (id: string | undefined, tag: ConceptVariantWinnerTag) => {
    if (!id) return;
    const current = winnerTagsById.get(id) ?? new Set<ConceptVariantWinnerTag>();
    current.add(tag);
    winnerTagsById.set(id, current);
  };

  addTag(bestOverall?.id, "best-overall");
  addTag(bestFastPublish?.id, "best-fast-publish");
  addTag(strongestOpening?.id, "strongest-opening");
  addTag(bestRealism?.id, "best-realism");

  return {
    variants: variants.map((variant) => ({
      ...variant,
      winnerTags: [...(winnerTagsById.get(variant.id) ?? new Set())],
    })),
    winners: {
      bestOverallId: bestOverall?.id,
      bestFastPublishId: bestFastPublish?.id,
      bestStrongestOpeningId: strongestOpening?.id,
      bestRealismId: bestRealism?.id,
    },
  };
}

export function buildConceptVariantLab(
  input: ConceptVariantLabInput
): {
  variants: ConceptVariant[];
  winners: ConceptVariantLabWinners;
} {
  const currentHookFamily =
    input.currentHookFamily ??
    getPreferredHookFamilyForContentLane(input.contentLane) ??
    getBestHookFamilyForDurationLane(input.durationLane) ??
    "danger";
  const suggestedArc = getLaneBiasedArc(
    input.contentLane,
    input.predator,
    input.prey,
    suggestArc(input.predator, input.prey, input.currentArc) as Arc
  );
  const plausibleArcs = buildPlausibleArcs(input.currentArc, suggestedArc);
  const primaryEnvironment = resolveEnvironment(
    input.currentHabitat,
    input.predator,
    input.prey,
    input.presetEnvironment,
    input.contentLane,
    suggestedArc
  );
  const explicitHabitat =
    input.currentHabitat === "Auto"
      ? guessHabitatPresetFromEnvironment(primaryEnvironment)
      : input.currentHabitat;
  const suggestedEnvironment = applyContentLaneEnvironmentBias(
    input.contentLane,
    input.predator,
    input.prey,
    suggestHabitat(input.predator, input.prey, input.presetEnvironment),
    suggestedArc
  );

  const blueprints = buildBlueprints(
    input,
    currentHookFamily,
    suggestedArc,
    explicitHabitat
  );
  const dedupedBlueprints = blueprints.filter((blueprint, index, all) => {
    const key = [
      blueprint.hookFamily,
      blueprint.arc,
      blueprint.habitat,
      blueprint.durationLane,
      String(blueprint.fastPublishMode),
    ].join("|");

    return (
      all.findIndex((candidate) => {
        const candidateKey = [
          candidate.hookFamily,
          candidate.arc,
          candidate.habitat,
          candidate.durationLane,
          String(candidate.fastPublishMode),
        ].join("|");

        return candidateKey === key;
      }) === index
    );
  });

  const variants = dedupedBlueprints.slice(0, 8).map((blueprint, index) => {
    const finalEnvironment = resolveEnvironment(
      blueprint.habitat,
      input.predator,
      input.prey,
      input.presetEnvironment,
      input.contentLane,
      blueprint.arc
    );
    const sceneDescription = buildAutoSceneDescription({
      predator: input.predator,
      prey: input.prey,
      arc: blueprint.arc,
      habitat: blueprint.habitat,
      environment: finalEnvironment,
      weather: input.weather,
      contentLane: input.contentLane,
      variant: blueprint.sceneDescriptionVariant,
    });
    const shortCaption = buildShortCaption(
      input.predator,
      input.prey,
      finalEnvironment,
      blueprint.arc,
      { mode: "us-only", contentLane: input.contentLane }
    );
    const longCaption = buildLongCaption(
      input.predator,
      input.prey,
      finalEnvironment,
      blueprint.arc,
      { mode: "us-only", contentLane: input.contentLane }
    );
    const caption =
      blueprint.fastPublishMode || blueprint.durationLane === "short"
        ? shortCaption
        : longCaption;
    const hashtags = buildHashtags(input.predator, input.prey, blueprint.arc, {
      count: 5,
      contentLane: input.contentLane,
    });
    const hashtagList = hashtags.split(/\s+/).filter(Boolean);
    const openingFrameInput = buildOpeningFrameInput(
      blueprint.arc,
      input.depthMode,
      input.motionOnlyI2V,
      input.referenceLock,
      input.singleActionRule,
      blueprint.fastPublishMode,
      blueprint.hookFamily
    );
    const primaryHook = build2026HookByFamily(
      input.predator,
      input.prey,
      blueprint.arc,
      blueprint.hookFamily,
      { contentLane: input.contentLane }
    );
    const usViewsMode = buildUSViewsModeReport({
      durationLane: blueprint.durationLane,
      hookFamily: blueprint.hookFamily,
      contentLane: input.contentLane,
      concept: {
        predator: input.predator,
        prey: input.prey,
        environment: finalEnvironment,
        arc: blueprint.arc,
        contentLane: input.contentLane,
      },
      openingFrame: openingFrameInput,
      hookText: primaryHook,
      ctaText: buildCTA(blueprint.arc),
      caption,
      hashtags: hashtagList,
      originalityConfirmed: input.strictOriginalityGuard,
    });
    const qualityReco = getQualityRecommendations({
      driftRisk: input.driftRisk,
      realismMode: input.realismMode,
      runwayModel: input.runwayModel,
      klingModel: input.klingModel,
      durationLane: blueprint.durationLane,
      hookFamily: blueprint.hookFamily,
      performance: usViewsMode.performanceSnapshot,
      motionOnlyI2V: input.motionOnlyI2V,
      referenceLock: input.referenceLock,
      singleActionRule: input.singleActionRule,
      microMotion: input.microMotion,
      heroVeo: input.heroVeo,
      concept: {
        predator: input.predator,
        prey: input.prey,
        environment: finalEnvironment,
        arc: blueprint.arc,
        contentLane: input.contentLane,
      },
      openingFrame: openingFrameInput,
      packaging: {
        caption,
        hashtags: hashtagList,
        originalityConfirmed: input.strictOriginalityGuard,
      },
    });

    const predatorPreyFitScore = buildPredatorPreyFitScore(input.prey, input.presetPrey);
    const habitatFitScore = buildHabitatFitScore(
      blueprint.habitat,
      finalEnvironment,
      suggestedEnvironment,
      input.currentHabitat,
      input.contentLane
    );
    const arcFitScore = buildArcFitScore(
      blueprint.arc,
      suggestedArc,
      plausibleArcs,
      input.contentLane
    );
    const publishWorthy = usViewsMode.shouldPublish || qualityReco.publishWorthy;
    const realismFitScore = buildRealismFitScore(
      blueprint,
      qualityReco.warnings,
      publishWorthy,
      input
    );
    const laneFitScore = scoreContentLaneFit({
      contentLane: input.contentLane,
      predator: input.predator,
      prey: input.prey,
      arc: blueprint.arc,
      habitat: blueprint.habitat,
      hookFamily: blueprint.hookFamily,
      environment: finalEnvironment,
    });
    const fitScore = clampScore(
      predatorPreyFitScore * 0.24 +
        habitatFitScore * 0.18 +
        arcFitScore * 0.18 +
        laneFitScore * 0.2 +
        realismFitScore * 0.2
    );
    const performanceScore = usViewsMode.performanceSnapshot
      ? buildPerformanceScore(
          usViewsMode.performanceSnapshot.averageWatchTimeSeconds,
          usViewsMode.performanceSnapshot.completionRate,
          usViewsMode.performanceSnapshot.shareRate
        )
      : 72;
    const publishGuardScore = usViewsMode.publishGuard.isPass ? 100 : 72;
    const overallScore = clampScore(
      usViewsMode.audienceScore.total * 0.28 +
        usViewsMode.openingFrameScore.total * 0.2 +
        fitScore * 0.2 +
        laneFitScore * 0.16 +
        publishGuardScore * 0.08 +
        performanceScore * 0.08 +
        (publishWorthy ? 3 : 0)
    );

    return {
      id: `variant-${index + 1}`,
      label: blueprint.label,
      summary: blueprint.summary,
      hookFamily: blueprint.hookFamily,
      arc: blueprint.arc,
      habitat: blueprint.habitat,
      finalEnvironment,
      durationLane: blueprint.durationLane,
      fastPublishMode: blueprint.fastPublishMode,
      pipelineStyle: toPipelineStyle(blueprint.durationLane),
      emphasis: blueprint.emphasis,
      sceneDescription,
      sceneDescriptionVariant: blueprint.sceneDescriptionVariant,
      primaryHook,
      caption,
      hashtags,
      usAudienceScore: usViewsMode.audienceScore,
      openingFrameScore: usViewsMode.openingFrameScore,
      publishGuardReport: usViewsMode.publishGuard,
      performanceSnapshot: usViewsMode.performanceSnapshot,
      predatorPreyFitScore,
      habitatFitScore,
      arcFitScore,
      laneFitScore,
      realismFitScore,
      fitScore,
      overallScore,
      publishWorthy,
      winnerTags: [],
    };
  });

  const boundedVariants =
    variants.length >= 4 ? variants : variants.slice(0, Math.max(4, variants.length));

  return attachWinnerTags(boundedVariants, input.contentLane);
}
