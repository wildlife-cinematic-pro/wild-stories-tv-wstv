import type {
  AnimalVibe,
  Arc,
  CameraAnglePreset,
  ContentLane,
  DepthMode,
  EmotionalTone,
  HabitatPreset,
  Weather,
} from "@/types";

export type SceneIntelligenceInput = {
  predator: string;
  prey: string;
  contentLane: ContentLane;
  arc: Arc;
  habitat: HabitatPreset;
  weather: Weather;
  depthMode: DepthMode;
  cameraAnglePreset: CameraAnglePreset;
  emotionalTone: EmotionalTone;
  animalVibe: AnimalVibe;
  environment: string;
};

export type SceneIntelligenceSeverity =
  | "success"
  | "info"
  | "warning"
  | "danger";

export type SceneIntelligenceLabel =
  | "Strong"
  | "Good"
  | "Needs Review"
  | "Risky";

export type SceneIntelligenceReport = {
  score: number;
  label: SceneIntelligenceLabel;
  severity: SceneIntelligenceSeverity;
  issue: string;
  fix: string;
  recommended: {
    habitat: HabitatPreset;
    weather: Weather;
    depthMode: DepthMode;
    cameraAnglePreset: CameraAnglePreset;
    emotionalTone: EmotionalTone;
    animalVibe: AnimalVibe;
  };
  reasons: string[];
};

export type ScenePresetLabel = "Safest" | "Most Viral" | "Most Realistic";

export type ScenePresetOption = {
  label: ScenePresetLabel;
  habitat: HabitatPreset;
  weather: Weather;
  depthMode: DepthMode;
  cameraAnglePreset: CameraAnglePreset;
  emotionalTone: EmotionalTone;
  animalVibe: AnimalVibe;
};

const DIRECT_WATER_PREDATORS = [
  "crocodile",
  "alligator",
  "caiman",
  "nile crocodile",
  "saltwater crocodile",
] as const;

const CONDITIONAL_WATER_PREDATORS = [
  "jaguar",
  "bald eagle",
  "eagle",
  "bear",
] as const;

const WATER_PREY = [
  "salmon",
  "fish",
  "trout",
  "seal",
  "duck",
  "water buffalo",
  "frog",
  "crayfish",
] as const;

const OPEN_CHASE_PREDATORS = [
  "wolf pack",
  "wolf",
  "coyote",
  "cheetah",
  "african wild dog",
] as const;

const OPEN_CHASE_PREY = [
  "gazelle",
  "antelope",
  "zebra",
  "wildebeest",
  "rabbit",
  "deer",
  "elk",
  "bull elk",
  "moose",
  "bison",
] as const;

const HEAVY_DEFENDER_PREDATORS = [
  "bison",
  "moose",
  "bull elk",
  "musk ox",
  "cape buffalo",
  "water buffalo",
  "rhinoceros",
  "elephant",
] as const;

const WATER_HEAVY_HABITATS = [
  "Riverbank Reeds",
  "Everglades Marsh",
  "Cypress Swamp Edge",
  "Coastal Cliffline",
] as const;

