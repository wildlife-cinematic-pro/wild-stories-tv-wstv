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

function parseJsonObjectCandidate(candidate: string):
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; reason: "malformed" | "not-object" } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    return { ok: false, reason: "malformed" };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, reason: "not-object" };
  }

  return { ok: true, value: parsed as Record<string, unknown> };
}

function extractBalancedJsonObject(text: string, start: number): string | null {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const char = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      depth++;
      continue;
    }

    if (char === "}") {
      depth--;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  return null;
}

function findFirstValidJsonObject(text: string): Record<string, unknown> | null {
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== "{") continue;

    const candidate = extractBalancedJsonObject(text, i);
    if (!candidate) continue;

    const parsed = parseJsonObjectCandidate(candidate);
    if (parsed.ok) return parsed.value;
  }

  return null;
}

export function parseProviderJsonObject(text: string, source: string): Record<string, unknown> {
  const raw = sanitizeString(text, 120_000).trim();
  const candidate = stripJsonCodeFence(raw);

  if (!candidate) {
    throw new Error(`${source} returned empty output. Expected a JSON object only.`);
  }

  const direct = parseJsonObjectCandidate(candidate);
  if (direct.ok) {
    return direct.value;
  }

  const directLooksLikeJson =
    candidate.startsWith("{") ||
    candidate.startsWith("[") ||
    candidate.includes("{") ||
    candidate.includes("[");

  let sawMalformedJson = directLooksLikeJson && direct.reason === "malformed";
  let sawNonObjectJson = directLooksLikeJson && direct.reason === "not-object";

  const fencedBlocks = raw.matchAll(/```(?:json)?\s*([\s\S]*?)\s*```/gi);
  for (const match of fencedBlocks) {
    const fencedCandidate = stripJsonCodeFence(match[0] ?? "");
    if (!fencedCandidate) continue;

    const parsed = parseJsonObjectCandidate(fencedCandidate);
    if (parsed.ok) {
      return parsed.value;
    }

    sawMalformedJson ||= parsed.reason === "malformed";
    sawNonObjectJson ||= parsed.reason === "not-object";
  }

  const extracted = findFirstValidJsonObject(raw);
  if (extracted) {
    return extracted;
  }

  if (sawNonObjectJson) {
    throw new Error(`${source} returned JSON that was not an object.`);
  }

  if (sawMalformedJson || raw.includes("{") || raw.includes("}")) {
    throw new Error(`${source} returned text containing JSON-like content, but no valid JSON object could be parsed.`);
  }

  throw new Error(`${source} returned non-JSON output. Expected a JSON object only.`);
}
