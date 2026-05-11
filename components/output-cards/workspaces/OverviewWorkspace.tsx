"use client";

import PromptVersionsPanel from "@/components/PromptVersionsPanel";
import WSTVWorkflowDiagram from "@/components/WSTVWorkflowDiagram";
import { WorkflowPromptMap } from "@/components/output-cards/workflow-prompt-map";
import StoryModeQACard from "@/components/output-cards/story-mode-qa-card";
import FacebookReelsOptimizerCard from "@/components/output-cards/facebook-reels-optimizer-card";
import ReelsPerformanceCard from "@/components/output-cards/reels-performance-card";
import ReelsPerformanceInsightsCard from "@/components/output-cards/reels-performance-insights-card";
import AutoRecommendationsCard from "@/components/output-cards/auto-recommendations-card";
import ABExperimentTrackerCard from "@/components/output-cards/ab-experiment-tracker-card";
import LocalCreatorDataCard from "@/components/output-cards/local-creator-data-card";
import WSTVCreatorGuideCard from "@/components/output-cards/wstv-creator-guide-card";
import { EngineSpecsPanel, SectionLabel } from "@/components/output-cards/shared-panels";

import {
  analyzeGeneratedOutputQuality,
  type GeneratedOutputQualityItemStatus,
  type GeneratedOutputQualityOverall,
} from "@/lib/generated-output-quality";
import { analyzeEngineOutputQa, type EngineOutputQaEngine, type EngineOutputQaStatus } from "@/lib/engine-output-qa";
import { buildEngineOutputFixActions, buildOutputFixActions } from "@/lib/output-fix-actions";
import type { FixActionDescriptor } from "@/lib/setup-fix-actions";
import type { StoryModePreset } from "@/lib/story-mode-presets";
import type { GeneratedPackage, PromptVersion } from "@/types";

function formatBadgeValue(value: unknown, fallback: string) {
  if (typeof value !== "string" && typeof value !== "number") return fallback;
  return String(value)
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}


const OUTPUT_QUALITY_OVERALL_TONE: Record<
  GeneratedOutputQualityOverall,
  { label: string; className: string; dotClassName: string }
> = {
  ready: {
    label: "Ready",
    className:
      "border-emerald-400/35 bg-[color:var(--success-bg)] text-[color:var(--success-text)]",
    dotClassName: "bg-[color:var(--success-text)]",
  },
  caution: {
    label: "Caution",
    className:
      "border-amber-400/35 bg-[color:var(--warning-bg)] text-[color:var(--warning-text)]",
    dotClassName: "bg-[color:var(--warning-text)]",
  },
  "needs-review": {
    label: "Needs Review",
    className:
      "border-rose-400/35 bg-[color:var(--danger-bg)] text-[color:var(--danger-text)]",
    dotClassName: "bg-[color:var(--danger-text)]",
  },
};

const OUTPUT_QUALITY_ITEM_TONE: Record<
  GeneratedOutputQualityItemStatus,
  { label: string; className: string; dotClassName: string }
> = {
  pass: {
    label: "Pass",
    className:
      "border-emerald-400/35 bg-[color:var(--success-bg)] text-[color:var(--success-text)]",
    dotClassName: "bg-[color:var(--success-text)]",
  },
  caution: {
    label: "Check",
    className:
      "border-amber-400/35 bg-[color:var(--warning-bg)] text-[color:var(--warning-text)]",
    dotClassName: "bg-[color:var(--warning-text)]",
  },
  fail: {
    label: "Fix",
    className:
      "border-rose-400/35 bg-[color:var(--danger-bg)] text-[color:var(--danger-text)]",
    dotClassName: "bg-[color:var(--danger-text)]",
  },
};

