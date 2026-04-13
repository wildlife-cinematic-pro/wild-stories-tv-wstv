function sanitizeString(v: unknown, maxLen = 8000): string {
  const s = typeof v === "string" ? v : "";
  return s.slice(0, maxLen);
}

const CLAUDE_SUPPORTED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

export function normalizeClaudeVisionMimeType(mimeType: string): string | null {
  const normalized = sanitizeString(mimeType, 120).trim().toLowerCase();
  const canonical = normalized === "image/jpg" ? "image/jpeg" : normalized;
  return CLAUDE_SUPPORTED_IMAGE_MIME_TYPES.has(canonical) ? canonical : null;
}

function stripJsonCodeFence(text: string): string {
  const trimmed = sanitizeString(text, 120_000).trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return (fenced?.[1] ?? trimmed).trim();
}

export function parseProviderJsonObject(text: string, source: string): Record<string, unknown> {
  const candidate = stripJsonCodeFence(text);

  if (!candidate) {
    throw new Error(`${source} returned empty output. Expected a JSON object only.`);
  }

  if (!candidate.startsWith("{") || !candidate.endsWith("}")) {
    throw new Error(`${source} returned non-JSON output. Expected a JSON object only.`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    throw new Error(`${source} returned malformed JSON. Expected a valid JSON object.`);
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${source} returned JSON that was not an object.`);
  }

  return parsed as Record<string, unknown>;
}
