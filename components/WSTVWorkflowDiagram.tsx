"use client";

import {
  useMemo,
  useRef,
  useState,
  useCallback,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import type { GeneratedPackage } from "@/types";

type PortKind = "text" | "image" | "audio" | "video";
type Side = "left" | "right";
type Point = { x: number; y: number };

type PortDef = {
  id: string;
  label: string;
  kind: PortKind;
  required?: boolean;
};

type NodeSpec = {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  width: number;
  bg: string;
  accent?: string;
  dim?: boolean;
  inputs: PortDef[];
  outputs: PortDef[];
  infoLines?: string[];
};

type WireStyle = "main" | "fallback" | "anchor" | "qa" | "audio";

type WireDef = {
  from: [string, string];
  to: [string, string];
  style: WireStyle;
  route?: "h" | "v" | "pipe";
  pipeY?: number;
};

const PORT_COLORS: Record<PortKind, string> = {
  text: "#f59e0b",
  image: "#3b82f6",
  audio: "#eab308",
  video: "#22c55e",
};

const WIRE_COLORS: Record<WireStyle, string> = {
  main: "#60a5fa",
  fallback: "#fb923c",
  anchor: "#c084fc",
  qa: "#fbbf24",
  audio: "#eab308",
};

const BG = "#060c14";
const GRID_MINOR = "#101827";
const GRID_MAJOR = "#172335";
const BORDER = "rgba(255,255,255,0.08)";
const TEXT_MAIN = "#edf2f8";
const TEXT_SUB = "#7b8ca3";
const TEXT_FAINT = "#526579";

// FIX #1: VIEW_W expanded from 3880 → 4200.
// Stitch node sits at x:3840 with width:200, so right edge = 4040.
// Previous VIEW_W of 3880 clipped the node. 4200 gives a clean 160px margin.
const VIEW_W = 4200;
const VIEW_H = 960;

// ─── LAYOUT CONSTANTS ────────────────────────────────────────────────────────
// FIX #2: Replace single flat HEADER_H constant with per-node calculation.
// Old approach used HEADER_H=44 + BODY_TOP=12 = 56px as a fixed base for all
// nodes, but actual header height differs significantly:
//   • badge + subtitle node  → ~71px header
//   • badge, no subtitle     → ~57px header
//   • no badge, has subtitle → ~50px header
//   • no badge, no subtitle  → ~36px header
// This delta caused wires to miss port dots by up to ±20px.
//
// New approach: nodeHeaderH(spec) computes the exact header height per node,
// which is then used by both getNodeHeight() and getPortY().
// ─────────────────────────────────────────────────────────────────────────────

const ROW_H      = 20;  // height of each port row
const FOOTER_PAD = 10;  // padding below last port row

// Measured component sub-heights (based on CSS in NodeBox):
const BAR_H       = 4;   // top accent color bar
const PAD_TOP     = 8;   // padding-top inside the content div
const BADGE_H     = 21;  // badge inline-block: fontSize9*lineHeight1.2 + pad2+2 + marginBottom6
const TITLE_H     = 14;  // title: fontSize12.5 * lineHeight1.15
const SUBTITLE_H  = 14;  // subtitle: marginTop2 + fontSize9 * lineHeight1.3
const PORT_MARGIN = 10;  // marginTop before the port row container
// Dot sits at top: ROW_H/2 - 4.5 = 5.5 within its row div → dot center offset:
const DOT_OFFSET  = 5.5;

/**
 * Returns the total header height from node top to the start of the port
 * container. This is what getPortY adds before the per-row offset.
 */
function nodeHeaderH(spec: NodeSpec): number {
  return (
    BAR_H +
    PAD_TOP +
    (spec.badge ? BADGE_H : 0) +
    TITLE_H +
    (spec.subtitle ? SUBTITLE_H : 0) +
    PORT_MARGIN
  );
}

/** Total pixel height for a node box. */
function getNodeHeight(spec: NodeSpec): number {
  const rowCount  = Math.max(spec.inputs.length, spec.outputs.length, 1);
  const infoExtra = (spec.infoLines?.length ?? 0) * 11;
  return (
    nodeHeaderH(spec) +
    rowCount * ROW_H +
    (infoExtra ? infoExtra + 10 : 0) +
    FOOTER_PAD
  );
}

/**
 * Y offset of a port dot's center from the node's top edge.
 * Spec is required so we can compute the correct header height.
 */
function getPortDotY(spec: NodeSpec, index: number): number {
  return nodeHeaderH(spec) + index * ROW_H + DOT_OFFSET;
}

function hCurve(a: Point, b: Point, strength = 64) {
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
// All nodes here are real nodes present in the operator's actual Runway canvas.
// Node titles reflect what is visible in the operator's UI.
// Some names (e.g. Combine Text, Upscale Video - Topaz AI) are grounded in the
// operator's actual UI workflow and are NOT citations from Runway public help docs.
// Audio node names use real node names with workflow labels in parentheses.
// ─────────────────────────────────────────────────────────────────────────────

const NODE_SPECS: NodeSpec[] = [
  // ── INPUTS ──
  makeNode("text_system", {
    title: "Text",
    subtitle: "(System Prompt)",
    badge: "INPUT",
    width: 178,
    bg: "#0c1520",
    inputs: [],
    outputs: [{ id: "text", label: "Text", kind: "text" }],
  }),
  makeNode("text_user", {
    title: "Text",
    subtitle: "(User Story Prompt)",
    badge: "INPUT",
    width: 178,
    bg: "#0c1520",
    inputs: [],
    outputs: [{ id: "text", label: "Text", kind: "text" }],
  }),
  makeNode("image_ref", {
    title: "Image",
    subtitle: "(Reference)",
    badge: "INPUT",
    width: 178,
    bg: "#0c1520",
    inputs: [],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
  }),

  // ── AI DIRECTOR ──
  makeNode("claude", {
    title: "Claude",
    subtitle: "Prompt Planner",
    badge: "MODEL",
    width: 222,
    bg: "#14092e",
    accent: "#f97316",
    inputs: [
      { id: "system", label: "System Prompt", kind: "text", required: true },
      { id: "prompt", label: "Prompt",        kind: "text", required: true },
      { id: "image",  label: "Image",          kind: "image" },
    ],
    outputs: [{ id: "json", label: "JSON", kind: "text" }],
  }),

  // ── STRUCTURED OUTPUT ──
  makeNode("json_core", {
    title: "JSON Parse",
    subtitle: "(Core Outputs)",
    badge: "UTILITY",
    width: 284,
    bg: "#070c18",
    accent: "#16a34a",
    inputs: [{ id: "json", label: "JSON", kind: "text", required: true }],
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
  }),
  makeNode("json_meta", {
    title: "JSON Parse",
    subtitle: "(Meta Outputs)",
    badge: "UTILITY",
    width: 284,
    bg: "#070c18",
    accent: "#16a34a",
    inputs: [{ id: "json", label: "JSON", kind: "text", required: true }],
    outputs: [
      { id: "mi1",     label: "motion_intensity.shot1", kind: "text" },
      { id: "mi2",     label: "motion_intensity.shot2", kind: "text" },
      { id: "mi3",     label: "motion_intensity.shot3", kind: "text" },
      { id: "hook",    label: "hook",                   kind: "text" },
      { id: "caption", label: "caption",                kind: "text" },
    ],
  }),

  // ── IMAGE CHAIN ──
  makeNode("nano_banana_2", {
    title: "Nano Banana 2",
    subtitle: "Master Still Generator",
    badge: "MODEL",
    width: 216,
    bg: "#051a0e",
    accent: "#16a34a",
    inputs: [
      { id: "prompt", label: "Prompt", kind: "text",  required: true },
      { id: "image",  label: "Image",  kind: "image" },
    ],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
  }),

  // ── CANONICAL ANCHOR ──
  makeNode("gen4_anchor", {
    title: "Gen-4 Image",
    subtitle: "(Canonical Anchor)",
    badge: "MODEL",
    width: 232,
    bg: "#1a0544",
    accent: "#c084fc",
    inputs:  [{ id: "image", label: "Image", kind: "image", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
  }),

  // ── SHOT 1 ──
  makeNode("shot1", {
    title: "Gen-4.5",
    subtitle: "(Shot 1)",
    badge: "MODEL",
    width: 228,
    bg: "#060f28",
    accent: "#16a34a",
    inputs: [
      { id: "image",  label: "Image",  kind: "image", required: true },
      { id: "prompt", label: "Prompt", kind: "text",  required: true },
    ],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
  }),
  // Extract Frame — preferred handoff from shot1 to shot2 input
  makeNode("extract1", {
    title: "Extract Frame",
    subtitle: "(Shot 1 Handoff)",
    badge: "UTILITY",
    width: 190,
    bg: "#041420",
    accent: "#16a34a",
    inputs:  [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
  }),
  // Trim Video — fallback only; must run before Last Frame
  makeNode("trim1", {
    title: "Trim Video",
    subtitle: "(Shot 1 Fallback)",
    badge: "UTILITY",
    width: 190,
    bg: "#071318",
    accent: "#16a34a",
    inputs:  [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
  }),
  // Last Frame — fallback only; receives trimmed video
  makeNode("last1", {
    title: "Last Frame",
    subtitle: "(Shot 1 Fallback)",
    badge: "UTILITY",
    width: 186,
    bg: "#160202",
    accent: "#fb923c",
    dim: true,
    inputs:  [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
  }),

  // ── SHOT 1 AUDIO LANE ──
  // FIX #3: sfx1 text input is now wired from json_core.shot1 (shot1_video_prompt).
  // The shot prompt describes the action and environment, which directly drives
  // ambient SFX generation in Runway Text to SFX. Previously this input was
  // shown but had no wire, leaving it as a floating unconnected port.
  makeNode("sfx1", {
    title: "Text to SFX",
    subtitle: "(Shot 1 Ambience)",
    badge: "AUDIO",
    width: 200,
    bg: "#0e0d00",
    accent: "#eab308",
    inputs:  [{ id: "text", label: "Text", kind: "text" }],
    outputs: [{ id: "audio", label: "Audio", kind: "audio" }],
  }),
  makeNode("add_audio1", {
    title: "Add Audio",
    subtitle: "(Shot 1)",
    badge: "UTILITY",
    width: 190,
    bg: "#0a0c00",
    accent: "#eab308",
    inputs: [
      { id: "video", label: "Video", kind: "video", required: true },
      { id: "audio", label: "Audio", kind: "audio", required: true },
    ],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
  }),

  // ── SHOT 2 — KLING ──
  // Combine Text — node name grounded in operator's actual Runway UI workflow.
  // Not cited in Runway public help documentation.
  makeNode("combine_text", {
    title: "Combine Text",
    subtitle: "(Kling Prompt)",
    badge: "UTILITY",
    width: 212,
    bg: "#09111e",
    accent: "#2563eb",
    inputs: [
      { id: "shot2_prompt", label: "shot2_video_prompt",    kind: "text", required: true },
      { id: "audio",        label: "shot2_audio_prompt",    kind: "text" },
      { id: "negative",     label: "kling_negative_prompt", kind: "text" },
    ],
    outputs: [{ id: "text", label: "Text", kind: "text" }],
  }),
  makeNode("kling_s2", {
    title: "Kling 3.0 Pro",
    subtitle: "(Shot 2)",
    badge: "MODEL",
    width: 244,
    bg: "#1e0b00",
    accent: "#2563eb",
    inputs: [
      { id: "image",  label: "Image",  kind: "image", required: true },
      { id: "prompt", label: "Prompt", kind: "text",  required: true },
    ],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
  }),
  // Extract Frame — preferred handoff from shot2 to shot3 input
  makeNode("extract2", {
    title: "Extract Frame",
    subtitle: "(Shot 2 Handoff)",
    badge: "UTILITY",
    width: 190,
    bg: "#041420",
    accent: "#16a34a",
    inputs:  [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
  }),
  // Trim Video — fallback only; must run before Last Frame
  makeNode("trim2", {
    title: "Trim Video",
    subtitle: "(Shot 2 Fallback)",
    badge: "UTILITY",
    width: 190,
    bg: "#071318",
    accent: "#16a34a",
    inputs:  [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
  }),
  // Last Frame — fallback only; receives trimmed video
  makeNode("last2", {
    title: "Last Frame",
    subtitle: "(Shot 2 Fallback)",
    badge: "UTILITY",
    width: 186,
    bg: "#160202",
    accent: "#fb923c",
    dim: true,
    inputs:  [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
  }),

  // ── SHOT 2 AUDIO LANE ──
  makeNode("extract_audio2", {
    title: "Extract Audio",
    subtitle: "(Shot 2 Native Sound)",
    badge: "AUDIO",
    width: 210,
    bg: "#0e0d00",
    accent: "#eab308",
    inputs:  [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "audio", label: "Audio", kind: "audio" }],
  }),
  makeNode("add_audio2", {
    title: "Add Audio",
    subtitle: "(Shot 2)",
    badge: "UTILITY",
    width: 190,
    bg: "#0a0c00",
    accent: "#eab308",
    inputs: [
      { id: "video", label: "Video", kind: "video", required: true },
      { id: "audio", label: "Audio", kind: "audio", required: true },
    ],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
  }),

  // ── SHOT 3 ──
  makeNode("shot3", {
    title: "Gen-4.5",
    subtitle: "(Shot 3)",
    badge: "MODEL",
    width: 228,
    bg: "#060f28",
    accent: "#16a34a",
    inputs: [
      { id: "image",  label: "Image",  kind: "image", required: true },
      { id: "prompt", label: "Prompt", kind: "text",  required: true },
    ],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
  }),

  // ── SHOT 3 AUDIO LANE ──
  // FIX #3 (continued): sfx3 text input wired from json_core.shot3.
  makeNode("sfx3", {
    title: "Text to SFX",
    subtitle: "(Shot 3 Ambience)",
    badge: "AUDIO",
    width: 200,
    bg: "#0e0d00",
    accent: "#eab308",
    inputs:  [{ id: "text", label: "Text", kind: "text" }],
    outputs: [{ id: "audio", label: "Audio", kind: "audio" }],
  }),
  makeNode("add_audio3", {
    title: "Add Audio",
    subtitle: "(Shot 3)",
    badge: "UTILITY",
    width: 190,
    bg: "#0a0c00",
    accent: "#eab308",
    inputs: [
      { id: "video", label: "Video", kind: "video", required: true },
      { id: "audio", label: "Audio", kind: "audio", required: true },
    ],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
  }),

  // ── QA ──
  makeNode("qa1", {
    title: "First Frame",
    subtitle: "(QA Shot 1)",
    badge: "UTILITY",
    width: 184,
    bg: "#100c00",
    accent: "#fbbf24",
    dim: true,
    inputs:  [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
  }),
  makeNode("qa2", {
    title: "First Frame",
    subtitle: "(QA Shot 2)",
    badge: "UTILITY",
    width: 184,
    bg: "#100c00",
    accent: "#fbbf24",
    dim: true,
    inputs:  [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
  }),
  makeNode("qa3", {
    title: "First Frame",
    subtitle: "(QA Shot 3)",
    badge: "UTILITY",
    width: 184,
    bg: "#100c00",
    accent: "#fbbf24",
    dim: true,
    inputs:  [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
  }),

  // ── UPSCALE ──
  // Node title "Upscale Video - Topaz AI" is grounded in the operator's actual
  // Runway UI. Runway publicly documents video upscaling support in workflows,
  // but the exact node label below is NOT cited from Runway public help articles.
  makeNode("upscale1", {
    title: "Upscale Video - Topaz AI",
    subtitle: "(Shot 1)",
    badge: "UTILITY",
    width: 238,
    bg: "#030d1a",
    accent: "#38bdf8",
    inputs:  [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
  }),
  makeNode("upscale2", {
    title: "Upscale Video - Topaz AI",
    subtitle: "(Shot 2)",
    badge: "UTILITY",
    width: 238,
    bg: "#030d1a",
    accent: "#38bdf8",
    inputs:  [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
  }),
  makeNode("upscale3", {
    title: "Upscale Video - Topaz AI",
    subtitle: "(Shot 3)",
    badge: "UTILITY",
    width: 238,
    bg: "#030d1a",
    accent: "#38bdf8",
    inputs:  [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
  }),

  // ── FINAL ──
  makeNode("stitch", {
    title: "Stitch",
    subtitle: "Final Sequence",
    badge: "UTILITY",
    width: 200,
    bg: "#0d0220",
    accent: "#16a34a",
    inputs: [
      { id: "s1", label: "Input 1", kind: "video", required: true },
      { id: "s2", label: "Input 2", kind: "video", required: true },
      { id: "s3", label: "Input 3", kind: "video", required: true },
    ],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
  }),
];

// ─── POSITIONS ───────────────────────────────────────────────────────────────

const DEFAULT_POSITIONS: Record<string, Point> = {
  // Inputs
  text_system: { x: 30,  y: 112 },
  text_user:   { x: 30,  y: 228 },
  image_ref:   { x: 30,  y: 344 },

  // AI Director
  claude: { x: 276, y: 196 },

  // Structured Output
  json_core: { x: 596, y: 58  },
  json_meta: { x: 596, y: 510 },

  // Image Chain
  nano_banana_2: { x: 938,  y: 152 },
  gen4_anchor:   { x: 1204, y: 144 },

  // Shot 1 — main lane
  shot1:    { x: 1514, y: 152 },
  extract1: { x: 1784, y: 166 },

  // Shot 1 — audio lane (below main)
  sfx1:       { x: 1514, y: 700 },
  add_audio1: { x: 1780, y: 700 },

  // Shot 1 — fallback lane
  trim1: { x: 1784, y: 520 },
  last1: { x: 1984, y: 520 },

  // Kling Prompt Combiner
  combine_text: { x: 2060, y: 440 },

  // Shot 2 — Kling — main lane
  kling_s2: { x: 2268, y: 144 },
  extract2: { x: 2570, y: 166 },

  // Shot 2 — audio lane
  extract_audio2: { x: 2268, y: 700 },
  add_audio2:     { x: 2548, y: 700 },

  // Shot 2 — fallback lane
  trim2: { x: 2570, y: 520 },
  last2: { x: 2766, y: 520 },

  // Shot 3
  shot3: { x: 3054, y: 152 },

  // Shot 3 — audio lane
  sfx3:       { x: 3054, y: 700 },
  add_audio3: { x: 3280, y: 700 },

  // Upscale column — receives audio-merged video
  upscale1: { x: 3550, y: 68  },
  upscale2: { x: 3550, y: 310 },
  upscale3: { x: 3550, y: 552 },

  // Final — x:3840, right edge:4040. Now safely inside VIEW_W:4200.
  stitch: { x: 3840, y: 310 },

  // QA
  qa1: { x: 1514, y: 612 },
  qa2: { x: 2268, y: 612 },
  qa3: { x: 3054, y: 612 },
};

// ─── WIRES ───────────────────────────────────────────────────────────────────

const WIRES: WireDef[] = [
  // ── Inputs → Claude ──
  { from: ["text_system", "text"],  to: ["claude", "system"], style: "main" },
  { from: ["text_user",   "text"],  to: ["claude", "prompt"], style: "main" },
  { from: ["image_ref",   "image"], to: ["claude", "image"],  style: "main" },

  // ── Claude → JSON Parse nodes ──
  { from: ["claude", "json"], to: ["json_core", "json"], style: "main" },
  { from: ["claude", "json"], to: ["json_meta", "json"], style: "main" },

  // ── JSON Core → Image Chain ──
  { from: ["json_core",     "master"], to: ["nano_banana_2", "prompt"], style: "main" },
  { from: ["image_ref",     "image"],  to: ["nano_banana_2", "image"],  style: "main" },
  { from: ["nano_banana_2", "image"],  to: ["gen4_anchor",   "image"],  style: "main" },

  // ── Canonical Anchor → Shot 1 ──
  { from: ["gen4_anchor", "image"], to: ["shot1",   "image"],  style: "main" },
  { from: ["json_core",   "shot1"], to: ["shot1",   "prompt"], style: "main" },

  // ── Shot 1: preferred handoff (Extract Frame direct from shot1) ──
  { from: ["shot1",    "video"], to: ["extract1", "video"], style: "main" },
  { from: ["extract1", "image"], to: ["kling_s2", "image"], style: "main" },

  // ── Shot 1: fallback path (Trim Video → Last Frame) ──
  { from: ["shot1", "video"], to: ["trim1", "video"], style: "fallback" },
  { from: ["trim1", "video"], to: ["last1", "video"], style: "fallback" },

  // ── Shot 1: QA (direct from shot1, before audio) ──
  { from: ["shot1", "video"], to: ["qa1", "video"], style: "qa", route: "v" },

  // ── Shot 1: audio lane ──
  // FIX #3: json_core.shot1 (shot1_video_prompt) → sfx1.text now wired.
  // This gives Text to SFX the action/environment context to generate
  // matching ambient audio without a manual text entry in Runway.
  { from: ["json_core",  "shot1"], to: ["sfx1",       "text"],  style: "audio" },
  { from: ["shot1",      "video"], to: ["add_audio1", "video"], style: "audio" },
  { from: ["sfx1",       "audio"], to: ["add_audio1", "audio"], style: "audio" },

  // ── Shot 1: Add Audio → Upscale ──
  { from: ["add_audio1", "video"], to: ["upscale1", "video"], style: "main" },

  // ── Combine Text for Kling prompt ──
  { from: ["json_core",    "shot2"],        to: ["combine_text", "shot2_prompt"], style: "main" },
  { from: ["json_core",    "audio_prompt"], to: ["combine_text", "audio"],        style: "main" },
  { from: ["json_core",    "negative"],     to: ["combine_text", "negative"],     style: "main" },
  { from: ["combine_text", "text"],         to: ["kling_s2",     "prompt"],       style: "main" },

  // ── Shot 2 — Kling: preferred handoff (Extract Frame direct from kling_s2) ──
  { from: ["kling_s2", "video"], to: ["extract2", "video"], style: "main" },
  { from: ["extract2", "image"], to: ["shot3",    "image"], style: "main" },

  // ── Shot 2 — Kling: fallback path (Trim Video → Last Frame) ──
  { from: ["kling_s2", "video"], to: ["trim2", "video"], style: "fallback" },
  { from: ["trim2",    "video"], to: ["last2", "video"], style: "fallback" },

  // ── Shot 2: QA (direct from kling_s2, before audio) ──
  { from: ["kling_s2", "video"], to: ["qa2", "video"], style: "qa", route: "v" },

  // ── Shot 2: audio lane (Extract Audio from Kling, re-attach via Add Audio) ──
  { from: ["kling_s2",       "video"], to: ["extract_audio2", "video"], style: "audio" },
  { from: ["extract_audio2", "audio"], to: ["add_audio2",     "audio"], style: "audio" },
  { from: ["kling_s2",       "video"], to: ["add_audio2",     "video"], style: "audio" },

  // ── Shot 2: Add Audio → Upscale ──
  { from: ["add_audio2", "video"], to: ["upscale2", "video"], style: "main" },

  // ── Shot 3 prompt ──
  { from: ["json_core", "shot3"], to: ["shot3", "prompt"], style: "main" },

  // ── Shot 3: QA (direct from shot3, before audio) ──
  { from: ["shot3", "video"], to: ["qa3", "video"], style: "qa", route: "v" },

  // ── Shot 3: audio lane ──
  // FIX #3 (continued): json_core.shot3 → sfx3.text wired.
  { from: ["json_core",  "shot3"], to: ["sfx3",       "text"],  style: "audio" },
  { from: ["shot3",      "video"], to: ["add_audio3", "video"], style: "audio" },
  { from: ["sfx3",       "audio"], to: ["add_audio3", "audio"], style: "audio" },

  // ── Shot 3: Add Audio → Upscale ──
  { from: ["add_audio3", "video"], to: ["upscale3", "video"], style: "main" },

  // ── Upscale → Stitch ──
  { from: ["upscale1", "video"], to: ["stitch", "s1"], style: "main" },
  { from: ["upscale2", "video"], to: ["stitch", "s2"], style: "main" },
  { from: ["upscale3", "video"], to: ["stitch", "s3"], style: "main" },

  // ── Last Frame fallbacks feed next shot ──
  { from: ["last1", "image"], to: ["kling_s2", "image"], style: "fallback" },
  { from: ["last2", "image"], to: ["shot3",    "image"], style: "fallback" },

  // ── Canonical Anchor: strongest identity fallback for shots 2 & 3 ──
  // Use this when Extract Frame produces a frame with two subjects visible
  // (predator + prey both prominent) — anchor resets to clean single-subject ref.
  { from: ["gen4_anchor", "image"], to: ["kling_s2", "image"], style: "anchor", route: "pipe", pipeY: 840 },
  { from: ["gen4_anchor", "image"], to: ["shot3",    "image"], style: "anchor", route: "pipe", pipeY: 870 },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function markerId(style: WireStyle) {
  switch (style) {
    case "main":     return "arr-main";
    case "fallback": return "arr-fallback";
    case "anchor":   return "arr-anchor";
    case "qa":       return "arr-qa";
    case "audio":    return "arr-audio";
  }
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
        left: pos.x,
        top: pos.y,
        width: spec.width,
        height,
        background: spec.bg,
        border: spec.accent
          ? `1.5px solid ${spec.accent}88`
          : `1px solid ${BORDER}`,
        borderRadius: 10,
        boxShadow: spec.accent
          ? `0 0 0 3px ${spec.accent}18, 0 8px 26px rgba(0,0,0,0.55)`
          : "0 8px 22px rgba(0,0,0,0.45)",
        opacity: spec.dim ? 0.58 : 1,
        userSelect: "none",
        overflow: "hidden",
      }}
    >
      {/* Accent color bar — BAR_H = 4px */}
      <div
        style={{
          height: BAR_H,
          background: spec.accent
            ? `linear-gradient(90deg, ${spec.accent}, ${spec.accent}99)`
            : "rgba(255,255,255,0.06)",
        }}
      />
      {/* Content area — PAD_TOP = 8px matching our nodeHeaderH calculation */}
      <div
        style={{
          padding: "8px 10px 8px",
          height: `calc(100% - ${BAR_H}px)`,
          boxSizing: "border-box",
          cursor: "grab",
        }}
      >
        {spec.badge && (
          <div
            style={{
              display: "inline-block",
              marginBottom: 6,
              padding: "2px 7px",
              borderRadius: 999,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: spec.accent ?? "#93c5fd",
              background: "rgba(255,255,255,0.05)",
            }}
          >
            {spec.badge}
          </div>
        )}
        <div
          style={{
            color: spec.accent ? "#f5f3ff" : TEXT_MAIN,
            fontSize: 12.5,
            fontWeight: 700,
            lineHeight: 1.15,
          }}
        >
          {spec.title}
        </div>
        {spec.subtitle && (
          <div
            style={{
              color: TEXT_SUB,
              fontSize: 9,
              marginTop: 2,
              lineHeight: 1.3,
            }}
          >
            {spec.subtitle}
          </div>
        )}

        {/* Port rows — marginTop: PORT_MARGIN = 10px, matching nodeHeaderH */}
        <div
          style={{
            position: "relative",
            marginTop: PORT_MARGIN,
            minHeight: rows * ROW_H,
          }}
        >
          {Array.from({ length: rows }).map((_, i) => {
            const input  = spec.inputs[i];
            const output = spec.outputs[i];
            const y = i * ROW_H;

            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 0,
                  top: y,
                  width: "100%",
                  height: ROW_H,
                }}
              >
                {input && (
                  <>
                    <div
                      style={{
                        position: "absolute",
                        left: -15,
                        // Dot center matches DOT_OFFSET = ROW_H/2 - 4.5 = 5.5
                        top: ROW_H / 2 - 4.5,
                        width: 9,
                        height: 9,
                        borderRadius: 999,
                        background: PORT_COLORS[input.kind],
                        border: "1.5px solid #09111b",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 2,
                        fontSize: 8.5,
                        color: TEXT_SUB,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {input.label}
                      {input.required ? "*" : ""}
                    </div>
                  </>
                )}

                {output && (
                  <>
                    <div
                      style={{
                        position: "absolute",
                        right: -15,
                        top: ROW_H / 2 - 4.5,
                        width: 9,
                        height: 9,
                        borderRadius: 999,
                        background: PORT_COLORS[output.kind],
                        border: "1.5px solid #09111b",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        right: 0,
                        top: 2,
                        fontSize: 8.5,
                        color: output.kind === "text" ? "#dbeafe" : TEXT_SUB,
                        whiteSpace: "nowrap",
                        textAlign: "right",
                      }}
                    >
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
              <div
                key={i}
                style={{
                  color: i === 0 ? "#6f86a1" : TEXT_FAINT,
                  fontSize: 8,
                  lineHeight: 1.45,
                  marginTop: i === 0 ? 0 : 2,
                }}
              >
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

function SectionLabel({
  x,
  y,
  text,
  color = "#2b3b50",
}: {
  x: number;
  y: number;
  text: string;
  color?: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        color,
        fontSize: 8,
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        pointerEvents: "none",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
}

// ─── CONTROL BUTTON STYLE ────────────────────────────────────────────────────

const controlBtnStyle: CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 8,
  border: `1px solid ${BORDER}`,
  background: "#0f1928",
  color: "#607898",
  cursor: "pointer",
  fontSize: 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

// ─── INFO PANEL ──────────────────────────────────────────────────────────────

function InfoPanel() {
  const panelBg = "rgba(9,17,27,0.88)";
  const headStyle: CSSProperties = {
    color: "#93b8d8",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.10em",
    textTransform: "uppercase",
    marginBottom: 6,
  };
  const bodyStyle: CSSProperties = {
    color: TEXT_SUB,
    fontSize: 10,
    lineHeight: 1.65,
    margin: 0,
  };
  const dividerStyle: CSSProperties = {
    width: 1,
    background: BORDER,
    alignSelf: "stretch",
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 0,
        borderRadius: 14,
        overflow: "hidden",
        border: `1px solid ${BORDER}`,
        background: panelBg,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      }}
    >
      {/* Col 1: Canonical Anchor */}
      <div style={{ flex: "1 1 0", padding: "16px 18px" }}>
        <div style={headStyle}>Canonical Anchor</div>
        <p style={bodyStyle}>
          Gen-4 Image (Canonical Anchor) is a Runway-generated reference still derived from the
          Nano Banana 2 master image. It serves as the strongest identity fallback for the entire
          sequence. Use it as the primary image source for Shot 1, and fall back to it for Shot 2
          or Shot 3 whenever a handoff frame is too weak or drifted.
        </p>
        <p style={{ ...bodyStyle, marginTop: 8 }}>
          If a Last Frame or Extract Frame contains both predator and prey prominently (two competing
          subjects), route the anchor directly to the next shot to reset to a clean single-subject
          reference. Always lock this node after a good QA result and reuse its seed on retries.
        </p>
      </div>

      <div style={dividerStyle} />

      {/* Col 2: Audio Routing */}
      <div style={{ flex: "1 1 0", padding: "16px 18px" }}>
        <div style={headStyle}>Audio Routing</div>
        <p style={bodyStyle}>
          <span style={{ color: "#eab308" }}>Shot 1 &amp; Shot 3</span> — Text to SFX receives the
          shot video prompt (fan-out from JSON Parse Core) as its text input, giving it the
          action and environment context to generate matching ambient audio. The generated audio
          is then merged into the video via Add Audio before Upscale.
        </p>
        <p style={{ ...bodyStyle, marginTop: 6 }}>
          <span style={{ color: "#eab308" }}>Shot 2</span> — Kling 3.0 Pro embeds native sound.
          Extract Audio pulls the track from the Kling output, then Add Audio re-attaches it to a
          clean video copy before Upscale.
        </p>
        <p style={{ ...bodyStyle, marginTop: 6 }}>
          QA (First Frame) taps the raw shot output <em>before</em> the audio lane, so QA is
          never blocked by audio processing.
        </p>
      </div>

      <div style={dividerStyle} />

      {/* Col 3: Fallback Order */}
      <div style={{ flex: "1 1 0", padding: "16px 18px" }}>
        <div style={headStyle}>Fallback Order</div>
        <p style={bodyStyle}>
          <span style={{ color: "#60a5fa" }}>①</span> Extract Frame — preferred handoff between shots. Wired directly from the shot output.
          <br />
          <span style={{ color: "#fb923c" }}>②</span> Last Frame after Trim — use only when Extract Frame is unavailable. Trim Video must run first.
          <br />
          <span style={{ color: "#c084fc" }}>③</span> Canonical Anchor — strongest fallback; resets character to a clean reference still.
        </p>
        <p style={{ ...bodyStyle, marginTop: 8 }}>
          If the handoff frame contains two prominent subjects (predator and prey both fully
          visible), skip ② entirely and use ③ Canonical Anchor directly. The anchor provides a
          predator-only, clean-lit reference that prevents Kling or Gen-4.5 from tracking both
          animals as equal subjects.
        </p>
        <p style={{ ...bodyStyle, marginTop: 6, color: TEXT_FAINT }}>
          Trim Video must always run before Last Frame. It is a fallback-only branch, not part of the main handoff path.
        </p>
      </div>

      <div style={dividerStyle} />

      {/* Col 4: Upscale + Stitch */}
      <div style={{ flex: "1 1 0", padding: "16px 18px" }}>
        <div style={headStyle}>Upscale · Stitch</div>
        <p style={bodyStyle}>
          Upscale happens <em>after</em> audio is attached and <em>before</em> Stitch. Each shot
          enters the upscale node as a fully audio-merged clip.
        </p>
        <p style={{ ...bodyStyle, marginTop: 6, color: TEXT_FAINT }}>
          <em>Publicly documented:</em> Runway workflows support video upscaling as a node step.{" "}
          <em>Actual UI:</em> the node is labeled &quot;Upscale Video - Topaz AI&quot; in this operator&apos;s
          Runway canvas — this exact name is not cited from Runway public help articles.
        </p>
        <ul style={{ ...bodyStyle, marginTop: 6, paddingLeft: 14 }}>
          <li>Add Audio (Shot 1) → Upscale (Shot 1) → Stitch Input 1</li>
          <li>Add Audio (Shot 2) → Upscale (Shot 2) → Stitch Input 2</li>
          <li>Add Audio (Shot 3) → Upscale (Shot 3) → Stitch Input 3</li>
        </ul>
        <p style={{ ...bodyStyle, marginTop: 8, color: TEXT_FAINT }}>
          Reference-only JSON outputs (no render wires needed) —{" "}
          <em>from JSON Parse (Core):</em> character_lock · operator_notes ·{" "}
          <em>from JSON Parse (Meta):</em> motion_intensity.shot1 · .shot2 · .shot3 · hook · caption
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
  data?: GeneratedPackage;
  onCopy?: (t: string) => void;
}) {
  const specMap = useMemo(
    () => Object.fromEntries(NODE_SPECS.map((n) => [n.id, n] as const)),
    []
  );

  const [positions, setPositions] = useState<Record<string, Point>>(DEFAULT_POSITIONS);
  const [zoom, setZoom]           = useState(0.4);
  const [pan, setPan]             = useState<Point>({ x: 0, y: 0 });
  const [dragKind, setDragKind]   = useState<"canvas" | "node" | null>(null);

  void _data;
  void _onCopy;

  const dragRef = useRef<
    | { kind: "canvas"; x: number; y: number }
    | { kind: "node"; id: string; x: number; y: number }
    | null
  >(null);

  const getRect = useCallback(
    (id: string) => {
      const spec = specMap[id];
      const pos  = positions[id];
      return { x: pos.x, y: pos.y, w: spec.width, h: getNodeHeight(spec) };
    },
    [positions, specMap]
  );

  // FIX #2 (applied here): getPortPoint now passes spec to getPortDotY() so
  // that wire endpoints use the per-node header height rather than a flat constant.
  const getPortPoint = useCallback(
    (nodeId: string, portId: string, side: Side): Point => {
      const spec  = specMap[nodeId];
      const rect  = getRect(nodeId);
      const ports = side === "left" ? spec.inputs : spec.outputs;
      const index = ports.findIndex((p) => p.id === portId);
      // Use Math.max so unknown portId defaults to row 0 rather than -1
      const y = rect.y + getPortDotY(spec, Math.max(index, 0));
      const x = side === "left" ? rect.x : rect.x + rect.w;
      return { x, y };
    },
    [getRect, specMap]
  );

  const onCanvasPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    dragRef.current = { kind: "canvas", x: e.clientX, y: e.clientY };
    setDragKind("canvas");
  }, []);

  const onNodePointerDown = useCallback(
    (id: string) => (e: ReactPointerEvent<HTMLDivElement>) => {
      e.stopPropagation();
      dragRef.current = { kind: "node", id, x: e.clientX, y: e.clientY };
      setDragKind("node");
    },
    []
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
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
            x: prev[drag.id].x + dx / zoom,
            y: prev[drag.id].y + dy / zoom,
          },
        }));
      }
    },
    [zoom]
  );

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
    setDragKind(null);
  }, []);

  const onWheel = useCallback((e: ReactWheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    setZoom((z) => Math.max(0.24, Math.min(1.4, z - e.deltaY * 0.0008)));
  }, []);

  const resetView = useCallback(() => {
    setZoom(0.4);
    setPan({ x: 0, y: 0 });
    setPositions(DEFAULT_POSITIONS);
    setDragKind(null);
    dragRef.current = null;
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%" }}>
      {/* ── Canvas ── */}
      <div
        style={{
          width: "100%",
          height: 820,
          borderRadius: 18,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.07)",
          background: BG,
          position: "relative",
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
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `
              linear-gradient(${GRID_MINOR} 1px, transparent 1px),
              linear-gradient(90deg, ${GRID_MINOR} 1px, transparent 1px),
              linear-gradient(${GRID_MAJOR} 1px, transparent 1px),
              linear-gradient(90deg, ${GRID_MAJOR} 1px, transparent 1px)
            `,
            backgroundSize: "24px 24px, 24px 24px, 120px 120px, 120px 120px",
            pointerEvents: "none",
          }}
        />

        {/* Hint overlay */}
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            zIndex: 30,
            color: TEXT_FAINT,
            fontSize: 9,
            lineHeight: 1.45,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            background: "rgba(9,17,27,0.76)",
            border: `1px solid ${BORDER}`,
            padding: "10px 12px",
            borderRadius: 10,
            backdropFilter: "blur(6px)",
          }}
        >
          Drag canvas to pan · Scroll to zoom
          <br />
          Drag nodes to reposition · Wires update live
        </div>

        {/* Zoom controls */}
        <div
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 30,
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(9,17,27,0.76)",
            border: `1px solid ${BORDER}`,
            padding: "8px 10px",
            borderRadius: 10,
            backdropFilter: "blur(6px)",
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div style={{ color: TEXT_SUB, fontSize: 10, minWidth: 34, textAlign: "right" }}>
            {Math.round(zoom * 100)}%
          </div>
          <button onClick={() => setZoom((z) => Math.max(0.24, z - 0.08))} style={controlBtnStyle}>
            −
          </button>
          <button onClick={() => setZoom((z) => Math.min(1.4, z + 0.08))} style={controlBtnStyle}>
            +
          </button>
          <button onClick={resetView} style={{ ...controlBtnStyle, width: "auto", padding: "0 12px" }}>
            Reset
          </button>
        </div>

        {/* Pannable / zoomable canvas */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            transformOrigin: "0 0",
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            width: VIEW_W,
            height: VIEW_H,
          }}
        >
          {/* ── SVG wire layer ── */}
          <svg
            width={VIEW_W}
            height={VIEW_H}
            style={{ position: "absolute", inset: 0, overflow: "visible" }}
          >
            <defs>
              {(
                [
                  ["arr-main",     WIRE_COLORS.main],
                  ["arr-fallback", WIRE_COLORS.fallback],
                  ["arr-anchor",   WIRE_COLORS.anchor],
                  ["arr-qa",       WIRE_COLORS.qa],
                  ["arr-audio",    WIRE_COLORS.audio],
                ] as const
              ).map(([id, color]) => (
                <marker
                  key={id}
                  id={id}
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="3"
                  orient="auto"
                >
                  <path d="M0,0 L0,6 L7,3 z" fill={color} />
                </marker>
              ))}
            </defs>

            {WIRES.map((wire, idx) => {
              const from  = getPortPoint(wire.from[0], wire.from[1], "right");
              const to    = getPortPoint(wire.to[0],   wire.to[1],   "left");
              const color = WIRE_COLORS[wire.style];

              let d = "";
              if (wire.route === "v")         d = vCurve(from, to);
              else if (wire.route === "pipe") d = pipeCurve(from, to, wire.pipeY ?? 840);
              else                            d = hCurve(from, to, 72);

              const dashed = wire.style !== "main";
              const opacity =
                wire.style === "qa"       ? 0.55 :
                wire.style === "anchor"   ? 0.68 :
                wire.style === "fallback" ? 0.78 :
                wire.style === "audio"    ? 0.80 : 1;
              const strokeWidth =
                wire.style === "main"  ? 2.35 :
                wire.style === "audio" ? 1.65 : 1.35;

              return (
                <g key={idx}>
                  {wire.style === "main" && (
                    <path d={d} fill="none" stroke={color} strokeWidth={5} opacity={0.12} />
                  )}
                  {wire.style === "audio" && (
                    <path d={d} fill="none" stroke={color} strokeWidth={4} opacity={0.09} />
                  )}
                  <path
                    d={d}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={dashed ? "6 4" : undefined}
                    opacity={opacity}
                    markerEnd={`url(#${markerId(wire.style)})`}
                  />
                </g>
              );
            })}
          </svg>

          {/* ── Section labels ── */}
          <SectionLabel x={30}   y={88}  text="Inputs" />
          <SectionLabel x={276}  y={170} text="AI Director" />
          <SectionLabel x={596}  y={36}  text="Structured Output" />
          <SectionLabel x={938}  y={126} text="Image Chain" />
          <SectionLabel x={1204} y={116} text="Canonical Anchor" color="#9d71ff" />
          <SectionLabel x={1514} y={126} text="Shot 1 — Gen-4.5" />
          <SectionLabel x={2268} y={118} text="Shot 2 — Kling 3.0 Pro" />
          <SectionLabel x={3054} y={126} text="Shot 3 — Gen-4.5" />
          <SectionLabel x={1514} y={490} text="Fallback · QA Lane" color="#8c6a10" />
          <SectionLabel x={1514} y={672} text="Audio Lane" color="#8a7200" />
          <SectionLabel x={3550} y={44}  text="Upscale · Stitch" color="#1e5a70" />

          {/* ── Title watermark ── */}
          <div
            style={{
              position: "absolute",
              left: 30,
              top: 20,
              color: "#1e2f42",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Wild Stories TV · AI Cinematic Pipeline
          </div>

          {/* ── Nodes ── */}
          {NODE_SPECS.map((spec) => (
            <NodeBox
              key={spec.id}
              spec={spec}
              pos={positions[spec.id]}
              onPointerDown={onNodePointerDown(spec.id)}
            />
          ))}

          {/* ── Legend ── */}
          <div
            style={{
              position: "absolute",
              left: 30,
              bottom: 30,
              display: "flex",
              alignItems: "center",
              gap: 18,
              flexWrap: "wrap",
              padding: "10px 12px",
              borderRadius: 12,
              background: "rgba(9,17,27,0.78)",
              border: `1px solid ${BORDER}`,
            }}
          >
            {(
              [
                { label: "Main pipeline",            color: WIRE_COLORS.main,     dashed: false },
                { label: "Audio flow",                color: WIRE_COLORS.audio,    dashed: true  },
                { label: "Last Frame fallback",       color: WIRE_COLORS.fallback, dashed: true  },
                { label: "Canonical Anchor fallback", color: WIRE_COLORS.anchor,   dashed: true  },
                { label: "First Frame QA",            color: WIRE_COLORS.qa,       dashed: true  },
              ] as const
            ).map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <svg width={34} height={10}>
                  <line
                    x1={0} y1={5} x2={34} y2={5}
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

      {/* ── Info Panel (below canvas, not part of the draggable graph) ── */}
      <InfoPanel />
    </div>
  );
}
