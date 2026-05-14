# Storyboard System

This module generates a generic all-animal Runway three-reference workflow. It does not generate real images, videos, music, or final production media by itself. It creates copy-paste-ready prompts, job manifests, reference manifests, validation, and an HTML preview for manual use in Runway, Kling, and ElevenLabs.

Everything stays inside `storyboard_system/`.

## Fast Automatic Workflow

Edit:

```text
storyboard_system/storyboard_input.json
```

Then run:

```bash
npm run storyboard
```

The command automatically creates `storyboard.json`, master image prompts, final scene prompts, Runway/Kling video prompts, ElevenLabs music prompt, job manifests, reference manifests, preview exports, and validation.

## Generic All-Animal Input

Use the object schema for any predator/defender animal pair and any environment:

```json
{
  "project": "generic_wildlife_standoff",
  "mode": "runway_3_reference_final_scene",
  "predator": {
    "name": "animal name",
    "slug": "animal_slug",
    "role": "predator",
    "side": "right",
    "description": "full body readable wildlife identity description",
    "identityNotes": "Preserve identity markers, scale, anatomy, and grounded contact."
  },
  "prey": {
    "name": "animal name",
    "slug": "animal_slug",
    "role": "defender",
    "side": "left",
    "description": "full body readable wildlife identity description",
    "identityNotes": "Preserve identity markers, scale, anatomy, and grounded contact."
  },
  "environment": {
    "name": "environment name",
    "slug": "environment_slug",
    "description": "habitat, ground texture, weather, distance cues",
    "lighting": "documentary lighting description",
    "rules": "environment reference only, no animals, no people, no buildings, no roads"
  },
  "finalScene": {
    "composition": "prey/defender on the left, predator on the right, clear reaction lane between them",
    "camera": "cinematic telephoto documentary framing",
    "style": "professional pencil-drawn wildlife storyboard frame",
    "aspectRatio": "9:16",
    "tension": "high survival tension with clean readable spacing",
    "action": "defender holds dominant pressure while predator reacts defensively"
  },
  "video": {
    "duration": 15,
    "platform": "kling",
    "format": "multi-shot",
    "shotCount": 5,
    "musicMood": "tense cinematic wildlife action trailer music",
    "regionTarget": "viral wildlife shorts audience"
  },
  "aiEnhancement": {
    "enabled": true,
    "provider": "gemini",
    "style": "professional wildlife storyboard previsualization",
    "strictness": "preserve identity, stable anatomy, grounded motion, positive prompt wording"
  }
}
```

The old flat schema still works. If the input uses string fields like `predator`, `prey`, `predatorSide`, `preySide`, `environment`, `lighting`, and `sceneDescription`, the generator normalizes it into the new object schema internally.

## Runway Three-Reference Workflow

The generated workflow is:

1. Generate prey-only storyboard reference frame.
2. Save/tag in Runway as `@<prey_slug>`.
3. Generate predator-only storyboard reference frame.
4. Save/tag in Runway as `@<predator_slug>`.
5. Generate environment-only storyboard reference frame.
6. Save/tag in Runway as `@<environment_slug>`.
7. Use all 3 references to generate the final scene storyboard frame.
8. Use the final scene storyboard frame as the source for Runway/Kling video.

Use positive control language in Runway. The prompts emphasize separated animals, a clear open reaction lane, full body readability, clean spacing, grounded contact, stable anatomy, and environment-only background control.

## Gemini Enhancement

Optional Gemini enhancement is supported through Google AI Studio keys. Set any one of these environment variables:

```bash
export GEMINI_API_KEY="your_key_here"
```

Also supported:

```bash
export GOOGLE_API_KEY="your_key_here"
export GOOGLE_GENERATIVE_AI_API_KEY="your_key_here"
```

Do not commit real API keys. If a Gemini key exists, the system attempts to enhance animal descriptions, environment details, the final scene prompt, Runway prompt, Kling prompt, and ElevenLabs music prompt. If the key is missing, invalid, rate-limited, or the request fails, the pipeline falls back to deterministic local templates and continues without crashing. Secrets are never printed in logs.

## Generated Prompt Files

Required prompt files are generated in `storyboard_system/prompts/`:

```text
prey_master.txt
predator_master.txt
environment_master.txt
final_scene_master.txt
final_scene_video_runway.txt
final_scene_video_kling.txt
elevenlabs_action_music.txt
```

The pipeline also keeps per-shot storyboard prompt files such as `01_establishing_tension.image.txt`, `01_establishing_tension.runway.txt`, and `01_establishing_tension.kling.txt` for the existing automatic workflow.

## Generated Manifests

Required image job manifests are generated in `storyboard_system/images/`:

```text
prey.master-image-job.json
predator.master-image-job.json
environment.master-image-job.json
final-scene.master-image-job.json
```

The Runway reference manifest is generated at:

```text
storyboard_system/references/runway_3_reference_manifest.json
```

The pipeline also writes compatibility manifests and scene/video job manifests used by the existing workflow.

## Manual Production Use

1. Open `prompts/prey_master.txt` and generate the prey/defender-only master image in Runway.
2. Tag that output as `@<prey_slug>`.
3. Open `prompts/predator_master.txt` and generate the predator-only master image in Runway.
4. Tag that output as `@<predator_slug>`.
5. Open `prompts/environment_master.txt` and generate the environment-only master image in Runway.
6. Tag that output as `@<environment_slug>`.
7. Open `prompts/final_scene_master.txt` and generate the final scene storyboard frame using exactly those three active references.
8. Use `master_images/final_scene_master/<project>.final.png` as the source image for Runway or Kling video.
9. Use `prompts/final_scene_video_runway.txt` for Runway, `prompts/final_scene_video_kling.txt` for Kling, and `prompts/elevenlabs_action_music.txt` for ElevenLabs music.

Actual images, videos, and music are generated manually in Runway, Kling, and ElevenLabs. This repo only generates prompt and manifest files.

## Preview And Validation

Open:

```text
storyboard_system/exports/storyboard_preview.html
```

The preview shows the animal pair, environment, master prompts, active Runway references, reference roles, final scene master prompt, Runway video prompt, Kling video prompt, ElevenLabs music prompt, and production order checklist.

Validation is written to:

```text
storyboard_system/exports/validation_report.json
```

Validation checks predator, prey, environment, finalScene, all three Runway tags, final scene prompt references, `maxActiveReferences: 3`, generated prompt files, job manifests, reference manifest, video prompts, and ElevenLabs music prompt.
