import type { GeneratedPackage } from "@/types";

export type WorkflowQaStatus = "Ready" | "Needs review" | "Risky";

export type WorkflowQaItem = {
  label: string;
  status: "pass" | "warning" | "fail";
  detail: string;
};

export type WorkflowQaSummary = {
  status: WorkflowQaStatus;
  score: number;
  items: WorkflowQaItem[];
  topFixes: string[];
};

export type WorkflowQaInput = {
  predator: string;
  prey: string;
  arc: string;
  contentLane: string;
  habitat: string;
  weather: string;
  depthMode: string;
  cameraAnglePreset: string;
  emotionalTone: string;
  animalVibe: string;
  finalEnvironment: string;
  sceneDescription: string;
  pkg: GeneratedPackage | null;
};

function safeText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map(String).join("\n").trim();
  return String(value ?? "").trim();
}

function buildSceneItem(input: WorkflowQaInput): {
  score: number;
  item: WorkflowQaItem;
  fix: string | null;
} {
  let score = 72;
  const habitat = safeText(input.habitat);
  const weather = safeText(input.weather);
  const depthMode = safeText(input.depthMode);
  const camera = safeText(input.cameraAnglePreset);
  const tone = safeText(input.emotionalTone);
  const vibe = safeText(input.animalVibe);
  const environment = safeText(input.finalEnvironment);

  if (/^auto$/i.test(habitat)) score += 8;
  if (/golden hour|dawn/i.test(weather)) score += 6;
  if (/balanced depth/i.test(depthMode)) score += 4;
  if (/front full-body|^auto$/i.test(camera)) score += 4;
  if (environment.length > 20) score += 4;
  if (/raw tension|calm dominance/i.test(tone)) score += 2;
  if (/national geographic|bbc earth/i.test(vibe)) score += 2;
  if (!environment) score -= 15;
  if (!/^auto$/i.test(habitat) && environment.length < 18) score -= 10;

  if (score >= 82) {
    return {
      score,
      item: {
        label: "Scene setup",
        status: "pass",
        detail: "Scene inputs look compatible for a clear first generation.",
      },
      fix: null,
    };
  }

  return {
    score,
    item: {
      label: "Scene setup",
      status: score >= 60 ? "warning" : "fail",
      detail:
        "Scene inputs can work, but the habitat, framing, or environment setup is not yet clean enough for a confident first pass.",
    },
    fix: "Use Auto or a clearer habitat/camera pairing before exporting the final pack.",
  };
}

