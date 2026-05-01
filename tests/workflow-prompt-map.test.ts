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

  it("strengthens the environment master reference prompt", () => {
    const prompt = buildEnvironmentMasterReferencePrompt("dense jungle river edge");

    expect(prompt).toContain("Environment only, no animals, no humans");
    expect(prompt).toContain("Open central attack/escape corridor");
    expect(prompt).toContain("clear subject-ready space");
    expect(prompt).toContain("foreground texture");
    expect(prompt).toContain("midground action lane");
    expect(prompt).toContain("layered background depth");
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
