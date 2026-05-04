import { isContentLaneCompatible } from "@/lib/content-lanes";
import type {
  AnimalVibe,
  Arc,
  ContentLane,
  DepthMode,
  EmotionalTone,
  HabitatPreset,
  PredatorInfo,
  Weather,
} from "@/types";

export type Step1RecommendationHint = {
  label: "Safest" | "Strongest" | "Fastest";
  text: string;
};

export type Step1FacebookRecommendation = {
  title: string;
  summary: string;
  hints: Step1RecommendationHint[];
};

type Step1RecommendationInput = {
  predator: string;
  prey: string;
  contentLane: ContentLane;
  arc: Arc;
  habitat: HabitatPreset;
  weather: Weather;
  depthMode: DepthMode;
  driftRisk: PredatorInfo["driftRisk"];
};

const LANE_MICRO_GUIDANCE: Record<ContentLane, string> = {
  Auto:
    "Safest default: keeps the existing animal-first arc engine in charge, then applies only compatible USA targeting hints.",
  "Pack Hunt":
    "Best when the clip needs group pursuit, closing angles, and a clear escape path before contact.",
  Defender:
    "Best when the moment is about a stand, warning step, calf protection, or refusal to give ground.",
  "Fishing Strike":
    "Best for waterline setups, shallow-bank timing, and quick strike-window storytelling.",
  "Rut Battle":
    "Best for antler posture, shoulder-line escalation, rut-season footing, and heavy standoff tension.",
  Escape:
    "Best for near-miss survival, one breakaway move, and a fast but clean payoff beat.",
};

const LANE_STRONGEST_HINT: Record<ContentLane, string> = {
  Auto:
    "Auto is strongest when you want the app to protect realism before style.",
  "Pack Hunt":
    "Strongest Facebook test: grouped predators, open ground, and an obvious narrowing chase shape.",
  Defender:
    "Strongest Facebook test: a planted animal, visible warning posture, and a challenger that keeps pressing.",
  "Fishing Strike":
    "Strongest Facebook test: shoreline or shallow water with the strike window visible before impact.",
  "Rut Battle":
    "Strongest Facebook test: two heavy animals, antler room, set footing, and a clear dominance claim.",
  Escape:
    "Strongest Facebook test: visible danger, a narrow opening, and one survival move that feels possible.",
};

const ARC_MICRO_GUIDANCE: Record<Arc, string> = {
  "Ambush attack":
    "Backend arc: late awareness and closing danger. Good for a clean first-frame threat without hype.",
  "Predator vs predator fight":
    "Backend arc: two capable animals testing position. Keep the setup grounded and avoid winner-bait framing.",
  "Chase and takedown":
    "Backend arc: motion and closing distance. Use when the first test needs quick forward action.",
  "Escape from danger":
    "Backend arc: near miss and breakaway. Strong when survival is visible before the payoff.",
  "Territory dominance battle":
    "Backend arc: claimed ground and response. Strong for posture, warning, and territorial escalation.",
  "Pack hunting strategy":
    "Backend arc: group pursuit and angle control. Strong for Facebook when spacing is easy to understand.",
  "Defender stands ground":
    "Backend arc: refusal to yield. Strong when the stand is clear before the contact beat.",
  "Giant vs giant clash":
    "Backend arc: heavy body language. Strong for rut-style builds with shoulder weight and footing.",
};

const WEATHER_MICRO_GUIDANCE: Record<Weather, string> = {
  "Golden Hour": "Safest warm wildlife look; strong first test for Facebook clarity.",
  Storm: "Adds drama, but keep animals easy to see in the opening beat.",
  Overcast: "Clean documentary look with lower glare and steady animal detail.",
  Dawn: "Good for early-morning wildlife tension and softer first-frame contrast.",
  "Midday Heat": "Useful for dry plains or desert tension; avoid overly flat action staging.",
  "Winter Blizzard": "High atmosphere choice; safest when subjects are large and clearly separated.",
  "Frozen Dusk": "Moody cold-weather look; strongest with slower standoff or survival setups.",
};

const DEPTH_MICRO_GUIDANCE: Record<DepthMode, string> = {
  "Cinematic Blur":
    "Strongest subject separation; best when the first frame needs an obvious animal read.",
  "Balanced Depth":
    "Safest default; keeps animals clear while preserving enough habitat context.",
  "Detailed Background":
    "Best when habitat matters; use carefully if the setup already has busy motion.",
};

const TONE_MICRO_GUIDANCE: Record<EmotionalTone, string> = {
  "Raw Tension": "Strong default for Facebook: direct, physical, and not over-written.",
  "Silent Dread": "Best for ambush or near-miss setups with slower awareness.",
  "Explosive Energy": "Fastest-feeling option; keep the action simple so it does not become chaotic.",
  "Calm Dominance": "Best for territory, rut, and standoff clips where posture carries the moment.",
  "Desperate Survival": "Best for escape builds where the prey has one believable opening.",
  "Haunting Stillness": "Best for quiet openers; pair with visible tension so frame one is not dead-static.",
  "Primal Instinct": "Broad wildlife tone; useful when you want less stylized narration pressure.",
};

const VIBE_MICRO_GUIDANCE: Record<AnimalVibe, string> = {
  "BBC Earth Documentary":
    "Safest documentary framing; keeps the package observational and credible.",
  "National Geographic Wild":
    "Good for polished USA wildlife energy without drifting into hype.",
  "Raw Nature Unfiltered":
    "Sharper and more immediate; best when the setup is already visually clear.",
  "David Attenborough Style":
    "Slower, observational tone; strongest for standoffs, habitat, and behavior detail.",
  "Slow Motion Nature":
    "Use for heavy impact or posture moments, not fast tests that need immediate pace.",
};

