import type {
  Arc,
  Weather,
  EmotionalTone,
  AnimalVibe,
  CameraAnglePreset,
  QualityOptions,
  KlingModel,
  StructuredPrompt,
} from "@/types";

import { animalVibePrompt, emotionalTonePrompt, weatherVariants } from "@/lib/predator-data";
import { KLING_STYLE_NOTE, arcCfgScale } from "@/lib/model-specs";
import { getWildlifeLeadCatalogEntry } from "@/lib/wildlife-lead-catalog";

import {
  getHabitatMode,
  getSafeArcPrint,
  oneActionArcBeat,
  buildMicroMotionLine,
} from "@/lib/prompt-builders/habitat";
import {
  buildQualityLead,
  getKlingMotionIntensity,
  buildKlingCharacterLine,
  buildKlingLocationLine,
  buildKlingExtraLine,
  formatActionSubject,
  klingWidePhysicsRule,
  maybeGuard,
  buildKlingAudioPrompt,
  buildKlingAudioShort,
  type FourShotPromptPack,
  buildStructuredPrompt,
  promptPackToLegacyText,
} from "@/lib/prompt-builders/shared";
import { buildPromptScenarioContext } from "@/lib/prompt-builders/scenario-context";
import { sanitizeForEngine } from "@/lib/prompt-builders/safety-vocabulary";
import {
  KLING_CHAR_LIMIT,
  KLING_FRAMES_CHAR_LIMIT,
  KLING_FRAMES_TARGET_MAX,
  KLING_MULTISHOT_SHOT_CHAR_LIMIT,
  validateKlingPromptLength,
  clipPromptContext,
  sanitizeImageEnv,
  sanitizeWeatherPhrase,
  sanitizeVideoBeatText,
  cleanupPromptArtifacts,
  compactEnvironmentPhrase,
  compactNegativePrompt,
  clampPromptToCharLimit,
} from "@/lib/prompt-builders/sanitizers";

export type KlingPromptPack = FourShotPromptPack<StructuredPrompt>;

