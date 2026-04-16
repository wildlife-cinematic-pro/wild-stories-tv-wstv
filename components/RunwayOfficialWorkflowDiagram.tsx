"use client";

/**
 * RunwayOfficialWorkflowDiagram.tsx
 * Runway Safe Handoff Workflow — Auto Prompt Lane + Manual Prompt Lane
 *
 * Verification notes:
 *   • Official Runway help docs were used to live-verify Workflows semantics,
 *     available LLM models, and utility-node behavior for Extract Frame,
 *     First Frame, Last Frame, Trim, Stitch Videos, and Add Audio.
 *   • Current picker-label wording in this diagram follows the attached
 *     screenshots / user-provided picker list where the help center still uses
 *     older names such as JSON Parse, Trim Video, Stitch, and Claude Opus 4.5.
 *   • This diagram intentionally stays Runway-native in the main shot lane:
 *     Gen-4.5 handles Shot 1 → Shot 4, and First Frame remains QA-only.
 *   • A small side Parse JSON lane exposes export-only social fields from the
 *     same structured Claude response without becoming part of the render path.
 *
 * UX improvements vs previous version
 *   • Zoom pivots around the mouse cursor (Figma-style — world position
 *     under the cursor stays fixed after a zoom step)
 *   • Fit Screen button computes actual node bounds and fills the canvas
 *   • Zoom range extended: 12 % → 200 %
 *   • zoomRef / panRef keep the wheel handler free of stale-closure issues
 *   • Zoom ± buttons also pivot around the canvas centre
 */

import {
  useMemo,
  useRef,
  useState,
  useCallback,
  useEffect,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent  as ReactWheelEvent,
  type ReactNode,
} from "react";

// ─── TYPES ───────────────────────────────────────────────────────────────────
type PortKind  = "text" | "image" | "audio" | "video";
type Side      = "left" | "right";
type Point     = { x: number; y: number };

type PortDef = {
  id:        string;
  label:     string;
  kind:      PortKind;
  required?: boolean;
};

type NodeSpec = {
  id:          string;
  title:       string;
  subtitle?:   string;
  badge?:      string;
  width:       number;
  bg:          string;
  accent?:     string;
  dim?:        boolean;
  inputs:      PortDef[];
  outputs:     PortDef[];
  infoLines?:  string[];
};

type WireStyle = "main" | "reference" | "continuity" | "qa" | "audio" | "post" | "optional" | "manual" | "meta";

type WireDef = {
  from:    [string, string];
  to:      [string, string];
  style:   WireStyle;
  route?:  "h" | "v" | "pipe";
  pipeY?:  number;
};

type JsonRoute = {
  path:    string;
  target:  string;
  note?:   string;
};

// ─── COLORS ──────────────────────────────────────────────────────────────────
const PORT_COLORS: Record<PortKind, string> = {
  text:  "#f59e0b",
  image: "#3b82f6",
  audio: "#eab308",
  video: "#22c55e",
};

const WIRE_COLORS: Record<WireStyle, string> = {
  main:        "#60a5fa",
  reference:   "#34d399",
  continuity:  "#c084fc",
  qa:          "#fbbf24",
  audio:       "#eab308",
  post:        "#38bdf8",
  optional:    "#94a3b8",
  manual:      "#f97316",
  meta:        "#22d3ee",
};

const WIRE_STYLE_LABELS: Record<WireStyle, string> = {
  main: "Primary auto flow",
  reference: "Reference / anchor image",
  continuity: "Chosen continuity frame",
  qa: "First Frame QA",
  audio: "Audio lane",
  post: "Post processing",
  optional: "Optional / fast path",
  manual: "Optional manual override",
  meta: "Social export only",
};

const BG         = "#060c14";
const GRID_MINOR = "#101827";
const GRID_MAJOR = "#172335";
const BORDER     = "rgba(255,255,255,0.08)";
const TEXT_MAIN  = "#edf2f8";
const TEXT_SUB   = "#8fa3bd";
const TEXT_FAINT = "#5f738e";

const VIEW_W = 6000;
const VIEW_H = 1380;

// ─── LAYOUT CONSTANTS ────────────────────────────────────────────────────────
// Per-node header height is computed exactly so wire endpoints land on port dots.
const ROW_H      = 20;
const FOOTER_PAD = 10;
const BAR_H      = 4;
const PAD_TOP    = 8;
const BADGE_H    = 21;
const TITLE_H    = 14;
const SUBTITLE_H = 14;
const PORT_MARGIN = 10;
const DOT_OFFSET  = 5.5;

function nodeHeaderH(spec: NodeSpec): number {
  return (
    BAR_H +
    PAD_TOP +
    (spec.badge    ? BADGE_H    : 0) +
    TITLE_H +
    (spec.subtitle ? SUBTITLE_H : 0) +
    PORT_MARGIN
  );
}

function getNodeHeight(spec: NodeSpec): number {
  const rows      = Math.max(spec.inputs.length, spec.outputs.length, 1);
  const infoExtra = (spec.infoLines?.length ?? 0) * 11;
  return nodeHeaderH(spec) + rows * ROW_H + (infoExtra ? infoExtra + 10 : 0) + FOOTER_PAD;
}

function getPortDotY(spec: NodeSpec, index: number): number {
  return nodeHeaderH(spec) + index * ROW_H + DOT_OFFSET;
}

// ─── CURVE HELPERS ───────────────────────────────────────────────────────────
function hCurve(a: Point, b: Point, strength = 72) {
  return `M ${a.x} ${a.y} C ${a.x + strength} ${a.y}, ${b.x - strength} ${b.y}, ${b.x} ${b.y}`;
}
function vCurve(a: Point, b: Point) {
  const m = (a.y + b.y) / 2;
  return `M ${a.x} ${a.y} C ${a.x} ${m}, ${b.x} ${m}, ${b.x} ${b.y}`;
}
function pipeCurve(a: Point, b: Point, pipeY: number, radius = 34) {
  return [
    `M ${a.x} ${a.y}`,
    `C ${a.x} ${a.y + radius}, ${a.x} ${pipeY - radius}, ${a.x} ${pipeY}`,
    `L ${b.x} ${pipeY}`,
    `C ${b.x} ${pipeY + radius}, ${b.x} ${b.y - radius}, ${b.x} ${b.y}`,
  ].join(" ");
}

function makeNode(id: string, cfg: Omit<NodeSpec, "id">): NodeSpec {
  return { id, ...cfg };
}

