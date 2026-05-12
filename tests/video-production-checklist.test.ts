import { describe, expect, it } from "vitest";

import {
  getProductionChecklistCopyText,
  getProductionChecklistForRoute,
} from "@/lib/video-production-checklist";
import { buildModelSpecificPromptGuidance } from "@/lib/video-model-prompt-guidance";
import { getPrimaryVideoRoute } from "@/lib/video-output-routing";

function checklist(selectedVideoModelId: string, pipelineStyle = "direct") {
  const route = getPrimaryVideoRoute({ pipelineStyle, selectedVideoModelId });
  return getProductionChecklistForRoute({
    route,
    guidance: buildModelSpecificPromptGuidance(route),
  });
}

describe("video production checklist", () => {
  it("builds a Hybrid checklist", () => {
    const result = checklist("seedance-2", "4-shot");

    expect(result.title).toBe("Hybrid Production Checklist");
    expect(result.steps).toContain("Use Hybrid 4-shot workflow.");
    expect(result.steps).toContain("Shot 1 and Shot 4: Runway route.");
    expect(result.steps).toContain("Shot 2 and Shot 3: Kling route.");
    expect(result.steps).toContain("Use existing Hybrid copy buttons first.");
  });

  it("builds a Runway native checklist", () => {
    const result = checklist("runway-gen-4-5");

    expect(result.title).toBe("Runway Native Production Checklist");
    expect(result.steps).toContain("Use Image-to-Video when a master image exists.");
    expect(result.steps).toContain("Keep the prompt motion-focused.");
    expect(result.steps.join(" ")).toContain("Do not over-describe animal identity");
  });

  it("builds a Seedance checklist", () => {
    const result = checklist("seedance-2");

    expect(result.title).toBe("Seedance 2 Production Checklist");
    expect(result.steps).toContain("Use for fast action, chase pressure, and viral pacing.");
    expect(result.steps).toContain("Avoid overly complex multi-action prompts.");
  });

  it("builds a Direct Kling checklist", () => {
    const result = checklist("kling-3-0-pro");

    expect(result.title).toBe("Direct Kling Production Checklist");
    expect(result.steps).toContain("Use a director-style action prompt.");
    expect(result.steps.join(" ")).toContain("body mechanics, grounded contact, spacing, and stable anatomy");
  });

  it("builds a Runway third-party checklist with verification warning", () => {
    const result = checklist("kling-03-4k");

    expect(result.title).toBe("Runway Third-Party Production Checklist");
    expect(result.badges).toContain("Needs verification");
    expect(result.needsVerification).toBe(true);
    expect(result.steps.join(" ")).toContain("Runway third-party route");
    expect(result.steps.join(" ")).toContain("4K as an upscale or final export route");
  });

  it("builds a Motion Control checklist with reference-footage input", () => {
    const result = checklist("kling-3-0-motion-control");

    expect(result.steps).toContain("Add motion/reference footage when using Motion Control.");
    expect(result.badges).toContain("Needs verification");
  });

  it("builds an Aleph checklist with source-footage requirement", () => {
    const result = checklist("runway-aleph");

    expect(result.title).toBe("Aleph Edit Production Checklist");
    expect(result.sourceFootageRequired).toBe(true);
    expect(result.badges).toContain("Source footage required");
    expect(result.steps).toContain("Source footage required before using this route.");
    expect(result.steps.join(" ")).toContain("relight, restyle, replace/remove, or transform existing footage");
  });

  it("copy text includes selected model and primary route", () => {
    const route = getPrimaryVideoRoute({
      pipelineStyle: "direct-seedance",
      selectedVideoModelId: "seedance-2",
    });
    const text = getProductionChecklistCopyText({
      route,
      guidance: buildModelSpecificPromptGuidance(route),
    });

    expect(text).toContain("Selected Model: Seedance 2");
    expect(text).toContain("Primary Route: Seedance 2 fast action");
    expect(text).toContain("Checklist:");
  });
});
