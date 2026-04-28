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
  const cleanEnv = sanitizeImageEnv(env);
  const cleanWeather = sanitizeWeatherPhrase(weatherVariants[weather]);
  const qLead = buildQualityLead(quality, "kling");
  const context = sceneDesc?.trim() ? `
Scene context: ${clipPromptContext(sceneDesc.trim())}` : "";
  const isNative = model === "Kling 3.0 Pro" || model === "Kling 3.0 Standard";

  if (!isNative) {
    return buildStructuredPrompt({
      fullText: `⚠️ KLING DIRECT 15S MULTISHOT: Requires Kling 3.0 Pro or Kling 3.0 Standard.
Selected: ${model}. Switch model to activate.`,
      pasteReady: `⚠️ KLING DIRECT 15S MULTISHOT: Requires Kling 3.0 Pro or Kling 3.0 Standard.
Selected: ${model}. Switch model to activate.`,
      metadata: {
        engine: "kling",
        title: "Kling Direct 15s Multishot",
        variant: "direct-15s-multishot",
      },
    });
  }

  const refLine = quality?.referenceLock
    ? "Reference lock active - preserve continuity from the source/master image and enable Bind Subject (Elements 3.0) so anatomy, markings, and scale stay stable across the full 15-second sequence."
    : "Preserve continuity from the source/master image so anatomy, markings, scale, terrain, and light direction stay stable across the full 15-second sequence.";

  const motionRule = quality?.motionOnlyI2V
    ? "Motion-only mode - keep Kling focused on movement, timing, and continuity from the source/master image without re-describing appearance."
    : "Keep visual restatement minimal and let the continuity anchor come from the source/master image.";

  const wideRule = klingWidePhysicsRule();
  const scenario = buildPromptScenarioContext({
    predator,
    prey,
    env,
    arc,
    weather,
    quality,
    engine: "kling",
  });
  const {
    isAquatic,
    isShoreline,
    isWaterForwardStrike,
    isRutMirrorMatch,
    micro,
    rutCue,
    cameraPromptTail,
    cameraBreakdownLine,
    beat1: s1,
    beat3: s3,
    beat4: s4,
  } = scenario;

  const pressurePredator = isAquatic
    ? "holds controlled forward pressure through the water while staying fully readable"
    : isShoreline
      ? isWaterForwardStrike
        ? "leans farther forward from the bank as the strike lane tightens without collapsing the spacing"
        : "leans farther forward from the shoreline with stronger visible ambush pressure while staying readable"
      : isRutMirrorMatch
        ? `edges forward with heavier shoulder-line pressure while keeping ${rutCue.room}`
        : "leans farther forward with stronger visible pressure while staying fully readable";

  const pressurePrey = isAquatic
    ? "tightens posture and makes one readable defensive adjustment in the current"
    : isShoreline
      ? isWaterForwardStrike
        ? "shows one tense near-surface adjustment while keeping a clean bank-edge reaction lane"
        : "lowers into one readable defensive footing adjustment near the bank"
      : isRutMirrorMatch
        ? "braces into one grounded footing reset without giving away the claim line"
        : "lowers into one readable defensive adjustment without losing the reaction lane";

  const dustFreeGroundLine =
    "Ground behavior: grounded paw or hoof contact only, no visible dust, no dirt spray, no debris particles, no kicked-up soil, no dust clouds.";
  const continuityLine =
    `Continuity: keep the same ${predator} (left) and ${prey} (right) identities from the source/master image with stable anatomy, stable markings, and no drift in scale or coat pattern.`;
  const frameLine =
    "Framing: full-body 9:16 vertical throughout, clean reaction lane between subjects, no overlap, and left-right readability must stay obvious in every beat.";
  const sceneLine = quality?.motionOnlyI2V
    ? `Scene: preserve the source/master image terrain and light continuity in ${cleanEnv}, ${cleanWeather}.`
    : `Scene: ${cleanEnv}, ${cleanWeather}. Preserve continuity from the source/master image.`;

  const openingLine = isAquatic
    ? `${predator} (left) ${s1.predatorBeat}. ${prey} (right) ${s1.preyBeat}. Both subjects are fully readable from frame one with immediate visible tension.`
    : isShoreline
      ? isWaterForwardStrike
        ? `${predator} (left) holds low at the bank with the shallow strike window readable. ${prey} (right) stays just off the bank with one tense near-surface hold. Both subjects are fully readable from frame one with immediate visible tension.`
        : `${predator} (left) ${s1.predatorBeat}. ${prey} (right) ${s1.preyBeat}. Both subjects are fully readable from frame one with immediate visible tension.`
      : isRutMirrorMatch
        ? `${predator} (left) holds the ${rutCue.line} with ${rutCue.room}. ${prey} (right) answers with matching shoulder tension and planted footing. Both subjects are fully readable from frame one with immediate visible dominance.`
        : `${predator} (left) ${s1.predatorBeat}. ${prey} (right) ${s1.preyBeat}. Both subjects are fully readable from frame one with immediate visible tension.`;

  const pressureLine = `${predator} (left) ${pressurePredator}. ${prey} (right) ${pressurePrey}. Full bodies stay readable, spacing stays clean, and the reaction lane stays open.`;

  const peakLine = isRutMirrorMatch
    ? `${predator} (left) loads weight and commits one heavy clash beat while keeping ${rutCue.room}. ${prey} (right) answers with one grounded shove or recoil without losing planted footing. Force reads clearly with no overlap.`
    : `${predator} (left) ${s3.predatorBeat}. ${prey} (right) ${s3.preyBeat}. Peak force stays readable with no overlap and one dominant action only.`;

  const resolvedLine = isRutMirrorMatch
    ? `${predator} (left) settles weight while keeping the ${rutCue.line} clean. ${prey} (right) rebalances once and holds the claim line. Tension remains readable to the final frame.`
    : isWaterForwardStrike
      ? `${predator} (left) ${s4.predatorBeat}. ${prey} (right) holds a tense near-surface line as the bank-edge splash settles. Tension remains readable to the final frame.`
      : `${predator} (left) ${s4.predatorBeat}. ${prey} (right) ${s4.preyBeat}. Tension remains readable to the final frame.`;

  const pasteReadyCore = [
    "KLING DIRECT 15S MULTISHOT",
    `Keep the same ${predator} (left) and ${prey} (right) from the source/master image with stable anatomy, stable markings, and stable scale.`,
    `Scene: ${cleanEnv}, ${cleanWeather}. Full-body 9:16 vertical. Clean reaction lane. No overlap.`,
    dustFreeGroundLine,
    `Preserve source/master-image continuity for terrain, light direction, spacing, and grounded contact. ${micro}.`,
    "",
    `0–3s Hook / Opening Tension: Wide opening hold with a subtle push-in.${cameraPromptTail} ${openingLine}`,
    "",
    `3–7s Pressure Build: Steady wide pressure build with a subtle forward creep.${cameraPromptTail} ${pressureLine}`,
    "",
    `7–11s Peak Action: Wide peak-action read with restrained handheld energy.${cameraPromptTail} ${peakLine}`,
    "",
    `11–15s Resolved Tension / Final Hold: Locked wide final hold with a subtle pull-back.${cameraPromptTail} ${resolvedLine}`,
    `Style: ${vibe.style}. ${tone.video}. Photorealistic wildlife documentary realism.`,
  ]
    .join("\n")
    .trim();

  const klingValidation = validateKlingPromptLength(pasteReadyCore);
  const klingLengthLine = klingValidation.isOver
    ? `PROMPT TOO LONG for WSTV house budget: ${klingValidation.length} / ~${KLING_CHAR_LIMIT}`
    : `Prompt length within WSTV house budget: ${klingValidation.length} / ~${KLING_CHAR_LIMIT} chars`;

  const body = `═══ KLING DIRECT 15S MULTISHOT — REFERENCE BREAKDOWN ═══

${sceneLine}
${continuityLine}
${frameLine}
${dustFreeGroundLine}
${wideRule}
${context}

Beat 1 — Hook / Opening Tension (0–3s):
${openingLine}
Camera: Wide opening hold with a subtle push-in.${cameraBreakdownLine}
Environment motion: ${micro}.

Beat 2 — Pressure Build (3–7s):
${pressureLine}
Camera: Steady wide pressure build with a subtle forward creep.${cameraBreakdownLine}
Environment motion: ${micro}.

Beat 3 — Peak Action (7–11s):
${peakLine}
Camera: Wide peak-action read with restrained handheld energy.${cameraBreakdownLine}
Environment motion: ${micro}.

Beat 4 — Resolved Tension / Final Hold (11–15s):
${resolvedLine}
Camera: Locked wide final hold with a subtle pull-back.${cameraBreakdownLine}
Environment motion: ${micro}.`;

  return buildStructuredPrompt({
    fullText: `KLING DIRECT 15S MULTISHOT [${model}]
─────────────────────────────────────────────────────────
${note}
${qLead}
${refLine}
${motionRule}
${context}

${klingLengthLine}
═══ PASTE INTO KLING — direct 15s multishot (copy this block only) ═══
${pasteReadyCore}

─── FULL BREAKDOWN — reference only, do NOT paste into Kling ───
${body}

─────────────────────────────────────────────────────────
HOW TO USE (Kling direct 15s):
1. Generate the master image first with the Nano Banana / Gemini image prompt.
2. Upload the master image as the continuity anchor in Kling 3.0 Pro or Kling 3.0 Standard.
3. Enable Bind Subject (Elements 3.0) so subject identity stays stable across the full 15-second sequence.
4. Paste ONLY the block above the FULL BREAKDOWN line into Kling.
5. Keep full-body 9:16 framing, left-right readability, and the clean reaction lane intact from opening through final hold.
6. Keep grounded paw or hoof contact visible with dust-free ground behavior all the way through the final frame.
✅ Direct one-paste 15-second multishot workflow - continuity preserved from the source/master image.`,
    pasteReady: sanitizeForEngine(pasteReadyCore, "kling"),
    settings: [
      klingLengthLine,
      "Direct 15-second one-paste Kling workflow",
      "Use the source/master image as the continuity anchor",
    ],
    metadata: {
      engine: "kling",
      title: "Kling Direct 15s Multishot",
      variant: "direct-15s-multishot",
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
