import { NextResponse } from "next/server";

import {
  copyPolishRequestSchema,
  copyPolishResponseSchema,
} from "@/lib/schemas";
import { parseProviderJsonObject } from "@/lib/enhance-provider";
import { getCopyPolishProviderLabel } from "@/lib/copy-polish-providers";
import { hasUsableGeneratedPackageEnhancements } from "@/lib/generated-package";
import {
  callClaudeText,
  callGeminiText,
  callGroqText,
  callOpenAIText,
  extractClaudeText,
  extractGeminiText,
  extractGroqText,
  extractOpenAIText,
  getGeminiModelFallback,
  getGeminiModelStable,
} from "./provider-calls";
import { jsonError, sanitizeString } from "./request-utils";

const providerResponseSchema = copyPolishResponseSchema;
const GEMINI_COPY_POLISH_SKIPPED_MESSAGE =
  "Gemini copy polish skipped — using base generated copy.";
const OPENAI_COPY_POLISH_SKIPPED_MESSAGE =
  "OpenAI copy polish skipped — using base generated copy.";
const GROQ_COPY_POLISH_SKIPPED_MESSAGE =
  "Groq copy polish skipped — using base generated copy.";
const CLAUDE_COPY_POLISH_SKIPPED_MESSAGE =
  "Claude copy polish skipped — using base generated copy.";

type CopyPolishProvider = "gemini" | "openai" | "claude" | "groq" | "openrouter" | "huggingface";

function jsonOptionalCopyPolishSkip(reason: string) {
  return NextResponse.json(
    {
      skipped: true,
      provider: "gemini",
      reason,
      message: GEMINI_COPY_POLISH_SKIPPED_MESSAGE,
    },
    { status: 200 }
  );
}

function jsonOpenAICopyPolishSkip(reason: string) {
  return NextResponse.json(
    {
      skipped: true,
      provider: "openai",
      reason,
      message: OPENAI_COPY_POLISH_SKIPPED_MESSAGE,
    },
    { status: 200 }
  );
}

function jsonGroqCopyPolishSkip(reason: string) {
  return NextResponse.json(
    {
      skipped: true,
      provider: "groq",
      reason,
      message: GROQ_COPY_POLISH_SKIPPED_MESSAGE,
    },
    { status: 200 }
  );
}

function jsonClaudeCopyPolishSkip(reason: string) {
  return NextResponse.json(
    {
      skipped: true,
      provider: "claude",
      reason,
      message: CLAUDE_COPY_POLISH_SKIPPED_MESSAGE,
    },
    { status: 200 }
  );
}

function jsonFutureCopyPolishSkip(provider: CopyPolishProvider, reason: string) {
  return NextResponse.json(
    {
      skipped: true,
      provider,
      reason,
      message:
        getCopyPolishProviderLabel(provider) +
        " copy polish is a future provider slot — using base generated copy.",
    },
    { status: 200 }
  );
}

