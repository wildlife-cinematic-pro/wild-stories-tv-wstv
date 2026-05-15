import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/api/enhance/provider-calls", () => ({
  callGeminiText: vi.fn(),
  callGroqText: vi.fn(),
  extractGeminiText: vi.fn(),
  extractGroqText: vi.fn(),
  getGeminiModelFallback: vi.fn(() => "gemini-flash-latest"),
  getGeminiModelStable: vi.fn(() => "gemini-2.5-flash"),
}));

import { handleProviderPackPolishRequest } from "@/app/api/enhance/provider-pack-polish";
import {
  callGeminiText,
  callGroqText,
  extractGeminiText,
  extractGroqText,
} from "@/app/api/enhance/provider-calls";
import { buildFourShotPhotoPrompts } from "@/lib/four-shot-photo-system";
import { buildCinematicStoryboard } from "@/lib/storyboard-shot-builder";
import { StoryMode } from "@/types";

function expectStoryboardSchemaPreserved(output: ReturnType<typeof buildCinematicStoryboard>, base: ReturnType<typeof buildCinematicStoryboard>) {
  expect(output.summary).toEqual(base.summary);
  expect(output.shots).toHaveLength(base.shots.length);
  expect(output.shots).toHaveLength(4);
  expect(output.copy.allGptImage2Long).toBeTruthy();
  expect(output.copy.allGptImage2Short).toBeTruthy();
  expect(output.copy.allNanoBanana2Long).toBeTruthy();
  expect(output.copy.allNanoBanana2Short).toBeTruthy();
  expect(output.copy.allKling).toContain("Kling");
  expect(output.copy.allStoryboard).toContain("GPT Image 2 — Long Version");
  expect(output.copy.allStoryboard).toContain("GPT Image 2 — Short Version");
  expect(output.copy.allStoryboard).toContain("Nano Banana 2 — Long Version");
  expect(output.copy.allStoryboard).toContain("Nano Banana 2 — Short Version");
  expect(output.copy.allStoryboard).toContain("Kling Motion");

  for (const [index, shot] of output.shots.entries()) {
    expect(shot.id).toBe(base.shots[index].id);
    expect(shot.shotNumber).toBe(base.shots[index].shotNumber);
    expect(shot.role).toBe(base.shots[index].role);
    expect(shot.durationSeconds).toBe(5);
    expect(shot.timeRangeLabel).toBe(base.shots[index].timeRangeLabel);
    expect(Object.keys(shot.imagePrompts).sort()).toEqual([
      "gptImage2Long",
      "gptImage2Short",
      "nanoBanana2Long",
      "nanoBanana2Short",
    ]);
    expect(Object.keys(shot.motionPrompts)).toEqual(["kling"]);
    expect(shot.imagePrompts.gptImage2Long).toContain("Shot " + shot.shotNumber);
    expect(shot.imagePrompts.gptImage2Short).toContain("Shot " + shot.shotNumber);
    expect(shot.imagePrompts.nanoBanana2Long).toContain("Shot " + shot.shotNumber);
    expect(shot.imagePrompts.nanoBanana2Short).toContain("Shot " + shot.shotNumber);
    expect(shot.motionPrompts.kling).toContain("Kling");
    expect(shot.notes.length).toBeGreaterThan(0);
  }
}

function expectFourShotSchemaPreserved(output: ReturnType<typeof buildFourShotPhotoPrompts>, base: ReturnType<typeof buildFourShotPhotoPrompts>) {
  expect(output.project).toBe(base.project);
  expect(output.shotMode).toBe(base.shotMode);
  expect(output.input).toEqual(base.input);
  expect(output.masterEnvironment.nanoBanana2Prompt).toBeTruthy();
  expect(output.masterEnvironment.gptImage2Prompt).toBeTruthy();
  expect(output.masterEnvironment.continuityChecklist.length).toBeGreaterThan(0);
  expect(output.shots).toHaveLength(base.shots.length);
  expect(output.shots).toHaveLength(4);

  for (const [index, shot] of output.shots.entries()) {
    expect(shot.id).toBe(base.shots[index].id);
    expect(shot.slug).toBe(base.shots[index].slug);
    expect(shot.name).toBe(base.shots[index].name);
    expect(shot.purpose).toBe(base.shots[index].purpose);
    expect(shot.nanoBanana2Prompt).toBeTruthy();
    expect(shot.gptImage2Prompt).toBeTruthy();
    expect(shot.continuityChecklist.length).toBeGreaterThan(0);
  }
}

