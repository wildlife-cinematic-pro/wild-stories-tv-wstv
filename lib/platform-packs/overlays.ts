import type {
  Arc,
  FacebookCoverFramePreset,
  FacebookCoverFrameTextPreset,
  FacebookFirstFrameOverlayPreset,
  FacebookOverlayPreset,
  FirstFrameOverlayGuidance,
  HookFormattingPreset,
  HookOverlayVariant,
} from "@/types";

import {
  FACEBOOK_COVER_FRAME_MAX_LINE_LENGTH,
  FACEBOOK_COVER_FRAME_MAX_LINES,
  HOOK_OVERLAY_MAX_LINE_LENGTH,
  HOOK_OVERLAY_MAX_LINES,
  normalizeCopy,
  trimAtWordBoundary,
} from "@/lib/platform-packs/shared";

function cleanOverlayLine(line: string): string {
  return normalizeCopy(line).replace(/\s*[:;-]\s*$/g, "").trim();
}

function buildOverlayLines(
  text: string,
  maxLineLength = HOOK_OVERLAY_MAX_LINE_LENGTH,
  maxLines = HOOK_OVERLAY_MAX_LINES
): string[] {
  const compact = normalizeCopy(text).replace(/\n+/g, " ").trim();
  if (!compact) return [];

  const words = compact.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let index = 0;

  while (index < words.length && lines.length < maxLines) {
    let line = "";

    while (index < words.length) {
      const candidate = line ? `${line} ${words[index]}` : words[index];
      if (candidate.length > maxLineLength && line) break;
      line = candidate;
      index += 1;
      if (candidate.length > maxLineLength) break;
    }

    if (lines.length === maxLines - 1 && index < words.length) {
      const remainder = [line, ...words.slice(index)].filter(Boolean).join(" ");
      line = trimAtWordBoundary(remainder, maxLineLength)
        .replace(/[.]+$/g, "")
        .trim();
      index = words.length;
    }

    const cleaned = cleanOverlayLine(line);
    if (cleaned) lines.push(cleaned);
  }

  return lines.filter(Boolean).slice(0, maxLines);
}

export function findPrimarySpeciesFromHook(
  hook: string,
  predator: string,
  prey: string
): string {
  const compactHook = normalizeCopy(hook).toLowerCase();
  const species = [normalizeCopy(predator), normalizeCopy(prey)].filter(Boolean);
  const ranked = species
    .map((name) => ({ name, index: compactHook.indexOf(name.toLowerCase()) }))
    .filter((entry) => entry.index >= 0)
    .sort((a, b) => a.index - b.index);

  return ranked[0]?.name ?? species[0] ?? "Wildlife";
}

export function buildHookPressureCue(hook: string): string {
  const lower = normalizeCopy(hook).toLowerCase();

  if (/(waterline|strike|surface break|shallows?)/.test(lower)) {
    return "Waterline strike";
  }

  if (/(yield|ground|boundary|warning-step|stance)/.test(lower)) {
    return "Hold-ground stand";
  }

  if (/(dominance|territory|clash|footing|antler|shoulder|standoff)/.test(lower)) {
    return "Dominance posture";
  }

  if (/(breakaway|survival)/.test(lower)) {
    return "Breakaway gap";
  }

  if (/(escape lane|pursuit|angles|closing angle|lane|running room)/.test(lower)) {
    return "Closing angle";
  }

  if (/(ambush|danger|too late|closed the space|distance|already moving)/.test(lower)) {
    return "Closing danger";
  }

  if (/(position|measured each other|too close|control shifted|bad step)/.test(lower)) {
    return "Position breaking";
  }

  if (/(pressure|space|read)/.test(lower)) {
    return "Wildlife tension";
  }

  return "Wildlife tension";
}

export function buildObservationalHookQuestion(
  hook: string,
  predator: string,
  prey: string
): string {
  const lower = normalizeCopy(hook).toLowerCase();
  const preyName = normalizeCopy(prey) || normalizeCopy(predator);

  if (/(waterline|strike|surface break|shallows?)/.test(lower)) {
    return "When did the strike window close?";
  }

  if (/(yield|ground|boundary|warning-step|stance)/.test(lower)) {
    return "When did the stand become clear?";
  }

  if (/(dominance|territory|clash|footing)/.test(lower)) {
    return "When did the clash become unavoidable?";
  }

  if (/(breakaway|survival)/.test(lower)) {
    return "When did the survival move appear?";
  }

  if (/(escape lane|pursuit|angles|closing angle|lane)/.test(lower)) {
    return "When did the breakaway gap vanish?";
  }

  if (preyName) {
    return `When did the ${preyName} run out of room?`;
  }

  return "Which shift changed the moment?";
}

