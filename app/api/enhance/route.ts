// file: app/api/enhance/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  copyPolishRequestSchema,
  copyPolishResponseSchema,
  mediaAnalysisSchema,
} from "@/lib/schemas";
import {
  normalizeClaudeVisionMimeType,
  parseProviderJsonObject,
} from "@/lib/enhance-provider";
import { hasUsableGeneratedPackageEnhancements } from "@/lib/generated-package";

/**
 * Rate limit (simple in-memory)
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 25;
const RATE_LIMIT_WINDOW = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

function getClientIp(req: Request) {
  const h = req.headers;
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

function sanitizeString(v: unknown, maxLen = 8000): string {
  const s = typeof v === "string" ? v : "";
  return s.slice(0, maxLen);
}

/**
 * IMPORTANT:
 * UI ले d.details पढ्छ।
 * details object भयो भने UI मा [object Object] देखिन्छ।
 * त्यसैले details लाई ALWAYS string बनाइदिन्छौं।
 */
function jsonError(message: string, status = 400, details?: unknown) {
  const detailsText =
    typeof details === "string"
      ? details
      : details == null
        ? undefined
        : (() => {
            try {
              return JSON.stringify(details);
            } catch {
              return String(details);
            }
          })();

  return NextResponse.json({ error: message, details: detailsText }, { status });
}

type Provider = "gemini" | "claude";

/**
 * Lightweight copy / prompt polish response schema
 */
const providerResponseSchema = copyPolishResponseSchema;

/**
 * ─────────────────────────────────────────────────────────────
 * MEDIA ANALYSIS MODE (NEW)
 * This is what MediaAnalyzer.tsx calls:
 * {
 *   analyzeMedia: true,
 *   mediaType: "image" | "video",
 *   base64Data: "...",
 *   mimeType: "...",
 *   provider: "gemini" | "claude"
 * }
 * ─────────────────────────────────────────────────────────────
 */
const analyzeMediaRequestSchema = z.object({
  analyzeMedia: z.literal(true),
  mediaType: z.enum(["image", "video"]),
  base64Data: z.string().min(16),
  mimeType: z.string().min(3),
  provider: z.enum(["gemini", "claude"]).optional(),
});

function getGeminiModelStable(): string {
  return process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
}
function getGeminiModelFallback(): string {
  return "gemini-flash-latest";
}

/**
 * Gemini TEXT call (existing)
 */
async function callGeminiText(modelId: string, apiKey: string, prompt: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${encodeURIComponent(
    apiKey
  )}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    }),
  });

  const data = await res.json().catch(() => ({}));
  return { res, data };
}

/**
 * Gemini VISION (image/video) call (NEW)
 * We send text + inline_data (base64)
 */
async function callGeminiVision(
  modelId: string,
  apiKey: string,
  args: { prompt: string; mimeType: string; base64Data: string }
) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${encodeURIComponent(
    apiKey
  )}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            { text: args.prompt },
            {
              inline_data: {
                mime_type: args.mimeType,
                data: args.base64Data,
              },
            },
          ],
        },
      ],
    }),
  });

  const data = await res.json().catch(() => ({}));
  return { res, data };
}

/**
 * Claude TEXT call (existing)
 */
async function callClaudeText(apiKey: string, prompt: string) {
  const model = process.env.CLAUDE_MODEL?.trim() || "claude-opus-4-6";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json().catch(() => ({}));
  return { res, data };
}

/**
 * Claude VISION (image) call (NEW)
 * NOTE: Claude video support is not used (your UI routes video->gemini)
 */
async function callClaudeVision(
  apiKey: string,
  args: { prompt: string; mimeType: string; base64Data: string }
) {
  const model = process.env.CLAUDE_MODEL?.trim() || "claude-opus-4-6";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1200,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: args.prompt },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: args.mimeType,
                data: args.base64Data,
              },
            },
          ],
        },
      ],
    }),
  });

  const data = await res.json().catch(() => ({}));
  return { res, data };
}


