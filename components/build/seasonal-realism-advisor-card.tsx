"use client";

import { useEffect, useMemo, useState } from "react";

import {
  getEasternCreatorContext,
  getRecommendedSeasonalSetup,
  getRecommendedWildlifeSetup,
  getSeasonalRealismAdvice,
  type RecommendedSeasonalSetup,
  type SeasonalRealismStatus,
} from "@/lib/seasonal-realism-advisor";
import { HabitatRegion, StoryMode, ViralLane } from "@/types";

import type { Season, Weather, WeatherHazard } from "@/types";

type SeasonalRealismAdvisorCardProps = {
  storyMode: StoryMode;
  habitatRegion: HabitatRegion;
  season: Season;
  weather: Weather;
  weatherHazard?: WeatherHazard;
  subjectA?: string;
  subjectB?: string;
  predator: string;
  prey: string;
  viralLane: ViralLane;
  onSeasonChange: (value: Season) => void;
  onApplyRecommendedSetup: (setup: RecommendedSeasonalSetup) => void;
};

const statusStyles: Record<SeasonalRealismStatus, string> = {
  strong: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  caution: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
  mismatch: "border-amber-400/40 bg-amber-400/10 text-amber-100",
  "creative-override": "border-violet-400/35 bg-violet-400/10 text-violet-100",
};

const labelText: Record<Season, string> = {
  SPRING: "Spring",
  SUMMER: "Summer",
  FALL: "Fall",
  WINTER: "Winter",
  MIGRATION_SEASON: "Migration Season",
};

const storyModeText: Record<StoryMode, string> = {
  [StoryMode.PREDATOR_VS_PREY]: "Predator vs Prey",
  [StoryMode.HERD_DEFENSE]: "Herd Defense",
  [StoryMode.MOTHER_BABY]: "Mother & Baby",
  [StoryMode.RIVAL_CLASH]: "Rival Clash",
  [StoryMode.NEAR_MISS]: "Near-Miss Escape",
  [StoryMode.FISHING_STRIKE]: "Fishing Strike",
  [StoryMode.WEATHER_SURVIVAL]: "Weather Survival",
  [StoryMode.MIGRATION]: "Migration Crossing",
  [StoryMode.SCAVENGER_CONFLICT]: "Scavenger Conflict",
};

const habitatText: Record<HabitatRegion, string> = {
  [HabitatRegion.YELLOWSTONE]: "Yellowstone",
  [HabitatRegion.ALASKA]: "Alaska",
  [HabitatRegion.GREAT_PLAINS]: "Great Plains",
  [HabitatRegion.PACIFIC_NORTHWEST]: "Pacific Northwest",
  [HabitatRegion.EVERGLADES]: "Everglades",
  [HabitatRegion.ROCKY_MOUNTAINS]: "Rocky Mountains",
  [HabitatRegion.APPALACHIA]: "Appalachia",
  [HabitatRegion.SOUTHWEST_DESERT]: "Southwest Desert",
  [HabitatRegion.COASTAL_WETLANDS]: "Coastal Wetlands",
};

