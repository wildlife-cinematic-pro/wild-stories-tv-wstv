import { describe, expect, it } from "vitest";

import { runFacebookPublishGuard } from "@/lib/facebookPublishGuard";
import {
  build2026Hook,
  buildCTA,
  buildFacebookCoverFramePresets,
  buildFacebookFirstFrameOverlayPresets,
  buildFirstFrameOverlayGuidance,
  rankFacebookCoverFramePresets,
  recommendFacebookOverlayPreset,
  buildHookFormattingPresets,
  buildPlatformPack,
  FACEBOOK_COVER_FRAME_MAX_LINE_LENGTH,
  HOOK_OVERLAY_MAX_LINE_LENGTH,
} from "@/lib/platform-packs";
import type { Arc } from "@/types";

const ALL_ARCS: Arc[] = [
  "Ambush attack",
  "Chase and takedown",
  "Defender stands ground",
  "Giant vs giant clash",
  "Territory dominance battle",
  "Pack hunting strategy",
  "Predator vs predator fight",
  "Escape from danger",
];

const BAIT_PATTERN =
  /you won['’]t believe|wait for it|nobody expected|watch till the end|watch to the end|comment who wins|comment below|tag a friend|share before it(?:'|’)s gone|like if you agree|shocking|brutal|insane|craziest|unbelievable/i;

const FORCED_ENGAGEMENT_PATTERN =
  /who wins\??|comment below|tag a friend|watch till the end|watch to the end|like if you agree/i;

