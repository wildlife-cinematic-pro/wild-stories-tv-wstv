import { describe, expect, it } from "vitest";

import {
  buildStep1FacebookRecommendation,
  getArcMicroGuidance,
  getContentLaneMicroGuidance,
  getHabitatOverrideGuidance,
} from "@/lib/step-1-guidance";

describe("Step 1 setup guidance", () => {
  it("surfaces safest, strongest, and fastest Facebook first-test hints", () => {
    const recommendation = buildStep1FacebookRecommendation({
      predator: "Mountain Lion",
      prey: "White-tailed Deer",
      contentLane: "Auto",
      arc: "Ambush attack",
      habitat: "Auto",
      weather: "Golden Hour",
      depthMode: "Balanced Depth",
      driftRisk: "LOW",
    });

    expect(recommendation.title).toContain("Facebook first-test");
    expect(recommendation.hints.map((hint) => hint.label)).toEqual([
      "Safest",
      "Strongest",
      "Fastest",
    ]);
    expect(recommendation.hints[0]?.text).toContain("Auto habitat");
    expect(recommendation.hints[2]?.text).toContain("fast-test friendly");
  });

  it("warns clearly when habitat override may fight lane logic", () => {
    const autoGuidance = getHabitatOverrideGuidance("Auto", "Pack Hunt");
    const manualGuidance = getHabitatOverrideGuidance(
      "Coastal Cliffline",
      "Rut Battle"
    );

    expect(autoGuidance.isWarning).toBe(false);
    expect(autoGuidance.label).toBe("Safest habitat mode");
    expect(manualGuidance.isWarning).toBe(true);
    expect(manualGuidance.message).toContain("Rut Battle lane logic");
    expect(manualGuidance.message).toContain("weaken realism");
  });

  it("keeps Rut Battle guidance specific to body language and standoff cues", () => {
    const laneGuidance = getContentLaneMicroGuidance("Rut Battle");
    const arcGuidance = getArcMicroGuidance("Giant vs giant clash");

    expect(`${laneGuidance} ${arcGuidance}`.toLowerCase()).toMatch(
      /antler|shoulder|footing|standoff/
    );
    expect(`${laneGuidance} ${arcGuidance}`.toLowerCase()).not.toMatch(
      /who wins|comment below|tag a friend/
    );
  });

  it("keeps Step 1 recommendation copy Facebook-first without adding other platform guidance", () => {
    const recommendation = buildStep1FacebookRecommendation({
      predator: "Gray Wolf",
      prey: "Bull Elk",
      contentLane: "Pack Hunt",
      arc: "Pack hunting strategy",
      habitat: "Open Prairie Grassland",
      weather: "Storm",
      depthMode: "Detailed Background",
      driftRisk: "MEDIUM",
    });
    const serialized = JSON.stringify(recommendation).toLowerCase();

    expect(serialized).toContain("facebook");
    expect(serialized).toContain("grouped predators");
    expect(serialized).not.toMatch(/instagram|tiktok/);
  });
});