export function buildKlingPromptPack(
  predator: string,
  prey: string,
  env: string,
  arc: Arc,
  weather: Weather,
  model: KlingModel,
  emotionalTone: EmotionalTone,
  animalVibe: AnimalVibe,
  sceneDesc?: string,
  quality?: QualityOptions,
  cameraAnglePreset: CameraAnglePreset = "Auto"
): KlingPromptPack {
  const note = KLING_STYLE_NOTE[model];
  const tone = emotionalTonePrompt[emotionalTone];
  const vibe = animalVibePrompt[animalVibe];

  const qLead = buildQualityLead(quality, "kling");
  const context = sceneDesc?.trim() ? `\nScene continuity: ${clipPromptContext(sceneDesc.trim())}` : "";

  const refLine = quality?.referenceLock
    ? "Reference lock active — enable 'Bind Subject' (Elements 3.0) to preserve exact subject identity from the input frame."
    : "Preserve overall continuity from the source frame.";

  const motionRule = quality?.motionOnlyI2V
    ? "Motion-only prompting active — keep Kling focused on subject movement first, add background or camera movement only when needed, and avoid re-describing the source image."
    : "Keep visual restatement minimal.";

  const singleRule = quality?.singleActionRule
    ? "One action beat only — no stacked actions."
    : "Keep action focused.";

  const wideRule = klingWidePhysicsRule();
  const scenario = buildPromptScenarioContext({
    predator,
    prey,
    env,
    arc,
    weather,
    quality,
    cameraAnglePreset,
    engine: "kling",
  });
  const {
    gateOn,
    isAquatic,
    isShoreline,
    isWaterForwardStrike,
    isRutMirrorMatch,
    micro,
    rutCue,
    cameraPromptTail,
    cameraBreakdownLine,
    worldPlateContinuity,
    beat1: s1,
    beat3: s3,
    beat4: s4,
  } = scenario;

  const mi1 = getKlingMotionIntensity(arc, "establish");
  const mi3 = getKlingMotionIntensity(arc, "action");
  const mi4 = getKlingMotionIntensity(arc, "aftermath");
  const mi2 = Number(((mi1 + mi3) / 2).toFixed(2));

  const audio1 = buildKlingAudioPrompt(predator, prey, env, weather, arc, "establish");
  const audio2 = buildKlingAudioPrompt(predator, prey, env, weather, arc, "action");
  const audio3 = buildKlingAudioPrompt(predator, prey, env, weather, arc, "action");
  const audio4 = buildKlingAudioPrompt(predator, prey, env, weather, arc, "aftermath");

  const characterLine = buildKlingCharacterLine(predator, prey, quality?.motionOnlyI2V);
  const locationLine = buildKlingLocationLine(env, weather, quality?.motionOnlyI2V);

  const baseExtra1 = isAquatic
    ? `${micro}. Photorealistic wildlife documentary. 9:16 vertical.`
    : isShoreline
      ? isWaterForwardStrike
        ? `shoreline spray, surface break, bank-edge reaction, ${micro}. Photorealistic wildlife documentary. 9:16 vertical.`
        : `shoreline spray, disturbed shallows, muddy bank reaction, ${micro}. Photorealistic wildlife documentary. 9:16 vertical.`
      : `${micro}. Photorealistic wildlife documentary. 9:16 vertical.`;

  const extra1 =
    quality?.motionOnlyI2V || quality?.referenceLock
      ? baseExtra1
      : `${baseExtra1} ${tone.video}. ${vibe.style}.`;

  const baseExtra3 = isAquatic
    ? `${micro}.`
    : isShoreline
      ? isWaterForwardStrike
        ? `residual shoreline splash, surface rings settling, ${micro}.`
        : `residual splash rings, muddy bank settling, ${micro}.`
      : `${micro}.`;

  const extra3 = quality?.motionOnlyI2V
    ? baseExtra3
    : `${baseExtra3} ${vibe.style}.`;

  const pressurePredator = isAquatic
    ? `${predator} leans into stronger visible water pressure while staying controlled`
    : `${predator} ${scenario.pressurePredator}`;

  const pressurePrey = isAquatic
    ? `${prey} tightens posture and makes one readable defensive adjustment in the current`
    : isShoreline && !isWaterForwardStrike
      ? `${prey} lowers into one readable defensive footing adjustment near the bank`
      : `${prey} ${scenario.pressurePrey.replace(
          "one defensive adjustment",
          "one readable defensive adjustment"
        )}`;

  return {
    shot1: buildStructuredPrompt({
      fullText: `KLING SHOT 1 — OPENING TENSION [${model}]
${note}
${qLead}
${refLine}
${motionRule}
${singleRule}
Motion intensity: ${mi1.toFixed(2)}
Opening priority: both subjects fully readable from frame one, locked eye-line, clear spacing, immediate visible tension.
${maybeGuard(s1.guardLine)}${context}

═══ PASTE-READY KLING PROMPT (copy this block into Kling) ═══
${sanitizeVideoBeatText(isAquatic
  ? `Wide opening hold with a subtle push-in.${cameraPromptTail} ${predator} holds controlled pressure through the water on the left. ${prey} stays fully alert and reactive on the right. Both subjects are fully readable from frame one with locked eye-line, clear spacing, and immediate visible tension. ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. ${extra1} Then both subjects hold position.`
  : isShoreline
    ? isWaterForwardStrike
      ? `Wide opening hold with a subtle push-in.${cameraPromptTail} ${predator} holds low at the bank with the shallow strike window visible on the left. ${prey} stays just off the bank with one tense near-surface hold on the right. Both subjects are fully readable from frame one with locked eye-line, clear bank-edge spacing, and immediate visible tension. ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. ${extra1} Then both subjects hold position.`
      : `Wide opening hold with a subtle push-in.${cameraPromptTail} ${predator} holds visible pressure at the waterline on the left. ${prey} stays fully alert near the bank on the right. Both subjects are fully readable from frame one with locked eye-line, clear spacing, and immediate visible tension. ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. ${extra1} Then both subjects hold position.`
    : isRutMirrorMatch
      ? `Wide opening hold with a subtle push-in.${cameraPromptTail} ${predator} holds the ${rutCue.line} with ${rutCue.room} on the left. ${prey} answers on the right with matching shoulder tension and planted footing. Both subjects are fully readable from frame one with locked eye-line, clear spacing, and immediate visible dominance. ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. ${extra1} Then both subjects hold position.`
      : `Wide opening hold with a subtle push-in.${cameraPromptTail} ${formatActionSubject(predator, s1.predatorBeat)}. ${prey} ${s1.preyBeat}. Both subjects are fully readable from frame one with locked eye-line, clear spacing, and immediate visible tension. ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. ${extra1} Then both subjects hold position.`
)}

─── FULL BREAKDOWN (reference only) ───
Characters: ${characterLine.replace(/^Characters:\s*/i, "")}
Action: ${formatActionSubject(predator, s1.predatorBeat)}. ${prey} ${s1.preyBeat}.
${locationLine}${cameraBreakdownLine}
Extra: ${buildKlingExtraLine(extra1, quality?.motionOnlyI2V)}

${audio1}

Kling settings: Motion intensity ${mi1.toFixed(2)} | Enable Bind Subject for identity lock | Negative prompt: use the Kling Negative Prompt card`,
      pasteReady: sanitizeForEngine(sanitizeVideoBeatText(isAquatic
        ? `Wide opening hold with a subtle push-in.${cameraPromptTail} ${predator} holds controlled pressure through the water on the left. ${prey} stays fully alert and reactive on the right. Both subjects are fully readable from frame one with locked eye-line, clear spacing, and immediate visible tension. ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. ${extra1} Then both subjects hold position.`
        : isShoreline
          ? isWaterForwardStrike
            ? `Wide opening hold with a subtle push-in.${cameraPromptTail} ${predator} holds low at the bank with the shallow strike window visible on the left. ${prey} stays just off the bank with one tense near-surface hold on the right. Both subjects are fully readable from frame one with locked eye-line, clear bank-edge spacing, and immediate visible tension. ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. ${extra1} Then both subjects hold position.`
            : `Wide opening hold with a subtle push-in.${cameraPromptTail} ${predator} holds visible pressure at the waterline on the left. ${prey} stays fully alert near the bank on the right. Both subjects are fully readable from frame one with locked eye-line, clear spacing, and immediate visible tension. ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. ${extra1} Then both subjects hold position.`
          : isRutMirrorMatch
            ? `Wide opening hold with a subtle push-in.${cameraPromptTail} ${predator} holds the ${rutCue.line} with ${rutCue.room} on the left. ${prey} answers on the right with matching shoulder tension and planted footing. Both subjects are fully readable from frame one with locked eye-line, clear spacing, and immediate visible dominance. ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. ${extra1} Then both subjects hold position.`
            : `Wide opening hold with a subtle push-in.${cameraPromptTail} ${formatActionSubject(predator, s1.predatorBeat)}. ${prey} ${s1.preyBeat}. Both subjects are fully readable from frame one with locked eye-line, clear spacing, and immediate visible tension. ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. ${extra1} Then both subjects hold position.`
      ), "kling"),
      audio: audio1,
      settings: [
        `Motion intensity ${mi1.toFixed(2)}`,
        "Enable Bind Subject for identity lock",
        "Negative prompt: use the Kling Negative Prompt card",
      ],
      metadata: {
        engine: "kling",
        shotKey: "shot1",
        title: `Kling Shot 1 — Opening Tension [${model}]`,
        motionIntensity: mi1,
        variant: "single-shot",
      },
    }),
    shot2: buildStructuredPrompt({
      fullText: `KLING SHOT 2 — PRESSURE BUILD (WIDE${gateOn ? " + ONE-ACTION" : ""}) [${model}]
${note}
${qLead}
${refLine}
${motionRule}
${singleRule}
${wideRule}
Motion intensity: ${mi2.toFixed(2)}
Action priority: both subjects fully visible, clear predator-to-prey line, readable spacing, no overlap.
${context}

═══ PASTE-READY KLING PROMPT (copy this block into Kling) ═══
${sanitizeVideoBeatText(isAquatic
  ? `Wide pressure-build tracking shot with a subtle forward creep.${cameraPromptTail} ${pressurePredator}. ${pressurePrey}. Clear predator-to-prey line, readable spacing, no overlap. Water displacement and current pressure build naturally. ${worldPlateContinuity} ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. Then both subjects settle into a controlled hold.`
  : isShoreline
    ? isWaterForwardStrike
      ? `Wide pressure-build tracking shot with a subtle forward creep.${cameraPromptTail} ${pressurePredator}. ${pressurePrey}. Clear predator-to-prey line, readable spacing, no overlap. Bank-edge splash, shoreline reaction, and surface break build naturally. ${worldPlateContinuity} ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. Then both subjects settle into a controlled hold.`
      : `Wide pressure-build tracking shot with a subtle forward creep.${cameraPromptTail} ${pressurePredator}. ${pressurePrey}. Clear predator-to-prey line, readable spacing, no overlap. Splash and muddy bank response build naturally. ${worldPlateContinuity} ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. Then both subjects settle into a controlled hold.`
    : isRutMirrorMatch
      ? `Wide pressure-build tracking shot with a subtle forward creep.${cameraPromptTail} ${pressurePredator}. ${pressurePrey}. Clear clash line, readable spacing, no overlap. Hoof traction, planted footing, and heavy shoulder pressure stay controlled. ${worldPlateContinuity} ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. Then both subjects settle into a controlled hold.`
      : `Wide pressure-build tracking shot with a subtle forward creep.${cameraPromptTail} ${pressurePredator}. ${pressurePrey}. Clear predator-to-prey line, readable spacing, no overlap. Grounded weight transfer and surface response stay controlled. ${worldPlateContinuity} ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. Then both subjects settle into a controlled hold.`
)}

─── FULL BREAKDOWN (reference only) ───
Characters: ${characterLine.replace(/^Characters:\s*/i, "")}
Action: ${pressurePredator}. ${pressurePrey}.
${locationLine}${cameraBreakdownLine}
Extra: ${buildKlingExtraLine(
  isAquatic
    ? `Surface response, readable water pressure, ${micro}. Physics priority: coherent limbs, controlled spacing, rising tension`
    : isShoreline
      ? isWaterForwardStrike
        ? `Surface break, bank-edge splash, shoreline reaction, ${micro}. Physics priority: coherent limbs, clean separation, readable strike timing`
        : `Splash response, muddy bank displacement, shallow-water disturbance, ${micro}. Physics priority: coherent limbs, grounded traction, readable spacing`
      : isRutMirrorMatch
        ? `Hoof traction, planted footing, ${micro}. Physics priority: coherent limbs, heavy shoulder transfer, readable clash spacing`
        : `Surface response, grounded contact, ${micro}. Physics priority: coherent limbs, grounded weight, readable spacing`,
  quality?.motionOnlyI2V
)}

${audio2}

Kling settings: Motion intensity ${mi2.toFixed(2)} | WIDE framing enforced | Use Shot 1 last frame only if it remains a clean full-body handoff frame; otherwise use the master still or a manually selected clean reference frame`,
      pasteReady: sanitizeForEngine(sanitizeVideoBeatText(isAquatic
        ? `Wide pressure-build tracking shot with a subtle forward creep.${cameraPromptTail} ${pressurePredator}. ${pressurePrey}. Clear predator-to-prey line, readable spacing, no overlap. Water displacement and current pressure build naturally. ${worldPlateContinuity} ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. Then both subjects settle into a controlled hold.`
        : isShoreline
          ? isWaterForwardStrike
            ? `Wide pressure-build tracking shot with a subtle forward creep.${cameraPromptTail} ${pressurePredator}. ${pressurePrey}. Clear predator-to-prey line, readable spacing, no overlap. Bank-edge splash, shoreline reaction, and surface break build naturally. ${worldPlateContinuity} ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. Then both subjects settle into a controlled hold.`
            : `Wide pressure-build tracking shot with a subtle forward creep.${cameraPromptTail} ${pressurePredator}. ${pressurePrey}. Clear predator-to-prey line, readable spacing, no overlap. Splash and muddy bank response build naturally. ${worldPlateContinuity} ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. Then both subjects settle into a controlled hold.`
          : isRutMirrorMatch
            ? `Wide pressure-build tracking shot with a subtle forward creep.${cameraPromptTail} ${pressurePredator}. ${pressurePrey}. Clear clash line, readable spacing, no overlap. Hoof traction, planted footing, and heavy shoulder pressure stay controlled. ${worldPlateContinuity} ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. Then both subjects settle into a controlled hold.`
            : `Wide pressure-build tracking shot with a subtle forward creep.${cameraPromptTail} ${pressurePredator}. ${pressurePrey}. Clear predator-to-prey line, readable spacing, no overlap. Grounded weight transfer and surface response stay controlled. ${worldPlateContinuity} ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. Then both subjects settle into a controlled hold.`
      ), "kling"),
      audio: audio2,
      settings: [
        `Motion intensity ${mi2.toFixed(2)}`,
        "WIDE framing enforced",
        "Use clean Shot 1 handoff frame only",
      ],
      metadata: {
        engine: "kling",
        shotKey: "shot2",
        title: `Kling Shot 2 — Pressure Build [${model}]`,
        motionIntensity: mi2,
        variant: "single-shot",
      },
    }),
    shot3: buildStructuredPrompt({
      fullText: `KLING SHOT 3 — PEAK ACTION (WIDE${gateOn ? " + ONE-ACTION" : ""}) [${model}]
${note}
${qLead}
${refLine}
${motionRule}
${singleRule}
${wideRule}
Motion intensity: ${mi3.toFixed(2)}
Action priority: both subjects fully visible, readable force, clear predator-to-prey spacing, no overlap.
${maybeGuard(s3.guardLine)}${context}

═══ PASTE-READY KLING PROMPT (copy this block into Kling) ═══
${sanitizeVideoBeatText(isAquatic
  ? `Wide peak-action read with restrained handheld energy. ${formatActionSubject(predator, s3.predatorBeat)}. ${prey} ${s3.preyBeat}. Clear predator-to-prey spacing stays readable, no overlap. Water displacement and turbulence stay forceful but controlled. ${worldPlateContinuity} ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. Then both subjects ease into a stable wide stance.`
  : isShoreline
    ? isWaterForwardStrike
      ? `Wide peak-action read with restrained handheld energy. ${formatActionSubject(predator, s3.predatorBeat)}. ${prey} ${s3.preyBeat}. Clear predator-to-prey spacing stays readable, no overlap. Surface break, bank-edge splash, and shoreline reaction stay forceful but controlled. ${worldPlateContinuity} ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. Then both subjects ease into a stable wide stance.`
      : `Wide peak-action read with restrained handheld energy. ${formatActionSubject(predator, s3.predatorBeat)}. ${prey} ${s3.preyBeat}. Clear predator-to-prey spacing stays readable, no overlap. Splash and muddy bank response stay forceful but controlled. ${worldPlateContinuity} ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. Then both subjects ease into a stable wide stance.`
    : isRutMirrorMatch
      ? `Wide peak-action read with restrained handheld energy. ${predator} loads weight and commits one heavy clash beat while keeping ${rutCue.room}. ${prey} answers with one grounded shove or recoil without losing planted footing. Clear clash spacing stays readable, no overlap. Hoof traction and heavy shoulder transfer stay forceful but controlled. ${worldPlateContinuity} ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. Then both subjects ease into a stable wide stance.`
      : `Wide peak-action read with restrained handheld energy. ${formatActionSubject(predator, s3.predatorBeat)}. ${prey} ${s3.preyBeat}. Clear predator-to-prey spacing stays readable, no overlap. Grounded weight transfer and surface response stay forceful but controlled. ${worldPlateContinuity} ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. Then both subjects ease into a stable wide stance.`
)}

─── FULL BREAKDOWN (reference only) ───
Characters: ${characterLine.replace(/^Characters:\s*/i, "")}
Action: ${formatActionSubject(predator, s3.predatorBeat)}. ${prey} ${s3.preyBeat}.
${locationLine}${cameraBreakdownLine}
Extra: ${buildKlingExtraLine(extra3, quality?.motionOnlyI2V)}

${audio3}

Kling settings: Motion intensity ${mi3.toFixed(2)} | WIDE framing enforced | Use Shot 2 last frame only if it remains a clean full-body handoff frame; otherwise use the master still or a manually selected clean continuity frame`,
      pasteReady: sanitizeForEngine(sanitizeVideoBeatText(isAquatic
        ? `Wide peak-action read with restrained handheld energy. ${formatActionSubject(predator, s3.predatorBeat)}. ${prey} ${s3.preyBeat}. Clear predator-to-prey spacing stays readable, no overlap. Water displacement and turbulence stay forceful but controlled. ${worldPlateContinuity} ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. Then both subjects ease into a stable wide stance.`
        : isShoreline
          ? isWaterForwardStrike
            ? `Wide peak-action read with restrained handheld energy. ${formatActionSubject(predator, s3.predatorBeat)}. ${prey} ${s3.preyBeat}. Clear predator-to-prey spacing stays readable, no overlap. Surface break, bank-edge splash, and shoreline reaction stay forceful but controlled. ${worldPlateContinuity} ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. Then both subjects ease into a stable wide stance.`
            : `Wide peak-action read with restrained handheld energy. ${formatActionSubject(predator, s3.predatorBeat)}. ${prey} ${s3.preyBeat}. Clear predator-to-prey spacing stays readable, no overlap. Splash and muddy bank response stay forceful but controlled. ${worldPlateContinuity} ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. Then both subjects ease into a stable wide stance.`
          : isRutMirrorMatch
            ? `Wide peak-action read with restrained handheld energy. ${predator} loads weight and commits one heavy clash beat while keeping ${rutCue.room}. ${prey} answers with one grounded shove or recoil without losing planted footing. Clear clash spacing stays readable, no overlap. Hoof traction and heavy shoulder transfer stay forceful but controlled. ${worldPlateContinuity} ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. Then both subjects ease into a stable wide stance.`
            : `Wide peak-action read with restrained handheld energy. ${formatActionSubject(predator, s3.predatorBeat)}. ${prey} ${s3.preyBeat}. Clear predator-to-prey spacing stays readable, no overlap. Grounded weight transfer and surface response stay forceful but controlled. ${worldPlateContinuity} ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. Then both subjects ease into a stable wide stance.`
      ), "kling"),
      audio: audio3,
      settings: [
        `Motion intensity ${mi3.toFixed(2)}`,
        "WIDE framing enforced",
        "Use clean Shot 2 handoff frame only",
      ],
      metadata: {
        engine: "kling",
        shotKey: "shot3",
        title: `Kling Shot 3 — Peak Action [${model}]`,
        motionIntensity: mi3,
        variant: "single-shot",
      },
    }),
    shot4: buildStructuredPrompt({
      fullText: `KLING SHOT 4 — RESOLVED TENSION (WIDE${gateOn ? " + ONE-ACTION" : ""}) [${model}]
${note}
${qLead}
${refLine}
${motionRule}
${singleRule}
${wideRule}
Motion intensity: ${mi4.toFixed(2)}
End-state priority: both subjects fully readable, spacing still clear, tension remains visible to the final frame.
${maybeGuard(s4.guardLine)}${context}

═══ PASTE-READY KLING PROMPT (copy this block into Kling) ═══
${sanitizeVideoBeatText(isRutMirrorMatch
  ? `Locked wide aftermath hold with a subtle pull-back. ${predator} settles weight while keeping the ${rutCue.line} clean. ${prey} rebalances once and holds the claim line. Spacing stays clear and readable to the final frame. ${worldPlateContinuity} ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. ${extra3} Then both subjects settle into a composed final position.`
  : isWaterForwardStrike
    ? `Locked wide aftermath hold with a subtle pull-back. ${formatActionSubject(predator, s4.predatorBeat)}. ${prey} holds a tense near-surface line as bank-edge splash settles. Spacing stays clear and readable to the final frame. ${worldPlateContinuity} ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. ${extra3} Then both subjects settle into a composed final position.`
    : `Locked wide aftermath hold with a subtle pull-back. ${formatActionSubject(predator, s4.predatorBeat)}. ${prey} ${s4.preyBeat}. Spacing stays clear and readable to the final frame. ${worldPlateContinuity} ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. ${extra3} Then both subjects settle into a composed final position.`)}

─── FULL BREAKDOWN (reference only) ───
Characters: ${characterLine.replace(/^Characters:\s*/i, "")}
Action: ${formatActionSubject(predator, s4.predatorBeat)}. ${prey} ${s4.preyBeat}.
${locationLine}${cameraBreakdownLine}
Extra: ${buildKlingExtraLine(extra3, quality?.motionOnlyI2V)}

${audio4}

Kling settings: Motion intensity ${mi4.toFixed(2)} | Optionally set End Frame for final pose | Use Shot 3 last frame only if it remains a clean full-body handoff frame; otherwise use the master still or a manually selected clean continuity frame`,
      pasteReady: sanitizeForEngine(
        sanitizeVideoBeatText(
        isRutMirrorMatch
          ? `Locked wide aftermath hold with a subtle pull-back. ${predator} settles weight while keeping the ${rutCue.line} clean. ${prey} rebalances once and holds the claim line. Spacing stays clear and readable to the final frame. ${worldPlateContinuity} ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. ${extra3} Then both subjects settle into a composed final position.`
          : isWaterForwardStrike
            ? `Locked wide aftermath hold with a subtle pull-back. ${formatActionSubject(predator, s4.predatorBeat)}. ${prey} holds a tense near-surface line as bank-edge splash settles. Spacing stays clear and readable to the final frame. ${worldPlateContinuity} ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. ${extra3} Then both subjects settle into a composed final position.`
            : `Locked wide aftermath hold with a subtle pull-back. ${formatActionSubject(predator, s4.predatorBeat)}. ${prey} ${s4.preyBeat}. Spacing stays clear and readable to the final frame. ${worldPlateContinuity} ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. ${extra3} Then both subjects settle into a composed final position.`
      ), "kling"),
      audio: audio4,
      settings: [
        `Motion intensity ${mi4.toFixed(2)}`,
        "Optional End Frame for final pose",
        "Use clean Shot 3 handoff frame only",
      ],
      metadata: {
        engine: "kling",
        shotKey: "shot4",
        title: `Kling Shot 4 — Resolved Tension [${model}]`,
        motionIntensity: mi4,
        variant: "single-shot",
      },
    }),
  };
}