function OutputFixIssuesPanel({
  actions,
  feedback,
  onApply,
}: {
  actions: FixActionDescriptor[];
  feedback?: string | null;
  onApply?: (id: string) => void;
}) {
  return (
    <div className="mt-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--muted)]">
            Fix Output Issues
          </div>
          <p className="mt-0.5 text-[10px] leading-relaxed text-[color:var(--muted)]">
            Safe actions only. Prompt bodies are not rewritten here.
          </p>
        </div>
        {feedback ? (
          <span className="rounded-full border border-emerald-400/35 bg-[color:var(--success-bg)] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[color:var(--success-text)]">
            Applied
          </span>
        ) : null}
      </div>

      {actions.length ? (
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => onApply?.(action.id)}
              disabled={!onApply || action.disabled}
              className={[
                "rounded-xl border px-3 py-2 text-left transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70",
                action.disabled
                  ? "border-[color:var(--border)] bg-[color:var(--disabled-bg)] text-[color:var(--disabled-text)]"
                  : action.severity === "recommended"
                    ? "border-[rgb(var(--accent-rgb)/0.45)] bg-[rgb(var(--accent-rgb)/0.12)] text-[color:var(--text)] hover:bg-[rgb(var(--accent-rgb)/0.18)]"
                    : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text)] hover:bg-[color:var(--surface-elevated)]",
              ].join(" ")}
            >
              <span className="block text-[11px] font-extrabold">
                {action.label}
              </span>
              <span className="mt-1 block text-[10px] leading-relaxed text-[color:var(--muted)]">
                {action.helper}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-[10px] font-semibold text-[color:var(--muted)]">
          No quick fixes needed.
        </div>
      )}

      {feedback ? (
        <div className="mt-2 rounded-xl border border-emerald-400/25 bg-[color:var(--success-bg)] px-3 py-2 text-[10px] leading-relaxed text-[color:var(--success-text)]">
          {feedback}
        </div>
      ) : null}
    </div>
  );
}
function OutputQualityScorePanel({
  data,
  onFixAction,
  fixFeedback,
}: {
  data: GeneratedPackage;
  onFixAction?: (id: string) => void;
  fixFeedback?: string | null;
}) {
  const report = analyzeGeneratedOutputQuality(data);
  const suggestion = report.items.find(
    (item) => item.status === "fail" || item.status === "caution"
  );
  const fixActions = buildOutputFixActions(report);

  return (
    <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-[color:var(--text)] shadow-[var(--surface-shadow)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--muted)]">
            Output Quality Score
          </div>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[color:var(--muted)]">
            Post-generation copy, packaging, and paste-readiness check. Copy and
            publishing actions stay available.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={[
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em]",
              OUTPUT_QUALITY_OVERALL_TONE[report.overall].className,
            ].join(" ")}
          >
            <span
              className={[
                "h-1.5 w-1.5 rounded-full",
                OUTPUT_QUALITY_OVERALL_TONE[report.overall].dotClassName,
              ].join(" ")}
            />
            {OUTPUT_QUALITY_OVERALL_TONE[report.overall].label}
          </span>
          <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-2.5 py-1 text-[10px] font-bold text-[color:var(--text)]">
            {report.score}/100
          </span>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {report.items.map((item) => {
          const tone = OUTPUT_QUALITY_ITEM_TONE[item.status];

          return (
            <div
              key={item.id}
              className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface-muted)] px-3 py-2.5"
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-[color:var(--text)]">
                  {item.label}
                </span>
                <span
                  className={[
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em]",
                    tone.className,
                  ].join(" ")}
                >
                  <span
                    className={["h-1.5 w-1.5 rounded-full", tone.dotClassName].join(
                      " "
                    )}
                  />
                  {tone.label}
                </span>
              </div>
              <p className="line-clamp-2 text-[10px] leading-relaxed text-[color:var(--muted)]">
                {item.detail}
              </p>
            </div>
          );
        })}
      </div>

      {suggestion && (
        <div className="mt-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-[10px] leading-relaxed text-[color:var(--muted)]">
          Check before publishing: {suggestion.detail}
        </div>
      )}

      <OutputFixIssuesPanel
        actions={fixActions}
        feedback={fixFeedback}
        onApply={onFixAction}
      />
    </section>
  );
}


