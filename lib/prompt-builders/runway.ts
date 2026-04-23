import type {
  Arc,
  Weather,
  EmotionalTone,
  AnimalVibe,
  CameraAnglePreset,
  QualityOptions,
  RunwayModel,
  StructuredPrompt,
} from "@/types";

import { emotionalTonePrompt } from "@/lib/predator-data";
import { RUNWAY_STYLE_NOTE } from "@/lib/model-specs";

import {
  getHabitatMode,
  oneActionArcBeat,
  buildMicroMotionLine,
  isWaterForwardPreyScenario,
  isRutMirrorMatchScenario,
  getRutMirrorMatchCue,
} from "@/lib/prompt-builders/habitat";
import {
  buildQualityLead,
  maybeGuard,
  type FourShotPromptPack,
  buildStructuredPrompt,
  promptPackToLegacyText,
  buildShotWorldContinuityLock,
} from "@/lib/prompt-builders/shared";
import { buildRunwayCameraPresetLine } from "@/lib/camera-angle-presets";
import {
  clipPromptContext,
  sanitizeRunwayFPS,
  sanitizeVideoBeatText,
} from "@/lib/prompt-builders/sanitizers";

export type RunwayPromptPack = FourShotPromptPack<StructuredPrompt>;

export function buildRunwayPromptPack(
  predator: string,
  prey: string,
  env: string,
  arc: Arc,
  weather: Weather,
  model: RunwayModel,
  emotionalTone: EmotionalTone,
  animalVibe: AnimalVibe,
  sceneDesc?: string,
  quality?: QualityOptions,
  cameraAnglePreset: CameraAnglePreset = "Auto"
): RunwayPromptPack {
  void animalVibe;
  const note = RUNWAY_STYLE_NOTE[model];
  const tone = emotionalTonePrompt[emotionalTone];
  const micro = buildMicroMotionLine(weather, env);
  const habitatMode = getHabitatMode(predator, prey, env);
  const isAquatic = habitatMode === "aquatic";
  const isShoreline = habitatMode === "shoreline";
  const isWaterForwardStrike = isWaterForwardPreyScenario(predator, prey, env);
  const isRutMirrorMatch = isRutMirrorMatchScenario(predator, prey, arc, env);
  const rutCue = getRutMirrorMatchCue(predator);
  const cameraPresetLine = buildRunwayCameraPresetLine(
    cameraAnglePreset,
    habitatMode,
    env
  );
  const cameraPromptTail = cameraPresetLine ? ` ${cameraPresetLine}` : "";
  const cameraBreakdownLine = cameraPresetLine
    ? `\nCamera preset: ${cameraPresetLine}`
    : "";
  const worldPlateContinuity = buildShotWorldContinuityLock("runway");

  const qLead = buildQualityLead(quality, "runway");
  const context = sceneDesc?.trim() ? `\nScene continuity: ${clipPromptContext(sceneDesc.trim())}` : "";

  const refLine = quality?.referenceLock
    ? "Use the uploaded master image or previous last frame as the locked reference."
    : "Use the current shot as the visual guide.";

  const motionRule = quality?.motionOnlyI2V
    ? "⚠️ RUNWAY I2V RULE (Official): Image carries ALL identity (coat, markings, anatomy). This prompt describes MOTION, CAMERA, and PHYSICS only. Do NOT restate subject appearance — doing so reduces motion quality."
    : "Keep appearance text minimal; motion is the priority.";

  const singleRule = quality?.singleActionRule
    ? "One primary subject action and one camera move only."
    : "Keep motion readable and limited.";

  const gateOn = !!quality?.singleActionRule;
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

  const pressurePredator = isRutMirrorMatch
    ? `edges forward with heavier shoulder-line pressure while keeping ${rutCue.room}`
    : isAquatic
      ? "leans into stronger forward water pressure without breaking spacing"
      : isShoreline
        ? isWaterForwardStrike
          ? "leans farther forward from the bank as the shallow strike window tightens"
          : "leans farther forward from the shoreline with stronger visible ambush pressure"
        : "leans farther forward with stronger visible pressure";

  const pressurePrey = isRutMirrorMatch
    ? "braces into one grounded footing reset without giving away the claim line"
    : isAquatic
      ? "tightens posture and makes one readable defensive adjustment in the current"
      : isShoreline
        ? isWaterForwardStrike
          ? "shows one tense surface-break adjustment tight to the bank-edge current"
          : "lowers into one readable defensive footing adjustment near the bank"
        : "lowers into one readable defensive adjustment";

  const shot1PasteReady = sanitizeRunwayFPS(
    isAquatic
      ? `Wide opening hold with a subtle push-in. Both subjects are fully readable from frame one. The left subject glides once with controlled forward pressure through the water. The right subject holds tense position with locked eye-line. Clear spacing, readable threat line, clean motion start.${cameraPromptTail} ${micro}${quality?.seamlessShot ? " Continuous, seamless shot." : ""}`.trim()
      : isShoreline
        ? isWaterForwardStrike
          ? `Wide opening hold with a subtle push-in. Both subjects are fully readable from frame one. The left subject holds low at the bank with the shallow strike window visible. The right subject stays just off the bank with one tense near-surface hold. Clear bank-edge spacing, immediate visible tension, clean motion start.${cameraPromptTail} ${micro}${quality?.seamlessShot ? " Continuous, seamless shot." : ""}`.trim()
          : `Wide opening hold with a subtle push-in. Both subjects are fully readable from frame one. The left subject holds low at the water's edge with visible pressure. The right subject stays tense near the bank with locked eye-line. Clear spacing, readable tension, clean motion start.${cameraPromptTail} ${micro}${quality?.seamlessShot ? " Continuous, seamless shot." : ""}`.trim()
        : isRutMirrorMatch
          ? `Wide opening hold with a subtle push-in. Both subjects are fully readable from frame one. The left subject holds the ${rutCue.line} with ${rutCue.room}. The right subject answers with matching shoulder tension and planted footing. Clear spacing, locked eye-line, dominance visible from the first second.${cameraPromptTail} ${micro}${quality?.seamlessShot ? " Continuous, seamless shot." : ""}`.trim()
          : `Wide opening hold with a subtle push-in. Both subjects are fully readable from frame one. The left subject ${s1.predatorBeat}. The right subject ${s1.preyBeat}. Clear spacing, locked eye-line, readable tension from the first second.${cameraPromptTail} ${micro}${quality?.seamlessShot ? " Continuous, seamless shot." : ""}`.trim()
  );

  const shot2PasteReady = sanitizeRunwayFPS(
    isAquatic
      ? `Wide pressure-build tracking shot with a gentle forward drift. Both subjects stay fully visible. The left subject leans into stronger forward water pressure without breaking spacing. The right subject tightens posture and makes one readable defensive adjustment in the current. The tension line grows stronger, spacing stays readable, and overlap stays controlled. Water displacement and current response build naturally. ${worldPlateContinuity}${cameraPromptTail} ${micro}${quality?.seamlessShot ? " Continuous, seamless shot." : ""}`.trim()
      : isShoreline
        ? isWaterForwardStrike
          ? `Wide pressure-build tracking shot with a gentle forward drift. Both subjects stay fully visible. The left subject leans farther forward from the bank as the shallow strike window tightens. The right subject shows one tense surface-break adjustment tight to the bank-edge current. The strike line grows stronger, spacing stays clear, and overlap stays controlled. Bank-edge splash, shoreline reaction, and surface break stay natural. ${worldPlateContinuity}${cameraPromptTail} ${micro}${quality?.seamlessShot ? " Continuous, seamless shot." : ""}`.trim()
          : `Wide pressure-build tracking shot with a gentle forward drift. Both subjects stay fully visible. The left subject leans farther forward from the shoreline with stronger visible ambush pressure. The right subject lowers into one readable defensive footing adjustment near the bank. The tension line grows stronger, spacing stays readable, and overlap stays controlled. Splash and bank disturbance remain natural. ${worldPlateContinuity}${cameraPromptTail} ${micro}${quality?.seamlessShot ? " Continuous, seamless shot." : ""}`.trim()
        : isRutMirrorMatch
          ? `Wide pressure-build tracking shot with a gentle forward drift. Both subjects stay fully visible. The left subject edges forward with heavier shoulder-line pressure while keeping ${rutCue.room}. The right subject braces into one grounded footing reset without giving away the claim line. The standoff geometry tightens, spacing stays readable, and overlap stays controlled. Hoof traction and churned rut footing stay natural. ${worldPlateContinuity}${cameraPromptTail} ${micro}${quality?.seamlessShot ? " Continuous, seamless shot." : ""}`.trim()
          : `Wide pressure-build tracking shot with a gentle forward drift. Both subjects stay fully visible. The left subject ${pressurePredator}. The right subject ${pressurePrey}. The tension line grows stronger, spacing stays readable, and overlap stays controlled. Ground compression and clean weight transfer stay natural. ${worldPlateContinuity}${cameraPromptTail} ${micro}${quality?.seamlessShot ? " Continuous, seamless shot." : ""}`.trim()
  );

  const shot3PasteReady = sanitizeRunwayFPS(
    isAquatic
      ? `Wide peak-action read with restrained tracking. Both subjects stay fully visible. The left subject commits to one fast water-pressure burst. The right subject reacts with one evasive dart. Clear pursuit line, readable spacing, no overlap. Water displacement and current response stay forceful but readable. ${worldPlateContinuity}${cameraPromptTail} ${micro}${quality?.seamlessShot ? " Continuous, seamless shot." : ""}`.trim()
      : isShoreline
        ? isWaterForwardStrike
          ? `Wide peak-action read with restrained tracking. Both subjects stay fully visible. The left subject bursts once from the bank edge into the strike window. The right subject reacts with one surface-break dart and turn. Clear predator-to-prey line, readable spacing, no overlap. Shoreline reaction, bank splash, and surface break stay forceful but readable. ${worldPlateContinuity}${cameraPromptTail} ${micro}${quality?.seamlessShot ? " Continuous, seamless shot." : ""}`.trim()
          : `Wide peak-action read with restrained tracking. Both subjects stay fully visible. The left subject bursts once from the shoreline. The right subject reacts with one evasive leap and turn. Clear predator-to-prey line, readable spacing, no overlap. Splash and bank disturbance stay forceful but readable. ${worldPlateContinuity}${cameraPromptTail} ${micro}${quality?.seamlessShot ? " Continuous, seamless shot." : ""}`.trim()
        : isRutMirrorMatch
          ? `Wide peak-action read with restrained tracking. Both subjects stay fully visible. The left subject loads weight and commits one heavy clash beat while keeping ${rutCue.room}. The right subject answers with one grounded shove or recoil without losing planted footing. Clear clash line, readable spacing, no overlap. Hoof traction and heavy shoulder transfer stay readable at speed. ${worldPlateContinuity}${cameraPromptTail} ${micro}${quality?.seamlessShot ? " Continuous, seamless shot." : ""}`.trim()
          : `Wide peak-action read with restrained tracking. Both subjects stay fully visible. The left subject ${s3.predatorBeat}. The right subject ${s3.preyBeat}. Clear predator-to-prey line, readable spacing, no overlap. Ground compression and clean weight transfer stay readable at speed. ${worldPlateContinuity}${cameraPromptTail} ${micro}${quality?.seamlessShot ? " Continuous, seamless shot." : ""}`.trim()
  );

  const shot4PasteReady = sanitizeRunwayFPS(
    isAquatic
      ? `Wide aftermath hold with a slow pull-back. Both subjects remain fully readable. The left subject slows and stabilizes in the water. The right subject holds tense eye-line as residual turbulence settles. Clear spacing remains readable to the end. ${worldPlateContinuity}${cameraPromptTail} ${micro}${quality?.seamlessShot ? " Continuous, seamless shot." : ""}`.trim()
      : isShoreline
        ? isWaterForwardStrike
          ? `Wide aftermath hold with a slow pull-back. Both subjects remain fully readable. The left subject settles low at the bank edge. The right subject holds a tense near-surface line as residual splash and shoreline reaction fade. Clear spacing remains readable to the end. ${worldPlateContinuity}${cameraPromptTail} ${micro}${quality?.seamlessShot ? " Continuous, seamless shot." : ""}`.trim()
          : `Wide aftermath hold with a slow pull-back. Both subjects remain fully readable. The left subject settles low at the waterline. The right subject holds tense eye-line as residual splash and bank disturbance fade. Clear spacing remains readable to the end. ${worldPlateContinuity}${cameraPromptTail} ${micro}${quality?.seamlessShot ? " Continuous, seamless shot." : ""}`.trim()
        : isRutMirrorMatch
          ? `Wide aftermath hold with a slow pull-back. Both subjects remain fully readable. The left subject settles weight while keeping the ${rutCue.line} clean. The right subject rebalances once and holds the claim line. Residual atmosphere settles while spacing stays clear to the final frame. ${worldPlateContinuity}${cameraPromptTail} ${micro}${quality?.seamlessShot ? " Continuous, seamless shot." : ""}`.trim()
          : `Wide aftermath hold with a slow pull-back. Both subjects remain fully readable. The left subject ${s4.predatorBeat}. The right subject ${s4.preyBeat}. Residual atmosphere settles while spacing stays clear to the final frame. ${worldPlateContinuity}${cameraPromptTail} ${micro}${quality?.seamlessShot ? " Continuous, seamless shot." : ""}`.trim()
  );

  return {
    shot1: buildStructuredPrompt({
      fullText: `RUNWAY SHOT 1 — OPENING TENSION [${model}]
${note}
${qLead}
${refLine}
${motionRule}
${singleRule}
${maybeGuard(s1.guardLine)}${context}

═══ PASTE-READY I2V PROMPT (copy this into Runway) ═══
${shot1PasteReady}

─── SHOT BREAKDOWN ───
Camera motion: wide opening hold with a subtle push-in.
Opening priority: both subjects fully readable from frame one, immediate visible tension, locked eye-line, clear spacing.
Subject action: left subject ${s1.predatorBeat}.
Right-side reaction: right subject ${s1.preyBeat}.
Environment motion: ${micro}.${cameraBreakdownLine}
Tone: ${tone.video}.
Framing: wide opening read, full-body visibility, clean silhouette separation.${cameraBreakdownLine}
Duration: 5 seconds recommended for the 4-shot WSTV workflow.
FPS: 24 or 25 (set in Advanced).
⚠️ No negative prompt — Runway does not support negatives.
After generation: chain from the last frame only if it remains a clean full-body handoff frame. Otherwise reuse the master still or a manually selected clean frame for Shot 2.`,
      pasteReady: shot1PasteReady,
      settings: ["FPS 24 or 25", "Duration 5s recommended", "No negative prompt"],
      metadata: {
        engine: "runway",
        shotKey: "shot1",
        title: `Runway Shot 1 — Opening Tension [${model}]`,
        durationSeconds: 5,
        variant: "single-shot",
      },
    }),
    shot2: buildStructuredPrompt({
      fullText: `RUNWAY SHOT 2 — PRESSURE BUILD [${model}]
${note}
${qLead}
${refLine}
${motionRule}
${singleRule}
${context}

═══ PASTE-READY I2V PROMPT (copy this into Runway) ═══
${shot2PasteReady}

─── SHOT BREAKDOWN ───
Camera motion: wide pressure-build tracking shot with a gentle forward drift.
Action priority: both subjects fully visible, tension rising clearly, readable spacing, no overlap.
Subject action: left subject ${pressurePredator}.
Right-side reaction: right subject ${pressurePrey}.
Environment motion: ${
  isAquatic
    ? `water displacement, turbulence, current response, ${micro}`
    : isShoreline
      ? isWaterForwardStrike
        ? `surface break, bank-edge splash, shoreline reaction, ${micro}`
        : `splash, mud scatter, shoreline disturbance, ${micro}`
      : isRutMirrorMatch
        ? `churned rut footing, hoof traction, shoulder-weight transfer, ${micro}`
        : `ground compression, foliage response, controlled weight transfer, ${micro}`
}.
Physics: ${
  isAquatic
    ? "preserve believable water resistance, directional momentum, and controlled spacing."
    : isShoreline
      ? isWaterForwardStrike
        ? "preserve believable bank-edge timing, shallow-water reaction, and clean subject separation."
        : "preserve believable shoreline traction, splash interaction, mud displacement, and readable spacing."
      : isRutMirrorMatch
        ? "preserve planted footing, open clash geometry, and readable heavy-body transfer."
        : "preserve natural acceleration, tension build, and controlled spacing."
}
Framing: wide action readability, full-body visibility, clean silhouette separation.${cameraBreakdownLine}
Duration: 5 seconds recommended for the 4-shot WSTV workflow.
⚠️ Use Shot 1 last frame as I2V input only if it remains a clean full-body handoff frame. Otherwise reuse the master still or a manually selected clean frame.`,
      pasteReady: shot2PasteReady,
      settings: ["Duration 5s recommended", "Motion-only I2V", "Clean handoff frame only"],
      metadata: {
        engine: "runway",
        shotKey: "shot2",
        title: `Runway Shot 2 — Pressure Build [${model}]`,
        durationSeconds: 5,
        variant: "single-shot",
      },
    }),
    shot3: buildStructuredPrompt({
      fullText: `RUNWAY SHOT 3 — PEAK ACTION [${model}]
${note}
${qLead}
${refLine}
${motionRule}
${singleRule}
${maybeGuard(s3.guardLine)}${context}

═══ PASTE-READY I2V PROMPT (copy this into Runway) ═══
${shot3PasteReady}

─── SHOT BREAKDOWN ───
Camera motion: wide peak-action read with restrained tracking.
Action priority: both subjects fully visible, readable force, clear predator-to-prey spacing, no overlap.
Subject action: left subject ${s3.predatorBeat}.
Right-side reaction: right subject ${s3.preyBeat}.
Environment motion: ${
  isAquatic
    ? `water displacement, turbulence, current response, ${micro}`
    : isShoreline
      ? isWaterForwardStrike
        ? `surface break, bank-edge splash, shoreline reaction, ${micro}`
        : `splash, mud scatter, shoreline disturbance, ${micro}`
      : isRutMirrorMatch
        ? `churned rut footing, hoof traction, heavy shoulder transfer, ${micro}`
        : `ground compression, foliage response, body-weight transfer, ${micro}`
}.
Mood: ${tone.video}.
Framing: wide peak-action readability, full-body visibility, clean separation.
Duration: 5 seconds recommended for the 4-shot WSTV workflow.
⚠️ Use Shot 2 last frame as I2V input only if it remains a clean full-body handoff frame. Otherwise reuse the master still or a manually selected clean continuity frame.`,
      pasteReady: shot3PasteReady,
      settings: ["Duration 5s recommended", "Readable force transfer", "Clean handoff frame only"],
      metadata: {
        engine: "runway",
        shotKey: "shot3",
        title: `Runway Shot 3 — Peak Action [${model}]`,
        durationSeconds: 5,
        variant: "single-shot",
      },
    }),
    shot4: buildStructuredPrompt({
      fullText: `RUNWAY SHOT 4 — RESOLVED TENSION [${model}]
${note}
${qLead}
${refLine}
${motionRule}
${singleRule}
${maybeGuard(s4.guardLine)}${context}

═══ PASTE-READY I2V PROMPT (copy this into Runway) ═══
${shot4PasteReady}

─── SHOT BREAKDOWN ───
Camera motion: wide aftermath hold with a slow pull-back.
End-state priority: both subjects fully readable, spacing still clear, tension remains visible to the final frame.
Subject action: left subject ${s4.predatorBeat}.
Right-side reaction: right subject ${s4.preyBeat}.
Environment motion: residual atmosphere — ${micro}.
Mood: ${tone.image}.
Framing: wide aftermath readability, full-body visibility, clean separation.
Duration: 5 seconds recommended for the 4-shot WSTV workflow.
⚠️ Use Shot 3 last frame as I2V input only if it remains a clean full-body handoff frame. Otherwise reuse the master still or a manually selected clean continuity frame.`,
      pasteReady: shot4PasteReady,
      settings: ["Duration 5s recommended", "Slow pull-back", "Clean handoff frame only"],
      metadata: {
        engine: "runway",
        shotKey: "shot4",
        title: `Runway Shot 4 — Resolved Tension [${model}]`,
        durationSeconds: 5,
        variant: "single-shot",
      },
    }),
  };
}

export function buildRunwayShots(
  predator: string,
  prey: string,
  env: string,
  arc: Arc,
  weather: Weather,
  model: RunwayModel,
  emotionalTone: EmotionalTone,
  animalVibe: AnimalVibe,
  sceneDesc?: string,
  quality?: QualityOptions
): { shot1: string; shot2: string; shot3: string; shot4: string } {
  return promptPackToLegacyText(
    buildRunwayPromptPack(
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
