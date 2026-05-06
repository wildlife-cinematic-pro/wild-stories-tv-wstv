import { describe, expect, it } from "vitest";

import { runFacebookPublishGuard } from "@/lib/facebookPublishGuard";
import {
  build2026Hook,
  buildCTA,
  buildFacebookCoverFramePresets,
  buildFacebookFirstFrameOverlayPresets,
  buildHashtags,
  buildFirstFrameOverlayGuidance,
  rankFacebookCoverFramePresets,
  recommendFacebookOverlayPreset,
  buildHookFormattingPresets,
  buildObservationalCTA,
  buildPlatformPack,
  validateCaptionCTA,
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

    expect(pack.facebook.pinnedComment).toContain("Wild Crew");
    expect(pack.facebook.pinnedComment.toLowerCase()).not.toMatch(
      /like|share|follow|comment yes/
    );
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

  it("varies CTAs without falling back to repetitive read or pressure phrasing", () => {
    const ctas = ALL_ARCS.map((arc) => buildCTA(arc));

    expect(new Set(ctas).size).toBe(ALL_ARCS.length);
    for (const cta of ctas) {
      expect(cta).not.toMatch(BAIT_PATTERN);
      expect(cta).not.toMatch(FORCED_ENGAGEMENT_PATTERN);
      expect(cta.toLowerCase()).not.toMatch(/changed the read|pressure feel|comment|tag/);
    }
  });

  it("validates observational caption CTAs and rejects bait-style CTA endings", () => {
    expect(
      validateCaptionCTA(
        "Mountain lion pressure closes before the mule deer finds a clean turn. What changed the outcome first?"
      )
    ).toBe(true);
    expect(
      validateCaptionCTA(
        "Mountain lion pressure closes fast. Comment YES and tag a friend."
      )
    ).toBe(false);
  });

  it("builds non-bait observational CTAs for Facebook packaging", () => {
    const cta = buildObservationalCTA(
      "Mountain Lion vs White-tailed Deer",
      "Escape from danger"
    );

    expect(cta).toMatch(/\?$/);
    expect(cta).not.toMatch(FORCED_ENGAGEMENT_PATTERN);
    expect(cta).toMatch(/what changed the outcome first|what did you notice first|which animal actually controlled the scene|was this patience or panic/i);
  });

  it("keeps the Facebook long caption on a safe observational CTA after packaging", () => {
    const pack = buildPlatformPack(
      "Mountain Lion",
      "White-tailed Deer",
      "Escape from danger",
      "Rocky Mountain forest edge and open meadow"
    );

    expect(validateCaptionCTA(pack.facebook.caption)).toBe(true);
  });

  it("sharpens rut and giant-clash copy with heavier documentary body-language detail", () => {
    const giantHooks = build2026Hook("Bull Elk", "Bull Elk", "Giant vs giant clash");
    const rutPack = buildPlatformPack(
      "Bull Elk",
      "Bull Elk",
      "Territory dominance battle",
      "Rocky Mountain meadow",
      "Rut Battle"
    );
    const serializedRut = JSON.stringify(rutPack.facebook).toLowerCase();

    expect(giantHooks.join(" ").toLowerCase()).toMatch(
      /shoulder line|standoff|footing/
    );
    expect(serializedRut).toMatch(/antler|shoulder|rut-season|claim/);
    expect(serializedRut).not.toMatch(/what looked|changed the read|pressure feel/);
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
      "facebook_two_line_readable"
    );
    expect(defenderRecommendation?.recommended.preset).toBe(
      "facebook_two_line_readable"
    );
    expect(fishingRecommendation?.recommended.score).toBeLessThan(100);
    expect(defenderRecommendation?.recommended.score).toBeLessThan(100);
    expect(fishingRecommendation?.reason.toLowerCase()).toContain("strike-window");
    expect(defenderRecommendation?.reason.toLowerCase()).toContain("hold-ground");
    expect(fishingRecommendation?.recommended.text).not.toMatch(BAIT_PATTERN);
    expect(defenderRecommendation?.recommended.text).not.toMatch(
      FORCED_ENGAGEMENT_PATTERN
    );
    expect(fishingRecommendation?.reason.toLowerCase()).toContain(
      "best first overlay test"
    );
  });

  it("adds frame-aware heuristics to Facebook overlay and cover recommendations", () => {
  const pack = buildPlatformPack(
    "Bald Eagle",
    "Trout",
    "Ambush attack",
    "Riverbank reeds and shallow water",
    "Fishing Strike"
  );

  const overlayHeuristics =
    pack.facebook.facebookOverlayRecommendation?.recommended.frameHeuristics;
  const coverHeuristics =
    pack.facebook.facebookCoverFrameRanking?.best.frameHeuristics;

  expect(overlayHeuristics).toBeTruthy();
  expect(coverHeuristics).toBeTruthy();
  expect(overlayHeuristics?.frame1Choice).toBe("tension-first");
  expect(coverHeuristics?.summary.toLowerCase()).toContain(
    "species readability"
  );
  expect(
    JSON.stringify({ overlayHeuristics, coverHeuristics }).toLowerCase()
  ).not.toMatch(/instagram|tiktok|computer vision|detected/);
  });

  it("keeps rut battle recommendations species-forward when the frame needs heavy-body readability", () => {
  const pack = buildPlatformPack(
    "Bull Elk",
    "Bull Elk",
    "Giant vs giant clash",
    "Rocky Mountain meadow",
    "Rut Battle"
  );

  expect(
    pack.facebook.facebookOverlayRecommendation?.recommended.frameHeuristics
      ?.frame1Choice
  ).toBe("species-first");
  expect(
    pack.facebook.facebookCoverFrameRanking?.best.frameHeuristics
      ?.frame1Choice
  ).toBe("species-first");
  expect(pack.facebook.facebookCoverFrameRanking?.best.text).toMatch(
    /Bull Elk|Dominance posture|Tension building/i
  );
  });

  it("keeps Facebook recommendation reasons specific and non-generic", () => {
  const pack = buildPlatformPack(
    "Bald Eagle",
    "Trout",
    "Ambush attack",
    "Riverbank reeds and shallow water",
    "Fishing Strike"
  );

  const combined = `${pack.facebook.facebookOverlayRecommendation?.reason} ${pack.facebook.facebookCoverFrameRanking?.reason}`.toLowerCase();

  expect(combined).toMatch(
    /frame 1|thumbnail size|animals|strike-window|species read|tension/
  );
  expect(combined).not.toMatch(
    /balanced first-frame clarity|balanced facebook cover readability|context fit/
  );
});
  it("keeps same-species mirror-match hashtags at five unique clean tags", () => {
    const hashtags = buildHashtags("Bull Elk", "Bull Elk", "Giant vs giant clash", {
      count: 5,
      contentLane: "Rut Battle",
    }).split(/\s+/);

    expect(hashtags).toHaveLength(5);
    expect(new Set(hashtags).size).toBe(5);
    expect(hashtags).toEqual([
      "#wildlife",
      "#bullelk",
      "#rutbattle",
      "#animalclash",
      "#usa",
    ]);
  });

  it("falls back to arc-led Facebook copy when Rut Battle is not species-compatible", () => {
    const pack = buildPlatformPack(
      "Grizzly Bear",
      "Bison",
      "Giant vs giant clash",
      "Yellowstone open meadow and dry grassland",
      "Rut Battle"
    );
    const serializedFacebook = JSON.stringify(pack.facebook).toLowerCase();

    expect(serializedFacebook).not.toMatch(/antler|rut-season/);
    expect(pack.facebook.hashtags).not.toContain("#rutbattle");
    expect(pack.facebook.facebookOverlayRecommendation?.reason.toLowerCase()).not.toContain(
      "rut posture"
    );
  });

  it("creates real Facebook cover and overlay score separation instead of saturating at 100", () => {
    const pack = buildPlatformPack(
      "Mountain Lion",
      "White-tailed Deer",
      "Ambush attack",
      "Rocky Mountain forest edge and open meadow",
      "Auto"
    );
    const coverScores =
      pack.facebook.facebookCoverFrameRanking?.ranked.map((entry) => entry.score) ?? [];
    const overlayRecommendation = pack.facebook.facebookOverlayRecommendation;
    const overlayScores = overlayRecommendation
      ? [overlayRecommendation.recommended, ...overlayRecommendation.alternatives].map(
          (entry) => entry.score
        )
      : [];

    expect(coverScores).toHaveLength(5);
    expect(Math.max(...coverScores)).toBeLessThanOrEqual(96);
    expect(new Set(coverScores).size).toBeGreaterThan(1);
    expect(Math.max(...overlayScores)).toBeLessThanOrEqual(96);
    expect(new Set(overlayScores).size).toBeGreaterThan(1);
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
      /clickbait|natural wildlife question|species-clear/
    );
    expect(report.fixes?.join(" ").toLowerCase()).toMatch(
      /natural wildlife question|lead with species|behavior/
    );
  });

  it("flags static, loop, text-heavy, originality, engagement-bait, and graphic packaging risks with fixes", () => {
    const report = runFacebookPublishGuard({
      hookText: "Static slideshow opener with no visible subject motion.",
      ctaText: "Like and share this now.",
      caption:
        "Still frame only, seamless loop, text-heavy montage, watermark from another source, brutal death, bloodbath, and comment YES.",
      hashtags: ["#wildlife", "#usa", "#mountainlion", "#deer", "#wstv"],
      originalityConfirmed: false,
      predator: "Mountain Lion",
      prey: "White-tailed Deer",
    });

    const joinedWarnings = report.warnings.join(" ");
    const joinedFixes = report.fixes.join(" ");

    expect(report.isPass).toBe(false);
    expect(joinedWarnings).toMatch(/static still|looped or recycled|text-heavy montage/i);
    expect(joinedWarnings).toMatch(/reposted, compiled, or borrowed footage/i);
    expect(joinedWarnings).toMatch(/engagement bait/i);
    expect(joinedWarnings).toMatch(/graphic wildlife wording/i);
    expect(joinedFixes).toMatch(/visible wildlife motion/i);
    expect(joinedFixes).toMatch(/beginning, escalation, and aftermath/i);
    expect(joinedFixes).toMatch(/upper safe zone/i);
    expect(joinedFixes).toMatch(/original WSTV-generated image/i);
    expect(joinedFixes).toMatch(/natural wildlife question/i);
    expect(joinedFixes).toMatch(/documentary-safe tension language/i);
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
