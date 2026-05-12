// ─────────────────────────────────────────────────────────────
// types/index.ts
// AI Wildlife Cinematic Director — All TypeScript Types
//
// Single source of truth for every type used across:
//   lib/, components/, and page.tsx
//
// Import pattern:
//   import type { GeneratedPackage, Arc, Weather } from "@/types";
// ─────────────────────────────────────────────────────────────

export type { MediaAnalysisPayload as MediaAnalysisResult } from "@/lib/schemas";

// ─────────────────────────────────────────────────────────────
// PRIMITIVE / UNION TYPES
// ─────────────────────────────────────────────────────────────
export type DepthMode =
  | "Cinematic Blur"
  | "Balanced Depth"
  | "Detailed Background";

export type Weather =
  | "Golden Hour"
  | "Storm"
  | "Overcast"
  | "Dawn"
  | "Midday Heat"
  | "Winter Blizzard"
  | "Frozen Dusk";

export type HabitatPreset =
  | "Auto"
  | "Open Prairie Grassland"
  | "Dry Prairie Plain"
  | "Everglades Marsh"
  | "Riverbank Reeds"
  | "Forest Clearing"
  | "Cypress Swamp Edge"
  | "Rocky Mountain Meadow"
  | "Snow Field Tundra"
  | "Desert Scrubland"
  | "Coastal Cliffline";

export type ContentLane =
  | "Auto"
  | "Pack Hunt"
  | "Defender"
  | "Fishing Strike"
  | "Rut Battle"
  | "Escape";

export type CameraAnglePreset =
  | "Auto"
  | "Front full-body"
  | "Side profile"
  | "Low-angle power"
  | "Over-the-shoulder"
  | "Overhead"
  | "Waterline"
  | "Ground-level tension";

export type WildlifeScopeMode =
  | "USA Wildlife"
  | "USA / Canada Wildlife"
  | "USA Viral Wildlife"
  | "Europe Wildlife"
  | "Norway / Scandinavia Wildlife"
  | "Australia Wildlife"
  | "Global Viral Wildlife"
  | "Low Drift First Test"
  | "World Wildlife"
  | "World Wide Wildlife";

export type EmotionalTone =
  | "Raw Tension"
  | "Silent Dread"
  | "Explosive Energy"
  | "Calm Dominance"
  | "Desperate Survival"
  | "Haunting Stillness"
  | "Primal Instinct";

export type AnimalVibe =
  | "BBC Earth Documentary"
  | "National Geographic Wild"
  | "Raw Nature Unfiltered"
  | "David Attenborough Style"
  | "Slow Motion Nature";

// ── Arc (story arc) ──
export type Arc =
  | "Ambush attack"
  | "Predator vs predator fight"
  | "Chase and takedown"
  | "Escape from danger"
  | "Territory dominance battle"
  | "Pack hunting strategy"
  | "Defender stands ground"
  | "Giant vs giant clash";

export type Engine = "RUNWAY" | "KLING";
export type AIProvider =
  | "none"
  | "gemini"
  | "claude"
  | "openai"
  | "groq"
  | "openrouter"
  | "huggingface";
export type RunwayModel = "Gen-4.5" | "Gen-4 Turbo" | "Gen-4";
export type KlingModel =
  | "Kling 3.0 Pro"
  | "Kling 3.0 Standard"
  | "Kling 2.6 Pro"
  | "Kling 2.5 Turbo Pro"
  | "Kling 2.5 Turbo";

export type VideoModelProviderGroup =
  | "RUNWAY_NATIVE"
  | "RUNWAY_THIRD_PARTY"
  | "KLING_DIRECT"
  | "SEEDANCE_DIRECT";

export type VideoModelProvider = "Runway" | "Kling" | "Seedance";

export type VideoModelWorkflowRole =
  | "hybrid-runway"
  | "third-party-runway"
  | "direct-kling"
  | "direct-seedance";

export type VideoModelInputMode =
  | "text-to-video"
  | "image-to-video"
  | "first-last-frame"
  | "reference-image"
  | "video-editing"
  | "motion-control";

export type VideoModelTier = "low" | "medium" | "high" | "premium";

export type VideoModelCapability = {
  id: string;
  label: string;
  providerGroup: VideoModelProviderGroup;
  provider: VideoModelProvider;
  workflowRole: VideoModelWorkflowRole;
  supportedInputModes: VideoModelInputMode[];
  recommendedUse: string;
  wildlifeUseCase: string;
  official: string[];
  house: string[];
  needsVerification: boolean;
  costTier: VideoModelTier;
  speedTier: VideoModelTier;
  realismTier: VideoModelTier;
  actionTier: VideoModelTier;
  promptGuidance: string[];
};

export type SelectedVideoModelInfo = {
  id: string;
  label: string;
  providerGroup: VideoModelProviderGroup;
  provider: VideoModelProvider;
  workflowRole: VideoModelWorkflowRole;
  routeLabel: string;
  recommendedUse: string;
  needsVerification: boolean;
};

export type PrimaryVideoRouteInfo = {
  kind:
    | "hybrid"
    | "seedance-direct"
    | "runway-third-party"
    | "aleph-edit"
    | "runway-native"
    | "kling-direct";
  label: string;
  detail: string;
  workspaceTab: "hybrid" | "seedance" | "runway" | "kling";
  hybridProtected: boolean;
  selectedVideoModel?: SelectedVideoModelInfo;
};
// types/index.ts (ADD near other shared types)
// Legacy values are preserved for compatibility, but runtime image prompting
// is now centered on the Nano Banana / Gemini path.
export type ImagePromptTarget = "MJ" | "NB2" | "RUNWAY" | "NANO_BANANA_2";
export type ImagePromptEngine =
  | "MJ"
  | "NB2"
  | "NANO_BANANA_2"
  | "FLUX"
  | "RUNWAY";

