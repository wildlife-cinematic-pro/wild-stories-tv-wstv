"use client";

import OutputCard from "@/components/image-studio/OutputCard";
import type { CopyKey } from "@/lib/image-studio/types";

function CopyAllButton({
  value,
  copiedKey,
  onCopied,
}: {
  value: string;
  copiedKey: CopyKey;
  onCopied: (key: CopyKey) => void;
}) {
  async function copy() {
    await navigator.clipboard.writeText(value);
    onCopied("all");
    window.setTimeout(() => onCopied(null), 1400);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`rounded-2xl border px-3 py-1.5 text-xs font-bold transition ${
        copiedKey === "all"
          ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
          : "border-white/10 bg-white/[0.04] text-white/65 hover:bg-white/[0.08] hover:text-white"
      }`}
    >
      {copiedKey === "all" ? "Copied" : "Copy All"}
    </button>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/[0.08] bg-white/[0.035] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-white">{value}</p>
    </div>
  );
}

export default function ImageStudioOutputs({
  selectedCollection,
  usaHashtags,
  copyAll,
  copiedKey,
  setCopiedKey,
  nanoPrompt,
  gptPrompt,
  negativePrompt,
  facebookCaptionWithHashtags,
  variationPrompts,
  fivePostPack,
  qualityChecklist,
  altText,
}: {
  selectedCollection: string;
  usaHashtags: string;
  copyAll: string;
  copiedKey: CopyKey;
  setCopiedKey: (key: CopyKey) => void;
  nanoPrompt: string;
  gptPrompt: string;
  negativePrompt: string;
  facebookCaptionWithHashtags: string;
  variationPrompts: string;
  fivePostPack: string;
  qualityChecklist: string;
  altText: string;
}) {
  return (
    <section className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Collection" value={selectedCollection} />
        <StatCard label="Model outputs" value="Nano Banana 2 + GPT Image 2" />
        <StatCard label="Caption" value="American English" />
        <StatCard label="Hashtags" value={usaHashtags} />
      </div>

      <div className="flex justify-end">
        <CopyAllButton value={copyAll} copiedKey={copiedKey} onCopied={setCopiedKey} />
      </div>

      <OutputCard label="Nano Banana 2 prompt" value={nanoPrompt} copyKey="nano" copiedKey={copiedKey} onCopied={setCopiedKey} />
      <OutputCard label="GPT Image 2 prompt" value={gptPrompt} copyKey="gpt" copiedKey={copiedKey} onCopied={setCopiedKey} />
      <OutputCard label="Negative prompt" value={negativePrompt} copyKey="negative" copiedKey={copiedKey} onCopied={setCopiedKey} />
      <OutputCard label="Facebook caption + USA viral hashtags" value={facebookCaptionWithHashtags} copyKey="caption" copiedKey={copiedKey} onCopied={setCopiedKey} />
      <OutputCard label="3 prompt variations" value={variationPrompts} copyKey="variations" copiedKey={copiedKey} onCopied={setCopiedKey} />
      <OutputCard label="5-post Facebook pack" value={fivePostPack} copyKey="batch" copiedKey={copiedKey} onCopied={setCopiedKey} />
      <OutputCard label="Prompt quality checklist" value={qualityChecklist} copyKey="quality" copiedKey={copiedKey} onCopied={setCopiedKey} />
      <OutputCard label="Alt text" value={altText} copyKey="alt" copiedKey={copiedKey} onCopied={setCopiedKey} />
    </section>
  );
}
