import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { enhanceInputWithGemini } from "./ai_enhance.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const INPUT_FILE = path.join(__dirname, "storyboard_input.json");
const STORYBOARD_FILE = path.join(__dirname, "storyboard.json");

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function mergeDefined(base, patch) {
  if (!isObject(patch)) return base;
  const next = { ...base };

  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined || value === null) continue;
    if (isObject(value) && isObject(next[key])) {
      next[key] = mergeDefined(next[key], value);
    } else if (typeof value === "string") {
      next[key] = value.trim().length > 0 ? value.trim() : next[key];
    } else {
      next[key] = value;
    }
  }

  return next;
}

function normalizeAnimalObject(value, fallback) {
  if (isObject(value)) {
    const name = hasText(value.name) ? value.name.trim() : fallback.name;
    return {
      name,
      slug: hasText(value.slug) ? slugify(value.slug) : slugify(name),
      role: hasText(value.role) ? value.role.trim() : fallback.role,
      side: hasText(value.side) ? value.side.trim() : fallback.side,
      description: hasText(value.description)
        ? value.description.trim()
        : `${name} with realistic wildlife anatomy, stable natural body mass, clear identity markers, and full body readable`,
      identityNotes: hasText(value.identityNotes)
        ? value.identityNotes.trim()
        : `Preserve ${name} identity, body scale, head shape, coat or skin markers, and grounded foot contact.`,
      referenceImage: value.referenceImage ?? null
    };
  }

  const name = hasText(value) ? value.trim() : fallback.name;
  return {
    name,
    slug: slugify(name),
    role: fallback.role,
    side: fallback.side,
    description: `${name} with realistic wildlife anatomy, stable natural body mass, clear identity markers, and full body readable`,
    identityNotes: `Preserve ${name} identity, body scale, head shape, coat or skin markers, and grounded foot contact.`,
    referenceImage: null
  };
}

function normalizeEnvironmentObject(value, input = {}) {
  if (isObject(value)) {
    const name = hasText(value.name) ? value.name.trim() : "natural wildlife environment";
    return {
      name,
      slug: hasText(value.slug) ? slugify(value.slug) : slugify(name),
      description: hasText(value.description)
        ? value.description.trim()
        : "natural wildlife habitat with clear open central space and habitat texture",
      lighting: hasText(value.lighting) ? value.lighting.trim() : "natural wildlife documentary light",
      rules: hasText(value.rules)
        ? value.rules.trim()
        : "environment reference only, open central space for future wildlife subjects, no animals, no people, no buildings, no roads"
    };
  }

  const name = hasText(value) ? value.trim() : "natural wildlife environment";
  return {
    name,
    slug: slugify(name),
    description: name,
    lighting: hasText(input.lighting) ? input.lighting.trim() : "natural wildlife documentary light",
    rules: "environment reference only, open central space for future wildlife subjects, no animals, no people, no buildings, no roads"
  };
}

function normalizeFinalScene(value, input, predator, prey, environment) {
  const source = isObject(value) ? value : {};
  const sceneDescription = hasText(input.sceneDescription) ? input.sceneDescription.trim() : "";

  return {
    composition:
      source.composition ??
      `prey/defender on the ${prey.side}, predator on the ${predator.side}, clear open reaction lane between them`,
    camera: source.camera ?? "cinematic telephoto documentary framing",
    style: source.style ?? input.styleGuide ?? "photorealistic wildlife documentary",
    aspectRatio: source.aspectRatio ?? input.aspectRatio ?? "9:16",
    tension: source.tension ?? "high survival tension with clean readable spacing",
    action:
      source.action ??
      (sceneDescription ||
        `${prey.name} holds grounded defensive pressure while ${predator.name} reacts with alert survival body language`),
    environmentNotes: source.environmentNotes ?? environment.description
  };
}

