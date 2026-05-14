"use client";

import { HabitatRegion, StoryMode } from "@/types";
import { getStoryModeImageSetupGuidance } from "@/lib/story-mode-image-setup-guidance";

import AnimalSearchSelect from "@/components/build/animal-search-select";
import {
  getStoryModeSubjectDefaults,
  getStoryModeSubjectOverrideFlags,
  type StoryModeSubjectValues,
} from "@/lib/story-mode-subject-defaults";
import {
  evaluateStoryModePairQuality,
  type StoryModePairQuality,
} from "@/lib/story-mode-pair-quality";
import {
  evaluateHabitatCompatibility,
  type HabitatCompatibility,
} from "@/lib/story-mode-habitat-quality";
import {
  getFishingFoodSourceOptions,
  getStoryModeAnimalOptions,
  hasStoryModePairedAnimalOptions,
} from "@/lib/story-mode-subject-options";

import type {
  EscapeDirection,
  OffspringLabel,
  Season,
  StrikeMethod,
  TimeOfDay,
  WeatherHazard,
} from "@/types";

export type { StoryModeSubjectValues } from "@/lib/story-mode-subject-defaults";

type StoryModeSubjectFieldsProps = StoryModeSubjectValues & {
  storyMode: StoryMode;
  habitatRegion: HabitatRegion;
  season: Season;
  timeOfDay: TimeOfDay;
  animalOptions: string[];
  onSubjectAChange: (value: string) => void;
  onSubjectBChange: (value: string) => void;
  onGroupCountChange: (value: number | undefined) => void;
  onOffspringLabelChange: (value: OffspringLabel) => void;
  onStrikeMethodChange: (value: StrikeMethod) => void;
  onEscapeDirectionChange: (value: EscapeDirection) => void;
  onWeatherHazardChange: (value: WeatherHazard) => void;
  onRutSeasonChange: (value: boolean) => void;
  onFoodItemChange: (value: string) => void;
  onResetSmartDefaults: () => void;
};

type SubjectFieldConfig = {
  eyebrow: string;
  title: string;
  helper: string;
  subjectALabel: string;
  subjectBLabel?: string;
  subjectBOptional?: boolean;
  groupLabel?: string;
  groupMin?: number;
  groupMax?: number;
};

const offspringOptions: OffspringLabel[] = ["cub", "fawn", "calf", "pup", "kit"];
const strikeMethodOptions: StrikeMethod[] = [
  "POUNCE",
  "DIVE",
  "SWIPE",
  "CHASE",
  "AMBUSH",
];
const escapeDirectionOptions: EscapeDirection[] = [
  "WATER",
  "UPHILL",
  "BRUSH",
  "OPEN_FIELD",
];
const weatherHazardOptions: WeatherHazard[] = [
  "BLIZZARD",
  "ICE",
  "FLOOD",
  "DROUGHT",
  "HEAT",
];