function jsonProviderFailure(detailedData: unknown) {
  if (process.env.NODE_ENV === "production") {
    return jsonError("Provider request failed", 502);
  }
  return jsonError("Provider request failed", 502, detailedData);
}
// WSTV-AUDIT-FIX: FIX-7 applied

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

  const provider = parsedReq.data.provider;
  const polishPrompt = buildPolishPrompt(parsedReq.data);

  try {
    if (provider === "openrouter" || provider === "huggingface") {
      return jsonFutureCopyPolishSkip(provider, "future_provider_not_wired");
    }

    if (provider === "gemini") {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return jsonOptionalCopyPolishSkip("missing_gemini_api_key");

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

      if (!res.ok) return jsonOptionalCopyPolishSkip("provider_error");

      const rawGeminiText = sanitizeString(extractGeminiText(data), 40_000);
      let obj: Record<string, unknown>;
      try {
        obj = parseProviderJsonObject(rawGeminiText, "Gemini copy polish");
      } catch {
        return jsonOptionalCopyPolishSkip("invalid_gemini_json");
      }

      const normalizedGemini = normalizeGeminiCopyPolishObject(obj);
      if (!hasUsableGeneratedPackageEnhancements(normalizedGemini)) {
        return jsonOptionalCopyPolishSkip("no_usable_fields");
      }

      const out = providerResponseSchema.safeParse(normalizedGemini);
      if (!out.success) {
        return jsonOptionalCopyPolishSkip("invalid_gemini_response");
      }

      return NextResponse.json({ ...out.data, aiEnhanced: true }, { status: 200 });
    }

    if (provider === "groq") {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) return jsonGroqCopyPolishSkip("missing_groq_api_key");

      const { res, data } = await callGroqText(apiKey, polishPrompt);
      if (!res.ok) return jsonGroqCopyPolishSkip("provider_error");

      const rawGroqText = sanitizeString(extractGroqText(data), 40_000);
      let obj: Record<string, unknown>;
      try {
        obj = parseProviderJsonObject(rawGroqText, "Groq copy polish");
      } catch {
        return jsonGroqCopyPolishSkip("invalid_groq_json");
      }

      if (!hasUsableGeneratedPackageEnhancements(obj)) {
        return jsonGroqCopyPolishSkip("no_usable_fields");
      }

      const out = providerResponseSchema.safeParse(obj);
      if (!out.success) {
        return jsonGroqCopyPolishSkip("invalid_groq_response");
      }

      if (!hasUsableGeneratedPackageEnhancements(out.data)) {
        return jsonGroqCopyPolishSkip("no_usable_fields");
      }

      return NextResponse.json({ ...out.data, aiEnhanced: true }, { status: 200 });
    }

    if (provider === "openai") {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) return jsonOpenAICopyPolishSkip("missing_openai_api_key");

      const { res, data } = await callOpenAIText(apiKey, polishPrompt);
      if (!res.ok) return jsonOpenAICopyPolishSkip("provider_error");

      const rawOpenAIText = sanitizeString(extractOpenAIText(data), 40_000);
      let obj: Record<string, unknown>;
      try {
        obj = parseProviderJsonObject(rawOpenAIText, "OpenAI copy polish");
      } catch {
        return jsonOpenAICopyPolishSkip("invalid_openai_json");
      }

      if (!hasUsableGeneratedPackageEnhancements(obj)) {
        return jsonOpenAICopyPolishSkip("no_usable_fields");
      }

      const out = providerResponseSchema.safeParse(obj);
      if (!out.success) {
        return jsonOpenAICopyPolishSkip("invalid_openai_response");
      }

      if (!hasUsableGeneratedPackageEnhancements(out.data)) {
        return jsonOpenAICopyPolishSkip("no_usable_fields");
      }

      return NextResponse.json({ ...out.data, aiEnhanced: true }, { status: 200 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return jsonClaudeCopyPolishSkip("missing_anthropic_api_key");

    const { res, data } = await callClaudeText(apiKey, polishPrompt);
    if (!res.ok) return jsonProviderFailure(data);

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
    if (!out.success) return jsonProviderFailure(out.error.flatten());
    if (!hasUsableGeneratedPackageEnhancements(out.data)) {
      return jsonError("Claude returned no usable copy polish fields", 502);
    }

    return NextResponse.json({ ...out.data, aiEnhanced: true }, { status: 200 });
  } catch {
    if (provider === "gemini") {
      return jsonOptionalCopyPolishSkip("provider_error");
    }
    if (provider === "openai") {
      return jsonOpenAICopyPolishSkip("provider_error");
    }
    if (provider === "groq") {
      return jsonGroqCopyPolishSkip("provider_error");
    }
    if (provider === "claude") {
      return jsonClaudeCopyPolishSkip("provider_error");
    }
    return jsonFutureCopyPolishSkip(provider, "provider_error");
  }
}
