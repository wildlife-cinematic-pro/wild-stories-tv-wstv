import { analyzeReelPerformance } from "@/lib/reels-performance-scoring";
import { buildPerformanceInsights } from "@/lib/reels-performance-insights";
import {
  STORY_MODE_PRESET_LABELS,
  USA_STORY_MODE_PRESETS,
  type StoryModePreset,
} from "@/lib/story-mode-presets";

import type { FacebookReelsScoreResult } from "@/lib/facebook-reels-scoring";
import type { StoryModeQAResult } from "@/lib/story-mode-qa";
import type {
  GeneratedPackage,
  HabitatRegion,
  ReelPerformanceRecord,
  StoryMode,
  ViralLane,
} from "@/types";
import { StoryMode as StoryModeEnum } from "@/types";

export type AutoRecommendationStatus = "learning" | "ready" | "needs-more-data";
export type AutoRecommendationHookStyle =
  | "danger"
  | "mystery"
  | "survival"
  | "emotion"
  | "spectacle";

export type AutoRecommendationInput = {
  savedRecords: ReelPerformanceRecord[];
  currentPackage?: GeneratedPackage | null;
  storyModePresets?: StoryModePreset[];
  facebookScore?: FacebookReelsScoreResult | null;
  storyModeQA?: StoryModeQAResult | null;
};

export type AutoRecommendationResult = {
  status: AutoRecommendationStatus;
  confidence: number;
  nextBestStoryMode?: StoryMode;
  nextBestPresetId?: string;
  nextBestPresetName?: string;
  nextBestViralLane?: ViralLane;
  nextBestHabitatRegion?: HabitatRegion;
  recommendedHookStyle?: AutoRecommendationHookStyle;
  recommendedCaptionStyle?: string;
  recommendedSubjects?: {
    subjectA?: string;
    subjectB?: string;
  };
  avoidList: string[];
  testIdeas: string[];
  reasons: string[];
  warnings: string[];
};

type ScoredRecord = {
  record: ReelPerformanceRecord;
  score: number;
  priorityScore: number;
};

const FALLBACK_MODE_ORDER: StoryMode[] = [
  StoryModeEnum.MOTHER_BABY,
  StoryModeEnum.HERD_DEFENSE,
  StoryModeEnum.NEAR_MISS,
  StoryModeEnum.WEATHER_SURVIVAL,
  StoryModeEnum.RIVAL_CLASH,
  StoryModeEnum.MIGRATION,
  StoryModeEnum.FISHING_STRIKE,
  StoryModeEnum.SCAVENGER_CONFLICT,
  StoryModeEnum.PREDATOR_VS_PREY,
];

const HOOK_STYLE_BY_MODE: Record<StoryMode, AutoRecommendationHookStyle> = {
  [StoryModeEnum.PREDATOR_VS_PREY]: "danger",
  [StoryModeEnum.HERD_DEFENSE]: "spectacle",
  [StoryModeEnum.MOTHER_BABY]: "emotion",
  [StoryModeEnum.RIVAL_CLASH]: "danger",
  [StoryModeEnum.NEAR_MISS]: "survival",
  [StoryModeEnum.FISHING_STRIKE]: "spectacle",
  [StoryModeEnum.WEATHER_SURVIVAL]: "survival",
  [StoryModeEnum.MIGRATION]: "spectacle",
  [StoryModeEnum.SCAVENGER_CONFLICT]: "mystery",
};

const CAPTION_STYLE_BY_MODE: Record<StoryMode, string> = {
  [StoryModeEnum.PREDATOR_VS_PREY]: "Clean chase/escape tension with one viewer-read question.",
  [StoryModeEnum.HERD_DEFENSE]: "Group defense power angle with readable formation language.",
  [StoryModeEnum.MOTHER_BABY]: "Protective survival emotion with non-graphic stakes.",
  [StoryModeEnum.RIVAL_CLASH]: "Dominance standoff angle without graphic impact wording.",
  [StoryModeEnum.NEAR_MISS]: "Last-second escape angle with replay-worthy timing.",
  [StoryModeEnum.FISHING_STRIKE]: "Timing and splash spectacle with clean feeding language.",
  [StoryModeEnum.WEATHER_SURVIVAL]: "Nature-as-opponent survival angle.",
  [StoryModeEnum.MIGRATION]: "Scale, route pressure, and crossing decision angle.",
  [StoryModeEnum.SCAVENGER_CONFLICT]: "Food-zone ownership tension without graphic detail.",
};

const UNSAFE_PATTERN =
  /\b(blood|bloody|gore|gory|visible injury|visible wound|torn flesh|exposed injury|broken bones|dead animal|graphic injury)\b/i;

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function safeRate(numerator: number | undefined, denominator: number): number {
  if (!Number.isFinite(denominator) || denominator <= 0) return 0;
  const safeNumerator = Number.isFinite(numerator) && (numerator ?? 0) >= 0 ? numerator ?? 0 : 0;
  return safeNumerator / denominator;
}

