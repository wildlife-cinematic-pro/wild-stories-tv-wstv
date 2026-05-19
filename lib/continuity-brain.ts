import {
  HabitatRegion,
  StoryMode,
  type ActionStylePreset,
  type CameraAnglePreset,
  type ContentLane,
  type Season,
  type TimeOfDay,
  type ViolenceLevel,
} from "@/types";

export type ContinuityShotRole = "hook" | "trigger" | "peak" | "unresolved";

export type ContinuitySubjectMemory = {
  id: "animalA" | "animalB";
  label: string;
  role: string;
  identityLock: string[];
  placement: "left" | "right" | "center" | "rear" | "front";
  visibilityRule: string;
};

export type ContinuityEnvironmentMemory = {
  habitat: string;
  season: string;
  timeOfDay: string;
  terrainLock: string[];
  lightingDirection: string;
  openActionLane: string;
};

export type ContinuityShotMemory = {
  shotNumber: 1 | 2 | 3 | 4;
  role: ContinuityShotRole;
  continuityGoal: string;
  blocking: string;
  cameraRule: string;
  motionRule: string;
  repairGuards: string[];
};

export type ContinuityBrain = {
  version: "wstv-continuity-brain-v1";
  summary: string;
  animalA: ContinuitySubjectMemory;
  animalB: ContinuitySubjectMemory;
  environment: ContinuityEnvironmentMemory;
  cameraLensLock: string[];
  engineRules: {
    nanoBanana2: string[];
    gptImage2: string[];
    kling: string[];
    runway: string[];
    seedance: string[];
  };
  shots: ContinuityShotMemory[];
  globalNegativeRules: string[];
  repairFailureOptions: string[];
};

export type ContinuityAppendixEngine =
  | "nanoBanana2"
  | "gptImage2"
  | "kling"
  | "runway"
  | "seedance"
  | "all";

export type FormatContinuityAppendixOptions = {
  engine?: ContinuityAppendixEngine;
  projectId?: string;
  createdAt?: string;
  promptVersionId?: string;
};

export type ContinuityPromptHistoryMetadata = {
  projectId: string;
  createdAt: string;
  animalA: string;
  animalB: string;
  environment: string;
  engine: ContinuityAppendixEngine;
  continuityEnabled: boolean;
  promptVersionId?: string;
};

export type ContinuityRepairPromptInput = {
  basePrompt: string;
  brain: ContinuityBrain;
  selectedFailures: readonly string[];
  targetEngine?: ContinuityAppendixEngine;
};

export type ContinuityRepairPromptResult = {
  correctedPrompt: string;
  repairSummary: string;
  appliedFixes: string[];
};

export type RunwayReferenceValidation = {
  valid: boolean;
  references: string[];
  missing: string[];
  extra: string[];
  duplicate: string[];
  message: string;
};

export type BuildContinuityBrainInput = {
  storyMode: StoryMode;
  animalA: string;
  animalB: string;
  habitatRegion: HabitatRegion;
  season: Season;
  timeOfDay: TimeOfDay;
  contentLane: ContentLane;
  actionStyle: ActionStylePreset;
  cameraAnglePreset: CameraAnglePreset | string;
  finalEnvironment: string;
  violenceLevel: ViolenceLevel;
};

export const CONTINUITY_PROMPT_BLOCK_HEADER = "WSTV CONTINUITY BRAIN BLOCK";
export const CONTINUITY_APPENDIX_HEADER = "WSTV CONTINUITY LOCK";
export const REQUIRED_RUNWAY_REFERENCES = ["@animalA", "@animalB", "@environment"] as const;
export const CONTINUITY_REPAIR_FAILURE_OPTIONS = [
  "animal not chasing",
  "wrong habitat",
  "identity drift",
  "extra limbs",
  "bad camera",
  "crop issue",
  "weak motion",
  "excessive dust",
  "wrong spacing",
  "unreadable framing",
] as const;

