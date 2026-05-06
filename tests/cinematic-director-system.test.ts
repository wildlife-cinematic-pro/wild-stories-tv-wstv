import { describe, expect, it } from "vitest";

import { buildCinematicDirectorPlan } from "@/lib/cinematic-director-system";
import { buildKlingFastOutput } from "@/lib/prompt-builders/kling";
import { buildRunwayFastOutput } from "@/lib/prompt-builders/runway";
import type { QualityOptions } from "@/types";

const quality: QualityOptions = {
  realismMode: "Reference Locked",
  motionOnlyI2V: true,
  referenceLock: true,
  singleActionRule: true,
  microMotion: true,
  heroVeo: false,
};

describe("cinematic director system", () => {
  it("locks the mandatory four-shot sequence and angle progression", () => {
    const plan = buildCinematicDirectorPlan({
      arc: "Ambush attack",
      habitatMode: "land",
      cameraAnglePreset: "Auto",
      sceneDesc: "eye contact freeze before the strike",
    });

    expect(plan.shot1.role).toBe("master");
    expect(plan.shot2.role).toBe("tension");
    expect(plan.shot3.role).toBe("peak");
    expect(plan.shot4.role).toBe("resolution");
    expect(plan.shot1.preset).toBe("Front full-body");
    expect(plan.shot2.preset).toBe("Side profile");
    expect(["Low-angle power", "Ground-level tension", "Side profile", "Over-the-shoulder"]).toContain(
      plan.shot3.preset
    );
    expect(plan.shot4.preset).toBe("Overhead");
    expect(plan.shot2TensionCue).toMatch(/eye contact|slow/i);
    expect(plan.shot3TensionCue).toMatch(/near-attack|delay/i);
    expect(plan.microMovementCue).toMatch(/subtle natural motion/i);
    expect(plan.environmentInteractionCue).toMatch(/terrain response|grounded contact/i);
    expect(plan.shot4EndingCue).toMatch(/resolve|unresolved/i);
  });

  it("keeps Shot 1 stable even when an extreme manual angle is selected", () => {
    const plan = buildCinematicDirectorPlan({
      arc: "Ambush attack",
      habitatMode: "land",
      cameraAnglePreset: "Low-angle power",
      sceneDesc: "stalk pressure through brush",
    });

    expect(plan.shot1.preset).toBe("Front full-body");
    expect(plan.shot3.preset).toBe("Low-angle power");
  });

  it("keeps overhead out of the peak and reserves it for resolution", () => {
    const plan = buildCinematicDirectorPlan({
      arc: "Escape from danger",
      habitatMode: "land",
      cameraAnglePreset: "Overhead",
      sceneDesc: "the prey breaks away across open ground",
    });

    expect(plan.shot3.preset).not.toBe("Overhead");
    expect(plan.shot4.preset).toBe("Overhead");
  });

  it("starts water scenes at waterline and peaks power arcs with low-angle power", () => {
    const plan = buildCinematicDirectorPlan({
      arc: "Defender stands ground",
      habitatMode: "shoreline",
      cameraAnglePreset: "Auto",
      sceneDesc: "near attack pause at the river edge",
    });

    expect(plan.shot1.preset).toBe("Waterline");
    expect(plan.shot3.preset).toBe("Low-angle power");
    expect(plan.shot4.preset).toBe("Overhead");
  });

  it("keeps all four shots visually distinct when the scene could otherwise repeat side or front angles", () => {
    const plan = buildCinematicDirectorPlan({
      arc: "Territory dominance battle",
      habitatMode: "land",
      cameraAnglePreset: "Auto",
      sceneDesc: "the predator advances while the prey freezes in place",
    });

    expect(plan.shot1.preset).toBe("Front full-body");
    expect(plan.shot2.preset).toBe("Side profile");
    expect(plan.shot3.preset).toBe("Ground-level tension");
    expect(plan.shot4.preset).toBe("Overhead");
    expect(new Set([
      plan.shot1.preset,
      plan.shot2.preset,
      plan.shot3.preset,
      plan.shot4.preset,
    ]).size).toBe(4);
  });

  it("formats runway and kling fast output as copy-ready four-shot prompts only", () => {
    const runway = buildRunwayFastOutput(
      "Crocodile",
      "Warthog",
      "Riverbank Reeds",
      "Ambush attack",
      "Golden Hour",
      "Gen-4.5",
      "Raw Tension",
      "National Geographic Wild",
      "Slow push-in near the waterline as the crocodile holds eye contact before the burst.",
      quality,
      "Auto"
    );
    const kling = buildKlingFastOutput(
      "Wolf Pack",
      "Bull Elk",
      "Rocky Mountain meadow",
      "Pack hunting strategy",
      "Dawn",
      "Kling 3.0 Pro",
      "Raw Tension",
      "BBC Earth Documentary",
      "Slow tracking push-in as the pack narrows the lane and the elk braces.",
      quality,
      "Auto"
    );

    for (const output of [runway, kling]) {
      expect(output).toContain("SHOT 1 — MASTER IMAGE PROMPT");
      expect(output).toContain("SHOT 2 — CAMERA ANGLE PROMPT");
      expect(output).toContain("SHOT 3 — CAMERA ANGLE PROMPT");
      expect(output).toContain("SHOT 4 — CAMERA ANGLE PROMPT");
      expect(output).not.toContain("PASTE-READY");
      expect(output).not.toContain("Camera motion:");
      expect(output.match(/SHOT [1-4] —/g)).toHaveLength(4);
    }
  });
  it("adds stronger but still readable motion cues when intensity mode is enabled", () => {
    const intenseQuality: QualityOptions = {
      ...quality,
      intensityMode: true,
    };

    const runway = buildRunwayFastOutput(
      "Mountain Lion",
      "White-tailed Deer",
      "Rocky Mountain meadow",
      "Ambush attack",
      "Golden Hour",
      "Gen-4.5",
      "Raw Tension",
      "National Geographic Wild",
      "Slow push-in as the mountain lion closes space and the deer reacts.",
      intenseQuality,
      "Auto"
    );

    expect(runway).toMatch(/slightly faster|slightly harder|tighter/i);
    expect(runway).toMatch(/readable|without overlap confusion/i);
  });

});
