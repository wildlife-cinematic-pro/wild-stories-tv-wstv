import { afterEach, describe, expect, it, vi } from "vitest";

import { readSettings, writeSettings } from "@/lib/storage";

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
});
