"use client";

import {
  EncounterMode,
  EndingMode,
  HabitatRegion,
  ViralLane,
  ViolenceLevel,
} from "@/types";

import type { Season, TimeOfDay } from "@/types";

type Option<T extends string | number> = { value: T; label: string };

const encounterOptions: Option<EncounterMode>[] = [
  { value: EncounterMode.FIRST_CONTACT, label: "First Contact" },
  { value: EncounterMode.PEAK_TENSION, label: "Peak Tension" },
  { value: EncounterMode.ESCALATION, label: "Escalation" },
  { value: EncounterMode.RESOLUTION, label: "Resolution" },
  { value: EncounterMode.AFTERMATH, label: "Aftermath" },
];

const endingOptions: Option<EndingMode>[] = [
  { value: EndingMode.ESCAPE, label: "Escape" },
  { value: EndingMode.STANDOFF, label: "Standoff" },
  { value: EndingMode.DOMINANT_WIN, label: "Dominant Win" },
  { value: EndingMode.UNRESOLVED, label: "Unresolved" },
  { value: EndingMode.PROTECTED_EXIT, label: "Protected Exit" },
  { value: EndingMode.SEASONAL_DEPARTURE, label: "Seasonal Departure" },
];

const viralLaneOptions: Option<ViralLane>[] = [
  { value: ViralLane.TENSION, label: "Tension" },
  { value: ViralLane.TENDERNESS, label: "Tenderness" },
  { value: ViralLane.AWE, label: "Awe" },
  { value: ViralLane.POWER, label: "Power" },
  { value: ViralLane.UNDERDOG, label: "Underdog" },
  { value: ViralLane.SURVIVAL, label: "Survival" },
  { value: ViralLane.SPECTACLE, label: "Spectacle" },
];

const habitatRegionOptions: Option<HabitatRegion>[] = [
  { value: HabitatRegion.YELLOWSTONE, label: "Yellowstone" },
  { value: HabitatRegion.ALASKA, label: "Alaska" },
  { value: HabitatRegion.GREAT_PLAINS, label: "Great Plains" },
  { value: HabitatRegion.PACIFIC_NORTHWEST, label: "Pacific Northwest" },
  { value: HabitatRegion.EVERGLADES, label: "Everglades" },
  { value: HabitatRegion.ROCKY_MOUNTAINS, label: "Rocky Mountains" },
  { value: HabitatRegion.APPALACHIA, label: "Appalachia" },
  { value: HabitatRegion.SOUTHWEST_DESERT, label: "Southwest Desert" },
  { value: HabitatRegion.COASTAL_WETLANDS, label: "Coastal Wetlands" },
];

const seasonOptions: Option<Season>[] = [
  { value: "SPRING", label: "Spring" },
  { value: "SUMMER", label: "Summer" },
  { value: "FALL", label: "Fall" },
  { value: "WINTER", label: "Winter" },
  { value: "MIGRATION_SEASON", label: "Migration Season" },
];

const timeOfDayOptions: Option<TimeOfDay>[] = [
  { value: "DAWN", label: "Dawn" },
  { value: "GOLDEN_HOUR", label: "Golden Hour" },
  { value: "MIDDAY", label: "Midday" },
  { value: "DUSK", label: "Dusk" },
  { value: "BLUE_HOUR", label: "Blue Hour" },
  { value: "NIGHT", label: "Night" },
];

function Field<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-100 outline-none transition focus:border-amber-400/70"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function getViolenceLabel(value: ViolenceLevel) {
  if (value === ViolenceLevel.NON_GRAPHIC_STRUGGLE) return "3 - Non-graphic struggle";
  if (value === ViolenceLevel.IMPLIED_PRESSURE) return "2 - Implied pressure";
  return "1 - Display only";
}

export default function SceneRelationshipCard({
  encounterMode,
  endingMode,
  viralLane,
  violenceLevel,
  habitatRegion,
  season,
  timeOfDay,
  onEncounterModeChange,
  onEndingModeChange,
  onViralLaneChange,
  onViolenceLevelChange,
  onHabitatRegionChange,
  onSeasonChange,
  onTimeOfDayChange,
}: {
  encounterMode: EncounterMode;
  endingMode: EndingMode;
  viralLane: ViralLane;
  violenceLevel: ViolenceLevel;
  habitatRegion: HabitatRegion;
  season: Season;
  timeOfDay: TimeOfDay;
  onEncounterModeChange: (value: EncounterMode) => void;
  onEndingModeChange: (value: EndingMode) => void;
  onViralLaneChange: (value: ViralLane) => void;
  onViolenceLevelChange: (value: ViolenceLevel) => void;
  onHabitatRegionChange: (value: HabitatRegion) => void;
  onSeasonChange: (value: Season) => void;
  onTimeOfDayChange: (value: TimeOfDay) => void;
}) {
  return (
    <section className="rounded-2xl border border-indigo-400/25 bg-zinc-950 p-4 text-zinc-100 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-300/80">
            Scene Relationship
          </p>
          <h3 className="mt-1 text-base font-semibold text-zinc-50">
            Viral-safe story controls
          </h3>
        </div>
        <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-300">
          Safety {Number(violenceLevel)}/3
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Field
          label="Encounter Mode"
          value={encounterMode}
          options={encounterOptions}
          onChange={onEncounterModeChange}
        />
        <Field
          label="Ending Mode"
          value={endingMode}
          options={endingOptions}
          onChange={onEndingModeChange}
        />
        <Field
          label="USA Viral Lane"
          value={viralLane}
          options={viralLaneOptions}
          onChange={onViralLaneChange}
        />
        <Field
          label="Habitat Region"
          value={habitatRegion}
          options={habitatRegionOptions}
          onChange={onHabitatRegionChange}
        />
        <Field
          label="Season"
          value={season}
          options={seasonOptions}
          onChange={onSeasonChange}
        />
        <Field
          label="Time of Day"
          value={timeOfDay}
          options={timeOfDayOptions}
          onChange={onTimeOfDayChange}
        />
      </div>

      <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-500/10 p-3">
        <div className="flex items-center justify-between gap-3">
          <label
            htmlFor="violence-level"
            className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-200"
          >
            Violence Level
          </label>
          <span className="text-xs font-bold text-amber-200">
            {getViolenceLabel(violenceLevel)}
          </span>
        </div>
        <input
          id="violence-level"
          type="range"
          min="1"
          max="3"
          step="1"
          value={Number(violenceLevel)}
          onChange={(event) =>
            onViolenceLevelChange(Number(event.target.value) as ViolenceLevel)
          }
          className="mt-3 w-full accent-amber-400"
        />
        <div className="mt-1 flex justify-between text-[10px] text-zinc-500">
          <span>Posturing</span>
          <span>Implied</span>
          <span>Non-graphic</span>
        </div>
      </div>
    </section>
  );
}
