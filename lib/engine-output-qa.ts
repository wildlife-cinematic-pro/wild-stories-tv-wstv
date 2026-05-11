import type { GeneratedPackage, StructuredPrompt } from "@/types";

export type EngineOutputQaOverall = "ready" | "caution" | "needs-review";
export type EngineOutputQaStatus = "pass" | "caution" | "fail";
export type EngineOutputQaEngineId = "runway" | "kling" | "seedance";

export type EngineOutputQaCheck = {
  id: string;
  label: string;
  status: EngineOutputQaStatus;
  detail: string;
};

export type EngineOutputQaEngine = {
  engine: EngineOutputQaEngineId;
  label: string;
  score: number;
  status: EngineOutputQaStatus;
  checks: EngineOutputQaCheck[];
};

export type EngineOutputQaReport = {
  overall: EngineOutputQaOverall;
  engines: EngineOutputQaEngine[];
};

function safeText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map(String).join("\n").trim();
  return String(value ?? "").trim();
}

function promptBodies(prompts: Array<StructuredPrompt | undefined>): string[] {
  return prompts.map((prompt) => safeText(prompt?.pasteReady)).filter(Boolean);
}

function fallbackBodies(values: unknown[]): string[] {
  return values.map(safeText).filter(Boolean);
}

function workflowPrompts(
  pkg: GeneratedPackage,
  engine: EngineOutputQaEngineId
): StructuredPrompt[] {
  return (pkg.structuredPrompts?.workflowShots ?? []).filter(
    (prompt) => prompt.metadata?.engine === engine
  );
}

function enginePasteReady(
  pkg: GeneratedPackage,
  engine: EngineOutputQaEngineId
): string[] {
  if (engine === "runway") {
    return promptBodies([
      ...(pkg.structuredPrompts?.runwayShots ?? []),
      ...workflowPrompts(pkg, "runway"),
    ]);
  }

  if (engine === "kling") {
    return promptBodies([
      ...(pkg.structuredPrompts?.klingShots ?? []),
      pkg.structuredPrompts?.klingNative15s,
      pkg.structuredPrompts?.klingFramesPrompt,
      ...(pkg.structuredPrompts?.klingMultishotShots ?? []),
      pkg.structuredPrompts?.klingSixShot,
      ...workflowPrompts(pkg, "kling"),
    ]);
  }

  return promptBodies([
    ...(pkg.structuredPrompts?.seedanceShots ?? []),
    pkg.structuredPrompts?.seedanceMultiShot,
    ...workflowPrompts(pkg, "seedance"),
  ]);
}

function engineFallback(pkg: GeneratedPackage, engine: EngineOutputQaEngineId): string[] {
  if (engine === "runway") return fallbackBodies(pkg.runwayShots ?? []);
  if (engine === "kling") {
    return fallbackBodies([
      ...(pkg.klingShots ?? []),
      pkg.klingNative15s,
      pkg.klingFramesPrompt,
      ...(pkg.klingMultishotShots ?? []),
      pkg.klingSixShot,
    ]);
  }
  return fallbackBodies([...(pkg.seedanceShots ?? []), pkg.seedanceMultiShotPrompt]);
}

function engineBodies(pkg: GeneratedPackage, engine: EngineOutputQaEngineId): string[] {
  const pasteReady = enginePasteReady(pkg, engine);
  return pasteReady.length ? pasteReady : engineFallback(pkg, engine);
}

function statusScore(status: EngineOutputQaStatus): number {
  if (status === "pass") return 100;
  if (status === "caution") return 65;
  return 25;
}

function buildEngineStatus(checks: EngineOutputQaCheck[]): EngineOutputQaStatus {
  if (checks.some((check) => check.status === "fail")) return "fail";
  if (checks.some((check) => check.status === "caution")) return "caution";
  return "pass";
}

function buildEngineScore(checks: EngineOutputQaCheck[]): number {
  return Math.round(
    checks.reduce((sum, check) => sum + statusScore(check.status), 0) /
      checks.length
  );
}

function makeEngine(
  engine: EngineOutputQaEngineId,
  label: string,
  checks: EngineOutputQaCheck[]
): EngineOutputQaEngine {
  return {
    engine,
    label,
    checks,
    status: buildEngineStatus(checks),
    score: buildEngineScore(checks),
  };
}

function maxLength(bodies: string[]): number {
  return Math.max(0, ...bodies.map((body) => body.length));
}

function joined(bodies: string[]): string {
  return bodies.join("\n\n");
}

function countReferenceTokens(text: string): number {
  return new Set(
    Array.from(text.matchAll(/@[a-z][a-z0-9_-]*/gi)).map((match) =>
      match[0].toLowerCase()
    )
  ).size;
}

