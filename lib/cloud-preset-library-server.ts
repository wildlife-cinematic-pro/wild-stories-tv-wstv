import { createHash } from "node:crypto";

import { get, put } from "@vercel/blob";

import type { CloudPresetLibrary } from "@/types";

import {
  createCloudPresetLibrary,
  normalizeCloudAccountId,
  normalizeCloudPresetLibrary,
} from "@/lib/workflow-preset-sync";

function getBlobToken(): string | undefined {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  return token || undefined;
}

function getPresetLibraryPathname(accountId: string): string {
  const hash = createHash("sha256")
    .update(`wstv:preset-library:${accountId}`)
    .digest("hex");
  return `workflow-preset-libraries/v1/${hash}.json`;
}

export function isCloudPresetLibraryConfigured(): boolean {
  return Boolean(getBlobToken());
}

export async function readCloudPresetLibraryFromStore(
  accountId: string
): Promise<CloudPresetLibrary | null> {
  const safeAccountId = normalizeCloudAccountId(accountId);
  const token = getBlobToken();
  if (!safeAccountId || !token) return null;

  const result = await get(getPresetLibraryPathname(safeAccountId), {
    access: "private",
    token,
    useCache: false,
  });

  if (!result || result.statusCode !== 200 || !result.stream) {
    return null;
  }

  const raw = await new Response(result.stream).text();
  try {
    return normalizeCloudPresetLibrary(JSON.parse(raw) as unknown, {
      accountId: safeAccountId,
    });
  } catch {
    return null;
  }
}

export async function writeCloudPresetLibraryToStore(
  accountId: string,
  library: CloudPresetLibrary
): Promise<CloudPresetLibrary> {
  const safeAccountId = normalizeCloudAccountId(accountId);
  const token = getBlobToken();
  if (!safeAccountId || !token) {
    throw new Error("Cloud preset library backend is not configured.");
  }

  const normalizedLibrary = createCloudPresetLibrary(safeAccountId, {
    presets: library.presets,
    presetPacks: library.presetPacks,
    defaultPresetId: library.defaultPresetId,
    updatedAt: new Date().toISOString(),
  });

  await put(
    getPresetLibraryPathname(safeAccountId),
    JSON.stringify(normalizedLibrary, null, 2),
    {
      access: "private",
      allowOverwrite: true,
      addRandomSuffix: false,
      contentType: "application/json",
      token,
    }
  );

  return normalizedLibrary;
}
