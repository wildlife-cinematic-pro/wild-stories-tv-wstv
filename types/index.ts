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

export type WildlifeScopeMode = "USA Wildlife" | "World Wildlife";

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
export type AIProvider = "none" | "claude" | "gemini";
export type RunwayModel = "Gen-4.5" | "Gen-4 Turbo" | "Gen-4";
export type KlingModel =
  | "Kling 3.0 Pro"
  | "Kling 3.0 Standard"
  | "Kling 2.6 Pro"
  | "Kling 2.5 Turbo Pro"
  | "Kling 2.5 Turbo";
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

export type DurationLane = "short" | "medium" | "long";
export type PipelineStyle = "4-shot" | "long-hybrid-4-shot";

export type HookFamily = "danger" | "curiosity" | "reversal";

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

export type PerformanceTrackerEntry = {
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
  firstHourViews: number | "";
  threeSecondHoldRate: number | "";
  averageWatchTimeSeconds: number | "";
  completionRate: number | "";
  usaFollowerPercent: number | "";
  earningsUsd: number | "";
  notes: string;
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
  wildlifeScopeMode: WildlifeScopeMode;
  contentLane: ContentLane;
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
  variant?: "single-shot" | "multi-shot" | "hybrid" | "native-10s" | "six-shot";
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
  runwayShots?: StructuredPrompt[];
  klingShots?: StructuredPrompt[];
  seedanceShots?: StructuredPrompt[];
  seedanceMultiShot?: StructuredPrompt;
  workflowShots?: StructuredPrompt[];
  klingNative15s?: StructuredPrompt;
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
  hashtags: string;
  tags?: string;
  cmpNote: string;
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
  environmentName?: string;
  weatherName?: Weather;
  cameraAnglePreset?: CameraAnglePreset;
  generationId?: string;
  generatedAt?: string;

  // ── Kling multi-shot (old pro) ──
  klingNative15s?: string;
  klingSixShot?: string;

  // ── Hooks & copy ──
  hook: string;
  hook2026: string[];
  recommendedHookIndex?: number;
  caption: string;
  caption2026: string;
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

export type CapCutScript = {
  totalDuration: string;
  aspectRatio: string;
  fps: number;
  beats: CapCutBeat[];
  exportSettings: string;
  musicMood: string;
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
