"use client";

import { StoryMode } from "@/types";

const STORY_MODE_OPTIONS: Array<{
  value: StoryMode;
  icon: string;
  label: string;
  example: string;
}> = [
  {
    value: StoryMode.PREDATOR_VS_PREY,
    icon: "P/P",
    label: "Predator vs Prey",
    example: "Mountain lion vs deer",
  },
  {
    value: StoryMode.HERD_DEFENSE,
    icon: "HD",
    label: "Herd Defense",
    example: "Bison circle defense",
  },
  {
    value: StoryMode.MOTHER_BABY,
    icon: "MB",
    label: "Mother & Baby",
    example: "Bear mother and cubs",
  },
  {
    value: StoryMode.RIVAL_CLASH,
    icon: "RC",
    label: "Rival Clash",
    example: "Bull elk standoff",
  },
  {
    value: StoryMode.NEAR_MISS,
    icon: "NM",
    label: "Near Miss",
    example: "Escape at the edge",
  },
  {
    value: StoryMode.FISHING_STRIKE,
    icon: "FS",
    label: "Fishing Strike",
    example: "Bear salmon swipe",
  },
  {
    value: StoryMode.WEATHER_SURVIVAL,
    icon: "WS",
    label: "Weather Survival",
    example: "Bison in blizzard",
  },
  {
    value: StoryMode.MIGRATION,
    icon: "MG",
    label: "Migration",
    example: "Caribou crossing",
  },
  {
    value: StoryMode.SCAVENGER_CONFLICT,
    icon: "SC",
    label: "Scavenger Conflict",
    example: "Eagle vs coyote",
  },
];

export function getStoryModeLabel(value: StoryMode) {
  return (
    STORY_MODE_OPTIONS.find((option) => option.value === value)?.label ??
    "Predator vs Prey"
  );
}

export default function WildlifeStoryModeSelector({
  value,
  onChange,
}: {
  value: StoryMode;
  onChange: (value: StoryMode) => void;
}) {
  return (
    <section className="rounded-2xl border border-zinc-700/80 bg-zinc-950 p-4 text-zinc-100 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Wildlife Story Mode
          </p>
          <h3 className="mt-1 text-base font-semibold text-zinc-50">
            Choose the story structure
          </h3>
        </div>
        <span className="rounded-full border border-amber-400/35 bg-amber-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-amber-300">
          {getStoryModeLabel(value)}
        </span>
      </div>

      <div
        role="radiogroup"
        aria-label="Wildlife Story Mode"
        className="grid grid-cols-1 gap-2 sm:grid-cols-3"
      >
        {STORY_MODE_OPTIONS.map((option) => {
          const isSelected = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(option.value)}
              className={
                isSelected
                  ? "rounded-xl border border-amber-400 bg-amber-500/15 p-3 text-left shadow-[0_0_0_1px_rgba(245,158,11,0.14)] transition"
                  : "rounded-xl border border-white/10 bg-zinc-900/80 p-3 text-left transition hover:border-amber-400/40 hover:bg-amber-500/5"
              }
            >
              <div className="flex items-center gap-2">
                <span
                  className={
                    isSelected
                      ? "grid h-7 w-7 place-items-center rounded-lg bg-amber-400 text-[10px] font-black text-zinc-950"
                      : "grid h-7 w-7 place-items-center rounded-lg bg-zinc-800 text-[10px] font-black text-zinc-400"
                  }
                >
                  {option.icon}
                </span>
                <span
                  className={
                    isSelected
                      ? "text-xs font-extrabold text-amber-200"
                      : "text-xs font-extrabold text-zinc-200"
                  }
                >
                  {option.label}
                </span>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
                {option.example}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