export function buildKlingShots(
  predator: string,
  prey: string,
  env: string,
  arc: Arc,
  weather: Weather,
  model: KlingModel,
  emotionalTone: EmotionalTone,
  animalVibe: AnimalVibe,
  sceneDesc?: string,
  quality?: QualityOptions
): { shot1: string; shot2: string; shot3: string; shot4: string } {
  return promptPackToLegacyText(
    buildKlingPromptPack(
      predator,
      prey,
      env,
      arc,
      weather,
      model,
      emotionalTone,
      animalVibe,
      sceneDesc,
      quality
    )
  );
}


type KlingPairAttackStyle =
  | "water ambush"
  | "river crossing danger"
  | "predator chase"
  | "pack pressure"
  | "defender stands ground"
  | "bird strike"
  | "ocean strike"
  | "reptile pressure"
  | "shell defense"
  | "near-clash standoff"
  | "last-second escape";

type KlingPairProfile = {
  style: KlingPairAttackStyle;
  safeArcLabel: string;
  hint: string;
};

const WATER_AMBUSH_ANIMALS = /\b(crocodile|alligator|caiman)\b/i;
const OCEAN_STRIKE_ANIMALS = /\b(great white shark|tiger shark|bull shark|shark|orca|leopard seal)\b/i;
const BIRD_STRIKE_ANIMALS = /\b(eagle|falcon|peregrine|harpy|wedge-tailed|white-tailed)\b/i;
const PACK_PRESSURE_ANIMALS = /\b(wolf pack|african wild dog|hyena|lion pack)\b/i;
const DEFENDER_ANIMALS = /\b(bison|buffalo|moose|elk|rhinoceros|hippopotamus|elephant|musk ox|water buffalo|cape buffalo)\b/i;
const REPTILE_PRESSURE_ANIMALS = /\b(komodo dragon|monitor lizard|python|anaconda|cobra|rattlesnake|mamba)\b/i;

