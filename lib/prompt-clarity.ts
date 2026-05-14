import { getDurationLaneConfig } from "@/lib/duration-lanes";
import {
  finalizeGenerationText,
  sanitizeRunwayPrompt,
  sanitizeVideoBeatText,
  validateEngineConstraints,
  validateKlingPromptLength,
} from "@/lib/prompt-builders";

import type {
  Arc,
  GeneratedPackage,
  StructuredPrompt,
  StructuredPromptMetadata,
  Weather,
} from "@/types";

export type PromptConfidenceLevel = "High" | "Medium" | "Risky";

type PromptCandidateSource = "image" | "runway" | "kling" | "seedance";

export type PromptGuidanceBlock = {
  label: string;
  engine: string;
  reason: string;
  prompt: string;
  confidenceLevel?: PromptConfidenceLevel;
  safeModeApplied?: boolean;
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
    | "engine-compliance"
    | "kling-single-action"
    | "runway-camera-clarity"
    | "seedance-structured-flow";
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

export type PromptDecisionRuleId =
  | PromptClarityWarning["id"];

export type PromptDecisionRule = {
  id: PromptDecisionRuleId;
  label: string;
  passed: boolean;
  severity: "warning" | "danger";
  detail: string;
  penalty: number;
};

export type PromptDecisionCandidate = {
  key: string;
  source: PromptCandidateSource;
  label: string;
  engine: string;
  reason: string;
  prompt: string;
  confidenceLevel: PromptConfidenceLevel;
  combinedDecisionScore: number;
  pasteReadinessScore: number;
  subjectClarityScore: number;
  animalRealismScore: number;
  motionFeasibilityScore: number;
  engineComplianceScore: number;
  viralHookStrength: number;
  lowScoreReasons: string[];
  failedRules: PromptDecisionRule[];
  safeModePrompt?: string;
};

export type PromptFailureRecovery = {
  reason: string;
  why: string;
  fallbackPrompt: PromptGuidanceBlock;
};

export type PromptDecisionSummary = {
  confidenceLevel: PromptConfidenceLevel;
  explanation: string;
  selectedKey: string;
  selectedEngine: string;
  safeModeApplied: boolean;
  lowScoreReasons: string[];
  failedRules: PromptDecisionRule[];
  fallback?: PromptFailureRecovery;
};

export type PromptClarityReport = {
  simplePrompt: PromptGuidanceBlock;
  primaryPrompt: PromptGuidanceBlock;
  cinematicPrompt: PromptGuidanceBlock;
  timelineMode: PromptTimelineShot[];
  scores: PromptClarityScores;
  warnings: PromptClarityWarning[];
  summary: string;
  decision: PromptDecisionSummary;
  debugCandidates: PromptDecisionCandidate[];
};

type PromptCandidateDefinition = {
  key: string;
  source: PromptCandidateSource;
  label: string;
  engine: string;
  reason: string;
  prompt: string;
  metadata?: StructuredPromptMetadata;
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

const SOURCE_PRIORITY: Record<PromptCandidateSource, number> = {
  image: 4,
  runway: 3,
  kling: 2,
  seedance: 1,
};

const STRONG_ACTION_RE = /\b(stalk(?:ing)?|close(?:s|d)? distance|surge(?:s|d)?|press(?:es|ed)?|brace(?:s|d)?|retreat(?:s|ed)?|pivot(?:s|ed)?|charge(?:s|d)?|lunge(?:s|d)?|break(?:s|ing)? away|clash(?:es|ed)?|advance(?:s|d)?)\b/gi;
const EXCESSIVE_ADJECTIVE_RE = /\b(epic|majestic|incredible|unbelievable|hyper-detailed|ultra-detailed|stunning|gorgeous|dramatic|cinematic|ferocious|massive|intense|legendary|brutal|beautiful|powerful)\b/gi;
const UNREALISTIC_BEHAVIOR_RE = /\b(smile(?:s|d|ing)?|grin(?:s|ned|ning)?|wink(?:s|ed|ing)?|dance(?:s|d|ing)?|pose(?:s|d|ing)?|handshake|laugh(?:s|ed|ing)?|celebrate(?:s|d|ing)?|high-five|kiss(?:es|ed|ing)?)\b/i;
const CAMERA_PUSH_RE = /\b(push(?:es|ed)? in|dolly push|slow push-in|push-in)\b/i;
const CAMERA_PULL_RE = /\b(pull(?:s|ed)? back|slow pull-back|pull-back|zoom out)\b/i;
const CAMERA_STATIC_RE = /\b(static|locked-off|locked wide|camera holds)\b/i;
const CAMERA_TRACK_RE = /\b(track(?:ing)?|orbit(?:ing)?|sweep(?:ing)?|pan(?:ning)?|handheld)\b/i;
const CAMERA_CLARITY_RE = /\b(camera|lens|push(?:es|ed)? in|dolly push|slow push-in|push-in|pull(?:s|ed)? back|slow pull-back|pull-back|zoom out|track(?:ing)?|orbit(?:ing)?|sweep(?:ing)?|pan(?:ning)?|handheld|locked-off|locked wide|camera holds|wide shot)\b/i;
const SEEDANCE_FLOW_RE = /(subject movement:|background movement:|camera movement:|shot\s*1|shot\s*2)/i;

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
  const hasStructuredSideLabels = /\bleft subject\b/i.test(text) && /\bright subject\b/i.test(text);

  if (hasStructuredSideLabels && (hasPredator || hasPrey)) return false;
  if (!hasPredator && !hasPrey) return true;
  return genericOnly && (!hasPredator || !hasPrey);
}

function hasMultipleActions(text: string): boolean {
  return (
    countMatches(STRONG_ACTION_RE, text) >= 4 &&
    /\b(then|while|before|after|as)\b/i.test(text)
  );
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

function hasCameraClarity(text: string): boolean {
  return CAMERA_CLARITY_RE.test(text);
}

function hasSeedanceStructuredFlow(text: string): boolean {
  return SEEDANCE_FLOW_RE.test(text);
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

function pushRule(
  rules: PromptDecisionRule[],
  rule: PromptDecisionRule
) {
  rules.push(rule);
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
            : "Carry forward the last frame cleanly and re-establish the new spacing without adding a second action.",
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

function getConfidenceLevel(
  combinedDecisionScore: number,
  failedRules: PromptDecisionRule[]
): PromptConfidenceLevel {
  const dangerCount = failedRules.filter((rule) => rule.severity === "danger").length;
  const warningCount = failedRules.filter((rule) => rule.severity === "warning").length;

  if (dangerCount >= 1) return "Risky";
  if (combinedDecisionScore >= 180 && warningCount === 0) return "High";
  if (combinedDecisionScore >= 150 && warningCount <= 3) {
    return "Medium";
  }
  return "Risky";
}

function buildSafeModePrompt(
  pkg: GeneratedPackage,
  source: PromptCandidateSource
): string {
  const predator = safeText(pkg.predatorName || "Predator");
  const prey = safeText(pkg.preyName || "Prey");
  const environment = getSimpleEnvironment(pkg);
  const weather = pkg.weatherName ?? "Golden Hour";
  const lighting = LIGHTING_BY_WEATHER[weather] ?? "cinematic natural light";
  const action = getSimpleAction(pkg.arcName, predator, prey);

  if (source === "image") {
    return buildSimplePrompt(pkg);
  }

  if (source === "runway") {
    return cleanCreatorPrompt(
      `${action} in ${environment}. Camera slow push-in on one readable pressure beat. ${lighting}, cinematic wildlife realism.`,
      "runway"
    );
  }

  if (source === "kling") {
    return cleanCreatorPrompt(
      `${action} in ${environment}. One clear action only. One tracking move only. Full bodies stay readable. ${lighting}.`,
      "kling"
    );
  }

  return cleanCreatorPrompt(
    `Subject movement: ${action}. Background movement: light natural habitat response only. Camera movement: one steady tracking move. Preserve ${environment} and ${lighting}.`,
    "seedance"
  );
}

function buildCandidateWarning(rule: PromptDecisionRule): PromptClarityWarning {
  switch (rule.id) {
    case "unclear-subject":
      return {
        id: rule.id,
        severity: rule.severity,
        title: "Subject clarity is too soft",
        detail: rule.detail,
        fix: "Name the animals directly and keep one dominant subject relationship in the first line.",
      };
    case "multiple-actions":
      return {
        id: rule.id,
        severity: rule.severity,
        title: "Multiple actions are competing in one prompt",
        detail: rule.detail,
        fix: "Keep one primary action, then move secondary motion into timeline guidance instead of the main paste block.",
      };
    case "unrealistic-behavior":
      return {
        id: rule.id,
        severity: rule.severity,
        title: "Animal behavior reads as unrealistic",
        detail: rule.detail,
        fix: "Replace human-style emotion or gestures with posture, spacing, pressure, brace, turn, or breakaway language.",
      };
    case "excessive-adjectives":
      return {
        id: rule.id,
        severity: rule.severity,
        title: "Prompt density is getting adjective-heavy",
        detail: rule.detail,
        fix: "Trim decorative adjectives first and keep the core order: subject, action, environment, lighting, style.",
      };
    case "conflicting-camera":
      return {
        id: rule.id,
        severity: rule.severity,
        title: "Camera instructions conflict",
        detail: rule.detail,
        fix: "Choose one camera move for the main beat: hold, push, pull-back, track, or orbit — not conflicting combinations.",
      };
    case "kling-too-long":
      return {
        id: rule.id,
        severity: rule.severity,
        title: "Kling paste block is too long",
        detail: rule.detail,
        fix: "Keep Kling short, clean, and centered on one dominant action beat.",
      };
    case "kling-single-action":
      return {
        id: rule.id,
        severity: rule.severity,
        title: "Kling needs one dominant action",
        detail: rule.detail,
        fix: "Collapse the prompt to one action line, one camera move, and one clean reaction state.",
      };
    case "runway-camera-clarity":
      return {
        id: rule.id,
        severity: rule.severity,
        title: "Runway prompt needs clearer camera direction",
        detail: rule.detail,
        fix: "Add one explicit camera move such as slow push-in, pull-back, tracking move, orbit, or locked hold.",
      };
    case "seedance-structured-flow":
      return {
        id: rule.id,
        severity: rule.severity,
        title: "Seedance prompt lost its structured flow",
        detail: rule.detail,
        fix: "Keep Seedance in a readable subject movement / background movement / camera movement flow.",
      };
    case "engine-compliance":
    default:
      return {
        id: "engine-compliance",
        severity: rule.severity,
        title: "Engine compliance needs review",
        detail: rule.detail,
        fix: "Keep Kling at 5s or 10s, preserve Runway camera clarity, and keep engine-specific prompt constraints clean.",
      };
  }
}

function buildLowScoreReasons(
  candidate: PromptCandidateDefinition,
  failedRules: PromptDecisionRule[],
  promptLength: number
): string[] {
  const reasons = failedRules
    .filter((rule) => !rule.passed)
    .sort((a, b) => b.penalty - a.penalty)
    .map((rule) => rule.label);

  if (candidate.source === "kling" && promptLength > 650) {
    reasons.push("Kling candidate is denser than it needs to be for a clean single action.");
  }

  if (candidate.source === "runway" && !hasCameraClarity(candidate.prompt)) {
    reasons.push("Runway candidate is missing one clean camera instruction.");
  }

  return Array.from(new Set(reasons)).slice(0, 4);
}

function evaluatePromptCandidate(
  pkg: GeneratedPackage,
  candidate: PromptCandidateDefinition
): PromptDecisionCandidate {
  const prompt = cleanCreatorPrompt(candidate.prompt, candidate.source);
  const source = candidate.source;
  const hasPredator = prompt.toLowerCase().includes(safeText(pkg.predatorName).toLowerCase());
  const hasPrey = prompt.toLowerCase().includes(safeText(pkg.preyName).toLowerCase());
  const subjectUnclear = isSubjectUnclear(prompt, pkg);
  const multipleActions = source !== "seedance" && hasMultipleActions(prompt);
  const unrealisticBehavior = hasUnrealisticBehavior(prompt);
  const excessiveAdjectives = hasExcessiveAdjectives(prompt);
  const conflictingCamera = source !== "seedance" && hasConflictingCameraInstructions(prompt);
  const rules: PromptDecisionRule[] = [];

  if (subjectUnclear) {
    pushRule(rules, {
      id: "unclear-subject",
      label: "Subject identity is not clear enough",
      passed: false,
      severity: "danger",
      detail: `${candidate.engine} does not clearly anchor the predator and prey names in a readable way.`,
      penalty: 18,
    });
  }

  if (multipleActions) {
    pushRule(rules, {
      id: "multiple-actions",
      label: "Too many actions are competing in one shot",
      passed: false,
      severity: "warning",
      detail: `${candidate.engine} is trying to land multiple action beats in one paste block.`,
      penalty: 12,
    });
  }

  if (unrealisticBehavior) {
    pushRule(rules, {
      id: "unrealistic-behavior",
      label: "Behavior slips into non-documentary language",
      passed: false,
      severity: "danger",
      detail: `${candidate.engine} contains anthropomorphic or unrealistic animal behavior cues.`,
      penalty: 20,
    });
  }

  if (excessiveAdjectives) {
    pushRule(rules, {
      id: "excessive-adjectives",
      label: "Decorative adjectives are burying the action",
      passed: false,
      severity: "warning",
      detail: `${candidate.engine} becomes harder to paste-read because the descriptive stack is too dense.`,
      penalty: 8,
    });
  }

  if (conflictingCamera) {
    pushRule(rules, {
      id: "conflicting-camera",
      label: "Camera instructions pull in opposite directions",
      passed: false,
      severity: "danger",
      detail: `${candidate.engine} mixes incompatible camera directions in the same shot.`,
      penalty: 16,
    });
  }

  if (source === "kling") {
    const klingLength = validateKlingPromptLength(prompt);
    if (klingLength.isOver) {
      pushRule(rules, {
        id: "kling-too-long",
        label: "Kling block is too long",
        passed: false,
        severity: "danger",
        detail: klingLength.warning ?? "Kling prompt length is over the working limit.",
        penalty: 18,
      });
    }

    if (multipleActions) {
      pushRule(rules, {
        id: "kling-single-action",
        label: "Kling hard rule failed: one action only",
        passed: false,
        severity: "danger",
        detail: `${candidate.engine} should stay short, clean, and centered on one dominant action.`,
        penalty: 12,
      });
    }
  }

  if (source === "runway" && !hasCameraClarity(prompt)) {
    pushRule(rules, {
      id: "runway-camera-clarity",
      label: "Runway hard rule failed: camera move is too soft",
      passed: false,
      severity: "danger",
      detail: `${candidate.engine} needs one explicit camera move so the motion plan is copy-ready for Runway.`,
      penalty: 12,
    });
  }

  if (source === "seedance" && !hasSeedanceStructuredFlow(prompt)) {
    pushRule(rules, {
      id: "seedance-structured-flow",
      label: "Seedance hard rule failed: structured flow is missing",
      passed: false,
      severity: "warning",
      detail: `${candidate.engine} should preserve a readable subject/background/camera flow for multi-shot work.`,
      penalty: 10,
    });
  }

  if (source === "runway" || source === "kling") {
    const duration = candidate.metadata?.durationSeconds;
    const engineWarnings = validateEngineConstraints({
      engine: source,
      duration,
      hasNegativePrompt: source === "kling",
      hasAppearanceInPrompt: false,
    }).filter((warning) => warning.level !== "info");

    if (engineWarnings.length > 0) {
      pushRule(rules, {
        id: "engine-compliance",
        label: "Engine compliance rule failed",
        passed: false,
        severity: engineWarnings.some((warning) => warning.level === "error")
          ? "danger"
          : "warning",
        detail: engineWarnings.map((warning) => warning.message).join(" "),
        penalty: engineWarnings.some((warning) => warning.level === "error") ? 18 : 10,
      });
    }
  }

  const enginePenalty = rules
    .filter((rule) =>
      [
        "kling-too-long",
        "kling-single-action",
        "runway-camera-clarity",
        "seedance-structured-flow",
        "engine-compliance",
        "conflicting-camera",
      ].includes(rule.id)
    )
    .reduce((sum, rule) => sum + rule.penalty, 0);

  const pasteReadinessScore = clampScore(
    96 -
      rules.reduce((sum, rule) => sum + rule.penalty, 0) -
      (prompt.length > 1100 ? 6 : 0) -
      (source === "kling" && prompt.length > 650 ? 8 : 0)
  );
  const subjectClarityScore = clampScore(
    58 +
      (hasPredator ? 18 : 0) +
      (hasPrey ? 16 : 0) +
      (prompt.length <= 220 ? 8 : 0) -
      (subjectUnclear ? 20 : 0)
  );
  const animalRealismScore = clampScore(
    92 - (unrealisticBehavior ? 24 : 0) - (excessiveAdjectives ? 8 : 0)
  );
  const motionFeasibilityScore = clampScore(
    92 -
      (multipleActions ? 16 : 0) -
      (conflictingCamera ? 18 : 0) -
      (source === "runway" && !hasCameraClarity(prompt) ? 10 : 0)
  );
  const engineComplianceScore = clampScore(100 - enginePenalty);
  const viralHookStrength = clampScore(
    (pkg.openingFrameScore?.total ?? 70) * 0.7 +
      (pkg.usAudienceScore?.total ?? 70) * 0.3 +
      (pkg.hookFamily === "danger" ? 6 : pkg.hookFamily === "reversal" ? 5 : 4)
  );
  const combinedDecisionScore = pasteReadinessScore + engineComplianceScore;
  const confidenceLevel = getConfidenceLevel(combinedDecisionScore, rules);

  return {
    key: candidate.key,
    source,
    label: candidate.label,
    engine: candidate.engine,
    reason: candidate.reason,
    prompt,
    confidenceLevel,
    combinedDecisionScore,
    pasteReadinessScore,
    subjectClarityScore,
    animalRealismScore,
    motionFeasibilityScore,
    engineComplianceScore,
    viralHookStrength,
    lowScoreReasons: buildLowScoreReasons(candidate, rules, prompt.length),
    failedRules: rules,
    safeModePrompt:
      rules.length > 0 ? buildSafeModePrompt(pkg, source) : undefined,
  };
}

function selectPrimaryCandidate(
  candidates: PromptDecisionCandidate[]
): PromptDecisionCandidate {
  const primaryEligible = candidates.filter((candidate) =>
    candidate.key === "image-master" ||
    candidate.key === "workflow-1"
  );
  const pool = primaryEligible.length ? primaryEligible : candidates;

  const imageMaster = pool.find((candidate) => candidate.key === "image-master");
  const isSectionedNanoMaster =
    imageMaster?.prompt.includes("Lead Animal Prompt:") &&
    imageMaster.prompt.includes("Opposing Animal Prompt:") &&
    imageMaster.prompt.includes("Safety / Continuity Prompt:");
  if (imageMaster && (imageMaster.confidenceLevel !== "Risky" || isSectionedNanoMaster)) {
    return imageMaster;
  }

  return [...pool].sort((a, b) => {
    if (b.combinedDecisionScore !== a.combinedDecisionScore) {
      return b.combinedDecisionScore - a.combinedDecisionScore;
    }
    if (b.pasteReadinessScore !== a.pasteReadinessScore) {
      return b.pasteReadinessScore - a.pasteReadinessScore;
    }
    return SOURCE_PRIORITY[b.source] - SOURCE_PRIORITY[a.source];
  })[0];
}

function buildPrimaryExplanation(
  candidate: PromptDecisionCandidate,
  safeModeApplied: boolean
): string {
  if (safeModeApplied) {
    return "Selected automatically because it still has the strongest combined paste readiness and engine compliance, but Safe Mode cleaned the risky version before recommending it.";
  }

  if (candidate.confidenceLevel === "High") {
    return "Selected automatically because it has the strongest combined paste readiness and engine compliance and clears the hard engine rules cleanly.";
  }

  if (candidate.confidenceLevel === "Medium") {
    return "Selected automatically because it leads the available prompts on paste readiness and engine compliance, but it still benefits from one quick QA review before spend.";
  }

  return "Selected automatically because it still scores highest among the available prompts, but it needs caution before spend.";
}

function buildFailureRecovery(
  pkg: GeneratedPackage,
  selectedCandidate: PromptDecisionCandidate,
  simplePrompt: PromptGuidanceBlock,
  imagePromptText: string
): PromptFailureRecovery | undefined {
  const needsRecovery =
    selectedCandidate.confidenceLevel === "Risky" ||
    selectedCandidate.failedRules.some((rule) => rule.severity === "danger");

  if (!needsRecovery) return undefined;

  if (selectedCandidate.source === "image") {
    return {
      reason: "Failure recovery",
      why: "If the selected master-still prompt still feels unstable, fall back to the one-line concept prompt to reset subject, action, environment, lighting, and style with less density.",
      fallbackPrompt: {
        label: "FALLBACK PROMPT (Recovery)",
        engine: simplePrompt.engine,
        reason: "Use this when the selected image prompt still feels too dense or unstable on first paste.",
        prompt: simplePrompt.prompt,
      },
    };
  }

  return {
    reason: "Failure recovery",
    why: "If the selected video prompt drifts or fails, reset identity and scene spacing with the master still before spending more motion credits.",
    fallbackPrompt: {
      label: "FALLBACK PROMPT (Recovery)",
      engine: "Nano Banana 2 primary master still",
      reason: "Use this to rebuild subject identity, spacing, and light continuity before retrying motion.",
      prompt: imagePromptText,
    },
  };
}

function buildCandidateDefinitions(
  pkg: GeneratedPackage,
  imagePrompt: StructuredPrompt,
  workflowShots: StructuredPrompt[]
): PromptCandidateDefinition[] {
  const candidates: PromptCandidateDefinition[] = [
    {
      key: "image-master",
      source: "image",
      label: "PRIMARY PROMPT (Paste this first)",
      engine: "Nano Banana 2 primary master still",
      reason:
        "Best first-paste candidate when you want to lock subject identity, spacing, and lighting before motion generation.",
      prompt: imagePrompt.pasteReady,
      metadata: imagePrompt.metadata,
    },
  ];

  workflowShots.forEach((shot, index) => {
    const source = shot.metadata?.engine === "runway" ? "runway" : "kling";
    const modelName =
      source === "runway"
        ? safeText(pkg.modelsUsed?.runway) || "Runway"
        : safeText(pkg.modelsUsed?.kling) || "Kling";

    candidates.push({
      key: `workflow-${index + 1}`,
      source,
      label: index === 0 ? "CINEMATIC PROMPT (Advanced control)" : `HYBRID SHOT ${index + 1}`,
      engine: `${modelName} Shot ${index + 1}`,
      reason:
        source === "runway"
          ? "Strong advanced-control candidate when you need motion-led camera direction and a clean hybrid handoff."
          : "Strong action-beat candidate when you need one clear Kling motion block inside the hybrid route.",
      prompt: shot.pasteReady,
      metadata: shot.metadata,
    });
  });

  const klingFramesPrompt = safeText(
    pkg.structuredPrompts?.klingFramesPrompt?.pasteReady ??
      pkg.structuredPrompts?.klingNative15s?.pasteReady ??
      pkg.klingFramesPrompt ??
      pkg.klingNative15s
  );
  if (klingFramesPrompt) {
    candidates.push({
      key: "kling-frames",
      source: "kling",
      label: "KLING FRAMES PROMPT",
      engine: "Kling Frames single prompt",
      reason:
        "Best Kling single-field candidate when you need a 15-second Frames prompt capped at 2500 characters.",
      prompt: klingFramesPrompt,
      metadata:
        pkg.structuredPrompts?.klingFramesPrompt?.metadata ??
        pkg.structuredPrompts?.klingNative15s?.metadata,
    });
  }

  (pkg.structuredPrompts?.klingMultishotShots ?? []).forEach((shot, index) => {
    candidates.push({
      key: `kling-multishot-${index + 1}`,
      source: "kling",
      label: `KLING MULTISHOT SHOT ${index + 1}`,
      engine: `Kling Multishot Shot ${index + 1}`,
      reason:
        "Dedicated 3-shot Kling Multishot prompt capped at 512 characters for each shot field.",
      prompt: shot.pasteReady,
      metadata: shot.metadata,
    });
  });

  const seedancePrompt = safeText(
    pkg.structuredPrompts?.seedanceMultiShot?.pasteReady ?? pkg.seedanceMultiShotPrompt
  );
  if (seedancePrompt) {
    candidates.push({
      key: "seedance-multishot",
      source: "seedance",
      label: "SEEDANCE MULTI-SHOT",
      engine: "Seedance 2.0 multi-shot",
      reason:
        "Best optional block when you want one structured Seedance multi-shot paste that preserves subject/background/camera flow.",
      prompt: seedancePrompt,
      metadata: pkg.structuredPrompts?.seedanceMultiShot?.metadata,
    });
  }

  return candidates;
}

export function buildPromptClarityReport(pkg: GeneratedPackage): PromptClarityReport {
  const imagePrompt = getStructuredPrompt(
    pkg.structuredPrompts?.imagePrompt,
    safeText(pkg.imagePrompt)
  );
  const workflowShots = pkg.structuredPrompts?.workflowShots ?? [];

  const simplePrompt: PromptGuidanceBlock = {
    label: "SIMPLE PROMPT (Fast copy)",
    engine: "Universal concept structure",
    reason:
      "Fast one-line subject/action/environment/light/style version for instant concept testing.",
    prompt: buildSimplePrompt(pkg),
  };

  const candidateDefinitions = buildCandidateDefinitions(pkg, imagePrompt, workflowShots);
  const debugCandidates = candidateDefinitions
    .map((candidate) => evaluatePromptCandidate(pkg, candidate))
    .sort((a, b) => {
      if (b.combinedDecisionScore !== a.combinedDecisionScore) {
        return b.combinedDecisionScore - a.combinedDecisionScore;
      }
      if (b.pasteReadinessScore !== a.pasteReadinessScore) {
        return b.pasteReadinessScore - a.pasteReadinessScore;
      }
      return SOURCE_PRIORITY[b.source] - SOURCE_PRIORITY[a.source];
    });

  const selectedCandidate = selectPrimaryCandidate(debugCandidates);
  const safeModeApplied =
    selectedCandidate.confidenceLevel === "Risky" ||
    selectedCandidate.failedRules.some((rule) => rule.severity === "danger");
  const primaryPromptText =
    safeModeApplied && selectedCandidate.safeModePrompt
      ? selectedCandidate.safeModePrompt
      : selectedCandidate.prompt;

  const primaryPrompt: PromptGuidanceBlock = {
    label: "PRIMARY PROMPT (Paste this first)",
    engine: safeModeApplied
      ? `${selectedCandidate.engine} · Safe Mode`
      : selectedCandidate.engine,
    reason: `${selectedCandidate.reason} ${buildPrimaryExplanation(
      selectedCandidate,
      safeModeApplied
    )}`,
    prompt: primaryPromptText,
    confidenceLevel: selectedCandidate.confidenceLevel,
    safeModeApplied,
  };

  const cinematicCandidate =
    debugCandidates.find((candidate) => candidate.key === "workflow-1") ??
    debugCandidates.find((candidate) => candidate.source === "runway") ??
    selectedCandidate;

  const cinematicPrompt: PromptGuidanceBlock = {
    label: "CINEMATIC PROMPT (Advanced control)",
    engine: cinematicCandidate.engine,
    reason:
      "Advanced motion-led control block. Use this when you want the full cinematic engine prompt instead of the safer first-paste route.",
    prompt: cinematicCandidate.prompt,
    confidenceLevel: cinematicCandidate.confidenceLevel,
  };

  const warnings: PromptClarityWarning[] = [];
  for (const candidate of debugCandidates) {
    for (const rule of candidate.failedRules) {
      pushWarning(warnings, buildCandidateWarning(rule));
    }
  }

  const scores: PromptClarityScores = {
    pasteReadinessScore: selectedCandidate.pasteReadinessScore,
    subjectClarityScore: selectedCandidate.subjectClarityScore,
    animalRealismScore: selectedCandidate.animalRealismScore,
    motionFeasibilityScore: Math.min(
      ...debugCandidates.map((candidate) => candidate.motionFeasibilityScore)
    ),
    engineComplianceScore: Math.min(
      ...debugCandidates.map((candidate) => candidate.engineComplianceScore)
    ),
    viralHookStrength: selectedCandidate.viralHookStrength,
  };

  const fallback = buildFailureRecovery(
    pkg,
    selectedCandidate,
    simplePrompt,
    cleanCreatorPrompt(imagePrompt.pasteReady, "image")
  );

  const decision: PromptDecisionSummary = {
    confidenceLevel: selectedCandidate.confidenceLevel,
    explanation: buildPrimaryExplanation(selectedCandidate, safeModeApplied),
    selectedKey: selectedCandidate.key,
    selectedEngine: selectedCandidate.engine,
    safeModeApplied,
    lowScoreReasons: selectedCandidate.lowScoreReasons,
    failedRules: selectedCandidate.failedRules,
    fallback,
  };

  return {
    simplePrompt,
    primaryPrompt,
    cinematicPrompt,
    timelineMode: buildTimelineMode(pkg),
    scores,
    warnings,
    summary:
      selectedCandidate.confidenceLevel === "High"
        ? "Primary prompt is ready: copy the selected first-paste prompt, then move into the advanced cinematic block if you need deeper control."
        : selectedCandidate.confidenceLevel === "Medium"
          ? "Primary prompt is usable, but the debug panel explains the few things worth checking before heavy generation spend."
          : "Primary prompt needed Safe Mode cleanup. Use the fallback recovery block if the selected engine prompt still drifts or fails.",
    decision,
    debugCandidates,
  };
}
