"use client";

import { COPY_RESET_MS } from "@/lib/image-studio/constants";
import type { CopyKey } from "@/lib/image-studio/types";

export default function OutputCard({
  label,
  value,
  copyKey,
  copiedKey,
  onCopied,
}: {
  label: string;
  value: string;
  copyKey: Exclude<CopyKey, null>;
  copiedKey: CopyKey;
  onCopied: (key: CopyKey) => void;
}) {
  async function copy() {
    await navigator.clipboard.writeText(value);
    onCopied(copyKey);
    window.setTimeout(() => onCopied(null), COPY_RESET_MS);
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-white/[0.08] bg-gray-950/55 shadow-[var(--surface-shadow)]">
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.07] px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
        <h2 className="text-[11px] font-black uppercase tracking-[0.16em] text-cyan-200 sm:text-xs">
          {label}
        </h2>
        <button
          type="button"
          onClick={copy}
          className={`rounded-2xl border px-2.5 py-1.5 text-[11px] font-bold transition sm:px-3 sm:text-xs ${
            copiedKey === copyKey
              ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
              : "border-white/10 bg-white/[0.04] text-white/65 hover:bg-white/[0.08] hover:text-white"
          }`}
        >
          {copiedKey === copyKey ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="max-h-[320px] overflow-auto whitespace-pre-wrap break-words p-3 text-[11px] leading-5 text-white/82 sm:max-h-[430px] sm:p-4 sm:text-xs sm:leading-6">
        {value}
      </pre>
    </section>
  );
}
