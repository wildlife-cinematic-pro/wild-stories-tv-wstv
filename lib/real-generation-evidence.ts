import type {
  GeneratedPackage,
  PipelineStyle,
  RealGenerationEvidenceAttachment,
  RealGenerationEvidenceAttachmentSlot,
  RealGenerationEvidenceNotes,
  RealGenerationEvidenceRecommendation,
  RealGenerationEvidenceRecord,
  RealGenerationEvidenceScores,
} from "@/types";

export const REAL_GENERATION_EVIDENCE_SCORE_KEYS = [
  "firstFrameReadability",
  "spacingClarity",
  "worldLightingContinuity",
  "anatomyPhysicsRealism",
  "actionReadability",
  "facebookOpeningStrength",
] as const satisfies readonly (keyof RealGenerationEvidenceScores)[];

const RECOMMENDATION_LABELS: Record<RealGenerationEvidenceRecommendation, string> = {
  keep: "Keep",
  "retry-with-fixes": "Retry with fixes",
  retry: "Retry",
};

export type RealGenerationEvidenceAttachmentSlotMeta = {
  slot: RealGenerationEvidenceAttachmentSlot;
  label: string;
  engineLabel: string;
  detail: string;
  accept: string;
};

export const REAL_GENERATION_EVIDENCE_ATTACHMENT_SLOT_META: readonly RealGenerationEvidenceAttachmentSlotMeta[] = [
  {
    slot: "master-still",
    label: "Master Still",
    engineLabel: "Nano Banana 2 still",
    detail: "Attach the anchor still that defines the world plate for the full package.",
    accept: "image/*",
  },
  {
    slot: "runway-shot-1",
    label: "Runway Shot 1",
    engineLabel: "Runway",
    detail: "Use the opening shot that sets the first readable motion beat.",
    accept: "image/*,video/*",
  },
  {
    slot: "kling-shot-2",
    label: "Kling Shot 2",
    engineLabel: "Kling",
    detail: "Attach the second shot to review spacing drift and continuity pressure.",
    accept: "image/*,video/*",
  },
  {
    slot: "kling-shot-3",
    label: "Kling Shot 3",
    engineLabel: "Kling",
    detail: "Attach the third shot to inspect action clarity and world consistency.",
    accept: "image/*,video/*",
  },
  {
    slot: "runway-shot-4",
    label: "Runway Shot 4",
    engineLabel: "Runway",
    detail: "Use the closing shot to confirm the world plate stayed locked through the finish.",
    accept: "image/*,video/*",
  },
  {
    slot: "seedance-output",
    label: "Optional Seedance Output",
    engineLabel: "Seedance",
    detail: "Attach any Seedance render worth comparing against the main shot pack.",
    accept: "image/*,video/*",
  },
  {
    slot: "thumbnail-cover",
    label: "Thumbnail / Cover",
    engineLabel: "Facebook cover",
    detail: "Attach the image you plan to use for the cover or grid thumbnail review.",
    accept: "image/*",
  },
] as const;

const ATTACHMENT_SLOT_ORDER = new Map(
  REAL_GENERATION_EVIDENCE_ATTACHMENT_SLOT_META.map((item, index) => [item.slot, index])
);

function isRealGenerationEvidenceAttachmentSlot(
  value: unknown
): value is RealGenerationEvidenceAttachmentSlot {
  return REAL_GENERATION_EVIDENCE_ATTACHMENT_SLOT_META.some((item) => item.slot === value);
}

function isRealGenerationEvidenceAttachmentMediaKind(value: unknown): value is "image" | "video" {
  return value === "image" || value === "video";
}

