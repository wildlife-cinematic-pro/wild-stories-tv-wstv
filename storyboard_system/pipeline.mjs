import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = __dirname;
const SCENES_DIR = path.join(ROOT, "scenes");
const PROMPTS_DIR = path.join(ROOT, "prompts");
const IMAGES_DIR = path.join(ROOT, "images");
const VIDEOS_DIR = path.join(ROOT, "videos");
const EXPORTS_DIR = path.join(ROOT, "exports");
const STORYBOARD_FILE = path.join(ROOT, "storyboard.json");

const ORDERED_DIRS = [SCENES_DIR, PROMPTS_DIR, IMAGES_DIR, VIDEOS_DIR, EXPORTS_DIR];

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

function formatVideoPrompt(scene, storyboard) {
  return `${buildPromptCore(scene, storyboard)} Stable anatomy, continuity-safe blocking, no overlap between subjects, grounded contact preserved.`;
}

function formatRunwayPrompt(scene, storyboard) {
  return `${buildPromptCore(scene, storyboard)} Prioritize camera movement readability, source-image continuity, strong foreground-background separation, edit-friendly composition, and image-to-video stability.`;
}

function formatKlingPrompt(scene, storyboard) {
  return `${buildPromptCore(scene, storyboard)} Prioritize motion clarity, readable left-right subject blocking, clean action timing, realistic physics, and stable contact with the ground.`;
}

function buildSceneRecord(scene, storyboard) {
  return {
    ...scene,
    fileBase: sceneBaseName(scene),
    imageFile: `${sceneBaseName(scene)}.png`,
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
    if (!hasText(value)) {
      errors.push(`Missing ${label}`);
    }
  }

  if (!hasText(storyboard.aspectRatio)) {
    errors.push("Missing aspect ratio");
  }

  if (!(typeof scene.duration === "number" && scene.duration > 0)) {
    errors.push("Duration must be greater than 0");
  }

  return {
    sceneId: scene.id,
    sceneName: scene.name,
    valid: errors.length === 0,
    errors
  };
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

  const failedChecks = Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  return {
    sceneId: scene.id,
    sceneName: scene.name,
    promptType: label,
    valid: failedChecks.length === 0,
    failedChecks
  };
}

export async function generateStoryboardScenes(storyboard) {
  const sceneRecords = storyboard.scenes.map((scene) => buildSceneRecord(scene, storyboard));

  await Promise.all(
    sceneRecords.map(async (scene) => {
      const sceneFile = path.join(SCENES_DIR, `${scene.fileBase}.scene.json`);
      await writeFile(sceneFile, `${JSON.stringify(scene, null, 2)}\n`);
    })
  );

  return sceneRecords;
}

export async function generatePromptsFromScenes(storyboard, scenes) {
  const promptRecords = scenes.map((scene) => {
    const imagePrompt = formatImagePrompt(scene, storyboard);
    const videoPrompt = formatVideoPrompt(scene, storyboard);
    const runwayPrompt = formatRunwayPrompt(scene, storyboard);
    const klingPrompt = formatKlingPrompt(scene, storyboard);
    const negativePrompt = storyboard.negativePrompt ?? "";

    return {
      sceneId: scene.id,
      fileBase: scene.fileBase,
      imagePrompt,
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
      writeFile(path.join(PROMPTS_DIR, `${record.fileBase}.video.txt`), `${record.videoPrompt}\n`),
      writeFile(path.join(PROMPTS_DIR, `${record.fileBase}.runway.txt`), `${record.runwayPrompt}\n`),
      writeFile(path.join(PROMPTS_DIR, `${record.fileBase}.kling.txt`), `${record.klingPrompt}\n`),
      writeFile(path.join(PROMPTS_DIR, `${record.fileBase}.negative.txt`), `${record.negativePrompt}\n`),
      writeFile(
        path.join(PROMPTS_DIR, `${record.fileBase}.prompts.json`),
        `${JSON.stringify(record, null, 2)}\n`
      )
    ])
  );

  return promptRecords;
}

export async function generateImages(storyboard, scenes, prompts) {
  const jobs = scenes.map((scene) => {
    const prompt = prompts.find((entry) => entry.sceneId === scene.id);

    return {
      sceneId: scene.id,
      sceneName: scene.name,
      engine: storyboard.imageEngine ?? "runway-image",
      type: "storyboard-image",
      output: `images/${scene.imageFile}`,
      prompt: prompt?.runwayPrompt ?? prompt?.imagePrompt ?? "",
      negativePrompt: prompt?.negativePrompt ?? "",
      negativePromptPath: `prompts/${scene.fileBase}.negative.txt`,
      continuityRules: prompt?.continuityRules ?? [],
      promptPath: `prompts/${scene.fileBase}.runway.txt`,
      finalShotReference: scene.finalShotReference ?? null
    };
  });

  await Promise.all(
    jobs.map((job) =>
      writeFile(
        path.join(IMAGES_DIR, `${scenePrefix(job.sceneId)}_${slugify(job.sceneName)}.image-job.json`),
        `${JSON.stringify(job, null, 2)}\n`
      )
    )
  );

  return jobs;
}

