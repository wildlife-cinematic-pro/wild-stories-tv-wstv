// file: lib/schemas.ts
import { z } from "zod";

export const aiProviderSchema = z.enum(["none", "claude", "gemini"]);

export const enhanceRequestSchema = z.object({
  provider: z.enum(["claude", "gemini"]),
  predator: z.string().min(1).max(64),
  prey: z.string().min(1).max(64),
  env: z.string().min(1).max(300),
  arc: z.string().min(1).max(120),
  weather: z.string().min(1).max(80),
  emotionalTone: z.string().min(1).max(80),
  animalVibe: z.string().min(1).max(80),
  base: z.object({
    imagePrompt: z.string().min(20),
    hook: z.string().optional().default(""),
    caption: z.string().optional().default(""),
    voiceoverLine: z.string().optional().default(""),
  }),
});

export type EnhanceRequest = z.infer<typeof enhanceRequestSchema>;

export const enhanceResponseSchema = z.object({
  aiEnhanced: z.boolean().optional(),
  imagePrompt: z.string().optional(),
  hook: z.string().optional(),
  caption: z.string().optional(),
  voiceoverLine: z.string().optional(),
  improvements: z.union([z.string(), z.array(z.string())]).optional(),
  error: z.string().optional(),
});

export type EnhanceResponse = z.infer<typeof enhanceResponseSchema>;

export const uiSelectionSchema = z.object({
  predator: z.string().min(1),
  prey: z.string().min(1),
  runwayModel: z.string().min(1),
  klingModel: z.string().min(1),
  arc: z.string().min(1),
  weather: z.string().min(1),
});
