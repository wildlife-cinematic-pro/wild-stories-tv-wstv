import { describe, expect, it } from "vitest";

import {
  buildModeAwareImageReferencePrompt,
  getStoryModeImageReferenceRoles,
} from "@/lib/story-mode-image-reference-roles";
import { StoryMode, type GeneratedPackage } from "@/types";

function packageFor(input: Partial<GeneratedPackage>): GeneratedPackage {
  return {
    storyMode: StoryMode.PREDATOR_VS_PREY,
    predatorName: "Mountain Lion",
    preyName: "White-tailed Deer",
    environmentName: "Yellowstone forest edge",
    weatherName: "Golden Hour",
    arcName: "Ambush attack",
    ...input,
  } as GeneratedPackage;
}

const EXPECTED_LABELS: Array<[StoryMode, string, string, string]> = [
  [StoryMode.PREDATOR_VS_PREY, "Lead Animal Master Image", "Opposite Animal Master Image", "Environment Master Image"],
  [StoryMode.HERD_DEFENSE, "Herd Master Image", "Threat Master Image", "Environment Master Image"],
  [StoryMode.MOTHER_BABY, "Mother Master Image", "Threat Master Image", "Environment Master Image"],
  [StoryMode.RIVAL_CLASH, "Rival A Master Image", "Rival B Master Image", "Environment Master Image"],
  [StoryMode.NEAR_MISS, "Escape Subject Master Image", "Pressure Subject Master Image", "Environment Master Image"],
  [StoryMode.FISHING_STRIKE, "Striker Master Image", "Fish / Food Source Master Image", "Environment Master Image"],
  [StoryMode.WEATHER_SURVIVAL, "Survival Animal / Group Master Image", "Weather Hazard / Pressure Reference", "Environment Master Image"],
  [StoryMode.MIGRATION, "Migrating Herd Master Image", "Crossing Obstacle / Route Reference", "Environment Master Image"],
  [StoryMode.SCAVENGER_CONFLICT, "Claim Holder Master Image", "Challenger Master Image", "Food Zone / Environment Reference"],
];

