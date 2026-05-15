export type FourShotPhotoInput = {
  project?: string;
  predator: string;
  prey: string;
  environment: string;
  lighting: string;
  season: string;
  aspectRatio: string;
  predatorIdentityNotes: string;
  preyIdentityNotes: string;
  environmentPlateDescription?: string;
  shotMode?: string;
};

export type FourShotPhotoShot = {
  id: number;
  slug: string;
  name: string;
  purpose: string;
  nanoBanana2Prompt: string;
  gptImage2Prompt: string;
  continuityChecklist: string[];
};

export type FourShotPhotoOutput = {
  project: string;
  shotMode: string;
  input: Required<FourShotPhotoInput>;
  masterEnvironment: {
    nanoBanana2Prompt: string;
    gptImage2Prompt: string;
    continuityChecklist: string[];
  };
  shots: FourShotPhotoShot[];
};

type ShotTemplate = {
  id: number;
  slug: string;
  name: string;
  purpose: string;
  composition: string;
  action: string;
  continuityNote: string;
};

type EngineKey = "nano" | "gptimage2";

const DEFAULT_INPUT: Required<FourShotPhotoInput> = {
  project: "four_shot_wildlife_photo_story",
  predator: "Mountain Lion",
  prey: "Mule Deer",
  environment:
    "Yellowstone sagebrush meadow with a narrow dirt game trail, tawny grass, scattered sagebrush, dark pine treeline, and a distant blue-gray mountain ridge",
  lighting: "low golden-hour side light from camera left with soft natural rim light",
  season: "early autumn",
  aspectRatio: "9:16",
  shotMode: "4-shot same-environment wildlife photo continuity",
  environmentPlateDescription:
    "empty natural wildlife habitat plate with one clear action lane, consistent trail, grass, sagebrush, treeline, ridge, season, and light direction",
  predatorIdentityNotes:
    "adult predator with correct species anatomy, stable body mass, clean full-body silhouette, grounded paws, and consistent coat markers",
  preyIdentityNotes:
    "adult prey animal with correct species anatomy, stable body mass, clean full-body silhouette, grounded hooves, and consistent coat markers",
};

const ENVIRONMENT_LOCK_RULES = [
  "same terrain and trail/path geometry across every shot",
  "same grass or sagebrush density and height",
  "same treeline placement and distant ridge/habitat identity",
  "same season, lighting direction, color tone, and atmosphere",
  "no environment redesign, no random new landmarks, no weather drift",
];

const ANIMAL_REALISM_RULES = [
  "correct body mass and stable anatomy for each species",
  "correct predator/prey scale relationship",
  "natural posture with clean readable silhouettes",
  "grounded paw and hoof contact with no floating animals",
  "believable wildlife behavior and threat awareness",
  "same animal identity markers across all shots",
];

const PHYSICAL_INTEGRATION_RULES = [
  "soft natural cast shadows and contact shadows at paws and hooves",
  "grass and sagebrush interaction around legs",
  "subtle terrain displacement where feet meet dirt or dry grass",
  "matching rim light and atmospheric perspective",
  "no pasted, cutout, collage, or composited look",
];

const NEGATIVE_REALISM_RULES = [
  "no oversaturated fantasy look",
  "no fake HDR or plastic fur",
  "no excessive blur or impossible lens distortion",
  "no melted anatomy, duplicate limbs, extra animals, people, roads, fences, buildings, text, watermark, subtitles",
  "no blood, no gore, no visible wounds, no graphic contact",
];

