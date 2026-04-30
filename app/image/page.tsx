"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import {
  buildScenicImagePromptPackage,
  type ScenicImageAspectRatio,
  type ScenicImageMood,
  type ScenicWildlifeOverride,
} from "@/lib/scenic-image-prompts";
import {
  ALL_SCENIC_IMAGE_PRESETS,
  SCENIC_COLLECTIONS,
  getEnhancedScenicPresetById,
  getEnhancedViralScenicPreset,
  getRandomEnhancedScenicPreset,
  type ScenicCollection,
} from "@/lib/scenic-expanded-presets";

const ASPECT_RATIOS: ScenicImageAspectRatio[] = ["9:16", "4:5", "1:1"];
const MOODS: ScenicImageMood[] = [
  "Peaceful Wildlife",
  "Epic National Park",
  "Luxury Travel Poster",
  "Documentary Realism",
  "Facebook Viral Nature Post",
  "Wallpaper / Lock Screen",
  "Thumbnail-safe Scenic Photo",
];
const BASE_WILDLIFE_OPTIONS: ScenicWildlifeOverride[] = [
  "Default preset wildlife",
  "Elk",
  "Mule Deer",
  "White-tailed Deer",
  "Bison",
  "Moose",
  "Mountain Goat",
  "Bighorn Sheep",
  "Black Bear",
  "Grizzly Bear",
  "Caribou",
  "Bald Eagle",
  "Great Blue Heron",
  "Alligator",
  "No wildlife / landscape only",
];

const WORLD_WILDLIFE_OPTIONS = [
  "Ezo Red Fox",
  "Red-crowned Crane",
  "Japanese Macaque",
  "Yakushima Deer",
  "Alpine Ibex",
  "Chamois",
  "Musk Ox",
  "Reindeer",
  "Puffin",
  "Kea",
  "Kangaroo",
  "Penguin",
  "Polar Bear",
  "Sea Eagle",
] as const;
const SEASON_OPTIONS = ["Default", "Spring", "Summer", "Autumn", "Winter", "Snow", "Wildflower bloom", "Golden fall"] as const;
const LIGHT_OPTIONS = ["Default", "Sunrise", "Golden hour", "Blue hour", "Overcast", "Storm clearing", "Snowy soft light", "Aurora night"] as const;
const CAPTION_STYLES = ["Short Viral", "Peaceful Nature", "Travel Page", "Question Hook", "Educational"] as const;
const PROMPT_STRENGTHS = ["Balanced", "Short", "Detailed", "Ultra Detailed"] as const;
const COUNTRY_FILTERS = ["All", "USA", "Canada", "Japan", "Europe", "World"] as const;

type CopyKey = "prompt" | "negative" | "caption" | "alt" | "all" | "variations" | null;
type CollectionFilter = ScenicCollection | "All";
type CountryFilter = (typeof COUNTRY_FILTERS)[number];
type ExtendedWildlifeOverride = ScenicWildlifeOverride | (typeof WORLD_WILDLIFE_OPTIONS)[number];
type SeasonOverride = (typeof SEASON_OPTIONS)[number];
type LightOverride = (typeof LIGHT_OPTIONS)[number];
type CaptionStyle = (typeof CAPTION_STYLES)[number];
type PromptStrength = (typeof PROMPT_STRENGTHS)[number];

function CopyButton({ value, copyKey, copiedKey, onCopied }: { value: string; copyKey: CopyKey; copiedKey: CopyKey; onCopied: (key: CopyKey) => void }) {
  async function copy() {
    await navigator.clipboard.writeText(value);
    onCopied(copyKey);
    window.setTimeout(() => onCopied(null), 1400);
  }

  return (
    <button type="button" onClick={copy} className={`rounded-2xl border px-3 py-1.5 text-xs font-bold transition ${copiedKey === copyKey ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300" : "border-white/10 bg-white/[0.04] text-white/65 hover:bg-white/[0.08] hover:text-white"}`}>
      {copiedKey === copyKey ? "Copied" : "Copy"}
    </button>
  );
}

