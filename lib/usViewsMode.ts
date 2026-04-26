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
import { getDurationLanePerformanceTargets } from "@/lib/duration-lanes";
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
  const performanceTargets = getDurationLanePerformanceTargets(input.durationLane);
  const performanceReady = performanceSnapshot
    ? performanceSnapshot.averageWatchTimeSeconds >=
        performanceTargets.averageWatchTimeSeconds &&
      performanceSnapshot.completionRate >= performanceTargets.completionRate
    : true;
  const shouldPublish =
    audience.total >= 70 &&
    opening.total >= 60 &&
    publish.isPass &&
    performanceReady;
  const nextActions = [
    audience.total < 70
      ? "Use a more iconic U.S. animal pair, cleaner habitat cue, or stronger Content Lane fit before publishing."
      : "",
    opening.total < 60
      ? "Rework frame 1 so the species, spacing, and first point of tension are obvious without explanation."
      : "",
    !publish.isPass
      ? publish.fixes?.[0] ??
        "Tighten the hook and caption pack until it reads clean, documentary, and discussion-safe."
      : "",
    !performanceReady
      ? "Performance memory is soft for this setup. Start with the safer lane or a cleaner first-frame hook before scaling."
      : "",
    performanceSnapshot &&
    input.durationLane !== "short" &&
    performanceSnapshot.completionRate < performanceTargets.completionRate
      ? `${input.durationLane === "long" ? "Long" : "Medium"}-lane retention is still soft. Use the short lane until the opener and caption pack carry better.`
      : "",
  ].filter(Boolean);

  const summaryBits = [
    audience.summary,
    opening.summary,
    publish.summary ?? (publish.isPass ? "Packaging stays Facebook-safe." : "Packaging needs Facebook-safe cleanup."),
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
