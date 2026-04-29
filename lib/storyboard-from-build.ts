import { getDurationLaneConfig } from "@/lib/duration-lanes";
import { habitatPromptMap } from "@/lib/habitat-presets";
import type {
  Arc,
  BuildWorkflowPresetSnapshot,
  CameraAnglePreset,
  DurationLane,
  HabitatPreset,
  Weather,
} from "@/types";
import type {
  StoryboardPreviewData,
  StoryboardPreviewScene,
  StoryboardPromptCheck,
  StoryboardSceneCheck,
  StoryboardValidationSummary,
} from "@/lib/storyboard-preview";

export type StoryboardBuildInput = Pick<
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
>;

type StoryboardExportScene = {
  id: number;
  name: string;
  description: string;
  camera: string;
  motion: string;
  subject: string;
  action: string;
  lighting: string;
  style: string;
  environment: string;
  duration: number;
  finalShotReference?: string | null;
};

export type StoryboardExportData = {
  project: string;
  duration: number;
  styleGuide: string;
  negativePrompt: string;
  continuityRules: string[];
  scenes: StoryboardExportScene[];
};

type StoryboardBuildPreview = StoryboardPreviewData & {
  exportData: StoryboardExportData;
};

type SceneBlueprint = {
  id: number;
  name: string;
  description: string;
  camera: string;
  motion: string;
  subject: string;
  action: string;
  lighting: string;
  style: string;
  environment: string;
  duration: number;
  finalShotReference?: string | null;
};

const STYLE_GUIDE = "photorealistic wildlife documentary";
const NEGATIVE_PROMPT =
  "no final-shot rendering, no text overlays, no dust clouds, no debris spray, no unstable anatomy, no overlapping subjects";
const CONTINUITY_RULES = [
  "preserve subject identity from the current Build setup",
  "maintain readable predator-left and prey-right blocking unless the beat explicitly changes it",
  "keep anatomy stable across storyboard scenes",
  "preserve grounded contact and environmental continuity",
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_");
}

