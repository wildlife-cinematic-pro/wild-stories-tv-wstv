import type { AutoRecommendationResult } from "@/lib/auto-recommendations";
import type { FacebookCaptionVariant } from "@/lib/facebook-caption-variants";
import type { FacebookHookVariant } from "@/lib/facebook-hook-variants";
import type { FacebookReelsScoreResult } from "@/lib/facebook-reels-scoring";
import type { StoryModeQAResult } from "@/lib/story-mode-qa";
import { StoryMode } from "@/types";

import type { GeneratedPackage } from "@/types";

export type ABTestPlanVariant = {
  label: "A" | "B" | "C";
  hook: string;
  caption: string;
  hashtags: string[];
  testFocus: string;
  expectedSignal: string;
};

export type ABTestPlan = {
  title: string;
  hypothesis: string;
  variants: ABTestPlanVariant[];
  successMetric: string;
  runNotes: string[];
};

export type ABTestPlanInput = {
  currentPackage: GeneratedPackage;
  recommendation: AutoRecommendationResult;
  facebookScore?: FacebookReelsScoreResult | null;
  storyModeQA?: StoryModeQAResult | null;
  hookVariants?: FacebookHookVariant[];
  captionVariants?: FacebookCaptionVariant[];
};

const UNSAFE_PATTERN =
  /\b(gore|blood|bloody|visible injury|visible wound|torn flesh|exposed injury|broken bones|graphic injury|dead animal)\b/i;

const ENGAGEMENT_BAIT_PATTERN =
  /\b(comment yes|comment no|like if|tag a friend|share this|react to vote)\b/i;

const DEFAULT_HASHTAGS = [
  "#WildlifeReels",
  "#AnimalStories",
  "#NatureReels",
  "#WildlifeDocumentary",
  "#USAReels",
];

const MODE_ANGLE: Partial<Record<StoryMode, string>> = {
  [StoryMode.PREDATOR_VS_PREY]: "escape pressure",
  [StoryMode.HERD_DEFENSE]: "group defense power",
  [StoryMode.MOTHER_BABY]: "protective survival emotion",
  [StoryMode.RIVAL_CLASH]: "dominance standoff",
  [StoryMode.NEAR_MISS]: "last-second escape",
  [StoryMode.FISHING_STRIKE]: "timing and splash",
  [StoryMode.WEATHER_SURVIVAL]: "weather survival",
  [StoryMode.MIGRATION]: "crossing pressure",
  [StoryMode.SCAVENGER_CONFLICT]: "food-zone ownership",
};

function cleanText(value: string | undefined, fallback: string, maxLength: number) {
  const cleaned = (value || fallback)
    .replace(/\s+/g, " ")
    .replace(UNSAFE_PATTERN, "survival tension")
    .replace(ENGAGEMENT_BAIT_PATTERN, "watch the first move")
    .trim();

  return cleaned.slice(0, maxLength).trim().replace(/[,.!?;:]+$/g, "");
}

function safeHashtags(value: string[] | undefined): string[] {
  const tags = Array.from(
    new Set(
      (value && value.length ? value : DEFAULT_HASHTAGS)
        .filter((tag) => typeof tag === "string")
        .map((tag) => tag.trim())
        .filter((tag) => tag.startsWith("#"))
        .filter((tag) => !UNSAFE_PATTERN.test(tag))
        .filter((tag) => !ENGAGEMENT_BAIT_PATTERN.test(tag))
    )
  );

  return [...tags, ...DEFAULT_HASHTAGS]
    .filter((tag, index, array) => array.indexOf(tag) === index)
    .slice(0, 5);
}

function chooseHook(
  hooks: FacebookHookVariant[],
  style: FacebookHookVariant["style"] | undefined,
  fallback: string,
  excludedHooks: string[] = []
) {
  const excluded = new Set(excludedHooks.map((hook) => hook.toLowerCase()));
  const match = style
    ? hooks.find(
        (variant) =>
          variant.style === style &&
          variant.hook.length <= 90 &&
          !excluded.has(variant.hook.toLowerCase())
      )
    : undefined;
  const fallbackMatch = hooks.find(
    (variant) => variant.hook.length <= 90 && !excluded.has(variant.hook.toLowerCase())
  );
  return cleanText(match?.hook ?? fallbackMatch?.hook, fallback, 90);
}

function chooseCaption(captions: FacebookCaptionVariant[], index: number, fallback: string) {
  const caption = captions[index] ?? captions[0];
  return {
    caption: cleanText(caption?.caption, fallback, 150),
    hashtags: safeHashtags(caption?.hashtags),
  };
}

