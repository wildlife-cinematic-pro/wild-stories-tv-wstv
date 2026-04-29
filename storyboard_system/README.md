# Storyboard System

This module is a clean, isolated storyboard workflow that sits beside the production pipeline without sharing output folders or overwriting final shots.

It is built for creator planning, identity continuity, and Runway/Kling-ready source manifests. It does not generate final media by itself.

## Workflow order

```text
storyboard.json
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

The storyboard system turns a structured `storyboard.json` plan into:

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
  scenes/
  prompts/
  master_images/
  references/
  images/
  videos/
  exports/
  storyboard.json
  pipeline.mjs
```

## How to edit `storyboard.json`

Define the project at the top level:

- `project`: project slug or name
- `duration`: total project duration target
- `imageEngine`: default storyboard image engine, such as `runway-image`
- `finalImageEngine`: final scene keyframe engine
- `videoEngine`: default video engine, such as `runway-gen-2` or `kling`
- `masterImagePrimaryEngine`: primary master-image engine, normally `nano-banana-2`
- `masterImageBackupEngine`: backup master-image engine, normally `gpt-image-2`
- `masterImageUseCase`: why the master image exists
- `backupImageUseCase`: why the backup image exists
- `masterReferenceMode`: how master images are used before final scene images
- `styleGuide`: shared style language for every scene
- `negativePrompt`: shared negative prompt exported separately and included in job manifests
- `continuityRules`: shared continuity constraints applied to every prompt
- `aspectRatio`: framing target, such as `9:16`
- `masterSubjects`: explicit subject identity definitions used to create master-image jobs

Define each `masterSubjects` item with:

- `name`
- `slug`
- `role`
- `side`
- `description`
- `identityNotes`
- `referenceImage` metadata, or `null` if no source image is attached yet

Define each scene with:

- `id`
- `name`
- `description`
- `camera`
- `motion`
- `subject`
- `action`
- `lighting`
- `style`
- `environment`
- `duration`
- `generateVideo`
- `videoEngine`
- `finalShotReference` metadata only

## How to run the pipeline

Run either command from the repo root:

```bash
node storyboard_system/pipeline.mjs
```

or:

```bash
npm run storyboard
```

The pipeline refreshes only generated files inside `storyboard_system/`. It does not write into production output directories.

## Generated prompt files

Generated prompt files land in `storyboard_system/prompts/`:

- `master_grey_wolf.nano-banana-2.txt`
- `master_grey_wolf.gpt-image-2.txt`
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

- empty camera or motion field
- missing subject or action
- missing lighting or style
- missing aspect ratio
- duration set to `0` or a negative number
- missing `masterSubjects` identity details
- using a storyboard image where a final scene keyframe should be used

If you change the storyboard structure, rerun the pipeline so the HTML preview, prompt exports, reference manifests, and job manifests stay in sync.
