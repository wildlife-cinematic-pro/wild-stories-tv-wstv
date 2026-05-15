import { NextResponse } from "next/server";
import { z } from "zod";

import { parseProviderJsonObject } from "@/lib/enhance-provider";
import {
  LOCAL_PROVIDER_PACK_POLISH_METADATA,
  type ProviderPackPolishMetadata,
  withProviderPackPolishMetadata,
} from "@/lib/provider-polish-metadata";
import { buildCinematicStoryboardCopy, type CinematicStoryboard, type StoryboardShot } from "@/lib/storyboard-shot-builder";
import type { FourShotPhotoOutput, FourShotPhotoShot } from "@/lib/four-shot-photo-system";
import {
  callGeminiText,
  callGroqText,
  extractGeminiText,
  extractGroqText,
  getGeminiModelFallback,
  getGeminiModelStable,
} from "./provider-calls";
import { sanitizeString } from "./request-utils";

type ProviderPackKind = "storyboard" | "fourShotPhoto";
type ProviderPackProvider = "gemini" | "groq";

const providerPackPolishRequestSchema = z
  .object({
    packPolish: z.literal(true),
    packKind: z.enum(["storyboard", "fourShotPhoto"]),
    provider: z.enum(["none", "gemini", "claude", "openai", "groq", "openrouter", "huggingface"]),
    autoFallback: z.boolean().optional().default(false),
    base: z.record(z.string(), z.unknown()),
  })
  .strict();

function jsonPack(output: Record<string, unknown>) {
  return NextResponse.json({ output }, { status: 200 });
}

