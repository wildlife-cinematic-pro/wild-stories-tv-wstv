import type {
  ActionStylePreset,
  Arc,
  ContentLane,
  KlingModel,
  RunwayModel,
  VideoModelCapability,
  VideoModelProviderGroup,
} from "@/types";

export type { VideoModelCapability, VideoModelProviderGroup } from "@/types";

export type VideoModelSceneRecommendationInput = {
  runwayModel?: RunwayModel;
  klingModel?: KlingModel;
  actionStyle?: ActionStylePreset;
  arc?: Arc;
  contentLane?: ContentLane;
};

export type VideoModelSelectableTarget =
  | { engine: "runway"; model: RunwayModel }
  | { engine: "kling"; model: KlingModel };

export type VideoModelSceneRecommendation = {
  id: string;
  label: string;
  reason: string;
  bestFor: string;
  priority: number;
  guidanceOnly: boolean;
  selectableTarget?: VideoModelSelectableTarget;
};

const COMMON_VIDEO_GUARDRAILS = [
  "Keep prompts non-graphic: no blood, gore, visible injury, kill result, or graphic feeding.",
  "Preserve wildlife documentary realism, grounded contact, clean subject separation, and first-frame readability.",
  "Keep image-engine syntax out of video prompts; Nano Banana 2 and GPT Image 2 stay image-only.",
];