function OutputBox({ label, value, copyKey, copiedKey, onCopied }: { label: string; value: string; copyKey: CopyKey; copiedKey: CopyKey; onCopied: (key: CopyKey) => void }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-white/[0.08] bg-gray-950/55 shadow-[var(--surface-shadow)]">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-3">
        <h2 className="text-xs font-black uppercase tracking-[0.16em] text-cyan-200">{label}</h2>
        <CopyButton value={value} copyKey={copyKey} copiedKey={copiedKey} onCopied={onCopied} />
      </div>
      <pre className="max-h-[430px] overflow-auto whitespace-pre-wrap break-words p-4 text-xs leading-6 text-white/82">{value}</pre>
    </section>
  );
}

function countryMatches(collection: ScenicCollection, countryFilter: CountryFilter): boolean {
  if (countryFilter === "All") return true;
  if (countryFilter === "USA") return collection === "USA Featured" || collection === "USA More Parks";
  if (countryFilter === "Canada") return collection === "Canada";
  if (countryFilter === "Japan") return collection === "Japan";
  if (countryFilter === "Europe") return collection === "Europe — Switzerland / Norway / Iceland / Alps";
  return collection === "World Scenic Wildlife";
}

function collectionForCountry(countryFilter: CountryFilter): CollectionFilter {
  if (countryFilter === "USA") return "USA Featured";
  if (countryFilter === "Canada") return "Canada";
  if (countryFilter === "Japan") return "Japan";
  if (countryFilter === "Europe") return "Europe — Switzerland / Norway / Iceland / Alps";
  if (countryFilter === "World") return "World Scenic Wildlife";
  return "All";
}

function baseWildlifeOverride(wildlife: ExtendedWildlifeOverride): ScenicWildlifeOverride {
  return BASE_WILDLIFE_OPTIONS.includes(wildlife as ScenicWildlifeOverride) ? (wildlife as ScenicWildlifeOverride) : "Default preset wildlife";
}

function worldWildlifeNote(wildlife: ExtendedWildlifeOverride): string {
  if (BASE_WILDLIFE_OPTIONS.includes(wildlife as ScenicWildlifeOverride)) return "";
  return `Wildlife override: use ${wildlife} as the main peaceful subject, adapted naturally to the selected real location, with accurate species anatomy, correct scale, and no cartoon styling`;
}

function seasonNote(season: SeasonOverride): string {
  return season === "Default" ? "" : `Season override: ${season}, while preserving location-accurate vegetation, snow, water, and weather`;
}

function lightNote(light: LightOverride): string {
  return light === "Default" ? "" : `Light override: ${light}, realistic exposure, believable shadows, natural sky color, no fake HDR`;
}

function strengthNote(strength: PromptStrength): string {
  if (strength === "Short") return "Prompt length: concise, clean, direct, optimized for image generators that prefer short prompts";
  if (strength === "Detailed") return "Prompt length: detailed, with strong foreground, midground, background, lighting, and realism locks";
  if (strength === "Ultra Detailed") return "Prompt length: ultra detailed, maximum location specificity, wildlife anatomy locks, social framing locks, and realistic environmental texture";
  return "Prompt length: balanced, strong enough for realistic generation without becoming cluttered";
}

function buildExtraDirection({ customNote, wildlifeOverride, seasonOverride, lightOverride, promptStrength }: { customNote: string; wildlifeOverride: ExtendedWildlifeOverride; seasonOverride: SeasonOverride; lightOverride: LightOverride; promptStrength: PromptStrength }): string {
  return [
    customNote.trim(),
    worldWildlifeNote(wildlifeOverride),
    seasonNote(seasonOverride),
    lightNote(lightOverride),
    strengthNote(promptStrength),
    "Realism safety lock: real-place inspired only, no fantasy geography, no impossible animal placement, no exaggerated landmark size, location-accurate terrain and vegetation",
  ].filter(Boolean).join(". ");
}

