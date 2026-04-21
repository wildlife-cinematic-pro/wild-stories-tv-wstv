import { createHash, createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";

import { get, put } from "@vercel/blob";

import type {
  WorkflowPresetAuthSession,
  WorkflowPresetAuthUser,
} from "@/types";

const PRESET_LIBRARY_AUTH_COOKIE = "wstv_preset_auth";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

type StoredPresetLibraryUser = WorkflowPresetAuthUser & {
  passwordHash: string;
  passwordSalt: string;
  updatedAt: string;
};

type StoredUserEmailIndex = {
  userId: string;
  email: string;
  updatedAt: string;
};

function getBlobToken(): string | undefined {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  return token || undefined;
}

function getAuthSecret(): string | undefined {
  const secret =
    process.env.PRESET_LIBRARY_AUTH_SECRET?.trim() ??
    process.env.BLOB_READ_WRITE_TOKEN?.trim();
  return secret || undefined;
}

function cleanString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

export function normalizePresetLibraryEmail(value: unknown): string | undefined {
  const email = cleanString(value).toLowerCase();
  if (!email || email.length > 160) return undefined;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email) ? email : undefined;
}

export function normalizePresetLibraryDisplayName(
  value: unknown
): string | undefined {
  const displayName = cleanString(value).slice(0, 80);
  return displayName || undefined;
}

function normalizeUserId(value: unknown): string | undefined {
  const userId = cleanString(value)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  return userId.length >= 3 ? userId : undefined;
}