export const VIDEO_MODEL_CAPABILITIES: VideoModelCapability[] = [
  {
    id: "runway-gen-4-5",
    label: "Gen-4.5",
    providerGroup: "RUNWAY_NATIVE",
    provider: "Runway",
    workflowRole: "hybrid-runway",
    supportedInputModes: ["text-to-video", "image-to-video", "reference-image"],
    recommendedUse: "Final cinematic wildlife hero shots and polished hybrid openings/endings.",
    wildlifeUseCase:
      "Best WSTV Runway pick for hero-level animal tension, clean camera language, and final Facebook Reels renders.",
    official: [],
    house: [
      "Use for final hero renders after structure has been proven on faster/cheaper passes.",
      "Keep I2V prompts motion-focused because reference images carry animal identity.",
    ],
    needsVerification: false,
    costTier: "premium",
    speedTier: "medium",
    realismTier: "premium",
    actionTier: "high",
    promptGuidance: [
      ...COMMON_VIDEO_GUARDRAILS,
      "Describe motion, camera, physics, spacing, and timing; avoid restating coat/anatomy when references are active.",
    ],
  },
  {
    id: "runway-gen-4",
    label: "Gen-4",
    providerGroup: "RUNWAY_NATIVE",
    provider: "Runway",
    workflowRole: "hybrid-runway",
    supportedInputModes: ["text-to-video", "image-to-video", "reference-image"],
    recommendedUse: "Stable cinematic shots with clear openings and simple motion.",
    wildlifeUseCase:
      "Good compatibility option for standard WSTV Runway shots when Gen-4.5 is not needed.",
    official: [],
    house: [
      "Use for stable hybrid shots with readable subject spacing.",
      "Prefer direct, motion-only I2V wording for animal reference workflows.",
    ],
    needsVerification: false,
    costTier: "high",
    speedTier: "medium",
    realismTier: "high",
    actionTier: "medium",
    promptGuidance: COMMON_VIDEO_GUARDRAILS,
  },
  {
    id: "runway-gen-4-turbo",
    label: "Gen-4 Turbo",
    providerGroup: "RUNWAY_NATIVE",
    provider: "Runway",
    workflowRole: "hybrid-runway",
    supportedInputModes: ["text-to-video", "image-to-video", "reference-image"],
    recommendedUse: "Cheap first tests, structure tests, and fast opening-readability checks.",
    wildlifeUseCase:
      "Best WSTV Runway pick for quick motion structure tests before upgrading the shot.",
    official: [],
    house: [
      "Use for drafts, motion blocking, and first-frame readability tests.",
      "Upgrade successful hero shots to Gen-4.5 for final delivery.",
    ],
    needsVerification: false,
    costTier: "medium",
    speedTier: "high",
    realismTier: "medium",
    actionTier: "medium",
    promptGuidance: COMMON_VIDEO_GUARDRAILS,
  },
  {
    id: "runway-aleph",
    label: "Aleph",
    providerGroup: "RUNWAY_NATIVE",
    provider: "Runway",
    workflowRole: "hybrid-runway",
    supportedInputModes: ["video-editing", "reference-image"],
    recommendedUse: "Editing or manipulating existing footage rather than first-pass wildlife generation.",
    wildlifeUseCase:
      "Use only when you already have footage or a finished shot that needs controlled edit/manipulation.",
    official: [],
    house: [
      "Not the default WSTV generation route.",
      "Use for fixing or transforming existing footage while preserving animal identity and habitat continuity.",
    ],
    needsVerification: true,
    costTier: "high",
    speedTier: "medium",
    realismTier: "high",
    actionTier: "medium",
    promptGuidance: [
      ...COMMON_VIDEO_GUARDRAILS,
      "Treat source footage as the identity and timing anchor; request edits with minimal species restatement.",
    ],
  },
  {
    id: "kling-3-0-motion-control",
    label: "Kling 3.0 Motion Control",
    providerGroup: "RUNWAY_THIRD_PARTY",
    provider: "Kling",
    workflowRole: "third-party-runway",
    supportedInputModes: ["image-to-video", "motion-control", "reference-image"],
    recommendedUse: "Third-party Runway route for realistic animal pressure and controlled body mechanics.",
    wildlifeUseCase:
      "Use when a shot needs identity-locked action, grounded movement, and stronger animal pressure.",
    official: [],
    house: [
      "Prefer for controlled action beats, pressure builds, and grounded wildlife mechanics.",
      "Mark details for verification before treating queue/cost/spec claims as official.",
    ],
    needsVerification: true,
    costTier: "high",
    speedTier: "medium",
    realismTier: "high",
    actionTier: "premium",
    promptGuidance: COMMON_VIDEO_GUARDRAILS,
  },
  {
    id: "kling-03-4k",
    label: "Kling 03 4K",
    providerGroup: "RUNWAY_THIRD_PARTY",
    provider: "Kling",
    workflowRole: "third-party-runway",
    supportedInputModes: ["image-to-video", "reference-image"],
    recommendedUse: "Third-party 4K-oriented route for final action shots when verified/available.",
    wildlifeUseCase:
      "Use for realistic animal pressure, identity-locked action, and grounded body mechanics when high-resolution delivery matters.",
    official: [],
    house: [
      "Treat as a final-quality action route only after availability and specs are verified.",
      "Keep prompts focused on one dominant action beat and clean body separation.",
    ],
    needsVerification: true,
    costTier: "premium",
    speedTier: "medium",
    realismTier: "premium",
    actionTier: "premium",
    promptGuidance: COMMON_VIDEO_GUARDRAILS,
  },
  {
    id: "kling-3-0-pro",
    label: "Kling 3.0 Pro",
    providerGroup: "KLING_DIRECT",
    provider: "Kling",
    workflowRole: "direct-kling",
    supportedInputModes: ["text-to-video", "image-to-video", "reference-image"],
    recommendedUse: "Direct Kling action workflow for readable pressure and body mechanics.",
    wildlifeUseCase:
      "Best current direct Kling compatibility route for WSTV action shots and hybrid middle beats.",
    official: [],
    house: [
      "Use for realistic animal pressure, identity-locked action, and grounded body mechanics.",
      "Keep one action beat per shot and avoid chaotic camera movement.",
    ],
    needsVerification: false,
    costTier: "high",
    speedTier: "medium",
    realismTier: "high",
    actionTier: "premium",
    promptGuidance: COMMON_VIDEO_GUARDRAILS,
  },
  {
    id: "kling-3-0-standard",
    label: "Kling 3.0 Standard",
    providerGroup: "KLING_DIRECT",
    provider: "Kling",
    workflowRole: "direct-kling",
    supportedInputModes: ["text-to-video", "image-to-video", "reference-image"],
    recommendedUse: "Balanced direct Kling route for daily WSTV output.",
    wildlifeUseCase:
      "Good balance for action clarity, subject spacing, and practical render speed.",
    official: [],
    house: ["Use when Pro is not needed; keep action simple and readable."],
    needsVerification: false,
    costTier: "medium",
    speedTier: "medium",
    realismTier: "high",
    actionTier: "high",
    promptGuidance: COMMON_VIDEO_GUARDRAILS,
  },
  {
    id: "kling-2-6-pro",
    label: "Kling 2.6 Pro",
    providerGroup: "KLING_DIRECT",
    provider: "Kling",
    workflowRole: "direct-kling",
    supportedInputModes: ["text-to-video", "image-to-video", "reference-image"],
    recommendedUse: "Compatibility fallback for simpler readable action.",
    wildlifeUseCase: "Fallback for WSTV action beats when newer Kling queues are not ideal.",
    official: [],
    house: ["Keep prompts shorter, simpler, and spacing-forward."],
    needsVerification: false,
    costTier: "medium",
    speedTier: "medium",
    realismTier: "medium",
    actionTier: "high",
    promptGuidance: COMMON_VIDEO_GUARDRAILS,
  },
  {
    id: "kling-2-5-turbo-pro",
    label: "Kling 2.5 Turbo Pro",
    providerGroup: "KLING_DIRECT",
    provider: "Kling",
    workflowRole: "direct-kling",
    supportedInputModes: ["text-to-video", "image-to-video"],
    recommendedUse: "Fast direct Kling draft route.",
    wildlifeUseCase: "Use for one clean action beat and quick WSTV motion trials.",
    official: [],
    house: ["Use for fast tests; upgrade important shots before publishing."],
    needsVerification: false,
    costTier: "medium",
    speedTier: "high",
    realismTier: "medium",
    actionTier: "medium",
    promptGuidance: COMMON_VIDEO_GUARDRAILS,
  },
  {
    id: "kling-2-5-turbo",
    label: "Kling 2.5 Turbo",
    providerGroup: "KLING_DIRECT",
    provider: "Kling",
    workflowRole: "direct-kling",
    supportedInputModes: ["text-to-video", "image-to-video"],
    recommendedUse: "Lowest-stakes compatibility draft route.",
    wildlifeUseCase: "Use for rough opening tests only, then upgrade useful shots.",
    official: [],
    house: ["Keep prompts very short and use for rough structure checks."],
    needsVerification: false,
    costTier: "low",
    speedTier: "high",
    realismTier: "medium",
    actionTier: "medium",
    promptGuidance: COMMON_VIDEO_GUARDRAILS,
  },
  {
    id: "seedance-2",
    label: "Seedance 2",
    providerGroup: "SEEDANCE_DIRECT",
    provider: "Seedance",
    workflowRole: "direct-seedance",
    supportedInputModes: ["text-to-video", "image-to-video", "reference-image"],
    recommendedUse: "Fast chase/action, high-retention motion, and viral pacing.",
    wildlifeUseCase:
      "Optional WSTV route for compact fast motion prompts, chase pressure, and social pacing experiments.",
    official: [],
    house: [
      "Keep prompts compact: subject movement, background movement, camera movement.",
      "Use as an optional fast action route; do not mix Runway reference syntax into Seedance prompts.",
    ],
    needsVerification: true,
    costTier: "medium",
    speedTier: "high",
    realismTier: "medium",
    actionTier: "high",
    promptGuidance: COMMON_VIDEO_GUARDRAILS,
  },
] satisfies VideoModelCapability[];

