import type { GeneratedPackage, StructuredPrompt } from "@/types";

export type GeneratedOutputQualityOverall =
  | "ready"
  | "caution"
  | "needs-review";
export type GeneratedOutputQualityItemStatus = "pass" | "caution" | "fail";

export type GeneratedOutputQualityItem = {
  id: string;
  label: string;
  status: GeneratedOutputQualityItemStatus;
  detail: string;
};

export type GeneratedOutputQualityReport = {
  overall: GeneratedOutputQualityOverall;
  score: number;
  items: GeneratedOutputQualityItem[];
};

function safeText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map(String).join("\n").trim();
  return String(value ?? "").trim();
}

function promptText(prompts: Array<StructuredPrompt | undefined>) {
  return prompts
    .map((prompt) => safeText(prompt?.pasteReady))
    .filter(Boolean);
}

function hasEnginePasteReady(
  pkg: GeneratedPackage,
  engine: "runway" | "kling" | "seedance"
) {
  const structured =
    engine === "runway"
      ? pkg.structuredPrompts?.runwayShots
      : engine === "kling"
        ? pkg.structuredPrompts?.klingShots
        : pkg.structuredPrompts?.seedanceShots;
  const workflow = (pkg.structuredPrompts?.workflowShots ?? []).filter(
    (prompt) => prompt.metadata?.engine === engine
  );

  return promptText([...(structured ?? []), ...workflow]);
}

function getEngineText(
  pkg: GeneratedPackage,
  engine: "runway" | "kling" | "seedance"
) {
  if (engine === "runway") {
    return (pkg.runwayShots ?? []).map(safeText).filter(Boolean);
  }
  if (engine === "kling") {
    return (pkg.klingShots ?? []).map(safeText).filter(Boolean);
  }
  return (pkg.seedanceShots ?? []).map(safeText).filter(Boolean);
}

