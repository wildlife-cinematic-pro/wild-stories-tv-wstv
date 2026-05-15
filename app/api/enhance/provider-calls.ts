import { GROQ_COPY_POLISH_MODEL } from "@/lib/copy-polish-providers";

async function fetchWithProviderTimeout(
  url: string,
  init: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}
// WSTV-AUDIT-FIX: FIX-8 applied

export function getGeminiModelStable(): string {
  return process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
}

export function getGeminiModelFallback(): string {
  return "gemini-flash-latest";
}

export async function callGeminiText(modelId: string, apiKey: string, prompt: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${encodeURIComponent(
    apiKey
  )}`;

  const res = await fetchWithProviderTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    }),
  });

  const data = await res.json().catch(() => ({}));
  return { res, data };
}

export async function callGeminiVision(
  modelId: string,
  apiKey: string,
  args: { prompt: string; mimeType: string; base64Data: string }
) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${encodeURIComponent(
    apiKey
  )}`;

  const res = await fetchWithProviderTimeout(url, {
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

export async function callClaudeText(apiKey: string, prompt: string) {
  const model = process.env.CLAUDE_MODEL?.trim() || "claude-opus-4-6";

  const res = await fetchWithProviderTimeout("https://api.anthropic.com/v1/messages", {
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

export function getOpenAIModelStable(): string {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini";
}

export async function callOpenAIText(apiKey: string, prompt: string) {
  const model = getOpenAIModelStable();

  const res = await fetchWithProviderTimeout("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "user",
          content: [{ type: "input_text", text: prompt }],
        },
      ],
      max_output_tokens: 800,
    }),
  });

  const data = await res.json().catch(() => ({}));
  return { res, data };
}

export async function callGroqText(
  apiKey: string,
  prompt: string,
  options: { maxCompletionTokens?: number } = {}
) {
  const res = await fetchWithProviderTimeout("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_COPY_POLISH_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_completion_tokens: options.maxCompletionTokens ?? 800,
    }),
  });

  const data = await res.json().catch(() => ({}));
  return { res, data };
}

export async function callClaudeVision(
  apiKey: string,
  args: { prompt: string; mimeType: string; base64Data: string }
) {
  const model = process.env.CLAUDE_MODEL?.trim() || "claude-opus-4-6";

  const res = await fetchWithProviderTimeout("https://api.anthropic.com/v1/messages", {
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

export function extractGeminiText(data: Record<string, unknown>): string {
  const candidates = data?.candidates as
    | { content?: { parts?: { text?: string }[] } }[]
    | undefined;
  const parts = candidates?.[0]?.content?.parts;
  const joined = (parts ?? []).map((p) => p?.text ?? "").join("");
  return joined || parts?.[0]?.text || "";
}

export function extractOpenAIText(data: Record<string, unknown>): string {
  const outputText = data?.output_text;
  if (typeof outputText === "string") return outputText;

  const output = data?.output as
    | { content?: { type?: string; text?: string }[] }[]
    | undefined;

  return (output ?? [])
    .flatMap((item) => item.content ?? [])
    .map((content) => content.text ?? "")
    .join("");
}

export function extractClaudeText(data: Record<string, unknown>): string {
  const content = data?.content as { text?: string }[] | undefined;
  const joined = (content ?? []).map((c) => c?.text ?? "").join("");
  return joined || content?.[0]?.text || "";
}

export function extractGroqText(data: Record<string, unknown>): string {
  const choices = data?.choices as
    | { message?: { content?: string }; delta?: { content?: string } }[]
    | undefined;
  return choices?.[0]?.message?.content || choices?.[0]?.delta?.content || "";
}
