import type { GeneratedPackage } from "@/types";

function safeStr(v: unknown) {
  if (typeof v === "string") return v.trim();
  if (Array.isArray(v)) return v.map(String).join("\n").trim();
  return String(v ?? "").trim();
}

function finalizeExportText(text: string) {
  return String(text ?? "")
    .replace(
      /Yellowstone meadow,\s*river corridor,\s*and open wilderness with strong clash readability and clean subject spacing/gi,
      "Yellowstone meadow and open wilderness with strong clash readability and clean subject spacing"
    )
    .replace(/\bClear United States wildlife setup\b/g, "Clear U.S. wildlife setup")
    .replace(/\bUnited States-friendly wildlife setup\b/g, "U.S.-friendly wildlife setup")
    .replace(/\bUnited States-readable wildlife and habitats\b/g, "strong U.S. wildlife framing")
    .replace(/\bfor a United States wildlife reel\b/g, "for a U.S. wildlife reel")
    .replace(/\bFast United States wildlife opener\b/g, "Fast U.S. wildlife opener")
    .replace(/\bClear U\.(?=\s|$)/g, "Clear U.S. wildlife setup.")
    .replace(/\bfor a U\.(?=\s|$)/g, "for a U.S. wildlife reel.")
    .replace(/\bFast U\.(?=\s|$)/g, "Fast U.S. wildlife opener.")
    .replace(/\bU\.(?=\s|$)/g, "United States")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildTwoPartText(data: GeneratedPackage) {
  if (!data.twoPartViralOverview) return "";

  return [
    "=== TWO-PART VIRAL PRESET ===",
    data.twoPartViralOverview
      ? `OVERVIEW\n${safeStr(data.twoPartViralOverview)}`
      : "",
    data.twoPartWorkflowGuide
      ? `WORKFLOW GUIDE\n${safeStr(data.twoPartWorkflowGuide)}`
      : "",
    data.twoPartPart1Hook
      ? `PART 1 HOOK\n${safeStr(data.twoPartPart1Hook)}`
      : "",
    data.twoPartPart1Caption
      ? `PART 1 CAPTION\n${safeStr(data.twoPartPart1Caption)}`
      : "",
    data.twoPartPart1Draft
      ? `PART 1 DRAFT\n${safeStr(data.twoPartPart1Draft)}`
      : "",
    data.twoPartPart1Final
      ? `PART 1 FINAL\n${safeStr(data.twoPartPart1Final)}`
      : "",
    data.twoPartPart2Hook
      ? `PART 2 HOOK\n${safeStr(data.twoPartPart2Hook)}`
      : "",
    data.twoPartPart2Caption
      ? `PART 2 CAPTION\n${safeStr(data.twoPartPart2Caption)}`
      : "",
    data.twoPartPart2Draft
      ? `PART 2 DRAFT\n${safeStr(data.twoPartPart2Draft)}`
      : "",
    data.twoPartPart2Final
      ? `PART 2 FINAL\n${safeStr(data.twoPartPart2Final)}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildCapCutScriptText(data: GeneratedPackage) {
  if (!data.capCutScript) return "";

  return [
    "=== CAPCUT SCRIPT ===",
    `Duration: ${data.capCutScript.totalDuration}`,
    `Aspect Ratio: ${data.capCutScript.aspectRatio}`,
    `FPS: ${data.capCutScript.fps}`,
    `Music Mood: ${data.capCutScript.musicMood}`,
    "",
    ...data.capCutScript.beats.map(
      (b) =>
        `[${b.timeIn} → ${b.timeOut}] ${b.shotRef}\n` +
        `Text: ${b.onScreenText}\n` +
        `Transition: ${b.transition}\n` +
        `SFX: ${b.sfx}\n` +
        `Music: ${b.musicNote}`
    ),
    "",
    `Export: ${data.capCutScript.exportSettings}`,
  ].join("\n");
}

function buildAnimalBehaviorText(data: GeneratedPackage) {
  if (!data.animalBehavior) return "";

  return [
    `=== ANIMAL BEHAVIOR (${safeStr(data.predatorName ?? "Subject")}) ===`,
    `PRE-ATTACK\n${data.animalBehavior.preAttackSignals.join("\n")}`,
    `MOTION\n${data.animalBehavior.naturalMotion.join("\n")}`,
    `SOUND\n${data.animalBehavior.soundDesign.join("\n")}`,
    `BODY LANGUAGE\n${data.animalBehavior.bodyLanguage.join("\n")}`,
    `FACTS\n${data.animalBehavior.habitatFacts.join("\n")}`,
    `PROMPT INJECTION\n${data.animalBehavior.promptInjection}`,
  ].join("\n\n");
}

function buildSoundDesignText(data: GeneratedPackage) {
  if (!data.soundDesignPack) return "";

  return [
    "=== SOUND DESIGN PACK ===",
    `Shot 1 Ambient: ${safeStr(data.soundDesignPack.shot1_ambient)}`,
    `Shot 1 Animal: ${safeStr(data.soundDesignPack.shot1_animal)}`,
    `Shot 2 Impact: ${safeStr(data.soundDesignPack.shot2_impact)}`,
    `Shot 2 Animal: ${safeStr(data.soundDesignPack.shot2_animal)}`,
    `Shot 3 Resolve: ${safeStr(data.soundDesignPack.shot3_resolve)}`,
    `Music Mood: ${safeStr(data.soundDesignPack.musicMood)}`,
    `Kling Audio Prompt:\n${safeStr(data.soundDesignPack.klingAudioPrompt)}`,
    `CapCut SFX:\n${data.soundDesignPack.capCutSFX.join("\n")}`,
  ].join("\n\n");
}


function buildFirstFrameOverlayText(data: GeneratedPackage) {
  const facebook = data.platformPack?.facebook;
  if (!facebook) return "";

  return [
    "=== FACEBOOK FIRST-FRAME OVERLAY ===",
    facebook.overlayGuidance
      ? [
          `Placement: ${facebook.overlayGuidance.placement}`,
          `Text length: ${facebook.overlayGuidance.textLength}`,
          `Opener: ${facebook.overlayGuidance.opener}`,
          `Audio: ${facebook.overlayGuidance.audio}`,
          `Tone: ${facebook.overlayGuidance.tone}`,
        ].join("\n")
      : "",
    facebook.facebookOverlayPresets?.length
      ? [
          "FACEBOOK OVERLAY PRESETS",
          facebook.facebookOverlayPresets
            .map(
              (preset) =>
                `${preset.label}
${safeStr(preset.text)}
Note: ${safeStr(preset.note)}`
            )
            .join("\n\n"),
        ].join("\n\n")
      : facebook.hookFormattingPresets?.length
        ? [
            "FACEBOOK OVERLAY PRESETS",
            facebook.hookFormattingPresets
              .map(
                (preset) =>
                  `${preset.label}
${safeStr(preset.text)}
Note: ${safeStr(preset.note)}`
              )
              .join("\n\n"),
          ].join("\n\n")
        : "",
    facebook.facebookCoverFramePresets?.length
      ? [
          "FACEBOOK COVER-FRAME TEXT PRESETS",
          facebook.facebookCoverFramePresets
            .map(
              (preset) =>
                `${preset.label}
${safeStr(preset.text)}
Note: ${safeStr(preset.note)}`
            )
            .join("\n\n"),
        ].join("\n\n")
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function buildCopyAllPacksText(data: GeneratedPackage) {
  const seedance = (data.seedanceShots ?? [])
    .map((s, i) => `Seedance Shot ${i + 1}\n${safeStr(s)}`)
    .join("\n\n---\n\n");

  const runway = (data.runwayShots ?? [])
    .map((s, i) => `Runway Shot ${i + 1}\n${safeStr(s)}`)
    .join("\n\n---\n\n");

  const kling = (data.klingShots ?? [])
    .map((s, i) => `Kling Shot ${i + 1}\n${safeStr(s)}`)
    .join("\n\n---\n\n");

  const twoPart = buildTwoPartText(data);
  const capCutScript = buildCapCutScriptText(data);
  const animalBehavior = buildAnimalBehaviorText(data);
  const soundDesign = buildSoundDesignText(data);
  const firstFrameOverlay = buildFirstFrameOverlayText(data);
  const shotImagePlanText = (data.shotImagePlan ?? [])
    .map(
      (plan, i) =>
        `Image ${i + 1} — ${safeStr(plan.title)}\nSource: ${
          plan.source === "master" ? "Master image" : "Previous shot image"
        }\n${safeStr(plan.prompt)}`
    )
    .join("\n\n---\n\n");

  return finalizeExportText([
    `WSTV EXPORT PACK (Pro 2026)`,
    `Predator: ${safeStr(data.predatorName)}`,
    `Prey: ${safeStr(data.preyName)}`,
    `Arc: ${safeStr(data.arcName)}`,
    data.routingNote ? `Routing: ${safeStr(data.routingNote)}` : "",
    "",
    `=== 4-SHOT IMAGE PLAN (NANO BANANA CONTINUITY) ===`,
    shotImagePlanText || "(none)",
    "",
    `=== SEEDANCE PACK (I2V | simple motion-first prompting | NO negatives) ===`,
    seedance || "(none)",
    "",
    `=== SEEDANCE MULTI-SHOT ===`,
    safeStr((data as Record<string, unknown>).seedanceMultiShotPrompt) || "(none)",
    "",
    `=== RUNWAY PACK (Gen-4.5 | 24/25fps | 720p | NO negatives) ===`,
    runway || "(none)",
    "",
    `=== KLING PACK (3.0 | WSTV action workflow | Negatives OK) ===`,
    kling || "(none)",
    "",
    `=== KLING DIRECT (15s) ===`,
    safeStr((data as Record<string, unknown>).klingNative15s) || "(none)",
    "",
    `=== KLING 6-SHOT (DIRECT) ===`,
    safeStr((data as Record<string, unknown>).klingSixShot) || "(none)",
    "",
    twoPart,
    "",
    capCutScript,
    "",
    animalBehavior,
    "",
    soundDesign,
    "",
    firstFrameOverlay,
  ]
    .filter(Boolean)
    .join("\n"));
}

export function buildExportTxtFull(data: GeneratedPackage) {
  const packs = buildCopyAllPacksText(data);

  return finalizeExportText([
    packs,
    "",
    `=== CORE PROMPTS ===`,
    `NANO BANANA 2 / GEMINI MASTER IMAGE PROMPT\n${safeStr(data.imagePrompt)}`,
    "",
    `NEGATIVE PROMPT\n${safeStr(
      (data as Record<string, unknown>).negativePrompt
    )}`,
    "",
    `THUMBNAIL PROMPT\n${safeStr(
      (data as Record<string, unknown>).thumbnailPrompt
    )}`,
    "",
    `VOICEOVER\n${safeStr((data as Record<string, unknown>).voiceoverLine)}`,
    "",
    `CAPCUT PLAN\n${safeStr((data as Record<string, unknown>).capCutPlan)}`,
    "",
    `CLIP CHAINING\n${safeStr(
      (data as Record<string, unknown>).clipChaining
    )}`,
    "",
    `HOOK\n${safeStr((data as Record<string, unknown>).hook)}`,
    "",
    `CAPTION\n${safeStr((data as Record<string, unknown>).caption)}`,
    "",
    `CTA\n${safeStr((data as Record<string, unknown>).cta)}`,
    "",
    `HASHTAGS\n${safeStr((data as Record<string, unknown>).hashtags)}`,
    "",
    `TAGS\n${safeStr((data as Record<string, unknown>).tags)}`,
  ].join("\n"));
}
