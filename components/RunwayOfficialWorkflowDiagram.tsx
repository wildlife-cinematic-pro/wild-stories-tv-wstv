"use client";

/**
 * RunwayOfficialWorkflowDiagram.tsx
 * Runway Safe Handoff Workflow — Auto Prompt Lane + Manual Prompt Lane
 *
 * Node names verified against official Runway documentation (April 2026):
 *   Utility nodes : Extract Frame, Last Frame, First Frame, Trim Video,
 *                   Add Audio, Stitch, JSON Parse
 *   Audio nodes   : Text to SFX, Text to Speech, Voice Dubbing, Voice Isolation
 *   LLM node      : Claude Opus 4.5  ← official Runway LLM node name
 *                   (confirmed in Runway "Introduction to Workflows" help article)
 *   Model nodes   : Gen-4.5 (Image to Video)
 *   Input nodes   : Text, Image, Audio
 *
 * "Combine Text" is NOT an official Runway node name. The manual prompt Text
 * nodes are standard Text input nodes used by the operator for hand-written prompts.
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

type WireStyle = "main" | "reference" | "continuity" | "qa" | "audio" | "post" | "optional" | "manual";

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
};

const BG         = "#060c14";
const GRID_MINOR = "#101827";
const GRID_MAJOR = "#172335";
const BORDER     = "rgba(255,255,255,0.08)";
const TEXT_MAIN  = "#edf2f8";
const TEXT_SUB   = "#8fa3bd";
const TEXT_FAINT = "#5f738e";

const VIEW_W = 5200;
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
// "Manual Shot 1/2/3 Prompt" and "Manual SFX Prompt" nodes are standard Text
// input nodes (official Runway Input node type) — the labels are operator-named.
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

  // ── LLM NODE — official name: Claude Opus 4.5 ──
  // Source: Runway "Introduction to Workflows" help article (confirmed Apr 2026)
  makeNode("llm", {
    title: "Claude Opus 4.5",   // ← official Runway LLM node name
    subtitle: "LLM Node",
    badge: "LLM", width: 248, bg: "#14092e", accent: "#f97316",
    inputs: [
      { id: "system", label: "System", kind: "text",  required: true },
      { id: "brief",  label: "Prompt", kind: "text",  required: true },
    ],
    outputs: [{ id: "json", label: "Text (JSON)", kind: "text" }],
    infoLines: ["Builds auto shot prompts and SFX prompt"],
  }),

  // ── JSON PARSE — official Runway utility node ──
  makeNode("json_parse", {
    title: "JSON Parse", subtitle: "Auto prompt routes",
    badge: "UTILITY", width: 328, bg: "#07121d", accent: "#16a34a",
    inputs:  [{ id: "json", label: "Text (JSON)", kind: "text", required: true }],
    outputs: [
      { id: "shot1", label: "shots.0.motion_prompt", kind: "text" },
      { id: "shot2", label: "shots.1.motion_prompt", kind: "text" },
      { id: "shot3", label: "shots.2.motion_prompt", kind: "text" },
      { id: "sfx",   label: "audio.sfx_prompt",       kind: "text" },
    ],
    infoLines: ["Official Runway utility node — auto mode only"],
  }),

  // ── MANUAL PROMPT NODES (operator-named Text input nodes) ──
  makeNode("manual_shot1", {
    title: "Text", subtitle: "Manual Shot 1 Prompt",
    badge: "MANUAL", width: 214, bg: "#1a1207", accent: "#f97316",
    inputs:  [],
    outputs: [{ id: "text", label: "Text", kind: "text" }],
    infoLines: ["Use instead of auto Shot 1 prompt"],
  }),
  makeNode("manual_shot2", {
    title: "Text", subtitle: "Manual Shot 2 Prompt",
    badge: "MANUAL", width: 214, bg: "#1a1207", accent: "#f97316",
    inputs:  [],
    outputs: [{ id: "text", label: "Text", kind: "text" }],
    infoLines: ["Use instead of auto Shot 2 prompt"],
  }),
  makeNode("manual_shot3", {
    title: "Text", subtitle: "Manual Shot 3 Prompt",
    badge: "MANUAL", width: 214, bg: "#1a1207", accent: "#f97316",
    inputs:  [],
    outputs: [{ id: "text", label: "Text", kind: "text" }],
    infoLines: ["Use instead of auto Shot 3 prompt"],
  }),
  makeNode("manual_sfx", {
    title: "Text", subtitle: "Manual SFX Prompt",
    badge: "MANUAL", width: 214, bg: "#1a1207", accent: "#f97316",
    inputs:  [],
    outputs: [{ id: "text", label: "Text", kind: "text" }],
    infoLines: ["Use instead of auto SFX prompt"],
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

  // ── TRIM VIDEO — official Runway utility node ──
  makeNode("trim_h1", {
    title: "Trim Video", subtitle: "Safe Handoff Prep 1",
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
    title: "Trim Video", subtitle: "Safe Handoff Prep 2",
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
    title: "Stitch", subtitle: "Ordered shots",
    badge: "UTILITY", width: 202, bg: "#0d0220", accent: "#16a34a",
    inputs: [
      { id: "s1", label: "Input 1", kind: "video", required: true },
      { id: "s2", label: "Input 2", kind: "video", required: true },
      { id: "s3", label: "Input 3", kind: "video", required: true },
    ],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
    infoLines: ["Input order is playback order — official node"],
  }),

  // ── TRIM VIDEO (final) ──
  makeNode("trim_final", {
    title: "Trim Video", subtitle: "Final Runtime Cleanup",
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

  // ── UPSCALE VIDEO — confirmed in Runway changelog as "video upscaling nodes" ──
  makeNode("upscale", {
    title: "Upscale Video", subtitle: "Final Master",
    badge: "POST", width: 200, bg: "#030d1a", accent: "#38bdf8",
    inputs:  [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
    infoLines: ["Do this after edit lock — confirmed in changelog"],
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

  manual_shot1: { x: 1064, y: 690 },
  manual_shot2: { x: 1884, y: 690 },
  manual_shot3: { x: 2704, y: 690 },
  manual_sfx:   { x: 2704, y: 950 },

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

  sfx: { x: 3008, y: 950 },

  stitch:      { x: 3308, y: 252 },
  trim_final:  { x: 3594, y: 252 },
  add_audio:   { x: 3888, y: 252 },
  upscale:     { x: 4178, y: 252 },
  extract_thumb:{ x: 4452, y: 252 },
};

// ─── WIRES ───────────────────────────────────────────────────────────────────
const WIRES: WireDef[] = [
  // Inputs → LLM
  { from: ["text_system", "text"], to: ["llm", "system"], style: "main" },
  { from: ["text_story",  "text"], to: ["llm", "brief"],  style: "main" },

  // LLM → JSON Parse
  { from: ["llm", "json"], to: ["json_parse", "json"], style: "main" },

  // Anchor image → Shot 1
  { from: ["handoff_anchor", "image"], to: ["shot1", "image"], style: "reference" },

  // JSON Parse auto prompt → Shot 1
  { from: ["json_parse",   "shot1"], to: ["shot1",   "prompt"], style: "main"   },
  // Manual prompt → Shot 1 (operator can use either, not both)
  { from: ["manual_shot1", "text"],  to: ["shot1",   "prompt"], style: "manual", route: "v" },

  // Shot 1 → QA (First Frame)
  { from: ["shot1", "video"], to: ["first1", "video"], style: "qa",       route: "v" },

  // Shot 1 → Main handoff path (Trim Video → Extract Frame)
  { from: ["shot1",   "video"], to: ["trim_h1", "video"], style: "main" },
  { from: ["trim_h1", "video"], to: ["pick_h1", "video"], style: "post" },

  // Shot 1 → Fast optional Last Frame path
  { from: ["shot1", "video"], to: ["last1", "video"], style: "optional", route: "v" },

  // Chosen handoff → Shot 2 image
  { from: ["pick_h1", "image"], to: ["shot2", "image"], style: "continuity" },
  { from: ["last1",   "image"], to: ["shot2", "image"], style: "optional"   },

  // JSON Parse auto prompt → Shot 2
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

  // JSON Parse auto prompt → Shot 3
  { from: ["json_parse",   "shot3"], to: ["shot3", "prompt"], style: "main"   },
  { from: ["manual_shot3", "text"],  to: ["shot3", "prompt"], style: "manual", route: "v" },

  // Shot 3 → QA
  { from: ["shot3", "video"], to: ["first3", "video"], style: "qa", route: "v" },

  // Audio lane — Text to SFX (from JSON Parse or manual)
  { from: ["json_parse", "sfx"],   to: ["sfx", "text"], style: "audio",  route: "pipe", pipeY: 880 },
  { from: ["manual_sfx", "text"],  to: ["sfx", "text"], style: "manual", route: "h"                },

  // SFX → Add Audio
  { from: ["sfx",       "audio"], to: ["add_audio", "audio"], style: "audio",    route: "pipe", pipeY: 1045 },
  // Alternative audio input
  { from: ["audio_alt", "audio"], to: ["add_audio", "audio"], style: "optional", route: "pipe", pipeY: 1140 },

  // Shots → Stitch (pipe routes bring three video streams into stitch)
  { from: ["shot1", "video"], to: ["stitch", "s1"], style: "main", route: "pipe", pipeY: 560 },
  { from: ["shot2", "video"], to: ["stitch", "s2"], style: "main", route: "pipe", pipeY: 595 },
  { from: ["shot3", "video"], to: ["stitch", "s3"], style: "main", route: "pipe", pipeY: 630 },

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
    }
  ],
  "audio": {
    "sfx_prompt": "cold mountain meadow ambience, light winter wind, frosted grass movement, subtle hoof steps"
  }
}`;

const SYSTEM_PROMPT_TEMPLATE = `You are building motion prompts for a multi-shot wildlife continuity workflow.

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
    { "motion_prompt": "..." }
  ],
  "audio": {
    "sfx_prompt": "..."
  }
}`;

const MANUAL_PROMPT_TEMPLATE = `Same exact subjects as the handoff image. Both animals remain visible in frame. Clean readable spacing. One clear action only. Natural realistic motion. End on a stable readable hold. No subject exits frame.`;

const JSON_ROUTES: JsonRoute[] = [
  { path: "shots.0.motion_prompt", target: "Shot 1 · prompt input"   },
  { path: "shots.1.motion_prompt", target: "Shot 2 · prompt input"   },
  { path: "shots.2.motion_prompt", target: "Shot 3 · prompt input"   },
  { path: "audio.sfx_prompt",       target: "Text to SFX · text input" },
];

const WORKFLOW_NOTES = [
  "Main handoff path: Shot → Trim Video → Extract Frame → next shot's Image input.",
  "Extract Frame lets you choose a frame where both animals are still clearly visible.",
  "Last Frame is the fast optional path — only use it when the final frame is already clean.",
  "If the ending loses one subject, do not pass that frame forward. Use the anchor or re-generate.",
  "Use one prompt source per shot at a time: auto JSON route OR manual text node.",
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
          Drag nodes to reposition · Wires update live
        </div>

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
            Runway safe handoff workflow · auto prompt lane + manual prompt lane · node names verified Apr 2026
          </div>

          {/* SVG wires */}
          <svg width={VIEW_W} height={VIEW_H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <defs>
              {(["main","reference","qa","continuity","audio","post","optional","manual"] as WireStyle[]).map((style) => (
                <marker key={style} id={`arr-${style}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L7,3 z" fill={WIRE_COLORS[style]} />
                </marker>
              ))}
            </defs>

            {WIRES.map((wire, idx) => {
              const from  = getPortPoint(wire.from[0], wire.from[1], "right");
              const to    = getPortPoint(wire.to[0],   wire.to[1],   "left");
              const color = WIRE_COLORS[wire.style];

              let d = "";
              if      (wire.route === "v")    d = vCurve(from, to);
              else if (wire.route === "pipe") d = pipeCurve(from, to, wire.pipeY ?? 420);
              else                            d = hCurve(from, to, 72);

              const dashed = wire.style !== "main" && wire.style !== "post" && wire.style !== "reference";
              const opacity =
                wire.style === "qa"       ? 0.64 :
                wire.style === "optional" ? 0.58 :
                wire.style === "audio"    ? 0.72 :
                wire.style === "manual"   ? 0.82 : 0.92;
              const strokeWidth =
                wire.style === "main" || wire.style === "post"           ? 2.35 :
                wire.style === "reference" || wire.style === "continuity" ? 1.8  :
                wire.style === "manual"                                   ? 1.8  : 1.35;

              return (
                <g key={idx}>
                  {(wire.style === "main" || wire.style === "reference" || wire.style === "post" || wire.style === "manual") && (
                    <path d={d} fill="none" stroke={color} strokeWidth={5} opacity={0.12} />
                  )}
                  {wire.style === "continuity" && (
                    <path d={d} fill="none" stroke={color} strokeWidth={4} opacity={0.10} />
                  )}
                  <path d={d} fill="none" stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={dashed ? "6 4" : undefined}
                    opacity={opacity}
                    markerEnd={`url(#${markerId(wire.style)})`}
                  />
                </g>
              );
            })}
          </svg>

          {/* Section labels */}
          <SectionLabel x={30}   y={72}  text="Inputs" />
          <SectionLabel x={330}  y={184} text="LLM — Claude Opus 4.5 (official)" color="#1e5a70" />
          <SectionLabel x={664}  y={116} text="JSON Parse" color="#1e5a70" />
          <SectionLabel x={1064} y={72}  text="Shot 1 — Gen-4.5" />
          <SectionLabel x={1344} y={72}  text="Safe Handoff 1" color="#1e5a70" />
          <SectionLabel x={1584} y={286} text="Fast optional Last Frame" color="#9d71ff" />
          <SectionLabel x={1884} y={72}  text="Shot 2 — Gen-4.5" />
          <SectionLabel x={2164} y={72}  text="Safe Handoff 2" color="#1e5a70" />
          <SectionLabel x={2404} y={286} text="Fast optional Last Frame" color="#9d71ff" />
          <SectionLabel x={2704} y={72}  text="Shot 3 — Gen-4.5" />
          <SectionLabel x={1064} y={664} text="Manual prompt lane (Text input nodes)" color="#b45309" />
          <SectionLabel x={3008} y={925} text="Audio — Text to SFX (official)" color="#a67c00" />
          <SectionLabel x={3308} y={228} text="Assembly + Post" color="#1e5a70" />

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
              { label: "Manual prompt lane",         color: WIRE_COLORS.manual,      dashed: true  },
            ] as const).map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <svg width={34} height={10}>
                  <line x1={0} y1={5} x2={34} y2={5} stroke={item.color}
                    strokeWidth={item.dashed ? 1.3 : 2.1}
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
        <InfoCard title="Main fix">
          The main handoff is not raw Last Frame. It goes: Shot → Trim Video → Extract Frame → next shot&apos;s Image input. This lets you select a frame where both animals are still clearly visible.
        </InfoCard>
        <div style={{ width: 1, background: BORDER, alignSelf: "stretch" }} />
        <InfoCard title="Manual mode">
          Manual Text nodes (standard Runway Input nodes, operator-named) let you write prompts by hand instead of routing from the LLM + JSON Parse lane. Use one source per shot at a time — not both.
        </InfoCard>
        <div style={{ width: 1, background: BORDER, alignSelf: "stretch" }} />
        <InfoCard title="Node names verified">
          All node names checked against official Runway docs (April 2026). Gen-4.5, First Frame, Last Frame, Extract Frame, Trim Video, Add Audio, Stitch, JSON Parse, and Text to SFX are confirmed official Runway node names. The LLM node is &quot;Claude Opus 4.5&quot; per the Runway Introduction to Workflows article.
        </InfoCard>
        <div style={{ width: 1, background: BORDER, alignSelf: "stretch" }} />
        <InfoCard title="Prompt source rule">
          For each shot, activate only one prompt source: auto route from JSON Parse OR the manual Text node. Running both simultaneously causes undefined behaviour — one will silently override the other.
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
