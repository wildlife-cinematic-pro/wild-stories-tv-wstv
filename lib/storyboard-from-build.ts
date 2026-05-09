import { habitatPromptMap } from "@/lib/habitat-presets";

import type {
  Arc,
  BuildWorkflowPresetSnapshot,
  CameraAnglePreset,
  ContentLane,
  DurationLane,
  HabitatPreset,
  Weather,
} from "@/types";

export type StoryboardValidationSummary = {
  sceneCount: number;
  promptCount: number;
  validScenes: number;
  validPrompts: number;
};

export type StoryboardValidationCheck = {
  sceneId: number;
  sceneName: string;
  valid: boolean;
  errors?: string[];
  promptType?: string;
  failedChecks?: string[];
};

export type StoryboardMasterImageStrategy = {
  masterImagePrimaryEngine: "nano-banana-2";
  masterImageBackupEngine: "gpt-image-2";
  masterImageUseCase: string;
  backupImageUseCase: string;
};

export type StoryboardPreviewScene = {
  id: number;
  name: string;
  displayName: string;
  startTime: number;
  duration: number;
  camera: string;
  motion: string;
  description: string;
  subject: string;
  action: string;
  environment: string;
  lighting: string;
  finalShotReference: string | null;
  previewImage: string | null;
  previewVideo: string | null;
  promptReference: string;
  runwayPromptReference: string;
  klingPromptReference: string;
  imagePrompt: string;
  nanoBananaPrompt?: string;
  gptImagePrompt?: string;
  videoPrompt: string;
  runwayPrompt: string;
  klingPrompt: string;
  negativePrompt: string;
  continuityRules: string[];
};

export type StoryboardPreviewData = StoryboardMasterImageStrategy & {
  project: string;
  duration: number;
  sceneCount: number;
  valid: boolean;
  sourceLabel: "Static storyboard" | "Generated from current Build setup";
  summary: StoryboardValidationSummary;
  sceneChecks: StoryboardValidationCheck[];
  promptChecks: StoryboardValidationCheck[];
  negativePrompt: string;
  continuityRules: string[];
  sequence: StoryboardPreviewScene[];
};

export type BuildStoryboardInput = Pick<
  BuildWorkflowPresetSnapshot,
  | "predator"
  | "prey"
  | "habitat"
  | "weather"
  | "arc"
  | "contentLane"
  | "cameraAnglePreset"
  | "durationLane"
  | "sceneDescription"
> & {
  finalEnvironment?: string | null;
};

type StoryboardSourceScene = {
  id: number;
  name: string;
  description: string;
  camera: string;
  motion: string;
  subject: string;
  action: string;
  lighting: string;
  style?: string;
  environment: string;
  duration: number;
  generateVideo?: boolean;
  videoEngine?: string;
  finalShotReference?: string | null;
};

export type StoryboardJsonExport = StoryboardMasterImageStrategy & {
  project: string;
  duration: number;
  imageEngine: string;
  videoEngine: string;
  styleGuide: string;
  negativePrompt: string;
  continuityRules: string[];
  aspectRatio: string;
  scenes: StoryboardSourceScene[];
};

const STORYBOARD_STYLE_GUIDE = "photorealistic wildlife documentary";
const STORYBOARD_NEGATIVE_PROMPT =
  "no text, no watermark, no dust clouds, no debris spray, no kicked-up soil, no extra limbs, no distorted anatomy, no overlapping subjects";
const STORYBOARD_CONTINUITY_RULES = [
  "preserve subject identity from the master image",
  "maintain readable left-right blocking unless the beat explicitly changes it",
  "keep anatomy stable across scene transitions",
  "preserve grounded paw, hoof, claw, or body contact with the terrain",
  "keep coat, fur, feather, horn, and marking continuity stable",
] as const;

