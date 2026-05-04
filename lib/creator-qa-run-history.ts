import { analyzeOutputReadiness } from "@/lib/output-readiness";
import { analyzePromptHealth } from "@/lib/prompt-health";
import { buildWorkflowQaSummary } from "@/lib/workflow-qa";

import type { GeneratedPackage } from "@/types";

export type CreatorQaRun = {
  id: string;
  createdAt: string;
  presetName?: string;
  predator: string;
  prey: string;
  finalQaScore?: number;
  finalQaStatus?: "Ready" | "Needs review" | "Risky";
  promptHealthLabel?: string;
  outputReady?: boolean;
};

export type PinnedGeneratedOutput = {
  id: string;
  createdAt: string;
  predator: string;
  prey: string;
  finalQaScore?: number;
  finalQaStatus?: "Ready" | "Needs review" | "Risky";
  package: GeneratedPackage;
};

export type PinnedOutputComparisonLabel =
  | "Pinned is stronger"
  | "Current is stronger"
  | "Same score"
  | "Compare unavailable";

export type PinnedOutputComparison = {
  label: PinnedOutputComparisonLabel;
  pairsDiffer: boolean;
  pinnedPair: string;
  currentPair: string;
};

export type CreatorQaRunInput = {
  id?: string;
  createdAt?: string;
  presetName?: string;
  predator: string;
  prey: string;
  arc: string;
  contentLane: string;
  habitat: string;
  weather: string;
  depthMode: string;
  cameraAnglePreset: string;
  emotionalTone: string;
  animalVibe: string;
  finalEnvironment: string;
  sceneDescription: string;
  pkg: GeneratedPackage;
};

export const MAX_CREATOR_QA_RUNS = 5;

function buildFallbackId(input: CreatorQaRunInput): string {
  return [
    input.presetName ?? "custom",
    input.predator,
    input.prey,
    input.pkg.generationId ?? input.pkg.generatedAt ?? input.createdAt ?? "run",
  ].join("::");
}

export function buildCreatorQaRun(input: CreatorQaRunInput): CreatorQaRun {
  const workflowQa = buildWorkflowQaSummary({
    predator: input.predator,
    prey: input.prey,
    arc: input.arc,
    contentLane: input.contentLane,
    habitat: input.habitat,
    weather: input.weather,
    depthMode: input.depthMode,
    cameraAnglePreset: input.cameraAnglePreset,
    emotionalTone: input.emotionalTone,
    animalVibe: input.animalVibe,
    finalEnvironment: input.finalEnvironment,
    sceneDescription: input.sceneDescription,
    pkg: input.pkg,
  });
  const promptHealth = analyzePromptHealth({
    prompt: input.sceneDescription,
    predatorName: input.predator,
    preyName: input.prey,
  });
  const outputReadiness = analyzeOutputReadiness({
    predatorName: input.pkg.predatorName ?? input.predator,
    preyName: input.pkg.preyName ?? input.prey,
    imagePrompt: input.pkg.imagePrompt,
    runwayShots: input.pkg.runwayShots,
    klingShots: input.pkg.klingShots,
    seedanceShots: input.pkg.seedanceShots,
    caption: input.pkg.caption,
    hashtags: input.pkg.hashtags,
    negativePrompt: input.pkg.negativePrompt,
    routingNote: input.pkg.routingNote,
  });

  return {
    id: input.id ?? input.pkg.generationId ?? buildFallbackId(input),
    createdAt:
      input.createdAt ?? input.pkg.generatedAt ?? new Date().toISOString(),
    presetName: input.presetName,
    predator: input.predator,
    prey: input.prey,
    finalQaScore: workflowQa.score,
    finalQaStatus: workflowQa.status,
    promptHealthLabel: promptHealth.label,
    outputReady: outputReadiness.status === "Ready",
  };
}

export function buildPinnedGeneratedOutput(
  input: CreatorQaRunInput
): PinnedGeneratedOutput {
  const workflowQa = buildWorkflowQaSummary({
    predator: input.predator,
    prey: input.prey,
    arc: input.arc,
    contentLane: input.contentLane,
    habitat: input.habitat,
    weather: input.weather,
    depthMode: input.depthMode,
    cameraAnglePreset: input.cameraAnglePreset,
    emotionalTone: input.emotionalTone,
    animalVibe: input.animalVibe,
    finalEnvironment: input.finalEnvironment,
    sceneDescription: input.sceneDescription,
    pkg: input.pkg,
  });

  return {
    id: input.id ?? input.pkg.generationId ?? buildFallbackId(input),
    createdAt:
      input.createdAt ?? input.pkg.generatedAt ?? new Date().toISOString(),
    predator: input.predator,
    prey: input.prey,
    finalQaScore: workflowQa.score,
    finalQaStatus: workflowQa.status,
    package: input.pkg,
  };
}

export function buildPinnedOutputComparison(input: {
  pinnedOutput: PinnedGeneratedOutput | null;
  currentQaScore?: number;
  currentPredator: string;
  currentPrey: string;
}): PinnedOutputComparison {
  const pinnedPair = input.pinnedOutput
    ? `${input.pinnedOutput.predator} vs ${input.pinnedOutput.prey}`
    : "Pinned output unavailable";
  const currentPair = `${input.currentPredator} vs ${input.currentPrey}`;
  const pairsDiffer = Boolean(
    input.pinnedOutput &&
      (input.pinnedOutput.predator !== input.currentPredator ||
        input.pinnedOutput.prey !== input.currentPrey)
  );

  const pinnedScore = input.pinnedOutput?.finalQaScore;
  const currentScore = input.currentQaScore;

  if (typeof pinnedScore !== "number" || typeof currentScore !== "number") {
    return {
      label: "Compare unavailable",
      pairsDiffer,
      pinnedPair,
      currentPair,
    };
  }

  if (pinnedScore === currentScore) {
    return {
      label: "Same score",
      pairsDiffer,
      pinnedPair,
      currentPair,
    };
  }

  return {
    label: pinnedScore > currentScore ? "Pinned is stronger" : "Current is stronger",
    pairsDiffer,
    pinnedPair,
    currentPair,
  };
}

export function appendCreatorQaRun(
  history: CreatorQaRun[],
  run: CreatorQaRun
): CreatorQaRun[] {
  return [run, ...history.filter((entry) => entry.id !== run.id)].slice(
    0,
    MAX_CREATOR_QA_RUNS
  );
}
