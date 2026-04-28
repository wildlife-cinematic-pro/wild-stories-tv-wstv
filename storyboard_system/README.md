# Storyboard System

This module is a clean, isolated storyboard workflow that sits beside the
production pipeline without sharing output folders or overwriting final shots.

It is built for creator planning, not final delivery generation.

## What the module does

The storyboard system turns a structured `storyboard.json` plan into:

- ordered scene manifests
- generic image and video prompts
- platform-specific Runway and Kling prompt exports
- negative prompt exports
- image job manifests
- optional video job manifests
- JSON exports for editing tools
- an HTML storyboard preview
- a validation report for prompt completeness

Everything stays inside `storyboard_system/`.

## Structure

```text
storyboard_system/
  scenes/
  prompts/
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
- `imageEngine`: default image engine, such as `runway-image`
- `videoEngine`: default video engine, such as `runway-gen-2` or `kling`
- `styleGuide`: shared style language for every scene
- `negativePrompt`: shared negative prompt exported separately and included in job manifests
- `continuityRules`: shared continuity constraints applied to every prompt
- `aspectRatio`: framing target, such as `9:16`

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
- `finalShotReference` (metadata only)

## How to run the pipeline

Run either command from the repo root:

```bash
node storyboard_system/pipeline.mjs
```

or, if the package script is available:

```bash
npm run storyboard
```

The pipeline refreshes only the generated files inside `storyboard_system/`.
It does not write into production output directories.

## Where prompts are generated

Generated prompt files land in `storyboard_system/prompts/`:

- `01_scene.image.txt`
- `01_scene.video.txt`
- `01_scene.runway.txt`
- `01_scene.kling.txt`
- `01_scene.negative.txt`
- `01_scene.prompts.json`

## How to use the generated prompts in Runway and Kling

Use `*.runway.txt` when you want prompts biased toward:

- camera movement readability
- continuity from the source image
- clean composition
- image-to-video stability

Use `*.kling.txt` when you want prompts biased toward:

- motion clarity
- subject blocking
- action timing
- physics consistency

The corresponding job manifests in `images/` and `videos/` include prompt paths,
negative prompt paths, continuity rules, and optional final-shot references as
metadata only.

## Preview and exports

The pipeline also creates:

- `exports/storyboard_preview.html`
- `exports/storyboard_sequence.json`
- `exports/editing_manifest.json`
- `exports/validation_report.json`

Open `storyboard_preview.html` in a browser for a quick creator-friendly review.

## Separation rule

- Storyboard outputs never mix with production shot outputs.
- Storyboard files never overwrite production workflow folders.
- `finalShotReference` is metadata only and does not trigger final-shot generation.

## Troubleshooting

If a prompt or scene fails validation, check `exports/validation_report.json`.
Common causes:

- empty camera or motion field
- missing subject or action
- missing lighting or style
- missing aspect ratio
- duration set to `0` or a negative number

If you change the storyboard structure, rerun the pipeline so the HTML preview,
prompt exports, and job manifests stay in sync.
