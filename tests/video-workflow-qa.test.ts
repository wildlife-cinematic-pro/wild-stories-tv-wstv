import { describe, expect, it } from "vitest";

import {
  getWorkflowQACopyText,
  getWorkflowQAForRoute,
} from "@/lib/video-workflow-qa";
import { buildModelSpecificPromptGuidance } from "@/lib/video-model-prompt-guidance";
import { getPrimaryVideoRoute } from "@/lib/video-output-routing";

function qa(selectedVideoModelId: string, pipelineStyle = "direct") {
  const route = getPrimaryVideoRoute({ pipelineStyle, selectedVideoModelId });
  return getWorkflowQAForRoute({
    route,
    guidance: buildModelSpecificPromptGuidance(route),
  });
}

describe("video workflow QA", () => {
  it("marks Hybrid QA ready", () => {
    const result = qa("seedance-2", "4-shot");

    expect(result.status).toBe("Ready");
    expect(result.primaryRoute).toBe("Primary Route: Hybrid 4-shot");
    expect(result.requiredInputs.join(" ")).toContain("Master image");
    expect(result.warnings).toContain("Hybrid is primary; selected model remains guidance.");
  });

  it("marks Runway native QA ready", () => {
    const result = qa("runway-gen-4-5");

    expect(result.status).toBe("Ready");
    expect(result.requiredInputs).toContain("Master image for Image-to-Video when available.");
    expect(result.warnings.join(" ")).toContain("motion-focused");
  });

  it("marks Seedance QA ready", () => {
    const result = qa("seedance-2");

    expect(result.status).toBe("Ready");
    expect(result.requiredInputs.join(" ")).toContain("Video prompt");
    expect(result.warnings).toContain("Keep action beats short and readable.");
  });

  it("marks Direct Kling QA ready", () => {
    const result = qa("kling-3-0-pro");

    expect(result.status).toBe("Ready");
    expect(result.requiredInputs.join(" ")).toContain("Image-to-video reference");
    expect(result.warnings).toContain("Use one clear action beat per shot.");
  });

  it("marks Runway third-party QA needs attention when verification is needed", () => {
    const result = qa("kling-03-4k");

    expect(result.status).toBe("Needs attention");
    expect(result.requiredInputs.join(" ")).toContain("Character/reference image");
    expect(result.warnings.join(" ")).toContain("Verify exact Runway third-party settings");
  });

  it("requires source footage for Aleph QA", () => {
    const result = qa("runway-aleph");

    expect(result.status).toBe("Needs attention");
    expect(result.requiredInputs).toContain("Existing source footage.");
    expect(result.bestNextAction).toBe("Upload source footage first.");
    expect(result.warnings.join(" ")).toContain("editing existing footage");
  });

  it("copy text includes status, selected model, and primary route", () => {
    const route = getPrimaryVideoRoute({
      pipelineStyle: "direct-seedance",
      selectedVideoModelId: "seedance-2",
    });
    const text = getWorkflowQACopyText({
      route,
      guidance: buildModelSpecificPromptGuidance(route),
    });

    expect(text).toContain("Status: Ready");
    expect(text).toContain("Selected Model: Seedance 2");
    expect(text).toContain("Primary Route: Seedance 2 fast action");
  });
});
