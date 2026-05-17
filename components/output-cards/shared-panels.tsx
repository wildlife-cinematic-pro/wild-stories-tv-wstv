"use client";

import { useState } from "react";

import type { GeneratedPackage, StructuredPrompt } from "@/types";

import { buildLegacyPromptCard } from "@/components/output-cards/prompt-utils";

export function EngineSpecsPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-[color:var(--text)]">
            ⚙️ Engine Specs (Runway + Kling workflow notes)
          </span>
          <span className="rounded border border-[#d9a94f]/35 bg-[#d9a94f]/10 px-2 py-0.5 text-xs font-bold text-[#f3c766]">
            Runway Gen-4.5
          </span>
          <span className="rounded border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 text-xs font-bold text-cyan-200">
            Kling 3.0
          </span>
        </div>
        <button
          onClick={() => setOpen((value) => !value)}
          className="wstv-copy-button wstv-copy-button-secondary rounded-lg px-3 py-1.5 text-xs font-semibold active:scale-95"
          type="button"
        >
          {open ? "Hide ▲" : "Show ▼"}
        </button>
      </div>

      {open && (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-[#d9a94f]/25 bg-[#111207]/80 p-3">
            <p className="mb-2 text-xs font-extrabold text-[#f3c766]">
              🟢 Runway Gen-4.5 (Official)
            </p>
            <div className="space-y-1.5 text-xs text-[color:var(--muted)]">
              <p>
                <span className="font-bold">FPS:</span> 24 or 25 only
              </p>
              <p>
                <span className="font-bold">Duration:</span> 2–10 seconds
              </p>
              <p>
                <span className="font-bold">Output:</span> 720p (built-in 4K
                upscale)
              </p>
              <p>
                <span className="font-bold">I2V Rule:</span> MOTION-ONLY. Image
                carries identity.
              </p>
              <p>
                <span className="font-bold">Negative Prompts:</span> ❌ NOT
                supported
              </p>
              <p>
                <span className="font-bold">Structure:</span> [Camera] [subject]
                [action] in [env]
              </p>
              <p>
                <span className="font-bold">Chaining:</span> Use last-frame
                chaining only when the outgoing shot ends on a clean full-body
                handoff frame. Otherwise reuse the same master still or a
                manually selected clean frame.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-cyan-400/25 bg-cyan-500/10 p-3">
            <p className="mb-2 text-xs font-extrabold text-cyan-100">
              🔵 Kling 3.0 (Current WSTV action workflow)
            </p>
            <div className="space-y-1.5 text-xs text-[color:var(--muted)]">
              <p>
                <span className="font-bold">Role:</span> WSTV action-focused
                workflow engine
              </p>
              <p>
                <span className="font-bold">Use case:</span> Full-body physics,
                strike beats, multi-shot experiments
              </p>
              <p>
                <span className="font-bold">Prompting:</span> Director-style
                narrative paste-ready prompts in WSTV, with structured
                breakdown kept for reference
              </p>
              <p>
                <span className="font-bold">Negative prompts:</span> Used in
                WSTV Kling workflow
              </p>
              <p>
                <span className="font-bold">Identity workflow:</span>{" "}
                Reference-led continuity / Bind Subject workflow
              </p>
              <p>
                <span className="font-bold">Status:</span> Current WSTV Kling
                workflow reference
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ProShotCard({
  engine,
  index,
  shot,
  prompt,
  onCopy,
}: {
  engine: "runway" | "kling" | "seedance";
  index: number;
  shot: string;
  prompt?: StructuredPrompt;
  onCopy: (text: string) => void;
}) {
  const isRunway = engine === "runway";
  const isSeedance = engine === "seedance";
  const promptCard = prompt ?? buildLegacyPromptCard(engine, shot);
  const pasteReady = promptCard.pasteReady;
  const audioPrompt = !isRunway && !isSeedance ? promptCard.audio ?? "" : "";
  const motionIntensity =
    typeof promptCard.metadata?.motionIntensity === "number"
      ? promptCard.metadata.motionIntensity
      : null;
  const borderColor = isRunway
    ? "border-[#d9a94f]/35"
    : isSeedance
      ? "border-cyan-400/30"
      : "border-cyan-400/30";
  const btnColor = isRunway
    ? "border border-cyan-400/35 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/15"
    : isSeedance
      ? "border border-cyan-400/35 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/15"
      : "border border-cyan-400/35 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/15";
  const engineLabel = isRunway ? "Runway" : isSeedance ? "Seedance" : "Kling";
  const primaryCopyLabel = isRunway
    ? "Copy Runway I2V"
    : isSeedance
      ? "Copy Seedance Prompt"
      : "Copy Kling Prompt";
  const copyConfidenceLabel = isRunway
    ? "Motion only • no negative prompt"
    : isSeedance
      ? "Simple motion • refs optional"
      : "Director prompt • negative allowed";
  const fullCardText = promptCard.fullText || shot || "";
  const showReferenceText = Boolean(
    fullCardText.trim() && fullCardText.trim() !== pasteReady.trim()
  );
  const [showFullCard, setShowFullCard] = useState(false);

  return (
    <div className={`wstv-readable-card min-w-0 max-w-full overflow-hidden rounded-xl border ${borderColor} p-3`}>
      <div className="mb-2 flex min-w-0 flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <div className="break-words text-xs font-extrabold text-[color:var(--text)]">
            🎬 {engineLabel} Shot {index + 1}
          </div>
          {motionIntensity !== null && (
            <span className="rounded-full border border-[#d9a94f]/30 bg-[#d9a94f]/10 px-2 py-0.5 text-[10px] font-bold text-[#f3c766]">
              MI: {motionIntensity.toFixed(2)}
            </span>
          )}
          <span className="rounded-full bg-[color:var(--surface-muted)] px-1.5 py-0.5 text-[10px] font-bold text-[color:var(--muted)] ring-1 ring-[color:var(--border)]">
            {copyConfidenceLabel}
          </span>
        </div>

        <div className="grid w-full min-w-0 grid-cols-1 gap-1 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
          <button
            type="button"
            onClick={() => onCopy(pasteReady)}
            className={`w-full rounded-xl px-3 py-1.5 text-[11px] font-bold active:scale-95 sm:w-auto ${btnColor}`}
            title="Copy paste-ready prompt only"
          >
            {primaryCopyLabel}
          </button>

          <button
            type="button"
            onClick={() => onCopy(fullCardText)}
            className="wstv-copy-button wstv-copy-button-secondary w-full rounded px-2 py-1 text-[11px] font-bold active:scale-95 sm:w-auto"
            title="Copy full card with reference notes"
          >
            Copy Full Card
          </button>
        </div>
      </div>

      <div className="wstv-prompt-body rounded-lg p-2">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="wstv-status-badge rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide">
            PASTE THIS ONLY
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--muted)]">
            {primaryCopyLabel}
          </span>
        </div>
        <pre className="max-w-full whitespace-pre-wrap break-words text-xs leading-relaxed text-[color:var(--text)] [overflow-wrap:anywhere]">
          {pasteReady || "—"}
        </pre>
      </div>

      {showReferenceText && (
        <div className="mt-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-elevated)]">
          <button
            type="button"
            onClick={() => setShowFullCard((value) => !value)}
            className="flex w-full min-w-0 items-center justify-between gap-2 px-2 py-1.5 text-left"
          >
            <span className="rounded-full bg-[color:var(--surface-muted)] px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[color:var(--muted)] ring-1 ring-[color:var(--border)]">
              REFERENCE / FULL CARD
            </span>
            <span className="shrink-0 text-[10px] font-bold text-[color:var(--muted)]">
              {showFullCard ? "Hide" : "Show"}
            </span>
          </button>
          {showFullCard && (
            <pre className="max-w-full whitespace-pre-wrap break-words border-t border-[color:var(--border)] px-2 py-2 text-xs leading-relaxed text-[color:var(--text)] [overflow-wrap:anywhere]">
              {fullCardText}
            </pre>
          )}
        </div>
      )}

      {audioPrompt && (
        <div className="mt-2 min-w-0 max-w-full overflow-hidden rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-2">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-[color:var(--info-text)]">
              🔊 Audio Prompt
            </span>
            <button
              type="button"
              onClick={() => onCopy(audioPrompt)}
              className="rounded-lg border border-cyan-400/35 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-100 hover:bg-cyan-500/15 active:scale-95"
            >
              Copy Audio
            </button>
          </div>
          <p className="mt-1 break-words text-[11px] leading-relaxed text-[color:var(--text)] [overflow-wrap:anywhere]">
            {audioPrompt}
          </p>
        </div>
      )}
    </div>
  );
}

export function Card({
  title,
  value,
  onCopy,
  accent,
  aiEnhanced,
  extraActions,
  copyLabel,
  className,
  valueClassName,
  copyButtonClassName,
}: {
  title: string;
  value: string;
  onCopy: (text: string) => void;
  accent?: string;
  aiEnhanced?: boolean;
  extraActions?: { label: string; onClick: () => void; className?: string }[];
  copyLabel?: string;
  className?: string;
  valueClassName?: string;
  copyButtonClassName?: string;
}) {
  return (
    <div
      className={`wstv-readable-card min-w-0 max-w-full overflow-hidden rounded-xl border p-4 ${
        accent ? `border-l-4 ${accent}` : "border-[color:var(--border)]"
      } ${aiEnhanced ? "ring-1 ring-cyan-400/25" : ""} ${className ?? ""}`}
    >
      <div className="mb-3 flex min-w-0 flex-wrap items-start justify-between gap-3">
        <h2 className="flex min-w-0 items-center gap-2 break-words font-bold text-[color:var(--text)] [overflow-wrap:anywhere]">
          {title}
          {aiEnhanced && (
            <span className="text-xs font-normal text-cyan-300">✦ AI</span>
          )}
        </h2>
        <div className="grid w-full min-w-0 grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
          {extraActions?.map((action) => (
            <button
              key={action.label}
              className={
                action.className ??
                "wstv-copy-button wstv-copy-button-secondary rounded px-3 py-1 text-sm font-semibold active:scale-95"
              }
              onClick={action.onClick}
              type="button"
            >
              {action.label}
            </button>
          ))}
          <button
            className={
              copyButtonClassName ??
              "wstv-copy-button wstv-copy-button-primary w-full rounded px-3 py-1 text-sm font-semibold active:scale-95 sm:w-auto"
            }
            onClick={() => onCopy(value)}
            type="button"
          >
            {copyLabel ?? "Copy"}
          </button>
        </div>
      </div>
      <p
        className={`wstv-prompt-body max-w-full whitespace-pre-wrap break-words text-xs leading-relaxed [overflow-wrap:anywhere] ${
          valueClassName ?? ""
        }`}
      >
        {value || <span className="italic text-[color:var(--muted)]">Generate गर्नुस्...</span>}
      </p>
    </div>
  );
}

export function ShotImagePlanPanel({
  plans,
  onCopy,
}: {
  plans: NonNullable<GeneratedPackage["shotImagePlan"]>;
  onCopy: (text: string) => void;
}) {
  return (
    <div className="wstv-readable-card min-w-0 max-w-full overflow-hidden rounded-xl border p-4">
      <div className="mb-3 flex min-w-0 flex-wrap items-center gap-2">
        <span className="break-words text-sm font-bold text-[color:var(--text)]">
          🖼️ 4-Shot Image Plan
        </span>
        <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
          1 master image → 4 edited shot images
        </span>
      </div>

      <p className="mb-3 break-words text-xs leading-5 text-[color:var(--muted)] [overflow-wrap:anywhere]">
        Generate one master hero image first. Then create each shot image by
        editing from the master or the previous shot image instead of starting
        from scratch.
      </p>

      <div className="space-y-3">
        {plans.map((plan, index) => (
          <div
            key={`${plan.title}-${index}`}
            className="min-w-0 max-w-full overflow-hidden rounded-lg border border-amber-200 bg-[color:var(--surface-elevated)] p-3"
          >
            <div className="mb-2 flex min-w-0 flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="break-words text-xs font-extrabold text-[color:var(--text)] [overflow-wrap:anywhere]">
                  {plan.title}
                </span>
                <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-[color:var(--muted)]">
                  Source:{" "}
                  {plan.source === "master"
                    ? "Master image"
                    : "Previous shot image"}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onCopy(plan.prompt)}
                className="wstv-copy-button wstv-copy-button-primary w-full rounded px-2 py-1 text-[11px] font-bold active:scale-95 sm:w-auto"
              >
                Copy
              </button>
            </div>

            <pre className="wstv-prompt-body max-w-full whitespace-pre-wrap break-words text-xs leading-relaxed [overflow-wrap:anywhere]">
              {plan.prompt}
            </pre>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() =>
          onCopy(
            plans
              .map(
                (plan, index) =>
                  `IMAGE ${index + 1} — ${plan.title}\nSource: ${
                    plan.source === "master"
                      ? "Master image"
                      : "Previous shot image"
                  }\n${plan.prompt}`
              )
              .join("\n\n---\n\n")
          )
        }
        className="mt-3 w-full rounded-lg bg-amber-700 py-2 text-sm font-bold text-white hover:bg-amber-800 active:scale-95"
      >
        Copy All 4 Image Prompts
      </button>
    </div>
  );
}

export function SectionLabel({ label }: { label: string }) {
  return (
    <div className="mb-3 mt-8 flex min-w-0 items-center gap-3">
      <span className="text-xs font-bold uppercase tracking-widest text-[color:var(--muted)]">
        {label}
      </span>
      <div className="h-px min-w-0 flex-1 bg-[color:var(--border)]" />
    </div>
  );
}

export function WorkspaceTabButton({
  tabKey,
  tabId,
  panelId,
  label,
  detail,
  badge,
  active,
  onClick,
}: {
  tabKey?: string;
  tabId: string;
  panelId: string;
  label: string;
  detail: string;
  badge: string;
  active: boolean;
  onClick: () => void;
}) {
  const accents: Record<string, { active: string; idle: string; chip: string }> = {
    Overview: {
      active: "border-[#d9a94f]/45 bg-[#d9a94f]/16 text-[#f3c766] shadow-sm shadow-[#d9a94f]/10",
      idle: "border-[color:var(--border)] bg-[color:var(--surface-elevated)] text-[color:var(--muted)] hover:border-[color:var(--border)] hover:bg-[color:var(--surface-muted)]",
      chip: "border border-white/10 bg-white/8 text-[#c9d2bd]",
    },
    Prompts: {
      active: "border-[#d9a94f]/50 bg-[#d9a94f] text-[#111207] shadow-sm shadow-[#d9a94f]/20",
      idle: "border-[#4b3816] bg-[#1a1307] text-[#f3c766] hover:border-[#d9a94f]/50 hover:bg-[#211806]",
      chip: "border border-[#d9a94f]/25 bg-[#d9a94f]/12 text-[#f3c766]",
    },
    Video: {
      active: "border-cyan-300/45 bg-cyan-500/20 text-cyan-100 shadow-sm shadow-cyan-900/20",
      idle: "border-cyan-400/25 bg-cyan-500/10 text-cyan-100 hover:border-cyan-300/50 hover:bg-cyan-500/15",
      chip: "border border-cyan-400/25 bg-cyan-500/10 text-cyan-100",
    },
    Direct: {
      active: "border-violet-300/45 bg-violet-500/20 text-violet-100 shadow-sm shadow-violet-900/20",
      idle: "border-violet-400/25 bg-violet-500/10 text-violet-100 hover:border-violet-300/50 hover:bg-violet-500/15",
      chip: "border border-violet-400/25 bg-violet-500/10 text-violet-100",
    },
    Publishing: {
      active: "border-rose-300/45 bg-rose-500/20 text-rose-100 shadow-sm shadow-rose-900/20",
      idle: "border-rose-400/25 bg-rose-500/10 text-rose-100 hover:border-rose-300/50 hover:bg-rose-500/15",
      chip: "border border-rose-400/25 bg-rose-500/10 text-rose-100",
    },
    Advanced: {
      active: "border-emerald-300/45 bg-emerald-500/20 text-emerald-100 shadow-sm shadow-emerald-900/20",
      idle: "border-emerald-400/25 bg-emerald-500/10 text-emerald-100 hover:border-emerald-300/50 hover:bg-emerald-500/15",
      chip: "border border-emerald-400/25 bg-emerald-500/10 text-emerald-100",
    },
  };
  const accent = accents[label] ?? accents.Overview;

  return (
    <button
      id={tabId}
      type="button"
      role="tab"
      tabIndex={active ? 0 : -1}
      onClick={onClick}
      data-workspace-tab={tabKey}
      aria-selected={active}
      aria-controls={panelId}
      aria-label={`${label} workspace`}
      className={`min-w-[180px] flex-none snap-start rounded-2xl border px-3 py-3 text-left transition sm:min-w-[190px] sm:px-4 ${
        active ? accent.active : accent.idle
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-extrabold">{label}</div>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
            active ? "bg-[color:var(--surface-elevated)]/15 text-white" : accent.chip
          }`}
        >
          {badge}
        </span>
      </div>
      <div
        className={`mt-1 text-xs leading-relaxed ${
          active ? "text-white/80" : "text-[color:var(--muted)]"
        }`}
      >
        {detail}
      </div>
    </button>
  );
}

export function WorkspaceJumpCard({
  eyebrow,
  title,
  detail,
  footer,
  active,
  onClick,
}: {
  eyebrow: string;
  title: string;
  detail: string;
  footer: string;
  active: boolean;
  onClick: () => void;
}) {
  const accents: Record<string, { active: string; idle: string; eyebrow: string }> = {
    Story: {
      active: "border-[#d9a94f]/45 bg-[#d9a94f]/16 text-[#f3c766] shadow-sm shadow-[#d9a94f]/10",
      idle: "border-[color:var(--border)] bg-[color:var(--surface-elevated)]/90 text-[color:var(--text)] hover:-translate-y-0.5 hover:border-[color:var(--border)] hover:shadow-sm",
      eyebrow: "text-[color:var(--muted)]",
    },
    Prompts: {
      active: "border-[#d9a94f]/50 bg-[#d9a94f] text-[#111207] shadow-sm shadow-[#d9a94f]/20",
      idle: "border-[#4b3816] bg-[#1a1307] text-[#f3c766] hover:-translate-y-0.5 hover:border-[#d9a94f]/50 hover:shadow-sm",
      eyebrow: "text-[#f3c766]",
    },
    Video: {
      active: "border-cyan-300/45 bg-cyan-500/20 text-cyan-100 shadow-sm shadow-cyan-900/20",
      idle: "border-cyan-400/25 bg-cyan-500/10 text-cyan-100 hover:-translate-y-0.5 hover:border-cyan-300/50 hover:shadow-sm",
      eyebrow: "text-cyan-200",
    },
    Direct: {
      active: "border-violet-300/45 bg-violet-500/20 text-violet-100 shadow-sm shadow-violet-900/20",
      idle: "border-violet-400/25 bg-violet-500/10 text-violet-100 hover:-translate-y-0.5 hover:border-violet-300/50 hover:shadow-sm",
      eyebrow: "text-violet-200",
    },
    Publishing: {
      active: "border-rose-300/45 bg-rose-500/20 text-rose-100 shadow-sm shadow-rose-900/20",
      idle: "border-rose-400/25 bg-rose-500/10 text-rose-100 hover:-translate-y-0.5 hover:border-rose-300/50 hover:shadow-sm",
      eyebrow: "text-rose-200",
    },
    Advanced: {
      active: "border-emerald-300/45 bg-emerald-500/20 text-emerald-100 shadow-sm shadow-emerald-900/20",
      idle: "border-emerald-400/25 bg-emerald-500/10 text-emerald-100 hover:-translate-y-0.5 hover:border-emerald-300/50 hover:shadow-sm",
      eyebrow: "text-emerald-200",
    },
  };
  const accent = accents[eyebrow] ?? accents.Story;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-0 max-w-full overflow-hidden rounded-2xl border p-4 text-left transition ${
        active ? accent.active : accent.idle
      }`}
    >
      <div
        className={`text-[11px] font-black uppercase tracking-[0.18em] ${
          active ? "text-white/60" : accent.eyebrow
        }`}
      >
        {eyebrow}
      </div>
      <div className="mt-2 text-lg font-black">{title}</div>
      <p
        className={`mt-2 text-sm leading-relaxed ${
          active ? "text-white/80" : "text-[color:var(--muted)]"
        }`}
      >
        {detail}
      </p>
      <div
        className={`mt-4 text-xs font-extrabold uppercase tracking-wide ${
          active ? "text-white" : "text-[color:var(--muted)]"
        }`}
      >
        {footer}
      </div>
    </button>
  );
}