function buildFacebookCaption({ baseCaption, parkName, stateOrProvince, style }: { baseCaption: string; parkName: string; stateOrProvince: string; style: CaptionStyle }): string {
  const location = `${parkName}, ${stateOrProvince}`;
  switch (style) {
    case "Peaceful Nature":
      return `${baseCaption} A quiet wild moment from ${location}.`;
    case "Travel Page":
      return `${baseCaption} Add ${location} to your nature travel list.`;
    case "Question Hook":
      return `Would you visit this wild place? ${baseCaption} — ${location}.`;
    case "Educational":
      return `${location}: a real scenic wildlife location known for natural habitat, seasonal light, and peaceful wildlife viewing. ${baseCaption}`;
    case "Short Viral":
    default:
      return `${baseCaption} — ${location}.`;
  }
}

export default function ImagePage() {
  const [selectedPresetId, setSelectedPresetId] = useState(ALL_SCENIC_IMAGE_PRESETS[0].id);
  const [collectionFilter, setCollectionFilter] = useState<CollectionFilter>("USA Featured");
  const [countryFilter, setCountryFilter] = useState<CountryFilter>("USA");
  const [aspectRatio, setAspectRatio] = useState<ScenicImageAspectRatio>("9:16");
  const [mood, setMood] = useState<ScenicImageMood>("Facebook Viral Nature Post");
  const [wildlifeOverride, setWildlifeOverride] = useState<ExtendedWildlifeOverride>("Default preset wildlife");
  const [seasonOverride, setSeasonOverride] = useState<SeasonOverride>("Default");
  const [lightOverride, setLightOverride] = useState<LightOverride>("Default");
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>("Short Viral");
  const [promptStrength, setPromptStrength] = useState<PromptStrength>("Balanced");
  const [customNote, setCustomNote] = useState("");
  const [copiedKey, setCopiedKey] = useState<CopyKey>(null);

  const filteredPresets = useMemo(() => ALL_SCENIC_IMAGE_PRESETS.filter((preset) => (collectionFilter === "All" || preset.collection === collectionFilter) && countryMatches(preset.collection, countryFilter)), [collectionFilter, countryFilter]);

  const selectedPreset = useMemo(() => {
    const candidate = getEnhancedScenicPresetById(selectedPresetId);
    if ((collectionFilter !== "All" && candidate.collection !== collectionFilter) || !countryMatches(candidate.collection, countryFilter)) {
      return filteredPresets[0] ?? ALL_SCENIC_IMAGE_PRESETS[0];
    }
    return candidate;
  }, [collectionFilter, countryFilter, filteredPresets, selectedPresetId]);

  const enrichedCustomNote = useMemo(() => buildExtraDirection({ customNote, wildlifeOverride, seasonOverride, lightOverride, promptStrength }), [customNote, lightOverride, promptStrength, seasonOverride, wildlifeOverride]);

  const pkg = useMemo(() => buildScenicImagePromptPackage({ preset: selectedPreset, aspectRatio, mood, wildlifeOverride: baseWildlifeOverride(wildlifeOverride), customNote: enrichedCustomNote }), [aspectRatio, enrichedCustomNote, mood, selectedPreset, wildlifeOverride]);

  const variationPrompts = useMemo(() => {
    const notes = [
      "Variation A: peaceful wide landscape, wildlife small-to-medium in frame, strongest real-place scenic identity",
      "Variation B: closer wildlife read, animal still naturally scaled, background landmark remains recognizable",
      "Variation C: viral wallpaper composition, clean upper negative space, strong foreground-to-background depth",
    ];
    return notes.map((note) => buildScenicImagePromptPackage({ preset: selectedPreset, aspectRatio, mood, wildlifeOverride: baseWildlifeOverride(wildlifeOverride), customNote: [enrichedCustomNote, note].filter(Boolean).join(". ") }).prompt).map((prompt, index) => `VARIATION ${String.fromCharCode(65 + index)}:\n${prompt}`).join("\n\n");
  }, [aspectRatio, enrichedCustomNote, mood, selectedPreset, wildlifeOverride]);

  const facebookCaption = useMemo(() => buildFacebookCaption({ baseCaption: pkg.caption, parkName: selectedPreset.parkName, stateOrProvince: selectedPreset.stateOrProvince, style: captionStyle }), [captionStyle, pkg.caption, selectedPreset.parkName, selectedPreset.stateOrProvince]);
  const facebookCaptionWithHashtags = useMemo(() => `${facebookCaption}\n\n${pkg.hashtags}`, [facebookCaption, pkg.hashtags]);
  const copyAll = useMemo(() => ["IMAGE PROMPT:", pkg.prompt, "", "NEGATIVE PROMPT:", pkg.negativePrompt, "", "FACEBOOK CAPTION:", facebookCaption, "", "HASHTAGS:", pkg.hashtags, "", "ALT TEXT:", pkg.altText, "", "3 VARIATIONS:", variationPrompts].join("\n"), [facebookCaption, pkg.altText, pkg.hashtags, pkg.negativePrompt, pkg.prompt, variationPrompts]);

  function choosePreset(id: string) { setSelectedPresetId(id); setCopiedKey(null); }
  function chooseCollection(collection: CollectionFilter) {
    setCollectionFilter(collection);
    if (collection === "Canada") setCountryFilter("Canada");
    if (collection === "USA Featured" || collection === "USA More Parks") setCountryFilter("USA");
    if (collection === "Japan") setCountryFilter("Japan");
    if (collection === "Europe — Switzerland / Norway / Iceland / Alps") setCountryFilter("Europe");
    if (collection === "World Scenic Wildlife") setCountryFilter("World");
    if (collection === "All") setCountryFilter("All");
    const next = ALL_SCENIC_IMAGE_PRESETS.find((preset) => collection === "All" || preset.collection === collection);
    if (next) setSelectedPresetId(next.id);
    setCopiedKey(null);
  }
  function chooseCountry(country: CountryFilter) {
    const nextCollection = collectionForCountry(country);
    setCountryFilter(country);
    setCollectionFilter(nextCollection);
    const next = ALL_SCENIC_IMAGE_PRESETS.find((preset) => (nextCollection === "All" || preset.collection === nextCollection) && countryMatches(preset.collection, country));
    if (next) setSelectedPresetId(next.id);
    setCopiedKey(null);
  }
  function randomUSA() { const preset = getRandomEnhancedScenicPreset({ collection: "USA Featured" }); setCollectionFilter("USA Featured"); setCountryFilter("USA"); setSelectedPresetId(preset.id); setCopiedKey(null); }
  function randomUSAMore() { const preset = getRandomEnhancedScenicPreset({ collection: "USA More Parks" }); setCollectionFilter("USA More Parks"); setCountryFilter("USA"); setSelectedPresetId(preset.id); setCopiedKey(null); }
  function randomCanada() { const preset = getRandomEnhancedScenicPreset({ collection: "Canada" }); setCollectionFilter("Canada"); setCountryFilter("Canada"); setSelectedPresetId(preset.id); setCopiedKey(null); }
  function randomJapan() { const preset = getRandomEnhancedScenicPreset({ collection: "Japan" }); setCollectionFilter("Japan"); setCountryFilter("Japan"); setSelectedPresetId(preset.id); setCopiedKey(null); }
  function randomEurope() { const preset = getRandomEnhancedScenicPreset({ collection: "Europe — Switzerland / Norway / Iceland / Alps" }); setCollectionFilter("Europe — Switzerland / Norway / Iceland / Alps"); setCountryFilter("Europe"); setSelectedPresetId(preset.id); setCopiedKey(null); }
  function randomWorld() { const preset = getRandomEnhancedScenicPreset({ collection: "World Scenic Wildlife" }); setCollectionFilter("World Scenic Wildlife"); setCountryFilter("World"); setSelectedPresetId(preset.id); setCopiedKey(null); }
  function randomViral() {
    const next = getEnhancedViralScenicPreset(collectionFilter === "All" ? undefined : collectionFilter);
    setSelectedPresetId(next.preset.id);
    setCollectionFilter(next.preset.collection);
    if (next.preset.collection === "Canada") setCountryFilter("Canada");
    else if (next.preset.collection === "Japan") setCountryFilter("Japan");
    else if (next.preset.collection === "Europe — Switzerland / Norway / Iceland / Alps") setCountryFilter("Europe");
    else if (next.preset.collection === "World Scenic Wildlife") setCountryFilter("World");
    else setCountryFilter("USA");
    setMood(next.mood);
    setAspectRatio(next.aspectRatio);
    setCaptionStyle("Question Hook");
    setCopiedKey(null);
  }

  return (
    <main className="ui-theme-scope min-h-screen w-full bg-[color:var(--bg)] text-[color:var(--text)]">
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-gray-950/95 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[var(--main-max-width)] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/10 text-[11px] font-bold text-white ring-1 ring-white/[0.12]">W</span><span className="truncate text-sm font-bold tracking-tight text-white">WILD STORIES TV</span></Link>
          <nav className="flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl border border-white/[0.08] bg-white/[0.04] p-1">
            <Link className="rounded-xl px-3.5 py-2 text-xs font-semibold text-white/55 hover:bg-white/[0.06] hover:text-white" href="/">Build</Link>
            <Link className="rounded-xl px-3.5 py-2 text-xs font-semibold text-white/55 hover:bg-white/[0.06] hover:text-white" href="/?tab=workflows">Workflows</Link>
            <Link className="rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-gray-950" href="/image">Image</Link>
            <Link className="rounded-xl px-3.5 py-2 text-xs font-semibold text-white/55 hover:bg-white/[0.06] hover:text-white" href="/storyboard">Storyboard</Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[var(--main-max-width)] px-4 py-6 sm:px-6 lg:px-8">
        <section className="mb-5 overflow-hidden rounded-[32px] border border-white/[0.08] bg-gradient-to-br from-gray-950 via-slate-950 to-emerald-950/50 p-5 shadow-[var(--surface-shadow)]">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Photo-only generator</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">World Scenic Wildlife Image Studio</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">USA Featured, USA More Parks, Canada, Japan, Europe, and world scenic wildlife prompts with wildlife, season, light, caption style, and prompt-strength controls.</p>
        </section>

        <div className="grid gap-5 lg:grid-cols-[390px_1fr]">
          <aside className="space-y-4">
            <section className="rounded-3xl border border-white/[0.08] bg-white/[0.035] p-4"><label className="mb-3 block text-xs font-black uppercase tracking-[0.16em] text-white/45">Country / world group</label><div className="grid grid-cols-2 gap-2">{COUNTRY_FILTERS.map((country) => (<button key={country} type="button" onClick={() => chooseCountry(country)} className={`rounded-2xl border px-3 py-2 text-xs font-bold transition ${countryFilter === country ? "border-white bg-white text-gray-950" : "border-white/[0.08] bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white"}`}>{country}</button>))}</div></section>
            <section className="rounded-3xl border border-white/[0.08] bg-white/[0.035] p-4"><label className="mb-3 block text-xs font-black uppercase tracking-[0.16em] text-white/45">Collection</label><div className="grid gap-2">{SCENIC_COLLECTIONS.map((collection) => (<button key={collection} type="button" onClick={() => chooseCollection(collection)} className={`rounded-2xl border px-3 py-2 text-left text-xs font-bold transition ${collectionFilter === collection ? "border-white bg-white text-gray-950" : "border-white/[0.08] bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white"}`}>{collection}</button>))}</div></section>
            <section className="rounded-3xl border border-white/[0.08] bg-white/[0.035] p-4"><label className="mb-3 block text-xs font-black uppercase tracking-[0.16em] text-white/45">Location preset</label><select value={selectedPreset.id} onChange={(event) => choosePreset(event.target.value)} className="w-full rounded-2xl border border-white/[0.08] bg-gray-950 px-3 py-2 text-sm font-semibold text-white outline-none">{filteredPresets.map((preset) => (<option key={preset.id} value={preset.id}>{preset.collection} — {preset.stateOrProvince} — {preset.title}</option>))}</select><div className="mt-3 rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.04] p-3 text-xs leading-5 text-white/60"><strong className="text-cyan-200">{selectedPreset.parkName}</strong> · {selectedPreset.bestSeason} · Default: {selectedPreset.defaultWildlife}</div></section>
            <section className="rounded-3xl border border-white/[0.08] bg-white/[0.035] p-4"><label className="mb-3 block text-xs font-black uppercase tracking-[0.16em] text-white/45">Aspect ratio</label><div className="grid grid-cols-3 gap-2">{ASPECT_RATIOS.map((ratio) => (<button key={ratio} type="button" onClick={() => setAspectRatio(ratio)} className={`rounded-2xl border px-3 py-2 text-xs font-bold transition ${aspectRatio === ratio ? "border-white bg-white text-gray-950" : "border-white/[0.08] bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white"}`}>{ratio}</button>))}</div></section>
            <section className="rounded-3xl border border-white/[0.08] bg-white/[0.035] p-4"><label className="mb-3 block text-xs font-black uppercase tracking-[0.16em] text-white/45">Style / mood</label><div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">{MOODS.map((item) => (<button key={item} type="button" onClick={() => setMood(item)} className={`rounded-2xl border px-3 py-2 text-left text-xs font-bold transition ${mood === item ? "border-white bg-white text-gray-950" : "border-white/[0.08] bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white"}`}>{item}</button>))}</div></section>
            <section className="rounded-3xl border border-white/[0.08] bg-white/[0.035] p-4"><label className="mb-3 block text-xs font-black uppercase tracking-[0.16em] text-white/45">Wildlife override</label><select value={wildlifeOverride} onChange={(event) => setWildlifeOverride(event.target.value as ExtendedWildlifeOverride)} className="w-full rounded-2xl border border-white/[0.08] bg-gray-950 px-3 py-2 text-sm font-semibold text-white outline-none"><optgroup label="North America">{BASE_WILDLIFE_OPTIONS.map((wildlife) => (<option key={wildlife} value={wildlife}>{wildlife}</option>))}</optgroup><optgroup label="Japan / Europe / World">{WORLD_WILDLIFE_OPTIONS.map((wildlife) => (<option key={wildlife} value={wildlife}>{wildlife}</option>))}</optgroup></select></section>
            <section className="rounded-3xl border border-white/[0.08] bg-white/[0.035] p-4"><label className="mb-3 block text-xs font-black uppercase tracking-[0.16em] text-white/45">Season override</label><div className="grid grid-cols-2 gap-2">{SEASON_OPTIONS.map((season) => (<button key={season} type="button" onClick={() => setSeasonOverride(season)} className={`rounded-2xl border px-3 py-2 text-xs font-bold transition ${seasonOverride === season ? "border-white bg-white text-gray-950" : "border-white/[0.08] bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white"}`}>{season}</button>))}</div></section>
            <section className="rounded-3xl border border-white/[0.08] bg-white/[0.035] p-4"><label className="mb-3 block text-xs font-black uppercase tracking-[0.16em] text-white/45">Time of day / light</label><div className="grid grid-cols-2 gap-2">{LIGHT_OPTIONS.map((light) => (<button key={light} type="button" onClick={() => setLightOverride(light)} className={`rounded-2xl border px-3 py-2 text-xs font-bold transition ${lightOverride === light ? "border-white bg-white text-gray-950" : "border-white/[0.08] bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white"}`}>{light}</button>))}</div></section>
            <section className="rounded-3xl border border-white/[0.08] bg-white/[0.035] p-4"><label className="mb-3 block text-xs font-black uppercase tracking-[0.16em] text-white/45">Facebook caption style</label><div className="grid gap-2">{CAPTION_STYLES.map((style) => (<button key={style} type="button" onClick={() => setCaptionStyle(style)} className={`rounded-2xl border px-3 py-2 text-left text-xs font-bold transition ${captionStyle === style ? "border-white bg-white text-gray-950" : "border-white/[0.08] bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white"}`}>{style}</button>))}</div></section>
            <section className="rounded-3xl border border-white/[0.08] bg-white/[0.035] p-4"><label className="mb-3 block text-xs font-black uppercase tracking-[0.16em] text-white/45">Prompt strength</label><div className="grid grid-cols-2 gap-2">{PROMPT_STRENGTHS.map((strength) => (<button key={strength} type="button" onClick={() => setPromptStrength(strength)} className={`rounded-2xl border px-3 py-2 text-xs font-bold transition ${promptStrength === strength ? "border-white bg-white text-gray-950" : "border-white/[0.08] bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white"}`}>{strength}</button>))}</div><label className="mt-4 block text-xs font-black uppercase tracking-[0.16em] text-white/45">Extra direction</label><textarea value={customNote} onChange={(event) => setCustomNote(event.target.value)} placeholder="Example: more wildflowers, stronger river reflection, less saturated colors, morning mist" className="mt-2 min-h-[110px] w-full rounded-2xl border border-white/[0.08] bg-gray-950 px-3 py-2 text-sm text-white outline-none placeholder:text-white/25" /></section>
            <section className="rounded-3xl border border-white/[0.08] bg-white/[0.035] p-4"><label className="mb-3 block text-xs font-black uppercase tracking-[0.16em] text-white/45">Quick random</label><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1"><button type="button" onClick={randomUSA} className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.06] px-3 py-2 text-xs font-black text-cyan-100 hover:bg-cyan-300/[0.1]">Random USA Featured</button><button type="button" onClick={randomUSAMore} className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.06] px-3 py-2 text-xs font-black text-cyan-100 hover:bg-cyan-300/[0.1]">Random USA More Parks</button><button type="button" onClick={randomCanada} className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.06] px-3 py-2 text-xs font-black text-emerald-100 hover:bg-emerald-300/[0.1]">Random Canada</button><button type="button" onClick={randomJapan} className="rounded-2xl border border-rose-300/20 bg-rose-300/[0.06] px-3 py-2 text-xs font-black text-rose-100 hover:bg-rose-300/[0.1]">Random Japan</button><button type="button" onClick={randomEurope} className="rounded-2xl border border-violet-300/20 bg-violet-300/[0.06] px-3 py-2 text-xs font-black text-violet-100 hover:bg-violet-300/[0.1]">Random Europe</button><button type="button" onClick={randomWorld} className="rounded-2xl border border-lime-300/20 bg-lime-300/[0.06] px-3 py-2 text-xs font-black text-lime-100 hover:bg-lime-300/[0.1]">Random World</button><button type="button" onClick={randomViral} className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.08] px-3 py-2 text-xs font-black text-amber-100 hover:bg-amber-300/[0.12]">Random best viral preset</button></div></section>
          </aside>

          <section className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3"><div className="rounded-3xl border border-white/[0.08] bg-white/[0.035] p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">Collection</p><p className="mt-1 text-sm font-black text-white">{selectedPreset.collection}</p></div><div className="rounded-3xl border border-white/[0.08] bg-white/[0.035] p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">Facebook caption</p><p className="mt-1 text-sm font-black text-white">{facebookCaption}</p></div><div className="rounded-3xl border border-white/[0.08] bg-white/[0.035] p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">Hashtags</p><p className="mt-1 text-sm font-black text-white">{pkg.hashtags}</p></div></div>
            <div className="flex justify-end"><CopyButton value={copyAll} copyKey="all" copiedKey={copiedKey} onCopied={setCopiedKey} /></div>
            <OutputBox label="Image prompt" value={pkg.prompt} copyKey="prompt" copiedKey={copiedKey} onCopied={setCopiedKey} />
            <OutputBox label="Negative prompt" value={pkg.negativePrompt} copyKey="negative" copiedKey={copiedKey} onCopied={setCopiedKey} />
            <OutputBox label="Facebook caption + 5 viral hashtags" value={facebookCaptionWithHashtags} copyKey="caption" copiedKey={copiedKey} onCopied={setCopiedKey} />
            <OutputBox label="3 prompt variations" value={variationPrompts} copyKey="variations" copiedKey={copiedKey} onCopied={setCopiedKey} />
            <OutputBox label="Alt text" value={pkg.altText} copyKey="alt" copiedKey={copiedKey} onCopied={setCopiedKey} />
          </section>
        </div>
      </div>
    </main>
  );
}