const STORYBOARD_MASTER_IMAGE_STRATEGY: StoryboardMasterImageStrategy = {
  masterImagePrimaryEngine: "nano-banana-2",
  masterImageBackupEngine: "gpt-image-2",
  masterImageUseCase: "wildlife documentary source still",
  backupImageUseCase: "thumbnail, cover, alternate clean frame",
};

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function formatSceneName(name: string): string {
  return name
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function asSentence(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function joinSentenceParts(parts: Array<string | null | undefined>): string {
  return parts
    .map((part) => (part ?? "").trim())
    .filter(Boolean)
    .map((part) => asSentence(part))
    .join(" ");
}

function normalizeAnimalName(value: string): string {
  return value.trim() || "wild animal";
}

function getLaneLabel(contentLane: ContentLane): string {
  return contentLane === "Auto" ? "wildlife tension" : contentLane.toLowerCase();
}

function getWeatherLighting(weather: Weather): string {
  switch (weather) {
    case "Golden Hour":
      return "golden-hour documentary light";
    case "Storm":
      return "storm-heavy wildlife light with wet contrast";
    case "Overcast":
      return "soft overcast wildlife light";
    case "Dawn":
      return "blue-to-gold dawn wildlife light";
    case "Midday Heat":
      return "hard midday wildlife light with clean contrast";
    case "Winter Blizzard":
      return "cold blizzard light with pale snow diffusion";
    case "Frozen Dusk":
      return "cold dusk wildlife light with blue edge haze";
    default:
      return "natural wildlife documentary light";
  }
}

function inferEnvironmentFromAnimals(
  predator: string,
  prey: string,
  arc: Arc,
  contentLane: ContentLane
): string {
  const combined = `${predator} ${prey}`.toLowerCase();

  if (/(orc|seal|shark|whale|dolphin)/.test(combined)) {
    return "cold coastal water with readable spacing";
  }

  if (/(crocodile|alligator|caiman)/.test(combined)) {
    return "muddy riverbank wetland with a clean shoreline tension lane";
  }

  if (/(eagle|hawk|owl|falcon)/.test(combined)) {
    return /(fish|salmon|trout)/.test(combined)
      ? "cold river edge with clear strike spacing"
      : "open ridge or meadow edge with strong full-body visibility";
  }

  if (/(lion|zebra|wildebeest|gazelle|hyena|cheetah|leopard|antelope)/.test(combined)) {
    return "open savanna grassland with readable predator-prey spacing";
  }

  if (/(tiger|boar|wild boar)/.test(combined)) {
    return "dense river-forest edge with one clean wildlife corridor";
  }

  if (/(fox|rabbit|hare)/.test(combined)) {
    return "meadow edge with low brush and readable escape lanes";
  }

  if (/(bear|bison|wolf|elk|deer|moose|cougar|mountain lion)/.test(combined)) {
    if (arc === "Giant vs giant clash") {
      return "open mountain valley with firm ground and readable spacing";
    }

    if (contentLane === "Pack Hunt") {
      return "winter forest edge with a clean pursuit lane";
    }

    return "natural open wildlife habitat with readable spacing";
  }

  return "natural open wildlife habitat with readable spacing";
}

function resolveEnvironment(input: BuildStoryboardInput): string {
  if (input.finalEnvironment && input.finalEnvironment.trim()) {
    return input.finalEnvironment.trim();
  }

  if (input.habitat !== "Auto") {
    return habitatPromptMap[input.habitat as Exclude<HabitatPreset, "Auto">];
  }

  return inferEnvironmentFromAnimals(
    input.predator,
    input.prey,
    input.arc,
    input.contentLane
  );
}

function buildProjectName(predator: string, prey: string): string {
  return `storyboard_${slugify(predator)}_vs_${slugify(prey)}`;
}

function getSceneDurations(durationLane: DurationLane): number[] {
  switch (durationLane) {
    case "medium":
      return [4, 5, 5, 6, 4];
    case "long":
      return [5, 5, 6, 7, 5];
    case "short":
    default:
      return [4, 4, 5, 5];
  }
}

function getCameraLines(cameraAnglePreset: CameraAnglePreset, hasFinalHold: boolean) {
  const establishing =
    cameraAnglePreset === "Overhead"
      ? "high overhead establishing shot"
      : cameraAnglePreset === "Waterline"
        ? "waterline establishing shot"
        : "wide cinematic establishing shot";

  const entry =
    cameraAnglePreset === "Ground-level tension"
      ? "ground-level tension shot"
      : cameraAnglePreset === "Low-angle power"
        ? "low-angle documentary entry shot"
        : "medium-wide documentary shot";

  const reaction =
    cameraAnglePreset === "Front full-body"
      ? "front full-body reaction shot"
      : cameraAnglePreset === "Side profile"
        ? "side-profile reaction shot"
        : "locked medium-wide reaction shot";

  const tension =
    cameraAnglePreset === "Over-the-shoulder"
      ? "over-the-shoulder tension shot"
      : cameraAnglePreset === "Low-angle power"
        ? "low-angle confrontation shot"
        : "locked wide tension shot";

  const finalHold =
    cameraAnglePreset === "Side profile"
      ? "side-profile separation shot"
      : "long-lens final hold";

  return hasFinalHold
    ? [establishing, entry, reaction, tension, finalHold]
    : [establishing, entry, reaction, tension];
}

function getMotionLines(hasFinalHold: boolean) {
  return hasFinalHold
    ? ["slow pan", "subtle tracking move", "measured drift", "controlled push-in", "slow pull-back"]
    : ["slow pan", "subtle tracking move", "measured drift", "controlled hold"];
}

function buildMainTensionAction(
  predator: string,
  prey: string,
  arc: Arc,
  sceneDescription: string
): { description: string; action: string } {
  const normalizedPredator = normalizeAnimalName(predator);
  const normalizedPrey = normalizeAnimalName(prey);
  const customBeat = sceneDescription.trim();

  if (customBeat) {
    return {
      description: customBeat,
      action: `${normalizedPredator} and ${normalizedPrey} hold one dominant wildlife tension beat with readable spacing`,
    };
  }

  switch (arc) {
    case "Ambush attack":
      return {
        description: "the pressure line tightens just before a committed move",
        action: `${normalizedPredator} compresses forward pressure while ${normalizedPrey} loads a defensive reaction`,
      };
    case "Predator vs predator fight":
      return {
        description: "two powerful bodies read each other before direct conflict",
        action: `${normalizedPredator} and ${normalizedPrey} hold a hard mirrored standoff without contact overlap`,
      };
    case "Chase and takedown":
      return {
        description: "the chase compresses into a single readable near-contact beat",
        action: `${normalizedPredator} commits forward pressure while ${normalizedPrey} breaks into a final escape move`,
      };
    case "Escape from danger":
      return {
        description: "the escape lane opens as pressure peaks",
        action: `${normalizedPrey} pivots to flee while ${normalizedPredator} drives the final threat beat`,
      };
    case "Territory dominance battle":
      return {
        description: "territorial pressure peaks without messy overlap",
        action: `${normalizedPredator} claims space while ${normalizedPrey} answers with planted defensive posture`,
      };
    case "Pack hunting strategy":
      return {
        description: "pressure closes from multiple angles while the escape lane narrows",
        action: `${normalizedPredator} controls the lane while ${normalizedPrey} reads the collapsing route`,
      };
    case "Defender stands ground":
      return {
        description: "the defender commits to a clear no-retreat beat",
        action: `${normalizedPrey} plants hard while ${normalizedPredator} tests the boundary without overlap`,
      };
    case "Giant vs giant clash":
      return {
        description: "mass and posture create a giant-versus-giant pressure hold",
        action: `${normalizedPredator} and ${normalizedPrey} square up with clear weight, distance, and footing`,
      };
    default:
      return {
        description: "one clean wildlife tension beat with readable spacing",
        action: `${normalizedPredator} and ${normalizedPrey} hold a controlled confrontation beat`,
      };
  }
}

function buildBasePromptCore(args: {
  camera: string;
  motion: string;
  description: string;
  environment: string;
  subject: string;
  action: string;
  lighting: string;
  styleGuide?: string;
  continuityRules: readonly string[];
}) {
  return joinSentenceParts([
    `${args.camera}, ${args.motion}`,
    `${args.description} in ${args.environment}`,
    `${args.subject}, ${args.action}`,
    `${args.lighting}, ${args.styleGuide ?? STORYBOARD_STYLE_GUIDE}`,
    "full-frame wildlife reel framing",
    `Continuity rules: ${args.continuityRules.join(", ")}`,
  ]);
}

export function buildNanoBananaPrompt(args: {
  predator: string;
  prey: string;
  environment: string;
  lighting: string;
  camera: string;
  description: string;
  action: string;
  continuityRules?: readonly string[];
  negativePrompt?: string;
}): string {
  const predatorName = normalizeAnimalName(args.predator);
  const preyName = normalizeAnimalName(args.prey);
  const continuity = args.continuityRules ?? STORYBOARD_CONTINUITY_RULES;
  const negativePrompt = args.negativePrompt ?? STORYBOARD_NEGATIVE_PROMPT;

  return joinSentenceParts([
    "Photorealistic wildlife documentary master still",
    `A ${predatorName} on the left and a ${preyName} on the right, clear readable spacing, no overlap`,
    `${args.description}; ${args.action}`,
    args.environment,
    args.lighting,
    `${args.camera}, long-lens documentary framing`,
    `Continuity rules: ${continuity.join(", ")}`,
    "Stable animal anatomy, realistic fur, feather, horn, or scale detail, grounded contact, consistent coat markings, clean first-frame composition for image-to-video",
    negativePrompt,
  ]);
}

export function buildGptImagePrompt(args: {
  predator: string;
  prey: string;
  environment: string;
  lighting: string;
  camera: string;
  description: string;
  action: string;
  continuityRules?: readonly string[];
  negativePrompt?: string;
}): string {
  const predatorName = normalizeAnimalName(args.predator);
  const preyName = normalizeAnimalName(args.prey);
  const continuity = args.continuityRules ?? STORYBOARD_CONTINUITY_RULES;
  const negativePrompt = args.negativePrompt ?? STORYBOARD_NEGATIVE_PROMPT;

  return joinSentenceParts([
    "Clean wildlife cover still, strict composition backup for GPT Image 2",
    `A ${predatorName} and a ${preyName} with high subject readability, clean left-right blocking, thumbnail-safe framing, and optional cover-safe negative space`,
    `${args.description}; ${args.action}`,
    args.environment,
    args.lighting,
    `${args.camera}, clear composition with readable foreground-background separation`,
    `Continuity rules: ${continuity.join(", ")}`,
    "Poster-clean subject separation, stable anatomy, sharp silhouette readability, no text unless explicitly requested",
    negativePrompt,
  ]);
}

function buildPreviewScene(args: {
  id: number;
  name: string;
  startTime: number;
  duration: number;
  camera: string;
  motion: string;
  description: string;
  subject: string;
  action: string;
  environment: string;
  lighting: string;
  generateVideo?: boolean;
  finalShotReference?: string | null;
  predator: string;
  prey: string;
  negativePrompt: string;
  continuityRules: readonly string[];
}): StoryboardPreviewScene {
  const promptCore = buildBasePromptCore({
    camera: args.camera,
    motion: args.motion,
    description: args.description,
    environment: args.environment,
    subject: args.subject,
    action: args.action,
    lighting: args.lighting,
    continuityRules: args.continuityRules,
  });

  const filePrefix = String(args.id).padStart(2, "0");
  const imagePrompt = joinSentenceParts([
    promptCore,
    "Single storyboard frame, clean composition for edit planning, clear silhouette readability",
  ]);
  const videoPrompt = joinSentenceParts([
    promptCore,
    "Stable anatomy, continuity-safe blocking, no overlap between subjects, grounded contact preserved",
  ]);
  const runwayPrompt = joinSentenceParts([
    promptCore,
    "Prioritize camera movement readability, source-image continuity, strong composition, and image-to-video stability",
  ]);
  const klingPrompt = joinSentenceParts([
    promptCore,
    "Prioritize motion clarity, readable subject blocking, clean action timing, realistic physics, and stable contact with the ground",
  ]);

  return {
    id: args.id,
    name: args.name,
    displayName: formatSceneName(args.name),
    startTime: args.startTime,
    duration: args.duration,
    camera: args.camera,
    motion: args.motion,
    description: args.description,
    subject: args.subject,
    action: args.action,
    environment: args.environment,
    lighting: args.lighting,
    finalShotReference: args.finalShotReference ?? null,
    previewImage: `images/${filePrefix}_${args.name}.png`,
    previewVideo: args.generateVideo === false ? null : `videos/${filePrefix}_${args.name}.mp4`,
    promptReference: `prompts/${filePrefix}_${args.name}.prompts.json`,
    runwayPromptReference: `prompts/${filePrefix}_${args.name}.runway.txt`,
    klingPromptReference: `prompts/${filePrefix}_${args.name}.kling.txt`,
    imagePrompt,
    nanoBananaPrompt: buildNanoBananaPrompt({
      predator: args.predator,
      prey: args.prey,
      environment: args.environment,
      lighting: args.lighting,
      camera: args.camera,
      description: args.description,
      action: args.action,
      continuityRules: args.continuityRules,
      negativePrompt: args.negativePrompt,
    }),
    gptImagePrompt: buildGptImagePrompt({
      predator: args.predator,
      prey: args.prey,
      environment: args.environment,
      lighting: args.lighting,
      camera: args.camera,
      description: args.description,
      action: args.action,
      continuityRules: args.continuityRules,
      negativePrompt: args.negativePrompt,
    }),
    videoPrompt,
    runwayPrompt,
    klingPrompt,
    negativePrompt: args.negativePrompt,
    continuityRules: [...args.continuityRules],
  };
}

export function deriveMasterImagePrompts(args: {
  predator: string;
  prey: string;
  scene: Pick<
    StoryboardPreviewScene,
    "camera" | "description" | "action" | "environment" | "lighting"
  >;
  continuityRules?: readonly string[];
  negativePrompt?: string;
}) {
  return {
    nanoBananaPrompt: buildNanoBananaPrompt({
      predator: args.predator,
      prey: args.prey,
      environment: args.scene.environment,
      lighting: args.scene.lighting,
      camera: args.scene.camera,
      description: args.scene.description,
      action: args.scene.action,
      continuityRules: args.continuityRules,
      negativePrompt: args.negativePrompt,
    }),
    gptImagePrompt: buildGptImagePrompt({
      predator: args.predator,
      prey: args.prey,
      environment: args.scene.environment,
      lighting: args.scene.lighting,
      camera: args.scene.camera,
      description: args.scene.description,
      action: args.scene.action,
      continuityRules: args.continuityRules,
      negativePrompt: args.negativePrompt,
    }),
  };
}

function buildStoryboardSourceScenes(input: BuildStoryboardInput): StoryboardSourceScene[] {
  const predator = normalizeAnimalName(input.predator);
  const prey = normalizeAnimalName(input.prey);
  const environment = resolveEnvironment(input);
  const lighting = getWeatherLighting(input.weather);
  const hasFinalHold = input.durationLane !== "short";
  const durations = getSceneDurations(input.durationLane);
  const cameras = getCameraLines(input.cameraAnglePreset, hasFinalHold);
  const motions = getMotionLines(hasFinalHold);
  const tensionBeat = buildMainTensionAction(
    predator,
    prey,
    input.arc,
    input.sceneDescription
  );

  const scenes: Array<Omit<StoryboardSourceScene, "id" | "duration">> = [
    {
      name: "establishing_habitat",
      description: "the habitat establishes clean subject spacing and the first readable tension lane",
      camera: cameras[0],
      motion: motions[0],
      subject: `the ${prey} holds the right side of frame while the ${predator} remains readable at distance`,
      action: "both animals stay grounded and fully readable inside the environment",
      lighting,
      style: STORYBOARD_STYLE_GUIDE,
      environment,
      generateVideo: true,
      videoEngine: "runway-gen-2",
      finalShotReference: null,
    },
    {
      name: "predator_entry",
      description: `${predator} enters the threat lane without breaking clean left-right readability`,
      camera: cameras[1],
      motion: motions[1],
      subject: `the ${predator} enters from the left while the ${prey} holds the right`,
      action: `${predator} applies cautious pressure and ${prey} reads the approach`,
      lighting,
      style: STORYBOARD_STYLE_GUIDE,
      environment,
      generateVideo: true,
      videoEngine: "kling",
      finalShotReference: null,
    },
    {
      name: "prey_reaction",
      description: `${prey} answers the threat with a single readable reaction beat`,
      camera: cameras[2],
      motion: motions[2],
      subject: `the ${prey} stays on the right while the ${predator} remains visible on the left`,
      action: `${prey} shifts weight, posture, or eyeline while keeping grounded spacing`,
      lighting,
      style: STORYBOARD_STYLE_GUIDE,
      environment,
      generateVideo: true,
      videoEngine: "runway-gen-2",
      finalShotReference: null,
    },
    {
      name: "main_tension",
      description: tensionBeat.description,
      camera: cameras[3],
      motion: motions[3],
      subject: `the ${predator} on the left and the ${prey} on the right`,
      action: tensionBeat.action,
      lighting,
      style: STORYBOARD_STYLE_GUIDE,
      environment,
      generateVideo: true,
      videoEngine: "kling",
      finalShotReference: null,
    },
  ];

  if (hasFinalHold) {
    scenes.push({
      name: "final_hold",
      description: "the scene resolves into a clean aftermath or separation hold",
      camera: cameras[4],
      motion: motions[4],
      subject: `the ${predator} and the ${prey} keep readable separation for the final hold`,
      action: "the motion settles while anatomy, markings, and spacing stay stable",
      lighting,
      style: STORYBOARD_STYLE_GUIDE,
      environment,
      generateVideo: false,
      videoEngine: "runway-gen-2",
      finalShotReference: null,
    });
  }

  let startTime = 0;

  return scenes.map((scene, index) => {
    const duration = durations[index] ?? 4;
    const sourceScene: StoryboardSourceScene = {
      id: index + 1,
      duration,
      ...scene,
    };
    startTime += duration;
    return sourceScene;
  });
}

function buildPreviewSequence(
  input: BuildStoryboardInput,
  sourceScenes: StoryboardSourceScene[]
): StoryboardPreviewScene[] {
  let startTime = 0;

  return sourceScenes.map((scene) => {
    const previewScene = buildPreviewScene({
      id: scene.id,
      name: scene.name,
      startTime,
      duration: scene.duration,
      camera: scene.camera,
      motion: scene.motion,
      description: scene.description,
      subject: scene.subject,
      action: scene.action,
      environment: scene.environment,
      lighting: scene.lighting,
      generateVideo: scene.generateVideo,
      finalShotReference: scene.finalShotReference ?? null,
      predator: input.predator,
      prey: input.prey,
      negativePrompt: STORYBOARD_NEGATIVE_PROMPT,
      continuityRules: STORYBOARD_CONTINUITY_RULES,
    });

    startTime += scene.duration;
    return previewScene;
  });
}

export function buildStoryboardJsonFromBuild(
  input: BuildStoryboardInput
): StoryboardJsonExport {
  const sourceScenes = buildStoryboardSourceScenes(input);
  const duration = sourceScenes.reduce((total, scene) => total + scene.duration, 0);

  return {
    project: buildProjectName(input.predator, input.prey),
    duration,
    imageEngine: "runway-image",
    videoEngine: "runway-gen-2",
    styleGuide: STORYBOARD_STYLE_GUIDE,
    negativePrompt: STORYBOARD_NEGATIVE_PROMPT,
    continuityRules: [...STORYBOARD_CONTINUITY_RULES],
    aspectRatio: "9:16",
    ...STORYBOARD_MASTER_IMAGE_STRATEGY,
    scenes: sourceScenes,
  };
}

export function buildStoryboardPreviewFromBuild(
  input: BuildStoryboardInput
): StoryboardPreviewData {
  const exportData = buildStoryboardJsonFromBuild(input);
  const sequence = buildPreviewSequence(input, exportData.scenes);
  const promptTypes = [
    "image",
    "nano-banana-2",
    "gpt-image-2",
    "video",
    "runway",
    "kling",
  ];
  const promptCount = sequence.length * promptTypes.length;

  return {
    project: exportData.project,
    duration: exportData.duration,
    sceneCount: sequence.length,
    valid: true,
    sourceLabel: "Generated from current Build setup",
    summary: {
      sceneCount: sequence.length,
      promptCount,
      validScenes: sequence.length,
      validPrompts: promptCount,
    },
    sceneChecks: sequence.map((scene) => ({
      sceneId: scene.id,
      sceneName: scene.name,
      valid: true,
      errors: [],
    })),
    promptChecks: sequence.flatMap((scene) =>
      promptTypes.map((promptType) => ({
        sceneId: scene.id,
        sceneName: scene.name,
        promptType,
        valid: true,
        failedChecks: [],
      }))
    ),
    negativePrompt: exportData.negativePrompt,
    continuityRules: exportData.continuityRules,
    sequence,
    ...STORYBOARD_MASTER_IMAGE_STRATEGY,
  };
}

export function getStoryboardMasterImageStrategy(): StoryboardMasterImageStrategy {
  return STORYBOARD_MASTER_IMAGE_STRATEGY;
}
