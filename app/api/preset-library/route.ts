import { NextResponse } from "next/server";

import {
  isCloudPresetLibraryConfigured,
  readCloudPresetLibraryFromStore,
  writeCloudPresetLibraryToStore,
} from "@/lib/cloud-preset-library-server";
import {
  createCloudPresetLibrary,
  normalizeCloudAccountId,
  normalizeCloudPresetLibrary,
} from "@/lib/workflow-preset-sync";

export const runtime = "nodejs";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function unavailableResponse() {
  return NextResponse.json(
    {
      available: false,
      library: null,
      message:
        "Cloud preset library is not configured for this deployment. Local presets stay active.",
    },
    { status: 503 }
  );
}

export async function GET(req: Request) {
  if (!isCloudPresetLibraryConfigured()) {
    return unavailableResponse();
  }

  const accountId = normalizeCloudAccountId(
    new URL(req.url).searchParams.get("accountId")
  );
  if (!accountId) {
    return jsonError("A valid cloud account ID is required.", 400);
  }

  try {
    const library = await readCloudPresetLibraryFromStore(accountId);
    return NextResponse.json({
      available: true,
      library,
      message: library
        ? undefined
        : "No cloud preset library found for this account yet.",
    });
  } catch (error) {
    return jsonError(
      error instanceof Error
        ? error.message
        : "Cloud preset library could not be loaded.",
      500
    );
  }
}

export async function PUT(req: Request) {
  if (!isCloudPresetLibraryConfigured()) {
    return unavailableResponse();
  }

  let body: unknown;
  try {
    body = (await req.json()) as unknown;
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return jsonError("Request body must be an object.", 400);
  }

  const record = body as Record<string, unknown>;
  const accountId = normalizeCloudAccountId(record.accountId);
  if (!accountId) {
    return jsonError("A valid cloud account ID is required.", 400);
  }

  const normalizedLibrary = normalizeCloudPresetLibrary(record.library, {
    accountId,
  });
  if (!normalizedLibrary) {
    return jsonError("Cloud preset library payload is invalid.", 400);
  }

  try {
    const savedLibrary = await writeCloudPresetLibraryToStore(
      accountId,
      createCloudPresetLibrary(accountId, normalizedLibrary)
    );
    return NextResponse.json({
      available: true,
      library: savedLibrary,
      message: "Cloud preset library synced.",
    });
  } catch (error) {
    return jsonError(
      error instanceof Error
        ? error.message
        : "Cloud preset library could not be saved.",
      500
    );
  }
}
