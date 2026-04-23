"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type {
  GeneratedPackage,
  RealGenerationEvidenceAttachment,
  RealGenerationEvidenceAttachmentSlot,
  RealGenerationEvidenceNotes,
  RealGenerationEvidenceRecommendation,
  RealGenerationEvidenceRecord,
  RealGenerationEvidenceScores,
} from "@/types";
import {
  deleteEvidenceAttachmentBlob,
  readEvidenceAttachmentBlob,
  writeEvidenceAttachmentBlob,
} from "@/lib/evidence-media-storage";
import {
  buildRealGenerationEvidenceLabel,
  buildRealGenerationEvidenceSummary,
  calculateRealGenerationEvidenceOverallScore,
  createDefaultRealGenerationEvidenceScores,
  createEmptyRealGenerationEvidenceAttachments,
  createEmptyRealGenerationEvidenceNotes,
  formatRealGenerationEvidenceRecommendation,
  getRealGenerationEvidenceAttachmentSlotMeta,
  getRealGenerationEvidenceAttachmentSlots,
  getRealGenerationEvidenceGenerationId,
  removeRealGenerationEvidenceAttachmentMetadata,
  suggestRealGenerationEvidenceRecommendation,
  upsertRealGenerationEvidenceAttachmentMetadata,
} from "@/lib/real-generation-evidence";
import {
  newId,
  readRealGenerationEvidenceForGeneration,
  readRealGenerationEvidenceHistory,
  upsertRealGenerationEvidenceRecord,
} from "@/lib/storage";

type EvidenceDraft = {
  scores: RealGenerationEvidenceScores;
  userRecommendation: RealGenerationEvidenceRecommendation;
  notes: RealGenerationEvidenceNotes;
  attachments: RealGenerationEvidenceAttachment[];
};

type AttachmentPreviewState = {
  url?: string;
  loading: boolean;
  missing: boolean;
};

type InitialEvidenceState = {
  draft: EvidenceDraft;
  history: RealGenerationEvidenceRecord[];
  savedNotice: string;
  recommendationTouched: boolean;
};

const SCORE_OPTIONS = [1, 2, 3, 4, 5] as const;
const RECOMMENDATION_OPTIONS: RealGenerationEvidenceRecommendation[] = [
  "keep",
  "retry-with-fixes",
  "retry",
];

const SCORE_CATEGORY_META: Array<{
  key: keyof RealGenerationEvidenceScores;
  label: string;
  detail: string;
}> = [
  {
    key: "firstFrameReadability",
    label: "First-frame readability",
    detail: "Can you read the subjects and the main beat immediately?",
  },
  {
    key: "spacingClarity",
    label: "Predator/prey spacing clarity",
    detail: "Does the distance and lane between subjects stay clean?",
  },
  {
    key: "worldLightingContinuity",
    label: "World and lighting continuity",
    detail: "Does the world stay anchored shot to shot without light or habitat drift?",
  },
  {
    key: "anatomyPhysicsRealism",
    label: "Anatomy and physics realism",
    detail: "Do anatomy, traction, contact, and motion feel believable?",
  },
  {
    key: "actionReadability",
    label: "Action readability",
    detail: "Is there one dominant readable action beat instead of visual mush?",
  },
  {
    key: "facebookOpeningStrength",
    label: "Facebook opening strength",
    detail: "Would the opening frame and beat hold attention fast on Facebook?",
  },
];

function buildDefaultDraft(): EvidenceDraft {
  const scores = createDefaultRealGenerationEvidenceScores();
  return {
    scores,
    userRecommendation: suggestRealGenerationEvidenceRecommendation(scores),
    notes: createEmptyRealGenerationEvidenceNotes(),
    attachments: createEmptyRealGenerationEvidenceAttachments(),
  };
}

function toDraft(record: RealGenerationEvidenceRecord): EvidenceDraft {
  return {
    scores: record.scores,
    userRecommendation: record.userRecommendation,
    notes: record.notes,
    attachments: record.attachments ?? createEmptyRealGenerationEvidenceAttachments(),
  };
}

