import type { GeneratedPackage } from "@/types";

import { buildCopyAllPacksText } from "@/lib/export-text";

export const VIDEO_ARCHIVE_SCHEMA_VERSION = 1;
export const VIDEO_ARCHIVE_STORAGE_KEY = "wstv.videoArchive.v1";
export const VIDEO_ARCHIVE_STORAGE_EVENT = "wstv:video-archive-updated";

export type VideoArchivePerformanceStats = {
  views?: number;
  likes?: number;
  shares?: number;
  comments?: number;
  watchTime?: number;
  retentionNotes?: string;
  postedAt?: string;
};

export type VideoArchiveEntry = {
  archiveSchemaVersion: 1;
  archiveId: string;
  createdAt: string;
  updatedAt: string;
  generationId: string;
  storyMode?: string;
  animalPair: string;
  subjectA?: string;
  subjectB?: string;
  predatorName?: string;
  preyName?: string;
  engineRoute: string;
  workflowType: string;
  fullPromptPackage: string;
  promptPackage: unknown;
  imagePrompt?: string;
  videoPrompt?: string;
  caption?: string;
  hashtags?: string;
  tags?: string;
  localFolderPath?: string;
  videoFileName?: string;
  thumbnailFileName?: string;
  thumbnailPath?: string;
  facebookPostUrl?: string;
  resultNotes?: string;
  performance: VideoArchivePerformanceStats;
};

type StoredPayload = {
  archiveSchemaVersion: 1;
  entries: unknown[];
};

type EntryDraft = Partial<VideoArchiveEntry>;

const FORBIDDEN_BINARY_KEYS = new Set([
  "videoBlob",
  "videoBase64",
  "videoBinary",
  "videoData",
  "videoFileData",
  "videoObjectUrl",
  "thumbnailBlob",
  "thumbnailBase64",
  "thumbnailData",
  "fileBlob",
  "fileBase64",
  "fileBinary",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function optionalText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function textValue(value: unknown, fallback = "") {
  if (typeof value === "string") return value.trim() || fallback;
  if (Array.isArray(value)) {
    const text = value.map((item) => String(item ?? "")).join("\n").trim();
    return text || fallback;
  }
  const text = String(value ?? "").trim();
  return text || fallback;
}

function optionalNonNegativeNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : undefined;
}

function newArchiveId() {
  return "archive_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}

function generatedAtId(data: GeneratedPackage) {
  return [data.subjectA ?? data.predatorName, data.subjectB ?? data.preyName, data.generatedAt]
    .filter(Boolean)
    .join("|");
}

export function getVideoArchiveGenerationId(data: GeneratedPackage): string {
  return data.generationId || generatedAtId(data) || "current-generated-package";
}

function isForbiddenBinaryKey(key: string) {
  return (
    FORBIDDEN_BINARY_KEYS.has(key) ||
    /(?:blob|binary|base64)$/i.test(key) ||
    /(?:^|_)(?:blob|binary|base64)(?:$|_)/i.test(key)
  );
}

export function sanitizeArchiveMetadata(value: unknown): unknown {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^(?:data:video|blob:)/i.test(trimmed)) return "";
    return value;
  }

  if (Array.isArray(value)) return value.map((item) => sanitizeArchiveMetadata(item));

  if (!isRecord(value)) return value;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !isForbiddenBinaryKey(key))
      .map(([key, entryValue]) => [key, sanitizeArchiveMetadata(entryValue)])
  );
}

