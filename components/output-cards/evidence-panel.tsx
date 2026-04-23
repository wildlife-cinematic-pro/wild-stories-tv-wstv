"use client";

import { useMemo, useState } from "react";

import type {
  GeneratedPackage,
  RealGenerationEvidenceNotes,
  RealGenerationEvidenceRecommendation,
  RealGenerationEvidenceRecord,
  RealGenerationEvidenceScores,
} from "@/types";
import {
  buildRealGenerationEvidenceLabel,
  buildRealGenerationEvidenceSummary,
  calculateRealGenerationEvidenceOverallScore,
  createDefaultRealGenerationEvidenceScores,
  createEmptyRealGenerationEvidenceNotes,
  formatRealGenerationEvidenceRecommendation,
  getRealGenerationEvidenceGenerationId,
  suggestRealGenerationEvidenceRecommendation,
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
  };
}

function toDraft(record: RealGenerationEvidenceRecord): EvidenceDraft {
  return {
    scores: record.scores,
    userRecommendation: record.userRecommendation,
    notes: record.notes,
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

export function RealGenerationEvidencePanel({ data }: { data: GeneratedPackage }) {
  const generationId = useMemo(() => getRealGenerationEvidenceGenerationId(data), [data]);
  const generationLabel = useMemo(() => buildRealGenerationEvidenceLabel(data), [data]);
  const hasSeedance = Boolean(
    (data.seedanceShots && data.seedanceShots.length > 0) || data.seedanceMultiShotPrompt
  );
  const initialState = useMemo(() => buildInitialEvidenceState(generationId), [generationId]);
  const [draft, setDraft] = useState<EvidenceDraft>(initialState.draft);
  const [history, setHistory] = useState<RealGenerationEvidenceRecord[]>(initialState.history);
  const [savedNotice, setSavedNotice] = useState(initialState.savedNotice);
  const [recommendationTouched, setRecommendationTouched] = useState(
    initialState.recommendationTouched
  );

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

  function saveEvidence() {
    const record: RealGenerationEvidenceRecord = {
      id: existingRecord?.id ?? newId(),
      generationId,
      generationLabel,
      generatedAt: data.generatedAt,
      capturedAt: new Date().toISOString(),
      predatorName: data.predatorName ?? "",
      preyName: data.preyName ?? "",
      arcName: String(data.arcName ?? ""),
      pipelineStyle: data.pipelineStyle,
      scores: draft.scores,
      overallScore,
      suggestedRecommendation,
      userRecommendation: draft.userRecommendation,
      notes: draft.notes,
    };

    upsertRealGenerationEvidenceRecord(record);
    setHistory(readRealGenerationEvidenceHistory());
    setDraft(toDraft(record));
    setRecommendationTouched(true);
    setSavedNotice("Evidence saved for this generation.");
  }

  return (
    <div className="space-y-6" data-testid="real-generation-evidence-panel">
      <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-900 shadow-sm">
        Real-generation evidence pass lives here. Score the actual outputs you got,
        log drift or failures, and keep a small evidence trail linked to this
        generation so later prompt changes can be judged against real results.
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
              {hasSeedance && (
                <span className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-orange-800">
                  Seedance optional
                </span>
              )}
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
            {hasSeedance && (
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
                  No evidence saved yet. Once you review a real generation, score it here and save the result.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
