"use client";

import { useEffect, useState } from "react";

import type { MyWorkflowPreset } from "@/lib/my-workflow-presets";

function formatLabel(value: unknown, fallback = "Auto") {
  if (typeof value !== "string" && typeof value !== "number") return fallback;
  return String(value)
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function presetPair(preset: MyWorkflowPreset) {
  const { snapshot } = preset;
  return `${snapshot.subjectA || snapshot.predator} vs ${
    snapshot.subjectB || snapshot.prey
  }`;
}

export default function MyWorkflowPresetsPanel({
  presets,
  suggestedName,
  status,
  storageWarning,
  onSave,
  onApply,
  onRename,
  onDelete,
}: {
  presets: MyWorkflowPreset[];
  suggestedName: string;
  status?: string;
  storageWarning?: string;
  onSave: (name: string) => void;
  onApply: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [saveName, setSaveName] = useState(suggestedName);
  const [saveNameTouched, setSaveNameTouched] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (!saveNameTouched) setSaveName(suggestedName);
  }, [saveNameTouched, suggestedName]);

  function beginRename(preset: MyWorkflowPreset) {
    setRenamingId(preset.id);
    setRenameValue(preset.name);
    setDeleteConfirmId(null);
  }

  function finishRename(id: string) {
    onRename(id, renameValue);
    setRenamingId(null);
    setRenameValue("");
  }

  return (
    <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] p-5 text-[color:var(--text)] shadow-[0_18px_40px_rgba(2,6,23,0.14)]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--accent-rgb))]">
            My Workflow Presets
          </p>
          <h3 className="mt-1 text-base font-semibold text-[color:var(--text)]">
            Save reusable setup recipes
          </h3>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[color:var(--muted)]">
            Local-only saves for the current setup controls. Applying a preset
            restores fields but does not generate automatically.
          </p>
        </div>
        <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--muted)]">
          {presets.length} saved
        </span>
      </div>

      <div className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-3">
        <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--muted)]">
          Save Current Workflow
        </label>
        <div className="mt-2 grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
          <input
            value={saveName}
            onChange={(event) => {
              setSaveName(event.target.value);
              setSaveNameTouched(true);
            }}
            className="min-w-0 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] px-3 py-2 text-sm font-semibold text-[color:var(--text)] outline-none transition focus:border-[rgb(var(--accent-rgb)/0.65)]"
            placeholder={suggestedName}
          />
          <button
            type="button"
            onClick={() => {
              onSave(saveName || suggestedName);
              setSaveNameTouched(false);
            }}
            className="rounded-xl bg-[rgb(var(--accent-rgb))] px-4 py-2 text-sm font-extrabold text-white shadow-sm transition hover:opacity-90 active:scale-[0.98]"
          >
            Save Current Workflow
          </button>
        </div>
        {storageWarning ? (
          <p className="mt-2 text-[11px] font-semibold text-[color:var(--warning-text)]">
            {storageWarning}
          </p>
        ) : (
          <p className="mt-2 text-[11px] font-semibold text-[color:var(--muted)]">
            Stored in this browser with localStorage.
          </p>
        )}
      </div>

      {status ? (
        <div className="mt-3 rounded-xl border border-emerald-400/30 bg-[color:var(--success-bg)] px-3 py-2 text-xs font-semibold text-[color:var(--success-text)]">
          {status}
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 xl:grid-cols-3">
        {presets.length ? (
          presets.map((preset) => {
            const isRenaming = renamingId === preset.id;
            const isConfirmingDelete = deleteConfirmId === preset.id;
            const { snapshot } = preset;

            return (
              <article
                key={preset.id}
                className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface-muted)] p-3"
              >
                {isRenaming ? (
                  <div className="space-y-2">
                    <input
                      value={renameValue}
                      onChange={(event) => setRenameValue(event.target.value)}
                      className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] px-3 py-2 text-sm font-semibold text-[color:var(--text)] outline-none focus:border-[rgb(var(--accent-rgb)/0.65)]"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => finishRename(preset.id)}
                        className="rounded-lg bg-[rgb(var(--accent-rgb))] px-3 py-1.5 text-xs font-extrabold text-white"
                      >
                        Save Name
                      </button>
                      <button
                        type="button"
                        onClick={() => setRenamingId(null)}
                        className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1.5 text-xs font-bold text-[color:var(--text)]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="truncate text-sm font-black text-[color:var(--text)]">
                          {preset.name}
                        </h4>
                        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--muted)]">
                          {formatLabel(snapshot.storyMode)}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-2 py-0.5 text-[9px] font-bold text-[color:var(--muted)]">
                        {formatDate(preset.updatedAt)}
                      </span>
                    </div>

                    <p className="mt-3 text-xs font-extrabold text-[color:var(--text)]">
                      {presetPair(preset)}
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-[color:var(--muted)]">
                      {formatLabel(snapshot.habitatRegion)} ·{" "}
                      {formatLabel(snapshot.season)} ·{" "}
                      {formatLabel(snapshot.timeOfDay)}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[color:var(--muted)]">
                      {snapshot.actionStyle} · {snapshot.animalVibe} ·{" "}
                      {snapshot.runwayModel} / {snapshot.klingModel}
                    </p>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => onApply(preset.id)}
                        className="rounded-lg bg-[color:var(--text)] px-2 py-1.5 text-xs font-extrabold text-[color:var(--inverse-text)] active:scale-[0.98]"
                      >
                        Apply
                      </button>
                      <button
                        type="button"
                        onClick={() => beginRename(preset)}
                        className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-2 py-1.5 text-xs font-bold text-[color:var(--text)]"
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          isConfirmingDelete
                            ? onDelete(preset.id)
                            : setDeleteConfirmId(preset.id)
                        }
                        className={[
                          "rounded-lg border px-2 py-1.5 text-xs font-bold",
                          isConfirmingDelete
                            ? "border-rose-400/40 bg-[color:var(--danger-bg)] text-[color:var(--danger-text)]"
                            : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text)]",
                        ].join(" ")}
                      >
                        {isConfirmingDelete ? "Confirm" : "Delete"}
                      </button>
                    </div>
                  </>
                )}
              </article>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 text-sm font-semibold text-[color:var(--muted)] xl:col-span-3">
            No saved workflows yet. Save your current setup to reuse it later.
          </div>
        )}
      </div>
    </section>
  );
}
