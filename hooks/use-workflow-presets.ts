"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  readDefaultWorkflowPresetId,
  readLastGeneratedOutput,
  readWorkflowPresetLibrarySelection,
  readWorkflowPresetPacks,
  readWorkflowPresets,
  downloadJson,
  hasShareStateInUrl,
  readShareState,
  shareStateMatchesWorkflowSnapshot,
  writeDefaultWorkflowPresetId,
  writeWorkflowPresetLibrarySelection,
  writeWorkflowPresetPacks,
  writeWorkflowPresets,
} from "@/lib/storage";
import {
  createSharedPresetLibrary,
  fetchPresetLibraryCatalog,
  fetchPresetLibrarySession,
  removeSharedPresetLibraryMember,
  savePresetLibrary,
  signInPresetLibraryUser,
  signOutPresetLibraryUser,
  signUpPresetLibraryUser,
  upsertSharedPresetLibraryMember,
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
  buildPersonalCloudLibraryId,
  buildPersonalWorkflowPresetLibraryRecord,
  createCloudPresetLibrary,
  getCloudPresetLibraryFingerprint,
  mergeCloudPresetLibraries,
} from "@/lib/workflow-preset-sync";
import type {
  BuildWorkflowPresetSnapshot,
  CloudPresetLibrary,
  WorkflowPresetAuthSession,
  WorkflowPresetCloudSyncState,
  WorkflowPresetLibraryRecord,
  WorkflowPresetLibraryRole,
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

const PERSONAL_LIBRARY_SELECTION_ID = "personal";
const LOCAL_PERSONAL_LIBRARY_ID = "local-personal";

function readInitialWorkflowPresetState() {
  const presets = readWorkflowPresets();
  const presetPacks = readWorkflowPresetPacks();
  const defaultPresetId = readDefaultWorkflowPresetId(presets);
  const defaultPreset = defaultPresetId
    ? presets.find((preset) => preset.id === defaultPresetId)
    : undefined;
  const sharedState = readShareState();
  const hasSharedState = hasShareStateInUrl();
  const restoredOutput = readLastGeneratedOutput();
  const shouldPreferRestoredOutput = Boolean(
    restoredOutput &&
      (!hasSharedState ||
        shareStateMatchesWorkflowSnapshot(sharedState, restoredOutput.snapshot))
  );
  const shouldLoadDefault = Boolean(
    defaultPreset && !hasSharedState && !shouldPreferRestoredOutput
  );

  return {
    personalLibrary: buildLocalOnlyCloudPresetLibrary(LOCAL_PERSONAL_LIBRARY_ID, {
      presets,
      presetPacks,
      defaultPresetId,
    }),
    selectedLibraryId:
      readWorkflowPresetLibrarySelection() ?? PERSONAL_LIBRARY_SELECTION_ID,
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

  const [personalLibrary, setPersonalLibrary] = useState<CloudPresetLibrary>(
    initialState.personalLibrary
  );
  const [sharedLibraries, setSharedLibraries] = useState<WorkflowPresetLibraryRecord[]>(
    []
  );
  const [selectedLibraryId, setSelectedLibraryId] = useState<string>(
    initialState.selectedLibraryId
  );
  const [authSession, setAuthSession] = useState<WorkflowPresetAuthSession | null>(
    null
  );
  const [activePresetId, setActivePresetId] = useState<string | null>(
    initialState.activePresetId
  );
  const [activePresetPackId, setActivePresetPackId] = useState<string | null>(null);
  const [presetName, setPresetName] = useState(initialState.presetName);
  const [presetStatus, setPresetStatus] = useState("");
  const [importStatus, setImportStatus] = useState("");
  const [packName, setPackName] = useState("");
  const [packDescription, setPackDescription] = useState("");
  const [packTagsText, setPackTagsText] = useState("");
  const [packStatus, setPackStatus] = useState("");
  const [authEmailInput, setAuthEmailInput] = useState("");
  const [authPasswordInput, setAuthPasswordInput] = useState("");
  const [authDisplayNameInput, setAuthDisplayNameInput] = useState("");
  const [sharedLibraryNameInput, setSharedLibraryNameInput] = useState("");
  const [sharedLibraryDescriptionInput, setSharedLibraryDescriptionInput] =
    useState("");
  const [sharedMemberEmailInput, setSharedMemberEmailInput] = useState("");
  const [sharedMemberRole, setSharedMemberRole] =
    useState<WorkflowPresetLibraryRole>("viewer");
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>({
    state: "local-only",
    message:
      "Working locally on this device. Sign in to sync My Library, or export JSON for backup anytime.",
  });
  const loadPresetRef = useRef(onLoadPreset);
  const didApplyDefaultRef = useRef(false);
  const initialDefaultPresetRef = useRef(initialState.defaultPresetToLoad);
  const syncTimeoutsRef = useRef<Record<string, number>>({});
  const hasLoadedSessionRef = useRef(false);

  useEffect(() => {
    loadPresetRef.current = onLoadPreset;
  }, [onLoadPreset]);

  function persistLocalPersonalLibrary(nextLibrary: CloudPresetLibrary) {
    const safeDefaultId = getSafeDefaultWorkflowPresetId(
      nextLibrary.presets,
      nextLibrary.defaultPresetId
    );
    const normalizedLibrary = createCloudPresetLibrary(
      nextLibrary.libraryId,
      {
        presets: nextLibrary.presets,
        presetPacks: nextLibrary.presetPacks,
        defaultPresetId: safeDefaultId,
        updatedAt: nextLibrary.updatedAt,
      }
    );
    setPersonalLibrary(normalizedLibrary);
    writeWorkflowPresets(normalizedLibrary.presets);
    writeWorkflowPresetPacks(normalizedLibrary.presetPacks);
    writeDefaultWorkflowPresetId(normalizedLibrary.defaultPresetId);
  }

  const personalLibraryRecord = useMemo<WorkflowPresetLibraryRecord>(() => {
    if (authSession) {
      return {
        ...buildPersonalWorkflowPresetLibraryRecord(authSession.user, {
          ...personalLibrary,
          libraryId: buildPersonalCloudLibraryId(authSession.user.id),
        }),
        id: PERSONAL_LIBRARY_SELECTION_ID,
      };
    }

    return {
      id: PERSONAL_LIBRARY_SELECTION_ID,
      scope: "personal",
      name: "My Library",
      description: "Local preset library stored on this device.",
      createdAt: personalLibrary.updatedAt,
      updatedAt: personalLibrary.updatedAt,
      role: "owner",
      canWrite: true,
      canManage: false,
      data: personalLibrary,
    };
  }, [authSession, personalLibrary]);

  const availableLibraries = useMemo(
    () => [personalLibraryRecord, ...sharedLibraries],
    [personalLibraryRecord, sharedLibraries]
  );

  const activeLibrary = useMemo(
    () =>
      availableLibraries.find((library) => library.id === selectedLibraryId) ??
      personalLibraryRecord,
    [availableLibraries, personalLibraryRecord, selectedLibraryId]
  );

  const presets = activeLibrary.data.presets;
  const presetPacks = activeLibrary.data.presetPacks;
  const defaultPresetId = activeLibrary.data.defaultPresetId;
  const activeLibraryCanWrite =
    activeLibrary.scope === "personal" ? true : Boolean(activeLibrary.canWrite);
  const activeLibraryCanManage =
    activeLibrary.scope === "personal" ? false : Boolean(activeLibrary.canManage);

  function getLibraryLabel(library: WorkflowPresetLibraryRecord = activeLibrary): string {
    return library.scope === "personal" ? "My Library" : library.name;
  }

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

  const suggestedPresetName = buildWorkflowPresetName(currentSnapshot);

  const replaceSharedLibrary = useCallback(
    (nextLibrary: WorkflowPresetLibraryRecord) => {
      setSharedLibraries((current) => {
        const next = current.some((library) => library.id === nextLibrary.id)
          ? current.map((library) =>
              library.id === nextLibrary.id ? nextLibrary : library
            )
          : [nextLibrary, ...current];
        return next.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      });
    },
    []
  );

  const hydrateCloudCatalog = useCallback(
    async (session: WorkflowPresetAuthSession) => {
      setCloudSyncStatus({
        state: "authenticating",
        message: `Loading preset libraries for ${session.user.email}...`,
      });

      const catalogResult = await fetchPresetLibraryCatalog();
      if (!catalogResult.available) {
        setCloudSyncStatus({
          state: "local-only",
          message:
            catalogResult.message ??
            "Cloud libraries are unavailable. Local presets remain active.",
        });
        return;
      }

      if (!catalogResult.data) {
        setCloudSyncStatus({
          state: "local-only",
          message:
            catalogResult.message ??
            "Signed in. My Library will sync automatically when you save presets.",
        });
        setSharedLibraries([]);
        return;
      }

      const localPersonal = createCloudPresetLibrary(
        buildPersonalCloudLibraryId(session.user.id),
        {
          presets: personalLibrary.presets,
          presetPacks: personalLibrary.presetPacks,
          defaultPresetId: personalLibrary.defaultPresetId,
          updatedAt: personalLibrary.updatedAt,
        }
      );
      const mergeReport = mergeCloudPresetLibraries(
        localPersonal,
        catalogResult.data.personalLibrary.data,
        { now: new Date().toISOString() }
      );
      persistLocalPersonalLibrary(mergeReport.library);
      setSharedLibraries(catalogResult.data.sharedLibraries);

      if (
        getCloudPresetLibraryFingerprint(mergeReport.library) !==
        getCloudPresetLibraryFingerprint(catalogResult.data.personalLibrary.data)
      ) {
        const saveResult = await savePresetLibrary(undefined, mergeReport.library);
        if (saveResult.available && saveResult.data) {
          persistLocalPersonalLibrary(saveResult.data.data);
        }
      }

      setCloudSyncStatus({
        state: mergeReport.conflictResolved ? "conflict-resolved" : "synced",
        message: mergeReport.conflictResolved
          ? `My Library synced and merged local/cloud changes for ${session.user.email}.`
          : `My Library synced for ${session.user.email}. Local presets stay available on this device.`,
        lastSyncedAt: mergeReport.library.updatedAt,
      });
    },
    [personalLibrary]
  );

  useEffect(() => {
    if (didApplyDefaultRef.current) return;
    didApplyDefaultRef.current = true;
    const defaultPreset = initialDefaultPresetRef.current;
    if (defaultPreset) loadPresetRef.current(defaultPreset);
  }, []);

  useEffect(() => {
    writeWorkflowPresetLibrarySelection(activeLibrary.id);
  }, [activeLibrary.id]);

  useEffect(() => {
    if (hasLoadedSessionRef.current) return;
    hasLoadedSessionRef.current = true;

    void (async () => {
      try {
        const sessionResult = await fetchPresetLibrarySession();
        if (!sessionResult.available) {
          setCloudSyncStatus({
            state: "local-only",
            message:
              sessionResult.message ??
              "Cloud libraries are unavailable. Local presets remain active.",
          });
          return;
        }

        if (!sessionResult.data) {
          setCloudSyncStatus({
            state: "local-only",
            message:
              sessionResult.message ??
              "Signed out. My Library stays local on this device. Sign in when you want cloud sync.",
          });
          return;
        }

        setAuthSession(sessionResult.data);
        await hydrateCloudCatalog(sessionResult.data);
      } catch (error) {
        setCloudSyncStatus({
          state: "sync-error",
          message:
            error instanceof Error
              ? error.message
              : "Cloud preset library could not be loaded. Local presets remain active.",
        });
      }
    })();
  }, [hydrateCloudCatalog]);

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

  async function syncLibraryNow(
    target: "personal" | WorkflowPresetLibraryRecord,
    mode: "manual" | "auto" = "manual"
  ) {
    if (!authSession) {
      setCloudSyncStatus({
        state: "local-only",
        message: "Sign in to sync My Library.",
      });
      return undefined;
    }

    const libraryId = target === "personal" ? undefined : target.id;
    const libraryData = target === "personal" ? personalLibrary : target.data;
    setCloudSyncStatus({
      state: "syncing",
      message:
        mode === "manual"
          ? target === "personal"
            ? "Syncing My Library..."
            : `Syncing ${target.name} library...`
          : target === "personal"
            ? "Saving My Library changes..."
            : `Saving ${target.name} changes...`,
    });

    try {
      const result = await savePresetLibrary(libraryId, libraryData);
      if (!result.available) {
        setCloudSyncStatus({
          state: "local-only",
          message:
            result.message ??
            "Cloud libraries are unavailable. Local presets remain active.",
        });
        return undefined;
      }

      if (result.data) {
        if (target === "personal") {
          persistLocalPersonalLibrary(result.data.data);
        } else {
          replaceSharedLibrary(result.data);
        }
      }

      setCloudSyncStatus({
        state: "synced",
        message:
          result.message ??
          (target === "personal"
            ? "My Library synced."
            : `${target.name} library synced.`),
        lastSyncedAt: result.data?.updatedAt ?? result.data?.data.updatedAt,
      });
      return result.data;
    } catch (error) {
      setCloudSyncStatus({
        state: "sync-error",
        message:
          error instanceof Error
            ? error.message
            : "Cloud sync failed. Your local presets are still safe on this device.",
      });
      return undefined;
    }
  }

  function queueLibrarySync(
    target: "personal" | WorkflowPresetLibraryRecord,
    nextData: CloudPresetLibrary
  ) {
    if (!authSession) return;
    const syncKey = target === "personal" ? PERSONAL_LIBRARY_SELECTION_ID : target.id;
    if (syncTimeoutsRef.current[syncKey]) {
      window.clearTimeout(syncTimeoutsRef.current[syncKey]);
    }

    syncTimeoutsRef.current[syncKey] = window.setTimeout(() => {
      void syncLibraryNow(
        target === "personal" ? "personal" : { ...target, data: nextData },
        "auto"
      );
    }, 650);
  }

  function updateActiveLibraryData(
    nextData: CloudPresetLibrary,
    options: { sync?: boolean } = {}
  ) {
    const shouldSync = options.sync ?? true;

    if (activeLibrary.scope === "personal") {
      persistLocalPersonalLibrary(nextData);
      if (shouldSync) {
        queueLibrarySync("personal", nextData);
      }
      return;
    }

    if (!activeLibraryCanWrite) {
      setCloudSyncStatus({
        state: "sync-error",
        message:
          "Viewer access can browse, load, apply, and export, but cannot change this shared library.",
      });
      return;
    }

    const nextLibrary: WorkflowPresetLibraryRecord = {
      ...activeLibrary,
      updatedAt: nextData.updatedAt,
      data: nextData,
    };
    replaceSharedLibrary(nextLibrary);
    if (shouldSync) {
      queueLibrarySync(nextLibrary, nextData);
    }
  }

  function saveCurrentAsPreset(nameOverride?: string): SavedWorkflowPreset | undefined {
    if (!activeLibraryCanWrite) {
      setImportStatus("Viewer access cannot save presets in this shared library.");
      return undefined;
    }

    const preset = createWorkflowPreset(currentSnapshot, {
      name: nameOverride ?? presetName,
    });
    const nextData = createCloudPresetLibrary(activeLibrary.data.libraryId, {
      presets: [preset, ...presets].slice(0, 40),
      presetPacks,
      defaultPresetId,
    });
    updateActiveLibraryData(nextData);
    setActivePresetId(preset.id);
    setPresetName(preset.name);
    setPresetStatus(`Saved ${preset.name} to ${getLibraryLabel()}.`);
    return preset;
  }

  function updatePresetFromCurrent(
    id = activePresetId ?? "",
    nameOverride?: string
  ): SavedWorkflowPreset | undefined {
    if (!activeLibraryCanWrite) {
      setImportStatus("Viewer access cannot update presets in this shared library.");
      return undefined;
    }

    const target = presets.find((preset) => preset.id === id);
    if (!target) return undefined;

    const nextPresets = updateWorkflowPreset(presets, target.id, currentSnapshot, {
      name: nameOverride ?? presetName,
    });
    const nextData = createCloudPresetLibrary(activeLibrary.data.libraryId, {
      presets: nextPresets,
      presetPacks,
      defaultPresetId,
    });
    updateActiveLibraryData(nextData);
    const updated = nextPresets.find((preset) => preset.id === target.id);
    setActivePresetId(target.id);
    setPresetName(updated?.name ?? target.name);
    setPresetStatus(`Updated ${updated?.name ?? target.name} in ${getLibraryLabel()}.`);
    return updated;
  }

  function loadPreset(id: string): SavedWorkflowPreset | undefined {
    const preset = presets.find((item) => item.id === id);
    if (!preset) return undefined;

    loadPresetRef.current(preset);
    setActivePresetId(preset.id);
    setPresetName(preset.name);
    setPresetStatus(`Loaded ${preset.name} from ${getLibraryLabel()} into the main workflow.`);
    return preset;
  }

  function deletePreset(id: string): void {
    if (!activeLibraryCanWrite) {
      setImportStatus("Viewer access cannot delete presets in this shared library.");
      return;
    }

    const deletedPreset = presets.find((preset) => preset.id === id);
    const nextPresets = deleteWorkflowPreset(presets, id);
    const nextDefaultId = defaultPresetId === id ? undefined : defaultPresetId;
    const nextData = createCloudPresetLibrary(activeLibrary.data.libraryId, {
      presets: nextPresets,
      presetPacks,
      defaultPresetId: nextDefaultId,
    });
    updateActiveLibraryData(nextData);

    if (activePresetId === id) {
      setActivePresetId(null);
      setPresetName(buildWorkflowPresetName(currentSnapshot));
    }

    if (deletedPreset) {
      setPresetStatus(`Deleted ${deletedPreset.name} from ${getLibraryLabel()}.`);
    }
  }

  function setPresetAsDefault(id: string): void {
    if (!activeLibraryCanWrite) {
      setImportStatus("Viewer access cannot change the default preset in this shared library.");
      return;
    }

    const preset = presets.find((item) => item.id === id);
    if (!preset) return;

    const safeDefaultId = getSafeDefaultWorkflowPresetId(presets, id);
    const nextData = createCloudPresetLibrary(activeLibrary.data.libraryId, {
      presets,
      presetPacks,
      defaultPresetId: safeDefaultId,
    });
    updateActiveLibraryData(nextData);
    setPresetStatus(`Set ${preset.name} as the default preset for ${getLibraryLabel()}.`);
  }

  function clearDefaultPreset(): void {
    if (!activeLibraryCanWrite) {
      setImportStatus("Viewer access cannot change the default preset in this shared library.");
      return;
    }

    const nextData = createCloudPresetLibrary(activeLibrary.data.libraryId, {
      presets,
      presetPacks,
    });
    updateActiveLibraryData(nextData);
    setPresetStatus(`Cleared the default preset for ${getLibraryLabel()}.`);
  }

  function exportPreset(id: string): string | undefined {
    const preset = presets.find((item) => item.id === id);
    if (!preset) return undefined;

    const payload = buildWorkflowPresetExportPayload([preset], {
      defaultPresetId: defaultPresetId === id ? id : undefined,
    });
    downloadJson(buildExportFilename(`wstv-preset-${preset.name}`), payload);
    setPresetStatus(`Downloaded ${preset.name} as portable JSON.`);
    return stringifyWorkflowPresetExportPayload(payload);
  }

  function exportAllPresets(): string | undefined {
    if (!presets.length) return undefined;

    const payload = buildWorkflowPresetExportPayload(presets, {
      defaultPresetId,
    });
    downloadJson("wstv-workflow-presets.json", payload);
    setPresetStatus(`Downloaded all presets from ${getLibraryLabel()}.`);
    return stringifyWorkflowPresetExportPayload(payload);
  }

  function importPresetsFromJson(jsonText: string) {
    if (!activeLibraryCanWrite) {
      setImportStatus("Viewer access cannot import presets into this shared library.");
      return undefined;
    }

    const report = mergeWorkflowPresetImportJson(presets, jsonText, {
      currentDefaultPresetId: defaultPresetId,
      preserveImportedDefaultWhenEmpty: true,
    });

    if (report.importedCount > 0 || report.skippedCount > 0) {
      const nextData = createCloudPresetLibrary(activeLibrary.data.libraryId, {
        presets: report.presets,
        presetPacks,
        defaultPresetId: report.defaultPresetId,
      });
      updateActiveLibraryData(nextData);
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
    if (!activeLibraryCanWrite) {
      setPackStatus("Viewer access cannot create preset packs in this shared library.");
      return undefined;
    }

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
    const nextData = createCloudPresetLibrary(activeLibrary.data.libraryId, {
      presets,
      presetPacks: [pack, ...presetPacks].slice(0, 24),
      defaultPresetId,
    });
    updateActiveLibraryData(nextData);
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
    if (!activeLibraryCanWrite) {
      setPackStatus("Viewer access cannot delete preset packs in this shared library.");
      return;
    }

    const nextPacks = deleteWorkflowPresetPack(presetPacks, id);
    const nextData = createCloudPresetLibrary(activeLibrary.data.libraryId, {
      presets,
      presetPacks: nextPacks,
      defaultPresetId,
    });
    updateActiveLibraryData(nextData);
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
    if (!activeLibraryCanWrite) {
      setPackStatus("Viewer access cannot import preset packs into this shared library.");
      return undefined;
    }

    const report = mergeWorkflowPresetPackImportJson(presetPacks, jsonText);
    if (report.importedCount > 0 || report.skippedCount > 0) {
      const nextData = createCloudPresetLibrary(activeLibrary.data.libraryId, {
        presets,
        presetPacks: report.packs,
        defaultPresetId,
      });
      updateActiveLibraryData(nextData);
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

    const report = mergeWorkflowPresetImport(personalLibrary.presets, pack.presets, {
      currentDefaultPresetId: personalLibrary.defaultPresetId,
      preserveImportedDefaultWhenEmpty: false,
    });
    if (report.importedCount > 0 || report.skippedCount > 0) {
      const nextPersonal = createCloudPresetLibrary(personalLibrary.libraryId, {
        presets: report.presets,
        presetPacks: personalLibrary.presetPacks,
        defaultPresetId: report.defaultPresetId,
      });
      persistLocalPersonalLibrary(nextPersonal);
      if (authSession) {
        queueLibrarySync("personal", nextPersonal);
      }
    }

    const parts = [
      report.importedCount
        ? `Applied ${report.importedCount} preset${
            report.importedCount === 1 ? "" : "s"
          } from ${pack.name} to My Library.`
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

  function selectLibrary(libraryId: string) {
    setSelectedLibraryId(libraryId);
    setPresetStatus("");
  }

  function validateAuthInputs(action: "sign-in" | "sign-up") {
    const email = authEmailInput.trim();
    const password = authPasswordInput.trim();

    if (!email || !password) {
      setCloudSyncStatus({
        state: "sync-error",
        message:
          "Enter both email and password to sign in or create your preset library account.",
      });
      return null;
    }

    if (action === "sign-up" && password.length < 8) {
      setCloudSyncStatus({
        state: "sync-error",
        message: "Use a password with at least 8 characters to create an account.",
      });
      return null;
    }

    return { email, password };
  }

  async function signIn() {
    const authInput = validateAuthInputs("sign-in");
    if (!authInput) return;

    try {
      setCloudSyncStatus({
        state: "authenticating",
        message: "Signing in to My Library...",
      });
      const result = await signInPresetLibraryUser(authInput);
      if (!result.available || !result.data) {
        setCloudSyncStatus({
          state: "local-only",
          message:
            result.message ??
            "Cloud libraries are unavailable. Local presets remain active.",
        });
        return;
      }
      setAuthSession(result.data);
      setAuthPasswordInput("");
      await hydrateCloudCatalog(result.data);
    } catch (error) {
      setCloudSyncStatus({
        state: "sync-error",
        message:
          error instanceof Error ? error.message : "Sign-in failed.",
      });
    }
  }

  async function signUp() {
    const authInput = validateAuthInputs("sign-up");
    if (!authInput) return;

    try {
      setCloudSyncStatus({
        state: "authenticating",
        message: "Creating your preset library account...",
      });
      const result = await signUpPresetLibraryUser({
        ...authInput,
        displayName: authDisplayNameInput.trim() || undefined,
      });
      if (!result.available || !result.data) {
        setCloudSyncStatus({
          state: "local-only",
          message:
            result.message ??
            "Cloud libraries are unavailable. Local presets remain active.",
        });
        return;
      }
      setAuthSession(result.data);
      setAuthPasswordInput("");
      await hydrateCloudCatalog(result.data);
    } catch (error) {
      setCloudSyncStatus({
        state: "sync-error",
        message:
          error instanceof Error ? error.message : "Account creation failed.",
      });
    }
  }

  async function signOut() {
    try {
      await signOutPresetLibraryUser();
    } catch {
      // local fallback remains available regardless
    }

    setAuthSession(null);
    setAuthPasswordInput("");
    setAuthDisplayNameInput("");
    setSharedLibraryNameInput("");
    setSharedLibraryDescriptionInput("");
    setSharedMemberEmailInput("");
    setSharedMemberRole("viewer");
    setPresetStatus("");
    setSharedLibraries([]);
    selectLibrary(PERSONAL_LIBRARY_SELECTION_ID);
    setCloudSyncStatus({
      state: "local-only",
      message: "Signed out. My Library stays local on this device until you sign in again.",
    });
  }

  async function syncActiveLibrary() {
    if (!authSession) {
      setCloudSyncStatus({
        state: "local-only",
        message: "Sign in to sync My Library.",
      });
      return;
    }

    if (activeLibrary.scope === "personal") {
      await syncLibraryNow("personal");
      return;
    }

    if (!activeLibraryCanWrite) {
      setCloudSyncStatus({
        state: "sync-error",
        message:
          "Viewer access can browse and export this shared library, but cannot sync edits.",
      });
      return;
    }

    await syncLibraryNow(activeLibrary);
  }

  async function createSharedLibrary() {
    if (!authSession) {
      setCloudSyncStatus({
        state: "local-only",
        message: "Sign in to create a shared library.",
      });
      return;
    }

    try {
      const result = await createSharedPresetLibrary({
        name: sharedLibraryNameInput,
        description: sharedLibraryDescriptionInput,
      });
      if (!result.available || !result.data) {
        setCloudSyncStatus({
          state: "local-only",
          message:
            result.message ??
            "Cloud libraries are unavailable. Local presets remain active.",
        });
        return;
      }

      replaceSharedLibrary(result.data);
      selectLibrary(result.data.id);
      setSharedLibraryNameInput("");
      setSharedLibraryDescriptionInput("");
      const sharedLibraryMessage = result.message?.includes("You are the owner")
        ? result.message
        : `${result.message ?? `Created shared library ${result.data.name}.`} You are the owner.`;
      setCloudSyncStatus({
        state: "synced",
        message: sharedLibraryMessage,
        lastSyncedAt: result.data.updatedAt,
      });
    } catch (error) {
      setCloudSyncStatus({
        state: "sync-error",
        message:
          error instanceof Error
            ? error.message
            : "Shared library could not be created.",
      });
    }
  }

  async function saveSharedLibraryMember() {
    if (!activeLibraryCanManage || activeLibrary.scope !== "shared") {
      setCloudSyncStatus({
        state: "sync-error",
        message: "Only the shared library owner can manage access.",
      });
      return;
    }

    try {
      const result = await upsertSharedPresetLibraryMember({
        libraryId: activeLibrary.id,
        email: sharedMemberEmailInput,
        role: sharedMemberRole,
      });
      if (!result.available || !result.data) {
        setCloudSyncStatus({
          state: "local-only",
          message:
            result.message ??
            "Cloud libraries are unavailable. Local presets remain active.",
        });
        return;
      }

      replaceSharedLibrary(result.data);
      setSharedMemberEmailInput("");
      setCloudSyncStatus({
        state: "synced",
        message:
          result.message ??
          `Updated access for ${result.data.name}.`,
        lastSyncedAt: result.data.updatedAt,
      });
    } catch (error) {
      setCloudSyncStatus({
        state: "sync-error",
        message:
          error instanceof Error
            ? error.message
            : "Shared library access could not be updated.",
      });
    }
  }

  async function removeSharedLibraryMember(userId: string) {
    if (!activeLibraryCanManage || activeLibrary.scope !== "shared") {
      setCloudSyncStatus({
        state: "sync-error",
        message: "Only the shared library owner can manage access.",
      });
      return;
    }

    try {
      const result = await removeSharedPresetLibraryMember({
        libraryId: activeLibrary.id,
        userId,
      });
      if (!result.available || !result.data) {
        setCloudSyncStatus({
          state: "local-only",
          message:
            result.message ??
            "Cloud libraries are unavailable. Local presets remain active.",
        });
        return;
      }

      replaceSharedLibrary(result.data);
      setCloudSyncStatus({
        state: "synced",
        message:
          result.message ??
          `Updated access for ${result.data.name}.`,
        lastSyncedAt: result.data.updatedAt,
      });
    } catch (error) {
      setCloudSyncStatus({
        state: "sync-error",
        message:
          error instanceof Error
            ? error.message
            : "Shared library member could not be removed.",
      });
    }
  }

  return {
    presets,
    presetPacks,
    availableLibraries,
    activeLibrary,
    activePreset,
    activePresetId,
    activePresetPack,
    activePresetPackId,
    activePresetIsDirty,
    defaultPresetId,
    presetName,
    presetStatus,
    importStatus,
    packName,
    packDescription,
    packTagsText,
    packStatus,
    authSession,
    authEmailInput,
    authPasswordInput,
    authDisplayNameInput,
    sharedLibraryNameInput,
    sharedLibraryDescriptionInput,
    sharedMemberEmailInput,
    sharedMemberRole,
    cloudSyncStatus,
    selectedLibraryId,
    canEditActiveLibrary: activeLibraryCanWrite,
    canManageActiveLibrary: activeLibraryCanManage,
    suggestedPresetName,
    setPresetName,
    setPackName,
    setPackDescription,
    setPackTagsText,
    setActivePresetPackId,
    setAuthEmailInput,
    setAuthPasswordInput,
    setAuthDisplayNameInput,
    setSharedLibraryNameInput,
    setSharedLibraryDescriptionInput,
    setSharedMemberEmailInput,
    setSharedMemberRole,
    setSelectedLibraryId: selectLibrary,
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
    signIn,
    signUp,
    signOut,
    syncActiveLibrary,
    createSharedLibrary,
    saveSharedLibraryMember,
    removeSharedLibraryMember,
  };
}