function normalizePerformanceStats(value: unknown): VideoArchivePerformanceStats {
  if (!isRecord(value)) return {};
  const stats: VideoArchivePerformanceStats = {};
  const views = optionalNonNegativeNumber(value.views);
  const likes = optionalNonNegativeNumber(value.likes);
  const shares = optionalNonNegativeNumber(value.shares);
  const comments = optionalNonNegativeNumber(value.comments);
  const watchTime = optionalNonNegativeNumber(value.watchTime);
  const retentionNotes = optionalText(value.retentionNotes);
  const postedAt = optionalText(value.postedAt);

  if (views !== undefined) stats.views = views;
  if (likes !== undefined) stats.likes = likes;
  if (shares !== undefined) stats.shares = shares;
  if (comments !== undefined) stats.comments = comments;
  if (watchTime !== undefined) stats.watchTime = watchTime;
  if (retentionNotes) stats.retentionNotes = retentionNotes;
  if (postedAt) stats.postedAt = postedAt;

  return stats;
}

function deriveAnimalPair(data: GeneratedPackage) {
  const subjectA = textValue(data.subjectA ?? data.predatorName, "Subject A");
  const subjectB = textValue(data.subjectB ?? data.preyName, "Subject B");
  return [subjectA, subjectB].filter(Boolean).join(" vs ") || "Untitled wildlife generation";
}

function deriveEngineRoute(data: GeneratedPackage) {
  return (
    optionalText(data.primaryVideoRoute?.label) ||
    optionalText(data.selectedVideoModel?.routeLabel) ||
    optionalText(data.routingNote) ||
    optionalText(data.modelsUsed?.kling) ||
    "WSTV generated route"
  );
}

function deriveWorkflowType(data: GeneratedPackage) {
  const kind = data.primaryVideoRoute?.kind;
  if (kind === "seedance-direct" || kind === "kling-direct") return "Direct 15s";
  if (kind === "hybrid" || data.primaryVideoRoute?.workspaceTab === "hybrid") return "Hybrid 4-shot";
  if (data.primaryVideoRoute?.workspaceTab === "seedance") return "Seedance";
  if (data.primaryVideoRoute?.workspaceTab === "kling") return "Kling";
  if (data.primaryVideoRoute?.workspaceTab === "runway") return "Runway";
  if (data.seedanceMultiShotPrompt || data.klingFramesPrompt || data.klingNative15s) return "Direct 15s";
  return data.pipelineStyle ? String(data.pipelineStyle) : "WSTV output";
}

function derivePrimaryVideoPrompt(data: GeneratedPackage) {
  const kind = data.primaryVideoRoute?.kind;
  if (kind === "seedance-direct") return optionalText(data.seedanceMultiShotPrompt);
  if (kind === "kling-direct") return optionalText(data.klingFramesPrompt ?? data.klingNative15s);
  if (data.primaryVideoRoute?.workspaceTab === "seedance") return optionalText(data.seedanceShots?.[0]);
  if (data.primaryVideoRoute?.workspaceTab === "kling") return optionalText(data.klingShots?.[0]);
  if (data.primaryVideoRoute?.workspaceTab === "runway") return optionalText(data.runwayShots?.[0]);
  return (
    optionalText(data.shotPlan?.[0]?.prompt) ||
    optionalText(data.runwayShots?.[0]) ||
    optionalText(data.klingShots?.[0]) ||
    optionalText(data.seedanceMultiShotPrompt) ||
    optionalText(data.klingFramesPrompt ?? data.klingNative15s)
  );
}