describe("platform pack hook engine v2", () => {
  it("keeps generated hooks and CTAs away from bait-style phrasing", () => {
    for (const arc of ALL_ARCS) {
      const hooks = build2026Hook("Mountain Lion", "White-tailed Deer", arc);
      const cta = buildCTA(arc);

      for (const hook of hooks) {
        expect(hook).not.toMatch(BAIT_PATTERN);
      }
      expect(cta).not.toMatch(FORCED_ENGAGEMENT_PATTERN);
    }
  });

  it("keeps platform guidance observational, documentary, and supportable", () => {
    const pack = buildPlatformPack(
      "Mountain Lion",
      "White-tailed Deer",
      "Ambush attack",
      "Rocky Mountain forest edge and open meadow"
    );
    const guidance = JSON.stringify(pack).toLowerCase();

    expect(pack.facebook.cmpNote.toLowerCase()).toContain("upper safe zone");
    expect(pack.facebook.cmpNote.toLowerCase()).toContain("with or without sound");
    expect(pack.instagram.strategyNote?.toLowerCase()).toContain("species-clear");
    expect(pack.tiktok.strategyNote?.toLowerCase()).toContain("sound-on and sound-off");
    expect(guidance).not.toMatch(/invite-only|algorithm|85%|mid-action/);
  });

  it("keeps overlay guidance supportable and adds readable formatting presets", () => {
    const guidance = buildFirstFrameOverlayGuidance();
    const overlayPresets = buildHookFormattingPresets(
      "The mountain lion closed the space before the deer changed direction.",
      "Mountain Lion",
      "White-tailed Deer"
    );
    const serializedGuidance = JSON.stringify(guidance).toLowerCase();

    expect(serializedGuidance).toContain("upper safe zone");
    expect(serializedGuidance).toContain("sound off");
    expect(serializedGuidance).not.toMatch(/algorithm|85%|mid-action|officially/);
    expect(overlayPresets).toHaveLength(5);

    for (const preset of overlayPresets) {
      expect(preset.text).not.toMatch(BAIT_PATTERN);
      expect(preset.text).not.toMatch(FORCED_ENGAGEMENT_PATTERN);
      expect(preset.lines.length).toBeGreaterThan(0);
      expect(preset.lines.length).toBeLessThanOrEqual(2);
      for (const line of preset.lines) {
        expect(line.length).toBeLessThanOrEqual(HOOK_OVERLAY_MAX_LINE_LENGTH);
      }
    }
  });

  it("keeps species-first and observational-question presets readable and safe", () => {
    const overlayPresets = buildHookFormattingPresets(
      "The mountain lion closed the space before the deer changed direction.",
      "Mountain Lion",
      "White-tailed Deer"
    );

    const speciesFirst = overlayPresets.find(
      (preset) => preset.preset === "species_first"
    );
    const questionPreset = overlayPresets.find(
      (preset) => preset.preset === "observational_question"
    );

    expect(speciesFirst?.text.startsWith("Mountain Lion")).toBe(true);
    expect(questionPreset?.text.endsWith("?")).toBe(true);
    expect(questionPreset?.text).not.toMatch(FORCED_ENGAGEMENT_PATTERN);
  });

  it("adds Facebook-first overlay and cover-frame presets without adding new Instagram or TikTok overlay output", () => {
    const pack = buildPlatformPack(
      "Mountain Lion",
      "White-tailed Deer",
      "Escape from danger",
      "Rocky Mountain forest edge and open meadow"
    );

    expect(pack.facebook.overlayGuidance?.placement.toLowerCase()).toContain(
      "upper safe zone"
    );
    expect(pack.facebook.hookFormattingPresets).toHaveLength(5);
    expect(pack.facebook.facebookOverlayPresets).toHaveLength(5);
    expect(pack.facebook.facebookCoverFramePresets).toHaveLength(5);
    expect(pack.facebook.facebookOverlayRecommendation?.recommended).toBeTruthy();
    expect(pack.facebook.facebookCoverFrameRanking?.ranked).toHaveLength(5);
    expect(pack.instagram.hookFormattingPresets).toBeUndefined();
    expect(pack.tiktok.hookFormattingPresets).toBeUndefined();
    expect(
      (pack.instagram as Record<string, unknown>).facebookCoverFrameRanking
    ).toBeUndefined();
    expect(
      (pack.tiktok as Record<string, unknown>).facebookOverlayRecommendation
    ).toBeUndefined();
  });

  it("keeps Facebook overlay presets non-bait and readable", () => {
    const presets = buildFacebookFirstFrameOverlayPresets(
      "The mountain lion closed the space before the deer changed direction.",
      "Mountain Lion",
      "White-tailed Deer"
    );
    const speciesFirst = presets.find(
      (preset) => preset.preset === "facebook_species_first"
    );
    const question = presets.find(
      (preset) => preset.preset === "facebook_observational_question"
    );

    expect(speciesFirst?.text.startsWith("Mountain Lion")).toBe(true);
    expect(question?.text.endsWith("?")).toBe(true);

    for (const preset of presets) {
      expect(preset.text).not.toMatch(BAIT_PATTERN);
      expect(preset.text).not.toMatch(FORCED_ENGAGEMENT_PATTERN);
      expect(preset.lines.length).toBeLessThanOrEqual(2);
      for (const line of preset.lines) {
        expect(line.length).toBeLessThanOrEqual(HOOK_OVERLAY_MAX_LINE_LENGTH);
      }
    }
  });

  it("keeps Facebook cover-frame presets concise, species-clear, and discussion-safe", () => {
    const presets = buildFacebookCoverFramePresets(
      "The mountain lion closed the space before the deer changed direction.",
      "Mountain Lion",
      "White-tailed Deer",
      "Escape from danger"
    );
    const speciesPressure = presets.find(
      (preset) => preset.preset === "species_pressure"
    );
    const speciesQuestion = presets.find(
      (preset) => preset.preset === "species_question"
    );

    expect(speciesPressure?.text.startsWith("Mountain Lion")).toBe(true);
    expect(speciesQuestion?.text).toContain("?");
    expect(speciesQuestion?.text).not.toMatch(FORCED_ENGAGEMENT_PATTERN);

    for (const preset of presets) {
      expect(preset.text).not.toMatch(BAIT_PATTERN);
      expect(preset.text).not.toMatch(FORCED_ENGAGEMENT_PATTERN);
      expect(preset.lines.length).toBeLessThanOrEqual(2);
      for (const line of preset.lines) {
        expect(line.length).toBeLessThanOrEqual(
          FACEBOOK_COVER_FRAME_MAX_LINE_LENGTH
        );
      }
    }
  });

  it("ranks Facebook cover-frame presets by readable species-clear safety", () => {
    const presets = buildFacebookCoverFramePresets(
      "The mountain lion closed the space before the deer changed direction.",
      "Mountain Lion",
      "White-tailed Deer",
      "Escape from danger"
    );
    const ranking = rankFacebookCoverFramePresets(
      presets,
      "Mountain Lion",
      "White-tailed Deer"
    );

    expect(ranking?.ranked).toHaveLength(5);
    expect(ranking?.best.text).toMatch(/Mountain Lion|White-tailed Deer/i);
    expect(ranking?.best.text).not.toMatch(BAIT_PATTERN);
    expect(ranking?.best.text).not.toMatch(FORCED_ENGAGEMENT_PATTERN);
    expect(ranking?.reason.toLowerCase()).toContain("best cover-frame test");
    expect(ranking?.ranked.map((entry) => entry.score)).toEqual(
      [...(ranking?.ranked.map((entry) => entry.score) ?? [])].sort(
        (a, b) => b - a
      )
    );
  });

  it("recommends different Facebook overlay presets for different lane contexts", () => {
    const fishingHook =
      "The bald eagle read the waterline before the trout saw the strike window.";
    const defenderHook =
      "The cow elk held the boundary while the wolf pack tested the warning-step.";
    const fishingRecommendation = recommendFacebookOverlayPreset(
      buildFacebookFirstFrameOverlayPresets(
        fishingHook,
        "Bald Eagle",
        "Trout"
      ),
      fishingHook,
      "Bald Eagle",
      "Trout",
      "Fishing Strike"
    );
    const defenderRecommendation = recommendFacebookOverlayPreset(
      buildFacebookFirstFrameOverlayPresets(
        defenderHook,
        "Wolf Pack",
        "Cow Elk"
      ),
      defenderHook,
      "Wolf Pack",
      "Cow Elk",
      "Defender"
    );

    expect(fishingRecommendation?.recommended.preset).toBe(
      "facebook_short_pressure"
    );
    expect(defenderRecommendation?.recommended.preset).toBe(
      "facebook_documentary_tension"
    );
    expect(fishingRecommendation?.recommended.preset).not.toBe(
      defenderRecommendation?.recommended.preset
    );
    expect(fishingRecommendation?.recommended.text).not.toMatch(BAIT_PATTERN);
    expect(defenderRecommendation?.recommended.text).not.toMatch(
      FORCED_ENGAGEMENT_PATTERN
    );
    expect(fishingRecommendation?.reason.toLowerCase()).toContain(
      "best first overlay test"
    );
  });

  it("flags clickbait hooks and forced-engagement CTAs in the publish guard", () => {
    const report = runFacebookPublishGuard({
      hookText: "You won't believe what happens next.",
      ctaText: "Comment who wins.",
      caption: "This shocking wildlife moment is insane.",
      hashtags: ["#wildlife", "#usa", "#mountainlion", "#deer", "#wstv"],
      originalityConfirmed: true,
      predator: "Mountain Lion",
      prey: "White-tailed Deer",
    });

    expect(report.isPass).toBe(false);
    expect(report.warnings.join(" ").toLowerCase()).toMatch(
      /clickbait|discussion-safe|documentary/
    );
    expect(report.fixes?.join(" ").toLowerCase()).toMatch(
      /species-clear|behavior-led|documentary/
    );
  });

  it("passes documentary hook and CTA language through the publish guard", () => {
    const report = runFacebookPublishGuard({
      hookText: "The mountain lion closed the space before the deer changed direction.",
      ctaText: "What changed the outcome first?",
      caption:
        "The deer read the pressure late, and the mountain lion was already inside the lane.",
      hashtags: ["#wildlife", "#usa", "#mountainlion", "#deer", "#wstv"],
      originalityConfirmed: true,
      predator: "Mountain Lion",
      prey: "White-tailed Deer",
    });

    expect(report.isPass).toBe(true);
    expect(report.warnings).toHaveLength(0);
  });
});
