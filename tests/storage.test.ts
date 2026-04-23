import { afterEach, describe, expect, it, vi } from "vitest";

import { createDefaultPackageLockState } from "@/lib/package-section-locks";
import {
  readLastGeneratedOutput,
  readSettings,
  writeLastGeneratedOutput,
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

function makeLastGeneratedOutputRecord(): LastGeneratedOutputRecord {
  return {
    schema: "wstv.last-generated-output",
    version: 1,
    storedAt: "2026-04-24T00:00:00.000Z",
    snapshot: {
      predator: "Mountain Lion",
      prey: "White-tailed Deer",
      wildlifeScopeMode: "USA Wildlife",
      contentLane: "Escape",
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
      durationLane: "long",
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
      durationLane: "long",
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

    expect(readLastGeneratedOutput()).toEqual(record);
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
});
