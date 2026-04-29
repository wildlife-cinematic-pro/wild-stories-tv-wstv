import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

function getMasterSubjects(storyboard) {
  if (Array.isArray(storyboard.masterSubjects) && storyboard.masterSubjects.length > 0) {
    return storyboard.masterSubjects.map((subject, index) => ({
      slug: slugify(subject.slug ?? subject.name ?? `subject_${index + 1}`),
      name: subject.name ?? `Subject ${index + 1}`,
      role: subject.role ?? "subject",
      side: subject.side ?? "unspecified",
      description: subject.description ?? subject.name ?? `Subject ${index + 1}`,
      identityNotes: subject.identityNotes ?? "",
      referenceImage: subject.referenceImage ?? null
    }));
  }

  return [
    {
      slug: "primary_subject",
      name: "primary wildlife subject",
      role: "primary",
      side: "left",
      description: "main animal identity extracted from storyboard scenes",
      identityNotes: "Fallback subject. Add explicit masterSubjects in storyboard.json for stronger identity lock.",
      referenceImage: null
    }
  ];
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
  return `${buildPromptCore(scene, storyboard)} Final scene keyframe generated after the master image identity lock. Use references/animal_identity_manifest.json and references/runway_reference_manifest.json. Preserve the same animal identity, coat markings, anatomy, scale, and left-right readability from the master images. Produce a video-ready source frame for image-to-video, not a rough storyboard.`;
}

function formatVideoPrompt(scene, storyboard) {
  return `${buildPromptCore(scene, storyboard)} Stable anatomy, continuity-safe blocking, no overlap between subjects, grounded contact preserved. Use the final scene image as the source frame.`;
}

function formatRunwayPrompt(scene, storyboard) {
  return `${buildPromptCore(scene, storyboard)} Prioritize camera movement readability, source-image continuity, strong foreground-background separation, edit-friendly composition, and image-to-video stability. Use master image references first, then the final scene keyframe as the Runway image-to-video source.`;
}

function formatKlingPrompt(scene, storyboard) {
  return `${buildPromptCore(scene, storyboard)} Prioritize motion clarity, readable left-right subject blocking, clean action timing, realistic physics, and stable contact with the ground. Use the final scene keyframe as source-image continuity.`;
}

function formatNanoBananaMasterPrompt(subject, storyboard) {
  const continuity = (storyboard.continuityRules ?? []).join(", ");
  return [
    `Photorealistic wildlife documentary master still, ${storyboard.aspectRatio} vertical.`,
    `${subject.name}, ${subject.description}.`,
    `Role: ${subject.role}. Preferred frame side: ${subject.side}.`,
    `${storyboard.styleGuide}. Clean readable full-body identity lock, stable anatomy, realistic fur/coat/marking detail, grounded contact, no crop, no text.`,
    subject.identityNotes ? `Identity notes: ${subject.identityNotes}.` : null,
    subject.referenceImage ? `Reference image metadata: ${subject.referenceImage}.` : null,
    continuity ? `Continuity rules: ${continuity}.` : null,
    `Negative prompt: ${storyboard.negativePrompt ?? ""}`
  ]
    .filter(Boolean)
    .join(" ");
}

