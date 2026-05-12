import type {
  GeneratedPackage,
  ModelSpecificPromptGuidanceInfo,
  PrimaryVideoRouteInfo,
  StructuredPrompt,
} from "@/types";

type VideoPromptEngine = "runway" | "kling" | "seedance";

const RUNWAY_NATIVE_NOTE =
  "Runway native I2V guidance: use image-to-video with the reference image carrying animal identity; write motion, camera, physics, spacing, grounded contact, and first-frame clarity only; keep negative prompts out of the Runway body.";

const SEEDANCE_FAST_ACTION_NOTE =
  "Seedance 2 fast-action guidance: use short clear shot beats, motion continuity, subject readability, viral retention, and one cinematic action beat; keep the scene non-graphic with no blood, gore, or visible injury.";

const RUNWAY_THIRD_PARTY_NOTE =
  "Runway third-party setup: select the third-party model route when available, keep the first frame readable, and emphasize realistic animal body mechanics, grounded contact, spacing, and controlled action pressure.";

const ALEPH_EDIT_NOTE =
  "Aleph existing-footage edit route: use this route only when you already have source footage to transform. Describe editing and manipulation intent while preserving source animal identities, habitat, lighting, timing, and species continuity.";

const DIRECT_KLING_NOTE =
  "Direct Kling guidance: use director-style action wording, one clear action beat per shot, realistic animal body mechanics, grounded contact, clean spacing, and readable pressure without graphic impact.";

const HYBRID_NOTE =
  "Hybrid protection: keep the existing Hybrid 4-shot Runway + Kling route primary. Treat the selected model as saved preference and guidance unless the workflow is changed away from Hybrid.";

function selectedLabel(route: PrimaryVideoRouteInfo | undefined): string {
  return route?.selectedVideoModel?.label ?? "Default WSTV video model";
}

export function buildModelSpecificPromptGuidance(
  route: PrimaryVideoRouteInfo | undefined
): ModelSpecificPromptGuidanceInfo {
  const selectedModel = selectedLabel(route);
  const primaryRoute = route?.label ?? "Primary Route: Hybrid 4-shot";

  if (!route || route.kind === "hybrid") {
    return {
      selectedModel,
      primaryRoute,
      bestUse: "Hybrid 4-shot remains best for the current WSTV Runway + Kling production workflow.",
      copyTip: "Copy the Hybrid 4-Shot Paste Pack first; use selected-model guidance only as preference.",
      promptNote: HYBRID_NOTE,
    };
  }

  if (route.kind === "seedance-direct") {
    return {
      selectedModel,
      primaryRoute,
      bestUse: "Fast chase/action pacing, compact shot beats, and high-retention motion.",
      copyTip: "Start with Copy All Seedance Prompts; keep each beat short and motion-led.",
      promptNote: SEEDANCE_FAST_ACTION_NOTE,
    };
  }

  if (route.kind === "runway-third-party") {
    return {
      selectedModel,
      primaryRoute,
      bestUse: "Third-party route for identity-locked action, grounded mechanics, and stronger animal pressure.",
      copyTip: "Use the Runway workspace and select the matching third-party route before pasting.",
      promptNote: RUNWAY_THIRD_PARTY_NOTE,
    };
  }

  if (route.kind === "aleph-edit") {
    return {
      selectedModel,
      primaryRoute,
      bestUse: "Existing-footage transformation, repair, or controlled edit/manipulation.",
      copyTip: "Use only with source footage; paste the edit intent after choosing the source clip.",
      promptNote: ALEPH_EDIT_NOTE,
      sourceFootageRequired: true,
    };
  }

  if (route.kind === "kling-direct") {
    return {
      selectedModel,
      primaryRoute,
      bestUse: "Direct Kling pressure, action readability, and realistic animal body mechanics.",
      copyTip: "Start with Copy All Kling Prompts; keep one dominant action beat per shot.",
      promptNote: DIRECT_KLING_NOTE,
    };
  }

  return {
    selectedModel,
    primaryRoute,
    bestUse: route.selectedVideoModel?.recommendedUse ?? "Runway native cinematic wildlife I2V shots.",
    copyTip: "Start with Copy All Runway I2V; keep the prompt motion-focused because references carry identity.",
    promptNote: RUNWAY_NATIVE_NOTE,
  };
}

