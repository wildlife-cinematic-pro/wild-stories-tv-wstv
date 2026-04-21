import { describe, expect, it } from "vitest";

import {
  buildGeneratedPackageDraft,
  buildOpeningFrameInput,
  type GeneratedPackageDraftInput,
} from "@/lib/build-package";
import { buildImagePrompt } from "@/lib/prompt-builders/image";
import { buildKlingPromptPack } from "@/lib/prompt-builders/kling";
import { buildRunwayPromptPack } from "@/lib/prompt-builders/runway";

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
    prey: "White-tailed Deer",
    presetLighting: "golden hour rim light",
    presetCameraGear: "Canon EOS R5, 200mm wildlife lens",
    presetTexture: "natural fur and hoof detail",
    presetDriftRisk: "MEDIUM",
    presetForIdeas: {
      prey: ["White-tailed Deer"],
      environment: "Rocky Mountain meadow",
      lighting: "golden hour rim light",
      cameraGear: "Canon EOS R5, 200mm wildlife lens",
      texture: "natural fur and hoof detail",
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
    animalVibe: "National Geographic Wild",
    runwayModel: "Gen-4.5",
    klingModel: "Kling 3.0 Pro",
    durationLane: "short",
    marketMode: "US_ONLY",
    fastPublishMode: true,
    strictOriginalityGuard: true,
    selectedPipelineStyle: "4-shot",
    sceneInject: "",
    quality,
    finalHook2026: ["Mountain lion pressure closes fast."],
    finalHook: "Mountain lion pressure closes fast.",
    shortCaption: "A mountain lion closes space while the deer reads the danger.",
    longCaption:
      "A mountain lion closes space while the deer reads the danger in a clean first-frame wildlife setup.",
    hashtags: "#wildlife #mountainlion #whitetaileddeer #nature #wstv",
    tags: "wildlife,mountain lion,white-tailed deer",
    recommendedHookIndex: 0,
    hookFamily: "danger",
    usAudienceScore: {
      total: 84,
      speciesScore: 28,
      environmentScore: 28,
      arcScore: 28,
      summary: "Strong U.S. wildlife setup.",
    },
    openingFrameInput: buildOpeningFrameInput(
      "Ambush attack",
      "Balanced Depth",
      true,
      true,
      true,
      true,
      "danger"
    ),
    openingFrameScore: {
      total: 82,
      summary: "Readable opening frame.",
    },
    ...overrides,
  };
}

