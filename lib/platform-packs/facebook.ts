import type {
  ContentLane,
  FacebookCoverFramePreset,
  FacebookCoverFramePresetScore,
  FacebookCoverFrameRanking,
  FacebookCoverFrameTextPreset,
  FacebookFirstFrameOverlayPreset,
  FacebookFrameChoice,
  FacebookFrameHeuristics,
  FacebookFrameHeuristicLevel,
  FacebookFrameSubjectFit,
  FacebookOverlayPreset,
  FacebookOverlayPresetScore,
  FacebookOverlayRecommendation,
} from "@/types";

import {
  buildFacebookCoverFramePresets,
  buildFacebookFirstFrameOverlayPresets,
} from "@/lib/platform-packs/overlays";
import {
  FACEBOOK_COVER_FRAME_MAX_LINE_LENGTH,
  HOOK_OVERLAY_MAX_LINE_LENGTH,
  OBSERVATIONAL_SIGNAL_PATTERN,
  hasBaitLikeCopy,
  hasForcedEngagementCopy,
  normalizeCopy,
} from "@/lib/platform-packs/shared";

function clampFacebookScore(score: number): number {
  return Math.max(0, Math.min(96, Math.round(score)));
}

const BANNED_CAPTION_CTA_PATTERNS = [
  /\bcomment YES\b/i,
  /\bsmash share\b/i,
  /\btag a friend\b/i,
  /\blike if\b/i,
  /\bshare if\b/i,
  /\bclick link\b/i,
  /\bgiveaway\b/i,
  /\bwin a\b/i,
] as const;

const OBSERVATIONAL_CTA_PATTERNS = [
  /\bwhat did you notice first\b/i,
  /\bwas this patience or panic\b/i,
  /\bwhich animal actually controlled the scene\b/i,
  /\bwhat changed the outcome first\b/i,
  /\bwas the key mistake physical or mental\b/i,
  /\bwhich second\b/i,
  /\bwhich turn\b/i,
  /\bwhat told you\b/i,
  /\bwhich body shift\b/i,
  /\bwould you have noticed\b/i,
  /\bwhich angle\b/i,
  /\bwhich animal gave up position first\b/i,
  /\bwould you have spotted\b/i,
] as const;

/**
 * Validates that a Facebook caption ends with a discussion-safe observational CTA.
 */
export function validateCaptionCTA(caption: string): boolean {
  const compact = normalizeCopy(caption);
  if (!compact) return false;
  if (BANNED_CAPTION_CTA_PATTERNS.some((pattern) => pattern.test(compact))) {
    return false;
  }

  const lastLine =
    compact.split(/\n+/).map(normalizeCopy).filter(Boolean).at(-1) ?? compact;
  if (!lastLine.endsWith("?")) return false;

  return OBSERVATIONAL_CTA_PATTERNS.some((pattern) => pattern.test(lastLine));
}

/**
 * Builds a non-bait observational CTA that stays discussion-led for Facebook packaging.
 */
export function buildObservationalCTA(species: string, arc: string): string {
  const cleanSpecies = normalizeCopy(species);

  switch (arc) {
    case "Ambush attack":
    case "Chase and takedown":
    case "Escape from danger":
      return "What changed the outcome first?";
    case "Defender stands ground":
    case "Territory dominance battle":
      return "Which animal actually controlled the scene?";
    case "Giant vs giant clash":
    case "Predator vs predator fight":
      return "Was this patience or panic?";
    case "Pack hunting strategy":
      return "What did you notice first?";
    default:
      return cleanSpecies
        ? `What did you notice first in the ${cleanSpecies.toLowerCase()} sequence?`
        : "What did you notice first?";
  }
}

function facebookFrameQualityTieBreak(
  heuristics?: FacebookFrameHeuristics
): number {
  if (!heuristics) return 0;

  let score = 0;
  if (heuristics.speciesReadability === "high") score += 6;
  else if (heuristics.speciesReadability === "low") score -= 6;
  if (heuristics.textAnimalCollisionRisk === "low") score += 5;
  else if (heuristics.textAnimalCollisionRisk === "high") score -= 8;
  if (heuristics.silhouetteConflictRisk === "low") score += 4;
  else if (heuristics.silhouetteConflictRisk === "high") score -= 6;
  if (heuristics.leftRightSubjectFit === "strong") score += 5;
  else if (heuristics.leftRightSubjectFit === "crowded") score -= 7;
  return score;
}