function formatGptImageMasterPrompt(subject, storyboard) {
  const continuity = (storyboard.continuityRules ?? []).join(", ");
  return [
    `Clean wildlife cover-safe master image, ${storyboard.aspectRatio} vertical, strict composition backup.`,
    `${subject.name}, ${subject.description}.`,
    "Keep the subject fully visible, thumbnail-safe, anatomy-stable, with clean negative space and readable markings.",
    `Preferred frame side: ${subject.side}. ${storyboard.styleGuide}.`,
    continuity ? `Continuity rules: ${continuity}.` : null,
    `Negative prompt: ${storyboard.negativePrompt ?? ""}`
  ]
    .filter(Boolean)
    .join(" ");
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

function validateScene(scene, storyboard) {
  const requiredFields = [
    ["name", scene.name],
    ["description", scene.description],
    ["camera", scene.camera],
    ["motion", scene.motion],
    ["subject", scene.subject],
    ["action", scene.action],
    ["lighting", scene.lighting],
    ["style", scene.style ?? storyboard.styleGuide],
    ["environment", scene.environment]
  ];

  const errors = [];

  for (const [label, value] of requiredFields) {
    if (!hasText(value)) errors.push(`Missing ${label}`);
  }

  if (!hasText(storyboard.aspectRatio)) errors.push("Missing aspect ratio");
  if (!(typeof scene.duration === "number" && scene.duration > 0)) errors.push("Duration must be greater than 0");

  return { sceneId: scene.id, sceneName: scene.name, valid: errors.length === 0, errors };
}

function validatePrompt(scene, storyboard, prompt, label) {
  const checks = {
    cameraOrMovement: hasText(scene.camera) && hasText(scene.motion),
    sceneDescription: hasText(scene.description),
    subjectOrAction: hasText(scene.subject) && hasText(scene.action),
    lightingOrStyle: hasText(scene.lighting) && hasText(scene.style ?? storyboard.styleGuide),
    aspectRatio: hasText(storyboard.aspectRatio) && prompt.includes(storyboard.aspectRatio),
    duration: typeof scene.duration === "number" && scene.duration > 0,
    noEmptySceneFields: validateScene(scene, storyboard).errors.length === 0
  };

  const failedChecks = Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name);
  return { sceneId: scene.id, sceneName: scene.name, promptType: label, valid: failedChecks.length === 0, failedChecks };
}

export async function generateStoryboardScenes(storyboard) {
  const sceneRecords = storyboard.scenes.map((scene) => buildSceneRecord(scene, storyboard));
  await Promise.all(sceneRecords.map((scene) => writeFile(path.join(SCENES_DIR, `${scene.fileBase}.scene.json`), `${JSON.stringify(scene, null, 2)}\n`)));
  return sceneRecords;
}

export async function generateMasterImages(storyboard) {
  const subjects = getMasterSubjects(storyboard);
  const primaryEngine = storyboard.masterImagePrimaryEngine ?? "nano-banana-2";
  const backupEngine = storyboard.masterImageBackupEngine ?? "gpt-image-2";

  const jobs = subjects.flatMap((subject) => [
    {
      subjectSlug: subject.slug,
      subjectName: subject.name,
      role: subject.role,
      side: subject.side,
      engine: primaryEngine,
      type: "master-image",
      useCase: storyboard.masterImageUseCase ?? "wildlife documentary identity lock",
      output: `master_images/${subject.slug}.master.${primaryEngine}.png`,
      promptPath: `prompts/master_${subject.slug}.${primaryEngine}.txt`,
      prompt: formatNanoBananaMasterPrompt(subject, storyboard),
      negativePrompt: storyboard.negativePrompt ?? "",
      referenceImage: subject.referenceImage
    },
    {
      subjectSlug: subject.slug,
      subjectName: subject.name,
      role: subject.role,
      side: subject.side,
      engine: backupEngine,
      type: "master-image-backup",
      useCase: storyboard.backupImageUseCase ?? "thumbnail, cover, alternate clean frame, strict layout backup",
      output: `master_images/${subject.slug}.master.${backupEngine}.png`,
      promptPath: `prompts/master_${subject.slug}.${backupEngine}.txt`,
      prompt: formatGptImageMasterPrompt(subject, storyboard),
      negativePrompt: storyboard.negativePrompt ?? "",
      referenceImage: subject.referenceImage
    }
  ]);

  await Promise.all(jobs.flatMap((job) => [
    writeFile(path.join(ROOT, job.promptPath), `${job.prompt}\n`),
    writeFile(path.join(MASTER_IMAGES_DIR, `${job.subjectSlug}.${job.engine}.master-image-job.json`), `${JSON.stringify(job, null, 2)}\n`)
  ]));

  return jobs;
}

