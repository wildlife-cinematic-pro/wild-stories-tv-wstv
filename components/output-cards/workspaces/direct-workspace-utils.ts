import type { DirectWorkspaceTab } from "@/components/output-cards/workspaces/types";
import type { GeneratedPackage } from "@/types";

export function getDefaultDirectWorkspace(data: GeneratedPackage): DirectWorkspaceTab {
  const hasKlingDirectOutput = Boolean(
    data.klingFramesPrompt ||
      data.klingNative15s ||
      data.structuredPrompts?.klingFramesPrompt ||
      data.structuredPrompts?.klingNative15s ||
      data.klingMultishotShots?.length ||
      data.structuredPrompts?.klingMultishotShots?.length
  );

  return hasKlingDirectOutput ? "kling15" : "seedance";
}

export function resolveDirectWorkspaceTab({
  selected,
  hasKlingDirect,
  hasSeedance,
}: {
  selected: DirectWorkspaceTab;
  hasKlingDirect: boolean;
  hasSeedance: boolean;
}): DirectWorkspaceTab | null {
  if (selected === "kling15" && hasKlingDirect) return "kling15";
  if (selected === "seedance" && hasSeedance) return "seedance";
  if (hasKlingDirect) return "kling15";
  if (hasSeedance) return "seedance";
  return null;
}
