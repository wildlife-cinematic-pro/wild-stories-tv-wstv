import { describe, expect, it } from "vitest";

import { buildFacebookCaptionVariants } from "@/lib/facebook-caption-variants";
import { buildFacebookHookVariants } from "@/lib/facebook-hook-variants";
import { analyzeStoryModePackage } from "@/lib/story-mode-qa";
import { StoryMode, type StructuredPrompt } from "@/types";

import {
  buildGoldenPackage,
  GOLDEN_BUILD_INPUTS,
} from "./fixtures/golden-build-inputs";

const OLD_MIXED_IMAGE_WORDING = [
  /Runway Gen-4 Image \/ Gemini-enhanced reference/i,
  /Gemini-enhanced prompt\s*→\s*Runway Gen-4 Image/i,
  /production-ready Runway Gen-4 Image/i,
];

const IMAGE_ENGINE_POLLUTION = /\b(Kling|Seedance)\b/i;
const KLING_IMAGE_POLLUTION = /\b(Nano Banana|GPT Image|Runway Gen-4 Image)\b/i;
const SEEDANCE_ENGINE_POLLUTION = /\b(Nano Banana|GPT Image|Runway Gen-4 Image|Kling)\b/i;
const FACEBOOK_ENGAGEMENT_BAIT = /\b(like if|comment yes|comment no|share if|share this|tag a friend|react to vote)\b/i;
const FALSE_REAL_FOOTAGE_CLAIM = /\breal footage\b/i;
const GRAPHIC_OUTCOME = /\b(visible wounds?|graphic injury|torn flesh|exposed injury|broken bones?|carcass gore|bloodbath)\b/i;

function lower(value: string) {
  return value.toLowerCase();
}

function expectCleanImagePrompt(prompt: string) {
  for (const pattern of OLD_MIXED_IMAGE_WORDING) {
    expect(prompt).not.toMatch(pattern);
  }
  expect(prompt).not.toMatch(IMAGE_ENGINE_POLLUTION);
  expect(prompt).not.toMatch(/\b9:16\b|vertical aspect|vertical frame/i);
  expect(prompt).toMatch(/photorealistic|raw wildlife documentary|documentary/i);
  expect(lower(prompt)).toContain("wildlife");
  expect(lower(prompt)).toContain("no blood");
  expect(lower(prompt)).toContain("no gore");
}

function stripSafetyNegations(text: string) {
  return text.replace(/\b(no|without|avoid|avoids|forbid|forbids|forbidden)\s+[^.\n]*(gore|blood|visible injur(?:y|ies)|visible wounds?|wounds?|injur(?:y|ies)|graphic injury|torn flesh|exposed injury|broken bones?|carcass gore|death close-up)[^.\n]*/gi, "");
}

function expectImagePlanPrompt(prompt: string) {
  for (const pattern of OLD_MIXED_IMAGE_WORDING) {
    expect(prompt).not.toMatch(pattern);
  }
  expect(prompt).not.toMatch(IMAGE_ENGINE_POLLUTION);
  expect(prompt).toMatch(/image|visual|frame|documentary|continuity/i);
  expect(stripSafetyNegations(prompt)).not.toMatch(GRAPHIC_OUTCOME);
}

function collectPrompts(prompts: Array<StructuredPrompt | undefined>): StructuredPrompt[] {
  return prompts.filter((prompt): prompt is StructuredPrompt => Boolean(prompt));
}

function expectMotionFocused(prompt: string) {
  expect(prompt).toMatch(/motion|move|camera|tracking|pull|push|hold|pan|image-to-video|first-frame|continuity|pressure|traction|escape|breakaway|approaches|tenses|turn|swipe|strike|standoff|movement/i);
}

function expectNoUnsafeFacebookCopy(text: string) {
  expect(text).not.toMatch(FACEBOOK_ENGAGEMENT_BAIT);
  expect(text).not.toMatch(FALSE_REAL_FOOTAGE_CLAIM);
  expect(stripSafetyNegations(text)).not.toMatch(GRAPHIC_OUTCOME);
}