function labelForStoryMode(storyMode: StoryMode | undefined): string {
  if (!storyMode) return "Unknown Story Mode";
  return STORY_MODE_PRESET_LABELS[storyMode] ?? storyMode.replaceAll("_", " ");
}

function isUnsafeRecord(record: ReelPerformanceRecord): boolean {
  return UNSAFE_PATTERN.test(
    [record.hookUsed, record.captionUsed, record.notes, ...(record.hashtagsUsed ?? [])]
      .filter(Boolean)
      .join("\n")
  );
}

function scoreRecord(record: ReelPerformanceRecord): ScoredRecord {
  const insight = analyzeReelPerformance(record);
  const views = Number.isFinite(record.views) && record.views > 0 ? record.views : 0;
  const shareRate = safeRate(record.shares, views);
  const saveRate = safeRate(record.saves, views);
  const followRate = safeRate(record.followsGained, views);
  const retentionRate = insight.retentionRate ?? 0;

  return {
    record,
    score: insight.score,
    priorityScore: clampScore(
      insight.score * 0.72 +
        Math.min(100, shareRate * 5000) * 0.1 +
        Math.min(100, saveRate * 4200) * 0.08 +
        Math.min(100, followRate * 9000) * 0.05 +
        Math.min(100, retentionRate * 120) * 0.05
    ),
  };
}

function getBestMode(scoredRecords: ScoredRecord[]): StoryMode | undefined {
  const groups = new Map<StoryMode, { count: number; total: number }>();

  for (const item of scoredRecords) {
    if (!item.record.storyMode) continue;
    const existing = groups.get(item.record.storyMode) ?? { count: 0, total: 0 };
    groups.set(item.record.storyMode, {
      count: existing.count + 1,
      total: existing.total + item.priorityScore,
    });
  }

  return Array.from(groups.entries())
    .map(([storyMode, value]) => ({
      storyMode,
      count: value.count,
      average: value.total / value.count,
    }))
    .sort((a, b) => b.average - a.average || b.count - a.count)[0]?.storyMode;
}

function chooseFallbackMode(presets: StoryModePreset[]): StoryMode {
  return (
    FALLBACK_MODE_ORDER.find((storyMode) =>
      storyMode === StoryModeEnum.PREDATOR_VS_PREY
        ? true
        : presets.some((preset) => preset.storyMode === storyMode)
    ) ?? StoryModeEnum.MOTHER_BABY
  );
}

function findBestPreset(
  storyMode: StoryMode | undefined,
  presets: StoryModePreset[],
  preferredRecord?: ReelPerformanceRecord
): StoryModePreset | undefined {
  if (!storyMode || storyMode === StoryModeEnum.PREDATOR_VS_PREY) return undefined;

  const modePresets = presets.filter((preset) => preset.storyMode === storyMode);
  if (!modePresets.length) return undefined;

  const byId = preferredRecord?.presetId
    ? modePresets.find((preset) => preset.id === preferredRecord.presetId)
    : undefined;
  if (byId) return byId;

  const byName = preferredRecord?.presetName
    ? modePresets.find(
        (preset) => preset.name.toLowerCase() === preferredRecord.presetName?.toLowerCase()
      )
    : undefined;
  if (byName) return byName;

  return [...modePresets].sort((left, right) => {
    const leftScore =
      (preferredRecord?.habitatRegion === left.habitatRegion ? 2 : 0) +
      (preferredRecord?.viralLane === left.viralLane ? 1 : 0);
    const rightScore =
      (preferredRecord?.habitatRegion === right.habitatRegion ? 2 : 0) +
      (preferredRecord?.viralLane === right.viralLane ? 1 : 0);
    return rightScore - leftScore;
  })[0];
}

function buildAvoidList(records: ScoredRecord[], unsafeRecords: ReelPerformanceRecord[]): string[] {
  const avoid = new Set<string>();
  const recentWeak = [...records]
    .sort((a, b) => b.record.updatedAt.localeCompare(a.record.updatedAt))
    .filter((item) => item.score < 50)
    .slice(0, 3);

  for (const item of recentWeak) {
    avoid.add(
      `Avoid repeating ${labelForStoryMode(item.record.storyMode)} until the hook or retention improves.`
    );
  }

  for (const record of unsafeRecords.slice(0, 2)) {
    avoid.add(
      `Avoid unsafe wording from saved record ${record.presetName ?? record.generationId}.`
    );
  }

  return Array.from(avoid).slice(0, 4);
}