export async function generateReferenceManifests(storyboard, masterImageJobs) {
  const primaryJobs = masterImageJobs.filter((job) => job.type === "master-image");
  const backupJobs = masterImageJobs.filter((job) => job.type === "master-image-backup");

  const animalIdentityManifest = {
    project: storyboard.project,
    purpose: "Identity lock for storyboard-to-final-image-to-video workflow",
    masterReferenceMode: storyboard.masterReferenceMode ?? "Generate master images first, then use them as source references for scene final images.",
    subjects: primaryJobs.map((job) => ({
      slug: job.subjectSlug,
      name: job.subjectName,
      role: job.role,
      side: job.side,
      primaryEngine: job.engine,
      primaryOutput: job.output,
      backupOutput: backupJobs.find((backup) => backup.subjectSlug === job.subjectSlug)?.output ?? null,
      referenceImage: job.referenceImage
    })),
    continuityRules: storyboard.continuityRules ?? [],
    negativePrompt: storyboard.negativePrompt ?? ""
  };

  const runwayReferenceManifest = {
    project: storyboard.project,
    engineTarget: storyboard.videoEngine ?? "runway-gen-2",
    workflowOrder: [
      "Create storyboard images for layout planning",
      "Create master images for animal identity lock",
      "Create final scene keyframes using master image references",
      "Use final scene keyframes as image-to-video sources"
    ],
    references: primaryJobs.map((job) => ({ tag: job.subjectSlug, name: job.subjectName, source: job.output, use: "subject identity reference" })),
    instructions: [
      "Do not treat storyboard images as final identity sources.",
      "Use master images to preserve animal identity, markings, scale, and anatomy.",
      "Use final scene images as Runway image-to-video source frames."
    ]
  };

  await Promise.all([
    writeFile(path.join(REFERENCES_DIR, "animal_identity_manifest.json"), `${JSON.stringify(animalIdentityManifest, null, 2)}\n`),
    writeFile(path.join(REFERENCES_DIR, "runway_reference_manifest.json"), `${JSON.stringify(runwayReferenceManifest, null, 2)}\n`)
  ]);

  return { animalIdentityManifest, runwayReferenceManifest };
}

export async function generatePromptsFromScenes(storyboard, scenes) {
  const promptRecords = scenes.map((scene) => {
    const imagePrompt = formatImagePrompt(scene, storyboard);
    const finalImagePrompt = formatFinalImagePrompt(scene, storyboard);
    const videoPrompt = formatVideoPrompt(scene, storyboard);
    const runwayPrompt = formatRunwayPrompt(scene, storyboard);
    const klingPrompt = formatKlingPrompt(scene, storyboard);
    const negativePrompt = storyboard.negativePrompt ?? "";

    return { sceneId: scene.id, fileBase: scene.fileBase, imagePrompt, finalImagePrompt, videoPrompt, runwayPrompt, klingPrompt, negativePrompt, continuityRules: storyboard.continuityRules ?? [] };
  });

  await Promise.all(promptRecords.flatMap((record) => [
    writeFile(path.join(PROMPTS_DIR, `${record.fileBase}.image.txt`), `${record.imagePrompt}\n`),
    writeFile(path.join(PROMPTS_DIR, `${record.fileBase}.final-image.txt`), `${record.finalImagePrompt}\n`),
    writeFile(path.join(PROMPTS_DIR, `${record.fileBase}.video.txt`), `${record.videoPrompt}\n`),
    writeFile(path.join(PROMPTS_DIR, `${record.fileBase}.runway.txt`), `${record.runwayPrompt}\n`),
    writeFile(path.join(PROMPTS_DIR, `${record.fileBase}.kling.txt`), `${record.klingPrompt}\n`),
    writeFile(path.join(PROMPTS_DIR, `${record.fileBase}.negative.txt`), `${record.negativePrompt}\n`),
    writeFile(path.join(PROMPTS_DIR, `${record.fileBase}.prompts.json`), `${JSON.stringify(record, null, 2)}\n`)
  ]));

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
      engine: storyboard.finalImageEngine ?? storyboard.imageEngine ?? "runway-image",
      type: "scene-final-image",
      inputReferences: ["references/animal_identity_manifest.json", "references/runway_reference_manifest.json"],
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
    ...storyboardJobs.map((job) => writeFile(path.join(IMAGES_DIR, `${scenePrefix(job.sceneId)}_${slugify(job.sceneName)}.storyboard-image-job.json`), `${JSON.stringify(job, null, 2)}\n`)),
    ...finalImageJobs.map((job) => writeFile(path.join(IMAGES_DIR, `${scenePrefix(job.sceneId)}_${slugify(job.sceneName)}.final-image-job.json`), `${JSON.stringify(job, null, 2)}\n`))
  ]);

  return { storyboardJobs, finalImageJobs, allImageJobs: [...storyboardJobs, ...finalImageJobs] };
}

