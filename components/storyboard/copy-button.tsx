"use client";

import { useEffect, useRef, useState } from "react";

type CopyButtonProps = {
  text: string;
  label?: string;
  size?: "sm" | "md";
};

async function fallbackCopy(text: string): Promise<boolean> {
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
}

async function copyText(text: string): Promise<boolean> {
  if (!text.trim()) return false;

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return fallbackCopy(text);
    }
  }

  return fallbackCopy(text);
}

export default function CopyButton({
  text,
  label,
  size = "md",
}: CopyButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const disabled = !text.trim();
  const ariaLabel = label ? `Copy ${label}` : "Copy text";
  const idleLabel = label ? `Copy ${label}` : "Copy";

  async function handleCopy() {
    if (disabled) return;

    const success = await copyText(text);
    setStatus(success ? "copied" : "error");

    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      setStatus("idle");
    }, 1500);
  }

  const sizeClass =
    size === "sm"
      ? "px-2.5 py-1.5 text-[11px]"
      : "px-3 py-2 text-xs";

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] font-semibold text-[color:var(--text)] transition hover:border-cyan-400/60 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-45 ${sizeClass}`}
    >
      {status === "copied"
        ? "Copied ✓"
        : status === "error"
        ? "Copy failed"
        : idleLabel}
    </button>
  );
}
