// file: lib/recommendations.ts

import { runFacebookPublishGuard } from "@/lib/facebookPublishGuard";
import { scoreOpeningFrame } from "@/lib/openingFrameScore";
import {
  getBestHookFamilyForDurationLane,
  getPerformanceSnapshot,
  getTopSnapshotForDurationLane,
} from "@/lib/performanceMemory";
import { scoreUSAudience } from "@/lib/usAudienceProfile";
import type { PublishGuardInput } from "@/lib/facebookPublishGuard";
import type { OpeningFrameInput } from "@/lib/openingFrameScore";
import type { USAudienceScoreInput } from "@/lib/usAudienceProfile";
import type {
  DurationLane,
  HookFamily,
  PerformanceSnapshot,
  KlingModel,
  RealismMode,
  RunwayModel,
} from "@/types";

export type DriftLevel = "LOW" | "MEDIUM" | "HIGH";
export type RecommendationLane = DurationLane;

export type QualityWarning = {
  id: string;
  title: string;
  detail: string;
  severity: "info" | "warning" | "danger";
};

export type QualityRecommended = Partial<{
  realismMode: RealismMode;
  motionOnlyI2V: boolean;
  referenceLock: boolean;
  singleActionRule: boolean;
  microMotion: boolean;
  heroVeo: boolean;
  durationLane: RecommendationLane;
}>;

export type QualityRecommendations = {
  level: DriftLevel;
  warnings: QualityWarning[];
  why: string[];
  recommended: QualityRecommended;
  suggestedLane: RecommendationLane;
  publishSafeRecommendation: string;
  publishWorthy: boolean;
};

export type QualityRecommendationInput = {
  driftRisk: DriftLevel;
  realismMode: RealismMode;
  runwayModel: RunwayModel;
  klingModel: KlingModel;
  durationLane: RecommendationLane;
  hookFamily?: HookFamily | "all";
  performance?: PerformanceSnapshot | null;

  motionOnlyI2V: boolean;
  referenceLock: boolean;
  singleActionRule: boolean;
  microMotion: boolean;
  heroVeo: boolean;

  concept?: USAudienceScoreInput;
  openingFrame?: OpeningFrameInput;
  packaging?: PublishGuardInput;
};

function isKlingPro(model: KlingModel): boolean {
  return String(model).toLowerCase().includes("pro");
}

function isRunway45(model: RunwayModel): boolean {
  return String(model).includes("4.5");
}

function getLanePerformance(
  durationLane: RecommendationLane,
  hookFamily?: HookFamily | "all",
  currentPerformance?: PerformanceSnapshot | null
): PerformanceSnapshot | null {
  if (currentPerformance && currentPerformance.durationLane === durationLane) {
    return currentPerformance;
  }

  const resolvedHookFamily =
    hookFamily && hookFamily !== "all"
      ? hookFamily
      : getBestHookFamilyForDurationLane(durationLane) ?? "danger";

  return (
    getPerformanceSnapshot(durationLane, resolvedHookFamily) ??
    getTopSnapshotForDurationLane(durationLane)
  );
}

