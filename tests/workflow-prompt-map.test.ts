import { describe, expect, it } from "vitest";

import {
  buildAnimalMasterReferencePrompt,
  buildEnvironmentMasterReferencePrompt,
  buildFinalMergeMasterPrompt,
} from "@/components/output-cards/reference-image-prompts";

describe("hybrid reference image prompts", () => {
  it("strengthens the lead animal master reference prompt", () => {
    const prompt = buildAnimalMasterReferencePrompt({
      subjectName: "Tiger",
      stanceLabel: "alert pre-attack posture",
      identityMarkers:
        "species-specific identity, readable head profile, coat/skin/marking detail, and clear body-scale cues",
      contactLabel: "grounded paw/hoof/foot contact or natural perch contact for bird species",
      role: "lead",
    });

    expect(prompt).toContain("Full body visible");
    expect(prompt).toContain("species-specific identity");
    expect(prompt).toContain("grounded paw/hoof/foot contact");
    expect(prompt).toContain("stable anatomy");
    expect(prompt).toContain("production-ready Runway Gen-4 Image / Gemini-enhanced reference");
    expect(prompt).toContain("No blood");
    expect(prompt).toContain("no gore");
    expect(prompt).toContain("no visible wounds");
  });

  it("strengthens the opposite animal master reference prompt", () => {
    const prompt = buildAnimalMasterReferencePrompt({
      subjectName: "Wild Boar",
      stanceLabel: "alert survival-reaction posture",
      identityMarkers:
        "species-specific identity, readable side profile, coat/skin/marking detail, and clear scale cues",
      contactLabel: "grounded paw/hoof/foot contact or natural perch contact for bird species",
      role: "opposite",
    });

    expect(prompt).toContain("Full body visible");
    expect(prompt).toContain("alert survival-reaction stance");
    expect(prompt).toContain("grounded paw/hoof/foot contact");
    expect(prompt).toContain("stable anatomy");
    expect(prompt).toContain("no gore");
    expect(prompt).toContain("no visible wounds");
  });

  it("keeps the old string environment call backward compatible", () => {
    const prompt = buildEnvironmentMasterReferencePrompt("dense jungle river edge");

    expect(prompt).toContain("Environment only, no animals, no humans");
    expect(prompt).toContain("Open central attack/escape corridor");
    expect(prompt).toContain("clear subject-ready space");
  });

  it("adapts the environment prompt for wolf pack vs bison", () => {
    const prompt = buildEnvironmentMasterReferencePrompt({
      environmentName:
        "South Florida Everglades marsh with sawgrass, shallow reflective water, muddy banks",
      leadAnimalName: "Wolf Pack",
      oppositeAnimalName: "Bison",
      arcName: "Pack hunting strategy",
    });

    expect(prompt).toContain("future Wolf Pack vs Bison scene");
    expect(prompt).toContain("Environment only, no animals, no humans");
    expect(prompt).toMatch(/pack|pressure/i);
    expect(prompt).toMatch(/water-edge|waterline|crossing/i);
    expect(prompt).toContain("clear subject-ready space");
  });

  it("adapts the environment prompt for wild boar vs black bear", () => {
    const prompt = buildEnvironmentMasterReferencePrompt({
      environmentName: "muddy riverbank clearing with reeds and packed shoreline earth",
      leadAnimalName: "Wild Boar",
      oppositeAnimalName: "Black Bear",
      arcName: "Defender standoff",
    });

    expect(prompt).toContain("future Wild Boar vs Black Bear scene");
    expect(prompt).toMatch(/confrontation|charge lane|muddy-bank/i);
  });

  it("adapts the environment prompt for fox vs rabbit", () => {
    const prompt = buildEnvironmentMasterReferencePrompt({
      environmentName: "short meadow grass with brush pockets and narrow ground trails",
      leadAnimalName: "Fox",
      oppositeAnimalName: "Rabbit",
      arcName: "Fast chase break",
    });

    expect(prompt).toContain("future Fox vs Rabbit scene");
    expect(prompt).toMatch(/low|narrow|zigzag escape/i);
  });

  it("keeps the final merge prompt on exactly three active references", () => {
    const prompt = buildFinalMergeMasterPrompt({
      leadAnimalName: "Crocodile",
      oppositeAnimalName: "Warthog",
      environmentName: "muddy African watering hole",
      leadTag: "LEAD_REF",
      oppositeTag: "OPPOSITE_REF",
      environmentTag: "ENV_REF",
    });

    expect(prompt).toContain("Use exactly 3 active Runway references: LEAD_REF, OPPOSITE_REF, ENV_REF.");
    expect(prompt).toContain("readable pressure-ready posture");
    expect(prompt).toContain("readable survival-reaction posture");
    expect(prompt).toContain("one clear open attack/escape corridor");
  });
});
