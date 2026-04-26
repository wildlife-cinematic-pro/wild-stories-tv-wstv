import type {
  FacebookCoverFramePresetScore,
  FacebookFrameHeuristics,
  FacebookOverlayPresetScore,
  GeneratedPackage,
  RealGenerationEvidenceRecord,
} from "@/types";

import {
  evaluateHookCopyQuality,
  hasBaitLikeCopy,
  hasForcedEngagementCopy,
  validateCaptionCTA,
} from "@/lib/platform-packs";

export type FacebookPublishReadinessVerdict =
  | "ready-to-publish"
  | "review-packaging-before-publish"
  | "retry-content-before-publish";

export type FacebookPublishReadinessScores = {
  originalityConfidence: number;
  firstFrameHookReadability: number;
  hookOverlayClarity: number;
  captionUsefulness: number;
  hashtagHygiene: number;
  packagingQuality: number;
  shareIntentScore: number;
  commentDepthIntentScore: number;
  monetisationSafetyScore: number;
  ownedFunnelConversionIntentScore: number;
};

export type FacebookPublishReadinessReport = {
  overallScore: number;
  verdict: FacebookPublishReadinessVerdict;
  verdictLabel: string;
  summary: string;
  scores: FacebookPublishReadinessScores;
  publishGuardPass: boolean | null;
  publishGuardWarnings: string[];
  reasons: string[];
  reminders: string[];
  evidenceContext?: {
    overallScore: number;
    recommendationLabel: string;
    note: string;
  };
};

const VERDICT_LABELS: Record<FacebookPublishReadinessVerdict, string> = {
  "ready-to-publish": "Ready to publish",
  "review-packaging-before-publish": "Review packaging before publish",
  "retry-content-before-publish": "Retry content before publish",
};

const OBSERVATIONAL_PATTERN =
  /\b(pressure|spacing|timing|posture|waterline|territory|survival|breakaway|claim|standoff|surface|escape|window|footing|angle|clash|warning-step)\b/i;

const SHARE_BEAT_PATTERN =
  /\b(closes|committed|presses|surges|holds ground|breaks away|locks eyes|closes distance|tests the defense|commits forward|retreats|pivots|stands firm|warning|turn|shift|control|footing|claim|escape|pressure)\b/i;
const ATMOSPHERE_ONLY_PATTERN =
  /\b(atmosphere-only|atmospheric|golden(?:-| )hour|misty|dreamy|moody|cinematic lighting|beautiful light)\b/i;
const COMMENT_PROMPT_PATTERN =
  /\b(what did you notice first|was this patience or panic|which animal actually controlled the scene|what changed the outcome first|was the key mistake physical or mental|which second|which turn|what told you|which body shift|would you have noticed|which angle|which animal gave up position first|would you have spotted)\b/i;
const CONVERSION_SIGNAL_PATTERN =
  /\b(wild stories tv|original content|page|series|part 1|part 2|follow the page|affiliate|product path|gear list|shop)\b/i;
const GRAPHIC_PACKAGING_PATTERN =
  /\b(gore|bloody|ripped apart|torn open|kill shot|brutal death|bloodbath|massacre|guts|decapitated)\b/i;

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function clampTenPointScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(10, Math.round(value)));
}

