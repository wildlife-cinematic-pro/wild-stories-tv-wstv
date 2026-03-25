"use client";

// ─────────────────────────────────────────────────────────────
// components/QualityPanel.tsx
// WSTV — Quality Control Panel
//
// Renders the quality toggles section of the generator:
//   • Realism Mode selector (3 options)
//   • 5 toggle buttons (Reference Lock, Motion-only I2V,
//     Single Action Rule, Micro-Motion, Hero Veo)
//
// Props are all passed in from the parent page — this component
// holds zero state of its own.
// ─────────────────────────────────────────────────────────────

import type { RealismMode } from "@/types";

// ─────────────────────────────────────────────────────────────
// TOGGLE — reusable pill button
// ─────────────────────────────────────────────────────────────
type ToggleTone = "gray" | "violet" | "emerald";

function Toggle({
  label,
  value,
  onChange,
  tone = "gray",
  tooltip,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  tone?: ToggleTone;
  tooltip?: string;
}) {
  const styles: Record<ToggleTone, string> = {
    violet:  value ? "border-violet-400 bg-violet-100 text-violet-800"   : "border-violet-200 bg-white text-violet-700",
    emerald: value ? "border-emerald-400 bg-emerald-100 text-emerald-800" : "border-emerald-200 bg-white text-emerald-700",
    gray:    value ? "border-gray-400 bg-gray-100 text-gray-900"          : "border-gray-200 bg-white text-gray-700",
  };

  return (
    <button
      type="button"
      title={tooltip}
      onClick={() => onChange(!value)}
      className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-all active:scale-95 ${styles[tone]}`}
    >
      {value ? "✓" : "○"} {label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// QUALITY CONTROL PANEL
// ─────────────────────────────────────────────────────────────
export type QualityPanelProps = {
  realismMode:        RealismMode;
  setRealismMode:     (m: RealismMode) => void;
  motionOnlyI2V:      boolean;
  setMotionOnlyI2V:   (v: boolean) => void;
  referenceLock:      boolean;
  setReferenceLock:   (v: boolean) => void;
  singleActionRule:   boolean;
  setSingleActionRule:(v: boolean) => void;
  microMotion:        boolean;
  setMicroMotion:     (v: boolean) => void;
  heroVeo:            boolean;
  setHeroVeo:         (v: boolean) => void;
};

export default function QualityPanel({
  realismMode,
  setRealismMode,
  motionOnlyI2V,
  setMotionOnlyI2V,
  referenceLock,
  setReferenceLock,
  singleActionRule,
  setSingleActionRule,
  microMotion,
  setMicroMotion,
  heroVeo,
  setHeroVeo,
}: QualityPanelProps) {
  const REALISM_MODES: RealismMode[] = ["Balanced", "High Naturalism", "Reference Locked"];

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">

      {/* Header */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-emerald-900">🧪 High-Quality / Natural Output</span>
        <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
          Image descriptive
        </span>
        <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
          Video motion-only
        </span>
      </div>

      {/* Realism Mode selector */}
      <div className="mb-3 flex flex-wrap gap-2">
        {REALISM_MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setRealismMode(mode)}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-all active:scale-95 ${
              realismMode === mode
                ? "border-emerald-400 bg-emerald-600 text-white"
                : "border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-100"
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Toggle buttons */}
      <div className="flex flex-wrap gap-2">
        <Toggle
          label="Reference Lock"
          value={referenceLock}
          onChange={setReferenceLock}
          tone="emerald"
          tooltip="Preserve exact subject identity from the uploaded hero frame across all clips"
        />
        <Toggle
          label="Motion-only I2V"
          value={motionOnlyI2V}
          onChange={setMotionOnlyI2V}
          tone="violet"
          tooltip="Video prompts describe motion only — not appearance. Reduces identity drift."
        />
        <Toggle
          label="Single Action Rule"
          value={singleActionRule}
          onChange={setSingleActionRule}
          tone="gray"
          tooltip="One subject action + one camera move per shot. Reduces melting and chaotic physics."
        />
        <Toggle
          label="Micro-Motion"
          value={microMotion}
          onChange={setMicroMotion}
          tone="emerald"
          tooltip="Keep the background alive with subtle environmental movement. Prevents static-scene syndrome."
        />
        <Toggle
          label="Hero Veo"
          value={heroVeo}
          onChange={setHeroVeo}
          tone="violet"
          tooltip="Route the most realism-sensitive beat to Veo 3.1 for maximum cinematic quality."
        />
      </div>

      {/* Recommendation note */}
      <p className="mt-3 text-xs leading-5 text-emerald-800">
        Recommended: <strong>Reference Locked</strong> + <strong>Motion-only I2V</strong> +{" "}
        <strong>Single Action Rule</strong>. This keeps the animal identity stable and the motion natural.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// USAGE IN page.tsx:
//
// import QualityPanel from "@/components/QualityPanel";
//
// <QualityPanel
//   realismMode={realismMode}
//   setRealismMode={setRealismMode}
//   motionOnlyI2V={motionOnlyI2V}
//   setMotionOnlyI2V={setMotionOnlyI2V}
//   referenceLock={referenceLock}
//   setReferenceLock={setReferenceLock}
//   singleActionRule={singleActionRule}
//   setSingleActionRule={setSingleActionRule}
//   microMotion={microMotion}
//   setMicroMotion={setMicroMotion}
//   heroVeo={heroVeo}
//   setHeroVeo={setHeroVeo}
// />
//
// DELETE from page.tsx:
//   • QualityControlPanel function (lines ~4155–4233)
//   • Internal Toggle function inside it
// ─────────────────────────────────────────────────────────────
