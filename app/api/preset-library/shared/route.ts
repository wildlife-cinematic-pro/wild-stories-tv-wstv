import { NextResponse } from "next/server";

import {
  createSharedPresetLibraryInStore,
  isCloudPresetLibraryConfigured,
} from "@/lib/cloud-preset-library-server";
import {
  isPresetLibraryAuthConfigured,
  readPresetLibrarySessionFromCookieHeader,
} from "@/lib/preset-library-auth-server";
import { buildSharedWorkflowPresetLibraryRecord } from "@/lib/workflow-preset-sync";

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

export async function POST(req: Request) {
  if (!isCloudPresetLibraryConfigured() || !isPresetLibraryAuthConfigured()) {
    return unavailableResponse();
  }

  const session = await readPresetLibrarySessionFromCookieHeader(
    req.headers.get("cookie")
  );
  if (!session) {
    return jsonError("Sign in to create a shared library.", 401);
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
  const name =
    typeof record.name === "string" ? record.name.trim().slice(0, 80) : "";
  const description =
    typeof record.description === "string"
      ? record.description.trim().slice(0, 240)
      : "";
  if (!name) {
    return jsonError("Shared library name is required.", 400);
  }

  try {
    const storedLibrary = await createSharedPresetLibraryInStore(session.user, {
      name,
      description,
    });
    return NextResponse.json({
      available: true,
      library: buildSharedWorkflowPresetLibraryRecord(
        storedLibrary,
        session.user.id
      ),
      message: `Created shared library ${storedLibrary.name}.`,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error
        ? error.message
        : "Shared library could not be created.",
      500
    );
  }
}

