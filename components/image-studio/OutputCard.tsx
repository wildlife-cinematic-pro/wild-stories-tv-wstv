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
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-3">
        <h2 className="text-xs font-black uppercase tracking-[0.16em] text-cyan-200">
          {label}
        </h2>
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
      </div>
      <pre className="max-h-[430px] overflow-auto whitespace-pre-wrap break-words p-4 text-xs leading-6 text-white/82">
        {value}
      </pre>
    </section>
  );
}