const WATER_ENVIRONMENT_HINTS = [
  "river",
  "water",
  "marsh",
  "swamp",
  "coast",
  "shore",
  "lake",
  "ocean",
  "surf",
  "fjord",
  "creek",
  "reeds",
  "wetland",
] as const;

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function includesAny(value: string, keywords: readonly string[]): boolean {
  return keywords.some((keyword) => value.includes(keyword));
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function getRecommendedHabitat(input: SceneIntelligenceInput): HabitatPreset {
  const predator = normalize(input.predator);
  const prey = normalize(input.prey);
  const environment = normalize(input.environment);

  if (includesAny(predator, DIRECT_WATER_PREDATORS)) {
    return "Riverbank Reeds";
  }

  if (
    includesAny(predator, CONDITIONAL_WATER_PREDATORS) &&
    (includesAny(prey, WATER_PREY) ||
      includesAny(environment, WATER_ENVIRONMENT_HINTS))
  ) {
    return "Riverbank Reeds";
  }

  if (
    includesAny(predator, OPEN_CHASE_PREDATORS) ||
    (includesAny(predator, ["mountain lion"]) && includesAny(prey, OPEN_CHASE_PREY))
  ) {
    return "Open Prairie Grassland";
  }

  if (includesAny(predator, HEAVY_DEFENDER_PREDATORS)) {
    return "Rocky Mountain Meadow";
  }

  return "Auto";
}

function isWaterCompatible(input: SceneIntelligenceInput): boolean {
  const predator = normalize(input.predator);
  const prey = normalize(input.prey);
  const environment = normalize(input.environment);

  return (
    includesAny(predator, DIRECT_WATER_PREDATORS) ||
    (includesAny(predator, CONDITIONAL_WATER_PREDATORS) &&
      (includesAny(prey, WATER_PREY) ||
        includesAny(environment, WATER_ENVIRONMENT_HINTS))) ||
    includesAny(prey, WATER_PREY) ||
    includesAny(environment, WATER_ENVIRONMENT_HINTS)
  );
}

function isHeavyDefenderInput(input: SceneIntelligenceInput): boolean {
  const predator = normalize(input.predator);

  return (
    includesAny(predator, HEAVY_DEFENDER_PREDATORS) ||
    input.arc === "Defender stands ground" ||
    input.arc === "Giant vs giant clash" ||
    input.arc === "Territory dominance battle"
  );
}

function getMostViralTone(input: SceneIntelligenceInput): EmotionalTone {
  if (
    input.arc === "Defender stands ground" ||
    input.arc === "Giant vs giant clash" ||
    input.arc === "Territory dominance battle" ||
    includesAny(normalize(input.predator), DIRECT_WATER_PREDATORS)
  ) {
    return "Raw Tension";
  }

  return "Explosive Energy";
}

function getMostRealisticWeather(
  report: SceneIntelligenceReport
): Weather {
  if (
    WATER_HEAVY_HABITATS.includes(
      report.recommended.habitat as (typeof WATER_HEAVY_HABITATS)[number]
    )
  ) {
    return "Overcast";
  }

  return "Dawn";
}

function getLabel(score: number): SceneIntelligenceLabel {
  if (score >= 85) {
    return "Strong";
  }
  if (score >= 70) {
    return "Good";
  }
  if (score >= 55) {
    return "Needs Review";
  }
  return "Risky";
}

function getSeverity(score: number): SceneIntelligenceSeverity {
  if (score >= 85) {
    return "success";
  }
  if (score >= 70) {
    return "info";
  }
  if (score >= 55) {
    return "warning";
  }
  return "danger";
}

export function buildSceneIntelligenceReport(
  input: SceneIntelligenceInput
): SceneIntelligenceReport {
  const recommendedHabitat = getRecommendedHabitat(input);
  const recommended = {
    habitat: recommendedHabitat,
    weather: "Golden Hour" as Weather,
    depthMode: "Balanced Depth" as DepthMode,
    cameraAnglePreset: "Front full-body" as CameraAnglePreset,
    emotionalTone: "Raw Tension" as EmotionalTone,
    animalVibe: "National Geographic Wild" as AnimalVibe,
  };

  const reasons: string[] = [];
  let score = 78;

  const habitatMismatch =
    input.habitat !== "Auto" && input.habitat !== recommendedHabitat;

  if (input.habitat === "Auto") {
    score += 8;
    reasons.push(
      "Auto habitat lets the pair logic choose the safest first-test location."
    );
  } else if (input.habitat === recommendedHabitat) {
    score += 12;
    reasons.push(
      `${input.habitat} supports a clean visual lane for ${input.predator} vs ${input.prey}.`
    );
  } else {
    score -= 18;
    if (recommendedHabitat !== "Auto") {
      score -= 12;
    }
    reasons.push(
      `${input.habitat} fights the clearest first-test habitat for this pair.`
    );
  }

  if (input.weather === "Golden Hour" || input.weather === "Dawn") {
    score += 5;
    reasons.push(
      `${input.weather} gives the animals clearer first-frame contrast.`
    );
  }

  if (input.depthMode === "Balanced Depth") {
    score += 4;
    reasons.push("Balanced Depth keeps both habitat and subject readability intact.");
  }

  if (
    input.cameraAnglePreset === "Auto" ||
    input.cameraAnglePreset === "Front full-body"
  ) {
    score += 4;
    reasons.push("Front-facing full-body framing keeps the action easier to read.");
  }

  if (input.contentLane === "Fishing Strike" && !isWaterCompatible(input)) {
    score -= 15;
    reasons.push(
      "Fishing Strike needs a clearer waterline setup to feel believable."
    );
  }

  if (input.contentLane === "Escape" && input.arc === "Defender stands ground") {
    score -= 8;
    reasons.push("Escape lane and Defender stands ground pull the scene in opposite directions.");
  }

  if (
    recommendedHabitat === "Riverbank Reeds" &&
    normalize(input.environment).length > 0
  ) {
    reasons.push("This pair reads strongest when the strike lane stays close to water.");
  } else if (recommendedHabitat === "Open Prairie Grassland") {
    reasons.push("Open ground helps the chase lane read fast without clutter.");
  } else if (recommendedHabitat === "Rocky Mountain Meadow") {
    reasons.push("Heavy animals need planted footing and a clear collision lane.");
  }

  score = clampScore(score);

  let issue: string;
  let fix: string;
  if (score >= 85) {
    issue = "This setup is strongly aligned.";
    fix = "Keep this setup, then generate a test package.";
  } else if (habitatMismatch) {
    issue = `${input.habitat} may not be the strongest habitat for ${input.predator} vs ${input.prey}.`;
    fix =
      recommendedHabitat === "Auto"
        ? "Try Auto habitat for a cleaner first test."
        : `Try ${recommendedHabitat} or Auto habitat for a cleaner first test.`;
  } else {
    issue = "This setup can work, but it needs a clearer visual lane.";
    fix = "Use the recommended scene settings if the first test feels unclear.";
  }

  return {
    score,
    label: getLabel(score),
    severity: getSeverity(score),
    issue,
    fix,
    recommended,
    reasons,
  };
}

export function buildScenePresetOptions(
  report: SceneIntelligenceReport,
  input: SceneIntelligenceInput
): ScenePresetOption[] {
  const mostRealisticHabitat =
    report.recommended.habitat === "Auto"
      ? "Auto"
      : report.recommended.habitat;

  return [
    {
      label: "Safest",
      habitat: "Auto",
      weather: "Golden Hour",
      depthMode: "Balanced Depth",
      cameraAnglePreset: "Front full-body",
      emotionalTone: "Raw Tension",
      animalVibe: "BBC Earth Documentary",
    },
    {
      label: "Most Viral",
      habitat: report.recommended.habitat,
      weather: "Golden Hour",
      depthMode: "Balanced Depth",
      cameraAnglePreset: "Front full-body",
      emotionalTone: getMostViralTone(input),
      animalVibe: "National Geographic Wild",
    },
    {
      label: "Most Realistic",
      habitat: mostRealisticHabitat,
      weather: getMostRealisticWeather(report),
      depthMode: "Detailed Background",
      cameraAnglePreset: "Front full-body",
      emotionalTone: isHeavyDefenderInput(input)
        ? "Calm Dominance"
        : "Raw Tension",
      animalVibe: "BBC Earth Documentary",
    },
  ];
}
