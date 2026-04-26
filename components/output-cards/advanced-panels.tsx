"use client";

import { useState } from "react";

import type {
  AnimalBehavior,
  CapCutScript,
  FiveShotPlan,
  SoundDesignPack,
  WatchTimeReport,
} from "@/types";

import { getCMPEarningsTable } from "@/lib/predator-data";
import { extractMotionOnlyPrompt } from "@/lib/workflow-packs";

export function FiveShotPanel({
  cinematic,
  viral,
  onCopy,
}: {
  cinematic: FiveShotPlan;
  viral: FiveShotPlan;
  onCopy: (text: string) => void;
}) {
  const [style, setStyle] = useState<"cinematic" | "viral">("viral");
  const plan = style === "cinematic" ? cinematic : viral;

  const shots = [
    {
      key: "shot1",
      label: "SHOT 1 — Opening Tension (0–4s)",
      color: "border-amber-400 bg-amber-50",
      badge: "RUNWAY",
      bc: "bg-amber-100 text-amber-700",
    },
    {
      key: "shot2",
      label: "SHOT 2 — Pressure Build (4–12s)",
      color: "border-green-400 bg-green-50",
      badge: "RUNWAY",
      bc: "bg-green-100 text-green-700",
    },
    {
      key: "shot3",
      label: "SHOT 3 — Action Pressure (12–22s)",
      color: "border-blue-400 bg-blue-50",
      badge: "KLING",
      bc: "bg-blue-100 text-blue-700",
    },
    {
      key: "shot4",
      label: "SHOT 4 — Reaction Pressure (22–32s)",
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
  ] as const;

  return (
    <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50 p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-indigo-900">
          🎬 Optional 5-Shot Story Pack
        </span>
        <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">
          {plan.totalDuration}
        </span>
        <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
          Facebook Monetization ✓
        </span>
      </div>

      <div className="mb-4 flex overflow-hidden rounded-lg border border-indigo-200 bg-[color:var(--surface-elevated)]">
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
        {shots.map((shot) => (
          <div key={shot.key} className={`rounded-lg border-l-4 p-3 ${shot.color}`}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[color:var(--text)]">
                  {shot.label}
                </span>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-bold ${shot.bc}`}
                >
                  {shot.badge}
                </span>
              </div>
              <button
                onClick={() =>
                  onCopy(
                    extractMotionOnlyPrompt(
                      plan[shot.key as keyof FiveShotPlan] as string
                    )
                  )
                }
                className="rounded bg-gray-900 px-2 py-1 text-xs text-white hover:bg-black active:scale-95"
                type="button"
              >
                Copy
              </button>
            </div>
            <p className="whitespace-pre-wrap text-xs leading-5 text-[color:var(--muted)]">
              {plan[shot.key as keyof FiveShotPlan] as string}
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

export function WatchTimePanel({ report }: { report: WatchTimeReport }) {
  const [showEarnings, setShowEarnings] = useState(false);
  const earningsTable = getCMPEarningsTable();

  return (
    <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-[color:var(--text)]">
          ⏱️ Watch Time + Earnings Optimizer
        </span>
        <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700">
          CMP 600K Min Goal
        </span>
        <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
          Planning Panel ✓
        </span>
      </div>

      <div className="mb-3 grid gap-2 md:grid-cols-4">
        <div className="rounded-lg border border-red-200 bg-[color:var(--surface-elevated)] p-3 text-center">
          <p className="text-xs text-[color:var(--muted)]">Short Hybrid Lane</p>
          <p className="text-xl font-bold text-red-500">20s</p>
          <p className="text-xs text-[color:var(--muted)]">Runway 5 / Kling 5 / Kling 5 / Runway 5</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-[color:var(--surface-elevated)] p-3 text-center">
          <p className="text-xs text-[color:var(--muted)]">Medium Hybrid Lane</p>
          <p className="text-xl font-bold text-amber-600">35s</p>
          <p className="text-xs text-[color:var(--muted)]">Runway 10 / Kling 10 / Kling 10 / Runway 5</p>
        </div>
        <div className="rounded-lg border border-green-300 bg-[color:var(--surface-elevated)] p-3 text-center">
          <p className="text-xs text-[color:var(--muted)]">Long Hybrid Lane</p>
          <p className="text-xl font-bold text-green-600">40s</p>
          <p className="text-xs font-semibold text-green-600">
            ✓ Runway 10 / Kling 10 / Kling 10 / Runway 10
          </p>
          <p className="mt-1 text-[11px] text-[color:var(--muted)]">
            Optional edit pacing can stretch to 45–50s.
          </p>
        </div>
        <div className="rounded-lg border border-indigo-200 bg-[color:var(--surface-elevated)] p-3 text-center">
          <p className="text-xs text-[color:var(--muted)]">Watch Time/View</p>
          <p className="text-xl font-bold text-indigo-600">
            {report.watchTimePerView}
          </p>
          <p className="text-xs text-[color:var(--muted)]">5x improvement</p>
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
        {report.tipsToIncrease.map((tip, index) => (
          <div key={index} className="flex items-start gap-2 text-xs text-[color:var(--muted)]">
            <span className="mt-0.5 shrink-0">•</span>
            <span>{tip}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => setShowEarnings((value) => !value)}
        className="w-full rounded-lg border border-purple-300 bg-[color:var(--surface-elevated)] py-2 text-xs font-bold text-purple-700 hover:bg-purple-50 active:scale-95"
        type="button"
      >
        {showEarnings
          ? "Hide Earnings Table ▲"
          : "📊 Show CMP Earnings Calculator ▼"}
      </button>

      {showEarnings && (
        <div className="mt-3">
          <p className="mb-2 text-xs font-bold text-[color:var(--muted)]">
            Planning ranges only — not guaranteed payouts
          </p>
          <div className="overflow-x-auto rounded-lg border border-[color:var(--border)]">
            <table className="w-full text-xs">
              <thead className="bg-[color:var(--surface-muted)]">
                <tr>
                  <th className="p-2 text-left font-semibold text-[color:var(--muted)]">
                    Views
                  </th>
                  <th className="p-2 text-left font-semibold text-[color:var(--muted)]">
                    General
                  </th>
                  <th className="p-2 text-left font-semibold text-green-600">
                    USA Heavy 🇺🇸
                  </th>
                </tr>
              </thead>
              <tbody>
                {earningsTable.map((row, index) => (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? "bg-[color:var(--surface-elevated)]" : "bg-[color:var(--surface-muted)]"}
                  >
                    <td className="p-2 font-semibold text-[color:var(--text)]">
                      {(row.views / 1000).toFixed(0)}K
                    </td>
                    <td className="p-2 text-[color:var(--muted)]">
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
          <p className="mt-2 text-xs text-[color:var(--muted)]">
            Use your Professional Dashboard as the source of truth once you gain
            access.
          </p>
        </div>
      )}
    </div>
  );
}

export function CapCutScriptPanel({
  script,
  onCopy,
}: {
  script: CapCutScript;
  onCopy: (text: string) => void;
}) {
  const fullScript = `CAPCUT AUTO-SCRIPT
Duration: ${script.totalDuration} | ${script.aspectRatio} | ${script.fps}fps project
Music: ${script.musicMood}

${script.beats
  .map(
    (beat) => `[${beat.timeIn} → ${beat.timeOut}] ${beat.shotRef}
  On-screen text: "${beat.onScreenText}"
  Transition: ${beat.transition}
  SFX: ${beat.sfx}
  Music: ${beat.musicNote}`
  )
  .join("\n\n")}

EXPORT: ${script.exportSettings}`;

  return (
    <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[color:var(--text)]">
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

      <div className="mb-3 rounded-lg border border-purple-200 bg-[color:var(--surface-elevated)] p-2 text-xs text-purple-800">
        🎵 <strong>Music mood:</strong> {script.musicMood}
      </div>

      <div className="space-y-2">
        {script.beats.map((beat, index) => (
          <div
            key={index}
            className="rounded-lg border border-purple-100 bg-[color:var(--surface-elevated)] p-3"
          >
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded bg-purple-600 px-2 py-0.5 text-xs font-bold text-white">
                {beat.timeIn} → {beat.timeOut}
              </span>
              <span className="text-xs font-bold text-[color:var(--muted)]">
                {beat.shotRef}
              </span>
            </div>
            <div className="grid gap-1 text-xs">
              <div>
                <span className="font-semibold text-[color:var(--muted)]">📝 Text: </span>
                <span className="text-[color:var(--muted)]">
                  &quot;{beat.onScreenText}&quot;
                </span>
              </div>
              <div>
                <span className="font-semibold text-[color:var(--muted)]">✂️ Cut: </span>
                <span className="text-[color:var(--muted)]">{beat.transition}</span>
              </div>
              <div>
                <span className="font-semibold text-[color:var(--muted)]">🔊 SFX: </span>
                <span className="text-[color:var(--muted)]">{beat.sfx}</span>
              </div>
              <div>
                <span className="font-semibold text-[color:var(--muted)]">🎵 Music: </span>
                <span className="italic text-[color:var(--muted)]">{beat.musicNote}</span>
              </div>
            </div>
            <button
              onClick={() =>
                onCopy(
                  `[${beat.timeIn}→${beat.timeOut}] ${beat.onScreenText}\nSFX: ${beat.sfx}\nTransition: ${beat.transition}`
                )
              }
              className="mt-2 rounded border border-[color:var(--border)] bg-[color:var(--surface-elevated)] px-2 py-1 text-xs text-[color:var(--muted)] hover:bg-[color:var(--surface-muted)] active:scale-95"
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

export function AnimalBehaviorPanel({
  behavior,
  predator,
  onCopy,
}: {
  behavior: AnimalBehavior;
  predator: string;
  onCopy: (text: string) => void;
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
        <span className="text-sm font-bold text-[color:var(--text)]">
          🦁 {predator} Behavior Library
        </span>
        <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
          Real biology → prompt injection
        </span>
      </div>

      <div className="mb-3 flex gap-1 overflow-x-auto pb-1">
        {tabs.map((entry) => (
          <button
            key={entry.key}
            onClick={() => setTab(entry.key)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              tab === entry.key
                ? "bg-amber-600 text-white"
                : "border border-amber-200 bg-[color:var(--surface-elevated)] text-amber-700 hover:bg-amber-50"
            }`}
            type="button"
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {content[tab].map((item, index) => (
          <div
            key={index}
            className="flex items-start gap-2 rounded-lg border border-amber-100 bg-[color:var(--surface-elevated)] p-2.5"
          >
            <span className="mt-0.5 shrink-0 text-amber-500">•</span>
            <p className="text-xs leading-5 text-[color:var(--muted)]">{item}</p>
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

export function SoundDesignPanel({
  pack,
  onCopy,
}: {
  pack: SoundDesignPack;
  onCopy: (text: string) => void;
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
        <span className="text-sm font-bold text-[color:var(--text)]">
          🔊 Sound Design Pack
        </span>
        <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">
          Kling + CapCut SFX
        </span>
      </div>

      <div className="mb-3 space-y-2">
        {rows.map((item, index) => (
          <div key={index} className={`rounded-lg border p-2.5 ${item.color}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="mb-0.5 text-[11px] font-bold text-[color:var(--muted)]">
                  {item.label}
                </p>
                <p className="text-xs text-[color:var(--muted)]">{item.value}</p>
              </div>
              <button
                onClick={() => onCopy(item.value)}
                className="shrink-0 rounded border border-[color:var(--border)] bg-[color:var(--surface-elevated)] px-2 py-1 text-xs text-[color:var(--muted)] hover:bg-[color:var(--surface-muted)] active:scale-95"
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
        {pack.capCutSFX.map((cue, index) => (
          <div
            key={index}
            className="flex items-start justify-between gap-2 rounded border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-2"
          >
            <p className="text-xs text-[color:var(--muted)]">{cue}</p>
            <button
              onClick={() => onCopy(cue)}
              className="shrink-0 rounded border border-[color:var(--border)] bg-[color:var(--surface-elevated)] px-2 py-1 text-xs text-[color:var(--muted)] hover:bg-[color:var(--surface-muted)] active:scale-95"
              type="button"
            >
              Copy
            </button>
          </div>
        ))}
        <button
          onClick={() => onCopy(pack.capCutSFX.join("\n"))}
          className="mt-2 w-full rounded border border-[color:var(--border)] bg-[color:var(--surface-elevated)] py-1.5 text-xs font-semibold text-[color:var(--muted)] hover:bg-[color:var(--surface-muted)] active:scale-95"
          type="button"
        >
          Copy All SFX Cues
        </button>
      </div>
    </div>
  );
}
