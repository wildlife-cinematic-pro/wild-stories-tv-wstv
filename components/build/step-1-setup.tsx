"use client";

import { useState, type ReactNode } from "react";

import QualityPanel, { type QualityPanelProps } from "@/components/QualityPanel";
import BestUsaViralSetupsPanel from "@/components/build/best-usa-viral-setups-panel";
import SceneRelationshipCard from "@/components/build/scene-relationship-card";
import MyWorkflowPresetsPanel from "@/components/build/my-workflow-presets-panel";
import SeasonalRealismAdvisorCard from "@/components/build/seasonal-realism-advisor-card";
import StoryModePresetsPanel from "@/components/build/story-mode-presets-panel";
import StoryModeSubjectFields, {
  buildStoryModeSetupSummary,
} from "@/components/build/story-mode-subject-fields";
import WildlifeStoryModeSelector from "@/components/build/wildlife-story-mode-selector";
import WorkflowPresetsPanel from "@/components/build/workflow-presets-panel";

import { WORKFLOW_TEST_PRESETS } from "@/lib/workflow-presets";
import type { RecommendedSeasonalSetup } from "@/lib/seasonal-realism-advisor";
import type { MyWorkflowPreset } from "@/lib/my-workflow-presets";
import type { StoryModePreset } from "@/lib/story-mode-presets";
import type { RankedStoryModeSetup } from "@/lib/story-mode-setup-ranking";
import {
  STORY_SETUP_TUNER_IDS,
  buildStorySetupTunerPatch,
  type StorySetupTunerId,
} from "@/lib/story-setup-tuners";
import { contentLaneOptions } from "@/lib/content-lanes";
import {
  cameraAnglePresetOptions,
  getCameraAnglePresetDefinition,
} from "@/lib/camera-angle-presets";
import {
  habitatOptions,
  depthModes,
  weatherOptions,
} from "@/lib/model-specs";
import {
  animalVibes,
  emotionalTones,
  wildlifeScopeOptions,
} from "@/lib/predator-data";
import {
  buildStep1FacebookRecommendation,
  getAnimalPairMicroGuidance,
  getAnimalVibeMicroGuidance,
  getArcMicroGuidance,
  getContentLaneMicroGuidance,
  getDepthModeMicroGuidance,
  getHabitatOverrideGuidance,
  getToneMicroGuidance,
  getWeatherMicroGuidance,
} from "@/lib/step-1-guidance";
import {
  buildSceneIntelligenceReport,
  buildScenePresetOptions,
} from "@/lib/scene-intelligence";
import {
  FACEBOOK_SAFE_SURVIVAL_HINT,
  getRegionalWildlifeStep1Hint,
  getWildlifeFocusPairingHighlights,
  getWildlifeFocusSafetyDefaults,
  getWildlifeFocusSafetyHint,
  getWildlifeHabitatCompatibilityGuidance,
  getWildlifeScopeHelperText,
  isAttackFocusedWildlifeScope,
} from "@/lib/wildlife-focus";

import { StoryMode } from "@/types";

import type {
  AnimalVibe,
  Arc,
  ActionStylePreset,
  CameraAnglePreset,
  ContentLane,
  DepthMode,
  DurationLane,
  EmotionalTone,
  EncounterMode,
  EndingMode,
  EscapeDirection,
  HabitatPreset,
  HabitatRegion,
  HookFamily,
  OffspringLabel,
  PredatorInfo,
  SavedWorkflowPreset,
  SavedWorkflowPresetPack,
  Season,
  StrikeMethod,
  TimeOfDay,
  ViralLane,
  ViolenceLevel,
  Weather,
  WeatherHazard,
  WildlifeScopeMode,
  WorkflowPresetAuthSession,
  WorkflowPresetCloudSyncState,
  WorkflowPresetLibraryRecord,
  WorkflowPresetLibraryRole,
} from "@/types";

const ACTION_STYLE_OPTIONS: ActionStylePreset[] = [
  "Natural tension",
  "Viral chase",
  "Close-contact fight",
  "Ambush burst",
  "Forced retreat",
];

type SummaryChipProps = {
  label: string;
  value: string;
  tone?: "neutral" | "cyan" | "amber" | "emerald" | "violet";
};