export type VeoModel = "Veo 3.1";
export type PlatformTarget =
  | "facebook"
  | "instagram"
  | "tiktok"
  | "youtube_shorts";
export type RealismMode = "Balanced" | "High Naturalism" | "Reference Locked";
export type FiveShotStyle = "cinematic" | "viral";

export enum StoryMode {
  PREDATOR_VS_PREY = "PREDATOR_VS_PREY",
  HERD_DEFENSE = "HERD_DEFENSE",
  MOTHER_BABY = "MOTHER_BABY",
  RIVAL_CLASH = "RIVAL_CLASH",
  NEAR_MISS = "NEAR_MISS",
  FISHING_STRIKE = "FISHING_STRIKE",
  WEATHER_SURVIVAL = "WEATHER_SURVIVAL",
  MIGRATION = "MIGRATION",
  SCAVENGER_CONFLICT = "SCAVENGER_CONFLICT",
}

export enum EncounterMode {
  FIRST_CONTACT = "FIRST_CONTACT",
  PEAK_TENSION = "PEAK_TENSION",
  ESCALATION = "ESCALATION",
  RESOLUTION = "RESOLUTION",
  AFTERMATH = "AFTERMATH",
}

export enum EndingMode {
  ESCAPE = "ESCAPE",
  STANDOFF = "STANDOFF",
  DOMINANT_WIN = "DOMINANT_WIN",
  UNRESOLVED = "UNRESOLVED",
  PROTECTED_EXIT = "PROTECTED_EXIT",
  SEASONAL_DEPARTURE = "SEASONAL_DEPARTURE",
}

export enum ViralLane {
  TENSION = "TENSION",
  TENDERNESS = "TENDERNESS",
  AWE = "AWE",
  POWER = "POWER",
  UNDERDOG = "UNDERDOG",
  SURVIVAL = "SURVIVAL",
  SPECTACLE = "SPECTACLE",
}

export enum HabitatRegion {
  YELLOWSTONE = "YELLOWSTONE",
  ALASKA = "ALASKA",
  GREAT_PLAINS = "GREAT_PLAINS",
  PACIFIC_NORTHWEST = "PACIFIC_NORTHWEST",
  EVERGLADES = "EVERGLADES",
  ROCKY_MOUNTAINS = "ROCKY_MOUNTAINS",
  APPALACHIA = "APPALACHIA",
  SOUTHWEST_DESERT = "SOUTHWEST_DESERT",
  COASTAL_WETLANDS = "COASTAL_WETLANDS",
}

export enum ViolenceLevel {
  DISPLAY_ONLY = 1,
  IMPLIED_PRESSURE = 2,
  NON_GRAPHIC_STRUGGLE = 3,
}

export type OffspringLabel = "cub" | "fawn" | "calf" | "pup" | "kit";
export type StrikeMethod = "POUNCE" | "DIVE" | "SWIPE" | "CHASE" | "AMBUSH";
export type EscapeDirection = "WATER" | "UPHILL" | "BRUSH" | "OPEN_FIELD";
export type WeatherHazard = "BLIZZARD" | "ICE" | "FLOOD" | "DROUGHT" | "HEAT";
export type Season = "SPRING" | "SUMMER" | "FALL" | "WINTER" | "MIGRATION_SEASON";
export type TimeOfDay =
  | "DAWN"
  | "GOLDEN_HOUR"
  | "MIDDAY"
  | "DUSK"
  | "BLUE_HOUR"
  | "NIGHT";

export type DurationLane = "short" | "medium" | "long";
export type PipelineStyle = "4-shot" | "long-hybrid-4-shot";

export type HookFamily = "danger" | "curiosity" | "reversal";
export type ActionStylePreset =
  | "Natural tension"
  | "Viral chase"
  | "Close-contact fight"
  | "Ambush burst"
  | "Forced retreat";

export type OpeningFrameScore = {
  total: number;
  summary: string;
};

export type USAudienceScoreResult = {
  total: number;
  speciesScore: number;
  environmentScore: number;
  arcScore: number;
  summary: string;
};

export type PublishGuardReport = {
  isPass: boolean;
  pass?: boolean;
  warnings: string[];
  blockers?: string[];
  fixes?: string[];
  summary?: string;
};

export type PerformanceSnapshot = {
  durationLane: DurationLane;
  hookFamily: HookFamily;
  sampleSize: number;
  averageWatchTimeSeconds: number;
  completionRate: number;
  shareRate: number;
  summary: string;
};

export type ReelPerformanceRecord = {
  id: string;
  generationId: string;
  createdAt: string;
  updatedAt: string;
  postedAt?: string;
  storyMode?: StoryMode;
  viralLane?: ViralLane;
  habitatRegion?: HabitatRegion;
  subjectA?: string;
  subjectB?: string;
  presetId?: string;
  presetName?: string;
  hookUsed?: string;
  captionUsed?: string;
  hashtagsUsed?: string[];
  views: number;
  threeSecondViews?: number;
  averageWatchTimeSeconds?: number;
  durationSeconds?: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  followsGained?: number;
  notes?: string;
};

export type ReelPerformanceInsight = {
  score: number;
  retentionRate?: number;
  engagementRate?: number;
  shareRate?: number;
  followRate?: number;
  status: "winner" | "solid" | "needs-work" | "weak";
  strengths: string[];
  fixes: string[];
};


export type ABExperimentVariantRecord = {
  label: "A" | "B" | "C";
  hook: string;
  caption: string;
  hashtags: string[];
  testFocus: string;
  expectedSignal: string;
  views?: number;
  threeSecondViews?: number;
  averageWatchTimeSeconds?: number;
  durationSeconds?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  followsGained?: number;
  notes?: string;
};

