// file: lib/schemas.ts
import { z } from "zod";

export const aiProviderSchema = z.enum(["none", "claude", "gemini"]);

const copyPolishFieldSchema = z.string().trim().min(1);
const copyPolishImprovementItemSchema = copyPolishFieldSchema.max(400);
const copyPolishImprovementsSchema = z.preprocess(
  (value) => {
    if (!Array.isArray(value)) return value;
    const cleaned = value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
    return cleaned;
  },
  z.union([
    copyPolishImprovementItemSchema,
    z.array(copyPolishImprovementItemSchema).min(1).max(8),
  ])
);

const copyPolishBaseSchema = z
  .object({
    imagePrompt: z.string().trim().min(20).max(4000),
    hook: z.string().trim().max(500).optional().default(""),
    caption: z.string().trim().max(1200).optional().default(""),
    voiceoverLine: z.string().trim().max(800).optional().default(""),
  })
  .strict();

// Lightweight AI polish only.
// This is not the main cinematic prompt-pack architecture.
export const copyPolishRequestSchema = z
  .object({
    provider: z.enum(["claude", "gemini"]),
    predator: z.string().min(1).max(64),
    prey: z.string().min(1).max(64),
    env: z.string().min(1).max(300),
    arc: z.string().min(1).max(120),
    weather: z.string().min(1).max(80),
    emotionalTone: z.string().min(1).max(80),
    animalVibe: z.string().min(1).max(80),
    base: copyPolishBaseSchema,
  })
  .strict();

export type CopyPolishRequest = z.infer<typeof copyPolishRequestSchema>;

export const copyPolishResponseSchema = z
  .object({
    aiEnhanced: z.boolean().optional(),
    imagePrompt: copyPolishFieldSchema.max(4000).optional(),
    hook: copyPolishFieldSchema.max(500).optional(),
    caption: copyPolishFieldSchema.max(1200).optional(),
    voiceoverLine: copyPolishFieldSchema.max(800).optional(),
    improvements: copyPolishImprovementsSchema.optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const hasPolishField =
      typeof value.imagePrompt === "string" ||
      typeof value.hook === "string" ||
      typeof value.caption === "string" ||
      typeof value.voiceoverLine === "string" ||
      typeof value.improvements === "string" ||
      (Array.isArray(value.improvements) && value.improvements.length > 0);

    if (!hasPolishField) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Expected at least one usable copy or prompt polish field.",
      });
    }
  });

export type CopyPolishResponse = z.infer<typeof copyPolishResponseSchema>;

export const copyPolishSkippedResponseSchema = z
  .object({
    skipped: z.literal(true),
    provider: z.enum(["claude", "gemini"]),
    reason: z.string().min(1),
    message: z.string().min(1),
  })
  .strict();

export type CopyPolishSkippedResponse = z.infer<typeof copyPolishSkippedResponseSchema>;

export const copyPolishEndpointResponseSchema = z.union([
  copyPolishResponseSchema,
  copyPolishSkippedResponseSchema,
]);

export type CopyPolishEndpointResponse = z.infer<typeof copyPolishEndpointResponseSchema>;

export const mediaAnalysisSchema = z
  .object({
    animalName: z.string().min(1),
    coatDescription: z.string().min(1),
    environment: z.string().min(1),
    lighting: z.string().min(1),
    suggestedArc: z.string().min(1),
    suggestedDepth: z.enum(["Cinematic Blur", "Balanced Depth", "Detailed Background"]),
    weather: z.string().min(1),
    timeOfDay: z.string().min(1),
    driftRisk: z.enum(["HIGH", "MEDIUM", "LOW"]),
    isVideo: z.boolean(),
    videoAction: z.string().optional(),
    imagePromptInject: z.string().min(1),
    videoMotionInject: z.string().min(1),
  })
  .strict();

export type MediaAnalysisPayload = z.infer<typeof mediaAnalysisSchema>;