function extractGeminiText(data: Record<string, unknown>): string {
  const candidates = data?.candidates as
    | { content?: { parts?: { text?: string }[] } }[]
    | undefined;
  const parts = candidates?.[0]?.content?.parts;
  const joined = (parts ?? []).map((p) => p?.text ?? "").join("");
  return joined || parts?.[0]?.text || "";
}
function extractClaudeText(data: Record<string, unknown>): string {
  const content = data?.content as { text?: string }[] | undefined;
  const joined = (content ?? []).map((c) => c?.text ?? "").join("");
  return joined || content?.[0]?.text || "";
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) return jsonError("Rate limit exceeded", 429);

  const body = await req.json().catch(() => null);
  if (!body) return jsonError("Invalid JSON body");

  /**
   * ✅ BRANCH 1: analyzeMedia mode (MediaAnalyzer.tsx)
   */
  if (body?.analyzeMedia === true) {
    const parsed = analyzeMediaRequestSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Invalid analyzeMedia request", 400, parsed.error.flatten());
    }

    const mediaType = parsed.data.mediaType;
    const mimeType = sanitizeString(parsed.data.mimeType, 120);
    const base64Data = sanitizeString(parsed.data.base64Data, 20_000_000); // allow big
    const requestedProvider = (parsed.data.provider || "gemini") as Provider;

    // Enforce your routing: video -> gemini only
    const provider: Provider = mediaType === "video" ? "gemini" : requestedProvider;

    const analysisPrompt = [
      "You are WSTV Wildlife Media Analyst.",
      "Analyze the provided wildlife IMAGE or VIDEO and return JSON ONLY.",
      "Return exactly this JSON shape (no markdown):",
      "{",
      '  "animalName": string,',
      '  "coatDescription": string,',
      '  "environment": string,',
      '  "lighting": string,',
      '  "suggestedArc": string,',
      '  "suggestedDepth": string,',
      '  "weather": string,',
      '  "timeOfDay": string,',
      '  "driftRisk": "HIGH" | "MEDIUM" | "LOW",',
      '  "isVideo": boolean,',
      '  "videoAction": string (optional),',
      '  "imagePromptInject": string,',
      '  "videoMotionInject": string',
      "}",
      "",
      "Rules:",
      "- Keep outputs practical for generating 'same look' prompts.",
      "- driftRisk: HIGH if markings/identity likely to drift (busy patterns / low light / motion blur).",
      "- suggestedDepth: one of: 'Cinematic Blur' | 'Balanced Depth' | 'Detailed Background'.",
      "- suggestedArc: short arc label like 'Ambush attack', 'Chase and takedown', 'Standoff', etc.",
      "- imagePromptInject: concise look-lock text (animal identity + environment + lighting).",
      "- videoMotionInject: concise motion-only line (camera + subject motion + env micro-motion).",
    ].join("\n");

    try {
      if (provider === "gemini") {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return jsonError("Missing GEMINI_API_KEY", 500);

        const stable = getGeminiModelStable();

        let { res, data } = await callGeminiVision(stable, apiKey, {
          prompt: analysisPrompt,
          mimeType,
          base64Data,
        });

        if (!res.ok) {
          const msg = JSON.stringify(data ?? {}).toLowerCase();
          const looksLikeModelIssue = msg.includes("model") && (msg.includes("support") || msg.includes("not found"));
          if (looksLikeModelIssue) {
            const fb = getGeminiModelFallback();
            ({ res, data } = await callGeminiVision(fb, apiKey, {
              prompt: analysisPrompt,
              mimeType,
              base64Data,
            }));
          }
        }

        if (!res.ok) return jsonError("Gemini vision request failed", 500, data);

        const text = extractGeminiText(data);
        let obj: Record<string, unknown>;
        try {
          obj = parseProviderJsonObject(text, "Gemini media analysis");
        } catch (error) {
          return jsonError(
            error instanceof Error
              ? error.message
              : "Gemini media analysis returned invalid JSON",
            502
          );
        }

        const out = mediaAnalysisSchema.safeParse({
          ...obj,
          isVideo: mediaType === "video",
        });

        if (!out.success) {
          return jsonError("Invalid analysis format from Gemini", 502, out.error.flatten());
        }

        return NextResponse.json({ analysis: out.data }, { status: 200 });
      }

      // provider === "claude" (image only)
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) return jsonError("Missing ANTHROPIC_API_KEY", 500);

      const claudeMimeType = normalizeClaudeVisionMimeType(mimeType);
      if (!claudeMimeType) {
        return jsonError("Claude vision supports JPEG, PNG, GIF, or WebP images only.", 400);
      }

      const { res, data } = await callClaudeVision(apiKey, {
        prompt: analysisPrompt,
        mimeType: claudeMimeType,
        base64Data,
      });

      if (!res.ok) return jsonError("Claude vision request failed", 500, data);

      const text = extractClaudeText(data);
      let obj: Record<string, unknown>;
      try {
        obj = parseProviderJsonObject(text, "Claude media analysis");
      } catch (error) {
        return jsonError(
          error instanceof Error
            ? error.message
            : "Claude media analysis returned invalid JSON",
          502
        );
      }

      const out = mediaAnalysisSchema.safeParse({
        ...obj,
        isVideo: false,
      });

      if (!out.success) {
        return jsonError("Invalid analysis format from Claude", 502, out.error.flatten());
      }

      return NextResponse.json({ analysis: out.data }, { status: 200 });
    } catch (err) {
      return jsonError("Media analysis error", 500, String(err));
    }
  }

  /**
   * ✅ BRANCH 2: lightweight copy + image-prompt polish
   * This route is NOT the main cinematic prompt-pack generator.
   */
  const parsedReq = copyPolishRequestSchema.safeParse(body);
  if (!parsedReq.success) {
    return jsonError("Invalid request", 400, parsedReq.error.flatten());
  }

  const provider = parsedReq.data.provider as Provider;

  const predator = sanitizeString(parsedReq.data.predator, 120);
  const prey = sanitizeString(parsedReq.data.prey, 120);
  const env = sanitizeString(parsedReq.data.env, 160);
  const arc = sanitizeString(parsedReq.data.arc, 160);
  const weather = sanitizeString(parsedReq.data.weather, 120);
  const emotionalTone = sanitizeString(parsedReq.data.emotionalTone, 120);
  const animalVibe = sanitizeString(parsedReq.data.animalVibe, 120);

  const baseImagePrompt = sanitizeString(parsedReq.data.base.imagePrompt, 4000);
  const baseHook = sanitizeString(parsedReq.data.base.hook, 500);
  const baseCaption = sanitizeString(parsedReq.data.base.caption, 1200);
  const baseVoiceover = sanitizeString(parsedReq.data.base.voiceoverLine, 800);

  const polishPrompt = [
    "You are a lightweight WSTV copy and prompt polisher for short-form wildlife videos.",
    "This endpoint is not the main cinematic prompt engine.",
    "Do not generate shot packs, workflow JSON, or multi-shot architecture.",
    "Return JSON only with optional keys: imagePrompt, hook, caption, voiceoverLine, improvements.",
    "Only rewrite fields that become genuinely better. Leave everything else out.",
    "If you touch imagePrompt, keep it as a surgical polish of the existing image prompt rather than a new workflow.",
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

      const text = extractGeminiText(data);
      let obj: Record<string, unknown>;
      try {
        obj = parseProviderJsonObject(text, "Gemini copy polish");
      } catch (error) {
        return jsonError(
          error instanceof Error ? error.message : "Gemini returned invalid JSON for copy polish",
          502
        );
      }

      const out = providerResponseSchema.safeParse(obj);
      if (!out.success) return jsonError("Invalid Gemini copy polish format", 502, out.error.flatten());
      if (!hasUsableGeneratedPackageEnhancements(out.data)) {
        return jsonError("Gemini returned no usable copy polish fields", 502);
      }

      return NextResponse.json({ ...out.data, aiEnhanced: true }, { status: 200 });
    }

    // Claude
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