export type ABExperimentRecord = {
  id: string;
  generationId: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  hypothesis: string;
  storyMode?: StoryMode;
  viralLane?: ViralLane;
  habitatRegion?: HabitatRegion;
  subjectA?: string;
  subjectB?: string;
  presetId?: string;
  presetName?: string;
  variants: ABExperimentVariantRecord[];
  winnerLabel?: "A" | "B" | "C";
  status: "planned" | "running" | "completed";
};

export type PerformanceTrackerEntry = {
  recordId?: string;
  source?: "manual" | "facebook_csv";
  generationId?: string;
  contentId?: string;
  postUrl?: string;
  title?: string;
  conceptLabel?: string;
  publishedAt?: string;
  postedAtJST: string;
  postedAtEST: string;
  animalPair: string;
  predator: string;
  prey: string;
  habitat: string;
  arc: Arc | "";
  durationLane: DurationLane;
  hookFamily: HookFamily | "";
  contentLane: ContentLane | "";
  reach?: number | "";
  views?: number | "";
  firstHourViews: number | "";
  threeSecondViews?: number | "";
  threeSecondHoldRate: number | "";
  oneMinuteViews?: number | "";
  averageWatchTimeSeconds: number | "";
  watchPercentage?: number | "";
  completionRate: number | "";
  shares?: number | "";
  comments?: number | "";
  reactions?: number | "";
  followsGained?: number | "";
  profileVisits?: number | "";
  linkClicks?: number | "";
  usaFollowerPercent: number | "";
  earningsUsd: number | "";
  estimatedEarnings?: number | "";
  rpm?: number | "";
  monetizedPlays?: number | "";
  notes: string;
};

export type MonetizedFacebookScores = {
  revenuePotentialScore: number;
  adSafeConflictScore: number;
  sponsorFitScore: number;
  repeatViewerScore: number;
  followerConversionScore: number;
  boostWorthyScore: number;
};

export type MonetizedFacebookVerdict =
  | "Monetized Winner"
  | "Viral But Risky"
  | "Safe Growth Candidate"
  | "Needs Packaging Fix"
  | "Do Not Boost";

export type MonetizedFacebookBoostRecommendation = {
  shouldBoost: boolean;
  label: "Boost this post" | "Do not boost yet";
  reason: string;
};

export type MonetizedFacebookPromptRecommendation = {
  label: string;
  packageText: string;
  reason: string;
};

export type ActualFacebookPerformanceBand =
  | "Breakout"
  | "Strong"
  | "Average"
  | "Weak"
  | "Insufficient data";

export type ActualFacebookPerformanceScores = {
  actualPerformanceScore: number;
  actualRevenueScore: number;
  actualEngagementScore: number;
  actualRetentionScore: number;
  actualFollowerConversionScore: number;
  band: ActualFacebookPerformanceBand;
};

export type CsvGrowthDoctorFindingId =
  | "best-performing"
  | "worst-retention"
  | "highest-rpm"
  | "most-shareable"
  | "best-follower-conversion"
  | "low-reach-high-rpm"
  | "high-reach-low-earnings"
  | "high-retention-low-follows"
  | "high-comments-low-shares"
  | "weak-first-three-seconds";

export type CsvGrowthDoctorFinding = {
  id: CsvGrowthDoctorFindingId;
  label: string;
  record: PerformanceTrackerEntry | null;
  keyMetric: string;
  diagnosis: string;
  recommendedAction: string;
};

export type CsvGrowthDoctorSummary = {
  importedRecordCount: number;
  findings: CsvGrowthDoctorFinding[];
  bestPerformingPost: CsvGrowthDoctorFinding | null;
  worstRetentionPost: CsvGrowthDoctorFinding | null;
  highestRpmPost: CsvGrowthDoctorFinding | null;
  mostShareablePost: CsvGrowthDoctorFinding | null;
  bestFollowerConversionPost: CsvGrowthDoctorFinding | null;
  lowReachHighRpmCandidate: CsvGrowthDoctorFinding | null;
  highReachLowEarningsIssue: CsvGrowthDoctorFinding | null;
  highRetentionLowFollowersIssue: CsvGrowthDoctorFinding | null;
  highCommentsLowSharesIssue: CsvGrowthDoctorFinding | null;
  weakFirstThreeSecondsIssue: CsvGrowthDoctorFinding | null;
  biggestIssue: CsvGrowthDoctorFinding | null;
  boostCandidates: CsvGrowthDoctorFinding[];
  rewriteRecommendations: string[];
};

export type GrowthDoctorActionPriority = "high" | "medium" | "low";

export type GrowthDoctorActionEngineTarget =
  | "Runway"
  | "Kling"
  | "Seedance"
  | "Facebook copy"
  | "Publishing";

export type GrowthDoctorRewriteVariant = {
  label: string;
  engineTarget: GrowthDoctorActionEngineTarget;
  promptRewrite: string;
  captionRewrite?: string;
};

export type GrowthDoctorRemixAction = {
  id: string;
  sourceFindingId: CsvGrowthDoctorFindingId;
  sourceFindingLabel: string;
  title: string;
  diagnosis: string;
  whyItMatters: string;
  recommendedAction: string;
  priority: GrowthDoctorActionPriority;
  nextStep: string;
  variant: GrowthDoctorRewriteVariant;
};

export type GrowthDoctorActionPlan = {
  importedRecordCount: number;
  actionCount: number;
  generatedLocally: boolean;
  actions: GrowthDoctorRemixAction[];
};

export type MonetizedFacebookPerformanceTier =
  | "Insufficient data"
  | "Weak"
  | "Average"
  | "Strong"
  | "Breakout";