export default function SeasonalRealismAdvisorCard({
  storyMode,
  habitatRegion,
  season,
  weather,
  weatherHazard,
  subjectA,
  subjectB,
  predator,
  prey,
  viralLane,
  onSeasonChange,
  onApplyRecommendedSetup,
}: SeasonalRealismAdvisorCardProps) {
  const [now, setNow] = useState(() => new Date());
  const [creativeOverride, setCreativeOverride] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setCreativeOverride(false);
  }, [storyMode, habitatRegion, season, weather, weatherHazard, subjectA, subjectB, predator, prey]);

  const easternContext = useMemo(() => getEasternCreatorContext(now), [now]);
  const advice = useMemo(
    () =>
      getSeasonalRealismAdvice({
        storyMode,
        habitatRegion,
        season,
        weather,
        weatherHazard,
        subjectA,
        subjectB,
        predator,
        prey,
        viralLane,
        creativeOverride,
      }),
    [
      creativeOverride,
      habitatRegion,
      predator,
      prey,
      season,
      storyMode,
      subjectA,
      subjectB,
      viralLane,
      weather,
      weatherHazard,
    ]
  );
  const setupNote = useMemo(
    () =>
      getRecommendedWildlifeSetup({
        storyMode,
        habitatRegion,
        season,
        weather,
        weatherHazard,
        subjectA,
        subjectB,
        predator,
        prey,
        viralLane,
      }),
    [habitatRegion, predator, prey, season, storyMode, subjectA, subjectB, viralLane, weather, weatherHazard]
  );
  const recommendedSetup = useMemo(
    () =>
      getRecommendedSeasonalSetup({
        storyMode,
        habitatRegion,
        season,
        weather,
        weatherHazard,
        subjectA,
        subjectB,
        predator,
        prey,
        viralLane,
      }),
    [habitatRegion, predator, prey, season, storyMode, subjectA, subjectB, viralLane, weather, weatherHazard]
  );
  const recommendedSetupActive = Boolean(
    recommendedSetup &&
      recommendedSetup.storyMode === storyMode &&
      (!recommendedSetup.habitatRegion || recommendedSetup.habitatRegion === habitatRegion) &&
      (!recommendedSetup.season || recommendedSetup.season === season) &&
      (storyMode === StoryMode.PREDATOR_VS_PREY
        ? (!recommendedSetup.subjectA || recommendedSetup.subjectA === predator) &&
          (!recommendedSetup.subjectB || recommendedSetup.subjectB === prey)
        : (!recommendedSetup.subjectA || recommendedSetup.subjectA === subjectA) &&
          (!recommendedSetup.subjectB || recommendedSetup.subjectB === subjectB))
  );
  const canApplySeason = Boolean(
    advice.suggestedSeason && advice.suggestedSeason !== season
  );

  return (
    <section className="rounded-2xl border border-amber-400/20 bg-zinc-950 p-4 text-zinc-100 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-300/80">
            Live U.S. Wildlife Context
          </p>
          <h3 className="mt-1 text-base font-semibold text-zinc-50">
            Seasonal Realism Advisor
          </h3>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-zinc-500">
            WSTV uses USA Eastern Time for creator planning. Habitat and selected season still control prompt output.
          </p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] ${statusStyles[advice.status]}`}>
          {advice.statusLabel}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Eastern Date
          </p>
          <p className="mt-1 text-sm font-bold text-zinc-100">{easternContext.dateLabel}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Eastern Time
          </p>
          <p className="mt-1 text-sm font-bold text-zinc-100">{easternContext.timeLabel}</p>
          <p className="mt-1 text-[10px] text-zinc-500">{easternContext.timeZone}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Current U.S. Season
          </p>
          <p className="mt-1 text-sm font-bold text-zinc-100">
            {labelText[easternContext.currentSeason]}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Selected Scene
          </p>
          <p className="mt-1 text-sm font-bold text-zinc-100">
            {habitatText[habitatRegion]} · {labelText[season]}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-amber-400/15 bg-amber-400/10 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-200">
          Realism Check
        </p>
        <p className="mt-1 text-sm leading-relaxed text-amber-50">
          {advice.recommendation}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-zinc-400">
          {setupNote}
        </p>
      </div>

      {advice.warnings.length > 0 ? (
        <div className="mt-3 rounded-xl border border-orange-400/20 bg-orange-500/10 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-orange-200">
            Mismatch Warnings
          </p>
          <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-orange-50/90">
            {advice.warnings.map((warning) => (
              <li key={warning}>- {warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {advice.passes.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {advice.passes.map((pass) => (
            <span
              key={pass}
              className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-100"
            >
              {pass}
            </span>
          ))}
        </div>
      ) : null}

      {recommendedSetup ? (
        <div className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-200">
                Recommended Wildlife Setup
              </p>
              <h4 className="mt-1 text-sm font-bold text-cyan-50">
                {recommendedSetup.label}
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-cyan-50/80">
                {recommendedSetup.reason}
              </p>
            </div>
            <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-cyan-100">
              Manual apply
            </span>
          </div>
          <div className="mt-3 grid gap-2 text-[11px] sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
              <span className="block uppercase tracking-[0.1em] text-zinc-500">Story Mode</span>
              <span className="mt-1 block font-semibold text-zinc-100">
                {storyModeText[recommendedSetup.storyMode]}
              </span>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
              <span className="block uppercase tracking-[0.1em] text-zinc-500">Subjects</span>
              <span className="mt-1 block font-semibold text-zinc-100">
                {recommendedSetup.subjectA ?? "Current subject"}
                {recommendedSetup.subjectB ? ` vs ${recommendedSetup.subjectB}` : ""}
              </span>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
              <span className="block uppercase tracking-[0.1em] text-zinc-500">Habitat</span>
              <span className="mt-1 block font-semibold text-zinc-100">
                {recommendedSetup.habitatRegion
                  ? habitatText[recommendedSetup.habitatRegion]
                  : habitatText[habitatRegion]}
              </span>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
              <span className="block uppercase tracking-[0.1em] text-zinc-500">Season</span>
              <span className="mt-1 block font-semibold text-zinc-100">
                {recommendedSetup.season
                  ? labelText[recommendedSetup.season]
                  : labelText[season]}
              </span>
            </div>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
            Manual apply only. This replaces current subject setup and may update story mode, habitat, and season; it will not generate automatically.
          </p>
          <button
            type="button"
            disabled={recommendedSetupActive}
            onClick={() => onApplyRecommendedSetup(recommendedSetup)}
            className="mt-3 rounded-xl border border-cyan-300/40 bg-cyan-400/15 px-3.5 py-2 text-xs font-bold text-cyan-50 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.03] disabled:text-zinc-500"
          >
            {recommendedSetupActive ? "Recommended setup active" : "Apply Recommended Setup"}
          </button>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={!canApplySeason}
          onClick={() => {
            if (advice.suggestedSeason) onSeasonChange(advice.suggestedSeason);
          }}
          className="rounded-xl border border-amber-300/40 bg-amber-400/15 px-3.5 py-2 text-xs font-bold text-amber-50 transition hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.03] disabled:text-zinc-500"
        >
          {canApplySeason
            ? `Use suggested season: ${labelText[advice.suggestedSeason as Season]}`
            : "Use suggested season"}
        </button>
        <button
          type="button"
          onClick={() => setCreativeOverride(true)}
          className="rounded-xl border border-violet-300/30 bg-violet-400/10 px-3.5 py-2 text-xs font-bold text-violet-100 transition hover:bg-violet-400/15"
        >
          Keep creative override
        </button>
        <span className="text-[11px] leading-relaxed text-zinc-500">
          Manual only: this advisor never changes animals, story mode, providers, or generation output by itself.
        </span>
      </div>
    </section>
  );
}
