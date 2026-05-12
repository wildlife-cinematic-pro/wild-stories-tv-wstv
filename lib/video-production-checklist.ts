import type {
  ModelSpecificPromptGuidanceInfo,
  PrimaryVideoRouteInfo,
} from "@/types";

export type VideoProductionChecklist = {
  title: string;
  selectedModel: string;
  primaryRoute: string;
  steps: string[];
  badges: string[];
  needsVerification: boolean;
  sourceFootageRequired: boolean;
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

export function getProductionChecklistTitle(
  route: PrimaryVideoRouteInfo | undefined
): string {
  if (!route || route.kind === "hybrid") return "Hybrid Production Checklist";
  if (route.kind === "seedance-direct") return "Seedance 2 Production Checklist";
  if (route.kind === "kling-direct") return "Direct Kling Production Checklist";
  if (route.kind === "runway-third-party") return "Runway Third-Party Production Checklist";
  if (route.kind === "aleph-edit") return "Aleph Edit Production Checklist";
  return "Runway Native Production Checklist";
}

function stepsForRoute(route: PrimaryVideoRouteInfo | undefined): string[] {
  if (!route || route.kind === "hybrid") {
    return [
      "Use Hybrid 4-shot workflow.",
      "Shot 1 and Shot 4: Runway route.",
      "Shot 2 and Shot 3: Kling route.",
      "Preserve first-frame continuity across every handoff.",
      "Use existing Hybrid copy buttons first.",
    ];
  }

  if (route.kind === "seedance-direct") {
    return [
      "Use for fast action, chase pressure, and viral pacing.",
      "Keep shot beats short and readable.",
      "Prioritize motion continuity and full subject readability.",
      "Avoid overly complex multi-action prompts.",
    ];
  }

  if (route.kind === "kling-direct") {
    return [
      "Use a director-style action prompt.",
      "Keep one clear action beat per shot.",
      "Emphasize body mechanics, grounded contact, spacing, and stable anatomy.",
      "Use for realistic animal pressure and action.",
    ];
  }

  if (route.kind === "runway-third-party") {
    const isMotionControl = route.selectedVideoModel?.id === "kling-3-0-motion-control";
    return [
      "Use as a Runway third-party route, not a legacy Direct Kling save value.",
      "Prepare a character/reference image for animal identity and anatomy lock.",
      isMotionControl
        ? "Add motion/reference footage when using Motion Control."
        : "Use an environment/master frame when the third-party route supports it.",
      "Treat 4K as an upscale or final export route when native specs are not verified.",
      "Keep uncertain vendor details marked needsVerification, not official.",
    ];
  }

  if (route.kind === "aleph-edit") {
    return [
      "Source footage required before using this route.",
      "Do not use Aleph as normal first-pass image-to-video generation.",
      "Focus the prompt on edit intent: relight, restyle, replace/remove, or transform existing footage.",
      "Preserve source animal identities, habitat, timing, lighting, and scene continuity.",
      "Use existing source footage as the creative base.",
    ];
  }

  return [
    "Use Image-to-Video when a master image exists.",
    "Keep the prompt motion-focused.",
    "Do not over-describe animal identity when the reference image already provides identity.",
    "Prioritize first-frame clarity, subject spacing, grounded contact, and camera motion.",
  ];
}

function badgesForRoute(route: PrimaryVideoRouteInfo | undefined): string[] {
  const badges: string[] = [];
  if (!route || route.kind === "hybrid") badges.push("Hybrid primary");
  if (route?.kind === "runway-third-party") badges.push("Runway third-party", "Needs verification");
  if (route?.kind === "aleph-edit") badges.push("Source footage required");
  if (route?.kind === "seedance-direct") badges.push("Fast action route");
  if (route?.kind === "kling-direct") badges.push("Direct selectable");
  if (route?.kind === "runway-native") badges.push("Runway native");
  if (route?.selectedVideoModel?.needsVerification && !badges.includes("Needs verification")) {
    badges.push("Needs verification");
  }
  return badges;
}

export function getProductionChecklistCopyText(input: {
  route?: PrimaryVideoRouteInfo;
  guidance?: ModelSpecificPromptGuidanceInfo;
  title?: string;
  steps?: string[];
}): string {
  const title = input.title || getProductionChecklistTitle(input.route);
  const selectedModel = selectedModelLabel(input.route, input.guidance);
  const primaryRoute = primaryRouteLabel(input.route, input.guidance);
  const steps = input.steps || stepsForRoute(input.route);

  return [
    title,
    `Selected Model: ${selectedModel}`,
    `Primary Route: ${primaryRoute.replace(/^Primary Route:\s*/i, "")}`,
    "Checklist:",
    ...steps.map((step, index) => `${index + 1}. ${step}`),
  ].join("\n");
}

export function getProductionChecklistForRoute(input: {
  route?: PrimaryVideoRouteInfo;
  guidance?: ModelSpecificPromptGuidanceInfo;
}): VideoProductionChecklist {
  const title = getProductionChecklistTitle(input.route);
  const steps = stepsForRoute(input.route).slice(0, 7);
  const badges = badgesForRoute(input.route);
  const selectedModel = selectedModelLabel(input.route, input.guidance);
  const primaryRoute = primaryRouteLabel(input.route, input.guidance);
  const needsVerification = badges.includes("Needs verification");
  const sourceFootageRequired = badges.includes("Source footage required");

  return {
    title,
    selectedModel,
    primaryRoute,
    steps,
    badges,
    needsVerification,
    sourceFootageRequired,
    copyText: getProductionChecklistCopyText({
      route: input.route,
      guidance: input.guidance,
      title,
      steps,
    }),
  };
}
