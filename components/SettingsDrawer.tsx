"use client";

import { type TouchEventHandler, useEffect, useMemo, useRef, useState } from "react";

type ThemeMode = "dark" | "light";
type FontSize = "sm" | "md" | "lg";
type Density = "compact" | "comfortable";

type UISettings = {
  theme: ThemeMode;
  accent: string; // hex
  fontSize: FontSize;
  density: Density;
};

const STORAGE_KEY = "wstv:uiSettings:v1";

const ACCENTS: Array<{ name: string; value: string }> = [
  { name: "Indigo", value: "#6366f1" },
  { name: "Sky", value: "#0ea5e9" },
  { name: "Emerald", value: "#10b981" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Violet", value: "#8b5cf6" },
];

function hexToRgbTuple(hex: string): [number, number, number] | null {
  const raw = hex.replace(/^#/, "").trim();
  if (![3, 6].includes(raw.length)) return null;

  const full = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw;
  const n = Number.parseInt(full, 16);
  if (Number.isNaN(n)) return null;

  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return [r, g, b];
}

function safeLoadSettings(): UISettings | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<UISettings>;
    if (!parsed) return null;

    const theme: ThemeMode = parsed.theme === "light" ? "light" : "dark";
    const fontSize: FontSize = parsed.fontSize === "lg" ? "lg" : parsed.fontSize === "sm" ? "sm" : "md";
    const density: Density = parsed.density === "compact" ? "compact" : "comfortable";
    const accent = typeof parsed.accent === "string" && parsed.accent ? parsed.accent : "#6366f1";

    return { theme, accent, fontSize, density };
  } catch {
    return null;
  }
}

function applySettingsToDOM(settings: UISettings): void {
  const root = document.documentElement;

  root.dataset.theme = settings.theme;
  root.dataset.density = settings.density;

  root.style.setProperty("--accent", settings.accent);
  const rgb = hexToRgbTuple(settings.accent);
  if (rgb) root.style.setProperty("--accent-rgb", `${rgb[0]} ${rgb[1]} ${rgb[2]}`);

  const fontPx = settings.fontSize === "sm" ? "14px" : settings.fontSize === "lg" ? "18px" : "16px";
  root.style.setProperty("--base-font-size", fontPx);
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector =
    'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden")
  );
}

