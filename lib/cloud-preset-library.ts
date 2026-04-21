import type {
  CloudPresetLibrary,
  WorkflowPresetAuthSession,
  WorkflowPresetLibraryCatalog,
  WorkflowPresetLibraryRole,
  WorkflowPresetLibraryRecord,
} from "@/types";

type ApiEnvelope<T> = {
  available: boolean;
  data: T | null;
  message?: string;
};

async function parseJsonResponse(response: Response): Promise<unknown> {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

function getRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export async function fetchPresetLibrarySession(): Promise<
  ApiEnvelope<WorkflowPresetAuthSession>
> {
  const response = await fetch("/api/preset-library/session", {
    cache: "no-store",
  });
  const record = getRecord(await parseJsonResponse(response));

  if (response.status === 503) {
    return {
      available: false,
      data: null,
      message:
        typeof record?.message === "string"
          ? record.message
          : "Auth-backed cloud libraries are unavailable for this deployment.",
    };
  }

  if (!response.ok) {
    throw new Error(
      typeof record?.error === "string"
        ? record.error
        : "Preset library session request failed."
    );
  }

  return {
    available: true,
    data: (record?.session as WorkflowPresetAuthSession | null) ?? null,
    message: typeof record?.message === "string" ? record.message : undefined,
  };
}

export async function signInPresetLibraryUser(input: {
  email: string;
  password: string;
}): Promise<ApiEnvelope<WorkflowPresetAuthSession>> {
  const response = await fetch("/api/preset-library/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "sign-in",
      ...input,
    }),
  });
  const record = getRecord(await parseJsonResponse(response));

  if (response.status === 503) {
    return {
      available: false,
      data: null,
      message:
        typeof record?.message === "string"
          ? record.message
          : "Auth-backed cloud libraries are unavailable for this deployment.",
    };
  }

  if (!response.ok) {
    throw new Error(
      typeof record?.error === "string"
        ? record.error
        : "Sign-in failed."
    );
  }

  return {
    available: true,
    data: (record?.session as WorkflowPresetAuthSession | null) ?? null,
    message: typeof record?.message === "string" ? record.message : undefined,
  };
}

export async function signUpPresetLibraryUser(input: {
  email: string;
  password: string;
  displayName?: string;
}): Promise<ApiEnvelope<WorkflowPresetAuthSession>> {
  const response = await fetch("/api/preset-library/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "sign-up",
      ...input,
    }),
  });
  const record = getRecord(await parseJsonResponse(response));

  if (response.status === 503) {
    return {
      available: false,
      data: null,
      message:
        typeof record?.message === "string"
          ? record.message
          : "Auth-backed cloud libraries are unavailable for this deployment.",
    };
  }

  if (!response.ok) {
    throw new Error(
      typeof record?.error === "string"
        ? record.error
        : "Account creation failed."
    );
  }

  return {
    available: true,
    data: (record?.session as WorkflowPresetAuthSession | null) ?? null,
    message: typeof record?.message === "string" ? record.message : undefined,
  };
}

export async function signOutPresetLibraryUser(): Promise<ApiEnvelope<null>> {
  const response = await fetch("/api/preset-library/session", {
    method: "DELETE",
  });
  const record = getRecord(await parseJsonResponse(response));

  if (response.status === 503) {
    return {
      available: false,
      data: null,
      message:
        typeof record?.message === "string"
          ? record.message
          : "Auth-backed cloud libraries are unavailable for this deployment.",
    };
  }

  if (!response.ok) {
    throw new Error(
      typeof record?.error === "string"
        ? record.error
        : "Sign-out failed."
    );
  }

  return {
    available: true,
    data: null,
    message: typeof record?.message === "string" ? record.message : undefined,
  };
}

export async function fetchPresetLibraryCatalog(): Promise<
  ApiEnvelope<WorkflowPresetLibraryCatalog>