export async function generateVideos(storyboard, scenes, prompts) {
  const jobs = scenes.filter((scene) => scene.generateVideo !== false).map((scene) => {
    const prompt = prompts.find((entry) => entry.sceneId === scene.id);
    const engine = scene.videoEngine ?? storyboard.videoEngine ?? "runway-gen-2";
    const isKling = engine.toLowerCase().includes("kling");

    return {
      sceneId: scene.id,
      sceneName: scene.name,
      engine,
      type: "storyboard-video",
      inputImage: `images/${scene.finalImageFile}`,
      inputReferences: ["references/animal_identity_manifest.json", "references/runway_reference_manifest.json"],
      output: `videos/${scene.videoFile}`,
      prompt: isKling ? (prompt?.klingPrompt ?? "") : (prompt?.runwayPrompt ?? prompt?.videoPrompt ?? ""),
      promptPath: isKling ? `prompts/${scene.fileBase}.kling.txt` : `prompts/${scene.fileBase}.runway.txt`,
      negativePrompt: prompt?.negativePrompt ?? "",
      negativePromptPath: `prompts/${scene.fileBase}.negative.txt`,
      continuityRules: prompt?.continuityRules ?? [],
      duration: scene.duration,
      finalShotReference: scene.finalShotReference ?? null
    };
  });

  await Promise.all(jobs.map((job) => writeFile(path.join(VIDEOS_DIR, `${scenePrefix(job.sceneId)}_${slugify(job.sceneName)}.video-job.json`), `${JSON.stringify(job, null, 2)}\n`)));
  return jobs;
}

function buildCombinedStoryboardPreview(storyboard, scenes, prompts, masterImageJobs) {
  return {
    project: storyboard.project,
    duration: storyboard.duration,
    sceneCount: scenes.length,
    masterImageStrategy: {
      primaryEngine: storyboard.masterImagePrimaryEngine ?? "nano-banana-2",
      backupEngine: storyboard.masterImageBackupEngine ?? "gpt-image-2",
      masterImageUseCase: storyboard.masterImageUseCase ?? "wildlife documentary identity lock",
      backupImageUseCase: storyboard.backupImageUseCase ?? "thumbnail, cover, alternate clean frame"
    },
    masterImages: masterImageJobs.map((job) => ({ subjectSlug: job.subjectSlug, subjectName: job.subjectName, engine: job.engine, type: job.type, promptPath: job.promptPath, output: job.output })),
    referenceManifests: { animalIdentity: "references/animal_identity_manifest.json", runwayReferences: "references/runway_reference_manifest.json" },
    sequence: scenes.map((scene) => {
      const prompt = prompts.find((entry) => entry.sceneId === scene.id);
      return {
        id: scene.id,
        name: scene.name,
        startTime: scenes.filter((candidate) => candidate.id < scene.id).reduce((total, candidate) => total + candidate.duration, 0),
        duration: scene.duration,
        camera: scene.camera,
        motion: scene.motion,
        finalShotReference: scene.finalShotReference ?? null,
        storyboardImage: `images/${scene.storyboardImageFile}`,
        finalImage: `images/${scene.finalImageFile}`,
        previewVideo: scene.generateVideo === false ? null : `videos/${scene.videoFile}`,
        promptReference: `prompts/${scene.fileBase}.prompts.json`,
        runwayPromptReference: `prompts/${scene.fileBase}.runway.txt`,
        klingPromptReference: `prompts/${scene.fileBase}.kling.txt`,
        imagePrompt: prompt?.imagePrompt ?? "",
        finalImagePrompt: prompt?.finalImagePrompt ?? "",
        videoPrompt: prompt?.videoPrompt ?? "",
        runwayPrompt: prompt?.runwayPrompt ?? "",
        klingPrompt: prompt?.klingPrompt ?? ""
      };
    })
  };
}