function formatSceneName(name: string): string {
  return name
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function resolveLighting(weather: Weather): string {
  switch (weather) {
    case "Storm":
      return "storm-dark sky with cold directional light";
    case "Overcast":
      return "soft overcast daylight";
    case "Dawn":
      return "pale dawn light";
    case "Midday Heat":
      return "hard midday heat shimmer";
    case "Winter Blizzard":
      return "blizzard-filtered winter light";
    case "Frozen Dusk":
      return "cold dusk light with low blue contrast";
    default:
      return "golden hour wildlife light";
  }
}

function inferAutoEnvironment(predator: string, prey: string, arc: Arc): string {
  const names = `${predator} ${prey}`.toLowerCase();

  if (names.includes("crocodile") || names.includes("alligator")) {
    return "muddy riverbank with wet reeds and readable wildlife spacing";
  }
  if (names.includes("eagle") || names.includes("fish")) {
    return "cold river edge with rocky footing and clean approach lanes";
  }
  if (names.includes("lion") || names.includes("zebra") || names.includes("hyena")) {
    return "open savanna grassland with clean sightlines and dust-free footing";
  }
  if (names.includes("tiger") || names.includes("boar")) {
    return "dense jungle river edge with firm ground and readable subject spacing";
  }
  if (names.includes("bear") || names.includes("bison")) {
    return "snowy mountain valley with firm grass and rocky footing";
  }
  if (names.includes("wolf") || names.includes("elk") || names.includes("deer")) {
    return "winter forest edge with open spacing and stable ground contact";
  }
  if (arc === "Escape from danger") {
    return "natural open wildlife habitat with readable escape spacing";
  }

  return "natural open wildlife habitat with readable spacing";
}

function resolveEnvironment(
  predator: string,
  prey: string,
  habitat: HabitatPreset,
  arc: Arc,
  sceneDescription: string
): string {
  if (sceneDescription.trim()) {
    return sceneDescription.trim();
  }

  if (habitat !== "Auto") {
    return habitatPromptMap[habitat];
  }

  return inferAutoEnvironment(predator, prey, arc);
}

function resolveCamera(baseCamera: string, selectedPreset: CameraAnglePreset): string {
  if (selectedPreset === "Auto") return baseCamera;

  const presetMap: Record<Exclude<CameraAnglePreset, "Auto">, string> = {
    "Front full-body": "front full-body cinematic shot",
    "Side profile": "side-profile wildlife shot",
    "Low-angle power": "low-angle power shot",
    "Over-the-shoulder": "over-the-shoulder tension shot",
    Overhead: "overhead wildlife shot",
    Waterline: "waterline wildlife shot",
    "Ground-level tension": "ground-level tension shot",
  };

  return presetMap[selectedPreset] ?? baseCamera;
}

function getSceneDurations(lane: DurationLane): number[] {
  switch (lane) {
    case "medium":
      return [6, 7, 7, 8, 7];
    case "long":
      return [7, 8, 8, 9, 8];
    default:
      return [4, 4, 5, 7];
  }
}

function buildMainTensionAction(predator: string, prey: string, arc: Arc): string {
  switch (arc) {
    case "Defender stands ground":
      return `${predator} on the left and ${prey} on the right, both holding ground with one dominant tension beat and no overlap`;
    case "Escape from danger":
      return `${predator} on the left pressing forward while ${prey} on the right breaks into a clean escape lane`;
    case "Pack hunting strategy":
      return `${predator} on the left collapsing space while ${prey} on the right searches for a clean exit lane`;
    case "Territory dominance battle":
      return `${predator} on the left and ${prey} on the right locking into a controlled dominance beat with grounded weight transfer`;
    case "Giant vs giant clash":
      return `${predator} on the left and ${prey} on the right leaning into a giant-scale standoff with readable spacing`;
    case "Predator vs predator fight":
      return `${predator} on the left and ${prey} on the right holding one dominant confrontation beat with clear body-line separation`;
    case "Chase and takedown":
      return `${predator} on the left driving the lane while ${prey} on the right commits to a single evasive action`;
    default:
      return `${predator} on the left closing measured pressure while ${prey} on the right braces for the main tension beat`;
  }
}

function buildSceneBlueprints(input: StoryboardBuildInput): SceneBlueprint[] {
  const predator = input.predator.trim();
  const prey = input.prey.trim();
  const lighting = resolveLighting(input.weather);
  const environment = resolveEnvironment(
    predator,
    prey,
    input.habitat,
    input.arc,
    input.sceneDescription
  );
  const durations = getSceneDurations(input.durationLane);
  const needsFifthScene = durations.length === 5;

  const scenes: SceneBlueprint[] = [
    {
      id: 1,
      name: "establishing_habitat",
      description: `wide habitat setup before direct contact in ${environment}`,
      camera: resolveCamera("wide cinematic shot", input.cameraAnglePreset),
      motion: "slow pan",
      subject: `${prey} visible in the frame while ${predator} remains outside the first beat`,
      action: `${prey} holding alert body language in a clean, readable environment lane`,
      lighting,
      style: STYLE_GUIDE,
      environment,
      duration: durations[0],
      finalShotReference: null,
    },
    {
      id: 2,
      name: "predator_entry",
      description: `predator entry with clear lane separation in ${environment}`,
      camera: resolveCamera("medium-wide documentary shot", input.cameraAnglePreset),
      motion: "subtle tracking move",
      subject: `${predator} on the left entering frame while ${prey} holds the right side`,
      action: `${predator} building controlled pressure without overlap or rushed motion`,
      lighting,
      style: STYLE_GUIDE,
      environment,
      duration: durations[1],
      finalShotReference: null,
    },
    {
      id: 3,
      name: "reaction_hold",
      description: `prey or defender reaction beat with readable subject spacing in ${environment}`,
      camera: resolveCamera("locked wide shot", input.cameraAnglePreset),
      motion: "minimal camera movement",
      subject: `${prey} on the right reacting while ${predator} on the left holds pressure`,
      action: `${prey} shifting weight, reading the threat, and preserving a clean reaction lane`,
      lighting,
      style: STYLE_GUIDE,
      environment,
      duration: durations[2],
      finalShotReference: null,
    },
    {
      id: 4,
      name: "main_tension",
      description: `${input.arc.toLowerCase()} staged as the main storyboard tension beat in ${environment}`,
      camera: resolveCamera("long-lens tension shot", input.cameraAnglePreset),
      motion: "controlled push-in",
      subject: `${predator} and ${prey} fully readable in vertical frame`,
      action: buildMainTensionAction(predator, prey, input.arc),
      lighting,
      style: STYLE_GUIDE,
      environment,
      duration: durations[3],
      finalShotReference: null,
    },
  ];

  if (needsFifthScene) {
    scenes.push({
      id: 5,
      name: "aftermath_hold",
      description: `aftermath, separation, or final hold beat in ${environment}`,
      camera: resolveCamera("long lens wide shot", input.cameraAnglePreset),
      motion: "slow pull-back",
      subject: `${predator} and ${prey} settling into a clear final frame with intact spacing`,
      action: `${predator} easing pressure while ${prey} regains space, creating a clean documentary-style resolve`,
      lighting,
      style: STYLE_GUIDE,
      environment,
      duration: durations[4],
      finalShotReference: null,
    });
  }

  return scenes;
}

function buildPrompt(
  camera: string,
  motion: string,
  description: string,
  subject: string,
  action: string,
  lighting: string,
  style: string,
  suffix: string
): string {
  return `${camera}, ${motion}. ${description}. ${subject}, ${action}. ${lighting}, ${style}. 9:16 vertical framing. Continuity rules: ${CONTINUITY_RULES.join(
    ", "
  )}. ${suffix}`;
}

function makePreviewScene(scene: SceneBlueprint, startTime: number): StoryboardPreviewScene {
  const imagePrompt = buildPrompt(
    scene.camera,
    scene.motion,
    scene.description,
    scene.subject,
    scene.action,
    scene.lighting,
    scene.style,
    "Single storyboard frame, clean composition for edit planning, clear silhouette readability."
  );
  const videoPrompt = buildPrompt(
    scene.camera,
    scene.motion,
    scene.description,
    scene.subject,
    scene.action,
    scene.lighting,
    scene.style,
    "Stable anatomy, continuity-safe blocking, no overlap between subjects, grounded contact preserved."
  );
  const runwayPrompt = buildPrompt(
    scene.camera,
    scene.motion,
    scene.description,
    scene.subject,
    scene.action,
    scene.lighting,
    scene.style,
    "Prioritize camera movement readability, source-image continuity, strong foreground-background separation, edit-friendly composition, and image-to-video stability."
  );
  const klingPrompt = buildPrompt(
    scene.camera,
    scene.motion,
    scene.description,
    scene.subject,
    scene.action,
    scene.lighting,
    scene.style,
    "Prioritize motion clarity, readable left-right subject blocking, clean action timing, realistic physics, and stable contact with the ground."
  );

  return {
    id: scene.id,
    name: scene.name,
    displayName: formatSceneName(scene.name),
    startTime,
    duration: scene.duration,
    camera: scene.camera,
    motion: scene.motion,
    finalShotReference: scene.finalShotReference ?? null,
    previewImage: null,
    previewVideo: null,
    promptReference: "",
    runwayPromptReference: "",
    klingPromptReference: "",
    imagePrompt,
    videoPrompt,
    runwayPrompt,
    klingPrompt,
    negativePrompt: NEGATIVE_PROMPT,
    continuityRules: CONTINUITY_RULES,
  };
}

function buildValidationSummary(sceneCount: number, promptCount: number): StoryboardValidationSummary {
  return {
    sceneCount,
    promptCount,
    validScenes: sceneCount,
    validPrompts: promptCount,
  };
}

function buildSceneChecks(scenes: StoryboardPreviewScene[]): StoryboardSceneCheck[] {
  return scenes.map((scene) => ({
    sceneId: scene.id,
    sceneName: scene.name,
    valid: true,
    errors: [],
  }));
}

function buildPromptChecks(scenes: StoryboardPreviewScene[]): StoryboardPromptCheck[] {
  return scenes.flatMap((scene) =>
    (["image", "video", "runway", "kling"] as const).map((promptType) => ({
      sceneId: scene.id,
      sceneName: scene.name,
      promptType,
      valid: true,
      failedChecks: [],
    }))
  );
}

export function buildStoryboardPreviewFromBuild(
  input: StoryboardBuildInput
): StoryboardBuildPreview {
  const normalizedInput: StoryboardBuildInput = {
    ...input,
    predator: input.predator.trim(),
    prey: input.prey.trim(),
    sceneDescription: input.sceneDescription.trim(),
  };

  const blueprints = buildSceneBlueprints(normalizedInput);
  let startTime = 0;
  const sequence = blueprints.map((scene) => {
    const nextScene = makePreviewScene(scene, startTime);
    startTime += scene.duration;
    return nextScene;
  });

  const promptChecks = buildPromptChecks(sequence);
  const project = `${slugify(normalizedInput.predator)}_vs_${slugify(normalizedInput.prey)}_storyboard`;
  const exportData: StoryboardExportData = {
    project,
    duration: startTime,
    styleGuide: STYLE_GUIDE,
    negativePrompt: NEGATIVE_PROMPT,
    continuityRules: CONTINUITY_RULES,
    scenes: blueprints.map((scene) => ({
      id: scene.id,
      name: scene.name,
      description: scene.description,
      camera: scene.camera,
      motion: scene.motion,
      subject: scene.subject,
      action: scene.action,
      lighting: scene.lighting,
      style: scene.style,
      environment: scene.environment,
      duration: scene.duration,
      finalShotReference: scene.finalShotReference ?? null,
    })),
  };

  return {
    mode: "build",
    sourceLabel: "Generated from current Build setup",
    project,
    duration: startTime,
    sceneCount: sequence.length,
    valid: true,
    summary: buildValidationSummary(sequence.length, promptChecks.length),
    sceneChecks: buildSceneChecks(sequence),
    promptChecks,
    sequence,
    exportData,
  };
}

export function buildStoryboardDownloadFilename(
  preview: { project: string }
): string {
  return `${preview.project}.storyboard.json`;
}

export function getStoryboardBuildSummary(input: StoryboardBuildInput): string {
  const lane = getDurationLaneConfig(input.durationLane);
  return `${input.predator} vs ${input.prey} • ${lane.totalEditLabel} • ${input.arc}`;
}
