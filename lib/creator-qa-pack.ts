import type { Arc, GeneratedPackage } from "@/types";

import {
  evaluateMasterImagePrompt,
  getMasterImageFixPrompt,
} from "@/lib/master-image-quality";
import { buildFacebookViralPack } from "@/lib/facebook-viral-pack";
import {
  buildAlephRepairPrompt,
  buildFailureRepairPrompt,
  diagnoseOutputFailure,
} from "@/lib/output-failure-fixer";
import { reduceNegativePrompt } from "@/lib/prompt-tools";
import { buildRunwayMotionFirstPrompt } from "@/lib/prompt-builders/runway-motion-first";

export type CreatorQaPack = {
  masterImageScore: number;
  masterImagePassed: boolean;
  masterImageSummary: string;
  masterImageFixPrompt: string;
  runwayMotionFirstPrompt: string;
  compactNegativePrompt: string;
  facebookCaption: string;
  facebookHashtags: string;
  facebookSummary: string;
  failureFixGuide: string;
  failureRepairPrompt: string;
  failureRepairPromptAleph: string;
  summaryText: string;
};

const DEFAULT_FAILURE_COMPLAINT =
  "dust, extra limbs, duplicate animals, identity drift, wrong habitat, floating hooves, cropped body, too much camera shake, gore or injury, unreadable action, lighting drift";

function safeText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map(String).join("\n").trim();
  return String(value ?? "").trim();
}

function getCore(data: GeneratedPackage): {
  predatorName: string;
  preyName: string;
  environmentName: string;
  arcName: Arc;
} {
  return {
    predatorName: safeText(data.predatorName) || "Lead animal",
    preyName: safeText(data.preyName) || "Opposing animal",
    environmentName: safeText(data.environmentName) || "wildlife habitat",
    arcName: data.arcName ?? "Ambush attack",
  };
}

export function buildCreatorQaPack(data: GeneratedPackage): CreatorQaPack {
  const core = getCore(data);
  const qualityReport = evaluateMasterImagePrompt({
    prompt: safeText(data.imagePrompt),
    predatorName: data.predatorName,
    preyName: data.preyName,
    environmentName: data.environmentName,
  });
  const masterImageFixPrompt = getMasterImageFixPrompt(qualityReport);
  const runwayMotionFirstPrompt = buildRunwayMotionFirstPrompt({
    predatorName: core.predatorName,
    preyName: core.preyName,
    environmentName: core.environmentName,
    arcName: core.arcName,
    shotRole: "opening",
    durationSeconds: 5,
    sceneDesc: safeText(data.sceneDesc),
    safetyMode: "clean",
  });
  const compactNegativePrompt = reduceNegativePrompt(
    safeText(data.negativePrompt),
    14
  );
  const facebookPack = buildFacebookViralPack({
    predatorName: core.predatorName,
    preyName: core.preyName,
    arcName: core.arcName,
    environmentName: core.environmentName,
    tone: "documentary",
    aiDisclosure: true,
  });
  const failureFixes = diagnoseOutputFailure(DEFAULT_FAILURE_COMPLAINT);
  const failureFixGuide = failureFixes
    .map(
      (fix) =>
        `${fix.type}\nCause: ${fix.likelyCause}\nPrompt fix: ${fix.promptFix}`
    )
    .join("\n\n");
  const failureRepairPrompt = buildFailureRepairPrompt(
    failureFixes,
    runwayMotionFirstPrompt
  );
  const failureRepairPromptAleph = buildAlephRepairPrompt(
    failureFixes,
    runwayMotionFirstPrompt
  );
  const facebookHashtags = facebookPack.hashtags.join(" ");
  const masterImageSummary = [
    `Score: ${qualityReport.score}/100`,
    `Passed: ${qualityReport.passed ? "YES" : "NO"}`,
    qualityReport.summary,
  ].join("\n");
  const facebookSummary = [
    `Caption: ${facebookPack.caption150}`,
    `Hashtags: ${facebookHashtags}`,
    `Hook: ${facebookPack.hookText}`,
    `Pinned comment: ${facebookPack.pinnedComment}`,
  ].join("\n");
  const summaryText = [
    "MASTER IMAGE QUALITY",
    masterImageSummary,
    `Fix prompt: ${masterImageFixPrompt}`,
    "",
    "RUNWAY MOTION-FIRST PROMPT",
    runwayMotionFirstPrompt,
    "",
    "FACEBOOK VIRAL PACK",
    facebookSummary,
    "",
    "FAILURE REPAIR PROMPT",
    failureRepairPrompt,
    "",
    "COMPACT NEGATIVE PROMPT",
    compactNegativePrompt || "(none)",
  ].join("\n");

  return {
    masterImageScore: qualityReport.score,
    masterImagePassed: qualityReport.passed,
    masterImageSummary,
    masterImageFixPrompt,
    runwayMotionFirstPrompt,
    compactNegativePrompt,
    facebookCaption: facebookPack.caption150,
    facebookHashtags,
    facebookSummary,
    failureFixGuide,
    failureRepairPrompt,
    failureRepairPromptAleph,
    summaryText,
  };
}