function createOverlayVariant(
  preset: HookFormattingPreset,
  label: string,
  note: string,
  text: string
): HookOverlayVariant {
  const lines = buildOverlayLines(text);

  return {
    preset,
    label,
    note,
    lines,
    text: lines.join("\n"),
  };
}

function createOverlayVariantFromLines(
  preset: HookFormattingPreset,
  label: string,
  note: string,
  inputLines: string[]
): HookOverlayVariant {
  const lines = inputLines
    .map((line) =>
      cleanOverlayLine(trimAtWordBoundary(line, HOOK_OVERLAY_MAX_LINE_LENGTH))
    )
    .filter(Boolean)
    .slice(0, HOOK_OVERLAY_MAX_LINES);

  return {
    preset,
    label,
    note,
    lines,
    text: lines.join("\n"),
  };
}

export function buildHookFormattingPresets(
  hook: string,
  predator: string,
  prey: string
): HookOverlayVariant[] {
  const primarySpecies = findPrimarySpeciesFromHook(hook, predator, prey);
  const pressureCue = buildHookPressureCue(hook);
  const documentaryLine = trimAtWordBoundary(
    normalizeCopy(hook),
    HOOK_OVERLAY_MAX_LINE_LENGTH * HOOK_OVERLAY_MAX_LINES
  ).replace(/[.]+$/g, "");

  return [
    createOverlayVariant(
      "species_first",
      "Species-first statement",
      "Lead with the clearest species so the first frame lands immediately.",
      `${primarySpecies}: ${pressureCue.toLowerCase()}.`
    ),
    createOverlayVariant(
      "documentary_tension",
      "Documentary tension line",
      "Keep the observation intact, trimmed for a clean documentary opener.",
      documentaryLine
    ),
    createOverlayVariant(
      "observational_question",
      "Observational question",
      "Use a discussion-safe question that stays observational instead of bait-driven.",
      buildObservationalHookQuestion(hook, predator, prey)
    ),
    createOverlayVariant(
      "short_pressure",
      "Short tension line",
      "Compress the hook into a fast, clean tension cue.",
      pressureCue
    ),
    createOverlayVariantFromLines(
      "two_line_opener",
      "Two-line clean opener",
      "Split species identification and the tension cue into two quick overlay lines.",
      [primarySpecies, pressureCue]
    ),
  ];
}

export function buildFirstFrameOverlayGuidance(): FirstFrameOverlayGuidance {
  return {
    placement:
      "Keep the overlay in the upper safe zone and off the heavier silhouette when the frame already feels crowded.",
    textLength:
      "Use 1 to 2 short lines and keep each line around 28 characters or less for an easy first read. If both animals already fill the frame, prefer one species line plus one cue line.",
    opener:
      "Open on clear motion or visible tension. Avoid a dead-static first beat before the behavior cue is clear.",
    audio:
      "Make the overlay understandable with sound off, while still feeling natural if viewers hear the reel.",
    tone:
      "Keep the wording observational, documentary, and original. Avoid bait phrasing, hype filler, and forced-engagement language.",
  };
}

function createFacebookOverlayPreset(
  preset: FacebookFirstFrameOverlayPreset,
  label: string,
  note: string,
  text: string
): FacebookOverlayPreset {
  const lines = buildOverlayLines(
    text,
    HOOK_OVERLAY_MAX_LINE_LENGTH,
    HOOK_OVERLAY_MAX_LINES
  );

  return {
    preset,
    label,
    note,
    lines,
    text: lines.join("\n"),
  };
}

function createFacebookOverlayPresetFromLines(
  preset: FacebookFirstFrameOverlayPreset,
  label: string,
  note: string,
  inputLines: string[]
): FacebookOverlayPreset {
  const lines = inputLines
    .map((line) =>
      cleanOverlayLine(trimAtWordBoundary(line, HOOK_OVERLAY_MAX_LINE_LENGTH))
    )
    .filter(Boolean)
    .slice(0, HOOK_OVERLAY_MAX_LINES);

  return {
    preset,
    label,
    note,
    lines,
    text: lines.join("\n"),
  };
}

function buildFacebookCoverFrameQuestion(hook: string): string {
  const lower = normalizeCopy(hook).toLowerCase();

  if (/(waterline|strike|surface break|shallows?)/.test(lower)) {
    return "When did the strike turn?";
  }

  if (/(yield|ground|boundary|warning-step|stance)/.test(lower)) {
    return "When did the line hold?";
  }

  if (/(dominance|territory|clash|footing)/.test(lower)) {
    return "When did the clash turn?";
  }

  if (/(breakaway|survival)/.test(lower)) {
    return "When did escape open?";
  }

  if (/(escape lane|pursuit|angles|closing angle|lane)/.test(lower)) {
    return "When did the opening vanish?";
  }

  return "Which move changed the moment?";
}

