"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  readWorkflowPresetCloudSession,
  readDefaultWorkflowPresetId,
  readWorkflowPresetPacks,
  readWorkflowPresets,
  downloadJson,
  hasShareStateInUrl,
  writeWorkflowPresetCloudSession,
  writeDefaultWorkflowPresetId,
  writeWorkflowPresetPacks,
  writeWorkflowPresets,
} from "@/lib/storage";
import {
  fetchCloudPresetLibrary,
  saveCloudPresetLibrary,
} from "@/lib/cloud-preset-library";
import {
  areWorkflowPresetSnapshotsEqual,
  buildWorkflowPresetName,
  buildWorkflowPresetExportPayload,
  buildWorkflowPresetPackExportPayload,
  createWorkflowPreset,
  createWorkflowPresetPack,
  deleteWorkflowPreset,
  deleteWorkflowPresetPack,
  getSafeDefaultWorkflowPresetId,
  mergeWorkflowPresetImport,
  mergeWorkflowPresetImportJson,
  mergeWorkflowPresetPackImportJson,
  stringifyWorkflowPresetExportPayload,
  stringifyWorkflowPresetPackExportPayload,
  updateWorkflowPreset,
} from "@/lib/workflow-presets";
import {
  buildLocalOnlyCloudPresetLibrary,
  getCloudPresetLibraryFingerprint,
  mergeCloudPresetLibraries,
  normalizeCloudAccountId,
} from "@/lib/workflow-preset-sync";
import type {
  BuildWorkflowPresetSnapshot,
  WorkflowPresetCloudSyncState,
  SavedWorkflowPreset,
  SavedWorkflowPresetPack,
} from "@/types";

type UseWorkflowPresetsInput = {
  currentSnapshot: BuildWorkflowPresetSnapshot;
  onLoadPreset: (preset: SavedWorkflowPreset) => void;
};

type CloudSyncStatus = {
  state: WorkflowPresetCloudSyncState;
  message: string;
  lastSyncedAt?: string;
};

