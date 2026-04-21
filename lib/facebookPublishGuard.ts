import type { PublishGuardReport } from "@/types";
import {
  evaluateHookCopyQuality,
  hasBaitLikeCopy,
  hasForcedEngagementCopy,
} from "@/lib/platform-packs";

export interface PublishGuardInput {
  caption: string;
  hashtags: string[];
  originalityConfirmed: boolean;
  hookText?: string;
  ctaText?: string;
  predator?: string;
  prey?: string;
}

const REQUIRED_HASHTAGS = 5;
const MAX_CAPTION_LENGTH = 180;

export function runFacebookPublishGuard(input: PublishGuardInput): PublishGuardReport {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!input.originalityConfirmed) {
    const warning = "Originality not confirmed. Facebook-safe publishing starts with original commentary and packaging.";
    blockers.push(warning);
    warnings.push(warning);
  }

  if (input.caption.length > MAX_CAPTION_LENGTH) {
    warnings.push("Caption is too long for the default Facebook-safe mode.");
  }

  if (hasBaitLikeCopy(input.caption)) {
    warnings.push(
      "Caption leans on hype or bait phrasing. Keep it observational and documentary instead."
    );
  }

  const hookQuality = input.hookText
    ? evaluateHookCopyQuality(
        input.hookText,
        input.predator ?? "",
        input.prey ?? ""
      )
    : null;
  if (hookQuality?.hasBait) {
    warnings.push(
      "Hook reads like clickbait. Rewrite it as a species-clear observation with readable pressure."
    );
  } else if (hookQuality && hookQuality.score < 65) {
    warnings.push(
      "Hook is too generic. Name the species or describe the timing, spacing, posture, or pressure more clearly."
    );
  }

  if (input.ctaText && hasForcedEngagementCopy(input.ctaText)) {
    warnings.push(
      "CTA pushes engagement too directly. Use a discussion-safe behavior question instead."
    );
  }

  if (input.hashtags.length !== REQUIRED_HASHTAGS) {
    warnings.push("Hashtag count should stay at exactly 5 for the default Facebook-safe mode.");
  }

  const unique = new Set(input.hashtags.map((tag) => tag.toLowerCase()));
  if (unique.size !== input.hashtags.length) {
    warnings.push("Duplicate hashtags detected.");
  }

  const isPass = blockers.length === 0 && warnings.length === 0;
  const fixes = [
    !input.originalityConfirmed
      ? "Confirm originality before publishing."
      : "",
    hasBaitLikeCopy(input.caption)
      ? "Rewrite the caption lead with documentary language and readable behavior detail."
      : "",
    hookQuality?.hasBait
      ? "Rewrite the hook with species-clear, observational language instead of clickbait."
      : "",
    hookQuality && !hookQuality.hasBait && hookQuality.score < 65
      ? "Tighten the hook around visible posture, timing, spacing, or pressure."
      : "",
    input.ctaText && hasForcedEngagementCopy(input.ctaText)
      ? "Use a behavior-led CTA instead of asking for likes, tags, or winner votes."
      : "",
    input.caption.length > MAX_CAPTION_LENGTH
      ? "Trim the publish caption for faster Facebook-safe readability."
      : "",
    input.hashtags.length !== REQUIRED_HASHTAGS ? "Use exactly 5 clean hashtags." : "",
    unique.size !== input.hashtags.length ? "Remove duplicate hashtags." : "",
  ].filter(Boolean);

  return {
    isPass,
    pass: isPass,
    warnings,
    blockers,
    fixes,
    summary: isPass
      ? "Packaging is within the default Facebook-safe publish guard."
      : "Packaging needs cleanup before a Facebook-safe publish.",
  };
}
