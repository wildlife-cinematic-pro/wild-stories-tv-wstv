"use client";

// ─────────────────────────────────────────────────────────────
// components/OutputCards.tsx
// WSTV — All Output Panel Components + 6-Step Workflow Prompt Map
//
// Contains every display panel rendered after Generate:
//   Card, SectionLabel, SkeletonCard
//   FiveShotPanel, Hook2026Panel, Caption2026Panel
//   PostingTimesPanel, WatchTimePanel, CalendarPanel
//   CapCutScriptPanel, AnimalBehaviorPanel, SoundDesignPanel
//   PlatformPackPanel, BulkGeneratePanel, VersionControlPanel
//   WorkflowPromptMap (6-Step pipeline tracker)
//
// All panels receive data + onCopy via props.
// Zero prompt building logic here — import from lib/ for that.
// ─────────────────────────────────────────────────────────────

import { useEffect, useMemo, useRef, useState } from "react";

import PromptVersionsPanel from "@/components/PromptVersionsPanel";
import { downloadText } from "@/lib/storage";

import type {
  FiveShotPlan,
  WatchTimeReport,
  CalendarMode,
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
  generateMonthlyCalendar,
  generateUSAViral30DayCalendar,
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
  const marker = "═══ KLING PROMPT (WSTV structured format) ═══";
  const start = s.indexOf(marker);

  if (start >= 0) {
    const afterMarker = s.slice(start + marker.length).trim();

    const endCandidates = [
      afterMarker.indexOf("\nAudio:"),
      afterMarker.indexOf("\n\nAudio:"),
      afterMarker.indexOf("\nKling settings:"),
      afterMarker.indexOf("\n\nKling settings:"),
    ].filter((n) => n >= 0);

    const end = endCandidates.length ? Math.min(...endCandidates) : -1;
    return (end >= 0 ? afterMarker.slice(0, end) : afterMarker).trim();
  }

  let cleaned = s
    .replace(/\n\s*[─—\-═]{5,}\s*\n\s*HOW TO USE\b[\s\S]*$/i, "")
    .trim();

  const bodyStart = cleaned.search(
    /(?:^|\n)\s*(?:Scene:|Shot\s*:|Shot\s*1\s*[—\-─:])/i
  );
  if (bodyStart >= 0) {
    cleaned = cleaned.slice(bodyStart).trim();
  }

  cleaned = cleaned.replace(/\n\s*[─—\-═]{5,}\s*$/g, "").trim();
  return cleaned;
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
                <span className="font-bold">Chaining:</span> Extract last frame
                → I2V input
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
            <p className="mb-2 text-xs font-extrabold text-blue-900">
              🔵 Kling 3.0 (Current WSTV workflow)
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
                <span className="font-bold">Prompting:</span> SCALE-style action
                prompting in WSTV
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
  engine: "runway" | "kling";
  index: number;
  shot: string;
  onCopy: (t: string) => void;
}) {
  const isRunway = engine === "runway";
  const pasteReady = isRunway
    ? extractRunwayPasteReady(shot)
    : extractKlingPromptBody(shot);

  const audioPrompt = !isRunway ? extractKlingAudioPrompt(shot) : "";
  const miMatch = shot.match(/Motion intensity:\s*([\d.]+)/);
  const motionIntensity = miMatch ? parseFloat(miMatch[1]) : null;
  const borderColor = isRunway ? "border-green-200" : "border-blue-200";
  const btnColor = isRunway
    ? "bg-green-700 hover:bg-green-800"
    : "bg-blue-700 hover:bg-blue-800";
  const engineLabel = isRunway ? "Runway" : "Kling";

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
          ? "SHOT 1 — Hook (0–5s)"
          : "SHOT 1 — Hook Close-up (0–4s)",
      color: "border-amber-400 bg-amber-50",
      badge: "RUNWAY",
      bc: "bg-amber-100 text-amber-700",
    },
    {
      key: "shot2",
      label:
        style === "cinematic"
          ? "SHOT 2 — Setup (5–12s)"
          : "SHOT 2 — Standoff (4–12s)",
      color: "border-green-400 bg-green-50",
      badge: "RUNWAY",
      bc: "bg-green-100 text-green-700",
    },
    {
      key: "shot3",
      label:
        style === "cinematic"
          ? "SHOT 3 — Tension (12–22s)"
          : "SHOT 3 — Clash (12–22s)",
      color: "border-blue-400 bg-blue-50",
      badge: "KLING",
      bc: "bg-blue-100 text-blue-700",
    },
    {
      key: "shot4",
      label:
        style === "cinematic"
          ? "SHOT 4 — Action (22–32s)"
          : "SHOT 4 — Aftermath (22–32s)",
      color: "border-blue-400 bg-blue-50",
      badge: "KLING",
      bc: "bg-blue-100 text-blue-700",
    },
    {
      key: "shot5",
      label:
        style === "cinematic"
          ? "SHOT 5 — Impact (32–40s)"
          : "SHOT 5 — Winner Walk (32–42s)",
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
// CALENDAR PANEL
// ─────────────────────────────────────────────────────────────
export function CalendarPanel({
  predator,
  prey,
  arc,
}: {
  predator: string;
  prey: string;
  arc: string;
}) {
  const [open, setOpen] = useState(false);
  const [week, setWeek] = useState(0);
  const [mode, setMode] = useState<CalendarMode>("monthly");
  const [monthCursor, setMonthCursor] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  const inputKey = `${predator}|${prey}|${arc}|${monthCursor.getTime()}|${mode}`;

  useEffect(() => {
    if (week !== 0) {
      const id = window.setTimeout(() => setWeek(0), 0);
      return () => window.clearTimeout(id);
    }
  }, [inputKey, week]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = new Date();
      const fresh = new Date(now.getFullYear(), now.getMonth(), 1);
      setMonthCursor((prev) =>
        prev.getFullYear() === fresh.getFullYear() &&
        prev.getMonth() === fresh.getMonth()
          ? prev
          : fresh
      );
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  const calendar =
    mode === "monthly"
      ? generateMonthlyCalendar(
          predator || "Tiger",
          prey || "Deer",
          arc || "Ambush attack",
          monthCursor
        )
      : generateUSAViral30DayCalendar(
          predator || "Mountain Lion",
          prey || "Deer",
          arc || "Ambush attack",
          monthCursor
        );

  const weeks = Array.from(
    { length: Math.ceil(calendar.length / 7) },
    (_, i) => calendar.slice(i * 7, i * 7 + 7)
  );

  const safeWeek = Math.min(week, Math.max(weeks.length - 1, 0));

  const weekLabels = weeks.map(
    (w, i) =>
      `Week ${i + 1} (${w[0]?.dateLabel ?? ""}–${w[w.length - 1]?.dateLabel ?? ""})`
  );

  const monthLabel = monthCursor.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-gray-900">
            {mode === "monthly"
              ? "📅 Monthly Content Calendar"
              : "🇺🇸 Fixed 30-Day USA Viral Calendar"}
          </span>
          <span className="rounded bg-teal-100 px-2 py-0.5 text-xs font-bold text-teal-700">
            {monthLabel}
          </span>
          <span className="rounded bg-teal-100 px-2 py-0.5 text-xs font-bold text-teal-700">
            2 Reels/Day
          </span>
          <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
            {calendar.length * 2} Total Reels
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-teal-300 bg-white">
            <button
              onClick={() => setMode("monthly")}
              className={`px-3 py-1.5 text-xs font-semibold ${
                mode === "monthly"
                  ? "bg-teal-600 text-white"
                  : "text-teal-700 hover:bg-teal-50"
              }`}
              type="button"
            >
              Monthly
            </button>
            <button
              onClick={() => setMode("usa30")}
              className={`px-3 py-1.5 text-xs font-semibold ${
                mode === "usa30"
                  ? "bg-rose-600 text-white"
                  : "text-rose-700 hover:bg-rose-50"
              }`}
              type="button"
            >
              USA Viral 30D
            </button>
          </div>

          <button
            onClick={() =>
              setMonthCursor((p) => new Date(p.getFullYear(), p.getMonth() - 1, 1))
            }
            className="rounded-lg border border-teal-300 bg-white px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-50 active:scale-95"
            type="button"
          >
            ← Prev
          </button>

          <button
            onClick={() => {
              const n = new Date();
              setMonthCursor(new Date(n.getFullYear(), n.getMonth(), 1));
            }}
            className="rounded-lg border border-teal-300 bg-white px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-50 active:scale-95"
            type="button"
          >
            Today
          </button>

          <button
            onClick={() =>
              setMonthCursor((p) => new Date(p.getFullYear(), p.getMonth() + 1, 1))
            }
            className="rounded-lg border border-teal-300 bg-white px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-50 active:scale-95"
            type="button"
          >
            Next →
          </button>

          <button
            onClick={() => setOpen((o) => !o)}
            className="rounded-lg border border-teal-300 bg-white px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-50 active:scale-95"
            type="button"
          >
            {open ? "Hide ▲" : "View ▼"}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-3">
          <div className="mb-3 flex flex-wrap gap-1">
            {weekLabels.map((label, i) => (
              <button
                key={i}
                onClick={() => setWeek(i)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  safeWeek === i
                    ? "bg-teal-600 text-white"
                    : "border border-teal-200 bg-white text-teal-700 hover:bg-teal-50"
                }`}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mb-2 text-xs font-bold text-teal-700">
            {weeks[safeWeek]?.[0]?.theme}
          </div>

          <div className="space-y-2">
            {weeks[safeWeek]?.map((day) => (
              <div
                key={`${mode}-${day.day}`}
                className="rounded-lg border border-teal-100 bg-white p-3"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded bg-teal-100 px-2 py-0.5 text-xs font-bold text-teal-700">
                    Day {day.day}
                  </span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                    {day.weekday}
                  </span>
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                    {day.dateLabel}
                  </span>
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                  <div className="rounded-lg bg-teal-50 p-2">
                    <p className="mb-1 text-xs font-bold text-teal-700">🎬 Reel 1</p>
                    <p className="text-xs text-gray-700">
                      {day.reel1.predator} vs {day.reel1.prey}
                    </p>
                    <p className="text-xs text-gray-500">
                      {day.reel1.arc} · {day.reel1.duration}
                    </p>
                    <p className="mt-1 text-xs font-medium italic text-gray-800">
                      &quot;{day.reel1.hook}&quot;
                    </p>
                  </div>

                  <div className="rounded-lg bg-indigo-50 p-2">
                    <p className="mb-1 text-xs font-bold text-indigo-700">🎬 Reel 2</p>
                    <p className="text-xs text-gray-700">
                      {day.reel2.predator} vs {day.reel2.prey}
                    </p>
                    <p className="text-xs text-gray-500">
                      {day.reel2.arc} · {day.reel2.duration}
                    </p>
                    <p className="mt-1 text-xs font-medium italic text-gray-800">
                      &quot;{day.reel2.hook}&quot;
                    </p>
                  </div>
                </div>

                <div className="mt-2 rounded bg-yellow-50 px-2 py-1 text-[11px] font-medium text-yellow-800">
                  {day.cmpNote}
                </div>
              </div>
            ))}
          </div>
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

function CopyBtn({
  label,
  onCopy,
}: {
  label: string;
  onCopy: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onCopy}
      className="mt-3 w-full rounded-lg bg-gray-900 py-2 text-xs font-bold text-white hover:bg-black active:scale-[0.99]"
    >
      📋 {label}
    </button>
  );
}

function SubShot({
  title,
  text,
  onCopy,
  recommended = false,
  selected = true,
  onToggleSelected,
}: {
  title: string;
  text: string;
  onCopy: () => void;
  recommended?: boolean;
  selected?: boolean;
  onToggleSelected?: () => void;
}) {
  if (!selected) return null;

  return (
    <div
      className={`rounded-xl border bg-white p-3 ${
        recommended ? "border-amber-300 ring-1 ring-amber-200" : "border-gray-200"
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <p className="text-[11px] font-extrabold text-gray-700">{title}</p>
          {recommended && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
              Recommended
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onToggleSelected && (
            <button
              type="button"
              onClick={onToggleSelected}
              className="rounded border border-gray-300 bg-white px-2 py-1 text-[11px] font-bold text-gray-600 hover:bg-gray-50 active:scale-95"
              title="Hide this shot"
            >
              Hide
            </button>
          )}
          <button
            type="button"
            onClick={onCopy}
            className="rounded bg-gray-900 px-2 py-1 text-[11px] font-bold text-white hover:bg-black active:scale-95"
          >
            Copy
          </button>
        </div>
      </div>

      <pre className="max-h-28 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-gray-800">
        {text || "—"}
      </pre>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// WorkflowPromptMap — Enhanced version with pipeline toggles,
// auto-scroll, per-shot visibility, and recommended badges
// ─────────────────────────────────────────────────────────────
function WorkflowPromptMap({
  data,
  onCopy,
}: {
  data: GeneratedPackage;
  onCopy: (t: string) => void;
}) {
  const runwayShots = (data.runwayShots ?? []).map(safeText);
  const klingShots = (data.klingShots ?? []).map(safeText);

  const imagePrompt = safeText(data.imagePrompt);
  const negativePrompt = safeText(data.negativePrompt ?? "");
  const characterLock = safeText(data.referenceWorkflow ?? "");
  const shot3Aftermath =
    runwayShots[2] ?? runwayShots[runwayShots.length - 1] ?? "";

  const drift = deriveDriftLabel(data.clipChaining);

  const [done, setDone] = useState<Record<number, boolean>>({
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false,
  });

  const [activeStep, setActiveStep] = useState<number>(1);
  const [onlyPipelineShots, setOnlyPipelineShots] = useState<boolean>(true);

  const [shotVisible, setShotVisible] = useState<{
    runway: boolean[];
    kling: boolean[];
  }>({
    runway: [true, true, true],
    kling: [true, true, true],
  });

  const stepRefs = useRef<Record<number, HTMLDivElement | null>>({
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
    6: null,
  });

  const copiedCount = useMemo(
    () => Object.values(done).filter(Boolean).length,
    [done]
  );

  const pipeline = useMemo(() => {
    const parts = [
      "Image Prompt → NB2/Flux → Upload to Runway",
      "→ Shot 1 (Runway1)",
      "→ last frame",
      "→ Shot 2 (Kling2)",
      "→ last frame",
      "→ Shot 3 (Runway3)",
      "→ CapCut",
    ];
    return parts.join(" ");
  }, []);

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
    setDone((p) => {
      const nextVal = !p[step];
      const next = { ...p, [step]: nextVal };

      if (nextVal) {
        const ns = nextStepOf(step);
        setActiveStep(ns);
        window.setTimeout(() => scrollToStep(ns), 50);
      } else {
        setActiveStep(step);
        window.setTimeout(() => scrollToStep(step), 50);
      }

      return next;
    });
  }

  function resetAll() {
    setDone({ 1: false, 2: false, 3: false, 4: false, 5: false, 6: false });
    setActiveStep(1);
    setOnlyPipelineShots(true);
    setShotVisible({ runway: [true, true, true], kling: [true, true, true] });
    window.setTimeout(() => scrollToStep(1), 50);
  }

  const recommended = useMemo(() => {
    return {
      runway: new Set([0, 2]),
      kling: new Set([1]),
    };
  }, []);

  const runwaySelected = useMemo(() => {
    if (!onlyPipelineShots) return [true, true, true];
    return [true, false, false];
  }, [onlyPipelineShots]);

  const klingSelected = useMemo(() => {
    if (!onlyPipelineShots) return [true, true, true];
    return [false, true, false];
  }, [onlyPipelineShots]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-extrabold text-gray-900">
            WSTV App → Runway Tracker
          </h2>
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

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-gray-800">Shots View</span>
          <span className="text-xs text-gray-500">
            {onlyPipelineShots
              ? "Only pipeline shots highlighted"
              : "All shots visible"}
          </span>
        </div>

        <div className="flex overflow-hidden rounded-lg border border-gray-300 bg-white">
          <button
            type="button"
            onClick={() => setOnlyPipelineShots(true)}
            className={`px-3 py-1.5 text-xs font-bold ${
              onlyPipelineShots
                ? "bg-gray-900 text-white"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            Only Pipeline
          </button>
          <button
            type="button"
            onClick={() => setOnlyPipelineShots(false)}
            className={`px-3 py-1.5 text-xs font-bold ${
              !onlyPipelineShots
                ? "bg-gray-900 text-white"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            Show All
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div
          ref={(el) => {
            stepRefs.current[1] = el;
          }}
        >
          <WorkflowCard
            step={1}
            title="Image Prompt"
            badge="NB2 / Flux / Midjourney"
            color={{
              border: "border-amber-400",
              bg: "bg-amber-50",
              badge: "bg-amber-100 text-amber-700",
            }}
            help="Paste into NB2/Flux/MJ → generate master hero still → download PNG → upload to Runway as reference image."
            done={done[1]}
            onToggle={() => toggle(1)}
          >
            <TextBox value={imagePrompt} />
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => onCopy(imagePrompt)}
                className="flex-1 rounded-lg bg-gray-900 py-2 text-xs font-bold text-white hover:bg-black active:scale-[0.99]"
              >
                📋 Copy Image Prompt
              </button>
              <button
                type="button"
                onClick={() => onCopy(extractImagePromptBody(imagePrompt))}
                className="flex-1 rounded-lg border border-amber-300 bg-white py-2 text-xs font-bold text-amber-800 hover:bg-amber-50 active:scale-[0.99]"
              >
                📋 Copy BODY
              </button>
            </div>
          </WorkflowCard>
        </div>

        <div
          ref={(el) => {
            stepRefs.current[2] = el;
          }}
        >
          <WorkflowCard
            step={2}
            title="Shot 1 — Establishing"
            badge="Runway Gen-4.5"
            color={{
              border: "border-green-400",
              bg: "bg-green-50",
              badge: "bg-green-100 text-green-700",
            }}
            help="Upload master image → paste into Runway Gen-4.5 I2V → generate. Extract last frame after generation."
            done={done[2]}
            onToggle={() => toggle(2)}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-gray-700">
                Runway shots
              </span>
              <span className="rounded bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                Recommended: Runway Shot 1
              </span>
            </div>

            <div className="space-y-2">
              <SubShot
                title="Runway Shot 1"
                text={runwayShots[0] ?? ""}
                onCopy={() =>
                  onCopy(extractRunwayPasteReady(runwayShots[0] ?? ""))
                }
                recommended={recommended.runway.has(0)}
                selected={runwaySelected[0] && shotVisible.runway[0]}
                onToggleSelected={
                  !onlyPipelineShots
                    ? () =>
                        setShotVisible((p) => ({
                          ...p,
                          runway: [false, p.runway[1], p.runway[2]],
                        }))
                    : undefined
                }
              />
              <SubShot
                title="Runway Shot 2"
                text={runwayShots[1] ?? ""}
                onCopy={() => onCopy(runwayShots[1] ?? "")}
                recommended={recommended.runway.has(1)}
                selected={runwaySelected[1] && shotVisible.runway[1]}
                onToggleSelected={
                  !onlyPipelineShots
                    ? () =>
                        setShotVisible((p) => ({
                          ...p,
                          runway: [p.runway[0], false, p.runway[2]],
                        }))
                    : undefined
                }
              />
              <SubShot
                title="Runway Shot 3"
                text={runwayShots[2] ?? ""}
                onCopy={() => onCopy(runwayShots[2] ?? "")}
                recommended={recommended.runway.has(2)}
                selected={runwaySelected[2] && shotVisible.runway[2]}
                onToggleSelected={
                  !onlyPipelineShots
                    ? () =>
                        setShotVisible((p) => ({
                          ...p,
                          runway: [p.runway[0], p.runway[1], false],
                        }))
                    : undefined
                }
              />
            </div>

            <CopyBtn
              label="Copy Visible Runway Shots"
              onCopy={() =>
                onCopy(
                  [runwayShots[0], runwayShots[1], runwayShots[2]]
                    .filter(Boolean)
                    .filter((_, i) =>
                      onlyPipelineShots ? runwaySelected[i] : shotVisible.runway[i]
                    )
                    .join("\n\n---\n\n")
                )
              }
            />
          </WorkflowCard>
        </div>

       
       <div
  ref={(el) => {
    stepRefs.current[3] = el;
  }}
>
  <WorkflowCard
    step={3}
    title="Shot 2 — Action / Strike"
    badge="Kling 3.0 Pro"
    color={{
      border: "border-blue-400",
      bg: "bg-blue-50",
      badge: "bg-blue-100 text-blue-700",
    }}
    help="Upload Shot last frame → paste into Kling I2V → generate. Extract last frame after."
    done={done[3]}
    onToggle={() => toggle(3)}
  >
    <div className="mb-2 flex items-center justify-between gap-2">
      <span className="text-xs font-bold text-gray-700">Kling shots</span>
      <span className="rounded bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
        Recommended: Kling Shot 2
      </span>
    </div>

    <div className="space-y-2">
      <SubShot
        title="Kling Shot 1"
        text={klingShots[0] ?? ""}
        onCopy={() =>
          onCopy(
            [
              extractKlingPromptBody(klingShots[0] ?? ""),
              extractKlingAudioPrompt(klingShots[0] ?? "")
                ? `\n\nAudio:\n${extractKlingAudioPrompt(klingShots[0] ?? "")}`
                : "",
            ].join("")
          )
        }
        recommended={recommended.kling.has(0)}
        selected={klingSelected[0] && shotVisible.kling[0]}
        onToggleSelected={
          !onlyPipelineShots
            ? () =>
                setShotVisible((p) => ({
                  ...p,
                  kling: [false, p.kling[1], p.kling[2]],
                }))
            : undefined
        }
      />

      <SubShot
        title="Kling Shot 2"
        text={klingShots[1] ?? ""}
        onCopy={() =>
          onCopy(
            [
              extractKlingPromptBody(klingShots[1] ?? ""),
              extractKlingAudioPrompt(klingShots[1] ?? "")
                ? `\n\nAudio:\n${extractKlingAudioPrompt(klingShots[1] ?? "")}`
                : "",
            ].join("")
          )
        }
        recommended={recommended.kling.has(1)}
        selected={klingSelected[1] && shotVisible.kling[1]}
        onToggleSelected={
          !onlyPipelineShots
            ? () =>
                setShotVisible((p) => ({
                  ...p,
                  kling: [p.kling[0], false, p.kling[2]],
                }))
            : undefined
        }
      />

      <SubShot
        title="Kling Shot 3"
        text={klingShots[2] ?? ""}
        onCopy={() =>
          onCopy(
            [
              extractKlingPromptBody(klingShots[2] ?? ""),
              extractKlingAudioPrompt(klingShots[2] ?? "")
                ? `\n\nAudio:\n${extractKlingAudioPrompt(klingShots[2] ?? "")}`
                : "",
            ].join("")
          )
        }
        recommended={recommended.kling.has(2)}
        selected={klingSelected[2] && shotVisible.kling[2]}
        onToggleSelected={
          !onlyPipelineShots
            ? () =>
                setShotVisible((p) => ({
                  ...p,
                  kling: [p.kling[0], p.kling[1], false],
                }))
            : undefined
        }
      />
    </div>

    <CopyBtn
      label="Copy Visible Kling Shots"
      onCopy={() =>
        onCopy(
          [klingShots[0], klingShots[1], klingShots[2]]
            .filter(Boolean)
            .filter((_, i) =>
              onlyPipelineShots ? klingSelected[i] : shotVisible.kling[i]
            )
            .map((shot) =>
              [
                extractKlingPromptBody(shot),
                extractKlingAudioPrompt(shot)
                  ? `\n\nAudio:\n${extractKlingAudioPrompt(shot)}`
                  : "",
              ].join("")
            )
            .join("\n\n---\n\n")
        )
      }
    />
  </WorkflowCard>
</div>

        <div
          ref={(el) => {
            stepRefs.current[4] = el;
          }}
        >
          <WorkflowCard
            step={4}
            title="Shot 3 — Aftermath"
            badge="Runway Gen-4.5"
            color={{
              border: "border-purple-400",
              bg: "bg-purple-50",
              badge: "bg-purple-100 text-purple-700",
            }}
            help="Upload Kling last frame → paste into Runway Gen-4.5 I2V → breathing settles, posture resolves."
            done={done[4]}
            onToggle={() => toggle(4)}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-gray-700">
                Runway3 (Recommended)
              </span>
              <span className="rounded bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                Recommended: Runway Shot 3
              </span>
            </div>
            <TextBox value={shot3Aftermath} />
            <CopyBtn
              label="Copy Shot 3 Motion"
              onCopy={() => onCopy(extractRunwayPasteReady(shot3Aftermath))}
            />
          </WorkflowCard>
        </div>

        <div
          ref={(el) => {
            stepRefs.current[5] = el;
          }}
        >
          <WorkflowCard
            step={5}
            title="Character Lock"
            badge="Runway Combine Text (T5)"
            color={{
              border: "border-teal-400",
              bg: "bg-teal-50",
              badge: "bg-teal-100 text-teal-700",
            }}
            help="Paste into Runway Workflow Text Node (T5) → lock identities between clips. Keep permanently."
            done={done[5]}
            onToggle={() => toggle(5)}
          >
            <TextBox value={characterLock} />
            <CopyBtn
              label="Copy Character Lock"
              onCopy={() => onCopy(characterLock)}
            />
          </WorkflowCard>
        </div>

        <div
          ref={(el) => {
            stepRefs.current[6] = el;
          }}
        >
          <WorkflowCard
            step={6}
            title={`Negative Prompt — ${
              (data as Record<string, unknown>).predator ?? "Predator"
            }`}
            badge="Kling / image models only"
            color={{
              border: "border-red-400",
              bg: "bg-red-50",
              badge: "bg-red-100 text-red-700",
            }}
            help="Use in Kling or supported image-model negative prompt fields. Do NOT use in Runway Gen-4.5."
            done={done[6]}
            onToggle={() => toggle(6)}
          >
            <TextBox value={negativePrompt} />
            <CopyBtn
              label="Copy Negative Prompt"
              onCopy={() => onCopy(negativePrompt)}
            />
          </WorkflowCard>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5, 6].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setActiveStep(s);
              scrollToStep(s);
            }}
            className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${
              activeStep === s
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Go Step {s}
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

export default function OutputCards({
  data,
  onRestoreVersion,
}: {
  data: GeneratedPackage;
  onRestoreVersion?: (v: PromptVersion) => void;
}) {
  const onCopy = copyToClipboard;

  const runwayShots = useMemo(
  () => (data.runwayShots ?? []).map((s) => String(s ?? "")),
  [data.runwayShots]
);

const klingShots = useMemo(
  () => (data.klingShots ?? []).map((s) => String(s ?? "")),
  [data.klingShots]
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

  function buildCalendarText() {
    try {
      const predator = data.predatorName ?? "Tiger";
      const prey = data.preyName ?? "Deer";
      const arc = String(data.arcName ?? "Ambush attack");
      const today = new Date();

      if (typeof generateMonthlyCalendar === "function") {
        const cal = generateMonthlyCalendar(predator, prey, arc, today);
        return cal
          .map((d: Record<string, unknown>) => {
            const reel1 = (d.reel1 ?? {}) as Record<string, unknown>;
            const reel2 = (d.reel2 ?? {}) as Record<string, unknown>;

            const lines = [
              `${safeStr(d.dateLabel) || safeStr(d.dateISO)}`,
              safeStr(reel1.hook) ? `Reel 1 Hook: ${safeStr(reel1.hook)}` : "",
              safeStr(reel1.caption)
                ? `Reel 1 Caption: ${safeStr(reel1.caption)}`
                : "",
              safeStr(reel1.hashtags)
                ? `Reel 1 Hashtags: ${safeStr(reel1.hashtags)}`
                : "",
              safeStr(reel2.hook) ? `Reel 2 Hook: ${safeStr(reel2.hook)}` : "",
              safeStr(reel2.caption)
                ? `Reel 2 Caption: ${safeStr(reel2.caption)}`
                : "",
              safeStr(reel2.hashtags)
                ? `Reel 2 Hashtags: ${safeStr(reel2.hashtags)}`
                : "",
            ].filter(Boolean);

            return lines.join(" | ");
          })
          .join("\n");
      }
    } catch {}
    return "";
  }

  function buildCopyAllPacksText() {
    const runway = runwayShots
      .map((s, i) => `Runway Shot ${i + 1}\n${safeStr(s)}`)
      .join("\n\n---\n\n");

    const kling = klingShots
      .map((s, i) => `Kling Shot ${i + 1}\n${safeStr(s)}`)
      .join("\n\n---\n\n");

    const calendar = buildCalendarText();

    return [
      `WSTV EXPORT PACK (Pro 2026)`,
      `Predator: ${safeStr(data.predatorName)}`,
      `Prey: ${safeStr(data.preyName)}`,
      `Arc: ${safeStr(data.arcName)}`,
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
      `=== CONTENT CALENDAR (THIS MONTH) ===`,
      calendar || "(calendar generator not available)",
    ].join("\n");
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

  return (
    <div className="space-y-6">
      <EngineSpecsPanel />

      <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
        Meta Reels export: 9:16 vertical, audio on, and keep important text
        inside the safe zone.
      </div>

      <SectionLabel label="WSTV Workflow Prompt Map" />
      <WorkflowPromptMap data={data} onCopy={onCopy} />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copyAllPacks}
          className="rounded-xl bg-gray-900 px-4 py-2 text-xs font-extrabold text-white hover:bg-black active:scale-95"
        >
          📋 Copy All (Runway/Kling/Calendar)
        </button>

        <button
          type="button"
          onClick={exportTxt}
          className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-extrabold text-gray-800 hover:bg-gray-50 active:scale-95"
        >
          ⬇ Export TXT
        </button>
      </div>

      {versionKey && (
        <>
          <SectionLabel label="🕘 Prompt Versions" />
          <PromptVersionsPanel
            versionKey={versionKey}
            onRestoreVersion={onRestoreVersion}
          />
        </>
      )}

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
                "rounded border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600 cursor-default",
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

      <SectionLabel label="🎬 Video Shots (Pro Layout)" />

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-extrabold text-gray-900">
            Raw Shot Lists
          </div>

          <div className="flex flex-wrap gap-2">
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
              
              className="rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-extrabold text-green-800 hover:bg-green-100 active:scale-95"
            >
              Copy Runway (Paste-Ready)
            </button>

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
  className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-extrabold text-blue-800 hover:bg-blue-100 active:scale-95"
>
  Copy Kling (SCALE Body)
</button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="text-sm font-extrabold text-green-900">
                Runway Shots
              </div>
              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-green-700 ring-1 ring-green-200">
                Gen-4.5 | 24/25fps | 720p
              </span>
            </div>

            <p className="mb-3 text-xs text-green-800">
              Shot 1 → establishing, Shot 2 → continuity, Shot 3 → aftermath
              (last frame exports).
            </p>

            <p className="mb-3 text-xs text-green-800">
              I2V = motion only. No negative prompts. Last frame chaining.
            </p>

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

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="text-sm font-extrabold text-blue-900">
                Kling Shots
              </div>
              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-blue-700 ring-1 ring-blue-200">
                Kling 3.0 | Action workflow | Audio-capable
              </span>
            </div>

            <p className="mb-3 text-xs text-blue-800">
              Best for full-body physics/action beats. Use Runway last frame as
              reference.
            </p>

            <p className="mb-3 text-xs text-blue-800">
              SCALE format. Negative prompts OK. Bind Subject + Start/End Frame.
            </p>

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
        </div>
      </div>

      {data.klingNative15s !== undefined && data.klingNative15s !== null && (
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
            यो एउटै prompt Kling 3.0 Pro/Standard मा paste गर्दा 15 seconds को
            continuous video आउँछ। 3 अलग shots generate हुन्छन्, subject
            identity automatically locked हुन्छ।
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

      {data.klingSixShot !== undefined && data.klingSixShot !== null && (
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
            Macro close-up → Wide establishing → Profile tracking →
            Shot-reverse-shot → Action wide → Winner aftermath. एकै prompt ले 6
            cinematic shots generate गर्छ — subject identity सबै shots मा locked
            हुन्छ।
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

      <SectionLabel label="📅 Content Calendar" />
      <CalendarPanel
        predator={data.predatorName ?? "Tiger"}
        prey={data.preyName ?? "Deer"}
        arc={data.arcName ?? "Ambush attack"}
      />

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

      {data.platformPack && (
        <>
          <SectionLabel label="Platform Packs" />
          <PlatformPackPanel pack={data.platformPack} onCopy={onCopy} />
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
        data.twoPartPart1Caption ? `Caption:\n${data.twoPartPart1Caption}` : "",
        data.twoPartPart1Draft ? `Draft Prompt:\n${data.twoPartPart1Draft}` : "",
        data.twoPartPart1Final ? `Final Prompt:\n${data.twoPartPart1Final}` : "",
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
        data.twoPartPart2Caption ? `Caption:\n${data.twoPartPart2Caption}` : "",
        data.twoPartPart2Draft ? `Draft Prompt:\n${data.twoPartPart2Draft}` : "",
        data.twoPartPart2Final ? `Final Prompt:\n${data.twoPartPart2Final}` : "",
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

      <SectionLabel label="Posting Strategy" />
      <PostingTimesPanel />
    </div>
  );
}
