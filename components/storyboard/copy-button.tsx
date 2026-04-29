"use client";

import { useEffect, useState } from "react";

export async function copyTextToClipboard(text: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  if (typeof document === "undefined") {
    throw new Error("Clipboard unavailable");
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  const didCopy = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!didCopy) {
    throw new Error("Clipboard unavailable");
  }
}

type CopyButtonProps = {
  text: string;
  label?: string;
  size?: "sm" | "md";
  idleText?: string;
};

export default function CopyButton({
  text,
  label = "text",
  size = "sm",
  idleText = "Copy",
}: CopyButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    if (status === "idle") return undefined;

    const timer = window.setTimeout(() => setStatus("idle"), 1500);
    return () => window.clearTimeout(timer);
  }, [status]);

  async function handleCopy() {
    if (!text.trim()) return;

    try {
      await copyTextToClipboard(text);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
  }

  const padding = size === "md" ? "px-3 py-2 text-sm" : "px-2.5 py-1.5 text-xs";
  const buttonText = status === "copied" ? "Copied ✓" : status === "error" ? "Copy failed" : idleText;

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!text.trim()}
      aria-label={`Copy ${label}`}
      className={`inline-flex items-center justify-center rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] font-semibold text-[color:var(--text)] transition hover:border-cyan-400/60 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-50 ${padding}`}
    >
      {buttonText}
    </button>
  );
}
