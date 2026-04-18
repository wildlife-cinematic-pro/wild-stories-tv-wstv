import type { PublishGuardReport } from "@/types";

export interface PublishGuardInput {
  caption: string;
  hashtags: string[];
  originalityConfirmed: boolean;
}

const REQUIRED_HASHTAGS = 5;
const MAX_CAPTION_LENGTH = 180;

export function runFacebookPublishGuard(input: PublishGuardInput): PublishGuardReport {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!input.originalityConfirmed) {
    const warning = "Originality not confirmed. Facebook is currently prioritizing original content.";
    blockers.push(warning);
    warnings.push(warning);
  }

  if (input.caption.length > MAX_CAPTION_LENGTH) {
    warnings.push('Caption is too long for the default Facebook-safe mode.');
  }

  if (input.hashtags.length !== REQUIRED_HASHTAGS) {
    warnings.push("Hashtag count should stay at exactly 5 for the default Facebook-safe mode.");
  }

  const unique = new Set(input.hashtags.map((tag) => tag.toLowerCase()));
  if (unique.size !== input.hashtags.length) {
    warnings.push('Duplicate hashtags detected.');
  }

  const isPass = blockers.length === 0 && warnings.length === 0;
  const fixes = [
    !input.originalityConfirmed ? "Confirm originality before publishing." : "",
    input.caption.length > MAX_CAPTION_LENGTH ? "Trim the publish caption for faster Facebook-safe readability." : "",
    input.hashtags.length !== REQUIRED_HASHTAGS ? "Use exactly 5 clean hashtags." : "",
    new Set(input.hashtags.map((tag) => tag.toLowerCase())).size !== input.hashtags.length
      ? "Remove duplicate hashtags."
      : "",
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