export function createVideoArchiveEntryFromPackage(
  data: GeneratedPackage,
  draft: EntryDraft = {},
  now = new Date().toISOString()
): VideoArchiveEntry {
  const createdAt = draft.createdAt ?? now;
  const subjectA = optionalText(draft.subjectA) ?? optionalText(data.subjectA ?? data.predatorName);
  const subjectB = optionalText(draft.subjectB) ?? optionalText(data.subjectB ?? data.preyName);
  const promptPackage = sanitizeArchiveMetadata(data);

  return {
    archiveSchemaVersion: VIDEO_ARCHIVE_SCHEMA_VERSION,
    archiveId: draft.archiveId ?? newArchiveId(),
    createdAt,
    updatedAt: draft.updatedAt ?? now,
    generationId: draft.generationId ?? getVideoArchiveGenerationId(data),
    storyMode: optionalText(draft.storyMode) ?? optionalText(data.storyMode),
    animalPair: [subjectA, subjectB].filter(Boolean).join(" vs ") || deriveAnimalPair(data),
    subjectA,
    subjectB,
    predatorName: optionalText(draft.predatorName) ?? optionalText(data.predatorName),
    preyName: optionalText(draft.preyName) ?? optionalText(data.preyName),
    engineRoute: optionalText(draft.engineRoute) ?? deriveEngineRoute(data),
    workflowType: optionalText(draft.workflowType) ?? deriveWorkflowType(data),
    fullPromptPackage: optionalText(draft.fullPromptPackage) ?? buildCopyAllPacksText(data),
    promptPackage,
    imagePrompt: optionalText(draft.imagePrompt) ?? optionalText(data.imagePrompt),
    videoPrompt: optionalText(draft.videoPrompt) ?? derivePrimaryVideoPrompt(data),
    caption: optionalText(draft.caption) ?? optionalText(data.caption2026 || data.caption),
    hashtags: optionalText(draft.hashtags) ?? optionalText(data.hashtags),
    tags: optionalText(draft.tags) ?? optionalText(data.tags),
    localFolderPath: optionalText(draft.localFolderPath),
    videoFileName: optionalText(draft.videoFileName),
    thumbnailFileName: optionalText(draft.thumbnailFileName),
    thumbnailPath: optionalText(draft.thumbnailPath),
    facebookPostUrl: optionalText(draft.facebookPostUrl),
    resultNotes: optionalText(draft.resultNotes),
    performance: normalizePerformanceStats(draft.performance),
  };
}

export function buildVideoArchiveCaptionHashtagsText(entry: Pick<VideoArchiveEntry, "caption" | "hashtags">): string {
  return [entry.caption, entry.hashtags].filter(Boolean).join("\n\n");
}