export function getContentLaneMicroGuidance(contentLane: ContentLane): string {
  return LANE_MICRO_GUIDANCE[contentLane];
}

export function getArcMicroGuidance(arc: Arc): string {
  return ARC_MICRO_GUIDANCE[arc];
}

export function getWeatherMicroGuidance(weather: Weather): string {
  return WEATHER_MICRO_GUIDANCE[weather];
}

export function getDepthModeMicroGuidance(depthMode: DepthMode): string {
  return DEPTH_MICRO_GUIDANCE[depthMode];
}

export function getToneMicroGuidance(tone: EmotionalTone): string {
  return TONE_MICRO_GUIDANCE[tone];
}

export function getAnimalVibeMicroGuidance(vibe: AnimalVibe): string {
  return VIBE_MICRO_GUIDANCE[vibe];
}

export function getAnimalPairMicroGuidance(
  predator: string,
  prey: string,
  driftRisk: PredatorInfo["driftRisk"]
): string {
  if (driftRisk === "LOW") {
    return `${predator} vs ${prey} is a safer first test: lower drift risk and easier subject separation.`;
  }
  if (driftRisk === "MEDIUM") {
    return `${predator} vs ${prey} can work well, but keep the first action simple and species-clear.`;
  }
  return `${predator} vs ${prey} is higher drift risk; use conservative habitat and simple action first.`;
}

function getLaneCompatibilityFallbackHint(
  contentLane: ContentLane,
  arc: Arc
): string {
  switch (contentLane) {
    case "Pack Hunt":
      return `Strongest Facebook test: keep ${arc} arc-led and avoid coordinated pack-hunt copy unless grouped predators are visible.`;
    case "Defender":
      return `Strongest Facebook test: keep ${arc} arc-led and avoid calf-protection or hold-ground copy unless the defender posture is obvious.`;
    case "Fishing Strike":
      return `Strongest Facebook test: keep ${arc} arc-led and avoid waterline strike copy unless the habitat visibly supports it.`;
    case "Rut Battle":
      return `Strongest Facebook test: treat this as a giant clash or territorial standoff, not a rut or antler setup.`;
    case "Escape":
      return `Strongest Facebook test: keep ${arc} arc-led and avoid forced near-miss copy unless the breakaway window is visible.`;
    default:
      return LANE_STRONGEST_HINT.Auto;
  }
}

function buildStep1LaneRead(input: {
  predator: string;
  prey: string;
  contentLane: ContentLane;
  arc: Arc;
}): { targetingLabel: string; strongestHint: string } {
  if (input.contentLane === "Auto") {
    return {
      targetingLabel: "animal-first targeting",
      strongestHint: LANE_STRONGEST_HINT.Auto,
    };
  }

  if (
    isContentLaneCompatible(
      input.contentLane,
      input.predator,
      input.prey,
      input.arc
    )
  ) {
    return {
      targetingLabel: `${input.contentLane} targeting`,
      strongestHint: LANE_STRONGEST_HINT[input.contentLane],
    };
  }

  return {
    targetingLabel: `${input.contentLane} selected, but ${input.arc} should stay arc-led`,
    strongestHint: getLaneCompatibilityFallbackHint(input.contentLane, input.arc),
  };
}

export function getHabitatOverrideGuidance(
  habitat: HabitatPreset,
  contentLane: ContentLane
): { label: string; message: string; isWarning: boolean } {
  if (habitat === "Auto") {
    return {
      label: "Safest habitat mode",
      message:
        "Auto keeps the habitat aligned with the animal pair, arc, and Content Lane before generation.",
      isWarning: false,
    };
  }

  const laneNote =
    contentLane === "Auto"
      ? "the animal pairing"
      : `${contentLane} lane logic`;

  return {
    label: "Manual habitat override active",
    message: `Keep this only when the location is intentional. It can weaken realism if it fights ${laneNote}.`,
    isWarning: true,
  };
}

export function buildStep1FacebookRecommendation({
  predator,
  prey,
  contentLane,
  arc,
  habitat,
  weather,
  depthMode,
  driftRisk,
}: Step1RecommendationInput): Step1FacebookRecommendation {
  const habitatIsAuto = habitat === "Auto";
  const safest = habitatIsAuto
    ? driftRisk === "LOW"
      ? "Keep Auto habitat and this pairing for the safest first Facebook test."
      : "Keep Auto habitat first; it gives the generator the most room to protect realism."
    : "Consider testing Auto habitat once before committing to the manual location.";

  const fastest =
    weather === "Golden Hour" || weather === "Dawn" || depthMode === "Balanced Depth"
      ? "Current light/depth choices are fast-test friendly: clear subjects, low explanation cost."
      : "For the fastest first test, use Golden Hour or Balanced Depth if this setup feels too stylized.";
  const laneRead = buildStep1LaneRead({ predator, prey, contentLane, arc });

  return {
    title: `${predator} vs ${prey}: Facebook first-test read`,
    summary: `${arc} with ${laneRead.targetingLabel} is the current story shape. ${laneRead.strongestHint}`,
    hints: [
      { label: "Safest", text: safest },
      { label: "Strongest", text: laneRead.strongestHint },
      { label: "Fastest", text: fastest },
    ],
  };
}