export async function generateVideos(storyboard, scenes, prompts) {
  const jobs = scenes
    .filter((scene) => scene.generateVideo !== false)
    .map((scene) => {
      const prompt = prompts.find((entry) => entry.sceneId === scene.id);
      const engine = scene.videoEngine ?? storyboard.videoEngine ?? "runway-gen-2";
      const isKling = engine.toLowerCase().includes("kling");

      return {
        sceneId: scene.id,
        sceneName: scene.name,
        engine,
        type: "storyboard-video",
        output: `videos/${scene.videoFile}`,
        prompt: isKling ? (prompt?.klingPrompt ?? "") : (prompt?.runwayPrompt ?? prompt?.videoPrompt ?? ""),
        promptPath: isKling
          ? `prompts/${scene.fileBase}.kling.txt`
          : `prompts/${scene.fileBase}.runway.txt`,
        negativePrompt: prompt?.negativePrompt ?? "",
        negativePromptPath: `prompts/${scene.fileBase}.negative.txt`,
        continuityRules: prompt?.continuityRules ?? [],
        duration: scene.duration,
        finalShotReference: scene.finalShotReference ?? null
      };
    });

  await Promise.all(
    jobs.map((job) =>
      writeFile(
        path.join(VIDEOS_DIR, `${scenePrefix(job.sceneId)}_${slugify(job.sceneName)}.video-job.json`),
        `${JSON.stringify(job, null, 2)}\n`
      )
    )
  );

  return jobs;
}

