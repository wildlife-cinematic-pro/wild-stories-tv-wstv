import { ViolenceLevel } from "@/types";

import type { GeneratedPackage } from "@/types";

export type FacebookReelsScoreResult = {
  totalScore: number;
  status: "strong" | "good" | "needs-work" | "risky";
  dimensions: {
    firstFrameHook: number;
    retentionCurve: number;
    replayValue: number;
    usaAudienceFit: number;
    storyClarity: number;
    originalitySignal: number;
    safetyMonetizationFit: number;
    captionSearchFit: number;
    platformFormatFit: number;
  };
  passes: string[];
  warnings: string[];
  fixes: string[];
};

const GRAPHIC_UNSAFE_PATTERNS = [
  /\bblood\b/i,
  /\bbloody\b/i,
  /\bgore\b/i,
  /\bgory\b/i,
  /\bvisible injur(?:y|ies)\b/i,
  /\bvisible wound(s)?\b/i,
  /\btorn flesh\b/i,
  /\bexposed injury\b/i,
  /\bbroken bone(s)?\b/i,
  /\bgraphic outcome\b/i,
  /\bgraphic injury\b/i,
  /\bkill shot\b/i,
  /\bkilled\b/i,
  /\bdead animal\b/i,
  /\bcarcass gore\b/i,
];

const STATIC_FORMAT_PATTERNS = [
  /\bstatic slideshow\b/i,
  /\bslideshow\b/i,
  /\blooping still(s)?\b/i,
  /\btext montage\b/i,
  /\btext-only montage\b/i,
  /\bstatic image sequence\b/i,
  /\blow[- ]value repost\b/i,
  /\brepost compilation\b/i,
];

const ENGAGEMENT_BAIT_PATTERN =
  /\b(comment yes|comment no|like if|tag a friend|share this|react to vote)\b/i;

const USA_REGION_PATTERN =
  /\b(yellowstone|alaska|everglades|rocky mountains?|great plains?|appalachia|appalachian|pacific northwest|pnw|usa|american|north american|florida|montana|wyoming|idaho|maine|colorado)\b/i;

const USA_SPECIES_PATTERN =
  /\b(grizzly|bison|elk|moose|white[- ]tailed deer|deer|mountain lion|coyote|wolf|wolves|bald eagle|alligator|black bear|musk ox|caribou|rabbit|fox|salmon)\b/i;

const FIRST_FRAME_PATTERN =
  /\b(first[- ]frame|opening|hook|immediate|first 1|first two|first 2|visible tension|open lane|escape lane)\b/i;

const MOTION_PATTERN =
  /\b(motion|movement|shot|runway|kling|video|reels|9:16|vertical|chase|crossing|pushes|turn|swipe|dive|standoff|formation)\b/i;

const ORIGINALITY_PATTERN =
  /\b(original|produced|production|unique story|fresh angle|documentary|creator|new story|not repost|no repost|no watermark)\b/i;

const SEARCH_KEYWORD_PATTERN =
  /\b(wildlife|animal|nature|documentary|reels|yellowstone|alaska|everglades|migration|survival|herd|mother|rival|escape)\b/i;

