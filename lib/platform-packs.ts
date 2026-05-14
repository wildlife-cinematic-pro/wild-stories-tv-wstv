import type {
  Arc,
  ContentLane,
  FacebookPack,
  InstagramPack,
  PlatformPack,
  TikTokPack,
  YouTubeShortsPack,
} from "@/types";

import { isContentLaneCompatible } from "@/lib/content-lanes";
import {
  buildFacebookCoverFramePresets,
  buildFacebookFirstFrameOverlayPresets,
  buildObservationalCTA,
  rankFacebookCoverFramePresets,
  recommendFacebookOverlayPreset,
  validateCaptionCTA,
} from "@/lib/platform-packs/facebook";
import { build2026Hook } from "@/lib/platform-packs/hooks";
import {
  buildFirstFrameOverlayGuidance,
  buildHookFormattingPresets,
} from "@/lib/platform-packs/overlays";
import {
  buildFacebookPageOptimizationCopy,
  buildHashtags,
  buildLongCaption,
  buildOriginalityPublishChecklist,
  buildCommunityPackage,
  buildShortCaption,
  buildSEOTitle,
  buildTags,
} from "@/lib/platform-packs/publishing";
import { normalizeCopy, sanitizeSocialEnv } from "@/lib/platform-packs/shared";

export {
  HOOK_FAMILY_ORDER,
  HOOK_OVERLAY_MAX_LINE_LENGTH,
  HOOK_OVERLAY_MAX_LINES,
  FACEBOOK_COVER_FRAME_MAX_LINE_LENGTH,
  FACEBOOK_COVER_FRAME_MAX_LINES,
  OBSERVATIONAL_SIGNAL_PATTERN,
  evaluateHookCopyQuality,
  finalizeHookCopy,
  hasBaitLikeCopy,
  hasForcedEngagementCopy,
  normalizeCopy,
  sanitizeSocialEnv,
  splitSentences,
  toHashtag,
  toTag,
  trimAtWordBoundary,
  type CaptionMode,
  type CaptionOptions,
  type HashtagOptions,
  type HookBuildOptions,
  type HookFamilySupport,
} from "@/lib/platform-packs/shared";
export {
  build2026Hook,
  build2026HookByFamily,
  buildCTA,
  buildHook,
  getRecommendedHookIndex,
} from "@/lib/platform-packs/hooks";
export {
  buildFirstFrameOverlayGuidance,
  buildHookFormattingPresets,
} from "@/lib/platform-packs/overlays";
export {
  buildFacebookCoverFramePresets,
  buildFacebookFirstFrameOverlayPresets,
  buildObservationalCTA,
  rankFacebookCoverFramePresets,
  recommendFacebookOverlayPreset,
  validateCaptionCTA,
} from "@/lib/platform-packs/facebook";
export {
  build2026Caption,
  buildAltTextPrompt,
  buildCaption,
  buildCommunityPackage,
  buildFacebookPageOptimizationCopy,
  buildHashtags,
  buildLongCaption,
  buildOriginalityPublishChecklist,
  buildPinnedComment,
  buildSEOTitle,
  buildShortCaption,
  buildTags,
} from "@/lib/platform-packs/publishing";

