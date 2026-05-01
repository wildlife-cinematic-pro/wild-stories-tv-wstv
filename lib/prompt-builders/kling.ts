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
  const safeArc = getSafeArcPrint(arc);
  const contextSnippet = sceneDesc?.trim()
    ? clipPromptContext(sceneDesc.trim())
    : "";
  const isNative = model === "Kling 3.0 Pro" || model === "Kling 3.0 Standard";

  if (!isNative) {
    return buildStructuredPrompt({
      fullText: `KLING DIRECT 15S MULTISHOT requires Kling 3.0 Pro or Kling 3.0 Standard.\nSelected: ${model}. Switch model to activate.`,
      pasteReady: `KLING DIRECT 15S MULTISHOT requires Kling 3.0 Pro or Kling 3.0 Standard.\nSelected: ${model}. Switch model to activate.`,
      metadata: {
        engine: "kling",
        title: "Kling Direct 15s Multishot",
        variant: "direct-15s-multishot",
      },
    });
  }

  const lowerContext = `${predator} ${prey} ${cleanEnv} ${safeArc} ${contextSnippet}`.toLowerCase();
  const isWaterAmbush = /(crocodile|alligator|shark|orca|seal|waterhole|waterline|river|surf|coast|fjord|estuary|marsh|swamp)/.test(
    lowerContext
  );
  const isPackPressure = /(wolf pack|pack|hyena|african wild dog)/.test(
    lowerContext
  );
  const isAerialStrike = /(eagle)/.test(lowerContext);
  const isDefender = /(bison|buffalo|moose|elk|ibex|goat|reindeer|wolverine|defender|territory|giant)/.test(
    lowerContext
  );

  const openingLine = `Image-to-video from the provided master image. Preserve the same ${predator}, ${prey}, ${cleanEnv}, lighting, subject scale, and first-frame composition.`;
  const styleLineLong = `Photorealistic raw wildlife documentary style. ${safeArc} with explosive survival tension and ${tone.video}. Stable anatomy, grounded contact, believable animal body mass, correct physics, readable action, and clean continuity from the master image. No blood, no gore, no visible wounds.`;
  const styleLineShort =
    "Photorealistic raw wildlife documentary style. Stable anatomy, grounded contact, believable body mass, correct physics, readable action, no blood, no gore, no visible wounds.";
  const continuityLong = quality?.referenceLock
    ? "Keep subject identity locked to the master image, preserve markings, habitat continuity, horizon line, and the same readable spacing in every shot."
    : "Preserve animal identity, habitat continuity, horizon line, and the same readable spacing in every shot.";
  const continuityShort =
    "Preserve animal identity, habitat continuity, spacing, and first-frame readability in every shot.";
  const contextLine = contextSnippet
    ? `Use the same scene idea: ${contextSnippet}.`
    : "";
  const weatherLine = cleanWeather ? `Keep the same weather feel: ${cleanWeather}.` : "";

  const waterShotsLong = [
    `Shot 1, 0–3s: Silent danger setup. ${prey} holds at the muddy water edge with tense but natural hesitation while ${predator} stays nearly invisible at the waterline, readable through eyes, snout, armored back, or subtle surface movement. Low documentary push-in, slight ripples, dry grass or reeds moving, both subjects visible and grounded.`,
    `Shot 2, 3–6s: Ambush trigger. ${predator} explodes forward in one low surge from the water or shoreline lane. Mud, spray, and wake kick up in a physically believable burst while ${prey} jerks upward or sideways in immediate survival reaction. Keep anatomy stable, keep both bodies readable, and avoid overlap-heavy chaos.`,
    `Shot 3, 6–10s: Impact struggle without visible injury. ${predator} stays low and drives pressure through the waterline or bank edge while ${prey} braces, slips, twists, or pulls away with grounded resistance. Splashes, churned mud, and tense handheld documentary energy, but no blood, no gore, no visible wounds.`,
    `Shot 4, 10–13s: Dragging or escape pressure. ${predator} pulls toward deeper water, stronger cover, or a tighter strike lane while ${prey} resists with visible body weight, hoof or paw traction, and realistic desperation. Keep both animals fully readable, physics clean, and the struggle unresolved.`,
    `Shot 5, 13–15s: Cliffhanger finish. ${prey} nearly breaks free or regains a narrow escape angle while ${predator} stays locked low in the same attack lane. End on a dramatic splash, recoil, or hard survival beat with both animals still visible and the outcome unresolved.`,
  ];

  const packShotsLong = [
    `Shot 1, 0–3s: Fast hook setup. ${predator} enters with visible pack spacing or coordinated forward pressure while ${prey} stays readable in the same lane, already alert to danger. Wide 9:16 documentary frame, clean subject separation, strong silhouettes, immediate survival tension from frame one.`,
    `Shot 2, 3–6s: Pressure build. ${predator} narrows the reaction lane with one organized advance, cutting escape angles without turning into messy overlap. ${prey} adjusts footing, pivots, or surges forward under pressure while terrain interaction stays grounded and believable.`,
    `Shot 3, 6–10s: Burst action. One explosive acceleration beat from ${predator} forces a decisive survival response from ${prey}. Keep the motion readable, preserve animal spacing, and emphasize weight transfer, traction, and body-mass realism instead of chaotic blur.`,
    `Shot 4, 10–13s: Survival resistance. ${prey} counters with a desperate cut, brace, kick, or last-second angle change while ${predator} keeps pressure on the lane. Camera energy can rise slightly, but anatomy and geography must remain clear.`,
    `Shot 5, 13–15s: Unresolved finish. ${prey} gains only a narrow escape margin or stays trapped in the pressure corridor while ${predator} holds the advantage. End on a cliffhanger survival frame with both sides still visible and the outcome unresolved.`,
  ];

  const aerialShotsLong = [
    `Shot 1, 0–3s: Aerial setup. ${predator} reads instantly above or just off the terrain line while ${prey} moves below in a clean target lane. Keep the frame readable, with strong shape separation and immediate tension from the opening second.`,
    `Shot 2, 3–6s: Commitment beat. ${predator} drops or surges with one controlled strike path while ${prey} reacts with a grounded pivot, sprint, or evasive burst. Preserve natural wing, talon, and body mechanics with no fantasy motion.`,
    `Shot 3, 6–10s: Near-catch pressure. ${predator} closes distance and forces a high-tension reaction without turning the frame into clutter. ${prey} stays readable, terrain cues stay strong, and the action remains sharp and non-graphic.`,
    `Shot 4, 10–13s: Recovery and counter-move. ${prey} twists away, drops lower, or cuts sideways while ${predator} re-centers for one more pressure beat. Keep the action clean, stable, and documentary-real.`,
    `Shot 5, 13–15s: Cliffhanger finish. End on a final near-grab, near-miss, or hovering threat frame with both subjects visible, the escape lane still alive, and the survival outcome unresolved.`,
  ];

  const defenderShotsLong = [
    `Shot 1, 0–3s: Standoff setup. ${predator} and ${prey} lock into the same wide survival frame with immediate tension, clean spacing, and readable body mass. Keep both animals planted, grounded, and clearly visible from the first second.`,
    `Shot 2, 3–6s: Forward commitment. ${predator} steps in with visible force or narrowing pressure while ${prey} braces and answers with planted footing, horn, shoulder, or body-line resistance. Keep geography clear and physics believable.`,
    `Shot 3, 6–10s: Clash or shove without visible injury. One heavy impact or force transfer beat lands with mud, dust, snow, or ground movement, but no blood, no gore, and no visible wounds. Emphasize realistic animal weight and readable traction.`,
    `Shot 4, 10–13s: Resistance phase. ${prey} resists, pushes back, or drags for balance while ${predator} maintains pressure. Keep both bodies visible, contact grounded, and the scene clean enough for documentary viewing.`,
    `Shot 5, 13–15s: Unresolved finish. The dominant animal still has pressure, but the defender or prey remains visibly in the fight. End on a cliffhanger frame with both animals readable and the outcome unresolved.`,
  ];

  const ambushShotsLong = [
    `Shot 1, 0–3s: Ambush setup. ${predator} holds hidden or half-revealed at the edge of cover while ${prey} moves through a readable survival lane. Immediate tension, clear silhouettes, and strong first-frame spacing.`,
    `Shot 2, 3–6s: Sudden lunge. ${predator} commits to one explosive move from cover, brush, or shadow while ${prey} snaps into an instant evasive reaction. Keep the action physical and legible, not blurry or chaotic.`,
    `Shot 3, 6–10s: Escape pressure. ${prey} twists, cuts, or braces while ${predator} stays committed to the same attack line. Terrain contact, body mass, and motion direction must stay consistent with real wildlife physics.`,
    `Shot 4, 10–13s: Pursuit continuation. ${predator} keeps pressure on the lane while ${prey} throws everything into a survival move. Strong subject readability, minimal overlap, and tense handheld documentary energy.`,
    `Shot 5, 13–15s: Cliffhanger survival beat. End on a final near-catch or near-escape frame with both animals visible, tension peaking, and no graphic injury shown.`,
  ];

  const shotSetLong = isWaterAmbush
    ? waterShotsLong
    : isPackPressure
      ? packShotsLong
      : isAerialStrike
        ? aerialShotsLong
        : isDefender
          ? defenderShotsLong
          : ambushShotsLong;

  const shotSetShort = shotSetLong.map((line) =>
    line
      .replace(/ with immediate tension from frame one\./g, ".")
      .replace(/ Keep both animals fully readable,? /g, " Keep both readable, ")
      .replace(/ realistic /g, " ")
      .replace(/ documentary /g, " ")
  );

  const audioLineLong = isWaterAmbush
    ? "Audio: deep water surge, heavy muddy splash, panic movement, wet traction loss, reeds or shoreline rustle, tense documentary ambience."
    : isAerialStrike
      ? "Audio: wing rush, sudden air cut, prey scramble, light terrain scuff, tense documentary ambience."
      : isPackPressure
        ? "Audio: pounding footfalls, heavy breathing, brush or grass movement, short warning calls, tense documentary ambience."
        : isDefender
          ? "Audio: hard breath, hoof or claw traction, body impact thump, ground scrape, tense documentary ambience."
          : "Audio: sharp burst movement, terrain scrape, heavy breathing, tense documentary ambience.";
  const audioLineShort = audioLineLong.replace(", tense documentary ambience.", ".");

  const negativeBase = [
    "blood",
    "gore",
    "visible wounds",
    "torn flesh",
    "exposed wounds",
    "death close-up",
    "dismemberment",
    "fantasy monster",
    "oversized animal",
    "flying animal",
    "floating body",
    "broken legs",
    "extra limbs",
    "duplicate animals",
    "humans",
    "fences",
    "zoo enclosure",
    "text",
    "subtitles",
    "watermark",
    "cartoon",
    "CGI plastic skin",
    "melted anatomy",
    "excessive camera shake",
    "wrong habitat",
  ];
  const predatorLower = predator.toLowerCase();
  if (predatorLower.includes("crocodile") && !predatorLower.includes("alligator")) {
    negativeBase.push("alligator instead of crocodile", "Everglades swamp look");
  }
  if (predatorLower.includes("alligator")) {
    negativeBase.push("crocodile instead of alligator");
  }
  if (predatorLower.includes("shark")) {
    negativeBase.push("riverbank reeds", "muddy waterhole", "Everglades swamp look");
  }
  if (predatorLower.includes("orca")) {
    negativeBase.push("riverbank reeds", "muddy waterhole", "shark fin silhouette");
  }
  const negativeLine = `Negative prompt: ${Array.from(new Set(negativeBase)).join(", ")}`;

  function buildPrompt(
    lines: string[],
    styleLine: string,
    continuityLine: string,
    audioLine: string
  ) {
    return [
      openingLine,
      [styleLine, continuityLine, weatherLine, contextLine].filter(Boolean).join(" "),
      ...lines,
      audioLine,
      negativeLine,
    ]
      .filter(Boolean)
      .join("\n\n")
      .trim();
  }

  let pasteReadyCore = buildPrompt(
    shotSetLong,
    styleLineLong,
    continuityLong,
    audioLineLong
  );

  if (validateKlingPromptLength(pasteReadyCore).length > 2400) {
    pasteReadyCore = buildPrompt(
      shotSetLong,
      styleLineShort,
      continuityShort,
      audioLineLong
    );
  }

  if (validateKlingPromptLength(pasteReadyCore).length > 2400) {
    pasteReadyCore = buildPrompt(
      shotSetShort,
      styleLineShort,
      continuityShort,
      audioLineShort
    );
  }

  if (validateKlingPromptLength(pasteReadyCore).length > 2500) {
    const trimmedContext = contextSnippet
      ? `Same scene idea: ${clipPromptContext(contextSnippet).slice(0, 110)}.`
      : "";
    pasteReadyCore = [
      openingLine,
      [styleLineShort, continuityShort, trimmedContext].filter(Boolean).join(" "),
      ...shotSetShort.map((line) =>
        line.replace(/, and /g, ", ").replace(/ while /g, " while ")
      ),
      audioLineShort,
      negativeLine,
    ]
      .filter(Boolean)
      .join("\n\n")
      .trim();
  }

  const klingValidation = validateKlingPromptLength(pasteReadyCore);
  const klingLengthLine = klingValidation.isOver
    ? `PROMPT TOO LONG for WSTV house budget: ${klingValidation.length} / ~${KLING_CHAR_LIMIT}`
    : `Prompt length within WSTV house budget: ${klingValidation.length} / ~${KLING_CHAR_LIMIT} chars`;

  return buildStructuredPrompt({
    fullText: `KLING DIRECT 15S MULTISHOT [${model}]
─────────────────────────────────────────────────────────
${note}
${qLead}
Style note: ${vibe.style}. ${tone.video}.
${klingWidePhysicsRule()}

${klingLengthLine}
═══ PASTE INTO KLING — stays under 2500 chars (copy this block only) ═══
${pasteReadyCore}

─── OPTIONAL NOTES — reference only, do NOT paste into Kling ───
Primary use: Global Viral Wildlife and other high-tension encounter lanes that start from a master still.
Safety: no blood, no gore, no visible wounds, no death close-up.
Continuity: preserve the same master-image spacing, habitat continuity, body mass, grounded contact, and readable action all the way through Shot 5.`,
    pasteReady: sanitizeForEngine(pasteReadyCore, "kling"),
    settings: [
      klingLengthLine,
      "Direct 15-second one-paste Kling workflow",
      "Negative prompt embedded in the same copy block",
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
