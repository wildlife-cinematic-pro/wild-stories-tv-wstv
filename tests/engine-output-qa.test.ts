import { describe, expect, it } from "vitest";

import { analyzeEngineOutputQa } from "@/lib/engine-output-qa";
import type { GeneratedPackage, StructuredPrompt } from "@/types";

function prompt(
  pasteReady: string,
  engine: "runway" | "kling" | "seedance" = "runway"
): StructuredPrompt {
  return {
    fullText: `FULL CARD\n${pasteReady}`,
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
      runwayShots: [
        prompt("Slow push-in as @animal1 circles @animal2 near @environment.", "runway"),
      ],
      klingShots: [
        prompt(
          "Shot 1: 0:00-0:05, wolves circle wide while bison stay grounded.\nNegative prompt: no blood, no gore, no visible injury.",
          "kling"
        ),
      ],
      seedanceShots: [
        prompt(
          "Bison herd holds formation while snow dust moves behind them. Camera slowly pushes in.",
          "seedance"
        ),
      ],
    },
    ...overrides,
  };
}

function engine(pkg: GeneratedPackage, id: "runway" | "kling" | "seedance") {
  const result = analyzeEngineOutputQa(pkg);
  const found = result.engines.find((item) => item.engine === id);
  if (!found) throw new Error(`Missing engine ${id}`);
  return found;
}

function checkStatus(
  pkg: GeneratedPackage,
  engineId: "runway" | "kling" | "seedance",
  checkId: string
) {
  return engine(pkg, engineId).checks.find((check) => check.id === checkId)?.status;
}

describe("analyzeEngineOutputQa", () => {
  it("passes when Runway pasteReady exists", () => {
    expect(checkStatus(goodPackage(), "runway", "runway-paste-ready")).toBe("pass");
  });

  it("warns when Runway pasteReady contains a Negative prompt block", () => {
    expect(
      checkStatus(
        goodPackage({
          structuredPrompts: {
            ...goodPackage().structuredPrompts,
            runwayShots: [
              prompt(
                "Slow push-in as the bison turns.\nNegative prompt: no blood.",
                "runway"
              ),
            ],
          },
        }),
        "runway",
        "runway-negative-separation"
      )
    ).toBe("caution");
  });

  it("passes exactly 3 Runway @refs and warns for 2 or 4 @refs", () => {
    expect(
      checkStatus(
        goodPackage({
          structuredPrompts: {
            ...goodPackage().structuredPrompts,
            runwayShots: [
              prompt("Move @animal1 past @animal2 in @environment.", "runway"),
            ],
          },
        }),
        "runway",
        "runway-reference-count"
      )
    ).toBe("pass");

    expect(
      checkStatus(
        goodPackage({
          structuredPrompts: {
            ...goodPackage().structuredPrompts,
            runwayShots: [prompt("Move @animal1 past @animal2.", "runway")],
          },
        }),
        "runway",
        "runway-reference-count"
      )
    ).toBe("caution");

    expect(
      checkStatus(
        goodPackage({
          structuredPrompts: {
            ...goodPackage().structuredPrompts,
            runwayShots: [
              prompt("Move @animal1 past @animal2 in @environment near @sky.", "runway"),
            ],
          },
        }),
        "runway",
        "runway-reference-count"
      )
    ).toBe("caution");
  });

  it("scores Kling length thresholds", () => {
    expect(
      checkStatus(
        goodPackage({
          structuredPrompts: {
            ...goodPackage().structuredPrompts,
            klingShots: [prompt("Shot 1: " + "a".repeat(2490), "kling")],
          },
        }),
        "kling",
        "kling-length"
      )
    ).toBe("pass");

    expect(
      checkStatus(
        goodPackage({
          structuredPrompts: {
            ...goodPackage().structuredPrompts,
            klingShots: [prompt("Shot 1: " + "a".repeat(2600), "kling")],
          },
        }),
        "kling",
        "kling-length"
      )
    ).toBe("caution");

    expect(
      checkStatus(
        goodPackage({
          structuredPrompts: {
            ...goodPackage().structuredPrompts,
            klingShots: [prompt("Shot 1: " + "a".repeat(3300), "kling")],
          },
        }),
        "kling",
        "kling-length"
      )
    ).toBe("fail");
  });

  it("scores Seedance complexity thresholds", () => {
    expect(
      checkStatus(
        goodPackage({
          structuredPrompts: {
            ...goodPackage().structuredPrompts,
            seedanceShots: [prompt("Camera moves. " + "a".repeat(920), "seedance")],
          },
        }),
        "seedance",
        "seedance-complexity"
      )
    ).toBe("caution");

    expect(
      checkStatus(
        goodPackage({
          structuredPrompts: {
            ...goodPackage().structuredPrompts,
            seedanceShots: [prompt("Camera moves. " + "a".repeat(1510), "seedance")],
          },
        }),
        "seedance",
        "seedance-complexity"
      )
    ).toBe("fail");
  });

  it("warns when Seedance contains Runway refs", () => {
    expect(
      checkStatus(
        goodPackage({
          structuredPrompts: {
            ...goodPackage().structuredPrompts,
            seedanceShots: [
              prompt("Camera moves while @animal1 turns near @environment.", "seedance"),
            ],
          },
        }),
        "seedance",
        "seedance-reference-clarity"
      )
    ).toBe("caution");
  });

  it("fails gore or blood wording without safe negation", () => {
    expect(
      checkStatus(
        goodPackage({
          structuredPrompts: {
            ...goodPackage().structuredPrompts,
            klingShots: [prompt("Shot 1: blood appears during the visible injury.", "kling")],
          },
        }),
        "kling",
        "kling-visual-safety"
      )
    ).toBe("fail");
  });

  it("returns deterministic output", () => {
    const first = analyzeEngineOutputQa(goodPackage());
    const second = analyzeEngineOutputQa(goodPackage());

    expect(second).toEqual(first);
  });
});
