"use client";

import WorkflowPresetsPanel from "@/components/build/workflow-presets-panel";
import { contentLaneOptions } from "@/lib/content-lanes";
import {
  habitatOptions,
  depthModes,
  weatherOptions,
} from "@/lib/model-specs";
import { animalVibes, emotionalTones } from "@/lib/predator-data";

import type {
  AnimalVibe,
  Arc,
  ContentLane,
  DepthMode,
  EmotionalTone,
  HabitatPreset,
  PredatorInfo,
  SavedWorkflowPreset,
  Weather,
} from "@/types";

type Step1SetupProps = {
  predator: string;
  prey: string;
  contentLane: ContentLane;
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
  activeWorkflowPresetId: string | null;
  defaultWorkflowPresetId?: string;
  workflowPresetName: string;
  suggestedWorkflowPresetName: string;
  activeWorkflowPresetIsDirty: boolean;
  onPredatorChange: (value: string) => void;
  onPreyChange: (value: string) => void;
  onContentLaneChange: (value: ContentLane) => void;
  onWeatherChange: (value: Weather) => void;
  onDepthModeChange: (value: DepthMode) => void;
  onHabitatChange: (value: HabitatPreset) => void;
  onEmotionalToneChange: (value: EmotionalTone) => void;
  onAnimalVibeChange: (value: AnimalVibe) => void;
  onResetDefaults: () => void;
  onContinue: () => void;
  onOpenCustomAnimal: () => void;
  onWorkflowPresetNameChange: (value: string) => void;
  onSaveWorkflowPreset: (name?: string) => void;
  onUpdateWorkflowPreset: (id?: string, name?: string) => void;
  onLoadWorkflowPreset: (id: string) => void;
  onDeleteWorkflowPreset: (id: string) => void;
  onSetDefaultWorkflowPreset: (id: string) => void;
  onClearDefaultWorkflowPreset: () => void;
};

export default function Step1Setup({
  predator,
  prey,
  contentLane,
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
  activeWorkflowPresetId,
  defaultWorkflowPresetId,
  workflowPresetName,
  suggestedWorkflowPresetName,
  activeWorkflowPresetIsDirty,
  onPredatorChange,
  onPreyChange,
  onContentLaneChange,
  onWeatherChange,
  onDepthModeChange,
  onHabitatChange,
  onEmotionalToneChange,
  onAnimalVibeChange,
  onResetDefaults,
  onContinue,
  onOpenCustomAnimal,
  onWorkflowPresetNameChange,
  onSaveWorkflowPreset,
  onUpdateWorkflowPreset,
  onLoadWorkflowPreset,
  onDeleteWorkflowPreset,
  onSetDefaultWorkflowPreset,
  onClearDefaultWorkflowPreset,
}: Step1SetupProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6">
        <WorkflowPresetsPanel
          presets={workflowPresets}
          activePresetId={activeWorkflowPresetId}
          defaultPresetId={defaultWorkflowPresetId}
          activePresetIsDirty={activeWorkflowPresetIsDirty}
          presetName={workflowPresetName}
          suggestedPresetName={suggestedWorkflowPresetName}
          onPresetNameChange={onWorkflowPresetNameChange}
          onSavePreset={onSaveWorkflowPreset}
          onUpdatePreset={onUpdateWorkflowPreset}
          onLoadPreset={onLoadWorkflowPreset}
          onDeletePreset={onDeleteWorkflowPreset}
          onSetDefaultPreset={onSetDefaultWorkflowPreset}
          onClearDefaultPreset={onClearDefaultWorkflowPreset}
        />

        <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
          <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">
            Animals
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-gray-500">
                Lead Animal
              </label>
              <select
                value={predator}
                onChange={(event) => onPredatorChange(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-gray-400 focus:outline-none"
              >
                {predatorOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-gray-400">
                Controls the encounter and drives opening pressure.
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
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
          <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">
            Scene
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-gray-500">
                Content Lane
              </label>
              <select
                value={contentLane}
                onChange={(event) => onContentLaneChange(event.target.value as ContentLane)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-gray-400 focus:outline-none"
              >
                {contentLaneOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-gray-400">
                Biases prey order, arc choice, habitat language, and packaging direction.
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
                Auto-matched from animal pairing.
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
              {habitat !== "Auto" && (
                <p className="mt-1 text-[11px] font-medium text-amber-600">
                  ⚠ Manual override active
                </p>
              )}
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
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-gray-500">
                Instinct Style
              </label>
              <select
                value={animalVibe}
                onChange={(event) => onAnimalVibeChange(event.target.value as AnimalVibe)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-gray-400 focus:outline-none"
              >
                {animalVibes.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

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
