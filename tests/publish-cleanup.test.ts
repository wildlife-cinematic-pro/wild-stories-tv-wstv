import { describe, expect, it } from "vitest";

import { buildConceptVariantLab } from "@/lib/concept-variant-lab";
import { runFacebookPublishGuard } from "@/lib/facebookPublishGuard";
import { autoCleanupConceptVariantCopy } from "@/lib/publish-cleanup";

const baseInput = {
  predator: "Mountain Lion",
  prey: "White-tailed Deer",
  contentLane: "Escape" as const,
  currentArc: "Ambush attack" as const,
  currentHabitat: "Auto" as const,
  presetEnvironment: "Rocky Mountain forest edge and open meadow",
  presetPrey: ["White-tailed Deer", "Mule Deer", "Elk Calf"],
  driftRisk: "HIGH" as const,
  weather: "Golden Hour" as const,
  depthMode: "Balanced Depth" as const,
  durationLane: "short" as const,
  fastPublishMode: true,
  strictOriginalityGuard: true,
  realismMode: "Reference Locked" as const,
  runwayModel: "Gen-4.5" as const,
  klingModel: "Kling 3.0 Pro" as const,
  motionOnlyI2V: true,
  referenceLock: true,
  singleActionRule: true,
  microMotion: true,
  heroVeo: false,
  currentHookFamily: "danger" as const,
};

describe("concept variant publish cleanup", () => {
  it("auto-cleans a cleanup-needed variant and reruns the publish guard", () => {
    const { variants } = buildConceptVariantLab(baseInput);
    const dirtyVariant = {
      ...variants[0],
      primaryHook: "You won't believe what the mountain lion does next.",
      caption: "This shocking wildlife moment is insane. Comment below who wins.",
      hashtags: "#wildlife #wildlife #mountainlion #deer #deer",
    };
    dirtyVariant.publishGuardReport = runFacebookPublishGuard({
      hookText: dirtyVariant.primaryHook,
      caption: dirtyVariant.caption,
      hashtags: dirtyVariant.hashtags.split(/\s+/).filter(Boolean),
      originalityConfirmed: true,
      ctaText: "Comment who wins.",
      predator: baseInput.predator,
      prey: baseInput.prey,
    });

    expect(dirtyVariant.publishGuardReport.isPass).toBe(false);

    const cleanedVariant = autoCleanupConceptVariantCopy({
      variant: dirtyVariant,
      predator: baseInput.predator,
      prey: baseInput.prey,
      contentLane: baseInput.contentLane,
      originalityConfirmed: true,
    });

    expect(cleanedVariant.publishGuardReport.isPass).toBe(true);
    expect(cleanedVariant.publishCleanup?.applied).toBe(true);
    expect(cleanedVariant.publishCleanup?.warningsResolved).toBeGreaterThan(0);
    expect(cleanedVariant.primaryHook.toLowerCase()).not.toContain("you won't believe");
    expect(cleanedVariant.caption.toLowerCase()).not.toContain("comment below");
    expect(cleanedVariant.caption.toLowerCase()).not.toContain("shocking");
    expect(cleanedVariant.primaryHook.toLowerCase()).toMatch(
      /mountain lion|white-tailed deer/
    );
  });

  it("keeps already clean variant copy stable", () => {
    const { variants } = buildConceptVariantLab(baseInput);
    const safeVariant = variants[0];

    const cleanedVariant = autoCleanupConceptVariantCopy({
      variant: safeVariant,
      predator: baseInput.predator,
      prey: baseInput.prey,
      contentLane: baseInput.contentLane,
      originalityConfirmed: true,
    });

    expect(cleanedVariant.primaryHook).toBe(safeVariant.primaryHook);
    expect(cleanedVariant.caption).toBe(safeVariant.caption);
    expect(cleanedVariant.hashtags).toBe(safeVariant.hashtags);
    expect(cleanedVariant.publishCleanup?.applied).toBe(false);
  });

  it("normalizes hashtags to five clean distinct tags without losing species identity", () => {
    const { variants } = buildConceptVariantLab(baseInput);
    const hashtagOnlyDirtyVariant = {
      ...variants[0],
      hashtags: "#wildlife #wildlife #MountainLion #WhiteTailedDeer #WhiteTailedDeer",
    };
    hashtagOnlyDirtyVariant.publishGuardReport = runFacebookPublishGuard({
      hookText: hashtagOnlyDirtyVariant.primaryHook,
      caption: hashtagOnlyDirtyVariant.caption,
      hashtags: hashtagOnlyDirtyVariant.hashtags.split(/\s+/).filter(Boolean),
      originalityConfirmed: true,
      predator: baseInput.predator,
      prey: baseInput.prey,
    });

    const cleanedVariant = autoCleanupConceptVariantCopy({
      variant: hashtagOnlyDirtyVariant,
      predator: baseInput.predator,
      prey: baseInput.prey,
      contentLane: baseInput.contentLane,
      originalityConfirmed: true,
    });
    const hashtags = cleanedVariant.hashtags.split(/\s+/).filter(Boolean);

    expect(hashtags).toHaveLength(5);
    expect(new Set(hashtags).size).toBe(5);
    expect(hashtags).toContain("#mountainlion");
    expect(hashtags).toContain("#whitetaileddeer");
  });
});
