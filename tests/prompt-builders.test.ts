import { describe, it, expect } from "vitest";
import {
  buildImagePrompt,
  buildRunwayShots,
  buildKlingShots,
  buildKlingNative15s,
  buildKlingSixShot,
  buildCapCutPlan,
  buildClipChaining,
} from "@/lib/prompt-builders";

describe("buildImagePrompt – engine-aware MJ params", () => {
  const args = {
    predator: "Lion",
    prey: "Zebra",
    env: "African savanna",
    arc: "Chase and takedown",
    lighting: "golden hour sunlight",
    cameraGear: "Canon EOS R5, 200mm wildlife lens",
    texture: "ultra detailed fur, dust on coat",
    depthMode: "Balanced Depth" as const,
    weather: "Golden Hour" as const,
    emotionalTone: "Raw Tension" as const,
    animalVibe: "BBC Earth Documentary" as const,
    sceneDesc: "A tense standoff before the chase begins, dust in backlight.",
  };

  const hasMJParams = (p: string) =>
    /--ar\s+9:16/i.test(p) || /--style\s+raw/i.test(p) || /--v\s+6\.1/i.test(p);

  it("does NOT append MJ params when target is NB2 (default)", () => {
    const p = buildImagePrompt(
      args.predator,
      args.prey,
      args.env,
      args.arc,
      args.lighting,
      args.cameraGear,
      args.texture,
      args.depthMode,
      args.weather,
      args.emotionalTone,
      args.animalVibe,
      args.sceneDesc
    );
    expect(hasMJParams(p)).toBe(false);
  });

  it("does NOT append MJ params when target is RUNWAY", () => {
    const p = buildImagePrompt(
      args.predator,
      args.prey,
      args.env,
      args.arc,
      args.lighting,
      args.cameraGear,
      args.texture,
      args.depthMode,
      args.weather,
      args.emotionalTone,
      args.animalVibe,
      args.sceneDesc,
      undefined,
      "RUNWAY"
    );
    expect(hasMJParams(p)).toBe(false);
  });

  it("does NOT append MJ params when target is NANO_BANANA_2", () => {
    const p = buildImagePrompt(
      args.predator,
      args.prey,
      args.env,
      args.arc,
      args.lighting,
      args.cameraGear,
      args.texture,
      args.depthMode,
      args.weather,
      args.emotionalTone,
      args.animalVibe,
      args.sceneDesc,
      undefined,
      "NANO_BANANA_2"
    );
    expect(hasMJParams(p)).toBe(false);
  });

  it("appends MJ params ONLY when target is MJ", () => {
    const p = buildImagePrompt(
      args.predator,
      args.prey,
      args.env,
      args.arc,
      args.lighting,
      args.cameraGear,
      args.texture,
      args.depthMode,
      args.weather,
      args.emotionalTone,
      args.animalVibe,
      args.sceneDesc,
      undefined,
      "MJ"
    );
    expect(/--ar\s+9:16/i.test(p)).toBe(true);
    expect(/--style\s+raw/i.test(p)).toBe(true);
    expect(/--v\s+6\.1/i.test(p)).toBe(true);
  });

  it("does NOT duplicate MJ params if prompt already includes them", () => {
    const p = buildImagePrompt(
      args.predator,
      args.prey,
      args.env,
      args.arc,
      args.lighting,
      args.cameraGear,
      args.texture,
      args.depthMode,
      args.weather,
      args.emotionalTone,
      args.animalVibe,
      `${args.sceneDesc} --ar 9:16 --style raw`,
      undefined,
      "MJ"
    );
    expect((p.match(/--ar\s+9:16/gi) ?? []).length).toBe(1);
    expect((p.match(/--style\s+raw/gi) ?? []).length).toBe(1);
  });
});