const SHOTS: ShotTemplate[] = [
  {
    id: 1,
    slug: "wide_hook",
    name: "Wide Hook",
    purpose:
      "establish predator pressure, readable prey threat awareness, and one clean action lane inside the same habitat",
    composition:
      "wide vertical wildlife frame, predator visible on the rear-right side of the trail, prey readable ahead-left or partially framed by sagebrush, pine treeline and distant ridge locked in the background",
    action:
      "predator holds low stalking pressure while prey freezes alert with ears and head oriented toward the threat direction",
    continuityNote:
      "preserve left/right blocking and story geography: predator behind/right, prey ahead/left, same diagonal trail and meadow depth",
  },
  {
    id: 2,
    slug: "predator_push_in",
    name: "Predator Push-in",
    purpose:
      "closer stalking pressure with predator gaze locked on prey while the same environment remains recognizable",
    composition:
      "medium telephoto-feel frame from the same meadow, predator larger in frame near the same trail edge, prey still visible or implied ahead along the lane, same sagebrush density and ridge alignment",
    action:
      "predator advances with shoulders low, paws grounded, tail balanced low, eyes locked toward the prey threat direction",
    continuityNote:
      "same path geometry, same light direction, same treeline, predator remains behind the prey in the story lane",
  },
  {
    id: 3,
    slug: "prey_reaction",
    name: "Prey Reaction",
    purpose:
      "foreground prey reaction with clear threat awareness and no change to habitat continuity",
    composition:
      "prey foreground or near-midground with clean silhouette, predator pressure visible behind or readable through gaze direction, same trail, grass, sagebrush, treeline, and ridge depth",
    action:
      "prey braces and turns alert, ears high, legs grounded in grass, body angled away from the approaching predator without contact",
    continuityNote:
      "prey attention remains locked toward predator pressure, left/right geography remains consistent unless the angle slightly wraps around the same trail",
  },
  {
    id: 4,
    slug: "chase_action",
    name: "Chase / Action",
    purpose: "grounded action peak with predator behind, prey ahead, and no graphic contact",
    composition:
      "side or slight reverse-angle action frame along the same dirt game trail, prey ahead in the action lane, predator behind in pursuit, same meadow texture and ridge identity still visible",
    action:
      "prey launches forward with hooves striking dirt and grass while predator accelerates behind, paws grounded, subtle dry dust only near the trail, no contact and no injury",
    continuityNote:
      "same story geography, predator behind and prey ahead, same season, same golden-hour direction, same habitat density and color tone",
  },
];

const ENGINE_POLICIES: Record<EngineKey, { masterTone: string; shotTone: string; qualityLine: string; length: "tight" | "rich" }> = {
  nano: {
    masterTone:
      "Clean photorealistic environment plate prompt for Nano Banana 2. Keep it direct, natural, and continuity-first.",
    shotTone:
      "Clean photorealistic wildlife image prompt for Nano Banana 2. Use direct composition, subject placement, and realism integration language.",
    qualityLine:
      "Ultra-realistic natural wildlife photography, clean documentary realism, believable ground contact, same-background continuity.",
    length: "tight",
  },
  gptimage2: {
    masterTone:
      "Premium photorealistic wildlife documentary environment plate prompt for GPT Image 2 with high-end natural photography language.",
    shotTone:
      "Premium photorealistic wildlife documentary still for GPT Image 2 with telephoto wildlife lens feel, clean environmental depth, and natural atmospheric perspective.",
    qualityLine:
      "World-class wildlife photography feel, realistic fur detail, physically plausible golden-hour light, crisp subject separation, documentary realism, not stylized fantasy.",
    length: "rich",
  },
};

