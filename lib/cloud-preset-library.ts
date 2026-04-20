import type { CloudPresetLibrary } from "@/types";

import {
  createCloudPresetLibrary,
  normalizeCloudAccountId,
  normalizeCloudPresetLibrary,
} from "@/lib/workflow-preset-sync";

type CloudPresetLibraryApiResult = {
  available: boolean;
  library: CloudPresetLibrary | null;
  message?: string;
};

async function parseJsonResponse(response: Response): Promise<unknown> {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

export async function fetchCloudPresetLibrary(
  accountId: string
): Promise<CloudPresetLibraryApiResult> {
  const safeAccountId = normalizeCloudAccountId(accountId);
  if (!safeAccountId) {
    return {
      available: false,
      library: null,
      message: "Enter a valid cloud account ID to use cloud sync.",
    };
  }

  const response = await fetch(
    `/api/preset-library?accountId=${encodeURIComponent(safeAccountId)}`,
    { cache: "no-store" }
  );
  const data = await parseJsonResponse(response);
  const record =
    data && typeof data === "object" && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : null;

  if (response.status === 503) {
    return {
      available: false,
      library: null,
      message:
        typeof record?.message === "string"
          ? record.message
          : "Cloud sync is unavailable for this project right now.",
    };
  }

  if (!response.ok) {
    throw new Error(
      typeof record?.error === "string"
        ? record.error
        : "Cloud preset library request failed."
    );
  }

  const normalizedLibrary = record?.library
    ? normalizeCloudPresetLibrary(record.library, { accountId: safeAccountId })
    : null;

  return {
    available: true,
    library: normalizedLibrary,
    message:
      typeof record?.message === "string" ? record.message : undefined,
  };
}

export async function saveCloudPresetLibrary(
  accountId: string,
  library: CloudPresetLibrary
): Promise<CloudPresetLibraryApiResult> {
  const safeAccountId = normalizeCloudAccountId(accountId);
  if (!safeAccountId) {
    throw new Error("Enter a valid cloud account ID to sync this library.");
  }

  const response = await fetch("/api/preset-library", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      accountId: safeAccountId,
      library: createCloudPresetLibrary(safeAccountId, library),
    }),
  });
  const data = await parseJsonResponse(response);
  const record =
    data && typeof data === "object" && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : null;

  if (response.status === 503) {
    return {
      available: false,
      library: null,
      message:
        typeof record?.message === "string"
          ? record.message
          : "Cloud sync is unavailable for this project right now.",
    };
  }

  if (!response.ok) {
    throw new Error(
      typeof record?.error === "string"
        ? record.error
        : "Cloud preset library save failed."
    );
  }

  return {
    available: true,
    library: record?.library
      ? normalizeCloudPresetLibrary(record.library, { accountId: safeAccountId })
      : null,
    message:
      typeof record?.message === "string" ? record.message : undefined,
  };
}
