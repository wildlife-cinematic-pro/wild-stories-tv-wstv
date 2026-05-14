import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";
import type { Arc, GeneratedPackage, QualityOptions, Weather } from "@/types";
import { buildExportTxtFull } from "@/lib/export-text";
import {
  buildImagePrompt,
  buildGptImage2Prompt,
  buildShotImagePlan,
  buildRunwayShots,
  buildKlingShots,
  buildSeedanceShots,
  buildThumbnailPrompt,
  buildVoiceoverLine,
  buildKlingMultishotPromptCards,
  buildCapCutPlan,
  buildClipChaining,
} from "@/lib/prompt-builders";
import {
  buildCTA,
  build2026Hook,
  buildHashtags,
  buildHook,
  buildLongCaption,
  buildPlatformPack,
  buildSEOTitle,
  buildShortCaption,
  buildTags,
  buildAltTextPrompt,
} from "@/lib/platform-packs";

const quality: QualityOptions = {
  realismMode: "Reference Locked",
  motionOnlyI2V: true,
  referenceLock: true,
  singleActionRule: true,
  microMotion: true,
  heroVeo: false,
};

const repoExportsDir = join(process.cwd(), "exports");

function writeLiveExport(filename: string, text: string) {
  mkdirSync(repoExportsDir, { recursive: true });
  writeFileSync(join(repoExportsDir, filename), text, "utf8");
}

function makePackage(input: {
  predator: string;
  prey: string;
  env: string;
  arc: Arc;
  weather: Weather;
  sceneDesc: string;
}): GeneratedPackage {
  const {
    predator,
    prey,
    env,
    arc,
    weather,
    sceneDesc,
  } = input;

  const imagePrompt = buildImagePrompt(
    predator,
    prey,
    env,
    arc,
    "golden hour sunlight with realistic shadow direction",
    "Canon EOS R5, 400mm wildlife lens",
    "detailed fur texture, grounded contact, natural terrain detail",
    "Balanced Depth",
    weather,
    "Raw Tension",
    "National Geographic Wild",
    sceneDesc,
    quality,
    "NANO_BANANA_2"
  );

  const gptImage2Prompt = buildGptImage2Prompt(
    predator,
    prey,
    env,
    arc,
    "golden hour sunlight with realistic shadow direction",
    "Canon EOS R5, 400mm wildlife lens",
    "detailed fur texture, grounded contact, natural terrain detail",
    "Balanced Depth",
    weather,
    "Raw Tension",
    "National Geographic Wild",
    sceneDesc,
    quality
  );

  const runway = buildRunwayShots(
    predator,
    prey,
    env,
    arc,
    weather,
    "Gen-4.5",
    "Raw Tension",
    "National Geographic Wild",
    sceneDesc,
    quality
  );

  const kling = buildKlingShots(
    predator,
    prey,
    env,
    arc,
    weather,
    "Kling 3.0 Pro",
    "Raw Tension",
    "National Geographic Wild",
    sceneDesc,
    quality
  );

  const seedance = buildSeedanceShots(
    predator,
    prey,
    env,
    arc,
    weather,
    "Raw Tension",
    "National Geographic Wild",
    sceneDesc,
    quality
  );

  return {
    predatorName: predator,
    preyName: prey,
    arcName: arc,
    imagePrompt,
    gptImage2Prompt,
    negativePrompt: "",
    thumbnailPrompt: buildThumbnailPrompt(
      predator,
      prey,
      env,
      weather,
      "Raw Tension",
      "National Geographic Wild"
    ),
    voiceoverLine: buildVoiceoverLine(predator, prey, env, "Raw Tension"),
    runwayShots: [runway.shot1, runway.shot2, runway.shot3, runway.shot4],
    klingShots: [kling.shot1, kling.shot2, kling.shot3, kling.shot4],
    seedanceShots: [seedance.shot1, seedance.shot2, seedance.shot3, seedance.shot4],
    seedanceMultiShotPrompt: seedance.multiShotPrompt,
    seedanceWorkflowGuide: seedance.workflowGuide,
    shotImagePlan: buildShotImagePlan(predator, prey, env, arc, weather, quality),
    motionStrength: 70,
    capCutPlan: buildCapCutPlan(predator, arc, weather),
    clipChaining: buildClipChaining(predator, "HIGH"),
    hook: buildHook(predator, prey, arc),
    hook2026: build2026Hook(predator, prey, arc),
    caption: buildShortCaption(predator, prey, env, arc, { mode: "us-only" }),
    caption2026: buildLongCaption(predator, prey, env, arc, { mode: "us-only" }),
    cta: buildCTA(arc),
    hashtags: buildHashtags(predator, prey, arc, { count: 5 }),
    tags: buildTags(predator, prey, arc),
    tenIdeas: ["Idea 1"],
    shotPlan: [],
    runwayBundle: [runway.shot1, runway.shot2, runway.shot3, runway.shot4].join("\n\n---\n\n"),
    klingBundle: [kling.shot1, kling.shot2, kling.shot3, kling.shot4].join("\n\n---\n\n"),
    routingNote: "Primary workflow: hybrid 4-shot routing uses Runway for Shot 1 and Shot 4, and Kling for Shot 2 and Shot 3.",
    platformPack: buildPlatformPack(predator, prey, arc, env),
    seoTitle: buildSEOTitle(predator, prey, arc),
    altTextPrompt: buildAltTextPrompt(predator, prey, env, arc),
    sceneDesc,
  };
}

