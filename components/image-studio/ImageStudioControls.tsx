"use client";

import type { ExpandedScenicImagePreset } from "@/lib/scenic-expanded-presets";
import {
  ASPECT_RATIOS,
  BASE_WILDLIFE_OPTIONS,
  CAMERA_LOOKS,
  CAPTION_STYLES,
  HASHTAG_MODES,
  LIGHT_OPTIONS,
  MOODS,
  NEGATIVE_MODES,
  PROMPT_STRENGTHS,
  SEASON_OPTIONS,
  WORLD_WILDLIFE_OPTIONS,
} from "@/lib/image-studio/constants";
import type {
  CameraLook,
  CaptionStyle,
  CollectionFilter,
  CountryFilter,
  ExtendedWildlifeOverride,
  HashtagMode,
  ImageStudioWorkspaceSection,
  LightOverride,
  NegativeMode,
  PromptStrength,
  SeasonOverride,
} from "@/lib/image-studio/types";
import { SCENIC_COLLECTIONS } from "@/lib/scenic-expanded-presets";
import type { ScenicImageAspectRatio, ScenicImageMood } from "@/lib/scenic-image-prompts";

import ChipGrid from "@/components/image-studio/ChipGrid";
import WorkspaceCard from "@/components/workspace/WorkspaceCard";

import type { ReactNode } from "react";

function ControlStack({ children }: { children: ReactNode }) {
  return <div className="space-y-4">{children}</div>;
}

