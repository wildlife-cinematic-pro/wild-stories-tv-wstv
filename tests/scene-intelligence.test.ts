import { describe, expect, it } from "vitest";

import { buildSceneIntelligenceReport } from "@/lib/scene-intelligence";

describe("buildSceneIntelligenceReport", () => {
  it("flags crocodile and warthog in a forest clearing as a mismatch", () => {
    const report = buildSceneIntelligenceReport({
      predator: "Crocodile",
      prey: "Warthog",
      contentLane: "Fishing Strike",
      arc: "Ambush attack",
      habitat: "Forest Clearing",
      weather: "Golden Hour",
      depthMode: "Balanced Depth",
      cameraAnglePreset: "Front full-body",
      emotionalTone: "Raw Tension",
      animalVibe: "National Geographic Wild",
      environment: "dense green forest clearing",
    });

    expect(["Needs Review", "Risky"]).toContain(report.label);
    expect(report.recommended.habitat).toBe("Riverbank Reeds");
  });

  it("scores crocodile and warthog at riverbank reeds as a stronger fit", () => {
    const report = buildSceneIntelligenceReport({
      predator: "Crocodile",
      prey: "Warthog",
      contentLane: "Fishing Strike",
      arc: "Ambush attack",
      habitat: "Riverbank Reeds",
      weather: "Golden Hour",
      depthMode: "Balanced Depth",
      cameraAnglePreset: "Front full-body",
      emotionalTone: "Raw Tension",
      animalVibe: "National Geographic Wild",
      environment: "muddy riverbank reeds and shallow water edge",
    });

    expect(["Good", "Strong"]).toContain(report.label);
  });

  it("keeps wolf pack and bull elk strong in open prairie grassland", () => {
    const report = buildSceneIntelligenceReport({
      predator: "Wolf Pack",
      prey: "Bull Elk",
      contentLane: "Pack Hunt",
      arc: "Pack hunting strategy",
      habitat: "Open Prairie Grassland",
      weather: "Golden Hour",
      depthMode: "Balanced Depth",
      cameraAnglePreset: "Front full-body",
      emotionalTone: "Raw Tension",
      animalVibe: "National Geographic Wild",
      environment: "wide prairie grassland with a clear chase lane",
    });

    expect(["Good", "Strong"]).toContain(report.label);
  });

  it("keeps bison and wolf pack strong in rocky mountain meadow", () => {
    const report = buildSceneIntelligenceReport({
      predator: "Bison",
      prey: "Wolf Pack",
      contentLane: "Defender",
      arc: "Defender stands ground",
      habitat: "Rocky Mountain Meadow",
      weather: "Golden Hour",
      depthMode: "Balanced Depth",
      cameraAnglePreset: "Front full-body",
      emotionalTone: "Raw Tension",
      animalVibe: "National Geographic Wild",
      environment: "rocky mountain meadow with planted footing",
    });

    expect(["Good", "Strong"]).toContain(report.label);
  });

  it("does not over-reward tiger and deer in an everglades marsh", () => {
    const report = buildSceneIntelligenceReport({
      predator: "Tiger",
      prey: "Deer",
      contentLane: "Escape",
      arc: "Chase and takedown",
      habitat: "Everglades Marsh",
      weather: "Golden Hour",
      depthMode: "Balanced Depth",
      cameraAnglePreset: "Front full-body",
      emotionalTone: "Raw Tension",
      animalVibe: "National Geographic Wild",
      environment: "wet marsh track with reeds and swamp haze",
    });

    expect(report.recommended.habitat).toBe("Auto");
    expect(report.label).not.toBe("Strong");
  });
});
