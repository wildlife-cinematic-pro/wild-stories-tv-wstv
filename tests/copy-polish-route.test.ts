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
import {
  callClaudeText,
  callGeminiText,
  callGroqText,
  callOpenAIText,
  extractGeminiText,
  extractGroqText,
  extractOpenAIText,
} from "@/app/api/enhance/provider-calls";

const GEMINI_SKIP_MESSAGE =
  "Gemini copy polish skipped — using base generated copy.";
const OPENAI_SKIP_MESSAGE =
  "OpenAI copy polish skipped — using base generated copy.";
const GROQ_SKIP_MESSAGE =
  "Groq copy polish skipped — using base generated copy.";

const baseRequest = {
  provider: "gemini" as const,
  predator: "Mountain Lion",
  prey: "White-tailed Deer",
  env: "Rocky mountain meadow",
  arc: "Ambush attack",
  weather: "Golden Hour",
  emotionalTone: "Raw Tension",
  animalVibe: "National Geographic Wild",
  base: {
    imagePrompt:
      "Photorealistic wildlife documentary still, same mountain lion and same deer, full-body readability, clear spacing, grounded contact, mountain meadow continuity.",
    hook: "A mountain lion locks onto a deer at golden hour.",
    caption: "Wild survival pressure in one clean frame.",
    voiceoverLine: "A predator commits while the deer reads the lane.",
  },
};

describe("Gemini copy polish optional fallback", () => {
  const originalGeminiKey = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.GEMINI_API_KEY;
  });

  afterEach(() => {
    if (originalGeminiKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalGeminiKey;
    }
  });

  it("returns a skipped response when the Gemini API key is missing", async () => {
    const response = await handleCopyPolishRequest(baseRequest);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      skipped: true,
      provider: "gemini",
      reason: "missing_gemini_api_key",
      message: GEMINI_SKIP_MESSAGE,
    });
    expect(callGeminiText).not.toHaveBeenCalled();
  });

  it("returns a skipped response when Gemini sends invalid JSON", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    vi.mocked(callGeminiText).mockResolvedValue({
      res: new Response("{}", { status: 200 }),
      data: {},
    });
    vi.mocked(extractGeminiText).mockReturnValue("Hook: non-json text");

    const response = await handleCopyPolishRequest(baseRequest);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      skipped: true,
      provider: "gemini",
      reason: "invalid_gemini_json",
      message: GEMINI_SKIP_MESSAGE,
    });
  });

  it("returns a skipped response when Gemini returns no usable polish fields", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    vi.mocked(callGeminiText).mockResolvedValue({
      res: new Response("{}", { status: 200 }),
      data: {},
    });
    vi.mocked(extractGeminiText).mockReturnValue('{"aiEnhanced":true}');

    const response = await handleCopyPolishRequest(baseRequest);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      skipped: true,
      provider: "gemini",
      reason: "no_usable_fields",
      message: GEMINI_SKIP_MESSAGE,
    });
  });

  it("keeps valid Gemini polish behavior unchanged", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    vi.mocked(callGeminiText).mockResolvedValue({
      res: new Response("{}", { status: 200 }),
      data: {},
    });
    vi.mocked(extractGeminiText).mockReturnValue(
      JSON.stringify({
        imagePrompt:
          "Photorealistic wildlife documentary still with the same mountain lion and deer, cleaner spacing, stable anatomy, and stronger continuity wording.",
        hook: "A mountain lion commits as the deer reads one escape lane.",
      })
    );

    const response = await handleCopyPolishRequest(baseRequest);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      aiEnhanced: true,
      imagePrompt: expect.stringContaining("same mountain lion and deer"),
      hook: "A mountain lion commits as the deer reads one escape lane.",
    });
  });
});


describe("Groq copy polish optional fallback", () => {
  const originalGroqKey = process.env.GROQ_API_KEY;
  const groqRequest = { ...baseRequest, provider: "groq" as const };

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.GROQ_API_KEY;
  });

  afterEach(() => {
    if (originalGroqKey === undefined) {
      delete process.env.GROQ_API_KEY;
    } else {
      process.env.GROQ_API_KEY = originalGroqKey;
    }
  });

  it("returns a skipped response when the Groq API key is missing", async () => {
    const response = await handleCopyPolishRequest(groqRequest);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      skipped: true,
      provider: "groq",
      reason: "missing_groq_api_key",
      message: GROQ_SKIP_MESSAGE,
    });
    expect(callGroqText).not.toHaveBeenCalled();
  });

  it("returns polished copy when Groq sends valid JSON", async () => {
    process.env.GROQ_API_KEY = "test-key";
    vi.mocked(callGroqText).mockResolvedValue({
      res: new Response("{}", { status: 200 }),
      data: {},
    });
    vi.mocked(extractGroqText).mockReturnValue(
      JSON.stringify({
        caption: "The escape lane changes before the deer commits.",
        voiceoverLine: "The first move decides the whole frame.",
      })
    );

    const response = await handleCopyPolishRequest(groqRequest);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      aiEnhanced: true,
      caption: "The escape lane changes before the deer commits.",
      voiceoverLine: "The first move decides the whole frame.",
    });
    expect(callGroqText).toHaveBeenCalledTimes(1);
  });
});

describe("OpenAI copy polish optional fallback", () => {
  const originalOpenAIKey = process.env.OPENAI_API_KEY;
  const openAIRequest = { ...baseRequest, provider: "openai" as const };

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.OPENAI_API_KEY;
  });

  afterEach(() => {
    if (originalOpenAIKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = originalOpenAIKey;
    }
  });

  it("returns a skipped response when the OpenAI API key is missing", async () => {
    const response = await handleCopyPolishRequest(openAIRequest);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      skipped: true,
      provider: "openai",
      reason: "missing_openai_api_key",
      message: OPENAI_SKIP_MESSAGE,
    });
    expect(callOpenAIText).not.toHaveBeenCalled();
  });

  it("returns a skipped response when OpenAI sends invalid JSON", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    vi.mocked(callOpenAIText).mockResolvedValue({
      res: new Response("{}", { status: 200 }),
      data: {},
    });
    vi.mocked(extractOpenAIText).mockReturnValue("Hook: non-json text");

    const response = await handleCopyPolishRequest(openAIRequest);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      skipped: true,
      provider: "openai",
      reason: "invalid_openai_json",
      message: OPENAI_SKIP_MESSAGE,
    });
  });
});


describe("future copy polish provider slots", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ["openrouter", "OpenRouter Free"],
    ["huggingface", "Hugging Face"],
  ] as const)("skips %s without calling a provider", async (provider, label) => {
    const response = await handleCopyPolishRequest({ ...baseRequest, provider });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      skipped: true,
      provider,
      reason: "future_provider_not_wired",
      message: label + " copy polish is a future provider slot — using base generated copy.",
    });
    expect(callGeminiText).not.toHaveBeenCalled();
    expect(callOpenAIText).not.toHaveBeenCalled();
    expect(callGroqText).not.toHaveBeenCalled();
    expect(callClaudeText).not.toHaveBeenCalled();
  });
});
