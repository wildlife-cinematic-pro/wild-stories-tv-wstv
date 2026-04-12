"use client";

/**
 * WSTVWorkflowDiagram.tsx — Wild Stories TV · AI Cinematic Pipeline
 *
 * Node names verified against official Runway documentation (April 2026):
 *   Utility nodes : Extract Frame, Last Frame, Trim Video, Extract Audio,
 *                   Add Audio, Stitch, JSON Parse, First Frame
 *   Audio nodes   : Text to SFX, Text to Speech, Voice Dubbing, Voice Isolation
 *   LLM node      : Claude Opus 4.5  ← official Runway LLM node name
 *   Model nodes   : Gen-4.5 (Image to Video), Gen-4 Image, Kling 3.0 Pro
 *   Input nodes   : Text, Image
 *
 * "Nano Banana 2" is an external image-generation model (Gemini-based) wired
 * into Runway via the Image input node — not a native Runway node.
 *
 * "Combine Text" is the operator's named Text utility node for assembling
 * Kling's combined prompt — not an official Runway node label.
 *
 * UX improvements vs. previous version
 *   • Zoom pivots around the mouse cursor (natural "Figma-style" zoom)
 *   • Fit Screen button calculates actual node bounds and fills the canvas
 *   • Zoom range extended: 12 % → 200 %
 *   • zoomRef / panRef refs keep wheel handler free of stale-closure bugs
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
} from "react";
import type { GeneratedPackage } from "@/types";

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

type WireStyle = "main" | "fallback" | "anchor" | "qa" | "audio";

type WireDef = {
  from:    [string, string];
  to:      [string, string];
  style:   WireStyle;
  route?:  "h" | "v" | "pipe";
  pipeY?:  number;
};

// ─── COLORS ──────────────────────────────────────────────────────────────────
const PORT_COLORS: Record<PortKind, string> = {
  text:  "#f59e0b",
  image: "#3b82f6",
  audio: "#eab308",
  video: "#22c55e",
};

const WIRE_COLORS: Record<WireStyle, string> = {
  main:     "#60a5fa",
  fallback: "#fb923c",
  anchor:   "#c084fc",
  qa:       "#fbbf24",
  audio:    "#eab308",
};

const BG         = "#060c14";
const GRID_MINOR = "#101827";
const GRID_MAJOR = "#172335";
const BORDER     = "rgba(255,255,255,0.08)";
const TEXT_MAIN  = "#edf2f8";
const TEXT_SUB   = "#7b8ca3";
const TEXT_FAINT = "#526579";

const VIEW_W = 4200;
const VIEW_H = 960;

// ─── LAYOUT CONSTANTS ────────────────────────────────────────────────────────
// Per-node header height is computed from these sub-heights so that wire
// endpoints land exactly on port dots regardless of badge/subtitle presence.
const ROW_H      = 20;   // height of each port row
const FOOTER_PAD = 10;   // padding below the last port row
const BAR_H      = 4;    // top accent colour bar
const PAD_TOP    = 8;    // padding-top inside the content div
const BADGE_H    = 21;   // badge line: font 9 × lineHeight 1.2 + pad 2+2 + mb 6
const TITLE_H    = 14;   // title: font 12.5 × lineHeight 1.15
const SUBTITLE_H = 14;   // subtitle: mt 2 + font 9 × lineHeight 1.3
const PORT_MARGIN = 10;  // marginTop before the port-row container
const DOT_OFFSET  = 5.5; // dot centre within its ROW_H slot (ROW_H/2 − 4.5)

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
  const rowCount  = Math.max(spec.inputs.length, spec.outputs.length, 1);
  const infoExtra = (spec.infoLines?.length ?? 0) * 11;
  return nodeHeaderH(spec) + rowCount * ROW_H + (infoExtra ? infoExtra + 10 : 0) + FOOTER_PAD;
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
// All node names verified against official Runway docs where possible.
// Deviations are noted inline.
const NODE_SPECS: NodeSpec[] = [
  // ── INPUTS (official Runway input node type: "Text", "Image") ──
  makeNode("text_system", {
    title:    "Text",
    subtitle: "(System Prompt)",
    badge:    "INPUT",
    width: 178, bg: "#0c1520",
    inputs:  [],
    outputs: [{ id: "text", label: "Text", kind: "text" }],
  }),
  makeNode("text_user", {
    title:    "Text",
    subtitle: "(User Story Prompt)",
    badge:    "INPUT",
    width: 178, bg: "#0c1520",
    inputs:  [],
    outputs: [{ id: "text", label: "Text", kind: "text" }],
  }),
  makeNode("image_ref", {
    title:    "Image",
    subtitle: "(Reference)",
    badge:    "INPUT",
    width: 178, bg: "#0c1520",
    inputs:  [],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
  }),

  // ── LLM NODE — official Runway name: "Claude Opus 4.5" ──
  makeNode("claude", {
    title:    "Claude Opus 4.5",   // ← confirmed in Runway Introduction to Workflows doc
    subtitle: "LLM Node",
    badge:    "LLM",
    width: 236, bg: "#14092e", accent: "#f97316",
    inputs: [
      { id: "system", label: "System Prompt", kind: "text",  required: true },
      { id: "prompt", label: "Prompt",        kind: "text",  required: true },
      { id: "image",  label: "Image",         kind: "image" },
    ],
    outputs: [{ id: "json", label: "JSON", kind: "text" }],
    infoLines: ["Builds shot prompts, SFX cues, and meta outputs"],
  }),

  // ── JSON PARSE — official Runway utility node ──
  makeNode("json_core", {
    title:    "JSON Parse",
    subtitle: "(Core Outputs)",
    badge:    "UTILITY",
    width: 284, bg: "#070c18", accent: "#16a34a",
    inputs:  [{ id: "json", label: "JSON", kind: "text", required: true }],
    outputs: [
      { id: "master",       label: "master_image_prompt",   kind: "text" },
      { id: "shot1",        label: "shot1_video_prompt",    kind: "text" },
      { id: "shot2",        label: "shot2_video_prompt",    kind: "text" },
      { id: "audio_prompt", label: "shot2_audio_prompt",    kind: "text" },
      { id: "shot3",        label: "shot3_video_prompt",    kind: "text" },
      { id: "negative",     label: "kling_negative_prompt", kind: "text" },
      { id: "char_lock",    label: "character_lock",        kind: "text" },
      { id: "op_notes",     label: "operator_notes",        kind: "text" },
    ],
    infoLines: ["Official Runway utility node"],
  }),
  makeNode("json_meta", {
    title:    "JSON Parse",
    subtitle: "(Meta Outputs)",
    badge:    "UTILITY",
    width: 284, bg: "#070c18", accent: "#16a34a",
    inputs:  [{ id: "json", label: "JSON", kind: "text", required: true }],
    outputs: [
      { id: "mi1",     label: "motion_intensity.shot1", kind: "text" },
      { id: "mi2",     label: "motion_intensity.shot2", kind: "text" },
      { id: "mi3",     label: "motion_intensity.shot3", kind: "text" },
      { id: "hook",    label: "hook",                   kind: "text" },
      { id: "caption", label: "caption",                kind: "text" },
    ],
    infoLines: ["Reference only — no render wires needed"],
  }),

  // ── IMAGE CHAIN ──
  // Nano Banana 2 = external model (Gemini-based) accessed via Image input in Runway
  makeNode("nano_banana_2", {
    title:    "Nano Banana 2",
    subtitle: "External — Master Still",
    badge:    "EXTERNAL",
    width: 220, bg: "#051a0e", accent: "#16a34a",
    inputs: [
      { id: "prompt", label: "Prompt", kind: "text",  required: true },
      { id: "image",  label: "Image",  kind: "image" },
    ],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
    infoLines: ["Not a native Runway node — external image model"],
  }),

  // ── CANONICAL ANCHOR — Gen-4 Image (official Runway model node) ──
  makeNode("gen4_anchor", {
    title:    "Gen-4 Image",
    subtitle: "(Canonical Anchor)",
    badge:    "MODEL",
    width: 228, bg: "#1a0544", accent: "#c084fc",
    inputs:  [{ id: "image", label: "Image", kind: "image", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
    infoLines: ["Official Runway image model node"],
  }),

  // ── SHOT 1 — Gen-4.5 Image to Video (official Runway model) ──
  makeNode("shot1", {
    title:    "Gen-4.5",
    subtitle: "(Shot 1 — Image to Video)",
    badge:    "MODEL",
    width: 240, bg: "#060f28", accent: "#16a34a",
    inputs: [
      { id: "image",  label: "Image",  kind: "image", required: true },
      { id: "prompt", label: "Prompt", kind: "text",  required: true },
    ],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
    infoLines: ["Official Runway Gen-4.5 model"],
  }),

  // ── EXTRACT FRAME — official Runway utility node ──
  makeNode("extract1", {
    title:    "Extract Frame",
    subtitle: "(Shot 1 Handoff)",
    badge:    "UTILITY",
    width: 194, bg: "#041420", accent: "#16a34a",
    inputs:  [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
    infoLines: ["Preferred handoff — pick frame where both subjects show"],
  }),

  // ── TRIM VIDEO — official Runway utility node ──
  makeNode("trim1", {
    title:    "Trim Video",
    subtitle: "(Shot 1 — Fallback Prep)",
    badge:    "UTILITY",
    width: 196, bg: "#071318", accent: "#16a34a",
    inputs:  [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
    infoLines: ["Remove weak ending before Last Frame"],
  }),

  // ── LAST FRAME — official Runway utility node ──
  makeNode("last1", {
    title:    "Last Frame",
    subtitle: "(Shot 1 — Fallback)",
    badge:    "UTILITY",
    width: 190, bg: "#160202", accent: "#fb923c",
    dim: true,
    inputs:  [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
    infoLines: ["Use only when Extract Frame is unavailable"],
  }),

  // ── TEXT TO SFX — official Runway audio node ──
  makeNode("sfx1", {
    title:    "Text to SFX",
    subtitle: "(Shot 1 Ambience)",
    badge:    "AUDIO",
    width: 200, bg: "#0e0d00", accent: "#eab308",
    inputs:  [{ id: "text", label: "Text", kind: "text" }],
    outputs: [{ id: "audio", label: "Audio", kind: "audio" }],
    infoLines: ["Official Runway audio node — confirmed"],
  }),

  // ── ADD AUDIO — official Runway utility node ──
  makeNode("add_audio1", {
    title:    "Add Audio",
    subtitle: "(Shot 1)",
    badge:    "UTILITY",
    width: 190, bg: "#0a0c00", accent: "#eab308",
    inputs: [
      { id: "video", label: "Video", kind: "video", required: true },
      { id: "audio", label: "Audio", kind: "audio", required: true },
    ],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
    infoLines: ["Official Runway utility node"],
  }),

  // ── COMBINE TEXT — operator label for a Text utility assembly node ──
  // Not an officially documented Runway node name; used here as the
  // operator's named node for combining shot2 + audio + negative prompts.
  makeNode("combine_text", {
    title:    "Combine Text",
    subtitle: "(Kling Prompt — operator node)",
    badge:    "UTILITY",
    width: 220, bg: "#09111e", accent: "#2563eb",
    inputs: [
      { id: "shot2_prompt", label: "shot2_video_prompt",    kind: "text", required: true },
      { id: "audio",        label: "shot2_audio_prompt",    kind: "text" },
      { id: "negative",     label: "kling_negative_prompt", kind: "text" },
    ],
    outputs: [{ id: "text", label: "Text", kind: "text" }],
    infoLines: ["Operator-specific label, not official Runway node name"],
  }),

  // ── SHOT 2 — Kling 3.0 Pro (available in Runway Workflows per changelog) ──
  makeNode("kling_s2", {
    title:    "Kling 3.0 Pro",
    subtitle: "(Shot 2 — Image to Video)",
    badge:    "MODEL",
    width: 248, bg: "#1e0b00", accent: "#2563eb",
    inputs: [
      { id: "image",  label: "Image",  kind: "image", required: true },
      { id: "prompt", label: "Prompt", kind: "text",  required: true },
    ],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
    infoLines: ["Available in Runway Workflows — confirmed in changelog"],
  }),

  // ── EXTRACT FRAME — official Runway utility node ──
  makeNode("extract2", {
    title:    "Extract Frame",
    subtitle: "(Shot 2 Handoff)",
    badge:    "UTILITY",
    width: 194, bg: "#041420", accent: "#16a34a",
    inputs:  [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
    infoLines: ["Preferred handoff to Shot 3"],
  }),

  // ── TRIM VIDEO ──
  makeNode("trim2", {
    title:    "Trim Video",
    subtitle: "(Shot 2 — Fallback Prep)",
    badge:    "UTILITY",
    width: 196, bg: "#071318", accent: "#16a34a",
    inputs:  [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
    infoLines: ["Remove weak ending before Last Frame"],
  }),

  // ── LAST FRAME ──
  makeNode("last2", {
    title:    "Last Frame",
    subtitle: "(Shot 2 — Fallback)",
    badge:    "UTILITY",
    width: 190, bg: "#160202", accent: "#fb923c",
    dim: true,
    inputs:  [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
    infoLines: ["Use only when Extract Frame unavailable"],
  }),

  // ── EXTRACT AUDIO — official Runway utility node ──
  makeNode("extract_audio2", {
    title:    "Extract Audio",
    subtitle: "(Shot 2 Native Sound)",
    badge:    "AUDIO",
    width: 212, bg: "#0e0d00", accent: "#eab308",
    inputs:  [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "audio", label: "Audio", kind: "audio" }],
    infoLines: ["Official Runway utility node — confirmed"],
  }),

  // ── ADD AUDIO ──
  makeNode("add_audio2", {
    title:    "Add Audio",
    subtitle: "(Shot 2)",
    badge:    "UTILITY",
    width: 190, bg: "#0a0c00", accent: "#eab308",
    inputs: [
      { id: "video", label: "Video", kind: "video", required: true },
      { id: "audio", label: "Audio", kind: "audio", required: true },
    ],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
    infoLines: ["Official Runway utility node"],
  }),

  // ── SHOT 3 — Gen-4.5 ──
  makeNode("shot3", {
    title:    "Gen-4.5",
    subtitle: "(Shot 3 — Image to Video)",
    badge:    "MODEL",
    width: 240, bg: "#060f28", accent: "#16a34a",
    inputs: [
      { id: "image",  label: "Image",  kind: "image", required: true },
      { id: "prompt", label: "Prompt", kind: "text",  required: true },
    ],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
    infoLines: ["Official Runway Gen-4.5 model"],
  }),

  // ── TEXT TO SFX ──
  makeNode("sfx3", {
    title:    "Text to SFX",
    subtitle: "(Shot 3 Ambience)",
    badge:    "AUDIO",
    width: 200, bg: "#0e0d00", accent: "#eab308",
    inputs:  [{ id: "text", label: "Text", kind: "text" }],
    outputs: [{ id: "audio", label: "Audio", kind: "audio" }],
    infoLines: ["Official Runway audio node"],
  }),

  // ── ADD AUDIO ──
  makeNode("add_audio3", {
    title:    "Add Audio",
    subtitle: "(Shot 3)",
    badge:    "UTILITY",
    width: 190, bg: "#0a0c00", accent: "#eab308",
    inputs: [
      { id: "video", label: "Video", kind: "video", required: true },
      { id: "audio", label: "Audio", kind: "audio", required: true },
    ],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
  }),

  // ── FIRST FRAME — official Runway utility node (confirmed alongside Last Frame) ──
  makeNode("qa1", {
    title:    "First Frame",
    subtitle: "(QA Shot 1)",
    badge:    "UTILITY",
    width: 186, bg: "#100c00", accent: "#fbbf24",
    dim: true,
    inputs:  [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
    infoLines: ["Extracts opening frame for identity check"],
  }),
  makeNode("qa2", {
    title:    "First Frame",
    subtitle: "(QA Shot 2)",
    badge:    "UTILITY",
    width: 186, bg: "#100c00", accent: "#fbbf24",
    dim: true,
    inputs:  [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
    infoLines: ["Check continuity before Shot 3"],
  }),
  makeNode("qa3", {
    title:    "First Frame",
    subtitle: "(QA Shot 3)",
    badge:    "UTILITY",
    width: 186, bg: "#100c00", accent: "#fbbf24",
    dim: true,
    inputs:  [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
    infoLines: ["Final opening-frame quality check"],
  }),

  // ── UPSCALE — confirmed as "video upscaling nodes" in Runway changelog ──
  // Exact UI label "Upscale Video - Topaz AI" is operator-observed, not cited
  // from official Runway help articles.
  makeNode("upscale1", {
    title:    "Upscale Video",
    subtitle: "(Shot 1 — Topaz AI, operator label)",
    badge:    "UTILITY",
    width: 248, bg: "#030d1a", accent: "#38bdf8",
    inputs:  [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
    infoLines: ["Video upscaling confirmed in Runway changelog"],
  }),
  makeNode("upscale2", {
    title:    "Upscale Video",
    subtitle: "(Shot 2 — Topaz AI, operator label)",
    badge:    "UTILITY",
    width: 248, bg: "#030d1a", accent: "#38bdf8",
    inputs:  [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
  }),
  makeNode("upscale3", {
    title:    "Upscale Video",
    subtitle: "(Shot 3 — Topaz AI, operator label)",
    badge:    "UTILITY",
    width: 248, bg: "#030d1a", accent: "#38bdf8",
    inputs:  [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
  }),

  // ── STITCH — official Runway utility node ──
  makeNode("stitch", {
    title:    "Stitch",
    subtitle: "Final Sequence",
    badge:    "UTILITY",
    width: 204, bg: "#0d0220", accent: "#16a34a",
    inputs: [
      { id: "s1", label: "Input 1", kind: "video", required: true },
      { id: "s2", label: "Input 2", kind: "video", required: true },
      { id: "s3", label: "Input 3", kind: "video", required: true },
    ],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
    infoLines: ["Official Runway utility node — plays in order 1→2→3"],
  }),
];

// ─── POSITIONS ───────────────────────────────────────────────────────────────
const DEFAULT_POSITIONS: Record<string, Point> = {
  text_system: { x: 30,  y: 112 },
  text_user:   { x: 30,  y: 228 },
  image_ref:   { x: 30,  y: 344 },
  claude:      { x: 280, y: 196 },
  json_core:   { x: 608, y: 58  },
  json_meta:   { x: 608, y: 510 },

  nano_banana_2: { x: 950,  y: 152 },
  gen4_anchor:   { x: 1224, y: 144 },

  shot1:    { x: 1534, y: 152 },
  extract1: { x: 1820, y: 166 },
  trim1:    { x: 1820, y: 520 },
  last1:    { x: 2030, y: 520 },

  sfx1:       { x: 1534, y: 700 },
  add_audio1: { x: 1810, y: 700 },

  combine_text: { x: 2080, y: 440 },
  kling_s2:     { x: 2290, y: 144 },
  extract2:     { x: 2600, y: 166 },
  trim2:        { x: 2600, y: 520 },
  last2:        { x: 2808, y: 520 },

  extract_audio2: { x: 2290, y: 700 },
  add_audio2:     { x: 2574, y: 700 },

  shot3: { x: 3084, y: 152 },

  sfx3:       { x: 3084, y: 700 },
  add_audio3: { x: 3318, y: 700 },

  upscale1: { x: 3568, y: 68  },
  upscale2: { x: 3568, y: 310 },
  upscale3: { x: 3568, y: 552 },

  stitch: { x: 3870, y: 310 },

  qa1: { x: 1534, y: 612 },
  qa2: { x: 2290, y: 612 },
  qa3: { x: 3084, y: 612 },
};

// ─── WIRES ───────────────────────────────────────────────────────────────────
const WIRES: WireDef[] = [
  // Inputs → LLM
  { from: ["text_system", "text"],  to: ["claude", "system"], style: "main" },
  { from: ["text_user",   "text"],  to: ["claude", "prompt"], style: "main" },
  { from: ["image_ref",   "image"], to: ["claude", "image"],  style: "main" },

  // LLM → JSON Parse (both)
  { from: ["claude", "json"], to: ["json_core", "json"], style: "main" },
  { from: ["claude", "json"], to: ["json_meta", "json"], style: "main" },

  // JSON Core → Image Chain
  { from: ["json_core",     "master"], to: ["nano_banana_2", "prompt"], style: "main" },
  { from: ["image_ref",     "image"],  to: ["nano_banana_2", "image"],  style: "main" },
  { from: ["nano_banana_2", "image"],  to: ["gen4_anchor",   "image"],  style: "main" },

  // Anchor → Shot 1
  { from: ["gen4_anchor", "image"], to: ["shot1", "image"],  style: "main" },
  { from: ["json_core",   "shot1"], to: ["shot1", "prompt"], style: "main" },

  // Shot 1 → preferred handoff (Extract Frame → Kling)
  { from: ["shot1",    "video"], to: ["extract1", "video"],  style: "main" },
  { from: ["extract1", "image"], to: ["kling_s2", "image"],  style: "main" },

  // Shot 1 → fallback path (Trim Video → Last Frame)
  { from: ["shot1", "video"], to: ["trim1", "video"], style: "fallback" },
  { from: ["trim1", "video"], to: ["last1", "video"], style: "fallback" },

  // Shot 1 → QA (First Frame)
  { from: ["shot1", "video"], to: ["qa1", "video"], style: "qa", route: "v" },

  // Shot 1 → Audio lane (Text to SFX fed by shot1 prompt from JSON Parse)
  { from: ["json_core",  "shot1"], to: ["sfx1",       "text"],  style: "audio" },
  { from: ["shot1",      "video"], to: ["add_audio1", "video"], style: "audio" },
  { from: ["sfx1",       "audio"], to: ["add_audio1", "audio"], style: "audio" },

  // Shot 1 Add Audio → Upscale 1
  { from: ["add_audio1", "video"], to: ["upscale1", "video"], style: "main" },

  // Combine Text for Kling prompt
  { from: ["json_core",    "shot2"],        to: ["combine_text", "shot2_prompt"], style: "main" },
  { from: ["json_core",    "audio_prompt"], to: ["combine_text", "audio"],        style: "main" },
  { from: ["json_core",    "negative"],     to: ["combine_text", "negative"],     style: "main" },
  { from: ["combine_text", "text"],         to: ["kling_s2",     "prompt"],       style: "main" },

  // Shot 2 Kling → preferred handoff (Extract Frame → Shot 3)
  { from: ["kling_s2", "video"], to: ["extract2", "video"], style: "main" },
  { from: ["extract2", "image"], to: ["shot3",    "image"], style: "main" },

  // Shot 2 → fallback
  { from: ["kling_s2", "video"], to: ["trim2", "video"], style: "fallback" },
  { from: ["trim2",    "video"], to: ["last2", "video"], style: "fallback" },

  // Shot 2 → QA
  { from: ["kling_s2", "video"], to: ["qa2", "video"], style: "qa", route: "v" },

  // Shot 2 → Audio lane (Extract Audio from Kling native sound)
  { from: ["kling_s2",       "video"], to: ["extract_audio2", "video"], style: "audio" },
  { from: ["extract_audio2", "audio"], to: ["add_audio2",     "audio"], style: "audio" },
  { from: ["kling_s2",       "video"], to: ["add_audio2",     "video"], style: "audio" },

  // Shot 2 Add Audio → Upscale 2
  { from: ["add_audio2", "video"], to: ["upscale2", "video"], style: "main" },

  // Shot 3 prompt
  { from: ["json_core", "shot3"], to: ["shot3", "prompt"], style: "main" },

  // Shot 3 → QA
  { from: ["shot3", "video"], to: ["qa3", "video"], style: "qa", route: "v" },

  // Shot 3 → Audio lane
  { from: ["json_core",  "shot3"], to: ["sfx3",       "text"],  style: "audio" },
  { from: ["shot3",      "video"], to: ["add_audio3", "video"], style: "audio" },
  { from: ["sfx3",       "audio"], to: ["add_audio3", "audio"], style: "audio" },

  // Shot 3 Add Audio → Upscale 3
  { from: ["add_audio3", "video"], to: ["upscale3", "video"], style: "main" },

  // Upscale → Stitch
  { from: ["upscale1", "video"], to: ["stitch", "s1"], style: "main" },
  { from: ["upscale2", "video"], to: ["stitch", "s2"], style: "main" },
  { from: ["upscale3", "video"], to: ["stitch", "s3"], style: "main" },

  // Last Frame fallbacks feed next shot
  { from: ["last1", "image"], to: ["kling_s2", "image"], style: "fallback" },
  { from: ["last2", "image"], to: ["shot3",    "image"], style: "fallback" },

  // Canonical Anchor: strongest identity fallback for shots 2 & 3
  { from: ["gen4_anchor", "image"], to: ["kling_s2", "image"], style: "anchor", route: "pipe", pipeY: 840 },
  { from: ["gen4_anchor", "image"], to: ["shot3",    "image"], style: "anchor", route: "pipe", pipeY: 870 },
];

// ─── WIRE MARKER ID ──────────────────────────────────────────────────────────
function markerId(style: WireStyle) {
  const m: Record<WireStyle, string> = {
    main:     "arr-main",
    fallback: "arr-fallback",
    anchor:   "arr-anchor",
    qa:       "arr-qa",
    audio:    "arr-audio",
  };
  return m[style];
}

// ─── NODE BOX ────────────────────────────────────────────────────────────────
function NodeBox({
  spec,
  pos,
  onPointerDown,
}: {
  spec: NodeSpec;
  pos: Point;
  onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void;
}) {
  const height = getNodeHeight(spec);
  const rows   = Math.max(spec.inputs.length, spec.outputs.length, 1);

  return (
    <div
      onPointerDown={onPointerDown}
      style={{
        position: "absolute",
        left: pos.x, top: pos.y,
        width: spec.width, height,
        background: spec.bg,
        border: spec.accent ? `1.5px solid ${spec.accent}88` : `1px solid ${BORDER}`,
        borderRadius: 10,
        boxShadow: spec.accent
          ? `0 0 0 3px ${spec.accent}18, 0 8px 26px rgba(0,0,0,0.55)`
          : "0 8px 22px rgba(0,0,0,0.45)",
        opacity: spec.dim ? 0.58 : 1,
        userSelect: "none",
        overflow: "hidden",
      }}
    >
      {/* Accent bar — BAR_H = 4px */}
      <div
        style={{
          height: BAR_H,
          background: spec.accent
            ? `linear-gradient(90deg, ${spec.accent}, ${spec.accent}99)`
            : "rgba(255,255,255,0.06)",
        }}
      />
      {/* Content — PAD_TOP = 8px matches nodeHeaderH calculation */}
      <div style={{ padding: "8px 10px 8px", height: `calc(100% - ${BAR_H}px)`, boxSizing: "border-box", cursor: "grab" }}>
        {spec.badge && (
          <div style={{
            display: "inline-block", marginBottom: 6,
            padding: "2px 7px", borderRadius: 999,
            fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
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

        {/* Port rows — marginTop: PORT_MARGIN = 10px */}
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
              <div key={i} style={{
                color: i === 0 ? "#6f86a1" : TEXT_FAINT,
                fontSize: 8, lineHeight: 1.45, marginTop: i === 0 ? 0 : 2,
              }}>
                {line}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
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

// ─── CONTROL BUTTON ──────────────────────────────────────────────────────────
const controlBtnStyle: CSSProperties = {
  height: 30, borderRadius: 8,
  border: `1px solid ${BORDER}`, background: "#0f1928",
  color: "#607898", cursor: "pointer", fontSize: 14,
  display: "flex", alignItems: "center", justifyContent: "center",
  padding: "0 10px", whiteSpace: "nowrap",
};

// ─── INFO PANEL ──────────────────────────────────────────────────────────────
function InfoPanel() {
  const panelBg = "rgba(9,17,27,0.88)";
  const headStyle: CSSProperties = { color: "#93b8d8", fontSize: 10, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: 6 };
  const bodyStyle: CSSProperties = { color: TEXT_SUB, fontSize: 10, lineHeight: 1.65, margin: 0 };
  const divider:   CSSProperties = { width: 1, background: BORDER, alignSelf: "stretch" };

  return (
    <div style={{ display: "flex", gap: 0, borderRadius: 14, overflow: "hidden", border: `1px solid ${BORDER}`, background: panelBg, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", flexWrap: "wrap" }}>
      <div style={{ flex: "1 1 0", padding: "16px 18px", minWidth: 220 }}>
        <div style={headStyle}>Verified node names</div>
        <p style={bodyStyle}>
          Official Runway node names used: Gen-4.5, Gen-4 Image, Kling 3.0 Pro, Claude Opus 4.5,
          JSON Parse, Extract Frame, Last Frame, First Frame, Trim Video, Extract Audio,
          Add Audio, Text to SFX, Stitch. All confirmed in Runway changelog and help docs (April 2026).
        </p>
      </div>
      <div style={divider} />
      <div style={{ flex: "1 1 0", padding: "16px 18px", minWidth: 220 }}>
        <div style={headStyle}>Operator / external labels</div>
        <p style={bodyStyle}>
          "Nano Banana 2" is an external image model (not a native Runway node) accessed via the
          Image input node. "Combine Text" is the operator&apos;s label for a text-assembly utility
          node — not an officially documented Runway node name.
          "Upscale Video (Topaz AI)" is the operator-observed UI label; Runway confirms
          video upscaling nodes exist but does not publicly document the exact label.
        </p>
      </div>
      <div style={divider} />
      <div style={{ flex: "1 1 0", padding: "16px 18px", minWidth: 220 }}>
        <div style={headStyle}>Handoff fallback order</div>
        <p style={bodyStyle}>
          ① Extract Frame — preferred; pick the frame where both subjects are cleanly visible.{" "}
          ② Last Frame after Trim Video — fallback only; Trim Video must run first.{" "}
          ③ Gen-4 Image (Canonical Anchor) — strongest fallback; resets to a clean single-subject reference.
          If Extract Frame returns a two-subject frame with equal dominance, skip ② and use ③ directly.
        </p>
      </div>
      <div style={divider} />
      <div style={{ flex: "1 1 0", padding: "16px 18px", minWidth: 220 }}>
        <div style={headStyle}>Audio routing</div>
        <p style={bodyStyle}>
          Shots 1 &amp; 3 use Text to SFX fed by the shot&apos;s video prompt from JSON Parse Core.
          Shot 2 uses Extract Audio from the Kling native output, then re-attaches it via Add Audio.
          QA (First Frame) taps the raw shot output before the audio lane so QA is never blocked.
          Upscale runs after audio merge and before Stitch.
        </p>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function WSTVWorkflowDiagram({
  data: _data,
  onCopy: _onCopy,
}: {
  data?:    GeneratedPackage;
  onCopy?:  (t: string) => void;
}) {
  void _data;
  void _onCopy;

  const specMap = useMemo(
    () => Object.fromEntries(NODE_SPECS.map((n) => [n.id, n] as const)),
    []
  );

  const [positions, setPositions] = useState<Record<string, Point>>(DEFAULT_POSITIONS);
  const [zoom, setZoom]           = useState(0.38);
  const [pan,  setPan]            = useState<Point>({ x: 20, y: 20 });
  const [dragKind, setDragKind]   = useState<"canvas" | "node" | null>(null);

  // Refs keep wheel handler free of stale-closure issues
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef      = useRef(0.38);
  const panRef       = useRef<Point>({ x: 20, y: 20 });

  // Keep refs in sync with state
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panRef.current  = pan;  }, [pan]);

  const dragRef = useRef<
    | { kind: "canvas"; x: number; y: number }
    | { kind: "node";   id: string; x: number; y: number }
    | null
  >(null);

  // ── Port point calculation ────────────────────────────────────────────────
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

  // ── Fit screen ───────────────────────────────────────────────────────────
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
    const newZoom = Math.max(0.12, Math.min(1.4, Math.min(
      (cw - pad * 2) / (maxX - minX),
      (ch - pad * 2) / (maxY - minY),
    )));
    const newPan = {
      x: (cw - (maxX - minX) * newZoom) / 2 - minX * newZoom,
      y: (ch - (maxY - minY) * newZoom) / 2 - minY * newZoom,
    };

    zoomRef.current = newZoom;
    panRef.current  = newPan;
    setZoom(newZoom);
    setPan(newPan);
  }, [positions]);

  // ── Pointer handling ─────────────────────────────────────────────────────
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

  // ── Zoom toward cursor — the key UX improvement ───────────────────────────
  // Rather than zooming toward the canvas origin (0,0), we compute the world
  // position under the mouse and then adjust the pan offset so that point
  // stays fixed in screen space after the zoom change.
  const onWheel = useCallback((e: ReactWheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const el = containerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const mx   = e.clientX - rect.left;  // mouse x in canvas px
    const my   = e.clientY - rect.top;   // mouse y in canvas px

    const oldZoom = zoomRef.current;
    const oldPan  = panRef.current;

    // Use multiplicative scaling so each wheel tick is proportional
    const factor  = 1 - e.deltaY * 0.001;
    const newZoom = Math.max(0.12, Math.min(2.0, oldZoom * factor));

    // World position under the cursor (invariant we want to preserve)
    const worldX = (mx - oldPan.x) / oldZoom;
    const worldY = (my - oldPan.y) / oldZoom;

    // Recompute pan so worldX/worldY stays under mx/my
    const newPan = {
      x: mx - worldX * newZoom,
      y: my - worldY * newZoom,
    };

    zoomRef.current = newZoom;
    panRef.current  = newPan;
    setZoom(newZoom);
    setPan(newPan);
  }, []);

  const resetView = useCallback(() => {
    const z = 0.38;
    const p = { x: 20, y: 20 };
    zoomRef.current = z;
    panRef.current  = p;
    setZoom(z);
    setPan(p);
    setPositions(DEFAULT_POSITIONS);
    setDragKind(null);
    dragRef.current = null;
  }, []);

  const zoomBy = useCallback((delta: number) => {
    if (!containerRef.current) return;
    const el  = containerRef.current;
    const cx  = el.clientWidth  / 2;
    const cy  = el.clientHeight / 2;
    const oz  = zoomRef.current;
    const op  = panRef.current;
    const nz  = Math.max(0.12, Math.min(2.0, oz + delta));
    const wx  = (cx - op.x) / oz;
    const wy  = (cy - op.y) / oz;
    const np  = { x: cx - wx * nz, y: cy - wy * nz };
    zoomRef.current = nz;
    panRef.current  = np;
    setZoom(nz);
    setPan(np);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%" }}>
      {/* ── Canvas ── */}
      <div
        ref={containerRef}
        style={{
          width: "100%", height: 820,
          borderRadius: 18, overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.07)",
          background: BG, position: "relative",
          cursor: dragKind === "canvas" ? "grabbing" : "grab",
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
          <button onClick={() => zoomBy(-0.08)} style={controlBtnStyle}>−</button>
          <button onClick={() => zoomBy(+0.08)} style={controlBtnStyle}>+</button>
          <button onClick={fitScreen}           style={controlBtnStyle}>Fit</button>
          <button onClick={resetView}           style={controlBtnStyle}>Reset</button>
        </div>

        {/* Pannable / zoomable inner canvas */}
        <div style={{
          position: "absolute", left: 0, top: 0,
          transformOrigin: "0 0",
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          width: VIEW_W, height: VIEW_H,
        }}>
          {/* SVG wires */}
          <svg width={VIEW_W} height={VIEW_H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <defs>
              {(["main","fallback","anchor","qa","audio"] as WireStyle[]).map((style) => (
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
              else if (wire.route === "pipe") d = pipeCurve(from, to, wire.pipeY ?? 840);
              else                            d = hCurve(from, to, 72);

              const dashed      = wire.style !== "main";
              const opacity     = wire.style === "qa" ? 0.55 : wire.style === "anchor" ? 0.68 : wire.style === "fallback" ? 0.78 : wire.style === "audio" ? 0.80 : 1;
              const strokeWidth = wire.style === "main" ? 2.35 : wire.style === "audio" ? 1.65 : 1.35;

              return (
                <g key={idx}>
                  {wire.style === "main"  && <path d={d} fill="none" stroke={color} strokeWidth={5}  opacity={0.12} />}
                  {wire.style === "audio" && <path d={d} fill="none" stroke={color} strokeWidth={4}  opacity={0.09} />}
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
          <SectionLabel x={30}   y={88}  text="Inputs" />
          <SectionLabel x={280}  y={170} text="LLM — Claude Opus 4.5" />
          <SectionLabel x={608}  y={36}  text="JSON Parse — Core" />
          <SectionLabel x={608}  y={486} text="JSON Parse — Meta (reference only)" />
          <SectionLabel x={950}  y={126} text="Image Chain (External + Gen-4 Image)" />
          <SectionLabel x={1224} y={116} text="Canonical Anchor" color="#9d71ff" />
          <SectionLabel x={1534} y={126} text="Shot 1 — Gen-4.5" />
          <SectionLabel x={2290} y={118} text="Shot 2 — Kling 3.0 Pro" />
          <SectionLabel x={3084} y={126} text="Shot 3 — Gen-4.5" />
          <SectionLabel x={1534} y={488} text="Fallback · QA Lane" color="#8c6a10" />
          <SectionLabel x={1534} y={672} text="Audio Lane" color="#8a7200" />
          <SectionLabel x={3568} y={44}  text="Upscale · Stitch" color="#1e5a70" />

          {/* Title watermark */}
          <div style={{
            position: "absolute", left: 30, top: 20,
            color: "#1e2f42", fontSize: 11, fontWeight: 700,
            letterSpacing: "0.12em", textTransform: "uppercase",
          }}>
            Wild Stories TV · AI Cinematic Pipeline · Node names verified Apr 2026
          </div>

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
            position: "absolute", left: 30, bottom: 30,
            display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap",
            padding: "10px 12px", borderRadius: 12,
            background: "rgba(9,17,27,0.78)", border: `1px solid ${BORDER}`,
          }}>
            {([
              { label: "Main pipeline",            color: WIRE_COLORS.main,     dashed: false },
              { label: "Audio flow",                color: WIRE_COLORS.audio,    dashed: true  },
              { label: "Last Frame fallback",       color: WIRE_COLORS.fallback, dashed: true  },
              { label: "Canonical Anchor fallback", color: WIRE_COLORS.anchor,   dashed: true  },
              { label: "First Frame QA",            color: WIRE_COLORS.qa,       dashed: true  },
            ] as const).map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <svg width={34} height={10}>
                  <line x1={0} y1={5} x2={34} y2={5}
                    stroke={item.color}
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

      {/* Info Panel */}
      <InfoPanel />
    </div>
  );
}
