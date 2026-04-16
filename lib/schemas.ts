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

export const wstvPromptPackSchema = z.object({
  master_image_prompt: z.string().min(1),
  shot1_video_prompt: z.string().min(1),
  shot2_video_prompt: z.string().min(1),
  shot2_audio_prompt: z.string().min(1),
  shot3_video_prompt: z.string().min(1),
  kling_negative_prompt: z.string().min(1),
  character_lock: z.string().min(1),
  hook: z.string().min(1),
  caption: z.string().min(1),
  motion_intensity: z.object({
    shot1: z.number().min(0.1).max(1.0),
    shot2: z.number().min(0.1).max(1.0),
    shot3: z.number().min(0.1).max(1.0),
  }),
  operator_notes: z.string().min(1),
});

export type WSTVPromptPack = z.infer<typeof wstvPromptPackSchema>;

export const enhanceResponseSchema = z.object({
  aiEnhanced: z.boolean().optional(),
  imagePrompt: z.string().optional(),
  hook: z.string().optional(),
  caption: z.string().optional(),
  voiceoverLine: z.string().optional(),
  improvements: z.union([z.string(), z.array(z.string())]).optional(),
  error: z.string().optional(),
  // Add WSTVPromptPack fields to enhanceResponseSchema for API validation
  master_image_prompt: z.string().optional(),
  shot1_video_prompt: z.string().optional(),
  shot2_video_prompt: z.string().optional(),
  shot2_audio_prompt: z.string().optional(),
  shot3_video_prompt: z.string().optional(),
  kling_negative_prompt: z.string().optional(),
  character_lock: z.string().optional(),
  motion_intensity: z.object({
    shot1: z.number().min(0.1).max(1.0),
    shot2: z.number().min(0.1).max(1.0),
    shot3: z.number().min(0.1).max(1.0),
  }).optional(),
  operator_notes: z.string().optional(),
});

export type EnhanceResponse = z.infer<typeof enhanceResponseSchema>;

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

export const uiSelectionSchema = z.object({
  predator: z.string().min(1),
  prey: z.string().min(1),
  runwayModel: z.string().min(1),
  klingModel: z.string().min(1),
  arc: z.string().min(1),
  weather: z.string().min(1),
});
