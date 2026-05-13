import type { OutputReadinessReport } from "@/lib/output-readiness";
import type { WorkflowQaItem, WorkflowQaSummary } from "@/lib/workflow-qa";
import type { ActionStylePreset } from "@/types";

export type FinalQaCleanupStep = 1 | 2 | 3;

export type FinalQaCleanupItem = {
  id: string;
  sourceLabel: string;
  issue: string;
  whyItMatters: string;
  suggestedCleanerWording: string;
  relatedStep: FinalQaCleanupStep;
  relatedTargetId: string;
  applyPromptValue?: string;
};

export type CameraActionCleanPromptPreview = {
  before: string;
  after: string;
  hasConflict: boolean;
  conflictReason: string;
};

export type FinalQaCleanupInput = {
  workflowQa: WorkflowQaSummary;
  outputReadiness?: OutputReadinessReport | null;
  predator: string;
  prey: string;
  finalEnvironment: string;
  sceneDescription: string;
  cameraAnglePreset: string;
  actionStyle: ActionStylePreset;
};

function cleanText(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function compactSpaces(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function statusIsIssue(item: WorkflowQaItem) {
  return item.status === "warning" || item.status === "fail";
}

function countMatches(text: string, pattern: RegExp) {
  return text.match(pattern)?.length ?? 0;
}

function actionPhrase(actionStyle: ActionStylePreset) {
  if (actionStyle === "Viral chase") return "the animals move through one clear chase lane with readable distance and grounded footwork";
  if (actionStyle === "Close-contact fight") return "the animals hold a tense near-clash posture while staying separated and readable";
  if (actionStyle === "Ambush burst") return "the lead animal makes one sudden burst while the opposing animal reacts cleanly";
  if (actionStyle === "Forced retreat") return "the pressure animal advances as the other retreats through a clean escape lane";
  return "the animals hold natural survival tension with one readable reaction beat";
}

function cleanCameraCue(cameraAnglePreset: string, sceneDescription: string) {
  const preset = cleanText(cameraAnglePreset, "steady low telephoto framing");
  const lower = (sceneDescription + " " + preset).toLowerCase();
  const hasLowAngle = /\blow[- ]angle\b|\blow\b/.test(lower);
  const hasPushIn = /\bpush[- ]?in\b/.test(lower);

  if (hasLowAngle && hasPushIn) {
    return "slow low-angle cinematic push-in";
  }

  return preset;
}

export function buildCameraActionCleanPromptPreview({
  predator,
  prey,
  finalEnvironment,
  sceneDescription,
  cameraAnglePreset,
  actionStyle,
}: Omit<FinalQaCleanupInput, "workflowQa" | "outputReadiness">): CameraActionCleanPromptPreview {
  const before = cleanText(sceneDescription, "No manual scene description yet.");
  const lower = before.toLowerCase();
  const cameraCueCount = countMatches(
    lower,
    /\b(camera|push-?in|handheld|locked|dolly|pan|zoom|tracking|pullback)\b/g
  );
  const actionCueCount = countMatches(
    lower,
    /\b(moves?|surges?|runs?|reacts?|lunges?|steps?|turns?|charges?|bursts?|pulls?|drags?|chases?)\b/g
  );
  const negativeCueCount = countMatches(lower, /\b(no |without |avoid |do not |don't |never )/g);
  const hasMultiShot = /(shot 1|shot 2|0-3s|3-6s|cut to)/i.test(before);
  const isLong = before.length > 420;
  const hasConflict = cameraCueCount !== 1 || actionCueCount !== 1 || negativeCueCount > 2 || hasMultiShot || isLong;
  const conflictReason = hasConflict
    ? "Camera/action direction is easier to hand off when it uses one camera cue, one action lane, and compact positive wording."
    : "Camera/action direction is already compact; this preview keeps a clean fallback ready.";
  const environment = cleanText(finalEnvironment, "a natural wildlife habitat");
  const camera = cleanCameraCue(cameraAnglePreset, before);
  const after = compactSpaces(
    "Wildlife documentary scene in " + environment + ". " + predator + " and " + prey + " stay full-body readable with clean subject separation. Camera: " + camera + ". Action: " + actionPhrase(actionStyle) + ". Keep grounded anatomy, natural light, and non-graphic survival tension."
  );

  return { before, after, hasConflict, conflictReason };
}

function cleanupForWorkflowItem(
  item: WorkflowQaItem,
  input: FinalQaCleanupInput,
  preview: CameraActionCleanPromptPreview
): FinalQaCleanupItem | null {
  const label = item.label.toLowerCase();

  if (label.includes("scene setup")) {
    return {
      id: "scene-setup",
      sourceLabel: item.label,
      issue: item.label,
      whyItMatters: item.detail,
      suggestedCleanerWording:
        "Use a clear habitat, grounded camera angle, and one readable pressure lane before generating the final wildlife documentary pack.",
      relatedStep: 1,
      relatedTargetId: "qa-story-controls",
    };
  }

  if (label.includes("prompt health")) {
    return {
      id: "prompt-health",
      sourceLabel: item.label,
      issue: "Camera/action prompt conflict",
      whyItMatters: item.detail,
      suggestedCleanerWording: preview.after,
      relatedStep: 2,
      relatedTargetId: "qa-scene-description-controls",
      applyPromptValue: preview.after,
    };
  }

  if (label.includes("output readiness")) {
    return {
      id: "output-readiness",
      sourceLabel: item.label,
      issue: item.label,
      whyItMatters: item.detail,
      suggestedCleanerWording:
        "Regenerate or restore the output pack, then confirm animal identity, engine prompt blocks, and documentary safety wording are present.",
      relatedStep: 3,
      relatedTargetId: "qa-generated-output",
    };
  }

  if (label.includes("copy") || label.includes("export")) {
    return {
      id: "copy-export-readiness",
      sourceLabel: item.label,
      issue: item.label,
      whyItMatters: item.detail,
      suggestedCleanerWording:
        "Review the generated caption, hashtags, and paste-ready blocks before publishing the wildlife reel.",
      relatedStep: 3,
      relatedTargetId: "qa-generated-output",
    };
  }

  if (label.includes("safety")) {
    return {
      id: "safety-wording",
      sourceLabel: item.label,
      issue: item.label,
      whyItMatters: item.detail,
      suggestedCleanerWording:
        "Keep the scene framed as clean non-graphic survival tension with separated subjects, grounded anatomy, and no visible injury.",
      relatedStep: 2,
      relatedTargetId: "qa-scene-description-controls",
    };
  }

  return null;
}

function cleanupForOutputReadinessItem(
  item: OutputReadinessReport["items"][number],
  input: FinalQaCleanupInput,
  preview: CameraActionCleanPromptPreview
): FinalQaCleanupItem | null {
  if (item.status !== "warning") return null;

  const label = item.label.toLowerCase();

  if (label.includes("animal identity")) {
    return {
      id: "subject-clarity",
      sourceLabel: item.label,
      issue: "Subject clarity needs cleanup",
      whyItMatters: item.detail,
      suggestedCleanerWording:
        "Name " + input.predator + " and " + input.prey + " clearly before generating so every engine prompt preserves readable wildlife identity.",
      relatedStep: 1,
      relatedTargetId: "qa-subject-setup",
    };
  }

  if (label.includes("camera cue")) {
    return {
      id: "camera-cue-cleanup",
      sourceLabel: item.label,
      issue: "Camera cue needs cleanup",
      whyItMatters: item.detail,
      suggestedCleanerWording: preview.after,
      relatedStep: 2,
      relatedTargetId: "qa-scene-description-controls",
      applyPromptValue: preview.after,
    };
  }

  if (label.includes("subject action")) {
    return {
      id: "action-lane-cleanup",
      sourceLabel: item.label,
      issue: "Weak tension/action lane",
      whyItMatters: item.detail,
      suggestedCleanerWording: preview.after,
      relatedStep: 2,
      relatedTargetId: "qa-scene-description-controls",
      applyPromptValue: preview.after,
    };
  }

  if (label.includes("safety")) {
    return {
      id: "output-safety-wording",
      sourceLabel: item.label,
      issue: "Safety wording needs review",
      whyItMatters: item.detail,
      suggestedCleanerWording:
        "Keep the wildlife scene non-graphic: separated subjects, no blood, no visible injury, no contact, and natural documentary tension.",
      relatedStep: 2,
      relatedTargetId: "qa-scene-description-controls",
    };
  }

  if (label.includes("caption") || label.includes("hashtag")) {
    return {
      id: "caption-hashtag-cleanup",
      sourceLabel: item.label,
      issue: "Caption and hashtag cleanup",
      whyItMatters: item.detail,
      suggestedCleanerWording:
        "Regenerate or review the output pack so the caption and hashtags stay concise, wildlife-focused, and publish-ready.",
      relatedStep: 3,
      relatedTargetId: "qa-generated-output",
    };
  }

  return {
    id: "output-readiness",
    sourceLabel: item.label,
    issue: item.label,
    whyItMatters: item.detail,
    suggestedCleanerWording:
      "Inspect the generated package for named animals, engine prompt blocks, caption, hashtags, and concise non-graphic safety wording.",
    relatedStep: 3,
    relatedTargetId: "qa-generated-output",
  };
}

export function buildFinalQaCleanupItems(input: FinalQaCleanupInput): FinalQaCleanupItem[] {
  const preview = buildCameraActionCleanPromptPreview(input);
  const items = input.workflowQa.items
    .filter(statusIsIssue)
    .map((item) => cleanupForWorkflowItem(item, input, preview))
    .filter((item): item is FinalQaCleanupItem => Boolean(item));

  const seen = new Set<string>();
  const unique = items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  if (preview.hasConflict && !seen.has("prompt-health")) {
    unique.unshift({
      id: "prompt-health",
      sourceLabel: "Prompt health",
      issue: "Camera/action prompt conflict",
      whyItMatters: preview.conflictReason,
      suggestedCleanerWording: preview.after,
      relatedStep: 2,
      relatedTargetId: "qa-scene-description-controls",
      applyPromptValue: preview.after,
    });
  }

  for (const outputItem of input.outputReadiness?.items ?? []) {
    const cleanupItem = cleanupForOutputReadinessItem(outputItem, input, preview);
    if (!cleanupItem || seen.has(cleanupItem.id)) continue;
    seen.add(cleanupItem.id);
    unique.push(cleanupItem);
  }

  return unique.slice(0, 6);
}
