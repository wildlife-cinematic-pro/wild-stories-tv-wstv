import type { AnimalVibe, Arc, Weather } from "@/types";

export type EnginePromptMode = "runway-safe" | "kling-action" | "universal";

export type PromptHealthInput = {
  prompt: string;
  predatorName?: string;
  preyName?: string;
  arc?: Arc;
  weather?: Weather;
  animalVibe?: AnimalVibe;
};

export type PromptHealthReport = {
  score: number;
  label: "Strong" | "Good" | "Needs Review" | "Risky";
  severity: "success" | "info" | "warning" | "danger";
  issues: string[];
  fixes: string[];
  detectedRisks: string[];
  recommendedMode: EnginePromptMode;
};

export type EnginePromptRecommendation = {
  mode: EnginePromptMode;
  title: string;
  summary: string;
  prompt: string;
  reasons: string[];
};

const NEGATIVE_PHRASE_REGEX =
  /\b(?:no\s|without\s|avoid\s|do not\s|don't\s|never\s)/gi;
const MULTI_SHOT_REGEX =
  /\b(?:shot\s*\d+|0\s*-\s*3s|3\s*-\s*6s|6\s*-\s*10s|10\s*-\s*13s|13\s*-\s*15s|cut to)\b/gi;
const LOCKED_CAMERA_REGEX = /\blocked camera\b/i;
const DYNAMIC_CAMERA_REGEX =
  /\b(?:handheld|dolly|push-?in|push in|pull-?back|track(?:ing)?|pan|whip pan|zoom|crane)\b/i;
const CAMERA_CUE_REGEX =
  /\b(?:camera|handheld|dolly|push-?in|push in|pull-?back|track(?:ing)?|pan|zoom|crane|static shot|locked camera|slow push)\b/i;
const SUBJECT_MOTION_REGEX =
  /\b(?:lunges?|surges?|charges?|runs?|sprints?|turns?|recoils?|pulls?|dives?|circles?|shifts?|lowers?|steps?|reacts?|bursts?|drives?|stalks?|glides?)\b/i;
const STRONG_ACTION_REGEX =
  /\b(?:ambush|lunge|surge|burst|charge|escape|chase|pressure|cliffhanger|near-clash|defender)\b/i;

function cleanWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function splitSentenceBeats(prompt: string): string[] {
  return cleanWhitespace(prompt)
    .split(/[.!?;]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle.trim()) return 0;

  const normalizedNeedle = needle.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = haystack.match(new RegExp(`\\b${normalizedNeedle}\\b`, "gi"));

  return matches?.length ?? 0;
}

function getLabel(score: number): PromptHealthReport["label"] {
  if (score >= 85) return "Strong";
  if (score >= 70) return "Good";
  if (score >= 55) return "Needs Review";
  return "Risky";
}

function getSeverity(score: number): PromptHealthReport["severity"] {
  if (score >= 85) return "success";
  if (score >= 70) return "info";
  if (score >= 55) return "warning";
  return "danger";
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}

function removeNegativePhrases(prompt: string): string {
  return cleanWhitespace(
    prompt
      .replace(/\b(?:no|without|avoid|do not|don't|never)\b[^,.!;]*/gi, "")
      .replace(/\s+,/g, ",")
      .replace(/,+/g, ",")
      .replace(/\s{2,}/g, " ")
  );
}

function removeMultiShotTerms(prompt: string): string {
  return cleanWhitespace(
    prompt
      .replace(MULTI_SHOT_REGEX, "")
      .replace(/\b(?:then|next|after that|meanwhile)\b/gi, "")
      .replace(/\s+,/g, ",")
      .replace(/,+/g, ",")
  );
}

function getRecommendedMode(
  prompt: string,
  risks: string[],
  beatCount: number
): EnginePromptMode {
  const lowerPrompt = prompt.toLowerCase();
  const hasMultiShot = risks.includes("multi-shot overload");
  const hasNegativeWording = risks.includes("negative wording");
  const hasStrongAction = STRONG_ACTION_REGEX.test(lowerPrompt);

  if (!hasMultiShot && !hasNegativeWording && beatCount <= 2 && prompt.length <= 220) {
    return "runway-safe";
  }

  if (hasMultiShot || hasStrongAction) {
    return "kling-action";
  }

  return "universal";
}

export function analyzePromptHealth(
  input: PromptHealthInput
): PromptHealthReport {
  const prompt = cleanWhitespace(input.prompt);
  const lowerPrompt = prompt.toLowerCase();
  const issues: string[] = [];
  const fixes: string[] = [];
  const detectedRisks: string[] = [];
  const beats = splitSentenceBeats(prompt);
  const negativeMatches = prompt.match(NEGATIVE_PHRASE_REGEX) ?? [];
  const hasMultiShotOverload = MULTI_SHOT_REGEX.test(lowerPrompt);
  const hasContradictoryCamera =
    LOCKED_CAMERA_REGEX.test(lowerPrompt) && DYNAMIC_CAMERA_REGEX.test(lowerPrompt);
  const predatorMentions = countOccurrences(lowerPrompt, input.predatorName ?? "");
  const preyMentions = countOccurrences(lowerPrompt, input.preyName ?? "");
  let score = 90;

  if (prompt.length > 420) {
    score -= 24;
    detectedRisks.push("prompt too long");
    issues.push("Prompt is too long for a clean first-pass video instruction.");
    fixes.push("Trim to one shot with one clear action beat.");
  } else if (prompt.length > 260) {
    score -= 12;
    detectedRisks.push("prompt too long");
    issues.push("Prompt is getting long for fast engine parsing.");
    fixes.push("Tighten the wording and keep only the most useful motion details.");
  }

  if (beats.length > 5) {
    score -= 18;
    detectedRisks.push("too many sentence beats");
    issues.push("There are too many separate beats competing in one prompt.");
    fixes.push("Collapse the idea into one scene with one primary action.");
  } else if (beats.length > 3) {
    score -= 10;
    detectedRisks.push("too many sentence beats");
    issues.push("The prompt has more beats than a simple engine pass usually needs.");
    fixes.push("Use fewer beats and keep the pacing cleaner.");
  }

  if (negativeMatches.length > 0) {
    score -= 12;
    detectedRisks.push("negative wording");
    issues.push("Negative wording is making the prompt less direct.");
    fixes.push("Prefer positive motion instructions and move hard negatives to separate safety fields.");
  }

  if (hasMultiShotOverload) {
    score -= 18;
    detectedRisks.push("multi-shot overload");
    issues.push("This reads like a multi-shot script instead of a single video prompt.");
    fixes.push("Keep one shot only for Runway-safe prompting, or route the idea to Kling action mode.");
  }

  if (hasContradictoryCamera) {
    score -= 15;
    detectedRisks.push("contradictory camera");
    issues.push("Camera instructions are pulling in opposite directions.");
    fixes.push("Pick one camera behavior: locked, handheld, or one clean move.");
  }

  if (!CAMERA_CUE_REGEX.test(lowerPrompt)) {
    score -= 8;
    detectedRisks.push("missing camera motion");
    issues.push("The prompt is missing a clear camera cue.");
    fixes.push("Add one camera instruction like slow push-in, handheld, or locked frame.");
  }

  if (!SUBJECT_MOTION_REGEX.test(lowerPrompt)) {
    score -= 10;
    detectedRisks.push("missing subject motion");
    issues.push("The subject action is too static or unclear.");
    fixes.push("Name one clean action for the animal pair.");
  }

  if (predatorMentions >= 3 || preyMentions >= 3) {
    score -= 6;
    detectedRisks.push("excessive identity restatement");
    issues.push("Animal identity is being repeated more than needed.");
    fixes.push("Name each subject once, then focus on motion and spacing.");
  }

  if (
    prompt.length <= 220 &&
    beats.length <= 2 &&
    negativeMatches.length === 0 &&
    CAMERA_CUE_REGEX.test(lowerPrompt) &&
    SUBJECT_MOTION_REGEX.test(lowerPrompt)
  ) {
    score += 4;
  }

  const recommendedMode = getRecommendedMode(prompt, detectedRisks, beats.length);
  const finalScore = clampScore(score);

  if (issues.length === 0) {
    issues.push("Prompt structure looks clean for a first-pass engine test.");
    fixes.push("Keep the prompt compact and validate motion readability with one render.");
  }

  return {
    score: finalScore,
    label: getLabel(finalScore),
    severity: getSeverity(finalScore),
    issues,
    fixes,
    detectedRisks,
    recommendedMode,
  };
}

export function buildEnginePromptRecommendation(
  input: PromptHealthInput & { mode?: EnginePromptMode }
): EnginePromptRecommendation {
  const report = analyzePromptHealth(input);
  const mode = input.mode ?? report.recommendedMode;
  const cleanedPrompt = removeMultiShotTerms(removeNegativePhrases(input.prompt));
  const predator = input.predatorName ?? "lead animal";
  const prey = input.preyName ?? "opposing animal";
  const summary =
    mode === "runway-safe"
      ? "One-shot motion-first wording for cleaner Runway parsing."
      : mode === "kling-action"
        ? "Action-forward wording that keeps the movement readable."
        : "Balanced wording for teams using both Runway and Kling.";

  if (mode === "runway-safe") {
    return {
      mode,
      title: "Runway-safe optimizer",
      summary,
      prompt: cleanWhitespace(
        `Image-to-video from the same source image. Slow documentary push-in as ${predator} makes one clear move and ${prey} reacts once. Keep full bodies readable, preserve the same terrain and spacing, and let light habitat motion carry the frame. Cinematic wildlife documentary realism.`
      ),
      reasons: [
        "Cuts multi-shot wording down to one readable motion beat.",
        "Keeps camera motion, subject motion, and scene motion simple.",
        "Avoids negative-prompt phrasing inside the main video instruction.",
      ],
    };
  }

  if (mode === "kling-action") {
    return {
      mode,
      title: "Kling-action optimizer",
      summary,
      prompt: cleanWhitespace(
        `${predator} drives the action lane with one strong readable burst while ${prey} reacts under pressure. Use a clear forward camera move, preserve subject separation, keep body mass and footing stable, and let the habitat motion reinforce the clash. Dangerous but realistic wildlife documentary energy.`
      ),
      reasons: [
        "Allows stronger action language without turning into a full shot list.",
        "Keeps subject separation and readable motion at the center.",
        "Works well when the scene needs more urgency than a Runway-safe prompt.",
      ],
    };
  }

  return {
    mode,
    title: "Universal optimizer",
    summary,
    prompt: cleanWhitespace(
      `${cleanedPrompt || `${predator} moves once and ${prey} reacts once.`} Preserve clear subject spacing, grounded contact, one clean camera move, and simple habitat motion in a cinematic wildlife documentary frame.`
    ),
    reasons: [
      "Balances direct motion language for mixed-engine workflows.",
      "Removes the noisiest negative and multi-shot phrasing first.",
      "Stays close to the user's scene idea without silently rewriting generation behavior.",
    ],
  };
}
