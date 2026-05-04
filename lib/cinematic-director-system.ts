import type { Arc, CameraAnglePreset } from "@/types";

/**
 * CINEMATIC DIRECTOR SYSTEM
 *
 * Validated filming principles:
 * - Camera angle affects audience emotion and power perception.
 * - Low angle reads as dominance; high angle reads as vulnerability.
 * - POV-style framing increases immersion, but should be used sparingly.
 * - Overhead and wide coverage restore geography and spacing clarity.
 * - Professional scenes are covered as sequences, not as one isolated shot.
 *
 * This layer does NOT replace the existing camera presets, lighting rules, or
 * realism constraints. It decides when to apply the existing presets across the
 * fixed four-shot wildlife sequence.
 *
 * ANGLE DECISION RULES
 * - Front full-body functions as the neutral eye-level baseline.
 * - Low-angle power is reserved for dominance, pressure, and peak beats.
 * - Side profile is used when motion clarity and attack direction matter most.
 * - Over-the-shoulder and ground-level tension are the closest safe immersive
 *   equivalents to POV inside the existing preset library, and are limited to
 *   tension or peak moments.
 * - Overhead is reserved for spatial clarity, geography, and release, not for
 *   the emotional peak.
 * - Vulnerability reads are expressed through the existing high-wide / overhead
 *   release language rather than by inventing a new public-facing preset.
 *
 * SEQUENCE STRUCTURE (MANDATORY)
 * - Shot 1 = Master: identity, full-body, stable.
 * - Shot 2 = Tension: readable spacing, build pressure.
 * - Shot 3 = Peak: strongest emotional moment.
 * - Shot 4 = Resolution: aftermath or release.
 *
 * ANGLE PROGRESSION
 * - Start neutral and readable.
 * - Build pressure with side / tracking-style clarity.
 * - Peak with the strongest safe angle.
 * - Resolve with overhead or wide clarity.
 *
 * ANGLE VARIETY RULE
 * - Avoid repeating the same angle type more than once across the four shots.
 * - If a similar perspective would repeat, shift it toward a stronger neighboring
 *   perspective inside the existing preset library:
 *   - side -> over-the-shoulder or ground-level tension
 *   - low -> ground-level tension
 *   - front -> overhead release clarity
 * - Every shot should feel visually distinct even though the public preset set
 *   remains unchanged.
 *
 * DUAL SUBJECT RULE
 * - Both animals must remain visible OR the threat direction must stay clear.
 * - Reject any angle that breaks spacing clarity, silhouette separation, or the
 *   readable attack line.
 *
 * REALISM PRIORITY
 * - Anatomy correctness is mandatory.
 * - Grounded body contact is required.
 * - No floating limbs or merged bodies.
 * - Realism overrides dramatic angle choice.
 *
 * MICRO-MOVEMENT RULE
 * - Every shot should preserve subtle natural motion: breath, fur lift, reed sway,
 *   water drift, dust shift, snow flicker, or foliage movement.
 *
 * ENVIRONMENT INTERACTION RULE
 * - Subject motion must react with terrain: mud scatter, grass bend, splash,
 *   hoof compression, branch shake, snow kick, or dust response.
 *
 * ENDING IMPACT RULE
 * - Shot 4 must land as a resolved release or an intentionally unresolved hold.
 * - Avoid weak endings that simply stop without emotional consequence.
 *
 * FAST OUTPUT MODE
 * - Uses this director logic internally.
 * - Outputs only the final shot prompts.
 * - No explanatory labels or metadata are required in the final paste-ready
 *   prompt text.
 */

export type DirectorIntentTag =
  | "dominance"
  | "vulnerability"
  | "immersion"
  | "observation";

export type DirectorShotRole = "master" | "tension" | "peak" | "resolution";

export type DirectorShotDecision = {
  role: DirectorShotRole;
  preset: CameraAnglePreset;
  intent: DirectorIntentTag;
  emotionalMeaning: string;
  useCaseCondition: string;
};

export type CinematicDirectorPlan = {
  shot1: DirectorShotDecision;
  shot2: DirectorShotDecision;
  shot3: DirectorShotDecision;
  shot4: DirectorShotDecision;
  viralTensionShot: "shot3";
  viralTensionCue: string;
  shot2TensionCue: string;
  shot3TensionCue: string;
  microMovementCue: string;
  environmentInteractionCue: string;
  shot4EndingCue: string;
};

function isPowerArc(arc: Arc) {
  return (
    arc === "Defender stands ground" ||
    arc === "Giant vs giant clash" ||
    arc === "Predator vs predator fight" ||
    arc === "Ambush attack"
  );
}

function isPressureArc(arc: Arc) {
  return (
    arc === "Chase and takedown" ||
    arc === "Escape from danger" ||
    arc === "Pack hunting strategy"
  );
}

function isWaterScene(habitatMode: string) {
  return habitatMode === "aquatic" || habitatMode === "shoreline";
}

function uniquePreset(
  preferred: CameraAnglePreset,
  used: Set<CameraAnglePreset>,
  fallbacks: CameraAnglePreset[]
) {
  if (!used.has(preferred)) {
    used.add(preferred);
    return preferred;
  }

  for (const fallback of fallbacks) {
    if (!used.has(fallback)) {
      used.add(fallback);
      return fallback;
    }
  }

  used.add(preferred);
  return preferred;
}

function preferredManualShot(preset: CameraAnglePreset) {
  switch (preset) {
    case "Front full-body":
    case "Waterline":
      return "shot1" as const;
    case "Side profile":
      return "shot2" as const;
    case "Low-angle power":
    case "Ground-level tension":
    case "Over-the-shoulder":
      return "shot3" as const;
    case "Overhead":
      return "shot4" as const;
    default:
      return null;
  }
}