function normalizeVideo(value, input) {
  const source = isObject(value) ? value : {};
  const durationLane = input.durationLane;
  const duration = Number(source.duration ?? input.duration ?? (durationLane === "long" ? 20 : 15));

  return {
    duration: Number.isFinite(duration) && duration > 0 ? duration : 15,
    platform: source.platform ?? input.videoEngine ?? "kling",
    format: source.format ?? "multi-shot",
    shotCount: Number(source.shotCount ?? 5),
    musicMood: source.musicMood ?? "tense cinematic wildlife action trailer music",
    regionTarget: source.regionTarget ?? "viral wildlife shorts audience",
    videoEngines: Array.isArray(input.videoEngines) ? input.videoEngines : []
  };
}

function normalizeAiEnhancement(value) {
  const source = isObject(value) ? value : {};
  return {
    enabled: source.enabled !== false,
    provider: source.provider ?? "gemini",
    style: source.style ?? "viral wildlife documentary",
    strictness: source.strictness ?? "preserve identity, stable anatomy, grounded motion, positive prompt wording"
  };
}

function normalizeInput(input) {
  const predator = normalizeAnimalObject(input.predator, {
    name: "predator",
    role: "predator",
    side: input.predatorSide ?? "right"
  });
  const prey = normalizeAnimalObject(input.prey, {
    name: "prey",
    role: "defender",
    side: input.preySide ?? "left"
  });

  const predatorWithLegacy = mergeDefined(predator, {
    description: input.predatorDescription,
    identityNotes: input.predatorIdentityNotes
  });
  const preyWithLegacy = mergeDefined(prey, {
    description: input.preyDescription,
    identityNotes: input.preyIdentityNotes
  });
  const environment = normalizeEnvironmentObject(input.environment, input);
  const finalScene = normalizeFinalScene(input.finalScene, input, predatorWithLegacy, preyWithLegacy, environment);
  const video = normalizeVideo(input.video, input);

  return {
    project: input.project ?? `${preyWithLegacy.slug}_vs_${predatorWithLegacy.slug}`,
    mode: input.mode ?? "runway_3_reference_final_scene",
    imageEngine: input.imageEngine ?? "runway-image",
    finalImageEngine: input.finalImageEngine ?? "runway-gen4-image",
    videoEngine: input.videoEngine ?? "runway-gen-3",
    masterImagePrimaryEngine: input.masterImagePrimaryEngine ?? "runway-gen4-image",
    styleGuide: input.styleGuide ?? finalScene.style,
    negativePrompt:
      input.negativePrompt ??
      "metadata only: avoid text overlays, malformed anatomy, duplicated limbs, unstable scale, cropped bodies, subject merge",
    continuityRules: input.continuityRules ?? [
      "preserve subject identity from master references",
      "maintain role-aware left-right blocking unless the prompt explicitly changes it",
      "keep anatomy stable and grounded through all image and video outputs",
      "preserve environment lighting, ground texture, and open reaction lane"
    ],
    aspectRatio: finalScene.aspectRatio,
    predator: predatorWithLegacy,
    prey: preyWithLegacy,
    environment,
    finalScene,
    video,
    aiEnhancement: normalizeAiEnhancement(input.aiEnhancement),
    schemaSource: isObject(input.predator) && isObject(input.prey) && isObject(input.environment) ? "object" : "legacy"
  };
}

function buildMasterSubjects(storyboard) {
  return [
    {
      ...storyboard.prey,
      referenceRole: "prey/defender identity only",
      runwayTag: `@${storyboard.prey.slug}`
    },
    {
      ...storyboard.predator,
      referenceRole: "predator identity only",
      runwayTag: `@${storyboard.predator.slug}`
    }
  ];
}

