import type { Arc } from "@/types";

export type RunwayMotionFirstInput = {
  predatorName: string;
  preyName: string;
  environmentName: string;
  arcName: Arc;
  shotRole: "opening" | "pressure" | "peak" | "resolve";
  durationSeconds?: 5 | 10;
  cameraMove?: string;
  sceneDesc?: string;
  safetyMode?: "clean" | "standard";
};

type ShotRole = RunwayMotionFirstInput["shotRole"];

const DEFAULT_CAMERA_MOVE: Record<ShotRole, string> = {
  opening: "Slow documentary push-in.",
  pressure: "Measured forward drift.",
  peak: "Restrained tracking move.",
  resolve: "Slow pull-back.",
};

const SHOT_ROLE_TIMING: Record<ShotRole, string> = {
  opening: "Immediate readable setup.",
  pressure: "Pressure rises in one clear beat.",
  peak: "One committed burst of action.",
  resolve: "Let the motion settle without adding a new action.",
};

const ARC_ACTIONS: Record<Arc, Record<ShotRole, string>> = {
  "Ambush attack": {
    opening:
      "The prey stays tense at the edge while the predator holds hidden pressure once.",
    pressure:
      "The predator edges forward once and the prey makes one late defensive read.",
    peak:
      "The predator surges once from cover and the prey recoils into one escape line.",
    resolve:
      "The predator holds low while the prey keeps one unresolved escape lane.",
  },
  "Predator vs predator fight": {
    opening:
      "Both animals hold a tense distance line and shift weight once without closing fully.",
    pressure:
      "One animal presses forward once while the other braces into one clear counter-line.",
    peak:
      "Both animals commit to one readable clash beat with stable body mechanics.",
    resolve:
      "Both animals reset spacing once while the standoff stays unresolved.",
  },
  "Chase and takedown": {
    opening:
      "The prey checks one escape lane while the predator loads into one chase start.",
    pressure:
      "The predator drives one faster chase beat and the prey cuts into one escape line.",
    peak:
      "The predator commits one acceleration burst while the prey fights for one clear lane.",
    resolve:
      "The chase compresses once and ends on unresolved pursuit pressure.",
  },
  "Escape from danger": {
    opening:
      "The prey notices danger and sets one escape line while the predator holds pressure.",
    pressure:
      "The prey breaks into one escape move while the predator closes distance once.",
    peak:
      "The prey commits to one hard evasive move while the predator bursts once behind it.",
    resolve:
      "The prey keeps one narrow escape margin while the danger remains unresolved.",
  },
  "Territory dominance battle": {
    opening:
      "Both animals hold the claim line and make one grounded weight shift each.",
    pressure:
      "One animal steps forward once while the other answers with one planted brace.",
    peak:
      "Both animals drive one readable force exchange without chaotic overlap.",
    resolve:
      "The standoff settles once with the claim line still contested.",
  },
  "Pack hunting strategy": {
    opening:
      "The pack shapes one closing lane while the prey tracks the pressure line.",
    pressure:
      "The pack compresses spacing once and the prey makes one survival adjustment.",
    peak:
      "The pack hits one coordinated burst while the prey fights for one escape lane.",
    resolve:
      "The pack keeps the lane tight while the outcome stays unresolved.",
  },
  "Defender stands ground": {
    opening:
      "The defender plants once and reads the threat while the attacker holds pressure.",
    pressure:
      "The attacker advances once and the defender answers with one grounded brace.",
    peak:
      "The defender meets one forceful pressure beat without breaking posture.",
    resolve:
      "The defender keeps the line while danger remains unresolved.",
  },
  "Giant vs giant clash": {
    opening:
      "Both animals square up once with heavy body mass readable from frame one.",
    pressure:
      "One animal leans in once and the other matches with one heavy planted answer.",
    peak:
      "Both animals commit to one massive readable clash beat with stable footing.",
    resolve:
      "Both animals settle once while the scale and tension stay intact.",
  },
};

function normalizeText(value: string): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .trim();
}

function stripImagePromptClutter(prompt: string): string {
  return normalizeText(
    prompt
      .replace(/\bnegative prompt\b\s*:\s*[^.]+\.?/gi, "")
      .replace(/\b(?:ultra|hyper)[-\s]?detailed\b/gi, "")
      .replace(/\b8k\b/gi, "")
      .replace(/\bCGI\b/gi, "")
      .replace(/\bhyperreal(?:istic)?\b/gi, "")
      .replace(/\baward-winning\b/gi, "")
      .replace(/\bmasterpiece\b/gi, "")
      .replace(/\bextremely\b/gi, "")
      .replace(/\s{2,}/g, " ")
  );
}

function getSceneCue(sceneDesc?: string): string {
  const scene = normalizeText(sceneDesc ?? "");
  if (!scene) return "";

  const firstSentence = scene.split(/[.!?]/)[0]?.trim() ?? "";
  if (!firstSentence) return "";

  return `Scene continuity: ${firstSentence}.`;
}

