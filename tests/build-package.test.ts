import { describe, expect, it } from "vitest";

import { StoryMode, ViolenceLevel } from "@/types";

import {
  buildGeneratedPackageDraft,
  buildOpeningFrameInput,
  finalizeGeneratedPackageDraft,
  type GeneratedPackageDraftInput,
} from "@/lib/build-package";

function makeDraftInput(
  overrides: Partial<GeneratedPackageDraftInput> = {}
): GeneratedPackageDraftInput {
  const quality = {
    realismMode: "Reference Locked" as const,
    motionOnlyI2V: true,
    referenceLock: true,
    singleActionRule: true,
    microMotion: true,
    heroVeo: false,
  };

  return {
    predator: "Mountain Lion",
    prey: "Mule Deer",
    presetLighting: "golden hour rim light",
    presetCameraGear: "Canon EOS R5, 200mm wildlife lens",
    presetTexture: "natural fur breakup and clean paw detail",
    presetDriftRisk: "MEDIUM",
    presetForIdeas: {
      prey: ["Mule Deer", "Elk"],
      environment: "Rocky Mountain meadow",
      lighting: "golden hour rim light",
      cameraGear: "Canon EOS R5, 200mm wildlife lens",
      texture: "natural fur breakup and clean paw detail",
      defaultArc: "Ambush attack",
      driftRisk: "MEDIUM",
    },
    finalEnvironment: "Rocky Mountain meadow",
    finalArc: "Ambush attack",
    contentLane: "Auto",
    cameraAnglePreset: "Auto",
    weather: "Golden Hour",
    depthMode: "Balanced Depth",
    emotionalTone: "Raw Tension",
    animalVibe: "BBC Earth Documentary",
    runwayModel: "Gen-4.5",
    klingModel: "Kling 3.0 Pro",
    durationLane: "long",
    marketMode: "US_ONLY",
    fastPublishMode: false,
    strictOriginalityGuard: true,
    selectedPipelineStyle: "long-hybrid-4-shot",
    sceneInject:
      "Readable mountain standoff with clean spacing and first-frame tension.",
    quality,
    finalHook2026: [
      "The deer turns too late.",
      "The mountain silence breaks first.",
      "One step changes the whole frame.",
    ],
    finalHook: "The deer turns too late.",
    shortCaption: "A readable mountain standoff breaks in seconds.",
    longCaption:
      "A mountain lion closes the gap on a mule deer in a clean readable opening that holds tension before the pressure snaps shut.",
    hashtags: "#wildlife #nature #mountainlion #muledeer #wstv",
    tags: "wildlife,nature,mountain lion,mule deer",
    recommendedHookIndex: 0,
    hookFamily: "danger",
    usAudienceScore: {
      total: 86,
      speciesScore: 28,
      environmentScore: 29,
      arcScore: 29,
      summary: "Strong U.S. wildlife concept with clear conflict.",
    },
    openingFrameInput: buildOpeningFrameInput(
      "Ambush attack",
      "Balanced Depth",
      true,
      true,
      true,
      false,
      "danger"
    ),
    openingFrameScore: {
      total: 82,
      summary: "Opening frame reads clearly.",
    },
    ...overrides,
  };
}

