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
    const warning = "Originality not confirmed. Facebook-safe publishing starts with original commentary, not borrowed phrasing.";
    blockers.push(warning);
    warnings.push(warning);
  }

  if (input.caption.length > MAX_CAPTION_LENGTH) {
    warnings.push("Caption is running long for the default Facebook publish lane. Trim the first line before adding extra context.");
  }

  if (hasBaitLikeCopy(input.caption)) {
    warnings.push(
      "Caption leans on hype or bait phrasing. Reframe it as a species-clear behavior note instead."
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
      "Hook reads like clickbait. Lead with species, timing, or behavior instead of hype."
    );
  } else if (hookQuality && hookQuality.score < 65) {
    warnings.push(
      "Hook is too generic. Name the species or make the behavior cue clearer with timing, spacing, posture, or waterline detail."
    );
  }

  if (input.ctaText && hasForcedEngagementCopy(input.ctaText)) {
    warnings.push(
      "CTA pushes engagement too directly. Ask about behavior, timing, or the turning point instead."
    );
  }

  if (input.hashtags.length !== REQUIRED_HASHTAGS) {
    warnings.push("Hashtag count should stay at exactly 5 clean tags in the default Facebook-safe mode.");
  }

  const unique = new Set(input.hashtags.map((tag) => tag.toLowerCase()));
  if (unique.size !== input.hashtags.length) {
    warnings.push("Duplicate hashtags weaken the pack. Keep all 5 distinct.");
  }

  const isPass = blockers.length === 0 && warnings.length === 0;
  const fixes = [
    !input.originalityConfirmed
      ? "Confirm originality before publishing."
      : "",
    hasBaitLikeCopy(input.caption)
      ? "Rewrite the caption lead with species, behavior, and a cleaner documentary tone."
      : "",
    hookQuality?.hasBait
      ? "Rewrite the hook with species, timing, or posture instead of clickbait."
      : "",
    hookQuality && !hookQuality.hasBait && hookQuality.score < 65
      ? "Tighten the hook around visible posture, timing, spacing, or waterline detail."
      : "",
    input.ctaText && hasForcedEngagementCopy(input.ctaText)
      ? "Use a behavior-led CTA instead of asking for likes, tags, or winner votes."
      : "",
    input.caption.length > MAX_CAPTION_LENGTH
      ? "Trim the caption so the first line reads quickly in the Facebook feed."
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
      ? "Packaging is clean, documentary, and within the default Facebook-safe publish guard."
      : "Packaging needs cleanup before a Facebook-safe publish test.",
  };
}
