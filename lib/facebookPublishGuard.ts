import type { PublishGuardReport } from "@/types";
import {
  evaluateHookCopyQuality,
  hasBaitLikeCopy,
  hasForcedEngagementCopy,
  normalizeCopy,
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
const STATIC_RISK_PATTERN =
  /\b(static(?:\s+image)?|still(?:\s+frame|\s+only)?|slideshow(?:-like)?|single image|no visible subject motion|no subject motion|no motion)\b/i;
const LOOP_RISK_PATTERN =
  /\b(seamless loop|looped clip|looped segment|repeated same segment|recycled loop|gif-like loop|gif loop)\b/i;
const TEXT_MONTAGE_RISK_PATTERN =
  /\b(text-heavy montage|too much overlaid text|multiple large text blocks|text covering animals|text covers the animals|overlay text covering animals)\b/i;
const ORIGINALITY_RISK_PATTERN =
  /\b(repost|compilation|borrowed clip|credit-only repost|watermark from another source|reused viral clip|downloaded wildlife footage|third-party watermark)\b/i;
const GRAPHIC_WILDLIFE_PATTERN =
  /\b(gore|bloody|ripped apart|torn open|kill shot|brutal death|bloodbath|massacre|guts|decapitated)\b/i;

function addFinding(
  warnings: string[],
  fixes: string[],
  warning: string,
  fix: string,
  blockers?: string[]
) {
  if (!warnings.includes(warning)) warnings.push(warning);
  if (!fixes.includes(fix)) fixes.push(fix);
  if (blockers && !blockers.includes(warning)) blockers.push(warning);
}

export function runFacebookPublishGuard(input: PublishGuardInput): PublishGuardReport {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const fixes: string[] = [];
  const compactCaption = normalizeCopy(input.caption);
  const compactHook = normalizeCopy(input.hookText ?? "");
  const compactCta = normalizeCopy(input.ctaText ?? "");
  const combinedPackagingText = [compactHook, compactCaption, compactCta]
    .filter(Boolean)
    .join(" ");

  if (!input.originalityConfirmed) {
    addFinding(
      warnings,
      fixes,
      "Originality is not confirmed yet. Facebook-safe publishing starts with original WSTV-generated assets and original packaging.",
      "Use original WSTV-generated image, original shot prompts, original edit, original caption, and no third-party watermark.",
      blockers
    );
  }

  if (ORIGINALITY_RISK_PATTERN.test(combinedPackagingText)) {
    addFinding(
      warnings,
      fixes,
      "Packaging implies reposted, compiled, or borrowed footage. That weakens originality confidence for Facebook monetization.",
      "Use original WSTV-generated image, original shot prompts, original edit, original caption, and no third-party watermark.",
      blockers
    );
  }

  if (compactCaption.length > MAX_CAPTION_LENGTH) {
    addFinding(
      warnings,
      fixes,
      "Caption is running long for the default Facebook publish lane. Trim the first line before adding extra context.",
      "Trim the caption so the first line reads quickly in the Facebook feed."
    );
  }

  if (hasBaitLikeCopy(compactCaption) || hasBaitLikeCopy(compactHook)) {
    addFinding(
      warnings,
      fixes,
      "Caption or hook leans on hype or bait phrasing. Reframe it as a species-clear behavior note instead.",
      "Use a natural wildlife question, not a command to like, share, follow, or comment."
    );
  }

  const hookQuality = compactHook
    ? evaluateHookCopyQuality(
        compactHook,
        input.predator ?? "",
        input.prey ?? ""
      )
    : null;

  if (hookQuality?.hasBait) {
    addFinding(
      warnings,
      fixes,
      "Hook reads like clickbait. Lead with species, timing, or behavior instead of hype.",
      "Use a natural wildlife question, not a command to like, share, follow, or comment."
    );
  } else if (hookQuality && hookQuality.score < 65) {
    addFinding(
      warnings,
      fixes,
      "Hook is too generic. Name the species or make the behavior cue clearer with timing, spacing, posture, or waterline detail.",
      "Tighten the hook around visible posture, timing, spacing, or waterline detail."
    );
  }

  if (
    hasForcedEngagementCopy(combinedPackagingText) ||
    /\b(like and share|comment if you agree|follow for part 2|share this now|comment yes)\b/i.test(combinedPackagingText)
  ) {
    addFinding(
      warnings,
      fixes,
      "Packaging uses engagement bait. Facebook-safe wildlife copy works better as a natural discussion prompt than a direct command.",
      "Use a natural wildlife question, not a command to like, share, follow, or comment."
    );
  }

  if (STATIC_RISK_PATTERN.test(combinedPackagingText)) {
    addFinding(
      warnings,
      fixes,
      "Packaging suggests a static still, slideshow, or no visible subject motion. That weakens Facebook reel readiness.",
      "Add visible wildlife motion: one clear animal action, one camera move, and natural environment response."
    );
  }

  if (LOOP_RISK_PATTERN.test(combinedPackagingText)) {
    addFinding(
      warnings,
      fixes,
      "Packaging suggests a looped or recycled clip structure. That reads too close to repeated-loop content.",
      "Use a beginning, escalation, and aftermath instead of repeating the same motion."
    );
  }

  if (TEXT_MONTAGE_RISK_PATTERN.test(combinedPackagingText)) {
    addFinding(
      warnings,
      fixes,
      "Packaging suggests text-heavy montage behavior or text covering the animals. That hurts wildlife readability.",
      "Keep hook text in the upper safe zone, use 1–2 short lines, and keep animals fully visible."
    );
  }

  if (GRAPHIC_WILDLIFE_PATTERN.test(combinedPackagingText)) {
    addFinding(
      warnings,
      fixes,
      "Packaging uses overly graphic wildlife wording. Keep tension readable without gore-heavy language.",
      "Use documentary-safe tension language instead of graphic wording."
    );
  }

  if (compactCta && hasForcedEngagementCopy(compactCta)) {
    addFinding(
      warnings,
      fixes,
      "CTA pushes engagement too directly. Ask about behavior, timing, or the turning point instead.",
      "Use a natural wildlife question, not a command to like, share, follow, or comment."
    );
  }

  if (input.hashtags.length !== REQUIRED_HASHTAGS) {
    addFinding(
      warnings,
      fixes,
      "Hashtag count should stay at exactly 5 clean tags in the default Facebook-safe mode.",
      "Use exactly 5 clean hashtags."
    );
  }

  const unique = new Set(input.hashtags.map((tag) => tag.toLowerCase()));
  if (unique.size !== input.hashtags.length) {
    addFinding(
      warnings,
      fixes,
      "Duplicate hashtags weaken the pack. Keep all 5 distinct.",
      "Remove duplicate hashtags."
    );
  }

  const isPass = blockers.length === 0 && warnings.length === 0;

  return {
    isPass,
    pass: isPass,
    warnings,
    blockers,
    fixes,
    summary: isPass
      ? "Packaging is clean, documentary, motion-led, and within the default Facebook-safe publish guard."
      : "Packaging needs cleanup before a Facebook-safe publish test.",
  };
}