export default function SettingsDrawer(): JSX.Element {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const [settings, setSettings] = useState<UISettings>(() => ({
    theme: "dark",
    accent: "#6366f1",
    fontSize: "md",
    density: "comfortable",
  }));

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const lastActiveRef = useRef<HTMLElement | null>(null);

  const [dragX, setDragX] = useState(0);
  const dragStateRef = useRef<{ active: boolean; startX: number; startY: number; lastX: number; horizontal: boolean }>({
    active: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    horizontal: false,
  const dragXRef = useRef(0);

  useEffect(() => {
    dragXRef.current = dragX;
  }, [dragX]);

  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  const accentRgbText = useMemo(() => {
    const rgb = hexToRgbTuple(settings.accent);
    return rgb ? `${rgb[0]} ${rgb[1]} ${rgb[2]}` : "99 102 241";
  }, [settings.accent]);

  useEffect(() => {
    const loaded = safeLoadSettings();
    if (!loaded) {
      applySettingsToDOM(settings);
      return;
    }
    setSettings(loaded);
    applySettingsToDOM(loaded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    applySettingsToDOM(settings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  useEffect(() => {
    if (!open) return;

    lastActiveRef.current = (document.activeElement as HTMLElement | null) ?? null;

    const panel = panelRef.current;
    if (!panel) return;

    const focusFirst = () => {
      const focusables = getFocusableElements(panel);
      (focusables[0] ?? panel).focus();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!panelRef.current) return;

      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }

      if (e.key !== "Tab") return;

      const focusables = getFocusableElements(panelRef.current);
      if (!focusables.length) {
        e.preventDefault();
        panelRef.current.focus();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (!active || active === first || !panelRef.current.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (!active || active === last || !panelRef.current.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    const t = window.setTimeout(focusFirst, 0);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) return;

    const toRestore = lastActiveRef.current;
    const trigger = triggerRef.current;

    if (toRestore && document.contains(toRestore)) {
      toRestore.focus();
      return;
    }
    trigger?.focus();
  }, [open]);

  const openDrawer = () => {
    setMounted(true);
    setOpen(true);
  };

  const closeDrawer = () => {
    setDragX(0);
    setOpen(false);
    if (reduceMotion) {
      setMounted(false);
      return;
    }
    window.setTimeout(() => setMounted(false), 200);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openDrawer}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="settings-drawer"
        className="fixed bottom-4 left-4 z-50 inline-flex items-center gap-2 rounded-full border border-white/10 bg-[color-mix(in_oklab,var(--panel-strong)_80%,transparent)] px-4 py-2 text-sm font-medium text-[var(--text)] shadow-xl backdrop-blur hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--accent-rgb)/0.55)] focus-visible:ring-offset-0"
        style={{ borderColor: "var(--border)", transform: open && dragX !== 0 ? `translateX(${dragX}px)` : undefined }}
      >
        <span
          className="inline-block size-2.5 rounded-full"
          style={{ background: `rgb(${accentRgbText})` }}
          aria-hidden="true"
        />
        Settings
      </button>

      {mounted ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className={`absolute inset-0 h-full w-full cursor-default bg-black/40 transition-opacity duration-200 motion-reduce:transition-none ${open ? "opacity-100" : "opacity-0"}`}
            onClick={closeDrawer}
            aria-label="Close settings"
          />
          <div
            id="settings-drawer"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Settings"
            tabIndex={-1}
            onTouchStart={onPanelTouchStart}
            onTouchMove={onPanelTouchMove}
            onTouchEnd={onPanelTouchEnd}
            onTouchCancel={onPanelTouchEnd}
            className={`absolute bottom-0 left-0 top-0 w-[min(22rem,92vw)] border-r border-white/10 bg-[color-mix(in_oklab,var(--panel-strong)_92%,transparent)] p-4 shadow-2xl backdrop-blur-xl transition-transform duration-200 motion-reduce:transition-none ${open ? "translate-x-0" : "-translate-x-full"}`}
            style={{ borderColor: "var(--border)" }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="text-base font-semibold text-[var(--text)]">Settings</div>
              <button
                type="button"
                onClick={closeDrawer}
                className="rounded-md border border-white/10 bg-transparent px-2 py-1 text-sm text-[var(--text)] hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--accent-rgb)/0.55)]"
                style={{ borderColor: "var(--border)" }}
              >
                Close
              </button>
            </div>

            <div className="space-y-5">
              <section className="rounded-xl border border-white/10 p-3" style={{ borderColor: "var(--border)" }}>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Theme</div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, theme: "dark" }))}
                    aria-pressed={settings.theme === "dark"}
                    className="flex-1 rounded-lg border border-white/10 px-3 py-2 text-sm text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--accent-rgb)/0.55)]"
                    style={{
                      borderColor: settings.theme === "dark" ? `rgba(${accentRgbText} / 0.7)` : "var(--border)",
                      background: settings.theme === "dark" ? `rgba(${accentRgbText} / 0.12)` : "transparent",
                    }}
                  >
                    Dark
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, theme: "light" }))}
                    aria-pressed={settings.theme === "light"}
                    className="flex-1 rounded-lg border border-white/10 px-3 py-2 text-sm text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--accent-rgb)/0.55)]"
                    style={{
                      borderColor: settings.theme === "light" ? `rgba(${accentRgbText} / 0.7)` : "var(--border)",
                      background: settings.theme === "light" ? `rgba(${accentRgbText} / 0.12)` : "transparent",
                    }}
                  >
                    Light
                  </button>
                </div>
              </section>

              <section className="rounded-xl border border-white/10 p-3" style={{ borderColor: "var(--border)" }}>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Accent</div>
                <div className="grid grid-cols-3 gap-2">
                  {ACCENTS.map((a) => {
                    const active = settings.accent.toLowerCase() === a.value.toLowerCase();
                    return (
                      <button
                        key={a.value}
                        type="button"
                        onClick={() => setSettings((s) => ({ ...s, accent: a.value }))}
                        aria-pressed={active}
                        className="flex items-center justify-center gap-2 rounded-lg border px-2 py-2 text-xs text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--accent-rgb)/0.55)]"
                        style={{
                          borderColor: active ? `rgba(${accentRgbText} / 0.8)` : "var(--border)",
                          background: active ? `rgba(${accentRgbText} / 0.12)` : "transparent",
                        }}
                        title={a.name}
                      >
                        <span className="inline-block size-3.5 rounded-full" style={{ background: a.value }} aria-hidden="true" />
                        {a.name}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-xl border border-white/10 p-3" style={{ borderColor: "var(--border)" }}>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Font size</div>
                <div className="flex gap-2">
                  {([
                    ["sm", "Small"],
                    ["md", "Medium"],
                    ["lg", "Large"],
                  ] as const).map(([value, label]) => {
                    const active = settings.fontSize === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setSettings((s) => ({ ...s, fontSize: value }))}
                        aria-pressed={active}
                        className="flex-1 rounded-lg border px-3 py-2 text-sm text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--accent-rgb)/0.55)]"
                        style={{
                          borderColor: active ? `rgba(${accentRgbText} / 0.8)` : "var(--border)",
                          background: active ? `rgba(${accentRgbText} / 0.12)` : "transparent",
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-xl border border-white/10 p-3" style={{ borderColor: "var(--border)" }}>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Layout density</div>
                <div className="flex gap-2">
                  {([
                    ["compact", "Compact"],
                    ["comfortable", "Comfortable"],
                  ] as const).map(([value, label]) => {
                    const active = settings.density === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setSettings((s) => ({ ...s, density: value }))}
                        aria-pressed={active}
                        className="flex-1 rounded-lg border px-3 py-2 text-sm text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--accent-rgb)/0.55)]"
                        style={{
                          borderColor: active ? `rgba(${accentRgbText} / 0.8)` : "var(--border)",
                          background: active ? `rgba(${accentRgbText} / 0.12)` : "transparent",
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-xl border border-white/10 p-3" style={{ borderColor: "var(--border)" }}>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Reset</div>
                <button
                  type="button"
                  onClick={() =>
                    setSettings({
                      theme: "dark",
                      accent: "#6366f1",
                      fontSize: "md",
                      density: "comfortable",
                    })
                  }
                  className="w-full rounded-lg border border-white/10 px-3 py-2 text-sm text-[var(--text)] hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--accent-rgb)/0.55)]"
                  style={{ borderColor: "var(--border)" }}
                >
                  Reset to defaults
                </button>
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
