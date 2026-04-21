import { NextResponse } from "next/server";

import {
  assertSharedLibraryWriteAccess,
  isCloudPresetLibraryConfigured,
  listSharedPresetLibrariesForUser,
  readPersonalPresetLibraryFromStore,
  writePersonalPresetLibraryToStore,
  writeSharedPresetLibraryToStore,
} from "@/lib/cloud-preset-library-server";
import {
  isPresetLibraryAuthConfigured,
  readPresetLibrarySessionFromCookieHeader,
} from "@/lib/preset-library-auth-server";
import {
  buildPersonalCloudLibraryId,
  buildPersonalWorkflowPresetLibraryRecord,
  buildSharedWorkflowPresetLibraryRecord,
  createCloudPresetLibrary,
  mergeCloudPresetLibraries,
  normalizeCloudLibraryId,
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
      catalog: null,
      message:
        "Auth-backed preset libraries are not configured for this deployment. Local presets stay active.",
    },
    { status: 503 }
  );
}

async function requireSession(req: Request) {
  const session = await readPresetLibrarySessionFromCookieHeader(
    req.headers.get("cookie")
  );
  if (!session) return null;
  return session;
}

export async function GET(req: Request) {
  if (!isCloudPresetLibraryConfigured() || !isPresetLibraryAuthConfigured()) {
    return unavailableResponse();
  }

  const session = await requireSession(req);
  if (!session) {
    return NextResponse.json(
      {
        available: true,
        catalog: null,
        message: "Sign in to load your personal and shared preset libraries.",
      },
      { status: 401 }
    );
  }

  try {
    const personalLibrary =
      (await readPersonalPresetLibraryFromStore(session.user.id)) ??
      createCloudPresetLibrary(buildPersonalCloudLibraryId(session.user.id));
    const sharedLibraries = await listSharedPresetLibrariesForUser(session.user.id);

    return NextResponse.json({
      available: true,
      catalog: {
        personalLibrary: buildPersonalWorkflowPresetLibraryRecord(
          session.user,
          personalLibrary
        ),
        sharedLibraries: sharedLibraries
          .map((library) =>
            buildSharedWorkflowPresetLibraryRecord(library, session.user.id)
          )
          .filter(Boolean),
      },
    });
  } catch (error) {
    return jsonError(
      error instanceof Error
        ? error.message
        : "Preset library catalog could not be loaded.",
      500
    );
  }
}

export async function PUT(req: Request) {
  if (!isCloudPresetLibraryConfigured() || !isPresetLibraryAuthConfigured()) {
    return unavailableResponse();
  }

  const session = await requireSession(req);
  if (!session) {
    return jsonError("Sign in to sync a cloud preset library.", 401);
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
  const requestedLibraryId = normalizeCloudLibraryId(record.libraryId);
  const personalLibraryId = buildPersonalCloudLibraryId(session.user.id);
  const libraryId = requestedLibraryId ?? personalLibraryId;
  const normalizedLibrary = normalizeCloudPresetLibrary(record.library, {
    libraryId,
  });
  if (!normalizedLibrary) {
    return jsonError("Preset library payload is invalid.", 400);
  }

  try {
    if (libraryId === personalLibraryId) {
      const currentLibrary = await readPersonalPresetLibraryFromStore(
        session.user.id
      );
      const merged = mergeCloudPresetLibraries(normalizedLibrary, currentLibrary, {
        now: new Date().toISOString(),
      });
      const savedLibrary = await writePersonalPresetLibraryToStore(
        session.user.id,
        merged.library
      );
      return NextResponse.json({
        available: true,
        library: buildPersonalWorkflowPresetLibraryRecord(
          session.user,
          savedLibrary
        ),
        message: "Personal preset library synced.",
      });
    }

    const currentSharedLibrary = await assertSharedLibraryWriteAccess(
      libraryId,
      session.user.id
    );
    const merged = mergeCloudPresetLibraries(
      normalizedLibrary,
      currentSharedLibrary.data,
      { now: new Date().toISOString() }
    );
    const savedLibrary = await writeSharedPresetLibraryToStore({
      ...currentSharedLibrary,
      data: merged.library,
    });
    const visibleLibrary = buildSharedWorkflowPresetLibraryRecord(
      savedLibrary,
      session.user.id
    );

    return NextResponse.json({
      available: true,
      library: visibleLibrary,
      message: "Shared preset library synced.",
    });
  } catch (error) {
    return jsonError(
      error instanceof Error
        ? error.message
        : "Preset library could not be saved.",
      500
    );
  }
}
