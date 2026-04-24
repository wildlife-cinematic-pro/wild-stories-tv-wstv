"use client";

import { useCallback, useEffect, useRef } from "react";

import { copyTextToClipboard } from "@/components/CopyButton";

export function useOutputCopy() {
  const copyFeedbackTimersRef = useRef(new Map<HTMLButtonElement, number>());

  useEffect(() => {
    const timers = copyFeedbackTimersRef.current;
    return () => {
      for (const timer of timers.values()) {
        window.clearTimeout(timer);
      }
    };
  }, []);

  return useCallback(async (text: string) => {
    const copied = await copyTextToClipboard(text);
    const trigger =
      typeof document !== "undefined" &&
      document.activeElement instanceof HTMLButtonElement
        ? document.activeElement
        : null;

    if (trigger) {
      const originalLabel =
        trigger.dataset.copyIdleLabel ?? trigger.textContent?.trim() ?? "Copy";
      const existingTimer = copyFeedbackTimersRef.current.get(trigger);
      if (existingTimer) window.clearTimeout(existingTimer);

      trigger.dataset.copyIdleLabel = originalLabel;
      trigger.dataset.copyStatus = copied ? "copied" : "failed";
      trigger.style.minWidth = `${Math.ceil(trigger.getBoundingClientRect().width)}px`;
      trigger.textContent = copied ? "Copied" : "Copy failed";

      const timer = window.setTimeout(() => {
        trigger.textContent = originalLabel;
        trigger.dataset.copyStatus = "idle";
        trigger.style.minWidth = "";
        copyFeedbackTimersRef.current.delete(trigger);
      }, 1600);
      copyFeedbackTimersRef.current.set(trigger, timer);
    }

    return copied;
  }, []);
}
