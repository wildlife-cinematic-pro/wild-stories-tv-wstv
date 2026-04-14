import { describe, it, expect } from "vitest";
import {
  buildImagePrompt,
  buildRunwayShots,
  buildKlingShots,
  buildSeedanceShots,
  buildKlingNative15s,
  buildKlingSixShot,
  buildCapCutPlan,
  buildClipChaining,
  build10Ideas,
  finalizeGenerationText,
  sanitizeSocialCopyText,
  validateEngineConstraints,
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

describe("Step 6 — prompt sanitization split", () => {
  it("generation cleanup keeps realistic behavioral wording intact", () => {
    const line = finalizeGenerationText("The wolf bite triggers a takedown roll.");
    expect(line).toContain("bite");
    expect(line).toContain("takedown");
    expect(line).toContain("roll");
  });

  it("social-copy cleanup softens risky wording separately", () => {
    const safe = sanitizeSocialCopyText("The wolf bite triggers a takedown roll.");
    expect(safe).toContain("grip");
    expect(safe).toContain("capture");
    expect(safe).toContain("tumble");
    expect(safe).not.toContain("bite");
    expect(safe).not.toContain("takedown");
  });

  it("generation cleanup does not inject social-safe replacements", () => {
    const line = finalizeGenerationText("The wolf bite triggers a takedown roll.");
    expect(line).not.toContain("grip");
    expect(line).not.toContain("capture");
    expect(line).not.toContain("tumble");
  });

  it("idea generation keeps social-safe wording", () => {
    const ideas = build10Ideas("Wolf", ["Elk"], {
      prey: ["Elk"],
      environment: "Rocky Mountain Meadow",
      lighting: "Golden hour",
      cameraGear: "Nikon Z9",
      texture: "Detailed fur",
      defaultArc: "Chase and takedown",
      driftRisk: "MEDIUM",
    });

    expect(ideas.some((idea) => /takedown/i.test(idea))).toBe(false);
  });
});

describe("Seedance prompt builder", () => {
  const quality = {
    realismMode: "Reference Locked",
    motionOnlyI2V: true,
    referenceLock: true,
    singleActionRule: true,
    microMotion: true,
    heroVeo: false,
  } as const;

  it("keeps Seedance guidance visible in the prompt pack", () => {
    const shots = buildSeedanceShots(
      "Mountain Lion",
      "White-tailed Deer",
      "Rocky Mountain meadow",
      "Ambush attack",
      "Golden Hour",
      "Raw Tension",
      "BBC Earth Documentary",
      "A tense opening in tall grass.",
      quality
    );

    expect(shots.shot1).toContain("Seedance 2.0 guidance");
    expect(shots.shot1).toContain("negative prompts");
    expect(shots.shot2).toContain("═══ PASTE-READY SEEDANCE PROMPT");
    expect(shots.shot4).toContain("Suggested duration: 5 seconds.");
    expect(shots.workflowGuide).toContain("subject movement + background movement + camera movement");
    expect(shots.workflowGuide).toContain("4 separate video shots");
    expect(shots.workflowGuide).toContain("Cut to");
  });

  it("builds a combined multi-shot prompt with explicit Cut to transitions", () => {
    const shots = buildSeedanceShots(
      "Wolf",
      "Elk",
      "Forest clearing",
      "Pack hunting strategy",
      "Overcast",
      "Raw Tension",
      "National Geographic Wild",
      "Fast pressure through the trees.",
      quality
    );

    expect(shots.multiShotPrompt).toContain("SEEDANCE 4-SHOT CONTINUITY PROMPT");
    expect(shots.multiShotPrompt).toContain("Shot 4: resolved tension");
    expect(shots.multiShotPrompt).toMatch(/\bCut to\b/g);
  });

  it("keeps Seedance 4-shot wording as the clearest primary path", () => {
    const shots = buildSeedanceShots(
      "Mountain Lion",
      "White-tailed Deer",
      "Rocky Mountain meadow",
      "Ambush attack",
      "Golden Hour",
      "Raw Tension",
      "BBC Earth Documentary",
      "Continuity-first wildlife sequence.",
      quality
    );

    expect(shots.workflowGuide).toContain("Default WSTV workflow: generate 4 separate video shots.");
    expect(shots.workflowGuide).not.toContain("3-shot");
  });
});

describe("Clip chaining guidance", () => {
  it("describes a 4-shot chain and labels Kling 6-shot as optional", () => {
    const guide = buildClipChaining("Wolf", "MEDIUM");

    expect(guide).toContain("STEP 4 — Chain Shot 4");
    expect(guide).toContain("STEP 5 — Combine clips");
    expect(guide).toContain("OPTIONAL ALT / FALLBACK");
    expect(guide).toContain("Optional extended format: use Multi-Shot mode (up to 6 shots");
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
  describe("Step 8 — Phase 2 prompt alignment checks", () => {
  const nb2Args = {
    predator: "Wolf Pack",
    prey: "Elk",
    env: "Rocky Mountain meadow",
    arc: "Pack hunting strategy",
    lighting: "golden hour sunlight",
    cameraGear: "Nikon Z9, 400mm wildlife lens, Kodak Portra 400 film emulation",
    texture: "ultra detailed fur, frost on guard hairs, clean snow contact around paws",
    depthMode: "Balanced Depth" as const,
    weather: "Golden Hour" as const,
    emotionalTone: "Raw Tension" as const,
    animalVibe: "BBC Earth Documentary" as const,
    sceneDesc: "Three wolves hold formation while the elk stays alert in a tense early-frame standoff.",
  };

  const klingBase = {
    predator: "Wolf Pack",
    prey: "Elk",
    env: "Rocky Mountain meadow",
    arc: "Pack hunting strategy" as const,
    weather: "Golden Hour" as const,
    emotionalTone: "Raw Tension" as const,
    animalVibe: "BBC Earth Documentary" as const,
    sceneDesc: "Both animals are visible immediately with no empty setup and clean tension from frame one.",
  };

  const quality = {
    realismMode: "Reference Locked",
    motionOnlyI2V: true,
    referenceLock: true,
    singleActionRule: true,
    microMotion: true,
    heroVeo: false,
  } as const;

  function extractKlingPasteBlock(out: string): string {
    const match = out.match(
      /═══ PASTE INTO KLING — .*copy this block only\) ═══\n([\s\S]*?)\n\n─── FULL BREAKDOWN — reference only, do NOT paste into Kling ───/
    );
    return match?.[1]?.trim() ?? "";
  }

  function extractKlingSixShotPasteBlock(out: string): string {
    return (
      out
        .split("═══ PASTE INTO KLING — copy this block only ═══")[1]
        ?.split("─── FULL BREAKDOWN — reference only, do NOT paste into Kling ───")[0]
        ?.trim() ?? ""
    );
  }

  function extractRunwayPasteBlock(out: string): string {
    return (
      out
        .split("═══ PASTE-READY I2V PROMPT (copy this into Runway) ═══")[1]
        ?.split("─── SHOT BREAKDOWN ───")[0]
        ?.trim() ?? ""
    );
  }

  function wordCount(input: string): number {
    return input.split(/\s+/).filter(Boolean).length;
  }

  it("NB2 prompt removes camera gear names, film stock, and negative-style phrases", () => {
    const out = buildImagePrompt(
      nb2Args.predator,
      nb2Args.prey,
      nb2Args.env,
      nb2Args.arc,
      nb2Args.lighting,
      nb2Args.cameraGear,
      nb2Args.texture,
      nb2Args.depthMode,
      nb2Args.weather,
      nb2Args.emotionalTone,
      nb2Args.animalVibe,
      nb2Args.sceneDesc,
      undefined,
      "NANO_BANANA_2"
    );

    expect(out).not.toMatch(/\bNikon\b/i);
    expect(out).not.toMatch(/\bCanon\b/i);
    expect(out).not.toMatch(/\bSony\b/i);
    expect(out).not.toMatch(/\bKodak\b/i);
    expect(out).not.toMatch(/\bPortra\b/i);
    expect(out).not.toMatch(/\b8K RAW\b/i);
    expect(out).not.toMatch(/no CGI feel/i);
    expect(out).not.toMatch(/no plastic texture/i);
    expect(out).not.toMatch(/no over-sharpened artificial look/i);
  });

  it("NB2 prompt starts subject-first with action and scene in the opening sentence", () => {
    const out = buildImagePrompt(
      nb2Args.predator,
      nb2Args.prey,
      nb2Args.env,
      nb2Args.arc,
      nb2Args.lighting,
      nb2Args.cameraGear,
      nb2Args.texture,
      nb2Args.depthMode,
      nb2Args.weather,
      nb2Args.emotionalTone,
      nb2Args.animalVibe,
      nb2Args.sceneDesc,
      undefined,
      "NANO_BANANA_2"
    );

    const firstSentence = out.split(".")[0] ?? "";
    expect(firstSentence).toMatch(/Wolf Pack/i);
    expect(firstSentence).toMatch(/Elk/i);
    expect(firstSentence).toMatch(/Rocky Mountain meadow/i);
  });

  it("NB2 prompt preserves explicit user lighting direction", () => {
    const out = buildImagePrompt(
      nb2Args.predator,
      nb2Args.prey,
      nb2Args.env,
      nb2Args.arc,
      "hard side light with a cool rim light",
      nb2Args.cameraGear,
      nb2Args.texture,
      nb2Args.depthMode,
      nb2Args.weather,
      nb2Args.emotionalTone,
      nb2Args.animalVibe,
      nb2Args.sceneDesc,
      undefined,
      "NANO_BANANA_2"
    );

    expect(out).toMatch(/hard side light/i);
    expect(out).toMatch(/cool rim light/i);
  });

  it("Kling native paste-ready block is narrative style without field labels", () => {
    const out = buildKlingNative15s(
      klingBase.predator,
      klingBase.prey,
      klingBase.env,
      klingBase.arc,
      klingBase.weather,
      "Kling 3.0 Pro",
      klingBase.emotionalTone,
      klingBase.animalVibe,
      klingBase.sceneDesc,
      quality
    );

    const pasteBlock = extractKlingPasteBlock(out);
    expect(pasteBlock.length).toBeGreaterThan(0);
    expect(pasteBlock).not.toContain("Shot:");
    expect(pasteBlock).not.toContain("Characters:");
    expect(pasteBlock).not.toContain("Action:");
    expect(pasteBlock).not.toContain("Lighting & Location:");
    expect(pasteBlock).toContain("Wide opening hold with a subtle push-in");
  });

  it("Kling native paste-ready block stays within the 2500-char limit", () => {
    const out = buildKlingNative15s(
      klingBase.predator,
      klingBase.prey,
      klingBase.env,
      klingBase.arc,
      klingBase.weather,
      "Kling 3.0 Pro",
      klingBase.emotionalTone,
      klingBase.animalVibe,
      klingBase.sceneDesc,
      quality
    );

    const pasteBlock = extractKlingPasteBlock(out);
    expect(pasteBlock.length).toBeLessThanOrEqual(2500);
  });

  it("Kling native paste-ready block excludes validator metadata", () => {
    const out = buildKlingNative15s(
      klingBase.predator,
      klingBase.prey,
      klingBase.env,
      klingBase.arc,
      klingBase.weather,
      "Kling 3.0 Pro",
      klingBase.emotionalTone,
      klingBase.animalVibe,
      klingBase.sceneDesc,
      quality
    );

    const pasteBlock = extractKlingPasteBlock(out);
    expect(pasteBlock).not.toContain("Prompt length OK:");
    expect(pasteBlock).not.toContain("PROMPT TOO LONG:");
  });

  it("Kling 6-shot paste-ready block excludes validator metadata", () => {
    const out = buildKlingSixShot(
      klingBase.predator,
      klingBase.prey,
      klingBase.env,
      klingBase.arc,
      klingBase.weather,
      "Kling 3.0 Pro",
      klingBase.emotionalTone,
      klingBase.animalVibe,
      klingBase.sceneDesc,
      quality
    );

    const pasteBlock = extractKlingSixShotPasteBlock(out);
    expect(pasteBlock).not.toContain("Prompt length OK:");
    expect(pasteBlock).not.toContain("PROMPT TOO LONG:");
  });

  it("Runway paste-ready Shot 1/2/3/4 blocks stay under 120 words", () => {
    const shots = buildRunwayShots(
      klingBase.predator,
      klingBase.prey,
      klingBase.env,
      klingBase.arc,
      klingBase.weather,
      "Gen-4.5",
      klingBase.emotionalTone,
      klingBase.animalVibe,
      klingBase.sceneDesc,
      quality
    );

    const shot1Paste = extractRunwayPasteBlock(shots.shot1);
    const shot2Paste = extractRunwayPasteBlock(shots.shot2);
    const shot3Paste = extractRunwayPasteBlock(shots.shot3);
    const shot4Paste = extractRunwayPasteBlock(shots.shot4);

    expect(wordCount(shot1Paste)).toBeLessThanOrEqual(120);
    expect(wordCount(shot2Paste)).toBeLessThanOrEqual(120);
    expect(wordCount(shot3Paste)).toBeLessThanOrEqual(120);
    expect(wordCount(shot4Paste)).toBeLessThanOrEqual(120);
    expect(shot1Paste).not.toContain("Keep both subjects");
  });
});

      it("Clip chaining emphasizes readable first frame and clear spacing", () => {
    const out = buildClipChaining("Wolf", "MEDIUM");
    expect(out).toContain("strong first-frame readability");
    expect(out).toContain("both subjects clearly readable");
    expect(out).toContain("spacing");
  });

  describe("Step 8B — latest prompt-side regression guards", () => {
    const base = {
      predator: "Wolf Pack",
      prey: "Elk",
      env: "Rocky Mountain meadow",
      arc: "Pack hunting strategy" as const,
      weather: "Golden Hour" as const,
      emotionalTone: "Raw Tension" as const,
      animalVibe: "BBC Earth Documentary" as const,
      sceneDesc:
        "Both animals are visible immediately with no empty setup and clean tension from frame one.",
    };

    const quality = {
      realismMode: "Reference Locked",
      motionOnlyI2V: true,
      referenceLock: true,
      singleActionRule: true,
      microMotion: true,
      heroVeo: false,
    } as const;

    function extractKlingCardPasteBlock(out: string): string {
      return (
        out
          .split("═══ PASTE-READY KLING PROMPT (copy this block into Kling) ═══")[1]
          ?.split("─── FULL BREAKDOWN (reference only) ───")[0]
          ?.trim() ?? ""
      );
    }

    it("NB2 and NANO_BANANA_2 use the same image prompt branch", () => {
      const nb2 = buildImagePrompt(
        base.predator,
        base.prey,
        base.env,
        base.arc,
        "golden hour sunlight",
        "Nikon Z9, 400mm wildlife lens, Kodak Portra 400 film emulation",
        "ultra detailed fur, frost on guard hairs, clean snow contact around paws",
        "Balanced Depth",
        base.weather,
        base.emotionalTone,
        base.animalVibe,
        base.sceneDesc,
        undefined,
        "NB2"
      );

      const nanoBanana2 = buildImagePrompt(
        base.predator,
        base.prey,
        base.env,
        base.arc,
        "golden hour sunlight",
        "Nikon Z9, 400mm wildlife lens, Kodak Portra 400 film emulation",
        "ultra detailed fur, frost on guard hairs, clean snow contact around paws",
        "Balanced Depth",
        base.weather,
        base.emotionalTone,
        base.animalVibe,
        base.sceneDesc,
        undefined,
        "NANO_BANANA_2"
      );

      expect(nb2).toBe(nanoBanana2);
      expect(nb2).not.toMatch(/\bNikon\b/i);
      expect(nb2).not.toMatch(/\bKodak\b/i);
      expect(nb2).not.toMatch(/\bPortra\b/i);
    });

    it("Kling 4-shot paste-ready block stays narrative instead of reverting to field-list labels", () => {
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

      const pasteBlock = extractKlingCardPasteBlock(shots.shot1);

      expect(pasteBlock.length).toBeGreaterThan(0);
      expect(pasteBlock).toContain("Wide opening hold with a subtle push-in.");
      expect(pasteBlock).toContain("Both subjects are fully readable from frame one");
      expect(pasteBlock).not.toContain("Characters:");
      expect(pasteBlock).not.toContain("Action:");
      expect(pasteBlock).not.toContain("Lighting & Location:");
      expect(pasteBlock).not.toContain("Extra:");
    });

    it("Runway shot cards keep the clean full-body handoff rule wording", () => {
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

      expect(shots.shot1).toContain(
        "chain from the last frame only if it remains a clean full-body handoff frame"
      );
      expect(shots.shot2).toContain(
        "Use Shot 1 last frame as I2V input only if it remains a clean full-body handoff frame"
      );
      expect(shots.shot3).toContain(
        "Use Shot 2 last frame as I2V input only if it remains a clean full-body handoff frame"
      );
      expect(shots.shot4).toContain(
        "Use Shot 3 last frame as I2V input only if it remains a clean full-body handoff frame"
      );
    });

    it("Kling shot cards keep the clean full-body handoff rule wording", () => {
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

      expect(shots.shot2).toContain(
        "Use Shot 1 last frame only if it remains a clean full-body handoff frame"
      );
      expect(shots.shot3).toContain(
        "Use Shot 2 last frame only if it remains a clean full-body handoff frame"
      );
      expect(shots.shot4).toContain(
        "Use Shot 3 last frame only if it remains a clean full-body handoff frame"
      );
    });

    it("Clip chaining keeps the clean full-body handoff rule wording", () => {
      const out = buildClipChaining("Wolf", "MEDIUM");

      expect(out).toContain("If the outgoing final frame is a clean full-body handoff frame");
      expect(out).toContain("Chain Shot 2 with the cleanest handoff source available.");
      expect(out).toContain(
        "Use the previous last frame only when it remains a clean full-body handoff frame"
      );
    });

    it("Seedance multi-shot keeps subject capitalization after Cut to for multi-word animal names", () => {
      const shots = buildSeedanceShots(
        "Mountain Lion",
        "Bighorn Sheep",
        "Rocky Mountain ledge",
        "Ambush attack",
        "Golden Hour",
        "Raw Tension",
        "BBC Earth Documentary",
        "Both animals are visible immediately with strong readability from frame one.",
        quality
      );

      expect(shots.multiShotPrompt).toContain("Cut to Mountain Lion");
      expect(shots.multiShotPrompt).not.toContain("Cut to mountain Lion");
    });
  });
});

describe("Step 9 — Kling single-shot paste-ready narrative format", () => {
  const base = {
    predator: "Mountain Lion",
    prey: "White-tailed Deer",
    env: "Rocky Mountain forest edge",
    arc: "Ambush attack" as const,
    weather: "Golden Hour" as const,
    emotionalTone: "Raw Tension" as const,
    animalVibe: "National Geographic Wild" as const,
    sceneDesc: "",
  };

  const quality = {
    realismMode: "Reference Locked",
    motionOnlyI2V: true,
    referenceLock: true,
    singleActionRule: true,
    microMotion: true,
    heroVeo: false,
  } as const;

  function extractKlingSinglePasteBlock(out: string): string {
    return (
      out
        .split("═══ PASTE-READY KLING PROMPT (copy this block into Kling) ═══")[1]
        ?.split("─── FULL BREAKDOWN (reference only) ───")[0]
        ?.trim() ?? ""
    );
  }

  it("Kling single-shot paste blocks do not use SCALE field labels", () => {
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

    for (const shot of [shots.shot1, shots.shot2, shots.shot3, shots.shot4]) {
      const pasteBlock = extractKlingSinglePasteBlock(shot);
      expect(pasteBlock.length).toBeGreaterThan(0);
      expect(pasteBlock).not.toContain("Shot:");
      expect(pasteBlock).not.toContain("Characters:");
      expect(pasteBlock).not.toContain("Action:");
      expect(pasteBlock).not.toContain("Lighting & Location:");
      expect(pasteBlock).not.toContain("Extra:");
    }
  });

  it("Kling single-shot paste blocks keep narrative camera openers", () => {
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

    const paste1 = extractKlingSinglePasteBlock(shots.shot1);
    const paste2 = extractKlingSinglePasteBlock(shots.shot2);
    const paste3 = extractKlingSinglePasteBlock(shots.shot3);
    const paste4 = extractKlingSinglePasteBlock(shots.shot4);

    expect(paste1).toContain("Wide opening hold");
    expect(paste2).toContain("Wide pressure-build tracking shot");
    expect(paste3).toContain("Wide peak-action read");
    expect(paste4).toContain("Locked wide aftermath hold");
  });

  it("Kling single-shot paste blocks exclude literal motion intensity while keeping operator metadata", () => {
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

    const pasteBlocks = [shots.shot1, shots.shot2, shots.shot3, shots.shot4].map(extractKlingSinglePasteBlock);

    for (const pasteBlock of pasteBlocks) {
      expect(pasteBlock).not.toMatch(/Motion intensity:\s*[\d.]+/i);
    }

    expect(shots.shot1).toMatch(/Motion intensity:\s*[\d.]+/i);
    expect(shots.shot2).toMatch(/Motion intensity:\s*[\d.]+/i);
    expect(shots.shot3).toMatch(/Motion intensity:\s*[\d.]+/i);
    expect(shots.shot4).toMatch(/Motion intensity:\s*[\d.]+/i);
  });
});

describe("engine constraint regression guards", () => {
  it("validateEngineConstraints flags invalid Runway settings clearly", () => {
    const warnings = validateEngineConstraints({
      engine: "runway",
      duration: 1,
      fps: 30,
      hasNegativePrompt: true,
      hasAppearanceInPrompt: true,
    });

    expect(warnings).toHaveLength(4);
    expect(warnings.filter((w) => w.level === "error")).toHaveLength(3);
    expect(warnings.some((w) => /24fps or 25fps only/i.test(w.message))).toBe(true);
    expect(warnings.some((w) => /does not support negative prompts/i.test(w.message))).toBe(true);
  });
});
