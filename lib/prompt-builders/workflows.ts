import type {
  Arc,
  Weather,
  EmotionalTone,
  AnimalVibe,
  CameraAnglePreset,
  DurationLane,
  QualityOptions,
  RunwayModel,
  KlingModel,
  StructuredPrompt,
} from "@/types";

import { emotionalTonePrompt, animalVibePrompt } from "@/lib/predator-data";
import { RUNWAY_STYLE_NOTE, KLING_STYLE_NOTE } from "@/lib/model-specs";

import {
  getHabitatMode,
  oneActionArcBeat,
  buildMicroMotionLine,
} from "@/lib/prompt-builders/habitat";
import {
  buildQualityLead,
  buildKlingLocationLine,
  buildKlingCharacterLine,
  buildKlingExtraLine,
  formatActionSubject,
  klingWidePhysicsRule,
  maybeGuard,
  buildKlingAudioPrompt,
  getKlingMotionIntensity,
  type FourShotPromptPack,
  buildStructuredPrompt,
  promptPackToLegacyText,
} from "@/lib/prompt-builders/shared";
import { buildRunwayPromptPack } from "@/lib/prompt-builders/runway";
import { buildKlingPromptPack } from "@/lib/prompt-builders/kling";
import { buildSeedancePromptPack } from "@/lib/prompt-builders/seedance";
import {
  buildKlingCameraPresetLine,
  buildRunwayCameraPresetLine,
} from "@/lib/camera-angle-presets";
import { sanitizeForEngine } from "@/lib/prompt-builders/safety-vocabulary";
import {
  clipPromptContext,
  sanitizeRunwayFPS,
  sanitizeRunwayPrompt,
  sanitizeVideoBeatText,
} from "@/lib/prompt-builders/sanitizers";

export type FourShotWorkflowMode = "hybrid" | "runway-only" | "kling-only" | "seedance";
export type WorkflowPromptPack = FourShotPromptPack<StructuredPrompt>;

function finalizeWorkflowRunwayPasteReady(text: string): string {
  return sanitizeRunwayPrompt(
    sanitizeVideoBeatText(sanitizeForEngine(sanitizeRunwayFPS(text), "runway"))
  );
}

function finalizeWorkflowKlingPasteReady(text: string): string {
  return sanitizeForEngine(sanitizeVideoBeatText(text), "kling");
}

export function buildHybridPromptPack(
  predator: string,
  prey: string,
  env: string,
  arc: Arc,
  weather: Weather,
  runwayModel: RunwayModel,
  klingModel: KlingModel,
  emotionalTone: EmotionalTone,
  animalVibe: AnimalVibe,
  sceneDesc?: string,
  quality?: QualityOptions,
  cameraAnglePreset: CameraAnglePreset = "Auto"
): WorkflowPromptPack {
  const runway = buildRunwayPromptPack(
    predator,
    prey,
    env,
    arc,
    weather,
    runwayModel,
    emotionalTone,
    animalVibe,
    sceneDesc,
    quality,
    cameraAnglePreset
  );
  const kling = buildKlingPromptPack(
    predator,
    prey,
    env,
    arc,
    weather,
    klingModel,
    emotionalTone,
    animalVibe,
    sceneDesc,
    quality,
    cameraAnglePreset
  );

  return {
    shot1: runway.shot1,
    shot2: kling.shot2,
    shot3: kling.shot3,
    shot4: runway.shot4,
  };
}

export function buildHybridFourShotWorkflow(
  predator: string,
  prey: string,
  env: string,
  arc: Arc,
  weather: Weather,
  runwayModel: RunwayModel,
  klingModel: KlingModel,
  emotionalTone: EmotionalTone,
  animalVibe: AnimalVibe,
  sceneDesc?: string,
  quality?: QualityOptions,
  cameraAnglePreset: CameraAnglePreset = "Auto"
): { shot1: string; shot2: string; shot3: string; shot4: string } {
  return promptPackToLegacyText(
    buildHybridPromptPack(
      predator,
      prey,
      env,
      arc,
      weather,
      runwayModel,
      klingModel,
      emotionalTone,
      animalVibe,
      sceneDesc,
      quality,
      cameraAnglePreset
    )
  );
}