> {
  const response = await fetch("/api/preset-library", {
    cache: "no-store",
  });
  const record = getRecord(await parseJsonResponse(response));

  if (response.status === 503) {
    return {
      available: false,
      data: null,
      message:
        typeof record?.message === "string"
          ? record.message
          : "Cloud preset libraries are unavailable for this deployment.",
    };
  }

  if (response.status === 401) {
    return {
      available: true,
      data: null,
      message:
        typeof record?.message === "string"
          ? record.message
          : "Sign in to load cloud preset libraries.",
    };
  }

  if (!response.ok) {
    throw new Error(
      typeof record?.error === "string"
        ? record.error
        : "Preset library catalog request failed."
    );
  }

  return {
    available: true,
    data: (record?.catalog as WorkflowPresetLibraryCatalog | null) ?? null,
    message: typeof record?.message === "string" ? record.message : undefined,
  };
}

export async function savePresetLibrary(
  libraryId: string | undefined,
  library: CloudPresetLibrary
): Promise<ApiEnvelope<WorkflowPresetLibraryRecord>> {
  const response = await fetch("/api/preset-library", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      libraryId,
      library,
    }),
  });
  const record = getRecord(await parseJsonResponse(response));

  if (response.status === 503) {
    return {
      available: false,
      data: null,
      message:
        typeof record?.message === "string"
          ? record.message
          : "Cloud preset libraries are unavailable for this deployment.",
    };
  }

  if (!response.ok) {
    throw new Error(
      typeof record?.error === "string"
        ? record.error
        : "Preset library save failed."
    );
  }

  return {
    available: true,
    data: (record?.library as WorkflowPresetLibraryRecord | null) ?? null,
    message: typeof record?.message === "string" ? record.message : undefined,
  };
}

export async function createSharedPresetLibrary(input: {
  name: string;
  description?: string;
}): Promise<ApiEnvelope<WorkflowPresetLibraryRecord>> {
  const response = await fetch("/api/preset-library/shared", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  const record = getRecord(await parseJsonResponse(response));

  if (response.status === 503) {
    return {
      available: false,
      data: null,
      message:
        typeof record?.message === "string"
          ? record.message
          : "Cloud preset libraries are unavailable for this deployment.",
    };
  }

  if (!response.ok) {
    throw new Error(
      typeof record?.error === "string"
        ? record.error
        : "Shared library creation failed."
    );
  }

  return {
    available: true,
    data: (record?.library as WorkflowPresetLibraryRecord | null) ?? null,
    message: typeof record?.message === "string" ? record.message : undefined,
  };
}

export async function upsertSharedPresetLibraryMember(input: {
  libraryId: string;
  email: string;
  role: WorkflowPresetLibraryRole;
}): Promise<ApiEnvelope<WorkflowPresetLibraryRecord>> {
  const response = await fetch(
    `/api/preset-library/shared/${encodeURIComponent(input.libraryId)}/members`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: input.email,
        role: input.role,
      }),
    }
  );
  const record = getRecord(await parseJsonResponse(response));

  if (response.status === 503) {
    return {
      available: false,
      data: null,
      message:
        typeof record?.message === "string"
          ? record.message
          : "Cloud preset libraries are unavailable for this deployment.",
    };
  }

  if (!response.ok) {
    throw new Error(
      typeof record?.error === "string"
        ? record.error
        : "Shared library access update failed."
    );
  }

  return {
    available: true,
    data: (record?.library as WorkflowPresetLibraryRecord | null) ?? null,
    message: typeof record?.message === "string" ? record.message : undefined,
  };
}

export async function removeSharedPresetLibraryMember(input: {
  libraryId: string;
  userId: string;
}): Promise<ApiEnvelope<WorkflowPresetLibraryRecord>> {
  const response = await fetch(
    `/api/preset-library/shared/${encodeURIComponent(input.libraryId)}/members`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: input.userId,
      }),
    }
  );
  const record = getRecord(await parseJsonResponse(response));

  if (response.status === 503) {
    return {
      available: false,
      data: null,
      message:
        typeof record?.message === "string"
          ? record.message
          : "Cloud preset libraries are unavailable for this deployment.",
    };
  }

  if (!response.ok) {
    throw new Error(
      typeof record?.error === "string"
        ? record.error
        : "Shared library member removal failed."
    );
  }

  return {
    available: true,
    data: (record?.library as WorkflowPresetLibraryRecord | null) ?? null,
    message: typeof record?.message === "string" ? record.message : undefined,
  };
}

