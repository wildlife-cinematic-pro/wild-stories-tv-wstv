"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  readDefaultWorkflowPresetId,
  readWorkflowPresets,
  hasShareStateInUrl,
  writeDefaultWorkflowPresetId,
  writeWorkflowPresets,
} from "@/lib/storage";
import {
  areWorkflowPresetSnapshotsEqual,
  buildWorkflowPresetName,
  createWorkflowPreset,
  deleteWorkflowPreset,
  getSafeDefaultWorkflowPresetId,
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

  return {
    presets,
    activePreset,
    activePresetId,
    activePresetIsDirty,
    defaultPresetId,
    presetName,
    suggestedPresetName: buildWorkflowPresetName(currentSnapshot),
    setPresetName,
    saveCurrentAsPreset,
    updatePresetFromCurrent,
    loadPreset,
    deletePreset,
    setPresetAsDefault,
    clearDefaultPreset,
  };
}