describe("Step 6 — One-action hard gate (Runway + Kling)", () => {
  const base = {
    predator: "Lion",
    prey: "Zebra",
    env: "African savanna",
    arc: "Chase and takedown" as const,
    weather: "Golden Hour" as const,
    emotionalTone: "Raw Tension" as const,
    animalVibe: "BBC Earth Documentary" as const,
    sceneDesc: "A tense standoff before the chase begins, dust in backlight.",
  };

  const quality = {
    realismMode: "Reference Locked",
    motionOnlyI2V: true,
    referenceLock: true,
    singleActionRule: true,
    microMotion: true,
    heroVeo: false,
  } as const;

  const banned = (s: string) => {
    const t = s.toLowerCase();
    expect(t).not.toMatch(/\bbite\b/);
    expect(t).not.toMatch(/\btakedown\b/);
    expect(t).not.toMatch(/\broll\b/);
  };

  it("Runway Shot2/Shot3: no bite/takedown/roll when singleActionRule ON", () => {
    const shots = buildRunwayShots(
      base.predator,
      base.prey,
      base.env,
      base.arc,
      base.weather,
      "Gen-4.5",
      base.emotionalTone,
      base.animalVibe,
      base.sceneDesc,
      quality
    );
    banned(shots.shot2);
    banned(shots.shot3);
  });

  it("Kling Shot2/Shot3: no bite/takedown/roll when singleActionRule ON", () => {
    const shots = buildKlingShots(
      base.predator,
      base.prey,
      base.env,
      base.arc,
      base.weather,
      "Kling 3.0 Pro",
      base.emotionalTone,
      base.animalVibe,
      base.sceneDesc,
      quality
    );
    banned(shots.shot2);
    banned(shots.shot3);
  });

  it("KlingNative15s: Shot2 should not include bite/takedown/roll when singleActionRule ON", () => {
    const out = buildKlingNative15s(
      base.predator,
      base.prey,
      base.env,
      base.arc,
      base.weather,
      "Kling 3.0 Pro",
      base.emotionalTone,
      base.animalVibe,
      base.sceneDesc,
      quality
    );
    // Native prompt text मा पनि banned शब्द आउनु हुँदैन
    banned(out);
  });
});
describe("Step 7 — Opening readability and tension clarity", () => {
  const base = {
    predator: "Wolf",
    prey: "Elk",
    env: "Rocky Mountain meadow",
    arc: "Pack hunting strategy" as const,
    weather: "Golden Hour" as const,
    emotionalTone: "Raw Tension" as const,
    animalVibe: "BBC Earth Documentary" as const,
    sceneDesc: "Both animals are visible at the first moment, tension is immediate, no empty setup.",
  };

  const quality = {
    realismMode: "Reference Locked",
    motionOnlyI2V: true,
    referenceLock: true,
    singleActionRule: true,
    microMotion: true,
    heroVeo: false,
  } as const;

  it("Runway Shot1 includes opening readability language", () => {
    const shots = buildRunwayShots(
      base.predator,
      base.prey,
      base.env,
      base.arc,
      base.weather,
      "Gen-4.5",
      base.emotionalTone,
      base.animalVibe,
      base.sceneDesc,
      quality
    );
    expect(shots.shot1).toContain("fully readable from frame one");
    expect(shots.shot1).toContain("immediate visible tension");
  });

  it("Kling Shot1 includes opening readability language", () => {
    const shots = buildKlingShots(
      base.predator,
      base.prey,
      base.env,
      base.arc,
      base.weather,
      "Kling 3.0 Pro",
      base.emotionalTone,
      base.animalVibe,
      base.sceneDesc,
      quality
    );
    expect(shots.shot1).toContain("fully readable from frame one");
    expect(shots.shot1).toContain("immediate visible tension");
  });

  it("KlingNative15s includes opening-tension wording and first-frame readability", () => {
    const out = buildKlingNative15s(
      base.predator,
      base.prey,
      base.env,
      base.arc,
      base.weather,
      "Kling 3.0 Pro",
      base.emotionalTone,
      base.animalVibe,
      base.sceneDesc,
      quality
    );
    expect(out).toContain("OPENING TENSION");
    expect(out).toContain("fully readable from frame one");
  });
});
describe("Step 7B — Kling 6-shot opening readability", () => {
  const base = {
    predator: "Wolf",
    prey: "Elk",
    env: "Rocky Mountain meadow",
    arc: "Pack hunting strategy" as const,
    weather: "Golden Hour" as const,
    emotionalTone: "Raw Tension" as const,
    animalVibe: "BBC Earth Documentary" as const,
    sceneDesc: "Both animals are visible early, tension is immediate, no empty setup.",
  };

  const quality = {
    realismMode: "Reference Locked",
    motionOnlyI2V: true,
    referenceLock: true,
    singleActionRule: true,
    microMotion: true,
    heroVeo: false,
  } as const;

  it("KlingSixShot starts with readable opening tension instead of a weak macro-only opening", () => {
    const out = buildKlingSixShot(
      base.predator,
      base.prey,
      base.env,
      base.arc,
      base.weather,
      "Kling 3.0 Pro",
      base.emotionalTone,
      base.animalVibe,
      base.sceneDesc,
      quality
    );

    expect(out).toContain("OPENING TENSION");
    expect(out).toContain("both fully visible");
    expect(out).not.toContain("MACRO CLOSE-UP");
  });
});
describe("Step 7C — supporting prompt helpers keep readability language", () => {
  it("CapCut plan emphasizes strong opening readability", () => {
    const out = buildCapCutPlan("Wolf", "Pack hunting strategy", "Golden Hour");
    expect(out).toContain("strongest readable opening frame");
    expect(out).toContain("both subjects visible");
    expect(out).toContain("immediate predator pressure");
  });

  it("Clip chaining emphasizes readable first frame and clear spacing", () => {
    const out = buildClipChaining("Wolf", "MEDIUM");
    expect(out).toContain("strong first-frame readability");
    expect(out).toContain("clear opening tension");
    expect(out).toContain("spacing");
  });
});