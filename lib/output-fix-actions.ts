import type { FixActionDescriptor } from "@/lib/setup-fix-actions";
import type { EngineOutputQaReport } from "@/lib/engine-output-qa";
import type { GeneratedOutputQualityReport } from "@/lib/generated-output-quality";

export type OutputFixActionId =
  | "trim-caption"
  | "fix-to-5-hashtags"
  | "make-output-non-graphic"
  | "open-video-copy-workspace"
  | "open-copy-workspace"
  | "open-runway-copy"
  | "open-kling-copy"
  | "open-seedance-copy";

const OUTPUT_FIX_ACTIONS: Record<
  OutputFixActionId,
  Omit<FixActionDescriptor, "id" | "sourceItemId">
> = {
  "trim-caption": {
    label: "Trim Caption",
    helper:
      "Suggestion only: no caption override field exists yet, so open Publishing copy before manual edit.",
    target: "output",
    severity: "suggested",
    disabled: true,
  },
  "fix-to-5-hashtags": {
    label: "Fix to 5 Hashtags",
    helper:
      "Suggestion only: no hashtag override field exists yet, so open Publishing copy before manual edit.",
    target: "output",
    severity: "suggested",
    disabled: true,
  },
  "make-output-non-graphic": {
    label: "Make Output Non-Graphic",
    helper:
      "Suggestion only: output prompt text is not rewritten here without an edit override.",
    target: "output",
    severity: "recommended",
    disabled: true,
  },
  "open-video-copy-workspace": {
    label: "Open Video Copy Workspace",
    helper: "Jumps to video paste-ready blocks. No regeneration is triggered.",
    target: "navigation",
    severity: "recommended",
  },
  "open-copy-workspace": {
    label: "Open Copy Workspace",
    helper: "Jumps to the video copy workspace for manual prompt inspection.",
    target: "navigation",
    severity: "suggested",
  },
  "open-runway-copy": {
    label: "Open Runway Copy",
    helper: "Jumps to the Runway paste-ready I2V blocks. No rewrite is triggered.",
    target: "navigation",
    severity: "recommended",
  },
  "open-kling-copy": {
    label: "Open Kling Copy",
    helper: "Jumps to the Kling paste-ready prompt blocks. No rewrite is triggered.",
    target: "navigation",
    severity: "recommended",
  },
  "open-seedance-copy": {
    label: "Open Seedance Copy",
    helper: "Jumps to the Seedance paste-ready motion prompts. No rewrite is triggered.",
    target: "navigation",
    severity: "recommended",
  },
};

function action(id: OutputFixActionId, sourceItemId: string): FixActionDescriptor {
  return {
    id,
    ...OUTPUT_FIX_ACTIONS[id],
    sourceItemId,
  };
}

export function buildOutputFixActions(
  report: GeneratedOutputQualityReport
): FixActionDescriptor[] {
  const actions: FixActionDescriptor[] = [];

  for (const item of report.items) {
    if (item.status === "pass") continue;

    if (item.id === "caption-readiness") {
      actions.push(action("trim-caption", item.id));
    }
    if (item.id === "hashtag-readiness") {
      actions.push(action("fix-to-5-hashtags", item.id));
    }
    if (item.id === "safety-wording" && item.status === "fail") {
      actions.push(action("make-output-non-graphic", item.id));
    }
    if (item.id === "copy-block-clarity") {
      actions.push(action("open-video-copy-workspace", item.id));
    }
    if (
      (item.id === "kling-readiness" || item.id === "seedance-readiness") &&
      /long|2500|900|complex/i.test(item.detail)
    ) {
      actions.push(action("open-copy-workspace", item.id));
    }
  }

  return actions;
}

export function buildEngineOutputFixActions(
  report: EngineOutputQaReport
): FixActionDescriptor[] {
  return report.engines
    .filter((engine) => engine.status !== "pass")
    .map((engine) => {
      if (engine.engine === "runway") {
        return action("open-runway-copy", "engine-qa-runway");
      }
      if (engine.engine === "kling") {
        return action("open-kling-copy", "engine-qa-kling");
      }
      return action("open-seedance-copy", "engine-qa-seedance");
    });
}