describe("golden prompt regression guard", () => {
  it.each(GOLDEN_BUILD_INPUTS)("$name builds a complete WSTV package", (input) => {
    const pkg = buildGoldenPackage(input);
    const qa = analyzeStoryModePackage(pkg);

    expect(pkg.imagePrompt).toBeTruthy();
    expect(pkg.shotImagePlan?.length).toBeGreaterThan(0);
    expect(pkg.structuredPrompts?.workflowShots?.length).toBe(4);
    expect(pkg.caption).toBeTruthy();
    expect(pkg.hashtags).toBeTruthy();
    expect(qa.status).not.toBe("unsafe");
    expect(qa.flags.join(" ")).not.toMatch(/Unsafe graphic/i);
  });

  it.each(GOLDEN_BUILD_INPUTS)("$name keeps image prompts in Nano Banana / GPT Image boundaries", (input) => {
    const pkg = buildGoldenPackage(input);
    expectCleanImagePrompt(pkg.imagePrompt);
    expectCleanImagePrompt(pkg.structuredPrompts?.imagePrompt?.pasteReady ?? "");

    if (pkg.gptImage2Prompt) {
      expectCleanImagePrompt(pkg.gptImage2Prompt);
    }
    if (pkg.structuredPrompts?.gptImage2Prompt?.pasteReady) {
      expectCleanImagePrompt(pkg.structuredPrompts.gptImage2Prompt.pasteReady);
    }
  });

  it.each(GOLDEN_BUILD_INPUTS)("$name keeps shot image plans image-focused", (input) => {
    const pkg = buildGoldenPackage(input);

    expect(pkg.shotImagePlan).toBeTruthy();
    expect(pkg.shotImagePlan?.[0]?.prompt).not.toMatch(/\b9:16\b|vertical aspect|vertical frame/i);
    for (const shot of pkg.shotImagePlan ?? []) {
      expectImagePlanPrompt(shot.prompt);
      expect(shot.prompt).not.toMatch(/@lead_animal|@opposite_animal|@environment/i);
    }
  });

  it.each(GOLDEN_BUILD_INPUTS)("$name keeps Runway prompts motion-focused", (input) => {
    const pkg = buildGoldenPackage(input);
    const runwayPrompts = collectPrompts(pkg.structuredPrompts?.runwayShots ?? []);

    expect(runwayPrompts).toHaveLength(4);
    for (const prompt of runwayPrompts) {
      expect(prompt.metadata?.engine).toBe("runway");
      expectMotionFocused(prompt.pasteReady);
      expect(prompt.pasteReady).not.toMatch(/\bNano Banana 2 primary\b|\bGPT Image 2 backup\b/i);
    }
  });

  it.each(GOLDEN_BUILD_INPUTS)("$name keeps Kling prompts within WSTV limits and video boundaries", (input) => {
    const pkg = buildGoldenPackage(input);
    const klingPrompts = collectPrompts([
      ...(pkg.structuredPrompts?.klingShots ?? []),
      pkg.structuredPrompts?.klingNative15s,
      pkg.structuredPrompts?.klingFramesPrompt,
      ...(pkg.structuredPrompts?.klingMultishotShots ?? []),
      pkg.structuredPrompts?.klingSixShot,
    ]);

    expect(klingPrompts.length).toBeGreaterThanOrEqual(4);
    expect(pkg.structuredPrompts?.klingNative15s?.pasteReady.length).toBeLessThanOrEqual(2500);
    expect(pkg.structuredPrompts?.klingFramesPrompt?.pasteReady.length).toBeLessThanOrEqual(2500);

    for (const prompt of klingPrompts) {
      expect(prompt.metadata?.engine).toBe("kling");
      expectMotionFocused(prompt.pasteReady);
      expect(prompt.pasteReady).not.toMatch(KLING_IMAGE_POLLUTION);
    }
  });

  it.each(GOLDEN_BUILD_INPUTS)("$name keeps Seedance prompts video-focused", (input) => {
    const pkg = buildGoldenPackage(input);
    const seedancePrompts = collectPrompts([
      ...(pkg.structuredPrompts?.seedanceShots ?? []),
      pkg.structuredPrompts?.seedanceMultiShot,
    ]);

    expect(seedancePrompts.length).toBeGreaterThanOrEqual(4);
    for (const prompt of seedancePrompts) {
      expect(prompt.metadata?.engine).toBe("seedance");
      expectMotionFocused(prompt.pasteReady);
      expect(prompt.pasteReady).not.toMatch(SEEDANCE_ENGINE_POLLUTION);
    }
  });

  it.each(GOLDEN_BUILD_INPUTS)("$name keeps Facebook hooks, captions, and hashtags safe", (input) => {
    const pkg = buildGoldenPackage(input);
    const captionVariants = buildFacebookCaptionVariants(pkg);
    const hookVariants = buildFacebookHookVariants(pkg);

    expectNoUnsafeFacebookCopy(`${pkg.hook} ${pkg.caption} ${pkg.hashtags}`);
    expect(pkg.hashtags.split(/\s+/).filter(Boolean)).toHaveLength(5);

    for (const variant of captionVariants) {
      expect(variant.caption.length).toBeLessThanOrEqual(150);
      expect(variant.hashtags).toHaveLength(5);
      expect(variant.hashtags.every((tag) => tag.startsWith("#"))).toBe(true);
      expectNoUnsafeFacebookCopy(`${variant.caption} ${variant.hashtags.join(" ")}`);
    }

    for (const variant of hookVariants) {
      expect(variant.hook.length).toBeLessThanOrEqual(90);
      expectNoUnsafeFacebookCopy(variant.hook);
    }
  });

  it("covers every story mode with a golden fixture", () => {
    const coveredModes = new Set(GOLDEN_BUILD_INPUTS.map((input) => input.storyMode));
    expect(coveredModes).toEqual(new Set(Object.values(StoryMode)));
  });
});

