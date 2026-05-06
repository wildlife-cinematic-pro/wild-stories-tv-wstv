import { describe, expect, it } from "vitest";

import { buildQaSafeSceneDescription } from "@/lib/scene-description-optimizer";
import { analyzePromptHealth } from "@/lib/prompt-health";

describe("buildQaSafeSceneDescription", () => {
  it("includes predator, prey, and a camera cue", () => {
    const description = buildQaSafeSceneDescription({
      predator: "Mountain Lion",
      prey: "White-tailed Deer",
      arc: "Ambush attack",
      habitat: "Rocky Mountain Meadow",
      weather: "Golden Hour",
      contentLane: "Auto",
      finalEnvironment: "Rocky mountain meadow with clear open spacing.",
    });

    expect(description).toContain("Mountain Lion");
    expect(description).toContain("White-tailed Deer");
    expect(description.toLowerCase()).toMatch(/push-in|tracking|documentary|waterline/);
  });

  it("avoids negative wording and multi-shot language", () => {
    const description = buildQaSafeSceneDescription({
      predator: "Wolf Pack",
      prey: "Bull Elk",
      arc: "Pack hunting strategy",
      habitat: "Open Prairie Grassland",
      weather: "Dawn",
      contentLane: "Escape",
      finalEnvironment: "Open prairie grassland with a clear escape lane.",
    }).toLowerCase();

    expect(description).not.toMatch(/\bdo not\b|\bavoid\b|\bwithout\b|\bnever\b|\bdon't\b/);
    expect(description).not.toMatch(/shot\s*1|shot\s*2|0-3s|3-6s|cut to/);
  });

  it("uses waterline wording for water ambush pairs", () => {
    const description = buildQaSafeSceneDescription({
      predator: "Crocodile",
      prey: "Warthog",
      arc: "Ambush attack",
      habitat: "Riverbank Reeds",
      weather: "Golden Hour",
      contentLane: "Fishing Strike",
      finalEnvironment: "Riverbank reeds and muddy waterline.",
    }).toLowerCase();

    expect(description).toContain("waterline");
    expect(description).toContain("surges once");
  });

  it("uses bracing and scale wording for heavy defender setups", () => {
    const description = buildQaSafeSceneDescription({
      predator: "Bison",
      prey: "Wolf Pack",
      arc: "Defender stands ground",
      habitat: "Rocky Mountain Meadow",
      weather: "Overcast",
      contentLane: "Defender",
      finalEnvironment: "Rocky mountain meadow with clear body spacing.",
    }).toLowerCase();

    expect(description).toMatch(/braces|holds its ground|plants and braces/);
    expect(description).toContain("clear scale");
  });

  it("keeps output length in a practical range", () => {
    const description = buildQaSafeSceneDescription({
      predator: "Black Bear",
      prey: "Salmon",
      arc: "Ambush attack",
      habitat: "Auto",
      weather: "Golden Hour",
      contentLane: "Fishing Strike",
      finalEnvironment: "Shallow river bend with clean open water and reeds.",
    });

    expect(description.length).toBeGreaterThanOrEqual(160);
    expect(description.length).toBeLessThanOrEqual(260);
  });

  it("produces a prompt-health friendly one-shot description", () => {
    const description = buildQaSafeSceneDescription({
      predator: "Grizzly Bear",
      prey: "Bison",
      arc: "Defender stands ground",
      habitat: "Rocky Mountain Meadow",
      weather: "Golden Hour",
      contentLane: "Defender",
      finalEnvironment: "Rocky mountain meadow with clean sightlines.",
    });

    const report = analyzePromptHealth({
      prompt: description,
      predatorName: "Grizzly Bear",
      preyName: "Bison",
    });

    expect(["Strong", "Good"]).toContain(report.label);
  });
});
