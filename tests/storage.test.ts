import { afterEach, describe, expect, it, vi } from "vitest";

import { createDefaultPackageLockState } from "@/lib/package-section-locks";
import {
  EncounterMode,
  EndingMode,
  HabitatRegion,
  StoryMode,
  ViralLane,
  ViolenceLevel,
} from "@/types";
import {
  clearImportedMonetizedPagePerformanceRecords,
  createLastGeneratedOutputDebouncer,
  readCustomPredators,
  readLastGeneratedOutput,
  readMonetizedPagePerformanceForGeneration,
  readMonetizedPagePerformanceHistory,
  readRealGenerationEvidenceForGeneration,
  readRealGenerationEvidenceHistory,
  readSettings,
  removeMonetizedPagePerformanceRecord,
  upsertMonetizedPagePerformanceRecord,
  upsertMonetizedPagePerformanceRecords,
  writeLastGeneratedOutput,
  writeRealGenerationEvidenceHistory,
  writeSettings,
  type LastGeneratedOutputRecord,
} from "@/lib/storage";

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
}


function makeRealGenerationEvidenceRecord() {
  return {
    id: "evidence_1",
    generationId: "generation_1",
    generationLabel: "Mountain Lion vs White-tailed Deer • Escape from danger • 4-shot • 2026-04-24 00:00",
    generatedAt: "2026-04-24T00:00:00.000Z",
    capturedAt: "2026-04-24T01:00:00.000Z",
    predatorName: "Mountain Lion",
    preyName: "White-tailed Deer",
    arcName: "Escape from danger",
    pipelineStyle: "4-shot",
    scores: {
      firstFrameReadability: 4,
      spacingClarity: 4,
      worldLightingContinuity: 3,
      anatomyPhysicsRealism: 4,
      actionReadability: 3,
      facebookOpeningStrength: 4,
    },
    overallScore: 70,
    suggestedRecommendation: "retry-with-fixes",
    userRecommendation: "retry-with-fixes",
    notes: {
      strongPoints: "Strong opening frame.",
      driftObserved: "Shot 3 lost some hillside alignment.",
      failedPoints: "Peak action got a little soft.",
      retryPlan: "Retry only the action beat.",
      masterStill: "Still is stable.",
      runway: "Runway held the environment.",
      kling: "Kling pushed action well.",
      seedance: "",
    },
  } as const;
}

function makeLastGeneratedOutputRecord(): LastGeneratedOutputRecord {
  return {
    schema: "wstv.last-generated-output",
    version: 1,
    storedAt: "2026-04-24T00:00:00.000Z",
    snapshot: {
      predator: "Mountain Lion",
      prey: "White-tailed Deer",
      wildlifeScopeMode: "USA / Canada Wildlife",
      contentLane: "Escape",
      actionStyle: "Natural tension",
      cameraAnglePreset: "Ground-level tension",
      arc: "Escape from danger",
      habitat: "Rocky Mountain Meadow",
      weather: "Golden Hour",
      durationLane: "short",
      fastPublishMode: true,
      strictOriginalityGuard: true,
      hookMode: "danger",
      depthMode: "Balanced Depth",
      emotionalTone: "Raw Tension",
      animalVibe: "National Geographic Wild",
      realismMode: "Reference Locked",
      motionOnlyI2V: true,
      referenceLock: true,
      singleActionRule: true,
      microMotion: true,
      heroVeo: false,
      autoApplyHighDrift: false,
      runwayModel: "Gen-4.5",
      klingModel: "Kling 3.0 Pro",
      activeProvider: "none",
      sceneDescriptionMode: "manual",
      sceneDescription: "A mountain lion explodes from the left side of the frame while a white-tailed deer breaks right across a dry meadow edge.",
      sceneDescriptionTouched: true,
    },
    pkg: {
      imagePrompt: "Mountain lion lunges toward a white-tailed deer across a dry meadow edge.",
      negativePrompt: "",
      thumbnailPrompt: "Mountain lion vs white-tailed deer at meadow edge",
      voiceoverLine: "The deer breaks right as the lion commits.",
      runwayShots: ["Shot 1"],
      klingShots: ["Shot 1"],
      motionStrength: 55,
      capCutPlan: "Cut on the breakaway.",
      clipChaining: "Match the line of travel.",
      hook: "Mountain lion pressure closes fast.",
      hook2026: ["Mountain lion pressure closes fast."],
      caption: "A deer has one clean exit lane left.",
      caption2026: "A deer has one clean exit lane left.",
      cta: "What movement changed the read?",
      hashtags: "#MountainLion #WhitetailDeer #WildlifeReel #PredatorPrey #NatureShorts",
      tenIdeas: [],
      shotPlan: [],
      runwayBundle: "Runway bundle",
      klingBundle: "Kling bundle",
      routingNote: "Route through the default package flow.",
    },
    publishFlowSummary: null,
    packageLocks: createDefaultPackageLockState({
      hook: true,
      motion: true,
    }),
  };
}

