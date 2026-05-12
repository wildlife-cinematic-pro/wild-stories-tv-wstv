import { describe, expect, it } from "vitest";

import {
  buildNanoBananaReferenceTags,
  buildPreparedReferenceBlock,
  buildPreparedReferenceRoleLockBlock,
  withReferenceName,
} from "@/lib/nano-banana-reference-tags";
import { buildReferenceTag } from "@/lib/reference-tags";
import { getStoryModeImageReferenceRoles } from "@/lib/story-mode-image-reference-roles";
import { StoryMode, type GeneratedPackage } from "@/types";

function packageFor(input: Partial<GeneratedPackage>): GeneratedPackage {
  return {
    storyMode: StoryMode.PREDATOR_VS_PREY,
    predatorName: "Grizzly Bear",
    preyName: "Bull Elk",
    subjectA: "Grizzly Bear",
    subjectB: "Bull Elk",
    environmentName: "Yellowstone meadow edge",
    weatherName: "Golden Hour",
    arcName: "Claim-line standoff",
    ...input,
  } as GeneratedPackage;
}

function referenceBlockFor(input: Partial<GeneratedPackage>) {
  const pkg = packageFor(input);
  const roles = getStoryModeImageReferenceRoles(pkg);
  const tags = buildNanoBananaReferenceTags({
    leadAnimalName: pkg.predatorName,
    oppositeAnimalName: pkg.preyName,
    roles,
  });

  return {
    roles,
    tags,
    block: buildPreparedReferenceBlock({
      referenceTags: tags,
      leadAnimalName: pkg.predatorName,
      oppositeAnimalName: pkg.preyName,
      environmentReferenceName:
        roles.environmentKind === "food-zone"
          ? "non-graphic deer food claim zone, food source mostly obscured by grass and terrain, no visible carcass detail, no blood, no gore, no wounds"
          : pkg.environmentName,
      roles,
    }),
  };
}

describe("Nano Banana merge reference tags", () => {
  it("slugifies reference tags safely", () => {
    expect(buildReferenceTag("Grizzly Bear", "animal")).toBe("@grizzly_bear");
    expect(buildReferenceTag("Bull Elk", "animal")).toBe("@bull_elk");
    expect(buildReferenceTag("White-tailed Deer", "animal")).toBe("@white_tailed_deer");
    expect(buildReferenceTag("Mountain Lion", "animal")).toBe("@mountain_lion");
    expect(buildReferenceTag(" Food Zone / Environment Reference ", "environment")).toBe(
      "@food_zone_environment_reference"
    );
    expect(buildReferenceTag("", "food_zone_environment")).toBe("@food_zone_environment");
  });

  it("adds prepared reference names for Step 1 cards", () => {
    expect(withReferenceName("Prompt body", "@grizzly_bear")).toContain(
      "Prepared reference name: @grizzly_bear."
    );
  });

  it("builds Predator vs Prey Step 2 reference blocks with readable @tags", () => {
    const { block, roles } = referenceBlockFor({
      predatorName: "Grizzly Bear",
      preyName: "Bull Elk",
    });
    const text = block.join("\n");

    expect(text).toContain("@grizzly_bear");
    expect(text).toContain("@bull_elk");
    expect(text).toContain("@environment");
    expect(text).toContain("Grizzly Bear identity only");
    expect(text).toContain("Bull Elk identity only");
    expect(text).toContain("environment only: habitat, lighting, terrain");
    expect(text).not.toMatch(/exactly 3 active references/i);
    expect(Object.keys(roles.mergeStageDirections)).toEqual(["1", "2", "3", "4"]);
  });

  it("builds Scavenger Conflict Step 2 reference blocks with food-zone tags and safety wording", () => {
    const { block, roles, tags } = referenceBlockFor({
      storyMode: StoryMode.SCAVENGER_CONFLICT,
      predatorName: "Bald Eagle",
      preyName: "Coyote",
      subjectA: "Bald Eagle",
      subjectB: "Coyote",
      environmentName: "Great Plains golden grass edge",
      foodItem: "Deer carcass zone",
    });
    const text = block.join("\n");
    const directions = Object.values(roles.mergeStageDirections).join(" ");

    expect(tags).toEqual({
      primary: "@bald_eagle",
      secondary: "@coyote",
      environment: "@food_zone_environment",
    });
    expect(text).toContain("@bald_eagle");
    expect(text).toContain("@coyote");
    expect(text).toContain("@food_zone_environment");
    expect(text).toContain("animal-free food-zone/environment only");
    expect(text).toContain("non-graphic food claim zone");
    expect(text).toContain("obscured food source");
    expect(text).toContain("claim-line geography");
    expect(directions).toContain("no visible carcass detail");
    expect(directions).toContain("no blood");
    expect(directions).toContain("no gore");
    expect(directions).toContain("no graphic feeding");
    expect(Object.keys(roles.mergeStageDirections)).toEqual(["1", "2", "3", "4"]);
  });

  it("builds a Wolf vs Bull Elk role-lock block with stable Step 2 tags", () => {
    const pkg = packageFor({
      predatorName: "Wolf",
      preyName: "Bull Elk",
      subjectA: "Wolf",
      subjectB: "Bull Elk",
    });
    const roles = getStoryModeImageReferenceRoles(pkg);
    const tags = buildNanoBananaReferenceTags({
      leadAnimalName: pkg.predatorName,
      oppositeAnimalName: pkg.preyName,
      roles,
    });
    const prompt = buildPreparedReferenceRoleLockBlock({
      referenceTags: tags,
      leadAnimalName: pkg.predatorName,
      oppositeAnimalName: pkg.preyName,
      environmentReferenceName: pkg.environmentName,
      roles,
    });

    expect(prompt).toContain("Use prepared Nano Banana 2 references:");
    expect(prompt).toContain("@wolf");
    expect(prompt).toContain("@bull_elk");
    expect(prompt).toContain("@environment");
  });

  it("keeps copyable Nano Banana role-lock blocks free of Runway and aspect-ratio wording", () => {
    const { block } = referenceBlockFor({
      predatorName: "Grizzly Bear",
      preyName: "Bull Elk",
    });
    const prompt = ["Use prepared Nano Banana 2 references:", ...block].join("\n");

    expect(prompt).not.toMatch(/Runway|active Runway references|9:16|16:9|vertical|horizontal|portrait|landscape|aspect ratio|mobile vertical frame/i);
  });

});