function getSafetyLine(mode: RunwayMotionFirstInput["safetyMode"]): string {
  if (mode === "standard") {
    return "Keep full-body readability, grounded contact, stable anatomy, no blood, and no visible wounds.";
  }

  return "Keep full-body readability, grounded contact, no contact, no blood, no gore, and no visible wounds.";
}

function hasConflictingCameraMoves(text: string): boolean {
  const normalized = text.toLowerCase();
  const groups = [
    /\bpush(?:-in| in)?\b|\bdolly in\b/.test(normalized),
    /\bpull(?:-back| back)?\b|\bzoom out\b/.test(normalized),
    /\bpan\b|\borbit\b|\bsweep\b/.test(normalized),
    /\btrack(?:ing)?\b|\bdrift\b/.test(normalized),
  ].filter(Boolean).length;

  return groups > 2;
}

export function makeRunwaySafePrompt(prompt: string): string {
  const cleaned = stripImagePromptClutter(prompt)
    .replace(/\bno negative prompt\b/gi, "")
    .replace(/\bnegative prompt\b/gi, "")
    .replace(/\bphotorealistic wildlife documentary master reference image\b/gi, "")
    .replace(/\b9:16 vertical\b/gi, "")
    .replace(/\bsubject-ready\b/gi, "readable")
    .replace(/\bfull body visible\b/gi, "full bodies stay readable")
    .replace(/\bno blood,\s*no gore,\s*no visible wounds\b/gi, "no gore or visible wounds")
    .replace(/\s{2,}/g, " ");

  return normalizeText(cleaned);
}

export function buildRunwayMotionFirstPrompt(
  input: RunwayMotionFirstInput
): string {
  const cameraMove = normalizeText(
    input.cameraMove?.trim() || DEFAULT_CAMERA_MOVE[input.shotRole]
  );
  const action =
    ARC_ACTIONS[input.arcName]?.[input.shotRole] ??
    ARC_ACTIONS["Ambush attack"][input.shotRole];
  const sceneCue = getSceneCue(input.sceneDesc);
  const safety = getSafetyLine(input.safetyMode);
  const durationCue = input.durationSeconds
    ? `Playable as a ${input.durationSeconds}-second beat.`
    : "";

  const prompt = [
    `Image-to-video from the same source image.`,
    `Preserve the same ${input.predatorName} and ${input.preyName}, same terrain, lighting, spacing, and first-frame identity.`,
    cameraMove,
    action,
    `Micro-motion: light habitat movement in ${input.environmentName}.`,
    `Continuity: preserve the same source image identity, terrain, lighting, and spacing.`,
    SHOT_ROLE_TIMING[input.shotRole],
    sceneCue,
    durationCue,
    safety,
  ]
    .filter(Boolean)
    .join(" ");

  return makeRunwaySafePrompt(prompt);
}

export function validateRunwayMotionFirstPrompt(prompt: string): {
  passed: boolean;
  warnings: string[];
  score: number;
} {
  const text = normalizeText(prompt);
  const lower = text.toLowerCase();
  const warnings: string[] = [];
  let score = 100;

  if (!/\bimage-to-video\b|\bsource image\b/.test(lower)) {
    warnings.push("Missing image-to-video continuity cue.");
    score -= 20;
  }

  if (!/\bpush(?:-in| in)?\b|\bpull(?:-back| back)?\b|\bdrift\b|\btrack(?:ing)?\b|\bpan\b|\borbit\b|\bsweep\b|\bhandheld\b|\bcamera\b/.test(lower)) {
    warnings.push("Missing camera motion cue.");
    score -= 20;
  }

  if (!/\blowers\b|\bshifts\b|\bsteps\b|\bholds\b|\bsurges\b|\brecoils\b|\bbraces\b|\bbreaks\b|\bglides\b|\bpresses\b|\bplants\b|\bcompresses\b|\bdrives\b|\bchecks\b|\bnotices\b|\bcommits\b|\breacts\b|\banswers\b|\bloads\b/.test(lower)) {
    warnings.push("Missing readable subject motion.");
    score -= 20;
  }

  if (!/\bpreserve\b.*\bsame\b|\bcontinuity\b/.test(lower)) {
    warnings.push("Missing continuity language.");
    score -= 15;
  }

  if (/\bnegative prompt\b/.test(lower)) {
    warnings.push("Runway prompt still contains negative-prompt wording.");
    score -= 20;
  }

  if (/\bgory\b|\bbleeding\b|\bgraphic injury\b|\btorn flesh\b|\bdismember/i.test(lower)) {
    warnings.push("Prompt includes disallowed gore language.");
    score -= 25;
  }

  if (text.length > 500) {
    warnings.push("Prompt is longer than the recommended Runway motion-first range.");
    score -= 10;
  }

  if (hasConflictingCameraMoves(text)) {
    warnings.push("Prompt mixes too many camera moves.");
    score -= 15;
  }

  const blockingWarnings = warnings.filter((warning) =>
    /image-to-video|camera motion cue|readable subject motion|continuity language|negative-prompt wording|disallowed gore/.test(
      warning
    )
  );

  return {
    passed: blockingWarnings.length === 0 && score >= 75,
    warnings,
    score: Math.max(0, score),
  };
}