function readInitialWorkflowPresetState() {
  const presets = readWorkflowPresets();
  const presetPacks = readWorkflowPresetPacks();
  const cloudSession = readWorkflowPresetCloudSession();
  const defaultPresetId = readDefaultWorkflowPresetId(presets);
  const defaultPreset = defaultPresetId
    ? presets.find((preset) => preset.id === defaultPresetId)
    : undefined;
  const shouldLoadDefault = Boolean(defaultPreset && !hasShareStateInUrl());

  return {
    presets,
    defaultPresetId,
    presetPacks,
    cloudSession,
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
  const [presetPacks, setPresetPacks] = useState<SavedWorkflowPresetPack[]>(
    initialState.presetPacks
  );
  const [activePresetId, setActivePresetId] = useState<string | null>(
    initialState.activePresetId
  );
  const [activePresetPackId, setActivePresetPackId] = useState<string | null>(
    null
  );
  const [defaultPresetId, setDefaultPresetId] = useState<string | undefined>(
    initialState.defaultPresetId
  );
  const [presetName, setPresetName] = useState(initialState.presetName);
  const [importStatus, setImportStatus] = useState("");
  const [packName, setPackName] = useState("");
  const [packDescription, setPackDescription] = useState("");
  const [packTagsText, setPackTagsText] = useState("");
  const [packStatus, setPackStatus] = useState("");
  const [cloudAccountIdInput, setCloudAccountIdInput] = useState(
    initialState.cloudSession?.accountId ?? ""
  );
  const [connectedCloudAccountId, setConnectedCloudAccountId] = useState<
    string | undefined
  >(initialState.cloudSession?.accountId);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>(() =>
    initialState.cloudSession?.accountId
      ? {
          state: "syncing",
          message: `Checking cloud library for ${initialState.cloudSession.accountId}...`,
        }
      : {
          state: "local-only",
          message: "Local only. Connect a cloud account ID to sync presets across devices.",
        }
  );
  const loadPresetRef = useRef(onLoadPreset);
  const didApplyDefaultRef = useRef(false);
  const initialDefaultPresetRef = useRef(initialState.defaultPresetToLoad);
  const hasHydratedCloudRef = useRef(false);
  const isSyncingCloudRef = useRef(false);
  const lastSyncedFingerprintRef = useRef<string>("");

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

  function persistPresetPacks(nextPacks: SavedWorkflowPresetPack[]) {
    setPresetPacks(nextPacks);
    writeWorkflowPresetPacks(nextPacks);
  }

  const persistCloudLibraryLocally = useCallback(
    (
      nextPresets: SavedWorkflowPreset[],
      nextPresetPacks: SavedWorkflowPresetPack[],
      nextDefaultPresetId?: string
    ) => {
      const safeDefaultId = getSafeDefaultWorkflowPresetId(
        nextPresets,
        nextDefaultPresetId
      );
      setPresets(nextPresets);
      setPresetPacks(nextPresetPacks);
      setDefaultPresetId(safeDefaultId);
      writeWorkflowPresets(nextPresets);
      writeWorkflowPresetPacks(nextPresetPacks);
      writeDefaultWorkflowPresetId(safeDefaultId);
    },
    []
  );

  const buildCurrentCloudLibrary = useCallback(
    (accountId: string) =>
      buildLocalOnlyCloudPresetLibrary(accountId, {
        presets,
        presetPacks,
        defaultPresetId,
      }),
    [defaultPresetId, presetPacks, presets]
  );

  const syncCloudLibrary = useCallback(
    async (mode: "hydrate" | "manual" | "auto" = "manual") => {
      const safeAccountId = normalizeCloudAccountId(connectedCloudAccountId);
      if (!safeAccountId) {
        setCloudSyncStatus({
          state: "local-only",
          message:
            "Local only. Connect a cloud account ID to sync presets across devices.",
        });
        return undefined;
      }

      if (isSyncingCloudRef.current) return undefined;
      isSyncingCloudRef.current = true;
      setCloudSyncStatus({
        state: "syncing",
        message:
          mode === "hydrate"
            ? `Hydrating cloud library for ${safeAccountId}...`
            : `Syncing cloud library for ${safeAccountId}...`,
      });

      const localLibrary = buildCurrentCloudLibrary(safeAccountId);
      const localFingerprint = getCloudPresetLibraryFingerprint(localLibrary);

      try {
        const cloudResult = await fetchCloudPresetLibrary(safeAccountId);
        if (!cloudResult.available) {
          hasHydratedCloudRef.current = true;
          setCloudSyncStatus({
            state: "local-only",
            message:
              cloudResult.message ??
              "Cloud sync is unavailable for this project right now. Local presets stay active.",
          });
          return undefined;
        }

        const mergeReport = mergeCloudPresetLibraries(
          localLibrary,
          cloudResult.library,
          { now: new Date().toISOString() }
        );
        const mergedFingerprint = getCloudPresetLibraryFingerprint(
          mergeReport.library
        );
        const cloudFingerprint = cloudResult.library
          ? getCloudPresetLibraryFingerprint(cloudResult.library)
          : "";

        if (
          mergedFingerprint !== localFingerprint ||
          mergeReport.library.defaultPresetId !== defaultPresetId
        ) {
          persistCloudLibraryLocally(
            mergeReport.library.presets,
            mergeReport.library.presetPacks,
            mergeReport.library.defaultPresetId
          );
        }

        let finalLibrary = mergeReport.library;
        if (!cloudResult.library || mergedFingerprint !== cloudFingerprint) {
          const saveResult = await saveCloudPresetLibrary(
            safeAccountId,
            mergeReport.library
          );
          if (!saveResult.available) {
            hasHydratedCloudRef.current = true;
            setCloudSyncStatus({
              state: "local-only",
              message:
                saveResult.message ??
                "Cloud sync is unavailable for this project right now. Local presets stay active.",
            });
            return undefined;
          }
          if (saveResult.library) {
            finalLibrary = saveResult.library;
          }
        }

        lastSyncedFingerprintRef.current =
          getCloudPresetLibraryFingerprint(finalLibrary);
        hasHydratedCloudRef.current = true;
        setCloudSyncStatus({
          state: mergeReport.conflictResolved ? "conflict-resolved" : "synced",
          message: mergeReport.conflictResolved
            ? `Cloud sync merged local and cloud changes for ${safeAccountId}.`
            : `Synced preset library for ${safeAccountId}.`,
          lastSyncedAt: finalLibrary.updatedAt,
        });
        return finalLibrary;
      } catch (error) {
        hasHydratedCloudRef.current = true;
        setCloudSyncStatus({
          state: "sync-error",
          message:
            error instanceof Error
              ? error.message
              : "Cloud sync failed. Local presets remain available.",
        });
        return undefined;
      } finally {
        isSyncingCloudRef.current = false;
      }
    },
    [
      buildCurrentCloudLibrary,
      connectedCloudAccountId,
      defaultPresetId,
      persistCloudLibraryLocally,
    ]
  );

  const connectCloudLibrary = useCallback(
    async (accountIdOverride?: string) => {
      const safeAccountId = normalizeCloudAccountId(
        accountIdOverride ?? cloudAccountIdInput
      );
      if (!safeAccountId) {
        setCloudSyncStatus({
          state: "sync-error",
          message:
            "Enter a cloud account ID with at least 3 characters to sync presets.",
        });
        return undefined;
      }

      const session = {
        accountId: safeAccountId,
        connectedAt: new Date().toISOString(),
      };
      setConnectedCloudAccountId(safeAccountId);
      setCloudAccountIdInput(safeAccountId);
      writeWorkflowPresetCloudSession(session);
      hasHydratedCloudRef.current = false;
      lastSyncedFingerprintRef.current = "";
      return safeAccountId;
    },
    [cloudAccountIdInput]
  );

  const disconnectCloudLibrary = useCallback(() => {
    setConnectedCloudAccountId(undefined);
    writeWorkflowPresetCloudSession(undefined);
    hasHydratedCloudRef.current = false;
    lastSyncedFingerprintRef.current = "";
    setCloudSyncStatus({
      state: "local-only",
      message:
        "Local only. Connect a cloud account ID to sync presets across devices.",
    });
  }, []);

  useEffect(() => {
    if (didApplyDefaultRef.current) return;
    didApplyDefaultRef.current = true;
    const defaultPreset = initialDefaultPresetRef.current;
    if (defaultPreset) loadPresetRef.current(defaultPreset);
  }, []);

  useEffect(() => {
    if (!connectedCloudAccountId || hasHydratedCloudRef.current) return;
    void syncCloudLibrary("hydrate");
  }, [connectedCloudAccountId, syncCloudLibrary]);

  useEffect(() => {
    const safeAccountId = normalizeCloudAccountId(connectedCloudAccountId);
    if (!safeAccountId || !hasHydratedCloudRef.current) return;

    const fingerprint = getCloudPresetLibraryFingerprint(
      buildCurrentCloudLibrary(safeAccountId)
    );
    if (!lastSyncedFingerprintRef.current) {
      lastSyncedFingerprintRef.current = fingerprint;
      return;
    }

    if (fingerprint === lastSyncedFingerprintRef.current) return;
    const timeoutId = window.setTimeout(() => {
      void syncCloudLibrary("auto");
    }, 600);

    return () => window.clearTimeout(timeoutId);
  }, [
    buildCurrentCloudLibrary,
    connectedCloudAccountId,
    defaultPresetId,
    presetPacks,
    presets,
    syncCloudLibrary,
  ]);

  const activePreset = useMemo(
    () =>
      activePresetId
        ? presets.find((preset) => preset.id === activePresetId)
        : undefined,
    [activePresetId, presets]
  );

  const activePresetPack = useMemo(
    () =>
      activePresetPackId
        ? presetPacks.find((pack) => pack.id === activePresetPackId)
        : undefined,
    [activePresetPackId, presetPacks]
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

  function parsePackTags(value: string): string[] {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 8);
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

  function createPresetPackFromSelection(
    presetIds: string[],
    options: { name?: string; description?: string; tagsText?: string } = {}
  ): SavedWorkflowPresetPack | undefined {
    const selectedPresets = presetIds
      .map((id) => presets.find((preset) => preset.id === id))
      .filter((preset): preset is SavedWorkflowPreset => Boolean(preset));
    if (!selectedPresets.length) {
      setPackStatus("Choose at least one saved preset before creating a pack.");
      return undefined;
    }

    const pack = createWorkflowPresetPack(selectedPresets, {
      name: options.name || packName || "Untitled Preset Pack",
      description: options.description ?? packDescription,
      tags: parsePackTags(options.tagsText ?? packTagsText),
    });
    const nextPacks = [pack, ...presetPacks].slice(0, 24);
    persistPresetPacks(nextPacks);
    setActivePresetPackId(pack.id);
    setPackName(pack.name);
    setPackDescription(pack.description);
    setPackTagsText((pack.tags ?? []).join(", "));
    setPackStatus(
      `Created ${pack.name} with ${pack.presets.length} preset${
        pack.presets.length === 1 ? "" : "s"
      }.`
    );
    return pack;
  }

  function deletePresetPack(id: string): void {
    const nextPacks = deleteWorkflowPresetPack(presetPacks, id);
    persistPresetPacks(nextPacks);
    if (activePresetPackId === id) {
      setActivePresetPackId(null);
      setPackName("");
      setPackDescription("");
      setPackTagsText("");
    }
    setPackStatus("Preset pack deleted.");
  }

  function exportPresetPack(id: string): string | undefined {
    const pack = presetPacks.find((item) => item.id === id);
    if (!pack) return undefined;

    const payload = buildWorkflowPresetPackExportPayload(pack);
    if (!payload) return undefined;

    downloadJson(buildExportFilename(`wstv-preset-pack-${pack.name}`), payload);
    return stringifyWorkflowPresetPackExportPayload(payload);
  }

  function importPresetPackFromJson(jsonText: string) {
    const report = mergeWorkflowPresetPackImportJson(presetPacks, jsonText);
    if (report.importedCount > 0 || report.skippedCount > 0) {
      persistPresetPacks(report.packs);
    }
    if (report.importedPack) {
      setActivePresetPackId(report.importedPack.id);
      setPackName(report.importedPack.name);
      setPackDescription(report.importedPack.description);
      setPackTagsText((report.importedPack.tags ?? []).join(", "));
    }

    const parts = [
      report.importedCount
        ? `Imported ${report.importedPack?.name ?? "preset pack"}.`
        : "No preset pack imported.",
      report.renamedCount ? "Pack name collision adjusted." : "",
      report.regeneratedIdCount ? "Pack id collision resolved." : "",
      report.skippedCount ? "Invalid pack data was skipped." : "",
      ...report.warnings,
    ].filter(Boolean);

    setPackStatus(parts.join(" "));
    return report;
  }

  function applyPresetPack(id: string) {
    const pack = presetPacks.find((item) => item.id === id);
    if (!pack) {
      setPackStatus("Choose a preset pack before applying it.");
      return undefined;
    }

    const report = mergeWorkflowPresetImport(presets, pack.presets, {
      currentDefaultPresetId: defaultPresetId,
      preserveImportedDefaultWhenEmpty: false,
    });
    if (report.importedCount > 0 || report.skippedCount > 0) {
      persistPresets(report.presets, report.defaultPresetId);
    }

    const parts = [
      report.importedCount
        ? `Applied ${report.importedCount} preset${
            report.importedCount === 1 ? "" : "s"
          } from ${pack.name}.`
        : "No presets applied from this pack.",
      report.renamedCount
        ? `${report.renamedCount} preset name collision${
            report.renamedCount === 1 ? "" : "s"
          } adjusted.`
        : "",
      report.regeneratedIdCount
        ? `${report.regeneratedIdCount} preset id collision${
            report.regeneratedIdCount === 1 ? "" : "s"
          } resolved.`
        : "",
      report.skippedCount
        ? `${report.skippedCount} invalid preset entr${
            report.skippedCount === 1 ? "y was" : "ies were"
          } skipped.`
        : "",
      ...report.warnings,
    ].filter(Boolean);

    setPackStatus(parts.join(" "));
    return report;
  }

  return {
    presets,
    presetPacks,
    activePreset,
    activePresetId,
    activePresetPack,
    activePresetPackId,
    activePresetIsDirty,
    defaultPresetId,
    presetName,
    importStatus,
    packName,
    packDescription,
    packTagsText,
    packStatus,
    cloudAccountIdInput,
    connectedCloudAccountId,
    cloudSyncStatus,
    suggestedPresetName: buildWorkflowPresetName(currentSnapshot),
    setPresetName,
    setPackName,
    setPackDescription,
    setPackTagsText,
    setActivePresetPackId,
    setCloudAccountIdInput,
    saveCurrentAsPreset,
    updatePresetFromCurrent,
    loadPreset,
    deletePreset,
    setPresetAsDefault,
    clearDefaultPreset,
    exportPreset,
    exportAllPresets,
    importPresetsFromJson,
    createPresetPackFromSelection,
    deletePresetPack,
    exportPresetPack,
    importPresetPackFromJson,
    applyPresetPack,
    connectCloudLibrary,
    disconnectCloudLibrary,
    syncCloudLibrary,
  };
}