function buildScenes(storyboard) {
  const { predator, prey, environment, finalScene, video } = storyboard;
  const shotCount = Number.isFinite(video.shotCount) && video.shotCount > 0 ? Math.floor(video.shotCount) : 5;
  const baseDuration = Math.max(1, Math.floor(video.duration / shotCount));
  const durations = Array.from({ length: shotCount }, (_, index) =>
    index === shotCount - 1 ? Math.max(1, video.duration - baseDuration * (shotCount - 1)) : baseDuration
  );
  const shotTemplates = [
    {
      name: "establishing_tension",
      description: "establishing tension in the habitat before the pressure move",
      camera: finalScene.camera,
      motion: "slow controlled push-in",
      subject: `${prey.name} on the ${prey.side} and ${predator.name} on the ${predator.side} with a clear open reaction lane`,
      action: "both animals remain fully visible, separated, grounded, and alert"
    },
    {
      name: "defender_pressure_move",
      description: "prey or defender pressure move with readable body language",
      camera: "front full-body wildlife documentary framing",
      motion: "controlled lateral tracking move",
      subject: `${prey.name} holds the ${prey.side} side with dominant grounded posture`,
      action: `${prey.name} advances or braces with role-appropriate defensive pressure while keeping clean readable spacing`
    },
    {
      name: "predator_reaction",
      description: "predator reaction beat under pressure",
      camera: "medium-long telephoto reaction framing",
      motion: "subtle handheld tension hold",
      subject: `${predator.name} on the ${predator.side} in full-body readable profile`,
      action: `${predator.name} reacts defensively with grounded motion, stable anatomy, and clear survival tension`
    },
    {
      name: "wide_reaction_lane",
      description: "wide separation beat showing the open reaction lane",
      camera: "locked wide documentary shot",
      motion: "slow pull-back",
      subject: `${prey.name} and ${predator.name} remain separated in ${environment.name}`,
      action: "the open central reaction lane stays visible while both animals remain fully readable"
    },
    {
      name: "final_dramatic_hold",
      description: "final dramatic hold after the pressure peaks",
      camera: "long-lens final hold",
      motion: "slow cinematic settle",
      subject: `${prey.name} on the ${prey.side}, ${predator.name} on the ${predator.side}, environment continuity intact`,
      action: finalScene.action
    }
  ];

  return Array.from({ length: shotCount }, (_, index) => {
    const template = shotTemplates[index] ?? shotTemplates[shotTemplates.length - 1];
    return {
      id: index + 1,
      ...template,
      lighting: environment.lighting,
      style: finalScene.style,
      environment: environment.description,
      duration: durations[index] || baseDuration,
      generateVideo: true,
      videoEngine: video.videoEngines[index] ?? (index % 2 === 0 ? "runway-gen-3" : "kling"),
      finalShotReference: `master_images/final_scene_master/${storyboard.project}.final.png`
    };
  });
}

function buildStoryboard(input) {
  const storyboard = normalizeInput(input);
  const scenes = buildScenes(storyboard);

  return {
    ...storyboard,
    duration: storyboard.video.duration,
    masterSubjects: buildMasterSubjects(storyboard),
    scenes,
    runwayReferences: {
      maxActiveReferences: 3,
      prey: `@${storyboard.prey.slug}`,
      predator: `@${storyboard.predator.slug}`,
      environment: `@${storyboard.environment.slug}`
    }
  };
}

async function main() {
  const input = JSON.parse(await readFile(INPUT_FILE, "utf8"));
  const storyboard = await enhanceInputWithGemini(buildStoryboard(input));

  await writeFile(STORYBOARD_FILE, `${JSON.stringify(storyboard, null, 2)}\n`);
  process.stdout.write(
    `${JSON.stringify(
      {
        project: storyboard.project,
        mode: storyboard.mode,
        aiEnhancement: storyboard.aiEnhancement?.used ? "gemini" : "local templates",
        references: storyboard.runwayReferences,
        scenes: storyboard.scenes.map((scene) => scene.name),
        output: "storyboard_system/storyboard.json"
      },
      null,
      2
    )}\n`
  );
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