export const VIDEO_MODEL_GROUP_LABELS: Record<VideoModelProviderGroup, string> = {
  RUNWAY_NATIVE: "Runway Native",
  RUNWAY_THIRD_PARTY: "Runway Third-Party",
  KLING_DIRECT: "Direct Kling",
  SEEDANCE_DIRECT: "Direct Seedance",
};

export const VIDEO_MODEL_GROUP_ORDER: VideoModelProviderGroup[] = [
  "RUNWAY_NATIVE",
  "RUNWAY_THIRD_PARTY",
  "KLING_DIRECT",
  "SEEDANCE_DIRECT",
];

export function getVideoModelCapabilitiesByGroup(
  providerGroup: VideoModelProviderGroup
): VideoModelCapability[] {
  return VIDEO_MODEL_CAPABILITIES.filter(
    (capability) => capability.providerGroup === providerGroup
  );
}

export function getVideoModelCapability(label: string): VideoModelCapability | undefined {
  return VIDEO_MODEL_CAPABILITIES.find((capability) => capability.label === label);
}


const SELECTABLE_RUNWAY_MODELS: readonly RunwayModel[] = [
  "Gen-4.5",
  "Gen-4 Turbo",
  "Gen-4",
];

const SELECTABLE_KLING_MODELS: readonly KlingModel[] = [
  "Kling 3.0 Pro",
  "Kling 3.0 Standard",
  "Kling 2.6 Pro",
  "Kling 2.5 Turbo Pro",
  "Kling 2.5 Turbo",
];

