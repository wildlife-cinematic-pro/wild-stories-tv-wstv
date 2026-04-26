import { getDurationLaneConfig } from "@/lib/duration-lanes";
import {
  finalizeGenerationText,
  sanitizeRunwayPrompt,
  sanitizeVideoBeatText,
  validateEngineConstraints,
  validateKlingPromptLength,
} from "@/lib/prompt-builders";

import type { Arc, GeneratedPackage, StructuredPrompt, Weather } from "@/types";

export type PromptGuidanceBlock = {
  label: string;
  engine: string;
  reason: string;
  prompt: string;
};

export type PromptTimelineSegment = {
  window: "0–2s" | "2–4s" | "4–6s";
  label: "setup" | "action" | "reaction";
  text: string;
};

export type PromptTimelineShot = {
  title: string;
  engine: string;
  generationDurationLabel: string;
  editTimelineLabel: string;
  segments: PromptTimelineSegment[];
};

export type PromptClarityWarning = {
  id:
    | "multiple-actions"
    | "unclear-subject"
    | "unrealistic-behavior"
    | "kling-too-long"
    | "excessive-adjectives"
    | "conflicting-camera"
    | "engine-compliance";
  severity: "warning" | "danger";
  title: string;
  detail: string;
  fix: string;
};

export type PromptClarityScores = {
  pasteReadinessScore: number;
  subjectClarityScore: number;
  animalRealismScore: number;
  motionFeasibilityScore: number;
  engineComplianceScore: number;
  viralHookStrength: number;
};

export type PromptClarityReport = {
  simplePrompt: PromptGuidanceBlock;
  primaryPrompt: PromptGuidanceBlock;
  cinematicPrompt: PromptGuidanceBlock;
  timelineMode: PromptTimelineShot[];
  scores: PromptClarityScores;
  warnings: PromptClarityWarning[];
  summary: string;
};

const LIGHTING_BY_WEATHER: Record<Weather, string> = {
  "Golden Hour": "golden-hour rim light",
  Storm: "storm-dark overcast light",
  Overcast: "soft overcast light",
  Dawn: "cold dawn light",
  "Midday Heat": "hard midday light",
  "Winter Blizzard": "whiteout winter light",
  "Frozen Dusk": "frozen dusk rim light",
};

const STRONG_ACTION_RE = /\b(stalk(?:ing)?|close(?:s|d)? distance|surge(?:s|d)?|press(?:es|ed)?|brace(?:s|d)?|retreat(?:s|ed)?|pivot(?:s|ed)?|charge(?:s|d)?|lunge(?:s|d)?|break(?:s|ing)? away|clash(?:es|ed)?|advance(?:s|d)?)\b/gi;
const EXCESSIVE_ADJECTIVE_RE = /\b(epic|majestic|incredible|unbelievable|hyper-detailed|ultra-detailed|stunning|gorgeous|dramatic|cinematic|ferocious|massive|intense|legendary|brutal|beautiful|powerful)\b/gi;
const UNREALISTIC_BEHAVIOR_RE = /\b(smile(?:s|d|ing)?|grin(?:s|ned|ning)?|wink(?:s|ed|ing)?|dance(?:s|d|ing)?|pose(?:s|d|ing)?|handshake|laugh(?:s|ed|ing)?|celebrate(?:s|d|ing)?|high-five|kiss(?:es|ed|ing)?)\b/i;
const CAMERA_PUSH_RE = /\b(push(?:es|ed)? in|dolly push|slow push-in|push-in)\b/i;
const CAMERA_PULL_RE = /\b(pull(?:s|ed)? back|slow pull-back|pull-back|zoom out)\b/i;
const CAMERA_STATIC_RE = /\b(static|locked-off|locked wide|camera holds)\b/i;
const CAMERA_TRACK_RE = /\b(track(?:ing)?|orbit(?:ing)?|sweep(?:ing)?|pan(?:ning)?|handheld)\b/i;

function safeText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map(String).join(" ").trim();
  return String(value ?? "").trim();
}

