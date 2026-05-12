import type {
  GeneratedPackage,
  ModelSpecificPromptGuidanceInfo,
  PrimaryVideoRouteInfo,
  StructuredPrompt,
} from "@/types";

export type RouteAwareCopyAction = {
  id: string;
  label: string;
  helper: string;
  text: string;
  primary?: boolean;
};

const COPY_SEPARATOR = "\n\n---\n\n";

function clean(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map((item) => String(item ?? "").trim()).filter(Boolean).join("\n").trim();
  return String(value ?? "").trim();
}

function joinPromptBodies(prompts: Array<StructuredPrompt | undefined>): string {
  return prompts
    .map((prompt) => clean(prompt?.pasteReady || prompt?.fullText))
    .filter(Boolean)
    .join(COPY_SEPARATOR);
}

function firstPromptBody(prompts: Array<StructuredPrompt | undefined>): string {
  return clean(prompts.find((prompt) => clean(prompt?.pasteReady || prompt?.fullText))?.pasteReady ?? prompts.find(Boolean)?.fullText);
}

function legacyJoin(values: Array<string | undefined>): string {
  return values.map(clean).filter(Boolean).join(COPY_SEPARATOR);
}

function selectedModelLabel(
  route: PrimaryVideoRouteInfo | undefined,
  guidance: ModelSpecificPromptGuidanceInfo | undefined
): string {
  return clean(guidance?.selectedModel) || route?.selectedVideoModel?.label || "Default WSTV video model";
}

function primaryRouteLabel(
  route: PrimaryVideoRouteInfo | undefined,
  guidance: ModelSpecificPromptGuidanceInfo | undefined
): string {
  return clean(guidance?.primaryRoute) || route?.label || "Primary Route: Hybrid 4-shot";
}

function buildHeader(input: {
  route?: PrimaryVideoRouteInfo;
  guidance?: ModelSpecificPromptGuidanceInfo;
}): string {
  const lines = [
    `Selected Model: ${selectedModelLabel(input.route, input.guidance)}`,
    `Primary Route: ${primaryRouteLabel(input.route, input.guidance).replace(/^Primary Route:\s*/i, "")}`,
  ];

  if (input.guidance?.bestUse) lines.push(`Best Use: ${input.guidance.bestUse}`);
  if (input.guidance?.copyTip) lines.push(`Copy Tip: ${input.guidance.copyTip}`);
  if (input.guidance?.promptNote) lines.push(`Model Guidance: ${input.guidance.promptNote}`);

  return lines.join("\n");
}

export function buildRouteCopyText(input: {
  pkg: GeneratedPackage;
  route?: PrimaryVideoRouteInfo;
  guidance?: ModelSpecificPromptGuidanceInfo;
  title: string;
  promptText?: string;
  settings?: string[];
  note?: string;
}): string {
  const parts = [
    input.title,
    buildHeader({ route: input.route, guidance: input.guidance }),
    input.note ? `Route Note: ${input.note}` : "",
    input.settings?.length ? `Settings:\n${input.settings.map((item) => `- ${item}`).join("\n")}` : "",
    input.promptText ? `Paste-Ready Copy:\n${input.promptText}` : "",
  ].filter(Boolean);

  return parts.join("\n\n").trim();
}

export function getCopyButtonLabelForRoute(
  route: PrimaryVideoRouteInfo | undefined,
  action: "package" | "primary" | "settings" | "secondary" | "note"
): string {
  if (!route || route.kind === "hybrid") {
    if (action === "package") return "Copy Hybrid Package";
    if (action === "primary") return "Copy Runway Shot";
    return "Copy Kling Shot";
  }

  if (route.kind === "seedance-direct") {
    return action === "package" ? "Copy Seedance Shot Bundle" : "Copy Seedance 2 Prompt";
  }

  if (route.kind === "kling-direct") {
    return action === "settings" ? "Copy Kling Settings" : "Copy Kling Prompt";
  }

  if (route.kind === "runway-third-party") {
    if (action === "package") return "Copy Runway Third-Party Route";
    return route.selectedVideoModel?.id === "kling-3-0-motion-control"
      ? "Copy Motion Control Setup"
      : "Copy Kling 03 4K Prompt";
  }

  if (route.kind === "aleph-edit") {
    return action === "note" ? "Copy Source Footage Note" : "Copy Aleph Edit Prompt";
  }

  return action === "settings" ? "Copy Runway Settings" : "Copy Runway Native Prompt";
}

