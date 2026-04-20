"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  readDefaultWorkflowPresetId,
  readWorkflowPresets,
  downloadJson,
  hasShareStateInUrl,
  writeDefaultWorkflowPresetId,
  writeWorkflowPresets,
} from "@/lib/storage";
import {
  areWorkflowPresetSnapshotsEqual,
  buildWorkflowPresetName,
  buildWorkflowPresetExportPayload,
  createWorkflowPreset,
  deleteWorkflowPreset,
  getSafeDefaultWorkflowPresetId,
  mergeWorkflowPresetImportJson,
  stringifyWorkflowPresetExportPayload,
  updateWorkflowPreset,
} from "@/lib/workflow-presets";
import type {
  BuildWorkflowPresetSnapshot,
  SavedWorkflowPreset,
} from "@/types";

type UseWorkflowPresetsInput = {
  currentSnapshot: BuildWorkflowPresetSnapshot;
  onLoadPreset: (preset: SavedWorkflowPreset) => void;
};

function readInitialWorkflowPresetState() {
  const presets = readWorkflowPresets();
  const defaultPresetId = readDefaultWorkflowPresetId(presets);
  const defaultPreset = defaultPresetId
    ? presets.find((preset) => preset.id === defaultPresetId)
    : undefined;
  const shouldLoadDefault = Boolean(defaultPreset && !hasShareStateInUrl());

  return {
    presets,
    defaultPresetId,
    activePresetId: shouldLoadDefault ? defaultPresetId ?? null : null,
    presetName: shouldLoadDefault ? defaultPreset?.name ?? "" : "",
    defaultPresetToLoad: shouldLoadDefault ? defaultPreset : undefined,
  };
}

