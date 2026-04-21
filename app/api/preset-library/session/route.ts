import { NextResponse } from "next/server";

import {
  authenticatePresetLibraryUser,
  createPresetLibrarySession,
  getPresetLibraryAuthCookieName,
  isPresetLibraryAuthConfigured,
  readPresetLibrarySessionFromCookieHeader,
  registerPresetLibraryUser,
} from "@/lib/preset-library-auth-server";
import { isCloudPresetLibraryConfigured } from "@/lib/cloud-preset-library-server";

export const runtime = "nodejs";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function unavailableResponse() {
  return NextResponse.json(
    {
      available: false,
      session: null,
      message:
        "Auth-backed preset libraries are not configured for this deployment. Local presets stay active.",
    },
    { status: 503 }
  );
}

function applySessionCookie(response: NextResponse, token: string) {
  response.cookies.set(getPresetLibraryAuthCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

function clearSessionCookie(response: NextResponse) {
  response.cookies.set(getPresetLibraryAuthCookieName(), "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
}

export async function GET(req: Request) {
  if (!isCloudPresetLibraryConfigured() || !isPresetLibraryAuthConfigured()) {
    return unavailableResponse();
  }

  const session = await readPresetLibrarySessionFromCookieHeader(
    req.headers.get("cookie")
  );

  return NextResponse.json({
    available: true,
    session,
    message: session
      ? `Signed in as ${session.user.email}.`
      : "Signed out. Local presets remain available.",
  });
}

export async function POST(req: Request) {
  if (!isCloudPresetLibraryConfigured() || !isPresetLibraryAuthConfigured()) {
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
  const action = record.action;
  if (action !== "sign-in" && action !== "sign-up") {
    return jsonError("A valid auth action is required.", 400);
  }

  try {
    const user =
      action === "sign-up"
        ? await registerPresetLibraryUser({
            email: String(record.email ?? ""),
            password: String(record.password ?? ""),
            displayName:
              typeof record.displayName === "string"
                ? record.displayName
                : undefined,
          })
        : await authenticatePresetLibraryUser({
            email: String(record.email ?? ""),
            password: String(record.password ?? ""),
          });

    const { session, token } = createPresetLibrarySession(user);
    const response = NextResponse.json({
      available: true,
      session,
      message:
        action === "sign-up"
          ? `Account created for ${user.email}.`
          : `Signed in as ${user.email}.`,
    });
    applySessionCookie(response, token);
    return response;
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Auth request failed.",
      400
    );
  }
}

export async function DELETE() {
  if (!isCloudPresetLibraryConfigured() || !isPresetLibraryAuthConfigured()) {
    return unavailableResponse();
  }

  const response = NextResponse.json({
    available: true,
    session: null,
    message: "Signed out. Local presets remain available.",
  });
  clearSessionCookie(response);
  return response;
}

