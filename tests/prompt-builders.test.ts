import { describe, it, expect } from "vitest";
import {
  buildImagePromptCard,
  buildGptImage2PromptCard,
  buildImagePrompt,
  buildShotImagePlan,
  buildFourShotWorkflowPromptPack,
  buildFourShotWorkflow,
  buildHybridPromptPack,
  buildHybridLongPromptPack,
  buildRunwayPromptPack,
  buildRunwayShots,
  buildKlingPromptPack,
  buildKlingShots,
  buildSeedancePromptPack,
  buildSeedanceShots,
  buildKlingNative15s,
  buildKlingNative15sPayload,
  buildKlingNative15sCard,
  buildKlingFramesPromptCard,
  buildKlingMultishotPromptCards,
  buildKlingSixShot,
  buildCapCutPlan,
  buildClipChaining,
  build10Ideas,
  buildThumbnailPrompt,
  finalizeGenerationText,
  sanitizeSocialCopyText,
  validateKlingPromptLength,
  validateEngineConstraints,
  buildPromptScenarioContext,
} from "@/lib/prompt-builders";
import { getHabitatMode, isWaterForwardPreyScenario } from "@/lib/prompt-builders/habitat";

describe("buildImagePrompt – Nano Banana image path", () => {
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

  it("keeps the Nano Banana path even when a legacy MJ target is passed", () => {
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
    expect(hasMJParams(p)).toBe(false);
  });

  it("strips legacy MJ flags from scene descriptions", () => {
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
    expect(/--ar\s+9:16/i.test(p)).toBe(false);
    expect(/--style\s+raw/i.test(p)).toBe(false);
  });

  it("keeps long scene context word-safe instead of clipping into broken endings", () => {
    const longScene =
      `${"meadow ".repeat(19)}Clear U.S. wildlife setup for fast Facebook viewing.`;

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
      longScene
    );

    expect(p).not.toMatch(/\bClear U\.(?=\s|$)/);
  });

  it("locks NB2 image prompts to one ground family and one lighting family", () => {
    const prompt = buildImagePrompt(
      "Bull Elk",
      "Bull Elk",
      "Rocky Mountain meadow with snow patches and dry grass",
      "Giant vs giant clash",
      "frozen dusk rim light",
      "Canon EOS R5, 200mm wildlife lens",
      "wet fur and antler detail",
      "Balanced Depth",
      "Frozen Dusk",
      "Calm Dominance",
      "BBC Earth Documentary",
      "The left bull stays planted while the right bull advances one step."
    ).toLowerCase();

    expect(prompt).toContain('patchy early snow over firm grass')
    expect(prompt).toContain("winter dusk with a purple-orange sky");
    expect(prompt).toContain("clear cold air");
    expect(prompt).not.toMatch(/snow-covered clearing|dry leaf litter and patchy grass/);
    expect(prompt).not.toMatch(/soft cloudy daylight|cold overcast afternoon light/);
    expect(prompt).not.toMatch(/depth of field:|lighting:/);
  });

  it("keeps water-forward NB2 prompts locked to shoreline habitat and strike spacing", () => {
    const prompt = buildImagePrompt(
      "Bald Eagle",
      "Salmon",
      "Riverbank Reeds",
      "Ambush attack",
      "dawn river light",
      "Canon EOS R5, 200mm wildlife lens",
      "feather and scale detail",
      "Balanced Depth",
      "Dawn",
      "Raw Tension",
      "National Geographic Wild",
      "The eagle stays low on the left at the bank while the salmon holds right in the shallows."
    ).toLowerCase();

    expect(prompt).toContain("along riverbank reeds");
    expect(prompt).toContain("muddy bank edge with shallow current");
    expect(prompt).toMatch(/surface-break window|shallow strike window/);
    expect(prompt).not.toMatch(/dry grass and packed earth|pine-aspen forest clearing/);
  });
});

