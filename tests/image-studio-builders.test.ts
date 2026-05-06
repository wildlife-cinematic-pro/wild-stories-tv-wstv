import { describe, expect, it } from "vitest";

import {
  ALL_SCENIC_IMAGE_PRESETS,
  getEnhancedScenicPresetById,
} from "@/lib/scenic-expanded-presets";
import {
  buildFacebookCaption,
  buildImageStudioDerivedPackage,
  buildUsViralHashtags,
  resolveEffectiveWildlife,
} from "@/lib/image-studio/builders";

const preset = getEnhancedScenicPresetById(ALL_SCENIC_IMAGE_PRESETS[0].id);

describe("image studio builders", () => {
  it("keeps Facebook captions in American English ASCII-safe output", () => {
    const caption = buildFacebookCaption({
      baseCaption: preset.caption,
      parkName: preset.parkName,
      stateOrProvince: preset.stateOrProvince,
      style: "Short Viral",
    });

    expect(caption).toContain(preset.parkName);
    expect(/^[\x00-\x7F]*$/.test(caption)).toBe(true);
  });

  it("keeps USA-viral hashtags at exactly five tags", () => {
    const hashtags = buildUsViralHashtags(preset, "USA Viral").split(" ");

    expect(hashtags).toHaveLength(5);
    expect(hashtags.every((tag) => tag.startsWith("#"))).toBe(true);
  });

  it("builds the derived package with compact outputs while preserving full copy text", () => {
    const derived = buildImageStudioDerivedPackage({
      allPresets: ALL_SCENIC_IMAGE_PRESETS,
      selectedPreset: preset,
      aspectRatio: "9:16",
      mood: "Facebook Viral Nature Post",
      wildlifeOverride: "Default preset wildlife",
      seasonOverride: "Default",
      lightOverride: "Default",
      captionStyle: "Short Viral",
      promptStrength: "Balanced",
      cameraLook: "35mm documentary",
      negativeMode: "Clean Short",
      hashtagMode: "USA Viral",
      customNote: "",
    });

    expect(derived.nanoPrompt).toContain("NANO BANANA 2 IMAGE PROMPT:");
    expect(derived.gptPrompt).toContain("GPT IMAGE 2 PROMPT:");
    expect(derived.copyAll).toContain("USA VIRAL HASHTAGS:");
    expect(derived.copyAll).toContain(derived.fivePostPack);
  });

  it("resolves default wildlife from the current preset and preserves manual overrides", () => {
    const alternatePreset = ALL_SCENIC_IMAGE_PRESETS.find((item) => item.defaultWildlife !== preset.defaultWildlife);

    expect(alternatePreset).toBeTruthy();

    const nextPreset = getEnhancedScenicPresetById(alternatePreset!.id);

    expect(resolveEffectiveWildlife(preset, "Default preset wildlife")).toBe(preset.defaultWildlife);
    expect(resolveEffectiveWildlife(nextPreset, "Default preset wildlife")).toBe(nextPreset.defaultWildlife);
    expect(resolveEffectiveWildlife(nextPreset, "Moose")).toBe("Moose");

    const derived = buildImageStudioDerivedPackage({
      allPresets: ALL_SCENIC_IMAGE_PRESETS,
      selectedPreset: nextPreset,
      aspectRatio: "9:16",
      mood: "Facebook Viral Nature Post",
      wildlifeOverride: "Default preset wildlife",
      seasonOverride: "Default",
      lightOverride: "Default",
      captionStyle: "Short Viral",
      promptStrength: "Balanced",
      cameraLook: "35mm documentary",
      negativeMode: "Clean Short",
      hashtagMode: "USA Viral",
      customNote: "",
    });

    expect(derived.effectiveWildlife).toBe(nextPreset.defaultWildlife);
    expect(derived.nanoPrompt).toContain(`Subject: ${nextPreset.defaultWildlife}`);
  });

});