function containsImagePromptWording(text: string): boolean {
  return /\b(?:create (?:an? )?image|generate (?:an? )?image|photorealistic master frame|master still|image prompt|aspect ratio)\b/i.test(
    text
  );
}

function containsMotionWording(text: string): boolean {
  return /\b(?:motion|moves?|movement|camera|push[-\s]?in|pan|tracking|handheld|glide|tilt|orbit|slow|surges?|circles?|holds?|steps?|turns?|runs?|dives?)\b/i.test(
    text
  );
}

function hasUnsafeVisualWording(text: string): boolean {
  const normalized = text
    .toLowerCase()
    .replace(/\b(?:no|without|avoid|avoids|avoiding)\s+(?:blood|gore|gory|bleeding|open wounds?|visible injur(?:y|ies)|visible wounds?|graphic injur(?:y|ies)|ripped flesh|visceral)\b/g, "")
    .replace(/\bnon[-\s]?graphic\b/g, "");

  return /\b(?:blood|gore|gory|bleeding|open wounds?|visible injur(?:y|ies)|visible wounds?|graphic injur(?:y|ies)|ripped flesh|visceral)\b/.test(
    normalized
  );
}

function pasteReadyCheck(
  pkg: GeneratedPackage,
  engine: EngineOutputQaEngineId,
  label: string
): EngineOutputQaCheck {
  const pasteReady = enginePasteReady(pkg, engine);
  const fallback = engineFallback(pkg, engine);

  if (pasteReady.length) {
    return {
      id: `${engine}-paste-ready`,
      label: "Paste-ready body",
      status: "pass",
      detail: `${label} paste-ready copy block is available.`,
    };
  }

  if (fallback.length) {
    return {
      id: `${engine}-paste-ready`,
      label: "Paste-ready body",
      status: "caution",
      detail: `${label} text exists, but the paste-ready body is not explicit.`,
    };
  }

  return {
    id: `${engine}-paste-ready`,
    label: "Paste-ready body",
    status: "fail",
    detail: `${label} paste-ready body is missing.`,
  };
}

function runwayChecks(pkg: GeneratedPackage): EngineOutputQaCheck[] {
  const bodies = engineBodies(pkg, "runway");
  const text = joined(bodies);
  const referenceCount = countReferenceTokens(text);
  const longest = maxLength(bodies);

  return [
    pasteReadyCheck(pkg, "runway", "Runway"),
    {
      id: "runway-negative-separation",
      label: "Negative prompt separation",
      status: /negative\s*prompt\s*:/i.test(text) ? "caution" : "pass",
      detail: /negative\s*prompt\s*:/i.test(text)
        ? "Runway I2V paste body includes a Negative prompt block; keep negatives separate or absent."
        : "No Runway negative prompt block appears inside the paste body.",
    },
    {
      id: "runway-reference-count",
      label: "Reference count",
      status: referenceCount === 0 || referenceCount === 3 ? "pass" : "caution",
      detail:
        referenceCount === 0
          ? "No explicit @references detected."
          : referenceCount === 3
            ? "Exactly 3 Runway @references detected."
            : `${referenceCount} Runway @references detected; use 0 or exactly 3 active references.`,
    },
    {
      id: "runway-motion-only",
      label: "Motion-only clarity",
      status: containsImagePromptWording(text) ? "caution" : "pass",
      detail: containsImagePromptWording(text)
        ? "Runway body reads partly like image generation copy; keep it motion-only I2V."
        : "Runway body stays focused on motion/camera instructions.",
    },
    {
      id: "runway-length",
      label: "Length",
      status: longest > 1200 ? "caution" : "pass",
      detail:
        longest > 1200
          ? `Longest Runway body is ${longest} characters; trim for faster I2V iteration.`
          : `Longest Runway body is ${longest} characters.`,
    },
  ];
}

function klingLengthStatus(length: number): EngineOutputQaStatus {
  if (length > 3200) return "fail";
  if (length > 2500) return "caution";
  return "pass";
}

