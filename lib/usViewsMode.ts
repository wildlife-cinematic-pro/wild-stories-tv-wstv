import type {
  ContentLane,
  DurationLane,
  HookFamily,
  OpeningFrameScore,
  PerformanceSnapshot,
  PublishGuardReport,
  USAudienceScoreResult,
  USViewsModeReport,
} from "@/types";
import { getPreferredHookFamilyForContentLane } from "@/lib/content-lanes";
import { runFacebookPublishGuard } from "@/lib/facebookPublishGuard";
import { scoreOpeningFrame, type OpeningFrameInput } from "@/lib/openingFrameScore";
import {
  getBestHookFamilyForDurationLane,
  getPerformanceSnapshot,
} from "@/lib/performanceMemory";
import { scoreUSAudience, type USAudienceScoreInput } from "@/lib/usAudienceProfile";

export interface USViewsModeInput {
  durationLane: DurationLane;
  hookFamily?: HookFamily;
  contentLane?: ContentLane;
  concept: USAudienceScoreInput;
  openingFrame: OpeningFrameInput;
  caption: string;
  hashtags: string[];
  originalityConfirmed: boolean;
  hookText?: string;
  ctaText?: string;
  audienceScore?: USAudienceScoreResult;
  openingFrameScore?: OpeningFrameScore;
  publishGuardReport?: PublishGuardReport;
  performanceSnapshot?: PerformanceSnapshot | null;
}

export function buildUSViewsModeReport(input: USViewsModeInput): USViewsModeReport {
  const audience =
    input.audienceScore ??
    scoreUSAudience({
      ...input.concept,
      contentLane: input.contentLane ?? input.concept.contentLane,
    });
  const opening = input.openingFrameScore ?? scoreOpeningFrame(input.openingFrame);
  const publish =
    input.publishGuardReport ??
    runFacebookPublishGuard({
      caption: input.caption,
      hashtags: input.hashtags,
      originalityConfirmed: input.originalityConfirmed,
      hookText: input.hookText,
      ctaText: input.ctaText,
      predator: input.concept.predator,
      prey: input.concept.prey,
    });
  const hookFamily =
    input.hookFamily ??
    getPreferredHookFamilyForContentLane(input.contentLane ?? "Auto") ??
    getBestHookFamilyForDurationLane(input.durationLane) ??
    "danger";
  const performanceSnapshot =
    input.performanceSnapshot ?? getPerformanceSnapshot(input.durationLane, hookFamily);
  const performanceReady = performanceSnapshot
    ? input.durationLane === "long"
      ? performanceSnapshot.averageWatchTimeSeconds >= 45 &&
        performanceSnapshot.completionRate >= 0.62
      : performanceSnapshot.averageWatchTimeSeconds >= 18 &&
        performanceSnapshot.completionRate >= 0.7
    : true;
  const shouldPublish =
    audience.total >= 70 &&
    opening.total >= 60 &&
    publish.isPass &&
    performanceReady;
  const nextActions = [
    audience.total < 70
      ? "Strengthen the U.S. concept with more iconic wildlife, setting, or cleaner conflict stakes."
      : "",
    opening.total < 60
      ? "Rebuild the opening frame so both subjects and the threat read immediately."
      : "",
    !publish.isPass
      ? publish.fixes?.[0] ??
        "Tighten the caption, use exactly 5 clean hashtags, and confirm originality before publishing."
      : "",
    !performanceReady
      ? "Current performance memory does not support this publish setup yet. Use the safer lane or stronger hook family."
      : "",
    performanceSnapshot && input.durationLane === "long" && performanceSnapshot.completionRate < 0.62
      ? "The long lane benchmark is soft. Use the short lane until retention improves."
      : "",
  ].filter(Boolean);

  const summaryBits = [
    audience.summary,
    opening.summary,
    publish.summary ?? (publish.isPass ? "Packaging is publish-safe." : "Packaging needs cleanup."),
    performanceSnapshot?.summary ?? "",
  ].filter(Boolean);

  return {
    durationLane: input.durationLane,
    hookFamily,
    audienceScore: audience,
    openingFrameScore: opening,
    publishGuard: publish,
    performanceSnapshot: performanceSnapshot ?? undefined,
    shouldPublish,
    summary: summaryBits.join(" "),
    nextActions,
  };
}
