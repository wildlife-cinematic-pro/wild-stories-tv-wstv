import { buildOpeningFrameInput } from "@/lib/build-package";
import { getLaneBiasedArc } from "@/lib/content-lanes";
import { habitatPromptMap } from "@/lib/habitat-presets";
import { buildAutoSceneDescription } from "@/lib/page-build-helpers";
import { getBestHookFamilyForDurationLane } from "@/lib/performanceMemory";
import {
  build2026HookByFamily,
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
  presetEnvironment: string
): string {
  return habitat === "Auto"
    ? suggestHabitat(predator, prey, presetEnvironment)
    : habitatPromptMap[habitat];
}

function toPipelineStyle(durationLane: DurationLane): PipelineStyle {
  return durationLane === "long" ? "long-hybrid-4-shot" : "4-shot";
}

function guessHabitatPresetFromEnvironment(environment: string): Exclude<HabitatPreset, "Auto"> {
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
  const alternateMap: Record<Exclude<HabitatPreset, "Auto">, Exclude<HabitatPreset, "Auto">> = {
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

function buildBlueprints(
  input: ConceptVariantLabInput,
  currentHookFamily: HookFamily,
  suggestedArc: Arc,
  explicitHabitat: Exclude<HabitatPreset, "Auto">
): ConceptVariantBlueprint[] {
  const shortDefaultHook = getBestHookFamilyForDurationLane("short") ?? "danger";
  const longDefaultHook = getBestHookFamilyForDurationLane("long") ?? "curiosity";
  const openingArc = buildPlausibleArcs(input.currentArc, suggestedArc).find((arc) =>
    arc === "Ambush attack" || arc === "Chase and takedown" || arc === "Escape from danger"
  ) ?? suggestedArc;
  const alternateArc =
    buildPlausibleArcs(input.currentArc, suggestedArc).find((arc) => arc !== input.currentArc) ??
    suggestedArc;
  const alternateHabitat = getAlternateHabitat(explicitHabitat);

  return [
    {
      label: "Variant A",
      summary: "Balanced baseline closest to the current setup, scored as the clean control.",
      hookFamily: currentHookFamily,
      arc: input.currentArc,
      habitat: input.currentHabitat,
      durationLane: input.durationLane,
      fastPublishMode: input.fastPublishMode,
      emphasis: "balanced",
      sceneDescriptionVariant: 0,
    },
    {
      label: "Variant B",
      summary: "Fast-publish pressure lane with a tighter opening and a short release rhythm.",
      hookFamily: shortDefaultHook,
      arc: suggestedArc,
      habitat: input.currentHabitat,
      durationLane: "short",
      fastPublishMode: true,
      emphasis: "fast-publish",
      sceneDescriptionVariant: 1,
    },
    {
      label: "Variant C",
      summary: "Opening-frame first pass that pushes immediate threat readability.",
      hookFamily: "danger",
      arc: openingArc,
      habitat: input.currentHabitat,
      durationLane: "short",
      fastPublishMode: true,
      emphasis: "balanced",
      sceneDescriptionVariant: 2,
    },
    {
      label: "Variant D",
      summary: "Cinematic hold with a slower payoff lane when the concept can support more build.",
      hookFamily: longDefaultHook,
      arc: input.currentArc,
      habitat: alternateHabitat,
      durationLane: "long",
      fastPublishMode: false,
      emphasis: "cinematic",
      sceneDescriptionVariant: 0,
    },
    {
      label: "Variant E",
      summary: "Realism-weighted pass that keeps the habitat grounded and the pressure more natural.",
      hookFamily: "curiosity",
      arc: input.currentArc,
      habitat: explicitHabitat,
      durationLane: "short",
      fastPublishMode: false,
      emphasis: "cinematic",
      sceneDescriptionVariant: 1,
    },
    {
      label: "Variant F",
      summary: "Alternate story direction test when the same animal matchup can sell a different beat.",
      hookFamily: "reversal",
      arc: alternateArc,
      habitat: alternateHabitat,
      durationLane: input.durationLane,
      fastPublishMode: input.fastPublishMode,
      emphasis: "balanced",
      sceneDescriptionVariant: 2,
    },
    {
      label: "Variant G",
      summary: "Guard-safe short-lane fallback with clean packaging and a steadier realism posture.",
      hookFamily: currentHookFamily === "danger" ? "curiosity" : currentHookFamily,
      arc: suggestedArc,
      habitat: explicitHabitat,
      durationLane: "short",
      fastPublishMode: false,
      emphasis: "balanced",
      sceneDescriptionVariant: 0,
    },
    {
      label: "Variant H",
      summary: "Long-lane curiosity test for stronger narrative hold without losing subject clarity.",
      hookFamily: "curiosity",
      arc: alternateArc,
      habitat: input.currentHabitat,
      durationLane: "long",
      fastPublishMode: false,
      emphasis: "cinematic",
      sceneDescriptionVariant: 1,
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
  currentHabitat: HabitatPreset
): number {
  if (normalizeText(finalEnvironment) === normalizeText(suggestedEnvironment)) return 96;
  if (habitat === "Auto") return 92;
  if (currentHabitat !== "Auto" && habitat === currentHabitat) return 86;
  if (guessHabitatPresetFromEnvironment(suggestedEnvironment) === habitat) return 84;
  return 76;
}

function buildArcFitScore(arc: Arc, suggestedArc: Arc, plausibleArcs: Arc[]): number {
  if (arc === suggestedArc) return 96;
  if (plausibleArcs.includes(arc)) return 84;
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

function buildPerformanceScore(averageWatchTimeSeconds: number, completionRate: number, shareRate: number): number {
  return clampScore(
    averageWatchTimeSeconds * 1.2 + completionRate * 35 + shareRate * 120
  );
}

function attachWinnerTags(
  variants: ConceptVariant[]
): { variants: ConceptVariant[]; winners: ConceptVariantLabWinners } {
  const findBest = (ranker: (variant: ConceptVariant) => number, pool = variants) =>
    [...pool].sort((left, right) => ranker(right) - ranker(left))[0];

  const bestOverall = findBest((variant) => variant.overallScore);
  const bestFastPublish = findBest(
    (variant) => variant.overallScore,
    variants.filter((variant) => variant.fastPublishMode)
  );
  const strongestOpening = findBest(
    (variant) => variant.openingFrameScore.total
  );
  const bestRealism = findBest((variant) => variant.realismFitScore);

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
    input.currentHookFamily ?? getBestHookFamilyForDurationLane(input.durationLane) ?? "danger";
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
    input.presetEnvironment
  );
  const explicitHabitat =
    input.currentHabitat === "Auto"
      ? guessHabitatPresetFromEnvironment(primaryEnvironment)
      : input.currentHabitat;
  const suggestedEnvironment = suggestHabitat(
    input.predator,
    input.prey,
    input.presetEnvironment
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
      input.presetEnvironment
    );
    const sceneDescription = buildAutoSceneDescription({
      predator: input.predator,
      prey: input.prey,
      arc: blueprint.arc,
      habitat: blueprint.habitat,
      environment: finalEnvironment,
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
      input.currentHabitat
    );
    const arcFitScore = buildArcFitScore(blueprint.arc, suggestedArc, plausibleArcs);
    const publishWorthy = usViewsMode.shouldPublish || qualityReco.publishWorthy;
    const realismFitScore = buildRealismFitScore(
      blueprint,
      qualityReco.warnings,
      publishWorthy,
      input
    );
    const fitScore = clampScore(
      predatorPreyFitScore * 0.32 +
        habitatFitScore * 0.24 +
        arcFitScore * 0.2 +
        realismFitScore * 0.24
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
      usViewsMode.audienceScore.total * 0.32 +
        usViewsMode.openingFrameScore.total * 0.24 +
        fitScore * 0.24 +
        publishGuardScore * 0.12 +
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
      primaryHook: build2026HookByFamily(
        input.predator,
        input.prey,
        blueprint.arc,
        blueprint.hookFamily,
        { contentLane: input.contentLane }
      ),
      caption,
      hashtags,
      usAudienceScore: usViewsMode.audienceScore,
      openingFrameScore: usViewsMode.openingFrameScore,
      publishGuardReport: usViewsMode.publishGuard,
      performanceSnapshot: usViewsMode.performanceSnapshot,
      predatorPreyFitScore,
      habitatFitScore,
      arcFitScore,
      realismFitScore,
      fitScore,
      overallScore,
      publishWorthy,
      winnerTags: [],
    };
  });

  const boundedVariants =
    variants.length >= 4 ? variants : variants.slice(0, Math.max(4, variants.length));

  return attachWinnerTags(boundedVariants);
}
