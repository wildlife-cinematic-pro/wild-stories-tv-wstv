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
import { KLING_STYLE_NOTE, arcCfgScale, getKlingCfgScales } from "@/lib/model-specs";

import {
  getHabitatMode,
  getSafeArcPrint,
  oneActionArcBeat,
  buildMicroMotionLine,
  isWaterForwardPreyScenario,
  isRutMirrorMatchScenario,
  getRutMirrorMatchCue,
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
  buildShotWorldContinuityLock,
} from "@/lib/prompt-builders/shared";
import { buildKlingCameraPresetLine } from "@/lib/camera-angle-presets";
import {
  KLING_CHAR_LIMIT,
  validateKlingPromptLength,
  clipPromptContext,
  sanitizeImageEnv,
  sanitizeWeatherPhrase,
  sanitizeVideoBeatText,
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
  const micro = buildMicroMotionLine(weather, env);

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
  const gateOn = !!quality?.singleActionRule;
  const habitatMode = getHabitatMode(predator, prey, env);
  const isAquatic = habitatMode === "aquatic";
  const isShoreline = habitatMode === "shoreline";
  const isWaterForwardStrike = isWaterForwardPreyScenario(predator, prey, env);
  const isRutMirrorMatch = isRutMirrorMatchScenario(predator, prey, arc, env);
  const rutCue = getRutMirrorMatchCue(predator);
  const cameraPresetLine = buildKlingCameraPresetLine(
    cameraAnglePreset,
    habitatMode,
    env
  );
  const cameraPromptTail = cameraPresetLine ? ` ${cameraPresetLine}` : "";
  const cameraBreakdownLine = cameraPresetLine
    ? `\nCamera preset: ${cameraPresetLine}`
    : "";
  const worldPlateContinuity = buildShotWorldContinuityLock("kling");
  const beat1 = oneActionArcBeat(arc, "establish", gateOn, habitatMode);
  const beat3 = oneActionArcBeat(arc, "action", gateOn, habitatMode);
  const beat4 = oneActionArcBeat(arc, "aftermath", gateOn, habitatMode);

  const s1 = {
    ...beat1,
    predatorBeat: sanitizeVideoBeatText(beat1.predatorBeat),
    preyBeat: sanitizeVideoBeatText(beat1.preyBeat),
  };
  const s3 = {
    ...beat3,
    predatorBeat: sanitizeVideoBeatText(beat3.predatorBeat),
    preyBeat: sanitizeVideoBeatText(beat3.preyBeat),
  };
  const s4 = {
    ...beat4,
    predatorBeat: sanitizeVideoBeatText(beat4.predatorBeat),
    preyBeat: sanitizeVideoBeatText(beat4.preyBeat),
  };

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

  const pressurePredator = isRutMirrorMatch
    ? `${predator} edges forward with heavier shoulder-line pressure while keeping ${rutCue.room}`
    : isAquatic
      ? `${predator} leans into stronger visible water pressure while staying controlled`
      : isShoreline
        ? isWaterForwardStrike
          ? `${predator} leans farther forward from the bank as the shallow strike window tightens`
          : `${predator} leans farther forward from the shoreline with stronger visible ambush pressure`
        : `${predator} leans farther forward with stronger visible pressure`;

  const pressurePrey = isRutMirrorMatch
    ? `${prey} braces into one grounded footing reset without giving away the claim line`
    : isAquatic
      ? `${prey} tightens posture and makes one readable defensive adjustment in the current`
      : isShoreline
        ? isWaterForwardStrike
          ? `${prey} shows one tense surface-break adjustment tight to the bank-edge current`
          : `${prey} lowers into one readable defensive footing adjustment near the bank`
        : `${prey} lowers into one readable defensive adjustment`;

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
      pasteReady: sanitizeVideoBeatText(isAquatic
        ? `Wide opening hold with a subtle push-in.${cameraPromptTail} ${predator} holds controlled pressure through the water on the left. ${prey} stays fully alert and reactive on the right. Both subjects are fully readable from frame one with locked eye-line, clear spacing, and immediate visible tension. ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. ${extra1} Then both subjects hold position.`
        : isShoreline
          ? isWaterForwardStrike
            ? `Wide opening hold with a subtle push-in.${cameraPromptTail} ${predator} holds low at the bank with the shallow strike window visible on the left. ${prey} stays just off the bank with one tense near-surface hold on the right. Both subjects are fully readable from frame one with locked eye-line, clear bank-edge spacing, and immediate visible tension. ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. ${extra1} Then both subjects hold position.`
            : `Wide opening hold with a subtle push-in.${cameraPromptTail} ${predator} holds visible pressure at the waterline on the left. ${prey} stays fully alert near the bank on the right. Both subjects are fully readable from frame one with locked eye-line, clear spacing, and immediate visible tension. ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. ${extra1} Then both subjects hold position.`
          : isRutMirrorMatch
            ? `Wide opening hold with a subtle push-in.${cameraPromptTail} ${predator} holds the ${rutCue.line} with ${rutCue.room} on the left. ${prey} answers on the right with matching shoulder tension and planted footing. Both subjects are fully readable from frame one with locked eye-line, clear spacing, and immediate visible dominance. ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. ${extra1} Then both subjects hold position.`
            : `Wide opening hold with a subtle push-in.${cameraPromptTail} ${formatActionSubject(predator, s1.predatorBeat)}. ${prey} ${s1.preyBeat}. Both subjects are fully readable from frame one with locked eye-line, clear spacing, and immediate visible tension. ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. ${extra1} Then both subjects hold position.`
      ),
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
      pasteReady: sanitizeVideoBeatText(isAquatic
        ? `Wide pressure-build tracking shot with a subtle forward creep.${cameraPromptTail} ${pressurePredator}. ${pressurePrey}. Clear predator-to-prey line, readable spacing, no overlap. Water displacement and current pressure build naturally. ${worldPlateContinuity} ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. Then both subjects settle into a controlled hold.`
        : isShoreline
          ? isWaterForwardStrike
            ? `Wide pressure-build tracking shot with a subtle forward creep.${cameraPromptTail} ${pressurePredator}. ${pressurePrey}. Clear predator-to-prey line, readable spacing, no overlap. Bank-edge splash, shoreline reaction, and surface break build naturally. ${worldPlateContinuity} ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. Then both subjects settle into a controlled hold.`
            : `Wide pressure-build tracking shot with a subtle forward creep.${cameraPromptTail} ${pressurePredator}. ${pressurePrey}. Clear predator-to-prey line, readable spacing, no overlap. Splash and muddy bank response build naturally. ${worldPlateContinuity} ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. Then both subjects settle into a controlled hold.`
          : isRutMirrorMatch
            ? `Wide pressure-build tracking shot with a subtle forward creep.${cameraPromptTail} ${pressurePredator}. ${pressurePrey}. Clear clash line, readable spacing, no overlap. Hoof traction, planted footing, and heavy shoulder pressure stay controlled. ${worldPlateContinuity} ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. Then both subjects settle into a controlled hold.`
            : `Wide pressure-build tracking shot with a subtle forward creep.${cameraPromptTail} ${pressurePredator}. ${pressurePrey}. Clear predator-to-prey line, readable spacing, no overlap. Grounded weight transfer and surface response stay controlled. ${worldPlateContinuity} ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. Then both subjects settle into a controlled hold.`
      ),
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
      pasteReady: sanitizeVideoBeatText(isAquatic
        ? `Wide peak-action read with restrained handheld energy. ${formatActionSubject(predator, s3.predatorBeat)}. ${prey} ${s3.preyBeat}. Clear predator-to-prey spacing stays readable, no overlap. Water displacement and turbulence stay forceful but controlled. ${worldPlateContinuity} ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. Then both subjects ease into a stable wide stance.`
        : isShoreline
          ? isWaterForwardStrike
            ? `Wide peak-action read with restrained handheld energy. ${formatActionSubject(predator, s3.predatorBeat)}. ${prey} ${s3.preyBeat}. Clear predator-to-prey spacing stays readable, no overlap. Surface break, bank-edge splash, and shoreline reaction stay forceful but controlled. ${worldPlateContinuity} ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. Then both subjects ease into a stable wide stance.`
            : `Wide peak-action read with restrained handheld energy. ${formatActionSubject(predator, s3.predatorBeat)}. ${prey} ${s3.preyBeat}. Clear predator-to-prey spacing stays readable, no overlap. Splash and muddy bank response stay forceful but controlled. ${worldPlateContinuity} ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. Then both subjects ease into a stable wide stance.`
          : isRutMirrorMatch
            ? `Wide peak-action read with restrained handheld energy. ${predator} loads weight and commits one heavy clash beat while keeping ${rutCue.room}. ${prey} answers with one grounded shove or recoil without losing planted footing. Clear clash spacing stays readable, no overlap. Hoof traction and heavy shoulder transfer stay forceful but controlled. ${worldPlateContinuity} ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. Then both subjects ease into a stable wide stance.`
            : `Wide peak-action read with restrained handheld energy. ${formatActionSubject(predator, s3.predatorBeat)}. ${prey} ${s3.preyBeat}. Clear predator-to-prey spacing stays readable, no overlap. Grounded weight transfer and surface response stay forceful but controlled. ${worldPlateContinuity} ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. Then both subjects ease into a stable wide stance.`
      ),
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
      pasteReady: sanitizeVideoBeatText(
        isRutMirrorMatch
          ? `Locked wide aftermath hold with a subtle pull-back. ${predator} settles weight while keeping the ${rutCue.line} clean. ${prey} rebalances once and holds the claim line. Spacing stays clear and readable to the final frame. ${worldPlateContinuity} ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. ${extra3} Then both subjects settle into a composed final position.`
          : isWaterForwardStrike
            ? `Locked wide aftermath hold with a subtle pull-back. ${formatActionSubject(predator, s4.predatorBeat)}. ${prey} holds a tense near-surface line as bank-edge splash settles. Spacing stays clear and readable to the final frame. ${worldPlateContinuity} ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. ${extra3} Then both subjects settle into a composed final position.`
            : `Locked wide aftermath hold with a subtle pull-back. ${formatActionSubject(predator, s4.predatorBeat)}. ${prey} ${s4.preyBeat}. Spacing stays clear and readable to the final frame. ${worldPlateContinuity} ${buildKlingLocationLine(env, weather, quality?.motionOnlyI2V).replace(/^Lighting & Location:\s*/i, "")}. ${extra3} Then both subjects settle into a composed final position.`
      ),
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
  const note = KLING_STYLE_NOTE[model];
  const tone = emotionalTonePrompt[emotionalTone];
  const vibe = animalVibePrompt[animalVibe];
  const micro = buildMicroMotionLine(weather, env);
  const cleanEnv = sanitizeImageEnv(env);
  const cleanWeather = sanitizeWeatherPhrase(weatherVariants[weather]);
  const qLead = buildQualityLead(quality, "kling");
  const context = sceneDesc?.trim() ? `\nScene context: ${clipPromptContext(sceneDesc.trim())}` : "";
  const isNative = model === "Kling 3.0 Pro" || model === "Kling 3.0 Standard";

  if (!isNative) {
    return buildStructuredPrompt({
      fullText: `⚠️ KLING NATIVE 15S: Requires Kling 3.0 Pro or Kling 3.0 Standard.
Selected: ${model}. Switch model to activate.`,
      pasteReady: `⚠️ KLING NATIVE 15S: Requires Kling 3.0 Pro or Kling 3.0 Standard.
Selected: ${model}. Switch model to activate.`,
      metadata: {
        engine: "kling",
        title: `Kling Native 15s [${model}]`,
        variant: "native-15s",
      },
    });
  }

  const refLine = quality?.referenceLock
    ? "Reference lock active — enable Bind Subject (Elements 3.0) to preserve exact subject identity across all 3 beats."
    : "Maintain consistent subject appearance, scale, and environment across all 3 beats.";

  const motionRule = quality?.motionOnlyI2V
    ? "Motion-only mode — do not re-describe subject appearance. Keep the prompt focused on movement, timing, and continuity from the input image."
    : "Keep visual restatement minimal across all beats.";

  const wideRule = klingWidePhysicsRule();
  const cfgScales = getKlingCfgScales(arc);
  const cfgLine = `Guidance Scale: Shot 1 → ${cfgScales.shot1} | Shot 2 → ${cfgScales.shot2} | Shot 3 → ${cfgScales.shot3} (set in Kling settings, 0.0–1.0)`;
  const gateOn = !!quality?.singleActionRule;
  const habitatMode = getHabitatMode(predator, prey, env);
  const isAquatic = habitatMode === "aquatic";
  const isShoreline = habitatMode === "shoreline";
  const b1 = oneActionArcBeat(arc, "establish", gateOn, habitatMode);
  const b2 = oneActionArcBeat(arc, "action", gateOn, habitatMode);
  const b3 = oneActionArcBeat(arc, "aftermath", gateOn, habitatMode);

  const s1 = {
    ...b1,
    predatorBeat: sanitizeVideoBeatText(b1.predatorBeat),
    preyBeat: sanitizeVideoBeatText(b1.preyBeat),
  };
  const s2 = {
    ...b2,
    predatorBeat: sanitizeVideoBeatText(b2.predatorBeat),
    preyBeat: sanitizeVideoBeatText(b2.preyBeat),
  };
  const s3 = {
    ...b3,
    predatorBeat: sanitizeVideoBeatText(b3.predatorBeat),
    preyBeat: sanitizeVideoBeatText(b3.preyBeat),
  };

  const mi1 = getKlingMotionIntensity(arc, "establish");
  const mi2 = getKlingMotionIntensity(arc, "action");
  const mi3 = getKlingMotionIntensity(arc, "aftermath");

  const audio1 = buildKlingAudioPrompt(predator, prey, env, weather, arc, "establish");
  const audio2 = buildKlingAudioPrompt(predator, prey, env, weather, arc, "action");
  const audio3 = buildKlingAudioPrompt(predator, prey, env, weather, arc, "aftermath");
  const audio1Short = buildKlingAudioShort(predator, prey, env, weather, "establish");
  const audio2Short = buildKlingAudioShort(predator, prey, env, weather, "action");
  const audio3Short = buildKlingAudioShort(predator, prey, env, weather, "aftermath");

  const nativeSceneLine = quality?.motionOnlyI2V
    ? `Scene: preserve the input-frame terrain and light continuity, ${cleanWeather}.`
    : isShoreline
      ? `Scene: shoreline ambush zone, water edge, disturbed shallows, muddy bank, ${cleanWeather}.`
      : `Scene: ${cleanEnv}, ${cleanWeather}.`;

  const nativeCharacterLine = quality?.motionOnlyI2V
    ? `Characters: same ${predator} identity from input frame. Same ${prey} identity from input frame.`
    : `Characters: ${predator} (predator — drives scene pressure). ${prey} (prey — fully reactive throughout).`;

  const pasteReadyCore = [
    quality?.motionOnlyI2V
      ? `Keep the same ${predator} and ${prey} identities from the input image with matching terrain and light continuity, ${cleanWeather}. Photorealistic wildlife documentary in 9:16 vertical.`
      : `${predator} and ${prey} remain consistent across all three beats in ${cleanEnv}, ${cleanWeather}. Photorealistic wildlife documentary in 9:16 vertical.`,
    ``,
    `0–5s: Wide opening hold with a subtle push-in. ${formatActionSubject(predator, s1.predatorBeat)}. ${prey} ${s1.preyBeat}. Both subjects fully readable from frame one, locked eye-line, clear spacing, immediate visible tension. ${micro}.`,
    audio1Short,
    ``,
    `5–10s: Fixed wide action read. ${formatActionSubject(predator, s2.predatorBeat)}. ${prey} ${s2.preyBeat}. Both subjects fully visible, clear predator-to-prey line, readable spacing, and no overlap. ${micro}.`,
    audio2Short,
    ``,
    `10–15s: Locked wide aftermath hold. ${formatActionSubject(predator, s3.predatorBeat)}. ${prey} ${s3.preyBeat}. Both subjects stay fully readable, spacing remains clear, and tension holds to the final frame. ${micro}.`,
    audio3Short,
  ]
    .join("\n")
    .trim();

  const klingValidation = validateKlingPromptLength(pasteReadyCore);
  const klingLengthLine = klingValidation.isOver
    ? `PROMPT TOO LONG for WSTV house budget: ${klingValidation.length} / ~${KLING_CHAR_LIMIT}`
    : `Prompt length within WSTV house budget: ${klingValidation.length} / ~${KLING_CHAR_LIMIT} chars`;

  const body = `═══ KLING 3.0 MULTI-SHOT PROMPT (SCALE format) ═══

${nativeSceneLine}
${nativeCharacterLine}
Style: ${vibe.style}. ${tone.image}. Photorealistic wildlife documentary. 9:16 vertical frame.
Arc: ${getSafeArcPrint(arc)}.
${wideRule}

Shot 1 — OPENING TENSION (0–5 seconds) | Motion: ${mi1.toFixed(2)}:
${maybeGuard(s1.guardLine)}${predator} ${s1.predatorBeat}. ${prey} ${s1.preyBeat}.
Opening priority: both subjects fully readable from frame one, locked eye-line, clear spacing, immediate visible tension.
Camera: WIDE opening hold or subtle push-in, full bodies visible from frame one.
Environment motion: ${micro}.
${audio1}

Shot 2 — ACTION PRESSURE (5–10 seconds) — WIDE | Motion: ${mi2.toFixed(2)}:
${maybeGuard(s2.guardLine)}${predator} ${s2.predatorBeat}. ${prey} ${s2.preyBeat}.
Action priority: both subjects fully visible, clear predator-to-prey line, readable spacing, no overlap.
Camera: FIXED WIDE — full bodies visible; no crop; no close-ups.
Environment motion: ${
  isAquatic
    ? `surface response, grounded contact, ${micro}`
    : isShoreline
      ? `splash, muddy bank scatter, disturbed shallows, ${micro}`
      : `surface response, grounded contact, ${micro}`
}.
Physics priority: grounded weight transfer, coherent limb mechanics, readable impact.
${audio2}

Shot 3 — RESOLVED TENSION (10–15 seconds) — WIDE | Motion: ${mi3.toFixed(2)}:
${maybeGuard(s3.guardLine)}${predator} ${s3.predatorBeat}. ${prey} ${s3.preyBeat}.
End-state priority: both subjects fully readable, spacing still clear, tension remains visible to the final frame.
Camera: LOCKED FIXED WIDE — full bodies visible; no crop; no close-ups.
Environment motion: residual atmosphere — ${micro}.
${audio3}`;

  return buildStructuredPrompt({
    fullText: `KLING NATIVE 15-SECOND MULTI-SHOT [${model}]
─────────────────────────────────────────────────────────
${note}
${qLead}
${refLine}
${motionRule}
${cfgLine}
Motion intensities: Shot 1 → ${mi1.toFixed(2)} | Shot 2 → ${mi2.toFixed(2)} | Shot 3 → ${mi3.toFixed(2)}${context}

${klingLengthLine}
═══ PASTE INTO KLING — kept near WSTV house prompt budget (~${KLING_CHAR_LIMIT} chars) (copy this block only) ═══
${pasteReadyCore}

─── FULL BREAKDOWN — reference only, do NOT paste into Kling ───
${body}

─────────────────────────────────────────────────────────
HOW TO USE (Kling 3.0 WSTV Workflow):
1. Generate the master image first with the Nano Banana / Gemini image prompt.
2. Upload master image as reference in Kling 3.0 Pro/Standard.
3. Enable "Bind Subject" (Elements 3.0) for identity lock.
4. Paste ONLY the block above the FULL BREAKDOWN line into Kling.
5. If Custom Multi-Shot exposes per-shot guidance, use Shot 1 → ${cfgScales.shot1}, Shot 2 → ${cfgScales.shot2}, Shot 3 → ${cfgScales.shot3}. If only one guidance field is available, start with ${cfgScales.shot2}.
6. Enable native audio for documentary-quality sound.
7. Use Kling 3.0's available output settings for the final delivery target you need.
8. Optional: Set End Frame image for final-pose control.
✅ Native single-prompt workflow — identity preserved across all 3 beats.`,
    pasteReady: pasteReadyCore,
    settings: [
      cfgLine,
      `Motion intensities: ${mi1.toFixed(2)} / ${mi2.toFixed(2)} / ${mi3.toFixed(2)}`,
      klingLengthLine,
    ],
    metadata: {
      engine: "kling",
      title: `Kling Native 15-second multi-shot [${model}]`,
      variant: "native-15s",
    },
  });
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
    pasteReady: pasteReadySixShotCore,
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
