import type {
  GeneratedPackage,
  ModelSpecificPromptGuidanceInfo,
  PrimaryVideoRouteInfo,
} from "@/types";
import { getProductionChecklistForRoute } from "@/lib/video-production-checklist";
import { getRouteAwareCopyActions } from "@/lib/video-route-copy-actions";
import { getWorkflowQAForRoute } from "@/lib/video-workflow-qa";

export type VideoProductionPackExport = {
  title: string;
  selectedModel: string;
  primaryRoute: string;
  routeType: string;
  bestUse: string;
  requiredInputs: string[];
  workflowQAStatus: string;
  warnings: string[];
  bestNextAction: string;
  checklist: string[];
  copyInstructions: string[];
  mainPromptPointer: string;
  caption?: string;
  hashtags?: string;
  shortText: string;
  fullText: string;
  copyText: string;
};

function clean(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map((item) => String(item ?? "").trim()).filter(Boolean).join(" ").trim();
  return String(value ?? "").trim();
}

function selectedModelLabel(
  route: PrimaryVideoRouteInfo | undefined,
  guidance: ModelSpecificPromptGuidanceInfo | undefined
): string {
  return clean(guidance?.selectedModel) || route?.selectedVideoModel?.label || "Default WSTV video model";
}

function primaryRouteLabel(
  route: PrimaryVideoRouteInfo | undefined,
  guidance: ModelSpecificPromptGuidanceInfo | undefined
): string {
  return clean(guidance?.primaryRoute) || route?.label || "Primary Route: Hybrid 4-shot";
}

export function getProductionPackRouteSummary(
  route: PrimaryVideoRouteInfo | undefined
): {
  routeType: string;
  mainPromptPointer: string;
  routeNote: string;
} {
  if (!route || route.kind === "hybrid") {
    return {
      routeType: "Hybrid primary",
      mainPromptPointer: "Use Hybrid 4-shot package first; Runway Shot 1/4 and Kling Shot 2/3 stay paired.",
      routeNote: "Hybrid 4-shot package first. Shot 1 and Shot 4 use Runway; Shot 2 and Shot 3 use Kling.",
    };
  }

  if (route.kind === "seedance-direct") {
    return {
      routeType: "Seedance direct",
      mainPromptPointer: "Use the Seedance 2 prompt or Seedance shot bundle for the primary action route.",
      routeNote: "Seedance 2 route: keep fast-action beats compact, readable, and continuity-safe.",
    };
  }

  if (route.kind === "kling-direct") {
    return {
      routeType: "Direct Kling",
      mainPromptPointer: "Use the Direct Kling prompt first, then copy Kling settings when needed.",
      routeNote: "Direct Kling route: director-style action prompt with one clear action beat.",
    };
  }

  if (route.kind === "runway-third-party") {
    const model = route.selectedVideoModel?.label || "selected third-party model";
    return {
      routeType: "Runway third-party",
      mainPromptPointer: `Use the Runway third-party route setup for ${model}; verify model UI settings before final render.`,
      routeNote: "Runway third-party route: keep needsVerification warnings visible for uncertain vendor details.",
    };
  }

  if (route.kind === "aleph-edit") {
    return {
      routeType: "Aleph edit",
      mainPromptPointer: "Upload existing source footage first; use the Aleph edit prompt for transformation intent.",
      routeNote: "Aleph route: source-footage required, not normal image-to-video generation.",
    };
  }

  return {
    routeType: "Runway native",
    mainPromptPointer: "Use the Runway native prompt and settings guidance for image-to-video.",
    routeNote: "Runway native route: keep the prompt motion-focused when a master image supplies identity.",
  };
}

function packageHeader(input: {
  title: string;
  selectedModel: string;
  primaryRoute: string;
  routeType: string;
  bestUse: string;
}): string[] {
  return [
    input.title,
    `Selected Model: ${input.selectedModel}`,
    `Primary Route: ${input.primaryRoute.replace(/^Primary Route:\s*/i, "")}`,
    `Route Type: ${input.routeType}`,
    `Best Use: ${input.bestUse}`,
  ];
}