export type PredictedVsActualStatus =
  | "overperformed"
  | "matched"
  | "underperformed"
  | "insufficient-data";

export type PredictedVsActualMetricComparison = {
  label: string;
  predictedScore: number;
  actualScore: number;
  status: PredictedVsActualStatus;
  likelyReason: string;
  nextRecommendation: string;
};

export type WinnerRemixRecommendation = {
  label: string;
  reason: string;
};

export type MonetizedFacebookReport = {
  scores: MonetizedFacebookScores;
  actualScores: ActualFacebookPerformanceScores;
  verdict: MonetizedFacebookVerdict;
  summary: string;
  boostRecommendation: MonetizedFacebookBoostRecommendation;
  actualPerformanceTier: MonetizedFacebookPerformanceTier;
  predictedVsActual: {
    overall: PredictedVsActualMetricComparison;
    shareIntent: PredictedVsActualMetricComparison;
    commentDepthIntent: PredictedVsActualMetricComparison;
    monetisationSafety: PredictedVsActualMetricComparison;
    ownedFunnelConversionIntent: PredictedVsActualMetricComparison;
    revenuePotential: PredictedVsActualMetricComparison;
    boostWorthy: PredictedVsActualMetricComparison;
  };
  promptRecommendations: {
    bestViralVersion: MonetizedFacebookPromptRecommendation;
    bestMonetizedSafeVersion: MonetizedFacebookPromptRecommendation;
    bestSponsorSafeVersion: MonetizedFacebookPromptRecommendation;
  };
  winnerRemixRecommendations: WinnerRemixRecommendation[];
  improvementNotes: string[];
};

export type USViewsModeReport = {
  durationLane: DurationLane;
  hookFamily: HookFamily;
  audienceScore: USAudienceScoreResult;
  openingFrameScore: OpeningFrameScore;
  publishGuard: PublishGuardReport;
  performanceSnapshot?: PerformanceSnapshot;
  shouldPublish: boolean;
  summary: string;
  nextActions: string[];
};

export type ConceptVariantWinnerTag =
  | "best-overall"
  | "best-fast-publish"
  | "strongest-opening"
  | "best-strongest-opening"
  | "best-realism";

export type ConceptVariantEmphasis = "balanced" | "fast-publish" | "cinematic";

export type PublishCleanupField = "hook" | "caption" | "hashtags" | "cta";

export type ConceptVariantPublishCleanup = {
  applied: boolean;
  changedFields: PublishCleanupField[];
  summary: string;
  notes: string[];
  warningsResolved: number;
  remainingWarnings: number;
};

export type ConceptVariantLabEntry = {
  id: string;
  label: string;
  summary: string;
  hookFamily: HookFamily;
  arc: Arc;
  habitat: HabitatPreset;
  finalEnvironment: string;
  durationLane: DurationLane;
  fastPublishMode: boolean;
  pipelineStyle: PipelineStyle;
  emphasis: ConceptVariantEmphasis;
  sceneDescription: string;
  sceneDescriptionVariant: number;
  primaryHook: string;
  caption: string;
  hashtags: string;
  usAudienceScore: USAudienceScoreResult;
  openingFrameScore: OpeningFrameScore;
  publishGuardReport: PublishGuardReport;
  performanceSnapshot?: PerformanceSnapshot;
  predatorPreyFitScore: number;
  habitatFitScore: number;
  arcFitScore: number;
  laneFitScore: number;
  realismFitScore: number;
  fitScore: number;
  overallScore: number;
  publishWorthy: boolean;
  winnerTags: ConceptVariantWinnerTag[];
  publishCleanup?: ConceptVariantPublishCleanup;
};

export type ConceptVariant = ConceptVariantLabEntry;

export type ConceptVariantLabWinners = {
  bestOverallId?: string;
  bestFastPublishId?: string;
  bestStrongestOpeningId?: string;
  bestRealismId?: string;
};

export type PackageLockKey =
  | "hook"
  | "caption"
  | "hashtags"
  | "sceneDescription"
  | "masterImagePrompt"
  | "thumbnailPrompt"
  | "runwayPrompts"
  | "klingPrompts"
  | "seedancePrompts"
  | "twoPartViralPreset"
  | "capCutScript";

export type PackageLockState = Record<PackageLockKey, boolean>;

export type BuildWorkflowPresetSnapshot = {
  predator: string;
  prey: string;
  storyMode?: StoryMode;
  encounterMode?: EncounterMode;
  endingMode?: EndingMode;
  viralLane?: ViralLane;
  violenceLevel?: ViolenceLevel;
  habitatRegion?: HabitatRegion;
  subjectA?: string;
  subjectB?: string;
  groupCount?: number;
  offspringLabel?: OffspringLabel;
  strikeMethod?: StrikeMethod;
  escapeDirection?: EscapeDirection;
  weatherHazard?: WeatherHazard;
  rutSeason?: boolean;
  foodItem?: string;
  season?: Season;
  timeOfDay?: TimeOfDay;
  wildlifeScopeMode: WildlifeScopeMode;
  contentLane: ContentLane;
  actionStyle: ActionStylePreset;
  cameraAnglePreset: CameraAnglePreset;
  arc: Arc;
  habitat: HabitatPreset;
  weather: Weather;
  durationLane: DurationLane;
  fastPublishMode: boolean;
  strictOriginalityGuard: boolean;
  hookMode: HookFamily | "all";
  depthMode: DepthMode;
  emotionalTone: EmotionalTone;
  animalVibe: AnimalVibe;
  realismMode: RealismMode;
  motionOnlyI2V: boolean;
  referenceLock: boolean;
  singleActionRule: boolean;
  microMotion: boolean;
  heroVeo: boolean;
  autoApplyHighDrift: boolean;
  selectedVideoModelId?: string;
  selectedVideoProviderGroup?: VideoModelProviderGroup;
  autoSelectRecommendedVideoModel?: boolean;
  runwayModel: RunwayModel;
  klingModel: KlingModel;
  activeProvider: AIProvider;
  sceneDescriptionMode: "auto" | "manual";
  sceneDescription: string;
  sceneDescriptionTouched: boolean;
};