export function useWorkflowPresets({
  currentSnapshot,
  onLoadPreset,
}: UseWorkflowPresetsInput) {
  const [initialState] = useState(readInitialWorkflowPresetState);

  const [presets, setPresets] = useState<SavedWorkflowPreset[]>(
    initialState.presets
  );
  const [activePresetId, setActivePresetId] = useState<string | null>(
    initialState.activePresetId
  );
  const [defaultPresetId, setDefaultPresetId] = useState<string | undefined>(
    initialState.defaultPresetId
  );
  const [presetName, setPresetName] = useState(initialState.presetName);
  const [importStatus, setImportStatus] = useState("");
  const loadPresetRef = useRef(onLoadPreset);
  const didApplyDefaultRef = useRef(false);
  const initialDefaultPresetRef = useRef(initialState.defaultPresetToLoad);

  useEffect(() => {
    loadPresetRef.current = onLoadPreset;
  }, [onLoadPreset]);

  function persistPresets(
    nextPresets: SavedWorkflowPreset[],
    nextDefaultPresetId = defaultPresetId
  ) {
    const safeDefaultId = getSafeDefaultWorkflowPresetId(
      nextPresets,
      nextDefaultPresetId
    );
    setPresets(nextPresets);
    setDefaultPresetId(safeDefaultId);
    writeWorkflowPresets(nextPresets);
    writeDefaultWorkflowPresetId(safeDefaultId);
  }

  useEffect(() => {
    if (didApplyDefaultRef.current) return;
    didApplyDefaultRef.current = true;
    const defaultPreset = initialDefaultPresetRef.current;
    if (defaultPreset) loadPresetRef.current(defaultPreset);
  }, []);

  const activePreset = useMemo(
    () =>
      activePresetId
        ? presets.find((preset) => preset.id === activePresetId)
        : undefined,
    [activePresetId, presets]
  );

  const activePresetIsDirty = useMemo(
    () =>
      activePreset
        ? !areWorkflowPresetSnapshotsEqual(
            activePreset.snapshot,
            currentSnapshot
          )
        : false,
    [activePreset, currentSnapshot]
  );

  function saveCurrentAsPreset(nameOverride?: string): SavedWorkflowPreset {
    const preset = createWorkflowPreset(currentSnapshot, {
      name: nameOverride ?? presetName,
    });
    const nextPresets = [preset, ...presets].slice(0, 40);
    persistPresets(nextPresets);
    setActivePresetId(preset.id);
    setPresetName(preset.name);
    return preset;
  }

  function updatePresetFromCurrent(
    id = activePresetId ?? "",
    nameOverride?: string
  ): SavedWorkflowPreset | undefined {
    const target = presets.find((preset) => preset.id === id);
    if (!target) return undefined;

    const nextPresets = updateWorkflowPreset(presets, target.id, currentSnapshot, {
      name: nameOverride ?? presetName,
    });
    persistPresets(nextPresets);

    const updated = nextPresets.find((preset) => preset.id === target.id);
    setActivePresetId(target.id);
    setPresetName(updated?.name ?? target.name);
    return updated;
  }

  function loadPreset(id: string): SavedWorkflowPreset | undefined {
    const preset = presets.find((item) => item.id === id);
    if (!preset) return undefined;

    loadPresetRef.current(preset);
    setActivePresetId(preset.id);
    setPresetName(preset.name);
    return preset;
  }

  function deletePreset(id: string): void {
    const nextPresets = deleteWorkflowPreset(presets, id);
    const nextDefaultId =
      defaultPresetId === id ? undefined : defaultPresetId;
    persistPresets(nextPresets, nextDefaultId);

    if (activePresetId === id) {
      setActivePresetId(null);
      setPresetName(buildWorkflowPresetName(currentSnapshot));
    }
  }

  function setPresetAsDefault(id: string): void {
    const safeDefaultId = getSafeDefaultWorkflowPresetId(presets, id);
    setDefaultPresetId(safeDefaultId);
    writeDefaultWorkflowPresetId(safeDefaultId);
  }

  function clearDefaultPreset(): void {
    setDefaultPresetId(undefined);
    writeDefaultWorkflowPresetId(undefined);
  }

  function buildExportFilename(label: string): string {
    return `${label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "workflow-presets"}.json`;
  }

  function exportPreset(id: string): string | undefined {
    const preset = presets.find((item) => item.id === id);
    if (!preset) return undefined;

    const payload = buildWorkflowPresetExportPayload([preset], {
      defaultPresetId: defaultPresetId === id ? id : undefined,
    });
    downloadJson(buildExportFilename(`wstv-preset-${preset.name}`), payload);
    return stringifyWorkflowPresetExportPayload(payload);
  }

  function exportAllPresets(): string | undefined {
    if (!presets.length) return undefined;

    const payload = buildWorkflowPresetExportPayload(presets, {
      defaultPresetId,
    });
    downloadJson("wstv-workflow-presets.json", payload);
    return stringifyWorkflowPresetExportPayload(payload);
  }

  function importPresetsFromJson(jsonText: string) {
    const report = mergeWorkflowPresetImportJson(presets, jsonText, {
      currentDefaultPresetId: defaultPresetId,
      preserveImportedDefaultWhenEmpty: true,
    });

    if (report.importedCount > 0 || report.skippedCount > 0) {
      persistPresets(report.presets, report.defaultPresetId);
    }

    const parts = [
      report.importedCount
        ? `Imported ${report.importedCount} preset${
            report.importedCount === 1 ? "" : "s"
          }.`
        : "No presets imported.",
      report.renamedCount
        ? `${report.renamedCount} name collision${
            report.renamedCount === 1 ? "" : "s"
          } adjusted.`
        : "",
      report.regeneratedIdCount
        ? `${report.regeneratedIdCount} id collision${
            report.regeneratedIdCount === 1 ? "" : "s"
          } resolved.`
        : "",
      report.skippedCount
        ? `${report.skippedCount} invalid entr${
            report.skippedCount === 1 ? "y was" : "ies were"
          } skipped.`
        : "",
      ...report.warnings,
    ].filter(Boolean);

    setImportStatus(parts.join(" "));
    return report;
  }

  return {
    presets,
    activePreset,
    activePresetId,
    activePresetIsDirty,
    defaultPresetId,
    presetName,
    importStatus,
    suggestedPresetName: buildWorkflowPresetName(currentSnapshot),
    setPresetName,
    saveCurrentAsPreset,
    updatePresetFromCurrent,
    loadPreset,
    deletePreset,
    setPresetAsDefault,
    clearDefaultPreset,
    exportPreset,
    exportAllPresets,
    importPresetsFromJson,
  };
}
