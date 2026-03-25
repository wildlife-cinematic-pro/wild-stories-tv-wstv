// ─────────────────────────────────────────────────────────────
// lib/quality-lead.ts
// Extracted to break circular dependency:
//   predator-data → prompt-builders → predator-data
//
// Now both predator-data.ts and prompt-builders.ts import from
// this file instead of from each other.
// ─────────────────────────────────────────────────────────────

import type { QualityOptions } from "@/types";

/** Build a natural-language quality lead-in for video prompts */
export function buildQualityLead(opts?: QualityOptions): string {
  if (!opts) return "";
  const bits: string[] = [];
  if (opts.referenceLock)
    bits.push(
      "Reference lock enabled — preserve the exact subject identity, proportions, markings, and silhouette from the uploaded hero frame."
    );
  if (opts.motionOnlyI2V)
  bits.push(
  "Image-to-video rule — let the reference image define appearance; direct motion, physics, and camera behavior only."
);
  if (opts.singleActionRule)
    bits.push("Single-action rule — use one primary subject action and one deliberate camera move only.");
  if (opts.microMotion)
    bits.push("Micro-motion layer enabled — keep the background alive with subtle atmospheric movement.");
  if (opts.heroVeo)
    bits.push("Hero Veo routing enabled for the most photoreal action beat or resolve shot.");
  if (opts.seamlessShot)
    bits.push("Seamless shot mode — continuous, uncut footage with no implied scene transitions.");
  return bits.join(" ");
}