function normalizeRealGenerationEvidenceAttachment(
  value: unknown
): RealGenerationEvidenceAttachment | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const candidate = value as Record<string, unknown>;
  const id = typeof candidate.id === "string" ? candidate.id.trim() : "";
  const slot = candidate.slot;
  const fileName = typeof candidate.fileName === "string" ? candidate.fileName.trim() : "";
  const mimeType = typeof candidate.mimeType === "string" ? candidate.mimeType.trim() : "";
  const sizeBytes = Number(candidate.sizeBytes);
  const storedAt = typeof candidate.storedAt === "string" ? candidate.storedAt.trim() : "";
  const mediaKind = candidate.mediaKind;

  if (!id || !isRealGenerationEvidenceAttachmentSlot(slot) || !fileName || !mimeType || !storedAt) {
    return null;
  }

  return {
    id,
    slot,
    mediaKind: isRealGenerationEvidenceAttachmentMediaKind(mediaKind)
      ? mediaKind
      : mimeType.startsWith("video/")
        ? "video"
        : "image",
    fileName,
    mimeType,
    sizeBytes: Number.isFinite(sizeBytes) ? Math.max(0, Math.round(sizeBytes)) : 0,
    storedAt,
  };
}

export function clampRealGenerationEvidenceScore(value: number): number {
  if (!Number.isFinite(value)) return 3;
  return Math.max(1, Math.min(5, Math.round(value)));
}

export function createDefaultRealGenerationEvidenceScores(
  value = 3
): RealGenerationEvidenceScores {
  const score = clampRealGenerationEvidenceScore(value);

  return {
    firstFrameReadability: score,
    spacingClarity: score,
    worldLightingContinuity: score,
    anatomyPhysicsRealism: score,
    actionReadability: score,
    facebookOpeningStrength: score,
  };
}

export function createEmptyRealGenerationEvidenceAttachments(): RealGenerationEvidenceAttachment[] {
  return [];
}

export function createEmptyRealGenerationEvidenceNotes(): RealGenerationEvidenceNotes {
  return {
    strongPoints: "",
    driftObserved: "",
    failedPoints: "",
    retryPlan: "",
    masterStill: "",
    runway: "",
    kling: "",
    seedance: "",
  };
}

export function normalizeRealGenerationEvidenceNotes(
  notes: Partial<RealGenerationEvidenceNotes> | null | undefined
): RealGenerationEvidenceNotes {
  const safe = notes ?? {};

  return {
    strongPoints: String(safe.strongPoints ?? "").trim(),
    driftObserved: String(safe.driftObserved ?? "").trim(),
    failedPoints: String(safe.failedPoints ?? "").trim(),
    retryPlan: String(safe.retryPlan ?? "").trim(),
    masterStill: String(safe.masterStill ?? "").trim(),
    runway: String(safe.runway ?? "").trim(),
    kling: String(safe.kling ?? "").trim(),
    seedance: String(safe.seedance ?? "").trim(),
  };
}

export function normalizeRealGenerationEvidenceAttachments(
  attachments: unknown
): RealGenerationEvidenceAttachment[] {
  if (!Array.isArray(attachments)) return [];

  const latestBySlot = new Map<RealGenerationEvidenceAttachmentSlot, RealGenerationEvidenceAttachment>();

  for (const entry of attachments) {
    const normalized = normalizeRealGenerationEvidenceAttachment(entry);
    if (!normalized) continue;

    const existing = latestBySlot.get(normalized.slot);
    if (!existing || normalized.storedAt.localeCompare(existing.storedAt) >= 0) {
      latestBySlot.set(normalized.slot, normalized);
    }
  }

  return [...latestBySlot.values()].sort(
    (left, right) =>
      (ATTACHMENT_SLOT_ORDER.get(left.slot) ?? 99) - (ATTACHMENT_SLOT_ORDER.get(right.slot) ?? 99)
  );
}

export function upsertRealGenerationEvidenceAttachmentMetadata(
  attachments: RealGenerationEvidenceAttachment[],
  attachment: RealGenerationEvidenceAttachment
): RealGenerationEvidenceAttachment[] {
  return normalizeRealGenerationEvidenceAttachments([
    ...attachments.filter((entry) => entry.slot !== attachment.slot),
    attachment,
  ]);
}

export function removeRealGenerationEvidenceAttachmentMetadata(
  attachments: RealGenerationEvidenceAttachment[],
  slot: RealGenerationEvidenceAttachmentSlot
): RealGenerationEvidenceAttachment[] {
  return normalizeRealGenerationEvidenceAttachments(
    attachments.filter((entry) => entry.slot !== slot)
  );
}