function classifyKlingPairStyle(
  predator: string,
  prey: string,
  env: string,
  safeArcLabel = ""
): KlingPairAttackStyle {
  const context = `${predator} ${prey} ${env} ${safeArcLabel}`.toLowerCase();

  if (/shell defense|slow escape|tortoise|turtle/.test(context)) return "shell defense";
  if (/river crossing/.test(context)) return "river crossing danger";
  if (/waterhole|water ambush/.test(context) || WATER_AMBUSH_ANIMALS.test(predator)) {
    return "water ambush";
  }
  if (/fishing strike/.test(context) || BIRD_STRIKE_ANIMALS.test(predator)) return "bird strike";
  if (/surf|ocean|coast|seal colony/.test(context) && OCEAN_STRIKE_ANIMALS.test(predator)) {
    return "ocean strike";
  }
  if (PACK_PRESSURE_ANIMALS.test(predator) || /pack pressure|pack hunting/.test(context)) {
    return "pack pressure";
  }
  if (DEFENDER_ANIMALS.test(predator) || DEFENDER_ANIMALS.test(prey) || /defender/.test(context)) {
    return "defender stands ground";
  }
  if (REPTILE_PRESSURE_ANIMALS.test(predator)) return "reptile pressure";
  if (/last-second escape|escape/.test(context)) return "last-second escape";
  if (/near-clash|standoff/.test(context)) return "near-clash standoff";
  return "predator chase";
}

function getCatalogKlingPairProfile(predator: string, prey: string, env: string): KlingPairProfile {
  const entry = getWildlifeLeadCatalogEntry(predator);
  const profile = entry?.opposingProfiles.find(
    (item) => item.animal.toLowerCase() === prey.toLowerCase()
  );
  const safeArcLabel = profile?.safeArcLabel ?? entry?.safeArcLabels[0] ?? "Survival pressure";
  const hint = profile?.promptTemplateHint ?? entry?.promptTemplateHints[0] ?? "Keep both animals readable with realistic spacing and unresolved danger.";

  return {
    style: classifyKlingPairStyle(predator, prey, env, safeArcLabel),
    safeArcLabel,
    hint,
  };
}

function getKlingStyleCues(style: KlingPairAttackStyle) {
  switch (style) {
    case "water ambush":
      return {
        setup: "the lead animal is already low at the waterline while the opposing animal notices too late",
        trigger: "surges from the waterline in a muddy burst",
        reaction: "recoils, slips, and fights for shoreline traction",
        pressure: "splash wall, wet mud, and shoreline grip pressure",
        cliff: "a narrow bank escape angle with water pressure still closing",
        motion: "splash and muddy shoreline motion",
      };
    case "river crossing danger":
      return {
        setup: "the crossing lane is already dangerous and the opposing animal notices too late",
        trigger: "bursts through the crossing current",
        reaction: "pivots hard in the shallows and searches for footing",
        pressure: "current push, spray, and unstable riverbank traction",
        cliff: "an unresolved escape line at the far bank",
        motion: "river splash and current motion",
      };
    case "pack pressure":
      return {
        setup: "the pack is already tightening the corridor while the opposing animal notices too late",
        trigger: "closes the lane in a coordinated chase burst",
        reaction: "braces, pivots, or lowers body mass into one escape route",
        pressure: "corridor tightening, readable spacing, and ground traction",
        cliff: "one narrow route still open as pressure surrounds it",
        motion: "grass, dust, snow, or brush motion",
      };
    case "defender stands ground":
      return {
        setup: "attack pressure is already close and the defender notices too late",
        trigger: "charges or steps in with heavy body pressure",
        reaction: "braces, lowers horns or shoulders, and pushes pressure back",
        pressure: "body mass, hoof traction, shoulder shove, and ground response",
        cliff: "an unresolved standoff or last-second dodge",
        motion: "dust, snow, mud, or grass movement",
      };
    case "bird strike":
      return {
        setup: "a wing shadow crosses the lane as the opposing animal notices too late",
        trigger: "dives through the attack lane with a clean strike path",
        reaction: "ducks, twists, splashes, or sprints toward cover",
        pressure: "wing pull-up, talons passing close, and clean near-contact",
        cliff: "a dramatic near-miss or pull-up with escape still uncertain",
        motion: "wing rush, water strike, or grass flick motion",
      };
    case "ocean strike":
      return {
        setup: "the surf-line attack lane is already set and the opposing animal notices too late",
        trigger: "bursts through foam with sudden body mass",
        reaction: "twists toward a narrow escape angle",
        pressure: "rolling water, splash wall, and surf-line turbulence",
        cliff: "an unresolved ocean escape angle in the foam",
        motion: "foam, spray, and rolling water motion",
      };
    case "reptile pressure":
      return {
        setup: "low ground pressure is already close and the opposing animal notices too late",
        trigger: "lunges or coils forward in one sudden body surge",
        reaction: "freezes, pivots, backs away, or dodges toward cover",
        pressure: "ground-level traction, tense body line, and near-contact pressure",
        cliff: "a last-second breakaway with the reptile still pressing",
        motion: "sand, grass, leaf, or scrub motion",
      };
    case "shell defense":
      return {
        setup: "the tortoise is already vulnerable in a slow escape lane as pressure closes",
        trigger: "probes the escape lane while the tortoise turns shell-first",
        reaction: "drops low, braces the shell, and inches toward cover",
        pressure: "dry scrub tension, low camera height, and slow near-clash pressure",
        cliff: "an unresolved shell-defense standoff",
        motion: "dry scrub, sand, or lava-plain texture motion",
      };
    case "last-second escape":
      return {
        setup: "the attack lane is already narrow and the opposing animal notices too late",
        trigger: "bursts into a fast pressure line",
        reaction: "breaks away, pivots, or dodges at the last second",
        pressure: "near-clash pressure, traction, and readable escape geometry",
        cliff: "a last-second breakaway with outcome unknown",
        motion: "habitat-appropriate surface motion",
      };
    default:
      return {
        setup: "the attack lane is already set and the opposing animal notices too late",
        trigger: "bursts into a chase or ambush line",
        reaction: "pivots, braces, recoils, or sprints toward the escape lane",
        pressure: "near-clash pressure, grounded traction, and readable body spacing",
        cliff: "a narrow escape angle with pressure still unresolved",
        motion: "habitat-appropriate dust, grass, snow, water, or brush motion",
      };
  }
}

