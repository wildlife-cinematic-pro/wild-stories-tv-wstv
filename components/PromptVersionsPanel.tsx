"use client";

import { useEffect, useMemo, useState } from "react";
import type { PromptVersion } from "@/types";
import {
  clearVersionsForKey,
  exportVersionsForKey,
  getVersionsForKey,
  importVersionsForKey,
  updateVersionMeta,
} from "@/lib/versioning";

function toLines(s?: string) {
  return String(s ?? "").replace(/\r\n/g, "\n").split("\n");
}

function diffByIndex(a?: string, b?: string) {
  const A = toLines(a);
  const B = toLines(b);
  const max = Math.max(A.length, B.length);

  const left: { text: string; changed: boolean }[] = [];
  const right: { text: string; changed: boolean }[] = [];

  for (let i = 0; i < max; i++) {
    const la = A[i] ?? "";
    const lb = B[i] ?? "";
    const changed = la !== lb;
    left.push({ text: la, changed });
    right.push({ text: lb, changed });
  }

  return { left, right };
}

function DiffBlock({
  title,
  a,
  b,
}: {
  title: string;
  a?: string;
  b?: string;
}) {
  const { left, right } = useMemo(() => diffByIndex(a, b), [a, b]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-2 text-sm font-extrabold text-gray-900">{title}</div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
          <div className="mb-1 text-[11px] font-extrabold text-gray-700">A</div>
          <div className="max-h-72 overflow-auto font-mono text-xs leading-relaxed text-gray-900">
            {left.map((line, idx) => (
              <div
                key={`a-${title}-${idx}`}
                className={line.changed ? "bg-yellow-100/70" : ""}
              >
                {line.text || "\u00A0"}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
          <div className="mb-1 text-[11px] font-extrabold text-gray-700">B</div>
          <div className="max-h-72 overflow-auto font-mono text-xs leading-relaxed text-gray-900">
            {right.map((line, idx) => (
              <div
                key={`b-${title}-${idx}`}
                className={line.changed ? "bg-yellow-100/70" : ""}
              >
                {line.text || "\u00A0"}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-2 text-[11px] text-gray-500">
        Yellow lines = differences.
      </div>
    </div>
  );
}

export default function PromptVersionsPanel({
  versionKey,
  onRestoreVersion,
}: {
  versionKey: string;
  onRestoreVersion?: (v: PromptVersion) => void;
}) {
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [selectedA, setSelectedA] = useState("");
  const [selectedB, setSelectedB] = useState("");

  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importMsg, setImportMsg] = useState("");

  const [renameTs, setRenameTs] = useState("");
  const [renameValue, setRenameValue] = useState("");

  function refresh() {
    if (!versionKey) {
      setVersions([]);
      return;
    }

    const list = getVersionsForKey(versionKey);

    const sorted = [...list].sort((a, b) => {
      const ap = Boolean(a.pinned);
      const bp = Boolean(b.pinned);

      if (ap !== bp) return ap ? -1 : 1;

      return (
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    });

    setVersions(sorted);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versionKey]);

  const versionA = useMemo(
    () => versions.find((v) => v.timestamp === selectedA) ?? null,
    [versions, selectedA]
  );

  const versionB = useMemo(
    () => versions.find((v) => v.timestamp === selectedB) ?? null,
    [versions, selectedB]
  );

  function onPin(ts: string, next: boolean) {
    updateVersionMeta(versionKey, ts, { pinned: next });
    refresh();
  }

  function onStartRename(v: PromptVersion) {
    setRenameTs(v.timestamp);
    setRenameValue(v.label || "");
  }

  function onSaveRename() {
    if (!renameTs) return;

    updateVersionMeta(versionKey, renameTs, {
      label: renameValue.trim() || "RENAMED",
    });

    setRenameTs("");
    setRenameValue("");
    refresh();
  }

  function doImport() {
    setImportMsg("");

    try {
      const parsed = JSON.parse(importText);
      const count = importVersionsForKey(versionKey, parsed);
      setImportMsg(`Imported ${count} entries.`);
      refresh();
    } catch {
      setImportMsg("Invalid JSON. Paste exported JSON and try again.");
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-extrabold text-gray-900">
            🕘 Prompt Versions
          </div>
          <div className="text-xs text-gray-500">
            Key: <span className="font-semibold">{versionKey}</span>
          </div>
        </div>

        <div className="text-xs font-semibold text-gray-600">
          Saved:{" "}
          <span className="font-extrabold text-gray-900">
            {versions.length}
          </span>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => exportVersionsForKey(versionKey)}
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-extrabold text-gray-800 hover:bg-gray-50 active:scale-95"
        >
          ⬇ Export JSON
        </button>

        <button
          type="button"
          onClick={() => {
            setImportOpen((prev) => !prev);
            setImportMsg("");
          }}
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-extrabold text-gray-800 hover:bg-gray-50 active:scale-95"
        >
          ⬆ Import JSON
        </button>

        <button
          type="button"
          onClick={() => {
            if (!confirm("Clear history for this predator/prey/arc?")) return;
            clearVersionsForKey(versionKey);
            setSelectedA("");
            setSelectedB("");
            refresh();
          }}
          className="rounded-xl border border-red-300 bg-white px-3 py-2 text-xs font-extrabold text-red-700 hover:bg-red-50 active:scale-95"
        >
          🧹 Clear History
        </button>
      </div>

      {importOpen && (
        <div className="mb-3 rounded-2xl border border-gray-200 bg-gray-50 p-3">
          <div className="mb-2 text-xs font-extrabold text-gray-800">
            Paste exported JSON here
          </div>

          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            className="h-32 w-full rounded-xl border border-gray-300 bg-white p-2 font-mono text-xs"
            placeholder='{"key":"...","versions":[...]}'
          />

          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={doImport}
              className="rounded-xl bg-gray-900 px-3 py-2 text-xs font-extrabold text-white hover:bg-black active:scale-95"
            >
              Import
            </button>

            {importMsg && (
              <span className="text-xs font-semibold text-gray-700">
                {importMsg}
              </span>
            )}
          </div>
        </div>
      )}

      {versions.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
          No versions yet. Generate once.
        </div>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-extrabold text-gray-700">
                Compare A
              </label>
              <select
                value={selectedA}
                onChange={(e) => setSelectedA(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">Select A</option>
                {versions.map((v) => (
                  <option key={v.timestamp} value={v.timestamp}>
                    {v.pinned ? "⭐ " : ""}
                    v{v.version} • {new Date(v.timestamp).toLocaleString()} •{" "}
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-extrabold text-gray-700">
                Compare B
              </label>
              <select
                value={selectedB}
                onChange={(e) => setSelectedB(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">Select B</option>
                {versions.map((v) => (
                  <option key={v.timestamp} value={v.timestamp}>
                    {v.pinned ? "⭐ " : ""}
                    v{v.version} • {new Date(v.timestamp).toLocaleString()} •{" "}
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => versions[0] && onRestoreVersion?.(versions[0])}
              className="rounded-xl bg-gray-900 px-4 py-2 text-xs font-extrabold text-white hover:bg-black active:scale-95"
            >
              Restore Latest
            </button>

            <button
              type="button"
              disabled={!versionA}
              onClick={() => versionA && onRestoreVersion?.(versionA)}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-extrabold text-gray-800 hover:bg-gray-50 disabled:opacity-50 active:scale-95"
            >
              Restore A
            </button>

            <button
              type="button"
              disabled={!versionB}
              onClick={() => versionB && onRestoreVersion?.(versionB)}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-extrabold text-gray-800 hover:bg-gray-50 disabled:opacity-50 active:scale-95"
            >
              Restore B
            </button>
          </div>

          <div className="mt-3 grid gap-2">
            {versions.slice(0, 8).map((v) => (
              <div
                key={v.timestamp}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2"
              >
                <span className="text-xs font-extrabold text-gray-800">
                  {v.pinned ? "⭐ " : ""}v{v.version}
                </span>

                <span className="text-xs text-gray-600">
                  {new Date(v.timestamp).toLocaleString()}
                </span>

                <span className="text-xs font-semibold text-gray-800">
                  {v.label}
                </span>

                <button
                  type="button"
                  onClick={() => onPin(v.timestamp, !v.pinned)}
                  className="ml-auto rounded-lg border border-gray-300 bg-white px-2 py-1 text-[11px] font-extrabold text-gray-800 hover:bg-gray-50"
                >
                  {v.pinned ? "Unpin" : "Pin ⭐"}
                </button>

                <button
                  type="button"
                  onClick={() => onStartRename(v)}
                  className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-[11px] font-extrabold text-gray-800 hover:bg-gray-50"
                >
                  Rename
                </button>
              </div>
            ))}
          </div>

          {renameTs && (
            <div className="mt-3 rounded-2xl border border-gray-200 bg-white p-3">
              <div className="mb-2 text-xs font-extrabold text-gray-800">
                Rename label
              </div>

              <div className="flex flex-wrap gap-2">
                <input
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="flex-1 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                  placeholder="e.g. Best Hook / Strong Realism / Viral"
                />

                <button
                  type="button"
                  onClick={onSaveRename}
                  className="rounded-xl bg-gray-900 px-4 py-2 text-xs font-extrabold text-white hover:bg-black"
                >
                  Save
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRenameTs("");
                    setRenameValue("");
                  }}
                  className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-extrabold text-gray-800 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {(versionA || versionB) && (
            <div className="mt-4 space-y-3">
              <DiffBlock
                title="Image Prompt"
                a={versionA?.imagePrompt}
                b={versionB?.imagePrompt}
              />
              <DiffBlock title="Hook" a={versionA?.hook} b={versionB?.hook} />
              <DiffBlock
                title="Caption"
                a={versionA?.caption}
                b={versionB?.caption}
              />
              <DiffBlock
                title="Voiceover"
                a={versionA?.voiceoverLine}
                b={versionB?.voiceoverLine}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}