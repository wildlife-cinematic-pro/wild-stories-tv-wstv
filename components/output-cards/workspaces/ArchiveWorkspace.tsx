"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";

import {
  VIDEO_ARCHIVE_STORAGE_EVENT,
  buildVideoArchiveCaptionHashtagsText,
  buildVideoArchiveFolderChecklistText,
  buildVideoArchivePromptPackText,
  buildVideoArchiveRecommendedFolderName,
  createVideoArchiveEntryFromPackage,
  deleteVideoArchiveEntry,
  exportVideoArchiveJson,
  findVideoArchiveEntryByGenerationId,
  getVideoArchiveGenerationId,
  exportVideoArchiveEntryJson,
  importVideoArchiveJson,
  readVideoArchiveEntries,
  upsertVideoArchiveEntry,
  type VideoArchiveEntry,
  type VideoArchivePerformanceStats,
  videoArchiveEntryMatchesSearch,
} from "@/lib/video-archive-storage";
import { downloadText } from "@/lib/storage";

import type { GeneratedPackage } from "@/types";

type FormState = {
  archiveId: string;
  localFolderPath: string;
  videoFileName: string;
  thumbnailFileName: string;
  thumbnailPath: string;
  facebookPostUrl: string;
  resultNotes: string;
  caption: string;
  hashtags: string;
  tags: string;
  views: string;
  likes: string;
  shares: string;
  comments: string;
  watchTime: string;
  retentionNotes: string;
  postedAt: string;
};

const EMPTY_FORM: FormState = {
  archiveId: "",
  localFolderPath: "",
  videoFileName: "",
  thumbnailFileName: "",
  thumbnailPath: "",
  facebookPostUrl: "",
  resultNotes: "",
  caption: "",
  hashtags: "",
  tags: "",
  views: "",
  likes: "",
  shares: "",
  comments: "",
  watchTime: "",
  retentionNotes: "",
  postedAt: "",
};

function numberText(value: number | undefined) {
  return value === undefined ? "" : String(value);
}

function optionalNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : undefined;
}

function performanceFromForm(form: FormState): VideoArchivePerformanceStats {
  const stats: VideoArchivePerformanceStats = {};
  const views = optionalNumber(form.views);
  const likes = optionalNumber(form.likes);
  const shares = optionalNumber(form.shares);
  const comments = optionalNumber(form.comments);
  const watchTime = optionalNumber(form.watchTime);

  if (views !== undefined) stats.views = views;
  if (likes !== undefined) stats.likes = likes;
  if (shares !== undefined) stats.shares = shares;
  if (comments !== undefined) stats.comments = comments;
  if (watchTime !== undefined) stats.watchTime = watchTime;
  if (form.retentionNotes.trim()) stats.retentionNotes = form.retentionNotes.trim();
  if (form.postedAt.trim()) stats.postedAt = form.postedAt.trim();

  return stats;
}

function formFromEntry(
  entry: VideoArchiveEntry | null,
  fallback: { caption?: string; hashtags?: string; tags?: string } = {}
): FormState {
  if (!entry) {
    return {
      ...EMPTY_FORM,
      caption: fallback.caption ?? "",
      hashtags: fallback.hashtags ?? "",
      tags: fallback.tags ?? "",
    };
  }

  return {
    archiveId: entry.archiveId,
    localFolderPath: entry.localFolderPath ?? "",
    videoFileName: entry.videoFileName ?? "",
    thumbnailFileName: entry.thumbnailFileName ?? "",
    thumbnailPath: entry.thumbnailPath ?? "",
    facebookPostUrl: entry.facebookPostUrl ?? "",
    resultNotes: entry.resultNotes ?? "",
    caption: entry.caption ?? fallback.caption ?? "",
    hashtags: entry.hashtags ?? fallback.hashtags ?? "",
    tags: entry.tags ?? fallback.tags ?? "",
    views: numberText(entry.performance.views),
    likes: numberText(entry.performance.likes),
    shares: numberText(entry.performance.shares),
    comments: numberText(entry.performance.comments),
    watchTime: numberText(entry.performance.watchTime),
    retentionNotes: entry.performance.retentionNotes ?? "",
    postedAt: entry.performance.postedAt ?? "",
  };
}

