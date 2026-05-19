import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CONTINUITY_APPENDIX_HEADER,
  CONTINUITY_PROMPT_BLOCK_HEADER,
  appendContinuityBlockToPrompt,
  buildContinuityBrain,
  buildContinuityPromptHistoryMetadata,
  buildContinuityRepairInstruction,
  buildContinuityRepairPrompt,
  buildWstvLocalStudioDraftMetadata,
  formatContinuityAppendix,
  validateRunwayReferenceTags,
} from "@/lib/continuity-brain";
import {
  WSTV_LOCAL_STUDIO_CONTINUITY_DRAFTS_KEY,
  clearWstvLocalStudioContinuityDrafts,
  readWstvLocalStudioContinuityDrafts,
  removeWstvLocalStudioContinuityDraft,
  saveWstvLocalStudioContinuityDraft,
} from "@/lib/storage";
import { HabitatRegion, StoryMode, ViolenceLevel } from "@/types";

function installLocalStorageMock() {
  const store = new Map<string, string>();

  vi.stubGlobal("window", {});
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  });

  return store;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

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

  it("builds local repair prompts for selected continuity failures", () => {
    const repair = buildContinuityRepairPrompt({
      basePrompt: "Base prompt with bison and wolves in Yellowstone.",
      brain,
      selectedFailures: ["identity drift", "wrong habitat"],
      targetEngine: "runway",
    });

    expect(repair.correctedPrompt).toContain("Base prompt with bison and wolves in Yellowstone.");
    expect(repair.correctedPrompt).toContain("WSTV TARGETED REPAIR PASS");
    expect(repair.correctedPrompt).toContain("Lock identity");
    expect(repair.correctedPrompt).toContain("Preserve habitat exactly");
    expect(repair.correctedPrompt).toContain("Target engine: runway");
    expect(repair.appliedFixes).toHaveLength(2);
  });

  it("adds stronger motion correction for weak motion", () => {
    const repair = buildContinuityRepairPrompt({
      basePrompt: "Base motion prompt.",
      brain,
      selectedFailures: ["weak motion"],
    });

    expect(repair.correctedPrompt).toContain("Strengthen motion");
    expect(repair.correctedPrompt).toContain("one dominant readable movement beat");
  });

  it("adds clear-air constraints for excessive dust", () => {
    const repair = buildContinuityRepairPrompt({
      basePrompt: "Base motion prompt.",
      brain,
      selectedFailures: ["excessive dust"],
    });

    expect(repair.correctedPrompt).toContain("Keep air clear");
    expect(repair.correctedPrompt).toContain("no dust clouds");
  });

  it("returns a safe no-op repair message when no issues are selected", () => {
    const basePrompt = "Base motion prompt stays untouched.";
    const repair = buildContinuityRepairPrompt({
      basePrompt,
      brain,
      selectedFailures: [],
    });

    expect(repair.correctedPrompt).toBe(basePrompt);
    expect(repair.repairSummary).toContain("No repair issues selected");
    expect(repair.appliedFixes).toEqual([]);
  });
  it("creates local studio draft metadata without writing storage", () => {
    const metadata = buildWstvLocalStudioDraftMetadata({
      id: "draft-1",
      createdAt: "2026-05-19T01:00:00.000Z",
      brain,
      engine: "kling",
      continuityEnabled: true,
      repairReasons: ["identity drift", "wrong habitat", "unknown"],
      promptPreview: "Base prompt preview",
      repairedPromptPreview: "Repaired prompt preview",
      sourcePromptVersionId: "version-1",
    });

    expect(metadata).toEqual({
      id: "draft-1",
      createdAt: "2026-05-19T01:00:00.000Z",
      animalA: "Bison mother",
      animalB: "Wolf pack",
      environment: "Yellowstone meadow with sagebrush and a pine treeline",
      engine: "kling",
      continuityEnabled: true,
      repairReasons: ["identity drift", "wrong habitat"],
      promptPreview: "Base prompt preview",
      repairedPromptPreview: "Repaired prompt preview",
      sourcePromptVersionId: "version-1",
    });
  });

  it("keeps local studio draft creation as a no-op for prompt text", () => {
    const promptPreview = "Original prompt preview remains exact.";
    const repairedPromptPreview = "Original prompt preview remains exact.\n\nWSTV TARGETED REPAIR PASS";
    const metadata = buildWstvLocalStudioDraftMetadata({
      id: "draft-no-op",
      createdAt: "2026-05-19T01:05:00.000Z",
      brain,
      continuityEnabled: false,
      repairReasons: [],
      promptPreview,
      repairedPromptPreview,
    });

    expect(metadata.promptPreview).toBe(promptPreview);
    expect(metadata.repairedPromptPreview).toBe(repairedPromptPreview);
    expect(metadata.continuityEnabled).toBe(false);
  });

  it("keeps continuity repair previews separate from the main prompt", () => {
    const basePrompt = "Main prompt remains untouched.";
    const repair = buildContinuityRepairPrompt({
      basePrompt,
      brain,
      selectedFailures: ["weak motion"],
    });
    const metadata = buildWstvLocalStudioDraftMetadata({
      id: "draft-repair",
      createdAt: "2026-05-19T01:10:00.000Z",
      brain,
      continuityEnabled: true,
      repairReasons: ["weak motion"],
      promptPreview: basePrompt,
      repairedPromptPreview: repair.correctedPrompt,
    });

    expect(metadata.promptPreview).toBe(basePrompt);
    expect(metadata.repairedPromptPreview).toContain("WSTV TARGETED REPAIR PASS");
    expect(metadata.promptPreview).not.toContain("WSTV TARGETED REPAIR PASS");
  });
  it("saves continuity drafts only to the WSTV local studio key", () => {
    const store = installLocalStorageMock();
    store.set("wildlife_versions_v1", "{\"keep\":true}");
    store.set("wildlife_last_generated_output_v1", "{\"keep\":true}");

    const draft = buildWstvLocalStudioDraftMetadata({
      id: "draft-save",
      createdAt: "2026-05-19T02:00:00.000Z",
      brain,
      engine: "all",
      continuityEnabled: true,
      repairReasons: ["identity drift"],
      promptPreview: "Base prompt stays separate.",
      repairedPromptPreview: "Repaired prompt stays separate.",
    });

    saveWstvLocalStudioContinuityDraft(draft);

    expect(store.has(WSTV_LOCAL_STUDIO_CONTINUITY_DRAFTS_KEY)).toBe(true);
    expect(store.get("wildlife_versions_v1")).toBe("{\"keep\":true}");
    expect(store.get("wildlife_last_generated_output_v1")).toBe("{\"keep\":true}");
    expect(readWstvLocalStudioContinuityDrafts()).toEqual([draft]);
  });

  it("removes and clears saved continuity drafts without touching existing keys", () => {
    const store = installLocalStorageMock();
    store.set("wildlife_favorites_v1", "[]");
    const first = buildWstvLocalStudioDraftMetadata({
      id: "draft-first",
      createdAt: "2026-05-19T02:05:00.000Z",
      brain,
      continuityEnabled: true,
      repairReasons: [],
      promptPreview: "First prompt",
    });
    const second = buildWstvLocalStudioDraftMetadata({
      id: "draft-second",
      createdAt: "2026-05-19T02:06:00.000Z",
      brain,
      continuityEnabled: true,
      repairReasons: ["weak motion"],
      promptPreview: "Second prompt",
      repairedPromptPreview: "Second repaired prompt",
    });

    saveWstvLocalStudioContinuityDraft(first);
    saveWstvLocalStudioContinuityDraft(second);
    removeWstvLocalStudioContinuityDraft("draft-first");

    expect(readWstvLocalStudioContinuityDrafts().map((draft) => draft.id)).toEqual([
      "draft-second",
    ]);

    clearWstvLocalStudioContinuityDrafts();

    expect(readWstvLocalStudioContinuityDrafts()).toEqual([]);
    expect(store.get("wildlife_favorites_v1")).toBe("[]");
  });

  it("keeps saved repaired prompts separate from the main prompt output", () => {
    installLocalStorageMock();
    const basePrompt = "Main prompt output stays exact.";
    const repair = buildContinuityRepairPrompt({
      basePrompt,
      brain,
      selectedFailures: ["weak motion"],
    });
    const draft = buildWstvLocalStudioDraftMetadata({
      id: "draft-separate",
      createdAt: "2026-05-19T02:10:00.000Z",
      brain,
      continuityEnabled: true,
      repairReasons: ["weak motion"],
      promptPreview: basePrompt,
      repairedPromptPreview: repair.correctedPrompt,
    });

    saveWstvLocalStudioContinuityDraft(draft);
    const [saved] = readWstvLocalStudioContinuityDrafts();

    expect(saved?.promptPreview).toBe(basePrompt);
    expect(saved?.repairedPromptPreview).toContain("WSTV TARGETED REPAIR PASS");
    expect(saved?.promptPreview).not.toContain("WSTV TARGETED REPAIR PASS");
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