function targetEngineForRoute(
  route: PrimaryVideoRouteInfo | undefined
): VideoPromptEngine | undefined {
  if (!route || route.kind === "hybrid") return undefined;
  if (route.kind === "seedance-direct") return "seedance";
  if (route.kind === "kling-direct") return "kling";
  return "runway";
}

function shouldAdapt(
  route: PrimaryVideoRouteInfo | undefined,
  engine: VideoPromptEngine
): boolean {
  return targetEngineForRoute(route) === engine;
}

function prefixForPrompt(route: PrimaryVideoRouteInfo, guidance: ModelSpecificPromptGuidanceInfo): string {
  const lines = [
    `Selected model: ${guidance.selectedModel}.`,
    `${guidance.primaryRoute}.`,
    guidance.promptNote,
  ];

  if (route.kind === "runway-native") {
    lines.push("Runway settings guidance: I2V, reference image active, 24/25fps project base, no negative prompt in the Runway paste body, upgrade final hero renders after test passes.");
  }

  if (route.kind === "aleph-edit") {
    lines.push("Required source-footage note: use this route only when source footage already exists; do not treat this as a standard first-pass I2V generation prompt.");
  }

  return lines.join("\n");
}

export function adaptStructuredPromptForSelectedVideoRoute(
  prompt: StructuredPrompt,
  route: PrimaryVideoRouteInfo | undefined,
  engine: VideoPromptEngine
): StructuredPrompt {
  if (!route || !shouldAdapt(route, engine)) return prompt;
  if (prompt.pasteReady.trimStart().startsWith("Selected model:")) return prompt;

  const guidance = buildModelSpecificPromptGuidance(route);
  const prefix = prefixForPrompt(route, guidance);
  const settings = [
    `Selected model: ${guidance.selectedModel}`,
    guidance.primaryRoute,
    guidance.copyTip,
    ...(prompt.settings ?? []),
  ];

  return {
    ...prompt,
    fullText: `${prefix}\n\n${prompt.fullText}`,
    pasteReady: `${prefix}\n\n${prompt.pasteReady}`,
    settings,
    metadata: {
      ...prompt.metadata,
      workflowRole: route.kind,
    },
  };
}

export function adaptPromptListForSelectedVideoRoute(
  prompts: StructuredPrompt[],
  route: PrimaryVideoRouteInfo | undefined,
  engine: VideoPromptEngine
): StructuredPrompt[] {
  return prompts.map((prompt) =>
    adaptStructuredPromptForSelectedVideoRoute(prompt, route, engine)
  );
}


export function adaptGeneratedVideoPromptsForSelectedRoute(
  pkg: GeneratedPackage,
  route: PrimaryVideoRouteInfo | undefined
): GeneratedPackage {
  if (!pkg.structuredPrompts) return pkg;

  const runwayShots = adaptPromptListForSelectedVideoRoute(
    pkg.structuredPrompts.runwayShots ?? [],
    route,
    "runway"
  );
  const klingShots = adaptPromptListForSelectedVideoRoute(
    pkg.structuredPrompts.klingShots ?? [],
    route,
    "kling"
  );
  const seedanceShots = adaptPromptListForSelectedVideoRoute(
    pkg.structuredPrompts.seedanceShots ?? [],
    route,
    "seedance"
  );
  const seedanceMultiShot = pkg.structuredPrompts.seedanceMultiShot
    ? adaptStructuredPromptForSelectedVideoRoute(
        pkg.structuredPrompts.seedanceMultiShot,
        route,
        "seedance"
      )
    : undefined;

  pkg.structuredPrompts = {
    ...pkg.structuredPrompts,
    runwayShots,
    klingShots,
    seedanceShots,
    seedanceMultiShot,
  };
  pkg.runwayShots = runwayShots.map((prompt) => prompt.fullText);
  pkg.klingShots = klingShots.map((prompt) => prompt.fullText);
  pkg.seedanceShots = seedanceShots.map((prompt) => prompt.fullText);
  if (seedanceMultiShot) {
    pkg.seedanceMultiShotPrompt = seedanceMultiShot.fullText;
  }
  pkg.runwayBundle = runwayShots.map((prompt) => prompt.fullText).join("\n\n---\n\n");
  pkg.klingBundle = klingShots.map((prompt) => prompt.fullText).join("\n\n---\n\n");

  return pkg;
}