function workflowPromptByEngine(pkg: GeneratedPackage, engine: "runway" | "kling"): string {
  const structured = pkg.structuredPrompts?.workflowShots ?? [];
  const prompt = structured.find((item) => item.metadata?.engine === engine);
  if (prompt) return clean(prompt.pasteReady || prompt.fullText);

  const shot = (pkg.shotPlan ?? []).find((item) =>
    engine === "runway" ? item.engine === "RUNWAY" : item.engine !== "RUNWAY"
  );
  return clean(shot?.prompt);
}

function runwaySettings(pkg: GeneratedPackage): string[] {
  const prompt = pkg.structuredPrompts?.runwayShots?.[0];
  return [
    ...(prompt?.settings ?? []),
    "Runway native I2V: paste motion body only; keep negative prompt separate or absent.",
    "Use the prepared reference image for identity, scale, anatomy, and first-frame clarity.",
  ];
}

function klingSettings(pkg: GeneratedPackage): string[] {
  const prompt = pkg.structuredPrompts?.klingShots?.[0];
  return [
    ...(prompt?.settings ?? []),
    "Direct Kling: director-style action prompt, one dominant action beat, readable spacing.",
    "Negative prompt allowed when kept as a clear final block.",
  ];
}

function addAction(
  actions: RouteAwareCopyAction[],
  action: RouteAwareCopyAction
): void {
  if (clean(action.text)) actions.push(action);
}