const modeConfig: Partial<Record<StoryMode, SubjectFieldConfig>> = {
  [StoryMode.HERD_DEFENSE]: {
    eyebrow: "Herd Defense Setup",
    title: "Group survival pressure",
    helper:
      "Set the herd, the outside pressure, and the number of visible animals for the defensive formation.",
    subjectALabel: "Herd Species",
    subjectBLabel: "Threat Species",
    groupLabel: "Group Count",
    groupMin: 2,
    groupMax: 200,
  },
  [StoryMode.MOTHER_BABY]: {
    eyebrow: "Mother & Baby Setup",
    title: "Protective family tension",
    helper:
      "Set the mother, offspring label, and optional threat so the scene reads as protection rather than graphic conflict.",
    subjectALabel: "Mother Species",
    subjectBLabel: "Threat Species",
    subjectBOptional: true,
  },
  [StoryMode.RIVAL_CLASH]: {
    eyebrow: "Rival Clash Setup",
    title: "Two-sided standoff",
    helper:
      "Set both rivals and whether rut-season pressure should shape the non-graphic standoff.",
    subjectALabel: "Rival A",
    subjectBLabel: "Rival B",
  },
  [StoryMode.NEAR_MISS]: {
    eyebrow: "Near-Miss Escape Setup",
    title: "Escape lane readability",
    helper:
      "Set the animal escaping, the pressure animal, and the direction that keeps the near-miss readable.",
    subjectALabel: "Escape Animal",
    subjectBLabel: "Threat Animal",
  },
  [StoryMode.FISHING_STRIKE]: {
    eyebrow: "Fishing Strike Setup",
    title: "Food strike timing",
    helper:
      "Set the strike animal, food source, and clean motion method for a readable water or riverbank beat.",
    subjectALabel: "Strike Animal",
    subjectBLabel: "Food Source",
  },
  [StoryMode.WEATHER_SURVIVAL]: {
    eyebrow: "Weather Survival Setup",
    title: "Hazard and endurance",
    helper:
      "Set the subject animal, weather hazard, and visible group size for survival tension without injury framing.",
    subjectALabel: "Subject Animal",
    groupLabel: "Group Count",
    groupMin: 1,
    groupMax: 100,
  },
  [StoryMode.MIGRATION]: {
    eyebrow: "Migration Crossing Setup",
    title: "Movement through an obstacle",
    helper:
      "Set the migrating species, crossing type, and group count so scale and spacing stay clear.",
    subjectALabel: "Migrating Species",
    subjectBLabel: "Obstacle / Crossing Type",
    groupLabel: "Group Count",
    groupMin: 10,
    groupMax: 500,
  },
  [StoryMode.SCAVENGER_CONFLICT]: {
    eyebrow: "Scavenger Conflict Setup",
    title: "Food ownership tension",
    helper:
      "Set the current food owner, challenger, and food item zone with professional non-graphic wildlife framing.",
    subjectALabel: "Food Owner",
    subjectBLabel: "Challenger Species",
  },
};

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getEffectiveValues(
  storyMode: StoryMode,
  values: StoryModeSubjectValues
) {
  const defaults = getStoryModeSubjectDefaults(storyMode);
  return {
    subjectA: values.subjectA?.trim() || defaults.subjectA || "",
    subjectB: values.subjectB?.trim() || defaults.subjectB || "",
    groupCount: values.groupCount ?? defaults.groupCount,
    offspringLabel: values.offspringLabel ?? defaults.offspringLabel ?? "cub",
    strikeMethod: values.strikeMethod ?? defaults.strikeMethod ?? "SWIPE",
    escapeDirection:
      values.escapeDirection ?? defaults.escapeDirection ?? "BRUSH",
    weatherHazard:
      values.weatherHazard ?? defaults.weatherHazard ?? "BLIZZARD",
    rutSeason: values.rutSeason ?? defaults.rutSeason ?? false,
    foodItem: values.foodItem?.trim() || defaults.foodItem || "",
  };
}


function hasAnimalSubjectB(storyMode: StoryMode) {
  return (
    storyMode === StoryMode.HERD_DEFENSE ||
    storyMode === StoryMode.MOTHER_BABY ||
    storyMode === StoryMode.RIVAL_CLASH ||
    storyMode === StoryMode.NEAR_MISS ||
    storyMode === StoryMode.SCAVENGER_CONFLICT
  );
}

export function buildStoryModeSetupSummary({
  storyMode,
  habitatRegion,
  season,
  timeOfDay,
  ...values
}: StoryModeSubjectValues & {
  storyMode: StoryMode;
  habitatRegion: HabitatRegion;
  season: Season;
  timeOfDay: TimeOfDay;
}) {
  const effective = getEffectiveValues(storyMode, values);
  const place = `${formatEnumLabel(habitatRegion)} · ${formatEnumLabel(
    season
  )} · ${formatEnumLabel(timeOfDay)}`;

  switch (storyMode) {
    case StoryMode.MOTHER_BABY:
      return `Story Setup: ${effective.subjectA} + ${effective.offspringLabel}s vs ${effective.subjectB || "open threat"} · ${place}`;
    case StoryMode.RIVAL_CLASH:
      return `Story Setup: ${effective.subjectA} vs ${effective.subjectB} · ${effective.rutSeason ? "rut season" : "non-rut standoff"} · ${place}`;
    case StoryMode.NEAR_MISS:
      return `Story Setup: ${effective.subjectA} escaping ${formatEnumLabel(effective.escapeDirection)} from ${effective.subjectB} · ${place}`;
    case StoryMode.FISHING_STRIKE:
      return `Story Setup: ${effective.subjectA} ${formatEnumLabel(effective.strikeMethod)} at ${effective.subjectB} · ${place}`;
    case StoryMode.WEATHER_SURVIVAL:
      return `Story Setup: ${effective.groupCount} ${effective.subjectA} in ${formatEnumLabel(effective.weatherHazard)} · ${place}`;
    case StoryMode.MIGRATION:
      return `Story Setup: ${effective.groupCount} ${effective.subjectA} at ${effective.subjectB} · ${place}`;
    case StoryMode.SCAVENGER_CONFLICT:
      return `Story Setup: ${effective.subjectA} vs ${effective.subjectB} over ${effective.foodItem} · ${place}`;
    case StoryMode.HERD_DEFENSE:
    default:
      return `Story Setup: ${effective.subjectA} vs ${effective.subjectB} · ${effective.groupCount} visible animals · ${place}`;
  }
}

