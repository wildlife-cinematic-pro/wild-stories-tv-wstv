import type { GeneratedPackage, StructuredPrompt } from "@/types";
import { extractMotionOnlyPrompt } from "@/lib/workflow-packs";

export function safeText(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (Array.isArray(v)) return v.map((x) => String(x)).join("\n\n").trim();
  return String(v ?? "").trim();
}

export function extractRunwayPasteReady(shotText: string): string {
  const m = shotText.match(
    /═══ PASTE-READY I2V PROMPT[^═]*═══\s*\n([\s\S]*?)(?:\n─── SHOT BREAKDOWN|$)/
  );
  if (m?.[1]) return m[1].trim();

  const f = shotText.match(
    /Paste-ready I2V prompt:\s*\n([\s\S]*?)(?:\nCamera motion:|$)/
  );
  if (f?.[1]) return f[1].trim();

  return extractMotionOnlyPrompt(shotText);
}

export function extractKlingPromptBody(shotText: string): string {
  const s = String(shotText ?? "");

  const markers = [
    "═══ PASTE INTO KLING — stays under 2500 chars (copy this block only) ═══",
    "═══ PASTE-READY KLING PROMPT (copy this block into Kling) ═══",
    "═══ KLING 3.0 PROMPT (SCALE format) ═══",
    "═══ KLING PROMPT (WSTV structured format) ═══",
  ];

  for (const marker of markers) {
    const start = s.indexOf(marker);
    if (start >= 0) {
      const afterMarker = s.slice(start + marker.length).trim();

      const endCandidates = [
        afterMarker.indexOf("\n─── FULL BREAKDOWN"),
        afterMarker.indexOf("\n\n─── FULL BREAKDOWN"),
        afterMarker.indexOf("\nKling settings:"),
        afterMarker.indexOf("\n\nKling settings:"),
        afterMarker.indexOf("\n────────────────────────────────"),
        afterMarker.indexOf("\n─── FULL BREAKDOWN (reference only)"),
        afterMarker.indexOf("\n─── OPTIONAL NOTES"),
      ].filter((n) => n >= 0);

      const end = endCandidates.length ? Math.min(...endCandidates) : -1;
      return (end >= 0 ? afterMarker.slice(0, end) : afterMarker).trim();
    }
  }

  let cleaned = s
    .replace(/\n\s*[─—\-═]{5,}\s*\n\s*HOW TO USE\b[\s\S]*$/i, "")
    .replace(/\n\s*─── FULL BREAKDOWN[\s\S]*$/i, "")
    .trim();

  const bodyStart = cleaned.search(
    /(?:^|\n)\s*(?:Scene:|Style:|Shot\s*1\s*[\(\-—:])/i
  );
  if (bodyStart >= 0) {
    cleaned = cleaned.slice(bodyStart).trim();
  }

  return cleaned.replace(/\n\s*[─—\-═]{5,}\s*$/g, "").trim();
}

export function extractSeedancePromptBody(shotText: string): string {
  const s = String(shotText ?? "");
  const pasteBlock = s
    .split("═══ PASTE-READY SEEDANCE PROMPT (copy this block into Seedance) ═══")[1]
    ?.split("─── BREAKDOWN (reference only) ───")[0]
    ?.trim();

  if (pasteBlock) return pasteBlock;

  const multiShotBlock = s
    .split("═══ PASTE-READY SEEDANCE MULTI-SHOT PROMPT (copy this block into Seedance) ═══")[1]
    ?.split("─── BREAKDOWN (reference only) ───")[0]
    ?.trim();

  return multiShotBlock || s.trim();
}

export function extractImagePromptBody(promptText: string): string {
  return String(promptText ?? "").trim();
}

export function extractKlingAudioPrompt(shotText: string): string {
  const m = String(shotText ?? "").match(
    /\nAudio:\s*([\s\S]*?)(?:\n\s*Kling settings:|$)/i
  );
  return m?.[1]?.trim() ?? "";
}

export function buildLegacyPromptCard(
  engine: "image" | "runway" | "kling" | "seedance",
  fullText: string
): StructuredPrompt {
  const safePromptText = String(fullText ?? "").trim();

  if (engine === "image") {
    return {
      fullText: safePromptText,
      pasteReady: extractImagePromptBody(safePromptText),
      metadata: { engine },
    };
  }

  if (engine === "runway") {
    return {
      fullText: safePromptText,
      pasteReady: extractRunwayPasteReady(safePromptText),
      metadata: { engine },
    };
  }

  if (engine === "seedance") {
    return {
      fullText: safePromptText,
      pasteReady: extractSeedancePromptBody(safePromptText),
      metadata: { engine },
    };
  }

  const motionMatch = safePromptText.match(/Motion intensity:\s*([\d.]+)/);

  return {
    fullText: safePromptText,
    pasteReady: extractKlingPromptBody(safePromptText),
    audio: extractKlingAudioPrompt(safePromptText),
    metadata: {
      engine,
      motionIntensity: motionMatch ? Number.parseFloat(motionMatch[1]) : undefined,
    },
  };
}

export function getPromptCardForEngine(
  data: GeneratedPackage,
  engine: "runway" | "kling" | "seedance",
  index: number
): StructuredPrompt {
  const structured =
    engine === "runway"
      ? data.structuredPrompts?.runwayShots?.[index]
      : engine === "kling"
        ? data.structuredPrompts?.klingShots?.[index]
        : data.structuredPrompts?.seedanceShots?.[index];

  const fallbackText =
    engine === "runway"
      ? data.runwayShots?.[index]
      : engine === "kling"
        ? data.klingShots?.[index]
        : data.seedanceShots?.[index];

  return structured ?? buildLegacyPromptCard(engine, String(fallbackText ?? ""));
}

export function getWorkflowPromptCard(
  data: GeneratedPackage,
  index: number
): StructuredPrompt {
  const structured = data.structuredPrompts?.workflowShots?.[index];
  if (structured) return structured;

  const legacyPrompt = String(data.shotPlan?.[index]?.prompt ?? "");
  const engine = data.shotPlan?.[index]?.engine === "RUNWAY" ? "runway" : "kling";
  return buildLegacyPromptCard(engine, legacyPrompt);
}

export function getImagePromptCard(data: GeneratedPackage): StructuredPrompt {
  return (
    data.structuredPrompts?.imagePrompt ??
    buildLegacyPromptCard("image", String(data.imagePrompt ?? ""))
  );
}

export function getGptImage2PromptCard(data: GeneratedPackage): StructuredPrompt {
  return (
    data.structuredPrompts?.gptImage2Prompt ??
    buildLegacyPromptCard("image", String(data.gptImage2Prompt ?? ""))
  );
}

export function getSeedanceMultiShotCard(
  data: GeneratedPackage
): StructuredPrompt {
  return (
    data.structuredPrompts?.seedanceMultiShot ??
    buildLegacyPromptCard("seedance", String(data.seedanceMultiShotPrompt ?? ""))
  );
}

export function getKlingNative15sCard(
  data: GeneratedPackage
): StructuredPrompt {
  return (
    data.structuredPrompts?.klingNative15s ??
    buildLegacyPromptCard("kling", String(data.klingNative15s ?? ""))
  );
}


export function getKlingFramesPromptCard(
  data: GeneratedPackage
): StructuredPrompt {
  return (
    data.structuredPrompts?.klingFramesPrompt ??
    data.structuredPrompts?.klingNative15s ??
    buildLegacyPromptCard("kling", String(data.klingFramesPrompt ?? data.klingNative15s ?? ""))
  );
}

export function getKlingMultishotPromptCards(
  data: GeneratedPackage
): StructuredPrompt[] {
  const structured = data.structuredPrompts?.klingMultishotShots;
  if (structured?.length) return structured;

  return (data.klingMultishotShots ?? []).map((shot) =>
    buildLegacyPromptCard("kling", String(shot ?? ""))
  );
}

export function getKlingSixShotCard(
  data: GeneratedPackage
): StructuredPrompt {
  return (
    data.structuredPrompts?.klingSixShot ??
    buildLegacyPromptCard("kling", String(data.klingSixShot ?? ""))
  );
}
