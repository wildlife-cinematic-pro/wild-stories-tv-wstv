import { describe, expect, it } from "vitest";

import { analyzeGeneratedOutputQuality } from "@/lib/generated-output-quality";
import { buildOutputFixActions } from "@/lib/output-fix-actions";
import { buildSetupFixActions } from "@/lib/setup-fix-actions";
import type { SetupReadinessChecklist } from "@/lib/setup-readiness-checklist";
import type { GeneratedPackage, StructuredPrompt } from "@/types";

function checklist(
  overrides: Partial<SetupReadinessChecklist> = {}
): SetupReadinessChecklist {
  return {
    overall: "caution",
    score: 80,
    items: [
      {
        id: "pair-quality",
        label: "Pair quality",
        status: "pass",
        detail: "Pair is good.",
      },
      {
        id: "habitat-fit",
        label: "Habitat fit",
        status: "pass",
        detail: "Habitat is good.",
      },
      {
        id: "safety",
        label: "Safety",
        status: "pass",
        detail: "Safe.",
      },
      {
        id: "viral-readiness",
        label: "Viral readiness",
        status: "pass",
        detail: "Viral.",
      },
    ],
    ...overrides,
  };
}

function prompt(
  pasteReady: string,
  engine: "runway" | "kling" | "seedance" = "runway"
): StructuredPrompt {
  return {
    fullText: `FULL CARD
${pasteReady}`,
    pasteReady,
    metadata: { engine },
  };
}

function goodPackage(overrides: Partial<GeneratedPackage> = {}): GeneratedPackage {
  return {
    imagePrompt: "Clean documentary wildlife standoff at golden hour.",
    negativePrompt: "no blood no gore no visible injury",
    thumbnailPrompt: "Bison herd wall at Yellowstone.",
    voiceoverLine: "The herd holds its ground.",
    runwayShots: ["Runway reference text"],
    klingShots: ["Kling reference text"],
    seedanceShots: ["Seedance reference text"],
    motionStrength: 0.72,
    capCutPlan: "Simple four-shot edit.",
    clipChaining: "Use clean full-body handoff frames.",
    hook: "The herd does not move.",
    hook2026: ["The herd does not move."],
    caption: "Bison hold the line as the pack circles.",
    caption2026: "Bison hold the line as the pack circles.",
    cta: "Watch the standoff.",
    hashtags: "#Wildlife #Bison #Nature #Reels #Yellowstone",
    tenIdeas: [],
    shotPlan: [],
    runwayBundle: "Runway bundle",
    klingBundle: "Kling bundle",
    routingNote: "Hybrid route ready.",
    structuredPrompts: {
      runwayShots: [prompt("Slow push-in as the bison herd holds formation.", "runway")],
      klingShots: [prompt("Director prompt: wolves circle wide while bison stay grounded.", "kling")],
      seedanceShots: [prompt("Bison herd holds still while snow dust moves.", "seedance")],
      workflowShots: [
        prompt("Shot 1 paste-ready runway body.", "runway"),
        prompt("Shot 2 paste-ready kling body.", "kling"),
        prompt("Shot 3 paste-ready kling body.", "kling"),
        prompt("Shot 4 paste-ready runway body.", "runway"),
      ],
    },
    ...overrides,
  };
}

function outputActions(pkg: GeneratedPackage) {
  return buildOutputFixActions(analyzeGeneratedOutputQuality(pkg));
}

describe("fix action helpers", () => {
  it("returns Suggest Better Pair for weak pair readiness", () => {
    const actions = buildSetupFixActions(
      checklist({
        items: [
          {
            id: "pair-quality",
            label: "Pair quality",
            status: "fail",
            detail: "Weak pair.",
          },
        ],
      })
    );

    expect(actions.map((action) => action.id)).toContain("suggest-better-pair");
  });

  it("returns Suggest Better Habitat for weak habitat readiness", () => {
    const actions = buildSetupFixActions(
      checklist({
        items: [
          {
            id: "habitat-fit",
            label: "Habitat fit",
            status: "fail",
            detail: "Weak habitat.",
          },
        ],
      })
    );

    expect(actions.map((action) => action.id)).toContain("suggest-better-habitat");
  });

  it("returns Make Non-Graphic for safety caution", () => {
    const actions = buildSetupFixActions(
      checklist({
        items: [
          {
            id: "safety",
            label: "Safety",
            status: "caution",
            detail: "Use a safer level.",
          },
        ],
      })
    );

    expect(actions.map((action) => action.id)).toContain("make-non-graphic");
  });

  it("returns Apply Best Viral Setup for low viral readiness", () => {
    const actions = buildSetupFixActions(
      checklist({
        items: [
          {
            id: "viral-readiness",
            label: "Viral readiness",
            status: "caution",
            detail: "Low USA pull.",
          },
        ],
      })
    );

    expect(actions.map((action) => action.id)).toContain("apply-best-viral-setup");
  });

  it("returns Trim Caption for a caption over 150 characters", () => {
    const actions = outputActions(goodPackage({ caption: "A".repeat(160) }));

    expect(actions.map((action) => action.id)).toContain("trim-caption");
  });

  it("returns Fix to 5 Hashtags for 4 or 6 hashtags", () => {
    const four = outputActions(
      goodPackage({ hashtags: "#Wildlife #Bison #Nature #Reels" })
    );
    const six = outputActions(
      goodPackage({
        hashtags: "#Wildlife #Bison #Nature #Reels #Yellowstone #Animals",
      })
    );

    expect(four.map((action) => action.id)).toContain("fix-to-5-hashtags");
    expect(six.map((action) => action.id)).toContain("fix-to-5-hashtags");
  });

  it("returns Make Output Non-Graphic for safety wording failure", () => {
    const actions = outputActions(goodPackage({ caption: "Blood and gore appear." }));

    expect(actions.map((action) => action.id)).toContain("make-output-non-graphic");
  });

  it("returns Open Copy Workspace when paste-ready blocks are missing", () => {
    const actions = outputActions(goodPackage({ structuredPrompts: undefined }));

    expect(actions.map((action) => action.id)).toContain(
      "open-video-copy-workspace"
    );
  });

  it("returns no setup actions for a ready checklist", () => {
    expect(buildSetupFixActions(checklist({ overall: "ready", score: 100 }))).toEqual(
      []
    );
  });

  it("returns deterministic output", () => {
    const first = outputActions(goodPackage({ caption: "A".repeat(160) }));
    const second = outputActions(goodPackage({ caption: "A".repeat(160) }));

    expect(second).toEqual(first);
  });
});
