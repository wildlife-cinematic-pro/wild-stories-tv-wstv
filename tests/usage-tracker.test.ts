import { afterEach, describe, expect, it, vi } from "vitest";

import type { GeneratedPackage } from "@/types";

import {
  buildUsagePayload,
  getSummary,
  recordEvent,
  trackUsage,
} from "@/lib/usage-tracker";

function installWindowMock() {
  const store = new Map<string, string>();
  const localStorage = {
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

  vi.stubGlobal(
    "CustomEvent",
    class MockCustomEvent {
      type: string;

      constructor(type: string) {
        this.type = type;
      }
    }
  );
  vi.stubGlobal("localStorage", localStorage);
  vi.stubGlobal("window", {
    localStorage,
    dispatchEvent: vi.fn(),
  });
}

function makePackage(overrides: Partial<GeneratedPackage> = {}): GeneratedPackage {
  return {
    imagePrompt: "Mountain lion pressure in a dry meadow edge.",
    negativePrompt: "",
    thumbnailPrompt: "Mountain lion vs mule deer",
    voiceoverLine: "The deer has one clean lane left.",
    runwayShots: ["Shot 1"],
    klingShots: ["Shot 2"],
    motionStrength: 62,
    capCutPlan: "Cut on the turn.",
    clipChaining: "Keep the pressure lane readable.",
    predatorName: "Mountain Lion",
    preyName: "Mule Deer",
    arcName: "Escape from danger",
    hook: "Mountain lion pressure closes before the mule deer clears the break.",
    hook2026: ["Mountain lion pressure closes before the mule deer clears the break."],
    caption:
      "Mountain lion pressure closes before the mule deer finds a clean turn. What changed the outcome first?",
    caption2026:
      "Mountain lion pressure closes before the mule deer finds a clean turn. What changed the outcome first?",
    cta: "What changed the outcome first?",
    altTextPrompt:
      "AI-generated cinematic wildlife scene showing Mountain Lion and Mule Deer. Wild Stories TV original AI wildlife scene — produced for cinematic storytelling.",
    hashtags:
      "#MountainLion #MuleDeer #WildlifeReel #PredatorPrey #NatureShorts",
    tenIdeas: [],
    shotPlan: [],
    runwayBundle: "Runway bundle",
    klingBundle: "Kling bundle",
    routingNote: "Default route.",
    platformPack: {
      facebook: {
        hook: "Mountain lion pressure closes before the mule deer clears the break.",
        caption:
          "Mountain lion pressure closes before the mule deer finds a clean turn. What changed the outcome first?",
        pinnedComment: "Wild Crew — did you spot the tell before it happened?",
        hashtags:
          "#MountainLion #MuleDeer #WildlifeReel #PredatorPrey #NatureShorts",
        tags: "mountain lion,mule deer,wildlife reel,predator prey,nature shorts",
        bestTime: "7:30 PM EST",
        cmpNote: "Documentary tone.",
      },
      instagram: {
        hook: "Mountain lion pressure closes before the mule deer clears the break.",
        caption: "Mountain lion pressure closes before the mule deer finds a clean turn.",
        hashtags:
          "#MountainLion #MuleDeer #WildlifeReel #PredatorPrey #NatureShorts",
        bestTime: "7:30 PM EST",
      },
      tiktok: {
        hook: "Mountain lion pressure closes before the mule deer clears the break.",
        caption: "Mountain lion pressure closes before the mule deer finds a clean turn.",
        hashtags:
          "#MountainLion #MuleDeer #WildlifeReel #PredatorPrey #NatureShorts",
        bestTime: "7:30 PM EST",
      },
      youtube_shorts: {
        title: "Mountain Lion vs Mule Deer",
        description: "Mountain lion pressure closes before the mule deer finds a clean turn.",
        tags: "mountain lion,mule deer,wildlife reel,predator prey,nature shorts",
        bestTime: "7:30 PM EST",
      },
    },
    openingFrameScore: {
      total: 86,
      summary: "Opening frame reads cleanly.",
    },
    usAudienceScore: {
      total: 84,
      speciesScore: 28,
      environmentScore: 28,
      arcScore: 28,
      summary: "Strong U.S. wildlife setup.",
    },
    publishGuardReport: {
      isPass: true,
      warnings: [],
    },
    hookFamily: "danger",
    ...overrides,
  };
}

describe("usage tracker", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds usage payloads with the new Facebook intent scores", () => {
    installWindowMock();

    const payload = buildUsagePayload(makePackage());

    expect(payload.shareIntentScore).toBeGreaterThanOrEqual(7);
    expect(payload.commentDepthIntentScore).toBeGreaterThanOrEqual(6);
    expect(payload.monetisationSafetyScore).toBeGreaterThanOrEqual(7);
    expect(payload.ownedFunnelConversionIntentScore).toBeGreaterThanOrEqual(4);
  });

  it("records events and returns averages for the new score fields", () => {
    installWindowMock();

    recordEvent("publish_action", {
      ...buildUsagePayload(makePackage()),
      shareIntentScore: 8,
      commentDepthIntentScore: 7,
      monetisationSafetyScore: 9,
      ownedFunnelConversionIntentScore: 5,
    });
    trackUsage("copy_all_packs", {
      ...buildUsagePayload(
        makePackage({
          hookFamily: "curiosity",
        })
      ),
      shareIntentScore: 6,
      commentDepthIntentScore: 5,
      monetisationSafetyScore: 7,
      ownedFunnelConversionIntentScore: 3,
    });

    const summary = getSummary();

    expect(summary.totalEvents).toBe(2);
    expect(summary.publishCount).toBe(1);
    expect(summary.avgShareIntentScore).toBe(7);
    expect(summary.avgCommentDepthIntentScore).toBe(6);
    expect(summary.avgMonetisationSafetyScore).toBe(8);
    expect(summary.avgOwnedFunnelConversionIntentScore).toBe(4);
    expect(summary.topHooks[0]).toBe("curiosity");
  });
});