function getCompactKlingToneCue(emotionalTone: EmotionalTone): string {
  switch (emotionalTone) {
    case "Raw Tension":
      return "raw documentary tension";
    case "Silent Dread":
      return "quiet dread before the break";
    case "Explosive Energy":
      return "fast viral hook and explosive acceleration";
    case "Calm Dominance":
      return "dangerous but controlled dominance";
    case "Desperate Survival":
      return "desperate survival pressure";
    case "Haunting Stillness":
      return "held stillness before impact";
    case "Primal Instinct":
      return "instinct-first reaction";
    default:
      return "dangerous but realistic";
  }
}

function getCompactKlingToneTag(emotionalTone: EmotionalTone): string {
  switch (emotionalTone) {
    case "Raw Tension":
      return "raw tension";
    case "Silent Dread":
      return "quiet dread";
    case "Explosive Energy":
      return "explosive viral energy";
    case "Calm Dominance":
      return "controlled dominance";
    case "Desperate Survival":
      return "survival pressure";
    case "Haunting Stillness":
      return "held stillness";
    case "Primal Instinct":
      return "instinct-first";
    default:
      return "dangerous but realistic";
  }
}

function getCompactKlingVibeTag(animalVibe: AnimalVibe): string {
  switch (animalVibe) {
    case "BBC Earth Documentary":
      return "BBC Earth";
    case "National Geographic Wild":
      return "Nat Geo Wild";
    case "Raw Nature Unfiltered":
      return "raw nature";
    case "David Attenborough Style":
      return "Attenborough gravity";
    case "Slow Motion Nature":
      return "slow-motion clarity";
    default:
      return "documentary realism";
  }
}

function getCompactKlingVibeCue(animalVibe: AnimalVibe): string {
  switch (animalVibe) {
    case "BBC Earth Documentary":
      return "BBC Earth realism";
    case "National Geographic Wild":
      return "Nat Geo wild urgency";
    case "Raw Nature Unfiltered":
      return "raw nature unfiltered";
    case "David Attenborough Style":
      return "Attenborough-style gravity";
    case "Slow Motion Nature":
      return "natural slow-motion clarity";
    default:
      return "wildlife documentary realism";
  }
}

function buildCompactKlingQualityCue(quality?: QualityOptions): string {
  const bits = [
    "stable anatomy",
    "grounded contact",
    "readable action",
  ];

  if (quality?.referenceLock || quality?.realismMode === "Reference Locked") {
    bits.push("identity lock");
  }
  if (quality?.motionOnlyI2V) {
    bits.push("motion-first continuity");
  }
  if (quality?.microMotion) {
    bits.push("natural camera shake");
  }
  if (quality?.seamlessShot) {
    bits.push("continuous flow");
  }

  return bits.join(", ");
}

function buildCompactKlingSceneCue(sceneDesc?: string, maxChars = 80): string {
  const snippet = sceneDesc?.trim() ? clipPromptContext(sceneDesc.trim(), maxChars) : "";
  return snippet ? "Scene cue: " + snippet : "";
}

function getKlingIntensityCue(
  intensity: number,
  phase: "setup" | "trigger" | "pressure" | "cliff"
): string {
  if (phase === "setup") {
    if (intensity >= 0.55) return "Immediate danger is already readable from frame one.";
    if (intensity >= 0.4) return "Danger is already visible in the first frame.";
    return "Hold the danger line before the move breaks.";
  }

  if (phase === "trigger") {
    if (intensity >= 0.85) return "Hit with explosive acceleration and one hard readable burst.";
    if (intensity >= 0.7) return "Hit with sharp acceleration and one clean burst.";
    return "Trigger one clear acceleration beat.";
  }

  if (phase === "pressure") {
    if (intensity >= 0.85) return "Peak pressure stays fast, tight, and near-clash.";
    if (intensity >= 0.7) return "Pressure tightens with readable traction and no chaos.";
    return "Keep the pressure readable and grounded.";
  }

  if (intensity >= 0.45) return "End on hard unresolved escape pressure.";
  return "End on unresolved danger with the outcome still open.";
}

function getKlingArcCues(arc: Arc) {
  switch (arc) {
    case "Ambush attack":
      return {
        scene:
          "Hidden attack lane, sudden surge, unresolved escape pressure.",
        setup: "Hold a hidden attack lane while the opposing animal notices too late.",
        trigger: "Snap into a sudden lunge or burst from cover.",
        pressure:
          "Keep pressure low, fast, and near-clash with readable traction or waterline grip.",
        cliff: "End on unresolved escape pressure after the burst.",
      };
    case "Chase and takedown":
      return {
        scene:
          "Immediate pursuit line, hard acceleration, unresolved escape lane.",
        setup: "Show the pursuit line already forming before the sprint breaks.",
        trigger: "Burst into pursuit with a hard forward acceleration line.",
        pressure: "Keep closing speed, traction, and near-clash geometry readable.",
        cliff: "End with the escape route nearly gone and pressure still closing.",
      };
    case "Escape from danger":
      return {
        scene:
          "Danger closes early, survival instinct takes over, breakaway still uncertain.",
        setup: "Establish one narrow escape lane with danger already closing.",
        trigger: "Break into a desperate escape burst immediately.",
        pressure: "Keep pursuit pressure high with grounded traction and one clean route.",
        cliff: "End on a last-second breakaway or an escape lane almost gone.",
      };
    case "Pack hunting strategy":
      return {
        scene:
          "Coordinated lanes close, spacing stays readable, danger unresolved.",
        setup: "Show the corridor already tightening before the break.",
        trigger: "Hit with a coordinated acceleration burst.",
        pressure: "Tighten multiple lanes with pack pressure and one narrowing route.",
        cliff: "End with one narrow route still open as pressure surrounds it.",
      };
    case "Defender stands ground":
      return {
        scene:
          "Planted body mass, shove pressure, unresolved stand-and-hold clash.",
        setup: "Establish planted defense and one clear approach lane.",
        trigger: "Drive forward with heavy planted body pressure.",
        pressure: "Keep hoof, paw, or shoulder traction readable in the clash line.",
        cliff: "End on an unresolved standoff or a last-second sidestep.",
      };
    case "Giant vs giant clash":
      return {
        scene:
          "Heavy mass collision line, planted footing, unresolved dominance.",
        setup: "Establish planted mass and one readable clash lane.",
        trigger: "Launch one heavy acceleration beat into the clash line.",
        pressure: "Keep body mass, traction, and shoulder pressure readable.",
        cliff: "End on unresolved dominance pressure after the clash.",
      };
    case "Predator vs predator fight":
      return {
        scene:
          "Dominance pressure, snap reaction, outcome unresolved.",
        setup: "Establish rival pressure and one clean challenge lane.",
        trigger: "Snap into a sharp forward challenge burst.",
        pressure: "Keep rival spacing, traction, and counter-pressure readable.",
        cliff: "End on an unresolved control line with neither animal fully yielding.",
      };
    case "Territory dominance battle":
      return {
        scene:
          "Control of space, heavy forward pressure, retreat unresolved.",
        setup: "Establish territory pressure before the move breaks.",
        trigger: "Press forward with one committed dominance beat.",
        pressure: "Keep planted control, body mass, and clean spacing readable.",
        cliff: "End with the territory line still contested.",
      };
    default:
      return {
        scene:
          "Visible danger, one hard pressure line, unresolved escape tension.",
        setup: "Establish the danger line before the move breaks.",
        trigger: "Trigger one clear acceleration beat.",
        pressure: "Keep the pressure readable, grounded, and unresolved.",
        cliff: "End with escape pressure still open.",
      };
  }
}