function getSelectableTarget(label: string): VideoModelSelectableTarget | undefined {
  if ((SELECTABLE_RUNWAY_MODELS as readonly string[]).includes(label)) {
    return { engine: "runway", model: label as RunwayModel };
  }

  if ((SELECTABLE_KLING_MODELS as readonly string[]).includes(label)) {
    return { engine: "kling", model: label as KlingModel };
  }

  return undefined;
}

function buildRecommendation(input: {
  id: string;
  label: string;
  reason: string;
  bestFor: string;
  priority: number;
}): VideoModelSceneRecommendation {
  const selectableTarget = getSelectableTarget(input.label);

  return {
    ...input,
    guidanceOnly: !selectableTarget,
    selectableTarget,
  };
}

function hasFastAction(input: VideoModelSceneRecommendationInput): boolean {
  return (
    input.actionStyle === "Viral chase" ||
    input.actionStyle === "Ambush burst" ||
    input.arc === "Escape from danger" ||
    input.arc === "Chase and takedown" ||
    input.contentLane === "Escape"
  );
}

function hasGroundedPressure(input: VideoModelSceneRecommendationInput): boolean {
  return (
    input.actionStyle === "Close-contact fight" ||
    input.actionStyle === "Forced retreat" ||
    input.arc === "Territory dominance battle" ||
    input.arc === "Giant vs giant clash" ||
    input.contentLane === "Rut Battle" ||
    input.contentLane === "Defender"
  );
}

export function getSceneBasedVideoModelRecommendations(
  input: VideoModelSceneRecommendationInput = {}
): VideoModelSceneRecommendation[] {
  const recommendations: VideoModelSceneRecommendation[] = [
    buildRecommendation({
      id: "runway-gen-4-turbo",
      label: "Gen-4 Turbo",
      reason: "Cheap first pass for structure, spacing, and first-frame readability tests.",
      bestFor: "Quick structure tests before spending final render time.",
      priority: 70,
    }),
    buildRecommendation({
      id: "runway-gen-4-5",
      label: "Gen-4.5",
      reason: "Final cinematic wildlife hero shots after the motion structure is proven.",
      bestFor: "Polished Runway hybrid openings/endings with strong wildlife realism.",
      priority: 80,
    }),
    buildRecommendation({
      id: "runway-aleph",
      label: "Aleph",
      reason: "Use when editing or manipulating existing footage rather than generating a new shot.",
      bestFor: "Existing-footage edits; guidance only in the current saved model system.",
      priority: 30,
    }),
  ];

  if (hasGroundedPressure(input)) {
    recommendations.push(
      buildRecommendation({
        id: "kling-03-4k",
        label: "Kling 03 4K",
        reason: "Final-quality grounded animal pressure and body mechanics when verified/available.",
        bestFor: "Verified high-resolution action route planning; guidance only for now.",
        priority: 95,
      }),
      buildRecommendation({
        id: "kling-3-0-motion-control",
        label: "Kling 3.0 Motion Control",
        reason: "Controlled identity-locked action, realistic spacing, and pressure beats.",
        bestFor: "Motion-control action planning; guidance only for current saved selectors.",
        priority: 92,
      })
    );
  } else {
    recommendations.push(buildRecommendation({
      id: "kling-3-0-pro",
      label: "Kling 3.0 Pro",
      reason: "Strong direct Kling action route for grounded middle-beat wildlife motion.",
      bestFor: "Selectable direct Kling pressure/action shots inside the current hybrid workflow.",
      priority: 82,
    }));
  }

  if (hasFastAction(input)) {
    recommendations.push(buildRecommendation({
      id: "seedance-2",
      label: "Seedance 2",
      reason: "Fast chase/action and high-retention motion experiments with compact prompts.",
      bestFor: "Optional Seedance action route; guidance only because saved selectors remain Runway/Kling.",
      priority: 90,
    }));
  } else {
    recommendations.push(buildRecommendation({
      id: "seedance-2",
      label: "Seedance 2",
      reason: "Optional fast direct route for compact social-motion tests.",
      bestFor: "Optional compact motion experiments; guidance only in saved presets.",
      priority: 50,
    }));
  }

  return recommendations.sort((a, b) =>
    b.priority === a.priority ? a.label.localeCompare(b.label) : b.priority - a.priority
  );
}