function folderSegment(value: string | undefined, fallback: string): string {
  const source = (value?.trim() || fallback).replace(/&/g, " and ");
  const normalized = source
    .replace(/[_\s]+/g, "-")
    .replace(/[^A-Za-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized || fallback;
}

function storyModeFolderSegment(storyMode: string | undefined): string {
  if (!storyMode) return "Story-Mode";
  return folderSegment(
    storyMode
      .toLowerCase()
      .split(/[_\s-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" "),
    "Story-Mode"
  );
}

function folderDate(createdAt: string): string {
  const match = createdAt.match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : "undated";
}

export function buildVideoArchiveRecommendedFolderName(entry: VideoArchiveEntry): string {
  const pairParts = entry.animalPair.split(/\s+vs\s+/i);
  const subjectA = folderSegment(entry.subjectA ?? pairParts[0], "AnimalA");
  const subjectB = folderSegment(entry.subjectB ?? pairParts[1], "AnimalB");
  const storyMode = storyModeFolderSegment(entry.storyMode);
  const workflow = folderSegment(entry.workflowType, "Workflow");
  return [folderDate(entry.createdAt), subjectA + "-vs-" + subjectB, storyMode, workflow].join("_");
}

export function buildVideoArchiveFolderChecklistText(entry: VideoArchiveEntry): string {
  const folderName = buildVideoArchiveRecommendedFolderName(entry);
  return [
    "WSTV Archive Folder Checklist",
    "",
    "Recommended folder name:",
    folderName,
    "",
    "[ ] Create folder with recommended name",
    "[ ] Save downloaded prompt pack as 01_prompt-pack.txt",
    "[ ] Save caption/hashtags as 02_caption-hashtags.txt",
    "[ ] Save archive metadata as 03_archive-metadata.json",
    "[ ] Save final video as 04_final-video.mp4",
    "[ ] Save thumbnail as 05_thumbnail.jpg",
    "[ ] Add Facebook URL after posting",
    "[ ] Add performance stats after 24h / 48h / 7d",
  ].join("\n");
}

export function buildVideoArchivePromptPackText(entry: Pick<VideoArchiveEntry, "fullPromptPackage">): string {
  return entry.fullPromptPackage || "";
}

export function exportVideoArchiveEntryJson(entry: VideoArchiveEntry): string {
  const normalized = normalizeVideoArchiveEntry(sanitizeArchiveMetadata(entry));
  return JSON.stringify(
    {
      archiveSchemaVersion: VIDEO_ARCHIVE_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      entry: normalized,
    },
    null,
    2
  );
}

export function videoArchiveEntryMatchesSearch(entry: VideoArchiveEntry, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  return [
    entry.createdAt,
    entry.updatedAt,
    entry.performance.postedAt,
    entry.animalPair,
    entry.storyMode,
    entry.engineRoute,
    entry.workflowType,
    entry.localFolderPath,
    entry.facebookPostUrl,
    entry.caption,
    entry.hashtags,
    entry.tags,
    entry.resultNotes,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(q);
}

export function normalizeVideoArchiveEntry(value: unknown): VideoArchiveEntry | null {
  if (!isRecord(value)) return null;

  const archiveId = optionalText(value.archiveId);
  const createdAt = optionalText(value.createdAt);
  const updatedAt = optionalText(value.updatedAt);
  const generationId = optionalText(value.generationId);
  const animalPair = optionalText(value.animalPair);
  const engineRoute = optionalText(value.engineRoute);
  const workflowType = optionalText(value.workflowType);
  const fullPromptPackage = optionalText(value.fullPromptPackage) ?? "";

  if (!archiveId || !createdAt || !updatedAt || !generationId || !animalPair || !engineRoute || !workflowType) {
    return null;
  }

  return {
    archiveSchemaVersion: VIDEO_ARCHIVE_SCHEMA_VERSION,
    archiveId,
    createdAt,
    updatedAt,
    generationId,
    storyMode: optionalText(value.storyMode),
    animalPair,
    subjectA: optionalText(value.subjectA),
    subjectB: optionalText(value.subjectB),
    predatorName: optionalText(value.predatorName),
    preyName: optionalText(value.preyName),
    engineRoute,
    workflowType,
    fullPromptPackage,
    promptPackage: sanitizeArchiveMetadata(value.promptPackage),
    imagePrompt: optionalText(value.imagePrompt),
    videoPrompt: optionalText(value.videoPrompt),
    caption: optionalText(value.caption),
    hashtags: optionalText(value.hashtags),
    tags: optionalText(value.tags),
    localFolderPath: optionalText(value.localFolderPath),
    videoFileName: optionalText(value.videoFileName),
    thumbnailFileName: optionalText(value.thumbnailFileName),
    thumbnailPath: optionalText(value.thumbnailPath),
    facebookPostUrl: optionalText(value.facebookPostUrl),
    resultNotes: optionalText(value.resultNotes),
    performance: normalizePerformanceStats(value.performance),
  };
}

function parseStoredPayload(raw: string | null): StoredPayload | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return { archiveSchemaVersion: VIDEO_ARCHIVE_SCHEMA_VERSION, entries: parsed };
    }
    if (!isRecord(parsed) || !Array.isArray(parsed.entries)) return null;
    return {
      archiveSchemaVersion: VIDEO_ARCHIVE_SCHEMA_VERSION,
      entries: parsed.entries,
    };
  } catch {
    return null;
  }
}

function emitStorageEvent(): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new Event(VIDEO_ARCHIVE_STORAGE_EVENT));
  } catch {}
}

export function readVideoArchiveEntries(): VideoArchiveEntry[] {
  if (typeof localStorage === "undefined") return [];

  try {
    const payload = parseStoredPayload(localStorage.getItem(VIDEO_ARCHIVE_STORAGE_KEY));
    if (!payload) return [];
    return payload.entries
      .map((entry) => normalizeVideoArchiveEntry(entry))
      .filter((entry): entry is VideoArchiveEntry => Boolean(entry))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    return [];
  }
}