function buildKlingSafetyLine(includeDeath = false): string {
  return includeDeath
    ? "no death close-up, no blood, no gore, no visible wounds."
    : "no blood, no gore, no visible wounds.";
}

function clampKlingShotPrompt(input: string): string {
  return clampPromptToCharLimit(cleanupPromptArtifacts(input), KLING_MULTISHOT_SHOT_CHAR_LIMIT);
}

export function buildKlingMultishotPromptCards(
  predator: string,
  prey: string,
  env: string,
  arc: Arc,
  weather: Weather,
  model: KlingModel,
  emotionalTone: EmotionalTone,
  animalVibe: AnimalVibe,
  sceneDesc?: string,
  quality?: QualityOptions
): StructuredPrompt[] {
  const isNative = model === "Kling 3.0 Pro" || model === "Kling 3.0 Standard";
  if (!isNative) {
    const fallback =
      `Kling Multishot requires Kling 3.0 Pro or Kling 3.0 Standard. Selected: ${model}.`;
    return [1, 2, 3, 4].map((shot) =>
      buildStructuredPrompt({
        fullText: fallback,
        pasteReady: fallback,
        metadata: {
          engine: "kling",
          title: `Kling Multishot Shot ${shot}`,
          shotKey: `shot${shot}`,
          variant: "kling-multishot",
        },
      })
    );
  }

  const profile = getCatalogKlingPairProfile(predator, prey, env);
  const cues = getKlingStyleCues(profile.style);
  const arcCues = getKlingArcCues(arc);
  const shotEnv = compactEnvironmentPhrase(env, 8, 16);
  const toneCue = getCompactKlingToneTag(emotionalTone);
  const vibeCue = getCompactKlingVibeTag(animalVibe);
  const qualityCue = buildCompactKlingQualityCue(quality);
  const sceneCue = buildCompactKlingSceneCue(sceneDesc, 44);
  const setupIntensity = getKlingMotionIntensity(arc, "establish");
  const triggerIntensity = Number(
    (
      (getKlingMotionIntensity(arc, "establish") +
        getKlingMotionIntensity(arc, "action")) /
      2
    ).toFixed(2)
  );
  const pressureIntensity = getKlingMotionIntensity(arc, "action");
  const cliffIntensity = Math.min(
    1,
    Number((getKlingMotionIntensity(arc, "aftermath") + 0.08).toFixed(2))
  );

  const shots = [
    [
      `Same ${predator} and ${prey} in ${shotEnv}.`,
      sceneCue,
      `${toneCue}; ${vibeCue}.`,
      `${qualityCue}.`,
      `${getKlingIntensityCue(setupIntensity, "setup")} ${arcCues.setup}`,
      `${cues.setup}.`,
      buildKlingSafetyLine(),
      `Both animals stay readable from frame one.`,
    ]
      .filter(Boolean)
      .join(" "),
    [
      "Trigger beat.",
      `${toneCue}; ${vibeCue}.`,
      `${getKlingIntensityCue(triggerIntensity, "trigger")} ${arcCues.trigger}`,
      `${predator} ${cues.trigger}; ${prey} ${cues.reaction}.`,
      `Use ${cues.motion}; keep both bodies visible.`,
      `stable anatomy, grounded contact.`,
      buildKlingSafetyLine(),
    ]
      .filter(Boolean)
      .join(" "),
    [
      "Near-clash pressure.",
      `${toneCue}; ${vibeCue}.`,
      `${getKlingIntensityCue(pressureIntensity, "pressure")} ${arcCues.pressure}`,
      `${cues.pressure}.`,
      `Show resistance, corridor tightening, or grounded traction with both animals readable.`,
      `stable anatomy, grounded contact.`,
      buildKlingSafetyLine(),
    ]
      .filter(Boolean)
      .join(" "),
    [
      "Cliffhanger finish.",
      `${toneCue}.`,
      `${getKlingIntensityCue(cliffIntensity, "cliff")} ${arcCues.cliff}`,
      `${cues.cliff}.`,
      `Keep ${predator} and ${prey} readable in ${shotEnv}.`,
      buildKlingSafetyLine(true),
    ]
      .filter(Boolean)
      .join(" "),
  ].map((shot) => clampKlingShotPrompt(sanitizeVideoBeatText(shot)));

  return shots.map((shot, index) => {
    const shotNumber = index + 1;
    const timings = ["0-4s", "4-8s", "8-12s", "12-15s"];
    const titles = [
      "setup / tension",
      "trigger / burst",
      "near-clash pressure",
      "cliffhanger finish",
    ];
    const countLine = `Shot ${shotNumber}: ${shot.length}/${KLING_MULTISHOT_SHOT_CHAR_LIMIT}`;

    return buildStructuredPrompt({
      fullText: `KLING MULTISHOT SHOT ${shotNumber} (${timings[index]}) — ${titles[index]}\n${countLine}\n${shot}`,
      pasteReady: sanitizeForEngine(shot, "kling"),
      settings: [
        countLine,
        `Timing: ${timings[index]}`,
        `Pair style: ${profile.style}`,
        `Safety arc: ${profile.safeArcLabel}`,
      ],
      metadata: {
        engine: "kling",
        shotKey: `shot${shotNumber}`,
        title: `Kling Multishot Shot ${shotNumber}`,
        durationSeconds: shotNumber === 4 ? 3 : 4,
        variant: "kling-multishot",
      },
    });
  });
}