describe("camera angle presets", () => {
  it("keeps Auto image prompting identical to the default call", () => {
    const defaultPrompt = buildImagePrompt(
      "Mountain Lion",
      "White-tailed Deer",
      "Rocky Mountain meadow",
      "Ambush attack",
      "golden hour rim light",
      "Canon EOS R5, 200mm wildlife lens",
      "natural fur and hoof detail",
      "Balanced Depth",
      "Golden Hour",
      "Raw Tension",
      "National Geographic Wild"
    );
    const autoPrompt = buildImagePrompt(
      "Mountain Lion",
      "White-tailed Deer",
      "Rocky Mountain meadow",
      "Ambush attack",
      "golden hour rim light",
      "Canon EOS R5, 200mm wildlife lens",
      "natural fur and hoof detail",
      "Balanced Depth",
      "Golden Hour",
      "Raw Tension",
      "National Geographic Wild",
      "",
      undefined,
      "NANO_BANANA_2",
      "Auto"
    );

    expect(autoPrompt).toBe(defaultPrompt);
  });

  it("threads low-angle power framing into image, Runway, and Kling prompts", () => {
    const imagePrompt = buildImagePrompt(
      "Bull Elk",
      "Bull Elk",
      "Rocky Mountain meadow",
      "Giant vs giant clash",
      "frozen dusk rim light",
      "Canon EOS R5, 200mm wildlife lens",
      "wet fur and antler detail",
      "Balanced Depth",
      "Frozen Dusk",
      "Raw Tension",
      "National Geographic Wild",
      "",
      undefined,
      "NANO_BANANA_2",
      "Low-angle power"
    );
    const runway = buildRunwayPromptPack(
      "Bull Elk",
      "Bull Elk",
      "Rocky Mountain meadow",
      "Giant vs giant clash",
      "Frozen Dusk",
      "Gen-4.5",
      "Raw Tension",
      "National Geographic Wild",
      "",
      undefined,
      "Low-angle power"
    );
    const kling = buildKlingPromptPack(
      "Bull Elk",
      "Bull Elk",
      "Rocky Mountain meadow",
      "Giant vs giant clash",
      "Frozen Dusk",
      "Kling 3.0 Pro",
      "Raw Tension",
      "National Geographic Wild",
      "",
      undefined,
      "Low-angle power"
    );

    expect(imagePrompt).toMatch(/low camera position/i);
    expect(runway.shot1.pasteReady).toMatch(/low camera height/i);
    expect(kling.shot1.pasteReady).toMatch(/low-angle power framing/i);
    expect(imagePrompt).not.toMatch(/camera angle preset:/i);
    expect(runway.shot1.pasteReady).not.toMatch(/camera preset:/i);
    expect(kling.shot1.pasteReady).not.toMatch(/camera preset:/i);
  });

  it("adds overhead and over-the-shoulder framing language when selected", () => {
    const overhead = buildImagePrompt(
      "Wolf Pack",
      "Bull Elk",
      "Rocky Mountain meadow",
      "Pack hunting strategy",
      "dawn rim light",
      "Canon EOS R5, 200mm wildlife lens",
      "winter coat detail",
      "Detailed Background",
      "Dawn",
      "Raw Tension",
      "National Geographic Wild",
      "",
      undefined,
      "NANO_BANANA_2",
      "Overhead"
    );
    const overShoulder = buildImagePrompt(
      "Mountain Lion",
      "White-tailed Deer",
      "Forest Clearing",
      "Ambush attack",
      "golden hour rim light",
      "Canon EOS R5, 200mm wildlife lens",
      "natural fur detail",
      "Balanced Depth",
      "Golden Hour",
      "Silent Dread",
      "National Geographic Wild",
      "",
      undefined,
      "NANO_BANANA_2",
      "Over-the-shoulder"
    );

    expect(overhead).toMatch(/high overhead wildlife framing/i);
    expect(overShoulder).toMatch(/over-the-shoulder wildlife framing/i);
  });

  it("uses waterline language only for water-compatible habitats", () => {
    const fishingStrike = buildImagePrompt(
      "Bald Eagle",
      "Salmon",
      "Riverbank Reeds",
      "Ambush attack",
      "dawn river light",
      "Canon EOS R5, 200mm wildlife lens",
      "feather and scale detail",
      "Balanced Depth",
      "Dawn",
      "Raw Tension",
      "National Geographic Wild",
      "",
      undefined,
      "NANO_BANANA_2",
      "Waterline"
    );
    const dryGround = buildImagePrompt(
      "Mountain Lion",
      "White-tailed Deer",
      "Dry Prairie Plain",
      "Ambush attack",
      "golden hour rim light",
      "Canon EOS R5, 200mm wildlife lens",
      "natural fur detail",
      "Balanced Depth",
      "Golden Hour",
      "Raw Tension",
      "National Geographic Wild",
      "",
      undefined,
      "NANO_BANANA_2",
      "Waterline"
    );

    expect(fishingStrike).toMatch(/waterline wildlife framing|waterline-height|wet foreground edge/i);
    expect(dryGround).not.toMatch(/waterline-level|bank-edge|water-edge/i);
    expect(dryGround).toMatch(/ground-level animal-height wildlife framing/i);
  });

  it("threads the selected preset through package assembly", () => {
    const draft = buildGeneratedPackageDraft(
      makeDraftInput({ cameraAnglePreset: "Side profile" })
    );

    expect(draft.basePkg.cameraAnglePreset).toBe("Side profile");
    expect(draft.basePkg.imagePrompt).toMatch(/side-profile wildlife framing/i);
    expect(draft.basePkg.structuredPrompts?.workflowShots?.[0].pasteReady).toMatch(
      /side-profile tracking bias/i
    );
  });
});
