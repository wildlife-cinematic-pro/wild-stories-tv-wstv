import { describe, expect, it } from "vitest";

import { normalizeScavengerFoodZone } from "@/lib/scavenger-food-zone";
import {
  buildStoryModeImagePrompt,
  buildStoryModePackageOverrides,
  buildStoryModePromptContext,
} from "@/lib/story-mode-prompt-context";
import {
  buildModeAwareImageReferencePrompt,
  getStoryModeImageReferenceRoles,
} from "@/lib/story-mode-image-reference-roles";
import { StoryMode, type GeneratedPackage } from "@/types";

const SAFE_DEER_ZONE =
  "non-graphic deer food claim zone, food source mostly obscured by grass and terrain, no visible carcass detail, no blood, no gore, no wounds";

function packageFor(input: Partial<GeneratedPackage>): GeneratedPackage {
  return {
    storyMode: StoryMode.SCAVENGER_CONFLICT,
    predatorName: "Bald Eagle",
    preyName: "Coyote",
    subjectA: "Bald Eagle",
    subjectB: "Coyote",
    environmentName: "Great Plains golden grass edge",
    weatherName: "Golden Hour",
    arcName: "Ownership standoff",
    foodItem: "Deer carcass zone",
    ...input,
  } as GeneratedPackage;
}

function stripNegatedSafety(text: string) {
  return text.replace(/\b(no|without|avoid|avoids|forbid|forbids|forbidden)\s+[^.\n]*(blood|gore|visible carcass detail|visible injur(?:y|ies)|visible wounds?|wounds?|graphic feeding|exposed flesh|graphic carcass detail|dead animal)[^.\n]*/gi, "");
}

describe("Scavenger Conflict food-zone polish", () => {
  it("transforms deer carcass wording into a safer food claim zone", () => {
    expect(normalizeScavengerFoodZone("Deer carcass zone")).toBe(SAFE_DEER_ZONE);
    expect(normalizeScavengerFoodZone("visible carcass")).toBe(
      "non-graphic food claim zone, food source mostly obscured by grass and terrain, no visible carcass detail, no blood, no gore, no wounds"
    );
  });

  it("uses the safer food claim zone inside Scavenger Conflict prompt context", () => {
    const context = buildStoryModePromptContext({
      storyMode: StoryMode.SCAVENGER_CONFLICT,
      subjectA: "Bald Eagle",
      subjectB: "Coyote",
      foodItem: "Deer carcass zone",
    });
    const imagePrompt = buildStoryModeImagePrompt(context);
    const positiveText = stripNegatedSafety(imagePrompt);

    expect(context.groupLine).toContain(SAFE_DEER_ZONE);
    expect(context.relationshipLine).toContain(SAFE_DEER_ZONE);
    expect(context.sceneGoal).toContain("cinematic claim-line pressure");
    expect(positiveText).not.toMatch(/deer carcass zone|carcass zone|dead animal|blood|gore/i);
  });

  it("keeps Scavenger Conflict negative wording explicit and non-graphic", () => {
    const overrides = buildStoryModePackageOverrides(
      {
        storyMode: StoryMode.SCAVENGER_CONFLICT,
        subjectA: "Bald Eagle",
        subjectB: "Coyote",
        foodItem: "Deer carcass zone",
      },
      packageFor({})
    );

    expect(overrides?.klingFramesPrompt).toContain(
      "Negative prompt: no blood, no gore, no visible wounds, no visible injury"
    );
    expect(overrides?.klingFramesPrompt).toContain("no graphic carcass detail");
  });

  it("keeps the Food Zone / Environment Reference animal-free", () => {
    const roles = getStoryModeImageReferenceRoles(packageFor({}));
    const prompt = buildModeAwareImageReferencePrompt({
      subjectName: normalizeScavengerFoodZone("Deer carcass zone"),
      roleTitle: roles.environmentTitle,
      kind: roles.environmentKind,
      preserveLine: roles.environmentPreserveLine,
      modeLabel: roles.modeLabel,
      relationshipLine: "Bald Eagle holds the claim line while Coyote tests the edge.",
      sceneGoal: "Scavenger conflict with an obscured food source.",
    });

    expect(roles.environmentTitle).toBe("Food Zone / Environment Reference");
    expect(prompt).toContain("animal-free non-graphic food-zone/environment reference");
    expect(prompt).toContain("No animals unless the role specifically requires tiny scale context");
    expect(prompt).toContain(SAFE_DEER_ZONE);
  });

  it("polishes Scavenger Conflict merge beats as cinematic non-graphic claim-line pressure", () => {
    const roles = getStoryModeImageReferenceRoles(packageFor({}));
    const directions = Object.values(roles.mergeStageDirections).join(" ");

    expect(roles.mergeCompositionLine).toContain("guarded claim posture");
    expect(roles.mergeCompositionLine).toContain("one open lane");
    expect(directions).toContain("watches from the edge");
    expect(directions).toContain("opens its wings slightly in a defensive display");
    expect(stripNegatedSafety(directions)).not.toMatch(/blood|gore|deer carcass zone/i);
  });

  it("leaves non-Scavenger story mode relationship wording unchanged", () => {
    const context = buildStoryModePromptContext({
      storyMode: StoryMode.HERD_DEFENSE,
      subjectA: "Bison Herd",
      subjectB: "Wolf Pack",
      groupCount: 12,
    });

    expect(context.relationshipLine).toBe(
      "Bison Herd forms a defensive wall while Wolf Pack pressures the edge of the open lane."
    );
  });
});
