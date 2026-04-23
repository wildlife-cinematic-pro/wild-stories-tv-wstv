import { NextResponse } from "next/server";

import {
  assertSharedLibraryOwner,
  isCloudPresetLibraryConfigured,
  removeSharedPresetLibraryMemberFromStore,
  upsertSharedPresetLibraryMemberInStore,
} from "@/lib/cloud-preset-library-server";
import {
  isPresetLibraryAuthConfigured,
  readPresetLibrarySessionFromCookieHeader,
} from "@/lib/preset-library-auth-server";
import {
  buildSharedWorkflowPresetLibraryRecord,
  normalizeCloudLibraryId,
  normalizeWorkflowPresetLibraryRole,
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
        "Auth-backed preset libraries are not configured for this deployment. Local presets stay active.",
    },
    { status: 503 }
  );
}

async function requireOwner(req: Request, libraryId: string) {
  const session = await readPresetLibrarySessionFromCookieHeader(
    req.headers.get("cookie")
  );
  if (!session) {
    return {
      error: jsonError("Sign in to manage shared library access.", 401),
      session: null,
    };
  }

  try {
    await assertSharedLibraryOwner(libraryId, session.user.id);
    return { error: null, session };
  } catch (error) {
    return {
      error: jsonError(
        error instanceof Error ? error.message : "Access denied.",
        403
      ),
      session: null,
    };
  }
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ libraryId: string }> }
) {
  if (!isCloudPresetLibraryConfigured() || !isPresetLibraryAuthConfigured()) {
    return unavailableResponse();
  }

  const params = await context.params;
  const libraryId = normalizeCloudLibraryId(params.libraryId);
  if (!libraryId) {
    return jsonError("A valid shared library id is required.", 400);
  }

  const ownerCheck = await requireOwner(req, libraryId);
  if (ownerCheck.error) return ownerCheck.error;
  const session = ownerCheck.session;
  if (!session) {
    return jsonError("Sign in to manage shared library access.", 401);
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
  const email = typeof record.email === "string" ? record.email.trim() : "";
  const requestedRole = normalizeWorkflowPresetLibraryRole(record.role, "viewer");
  if (!email) {
    return jsonError("Member email is required.", 400);
  }
  if (requestedRole === "owner") {
    return jsonError("Shared members can only be editors or viewers.", 400);
  }

  try {
    const storedLibrary = await upsertSharedPresetLibraryMemberInStore(libraryId, {
      email,
      role: requestedRole,
    });
    const savedRole =
      storedLibrary.members.find((member) => member.email === email.toLowerCase())?.role ??
      requestedRole;
    return NextResponse.json({
      available: true,
      library: buildSharedWorkflowPresetLibraryRecord(
        storedLibrary,
        session.user.id
      ),
      message: `Saved ${savedRole} access for ${email}.`,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error
        ? error.message
        : "Shared library access could not be updated.",
      400
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ libraryId: string }> }
) {
  if (!isCloudPresetLibraryConfigured() || !isPresetLibraryAuthConfigured()) {
    return unavailableResponse();
  }

  const params = await context.params;
  const libraryId = normalizeCloudLibraryId(params.libraryId);
  if (!libraryId) {
    return jsonError("A valid shared library id is required.", 400);
  }

  const ownerCheck = await requireOwner(req, libraryId);
  if (ownerCheck.error) return ownerCheck.error;
  const session = ownerCheck.session;
  if (!session) {
    return jsonError("Sign in to manage shared library access.", 401);
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
  const userId =
    typeof record.userId === "string" ? record.userId.trim() : "";
  if (!userId) {
    return jsonError("Member user id is required.", 400);
  }

  try {
    const storedLibrary = await removeSharedPresetLibraryMemberFromStore(
      libraryId,
      userId
    );
    return NextResponse.json({
      available: true,
      library: buildSharedWorkflowPresetLibraryRecord(
        storedLibrary,
        session.user.id
      ),
      message: "Removed shared library member.",
    });
  } catch (error) {
    return jsonError(
      error instanceof Error
        ? error.message
        : "Shared library member could not be removed.",
      400
    );
  }
}