function isPeakWeakPreset(preset: CameraAnglePreset) {
  return (
    preset === "Front full-body" ||
    preset === "Waterline" ||
    preset === "Overhead" ||
    preset === "Auto"
  );
}

function buildPeakPreset({
  preferredManualPreset,
  powerArc,
  used,
}: {
  preferredManualPreset: CameraAnglePreset | null;
  powerArc: boolean;
  used: Set<CameraAnglePreset>;
}) {
  const upgradedPeak = powerArc
    ? "Low-angle power"
    : "Ground-level tension";

  const preferred =
    preferredManualPreset === "Side profile"
      ? "Ground-level tension"
      : preferredManualPreset && !isPeakWeakPreset(preferredManualPreset)
        ? preferredManualPreset
        : upgradedPeak;

  return uniquePreset(preferred, used, [
    "Low-angle power",
    "Ground-level tension",
    "Over-the-shoulder",
    "Side profile",
  ]);
}

export function buildCinematicDirectorPlan({
  arc,
  habitatMode,
  cameraAnglePreset = "Auto",
  sceneDesc: _sceneDesc = "",
}: {
  arc: Arc;
  habitatMode: string;
  cameraAnglePreset?: CameraAnglePreset;
  sceneDesc?: string;
}): CinematicDirectorPlan {
  void _sceneDesc;
  const used = new Set<CameraAnglePreset>();
  const waterScene = isWaterScene(habitatMode);
  const pressureArc = isPressureArc(arc);
  const powerArc = isPowerArc(arc);
  const preferredManualPreset = cameraAnglePreset !== "Auto" ? cameraAnglePreset : null;
  const manualTarget = preferredManualShot(cameraAnglePreset);

  const shot1Default = waterScene ? "Waterline" : "Front full-body";
  const shot1Preset = uniquePreset(
    manualTarget === "shot1" ? cameraAnglePreset : shot1Default,
    used,
    ["Front full-body", "Waterline", "Side profile"]
  );

  const shot2Default = pressureArc || waterScene ? "Side profile" : "Front full-body";
  const shot2Preferred =
    manualTarget === "shot2"
      ? cameraAnglePreset
      : shot2Default;
  const shot2Preset = uniquePreset(shot2Preferred, used, [
    "Side profile",
    "Ground-level tension",
    "Front full-body",
    "Over-the-shoulder",
  ]);

  const shot3Preset = buildPeakPreset({
    preferredManualPreset: manualTarget === "shot3" ? preferredManualPreset : null,
    powerArc,
    used,
  });

  const shot4Preferred =
    manualTarget === "shot4"
      ? "Overhead"
      : "Overhead";
  const shot4Preset = uniquePreset(shot4Preferred, used, [
    "Overhead",
    "Front full-body",
    "Side profile",
  ]);

  return {
    shot1: {
      role: "master",
      preset: shot1Preset,
      intent: "observation",
      emotionalMeaning: "neutral identity and world clarity",
      useCaseCondition:
        "Use for the opening master with full-body identity, stable geography, clear subject separation, and no extreme immersion.",
    },
    shot2: {
      role: "tension",
      preset: shot2Preset,
      intent: shot2Preset === "Over-the-shoulder" ? "immersion" : "observation",
      emotionalMeaning:
        shot2Preset === "Over-the-shoulder"
          ? "controlled subjective pressure before contact"
          : "readable spacing and motion pressure under control",
      useCaseCondition:
        "Use to build pressure with readable spacing, eye contact, and a visible threat line while keeping both animals visible or clearly directional.",
    },
    shot3: {
      role: "peak",
      preset: shot3Preset,
      intent:
        shot3Preset === "Low-angle power"
          ? "dominance"
          : shot3Preset === "Ground-level tension" || shot3Preset === "Over-the-shoulder"
            ? "immersion"
            : "observation",
      emotionalMeaning:
        shot3Preset === "Low-angle power"
          ? "dominance, pressure, and power at the emotional peak"
          : shot3Preset === "Ground-level tension"
            ? "immersive danger at subject height"
            : shot3Preset === "Over-the-shoulder"
              ? "immersive threat alignment at near-contact"
              : "readable peak force with clear attack direction",
      useCaseCondition:
        "Use for the strongest emotional moment. Automatically upgrade weak or overly repetitive peak angles to stronger ones, and never allow overhead to occupy the peak beat.",
    },
    shot4: {
      role: "resolution",
      preset: shot4Preset,
      intent: shot4Preset === "Overhead" ? "observation" : "vulnerability",
      emotionalMeaning:
        shot4Preset === "Overhead"
          ? "release through restored geography and clean spacing"
          : "aftermath and lowered pressure",
      useCaseCondition:
        "Use for aftermath, escape, or release. Overhead is allowed here to restore clarity and geography.",
    },
    viralTensionShot: "shot3",
    viralTensionCue:
      "Shot 2 must hold visible eye contact or a slow advance. Shot 3 must land the near-attack pause or delayed-impact beat before release.",
    shot2TensionCue:
      "Hold visible eye contact or one slow advance before commitment.",
    shot3TensionCue:
      "Delay impact or near-attack one beat before release.",
    microMovementCue:
      "Keep subtle natural motion alive in every shot so the scene never feels frozen.",
    environmentInteractionCue:
      "Every body move must trigger believable terrain response and grounded contact.",
    shot4EndingCue:
      "Shot 4 must resolve with a clear release or hold as an intentionally unresolved final beat.",
  };
}