function klingChecks(pkg: GeneratedPackage): EngineOutputQaCheck[] {
  const bodies = engineBodies(pkg, "kling");
  const text = joined(bodies);
  const longest = maxLength(bodies);
  const hasTiming = /\b(?:shot\s*\d|15\s*(?:s|sec|second)|direct|multi[-\s]?shot|start frame|end frame|0[:.]\d{2})\b/i.test(
    text
  );
  const hasNegativeBlock = /negative\s*prompt\s*:/i.test(text);
  const hasMixedNegative =
    !hasNegativeBlock &&
    /\b(?:avoid|do not|no blood|no gore|no visible injur(?:y|ies)|negative)\b/i.test(
      text
    );
  const lengthStatus = klingLengthStatus(longest);

  return [
    pasteReadyCheck(pkg, "kling", "Kling"),
    {
      id: "kling-length",
      label: "Length",
      status: lengthStatus,
      detail:
        lengthStatus === "fail"
          ? `Longest Kling body is ${longest} characters, above the 3200-character review limit.`
          : lengthStatus === "caution"
            ? `Longest Kling body is ${longest} characters; target 2500 or less.`
            : `Longest Kling body is ${longest} characters, inside the 2500-character target.`,
    },
    {
      id: "kling-direct-structure",
      label: "15-second/direct structure",
      status: !hasTiming && longest > 1200 ? "caution" : "pass",
      detail:
        !hasTiming && longest > 1200
          ? "Long Kling body lacks obvious shot timing or direct/multishot structure."
          : "Kling structure is clear enough for director-style paste.",
    },
    {
      id: "kling-negative-prompt",
      label: "Negative prompt",
      status: hasMixedNegative ? "caution" : "pass",
      detail: hasMixedNegative
        ? "Negative/safety terms appear mixed into the main body; keep negatives as a clear final block when needed."
        : hasNegativeBlock
          ? "Negative prompt is clearly labeled."
          : "No mixed negative prompt content detected.",
    },
    {
      id: "kling-visual-safety",
      label: "Visual safety",
      status: hasUnsafeVisualWording(text) ? "fail" : "pass",
      detail: hasUnsafeVisualWording(text)
        ? "Explicit gore, blood, or visible injury wording appears without safe negation."
        : "No explicit gore, blood, or visible injury wording detected.",
    },
  ];
}

function seedanceComplexityStatus(bodies: string[]): EngineOutputQaStatus {
  const longest = maxLength(bodies);
  if (longest > 1500) return "fail";
  if (longest > 900) return "caution";
  if (bodies.some((body) => body.split(/\n+/).filter(Boolean).length > 8)) {
    return "caution";
  }
  return "pass";
}

function seedanceChecks(pkg: GeneratedPackage): EngineOutputQaCheck[] {
  const bodies = engineBodies(pkg, "seedance");
  const text = joined(bodies);
  const longest = maxLength(bodies);
  const maxSections = Math.max(
    0,
    ...bodies.map((body) => body.split(/\n+/).filter(Boolean).length)
  );
  const complexityStatus = seedanceComplexityStatus(bodies);
  const engineSpecificLeak =
    /@[a-z][a-z0-9_-]*|runway|kling\s+(?:direct|frames?|multishot|multi-shot)/i.test(
      text
    );
  const imageLike =
    containsImagePromptWording(text) ||
    /\b(?:full production document|shot breakdown|negative prompt)\b/i.test(text);

  return [
    pasteReadyCheck(pkg, "seedance", "Seedance"),
    {
      id: "seedance-complexity",
      label: "Complexity",
      status: complexityStatus,
      detail:
        complexityStatus === "fail"
          ? `Longest Seedance body is ${longest} characters; simplify below 1500.`
          : complexityStatus === "caution"
            ? `Seedance body is ${longest} characters with up to ${maxSections} sections; keep it compact.`
            : "Seedance body is compact and clear.",
    },
    {
      id: "seedance-reference-clarity",
      label: "Reference clarity",
      status: engineSpecificLeak ? "caution" : "pass",
      detail: engineSpecificLeak
        ? "Seedance body includes Runway @refs or Kling-specific wording; keep refs optional and generic."
        : "No Runway/Kling-specific reference syntax detected.",
    },
    {
      id: "seedance-motion-clarity",
      label: "Motion clarity",
      status: imageLike || !containsMotionWording(text) ? "caution" : "pass",
      detail:
        imageLike || !containsMotionWording(text)
          ? "Seedance copy should read as simple subject/background/camera motion."
          : "Seedance copy reads as simple motion guidance.",
    },
    {
      id: "seedance-visual-safety",
      label: "Visual safety",
      status: hasUnsafeVisualWording(text) ? "fail" : "pass",
      detail: hasUnsafeVisualWording(text)
        ? "Explicit gore, blood, or visible injury wording appears without safe negation."
        : "No explicit gore, blood, or visible injury wording detected.",
    },
  ];
}

export function analyzeEngineOutputQa(pkg: GeneratedPackage): EngineOutputQaReport {
  const engines = [
    makeEngine("runway", "Runway", runwayChecks(pkg)),
    makeEngine("kling", "Kling", klingChecks(pkg)),
    makeEngine("seedance", "Seedance", seedanceChecks(pkg)),
  ];

  const overall = engines.some((engine) => engine.status === "fail")
    ? "needs-review"
    : engines.some((engine) => engine.status === "caution")
      ? "caution"
      : "ready";

  return {
    overall,
    engines,
  };
}
