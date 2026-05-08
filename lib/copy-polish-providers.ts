import type { AIProvider } from "@/types";

export type CopyPolishProviderKind = "active" | "future" | "fallback" | "local";

export type CopyPolishProviderConfig = {
  id: AIProvider;
  label: string;
  shortLabel: string;
  description: string;
  envVar?: string;
  kind: CopyPolishProviderKind;
  serverSupported: boolean;
  currentDefault?: boolean;
};

export type CopyPolishProviderAvailability = {
  id: AIProvider;
  enabled: boolean;
  label: string;
  helperText: string;
};

export const DEFAULT_COPY_POLISH_PROVIDER: AIProvider = "gemini";
export const GROQ_COPY_POLISH_MODEL = "llama-3.3-70b-versatile";
// Optional future fast Groq model: "llama-3.1-8b-instant".

export const COPY_POLISH_PROVIDER_CONFIGS = [
  {
    id: "gemini",
    label: "Gemini Default",
    shortLabel: "Gemini",
    description: "Current WSTV copy and prompt polish provider.",
    envVar: "GEMINI_API_KEY",
    kind: "active",
    serverSupported: true,
    currentDefault: true,
  },
  {
    id: "openai",
    label: "ChatGPT / OpenAI",
    shortLabel: "OpenAI",
    description: "Future polish provider slot.",
    envVar: "OPENAI_API_KEY",
    kind: "future",
    serverSupported: true,
  },
  {
    id: "claude",
    label: "Claude",
    shortLabel: "Claude",
    description: "Future polish provider slot.",
    envVar: "ANTHROPIC_API_KEY",
    kind: "future",
    serverSupported: true,
  },
  {
    id: "groq",
    label: "Groq Free",
    shortLabel: "Groq",
    description: "First free fallback provider for copy and prompt polish.",
    envVar: "GROQ_API_KEY",
    kind: "fallback",
    serverSupported: true,
  },
  {
    id: "openrouter",
    label: "OpenRouter Free",
    shortLabel: "OpenRouter",
    description: "Future free fallback provider slot.",
    envVar: "OPENROUTER_API_KEY",
    kind: "fallback",
    serverSupported: false,
  },
  {
    id: "huggingface",
    label: "Hugging Face",
    shortLabel: "Hugging Face",
    description: "Optional future fallback provider slot.",
    envVar: "HUGGINGFACE_API_KEY",
    kind: "fallback",
    serverSupported: false,
  },
  {
    id: "none",
    label: "Off (Local)",
    shortLabel: "Local",
    description: "No API polish. Use the generated local package as-is.",
    kind: "local",
    serverSupported: true,
  },
] satisfies CopyPolishProviderConfig[];

export const COPY_POLISH_PROVIDER_IDS = COPY_POLISH_PROVIDER_CONFIGS.map(
  (provider) => provider.id
) as AIProvider[];

export const COPY_POLISH_FALLBACK_PLAN: AIProvider[] = [
  "gemini",
  "groq",
  "openrouter",
  "huggingface",
  "none",
];

export function isCopyPolishProviderId(value: unknown): value is AIProvider {
  return typeof value === "string" && COPY_POLISH_PROVIDER_IDS.includes(value as AIProvider);
}

export function getCopyPolishProviderConfig(providerId: AIProvider) {
  return COPY_POLISH_PROVIDER_CONFIGS.find((provider) => provider.id === providerId);
}

export function getCopyPolishProviderLabel(providerId: AIProvider): string {
  return getCopyPolishProviderConfig(providerId)?.label ?? providerId;
}

export function formatCopyPolishFallbackPlan(): string {
  return COPY_POLISH_FALLBACK_PLAN.map(getCopyPolishProviderLabel).join(" -> ");
}

export function getCopyPolishProviderAvailability(
  env: Partial<Record<string, string | undefined>>
): CopyPolishProviderAvailability[] {
  return COPY_POLISH_PROVIDER_CONFIGS.map((provider) => {
    const hasKey = provider.envVar ? Boolean(env[provider.envVar]) : true;

    if (provider.kind === "local") {
      return {
        id: provider.id,
        enabled: true,
        label: provider.label,
        helperText: "Local mode — no API polish will be called.",
      };
    }

    if (provider.currentDefault) {
      return {
        id: provider.id,
        enabled: true,
        label: provider.label,
        helperText: hasKey
          ? "Current default provider."
          : "Gemini stays selected; add GEMINI_API_KEY for live polish, otherwise WSTV uses base generated copy.",
      };
    }

    if (!hasKey) {
      return {
        id: provider.id,
        enabled: false,
        label: provider.label,
        helperText: "Future provider — add API key to enable.",
      };
    }

    if (!provider.serverSupported) {
      return {
        id: provider.id,
        enabled: false,
        label: provider.label,
        helperText: "Future provider — backend proxy support is not wired yet.",
      };
    }

    return {
      id: provider.id,
      enabled: true,
      label: provider.label,
      helperText:
        provider.id === "groq"
          ? "Groq Free key detected. Select it manually to use Groq polish."
          : "Future provider key detected. Gemini remains the default until you choose this provider.",
    };
  });
}
