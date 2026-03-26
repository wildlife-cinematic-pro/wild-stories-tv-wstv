// components/SettingsDrawer.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type ThemeMode = "light" | "dark";
type FontSize = "sm" | "md" | "lg";
type Density = "compact" | "comfortable";

type UISettings = {
  theme: ThemeMode;
  accent: string;
  fontSize: FontSize;
  density: Density;
};

const STORAGE_KEY = "ui-settings-v1";

const ACCENTS: Array<{ name: string; value: string }> = [
  { name: "Indigo", value: "#6366f1" },
  { name: "Sky", value: "#0ea5e9" },
  { name: "Emerald", value: "#10b981" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Violet", value: "#8b5cf6" },
];

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function hexToRgbTuple(hex: string): [number, number, number] | null {
  const raw = (hex ?? "").trim().replace("#", "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;

  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;

  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return [r, g, b];
}

function safeLoadSettings(): UISettings | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<UISettings> | null;
    if (!parsed) return null;

    const theme: ThemeMode = parsed.theme === "light" ? "light" : "dark";
    const fontSize: FontSize =
      parsed.fontSize === "sm" || parsed.fontSize === "lg" ? parsed.fontSize : "md";
    const density: Density = parsed.density === "compact" ? "compact" : "comfortable";

    const accent =
      typeof parsed.accent === "string" && parsed.accent.trim()
        ? parsed.accent.trim()
        : "#6366f1";

    return { theme, accent, fontSize, density };
  } catch {
    return null;
  }
}