function makeVariant(
  label: ABTestPlanVariant["label"],
  hook: string,
  caption: string,
  hashtags: string[],
  testFocus: string,
  expectedSignal: string
): ABTestPlanVariant {
  return {
    label,
    hook: cleanText(hook, "A clear wildlife survival moment starts fast", 90),
    caption: cleanText(caption, "Clean wildlife tension with a readable first-frame story", 150),
    hashtags: safeHashtags(hashtags),
    testFocus,
    expectedSignal,
  };
}

export function buildABTestPlan(input: ABTestPlanInput): ABTestPlan {
  const storyMode = input.currentPackage.storyMode ?? StoryMode.PREDATOR_VS_PREY;
  const subjectA =
    input.recommendation.recommendedSubjects?.subjectA ??
    input.currentPackage.subjectA ??
    input.currentPackage.predatorName ??
    "Lead Animal";
  const subjectB =
    input.recommendation.recommendedSubjects?.subjectB ??
    input.currentPackage.subjectB ??
    input.currentPackage.preyName ??
    "Opposing Animal";
  const angle = MODE_ANGLE[storyMode] ?? "wildlife survival";
  const hooks = input.hookVariants ?? [];
  const captions = input.captionVariants ?? [];
  const topCaption = chooseCaption(
    captions,
    0,
    `${subjectA} and ${subjectB} create clean wildlife tension with a fast first-frame read.`
  );
  const recommendedCaption = chooseCaption(
    captions,
    1,
    `${subjectA} shifts the scene before ${subjectB} can fully reset.`
  );
  const alternativeCaption = chooseCaption(
    captions,
    2,
    `One small movement changes the whole ${angle} story.`
  );

  const hookA = cleanText(hooks[0]?.hook, `${subjectA} makes the first move`, 90);
  const hookB = chooseHook(
    hooks,
    input.recommendation.recommendedHookStyle,
    `${subjectA} changes the whole ${angle} moment`,
    [hookA]
  );
  const hookC = cleanText(
    hooks.find(
      (variant) =>
        variant.style !== input.recommendation.recommendedHookStyle &&
        ![hookA.toLowerCase(), hookB.toLowerCase()].includes(variant.hook.toLowerCase())
    )?.hook,
    `The ${angle} tell appears before the final move`,
    90
  );

  const candidates = [
    makeVariant(
      "A",
      hookA,
      topCaption.caption,
      topCaption.hashtags,
      "Safest current high-scoring hook and caption pair.",
      "Best baseline retention and lowest safety risk."
    ),
    makeVariant(
      "B",
      hookB,
      recommendedCaption.caption,
      recommendedCaption.hashtags,
      `Recommended ${input.recommendation.recommendedHookStyle ?? "mode-aware"} hook style.`,
      "Higher shares or saves if the recommendation angle is stronger."
    ),
    makeVariant(
      "C",
      hookC,
      alternativeCaption.caption,
      alternativeCaption.hashtags,
      "Alternative emotional, spectacle, or survival angle for the same package.",
      "Replay value lift from a different viewer-read angle."
    ),
  ];

  const variants = candidates
    .filter((variant) => !UNSAFE_PATTERN.test(`${variant.hook} ${variant.caption}`))
    .filter((variant) => !ENGAGEMENT_BAIT_PATTERN.test(`${variant.hook} ${variant.caption}`))
    .filter(
      (variant, index, array) =>
        array.findIndex(
          (candidate) =>
            candidate.hook.toLowerCase() === variant.hook.toLowerCase() ||
            candidate.caption.toLowerCase() === variant.caption.toLowerCase()
        ) === index
    )
    .slice(0, 3);

  return {
    title: "Next A/B Test Plan",
    hypothesis: `Testing ${angle} hooks for ${subjectA} + ${subjectB} should reveal which first-frame promise earns the strongest safe Reels response.`,
    variants,
    successMetric:
      "Compare retention rate, share rate, saves, follows gained, and comments per view after each Reel has a fair early sample.",
    runNotes: [
      "Post one variant at a time with the same visual package quality and no automatic posting.",
      "Keep captions under 150 characters and use exactly 5 hashtags.",
      "Do not use gore, blood, visible injury, engagement bait, or false real-footage claims.",
      `Current Facebook score: ${input.facebookScore?.totalScore ?? "not scored"}/100; Story Mode QA: ${input.storyModeQA?.score ?? "not scored"}/100.`,
    ],
  };
}
