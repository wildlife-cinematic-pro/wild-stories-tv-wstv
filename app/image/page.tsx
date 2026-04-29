"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import {
  SCENIC_IMAGE_PRESETS,
  buildScenicImagePromptPackage,
  getRandomScenicPreset,
  getScenicPresetById,
  getViralScenicPreset,
  type ScenicImageAspectRatio,
  type ScenicImageMood,
  type ScenicImageRegion,
  type ScenicWildlifeOverride,
} from "@/lib/scenic-image-prompts";

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
const REGIONS: Array<ScenicImageRegion | "All"> = ["All", "USA", "Canada", "USA / Canada"];
const WILDLIFE_OPTIONS: ScenicWildlifeOverride[] = [
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

type CopyKey = "prompt" | "negative" | "caption" | "alt" | "all" | null;

function CopyButton({ value, copyKey, copiedKey, onCopied }: { value: string; copyKey: CopyKey; copiedKey: CopyKey; onCopied: (key: CopyKey) => void }) {
  async function copy() {
    await navigator.clipboard.writeText(value);
    onCopied(copyKey);
    window.setTimeout(() => onCopied(null), 1400);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`rounded-2xl border px-3 py-1.5 text-xs font-bold transition ${
        copiedKey === copyKey
          ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
          : "border-white/10 bg-white/[0.04] text-white/65 hover:bg-white/[0.08] hover:text-white"
      }`}
    >
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
      <pre className="max-h-[430px] overflow-auto whitespace-pre-wrap break-words p-4 text-xs leading-6 text-white/82">
        {value}
      </pre>
    </section>
  );
}

