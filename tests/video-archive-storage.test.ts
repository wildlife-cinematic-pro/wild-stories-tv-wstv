import { afterEach, describe, expect, it, vi } from "vitest";

import {
  VIDEO_ARCHIVE_STORAGE_KEY,
  createVideoArchiveEntryFromPackage,
  exportVideoArchiveJson,
  importVideoArchiveJson,
  readVideoArchiveEntries,
  sanitizeArchiveMetadata,
  updateVideoArchiveEntry,
  upsertVideoArchiveEntry,
} from "@/lib/video-archive-storage";
import { StoryMode, type GeneratedPackage } from "@/types";

function installLocalStorageMock() {
  const store = new Map<string, string>();
  const localStorageMock = {
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
  };

  vi.stubGlobal("localStorage", localStorageMock);
  vi.stubGlobal("window", {
    dispatchEvent: vi.fn(),
  });
}

function makePackage(input: Partial<GeneratedPackage> = {}): GeneratedPackage {
  return {
    imagePrompt: "Photorealistic bison mother shields calf in Yellowstone meadow.",
    negativePrompt: "No blood, no gore, no visible wounds.",
    thumbnailPrompt: "Bison mother and calf first-frame hook.",
    voiceoverLine: "One calf changes the whole standoff.",
    runwayShots: ["Runway shot 1 prompt", "Runway shot 2 prompt", "Runway shot 3 prompt", "Runway shot 4 prompt"],
    klingShots: ["Kling shot 1 prompt", "Kling shot 2 prompt", "Kling shot 3 prompt", "Kling shot 4 prompt"],
    seedanceShots: ["Seedance shot 1 prompt", "Seedance shot 2 prompt", "Seedance shot 3 prompt", "Seedance shot 4 prompt"],
    seedanceMultiShotPrompt: "Seedance direct 15s prompt",
    klingFramesPrompt: "Kling direct frames prompt",
    motionStrength: 70,
    capCutPlan: "Cut on pressure beats.",
    clipChaining: "LOW drift",
    predatorName: "Bison Mother",
    preyName: "Male Grizzly",
    subjectA: "Bison Mother",
    subjectB: "Male Grizzly",
    offspringLabel: "calf",
    storyMode: StoryMode.MOTHER_BABY,
    environmentName: "Yellowstone meadow edge",
    weatherName: "Golden Hour",
    generationId: "generation_1",
    generatedAt: "2026-05-14T00:00:00.000Z",
    hook: "A bison calf has one safe pocket left.",
    hook2026: ["A bison calf has one safe pocket left."],
    caption: "A bison mother shields her calf as pressure closes in.",
    caption2026: "A bison mother shields her calf as pressure closes in.",
    cta: "Would you step back or stand ground?",
    hashtags: "#Bison #Yellowstone #WildlifeReel #AnimalMothers #NatureShorts",
    tags: "bison, calf, yellowstone",
    tenIdeas: [],
    shotPlan: [{ engine: "RUNWAY", prompt: "Hybrid primary shot 1 prompt" }],
    runwayBundle: "Runway bundle",
    klingBundle: "Kling bundle",
    routingNote: "Hybrid route",
    primaryVideoRoute: {
      kind: "hybrid",
      label: "Hybrid Runway/Kling route",
      detail: "Runway opener, Kling middle, Runway close",
      workspaceTab: "hybrid",
      kling: "Kling",
      seedance: "Seedance",
    },
    ...input,
  } as GeneratedPackage;
}

