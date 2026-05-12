import { describe, expect, it } from "vitest";

import { getRouteAwareCopyActions } from "@/lib/video-route-copy-actions";
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

function pkgFor(route: PrimaryVideoRouteInfo): GeneratedPackage {
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
    primaryVideoRoute: route,
    modelPromptGuidance: buildModelSpecificPromptGuidance(route),
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

function route(selectedVideoModelId: string, pipelineStyle = "direct"): PrimaryVideoRouteInfo {
  return getPrimaryVideoRoute({ pipelineStyle, selectedVideoModelId });
}

function labels(pkg: GeneratedPackage) {
  return getRouteAwareCopyActions(pkg).map((action) => action.label);
}

describe("video route copy actions", () => {
  it("returns Hybrid route copy buttons when Hybrid is primary", () => {
    const actions = getRouteAwareCopyActions(pkgFor(route("seedance-2", "4-shot")));

    expect(actions.map((action) => action.label)).toEqual([
      "Copy Hybrid Package",
      "Copy Runway Shot",
      "Copy Kling Shot",
    ]);
    expect(actions[0].text).toContain("Primary Route: Hybrid 4-shot");
    expect(actions[0].text).toContain("Selected Model: Seedance 2");
    expect(actions[0].text).toContain("Hybrid runway paste-ready shot");
  });

  it("returns Seedance copy buttons for the Seedance route", () => {
    const actions = getRouteAwareCopyActions(pkgFor(route("seedance-2")));

    expect(actions.map((action) => action.label)).toEqual([
      "Copy Seedance 2 Prompt",
      "Copy Seedance Shot Bundle",
    ]);
    expect(actions[0].text).toContain("Selected Model: Seedance 2");
    expect(actions[1].text).toContain("Seedance paste-ready shot 2");
  });

  it("returns Aleph edit and source-footage copy buttons", () => {
    const actions = getRouteAwareCopyActions(pkgFor(route("runway-aleph")));

    expect(actions.map((action) => action.label)).toEqual([
      "Copy Aleph Edit Prompt",
      "Copy Source Footage Note",
    ]);
    expect(actions[0].text).toContain("source footage");
    expect(actions[1].text).toContain("Primary Route: Aleph existing-footage edit");
  });

  it("returns Runway third-party copy buttons for Kling 03 4K", () => {
    const actions = getRouteAwareCopyActions(pkgFor(route("kling-03-4k")));

    expect(actions.map((action) => action.label)).toEqual([
      "Copy Runway Third-Party Route",
      "Copy Kling 03 4K Prompt",
    ]);
    expect(actions[0].text).toContain("Runway third-party setup");
    expect(actions[0].text).toContain("Selected Model: Kling 03 4K");
  });

  it("returns Motion Control setup label for Kling Motion Control", () => {
    expect(labels(pkgFor(route("kling-3-0-motion-control")))).toEqual([
      "Copy Runway Third-Party Route",
      "Copy Motion Control Setup",
    ]);
  });

  it("returns Runway native copy buttons for Runway models", () => {
    const actions = getRouteAwareCopyActions(pkgFor(route("runway-gen-4-5")));

    expect(actions.map((action) => action.label)).toEqual([
      "Copy Runway Native Prompt",
      "Copy Runway Settings",
    ]);
    expect(actions[0].text).toContain("Primary Route: Runway Gen-4.5 final hero");
    expect(actions[1].text).toContain("Runway native I2V");
  });

  it("returns Direct Kling copy buttons for direct Kling models", () => {
    const actions = getRouteAwareCopyActions(pkgFor(route("kling-3-0-pro")));

    expect(actions.map((action) => action.label)).toEqual([
      "Copy Kling Prompt",
      "Copy Kling Settings",
    ]);
    expect(actions[0].text).toContain("Selected Model: Kling 3.0 Pro");
    expect(actions[1].text).toContain("Direct Kling");
  });

  it("includes Primary Route and Selected Model in every copy text", () => {
    const actions = getRouteAwareCopyActions(pkgFor(route("kling-2-5-turbo")));

    for (const action of actions) {
      expect(action.text).toContain("Primary Route:");
      expect(action.text).toContain("Selected Model:");
    }
  });
});
