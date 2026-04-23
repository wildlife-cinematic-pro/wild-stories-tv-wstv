import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const blobStore = vi.hoisted(() => new Map<string, string>());
const readPresetLibraryUserByEmailMock = vi.hoisted(() => vi.fn());

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

vi.mock("@/lib/preset-library-auth-server", () => ({
  readPresetLibraryUserByEmail: readPresetLibraryUserByEmailMock,
}));

import {
  createSharedPresetLibraryInStore,
  removeSharedPresetLibraryMemberFromStore,
  upsertSharedPresetLibraryMemberInStore,
} from "@/lib/cloud-preset-library-server";

describe("cloud preset library server", () => {
  beforeEach(() => {
    blobStore.clear();
    readPresetLibraryUserByEmailMock.mockReset();
    process.env.BLOB_READ_WRITE_TOKEN = "blob-test-token";
  });

  afterEach(() => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
  });

  it("prevents owner role escalation for shared library members", async () => {
    const library = await createSharedPresetLibraryInStore(
      {
        id: "user-owner",
        email: "owner@example.com",
        displayName: "Owner",
        createdAt: "2026-04-23T00:00:00.000Z",
      },
      { name: "Field Team Library" }
    );

    readPresetLibraryUserByEmailMock.mockResolvedValue({
      id: "user-editor",
      email: "editor@example.com",
      displayName: "Editor",
      createdAt: "2026-04-23T00:00:00.000Z",
    });

    await expect(
      upsertSharedPresetLibraryMemberInStore(library.id, {
        email: "editor@example.com",
        role: "owner",
      })
    ).rejects.toThrow("Shared members can only be editors or viewers.");
  });

  it("adds editor access, rejects missing members, and keeps the owner protected", async () => {
    const library = await createSharedPresetLibraryInStore(
      {
        id: "user-owner",
        email: "owner@example.com",
        displayName: "Owner",
        createdAt: "2026-04-23T00:00:00.000Z",
      },
      { name: "Field Team Library" }
    );

    readPresetLibraryUserByEmailMock.mockResolvedValue({
      id: "user-editor",
      email: "editor@example.com",
      displayName: "Editor",
      createdAt: "2026-04-23T00:00:00.000Z",
    });

    const saved = await upsertSharedPresetLibraryMemberInStore(library.id, {
      email: "editor@example.com",
      role: "editor",
    });

    expect(saved.members).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          email: "editor@example.com",
          role: "editor",
        }),
      ])
    );

    await expect(
      removeSharedPresetLibraryMemberFromStore(library.id, "user-missing")
    ).rejects.toThrow("Shared library member was not found.");

    await expect(
      removeSharedPresetLibraryMemberFromStore(library.id, "user-owner")
    ).rejects.toThrow("The library owner cannot be removed.");
  });
});