function buildTestIdeas(
  storyMode: StoryMode,
  preset: StoryModePreset | undefined,
  bestRecord: ReelPerformanceRecord | undefined
): string[] {
  const modeLabel = labelForStoryMode(storyMode);
  const subjectLine = preset
    ? `${preset.subjectA} + ${preset.subjectB}`
    : [bestRecord?.subjectA, bestRecord?.subjectB].filter(Boolean).join(" + ") || modeLabel;

  return [
    preset
      ? `Test preset: ${preset.name} with a stronger first-frame hook.`
      : `Test ${modeLabel} manually from USA Story Mode Presets.`,
    `Use a ${HOOK_STYLE_BY_MODE[storyMode]} hook around ${subjectLine}.`,
    "Keep the ending unresolved enough to invite replay without engagement bait.",
  ];
}

function buildReasons(
  status: AutoRecommendationStatus,
  scoredRecords: ScoredRecord[],
  storyMode: StoryMode,
  preset: StoryModePreset | undefined
): string[] {
  const insights = buildPerformanceInsights(scoredRecords.map((item) => item.record));
  const reasons = [
    status === "ready"
      ? `Based on ${scoredRecords.length} safe saved performance records.`
      : `Using fallback USA Story Mode Presets until at least 3 safe performance records are saved.`,
    `Next best mode: ${labelForStoryMode(storyMode)}.`,
  ];

  if (preset) {
    reasons.push(`Recommended preset: ${preset.name}.`);
  }

  if (insights.bestStoryMode) {
    reasons.push(
      `Best learned story-mode signal so far: ${insights.bestStoryMode.label} at ${insights.bestStoryMode.averageScore}/100.`
    );
  }

  return reasons.slice(0, 4);
}

function buildWarnings(input: AutoRecommendationInput, unsafeCount: number): string[] {
  const warnings: string[] = [];
  const recordCount = input.savedRecords.length;

  if (recordCount < 3) {
    warnings.push("Save at least 3 Reel performance records to move from learning to ready.");
  }

  if (unsafeCount > 0) {
    warnings.push(`${unsafeCount} unsafe saved record${unsafeCount === 1 ? " was" : "s were"} ignored.`);
  }

  if (input.facebookScore?.status === "risky") {
    warnings.push("Current Facebook Reels Optimizer status is risky; review safety and format before scaling.");
  }

  if (input.storyModeQA?.status === "unsafe") {
    warnings.push("Current Story Mode QA is unsafe; do not reuse its wording as a recommendation source.");
  }

  return warnings;
}

export function buildAutoRecommendations(
  input: AutoRecommendationInput
): AutoRecommendationResult {
  const presets = input.storyModePresets ?? USA_STORY_MODE_PRESETS;
  const unsafeRecords = input.savedRecords.filter(isUnsafeRecord);
  const scoredSafeRecords = input.savedRecords
    .filter((record) => !isUnsafeRecord(record))
    .map(scoreRecord)
    .sort((a, b) => b.priorityScore - a.priorityScore || b.record.updatedAt.localeCompare(a.record.updatedAt));

  const status: AutoRecommendationStatus =
    input.savedRecords.length === 0
      ? "needs-more-data"
      : scoredSafeRecords.length < 3
        ? "learning"
        : "ready";

  const bestRecord = scoredSafeRecords[0]?.record;
  const bestMode = status === "ready" ? getBestMode(scoredSafeRecords) : undefined;
  const storyMode = bestMode ?? chooseFallbackMode(presets);
  const preset = findBestPreset(storyMode, presets, bestRecord);
  const confidence = clampScore(
    status === "ready"
      ? 62 + Math.min(28, scoredSafeRecords.length * 4) + (scoredSafeRecords[0]?.priorityScore ?? 0) * 0.1
      : status === "learning"
        ? 42 + scoredSafeRecords.length * 8
        : 34
  );

  return {
    status,
    confidence,
    nextBestStoryMode: storyMode,
    nextBestPresetId: preset?.id,
    nextBestPresetName: preset?.name,
    nextBestViralLane: preset?.viralLane ?? bestRecord?.viralLane,
    nextBestHabitatRegion: preset?.habitatRegion ?? bestRecord?.habitatRegion,
    recommendedHookStyle: HOOK_STYLE_BY_MODE[storyMode],
    recommendedCaptionStyle: CAPTION_STYLE_BY_MODE[storyMode],
    recommendedSubjects: {
      subjectA: preset?.subjectA ?? bestRecord?.subjectA,
      subjectB: preset?.subjectB ?? bestRecord?.subjectB,
    },
    avoidList: buildAvoidList(scoredSafeRecords, unsafeRecords),
    testIdeas: buildTestIdeas(storyMode, preset, bestRecord),
    reasons: buildReasons(status, scoredSafeRecords, storyMode, preset),
    warnings: buildWarnings(input, unsafeRecords.length),
  };
}
