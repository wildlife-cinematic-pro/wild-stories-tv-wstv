// file: components/ContentCalendar.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GeneratedPackage } from "@/types";

type CalendarItem = {
  dateISO: string;
  label: string;
  hook: string;
  caption: string;
  hashtags: string;
};

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function formatHuman(d: Date): string {
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function safeStr(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (Array.isArray(v)) return v.map(String).join(" ").trim();
  return String(v ?? "").trim();
}

function joinHashtags(v: unknown): string {
  if (Array.isArray(v)) return v.map(String).join(" ").trim();
  return safeStr(v);
}

async function copy(text: string) {
  await navigator.clipboard.writeText(text);
}

export default function ContentCalendar({
  data,
  days = 14,
  title = "📅 Content Calendar",
}: {
  data: GeneratedPackage;
  days?: number;
  title?: string;
}) {
  const todayISO = useMemo(() => toISODate(new Date()), []);
  const [selectedISO, setSelectedISO] = useState<string>(todayISO);
  const [copiedKey, setCopiedKey] = useState<string>("");

  const todayBtnRef = useRef<HTMLButtonElement | null>(null);

  const hooks = useMemo(() => {
    const h = (data as any).hook2026;
    if (Array.isArray(h) && h.length) return h.map(safeStr).filter(Boolean);
    const single = safeStr((data as any).hook);
    return single ? [single] : [];
  }, [data]);

  const caption = useMemo(() => {
    const c = (data as any).caption2026;
    return safeStr(c) || safeStr((data as any).caption);
  }, [data]);

  const hashtags = useMemo(() => joinHashtags((data as any).hashtags), [data]);

  const items: CalendarItem[] = useMemo(() => {
    const base = new Date();
    const out: CalendarItem[] = [];
    for (let i = 0; i < days; i++) {
      const d = addDays(base, i);
      const iso = toISODate(d);
      const hookPick = hooks.length ? hooks[i % hooks.length] : "";
      out.push({
        dateISO: iso,
        label: formatHuman(d),
        hook: hookPick,
        caption,
        hashtags,
      });
    }
    return out;
  }, [days, hooks, caption, hashtags]);

  const selected = useMemo(
    () => items.find((x) => x.dateISO === selectedISO) ?? items[0],
    [items, selectedISO]
  );

  useEffect(() => {
    // Auto scroll to Today on mount
    todayBtnRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  async function handleCopy(key: string, text: string) {
    if (!text) return;
    await copy(text);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(""), 800);
  }

  const copyPack = useMemo(() => {
    const parts = [
      selected?.hook ? `HOOK: ${selected.hook}` : "",
      selected?.caption ? `CAPTION: ${selected.caption}` : "",
      selected?.hashtags ? `HASHTAGS: ${selected.hashtags}` : "",
    ].filter(Boolean);
    return parts.join("\n\n");
  }, [selected]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-extrabold text-gray-900">{title}</div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedISO(todayISO)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-extrabold text-gray-800 hover:bg-gray-50 active:scale-95"
          >
            Today
          </button>
          <div className="text-xs font-semibold text-gray-500">{days} days</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        {/* Left list */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-2">
          <div className="mb-2 text-[11px] font-extrabold uppercase tracking-widest text-gray-600">
            Dates
          </div>

          <div className="max-h-72 overflow-auto space-y-1">
            {items.map((it, idx) => {
              const active = it.dateISO === selectedISO;
              const isToday = it.dateISO === todayISO;

              return (
                <button
                  key={it.dateISO}
                  type="button"
                  ref={isToday ? todayBtnRef : undefined}
                  onClick={() => setSelectedISO(it.dateISO)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-xs font-bold transition-all active:scale-[0.98] ${
                    active
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 bg-white text-gray-800 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span>{it.label}</span>

                    <div className="flex items-center gap-2">
                      {isToday && (
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-extrabold ${
                            active
                              ? "bg-white/20 text-white"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          Today
                        </span>
                      )}
                      <span className={`text-[10px] ${active ? "text-gray-200" : "text-gray-400"}`}>
                        #{idx + 1}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right details */}
        <div className="space-y-3">
          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="text-xs font-extrabold text-gray-900">Hook</div>
              <button
                type="button"
                onClick={() => handleCopy("hook", selected?.hook ?? "")}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-extrabold text-gray-800 hover:bg-gray-50 active:scale-95"
              >
                {copiedKey === "hook" ? "✅ Copied" : "Copy"}
              </button>
            </div>
            <pre className="max-h-28 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-gray-800">
              {selected?.hook || "—"}
            </pre>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="text-xs font-extrabold text-gray-900">Caption</div>
              <button
                type="button"
                onClick={() => handleCopy("caption", selected?.caption ?? "")}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-extrabold text-gray-800 hover:bg-gray-50 active:scale-95"
              >
                {copiedKey === "caption" ? "✅ Copied" : "Copy"}
              </button>
            </div>
            <pre className="max-h-40 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-gray-800">
              {selected?.caption || "—"}
            </pre>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="text-xs font-extrabold text-gray-900">Hashtags</div>
              <button
                type="button"
                onClick={() => handleCopy("hashtags", selected?.hashtags ?? "")}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-extrabold text-gray-800 hover:bg-gray-50 active:scale-95"
              >
                {copiedKey === "hashtags" ? "✅ Copied" : "Copy"}
              </button>
            </div>
            <pre className="max-h-24 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-gray-800">
              {selected?.hashtags || "—"}
            </pre>
          </div>

          <button
            type="button"
            onClick={() => handleCopy("pack", copyPack)}
            className="w-full rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-black active:scale-[0.98]"
          >
            {copiedKey === "pack" ? "✅ Copied Full Pack" : "📋 Copy Full Post Pack"}
          </button>
        </div>
      </div>
    </div>
  );
}