function facebookSpeciesTerms(predator: string, prey: string): string[] {
  return [normalizeCopy(predator), normalizeCopy(prey)]
    .filter(Boolean)
    .flatMap((name) => {
      const parts = name.split(/\s+/).filter((part) => part.length >= 4);
      return [name, ...parts];
    })
    .map((term) => term.toLowerCase());
}

function hasFacebookSpeciesClarity(
  text: string,
  predator: string,
  prey: string
): boolean {
  const lower = normalizeCopy(text).toLowerCase();
  return facebookSpeciesTerms(predator, prey).some((term) =>
    lower.includes(term)
  );
}

function startsWithFacebookSpecies(
  text: string,
  predator: string,
  prey: string
): boolean {
  const lower = normalizeCopy(text).toLowerCase();
  return [normalizeCopy(predator), normalizeCopy(prey)]
    .filter(Boolean)
    .some((name) => lower.startsWith(name.toLowerCase()));
}

function hasFacebookPressureClarity(text: string): boolean {
  const lower = normalizeCopy(text).toLowerCase();
  return (
    OBSERVATIONAL_SIGNAL_PATTERN.test(lower) ||
    /\b(vs|pressure|strike|clash|boundary|escape|breakaway|dominance|waterline|lane|line|space|read|tension|pursuit|window|ground)\b/i.test(
      lower
    )
  );
}

function hasReadableFacebookLines(lines: string[], maxLineLength: number): boolean {
  return (
    lines.length > 0 &&
    lines.length <= 2 &&
    lines.every((line) => line.length <= maxLineLength)
  );
}

function facebookReason(signals: string[], fallback: string): string {
  const usable = signals.slice(0, 3);
  return usable.length ? usable.join("; ") : fallback;
}

function buildFrame1CallSignal(frame1Choice: FacebookFrameChoice): string {
  return frame1Choice === "species-first"
    ? "supports a species-first frame 1"
    : "supports a tension-first frame 1";
}

function buildFacebookLaneSignal(contentLane: ContentLane): string | null {
  switch (contentLane) {
    case "Pack Hunt":
      return "it matches a closing-angle chase read";
    case "Defender":
      return "it supports a clean hold-ground read";
    case "Fishing Strike":
      return "it matches a fast strike-window read";
    case "Rut Battle":
      return "it keeps rut posture readable";
    case "Escape":
      return "it supports a clean breakaway read";
    default:
      return null;
  }
}

function buildFacebookCoverRecommendationReason(
  best: FacebookCoverFramePresetScore
): string {
  const heuristics = best.frameHeuristics;
  const parts = [
    heuristics?.speciesReadability === "high"
      ? "the species read stays clear at thumbnail size"
      : "the cover stays readable at Facebook size",
    heuristics?.textAnimalCollisionRisk === "low"
      ? "the text avoids crowding the animals"
      : heuristics?.leftRightSubjectFit === "strong"
        ? "the text still fits cleanly in the upper frame"
        : null,
    heuristics?.frame1Choice === "species-first"
      ? "it supports a species-first cover test"
      : "it keeps the tension obvious before playback starts",
  ].filter(Boolean);

  return `Best cover-frame test: ${best.label} because ${parts
    .slice(0, 3)
    .join(", ")}.`;
}

function buildFacebookOverlayRecommendationReason(
  recommended: FacebookOverlayPresetScore,
  contentLane: ContentLane
): string {
  const heuristics = recommended.frameHeuristics;
  const parts = [
    heuristics?.frame1Choice === "species-first"
      ? "it keeps the species read obvious in frame 1"
      : "it gets to the tension immediately in frame 1",
    heuristics?.textAnimalCollisionRisk === "low"
      ? "the overlay stays clear of the animals"
      : heuristics?.leftRightSubjectFit === "strong"
        ? "the overlay stays compact in the upper frame"
        : null,
    buildFacebookLaneSignal(contentLane),
  ].filter(Boolean);

  return `Best first overlay test: ${recommended.label} because ${parts
    .slice(0, 3)
    .join(", ")}.`;
}

function toFrameLevel(score: number): FacebookFrameHeuristicLevel {
  if (score <= 0) return "low";
  if (score === 1) return "medium";
  return "high";
}

function toFrameFit(score: number): FacebookFrameSubjectFit {
  if (score >= 2) return "strong";
  if (score <= -1) return "crowded";
  return "balanced";
}