function SummaryChip({ label, value, tone = "neutral" }: SummaryChipProps) {
  const toneClass =
    tone === "cyan"
      ? "border-cyan-400/25 bg-cyan-500/10 text-cyan-100"
      : tone === "amber"
        ? "border-[#d9a94f]/30 bg-[#d9a94f]/12 text-[#f3c766]"
        : tone === "emerald"
          ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-100"
          : tone === "violet"
            ? "border-violet-400/25 bg-violet-500/10 text-violet-100"
            : "border-[#2d3d28] bg-[#071009] text-[#c9d2bd]";

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold leading-none ${toneClass}`}
    >
      <span className="shrink-0 uppercase tracking-[0.08em] opacity-60">
        {label}
      </span>
      <span className="truncate">{value}</span>
    </span>
  );
}

type CollapsibleControlSectionProps = {
  title: string;
  eyebrow: string;
  helper: string;
  badge: string;
  isOpen: boolean;
  onToggle: () => void;
  summary: ReactNode;
  children: ReactNode;
};

function CollapsibleControlSection({
  title,
  eyebrow,
  helper,
  badge,
  isOpen,
  onToggle,
  summary,
  children,
}: CollapsibleControlSectionProps) {
  return (
    <section className="rounded-[26px] border border-[#2d3d28] bg-[#0c130d] p-4 shadow-[0_18px_55px_rgba(0,0,0,0.24)] sm:p-5">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={onToggle}
        className="flex w-full flex-wrap items-start justify-between gap-3 text-left"
      >
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d9a94f]">
            {eyebrow}
          </p>
          <h3 className="mt-1 text-base font-semibold tracking-tight text-[#f7f1df]">
            {title}
          </h3>
          <p className="mt-1 max-w-3xl text-[11px] leading-relaxed text-[#9da892]">
            {helper}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-cyan-100">
            {badge}
          </span>
          <span className="rounded-full border border-[#2d3d28] bg-[#071009] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#c9d2bd]">
            {isOpen ? "Collapse" : "Expand"}
          </span>
        </div>
      </button>

      <div className="mt-4 rounded-2xl border border-[#2d3d28] bg-[#071009]/75 p-3">
        <div className="flex flex-wrap gap-2">{summary}</div>
      </div>

      {isOpen ? <div className="mt-5">{children}</div> : null}
    </section>
  );
}

type Step1SetupProps = {
  predator: string;
  prey: string;
  storyMode: StoryMode;
  encounterMode: EncounterMode;
  endingMode: EndingMode;
  viralLane: ViralLane;
  violenceLevel: ViolenceLevel;
  habitatRegion: HabitatRegion;
  season: Season;
  timeOfDay: TimeOfDay;
  subjectA?: string;
  subjectB?: string;
  groupCount?: number;
  offspringLabel?: OffspringLabel;
  strikeMethod?: StrikeMethod;
  escapeDirection?: EscapeDirection;
  weatherHazard?: WeatherHazard;
  rutSeason?: boolean;
  foodItem?: string;
  wildlifeScopeMode: WildlifeScopeMode;
  contentLane: ContentLane;
  cameraAnglePreset: CameraAnglePreset;
  arc: Arc;
  weather: Weather;
  depthMode: DepthMode;
  habitat: HabitatPreset;
  emotionalTone: EmotionalTone;
  animalVibe: AnimalVibe;
  durationLane: DurationLane;
  hookMode: HookFamily | "all";
  fastPublishMode: boolean;
  strictOriginalityGuard: boolean;
  actionStyle: ActionStylePreset;
  qualityPanelProps: QualityPanelProps;
  predatorOptions: string[];
  preyOptions: string[];
  customPredatorCount: number;
  finalEnvironment: string;
  storyboardHref: string;
  fourShotPhotoHref: string;
  currentSetupLabel: string;
  driftRisk: PredatorInfo["driftRisk"];
  workflowPresets: SavedWorkflowPreset[];
  workflowPresetPacks: SavedWorkflowPresetPack[];
  workflowPresetLibraries: WorkflowPresetLibraryRecord[];
  activeWorkflowPresetLibrary: WorkflowPresetLibraryRecord;
  workflowPresetAuthSession: WorkflowPresetAuthSession | null;
  activeWorkflowPresetId: string | null;
  activeWorkflowPresetPackId: string | null;
  defaultWorkflowPresetId?: string;
  workflowPresetName: string;
  workflowPresetPackName: string;
  workflowPresetPackDescription: string;
  workflowPresetPackTagsText: string;
  workflowPresetAuthEmailInput: string;
  workflowPresetAuthPasswordInput: string;
  workflowPresetAuthDisplayNameInput: string;
  workflowPresetSharedLibraryNameInput: string;
  workflowPresetSharedLibraryDescriptionInput: string;
  workflowPresetSharedMemberEmailInput: string;
  workflowPresetSharedMemberRole: WorkflowPresetLibraryRole;
  workflowPresetCloudSyncState: WorkflowPresetCloudSyncState;
  workflowPresetCloudSyncMessage: string;
  workflowPresetCloudSyncLastSyncedAt?: string;
  suggestedWorkflowPresetName: string;
  workflowPresetStatus: string;
  activeWorkflowPresetIsDirty: boolean;
  canEditWorkflowPresetLibrary: boolean;
  canManageWorkflowPresetLibrary: boolean;
  onPredatorChange: (value: string) => void;
  onPreyChange: (value: string) => void;
  onStoryModeChange: (value: StoryMode) => void;
  onEncounterModeChange: (value: EncounterMode) => void;
  onEndingModeChange: (value: EndingMode) => void;
  onViralLaneChange: (value: ViralLane) => void;
  onViolenceLevelChange: (value: ViolenceLevel) => void;
  onHabitatRegionChange: (value: HabitatRegion) => void;
  onSeasonChange: (value: Season) => void;
  onTimeOfDayChange: (value: TimeOfDay) => void;
  onSubjectAChange: (value: string) => void;
  onSubjectBChange: (value: string) => void;
  onGroupCountChange: (value: number | undefined) => void;
  onOffspringLabelChange: (value: OffspringLabel) => void;
  onStrikeMethodChange: (value: StrikeMethod) => void;
  onEscapeDirectionChange: (value: EscapeDirection) => void;
  onWeatherHazardChange: (value: WeatherHazard) => void;
  onRutSeasonChange: (value: boolean) => void;
  onFoodItemChange: (value: string) => void;
  onResetStoryModeSubjectDefaults: () => void;
  onApplyRecommendedSeasonalSetup: (setup: RecommendedSeasonalSetup) => void;
  onWildlifeScopeModeChange: (value: WildlifeScopeMode) => void;
  onContentLaneChange: (value: ContentLane) => void;
  onCameraAnglePresetChange: (value: CameraAnglePreset) => void;
  onWeatherChange: (value: Weather) => void;
  onDepthModeChange: (value: DepthMode) => void;
  onHabitatChange: (value: HabitatPreset) => void;
  onEmotionalToneChange: (value: EmotionalTone) => void;
  onAnimalVibeChange: (value: AnimalVibe) => void;
  onDurationLaneChange: (value: DurationLane) => void;
  onHookModeChange: (value: HookFamily | "all") => void;
  onToggleFastPublishMode: () => void;
  onToggleStrictOriginalityGuard: () => void;
  onActionStyleChange: (value: ActionStylePreset) => void;
  onApplyWorkflowTestPreset: (presetId: string) => void;
  onApplyStoryModePreset: (preset: StoryModePreset) => void;
  onApplyRankedStoryModeSetup: (setup: RankedStoryModeSetup) => void;
  onApplyStorySetupTuner: (id: StorySetupTunerId) => void;
  onResetDefaults: () => void;
  onContinue: () => void;
  onOpenCustomAnimal: () => void;
  onOpenStoryboardWorkflow: () => void;
  onOpenFourShotPhotoWorkflow: () => void;
  onWorkflowPresetNameChange: (value: string) => void;
  onWorkflowPresetPackNameChange: (value: string) => void;
  onWorkflowPresetPackDescriptionChange: (value: string) => void;
  onWorkflowPresetPackTagsTextChange: (value: string) => void;
  onWorkflowPresetAuthEmailInputChange: (value: string) => void;
  onWorkflowPresetAuthPasswordInputChange: (value: string) => void;
  onWorkflowPresetAuthDisplayNameInputChange: (value: string) => void;
  onWorkflowPresetSharedLibraryNameInputChange: (value: string) => void;
  onWorkflowPresetSharedLibraryDescriptionInputChange: (value: string) => void;
  onWorkflowPresetSharedMemberEmailInputChange: (value: string) => void;
  onWorkflowPresetSharedMemberRoleChange: (
    value: WorkflowPresetLibraryRole
  ) => void;
  onSelectedWorkflowPresetLibraryChange: (id: string) => void;
  onSaveWorkflowPreset: (name?: string) => void;
  onUpdateWorkflowPreset: (id?: string, name?: string) => void;
  onLoadWorkflowPreset: (id: string) => void;
  onDeleteWorkflowPreset: (id: string) => void;
  onSetDefaultWorkflowPreset: (id: string) => void;
  onClearDefaultWorkflowPreset: () => void;
  onExportWorkflowPreset: (id: string) => void;
  onExportAllWorkflowPresets: () => void;
  onImportWorkflowPresets: (jsonText: string) => void;
  onCreateWorkflowPresetPack: (
    presetIds: string[],
    options: { name?: string; description?: string; tagsText?: string }
  ) => void;
  onDeleteWorkflowPresetPack: (id: string) => void;
  onExportWorkflowPresetPack: (id: string) => void;
  onImportWorkflowPresetPack: (jsonText: string) => void;
  onApplyWorkflowPresetPack: (id: string) => void;
  onSignInWorkflowPresetLibrary: () => void;
  onSignUpWorkflowPresetLibrary: () => void;
  onSignOutWorkflowPresetLibrary: () => void;
  onSyncWorkflowPresetLibrary: () => void;
  onCreateSharedWorkflowPresetLibrary: () => void;
  onSaveSharedWorkflowPresetLibraryMember: () => void;
  onRemoveSharedWorkflowPresetLibraryMember: (userId: string) => void;
  workflowPresetImportStatus: string;
  workflowPresetPackStatus: string;
  myWorkflowPresets: MyWorkflowPreset[];
  suggestedMyWorkflowPresetName: string;
  myWorkflowPresetStatus?: string;
  myWorkflowPresetStorageWarning?: string;
  onSaveMyWorkflowPreset: (name: string) => void;
  onApplyMyWorkflowPreset: (id: string) => void;
  onRenameMyWorkflowPreset: (id: string, name: string) => void;
  onDeleteMyWorkflowPreset: (id: string) => void;
};

export default function Step1Setup({
  predator,
  prey,
  storyMode,
  encounterMode,
  endingMode,
  viralLane,
  violenceLevel,
  habitatRegion,
  season,
  timeOfDay,
  subjectA,
  subjectB,
  groupCount,
  offspringLabel,
  strikeMethod,
  escapeDirection,
  weatherHazard,
  rutSeason,
  foodItem,
  wildlifeScopeMode,
  contentLane,
  cameraAnglePreset,
  arc,
  weather,
  depthMode,
  habitat,
  emotionalTone,
  animalVibe,
  durationLane,
  hookMode,
  fastPublishMode,
  strictOriginalityGuard,
  actionStyle,
  qualityPanelProps,
  predatorOptions,
  preyOptions,
  customPredatorCount,
  finalEnvironment,
  storyboardHref,
  fourShotPhotoHref,
  currentSetupLabel,
  driftRisk,
  workflowPresets,
  workflowPresetPacks,
  workflowPresetLibraries,
  activeWorkflowPresetLibrary,
  workflowPresetAuthSession,
  activeWorkflowPresetId,
  activeWorkflowPresetPackId,
  defaultWorkflowPresetId,
  workflowPresetName,
  workflowPresetPackName,
  workflowPresetPackDescription,
  workflowPresetPackTagsText,
  workflowPresetAuthEmailInput,
  workflowPresetAuthPasswordInput,
  workflowPresetAuthDisplayNameInput,
  workflowPresetSharedLibraryNameInput,
  workflowPresetSharedLibraryDescriptionInput,
  workflowPresetSharedMemberEmailInput,
  workflowPresetSharedMemberRole,
  workflowPresetCloudSyncState,
  workflowPresetCloudSyncMessage,
  workflowPresetCloudSyncLastSyncedAt,
  suggestedWorkflowPresetName,
  workflowPresetStatus,
  activeWorkflowPresetIsDirty,
  canEditWorkflowPresetLibrary,
  canManageWorkflowPresetLibrary,
  onPredatorChange,
  onPreyChange,
  onStoryModeChange,
  onEncounterModeChange,
  onEndingModeChange,
  onViralLaneChange,
  onViolenceLevelChange,
  onHabitatRegionChange,
  onSeasonChange,
  onTimeOfDayChange,
  onSubjectAChange,
  onSubjectBChange,
  onGroupCountChange,
  onOffspringLabelChange,
  onStrikeMethodChange,
  onEscapeDirectionChange,
  onWeatherHazardChange,
  onRutSeasonChange,
  onFoodItemChange,
  onResetStoryModeSubjectDefaults,
  onApplyRecommendedSeasonalSetup,
  onWildlifeScopeModeChange,
  onContentLaneChange,
  onCameraAnglePresetChange,
  onWeatherChange,
  onDepthModeChange,
  onHabitatChange,
  onEmotionalToneChange,
  onAnimalVibeChange,
  onDurationLaneChange,
  onHookModeChange,
  onToggleFastPublishMode,
  onToggleStrictOriginalityGuard,
  onActionStyleChange,
  onApplyWorkflowTestPreset,
  onApplyStoryModePreset,
  onApplyRankedStoryModeSetup,
  onApplyStorySetupTuner,
  onResetDefaults,
  onContinue,
  onOpenCustomAnimal,
  onOpenStoryboardWorkflow,
  onOpenFourShotPhotoWorkflow,
  onWorkflowPresetNameChange,
  onWorkflowPresetPackNameChange,
  onWorkflowPresetPackDescriptionChange,
  onWorkflowPresetPackTagsTextChange,
  onWorkflowPresetAuthEmailInputChange,
  onWorkflowPresetAuthPasswordInputChange,
  onWorkflowPresetAuthDisplayNameInputChange,
  onWorkflowPresetSharedLibraryNameInputChange,
  onWorkflowPresetSharedLibraryDescriptionInputChange,
  onWorkflowPresetSharedMemberEmailInputChange,
  onWorkflowPresetSharedMemberRoleChange,
  onSelectedWorkflowPresetLibraryChange,
  onSaveWorkflowPreset,
  onUpdateWorkflowPreset,
  onLoadWorkflowPreset,
  onDeleteWorkflowPreset,
  onSetDefaultWorkflowPreset,
  onClearDefaultWorkflowPreset,
  onExportWorkflowPreset,
  onExportAllWorkflowPresets,
  onImportWorkflowPresets,
  onCreateWorkflowPresetPack,
  onDeleteWorkflowPresetPack,
  onExportWorkflowPresetPack,
  onImportWorkflowPresetPack,
  onApplyWorkflowPresetPack,
  onSignInWorkflowPresetLibrary,
  onSignUpWorkflowPresetLibrary,
  onSignOutWorkflowPresetLibrary,
  onSyncWorkflowPresetLibrary,
  onCreateSharedWorkflowPresetLibrary,
  onSaveSharedWorkflowPresetLibraryMember,
  onRemoveSharedWorkflowPresetLibraryMember,
  workflowPresetImportStatus,
  workflowPresetPackStatus,
  myWorkflowPresets,
  suggestedMyWorkflowPresetName,
  myWorkflowPresetStatus,
  myWorkflowPresetStorageWarning,
  onSaveMyWorkflowPreset,
  onApplyMyWorkflowPreset,
  onRenameMyWorkflowPreset,
  onDeleteMyWorkflowPreset,
}: Step1SetupProps) {
  const facebookRecommendation = buildStep1FacebookRecommendation({
    predator,
    prey,
    contentLane,
    arc,
    habitat,
    weather,
    depthMode,
    driftRisk,
  });
  const habitatGuidance = getHabitatOverrideGuidance(habitat, contentLane);
  const cameraPresetDefinition = getCameraAnglePresetDefinition(cameraAnglePreset);
  const animalPairGuidance = getAnimalPairMicroGuidance(
    predator,
    prey,
    driftRisk
  );
  const wildlifeScopeHelperText = getWildlifeScopeHelperText(wildlifeScopeMode);
  const wildlifeSafetyHint = getWildlifeFocusSafetyHint(wildlifeScopeMode);
  const wildlifeScopeIsAttackFocused = isAttackFocusedWildlifeScope(
    wildlifeScopeMode
  );
  const regionalStep1Hint = getRegionalWildlifeStep1Hint(
    wildlifeScopeMode,
    predator,
    prey
  );
  const habitatCompatibility = getWildlifeHabitatCompatibilityGuidance({
    mode: wildlifeScopeMode,
    predator,
    prey,
    habitat,
  });
  const pairingHighlights = getWildlifeFocusPairingHighlights(
    wildlifeScopeMode,
    predator,
    prey
  );
  const safetyDefaults = getWildlifeFocusSafetyDefaults();
  const [leadAnimalSearch, setLeadAnimalSearch] = useState("");
  const [sceneMode, setSceneMode] = useState<"simple" | "advanced">("simple");
  const [isCreatorQaPresetsOpen, setIsCreatorQaPresetsOpen] = useState(false);
  const [isWorkflowPresetLibraryOpen, setIsWorkflowPresetLibraryOpen] =
    useState(false);
  const [isProductionControlsOpen, setIsProductionControlsOpen] =
    useState(false);
  const [isAdvancedControlsOpen, setIsAdvancedControlsOpen] = useState(false);
  const storySetupTuners = STORY_SETUP_TUNER_IDS.map((id) =>
    buildStorySetupTunerPatch({ id, storyMode })
  );

  const leadAnimalQuery = leadAnimalSearch.trim().toLowerCase();
  const leadAnimalMatches = leadAnimalQuery
    ? predatorOptions.filter((option) =>
        option.toLowerCase().includes(leadAnimalQuery)
      )
    : predatorOptions;
  const filteredPredatorOptions = leadAnimalMatches.includes(predator)
    ? leadAnimalMatches
    : [predator, ...leadAnimalMatches];
  const leadAnimalSearchHasNoResults =
    leadAnimalQuery.length > 0 && leadAnimalMatches.length === 0;
  const sceneIntelligenceInput = {
    predator,
    prey,
    contentLane,
    arc,
    habitat,
    weather,
    depthMode,
    cameraAnglePreset,
    emotionalTone,
    animalVibe,
    environment: finalEnvironment,
  };
  const sceneReport = buildSceneIntelligenceReport(sceneIntelligenceInput);
  const scenePresetOptions = buildScenePresetOptions(
    sceneReport,
    sceneIntelligenceInput
  );
  const applySceneSettings = (preset: {
    habitat: HabitatPreset;
    weather: Weather;
    depthMode: DepthMode;
    cameraAnglePreset: CameraAnglePreset;
    emotionalTone: EmotionalTone;
    animalVibe: AnimalVibe;
  }) => {
    onHabitatChange(preset.habitat);
    onWeatherChange(preset.weather);
    onDepthModeChange(preset.depthMode);
    onCameraAnglePresetChange(preset.cameraAnglePreset);
    onEmotionalToneChange(preset.emotionalTone);
    onAnimalVibeChange(preset.animalVibe);
  };
  const isScenePresetActive = (preset: {
    habitat: HabitatPreset;
    weather: Weather;
    depthMode: DepthMode;
    cameraAnglePreset: CameraAnglePreset;
    emotionalTone: EmotionalTone;
    animalVibe: AnimalVibe;
  }) =>
    habitat === preset.habitat &&
    weather === preset.weather &&
    depthMode === preset.depthMode &&
    cameraAnglePreset === preset.cameraAnglePreset &&
    emotionalTone === preset.emotionalTone &&
    animalVibe === preset.animalVibe;
  const sceneReportColor =
    sceneReport.severity === "success"
      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-50"
      : sceneReport.severity === "info"
        ? "border-cyan-400/30 bg-cyan-500/10 text-cyan-50"
        : sceneReport.severity === "warning"
          ? "border-amber-400/35 bg-amber-500/10 text-amber-50"
          : "border-rose-400/35 bg-rose-500/10 text-rose-50";
  const isPredatorVsPreyMode = storyMode === StoryMode.PREDATOR_VS_PREY;
  const activeStorySetupSummary = isPredatorVsPreyMode
    ? `Story Setup: ${predator} vs ${prey} · ${habitatRegion} · ${season} · ${timeOfDay}`
    : buildStoryModeSetupSummary({
        storyMode,
        subjectA,
        subjectB,
        groupCount,
        offspringLabel,
        strikeMethod,
        escapeDirection,
        weatherHazard,
        rutSeason,
        foodItem,
        habitatRegion,
        season,
        timeOfDay,
      });

  return (
    <div className="mx-auto w-full max-w-[1760px] space-y-4 text-[#f7f1df] [&_input:not([type='checkbox'])]:border-[#2d3d28] [&_input:not([type='checkbox'])]:bg-[#071009] [&_input:not([type='checkbox'])]:text-[#f7f1df] [&_input:not([type='checkbox'])]:placeholder:text-[#71806b] [&_label]:text-[#9da892] [&_select]:border-[#2d3d28] [&_select]:bg-[#071009] [&_select]:text-[#f7f1df] [&_textarea]:border-[#2d3d28] [&_textarea]:bg-[#071009] [&_textarea]:text-[#f7f1df]">
      <div className="rounded-[28px] border border-[#2d3d28] bg-[#071009] p-4 shadow-[0_22px_70px_rgba(0,0,0,0.3)] sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#d9a94f]">
              Step 1 command deck
            </p>
            <h2 className="mt-1 text-xl font-semibold text-[#f7f1df]">
              Wildlife setup control room
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-[#9da892]">
              Choose animals, story direction, habitat, camera language, presets,
              and safe handoffs before engine tuning. Existing setup logic stays
              wired exactly as before.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.12em]">
            <span className="rounded-full border border-[#d9a94f]/35 bg-[#d9a94f]/12 px-3 py-1.5 text-[#f3c766]">
              {storyMode.replace(/_/g, " ")}
            </span>
            <span className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-1.5 text-cyan-200">
              {wildlifeScopeMode}
            </span>
            <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1.5 text-emerald-200">
              Drift {driftRisk}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-4">
        <CollapsibleControlSection
          title="Saved workflow presets"
          eyebrow="Workflow Preset Library"
          helper="Saved setups stay available, but the library starts compact so daily Step 1 work begins with story choices."
          badge={isWorkflowPresetLibraryOpen ? "Library open" : "Library hidden"}
          isOpen={isWorkflowPresetLibraryOpen}
          onToggle={() =>
            setIsWorkflowPresetLibraryOpen((current) => !current)
          }
          summary={
            <>
              <SummaryChip
                label="Saved"
                value={`${workflowPresets.length} presets`}
                tone="violet"
              />
              <SummaryChip
                label="Packs"
                value={`${workflowPresetPacks.length} packs`}
              />
              <SummaryChip
                label="Library"
                value={activeWorkflowPresetLibrary.name}
                tone="cyan"
              />
              <SummaryChip
                label="Default"
                value={defaultWorkflowPresetId ? "set" : "none"}
                tone={defaultWorkflowPresetId ? "emerald" : "neutral"}
              />
            </>
          }
        >
        <WorkflowPresetsPanel
          presets={workflowPresets}
          presetPacks={workflowPresetPacks}
          libraries={workflowPresetLibraries}
          activeLibrary={activeWorkflowPresetLibrary}
          activePresetId={activeWorkflowPresetId}
          activePresetPackId={activeWorkflowPresetPackId}
          defaultPresetId={defaultWorkflowPresetId}
          activePresetIsDirty={activeWorkflowPresetIsDirty}
          presetName={workflowPresetName}
          packName={workflowPresetPackName}
          packDescription={workflowPresetPackDescription}
          packTagsText={workflowPresetPackTagsText}
          authSession={workflowPresetAuthSession}
          authEmailInput={workflowPresetAuthEmailInput}
          authPasswordInput={workflowPresetAuthPasswordInput}
          authDisplayNameInput={workflowPresetAuthDisplayNameInput}
          sharedLibraryNameInput={workflowPresetSharedLibraryNameInput}
          sharedLibraryDescriptionInput={
            workflowPresetSharedLibraryDescriptionInput
          }
          sharedMemberEmailInput={workflowPresetSharedMemberEmailInput}
          sharedMemberRole={workflowPresetSharedMemberRole}
          cloudSyncState={workflowPresetCloudSyncState}
          cloudSyncMessage={workflowPresetCloudSyncMessage}
          cloudSyncLastSyncedAt={workflowPresetCloudSyncLastSyncedAt}
          canEditActiveLibrary={canEditWorkflowPresetLibrary}
          canManageActiveLibrary={canManageWorkflowPresetLibrary}
          suggestedPresetName={suggestedWorkflowPresetName}
          presetStatus={workflowPresetStatus}
          onPresetNameChange={onWorkflowPresetNameChange}
          onPresetPackNameChange={onWorkflowPresetPackNameChange}
          onPresetPackDescriptionChange={onWorkflowPresetPackDescriptionChange}
          onPresetPackTagsTextChange={onWorkflowPresetPackTagsTextChange}
          onAuthEmailInputChange={onWorkflowPresetAuthEmailInputChange}
          onAuthPasswordInputChange={onWorkflowPresetAuthPasswordInputChange}
          onAuthDisplayNameInputChange={
            onWorkflowPresetAuthDisplayNameInputChange
          }
          onSharedLibraryNameInputChange={
            onWorkflowPresetSharedLibraryNameInputChange
          }
          onSharedLibraryDescriptionInputChange={
            onWorkflowPresetSharedLibraryDescriptionInputChange
          }
          onSharedMemberEmailInputChange={
            onWorkflowPresetSharedMemberEmailInputChange
          }
          onSharedMemberRoleChange={onWorkflowPresetSharedMemberRoleChange}
          onActiveLibraryChange={onSelectedWorkflowPresetLibraryChange}
          onSavePreset={onSaveWorkflowPreset}
          onUpdatePreset={onUpdateWorkflowPreset}
          onLoadPreset={onLoadWorkflowPreset}
          onDeletePreset={onDeleteWorkflowPreset}
          onSetDefaultPreset={onSetDefaultWorkflowPreset}
          onClearDefaultPreset={onClearDefaultWorkflowPreset}
          onExportPreset={onExportWorkflowPreset}
          onExportAllPresets={onExportAllWorkflowPresets}
          onImportPresets={onImportWorkflowPresets}
          onCreatePresetPack={onCreateWorkflowPresetPack}
          onDeletePresetPack={onDeleteWorkflowPresetPack}
          onExportPresetPack={onExportWorkflowPresetPack}
          onImportPresetPack={onImportWorkflowPresetPack}
          onApplyPresetPack={onApplyWorkflowPresetPack}
          onSignIn={onSignInWorkflowPresetLibrary}
          onSignUp={onSignUpWorkflowPresetLibrary}
          onSignOut={onSignOutWorkflowPresetLibrary}
          onSyncLibrary={onSyncWorkflowPresetLibrary}
          onCreateSharedLibrary={onCreateSharedWorkflowPresetLibrary}
          onSaveSharedLibraryMember={onSaveSharedWorkflowPresetLibraryMember}
          onRemoveSharedLibraryMember={
            onRemoveSharedWorkflowPresetLibraryMember
          }
          importStatus={workflowPresetImportStatus}
          packStatus={workflowPresetPackStatus}
        />
        </CollapsibleControlSection>

        <section className="rounded-[26px] border border-violet-400/20 bg-[#0b1014] p-4 text-white shadow-[0_18px_55px_rgba(0,0,0,0.24)] sm:p-5">
          <button
            type="button"
            aria-expanded={isCreatorQaPresetsOpen}
            onClick={() => setIsCreatorQaPresetsOpen((current) => !current)}
            className="flex w-full flex-wrap items-start justify-between gap-3 text-left"
          >
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d9a94f]">
                Presets
              </h3>
              <p className="mt-1 text-[11px] leading-relaxed text-white/65">
                Fills setup only — does not generate.
              </p>
            </div>
            <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/80">
              {isCreatorQaPresetsOpen ? "Hide presets" : "Show presets"}
            </span>
          </button>
          {isCreatorQaPresetsOpen ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {WORKFLOW_TEST_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onApplyWorkflowTestPreset(preset.id)}
                  className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-left text-xs font-semibold text-white shadow-sm transition hover:bg-white/15 active:scale-[0.98]"
                >
                  <span className="block">{preset.label}</span>
                  <span className="mt-0.5 block text-[10px] font-medium text-white/60">
                    {preset.summary}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <WildlifeStoryModeSelector
          value={storyMode}
          onChange={onStoryModeChange}
        />

        <BestUsaViralSetupsPanel
          storyMode={storyMode}
          habitatRegion={habitatRegion}
          season={season}
          timeOfDay={timeOfDay}
          animalOptions={predatorOptions}
          onApplySetup={onApplyRankedStoryModeSetup}
        />

        <MyWorkflowPresetsPanel
          presets={myWorkflowPresets}
          suggestedName={suggestedMyWorkflowPresetName}
          status={myWorkflowPresetStatus}
          storageWarning={myWorkflowPresetStorageWarning}
          onSave={onSaveMyWorkflowPreset}
          onApply={onApplyMyWorkflowPreset}
          onRename={onRenameMyWorkflowPreset}
          onDelete={onDeleteMyWorkflowPreset}
        />

        <section className="rounded-[26px] border border-[#2d3d28] bg-[#0c130d] p-4 text-[#f7f1df] shadow-[0_18px_55px_rgba(0,0,0,0.24)] sm:p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d9a94f]">
                Story Direction
              </p>
              <h3 className="mt-1 text-base font-semibold text-[#f7f1df]">
                One-click control tuning
              </h3>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[#9da892]">
                Adjusts existing setup controls only. Animals, habitat, and
                custom manual values stay untouched.
              </p>
            </div>
            <span className="rounded-full border border-[#2d3d28] bg-[#071009] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#c9d2bd]">
              Setup only
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {storySetupTuners.map((tuner) => (
              <button
                key={tuner.id}
                type="button"
                onClick={() => onApplyStorySetupTuner(tuner.id)}
                className="rounded-2xl border border-[#2d3d28] bg-[#071009] p-3 text-left transition hover:border-[#d9a94f]/45 hover:bg-[#101a10] active:scale-[0.99]"
              >
                <span className="block text-sm font-black text-[#f7f1df]">
                  {tuner.label}
                </span>
                <span className="mt-1 block text-[11px] leading-relaxed text-[#9da892]">
                  {tuner.helper}
                </span>
                <span className="mt-3 block text-[10px] font-bold uppercase tracking-[0.08em] text-[#d9a94f]">
                  {tuner.adjustedControls.slice(0, 3).join(" · ")}
                </span>
              </button>
            ))}
          </div>
        </section>

        <StoryModePresetsPanel
          activeStoryMode={storyMode}
          onApplyPreset={onApplyStoryModePreset}
        />


        <div id="qa-subject-setup" className="scroll-mt-24 space-y-4">
          {isPredatorVsPreyMode ? (
            <section className="rounded-[26px] border border-[#2d3d28] bg-[#0c130d] p-4 shadow-[0_18px_55px_rgba(0,0,0,0.24)] sm:p-5">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d9a94f]">
              Animal Pair
            </h3>
            <p className="mb-4 mt-1 text-[11px] leading-relaxed text-[#9da892]">
              Start with the pairing viewers can identify fastest. Lower drift
              risk is usually the safest Facebook first test.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[11px] font-medium text-[#c9d2bd]">
                  Wildlife Focus
                </label>
                <select
                  value={wildlifeScopeMode}
                  onChange={(event) =>
                    onWildlifeScopeModeChange(
                      event.target.value as WildlifeScopeMode
                    )
                  }
                  className="w-full rounded-xl border border-[#2d3d28] bg-[#071009] px-3 py-2.5 text-sm font-medium text-[#f7f1df] focus:border-[#d9a94f]/60 focus:outline-none"
                >
                  {wildlifeScopeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-[#9da892]">
                  Choose a wildlife focus to bias Step 1 toward animals and
                  environments viewers recognize fastest. World Wide Wildlife
                  restores broad documentary browsing. USA Viral Wildlife keeps
                  North American survival hooks readable. Global Viral Wildlife
                  prioritizes fast Kling Direct 15s encounter setups. Custom
                  animals stay available in every mode.
                </p>
                <p className="mt-1 text-[11px] text-[#9da892]">
                  {wildlifeScopeHelperText}
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-[#c9d2bd]">
                  Lead Animal
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="search"
                      value={leadAnimalSearch}
                      onChange={(event) =>
                        setLeadAnimalSearch(event.target.value)
                      }
                      placeholder="Search lead animal..."
                      className="min-w-0 flex-1 rounded-xl border border-[#2d3d28] bg-[#071009] px-3 py-2.5 text-sm font-medium text-[#f7f1df] placeholder:text-[#71806b] focus:border-[#d9a94f]/60 focus:outline-none"
                    />

                    {leadAnimalSearch && (
                      <button
                        type="button"
                        onClick={() => setLeadAnimalSearch("")}
                        className="rounded-xl border border-[#2d3d28] bg-[#071009] px-3 py-2 text-xs font-semibold text-[#c9d2bd] hover:border-[#d9a94f]/40 hover:bg-[#101a10]"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <select
                    value={predator}
                    onChange={(event) => {
                      onPredatorChange(event.target.value);
                      setLeadAnimalSearch("");
                    }}
                    className="w-full rounded-xl border border-[#2d3d28] bg-[#071009] px-3 py-2.5 text-sm font-medium text-[#f7f1df] focus:border-[#d9a94f]/60 focus:outline-none"
                  >
                    {filteredPredatorOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                {leadAnimalSearchHasNoResults && (
                  <p className="mt-1 text-[11px] text-amber-600">
                    No lead animal found for “{leadAnimalSearch}”. Current
                    selected animal is still kept.
                  </p>
                )}

                <p className="mt-1 text-[11px] text-[#9da892]">
                  Sets the primary behavior cue; search or choose the animal
                  viewers recognize first.
                </p>

                <p className="mt-0.5 text-[11px] text-[#9da892]">
                  Showing {leadAnimalMatches.length} of {predatorOptions.length}{" "}
                  lead animals.
                </p>

                {customPredatorCount > 0 && (
                  <p className="mt-0.5 text-[11px] text-[#9da892]">
                    {customPredatorCount} custom animal
                    {customPredatorCount > 1 ? "s" : ""} added
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-[#c9d2bd]">
                  Opposing Animal
                </label>
                <select
                  value={prey}
                  onChange={(event) => onPreyChange(event.target.value)}
                  className="w-full rounded-xl border border-[#2d3d28] bg-[#071009] px-3 py-2.5 text-sm font-medium text-[#f7f1df] focus:border-[#d9a94f]/60 focus:outline-none"
                >
                  {preyOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-[#9da892]">
                  Filtered for realism from the selected lead animal.
                </p>
              </div>
              <div className="rounded-2xl border border-[#2d3d28] bg-[#071009] p-3 text-[11px] leading-relaxed text-[#c9d2bd] sm:col-span-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[#f7f1df]">
                    Current pair:
                  </span>
                  <span>{predator} vs {prey}</span>
                  <span
                    className={
                      driftRisk === "HIGH"
                        ? "rounded-full bg-red-100 px-2 py-1 text-[10px] font-semibold text-red-700"
                        : driftRisk === "MEDIUM"
                          ? "rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-700"
                          : "rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-700"
                    }
                  >
                    Drift {driftRisk}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {pairingHighlights.badges.length > 0 ? (
                    pairingHighlights.badges.map((badge) => (
                      <span
                        key={badge}
                        className="rounded-full border border-violet-300/25 bg-violet-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-violet-100"
                      >
                        {badge}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full border border-violet-300/25 bg-violet-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-violet-100">
                      Facebook-safe
                    </span>
                  )}
                </div>
              </div>
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-[11px] leading-relaxed text-emerald-100 sm:col-span-2">
                <span className="font-semibold">Facebook setup hint:</span>{" "}
                {regionalStep1Hint} {animalPairGuidance}
              </div>
              <div className="rounded-2xl border border-cyan-400/25 bg-cyan-500/10 p-3 sm:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200">
                      Handoffs
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-cyan-100/75">
                      Send {predator} vs {prey} plus the current habitat setup into storyboard or same-environment photo workflows.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenStoryboardWorkflow}
                    title={storyboardHref}
                    className="rounded-xl border border-cyan-300/50 bg-cyan-500/20 px-3.5 py-2 text-xs font-semibold text-cyan-100 shadow-sm transition hover:bg-cyan-500/30 active:scale-[0.98]"
                  >
                    Build 4-Shot Storyboard
                  </button>
                  <button
                    type="button"
                    onClick={onOpenFourShotPhotoWorkflow}
                    title={fourShotPhotoHref}
                    className="rounded-xl border border-[#d9a94f]/40 bg-[#d9a94f] px-3.5 py-2 text-xs font-semibold text-[#111207] shadow-sm transition hover:bg-[#f3c766] active:scale-[0.98]"
                  >
                    4-Shot Photo
                  </button>
                </div>
              </div>
              {wildlifeSafetyHint && (
                <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-3 text-[11px] leading-relaxed text-rose-100 sm:col-span-2">
                  <span className="font-semibold">
                    Facebook-safe survival framing:
                  </span>{" "}
                  {wildlifeSafetyHint}
                  {wildlifeScopeIsAttackFocused ? (
                    <span>
                      {" "}Global and USA viral modes keep the main action lane
                      tuned for original, documentary-style survival tension.
                    </span>
                  ) : null}
                </div>
              )}
              <div className="rounded-2xl border border-violet-400/20 bg-violet-500/10 p-3 text-[11px] leading-relaxed text-violet-100 sm:col-span-2">
                <p>
                  <span className="font-semibold">
                    Facebook-safe survival framing:
                  </span>{" "}
                  {FACEBOOK_SAFE_SURVIVAL_HINT}
                </p>
                {pairingHighlights.safeArcLabel && (
                  <p className="mt-1">
                    <span className="font-semibold">
                      Recommended safe arc:
                    </span>{" "}
                    {pairingHighlights.safeArcLabel}
                  </p>
                )}
                <p className="mt-1 text-violet-100/75">
                  {safetyDefaults.join(" • ")}
                </p>
              </div>
            </div>

            <div className="mt-5 border-t border-[#2d3d28] pt-4">
              <div
                role="tablist"
                aria-label="Step 1 setup mode"
                className="inline-flex rounded-2xl border border-[#2d3d28] bg-[#071009] p-1"
              >
                {[
                  { value: "simple", label: "Simple Setup" },
                  { value: "advanced", label: "Advanced Controls" },
                ].map((mode) => {
                  const isSelected = sceneMode === mode.value;

                  return (
                    <button
                      key={mode.value}
                      type="button"
                      role="tab"
                      aria-selected={isSelected}
                      onClick={() =>
                        setSceneMode(mode.value as "simple" | "advanced")
                      }
                      className={
                        isSelected
                          ? "rounded-xl bg-[#d9a94f] px-3 py-2 text-xs font-semibold text-[#111207] shadow-sm"
                          : "rounded-xl px-3 py-2 text-xs font-semibold text-[#c9d2bd] hover:text-[#f7f1df]"
                      }
                    >
                      {mode.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-[#c9d2bd]">
                Use Simple Setup for the fastest first test, or open Advanced
                Controls to fine-tune the same animal pair.
              </p>
            </div>
            </section>
          ) : (
            <StoryModeSubjectFields
              storyMode={storyMode}
              subjectA={subjectA}
              subjectB={subjectB}
              groupCount={groupCount}
              offspringLabel={offspringLabel}
              strikeMethod={strikeMethod}
              escapeDirection={escapeDirection}
              weatherHazard={weatherHazard}
              rutSeason={rutSeason}
              foodItem={foodItem}
              habitatRegion={habitatRegion}
              season={season}
              timeOfDay={timeOfDay}
              animalOptions={predatorOptions}
              onSubjectAChange={onSubjectAChange}
              onSubjectBChange={onSubjectBChange}
              onGroupCountChange={onGroupCountChange}
              onOffspringLabelChange={onOffspringLabelChange}
              onStrikeMethodChange={onStrikeMethodChange}
              onEscapeDirectionChange={onEscapeDirectionChange}
              onWeatherHazardChange={onWeatherHazardChange}
              onRutSeasonChange={onRutSeasonChange}
              onFoodItemChange={onFoodItemChange}
              onResetSmartDefaults={onResetStoryModeSubjectDefaults}
            />
          )}


          <div id="qa-story-controls" className="scroll-mt-24">
            <SceneRelationshipCard
              encounterMode={encounterMode}
              endingMode={endingMode}
              viralLane={viralLane}
              violenceLevel={violenceLevel}
              habitatRegion={habitatRegion}
              season={season}
              timeOfDay={timeOfDay}
              onEncounterModeChange={onEncounterModeChange}
              onEndingModeChange={onEndingModeChange}
              onViralLaneChange={onViralLaneChange}
              onViolenceLevelChange={onViolenceLevelChange}
              onHabitatRegionChange={onHabitatRegionChange}
              onSeasonChange={onSeasonChange}
              onTimeOfDayChange={onTimeOfDayChange}
            />
          </div>

          <SeasonalRealismAdvisorCard
            storyMode={storyMode}
            habitatRegion={habitatRegion}
            season={season}
            weather={weather}
            weatherHazard={weatherHazard}
            subjectA={subjectA}
            subjectB={subjectB}
            predator={predator}
            prey={prey}
            viralLane={viralLane}
            onSeasonChange={onSeasonChange}
            onApplyRecommendedSetup={onApplyRecommendedSeasonalSetup}
          />

          <CollapsibleControlSection
            title="Production Controls"
            eyebrow="Production Controls"
            helper="These controls apply to every story mode and shape the final image/video package."
            badge={isProductionControlsOpen ? "All modes" : "Compact"}
            isOpen={isProductionControlsOpen}
            onToggle={() =>
              setIsProductionControlsOpen((current) => !current)
            }
            summary={
              <>
                <SummaryChip label="Scope" value={wildlifeScopeMode} tone="violet" />
                <SummaryChip label="Lane" value={contentLane} tone="cyan" />
                <SummaryChip
                  label="Camera"
                  value={cameraPresetDefinition.label}
                />
                <SummaryChip label="Season" value={season} tone="amber" />
                <SummaryChip label="Time" value={timeOfDay} />
                <SummaryChip
                  label="Safety"
                  value={`Level ${Number(violenceLevel)}/3`}
                  tone="emerald"
                />
              </>
            }
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-[#c9d2bd]">
                  Wildlife Scope
                </label>
                <select
                  value={wildlifeScopeMode}
                  onChange={(event) =>
                    onWildlifeScopeModeChange(
                      event.target.value as WildlifeScopeMode
                    )
                  }
                  className="w-full rounded-xl border border-[#2d3d28] bg-[#071009] px-3 py-2.5 text-sm font-medium text-[#f7f1df] focus:border-[#d9a94f]/60 focus:outline-none"
                >
                  {wildlifeScopeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-[#9da892]">
                  {wildlifeScopeHelperText}
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-[#c9d2bd]">
                  Duration Lane
                </label>
                <select
                  value={durationLane}
                  onChange={(event) =>
                    onDurationLaneChange(event.target.value as DurationLane)
                  }
                  className="w-full rounded-xl border border-[#2d3d28] bg-[#071009] px-3 py-2.5 text-sm font-medium text-[#f7f1df] focus:border-[#d9a94f]/60 focus:outline-none"
                >
                  <option value="short">Short — 20s final edit</option>
                  <option value="medium">Medium — 35s final edit</option>
                  <option value="long">Long — 40s safe generation</option>
                </select>
                <p className="mt-1 text-[11px] text-[#9da892]">
                  Auto-safe routing stays available; override when a reel needs more room.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-[#c9d2bd]">
                  Action Style
                </label>
                <select
                  value={actionStyle}
                  onChange={(event) =>
                    onActionStyleChange(event.target.value as ActionStylePreset)
                  }
                  className="w-full rounded-xl border border-[#2d3d28] bg-[#071009] px-3 py-2.5 text-sm font-medium text-[#f7f1df] focus:border-[#d9a94f]/60 focus:outline-none"
                >
                  {ACTION_STYLE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-[#9da892]">
                  Shapes movement intensity without changing the selected story mode.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-[#c9d2bd]">
                  Hook Mode
                </label>
                <select
                  value={hookMode}
                  onChange={(event) =>
                    onHookModeChange(event.target.value as HookFamily | "all")
                  }
                  className="w-full rounded-xl border border-[#2d3d28] bg-[#071009] px-3 py-2.5 text-sm font-medium text-[#f7f1df] focus:border-[#d9a94f]/60 focus:outline-none"
                >
                  <option value="all">All hook variants</option>
                  <option value="danger">Danger</option>
                  <option value="curiosity">Curiosity</option>
                  <option value="reversal">Reversal</option>
                </select>
                <p className="mt-1 text-[11px] text-[#9da892]">
                  Auto uses the best fit; manual choice stays available.
                </p>
              </div>

              <button
                type="button"
                onClick={onToggleFastPublishMode}
                className={`rounded-2xl border px-3.5 py-3 text-left text-xs font-semibold transition-all active:scale-95 ${
                  fastPublishMode
                    ? "border-[#d9a94f]/45 bg-[#d9a94f]/16 text-[#f3c766] shadow-sm shadow-[#d9a94f]/10"
                    : "border-[#2d3d28] bg-[#071009] text-[#c9d2bd] shadow-sm shadow-black/20 hover:border-[#d9a94f]/35 hover:bg-[#101a10]"
                }`}
              >
                <span className="block">
                  {fastPublishMode ? "Fast Publish: ON" : "Fast Publish: OFF"}
                </span>
                <span className="mt-1 block text-[11px] font-medium opacity-75">
                  Keeps the package tuned for quick Facebook Reels output.
                </span>
              </button>

              <button
                type="button"
                onClick={onToggleStrictOriginalityGuard}
                className={`rounded-2xl border px-3.5 py-3 text-left text-xs font-semibold transition-all active:scale-95 ${
                  strictOriginalityGuard
                    ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100 shadow-sm shadow-emerald-900/20"
                    : "border-[#2d3d28] bg-[#071009] text-[#c9d2bd] shadow-sm shadow-black/20 hover:border-[#d9a94f]/35 hover:bg-[#101a10]"
                }`}
              >
                <span className="block">
                  {strictOriginalityGuard
                    ? "Originality Guard: ON"
                    : "Originality Guard: OFF"}
                </span>
                <span className="mt-1 block text-[11px] font-medium opacity-75">
                  Preserves non-repost, non-spammy publishing defaults.
                </span>
              </button>
            </div>
          </CollapsibleControlSection>

          <section className="rounded-[26px] border border-cyan-400/20 bg-[#071318] p-4 shadow-[0_18px_55px_rgba(0,0,0,0.24)] sm:p-5">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d9a94f]">
              World & Camera
            </h3>
            <p className="mb-4 mt-1 text-[11px] leading-relaxed text-[#9da892]">
              These controls bias the existing arc engine. Auto choices are
              safest; lane and habitat choices make the first Facebook test
              more specific.
            </p>
            <div
              className={`rounded-2xl border bg-[#08110b] p-4 text-[11px] leading-relaxed shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${sceneReportColor}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] opacity-70">
                    Scene Fit
                  </p>
                  <div className="mt-1 text-2xl font-bold leading-none">
                    {sceneReport.score}/100
                  </div>
                </div>
                <span className="rounded-full border border-white/10 bg-[#0c130d] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#f7f1df]">
                  {sceneReport.label}
                </span>
              </div>

              <p className="mt-3">
                <span className="font-semibold">Issue:</span>{" "}
                {sceneReport.issue}
              </p>
              <p className="mt-1">
                <span className="font-semibold">Fix:</span> {sceneReport.fix}
              </p>

              <div className="mt-3 rounded-xl border border-[#2d3d28] bg-[#071009] p-3 text-[#dce8d1]">
                <div className="font-semibold">Recommended Scene</div>
                <div className="mt-1">
                  {sceneReport.recommended.habitat} +{" "}
                  {sceneReport.recommended.weather} +{" "}
                  {sceneReport.recommended.cameraAnglePreset}
                </div>
                <div className="mt-1 text-[10px] opacity-80">
                  {sceneReport.recommended.depthMode} •{" "}
                  {sceneReport.recommended.emotionalTone} •{" "}
                  {sceneReport.recommended.animalVibe}
                </div>
              </div>

              {habitatCompatibility && (
                <div
                  className={
                    habitatCompatibility.isWarning
                      ? "mt-3 rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-[11px] leading-relaxed text-amber-100"
                      : "mt-3 rounded-xl border border-cyan-400/25 bg-cyan-500/10 p-3 text-[11px] leading-relaxed text-cyan-100"
                  }
                >
                  <span className="font-semibold">
                    {habitatCompatibility.label}:
                  </span>{" "}
                  {habitatCompatibility.message}
                </div>
              )}

              {sceneReport.reasons.length > 0 && (
                <div className="mt-3 space-y-1">
                  {sceneReport.reasons.slice(0, 3).map((reason) => (
                    <p key={reason} className="text-[10px] opacity-85">
                      • {reason}
                    </p>
                  ))}
                </div>
              )}

              <div className="mt-4">
                <p className="text-[10px] font-medium uppercase tracking-[0.08em] opacity-70">
                  Scene presets quickly tune the same animal pair for safety,
                  virality, or realism.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {scenePresetOptions.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => applySceneSettings(preset)}
                      className={
                        isScenePresetActive(preset)
                          ? "rounded-full border border-cyan-300/45 bg-cyan-500/20 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-cyan-100 shadow-sm hover:bg-cyan-500/30 active:scale-[0.98]"
                          : "rounded-full border border-[#2d3d28] bg-[#071009] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#dce8d1] shadow-sm hover:border-[#d9a94f]/40 hover:bg-[#101a10] active:scale-[0.98]"
                      }
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => applySceneSettings(sceneReport.recommended)}
                className="mt-4 w-full rounded-xl bg-[#d9a94f] px-3 py-2.5 text-xs font-semibold text-[#111207] shadow-sm hover:bg-[#f3c766] active:scale-[0.98] sm:w-auto"
              >
                Apply Recommended Scene
              </button>
            </div>
          </section>
        </div>

        <CollapsibleControlSection
          title="Advanced Controls / Smart Defaults"
          eyebrow="Advanced Controls"
          helper="Fine-tune the current story setup. Auto and Smart Default guidance stays available, and manual overrides remain available across every story mode."
          badge={isAdvancedControlsOpen ? "Manual open" : "Defaults active"}
          isOpen={isAdvancedControlsOpen}
          onToggle={() => setIsAdvancedControlsOpen((current) => !current)}
          summary={
            <>
              <SummaryChip
                label="Setup"
                value={currentSetupLabel}
                tone="violet"
              />
              <SummaryChip label="Lane" value={contentLane} tone="cyan" />
              <SummaryChip label="Weather" value={weather} />
              <SummaryChip label="Depth" value={depthMode} />
              <SummaryChip
                label="Expert"
                value="hidden · defaults active"
                tone="amber"
              />
            </>
          }
        >
            <div className="mb-4 rounded-2xl border border-[#2d3d28] bg-[#071009] p-3 text-[11px] leading-relaxed text-[#dce8d1]">
              <span className="font-semibold">Current setup:</span> {activeStorySetupSummary}
            </div>
            <QualityPanel {...qualityPanelProps} />
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
                <label className="mb-1.5 block text-[11px] font-medium text-[#c9d2bd]">
                  Content Lane
                </label>
                <select
                  value={contentLane}
                  onChange={(event) =>
                    onContentLaneChange(event.target.value as ContentLane)
                  }
                  className="w-full rounded-xl border border-[#2d3d28] bg-[#071009] px-3 py-2.5 text-sm font-medium text-[#f7f1df] focus:border-[#d9a94f]/60 focus:outline-none"
                >
                  {contentLaneOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-[#9da892]">
                  {getContentLaneMicroGuidance(contentLane)}
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-[#c9d2bd]">
                  Conflict Arc {isPredatorVsPreyMode ? "" : "(Predator vs Prey only)"}
                </label>
                <select
                  value={arc}
                  disabled
                  className="w-full cursor-not-allowed rounded-xl border border-[#2d3d28] bg-[#0c130d] px-3 py-2.5 text-sm text-[#71806b]"
                >
                  <option value={arc}>{arc}</option>
                </select>
                <p className="mt-1 text-[11px] text-[#9da892]">
                  {isPredatorVsPreyMode
                    ? getArcMicroGuidance(arc)
                    : "Auto-kept from the Predator vs Prey engine so non-predator story modes stay compatible until deeper routing expands."}
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-[#c9d2bd]">
                  Scene Atmosphere
                </label>
                <select
                  value={weather}
                  onChange={(event) => onWeatherChange(event.target.value as Weather)}
                  className="w-full rounded-xl border border-[#2d3d28] bg-[#071009] px-3 py-2.5 text-sm font-medium text-[#f7f1df] focus:border-[#d9a94f]/60 focus:outline-none"
                >
                  {weatherOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-[#9da892]">
                  {getWeatherMicroGuidance(weather)}
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-[#c9d2bd]">
                  Cinematic Depth
                </label>
                <select
                  value={depthMode}
                  onChange={(event) => onDepthModeChange(event.target.value as DepthMode)}
                  className="w-full rounded-xl border border-[#2d3d28] bg-[#071009] px-3 py-2.5 text-sm font-medium text-[#f7f1df] focus:border-[#d9a94f]/60 focus:outline-none"
                >
                  {depthModes.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-[#9da892]">
                  {getDepthModeMicroGuidance(depthMode)}
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-[#c9d2bd]">
                  Camera Angle Preset
                </label>
                <select
                  value={cameraAnglePreset}
                  onChange={(event) =>
                    onCameraAnglePresetChange(
                      event.target.value as CameraAnglePreset
                    )
                  }
                  className="w-full rounded-xl border border-[#2d3d28] bg-[#071009] px-3 py-2.5 text-sm font-medium text-[#f7f1df] focus:border-[#d9a94f]/60 focus:outline-none"
                >
                  {cameraAnglePresetOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-[#9da892]">
                  {cameraPresetDefinition.helper}
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-[#c9d2bd]">
                  Habitat Override
                </label>
                <select
                  value={habitat}
                  onChange={(event) => onHabitatChange(event.target.value as HabitatPreset)}
                  className="w-full rounded-xl border border-[#2d3d28] bg-[#071009] px-3 py-2.5 text-sm font-medium text-[#f7f1df] focus:border-[#d9a94f]/60 focus:outline-none"
                >
                  {habitatOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <div
                  className={`mt-1 rounded-xl px-2.5 py-2 text-[11px] leading-relaxed ${
                    habitatGuidance.isWarning
                      ? "border border-amber-400/30 bg-amber-500/10 text-amber-100"
                      : "border border-emerald-400/25 bg-emerald-500/10 text-emerald-100"
                  }`}
                >
                  <span className="font-semibold">{habitatGuidance.label}:</span>{" "}
                  {habitatGuidance.message}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-[#c9d2bd]">
                  Tension Level
                </label>
                <select
                  value={emotionalTone}
                  onChange={(event) =>
                    onEmotionalToneChange(event.target.value as EmotionalTone)
                  }
                  className="w-full rounded-xl border border-[#2d3d28] bg-[#071009] px-3 py-2.5 text-sm font-medium text-[#f7f1df] focus:border-[#d9a94f]/60 focus:outline-none"
                >
                  {emotionalTones.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-[#9da892]">
                  {getToneMicroGuidance(emotionalTone)}
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-[#c9d2bd]">
                  Instinct Style
                </label>
                <select
                  value={animalVibe}
                  onChange={(event) =>
                    onAnimalVibeChange(event.target.value as AnimalVibe)
                  }
                  className="w-full rounded-xl border border-[#2d3d28] bg-[#071009] px-3 py-2.5 text-sm font-medium text-[#f7f1df] focus:border-[#d9a94f]/60 focus:outline-none"
                >
                  {animalVibes.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-[#9da892]">
                  {getAnimalVibeMicroGuidance(animalVibe)}
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-violet-400/20 bg-violet-500/10 p-3 text-[11px] leading-relaxed text-violet-100">
              <div className="flex flex-wrap gap-2">
                {pairingHighlights.badges.length > 0 ? (
                  pairingHighlights.badges.map((badge) => (
                    <span
                      key={badge}
                      className="rounded-full border border-violet-300/25 bg-violet-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-violet-100"
                    >
                      {badge}
                    </span>
                  ))
                ) : (
                  <span className="rounded-full border border-violet-300/25 bg-violet-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-violet-100">
                    Facebook-safe
                  </span>
                )}
              </div>
              <p className="mt-2">
                <span className="font-semibold">Facebook-safe survival framing:</span>{" "}
                {FACEBOOK_SAFE_SURVIVAL_HINT}
              </p>
              {pairingHighlights.safeArcLabel && (
                <p className="mt-1">
                  <span className="font-semibold">Recommended safe arc:</span>{" "}
                  {pairingHighlights.safeArcLabel}
                </p>
              )}
              <p className="mt-1 text-violet-100/75">
                {safetyDefaults.join(" • ")}
              </p>
            </div>
        </CollapsibleControlSection>

        <div className="flex flex-wrap gap-2.5 border-t border-[#2d3d28] pt-5">
          <button
            type="button"
            onClick={onResetDefaults}
            className="rounded-2xl border border-[#2d3d28] bg-[#071009] px-4 py-2.5 text-sm font-semibold text-[#c9d2bd] shadow-sm shadow-black/20 hover:border-[#d9a94f]/35 active:scale-[0.98]"
          >
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="rounded-2xl bg-[#d9a94f] px-5 py-2.5 text-sm font-semibold text-[#111207] shadow-sm shadow-[#d9a94f]/20 hover:bg-[#f3c766] active:scale-[0.98]"
          >
            Continue → Engine & Quality
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-[26px] border border-[#2d3d28] border-l-4 border-l-[#d9a94f] bg-[#0c130d] p-4 shadow-[0_18px_55px_rgba(0,0,0,0.24)] sm:p-5 lg:sticky lg:top-[calc(56px+41px)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d9a94f]">
                Current Setup
              </h3>
              <p className="mt-1 text-[11px] leading-relaxed text-[#9da892]">
                Live preview of your wildlife build
              </p>
            </div>
            <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-100">
              Live
            </span>
          </div>
          <div className="mt-4 rounded-2xl border border-[#2d3d28] bg-gradient-to-br from-[#071009] to-[#101a10] p-4">
            <div className="text-base font-bold tracking-tight text-[#f7f1df]">
              {currentSetupLabel}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-[#9da892]">
              Smart defaults are applied for each story mode. You can override
              any subject or production control before generating.
            </p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              <span className="rounded-full border border-violet-300/25 bg-violet-500/10 px-2.5 py-1 text-[10px] font-semibold text-violet-100 shadow-sm shadow-black/20">
                {contentLane}
              </span>
              <span className="rounded-full border border-[#2d3d28] bg-[#071009] px-2.5 py-1 text-[10px] font-semibold text-[#dce8d1] shadow-sm shadow-black/20">
                {arc}
              </span>
              <span className="rounded-full border border-[#2d3d28] bg-[#071009] px-2.5 py-1 text-[10px] font-semibold text-[#c9d2bd] shadow-sm shadow-black/20">
                {weather}
              </span>
              <span className="rounded-full border border-[#2d3d28] bg-[#071009] px-2.5 py-1 text-[10px] font-semibold text-[#c9d2bd] shadow-sm shadow-black/20">
                {depthMode}
              </span>
              <span className="rounded-full border border-[#2d3d28] bg-[#071009] px-2.5 py-1 text-[10px] font-semibold text-[#c9d2bd] shadow-sm shadow-black/20">
                {cameraPresetDefinition.label}
              </span>
            </div>
          </div>
          <div className="mt-3 space-y-3">
            <div className="rounded-2xl border border-[#2d3d28] bg-[#071009] p-3.5">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#d9a94f]">
                Environment
              </div>
              <div className="text-[11px] leading-relaxed text-[#c9d2bd]">
                {finalEnvironment}
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3.5">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-200">
                Facebook first test
              </div>
              <div className="text-[11px] font-semibold leading-relaxed text-emerald-100">
                {facebookRecommendation.title}
              </div>
              <div className="mt-1 text-[11px] leading-relaxed text-emerald-100/85">
                {facebookRecommendation.summary}
              </div>
              <div className="mt-3 space-y-2">
                {facebookRecommendation.hints.map((hint) => (
                  <div key={hint.label} className="rounded-xl bg-[#071009]/75 px-3 py-2">
                    <span className="font-semibold text-emerald-100">
                      {hint.label}:
                    </span>{" "}
                    <span className="text-[11px] leading-relaxed text-emerald-100/85">
                      {hint.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-[#2d3d28] bg-[#071009] px-3.5 py-3">
              <span className="text-[11px] font-medium text-[#9da892]">Drift Risk</span>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                  driftRisk === "HIGH"
                    ? "bg-red-100 text-red-700"
                    : driftRisk === "MEDIUM"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {driftRisk}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-[26px] border border-dashed border-[#d9a94f]/35 bg-[#131409] p-4 shadow-[0_18px_55px_rgba(0,0,0,0.24)] sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d9a94f]">
                Custom Animal
              </div>
              <div className="mt-1 text-sm font-semibold text-[#f7f1df]">
                Add any animal to the list
              </div>
              <div className="mt-0.5 text-[11px] text-[#9da892]">
                Save a reusable local preset without changing the current flow.
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenCustomAnimal}
              className="rounded-2xl border border-[#d9a94f]/40 bg-[#d9a94f] px-3.5 py-2 text-xs font-semibold text-[#111207] shadow-sm shadow-[#d9a94f]/20 hover:bg-[#f3c766] active:scale-[0.98]"
            >
              + Add
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