export type SavedWorkflowPreset = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  snapshot: BuildWorkflowPresetSnapshot;
};

export type SavedWorkflowPresetPack = {
  id: string;
  name: string;
  description: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  presets: SavedWorkflowPreset[];
};

export type WorkflowPresetExportPayload = {
  schema: "wstv.workflow-presets";
  version: 1;
  source: "wild-stories-tv-wstv";
  exportedAt: string;
  defaultPresetId?: string;
  presets: SavedWorkflowPreset[];
  metadata: {
    presetCount: number;
  };
};

export type WorkflowPresetImportReport = {
  presets: SavedWorkflowPreset[];
  importedPresets: SavedWorkflowPreset[];
  importedCount: number;
  skippedCount: number;
  renamedCount: number;
  regeneratedIdCount: number;
  defaultPresetId?: string;
  warnings: string[];
};

export type WorkflowPresetPackExportPayload = {
  schema: "wstv.workflow-preset-pack";
  version: 1;
  source: "wild-stories-tv-wstv";
  exportedAt: string;
  pack: SavedWorkflowPresetPack;
  metadata: {
    presetCount: number;
    tags: string[];
  };
};

export type WorkflowPresetPackImportReport = {
  packs: SavedWorkflowPresetPack[];
  importedPack?: SavedWorkflowPresetPack;
  importedCount: number;
  skippedCount: number;
  renamedCount: number;
  regeneratedIdCount: number;
  warnings: string[];
};

export type WorkflowPresetCloudSyncState =
  | "local-only"
  | "authenticating"
  | "syncing"
  | "synced"
  | "conflict-resolved"
  | "sync-error";

export type WorkflowPresetLibraryRole = "owner" | "editor" | "viewer";
export type WorkflowPresetLibraryScope = "personal" | "shared";

export type CloudPresetLibrary = {
  schema: "wstv.workflow-preset-library";
  version: 2;
  source: "wild-stories-tv-wstv";
  libraryId: string;
  updatedAt: string;
  defaultPresetId?: string;
  presets: SavedWorkflowPreset[];
  presetPacks: SavedWorkflowPresetPack[];
};

export type CloudPresetLibraryMergeReport = {
  library: CloudPresetLibrary;
  presetConflictCount: number;
  presetRenameCount: number;
  packConflictCount: number;
  packRenameCount: number;
  conflictResolved: boolean;
  usedCloudDefault: boolean;
};

export type WorkflowPresetAuthUser = {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
};

export type WorkflowPresetAuthSession = {
  user: WorkflowPresetAuthUser;
  issuedAt: string;
  expiresAt: string;
};

export type WorkflowPresetSharedLibraryMember = {
  userId: string;
  email: string;
  role: WorkflowPresetLibraryRole;
  addedAt: string;
};

export type WorkflowPresetSharedLibraryStoredRecord = {
  id: string;
  scope: "shared";
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  ownerUserId: string;
  members: WorkflowPresetSharedLibraryMember[];
  data: CloudPresetLibrary;
};

export type WorkflowPresetLibraryRecord = {
  id: string;
  scope: WorkflowPresetLibraryScope;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  role: WorkflowPresetLibraryRole;
  canWrite: boolean;
  canManage: boolean;
  ownerUserId?: string;
  members?: WorkflowPresetSharedLibraryMember[];
  data: CloudPresetLibrary;
};

export type WorkflowPresetLibraryCatalog = {
  personalLibrary: WorkflowPresetLibraryRecord;
  sharedLibraries: WorkflowPresetLibraryRecord[];
};

// ─────────────────────────────────────────────────────────────
// PREDATOR
// ─────────────────────────────────────────────────────────────
export type PredatorInfo = {
  prey: string[];
  environment: string;
  lighting: string;
  cameraGear: string;
  texture: string;
  defaultArc: Arc;
  driftRisk: "LOW" | "MEDIUM" | "HIGH";
};

// ─────────────────────────────────────────────────────────────
// QUALITY OPTIONS
// ─────────────────────────────────────────────────────────────
export type QualityOptions = {
  realismMode: RealismMode;
  motionOnlyI2V: boolean;
  referenceLock: boolean;
  singleActionRule: boolean;
  microMotion: boolean;
  heroVeo: boolean;
  actionStyle?: ActionStylePreset;
  intensityMode?: boolean; // Slightly increases action energy and environmental response without sacrificing readability
  seamlessShot?: boolean; // Appends "Continuous, seamless shot" to Runway prompts
};

// ─────────────────────────────────────────────────────────────
// SHOT PLANS
// ─────────────────────────────────────────────────────────────
export type ShotPlan = {
  engine: Engine;
  title: string;
  prompt: string;
  motionStrength: number;
  why: string;
  durationLabel?: string;
  generationDurationLabel?: string;
  editTimelineLabel?: string;
};

export type ShotImagePlan = {
  title: string;
  source: "master" | "previous_image";
  prompt: string;
};

export type StructuredPromptMetadata = {
  engine?: "image" | "runway" | "kling" | "seedance";
  shotKey?: string;
  title?: string;
  motionIntensity?: number;
  durationSeconds?: number;
  variant?:
    | "single-shot"
    | "multi-shot"
    | "hybrid"
    | "native-10s"
    | "direct-15s-multishot"
    | "kling-frames"
    | "kling-multishot"
    | "six-shot";
  workflowRole?: string;
};