function normalizePromptText(input: string): string {
  return finalizeGenerationText(String(input ?? "").replace(/\s+/g, " ").trim());
}

function countMatches(regex: RegExp, text: string): number {
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

function dedupePromptClauses(input: string): string {
  const compact = normalizePromptText(input);
  if (!compact) return "";

  const clauses = compact
    .split(/,\s+/)
    .map((clause) => clause.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const unique: string[] = [];

  for (const clause of clauses) {
    const key = clause.toLowerCase().replace(/[.!?]+$/g, "");
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(clause);
  }

  return normalizePromptText(unique.join(", "));
}

function cleanCreatorPrompt(input: string, engine?: string): string {
  const deduped = dedupePromptClauses(input);
  if (engine === "runway") {
    return sanitizeRunwayPrompt(sanitizeVideoBeatText(deduped));
  }
  return deduped;
}

function getStructuredPrompt(
  prompt: StructuredPrompt | undefined,
  fallback: string
): StructuredPrompt {
  return (
    prompt ?? {
      fullText: fallback,
      pasteReady: fallback,
    }
  );
}

function getSimpleEnvironment(pkg: GeneratedPackage): string {
  const direct = safeText(pkg.environmentName);
  if (direct) return direct;

  const sceneLead = safeText(pkg.sceneDesc).split(/[,.]/)[0]?.trim();
  if (sceneLead) return sceneLead;

  return "wildlife habitat";
}

function getSimpleAction(arc: Arc | undefined, predator: string, prey: string): string {
  switch (arc) {
    case "Ambush attack":
      return `${predator} closing distance on ${prey}`;
    case "Chase and takedown":
      return `${predator} driving one clean chase line toward ${prey}`;
    case "Escape from danger":
      return `${prey} breaking away from ${predator}`;
    case "Territory dominance battle":
      return `${predator} testing ${prey}'s held ground`;
    case "Pack hunting strategy":
      return `${predator} pack compressing the spacing around ${prey}`;
    case "Defender stands ground":
      return `${prey} holding ground against ${predator}`;
    case "Giant vs giant clash":
      return `${predator} and ${prey} closing into one readable clash`;
    case "Predator vs predator fight":
      return `${predator} pressing ${prey} inside one committed standoff`;
    default:
      return `${predator} pressuring ${prey}`;
  }
}

function buildSimplePrompt(pkg: GeneratedPackage): string {
  const predator = safeText(pkg.predatorName || "Predator");
  const prey = safeText(pkg.preyName || "Prey");
  const environment = getSimpleEnvironment(pkg);
  const weather = pkg.weatherName ?? "Golden Hour";
  const lighting = LIGHTING_BY_WEATHER[weather] ?? "cinematic natural light";
  return normalizePromptText(
    `${getSimpleAction(pkg.arcName, predator, prey)} in ${environment}, ${lighting}, cinematic wildlife realism.`
  );
}

function isSubjectUnclear(text: string, pkg: GeneratedPackage): boolean {
  const lower = text.toLowerCase();
  const predator = safeText(pkg.predatorName).toLowerCase();
  const prey = safeText(pkg.preyName).toLowerCase();
  const hasPredator = predator.length > 0 && lower.includes(predator);
  const hasPrey = prey.length > 0 && lower.includes(prey);
  const genericOnly = /\b(animal|creature|beast|subject)\b/i.test(text);

  if (!hasPredator && !hasPrey) return true;
  return genericOnly && (!hasPredator || !hasPrey);
}

function hasMultipleActions(text: string): boolean {
  return countMatches(STRONG_ACTION_RE, text) >= 4 && /\b(then|while|before|after|as)\b/i.test(text);
}

function hasConflictingCameraInstructions(text: string): boolean {
  return (
    (CAMERA_PUSH_RE.test(text) && CAMERA_PULL_RE.test(text)) ||
    (CAMERA_STATIC_RE.test(text) && CAMERA_TRACK_RE.test(text))
  );
}

function hasExcessiveAdjectives(text: string): boolean {
  return countMatches(EXCESSIVE_ADJECTIVE_RE, text) >= 8;
}

function hasUnrealisticBehavior(text: string): boolean {
  return UNREALISTIC_BEHAVIOR_RE.test(text);
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function pushWarning(
  warnings: PromptClarityWarning[],
  warning: PromptClarityWarning
) {
  if (!warnings.some((item) => item.id === warning.id && item.title === warning.title)) {
    warnings.push(warning);
  }
}

function getPressureBeat(arc: Arc | undefined, predator: string, prey: string): string {
  switch (arc) {
    case "Escape from danger":
      return `${prey} commits one breakaway move while ${predator} stays locked on the line.`;
    case "Defender stands ground":
      return `${prey} answers with one planted hold while ${predator} tests the distance.`;
    case "Pack hunting strategy":
      return `${predator} pack tightens the spacing in one coordinated pressure move on ${prey}.`;
    case "Giant vs giant clash":
      return `${predator} leans into one heavy-body push as ${prey} stays readable.`;
    default:
      return `${predator} commits one clear forward pressure move toward ${prey}.`;
  }
}

function getPayoffBeat(arc: Arc | undefined, predator: string, prey: string): string {
  switch (arc) {
    case "Escape from danger":
      return `${prey} makes one decisive escape turn and opens the gap.`;
    case "Territory dominance battle":
      return `${predator} lands one clear dominance beat while ${prey} gives or holds ground.`;
    case "Giant vs giant clash":
      return `${predator} and ${prey} land one readable clash beat, then separate cleanly.`;
    default:
      return `${predator} lands one readable action beat and ${prey} answers once.`;
  }
}

function getReactionBeat(arc: Arc | undefined, predator: string, prey: string): string {
  switch (arc) {
    case "Escape from danger":
      return `${predator} resets pursuit pressure while ${prey} keeps the new lane.`;
    case "Defender stands ground":
      return `${prey} holds the defended space while ${predator} settles one step back.`;
    default:
      return `${prey} settles into one readable reaction while ${predator} holds or releases pressure.`;
  }
}

function buildTimelineMode(pkg: GeneratedPackage): PromptTimelineShot[] {
  const predator = safeText(pkg.predatorName || "Predator");
  const prey = safeText(pkg.preyName || "Prey");
  const lane = getDurationLaneConfig(
    pkg.durationLane ?? (pkg.pipelineStyle === "long-hybrid-4-shot" ? "long" : "short")
  );

  return (pkg.shotPlan ?? []).slice(0, 4).map((shot, index) => ({
    title: safeText(shot.title) || `Shot ${index + 1}`,
    engine:
      shot.engine === "RUNWAY"
        ? `${safeText(pkg.modelsUsed?.runway) || "Runway"}`
        : `${safeText(pkg.modelsUsed?.kling) || "Kling"}`,
    generationDurationLabel:
      safeText(shot.generationDurationLabel) ||
      `Generation duration: ${lane.shots[index]?.generationSeconds ?? 5}s`,
    editTimelineLabel:
      safeText(shot.editTimelineLabel) ||
      `Edit timeline: ${lane.shots[index]?.editTimeline ?? "0–5s"}`,
    segments: [
      {
        window: "0–2s",
        label: "setup",
        text:
          index === 0
            ? `${predator} and ${prey} stay fully readable while the camera establishes the spacing.`
            : `Carry forward the last frame cleanly and re-establish the new spacing without adding a second action.`,
      },
      {
        window: "2–4s",
        label: "action",
        text:
          index <= 1
            ? getPressureBeat(pkg.arcName, predator, prey)
            : getPayoffBeat(pkg.arcName, predator, prey),
      },
      {
        window: "4–6s",
        label: "reaction",
        text:
          index === 3
            ? `${getReactionBeat(pkg.arcName, predator, prey)} Let the final frame settle cleanly for the resolve.`
            : `${getReactionBeat(pkg.arcName, predator, prey)} End on one clear reaction state before the next shot handoff.`,
      },
    ],
  }));
}

export function buildPromptClarityReport(pkg: GeneratedPackage): PromptClarityReport {
  const imagePrompt = getStructuredPrompt(
    pkg.structuredPrompts?.imagePrompt,
    safeText(pkg.imagePrompt)
  );
  const workflowShot1 = getStructuredPrompt(
    pkg.structuredPrompts?.workflowShots?.[0],
    safeText(pkg.shotPlan?.[0]?.prompt)
  );
  const workflowShots = pkg.structuredPrompts?.workflowShots ?? [];
  const workflowPromptTexts = workflowShots
    .map((shot) => cleanCreatorPrompt(shot.pasteReady, shot.metadata?.engine))
    .filter(Boolean);

  const simplePromptText = buildSimplePrompt(pkg);
  const primaryPromptText = cleanCreatorPrompt(imagePrompt.pasteReady, "image");
  const cinematicPromptText = cleanCreatorPrompt(
    workflowShot1.pasteReady,
    workflowShot1.metadata?.engine
  );
  const workflowPromptText = workflowPromptTexts.join(" ");
  const subjectUnclear = isSubjectUnclear(primaryPromptText, pkg);
  const multipleActions = hasMultipleActions(
    `${cinematicPromptText} ${workflowPromptText}`.trim()
  );
  const unrealisticBehavior = hasUnrealisticBehavior(
    `${primaryPromptText} ${cinematicPromptText} ${workflowPromptText}`.trim()
  );
  const excessiveAdjectives = hasExcessiveAdjectives(
    `${primaryPromptText} ${workflowPromptText}`.trim()
  );
  const conflictingCamera = hasConflictingCameraInstructions(
    `${cinematicPromptText} ${workflowPromptText}`.trim()
  );

  const simplePrompt: PromptGuidanceBlock = {
    label: "SIMPLE PROMPT (Fast copy)",
    engine: "Universal concept structure",
    reason:
      "Fast one-line subject/action/environment/light/style version for instant concept testing.",
    prompt: simplePromptText,
  };

  const primaryPrompt: PromptGuidanceBlock = {
    label: "PRIMARY PROMPT (Paste this first)",
    engine: "Image master still (NB2)",
    reason:
      "Paste this first to lock subject identity, scene spacing, and lighting before the video route starts.",
    prompt: primaryPromptText,
  };

  const cinematicPrompt: PromptGuidanceBlock = {
    label: "CINEMATIC PROMPT (Advanced control)",
    engine: `${safeText(pkg.modelsUsed?.runway) || "Runway"} Shot 1`,
    reason:
      "Advanced motion-led control for the first hybrid video shot once the master still is ready.",
    prompt: cinematicPromptText,
  };

  const warnings: PromptClarityWarning[] = [];

  if (subjectUnclear) {
    pushWarning(warnings, {
      id: "unclear-subject",
      severity: "danger",
      title: "Subject clarity is too soft",
      detail: "The main copy path does not clearly anchor the predator and prey names.",
      fix: "Name the animals directly and keep one dominant subject relationship in the first line.",
    });
  }

  if (multipleActions) {
    pushWarning(warnings, {
      id: "multiple-actions",
      severity: "warning",
      title: "Multiple actions are competing in the video route",
      detail: "At least one copyable video prompt is trying to do too much in one shot instead of landing one dominant beat.",
      fix: "Keep one primary action, then push secondary motion into the timeline beat guide instead of the main prompt body.",
    });
  }

  if (unrealisticBehavior) {
    pushWarning(warnings, {
      id: "unrealistic-behavior",
      severity: "danger",
      title: "Animal behavior reads as unrealistic",
      detail: "The current prompt wording includes anthropomorphic or non-documentary behavior cues.",
      fix: "Replace human-style emotion or gestures with posture, spacing, pressure, brace, turn, or breakaway language.",
    });
  }

  if (excessiveAdjectives) {
    pushWarning(warnings, {
      id: "excessive-adjectives",
      severity: "warning",
      title: "Prompt density is getting adjective-heavy",
      detail: "Too many descriptive modifiers can bury the actual action and make paste decisions slower.",
      fix: "Trim decorative adjectives first and keep the core order: subject, action, environment, lighting, style.",
    });
  }

  if (conflictingCamera) {
    pushWarning(warnings, {
      id: "conflicting-camera",
      severity: "danger",
      title: "Camera instructions conflict",
      detail: "At least one copyable video prompt mixes camera directions that pull the shot in opposite ways.",
      fix: "Choose one camera move for the main beat: hold, push, pull-back, track, or orbit — not conflicting combinations.",
    });
  }

  for (const shot of workflowShots.filter((item) => item.metadata?.engine === "kling")) {
    const klingLength = validateKlingPromptLength(shot.pasteReady);
    if (klingLength.isOver) {
      pushWarning(warnings, {
        id: "kling-too-long",
        severity: "danger",
        title: "Kling paste block is too long",
        detail: klingLength.warning ?? "Kling prompt length is over the working limit.",
        fix: "Keep Kling to one clear action, one camera move, and only the details that affect visible motion.",
      });
    }
  }

  const engineConstraintWarnings = (pkg.shotPlan ?? []).flatMap((shot, index) => {
    const metadata = workflowShots[index]?.metadata;
    const duration = metadata?.durationSeconds;
    return validateEngineConstraints({
      engine: shot.engine === "RUNWAY" ? "runway" : "kling",
      duration,
      hasNegativePrompt: shot.engine === "KLING",
      hasAppearanceInPrompt: false,
    }).filter((warning) => warning.level !== "info");
  });

  if (engineConstraintWarnings.length > 0) {
    pushWarning(warnings, {
      id: "engine-compliance",
      severity: engineConstraintWarnings.some((warning) => warning.level === "error")
        ? "danger"
        : "warning",
      title: "Engine compliance needs review",
      detail: engineConstraintWarnings.map((warning) => warning.message).join(" "),
      fix: "Keep Kling at 5s or 10s, keep Runway inside its supported duration/fps range, and avoid invalid parameter mixes.",
    });
  }

  const dangerCount = warnings.filter((warning) => warning.severity === "danger").length;
  const warningCount = warnings.filter((warning) => warning.severity === "warning").length;
  const hasPredator = primaryPromptText.toLowerCase().includes(safeText(pkg.predatorName).toLowerCase());
  const hasPrey = primaryPromptText.toLowerCase().includes(safeText(pkg.preyName).toLowerCase());
  const engineComplianceScore = clampScore(100 - engineConstraintWarnings.length * 18 - warningCount * 2);

  const scores: PromptClarityScores = {
    pasteReadinessScore: clampScore(
      96 - dangerCount * 15 - warningCount * 7 - (primaryPromptText.length > 1100 ? 6 : 0)
    ),
    subjectClarityScore: clampScore(
      58 + (hasPredator ? 18 : 0) + (hasPrey ? 16 : 0) + (simplePromptText.length <= 160 ? 8 : 0) - (subjectUnclear ? 18 : 0)
    ),
    animalRealismScore: clampScore(
      92 - (unrealisticBehavior ? 24 : 0) - (excessiveAdjectives ? 8 : 0)
    ),
    motionFeasibilityScore: clampScore(
      92 - (multipleActions ? 16 : 0) - (conflictingCamera ? 18 : 0)
    ),
    engineComplianceScore,
    viralHookStrength: clampScore(
      (pkg.openingFrameScore?.total ?? 70) * 0.7 +
        (pkg.usAudienceScore?.total ?? 70) * 0.3 +
        (pkg.hookFamily === "danger" ? 6 : pkg.hookFamily === "reversal" ? 5 : 4)
    ),
  };

  return {
    simplePrompt,
    primaryPrompt,
    cinematicPrompt,
    timelineMode: buildTimelineMode(pkg),
    scores,
    warnings,
    summary:
      warnings.length === 0
        ? "Copy path is clear: use the simple prompt for fast concepting, the primary prompt first, then the cinematic prompt for deeper motion control."
        : `Prompt QA flagged ${warnings.length} item(s). Start with the primary prompt, then resolve the warnings before heavy generation spend.`,
  };
}