function normalizeCopy(value: unknown): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitHashtags(value: string): string[] {
  return normalizeCopy(value)
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function toEvidenceScore(value: number | undefined): number | null {
  if (!Number.isFinite(value)) return null;
  const safe = Math.max(1, Math.min(5, Math.round(Number(value))));
  return clampScore(((safe - 1) / 4) * 100);
}

function average(
  scores: Array<number | null | undefined>,
  fallback: number
): number {
  const usable = scores.filter((value): value is number =>
    Number.isFinite(value ?? NaN)
  );
  if (usable.length === 0) return fallback;
  return clampScore(
    usable.reduce((sum, value) => sum + value, 0) / usable.length
  );
}

function scoreFrameHeuristics(heuristics?: FacebookFrameHeuristics): number {
  if (!heuristics) return 0;

  let score = 0;

  score +=
    heuristics.speciesReadability === "high"
      ? 8
      : heuristics.speciesReadability === "medium"
        ? 3
        : -10;

  score +=
    heuristics.textAnimalCollisionRisk === "low"
      ? 7
      : heuristics.textAnimalCollisionRisk === "medium"
        ? -2
        : -14;

  score +=
    heuristics.silhouetteConflictRisk === "low"
      ? 4
      : heuristics.silhouetteConflictRisk === "medium"
        ? -2
        : -8;

  score +=
    heuristics.leftRightSubjectFit === "strong"
      ? 7
      : heuristics.leftRightSubjectFit === "balanced"
        ? 3
        : -8;

  score += heuristics.frame1Choice === "species-first" ? 4 : 2;

  return score;
}

function formatEvidenceRecommendation(value: string): string {
  return value === "keep"
    ? "Keep"
    : value === "retry-with-fixes"
      ? "Retry with fixes"
      : "Retry";
}

function readPublishGuardPass(pkg: GeneratedPackage): boolean | null {
  if (typeof pkg.publishGuardReport?.isPass === "boolean") {
    return pkg.publishGuardReport.isPass;
  }
  if (typeof pkg.publishGuardReport?.pass === "boolean") {
    return pkg.publishGuardReport.pass;
  }
  if (typeof pkg.usViewsModeReport?.publishGuard?.isPass === "boolean") {
    return pkg.usViewsModeReport.publishGuard.isPass;
  }
  return null;
}

function readPublishGuardWarnings(pkg: GeneratedPackage): string[] {
  const source = Array.isArray(pkg.publishGuardReport?.warnings)
    ? pkg.publishGuardReport.warnings
    : Array.isArray(pkg.usViewsModeReport?.publishGuard?.warnings)
      ? pkg.usViewsModeReport.publishGuard.warnings
      : [];

  return source.map((warning) => normalizeCopy(warning)).filter(Boolean);
}

function scoreOriginalityConfidence(
  pkg: GeneratedPackage,
  publishGuardPass: boolean | null,
  evidence: RealGenerationEvidenceRecord | undefined
): number {
  const predator = normalizeCopy(pkg.predatorName);
  const prey = normalizeCopy(pkg.preyName);
  const hook = normalizeCopy(pkg.platformPack?.facebook.hook ?? pkg.hook);
  const caption = normalizeCopy(pkg.platformPack?.facebook.caption ?? pkg.caption);
  const cta = normalizeCopy(pkg.cta);
  const hookQuality = evaluateHookCopyQuality(hook, predator, prey);
  const noisyCopy =
    hasBaitLikeCopy(hook) ||
    hasBaitLikeCopy(caption) ||
    hasForcedEngagementCopy(caption) ||
    hasForcedEngagementCopy(cta);

  let score = 52;

  score += publishGuardPass === true ? 12 : publishGuardPass === false ? -12 : 0;
  score += hookQuality.hasSpeciesClarity ? 12 : 0;
  score += hookQuality.hasObservationalTone ? 10 : 0;
  score += noisyCopy ? -20 : 12;
  score += caption.length >= 40 && caption.length <= 220 ? 6 : 0;

  if (evidence?.userRecommendation === "keep") score += 8;
  if (evidence?.userRecommendation === "retry-with-fixes") score -= 4;
  if (evidence?.userRecommendation === "retry") score -= 18;

  return clampScore(score);
}

function scoreFirstFrameHookReadability(
  pkg: GeneratedPackage,
  overlayRecommendation: FacebookOverlayPresetScore | undefined,
  evidence: RealGenerationEvidenceRecord | undefined
): number {
  const openingBase =
    typeof pkg.openingFrameScore?.total === "number"
      ? pkg.openingFrameScore.total
      : evaluateHookCopyQuality(
          normalizeCopy(pkg.platformPack?.facebook.hook ?? pkg.hook),
          normalizeCopy(pkg.predatorName),
          normalizeCopy(pkg.preyName)
        ).score;

  let score = openingBase;

  if (overlayRecommendation) {
    score = score * 0.72 + overlayRecommendation.score * 0.28;
  }

  const evidenceScore = toEvidenceScore(evidence?.scores.firstFrameReadability);
  if (evidenceScore !== null) {
    score = score * 0.7 + evidenceScore * 0.3;
  }

  return clampScore(score);
}

function scoreHookOverlayClarity(
  pkg: GeneratedPackage,
  overlayRecommendation: FacebookOverlayPresetScore | undefined
): number {
  const predator = normalizeCopy(pkg.predatorName).toLowerCase();
  const prey = normalizeCopy(pkg.preyName).toLowerCase();
  const text = normalizeCopy(
    overlayRecommendation?.text ?? pkg.platformPack?.facebook.hook ?? pkg.hook
  );
  const lines = text
    .split(/\n+/)
    .map((line) => normalizeCopy(line))
    .filter(Boolean);
  const maxLineLength = lines.reduce((max, line) => Math.max(max, line.length), 0);
  const includesSpecies = [predator, prey]
    .filter(Boolean)
    .some((term) => text.toLowerCase().includes(term));

  let score = overlayRecommendation?.score ?? 60;
  score += lines.length <= 2 ? 8 : -12;
  score += maxLineLength <= 28 ? 8 : maxLineLength <= 34 ? 2 : -10;
  score += includesSpecies ? 6 : 0;
  score += scoreFrameHeuristics(overlayRecommendation?.frameHeuristics);

  return clampScore(score);
}

function scoreCaptionUsefulness(pkg: GeneratedPackage): number {
  const predator = normalizeCopy(pkg.predatorName).toLowerCase();
  const prey = normalizeCopy(pkg.preyName).toLowerCase();
  const caption = normalizeCopy(pkg.platformPack?.facebook.caption ?? pkg.caption);
  const lower = caption.toLowerCase();
  const noisy = hasBaitLikeCopy(caption) || hasForcedEngagementCopy(caption);

  let score = 45;

  if (caption.length >= 40 && caption.length <= 220) {
    score += 20;
  } else if (caption.length >= 20 && caption.length <= 280) {
    score += 10;
  } else {
    score -= 8;
  }

  score += noisy ? -20 : 15;
  score += [predator, prey]
    .filter(Boolean)
    .some((term) => lower.includes(term))
    ? 8
    : 0;
  score += OBSERVATIONAL_PATTERN.test(caption) ? 10 : 0;
  score += /[?.!]/.test(caption) ? 4 : 0;

  return clampScore(score);
}

/**
 * Scores how strongly the package encourages organic shares through a clear action beat.
 */
function scoreShareIntent(pkg: GeneratedPackage): number {
  const hook = normalizeCopy(pkg.platformPack?.facebook.hook ?? pkg.hook);
  const caption = normalizeCopy(pkg.platformPack?.facebook.caption ?? pkg.caption);
  const combined = `${hook} ${caption}`.trim();
  const hookQuality = evaluateHookCopyQuality(
    hook,
    normalizeCopy(pkg.predatorName),
    normalizeCopy(pkg.preyName)
  );

  let score = 4;

  score += hookQuality.hasSpeciesClarity ? 1 : -1;
  score += hookQuality.hasObservationalTone ? 2 : 0;
  score += SHARE_BEAT_PATTERN.test(combined) ? 2 : -2;
  score += /\b(before|once|until|changed|outcome|turned|window|shifted|control)\b/i.test(
    combined
  )
    ? 1
    : -1;
  score += /\?/.test(caption) ? 1 : 0;

  if (ATMOSPHERE_ONLY_PATTERN.test(combined) && !SHARE_BEAT_PATTERN.test(combined)) {
    score -= 3;
  }

  if (!/\b(result|outcome|turn|break|escape|claim|control|shift)\b/i.test(combined)) {
    score -= 1;
  }

  return clampTenPointScore(score);
}

/**
 * Scores how much the packaging invites thoughtful discussion rather than shallow engagement.
 */
function scoreCommentDepthIntent(pkg: GeneratedPackage): number {
  const hook = normalizeCopy(pkg.platformPack?.facebook.hook ?? pkg.hook);
  const caption = normalizeCopy(pkg.platformPack?.facebook.caption ?? pkg.caption);
  const cta = normalizeCopy(pkg.cta);
  const combined = `${hook} ${caption} ${cta}`.trim();
  const hookQuality = evaluateHookCopyQuality(
    hook,
    normalizeCopy(pkg.predatorName),
    normalizeCopy(pkg.preyName)
  );

  let score = 3;

  score += validateCaptionCTA(caption) ? 4 : -2;
  score += COMMENT_PROMPT_PATTERN.test(caption) || COMMENT_PROMPT_PATTERN.test(cta) ? 2 : 0;
  score += hookQuality.hasSpeciesClarity ? 1 : -1;
  score += hookQuality.hasObservationalTone ? 1 : 0;

  if (hasForcedEngagementCopy(combined) || hasBaitLikeCopy(combined)) {
    score -= 4;
  }

  return clampTenPointScore(score);
}

/**
 * Scores how safely monetizable the Facebook package looks for clean-danger wildlife content.
 */
function scoreMonetisationSafety(
  pkg: GeneratedPackage,
  publishGuardPass: boolean | null,
  originalityConfidence: number
): number {
  const hook = normalizeCopy(pkg.platformPack?.facebook.hook ?? pkg.hook);
  const caption = normalizeCopy(pkg.platformPack?.facebook.caption ?? pkg.caption);
  const cta = normalizeCopy(pkg.cta);
  const combined = `${hook} ${caption} ${cta}`.trim();

  let score = 7;

  score += publishGuardPass === true ? 2 : publishGuardPass === false ? -2 : 0;
  score += originalityConfidence >= 75 ? 2 : originalityConfidence >= 60 ? 1 : 0;
  score += hasForcedEngagementCopy(combined) || hasBaitLikeCopy(combined) ? -2 : 1;
  score += GRAPHIC_PACKAGING_PATTERN.test(combined) ? -4 : 1;
  score += /\b(pressure|spacing|timing|claim|warning|breakaway|holds ground|tests the defense)\b/i.test(
    combined
  )
    ? 1
    : 0;

  return clampTenPointScore(score);
}

/**
 * Scores whether the package contains a light owned-funnel conversion path instead of distribution-only packaging.
 */
function scoreOwnedFunnelConversionIntent(pkg: GeneratedPackage): number {
  const caption = normalizeCopy(pkg.platformPack?.facebook.caption ?? pkg.caption);
  const cta = normalizeCopy(pkg.cta);
  const combined = `${caption} ${cta} ${normalizeCopy(pkg.altTextPrompt ?? "")}`.trim();

  let score = 1;

  score += cta ? 2 : -1;
  score += validateCaptionCTA(caption) ? 2 : 0;
  score += CONVERSION_SIGNAL_PATTERN.test(combined) ? 3 : 0;
  score += /\b(original content|wild stories tv)\b/i.test(combined) ? 1 : 0;

  if (!cta && !CONVERSION_SIGNAL_PATTERN.test(combined)) {
    score -= 2;
  }

  return clampTenPointScore(score);
}

function scoreHashtagHygiene(pkg: GeneratedPackage): number {
  const hashtags = splitHashtags(pkg.platformPack?.facebook.hashtags ?? pkg.hashtags);
  const uniqueCount = new Set(hashtags.map((tag) => tag.toLowerCase())).size;
  const joined = hashtags.join(" ");
  const noisy = hasBaitLikeCopy(joined) || hasForcedEngagementCopy(joined);

  let score = 35;

  if (hashtags.length === 5) {
    score += 30;
  } else if (hashtags.length >= 4 && hashtags.length <= 6) {
    score += 16;
  } else if (hashtags.length >= 3 && hashtags.length <= 8) {
    score += 8;
  } else {
    score -= 12;
  }

  score += hashtags.every((tag) => tag.startsWith("#")) ? 10 : -8;
  score += uniqueCount === hashtags.length ? 12 : -12;
  score += hashtags.every((tag) => tag.length >= 3 && tag.length <= 24) ? 8 : -6;
  score += noisy ? -8 : 5;

  return clampScore(score);
}

function scorePackagingQuality(
  pkg: GeneratedPackage,
  overlayRecommendation: FacebookOverlayPresetScore | undefined,
  coverBest: FacebookCoverFramePresetScore | undefined,
  publishGuardPass: boolean | null,
  warningCount: number,
  evidence: RealGenerationEvidenceRecord | undefined,
  shouldPublish: boolean | null
): number {
  let score = average([overlayRecommendation?.score, coverBest?.score], 60);

  score += pkg.platformPack?.facebook.overlayGuidance ? 4 : 0;
  score += publishGuardPass === true ? 10 : publishGuardPass === false ? -12 : 0;
  score -= Math.min(18, warningCount * 5);
  score += shouldPublish === true ? 4 : shouldPublish === false ? -4 : 0;

  if (evidence?.userRecommendation === "keep") score += 5;
  if (evidence?.userRecommendation === "retry-with-fixes") score -= 4;
  if (evidence?.userRecommendation === "retry") score -= 15;

  return clampScore(score);
}

export function formatFacebookPublishReadinessVerdict(
  verdict: FacebookPublishReadinessVerdict
): string {
  return VERDICT_LABELS[verdict];
}

export function buildFacebookPublishReadinessReport(
  pkg: GeneratedPackage,
  evidence?: RealGenerationEvidenceRecord
): FacebookPublishReadinessReport {
  const facebook = pkg.platformPack?.facebook;
  const overlayRecommendation = facebook?.facebookOverlayRecommendation?.recommended;
  const coverBest = facebook?.facebookCoverFrameRanking?.best;
  const publishGuardPass = readPublishGuardPass(pkg);
  const publishGuardWarnings = readPublishGuardWarnings(pkg);
  const shouldPublish =
    typeof pkg.usViewsModeReport?.shouldPublish === "boolean"
      ? pkg.usViewsModeReport.shouldPublish
      : null;
  const captionCtaValid = validateCaptionCTA(
    normalizeCopy(pkg.platformPack?.facebook.caption ?? pkg.caption)
  );
  const originalityConfidence = scoreOriginalityConfidence(pkg, publishGuardPass, evidence);

  const scores: FacebookPublishReadinessScores = {
    originalityConfidence,
    firstFrameHookReadability: scoreFirstFrameHookReadability(
      pkg,
      overlayRecommendation,
      evidence
    ),
    hookOverlayClarity: scoreHookOverlayClarity(pkg, overlayRecommendation),
    captionUsefulness: scoreCaptionUsefulness(pkg),
    hashtagHygiene: scoreHashtagHygiene(pkg),
    packagingQuality: scorePackagingQuality(
      pkg,
      overlayRecommendation,
      coverBest,
      publishGuardPass,
      publishGuardWarnings.length,
      evidence,
      shouldPublish
    ),
    shareIntentScore: scoreShareIntent(pkg),
    commentDepthIntentScore: scoreCommentDepthIntent(pkg),
    monetisationSafetyScore: scoreMonetisationSafety(
      pkg,
      publishGuardPass,
      originalityConfidence
    ),
    ownedFunnelConversionIntentScore: scoreOwnedFunnelConversionIntent(pkg),
  };

  const overallScore = clampScore(
    scores.originalityConfidence * 0.15 +
      scores.firstFrameHookReadability * 0.14 +
      scores.hookOverlayClarity * 0.12 +
      scores.captionUsefulness * 0.12 +
      scores.hashtagHygiene * 0.08 +
      scores.packagingQuality * 0.12 +
      scores.shareIntentScore * 10 * 0.08 +
      scores.commentDepthIntentScore * 10 * 0.07 +
      scores.monetisationSafetyScore * 10 * 0.07 +
      scores.ownedFunnelConversionIntentScore * 10 * 0.05
  );

  const verdict: FacebookPublishReadinessVerdict =
    evidence?.userRecommendation === "retry" ||
    overallScore < 45 ||
    scores.monetisationSafetyScore <= 3 ||
    scores.shareIntentScore <= 3 ||
    (scores.originalityConfidence < 40 && scores.packagingQuality < 45)
      ? "retry-content-before-publish"
      : publishGuardPass === true &&
          captionCtaValid &&
          overallScore >= 78 &&
          scores.originalityConfidence >= 68 &&
          scores.firstFrameHookReadability >= 65 &&
          scores.hookOverlayClarity >= 60 &&
          scores.captionUsefulness >= 58 &&
          scores.hashtagHygiene >= 65 &&
          scores.packagingQuality >= 65 &&
          scores.shareIntentScore >= 7 &&
          scores.commentDepthIntentScore >= 6 &&
          scores.monetisationSafetyScore >= 7 &&
          scores.ownedFunnelConversionIntentScore >= 4
        ? "ready-to-publish"
        : "review-packaging-before-publish";

  const reasons: string[] = [];

  if (evidence) {
    reasons.push(
      `Latest evidence pass: ${formatEvidenceRecommendation(
        evidence.userRecommendation
      )} (${evidence.overallScore}/100).`
    );
  }

  if (publishGuardPass === false) {
    reasons.push(
      `Publish guard still flags ${Math.max(1, publishGuardWarnings.length)} cleanup item${
        publishGuardWarnings.length === 1 ? "" : "s"
      } in the current package.`
    );
  } else if (publishGuardPass === true) {
    reasons.push("Publish guard is clear on the current package.");
  }

  if (scores.hookOverlayClarity >= 75 && scores.packagingQuality >= 72) {
    reasons.push(
      "Hook overlay and cover-frame packaging look strong enough for a first Facebook test."
    );
  } else if (scores.hookOverlayClarity < 60 || scores.packagingQuality < 60) {
    reasons.push(
      "Overlay or cover-frame packaging still looks soft for a fast Facebook post."
    );
  }

  if (scores.originalityConfidence < 65) {
    reasons.push(
      "Originality confidence is only moderate, so tighten hook or caption packaging before posting."
    );
  } else {
    reasons.push(
      "Hook and caption stay species-clear without obvious spammy packaging cues."
    );
  }

  if (!captionCtaValid) {
    reasons.push(
      "The Facebook caption does not end on a clean observational discussion prompt, so publish-readiness stays blocked until the CTA is fixed."
    );
  }

  if (scores.shareIntentScore < 6 || scores.commentDepthIntentScore < 6) {
    reasons.push(
      "The package still needs a clearer behavioural beat or deeper discussion angle before it is strong enough to publish."
    );
  }

  if (scores.monetisationSafetyScore < 7) {
    reasons.push(
      "Monetisation safety is still soft, so clean up any bait, graphic wording, or originality risk before posting."
    );
  }

  if (scores.ownedFunnelConversionIntentScore < 4) {
    reasons.push(
      "The package is still mostly distribution-only. Add a cleaner page or original-series angle if you want stronger owned-funnel follow-through."
    );
  }

  if (scores.captionUsefulness < 60 || scores.hashtagHygiene < 65) {
    reasons.push("Caption or hashtags still want a cleanup pass before posting.");
  }

  const reminders = [
    "Add the correct AI-generated-content label or disclosure before publishing.",
    "Do one final first-frame and cover-frame glance inside the Facebook preview.",
  ];

  if (!evidence) {
    reminders.push(
      "No saved evidence pass yet. After the first real render, log one evidence review for future prompt comparison."
    );
  }

  if (!captionCtaValid) {
    reminders.push(
      "Replace the caption ending with an observational discussion prompt before you post."
    );
  }

  if (scores.shareIntentScore < 6) {
    reminders.push(
      "Strengthen the package around one dominant behavioural beat with a clearer outcome shift or replay-worthy turn."
    );
  }

  if (scores.ownedFunnelConversionIntentScore < 4) {
    reminders.push(
      "Add a subtle page, series, or original-content angle if you want stronger owned-funnel conversion from the post."
    );
  }

  if (verdict !== "ready-to-publish") {
    reminders.push(
      "Export the package text backup and tighten the packaging before you publish."
    );
  }

  if (scores.originalityConfidence < 65) {
    reminders.push(
      "If the package feels too familiar, rewrite the hook and caption before posting."
    );
  }

  const summary =
    verdict === "ready-to-publish"
      ? "The package looks publish-ready for Facebook: the opening reads quickly, the packaging is clean, and nothing major is pushing this back into retry territory."
      : verdict === "review-packaging-before-publish"
        ? "The content is usable, but the Facebook packaging still wants a final pass before posting."
        : "This package still looks too risky to post as-is. Retry the content or packaging before publishing.";

  return {
    overallScore,
    verdict,
    verdictLabel: formatFacebookPublishReadinessVerdict(verdict),
    summary,
    scores,
    publishGuardPass,
    publishGuardWarnings,
    reasons: reasons.slice(0, 4),
    reminders,
    evidenceContext: evidence
      ? {
          overallScore: evidence.overallScore,
          recommendationLabel: formatEvidenceRecommendation(evidence.userRecommendation),
          note:
            normalizeCopy(
              evidence.notes.retryPlan ||
                evidence.notes.driftObserved ||
                evidence.notes.strongPoints
            ) || "Saved from the latest evidence pass.",
        }
      : undefined,
  };
}