export function buildHybridLongPromptPack(
  predator: string,
  prey: string,
  env: string,
  arc: Arc,
  weather: Weather,
  runwayModel: RunwayModel,
  klingModel: KlingModel,
  emotionalTone: EmotionalTone,
  animalVibe: AnimalVibe,
  sceneDesc?: string,
  quality?: QualityOptions,
  cameraAnglePreset: CameraAnglePreset = "Auto"
): WorkflowPromptPack {
  const runwayNote = RUNWAY_STYLE_NOTE[runwayModel];
  const klingNote = KLING_STYLE_NOTE[klingModel];
  const tone = emotionalTonePrompt[emotionalTone];
  const vibe = animalVibePrompt[animalVibe];
  const micro = buildMicroMotionLine(weather, env);
  const habitatMode = getHabitatMode(predator, prey, env);
  const isAquatic = habitatMode === "aquatic";
  const isShoreline = habitatMode === "shoreline";
  const runwayCameraPresetLine = buildRunwayCameraPresetLine(
    cameraAnglePreset,
    habitatMode,
    env
  );
  const klingCameraPresetLine = buildKlingCameraPresetLine(
    cameraAnglePreset,
    habitatMode,
    env
  );
  const runwayCameraTail = runwayCameraPresetLine
    ? ` ${runwayCameraPresetLine}`
    : "";
  const klingCameraTail = klingCameraPresetLine
    ? ` ${klingCameraPresetLine}`
    : "";
  const runwayCameraBreakdown = runwayCameraPresetLine
    ? `\nCamera preset: ${runwayCameraPresetLine}`
    : "";
  const klingCameraBreakdown = klingCameraPresetLine
    ? `\nCamera preset: ${klingCameraPresetLine}`
    : "";

  const runwayLead = buildQualityLead(quality, "runway");
  const klingLead = buildQualityLead(quality, "kling");
  const context = sceneDesc?.trim()
    ? `\nScene continuity: ${clipPromptContext(sceneDesc.trim())}`
    : "";

  const runwayRefLine = quality?.referenceLock
    ? "Use the uploaded master image or previous last frame as the locked reference."
    : "Use the current shot as the visual guide.";
  const klingRefLine = quality?.referenceLock
    ? "Reference lock active — enable 'Bind Subject' (Elements 3.0) to preserve exact subject identity from the input frame."
    : "Preserve overall continuity from the source frame.";

  const runwayMotionRule = quality?.motionOnlyI2V
    ? "⚠️ RUNWAY I2V RULE (Official): Image carries ALL identity, composition, lighting, and style. This prompt describes MOTION, CAMERA, TIMING, and PHYSICS only."
    : "Keep appearance text minimal; motion and timing are the priority.";
  const klingMotionRule = quality?.motionOnlyI2V
    ? "Motion-only prompting active — keep Kling focused on subject movement first, then spacing, timing, background motion, and readable physics from the input frame."
    : "Keep visual restatement minimal.";

  const singleRule = quality?.singleActionRule
    ? "One dominant action beat per shot and one camera move only."
    : "Keep each shot centered on one readable action beat.";
  const wideRule = klingWidePhysicsRule();

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

  const locationLine = buildKlingLocationLine(env, weather, quality?.motionOnlyI2V);
  const locationCore = locationLine.replace(/^Lighting & Location:\s*/i, "");
  const characterLine = buildKlingCharacterLine(predator, prey, quality?.motionOnlyI2V);
  const buildIntensity = Math.max(
    0.1,
    Number(
      (
        (getKlingMotionIntensity(arc, "establish") + getKlingMotionIntensity(arc, "action")) / 2 -
        0.05
      ).toFixed(2)
    )
  );
  const payoffIntensity = Number(
    Math.min(1, getKlingMotionIntensity(arc, "action") + 0.05).toFixed(2)
  );

  const openingPredator = isAquatic
    ? "glides once with restrained forward pressure through the current"
    : isShoreline
      ? "holds low at the waterline with visible approach pressure"
      : s1.predatorBeat;
  const openingPrey = isAquatic
    ? "holds tense position once and keeps locked eye-line in the current"
    : isShoreline
      ? "stays tense near the bank with one readable defensive hold"
      : s1.preyBeat;
  const pressurePredator = isAquatic
    ? `${predator} compresses distance slowly through the water while spacing stays readable`
    : isShoreline
      ? `${predator} leans farther forward from the shoreline as the spacing tightens before the full commitment lands`
      : `${predator} leans farther forward as the spacing tightens before the full commitment lands`;
  const pressurePrey = isAquatic
    ? `${prey} makes one readable defensive adjustment in the current and keeps survival tension visible`
    : isShoreline
      ? `${prey} lowers into one readable footing adjustment near the bank and keeps body-language tension visible`
      : `${prey} lowers into one readable defensive adjustment and keeps body-language tension visible`;

  const longShot1PasteReady = finalizeWorkflowRunwayPasteReady(
    isAquatic
      ? `Wide opening hold for first-frame clarity, then a restrained slow push-in over the full 10-second beat. Both subjects stay fully readable from frame one. The left subject ${openingPredator}. The right subject ${openingPrey}. Let the setup breathe before the tension tightens. Clear spacing, one clean threat line, and a restrained first action beat.${runwayCameraTail} ${micro}${quality?.seamlessShot ? " Continuous, seamless shot." : ""}`.trim()
      : isShoreline
        ? `Wide opening hold for first-frame clarity, then a restrained slow push-in over the full 10-second beat. Both subjects stay fully readable from frame one. The left subject ${openingPredator}. The right subject ${openingPrey}. Let the readable shoreline setup breathe before the tension tightens. Clear spacing, one clean threat line, and a restrained first action beat.${runwayCameraTail} ${micro}${quality?.seamlessShot ? " Continuous, seamless shot." : ""}`.trim()
        : `Wide opening hold for first-frame clarity, then a restrained slow push-in over the full 10-second beat. Both subjects stay fully readable from frame one. The left subject ${openingPredator}. The right subject ${openingPrey}. Let the readable setup breathe before the tension tightens. Clear spacing, one clean threat line, and a restrained first action beat.${runwayCameraTail} ${micro}${quality?.seamlessShot ? " Continuous, seamless shot." : ""}`.trim()
  );

  const longShot2PasteReady = finalizeWorkflowKlingPasteReady(
    isAquatic
      ? `Locked wide pressure-build shot with a very slow forward creep across 15 seconds.${klingCameraTail} ${pressurePredator}. ${pressurePrey}. Let the spacing tighten gradually, keep the body language readable, and hold the threat line long enough for pressure to build. The first impact waits for the payoff beat. ${locationCore}. Surface turbulence and water displacement stay controlled. Then both subjects settle into a tense pre-action hold.`
      : isShoreline
        ? `Locked wide pressure-build shot with a very slow forward creep across 15 seconds.${klingCameraTail} ${pressurePredator}. ${pressurePrey}. Let the spacing tighten gradually, keep the body language readable, and hold the threat line long enough for pressure to build. The first impact waits for the payoff beat. ${locationCore}. Splash and bank disturbance stay controlled. Then both subjects settle into a tense pre-action hold.`
        : `Locked wide pressure-build shot with a very slow forward creep across 15 seconds.${klingCameraTail} ${pressurePredator}. ${pressurePrey}. Let the spacing tighten gradually, keep the body language readable, and hold the threat line long enough for pressure to build. The first impact waits for the payoff beat. ${locationCore}. Grounded weight transfer stays controlled. Then both subjects settle into a tense pre-action hold.`
  );

  const longShot3PasteReady = finalizeWorkflowKlingPasteReady(
    isAquatic
      ? `Wide main-action payoff across 15 seconds with restrained handheld energy.${klingCameraTail} ${formatActionSubject(predator, s3.predatorBeat)}. ${prey} ${s3.preyBeat}. Peak pressure lands once, stays readable, then eases into a clean chained end-state. Spacing stays readable, and overlap stays controlled. ${locationCore}. Water displacement and turbulence stay forceful but controlled.`
      : isShoreline
        ? `Wide main-action payoff across 15 seconds with restrained handheld energy.${klingCameraTail} ${formatActionSubject(predator, s3.predatorBeat)}. ${prey} ${s3.preyBeat}. Peak pressure lands once, stays readable, then eases into a clean chained end-state. Spacing stays readable, and overlap stays controlled. ${locationCore}. Splash and bank response stay forceful but controlled.`
        : `Wide main-action payoff across 15 seconds with restrained handheld energy.${klingCameraTail} ${formatActionSubject(predator, s3.predatorBeat)}. ${prey} ${s3.preyBeat}. Peak pressure lands once, stays readable, then eases into a clean chained end-state. Spacing stays readable, and overlap stays controlled. ${locationCore}. Grounded weight transfer and surface response stay forceful but controlled.`
  );

  const longShot4PasteReady = finalizeWorkflowRunwayPasteReady(
    isAquatic
      ? `Wide aftermath hold with a slow pull-back over the full 10-second resolve. Both subjects remain fully readable. The left subject ${s4.predatorBeat}. The right subject ${s4.preyBeat}. Let the winner hold, retreat, or stare-down settle as the resolve closes cleanly. Residual turbulence fades while final spacing stays clean for the last frame.${runwayCameraTail} ${micro}${quality?.seamlessShot ? " Continuous, seamless shot." : ""}`.trim()
      : isShoreline
        ? `Wide aftermath hold with a slow pull-back over the full 10-second resolve. Both subjects remain fully readable. The left subject ${s4.predatorBeat}. The right subject ${s4.preyBeat}. Let the winner hold, retreat, or stare-down settle as the resolve closes cleanly. Residual splash and shoreline disturbance fade while final spacing stays clean for the last frame.${runwayCameraTail} ${micro}${quality?.seamlessShot ? " Continuous, seamless shot." : ""}`.trim()
        : `Wide aftermath hold with a slow pull-back over the full 10-second resolve. Both subjects remain fully readable. The left subject ${s4.predatorBeat}. The right subject ${s4.preyBeat}. Let the winner hold, retreat, or stare-down settle as the resolve closes cleanly. Residual atmosphere fades while final spacing stays clean for the last frame.${runwayCameraTail} ${micro}${quality?.seamlessShot ? " Continuous, seamless shot." : ""}`.trim()
  );

  return {
    shot1: buildStructuredPrompt({
      fullText: `RUNWAY SHOT 1 — OPENING TENSION (LONG LANE 10s) [${runwayModel}]
${runwayNote}
${runwayLead}
${runwayRefLine}
${runwayMotionRule}
${singleRule}
${maybeGuard(s1.guardLine)}${context}

═══ PASTE-READY I2V PROMPT (copy this into Runway) ═══
${longShot1PasteReady}

─── SHOT BREAKDOWN ───
Role: opening tension, readable setup, and first-frame clarity for the long hybrid lane.
Camera motion: wide opening hold first, then restrained slow push-in only.
Timing: 0-4s clear setup, 4-8s pressure hold, 8-10s subtle tightening.
Subject action: left subject ${openingPredator}.
Right-side reaction: right subject ${openingPrey}.
Environment motion: ${micro}.${runwayCameraBreakdown}
Tone: ${tone.video}.
Framing: wide opening read, full-body visibility, clean silhouette separation.${runwayCameraBreakdown}
Duration: 10 seconds for the long-lane hybrid workflow.
FPS: 24 or 25 (set in Advanced).
⚠️ No negative prompt — Runway does not support negatives.
After generation: use the last frame for Shot 2 only if it remains a clean full-body handoff frame. Otherwise reuse the master still or a manually selected clean continuity frame.`,
      pasteReady: longShot1PasteReady,
      settings: ["Duration 10s", "FPS 24 or 25", "No negative prompt"],
      metadata: {
        engine: "runway",
        shotKey: "shot1",
        title: `Runway Shot 1 — Opening Tension (Long Lane 10s) [${runwayModel}]`,
        durationSeconds: 10,
        variant: "hybrid",
        workflowRole: "opening-tension",
      },
    }),
    shot2: buildStructuredPrompt({
      fullText: `KLING SHOT 2 — PRESSURE BUILD (LONG LANE 15s) [${klingModel}]
${klingNote}
${klingLead}
${klingRefLine}
${klingMotionRule}
${singleRule}
${wideRule}
Motion intensity: ${buildIntensity.toFixed(2)}
Role: pressure build, spacing collapse, and readable body-language escalation before the payoff.
${context}

═══ PASTE-READY KLING PROMPT (copy this block into Kling) ═══
${longShot2PasteReady}

─── FULL BREAKDOWN (reference only) ───
Characters: ${characterLine.replace(/^Characters:\s*/i, "")}
Action: ${pressurePredator}. ${pressurePrey}.
${locationLine}${klingCameraBreakdown}
Extra: ${buildKlingExtraLine(
  isAquatic
    ? `Surface response, readable water pressure, ${micro}. Physics priority: coherent limbs, controlled spacing, slower suspense build`
    : isShoreline
      ? `Splash response, muddy bank displacement, shallow-water disturbance, ${micro}. Physics priority: coherent limbs, grounded traction, readable spacing, slower suspense build`
      : `Surface response, grounded contact, ${micro}. Physics priority: coherent limbs, grounded weight, readable spacing, slower suspense build`,
  quality?.motionOnlyI2V
)} ${quality?.motionOnlyI2V || quality?.referenceLock ? "" : `${tone.video}. ${vibe.style}.`}

${buildKlingAudioPrompt(predator, prey, env, weather, arc, "establish")}

Kling settings: Motion intensity ${buildIntensity.toFixed(2)} | WIDE framing enforced | Use Shot 1 last frame only if it remains a clean full-body handoff frame; otherwise use the master still or a manually selected clean reference frame`,
      pasteReady: longShot2PasteReady,
      audio: buildKlingAudioPrompt(predator, prey, env, weather, arc, "establish"),
      settings: [
        `Motion intensity ${buildIntensity.toFixed(2)}`,
        "WIDE framing enforced",
        "Use clean Shot 1 handoff frame only",
      ],
      metadata: {
        engine: "kling",
        shotKey: "shot2",
        title: `Kling Shot 2 — Pressure Build (Long Lane 15s) [${klingModel}]`,
        motionIntensity: buildIntensity,
        durationSeconds: 15,
        variant: "hybrid",
        workflowRole: "pressure-build",
      },
    }),
    shot3: buildStructuredPrompt({
      fullText: `KLING SHOT 3 — MAIN ACTION / PAYOFF (LONG LANE 15s) [${klingModel}]
${klingNote}
${klingLead}
${klingRefLine}
${klingMotionRule}
${singleRule}
${wideRule}
Motion intensity: ${payoffIntensity.toFixed(2)}
Role: main action, peak pressure, and readable payoff that still chains safely into the aftermath.
${maybeGuard(s3.guardLine)}${context}

═══ PASTE-READY KLING PROMPT (copy this block into Kling) ═══
${longShot3PasteReady}

─── FULL BREAKDOWN (reference only) ───
Characters: ${characterLine.replace(/^Characters:\s*/i, "")}
Action: ${formatActionSubject(predator, s3.predatorBeat)}. ${prey} ${s3.preyBeat}.
${locationLine}${klingCameraBreakdown}
Extra: ${buildKlingExtraLine(
  isAquatic
    ? `${micro}. Peak pressure lands once, bodies separate cleanly, and the shot ends on a stable chained frame`
    : isShoreline
      ? `Shallow-water reaction, bank disturbance, ${micro}. Peak pressure lands once, bodies separate cleanly, and the shot ends on a stable chained frame`
      : `${micro}. Peak pressure lands once, bodies separate cleanly, and the shot ends on a stable chained frame`,
  quality?.motionOnlyI2V
)} ${quality?.motionOnlyI2V ? "" : `${tone.image}.`}

${buildKlingAudioPrompt(predator, prey, env, weather, arc, "action")}

Kling settings: Motion intensity ${payoffIntensity.toFixed(2)} | WIDE framing enforced | Use Shot 2 last frame only if it remains a clean full-body handoff frame; otherwise use the master still or a manually selected clean continuity frame`,
      pasteReady: longShot3PasteReady,
      audio: buildKlingAudioPrompt(predator, prey, env, weather, arc, "action"),
      settings: [
        `Motion intensity ${payoffIntensity.toFixed(2)}`,
        "WIDE framing enforced",
        "Use clean Shot 2 handoff frame only",
      ],
      metadata: {
        engine: "kling",
        shotKey: "shot3",
        title: `Kling Shot 3 — Main Action / Payoff (Long Lane 15s) [${klingModel}]`,
        motionIntensity: payoffIntensity,
        durationSeconds: 15,
        variant: "hybrid",
        workflowRole: "main-action",
      },
    }),
    shot4: buildStructuredPrompt({
      fullText: `RUNWAY SHOT 4 — AFTERMATH / RESOLVE (LONG LANE 10s) [${runwayModel}]
${runwayNote}
${runwayLead}
${runwayRefLine}
${runwayMotionRule}
${singleRule}
${maybeGuard(s4.guardLine)}${context}

═══ PASTE-READY I2V PROMPT (copy this into Runway) ═══
${longShot4PasteReady}

─── SHOT BREAKDOWN ───
Role: aftermath, winner hold, retreat or stare-down, and cinematic long-form resolve.
Camera motion: wide aftermath hold with a slow pull-back only.
Timing: 0-4s immediate readable outcome, 4-8s settle and hold, 8-10s clean final frame.
Subject action: left subject ${s4.predatorBeat}.
Right-side reaction: right subject ${s4.preyBeat}.
Environment motion: residual atmosphere — ${micro}.
Mood: ${tone.image}.
Framing: wide aftermath readability, full-body visibility, clean separation.${runwayCameraBreakdown}
Duration: 10 seconds for the long-lane hybrid workflow.
⚠️ Use Shot 3 last frame as I2V input only if it remains a clean full-body handoff frame. Otherwise reuse the master still or a manually selected clean continuity frame.`,
      pasteReady: longShot4PasteReady,
      settings: ["Duration 10s", "Slow pull-back", "Use clean Shot 3 handoff frame only"],
      metadata: {
        engine: "runway",
        shotKey: "shot4",
        title: `Runway Shot 4 — Aftermath / Resolve (Long Lane 10s) [${runwayModel}]`,
        durationSeconds: 10,
        variant: "hybrid",
        workflowRole: "aftermath-resolve",
      },
    }),
  };
}