export function buildKlingFramesPromptCard(
  predator: string,
  prey: string,
  env: string,
  arc: Arc,
  weather: Weather,
  model: KlingModel,
  emotionalTone: EmotionalTone,
  animalVibe: AnimalVibe,
  sceneDesc?: string,
  quality?: QualityOptions
): StructuredPrompt {
  const note = KLING_STYLE_NOTE[model];
  const tone = emotionalTonePrompt[emotionalTone];
  const vibe = animalVibePrompt[animalVibe];
  const qLead = buildQualityLead(quality, "kling");
  const isNative = model === "Kling 3.0 Pro" || model === "Kling 3.0 Standard";

  if (!isNative) {
    return buildStructuredPrompt({
      fullText: `Kling Frames Prompt requires Kling 3.0 Pro or Kling 3.0 Standard. Selected: ${model}.`,
      pasteReady: `Kling Frames Prompt requires Kling 3.0 Pro or Kling 3.0 Standard. Selected: ${model}.`,
      metadata: { engine: "kling", title: "Kling Frames Prompt", variant: "kling-frames" },
    });
  }

  const profile = getCatalogKlingPairProfile(predator, prey, env);
  const cues = getKlingStyleCues(profile.style);
  const arcCues = getKlingArcCues(arc);
  const framesEnv = compactEnvironmentPhrase(env, 18, 28);
  const cleanWeather = sanitizeWeatherPhrase(weatherVariants[weather]);
  const contextSnippet = sceneDesc?.trim() ? clipPromptContext(sceneDesc.trim(), 120) : "";
  const toneCue = getCompactKlingToneCue(emotionalTone);
  const vibeCue = getCompactKlingVibeCue(animalVibe);
  const qualityCue = buildCompactKlingQualityCue(quality);
  const sceneCue = buildCompactKlingSceneCue(sceneDesc);
  const sceneIdea = contextSnippet
    ? `${contextSnippet} ${arcCues.scene} ${toneCue}. ${vibeCue}.`
    : `${predator} and ${prey} collide in a ${profile.safeArcLabel.toLowerCase()} setup. ${arcCues.scene} ${toneCue}. ${vibeCue}.`;
  const negativeLine = compactNegativePrompt([
    "blood",
    "gore",
    "visible wounds",
    "death close-up",
    "torn flesh",
    "exposed wounds",
    "dismemberment",
    "broken bones",
    "duplicate animals",
    "extra limbs",
    "melted anatomy",
    "fused bodies",
    "humans",
    "zoo enclosure",
    "text",
    "subtitles",
    "watermark",
    "wrong habitat",
  ]);
  const weatherLine = cleanWeather ? ` ${cleanWeather}.` : "";
  const audioLine = profile.style === "bird strike"
    ? "Audio: wing rush, sharp splash or grass flick, panicked movement, tense natural ambience."
    : profile.style === "ocean strike"
      ? "Audio: surf surge, foam impact, rolling water, tense natural ambience."
      : profile.style === "water ambush" || profile.style === "river crossing danger"
        ? "Audio: water surge, muddy splash, traction scramble, tense natural ambience."
        : "Audio: sudden movement, grounded traction, breath, habitat texture, tense natural ambience.";

  const promptParts = [
    `Image-to-video from master image. Preserve same ${predator}, ${prey}, ${framesEnv}, lighting, scale, spacing, and first-frame composition.${weatherLine} Photorealistic raw wildlife documentary, realistic body mass, ${qualityCue}. ${buildKlingSafetyLine()}`,
    `Scene idea: ${sceneIdea}`,
    `Continuity: keep exact animal identity, habitat geography, lighting direction, grounded contact, and readable spacing from the master frame. ${sceneCue}`,
    `Camera and motion rule: ${toneCue}. ${vibeCue}. Tight survival motion only; keep both animals visible.`,
    `Shot 1, 0-3s: Establish tension. ${arcCues.setup} ${cues.setup}; camera holds wide so both bodies read immediately.`,
    `Shot 2, 3-6s: Trigger burst. ${arcCues.trigger} ${predator} ${cues.trigger}; ${prey} ${cues.reaction}.`,
    `Shot 3, 6-10s: Near-clash pressure. ${arcCues.pressure} ${cues.pressure}; keep it non-graphic and physically grounded.`,
    `Shot 4, 10-13s: Survival reaction continues. The lane tightens as one body pivots, braces, recoils, or breaks away; ${toneCue}.`,
    `Shot 5, 13-15s: Cliffhanger finish. ${arcCues.cliff} ${cues.cliff}; both animals remain visible, outcome unknown.`,
    audioLine,
    negativeLine,
  ];

  let pasteReadyCore = cleanupPromptArtifacts(promptParts.join("\n\n"));
  if (pasteReadyCore.length > KLING_FRAMES_TARGET_MAX) {
    pasteReadyCore = cleanupPromptArtifacts([
      promptParts[0],
      `Scene idea: ${clampPromptToCharLimit(sceneIdea, 190)}`,
      ...promptParts
        .slice(2, 10)
        .map((line) =>
          line
            .replace(/; camera slowly pushes or holds wide so /i, "; camera holds wide; ")
            .replace(/Describe tight survival motion, not long habitat paragraphs; /i, "")
        ),
      audioLine,
      compactNegativePrompt(
        [
          "blood",
          "gore",
          "visible wounds",
          "death close-up",
          "torn flesh",
          "duplicate animals",
          "extra limbs",
          "fused bodies",
          "humans",
          "text",
          "watermark",
          "wrong habitat",
        ],
        12
      ),
    ].join("\n\n"));
  }
  pasteReadyCore = clampPromptToCharLimit(pasteReadyCore, KLING_FRAMES_CHAR_LIMIT);

  const klingValidation = validateKlingPromptLength(pasteReadyCore);
  const klingLengthLine = klingValidation.isOver
    ? `PROMPT TOO LONG: ${klingValidation.length} / ${KLING_FRAMES_CHAR_LIMIT}`
    : `Kling Frames Prompt: ${klingValidation.length} / ${KLING_FRAMES_CHAR_LIMIT} chars`;

  return buildStructuredPrompt({
    fullText: `KLING FRAMES PROMPT [${model}]\n─────────────────────────────────────────────────────────\n${note}\n${qLead}\nStyle note: ${vibe.style}. ${tone.video}.\nPair style: ${profile.style}. ${profile.hint}\n\n${klingLengthLine}\n═══ PASTE INTO KLING FRAMES — max 2500 chars (copy this block only) ═══\n${pasteReadyCore}\n\n─── OPTIONAL NOTES — reference only, do NOT paste into Kling ───\nPrimary use: single Kling/Runway-style Frames prompt field for 15s image-to-video.\nContinuity: preserve master-image identity, habitat, spacing, grounded contact, and cliffhanger pressure through Shot 5.`,
    pasteReady: sanitizeForEngine(pasteReadyCore, "kling"),
    settings: [
      klingLengthLine,
      "Single video prompt field",
      "5 written beats inside one prompt",
      "Negative prompt embedded in the same copy block",
    ],
    metadata: {
      engine: "kling",
      title: "Kling Frames Prompt",
      variant: "kling-frames",
    },
  });
}

export function buildKlingNative15sCard(

  predator: string,
  prey: string,
  env: string,
  arc: Arc,
  weather: Weather,
  model: KlingModel,
  emotionalTone: EmotionalTone,
  animalVibe: AnimalVibe,
  sceneDesc?: string,
  quality?: QualityOptions
): StructuredPrompt {
  return buildKlingFramesPromptCard(
    predator,
    prey,
    env,
    arc,
    weather,
    model,
    emotionalTone,
    animalVibe,
    sceneDesc,
    quality
  );
}

export function buildKlingNative15s(
  predator: string,
  prey: string,
  env: string,
  arc: Arc,
  weather: Weather,
  model: KlingModel,
  emotionalTone: EmotionalTone,
  animalVibe: AnimalVibe,
  sceneDesc?: string,
  quality?: QualityOptions
): string {
  return buildKlingNative15sCard(
    predator,
    prey,
    env,
    arc,
    weather,
    model,
    emotionalTone,
    animalVibe,
    sceneDesc,
    quality
  ).fullText;
}