function buildCombinedStoryboardPreview(storyboard, scenes, prompts) {
  return {
    project: storyboard.project,
    duration: storyboard.duration,
    sceneCount: scenes.length,
    sequence: scenes.map((scene) => {
      const prompt = prompts.find((entry) => entry.sceneId === scene.id);

      return {
        id: scene.id,
        name: scene.name,
        startTime: scenes
          .filter((candidate) => candidate.id < scene.id)
          .reduce((total, candidate) => total + candidate.duration, 0),
        duration: scene.duration,
        camera: scene.camera,
        motion: scene.motion,
        finalShotReference: scene.finalShotReference ?? null,
        previewImage: `images/${scene.imageFile}`,
        previewVideo: scene.generateVideo === false ? null : `videos/${scene.videoFile}`,
        promptReference: `prompts/${scene.fileBase}.prompts.json`,
        runwayPromptReference: `prompts/${scene.fileBase}.runway.txt`,
        klingPromptReference: `prompts/${scene.fileBase}.kling.txt`,
        imagePrompt: prompt?.imagePrompt ?? "",
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
      continuityRules: storyboard.continuityRules ?? []
    },
    timeline: scenes.map((scene) => ({
      sceneId: scene.id,
      sceneName: scene.name,
      imageReference: `images/${scene.imageFile}`,
      videoReference: scene.generateVideo === false ? null : `videos/${scene.videoFile}`,
      editableReference: scene.finalShotReference ?? null,
      duration: scene.duration
    }))
  };
}

function buildValidationReport(storyboard, scenes, prompts) {
  const sceneChecks = scenes.map((scene) => validateScene(scene, storyboard));
  const promptChecks = prompts.flatMap((prompt) => {
    const scene = scenes.find((entry) => entry.id === prompt.sceneId);

    if (!scene) {
      return [];
    }

    return [
      validatePrompt(scene, storyboard, prompt.imagePrompt, "image"),
      validatePrompt(scene, storyboard, prompt.videoPrompt, "video"),
      validatePrompt(scene, storyboard, prompt.runwayPrompt, "runway"),
      validatePrompt(scene, storyboard, prompt.klingPrompt, "kling")
    ];
  });

  return {
    project: storyboard.project,
    valid:
      sceneChecks.every((entry) => entry.valid) && promptChecks.every((entry) => entry.valid),
    summary: {
      sceneCount: scenes.length,
      promptCount: promptChecks.length,
      validScenes: sceneChecks.filter((entry) => entry.valid).length,
      validPrompts: promptChecks.filter((entry) => entry.valid).length
    },
    sceneChecks,
    promptChecks
  };
}

function buildStoryboardPreviewHtml(storyboard, scenes, prompts, imageJobs, videoJobs) {
  const cards = scenes
    .map((scene) => {
      const prompt = prompts.find((entry) => entry.sceneId === scene.id);
      const imageJob = imageJobs.find((entry) => entry.sceneId === scene.id);
      const videoJob = videoJobs.find((entry) => entry.sceneId === scene.id);

      return `
        <article class="scene-card">
          <div class="scene-head">
            <span class="scene-id">Scene ${escapeHtml(scenePrefix(scene.id))}</span>
            <h2>${escapeHtml(scene.name)}</h2>
            <span class="duration">${escapeHtml(String(scene.duration))}s</span>
          </div>
          <dl class="scene-meta">
            <div><dt>Camera</dt><dd>${escapeHtml(scene.camera)}</dd></div>
            <div><dt>Motion</dt><dd>${escapeHtml(scene.motion)}</dd></div>
            <div><dt>Image manifest</dt><dd>${escapeHtml(imageJob ? `images/${scenePrefix(scene.id)}_${slugify(scene.name)}.image-job.json` : "Pending")}</dd></div>
            <div><dt>Video manifest</dt><dd>${escapeHtml(videoJob ? `videos/${scenePrefix(scene.id)}_${slugify(scene.name)}.video-job.json` : "Disabled")}</dd></div>
            <div><dt>Final shot reference</dt><dd>${escapeHtml(scene.finalShotReference ?? "None")}</dd></div>
          </dl>
          <div class="prompt-block">
            <h3>Image prompt</h3>
            <pre>${escapeHtml(prompt?.imagePrompt ?? "")}</pre>
          </div>
          <div class="prompt-block">
            <h3>Video prompt</h3>
            <pre>${escapeHtml(prompt?.videoPrompt ?? "")}</pre>
          </div>
        </article>
      `;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(storyboard.project)} Storyboard Preview</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #081018;
        --panel: #101b25;
        --panel-border: #233445;
        --text: #eff6ff;
        --muted: #9eb0c3;
        --accent: #67e8f9;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: Inter, Arial, sans-serif;
        background: linear-gradient(180deg, #081018 0%, #0d1720 100%);
        color: var(--text);
      }
      main {
        max-width: 1180px;
        margin: 0 auto;
        padding: 32px 20px 60px;
      }
      header {
        margin-bottom: 24px;
      }
      header h1 {
        margin: 0 0 8px;
        font-size: 32px;
      }
      header p {
        margin: 0;
        color: var(--muted);
      }
      .grid {
        display: grid;
        gap: 18px;
      }
      .scene-card {
        border: 1px solid var(--panel-border);
        border-radius: 8px;
        padding: 18px;
        background: var(--panel);
      }
      .scene-head {
        display: flex;
        align-items: baseline;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 14px;
      }
      .scene-head h2 {
        margin: 0;
        font-size: 22px;
        text-transform: capitalize;
      }
      .scene-id,
      .duration {
        font-size: 12px;
        color: var(--accent);
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .scene-meta {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 12px;
        margin: 0 0 16px;
      }
      .scene-meta div {
        border: 1px solid var(--panel-border);
        border-radius: 8px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.02);
      }
      dt {
        margin: 0 0 6px;
        color: var(--muted);
        font-size: 12px;
        text-transform: uppercase;
        font-weight: 700;
      }
      dd {
        margin: 0;
        font-size: 14px;
        line-height: 1.5;
      }
      .prompt-block {
        margin-top: 14px;
      }
      .prompt-block h3 {
        margin: 0 0 8px;
        font-size: 15px;
      }
      pre {
        margin: 0;
        white-space: pre-wrap;
        word-break: break-word;
        border: 1px solid var(--panel-border);
        border-radius: 8px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.03);
        line-height: 1.6;
        font-size: 14px;
      }
    </style>
  </head>
  <body>
    <main>
      <header>
        <h1>${escapeHtml(storyboard.project)}</h1>
        <p>Total duration: ${escapeHtml(String(storyboard.duration))} seconds</p>
      </header>
      <section class="grid">
        ${cards}
      </section>
    </main>
  </body>
</html>
`;
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
  const prompts = await generatePromptsFromScenes(storyboard, scenes);
  const imageJobs = await generateImages(storyboard, scenes, prompts);
  const videoJobs = await generateVideos(storyboard, scenes, prompts);

  const preview = buildCombinedStoryboardPreview(storyboard, scenes, prompts);
  const editingExport = buildEditingExport(storyboard, scenes);
  const validationReport = buildValidationReport(storyboard, scenes, prompts);
  const storyboardPreviewHtml = buildStoryboardPreviewHtml(
    storyboard,
    scenes,
    prompts,
    imageJobs,
    videoJobs
  );

  await writeFile(path.join(EXPORTS_DIR, "storyboard_sequence.json"), `${JSON.stringify(preview, null, 2)}\n`);
  await writeFile(path.join(EXPORTS_DIR, "editing_manifest.json"), `${JSON.stringify(editingExport, null, 2)}\n`);
  await writeFile(path.join(EXPORTS_DIR, "validation_report.json"), `${JSON.stringify(validationReport, null, 2)}\n`);
  await writeFile(path.join(EXPORTS_DIR, "storyboard_preview.html"), storyboardPreviewHtml);

  return {
    storyboard,
    scenes,
    prompts,
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
        sceneCount: result.scenes.length,
        generatedImageJobs: result.imageJobs.length,
        generatedVideoJobs: result.videoJobs.length,
        exports: [
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