function buildEditingExport(storyboard, scenes) {
  return {
    project: storyboard.project,
    delivery: {
      aspectRatio: storyboard.aspectRatio,
      duration: storyboard.duration,
      styleGuide: storyboard.styleGuide,
      negativePrompt: storyboard.negativePrompt ?? "",
      continuityRules: storyboard.continuityRules ?? [],
      workflowOrder: ["storyboard-image", "master-image", "scene-final-image", "image-to-video"]
    },
    references: { animalIdentityManifest: "references/animal_identity_manifest.json", runwayReferenceManifest: "references/runway_reference_manifest.json" },
    timeline: scenes.map((scene) => ({
      sceneId: scene.id,
      sceneName: scene.name,
      storyboardImageReference: `images/${scene.storyboardImageFile}`,
      finalImageReference: `images/${scene.finalImageFile}`,
      videoReference: scene.generateVideo === false ? null : `videos/${scene.videoFile}`,
      editableReference: scene.finalShotReference ?? null,
      duration: scene.duration
    }))
  };
}

function buildValidationReport(storyboard, scenes, prompts, masterImageJobs) {
  const sceneChecks = scenes.map((scene) => validateScene(scene, storyboard));
  const promptChecks = prompts.flatMap((prompt) => {
    const scene = scenes.find((entry) => entry.id === prompt.sceneId);
    if (!scene) return [];
    return [
      validatePrompt(scene, storyboard, prompt.imagePrompt, "storyboard-image"),
      validatePrompt(scene, storyboard, prompt.finalImagePrompt, "scene-final-image"),
      validatePrompt(scene, storyboard, prompt.videoPrompt, "video"),
      validatePrompt(scene, storyboard, prompt.runwayPrompt, "runway"),
      validatePrompt(scene, storyboard, prompt.klingPrompt, "kling")
    ];
  });
  const masterImageChecks = masterImageJobs.map((job) => ({
    subject: job.subjectName,
    engine: job.engine,
    valid: hasText(job.subjectName) && hasText(job.prompt) && hasText(job.engine) && hasText(job.output),
    failedChecks: [
      hasText(job.subjectName) ? null : "subjectName",
      hasText(job.prompt) ? null : "prompt",
      hasText(job.engine) ? null : "engine",
      hasText(job.output) ? null : "output"
    ].filter(Boolean)
  }));

  return {
    project: storyboard.project,
    valid: sceneChecks.every((entry) => entry.valid) && promptChecks.every((entry) => entry.valid) && masterImageChecks.every((entry) => entry.valid),
    summary: {
      sceneCount: scenes.length,
      promptCount: promptChecks.length,
      masterImageJobCount: masterImageJobs.length,
      validScenes: sceneChecks.filter((entry) => entry.valid).length,
      validPrompts: promptChecks.filter((entry) => entry.valid).length,
      validMasterImageJobs: masterImageChecks.filter((entry) => entry.valid).length
    },
    sceneChecks,
    promptChecks,
    masterImageChecks
  };
}

