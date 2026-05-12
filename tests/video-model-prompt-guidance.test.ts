import { describe, expect, it } from "vitest";

import {
  adaptStructuredPromptForSelectedVideoRoute,
  buildModelSpecificPromptGuidance,
} from "@/lib/video-model-prompt-guidance";
import { getPrimaryVideoRoute } from "@/lib/video-output-routing";
import type { StructuredPrompt } from "@/types";

function prompt(): StructuredPrompt {
  return {
    fullText: "FULL PROMPT",
    pasteReady: "PASTE PROMPT",
    settings: ["Duration 5s"],
    metadata: { engine: "runway", shotKey: "shot1" },
  };
}

describe("video model prompt guidance", () => {
  it("adds Runway native model guidance to Runway prompts", () => {
    const route = getPrimaryVideoRoute({
      pipelineStyle: "runway-native",
      selectedVideoModelId: "runway-gen-4-5",
    });

    const adapted = adaptStructuredPromptForSelectedVideoRoute(prompt(), route, "runway");

    expect(buildModelSpecificPromptGuidance(route)).toMatchObject({
      selectedModel: "Gen-4.5",
      primaryRoute: "Primary Route: Runway Gen-4.5 final hero",
    });
    expect(adapted.pasteReady).toContain("Runway native I2V guidance");
    expect(adapted.pasteReady).toContain("Runway settings guidance");
    expect(adapted.pasteReady).toContain("motion, camera, physics");
  });

  it("adds Seedance fast-action guidance only to Seedance prompts", () => {
    const route = getPrimaryVideoRoute({
      pipelineStyle: "direct-seedance",
      selectedVideoModelId: "seedance-2",
    });

    const adaptedSeedance = adaptStructuredPromptForSelectedVideoRoute(prompt(), route, "seedance");
    const untouchedRunway = adaptStructuredPromptForSelectedVideoRoute(prompt(), route, "runway");

    expect(adaptedSeedance.pasteReady).toContain("Seedance 2 fast-action guidance");
    expect(adaptedSeedance.pasteReady).toContain("viral retention");
    expect(untouchedRunway.pasteReady).toBe("PASTE PROMPT");
  });

  it("keeps Hybrid primary and does not rewrite prompt bodies", () => {
    const route = getPrimaryVideoRoute({
      pipelineStyle: "4-shot",
      selectedVideoModelId: "seedance-2",
    });

    const adapted = adaptStructuredPromptForSelectedVideoRoute(prompt(), route, "seedance");

    expect(route.kind).toBe("hybrid");
    expect(buildModelSpecificPromptGuidance(route).promptNote).toContain("Hybrid protection");
    expect(adapted.pasteReady).toBe("PASTE PROMPT");
  });

  it("marks Aleph as source-footage edit guidance", () => {
    const route = getPrimaryVideoRoute({
      pipelineStyle: "existing-footage-edit",
      selectedVideoModelId: "runway-aleph",
    });

    const guidance = buildModelSpecificPromptGuidance(route);
    const adapted = adaptStructuredPromptForSelectedVideoRoute(prompt(), route, "runway");

    expect(guidance.sourceFootageRequired).toBe(true);
    expect(adapted.pasteReady).toContain("Aleph existing-footage edit route");
    expect(adapted.pasteReady).toContain("source footage already exists");
    expect(adapted.pasteReady).toContain("do not treat this as a standard first-pass I2V generation prompt");
  });

  it("adds Runway third-party setup guidance for Kling 03 4K and Motion Control", () => {
    for (const selectedVideoModelId of ["kling-03-4k", "kling-3-0-motion-control"]) {
      const route = getPrimaryVideoRoute({
        pipelineStyle: "runway-third-party",
        selectedVideoModelId,
      });
      const adapted = adaptStructuredPromptForSelectedVideoRoute(prompt(), route, "runway");

      expect(route.kind).toBe("runway-third-party");
      expect(adapted.pasteReady).toContain("Runway third-party setup");
      expect(adapted.pasteReady).toContain("realistic animal body mechanics");
      expect(adapted.pasteReady).toContain("first frame readable");
    }
  });

  it("adds Direct Kling guidance to Kling prompts", () => {
    const route = getPrimaryVideoRoute({
      pipelineStyle: "direct-kling",
      selectedVideoModelId: "kling-3-0-pro",
    });

    const adapted = adaptStructuredPromptForSelectedVideoRoute(prompt(), route, "kling");

    expect(adapted.pasteReady).toContain("Direct Kling guidance");
    expect(adapted.pasteReady).toContain("one clear action beat");
    expect(adapted.metadata?.workflowRole).toBe("kling-direct");
  });
});
