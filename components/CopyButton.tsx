"use client";

import { type ButtonHTMLAttributes, type ReactNode, useEffect, useRef, useState } from "react";

export type CopyHandler = (text: string) => boolean | void | Promise<boolean | void>;

type CopyStatus = "idle" | "copied" | "failed";

export async function copyTextToClipboard(text: string): Promise<boolean> {
  const value = String(text ?? "");
  if (!value.trim()) return false;

  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

export function CopyButton({
  text,
  copyAction = copyTextToClipboard,
  copiedLabel = "Copied",
  failedLabel = "Copy failed",
  resetMs = 1600,
  children = "Copy",
  className = "",
  disabled,
  ...buttonProps
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "onCopy"> & {
  text: string | (() => string);
  copyAction?: CopyHandler;
  copiedLabel?: ReactNode;
  failedLabel?: ReactNode;
  resetMs?: number;
  children?: ReactNode;
}) {
  const [status, setStatus] = useState<CopyStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  async function handleCopy() {
    if (disabled) return;

    const value = typeof text === "function" ? text() : text;
    let copied = false;

    try {
      const result = await copyAction(value);
      copied = result !== false;
    } catch {
      copied = false;
    }

    setStatus(copied ? "copied" : "failed");

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setStatus("idle");
    }, resetMs);
  }

  return (
    <button
      {...buttonProps}
      type={buttonProps.type ?? "button"}
      disabled={disabled}
      onClick={handleCopy}
      data-copy-status={status}
      aria-live="polite"
      className={`inline-flex min-w-[76px] items-center justify-center gap-1 whitespace-nowrap ${className}`}
    >
      {status === "copied" ? copiedLabel : status === "failed" ? failedLabel : children}
    </button>
  );
}
