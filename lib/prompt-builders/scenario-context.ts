import type { Arc, CameraAnglePreset, QualityOptions, Weather } from "@/types";

import {
  buildKlingCameraPresetLine,
  buildRunwayCameraPresetLine,
} from "@/lib/camera-angle-presets";
import {
  buildCinematicDirectorPlan,
  type CinematicDirectorPlan,
} from "@/lib/cinematic-director-system";
import {
  buildMicroMotionLine,
  getHabitatMode,
  getRutMirrorMatchCue,
  isRutMirrorMatchScenario,
  isWaterForwardPreyScenario,
  oneActionArcBeat,
} from "@/lib/prompt-builders/habitat";
import { buildShotWorldContinuityLock } from "@/lib/prompt-builders/shared";
import { sanitizeVideoBeatText } from "@/lib/prompt-builders/sanitizers";

export type PromptScenarioKind =
  | "aquatic"
  | "shoreline-water-forward"
  | "shoreline"
  | "rut-mirror"
  | "land";

export type PromptScenarioContext = {
  scenarioKind: PromptScenarioKind;
  habitatMode: ReturnType<typeof getHabitatMode>;
  isAquatic: boolean;
  isShoreline: boolean;
  isWaterForwardStrike: boolean;
  isRutMirrorMatch: boolean;
  gateOn: boolean;
  micro: string;
  rutCue: ReturnType<typeof getRutMirrorMatchCue>;
  cameraPresetLine: string;
  cameraPromptTail: string;
  cameraBreakdownLine: string;
  directorPlan: CinematicDirectorPlan;
  shot1CameraPromptTail: string;
  shot2CameraPromptTail: string;
  shot3CameraPromptTail: string;
  shot4CameraPromptTail: string;
  shot1CameraBreakdownLine: string;
  shot2CameraBreakdownLine: string;
  shot3CameraBreakdownLine: string;
  shot4CameraBreakdownLine: string;
  worldPlateContinuity: string;
  beat1: ReturnType<typeof oneActionArcBeat>;
  beat3: ReturnType<typeof oneActionArcBeat>;
  beat4: ReturnType<typeof oneActionArcBeat>;
  pressurePredator: string;
  pressurePrey: string;
};

