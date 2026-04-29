"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import {
  SCENIC_IMAGE_PRESETS,
  buildScenicImagePromptPackage,
  getScenicPresetById,
  type ScenicImageAspectRatio,
  type ScenicImageMood,
  type ScenicImageRegion,
} from "@/lib/scenic-image-prompts";

const ASPECT_RATIOS: ScenicImageAspectRatio[] = ["9:16", "4:5", "1:1"];
const MOODS: ScenicImageMood[] = [
  "Peaceful Wildlife",
  "Epic National Park",
  "Luxury Travel Poster",
  "Documentary Realism",
];
const REGIONS: Array<ScenicImageRegion | "All"> = ["All", "USA", "Canada", "USA / Canada"];

function CopyBox({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] shadow-[var(--surface-shadow)]">
      <div className="flex items-center justify-between gap-3 border-b border-[color:var(--border)] px-4 py-3">
        <h2 className="text-sm font-bold text-[color:var(--text)]">{label}</h2>
        <button
          type="button"
          onClick={copy}
          className="rounded-2xl border border-gray-900 bg-gray-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-gray-800"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap break-words p-4 text-xs leading-6 text-[color:var(--text)]">
        {value}
      </pre>
    </section>
  );
}

export default function ImagePage() {
  const [selectedPresetId, setSelectedPresetId] = useState(SCENIC_IMAGE_PRESETS[0].id);
  const [regionFilter, setRegionFilter] = useState<ScenicImageRegion | "All">("All");
  const [aspectRatio, setAspectRatio] = useState<ScenicImageAspectRatio>("9:16");
  const [mood, setMood] = useState<ScenicImageMood>("Peaceful Wildlife");
  const [includeWildlife, setIncludeWildlife] = useState(true);
  const [customNote, setCustomNote] = useState("");

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
        includeWildlife,
        platform: "Facebook",
        customNote,
      }),
    [aspectRatio, customNote, includeWildlife, mood, selectedPreset]
  );

  return (
    <main className="ui-theme-scope min-h-screen w-full bg-[color:var(--bg)] text-[color:var(--text)]">
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-gray-950/95 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[var(--main-max-width)] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 text-[11px] font-bold text-white ring-1 ring-white/[0.12]">
              W
            </span>
            <span className="text-sm font-bold tracking-tight text-white">WILD STORIES TV</span>
          </Link>
          <nav className="inline-flex items-center rounded-2xl border border-white/[0.08] bg-white/[0.04] p-1">
            <Link className="rounded-xl px-3.5 py-2 text-xs font-semibold text-white/55 hover:bg-white/[0.06] hover:text-white" href="/">
              Build
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
        <section className="mb-6 overflow-hidden rounded-[32px] border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-5 shadow-[var(--surface-shadow)]">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--muted)]">Photo-only generator</p>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">USA / Canada Scenic Wildlife Image Studio</h1>
            <p className="max-w-3xl text-sm leading-6 text-[color:var(--muted)]">
              Generate post-ready photoreal image prompts for peaceful national-park style locations. This section is separate from the video build, Runway workflow, and storyboard systems.
            </p>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
          <aside className="space-y-4">
            <section className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4 shadow-[var(--surface-shadow)]">
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--muted)]">Region</label>
              <div className="grid grid-cols-2 gap-2">
                {REGIONS.map((region) => (
                  <button
                    key={region}
                    type="button"
                    onClick={() => setRegionFilter(region)}
                    className={`rounded-2xl border px-3 py-2 text-xs font-bold transition ${
                      regionFilter === region
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-[color:var(--border)] bg-[color:var(--surface-muted)] text-[color:var(--text)] hover:border-gray-400"
                    }`}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4 shadow-[var(--surface-shadow)]">
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--muted)]">Location preset</label>
              <select
                value={selectedPreset.id}
                onChange={(event) => setSelectedPresetId(event.target.value)}
                className="w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm font-semibold outline-none"
              >
                {filteredPresets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.title}
                  </option>
                ))}
              </select>
              <p className="mt-3 text-xs leading-5 text-[color:var(--muted)]">{selectedPreset.locationStyle}</p>
            </section>

            <section className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4 shadow-[var(--surface-shadow)]">
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--muted)]">Aspect ratio</label>
              <div className="grid grid-cols-3 gap-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    className={`rounded-2xl border px-3 py-2 text-xs font-bold transition ${
                      aspectRatio === ratio
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-[color:var(--border)] bg-[color:var(--surface-muted)] text-[color:var(--text)] hover:border-gray-400"
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4 shadow-[var(--surface-shadow)]">
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--muted)]">Mood</label>
              <div className="grid gap-2">
                {MOODS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setMood(item)}
                    className={`rounded-2xl border px-3 py-2 text-left text-xs font-bold transition ${
                      mood === item
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-[color:var(--border)] bg-[color:var(--surface-muted)] text-[color:var(--text)] hover:border-gray-400"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4 shadow-[var(--surface-shadow)]">
              <label className="flex items-center gap-3 text-sm font-bold">
                <input
                  type="checkbox"
                  checked={includeWildlife}
                  onChange={(event) => setIncludeWildlife(event.target.checked)}
                  className="h-4 w-4"
                />
                Include peaceful wildlife
              </label>
              <label className="mt-4 block text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--muted)]">Extra direction</label>
              <textarea
                value={customNote}
                onChange={(event) => setCustomNote(event.target.value)}
                placeholder="Example: more wildflowers, stronger river reflection, less saturated colors"
                className="mt-2 min-h-[110px] w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm outline-none"
              />
            </section>
          </aside>

          <section className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4 shadow-[var(--surface-shadow)]">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--muted)]">Preset</p>
                <p className="mt-1 text-sm font-black">{pkg.title}</p>
              </div>
              <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4 shadow-[var(--surface-shadow)]">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--muted)]">Post caption</p>
                <p className="mt-1 text-sm font-black">{pkg.caption}</p>
              </div>
              <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4 shadow-[var(--surface-shadow)]">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--muted)]">Hashtags</p>
                <p className="mt-1 text-sm font-black">{pkg.hashtags}</p>
              </div>
            </div>

            <CopyBox label="Image prompt" value={pkg.prompt} />
            <CopyBox label="Negative prompt" value={pkg.negativePrompt} />
            <CopyBox label="Caption + hashtags" value={`${pkg.caption}\n\n${pkg.hashtags}`} />
            <CopyBox label="Alt text" value={pkg.altText} />
          </section>
        </div>
      </div>
    </main>
  );
}