export default function ImagePage() {
  const [selectedPresetId, setSelectedPresetId] = useState(SCENIC_IMAGE_PRESETS[0].id);
  const [regionFilter, setRegionFilter] = useState<ScenicImageRegion | "All">("All");
  const [aspectRatio, setAspectRatio] = useState<ScenicImageAspectRatio>("9:16");
  const [mood, setMood] = useState<ScenicImageMood>("Facebook Viral Nature Post");
  const [wildlifeOverride, setWildlifeOverride] = useState<ScenicWildlifeOverride>("Default preset wildlife");
  const [customNote, setCustomNote] = useState("");
  const [copiedKey, setCopiedKey] = useState<CopyKey>(null);

  const filteredPresets = useMemo(() => {
    if (regionFilter === "All") return SCENIC_IMAGE_PRESETS;
    return SCENIC_IMAGE_PRESETS.filter((preset) => preset.region === regionFilter);
  }, [regionFilter]);

  const selectedPreset = useMemo(() => {
    const candidate = getScenicPresetById(selectedPresetId);
    if (regionFilter !== "All" && candidate.region !== regionFilter) {
      return filteredPresets[0] ?? SCENIC_IMAGE_PRESETS[0];
    }
    return candidate;
  }, [filteredPresets, regionFilter, selectedPresetId]);

  const pkg = useMemo(
    () =>
      buildScenicImagePromptPackage({
        preset: selectedPreset,
        aspectRatio,
        mood,
        wildlifeOverride,
        customNote,
      }),
    [aspectRatio, customNote, mood, selectedPreset, wildlifeOverride]
  );

  const facebookCaption = useMemo(
    () => `${pkg.caption} — ${selectedPreset.parkName}, ${selectedPreset.stateOrProvince}.`,
    [pkg.caption, selectedPreset.parkName, selectedPreset.stateOrProvince]
  );

  const facebookCaptionWithHashtags = useMemo(
    () => `${facebookCaption}\n\n${pkg.hashtags}`,
    [facebookCaption, pkg.hashtags]
  );

  const copyAll = useMemo(
    () =>
      [
        "IMAGE PROMPT:",
        pkg.prompt,
        "",
        "NEGATIVE PROMPT:",
        pkg.negativePrompt,
        "",
        "FACEBOOK CAPTION:",
        facebookCaption,
        "",
        "HASHTAGS:",
        pkg.hashtags,
        "",
        "ALT TEXT:",
        pkg.altText,
      ].join("\n"),
    [facebookCaption, pkg.altText, pkg.hashtags, pkg.negativePrompt, pkg.prompt]
  );

  function choosePreset(id: string) {
    setSelectedPresetId(id);
    setCopiedKey(null);
  }

  function chooseRegion(region: ScenicImageRegion | "All") {
    setRegionFilter(region);
    if (region === "All") return;
    const first = SCENIC_IMAGE_PRESETS.find((preset) => preset.region === region);
    if (first && getScenicPresetById(selectedPresetId).region !== region) {
      setSelectedPresetId(first.id);
    }
  }

  function randomUSA() {
    const preset = getRandomScenicPreset("USA");
    setRegionFilter("USA");
    setSelectedPresetId(preset.id);
    setCopiedKey(null);
  }

  function randomCanada() {
    const preset = getRandomScenicPreset("Canada");
    setRegionFilter("Canada");
    setSelectedPresetId(preset.id);
    setCopiedKey(null);
  }

  function randomViral() {
    const next = getViralScenicPreset();
    setRegionFilter(next.preset.region);
    setSelectedPresetId(next.preset.id);
    setMood(next.mood);
    setAspectRatio(next.aspectRatio);
    setCopiedKey(null);
  }

  return (
    <main className="ui-theme-scope min-h-screen w-full bg-[color:var(--bg)] text-[color:var(--text)]">
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-gray-950/95 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[var(--main-max-width)] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/10 text-[11px] font-bold text-white ring-1 ring-white/[0.12]">
              W
            </span>
            <span className="truncate text-sm font-bold tracking-tight text-white">WILD STORIES TV</span>
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
        <section className="mb-5 overflow-hidden rounded-[32px] border border-white/[0.08] bg-gradient-to-br from-gray-950 via-slate-950 to-emerald-950/50 p-5 shadow-[var(--surface-shadow)]">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Photo-only generator</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">USA / Canada Scenic Wildlife Image Studio</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">
            Generate post-ready photoreal image prompts for national-park inspired scenic wildlife photos. Facebook captions always include the real park/location name.
          </p>
        </section>

        <div className="grid gap-5 lg:grid-cols-[390px_1fr]">
          <aside className="space-y-4">
            <section className="rounded-3xl border border-white/[0.08] bg-white/[0.035] p-4">
              <label className="mb-3 block text-xs font-black uppercase tracking-[0.16em] text-white/45">Region</label>
              <div className="grid grid-cols-2 gap-2">
                {REGIONS.map((region) => (
                  <button
                    key={region}
                    type="button"
                    onClick={() => chooseRegion(region)}
                    className={`rounded-2xl border px-3 py-2 text-xs font-bold transition ${
                      regionFilter === region
                        ? "border-white bg-white text-gray-950"
                        : "border-white/[0.08] bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white"
                    }`}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-white/[0.08] bg-white/[0.035] p-4">
              <label className="mb-3 block text-xs font-black uppercase tracking-[0.16em] text-white/45">Location preset</label>
              <select
                value={selectedPreset.id}
                onChange={(event) => choosePreset(event.target.value)}
                className="w-full rounded-2xl border border-white/[0.08] bg-gray-950 px-3 py-2 text-sm font-semibold text-white outline-none"
              >
                {filteredPresets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.country === "Canada" ? "Canada" : "USA"} — {preset.stateOrProvince} — {preset.title}
                  </option>
                ))}
              </select>
              <div className="mt-3 rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.04] p-3 text-xs leading-5 text-white/60">
                <strong className="text-cyan-200">{selectedPreset.parkName}</strong> · {selectedPreset.bestSeason} · Default: {selectedPreset.defaultWildlife}
              </div>
            </section>

            <section className="rounded-3xl border border-white/[0.08] bg-white/[0.035] p-4">
              <label className="mb-3 block text-xs font-black uppercase tracking-[0.16em] text-white/45">Aspect ratio</label>
              <div className="grid grid-cols-3 gap-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    className={`rounded-2xl border px-3 py-2 text-xs font-bold transition ${
                      aspectRatio === ratio
                        ? "border-white bg-white text-gray-950"
                        : "border-white/[0.08] bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white"
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-white/[0.08] bg-white/[0.035] p-4">
              <label className="mb-3 block text-xs font-black uppercase tracking-[0.16em] text-white/45">Style / mood</label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
                {MOODS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setMood(item)}
                    className={`rounded-2xl border px-3 py-2 text-left text-xs font-bold transition ${
                      mood === item
                        ? "border-white bg-white text-gray-950"
                        : "border-white/[0.08] bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-white/[0.08] bg-white/[0.035] p-4">
              <label className="mb-3 block text-xs font-black uppercase tracking-[0.16em] text-white/45">Wildlife override</label>
              <select
                value={wildlifeOverride}
                onChange={(event) => setWildlifeOverride(event.target.value as ScenicWildlifeOverride)}
                className="w-full rounded-2xl border border-white/[0.08] bg-gray-950 px-3 py-2 text-sm font-semibold text-white outline-none"
              >
                {WILDLIFE_OPTIONS.map((wildlife) => (
                  <option key={wildlife} value={wildlife}>
                    {wildlife}
                  </option>
                ))}
              </select>
              <label className="mt-4 block text-xs font-black uppercase tracking-[0.16em] text-white/45">Extra direction</label>
              <textarea
                value={customNote}
                onChange={(event) => setCustomNote(event.target.value)}
                placeholder="Example: more wildflowers, stronger river reflection, less saturated colors, morning mist"
                className="mt-2 min-h-[110px] w-full rounded-2xl border border-white/[0.08] bg-gray-950 px-3 py-2 text-sm text-white outline-none placeholder:text-white/25"
              />
            </section>

            <section className="rounded-3xl border border-white/[0.08] bg-white/[0.035] p-4">
              <label className="mb-3 block text-xs font-black uppercase tracking-[0.16em] text-white/45">Quick random</label>
              <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
                <button type="button" onClick={randomUSA} className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.06] px-3 py-2 text-xs font-black text-cyan-100 hover:bg-cyan-300/[0.1]">
                  Random USA location
                </button>
                <button type="button" onClick={randomCanada} className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.06] px-3 py-2 text-xs font-black text-emerald-100 hover:bg-emerald-300/[0.1]">
                  Random Canada location
                </button>
                <button type="button" onClick={randomViral} className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.08] px-3 py-2 text-xs font-black text-amber-100 hover:bg-amber-300/[0.12]">
                  Random best viral preset
                </button>
              </div>
            </section>
          </aside>

          <section className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-white/[0.08] bg-white/[0.035] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">Preset</p>
                <p className="mt-1 text-sm font-black text-white">{pkg.title}</p>
              </div>
              <div className="rounded-3xl border border-white/[0.08] bg-white/[0.035] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">Facebook caption</p>
                <p className="mt-1 text-sm font-black text-white">{facebookCaption}</p>
              </div>
              <div className="rounded-3xl border border-white/[0.08] bg-white/[0.035] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">Hashtags</p>
                <p className="mt-1 text-sm font-black text-white">{pkg.hashtags}</p>
              </div>
            </div>

            <div className="flex justify-end">
              <CopyButton value={copyAll} copyKey="all" copiedKey={copiedKey} onCopied={setCopiedKey} />
            </div>

            <OutputBox label="Image prompt" value={pkg.prompt} copyKey="prompt" copiedKey={copiedKey} onCopied={setCopiedKey} />
            <OutputBox label="Negative prompt" value={pkg.negativePrompt} copyKey="negative" copiedKey={copiedKey} onCopied={setCopiedKey} />
            <OutputBox label="Facebook caption + 5 viral hashtags" value={facebookCaptionWithHashtags} copyKey="caption" copiedKey={copiedKey} onCopied={setCopiedKey} />
            <OutputBox label="Alt text" value={pkg.altText} copyKey="alt" copiedKey={copiedKey} onCopied={setCopiedKey} />
          </section>
        </div>
      </div>
    </main>
  );
}
