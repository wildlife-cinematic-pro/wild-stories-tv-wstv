import type { PipelineStyle, SelectedVideoModelInfo } from "@/types";
import { buildSelectedVideoModelInfo } from "@/lib/video-model-capabilities";

export type PrimaryVideoRouteKind =
  | "hybrid"
  | "seedance-direct"
  | "runway-third-party"
  | "aleph-edit"
  | "runway-native"
  | "kling-direct";

export type OutputVideoWorkspaceKey = "hybrid" | "seedance" | "runway" | "kling";

export type PrimaryVideoRoute = {
  kind: PrimaryVideoRouteKind;
  label: string;
  detail: string;
  workspaceTab: OutputVideoWorkspaceKey;
  hybridProtected: boolean;
  selectedVideoModel?: SelectedVideoModelInfo;
};

export function isHybridWorkflow(input: {
  pipelineStyle?: PipelineStyle | string | null;
}): boolean {
  return input.pipelineStyle === "4-shot" || input.pipelineStyle === "long-hybrid-4-shot";
}

function routeForSelectedModel(
  selectedVideoModel: SelectedVideoModelInfo | undefined
): PrimaryVideoRoute {
  if (!selectedVideoModel) {
    return {
      kind: "runway-native",
      label: "Primary Route: Runway Gen-4.5 final hero",
      detail: "Runway native motion route is the safe fallback when no expanded model is selected.",
      workspaceTab: "runway",
      hybridProtected: false,
    };
  }

  if (selectedVideoModel.id === "seedance-2") {
    return {
      kind: "seedance-direct",
      label: "Primary Route: Seedance 2 fast action",
      detail: "Seedance 2 is prioritized for compact fast action and high-retention motion; Runway and Kling bundles stay available.",
      workspaceTab: "seedance",
      hybridProtected: false,
      selectedVideoModel,
    };
  }

  if (selectedVideoModel.id === "runway-aleph") {
    return {
      kind: "aleph-edit",
      label: "Primary Route: Aleph existing-footage edit",
      detail: "Aleph is treated as an existing-footage edit route and needs source footage; standard I2V bundles stay available as secondary options.",
      workspaceTab: "runway",
      hybridProtected: false,
      selectedVideoModel,
    };
  }

  if (selectedVideoModel.id === "kling-03-4k") {
    return {
      kind: "runway-third-party",
      label: "Primary Route: Runway Third-Party Kling 03 4K",
      detail: "Kling 03 4K is prioritized as a Runway third-party route for final-quality grounded action when verified.",
      workspaceTab: "runway",
      hybridProtected: false,
      selectedVideoModel,
    };
  }

  if (selectedVideoModel.id === "kling-3-0-motion-control") {
    return {
      kind: "runway-third-party",
      label: "Primary Route: Runway Third-Party Motion Control",
      detail: "Kling Motion Control is prioritized as a Runway third-party route for controlled identity-locked movement.",
      workspaceTab: "runway",
      hybridProtected: false,
      selectedVideoModel,
    };
  }

  if (selectedVideoModel.providerGroup === "KLING_DIRECT") {
    return {
      kind: "kling-direct",
      label: "Primary Route: Direct Kling action",
      detail: `${selectedVideoModel.label} is prioritized for direct Kling pressure, grounded body mechanics, and readable action beats.`,
      workspaceTab: "kling",
      hybridProtected: false,
      selectedVideoModel,
    };
  }

  return {
    kind: "runway-native",
    label: `Primary Route: Runway ${selectedVideoModel.label} final hero`,
    detail: `${selectedVideoModel.label} is prioritized as the Runway native motion-focused route; Kling and Seedance bundles stay available.`,
    workspaceTab: "runway",
    hybridProtected: false,
    selectedVideoModel,
  };
}

export function getPrimaryVideoRoute(input: {
  pipelineStyle?: PipelineStyle | string | null;
  selectedVideoModelId?: string;
}): PrimaryVideoRoute {
  const selectedVideoModel = buildSelectedVideoModelInfo(input.selectedVideoModelId);

  if (isHybridWorkflow({ pipelineStyle: input.pipelineStyle })) {
    return {
      kind: "hybrid",
      label: "Primary Route: Hybrid 4-shot",
      detail: selectedVideoModel
        ? `Hybrid output remains primary. ${selectedVideoModel.label} is saved as the selected model preference without replacing the Runway + Kling hybrid route.`
        : "Hybrid output remains primary with the existing Runway + Kling route.",
      workspaceTab: "hybrid",
      hybridProtected: true,
      selectedVideoModel,
    };
  }

  return routeForSelectedModel(selectedVideoModel);
}

export function getPrimaryRouteLabel(route: PrimaryVideoRoute | undefined): string {
  return route?.label ?? "Primary Route: Hybrid 4-shot";
}

export function getOrderedOutputTabs(
  route: PrimaryVideoRoute | undefined
): OutputVideoWorkspaceKey[] {
  const preferred = route?.workspaceTab ?? "hybrid";
  const base: OutputVideoWorkspaceKey[] = ["hybrid", "seedance", "runway", "kling"];
  return [preferred, ...base.filter((tab) => tab !== preferred)];
}

export function buildPrimaryRouteRoutingNote(
  route: PrimaryVideoRoute | undefined,
  fallbackRoutingNote: string
): string {
  if (!route || route.kind === "hybrid") return fallbackRoutingNote;
  return `${route.label}. ${route.detail} Existing Hybrid, Runway, Kling, and Seedance bundles remain available. ${fallbackRoutingNote}`;
}