function buildPromptItem(input: WorkflowQaInput): {
  score: number;
  item: WorkflowQaItem;
  fix: string | null;
} {
  const prompt = safeText(input.sceneDescription);
  const lower = prompt.toLowerCase();
  let score = 86;

  const negativeHits =
    lower.match(/\b(no |without |avoid |do not |don't |never )/g)?.length ?? 0;
  const hasCamera = /(camera|push-?in|handheld|locked|dolly|pan|zoom|tracking)/i.test(
    prompt
  );
  const hasAction = /(moves?|surges?|runs?|reacts?|lunges?|steps?|turns?|charges?|bursts?|pulls?|drags?)/i.test(
    prompt
  );
  const hasMultiShot = /(shot 1|shot 2|0-3s|3-6s|cut to)/i.test(prompt);

  score -= Math.min(negativeHits * 8, 24);
  if (!hasCamera) score -= 15;
  if (!hasAction) score -= 15;
  if (hasMultiShot) score -= 20;
  if (prompt.length > 700) score -= 18;
  else if (prompt.length > 420) score -= 10;
  if (hasCamera && hasAction && !hasMultiShot) score += 4;

  if (score >= 82) {
    return {
      score,
      item: {
        label: "Prompt health",
        status: "pass",
        detail: "Scene description is compact enough for a clean one-scene wildlife handoff.",
      },
      fix: null,
    };
  }

  return {
    score,
    item: {
      label: "Prompt health",
      status: score >= 60 ? "warning" : "fail",
      detail:
        "Scene description needs a cleaner camera/action lane or less conflicting instruction text.",
    },
    fix: "Simplify the scene description to one camera cue, one action lane, and positive motion wording.",
  };
}

function buildOutputItems(input: WorkflowQaInput): {
  score: number;
  outputItem: WorkflowQaItem;
  exportItem: WorkflowQaItem;
  safetyItem: WorkflowQaItem;
  fixes: string[];
} {
  const pkg = input.pkg;
  const outputText = [
    safeText(pkg?.imagePrompt),
    safeText(pkg?.runwayShots),
    safeText(pkg?.klingShots),
    safeText(pkg?.seedanceShots),
    safeText(pkg?.caption),
    safeText(pkg?.hashtags),
    safeText(pkg?.negativePrompt),
  ]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();

  let score = 84;
  const hasIdentity =
    outputText.includes(input.predator.toLowerCase()) &&
    outputText.includes(input.prey.toLowerCase());
  const hasEngine = Boolean(
    pkg && ((pkg.runwayShots?.length ?? 0) || (pkg.klingShots?.length ?? 0) || (pkg.seedanceShots?.length ?? 0))
  );
  const hasCaption = Boolean(safeText(pkg?.caption));
  const hasHashtags = Boolean(safeText(pkg?.hashtags));
  const hasSafety = /(no blood|no gore|no visible wounds|clean anatomy|documentary survival tension)/i.test(
    outputText
  );

  if (!hasIdentity) score -= 20;
  if (!hasEngine) score -= 30;
  if (!hasCaption || !hasHashtags) score -= 12;
  if (!hasSafety) score -= 15;

  const outputItem: WorkflowQaItem = {
    label: "Output readiness",
    status: hasIdentity && hasEngine ? "pass" : hasEngine ? "warning" : "fail",
    detail:
      hasIdentity && hasEngine
        ? "Generated output includes named animals and engine-ready prompt sections."
        : hasEngine
          ? "Output exists, but the identity or supporting details still need review."
          : "Engine-ready prompt sections are missing from the generated output.",
  };

  const exportItem: WorkflowQaItem = {
    label: "Copy/export readiness",
    status: hasCaption && hasHashtags && hasEngine ? "pass" : hasEngine ? "warning" : "fail",
    detail:
      hasCaption && hasHashtags && hasEngine
        ? "Copy and export surfaces have the core prompt and social fields they need."
        : "Caption, hashtags, or engine prompt sections need another pass before export.",
  };

  const safetyItem: WorkflowQaItem = {
    label: "Safety wording",
    status: hasSafety ? "pass" : "warning",
    detail: hasSafety
      ? "Non-graphic safety wording is present in the current output."
      : "Safety wording is thin or missing in the current output pack.",
  };

  const fixes: string[] = [];
  if (!hasEngine) fixes.push("Generate the output pack before doing a final review.");
  if (!hasIdentity) fixes.push("Make sure both animal names appear clearly in the final prompts.");
  if (!hasCaption || !hasHashtags) fixes.push("Regenerate caption and hashtags before exporting.");
  if (!hasSafety) fixes.push("Add concise non-graphic safety wording before copy/export.");

  return { score, outputItem, exportItem, safetyItem, fixes };
}

export function buildWorkflowQaSummary(
  input: WorkflowQaInput
): WorkflowQaSummary {
  const scene = buildSceneItem(input);
  const prompt = buildPromptItem(input);
  const output = buildOutputItems(input);
  const score = Math.max(
    0,
    Math.min(100, Math.round((scene.score + prompt.score + output.score) / 3))
  );

  const items = [
    scene.item,
    prompt.item,
    output.outputItem,
    output.exportItem,
    output.safetyItem,
  ];

  const failCount = items.filter((item) => item.status === "fail").length;
  const warningCount = items.filter((item) => item.status === "warning").length;
  const status: WorkflowQaStatus =
    failCount > 0 || score < 60
      ? "Risky"
      : warningCount > 0 || score < 82
        ? "Needs review"
        : "Ready";

  const topFixes = [
    scene.fix,
    prompt.fix,
    ...output.fixes,
  ]
    .filter((value): value is string => Boolean(value))
    .slice(0, 3);

  return {
    status,
    score,
    items,
    topFixes,
  };
}
