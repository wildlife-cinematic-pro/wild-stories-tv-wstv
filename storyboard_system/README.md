# Storyboard System

This module is a clean, isolated storyboard workflow that sits beside the production pipeline without sharing output folders or overwriting final shots.

It is built for creator planning, identity continuity, and Runway/Kling-ready source manifests. It does not generate final media by itself.

## Fast automatic workflow

For a new animal video, edit only:

```text
storyboard_system/storyboard_input.json
```

Then run:

```bash
npm run storyboard
```

The command automatically converts `storyboard_input.json` into `storyboard.json`, then generates all storyboard prompts, master-image jobs, final-image jobs, video jobs, reference manifests, validation, and preview exports.

You usually only change these fields:

- `project`
- `predator`
- `prey`
- `predatorSide`
- `preySide`
- `environment`
- `lighting`
- `sceneDescription`
- `predatorDescription`
- `preyDescription`
- `predatorIdentityNotes`
- `preyIdentityNotes`

## Workflow order

```text
storyboard_input.json
↓
auto-generated storyboard.json
↓
storyboard image jobs for layout planning
↓
master image jobs for animal identity lock
↓
reference manifests
↓
final scene image jobs using master references
↓
image-to-video jobs using final scene keyframes
↓
preview, validation, and editing exports
```

Use this separation consistently:

- **Storyboard image** = rough layout and scene blocking
- **Master image** = animal/character identity lock
- **Final scene image** = video-ready keyframe made from the master image references
- **Video job** = Runway/Kling motion prompt using the final scene image as source

## What the module creates

The storyboard system turns a structured `storyboard_input.json` plan into:

- auto-generated `storyboard.json`
- ordered scene manifests
- generic image and video prompts
- platform-specific Runway and Kling prompt exports
- Nano Banana 2 master-image prompts
- GPT Image 2 backup master-image prompts
- negative prompt exports
- storyboard image job manifests
- final scene image job manifests
- optional video job manifests
- animal identity reference manifests
- Runway reference manifests
- JSON exports for editing tools
- an HTML storyboard preview
- a validation report for prompt completeness

Everything stays inside `storyboard_system/`.

## Structure

```text
storyboard_system/
  storyboard_input.json
  generate_from_input.mjs
  storyboard.json
  pipeline.mjs
  scenes/
  prompts/
  master_images/
  references/
  images/
  videos/
  exports/
```

## Input fields

Edit `storyboard_input.json`:

- `project`: project slug or name
- `predator`: predator or pressure animal
- `prey`: defender, target, or escape animal
- `predatorSide`: usually `right`
- `preySide`: usually `left`
- `environment`: habitat/background
- `lighting`: lighting direction and mood
- `storyArc`: optional planning label
- `durationLane`: `short`, `medium`, or `long`
- `videoEngines`: optional per-scene engines
- `sceneDescription`: main action beat
- `predatorDescription`: identity description for predator master image
- `preyDescription`: identity description for prey/defender master image
- `predatorIdentityNotes`: continuity rules for predator identity
- `preyIdentityNotes`: continuity rules for prey/defender identity
- `negativePrompt`: shared negative prompt

## Advanced manual editing

`storyboard.json` is now generated from `storyboard_input.json`. Manual edits to `storyboard.json` are still possible, but they will be overwritten the next time `npm run storyboard` runs.

If you need full manual control, edit `storyboard.json` and run only:

```bash
node storyboard_system/pipeline.mjs
```

## Generated prompt files

Generated prompt files land in `storyboard_system/prompts/`:

- `master_massive_bison.nano-banana-2.txt`
- `master_massive_bison.gpt-image-2.txt`
- `01_scene.image.txt`
- `01_scene.final-image.txt`
- `01_scene.video.txt`
- `01_scene.runway.txt`
- `01_scene.kling.txt`
- `01_scene.negative.txt`
- `01_scene.prompts.json`

Use `*.image.txt` for rough storyboard layout images.

Use `master_*.nano-banana-2.txt` for identity-lock master stills.

Use `master_*.gpt-image-2.txt` for backup cover/thumbnail/strict-layout stills.

Use `*.final-image.txt` for final scene keyframes made from master image references.

Use `*.runway.txt` or `*.kling.txt` for image-to-video after the final scene keyframe exists.

## Generated manifests

The pipeline creates:

```text
storyboard_system/master_images/*.master-image-job.json
storyboard_system/references/animal_identity_manifest.json
storyboard_system/references/runway_reference_manifest.json
storyboard_system/images/*.storyboard-image-job.json
storyboard_system/images/*.final-image-job.json
storyboard_system/videos/*.video-job.json
```

The video job manifests point to the final scene image, not the rough storyboard image.

## Preview and exports

The pipeline also creates:

- `exports/storyboard_preview.html`
- `exports/storyboard_sequence.json`
- `exports/editing_manifest.json`
- `exports/validation_report.json`

Open `storyboard_preview.html` in a browser for a creator-friendly review of master-image prompts, storyboard prompts, final-image prompts, and video prompts.

## Separation rule

- Storyboard outputs never mix with production shot outputs.
- Storyboard files never overwrite production workflow folders.
- `finalShotReference` is metadata only and does not trigger final-shot generation.
- Storyboard images are not treated as identity sources.
- Master images are identity sources.
- Final scene images are image-to-video source frames.

## Troubleshooting

If a prompt, scene, or master image job fails validation, check `exports/validation_report.json`.

Common causes:

- empty animal name in `storyboard_input.json`
- missing environment or scene description
- missing lighting or identity description
- duration set to an unsupported lane
- using a storyboard image where a final scene keyframe should be used

If you change the input, rerun the pipeline so the HTML preview, prompt exports, reference manifests, and job manifests stay in sync.
