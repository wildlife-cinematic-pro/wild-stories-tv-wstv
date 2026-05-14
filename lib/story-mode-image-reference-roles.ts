import { StoryMode, type GeneratedPackage } from "@/types";
import { normalizeScavengerFoodZone } from "@/lib/scavenger-food-zone";
import {
  buildStoryModePromptContext,
  isNonPredatorStoryMode,
  type StoryModePromptContext,
} from "@/lib/story-mode-prompt-context";

export type ImageReferenceKind =
  | "animal"
  | "offspring"
  | "group"
  | "food-source"
  | "hazard"
  | "route"
  | "food-zone"
  | "environment";

export type StoryModeImageReferenceRoles = {
  storyMode: StoryMode;
  modeLabel: string;
  isPredatorVsPrey: boolean;
  primaryTitle: string;
  secondaryTitle: string;
  environmentTitle: string;
  finalMergeTitle: string;
  primaryCopyLabel: string;
  offspringTitle?: string;
  offspringCopyLabel?: string;
  offspringHelper?: string;
  offspringReferenceLabel?: string;
  offspringKind?: ImageReferenceKind;
  offspringPreserveLine?: string;
  secondaryCopyLabel: string;
  environmentCopyLabel: string;
  primaryHelper: string;
  secondaryHelper: string;
  environmentHelper: string;
  primaryReferenceLabel: string;
  secondaryReferenceLabel: string;
  environmentReferenceLabel: string;
  primaryKind: ImageReferenceKind;
  secondaryKind: ImageReferenceKind;
  environmentKind: ImageReferenceKind;
  primaryPreserveLine: string;
  secondaryPreserveLine: string;
  environmentPreserveLine: string;
  mergeCompositionLine: string;
  mergeStageSubjectLine: string;
  mergeStageDirections: Record<number, string>;
};

