"use client";

import { useMemo, useState } from "react";

import {
  rankStoryModeSetups,
  type RankedStoryModeSetup,
} from "@/lib/story-mode-setup-ranking";
import {
  STORY_MODE_PRESET_LABELS,
  formatStoryModePresetLabel,
} from "@/lib/story-mode-presets";

import { HabitatRegion, StoryMode, type Season, type TimeOfDay } from "@/types";

type BestUsaViralSetupsPanelProps = {
  storyMode: StoryMode;
  habitatRegion: HabitatRegion;
  season: Season;
  timeOfDay: TimeOfDay;
  animalOptions: string[];
  onApplySetup: (setup: RankedStoryModeSetup) => void;
};

function formatSetupMeta(value: string) {
  return formatStoryModePresetLabel(value);
}

export default function BestUsaViralSetupsPanel({
  storyMode,
  habitatRegion,
  season,
  timeOfDay,
  animalOptions,
  onApplySetup,
}: BestUsaViralSetupsPanelProps) {
  const [showMore, setShowMore] = useState(false);
  const rankedSetups = useMemo(
    () =>
      rankStoryModeSetups({
        storyMode,
        habitatRegion,
        season,
        timeOfDay,
        animalOptions,
      }),
    [animalOptions, habitatRegion, season, storyMode, timeOfDay]
  );
  const visibleSetups = rankedSetups.slice(0, showMore ? 6 : 3);

  return (
    <section
      className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] p-5 text-[color:var(--text)] shadow-[0_18px_40px_rgba(2,6,23,0.16)]"
      data-testid="best-usa-viral-setups-panel"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--accent-rgb))]">
            Best USA Viral Setups
          </p>
          <h3 className="mt-1 text-base font-semibold text-[color:var(--text)]">
            Ranked setup suggestions
          </h3>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[color:var(--muted)]">
            Ranked from pair quality, habitat fit, and USA wildlife pull before
            generation.
          </p>
        </div>
        <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--muted)]">
          Top {visibleSetups.length}
        </span>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {visibleSetups.map((setup) => (
          <article
            key={setup.id}
            className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-4"
            data-testid="best-usa-viral-setup-card"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-black leading-snug text-[color:var(--text)]">
                  {setup.label}
                </p>
                <p className="mt-1 text-xs font-semibold text-[color:var(--text-secondary)]">
                  {setup.subjectA} vs {setup.subjectB}
                </p>
              </div>
              <span className="rounded-full bg-[rgb(var(--accent-rgb)/0.16)] px-2.5 py-1 text-[10px] font-black text-[rgb(var(--accent-rgb))] ring-1 ring-[rgb(var(--accent-rgb)/0.3)]">
                {setup.score}
              </span>
            </div>

            <p className="mt-2 text-[11px] font-semibold leading-relaxed text-[color:var(--muted)]">
              {formatSetupMeta(setup.habitatRegion)} · {formatSetupMeta(setup.season)} ·{" "}
              {formatSetupMeta(setup.timeOfDay)}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-2 py-0.5 text-[10px] font-bold text-[color:var(--text)]">
                Pair {setup.pairScore}
              </span>
              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-2 py-0.5 text-[10px] font-bold text-[color:var(--text)]">
                Habitat {setup.habitatScore}
              </span>
              <span className="rounded-full border border-emerald-400/30 bg-[color:var(--success-bg)] px-2 py-0.5 text-[10px] font-bold text-[color:var(--success-text)]">
                USA viral +{setup.viralBonus}
              </span>
            </div>

            <p className="mt-3 text-[11px] leading-relaxed text-[color:var(--muted)]">
              {setup.reasons[0]}
            </p>

            <button
              type="button"
              onClick={() => onApplySetup(setup)}
              className="mt-4 w-full rounded-xl border border-[rgb(var(--accent-rgb)/0.35)] bg-[rgb(var(--accent-rgb)/0.14)] px-3 py-2 text-xs font-black uppercase tracking-[0.08em] text-[rgb(var(--accent-rgb))] transition hover:bg-[rgb(var(--accent-rgb)/0.2)]"
            >
              Apply setup
            </button>

            <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--muted)]">
              {STORY_MODE_PRESET_LABELS[setup.storyMode]}
            </p>
          </article>
        ))}
      </div>

      {rankedSetups.length > 3 ? (
        <button
          type="button"
          onClick={() => setShowMore((current) => !current)}
          className="mt-3 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--text)] transition hover:bg-[color:var(--surface-elevated)]"
        >
          {showMore ? "Show top 3" : "Show more"}
        </button>
      ) : null}
    </section>
  );
}