function titleCaseFrameValue(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function hasBothNamedSpecies(
  text: string,
  predator: string,
  prey: string
): boolean {
  const lower = normalizeCopy(text).toLowerCase();
  const predatorName = normalizeCopy(predator).toLowerCase();
  const preyName = normalizeCopy(prey).toLowerCase();

  return Boolean(
    predatorName &&
      preyName &&
      lower.includes(predatorName) &&
      lower.includes(preyName)
  );
}

function chooseFacebookFrame1Choice(
  hook: string,
  contentLane: ContentLane,
  text = ""
): FacebookFrameChoice {
  const lower = normalizeCopy(`${hook} ${text}`).toLowerCase();

  switch (contentLane) {
    case "Pack Hunt":
    case "Fishing Strike":
    case "Escape":
    case "Defender":
      return "tension-first";
    case "Rut Battle":
      return "species-first";
    default:
      break;
  }

  if (/(waterline|strike|breakaway|pursuit|angle|ambush|escape|danger)/.test(lower)) {
    return "tension-first";
  }

  if (/(warning-step|stance|dominance|territory|clash|footing|shoulder|antler|standoff|claim)/.test(lower)) {
    return "species-first";
  }

  return "species-first";
}

function buildFacebookFrameHeuristics({
  text,
  lines,
  predator,
  prey,
  maxLineLength,
  hook,
  contentLane = "Auto",
  mode,
}: {
  text: string;
  lines: string[];
  predator: string;
  prey: string;
  maxLineLength: number;
  hook: string;
  contentLane?: ContentLane;
  mode: "overlay" | "cover";
}): FacebookFrameHeuristics {
  const compact = normalizeCopy(text);
  const lower = compact.toLowerCase();
  const speciesClear = hasFacebookSpeciesClarity(compact, predator, prey);
  const speciesLead = startsWithFacebookSpecies(compact, predator, prey);
  const hasBothSpecies =
    hasBothNamedSpecies(compact, predator, prey) || /\bvs\b/i.test(compact);
  const longestSpeciesLength = Math.max(
    normalizeCopy(predator).length,
    normalizeCopy(prey).length,
    0
  );
  const longestLine = lines.reduce(
    (max, line) => Math.max(max, line.length),
    0
  );
  const fillRatio = maxLineLength > 0 ? longestLine / maxLineLength : 1;
  const twoLine = lines.length === 2;
  const shortLines =
    lines.length > 0 &&
    lines.every((line) => line.length <= Math.round(maxLineLength * 0.68));
  const frame1Choice = chooseFacebookFrame1Choice(hook, contentLane, compact);

  let speciesScore = 0;
  if (speciesLead) speciesScore += 2;
  if (speciesClear) speciesScore += 1;
  if (!speciesClear) speciesScore -= 2;
  if (hasBothSpecies && longestSpeciesLength >= 14) speciesScore -= 1;

  let collisionScore = 0;
  if (fillRatio > 0.9) collisionScore += 2;
  else if (fillRatio > 0.76) collisionScore += 1;
  if (hasBothSpecies) collisionScore += 1;
  if (longestSpeciesLength >= 14 && fillRatio > 0.7) collisionScore += 1;
  if (/\?/.test(compact) && fillRatio > 0.72) collisionScore += 1;
  if (mode === "cover" && /\bvs\b/i.test(compact)) collisionScore += 1;
  if (twoLine) collisionScore -= 1;
  if (shortLines) collisionScore -= 1;

  let silhouetteScore = 0;
  if (!twoLine && fillRatio > 0.84) silhouetteScore += 2;
  else if (fillRatio > 0.72) silhouetteScore += 1;
  if (hasBothSpecies) silhouetteScore += 1;
  if (
    /(vs|clash|strike|pursuit|warning-step|dominance|territory)/.test(lower) &&
    fillRatio > 0.68
  ) {
    silhouetteScore += 1;
  }
  if (speciesLead && twoLine) silhouetteScore -= 1;
  if (shortLines) silhouetteScore -= 1;

  let fitScore = 0;
  if (twoLine && speciesLead && !hasBothSpecies) fitScore += 2;
  else if (twoLine && !hasBothSpecies) fitScore += 1;
  if (shortLines) fitScore += 1;
  if (hasBothSpecies) fitScore -= 1;
  if (fillRatio > 0.88) fitScore -= 1;

  const speciesReadability =
    speciesScore >= 2 ? "high" : speciesScore >= 0 ? "medium" : "low";
  const textAnimalCollisionRisk = toFrameLevel(collisionScore);
  const silhouetteConflictRisk = toFrameLevel(silhouetteScore);
  const leftRightSubjectFit = toFrameFit(fitScore);

  return {
    speciesReadability,
    textAnimalCollisionRisk,
    silhouetteConflictRisk,
    leftRightSubjectFit,
    frame1Choice,
    summary: `${titleCaseFrameValue(speciesReadability)} species readability, ${textAnimalCollisionRisk} text-animal collision risk, ${silhouetteConflictRisk} silhouette conflict risk, ${leftRightSubjectFit} upper-frame subject fit, ${frame1Choice} frame-1 call.`,
  };
}

function coverFrameChoiceBias(
  preset: FacebookCoverFramePreset,
  frame1Choice: FacebookFrameChoice
): number {
  if (frame1Choice === "species-first") {
    switch (preset) {
      case "two_line_cover":
        return 4;
      case "species_pressure":
        return 2;
      case "species_question":
        return 2;
      case "short_documentary":
        return 1;
      case "conflict_statement":
        return -4;
    }
  }

  switch (preset) {
    case "two_line_cover":
      return 4;
    case "short_documentary":
      return 3;
    case "species_pressure":
      return 2;
    case "species_question":
      return 1;
    case "conflict_statement":
      return -2;
  }

  return 0;
}

function overlayFrameChoiceBias(
  preset: FacebookFirstFrameOverlayPreset,
  frame1Choice: FacebookFrameChoice
): number {
  if (frame1Choice === "species-first") {
    switch (preset) {
      case "facebook_two_line_readable":
        return 4;
      case "facebook_species_first":
        return 4;
      case "facebook_documentary_tension":
        return 2;
      case "facebook_observational_question":
        return 1;
      case "facebook_short_pressure":
        return -4;
    }
  }

  switch (preset) {
    case "facebook_two_line_readable":
      return 4;
    case "facebook_short_pressure":
      return 4;
    case "facebook_documentary_tension":
      return 3;
    case "facebook_observational_question":
      return 2;
    case "facebook_species_first":
      return 1;
  }

  return 0;
}

function scoreFacebookCoverFramePreset(
  preset: FacebookCoverFrameTextPreset,
  predator: string,
  prey: string,
  hook = "",
  contentLane: ContentLane = "Auto"
): FacebookCoverFramePresetScore {
  const signals: string[] = [];
  const text = normalizeCopy(preset.text);
  const speciesClear = hasFacebookSpeciesClarity(text, predator, prey);
  const speciesLead = startsWithFacebookSpecies(text, predator, prey);
  const pressureClear = hasFacebookPressureClarity(text);
  const readable = hasReadableFacebookLines(
    preset.lines,
    FACEBOOK_COVER_FRAME_MAX_LINE_LENGTH
  );
  const bait = hasBaitLikeCopy(text) || hasForcedEngagementCopy(text);
  const frameHeuristics = buildFacebookFrameHeuristics({
    text,
    lines: preset.lines,
    predator,
    prey,
    maxLineLength: FACEBOOK_COVER_FRAME_MAX_LINE_LENGTH,
    hook,
    contentLane,
    mode: "cover",
  });

  let score = 12;

  if (speciesClear) {
    score += 12;
    signals.push("species stays clear at Facebook thumbnail size");
  } else {
    score -= 14;
  }

  if (speciesLead) {
    score += 3;
    signals.push("species leads the cover line");
  }

  if (readable) {
    score += 14;
    signals.push("holds as a compact 1-2 line cover");
  } else {
    score -= 20;
  }

  if (pressureClear) {
    score += 8;
    signals.push("tension cue still reads at thumbnail size");
  } else {
    score -= 10;
  }

  if (!bait) {
    score += 6;
    signals.push("stays documentary and non-bait");
  } else {
    score -= 35;
  }

  if (frameHeuristics.speciesReadability === "high") {
    score += 5;
    signals.push("keeps species readability high");
  } else if (frameHeuristics.speciesReadability === "low") {
    score -= 12;
  }

  if (frameHeuristics.textAnimalCollisionRisk === "low") {
    score += 7;
    signals.push("avoids crowding the animals");
  } else if (frameHeuristics.textAnimalCollisionRisk === "medium") {
    score -= 3;
  } else {
    score -= 18;
  }

  if (frameHeuristics.silhouetteConflictRisk === "low") {
    score += 5;
    signals.push("keeps text off the main silhouette");
  } else if (frameHeuristics.silhouetteConflictRisk === "medium") {
    score -= 2;
  } else {
    score -= 14;
  }

  if (frameHeuristics.leftRightSubjectFit === "strong") {
    score += 6;
    signals.push("fits cleanly in the upper frame");
  } else if (frameHeuristics.leftRightSubjectFit === "crowded") {
    score -= 10;
  }

  score += coverFrameChoiceBias(preset.preset, frameHeuristics.frame1Choice);
  signals.push(buildFrame1CallSignal(frameHeuristics.frame1Choice));

  if (preset.preset === "two_line_cover") score += 2;
  if (preset.preset === "species_question") score += 1;
  if (preset.preset === "conflict_statement" && pressureClear) score += 1;
  if (preset.preset === "conflict_statement" && !pressureClear) score -= 10;

  return {
    preset: preset.preset,
    label: preset.label,
    text: preset.text,
    score: clampFacebookScore(score),
    reasons: signals.length ? signals : ["clean Facebook cover readability"],
    frameHeuristics,
  };
}

export function rankFacebookCoverFramePresets(
  presets: FacebookCoverFrameTextPreset[],
  predator: string,
  prey: string,
  hook = "",
  contentLane: ContentLane = "Auto"
): FacebookCoverFrameRanking | undefined {
  if (!presets.length) return undefined;

  const originalIndex = new Map(
    presets.map((preset, index) => [preset.preset, index] as const)
  );
  const ranked = presets
    .map((preset) =>
      scoreFacebookCoverFramePreset(preset, predator, prey, hook, contentLane)
    )
    .sort(
      (a, b) =>
        b.score - a.score ||
        facebookFrameQualityTieBreak(b.frameHeuristics) -
          facebookFrameQualityTieBreak(a.frameHeuristics) ||
        (originalIndex.get(a.preset) ?? 0) - (originalIndex.get(b.preset) ?? 0)
    );
  const best = ranked[0];

  if (!best) return undefined;

  return {
    best,
    ranked,
    reason: buildFacebookCoverRecommendationReason(best),
  };
}

function laneOverlayPresetBias(
  contentLane: ContentLane,
  preset: FacebookFirstFrameOverlayPreset
): number {
  const bias: Partial<Record<
    ContentLane,
    Partial<Record<FacebookFirstFrameOverlayPreset, number>>
  >> = {
    Auto: {},
    "Pack Hunt": {
      facebook_two_line_readable: 6,
      facebook_short_pressure: 5,
      facebook_species_first: 2,
      facebook_documentary_tension: 2,
    },
    Defender: {
      facebook_two_line_readable: 6,
      facebook_documentary_tension: 5,
      facebook_observational_question: 3,
      facebook_species_first: 2,
    },
    "Fishing Strike": {
      facebook_two_line_readable: 6,
      facebook_short_pressure: 5,
      facebook_observational_question: 3,
      facebook_species_first: 2,
    },
    "Rut Battle": {
      facebook_two_line_readable: 5,
      facebook_documentary_tension: 4,
      facebook_species_first: 5,
      facebook_observational_question: 2,
    },
    Escape: {
      facebook_two_line_readable: 6,
      facebook_short_pressure: 5,
      facebook_observational_question: 3,
      facebook_species_first: 2,
    },
  };

  return bias[contentLane]?.[preset] ?? 0;
}

function hookOverlayPresetBias(
  hook: string,
  preset: FacebookFirstFrameOverlayPreset
): number {
  const compact = normalizeCopy(hook);
  const lower = compact.toLowerCase();
  let score = 0;

  if (compact.length > 72 && preset === "facebook_documentary_tension") score += 3;
  if (/\?/.test(compact) && preset === "facebook_observational_question") score += 3;
  if (/(waterline|strike|escape lane|breakaway|pursuit)/.test(lower)) {
    if (preset === "facebook_two_line_readable") score += 3;
    if (preset === "facebook_short_pressure") score += 3;
  }
  if (/(boundary|warning-step|stance|dominance|territory|clash)/.test(lower)) {
    if (preset === "facebook_documentary_tension") score += 3;
    if (preset === "facebook_species_first") score += 2;
  }

  return score;
}

function scoreFacebookOverlayPreset(
  preset: FacebookOverlayPreset,
  hook: string,
  predator: string,
  prey: string,
  contentLane: ContentLane
): FacebookOverlayPresetScore {
  const signals: string[] = [];
  const text = normalizeCopy(preset.text);
  const speciesClear = hasFacebookSpeciesClarity(text, predator, prey);
  const pressureClear = hasFacebookPressureClarity(text);
  const readable = hasReadableFacebookLines(
    preset.lines,
    HOOK_OVERLAY_MAX_LINE_LENGTH
  );
  const bait = hasBaitLikeCopy(text) || hasForcedEngagementCopy(text);
  const laneBias = laneOverlayPresetBias(contentLane, preset.preset);
  const frameHeuristics = buildFacebookFrameHeuristics({
    text,
    lines: preset.lines,
    predator,
    prey,
    maxLineLength: HOOK_OVERLAY_MAX_LINE_LENGTH,
    hook,
    contentLane,
    mode: "overlay",
  });

  let score = 12;

  if (readable) {
    score += 14;
    signals.push("holds as a compact frame-1 overlay");
  } else {
    score -= 20;
  }

  if (speciesClear) {
    score += 8;
    signals.push("keeps the species read obvious");
  } else {
    score -= 4;
  }

  if (pressureClear) {
    score += 8;
    signals.push("gets to the behavior cue quickly");
  }

  if (!bait) {
    score += 6;
    signals.push("stays documentary and non-bait");
  } else {
    score -= 40;
  }

  if (frameHeuristics.speciesReadability === "high") {
    score += 6;
    signals.push("keeps species readability high");
  } else if (frameHeuristics.speciesReadability === "low") {
    score -= 10;
  }

  if (frameHeuristics.textAnimalCollisionRisk === "low") {
    score += 5;
    signals.push("avoids crowding the animals");
  } else if (frameHeuristics.textAnimalCollisionRisk === "medium") {
    score -= 2;
  } else {
    score -= 16;
  }

  if (frameHeuristics.silhouetteConflictRisk === "low") {
    score += 4;
    signals.push("keeps text off the main silhouette");
  } else if (frameHeuristics.silhouetteConflictRisk === "medium") {
    score -= 2;
  } else {
    score -= 12;
  }

  if (frameHeuristics.leftRightSubjectFit === "strong") {
    score += 5;
    signals.push("fits cleanly in the upper frame");
  } else if (frameHeuristics.leftRightSubjectFit === "crowded") {
    score -= 8;
  }

  if (laneBias > 0) {
    score += laneBias;
    signals.push(
      buildFacebookLaneSignal(contentLane) ??
        "matches the current Facebook test context"
    );
  }

  score += hookOverlayPresetBias(hook, preset.preset);
  score += overlayFrameChoiceBias(preset.preset, frameHeuristics.frame1Choice);
  signals.push(buildFrame1CallSignal(frameHeuristics.frame1Choice));

  return {
    preset: preset.preset,
    label: preset.label,
    text: preset.text,
    score: clampFacebookScore(score),
    reason: facebookReason(signals, "clean frame-1 overlay read"),
    frameHeuristics,
  };
}

export function recommendFacebookOverlayPreset(
  presets: FacebookOverlayPreset[],
  hook: string,
  predator: string,
  prey: string,
  contentLane: ContentLane = "Auto"
): FacebookOverlayRecommendation | undefined {
  if (!presets.length) return undefined;

  const originalIndex = new Map(
    presets.map((preset, index) => [preset.preset, index] as const)
  );
  const tieBreakScore = (entry: FacebookOverlayPresetScore) =>
    laneOverlayPresetBias(contentLane, entry.preset) +
    hookOverlayPresetBias(hook, entry.preset);
  const ranked = presets
    .map((preset) =>
      scoreFacebookOverlayPreset(preset, hook, predator, prey, contentLane)
    )
    .sort(
      (a, b) =>
        b.score - a.score ||
        facebookFrameQualityTieBreak(b.frameHeuristics) -
          facebookFrameQualityTieBreak(a.frameHeuristics) ||
        tieBreakScore(b) - tieBreakScore(a) ||
        (originalIndex.get(a.preset) ?? 0) - (originalIndex.get(b.preset) ?? 0)
    );
  const recommended = ranked[0];

  if (!recommended) return undefined;

  return {
    recommended,
    alternatives: ranked.slice(1, 3),
    reason: buildFacebookOverlayRecommendationReason(recommended, contentLane),
  };
}

export {
  buildFacebookCoverFramePresets,
  buildFacebookFirstFrameOverlayPresets,
};