export type StructuredPrompt = {
  fullText: string;
  pasteReady: string;
  audio?: string;
  settings?: string[];
  metadata?: StructuredPromptMetadata;
};

export type StructuredPromptBundle = {
  imagePrompt?: StructuredPrompt;
  gptImage2Prompt?: StructuredPrompt;
  runwayShots?: StructuredPrompt[];
  klingShots?: StructuredPrompt[];
  seedanceShots?: StructuredPrompt[];
  seedanceMultiShot?: StructuredPrompt;
  workflowShots?: StructuredPrompt[];
  klingNative15s?: StructuredPrompt;
  klingFramesPrompt?: StructuredPrompt;
  klingMultishotShots?: StructuredPrompt[];
  klingSixShot?: StructuredPrompt;
};

export type ViralShotPlan = {
  shot1_closeup: string;
  shot2_standoff: string;
  shot3_clash: string;
  shot4_winner: string;
};

export type FiveShotPlan = {
  style: FiveShotStyle;
  shot1: string;
  shot2: string;
  shot3: string;
  shot4: string;
  shot5: string;
  totalDuration: string;
  watchTimeNote: string;
  captionTip: string;
};

// ─────────────────────────────────────────────────────────────
// PLATFORM PACKS
// ─────────────────────────────────────────────────────────────
export type HookFormattingPreset =
  | "species_first"
  | "documentary_tension"
  | "observational_question"
  | "short_pressure"
  | "two_line_opener";

export type HookOverlayVariant = {
  preset: HookFormattingPreset;
  label: string;
  text: string;
  lines: string[];
  note: string;
};

export type FacebookFirstFrameOverlayPreset =
  | "facebook_species_first"
  | "facebook_documentary_tension"
  | "facebook_short_pressure"
  | "facebook_observational_question"
  | "facebook_two_line_readable";

export type FacebookCoverFramePreset =
  | "species_pressure"
  | "species_question"
  | "conflict_statement"
  | "short_documentary"
  | "two_line_cover";

export type FacebookOverlayPreset = {
  preset: FacebookFirstFrameOverlayPreset;
  label: string;
  text: string;
  lines: string[];
  note: string;
};

export type FacebookCoverFrameTextPreset = {
  preset: FacebookCoverFramePreset;
  label: string;
  text: string;
  lines: string[];
  note: string;
};

export type FacebookFrameHeuristicLevel = "low" | "medium" | "high";
export type FacebookFrameSubjectFit = "strong" | "balanced" | "crowded";
export type FacebookFrameChoice = "species-first" | "tension-first";

export type FacebookFrameHeuristics = {
  speciesReadability: FacebookFrameHeuristicLevel;
  textAnimalCollisionRisk: FacebookFrameHeuristicLevel;
  silhouetteConflictRisk: FacebookFrameHeuristicLevel;
  leftRightSubjectFit: FacebookFrameSubjectFit;
  frame1Choice: FacebookFrameChoice;
  summary: string;
};

export type FacebookOverlayPresetScore = {
  preset: FacebookFirstFrameOverlayPreset;
  label: string;
  text: string;
  score: number;
  reason: string;
  frameHeuristics?: FacebookFrameHeuristics;
};

export type FacebookOverlayRecommendation = {
  recommended: FacebookOverlayPresetScore;
  alternatives: FacebookOverlayPresetScore[];
  reason: string;
};

export type FacebookCoverFramePresetScore = {
  preset: FacebookCoverFramePreset;
  label: string;
  text: string;
  score: number;
  reasons: string[];
  frameHeuristics?: FacebookFrameHeuristics;
};

export type FacebookCoverFrameRanking = {
  best: FacebookCoverFramePresetScore;
  ranked: FacebookCoverFramePresetScore[];
  reason: string;
};

export type FirstFrameOverlayGuidance = {
  placement: string;
  textLength: string;
  opener: string;
  audio: string;
  tone: string;
};

export type PlatformPostCommon = {
  bestTime: string;
  strategyNote?: string;
  overlayGuidance?: FirstFrameOverlayGuidance;
  hookFormattingPresets?: HookOverlayVariant[];
};

export type FacebookPack = PlatformPostCommon & {
  hook: string;
  caption: string;
  pinnedComment: string;
  hashtags: string;
  tags?: string;
  cmpNote: string;
  publishReminders?: string[];
  facebookOverlayPresets?: FacebookOverlayPreset[];
  facebookCoverFramePresets?: FacebookCoverFrameTextPreset[];
  facebookOverlayRecommendation?: FacebookOverlayRecommendation;
  facebookCoverFrameRanking?: FacebookCoverFrameRanking;
};

export type InstagramPack = PlatformPostCommon & {
  hook: string;
  caption: string;
  hashtags: string;
  tags?: string;
};

export type TikTokPack = PlatformPostCommon & {
  hook: string;
  caption: string;
  hashtags: string;
  tags?: string;
};

export type YouTubeShortsPack = PlatformPostCommon & {
  title: string;
  description: string;
  tags: string;
};

export type PlatformPack = {
  facebook: FacebookPack;
  instagram: InstagramPack;
  tiktok: TikTokPack;
  youtube_shorts: YouTubeShortsPack;
};

export type RealGenerationEvidenceRecommendation =
  | "keep"
  | "retry-with-fixes"
  | "retry";

export type RealGenerationEvidenceScores = {
  firstFrameReadability: number;
  spacingClarity: number;
  worldLightingContinuity: number;
  anatomyPhysicsRealism: number;
  actionReadability: number;
  facebookOpeningStrength: number;
};

export type RealGenerationEvidenceAttachmentSlot =
  | "master-still"
  | "runway-shot-1"
  | "kling-shot-2"
  | "kling-shot-3"
  | "runway-shot-4"
  | "seedance-output"
  | "thumbnail-cover";

