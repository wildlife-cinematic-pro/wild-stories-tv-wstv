"use client";

import { useState } from "react";

import WorkflowPresetsPanel from "@/components/build/workflow-presets-panel";
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

import type {
  AnimalVibe,
  Arc,
  CameraAnglePreset,
  ContentLane,
  DepthMode,
  EmotionalTone,
  HabitatPreset,
  PredatorInfo,
  SavedWorkflowPreset,
  SavedWorkflowPresetPack,
  Weather,
  WildlifeScopeMode,
  WorkflowPresetAuthSession,
  WorkflowPresetCloudSyncState,
  WorkflowPresetLibraryRecord,
  WorkflowPresetLibraryRole,
} from "@/types";

type Step1SetupProps = {
  predator: string;
  prey: string;
  wildlifeScopeMode: WildlifeScopeMode;
  contentLane: ContentLane;
  cameraAnglePreset: CameraAnglePreset;
  arc: Arc;
  weather: Weather;
  depthMode: DepthMode;
  habitat: HabitatPreset;
  emotionalTone: EmotionalTone;
  animalVibe: AnimalVibe;
  predatorOptions: string[];
  preyOptions: string[];
  customPredatorCount: number;
  finalEnvironment: string;
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
  onWildlifeScopeModeChange: (value: WildlifeScopeMode) => void;
  onContentLaneChange: (value: ContentLane) => void;
  onCameraAnglePresetChange: (value: CameraAnglePreset) => void;
  onWeatherChange: (value: Weather) => void;
  onDepthModeChange: (value: DepthMode) => void;
  onHabitatChange: (value: HabitatPreset) => void;
  onEmotionalToneChange: (value: EmotionalTone) => void;
  onAnimalVibeChange: (value: AnimalVibe) => void;
  onResetDefaults: () => void;
  onContinue: () => void;
  onOpenCustomAnimal: () => void;
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
};