it("builds a GPT Image 2 backup prompt with cover-safe layout and inline artifact constraints", () => {
    const prompt = buildGptImage2PromptCard(
      "Grey Wolf",
      "Bull Elk",
      "Rocky Mountain river basin with frost grass",
      "Ambush attack",
      "blue-hour dawn light",
      "Canon EOS R5, 400mm wildlife lens",
      "clean fur detail and grounded hoof contact",
      "Balanced Depth",
      "Dawn",
      "Raw Tension",
      "BBC Earth Documentary",
      "The elk holds right near the river edge while the wolf approaches from the left with readable spacing."
    ).fullText;

    expect(prompt).toContain("Photorealistic wildlife documentary cover-safe still image, 9:16 vertical.");
    expect(prompt).toContain("Keep Grey Wolf on the left and Bull Elk on the right");
    expect(prompt).toContain("No text unless explicitly requested.");
    expect(prompt).toContain("Avoid text, watermark, logo, extra limbs, distorted anatomy, duplicate animals, overlapping subjects");
    expect(prompt).toContain("Leave slight negative space for cover-safe framing and social preview overlays.");
    expect(prompt).toContain("no visible dust, no dirt spray, no debris particles, no kicked-up soil");
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

    expect(shots.shot1).toContain("Conservative WSTV Seedance rule");
    expect(shots.shot2).toContain("═══ PASTE-READY SEEDANCE PROMPT");
    expect(shots.shot4).toContain("Suggested duration: 5 seconds.");
    expect(shots.workflowGuide).toContain("WSTV fallback prompt structure: subject movement + background movement + camera movement");
    expect(shots.workflowGuide).toContain("Default WSTV workflow: generate 4 separate video shots.");
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

  it("retains the existing Seedance workflow-guide wording", () => {
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
  it("locks later Seedance shots to the Shot 1 world plate without breaking shot readability", () => {
    const pack = buildSeedancePromptPack(
      "Wolf",
      "Bull Elk",
      "Rocky Mountain meadow",
      "Pack hunting strategy",
      "Overcast",
      "Raw Tension",
      "National Geographic Wild",
      "The pack tightens one lane while the elk keeps a clean escape read.",
      quality
    );

    expect(pack.shot2.pasteReady).toContain("Stay inside the exact Shot 1 world plate");
    expect(pack.shot3.pasteReady).toContain("same background layout");
    expect(pack.shot4.pasteReady).toContain("Camera holds wide with a subtle pull-back");
    expect(pack.shot3.pasteReady).toContain("dominant readable action beat");
  });
});

describe("Long workflow prompt safety", () => {
  const quality = {
    realismMode: "Reference Locked",
    motionOnlyI2V: true,
    referenceLock: true,
    singleActionRule: true,
    microMotion: true,
    heroVeo: false,
  } as const;

  it("routes copyable long-workflow prompts through engine-safe final wording", () => {
    const pack = buildHybridLongPromptPack(
      "Bald Eagle",
      "Salmon",
      "Riverbank Reeds",
      "Ambush attack",
      "Dawn",
      "Gen-4.5",
      "Kling 3.0 Pro",
      "Raw Tension",
      "National Geographic Wild",
      "Readable shoreline setup with clean first-frame spacing.",
      quality,
      "Waterline"
    );

    const shots = [pack.shot1, pack.shot2, pack.shot3, pack.shot4];
    for (const shot of shots) {
      expect(shot.pasteReady).not.toMatch(
        /\b(no|avoid|never|do not|don't|without|ambush)\b/i
      );
    }

    expect(pack.shot2.pasteReady).toContain("first impact waits for the payoff beat");
    expect(pack.shot3.pasteReady).toMatch(/spacing stays readable/i);
  });

  it("keeps medium and long workflow packs on valid Kling generation durations", () => {
    const base = {
      mode: "hybrid" as const,
      predator: "Bald Eagle",
      prey: "Salmon",
      env: "Riverbank Reeds",
      arc: "Ambush attack" as const,
      weather: "Dawn" as const,
      runwayModel: "Gen-4.5" as const,
      klingModel: "Kling 3.0 Pro" as const,
      emotionalTone: "Raw Tension" as const,
      animalVibe: "National Geographic Wild" as const,
      sceneDesc: "Readable shoreline setup with clean first-frame spacing.",
      quality,
      cameraAnglePreset: "Waterline" as const,
    };

    const mediumPack = buildFourShotWorkflowPromptPack({
      ...base,
      durationLane: "medium",
    });
    const longPack = buildFourShotWorkflowPromptPack({
      ...base,
      durationLane: "long",
    });

    expect(mediumPack.shot1.metadata?.durationSeconds).toBe(10);
    expect(mediumPack.shot2.metadata?.durationSeconds).toBe(10);
    expect(mediumPack.shot3.metadata?.durationSeconds).toBe(10);
    expect(mediumPack.shot4.metadata?.durationSeconds).toBe(5);
    expect(longPack.shot1.metadata?.durationSeconds).toBe(10);
    expect(longPack.shot2.metadata?.durationSeconds).toBe(10);
    expect(longPack.shot3.metadata?.durationSeconds).toBe(10);
    expect(longPack.shot4.metadata?.durationSeconds).toBe(10);

    const klingDurationLeak = /\b(?:6|7|8|9|12|15)\s*(?:seconds?|s)\b/i;
    expect(`${mediumPack.shot2.fullText} ${mediumPack.shot3.fullText}`).not.toMatch(
      klingDurationLeak
    );
    expect(`${longPack.shot2.fullText} ${longPack.shot3.fullText}`).not.toMatch(
      klingDurationLeak
    );
  });
});

describe("Clip chaining guidance", () => {
  it("describes the current Runway handoff flow and Kling multi-shot alternative", () => {
    const guide = buildClipChaining("Wolf", "MEDIUM");

    expect(guide).toContain("STEP 4 — Combine clips in a video editor.");
    expect(guide).toContain("STEP 4 — Alternative: use Multi-Shot mode (up to 6 shots, single prompt).");
    expect(guide).toContain("═══ KLING 3.0 CHAINING ═══");
    expect(guide).toContain("WSTV Handoff Rule");
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

  it("KlingNative15s exposes the Kling Frames 15-second structure", () => {
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
    expect(out).toContain("KLING FRAMES PROMPT");
    expect(out).toContain("Shot 1, 0-3s");
    expect(out).toContain("Shot 2, 3-6s");
    expect(out).toContain("Shot 3, 6-10s");
    expect(out).toContain("Shot 4, 10-13s");
    expect(out).toContain("Shot 5, 13-15s");
    expect(out).toContain("Audio:");
    expect(out).toContain("Negative prompt:");
    expect(out).toContain("no blood, no gore, no visible wounds");
    expect(out).not.toContain("KLING NATIVE 10S");
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
    return (
      out
        .split("═══ PASTE INTO KLING FRAMES — max 2500 chars (copy this block only) ═══")[1]
        ?.split("─── OPTIONAL NOTES — reference only, do NOT paste into Kling ───")[0]
        ?.trim() ?? ""
    );
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

  it("Kling native paste-ready block is one copyable block without the old Kling prefix", () => {
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
    expect(pasteBlock.startsWith("Image-to-video from master image.")).toBe(true);
    expect(pasteBlock).not.toContain("KLING 3.0 PRO DIRECT 15S MULTISHOT");
    expect(pasteBlock).not.toContain("KLING DIRECT 15S MULTISHOT");
    expect(pasteBlock).not.toContain("Shot:");
    expect(pasteBlock).not.toContain("Characters:");
    expect(pasteBlock).not.toContain("Lighting & Location:");
    expect(pasteBlock).toContain("Shot 1, 0-3s");
    expect(pasteBlock).toContain("Shot 2, 3-6s");
    expect(pasteBlock).toContain("Shot 3, 6-10s");
    expect(pasteBlock).toContain("Shot 4, 10-13s");
    expect(pasteBlock).toContain("Shot 5, 13-15s");
    expect(pasteBlock).toContain("Audio:");
    expect(pasteBlock).toContain("Negative prompt:");
    expect(pasteBlock).toContain("no blood");
    expect(pasteBlock).toContain("no gore");
    expect(pasteBlock).toContain("no visible wounds");
    expect(pasteBlock).not.toContain("KLING NATIVE 10S");
  });

  it("Kling native paste-ready block stays within the 2500-char limit and keeps a full 15s body", () => {
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
    expect(pasteBlock.length).toBeGreaterThan(1800);
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

  it("Kling direct 15s card metadata is labeled for the direct multishot variant", () => {
    const card = buildKlingNative15sCard(
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

    expect(card.metadata?.engine).toBe("kling");
    expect(card.metadata?.title).toBe("Kling Frames Prompt");
    expect(card.metadata?.variant).toBe("kling-frames");
  });


  it("Kling Multishot returns exactly four 15s shot prompts under 512 chars", () => {
    const shots = buildKlingMultishotPromptCards(
      "Crocodile",
      "Warthog",
      "dry-season African muddy waterhole with reeds and muddy bank",
      "Ambush attack",
      "Golden Hour",
      "Kling 3.0 Pro",
      "Raw Tension",
      "BBC Earth Documentary",
      "The warthog notices too late at the waterline.",
      quality
    );

    expect(shots).toHaveLength(4);
    expect(shots.map((shot) => shot.metadata?.durationSeconds).reduce((sum, value) => sum + (value ?? 0), 0)).toBe(15);
    shots.forEach((shot, index) => {
      expect(shot.pasteReady.length).toBeLessThanOrEqual(512);
      expect(shot.fullText).toContain(`Shot ${index + 1}:`);
      expect(shot.pasteReady).not.toContain("Image-to-video from master image");
      expect(shot.pasteReady).not.toContain("Shot 5");
      expect(shot.pasteReady).not.toMatch(/no\s*,\s*no/i);
    });
    expect(shots[0].pasteReady.length).toBeLessThan(512);
    expect(shots[1].pasteReady).toMatch(/Trigger beat|surges|bursts|launches|dives|closes/i);
  });

  it("Kling Multishot changes Shot 2 and Shot 3 when arc changes", () => {
    const packArcShots = buildKlingMultishotPromptCards(
      "Wolf Pack",
      "Bison",
      "Rocky Mountain meadow with sagebrush",
      "Pack hunting strategy",
      "Golden Hour",
      "Kling 3.0 Pro",
      "Raw Tension",
      "BBC Earth Documentary",
      "The bison turns into the tightening lane too late.",
      quality
    );
    const defenderArcShots = buildKlingMultishotPromptCards(
      "Wolf Pack",
      "Bison",
      "Rocky Mountain meadow with sagebrush",
      "Defender stands ground",
      "Golden Hour",
      "Kling 3.0 Pro",
      "Raw Tension",
      "BBC Earth Documentary",
      "The bison turns into the tightening lane too late.",
      quality
    );

    expect(packArcShots[1].pasteReady).not.toBe(defenderArcShots[1].pasteReady);
    expect(packArcShots[2].pasteReady).not.toBe(defenderArcShots[2].pasteReady);
    expect(packArcShots[1].pasteReady).toMatch(/coordinated acceleration burst/i);
    expect(defenderArcShots[1].pasteReady).toMatch(/heavy planted body pressure/i);
  });

  it("Kling Multishot carries tone and vibe cues into the paste-ready shots", () => {
    const shots = buildKlingMultishotPromptCards(
      "Great White Shark",
      "Seal",
      "surf line with open ocean foam",
      "Ambush attack",
      "Storm",
      "Kling 3.0 Pro",
      "Explosive Energy",
      "Raw Nature Unfiltered",
      "The seal notices the surge too late near the foam line.",
      quality
    );

    expect(shots.some((shot) => /explosive viral energy/i.test(shot.pasteReady))).toBe(true);
    expect(shots.some((shot) => /raw nature/i.test(shot.pasteReady))).toBe(true);
  });

  it("Kling Frames paste-ready block carries arc, tone, vibe, quality, and scene cues", () => {
    const card = buildKlingFramesPromptCard(
      "Crocodile",
      "Warthog",
      "dry-season African muddy waterhole with reeds and muddy bank",
      "Ambush attack",
      "Golden Hour",
      "Kling 3.0 Pro",
      "Raw Tension",
      "BBC Earth Documentary",
      "The warthog notices too late at the muddy waterline.",
      quality
    );

    expect(card.pasteReady).toContain("Image-to-video from master image");
    expect(card.pasteReady).toContain("Hidden attack lane, sudden surge, unresolved escape pressure.");
    expect(card.pasteReady).toContain("raw documentary tension");
    expect(card.pasteReady).toContain("BBC Earth realism");
    expect(card.pasteReady).toContain("Scene cue: The warthog notices too late at the muddy waterline.");
    expect(card.pasteReady).toContain("Photorealistic raw wildlife documentary");
    expect(card.pasteReady.length).toBeLessThanOrEqual(2500);
  });

  it("Kling Frames and Multishot preserve non-graphic safety language", () => {
    const frameCard = buildKlingFramesPromptCard(
      "Tortoise",
      "Monitor Lizard",
      "sun-baked desert scrub",
      "Escape from danger",
      "Golden Hour",
      "Kling 3.0 Pro",
      "Desperate Survival",
      "BBC Earth Documentary",
      "The tortoise turns shell-first and inches toward cover.",
      quality
    );
    const shots = buildKlingMultishotPromptCards(
      "Tortoise",
      "Monitor Lizard",
      "sun-baked desert scrub",
      "Escape from danger",
      "Golden Hour",
      "Kling 3.0 Pro",
      "Desperate Survival",
      "BBC Earth Documentary",
      "The tortoise turns shell-first and inches toward cover.",
      quality
    );

    expect(frameCard.pasteReady).toContain("no blood, no gore, no visible wounds");
    expect(frameCard.pasteReady).not.toMatch(/no\s*,\s*no/i);
    expect(shots.every((shot) => !/no\s*,\s*no/i.test(shot.pasteReady))).toBe(true);
    expect(shots[0].pasteReady).toMatch(/no blood, no gore, no visible wounds/i);
    expect(shots[3].pasteReady).toMatch(/no death close-up, no blood, no gore, no visible wounds/i);
  });

  it("Kling close-contact trigger keeps the standard 15s structure unchanged when trigger terms are absent", () => {
    const out = buildKlingNative15s(
      "Wolf Pack",
      "Bison",
      "Rocky Mountain meadow with sagebrush",
      "Pack hunting strategy",
      "Golden Hour",
      "Kling 3.0 Pro",
      "Raw Tension",
      "BBC Earth Documentary",
      "Both animals are visible immediately with no empty setup and clean tension from frame one.",
      quality
    );

    expect(out).toContain("Shot 2, 3-6s");
    expect(out).toContain("Shot 3, 6-10s");
    expect(out).toContain("Shot 5, 13-15s");
    expect(out).not.toContain("Shot 2, 0:03-0:05");
  });

  it("Kling close-contact action style unlocks the compact 3-shot 15s path without manual trigger words", () => {
    const payload = buildKlingNative15sPayload(
      "Wild Boar",
      "Black Bear",
      "South Florida Everglades marsh with shallow water channel, muddy banks, reeds, sawgrass, swamp vegetation, distant tree line",
      "Overcast",
      "Explosive Energy",
      "BBC Earth Documentary",
      "Both animals stay readable from frame one with immediate pressure.",
      {
        ...quality,
        actionStyle: "Close-contact fight",
      }
    );

    expect(payload.multishotPrompt).toContain("Shot 1, 0:00-0:04");
    expect(payload.multishotPrompt).toContain("Shot 2, 0:04-0:09");
    expect(payload.multishotPrompt).toContain("Shot 3, 0:09-0:15");
    expect(payload.multishotPrompt).not.toContain("Shot 4, 0:08-0:12");
    expect(payload.multishotPrompt).toMatch(/first clash hits by 5 seconds/i);
    expect(payload.multishotPrompt).toMatch(/shoulder-to-shoulder/i);
    expect(payload.multishotPrompt).toMatch(/controlled grapple/i);
    expect(payload.multishotPrompt).toMatch(/pin-down hold near .*shoulder area|forced retreat/i);
    expect(payload.multishotPrompt).toContain("both animals fully visible");
    expect(payload.combinedPrompt.length).toBeLessThanOrEqual(2500);
    expect(payload.totalChars).toBe(payload.combinedPrompt.length);
    expect(payload.withinLimit).toBe(true);
  });

  it("Kling close-contact trigger produces the earlier clash and grapple structure inside the 2500-char combined limit", () => {
    const payload = buildKlingNative15sPayload(
      "Wild Boar",
      "Black Bear",
      "South Florida Everglades marsh with shallow water channel, muddy banks, reeds, sawgrass, swamp vegetation, distant tree line",
      "Overcast",
      "Explosive Energy",
      "BBC Earth Documentary",
      "Close-contact restraint fight with body clash, controlled grapple, overpower pressure, dominant restraint, and pin-down hold.",
      quality
    );

    expect(payload.multishotPrompt).toContain("Shot 1, 0:00-0:03");
    expect(payload.multishotPrompt).toContain("Shot 2, 0:03-0:05");
    expect(payload.multishotPrompt).toContain("Shot 3, 0:05-0:08");
    expect(payload.multishotPrompt).toContain("Shot 4, 0:08-0:12");
    expect(payload.multishotPrompt).toContain("Shot 5, 0:12-0:15");
    expect(payload.multishotPrompt).toMatch(/explosive/i);
    expect(payload.multishotPrompt).toMatch(/shoulder-to-shoulder/i);
    expect(payload.multishotPrompt).toMatch(/grapple/i);
    expect(payload.multishotPrompt).toMatch(/dominant/i);
    expect(payload.multishotPrompt).toMatch(/pin-down hold near .*shoulder area|forced retreat/i);
    expect(payload.multishotPrompt).toContain("both animals fully visible");
    expect(payload.combinedPrompt).toContain("Negative prompt: ");
    expect(payload.combinedPrompt.length).toBeLessThanOrEqual(2500);
    expect(payload.totalChars).toBe(payload.combinedPrompt.length);
    expect(payload.withinLimit).toBe(true);
    expect(payload.negativePrompt).toContain("blood");
    expect(payload.negativePrompt).toContain("gore");
    expect(payload.negativePrompt).toContain("visible injury");
  });

  it("Kling close-contact path compacts long environment text while keeping the clash sequence intact", () => {
    const payload = buildKlingNative15sPayload(
      "Wild Boar",
      "Black Bear",
      "South Florida Everglades marsh with shallow reflective water, muddy banks, reeds, sawgrass, swamp vegetation, distant tree line, layered storm clouds, extra background foliage, long bank description, repeated marsh geometry, repeated waterline geometry, repeated vegetation geometry",
      "Overcast",
      "Explosive Energy",
      "BBC Earth Documentary",
      "Close-contact restraint fight with body clash, controlled grapple, overpower pressure, and forced retreat ending.",
      quality
    );

    expect(payload.withinLimit).toBe(true);
    expect(payload.combinedPrompt.length).toBeLessThanOrEqual(2500);
    expect(payload.multishotPrompt).toContain("Shot 3, 0:05-0:08");
    expect(payload.multishotPrompt).toMatch(/forced retreat|pin-down/i);
  });

  it("Kling close-contact path reports withinLimit=false when even the compacted combined prompt cannot fit", () => {
    const hugePredator = `Wild Boar ${"alpha ".repeat(180)}`.trim();
    const hugePrey = `Black Bear ${"omega ".repeat(180)}`.trim();
    const payload = buildKlingNative15sPayload(
      hugePredator,
      hugePrey,
      "South Florida Everglades marsh with shallow water channel, muddy banks, reeds, sawgrass",
      "Overcast",
      "Explosive Energy",
      "BBC Earth Documentary",
      "Close-contact restraint fight with body clash, controlled grapple, overpower pressure, and forced retreat ending.",
      quality
    );

    expect(payload.totalChars).toBe(payload.combinedPrompt.length);
    expect(payload.withinLimit).toBe(false);
    expect(payload.multishotPrompt).toContain("Shot 3, 0:05-0:08");
    expect(payload.negativePrompt).toContain("blood");
  });

  it("Kling Multishot adapts attack language across catalog pair types", () => {
    const pairs = [
      ["Crocodile", "Warthog", "dry-season African muddy waterhole", /waterline|muddy|splash/i],
      ["Wolf Pack", "Bison", "Rocky Mountain meadow with sagebrush", /pack|corridor|lane/i],
      ["Bald Eagle", "Salmon", "Alaskan river mouth", /wing|dives|water strike|splash/i],
      ["Great White Shark", "Seal", "surf line", /surf|foam|ocean/i],
      ["Tortoise", "Monitor Lizard", "sun-baked desert scrub", /shell|tortoise|slow/i],
    ] as const;

    for (const [predator, prey, env, expected] of pairs) {
      const shots = buildKlingMultishotPromptCards(
        predator,
        prey,
        env,
        "Ambush attack",
        "Golden Hour",
        "Kling 3.0 Pro",
        "Raw Tension",
        "BBC Earth Documentary",
        "A fast non-graphic survival pressure beat.",
        quality
      );
      expect(shots).toHaveLength(4);
      expect(shots.every((shot) => shot.pasteReady.length <= 512)).toBe(true);
      expect(shots.map((shot) => shot.pasteReady).join(" ")).toMatch(expected);
    }
  });

  it("Nano Banana 2 image prompt is sectioned, attack-ready, and under 5000 chars", () => {
    const card = buildImagePromptCard(
      "Great White Shark",
      "Seal",
      "surf line with cold open ocean break and whitewash channel",
      "Ambush attack",
      "natural coastal light",
      "Canon wildlife lens",
      "wet skin texture and foam detail",
      "Balanced Depth",
      "Golden Hour",
      "Raw Tension",
      "BBC Earth Documentary",
      "Seal notices danger too late with one escape angle."
    );

    expect(card.pasteReady.length).toBeLessThanOrEqual(5000);
    expect(card.pasteReady).toContain("Lead Animal Prompt");
    expect(card.pasteReady).toContain("Opposing Animal Prompt");
    expect(card.pasteReady).toContain("Environment Prompt");
    expect(card.pasteReady).toContain("Composition / Framing Prompt");
    expect(card.pasteReady).toContain("Style / Lighting Prompt");
    expect(card.pasteReady).toContain("Safety / Continuity Prompt");
    expect(card.pasteReady).toMatch(/9:16 vertical/i);
    expect(card.pasteReady).toMatch(/full-body visibility/i);
    expect(card.pasteReady).toMatch(/notices danger too late|escape lane/i);
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

describe("Step 12 — export cleanup guards", () => {
  it("keeps Yellowstone meadow image-plan exports land-correct", () => {
    const shots = buildShotImagePlan(
      "Grizzly Bear",
      "Bison",
      "Yellowstone meadow open wilderness",
      "Giant vs giant clash",
      "Golden Hour",
      {
        realismMode: "Reference Locked",
        motionOnlyI2V: true,
        referenceLock: true,
        singleActionRule: true,
        microMotion: true,
        heroVeo: false,
      }
    );

    const exportText = shots.map((shot) => shot.prompt).join("\n");
    expect(exportText).not.toMatch(/surface ripples|suspended particles|water ripples/i);
    expect(exportText).toContain("Nano Banana 2 primary master still");
    expect(exportText).not.toContain("Keep everything else in the image exactly the same");
  });

  it("locks Shot 2 through Shot 4 image plans to the Shot 1 world plate", () => {
    const shots = buildShotImagePlan(
      "Mountain Lion",
      "White-tailed Deer",
      "Rocky Mountain meadow with pine edge",
      "Ambush attack",
      "Golden Hour",
      {
        realismMode: "Reference Locked",
        motionOnlyI2V: true,
        referenceLock: true,
        singleActionRule: true,
        microMotion: true,
        heroVeo: false,
      }
    );

    expect(shots[0].prompt).toContain("Shot 1 visual-world anchor");
    for (const shot of shots.slice(1)) {
      expect(shot.prompt).toContain("Preserve the Shot 1 world plate");
      expect(shot.prompt).toContain("same background layout");
      expect(shot.prompt).toContain("terrain contours");
      expect(shot.prompt).toContain("horizon line");
      expect(shot.prompt).toContain("light direction");
      expect(shot.prompt).toContain("weather density");
      expect(shot.prompt).toMatch(/keep the environment anchored/i);
    }
  });

  it("adds world-plate continuity locks to Runway and Kling later-shot prompts", () => {
    const quality = {
      realismMode: "Reference Locked",
      motionOnlyI2V: true,
      referenceLock: true,
      singleActionRule: true,
      microMotion: true,
      heroVeo: false,
    } as const;
    const runway = buildRunwayPromptPack(
      "Wolf Pack",
      "Bull Elk",
      "Rocky Mountain meadow with pine edge",
      "Pack hunting strategy",
      "Golden Hour",
      "Gen-4.5",
      "Raw Tension",
      "BBC Earth Documentary",
      "The pack holds the elk inside the same meadow opening.",
      quality
    );
    const kling = buildKlingPromptPack(
      "Wolf Pack",
      "Bull Elk",
      "Rocky Mountain meadow with pine edge",
      "Pack hunting strategy",
      "Golden Hour",
      "Kling 3.0 Pro",
      "Raw Tension",
      "BBC Earth Documentary",
      "The pack holds the elk inside the same meadow opening.",
      quality
    );

    for (const shot of [runway.shot2, runway.shot3, runway.shot4]) {
      expect(shot.pasteReady).toContain("Continuity lock: preserve the Shot 1 world plate");
      expect(shot.pasteReady).toContain("same background layout");
      expect(shot.pasteReady).toContain("light direction");
      expect(shot.pasteReady).toMatch(/keep the environment anchored/i);
    }

    for (const shot of [kling.shot2, kling.shot3, kling.shot4]) {
      expect(shot.pasteReady).toContain("Continue inside the exact Shot 1 world plate");
      expect(shot.pasteReady).toContain("same background layout");
      expect(shot.pasteReady).toContain("light direction");
      expect(shot.pasteReady).toMatch(/keep the environment anchored/i);
    }
  });

  it("keeps dry-ground Runway prompts from inheriting water motion language", () => {
    const shots = buildRunwayShots(
      "Bull Elk",
      "Bull Elk",
      "Rocky Mountain meadow with rut-season footing and dry grass",
      "Giant vs giant clash",
      "Golden Hour",
      "Gen-4.5",
      "Calm Dominance",
      "BBC Earth Documentary",
      "Two bull elk square off on dry meadow ground with clean spacing.",
      {
        realismMode: "Reference Locked",
        motionOnlyI2V: true,
        referenceLock: true,
        singleActionRule: true,
        microMotion: true,
        heroVeo: false,
      }
    );
    const runwayPaste =
      shots.shot1
        .split("═══ PASTE-READY I2V PROMPT (copy this into Runway) ═══")[1]
        ?.split("─── SHOT BREAKDOWN ───")[0]
        ?.trim()
        .toLowerCase() ?? "";

    expect(runwayPaste).not.toMatch(
      /waterline|surface ripples|caustic|underwater|riverbank|shoreline|shallow current|in-water|in water/
    );
    expect(runwayPaste).toMatch(/grass|brush|fur|terrain|vegetation/);
  });

  it("keeps Fishing Strike water-forward motion language out of land-biased Runway and Kling prompts", () => {
    const runway = buildRunwayPromptPack(
      "Bald Eagle",
      "Salmon",
      "Riverbank Reeds",
      "Ambush attack",
      "Dawn",
      "Gen-4.5",
      "Raw Tension",
      "National Geographic Wild",
      "A bald eagle tracks a salmon at the bank edge.",
      {
        realismMode: "Reference Locked",
        motionOnlyI2V: true,
        referenceLock: true,
        singleActionRule: true,
        microMotion: true,
        heroVeo: false,
      }
    );
    const kling = buildKlingPromptPack(
      "Bald Eagle",
      "Salmon",
      "Riverbank Reeds",
      "Ambush attack",
      "Dawn",
      "Kling 3.0 Pro",
      "Raw Tension",
      "National Geographic Wild",
      "A bald eagle tracks a salmon at the bank edge.",
      {
        realismMode: "Reference Locked",
        motionOnlyI2V: true,
        referenceLock: true,
        singleActionRule: true,
        microMotion: true,
        heroVeo: false,
      }
    );
    const combined = `${runway.shot2.pasteReady} ${kling.shot2.pasteReady}`.toLowerCase();

    expect(combined).toMatch(/bank-edge|surface break|shoreline reaction|strike window/);
    expect(combined).not.toMatch(/ground compression|grounded weight transfer|footing adjustment/);
  });

  it("keeps Gray Wolf land-based in salmon shoreline classifications", () => {
    expect(getHabitatMode("Gray Wolf", "Salmon", "Riverbank Reeds")).toBe("shoreline");
    expect(isWaterForwardPreyScenario("Gray Wolf", "Salmon", "Riverbank Reeds")).toBe(true);
  });

  it("keeps NB2 master-still prompts scene-locked while trimming composition density", () => {
    const prompt = buildImagePrompt(
      "Mountain Lion",
      "White-tailed Deer",
      "Rocky Mountain meadow",
      "Ambush attack",
      "golden hour rim light",
      "Canon EOS R5, 200mm wildlife lens",
      "natural fur and hoof detail",
      "Balanced Depth",
      "Golden Hour",
      "Raw Tension",
      "National Geographic Wild"
    );

    expect(prompt).toContain("Wide 9:16 documentary framing");
    expect(prompt).not.toContain("Use a wide 9:16 vertical frame");
    expect(prompt).toContain("Telephoto framing keeps the midground readable.");
    expect(prompt).toContain("in clear open air.");
  });

  it("sharpens rut mirror-match prompts with antler-room and footing cues", () => {
    const imagePrompt = buildImagePrompt(
      "Bull Elk",
      "Bull Elk",
      "Rocky Mountain meadow with rut-season footing and dry grass",
      "Giant vs giant clash",
      "frozen dusk rim light",
      "Canon EOS R5, 200mm wildlife lens",
      "wet fur and antler detail",
      "Balanced Depth",
      "Frozen Dusk",
      "Calm Dominance",
      "BBC Earth Documentary"
    ).toLowerCase();
    const runway = buildRunwayPromptPack(
      "Bull Elk",
      "Bull Elk",
      "Rocky Mountain meadow with rut-season footing and dry grass",
      "Giant vs giant clash",
      "Frozen Dusk",
      "Gen-4.5",
      "Calm Dominance",
      "BBC Earth Documentary",
      "Two bull elk square off on dry meadow ground with clean spacing.",
      {
        realismMode: "Reference Locked",
        motionOnlyI2V: true,
        referenceLock: true,
        singleActionRule: true,
        microMotion: true,
        heroVeo: false,
      }
    );
    const kling = buildKlingPromptPack(
      "Bull Elk",
      "Bull Elk",
      "Rocky Mountain meadow with rut-season footing and dry grass",
      "Giant vs giant clash",
      "Frozen Dusk",
      "Kling 3.0 Pro",
      "Calm Dominance",
      "BBC Earth Documentary",
      "Two bull elk square off on dry meadow ground with clean spacing.",
      {
        realismMode: "Reference Locked",
        motionOnlyI2V: true,
        referenceLock: true,
        singleActionRule: true,
        microMotion: true,
        heroVeo: false,
      }
    );
    const combined = `${runway.shot2.pasteReady} ${kling.shot3.pasteReady}`.toLowerCase();

    expect(imagePrompt).toMatch(/antler room|claim-space pressure|frontal antler line/);
    expect(combined).toMatch(/antler room|rut footing|claim line|planted footing|heavy shoulder/);
  });

  it("keeps long scene context export-safe when United States continuity text is present", () => {
    const p = buildImagePrompt(
      "Mountain Lion",
      "White-tailed Deer",
      "Rocky Mountain meadow",
      "Ambush attack",
      "golden hour sunlight",
      "Canon EOS R5, wildlife lens",
      "detailed fur texture",
      "Balanced Depth",
      "Golden Hour",
      "Raw Tension",
      "National Geographic Wild",
      `${"meadow ".repeat(19)}Clear U.S. wildlife setup for fast Facebook viewing.`
    );

    expect(p).not.toMatch(/\bClear U\.(?=\s|$)/);
  });

  it("removes leftover melodramatic raw-tension filler from thumbnail exports", () => {
    const thumb = buildThumbnailPrompt(
      "Mountain Lion",
      "White-tailed Deer",
      "Rocky Mountain meadow",
      "Golden Hour",
      "Raw Tension",
      "National Geographic Wild"
    );

    expect(thumb).not.toContain("the air itself feels dangerous");
    expect(thumb).toContain("visible pressure in posture and spacing");
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

describe("four-shot workflow dispatcher", () => {
  const base = {
    predator: "Mountain Lion",
    prey: "White-tailed Deer",
    env: "Rocky Mountain meadow",
    arc: "Ambush attack" as const,
    weather: "Golden Hour" as const,
    runwayModel: "Gen-4.5" as const,
    klingModel: "Kling 3.0 Pro" as const,
    emotionalTone: "Raw Tension" as const,
    animalVibe: "National Geographic Wild" as const,
    sceneDesc: "A tense opening in tall grass.",
  };

  const quality = {
    realismMode: "Reference Locked",
    motionOnlyI2V: true,
    referenceLock: true,
    singleActionRule: true,
    microMotion: true,
    heroVeo: false,
  } as const;

  it("defaults omitted mode to hybrid", () => {
    const workflow = buildFourShotWorkflow({
      predator: base.predator,
      prey: base.prey,
      env: base.env,
      arc: base.arc,
      weather: base.weather,
      runwayModel: base.runwayModel,
      klingModel: base.klingModel,
      emotionalTone: base.emotionalTone,
      animalVibe: base.animalVibe,
      sceneDesc: base.sceneDesc,
      quality,
    });

    const runway = buildRunwayShots(
      base.predator,
      base.prey,
      base.env,
      base.arc,
      base.weather,
      base.runwayModel,
      base.emotionalTone,
      base.animalVibe,
      base.sceneDesc,
      quality
    );
    const kling = buildKlingShots(
      base.predator,
      base.prey,
      base.env,
      base.arc,
      base.weather,
      base.klingModel,
      base.emotionalTone,
      base.animalVibe,
      base.sceneDesc,
      quality
    );

    expect(workflow).toEqual({
      shot1: runway.shot1,
      shot2: kling.shot2,
      shot3: kling.shot3,
      shot4: runway.shot4,
    });
  });

  it("hybrid mode maps Shot 1 Runway, Shot 2 Kling, Shot 3 Kling, Shot 4 Runway", () => {
    const workflow = buildFourShotWorkflow({
      mode: "hybrid",
      predator: base.predator,
      prey: base.prey,
      env: base.env,
      arc: base.arc,
      weather: base.weather,
      runwayModel: base.runwayModel,
      klingModel: base.klingModel,
      emotionalTone: base.emotionalTone,
      animalVibe: base.animalVibe,
      sceneDesc: base.sceneDesc,
      quality,
    });

    const runway = buildRunwayShots(
      base.predator,
      base.prey,
      base.env,
      base.arc,
      base.weather,
      base.runwayModel,
      base.emotionalTone,
      base.animalVibe,
      base.sceneDesc,
      quality
    );
    const kling = buildKlingShots(
      base.predator,
      base.prey,
      base.env,
      base.arc,
      base.weather,
      base.klingModel,
      base.emotionalTone,
      base.animalVibe,
      base.sceneDesc,
      quality
    );

    expect(workflow.shot1).toBe(runway.shot1);
    expect(workflow.shot2).toBe(kling.shot2);
    expect(workflow.shot3).toBe(kling.shot3);
    expect(workflow.shot4).toBe(runway.shot4);
  });

  it("seedance mode still returns all four Seedance shots", () => {
    const workflow = buildFourShotWorkflow({
      mode: "seedance",
      predator: base.predator,
      prey: base.prey,
      env: base.env,
      arc: base.arc,
      weather: base.weather,
      runwayModel: base.runwayModel,
      klingModel: base.klingModel,
      emotionalTone: base.emotionalTone,
      animalVibe: base.animalVibe,
      sceneDesc: base.sceneDesc,
      quality,
    });

    const seedance = buildSeedanceShots(
      base.predator,
      base.prey,
      base.env,
      base.arc,
      base.weather,
      base.emotionalTone,
      base.animalVibe,
      base.sceneDesc,
      quality
    );

    expect(workflow).toEqual({
      shot1: seedance.shot1,
      shot2: seedance.shot2,
      shot3: seedance.shot3,
      shot4: seedance.shot4,
    });
  });

  it("runway-only mode still returns all four Runway shots", () => {
    const workflow = buildFourShotWorkflow({
      mode: "runway-only",
      predator: base.predator,
      prey: base.prey,
      env: base.env,
      arc: base.arc,
      weather: base.weather,
      runwayModel: base.runwayModel,
      klingModel: base.klingModel,
      emotionalTone: base.emotionalTone,
      animalVibe: base.animalVibe,
      sceneDesc: base.sceneDesc,
      quality,
    });

    const runway = buildRunwayShots(
      base.predator,
      base.prey,
      base.env,
      base.arc,
      base.weather,
      base.runwayModel,
      base.emotionalTone,
      base.animalVibe,
      base.sceneDesc,
      quality
    );

    expect(workflow).toEqual({
      shot1: runway.shot1,
      shot2: runway.shot2,
      shot3: runway.shot3,
      shot4: runway.shot4,
    });
  });

  it("kling-only mode still returns all four Kling shots", () => {
    const workflow = buildFourShotWorkflow({
      mode: "kling-only",
      predator: base.predator,
      prey: base.prey,
      env: base.env,
      arc: base.arc,
      weather: base.weather,
      runwayModel: base.runwayModel,
      klingModel: base.klingModel,
      emotionalTone: base.emotionalTone,
      animalVibe: base.animalVibe,
      sceneDesc: base.sceneDesc,
      quality,
    });

    const kling = buildKlingShots(
      base.predator,
      base.prey,
      base.env,
      base.arc,
      base.weather,
      base.klingModel,
      base.emotionalTone,
      base.animalVibe,
      base.sceneDesc,
      quality
    );

    expect(workflow).toEqual({
      shot1: kling.shot1,
      shot2: kling.shot2,
      shot3: kling.shot3,
      shot4: kling.shot4,
    });
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

  it("validateEngineConstraints keeps Kling on 5s or 10s for the WSTV workflow", () => {
    const warnings = validateEngineConstraints({
      engine: "kling",
      duration: 15,
      hasNegativePrompt: true,
    });

    expect(warnings.some((w) => /5s or 10s for the WSTV workflow/i.test(w.message))).toBe(true);
  });
});

describe("structured prompt refactor guards", () => {
  const base = {
    predator: "Wolf",
    prey: "Elk",
    env: "Rocky Mountain Meadow",
    arc: "Ambush attack" as const,
    weather: "Golden Hour" as const,
    runwayModel: "Gen-4.5" as const,
    klingModel: "Kling 3.0 Pro" as const,
    emotionalTone: "Raw Tension" as const,
    animalVibe: "National Geographic Wild" as const,
    sceneDesc: "Clear mountain opening with readable spacing and strong first-frame tension.",
    quality: {
      realismMode: "Reference Locked" as const,
      motionOnlyI2V: true,
      referenceLock: true,
      singleActionRule: true,
      microMotion: true,
      heroVeo: false,
    },
  };

  it("Runway structured prompts do not output 30fps or negative-style prompt bodies", () => {
    const pack = buildRunwayPromptPack(
      base.predator,
      base.prey,
      base.env,
      base.arc,
      base.weather,
      base.runwayModel,
      base.emotionalTone,
      base.animalVibe,
      base.sceneDesc,
      base.quality
    );

    for (const shot of [pack.shot1, pack.shot2, pack.shot3, pack.shot4]) {
      expect(shot.pasteReady).not.toMatch(/\b30\s*fps\b/i);
      expect(shot.pasteReady).not.toMatch(/^(?:no|never|avoid|do not|don't)\b/im);
    }
  });

  it("Kling prompt length validator reports over-budget prompts", () => {
    const validation = validateKlingPromptLength("x".repeat(2501));

    expect(validation.length).toBe(2501);
    expect(validation.isOver).toBe(true);
    expect(validation.remaining).toBe(-1);
    expect(validation.warning).toBeTruthy();
  });

  it("hybrid workflow prompt pack preserves Runway / Kling / Kling / Runway order", () => {
    const workflow = buildFourShotWorkflowPromptPack({
      predator: base.predator,
      prey: base.prey,
      env: base.env,
      arc: base.arc,
      weather: base.weather,
      runwayModel: base.runwayModel,
      klingModel: base.klingModel,
      emotionalTone: base.emotionalTone,
      animalVibe: base.animalVibe,
      sceneDesc: base.sceneDesc,
      quality: base.quality,
    });

    expect(workflow.shot1.metadata?.engine).toBe("runway");
    expect(workflow.shot2.metadata?.engine).toBe("kling");
    expect(workflow.shot3.metadata?.engine).toBe("kling");
    expect(workflow.shot4.metadata?.engine).toBe("runway");
  });

  it("structured prompt objects expose the fields used by the UI", () => {
    const image = buildImagePromptCard(
      "Mountain Lion",
      "Mule Deer",
      "Forest Clearing",
      "Ambush attack",
      "golden hour rim light",
      "Canon EOS R5, 200mm wildlife lens",
      "natural fur breakup and clean paw detail",
      "Balanced Depth",
      "Golden Hour",
      "Raw Tension",
      "BBC Earth Documentary",
      "Readable forest edge standoff.",
      base.quality,
      "NANO_BANANA_2"
    );
    const kling = buildKlingPromptPack(
      base.predator,
      base.prey,
      base.env,
      base.arc,
      base.weather,
      base.klingModel,
      base.emotionalTone,
      base.animalVibe,
      base.sceneDesc,
      base.quality
    );
    const seedance = buildSeedancePromptPack(
      base.predator,
      base.prey,
      base.env,
      base.arc,
      base.weather,
      base.emotionalTone,
      base.animalVibe,
      base.sceneDesc,
      base.quality
    );

    expect(image.fullText.length).toBeGreaterThan(0);
    expect(image.pasteReady).toBe(image.fullText);
    expect(kling.shot2.audio).toContain("Audio:");
    expect(kling.shot2.settings?.length).toBeGreaterThan(0);
    expect(kling.shot2.metadata?.motionIntensity).toBeGreaterThan(0);
    expect(seedance.multiShotPrompt.pasteReady).toContain("Cut to");
  });

  it("uses cleaner continuity wording in motion-only Kling prompts", () => {
    const kling = buildKlingPromptPack(
      "Mountain Lion",
      "White-tailed Deer",
      "Rocky Mountain forest edge and open meadow",
      "Ambush attack",
      "Golden Hour",
      "Kling 3.0 Pro",
      "Raw Tension",
      "National Geographic Wild",
      "The deer reads the move late.",
      base.quality
    );

    expect(kling.shot1.pasteReady).not.toContain("same environment continuity");
    expect(kling.shot1.pasteReady).toContain("Preserve the input-frame terrain and light continuity");
    expect(kling.shot3.pasteReady).not.toContain("raw tension — both animals at the edge of movement");
    expect(kling.shot4.pasteReady).not.toContain("stable clean air");
  });
});

// WSTV-AUDIT-FIX: FIX-9 applied

describe("Runway paste-ready safety", () => {
  it("contains no negative instructions in any shot", () => {
    const quality = {
      realismMode: "Reference Locked" as const,
      motionOnlyI2V: true,
      referenceLock: true,
      singleActionRule: true,
      microMotion: true,
      heroVeo: false,
    };

    const pack = buildRunwayPromptPack(
      "Wolf",
      "Bull Elk",
      "Rocky Mountain meadow edge",
      "Chase and takedown",
      "Golden Hour",
      "Gen-4.5",
      "Raw Tension",
      "National Geographic Wild",
      "Readable first-frame pressure with clear subject spacing.",
      quality
    );

    const shots = [pack.shot1, pack.shot2, pack.shot3, pack.shot4];
    for (const shot of shots) {
      expect(shot.pasteReady).not.toMatch(/\b(no|avoid|never|do not|don't|do NOT)\b/i);
    }
  });
});

describe("Kling paste-ready safety", () => {
  it("contains no banned action verbs", () => {
    const BANNED = /\b(bite|maul|kill|blood|gore|takedown)\b/i;
    const quality = {
      realismMode: "Reference Locked" as const,
      motionOnlyI2V: true,
      referenceLock: true,
      singleActionRule: true,
      microMotion: true,
      heroVeo: false,
    };

    const pack = buildKlingPromptPack(
      "Wolf",
      "Bull Elk",
      "Rocky Mountain meadow edge",
      "Chase and takedown",
      "Golden Hour",
      "Kling 3.0 Pro",
      "Raw Tension",
      "National Geographic Wild",
      "Readable first-frame pressure with clear subject spacing.",
      quality
    );

    const shots = [pack.shot1, pack.shot2, pack.shot3, pack.shot4];
    for (const shot of shots) {
      expect(shot.pasteReady).not.toMatch(BANNED);
    }
  });
});

describe("Hybrid workflow engine routing", () => {
  it("assigns Runway to shots 1 and 4, Kling to shots 2 and 3", () => {
    const quality = {
      realismMode: "Reference Locked" as const,
      motionOnlyI2V: true,
      referenceLock: true,
      singleActionRule: true,
      microMotion: true,
      heroVeo: false,
    };

    const pack = buildHybridPromptPack(
      "Wolf",
      "Bull Elk",
      "Rocky Mountain meadow edge",
      "Chase and takedown",
      "Golden Hour",
      "Gen-4.5",
      "Kling 3.0 Pro",
      "Raw Tension",
      "National Geographic Wild",
      "Readable first-frame pressure with clear subject spacing.",
      quality
    );

    expect(pack.shot1.metadata?.engine).toBe("runway");
    expect(pack.shot2.metadata?.engine).toBe("kling");
    expect(pack.shot3.metadata?.engine).toBe("kling");
    expect(pack.shot4.metadata?.engine).toBe("runway");
  });
});


describe("Issue #47 — shared scenario context", () => {
  const quality = {
    realismMode: "Reference Locked",
    motionOnlyI2V: true,
    referenceLock: true,
    singleActionRule: true,
    microMotion: true,
    heroVeo: false,
  } as const;

  it("returns land pressure beats for mountain lion vs deer in forest meadow", () => {
    const context = buildPromptScenarioContext({
      predator: "Mountain Lion",
      prey: "White-tailed Deer",
      env: "Forest meadow edge",
      arc: "Ambush attack",
      weather: "Golden Hour",
      quality,
      engine: "runway",
    });

    expect(context.scenarioKind).toBe("land");
    expect(context.isShoreline).toBe(false);
    expect(context.isWaterForwardStrike).toBe(false);
    expect(context.pressurePredator).toContain("stronger visible pressure");
    expect(context.pressurePrey).toContain("defensive adjustment");
  });

  it("returns shoreline ambush beats for alligator vs wild boar in marsh", () => {
    const context = buildPromptScenarioContext({
      predator: "Alligator",
      prey: "Wild Boar",
      env: "Everglades marsh shoreline",
      arc: "Ambush attack",
      weather: "Overcast",
      quality,
      engine: "kling",
    });

    expect(context.scenarioKind).toBe("shoreline");
    expect(context.isShoreline).toBe(true);
    expect(context.isWaterForwardStrike).toBe(false);
    expect(context.pressurePredator).toContain("ambush pressure");
    expect(context.pressurePrey).toContain("bank");
  });

  it("returns water-forward shoreline beats for bald eagle vs salmon", () => {
    const context = buildPromptScenarioContext({
      predator: "Bald Eagle",
      prey: "Salmon",
      env: "Riverbank Reeds",
      arc: "Ambush attack",
      weather: "Dawn",
      quality,
      engine: "kling",
    });

    expect(context.scenarioKind).toBe("shoreline-water-forward");
    expect(context.isShoreline).toBe(true);
    expect(context.isWaterForwardStrike).toBe(true);
    expect(context.pressurePredator).toContain("shallow strike window");
    expect(context.pressurePrey).toContain("surface-break");
  });

  it("returns rut mirror-match flags and cues for bull elk", () => {
    const context = buildPromptScenarioContext({
      predator: "Bull Elk",
      prey: "Bull Elk",
      env: "Rocky Mountain meadow with rut-season footing",
      arc: "Giant vs giant clash",
      weather: "Frozen Dusk",
      quality,
      engine: "runway",
    });

    expect(context.scenarioKind).toBe("rut-mirror");
    expect(context.isRutMirrorMatch).toBe(true);
    expect(context.rutCue.room).toContain("antler room");
    expect(context.pressurePredator).toContain(context.rutCue.room);
  });

  it("returns land pack-hunt pressure beats for wolf pack vs bull elk", () => {
    const context = buildPromptScenarioContext({
      predator: "Wolf Pack",
      prey: "Bull Elk",
      env: "Rocky Mountain meadow",
      arc: "Pack hunting strategy",
      weather: "Golden Hour",
      quality,
      engine: "kling",
    });

    expect(context.scenarioKind).toBe("land");
    expect(context.habitatMode).toBe("land");
    expect(context.pressurePredator).toContain("stronger visible pressure");
    expect(context.pressurePrey).toContain("defensive adjustment");
  });
});

describe("Issue #47 — Runway and Kling refactor contracts", () => {
  const quality = {
    realismMode: "Reference Locked",
    motionOnlyI2V: true,
    referenceLock: true,
    singleActionRule: true,
    microMotion: true,
    heroVeo: false,
  } as const;

  it("keeps Runway full text guidance for FPS and no negative prompts", () => {
    const pack = buildRunwayPromptPack(
      "Wolf Pack",
      "Bull Elk",
      "Rocky Mountain meadow",
      "Pack hunting strategy",
      "Golden Hour",
      "Gen-4.5",
      "Raw Tension",
      "BBC Earth Documentary",
      "Both subjects are readable from frame one.",
      quality
    );

    expect(pack.shot1.fullText).toContain("FPS: 24 or 25");
    expect(pack.shot1.fullText).toContain("No negative prompt");
  });

  it("keeps Kling paste-ready narrative style while full breakdown still keeps labels", () => {
    const pack = buildKlingPromptPack(
      "Wolf Pack",
      "Bull Elk",
      "Rocky Mountain meadow",
      "Pack hunting strategy",
      "Golden Hour",
      "Kling 3.0 Pro",
      "Raw Tension",
      "BBC Earth Documentary",
      "Both subjects are readable from frame one.",
      quality
    );

    expect(pack.shot1.pasteReady).not.toContain("Shot:");
    expect(pack.shot1.pasteReady).not.toContain("Characters:");
    expect(pack.shot1.pasteReady).not.toContain("Action:");
    expect(pack.shot1.fullText).toContain("Characters:");
    expect(pack.shot1.fullText).toContain("Action:");
  });
});