export type RealGenerationEvidenceAttachmentMediaKind = "image" | "video";

export type RealGenerationEvidenceAttachment = {
  id: string;
  slot: RealGenerationEvidenceAttachmentSlot;
  mediaKind: RealGenerationEvidenceAttachmentMediaKind;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storedAt: string;
};

export type RealGenerationEvidenceNotes = {
  strongPoints: string;
  driftObserved: string;
  failedPoints: string;
  retryPlan: string;
  masterStill: string;
  runway: string;
  kling: string;
  seedance: string;
};

export type RealGenerationEvidenceRecord = {
  id: string;
  generationId: string;
  generationLabel: string;
  generatedAt?: string;
  capturedAt: string;
  predatorName: string;
  preyName: string;
  arcName: string;
  pipelineStyle?: PipelineStyle;
  scores: RealGenerationEvidenceScores;
  overallScore: number;
  suggestedRecommendation: RealGenerationEvidenceRecommendation;
  userRecommendation: RealGenerationEvidenceRecommendation;
  notes: RealGenerationEvidenceNotes;
  attachments?: RealGenerationEvidenceAttachment[];
};

// ─────────────────────────────────────────────────────────────
// GENERATED PACKAGE  (main output of buildPackage)
// ─────────────────────────────────────────────────────────────
export type GeneratedPackage = {
  // ── Core prompts ──
  imagePrompt: string;
  gptImage2Prompt?: string;
  negativePrompt: string;
  thumbnailPrompt: string;
  voiceoverLine: string;
  structuredPrompts?: StructuredPromptBundle;
  runwayShots: string[];
  klingShots: string[];
  seedanceShots?: string[];
  seedanceMultiShotPrompt?: string;
  seedanceWorkflowGuide?: string;
  veo3Shots?: string[];
  shotImagePlan?: ShotImagePlan[];
  motionStrength: number;
  capCutPlan: string;
  clipChaining: string;

  // ── Identity / context (calendar + routing helpers) ──
  predatorName?: string;
  preyName?: string;
  arcName?: Arc;
  wildlifeScopeMode?: WildlifeScopeMode;
  storyMode?: StoryMode;
  encounterMode?: EncounterMode;
  endingMode?: EndingMode;
  viralLane?: ViralLane;
  violenceLevel?: ViolenceLevel;
  habitatRegion?: HabitatRegion;
  season?: Season;
  timeOfDay?: TimeOfDay;
  subjectA?: string;
  subjectB?: string;
  groupCount?: number;
  offspringLabel?: OffspringLabel;
  strikeMethod?: StrikeMethod;
  escapeDirection?: EscapeDirection;
  weatherHazard?: WeatherHazard;
  rutSeason?: boolean;
  foodItem?: string;
  environmentName?: string;
  weatherName?: Weather;
  cameraAnglePreset?: CameraAnglePreset;
  generationId?: string;
  generatedAt?: string;

  // ── Kling multi-shot (old pro) ──
  klingNative15s?: string;
  klingFramesPrompt?: string;
  klingMultishotShots?: string[];
  klingSixShot?: string;

  // ── Hooks & copy ──
  hook: string;
  hook2026: string[];
  recommendedHookIndex?: number;
  caption: string;
  caption2026: string;
  pinnedComment?: string;
  cta: string;
  hashtags: string;
  tags?: string;
  tenIdeas: string[];

  // ── Shot routing ──
  shotPlan: ShotPlan[];
  runwayBundle: string;
  klingBundle: string;
  routingNote: string;

  // ── Platform & SEO ──
  platformPack?: PlatformPack;
  seoTitle?: string;
  altTextPrompt?: string;

  // ── Quality ──
  qualitySummary?: string;
  referenceWorkflow?: string;
  naturalismChecklist?: string[];
  videoPromptRule?: string;

  // ── Pipeline variants ──
  viralFourShot?: ViralShotPlan;
  fiveShotCinematic?: FiveShotPlan;
  fiveShotViral?: FiveShotPlan;
  watchTimeReport?: WatchTimeReport;
  isViralArc?: boolean;

  // ── AI & model info ──
  aiEnhanced?: boolean;
  modelsUsed?: { runway: RunwayModel; kling: KlingModel };
  selectedVideoModel?: SelectedVideoModelInfo;
  primaryVideoRoute?: PrimaryVideoRouteInfo;
  sceneDesc?: string;

  // ── Pro features ──
  viralScore?: ViralScore;
  capCutScript?: CapCutScript;
  soundDesignPack?: SoundDesignPack;
  animalBehavior?: AnimalBehavior;
  pipelineStyle?: PipelineStyle;

  // ── US views mode ──
  durationLane?: DurationLane;
  hookFamily?: HookFamily;
  usAudienceScore?: USAudienceScoreResult;
  openingFrameScore?: OpeningFrameScore;
  publishGuardReport?: PublishGuardReport;
  performanceSnapshot?: PerformanceSnapshot;
  usViewsModeReport?: USViewsModeReport;

  // ── Runway workflow ──
  runwayCameraPlan?: string;
  motionBrushPlan?: string;
  runwayWorkflowPack?: string;
  runwayStepGuide?: string;
  wstvImagePrompt?: string;
  wstvMotionPromptDraft?: string;
  wstvMotionPromptFinal?: string;

  // ── Two-part viral preset ──
  twoPartViralOverview?: string;
  twoPartWorkflowGuide?: string;
  twoPartPart1Hook?: string;
  twoPartPart1Caption?: string;
  twoPartPart1Draft?: string;
  twoPartPart1Final?: string;
  twoPartPart2Hook?: string;
  twoPartPart2Caption?: string;
  twoPartPart2Draft?: string;
  twoPartPart2Final?: string;
};