function buildInitialEvidenceState(generationId: string): InitialEvidenceState {
  const history = readRealGenerationEvidenceHistory();
  const existing = readRealGenerationEvidenceForGeneration(generationId);

  return {
    draft: existing ? toDraft(existing) : buildDefaultDraft(),
    history,
    savedNotice: existing ? "Loaded saved evidence for this generation." : "",
    recommendationTouched: Boolean(existing),
  };
}

function formatSavedAt(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function formatFileSize(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0 KB";
  if (value < 1024 * 1024) {
    return `${Math.max(1, Math.round(value / 102.4) / 10)} KB`;
  }
  return `${Math.round((value / (1024 * 1024)) * 10) / 10} MB`;
}

export function RealGenerationEvidencePanel({ data }: { data: GeneratedPackage }) {
  const generationId = useMemo(() => getRealGenerationEvidenceGenerationId(data), [data]);
  const generationLabel = useMemo(() => buildRealGenerationEvidenceLabel(data), [data]);
  const attachmentSlots = useMemo(() => getRealGenerationEvidenceAttachmentSlots(data), [data]);
  const initialState = useMemo(() => buildInitialEvidenceState(generationId), [generationId]);
  const [draft, setDraft] = useState<EvidenceDraft>(initialState.draft);
  const [history, setHistory] = useState<RealGenerationEvidenceRecord[]>(initialState.history);
  const [savedNotice, setSavedNotice] = useState(initialState.savedNotice);
  const [recommendationTouched, setRecommendationTouched] = useState(
    initialState.recommendationTouched
  );
  const [busySlot, setBusySlot] = useState<RealGenerationEvidenceAttachmentSlot | null>(null);
  const [attachmentPreviews, setAttachmentPreviews] = useState<
    Record<string, AttachmentPreviewState>
  >({});
  const inputRefs = useRef<
    Partial<Record<RealGenerationEvidenceAttachmentSlot, HTMLInputElement | null>>
  >({});

  useEffect(() => {
    if (draft.attachments.length === 0) {
      return;
    }

    let active = true;
    const createdUrls: string[] = [];

    void Promise.all(
      draft.attachments.map(async (attachment) => {
        const blob = await readEvidenceAttachmentBlob(attachment.id);
        if (!blob) {
          return [
            attachment.id,
            { loading: false, missing: true } satisfies AttachmentPreviewState,
          ] as const;
        }

        const url = URL.createObjectURL(blob);
        createdUrls.push(url);
        return [
          attachment.id,
          { url, loading: false, missing: false } satisfies AttachmentPreviewState,
        ] as const;
      })
    )
      .then((entries) => {
        if (!active) return;
        setAttachmentPreviews(Object.fromEntries(entries));
      })
      .catch(() => {
        if (!active) return;
        setAttachmentPreviews(
          Object.fromEntries(
            draft.attachments.map((attachment) => [
              attachment.id,
              { loading: false, missing: true } satisfies AttachmentPreviewState,
            ])
          )
        );
      });

    return () => {
      active = false;
      createdUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [draft.attachments]);

  const existingRecord = useMemo(
    () => history.find((record) => record.generationId === generationId),
    [generationId, history]
  );

  const overallScore = useMemo(
    () => calculateRealGenerationEvidenceOverallScore(draft.scores),
    [draft.scores]
  );
  const suggestedRecommendation = useMemo(
    () => suggestRealGenerationEvidenceRecommendation(draft.scores),
    [draft.scores]
  );
  const attachmentCount = draft.attachments.length;

  function updateScore(key: keyof RealGenerationEvidenceScores, value: number) {
    setDraft((current) => {
      const scores = {
        ...current.scores,
        [key]: value,
      };

      return {
        ...current,
        scores,
        userRecommendation: recommendationTouched
          ? current.userRecommendation
          : suggestRealGenerationEvidenceRecommendation(scores),
      };
    });
  }

  function updateNote(key: keyof RealGenerationEvidenceNotes, value: string) {
    setDraft((current) => ({
      ...current,
      notes: {
        ...current.notes,
        [key]: value,
      },
    }));
  }

  function persistDraft(
    nextDraft: EvidenceDraft,
    notice: string,
    options?: { touchRecommendation?: boolean }
  ) {
    const nextOverallScore = calculateRealGenerationEvidenceOverallScore(nextDraft.scores);
    const nextSuggestedRecommendation = suggestRealGenerationEvidenceRecommendation(
      nextDraft.scores
    );
    const record: RealGenerationEvidenceRecord = {
      id:
        existingRecord?.id ??
        readRealGenerationEvidenceForGeneration(generationId)?.id ??
        newId(),
      generationId,
      generationLabel,
      generatedAt: data.generatedAt,
      capturedAt: new Date().toISOString(),
      predatorName: data.predatorName ?? "",
      preyName: data.preyName ?? "",
      arcName: String(data.arcName ?? ""),
      pipelineStyle: data.pipelineStyle,
      scores: nextDraft.scores,
      overallScore: nextOverallScore,
      suggestedRecommendation: nextSuggestedRecommendation,
      userRecommendation: nextDraft.userRecommendation,
      notes: nextDraft.notes,
      attachments: nextDraft.attachments.length > 0 ? nextDraft.attachments : undefined,
    };

    upsertRealGenerationEvidenceRecord(record);
    setHistory(readRealGenerationEvidenceHistory());
    setDraft(toDraft(record));
    if ((record.attachments?.length ?? 0) === 0) {
      setAttachmentPreviews({});
    }
    if (typeof options?.touchRecommendation === "boolean") {
      setRecommendationTouched(options.touchRecommendation);
    }
    setSavedNotice(notice);
  }

  async function handleAttachmentSelected(
    slot: RealGenerationEvidenceAttachmentSlot,
    file: File | null
  ) {
    if (!file) return;

    const slotMeta = getRealGenerationEvidenceAttachmentSlotMeta(slot);
    if (!slotMeta) return;

    setBusySlot(slot);

    const previous = draft.attachments.find((attachment) => attachment.slot === slot);
    const mediaKind = file.type.startsWith("video/") ? "video" : "image";
    const attachment: RealGenerationEvidenceAttachment = {
      id: newId(),
      slot,
      mediaKind,
      fileName: file.name.trim() || `${slot}.asset`,
      mimeType: file.type || (mediaKind === "video" ? "video/mp4" : "image/png"),
      sizeBytes: file.size,
      storedAt: new Date().toISOString(),
    };

    const stored = await writeEvidenceAttachmentBlob(attachment.id, file);
    if (previous) {
      await deleteEvidenceAttachmentBlob(previous.id);
    }

    const nextDraft: EvidenceDraft = {
      ...draft,
      attachments: upsertRealGenerationEvidenceAttachmentMetadata(
        draft.attachments,
        attachment
      ),
    };

    persistDraft(
      nextDraft,
      stored
        ? `${slotMeta.label} attached to this evidence pass.`
        : `${slotMeta.label} metadata saved, but this browser could not keep the local preview file.`
    );
    setBusySlot(null);
  }

  async function handleRemoveAttachment(slot: RealGenerationEvidenceAttachmentSlot) {
    const existing = draft.attachments.find((attachment) => attachment.slot === slot);
    if (!existing) return;

    const slotMeta = getRealGenerationEvidenceAttachmentSlotMeta(slot);
    setBusySlot(slot);
    await deleteEvidenceAttachmentBlob(existing.id);

    const nextDraft: EvidenceDraft = {
      ...draft,
      attachments: removeRealGenerationEvidenceAttachmentMetadata(draft.attachments, slot),
    };

    persistDraft(nextDraft, `${slotMeta?.label ?? "Attachment"} removed from this evidence pass.`);
    setBusySlot(null);
  }

  function saveEvidence() {
    persistDraft(draft, "Evidence saved for this generation.", {
      touchRecommendation: true,
    });
  }

  return (
    <div className="space-y-6" data-testid="real-generation-evidence-panel">
      <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-900 shadow-sm">
        Real-generation evidence pass lives here. Score the actual outputs you got,
        attach the media you want to review, and keep a small evidence trail linked to
        this generation so later prompt changes can be judged against real results.
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm font-extrabold text-gray-900">
              Current generation under review
            </div>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-gray-600">
              {generationLabel}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold">
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-800">
                Master still
              </span>
              <span className="rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-green-800">
                Runway shots
              </span>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-blue-800">
                Kling shots
              </span>
              {attachmentSlots.some((slot) => slot.slot === "seedance-output") && (
                <span className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-orange-800">
                  Seedance optional
                </span>
              )}
              <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-gray-700">
                {attachmentCount} media attached
              </span>
            </div>
          </div>

          <div className="grid min-w-[220px] gap-3 rounded-2xl border border-cyan-200 bg-cyan-50 p-3 text-xs text-cyan-900 sm:grid-cols-2">
            <div>
              <div className="font-bold uppercase tracking-wide text-cyan-700">
                Overall score
              </div>
              <div className="mt-1 text-2xl font-black text-cyan-950">
                {overallScore}/100
              </div>
            </div>
            <div>
              <div className="font-bold uppercase tracking-wide text-cyan-700">
                Suggested call
              </div>
              <div className="mt-1 text-base font-black text-cyan-950">
                {formatRealGenerationEvidenceRecommendation(suggestedRecommendation)}
              </div>
            </div>
          </div>
        </div>

        {savedNotice && (
          <div
            className="mt-4 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-800"
            data-testid="real-generation-evidence-save-notice"
          >
            {savedNotice}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm font-extrabold text-gray-900">Evidence media</div>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-gray-600">
              Attach the actual stills or rendered clips you want to judge. WSTV keeps the
              evidence metadata in this saved pass and stores local previews in this browser
              when the browser supports it.
            </p>
          </div>
          <div className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-bold text-gray-700">
            Local browser review only
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {attachmentSlots.map((slotMeta) => {
            const attachment = draft.attachments.find(
              (entry) => entry.slot === slotMeta.slot
            );
            const preview = attachment ? attachmentPreviews[attachment.id] : undefined;
            const isBusy = busySlot === slotMeta.slot;

            return (
              <div
                key={slotMeta.slot}
                className="rounded-2xl border border-gray-200 bg-gray-50 p-3"
                data-testid={`evidence-attachment-${slotMeta.slot}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-gray-900">{slotMeta.label}</div>
                    <div className="mt-1 flex flex-wrap gap-2 text-[11px] font-bold">
                      <span className="rounded-full border border-white/80 bg-white px-2.5 py-1 text-gray-700">
                        {slotMeta.engineLabel}
                      </span>
                      <span className="rounded-full border border-white/80 bg-white px-2.5 py-1 text-gray-600">
                        {attachment?.mediaKind === "video" ? "Video" : attachment ? "Image" : "Attach image or video"}
                      </span>
                    </div>
                    <p className="mt-2 max-w-xl text-xs leading-relaxed text-gray-600">
                      {slotMeta.detail}
                    </p>
                  </div>
                  <input
                    ref={(node) => {
                      inputRefs.current[slotMeta.slot] = node;
                    }}
                    type="file"
                    accept={slotMeta.accept}
                    className="hidden"
                    data-evidence-slot={slotMeta.slot}
                    onChange={(event) => {
                      const input = event.target;
                      const file = input.files?.[0] ?? null;
                      input.value = "";
                      void handleAttachmentSelected(slotMeta.slot, file);
                    }}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => inputRefs.current[slotMeta.slot]?.click()}
                      className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-extrabold text-cyan-900 hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isBusy}
                    >
                      {attachment ? "Replace" : "Attach"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleRemoveAttachment(slotMeta.slot)}
                      className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-extrabold text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={!attachment || isBusy}
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="mt-4 overflow-hidden rounded-2xl border border-dashed border-gray-300 bg-white">
                  {attachment ? (
                    <div className="space-y-3 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600">
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-bold text-gray-900">{attachment.fileName}</div>
                          <div className="mt-1 flex flex-wrap gap-2">
                            <span>{formatFileSize(attachment.sizeBytes)}</span>
                            <span>Saved {formatSavedAt(attachment.storedAt)}</span>
                          </div>
                        </div>
                        {isBusy && (
                          <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[11px] font-bold text-cyan-700">
                            Updating...
                          </span>
                        )}
                      </div>

                      {!preview || preview.loading ? (
                        <div className="flex h-44 items-center justify-center rounded-xl bg-gray-100 text-xs font-semibold text-gray-500">
                          Loading local preview…
                        </div>
                      ) : preview?.url ? (
                        attachment.mediaKind === "video" ? (
                          <video
                            src={preview.url}
                            controls
                            muted
                            playsInline
                            className="h-56 w-full rounded-xl bg-black object-contain"
                          />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={preview.url}
                            alt={slotMeta.label}
                            className="h-56 w-full rounded-xl bg-gray-100 object-cover"
                          />
                        )
                      ) : (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
                          {preview?.missing
                            ? "Attachment metadata is saved, but the local preview file is not available in this browser anymore. Reattach it if you want an inline preview again."
                            : "Attach a file to review it inline here."}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex h-44 flex-col items-center justify-center px-4 text-center">
                      <div className="text-sm font-bold text-gray-900">No media attached yet</div>
                      <p className="mt-2 max-w-sm text-xs leading-relaxed text-gray-600">
                        Add the actual render for this slot so you can review it alongside the
                        scorecard, notes, and final publish readiness call.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="text-sm font-extrabold text-gray-900">Evidence scoring</div>
        <div className="mt-4 space-y-4">
          {SCORE_CATEGORY_META.map((item) => (
            <div key={item.key} className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <label className="text-sm font-bold text-gray-900" htmlFor={item.key}>
                    {item.label}
                  </label>
                  <p className="mt-1 text-xs leading-relaxed text-gray-600">{item.detail}</p>
                </div>
                <div id={item.key} className="flex flex-wrap gap-2">
                  {SCORE_OPTIONS.map((score) => {
                    const active = draft.scores[item.key] === score;
                    return (
                      <button
                        key={`${item.key}-${score}`}
                        type="button"
                        onClick={() => updateScore(item.key, score)}
                        className={`min-w-10 rounded-lg border px-3 py-1.5 text-sm font-extrabold ${
                          active
                            ? "border-cyan-700 bg-cyan-700 text-white"
                            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                        }`}
                        aria-pressed={active}
                      >
                        {score}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-extrabold text-gray-900">Notes and drift capture</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500" htmlFor="evidence-strong">
                What looked strong?
              </label>
              <textarea
                id="evidence-strong"
                value={draft.notes.strongPoints}
                onChange={(event) => updateNote("strongPoints", event.target.value)}
                className="mt-1 min-h-24 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                placeholder="Example: Shot 1 held both animals cleanly, the opening frame read instantly, and lighting stayed stable."
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500" htmlFor="evidence-drift">
                What drift or failure happened?
              </label>
              <textarea
                id="evidence-drift"
                value={draft.notes.driftObserved}
                onChange={(event) => updateNote("driftObserved", event.target.value)}
                className="mt-1 min-h-24 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                placeholder="Example: Shot 3 lost the hillside plate, spacing compressed too hard, or physics got soft at contact."
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500" htmlFor="evidence-failed">
                What clearly failed?
              </label>
              <textarea
                id="evidence-failed"
                value={draft.notes.failedPoints}
                onChange={(event) => updateNote("failedPoints", event.target.value)}
                className="mt-1 min-h-24 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                placeholder="Example: Eagle wing shape drifted, the prey lane collapsed, or the opening frame felt too soft."
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500" htmlFor="evidence-retry-plan">
                What should change on retry?
              </label>
              <textarea
                id="evidence-retry-plan"
                value={draft.notes.retryPlan}
                onChange={(event) => updateNote("retryPlan", event.target.value)}
                className="mt-1 min-h-24 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                placeholder="Example: keep Shot 1, retry Shot 3 with stronger spacing lock, or test the same setup with a tighter first-frame still."
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500" htmlFor="evidence-master-still">
                Master still note
              </label>
              <textarea
                id="evidence-master-still"
                value={draft.notes.masterStill}
                onChange={(event) => updateNote("masterStill", event.target.value)}
                className="mt-1 min-h-20 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500" htmlFor="evidence-runway">
                Runway note
              </label>
              <textarea
                id="evidence-runway"
                value={draft.notes.runway}
                onChange={(event) => updateNote("runway", event.target.value)}
                className="mt-1 min-h-20 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500" htmlFor="evidence-kling">
                Kling note
              </label>
              <textarea
                id="evidence-kling"
                value={draft.notes.kling}
                onChange={(event) => updateNote("kling", event.target.value)}
                className="mt-1 min-h-20 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
            </div>
            {attachmentSlots.some((slot) => slot.slot === "seedance-output") && (
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-gray-500" htmlFor="evidence-seedance">
                  Seedance note
                </label>
                <textarea
                  id="evidence-seedance"
                  value={draft.notes.seedance}
                  onChange={(event) => updateNote("seedance", event.target.value)}
                  className="mt-1 min-h-20 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500" htmlFor="evidence-recommendation">
              Overall keep / retry recommendation
            </label>
            <select
              id="evidence-recommendation"
              value={draft.userRecommendation}
              onChange={(event) => {
                setRecommendationTouched(true);
                setDraft((current) => ({
                  ...current,
                  userRecommendation: event.target.value as RealGenerationEvidenceRecommendation,
                }));
              }}
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            >
              {RECOMMENDATION_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {formatRealGenerationEvidenceRecommendation(option)}
                </option>
              ))}
            </select>

            <div className="mt-4 rounded-xl border border-cyan-200 bg-cyan-50 p-3 text-xs leading-relaxed text-cyan-900">
              System suggestion: <span className="font-extrabold">{formatRealGenerationEvidenceRecommendation(suggestedRecommendation)}</span>
              . Update it only if your real output review says the keep/retry call should change.
            </div>

            <button
              type="button"
              onClick={saveEvidence}
              className="mt-4 w-full rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-cyan-800 active:scale-[0.99]"
            >
              Save Evidence Pass
            </button>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-extrabold text-gray-900">Recent evidence history</div>
                <p className="mt-1 text-xs leading-relaxed text-gray-600">
                  Small local evidence trail for comparing real generation outcomes over time.
                </p>
              </div>
              <div className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-bold text-gray-600">
                {history.length} saved
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {history.length > 0 ? (
                history.slice(0, 6).map((record) => {
                  const isCurrent = record.generationId === generationId;
                  const recordAttachmentCount = record.attachments?.length ?? 0;
                  return (
                    <div
                      key={record.id}
                      className={`rounded-2xl border p-3 ${
                        isCurrent
                          ? "border-cyan-200 bg-cyan-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-bold text-gray-900">{record.generationLabel}</div>
                          <div className="mt-1 text-xs text-gray-600">Saved {formatSavedAt(record.capturedAt)}</div>
                        </div>
                        <div className="rounded-full border border-white/80 bg-white px-2.5 py-1 text-[11px] font-bold text-gray-700">
                          {buildRealGenerationEvidenceSummary(record)}
                        </div>
                      </div>
                      {recordAttachmentCount > 0 && (
                        <div className="mt-2 text-xs font-semibold text-gray-600">
                          {recordAttachmentCount} media attachment{recordAttachmentCount === 1 ? "" : "s"}
                        </div>
                      )}
                      {(record.notes.strongPoints || record.notes.driftObserved || record.notes.retryPlan) && (
                        <div className="mt-3 space-y-1 text-xs leading-relaxed text-gray-700">
                          {record.notes.strongPoints && <p><span className="font-bold">Strong:</span> {record.notes.strongPoints}</p>}
                          {record.notes.driftObserved && <p><span className="font-bold">Drift:</span> {record.notes.driftObserved}</p>}
                          {record.notes.retryPlan && <p><span className="font-bold">Retry:</span> {record.notes.retryPlan}</p>}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-xs leading-relaxed text-gray-600">
                  No evidence saved yet. Once you review a real generation, score it here, attach the outputs you want to compare, and save the result.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
