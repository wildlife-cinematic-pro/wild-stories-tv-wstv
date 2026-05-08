"use client";

import {
  STORY_MODE_PRESET_LABELS,
  USA_STORY_MODE_PRESETS,
  formatStoryModePresetLabel,
} from "@/lib/story-mode-presets";

import { StoryMode } from "@/types";

import type { StoryModePreset } from "@/lib/story-mode-presets";

type StoryModePresetsPanelProps = {
  activeStoryMode: StoryMode;
  onApplyPreset: (preset: StoryModePreset) => void;
};

export default function StoryModePresetsPanel({
  activeStoryMode,
  onApplyPreset,
}: StoryModePresetsPanelProps) {
  const visiblePresets =
    activeStoryMode === StoryMode.PREDATOR_VS_PREY
      ? USA_STORY_MODE_PRESETS
      : USA_STORY_MODE_PRESETS.filter(
          (preset) => preset.storyMode === activeStoryMode
        );

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-zinc-100 shadow-[0_18px_40px_rgba(0,0,0,0.2)]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-300/80">
            USA Story Mode Presets
          </p>
          <h3 className="mt-1 text-base font-semibold text-zinc-50">
            Viral wildlife starting points
          </h3>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-zinc-500">
            One-click setup for broader story modes. Predator vs Prey saved
            workflow presets stay unchanged.
          </p>
        </div>
        <span className="rounded-full border border-amber-400/25 bg-amber-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-amber-200">
          {visiblePresets.length} presets
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {visiblePresets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onApplyPreset(preset)}
            className="group rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:border-amber-300/50 hover:bg-amber-500/10 active:scale-[0.99]"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-black leading-snug text-zinc-50">
                  {preset.name}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                  {preset.summary}
                </p>
              </div>
              <span className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-cyan-200">
                Apply
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-amber-300/25 bg-amber-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-amber-200">
                {STORY_MODE_PRESET_LABELS[preset.storyMode]}
              </span>
              <span className="rounded-full border border-indigo-300/25 bg-indigo-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-indigo-200">
                {formatStoryModePresetLabel(preset.viralLane)}
              </span>
              <span className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-200">
                Level {Number(preset.violenceLevel)}/3
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
