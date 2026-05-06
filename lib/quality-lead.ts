// ─────────────────────────────────────────────────────────────
// lib/quality-lead.ts
// Extracted to break circular dependency:
//   predator-data → prompt-builders → predator-data
//
// Now both predator-data.ts and prompt-builders.ts import from
// this file instead of from each other.
// ─────────────────────────────────────────────────────────────

import type { QualityOptions } from "@/types";

export type QualityLeadEngine = "runway" | "kling" | "image" | "generic";

/** Build a natural-language quality lead-in for prompts */
export function buildQualityLead(
  opts?: QualityOptions,
  engine: QualityLeadEngine = "generic"
): string {
  if (!opts) return "";

  const bits: string[] = [];

  if (opts.referenceLock) {
    bits.push(
      "Reference lock enabled — preserve the exact subject identity, proportions, markings, silhouette, and subject readability from the uploaded hero frame."
    );
  }

  if (opts.motionOnlyI2V && engine === "runway") {
    bits.push(
      "Image-to-video rule — let the reference image define appearance; direct motion, physics, camera behavior, and opening-frame readability only."
    );
  }

  if (opts.singleActionRule) {
    bits.push(
      "Single-action rule — use one primary subject action and one deliberate camera move only, with clear spacing and readable interaction."
    );
  }

  if (opts.microMotion) {
    bits.push(
      "Micro-motion layer enabled — keep the background alive with subtle atmospheric movement without weakening first-frame clarity."
    );
  }

  if (opts.heroVeo) {
    bits.push("Hero Veo routing enabled for the most photoreal action beat or resolve shot.");
  }

  if (opts.intensityMode) {
    bits.push(
      "Intensity mode — slightly faster action cues, stronger terrain response, and tighter peak spacing while preserving anatomy, readability, and clean subject separation."
    );
  }

  if (opts.seamlessShot) {
    bits.push("Seamless shot mode — continuous, uncut footage with no implied scene transitions.");
  }

  if (engine === "runway" || engine === "kling" || engine === "image") {
    bits.push(
      "Opening priority — strong first-frame readability, immediate visible tension, clear predator-to-survival-animal spacing, no empty setup."
    );
  }

  return bits.join(" ");
}
