// components/SettingsDrawer.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type ThemeMode = "light" | "dark";
type FontSize = "sm" | "md" | "lg";
type Density = "compact" | "comfortable";
type MotionMode = "system" | "smooth" | "reduced";
type ContrastMode = "normal" | "high";
type RadiusMode = "sharp" | "rounded" | "soft";
type PageWidthMode = "standard" | "wide" | "full";

type UISettings = {
  theme: ThemeMode;
  accent: string;
  fontSize: FontSize;
  density: Density;
  motion: MotionMode;
  contrast: ContrastMode;
  radius: RadiusMode;
  pageWidth: PageWidthMode;
};

const STORAGE_KEY = "ui-settings-v2";
const DEFAULT_SETTINGS: UISettings = {
  theme: "dark",
  accent: "#6366f1",
  fontSize: "md",
  density: "comfortable",
  motion: "system",
  contrast: "normal",
  radius: "rounded",
  pageWidth: "standard",
};

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

    const motion: MotionMode =
      parsed.motion === "smooth" || parsed.motion === "reduced" ? parsed.motion : "system";
    const contrast: ContrastMode = parsed.contrast === "high" ? "high" : "normal";
    const radius: RadiusMode =
      parsed.radius === "sharp" || parsed.radius === "soft" ? parsed.radius : "rounded";
    const pageWidth: PageWidthMode =
      parsed.pageWidth === "wide" || parsed.pageWidth === "full" ? parsed.pageWidth : "standard";

    return { theme, accent, fontSize, density, motion, contrast, radius, pageWidth };
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

function applySettingsToDOM(settings: UISettings, systemReduceMotion = false) {
  const root = document.documentElement;

  root.dataset.theme = settings.theme;
  root.dataset.density = settings.density;
  root.dataset.contrast = settings.contrast;
  root.dataset.radius = settings.radius;
  root.dataset.pageWidth = settings.pageWidth;

  const effectiveMotion =
    settings.motion === "system"
      ? systemReduceMotion
        ? "reduced"
        : "smooth"
      : settings.motion;
  root.dataset.motion = effectiveMotion;

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

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest(
      "button, a, input, select, textarea, [role='button'], [role='switch'], [role='radio']"
    )
  );
}

