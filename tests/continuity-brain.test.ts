import { describe, expect, it } from "vitest";

import {
  CONTINUITY_APPENDIX_HEADER,
  CONTINUITY_PROMPT_BLOCK_HEADER,
  appendContinuityBlockToPrompt,
  buildContinuityBrain,
  buildContinuityPromptHistoryMetadata,
  buildContinuityRepairInstruction,
  formatContinuityAppendix,
  validateRunwayReferenceTags,
} from "@/lib/continuity-brain";
import { HabitatRegion, StoryMode, ViolenceLevel } from "@/types";

describe("continuity brain", () => {
  const brain = buildContinuityBrain({
    storyMode: StoryMode.PREDATOR_VS_PREY,
    animalA: "Bison mother",
    animalB: "Wolf pack",
    habitatRegion: HabitatRegion.YELLOWSTONE,
    season: "FALL",
    timeOfDay: "GOLDEN_HOUR",
    contentLane: "Mother Defense",
    actionStyle: "Natural tension",
    cameraAnglePreset: "Ground-level tension",
    finalEnvironment: "Yellowstone meadow with sagebrush and a pine treeline",
    violenceLevel: ViolenceLevel.IMPLIED_PRESSURE,
  });

  it("builds a four-shot continuity memory without changing shot count", () => {
    expect(brain.version).toBe("wstv-continuity-brain-v1");
    expect(brain.shots).toHaveLength(4);
    expect(brain.shots.map((shot) => shot.role)).toEqual([
      "hook",
      "trigger",
      "peak",
      "unresolved",
    ]);
  });

  it("keeps Runway constrained to exactly three references", () => {
    expect(brain.engineRules.runway.join(" ")).toContain(
      "exactly three references: @animalA, @animalB, @environment"
    );
    expect(brain.engineRules.runway.join(" ")).toContain("never exceed three references");
  });

  it("keeps existing prompt behavior when the continuity toggle is off", () => {
    const basePrompt = "Base Runway motion prompt.";

    expect(appendContinuityBlockToPrompt(basePrompt, brain, false)).toBe(basePrompt);
  });

  it("formats the continuity appendix with all required lock sections", () => {
    const appendix = formatContinuityAppendix(brain, { engine: "runway" });

    expect(appendix).toContain(CONTINUITY_APPENDIX_HEADER);
    expect(appendix).toContain("Animal identity lock:");
    expect(appendix).toContain("Environment lock:");
    expect(appendix).toContain("Camera/lens lock:");
    expect(appendix).toContain("4-shot role lock:");
    expect(appendix).toContain("Engine-specific lock:");
    expect(appendix).toContain("Negative constraints:");
    expect(appendix).toContain("exactly three references: @animalA, @animalB, @environment");
  });

  it("adds a continuity appendix when the continuity toggle is on", () => {
    const output = appendContinuityBlockToPrompt("Base prompt.", brain, true);

    expect(output).toContain("Base prompt.");
    expect(output).toContain(CONTINUITY_PROMPT_BLOCK_HEADER);
    expect(output).toContain(CONTINUITY_APPENDIX_HEADER);
    expect(output).toContain("Bison mother");
    expect(output).toContain("Wolf pack");
  });

  it("validates the exact Runway three-reference rule", () => {
    expect(validateRunwayReferenceTags("@animalA @animalB @environment")).toMatchObject({
      valid: true,
      missing: [],
      extra: [],
      duplicate: [],
    });
    expect(validateRunwayReferenceTags("@animalA @animalB @environment @extra")).toMatchObject({
      valid: false,
      extra: ["@extra"],
    });
    expect(validateRunwayReferenceTags("@animalA @animalA @environment")).toMatchObject({
      valid: false,
      missing: ["@animalB"],
      duplicate: ["@animalA"],
    });
  });

  it("prepares prompt history metadata without writing storage", () => {
    const metadata = buildContinuityPromptHistoryMetadata(brain, {
      projectId: "project-1",
      createdAt: "2026-05-19T00:00:00.000Z",
      engine: "runway",
      promptVersionId: "v1",
    });

    expect(metadata).toEqual({
      projectId: "project-1",
      createdAt: "2026-05-19T00:00:00.000Z",
      animalA: "Bison mother",
      animalB: "Wolf pack",
      environment: "Yellowstone meadow with sagebrush and a pine treeline",
      engine: "runway",
      continuityEnabled: true,
      promptVersionId: "v1",
    });
  });

  it("creates targeted repair instructions without rewriting unrelated sections", () => {
    const repair = buildContinuityRepairInstruction(
      brain,
      ["identity drift", "wrong habitat"],
      "Base prompt."
    );

    expect(repair).toContain("Targeted repair only");
    expect(repair).toContain("Fix selected issues: identity drift, wrong habitat");
    expect(repair).toContain("Bison mother");
    expect(repair).toContain("Wolf pack");
  });
});
