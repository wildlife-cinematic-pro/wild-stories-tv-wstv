import { NextResponse } from "next/server";

import {
  copyPolishRequestSchema,
  copyPolishResponseSchema,
} from "@/lib/schemas";
import { parseProviderJsonObject } from "@/lib/enhance-provider";
import { hasUsableGeneratedPackageEnhancements } from "@/lib/generated-package";
import {
  callClaudeText,
  callGeminiText,
  extractClaudeText,
  extractGeminiText,
  getGeminiModelFallback,
  getGeminiModelStable,
} from "./provider-calls";
import { jsonError, sanitizeString, type Provider } from "./request-utils";

const providerResponseSchema = copyPolishResponseSchema;

function normalizeLooseKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function buildLooseObjectIndex(obj: Record<string, unknown>) {
  const index = new Map<string, unknown>();
  for (const [key, value] of Object.entries(obj)) {
    index.set(normalizeLooseKey(key), value);
  }
  return index;
}

function getLooseValue(index: Map<string, unknown>, aliases: string[]): unknown {
  for (const alias of aliases) {
    const match = index.get(normalizeLooseKey(alias));
    if (match !== undefined) return match;
  }
  return undefined;
}

function coercePolishString(value: unknown, maxLen: number): string | undefined {
  if (typeof value === "string") {
    const cleaned = sanitizeString(value, maxLen).trim();
    return cleaned || undefined;
  }

  if (typeof value === "number") {
    const cleaned = sanitizeString(String(value), maxLen).trim();
    return cleaned || undefined;
  }

  if (Array.isArray(value)) {
    const cleaned = value
      .map((item) => coercePolishString(item, maxLen))
      .filter((item): item is string => Boolean(item));
    if (!cleaned.length) return undefined;
    return sanitizeString(cleaned.join("\n"), maxLen).trim() || undefined;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["text", "value", "content", "copy", "prompt", "line", "parts"]) {
      const nested = coercePolishString(record[key], maxLen);
      if (nested) return nested;
    }
  }

  return undefined;
}

function coerceImprovements(value: unknown): string | string[] | undefined {
  if (typeof value === "string") {
    const cleaned = sanitizeString(value, 400).trim();
    return cleaned || undefined;
  }

  if (Array.isArray(value)) {
    const cleaned = value
      .map((item) => coercePolishString(item, 400))
      .filter((item): item is string => Boolean(item))
      .slice(0, 8);

    if (!cleaned.length) return undefined;
    return cleaned.length === 1 ? cleaned[0] : cleaned;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["items", "bullets", "list", "notes", "summary", "text", "value", "content"]) {
      const nested = coerceImprovements(record[key]);
      if (nested) return nested;
    }
  }

  return undefined;
}

function coerceOptionalBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return undefined;

  const normalized = value.trim().toLowerCase();
  if (["true", "yes", "1"].includes(normalized)) return true;
  if (["false", "no", "0"].includes(normalized)) return false;
  return undefined;
}

function hasRecognizedCopyPolishKey(obj: Record<string, unknown>): boolean {
  const index = buildLooseObjectIndex(obj);
  return (
    getLooseValue(index, ["imagePrompt", "image_prompt", "imagePromptText", "prompt"]) !== undefined ||
    getLooseValue(index, ["hook"]) !== undefined ||
    getLooseValue(index, ["caption"]) !== undefined ||
    getLooseValue(index, ["voiceoverLine", "voiceOverLine", "voice_over_line", "voiceover"]) !== undefined ||
    getLooseValue(index, ["improvements", "improvement", "notes", "changeNotes", "changes"]) !== undefined
  );
}

function getGeminiCopyPolishSource(obj: Record<string, unknown>): Record<string, unknown> {
  const candidates = [obj];

  for (const wrapperKey of ["result", "output", "data", "response", "polish"]) {
    const candidate = obj[wrapperKey];
    if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
      candidates.push(candidate as Record<string, unknown>);
    }
  }

  return candidates.find(hasRecognizedCopyPolishKey) ?? obj;
}

export function normalizeGeminiCopyPolishObject(obj: Record<string, unknown>): Record<string, unknown> {
  const source = getGeminiCopyPolishSource(obj);
  const index = buildLooseObjectIndex(source);
  const normalized: Record<string, unknown> = {};

  const imagePrompt = coercePolishString(
    getLooseValue(index, ["imagePrompt", "image_prompt", "imagePromptText", "prompt"]),
    4000
  );
  const hook = coercePolishString(getLooseValue(index, ["hook"]), 500);
  const caption = coercePolishString(getLooseValue(index, ["caption"]), 1200);
  const voiceoverLine = coercePolishString(
    getLooseValue(index, ["voiceoverLine", "voiceOverLine", "voice_over_line", "voiceover"]),
    800
  );
  const improvements = coerceImprovements(
    getLooseValue(index, ["improvements", "improvement", "notes", "changeNotes", "changes"])
  );
  const aiEnhanced = coerceOptionalBoolean(getLooseValue(index, ["aiEnhanced", "ai_enhanced"]));

  if (imagePrompt) normalized.imagePrompt = imagePrompt;
  if (hook) normalized.hook = hook;
  if (caption) normalized.caption = caption;
  if (voiceoverLine) normalized.voiceoverLine = voiceoverLine;
  if (improvements) normalized.improvements = improvements;
  if (typeof aiEnhanced === "boolean") normalized.aiEnhanced = aiEnhanced;

  return normalized;
}

