import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/api/enhance/provider-calls", () => ({
  callGeminiText: vi.fn(),
  callClaudeText: vi.fn(),
  callOpenAIText: vi.fn(),
  callGroqText: vi.fn(),
  extractGeminiText: vi.fn(),
  extractClaudeText: vi.fn(),
  extractOpenAIText: vi.fn(),
  extractGroqText: vi.fn(),
  getGeminiModelFallback: vi.fn(() => "gemini-flash-latest"),
  getGeminiModelStable: vi.fn(() => "gemini-2.5-flash"),
  getOpenAIModelStable: vi.fn(() => "gpt-4.1-mini"),
}));

import { handleCopyPolishRequest } from "@/app/api/enhance/copy-polish";
import { GET as getProviderStatus } from "@/app/api/enhance/provider-status/route";
import {
  callGeminiText,
  callGroqText,
  extractGeminiText,
  extractGroqText,
} from "@/app/api/enhance/provider-calls";
import {
  DEFAULT_COPY_POLISH_PROVIDER,
  getCopyPolishProviderAvailability,
} from "@/lib/copy-polish-providers";
import { copyPolishRequestSchema } from "@/lib/schemas";

const baseRequest = {
  provider: "gemini" as const,
  predator: "Mountain Lion",
  prey: "White-tailed Deer",
  env: "Rocky Mountain forest edge",
  arc: "Escape from danger",
  weather: "Golden Hour",
  emotionalTone: "Raw Tension",
  animalVibe: "BBC Earth Documentary",
  base: {
    imagePrompt:
      "Photorealistic wildlife documentary image prompt, no blood, no gore.",
    hook: "The escape lane closes fast.",
    caption: "The escape lane closes fast.",
    voiceoverLine: "The first move changes the whole frame.",
  },
};

async function readJson(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

describe("provider regression guard", () => {
  const originalGeminiKey = process.env.GEMINI_API_KEY;
  const originalGroqKey = process.env.GROQ_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.GEMINI_API_KEY;
    delete process.env.GROQ_API_KEY;
  });

  afterEach(() => {
    if (originalGeminiKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalGeminiKey;
    }

    if (originalGroqKey === undefined) {
      delete process.env.GROQ_API_KEY;
    } else {
      process.env.GROQ_API_KEY = originalGroqKey;
    }
  });

  it("keeps Gemini as the default provider and auto fallback off by default", () => {
    expect(DEFAULT_COPY_POLISH_PROVIDER).toBe("gemini");

    const parsed = copyPolishRequestSchema.parse(baseRequest);
    expect(parsed.provider).toBe("gemini");
    expect(parsed.autoFallback).toBe(false);
  });

  it("enables Groq only when a server-side key exists without auto-selecting it", () => {
    expect(
      getCopyPolishProviderAvailability({}).find((provider) => provider.id === "groq")
    ).toMatchObject({ enabled: false });

    const availability = getCopyPolishProviderAvailability({
      GROQ_API_KEY: "secret-groq-key",
    });
    expect(availability.find((provider) => provider.id === "gemini")).toMatchObject({
      enabled: true,
      label: "Gemini Default",
    });
    expect(availability.find((provider) => provider.id === "groq")).toMatchObject({
      enabled: true,
      label: "Groq Free",
    });
    expect(DEFAULT_COPY_POLISH_PROVIDER).toBe("gemini");
  });

  it("provider status returns only safe metadata and no key values", async () => {
    process.env.GEMINI_API_KEY = "secret-gemini-key";
    process.env.GROQ_API_KEY = "secret-groq-key";

    const payload = await readJson(getProviderStatus());
    const serialized = JSON.stringify(payload);

    expect(serialized).not.toContain("secret-gemini-key");
    expect(serialized).not.toContain("secret-groq-key");
    expect(serialized).not.toContain("GEMINI_API_KEY");
    expect(serialized).not.toContain("GROQ_API_KEY");

    const providers = payload.providers as Array<Record<string, unknown>>;
    expect(providers.length).toBeGreaterThan(0);
    for (const provider of providers) {
      expect(Object.keys(provider).sort()).toEqual([
        "enabled",
        "helperText",
        "id",
        "label",
      ]);
    }
  });

  it("does not call Groq after Gemini failure when autoFallback is false", async () => {
    process.env.GEMINI_API_KEY = "secret-gemini-key";
    process.env.GROQ_API_KEY = "secret-groq-key";
    vi.mocked(callGeminiText).mockResolvedValue({
      res: new Response("{}", { status: 200 }),
      data: {},
    });
    vi.mocked(extractGeminiText).mockReturnValue("not json");

    const response = await handleCopyPolishRequest({
      ...baseRequest,
      autoFallback: false,
    });
    const payload = await readJson(response);

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      skipped: true,
      provider: "gemini",
      reason: "invalid_gemini_json",
    });
    expect(callGeminiText).toHaveBeenCalledTimes(1);
    expect(callGroqText).not.toHaveBeenCalled();
  });

  it("calls Groq after Gemini failure only when autoFallback is true and Groq is available", async () => {
    process.env.GEMINI_API_KEY = "secret-gemini-key";
    process.env.GROQ_API_KEY = "secret-groq-key";
    vi.mocked(callGeminiText).mockResolvedValue({
      res: new Response("{}", { status: 200 }),
      data: {},
    });
    vi.mocked(extractGeminiText).mockReturnValue("not json");
    vi.mocked(callGroqText).mockResolvedValue({
      res: new Response("{}", { status: 200 }),
      data: {},
    });
    vi.mocked(extractGroqText).mockReturnValue(
      JSON.stringify({ hook: "The escape lane changes before the deer moves." })
    );

    const response = await handleCopyPolishRequest({
      ...baseRequest,
      autoFallback: true,
    });
    const payload = await readJson(response);

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      aiEnhanced: true,
      providerUsed: "groq",
      fallbackUsed: true,
      fallbackReason: "invalid_gemini_json",
    });
    expect(callGeminiText).toHaveBeenCalledTimes(1);
    expect(callGroqText).toHaveBeenCalledTimes(1);
  });

  it("selected Groq calls Groq directly without touching Gemini", async () => {
    process.env.GROQ_API_KEY = "secret-groq-key";
    vi.mocked(callGroqText).mockResolvedValue({
      res: new Response("{}", { status: 200 }),
      data: {},
    });
    vi.mocked(extractGroqText).mockReturnValue(
      JSON.stringify({ caption: "The escape lane closes fast." })
    );

    const response = await handleCopyPolishRequest({
      ...baseRequest,
      provider: "groq",
    });
    const payload = await readJson(response);

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      aiEnhanced: true,
      caption: "The escape lane closes fast.",
    });
    expect(callGroqText).toHaveBeenCalledTimes(1);
    expect(callGeminiText).not.toHaveBeenCalled();
  });
});