export default function Step1Setup({
  predator,
  prey,
  wildlifeScopeMode,
  contentLane,
  cameraAnglePreset,
  arc,
  weather,
  depthMode,
  habitat,
  emotionalTone,
  animalVibe,
  predatorOptions,
  preyOptions,
  customPredatorCount,
  finalEnvironment,
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
  onWildlifeScopeModeChange,
  onContentLaneChange,
  onCameraAnglePresetChange,
  onWeatherChange,
  onDepthModeChange,
  onHabitatChange,
  onEmotionalToneChange,
  onAnimalVibeChange,
  onResetDefaults,
  onContinue,
  onOpenCustomAnimal,
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
  const sceneReportColor =
    sceneReport.severity === "success"
      ? "border-emerald-100 bg-emerald-50/80 text-emerald-900"
      : sceneReport.severity === "info"
        ? "border-sky-100 bg-sky-50/80 text-sky-900"
        : sceneReport.severity === "warning"
          ? "border-amber-100 bg-amber-50/80 text-amber-900"
          : "border-rose-100 bg-rose-50/80 text-rose-900";
  const isSimpleSceneMode = sceneMode === "simple";

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6">
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

        <div className="rounded-2xl border border-gray-200 bg-white p-3 sm:p-4">
          <div
            role="tablist"
            aria-label="Step 1 setup mode"
            className="inline-flex rounded-2xl border border-gray-200 bg-gray-50 p-1"
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
                      ? "rounded-xl bg-white px-3 py-2 text-xs font-semibold text-gray-900 shadow-sm"
                      : "rounded-xl px-3 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700"
                  }
                >
                  {mode.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
            Use Simple Setup for the fastest first test, or open Advanced Controls
            to fine-tune the same animal pair.
          </p>
        </div>

        {isSimpleSceneMode ? (
          <>
            <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">
                Animals
              </h3>
              <p className="mb-4 mt-1 text-[11px] leading-relaxed text-gray-500">
                Start with the pairing viewers can identify fastest. Lower drift
                risk is usually the safest Facebook first test.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-[11px] font-medium text-gray-500">
                    Wildlife Focus
                  </label>
                  <select
                    value={wildlifeScopeMode}
                    onChange={(event) =>
                      onWildlifeScopeModeChange(
                        event.target.value as WildlifeScopeMode
                      )
                    }
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-gray-400 focus:outline-none"
                  >
                    {wildlifeScopeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-gray-400">
                    Choose a wildlife focus to bias Step 1 toward animals and
                    environments viewers recognize fastest. World Wide Wildlife
                    restores broad documentary browsing. USA Viral Wildlife keeps
                    North American survival hooks readable. Global Viral Wildlife
                    prioritizes fast Kling Direct 15s encounter setups. Custom
                    animals stay available in every mode.
                  </p>
                  <p className="mt-1 text-[11px] text-gray-400">
                    {wildlifeScopeHelperText}
                  </p>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium text-gray-500">
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
                        className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
                      />

                      {leadAnimalSearch && (
                        <button
                          type="button"
                          onClick={() => setLeadAnimalSearch("")}
                          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50"
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
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-gray-400 focus:outline-none"
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

                  <p className="mt-1 text-[11px] text-gray-400">
                    Sets the primary behavior cue; search or choose the animal
                    viewers recognize first.
                  </p>

                  <p className="mt-0.5 text-[11px] text-gray-400">
                    Showing {leadAnimalMatches.length} of {predatorOptions.length}
                    {" "}lead animals.
                  </p>

                  {customPredatorCount > 0 && (
                    <p className="mt-0.5 text-[11px] text-gray-400">
                      {customPredatorCount} custom animal
                      {customPredatorCount > 1 ? "s" : ""} added
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium text-gray-500">
                    Opposing Animal
                  </label>
                  <select
                    value={prey}
                    onChange={(event) => onPreyChange(event.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-gray-400 focus:outline-none"
                  >
                    {preyOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-gray-400">
                    Filtered for realism from the selected lead animal.
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3 text-[11px] leading-relaxed text-emerald-800 sm:col-span-2">
                  <span className="font-semibold">Facebook setup hint:</span>{" "}
                  {regionalStep1Hint} {animalPairGuidance}
                </div>
                {wildlifeSafetyHint && (
                  <div className="rounded-2xl border border-rose-100 bg-rose-50/80 p-3 text-[11px] leading-relaxed text-rose-900 sm:col-span-2">
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
                {habitatCompatibility && (
                  <div
                    className={`rounded-2xl border p-3 text-[11px] leading-relaxed sm:col-span-2 ${
                      habitatCompatibility.isWarning
                        ? "border-amber-200 bg-amber-50/80 text-amber-900"
                        : "border-sky-100 bg-sky-50/80 text-sky-900"
                    }`}
                  >
                    <span className="font-semibold">
                      {habitatCompatibility.label}:
                    </span>{" "}
                    {habitatCompatibility.message}
                  </div>
                )}
                <div className="rounded-2xl border border-violet-100 bg-violet-50/80 p-3 text-[11px] leading-relaxed text-violet-900 sm:col-span-2">
                  <div className="flex flex-wrap gap-2">
                    {pairingHighlights.badges.length > 0 ? (
                      pairingHighlights.badges.map((badge) => (
                        <span
                          key={badge}
                          className="rounded-full border border-violet-200 bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-violet-700"
                        >
                          {badge}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full border border-violet-200 bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-violet-700">
                        Facebook-safe
                      </span>
                    )}
                  </div>
                  <p className="mt-2">
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
                  <p className="mt-1 text-violet-800/80">
                    {safetyDefaults.join(" • ")}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">
                Scene
              </h3>
              <p className="mb-4 mt-1 text-[11px] leading-relaxed text-gray-500">
                These controls bias the existing arc engine. Auto choices are
                safest; lane and habitat choices make the first Facebook test
                more specific.
              </p>
              <div className={`rounded-2xl border p-4 text-[11px] leading-relaxed ${sceneReportColor}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-bold">
                    Scene Fit: {sceneReport.score}/100
                  </span>
                  <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]">
                    {sceneReport.label}
                  </span>
                </div>

                <p className="mt-2">
                  <span className="font-semibold">Issue:</span>{" "}
                  {sceneReport.issue}
                </p>
                <p className="mt-1">
                  <span className="font-semibold">Fix:</span> {sceneReport.fix}
                </p>

                <div className="mt-3 rounded-xl bg-white/70 p-3">
                  <div className="font-semibold">Recommended Scene</div>
                  <div className="mt-1">
                    {sceneReport.recommended.habitat} +
                    {" "}{sceneReport.recommended.weather} +{" "}
                    {sceneReport.recommended.cameraAnglePreset}
                  </div>
                  <div className="mt-1 text-[10px] opacity-80">
                    {sceneReport.recommended.depthMode} •
                    {" "}{sceneReport.recommended.emotionalTone} •{" "}
                    {sceneReport.recommended.animalVibe}
                  </div>
                </div>

                {sceneReport.reasons.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {sceneReport.reasons.slice(0, 3).map((reason) => (
                      <p key={reason} className="text-[10px] opacity-85">
                        • {reason}
                      </p>
                    ))}
                  </div>
                )}

                <div className="mt-3">
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
                        className="rounded-full border border-gray-200 bg-white/85 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-700 shadow-sm hover:bg-white active:scale-[0.98]"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => applySceneSettings(sceneReport.recommended)}
                  className="mt-3 rounded-xl bg-gray-900 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-black active:scale-[0.98]"
                >
                  Apply Recommended Scene
                </button>
              </div>
            </section>
          </>
        ) : (
          <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">
              Advanced Controls
            </h3>
            <p className="mb-4 mt-1 text-[11px] leading-relaxed text-gray-500">
              Fine-tune the current {predator} vs {prey} setup. These controls
              feed the same scene-fit logic you see in Simple Setup.
            </p>
            <div className="mb-4 rounded-2xl border border-gray-200 bg-gray-50/70 p-3 text-[11px] leading-relaxed text-gray-700">
              <span className="font-semibold">Current pair:</span> {predator} vs
              {" "}{prey}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-gray-500">
                  Content Lane
                </label>
                <select
                  value={contentLane}
                  onChange={(event) =>
                    onContentLaneChange(event.target.value as ContentLane)
                  }
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-gray-400 focus:outline-none"
                >
                  {contentLaneOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-gray-400">
                  {getContentLaneMicroGuidance(contentLane)}
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-gray-500">
                  Conflict Arc
                </label>
                <select
                  value={arc}
                  disabled
                  className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-3 py-2.5 text-sm text-gray-400"
                >
                  <option value={arc}>{arc}</option>
                </select>
                <p className="mt-1 text-[11px] text-gray-400">
                  {getArcMicroGuidance(arc)}
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-gray-500">
                  Scene Atmosphere
                </label>
                <select
                  value={weather}
                  onChange={(event) => onWeatherChange(event.target.value as Weather)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-gray-400 focus:outline-none"
                >
                  {weatherOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-gray-400">
                  {getWeatherMicroGuidance(weather)}
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-gray-500">
                  Cinematic Depth
                </label>
                <select
                  value={depthMode}
                  onChange={(event) => onDepthModeChange(event.target.value as DepthMode)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-gray-400 focus:outline-none"
                >
                  {depthModes.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-gray-400">
                  {getDepthModeMicroGuidance(depthMode)}
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-gray-500">
                  Camera Angle Preset
                </label>
                <select
                  value={cameraAnglePreset}
                  onChange={(event) =>
                    onCameraAnglePresetChange(
                      event.target.value as CameraAnglePreset
                    )
                  }
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-gray-400 focus:outline-none"
                >
                  {cameraAnglePresetOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-gray-400">
                  {cameraPresetDefinition.helper}
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-gray-500">
                  Habitat Override
                </label>
                <select
                  value={habitat}
                  onChange={(event) => onHabitatChange(event.target.value as HabitatPreset)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-gray-400 focus:outline-none"
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
                      ? "bg-amber-50 text-amber-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  <span className="font-semibold">{habitatGuidance.label}:</span>{" "}
                  {habitatGuidance.message}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-gray-500">
                  Tension Level
                </label>
                <select
                  value={emotionalTone}
                  onChange={(event) =>
                    onEmotionalToneChange(event.target.value as EmotionalTone)
                  }
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-gray-400 focus:outline-none"
                >
                  {emotionalTones.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-gray-400">
                  {getToneMicroGuidance(emotionalTone)}
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-gray-500">
                  Instinct Style
                </label>
                <select
                  value={animalVibe}
                  onChange={(event) =>
                    onAnimalVibeChange(event.target.value as AnimalVibe)
                  }
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-gray-400 focus:outline-none"
                >
                  {animalVibes.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-gray-400">
                  {getAnimalVibeMicroGuidance(animalVibe)}
                </p>
              </div>
            </div>
            {habitatCompatibility && (
              <div
                className={`mt-4 rounded-2xl border p-3 text-[11px] leading-relaxed ${
                  habitatCompatibility.isWarning
                    ? "border-amber-200 bg-amber-50/80 text-amber-900"
                    : "border-sky-100 bg-sky-50/80 text-sky-900"
                }`}
              >
                <span className="font-semibold">{habitatCompatibility.label}:</span>{" "}
                {habitatCompatibility.message}
              </div>
            )}
            <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/80 p-3 text-[11px] leading-relaxed text-violet-900">
              <div className="flex flex-wrap gap-2">
                {pairingHighlights.badges.length > 0 ? (
                  pairingHighlights.badges.map((badge) => (
                    <span
                      key={badge}
                      className="rounded-full border border-violet-200 bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-violet-700"
                    >
                      {badge}
                    </span>
                  ))
                ) : (
                  <span className="rounded-full border border-violet-200 bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-violet-700">
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
              <p className="mt-1 text-violet-800/80">
                {safetyDefaults.join(" • ")}
              </p>
            </div>
          </section>
        )}

        <div className="flex flex-wrap gap-2.5 border-t border-gray-200/80 pt-5">
          <button
            type="button"
            onClick={onResetDefaults}
            className="rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 shadow-sm shadow-gray-100/80 hover:bg-gray-50 active:scale-[0.98]"
          >
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="rounded-2xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-gray-300/70 hover:bg-black active:scale-[0.98]"
          >
            Continue → Engine & Quality
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-[24px] border border-gray-200 border-l-4 border-l-violet-400 bg-white p-5 shadow-sm shadow-gray-200/70 sm:p-6 lg:sticky lg:top-[calc(56px+41px)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">
                Current Setup
              </h3>
              <p className="mt-1 text-[11px] leading-relaxed text-gray-500">
                Live preview of your wildlife build
              </p>
            </div>
            <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-semibold text-violet-700">
              Live
            </span>
          </div>
          <div className="mt-4 rounded-2xl border border-gray-200/80 bg-gradient-to-br from-gray-50 to-white p-4">
            <div className="text-base font-bold tracking-tight text-gray-900">
              {predator} vs {prey}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-2">
              <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-semibold text-violet-700 shadow-sm shadow-violet-100">
                {contentLane}
              </span>
              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-gray-600 shadow-sm shadow-gray-100">
                {arc}
              </span>
              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-gray-500 shadow-sm shadow-gray-100">
                {weather}
              </span>
              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-gray-500 shadow-sm shadow-gray-100">
                {depthMode}
              </span>
              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-gray-500 shadow-sm shadow-gray-100">
                {cameraPresetDefinition.label}
              </span>
            </div>
          </div>
          <div className="mt-3 space-y-3">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3.5">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                Environment
              </div>
              <div className="text-[11px] leading-relaxed text-gray-600">
                {finalEnvironment}
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3.5">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                Facebook first test
              </div>
              <div className="text-[11px] font-semibold leading-relaxed text-emerald-900">
                {facebookRecommendation.title}
              </div>
              <div className="mt-1 text-[11px] leading-relaxed text-emerald-800">
                {facebookRecommendation.summary}
              </div>
              <div className="mt-3 space-y-2">
                {facebookRecommendation.hints.map((hint) => (
                  <div key={hint.label} className="rounded-xl bg-white/75 px-3 py-2">
                    <span className="font-semibold text-emerald-800">
                      {hint.label}:
                    </span>{" "}
                    <span className="text-[11px] leading-relaxed text-emerald-800">
                      {hint.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-3.5 py-3">
              <span className="text-[11px] font-medium text-gray-500">Drift Risk</span>
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

        <div className="rounded-[24px] border border-dashed border-gray-300 bg-white/80 p-4 shadow-sm shadow-gray-100/80 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
                Custom Animal
              </div>
              <div className="mt-1 text-sm font-semibold text-gray-800">
                Add any animal to the list
              </div>
              <div className="mt-0.5 text-[11px] text-gray-500">
                Save a reusable local preset without changing the current flow.
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenCustomAnimal}
              className="rounded-2xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-sm shadow-gray-100/80 hover:bg-gray-50 active:scale-[0.98]"
            >
              + Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
