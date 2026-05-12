import type {
  ModelSpecificPromptGuidanceInfo,
  PrimaryVideoRouteInfo,
} from "@/types";

export type VideoWorkflowQAStatus = "Ready" | "Needs attention" | "Guidance only";

export type VideoWorkflowQA = {
  title: string;
  status: VideoWorkflowQAStatus;
  selectedModel: string;
  primaryRoute: string;
  requiredInputs: string[];
  warnings: string[];
  bestNextAction: string;
  copyText: string;
};

function selectedModelLabel(
  route: PrimaryVideoRouteInfo | undefined,
  guidance: ModelSpecificPromptGuidanceInfo | undefined
): string {
  return guidance?.selectedModel || route?.selectedVideoModel?.label || "Default WSTV video model";
}

function primaryRouteLabel(
  route: PrimaryVideoRouteInfo | undefined,
  guidance: ModelSpecificPromptGuidanceInfo | undefined
): string {
  return guidance?.primaryRoute || route?.label || "Primary Route: Hybrid 4-shot";
}

export function getWorkflowQAStatus(
  route: PrimaryVideoRouteInfo | undefined
): VideoWorkflowQAStatus {
  if (!route) return "Guidance only";
  if (route.kind === "aleph-edit") return "Needs attention";
  if (route.kind === "runway-third-party" && route.selectedVideoModel?.needsVerification) {
    return "Needs attention";
  }
  return "Ready";
}

export function getWorkflowQARequiredInputs(
  route: PrimaryVideoRouteInfo | undefined
): string[] {
  if (!route || route.kind === "hybrid") {
    return [
      "Master image or shot references when available.",
      "Hybrid shot plan and existing Runway/Kling copy blocks.",
    ];
  }

  if (route.kind === "seedance-direct") {
    return ["Video prompt or shot bundle.", "Selected Seedance 2 route copy block."];
  }

  if (route.kind === "kling-direct") {
    return ["Image-to-video reference or director prompt.", "Selected Direct Kling copy block."];
  }

  if (route.kind === "runway-third-party") {
    const isMotionControl = route.selectedVideoModel?.id === "kling-3-0-motion-control";
    return [
      "Character/reference image.",
      isMotionControl ? "Motion/reference footage." : "Environment/master frame when applicable.",
      "Runway third-party route settings from the model UI.",
    ];
  }

  if (route.kind === "aleph-edit") {
    return ["Existing source footage.", "Clear edit intent for relight, restyle, replace/remove, or transform."];
  }

  return ["Master image for Image-to-Video when available.", "Runway native motion prompt body."];
}

export function getWorkflowQAWarnings(
  route: PrimaryVideoRouteInfo | undefined
): string[] {
  if (!route) return ["Select a video model or use the default WSTV route guidance."];

  if (route.kind === "hybrid") {
    return route.selectedVideoModel
      ? ["Hybrid is primary; selected model remains guidance."]
      : [];
  }

  if (route.kind === "seedance-direct") {
    return [
      "Keep action beats short and readable.",
      "Avoid too many actions in one shot.",
    ];
  }

  if (route.kind === "kling-direct") {
    return [
      "Use one clear action beat per shot.",
      "Preserve grounded contact and stable anatomy.",
    ];
  }

  if (route.kind === "runway-third-party") {
    return [
      "Verify exact Runway third-party settings in the model UI.",
      "4K may be an upscale or export route when native details are not verified.",
    ];
  }

  if (route.kind === "aleph-edit") {
    return ["Aleph is for editing existing footage, not normal image-to-video generation."];
  }

  return [
    "Keep prompt motion-focused.",
    "Avoid over-describing identity when a reference image is used.",
  ];
}

function getWorkflowQABestNextAction(
  route: PrimaryVideoRouteInfo | undefined
): string {
  if (!route) return "Use the default WSTV video route or select a specific model.";
  if (route.kind === "hybrid") return "Use the Hybrid copy package first.";
  if (route.kind === "seedance-direct") return "Copy the Seedance 2 shot bundle.";
  if (route.kind === "kling-direct") return "Copy the Direct Kling prompt.";
  if (route.kind === "runway-third-party") return "Verify the third-party model settings, then copy the route setup.";
  if (route.kind === "aleph-edit") return "Upload source footage first.";
  return "Copy the Runway native prompt and settings.";
}

export function getWorkflowQACopyText(input: {
  route?: PrimaryVideoRouteInfo;
  guidance?: ModelSpecificPromptGuidanceInfo;
  status?: VideoWorkflowQAStatus;
  requiredInputs?: string[];
  warnings?: string[];
  bestNextAction?: string;
}): string {
  const status = input.status || getWorkflowQAStatus(input.route);
  const requiredInputs = input.requiredInputs || getWorkflowQARequiredInputs(input.route);
  const warnings = input.warnings || getWorkflowQAWarnings(input.route);
  const bestNextAction = input.bestNextAction || getWorkflowQABestNextAction(input.route);

  return [
    "Workflow QA",
    `Status: ${status}`,
    `Selected Model: ${selectedModelLabel(input.route, input.guidance)}`,
    `Primary Route: ${primaryRouteLabel(input.route, input.guidance).replace(/^Primary Route:\s*/i, "")}`,
    "Required Inputs:",
    ...requiredInputs.slice(0, 5).map((item) => `- ${item}`),
    warnings.length ? "Warnings:" : "",
    ...warnings.slice(0, 5).map((item) => `- ${item}`),
    `Best Next Action: ${bestNextAction}`,
  ].filter(Boolean).join("\n");
}

export function getWorkflowQAForRoute(input: {
  route?: PrimaryVideoRouteInfo;
  guidance?: ModelSpecificPromptGuidanceInfo;
}): VideoWorkflowQA {
  const status = getWorkflowQAStatus(input.route);
  const requiredInputs = getWorkflowQARequiredInputs(input.route).slice(0, 5);
  const warnings = getWorkflowQAWarnings(input.route).slice(0, 5);
  const bestNextAction = getWorkflowQABestNextAction(input.route);

  return {
    title: "Workflow QA",
    status,
    selectedModel: selectedModelLabel(input.route, input.guidance),
    primaryRoute: primaryRouteLabel(input.route, input.guidance),
    requiredInputs,
    warnings,
    bestNextAction,
    copyText: getWorkflowQACopyText({
      route: input.route,
      guidance: input.guidance,
      status,
      requiredInputs,
      warnings,
      bestNextAction,
    }),
  };
}
