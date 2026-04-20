import { describe, expect, it } from "vitest";

import { buildConceptVariantLab } from "@/lib/concept-variant-lab";

describe("Concept Variant Lab", () => {
  const baseInput = {
    predator: "Mountain Lion",
    prey: "White-tailed Deer",
    contentLane: "Escape" as const,
    currentArc: "Ambush attack" as const,
    currentHabitat: "Auto" as const,
    presetEnvironment: "Rocky Mountain forest edge and open meadow",
    presetPrey: ["White-tailed Deer", "Mule Deer", "Elk Calf"],
    driftRisk: "HIGH" as const,
    weather: "Golden Hour" as const,
    depthMode: "Balanced Depth" as const,
    durationLane: "short" as const,
    fastPublishMode: true,
    strictOriginalityGuard: true,
    realismMode: "Reference Locked" as const,
    runwayModel: "Gen-4.5" as const,
    klingModel: "Kling 3.0 Pro" as const,
    motionOnlyI2V: true,
    referenceLock: true,
    singleActionRule: true,
    microMotion: true,
    heroVeo: false,
    currentHookFamily: "danger" as const,
  };

  it("builds a ranked set of four to eight unique concept variants", () => {
    const { variants } = buildConceptVariantLab(baseInput);

    expect(variants.length).toBeGreaterThanOrEqual(4);
    expect(variants.length).toBeLessThanOrEqual(8);

    const uniquenessKey = new Set(
      variants.map((variant) =>
        [
          variant.hookFamily,
          variant.arc,
          variant.habitat,
          variant.durationLane,
          String(variant.fastPublishMode),
        ].join("|")
      )
    );

    expect(uniquenessKey.size).toBe(variants.length);
  });

  it("keeps lane-specific escape variants inside realistic nearby alternatives", () => {
    const { variants } = buildConceptVariantLab(baseInput);

    const allowedArcs = new Set<Readonly<string>>([
      "Escape from danger",
      "Ambush attack",
      "Chase and takedown",
    ]);

    for (const variant of variants) {
      expect(allowedArcs.has(variant.arc)).toBe(true);
      expect(variant.laneFitScore).toBeGreaterThanOrEqual(80);
      expect(
        ["Open Prairie Grassland", "Forest Clearing", "Rocky Mountain Meadow"].includes(
          variant.habitat
        )
      ).toBe(true);
      expect(variant.hashtags).toContain("#escape");
    }
  });

  it("picks a lane-native strongest opener for fishing strike setups", () => {
    const { variants, winners } = buildConceptVariantLab({
      ...baseInput,
      predator: "Bald Eagle",
      prey: "Salmon",
      contentLane: "Fishing Strike",
      currentArc: "Ambush attack",
      presetEnvironment: "Cold river shallows with reed-lined bank and low morning mist",
      presetPrey: ["Salmon", "Trout"],
    });

    const strongestOpening = variants.find(
      (variant) => variant.id === winners.bestStrongestOpeningId
    );

    expect(strongestOpening).toBeTruthy();
    expect(["Ambush attack", "Chase and takedown"]).toContain(strongestOpening?.arc);
    expect(strongestOpening?.laneFitScore ?? 0).toBeGreaterThanOrEqual(88);
    expect(
      [
        "Riverbank Reeds",
        "Everglades Marsh",
        "Cypress Swamp Edge",
        "Coastal Cliffline",
      ]
    ).toContain(strongestOpening?.habitat);
    expect(strongestOpening?.hashtags).toContain("#fishingstrike");
  });

  it("preserves promotion-ready fields for lane-aware winners", () => {
    const { variants, winners } = buildConceptVariantLab({
      ...baseInput,
      predator: "Gray Wolf",
      prey: "Bull Elk",
      contentLane: "Pack Hunt",
      currentArc: "Pack hunting strategy",
      currentHabitat: "Open Prairie Grassland",
      presetEnvironment: "Open prairie grassland with rolling sage flats",
      presetPrey: ["Bull Elk", "Bison Calf"],
    });

    expect(winners.bestOverallId).toBeTruthy();
    expect(winners.bestFastPublishId).toBeTruthy();
    expect(winners.bestStrongestOpeningId).toBeTruthy();
    expect(winners.bestRealismId).toBeTruthy();

    for (const variant of variants) {
      expect(variant.sceneDescription.length).toBeGreaterThan(0);
      expect(variant.primaryHook.length).toBeGreaterThan(0);
      expect(variant.caption.length).toBeGreaterThan(0);
      expect(variant.hashtags.split(/\s+/).filter(Boolean)).toHaveLength(5);
      expect(
        variant.pipelineStyle === "4-shot" ||
          variant.pipelineStyle === "long-hybrid-4-shot"
      ).toBe(true);
      expect(variant.overallScore).toBeGreaterThanOrEqual(0);
      expect(variant.overallScore).toBeLessThanOrEqual(100);
      expect(variant.laneFitScore).toBeGreaterThanOrEqual(80);
    }
  });
});
