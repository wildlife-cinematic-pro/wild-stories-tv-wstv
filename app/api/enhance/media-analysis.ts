import { NextResponse } from "next/server";
import { z } from "zod";

import { mediaAnalysisSchema } from "@/lib/schemas";
import {
  normalizeClaudeVisionMimeType,
  parseProviderJsonObject,
} from "@/lib/enhance-provider";
import {
  callClaudeVision,
  callGeminiVision,
  extractClaudeText,
  extractGeminiText,
  getGeminiModelFallback,
  getGeminiModelStable,
} from "./provider-calls";
import { jsonError, sanitizeString, type Provider } from "./request-utils";

const analyzeMediaRequestSchema = z.object({
  analyzeMedia: z.literal(true),
  mediaType: z.enum(["image", "video"]),
  base64Data: z.string().min(16),
  mimeType: z.string().min(3),
  provider: z.enum(["gemini", "claude"]).optional(),
});

const GEMINI_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const GEMINI_VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);

export function normalizeGeminiVisionMimeType(
  mediaType: "image" | "video",
  mimeType: string
): string | undefined {
  let normalized = sanitizeString(mimeType, 120).trim().toLowerCase();
  if (!normalized) return undefined;

  if (normalized === "image/jpg") {
    normalized = "image/jpeg";
  }

  if (normalized === "video/mov") {
    normalized = "video/quicktime";
  }

  const allowedTypes =
    mediaType === "video" ? GEMINI_VIDEO_MIME_TYPES : GEMINI_IMAGE_MIME_TYPES;

  return allowedTypes.has(normalized) ? normalized : undefined;
}

function jsonProviderFailure(detailedData: unknown) {
  if (process.env.NODE_ENV === "production") {
    return jsonError("Provider request failed", 502);
  }
  return jsonError("Provider request failed", 502, detailedData);
}
// WSTV-AUDIT-FIX: FIX-7 applied

function buildAnalysisPrompt() {
  return [
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
}

export async function handleMediaAnalysisRequest(body: unknown) {
  const parsed = analyzeMediaRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid analyzeMedia request", 400, parsed.error.flatten());
  }

  const mediaType = parsed.data.mediaType;
  const mimeType = sanitizeString(parsed.data.mimeType, 120);
  const base64Data = sanitizeString(parsed.data.base64Data, 20_000_000);
  const requestedProvider = (parsed.data.provider || "gemini") as Provider;
  const provider: Provider = mediaType === "video" ? "gemini" : requestedProvider;
  const analysisPrompt = buildAnalysisPrompt();

  try {
    if (provider === "gemini") {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return jsonError("Missing GEMINI_API_KEY", 500);

      const geminiMimeType = normalizeGeminiVisionMimeType(mediaType, mimeType);
      if (!geminiMimeType) {
        return jsonError(
          mediaType === "video"
            ? "Gemini media analysis supports MP4, QuickTime, or WebM videos only."
            : "Gemini media analysis supports JPEG, PNG, GIF, or WebP images only.",
          400
        );
      }

      const stable = getGeminiModelStable();
      let { res, data } = await callGeminiVision(stable, apiKey, {
        prompt: analysisPrompt,
        mimeType: geminiMimeType,
        base64Data,
      });

      if (!res.ok) {
        const msg = JSON.stringify(data ?? {}).toLowerCase();
        const looksLikeModelIssue = msg.includes("model") && (msg.includes("support") || msg.includes("not found"));
        if (looksLikeModelIssue) {
          const fb = getGeminiModelFallback();
          ({ res, data } = await callGeminiVision(fb, apiKey, {
            prompt: analysisPrompt,
            mimeType: geminiMimeType,
            base64Data,
          }));
        }
      }

      if (!res.ok) return jsonProviderFailure(data);

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
        return jsonProviderFailure(out.error.flatten());
      }

      return NextResponse.json({ analysis: out.data }, { status: 200 });
    }

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

    if (!res.ok) return jsonProviderFailure(data);

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
      return jsonProviderFailure(out.error.flatten());
    }

    return NextResponse.json({ analysis: out.data }, { status: 200 });
  } catch (err) {
    return jsonError("Media analysis error", 500, String(err));
  }
}