function buildPolishPrompt(parsedReq: ReturnType<typeof copyPolishRequestSchema.parse>) {
  const predator = sanitizeString(parsedReq.predator, 120);
  const prey = sanitizeString(parsedReq.prey, 120);
  const env = sanitizeString(parsedReq.env, 160);
  const arc = sanitizeString(parsedReq.arc, 160);
  const weather = sanitizeString(parsedReq.weather, 120);
  const emotionalTone = sanitizeString(parsedReq.emotionalTone, 120);
  const animalVibe = sanitizeString(parsedReq.animalVibe, 120);

  const baseImagePrompt = sanitizeString(parsedReq.base.imagePrompt, 4000);
  const baseHook = sanitizeString(parsedReq.base.hook, 500);
  const baseCaption = sanitizeString(parsedReq.base.caption, 1200);
  const baseVoiceover = sanitizeString(parsedReq.base.voiceoverLine, 800);

  return [
    "You are a lightweight WSTV copy and image-prompt polisher for short-form wildlife videos.",
    "This endpoint is not the main cinematic prompt engine.",
    "Do not generate shot packs, workflow JSON, multi-shot architecture, commentary, or explanations.",
    "Return exactly one JSON object and nothing else.",
    'Allowed keys only: "imagePrompt", "hook", "caption", "voiceoverLine", "improvements".',
    "Do not return markdown fences.",
    "Do not return prose before or after the JSON.",
    "Do not return null values, empty strings, or any extra keys.",
    "Only return a key if you genuinely improved that field.",
    "If you touch imagePrompt, keep it as a surgical polish of the existing image prompt rather than inventing a new workflow.",
    'If useful, "improvements" may be either one short string or an array of short strings.',
    "",
    "Return shape example:",
    "{",
    '  "imagePrompt": "...",',
    '  "hook": "...",',
    '  "caption": "...",',
    '  "voiceoverLine": "...",',
    '  "improvements": ["..."]',
    "}",
    "",
    `Predator: ${predator}`,
    `Prey: ${prey}`,
    `Environment: ${env}`,
    `Arc: ${arc}`,
    `Weather: ${weather}`,
    `EmotionalTone: ${emotionalTone}`,
    `AnimalVibe: ${animalVibe}`,
    "",
    "Base draft:",
    `hook: ${baseHook}`,
    `caption: ${baseCaption}`,
    `voiceoverLine: ${baseVoiceover}`,
    "",
    "Image prompt context (optional):",
    baseImagePrompt,
  ].join("\n");
}

export async function handleCopyPolishRequest(body: unknown) {
  const parsedReq = copyPolishRequestSchema.safeParse(body);
  if (!parsedReq.success) {
    return jsonError("Invalid request", 400, parsedReq.error.flatten());
  }

  const provider = parsedReq.data.provider as Provider;
  const polishPrompt = buildPolishPrompt(parsedReq.data);

  try {
    if (provider === "gemini") {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return jsonError("Missing GEMINI_API_KEY", 500);

      const stable = getGeminiModelStable();
      let { res, data } = await callGeminiText(stable, apiKey, polishPrompt);

      if (!res.ok) {
        const msg = JSON.stringify(data ?? {}).toLowerCase();
        const looksLikeModelIssue = msg.includes("model") && msg.includes("support");
        if (looksLikeModelIssue) {
          const fb = getGeminiModelFallback();
          ({ res, data } = await callGeminiText(fb, apiKey, polishPrompt));
        }
      }

      if (!res.ok) return jsonError("Gemini request failed", 500, data);

      const rawGeminiText = sanitizeString(extractGeminiText(data), 40_000);
      let obj: Record<string, unknown>;
      try {
        obj = parseProviderJsonObject(rawGeminiText, "Gemini copy polish");
      } catch (error) {
        return jsonError("Gemini copy polish returned invalid JSON", 502, {
          message:
            error instanceof Error ? error.message : "Gemini returned invalid JSON for copy polish",
          rawGeminiText,
        });
      }

      const normalizedGemini = normalizeGeminiCopyPolishObject(obj);
      const out = providerResponseSchema.safeParse(normalizedGemini);
      if (!out.success) {
        return jsonError("Invalid Gemini copy polish format", 502, {
          issues: out.error.issues.map((issue) => ({
            path: issue.path.join(".") || "(root)",
            message: issue.message,
          })),
          normalizedGeminiObject: normalizedGemini,
          rawGeminiText,
        });
      }
      if (!hasUsableGeneratedPackageEnhancements(out.data)) {
        return jsonError("Gemini returned no usable copy polish fields", 502, {
          normalizedGeminiObject: normalizedGemini,
          rawGeminiText,
        });
      }

      return NextResponse.json({ ...out.data, aiEnhanced: true }, { status: 200 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return jsonError("Missing ANTHROPIC_API_KEY", 500);

    const { res, data } = await callClaudeText(apiKey, polishPrompt);
    if (!res.ok) return jsonError("Claude request failed", 500, data);

    const text = extractClaudeText(data);
    let obj: Record<string, unknown>;
    try {
      obj = parseProviderJsonObject(text, "Claude copy polish");
    } catch (error) {
      return jsonError(
        error instanceof Error ? error.message : "Claude returned invalid JSON for copy polish",
        502
      );
    }

    const out = providerResponseSchema.safeParse(obj);
    if (!out.success) return jsonError("Invalid Claude copy polish format", 502, out.error.flatten());
    if (!hasUsableGeneratedPackageEnhancements(out.data)) {
      return jsonError("Claude returned no usable copy polish fields", 502);
    }

    return NextResponse.json({ ...out.data, aiEnhanced: true }, { status: 200 });
  } catch (err) {
    return jsonError("Copy polish error", 500, String(err));
  }
}