export function getRealGenerationEvidenceAttachmentSlotMeta(
  slot: RealGenerationEvidenceAttachmentSlot
): RealGenerationEvidenceAttachmentSlotMeta | undefined {
  return REAL_GENERATION_EVIDENCE_ATTACHMENT_SLOT_META.find((item) => item.slot === slot);
}

export function getRealGenerationEvidenceAttachmentSlots(
  pkg: GeneratedPackage
): RealGenerationEvidenceAttachmentSlotMeta[] {
  const hasSeedance = Boolean(
    (pkg.seedanceShots && pkg.seedanceShots.length > 0) || pkg.seedanceMultiShotPrompt
  );

  return REAL_GENERATION_EVIDENCE_ATTACHMENT_SLOT_META.filter(
    (item) => item.slot !== "seedance-output" || hasSeedance
  );
}

export function calculateRealGenerationEvidenceOverallScore(
  scores: RealGenerationEvidenceScores
): number {
  const total = REAL_GENERATION_EVIDENCE_SCORE_KEYS.reduce(
    (sum, key) => sum + clampRealGenerationEvidenceScore(scores[key]),
    0
  );
  const average = total / REAL_GENERATION_EVIDENCE_SCORE_KEYS.length;
  return Math.round(((average - 1) / 4) * 100);
}

export function suggestRealGenerationEvidenceRecommendation(
  scores: RealGenerationEvidenceScores
): RealGenerationEvidenceRecommendation {
  const overall = calculateRealGenerationEvidenceOverallScore(scores);
  const criticalLow =
    clampRealGenerationEvidenceScore(scores.firstFrameReadability) <= 2 ||
    clampRealGenerationEvidenceScore(scores.anatomyPhysicsRealism) <= 2;

  if (
    overall >= 78 &&
    !criticalLow &&
    clampRealGenerationEvidenceScore(scores.spacingClarity) >= 3 &&
    clampRealGenerationEvidenceScore(scores.actionReadability) >= 3
  ) {
    return "keep";
  }

  if (overall >= 50) {
    return "retry-with-fixes";
  }

  return "retry";
}

export function formatRealGenerationEvidenceRecommendation(
  recommendation: RealGenerationEvidenceRecommendation
): string {
  return RECOMMENDATION_LABELS[recommendation];
}

export function getRealGenerationEvidenceGenerationId(pkg: GeneratedPackage): string {
  const explicitId = String(pkg.generationId ?? "").trim();
  if (explicitId) return explicitId;

  return [
    pkg.predatorName ?? "predator",
    pkg.preyName ?? "prey",
    String(pkg.arcName ?? "arc"),
    pkg.pipelineStyle ?? "pipeline",
    pkg.generatedAt ?? "",
    pkg.hook ?? "",
  ]
    .map((part) => String(part).trim())
    .filter(Boolean)
    .join("|");
}

export function buildRealGenerationEvidenceLabel(pkg: GeneratedPackage): string {
  const matchup = `${pkg.predatorName ?? "Predator"} vs ${pkg.preyName ?? "Prey"}`;
  const arc = String(pkg.arcName ?? "Wildlife package").trim();
  const pipeline = (pkg.pipelineStyle ?? "4-shot") as PipelineStyle;
  const stamp = String(pkg.generatedAt ?? "").trim();
  const timeLabel = stamp ? stamp.slice(0, 16).replace("T", " ") : "Latest output";
  return `${matchup} • ${arc} • ${pipeline} • ${timeLabel}`;
}

export function sortRealGenerationEvidenceRecords(
  records: RealGenerationEvidenceRecord[]
): RealGenerationEvidenceRecord[] {
  return [...records].sort((left, right) =>
    right.capturedAt.localeCompare(left.capturedAt)
  );
}

export function buildRealGenerationEvidenceSummary(
  record: Pick<RealGenerationEvidenceRecord, "overallScore" | "userRecommendation">
): string {
  return `${formatRealGenerationEvidenceRecommendation(record.userRecommendation)} • ${record.overallScore}/100`;
}
