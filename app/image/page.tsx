"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import ImageStudioControls from "@/components/image-studio/ImageStudioControls";
import ImageStudioOutputs from "@/components/image-studio/ImageStudioOutputs";
import { IMAGE_STUDIO_FEATURE_BADGES } from "@/lib/image-studio/constants";
import {
  buildImageStudioDerivedPackage,
  collectionForCountry,
  countryMatches,
} from "@/lib/image-studio/builders";
import type {
  CollectionFilter,
  CopyKey,
  CountryFilter,
  ExtendedWildlifeOverride,
  LightOverride,
  SeasonOverride,
  CaptionStyle,
  PromptStrength,
  CameraLook,
  NegativeMode,
  HashtagMode,
} from "@/lib/image-studio/types";
import {
  ALL_SCENIC_IMAGE_PRESETS,
  getEnhancedScenicPresetById,
  getEnhancedViralScenicPreset,
  getRandomEnhancedScenicPreset,
} from "@/lib/scenic-expanded-presets";
import type { ScenicImageAspectRatio, ScenicImageMood } from "@/lib/scenic-image-prompts";

export default function ImagePage() {
  const [selectedPresetId, setSelectedPresetId] = useState(
    ALL_SCENIC_IMAGE_PRESETS[0].id
  );
  const [collectionFilter, setCollectionFilter] =
    useState<CollectionFilter>("USA Featured");
  const [countryFilter, setCountryFilter] = useState<CountryFilter>("USA");
  const [aspectRatio, setAspectRatio] =
    useState<ScenicImageAspectRatio>("9:16");
  const [mood, setMood] = useState<ScenicImageMood>(
    "Facebook Viral Nature Post"
  );
  const [wildlifeOverride, setWildlifeOverride] =
    useState<ExtendedWildlifeOverride>("Default preset wildlife");
  const [seasonOverride, setSeasonOverride] = useState<SeasonOverride>("Default");
  const [lightOverride, setLightOverride] = useState<LightOverride>("Default");
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>("Short Viral");
  const [promptStrength, setPromptStrength] =
    useState<PromptStrength>("Balanced");
  const [cameraLook, setCameraLook] = useState<CameraLook>("35mm documentary");
  const [negativeMode, setNegativeMode] =
    useState<NegativeMode>("Clean Short");
  const [hashtagMode, setHashtagMode] = useState<HashtagMode>("USA Viral");
  const [customNote, setCustomNote] = useState("");
  const [copiedKey, setCopiedKey] = useState<CopyKey>(null);

  const filteredPresets = useMemo(
    () =>
      ALL_SCENIC_IMAGE_PRESETS.filter(
        (preset) =>
          (collectionFilter === "All" || preset.collection === collectionFilter) &&
          countryMatches(preset.collection, countryFilter)
      ),
    [collectionFilter, countryFilter]
  );

  const selectedPreset = useMemo(() => {
    const candidate = getEnhancedScenicPresetById(selectedPresetId);
    if (
      (collectionFilter !== "All" && candidate.collection !== collectionFilter) ||
      !countryMatches(candidate.collection, countryFilter)
    ) {
      return filteredPresets[0] ?? ALL_SCENIC_IMAGE_PRESETS[0];
    }
    return candidate;
  }, [collectionFilter, countryFilter, filteredPresets, selectedPresetId]);

  const derived = useMemo(
    () =>
      buildImageStudioDerivedPackage({
        allPresets: ALL_SCENIC_IMAGE_PRESETS,
        selectedPreset,
        aspectRatio,
        mood,
        wildlifeOverride,
        seasonOverride,
        lightOverride,
        captionStyle,
        promptStrength,
        cameraLook,
        negativeMode,
        hashtagMode,
        customNote,
      }),
    [
      aspectRatio,
      cameraLook,
      captionStyle,
      customNote,
      hashtagMode,
      lightOverride,
      mood,
      negativeMode,
      promptStrength,
      seasonOverride,
      selectedPreset,
      wildlifeOverride,
    ]
  );

  function choosePreset(id: string) {
    setSelectedPresetId(id);
    setCopiedKey(null);
  }

  function chooseCollection(collection: CollectionFilter) {
    setCollectionFilter(collection);
    if (collection === "Canada") setCountryFilter("Canada");
    if (collection === "USA Featured" || collection === "USA More Parks") {
      setCountryFilter("USA");
    }
    if (collection === "Japan") setCountryFilter("Japan");
    if (collection === "Europe — Switzerland / Norway / Iceland / Alps") {
      setCountryFilter("Europe");
    }
    if (collection === "World Scenic Wildlife") setCountryFilter("World");
    if (collection === "All") setCountryFilter("All");

    const next = ALL_SCENIC_IMAGE_PRESETS.find(
      (preset) => collection === "All" || preset.collection === collection
    );
    if (next) setSelectedPresetId(next.id);
    setCopiedKey(null);
  }

  function chooseCountry(country: CountryFilter) {
    const nextCollection = collectionForCountry(country);
    setCountryFilter(country);
    setCollectionFilter(nextCollection);
    const next = ALL_SCENIC_IMAGE_PRESETS.find(
      (preset) =>
        (nextCollection === "All" || preset.collection === nextCollection) &&
        countryMatches(preset.collection, country)
    );
    if (next) setSelectedPresetId(next.id);
    setCopiedKey(null);
  }

  function randomUSA() {
    const preset = getRandomEnhancedScenicPreset({ collection: "USA Featured" });
    setCollectionFilter("USA Featured");
    setCountryFilter("USA");
    setSelectedPresetId(preset.id);
    setCopiedKey(null);
  }

  function randomUSAMore() {
    const preset = getRandomEnhancedScenicPreset({ collection: "USA More Parks" });
    setCollectionFilter("USA More Parks");
    setCountryFilter("USA");
    setSelectedPresetId(preset.id);
    setCopiedKey(null);
  }

  function randomCanada() {
    const preset = getRandomEnhancedScenicPreset({ collection: "Canada" });
    setCollectionFilter("Canada");
    setCountryFilter("Canada");
    setSelectedPresetId(preset.id);
    setCopiedKey(null);
  }

  function randomJapan() {
    const preset = getRandomEnhancedScenicPreset({ collection: "Japan" });
    setCollectionFilter("Japan");
    setCountryFilter("Japan");
    setSelectedPresetId(preset.id);
    setCopiedKey(null);
  }

  function randomEurope() {
    const preset = getRandomEnhancedScenicPreset({
      collection: "Europe — Switzerland / Norway / Iceland / Alps",
    });
    setCollectionFilter("Europe — Switzerland / Norway / Iceland / Alps");
    setCountryFilter("Europe");
    setSelectedPresetId(preset.id);
    setCopiedKey(null);
  }

  function randomWorld() {
    const preset = getRandomEnhancedScenicPreset({
      collection: "World Scenic Wildlife",
    });
    setCollectionFilter("World Scenic Wildlife");
    setCountryFilter("World");
    setSelectedPresetId(preset.id);
    setCopiedKey(null);
  }

  function randomViral() {
    const next = getEnhancedViralScenicPreset(
      collectionFilter === "All" ? undefined : collectionFilter
    );
    setSelectedPresetId(next.preset.id);
    setCollectionFilter(next.preset.collection);
    if (next.preset.collection === "Canada") setCountryFilter("Canada");
    else if (next.preset.collection === "Japan") setCountryFilter("Japan");
    else if (next.preset.collection === "Europe — Switzerland / Norway / Iceland / Alps") {
      setCountryFilter("Europe");
    } else if (next.preset.collection === "World Scenic Wildlife") {
      setCountryFilter("World");
    } else {
      setCountryFilter("USA");
    }
    setMood(next.mood);
    setAspectRatio(next.aspectRatio);
    setCaptionStyle("Question Hook");
    setCopiedKey(null);
  }

  return (
    <main className="ui-theme-scope min-h-screen w-full bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.16),transparent_32%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_34%),#020617] text-[color:var(--text)]">
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-gray-950/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[var(--main-max-width)] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-cyan-300/15 text-[11px] font-bold text-cyan-100 ring-1 ring-cyan-300/20">
              W
            </span>
            <span className="truncate text-sm font-bold tracking-tight text-white">
              WILD STORIES TV
            </span>
          </Link>
          <nav className="flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl border border-white/[0.08] bg-white/[0.04] p-1">
            <Link className="rounded-xl px-3.5 py-2 text-xs font-semibold text-white/55 hover:bg-white/[0.06] hover:text-white" href="/">
              Build
            </Link>
            <Link className="rounded-xl px-3.5 py-2 text-xs font-semibold text-white/55 hover:bg-white/[0.06] hover:text-white" href="/?tab=workflows">
              Workflows
            </Link>
            <Link className="rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-gray-950" href="/image">
              Image
            </Link>
            <Link className="rounded-xl px-3.5 py-2 text-xs font-semibold text-white/55 hover:bg-white/[0.06] hover:text-white" href="/storyboard">
              Storyboard
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[var(--main-max-width)] px-4 py-6 sm:px-6 lg:px-8">
        <section className="mb-5 overflow-hidden rounded-[34px] border border-white/[0.09] bg-gradient-to-br from-gray-950/95 via-slate-950/95 to-cyan-950/50 p-5 shadow-[var(--surface-shadow)]">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
            Photo-only content studio
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-4xl">
            World Scenic Wildlife Image Studio
          </h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-white/60">
            Nano Banana 2 + GPT Image 2 prompts, American English Facebook captions, USA-viral hashtags, 3 variations, 5-post packs, and prompt quality checks.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            {IMAGE_STUDIO_FEATURE_BADGES.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-black text-white/75"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[405px_1fr]">
          <ImageStudioControls
            selectedPreset={selectedPreset}
            filteredPresets={filteredPresets}
            selectedPresetId={selectedPresetId}
            choosePreset={choosePreset}
            collectionFilter={collectionFilter}
            chooseCollection={chooseCollection}
            countryFilter={countryFilter}
            chooseCountry={chooseCountry}
            aspectRatio={aspectRatio}
            setAspectRatio={setAspectRatio}
            mood={mood}
            setMood={setMood}
            wildlifeOverride={wildlifeOverride}
            setWildlifeOverride={setWildlifeOverride}
            cameraLook={cameraLook}
            setCameraLook={setCameraLook}
            seasonOverride={seasonOverride}
            setSeasonOverride={setSeasonOverride}
            lightOverride={lightOverride}
            setLightOverride={setLightOverride}
            captionStyle={captionStyle}
            setCaptionStyle={setCaptionStyle}
            negativeMode={negativeMode}
            setNegativeMode={setNegativeMode}
            hashtagMode={hashtagMode}
            setHashtagMode={setHashtagMode}
            promptStrength={promptStrength}
            setPromptStrength={setPromptStrength}
            customNote={customNote}
            setCustomNote={setCustomNote}
            randomUSA={randomUSA}
            randomUSAMore={randomUSAMore}
            randomCanada={randomCanada}
            randomJapan={randomJapan}
            randomEurope={randomEurope}
            randomWorld={randomWorld}
            randomViral={randomViral}
          />

          <ImageStudioOutputs
            selectedCollection={selectedPreset.collection}
            usaHashtags={derived.usaHashtags}
            copyAll={derived.copyAll}
            copiedKey={copiedKey}
            setCopiedKey={setCopiedKey}
            nanoPrompt={derived.nanoPrompt}
            gptPrompt={derived.gptPrompt}
            negativePrompt={derived.negativePrompt}
            facebookCaptionWithHashtags={derived.facebookCaptionWithHashtags}
            variationPrompts={derived.variationPrompts}
            fivePostPack={derived.fivePostPack}
            qualityChecklist={derived.qualityChecklist}
            altText={derived.altText}
          />
        </div>
      </div>
    </main>
  );
}
