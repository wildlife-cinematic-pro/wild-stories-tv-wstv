"use client";

// ─────────────────────────────────────────────────────────────
// components/OutputCards.tsx
// WSTV — All Output Panel Components + 6-Step Workflow Prompt Map
//
// Contains every display panel rendered after Generate:
//   Card, SectionLabel, SkeletonCard
//   FiveShotPanel, Hook2026Panel, Caption2026Panel
//   PostingTimesPanel, WatchTimePanel
//   CapCutScriptPanel, AnimalBehaviorPanel, SoundDesignPanel
//   PlatformPackPanel, BulkGeneratePanel, VersionControlPanel
//   WorkflowPromptMap (6-Step pipeline tracker)
//
// All panels receive data + onCopy via props.
// Zero prompt building logic here — import from lib/ for that.
// ─────────────────────────────────────────────────────────────

import { useMemo, useRef, useState } from "react";

import PromptVersionsPanel from "@/components/PromptVersionsPanel";
import { downloadText } from "@/lib/storage";
import WSTVWorkflowDiagram from "@/components/WSTVWorkflowDiagram";

import type {
  FiveShotPlan,
  WatchTimeReport,
  CapCutScript,
  AnimalBehavior,
  SoundDesignPack,
  PlatformPack,
  PlatformTarget,
  BulkItem,
  PromptVersion,
  GeneratedPackage,
} from "@/types";

import { extractMotionOnlyPrompt } from "@/lib/workflow-packs";
import {
  getUSAPostingTimes,
  getCMPEarningsTable,
} from "@/lib/predator-data";