function readableDateTime(value?: string) {
  if (!value) return "not set";
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return year + "-" + month + "-" + day + " " + hours + ":" + minutes;
  }

  return value.replace("T", " ");
}

function MetricInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="space-y-1 text-[11px] font-bold text-[color:var(--muted)]">
      <span>{label}</span>
      <input
        type="number"
        min="0"
        step="any"
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-2.5 py-2 text-xs text-[color:var(--text)] outline-none focus:border-cyan-400"
      />
    </label>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="space-y-1 text-[11px] font-bold text-[color:var(--muted)]">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-2.5 py-2 text-xs text-[color:var(--text)] outline-none focus:border-cyan-400"
      />
    </label>
  );
}

export function ArchiveWorkspace({
  data,
  onCopy,
}: {
  data: GeneratedPackage;
  onCopy: (text: string) => void | Promise<unknown>;
}) {
  const generationId = useMemo(() => getVideoArchiveGenerationId(data), [data]);
  const packageFallback = useMemo(
    () => ({
      caption: data.caption2026 || data.caption || "",
      hashtags: data.hashtags ?? "",
      tags: data.tags ?? "",
    }),
    [data.caption, data.caption2026, data.hashtags, data.tags]
  );
  const [entries, setEntries] = useState<VideoArchiveEntry[]>([]);
  const [form, setForm] = useState<FormState>(() => formFromEntry(null, packageFallback));
  const [search, setSearch] = useState("");
  const [importJson, setImportJson] = useState("");
  const [status, setStatus] = useState("");

  const currentDraft = useMemo(
    () => createVideoArchiveEntryFromPackage(data, form, new Date().toISOString()),
    [data, form]
  );

  const visibleEntries = useMemo(
    () => entries.filter((entry) => videoArchiveEntryMatchesSearch(entry, search)),
    [entries, search]
  );

  useEffect(() => {
    function loadEntries() {
      const nextEntries = readVideoArchiveEntries();
      setEntries(nextEntries);
      const existing = findVideoArchiveEntryByGenerationId(generationId);
      setForm(formFromEntry(existing, packageFallback));
    }

    loadEntries();
    window.addEventListener(VIDEO_ARCHIVE_STORAGE_EVENT, loadEntries);
    window.addEventListener("storage", loadEntries);
    return () => {
      window.removeEventListener(VIDEO_ARCHIVE_STORAGE_EVENT, loadEntries);
      window.removeEventListener("storage", loadEntries);
    };
  }, [generationId, packageFallback]);

  function updateField(field: keyof FormState) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
    };
  }

  function refreshEntries(message: string) {
    setEntries(readVideoArchiveEntries());
    setStatus(message);
  }

  function saveCurrentGeneration() {
    const existing = form.archiveId
      ? entries.find((entry) => entry.archiveId === form.archiveId)
      : findVideoArchiveEntryByGenerationId(generationId);
    const now = new Date().toISOString();
    const entry = createVideoArchiveEntryFromPackage(
      data,
      {
        ...form,
        archiveId: existing?.archiveId,
        createdAt: existing?.createdAt,
        updatedAt: now,
        caption: form.caption,
        hashtags: form.hashtags,
        tags: form.tags,
        performance: performanceFromForm(form),
      },
      now
    );
    const saved = upsertVideoArchiveEntry(entry);
    if (saved) {
      setForm(formFromEntry(saved, packageFallback));
      refreshEntries(existing ? "Archive entry updated locally." : "Generation archived locally.");
      return;
    }
    setStatus("Could not save archive entry.");
  }

  function editEntry(entry: VideoArchiveEntry) {
    setForm(formFromEntry(entry, packageFallback));
    setStatus("Editing saved archive entry.");
  }

  function deleteEntry(entry: VideoArchiveEntry) {
    deleteVideoArchiveEntry(entry.archiveId);
    if (form.archiveId === entry.archiveId) setForm(formFromEntry(null, packageFallback));
    refreshEntries("Archive entry deleted locally.");
  }

  function exportArchive() {
    const json = exportVideoArchiveJson(entries);
    downloadText("wstv-video-archive-v1.json", json);
    setStatus("Archive JSON exported locally.");
  }

  async function copyArchiveJson() {
    await onCopy(exportVideoArchiveJson(entries));
    setStatus("Archive JSON copied.");
  }

  function importArchive() {
    const result = importVideoArchiveJson(importJson);
    setEntries(result.entries);
    setImportJson("");
    setStatus(
      result.importedCount
        ? "Imported " + result.importedCount + " archive entries locally."
        : "No valid archive entries found in JSON."
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-cyan-500">
              Local metadata only
            </p>
            <h3 className="mt-1 text-base font-black text-[color:var(--text)]">
              Archive this generation
            </h3>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-[color:var(--muted)]">
              Saved locally in this browser. Keep your actual video files in your Mac folder. Use Export JSON for backup. No video upload, no file storage, no cloud sync.
            </p>
          </div>
          <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-cyan-200">
            Schema v1
          </span>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3">
            <div className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--muted)]">Animal pair</div>
            <div className="mt-1 text-sm font-black text-[color:var(--text)]">{currentDraft.animalPair}</div>
          </div>
          <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3">
            <div className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--muted)]">Workflow</div>
            <div className="mt-1 text-sm font-black text-[color:var(--text)]">{currentDraft.workflowType}</div>
          </div>
          <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3">
            <div className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--muted)]">Engine route</div>
            <div className="mt-1 text-sm font-black text-[color:var(--text)]">{currentDraft.engineRoute}</div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <TextInput label="Local folder path" value={form.localFolderPath} onChange={updateField("localFolderPath")} placeholder="/Users/name/Movies/WSTV/bison-calf" />
          <TextInput label="Video file name" value={form.videoFileName} onChange={updateField("videoFileName")} placeholder="bison-calf-final.mp4" />
          <TextInput label="Thumbnail file/path" value={form.thumbnailPath} onChange={updateField("thumbnailPath")} placeholder="cover.jpg or full local path" />
          <TextInput label="Facebook URL" value={form.facebookPostUrl} onChange={updateField("facebookPostUrl")} placeholder="https://facebook.com/..." />
          <TextInput label="Tags" value={form.tags} onChange={updateField("tags")} placeholder="yellowstone, bison, direct" />
          <TextInput label="Posted date & time" value={form.postedAt} onChange={updateField("postedAt")} type="datetime-local" />
          <MetricInput label="Views" value={form.views} onChange={updateField("views")} />
          <MetricInput label="Likes" value={form.likes} onChange={updateField("likes")} />
          <MetricInput label="Shares" value={form.shares} onChange={updateField("shares")} />
          <MetricInput label="Comments" value={form.comments} onChange={updateField("comments")} />
          <MetricInput label="Watch time" value={form.watchTime} onChange={updateField("watchTime")} />
          <TextInput label="Thumbnail file name" value={form.thumbnailFileName} onChange={updateField("thumbnailFileName")} placeholder="optional separate filename" />
        </div>

        <p className="mt-2 text-[11px] font-semibold text-[color:var(--muted)]">
          Video stays in your Mac folder. Archive stores metadata only.
        </p>

        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <label className="space-y-1 text-[11px] font-bold text-[color:var(--muted)]">
            <span>Caption</span>
            <textarea
              value={form.caption}
              onChange={updateField("caption")}
              rows={3}
              placeholder="Saved Facebook caption"
              className="w-full resize-y rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-sm text-[color:var(--text)] outline-none focus:border-cyan-400"
            />
          </label>
          <label className="space-y-1 text-[11px] font-bold text-[color:var(--muted)]">
            <span>Hashtags</span>
            <textarea
              value={form.hashtags}
              onChange={updateField("hashtags")}
              rows={3}
              placeholder="#WildlifeReels #Yellowstone"
              className="w-full resize-y rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-sm text-[color:var(--text)] outline-none focus:border-cyan-400"
            />
          </label>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <label className="space-y-1 text-[11px] font-bold text-[color:var(--muted)]">
            <span>Result notes</span>
            <textarea
              value={form.resultNotes}
              onChange={updateField("resultNotes")}
              rows={4}
              placeholder="What worked, what drifted, where the saved file lives, what to improve next."
              className="w-full resize-y rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-sm text-[color:var(--text)] outline-none focus:border-cyan-400"
            />
          </label>
          <label className="space-y-1 text-[11px] font-bold text-[color:var(--muted)]">
            <span>Retention notes</span>
            <textarea
              value={form.retentionNotes}
              onChange={updateField("retentionNotes")}
              rows={4}
              placeholder="Hook held, drop-off moment, replay signal, comments pattern."
              className="w-full resize-y rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-sm text-[color:var(--text)] outline-none focus:border-cyan-400"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={saveCurrentGeneration}
            className="rounded-xl bg-cyan-700 px-4 py-2 text-xs font-extrabold text-white hover:bg-cyan-800 active:scale-95"
          >
            {form.archiveId ? "Update Archive Entry" : "Save This Generation"}
          </button>
          <button
            type="button"
            onClick={() => setForm(formFromEntry(null, packageFallback))}
            className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-xs font-bold text-[color:var(--text)] hover:bg-[color:var(--surface-muted)] active:scale-95"
          >
            Clear Form
          </button>
          {status && <span className="text-xs font-semibold text-[color:var(--muted)]">{status}</span>}
        </div>
      </section>

      <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-[color:var(--text)]">Video Archive</h3>
            <p className="mt-1 text-xs leading-relaxed text-[color:var(--muted)]">
              Search by animal pair, story mode, engine, workflow type, date/time, local path, Facebook URL, caption, hashtags, tags, or notes.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="w-full text-[10px] font-semibold text-[color:var(--muted)] sm:w-auto sm:self-center">Export JSON regularly if you want a backup before clearing browser data.</span>
            <button type="button" onClick={exportArchive} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-xs font-bold text-[color:var(--text)] hover:bg-[color:var(--surface-muted)] active:scale-95">
              Export JSON
            </button>
            <button type="button" onClick={copyArchiveJson} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-xs font-bold text-[color:var(--text)] hover:bg-[color:var(--surface-muted)] active:scale-95">
              Copy JSON
            </button>
          </div>
        </div>

        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search archive..."
          className="mt-4 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-sm text-[color:var(--text)] outline-none focus:border-cyan-400"
        />

        <div className="mt-4 space-y-3">
          {visibleEntries.length ? (
            visibleEntries.map((entry) => (
              <article key={entry.archiveId} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-3 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="break-words text-sm font-black text-[color:var(--text)]">{entry.animalPair}</h4>
                      <span className="rounded-full bg-[color:var(--surface-muted)] px-2 py-0.5 text-[10px] font-bold text-[color:var(--muted)] ring-1 ring-[color:var(--border)]">{entry.workflowType}</span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-[color:var(--muted)]">
                      Created: {readableDateTime(entry.createdAt)} · {entry.storyMode ?? "Story mode"} · {entry.engineRoute}
                    </p>
                    <p className="mt-1 break-words text-xs text-[color:var(--muted)]">
                      Posted: {readableDateTime(entry.performance.postedAt)}
                    </p>
                    <p className="mt-1 break-words text-xs text-[color:var(--muted)]">
                      Folder: {entry.localFolderPath || "not set"}
                    </p>
                    {entry.facebookPostUrl && (
                      <p className="mt-1 break-words text-xs text-cyan-300">Facebook: {entry.facebookPostUrl}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-[11px] text-[color:var(--muted)]">
                    <span className="rounded-lg border border-[color:var(--border)] px-2 py-1">Views<br /><strong className="text-[color:var(--text)]">{entry.performance.views ?? 0}</strong></span>
                    <span className="rounded-lg border border-[color:var(--border)] px-2 py-1">Likes<br /><strong className="text-[color:var(--text)]">{entry.performance.likes ?? 0}</strong></span>
                    <span className="rounded-lg border border-[color:var(--border)] px-2 py-1">Shares<br /><strong className="text-[color:var(--text)]">{entry.performance.shares ?? 0}</strong></span>
                  </div>
                </div>

                {(entry.caption || entry.hashtags) && (
                  <div className="mt-2 rounded-lg bg-[color:var(--surface-muted)] px-3 py-2 text-xs leading-relaxed text-[color:var(--muted)]">
                    {entry.caption && <p className="line-clamp-2">{entry.caption}</p>}
                    {entry.hashtags && <p className="mt-1 break-words text-cyan-300">{entry.hashtags}</p>}
                  </div>
                )}

                {entry.resultNotes && (
                  <p className="mt-2 rounded-lg bg-[color:var(--surface-muted)] px-3 py-2 text-xs leading-relaxed text-[color:var(--muted)]">
                    {entry.resultNotes}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => editEntry(entry)} className="rounded-lg bg-gray-900 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-black active:scale-95">Edit</button>
                  <button type="button" onClick={() => onCopy(entry.fullPromptPackage)} className="rounded-lg border border-[color:var(--border)] px-3 py-1.5 text-[11px] font-bold text-[color:var(--text)] hover:bg-[color:var(--surface-muted)] active:scale-95">Copy Prompt Package</button>
                  <button type="button" onClick={() => onCopy(buildVideoArchiveCaptionHashtagsText(entry))} className="rounded-lg border border-[color:var(--border)] px-3 py-1.5 text-[11px] font-bold text-[color:var(--text)] hover:bg-[color:var(--surface-muted)] active:scale-95">Copy Caption + Hashtags</button>
                  <button type="button" onClick={() => onCopy(entry.localFolderPath ?? "")} className="rounded-lg border border-[color:var(--border)] px-3 py-1.5 text-[11px] font-bold text-[color:var(--text)] hover:bg-[color:var(--surface-muted)] active:scale-95">Copy Folder Path</button>
                  <button type="button" onClick={() => deleteEntry(entry)} className="rounded-lg border border-rose-400/40 px-3 py-1.5 text-[11px] font-bold text-rose-300 hover:bg-rose-500/10 active:scale-95">Delete</button>
                </div>

                <div className="mt-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.14em] text-cyan-400">Folder Pack</span>
                    <span className="break-all font-mono text-[10px] text-[color:var(--muted)]">{buildVideoArchiveRecommendedFolderName(entry)}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button type="button" onClick={() => onCopy(buildVideoArchiveRecommendedFolderName(entry))} className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1.5 text-[11px] font-bold text-[color:var(--text)] hover:bg-[color:var(--surface-elevated)] active:scale-95">Copy Folder Name</button>
                    <button type="button" onClick={() => onCopy(buildVideoArchiveFolderChecklistText(entry))} className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1.5 text-[11px] font-bold text-[color:var(--text)] hover:bg-[color:var(--surface-elevated)] active:scale-95">Copy Folder Checklist</button>
                    <button type="button" onClick={() => downloadText("01_prompt-pack.txt", buildVideoArchivePromptPackText(entry))} className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1.5 text-[11px] font-bold text-[color:var(--text)] hover:bg-[color:var(--surface-elevated)] active:scale-95">Download Prompt TXT</button>
                    <button type="button" onClick={() => downloadText("02_caption-hashtags.txt", buildVideoArchiveCaptionHashtagsText(entry))} className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1.5 text-[11px] font-bold text-[color:var(--text)] hover:bg-[color:var(--surface-elevated)] active:scale-95">Download Caption TXT</button>
                    <button type="button" onClick={() => downloadText("03_archive-metadata.json", exportVideoArchiveEntryJson(entry))} className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1.5 text-[11px] font-bold text-[color:var(--text)] hover:bg-[color:var(--surface-elevated)] active:scale-95">Download Entry JSON</button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 text-sm text-[color:var(--muted)]">
              No saved generations match this search yet.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4 shadow-sm sm:p-5">
        <h3 className="text-base font-black text-[color:var(--text)]">Import Archive JSON</h3>
        <p className="mt-1 text-xs leading-relaxed text-[color:var(--muted)]">
          Paste a previously exported WSTV archive JSON file. Import merges entries by archiveId and stays local to this browser.
        </p>
        <textarea
          value={importJson}
          onChange={(event) => setImportJson(event.target.value)}
          rows={5}
          placeholder="Paste archive JSON here"
          className="mt-3 w-full resize-y rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 font-mono text-xs text-[color:var(--text)] outline-none focus:border-cyan-400"
        />
        <button
          type="button"
          onClick={importArchive}
          className="mt-3 rounded-xl bg-gray-900 px-4 py-2 text-xs font-extrabold text-white hover:bg-black active:scale-95"
        >
          Import JSON
        </button>
      </section>
    </div>
  );
}
