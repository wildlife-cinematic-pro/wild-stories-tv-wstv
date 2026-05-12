import { describe, expect, it } from "vitest";

import {
  buildFullProductionPackExport,
  buildProductionPackExport,
  buildShortProductionPackExport,
} from "@/lib/video-production-pack-export";
import { buildModelSpecificPromptGuidance } from "@/lib/video-model-prompt-guidance";
import { getPrimaryVideoRoute } from "@/lib/video-output-routing";
import type { GeneratedPackage, PrimaryVideoRouteInfo, StructuredPrompt } from "@/types";

function prompt(
  pasteReady: string,
  engine: "runway" | "kling" | "seedance" = "runway"
): StructuredPrompt {
  return {
    fullText: `FULL CARD\n${pasteReady}`,
    pasteReady,
    settings: [`${engine} setting`],
    metadata: { engine },
  };
}

function route(selectedVideoModelId: string, pipelineStyle = "direct"): PrimaryVideoRouteInfo {
  return getPrimaryVideoRoute({ pipelineStyle, selectedVideoModelId });
}

function pkgFor(routeInfo: PrimaryVideoRouteInfo): GeneratedPackage {
  return {
    imagePrompt: "Clean wildlife image.",
    negativePrompt: "no blood no gore no visible injury",
    thumbnailPrompt: "Readable wildlife thumbnail.",
    voiceoverLine: "The pressure builds.",
    runwayShots: ["Runway legacy shot"],
    klingShots: ["Kling legacy shot"],
    seedanceShots: ["Seedance legacy shot"],
    motionStrength: 0.7,
    capCutPlan: "Edit plan.",
    clipChaining: "Clean frame handoff.",
    hook: "The standoff starts.",
    hook2026: ["The standoff starts."],
    caption: "Wildlife pressure without contact.",
    caption2026: "Wildlife pressure without contact.",
    cta: "Watch the final move.",
    hashtags: "#Wildlife #Nature #Reels #Animals #Cinematic",
    tenIdeas: [],
    shotPlan: [
      { engine: "RUNWAY", title: "Shot 1", prompt: "Hybrid Runway shot body." },
      { engine: "KLING", title: "Shot 2", prompt: "Hybrid Kling shot body." },
    ],
    runwayBundle: "Runway bundle",
    klingBundle: "Kling bundle",
    routingNote: "Routing note.",
    primaryVideoRoute: routeInfo,
    modelPromptGuidance: buildModelSpecificPromptGuidance(routeInfo),
    structuredPrompts: {
      runwayShots: [prompt("Runway paste-ready body.", "runway")],
      klingShots: [prompt("Kling paste-ready body.", "kling")],
      seedanceShots: [
        prompt("Seedance paste-ready shot 1.", "seedance"),
        prompt("Seedance paste-ready shot 2.", "seedance"),
      ],
      workflowShots: [
        prompt("Hybrid runway paste-ready shot.", "runway"),
        prompt("Hybrid kling paste-ready shot.", "kling"),
      ],
    },
  } as GeneratedPackage;
}

describe("video production pack export", () => {
  it("puts Hybrid export first for Hybrid primary", () => {
    const pack = buildProductionPackExport(pkgFor(route("seedance-2", "4-shot")));

    expect(pack.routeType).toBe("Hybrid primary");
    expect(pack.mainPromptPointer).toContain("Use Hybrid 4-shot package first");
    expect(pack.fullText).toContain("Hybrid 4-shot package first");
    expect(pack.fullText).toContain("Shot 1 and Shot 4 use Runway");
    expect(pack.fullText).toContain("Shot 2 and Shot 3 use Kling");
  });

  it("includes Seedance route guidance for Seedance export", () => {
    const pack = buildProductionPackExport(pkgFor(route("seedance-2")));

    expect(pack.routeType).toBe("Seedance direct");
    expect(pack.primaryRoute).toContain("Seedance 2 fast action");
    expect(pack.fullText).toContain("Seedance 2 route");
    expect(pack.copyInstructions.join(" ")).toContain("Copy Seedance Shot Bundle");
  });

  it("includes source-footage requirement for Aleph export", () => {
    const pack = buildProductionPackExport(pkgFor(route("runway-aleph")));

    expect(pack.routeType).toBe("Aleph edit");
    expect(pack.mainPromptPointer).toContain("Upload existing source footage first");
    expect(pack.fullText).toContain("source-footage required");
    expect(pack.fullText).toContain("Upload source footage first");
  });

  it("includes needsVerification warning for Runway third-party export", () => {
    const pack = buildProductionPackExport(pkgFor(route("kling-03-4k")));

    expect(pack.routeType).toBe("Runway third-party");
    expect(pack.warnings.join(" ")).toContain("Verify exact Runway third-party settings");
    expect(pack.fullText).toContain("needsVerification");
  });

  it("short pack includes selected model and primary route", () => {
    const text = buildShortProductionPackExport(pkgFor(route("runway-gen-4-5")));

    expect(text).toContain("Selected Model: Gen-4.5");
    expect(text).toContain("Primary Route: Runway Gen-4.5 final hero");
    expect(text).toContain("Best Next Action:");
  });

  it("full pack includes checklist and Workflow QA", () => {
    const text = buildFullProductionPackExport(pkgFor(route("kling-3-0-pro")));

    expect(text).toContain("Workflow QA Status: Ready");
    expect(text).toContain("Production Checklist:");
    expect(text).toContain("Route-Specific Copy Instructions:");
  });

  it("copy text includes caption and hashtags when available", () => {
    const pack = buildProductionPackExport(pkgFor(route("kling-3-0-pro")));

    expect(pack.copyText).toContain("Facebook Caption: Wildlife pressure without contact.");
    expect(pack.copyText).toContain("Hashtags: #Wildlife #Nature #Reels #Animals #Cinematic");
  });
});