function text(value: string | undefined, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function compactRuleSentence(items: string[]): string {
  return items.join("; ") + ".";
}

function environmentLock(input: Required<FourShotPhotoInput>): string {
  return [
    "Location lock: " + input.environment + ".",
    "Season lock: " + input.season + ".",
    "Lighting lock: " + input.lighting + ".",
    "Aspect ratio: " + input.aspectRatio + ".",
    "Environment plate identity: " + input.environmentPlateDescription + ".",
  ].join(" ");
}

function subjectIdentityLines(input: Required<FourShotPhotoInput>): string {
  return [
    "Predator identity: " + input.predator + " - " + input.predatorIdentityNotes + ".",
    "Prey identity: " + input.prey + " - " + input.preyIdentityNotes + ".",
  ].join(" ");
}

function negativeLine(): string {
  return "Avoid: " + compactRuleSentence(NEGATIVE_REALISM_RULES);
}

function buildMasterEnvironmentPrompt(input: Required<FourShotPhotoInput>, engineKey: EngineKey): string {
  const policy = ENGINE_POLICIES[engineKey];
  const lines = [
    policy.masterTone,
    "Create the master environment plate for " + input.project + ".",
    environmentLock(input),
    "No animals in this master plate. No people, roads, fences, buildings, vehicles, text, or watermark.",
    "Leave one clean natural action lane through the habitat where future wildlife can be integrated.",
    "Continuity requirements: " + compactRuleSentence(ENVIRONMENT_LOCK_RULES),
    "Physical realism: " + compactRuleSentence(PHYSICAL_INTEGRATION_RULES),
    policy.qualityLine,
    negativeLine(),
  ];

  if (policy.length === "rich") {
    lines.push(
      "Use clean environmental depth, natural atmospheric perspective over the ridge, believable grass/sagebrush texture, and a real-camera documentary still feeling. The plate must look naturally photographed, not generated or composited."
    );
  }

  return lines.join("\n");
}

function buildShotPrompt(input: Required<FourShotPhotoInput>, shot: ShotTemplate, engineKey: EngineKey): string {
  const policy = ENGINE_POLICIES[engineKey];
  const lines = [
    policy.shotTone,
    shot.name + ": " + shot.purpose,
    environmentLock(input),
    subjectIdentityLines(input),
    "Composition: " + shot.composition,
    "Action: " + shot.action,
    "Continuity: " + shot.continuityNote,
    "Environment lock: " + compactRuleSentence(ENVIRONMENT_LOCK_RULES),
    "Animal realism: " + compactRuleSentence(ANIMAL_REALISM_RULES),
    "Physical integration: " + compactRuleSentence(PHYSICAL_INTEGRATION_RULES),
    policy.qualityLine,
    negativeLine(),
  ];

  if (policy.length === "rich") {
    lines.push(
      "Use a high-end telephoto wildlife lens feel without fake camera gimmicks: crisp subject separation, natural depth compression, believable fur texture, grounded legs interacting with grass, and matching rim light from the same golden-hour direction. The frame should look like an elite wildlife photographer captured the moment in real natural conditions."
    );
  }

  return lines.join("\n");
}

function continuityChecklistForShot(shot: ShotTemplate): string[] {
  return [
    ...ENVIRONMENT_LOCK_RULES,
    ...ANIMAL_REALISM_RULES,
    ...PHYSICAL_INTEGRATION_RULES,
    "predator gaze remains locked toward prey threat direction",
    "prey attention remains locked toward predator pressure",
    shot.continuityNote,
  ];
}

export function normalizeFourShotPhotoInput(raw: Partial<FourShotPhotoInput> = {}): Required<FourShotPhotoInput> {
  const environment = text(raw.environment, DEFAULT_INPUT.environment);
  return {
    project: text(raw.project, DEFAULT_INPUT.project),
    predator: text(raw.predator, DEFAULT_INPUT.predator),
    prey: text(raw.prey, DEFAULT_INPUT.prey),
    environment,
    lighting: text(raw.lighting, DEFAULT_INPUT.lighting),
    season: text(raw.season, DEFAULT_INPUT.season),
    aspectRatio: text(raw.aspectRatio, DEFAULT_INPUT.aspectRatio),
    shotMode: text(raw.shotMode, DEFAULT_INPUT.shotMode),
    environmentPlateDescription: text(
      raw.environmentPlateDescription,
      "empty master plate of " + environment + ", no animals, one clean action lane, locked vegetation and background geography"
    ),
    predatorIdentityNotes: text(raw.predatorIdentityNotes, DEFAULT_INPUT.predatorIdentityNotes),
    preyIdentityNotes: text(raw.preyIdentityNotes, DEFAULT_INPUT.preyIdentityNotes),
  };
}

export function buildFourShotPhotoPrompts(rawInput: Partial<FourShotPhotoInput> = {}): FourShotPhotoOutput {
  const input = normalizeFourShotPhotoInput(rawInput);
  const masterEnvironment = {
    nanoBanana2Prompt: buildMasterEnvironmentPrompt(input, "nano"),
    gptImage2Prompt: buildMasterEnvironmentPrompt(input, "gptimage2"),
    continuityChecklist: [
      "master plate has no animals and no human-made elements",
      "same terrain, trail, vegetation density, treeline, ridge, season, light direction, color tone, and atmosphere",
      "open action lane supports all four later wildlife shots without environment drift",
    ],
  };

  const shots = SHOTS.map((shot) => ({
    id: shot.id,
    slug: shot.slug,
    name: shot.name,
    purpose: shot.purpose,
    nanoBanana2Prompt: buildShotPrompt(input, shot, "nano"),
    gptImage2Prompt: buildShotPrompt(input, shot, "gptimage2"),
    continuityChecklist: continuityChecklistForShot(shot),
  }));

  return { project: input.project, shotMode: input.shotMode, input, masterEnvironment, shots };
}

export function buildAllNanoBanana2Text(output: FourShotPhotoOutput): string {
  return [
    "MASTER ENVIRONMENT - NANO BANANA 2\n" + output.masterEnvironment.nanoBanana2Prompt,
    ...output.shots.map((shot) => "SHOT " + shot.id + " - " + shot.name.toUpperCase() + " - NANO BANANA 2\n" + shot.nanoBanana2Prompt),
  ].join("\n\n---\n\n");
}

export function buildAllGptImage2Text(output: FourShotPhotoOutput): string {
  return [
    "MASTER ENVIRONMENT - GPT IMAGE 2\n" + output.masterEnvironment.gptImage2Prompt,
    ...output.shots.map((shot) => "SHOT " + shot.id + " - " + shot.name.toUpperCase() + " - GPT IMAGE 2\n" + shot.gptImage2Prompt),
  ].join("\n\n---\n\n");
}
