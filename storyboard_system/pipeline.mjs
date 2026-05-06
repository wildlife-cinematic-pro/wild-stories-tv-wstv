import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { enhancePromptWithGemini } from "./ai_enhance.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = __dirname;
const SCENES_DIR = path.join(ROOT, "scenes");
const PROMPTS_DIR = path.join(ROOT, "prompts");
const MASTER_IMAGES_DIR = path.join(ROOT, "master_images");
const REFERENCES_DIR = path.join(ROOT, "references");
const IMAGES_DIR = path.join(ROOT, "images");
const VIDEOS_DIR = path.join(ROOT, "videos");
const EXPORTS_DIR = path.join(ROOT, "exports");
const STORYBOARD_FILE = path.join(ROOT, "storyboard.json");

const ORDERED_DIRS = [
  SCENES_DIR,
  PROMPTS_DIR,
  MASTER_IMAGES_DIR,
  REFERENCES_DIR,
  IMAGES_DIR,
  VIDEOS_DIR,
  EXPORTS_DIR
];

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function scenePrefix(sceneId) {
  return String(sceneId).padStart(2, "0");
}

function sceneBaseName(scene) {
  return `${scenePrefix(scene.id)}_${slugify(scene.name)}`;
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function tagFor(entity) {
  return `@${entity.slug}`;
}

function getPredator(storyboard) {
  return storyboard.predator ?? storyboard.masterSubjects?.find((subject) => subject.role === "predator") ?? {
    name: "predator",
    slug: "predator",
    role: "predator",
    side: "right",
    description: "wildlife predator with full body readable",
    identityNotes: "Preserve predator identity and grounded contact."
  };
}

function getPrey(storyboard) {
  return storyboard.prey ?? storyboard.masterSubjects?.find((subject) => subject.role === "defender" || subject.role === "prey") ?? {
    name: "prey",
    slug: "prey",
    role: "defender",
    side: "left",
    description: "wildlife defender with full body readable",
    identityNotes: "Preserve defender identity and grounded contact."
  };
}

function getEnvironment(storyboard) {
  return storyboard.environment ?? {
    name: "natural wildlife environment",
    slug: "natural_wildlife_environment",
    description: "natural wildlife habitat with open central space",
    lighting: "natural wildlife documentary light",
    rules: "environment reference only, open central space for future wildlife subjects, no animals, no people, no buildings, no roads"
  };
}

function getFinalScene(storyboard) {
  return storyboard.finalScene ?? {
    composition: "prey/defender on the left, predator on the right, clear reaction lane between them",
    camera: "cinematic telephoto documentary framing",
    style: storyboard.styleGuide ?? "photorealistic wildlife documentary",
    aspectRatio: storyboard.aspectRatio ?? "9:16",
    tension: "high survival tension with clean readable spacing",
    action: "defender holds dominant pressure while predator reacts defensively"
  };
}

function getVideo(storyboard) {
  return storyboard.video ?? {
    duration: storyboard.duration ?? 15,
    platform: "kling",
    format: "multi-shot",
    shotCount: 5,
    musicMood: "tense cinematic wildlife action trailer music",
    regionTarget: "viral wildlife shorts audience"
  };
}

function buildPromptCore(scene, storyboard) {
  const style = scene.styleGuide ?? scene.style ?? storyboard.styleGuide;
  const continuity = (storyboard.continuityRules ?? []).join(", ");

  return [
    `${scene.camera}, ${scene.motion}.`,
    `${scene.description} in ${scene.environment}.`,
    `${scene.subject}, ${scene.action}.`,
    `${scene.lighting}, ${style}.`,
    `${storyboard.aspectRatio} vertical framing.`,
    continuity ? `Continuity rules: ${continuity}.` : null
  ]
    .filter(Boolean)
    .join(" ");
}

function formatImagePrompt(scene, storyboard) {
  return `${buildPromptCore(scene, storyboard)} Single storyboard frame, clean composition for edit planning, clear silhouette readability.`;
}

function formatFinalImagePrompt(scene, storyboard) {
  return `${buildPromptCore(scene, storyboard)} Scene keyframe uses the generated final scene master image as continuity source, with stable anatomy, clean readable spacing, grounded contact, and full-body subject readability.`;
}

function formatVideoPrompt(scene, storyboard) {
  return `${buildPromptCore(scene, storyboard)} Use the final scene master image as the source frame. Maintain separated subjects, an open reaction lane, grounded movement, realistic physics, and stable identity.`;
}

function formatRunwayPrompt(scene, storyboard) {
  return `${formatVideoPrompt(scene, storyboard)} Runway image-to-video motion: smooth documentary camera movement, controlled acceleration, readable subject silhouettes, strong foreground-background separation, and edit-friendly timing.`;
}

function formatKlingPrompt(scene, storyboard) {
  return `${formatVideoPrompt(scene, storyboard)} Kling motion: clear action timing, natural body mechanics, role-aware reaction, realistic ground contact, and stable source-image continuity.`;
}

function formatAnimalMasterPrompt(subject, storyboard, referenceRole) {
  return [
    `Photorealistic wildlife documentary reusable Runway reference image, ${storyboard.aspectRatio} vertical frame.`,
    `Single animal only: ${subject.name}.`,
    `${subject.description}.`,
    `Role for later reference: ${referenceRole}.`,
    `Full body readable, neutral or grounded natural stance, stable anatomy, clear identity markers, realistic body mass, grounded hoof/paw/foot contact, simple uncluttered background.`,
    subject.identityNotes ? `Identity preservation notes: ${subject.identityNotes}` : null,
    `Reusable master image for future final-scene composition.`
  ]
    .filter(Boolean)
    .join(" ");
}

function formatEnvironmentMasterPrompt(environment, storyboard) {
  return [
    `Photorealistic wildlife documentary environment-only reusable Runway reference image, ${storyboard.aspectRatio} vertical frame.`,
    `${environment.name}: ${environment.description}.`,
    `${environment.lighting}.`,
    `Clean open central space for future wildlife subjects, readable habitat texture, realistic depth, natural ground plane, atmosphere matched to the environment.`,
    `Reference role: environment/background/lighting/ground texture only.`,
    environment.rules
  ]
    .filter(Boolean)
    .join(" ");
}

function formatFinalSceneMasterPrompt(storyboard) {
  const predator = getPredator(storyboard);
  const prey = getPrey(storyboard);
  const environment = getEnvironment(storyboard);
  const finalScene = getFinalScene(storyboard);

  return [
    `Create one final scene master image using exactly these 3 active Runway references: ${tagFor(prey)}, ${tagFor(predator)}, ${tagFor(environment)}.`,
    `Use ${tagFor(prey)} only for ${prey.name} prey/defender identity: body scale, anatomy, markings, head shape, grounded contact, and identity continuity.`,
    `Use ${tagFor(predator)} only for ${predator.name} predator identity: body scale, anatomy, markings, head shape, grounded contact, and identity continuity.`,
    `Use ${tagFor(environment)} only for environment/background/lighting/ground texture: ${environment.description}.`,
    `${finalScene.style}, ${finalScene.camera}, ${finalScene.aspectRatio} vertical framing.`,
    `Composition: ${finalScene.composition}.`,
    `Action and tension: ${finalScene.action}. ${finalScene.tension}.`,
    `Animals remain separated, both animals fully visible, clear open reaction lane, clean readable spacing, stable anatomy, grounded hoof/paw/foot contact, realistic wildlife documentary body language.`,
    `Video-ready source frame for Runway and Kling.`
  ].join(" ");
}

function formatRunwayFinalVideoPrompt(storyboard) {
  const predator = getPredator(storyboard);
  const prey = getPrey(storyboard);
  const environment = getEnvironment(storyboard);
  const finalScene = getFinalScene(storyboard);
  const video = getVideo(storyboard);

  return [
    `Use master_images/final_scene_master/${storyboard.project}.final.png as the Runway image-to-video source frame.`,
    `${video.duration}-second ${finalScene.style} wildlife documentary motion in ${environment.name}.`,
    `${prey.name} remains on the ${prey.side} as the prey/defender, ${predator.name} remains on the ${predator.side} as the predator, with the clear open reaction lane preserved.`,
    `Motion: ${finalScene.action}. Stable anatomy, grounded movement, full-body readability, clean readable spacing, source-image identity continuity, realistic camera drift, cinematic tension rise.`
  ].join(" ");
}

function formatKlingFinalVideoPrompt(storyboard) {
  const predator = getPredator(storyboard);
  const prey = getPrey(storyboard);
  const environment = getEnvironment(storyboard);
  const finalScene = getFinalScene(storyboard);
  const video = getVideo(storyboard);
  const duration = Number(video.duration ?? 15);

  const shots = [
    `Shot 1 establishing tension: ${environment.name}, ${prey.name} on the ${prey.side}, ${predator.name} on the ${predator.side}, clear open reaction lane, slow push-in.`,
    `Shot 2 prey/defender pressure move: ${prey.name} uses role-appropriate grounded pressure, full body readable, stable contact with the terrain.`,
    `Shot 3 predator reaction: ${predator.name} reacts defensively with realistic weight shift, stable anatomy, and clean silhouette readability.`,
    `Shot 4 wide separation: both animals remain separated with the reaction lane visible, environment texture and lighting consistent.`,
    `Shot 5 final dramatic hold: ${finalScene.action}, final bass-hit visual hold, cinematic wildlife documentary tension.`
  ];

  return [
    `Kling image-to-video prompt using master_images/final_scene_master/${storyboard.project}.final.png as the source image.`,
    `${duration}-second ${video.format ?? "multi-shot"} sequence, ${video.shotCount ?? 5} shots, ${finalScene.style}, ${finalScene.camera}.`,
    shots.join(" "),
    `Maintain source-frame identity, separated animals, clear open reaction lane, grounded hoof/paw/foot contact, stable anatomy, realistic wildlife motion, and clean readable spacing.`
  ].join(" ");
}

function formatElevenLabsMusicPrompt(storyboard) {
  const environment = getEnvironment(storyboard);
  const video = getVideo(storyboard);

  return [
    `${video.duration}-second cinematic wildlife action trailer music for ${environment.name}.`,
    `Environment-matched ambience, low suspense drone, rising drums, restrained pulses, cinematic hits at shot cuts, no vocals, no narration, no spoken words.`,
    `Build tension across ${video.shotCount ?? 5} shots with a final bass hit and natural ambience tail.`
  ].join(" ");
}

function buildSceneRecord(scene, storyboard) {
  return {
    ...scene,
    fileBase: sceneBaseName(scene),
    storyboardImageFile: `${sceneBaseName(scene)}.storyboard.png`,
    finalImageFile: `${sceneBaseName(scene)}.final.png`,
    videoFile: `${sceneBaseName(scene)}.mp4`,
    storyboardProject: storyboard.project,
    negativePrompt: storyboard.negativePrompt ?? "",
    continuityRules: storyboard.continuityRules ?? []
  };
}

export async function generateStoryboardScenes(storyboard) {
  const sceneRecords = (storyboard.scenes ?? []).map((scene) => buildSceneRecord(scene, storyboard));
  await Promise.all(
    sceneRecords.map((scene) =>
      writeFile(path.join(SCENES_DIR, `${scene.fileBase}.scene.json`), `${JSON.stringify(scene, null, 2)}\n`)
    )
  );
  return sceneRecords;
}

export async function generateReferenceWorkflow(storyboard) {
  const predator = getPredator(storyboard);
  const prey = getPrey(storyboard);
  const environment = getEnvironment(storyboard);
  const finalOutput = `master_images/final_scene_master/${storyboard.project}.final.png`;
  const productionOrder = [
    "Generate prey-only master image",
    `Save/tag in Runway as ${tagFor(prey)}`,
    "Generate predator-only master image",
    `Save/tag in Runway as ${tagFor(predator)}`,
    "Generate environment-only master image",
    `Save/tag in Runway as ${tagFor(environment)}`,
    "Use all 3 references to generate final scene master image",
    "Use final scene master image as source for Runway/Kling video"
  ];

  const manifest = {
    project: storyboard.project,
    workflow: "generic_runway_3_reference_final_scene_master",
    maxActiveReferences: 3,
    predator: {
      tag: tagFor(predator),
      slug: predator.slug,
      name: predator.name,
      role: predator.role,
      referenceRole: "predator identity only",
      source: `master_images/predator_master/${storyboard.project}.${predator.slug}.png`
    },
    prey: {
      tag: tagFor(prey),
      slug: prey.slug,
      name: prey.name,
      role: prey.role,
      referenceRole: "prey/defender identity only",
      source: `master_images/prey_master/${storyboard.project}.${prey.slug}.png`
    },
    environment: {
      tag: tagFor(environment),
      slug: environment.slug,
      name: environment.name,
      referenceRole: "environment/background only",
      source: `master_images/environment_master/${storyboard.project}.${environment.slug}.png`
    },
    finalSceneMasterOutput: finalOutput,
    productionOrder
  };

  const animalIdentityManifest = {
    project: storyboard.project,
    purpose: "Animal identity lock for generic three-reference final scene workflow",
    subjects: [manifest.prey, manifest.predator],
    environment: manifest.environment,
    finalSceneMasterOutput: finalOutput,
    continuityRules: storyboard.continuityRules ?? []
  };

  await Promise.all([
    writeFile(path.join(REFERENCES_DIR, "runway_3_reference_manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`),
    writeFile(path.join(REFERENCES_DIR, "runway_reference_manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`),
    writeFile(path.join(REFERENCES_DIR, "animal_identity_manifest.json"), `${JSON.stringify(animalIdentityManifest, null, 2)}\n`)
  ]);

  return manifest;
}

export async function generateMasterImages(storyboard) {
  const predator = getPredator(storyboard);
  const prey = getPrey(storyboard);
  const environment = getEnvironment(storyboard);
  const aiContext = { enabled: storyboard.aiEnhancement?.enabled !== false, project: storyboard.project, mode: storyboard.mode };
  const preyPrompt = await enhancePromptWithGemini(formatAnimalMasterPrompt(prey, storyboard, "prey/defender identity only"), aiContext);
  const predatorPrompt = await enhancePromptWithGemini(formatAnimalMasterPrompt(predator, storyboard, "predator identity only"), aiContext);
  const environmentPrompt = await enhancePromptWithGemini(formatEnvironmentMasterPrompt(environment, storyboard), aiContext);

  const jobs = [
    {
      type: "prey-master-image",
      engine: storyboard.masterImagePrimaryEngine ?? "runway-gen4-image",
      promptPath: "prompts/prey_master.txt",
      output: `master_images/prey_master/${storyboard.project}.${prey.slug}.png`,
      runwayTag: tagFor(prey),
      referenceRole: "prey/defender identity only",
      subjectName: prey.name,
      subjectSlug: prey.slug,
      prompt: preyPrompt
    },
    {
      type: "predator-master-image",
      engine: storyboard.masterImagePrimaryEngine ?? "runway-gen4-image",
      promptPath: "prompts/predator_master.txt",
      output: `master_images/predator_master/${storyboard.project}.${predator.slug}.png`,
      runwayTag: tagFor(predator),
      referenceRole: "predator identity only",
      subjectName: predator.name,
      subjectSlug: predator.slug,
      prompt: predatorPrompt
    },
    {
      type: "environment-master-image",
      engine: storyboard.masterImagePrimaryEngine ?? "runway-gen4-image",
      promptPath: "prompts/environment_master.txt",
      output: `master_images/environment_master/${storyboard.project}.${environment.slug}.png`,
      runwayTag: tagFor(environment),
      referenceRole: "environment/background only",
      environmentName: environment.name,
      environmentSlug: environment.slug,
      prompt: environmentPrompt
    }
  ];

  await Promise.all([
    writeFile(path.join(PROMPTS_DIR, "prey_master.txt"), `${preyPrompt}\n`),
    writeFile(path.join(PROMPTS_DIR, "predator_master.txt"), `${predatorPrompt}\n`),
    writeFile(path.join(PROMPTS_DIR, "environment_master.txt"), `${environmentPrompt}\n`),
    writeFile(path.join(IMAGES_DIR, "prey.master-image-job.json"), `${JSON.stringify(jobs[0], null, 2)}\n`),
    writeFile(path.join(IMAGES_DIR, "predator.master-image-job.json"), `${JSON.stringify(jobs[1], null, 2)}\n`),
    writeFile(path.join(IMAGES_DIR, "environment.master-image-job.json"), `${JSON.stringify(jobs[2], null, 2)}\n`)
  ]);

  return jobs;
}

export async function generateFinalSceneMaster(storyboard) {
  const predator = getPredator(storyboard);
  const prey = getPrey(storyboard);
  const environment = getEnvironment(storyboard);
  const aiContext = { enabled: storyboard.aiEnhancement?.enabled !== false, project: storyboard.project, promptType: "final scene master" };
  const prompt = await enhancePromptWithGemini(formatFinalSceneMasterPrompt(storyboard), aiContext);
  const job = {
    type: "final-scene-master-image",
    engine: "runway-gen4-image",
    runwayTag: "@final_scene_master",
    referenceRole: "final composed scene and video source",
    subjectName: "final scene master",
    activeReferences: [tagFor(prey), tagFor(predator), tagFor(environment)],
    referenceRoles: {
      [tagFor(prey)]: "prey/defender identity only",
      [tagFor(predator)]: "predator identity only",
      [tagFor(environment)]: "environment/background only"
    },
    promptPath: "prompts/final_scene_master.txt",
    output: `master_images/final_scene_master/${storyboard.project}.final.png`,
    prompt
  };

  await Promise.all([
    writeFile(path.join(PROMPTS_DIR, "final_scene_master.txt"), `${prompt}\n`),
    writeFile(path.join(IMAGES_DIR, "final-scene.master-image-job.json"), `${JSON.stringify(job, null, 2)}\n`)
  ]);

  return job;
}

export async function generateFinalSceneVideoPrompts(storyboard) {
  const aiContext = { enabled: storyboard.aiEnhancement?.enabled !== false, project: storyboard.project, source: "final scene master" };
  const runwayPrompt = await enhancePromptWithGemini(formatRunwayFinalVideoPrompt(storyboard), { ...aiContext, promptType: "runway video" });
  const klingPrompt = await enhancePromptWithGemini(formatKlingFinalVideoPrompt(storyboard), { ...aiContext, promptType: "kling video" });
  const musicPrompt = await enhancePromptWithGemini(formatElevenLabsMusicPrompt(storyboard), { ...aiContext, promptType: "elevenlabs music" });

  await Promise.all([
    writeFile(path.join(PROMPTS_DIR, "final_scene_video_runway.txt"), `${runwayPrompt}\n`),
    writeFile(path.join(PROMPTS_DIR, "final_scene_video_kling.txt"), `${klingPrompt}\n`),
    writeFile(path.join(PROMPTS_DIR, "elevenlabs_action_music.txt"), `${musicPrompt}\n`)
  ]);

  return { runwayPrompt, klingPrompt, musicPrompt };
}

export async function generatePromptsFromScenes(storyboard, scenes) {
  const promptRecords = scenes.map((scene) => {
    const imagePrompt = formatImagePrompt(scene, storyboard);
    const finalImagePrompt = formatFinalImagePrompt(scene, storyboard);
    const videoPrompt = formatVideoPrompt(scene, storyboard);
    const runwayPrompt = formatRunwayPrompt(scene, storyboard);
    const klingPrompt = formatKlingPrompt(scene, storyboard);
    const negativePrompt = storyboard.negativePrompt ?? "";

    return {
      sceneId: scene.id,
      fileBase: scene.fileBase,
      imagePrompt,
      finalImagePrompt,
      videoPrompt,
      runwayPrompt,
      klingPrompt,
      negativePrompt,
      continuityRules: storyboard.continuityRules ?? []
    };
  });

  await Promise.all(
    promptRecords.flatMap((record) => [
      writeFile(path.join(PROMPTS_DIR, `${record.fileBase}.image.txt`), `${record.imagePrompt}\n`),
      writeFile(path.join(PROMPTS_DIR, `${record.fileBase}.final-image.txt`), `${record.finalImagePrompt}\n`),
      writeFile(path.join(PROMPTS_DIR, `${record.fileBase}.video.txt`), `${record.videoPrompt}\n`),
      writeFile(path.join(PROMPTS_DIR, `${record.fileBase}.runway.txt`), `${record.runwayPrompt}\n`),
      writeFile(path.join(PROMPTS_DIR, `${record.fileBase}.kling.txt`), `${record.klingPrompt}\n`),
      writeFile(path.join(PROMPTS_DIR, `${record.fileBase}.negative.txt`), `${record.negativePrompt}\n`),
      writeFile(path.join(PROMPTS_DIR, `${record.fileBase}.prompts.json`), `${JSON.stringify(record, null, 2)}\n`)
    ])
  );

  return promptRecords;
}

export async function generateImages(storyboard, scenes, prompts) {
  const storyboardJobs = scenes.map((scene) => {
    const prompt = prompts.find((entry) => entry.sceneId === scene.id);
    return {
      sceneId: scene.id,
      sceneName: scene.name,
      engine: storyboard.imageEngine ?? "runway-image",
      type: "storyboard-image",
      output: `images/${scene.storyboardImageFile}`,
      prompt: prompt?.imagePrompt ?? "",
      negativePrompt: prompt?.negativePrompt ?? "",
      negativePromptPath: `prompts/${scene.fileBase}.negative.txt`,
      continuityRules: prompt?.continuityRules ?? [],
      promptPath: `prompts/${scene.fileBase}.image.txt`,
      finalShotReference: scene.finalShotReference ?? null
    };
  });

  const finalImageJobs = scenes.map((scene) => {
    const prompt = prompts.find((entry) => entry.sceneId === scene.id);
    return {
      sceneId: scene.id,
      sceneName: scene.name,
      engine: storyboard.finalImageEngine ?? storyboard.imageEngine ?? "runway-gen4-image",
      type: "scene-final-image",
      inputReferences: ["references/runway_3_reference_manifest.json"],
      output: `images/${scene.finalImageFile}`,
      prompt: prompt?.finalImagePrompt ?? "",
      negativePrompt: prompt?.negativePrompt ?? "",
      negativePromptPath: `prompts/${scene.fileBase}.negative.txt`,
      continuityRules: prompt?.continuityRules ?? [],
      promptPath: `prompts/${scene.fileBase}.final-image.txt`,
      finalShotReference: scene.finalShotReference ?? null
    };
  });

  await Promise.all([
    ...storyboardJobs.map((job) =>
      writeFile(
        path.join(IMAGES_DIR, `${scenePrefix(job.sceneId)}_${slugify(job.sceneName)}.storyboard-image-job.json`),
        `${JSON.stringify(job, null, 2)}\n`
      )
    ),
    ...finalImageJobs.map((job) =>
      writeFile(
        path.join(IMAGES_DIR, `${scenePrefix(job.sceneId)}_${slugify(job.sceneName)}.final-image-job.json`),
        `${JSON.stringify(job, null, 2)}\n`
      )
    )
  ]);

  return { storyboardJobs, finalImageJobs, allImageJobs: [...storyboardJobs, ...finalImageJobs] };
}

export async function generateVideos(storyboard, scenes, prompts) {
  const jobs = scenes.filter((scene) => scene.generateVideo !== false).map((scene) => {
    const prompt = prompts.find((entry) => entry.sceneId === scene.id);
    const engine = scene.videoEngine ?? storyboard.videoEngine ?? "runway-gen-3";
    const isKling = engine.toLowerCase().includes("kling");

    return {
      sceneId: scene.id,
      sceneName: scene.name,
      engine,
      type: "storyboard-video",
      inputImage: `images/${scene.finalImageFile}`,
      sourceMasterImage: `master_images/final_scene_master/${storyboard.project}.final.png`,
      inputReferences: ["references/runway_3_reference_manifest.json"],
      output: `videos/${scene.videoFile}`,
      prompt: isKling ? prompt?.klingPrompt ?? "" : prompt?.runwayPrompt ?? prompt?.videoPrompt ?? "",
      promptPath: isKling ? `prompts/${scene.fileBase}.kling.txt` : `prompts/${scene.fileBase}.runway.txt`,
      negativePrompt: prompt?.negativePrompt ?? "",
      negativePromptPath: `prompts/${scene.fileBase}.negative.txt`,
      continuityRules: prompt?.continuityRules ?? [],
      duration: scene.duration,
      finalShotReference: scene.finalShotReference ?? null
    };
  });

  await Promise.all(
    jobs.map((job) =>
      writeFile(path.join(VIDEOS_DIR, `${scenePrefix(job.sceneId)}_${slugify(job.sceneName)}.video-job.json`), `${JSON.stringify(job, null, 2)}\n`)
    )
  );
  return jobs;
}

function buildCombinedStoryboardPreview(storyboard, scenes, prompts, masterImageJobs, finalSceneJob, finalVideoPrompts, referenceManifest) {
  const predator = getPredator(storyboard);
  const prey = getPrey(storyboard);
  const environment = getEnvironment(storyboard);

  return {
    project: storyboard.project,
    mode: storyboard.mode,
    duration: storyboard.duration,
    animalPair: { prey: prey.name, predator: predator.name },
    environment: environment.name,
    activeRunwayReferences: finalSceneJob.activeReferences,
    referenceRoles: finalSceneJob.referenceRoles,
    masterImages: masterImageJobs.map((job) => ({ type: job.type, runwayTag: job.runwayTag, promptPath: job.promptPath, output: job.output })),
    finalSceneMaster: { promptPath: finalSceneJob.promptPath, output: finalSceneJob.output },
    finalSceneVideoPrompts: {
      runway: "prompts/final_scene_video_runway.txt",
      kling: "prompts/final_scene_video_kling.txt",
      elevenLabsMusic: "prompts/elevenlabs_action_music.txt"
    },
    productionOrder: referenceManifest.productionOrder,
    sequence: scenes.map((scene) => {
      const prompt = prompts.find((entry) => entry.sceneId === scene.id);
      return {
        id: scene.id,
        name: scene.name,
        duration: scene.duration,
        promptReference: `prompts/${scene.fileBase}.prompts.json`,
        runwayPromptReference: `prompts/${scene.fileBase}.runway.txt`,
        klingPromptReference: `prompts/${scene.fileBase}.kling.txt`,
        imagePrompt: prompt?.imagePrompt ?? "",
        finalImagePrompt: prompt?.finalImagePrompt ?? "",
        videoPrompt: prompt?.videoPrompt ?? ""
      };
    }),
    finalVideoPrompts
  };
}

function buildEditingExport(storyboard, scenes, referenceManifest) {
  return {
    project: storyboard.project,
    delivery: {
      aspectRatio: storyboard.aspectRatio,
      duration: storyboard.duration,
      styleGuide: storyboard.styleGuide,
      workflowOrder: referenceManifest.productionOrder
    },
    references: {
      runway3ReferenceManifest: "references/runway_3_reference_manifest.json",
      animalIdentityManifest: "references/animal_identity_manifest.json"
    },
    finalSceneMaster: `master_images/final_scene_master/${storyboard.project}.final.png`,
    timeline: scenes.map((scene) => ({
      sceneId: scene.id,
      sceneName: scene.name,
      storyboardImageReference: `images/${scene.storyboardImageFile}`,
      finalImageReference: `images/${scene.finalImageFile}`,
      videoReference: scene.generateVideo === false ? null : `videos/${scene.videoFile}`,
      duration: scene.duration
    }))
  };
}

function fileCheck(name, generatedFiles) {
  return { name, valid: generatedFiles.has(name) };
}

function buildValidationReport(storyboard, prompts, masterImageJobs, finalSceneJob, referenceManifest, finalVideoPrompts, generatedFiles) {
  const predator = getPredator(storyboard);
  const prey = getPrey(storyboard);
  const environment = getEnvironment(storyboard);
  const finalScene = getFinalScene(storyboard);
  const tags = [tagFor(prey), tagFor(predator), tagFor(environment)];
  const requiredFiles = [
    "prompts/prey_master.txt",
    "prompts/predator_master.txt",
    "prompts/environment_master.txt",
    "prompts/final_scene_master.txt",
    "prompts/final_scene_video_runway.txt",
    "prompts/final_scene_video_kling.txt",
    "prompts/elevenlabs_action_music.txt",
    "images/prey.master-image-job.json",
    "images/predator.master-image-job.json",
    "images/environment.master-image-job.json",
    "images/final-scene.master-image-job.json",
    "references/runway_3_reference_manifest.json"
  ];
  const structuralChecks = [
    { name: "predator exists", valid: hasText(predator.name) && hasText(predator.slug) },
    { name: "prey exists", valid: hasText(prey.name) && hasText(prey.slug) },
    { name: "environment exists", valid: hasText(environment.name) && hasText(environment.slug) },
    { name: "finalScene exists", valid: hasText(finalScene.composition) && hasText(finalScene.action) },
    { name: "all three runway tags exist", valid: tags.every(hasText) },
    { name: "final scene prompt references all 3 tags", valid: tags.every((tag) => finalSceneJob.prompt.includes(tag)) },
    { name: "maxActiveReferences is 3", valid: referenceManifest.maxActiveReferences === 3 },
    { name: "video prompts exist", valid: hasText(finalVideoPrompts.runwayPrompt) && hasText(finalVideoPrompts.klingPrompt) },
    { name: "ElevenLabs music prompt exists", valid: hasText(finalVideoPrompts.musicPrompt) },
    { name: "legacy scene prompts exist", valid: prompts.every((prompt) => hasText(prompt.imagePrompt) && hasText(prompt.runwayPrompt) && hasText(prompt.klingPrompt)) },
    { name: "master image jobs exist", valid: masterImageJobs.length === 3 }
  ];
  const fileChecks = requiredFiles.map((name) => fileCheck(name, generatedFiles));
  const checks = [...structuralChecks, ...fileChecks];

  return {
    project: storyboard.project,
    valid: checks.every((entry) => entry.valid),
    summary: {
      requiredCheckCount: checks.length,
      validCheckCount: checks.filter((entry) => entry.valid).length,
      maxActiveReferences: referenceManifest.maxActiveReferences,
      activeReferences: finalSceneJob.activeReferences
    },
    checks
  };
}

function promptSection(title, value) {
  return `<section class="prompt-block"><h3>${escapeHtml(title)}</h3><pre>${escapeHtml(value)}</pre></section>`;
}

function buildStoryboardPreviewHtml(storyboard, masterImageJobs, finalSceneJob, finalVideoPrompts, referenceManifest) {
  const predator = getPredator(storyboard);
  const prey = getPrey(storyboard);
  const environment = getEnvironment(storyboard);
  const preyJob = masterImageJobs.find((job) => job.type === "prey-master-image");
  const predatorJob = masterImageJobs.find((job) => job.type === "predator-master-image");
  const environmentJob = masterImageJobs.find((job) => job.type === "environment-master-image");
  const orderItems = referenceManifest.productionOrder.map((item) => `<li>${escapeHtml(item)}</li>`).join("\n");
  const referenceRows = finalSceneJob.activeReferences
    .map((tag) => `<div><dt>${escapeHtml(tag)}</dt><dd>${escapeHtml(finalSceneJob.referenceRoles[tag])}</dd></div>`)
    .join("\n");

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${escapeHtml(storyboard.project)} Storyboard Preview</title><style>:root{color-scheme:dark;--bg:#09110f;--panel:#111a17;--panel-border:#2b3c35;--text:#f5fbf7;--muted:#a8bbb0;--accent:#8ee6b4}*{box-sizing:border-box}body{margin:0;font-family:Inter,Arial,sans-serif;background:#09110f;color:var(--text)}main{max-width:1180px;margin:0 auto;padding:32px 20px 60px}header{margin-bottom:24px}header h1{margin:0 0 8px;font-size:32px}header p{margin:0;color:var(--muted);line-height:1.6}.grid{display:grid;gap:18px}.section-label{margin:28px 0 12px;color:var(--accent);font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.panel{border:1px solid var(--panel-border);border-radius:8px;padding:18px;background:var(--panel)}.scene-meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:0 0 16px}.scene-meta div{border:1px solid var(--panel-border);border-radius:8px;padding:12px;background:rgba(255,255,255,.025)}dt{margin:0 0 6px;color:var(--muted);font-size:12px;text-transform:uppercase;font-weight:700}dd{margin:0;font-size:14px;line-height:1.5}.prompt-block{margin-top:14px}.prompt-block h3{margin:0 0 8px;font-size:15px}pre{margin:0;white-space:pre-wrap;word-break:break-word;border:1px solid var(--panel-border);border-radius:8px;padding:12px;background:rgba(255,255,255,.03);line-height:1.6;font-size:14px}ol{margin:0;padding-left:22px;line-height:1.8}</style></head><body><main><header><h1>${escapeHtml(storyboard.project)}</h1><p>Animal pair: ${escapeHtml(prey.name)} and ${escapeHtml(predator.name)}</p><p>Environment: ${escapeHtml(environment.name)}</p><p>Workflow: generic Runway 3-reference final scene master -> Runway/Kling video source</p></header><div class="section-label">Active Runway References</div><section class="panel"><dl class="scene-meta">${referenceRows}</dl></section><div class="section-label">Master Prompts</div><section class="panel">${promptSection("Prey master prompt", preyJob?.prompt ?? "")}${promptSection("Predator master prompt", predatorJob?.prompt ?? "")}${promptSection("Environment master prompt", environmentJob?.prompt ?? "")}</section><div class="section-label">Final Scene</div><section class="panel">${promptSection("Final scene master prompt", finalSceneJob.prompt)}${promptSection("Runway video prompt", finalVideoPrompts.runwayPrompt)}${promptSection("Kling video prompt", finalVideoPrompts.klingPrompt)}${promptSection("ElevenLabs music prompt", finalVideoPrompts.musicPrompt)}</section><div class="section-label">Production Order</div><section class="panel"><ol>${orderItems}</ol></section></main></body></html>\n`;
}

async function ensureFreshDirectories() {
  for (const directory of ORDERED_DIRS) {
    await rm(directory, { recursive: true, force: true });
    await mkdir(directory, { recursive: true });
  }
}

async function loadStoryboard() {
  const raw = await readFile(STORYBOARD_FILE, "utf8");
  return JSON.parse(raw);
}

export async function runStoryboardPipeline() {
  const storyboard = await loadStoryboard();
  await ensureFreshDirectories();

  const generatedFiles = new Set();
  const scenes = await generateStoryboardScenes(storyboard);
  const referenceManifest = await generateReferenceWorkflow(storyboard);
  generatedFiles.add("references/runway_3_reference_manifest.json");
  const masterImageJobs = await generateMasterImages(storyboard);
  generatedFiles.add("prompts/prey_master.txt");
  generatedFiles.add("prompts/predator_master.txt");
  generatedFiles.add("prompts/environment_master.txt");
  generatedFiles.add("images/prey.master-image-job.json");
  generatedFiles.add("images/predator.master-image-job.json");
  generatedFiles.add("images/environment.master-image-job.json");
  const finalSceneJob = await generateFinalSceneMaster(storyboard);
  generatedFiles.add("prompts/final_scene_master.txt");
  generatedFiles.add("images/final-scene.master-image-job.json");
  const finalVideoPrompts = await generateFinalSceneVideoPrompts(storyboard);
  generatedFiles.add("prompts/final_scene_video_runway.txt");
  generatedFiles.add("prompts/final_scene_video_kling.txt");
  generatedFiles.add("prompts/elevenlabs_action_music.txt");
  const prompts = await generatePromptsFromScenes(storyboard, scenes);
  const imageJobs = await generateImages(storyboard, scenes, prompts);
  const videoJobs = await generateVideos(storyboard, scenes, prompts);

  const preview = buildCombinedStoryboardPreview(storyboard, scenes, prompts, masterImageJobs, finalSceneJob, finalVideoPrompts, referenceManifest);
  const editingExport = buildEditingExport(storyboard, scenes, referenceManifest);
  const validationReport = buildValidationReport(storyboard, prompts, masterImageJobs, finalSceneJob, referenceManifest, finalVideoPrompts, generatedFiles);
  const storyboardPreviewHtml = buildStoryboardPreviewHtml(storyboard, masterImageJobs, finalSceneJob, finalVideoPrompts, referenceManifest);

  await Promise.all([
    writeFile(path.join(EXPORTS_DIR, "storyboard_sequence.json"), `${JSON.stringify(preview, null, 2)}\n`),
    writeFile(path.join(EXPORTS_DIR, "editing_manifest.json"), `${JSON.stringify(editingExport, null, 2)}\n`),
    writeFile(path.join(EXPORTS_DIR, "validation_report.json"), `${JSON.stringify(validationReport, null, 2)}\n`),
    writeFile(path.join(EXPORTS_DIR, "storyboard_preview.html"), storyboardPreviewHtml)
  ]);

  return {
    storyboard,
    scenes,
    prompts,
    masterImageJobs,
    finalSceneJob,
    referenceManifest,
    finalVideoPrompts,
    imageJobs,
    videoJobs,
    preview,
    editingExport,
    validationReport
  };
}

if (process.argv[1] === __filename) {
  runStoryboardPipeline()
    .then((result) => {
      const summary = {
        project: result.storyboard.project,
        mode: result.storyboard.mode,
        generatedMasterImageJobs: result.masterImageJobs.length,
        generatedFinalSceneMasterJob: result.finalSceneJob.output,
        generatedStoryboardImageJobs: result.imageJobs.storyboardJobs.length,
        generatedFinalImageJobs: result.imageJobs.finalImageJobs.length,
        generatedVideoJobs: result.videoJobs.length,
        validation: result.validationReport.valid,
        exports: [
          "references/runway_3_reference_manifest.json",
          "prompts/prey_master.txt",
          "prompts/predator_master.txt",
          "prompts/environment_master.txt",
          "prompts/final_scene_master.txt",
          "prompts/final_scene_video_runway.txt",
          "prompts/final_scene_video_kling.txt",
          "prompts/elevenlabs_action_music.txt",
          "exports/storyboard_preview.html"
        ]
      };
      process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    })
    .catch((error) => {
      process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
      process.exitCode = 1;
    });
}