describe("live export TXT path", () => {
  it("removes clipped United States continuity suffixes from the exported TXT payload", () => {
    const data = makePackage({
      predator: "Mountain Lion",
      prey: "White-tailed Deer",
      env: "Rocky Mountain forest edge and open meadow",
      arc: "Ambush attack",
      weather: "Golden Hour",
      sceneDesc: "The deer reads the move late. Clear U.",
    });

    const text = buildExportTxtFull(data);
    writeFileSync("/tmp/wstv-live-export-mountain-lion.txt", text, "utf8");
    writeLiveExport("live-export-mountain-lion-white-tailed-deer.txt", text);

    expect(text).not.toMatch(/\bClear U\.(?=\s|$)/);
    expect(text).toContain("Clear U.S. wildlife setup.");
    expect(text).toContain("FRAME HEURISTICS");
    expect(text).toContain("GPT IMAGE 2 BACKUP PROMPT");
    expect(text).toContain("=== CREATOR QA PACK ===");
    expect(text).toContain("=== MASTER IMAGE QUALITY CHECK ===");
    expect(text).toContain("=== RUNWAY MOTION-FIRST PROMPT ===");
    expect(text).toContain("=== FACEBOOK VIRAL PACK ===");
    expect(text).toContain("=== FAILURE FIX GUIDE ===");
    expect(text).toContain("=== COMPACT NEGATIVE PROMPT ===");
    expect(text).not.toMatch(/balanced first-frame clarity|balanced facebook cover readability|context fit/i);
    expect(text).not.toContain("same environment continuity");
    expect(text).not.toContain("stable clean air");
  });

  it("writes the live Cougar vs Mule Deer export into the repo without clipped continuity text", () => {
    const data = makePackage({
      predator: "Cougar",
      prey: "Mule Deer",
      env: "Rocky Mountain forest edge and open meadow",
      arc: "Ambush attack",
      weather: "Golden Hour",
      sceneDesc: "The mule deer reads the move late. Clear U.",
    });

    const text = buildExportTxtFull(data);
    writeFileSync("/tmp/wstv-live-export-cougar-mule-deer.txt", text, "utf8");
    writeLiveExport("live-export-cougar-mule-deer.txt", text);

    expect(text).toContain("Predator: Cougar");
    expect(text).toContain("Prey: Mule Deer");
    expect(text).not.toMatch(/\bClear U\.(?=\s|$)/);
  });

  it("keeps Grizzly Bear vs Bison Yellowstone exports land-correct in the actual TXT payload", () => {
    const data = makePackage({
      predator: "Grizzly Bear",
      prey: "Bison",
      env: "Yellowstone meadow, river corridor, and open wilderness with strong clash readability and clean subject spacing",
      arc: "Giant vs giant clash",
      weather: "Golden Hour",
      sceneDesc: "Broad Yellowstone clash with clean readable spacing.",
    });

    const text = buildExportTxtFull(data);
    writeFileSync("/tmp/wstv-live-export-grizzly-bison.txt", text, "utf8");
    writeLiveExport("live-export-grizzly-bison.txt", text);

    expect(text).not.toMatch(
      /surface ripples|wave movement|caustic reflections|suspended particles drifting in water|water ripples/i
    );
    expect(text).toMatch(/grass sway|background vegetation movement|dry wind|terrain|open-plain ambience/i);
  });
  it("labels Kling multishot export as 3-shot and keeps Seedance separate", () => {
    const data = makePackage({
      predator: "Crocodile",
      prey: "Warthog",
      env: "dry-season African muddy waterhole",
      arc: "Ambush attack",
      weather: "Golden Hour",
      sceneDesc: "The warthog notices too late at the waterline.",
    });
    const klingMultishotShots = buildKlingMultishotPromptCards(
      "Crocodile",
      "Warthog",
      "dry-season African muddy waterhole",
      "Ambush attack",
      "Golden Hour",
      "Kling 3.0 Pro",
      "Raw Tension",
      "National Geographic Wild",
      "The warthog notices too late at the waterline.",
      quality
    );

    const text = buildExportTxtFull({
      ...data,
      klingMultishotShots: klingMultishotShots.map((shot) => shot.fullText),
      structuredPrompts: {
        klingMultishotShots,
      },
    });

    expect(klingMultishotShots).toHaveLength(3);
    expect(data.seedanceMultiShotPrompt).toContain("Shot 4");
    expect(text).toContain("=== KLING MULTISHOT 3-SHOT PROMPTS ===");
    expect(text).not.toContain("=== KLING MULTISHOT 4-SHOT PROMPTS ===");
  });

});