describe("provider pack polish route", () => {
  const originalGeminiKey = process.env.GEMINI_API_KEY;
  const originalGroqKey = process.env.GROQ_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.GEMINI_API_KEY;
    delete process.env.GROQ_API_KEY;
  });

  afterEach(() => {
    if (originalGeminiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalGeminiKey;
    if (originalGroqKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = originalGroqKey;
  });

  it("returns the local storyboard pack when Gemini is unavailable", async () => {
    const base = buildCinematicStoryboard({
      storyMode: StoryMode.PREDATOR_VS_PREY,
      subjectA: "Wolf Pack",
      subjectB: "Bull Elk",
    });

    const response = await handleProviderPackPolishRequest({
      packPolish: true,
      packKind: "storyboard",
      provider: "gemini",
      autoFallback: false,
      base,
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      output: {
        providerUsed: "local",
        polished: false,
        fallbackUsed: false,
        summary: { totalShots: 4 },
      },
    });
    expect(callGeminiText).not.toHaveBeenCalled();
  });

  it("returns local four-shot output only when no API key is configured", async () => {
    const base = buildFourShotPhotoPrompts();

    const response = await handleProviderPackPolishRequest({
      packPolish: true,
      packKind: "fourShotPhoto",
      provider: "gemini",
      autoFallback: true,
      base,
    });

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.output).toMatchObject({
      providerUsed: "local",
      polished: false,
      fallbackUsed: false,
    });
    expectFourShotSchemaPreserved(payload.output, base);
    expect(callGeminiText).not.toHaveBeenCalled();
    expect(callGroqText).not.toHaveBeenCalled();
  });

  it("returns Gemini-polished four-shot photo output without changing setup metadata", async () => {
    process.env.GEMINI_API_KEY = "test-gemini-key";
    const base = buildFourShotPhotoPrompts();
    const polished = {
      masterEnvironment: {
        nanoBanana2Prompt: base.masterEnvironment.nanoBanana2Prompt + " Extra clean lens realism.",
        gptImage2Prompt: base.masterEnvironment.gptImage2Prompt,
        continuityChecklist: base.masterEnvironment.continuityChecklist,
      },
      shots: base.shots.map((shot) => ({
        nanoBanana2Prompt: shot.nanoBanana2Prompt + " More believable wildlife posture.",
        gptImage2Prompt: shot.gptImage2Prompt,
        continuityChecklist: shot.continuityChecklist,
      })),
    };

    vi.mocked(callGeminiText).mockResolvedValue({
      res: new Response("{}", { status: 200 }),
      data: {},
    });
    vi.mocked(extractGeminiText).mockReturnValue(JSON.stringify(polished));

    const response = await handleProviderPackPolishRequest({
      packPolish: true,
      packKind: "fourShotPhoto",
      provider: "gemini",
      autoFallback: false,
      base,
    });

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.output).toMatchObject({
      providerUsed: "gemini",
      polished: true,
      fallbackUsed: false,
      input: {
        predator: base.input.predator,
        prey: base.input.prey,
        environment: base.input.environment,
        aspectRatio: base.input.aspectRatio,
      },
    });
    expect(payload.output.masterEnvironment.nanoBanana2Prompt).toContain("Extra clean lens realism");
    expect(payload.output.shots).toHaveLength(4);
    expectFourShotSchemaPreserved(payload.output, base);
  });

  it("returns Gemini-polished storyboard output while preserving required scene schema", async () => {
    process.env.GEMINI_API_KEY = "test-gemini-key";
    const base = buildCinematicStoryboard({
      storyMode: StoryMode.PREDATOR_VS_PREY,
      subjectA: "Wolf Pack",
      subjectB: "Bull Elk",
    });
    const polished = {
      shots: base.shots.map((shot, index) => ({
        summary: index === 1 ? shot.summary + " with sharper lens-safe blocking." : shot.summary,
        imagePrompts: shot.imagePrompts,
        motionPrompts: shot.motionPrompts,
        notes: shot.notes,
      })),
    };

    vi.mocked(callGeminiText).mockResolvedValue({
      res: new Response("{}", { status: 200 }),
      data: {},
    });
    vi.mocked(extractGeminiText).mockReturnValue(JSON.stringify(polished));

    const response = await handleProviderPackPolishRequest({
      packPolish: true,
      packKind: "storyboard",
      provider: "gemini",
      autoFallback: false,
      base,
    });

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.output).toMatchObject({
      providerUsed: "gemini",
      polished: true,
      fallbackUsed: false,
    });
    expectStoryboardSchemaPreserved(payload.output, base);
  });

  it("keeps local storyboard active when Gemini returns malformed JSON", async () => {
    process.env.GEMINI_API_KEY = "test-gemini-key";
    const base = buildCinematicStoryboard({
      storyMode: StoryMode.PREDATOR_VS_PREY,
      subjectA: "Wolf Pack",
      subjectB: "Bull Elk",
    });

    vi.mocked(callGeminiText).mockResolvedValue({
      res: new Response("{}", { status: 200 }),
      data: {},
    });
    vi.mocked(extractGeminiText).mockReturnValue("not JSON at all");

    const response = await handleProviderPackPolishRequest({
      packPolish: true,
      packKind: "storyboard",
      provider: "gemini",
      autoFallback: false,
      base,
    });

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.output).toMatchObject({
      providerUsed: "local",
      polished: false,
      fallbackUsed: false,
    });
    expect(payload.output.shots).toEqual(base.shots);
    expectStoryboardSchemaPreserved(payload.output, base);
  });

  it("keeps local four-shot output active when Gemini returns a no-op pack", async () => {
    process.env.GEMINI_API_KEY = "test-gemini-key";
    const base = buildFourShotPhotoPrompts();
    const noOp = {
      masterEnvironment: base.masterEnvironment,
      shots: base.shots,
    };

    vi.mocked(callGeminiText).mockResolvedValue({
      res: new Response("{}", { status: 200 }),
      data: {},
    });
    vi.mocked(extractGeminiText).mockReturnValue(JSON.stringify(noOp));

    const response = await handleProviderPackPolishRequest({
      packPolish: true,
      packKind: "fourShotPhoto",
      provider: "gemini",
      autoFallback: false,
      base,
    });

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.output).toMatchObject({
      providerUsed: "local",
      polished: false,
      fallbackUsed: false,
    });
    expect(payload.output.shots).toEqual(base.shots);
    expectFourShotSchemaPreserved(payload.output, base);
  });

  it("tries Groq after Gemini fails when fallback is enabled", async () => {
    process.env.GEMINI_API_KEY = "test-gemini-key";
    process.env.GROQ_API_KEY = "test-groq-key";
    const base = buildCinematicStoryboard({
      storyMode: StoryMode.PREDATOR_VS_PREY,
      subjectA: "Wolf Pack",
      subjectB: "Bull Elk",
    });
    const polished = {
      shots: base.shots.map((shot, index) => ({
        summary: index === 0 ? shot.summary + " with cleaner continuity." : shot.summary,
        imagePrompts: shot.imagePrompts,
        motionPrompts: shot.motionPrompts,
        notes: shot.notes,
      })),
    };

    vi.mocked(callGeminiText).mockResolvedValue({
      res: new Response("{}", { status: 200 }),
      data: {},
    });
    vi.mocked(extractGeminiText).mockReturnValue("not json");
    vi.mocked(callGroqText).mockResolvedValue({
      res: new Response("{}", { status: 200 }),
      data: {},
    });
    vi.mocked(extractGroqText).mockReturnValue(JSON.stringify(polished));

    const response = await handleProviderPackPolishRequest({
      packPolish: true,
      packKind: "storyboard",
      provider: "gemini",
      autoFallback: true,
      base,
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      output: {
        providerUsed: "groq",
        polished: true,
        fallbackUsed: true,
        summary: { totalShots: 4 },
      },
    });
    expect(callGeminiText).toHaveBeenCalledTimes(1);
    expect(callGroqText).toHaveBeenCalledTimes(1);
  });

  it("rejects provider output with missing storyboard scenes and keeps local active", async () => {
    process.env.GEMINI_API_KEY = "test-gemini-key";
    const base = buildCinematicStoryboard({
      storyMode: StoryMode.PREDATOR_VS_PREY,
      subjectA: "Wolf Pack",
      subjectB: "Bull Elk",
    });

    vi.mocked(callGeminiText).mockResolvedValue({
      res: new Response("{}", { status: 200 }),
      data: {},
    });
    vi.mocked(extractGeminiText).mockReturnValue(JSON.stringify({ shots: base.shots.slice(0, 3) }));

    const response = await handleProviderPackPolishRequest({
      packPolish: true,
      packKind: "storyboard",
      provider: "gemini",
      autoFallback: false,
      base,
    });

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.output).toMatchObject({
      providerUsed: "local",
      polished: false,
      fallbackUsed: false,
    });
    expect(payload.output.shots).toHaveLength(4);
    expectStoryboardSchemaPreserved(payload.output, base);
  });
});