describe("settings storage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("persists newer publish-flow settings without dropping existing settings", () => {
    installLocalStorageMock();

    writeSettings({
      activeProvider: "none",
      runwayModel: "runway-gen4-5",
      klingModel: "kling-2-5-turbo",
      realismMode: "Reference Locked",
      motionOnlyI2V: true,
      referenceLock: true,
      singleActionRule: true,
      microMotion: true,
      heroVeo: false,
      autoApplyHighDrift: true,
      durationLane: "medium",
      hookMode: "curiosity",
      fastPublishMode: false,
      strictOriginalityGuard: false,
      habitat: "Riverbank Reeds",
      wildlifeScopeMode: "USA Wildlife",
      contentLane: "Fishing Strike",
      cameraAnglePreset: "waterline",
    });

    expect(readSettings()).toMatchObject({
      activeProvider: "none",
      durationLane: "medium",
      hookMode: "curiosity",
      fastPublishMode: false,
      strictOriginalityGuard: false,
      habitat: "Riverbank Reeds",
      wildlifeScopeMode: "USA Wildlife",
      contentLane: "Fishing Strike",
      cameraAnglePreset: "waterline",
    });
  });

  it("persists the latest generated output for restore on reopen", () => {
    installLocalStorageMock();

    const record = makeLastGeneratedOutputRecord();
    writeLastGeneratedOutput(record);

    const restored = readLastGeneratedOutput();
    expect(restored).not.toBeNull();
    if (!restored) throw new Error("Expected last generated output to restore");

    expect(restored).toMatchObject(record);
    expect(restored.snapshot).toMatchObject({
      storyMode: StoryMode.PREDATOR_VS_PREY,
      encounterMode: EncounterMode.PEAK_TENSION,
      endingMode: EndingMode.ESCAPE,
      viralLane: ViralLane.TENSION,
      violenceLevel: ViolenceLevel.DISPLAY_ONLY,
      habitatRegion: HabitatRegion.YELLOWSTONE,
      subjectA: record.snapshot.predator,
      subjectB: record.snapshot.prey,
      season: "FALL",
      timeOfDay: "GOLDEN_HOUR",
      offspringLabel: "cub",
      strikeMethod: "AMBUSH",
      escapeDirection: "BRUSH",
      weatherHazard: "BLIZZARD",
      rutSeason: false,
    });
    expect("groupCount" in restored.snapshot).toBe(false);
  });

  it("normalizes invalid custom predator arcs to a safe Arc value", () => {
    installLocalStorageMock();

    localStorage.setItem(
      "wildlife_custom_predators_v1",
      JSON.stringify([
        {
          name: "Snow Leopard",
          prey: "Ibex",
          environment: "High alpine ridge",
          defaultArc: "Bad arc input",
          driftRisk: "MEDIUM",
        },
      ])
    );

    expect(readCustomPredators()).toEqual([
      {
        name: "Snow Leopard",
        prey: "Ibex",
        environment: "High alpine ridge",
        defaultArc: "Ambush attack",
        driftRisk: "MEDIUM",
      },
    ]);
  });

  it("debounces last generated output writes and keeps only the latest record", () => {
    vi.useFakeTimers();

    const write = vi.fn<(record: LastGeneratedOutputRecord) => void>();
    const debouncer = createLastGeneratedOutputDebouncer(write, 50);
    const firstRecord = makeLastGeneratedOutputRecord();
    const secondRecord = {
      ...makeLastGeneratedOutputRecord(),
      storedAt: "2026-04-24T00:00:01.000Z",
      pkg: {
        ...makeLastGeneratedOutputRecord().pkg,
        hook: "Updated hook after debounce.",
      },
    };

    debouncer.schedule(firstRecord);
    debouncer.schedule(secondRecord);

    expect(write).not.toHaveBeenCalled();

    vi.advanceTimersByTime(49);
    expect(write).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(write).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenCalledWith(secondRecord);

    debouncer.cancel();
    vi.useRealTimers();
  });

  it("persists monetized page performance records by generation", () => {
    installLocalStorageMock();

    upsertMonetizedPagePerformanceRecord({
      generationId: "generation_1",
      postUrl: "https://facebook.com/post/1",
      title: "Mountain lion pressure closes fast",
      conceptLabel: "Mountain Lion vs White-tailed Deer • Escape from danger",
      publishedAt: "2026-04-24 08:30 EST",
      postedAtJST: "",
      postedAtEST: "",
      animalPair: "Mountain Lion vs White-tailed Deer",
      predator: "Mountain Lion",
      prey: "White-tailed Deer",
      habitat: "Rocky Mountain Meadow",
      arc: "Escape from danger",
      durationLane: "short",
      hookFamily: "danger",
      contentLane: "Escape",
      reach: 12000,
      firstHourViews: "",
      threeSecondViews: 5400,
      threeSecondHoldRate: "",
      oneMinuteViews: 620,
      averageWatchTimeSeconds: 15,
      watchPercentage: 46,
      completionRate: "",
      shares: 140,
      comments: 72,
      reactions: 880,
      followsGained: 33,
      profileVisits: 120,
      linkClicks: 8,
      usaFollowerPercent: "",
      earningsUsd: "",
      estimatedEarnings: 22,
      rpm: 4.8,
      monetizedPlays: 1800,
      notes: "Strong repeat view signals.",
    });

    expect(readMonetizedPagePerformanceForGeneration("generation_1")).toMatchObject({
      generationId: "generation_1",
      estimatedEarnings: 22,
      rpm: 4.8,
      monetizedPlays: 1800,
    });
    expect(readMonetizedPagePerformanceHistory()).toHaveLength(1);
  });

  it("persists real-generation evidence history and can read the current generation record", () => {
    installLocalStorageMock();

    const record = makeRealGenerationEvidenceRecord();
    writeRealGenerationEvidenceHistory([record]);

    expect(readRealGenerationEvidenceHistory()).toEqual([record]);
    expect(readRealGenerationEvidenceForGeneration("generation_1")).toEqual(record);
  });

  it("persists evidence attachment metadata when present", () => {
    installLocalStorageMock();

    const record = {
      ...makeRealGenerationEvidenceRecord(),
      attachments: [
        {
          id: "attachment_1",
          slot: "master-still",
          mediaKind: "image",
          fileName: "master-still.png",
          mimeType: "image/png",
          sizeBytes: 2048,
          storedAt: "2026-04-24T01:05:00.000Z",
        },
      ],
    };

    writeRealGenerationEvidenceHistory([record]);

    expect(readRealGenerationEvidenceForGeneration("generation_1")?.attachments).toEqual(
      record.attachments
    );
  });

  it("drops malformed real-generation evidence payloads safely", () => {
    installLocalStorageMock();

    localStorage.setItem(
      "wildlife_real_generation_evidence_v1",
      JSON.stringify({
        schema: "wstv.real-generation-evidence",
        version: 1,
        records: [{ id: "bad" }],
      })
    );

    expect(readRealGenerationEvidenceHistory()).toEqual([]);
    expect(localStorage.getItem("wildlife_real_generation_evidence_v1")).toBeNull();
  });

  it("drops malformed last generated output payloads safely", () => {
    installLocalStorageMock();

    localStorage.setItem(
      "wildlife_last_generated_output_v1",
      JSON.stringify({
        schema: "wstv.last-generated-output",
        version: 1,
        storedAt: "2026-04-24T00:00:00.000Z",
        snapshot: { predator: "Mountain Lion" },
      })
    );

    expect(readLastGeneratedOutput()).toBeUndefined();
    expect(localStorage.getItem("wildlife_last_generated_output_v1")).toBeNull();
  });

  it("upserts imported monetized performance rows by record identity and keeps the latest version", () => {
    installLocalStorageMock();

    upsertMonetizedPagePerformanceRecords([
      {
        source: "facebook_csv",
        generationId: "csv_generation_1",
        contentId: "content_1",
        postUrl: "https://facebook.com/post/1",
        title: "Mountain lion pressure closes fast",
        conceptLabel: "Mountain Lion vs White-tailed Deer • Escape from danger",
        publishedAt: "2026-04-24 08:30 EST",
        postedAtJST: "",
        postedAtEST: "",
        animalPair: "Mountain Lion vs White-tailed Deer",
        predator: "Mountain Lion",
        prey: "White-tailed Deer",
        habitat: "Rocky Mountain Meadow",
        arc: "Escape from danger",
        durationLane: "short",
        hookFamily: "danger",
        contentLane: "Escape",
        reach: 12000,
        views: 15000,
        firstHourViews: "",
        threeSecondViews: 5400,
        threeSecondHoldRate: "",
        oneMinuteViews: 620,
        averageWatchTimeSeconds: 15,
        watchPercentage: 46,
        completionRate: "",
        shares: 140,
        comments: 72,
        reactions: 880,
        followsGained: 33,
        profileVisits: 120,
        linkClicks: 8,
        usaFollowerPercent: "",
        earningsUsd: "",
        estimatedEarnings: 22,
        rpm: 4.8,
        monetizedPlays: 1800,
        notes: "First import.",
      },
      {
        source: "facebook_csv",
        generationId: "csv_generation_1",
        contentId: "content_1",
        postUrl: "https://facebook.com/post/1",
        title: "Mountain lion pressure closes fast",
        conceptLabel: "Mountain Lion vs White-tailed Deer • Escape from danger",
        publishedAt: "2026-04-24 08:30 EST",
        postedAtJST: "",
        postedAtEST: "",
        animalPair: "Mountain Lion vs White-tailed Deer",
        predator: "Mountain Lion",
        prey: "White-tailed Deer",
        habitat: "Rocky Mountain Meadow",
        arc: "Escape from danger",
        durationLane: "short",
        hookFamily: "danger",
        contentLane: "Escape",
        reach: 12000,
        views: 15000,
        firstHourViews: "",
        threeSecondViews: 5400,
        threeSecondHoldRate: "",
        oneMinuteViews: 620,
        averageWatchTimeSeconds: 15,
        watchPercentage: 46,
        completionRate: "",
        shares: 140,
        comments: 72,
        reactions: 880,
        followsGained: 33,
        profileVisits: 120,
        linkClicks: 8,
        usaFollowerPercent: "",
        earningsUsd: "",
        estimatedEarnings: 29,
        rpm: 5.1,
        monetizedPlays: 2100,
        notes: "Updated import.",
      },
    ]);

    const history = readMonetizedPagePerformanceHistory();
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      source: "facebook_csv",
      estimatedEarnings: 29,
      rpm: 5.1,
      monetizedPlays: 2100,
    });
  });

  it("can remove imported rows and clear imported records without deleting manual rows", () => {
    installLocalStorageMock();

    upsertMonetizedPagePerformanceRecord({
      source: "manual",
      generationId: "manual_generation_1",
      postUrl: "https://facebook.com/post/manual",
      title: "Manual post",
      conceptLabel: "Manual concept",
      publishedAt: "2026-04-24 08:30 EST",
      postedAtJST: "",
      postedAtEST: "",
      animalPair: "Mountain Lion vs White-tailed Deer",
      predator: "Mountain Lion",
      prey: "White-tailed Deer",
      habitat: "Rocky Mountain Meadow",
      arc: "Escape from danger",
      durationLane: "short",
      hookFamily: "danger",
      contentLane: "Escape",
      firstHourViews: "",
      threeSecondHoldRate: "",
      averageWatchTimeSeconds: "",
      completionRate: "",
      usaFollowerPercent: "",
      earningsUsd: "",
      notes: "Manual row.",
    });

    upsertMonetizedPagePerformanceRecord({
      source: "facebook_csv",
      generationId: "csv_generation_2",
      postUrl: "https://facebook.com/post/imported",
      title: "Imported post",
      conceptLabel: "Imported concept",
      publishedAt: "2026-04-24 09:00 EST",
      postedAtJST: "",
      postedAtEST: "",
      animalPair: "Mountain Lion vs White-tailed Deer",
      predator: "Mountain Lion",
      prey: "White-tailed Deer",
      habitat: "Rocky Mountain Meadow",
      arc: "Escape from danger",
      durationLane: "short",
      hookFamily: "danger",
      contentLane: "Escape",
      firstHourViews: "",
      threeSecondHoldRate: "",
      averageWatchTimeSeconds: "",
      completionRate: "",
      usaFollowerPercent: "",
      earningsUsd: "",
      notes: "Imported row.",
    });

    const importedRecord = readMonetizedPagePerformanceHistory().find(
      (record) => record.source === "facebook_csv"
    );
    expect(importedRecord?.recordId).toBeTruthy();

    removeMonetizedPagePerformanceRecord(importedRecord!.recordId!);
    expect(readMonetizedPagePerformanceHistory()).toHaveLength(1);

    upsertMonetizedPagePerformanceRecord({
      source: "facebook_csv",
      generationId: "csv_generation_3",
      postUrl: "https://facebook.com/post/imported-2",
      title: "Imported post 2",
      conceptLabel: "Imported concept 2",
      publishedAt: "2026-04-24 09:10 EST",
      postedAtJST: "",
      postedAtEST: "",
      animalPair: "Mountain Lion vs White-tailed Deer",
      predator: "Mountain Lion",
      prey: "White-tailed Deer",
      habitat: "Rocky Mountain Meadow",
      arc: "Escape from danger",
      durationLane: "short",
      hookFamily: "danger",
      contentLane: "Escape",
      firstHourViews: "",
      threeSecondHoldRate: "",
      averageWatchTimeSeconds: "",
      completionRate: "",
      usaFollowerPercent: "",
      earningsUsd: "",
      notes: "Imported row 2.",
    });

    clearImportedMonetizedPagePerformanceRecords();

    const history = readMonetizedPagePerformanceHistory();
    expect(history).toHaveLength(1);
    expect(history[0].source).toBe("manual");
  });
});