function extractRunwayPasteReady(shotText: string): string {
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

function extractKlingPromptBody(shotText: string): string {
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
        afterMarker.indexOf("\nAudio:"),
        afterMarker.indexOf("\n\nAudio:"),
        afterMarker.indexOf("\nKling settings:"),
        afterMarker.indexOf("\n\nKling settings:"),
        afterMarker.indexOf("\n────────────────────────────────"),
        afterMarker.indexOf("\n─── FULL BREAKDOWN (reference only)"),
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

function extractSeedancePromptBody(shotText: string): string {
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

function extractImagePromptBody(promptText: string): string {
  return String(promptText ?? "").trim();
}

function extractKlingAudioPrompt(shotText: string): string {
  const m = String(shotText ?? "").match(
    /\nAudio:\s*([\s\S]*?)(?:\n\s*Kling settings:|$)/i
  );
  return m?.[1]?.trim() ?? "";
}

// === NEW: Engine Specs Panel ===

export function EngineSpecsPanel() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-gray-900">
            ⚙️ Engine Specs (Runway + Kling workflow notes)
          </span>
          <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
            Runway Gen-4.5
          </span>
          <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
            Kling 3.0
          </span>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 active:scale-95"
          type="button"
        >
          {open ? "Hide ▲" : "Show ▼"}
        </button>
      </div>
      {open && (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-green-200 bg-green-50 p-3">
            <p className="mb-2 text-xs font-extrabold text-green-900">
              🟢 Runway Gen-4.5 (Official)
            </p>
            <div className="space-y-1.5 text-xs text-green-800">
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
  <span className="font-bold">Chaining:</span> Use last-frame chaining only when the outgoing shot ends on a clean full-body handoff frame. Otherwise reuse the same master still or a manually selected clean frame.
</p>
            </div>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
            <p className="mb-2 text-xs font-extrabold text-blue-900">
              🔵 Kling 3.0 (Current WSTV action workflow)
            </p>
            <div className="space-y-1.5 text-xs text-blue-800">
              <p>
                <span className="font-bold">Role:</span> WSTV action-focused
                workflow engine
              </p>
              <p>
                <span className="font-bold">Use case:</span> Full-body physics,
                strike beats, multi-shot experiments
              </p>
              <p>
  <span className="font-bold">Prompting:</span> Director-style narrative paste-ready prompts in WSTV, with structured breakdown kept for reference
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
              <span className="font-bold">Status:</span> Current WSTV Kling workflow reference
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// === NEW: Pro Shot Card (Copy FULL / Copy BODY / Audio) ===

function ProShotCard({
  engine,
  index,
  shot,
  onCopy,
}: {
  engine: "runway" | "kling" | "seedance";
  index: number;
  shot: string;
  onCopy: (t: string) => void;
}) {
  const isRunway = engine === "runway";
  const isSeedance = engine === "seedance";
  const pasteReady = isRunway
    ? extractRunwayPasteReady(shot)
    : isSeedance
      ? extractSeedancePromptBody(shot)
      : extractKlingPromptBody(shot);

  const audioPrompt = !isRunway && !isSeedance ? extractKlingAudioPrompt(shot) : "";
  const miMatch = shot.match(/Motion intensity:\s*([\d.]+)/);
  const motionIntensity = miMatch ? parseFloat(miMatch[1]) : null;
  const borderColor = isRunway
    ? "border-green-200"
    : isSeedance
      ? "border-orange-200"
      : "border-blue-200";
  const btnColor = isRunway
    ? "bg-green-700 hover:bg-green-800"
    : isSeedance
      ? "bg-orange-700 hover:bg-orange-800"
      : "bg-blue-700 hover:bg-blue-800";
  const engineLabel = isRunway ? "Runway" : isSeedance ? "Seedance" : "Kling";

  return (
    <div className={`rounded-xl border ${borderColor} bg-white p-3`}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-xs font-extrabold text-gray-900">
            🎬 {engineLabel} Shot {index + 1}
          </div>
          {motionIntensity !== null && (
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
              MI: {motionIntensity.toFixed(2)}
            </span>
          )}
          {isRunway && (
            <span className="rounded-full bg-yellow-100 px-1.5 py-0.5 text-[10px] font-bold text-yellow-700">
              No negative prompt
            </span>
          )}
          {isSeedance && (
            <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-700">
              Simple motion-first prompt
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => onCopy(shot)}
            className="rounded border border-gray-300 bg-white px-2 py-1 text-[11px] font-bold text-gray-600 hover:bg-gray-50 active:scale-95"
            title="Copy full shot with instructions"
          >
            Copy FULL
          </button>

          <button
            type="button"
            onClick={() => onCopy(pasteReady)}
            className={`rounded px-2 py-1 text-[11px] font-bold text-white active:scale-95 ${btnColor}`}
            title="Copy paste-ready prompt only"
          >
            Copy BODY
          </button>
        </div>
      </div>

      <pre className="max-h-40 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-gray-900">
        {shot || "—"}
      </pre>

      {audioPrompt && (
        <div className="mt-2 rounded-lg border border-indigo-200 bg-indigo-50 p-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-indigo-700">
              🔊 Audio Prompt
            </span>
            <button
              type="button"
              onClick={() => onCopy(audioPrompt)}
              className="rounded bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-indigo-700 active:scale-95"
            >
              Copy Audio
            </button>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-indigo-800">
            {audioPrompt}
          </p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CARD — generic copy card
// ─────────────────────────────────────────────────────────────
export function Card({
  title,
  value,
  onCopy,
  accent,
  aiEnhanced,
  extraActions,
}: {
  title: string;
  value: string;
  onCopy: (t: string) => void;
  accent?: string;
  aiEnhanced?: boolean;
  extraActions?: { label: string; onClick: () => void; className?: string }[];
}) {
  return (
    <div
      className={`rounded-xl border bg-white p-4 shadow-sm ${
        accent ? `border-l-4 ${accent}` : "border-gray-200"
      } ${aiEnhanced ? "ring-1 ring-purple-200" : ""}`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-bold text-gray-900">
          {title}
          {aiEnhanced && (
            <span className="text-xs font-normal text-purple-500">✦ AI</span>
          )}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {extraActions?.map((action) => (
            <button
              key={action.label}
              className={
                action.className ??
                "rounded border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 active:scale-95"
              }
              onClick={action.onClick}
              type="button"
            >
              {action.label}
            </button>
          ))}
          <button
            className="rounded bg-gray-900 px-3 py-1 text-sm text-white hover:bg-black active:scale-95"
            onClick={() => onCopy(value)}
            type="button"
          >
            Copy
          </button>
        </div>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
        {value || <span className="italic text-gray-400">Generate गर्नुस्...</span>}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION LABEL — divider with uppercase label
// ─────────────────────────────────────────────────────────────
function ShotImagePlanPanel({
  plans,
  onCopy,
}: {
  plans: NonNullable<GeneratedPackage["shotImagePlan"]>;
  onCopy: (t: string) => void;
}) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-gray-900">
          🖼️ 4-Shot Image Plan
        </span>
        <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
          1 master image → 4 edited shot images
        </span>
      </div>

      <p className="mb-3 text-xs leading-5 text-amber-800">
        Generate one master hero image first. Then create each shot image by
        editing from the master or the previous shot image instead of starting
        from scratch.
      </p>

      <div className="space-y-3">
        {plans.map((plan, i) => (
          <div
            key={`${plan.title}-${i}`}
            className="rounded-lg border border-amber-200 bg-white p-3"
          >
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-extrabold text-gray-900">
                  {plan.title}
                </span>
                <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-700">
                  Source: {plan.source === "master" ? "Master image" : "Previous shot image"}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onCopy(plan.prompt)}
                className="rounded bg-gray-900 px-2 py-1 text-[11px] font-bold text-white hover:bg-black active:scale-95"
              >
                Copy
              </button>
            </div>

            <pre className="max-h-40 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-gray-800">
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
                (plan, i) =>
                  `IMAGE ${i + 1} — ${plan.title}\nSource: ${
                    plan.source === "master" ? "Master image" : "Previous shot image"
                  }\n${plan.prompt}`
              )
              .join("\n\n---\n\n")
          )
        }
        className="mt-3 w-full rounded-lg bg-amber-600 py-2 text-sm font-bold text-white hover:bg-amber-700 active:scale-95"
      >
        Copy All 4 Image Prompts
      </button>
    </div>
  );
}

export function SectionLabel({ label }: { label: string }) {
  return (
    <div className="mb-3 mt-8 flex items-center gap-3">
      <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
        {label}
      </span>
      <div className="h-px flex-1 bg-gray-200" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SKELETON CARD — loading placeholder
// ─────────────────────────────────────────────────────────────
export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="h-4 w-32 rounded bg-gray-200" />
        <div className="h-7 w-14 rounded bg-gray-200" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-gray-100" />
        <div className="h-3 w-4/5 rounded bg-gray-100" />
        <div className="h-3 w-3/5 rounded bg-gray-100" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FIVE SHOT PANEL
// ─────────────────────────────────────────────────────────────
export function FiveShotPanel({
  cinematic,
  viral,
  onCopy,
}: {
  cinematic: FiveShotPlan;
  viral: FiveShotPlan;
  onCopy: (t: string) => void;
}) {
  const [style, setStyle] = useState<"cinematic" | "viral">("viral");
  const plan = style === "cinematic" ? cinematic : viral;

    const shots = [
    {
      key: "shot1",
      label:
        style === "cinematic"
          ? "SHOT 1 — Opening Tension (0–4s)"
          : "SHOT 1 — Opening Tension (0–4s)",
      color: "border-amber-400 bg-amber-50",
      badge: "RUNWAY",
      bc: "bg-amber-100 text-amber-700",
    },
    {
      key: "shot2",
      label:
        style === "cinematic"
          ? "SHOT 2 — Pressure Build (4–12s)"
          : "SHOT 2 — Pressure Build (4–12s)",
      color: "border-green-400 bg-green-50",
      badge: "RUNWAY",
      bc: "bg-green-100 text-green-700",
    },
    {
      key: "shot3",
      label:
        style === "cinematic"
          ? "SHOT 3 — Action Pressure (12–22s)"
          : "SHOT 3 — Action Pressure (12–22s)",
      color: "border-blue-400 bg-blue-50",
      badge: "KLING",
      bc: "bg-blue-100 text-blue-700",
    },
    {
      key: "shot4",
      label:
        style === "cinematic"
          ? "SHOT 4 — Reaction Pressure (22–32s)"
          : "SHOT 4 — Reaction Pressure (22–32s)",
      color: "border-blue-400 bg-blue-50",
      badge: "KLING",
      bc: "bg-blue-100 text-blue-700",
    },
    {
      key: "shot5",
      label:
        style === "cinematic"
          ? "SHOT 5 — Resolved Tension (32–40s)"
          : "SHOT 5 — Resolved Tension (32–42s)",
      color: "border-green-400 bg-green-50",
      badge: "RUNWAY",
      bc: "bg-green-100 text-green-700",
    },
  ];

  return (
    <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50 p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-indigo-900">
          🎬 5-Shot Pipeline — Watch Time Optimizer
        </span>
        <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">
          {plan.totalDuration}
        </span>
        <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
          Facebook Monetization ✓
        </span>
      </div>

      <div className="mb-4 flex overflow-hidden rounded-lg border border-indigo-200 bg-white">
        <button
          onClick={() => setStyle("viral")}
          className={`flex-1 py-2.5 text-xs font-bold transition-all ${
            style === "viral"
              ? "bg-red-600 text-white"
              : "text-red-600 hover:bg-red-50"
          }`}
          type="button"
        >
          🔥 Viral Formula (USA Optimized)
        </button>
        <button
          onClick={() => setStyle("cinematic")}
          className={`flex-1 py-2.5 text-xs font-bold transition-all ${
            style === "cinematic"
              ? "bg-indigo-600 text-white"
              : "text-indigo-600 hover:bg-indigo-50"
          }`}
          type="button"
        >
          🎬 Cinematic Formula
        </button>
      </div>

      <div className="mb-3 rounded-lg border border-green-200 bg-green-50 p-2 text-xs text-green-700">
        📊 {plan.watchTimeNote}
      </div>
      <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
        💬 <strong>Caption tip:</strong> {plan.captionTip}
      </div>

      <div className="space-y-2">
        {shots.map((s) => (
          <div key={s.key} className={`rounded-lg border-l-4 p-3 ${s.color}`}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-800">
                  {s.label}
                </span>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-bold ${s.bc}`}
                >
                  {s.badge}
                </span>
              </div>
              <button
                onClick={() =>
                  onCopy(
                    extractMotionOnlyPrompt(
                      plan[s.key as keyof FiveShotPlan] as string
                    )
                  )
                }
                className="rounded bg-gray-900 px-2 py-1 text-xs text-white hover:bg-black active:scale-95"
                type="button"
              >
                Copy
              </button>
            </div>
            <p className="whitespace-pre-wrap text-xs leading-5 text-gray-700">
              {plan[s.key as keyof FiveShotPlan] as string}
            </p>
          </div>
        ))}
      </div>

      <button
        onClick={() =>
          onCopy(
            [plan.shot1, plan.shot2, plan.shot3, plan.shot4, plan.shot5]
              .map((shot) => extractMotionOnlyPrompt(shot as string))
              .join("\n\n---\n\n")
          )
        }
        className="mt-3 w-full rounded-lg bg-indigo-600 py-2 text-sm font-bold text-white hover:bg-indigo-700 active:scale-95"
        type="button"
      >
        Copy All 5 Shots
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HOOK 2026 PANEL
// ─────────────────────────────────────────────────────────────
export function Hook2026Panel({
  hooks,
  oldHook,
  onCopy,
  recommendedIndex = 0,
}: {
  hooks: string[];
  oldHook: string;
  onCopy: (t: string) => void;
  recommendedIndex?: number;
}) {
  const joined = hooks
    .map(
      (h, i) =>
        `V${i + 1}${i === recommendedIndex ? " (Recommended)" : ""}: ${h}`
    )
    .join("\n");
  const styleLabels = ["Fast curiosity", "Emotion / tension", "Shock ending"];

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900">
            🔥 Auto Hook Variations ×3
          </span>
          <span className="rounded bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700">
            Generated Automatically
          </span>
        </div>
        <button
          onClick={() => onCopy(joined)}
          className="rounded bg-orange-600 px-3 py-1 text-xs font-bold text-white hover:bg-orange-700 active:scale-95"
          type="button"
        >
          Copy All 3
        </button>
      </div>

      <p className="mb-3 text-xs leading-5 text-orange-800">
        Animal, prey, arc change गरेपछि hook variations पनि आफैँ बदलिन्छन्।
        Recommended badge भएको hook पहिला test गर्नुस्।
      </p>

      <div className="mb-3 space-y-2">
        {hooks.map((h, i) => (
          <div
            key={i}
            className={`flex items-start gap-2 rounded-lg border p-3 ${
              i === recommendedIndex
                ? "border-orange-400 bg-white shadow-sm"
                : "border-orange-200 bg-white"
            }`}
          >
            <span
              className={`mt-0.5 rounded px-1.5 py-0.5 text-xs font-bold ${
                i === recommendedIndex
                  ? "bg-orange-500 text-white"
                  : "bg-orange-100 text-orange-600"
              }`}
            >
              V{i + 1}
            </span>
            <div className="flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                {i === recommendedIndex && (
                  <span className="rounded bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                    Recommended
                  </span>
                )}
                <span className="text-[11px] font-semibold text-gray-500">
                  {styleLabels[i] ?? ""}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-800">{h}</p>
            </div>
            <button
              onClick={() => onCopy(h)}
              className="shrink-0 rounded bg-gray-900 px-2 py-1 text-xs text-white hover:bg-black active:scale-95"
              type="button"
            >
              Copy
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-2">
        <p className="mb-1 text-xs text-gray-500">Fallback / old hook:</p>
        <div className="flex items-start gap-2">
          <p className="flex-1 text-xs text-gray-600">{oldHook}</p>
          <button
            onClick={() => onCopy(oldHook)}
            className="shrink-0 rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 active:scale-95"
            type="button"
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CAPTION 2026 PANEL
// ─────────────────────────────────────────────────────────────
export function Caption2026Panel({
  caption2026,
  captionOld,
  onCopy,
}: {
  caption2026: string;
  captionOld: string;
  onCopy: (t: string) => void;
}) {
  const [show, setShow] = useState<"2026" | "old">("2026");

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-gray-900">
          📝 Story-Based Caption
        </span>
        <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
          5-Part 2026 Structure
        </span>
      </div>

      <div className="mb-3 flex overflow-hidden rounded-lg border border-emerald-200 bg-white">
        <button
          onClick={() => setShow("2026")}
          className={`flex-1 py-2 text-xs font-bold transition-all ${
            show === "2026"
              ? "bg-emerald-600 text-white"
              : "text-emerald-600 hover:bg-emerald-50"
          }`}
          type="button"
        >
          🔥 2026 Story Format
        </button>
        <button
          onClick={() => setShow("old")}
          className={`flex-1 py-2 text-xs font-bold transition-all ${
            show === "old"
              ? "bg-gray-600 text-white"
              : "text-gray-500 hover:bg-gray-50"
          }`}
          type="button"
        >
          Classic Format
        </button>
      </div>

      <div className="rounded-lg border border-emerald-100 bg-white p-3">
        <p className="whitespace-pre-wrap text-sm leading-7 text-gray-800">
          {show === "2026" ? caption2026 : captionOld}
        </p>
      </div>

      <button
        onClick={() => onCopy(show === "2026" ? caption2026 : captionOld)}
        className="mt-2 w-full rounded-lg bg-emerald-600 py-2 text-sm font-bold text-white hover:bg-emerald-700 active:scale-95"
        type="button"
      >
        Copy Caption
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// POSTING TIMES PANEL
// ─────────────────────────────────────────────────────────────
export function PostingTimesPanel() {
  const times = getUSAPostingTimes();
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-gray-900">
            🕐 USA Optimal Posting Times
          </span>
          <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
            EST · CST · PST
          </span>
          <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
            Planning Panel ✓
          </span>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 active:scale-95"
          type="button"
        >
          {open ? "Hide ▲" : "Show ▼"}
        </button>
      </div>

      {open && (
        <div className="mt-3 space-y-3">
          <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-800">
            🔥 <strong>Start here:</strong> Test morning and midday windows first,
            then keep the winners from your own Facebook Insights.
          </div>
          {times.map((day, i) => (
            <div
              key={i}
              className="rounded-lg border border-blue-200 bg-white p-3"
            >
              <p className="mb-2 text-xs font-bold text-blue-800">{day.day}</p>
              <div className="space-y-1.5">
                {day.slots.map((slot, j) => (
                  <div key={j} className="flex flex-wrap items-start gap-2">
                    <span className="text-sm">{slot.priority}</span>
                    <span
                      className={`shrink-0 rounded px-2 py-0.5 text-xs font-bold ${
                        j === 0
                          ? "bg-red-100 text-red-700"
                          : j === 1
                          ? "bg-orange-100 text-orange-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {slot.zone}
                    </span>
                    <span className="text-xs font-semibold text-gray-800">
                      {slot.time}
                    </span>
                    <span className="text-xs text-gray-500">— {slot.why}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-2 text-xs text-yellow-800">
            💡 <strong>Pro tip:</strong> Reply quickly to early comments so the
            reel feels active and conversational while it is fresh.
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// WATCH TIME PANEL
// ─────────────────────────────────────────────────────────────
export function WatchTimePanel({ report }: { report: WatchTimeReport }) {
  const [showEarnings, setShowEarnings] = useState(false);
  const earningsTable = getCMPEarningsTable();

  return (
    <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-gray-900">
          ⏱️ Watch Time + Earnings Optimizer
        </span>
        <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700">
          CMP 600K Min Goal
        </span>
        <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
          Planning Panel ✓
        </span>
      </div>

      <div className="mb-3 grid gap-2 md:grid-cols-3">
        <div className="rounded-lg border border-red-200 bg-white p-3 text-center">
          <p className="text-xs text-gray-400">3-Shot (Old)</p>
          <p className="text-xl font-bold text-red-500">~13s</p>
          <p className="text-xs text-gray-400">Below optimal</p>
        </div>
        <div className="rounded-lg border border-green-300 bg-white p-3 text-center">
          <p className="text-xs text-gray-400">5-Shot (New)</p>
          <p className="text-xl font-bold text-green-600">60–70s</p>
          <p className="text-xs font-semibold text-green-600">
            ✓ Research peak
          </p>
        </div>
        <div className="rounded-lg border border-indigo-200 bg-white p-3 text-center">
          <p className="text-xs text-gray-400">Watch Time/View</p>
          <p className="text-xl font-bold text-indigo-600">
            {report.watchTimePerView}
          </p>
          <p className="text-xs text-gray-400">5x improvement</p>
        </div>
      </div>

      <div className="mb-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-xs">
        <p className="mb-1 font-bold text-yellow-800">💰 Revenue note</p>
        <p className="text-yellow-700">{report.usaCPMNote}</p>
        <p className="mt-1 text-yellow-600">
          Estimated: {report.estimatedMonthlyEarnings}
        </p>
      </div>

      <div className="mb-3 space-y-1.5">
        {report.tipsToIncrease.map((tip, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-gray-700">
            <span className="mt-0.5 shrink-0">•</span>
            <span>{tip}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => setShowEarnings((o) => !o)}
        className="w-full rounded-lg border border-purple-300 bg-white py-2 text-xs font-bold text-purple-700 hover:bg-purple-50 active:scale-95"
        type="button"
      >
        {showEarnings
          ? "Hide Earnings Table ▲"
          : "📊 Show CMP Earnings Calculator ▼"}
      </button>

      {showEarnings && (
        <div className="mt-3">
          <p className="mb-2 text-xs font-bold text-gray-700">
            Planning ranges only — not guaranteed payouts
          </p>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-left font-semibold text-gray-600">
                    Views
                  </th>
                  <th className="p-2 text-left font-semibold text-gray-600">
                    General
                  </th>
                  <th className="p-2 text-left font-semibold text-green-600">
                    USA Heavy 🇺🇸
                  </th>
                </tr>
              </thead>
              <tbody>
                {earningsTable.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="p-2 font-semibold text-gray-800">
                      {(row.views / 1000).toFixed(0)}K
                    </td>
                    <td className="p-2 text-gray-600">
                      {row.minEarnings}–{row.maxEarnings}
                    </td>
                    <td className="p-2 font-bold text-green-700">
                      {row.usaOptimized}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            Use your Professional Dashboard as the source of truth once you gain
            access.
          </p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CAPCUT SCRIPT PANEL
// ─────────────────────────────────────────────────────────────
export function CapCutScriptPanel({
  script,
  onCopy,
}: {
  script: CapCutScript;
  onCopy: (t: string) => void;
}) {
  const fullScript = `CAPCUT AUTO-SCRIPT
Duration: ${script.totalDuration} | ${script.aspectRatio} | ${script.fps}fps project
Music: ${script.musicMood}

${script.beats
  .map(
    (b) => `[${b.timeIn} → ${b.timeOut}] ${b.shotRef}
  On-screen text: "${b.onScreenText}"
  Transition: ${b.transition}
  SFX: ${b.sfx}
  Music: ${b.musicNote}`
  )
  .join("\n\n")}

EXPORT: ${script.exportSettings}`;

  return (
    <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900">
            ✂️ CapCut Auto-Script
          </span>
          <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700">
            {script.totalDuration} · {script.aspectRatio}
          </span>
        </div>
        <button
          onClick={() => onCopy(fullScript)}
          className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-700 active:scale-95"
          type="button"
        >
          Copy Full Script
        </button>
      </div>

      <div className="mb-3 rounded-lg border border-purple-200 bg-white p-2 text-xs text-purple-800">
        🎵 <strong>Music mood:</strong> {script.musicMood}
      </div>

      <div className="space-y-2">
        {script.beats.map((beat, i) => (
          <div
            key={i}
            className="rounded-lg border border-purple-100 bg-white p-3"
          >
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded bg-purple-600 px-2 py-0.5 text-xs font-bold text-white">
                {beat.timeIn} → {beat.timeOut}
              </span>
              <span className="text-xs font-bold text-gray-700">
                {beat.shotRef}
              </span>
            </div>
            <div className="grid gap-1 text-xs">
              <div>
                <span className="font-semibold text-gray-500">📝 Text: </span>
                <span className="text-gray-700">
                  &quot;{beat.onScreenText}&quot;
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-500">✂️ Cut: </span>
                <span className="text-gray-700">{beat.transition}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-500">🔊 SFX: </span>
                <span className="text-gray-700">{beat.sfx}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-500">🎵 Music: </span>
                <span className="italic text-gray-600">{beat.musicNote}</span>
              </div>
            </div>
            <button
              onClick={() =>
                onCopy(
                  `[${beat.timeIn}→${beat.timeOut}] ${beat.onScreenText}\nSFX: ${beat.sfx}\nTransition: ${beat.transition}`
                )
              }
              className="mt-2 rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 active:scale-95"
              type="button"
            >
              Copy Beat
            </button>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-purple-600">
        Export: {script.exportSettings}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ANIMAL BEHAVIOR PANEL
// ─────────────────────────────────────────────────────────────
export function AnimalBehaviorPanel({
  behavior,
  predator,
  onCopy,
}: {
  behavior: AnimalBehavior;
  predator: string;
  onCopy: (t: string) => void;
}) {
  type Tab = "attack" | "motion" | "sound" | "body" | "facts";
  const [tab, setTab] = useState<Tab>("attack");

  const tabs: { key: Tab; label: string }[] = [
    { key: "attack", label: "⚡ Pre-Attack" },
    { key: "motion", label: "🏃 Motion" },
    { key: "sound", label: "🔊 Sound" },
    { key: "body", label: "👁 Body Language" },
    { key: "facts", label: "📖 Facts" },
  ];

  const content: Record<Tab, string[]> = {
    attack: behavior.preAttackSignals,
    motion: behavior.naturalMotion,
    sound: behavior.soundDesign,
    body: behavior.bodyLanguage,
    facts: behavior.habitatFacts,
  };

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-gray-900">
          🦁 {predator} Behavior Library
        </span>
        <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
          Real biology → prompt injection
        </span>
      </div>

      <div className="mb-3 flex gap-1 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              tab === t.key
                ? "bg-amber-600 text-white"
                : "border border-amber-200 bg-white text-amber-700 hover:bg-amber-50"
            }`}
            type="button"
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {content[tab].map((item, i) => (
          <div
            key={i}
            className="flex items-start gap-2 rounded-lg border border-amber-100 bg-white p-2.5"
          >
            <span className="mt-0.5 shrink-0 text-amber-500">•</span>
            <p className="text-xs leading-5 text-gray-700">{item}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-bold text-green-800">
            ✦ Prompt Injection Ready
          </span>
          <button
            onClick={() => onCopy(behavior.promptInjection)}
            className="rounded bg-green-600 px-2 py-1 text-xs font-bold text-white hover:bg-green-700 active:scale-95"
            type="button"
          >
            Copy
          </button>
        </div>
        <p className="text-xs leading-5 text-green-800">
          {behavior.promptInjection}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SOUND DESIGN PANEL
// ─────────────────────────────────────────────────────────────
export function SoundDesignPanel({
  pack,
  onCopy,
}: {
  pack: SoundDesignPack;
  onCopy: (t: string) => void;
}) {
  const rows = [
    {
      label: "Shot 1 — Ambient",
      value: pack.shot1_ambient,
      color: "border-amber-200 bg-amber-50",
    },
    {
      label: "Shot 1 — Animal",
      value: pack.shot1_animal,
      color: "border-amber-200 bg-amber-50",
    },
    {
      label: "Shot 2 — Impact",
      value: pack.shot2_impact,
      color: "border-red-200 bg-red-50",
    },
    {
      label: "Shot 2 — Animal",
      value: pack.shot2_animal,
      color: "border-red-200 bg-red-50",
    },
    {
      label: "Shot 3 — Resolve",
      value: pack.shot3_resolve,
      color: "border-green-200 bg-green-50",
    },
    {
      label: "Music Mood",
      value: pack.musicMood,
      color: "border-purple-200 bg-purple-50",
    },
  ];

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-gray-900">
          🔊 Sound Design Pack
        </span>
        <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">
          Kling + CapCut SFX
        </span>
      </div>

      <div className="mb-3 space-y-2">
        {rows.map((item, i) => (
          <div key={i} className={`rounded-lg border p-2.5 ${item.color}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="mb-0.5 text-[11px] font-bold text-gray-500">
                  {item.label}
                </p>
                <p className="text-xs text-gray-700">{item.value}</p>
              </div>
              <button
                onClick={() => onCopy(item.value)}
                className="shrink-0 rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 active:scale-95"
                type="button"
              >
                Copy
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-indigo-300 bg-indigo-100 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-bold text-indigo-800">
            🎬 Kling Audio Prompt
          </span>
          <button
            onClick={() => onCopy(pack.klingAudioPrompt)}
            className="rounded bg-indigo-600 px-2 py-1 text-xs font-bold text-white hover:bg-indigo-700 active:scale-95"
            type="button"
          >
            Copy
          </button>
        </div>
        <p className="text-xs leading-5 text-indigo-900">
          {pack.klingAudioPrompt}
        </p>
      </div>

      <div className="mt-3 space-y-1">
        {pack.capCutSFX.map((cue, i) => (
          <div
            key={i}
            className="flex items-start justify-between gap-2 rounded border border-gray-200 bg-white p-2"
          >
            <p className="text-xs text-gray-700">{cue}</p>
            <button
              onClick={() => onCopy(cue)}
              className="shrink-0 rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-500 hover:bg-gray-50 active:scale-95"
              type="button"
            >
              Copy
            </button>
          </div>
        ))}
        <button
          onClick={() => onCopy(pack.capCutSFX.join("\n"))}
          className="mt-2 w-full rounded border border-gray-300 bg-white py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 active:scale-95"
          type="button"
        >
          Copy All SFX Cues
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PLATFORM PACK PANEL
// ─────────────────────────────────────────────────────────────
export function PlatformPackPanel({
  pack,
  onCopy,
}: {
  pack: PlatformPack;
  onCopy: (t: string) => void;
}) {
  const [platform, setPlatform] = useState<PlatformTarget>("facebook");
  const platforms: PlatformTarget[] = [
    "facebook",
    "instagram",
    "tiktok",
    "youtube_shorts",
  ];

  const labels: Record<PlatformTarget, string> = {
    facebook: "📘 Facebook",
    instagram: "📷 Instagram",
    tiktok: "🎵 TikTok",
    youtube_shorts: "▶ YouTube Shorts",
  };
  const colors: Record<PlatformTarget, string> = {
    facebook: "bg-blue-600",
    instagram: "bg-pink-600",
    tiktok: "bg-gray-900",
    youtube_shorts: "bg-red-600",
  };

  const data = pack[platform];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex overflow-hidden rounded-lg border border-gray-200">
        {platforms.map((p) => (
          <button
            key={p}
            onClick={() => setPlatform(p)}
            className={`flex-1 py-2 text-xs font-bold transition-all ${
              platform === p
                ? `${colors[p]} text-white`
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
            type="button"
          >
            {labels[p]}
          </button>
        ))}
      </div>

      {platform === "facebook" && (
        <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-2 text-xs text-blue-800">
          🏷️ <strong>Meta note:</strong> {pack.facebook.cmpNote}
        </div>
      )}

      <div className="space-y-2">
        {"title" in data ? (
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs font-bold text-gray-500">Title</p>
            <p className="mt-1 text-sm text-gray-800">{data.title}</p>
            <button
              onClick={() => onCopy(data.title)}
              className="mt-2 rounded bg-gray-900 px-2 py-1 text-xs text-white"
              type="button"
            >
              Copy
            </button>
          </div>
        ) : (
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs font-bold text-gray-500">Hook</p>
            <p className="mt-1 text-sm font-semibold text-gray-800">
              {data.hook}
            </p>
            <button
              onClick={() => onCopy(data.hook)}
              className="mt-2 rounded bg-gray-900 px-2 py-1 text-xs text-white"
              type="button"
            >
              Copy
            </button>
          </div>
        )}

        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs font-bold text-gray-500">
            {"description" in data ? "Description" : "Caption"}
          </p>
          <p className="mt-1 whitespace-pre-wrap text-xs leading-6 text-gray-700">
            {"description" in data ? data.description : data.caption}
          </p>
          <button
            onClick={() =>
              onCopy("description" in data ? data.description : data.caption)
            }
            className="mt-2 rounded bg-gray-900 px-2 py-1 text-xs text-white"
            type="button"
          >
            Copy
          </button>
        </div>

        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs font-bold text-gray-500">
            {"tags" in data ? "Tags" : "Hashtags"}
          </p>
          <p className="mt-1 text-xs text-gray-700">
            {"tags" in data ? data.tags : data.hashtags}
          </p>
          <button
            onClick={() => onCopy("tags" in data ? data.tags : data.hashtags)}
            className="mt-2 rounded bg-gray-900 px-2 py-1 text-xs text-white"
            type="button"
          >
            Copy
          </button>
        </div>

        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-700">
          🕐 <strong>Best time to test:</strong> {data.bestTime}
        </div>

        {data.strategyNote && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800">
            💡 <strong>Strategy:</strong> {data.strategyNote}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// BULK GENERATE PANEL
// ─────────────────────────────────────────────────────────────
export function BulkGeneratePanel({
  predator,
  items,
  isRunning,
  onStart,
  onExport,
  onLoadItem,
  onCopy,
}: {
  predator: string;
  items: BulkItem[];
  isRunning: boolean;
  onStart: () => void;
  onExport: () => void;
  onLoadItem: (item: BulkItem) => void;
  onCopy: (t: string) => void;
}) {
  const doneCount = items.filter((x) => x.status === "done").length;

  return (
    <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-gray-900">⚡ Bulk Generate</span>
        <span className="rounded bg-cyan-100 px-2 py-0.5 text-xs font-bold text-cyan-700">
          Multiple combos at once
        </span>
        {items.length > 0 && (
          <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
            {doneCount}/{items.length} done
          </span>
        )}
      </div>

      <p className="mb-3 text-xs text-cyan-700">
        {predator
          ? `${predator} ko top prey combinations + arc variations — एकैपटक generate गर्छ।`
          : "Predator select गर्नुस् first।"}
      </p>

      <div className="mb-3 flex flex-wrap gap-2">
        <button
          onClick={onStart}
          disabled={isRunning || !predator}
          className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-700 disabled:opacity-50 active:scale-95"
          type="button"
        >
          {isRunning ? (
            <span className="flex items-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Generating...
            </span>
          ) : (
            "⚡ Start Bulk Generate"
          )}
        </button>
        {doneCount > 0 && (
          <button
            onClick={onExport}
            className="rounded-lg border border-cyan-300 bg-white px-4 py-2 text-sm font-semibold text-cyan-700 hover:bg-cyan-50 active:scale-95"
            type="button"
          >
            ⬇ Export All TXT
          </button>
        )}
      </div>

      {items.length > 0 && (
        <>
          <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-cyan-100">
            <div
              className="h-full rounded-full bg-cyan-500 transition-all duration-300"
              style={{ width: `${(doneCount / items.length) * 100}%` }}
            />
          </div>
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {items.map((item) => (
              <div
                key={item.id}
                className={`rounded-lg border p-3 transition-all ${
                  item.status === "done"
                    ? "border-green-200 bg-green-50"
                    : item.status === "generating"
                    ? "border-cyan-300 bg-cyan-50"
                    : item.status === "error"
                    ? "border-red-200 bg-red-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-gray-800">
                      {item.predator} vs {item.prey}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {item.arc} · {item.weather}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold ${
                        item.status === "done"
                          ? "text-green-600"
                          : item.status === "generating"
                          ? "text-cyan-600"
                          : item.status === "error"
                          ? "text-red-600"
                          : "text-gray-400"
                      }`}
                    >
                      {item.status === "done"
                        ? "✓ Done"
                        : item.status === "generating"
                        ? "⟳ Generating..."
                        : item.status === "error"
                        ? "✕ Error"
                        : "Pending"}
                    </span>
                    {item.status === "done" && item.pkg && (
                      <>
                        <button
                          onClick={() => onLoadItem(item)}
                          className="rounded border border-green-300 bg-white px-2 py-1 text-xs font-bold text-green-700 hover:bg-green-50 active:scale-95"
                          type="button"
                        >
                          Load
                        </button>
                        <button
                          onClick={() =>
                            onCopy(
                              item.pkg!.imagePrompt +
                                "\n\n" +
                                (item.pkg!.hook2026?.[0] ?? item.pkg!.hook)
                            )
                          }
                          className="rounded bg-gray-900 px-2 py-1 text-xs text-white hover:bg-black active:scale-95"
                          type="button"
                        >
                          Copy
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// VERSION CONTROL PANEL
// ─────────────────────────────────────────────────────────────
export function VersionControlPanel({
  versions,
  predator,
  prey,
  onCopy,
}: {
  versions: PromptVersion[];
  predator: string;
  prey: string;
  onCopy: (t: string) => void;
}) {
  const [compareIdx, setCompareIdx] = useState<number | null>(null);

  if (!versions.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
        <p className="text-sm font-semibold text-gray-600">
          No versions saved yet
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Generate र &quot;Save Version&quot; थिच्नुस्
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-gray-900">
          🔄 Prompt Versions
        </span>
        <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-700">
          {predator} vs {prey}
        </span>
        <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-700">
          {versions.length} versions
        </span>
      </div>
      <div className="space-y-2">
        {versions.map((v, i) => (
          <div
            key={i}
            className={`rounded-lg border p-3 transition-all ${
              compareIdx === i
                ? "border-blue-300 bg-blue-50"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-600">
                  V{v.version}
                </span>
                <span className="text-xs font-semibold text-gray-700">
                  {v.label}
                </span>
                <span className="text-[11px] text-gray-400">
                  {new Date(v.timestamp).toLocaleDateString()}
                </span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setCompareIdx(compareIdx === i ? null : i)}
                  className={`rounded border px-2 py-1 text-xs font-semibold active:scale-95 ${
                    compareIdx === i
                      ? "border-blue-400 bg-blue-100 text-blue-700"
                      : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                  type="button"
                >
                  {compareIdx === i ? "Hide" : "View"}
                </button>
                <button
                  onClick={() =>
                    onCopy(
                      `V${v.version}: ${v.label}\n\nHook: ${v.hook}\n\nImage Prompt: ${v.imagePrompt}\n\nCaption: ${v.caption}`
                    )
                  }
                  className="rounded bg-gray-900 px-2 py-1 text-xs text-white hover:bg-black active:scale-95"
                  type="button"
                >
                  Copy
                </button>
              </div>
            </div>

            {compareIdx === i && (
              <div className="space-y-2 text-xs">
                <div className="rounded bg-orange-50 p-2">
                  <span className="font-bold text-orange-700">Hook: </span>
                  <span className="text-gray-700">{v.hook}</span>
                </div>
                <div className="rounded bg-amber-50 p-2">
                  <span className="font-bold text-amber-700">
                    Image Prompt:{" "}
                  </span>
                  <span className="line-clamp-3 text-gray-700">
                    {v.imagePrompt}
                  </span>
                </div>
                {v.performanceNote && (
                  <div className="rounded bg-green-50 p-2">
                    <span className="font-bold text-green-700">
                      Performance:{" "}
                    </span>
                    <span className="text-gray-700">{v.performanceNote}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 6-STEP WORKFLOW PROMPT MAP (Enhanced with pipeline toggles)
// Includes ALL runway shots + ALL kling shots inside Step 2/3.
// ─────────────────────────────────────────────────────────────

function safeText(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (Array.isArray(v)) return v.map((x) => String(x)).join("\n\n").trim();
  return String(v ?? "").trim();
}

function deriveDriftLabel(
  clipChaining?: string
): { label: string; pill: string } {
  const t = (clipChaining ?? "").toUpperCase();
  if (t.includes("HIGH"))
    return {
      label: "HIGH Drift — use all 6 steps",
      pill: "bg-red-100 text-red-700",
    };
  if (t.includes("LOW"))
    return {
      label: "LOW Drift — 3 steps ok",
      pill: "bg-green-100 text-green-700",
    };
  if (t.includes("MEDIUM"))
    return {
      label: "MEDIUM Drift — recommend all steps",
      pill: "bg-amber-100 text-amber-800",
    };
  return { label: "Drift — unknown", pill: "bg-gray-100 text-gray-700" };
}

function WorkflowCard({
  step,
  title,
  badge,
  color,
  help,
  children,
  done,
  onToggle,
}: {
  step: number;
  title: string;
  badge: string;
  color: { border: string; bg: string; badge: string };
  help: string;
  children: React.ReactNode;
  done: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`rounded-2xl border-2 ${color.border} ${color.bg} p-4 shadow-sm`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">
            {step}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-extrabold text-gray-900">{title}</h3>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${color.badge}`}
              >
                {badge}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-600">{help}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggle}
          title="Mark done"
          aria-label="Mark done"
          className={`h-5 w-5 rounded border ${
            done ? "border-gray-900 bg-gray-900" : "border-gray-300 bg-white"
          }`}
        />
      </div>

      {children}
    </div>
  );
}

function TextBox({ value }: { value: string }) {
  return (
    <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-xl border border-gray-200 bg-white p-3 text-xs leading-relaxed text-gray-800">
      {value || "—"}
    </pre>
  );
}

// ─────────────────────────────────────────────────────────────
// WorkflowPromptMap — multi-engine prompt tracker
// ─────────────────────────────────────────────────────────────
function WorkflowPromptMap({
  data,
  onCopy,
}: {
  data: GeneratedPackage;
  onCopy: (t: string) => void;
}) {
  type WorkflowMode = "seedance" | "runway" | "kling" | "hybrid";
  type WorkflowAction = {
    label: string;
    value: string;
    secondary?: boolean;
  };
  type WorkflowItem = {
    step: number;
    title: string;
    badge: string;
    color: { border: string; bg: string; badge: string };
    help: string;
    value: string;
    actions: WorkflowAction[];
  };
  type WorkflowConfig = {
    pipeline: string;
    bannerTitle: string;
    bannerBody: string;
    steps: WorkflowItem[];
  };

  const seedanceShots = (data.seedanceShots ?? []).map(safeText);
  const runwayShots = (data.runwayShots ?? []).map(safeText);
  const klingShots = (data.klingShots ?? []).map(safeText);
  const imagePrompt = safeText(data.imagePrompt);
  const seedanceWorkflowGuide = safeText(data.seedanceWorkflowGuide ?? "");
  const routingNote = safeText(data.routingNote ?? "");

  const drift = deriveDriftLabel(data.clipChaining);

  const emptyDone = {
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false,
  };

  const [mode, setMode] = useState<WorkflowMode>("hybrid");
  const [doneByMode, setDoneByMode] = useState<Record<WorkflowMode, Record<number, boolean>>>({
    seedance: { ...emptyDone },
    runway: { ...emptyDone },
    kling: { ...emptyDone },
    hybrid: { ...emptyDone },
  });
  const [activeStepByMode, setActiveStepByMode] = useState<Record<WorkflowMode, number>>({
    seedance: 1,
    runway: 1,
    kling: 1,
    hybrid: 1,
  });

  const stepRefs = useRef<Record<number, HTMLDivElement | null>>({
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
    6: null,
  });

  const done = doneByMode[mode];

  const copiedCount = useMemo(
    () => Object.values(done).filter(Boolean).length,
    [done]
  );

  const workflows = useMemo<Record<WorkflowMode, WorkflowConfig>>(() => {
    const imageCardColor = {
      border: "border-amber-400",
      bg: "bg-amber-50",
      badge: "bg-amber-100 text-amber-700",
    };
    const seedanceColor = {
      border: "border-orange-400",
      bg: "bg-orange-50",
      badge: "bg-orange-100 text-orange-700",
    };
    const runwayColor = {
      border: "border-green-400",
      bg: "bg-green-50",
      badge: "bg-green-100 text-green-700",
    };
    const klingColor = {
      border: "border-blue-400",
      bg: "bg-blue-50",
      badge: "bg-blue-100 text-blue-700",
    };
    const guideColor = {
      border: "border-sky-400",
      bg: "bg-sky-50",
      badge: "bg-sky-100 text-sky-700",
    };
    const hybridColor = {
      border: "border-indigo-400",
      bg: "bg-indigo-50",
      badge: "bg-indigo-100 text-indigo-700",
    };

    const imageStep: WorkflowItem = {
      step: 1,
      title: "Image Prompt",
      badge: "NB2 / Flux / Midjourney",
      color: imageCardColor,
      help: "Generate the master hero still first, then use that image or a continuity-safe edited frame as the visual base for the next engine.",
      value: imagePrompt,
      actions: [
        { label: "Copy Image Prompt", value: imagePrompt },
        { label: "Copy BODY", value: extractImagePromptBody(imagePrompt), secondary: true },
      ],
    };

    const runwayGuide = [
      "OPTIONAL RUNWAY 4-SHOT WORKFLOW",
      "Use this when you intentionally want the optional full Runway 4-shot bundle.",
      "1. Upload the master still or a clean continuity-safe handoff frame into Runway I2V.",
      "2. Keep the prompt motion-first: motion, camera, physics, and spacing.",
      "3. Default WSTV Runway flow is 4 separate shots at 5 seconds each.",
      "4. Use Shot 1 for opening tension, Shot 2 for pressure build, Shot 3 for peak action, Shot 4 for resolved tension.",
      "5. Chain from the previous last frame only when the outgoing frame is still a clean full-body handoff frame.",
      "6. Use 24 or 25 FPS.",
      "7. Negative prompts do not work in Runway.",
    ].join("\n");

    const klingGuide = [
      "OPTIONAL KLING 4-SHOT WORKFLOW",
      "Use this when you intentionally want the optional full Kling 4-shot bundle.",
      "1. Use the continuity image as the visual 3D anchor and keep visual restatement light.",
      "2. Enable Bind Subject when identity lock matters.",
      "3. Default WSTV Kling flow is 4 separate shots at 5 seconds each.",
      "4. Keep framing wide and full-body readable across all four shots.",
      "5. Shot 1 = opening tension, Shot 2 = pressure build, Shot 3 = peak action, Shot 4 = resolved tension.",
      "6. Motion intensity can rise from Shot 1 to Shot 3, then settle in Shot 4.",
      "7. Kling negative prompts are optional, but only use them when actually needed.",
    ].join("\n");

    const hybridGuide = [
      "PRIMARY HYBRID 4-SHOT ROUTING",
      "This is the main WSTV production path.",
      "1. Generate the master still first.",
      "2. Shot 1 uses Runway for the clean readable opening tension.",
      "3. Shot 2 uses Kling for pressure build.",
      "4. Shot 3 uses Kling for peak action.",
      "5. Shot 4 returns to Runway for the clean readable resolved tension.",
      "6. Keep continuity-safe edited images between every shot handoff.",
      routingNote || "Routing note: Runway 1 → Kling 2-3 → Runway 4.",
    ].join("\n");

    return {
      seedance: {
        pipeline:
          "Image Prompt → Master Still → Seedance Shot 1 Opening Tension → Seedance Shot 2 Pressure Build → Seedance Shot 3 Peak Action → Seedance Shot 4 Resolved Tension → CapCut",
        bannerTitle: "Optional Seedance 2.0 bundle",
        bannerBody:
          "Optional full Seedance 4-shot bundle. Keep prompts motion-first, simple, and direct. Use Prompt + First Frame as the base, add Ref Image / Ref Video only when needed, and default to 4 separate 5-second shots.",
        steps: [
          imageStep,
          {
            step: 2,
            title: "Seedance Shot 1 — Opening Tension",
            badge: "Seedance 2.0",
            color: seedanceColor,
            help: "Use the clean opening frame in First Frame. Keep Prompt focused on subject movement, background movement, and camera movement only.",
            value: seedanceShots[0] ?? "",
            actions: [{ label: "Copy Seedance Shot 1 BODY", value: extractSeedancePromptBody(seedanceShots[0] ?? "") }],
          },
          {
            step: 3,
            title: "Seedance Shot 2 — Pressure Build",
            badge: "Seedance 2.0",
            color: seedanceColor,
            help: "Let the tension rise without chaotic overlap. Use clear motion adverbs and camera language so the pressure build stays readable and forceful.",
            value: seedanceShots[1] ?? "",
            actions: [{ label: "Copy Seedance Shot 2 BODY", value: extractSeedancePromptBody(seedanceShots[1] ?? "") }],
          },
          {
            step: 4,
            title: "Seedance Shot 3 — Peak Action",
            badge: "Seedance 2.0",
            color: seedanceColor,
            help: "This is the strongest action beat. Keep body mechanics readable, motion grounded, and spacing clear even when the scene speeds up.",
            value: seedanceShots[2] ?? "",
            actions: [{ label: "Copy Seedance Shot 3 BODY", value: extractSeedancePromptBody(seedanceShots[2] ?? "") }],
          },
          {
            step: 5,
            title: "Seedance Shot 4 — Resolved Tension",
            badge: "Seedance 2.0",
            color: seedanceColor,
            help: "Resolve the motion cleanly and keep the closing frame continuity-safe. Use a simple readable settle instead of adding a new major action.",
            value: seedanceShots[3] ?? "",
            actions: [{ label: "Copy Seedance Shot 4 BODY", value: extractSeedancePromptBody(seedanceShots[3] ?? "") }],
          },
          {
            step: 6,
            title: "Seedance Prompt Rules",
            badge: "Official guide",
            color: guideColor,
            help: "Use these rules while editing Seedance 2.0 prompts. Negative prompts do not work.",
            value: seedanceWorkflowGuide,
            actions: [{ label: "Copy Seedance Rules", value: seedanceWorkflowGuide }],
          },
        ],
      },
      runway: {
        pipeline:
          "Image Prompt → Master Still → Runway Shot 1 Opening Tension → Runway Shot 2 Pressure Build → Runway Shot 3 Peak Action → Runway Shot 4 Resolved Tension → CapCut",
        bannerTitle: "Optional Runway bundle",
        bannerBody:
          "Optional full Runway 4-shot bundle. Runway I2V is motion-first and identity comes from the uploaded image. Keep prompts continuity-safe, use 4 separate 5-second shots, and do not use negative prompts.",
        steps: [
          imageStep,
          {
            step: 2,
            title: "Runway Shot 1 — Opening Tension",
            badge: "Runway",
            color: runwayColor,
            help: "Use the clean master still or opening continuity frame. Keep both subjects readable from frame one.",
            value: runwayShots[0] ?? "",
            actions: [{ label: "Copy Runway Shot 1 BODY", value: extractRunwayPasteReady(runwayShots[0] ?? "") }],
          },
          {
            step: 3,
            title: "Runway Shot 2 — Pressure Build",
            badge: "Runway",
            color: runwayColor,
            help: "Build forward pressure gradually with clean spacing and a controlled tracking move.",
            value: runwayShots[1] ?? "",
            actions: [{ label: "Copy Runway Shot 2 BODY", value: extractRunwayPasteReady(runwayShots[1] ?? "") }],
          },
          {
            step: 4,
            title: "Runway Shot 3 — Peak Action",
            badge: "Runway",
            color: runwayColor,
            help: "This is the strongest Runway action beat. Keep motion forceful but still readable and continuity-safe.",
            value: runwayShots[2] ?? "",
            actions: [{ label: "Copy Runway Shot 3 BODY", value: extractRunwayPasteReady(runwayShots[2] ?? "") }],
          },
          {
            step: 5,
            title: "Runway Shot 4 — Resolved Tension",
            badge: "Runway",
            color: runwayColor,
            help: "Use a clean readable settle with stable spacing for the final frame family.",
            value: runwayShots[3] ?? "",
            actions: [{ label: "Copy Runway Shot 4 BODY", value: extractRunwayPasteReady(runwayShots[3] ?? "") }],
          },
          {
            step: 6,
            title: "Runway Prompt Rules",
            badge: "WSTV guide",
            color: guideColor,
            help: "Use these rules while editing Runway prompts. Identity lives in the image and negative prompts do not work.",
            value: runwayGuide,
            actions: [{ label: "Copy Runway Rules", value: runwayGuide }],
          },
        ],
      },
      kling: {
        pipeline:
          "Image Prompt → Master Still → Kling Shot 1 Opening Tension → Kling Shot 2 Pressure Build → Kling Shot 3 Peak Action → Kling Shot 4 Resolved Tension → CapCut",
        bannerTitle: "Optional Kling bundle",
        bannerBody:
          "Optional full Kling 4-shot bundle. Kling uses the image as a 3D anchor. Keep wide full-body readability, enable Bind Subject when needed, and use 4 separate 5-second shots.",
        steps: [
          imageStep,
          {
            step: 2,
            title: "Kling Shot 1 — Opening Tension",
            badge: "Kling",
            color: klingColor,
            help: "Start with a readable wide opening and immediate visible tension from frame one.",
            value: klingShots[0] ?? "",
            actions: [{ label: "Copy Kling Shot 1 BODY", value: extractKlingPromptBody(klingShots[0] ?? "") }],
          },
          {
            step: 3,
            title: "Kling Shot 2 — Pressure Build",
            badge: "Kling",
            color: klingColor,
            help: "Use Kling for stronger physics-safe pressure build while keeping full-body readability.",
            value: klingShots[1] ?? "",
            actions: [{ label: "Copy Kling Shot 2 BODY", value: extractKlingPromptBody(klingShots[1] ?? "") }],
          },
          {
            step: 4,
            title: "Kling Shot 3 — Peak Action",
            badge: "Kling",
            color: klingColor,
            help: "This is the strongest Kling action beat. Let the force rise, but keep spacing and body mechanics readable.",
            value: klingShots[2] ?? "",
            actions: [{ label: "Copy Kling Shot 3 BODY", value: extractKlingPromptBody(klingShots[2] ?? "") }],
          },
          {
            step: 5,
            title: "Kling Shot 4 — Resolved Tension",
            badge: "Kling",
            color: klingColor,
            help: "Settle the action cleanly and keep the end pose readable and continuity-safe.",
            value: klingShots[3] ?? "",
            actions: [{ label: "Copy Kling Shot 4 BODY", value: extractKlingPromptBody(klingShots[3] ?? "") }],
          },
          {
            step: 6,
            title: "Kling Prompt Rules",
            badge: "WSTV guide",
            color: guideColor,
            help: "Use these rules while editing Kling prompts. Keep it wide, readable, and continuity-safe.",
            value: klingGuide,
            actions: [{ label: "Copy Kling Rules", value: klingGuide }],
          },
        ],
      },
      hybrid: {
        pipeline:
          "Image Prompt → Master Still → Runway Shot 1 Opening Tension → Kling Shot 2 Pressure Build → Kling Shot 3 Peak Action → Runway Shot 4 Resolved Tension → CapCut",
        bannerTitle: "Primary hybrid 4-shot route",
        bannerBody:
          "This is the main WSTV production path. Use Runway for the clean opening and final settle, and Kling for Shot 2-3 pressure/action physics.",
        steps: [
          imageStep,
          {
            step: 2,
            title: "Hybrid Shot 1 — Runway Opening Tension",
            badge: "Runway",
            color: runwayColor,
            help: "Start with Runway for the cleanest first-frame readability and opening tension.",
            value: runwayShots[0] ?? "",
            actions: [{ label: "Copy Hybrid Shot 1 BODY", value: extractRunwayPasteReady(runwayShots[0] ?? "") }],
          },
          {
            step: 3,
            title: "Hybrid Shot 2 — Kling Pressure Build",
            badge: "Kling",
            color: klingColor,
            help: "Switch to Kling here for pressure build with stronger physics and readable body mechanics.",
            value: klingShots[1] ?? "",
            actions: [{ label: "Copy Hybrid Shot 2 BODY", value: extractKlingPromptBody(klingShots[1] ?? "") }],
          },
          {
            step: 4,
            title: "Hybrid Shot 3 — Kling Peak Action",
            badge: "Kling",
            color: klingColor,
            help: "Keep Kling for the strongest action beat before handing the final settle back to Runway.",
            value: klingShots[2] ?? "",
            actions: [{ label: "Copy Hybrid Shot 3 BODY", value: extractKlingPromptBody(klingShots[2] ?? "") }],
          },
          {
            step: 5,
            title: "Hybrid Shot 4 — Runway Resolved Tension",
            badge: "Runway",
            color: runwayColor,
            help: "Return to Runway for the clean readable final resolve and stable continuity-safe ending.",
            value: runwayShots[3] ?? "",
            actions: [{ label: "Copy Hybrid Shot 4 BODY", value: extractRunwayPasteReady(runwayShots[3] ?? "") }],
          },
          {
            step: 6,
            title: "Hybrid Routing Rules",
            badge: "Hybrid guide",
            color: hybridColor,
            help: "This pane shows the recommended engine handoff for the current WSTV hybrid workflow.",
            value: hybridGuide,
            actions: [{ label: "Copy Hybrid Rules", value: hybridGuide }],
          },
        ],
      },
    };
  }, [imagePrompt, klingShots, runwayShots, routingNote, seedanceShots, seedanceWorkflowGuide]);

  const currentWorkflow = workflows[mode];
  const pipeline = currentWorkflow.pipeline;

  function scrollToStep(step: number) {
    const el = stepRefs.current[step];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function nextStepOf(step: number) {
    if (step >= 6) return 6;
    return step + 1;
  }

  function toggle(step: number) {
    const nextVal = !done[step];
    setDoneByMode((prev) => ({
      ...prev,
      [mode]: { ...prev[mode], [step]: nextVal },
    }));

    const nextStep = nextVal ? nextStepOf(step) : step;
    setActiveStepByMode((prev) => ({ ...prev, [mode]: nextStep }));
    window.setTimeout(() => scrollToStep(nextStep), 50);
  }

  function resetAll() {
    setDoneByMode((prev) => ({ ...prev, [mode]: { ...emptyDone } }));
    setActiveStepByMode((prev) => ({ ...prev, [mode]: 1 }));
    window.setTimeout(() => scrollToStep(1), 50);
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-extrabold text-gray-900">WSTV Prompt Workflow Tracker</h2>
          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
            {copiedCount}/6 done
          </span>
          <span
            className={`inline-flex items-center gap-2 rounded px-2 py-0.5 text-xs font-bold ${drift.pill}`}
          >
            <span className="inline-block h-3 w-3 rounded-full bg-current opacity-30" />
            {drift.label}
          </span>
        </div>

        <button
          type="button"
          onClick={resetAll}
          className="text-xs font-semibold text-gray-500 hover:text-gray-800"
        >
          Reset
        </button>
      </div>

      <div className="mb-3 rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-xs text-indigo-800">
        <strong>Pipeline:</strong> {pipeline}
      </div>

      <div className="mb-4 rounded-xl border border-orange-200 bg-orange-50 p-3 text-xs text-orange-800">
        <strong>{currentWorkflow.bannerTitle}:</strong> {currentWorkflow.bannerBody}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {currentWorkflow.steps.map((item) => (
          <div
            key={`${mode}-${item.step}`}
            ref={(el) => {
              stepRefs.current[item.step] = el;
            }}
          >
            <WorkflowCard
              step={item.step}
              title={item.title}
              badge={item.badge}
              color={item.color}
              help={item.help}
              done={done[item.step]}
              onToggle={() => toggle(item.step)}
            >
              <TextBox value={item.value} />
              <div className={`mt-3 flex flex-wrap gap-2 ${item.actions.length === 1 ? "" : ""}`}>
                {item.actions.map((action) => (
                  <button
                    key={`${mode}-${item.step}-${action.label}`}
                    type="button"
                    onClick={() => onCopy(action.value)}
                    className={
                      action.secondary
                        ? "flex-1 rounded-lg border border-amber-300 bg-white py-2 text-xs font-bold text-amber-800 hover:bg-amber-50 active:scale-[0.99]"
                        : `${item.actions.length > 1 ? "flex-1 " : "w-full "}rounded-lg bg-gray-900 py-2 text-xs font-bold text-white hover:bg-black active:scale-[0.99]`
                    }
                  >
                    📋 {action.label}
                  </button>
                ))}
              </div>
            </WorkflowCard>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {[
          { key: "hybrid", label: "Hybrid Primary" },
          { key: "seedance", label: "Seedance Optional" },
          { key: "runway", label: "Runway Optional" },
          { key: "kling", label: "Kling Optional" },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => {
              const nextMode = item.key as WorkflowMode;
              setMode(nextMode);
              window.setTimeout(() => {
                scrollToStep(activeStepByMode[nextMode] ?? 1);
              }, 50);
            }}
            className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${
              mode === item.key
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DEFAULT EXPORT — Main OutputCards wrapper
// ─────────────────────────────────────────────────────────────

function copyToClipboard(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => {});
  }
}

type OutputWorkspaceTab =
  | "overview"
  | "prompts"
  | "video"
  | "direct"
  | "publishing"
  | "advanced";

type VideoWorkspaceTab = "hybrid" | "seedance" | "runway" | "kling";
type DirectWorkspaceTab = "seedance" | "kling15" | "kling6";

function WorkspaceTabButton({
  label,
  detail,
  badge,
  active,
  onClick,
}: {
  label: string;
  detail: string;
  badge: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-[180px] rounded-2xl border px-4 py-3 text-left transition ${
        active
          ? "border-gray-900 bg-gray-900 text-white shadow-sm"
          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-extrabold">{label}</div>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
            active ? "bg-white/15 text-white" : "bg-gray-100 text-gray-500"
          }`}
        >
          {badge}
        </span>
      </div>
      <div
        className={`mt-1 text-xs leading-relaxed ${
          active ? "text-white/80" : "text-gray-500"
        }`}
      >
        {detail}
      </div>
    </button>
  );
}

function WorkspaceJumpCard({
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
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${
        active
          ? "border-gray-900 bg-gray-900 text-white shadow-sm"
          : "border-gray-200 bg-white/90 text-gray-900 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-sm"
      }`}
    >
      <div
        className={`text-[11px] font-black uppercase tracking-[0.18em] ${
          active ? "text-white/60" : "text-gray-400"
        }`}
      >
        {eyebrow}
      </div>
      <div className="mt-2 text-lg font-black">{title}</div>
      <p
        className={`mt-2 text-sm leading-relaxed ${
          active ? "text-white/80" : "text-gray-600"
        }`}
      >
        {detail}
      </p>
      <div
        className={`mt-4 text-xs font-extrabold uppercase tracking-wide ${
          active ? "text-white" : "text-gray-500"
        }`}
      >
        {footer}
      </div>
    </button>
  );
}

export default function OutputCards({
  data,
  onRestoreVersion,
}: {
  data: GeneratedPackage;
  onRestoreVersion?: (v: PromptVersion) => void;
}) {
  const onCopy = copyToClipboard;
  const [showWSTVWorkflowDiagram, setShowWSTVWorkflowDiagram] = useState(false);
  const [activeWorkspace, setActiveWorkspace] =
    useState<OutputWorkspaceTab>("overview");
  const [videoWorkspace, setVideoWorkspace] =
    useState<VideoWorkspaceTab>("hybrid");
  const [directWorkspace, setDirectWorkspace] =
    useState<DirectWorkspaceTab>("seedance");

  const runwayShots = useMemo(
  () => (data.runwayShots ?? []).map((s) => String(s ?? "")),
  [data.runwayShots]
);

  const klingShots = useMemo(
    () => (data.klingShots ?? []).map((s) => String(s ?? "")),
    [data.klingShots]
  );

  const seedanceShots = useMemo(
    () => (data.seedanceShots ?? []).map((s) => String(s ?? "")),
    [data.seedanceShots]
  );

  const versionKey = useMemo(() => {
    const p = data.predatorName ?? "";
    const r = data.preyName ?? "";
    const a = String(data.arcName ?? "");
    if (!p || !r || !a) return "";
    return `${p}|${r}|${a}`;
  }, [data.predatorName, data.preyName, data.arcName]);

  function safeStr(v: unknown) {
    if (typeof v === "string") return v.trim();
    if (Array.isArray(v)) return v.map(String).join("\n").trim();
    return String(v ?? "").trim();
  }

  const primaryShotPlan = useMemo(() => {
    return (data.shotPlan ?? []).map((item, index) => {
      const title = safeStr(item.title) || `Shot ${index + 1}`;
      const note = title.split("—")[1]?.trim() ?? "";
      const isRunway = item.engine === "RUNWAY";

      return {
        ...item,
        title,
        note,
        cardEngine: isRunway ? ("runway" as const) : ("kling" as const),
        engineLabel: isRunway ? "Runway" : "Kling",
        color: isRunway
          ? "border-green-200 bg-green-50 text-green-900"
          : "border-blue-200 bg-blue-50 text-blue-900",
      };
    });
  }, [data.shotPlan]);

  function buildCopyAllPacksText() {
    const seedance = seedanceShots
      .map((s, i) => `Seedance Shot ${i + 1}\n${safeStr(s)}`)
      .join("\n\n---\n\n");

    const runway = runwayShots
      .map((s, i) => `Runway Shot ${i + 1}\n${safeStr(s)}`)
      .join("\n\n---\n\n");

    const kling = klingShots
      .map((s, i) => `Kling Shot ${i + 1}\n${safeStr(s)}`)
      .join("\n\n---\n\n");

  const twoPart = buildTwoPartText();
  const capCutScript = buildCapCutScriptText();
  const animalBehavior = buildAnimalBehaviorText();
  const soundDesign = buildSoundDesignText();
  const shotImagePlanText = (data.shotImagePlan ?? [])
    .map(
      (plan, i) =>
        `Image ${i + 1} — ${safeStr(plan.title)}\nSource: ${
          plan.source === "master" ? "Master image" : "Previous shot image"
        }\n${safeStr(plan.prompt)}`
    )
    .join("\n\n---\n\n");

  return [
    `WSTV EXPORT PACK (Pro 2026)`,
    `Predator: ${safeStr(data.predatorName)}`,
    `Prey: ${safeStr(data.preyName)}`,
    `Arc: ${safeStr(data.arcName)}`,
    data.routingNote ? `Routing: ${safeStr(data.routingNote)}` : "",
    "",
    `=== 4-SHOT IMAGE PLAN ===`,
    shotImagePlanText || "(none)",
    "",
    `=== SEEDANCE PACK (I2V | simple motion-first prompting | NO negatives) ===`,
    seedance || "(none)",
    "",
    `=== SEEDANCE MULTI-SHOT ===`,
    safeStr((data as Record<string, unknown>).seedanceMultiShotPrompt) || "(none)",
    "",
    `=== RUNWAY PACK (Gen-4.5 | 24/25fps | 720p | NO negatives) ===`,
    runway || "(none)",
    "",
    `=== KLING PACK (3.0 | WSTV action workflow | Negatives OK) ===`,
    kling || "(none)",
    "",
    `=== KLING DIRECT (15s) ===`,
    safeStr((data as Record<string, unknown>).klingNative15s) || "(none)",
    "",
    `=== KLING 6-SHOT (DIRECT) ===`,
    safeStr((data as Record<string, unknown>).klingSixShot) || "(none)",
    "",
    twoPart,
    "",
    capCutScript,
    "",
    animalBehavior,
    "",
    soundDesign,
  ]
    .filter(Boolean)
    .join("\n");
  }
  function buildTwoPartText() {
    if (!data.twoPartViralOverview) return "";

    return [
      "=== TWO-PART VIRAL PRESET ===",
      data.twoPartViralOverview
        ? `OVERVIEW\n${safeStr(data.twoPartViralOverview)}`
        : "",
      data.twoPartWorkflowGuide
        ? `WORKFLOW GUIDE\n${safeStr(data.twoPartWorkflowGuide)}`
        : "",
      data.twoPartPart1Hook
        ? `PART 1 HOOK\n${safeStr(data.twoPartPart1Hook)}`
        : "",
      data.twoPartPart1Caption
        ? `PART 1 CAPTION\n${safeStr(data.twoPartPart1Caption)}`
        : "",
      data.twoPartPart1Draft
        ? `PART 1 DRAFT\n${safeStr(data.twoPartPart1Draft)}`
        : "",
      data.twoPartPart1Final
        ? `PART 1 FINAL\n${safeStr(data.twoPartPart1Final)}`
        : "",
      data.twoPartPart2Hook
        ? `PART 2 HOOK\n${safeStr(data.twoPartPart2Hook)}`
        : "",
      data.twoPartPart2Caption
        ? `PART 2 CAPTION\n${safeStr(data.twoPartPart2Caption)}`
        : "",
      data.twoPartPart2Draft
        ? `PART 2 DRAFT\n${safeStr(data.twoPartPart2Draft)}`
        : "",
      data.twoPartPart2Final
        ? `PART 2 FINAL\n${safeStr(data.twoPartPart2Final)}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  function buildCapCutScriptText() {
    if (!data.capCutScript) return "";

    return [
      "=== CAPCUT SCRIPT ===",
      `Duration: ${data.capCutScript.totalDuration}`,
      `Aspect Ratio: ${data.capCutScript.aspectRatio}`,
      `FPS: ${data.capCutScript.fps}`,
      `Music Mood: ${data.capCutScript.musicMood}`,
      "",
      ...data.capCutScript.beats.map(
        (b) =>
          `[${b.timeIn} → ${b.timeOut}] ${b.shotRef}\n` +
          `Text: ${b.onScreenText}\n` +
          `Transition: ${b.transition}\n` +
          `SFX: ${b.sfx}\n` +
          `Music: ${b.musicNote}`
      ),
      "",
      `Export: ${data.capCutScript.exportSettings}`,
    ].join("\n");
  }

  function buildAnimalBehaviorText() {
    if (!data.animalBehavior) return "";

    return [
      `=== ANIMAL BEHAVIOR (${safeStr(data.predatorName ?? "Subject")}) ===`,
      `PRE-ATTACK\n${data.animalBehavior.preAttackSignals.join("\n")}`,
      `MOTION\n${data.animalBehavior.naturalMotion.join("\n")}`,
      `SOUND\n${data.animalBehavior.soundDesign.join("\n")}`,
      `BODY LANGUAGE\n${data.animalBehavior.bodyLanguage.join("\n")}`,
      `FACTS\n${data.animalBehavior.habitatFacts.join("\n")}`,
      `PROMPT INJECTION\n${data.animalBehavior.promptInjection}`,
    ].join("\n\n");
  }

  function buildSoundDesignText() {
    if (!data.soundDesignPack) return "";

    return [
      "=== SOUND DESIGN PACK ===",
      `Shot 1 Ambient: ${safeStr(data.soundDesignPack.shot1_ambient)}`,
      `Shot 1 Animal: ${safeStr(data.soundDesignPack.shot1_animal)}`,
      `Shot 2 Impact: ${safeStr(data.soundDesignPack.shot2_impact)}`,
      `Shot 2 Animal: ${safeStr(data.soundDesignPack.shot2_animal)}`,
      `Shot 3 Resolve: ${safeStr(data.soundDesignPack.shot3_resolve)}`,
      `Music Mood: ${safeStr(data.soundDesignPack.musicMood)}`,
      `Kling Audio Prompt:\n${safeStr(data.soundDesignPack.klingAudioPrompt)}`,
      `CapCut SFX:\n${data.soundDesignPack.capCutSFX.join("\n")}`,
    ].join("\n\n");
  }
  function buildExportTxtFull() {
    const packs = buildCopyAllPacksText();

    return [
      packs,
      "",
      `=== CORE PROMPTS ===`,
      `IMAGE PROMPT\n${safeStr(data.imagePrompt)}`,
      "",
      `NEGATIVE PROMPT\n${safeStr(
        (data as Record<string, unknown>).negativePrompt
      )}`,
      "",
      `THUMBNAIL PROMPT\n${safeStr(
        (data as Record<string, unknown>).thumbnailPrompt
      )}`,
      "",
      `VOICEOVER\n${safeStr((data as Record<string, unknown>).voiceoverLine)}`,
      "",
      `CAPCUT PLAN\n${safeStr((data as Record<string, unknown>).capCutPlan)}`,
      "",
      `CLIP CHAINING\n${safeStr(
        (data as Record<string, unknown>).clipChaining
      )}`,
      "",
      `HOOK\n${safeStr((data as Record<string, unknown>).hook)}`,
      "",
      `CAPTION\n${safeStr((data as Record<string, unknown>).caption)}`,
      "",
      `CTA\n${safeStr((data as Record<string, unknown>).cta)}`,
      "",
      `HASHTAGS\n${safeStr((data as Record<string, unknown>).hashtags)}`,
    ].join("\n");
  }

  async function copyAllPacks() {
    const text = buildCopyAllPacksText();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      onCopy(text);
    }
  }

  function exportTxt() {
    const text = buildExportTxtFull();
    const p = safeStr(data.predatorName || "predator");
    const r = safeStr(data.preyName || "prey");
    const a = safeStr(data.arcName || "arc").replace(/\s+/g, "_");
    downloadText(`wstv-export-${p}-vs-${r}-${a}.txt`, text);
  }

  const hasSeedanceDirect =
    data.seedanceMultiShotPrompt !== undefined &&
    data.seedanceMultiShotPrompt !== null;
  const hasKling15Direct =
    data.klingNative15s !== undefined && data.klingNative15s !== null;
  const hasKling6Direct =
    data.klingSixShot !== undefined && data.klingSixShot !== null;

  const resolvedDirectWorkspace: DirectWorkspaceTab =
    directWorkspace === "seedance" && hasSeedanceDirect
      ? "seedance"
      : directWorkspace === "kling15" && hasKling15Direct
        ? "kling15"
        : directWorkspace === "kling6" && hasKling6Direct
          ? "kling6"
          : hasSeedanceDirect
            ? "seedance"
            : hasKling15Direct
              ? "kling15"
              : "kling6";

  const workspaceTabs: {
    key: OutputWorkspaceTab;
    label: string;
    detail: string;
    badge: string;
  }[] = [
    {
      key: "overview",
      label: "Overview",
      detail: "Diagram, routing, prompt map, versions",
      badge: "Start",
    },
    {
      key: "prompts",
      label: "Prompts",
      detail: "Image, thumbnail, negative, image plan",
      badge: "Core",
    },
    {
      key: "video",
      label: "Video",
      detail: "Primary hybrid route, plus optional Seedance, Runway, and Kling bundles",
      badge: "4 shots",
    },
    {
      key: "direct",
      label: "Direct",
      detail: "Single-paste multi-shot prompt blocks",
      badge: "Fast",
    },
    {
      key: "publishing",
      label: "Publishing",
      detail: "Hooks, caption, packs, posting",
      badge: "Post",
    },
    {
      key: "advanced",
      label: "Advanced",
      detail: "CapCut, sound, behavior, analytics",
      badge: "Pro",
    },
  ];

  const workspaceOverviewCards = [
    {
      key: "overview" as const,
      eyebrow: "Story",
      title: `${safeStr(data.predatorName || "Predator")} vs ${safeStr(
        data.preyName || "Prey"
      )}`,
      detail:
        safeStr(data.arcName || "") ||
        "Core story arc appears here once a package is generated.",
      footer: data.routingNote
        ? `Routing: ${safeStr(data.routingNote)}`
        : "Open routing and workflow map",
    },
    {
      key: "prompts" as const,
      eyebrow: "Prompts",
      title: `${data.shotImagePlan?.length ?? 0} image prompts ready`,
      detail:
        "Image prompt, thumbnail prompt, and continuity image plan are grouped together here.",
      footer: "Open core prompt workspace",
    },
    {
      key: "video" as const,
      eyebrow: "Video",
      title: `${seedanceShots.length}/${runwayShots.length}/${klingShots.length} engine packs`,
      detail:
        "Switch between the primary Hybrid route and the optional Seedance, Runway, and Kling bundles instead of scrolling through every shot at once.",
      footer: "Open video workspace",
    },
    {
      key: "direct" as const,
      eyebrow: "Direct",
      title: `${
        [hasSeedanceDirect, hasKling15Direct, hasKling6Direct].filter(Boolean)
          .length
      } direct prompts available`,
      detail:
        "Single-paste multi-shot prompt blocks live here for faster testing inside the generation tools.",
      footer: "Open direct prompt workspace",
    },
    {
      key: "publishing" as const,
      eyebrow: "Publishing",
      title: "Hook, caption, CTA, posting",
      detail:
        "Social copy, platform packs, and final posting guidance are separated from the build phase.",
      footer: "Open publishing workspace",
    },
    {
      key: "advanced" as const,
      eyebrow: "Advanced",
      title: "CapCut, sound, behavior, analytics",
      detail:
        "Keep research-heavy and polish-heavy assets in one place so daily work stays lighter.",
      footer: "Open advanced workspace",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-amber-50 p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">
              WSTV Output Workspace
            </div>
            <h2 className="mt-1 text-2xl font-black text-slate-900">
              Compact dashboard view
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Long-scroll कम गर्न outputs लाई focused workspaces मा छुट्याइएको छ.
              Daily काम गर्दा main prompt, video engine, direct prompt, publishing,
              र advanced tools अब छुट्टै switch गरेर खोल्न मिल्छ.
            </p>
            {data.routingNote && (
              <div className="mt-3 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
                Current routing: {safeStr(data.routingNote)}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyAllPacks}
              className="rounded-xl bg-gray-900 px-4 py-2 text-xs font-extrabold text-white hover:bg-black active:scale-95"
            >
              📋 Copy All Packs
            </button>

            <button
              type="button"
              onClick={exportTxt}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-extrabold text-gray-800 hover:bg-gray-50 active:scale-95"
            >
              ⬇ Export TXT
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {workspaceOverviewCards.map((item) => (
            <WorkspaceJumpCard
              key={item.key}
              eyebrow={item.eyebrow}
              title={item.title}
              detail={item.detail}
              footer={item.footer}
              active={activeWorkspace === item.key}
              onClick={() => setActiveWorkspace(item.key)}
            />
          ))}
        </div>
      </div>

      <div className="sticky top-3 z-20 overflow-x-auto rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-sm backdrop-blur">
        <div className="flex gap-2">
          {workspaceTabs.map((item) => (
            <WorkspaceTabButton
              key={item.key}
              label={item.label}
              detail={item.detail}
              badge={item.badge}
              active={activeWorkspace === item.key}
              onClick={() => setActiveWorkspace(item.key)}
            />
          ))}
        </div>
      </div>

      {activeWorkspace === "overview" && (
        <div className="space-y-6">
          <EngineSpecsPanel />

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
            Meta Reels export: 9:16 vertical, audio on, and keep important text
            inside the safe zone.
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionLabel label="WSTV Pipeline — Node Graph" />
            <button
              type="button"
              onClick={() => setShowWSTVWorkflowDiagram((prev) => !prev)}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-extrabold text-gray-800 hover:bg-gray-50 active:scale-95"
            >
              {showWSTVWorkflowDiagram ? "Hide Diagram" : "Show Diagram"}
            </button>
          </div>
          {showWSTVWorkflowDiagram ? (
            <WSTVWorkflowDiagram data={data} onCopy={onCopy} />
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
              Node graph hidden by default. Click &quot;Show Diagram&quot; to
              open it.
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
      )}

      {activeWorkspace === "prompts" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm">
            Core prompt workspace मा image prompt, thumbnail prompt, negative
            prompt, र continuity image plan grouped छन् so setup गर्दा यही tab
            enough हुन्छ.
          </div>

          <SectionLabel label="Core Prompts" />

          <Card
            title="📸 Image Prompt"
            value={data.imagePrompt}
            onCopy={onCopy}
            accent="border-l-amber-500"
            aiEnhanced={data.aiEnhanced}
            extraActions={[
              {
                label: "Copy BODY",
                onClick: () => onCopy(extractImagePromptBody(data.imagePrompt)),
                className:
                  "rounded border border-amber-300 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-800 hover:bg-amber-100 active:scale-95",
              },
            ]}
          />

          {data.shotImagePlan && data.shotImagePlan.length > 0 && (
            <ShotImagePlanPanel plans={data.shotImagePlan} onCopy={onCopy} />
          )}

          {data.negativePrompt && (
            <Card
              title="🚫 Negative Prompt (Kling / image models only, not Runway)"
              value={data.negativePrompt}
              onCopy={onCopy}
              accent="border-l-red-400"
              extraActions={[
                {
                  label: "⚠️ NOT for Runway",
                  onClick: () => {},
                  className:
                    "cursor-default rounded border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600",
                },
              ]}
            />
          )}

          {data.thumbnailPrompt && (
            <Card
              title="🖼️ Thumbnail Prompt"
              value={data.thumbnailPrompt}
              onCopy={onCopy}
              accent="border-l-purple-400"
            />
          )}
        </div>
      )}

      {activeWorkspace === "video" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-extrabold text-gray-900">
                  Video workspace
                </div>
                <p className="mt-1 max-w-3xl text-xs leading-relaxed text-gray-600">
                  Default WSTV video setup is the primary hybrid 4-shot
                  path. Seedance 2.0, full Runway 4-shot, and full Kling
                  4-shot bundles stay available below as optional views.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  {
                    key: "hybrid" as const,
                    label: "Hybrid Primary",
                  },
                  {
                    key: "seedance" as const,
                    label: "Seedance Optional",
                  },
                  {
                    key: "runway" as const,
                    label: "Runway Optional",
                  },
                  {
                    key: "kling" as const,
                    label: "Kling Optional",
                  },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setVideoWorkspace(item.key)}
                    className={`rounded-xl border px-3 py-2 text-xs font-extrabold ${
                      videoWorkspace === item.key
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <SectionLabel label="🎬 Video Shots (Pro Layout)" />

          {videoWorkspace === "hybrid" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-extrabold text-violet-900">
                    Primary hybrid 4-shot route summary
                  </div>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-violet-700 ring-1 ring-violet-200">
                    Runway 1 → Kling 2-3 → Runway 4
                  </span>
                </div>

                <p className="mt-2 text-xs leading-relaxed text-violet-800">
                  This primary route keeps the opening and resolve cleaner in
                  Runway, while using Kling for the middle pressure/action beats.
                  It matches the main mixed-engine WSTV workflow.
                </p>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {primaryShotPlan.map((item, index) => (
                    <div
                      key={`${item.engine}-${item.title}-${index}`}
                      className={`rounded-2xl border p-3 ${item.color}`}
                    >
                      <div className="text-[11px] font-black uppercase tracking-wide">
                        {`Shot ${index + 1}`}
                      </div>
                      <div className="mt-2 text-base font-black">
                        {item.engineLabel}
                      </div>
                      <div className="mt-1 text-xs font-medium opacity-80">
                        {item.note}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                {primaryShotPlan.map((item, index) => (
                  <ProShotCard
                    key={`${item.engine}-${item.title}-${index}`}
                    engine={item.cardEngine}
                    index={index}
                    shot={safeStr(item.prompt)}
                    onCopy={onCopy}
                  />
                ))}
              </div>
            </div>
          )}

          {videoWorkspace === "seedance" && (
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 shadow-sm">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-extrabold text-orange-900">
                  Seedance Shots
                </div>
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-orange-700 ring-1 ring-orange-200">
                  Seedance 2.0 | optional full 4-shot bundle | multimodal refs
                </span>
              </div>

              <p className="mb-3 text-xs text-orange-800">
                Optional full Seedance 2.0 bundle. Base workflow: `Prompt` + `First Frame`,
                then add `Ref Image` or `Ref Video` only when useful. Standard
                Seedance setup here is 4 separate shots at 5 seconds each. Keep static description
                light, describe subject movement + background movement + camera
                movement, and avoid negative prompts.
              </p>

              <div className="mb-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onCopy(
                      seedanceShots
                        .map((s) => extractSeedancePromptBody(s))
                        .filter(Boolean)
                        .join("\n\n---\n\n")
                    )
                  }
                  className="rounded-lg border border-orange-200 bg-orange-100 px-3 py-1.5 text-xs font-extrabold text-orange-900 hover:bg-orange-200 active:scale-95"
                >
                  Copy Seedance Bodies
                </button>

                {data.seedanceMultiShotPrompt && (
                  <button
                    type="button"
                    onClick={() => {
                      setDirectWorkspace("seedance");
                      setActiveWorkspace("direct");
                    }}
                    className="rounded-lg border border-orange-300 bg-white px-3 py-1.5 text-xs font-extrabold text-orange-800 hover:bg-orange-50 active:scale-95"
                  >
                    Open Direct Seedance Prompt
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {seedanceShots.map((shot, i) => (
                  <ProShotCard
                    key={`seedance-pro-${i}`}
                    engine="seedance"
                    index={i}
                    shot={shot}
                    onCopy={onCopy}
                  />
                ))}
              </div>
            </div>
          )}

          {videoWorkspace === "runway" && (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="text-sm font-extrabold text-green-900">
                  Runway Shots
                </div>
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-green-700 ring-1 ring-green-200">
                  Gen-4.5 | 24/25fps | 720p
                </span>
              </div>

              <p className="mb-3 text-xs text-green-800">
                Optional full Runway 4-shot bundle. It supports opening tension,
                pressure build, peak action, and resolved tension. In the hybrid
                route, Runway is used for Shot 1 and Shot 4.
              </p>

              <p className="mb-3 text-xs text-green-800">
                I2V = motion only. No negative prompts. Last-frame chaining is
                recommended only when the outgoing frame remains a clean
                full-body handoff frame.
              </p>

              <div className="mb-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onCopy(
                      runwayShots
                        .map((s) => extractRunwayPasteReady(s))
                        .filter(Boolean)
                        .join("\n\n---\n\n")
                    )
                  }
                  className="rounded-lg border border-green-200 bg-green-100 px-3 py-1.5 text-xs font-extrabold text-green-900 hover:bg-green-200 active:scale-95"
                >
                  Copy Runway Bodies
                </button>
              </div>

              <div className="space-y-3">
                {runwayShots.map((shot, i) => (
                  <ProShotCard
                    key={`runway-pro-${i}`}
                    engine="runway"
                    index={i}
                    shot={shot}
                    onCopy={onCopy}
                  />
                ))}
              </div>
            </div>
          )}

          {videoWorkspace === "kling" && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="text-sm font-extrabold text-blue-900">
                  Kling Shots
                </div>
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-blue-700 ring-1 ring-blue-200">
                  Kling 3.0 | Action workflow | Audio-capable
                </span>
              </div>

              <p className="mb-3 text-xs text-blue-800">
                Optional full Kling 4-shot bundle. It works especially well for
                pressure build and peak action, and the hybrid route uses Kling
                for Shot 2 and Shot 3.
              </p>
              <p className="mb-3 text-xs text-blue-800">
                Paste-ready body is director-style narrative. Negative prompts
                OK. Bind Subject + Start/End Frame. Structured breakdown remains
                for reference.
              </p>

              <div className="mb-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onCopy(
                      klingShots
                        .map((s) => extractKlingPromptBody(s))
                        .filter(Boolean)
                        .join("\n\n---\n\n")
                    )
                  }
                  className="rounded-lg border border-blue-200 bg-blue-100 px-3 py-1.5 text-xs font-extrabold text-blue-900 hover:bg-blue-200 active:scale-95"
                >
                  Copy Kling Bodies
                </button>
                {data.klingNative15s && (
                  <button
                    type="button"
                    onClick={() => {
                      setDirectWorkspace("kling15");
                      setActiveWorkspace("direct");
                    }}
                    className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-extrabold text-blue-800 hover:bg-blue-50 active:scale-95"
                  >
                    Open Kling 15s Direct Prompt
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {klingShots.map((shot, i) => (
                  <ProShotCard
                    key={`kling-pro-${i}`}
                    engine="kling"
                    index={i}
                    shot={shot}
                    onCopy={onCopy}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeWorkspace === "direct" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-extrabold text-gray-900">
                  Direct prompt workspace
                </div>
                <p className="mt-1 max-w-3xl text-xs leading-relaxed text-gray-600">
                  One-click multi-shot prompts live here. Seedance 2.0 stays
                  available as an optional direct 4-shot bundle, while Kling formats
                  remain optional alternate / extended prompt formats.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {data.seedanceMultiShotPrompt && (
                  <button
                    type="button"
                    onClick={() => setDirectWorkspace("seedance")}
                    className={`rounded-xl border px-3 py-2 text-xs font-extrabold ${
                      resolvedDirectWorkspace === "seedance"
                        ? "border-orange-700 bg-orange-700 text-white"
                        : "border-orange-200 bg-white text-orange-800 hover:bg-orange-50"
                    }`}
                  >
                    Seedance 2.0
                  </button>
                )}
                {data.klingNative15s && (
                  <button
                    type="button"
                    onClick={() => setDirectWorkspace("kling15")}
                    className={`rounded-xl border px-3 py-2 text-xs font-extrabold ${
                      resolvedDirectWorkspace === "kling15"
                        ? "border-blue-700 bg-blue-700 text-white"
                        : "border-blue-200 bg-white text-blue-800 hover:bg-blue-50"
                    }`}
                  >
                    Kling 15s Optional
                  </button>
                )}
                {data.klingSixShot && (
                  <button
                    type="button"
                    onClick={() => setDirectWorkspace("kling6")}
                    className={`rounded-xl border px-3 py-2 text-xs font-extrabold ${
                      resolvedDirectWorkspace === "kling6"
                        ? "border-indigo-700 bg-indigo-700 text-white"
                        : "border-indigo-200 bg-white text-indigo-800 hover:bg-indigo-50"
                    }`}
                  >
                    Kling 6-Shot Optional
                  </button>
                )}
              </div>
            </div>
          </div>

          {resolvedDirectWorkspace === "seedance" &&
            data.seedanceMultiShotPrompt !== undefined &&
            data.seedanceMultiShotPrompt !== null && (
              <div className="rounded-2xl border border-orange-300 bg-orange-50 p-4 shadow-sm">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-extrabold text-orange-900">
                      Seedance 2.0 Direct Multi-Shot
                    </div>

                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-orange-700 ring-1 ring-orange-200">
                      Seedance 2.0
                    </span>

                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-extrabold text-green-700 ring-1 ring-green-200">
                      ✓ 4 shots — 1 prompt
                    </span>

                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-extrabold text-amber-800 ring-1 ring-amber-200">
                      Prompt + First Frame
                    </span>
                  </div>
                </div>

                <p className="mb-3 text-xs leading-relaxed text-orange-800">
                  यो Kling ko direct multi-shot pane जस्तै Seedance 2.0 ko लागि
                  हो. एउटै continuity prompt लाई direct paste गर्न मिल्छ.
                  Current WSTV flow मा 4 linked shots छन्: opening tension →
                  pressure build → peak action → resolved tension. Best result ka
                  lagi `Prompt` + `First Frame` base राख्नुस्, ani चाहियो भने
                  मात्र `Ref Image` / `Ref Video` थप्नुस्.
                </p>

                <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-xl border border-orange-200 bg-white p-3 text-xs leading-relaxed text-gray-900">
                  {String(data.seedanceMultiShotPrompt)}
                </pre>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onCopy(String(data.seedanceMultiShotPrompt))}
                    className="rounded-xl bg-orange-700 px-4 py-2 text-sm font-extrabold text-white hover:bg-orange-800 active:scale-[0.98]"
                  >
                    📋 Copy Full Seedance Prompt
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onCopy(
                        extractSeedancePromptBody(
                          String(data.seedanceMultiShotPrompt)
                        )
                      )
                    }
                    className="rounded-xl border border-orange-300 bg-white px-4 py-2 text-sm font-extrabold text-orange-700 hover:bg-orange-50 active:scale-[0.98]"
                  >
                    📋 Copy BODY Only
                  </button>
                </div>
              </div>
            )}

          {resolvedDirectWorkspace === "kling15" &&
            data.klingNative15s !== undefined &&
            data.klingNative15s !== null && (
              <div className="rounded-2xl border border-blue-300 bg-blue-50 p-4 shadow-sm">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-extrabold text-blue-900">
                      Kling 15-Second Native Multi-Shot
                    </div>

                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-blue-700 ring-1 ring-blue-200">
                      Kling 3.0 Pro / Standard
                    </span>

                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-extrabold text-green-700 ring-1 ring-green-200">
                      ✓ Zero inter-clip drift
                    </span>

                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-extrabold text-amber-800 ring-1 ring-amber-200">
                      Action-ready | Audio-capable
                    </span>
                  </div>
                </div>

                <p className="mb-3 text-xs leading-relaxed text-blue-800">
                  यो एउटै prompt Kling 3.0 Pro/Standard मा paste गर्दा 15
                  seconds को continuous video आउँछ। 3 अलग shots generate
                  हुन्छन्, Bind Subject / element references use गर्दा subject
                  continuity reinforce गर्न सकिन्छ।
                </p>

                <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-xl border border-blue-200 bg-white p-3 text-xs leading-relaxed text-gray-900">
                  {String(data.klingNative15s)}
                </pre>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onCopy(String(data.klingNative15s))}
                    className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-extrabold text-white hover:bg-blue-800 active:scale-[0.98]"
                  >
                    📋 Copy Full 15s Prompt
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onCopy(extractKlingPromptBody(String(data.klingNative15s)))
                    }
                    className="rounded-xl border border-blue-300 bg-white px-4 py-2 text-sm font-extrabold text-blue-700 hover:bg-blue-50 active:scale-[0.98]"
                  >
                    📋 Copy BODY Only
                  </button>
                </div>
              </div>
            )}

          {resolvedDirectWorkspace === "kling6" &&
            data.klingSixShot !== undefined &&
            data.klingSixShot !== null && (
              <div className="rounded-2xl border border-indigo-300 bg-indigo-50 p-4 shadow-sm">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-extrabold text-indigo-900">
                      Kling 6-Shot Multi-Scene
                    </div>

                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-indigo-700 ring-1 ring-indigo-200">
                      Kling 3.0 Pro / Standard
                    </span>

                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-extrabold text-green-700 ring-1 ring-green-200">
                      ✓ 6 shots — 1 prompt
                    </span>

                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-extrabold text-amber-800 ring-1 ring-amber-200">
                      Current WSTV workflow
                    </span>
                  </div>
                </div>
                <p className="mb-3 text-xs leading-relaxed text-indigo-800">
                  <span className="font-extrabold">WSTV multi-shot flow:</span>{" "}
                  Opening tension → Pressure hold → Profile pressure → Tension
                  reaction cut → Action pressure wide → Resolved tension wide.
                  एकै prompt ले 6 cinematic shots generate गर्छ — subject
                  identity सबै shots मा locked हुन्छ, and the opening starts
                  with clearer full-subject readability.
                </p>

                <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-xl border border-indigo-200 bg-white p-3 text-xs leading-relaxed text-gray-900">
                  {String(data.klingSixShot)}
                </pre>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onCopy(String(data.klingSixShot))}
                    className="rounded-xl bg-indigo-700 px-4 py-2 text-sm font-extrabold text-white hover:bg-indigo-800 active:scale-[0.98]"
                  >
                    📋 Copy Full 6-Shot Prompt
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onCopy(extractKlingPromptBody(String(data.klingSixShot)))
                    }
                    className="rounded-xl border border-indigo-300 bg-white px-4 py-2 text-sm font-extrabold text-indigo-700 hover:bg-indigo-50 active:scale-[0.98]"
                  >
                    📋 Copy BODY Only
                  </button>
                </div>
              </div>
            )}
        </div>
      )}

      {activeWorkspace === "publishing" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 shadow-sm">
            Posting ready assets यहाँ राखिएको छ: hook, caption, voiceover, CTA,
            hashtags, platform pack, अनि posting time guidance.
          </div>

          <SectionLabel label="Hooks & Copy" />

          {data.hook2026 && data.hook2026.length > 0 ? (
            <Hook2026Panel
              hooks={data.hook2026}
              oldHook={data.hook}
              onCopy={onCopy}
              recommendedIndex={data.recommendedHookIndex}
            />
          ) : data.hook ? (
            <Card
              title="🔥 Hook"
              value={data.hook}
              onCopy={onCopy}
              accent="border-l-orange-500"
            />
          ) : null}

          {data.caption2026 ? (
            <Caption2026Panel
              caption2026={data.caption2026}
              captionOld={data.caption}
              onCopy={onCopy}
            />
          ) : data.caption ? (
            <Card
              title="📝 Caption"
              value={data.caption}
              onCopy={onCopy}
              accent="border-l-emerald-500"
            />
          ) : null}

          {data.voiceoverLine && (
            <Card
              title="🎙️ Voiceover"
              value={data.voiceoverLine}
              onCopy={onCopy}
              accent="border-l-indigo-500"
              aiEnhanced={data.aiEnhanced}
            />
          )}

          {data.cta && <Card title="📢 CTA" value={data.cta} onCopy={onCopy} />}

          {data.hashtags && (
            <Card title="# Hashtags" value={data.hashtags} onCopy={onCopy} />
          )}

          {data.platformPack && (
            <>
              <SectionLabel label="Platform Packs" />
              <PlatformPackPanel pack={data.platformPack} onCopy={onCopy} />
            </>
          )}

          <SectionLabel label="Posting Strategy" />
          <PostingTimesPanel />
        </div>
      )}

      {activeWorkspace === "advanced" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900 shadow-sm">
            Advanced workspace research, polish, and packaging ko लागि हो.
            Daily execution tab हरू भन्दा अलग राखिएको छ so main workflow light
            रहोस्.
          </div>

          {data.fiveShotCinematic && data.fiveShotViral && (
            <>
              <SectionLabel label="5-Shot Pipeline" />
              <FiveShotPanel
                cinematic={data.fiveShotCinematic}
                viral={data.fiveShotViral}
                onCopy={onCopy}
              />
            </>
          )}

          {data.watchTimeReport && (
            <>
              <SectionLabel label="Watch Time & Earnings" />
              <WatchTimePanel report={data.watchTimeReport} />
            </>
          )}

          {data.twoPartViralOverview && (
            <>
              <SectionLabel label="Two-Part Viral Preset" />

              <Card
                title="🎯 Two-Part Viral Overview"
                value={data.twoPartViralOverview}
                onCopy={onCopy}
                accent="border-l-rose-500"
              />

              {data.twoPartWorkflowGuide && (
                <Card
                  title="🧭 Two-Part Workflow Guide"
                  value={data.twoPartWorkflowGuide}
                  onCopy={onCopy}
                  accent="border-l-pink-500"
                />
              )}

              <Card
                title="🔥 Part 1 — Hook + Collision Cliffhanger"
                value={[
                  data.twoPartPart1Hook ? `Hook:\n${data.twoPartPart1Hook}` : "",
                  data.twoPartPart1Caption
                    ? `Caption:\n${data.twoPartPart1Caption}`
                    : "",
                  data.twoPartPart1Draft
                    ? `Draft Prompt:\n${data.twoPartPart1Draft}`
                    : "",
                  data.twoPartPart1Final
                    ? `Final Prompt:\n${data.twoPartPart1Final}`
                    : "",
                ]
                  .filter(Boolean)
                  .join("\n\n")}
                onCopy={onCopy}
                accent="border-l-orange-500"
              />

              <Card
                title="👑 Part 2 — Payoff + Winner Walk"
                value={[
                  data.twoPartPart2Hook ? `Hook:\n${data.twoPartPart2Hook}` : "",
                  data.twoPartPart2Caption
                    ? `Caption:\n${data.twoPartPart2Caption}`
                    : "",
                  data.twoPartPart2Draft
                    ? `Draft Prompt:\n${data.twoPartPart2Draft}`
                    : "",
                  data.twoPartPart2Final
                    ? `Final Prompt:\n${data.twoPartPart2Final}`
                    : "",
                ]
                  .filter(Boolean)
                  .join("\n\n")}
                onCopy={onCopy}
                accent="border-l-amber-500"
              />
            </>
          )}

          {data.capCutScript && (
            <>
              <SectionLabel label="CapCut Script" />
              <CapCutScriptPanel script={data.capCutScript} onCopy={onCopy} />
            </>
          )}

          {data.animalBehavior && (
            <>
              <SectionLabel label="Animal Behavior" />
              <AnimalBehaviorPanel
                behavior={data.animalBehavior}
                predator={data.predatorName ?? "Subject"}
                onCopy={onCopy}
              />
            </>
          )}

          {data.soundDesignPack && (
            <>
              <SectionLabel label="Sound Design" />
              <SoundDesignPanel pack={data.soundDesignPack} onCopy={onCopy} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