export default function ImageStudioControls({
  activeSection,
  selectedPreset,
  filteredPresets,
  selectedPresetId,
  choosePreset,
  collectionFilter,
  chooseCollection,
  countryFilter,
  chooseCountry,
  aspectRatio,
  setAspectRatio,
  mood,
  setMood,
  wildlifeOverride,
  setWildlifeOverride,
  cameraLook,
  setCameraLook,
  seasonOverride,
  setSeasonOverride,
  lightOverride,
  setLightOverride,
  captionStyle,
  setCaptionStyle,
  negativeMode,
  setNegativeMode,
  hashtagMode,
  setHashtagMode,
  promptStrength,
  setPromptStrength,
  customNote,
  setCustomNote,
  randomUSA,
  randomUSAMore,
  randomCanada,
  randomJapan,
  randomEurope,
  randomWorld,
  randomViral,
}: {
  activeSection: ImageStudioWorkspaceSection;
  selectedPreset: ExpandedScenicImagePreset;
  filteredPresets: ExpandedScenicImagePreset[];
  selectedPresetId: string;
  choosePreset: (id: string) => void;
  collectionFilter: CollectionFilter;
  chooseCollection: (collection: CollectionFilter) => void;
  countryFilter: CountryFilter;
  chooseCountry: (country: CountryFilter) => void;
  aspectRatio: ScenicImageAspectRatio;
  setAspectRatio: (value: ScenicImageAspectRatio) => void;
  mood: ScenicImageMood;
  setMood: (value: ScenicImageMood) => void;
  wildlifeOverride: ExtendedWildlifeOverride;
  setWildlifeOverride: (value: ExtendedWildlifeOverride) => void;
  cameraLook: CameraLook;
  setCameraLook: (value: CameraLook) => void;
  seasonOverride: SeasonOverride;
  setSeasonOverride: (value: SeasonOverride) => void;
  lightOverride: LightOverride;
  setLightOverride: (value: LightOverride) => void;
  captionStyle: CaptionStyle;
  setCaptionStyle: (value: CaptionStyle) => void;
  negativeMode: NegativeMode;
  setNegativeMode: (value: NegativeMode) => void;
  hashtagMode: HashtagMode;
  setHashtagMode: (value: HashtagMode) => void;
  promptStrength: PromptStrength;
  setPromptStrength: (value: PromptStrength) => void;
  customNote: string;
  setCustomNote: (value: string) => void;
  randomUSA: () => void;
  randomUSAMore: () => void;
  randomCanada: () => void;
  randomJapan: () => void;
  randomEurope: () => void;
  randomWorld: () => void;
  randomViral: () => void;
}) {
  if (activeSection === "location") {
    return (
      <ControlStack>
        <ChipGrid
          label="Country / world group"
          items={["All", "USA", "Canada", "Japan", "Europe", "World"] as const}
          value={countryFilter}
          onChange={chooseCountry}
        />

        <WorkspaceCard title="Collection" description="Use the left sidebar to move between stages, then refine the exact location here.">
          <div className="grid gap-2">
            {SCENIC_COLLECTIONS.map((collection) => (
              <button
                key={collection}
                type="button"
                onClick={() => chooseCollection(collection as CollectionFilter)}
                className={`rounded-2xl border px-3 py-2 text-left text-xs font-bold transition ${
                  collectionFilter === collection
                    ? "border-white bg-white text-gray-950"
                    : "border-white/[0.08] bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                {collection}
              </button>
            ))}
          </div>
        </WorkspaceCard>

        <WorkspaceCard title="Location preset" description="Choose the exact scenic preset that drives the prompts.">
          <select
            value={selectedPresetId}
            onChange={(event) => choosePreset(event.target.value)}
            className="w-full rounded-2xl border border-white/[0.08] bg-gray-950 px-3 py-2 text-sm font-semibold text-white outline-none"
          >
            {filteredPresets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.collection} — {preset.stateOrProvince} — {preset.title}
              </option>
            ))}
          </select>
          <div className="mt-3 rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.04] p-3 text-xs leading-5 text-white/60">
            <strong className="text-cyan-200">{selectedPreset.parkName}</strong> · {selectedPreset.bestSeason} · Default: {selectedPreset.defaultWildlife}
          </div>
        </WorkspaceCard>
      </ControlStack>
    );
  }

  if (activeSection === "style") {
    return (
      <ControlStack>
        <ChipGrid label="Aspect ratio" items={ASPECT_RATIOS} value={aspectRatio} onChange={setAspectRatio} columns="grid-cols-3" />
        <ChipGrid label="Style / mood" items={MOODS} value={mood} onChange={setMood} columns="grid-cols-1 sm:grid-cols-2" />
        <WorkspaceCard title="Prompt strength" description="Keep the output compact on screen while preserving the same full-copy prompt text underneath.">
          <div className="grid grid-cols-2 gap-2">
            {PROMPT_STRENGTHS.map((strength) => (
              <button
                key={strength}
                type="button"
                onClick={() => setPromptStrength(strength)}
                className={`rounded-2xl border px-3 py-2 text-xs font-bold transition ${
                  promptStrength === strength
                    ? "border-white bg-white text-gray-950"
                    : "border-white/[0.08] bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                {strength}
              </button>
            ))}
          </div>
          <label className="mt-4 block text-xs font-black uppercase tracking-[0.16em] text-white/45">
            Extra direction
          </label>
          <textarea
            value={customNote}
            onChange={(event) => setCustomNote(event.target.value)}
            placeholder="Example: more wildflowers, stronger river reflection, less saturated colors, morning mist"
            className="mt-2 min-h-[120px] w-full rounded-2xl border border-white/[0.08] bg-gray-950 px-3 py-2 text-sm text-white outline-none placeholder:text-white/25"
          />
        </WorkspaceCard>
      </ControlStack>
    );
  }

  if (activeSection === "wildlife") {
    return (
      <WorkspaceCard title="Wildlife override" description="Swap the default animal safely while keeping the current location and mood intact.">
        <select
          value={wildlifeOverride}
          onChange={(event) => setWildlifeOverride(event.target.value as ExtendedWildlifeOverride)}
          className="w-full rounded-2xl border border-white/[0.08] bg-gray-950 px-3 py-2 text-sm font-semibold text-white outline-none"
        >
          <optgroup label="North America">
            {BASE_WILDLIFE_OPTIONS.map((wildlife) => (
              <option key={wildlife} value={wildlife}>
                {wildlife}
              </option>
            ))}
          </optgroup>
          <optgroup label="Japan / Europe / World">
            {WORLD_WILDLIFE_OPTIONS.map((wildlife) => (
              <option key={wildlife} value={wildlife}>
                {wildlife}
              </option>
            ))}
          </optgroup>
        </select>
      </WorkspaceCard>
    );
  }

  if (activeSection === "camera") {
    return <ChipGrid label="Camera / lens look" items={CAMERA_LOOKS} value={cameraLook} onChange={setCameraLook} />;
  }

  if (activeSection === "season-light") {
    return (
      <ControlStack>
        <ChipGrid label="Season override" items={SEASON_OPTIONS} value={seasonOverride} onChange={setSeasonOverride} />
        <ChipGrid label="Time of day / light" items={LIGHT_OPTIONS} value={lightOverride} onChange={setLightOverride} />
      </ControlStack>
    );
  }

  if (activeSection === "caption") {
    return (
      <ControlStack>
        <ChipGrid label="Facebook caption style" items={CAPTION_STYLES} value={captionStyle} onChange={setCaptionStyle} columns="grid-cols-1" />
        <ChipGrid label="Negative prompt mode" items={NEGATIVE_MODES} value={negativeMode} onChange={setNegativeMode} columns="grid-cols-1" />
        <ChipGrid label="USA viral hashtag mode" items={HASHTAG_MODES} value={hashtagMode} onChange={setHashtagMode} columns="grid-cols-1" />
      </ControlStack>
    );
  }

  return (
    <WorkspaceCard title="Quick random" description="Jump to a new preset without touching the underlying output logic.">
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
        <button type="button" onClick={randomUSA} className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.06] px-3 py-2 text-xs font-black text-cyan-100 hover:bg-cyan-300/[0.1]">Random USA Featured</button>
        <button type="button" onClick={randomUSAMore} className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.06] px-3 py-2 text-xs font-black text-cyan-100 hover:bg-cyan-300/[0.1]">Random USA More Parks</button>
        <button type="button" onClick={randomCanada} className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.06] px-3 py-2 text-xs font-black text-emerald-100 hover:bg-emerald-300/[0.1]">Random Canada</button>
        <button type="button" onClick={randomJapan} className="rounded-2xl border border-rose-300/20 bg-rose-300/[0.06] px-3 py-2 text-xs font-black text-rose-100 hover:bg-rose-300/[0.1]">Random Japan</button>
        <button type="button" onClick={randomEurope} className="rounded-2xl border border-violet-300/20 bg-violet-300/[0.06] px-3 py-2 text-xs font-black text-violet-100 hover:bg-violet-300/[0.1]">Random Europe</button>
        <button type="button" onClick={randomWorld} className="rounded-2xl border border-lime-300/20 bg-lime-300/[0.06] px-3 py-2 text-xs font-black text-lime-100 hover:bg-lime-300/[0.1]">Random World</button>
        <button type="button" onClick={randomViral} className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.08] px-3 py-2 text-xs font-black text-amber-100 hover:bg-amber-300/[0.12]">Random best viral preset</button>
      </div>
    </WorkspaceCard>
  );
}
