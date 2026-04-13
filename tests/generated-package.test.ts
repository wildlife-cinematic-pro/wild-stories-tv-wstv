import { describe, expect, it } from "vitest";
import type { GeneratedPackage } from "@/types";
import {
  hasUsableGeneratedPackageEnhancements,
  mergeGeneratedPackage,
} from "@/lib/generated-package";

function makeBasePackage(): GeneratedPackage {
  return {
    imagePrompt: "base image",
    negativePrompt: "base negative",
    thumbnailPrompt: "base thumbnail",
    voiceoverLine: "base voice",
    runwayShots: ["r1", "r2", "r3", "r4"],
    klingShots: ["k1", "k2", "k3", "k4"],
    motionStrength: 70,
    capCutPlan: "base capcut",
    clipChaining: "base chaining",
    hook: "base hook",
    hook2026: ["base hook"],
    caption: "base caption",
    caption2026: "base caption 2026",
    cta: "base cta",
    hashtags: "#base",
    tenIdeas: ["idea 1"],
    shotPlan: [],
    runwayBundle: "runway bundle",
    klingBundle: "kling bundle",
    routingNote: "routing note",
  };
}

describe("mergeGeneratedPackage", () => {
  it("lets AI-enhanced fields override the base package", () => {
    const merged = mergeGeneratedPackage(makeBasePackage(), {
      imagePrompt: "enhanced image",
      hook: "enhanced hook",
      caption: "enhanced caption",
      voiceoverLine: "enhanced voice",
      aiEnhanced: true,
    });

    expect(merged.imagePrompt).toBe("enhanced image");
    expect(merged.hook).toBe("enhanced hook");
    expect(merged.caption).toBe("enhanced caption");
    expect(merged.voiceoverLine).toBe("enhanced voice");
    expect(merged.aiEnhanced).toBe(true);
    expect(merged.negativePrompt).toBe("base negative");
  });

  it("lets final extras override both base and enhanced values", () => {
    const merged = mergeGeneratedPackage(
      makeBasePackage(),
      { hook: "enhanced hook", aiEnhanced: true },
      { hook: "final hook", capCutPlan: "final capcut" }
    );

    expect(merged.hook).toBe("final hook");
    expect(merged.capCutPlan).toBe("final capcut");
    expect(merged.aiEnhanced).toBe(true);
  });
});

describe("hasUsableGeneratedPackageEnhancements", () => {
  it("returns true when a prompt field has usable text", () => {
    expect(hasUsableGeneratedPackageEnhancements({ hook: "Enhanced hook" })).toBe(true);
    expect(hasUsableGeneratedPackageEnhancements({ caption: "  Enhanced caption  " })).toBe(true);
  });

  it("returns false when only metadata or blank strings are present", () => {
    expect(hasUsableGeneratedPackageEnhancements({ aiEnhanced: true })).toBe(false);
    expect(hasUsableGeneratedPackageEnhancements({ hook: "   ", aiEnhanced: true })).toBe(false);
    expect(hasUsableGeneratedPackageEnhancements({ imagePrompt: "" })).toBe(false);
  });
});