export default function SettingsDrawer() {
  const [open, setOpen] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const [settings, setSettings] = useState<UISettings>(() => DEFAULT_SETTINGS);

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

  const effectiveMotionLabel = useMemo(() => {
    if (settings.motion === "system") {
      return reduceMotion ? "System prefers reduced motion" : "System allows smooth motion";
    }
    return settings.motion === "reduced" ? "Reduced motion forced" : "Smooth motion forced";
  }, [reduceMotion, settings.motion]);

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
      applySettingsToDOM(loaded, reduceMotion);
    } else {
      applySettingsToDOM(settings, reduceMotion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applySettingsToDOM(settings, reduceMotion);
    safeSaveSettings(settings);
  }, [reduceMotion, settings]);

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
  const setMotion = (motion: MotionMode) => setSettings((s) => ({ ...s, motion }));
  const setContrast = (contrast: ContrastMode) => setSettings((s) => ({ ...s, contrast }));
  const setRadius = (radius: RadiusMode) => setSettings((s) => ({ ...s, radius }));
  const setPageWidth = (pageWidth: PageWidthMode) => setSettings((s) => ({ ...s, pageWidth }));
  const resetSettings = () => setSettings(DEFAULT_SETTINGS);

  const close = () => setOpen(false);
  const toggle = () => setOpen((v) => !v);

  const onOverlayMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.target === e.currentTarget) close();
  };

  // Swipe: ONLY for touch + ONLY when starting from non-interactive areas
  const onPanelPointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (e.pointerType !== "touch") return;
    if (isInteractiveTarget(e.target)) return;

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
  const onPanelPointerCancel: React.PointerEventHandler<HTMLDivElement> = (e) =>
    endDrag(e.pointerId);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        className={[
          "inline-flex items-center rounded-full border border-[color:var(--border)] bg-[color:color-mix(in_oklab,var(--panel-strong)_88%,transparent)] text-[color:var(--text)] shadow-[0_10px_24px_rgba(2,6,23,0.18)] backdrop-blur",
          "px-3 py-2 text-xs font-semibold sm:text-sm",
          "hover:bg-[color:color-mix(in_oklab,var(--surface-muted)_90%,transparent)] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-rgb))] focus:ring-offset-2 focus:ring-offset-[color:var(--bg)]",
        ].join(" ")}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="settings-drawer"
      >
        Settings
      </button>

      <div
        className={["fixed inset-0 z-50", open ? "pointer-events-auto" : "pointer-events-none"].join(
          " "
        )}
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
            "fixed inset-y-0 left-0 z-[60] flex h-dvh w-[360px] max-w-[92vw] flex-col overflow-hidden",
            "border-r border-[color:var(--border)] bg-[color:var(--surface-elevated)] text-[color:var(--text)] shadow-2xl",
            reduceMotion ? "" : "transition-transform duration-300 ease-out",
            "motion-reduce:transition-none",
            open ? "translate-x-0" : "-translate-x-full",
            "touch-pan-y",
          ].join(" ")}
        >
          <div className="flex items-center justify-between border-b border-[color:var(--border)] px-4 py-3">
            <div className="text-base font-semibold">UI Settings</div>
            <button
              type="button"
              onClick={close}
              className={[
                "rounded-md px-2 py-1 text-sm text-[color:var(--text)]",
                "hover:bg-[color:var(--surface-muted)] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-rgb))]",
              ].join(" ")}
            >
              Close
            </button>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
            <section className="space-y-2">
              <div className="text-sm font-medium">Theme</div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={[
                    "flex-1 rounded-lg border px-3 py-2 text-sm",
                    settings.theme === "light"
                      ? "border-[rgb(var(--accent-rgb))] bg-[rgb(var(--accent-rgb)/0.16)] text-[color:var(--text)] shadow-sm"
                      : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text)] hover:bg-[color:var(--surface-muted)]",
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
                      ? "border-[rgb(var(--accent-rgb))] bg-[rgb(var(--accent-rgb)/0.16)] text-[color:var(--text)] shadow-sm"
                      : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text)] hover:bg-[color:var(--surface-muted)]",
                  ].join(" ")}
                >
                  Dark
                </button>
              </div>
            </section>

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
                          ? "border-[rgb(var(--accent-rgb))] bg-[rgb(var(--accent-rgb)/0.16)] text-[color:var(--text)] shadow-sm"
                          : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text)] hover:bg-[color:var(--surface-muted)]",
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

              <div className="text-xs text-[color:var(--muted)]">
                Active: <span className="font-mono">{settings.accent}</span>{" "}
                <span className="font-mono">({accentRgbText})</span>
              </div>
            </section>

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
                        ? "border-[rgb(var(--accent-rgb))] bg-[rgb(var(--accent-rgb)/0.16)] text-[color:var(--text)] shadow-sm"
                        : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text)] hover:bg-[color:var(--surface-muted)]",
                    ].join(" ")}
                  >
                    {v === "sm" ? "Small" : v === "lg" ? "Large" : "Medium"}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-2">
              <div className="text-sm font-medium">Layout density</div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDensity("compact")}
                  className={[
                    "flex-1 rounded-lg border px-3 py-2 text-sm",
                    settings.density === "compact"
                      ? "border-[rgb(var(--accent-rgb))] bg-[rgb(var(--accent-rgb)/0.16)] text-[color:var(--text)] shadow-sm"
                      : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text)] hover:bg-[color:var(--surface-muted)]",
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
                      ? "border-[rgb(var(--accent-rgb))] bg-[rgb(var(--accent-rgb)/0.16)] text-[color:var(--text)] shadow-sm"
                      : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text)] hover:bg-[color:var(--surface-muted)]",
                  ].join(" ")}
                >
                  Comfortable
                </button>
              </div>
              <div className="text-xs text-[color:var(--muted)]">
                Compact mode also tightens <span className="font-mono">space-y-*</span> and{" "}
                <span className="font-mono">gap-*</span> via CSS vars.
              </div>
            </section>

            <section className="space-y-2">
              <div className="text-sm font-medium">Motion</div>
              <div className="grid grid-cols-3 gap-2">
                {([
                  ["system", "System"],
                  ["smooth", "Smooth"],
                  ["reduced", "Reduced"],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMotion(value)}
                    className={[
                      "rounded-lg border px-3 py-2 text-sm",
                      settings.motion === value
                        ? "border-[rgb(var(--accent-rgb))] bg-[rgb(var(--accent-rgb)/0.16)] text-[color:var(--text)] shadow-sm"
                        : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text)] hover:bg-[color:var(--surface-muted)]",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="text-xs text-[color:var(--muted)]">{effectiveMotionLabel}</div>
            </section>

            <section className="space-y-2">
              <div className="text-sm font-medium">Contrast</div>
              <div className="flex gap-2">
                {([
                  ["normal", "Normal"],
                  ["high", "High"],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setContrast(value)}
                    className={[
                      "flex-1 rounded-lg border px-3 py-2 text-sm",
                      settings.contrast === value
                        ? "border-[rgb(var(--accent-rgb))] bg-[rgb(var(--accent-rgb)/0.16)] text-[color:var(--text)] shadow-sm"
                        : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text)] hover:bg-[color:var(--surface-muted)]",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-2">
              <div className="text-sm font-medium">Corners</div>
              <div className="grid grid-cols-3 gap-2">
                {([
                  ["sharp", "Sharp"],
                  ["rounded", "Rounded"],
                  ["soft", "Soft"],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRadius(value)}
                    className={[
                      "rounded-lg border px-3 py-2 text-sm",
                      settings.radius === value
                        ? "border-[rgb(var(--accent-rgb))] bg-[rgb(var(--accent-rgb)/0.16)] text-[color:var(--text)] shadow-sm"
                        : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text)] hover:bg-[color:var(--surface-muted)]",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-2">
              <div className="text-sm font-medium">Page width</div>
              <div className="grid grid-cols-3 gap-2">
                {([
                  ["standard", "Standard"],
                  ["wide", "Wide"],
                  ["full", "Full"],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPageWidth(value)}
                    className={[
                      "rounded-lg border px-3 py-2 text-sm",
                      settings.pageWidth === value
                        ? "border-[rgb(var(--accent-rgb))] bg-[rgb(var(--accent-rgb)/0.16)] text-[color:var(--text)] shadow-sm"
                        : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text)] hover:bg-[color:var(--surface-muted)]",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="text-xs text-[color:var(--muted)]">
                Wide and Full make the localhost page use more horizontal space.
              </div>
            </section>

            <section className="space-y-2">
              <div className="text-sm font-medium">Quick actions</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={resetSettings}
                  className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text)] hover:bg-[color:var(--surface-muted)]"
                >
                  Reset UI
                </button>
                <button
                  type="button"
                  onClick={close}
                  className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text)] hover:bg-[color:var(--surface-muted)]"
                >
                  Close Drawer
                </button>
              </div>
              <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3 text-xs text-[color:var(--muted)]">
                Active profile: {settings.theme}, {settings.fontSize}, {settings.density}, {settings.motion}, {settings.contrast}, {settings.radius}, {settings.pageWidth}
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