function cleanText(value: unknown, fallback: string) {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function titleCaseLabel(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function buildContext(data: GeneratedPackage): StoryModePromptContext | undefined {
  if (!isNonPredatorStoryMode(data)) return undefined;

  return buildStoryModePromptContext({
    storyMode: data.storyMode,
    encounterMode: data.encounterMode,
    endingMode: data.endingMode,
    viralLane: data.viralLane,
    violenceLevel: data.violenceLevel,
    habitatRegion: data.habitatRegion,
    season: data.season,
    timeOfDay: data.timeOfDay,
    subjectA: data.subjectA ?? data.predatorName,
    subjectB: data.subjectB ?? data.preyName,
    groupCount: data.groupCount,
    offspringLabel: data.offspringLabel,
    strikeMethod: data.strikeMethod,
    escapeDirection: data.escapeDirection,
    weatherHazard: data.weatherHazard,
    rutSeason: data.rutSeason,
    foodItem: data.foodItem,
    predator: data.predatorName,
    prey: data.preyName,
    finalEnvironment: data.environmentName,
    weather: data.weatherName,
  });
}

function animalPreserveLine(subject: string) {
  return `${subject} identity, species markers, natural anatomy, body scale, face/head profile, coat/skin detail, stable limb structure, clean silhouette, and grounded contact.`;
}

function groupPreserveLine(subject: string) {
  return `${subject} group identity, readable herd/pack formation, believable animal count, species markers, stable anatomy across visible animals, grounded contact, and clean spacing.`;
}

function offspringPreserveLine(offspring: string, mother: string) {
  return `${offspring} identity as a correctly scaled young animal, same species as ${mother} when applicable, smaller body scale than the mother, sheltered posture, clean full-body silhouette, stable young-animal anatomy, grounded contact, and readable separation from the mother.`;
}
function nonAnimalPreserveLine(subject: string, kind: ImageReferenceKind) {
  if (kind === "hazard") {
    return `${subject} as environmental pressure only: wind/snow/ice/water/heat texture, atmosphere direction, visibility layers, terrain interaction, and natural hazard realism.`;
  }
  if (kind === "route") {
    return `${subject} as crossing route and terrain obstacle only: entry/exit path, water or land geometry, depth cues, scale, current or ground texture, and safe animal-ready space.`;
  }
  if (kind === "food-source") {
    return `${subject} as a clean food-source reference: readable fish/food shape, waterline placement, splash scale, natural texture, and no graphic feeding detail.`;
  }
  if (kind === "food-zone") {
    return `${subject} as an animal-free non-graphic food-zone/environment reference: ownership focal area, obscured food source, grass and terrain cover, spacing lanes, one clean open claim lane, no visible carcass detail, no blood, no gore, no wounds.`;
  }
  return `${subject} habitat, lighting, terrain, atmosphere, ground texture, scale cues, and open subject-ready space.`;
}


const PREDATOR_VS_PREY_MERGE_STAGE_DIRECTIONS: Record<number, string> = {
  1: "opening tension with both animals visible, a readable attack or escape lane, and the first clear survival pressure beat.",
  2: "pressure build as spacing tightens, body angles become more committed, and the terrain still leaves clean full-body readability.",
  3: "peak action with the strongest non-graphic motion implication, near-clash pressure, grounded anatomy, and no visible injury.",
  4: "resolve or aftermath with unresolved survival tension, stable spacing, and a replay-worthy final composition.",
};

function buildBaseRoles(data: GeneratedPackage): StoryModeImageReferenceRoles {
  const primary = cleanText(data.predatorName, "lead animal");
  const secondary = cleanText(data.preyName, "opposite animal");

  return {
    storyMode: StoryMode.PREDATOR_VS_PREY,
    modeLabel: "Predator vs Prey",
    isPredatorVsPrey: true,
    primaryTitle: "Lead Animal Master Image",
    secondaryTitle: "Opposite Animal Master Image",
    environmentTitle: "Environment Master Image",
    finalMergeTitle: "Final Merge Master Image",
    primaryCopyLabel: "Lead Reference",
    secondaryCopyLabel: "Opposite Reference",
    environmentCopyLabel: "Environment Reference",
    primaryHelper: "Create the reusable lead animal reference in Nano Banana 2 first.",
    secondaryHelper: "Create the reusable opposite animal reference in Nano Banana 2 first.",
    environmentHelper: "Create the reusable habitat, terrain, and lighting reference in Nano Banana 2 first.",
    primaryReferenceLabel: "Lead animal reference image",
    secondaryReferenceLabel: "Opposite animal reference image",
    environmentReferenceLabel: "Environment reference image",
    primaryKind: "animal",
    secondaryKind: "animal",
    environmentKind: "environment",
    primaryPreserveLine: animalPreserveLine(primary),
    secondaryPreserveLine: animalPreserveLine(secondary),
    environmentPreserveLine: nonAnimalPreserveLine(cleanText(data.environmentName, "natural wildlife habitat"), "environment"),
    mergeCompositionLine:
      "Place the lead animal and opposite animal in one clean wildlife documentary frame with full-body readability, stable anatomy, grounded contact, clean subject separation, and a clear attack/escape corridor.",
    mergeStageSubjectLine: `${primary} and ${secondary}`,
    mergeStageDirections: PREDATOR_VS_PREY_MERGE_STAGE_DIRECTIONS,
  };
}

export function getStoryModeImageReferenceRoles(data: GeneratedPackage): StoryModeImageReferenceRoles {
  const context = buildContext(data);
  if (!context) return buildBaseRoles(data);

  const primary = context.primarySubjectLabel;
  const secondary = context.secondarySubjectLabel;
  const offspring = cleanText(data.offspringLabel, "cub");
  const offspringTitleLabel = titleCaseLabel(offspring);
  const foodItem = context.storyMode === StoryMode.SCAVENGER_CONFLICT
    ? normalizeScavengerFoodZone(data.foodItem)
    : cleanText(data.foodItem, "non-graphic food zone");

  const common = {
    storyMode: context.storyMode,
    modeLabel: context.modeLabel,
    isPredatorVsPrey: false,
    finalMergeTitle: "Final Merge Master Image",
    primaryCopyLabel: "Primary Reference",
    secondaryCopyLabel: "Secondary Reference",
    environmentCopyLabel: "Environment Reference",
    primaryHelper: `Create the reusable ${context.modeLabel.toLowerCase()} primary reference in Nano Banana 2 first.`,
    secondaryHelper: `Create the reusable ${context.modeLabel.toLowerCase()} secondary reference in Nano Banana 2 first.`,
    environmentHelper: "Create the reusable habitat, terrain, lighting, or scene-pressure reference in Nano Banana 2 first.",
  };

  switch (context.storyMode) {
    case StoryMode.HERD_DEFENSE:
      return {
        ...common,
        primaryTitle: "Herd Master Image",
        secondaryTitle: "Threat Master Image",
        environmentTitle: "Environment Master Image",
        primaryCopyLabel: "Herd Reference",
        secondaryCopyLabel: "Threat Reference",
        primaryReferenceLabel: "Herd reference image",
        secondaryReferenceLabel: "Threat reference image",
        environmentReferenceLabel: "Environment reference image",
        primaryKind: "group",
        secondaryKind: "group",
        environmentKind: "environment",
        primaryPreserveLine: groupPreserveLine(primary),
        secondaryPreserveLine: groupPreserveLine(secondary),
        environmentPreserveLine: nonAnimalPreserveLine(cleanText(data.environmentName, "open defensive habitat"), "environment"),
        mergeCompositionLine: `${primary} forms a readable defensive wall or circle while ${secondary} applies pressure outside the formation, with group spacing, edge tension, full-body readability, and no graphic contact.`,
        mergeStageSubjectLine: `${primary} herd formation, ${secondary} outside pressure, and ${cleanText(data.environmentName, "open defensive habitat")}`,
        mergeStageDirections: {
          1: `${primary} is visible as a defensive wall or circle while ${secondary} stays outside the formation at the habitat edge.`,
          2: `${secondary} pressure tightens at the outer edge while ${primary} closes spacing and protects the center of the formation.`,
          3: `Strongest non-graphic herd defense beat: ${primary} holds formation, ${secondary} is checked outside the group, no injury or direct takedown.`,
          4: `Standoff or retreat frame with ${primary} still organized and ${secondary} outside the formation, unresolved but safe.`,
        },
      };
    case StoryMode.MOTHER_BABY:
      return {
        ...common,
        primaryTitle: "Mother Master Image",
        offspringTitle: `Offspring / ${offspringTitleLabel} Master Image`,
        secondaryTitle: "Threat Master Image",
        environmentTitle: "Environment Master Image",
        primaryCopyLabel: "Mother Reference",
        offspringCopyLabel: `${offspringTitleLabel} Reference`,
        offspringHelper: `Create the reusable ${offspring} reference in Nano Banana 2 first.`,
        secondaryCopyLabel: "Threat Reference",
        primaryReferenceLabel: "Mother reference image",
        offspringReferenceLabel: `Offspring / ${offspring} reference image`,
        secondaryReferenceLabel: "Threat reference image",
        environmentReferenceLabel: "Environment reference image",
        primaryKind: "animal",
        offspringKind: "offspring",
        secondaryKind: "animal",
        environmentKind: "environment",
        primaryPreserveLine: `${animalPreserveLine(primary)} Include an offspring-safe body-blocking silhouette and space where the ${offspring} can shelter close without being fused to the mother.`,
        offspringPreserveLine: offspringPreserveLine(offspring, primary),
        secondaryPreserveLine: animalPreserveLine(secondary),
        environmentPreserveLine: nonAnimalPreserveLine(cleanText(data.environmentName, "protective wildlife habitat"), "environment"),
        mergeCompositionLine: `${primary} shields the ${offspring} in a protected pocket while ${secondary} remains at a readable distance; keep the ${offspring} close to the mother, partially sheltered behind or under her body line, visibly smaller than the mother, readable as its own subject, not fused into the mother, with no contact, no blood, no gore, and no visible injury.`,
        mergeStageSubjectLine: `${primary}, sheltered ${offspring}, distant ${secondary}, and ${cleanText(data.environmentName, "protective wildlife habitat")}`,
        mergeStageDirections: {
          1: `${primary} and the smaller ${offspring} are visible together, with the ${offspring} close and partly sheltered behind or under her body line while ${secondary} stays distant enough to read as pressure without contact.`,
          2: `${secondary} presence grows while ${primary} blocks the line of approach and keeps the smaller ${offspring} sheltered close but visibly separate from the mother silhouette.`,
          3: `Strongest protective beat: ${primary} shields the smaller ${offspring}, ${secondary} remains separated at readable distance, no contact, no blood, no gore, no visible injury.`,
          4: `Protected exit or unresolved safety frame with ${primary} and the smaller ${offspring} readable as separate subjects and ${secondary} held at distance.`,
        },
      };
    case StoryMode.RIVAL_CLASH:
      return {
        ...common,
        primaryTitle: "Rival A Master Image",
        secondaryTitle: "Rival B Master Image",
        environmentTitle: "Environment Master Image",
        primaryCopyLabel: "Rival A Reference",
        secondaryCopyLabel: "Rival B Reference",
        primaryReferenceLabel: "Rival A reference image",
        secondaryReferenceLabel: "Rival B reference image",
        environmentReferenceLabel: "Environment reference image",
        primaryKind: "animal",
        secondaryKind: "animal",
        environmentKind: "environment",
        primaryPreserveLine: animalPreserveLine(primary),
        secondaryPreserveLine: animalPreserveLine(secondary),
        environmentPreserveLine: nonAnimalPreserveLine(cleanText(data.environmentName, "rival standoff habitat"), "environment"),
        mergeCompositionLine: `${primary} and ${secondary} face off in a same-species dominance standoff, posture-led and grounded, with antler/horn/body-display readability, clean spacing, no gore, and no visible injury.`,
        mergeStageSubjectLine: `${primary} and ${secondary} in a same-species dominance standoff`,
        mergeStageDirections: {
          1: `${primary} and ${secondary} face off as same-species rivals with readable posture and clean separation.`,
          2: `Dominance pressure builds through antler, horn, or body-display posture while both rivals stay grounded and readable.`,
          3: `Strongest non-graphic rival clash beat: display or near-contact dominance pressure, no gore, no visible injury.`,
          4: `Dominance standoff or separation frame with both rivals readable and the winner unresolved or implied without graphic outcome.`,
        },
      };
    case StoryMode.NEAR_MISS:
      return {
        ...common,
        primaryTitle: "Escape Subject Master Image",
        secondaryTitle: "Pressure Subject Master Image",
        environmentTitle: "Environment Master Image",
        primaryCopyLabel: "Escape Subject Reference",
        secondaryCopyLabel: "Pressure Subject Reference",
        primaryReferenceLabel: "Escape subject reference image",
        secondaryReferenceLabel: "Pressure subject reference image",
        environmentReferenceLabel: "Environment reference image",
        primaryKind: "animal",
        secondaryKind: "animal",
        environmentKind: "environment",
        primaryPreserveLine: animalPreserveLine(primary),
        secondaryPreserveLine: animalPreserveLine(secondary),
        environmentPreserveLine: nonAnimalPreserveLine(cleanText(data.environmentName, "near-miss escape habitat"), "environment"),
        mergeCompositionLine: `${primary} is already cutting into the escape lane while ${secondary} closes pressure without contact; make the last-second gap readable, fast, grounded, and non-graphic.`,
        mergeStageSubjectLine: `${primary}, ${secondary}, and the last-second escape lane`,
        mergeStageDirections: {
          1: `${primary} is already oriented toward a clear escape lane while ${secondary} closes pressure from behind or the side.`,
          2: `The last-second gap narrows, ${primary} turns or cuts toward cover, and ${secondary} pressures without contact.`,
          3: `Peak near-miss beat: ${primary} clears the gap at the final moment while ${secondary} misses cleanly, no collision, no injury.`,
          4: `Escape or unresolved aftermath frame with ${primary} still readable beyond the pressure lane and ${secondary} separated.`,
        },
      };
    case StoryMode.FISHING_STRIKE:
      return {
        ...common,
        primaryTitle: "Striker Master Image",
        secondaryTitle: "Fish / Food Source Master Image",
        environmentTitle: "Environment Master Image",
        primaryCopyLabel: "Striker Reference",
        secondaryCopyLabel: "Food Source Reference",
        primaryReferenceLabel: "Striker reference image",
        secondaryReferenceLabel: "Fish / food source reference image",
        environmentReferenceLabel: "Environment reference image",
        primaryKind: "animal",
        secondaryKind: "food-source",
        environmentKind: "environment",
        primaryPreserveLine: animalPreserveLine(primary),
        secondaryPreserveLine: nonAnimalPreserveLine(secondary, "food-source"),
        environmentPreserveLine: nonAnimalPreserveLine(cleanText(data.environmentName, "waterline habitat"), "environment"),
        mergeCompositionLine: `${primary} prepares a clean waterline strike toward ${secondary}; show readable splash timing, grounded riverbank contact, natural feeding behavior, and no graphic food detail.`,
        mergeStageSubjectLine: `${primary}, ${secondary}, and the waterline strike zone`,
        mergeStageDirections: {
          1: `${primary} is positioned at the waterline with ${secondary} readable as a clean fish or food-source target.`,
          2: `Strike timing builds through posture, paw/beak/body angle, water tension, and readable splash setup.`,
          3: `Peak non-graphic fishing strike beat with splash timing and natural feeding motion, no blood, no gore, no graphic food detail.`,
          4: `After-splash or unresolved waterline frame with ${primary}, water motion, and ${secondary} handled as a clean food-source reference.`,
        },
      };
    case StoryMode.WEATHER_SURVIVAL:
      return {
        ...common,
        primaryTitle: "Survival Animal / Group Master Image",
        secondaryTitle: "Weather Hazard / Pressure Reference",
        environmentTitle: "Environment Master Image",
        primaryCopyLabel: "Survival Subject Reference",
        secondaryCopyLabel: "Weather Pressure Reference",
        primaryReferenceLabel: "Survival animal / group reference image",
        secondaryReferenceLabel: "Weather hazard / pressure reference image",
        environmentReferenceLabel: "Environment reference image",
        primaryKind: "group",
        secondaryKind: "hazard",
        environmentKind: "environment",
        primaryPreserveLine: groupPreserveLine(primary),
        secondaryPreserveLine: nonAnimalPreserveLine(secondary, "hazard"),
        environmentPreserveLine: nonAnimalPreserveLine(cleanText(data.environmentName, "weather survival habitat"), "environment"),
        mergeCompositionLine: `${primary} pushes through ${secondary} as environmental scene pressure; show survival movement, weather force, readable bodies, stable footing, natural atmosphere, and no animal opponent.`,
        mergeStageSubjectLine: `${primary} moving through ${secondary} environmental pressure`,
        mergeStageDirections: {
          1: `${primary} enters the ${secondary} hazard with no animal opponent required; the weather is the scene pressure.`,
          2: `${secondary} intensifies through atmosphere, visibility, ground texture, and body posture while ${primary} keeps moving.`,
          3: `Strongest survival beat: ${primary} pushes through the hazard with stable footing and readable bodies, no fight, no injury.`,
          4: `Endurance or safe-movement frame with ${primary} still moving through ${secondary}, unresolved but non-graphic.`,
        },
      };
    case StoryMode.MIGRATION:
      return {
        ...common,
        primaryTitle: "Migrating Herd Master Image",
        secondaryTitle: "Crossing Obstacle / Route Reference",
        environmentTitle: "Environment Master Image",
        primaryCopyLabel: "Migrating Herd Reference",
        secondaryCopyLabel: "Crossing Route Reference",
        primaryReferenceLabel: "Migrating herd reference image",
        secondaryReferenceLabel: "Crossing obstacle / route reference image",
        environmentReferenceLabel: "Environment reference image",
        primaryKind: "group",
        secondaryKind: "route",
        environmentKind: "environment",
        primaryPreserveLine: groupPreserveLine(primary),
        secondaryPreserveLine: nonAnimalPreserveLine(secondary, "route"),
        environmentPreserveLine: nonAnimalPreserveLine(cleanText(data.environmentName, "migration route habitat"), "environment"),
        mergeCompositionLine: `${primary} approaches or enters ${secondary} with migration pressure rising; show herd scale, route readability, lead animals, safe spacing, and natural crossing tension.`,
        mergeStageSubjectLine: `${primary} moving through the ${secondary} route or obstacle`,
        mergeStageDirections: {
          1: `${primary} approaches the ${secondary} route with herd scale, entry path, exit path, and terrain readability.`,
          2: `Migration pressure rises as lead animals enter or commit to the crossing while the route remains readable.`,
          3: `Peak crossing beat with herd movement, route tension, water or terrain pressure, safe spacing, and no graphic outcome.`,
          4: `After-crossing or unresolved route frame with herd direction, scale, and migration path still clear.`,
        },
      };
    case StoryMode.SCAVENGER_CONFLICT:
      return {
        ...common,
        primaryTitle: "Claim Holder Master Image",
        secondaryTitle: "Challenger Master Image",
        environmentTitle: "Food Zone / Environment Reference",
        primaryCopyLabel: "Claim Holder Reference",
        secondaryCopyLabel: "Challenger Reference",
        environmentCopyLabel: "Food Zone Reference",
        primaryReferenceLabel: "Claim holder reference image",
        secondaryReferenceLabel: "Challenger reference image",
        environmentReferenceLabel: "Food zone / environment reference image",
        primaryKind: "animal",
        secondaryKind: "animal",
        environmentKind: "food-zone",
        primaryPreserveLine: animalPreserveLine(primary),
        secondaryPreserveLine: animalPreserveLine(secondary),
        environmentPreserveLine: nonAnimalPreserveLine(foodItem, "food-zone"),
        mergeCompositionLine: `${primary} holds a guarded claim posture near ${foodItem} while ${secondary} circles at the edge; show claim-line pressure, clean spacing, one open lane, golden-hour habitat context, and no contact.`,
        mergeStageSubjectLine: `${primary}, ${secondary}, and ${foodItem}`,
        mergeStageDirections: {
          1: `${primary} holds a guarded claim posture near ${foodItem} while ${secondary} watches from the edge; clean claim-line tension, no visible carcass detail.`,
          2: `${secondary} circles closer along the edge of the claim zone while ${primary} stays planted and alert; spacing tightens, eye-lines lock, golden-hour rim light, no contact.`,
          3: `${primary} opens its wings slightly in a defensive display as ${secondary} pauses mid-step at the boundary; strongest non-graphic action beat, cinematic survival pressure, no bite, no strike, no visible injury.`,
          4: `${secondary} holds back while ${primary} keeps the claim line; unresolved wildlife standoff, food source still obscured, clean documentary ending, no graphic feeding.`,
        },
      };
    default:
      return buildBaseRoles(data);
  }
}

export function buildModeAwareImageReferencePrompt({
  subjectName,
  roleTitle,
  kind,
  preserveLine,
  modeLabel,
  relationshipLine,
  sceneGoal,
}: {
  subjectName: string;
  roleTitle: string;
  kind: ImageReferenceKind;
  preserveLine: string;
  modeLabel: string;
  relationshipLine: string;
  sceneGoal: string;
}) {
  const subjectLine = kind === "animal" || kind === "group" || kind === "offspring"
    ? `${subjectName} only. ${kind === "group" ? "Show a readable group/formation when appropriate." : "Show one clean subject only unless the role explicitly needs a family unit."}`
    : kind === "environment"
      ? `${subjectName} only as an environment reference; do not include animals or humans.`
      : `${subjectName} only as a ${roleTitle.toLowerCase()}; do not turn it into an animal character.`;
  const backgroundLine = kind === "hazard" || kind === "route" || kind === "food-zone"
    ? "No animals unless the role specifically requires tiny scale context; prioritize the reference element, terrain, atmosphere, and clean compositing space."
    : "Simple uncluttered natural background, clean silhouette, full-body or full-element readability.";

  return [
    "Photorealistic wildlife documentary master reference image.",
    subjectLine,
    `${roleTitle} for WSTV ${modeLabel}.`,
    `${preserveLine}`,
    `${sceneGoal} ${relationshipLine}`,
    backgroundLine,
    "Production-ready wildlife master reference image for Nano Banana 2 primary image generation.",
    "No blood, no gore, no visible wounds, no duplicate animals, no humans, no text, no watermark, no graphic injury.",
  ].join(" ");
}