const ENGINE_QA_STATUS_TONE: Record<
  EngineOutputQaStatus,
  { label: string; className: string; dotClassName: string }
> = OUTPUT_QUALITY_ITEM_TONE;

function engineQaSuggestion(engine: EngineOutputQaEngine) {
  return engine.checks.find(
    (check) => check.status === "fail" || check.status === "caution"
  );
}

function EngineQaPanel({
  data,
  onFixAction,
  fixFeedback,
}: {
  data: GeneratedPackage;
  onFixAction?: (id: string) => void;
  fixFeedback?: string | null;
}) {
  const report = analyzeEngineOutputQa(data);
  const fixActions = buildEngineOutputFixActions(report);

  return (
    <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-[color:var(--text)] shadow-[var(--surface-shadow)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--muted)]">
            Engine QA
          </div>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[color:var(--muted)]">
            Engine-specific paste checks for Runway, Kling, and Seedance. These
            warnings are advisory and never rewrite generated prompts.
          </p>
        </div>
        <span
          className={[
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em]",
            OUTPUT_QUALITY_OVERALL_TONE[report.overall].className,
          ].join(" ")}
        >
          <span
            className={[
              "h-1.5 w-1.5 rounded-full",
              OUTPUT_QUALITY_OVERALL_TONE[report.overall].dotClassName,
            ].join(" ")}
          />
          {OUTPUT_QUALITY_OVERALL_TONE[report.overall].label}
        </span>
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        {report.engines.map((engine) => {
          const tone = ENGINE_QA_STATUS_TONE[engine.status];
          const suggestion = engineQaSuggestion(engine);
          const fixAction = fixActions.find(
            (action) => action.sourceItemId === `engine-qa-${engine.engine}`
          );

          return (
            <div
              key={engine.engine}
              className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface-muted)] p-3"
            >
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-extrabold text-[color:var(--text)]">
                    {engine.label}
                  </div>
                  <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[color:var(--muted)]">
                    {engine.score}/100
                  </div>
                </div>
                <span
                  className={[
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em]",
                    tone.className,
                  ].join(" ")}
                >
                  <span
                    className={[
                      "h-1.5 w-1.5 rounded-full",
                      tone.dotClassName,
                    ].join(" ")}
                  />
                  {tone.label}
                </span>
              </div>

              <div className="space-y-2">
                {engine.checks.slice(0, 5).map((check) => {
                  const checkTone = ENGINE_QA_STATUS_TONE[check.status];

                  return (
                    <div
                      key={check.id}
                      className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-2.5 py-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-[color:var(--text)]">
                          {check.label}
                        </span>
                        <span
                          className={[
                            "h-2 w-2 rounded-full",
                            checkTone.dotClassName,
                          ].join(" ")}
                          aria-label={checkTone.label}
                        />
                      </div>
                      <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-[color:var(--muted)]">
                        {check.detail}
                      </p>
                    </div>
                  );
                })}
              </div>

              {suggestion ? (
                <div className="mt-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-[10px] leading-relaxed text-[color:var(--muted)]">
                  Suggestion: {suggestion.detail}
                </div>
              ) : null}

              {fixAction ? (
                <button
                  type="button"
                  onClick={() => onFixAction?.(fixAction.id)}
                  disabled={!onFixAction}
                  className="mt-3 w-full rounded-xl border border-[rgb(var(--accent-rgb)/0.45)] bg-[rgb(var(--accent-rgb)/0.12)] px-3 py-2 text-left text-[11px] font-extrabold text-[color:var(--text)] transition hover:bg-[rgb(var(--accent-rgb)/0.18)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {fixAction.label}
                  <span className="mt-1 block text-[10px] font-semibold leading-relaxed text-[color:var(--muted)]">
                    {fixAction.helper}
                  </span>
                </button>
              ) : null}
            </div>
          );
        })}
      </div>

      {fixFeedback ? (
        <div className="mt-3 rounded-xl border border-emerald-400/25 bg-[color:var(--success-bg)] px-3 py-2 text-[10px] leading-relaxed text-[color:var(--success-text)]">
          {fixFeedback}
        </div>
      ) : null}
    </section>
  );
}
function StoryModeBadges({ data }: { data: GeneratedPackage }) {
  return (
    <div className="flex flex-wrap gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-3">
      <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-amber-700 dark:text-amber-200">
        Story Mode: {formatBadgeValue(data.storyMode, "Predator Vs Prey")}
      </span>
      <span className="rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-indigo-700 dark:text-indigo-200">
        Viral Lane: {formatBadgeValue(data.viralLane, "Tension")}
      </span>
      <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-700 dark:text-emerald-200">
        Safety: Level {Number(data.violenceLevel ?? 1)}/3
      </span>
    </div>
  );
}