describe("build-package refactor seam", () => {
  it("builds the primary hybrid draft in Runway / Kling / Kling / Runway order", () => {
    const draft = buildGeneratedPackageDraft(makeDraftInput());

    expect(draft.basePkg.shotPlan.map((shot) => shot.engine)).toEqual([
      "RUNWAY",
      "KLING",
      "KLING",
      "RUNWAY",
    ]);

    expect(
      draft.basePkg.structuredPrompts?.workflowShots?.map(
        (shot) => shot.metadata?.engine
      )
    ).toEqual(["runway", "kling", "kling", "runway"]);

    expect(draft.basePkg.routingNote).toContain("Runway Gen-4.5");
    expect(draft.basePkg.routingNote).toContain("Kling 3.0 Pro");
    expect(draft.basePkg.routingNote).not.toContain("Kling Kling");
  });

  it("records the expanded selected video model without changing legacy outputs", () => {
    const draft = buildGeneratedPackageDraft(
      makeDraftInput({
        selectedVideoModelId: "seedance-2",
        selectedVideoProviderGroup: "SEEDANCE_DIRECT",
        runwayModel: "Gen-4.5",
        klingModel: "Kling 3.0 Pro",
      })
    );

    expect(draft.basePkg.selectedVideoModel).toMatchObject({
      id: "seedance-2",
      label: "Seedance 2",
      providerGroup: "SEEDANCE_DIRECT",
      routeLabel: "Direct Seedance video route",
      needsVerification: true,
    });
    expect(draft.basePkg.modelsUsed).toMatchObject({
      runway: "Gen-4.5",
      kling: "Kling 3.0 Pro",
    });
    expect(draft.basePkg.primaryVideoRoute).toMatchObject({
      kind: "hybrid",
      label: "Primary Route: Hybrid 4-shot",
      workspaceTab: "hybrid",
      hybridProtected: true,
    });
    expect(draft.basePkg.seedanceShots.length).toBeGreaterThan(0);
    expect(draft.basePkg.runwayShots.length).toBeGreaterThan(0);
    expect(draft.basePkg.klingShots.length).toBeGreaterThan(0);
    expect(draft.basePkg.shotPlan.map((shot) => shot.engine)).toEqual([
      "RUNWAY",
      "KLING",
      "KLING",
      "RUNWAY",
    ]);
  });

  it("keeps short, medium, and long lane generation durations inside the WSTV plan", () => {
    const shortDraft = buildGeneratedPackageDraft(
      makeDraftInput({ durationLane: "short", selectedPipelineStyle: "4-shot" })
    );
    const mediumDraft = buildGeneratedPackageDraft(
      makeDraftInput({ durationLane: "medium", selectedPipelineStyle: "4-shot" })
    );
    const longDraft = buildGeneratedPackageDraft(
      makeDraftInput({ durationLane: "long", selectedPipelineStyle: "long-hybrid-4-shot" })
    );

    expect(shortDraft.basePkg.shotPlan.map((shot) => shot.generationDurationLabel)).toEqual([
      "Generation duration: 5s",
      "Generation duration: 5s",
      "Generation duration: 5s",
      "Generation duration: 5s",
    ]);
    expect(mediumDraft.basePkg.shotPlan.map((shot) => shot.generationDurationLabel)).toEqual([
      "Generation duration: 10s",
      "Generation duration: 10s",
      "Generation duration: 10s",
      "Generation duration: 5s",
    ]);
    expect(longDraft.basePkg.shotPlan.map((shot) => shot.generationDurationLabel)).toEqual([
      "Generation duration: 10s",
      "Generation duration: 10s",
      "Generation duration: 10s",
      "Generation duration: 10s",
    ]);

    expect(mediumDraft.basePkg.routingNote).toContain("Shot 2 (10s)");
    expect(mediumDraft.basePkg.routingNote).toContain("Shot 4 (5s)");
    expect(longDraft.basePkg.routingNote).not.toMatch(/\b15s\b/);
  });
  it("aligns the publish summary hook with the packaged Facebook hook", () => {
    const draft = buildGeneratedPackageDraft(makeDraftInput());
    const { publishFlowSummary } = finalizeGeneratedPackageDraft(draft);

    expect(draft.basePkg.platformPack?.facebook.hook).toBe(draft.primaryHook);
    expect(draft.basePkg.hook).toBe(draft.basePkg.platformPack?.facebook.hook);
    expect(draft.basePkg.pinnedComment).toBe(
      draft.basePkg.platformPack?.facebook.pinnedComment
    );
    expect(publishFlowSummary.primaryHook).toBe(
      draft.basePkg.platformPack?.facebook.hook
    );
  });

  it("keeps structured prompt fields populated for the UI and preserves the Nano Banana image path", () => {
    const draft = buildGeneratedPackageDraft(makeDraftInput());
    const prompts = draft.basePkg.structuredPrompts;

    expect(prompts?.imagePrompt?.fullText).toBe(draft.basePkg.imagePrompt);
    expect(prompts?.imagePrompt?.pasteReady).toBe(draft.basePkg.imagePrompt);
    expect(prompts?.imagePrompt?.metadata?.engine).toBe("image");
    expect(prompts?.gptImage2Prompt?.fullText).toBe(draft.basePkg.gptImage2Prompt);
    expect(prompts?.gptImage2Prompt?.pasteReady).toBe(draft.basePkg.gptImage2Prompt);
    expect(prompts?.gptImage2Prompt?.metadata?.engine).toBe("image");
    expect(prompts?.gptImage2Prompt?.fullText).toContain("No text unless explicitly requested.");
    expect(prompts?.gptImage2Prompt?.fullText).toContain("Leave slight negative space for cover-safe framing and social preview overlays.");
    expect(prompts?.imagePrompt?.fullText).not.toMatch(/--ar\s+9:16/i);
    expect(prompts?.imagePrompt?.fullText).not.toMatch(/--style\s+raw/i);

    expect(prompts?.runwayShots).toHaveLength(4);
    expect(prompts?.klingShots).toHaveLength(4);
    expect(prompts?.seedanceShots).toHaveLength(4);
    expect(prompts?.runwayShots?.[0]?.pasteReady.length).toBeGreaterThan(0);
    expect(prompts?.klingShots?.[1]?.audio).toBeTruthy();
    expect(prompts?.seedanceMultiShot?.fullText).toBe(
      draft.basePkg.seedanceMultiShotPrompt
    );
    expect(prompts?.seedanceMultiShot?.fullText).toContain("SEEDANCE DIRECT 15S MULTISHOT PROMPT");
    expect(prompts?.seedanceMultiShot?.pasteReady).toContain("Shot 1, 0-5s opening tension / first-frame hook");
    expect(prompts?.seedanceMultiShot?.pasteReady).toContain("Shot 2, 5-10s pressure build / peak movement");
    expect(prompts?.seedanceMultiShot?.pasteReady).toContain("Shot 3, 10-15s final hold / resolved or unresolved tension");
    expect(prompts?.seedanceMultiShot?.pasteReady.match(/\bCut to\b/g)).toHaveLength(2);
    expect(prompts?.seedanceMultiShot?.pasteReady).not.toContain("Shot 4: resolved tension");
    expect(prompts?.klingNative15s?.pasteReady.length).toBeGreaterThan(0);
    expect(prompts?.klingNative15s?.pasteReady.startsWith("Image-to-video from master image")).toBe(true);
    expect(prompts?.klingFramesPrompt?.pasteReady.length).toBeGreaterThan(0);
    expect(prompts?.klingMultishotShots).toHaveLength(3);
    expect(prompts?.klingMultishotShots?.every((shot) => shot.pasteReady.length <= 512)).toBe(true);
    expect(prompts?.klingMultishotShots?.map((shot) => shot.settings?.find((line) => line.startsWith("Timing:")))).toEqual([
      "Timing: 0-5s",
      "Timing: 5-10s",
      "Timing: 10-15s",
    ]);
    expect(prompts?.klingNative15s?.pasteReady).toContain("Negative prompt:");
    expect(prompts?.klingNative15s?.pasteReady).not.toContain("KLING 3.0 PRO DIRECT 15S MULTISHOT");
    expect(prompts?.klingFramesPrompt?.pasteReady).toContain("raw documentary tension");
    expect(prompts?.klingFramesPrompt?.pasteReady).toContain("BBC Earth realism");
    expect(prompts?.klingMultishotShots?.[1]?.pasteReady).toContain("BBC Earth");
    expect(prompts?.klingMultishotShots?.[1]?.pasteReady).toContain("raw tension");
    expect(prompts?.klingSixShot?.pasteReady.length).toBeGreaterThan(0);
  });

  it("anchors runway prompts with explicit subject identity while preserving left/right positioning", () => {
    const draft = buildGeneratedPackageDraft(
      makeDraftInput({
        predator: "Lion",
        prey: "Wildebeest",
        presetForIdeas: {
          prey: ["Wildebeest"],
          environment: "savanna golden hour grassland",
          lighting: "golden-hour rim light over dry grass",
          cameraGear: "Canon EOS R5, 400mm wildlife lens",
          texture: "dust lift, taut muscle detail, sharp hoof contact",
          defaultArc: "Escape from danger",
          driftRisk: "LOW",
        },
        presetLighting: "golden-hour rim light over dry grass",
        presetCameraGear: "Canon EOS R5, 400mm wildlife lens",
        presetTexture: "dust lift, taut muscle detail, sharp hoof contact",
        presetDriftRisk: "LOW",
        finalEnvironment: "savanna golden hour grassland",
        finalArc: "Escape from danger",
        contentLane: "Escape",
        weather: "Golden Hour",
        durationLane: "medium",
        selectedPipelineStyle: "4-shot",
        sceneInject:
          "Keep the chase lateral and readable with clear lead-chase spacing and no crowding.",
        finalHook2026: [
          "The lion closes one stride before the wildebeest finds its turn lane.",
          "The chase line tightens before the cut opens.",
          "One stride decides the escape window.",
        ],
        finalHook: "The lion closes one stride before the wildebeest finds its turn lane.",
        shortCaption: "A golden-hour chase turns on one stride and one late cut.",
        longCaption:
          "The lion closes one stride before the wildebeest finds its escape line across open savanna grass at golden hour.",
        hashtags: "#Lion #Wildebeest #WildlifeReel #Savanna #WSTV",
      })
    );

    const runwayPromptText = [
      draft.basePkg.structuredPrompts?.runwayShots?.[0]?.fullText ?? "",
      draft.basePkg.structuredPrompts?.runwayShots?.[3]?.fullText ?? "",
      draft.basePkg.structuredPrompts?.workflowShots?.[0]?.fullText ?? "",
      draft.basePkg.structuredPrompts?.workflowShots?.[3]?.fullText ?? "",
    ].join("\n\n");

    expect(runwayPromptText).not.toMatch(/\bleft subject\b/i);
    expect(runwayPromptText).not.toMatch(/\bright subject\b/i);
    expect(runwayPromptText).toContain("Lion (left)");
    expect(runwayPromptText).toContain("Wildebeest (right)");
  });

  it("adds the Meta AI disclosure reminder to the Facebook publish reminders without duplicates", () => {
    const draft = buildGeneratedPackageDraft(makeDraftInput());
    const reminders = draft.basePkg.platformPack?.facebook.publishReminders ?? [];

    expect(reminders).toContain(
      "⚠️ Reminder: Label this content as AI-generated before publishing to comply with Meta policy and SynthID detection."
    );
    expect(
      reminders.filter(
        (item) =>
          item ===
          "⚠️ Reminder: Label this content as AI-generated before publishing to comply with Meta policy and SynthID detection."
      )
    ).toHaveLength(1);
  });


  it("keeps Predator vs Prey on the existing prompt path when story mode is default", () => {
    const baseline = buildGeneratedPackageDraft(makeDraftInput());
    const explicit = buildGeneratedPackageDraft(
      makeDraftInput({ storyMode: StoryMode.PREDATOR_VS_PREY })
    );

    expect(explicit.basePkg.imagePrompt).toBe(baseline.basePkg.imagePrompt);
    expect(explicit.basePkg.shotImagePlan).toEqual(baseline.basePkg.shotImagePlan);
    expect(explicit.basePkg.structuredPrompts?.workflowShots?.map((shot) => shot.fullText)).toEqual(
      baseline.basePkg.structuredPrompts?.workflowShots?.map((shot) => shot.fullText)
    );
  });

  it("generates Mother & Baby prompt language with protection and cub safety", () => {
    const draft = buildGeneratedPackageDraft(
      makeDraftInput({
        storyMode: StoryMode.MOTHER_BABY,
        subjectA: "Grizzly Mother",
        subjectB: "Male Grizzly",
        offspringLabel: "cub",
        violenceLevel: ViolenceLevel.DISPLAY_ONLY,
      })
    );
    const text = [
      draft.basePkg.imagePrompt,
      draft.basePkg.gptImage2Prompt ?? "",
      ...(draft.basePkg.shotImagePlan ?? []).map((shot) => shot.prompt),
      ...(draft.basePkg.structuredPrompts?.workflowShots ?? []).map((shot) => shot.fullText),
    ].join("\n").toLowerCase();

    expect(text).toContain("protective mother");
    expect(text).toContain("cub");
    expect(text).toContain("sheltered");
    expect(text).toContain("no contact");
    expect(text).toContain("no gore");
    expect(text).toContain("no blood");
    expect(text).toContain("no visible injury");
  });

  it("generates Herd Defense prompt language with herd formation", () => {
    const draft = buildGeneratedPackageDraft(
      makeDraftInput({
        storyMode: StoryMode.HERD_DEFENSE,
        subjectA: "Bison Herd",
        subjectB: "Wolf Pack",
        groupCount: 12,
        violenceLevel: ViolenceLevel.IMPLIED_PRESSURE,
      })
    );
    const text = [
      draft.basePkg.imagePrompt,
      ...(draft.basePkg.shotImagePlan ?? []).map((shot) => shot.prompt),
    ].join("\n").toLowerCase();

    expect(text).toContain("herd defense");
    expect(text).toContain("group formation");
    expect(text).toContain("defensive wall");
    expect(text).toContain("no gore");
  });

  it("keeps Herd Defense subjects in direct Kling and Seedance outputs", () => {
    const draft = buildGeneratedPackageDraft(
      makeDraftInput({
        storyMode: StoryMode.HERD_DEFENSE,
        subjectA: "Bison Herd",
        subjectB: "Wolf Pack",
        groupCount: 12,
        violenceLevel: ViolenceLevel.IMPLIED_PRESSURE,
      })
    );
    const pkg = draft.basePkg;
    const directText = [
      pkg.klingNative15s ?? "",
      pkg.klingFramesPrompt ?? "",
      ...(pkg.klingShots ?? []),
      ...(pkg.klingMultishotShots ?? []),
      pkg.klingSixShot ?? "",
      pkg.seedanceMultiShotPrompt ?? "",
      ...(pkg.seedanceShots ?? []),
      ...(pkg.runwayShots ?? []),
    ].join("\n");

    expect(pkg.predatorName).toBe("Bison Herd");
    expect(pkg.preyName).toBe("Wolf Pack");
    expect(directText).toContain("Herd Defense");
    expect(directText).toContain("Bison Herd");
    expect(directText).toContain("Wolf Pack");
    expect(directText).not.toContain("Mountain Lion");
    expect(directText).not.toContain("Mule Deer");
    expect(pkg.structuredPrompts?.klingFramesPrompt?.pasteReady).toContain("Negative prompt:");
    expect(pkg.structuredPrompts?.klingFramesPrompt?.pasteReady.length).toBeLessThanOrEqual(2500);
    expect(pkg.structuredPrompts?.seedanceMultiShot?.pasteReady).toContain("Bison Herd");
    expect(pkg.structuredPrompts?.seedanceMultiShot?.pasteReady).toContain("Wolf Pack");
  });

  it("generates Rival Clash prompt language with rut and standoff cues", () => {
    const draft = buildGeneratedPackageDraft(
      makeDraftInput({
        storyMode: StoryMode.RIVAL_CLASH,
        subjectA: "Bull Elk A",
        subjectB: "Bull Elk B",
        rutSeason: true,
        violenceLevel: ViolenceLevel.NON_GRAPHIC_STRUGGLE,
      })
    );
    const text = [
      draft.basePkg.imagePrompt,
      ...(draft.basePkg.structuredPrompts?.workflowShots ?? []).map((shot) => shot.fullText),
    ].join("\n").toLowerCase();

    expect(text).toContain("rival clash");
    expect(text).toContain("rut season");
    expect(text).toContain("standoff");
    expect(text).toContain("brief non-graphic physical pressure");
    expect(text).toContain("no gore");
    expect(text).toContain("no blood");
    expect(text).toContain("no visible injury");
  });

  it("generates Weather Survival prompt language with hazard pressure", () => {
    const draft = buildGeneratedPackageDraft(
      makeDraftInput({
        storyMode: StoryMode.WEATHER_SURVIVAL,
        subjectA: "American Bison",
        weatherHazard: "BLIZZARD",
        groupCount: 8,
      })
    );
    const text = [
      draft.basePkg.imagePrompt,
      ...(draft.basePkg.structuredPrompts?.workflowShots ?? []).map((shot) => shot.fullText),
    ].join("\n").toLowerCase();

    expect(text).toContain("weather survival");
    expect(text).toContain("blizzard");
    expect(text).toContain("natural hazard");
    expect(text).toContain("no animal fight");
  });

  it("finalizes the draft with enhancements while preserving generated extras", () => {
    const draft = buildGeneratedPackageDraft(makeDraftInput());
    const { finalPkg, publishFlowSummary } = finalizeGeneratedPackageDraft(
      draft,
      {
        hook: "The mountain silence breaks first.",
        caption: "Enhanced fast-publish caption.",
        voiceoverLine: "Enhanced voiceover line.",
        aiEnhanced: true,
      }
    );

    expect(finalPkg.hook).toBe("The mountain silence breaks first.");
    expect(finalPkg.caption).toBe("Enhanced fast-publish caption.");
    expect(finalPkg.voiceoverLine).toBe("Enhanced voiceover line.");
    expect(finalPkg.aiEnhanced).toBe(true);
    expect(finalPkg.capCutScript).toEqual(draft.capCutScript);
    expect(finalPkg.usViewsModeReport).toBeDefined();

    expect(publishFlowSummary.predatorName).toBe("Mountain Lion");
    expect(publishFlowSummary.preyName).toBe("Mule Deer");
    expect(publishFlowSummary.durationLane).toBe("long");
    expect(publishFlowSummary.pipelineStyle).toBe("long-hybrid-4-shot");
  });
});