function countHashtags(value: string) {
  return value
    .split(/\s+/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function statusScore(status: GeneratedOutputQualityItemStatus) {
  if (status === "pass") return 100;
  if (status === "caution") return 65;
  return 25;
}

function buildOverall(items: GeneratedOutputQualityItem[]): GeneratedOutputQualityOverall {
  if (items.some((item) => item.status === "fail")) return "needs-review";
  if (items.some((item) => item.status === "caution")) return "caution";
  return "ready";
}

function buildScore(items: GeneratedOutputQualityItem[]) {
  const total = items.reduce((sum, item) => sum + statusScore(item.status), 0);
  return Math.round(total / items.length);
}

function runwayReadiness(pkg: GeneratedPackage): GeneratedOutputQualityItem {
  const pasteReady = hasEnginePasteReady(pkg, "runway");
  const fallbackText = getEngineText(pkg, "runway");

  if (pasteReady.length) {
    return {
      id: "runway-readiness",
      label: "Runway readiness",
      status: "pass",
      detail: "Runway I2V paste-ready body is available.",
    };
  }

  if (fallbackText.length) {
    return {
      id: "runway-readiness",
      label: "Runway readiness",
      status: "caution",
      detail: "Runway text exists, but paste-ready body is not explicit.",
    };
  }

  return {
    id: "runway-readiness",
    label: "Runway readiness",
    status: "fail",
    detail: "Runway prompt body is missing.",
  };
}

function klingReadiness(pkg: GeneratedPackage): GeneratedOutputQualityItem {
  const pasteReady = hasEnginePasteReady(pkg, "kling");
  const fallbackText = getEngineText(pkg, "kling");
  const prompts = pasteReady.length ? pasteReady : fallbackText;
  const longest = Math.max(0, ...prompts.map((prompt) => prompt.length));

  if (!prompts.length) {
    return {
      id: "kling-readiness",
      label: "Kling readiness",
      status: "fail",
      detail: "Kling prompt body is missing.",
    };
  }

  if (!pasteReady.length || longest > 2500) {
    return {
      id: "kling-readiness",
      label: "Kling readiness",
      status: "caution",
      detail:
        longest > 2500
          ? "Kling prompt is over the common 2500-character paste target."
          : "Kling text exists, but paste-ready block is not explicit.",
    };
  }

  return {
    id: "kling-readiness",
    label: "Kling readiness",
    status: "pass",
    detail: "Kling prompt body is ready to paste.",
  };
}

function seedanceReadiness(pkg: GeneratedPackage): GeneratedOutputQualityItem {
  const pasteReady = hasEnginePasteReady(pkg, "seedance");
  const fallbackText = getEngineText(pkg, "seedance");
  const prompts = pasteReady.length ? pasteReady : fallbackText;
  const longest = Math.max(0, ...prompts.map((prompt) => prompt.length));
  const complexPrompt = prompts.some((prompt) => prompt.split(/\n+/).length > 8);

  if (!prompts.length) {
    return {
      id: "seedance-readiness",
      label: "Seedance readiness",
      status: "fail",
      detail: "Seedance prompt body is missing.",
    };
  }

  if (!pasteReady.length || longest > 900 || complexPrompt) {
    return {
      id: "seedance-readiness",
      label: "Seedance readiness",
      status: "caution",
      detail: "Seedance prompt exists, but may be long or too complex.",
    };
  }

  return {
    id: "seedance-readiness",
    label: "Seedance readiness",
    status: "pass",
    detail: "Seedance motion prompt is compact and ready.",
  };
}

function captionReadiness(pkg: GeneratedPackage): GeneratedOutputQualityItem {
  const caption = safeText(pkg.caption);

  if (!caption) {
    return {
      id: "caption-readiness",
      label: "Caption readiness",
      status: "fail",
      detail: "Caption is missing.",
    };
  }

  if (caption.length <= 150) {
    return {
      id: "caption-readiness",
      label: "Caption readiness",
      status: "pass",
      detail: "Caption is " + caption.length + " characters.",
    };
  }

  if (caption.length <= 180) {
    return {
      id: "caption-readiness",
      label: "Caption readiness",
      status: "caution",
      detail: "Caption is " + caption.length + " characters; trim toward 150.",
    };
  }

  return {
    id: "caption-readiness",
    label: "Caption readiness",
    status: "fail",
    detail: "Caption is " + caption.length + " characters and too long for Reels.",
  };
}

function hashtagReadiness(pkg: GeneratedPackage): GeneratedOutputQualityItem {
  const tags = countHashtags(safeText(pkg.hashtags));
  const usable = tags.every((tag) => /^#[A-Za-z0-9_]+$/.test(tag));
  const uniqueCount = new Set(tags.map((tag) => tag.toLowerCase())).size;

  if (!tags.length || !usable || uniqueCount !== tags.length) {
    return {
      id: "hashtag-readiness",
      label: "Hashtag readiness",
      status: "fail",
      detail: "Hashtags are missing, duplicated, or not usable.",
    };
  }

  if (tags.length === 5) {
    return {
      id: "hashtag-readiness",
      label: "Hashtag readiness",
      status: "pass",
      detail: "Exactly 5 usable hashtags are packaged.",
    };
  }

  if (tags.length === 4 || tags.length === 6) {
    return {
      id: "hashtag-readiness",
      label: "Hashtag readiness",
      status: "caution",
      detail: tags.length + " hashtags found; use exactly 5 for the cleanest pack.",
    };
  }

  return {
    id: "hashtag-readiness",
    label: "Hashtag readiness",
    status: "fail",
    detail: tags.length + " hashtags found; rebuild as 5 clean hashtags.",
  };
}

function safetyReadiness(pkg: GeneratedPackage): GeneratedOutputQualityItem {
  const text = [
    pkg.imagePrompt,
    pkg.negativePrompt,
    pkg.runwayShots,
    pkg.klingShots,
    pkg.seedanceShots,
    pkg.caption,
    pkg.hashtags,
    pkg.routingNote,
  ]
    .map(safeText)
    .join("\n")
    .toLowerCase()
    .replace(/\bno\s+(?:blood|gore|visible injury|visible injuries|visible wounds?)\b/g, "")
    .replace(/\bnon[-\s]?graphic\b/g, "");
  const explicitGore =
    /\b(?:blood|gore|gory|bleeding|open wounds?|visible injur(?:y|ies)|graphic injur(?:y|ies)|ripped flesh|visceral)\b/.test(
      text
    );
  const intenseWording =
    /\b(?:kill|kills|takedown|impact|crush|fight|attack|struggle|clash)\b/.test(text);

  if (explicitGore) {
    return {
      id: "safety-wording",
      label: "Safety wording",
      status: "fail",
      detail: "Explicit blood, gore, or visible-injury wording appears.",
    };
  }

  if (intenseWording) {
    return {
      id: "safety-wording",
      label: "Safety wording",
      status: "caution",
      detail: "Intense wording appears; confirm it stays non-graphic.",
    };
  }

  return {
    id: "safety-wording",
    label: "Safety wording",
    status: "pass",
    detail: "No blood, gore, or visible-injury wording detected.",
  };
}

function copyBlockClarity(pkg: GeneratedPackage): GeneratedOutputQualityItem {
  const workflowPasteReady = promptText(pkg.structuredPrompts?.workflowShots ?? []);
  const enginePasteReady = [
    ...hasEnginePasteReady(pkg, "runway"),
    ...hasEnginePasteReady(pkg, "kling"),
    ...hasEnginePasteReady(pkg, "seedance"),
  ];
  const fallbackText = [
    ...getEngineText(pkg, "runway"),
    ...getEngineText(pkg, "kling"),
    ...getEngineText(pkg, "seedance"),
  ];

  if (workflowPasteReady.length >= 4 || enginePasteReady.length >= 4) {
    return {
      id: "copy-block-clarity",
      label: "Copy-block clarity",
      status: "pass",
      detail: "Primary paste-ready copy blocks are available.",
    };
  }

  if (enginePasteReady.length || fallbackText.length) {
    return {
      id: "copy-block-clarity",
      label: "Copy-block clarity",
      status: "caution",
      detail: "Some copyable content exists, but primary paste blocks are incomplete.",
    };
  }

  return {
    id: "copy-block-clarity",
    label: "Copy-block clarity",
    status: "fail",
    detail: "No copyable engine prompt content is available.",
  };
}

export function analyzeGeneratedOutputQuality(
  pkg: GeneratedPackage
): GeneratedOutputQualityReport {
  const items: GeneratedOutputQualityItem[] = [
    runwayReadiness(pkg),
    klingReadiness(pkg),
    seedanceReadiness(pkg),
    captionReadiness(pkg),
    hashtagReadiness(pkg),
    safetyReadiness(pkg),
    copyBlockClarity(pkg),
  ];

  return {
    overall: buildOverall(items),
    score: buildScore(items),
    items,
  };
}
