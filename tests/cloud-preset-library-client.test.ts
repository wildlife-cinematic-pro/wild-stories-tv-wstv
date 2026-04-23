import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchPresetLibrarySession,
  signInPresetLibraryUser,
  signOutPresetLibraryUser,
} from "@/lib/cloud-preset-library";

describe("cloud preset library client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps local-only messaging when auth-backed cloud libraries are unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            available: false,
            session: null,
            message: "Auth-backed preset libraries are not configured. Local presets stay active.",
          }),
          { status: 503, headers: { "content-type": "application/json" } }
        )
      )
    );

    await expect(fetchPresetLibrarySession()).resolves.toEqual({
      available: false,
      data: null,
      message: "Auth-backed preset libraries are not configured. Local presets stay active.",
    });
  });

  it("surfaces exact sign-in validation errors from the session API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ error: "Incorrect password." }), {
          status: 400,
          headers: { "content-type": "application/json" },
        })
      )
    );

    await expect(
      signInPresetLibraryUser({
        email: "creator@example.com",
        password: "wrong-passphrase",
      })
    ).rejects.toThrow("Incorrect password.");
  });

  it("returns signed-out state without disturbing local preset availability", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            available: true,
            session: null,
            message: "Signed out. Local presets remain available.",
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
      )
    );

    await expect(signOutPresetLibraryUser()).resolves.toEqual({
      available: true,
      data: null,
      message: "Signed out. Local presets remain available.",
    });
  });
});