describe("story mode image reference roles", () => {
  it.each(EXPECTED_LABELS)("returns mode-aware labels for %s", (storyMode, primary, secondary, environment) => {
    const roles = getStoryModeImageReferenceRoles(packageFor({ storyMode }));

    expect(roles.primaryTitle).toBe(primary);
    expect(roles.secondaryTitle).toBe(secondary);
    expect(roles.environmentTitle).toBe(environment);
  });

  it("keeps Predator vs Prey reference labels backward-compatible", () => {
    const roles = getStoryModeImageReferenceRoles(
      packageFor({
        storyMode: StoryMode.PREDATOR_VS_PREY,
        predatorName: "Mountain Lion",
        preyName: "White-tailed Deer",
      })
    );

    expect(roles.isPredatorVsPrey).toBe(true);
    expect(roles.primaryCopyLabel).toBe("Lead Reference");
    expect(roles.secondaryCopyLabel).toBe("Opposite Reference");
    expect(roles.primaryReferenceLabel).toBe("Lead animal reference image");
    expect(roles.secondaryReferenceLabel).toBe("Opposite animal reference image");
  });

  it("handles non-animal pressure references for weather, migration, fishing, and scavenger modes", () => {
    expect(
      getStoryModeImageReferenceRoles(
        packageFor({
          storyMode: StoryMode.WEATHER_SURVIVAL,
          subjectA: "American Bison",
          subjectB: "Blizzard Wind",
        })
      ).secondaryKind
    ).toBe("hazard");

    expect(
      getStoryModeImageReferenceRoles(
        packageFor({
          storyMode: StoryMode.MIGRATION,
          subjectA: "Caribou Herd",
          subjectB: "River Crossing",
        })
      ).secondaryKind
    ).toBe("route");

    expect(
      getStoryModeImageReferenceRoles(
        packageFor({
          storyMode: StoryMode.FISHING_STRIKE,
          subjectA: "Grizzly Bear",
          subjectB: "Sockeye Salmon",
        })
      ).secondaryKind
    ).toBe("food-source");

    expect(
      getStoryModeImageReferenceRoles(
        packageFor({
          storyMode: StoryMode.SCAVENGER_CONFLICT,
          subjectA: "Bald Eagle",
          subjectB: "Coyote",
          foodItem: "Deer carcass zone",
        })
      ).environmentKind
    ).toBe("food-zone");
  });

  it("builds clean Nano Banana image prompts without aspect ratio or Runway syntax", () => {
    const roles = getStoryModeImageReferenceRoles(
      packageFor({
        storyMode: StoryMode.WEATHER_SURVIVAL,
        subjectA: "American Bison",
        subjectB: "Blizzard Wind",
      })
    );
    const prompt = buildModeAwareImageReferencePrompt({
      subjectName: "Blizzard Wind",
      roleTitle: roles.secondaryTitle,
      kind: roles.secondaryKind,
      preserveLine: roles.secondaryPreserveLine,
      modeLabel: roles.modeLabel,
      relationshipLine: "American Bison pushes through blizzard conditions.",
      sceneGoal: "Weather survival sequence with environmental pressure.",
    });

    expect(prompt).toContain("Nano Banana 2 primary image generation");
    expect(prompt).toContain("do not turn it into an animal character");
    expect(prompt).not.toMatch(/9:16|vertical aspect ratio|Runway|Kling|Seedance|@lead_animal|@opposite_animal|@environment/i);
  });

  it("provides mode-specific merge guidance without predator/prey leakage", () => {
    const nonPredatorModes = [
      StoryMode.HERD_DEFENSE,
      StoryMode.MOTHER_BABY,
      StoryMode.RIVAL_CLASH,
      StoryMode.NEAR_MISS,
      StoryMode.FISHING_STRIKE,
      StoryMode.WEATHER_SURVIVAL,
      StoryMode.MIGRATION,
      StoryMode.SCAVENGER_CONFLICT,
    ];

    for (const storyMode of nonPredatorModes) {
      const roles = getStoryModeImageReferenceRoles(packageFor({ storyMode }));
      const guidance = [
        roles.mergeCompositionLine,
        roles.mergeStageSubjectLine,
        ...Object.values(roles.mergeStageDirections),
      ].join(" ");

      expect(guidance).not.toMatch(/predator\/prey|attack\/escape corridor|both animals/i);
    }

    const weather = getStoryModeImageReferenceRoles(
      packageFor({
        storyMode: StoryMode.WEATHER_SURVIVAL,
        subjectA: "American Bison",
        subjectB: "Blizzard Wind",
      })
    );
    expect(weather.mergeCompositionLine).toContain("environmental scene pressure");
    expect(weather.mergeStageDirections[1]).toContain("no animal opponent required");

    const migration = getStoryModeImageReferenceRoles(
      packageFor({
        storyMode: StoryMode.MIGRATION,
        subjectA: "Caribou Herd",
        subjectB: "River Crossing",
      })
    );
    expect(migration.mergeStageDirections[1]).toContain("route");

    const fishing = getStoryModeImageReferenceRoles(
      packageFor({
        storyMode: StoryMode.FISHING_STRIKE,
        subjectA: "Grizzly Bear",
        subjectB: "Sockeye Salmon",
      })
    );
    expect(fishing.mergeStageDirections[1]).toContain("food-source");

    const scavenger = getStoryModeImageReferenceRoles(
      packageFor({
        storyMode: StoryMode.SCAVENGER_CONFLICT,
        subjectA: "Bald Eagle",
        subjectB: "Coyote",
        foodItem: "Deer carcass zone",
      })
    );
    expect(scavenger.mergeCompositionLine).toContain("non-graphic deer food claim zone");
    expect(scavenger.mergeCompositionLine).toContain("claim-line pressure");
  });

});
