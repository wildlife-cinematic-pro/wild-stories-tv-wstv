import { beforeEach, describe, expect, it, vi } from "vitest";

const assertSharedLibraryOwnerMock = vi.hoisted(() => vi.fn());
const upsertSharedPresetLibraryMemberInStoreMock = vi.hoisted(() => vi.fn());
const removeSharedPresetLibraryMemberFromStoreMock = vi.hoisted(() => vi.fn());
const readPresetLibrarySessionFromCookieHeaderMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/cloud-preset-library-server", () => ({
  assertSharedLibraryOwner: assertSharedLibraryOwnerMock,
  isCloudPresetLibraryConfigured: () => true,
  upsertSharedPresetLibraryMemberInStore: upsertSharedPresetLibraryMemberInStoreMock,
  removeSharedPresetLibraryMemberFromStore: removeSharedPresetLibraryMemberFromStoreMock,
}));

vi.mock("@/lib/preset-library-auth-server", () => ({
  isPresetLibraryAuthConfigured: () => true,
  readPresetLibrarySessionFromCookieHeader: readPresetLibrarySessionFromCookieHeaderMock,
}));

import { DELETE, PUT } from "@/app/api/preset-library/shared/[libraryId]/members/route";

function jsonRequest(method: "PUT" | "DELETE", body: unknown) {
  return new Request("http://localhost/api/preset-library/shared/library-field-team/members", {
    method,
    headers: { "content-type": "application/json", cookie: "wstv_preset_auth=test" },
    body: JSON.stringify(body),
  });
}

describe("preset library shared member routes", () => {
  beforeEach(() => {
    assertSharedLibraryOwnerMock.mockReset();
    upsertSharedPresetLibraryMemberInStoreMock.mockReset();
    removeSharedPresetLibraryMemberFromStoreMock.mockReset();
    readPresetLibrarySessionFromCookieHeaderMock.mockReset();
    readPresetLibrarySessionFromCookieHeaderMock.mockResolvedValue({
      user: {
        id: "user-owner",
        email: "owner@example.com",
        displayName: "Owner",
        createdAt: "2026-04-23T00:00:00.000Z",
      },
      issuedAt: "2026-04-23T00:00:00.000Z",
      expiresAt: "2026-05-23T00:00:00.000Z",
    });
    assertSharedLibraryOwnerMock.mockResolvedValue({ id: "library-field-team" });
  });

  it("rejects owner role escalation before saving shared member access", async () => {
    const response = await PUT(jsonRequest("PUT", {
      email: "editor@example.com",
      role: "owner",
    }), {
      params: Promise.resolve({ libraryId: "library-field-team" }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Shared members can only be editors or viewers.",
    });
    expect(upsertSharedPresetLibraryMemberInStoreMock).not.toHaveBeenCalled();
  });

  it("returns 403 when a non-owner tries to manage access", async () => {
    assertSharedLibraryOwnerMock.mockRejectedValue(
      new Error("Only the library owner can manage access.")
    );

    const response = await PUT(jsonRequest("PUT", {
      email: "editor@example.com",
      role: "editor",
    }), {
      params: Promise.resolve({ libraryId: "library-field-team" }),
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: "Only the library owner can manage access.",
    });
  });

  it("surfaces missing shared members clearly on removal", async () => {
    removeSharedPresetLibraryMemberFromStoreMock.mockRejectedValue(
      new Error("Shared library member was not found.")
    );

    const response = await DELETE(jsonRequest("DELETE", {
      userId: "user-missing",
    }), {
      params: Promise.resolve({ libraryId: "library-field-team" }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Shared library member was not found.",
    });
  });
});
