"use client";

import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";

import type { SavedWorkflowPreset } from "@/types";

type WorkflowPresetsPanelProps = {
  presets: SavedWorkflowPreset[];
  activePresetId: string | null;
  defaultPresetId?: string;
  activePresetIsDirty: boolean;
  presetName: string;
  suggestedPresetName: string;
  onPresetNameChange: (value: string) => void;
  onSavePreset: (name?: string) => void;
  onUpdatePreset: (id?: string, name?: string) => void;
  onLoadPreset: (id: string) => void;
  onDeletePreset: (id: string) => void;
  onSetDefaultPreset: (id: string) => void;
  onClearDefaultPreset: () => void;
  onExportPreset: (id: string) => void;
  onExportAllPresets: () => void;
  onImportPresets: (jsonText: string) => void;
  importStatus: string;
};

function formatPresetMeta(preset: SavedWorkflowPreset): string {
  const { snapshot } = preset;
  return [
    snapshot.contentLane,
    snapshot.arc,
    snapshot.durationLane === "long" ? "Long" : "Short",
    snapshot.fastPublishMode ? "Fast publish" : "Cinematic",
  ]
    .filter(Boolean)
    .join(" - ");
}

export default function WorkflowPresetsPanel({
  presets,
  activePresetId,
  defaultPresetId,
  activePresetIsDirty,
  presetName,
  suggestedPresetName,
  onPresetNameChange,
  onSavePreset,
  onUpdatePreset,
  onLoadPreset,
  onDeletePreset,
  onSetDefaultPreset,
  onClearDefaultPreset,
  onExportPreset,
  onExportAllPresets,
  onImportPresets,
  importStatus,
}: WorkflowPresetsPanelProps) {
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [importText, setImportText] = useState("");
  const resolvedSelectedPresetId =
    selectedPresetId && presets.some((preset) => preset.id === selectedPresetId)
      ? selectedPresetId
      : activePresetId && presets.some((preset) => preset.id === activePresetId)
        ? activePresetId
        : presets[0]?.id ?? "";
  const selectedPreset = useMemo(
    () => presets.find((preset) => preset.id === resolvedSelectedPresetId),
    [presets, resolvedSelectedPresetId]
  );
  const activePreset = useMemo(
    () => presets.find((preset) => preset.id === activePresetId),
    [activePresetId, presets]
  );

  const effectiveName = presetName.trim() || suggestedPresetName;
  const hasPresets = presets.length > 0;

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;

    const text = await file.text();
    setImportText(text);
    onImportPresets(text);
    event.currentTarget.value = "";
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-200/70 sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">
            Saved Workflow Templates
          </h3>
          <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-gray-500">
            Save the current build setup, reload it later, or make one your
            default starting template.
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
            activePreset
              ? "bg-emerald-100 text-emerald-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {activePreset
            ? `${activePreset.name}${activePresetIsDirty ? " - modified" : ""}`
            : "No active preset"}
        </span>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.85fr)]">
        <div>
          <label className="mb-1.5 block text-[11px] font-medium text-gray-500">
            Preset name
          </label>
          <input
            value={presetName}
            onChange={(event) => onPresetNameChange(event.target.value)}
            placeholder={suggestedPresetName}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onSavePreset(effectiveName)}
              className="rounded-xl bg-gray-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-gray-200/80 hover:bg-black active:scale-[0.98]"
            >
              Save Current as Preset
            </button>
            <button
              type="button"
              onClick={() => onUpdatePreset(resolvedSelectedPresetId, effectiveName)}
              disabled={!selectedPreset}
              className="rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-600 shadow-sm shadow-gray-100/80 hover:bg-gray-50 disabled:opacity-45 active:scale-[0.98]"
            >
              Update Preset
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-medium text-gray-500">
            Saved preset
          </label>
          <select
            value={resolvedSelectedPresetId}
            onChange={(event) => setSelectedPresetId(event.target.value)}
            disabled={!hasPresets}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-gray-400 focus:outline-none disabled:text-gray-400"
          >
            {!hasPresets && <option value="">No saved presets yet</option>}
            {presets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
                {preset.id === defaultPresetId ? " (Default)" : ""}
              </option>
            ))}
          </select>
          {selectedPreset && (
            <p className="mt-1 text-[11px] text-gray-400">
              {formatPresetMeta(selectedPreset)}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                if (!resolvedSelectedPresetId) return;
                onLoadPreset(resolvedSelectedPresetId);
                setSelectedPresetId(resolvedSelectedPresetId);
              }}
              disabled={!selectedPreset}
              className="rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-600 shadow-sm shadow-gray-100/80 hover:bg-gray-50 disabled:opacity-45 active:scale-[0.98]"
            >
              Load Preset
            </button>
            <button
              type="button"
              onClick={() =>
                resolvedSelectedPresetId === defaultPresetId
                  ? onClearDefaultPreset()
                  : resolvedSelectedPresetId &&
                    onSetDefaultPreset(resolvedSelectedPresetId)
              }
              disabled={!selectedPreset}
              className="rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-600 shadow-sm shadow-gray-100/80 hover:bg-gray-50 disabled:opacity-45 active:scale-[0.98]"
            >
              {resolvedSelectedPresetId === defaultPresetId ? "Clear Default" : "Set as Default"}
            </button>
            <button
              type="button"
              onClick={() => {
                if (!resolvedSelectedPresetId) return;
                onDeletePreset(resolvedSelectedPresetId);
                setSelectedPresetId("");
              }}
              disabled={!selectedPreset}
              className="rounded-xl border border-red-100 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-45 active:scale-[0.98]"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-3.5">
        <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400">
              Portable JSON
            </div>
            <div className="mt-1 max-w-xl text-[11px] leading-relaxed text-gray-500">
              Export one preset or the full local preset library, then import
              pasted JSON or a downloaded file without overwriting existing presets.
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                resolvedSelectedPresetId && onExportPreset(resolvedSelectedPresetId)
              }
              disabled={!selectedPreset}
              className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-600 shadow-sm shadow-gray-100/80 hover:bg-gray-50 disabled:opacity-45 active:scale-[0.98]"
            >
              Export Preset
            </button>
            <button
              type="button"
              onClick={onExportAllPresets}
              disabled={!hasPresets}
              className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-600 shadow-sm shadow-gray-100/80 hover:bg-gray-50 disabled:opacity-45 active:scale-[0.98]"
            >
              Export All
            </button>
          </div>
        </div>

        <textarea
          value={importText}
          onChange={(event) => setImportText(event.target.value)}
          placeholder="Paste exported preset JSON here..."
          rows={3}
          className="w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onImportPresets(importText)}
            disabled={!importText.trim()}
            className="rounded-xl bg-gray-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-gray-200/80 hover:bg-black disabled:opacity-45 active:scale-[0.98]"
          >
            Import Presets
          </button>
          <label className="cursor-pointer rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-600 shadow-sm shadow-gray-100/80 hover:bg-gray-50 active:scale-[0.98]">
            Upload JSON
            <input
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(event) => {
                void handleImportFile(event);
              }}
            />
          </label>
          {importStatus && (
            <span className="text-[11px] font-medium text-gray-500">
              {importStatus}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