describe("video archive storage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates an archive entry from a GeneratedPackage", () => {
    const entry = createVideoArchiveEntryFromPackage(
      makePackage(),
      {
        localFolderPath: "/Users/me/Movies/WSTV/bison-calf",
        videoFileName: "bison-calf.mp4",
        thumbnailPath: "/Users/me/Movies/WSTV/bison-calf/cover.jpg",
        facebookPostUrl: "https://facebook.com/reel/123",
        resultNotes: "Calf stayed visible.",
        performance: { views: 1200, likes: 90, shares: 14, comments: 8, retentionNotes: "Strong first 3 seconds." },
      },
      "2026-05-14T10:00:00.000Z"
    );

    expect(entry.archiveSchemaVersion).toBe(1);
    expect(entry.archiveId).toMatch(/^archive_/);
    expect(entry.generationId).toBe("generation_1");
    expect(entry.storyMode).toBe(StoryMode.MOTHER_BABY);
    expect(entry.animalPair).toBe("Bison Mother vs Male Grizzly");
    expect(entry.workflowType).toBe("Hybrid 4-shot");
    expect(entry.engineRoute).toBe("Hybrid Runway/Kling route");
    expect(entry.fullPromptPackage).toContain("Bison Mother");
    expect(entry.videoPrompt).toBe("Hybrid primary shot 1 prompt");
    expect(entry.caption).toContain("bison mother shields");
    expect(entry.hashtags).toContain("#Bison");
    expect(entry.localFolderPath).toContain("/Users/me/Movies");
    expect(entry.performance.views).toBe(1200);
  });

  it("saves and loads archive entries from versioned localStorage", () => {
    installLocalStorageMock();
    const entry = createVideoArchiveEntryFromPackage(makePackage(), {}, "2026-05-14T10:00:00.000Z");

    upsertVideoArchiveEntry(entry);

    const raw = localStorage.getItem(VIDEO_ARCHIVE_STORAGE_KEY);
    expect(raw).toContain('"archiveSchemaVersion":1');
    const restored = readVideoArchiveEntries();
    expect(restored).toHaveLength(1);
    expect(restored[0]).toMatchObject({ generationId: "generation_1", animalPair: "Bison Mother vs Male Grizzly" });
  });

  it("falls back safely when localStorage is corrupted", () => {
    installLocalStorageMock();
    localStorage.setItem(VIDEO_ARCHIVE_STORAGE_KEY, "{ bad json");

    expect(readVideoArchiveEntries()).toEqual([]);
  });

  it("exports and imports archive JSON", () => {
    installLocalStorageMock();
    const entry = createVideoArchiveEntryFromPackage(makePackage(), { archiveId: "archive_fixed" }, "2026-05-14T10:00:00.000Z");
    const json = exportVideoArchiveJson([entry]);

    expect(json).toContain('"archiveSchemaVersion": 1');
    expect(json).toContain('"entries"');

    const result = importVideoArchiveJson(json);

    expect(result.importedCount).toBe(1);
    expect(readVideoArchiveEntries()).toHaveLength(1);
    expect(readVideoArchiveEntries()[0].archiveId).toBe("archive_fixed");
  });

  it("updates result notes, Facebook URL, and performance stats", () => {
    installLocalStorageMock();
    const entry = createVideoArchiveEntryFromPackage(makePackage(), { archiveId: "archive_update" }, "2026-05-14T10:00:00.000Z");
    upsertVideoArchiveEntry(entry);

    const updated = updateVideoArchiveEntry("archive_update", {
      facebookPostUrl: "https://facebook.com/reel/updated",
      resultNotes: "Posted version held the calf silhouette.",
      performance: { views: 2200, likes: 150, shares: 31, comments: 11, retentionNotes: "Replay spike at final hold." },
    });

    expect(updated?.facebookPostUrl).toBe("https://facebook.com/reel/updated");
    expect(updated?.resultNotes).toContain("calf silhouette");
    expect(updated?.performance).toMatchObject({ views: 2200, likes: 150, shares: 31, comments: 11 });
    expect(updated?.performance.retentionNotes).toContain("Replay spike");
  });

  it("does not persist video binary/blob/base64 fields", () => {
    installLocalStorageMock();
    const unsafePackage = makePackage({
      videoBase64: "data:video/mp4;base64,AAAA",
      videoBlob: "blob:https://example.test/123",
      nested: { thumbnailBase64: "data:video/mp4;base64,BBBB" },
    } as Partial<GeneratedPackage>);
    const entry = createVideoArchiveEntryFromPackage(unsafePackage, { archiveId: "archive_safe" }, "2026-05-14T10:00:00.000Z");

    upsertVideoArchiveEntry(entry);
    const raw = localStorage.getItem(VIDEO_ARCHIVE_STORAGE_KEY) ?? "";

    expect(raw).not.toContain("videoBase64");
    expect(raw).not.toContain("videoBlob");
    expect(raw).not.toContain("thumbnailBase64");
    expect(raw).not.toContain("data:video");
    expect(raw).not.toContain("blob:");
    expect(JSON.stringify(sanitizeArchiveMetadata(unsafePackage))).not.toContain("data:video");
    expect(raw).toContain("Bison Mother");
  });
});