function publishingLines(pkg: GeneratedPackage): string[] {
  const lines: string[] = [];
  const caption = clean(pkg.caption2026 || pkg.caption);
  const hashtags = clean(pkg.hashtags || pkg.tags);
  if (caption) lines.push(`Facebook Caption: ${caption}`);
  if (hashtags) lines.push(`Hashtags: ${hashtags}`);
  return lines;
}

function formatList(title: string, items: string[]): string[] {
  if (!items.length) return [];
  return [title, ...items.map((item) => `- ${item}`)];
}

export function buildShortProductionPackExport(pkg: GeneratedPackage): string {
  const route = pkg.primaryVideoRoute;
  const guidance = pkg.modelPromptGuidance;
  const summary = getProductionPackRouteSummary(route);
  const qa = getWorkflowQAForRoute({ route, guidance });

  return [
    ...packageHeader({
      title: "WSTV Selected-Model Production Pack — Short",
      selectedModel: selectedModelLabel(route, guidance),
      primaryRoute: primaryRouteLabel(route, guidance),
      routeType: summary.routeType,
      bestUse: guidance?.bestUse || route?.detail || "Use the selected WSTV video route.",
    }),
    `Best Next Action: ${qa.bestNextAction}`,
    `Main Prompt / Copy Pointer: ${summary.mainPromptPointer}`,
  ].join("\n");
}

export function buildFullProductionPackExport(pkg: GeneratedPackage): string {
  const route = pkg.primaryVideoRoute;
  const guidance = pkg.modelPromptGuidance;
  const summary = getProductionPackRouteSummary(route);
  const qa = getWorkflowQAForRoute({ route, guidance });
  const checklist = getProductionChecklistForRoute({ route, guidance });
  const copyActions = getRouteAwareCopyActions(pkg);
  const primaryCopy = copyActions.find((action) => action.primary) ?? copyActions[0];

  return [
    ...packageHeader({
      title: "WSTV Selected-Model Production Pack — Full",
      selectedModel: selectedModelLabel(route, guidance),
      primaryRoute: primaryRouteLabel(route, guidance),
      routeType: summary.routeType,
      bestUse: guidance?.bestUse || route?.detail || "Use the selected WSTV video route.",
    }),
    `Workflow QA Status: ${qa.status}`,
    `Best Next Action: ${qa.bestNextAction}`,
    `Main Prompt / Package Pointer: ${summary.mainPromptPointer}`,
    `Route Note: ${summary.routeNote}`,
    ...formatList("Required Inputs:", qa.requiredInputs),
    ...formatList("Warnings:", qa.warnings),
    ...formatList("Production Checklist:", checklist.steps),
    ...formatList(
      "Route-Specific Copy Instructions:",
      copyActions.map((action) => `${action.label}: ${action.helper}`)
    ),
    ...publishingLines(pkg),
    primaryCopy?.text ? `Main Prompt / Package:\n${primaryCopy.text}` : "",
  ].filter(Boolean).join("\n");
}

export function buildProductionPackExport(pkg: GeneratedPackage): VideoProductionPackExport {
  const route = pkg.primaryVideoRoute;
  const guidance = pkg.modelPromptGuidance;
  const summary = getProductionPackRouteSummary(route);
  const qa = getWorkflowQAForRoute({ route, guidance });
  const checklist = getProductionChecklistForRoute({ route, guidance });
  const copyActions = getRouteAwareCopyActions(pkg);
  const caption = clean(pkg.caption2026 || pkg.caption);
  const hashtags = clean(pkg.hashtags || pkg.tags);
  const shortText = buildShortProductionPackExport(pkg);
  const fullText = buildFullProductionPackExport(pkg);

  return {
    title: "Production Pack Export",
    selectedModel: selectedModelLabel(route, guidance),
    primaryRoute: primaryRouteLabel(route, guidance),
    routeType: summary.routeType,
    bestUse: guidance?.bestUse || route?.detail || "Use the selected WSTV video route.",
    requiredInputs: qa.requiredInputs,
    workflowQAStatus: qa.status,
    warnings: qa.warnings,
    bestNextAction: qa.bestNextAction,
    checklist: checklist.steps,
    copyInstructions: copyActions.map((action) => `${action.label}: ${action.helper}`),
    mainPromptPointer: summary.mainPromptPointer,
    caption: caption || undefined,
    hashtags: hashtags || undefined,
    shortText,
    fullText,
    copyText: fullText,
  };
}