export function buildHybridLongFourShotWorkflow(
  predator: string,
  prey: string,
  env: string,
  arc: Arc,
  weather: Weather,
  runwayModel: RunwayModel,
  klingModel: KlingModel,
  emotionalTone: EmotionalTone,
  animalVibe: AnimalVibe,
  sceneDesc?: string,
  quality?: QualityOptions,
  cameraAnglePreset: CameraAnglePreset = "Auto"
): { shot1: string; shot2: string; shot3: string; shot4: string } {
  return promptPackToLegacyText(
    buildHybridLongPromptPack(
      predator,
      prey,
      env,
      arc,
      weather,
      runwayModel,
      klingModel,
      emotionalTone,
      animalVibe,
      sceneDesc,
      quality,
      cameraAnglePreset
    )
  );
}

export function buildFourShotWorkflowPromptPack(opts: {
  mode?: FourShotWorkflowMode;
  durationLane?: DurationLane;
  predator: string;
  prey: string;
  env: string;
  arc: Arc;
  weather: Weather;
  runwayModel: RunwayModel;
  klingModel: KlingModel;
  emotionalTone: EmotionalTone;
  animalVibe: AnimalVibe;
  sceneDesc?: string;
  quality?: QualityOptions;
  cameraAnglePreset?: CameraAnglePreset;
}): WorkflowPromptPack {
  const {
    mode = "hybrid",
    durationLane = "short",
    predator,
    prey,
    env,
    arc,
    weather,
    runwayModel,
    klingModel,
    emotionalTone,
    animalVibe,
    sceneDesc,
    quality,
    cameraAnglePreset = "Auto",
  } = opts;

  switch (mode) {
    case "hybrid":
      return durationLane === "long"
        ? buildHybridLongPromptPack(
            predator,
            prey,
            env,
            arc,
            weather,
            runwayModel,
            klingModel,
            emotionalTone,
            animalVibe,
            sceneDesc,
            quality,
            cameraAnglePreset
          )
        : buildHybridPromptPack(
            predator,
            prey,
            env,
            arc,
            weather,
            runwayModel,
            klingModel,
            emotionalTone,
            animalVibe,
            sceneDesc,
            quality,
            cameraAnglePreset
          );
    case "runway-only":
      return buildRunwayPromptPack(
        predator,
        prey,
        env,
        arc,
        weather,
        runwayModel,
        emotionalTone,
        animalVibe,
        sceneDesc,
        quality,
        cameraAnglePreset
      );
    case "kling-only":
      return buildKlingPromptPack(
        predator,
        prey,
        env,
        arc,
        weather,
        klingModel,
        emotionalTone,
        animalVibe,
        sceneDesc,
        quality,
        cameraAnglePreset
      );
    case "seedance": {
      const pack = buildSeedancePromptPack(
        predator,
        prey,
        env,
        arc,
        weather,
        emotionalTone,
        animalVibe,
        sceneDesc,
        quality
      );
      return {
        shot1: pack.shot1,
        shot2: pack.shot2,
        shot3: pack.shot3,
        shot4: pack.shot4,
      };
    }
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}

export function buildFourShotWorkflow(opts: {
  mode?: FourShotWorkflowMode;
  durationLane?: DurationLane;
  predator: string;
  prey: string;
  env: string;
  arc: Arc;
  weather: Weather;
  runwayModel: RunwayModel;
  klingModel: KlingModel;
  emotionalTone: EmotionalTone;
  animalVibe: AnimalVibe;
  sceneDesc?: string;
  quality?: QualityOptions;
  cameraAnglePreset?: CameraAnglePreset;
}): { shot1: string; shot2: string; shot3: string; shot4: string } {
  return promptPackToLegacyText(buildFourShotWorkflowPromptPack(opts));
}
