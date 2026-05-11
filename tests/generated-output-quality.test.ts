import { describe, expect, it } from "vitest";

import { analyzeGeneratedOutputQuality } from "@/lib/generated-output-quality";
import type { GeneratedPackage, StructuredPrompt } from "@/types";

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

function itemStatus(pkg: GeneratedPackage, id: string) {
  return analyzeGeneratedOutputQuality(pkg).items.find((item) => item.id === id)
    ?.status;
}

describe("analyzeGeneratedOutputQuality", () => {
  it("returns ready for a full good package", () => {
    const result = analyzeGeneratedOutputQuality(goodPackage());

    expect(result.overall).toBe("ready");
    expect(result.items.every((item) => item.status === "pass")).toBe(true);
  });

  it("marks a missing caption as needs-review", () => {
    const result = analyzeGeneratedOutputQuality(goodPackage({ caption: "" }));

    expect(result.overall).toBe("needs-review");
    expect(itemStatus(goodPackage({ caption: "" }), "caption-readiness")).toBe(
      "fail"
    );
  });

  it("warns for captions over 150 characters and fails very long captions", () => {
    const cautionCaption = "A".repeat(160);
    const failCaption = "B".repeat(181);

    expect(itemStatus(goodPackage({ caption: cautionCaption }), "caption-readiness")).toBe(
      "caution"
    );
    expect(itemStatus(goodPackage({ caption: failCaption }), "caption-readiness")).toBe(
      "fail"
    );
  });

  it("passes exactly 5 usable hashtags", () => {
    expect(itemStatus(goodPackage(), "hashtag-readiness")).toBe("pass");
  });

  it("warns for 4 or 6 hashtags and fails missing or unusable hashtags", () => {
    expect(
      itemStatus(
        goodPackage({ hashtags: "#Wildlife #Bison #Nature #Reels" }),
        "hashtag-readiness"
      )
    ).toBe("caution");
    expect(
      itemStatus(
        goodPackage({ hashtags: "#Wildlife #Bison #Nature #Reels #Yellowstone #Animals" }),
        "hashtag-readiness"
      )
    ).toBe("caution");
    expect(itemStatus(goodPackage({ hashtags: "" }), "hashtag-readiness")).toBe(
      "fail"
    );
    expect(
      itemStatus(goodPackage({ hashtags: "Wildlife #Bison #Nature #Reels #Yellowstone" }), "hashtag-readiness")
    ).toBe("fail");
  });

  it("fails explicit gore or blood wording", () => {
    const result = analyzeGeneratedOutputQuality(
      goodPackage({ caption: "Blood appears on the visible injury after impact." })
    );

    expect(result.overall).toBe("needs-review");
    expect(itemStatus(goodPackage({ caption: "visible injury and blood" }), "safety-wording")).toBe(
      "fail"
    );
  });

  it("warns or fails when paste-ready blocks are missing", () => {
    const result = analyzeGeneratedOutputQuality(
      goodPackage({ structuredPrompts: undefined })
    );

    expect(result.overall).toBe("caution");
    expect(result.items.find((item) => item.id === "copy-block-clarity")?.status).toBe(
      "caution"
    );
    expect(
      itemStatus(
        goodPackage({
          structuredPrompts: undefined,
          runwayShots: [],
          klingShots: [],
          seedanceShots: [],
        }),
        "copy-block-clarity"
      )
    ).toBe("fail");
  });

  it("returns deterministic output", () => {
    const first = analyzeGeneratedOutputQuality(goodPackage());
    const second = analyzeGeneratedOutputQuality(goodPackage());

    expect(second).toEqual(first);
  });
});