export function buildPlatformPack(
  predator: string,
  prey: string,
  arc: Arc,
  env: string,
  contentLane: ContentLane = "Auto",
  preferredHook = ""
): PlatformPack {
  const cleanEnv = sanitizeSocialEnv(env);
  const effectiveContentLane =
    contentLane === "Auto" || isContentLaneCompatible(contentLane, predator, prey, arc)
      ? contentLane
      : "Auto";
  const generatedHooks = build2026Hook(predator, prey, arc, {
    contentLane: effectiveContentLane,
  });
  const normalizedPreferredHook = normalizeCopy(preferredHook);
  const hooks = normalizedPreferredHook
    ? [
        normalizedPreferredHook,
        ...generatedHooks.filter((hook) => hook !== normalizedPreferredHook),
      ]
    : generatedHooks;
  const shortCaption = buildShortCaption(predator, prey, cleanEnv, arc, {
    mode: "us-only",
    contentLane: effectiveContentLane,
  });
  const longCaptionDraft = buildLongCaption(predator, prey, cleanEnv, arc, {
    mode: "us-only",
    contentLane: effectiveContentLane,
  });
  const fallbackCaptionCta = buildObservationalCTA(`${predator} vs ${prey}`, arc);
  const longCaption = validateCaptionCTA(longCaptionDraft)
    ? longCaptionDraft
    : `${longCaptionDraft
        .replace(/[\r\n]{2,}[^\r\n?]+\?\s*$/, "")
        .trim()}\n\n${fallbackCaptionCta}`.trim();
  const hashtags = buildHashtags(predator, prey, arc, {
    count: 5,
    contentLane: effectiveContentLane,
  });
  const tags = buildTags(predator, prey, arc);
  const communityPackage = buildCommunityPackage(arc);
  const pinnedComment = communityPackage.pinnedComment;
  const overlayGuidance = buildFirstFrameOverlayGuidance();
  const facebookOverlayPresets = buildFacebookFirstFrameOverlayPresets(
    hooks[0],
    predator,
    prey
  );
  const facebookCoverFramePresets = buildFacebookCoverFramePresets(
    hooks[0],
    predator,
    prey,
    arc
  );

  const facebook: FacebookPack = {
    hook: hooks[0],
    caption: longCaption,
    pinnedComment,
    hashtags,
    tags,
    bestTime:
      "Start with weekday morning or midday, then keep the winner from your own Facebook Insights.",
    cmpNote:
      "Keep the packaging original, keep the overlay in the upper safe zone and clear of the animals, and make sure the reel reads with or without sound.",
    communityPackage,
    originalityChecklist: buildOriginalityPublishChecklist(),
    pageOptimization: buildFacebookPageOptimizationCopy(),
    publishReminders: [buildOriginalityPublishChecklist().aiGeneratedLabelReminder],
    strategyNote:
      "Lead with the clearest species read or the clearest danger beat, then keep the overlay compact and off the main silhouette.",
    overlayGuidance,
    hookFormattingPresets: buildHookFormattingPresets(hooks[0], predator, prey),
    facebookOverlayPresets,
    facebookCoverFramePresets,
    facebookOverlayRecommendation: recommendFacebookOverlayPreset(
      facebookOverlayPresets,
      hooks[0],
      predator,
      prey,
      effectiveContentLane
    ),
    facebookCoverFrameRanking: rankFacebookCoverFramePresets(
      facebookCoverFramePresets,
      predator,
      prey,
      hooks[0],
      effectiveContentLane
    ),
  };

  const instagram: InstagramPack = {
    hook: hooks[1],
    caption: shortCaption,
    hashtags,
    bestTime:
      "Start by testing afternoon and evening windows, then refine from account Insights while keeping the opening motion clear instantly.",
    strategyNote:
      "Keep the first line species-clear, use upper safe-zone text, and let the opening frame show clear tension immediately.",
  };

  const tiktok: TikTokPack = {
    hook: hooks[2],
    caption: shortCaption,
    hashtags,
    bestTime:
      "Start by testing late afternoon to evening and refine from retention signals while keeping the tension visible immediately.",
    strategyNote:
      "Use clear opening motion, support both sound-on and sound-off viewing, and avoid dead-static setup before the tension is visible.",
  };

  const youtube_shorts: YouTubeShortsPack = {
    title: buildSEOTitle(predator, prey, arc),
    description: longCaption,
    tags,
    bestTime:
      "Keep a consistent cadence and judge performance with your own retention and return-viewer signals.",
    strategyNote:
      "Write a searchable title and keep the opening seconds documentary, clear, and visibly original before the sequence escalates.",
  };

  return { facebook, instagram, tiktok, youtube_shorts };
}