export function buildPromptScenarioContext({
  predator,
  prey,
  env,
  sceneDesc,
  arc,
  weather,
  quality,
  cameraAnglePreset = "Auto",
  engine,
}: {
  predator: string;
  prey: string;
  env: string;
  sceneDesc?: string;
  arc: Arc;
  weather: Weather;
  quality?: QualityOptions;
  cameraAnglePreset?: CameraAnglePreset;
  engine: "runway" | "kling";
}): PromptScenarioContext {
  const habitatMode = getHabitatMode(predator, prey, env);
  const isAquatic = habitatMode === "aquatic";
  const isShoreline = habitatMode === "shoreline";
  const isWaterForwardStrike = isWaterForwardPreyScenario(predator, prey, env);
  const isRutMirrorMatch = isRutMirrorMatchScenario(predator, prey, arc, env);
  const gateOn = !!quality?.singleActionRule;
  const micro = buildMicroMotionLine(weather, env);
  const rutCue = getRutMirrorMatchCue(predator);
  const cameraPresetLine =
    engine === "runway"
      ? buildRunwayCameraPresetLine(cameraAnglePreset, habitatMode, env)
      : buildKlingCameraPresetLine(cameraAnglePreset, habitatMode, env);
  const cameraPromptTail = cameraPresetLine ? ` ${cameraPresetLine}` : "";
  const cameraBreakdownLine = cameraPresetLine
    ? `\nCamera preset: ${cameraPresetLine}`
    : "";
  const directorPlan = buildCinematicDirectorPlan({
    arc,
    habitatMode,
    cameraAnglePreset,
    sceneDesc: sceneDesc?.trim() || env,
  });
  const shot1CameraPresetLine =
    engine === "runway"
      ? buildRunwayCameraPresetLine(directorPlan.shot1.preset, habitatMode, env)
      : buildKlingCameraPresetLine(directorPlan.shot1.preset, habitatMode, env);
  const shot2CameraPresetLine =
    engine === "runway"
      ? buildRunwayCameraPresetLine(directorPlan.shot2.preset, habitatMode, env)
      : buildKlingCameraPresetLine(directorPlan.shot2.preset, habitatMode, env);
  const shot3CameraPresetLine =
    engine === "runway"
      ? buildRunwayCameraPresetLine(directorPlan.shot3.preset, habitatMode, env)
      : buildKlingCameraPresetLine(directorPlan.shot3.preset, habitatMode, env);
  const shot4CameraPresetLine =
    engine === "runway"
      ? buildRunwayCameraPresetLine(directorPlan.shot4.preset, habitatMode, env)
      : buildKlingCameraPresetLine(directorPlan.shot4.preset, habitatMode, env);
  const worldPlateContinuity = buildShotWorldContinuityLock(engine);
  const beat1 = sanitizeBeat(oneActionArcBeat(arc, "establish", gateOn, habitatMode));
  const beat3 = sanitizeBeat(oneActionArcBeat(arc, "action", gateOn, habitatMode));
  const beat4 = sanitizeBeat(oneActionArcBeat(arc, "aftermath", gateOn, habitatMode));
  const scenarioKind = isAquatic
    ? "aquatic"
    : isShoreline
      ? isWaterForwardStrike
        ? "shoreline-water-forward"
        : "shoreline"
      : isRutMirrorMatch
        ? "rut-mirror"
        : "land";

  const pressureBeats = getPressureBeats(scenarioKind, rutCue);

  return {
    scenarioKind,
    habitatMode,
    isAquatic,
    isShoreline,
    isWaterForwardStrike,
    isRutMirrorMatch,
    gateOn,
    micro,
    rutCue,
    cameraPresetLine,
    cameraPromptTail,
    cameraBreakdownLine,
    directorPlan,
    shot1CameraPromptTail: shot1CameraPresetLine ? ` ${shot1CameraPresetLine}` : "",
    shot2CameraPromptTail: shot2CameraPresetLine ? ` ${shot2CameraPresetLine}` : "",
    shot3CameraPromptTail: shot3CameraPresetLine ? ` ${shot3CameraPresetLine}` : "",
    shot4CameraPromptTail: shot4CameraPresetLine ? ` ${shot4CameraPresetLine}` : "",
    shot1CameraBreakdownLine: shot1CameraPresetLine ? `\nCamera preset: ${shot1CameraPresetLine}` : "",
    shot2CameraBreakdownLine: shot2CameraPresetLine ? `\nCamera preset: ${shot2CameraPresetLine}` : "",
    shot3CameraBreakdownLine: shot3CameraPresetLine ? `\nCamera preset: ${shot3CameraPresetLine}` : "",
    shot4CameraBreakdownLine: shot4CameraPresetLine ? `\nCamera preset: ${shot4CameraPresetLine}` : "",
    worldPlateContinuity,
    beat1,
    beat3,
    beat4,
    pressurePredator: pressureBeats.predator,
    pressurePrey: pressureBeats.prey,
  };
}

function sanitizeBeat(beat: ReturnType<typeof oneActionArcBeat>) {
  return {
    ...beat,
    predatorBeat: sanitizeVideoBeatText(beat.predatorBeat),
    preyBeat: sanitizeVideoBeatText(beat.preyBeat),
  };
}

function getPressureBeats(
  scenarioKind: PromptScenarioKind,
  rutCue: ReturnType<typeof getRutMirrorMatchCue>
): { predator: string; prey: string } {
  switch (scenarioKind) {
    case "aquatic":
      return {
        predator: "leans into stronger water pressure",
        prey: "tightens posture and makes one defensive adjustment in the current",
      };
    case "shoreline-water-forward":
      return {
        predator: "leans farther forward from the bank as the shallow strike window tightens",
        prey: "shows one tense surface-break adjustment tight to the bank-edge current",
      };
    case "shoreline":
      return {
        predator: "leans farther forward from the shoreline with stronger visible ambush pressure",
        prey: "lowers into one defensive footing adjustment near the bank",
      };
    case "rut-mirror":
      return {
        predator: `edges forward with heavier shoulder-line pressure while keeping ${rutCue.room}`,
        prey: "braces into one grounded footing reset without giving away the claim line",
      };
    default:
      return {
        predator: "leans farther forward with stronger visible pressure",
        prey: "lowers into one defensive adjustment",
      };
  }
}
