import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const blobStore = vi.hoisted(() => new Map<string, string>());

vi.mock("@vercel/blob", () => ({
  get: vi.fn(async (pathname: string) => {
    const raw = blobStore.get(pathname);
    if (!raw) {
      return { statusCode: 404, stream: null };
    }

    return {
      statusCode: 200,
      stream: new Blob([raw], { type: "application/json" }).stream(),
    };
  }),
  put: vi.fn(async (pathname: string, value: unknown) => {
    blobStore.set(pathname, String(value));
    return { url: `blob://${pathname}` };
  }),
}));

import { DELETE, GET, POST } from "@/app/api/preset-library/session/route";
import {
  authenticatePresetLibraryUser,
  createPresetLibrarySession,
  normalizePresetLibraryEmail,
  readPresetLibrarySessionFromCookieHeader,
  registerPresetLibraryUser,
} from "@/lib/preset-library-auth-server";

function jsonRequest(body: unknown, cookie?: string) {
  return new Request("http://localhost/api/preset-library/session", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  });
}

describe("preset library auth server", () => {
  beforeEach(() => {
    blobStore.clear();
    process.env.BLOB_READ_WRITE_TOKEN = "blob-test-token";
    process.env.PRESET_LIBRARY_AUTH_SECRET = "preset-test-secret";
  });

  afterEach(() => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    delete process.env.PRESET_LIBRARY_AUTH_SECRET;
  });

  it("normalizes email, creates a user, signs in, and reads a signed session", async () => {
    expect(normalizePresetLibraryEmail(" Creator@Example.COM ")).toBe(
      "creator@example.com"
    );

    const created = await registerPresetLibraryUser({
      email: " Creator@Example.COM ",
      password: "strong-passphrase",
      displayName: " WSTV Creator ",
    });

    expect(created.email).toBe("creator@example.com");
    expect(created.displayName).toBe("WSTV Creator");

    await expect(
      authenticatePresetLibraryUser({
        email: "creator@example.com",
        password: "wrong-passphrase",
      })
    ).rejects.toThrow("Incorrect password.");

    const signedIn = await authenticatePresetLibraryUser({
      email: "creator@example.com",
      password: "strong-passphrase",
    });
    const { session, token } = createPresetLibrarySession(signedIn);
    const restored = await readPresetLibrarySessionFromCookieHeader(
      `wstv_preset_auth=${token}`
    );

    expect(session.user.email).toBe("creator@example.com");
    expect(restored?.user.email).toBe("creator@example.com");
  });

  it("session route reports validation errors, sign-in success, and sign-out cookie clearing", async () => {
    const shortPassword = await POST(
      jsonRequest({
        action: "sign-up",
        email: "creator@example.com",
        password: "short",
      })
    );
    await expect(shortPassword.json()).resolves.toMatchObject({
      error: "Use a password with at least 8 characters.",
    });
    expect(shortPassword.status).toBe(400);

    const signUpResponse = await POST(
      jsonRequest({
        action: "sign-up",
        email: "creator@example.com",
        password: "strong-passphrase",
      })
    );
    const signUpBody = await signUpResponse.json();
    expect(signUpResponse.status).toBe(200);
    expect(signUpBody.session.user.email).toBe("creator@example.com");

    const cookie = signUpResponse.headers.get("set-cookie") ?? "";
    const getResponse = await GET(
      new Request("http://localhost/api/preset-library/session", {
        headers: { cookie },
      })
    );
    await expect(getResponse.json()).resolves.toMatchObject({
      available: true,
      session: { user: { email: "creator@example.com" } },
    });

    const wrongPassword = await POST(
      jsonRequest({
        action: "sign-in",
        email: "creator@example.com",
        password: "wrong-passphrase",
      })
    );
    await expect(wrongPassword.json()).resolves.toMatchObject({
      error: "Incorrect password.",
    });
    expect(wrongPassword.status).toBe(400);

    const signOutResponse = await DELETE();
    await expect(signOutResponse.json()).resolves.toMatchObject({
      available: true,
      session: null,
      message: "Signed out. Local presets remain available.",
    });
    expect(signOutResponse.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});
