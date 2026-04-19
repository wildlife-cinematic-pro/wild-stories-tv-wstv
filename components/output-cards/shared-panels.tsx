"use client";

import { useState } from "react";

import type { GeneratedPackage, StructuredPrompt } from "@/types";

import { buildLegacyPromptCard } from "@/components/output-cards/prompt-utils";

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
          onClick={() => setOpen((value) => !value)}
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
                <span className="font-bold">Chaining:</span> Use last-frame
                chaining only when the outgoing shot ends on a clean full-body
                handoff frame. Otherwise reuse the same master still or a
                manually selected clean frame.
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
        {promptCard.fullText || shot || "—"}
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
  onCopy: (text: string) => void;
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

export function ShotImagePlanPanel({
  plans,
  onCopy,
}: {
  plans: NonNullable<GeneratedPackage["shotImagePlan"]>;
  onCopy: (text: string) => void;
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
        {plans.map((plan, index) => (
          <div
            key={`${plan.title}-${index}`}
            className="rounded-lg border border-amber-200 bg-white p-3"
          >
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-extrabold text-gray-900">
                  {plan.title}
                </span>
                <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-700">
                  Source:{" "}
                  {plan.source === "master"
                    ? "Master image"
                    : "Previous shot image"}
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

export function WorkspaceTabButton({
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