function jsonLocalPack(base: Record<string, unknown>) {
  return jsonPack(withProviderPackPolishMetadata(base, LOCAL_PROVIDER_PACK_POLISH_METADATA));
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function cleanText(value: unknown, fallback: string, maxLen = 20_000): string {
  return hasText(value) ? sanitizeString(value, maxLen).trim() : fallback;
}

function cleanStringArray(value: unknown, fallback: string[], maxItems = 60): string[] {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value
    .map((item) => (hasText(item) ? sanitizeString(item, 1200).trim() : ""))
    .filter(Boolean)
    .slice(0, maxItems);
  return cleaned.length ? cleaned : fallback;
}

function hasChanged(a: unknown, b: unknown) {
  return JSON.stringify(a) !== JSON.stringify(b);
}

function mergeStoryboardPolish(base: CinematicStoryboard, raw: Record<string, unknown>): CinematicStoryboard | null {
  const source = raw.storyboard && typeof raw.storyboard === "object" ? raw.storyboard as Record<string, unknown> : raw;
  const rawShots = Array.isArray(source.shots) ? source.shots : [];
  if (rawShots.length !== base.shots.length || base.summary.totalShots !== 4) return null;

  const shots = base.shots.map((baseShot, index): StoryboardShot => {
    const rawShot = rawShots[index];
    const shot = rawShot && typeof rawShot === "object" ? rawShot as Record<string, unknown> : {};
    const rawImagePrompts = shot.imagePrompts && typeof shot.imagePrompts === "object"
      ? shot.imagePrompts as Record<string, unknown>
      : {};
    const rawMotionPrompts = shot.motionPrompts && typeof shot.motionPrompts === "object"
      ? shot.motionPrompts as Record<string, unknown>
      : {};

    return {
      ...baseShot,
      summary: cleanText(shot.summary, baseShot.summary, 1800),
      imagePrompts: {
        gptImage2Long: cleanText(rawImagePrompts.gptImage2Long, baseShot.imagePrompts.gptImage2Long),
        gptImage2Short: cleanText(rawImagePrompts.gptImage2Short, baseShot.imagePrompts.gptImage2Short),
        nanoBanana2Long: cleanText(rawImagePrompts.nanoBanana2Long, baseShot.imagePrompts.nanoBanana2Long),
        nanoBanana2Short: cleanText(rawImagePrompts.nanoBanana2Short, baseShot.imagePrompts.nanoBanana2Short),
      },
      motionPrompts: {
        kling: cleanText(rawMotionPrompts.kling, baseShot.motionPrompts.kling),
      },
      notes: cleanStringArray(shot.notes, baseShot.notes),
    };
  });

  if (!hasChanged(base.shots, shots)) return null;

  return {
    ...base,
    shots,
    copy: buildCinematicStoryboardCopy(base.summary, shots),
    providerUsed: "local",
    polished: false,
    fallbackUsed: false,
  };
}

function mergeFourShotPhotoPolish(base: FourShotPhotoOutput, raw: Record<string, unknown>): FourShotPhotoOutput | null {
  const source = raw.fourShotPhoto && typeof raw.fourShotPhoto === "object" ? raw.fourShotPhoto as Record<string, unknown> : raw;
  const rawMaster = source.masterEnvironment && typeof source.masterEnvironment === "object"
    ? source.masterEnvironment as Record<string, unknown>
    : {};
  const rawShots = Array.isArray(source.shots) ? source.shots : [];
  if (rawShots.length !== base.shots.length || base.shots.length !== 4) return null;

  const masterEnvironment = {
    ...base.masterEnvironment,
    nanoBanana2Prompt: cleanText(rawMaster.nanoBanana2Prompt, base.masterEnvironment.nanoBanana2Prompt),
    gptImage2Prompt: cleanText(rawMaster.gptImage2Prompt, base.masterEnvironment.gptImage2Prompt),
    continuityChecklist: cleanStringArray(
      rawMaster.continuityChecklist,
      base.masterEnvironment.continuityChecklist
    ),
  };

  const shots = base.shots.map((baseShot, index): FourShotPhotoShot => {
    const rawShot = rawShots[index];
    const shot = rawShot && typeof rawShot === "object" ? rawShot as Record<string, unknown> : {};

    return {
      ...baseShot,
      nanoBanana2Prompt: cleanText(shot.nanoBanana2Prompt, baseShot.nanoBanana2Prompt),
      gptImage2Prompt: cleanText(shot.gptImage2Prompt, baseShot.gptImage2Prompt),
      continuityChecklist: cleanStringArray(shot.continuityChecklist, baseShot.continuityChecklist),
    };
  });

  if (!hasChanged(base.masterEnvironment, masterEnvironment) && !hasChanged(base.shots, shots)) {
    return null;
  }

  return {
    ...base,
    masterEnvironment,
    shots,
    providerUsed: "local",
    polished: false,
    fallbackUsed: false,
  };
}

function mergeProviderPolish(
  packKind: ProviderPackKind,
  base: Record<string, unknown>,
  raw: Record<string, unknown>,
  metadata: ProviderPackPolishMetadata
) {
  const merged = packKind === "storyboard"
    ? mergeStoryboardPolish(base as CinematicStoryboard, raw)
    : mergeFourShotPhotoPolish(base as FourShotPhotoOutput, raw);

  return merged ? withProviderPackPolishMetadata(merged, metadata) : null;
}

function buildProviderPackPolishPrompt(packKind: ProviderPackKind, base: Record<string, unknown>) {
  const isStoryboard = packKind === "storyboard";
  const immutable = isStoryboard
    ? [
        "Do not change summary.storyMode, summary.storyModeLabel, subjectA, subjectB, subjectPair, habitat, season, timeOfDay, totalShots, image engines, motion engine, shot count, shot order, shot ids, shot numbers, roles, durations, or time ranges.",
        "Do not change the pencil storyboard format or 9:16 aspect ratio.",
        "Only improve each shot summary, imagePrompts, motionPrompts.kling, and notes.",
      ]
    : [
        "Do not change project, shotMode, input, predator, prey, environment, lighting, season, aspectRatio, shot count, shot order, shot ids, slugs, names, or purposes.",
        "Do not change the master environment identity or the 4-shot same-environment structure.",
        "Only improve masterEnvironment prompt wording, shot prompt wording, and continuity checklists.",
      ];

  return [
    "You are a WSTV provider-polish layer that improves already-generated wildlife prompt packs.",
    "The local/base generator has already built the pack. Preserve it as the source of truth.",
    "Return exactly one JSON object and nothing else. No markdown fences, no explanations.",
    "You may improve wording, cinematic realism, camera/lens language, continuity safety, wildlife behavior, and platform formatting.",
    "Never change animals, environment, aspect ratio, shot count, story mode, or Build setup.",
    ...immutable,
    "Keep all safety rules non-graphic: no blood, gore, visible injury, people, vehicles, text, or watermark.",
    "If a field is already strong, you may repeat it unchanged. Do not remove important lock/safety language.",
    "Return the same top-level editable shape you received for the pack kind.",
    "",
    "Complete generated base pack JSON:",
    JSON.stringify(base),
  ].join("\n");
}

async function callProvider(provider: ProviderPackProvider, prompt: string) {
  if (provider === "groq") {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return null;
    const { res, data } = await callGroqText(apiKey, prompt, { maxCompletionTokens: 8000 });
    if (!res.ok) return null;
    return extractGroqText(data);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const stable = getGeminiModelStable();
  let { res, data } = await callGeminiText(stable, apiKey, prompt);

  if (!res.ok) {
    const msg = JSON.stringify(data ?? {}).toLowerCase();
    const looksLikeModelIssue = msg.includes("model") && msg.includes("support");
    if (looksLikeModelIssue) {
      const fallbackModel = getGeminiModelFallback();
      ({ res, data } = await callGeminiText(fallbackModel, apiKey, prompt));
    }
  }

  if (!res.ok) return null;
  return extractGeminiText(data);
}

async function tryProviderPolish(
  provider: ProviderPackProvider,
  packKind: ProviderPackKind,
  base: Record<string, unknown>,
  fallbackUsed: boolean
) {
  const text = await callProvider(provider, buildProviderPackPolishPrompt(packKind, base));
  if (!text) return null;

  try {
    const parsed = parseProviderJsonObject(text, `${provider} provider pack polish`);
    return mergeProviderPolish(packKind, base, parsed, {
      providerUsed: provider,
      polished: true,
      fallbackUsed,
    });
  } catch {
    return null;
  }
}

export async function handleProviderPackPolishRequest(body: unknown) {
  const parsed = providerPackPolishRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid provider pack polish request" }, { status: 400 });
  }

  const { provider, autoFallback, packKind, base } = parsed.data;
  if (provider === "none") return jsonLocalPack(base);

  try {
    if (provider === "gemini") {
      const geminiPolish = await tryProviderPolish("gemini", packKind, base, false);
      if (geminiPolish) return jsonPack(geminiPolish);

      if (autoFallback) {
        const groqPolish = await tryProviderPolish("groq", packKind, base, true);
        if (groqPolish) return jsonPack(groqPolish);
      }

      return jsonLocalPack(base);
    }

    if (provider === "groq") {
      const groqPolish = await tryProviderPolish("groq", packKind, base, false);
      return jsonPack(groqPolish ?? withProviderPackPolishMetadata(base, LOCAL_PROVIDER_PACK_POLISH_METADATA));
    }

    return jsonLocalPack(base);
  } catch {
    return jsonLocalPack(base);
  }
}