export function getRouteAwareCopyActions(pkg: GeneratedPackage): RouteAwareCopyAction[] {
  const route = pkg.primaryVideoRoute;
  const guidance = pkg.modelPromptGuidance;
  const actions: RouteAwareCopyAction[] = [];

  const workflowPackage =
    joinPromptBodies(pkg.structuredPrompts?.workflowShots ?? []) ||
    legacyJoin((pkg.shotPlan ?? []).map((shot) => shot.prompt));
  const runwayPrompt =
    firstPromptBody(pkg.structuredPrompts?.runwayShots ?? []) ||
    clean(pkg.runwayShots?.[0]) ||
    clean(pkg.runwayBundle);
  const runwayBundle =
    joinPromptBodies(pkg.structuredPrompts?.runwayShots ?? []) || clean(pkg.runwayBundle);
  const klingPrompt =
    firstPromptBody(pkg.structuredPrompts?.klingShots ?? []) ||
    clean(pkg.klingShots?.[0]) ||
    clean(pkg.klingBundle);
  const klingBundle =
    joinPromptBodies(pkg.structuredPrompts?.klingShots ?? []) || clean(pkg.klingBundle);
  const seedancePrompt =
    firstPromptBody(pkg.structuredPrompts?.seedanceShots ?? []) ||
    clean(pkg.seedanceShots?.[0]) ||
    clean(pkg.seedanceMultiShotPrompt);
  const seedanceBundle =
    joinPromptBodies(pkg.structuredPrompts?.seedanceShots ?? []) ||
    clean(pkg.structuredPrompts?.seedanceMultiShot?.pasteReady) ||
    legacyJoin([...(pkg.seedanceShots ?? []), pkg.seedanceMultiShotPrompt]);

  if (!route || route.kind === "hybrid") {
    addAction(actions, {
      id: "copy-hybrid-package",
      label: getCopyButtonLabelForRoute(route, "package"),
      helper: "Copies the primary Hybrid 4-shot package in shot order.",
      primary: true,
      text: buildRouteCopyText({
        pkg,
        route,
        guidance,
        title: "Hybrid 4-Shot Package",
        promptText: workflowPackage,
        note: "Hybrid remains primary; selected model is guidance only.",
      }),
    });
    addAction(actions, {
      id: "copy-hybrid-runway-shot",
      label: getCopyButtonLabelForRoute(route, "primary"),
      helper: "Copies the first Hybrid Runway shot body.",
      text: buildRouteCopyText({
        pkg,
        route,
        guidance,
        title: "Hybrid Runway Shot",
        promptText: workflowPromptByEngine(pkg, "runway") || runwayPrompt,
      }),
    });
    addAction(actions, {
      id: "copy-hybrid-kling-shot",
      label: getCopyButtonLabelForRoute(route, "secondary"),
      helper: "Copies the first Hybrid Kling shot body.",
      text: buildRouteCopyText({
        pkg,
        route,
        guidance,
        title: "Hybrid Kling Shot",
        promptText: workflowPromptByEngine(pkg, "kling") || klingPrompt,
      }),
    });
    return actions;
  }

  if (route.kind === "seedance-direct") {
    addAction(actions, {
      id: "copy-seedance-2-prompt",
      label: getCopyButtonLabelForRoute(route, "primary"),
      helper: "Copies the primary Seedance 2 paste-ready prompt.",
      primary: true,
      text: buildRouteCopyText({ pkg, route, guidance, title: "Seedance 2 Prompt", promptText: seedancePrompt }),
    });
    addAction(actions, {
      id: "copy-seedance-shot-bundle",
      label: getCopyButtonLabelForRoute(route, "package"),
      helper: "Copies all Seedance shot prompts as a compact bundle.",
      text: buildRouteCopyText({ pkg, route, guidance, title: "Seedance 2 Shot Bundle", promptText: seedanceBundle }),
    });
    return actions;
  }

  if (route.kind === "kling-direct") {
    addAction(actions, {
      id: "copy-kling-prompt",
      label: getCopyButtonLabelForRoute(route, "primary"),
      helper: "Copies the primary Direct Kling paste-ready prompt.",
      primary: true,
      text: buildRouteCopyText({ pkg, route, guidance, title: "Direct Kling Prompt", promptText: klingPrompt }),
    });
    addAction(actions, {
      id: "copy-kling-settings",
      label: getCopyButtonLabelForRoute(route, "settings"),
      helper: "Copies the Direct Kling setup notes without removing existing bundles.",
      text: buildRouteCopyText({ pkg, route, guidance, title: "Direct Kling Settings", settings: klingSettings(pkg), promptText: klingBundle }),
    });
    return actions;
  }

  if (route.kind === "runway-third-party") {
    const thirdPartyNote = route.selectedVideoModel?.id === "kling-3-0-motion-control"
      ? "Runway third-party setup: choose the Motion Control route when available; prioritize controlled identity-locked motion, grounded contact, spacing, and first-frame clarity."
      : "Runway third-party setup: choose the Kling 03 4K route when available; prioritize final-quality grounded animal action and readable first-frame spacing.";
    addAction(actions, {
      id: "copy-runway-third-party-route",
      label: getCopyButtonLabelForRoute(route, "package"),
      helper: "Copies the Runway third-party route note with the selected model context.",
      primary: true,
      text: buildRouteCopyText({ pkg, route, guidance, title: "Runway Third-Party Route", promptText: runwayPrompt, note: thirdPartyNote }),
    });
    addAction(actions, {
      id: route.selectedVideoModel?.id === "kling-3-0-motion-control" ? "copy-motion-control-setup" : "copy-kling-03-4k-prompt",
      label: getCopyButtonLabelForRoute(route, "primary"),
      helper: "Copies the selected third-party model setup plus the matching Runway prompt body.",
      text: buildRouteCopyText({ pkg, route, guidance, title: getCopyButtonLabelForRoute(route, "primary"), promptText: runwayPrompt, settings: runwaySettings(pkg), note: thirdPartyNote }),
    });
    return actions;
  }

  if (route.kind === "aleph-edit") {
    const sourceFootageNote = "Source footage required: use this route only when you already have footage to transform; describe edit/manipulation intent while preserving animal identities, habitat, lighting, timing, and species continuity.";
    addAction(actions, {
      id: "copy-aleph-edit-prompt",
      label: getCopyButtonLabelForRoute(route, "primary"),
      helper: "Copies Aleph edit intent with source-footage requirement.",
      primary: true,
      text: buildRouteCopyText({ pkg, route, guidance, title: "Aleph Edit Prompt", promptText: runwayPrompt, note: sourceFootageNote }),
    });
    addAction(actions, {
      id: "copy-source-footage-note",
      label: getCopyButtonLabelForRoute(route, "note"),
      helper: "Copies only the Aleph source-footage requirement.",
      text: buildRouteCopyText({ pkg, route, guidance, title: "Aleph Source Footage Note", note: sourceFootageNote }),
    });
    return actions;
  }

  addAction(actions, {
    id: "copy-runway-native-prompt",
    label: getCopyButtonLabelForRoute(route, "primary"),
    helper: "Copies the primary Runway native I2V motion prompt.",
    primary: true,
    text: buildRouteCopyText({ pkg, route, guidance, title: "Runway Native Prompt", promptText: runwayPrompt }),
  });
  addAction(actions, {
    id: "copy-runway-settings",
    label: getCopyButtonLabelForRoute(route, "settings"),
    helper: "Copies Runway native settings guidance for the selected model.",
    text: buildRouteCopyText({ pkg, route, guidance, title: "Runway Native Settings", settings: runwaySettings(pkg), promptText: runwayBundle }),
  });
  return actions;
}