// ─────────────────────────────────────────────────────────────
// APP STATE
// ─────────────────────────────────────────────────────────────
export type PackageState =
  | { kind: "empty" }
  | { kind: "ideas"; tenIdeas: string[] }
  | { kind: "loading" }
  | { kind: "translating" }
  | { kind: "full"; data: GeneratedPackage };

export type HistoryEntry = {
  id: string;
  predator: string;
  prey: string;
  arc: string;
  weather: Weather;
  depthMode: DepthMode;
  timestamp: string;
  runwayModel?: RunwayModel;
  klingModel?: KlingModel;
  selectedVideoModelId?: string;
  selectedVideoProviderGroup?: VideoModelProviderGroup;
  autoSelectRecommendedVideoModel?: boolean;
  realismMode?: RealismMode;
  pkg?: GeneratedPackage;
};

export type ShareState = {
  predator: string;
  prey: string;
  arc: string;
  weather: Weather;
  depthMode: DepthMode;
  habitat: HabitatPreset;
  contentLane: ContentLane;
  cameraAnglePreset: CameraAnglePreset;
};

// ─────────────────────────────────────────────────────────────
// PRO FEATURE TYPES
// ─────────────────────────────────────────────────────────────
export type SavedPrompt = {
  id: string;
  label: string;
  predator: string;
  prey: string;
  arc: string;
  weather: Weather;
  timestamp: string;
  pkg: GeneratedPackage;
  tags: string[];
  rating: 1 | 2 | 3 | 4 | 5;
  notes: string;
  performanceViews?: number;
};

export type ViralScore = {
  total: number;
  hookScore: number;
  watchTimeScore: number;
  usaOptimizationScore: number;
  originalityScore: number;
  emotionalScore: number;
  breakdown: { label: string; score: number; tip: string }[];
  verdict: "🔥 Viral Potential" | "⭐ Good" | "✅ Decent" | "⚠️ Needs Work";
  topTip: string;
};

export type CapCutBeat = {
  timeIn: string;
  timeOut: string;
  shotRef: string;
  onScreenText: string;
  transition: string;
  sfx: string;
  musicNote: string;
};

export type CapCutGuideSection = {
  title: string;
  description?: string;
  uiPath?: string;
  items: string[];
};

export type CapCutEditGuide = {
  projectSetup: CapCutGuideSection;
  timelineEditing: CapCutGuideSection;
  keyframeZoom: CapCutGuideSection;
  colorAdjustment: CapCutGuideSection;
  audioMix: CapCutGuideSection;
  textOverlaySafeZone: CapCutGuideSection;
  coverThumbnail: CapCutGuideSection;
  exportSettings: CapCutGuideSection;
  uploadChecklist: CapCutGuideSection;
};

export type CapCutScript = {
  totalDuration: string;
  aspectRatio: string;
  fps: number;
  beats: CapCutBeat[];
  exportSettings: string;
  musicMood: string;
  editGuide?: CapCutEditGuide;
};

export type BulkItem = {
  id: string;
  predator: string;
  prey: string;
  arc: string;
  weather: Weather;
  status: "pending" | "generating" | "done" | "error";
  pkg?: GeneratedPackage;
};

export type PromptVersion = {
  version: number;
  timestamp: string;
  imagePrompt: string;
  hook: string;
  caption: string;
  voiceoverLine: string;
  label: string;
  performanceNote: string;
  pinned?: boolean; // ✅ NEW
};

export type AnimalBehavior = {
  preAttackSignals: string[];
  naturalMotion: string[];
  soundDesign: string[];
  bodyLanguage: string[];
  habitatFacts: string[];
  promptInjection: string;
};

export type SoundDesignPack = {
  shot1_ambient: string;
  shot1_animal: string;
  shot2_impact: string;
  shot2_animal: string;
  shot3_resolve: string;
  musicMood: string;
  klingAudioPrompt: string;
  capCutSFX: string[];
};

export type WatchTimeReport = {
  currentDuration: string;
  targetDuration: string;
  watchTimePerView: string;
  viewsNeededFor600k: number;
  daysToGoal: number;
  estimatedMonthlyEarnings: string;
  usaCPMNote: string;
  tipsToIncrease: string[];
};

export type OriginalityItem = {
  check: string;
  tip: string;
  critical: boolean;
  source: string;
};

export type EarningsEstimate = {
  views: number;
  minEarnings: string;
  maxEarnings: string;
  usaOptimized: string;
};

export type PostingDay = {
  day: string;
  slots: {
    zone: string;
    time: string;
    why: string;
    priority: "🔥" | "⭐" | "✅";
  }[];
};

export type CalendarDay = {
  day: number;
  dateLabel: string;
  weekday: string;
  reel1: { predator: string; prey: string; arc: string; hook: string; duration: string };
  reel2: { predator: string; prey: string; arc: string; hook: string; duration: string };
  theme: string;
  cmpNote: string;
};

export type TwoPartViralPreset = {
  overview: string;
  workflowGuide: string;
  part1Hook: string;
  part1Caption: string;
  part1Draft: string;
  part1Final: string;
  part2Hook: string;
  part2Caption: string;
  part2Draft: string;
  part2Final: string;
};

export type CustomPredatorForm = {
  name: string;
  prey: string;
  environment: string;
  defaultArc: Arc;
  driftRisk: "LOW" | "MEDIUM" | "HIGH";
};

export type RunwayNode = {
  id: string;
  label: string;
  type: "input" | "image" | "video" | "reference" | "audio" | "utility" | "export";
  creditFree: boolean;
  name: string;
  desc: string;
  io: string;
  settings: string;
  wire: string;
  tip: string;
};