export function writeVideoArchiveEntries(entries: VideoArchiveEntry[]): void {
  if (typeof localStorage === "undefined") return;

  try {
    const normalized = entries
      .map((entry) => normalizeVideoArchiveEntry(sanitizeArchiveMetadata(entry)))
      .filter((entry): entry is VideoArchiveEntry => Boolean(entry));

    localStorage.setItem(
      VIDEO_ARCHIVE_STORAGE_KEY,
      JSON.stringify({
        archiveSchemaVersion: VIDEO_ARCHIVE_SCHEMA_VERSION,
        entries: normalized,
      })
    );
    emitStorageEvent();
  } catch {}
}

export function upsertVideoArchiveEntry(entry: VideoArchiveEntry): VideoArchiveEntry | null {
  const normalized = normalizeVideoArchiveEntry(sanitizeArchiveMetadata(entry));
  if (!normalized) return null;

  const existing = readVideoArchiveEntries();
  writeVideoArchiveEntries([
    normalized,
    ...existing.filter((candidate) => candidate.archiveId !== normalized.archiveId),
  ]);
  return normalized;
}

export function deleteVideoArchiveEntry(archiveId: string): void {
  const trimmedId = archiveId.trim();
  if (!trimmedId) return;
  writeVideoArchiveEntries(
    readVideoArchiveEntries().filter((entry) => entry.archiveId !== trimmedId)
  );
}

export function findVideoArchiveEntryByGenerationId(generationId: string): VideoArchiveEntry | null {
  const trimmedGenerationId = generationId.trim();
  if (!trimmedGenerationId) return null;
  return readVideoArchiveEntries().find((entry) => entry.generationId === trimmedGenerationId) ?? null;
}

export function updateVideoArchiveEntry(
  archiveId: string,
  patch: Partial<VideoArchiveEntry>
): VideoArchiveEntry | null {
  const existing = readVideoArchiveEntries();
  const current = existing.find((entry) => entry.archiveId === archiveId);
  if (!current) return null;

  const next = normalizeVideoArchiveEntry(
    sanitizeArchiveMetadata({
      ...current,
      ...patch,
      archiveSchemaVersion: VIDEO_ARCHIVE_SCHEMA_VERSION,
      archiveId: current.archiveId,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
      performance: {
        ...current.performance,
        ...patch.performance,
      },
    })
  );
  if (!next) return null;
  writeVideoArchiveEntries([next, ...existing.filter((entry) => entry.archiveId !== archiveId)]);
  return next;
}

export function exportVideoArchiveJson(entries = readVideoArchiveEntries()): string {
  return JSON.stringify(
    {
      archiveSchemaVersion: VIDEO_ARCHIVE_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      entries: entries
        .map((entry) => normalizeVideoArchiveEntry(sanitizeArchiveMetadata(entry)))
        .filter((entry): entry is VideoArchiveEntry => Boolean(entry)),
    },
    null,
    2
  );
}

export function parseVideoArchiveImportJson(raw: string): VideoArchiveEntry[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    const entries = Array.isArray(parsed)
      ? parsed
      : isRecord(parsed) && Array.isArray(parsed.entries)
        ? parsed.entries
        : [];

    return entries
      .map((entry) => normalizeVideoArchiveEntry(sanitizeArchiveMetadata(entry)))
      .filter((entry): entry is VideoArchiveEntry => Boolean(entry));
  } catch {
    return [];
  }
}

export function importVideoArchiveJson(raw: string): { importedCount: number; entries: VideoArchiveEntry[] } {
  const imported = parseVideoArchiveImportJson(raw);
  if (!imported.length) {
    return { importedCount: 0, entries: readVideoArchiveEntries() };
  }

  const existing = readVideoArchiveEntries();
  const importedIds = new Set(imported.map((entry) => entry.archiveId));
  const next = [...imported, ...existing.filter((entry) => !importedIds.has(entry.archiveId))];
  writeVideoArchiveEntries(next);

  return { importedCount: imported.length, entries: readVideoArchiveEntries() };
}