function createFacebookCoverFramePreset(
  preset: FacebookCoverFramePreset,
  label: string,
  note: string,
  text: string
): FacebookCoverFrameTextPreset {
  const lines = buildOverlayLines(
    text,
    FACEBOOK_COVER_FRAME_MAX_LINE_LENGTH,
    FACEBOOK_COVER_FRAME_MAX_LINES
  );

  return {
    preset,
    label,
    note,
    lines,
    text: lines.join("\n"),
  };
}

function createFacebookCoverFramePresetFromLines(
  preset: FacebookCoverFramePreset,
  label: string,
  note: string,
  inputLines: string[]
): FacebookCoverFrameTextPreset {
  const lines = inputLines
    .map((line) =>
      cleanOverlayLine(
        trimAtWordBoundary(line, FACEBOOK_COVER_FRAME_MAX_LINE_LENGTH)
      )
    )
    .filter(Boolean)
    .slice(0, FACEBOOK_COVER_FRAME_MAX_LINES);

  return {
    preset,
    label,
    note,
    lines,
    text: lines.join("\n"),
  };
}

export function buildFacebookFirstFrameOverlayPresets(
  hook: string,
  predator: string,
  prey: string
): FacebookOverlayPreset[] {
  const primarySpecies = findPrimarySpeciesFromHook(hook, predator, prey);
  const pressureCue = buildHookPressureCue(hook);
  const documentaryLine = trimAtWordBoundary(
    normalizeCopy(hook),
    HOOK_OVERLAY_MAX_LINE_LENGTH * HOOK_OVERLAY_MAX_LINES
  ).replace(/[.]+$/g, "");

  return [
    createFacebookOverlayPreset(
      "facebook_species_first",
      "Facebook species-first opener",
      "Best first test for Facebook Reels when species clarity matters most.",
      `${primarySpecies}: ${pressureCue.toLowerCase()}.`
    ),
    createFacebookOverlayPreset(
      "facebook_documentary_tension",
      "Facebook documentary tension opener",
      "Keeps the hook observational while trimming it for first-frame readability.",
      documentaryLine
    ),
    createFacebookOverlayPreset(
      "facebook_short_pressure",
      "Facebook short tension opener",
      "Compact tension language for fast Facebook feed scanning.",
      pressureCue
    ),
    createFacebookOverlayPreset(
      "facebook_observational_question",
      "Facebook observational question opener",
      "Discussion-safe question wording without vote bait or forced engagement.",
      buildObservationalHookQuestion(hook, predator, prey)
    ),
    createFacebookOverlayPresetFromLines(
      "facebook_two_line_readable",
      "Facebook two-line clean opener",
      "Splits species and the tension cue into two clean upper-safe-zone lines.",
      [primarySpecies, pressureCue]
    ),
  ];
}

export function buildFacebookCoverFramePresets(
  hook: string,
  predator: string,
  prey: string,
  arc: Arc
): FacebookCoverFrameTextPreset[] {
  const primarySpecies = findPrimarySpeciesFromHook(hook, predator, prey);
  const pressureCue = buildHookPressureCue(hook);
  const safeQuestion = buildFacebookCoverFrameQuestion(hook);
  const conflictLine = `${normalizeCopy(predator)} vs ${normalizeCopy(prey)}`;
  const documentaryLine = trimAtWordBoundary(
    normalizeCopy(hook),
    FACEBOOK_COVER_FRAME_MAX_LINE_LENGTH * FACEBOOK_COVER_FRAME_MAX_LINES
  ).replace(/[.]+$/g, "");

  return [
    createFacebookCoverFramePreset(
      "species_pressure",
      "Species + tension",
      "Facebook grid text with species first and a clear tension cue.",
      `${primarySpecies}: ${pressureCue.toLowerCase()}.`
    ),
    createFacebookCoverFramePresetFromLines(
      "species_question",
      "Species + question",
      "Question-style cover copy that asks about the behavior, not engagement.",
      [primarySpecies, safeQuestion]
    ),
    createFacebookCoverFramePreset(
      "conflict_statement",
      "Conflict statement",
      "Simple species-vs-species cover copy for shares and grid previews.",
      conflictLine
    ),
    createFacebookCoverFramePreset(
      "short_documentary",
      "Short documentary line",
      "A concise documentary-style cover line for the selected arc.",
      documentaryLine || `${primarySpecies}: ${arc.toLowerCase()}.`
    ),
    createFacebookCoverFramePresetFromLines(
      "two_line_cover",
      "Two-line cover preset",
      "Two-line cover text for Facebook grid readability and clean share previews.",
      [primarySpecies, pressureCue]
    ),
  ];
}
