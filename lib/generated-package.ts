import type { GeneratedPackage } from "@/types";

export type GeneratedPackageEnhancements = Partial<
  Pick<GeneratedPackage, "imagePrompt" | "hook" | "caption" | "voiceoverLine"> & {
    aiEnhanced: boolean;
  }
>;

const GENERATED_PACKAGE_ENHANCEMENT_KEYS = [
  "imagePrompt",
  "hook",
  "caption",
  "voiceoverLine",
] as const;

export function hasUsableGeneratedPackageEnhancements(
  enhanced: GeneratedPackageEnhancements | null | undefined
): boolean {
  if (!enhanced) return false;

  return GENERATED_PACKAGE_ENHANCEMENT_KEYS.some((key) => {
    const value = enhanced[key];
    return typeof value === "string" && value.trim().length > 0;
  });
}

export function mergeGeneratedPackage(
  basePkg: GeneratedPackage,
  enhanced: GeneratedPackageEnhancements = {},
  extras: Partial<GeneratedPackage> = {}
): GeneratedPackage {
  return {
    ...basePkg,
    ...enhanced,
    ...extras,
  };
}