function safeSaveSettings(settings: UISettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

function applySettingsToDOM(settings: UISettings) {
  const root = document.documentElement;

  root.dataset.theme = settings.theme;
  root.dataset.density = settings.density;

  const fontPx = settings.fontSize === "sm" ? 14 : settings.fontSize === "lg" ? 18 : 16;
  root.style.setProperty("--base-font-size", `${fontPx}px`);

  root.style.setProperty("--accent", settings.accent);
  const rgb = hexToRgbTuple(settings.accent);
  root.style.setProperty("--accent-rgb", rgb ? `${rgb[0]} ${rgb[1]} ${rgb[2]}` : "99 102 241");
}

function getFocusable(container: HTMLElement): HTMLElement[] {
  const nodes = Array.from(
    container.querySelectorAll<HTMLElement>(
      [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(",")
    )
  );
  return nodes.filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1 && !el.hidden);
}

export default function SettingsDrawer() {
  const [open, setOpen] = useState(false);
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

  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const currentDxRef = useRef(0);

  const accentRgbText = useMemo(() => {
    const rgb = hexToRgbTuple(settings.accent);
    return rgb ? `${rgb[0]} ${rgb[1]} ${rgb[2]}` : "99 102 241";
  }, [settings.accent]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  useEffect(() => {
    const loaded = safeLoadSettings();
    if (loaded) {
      setSettings(loaded);
      applySettingsToDOM(loaded);
    } else {
      applySettingsToDOM(settings);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applySettingsToDOM(settings);
    safeSaveSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (!open) return;

    lastActiveRef.current = document.activeElement as HTMLElement | null;

    const panel = panelRef.current;
    if (panel) {
      const focusables = getFocusable(panel);
      (focusables[0] ?? panel).focus();
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }

      if (e.key !== "Tab") return;

      const p = panelRef.current;
      if (!p) return;

      const focusables = getFocusable(p);
      if (focusables.length === 0) {
        e.preventDefault();
        p.focus();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && (active === first || active === p)) {
        e.preventDefault();
        last.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [open]);

  useEffect(() => {
    if (open) return;
    const prev = lastActiveRef.current;
    if (prev && typeof prev.focus === "function") prev.focus();
    else triggerRef.current?.focus();
  }, [open]);

  const setTheme = (theme: ThemeMode) => setSettings((s) => ({ ...s, theme }));
  const setAccent = (accent: string) => setSettings((s) => ({ ...s, accent }));
  const setFontSize = (fontSize: FontSize) => setSettings((s) => ({ ...s, fontSize }));
  const setDensity = (density: Density) => setSettings((s) => ({ ...s, density }));

  const close = () => setOpen(false);
  const toggle = () => setOpen((v) => !v);

  const onOverlayMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.target === e.currentTarget) close();
  };

  const onPanelPointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    // Only handle primary touch/pen/mouse drags intended for swipe
    if (e.button !== 0 && e.pointerType === "mouse") return;

    draggingRef.current = true;
    startXRef.current = e.clientX;
    currentDxRef.current = 0;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const onPanelPointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!draggingRef.current) return;

    const dx = e.clientX - startXRef.current;
    // drawer is on the left; swipe LEFT (negative dx) to close
    currentDxRef.current = clamp(dx, -280, 0);

    const panel = panelRef.current;
    if (!panel) return;

    panel.style.transition = "none";
    panel.style.transform = `translateX(${currentDxRef.current}px)`;
  };

  const endDrag = (pointerId?: number) => {
    if (!draggingRef.current) return;

    draggingRef.current = false;

    const dx = currentDxRef.current;
    currentDxRef.current = 0;

    const panel = panelRef.current;
    if (panel) {
      panel.style.transition = "";
      panel.style.transform = "";
    }

    if (pointerId != null && panel) {
      try {
        panel.releasePointerCapture(pointerId);
      } catch {
        // ignore
      }
    }

    if (dx < -80) close();
  };

  const onPanelPointerUp: React.PointerEventHandler<HTMLDivElement> = (e) => endDrag(e.pointerId);
  const onPanelPointerCancel: React.PointerEventHandler<HTMLDivElement> = (e) => endDrag(e.pointerId);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        className={[
          "fixed bottom-4 left-4 z-40",
          "rounded-full border border-black/10 bg-white/90 text-slate-900 shadow-lg backdrop-blur",
          "px-3 py-2 text-sm font-medium",
          "hover:bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-rgb))] focus:ring-offset-2",
          "dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-50 dark:hover:bg-slate-900",
        ].join(" ")}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="settings-drawer"
      >
        Settings
      </button>

      {/* Overlay */}
      <div
        className={[
          "fixed inset-0 z-50",
          open ? "pointer-events-auto" : "pointer-events-none",
        ].join(" ")}
        aria-hidden={!open}
      >
        <div
          onMouseDown={onOverlayMouseDown}
          className={[
            "absolute inset-0 bg-black/40",
            "transition-opacity duration-300 ease-out motion-reduce:transition-none",
            open ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />

        {/* Drawer */}
        <div
          id="settings-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Settings"
          ref={panelRef}
          tabIndex={-1}
          onPointerDown={onPanelPointerDown}
          onPointerMove={onPanelPointerMove}
          onPointerUp={onPanelPointerUp}
          onPointerCancel={onPanelPointerCancel}
          className={[
            "absolute left-0 top-0 h-full w-[320px] max-w-[90vw]",
            "border-r border-black/10 bg-white text-slate-900 shadow-2xl",
            "dark:border-white/10 dark:bg-slate-950 dark:text-slate-50",
            reduceMotion ? "" : "transition-transform duration-300 ease-out",
            "motion-reduce:transition-none",
            open ? "translate-x-0" : "-translate-x-full",
            "touch-pan-y",
          ].join(" ")}
        >
          <div className="flex items-center justify-between border-b border-black/10 px-4 py-3 dark:border-white/10">
            <div className="text-base font-semibold">UI Settings</div>
            <button
              type="button"
              onClick={close}
              className={[
                "rounded-md px-2 py-1 text-sm",
                "hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-rgb))]",
                "dark:hover:bg-white/10",
              ].join(" ")}
            >
              Close
            </button>
          </div>

          <div className="space-y-6 px-4 py-4">
            {/* Theme */}
            <section className="space-y-2">
              <div className="text-sm font-medium">Theme</div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={[
                    "flex-1 rounded-lg border px-3 py-2 text-sm",
                    settings.theme === "light"
                      ? "border-[rgb(var(--accent-rgb))] bg-[rgb(var(--accent-rgb)/0.12)]"
                      : "border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10",
                  ].join(" ")}
                >
                  Light
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={[
                    "flex-1 rounded-lg border px-3 py-2 text-sm",
                    settings.theme === "dark"
                      ? "border-[rgb(var(--accent-rgb))] bg-[rgb(var(--accent-rgb)/0.12)]"
                      : "border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10",
                  ].join(" ")}
                >
                  Dark
                </button>
              </div>
            </section>

            {/* Accent */}
            <section className="space-y-2">
              <div className="text-sm font-medium">Accent</div>
              <div className="grid grid-cols-3 gap-2">
                {ACCENTS.map((a) => {
                  const selected = settings.accent.toLowerCase() === a.value.toLowerCase();
                  return (
                    <button
                      key={a.value}
                      type="button"
                      onClick={() => setAccent(a.value)}
                      className={[
                        "rounded-lg border px-3 py-2 text-left text-xs",
                        selected
                          ? "border-[rgb(var(--accent-rgb))] bg-[rgb(var(--accent-rgb)/0.12)]"
                          : "border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: a.value }}
                          aria-hidden="true"
                        />
                        <span className="truncate">{a.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="text-xs opacity-70">
                Active: <span className="font-mono">{settings.accent}</span>{" "}
                <span className="font-mono">({accentRgbText})</span>
              </div>
            </section>

            {/* Font size */}
            <section className="space-y-2">
              <div className="text-sm font-medium">Font size</div>
              <div className="flex gap-2">
                {(["sm", "md", "lg"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setFontSize(v)}
                    className={[
                      "flex-1 rounded-lg border px-3 py-2 text-sm",
                      settings.fontSize === v
                        ? "border-[rgb(var(--accent-rgb))] bg-[rgb(var(--accent-rgb)/0.12)]"
                        : "border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10",
                    ].join(" ")}
                  >
                    {v === "sm" ? "Small" : v === "lg" ? "Large" : "Medium"}
                  </button>
                ))}
              </div>
            </section>

            {/* Density */}
            <section className="space-y-2">
              <div className="text-sm font-medium">Layout density</div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDensity("compact")}
                  className={[
                    "flex-1 rounded-lg border px-3 py-2 text-sm",
                    settings.density === "compact"
                      ? "border-[rgb(var(--accent-rgb))] bg-[rgb(var(--accent-rgb)/0.12)]"
                      : "border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10",
                  ].join(" ")}
                >
                  Compact
                </button>
                <button
                  type="button"
                  onClick={() => setDensity("comfortable")}
                  className={[
                    "flex-1 rounded-lg border px-3 py-2 text-sm",
                    settings.density === "comfortable"
                      ? "border-[rgb(var(--accent-rgb))] bg-[rgb(var(--accent-rgb)/0.12)]"
                      : "border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10",
                  ].join(" ")}
                >
                  Comfortable
                </button>
              </div>
              <div className="text-xs opacity-70">
                Compact mode also tightens <span className="font-mono">space-y-*</span> and{" "}
                <span className="font-mono">gap-*</span> via CSS vars.
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