function titleCaseEnum(value: string): string {
  return value
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function clean(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

function roleForAnimalA(storyMode: StoryMode): string {
  switch (storyMode) {
    case StoryMode.MOTHER_BABY:
      return "protector / lead subject";
    case StoryMode.HERD_DEFENSE:
      return "defending group / protected line";
    case StoryMode.RIVAL_CLASH:
      return "rival subject A";
    case StoryMode.FISHING_STRIKE:
      return "strike subject";
    case StoryMode.WEATHER_SURVIVAL:
      return "survival subject";
    case StoryMode.SCAVENGER_CONFLICT:
      return "claim holder";
    default:
      return "pressure or lead subject";
  }
}

function roleForAnimalB(storyMode: StoryMode): string {
  switch (storyMode) {
    case StoryMode.MOTHER_BABY:
      return "threat / pressure subject";
    case StoryMode.HERD_DEFENSE:
      return "outside pressure subject";
    case StoryMode.RIVAL_CLASH:
      return "rival subject B";
    case StoryMode.FISHING_STRIKE:
      return "target or waterline cue";
    case StoryMode.WEATHER_SURVIVAL:
      return "hazard pressure";
    case StoryMode.SCAVENGER_CONFLICT:
      return "challenger";
    default:
      return "escape or opposing subject";
  }
}

function buildSubjectMemory(
  id: ContinuitySubjectMemory["id"],
  label: string,
  storyMode: StoryMode
): ContinuitySubjectMemory {
  const isA = id === "animalA";

  return {
    id,
    label,
    role: isA ? roleForAnimalA(storyMode) : roleForAnimalB(storyMode),
    placement: isA ? "left" : "right",
    visibilityRule:
      "full body readable, grounded feet, clean silhouette, correct body scale, no crop on head, legs, tail, horns, paws, or hooves",
    identityLock: [
      `same ${label} species identity across all four shots`,
      "stable body scale, head shape, ears, muzzle/profile, coat or feather markings, tail shape, and silhouette",
      "no age, species, color, marking, or body-mass change between shots",
    ],
  };
}

function buildShotMemory(): ContinuityShotMemory[] {
  return [
    {
      shotNumber: 1,
      role: "hook",
      continuityGoal: "Immediate readable tension with both animals and the action lane visible.",
      blocking: "animalA left or near-left, animalB right or rear-right, same diagonal terrain lane.",
      cameraRule: "wide readable opening frame, documentary lens, no chaotic crop.",
      motionRule: "hold the tension; only subtle posture or gaze pressure.",
      repairGuards: ["wrong spacing", "unreadable framing", "identity drift"],
    },
    {
      shotNumber: 2,
      role: "trigger",
      continuityGoal: "Threat noticed and movement begins without swapping roles or direction.",
      blocking: "preserve Shot 1 geography; animalB pressure increases while animalA reacts forward.",
      cameraRule: "slightly closer lens or controlled push-in, same lighting direction.",
      motionRule: "one clean trigger movement, no dust burst, no extra animals.",
      repairGuards: ["animal not chasing", "camera bad", "dust excessive"],
    },
    {
      shotNumber: 3,
      role: "peak",
      continuityGoal: "Strongest survival pressure while identity and habitat remain locked.",
      blocking: "animalA remains ahead or protected; animalB remains pressure subject behind or outside.",
      cameraRule: "peak action must stay full-body readable and grounded.",
      motionRule: "single dominant action beat, non-graphic, no contact injury.",
      repairGuards: ["extra limbs", "motion weak", "crop issue"],
    },
    {
      shotNumber: 4,
      role: "unresolved",
      continuityGoal: "Escape pressure or cliffhanger finish with replay value, not a full resolution.",
      blocking: "same action lane continues; no role reversal; habitat stays recognizable.",
      cameraRule: "hold a memorable final frame with open exit space.",
      motionRule: "unresolved movement continuation; no fantasy ending or gore.",
      repairGuards: ["wrong habitat", "wrong spacing", "identity drift"],
    },
  ];
}

export function buildContinuityBrain(input: BuildContinuityBrainInput): ContinuityBrain {
  const animalA = clean(input.animalA, "animal A");
  const animalB = clean(input.animalB, "animal B");
  const habitat = clean(input.finalEnvironment, titleCaseEnum(input.habitatRegion));

  return {
    version: "wstv-continuity-brain-v1",
    summary: `${animalA} and ${animalB} continuity lock for a realistic 4-shot wildlife reel in ${habitat}.`,
    animalA: buildSubjectMemory("animalA", animalA, input.storyMode),
    animalB: buildSubjectMemory("animalB", animalB, input.storyMode),
    environment: {
      habitat,
      season: titleCaseEnum(input.season),
      timeOfDay: titleCaseEnum(input.timeOfDay),
      terrainLock: [
        "same terrain identity and ground texture across every shot",
        "same background depth and region-correct habitat",
        "no random new landmarks, roads, fences, humans, buildings, or biome drift",
      ],
      lightingDirection: "preserve the same documentary light direction and exposure balance",
      openActionLane: "one clear open action lane with readable spacing between subjects",
    },
    cameraLensLock: [
      `${input.cameraAnglePreset} camera preference`,
      `${input.actionStyle} action style`,
      `${input.contentLane} content lane`,
      "no sudden lens-language reset between shots",
      "no cropped bodies, no unreadable motion blur, no chaotic camera swing",
    ],
    engineRules: {
      nanoBanana2: [
        "image generation only",
        "direct photorealistic still prompt",
        "repeat identity, environment, and full-body readability locks",
      ],
      gptImage2: [
        "master image quality and premium wildlife photography language",
        "use stable lens, lighting, and terrain continuity",
      ],
      kling: [
        "15 second cinematic motion language",
        "one dominant movement per shot",
        "first-frame lock and non-graphic survival pressure",
      ],
      runway: [
        "use exactly three references: @animalA, @animalB, @environment",
        "never exceed three references",
        "motion prompt should preserve the reference-frame identities",
      ],
      seedance: [
        "story motion structure",
        "preserve shot order, pacing, and unresolved final beat",
      ],
    },
    shots: buildShotMemory(),
    globalNegativeRules: [
      "no identity drift",
      "no position swapping",
      "no habitat drift",
      "no extra animals",
      "no extra limbs or distorted anatomy",
      "no wrong spacing",
      "no unreadable framing",
      "no fantasy behavior",
      input.violenceLevel <= 2
        ? "no blood, no gore, no visible injury, no graphic contact"
        : "non-graphic pressure only, no explicit gore or visible wounds",
    ],
    repairFailureOptions: [...CONTINUITY_REPAIR_FAILURE_OPTIONS],
  };
}

function formatList(items: string[]): string {
  return items.map((item) => `  - ${item}`).join("\n");
}

function formatEngineRules(
  brain: ContinuityBrain,
  engine: ContinuityAppendixEngine
): string {
  if (engine === "all") {
    return [
      `  - Nano Banana 2: ${brain.engineRules.nanoBanana2.join("; ")}`,
      `  - GPT Image 2: ${brain.engineRules.gptImage2.join("; ")}`,
      `  - Kling: ${brain.engineRules.kling.join("; ")}`,
      `  - Runway: ${brain.engineRules.runway.join("; ")}`,
      `  - Seedance: ${brain.engineRules.seedance.join("; ")}`,
    ].join("\n");
  }

  return formatList(brain.engineRules[engine]);
}

export function buildContinuityPromptHistoryMetadata(
  brain: ContinuityBrain,
  options: FormatContinuityAppendixOptions = {}
): ContinuityPromptHistoryMetadata {
  return {
    projectId: options.projectId ?? "local-wstv-project",
    createdAt: options.createdAt ?? new Date().toISOString(),
    animalA: brain.animalA.label,
    animalB: brain.animalB.label,
    environment: brain.environment.habitat,
    engine: options.engine ?? "all",
    continuityEnabled: true,
    promptVersionId: options.promptVersionId,
  };
}

export function formatContinuityAppendix(
  brain: ContinuityBrain,
  options: FormatContinuityAppendixOptions = {}
): string {
  const engine = options.engine ?? "all";

  return [
    CONTINUITY_APPENDIX_HEADER,
    `Summary: ${brain.summary}`,
    "",
    "Animal identity lock:",
    formatList([
      `@animalA ${brain.animalA.label}: ${brain.animalA.role}; ${brain.animalA.placement} placement; ${brain.animalA.visibilityRule}`,
      ...brain.animalA.identityLock,
      `@animalB ${brain.animalB.label}: ${brain.animalB.role}; ${brain.animalB.placement} placement; ${brain.animalB.visibilityRule}`,
      ...brain.animalB.identityLock,
    ]),
    "",
    "Environment lock:",
    formatList([
      `${brain.environment.habitat}; ${brain.environment.season}; ${brain.environment.timeOfDay}`,
      ...brain.environment.terrainLock,
      brain.environment.lightingDirection,
      brain.environment.openActionLane,
    ]),
    "",
    "Camera/lens lock:",
    formatList(brain.cameraLensLock),
    "",
    "4-shot role lock:",
    formatList(
      brain.shots.map(
        (shot) =>
          `Shot ${shot.shotNumber} ${shot.role}: ${shot.continuityGoal} ${shot.blocking} ${shot.cameraRule} ${shot.motionRule}`
      )
    ),
    "",
    "Engine-specific lock:",
    formatEngineRules(brain, engine),
    "",
    "Negative constraints:",
    formatList(brain.globalNegativeRules),
  ].join("\n");
}

export function buildContinuityPromptBlock(brain: ContinuityBrain): string {
  return [
    `[${CONTINUITY_PROMPT_BLOCK_HEADER}]`,
    formatContinuityAppendix(brain, { engine: "all" }),
    `[/${CONTINUITY_PROMPT_BLOCK_HEADER}]`,
  ].join("\n");
}

export function appendContinuityBlockToPrompt(
  prompt: string,
  brain: ContinuityBrain,
  enabled: boolean
): string {
  if (!enabled) return prompt;
  if (
    prompt.includes(CONTINUITY_PROMPT_BLOCK_HEADER) ||
    prompt.includes(CONTINUITY_APPENDIX_HEADER)
  ) {
    return prompt;
  }

  return [prompt.trim(), buildContinuityPromptBlock(brain)].filter(Boolean).join("\n\n");
}

export function validateRunwayReferenceTags(prompt: string): RunwayReferenceValidation {
  const references = prompt.match(/@[A-Za-z0-9_-]+/g) ?? [];
  const counts = references.reduce<Record<string, number>>((acc, reference) => {
    acc[reference] = (acc[reference] ?? 0) + 1;
    return acc;
  }, {});
  const required = [...REQUIRED_RUNWAY_REFERENCES];
  const missing = required.filter((reference) => !counts[reference]);
  const extra = references.filter(
    (reference) => !required.includes(reference as typeof REQUIRED_RUNWAY_REFERENCES[number])
  );
  const duplicate = Object.entries(counts)
    .filter(([, count]) => count > 1)
    .map(([reference]) => reference);
  const valid =
    references.length === required.length &&
    missing.length === 0 &&
    extra.length === 0 &&
    duplicate.length === 0;

  return {
    valid,
    references,
    missing,
    extra,
    duplicate,
    message: valid
      ? "Runway reference rule passed: exactly @animalA, @animalB, and @environment."
      : "Runway reference rule failed: use exactly @animalA, @animalB, and @environment only.",
  };
}

function buildFailureFixLine(failure: string, brain: ContinuityBrain): string {
  switch (failure) {
    case "animal not chasing":
      return `Make the pressure relationship readable: ${brain.animalB.label} increases visible pressure toward ${brain.animalA.label} without role swapping or fantasy behavior.`;
    case "wrong habitat":
      return `Preserve habitat exactly: ${brain.environment.habitat}; keep the same terrain, background depth, season, and time-of-day continuity.`;
    case "identity drift":
      return `Lock identity: keep ${brain.animalA.label} as @animalA and ${brain.animalB.label} as @animalB with the same markings, scale, body shape, coat/feather detail, and silhouette.`;
    case "extra limbs":
      return "Stabilize anatomy: correct limb count, grounded feet, clean silhouettes, no fused bodies, no duplicated paws, legs, horns, tails, or distorted joints.";
    case "bad camera":
      return `Repair camera: use ${brain.cameraLensLock.join("; ")}; keep one controlled documentary camera move and no chaotic swing.`;
    case "crop issue":
      return "Repair framing: both animals stay full-body readable with safe margins around head, feet, tail, horns, paws, and hooves.";
    case "weak motion":
      return "Strengthen motion: use one dominant readable movement beat with clear pursuit or escape pressure, grounded weight transfer, and no extra actions.";
    case "excessive dust":
      return "Keep air clear: no dust clouds, no dirt spray, no debris burst, and no atmosphere that hides animal bodies or the action lane.";
    case "wrong spacing":
      return `Repair spacing: preserve the open action lane; ${brain.animalA.label} remains on the ${brain.animalA.placement} side and ${brain.animalB.label} remains on the ${brain.animalB.placement} side unless the shot memory explicitly moves them.`;
    case "unreadable framing":
      return "Repair readability: simplify to one clear action lane, readable silhouettes, grounded bodies, and no overlapping chaos at the frame edge.";
    default:
      return `Apply targeted continuity correction for "${failure}" without changing unrelated prompt sections.`;
  }
}

export function buildContinuityRepairPrompt({
  basePrompt,
  brain,
  selectedFailures,
  targetEngine = "all",
}: ContinuityRepairPromptInput): ContinuityRepairPromptResult {
  const originalPrompt = String(basePrompt ?? "").trim();
  const selected = selectedFailures
    .map((failure) => failure.trim())
    .filter((failure) => failure && brain.repairFailureOptions.includes(failure));

  if (!selected.length) {
    return {
      correctedPrompt: originalPrompt,
      repairSummary:
        "No repair issues selected. Original prompt preserved with no continuity repair applied.",
      appliedFixes: [],
    };
  }

  const appliedFixes = selected.map((failure) => buildFailureFixLine(failure, brain));
  const engineRules = targetEngine === "all"
    ? [
        ...brain.engineRules.nanoBanana2,
        ...brain.engineRules.gptImage2,
        ...brain.engineRules.kling,
        ...brain.engineRules.runway,
        ...brain.engineRules.seedance,
      ]
    : brain.engineRules[targetEngine];
  const repairSummary = `Targeted local repair for: ${selected.join(", ")}. Original prompt remains intact; only corrective constraints are appended.`;
  const correctedPrompt = [
    originalPrompt,
    "",
    "WSTV TARGETED REPAIR PASS",
    repairSummary,
    `Target engine: ${targetEngine}`,
    "Preserve original scene, animals, habitat, lighting, shot structure, and edit intent.",
    `Preserve subjects: ${brain.animalA.label} as @animalA; ${brain.animalB.label} as @animalB.`,
    `Preserve environment: ${brain.environment.habitat}.`,
    "Applied fixes:",
    ...appliedFixes.map((fix) => `- ${fix}`),
    "Engine-specific guardrails:",
    ...engineRules.map((rule) => `- ${rule}`),
    "Negative constraints:",
    ...brain.globalNegativeRules.map((rule) => `- ${rule}`),
  ]
    .filter(Boolean)
    .join("\n");

  return {
    correctedPrompt,
    repairSummary,
    appliedFixes,
  };
}
export function buildContinuityRepairInstruction(
  brain: ContinuityBrain,
  failures: string[],
  basePrompt: string
): string {
  const selected = failures
    .map((failure) => failure.trim())
    .filter((failure) => failure && brain.repairFailureOptions.includes(failure));
  const fixes = selected.length ? selected : ["identity drift", "wrong spacing", "unreadable framing"];

  return [
    basePrompt.trim(),
    "Targeted repair only. Do not rewrite unrelated prompt sections.",
    `Preserve ${brain.animalA.label} as @animalA and ${brain.animalB.label} as @animalB.`,
    `Preserve environment: ${brain.environment.habitat}.`,
    `Fix selected issues: ${fixes.join(", ")}.`,
    `Do not violate: ${brain.globalNegativeRules.join("; ")}.`,
  ]
    .filter(Boolean)
    .join(" ");
}