function ManualOverrideBadge({ show }: { show?: boolean }) {
  if (!show) return null;

  return (
    <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-amber-200">
      Manual override
    </span>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  helper,
  manualOverride,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  helper?: string;
  manualOverride?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex min-h-[20px] flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
        <span>{label}</span>
        <ManualOverrideBadge show={manualOverride} />
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm font-semibold text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-amber-400/70"
      />
      {helper ? (
        <span className="mt-1 block text-[11px] leading-relaxed text-zinc-500">
          {helper}
        </span>
      ) : null}
    </label>
  );
}

function SelectInput<T extends string>({
  label,
  value,
  options,
  onChange,
  manualOverride,
}: {
  label: string;
  value: T;
  options: T[];
  onChange: (value: T) => void;
  manualOverride?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex min-h-[20px] flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
        <span>{label}</span>
        <ManualOverrideBadge show={manualOverride} />
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm font-semibold text-zinc-100 outline-none transition focus:border-amber-400/70"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {formatEnumLabel(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function StoryModePairQualityCard({ quality }: { quality: StoryModePairQuality }) {
  const toneClass = {
    strong:
      "border-emerald-400/35 bg-[color:var(--success-bg)] text-[color:var(--success-text)]",
    good: "border-cyan-400/35 bg-[color:var(--info-bg)] text-[color:var(--info-text)]",
    caution:
      "border-amber-400/35 bg-[color:var(--warning-bg)] text-[color:var(--warning-text)]",
    weak: "border-rose-400/35 bg-[color:var(--danger-bg)] text-[color:var(--danger-text)]",
  }[quality.level];
  const suggestion = quality.suggestions[0];

  return (
    <div
      className={`rounded-xl border p-3 ${toneClass}`}
      data-testid="story-mode-pair-quality-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[10px] font-black uppercase tracking-[0.14em]">
          {quality.label}
        </span>
        <span className="rounded-full bg-[color:var(--surface-elevated)] px-2 py-0.5 text-[10px] font-black text-[color:var(--text)] ring-1 ring-[color:var(--border)]">
          {quality.score}/100
        </span>
      </div>
      <div className="mt-1 space-y-1 text-[11px] font-semibold leading-relaxed">
        {quality.reasons.map((reason) => (
          <p key={reason}>{reason}</p>
        ))}
        {suggestion ? <p>{suggestion}</p> : null}
      </div>
    </div>
  );
}

function HabitatCompatibilityCard({
  quality,
}: {
  quality: HabitatCompatibility;
}) {
  const toneClass = {
    strong:
      "border-emerald-400/35 bg-[color:var(--success-bg)] text-[color:var(--success-text)]",
    good: "border-cyan-400/35 bg-[color:var(--info-bg)] text-[color:var(--info-text)]",
    caution:
      "border-amber-400/35 bg-[color:var(--warning-bg)] text-[color:var(--warning-text)]",
    weak: "border-rose-400/35 bg-[color:var(--danger-bg)] text-[color:var(--danger-text)]",
  }[quality.level];
  const suggestion =
    quality.level === "caution" || quality.level === "weak"
      ? quality.suggestions[0]
      : undefined;

  return (
    <div
      className={`rounded-xl border p-3 ${toneClass}`}
      data-testid="story-mode-habitat-quality-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[10px] font-black uppercase tracking-[0.14em]">
          {quality.label}
        </span>
        <span className="rounded-full bg-[color:var(--surface-elevated)] px-2 py-0.5 text-[10px] font-black text-[color:var(--text)] ring-1 ring-[color:var(--border)]">
          {quality.score}/100
        </span>
      </div>
      <div className="mt-1 space-y-1 text-[11px] font-semibold leading-relaxed">
        {quality.reasons.slice(0, 2).map((reason) => (
          <p key={reason}>{reason}</p>
        ))}
        {suggestion ? <p>{suggestion}</p> : null}
      </div>
    </div>
  );
}

function GroupCountSlider({
  label,
  value,
  min,
  max,
  onChange,
  manualOverride,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  manualOverride?: boolean;
}) {
  return (
    <label className="block rounded-xl border border-cyan-400/15 bg-cyan-500/10 p-3">
      <span className="flex items-center justify-between gap-3">
        <span className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-200">
          <span>{label}</span>
          <ManualOverrideBadge show={manualOverride} />
        </span>
        <span className="rounded-full bg-cyan-400/15 px-2.5 py-1 text-xs font-black text-cyan-100">
          {value}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step="1"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-3 w-full accent-cyan-300"
      />
      <span className="mt-1 flex justify-between text-[10px] text-zinc-500">
        <span>{min}</span>
        <span>{max}</span>
      </span>
    </label>
  );
}

export default function StoryModeSubjectFields({
  storyMode,
  habitatRegion,
  season,
  timeOfDay,
  subjectA,
  subjectB,
  groupCount,
  offspringLabel,
  strikeMethod,
  escapeDirection,
  weatherHazard,
  rutSeason,
  foodItem,
  animalOptions,
  onSubjectAChange,
  onSubjectBChange,
  onGroupCountChange,
  onOffspringLabelChange,
  onStrikeMethodChange,
  onEscapeDirectionChange,
  onWeatherHazardChange,
  onRutSeasonChange,
  onFoodItemChange,
  onResetSmartDefaults,
}: StoryModeSubjectFieldsProps) {
  const config = modeConfig[storyMode];
  const values = getEffectiveValues(storyMode, {
    subjectA,
    subjectB,
    groupCount,
    offspringLabel,
    strikeMethod,
    escapeDirection,
    weatherHazard,
    rutSeason,
    foodItem,
  });
  const overrideFlags = getStoryModeSubjectOverrideFlags(storyMode, {
    subjectA,
    subjectB,
    groupCount,
    offspringLabel,
    strikeMethod,
    escapeDirection,
    weatherHazard,
    rutSeason,
    foodItem,
  });
  const hasOverrides = Object.values(overrideFlags).some(Boolean);
  const subjectAOptions = getStoryModeAnimalOptions({
    storyMode,
    field: "subjectA",
    animalOptions,
    currentValue: values.subjectA,
    subjectB: values.subjectB,
  });
  const subjectBOptions = getStoryModeAnimalOptions({
    storyMode,
    field: "subjectB",
    animalOptions,
    currentValue: values.subjectB,
    subjectA: values.subjectA,
  });
  const fishingFoodSourceOptions = getFishingFoodSourceOptions({
    animalOptions,
    currentValue: values.subjectB,
    subjectA: values.subjectA,
  });
  const showSubjectBPairingHelper = hasStoryModePairedAnimalOptions({
    storyMode,
    field: "subjectB",
    animalOptions,
    subjectA: values.subjectA,
  });
  const subjectBPairingHelper = showSubjectBPairingHelper
    ? "Showing likely matches for this story mode."
    : undefined;
  const pairQuality = evaluateStoryModePairQuality({
    storyMode,
    subjectA: values.subjectA,
    subjectB: values.subjectB,
    habitatRegion,
    season,
    animalOptions,
  });
  const habitatQuality = evaluateHabitatCompatibility({
    storyMode,
    subjectA: values.subjectA,
    subjectB: values.subjectB,
    habitatRegion,
    season,
    timeOfDay,
    animalOptions,
  });

  if (!config) return null;

  return (
    <section className="rounded-2xl border border-zinc-700/80 bg-zinc-950 p-5 text-zinc-100 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-300/80">
            {config.eyebrow}
          </p>
          <h3 className="mt-1 text-base font-semibold text-zinc-50">
            {config.title}
          </h3>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-zinc-500">
            {config.helper}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {hasOverrides ? <ManualOverrideBadge show /> : null}
          <button
            type="button"
            onClick={onResetSmartDefaults}
            className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-amber-100 transition hover:border-amber-300/70 hover:bg-amber-400/15"
          >
            Reset to Smart Defaults
          </button>
          <span className="rounded-full border border-indigo-400/25 bg-indigo-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-indigo-200">
            Subject Setup
          </span>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-cyan-400/15 bg-cyan-500/10 px-3 py-2 text-[11px] leading-relaxed text-cyan-100/80">
        Smart defaults are applied for each story mode. You can override any subject
        or production control before generating.
      </div>

      {getStoryModeImageSetupGuidance(storyMode) ? (
        <div
          className="mb-4 rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2.5"
          data-testid="story-mode-image-setup-guidance"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-300">
            Master image needs
          </p>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-amber-50/90">
            {getStoryModeImageSetupGuidance(storyMode)}
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <AnimalSearchSelect
          label={config.subjectALabel}
          value={values.subjectA}
          onChange={onSubjectAChange}
          options={subjectAOptions}
          placeholder={`Search ${config.subjectALabel.toLowerCase()}...`}
          manualOverride={overrideFlags.subjectA}
        />

        {config.subjectBLabel && hasAnimalSubjectB(storyMode) ? (
          <AnimalSearchSelect
            label={
              config.subjectBOptional
                ? `${config.subjectBLabel} (optional)`
                : config.subjectBLabel
            }
            value={values.subjectB}
            onChange={onSubjectBChange}
            options={subjectBOptions}
            placeholder={`Search ${config.subjectBLabel.toLowerCase()}...`}
            helper={subjectBPairingHelper}
            manualOverride={overrideFlags.subjectB}
          />
        ) : storyMode === StoryMode.FISHING_STRIKE && config.subjectBLabel ? (
          <AnimalSearchSelect
            label={config.subjectBLabel}
            value={values.subjectB}
            onChange={onSubjectBChange}
            options={fishingFoodSourceOptions}
            placeholder="Search food or fish source..."
            helper={
              subjectBPairingHelper ??
              "Use a clean food source label for readable waterline action."
            }
            manualOverride={overrideFlags.subjectB}
          />
        ) : config.subjectBLabel ? (
          <TextInput
            label={
              config.subjectBOptional
                ? `${config.subjectBLabel} (optional)`
                : config.subjectBLabel
            }
            value={values.subjectB}
            onChange={onSubjectBChange}
            placeholder={values.subjectB}
            manualOverride={overrideFlags.subjectB}
          />
        ) : null}

        {storyMode === StoryMode.MOTHER_BABY ? (
          <SelectInput
            label="Offspring Label"
            value={values.offspringLabel}
            options={offspringOptions}
            onChange={onOffspringLabelChange}
            manualOverride={overrideFlags.offspringLabel}
          />
        ) : null}

        {storyMode === StoryMode.RIVAL_CLASH ? (
          <label className="flex min-h-[72px] items-center justify-between gap-4 rounded-xl border border-amber-400/20 bg-amber-500/10 p-3">
            <span>
              <span className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-200">
                <span>Rut Season</span>
                <ManualOverrideBadge show={overrideFlags.rutSeason} />
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-zinc-500">
                Adds seasonal pressure as metadata only.
              </span>
            </span>
            <input
              type="checkbox"
              checked={values.rutSeason}
              onChange={(event) => onRutSeasonChange(event.target.checked)}
              className="h-5 w-5 accent-amber-400"
            />
          </label>
        ) : null}

        {storyMode === StoryMode.NEAR_MISS ? (
          <SelectInput
            label="Escape Direction"
            value={values.escapeDirection}
            options={escapeDirectionOptions}
            onChange={onEscapeDirectionChange}
            manualOverride={overrideFlags.escapeDirection}
          />
        ) : null}

        {storyMode === StoryMode.FISHING_STRIKE ? (
          <SelectInput
            label="Strike Method"
            value={values.strikeMethod}
            options={strikeMethodOptions}
            onChange={onStrikeMethodChange}
            manualOverride={overrideFlags.strikeMethod}
          />
        ) : null}

        {storyMode === StoryMode.WEATHER_SURVIVAL ? (
          <SelectInput
            label="Weather Hazard"
            value={values.weatherHazard}
            options={weatherHazardOptions}
            onChange={onWeatherHazardChange}
            manualOverride={overrideFlags.weatherHazard}
          />
        ) : null}

        {storyMode === StoryMode.SCAVENGER_CONFLICT ? (
          <TextInput
            label="Food Item"
            value={values.foodItem}
            onChange={onFoodItemChange}
            placeholder={values.foodItem}
            helper="Keep this non-graphic: describe the food zone, not visible injury."
            manualOverride={overrideFlags.foodItem}
          />
        ) : null}

        {config.groupLabel && config.groupMin && config.groupMax ? (
          <div className="md:col-span-2">
            <GroupCountSlider
              label={config.groupLabel}
              value={values.groupCount ?? config.groupMin}
              min={config.groupMin}
              max={config.groupMax}
              onChange={onGroupCountChange}
              manualOverride={overrideFlags.groupCount}
            />
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <StoryModePairQualityCard quality={pairQuality} />
        <HabitatCompatibilityCard quality={habitatQuality} />
      </div>

      <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-500/10 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-300">
          Story Setup Summary
        </p>
        <p className="mt-1 text-sm font-semibold leading-relaxed text-amber-50">
          {buildStoryModeSetupSummary({
            storyMode,
            habitatRegion,
            season,
            timeOfDay,
            subjectA,
            subjectB,
            groupCount,
            offspringLabel,
            strikeMethod,
            escapeDirection,
            weatherHazard,
            rutSeason,
            foodItem,
          })}
        </p>
      </div>
    </section>
  );
}
