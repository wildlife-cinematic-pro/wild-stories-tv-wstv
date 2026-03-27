// file: lib/versioning.ts
import type { PromptVersion } from "@/types";
import { readPromptVersions, writePromptVersions, downloadJson } from "@/lib/storage";

export const MAX_VERSIONS_PER_KEY = 25;

export function makePromptVersionKey(predator: string, prey: string, arc: string): string {
  return `${predator}|${prey}|${arc}`;
}

export function getVersionsForKey(key: string): PromptVersion[] {
  const map = readPromptVersions();
  return map[key] ?? [];
}

export function getNextVersionNumber(key: string): number {
  const list = getVersionsForKey(key);
  return (list[0]?.version ?? 0) + 1;
}

export function appendPromptVersion(key: string, v: PromptVersion, limit = MAX_VERSIONS_PER_KEY): void {
  const map = readPromptVersions();
  const list = map[key] ?? [];
  map[key] = [v, ...list].slice(0, limit);
  writePromptVersions(map);
}

export function clearVersionsForKey(key: string): void {
  const map = readPromptVersions();
  delete map[key];
  writePromptVersions(map);
}

export function exportVersionsForKey(key: string): void {
  const versions = getVersionsForKey(key);
  downloadJson(`prompt-versions-${key.replace(/[^\w|-]+/g, "_")}.json`, {
    key,
    exportedAt: new Date().toISOString(),
    versions,
  });
}

/**
 * Import strategy:
 * - Accept JSON containing { versions: PromptVersion[] } OR PromptVersion[] directly.
 * - Merge into existing list (by timestamp unique), keep newest first, limit.
 */
export function importVersionsForKey(key: string, raw: unknown, limit = MAX_VERSIONS_PER_KEY): number {
 const incoming: PromptVersion[] = Array.isArray(raw)
  ? (raw as PromptVersion[])
  : Array.isArray((raw as { versions?: unknown }).versions)
    ? (raw as { versions: PromptVersion[] }).versions
    : [];
if (!incoming.length) return 0;
const map = readPromptVersions();
const existing = map[key] ?? [];
const byTs = new Map<string, PromptVersion>();
for (const v of existing) byTs.set(v.timestamp, v);
for (const v of incoming) {
  if (v && typeof v === "object" && typeof v.timestamp === "string") {
    byTs.set(v.timestamp, v as PromptVersion);
  }
}

  const merged = Array.from(byTs.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  map[key] = merged.slice(0, limit);
  writePromptVersions(map);

  return incoming.length;
}

export function updateVersionMeta(key: string, ts: string, patch: Partial<Pick<PromptVersion, "label" | "pinned">>): void {
  const map = readPromptVersions();
  const list = map[key] ?? [];
  const next = list.map((v) => (v.timestamp === ts ? { ...v, ...patch } : v));
  map[key] = next;
  writePromptVersions(map);
}
