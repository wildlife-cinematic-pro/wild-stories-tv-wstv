import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

function normalizeAnimal(value, fallback) {
  return hasText(value) ? value.trim() : fallback;
}

function titleCase(value) {
  return String(value)
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getDurations(durationLane) {
  switch (durationLane) {
    case "medium":
      return [4, 5, 5, 6, 4];
    case "long":
      return [5, 5, 6, 7, 5];
    case "short":
    default:
      return [4, 5, 5, 5];
  }
}

function buildMasterSubjects(input) {
  const predator = normalizeAnimal(input.predator, "predator");
  const prey = normalizeAnimal(input.prey, "prey");
  const predatorSide = input.predatorSide ?? "right";
  const preySide = input.preySide ?? "left";

  return [
    {
      name: prey,
      slug: slugify(prey),
      role: "defender",
      side: preySide,
      description:
        input.preyDescription ??
        `${prey} with realistic wildlife anatomy, stable markings, natural body mass, and full body readable`,
      identityNotes:
        input.preyIdentityNotes ??
        `Keep the same ${prey} identity, body scale, markings, head shape, and grounded contact across all scenes.`,
      referenceImage: input.preyReferenceImage ?? null
    },
    {
      name: predator,
      slug: slugify(predator),
      role: "predator",
      side: predatorSide,
      description:
        input.predatorDescription ??
        `${predator} with realistic wildlife anatomy, stable markings, natural body mass, and full body readable`,
      identityNotes:
        input.predatorIdentityNotes ??
        `Keep the same ${predator} identity, body scale, markings, head shape, and grounded contact across all scenes.`,
      referenceImage: input.predatorReferenceImage ?? null
    }
  ];
}

function buildScenes(input) {
  const predator = normalizeAnimal(input.predator, "predator");
  const prey = normalizeAnimal(input.prey, "prey");
  const predatorSide = input.predatorSide ?? "right";
  const preySide = input.preySide ?? "left";
  const environment = input.environment ?? "natural wildlife habitat with clean readable spacing";
  const lighting = input.lighting ?? "natural wildlife documentary light";
  const sceneDescription = input.sceneDescription ?? `${prey} and ${predator} hold a high-tension wildlife beat with readable spacing.`;
  const durations = getDurations(input.durationLane);
  const videoEngines = Array.isArray(input.videoEngines) ? input.videoEngines : [];
  const leftAnimal = preySide === "left" ? prey : predator;
  const rightAnimal = predatorSide === "right" ? predator : prey;

  const baseScenes = [
    {
      name: "establishing",
      description: "wide habitat setup before the pressure breaks",
      camera: "wide cinematic documentary shot",
      motion: "slow push-in",
      subject: `the ${leftAnimal} on the left and the ${rightAnimal} on the right with one open reaction lane between them`,
      action: "both animals hold tense readable spacing without contact",
      duration: durations[0]
    },
    {
      name: "pressure_commit",
      description: sceneDescription,
      camera: "front full-body wildlife framing",
      motion: "controlled tracking move",
      subject: `the ${prey} holds the ${preySide} side while the ${predator} holds the ${predatorSide} reaction lane`,
      action: `${prey} makes one readable power move while ${predator} reacts under pressure without contact`,
      duration: durations[1]
    },
    {
      name: "reaction_hold",
      description: "the reaction beat stays clean with no subject overlap",
      camera: "locked wide reaction shot",
      motion: "subtle handheld tension hold",
      subject: `the ${prey} remains ${preySide} and the ${predator} remains ${predatorSide} with full bodies visible`,
      action: `${predator} shifts defensively while ${prey} keeps dominant grounded pressure`,
      duration: durations[2]
    },
    {
      name: "escape_pressure",
      description: "the tension peaks as the open lane decides the escape direction",
      camera: "long-lens wide documentary shot",
      motion: "slow pull-back",
      subject: `the ${prey} owns the ${preySide} side while the ${predator} moves toward the ${predatorSide}-side escape lane`,
      action: "both animals separate with high tension, no contact, full bodies visible",
      duration: durations[3]
    }
  ];

  if (input.durationLane === "medium" || input.durationLane === "long") {
    baseScenes.push({
      name: "final_hold",
      description: "the scene resolves into a clean aftermath hold",
      camera: "long-lens final hold",
      motion: "slow pull-back",
      subject: `the ${prey} and the ${predator} keep readable separation after the pressure breaks`,
      action: "motion settles while identity, anatomy, scale, and spacing remain stable",
      duration: durations[4] ?? 4
    });
  }

  return baseScenes.map((scene, index) => ({
    id: index + 1,
    ...scene,
    lighting,
    style: "photorealistic",
    environment,
    generateVideo: index === baseScenes.length - 1 && baseScenes.length > 4 ? false : true,
    videoEngine: videoEngines[index] ?? (index % 2 === 0 ? "runway-gen-2" : "kling"),
    finalShotReference: null
  }));
}

function buildStoryboard(input) {
  const project = input.project ?? `${slugify(input.prey ?? "prey")}_vs_${slugify(input.predator ?? "predator")}`;
  const scenes = buildScenes(input);
  const duration = scenes.reduce((total, scene) => total + scene.duration, 0);

  return {
    project,
    duration,
    imageEngine: input.imageEngine ?? "runway-image",
    finalImageEngine: input.finalImageEngine ?? "runway-image",
    videoEngine: input.videoEngine ?? "runway-gen-2",
    masterImagePrimaryEngine: input.masterImagePrimaryEngine ?? "nano-banana-2",
    masterImageBackupEngine: input.masterImageBackupEngine ?? "gpt-image-2",
    masterImageUseCase: input.masterImageUseCase ?? "wildlife documentary identity lock",
    backupImageUseCase: input.backupImageUseCase ?? "thumbnail, cover, alternate clean frame, strict layout backup",
    masterReferenceMode:
      input.masterReferenceMode ??
      "Create master animal images first, then use them as source references for final scene keyframes before image-to-video.",
    styleGuide: input.styleGuide ?? "photorealistic wildlife documentary",
    negativePrompt:
      input.negativePrompt ??
      "no final-shot rendering, no text overlays, no dust clouds, no debris spray, no unstable anatomy, no overlapping subjects, no contact unless explicitly requested",
    continuityRules: input.continuityRules ?? [
      "preserve subject identity from the master image",
      "maintain left-right blocking unless the scene explicitly changes it",
      "keep anatomy stable across scene transitions",
      "preserve grounded contact and environmental continuity",
      "keep coat, fur, antler, horn, and marking continuity stable"
    ],
    aspectRatio: input.aspectRatio ?? "9:16",
    masterSubjects: buildMasterSubjects(input),
    scenes
  };
}

async function main() {
  const input = JSON.parse(await readFile(INPUT_FILE, "utf8"));
  const storyboard = buildStoryboard(input);
  await writeFile(STORYBOARD_FILE, `${JSON.stringify(storyboard, null, 2)}\n`);
  process.stdout.write(
    `${JSON.stringify(
      {
        project: storyboard.project,
        duration: storyboard.duration,
        masterSubjects: storyboard.masterSubjects.map((subject) => subject.name),
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
