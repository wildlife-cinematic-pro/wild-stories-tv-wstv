import type {
  Arc,
  Weather,
  EmotionalTone,
  AnimalVibe,
  QualityOptions,
  StructuredPrompt,
} from "@/types";

import {
  getHabitatMode,
  oneActionArcBeat,
  buildMicroMotionLine,
  buildSeedanceBackgroundMotion,
  stripBackgroundMovementLead,
} from "@/lib/prompt-builders/habitat";
import {
  buildQualityLead,
  formatActionSubject,
  buildStructuredPrompt,
  buildShotWorldContinuityLock,
  promptPackToLegacyText,
  type FourShotPromptPack,
} from "@/lib/prompt-builders/shared";
import {
  finalizePrompt,
  clipPromptContext,
  sanitizeImageEnv,
  sanitizeWeatherPhrase,
  sanitizeVideoBeatText,
} from "@/lib/prompt-builders/sanitizers";
import { weatherVariants } from "@/lib/predator-data";

export type SeedancePromptPack = FourShotPromptPack<StructuredPrompt> & {
  multiShotPrompt: StructuredPrompt;
  workflowGuide: string;
};

export function buildSeedancePromptPack(
  predator: string,
  prey: string,
  env: string,
  arc: Arc,
  weather: Weather,
  emotionalTone: EmotionalTone,
  animalVibe: AnimalVibe,
  sceneDesc?: string,
  quality?: QualityOptions
): SeedancePromptPack {
  void emotionalTone;
  void animalVibe;

  const qLead = buildQualityLead(quality, "image");
  const cleanEnv = sanitizeImageEnv(env);
  const cleanWeather = sanitizeWeatherPhrase(weatherVariants[weather]);
  const micro = buildMicroMotionLine(weather, env);
  const habitatMode = getHabitatMode(predator, prey, env);
  const gateOn = !!quality?.singleActionRule;
  const beat1 = oneActionArcBeat(arc, "establish", gateOn, habitatMode);
  const beat2 = oneActionArcBeat(arc, "action", gateOn, habitatMode);
  const beat3 = oneActionArcBeat(arc, "aftermath", gateOn, habitatMode);
  const context = sceneDesc?.trim() ? `\nScene continuity: ${clipPromptContext(sceneDesc.trim())}` : "";
  const refRule = quality?.referenceLock
    ? `Reference lock active — keep the same ${predator} identity and the same ${prey} identity from the input frame.`
    : "Keep subject continuity aligned with the input frame.";
  const motionRule = quality?.motionOnlyI2V
    ? "Seedance 2.0 I2V rule — prompt moving parts only: subject movement, background movement, camera movement. Minimize static look description."
    : "Keep static description light and prioritize motion wording.";
  const seedanceRule =
    "Conservative WSTV Seedance rule — keep the prompt simple, movement-led, reference-aware, and easy to paste cleanly.";
  const cameraRule =
    'WSTV continuity rule — keep the camera instruction explicit, and connect multi-shot transitions with "Cut to" when you need shot changes.';
  const shotWorldLock = buildShotWorldContinuityLock("seedance");

  const s1Predator = sanitizeVideoBeatText(beat1.predatorBeat);
  const s1Prey = sanitizeVideoBeatText(beat1.preyBeat);
  const s2Predator = sanitizeVideoBeatText(beat2.predatorBeat);
  const s2Prey = sanitizeVideoBeatText(beat2.preyBeat);
  const s3Predator = sanitizeVideoBeatText(beat3.predatorBeat);
  const s3Prey = sanitizeVideoBeatText(beat3.preyBeat);

  const pressurePredator =
    habitatMode === "aquatic"
      ? `${predator} glides forward with stronger visible pressure through the water while staying controlled`
      : habitatMode === "shoreline"
        ? `${predator} leans farther forward from the bank with stronger ambush pressure`
        : `${predator} leans forward with stronger visible pressure while staying controlled`;

  const pressurePrey =
    habitatMode === "aquatic"
      ? `${prey} tightens posture and makes one defensive adjustment in the current`
      : habitatMode === "shoreline"
        ? `${prey} lowers into one readable defensive footing adjustment near the waterline`
        : `${prey} lowers into one readable defensive adjustment without breaking spacing`;

  const shot1Body = finalizePrompt(
    sanitizeVideoBeatText(
      `${formatActionSubject(predator, s1Predator)}. ${prey} ${s1Prey}. ${buildSeedanceBackgroundMotion(habitatMode, micro, "establish")} Camera holds wide with a slow push-in. Both animals stay fully readable from frame one with one dominant tension line and clean spacing. ${cleanWeather}.`
    )
  );

  const shot2Body = finalizePrompt(
    sanitizeVideoBeatText(
      `${pressurePredator}. ${pressurePrey}. ${buildSeedanceBackgroundMotion(habitatMode, micro, "pressure")} ${shotWorldLock} Camera tracks wide with a gentle forward drift. Keep both bodies separated and the pressure line easy to read. ${cleanWeather}.`
    )
  );

  const shot3Body = finalizePrompt(
    sanitizeVideoBeatText(
      `${formatActionSubject(predator, s2Predator)}. ${prey} ${s2Prey}. ${buildSeedanceBackgroundMotion(habitatMode, micro, "action")} ${shotWorldLock} Camera follows wide with restrained handheld energy. Keep one dominant readable action beat, clear body mechanics, and stable predator-to-prey spacing. ${cleanWeather}.`
    )
  );

  const shot4Body = finalizePrompt(
    sanitizeVideoBeatText(
      `${formatActionSubject(predator, s3Predator)}. ${prey} ${s3Prey}. ${buildSeedanceBackgroundMotion(habitatMode, micro, "aftermath")} ${shotWorldLock} Camera holds wide with a subtle pull-back as motion settles. Keep the same habitat plate and readable spacing to the final frame. ${cleanWeather}.`
    )
  );

  const directShot2Body = finalizePrompt(
    sanitizeVideoBeatText(
      `${pressurePredator}. ${pressurePrey}. One readable peak movement follows: ${formatActionSubject(predator, s2Predator)} while ${prey} ${s2Prey}. ${buildSeedanceBackgroundMotion(habitatMode, micro, "action")} ${shotWorldLock} Camera stays wide with restrained energy. Keep one clean action lane, stable body mechanics, grounded contact, and clear spacing. ${cleanWeather}.`
    )
  );

  const directSafetyLine = "Safety: no blood, no gore, no visible injury, no extra animals, no subtitles, no text, no watermark.";

  const multiShotBody = finalizePrompt(
    `Shot 1, 0-5s opening tension / first-frame hook: ${shot1Body}\nCut to Shot 2, 5-10s pressure build / peak movement: ${directShot2Body}\nCut to Shot 3, 10-15s final hold / resolved or unresolved tension: ${shot4Body}\n${directSafetyLine}`
  );

  const workflowGuide = finalizePrompt(`SEEDANCE 2.0 NODE WORKFLOW
1. Put the main instruction in the Prompt field.
2. Put the clean continuity image in First Frame.
3. Use Ref Image slots for extra look, composition, prop, or subject references when needed.
4. Use Ref Video slots when you want to borrow motion rhythm, camera rhythm, or clip continuity cues.
5. WSTV fallback prompt structure: subject movement + background movement + camera movement.
6. Minimize unchanged appearance and environment description; follow the actual first frame and reference inputs.
7. Keep wording simple and direct.
8. Use clear degree adverbs when motion intensity matters: slowly, sharply, quickly, gently.
9. If camera movement is described, make sure the shot mode allows motion.
10. Default WSTV workflow: generate 4 separate video shots.
11. Set each individual shot to 5 seconds in the Seedance 2.0 node settings or prompt parameters.
12. For a combined continuity prompt, connect shots with "Cut to" and describe the new shot after each transition.
13. Keep motion readable and continuity-safe in ${cleanEnv}, ${cleanWeather}.
14. Reuse the Shot 1 world plate across later shots so background layout, light direction, and weather density stay stable.`);

  return {
    shot1: buildStructuredPrompt({
      fullText: `SEEDANCE SHOT 1 — OPENING TENSION
${seedanceRule}
${cameraRule}
${qLead}
${refRule}
${motionRule}${context}
Suggested duration: 5 seconds.

═══ PASTE-READY SEEDANCE PROMPT (copy this block into Seedance) ═══
${shot1Body}

─── BREAKDOWN (reference only) ───
Subject movement: ${formatActionSubject(predator, s1Predator)}. ${prey} ${s1Prey}.
Background movement: ${stripBackgroundMovementLead(buildSeedanceBackgroundMotion(habitatMode, micro, "establish"))}
Camera movement: Wide opening hold with a slow push-in.
Seedance 2.0 settings: Duration 5s | Prompt + First Frame. Add Ref Image / Ref Video only when useful. Keep camera movement explicit when the shot is not fixed.`,
      pasteReady: shot1Body,
      settings: [
        "Duration 5s",
        "Prompt + First Frame",
        "Add Ref Image / Ref Video only when useful",
      ],
      metadata: {
        engine: "seedance",
        shotKey: "shot1",
        title: "Seedance Shot 1 — Opening Tension",
        durationSeconds: 5,
        variant: "single-shot",
      },
    }),
    shot2: buildStructuredPrompt({
      fullText: `SEEDANCE SHOT 2 — PRESSURE BUILD
${seedanceRule}
${cameraRule}
${qLead}
${refRule}
${motionRule}${context}
Suggested duration: 5 seconds.

═══ PASTE-READY SEEDANCE PROMPT (copy this block into Seedance) ═══
${shot2Body}

─── BREAKDOWN (reference only) ───
Subject movement: ${pressurePredator}. ${pressurePrey}.
Background movement: ${stripBackgroundMovementLead(buildSeedanceBackgroundMotion(habitatMode, micro, "pressure"))}
Camera movement: Wide pressure-build tracking shot with a gentle forward drift.
Seedance 2.0 settings: Duration 5s | Prompt + First Frame. Add Ref Image / Ref Video only when useful. Keep camera movement explicit when the shot is not fixed.`,
      pasteReady: shot2Body,
      settings: [
        "Duration 5s",
        "Prompt + First Frame",
        "Add Ref Image / Ref Video only when useful",
      ],
      metadata: {
        engine: "seedance",
        shotKey: "shot2",
        title: "Seedance Shot 2 — Pressure Build",
        durationSeconds: 5,
        variant: "single-shot",
      },
    }),
    shot3: buildStructuredPrompt({
      fullText: `SEEDANCE SHOT 3 — PEAK ACTION
${seedanceRule}
${cameraRule}
${qLead}
${refRule}
${motionRule}${context}
Suggested duration: 5 seconds.

═══ PASTE-READY SEEDANCE PROMPT (copy this block into Seedance) ═══
${shot3Body}

─── BREAKDOWN (reference only) ───
Subject movement: ${formatActionSubject(predator, s2Predator)}. ${prey} ${s2Prey}.
Background movement: ${stripBackgroundMovementLead(buildSeedanceBackgroundMotion(habitatMode, micro, "action"))}
Camera movement: Wide follow shot with restrained handheld energy.
Seedance 2.0 settings: Duration 5s | Prompt + First Frame. Add Ref Image / Ref Video only when useful. Keep camera movement explicit when the shot is not fixed.`,
      pasteReady: shot3Body,
      settings: [
        "Duration 5s",
        "Prompt + First Frame",
        "Add Ref Image / Ref Video only when useful",
      ],
      metadata: {
        engine: "seedance",
        shotKey: "shot3",
        title: "Seedance Shot 3 — Peak Action",
        durationSeconds: 5,
        variant: "single-shot",
      },
    }),
    shot4: buildStructuredPrompt({
      fullText: `SEEDANCE SHOT 4 — RESOLVED TENSION
${seedanceRule}
${cameraRule}
${qLead}
${refRule}
${motionRule}${context}
Suggested duration: 5 seconds.

═══ PASTE-READY SEEDANCE PROMPT (copy this block into Seedance) ═══
${shot4Body}

─── BREAKDOWN (reference only) ───
Subject movement: ${formatActionSubject(predator, s3Predator)}. ${prey} ${s3Prey}.
Background movement: ${stripBackgroundMovementLead(buildSeedanceBackgroundMotion(habitatMode, micro, "aftermath"))}
Camera movement: Locked wide aftermath hold with a subtle pull-back.
Seedance 2.0 settings: Duration 5s | Prompt + First Frame. Fixed or non-fixed camera can work here, but keep the motion instruction explicit and simple.`,
      pasteReady: shot4Body,
      settings: [
        "Duration 5s",
        "Prompt + First Frame",
        "Fixed or non-fixed camera can work here",
      ],
      metadata: {
        engine: "seedance",
        shotKey: "shot4",
        title: "Seedance Shot 4 — Resolved Tension",
        durationSeconds: 5,
        variant: "single-shot",
      },
    }),
    multiShotPrompt: buildStructuredPrompt({
      fullText: `SEEDANCE DIRECT 15S MULTISHOT PROMPT
${seedanceRule}
${cameraRule}
${qLead}
${refRule}
${motionRule}${context}

═══ PASTE-READY SEEDANCE MULTI-SHOT PROMPT (copy this block into Seedance) ═══
${multiShotBody}

─── BREAKDOWN (reference only) ───
Shot 1: 0-5s opening tension / first-frame hook
Shot 2: 5-10s pressure build / peak movement
Shot 3: 10-15s final hold / resolved or unresolved tension
Use "Cut to" exactly as written so Seedance preserves the shot-to-shot relationship more clearly. This Direct prompt is one 15-second, 3-shot multishot; use the separate Seedance shot cards for the normal 4-shot / 20s workflow.`,
      pasteReady: multiShotBody,
      metadata: {
        engine: "seedance",
        title: "Seedance Direct 15s 3-shot multishot prompt",
        variant: "multi-shot",
      },
    }),
    workflowGuide,
  };
}

export function buildSeedanceShots(
  predator: string,
  prey: string,
  env: string,
  arc: Arc,
  weather: Weather,
  emotionalTone: EmotionalTone,
  animalVibe: AnimalVibe,
  sceneDesc?: string,
  quality?: QualityOptions
): {
  shot1: string;
  shot2: string;
  shot3: string;
  shot4: string;
  multiShotPrompt: string;
  workflowGuide: string;
} {
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
  const legacy = promptPackToLegacyText(pack);

  return {
    ...legacy,
    multiShotPrompt: pack.multiShotPrompt.fullText,
    workflowGuide: pack.workflowGuide,
  };
}
