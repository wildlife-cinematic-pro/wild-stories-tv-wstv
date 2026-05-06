import { describe, expect, it } from "vitest";

import {
  buildSceneIntelligenceReport,
  buildScenePresetOptions,
} from "@/lib/scene-intelligence";

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

  it("does not send grizzly bear and bison to riverbank reeds", () => {
    const report = buildSceneIntelligenceReport({
      predator: "Grizzly Bear",
      prey: "Bison",
      contentLane: "Defender",
      arc: "Defender stands ground",
      habitat: "Auto",
      weather: "Golden Hour",
      depthMode: "Balanced Depth",
      cameraAnglePreset: "Front full-body",
      emotionalTone: "Raw Tension",
      animalVibe: "National Geographic Wild",
      environment: "wide mountain meadow with planted footing",
    });

    expect(report.recommended.habitat).not.toBe("Riverbank Reeds");
  });

  it("does not send golden eagle and rabbit to riverbank reeds", () => {
    const report = buildSceneIntelligenceReport({
      predator: "Golden Eagle",
      prey: "Rabbit",
      contentLane: "Escape",
      arc: "Ambush attack",
      habitat: "Auto",
      weather: "Golden Hour",
      depthMode: "Balanced Depth",
      cameraAnglePreset: "Front full-body",
      emotionalTone: "Raw Tension",
      animalVibe: "National Geographic Wild",
      environment: "open highland scrub ridge",
    });

    expect(report.recommended.habitat).not.toBe("Riverbank Reeds");
  });

  it("recommends riverbank reeds for black bear and salmon", () => {
    const report = buildSceneIntelligenceReport({
      predator: "Black Bear",
      prey: "Salmon",
      contentLane: "Fishing Strike",
      arc: "Ambush attack",
      habitat: "Auto",
      weather: "Golden Hour",
      depthMode: "Balanced Depth",
      cameraAnglePreset: "Front full-body",
      emotionalTone: "Raw Tension",
      animalVibe: "National Geographic Wild",
      environment: "cold river bend with moving water",
    });

    expect(report.recommended.habitat).toBe("Riverbank Reeds");
  });

  it("recommends riverbank reeds for bald eagle and salmon", () => {
    const report = buildSceneIntelligenceReport({
      predator: "Bald Eagle",
      prey: "Salmon",
      contentLane: "Fishing Strike",
      arc: "Ambush attack",
      habitat: "Auto",
      weather: "Golden Hour",
      depthMode: "Balanced Depth",
      cameraAnglePreset: "Front full-body",
      emotionalTone: "Raw Tension",
      animalVibe: "National Geographic Wild",
      environment: "rocky river edge with visible shallows",
    });

    expect(report.recommended.habitat).toBe("Riverbank Reeds");
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


describe("buildScenePresetOptions", () => {
  it("returns the safest preset with auto habitat and documentary defaults", () => {
    const input = {
      predator: "Crocodile",
      prey: "Warthog",
      contentLane: "Fishing Strike" as const,
      arc: "Ambush attack" as const,
      habitat: "Forest Clearing" as const,
      weather: "Golden Hour" as const,
      depthMode: "Balanced Depth" as const,
      cameraAnglePreset: "Front full-body" as const,
      emotionalTone: "Raw Tension" as const,
      animalVibe: "National Geographic Wild" as const,
      environment: "dry forest clearing",
    };
    const report = buildSceneIntelligenceReport(input);
    const [safest] = buildScenePresetOptions(report, input);

    expect(safest).toMatchObject({
      label: "Safest",
      habitat: "Auto",
      weather: "Golden Hour",
      depthMode: "Balanced Depth",
      cameraAnglePreset: "Front full-body",
      emotionalTone: "Raw Tension",
      animalVibe: "BBC Earth Documentary",
    });
  });

  it("returns a viral preset that keeps safer tone for water ambush pairs", () => {
    const input = {
      predator: "Crocodile",
      prey: "Warthog",
      contentLane: "Fishing Strike" as const,
      arc: "Ambush attack" as const,
      habitat: "Forest Clearing" as const,
      weather: "Golden Hour" as const,
      depthMode: "Balanced Depth" as const,
      cameraAnglePreset: "Front full-body" as const,
      emotionalTone: "Raw Tension" as const,
      animalVibe: "National Geographic Wild" as const,
      environment: "muddy water edge",
    };
    const report = buildSceneIntelligenceReport(input);
    const presets = buildScenePresetOptions(report, input);
    const viral = presets.find((preset) => preset.label === "Most Viral");

    expect(viral).toMatchObject({
      habitat: "Riverbank Reeds",
      weather: "Golden Hour",
      depthMode: "Balanced Depth",
      emotionalTone: "Raw Tension",
      animalVibe: "National Geographic Wild",
    });
  });

  it("returns a realistic preset with documentary tone and detailed background", () => {
    const input = {
      predator: "Bison",
      prey: "Wolf Pack",
      contentLane: "Defender" as const,
      arc: "Defender stands ground" as const,
      habitat: "Auto" as const,
      weather: "Golden Hour" as const,
      depthMode: "Balanced Depth" as const,
      cameraAnglePreset: "Front full-body" as const,
      emotionalTone: "Raw Tension" as const,
      animalVibe: "National Geographic Wild" as const,
      environment: "rocky meadow with planted footing",
    };
    const report = buildSceneIntelligenceReport(input);
    const presets = buildScenePresetOptions(report, input);
    const realistic = presets.find(
      (preset) => preset.label === "Most Realistic"
    );

    expect(realistic).toMatchObject({
      habitat: "Rocky Mountain Meadow",
      weather: "Dawn",
      depthMode: "Detailed Background",
      cameraAnglePreset: "Front full-body",
      emotionalTone: "Calm Dominance",
      animalVibe: "BBC Earth Documentary",
    });
  });
});
