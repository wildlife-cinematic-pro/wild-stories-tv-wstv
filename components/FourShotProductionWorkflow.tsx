"use client";

import { useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShotImagePlanEntry {
  shotNumber?: number;
  label?: string;
  prompt?: string;
  imagePrompt?: string;
  source?: string;
  description?: string;
  [key: string]: unknown;
}

interface WorkflowShot {
  shotNumber?: number;
  engine?: string;
  prompt?: string;
  videoPrompt?: string;
  label?: string;
  [key: string]: unknown;
}

interface WSTVData {
  imagePrompt?: string;
  shotImagePlan?: ShotImagePlanEntry[] | Record<string, ShotImagePlanEntry>;
  [key: string]: unknown;
}

interface StructuredPrompts {
  workflowShots?: WorkflowShot[] | Record<string, WorkflowShot>;
  [key: string]: unknown;
}

interface FourShotProductionWorkflowProps {
  data?: WSTVData;
  structuredPrompts?: StructuredPrompts;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ENGINE_MAP: Record<number, { name: string; short: string; color: string; bg: string; border: string }> = {
  1: { name: "Runway Gen-4.5", short: "Runway I2V", color: "text-violet-300", bg: "bg-violet-950/40", border: "border-violet-500/40" },
  2: { name: "Kling 3.0 Pro",  short: "Kling 3.0",  color: "text-cyan-300",   bg: "bg-cyan-950/40",   border: "border-cyan-500/40"   },
  3: { name: "Kling 3.0 Pro",  short: "Kling 3.0",  color: "text-cyan-300",   bg: "bg-cyan-950/40",   border: "border-cyan-500/40"   },
  4: { name: "Runway Gen-4.5", short: "Runway I2V", color: "text-violet-300", bg: "bg-violet-950/40", border: "border-violet-500/40" },
};

const SOURCE_LABELS: Record<number, string> = {
  1: "Source: Master image",
  2: "Source: Shot 1 image (prev)",
  3: "Source: Shot 2 image (prev)",
  4: "Source: Shot 3 image (prev)",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toArray<T>(value: T[] | Record<string, T> | undefined): T[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return Object.values(value);
}

function extractPrompt(entry: ShotImagePlanEntry | WorkflowShot | undefined): string {
  if (!entry) return "";
  return (
    (entry as ShotImagePlanEntry).prompt ||
    (entry as ShotImagePlanEntry).imagePrompt ||
    (entry as WorkflowShot).videoPrompt ||
    ""
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text.trim();
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      disabled={!text.trim()}
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold
        transition-all duration-200 select-none
        ${copied
          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
          : text.trim()
            ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 hover:border-amber-400/50 active:scale-95 cursor-pointer"
            : "bg-zinc-800/50 text-zinc-600 border border-zinc-700/40 cursor-not-allowed opacity-50"
        }
      `}
    >
      {copied ? (
        <>
          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
            <rect x="4" y="1" width="7" height="8" rx="1" stroke="currentColor" strokeWidth="1.2"/>
            <rect x="1" y="3" width="7" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none"/>
          </svg>
          {label}
        </>
      )}
    </button>
  );
}

function StepBadge({ step, label }: { step: number; label: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-900/30">
        <span className="text-xs font-black text-amber-950">{step}</span>
      </div>
      <span className="text-xs font-bold tracking-widest uppercase text-amber-400/90">{label}</span>
    </div>
  );
}

function PromptBlock({ prompt, emptyMsg = "No prompt available" }: { prompt: string; emptyMsg?: string }) {
  return (
    <div className={`
      rounded-md px-3 py-2.5 text-xs leading-relaxed font-mono
      border min-h-[48px]
      ${prompt.trim()
        ? "bg-zinc-900/70 border-zinc-700/50 text-zinc-300"
        : "bg-zinc-900/30 border-zinc-800/40 text-zinc-600 italic"
      }
    `}>
      {prompt.trim() || emptyMsg}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function FourShotProductionWorkflow({
  data,
  structuredPrompts,
}: FourShotProductionWorkflowProps) {

  const masterImagePrompt = data?.imagePrompt?.trim() ?? "";
  const shotImagePlanArr  = toArray(data?.shotImagePlan);
  const workflowShotsArr  = toArray(structuredPrompts?.workflowShots);

  // Guard: only render if there's at least something to show
  const hasAnyContent =
    masterImagePrompt ||
    shotImagePlanArr.length > 0 ||
    workflowShotsArr.length > 0;

  if (!hasAnyContent) {
    return (
      <div className="rounded-xl border border-amber-500/15 bg-zinc-900/40 p-5 text-center">
        <p className="text-xs text-zinc-500 italic">
          Generate a scene above to unlock the 4-Shot Production Workflow.
        </p>
      </div>
    );
  }

  // ── Step 3 mapping rows ──────────────────────────────────────────────────
  const mappingRows = [1, 2, 3, 4].map((n) => {
    const shot  = workflowShotsArr[n - 1];
    const eng   = ENGINE_MAP[n];
    const label = shot?.label ?? `Shot ${n}`;
    return { n, eng, label };
  });

  return (
    <section className="rounded-xl border border-amber-500/20 bg-zinc-950/60 overflow-hidden shadow-xl shadow-black/40">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-amber-500/15 bg-gradient-to-r from-amber-950/30 via-zinc-950/0 to-indigo-950/20">
        <div className="flex items-center gap-2.5">
          <span className="text-lg leading-none">🖼️</span>
          <div>
            <h3 className="text-sm font-bold text-amber-300 tracking-wide">
              4-Shot Production Workflow
            </h3>
            <p className="text-[10px] text-zinc-500 mt-0.5 tracking-wide uppercase">
              Manual · Image-First · Continuity-Safe
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-6">

        {/* ═══════════════════════════════════════════════════════════════
            STEP 1 — Master Image
        ════════════════════════════════════════════════════════════════ */}
        <div className="rounded-lg border border-indigo-500/20 bg-indigo-950/15 p-4">
          <StepBadge step={1} label="Generate Master Image" />

          <p className="text-[10px] text-zinc-500 mb-2.5 leading-relaxed">
            Use this prompt in your image generator (Midjourney, Flux, etc.) to create a
            single canonical master reference. This anchors identity across all 4 shots.
          </p>

          <PromptBlock
            prompt={masterImagePrompt}
            emptyMsg="Master image prompt not found — ensure imagePrompt is populated."
          />

          <div className="flex justify-end mt-2">
            <CopyButton text={masterImagePrompt} label="Copy Master Prompt" />
          </div>
        </div>

        {/* Divider with flow arrow */}
        <FlowArrow label="Use master image as reference →" />

        {/* ═══════════════════════════════════════════════════════════════
            STEP 2 — 4 Shot Images
        ════════════════════════════════════════════════════════════════ */}
        <div className="rounded-lg border border-amber-500/20 bg-amber-950/10 p-4">
          <StepBadge step={2} label="Generate 4 Shot Images Sequentially" />

          <p className="text-[10px] text-zinc-500 mb-3 leading-relaxed">
            Generate each shot in order. Each image feeds the next as a reference source
            for maximum anatomy and identity continuity.
          </p>

          <div className="space-y-3">
            {[1, 2, 3, 4].map((n) => {
              const entry  = shotImagePlanArr[n - 1];
              const prompt = extractPrompt(entry);
              const source = SOURCE_LABELS[n];

              return (
                <div
                  key={n}
                  className="rounded-md border border-zinc-700/40 bg-zinc-900/50 p-3"
                >
                  {/* Shot header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-[10px] font-bold text-amber-400 flex-shrink-0">
                        {n}
                      </span>
                      <span className="text-xs font-semibold text-zinc-200">
                        {entry?.label ?? `Shot ${n} Image`}
                      </span>
                    </div>
                    <CopyButton text={prompt} label="Copy Image Prompt" />
                  </div>

                  {/* Source badge */}
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-[9px] uppercase tracking-widest font-semibold text-indigo-400/70 border border-indigo-500/20 bg-indigo-950/30 rounded px-1.5 py-0.5">
                      {source}
                    </span>
                  </div>

                  {/* Prompt */}
                  <PromptBlock
                    prompt={prompt}
                    emptyMsg={`Shot ${n} image prompt not available — check shotImagePlan data.`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <FlowArrow label="Plug images into hybrid video prompts →" />

        {/* ═══════════════════════════════════════════════════════════════
            STEP 3 — Hybrid Workflow Mapping
        ════════════════════════════════════════════════════════════════ */}
        <div className="rounded-lg border border-indigo-500/20 bg-indigo-950/10 p-4">
          <StepBadge step={3} label="Use Images in Hybrid 4-Shot Video Workflow" />

          <p className="text-[10px] text-zinc-500 mb-3 leading-relaxed">
            Each image you just generated maps directly to one hybrid video shot.
            Upload the corresponding image into the correct engine below.
          </p>

          <div className="space-y-2">
            {mappingRows.map(({ n, eng, label }) => (
              <div
                key={n}
                className={`flex items-center gap-2 rounded-md border px-3 py-2 ${eng.border} ${eng.bg}`}
              >
                {/* Left: Image badge */}
                <div className="flex-shrink-0 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-[10px] font-bold text-amber-400">
                    {n}
                  </span>
                  <span className="text-[10px] font-semibold text-zinc-400 whitespace-nowrap">
                    Image {n}
                  </span>
                </div>

                {/* Arrow */}
                <svg className="w-3 h-3 text-zinc-600 flex-shrink-0" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>

                {/* Right: Hybrid shot */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[10px] font-semibold text-zinc-300 whitespace-nowrap">
                    Hybrid Shot {n}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${eng.border} ${eng.color} ${eng.bg} whitespace-nowrap`}>
                    {eng.short}
                  </span>
                </div>

                {/* Label overflow */}
                {label && label !== `Shot ${n}` && (
                  <span className="text-[9px] text-zinc-600 truncate min-w-0 hidden sm:block">
                    {label}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Workflow Note ───────────────────────────────────────────── */}
        <div className="rounded-md border border-zinc-700/30 bg-zinc-900/30 px-4 py-3 flex gap-2.5">
          <span className="text-base flex-shrink-0 mt-0.5">💡</span>
          <p className="text-[10px] leading-relaxed text-zinc-400">
            <span className="font-semibold text-zinc-300">Workflow note: </span>
            Generate each image sequentially for maximum continuity, stable anatomy, and
            identity preservation before using the Hybrid 4-shot video workflow.
          </p>
        </div>

      </div>
    </section>
  );
}

// ─── Flow Arrow ───────────────────────────────────────────────────────────────

function FlowArrow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent" />
      <div className="flex items-center gap-1.5 px-2">
        <svg className="w-3 h-3 text-amber-500/60" viewBox="0 0 12 12" fill="none">
          <path d="M6 1v10M3 8l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-[9px] uppercase tracking-widest font-semibold text-zinc-600 whitespace-nowrap">
          {label}
        </span>
      </div>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent" />
    </div>
  );
}