// ─── NODE SPECS ──────────────────────────────────────────────────────────────
// "Manual Shot 1/2/3/4 Prompt" and "Manual SFX Prompt" nodes are standard Text
// input nodes (official Runway Input node type) used only as optional operator overrides.
const NODE_SPECS: NodeSpec[] = [
  // ── INPUT NODES (official Runway type) ──
  makeNode("text_system", {
    title: "Text", subtitle: "System Prompt",
    badge: "INPUT", width: 184, bg: "#0c1520",
    inputs:  [],
    outputs: [{ id: "text", label: "Text", kind: "text" }],
    infoLines: ["Auto mode rules + JSON format instructions"],
  }),
  makeNode("text_story", {
    title: "Text", subtitle: "Story Brief",
    badge: "INPUT", width: 184, bg: "#0c1520",
    inputs:  [],
    outputs: [{ id: "text", label: "Text", kind: "text" }],
    infoLines: ["Predator, prey, habitat, conflict arc"],
  }),
  makeNode("handoff_anchor", {
    title: "Image", subtitle: "Master / Handoff Anchor",
    badge: "INPUT", width: 214, bg: "#0c1520",
    inputs:  [],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
    infoLines: ["Clean two-subject setup image"],
  }),
  makeNode("audio_alt", {
    title: "Audio", subtitle: "Alternative Final Mix",
    badge: "INPUT", width: 200, bg: "#0c1520",
    inputs:  [],
    outputs: [{ id: "audio", label: "Audio", kind: "audio" }],
    infoLines: ["Use instead of generated SFX"],
  }),

  // ── LLM NODE — picker label follows current screenshots ──
  // Official Runway docs still list Claude Opus 4.5 as an available LLM model.
  makeNode("llm", {
    title: "Claude",
    subtitle: "LLM Node",
    badge: "LLM", width: 248, bg: "#14092e", accent: "#f97316",
    inputs: [
      { id: "system", label: "System", kind: "text",  required: true },
      { id: "brief",  label: "Prompt", kind: "text",  required: true },
    ],
    outputs: [{ id: "json", label: "Text (JSON)", kind: "text" }],
    infoLines: ["Picker label follows current screenshots"],
  }),

  // ── PARSE JSON — picker label follows current screenshots ──
  makeNode("json_parse", {
    title: "Parse JSON", subtitle: "Core Prompt Routes",
    badge: "UTILITY", width: 328, bg: "#07121d", accent: "#16a34a",
    inputs:  [{ id: "json", label: "Text (JSON)", kind: "text", required: true }],
    outputs: [
      { id: "shot1", label: "shots.0.motion_prompt", kind: "text" },
      { id: "shot2", label: "shots.1.motion_prompt", kind: "text" },
      { id: "shot3", label: "shots.2.motion_prompt", kind: "text" },
      { id: "shot4", label: "shots.3.motion_prompt", kind: "text" },
      { id: "sfx",   label: "audio.sfx_prompt",       kind: "text" },
    ],
    infoLines: ["Primary render-pipeline outputs only"],
  }),
  makeNode("json_parse_meta", {
    title: "Parse JSON", subtitle: "Meta / Social Outputs",
    badge: "UTILITY", width: 300, bg: "#071520", accent: "#22d3ee",
    inputs:  [{ id: "json", label: "Text (JSON)", kind: "text", required: true }],
    outputs: [
      { id: "hook", label: "hook", kind: "text" },
      { id: "caption", label: "caption", kind: "text" },
      { id: "hashtags", label: "hashtags", kind: "text" },
      { id: "tags", label: "tags", kind: "text" },
    ],
    infoLines: ["Export only — not part of the render pipeline"],
  }),

  // ── MANUAL PROMPT NODES (operator-named Text input nodes) ──
  makeNode("manual_shot1", {
    title: "Text", subtitle: "Optional Manual Shot 1 Prompt",
    badge: "MANUAL", width: 214, bg: "#1a1207", accent: "#f97316",
    inputs:  [],
    outputs: [{ id: "text", label: "Text", kind: "text" }],
    infoLines: ["Optional override — use instead of auto Shot 1 prompt"],
  }),
  makeNode("manual_shot2", {
    title: "Text", subtitle: "Optional Manual Shot 2 Prompt",
    badge: "MANUAL", width: 214, bg: "#1a1207", accent: "#f97316",
    inputs:  [],
    outputs: [{ id: "text", label: "Text", kind: "text" }],
    infoLines: ["Optional override — use instead of auto Shot 2 prompt"],
  }),
  makeNode("manual_shot3", {
    title: "Text", subtitle: "Optional Manual Shot 3 Prompt",
    badge: "MANUAL", width: 214, bg: "#1a1207", accent: "#f97316",
    inputs:  [],
    outputs: [{ id: "text", label: "Text", kind: "text" }],
    infoLines: ["Optional override — use instead of auto Shot 3 prompt"],
  }),
  makeNode("manual_shot4", {
    title: "Text", subtitle: "Optional Manual Shot 4 Prompt",
    badge: "MANUAL", width: 214, bg: "#1a1207", accent: "#f97316",
    inputs:  [],
    outputs: [{ id: "text", label: "Text", kind: "text" }],
    infoLines: ["Optional override — use instead of auto Shot 4 prompt"],
  }),
  makeNode("manual_sfx", {
    title: "Text", subtitle: "Optional Manual SFX Prompt",
    badge: "MANUAL", width: 214, bg: "#1a1207", accent: "#f97316",
    inputs:  [],
    outputs: [{ id: "text", label: "Text", kind: "text" }],
    infoLines: ["Optional override — use instead of auto SFX prompt"],
  }),
  makeNode("manual_hook", {
    title: "Text", subtitle: "Optional Manual Hook",
    badge: "MANUAL", width: 214, bg: "#1a1207", accent: "#f97316",
    inputs:  [],
    outputs: [{ id: "text", label: "Text", kind: "text" }],
    infoLines: ["Optional export-text override — type hook directly here"],
  }),
  makeNode("manual_caption", {
    title: "Text", subtitle: "Optional Manual Caption",
    badge: "MANUAL", width: 214, bg: "#1a1207", accent: "#f97316",
    inputs:  [],
    outputs: [{ id: "text", label: "Text", kind: "text" }],
    infoLines: ["Optional export-text override — type caption directly here"],
  }),
  makeNode("manual_hashtags", {
    title: "Text", subtitle: "Optional Manual Hashtags",
    badge: "MANUAL", width: 214, bg: "#1a1207", accent: "#f97316",
    inputs:  [],
    outputs: [{ id: "text", label: "Text", kind: "text" }],
    infoLines: ["Optional export-text override — type hashtags directly here"],
  }),
  makeNode("manual_tags", {
    title: "Text", subtitle: "Optional Manual Tags",
    badge: "MANUAL", width: 214, bg: "#1a1207", accent: "#f97316",
    inputs:  [],
    outputs: [{ id: "text", label: "Text", kind: "text" }],
    infoLines: ["Optional export-text override — type tags directly here"],
  }),

  // ── GEN-4.5 SHOTS — official Runway model ──
  makeNode("shot1", {
    title: "Gen-4.5", subtitle: "Image to Video · Shot 1",
    badge: "MODEL", width: 250, bg: "#060f28", accent: "#60a5fa",
    inputs: [
      { id: "image",  label: "Image",  kind: "image", required: true },
      { id: "prompt", label: "Prompt", kind: "text",  required: true },
    ],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
    infoLines: ["Use the clean two-subject anchor as first frame"],
  }),

  // ── FIRST FRAME — official Runway utility node ──
  makeNode("first1", {
    title: "First Frame", subtitle: "Shot 1 QA",
    badge: "UTILITY", width: 192, bg: "#100c00", accent: "#fbbf24",
    dim: true,
    inputs:  [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
    infoLines: ["Check opening identity — official node"],
  }),

  // ── TRIM — picker label follows current screenshots ──
  makeNode("trim_h1", {
    title: "Trim", subtitle: "Safe Handoff Prep 1",
    badge: "UTILITY", width: 206, bg: "#071318", accent: "#38bdf8",
    inputs:  [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
    infoLines: ["Remove weak ending before handoff"],
  }),

  // ── EXTRACT FRAME — official Runway utility node ──
  makeNode("pick_h1", {
    title: "Extract Frame", subtitle: "Manual Handoff 1",
    badge: "UTILITY", width: 216, bg: "#041420", accent: "#34d399",
    inputs:  [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
    infoLines: ["Pick frame where both subjects are visible"],
  }),

  // ── LAST FRAME — official Runway utility node ──
  makeNode("last1", {
    title: "Last Frame", subtitle: "Fast Optional Handoff 1",
    badge: "UTILITY", width: 220, bg: "#1a0544", accent: "#c084fc",
    dim: true,
    inputs:  [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
    infoLines: ["Use only if final frame is already clean"],
  }),

  // ── SHOT 2 ──
  makeNode("shot2", {
    title: "Gen-4.5", subtitle: "Image to Video · Shot 2",
    badge: "MODEL", width: 250, bg: "#060f28", accent: "#60a5fa",
    inputs: [
      { id: "image",  label: "Image",  kind: "image", required: true },
      { id: "prompt", label: "Prompt", kind: "text",  required: true },
    ],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
    infoLines: ["Main handoff from Extract Frame"],
  }),
  makeNode("first2", {
    title: "First Frame", subtitle: "Shot 2 QA",
    badge: "UTILITY", width: 192, bg: "#100c00", accent: "#fbbf24",
    dim: true,
    inputs:  [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
    infoLines: ["Check continuity before Shot 3"],
  }),
  makeNode("trim_h2", {
    title: "Trim", subtitle: "Safe Handoff Prep 2",
    badge: "UTILITY", width: 206, bg: "#071318", accent: "#38bdf8",
    inputs:  [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
    infoLines: ["Remove weak ending before handoff"],
  }),
  makeNode("pick_h2", {
    title: "Extract Frame", subtitle: "Manual Handoff 2",
    badge: "UTILITY", width: 216, bg: "#041420", accent: "#34d399",
    inputs:  [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
    infoLines: ["Pick clean two-subject frame"],
  }),
  makeNode("last2", {
    title: "Last Frame", subtitle: "Fast Optional Handoff 2",
    badge: "UTILITY", width: 220, bg: "#1a0544", accent: "#c084fc",
    dim: true,
    inputs:  [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
    infoLines: ["Use only if final frame is clean"],
  }),

  // ── SHOT 3 ──
  makeNode("shot3", {
    title: "Gen-4.5", subtitle: "Image to Video · Shot 3",
    badge: "MODEL", width: 250, bg: "#060f28", accent: "#60a5fa",
    inputs: [
      { id: "image",  label: "Image",  kind: "image", required: true },
      { id: "prompt", label: "Prompt", kind: "text",  required: true },
    ],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
    infoLines: ["Final beat with clean end for stitch"],
  }),
  makeNode("first3", {
    title: "First Frame", subtitle: "Shot 3 QA",
    badge: "UTILITY", width: 192, bg: "#100c00", accent: "#fbbf24",
    dim: true,
    inputs:  [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
    infoLines: ["Final opening-frame check"],
  }),
  makeNode("trim_h3", {
    title: "Trim", subtitle: "Safe Handoff Prep 3",
    badge: "UTILITY", width: 206, bg: "#071318", accent: "#38bdf8",
    inputs:  [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
    infoLines: ["Remove weak ending before handoff"],
  }),
  makeNode("pick_h3", {
    title: "Extract Frame", subtitle: "Manual Handoff 3",
    badge: "UTILITY", width: 216, bg: "#041420", accent: "#34d399",
    inputs:  [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
    infoLines: ["Pick clean two-subject frame"],
  }),
  makeNode("last3", {
    title: "Last Frame", subtitle: "Fast Optional Handoff 3",
    badge: "UTILITY", width: 220, bg: "#1a0544", accent: "#c084fc",
    dim: true,
    inputs:  [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
    infoLines: ["Use only if final frame is clean"],
  }),

  // ── SHOT 4 ──
  makeNode("shot4", {
    title: "Gen-4.5", subtitle: "Image to Video · Shot 4",
    badge: "MODEL", width: 250, bg: "#060f28", accent: "#60a5fa",
    inputs: [
      { id: "image",  label: "Image",  kind: "image", required: true },
      { id: "prompt", label: "Prompt", kind: "text",  required: true },
    ],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
    infoLines: ["Final beat with clean end for stitch"],
  }),
  makeNode("first4", {
    title: "First Frame", subtitle: "Shot 4 QA",
    badge: "UTILITY", width: 192, bg: "#100c00", accent: "#fbbf24",
    dim: true,
    inputs:  [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
    infoLines: ["Final opening-frame check"],
  }),

  // ── TEXT TO SFX — official Runway audio node ──
  makeNode("sfx", {
    title: "Text to SFX", subtitle: "Ambience / impacts",
    badge: "AUDIO", width: 214, bg: "#0e0d00", accent: "#eab308",
    inputs:  [{ id: "text", label: "Text", kind: "text", required: true }],
    outputs: [{ id: "audio", label: "Audio", kind: "audio" }],
    infoLines: ["Official Runway audio node — confirmed"],
  }),

  // ── STITCH — official Runway utility node ──
  makeNode("stitch", {
    title: "Stitch Videos", subtitle: "Ordered shots",
    badge: "UTILITY", width: 232, bg: "#0d0220", accent: "#16a34a",
    inputs: [
      { id: "s1", label: "Input 1", kind: "video", required: true },
      { id: "s2", label: "Input 2", kind: "video", required: true },
      { id: "s3", label: "Input 3", kind: "video", required: true },
      { id: "s4", label: "Input 4", kind: "video", required: true },
    ],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
    infoLines: ["Input order is playback order — official node"],
  }),

  // ── TRIM VIDEO (final) ──
  makeNode("trim_final", {
    title: "Trim", subtitle: "Final Runtime Cleanup",
    badge: "UTILITY", width: 214, bg: "#071318", accent: "#38bdf8",
    inputs:  [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
    infoLines: ["Remove weak heads and tails"],
  }),

  // ── ADD AUDIO — official Runway utility node ──
  makeNode("add_audio", {
    title: "Add Audio", subtitle: "Replace audio track",
    badge: "UTILITY", width: 208, bg: "#0a0c00", accent: "#eab308",
    inputs: [
      { id: "video", label: "Video", kind: "video", required: true },
      { id: "audio", label: "Audio", kind: "audio", required: true },
    ],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
    infoLines: ["Official Runway utility node"],
  }),

  // ── UPSCALE VIDEO — current picker wording from screenshots ──
  makeNode("upscale", {
    title: "Upscale Video - Topaz AI", subtitle: "Final Master",
    badge: "POST", width: 270, bg: "#030d1a", accent: "#38bdf8",
    inputs:  [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
    infoLines: ["Picker wording follows current screenshots"],
  }),

  // ── EXTRACT FRAME (thumbnail) — official node ──
  makeNode("extract_thumb", {
    title: "Extract Frame", subtitle: "Thumbnail / Reuse",
    badge: "UTILITY", width: 214, bg: "#041420", accent: "#94a3b8",
    inputs:  [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
    infoLines: ["Grab final hero frame for thumbnail"],
  }),
];

// ─── POSITIONS ───────────────────────────────────────────────────────────────
const DEFAULT_POSITIONS: Record<string, Point> = {
  text_system:   { x: 30,   y: 96  },
  text_story:    { x: 30,   y: 238 },
  handoff_anchor:{ x: 30,   y: 380 },
  audio_alt:     { x: 30,   y: 522 },

  llm:       { x: 330, y: 210 },
  json_parse:{ x: 664, y: 140 },
  json_parse_meta:{ x: 664, y: 460 },
  manual_hook:     { x: 980, y: 458 },
  manual_caption:  { x: 980, y: 570 },
  manual_hashtags: { x: 980, y: 682 },
  manual_tags:     { x: 980, y: 794 },

  manual_shot1: { x: 1064, y: 690 },
  manual_shot2: { x: 1884, y: 690 },
  manual_shot3: { x: 2704, y: 690 },
  manual_shot4: { x: 3524, y: 690 },
  manual_sfx:   { x: 3828, y: 950 },

  shot1:   { x: 1064, y: 94  },
  first1:  { x: 1064, y: 492 },
  trim_h1: { x: 1344, y: 94  },
  pick_h1: { x: 1584, y: 94  },
  last1:   { x: 1584, y: 310 },

  shot2:   { x: 1884, y: 94  },
  first2:  { x: 1884, y: 492 },
  trim_h2: { x: 2164, y: 94  },
  pick_h2: { x: 2404, y: 94  },
  last2:   { x: 2404, y: 310 },

  shot3:  { x: 2704, y: 94  },
  first3: { x: 2704, y: 492 },
  trim_h3:{ x: 2984, y: 94  },
  pick_h3:{ x: 3224, y: 94  },
  last3:  { x: 3224, y: 310 },

  shot4:  { x: 3524, y: 94  },
  first4: { x: 3524, y: 492 },

  sfx: { x: 3828, y: 950 },

  stitch:      { x: 4128, y: 252 },
  trim_final:  { x: 4414, y: 252 },
  add_audio:   { x: 4708, y: 252 },
  upscale:     { x: 4998, y: 252 },
  extract_thumb:{ x: 5272, y: 252 },
};

// ─── WIRES ───────────────────────────────────────────────────────────────────
const WIRES: WireDef[] = [
  // Inputs → LLM
  { from: ["text_system", "text"], to: ["llm", "system"], style: "main" },
  { from: ["text_story",  "text"], to: ["llm", "brief"],  style: "main" },

  // LLM → Parse JSON
  { from: ["llm", "json"], to: ["json_parse", "json"], style: "main" },
  { from: ["llm", "json"], to: ["json_parse_meta", "json"], style: "meta", route: "v" },

  // Anchor image → Shot 1
  { from: ["handoff_anchor", "image"], to: ["shot1", "image"], style: "reference" },

  // Parse JSON auto prompt → Shot 1
  { from: ["json_parse",   "shot1"], to: ["shot1",   "prompt"], style: "main"   },
  // Manual prompt → Shot 1 (optional override; use either auto or manual, not both)
  { from: ["manual_shot1", "text"],  to: ["shot1",   "prompt"], style: "manual", route: "v" },

  // Shot 1 → QA (First Frame)
  { from: ["shot1", "video"], to: ["first1", "video"], style: "qa",       route: "v" },

  // Shot 1 → Main handoff path (Trim → Extract Frame)
  { from: ["shot1",   "video"], to: ["trim_h1", "video"], style: "main" },
  { from: ["trim_h1", "video"], to: ["pick_h1", "video"], style: "post" },

  // Shot 1 → Fast optional Last Frame path
  { from: ["shot1", "video"], to: ["last1", "video"], style: "optional", route: "v" },

  // Chosen handoff → Shot 2 image
  { from: ["pick_h1", "image"], to: ["shot2", "image"], style: "continuity" },
  { from: ["last1",   "image"], to: ["shot2", "image"], style: "optional"   },

  // Parse JSON auto prompt → Shot 2
  { from: ["json_parse",   "shot2"], to: ["shot2", "prompt"], style: "main"   },
  { from: ["manual_shot2", "text"],  to: ["shot2", "prompt"], style: "manual", route: "v" },

  // Shot 2 → QA
  { from: ["shot2", "video"], to: ["first2", "video"], style: "qa", route: "v" },

  // Shot 2 → Main handoff path
  { from: ["shot2",   "video"], to: ["trim_h2", "video"], style: "main" },
  { from: ["trim_h2", "video"], to: ["pick_h2", "video"], style: "post" },

  // Shot 2 → Fast optional Last Frame
  { from: ["shot2", "video"], to: ["last2", "video"], style: "optional", route: "v" },

  // Chosen handoff → Shot 3 image
  { from: ["pick_h2", "image"], to: ["shot3", "image"], style: "continuity" },
  { from: ["last2",   "image"], to: ["shot3", "image"], style: "optional"   },

  // Parse JSON auto prompt → Shot 3
  { from: ["json_parse",   "shot3"], to: ["shot3", "prompt"], style: "main"   },
  { from: ["manual_shot3", "text"],  to: ["shot3", "prompt"], style: "manual", route: "v" },

  // Shot 3 → QA
  { from: ["shot3", "video"], to: ["first3", "video"], style: "qa", route: "v" },

  // Shot 3 → Main handoff path
  { from: ["shot3",   "video"], to: ["trim_h3", "video"], style: "main" },
  { from: ["trim_h3", "video"], to: ["pick_h3", "video"], style: "post" },

  // Shot 3 → Fast optional Last Frame
  { from: ["shot3", "video"], to: ["last3", "video"], style: "optional", route: "v" },

  // Chosen handoff → Shot 4 image
  { from: ["pick_h3", "image"], to: ["shot4", "image"], style: "continuity" },
  { from: ["last3",   "image"], to: ["shot4", "image"], style: "optional"   },

  // Parse JSON auto prompt → Shot 4
  { from: ["json_parse",   "shot4"], to: ["shot4", "prompt"], style: "main"   },
  { from: ["manual_shot4", "text"],  to: ["shot4", "prompt"], style: "manual", route: "v" },

  // Shot 4 → QA
  { from: ["shot4", "video"], to: ["first4", "video"], style: "qa", route: "v" },

  // Audio lane — Text to SFX (from Parse JSON or manual)
  { from: ["json_parse", "sfx"],   to: ["sfx", "text"], style: "audio",  route: "pipe", pipeY: 880 },
  { from: ["manual_sfx", "text"],  to: ["sfx", "text"], style: "manual", route: "h"                },

  // SFX → Add Audio
  { from: ["sfx",       "audio"], to: ["add_audio", "audio"], style: "audio",    route: "pipe", pipeY: 1045 },
  // Alternative audio input
  { from: ["audio_alt", "audio"], to: ["add_audio", "audio"], style: "optional", route: "pipe", pipeY: 1140 },

  // Shots → Stitch Videos (pipe routes bring four video streams into stitch)
  { from: ["shot1", "video"], to: ["stitch", "s1"], style: "main", route: "pipe", pipeY: 560 },
  { from: ["shot2", "video"], to: ["stitch", "s2"], style: "main", route: "pipe", pipeY: 595 },
  { from: ["shot3", "video"], to: ["stitch", "s3"], style: "main", route: "pipe", pipeY: 630 },
  { from: ["shot4", "video"], to: ["stitch", "s4"], style: "main", route: "pipe", pipeY: 665 },

  // Post-processing chain
  { from: ["stitch",     "video"], to: ["trim_final", "video"], style: "post" },
  { from: ["trim_final", "video"], to: ["add_audio",  "video"], style: "post" },
  { from: ["add_audio",  "video"], to: ["upscale",    "video"], style: "post" },
  { from: ["upscale",    "video"], to: ["extract_thumb","video"],style: "optional" },
];

// ─── WIRE MARKER ID ──────────────────────────────────────────────────────────
function markerId(style: WireStyle): string {
  const m: Record<WireStyle, string> = {
    main:       "arr-main",
    reference:  "arr-reference",
    qa:         "arr-qa",
    continuity: "arr-continuity",
    audio:      "arr-audio",
    post:       "arr-post",
    optional:   "arr-optional",
    manual:     "arr-manual",
    meta:       "arr-meta",
  };
  return m[style];
}

// ─── SECTION LABEL ───────────────────────────────────────────────────────────
function SectionLabel({ x, y, text, color = "#2b3b50" }: { x: number; y: number; text: string; color?: string }) {
  return (
    <div style={{
      position: "absolute", left: x, top: y,
      color, fontSize: 8, fontWeight: 700,
      letterSpacing: "0.12em", textTransform: "uppercase",
      pointerEvents: "none", whiteSpace: "nowrap",
    }}>
      {text}
    </div>
  );
}

// ─── NODE BOX ────────────────────────────────────────────────────────────────
function NodeBox({
  spec, pos, onPointerDown,
}: {
  spec: NodeSpec; pos: Point;
  onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void;
}) {
  const height = getNodeHeight(spec);
  const rows   = Math.max(spec.inputs.length, spec.outputs.length, 1);

  return (
    <div
      onPointerDown={onPointerDown}
      style={{
        position: "absolute", left: pos.x, top: pos.y,
        width: spec.width, height, background: spec.bg,
        border: spec.accent ? `1.5px solid ${spec.accent}88` : `1px solid ${BORDER}`,
        borderRadius: 10,
        boxShadow: spec.accent ? `0 0 0 3px ${spec.accent}18, 0 8px 26px rgba(0,0,0,0.55)` : "0 8px 22px rgba(0,0,0,0.45)",
        opacity: spec.dim ? 0.72 : 1, userSelect: "none", overflow: "hidden",
      }}
    >
      <div style={{ height: BAR_H, background: spec.accent ? `linear-gradient(90deg, ${spec.accent}, ${spec.accent}99)` : "rgba(255,255,255,0.06)" }} />
      <div style={{ padding: "8px 10px 8px", height: `calc(100% - ${BAR_H}px)`, boxSizing: "border-box", cursor: "grab" }}>
        {spec.badge && (
          <div style={{
            display: "inline-block", marginBottom: 6, padding: "2px 7px",
            borderRadius: 999, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
            color: spec.accent ?? "#93c5fd", background: "rgba(255,255,255,0.05)",
          }}>
            {spec.badge}
          </div>
        )}
        <div style={{ color: spec.accent ? "#f5f3ff" : TEXT_MAIN, fontSize: 12.5, fontWeight: 700, lineHeight: 1.15 }}>
          {spec.title}
        </div>
        {spec.subtitle && (
          <div style={{ color: TEXT_SUB, fontSize: 9, marginTop: 2, lineHeight: 1.3 }}>
            {spec.subtitle}
          </div>
        )}
        <div style={{ position: "relative", marginTop: PORT_MARGIN, minHeight: rows * ROW_H }}>
          {Array.from({ length: rows }).map((_, i) => {
            const input  = spec.inputs[i];
            const output = spec.outputs[i];
            return (
              <div key={i} style={{ position: "absolute", left: 0, top: i * ROW_H, width: "100%", height: ROW_H }}>
                {input && (
                  <>
                    <div style={{
                      position: "absolute", left: -15, top: ROW_H / 2 - 4.5,
                      width: 9, height: 9, borderRadius: 999,
                      background: PORT_COLORS[input.kind], border: "1.5px solid #09111b",
                    }} />
                    <div style={{ position: "absolute", left: 0, top: 2, fontSize: 8.5, color: TEXT_SUB, whiteSpace: "nowrap" }}>
                      {input.label}{input.required ? "*" : ""}
                    </div>
                  </>
                )}
                {output && (
                  <>
                    <div style={{
                      position: "absolute", right: -15, top: ROW_H / 2 - 4.5,
                      width: 9, height: 9, borderRadius: 999,
                      background: PORT_COLORS[output.kind], border: "1.5px solid #09111b",
                    }} />
                    <div style={{
                      position: "absolute", right: 0, top: 2, fontSize: 8.5,
                      color: output.kind === "text" ? "#dbeafe" : TEXT_SUB,
                      whiteSpace: "nowrap", textAlign: "right",
                    }}>
                      {output.label}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
        {spec.infoLines && (
          <div style={{ marginTop: 8 }}>
            {spec.infoLines.map((line, i) => (
              <div key={i} style={{ color: i === 0 ? "#6f86a1" : TEXT_FAINT, fontSize: 8, lineHeight: 1.45, marginTop: i === 0 ? 0 : 2 }}>
                {line}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CONTROL BUTTON ──────────────────────────────────────────────────────────
const controlBtnStyle: CSSProperties = {
  height: 30, borderRadius: 8,
  border: `1px solid ${BORDER}`, background: "#0f1928",
  color: "#607898", cursor: "pointer", fontSize: 14,
  display: "flex", alignItems: "center", justifyContent: "center",
  padding: "0 10px", whiteSpace: "nowrap",
};

// ─── INFO CARD ───────────────────────────────────────────────────────────────
function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ flex: "1 1 0", padding: "16px 18px", minWidth: 240 }}>
      <div style={{ color: "#93b8d8", fontSize: 10, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ color: TEXT_SUB, fontSize: 10, lineHeight: 1.65 }}>{children}</div>
    </div>
  );
}

// ─── JSON ROUTE TABLE ────────────────────────────────────────────────────────
const JSON_EXAMPLE = `{
  "shots": [
    {
      "motion_prompt": "Same exact subjects as the handoff image. Both animals remain fully visible. Clean readable spacing. One controlled action only. End on a stable readable hold."
    },
    {
      "motion_prompt": "Same exact subjects and continuity as the prior handoff image. Both animals remain visible in frame. Preserve proportions, spacing, coat detail, and environment continuity."
    },
    {
      "motion_prompt": "Same exact subjects. Final payoff beat. Keep both animals readable. No subject exits frame. End clean for stitch."
    },
    {
      "motion_prompt": "Same exact subjects. Closing payoff beat. Keep both animals readable, preserve identity, and end on a stable final hold for stitch."
    }
  ],
  "audio": {
    "sfx_prompt": "cold mountain meadow ambience, light winter wind, frosted grass movement, subtle hoof steps"
  },
  "hook": "A mountain lion freezes the moment the deer finally spots the ambush.",
  "caption": "Four linked wildlife shots built for clean safe handoffs, readable spacing, and a stitched final payoff.",
  "hashtags": "#wildlife #cinematic #runway #storytelling",
  "tags": "mountain lion, deer, meadow, predator, prey"
}`;

const SYSTEM_PROMPT_TEMPLATE = `You are building motion prompts and social export text for a multi-shot wildlife continuity workflow.

Rules:
- Preserve exact subject identities from the provided handoff image.
- Keep both animals visible unless explicitly asked for a single-subject shot.
- Preserve proportions, coat pattern, antler/horn shape, scale, and environment continuity.
- Prioritize readable spacing and full-body clarity.
- Never let a subject leave frame in the final moment of a shot.
- Write image-to-video prompts — focus on motion and shot behaviour.
- Use simple realistic wildlife motion.
- Prefer one primary action per shot.
- End each shot on a stable readable hold suitable for handoff.

Output JSON:
{
  "shots": [
    { "motion_prompt": "..." },
    { "motion_prompt": "..." },
    { "motion_prompt": "..." },
    { "motion_prompt": "..." }
  ],
  "audio": {
    "sfx_prompt": "..."
  },
  "hook": "...",
  "caption": "...",
  "hashtags": "...",
  "tags": "..."
}`;

const MANUAL_PROMPT_TEMPLATE = `Same exact subjects as the handoff image. Both animals remain visible in frame. Clean readable spacing. One clear action only. Natural realistic motion. End on a stable readable hold. No subject exits frame.`;

const JSON_ROUTES: JsonRoute[] = [
  { path: "shots.0.motion_prompt", target: "Shot 1 · prompt input"   },
  { path: "shots.1.motion_prompt", target: "Shot 2 · prompt input"   },
  { path: "shots.2.motion_prompt", target: "Shot 3 · prompt input"   },
  { path: "shots.3.motion_prompt", target: "Shot 4 · prompt input"   },
  { path: "audio.sfx_prompt",       target: "Text to SFX · text input" },
  { path: "hook",                   target: "Social export side lane", note: "hook · export only" },
  { path: "caption",                target: "Social export side lane", note: "caption · export only" },
  { path: "hashtags",               target: "Social export side lane", note: "hashtags · export only" },
  { path: "tags",                   target: "Social export side lane", note: "optional tags · export only" },
];

const WORKFLOW_NOTES = [
  "This file is the Runway-native 4-shot safe-handoff reference workflow.",
  "Main handoff path: Shot → Trim → Extract Frame → next shot's Image input.",
  "Extract Frame lets you choose a frame where both animals are still clearly visible.",
  "Last Frame is the fast optional path — only use it when the final frame is already clean.",
  "First Frame nodes are QA only and never feed the next shot.",
  "If the ending loses one subject, do not pass that frame forward. Use the anchor or re-generate.",
  "Use one source per target at a time: auto JSON route OR the matching optional manual Text node.",
  "Optional manual Text nodes also cover SFX plus hook, caption, hashtags, and tags when you want direct operator entry.",
  "hook, caption, hashtags, and tags are export-only side outputs from the same Claude JSON response.",
];

const PROMPT_GUIDE = [
  "Keep prompts motion-focused, but repeat identity anchors in every shot.",
  "Always state that both animals remain visible and readable.",
  "Ask for clean spacing and no subject leaving frame at the end.",
  "Prefer one clear action per shot instead of stacked actions.",
  "End each shot on a stable hold for easier handoff.",
  "Avoid contradictory motion against the input image posture.",
];

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function RunwayOfficialWorkflowDiagram() {
  const specMap = useMemo(
    () => Object.fromEntries(NODE_SPECS.map((n) => [n.id, n] as const)),
    []
  );

  const [positions, setPositions] = useState<Record<string, Point>>(DEFAULT_POSITIONS);
  const [zoom, setZoom]           = useState(0.30);
  const [pan,  setPan]            = useState<Point>({ x: 10, y: 10 });
  const [dragKind, setDragKind]   = useState<"canvas" | "node" | null>(null);
  const [hoveredWireIdx, setHoveredWireIdx] = useState<number | null>(null);
  const [selectedWireIdx, setSelectedWireIdx] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef      = useRef(0.30);
  const panRef       = useRef<Point>({ x: 10, y: 10 });

  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panRef.current  = pan;  }, [pan]);

  const dragRef = useRef<
    | { kind: "canvas"; x: number; y: number }
    | { kind: "node";   id: string; x: number; y: number }
    | null
  >(null);

  const getRect = useCallback((id: string) => {
    const spec = specMap[id];
    const pos  = positions[id];
    return { x: pos.x, y: pos.y, w: spec.width, h: getNodeHeight(spec) };
  }, [positions, specMap]);

  const getPortPoint = useCallback((nodeId: string, portId: string, side: Side): Point => {
    const spec  = specMap[nodeId];
    const rect  = getRect(nodeId);
    const ports = side === "left" ? spec.inputs : spec.outputs;
    const index = Math.max(0, ports.findIndex((p) => p.id === portId));
    return {
      x: side === "left" ? rect.x : rect.x + rect.w,
      y: rect.y + getPortDotY(spec, index),
    };
  }, [getRect, specMap]);

  const getNodeLabel = useCallback((nodeId: string) => {
    const spec = specMap[nodeId];
    return spec.subtitle ? `${spec.title} — ${spec.subtitle}` : spec.title;
  }, [specMap]);

  const getPortLabel = useCallback((nodeId: string, portId: string, side: Side) => {
    const ports = side === "left" ? specMap[nodeId].inputs : specMap[nodeId].outputs;
    return ports.find((port) => port.id === portId)?.label ?? portId;
  }, [specMap]);

  const activeWireIdx = hoveredWireIdx ?? selectedWireIdx;
  const activeWireDetails = useMemo(() => {
    if (activeWireIdx == null) return null;

    const wire = WIRES[activeWireIdx];

    return {
      color: WIRE_COLORS[wire.style],
      styleLabel: WIRE_STYLE_LABELS[wire.style],
      from: getPortPoint(wire.from[0], wire.from[1], "right"),
      to: getPortPoint(wire.to[0], wire.to[1], "left"),
      fromNode: getNodeLabel(wire.from[0]),
      fromPort: getPortLabel(wire.from[0], wire.from[1], "right"),
      toNode: getNodeLabel(wire.to[0]),
      toPort: getPortLabel(wire.to[0], wire.to[1], "left"),
    };
  }, [activeWireIdx, getNodeLabel, getPortLabel, getPortPoint]);

  // ── Fit screen ─────────────────────────────────────────────────────────────
  const fitScreen = useCallback(() => {
    if (!containerRef.current) return;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    NODE_SPECS.forEach((spec) => {
      const pos = positions[spec.id];
      if (!pos) return;
      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x + spec.width);
      maxY = Math.max(maxY, pos.y + getNodeHeight(spec));
    });

    const pad = 60;
    const nz = Math.max(0.12, Math.min(1.4, Math.min(
      (cw - pad * 2) / (maxX - minX),
      (ch - pad * 2) / (maxY - minY),
    )));
    const np = {
      x: (cw - (maxX - minX) * nz) / 2 - minX * nz,
      y: (ch - (maxY - minY) * nz) / 2 - minY * nz,
    };
    zoomRef.current = nz;
    panRef.current  = np;
    setZoom(nz);
    setPan(np);
  }, [positions]);

  // ── Pointer handlers ────────────────────────────────────────────────────────
  const onCanvasPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    setSelectedWireIdx(null);
    setHoveredWireIdx(null);
    dragRef.current = { kind: "canvas", x: e.clientX, y: e.clientY };
    setDragKind("canvas");
  }, []);

  const onNodePointerDown = useCallback(
    (id: string) => (e: ReactPointerEvent<HTMLDivElement>) => {
      e.stopPropagation();
      dragRef.current = { kind: "node", id, x: e.clientX, y: e.clientY };
      setDragKind("node");
    }, []
  );

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    dragRef.current = { ...drag, x: e.clientX, y: e.clientY };
    if (drag.kind === "canvas") {
      setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
    } else {
      setPositions((prev) => ({
        ...prev,
        [drag.id]: {
          x: prev[drag.id].x + dx / zoomRef.current,
          y: prev[drag.id].y + dy / zoomRef.current,
        },
      }));
    }
  }, []);

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
    setDragKind(null);
  }, []);

  // ── Zoom toward cursor ──────────────────────────────────────────────────────
  const onWheel = useCallback((e: ReactWheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const el = containerRef.current;
    if (!el) return;

    const rect  = el.getBoundingClientRect();
    const mx    = e.clientX - rect.left;
    const my    = e.clientY - rect.top;
    const oz    = zoomRef.current;
    const op    = panRef.current;
    const nz    = Math.max(0.12, Math.min(2.0, oz * (1 - e.deltaY * 0.001)));
    const worldX = (mx - op.x) / oz;
    const worldY = (my - op.y) / oz;
    const np    = { x: mx - worldX * nz, y: my - worldY * nz };

    zoomRef.current = nz;
    panRef.current  = np;
    setZoom(nz);
    setPan(np);
  }, []);

  const resetView = useCallback(() => {
    const z = 0.30, p = { x: 10, y: 10 };
    zoomRef.current = z; panRef.current = p;
    setZoom(z); setPan(p); setPositions(DEFAULT_POSITIONS);
    setHoveredWireIdx(null);
    setSelectedWireIdx(null);
    setDragKind(null); dragRef.current = null;
  }, []);

  const zoomBy = useCallback((delta: number) => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const cx = el.clientWidth / 2, cy = el.clientHeight / 2;
    const oz = zoomRef.current,   op = panRef.current;
    const nz = Math.max(0.12, Math.min(2.0, oz + delta));
    const wx = (cx - op.x) / oz, wy = (cy - op.y) / oz;
    const np = { x: cx - wx * nz, y: cy - wy * nz };
    zoomRef.current = nz; panRef.current = np;
    setZoom(nz); setPan(np);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%" }}>
      {/* ── Canvas ── */}
      <div
        ref={containerRef}
        style={{
          width: "100%", height: 900, borderRadius: 18, overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.07)", background: BG,
          position: "relative", cursor: dragKind === "canvas" ? "grabbing" : "grab",
          touchAction: "none",
        }}
        onPointerDown={onCanvasPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onWheel={onWheel}
      >
        {/* Grid */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: `
            linear-gradient(${GRID_MINOR} 1px, transparent 1px),
            linear-gradient(90deg, ${GRID_MINOR} 1px, transparent 1px),
            linear-gradient(${GRID_MAJOR} 1px, transparent 1px),
            linear-gradient(90deg, ${GRID_MAJOR} 1px, transparent 1px)
          `,
          backgroundSize: "24px 24px, 24px 24px, 120px 120px, 120px 120px",
        }} />

        {/* Hint */}
        <div style={{
          position: "absolute", top: 16, left: 16, zIndex: 30,
          color: TEXT_FAINT, fontSize: 9, lineHeight: 1.45,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          background: "rgba(9,17,27,0.76)", border: `1px solid ${BORDER}`,
          padding: "10px 12px", borderRadius: 10, backdropFilter: "blur(6px)",
        }}>
          Scroll to zoom (pivots at cursor) · Drag to pan
          <br />
          Drag nodes to reposition · Hover or click a wire to trace its route
        </div>

        {activeWireDetails && (
          <div style={{
            position: "absolute", top: 88, left: 16, zIndex: 30,
            width: 320, color: TEXT_MAIN,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            background: "rgba(9,17,27,0.82)", border: `1px solid ${BORDER}`,
            padding: "10px 12px", borderRadius: 10, backdropFilter: "blur(6px)",
            boxShadow: `0 0 0 1px ${activeWireDetails.color}33, 0 8px 24px rgba(0,0,0,0.28)`,
          }}>
            <div style={{ color: activeWireDetails.color, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {activeWireDetails.styleLabel}
            </div>
            <div style={{ marginTop: 7, fontSize: 10.5, lineHeight: 1.5 }}>
              <div>
                <span style={{ color: "#cbd5e1" }}>From:</span> {activeWireDetails.fromNode}
              </div>
              <div style={{ color: TEXT_SUB }}>Output: {activeWireDetails.fromPort}</div>
              <div style={{ margin: "5px 0", color: activeWireDetails.color }}>→</div>
              <div>
                <span style={{ color: "#cbd5e1" }}>To:</span> {activeWireDetails.toNode}
              </div>
              <div style={{ color: TEXT_SUB }}>Input: {activeWireDetails.toPort}</div>
            </div>
            <div style={{ marginTop: 8, color: TEXT_FAINT, fontSize: 8.5 }}>
              Hover to preview · Click wire to pin · Click empty canvas to clear
            </div>
          </div>
        )}

        {/* Controls */}
        <div
          style={{
            position: "absolute", top: 16, right: 16, zIndex: 30,
            display: "flex", alignItems: "center", gap: 6,
            background: "rgba(9,17,27,0.76)", border: `1px solid ${BORDER}`,
            padding: "8px 10px", borderRadius: 10, backdropFilter: "blur(6px)",
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div style={{ color: TEXT_SUB, fontSize: 10, minWidth: 36, textAlign: "right" }}>
            {Math.round(zoom * 100)}%
          </div>
          <button onClick={() => zoomBy(-0.06)} style={controlBtnStyle}>−</button>
          <button onClick={() => zoomBy(+0.06)} style={controlBtnStyle}>+</button>
          <button onClick={fitScreen}           style={controlBtnStyle}>Fit</button>
          <button onClick={resetView}           style={controlBtnStyle}>Reset</button>
        </div>

        {/* Pannable inner canvas */}
        <div style={{
          position: "absolute", left: 0, top: 0,
          transformOrigin: "0 0",
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          width: VIEW_W, height: VIEW_H,
        }}>
          {/* Title watermark */}
          <div style={{
            position: "absolute", left: 30, top: 20,
            color: "#1e2f42", fontSize: 11, fontWeight: 700,
            letterSpacing: "0.12em", textTransform: "uppercase",
          }}>
            Runway safe handoff workflow · 4-shot core lane + social side outputs · picker labels refreshed Apr 2026
          </div>

          {/* SVG wires */}
          <svg width={VIEW_W} height={VIEW_H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <defs>
              {(["main","reference","qa","continuity","audio","post","optional","manual","meta"] as WireStyle[]).map((style) => (
                <marker key={style} id={`arr-${style}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L7,3 z" fill={WIRE_COLORS[style]} />
                </marker>
              ))}
            </defs>

            {WIRES.map((wire, idx) => {
              const from  = getPortPoint(wire.from[0], wire.from[1], "right");
              const to    = getPortPoint(wire.to[0],   wire.to[1],   "left");
              const color = WIRE_COLORS[wire.style];
              const isActive = activeWireIdx === idx;
              const hasFocus = activeWireIdx !== null;

              let d = "";
              if      (wire.route === "v")    d = vCurve(from, to);
              else if (wire.route === "pipe") d = pipeCurve(from, to, wire.pipeY ?? 420);
              else                            d = hCurve(from, to, 72);

              const dashed = wire.style !== "main" && wire.style !== "post" && wire.style !== "reference";
              const opacity =
                wire.style === "qa"       ? 0.64 :
                wire.style === "optional" ? 0.58 :
                wire.style === "audio"    ? 0.72 :
                wire.style === "meta"     ? 0.76 :
                wire.style === "manual"   ? 0.82 : 0.92;
              const strokeWidth =
                wire.style === "main" || wire.style === "post"            ? 1.9 :
                wire.style === "reference" || wire.style === "continuity" ? 1.45 :
                wire.style === "manual"                                   ? 1.45 : 1.05;
              const visibleOpacity = hasFocus && !isActive ? Math.max(0.06, opacity * 0.16) : opacity;
              const currentStrokeWidth = isActive ? strokeWidth + 1.15 : strokeWidth;
              const glowWidth = isActive ? currentStrokeWidth + 6 : currentStrokeWidth + (wire.style === "main" ? 2.2 : 1.4);
              const glowOpacity = isActive ? 0.24 : hasFocus ? 0.015 : wire.style === "continuity" ? 0.035 : 0.05;

              return (
                <g key={idx}>
                  {(wire.style === "main" || wire.style === "reference" || wire.style === "post" || wire.style === "manual" || isActive) && (
                    <path
                      d={d}
                      fill="none"
                      stroke={color}
                      strokeWidth={glowWidth}
                      opacity={glowOpacity}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                  {wire.style === "continuity" && (
                    <path
                      d={d}
                      fill="none"
                      stroke={color}
                      strokeWidth={glowWidth}
                      opacity={glowOpacity}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                  <path d={d} fill="none" stroke={color}
                    strokeWidth={currentStrokeWidth}
                    strokeDasharray={dashed ? "6 4" : undefined}
                    opacity={visibleOpacity}
                    markerEnd={`url(#${markerId(wire.style)})`}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      filter: isActive ? `drop-shadow(0 0 8px ${color})` : undefined,
                      transition: "opacity 120ms ease, stroke-width 120ms ease, filter 120ms ease",
                    }}
                  />
                  <path
                    d={d}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={Math.max(12, currentStrokeWidth + 10)}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ cursor: "pointer" }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onPointerEnter={(e) => {
                      e.stopPropagation();
                      setHoveredWireIdx(idx);
                    }}
                    onPointerLeave={(e) => {
                      e.stopPropagation();
                      setHoveredWireIdx((prev) => (prev === idx ? null : prev));
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedWireIdx((prev) => (prev === idx ? null : idx));
                      setHoveredWireIdx(idx);
                    }}
                  />
                  {isActive && (
                    <>
                      <circle cx={from.x} cy={from.y} r={8} fill={color} opacity={0.16} />
                      <circle cx={to.x} cy={to.y} r={8} fill={color} opacity={0.16} />
                      <circle cx={from.x} cy={from.y} r={4.2} fill={color} stroke="#f8fafc" strokeWidth={1.1} />
                      <circle cx={to.x} cy={to.y} r={4.2} fill={color} stroke="#f8fafc" strokeWidth={1.1} />
                    </>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Section labels */}
          <SectionLabel x={30} y={72} text="Inputs" />
          <SectionLabel x={330} y={184} text="LLM + Prompt Routing" color="#1e5a70" />
          <SectionLabel x={664} y={116} text="Parse JSON" color="#1e5a70" />
          <SectionLabel x={664} y={436} text="Social / export only" color="#0ea5b7" />
          <SectionLabel x={980} y={436} text="Optional manual social text" color="#b45309" />
          <SectionLabel x={1064} y={72} text="Shot 1" />
          <SectionLabel x={1344} y={72} text="Safe Handoff 1" color="#1e5a70" />
          <SectionLabel x={1584} y={286} text="Fast optional Last Frame" color="#9d71ff" />
          <SectionLabel x={1884} y={72} text="Shot 2" />
          <SectionLabel x={2164} y={72} text="Safe Handoff 2" color="#1e5a70" />
          <SectionLabel x={2404} y={286} text="Fast optional Last Frame" color="#9d71ff" />
          <SectionLabel x={2704} y={72} text="Shot 3" />
          <SectionLabel x={2984} y={72} text="Safe Handoff 3" color="#1e5a70" />
          <SectionLabel x={3224} y={286} text="Fast optional Last Frame" color="#9d71ff" />
          <SectionLabel x={3524} y={72} text="Shot 4" />
          <SectionLabel x={1064} y={664} text="Optional manual Text override lane" color="#b45309" />
          <SectionLabel x={3828} y={925} text="Audio" color="#a67c00" />
          <SectionLabel x={4128} y={228} text="Assembly + Post" color="#1e5a70" />

          {/* Nodes */}
          {NODE_SPECS.map((spec) => (
            <NodeBox
              key={spec.id}
              spec={spec}
              pos={positions[spec.id]}
              onPointerDown={onNodePointerDown(spec.id)}
            />
          ))}

          {/* Legend */}
          <div style={{
            position: "absolute", left: 30, bottom: 24,
            display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap",
            padding: "10px 12px", borderRadius: 12,
            background: "rgba(9,17,27,0.82)", border: `1px solid ${BORDER}`,
          }}>
            {([
              { label: "Primary auto flow",          color: WIRE_COLORS.main,        dashed: false },
              { label: "Reference / anchor image",   color: WIRE_COLORS.reference,   dashed: false },
              { label: "Chosen continuity frame",    color: WIRE_COLORS.continuity,  dashed: true  },
              { label: "First Frame QA",             color: WIRE_COLORS.qa,          dashed: true  },
              { label: "Audio lane",                 color: WIRE_COLORS.audio,       dashed: true  },
              { label: "Post processing",            color: WIRE_COLORS.post,        dashed: false },
              { label: "Optional / fast path",       color: WIRE_COLORS.optional,    dashed: true  },
              { label: "Optional manual override",   color: WIRE_COLORS.manual,      dashed: true  },
              { label: "Social export only",         color: WIRE_COLORS.meta,        dashed: true  },
            ] as const).map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <svg width={34} height={10}>
                  <line x1={0} y1={5} x2={34} y2={5} stroke={item.color}
                    strokeWidth={item.dashed ? 1.1 : 1.7}
                    strokeDasharray={item.dashed ? "6 4" : undefined}
                  />
                </svg>
                <span style={{ color: TEXT_SUB, fontSize: 9 }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Info cards ── */}
      <div style={{
        display: "flex", gap: 0, borderRadius: 14, overflow: "hidden",
        border: `1px solid ${BORDER}`, background: "rgba(9,17,27,0.88)",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", flexWrap: "wrap",
      }}>
        <InfoCard title="Runway-native 4-shot reference">
          This file stays Runway-native. The preferred safe handoff is Shot → Trim → Extract Frame, the faster optional path is Last Frame, and First Frame stays QA-only.
        </InfoCard>
        <div style={{ width: 1, background: BORDER, alignSelf: "stretch" }} />
        <InfoCard title="Primary vs override">
          The primary path is Claude → Parse JSON. Matching optional manual Text nodes stay available as operator overrides for shot prompts, SFX, and social export text whenever you want to type directly into Text nodes instead of using the auto route.
        </InfoCard>
        <div style={{ width: 1, background: BORDER, alignSelf: "stretch" }} />
        <InfoCard title="Social outputs">
          hook, caption, hashtags, and optional tags are exported from the same structured Claude response in a small side Parse JSON lane. Matching optional manual Text nodes let you type those publishing fields directly when you want to skip the auto export text. They are still publishing outputs only, not part of the video render path.
        </InfoCard>
        <div style={{ width: 1, background: BORDER, alignSelf: "stretch" }} />
        <InfoCard title="Picker labels">
          Utility behavior and available LLM models were live-checked against official Runway docs, but the label wording shown here follows the current picker screenshots: Parse JSON, Trim, Stitch Videos, and Claude. The help center still uses older JSON Parse / Trim Video / Stitch / Claude Opus 4.5 wording.
        </InfoCard>
        <div style={{ width: 1, background: BORDER, alignSelf: "stretch" }} />
        <InfoCard title="Prompt source rule">
          For each shot, SFX field, or social export field, use only one source at a time: either the auto Parse JSON output or the matching optional manual Text node. Do not run both simultaneously.
        </InfoCard>
      </div>

      {/* Workflow notes */}
      <div style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${BORDER}`, background: "rgba(9,17,27,0.88)", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
        <div style={{ padding: "16px 18px" }}>
          <div style={{ color: "#93b8d8", fontSize: 10, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: 8 }}>Workflow notes</div>
          <div style={{ display: "grid", gap: 8 }}>
            {WORKFLOW_NOTES.map((line, i) => (
              <div key={i} style={{ color: TEXT_SUB, fontSize: 10, lineHeight: 1.6 }}>{i + 1}. {line}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Prompt guide */}
      <div style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${BORDER}`, background: "rgba(9,17,27,0.88)", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
        <div style={{ padding: "16px 18px" }}>
          <div style={{ color: "#93b8d8", fontSize: 10, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: 8 }}>Prompt guide</div>
          <div style={{ display: "grid", gap: 8 }}>
            {PROMPT_GUIDE.map((line, i) => (
              <div key={i} style={{ color: TEXT_SUB, fontSize: 10, lineHeight: 1.6 }}>{i + 1}. {line}</div>
            ))}
          </div>
        </div>
      </div>

      {/* System prompt template */}
      <div style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${BORDER}`, background: "rgba(9,17,27,0.88)", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
        <div style={{ padding: "16px 18px 10px" }}>
          <div style={{ color: "#93b8d8", fontSize: 10, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: 8 }}>System prompt template</div>
          <pre style={{ margin: 0, padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.03)", color: "#dbeafe", fontSize: 10, lineHeight: 1.55, overflowX: "auto", whiteSpace: "pre-wrap" }}>
            {SYSTEM_PROMPT_TEMPLATE}
          </pre>
        </div>
      </div>

      {/* Manual prompt template */}
      <div style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${BORDER}`, background: "rgba(9,17,27,0.88)", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
        <div style={{ padding: "16px 18px 10px" }}>
          <div style={{ color: "#93b8d8", fontSize: 10, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: 8 }}>Manual prompt template</div>
          <pre style={{ margin: 0, padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.03)", color: "#dbeafe", fontSize: 10, lineHeight: 1.55, overflowX: "auto", whiteSpace: "pre-wrap" }}>
            {MANUAL_PROMPT_TEMPLATE}
          </pre>
        </div>
      </div>

      {/* JSON structure + parse routes */}
      <div style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${BORDER}`, background: "rgba(9,17,27,0.88)", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
        <div style={{ padding: "16px 18px 10px" }}>
          <div style={{ color: "#93b8d8", fontSize: 10, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: 8 }}>JSON structure + exact parse routes</div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(280px,440px) minmax(320px,1fr)", gap: 18 }}>
            <pre style={{ margin: 0, padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.03)", color: "#dbeafe", fontSize: 10, lineHeight: 1.55, overflowX: "auto" }}>
              {JSON_EXAMPLE}
            </pre>
            <div style={{ padding: "0 0 4px" }}>
              {JSON_ROUTES.map((route, i) => (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: "minmax(220px,320px) 24px minmax(220px,1fr)",
                  gap: 8, alignItems: "center", padding: "6px 0",
                  borderTop: `1px solid ${BORDER}`,
                }}>
                  <code style={{ color: "#dbeafe", fontSize: 10 }}>{route.path}</code>
                  <div style={{ color: TEXT_FAINT, fontSize: 10, textAlign: "center" }}>→</div>
                  <div style={{ color: TEXT_SUB, fontSize: 10 }}>
                    {route.target}
                    {route.note && <span style={{ color: TEXT_FAINT }}> · {route.note}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