function buildStoryboardPreviewHtml(storyboard, scenes, prompts, imageJobs, videoJobs, masterImageJobs) {
  const masterCards = masterImageJobs.map((job) => `
        <article class="scene-card master-card">
          <div class="scene-head"><span class="scene-id">${escapeHtml(job.engine)}</span><h2>${escapeHtml(job.subjectName)}</h2><span class="duration">${escapeHtml(job.type)}</span></div>
          <dl class="scene-meta">
            <div><dt>Output</dt><dd>${escapeHtml(job.output)}</dd></div>
            <div><dt>Prompt path</dt><dd>${escapeHtml(job.promptPath)}</dd></div>
            <div><dt>Use case</dt><dd>${escapeHtml(job.useCase)}</dd></div>
            <div><dt>Side</dt><dd>${escapeHtml(job.side)}</dd></div>
          </dl>
          <div class="prompt-block"><h3>Master image prompt</h3><pre>${escapeHtml(job.prompt)}</pre></div>
        </article>`).join("\n");

  const cards = scenes.map((scene) => {
    const prompt = prompts.find((entry) => entry.sceneId === scene.id);
    const storyboardJob = imageJobs.storyboardJobs.find((entry) => entry.sceneId === scene.id);
    const finalImageJob = imageJobs.finalImageJobs.find((entry) => entry.sceneId === scene.id);
    const videoJob = videoJobs.find((entry) => entry.sceneId === scene.id);

    return `
        <article class="scene-card">
          <div class="scene-head"><span class="scene-id">Scene ${escapeHtml(scenePrefix(scene.id))}</span><h2>${escapeHtml(scene.name)}</h2><span class="duration">${escapeHtml(String(scene.duration))}s</span></div>
          <dl class="scene-meta">
            <div><dt>Camera</dt><dd>${escapeHtml(scene.camera)}</dd></div>
            <div><dt>Motion</dt><dd>${escapeHtml(scene.motion)}</dd></div>
            <div><dt>Storyboard image manifest</dt><dd>${escapeHtml(storyboardJob ? `images/${scenePrefix(scene.id)}_${slugify(scene.name)}.storyboard-image-job.json` : "Pending")}</dd></div>
            <div><dt>Final image manifest</dt><dd>${escapeHtml(finalImageJob ? `images/${scenePrefix(scene.id)}_${slugify(scene.name)}.final-image-job.json` : "Pending")}</dd></div>
            <div><dt>Video manifest</dt><dd>${escapeHtml(videoJob ? `videos/${scenePrefix(scene.id)}_${slugify(scene.name)}.video-job.json` : "Disabled")}</dd></div>
            <div><dt>Final shot reference</dt><dd>${escapeHtml(scene.finalShotReference ?? "None")}</dd></div>
          </dl>
          <div class="prompt-block"><h3>Storyboard image prompt</h3><pre>${escapeHtml(prompt?.imagePrompt ?? "")}</pre></div>
          <div class="prompt-block"><h3>Final scene image prompt</h3><pre>${escapeHtml(prompt?.finalImagePrompt ?? "")}</pre></div>
          <div class="prompt-block"><h3>Video prompt</h3><pre>${escapeHtml(prompt?.videoPrompt ?? "")}</pre></div>
        </article>`;
  }).join("\n");

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${escapeHtml(storyboard.project)} Storyboard Preview</title><style>:root{color-scheme:dark;--bg:#081018;--panel:#101b25;--panel-border:#233445;--text:#eff6ff;--muted:#9eb0c3;--accent:#67e8f9}*{box-sizing:border-box}body{margin:0;font-family:Inter,Arial,sans-serif;background:linear-gradient(180deg,#081018 0%,#0d1720 100%);color:var(--text)}main{max-width:1180px;margin:0 auto;padding:32px 20px 60px}header{margin-bottom:24px}header h1{margin:0 0 8px;font-size:32px}header p{margin:0;color:var(--muted)}.grid{display:grid;gap:18px}.section-label{margin:28px 0 12px;color:var(--accent);font-size:13px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.scene-card{border:1px solid var(--panel-border);border-radius:8px;padding:18px;background:var(--panel)}.master-card{border-color:rgba(103,232,249,.45)}.scene-head{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;margin-bottom:14px}.scene-head h2{margin:0;font-size:22px;text-transform:capitalize}.scene-id,.duration{font-size:12px;color:var(--accent);font-weight:700;letter-spacing:.04em;text-transform:uppercase}.scene-meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:0 0 16px}.scene-meta div{border:1px solid var(--panel-border);border-radius:8px;padding:12px;background:rgba(255,255,255,.02)}dt{margin:0 0 6px;color:var(--muted);font-size:12px;text-transform:uppercase;font-weight:700}dd{margin:0;font-size:14px;line-height:1.5}.prompt-block{margin-top:14px}.prompt-block h3{margin:0 0 8px;font-size:15px}pre{margin:0;white-space:pre-wrap;word-break:break-word;border:1px solid var(--panel-border);border-radius:8px;padding:12px;background:rgba(255,255,255,.03);line-height:1.6;font-size:14px}</style></head><body><main><header><h1>${escapeHtml(storyboard.project)}</h1><p>Total duration: ${escapeHtml(String(storyboard.duration))} seconds</p><p>Workflow: storyboard image → master image → final scene image → image-to-video</p></header><div class="section-label">Master images</div><section class="grid">${masterCards}</section><div class="section-label">Scene sequence</div><section class="grid">${cards}</section></main></body></html>\n`;
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

  const scenes = await generateStoryboardScenes(storyboard);
  const masterImageJobs = await generateMasterImages(storyboard);
  const referenceManifests = await generateReferenceManifests(storyboard, masterImageJobs);
  const prompts = await generatePromptsFromScenes(storyboard, scenes);
  const imageJobs = await generateImages(storyboard, scenes, prompts);
  const videoJobs = await generateVideos(storyboard, scenes, prompts);

  const preview = buildCombinedStoryboardPreview(storyboard, scenes, prompts, masterImageJobs);
  const editingExport = buildEditingExport(storyboard, scenes);
  const validationReport = buildValidationReport(storyboard, scenes, prompts, masterImageJobs);
  const storyboardPreviewHtml = buildStoryboardPreviewHtml(storyboard, scenes, prompts, imageJobs, videoJobs, masterImageJobs);

  await writeFile(path.join(EXPORTS_DIR, "storyboard_sequence.json"), `${JSON.stringify(preview, null, 2)}\n`);
  await writeFile(path.join(EXPORTS_DIR, "editing_manifest.json"), `${JSON.stringify(editingExport, null, 2)}\n`);
  await writeFile(path.join(EXPORTS_DIR, "validation_report.json"), `${JSON.stringify(validationReport, null, 2)}\n`);
  await writeFile(path.join(EXPORTS_DIR, "storyboard_preview.html"), storyboardPreviewHtml);

  return { storyboard, scenes, prompts, masterImageJobs, referenceManifests, imageJobs, videoJobs, preview, editingExport, validationReport };
}

if (process.argv[1] === __filename) {
  runStoryboardPipeline()
    .then((result) => {
      const summary = {
        project: result.storyboard.project,
        sceneCount: result.scenes.length,
        generatedMasterImageJobs: result.masterImageJobs.length,
        generatedStoryboardImageJobs: result.imageJobs.storyboardJobs.length,
        generatedFinalImageJobs: result.imageJobs.finalImageJobs.length,
        generatedVideoJobs: result.videoJobs.length,
        exports: [
          "references/animal_identity_manifest.json",
          "references/runway_reference_manifest.json",
          "exports/storyboard_sequence.json",
          "exports/editing_manifest.json",
          "exports/validation_report.json",
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
