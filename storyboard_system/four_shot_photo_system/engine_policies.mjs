import {
  ANIMAL_REALISM_RULES,
  ENVIRONMENT_LOCK_RULES,
  NEGATIVE_REALISM_RULES,
  PHYSICAL_INTEGRATION_RULES,
  compactRuleSentence
} from "./realism_rules.mjs";

export const ENGINE_POLICIES = {
  nano: {
    label: "Nano Banana 2",
    extension: "nano",
    masterTone: "Clean photorealistic environment plate prompt for Nano Banana 2. Keep it direct, natural, and continuity-first.",
    shotTone: "Clean photorealistic wildlife image prompt for Nano Banana 2. Use direct composition, subject placement, and realism integration language.",
    qualityLine: "Ultra-realistic natural wildlife photography, clean documentary realism, believable ground contact, same-background continuity.",
    length: "tight"
  },
  gptimage2: {
    label: "GPT Image 2",
    extension: "gptimage2",
    masterTone: "Premium photorealistic wildlife documentary environment plate prompt for GPT Image 2 with high-end natural photography language.",
    shotTone: "Premium photorealistic wildlife documentary still for GPT Image 2 with telephoto wildlife lens feel, clean environmental depth, and natural atmospheric perspective.",
    qualityLine: "World-class wildlife photography feel, realistic fur detail, physically plausible golden-hour light, crisp subject separation, documentary realism, not stylized fantasy.",
    length: "rich"
  }
};

function environmentLock(input) {
  return [
    "Location lock: " + input.environment + ".",
    "Season lock: " + input.season + ".",
    "Lighting lock: " + input.lighting + ".",
    "Aspect ratio: " + input.aspectRatio + ".",
    "Environment plate identity: " + input.environmentPlateDescription + "."
  ].join(" ");
}

function subjectIdentityLines(input) {
  return [
    "Predator identity: " + input.predator + " - " + input.predatorIdentityNotes + ".",
    "Prey identity: " + input.prey + " - " + input.preyIdentityNotes + "."
  ].join(" ");
}

function negativeLine() {
  return "Avoid: " + compactRuleSentence(NEGATIVE_REALISM_RULES);
}

export function buildMasterEnvironmentPrompt(input, engineKey) {
  const policy = ENGINE_POLICIES[engineKey];
  if (!policy) throw new Error("Unknown engine key: " + engineKey);
  const lines = [
    policy.masterTone,
    "Create the master environment plate for " + input.project + ".",
    environmentLock(input),
    "No animals in this master plate. No people, roads, fences, buildings, vehicles, text, or watermark.",
    "Leave one clean natural action lane through the habitat where future wildlife can be integrated.",
    "Continuity requirements: " + compactRuleSentence(ENVIRONMENT_LOCK_RULES),
    "Physical realism: " + compactRuleSentence(PHYSICAL_INTEGRATION_RULES),
    policy.qualityLine,
    negativeLine()
  ];
  if (policy.length === "rich") {
    lines.push("Use clean environmental depth, natural atmospheric perspective over the ridge, believable grass/sagebrush texture, and a real-camera documentary still feeling. The plate must look naturally photographed, not generated or composited.");
  }
  return lines.join("\n");
}

export function buildShotPrompt(input, shot, engineKey) {
  const policy = ENGINE_POLICIES[engineKey];
  if (!policy) throw new Error("Unknown engine key: " + engineKey);
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
    negativeLine()
  ];
  if (policy.length === "rich") {
    lines.push("Use a high-end telephoto wildlife lens feel without fake camera gimmicks: crisp subject separation, natural depth compression, believable fur texture, grounded legs interacting with grass, and matching rim light from the same golden-hour direction. The frame should look like an elite wildlife photographer captured the moment in real natural conditions.");
  }
  return lines.join("\n");
}