function makeUserId(now = Date.now()): string {
  return `user_${now.toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function hashEmail(email: string): string {
  return createHash("sha256").update(email).digest("hex");
}

function hashPassword(password: string, salt: string): string {
  return pbkdf2Sync(password, salt, 150_000, 32, "sha256").toString("hex");
}

function signPayload(payload: string): string {
  const secret = getAuthSecret();
  if (!secret) {
    throw new Error("Preset library auth is not configured for this deployment.");
  }
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function encodeSessionPayload(
  payload: WorkflowPresetAuthSession & { userId: string }
): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodeSessionPayload(
  value: string
): (WorkflowPresetAuthSession & { userId: string }) | null {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as
      | (WorkflowPresetAuthSession & { userId: string })
      | null;
  } catch {
    return null;
  }
}

function getUserByIdPathname(userId: string): string {
  return `workflow-preset-auth/v1/users/by-id/${userId}.json`;
}

function getUserByEmailIndexPathname(email: string): string {
  return `workflow-preset-auth/v1/users/by-email/${hashEmail(email)}.json`;
}

function normalizeStoredPresetLibraryUser(value: unknown): StoredPresetLibraryUser | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const id = normalizeUserId(record.id);
  const email = normalizePresetLibraryEmail(record.email);
  const passwordHash = cleanString(record.passwordHash);
  const passwordSalt = cleanString(record.passwordSalt);
  if (!id || !email || !passwordHash || !passwordSalt) return null;

  return {
    id,
    email,
    displayName:
      normalizePresetLibraryDisplayName(record.displayName) ??
      email.split("@")[0] ??
      "Wildlife Creator",
    createdAt: cleanString(record.createdAt, new Date(0).toISOString()),
    updatedAt: cleanString(record.updatedAt, new Date(0).toISOString()),
    passwordHash,
    passwordSalt,
  };
}

function normalizeStoredUserEmailIndex(value: unknown): StoredUserEmailIndex | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const userId = normalizeUserId(record.userId);
  const email = normalizePresetLibraryEmail(record.email);
  if (!userId || !email) return null;
  return {
    userId,
    email,
    updatedAt: cleanString(record.updatedAt, new Date(0).toISOString()),
  };
}

function toPublicUser(user: StoredPresetLibraryUser): WorkflowPresetAuthUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt,
  };
}

function parseCookieValue(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  const parts = cookieHeader.split(/;\s*/);
  for (const part of parts) {
    const [key, ...rest] = part.split("=");
    if (key === name) {
      return rest.join("=");
    }
  }
  return undefined;
}

async function readJsonBlob(pathname: string): Promise<unknown> {
  const token = getBlobToken();
  if (!token) return null;

  const result = await get(pathname, {
    access: "private",
    token,
    useCache: false,
  });

  if (!result || result.statusCode !== 200 || !result.stream) {
    return null;
  }

  const raw = await new Response(result.stream).text();
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

async function writeJsonBlob(pathname: string, value: unknown): Promise<void> {
  const token = getBlobToken();
  if (!token) {
    throw new Error("Preset library auth storage is not configured.");
  }

  await put(pathname, JSON.stringify(value, null, 2), {
    access: "private",
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType: "application/json",
    token,
  });
}

export function isPresetLibraryAuthConfigured(): boolean {
  return Boolean(getBlobToken() && getAuthSecret());
}

export function getPresetLibraryAuthCookieName(): string {
  return PRESET_LIBRARY_AUTH_COOKIE;
}

export function createPresetLibrarySession(
  user: WorkflowPresetAuthUser,
  issuedAt = new Date().toISOString()
): { session: WorkflowPresetAuthSession; token: string } {
  const issuedAtMs = Date.parse(issuedAt);
  const expiresAt = new Date(
    (Number.isFinite(issuedAtMs) ? issuedAtMs : Date.now()) + SESSION_TTL_MS
  ).toISOString();
  const session: WorkflowPresetAuthSession = {
    user,
    issuedAt,
    expiresAt,
  };
  const payload = encodeSessionPayload({
    ...session,
    userId: user.id,
  });
  const signature = signPayload(payload);
  return {
    session,
    token: `${payload}.${signature}`,
  };
}

export async function readPresetLibraryUserById(
  userId: string
): Promise<StoredPresetLibraryUser | null> {
  const safeUserId = normalizeUserId(userId);
  if (!safeUserId) return null;
  return normalizeStoredPresetLibraryUser(
    await readJsonBlob(getUserByIdPathname(safeUserId))
  );
}

export async function readPresetLibraryUserByEmail(
  email: string
): Promise<StoredPresetLibraryUser | null> {
  const safeEmail = normalizePresetLibraryEmail(email);
  if (!safeEmail) return null;

  const index = normalizeStoredUserEmailIndex(
    await readJsonBlob(getUserByEmailIndexPathname(safeEmail))
  );
  if (!index) return null;
  return readPresetLibraryUserById(index.userId);
}

export async function registerPresetLibraryUser(input: {
  email: string;
  password: string;
  displayName?: string;
}): Promise<WorkflowPresetAuthUser> {
  const email = normalizePresetLibraryEmail(input.email);
  const password = cleanString(input.password);
  if (!email) {
    throw new Error("Enter a valid email address.");
  }
  if (password.length < 8) {
    throw new Error("Use a password with at least 8 characters.");
  }
  if (!isPresetLibraryAuthConfigured()) {
    throw new Error("Preset library auth is not configured for this deployment.");
  }

  const existing = await readPresetLibraryUserByEmail(email);
  if (existing) {
    throw new Error("An account already exists for that email.");
  }

  const now = new Date().toISOString();
  const user: StoredPresetLibraryUser = {
    id: makeUserId(),
    email,
    displayName:
      normalizePresetLibraryDisplayName(input.displayName) ??
      email.split("@")[0] ??
      "Wildlife Creator",
    createdAt: now,
    updatedAt: now,
    passwordSalt: randomBytes(16).toString("hex"),
    passwordHash: "",
  };
  user.passwordHash = hashPassword(password, user.passwordSalt);

  await writeJsonBlob(getUserByIdPathname(user.id), user);
  await writeJsonBlob(getUserByEmailIndexPathname(email), {
    userId: user.id,
    email,
    updatedAt: now,
  } satisfies StoredUserEmailIndex);

  return toPublicUser(user);
}

export async function authenticatePresetLibraryUser(input: {
  email: string;
  password: string;
}): Promise<WorkflowPresetAuthUser> {
  const email = normalizePresetLibraryEmail(input.email);
  const password = cleanString(input.password);
  if (!email || !password) {
    throw new Error("Enter both email and password.");
  }

  const user = await readPresetLibraryUserByEmail(email);
  if (!user) {
    throw new Error("No account was found for that email.");
  }

  const expected = Buffer.from(user.passwordHash, "hex");
  const actual = Buffer.from(hashPassword(password, user.passwordSalt), "hex");
  if (
    expected.length !== actual.length ||
    !timingSafeEqual(expected, actual)
  ) {
    throw new Error("Incorrect password.");
  }

  return toPublicUser(user);
}

export async function readPresetLibrarySessionFromCookieHeader(
  cookieHeader: string | null
): Promise<WorkflowPresetAuthSession | null> {
  const token = parseCookieValue(cookieHeader, PRESET_LIBRARY_AUTH_COOKIE);
  if (!token) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  if (signPayload(payload) !== signature) return null;

  const parsed = decodeSessionPayload(payload);
  if (!parsed?.userId || !parsed.user?.email) return null;
  if (Date.parse(parsed.expiresAt) <= Date.now()) return null;

  const user = await readPresetLibraryUserById(parsed.userId);
  if (!user || user.email !== parsed.user.email) return null;

  return {
    user: toPublicUser(user),
    issuedAt: parsed.issuedAt,
    expiresAt: parsed.expiresAt,
  };
}

