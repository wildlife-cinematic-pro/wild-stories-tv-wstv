import { describe, expect, it } from "vitest";

import {
  COPY_POLISH_PROVIDER_CONFIGS,
  formatCopyPolishFallbackPlan,
  getCopyPolishProviderAvailability,
} from "@/lib/copy-polish-providers";

describe("copy polish provider config", () => {
  it("keeps Gemini as the active default and exposes future fallback slots", () => {
    expect(COPY_POLISH_PROVIDER_CONFIGS.map((provider) => provider.id)).toEqual([
      "gemini",
      "openai",
      "claude",
      "groq",
      "openrouter",
      "huggingface",
      "none",
    ]);
    expect(COPY_POLISH_PROVIDER_CONFIGS.find((provider) => provider.id === "gemini")).toMatchObject({
      label: "Gemini Default",
      currentDefault: true,
      serverSupported: true,
    });
    expect(formatCopyPolishFallbackPlan()).toBe(
      "Gemini Default -> Groq Free -> OpenRouter Free -> Hugging Face -> Off (Local)"
    );
  });

  it("disables future providers when keys are missing without exposing secrets", () => {
    const availability = getCopyPolishProviderAvailability({});
    expect(availability.find((provider) => provider.id === "gemini")).toMatchObject({
      enabled: true,
      label: "Gemini Default",
    });
    expect(availability.find((provider) => provider.id === "openai")).toMatchObject({
      enabled: false,
      label: "ChatGPT / OpenAI",
      helperText: "Future provider — add API key to enable.",
    });
    expect(availability.find((provider) => provider.id === "none")).toMatchObject({
      enabled: true,
      label: "Off (Local)",
    });
  });

  it("enables Groq when its key is present", () => {
    const availability = getCopyPolishProviderAvailability({
      GROQ_API_KEY: "test-groq-key",
    });
    expect(availability.find((item) => item.id === "groq")).toMatchObject({
      enabled: true,
      label: "Groq Free",
      helperText: "Groq Free key detected. Select it manually to use Groq polish.",
    });
  });

  it("keeps unimplemented free providers disabled until backend support is wired", () => {
    const availability = getCopyPolishProviderAvailability({
      OPENROUTER_API_KEY: "test-openrouter-key",
      HUGGINGFACE_API_KEY: "test-hf-key",
    });
    for (const provider of ["openrouter", "huggingface"] as const) {
      expect(availability.find((item) => item.id === provider)).toMatchObject({
        enabled: false,
        helperText: "Future provider — backend proxy support is not wired yet.",
      });
    }
  });
});