export function getQualityRecommendations(input: QualityRecommendationInput): QualityRecommendations {
  const why: string[] = [];
  const warnings: QualityWarning[] = [];

  const level: DriftLevel = input.driftRisk;
  const audience = input.concept ? scoreUSAudience(input.concept) : null;
  const opening = input.openingFrame ? scoreOpeningFrame(input.openingFrame) : null;
  const publishGuard = input.packaging ? runFacebookPublishGuard(input.packaging) : null;
  const currentPerformance = getLanePerformance(
    input.durationLane,
    input.hookFamily,
    input.performance
  );
  const shortLanePerformance = getLanePerformance("short");
  const longLanePerformance = getLanePerformance("long");
  const spamPackagingWarnings =
    publishGuard?.warnings.filter((warning) =>
      /caption is too long|too many hashtags|duplicate hashtags/i.test(warning)
    ) ?? [];

  const recommended: QualityRecommended = {
    realismMode: "Reference Locked",
    motionOnlyI2V: true,
    referenceLock: true,
    singleActionRule: true,
    microMotion: true,
    heroVeo: false,
    durationLane: "short",
  };

  if (level === "HIGH") {
    why.push("High drift → lock identity, simplify motion, and protect opening readability");
    recommended.realismMode = "Reference Locked";
    recommended.motionOnlyI2V = true;
    recommended.referenceLock = true;
    recommended.singleActionRule = true;
    recommended.microMotion = true;

    warnings.push({
      id: "high-drift",
      severity: "danger",
      title: "HIGH Drift detected",
      detail: "Use Reference Lock + Motion-only I2V + Single Action Rule to keep identity stable, spacing clear, and the opening readable.",
    });

    if (!input.referenceLock) {
      warnings.push({
        id: "ref-lock-off",
        severity: "danger",
        title: "Reference Lock is OFF",
        detail: "Turn it ON to prevent subject morphing, silhouette drift, and weak first-frame clarity across shots.",
      });
    }

    if (!input.motionOnlyI2V) {
      warnings.push({
        id: "motion-only-off",
        severity: "warning",
        title: "Motion-only I2V is OFF",
        detail: "Turn it ON so the model does not re-describe appearance every shot and weaken motion clarity.",
      });
    }
  }

  if (level === "MEDIUM") {
    why.push("Medium drift → keep reference lock on, preserve clear openings, and keep micro-motion controlled");
    recommended.referenceLock = true;
    recommended.microMotion = true;

    if (!input.referenceLock) {
      warnings.push({
        id: "ref-lock-reco",
        severity: "warning",
        title: "Reference Lock recommended",
        detail: "Medium drift: turning it ON improves consistency, spacing stability, and subject readability.",
      });
    }
  }

  if (level === "LOW") {
    why.push("Low drift → you can relax settings for speed, but clear openings and lock are still safer.");
  }

  if (audience) {
    if (audience.total < 70) {
      warnings.push({
        id: "us-concept-warning",
        severity: audience.total < 55 ? "danger" : "warning",
        title: "Weak U.S. concept fit",
        detail: `${audience.summary} For U.S. testing, favor more iconic North American wildlife, setting, or cleaner conflict stakes.`,
      });
    } else {
      why.push(`U.S. concept ${audience.total}/100 → strong enough for U.S.-focused testing.`);
    }
  }

  if (opening) {
    if (opening.total < 60) {
      warnings.push({
        id: "weak-opening-frame",
        severity: opening.total < 40 ? "danger" : "warning",
        title: "Weak opening-frame risk",
        detail: `${opening.summary} Keep both subjects readable immediately and make the first second carry visible pressure before publishing.`,
      });
    } else {
      why.push(`Opening frame ${opening.total}/100 → readable enough to test if packaging stays clean.`);
    }
  }

  if (currentPerformance) {
    why.push(currentPerformance.summary);

    if (
      input.durationLane === "long" &&
      (currentPerformance.averageWatchTimeSeconds < 45 ||
        currentPerformance.completionRate < 0.62)
    ) {
      warnings.push({
        id: "long-lane-performance-warning",
        severity: "warning",
        title: "Long lane benchmark is soft",
        detail:
          "Current performance memory does not support a longer hold yet. Stay in the short lane until retention and completion improve.",
      });
    }
  }

  if (spamPackagingWarnings.length > 0) {
    warnings.push({
      id: "spam-packaging",
      severity: "warning",
      title: "Spam packaging risk",
      detail: `Current caption / hashtag packaging is too heavy for the default publish-safe mode. ${spamPackagingWarnings.join(" ")}`,
    });
  }

  if (publishGuard && !publishGuard.isPass && spamPackagingWarnings.length !== publishGuard.warnings.length) {
    warnings.push({
      id: "publish-safe-check",
      severity: "warning",
      title: "Publish-safe check failed",
      detail: publishGuard.warnings.join(" "),
    });
  }

  if (warnings.length === 0 && level !== "HIGH") {
    if (!isRunway45(input.runwayModel)) {
      warnings.push({
        id: "runway-not-45",
        severity: "info",
        title: "Runway model tip",
        detail: "Gen-4.5 usually gives the strongest realism, first-frame readability, and prompt adherence for wildlife hero shots.",
      });
    }

    if (!isKlingPro(input.klingModel)) {
      warnings.push({
        id: "kling-not-pro",
        severity: "info",
        title: "Kling model tip",
        detail: "Kling Pro is usually better for physics, character interaction, and readable multi-shot stability.",
      });
    }
  }

  const criticalDiverged =
    input.motionOnlyI2V !== recommended.motionOnlyI2V ||
    input.referenceLock !== recommended.referenceLock ||
    input.singleActionRule !== recommended.singleActionRule;

  if ((level === "MEDIUM" || level === "HIGH") && criticalDiverged) {
    warnings.push({
      id: "apply-reco",
      severity: "info",
      title: "Apply Recommended available",
      detail: "Your current settings differ from the safer baseline. Click Apply Recommended to restore stronger clarity and stability.",
    });
  }

  const publishSafe =
    publishGuard?.isPass ??
    (level !== "HIGH" &&
      input.motionOnlyI2V &&
      input.referenceLock &&
      input.singleActionRule);

  const longLanePerformanceReady =
    !!longLanePerformance &&
    longLanePerformance.averageWatchTimeSeconds >= 45 &&
    longLanePerformance.completionRate >= 0.62;
  const shortLanePerformanceReady =
    !!shortLanePerformance &&
    shortLanePerformance.averageWatchTimeSeconds >= 18 &&
    shortLanePerformance.completionRate >= 0.7;
  const currentLanePerformanceReady = currentPerformance
    ? input.durationLane === "long"
      ? currentPerformance.averageWatchTimeSeconds >= 45 &&
        currentPerformance.completionRate >= 0.62
      : currentPerformance.averageWatchTimeSeconds >= 18 &&
        currentPerformance.completionRate >= 0.7
    : true;

  const canUseLongLane =
    level !== "HIGH" &&
    publishSafe &&
    input.motionOnlyI2V &&
    input.referenceLock &&
    input.singleActionRule &&
    (audience?.total ?? 0) >= 70 &&
    (opening?.total ?? 0) >= 80 &&
    longLanePerformanceReady;

  const suggestedLane: RecommendationLane =
    canUseLongLane || (!shortLanePerformanceReady && longLanePerformanceReady)
      ? "long"
      : "short";
  recommended.durationLane = suggestedLane;

  if (suggestedLane === "long") {
    why.push("Long lane recommended → concept, opening frame, and packaging are strong enough for more hold, more build, and more payoff.");
  } else {
    why.push("Short lane recommended → safer default until the concept, opening frame, and packaging prove publish-worthy.");
  }

  if (input.durationLane !== suggestedLane) {
    warnings.push({
      id: "duration-lane-shift",
      severity: "info",
      title: "Duration lane can be updated",
      detail: `Apply Recommended can switch the workflow from ${input.durationLane} to ${suggestedLane}.`,
    });
  }

  const publishWorthy =
    publishSafe &&
    level !== "HIGH" &&
    currentLanePerformanceReady &&
    (!audience || audience.total >= 70) &&
    (!opening || opening.total >= 60);

  const publishSafeRecommendation = !publishSafe
    ? "Not publish-safe yet. Tighten caption / hashtags, confirm originality, and keep the packaging cleaner before publishing."
    : opening && opening.total < 60
      ? "Packaging is publish-safe, but the opening frame is weak. Fix the first second and test the short lane first."
    : audience && audience.total < 70
      ? "Packaging is publish-safe, but the concept is weak for U.S. testing. Keep it in the short lane or move to a more U.S.-readable concept."
    : !currentLanePerformanceReady
      ? "Packaging is clean, but current performance memory is weak for this lane. Shift to the recommended lane before publishing."
    : suggestedLane === "long"
      ? "Publish-safe and strong enough to test the long lane with the current performance benchmark."
      : "Publish-safe baseline is in place. Start with the short lane and scale up only after the opening frame and performance memory prove strong.";

  return {
    level,
    warnings,
    why,
    recommended,
    suggestedLane,
    publishSafeRecommendation,
    publishWorthy,
  };
}