export function OverviewWorkspace({
  data,
  versionKey,
  onRestoreVersion,
  showWorkflowDiagram,
  onToggleWorkflowDiagram,
  onCopy,
  onApplyStoryModePreset,
  onOutputFixAction,
  outputFixFeedback,
}: {
  data: GeneratedPackage;
  versionKey: string;
  onRestoreVersion?: (version: PromptVersion) => void;
  showWorkflowDiagram: boolean;
  onToggleWorkflowDiagram: () => void;
  onCopy: (text: string) => void | Promise<unknown>;
  onApplyStoryModePreset?: (preset: StoryModePreset) => void;
  onOutputFixAction?: (id: string) => void;
  outputFixFeedback?: string | null;
}) {
  return (
    <div className="space-y-6">
      <StoryModeBadges data={data} />

      <OutputQualityScorePanel
        data={data}
        onFixAction={onOutputFixAction}
        fixFeedback={outputFixFeedback}
      />

      <EngineQaPanel
        data={data}
        onFixAction={onOutputFixAction}
        fixFeedback={outputFixFeedback}
      />

      <WSTVCreatorGuideCard />

      <StoryModeQACard data={data} />

      <FacebookReelsOptimizerCard data={data} onCopy={onCopy} />

      <ReelsPerformanceCard data={data} />

      <ReelsPerformanceInsightsCard />

      <LocalCreatorDataCard onCopy={onCopy} />

      <AutoRecommendationsCard
        data={data}
        onCopy={onCopy}
        onApplyStoryModePreset={onApplyStoryModePreset}
      />

      <ABExperimentTrackerCard data={data} />

      <EngineSpecsPanel />

      <div className="rounded-lg border border-sky-500/30 bg-sky-500/12 p-3 text-xs text-sky-800 dark:text-sky-200">
        Meta Reels export: 9:16 vertical, audio on, and keep important text
        inside the safe zone.
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionLabel label="WSTV Pipeline — Node Graph" />
        <button
          type="button"
          onClick={onToggleWorkflowDiagram}
          className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] px-4 py-2 text-xs font-extrabold text-[color:var(--text)] hover:bg-[color:var(--surface-muted)] active:scale-95"
        >
          {showWorkflowDiagram ? "Hide Diagram" : "Show Diagram"}
        </button>
      </div>
      {showWorkflowDiagram ? (
        <WSTVWorkflowDiagram data={data} onCopy={onCopy} />
      ) : (
        <div className="rounded-xl border border-dashed border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 text-sm text-[color:var(--muted)]">
          Node graph hidden by default. Click &quot;Show Diagram&quot; to open
          it.
        </div>
      )}

      <SectionLabel label="WSTV Workflow Prompt Map" />
      <WorkflowPromptMap data={data} onCopy={onCopy} />

      {versionKey && (
        <>
          <SectionLabel label="🕘 Prompt Versions" />
          <PromptVersionsPanel
            versionKey={versionKey}
            onRestoreVersion={onRestoreVersion}
          />
        </>
      )}
    </div>
  );
}