const REPLAY_PATTERN =
  /\b(replay|hidden detail|tell|near[- ]miss|unresolved|reveal|final frame|watch the|spot|one wrong step|one opening|one clean way)\b/i;

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function hasAny(text: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

function countMatches(text: string, patterns: RegExp[]) {
  return patterns.reduce((count, pattern) => count + (pattern.test(text) ? 1 : 0), 0);
}

function collectPackageText(pkg: GeneratedPackage) {
  const chunks = [
    pkg.imagePrompt,
    pkg.gptImage2Prompt,
    pkg.thumbnailPrompt,
    pkg.voiceoverLine,
    pkg.hook,
    ...(pkg.hook2026 ?? []),
    pkg.caption,
    pkg.caption2026,
    pkg.pinnedComment,
    pkg.cta,
    pkg.hashtags,
    pkg.tags,
    pkg.runwayBundle,
    pkg.klingBundle,
    pkg.routingNote,
    pkg.referenceWorkflow,
    pkg.qualitySummary,
    pkg.sceneDesc,
    pkg.platformPack?.facebook?.hook,
    pkg.platformPack?.facebook?.caption,
    pkg.structuredPrompts?.imagePrompt?.fullText,
    pkg.structuredPrompts?.gptImage2Prompt?.fullText,
    ...(pkg.structuredPrompts?.workflowShots?.map((shot) => shot.fullText) ?? []),
    ...(pkg.shotImagePlan?.map((shot) => shot.prompt) ?? []),
    ...(pkg.shotPlan?.map((shot) => `${shot.title} ${shot.prompt}`) ?? []),
    ...(pkg.runwayShots ?? []),
    ...(pkg.klingShots ?? []),
    ...(pkg.tenIdeas ?? []),
  ];

  return chunks.filter(Boolean).join("\n");
}

function removeAllowedSafetyLanguage(text: string) {
  return text
    .replace(/negative prompt:[\s\S]*/gi, "")
    .replace(
      /\b(no|without|avoid|avoids|forbid|forbids|forbidden|non[- ]graphic)\s+(gore|blood|bloody|visible injury|visible injuries|visible wounds|wounds|injury|injuries|graphic outcome|graphic injury|torn flesh|exposed injury|broken bones|kill|death|contact)\b/gi,
      ""
    )
    .replace(/\b(no|without)\s+visible\s+injury\b/gi, "")
    .replace(/\bnon[- ]graphic\b/gi, "");
}

function getSubjects(pkg: GeneratedPackage) {
  const subjectA = pkg.subjectA ?? pkg.predatorName ?? "";
  const subjectB = pkg.subjectB ?? pkg.preyName ?? "";
  return [subjectA, subjectB].map((subject) => subject.trim()).filter(Boolean);
}

function scoreCaptionSearch(pkg: GeneratedPackage, text: string, warnings: string[], fixes: string[]) {
  let score = 55;
  const caption = [pkg.caption, pkg.caption2026, pkg.platformPack?.facebook?.caption]
    .filter(Boolean)
    .join("\n");
  const hashtags = (pkg.hashtags ?? "")
    .split(/\s+/)
    .filter((tag) => tag.startsWith("#"));

  if (caption.length > 0 && caption.length <= 180) score += 15;
  if (caption.length > 180) {
    warnings.push("Caption may be too long for quick Reels scanning.");
    fixes.push("Keep the top caption variant near 150 characters with one clear wildlife keyword.");
    score -= 10;
  }

  if (SEARCH_KEYWORD_PATTERN.test(text)) score += 15;
  if (hashtags.length > 0 && hashtags.length <= 5) score += 10;
  if (hashtags.length > 5) {
    warnings.push("Hashtag set looks crowded for Facebook discovery.");
    fixes.push("Use exactly 5 niche wildlife hashtags instead of stuffing broad tags.");
    score -= 15;
  }
  if (ENGAGEMENT_BAIT_PATTERN.test(text)) {
    warnings.push("Engagement bait wording detected.");
    fixes.push("Use a real viewer-read question instead of like/comment/share bait.");
    score -= 30;
  }

  return clampScore(score);
}

function scoreRetention(pkg: GeneratedPackage, text: string, warnings: string[], fixes: string[]) {
  const shotText = (pkg.shotPlan ?? [])
    .map((shot, index) => `${index + 1} ${shot.title} ${shot.prompt}`)
    .join("\n")
    .toLowerCase();
  const source = shotText || text.toLowerCase();
  const beats = [
    /\b(establish|opening|first[- ]frame|hook)\b/i,
    /\b(pressure|build|tighten|trigger|escalation)\b/i,
    /\b(peak|strongest|near[- ]miss|standoff|survival beat|crossing|strike)\b/i,
    /\b(resolve|aftermath|unresolved|exit|final frame|protected exit)\b/i,
  ];
  const found = countMatches(source, beats);
  let score = 45 + found * 13;

  const engineSequence = pkg.shotPlan?.map((shot) => shot.engine).join("/");
  if (engineSequence === "RUNWAY/KLING/KLING/RUNWAY") score += 8;

  if (found < 3) {
    warnings.push("Four-beat retention curve is not fully visible.");
    fixes.push("Make the package show establish, pressure, peak, and resolve/unresolved beats.");
  }

  return clampScore(score);
}

export function analyzeFacebookReelsPackage(
  pkg: GeneratedPackage
): FacebookReelsScoreResult {
  const rawText = collectPackageText(pkg);
  const text = rawText.toLowerCase();
  const unsafeScanText = removeAllowedSafetyLanguage(rawText).toLowerCase();
  const passes: string[] = [];
  const warnings: string[] = [];
  const fixes: string[] = [];
  const subjects = getSubjects(pkg);

  const firstFrameHook = clampScore(
    45 +
      (FIRST_FRAME_PATTERN.test(text) ? 25 : 0) +
      (subjects.length >= 2 && subjects.every((subject) => text.includes(subject.toLowerCase())) ? 15 : 0) +
      (/\b(tension|pressure|escape lane|open lane|standoff|near[- ]miss|survival)\b/i.test(text) ? 15 : 0)
  );

  if (firstFrameHook >= 80) {
    passes.push("First-frame hook has immediate visual tension and clear subjects.");
  } else {
    warnings.push("First-frame hook could be clearer.");
    fixes.push("Open with both subjects readable and a visible pressure or escape lane.");
  }

  const retentionCurve = scoreRetention(pkg, rawText, warnings, fixes);
  if (retentionCurve >= 80) passes.push("Four-beat retention curve is visible.");

  const replayValue = clampScore(
    50 +
      (REPLAY_PATTERN.test(text) ? 30 : 0) +
      (/\b(unresolved|final frame|tell|hidden detail|spot|one wrong step)\b/i.test(text) ? 15 : 0)
  );
  if (replayValue >= 80) {
    passes.push("Replay value is supported by a tell, near-miss, reveal, or unresolved ending.");
  } else {
    warnings.push("Replay value could be stronger.");
    fixes.push("Add a real visual tell, hidden detail, or unresolved final-frame question.");
  }

  const usaAudienceFit = clampScore(
    40 +
      (USA_REGION_PATTERN.test(text) ? 30 : 0) +
      (USA_SPECIES_PATTERN.test(text) ? 25 : 0) +
      (pkg.habitatRegion ? 5 : 0)
  );
  if (usaAudienceFit >= 80) {
    passes.push("USA wildlife audience fit is clear.");
  } else {
    warnings.push("USA wildlife audience signal is light.");
    fixes.push("Mention a recognizable USA habitat or species when it fits the story.");
  }

  const subjectClarity =
    subjects.length >= 2 && subjects.every((subject) => text.includes(subject.toLowerCase()));
  const storyClarity = clampScore(
    45 +
      (subjectClarity ? 30 : 0) +
      (pkg.storyMode && text.includes(String(pkg.storyMode).toLowerCase().replaceAll("_", " ").split(" ")[0]) ? 8 : 0) +
      (/\b(subject|predator|prey|mother|herd|rival|owner|challenger|crossing|hazard)\b/i.test(text) ? 17 : 0)
  );
  if (storyClarity >= 80) {
    passes.push("Story subjects and conflict roles are clear.");
  } else {
    warnings.push("Story roles could be easier to scan.");
    fixes.push("Make Subject A and Subject B visible in the hook, image prompt, or shot plan.");
  }

  const originalitySignal = clampScore(
    55 +
      (ORIGINALITY_PATTERN.test(text) ? 25 : 0) +
      (!/\b(repost|compilation|downloaded|watermark|stolen|remix only)\b/i.test(text) ? 15 : -20)
  );
  if (originalitySignal >= 80) {
    passes.push("Original production signal is strong enough for a creator workflow.");
  } else {
    warnings.push("Originality signal is weak or mentions repost-style behavior.");
    fixes.push("Frame the output as a produced WSTV scene, not a repost, remix, or compilation.");
  }

  let safetyMonetizationFit = 100;
  const unsafeDetected = hasAny(unsafeScanText, GRAPHIC_UNSAFE_PATTERNS);
  if (unsafeDetected) {
    safetyMonetizationFit = 15;
    warnings.push("Graphic or monetization-risk wording detected.");
    fixes.push("Remove gore, blood, visible injury, torn flesh, kill-shot, or graphic outcome language.");
  } else {
    passes.push("Monetization safety stays non-graphic.");
  }

  if (
    (pkg.violenceLevel ?? ViolenceLevel.DISPLAY_ONLY) === ViolenceLevel.DISPLAY_ONLY &&
    /\b(direct contact|impact|bite|collision|strike impact|physical clash)\b/i.test(
      unsafeScanText
    )
  ) {
    safetyMonetizationFit = Math.min(safetyMonetizationFit, 68);
    warnings.push("Violence Level 1 should avoid direct impact/contact language.");
    fixes.push("Use display, posture, pressure, or near-contact language for Level 1.");
  }

  const captionSearchFit = scoreCaptionSearch(pkg, rawText, warnings, fixes);
  if (captionSearchFit >= 80) passes.push("Caption and hashtag signals fit Facebook discovery.");

  const staticDetected = hasAny(text, STATIC_FORMAT_PATTERNS);
  const platformFormatFit = clampScore(
    50 +
      (/\b9:16|vertical|reels|short[- ]form\b/i.test(text) ? 20 : 0) +
      (MOTION_PATTERN.test(text) ? 20 : 0) +
      (staticDetected ? -35 : 10)
  );
  if (staticDetected) {
    warnings.push("Static/slideshow/looping/text-montage format language detected.");
    fixes.push("Keep the package motion-first with real shot progression, not static montage language.");
  } else if (platformFormatFit >= 80) {
    passes.push("Platform format is motion-first and Reels-friendly.");
  }

  const dimensions = {
    firstFrameHook,
    retentionCurve,
    replayValue,
    usaAudienceFit,
    storyClarity,
    originalitySignal,
    safetyMonetizationFit,
    captionSearchFit,
    platformFormatFit,
  };

  const totalScore = clampScore(
    firstFrameHook * 0.14 +
      retentionCurve * 0.12 +
      replayValue * 0.1 +
      usaAudienceFit * 0.1 +
      storyClarity * 0.12 +
      originalitySignal * 0.1 +
      safetyMonetizationFit * 0.16 +
      captionSearchFit * 0.08 +
      platformFormatFit * 0.08
  );

  const status = unsafeDetected
    ? "risky"
    : totalScore >= 85
      ? "strong"
      : totalScore >= 70
        ? "good"
        : totalScore >= 50
          ? "needs-work"
          : "risky";

  return {
    totalScore,
    status,
    dimensions,
    passes: Array.from(new Set(passes)),
    warnings: Array.from(new Set(warnings)).slice(0, 8),
    fixes: Array.from(new Set(fixes)).slice(0, 8),
  };
}
