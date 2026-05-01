// WSTV-AUDIT-FIX: FIX-2 applied
type PromptEngine = "runway" | "kling" | "seedance" | "image" | "social";

const ENGINE_REPLACEMENTS: Record<PromptEngine, Array<[RegExp, string]>> = {
  runway: [
    [/\battack\b/gi, "pressure beat"],
    [/\btakedown\b/gi, "chase sequence"],
    [/\bbite\b/gi, "grip pressure"],
    [/\bkill\b/gi, "overpower"],
    [/\bmaul\b/gi, "dominant force"],
    [/\bno overlap\b/gi, "spacing stays readable"],
    [/\bblood\b/gi, ""],
    [/\bgore\b/gi, ""],
    [/\bambush\b/gi, "pursuit approach"],
  ],
  kling: [
    [/\btakedown\b/gi, "capture pressure"],
    [/\bbite\b/gi, "grip"],
    [/\bmaul\b/gi, "overpower"],
    [/\bkill\b/gi, "defeat"],
    [/\bambush\b/gi, "pursuit moment"],
    [/\bstrike\b/gi, "contact beat"],
    [/\bno overlap\b/gi, "spacing stays readable"],
    [/\bno chaotic overlap\b/gi, "spacing stays readable"],
  ],
  seedance: [],
  image: [],
  social: [
    [/\btakedown\b/gi, "capture"],
    [/\bbite\b/gi, "grip"],
    [/\bmaul\b/gi, "overpower"],
    [/\bkill\b/gi, "defeat"],
    [/\battack\b/gi, "pursue"],
  ],
};

export function sanitizeForEngine(text: string, engine: PromptEngine): string {
  let out = text;
  for (const [pattern, replacement] of ENGINE_REPLACEMENTS[engine]) {
    out = out.replace(pattern, replacement);
  }
  return out.replace(/\s{2,}/g, " ").trim();
}
