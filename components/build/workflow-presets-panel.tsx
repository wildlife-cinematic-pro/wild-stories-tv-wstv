"use client";

import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";

import type {
  SavedWorkflowPreset,
  SavedWorkflowPresetPack,
  WorkflowPresetAuthSession,
  WorkflowPresetCloudSyncState,
  WorkflowPresetLibraryRecord,
  WorkflowPresetLibraryRole,
} from "@/types";

type WorkflowPresetsPanelProps = {
  presets: SavedWorkflowPreset[];
  presetPacks: SavedWorkflowPresetPack[];
  libraries: WorkflowPresetLibraryRecord[];
  activeLibrary: WorkflowPresetLibraryRecord;
  activePresetId: string | null;
  activePresetPackId: string | null;
  defaultPresetId?: string;
  activePresetIsDirty: boolean;
  presetName: string;
  packName: string;
  packDescription: string;
  packTagsText: string;
  authSession: WorkflowPresetAuthSession | null;
  authEmailInput: string;
  authPasswordInput: string;
  authDisplayNameInput: string;
  sharedLibraryNameInput: string;
  sharedLibraryDescriptionInput: string;
  sharedMemberEmailInput: string;
  sharedMemberRole: WorkflowPresetLibraryRole;
  cloudSyncState: WorkflowPresetCloudSyncState;
  cloudSyncMessage: string;
  cloudSyncLastSyncedAt?: string;
  canEditActiveLibrary: boolean;
  canManageActiveLibrary: boolean;
  suggestedPresetName: string;
  onPresetNameChange: (value: string) => void;
  onPresetPackNameChange: (value: string) => void;
  onPresetPackDescriptionChange: (value: string) => void;
  onPresetPackTagsTextChange: (value: string) => void;
  onAuthEmailInputChange: (value: string) => void;
  onAuthPasswordInputChange: (value: string) => void;
  onAuthDisplayNameInputChange: (value: string) => void;
  onSharedLibraryNameInputChange: (value: string) => void;
  onSharedLibraryDescriptionInputChange: (value: string) => void;
  onSharedMemberEmailInputChange: (value: string) => void;
  onSharedMemberRoleChange: (value: WorkflowPresetLibraryRole) => void;
  onActiveLibraryChange: (id: string) => void;
  onSavePreset: (name?: string) => void;
  onUpdatePreset: (id?: string, name?: string) => void;
  onLoadPreset: (id: string) => void;
  onDeletePreset: (id: string) => void;
  onSetDefaultPreset: (id: string) => void;
  onClearDefaultPreset: () => void;
  onExportPreset: (id: string) => void;
  onExportAllPresets: () => void;
  onImportPresets: (jsonText: string) => void;
  onCreatePresetPack: (
    presetIds: string[],
    options: { name?: string; description?: string; tagsText?: string }
  ) => void;
  onDeletePresetPack: (id: string) => void;
  onExportPresetPack: (id: string) => void;
  onImportPresetPack: (jsonText: string) => void;
  onApplyPresetPack: (id: string) => void;
  onSignIn: () => void;
  onSignUp: () => void;
  onSignOut: () => void;
  onSyncLibrary: () => void;
  onCreateSharedLibrary: () => void;
  onSaveSharedLibraryMember: () => void;
  onRemoveSharedLibraryMember: (userId: string) => void;
  importStatus: string;
  packStatus: string;
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

function formatPackMeta(pack: SavedWorkflowPresetPack): string {
  const tags = pack.tags?.length ? ` - ${pack.tags.join(", ")}` : "";
  return `${pack.presets.length} preset${pack.presets.length === 1 ? "" : "s"}${tags}`;
}

function getCloudSyncTone(state: WorkflowPresetCloudSyncState): string {
  switch (state) {
    case "synced":
      return "bg-emerald-100 text-emerald-700";
    case "conflict-resolved":
      return "bg-amber-100 text-amber-700";
    case "authenticating":
    case "syncing":
      return "bg-sky-100 text-sky-700";
    case "sync-error":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-500";
  }
}

export default function WorkflowPresetsPanel({
  presets,
  presetPacks,
  libraries,
  activeLibrary,
  activePresetId,
  activePresetPackId,
  defaultPresetId,
  activePresetIsDirty,
  presetName,
  packName,
  packDescription,
  packTagsText,
  authSession,
  authEmailInput,
  authPasswordInput,
  authDisplayNameInput,
  sharedLibraryNameInput,
  sharedLibraryDescriptionInput,
  sharedMemberEmailInput,
  sharedMemberRole,
  cloudSyncState,
  cloudSyncMessage,
  cloudSyncLastSyncedAt,
  canEditActiveLibrary,
  canManageActiveLibrary,
  suggestedPresetName,
  onPresetNameChange,
  onPresetPackNameChange,
  onPresetPackDescriptionChange,
  onPresetPackTagsTextChange,
  onAuthEmailInputChange,
  onAuthPasswordInputChange,
  onAuthDisplayNameInputChange,
  onSharedLibraryNameInputChange,
  onSharedLibraryDescriptionInputChange,
  onSharedMemberEmailInputChange,
  onSharedMemberRoleChange,
  onActiveLibraryChange,
  onSavePreset,
  onUpdatePreset,
  onLoadPreset,
  onDeletePreset,
  onSetDefaultPreset,
  onClearDefaultPreset,
  onExportPreset,
  onExportAllPresets,
  onImportPresets,
  onCreatePresetPack,
  onDeletePresetPack,
  onExportPresetPack,
  onImportPresetPack,
  onApplyPresetPack,
  onSignIn,
  onSignUp,
  onSignOut,
  onSyncLibrary,
  onCreateSharedLibrary,
  onSaveSharedLibraryMember,
  onRemoveSharedLibraryMember,
  importStatus,
  packStatus,
}: WorkflowPresetsPanelProps) {
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [selectedPackId, setSelectedPackId] = useState("");
  const [selectedPackPresetIds, setSelectedPackPresetIds] = useState<string[]>([]);
  const [importText, setImportText] = useState("");
  const [packImportText, setPackImportText] = useState("");

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
  const resolvedSelectedPackId =
    selectedPackId && presetPacks.some((pack) => pack.id === selectedPackId)
      ? selectedPackId
      : activePresetPackId &&
          presetPacks.some((pack) => pack.id === activePresetPackId)
        ? activePresetPackId
        : presetPacks[0]?.id ?? "";
  const selectedPack = useMemo(
    () => presetPacks.find((pack) => pack.id === resolvedSelectedPackId),
    [presetPacks, resolvedSelectedPackId]
  );

  const effectiveName = presetName.trim() || suggestedPresetName;
  const effectivePackName = packName.trim() || "Untitled Preset Pack";
  const effectivePackPresetIds = selectedPackPresetIds;
  const hasPresets = presets.length > 0;
  const hasPresetPacks = presetPacks.length > 0;

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;

    const text = await file.text();
    setImportText(text);
    onImportPresets(text);
    event.currentTarget.value = "";
  }

  async function handlePackImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;

    const text = await file.text();
    setPackImportText(text);
    onImportPresetPack(text);
    event.currentTarget.value = "";
  }

  function togglePackPreset(id: string) {
    setSelectedPackPresetIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-200/70 sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">
            Saved Workflow Templates
          </h3>
          <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-gray-500">
            Save the current build setup, sync your personal library, and work
            inside shared libraries with role-based access.
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

      <div className="mb-4 rounded-2xl border border-gray-100 bg-gray-50 p-3.5">
        <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400">
              Account & Library
            </div>
            <div className="mt-1 max-w-xl text-[11px] leading-relaxed text-gray-500">
              Signed-in users sync a personal library automatically and can work
              inside shared libraries with owner, editor, or viewer access.
            </div>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${getCloudSyncTone(
              cloudSyncState
            )}`}
          >
            {cloudSyncState === "local-only"
              ? "Local only"
              : cloudSyncState === "authenticating"
                ? "Authenticating"
                : cloudSyncState === "syncing"
                  ? "Syncing"
                  : cloudSyncState === "conflict-resolved"
                    ? "Conflict resolved"
                    : cloudSyncState === "sync-error"
                      ? "Sync error"
                      : "Synced"}
          </span>
        </div>

        {!authSession ? (
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div className="grid gap-2 sm:grid-cols-3">
              <input
                type="email"
                autoComplete="email"
                aria-label="Preset library email"
                value={authEmailInput}
                onChange={(event) => onAuthEmailInputChange(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
              />
              <input
                type="password"
                autoComplete="current-password"
                aria-label="Preset library password"
                value={authPasswordInput}
                onChange={(event) =>
                  onAuthPasswordInputChange(event.target.value)
                }
                placeholder="Password"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
              />
              <input
                autoComplete="name"
                aria-label="Preset library display name"
                value={authDisplayNameInput}
                onChange={(event) =>
                  onAuthDisplayNameInputChange(event.target.value)
                }
                placeholder="Display name (optional)"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
              />
            </div>
            <p className="text-[11px] leading-relaxed text-gray-500 lg:hidden">
              Enter email and password to sign in. New accounts need an 8+ character password; local presets stay available if cloud auth fails.
            </p>
            <div className="flex flex-wrap items-end gap-2">
              <button
                type="button"
                onClick={onSignIn}
                disabled={!authEmailInput.trim() || !authPasswordInput.trim()}
                className="rounded-xl bg-gray-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-gray-200/80 hover:bg-black disabled:opacity-45 active:scale-[0.98]"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={onSignUp}
                disabled={!authEmailInput.trim() || !authPasswordInput.trim()}
                className="rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-600 shadow-sm shadow-gray-100/80 hover:bg-gray-50 disabled:opacity-45 active:scale-[0.98]"
              >
                Create Account
              </button>
            </div>
            <p className="hidden max-w-[280px] text-[11px] leading-relaxed text-gray-500 lg:block">
              Enter email and password to sign in. New accounts need an 8+ character password; local presets stay available if cloud auth fails.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold text-gray-700">
                  {authSession.user.displayName || authSession.user.email}
                </div>
                <div className="text-[11px] text-gray-500">
                  {authSession.user.email}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onSyncLibrary}
                  className="rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-600 shadow-sm shadow-gray-100/80 hover:bg-gray-50 active:scale-[0.98]"
                >
                  Sync Now
                </button>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-600 shadow-sm shadow-gray-100/80 hover:bg-gray-50 active:scale-[0.98]"
                >
                  Sign Out
                </button>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-gray-500">
                  Library context
                </label>
                <select
                  value={activeLibrary.id}
                  onChange={(event) => onActiveLibraryChange(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-gray-400 focus:outline-none"
                >
                  {libraries.map((library) => (
                    <option key={library.id} value={library.id}>
                      {library.scope === "personal" ? "My Library" : library.name}
                      {library.scope === "shared"
                        ? ` (${library.role})`
                        : ""}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-gray-400">
                  {activeLibrary.scope === "personal"
                    ? "Personal cloud library backed by your signed-in account."
                    : `${activeLibrary.name} - ${activeLibrary.role} access.`}
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                <input
                  value={sharedLibraryNameInput}
                  onChange={(event) =>
                    onSharedLibraryNameInputChange(event.target.value)
                  }
                  placeholder="Shared library name"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
                />
                <input
                  value={sharedLibraryDescriptionInput}
                  onChange={(event) =>
                    onSharedLibraryDescriptionInputChange(event.target.value)
                  }
                  placeholder="Description"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={onCreateSharedLibrary}
                  disabled={!sharedLibraryNameInput.trim()}
                  className="rounded-xl bg-gray-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-gray-200/80 hover:bg-black disabled:opacity-45 active:scale-[0.98]"
                >
                  New Shared Library
                </button>
              </div>
            </div>

            {activeLibrary.scope === "shared" && (
              <div className="rounded-xl border border-gray-100 bg-white p-3">
                <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold text-gray-700">
                      {activeLibrary.name}
                    </div>
                    {activeLibrary.description && (
                      <div className="mt-0.5 text-[11px] text-gray-500">
                        {activeLibrary.description}
                      </div>
                    )}
                  </div>
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-500">
                    {activeLibrary.role}
                  </span>
                </div>

                {canManageActiveLibrary && (
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_140px_auto]">
                    <input
                      value={sharedMemberEmailInput}
                      onChange={(event) =>
                        onSharedMemberEmailInputChange(event.target.value)
                      }
                      placeholder="member@example.com"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
                    />
                    <select
                      value={sharedMemberRole}
                      onChange={(event) =>
                        onSharedMemberRoleChange(
                          event.target.value as WorkflowPresetLibraryRole
                        )
                      }
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-900 focus:border-gray-400 focus:outline-none"
                    >
                      <option value="editor">editor</option>
                      <option value="viewer">viewer</option>
                    </select>
                    <button
                      type="button"
                      onClick={onSaveSharedLibraryMember}
                      disabled={!sharedMemberEmailInput.trim()}
                      className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 shadow-sm shadow-gray-100/80 hover:bg-gray-50 disabled:opacity-45 active:scale-[0.98]"
                    >
                      Save Access
                    </button>
                  </div>
                )}

                {activeLibrary.members && activeLibrary.members.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {activeLibrary.members.map((member) => (
                      <div
                        key={member.userId}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-gray-50 px-2.5 py-2"
                      >
                        <div>
                          <div className="text-[11px] font-semibold text-gray-700">
                            {member.email}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {member.role}
                          </div>
                        </div>
                        {canManageActiveLibrary && member.role !== "owner" && (
                          <button
                            type="button"
                            onClick={() => onRemoveSharedLibraryMember(member.userId)}
                            className="rounded-lg border border-red-100 bg-red-50 px-2.5 py-1 text-[10px] font-semibold text-red-600 hover:bg-red-100"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
          <span>{cloudSyncMessage}</span>
          {cloudSyncLastSyncedAt && (
            <span>Last sync: {cloudSyncLastSyncedAt}</span>
          )}
        </div>
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
              disabled={!canEditActiveLibrary}
              className="rounded-xl bg-gray-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-gray-200/80 hover:bg-black disabled:opacity-45 active:scale-[0.98]"
            >
              Save Current as Preset
            </button>
            <button
              type="button"
              onClick={() => onUpdatePreset(resolvedSelectedPresetId, effectiveName)}
              disabled={!selectedPreset || !canEditActiveLibrary}
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
              disabled={!selectedPreset || !canEditActiveLibrary}
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
              disabled={!selectedPreset || !canEditActiveLibrary}
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
              Export one preset or the full active library, then import pasted
              JSON or a downloaded file without overwriting existing presets silently.
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
            disabled={!importText.trim() || !canEditActiveLibrary}
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

      <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-3.5">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400">
              Preset Packs
            </div>
            <div className="mt-1 max-w-xl text-[11px] leading-relaxed text-gray-500">
              Bundle multiple workflow presets into reusable packs, then apply
              a selected pack into My Library without mutating the source pack.
            </div>
          </div>
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-500">
            {presetPacks.length} pack{presetPacks.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.85fr)]">
          <div className="space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                value={packName}
                onChange={(event) => onPresetPackNameChange(event.target.value)}
                placeholder="USA Pack Hunt Starter Pack"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
              />
              <input
                value={packTagsText}
                onChange={(event) =>
                  onPresetPackTagsTextChange(event.target.value)
                }
                placeholder="USA, fast publish, pack hunt"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
              />
            </div>
            <textarea
              value={packDescription}
              onChange={(event) =>
                onPresetPackDescriptionChange(event.target.value)
              }
              placeholder="Short note for the team about what this pack is best for..."
              rows={2}
              className="w-full resize-y rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
            />
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-2">
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400">
                  Pack presets
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPackPresetIds(presets.map((preset) => preset.id))}
                    disabled={!hasPresets}
                    className="text-[10px] font-semibold text-gray-500 hover:text-gray-900 disabled:opacity-45"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPackPresetIds([])}
                    disabled={!selectedPackPresetIds.length}
                    className="text-[10px] font-semibold text-gray-500 hover:text-gray-900 disabled:opacity-45"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="max-h-32 space-y-1 overflow-y-auto pr-1">
                {!hasPresets && (
                  <p className="text-[11px] text-gray-400">
                    Save presets first, then select them for a pack.
                  </p>
                )}
                {presets.map((preset) => {
                  const checked = effectivePackPresetIds.includes(preset.id);
                  return (
                    <label
                      key={preset.id}
                      className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-white"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => togglePackPreset(preset.id)}
                        className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-gray-900 focus:ring-gray-400"
                      />
                      <span>
                        <span className="block text-[11px] font-semibold text-gray-700">
                          {preset.name}
                        </span>
                        <span className="block text-[10px] text-gray-400">
                          {formatPresetMeta(preset)}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                onCreatePresetPack(effectivePackPresetIds, {
                  name: effectivePackName,
                  description: packDescription,
                  tagsText: packTagsText,
                })
              }
              disabled={!effectivePackPresetIds.length || !canEditActiveLibrary}
              className="rounded-xl bg-gray-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-gray-200/80 hover:bg-black disabled:opacity-45 active:scale-[0.98]"
            >
              Create Pack from Selected Presets
            </button>
          </div>

          <div className="space-y-2">
            <select
              value={resolvedSelectedPackId}
              onChange={(event) => setSelectedPackId(event.target.value)}
              disabled={!hasPresetPacks}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-gray-400 focus:outline-none disabled:text-gray-400"
            >
              {!hasPresetPacks && <option value="">No preset packs yet</option>}
              {presetPacks.map((pack) => (
                <option key={pack.id} value={pack.id}>
                  {pack.name}
                </option>
              ))}
            </select>
            {selectedPack && (
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-2.5">
                <p className="text-[11px] font-semibold text-gray-700">
                  {selectedPack.name}
                </p>
                {selectedPack.description && (
                  <p className="mt-1 text-[11px] leading-relaxed text-gray-500">
                    {selectedPack.description}
                  </p>
                )}
                <p className="mt-1 text-[10px] text-gray-400">
                  {formatPackMeta(selectedPack)}
                </p>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  resolvedSelectedPackId && onApplyPresetPack(resolvedSelectedPackId)
                }
                disabled={!selectedPack}
                className="rounded-xl bg-gray-900 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm shadow-gray-200/80 hover:bg-black disabled:opacity-45 active:scale-[0.98]"
              >
                Apply Pack to My Library
              </button>
              <button
                type="button"
                onClick={() =>
                  resolvedSelectedPackId && onExportPresetPack(resolvedSelectedPackId)
                }
                disabled={!selectedPack}
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-600 shadow-sm shadow-gray-100/80 hover:bg-gray-50 disabled:opacity-45 active:scale-[0.98]"
              >
                Export Pack
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!resolvedSelectedPackId) return;
                  onDeletePresetPack(resolvedSelectedPackId);
                  setSelectedPackId("");
                }}
                disabled={!selectedPack || !canEditActiveLibrary}
                className="rounded-xl border border-red-100 bg-red-50 px-3 py-1.5 text-[11px] font-semibold text-red-600 hover:bg-red-100 disabled:opacity-45 active:scale-[0.98]"
              >
                Delete Pack
              </button>
            </div>
            <textarea
              value={packImportText}
              onChange={(event) => setPackImportText(event.target.value)}
              placeholder="Paste exported preset pack JSON here..."
              rows={3}
              className="w-full resize-y rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
            />
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onImportPresetPack(packImportText)}
                disabled={!packImportText.trim() || !canEditActiveLibrary}
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-600 shadow-sm shadow-gray-100/80 hover:bg-gray-50 disabled:opacity-45 active:scale-[0.98]"
              >
                Import Pack
              </button>
              <label className="cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-600 shadow-sm shadow-gray-100/80 hover:bg-gray-50 active:scale-[0.98]">
                Upload Pack JSON
                <input
                  type="file"
                  accept="application/json,.json"
                  className="sr-only"
                  onChange={(event) => {
                    void handlePackImportFile(event);
                  }}
                />
              </label>
            </div>
            {packStatus && (
              <p className="text-[11px] font-medium text-gray-500">
                {packStatus}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

