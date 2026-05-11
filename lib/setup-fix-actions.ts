import type {
  SetupReadinessChecklist,
  SetupReadinessChecklistItem,
} from "@/lib/setup-readiness-checklist";

export type SetupFixActionId =
  | "suggest-better-pair"
  | "suggest-better-habitat"
  | "make-non-graphic"
  | "apply-best-viral-setup"
  | "reset-smart-defaults";

export type FixActionDescriptor = {
  id: string;
  label: string;
  helper: string;
  target: "setup" | "output" | "navigation";
  severity: "suggested" | "recommended";
  sourceItemId?: string;
  disabled?: boolean;
};

const SETUP_FIX_ACTIONS: Record<SetupFixActionId, Omit<FixActionDescriptor, "id">> = {
  "suggest-better-pair": {
    label: "Suggest Better Pair",
    helper: "Updates the second subject from the current story-mode match list.",
    target: "setup",
    severity: "recommended",
  },
  "suggest-better-habitat": {
    label: "Suggest Better Habitat",
    helper: "Switches habitat region only, keeping both subjects unchanged.",
    target: "setup",
    severity: "recommended",
  },
  "make-non-graphic": {
    label: "Make Non-Graphic",
    helper: "Applies the existing safer non-graphic tuner controls.",
    target: "setup",
    severity: "recommended",
  },
  "apply-best-viral-setup": {
    label: "Apply Best Viral Setup",
    helper: "Applies the top ranked USA viral setup for this story mode.",
    target: "setup",
    severity: "suggested",
  },
  "reset-smart-defaults": {
    label: "Reset Smart Defaults",
    helper: "Restores the current story mode's smart subject defaults.",
    target: "setup",
    severity: "recommended",
  },
};

function action(
  id: SetupFixActionId,
  item: SetupReadinessChecklistItem
): FixActionDescriptor {
  return {
    id,
    ...SETUP_FIX_ACTIONS[id],
    sourceItemId: item.id,
  };
}

export function buildSetupFixActions(
  checklist: SetupReadinessChecklist
): FixActionDescriptor[] {
  const actions: FixActionDescriptor[] = [];

  for (const item of checklist.items) {
    if (item.status === "pass") continue;

    if (item.id === "pair-quality") {
      actions.push(action("suggest-better-pair", item));
    }
    if (item.id === "habitat-fit") {
      actions.push(action("suggest-better-habitat", item));
    }
    if (item.id === "safety") {
      actions.push(action("make-non-graphic", item));
    }
    if (item.id === "viral-readiness") {
      actions.push(action("apply-best-viral-setup", item));
    }
    if (item.id === "story-mode-completeness") {
      actions.push(action("reset-smart-defaults", item));
    }
  }

  return actions;
}
