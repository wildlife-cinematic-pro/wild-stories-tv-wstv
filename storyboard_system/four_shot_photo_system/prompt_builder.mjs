import { buildMasterEnvironmentPrompt, buildShotPrompt } from "./engine_policies.mjs";
import { continuityChecklistForShot } from "./realism_rules.mjs";

const DEFAULT_INPUT = {
  project: "four_shot_wildlife_photo_story",
  predator: "Mountain Lion",
  prey: "Mule Deer",
  environment: "Rocky Mountain sagebrush meadow with a narrow dirt trail, tawny grass, scattered sagebrush, pine treeline, and distant mountain ridge",
  lighting: "low golden-hour side light from camera left",
  season: "early autumn",
  aspectRatio: "9:16",
  shotMode: "4-shot same-environment wildlife photo continuity",
  environmentPlateDescription: "empty natural wildlife habitat plate with one clear action lane, consistent trail, grass, sagebrush, treeline, ridge, season, and light direction",
  predatorIdentityNotes: "adult predator with correct species anatomy, stable body mass, clean full-body silhouette, grounded paws, and consistent coat markers",
  preyIdentityNotes: "adult prey animal with correct species anatomy, stable body mass, clean full-body silhouette, grounded hooves, and consistent coat markers"
};

export const SHOTS = [
  {
    id: 1,
    slug: "wide_hook",
    name: "Wide Hook",
    purpose: "establish predator pressure, readable prey threat awareness, and one clean action lane inside the same habitat",
    composition: "wide vertical wildlife frame, predator visible on the rear-right side of the trail, prey readable ahead-left or partially framed by sagebrush, pine treeline and distant ridge locked in the background",
    action: "predator holds low stalking pressure while prey freezes alert with ears and head oriented toward the threat direction",
    continuityNote: "preserve left/right blocking and story geography: predator behind/right, prey ahead/left, same diagonal trail and meadow depth"
  },
  {
    id: 2,
    slug: "predator_push_in",
    name: "Predator Push-in",
    purpose: "closer stalking pressure with predator gaze locked on prey while the same environment remains recognizable",
    composition: "medium telephoto-feel frame from the same meadow, predator larger in frame near the same trail edge, prey still visible or implied ahead along the lane, same sagebrush density and ridge alignment",
    action: "mountain lion advances with shoulders low, paws grounded, tail balanced low, eyes locked toward the mule deer threat direction",
    continuityNote: "same path geometry, same light direction, same treeline, predator remains behind the prey in the story lane"
  },
  {
    id: 3,
    slug: "prey_reaction",
    name: "Prey Reaction",
    purpose: "foreground prey reaction with clear threat awareness and no change to habitat continuity",
    composition: "prey foreground or near-midground with clean silhouette, predator pressure visible behind or readable through gaze direction, same trail, grass, sagebrush, treeline, and ridge depth",
    action: "mule deer braces and turns alert, ears high, legs grounded in grass, body angled away from the approaching mountain lion without contact",
    continuityNote: "prey attention remains locked toward predator pressure, left/right geography remains consistent unless the angle slightly wraps around the same trail"
  },
  {
    id: 4,
    slug: "chase_action",
    name: "Chase / Action",
    purpose: "grounded action peak with predator behind, prey ahead, and no graphic contact",
    composition: "side or slight reverse-angle action frame along the same dirt game trail, prey ahead in the action lane, predator behind in pursuit, same meadow texture and ridge identity still visible",
    action: "prey launches forward with hooves striking dirt and grass while predator accelerates behind, paws grounded, subtle dry dust only near the trail, no contact and no injury",
    continuityNote: "same story geography, predator behind and prey ahead, same season, same golden-hour direction, same habitat density and color tone"
  }
];

function text(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function normalizeFourshotInput(raw = {}) {
  return {
    project: text(raw.project, DEFAULT_INPUT.project),
    predator: text(raw.predator, DEFAULT_INPUT.predator),
    prey: text(raw.prey, DEFAULT_INPUT.prey),
    environment: text(raw.environment, DEFAULT_INPUT.environment),
    lighting: text(raw.lighting, DEFAULT_INPUT.lighting),
    season: text(raw.season, DEFAULT_INPUT.season),
    aspectRatio: text(raw.aspectRatio, DEFAULT_INPUT.aspectRatio),
    shotMode: text(raw.shotMode, DEFAULT_INPUT.shotMode),
    environmentPlateDescription: text(raw.environmentPlateDescription, DEFAULT_INPUT.environmentPlateDescription),
    predatorIdentityNotes: text(raw.predatorIdentityNotes, DEFAULT_INPUT.predatorIdentityNotes),
    preyIdentityNotes: text(raw.preyIdentityNotes, DEFAULT_INPUT.preyIdentityNotes)
  };
}

export function buildFourshotPrompts(rawInput = {}) {
  const input = normalizeFourshotInput(rawInput);
  const masterEnvironment = {
    nanoBanana2Prompt: buildMasterEnvironmentPrompt(input, "nano"),
    gptImage2Prompt: buildMasterEnvironmentPrompt(input, "gptimage2"),
    continuityChecklist: [
      "master plate has no animals and no human-made elements",
      "same terrain, trail, vegetation density, treeline, ridge, season, light direction, color tone, and atmosphere",
      "open action lane supports all four later wildlife shots without environment drift"
    ]
  };
  const shots = SHOTS.map((shot) => ({
    id: shot.id,
    slug: shot.slug,
    name: shot.name,
    purpose: shot.purpose,
    nanoBanana2Prompt: buildShotPrompt(input, shot, "nano"),
    gptImage2Prompt: buildShotPrompt(input, shot, "gptimage2"),
    continuityChecklist: continuityChecklistForShot(shot)
  }));
  return { project: input.project, shotMode: input.shotMode, input, masterEnvironment, shots };
}

export function outputFilesForPrompts(data) {
  const files = [
    ["00_master_environment.nano.txt", data.masterEnvironment.nanoBanana2Prompt],
    ["00_master_environment.gptimage2.txt", data.masterEnvironment.gptImage2Prompt]
  ];
  for (const shot of data.shots) {
    const prefix = String(shot.id).padStart(2, "0") + "_" + shot.slug;
    files.push([prefix + ".nano.txt", shot.nanoBanana2Prompt]);
    files.push([prefix + ".gptimage2.txt", shot.gptImage2Prompt]);
  }
  return files;
}

export function exportFourshotJson(data) {
  return {
    project: data.project,
    shotMode: data.shotMode,
    generatedAt: new Date().toISOString(),
    masterEnvironment: data.masterEnvironment,
    shots: data.shots.map((shot) => ({
      id: shot.id,
      name: shot.name,
      purpose: shot.purpose,
      nanoBanana2Prompt: shot.nanoBanana2Prompt,
      gptImage2Prompt: shot.gptImage2Prompt,
      continuityChecklist: shot.continuityChecklist
    }))
  };
}