export function buildKlingSixShotCard(
  predator: string,
  prey: string,
  env: string,
  arc: Arc,
  weather: Weather,
  model: KlingModel,
  emotionalTone: EmotionalTone,
  animalVibe: AnimalVibe,
  sceneDesc?: string,
  quality?: QualityOptions
): StructuredPrompt {
  const note = KLING_STYLE_NOTE[model];
  const tone = emotionalTonePrompt[emotionalTone];
  const vibe = animalVibePrompt[animalVibe];
  const micro = buildMicroMotionLine(weather, env);
  const cleanEnv = sanitizeImageEnv(env);
  const cleanWeather = sanitizeWeatherPhrase(weatherVariants[weather]);
  const envLower = env.toLowerCase();
  const isArcticLike =
    envLower.includes("arctic") ||
    envLower.includes("snow") ||
    envLower.includes("tundra") ||
    envLower.includes("ice") ||
    envLower.includes("glacier") ||
    envLower.includes("frozen") ||
    envLower.includes("winter");
  const qLead = buildQualityLead(quality, "kling");
  const context = sceneDesc?.trim() ? `\nScene context: ${clipPromptContext(sceneDesc.trim())}` : "";
  const isNative = model === "Kling 3.0 Pro" || model === "Kling 3.0 Standard";
  const cfgBase = arcCfgScale[arc] ?? 0.55;

  if (!isNative) {
    return buildStructuredPrompt({
      fullText: `⚠️ KLING 6-SHOT: Requires Kling 3.0 Pro or Kling 3.0 Standard.
Selected: ${model}. Switch model to activate.`,
      pasteReady: `⚠️ KLING 6-SHOT: Requires Kling 3.0 Pro or Kling 3.0 Standard.
Selected: ${model}. Switch model to activate.`,
      metadata: {
        engine: "kling",
        title: `Kling 6-shot [${model}]`,
        variant: "six-shot",
      },
    });
  }

  const wideRule =
    "WIDE PHYSICS RULE — Action + aftermath shots must be WIDE (full bodies visible) for realistic biomechanics.";

  const gateOn = !!quality?.singleActionRule;
  const habitatMode = getHabitatMode(predator, prey, env);
  const aquatic = habitatMode === "aquatic";
  const shoreline = habitatMode === "shoreline";
  const b5 = oneActionArcBeat(arc, "action", gateOn, habitatMode);
  const b6 = oneActionArcBeat(arc, "aftermath", gateOn, habitatMode);

  const s5 = {
    ...b5,
    predatorBeat: sanitizeVideoBeatText(b5.predatorBeat),
    preyBeat: sanitizeVideoBeatText(b5.preyBeat),
  };
  const s6 = {
    ...b6,
    predatorBeat: sanitizeVideoBeatText(b6.predatorBeat),
    preyBeat: sanitizeVideoBeatText(b6.preyBeat),
  };

  const sixShotSceneLine = quality?.motionOnlyI2V
    ? `Scene: preserve the input-frame terrain and light continuity, ${cleanWeather}.`
    : shoreline
      ? `Scene: shoreline ambush zone, shallow water edge, muddy bank, ${cleanWeather}.`
      : `Scene: ${cleanEnv}, ${cleanWeather}.`;

  const sixShotCharacterLine = quality?.motionOnlyI2V
    ? `Characters: same ${predator} identity from input frame. Same ${prey} identity from input frame.`
    : `Characters: ${predator} (drives pressure). ${prey} (fully reactive).`;

  const sixShotAudio1 = aquatic
    ? "Audio: subtle underwater movement, low current wash, restrained body movement."
    : shoreline
      ? "Audio: subtle shoreline wash, restrained low body movement, wet-ground stillness."
      : isArcticLike
        ? "Audio: cold breath, faint pine wind, tight controlled inhale."
        : "Audio: heavy controlled breathing, sharp inhale.";

  const sixShotAudio2 = aquatic
    ? "Audio: water movement, tension stillness, distant current wash."
    : shoreline
      ? "Audio: shallow water movement, bank tension stillness, wet mud ambience."
      : isArcticLike
        ? "Audio: cold mountain wind through pines, winter stillness."
        : "Audio: wind through terrain, tension stillness.";

  const sixShotAudio3 = aquatic
    ? "Audio: current pressure shift, water displacement, prey alert movement."
    : shoreline
      ? "Audio: splash pressure shift, muddy bank disturbance, prey alert movement."
      : isArcticLike
        ? "Audio: snow crunch under shifting weight, tense movement, alert vocalization."
        : "Audio: weight transfer on ground surface, tense animal movement, alert vocalization.";

  const sixShotAudio4 = aquatic
    ? "Audio: alternating water movement, shifting current tension."
    : shoreline
      ? "Audio: alternating shallow splash tension, wet-ground disturbance."
      : isArcticLike
        ? "Audio: sharp alternating breath, faint frozen forest hush."
        : "Audio: rapid alternating breathing patterns.";

  const sixShotAudio5 = buildKlingAudioShort(predator, prey, env, weather, "action");
  const sixShotAudio6 = buildKlingAudioShort(predator, prey, env, weather, "aftermath");

  const pasteReadySixShotCore = [
    quality?.motionOnlyI2V
      ? `Keep the same ${predator} and ${prey} identities from the input image with matching terrain and light continuity, ${cleanWeather}. Photorealistic wildlife documentary in 9:16 vertical.`
      : `${predator} and ${prey} remain consistent across all six beats in ${cleanEnv}, ${cleanWeather}. Photorealistic wildlife documentary in 9:16 vertical.`,
    ``,
    `0–2s: Wide opening hold. ${predator} stays on the left and ${prey} stays on the right, both fully visible in the same frame with locked eye-line, clear spacing, and immediate tension from frame one.`,
    sixShotAudio1,
    ``,
    `2–5s: The pressure holds without overlap. ${predator} keeps visible forward pressure while ${prey} stays fully alert and reactive. Spacing remains clear and readable.`,
    sixShotAudio2,
    ``,
    `5–8s: Slow side-angle profile pressure. ${predator} shifts weight forward with controlled commitment while ${prey} answers with one readable defensive or escape-ready adjustment.`,
    sixShotAudio3,
    ``,
    `8–11s: Reaction tension cut. Alternate clean reaction beats between ${predator} intensity and ${prey} survival focus while keeping the frame readable and natural.`,
    sixShotAudio4,
    ``,
    `11–14s: Fixed wide action read. ${predator} ${s5.predatorBeat}. ${prey} ${s5.preyBeat}. Both subjects fully visible, clear predator-to-prey line, readable spacing, and no overlap. ${micro}.`,
    sixShotAudio5,
    ``,
    `14–15s: Locked wide resolved tension hold. ${predator} ${s6.predatorBeat}. ${prey} ${s6.preyBeat}. Both subjects stay fully readable, spacing remains clear, and tension holds to the final frame. ${micro}.`,
    sixShotAudio6,
  ]
    .join("\n")
    .trim();

  const sixShotValidation = validateKlingPromptLength(pasteReadySixShotCore);
  const sixShotLengthLine = sixShotValidation.isOver
    ? `PROMPT TOO LONG for WSTV house budget: ${sixShotValidation.length} / ~${KLING_CHAR_LIMIT}`
    : `Prompt length within WSTV house budget: ${sixShotValidation.length} / ~${KLING_CHAR_LIMIT} chars`;

  return buildStructuredPrompt({
    fullText: `KLING 6-SHOT MULTI-SCENE [${model}] — Native Single-Prompt Format
──────────────────────────────────────────────────────
${note}
${qLead}
Guidance Scale: ${cfgBase} (0.0–1.0 range)
${wideRule}${context}

${sixShotLengthLine}
═══ PASTE INTO KLING — copy this block only ═══
${pasteReadySixShotCore}

─── FULL BREAKDOWN — reference only, do NOT paste into Kling ───

${sixShotSceneLine}
${sixShotCharacterLine}

Style: ${vibe.style}. ${tone.image}. Photorealistic wildlife documentary. 9:16 vertical frame.
Story arc: ${getSafeArcPrint(arc)}.

Shot 1 — OPENING TENSION (0–2s) | Motion: 0.25:
${predator} LEFT, ${prey} RIGHT, both fully visible in the same frame, immediate eye-line lock, clear spacing, visible tension from frame one.
Camera: WIDE opening hold or subtle push-in.
${sixShotAudio1}

Shot 2 — PRESSURE HOLD (2–5s) | Motion: 0.30:
${predator} maintains visible forward pressure. ${prey} stays fully alert and reactive, no overlap, spacing stays readable.
Camera: locked wide.
${sixShotAudio2}

Shot 3 — PROFILE PRESSURE (5–8s) | Motion: 0.45:
${predator} shifts weight forward with controlled commitment. ${prey} answers with one readable defensive or escape-ready adjustment.
Camera: low side-angle tracking, very slow.
${sixShotAudio3}

Shot 4 — TENSION REACTION CUT (8–11s) | Motion: 0.35:
Alternating readable reaction beats: ${predator} intensity / ${prey} survival focus. Keep tension high, keep both reactions clean and natural.
Camera: no movement.
${sixShotAudio4}

Shot 5 — ACTION PRESSURE WIDE (11–14s) — WIDE | Motion: ${getKlingMotionIntensity(arc, "action").toFixed(2)}:
${maybeGuard(s5.guardLine)}${predator} ${s5.predatorBeat}. ${prey} ${s5.preyBeat}.
Action priority: both subjects fully visible, clear predator-to-prey line, readable spacing, no overlap.
Camera: FIXED WIDE — full bodies visible; no crop; no close-ups.
Environment: ${
  aquatic
    ? `surface response + ${micro}`
    : shoreline
      ? `splash, muddy bank scatter, disturbed shallows, ${micro}`
      : `surface response + ${micro}`
}.
${buildKlingAudioPrompt(predator, prey, env, weather, arc, "action")}

Shot 6 — RESOLVED TENSION WIDE (14–15s) — WIDE | Motion: ${getKlingMotionIntensity(arc, "aftermath").toFixed(2)}:
${maybeGuard(s6.guardLine)}${predator} ${s6.predatorBeat}. ${prey} ${s6.preyBeat}.
End-state priority: both subjects fully readable, spacing still clear, tension remains visible to the final frame.
Camera: LOCKED FIXED WIDE — full bodies visible; no crop; no close-ups.
${buildKlingAudioPrompt(predator, prey, env, weather, arc, "aftermath")}

──────────────────────────────────────────────────────
HOW TO USE (Kling 3.0 WSTV 6-Shot Workflow):
1. Generate the master image first with the Nano Banana / Gemini image prompt.
2. Upload master image as reference.
3. Enable "Bind Subject" (Elements 3.0) for identity lock.
4. Paste ONLY the block above the FULL BREAKDOWN line into Kling.
5. Enable native audio for documentary-quality sound.
6. Use Kling 3.0's available output settings for the final delivery target you need.
✅ One prompt → 6 cinematic shots with consistent identity and audio.`,
    pasteReady: sanitizeForEngine(pasteReadySixShotCore, "kling"),
    settings: [
      `Guidance Scale: ${cfgBase}`,
      wideRule,
      sixShotLengthLine,
    ],
    metadata: {
      engine: "kling",
      title: `Kling 6-shot multi-scene [${model}]`,
      variant: "six-shot",
    },
  });
}

export function buildKlingSixShot(
  predator: string,
  prey: string,
  env: string,
  arc: Arc,
  weather: Weather,
  model: KlingModel,
  emotionalTone: EmotionalTone,
  animalVibe: AnimalVibe,
  sceneDesc?: string,
  quality?: QualityOptions
): string {
  return buildKlingSixShotCard(
    predator,
    prey,
    env,
    arc,
    weather,
    model,
    emotionalTone,
    animalVibe,
    sceneDesc,
    quality
  ).fullText;
}
