export type ProviderPackPolishProviderUsed = "gemini" | "groq" | "local";

export type ProviderPackPolishMetadata = {
  providerUsed: ProviderPackPolishProviderUsed;
  polished: boolean;
  fallbackUsed: boolean;
};

export const LOCAL_PROVIDER_PACK_POLISH_METADATA: ProviderPackPolishMetadata = {
  providerUsed: "local",
  polished: false,
  fallbackUsed: false,
};

export function withProviderPackPolishMetadata<T extends object>(
  output: T,
  metadata: ProviderPackPolishMetadata
): T & ProviderPackPolishMetadata {
  return { ...output, ...metadata };
}
