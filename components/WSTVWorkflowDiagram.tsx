"use client";

/**
 * WSTVWorkflowDiagram.tsx — Wild Stories TV · 4-shot character-consistency workflow
 *
 * Production notes:
 *   • This diagram follows the current picker-label wording from your screenshots
 *     and keeps the WSTV lane centered on the real intended production flow.
 *   • This diagram now reflects the primary hybrid 4-shot runtime path:
 *     Gen-4.5 / Runway for Shot 1, Kling 3.0 for Shots 2 and 3,
 *     and Gen-4.5 / Runway for Shot 4.
 *   • Seedance 2.0 remains the optional continuity reference lane elsewhere in
 *     the repo, and full Runway / full Kling 4-shot bundles remain available as
 *     optional engine-specific outputs.
 *   • The separate Parse JSON social lane is export-only: hook / caption /
 *     hashtags / tags are shown for publishing, not as part of the render path.
 *   • Optional manual Text nodes stay available as operator overrides for the
 *     master image prompt, each shot prompt pack, and social export text.
 *
 * Main WSTV lane:
 *   • Gen-4.5 I2V — Shot 1 and Shot 4 (identity lock + cinematic quality).
 *   • Kling 3.0 — Shot 2 and Shot 3 (physics realism + action impact).
 *   • Seedance 2.0 remains an optional continuity reference lane outside this primary diagram.
 *   • Character lock is represented with real nodes only:
 *     JSON Parse → Prompt Assembler (WSTV) → Nano Banana 2 → Gen-4 Image node (WSTV anchor) →
 *     Extract Frame preferred handoff → Last Frame fallback → First Frame QA.
 *   • The audio lane is now included: Text to Speech, Text to SFX, Audio Input,
 *     Extract Audio reference, and sequential Add Audio passes after Upscale Video.
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

type WireStyle =
  | "main"
  | "rules"
  | "preferred"
  | "fallback"
  | "anchor"
  | "qa"
  | "post"
  | "meta"
  | "manual"
  | "audio";

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
  main:      "#60a5fa",
  rules:     "#14b8a6",
  preferred: "#34d399",
  fallback:  "#fb923c",
  anchor:    "#c084fc",
  qa:        "#fbbf24",
  post:      "#38bdf8",
  meta:      "#22d3ee",
  manual:    "#f97316",
  audio:     "#eab308",
};

const WIRE_STYLE_LABELS: Record<WireStyle, string> = {
  main: "Main pipeline",
  rules: "WSTV prompt-rule link",
  preferred: "Preferred continuity",
  fallback: "Fallback continuity",
  anchor: "WSTV anchor fallback",
  qa: "First Frame QA",
  post: "Assembly + post",
  meta: "Social export only",
  manual: "Optional manual override",
  audio: "Audio generation + final layering",
};

const RULE_ROUTE_ANNOTATIONS = [
  { key: "r1", x: 1260, y: 674, label: "R1", note: "Prompt Assembly Shot 1 (WSTV)" },
  { key: "r2", x: 2090, y: 754, label: "R2", note: "Prompt Assembly Shot 2 (WSTV)" },
  { key: "r3", x: 2920, y: 834, label: "R3", note: "Prompt Assembly Shot 3 (WSTV)" },
  { key: "r4", x: 3750, y: 898, label: "R4", note: "Prompt Assembly Shot 4 (WSTV)" },
] as const;

const STITCH_ROUTE_ANNOTATIONS = [
  { key: "s1", x: 4308, y: 1038, label: "S1", note: "Shot 1 -> Stitch Input 1" },
  { key: "s2", x: 4336, y: 1068, label: "S2", note: "Shot 2 -> Stitch Input 2" },
  { key: "s3", x: 4364, y: 1098, label: "S3", note: "Shot 3 -> Stitch Input 3" },
  { key: "s4", x: 4392, y: 1128, label: "S4", note: "Shot 4 -> Stitch Input 4" },
] as const;

const RULE_START_BADGES = [
  { key: "lock",       port: "lock",       label: "LOCK" },
  { key: "continuity", port: "continuity", label: "CONT" },
  { key: "camera",     port: "camera",     label: "CAM"  },
  { key: "notes",      port: "notes",      label: "NOTE" },
] as const;

const STITCH_START_BADGES = [
  { key: "s1", node: "shot1", label: "S1" },
  { key: "s2", node: "shot2", label: "S2" },
  { key: "s3", node: "shot3", label: "S3" },
  { key: "s4", node: "shot4", label: "S4" },
] as const;

const BG         = "#060c14";
const GRID_MINOR = "#101827";
const GRID_MAJOR = "#172335";
const BORDER     = "rgba(255,255,255,0.08)";
const TEXT_MAIN  = "#edf2f8";
const TEXT_SUB   = "#7b8ca3";
const TEXT_FAINT = "#526579";

const VIEW_W = 6320;
const VIEW_H = 1480;

// ─── LAYOUT CONSTANTS ────────────────────────────────────────────────────────
const ROW_H       = 20;
const FOOTER_PAD  = 10;
const BAR_H       = 4;
const PAD_TOP     = 8;
const BADGE_H     = 21;
const TITLE_H     = 14;
const SUBTITLE_H  = 14;
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
  const startX = a.x + 34;
  const endX   = b.x - 34;
  return [
    `M ${a.x} ${a.y}`,
    `L ${startX - radius} ${a.y}`,
    `C ${startX} ${a.y}, ${startX} ${a.y}, ${startX} ${a.y + radius}`,
    `L ${startX} ${pipeY - radius}`,
    `C ${startX} ${pipeY}, ${startX} ${pipeY}, ${startX + radius} ${pipeY}`,
    `L ${endX - radius} ${pipeY}`,
    `C ${endX} ${pipeY}, ${endX} ${pipeY}, ${endX} ${pipeY + radius}`,
    `L ${endX} ${b.y - radius}`,
    `C ${endX} ${b.y}, ${endX} ${b.y}, ${b.x} ${b.y}`,
  ].join(" ");
}

function makeNode(id: string, cfg: Omit<NodeSpec, "id">): NodeSpec {
  return { id, ...cfg };
}

// ─── NODE SPECS ──────────────────────────────────────────────────────────────
const NODE_SPECS: NodeSpec[] = [
  makeNode("text_system", {
    title: "Text", subtitle: "System Prompt", badge: "RUNWAY NATIVE",
    width: 190, bg: "#0c1520",
    inputs: [],
    outputs: [{ id: "text", label: "Text", kind: "text" }],
    infoLines: ["Structured output contract + continuity rules"],
  }),
  makeNode("text_story", {
    title: "Text", subtitle: "Story Brief", badge: "RUNWAY NATIVE",
    width: 190, bg: "#0c1520",
    inputs: [],
    outputs: [{ id: "text", label: "Text", kind: "text" }],
    infoLines: ["Predator, prey, habitat, arc, pacing"],
  }),
  makeNode("image_ref", {
    title: "Image input", subtitle: "Character / Scene Reference", badge: "RUNWAY NATIVE",
    width: 214, bg: "#0c1520",
    inputs: [],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
    infoLines: ["Main visual reference for anchor creation"],
  }),

  makeNode("claude", {
    title: "LLM", subtitle: "Claude Opus 4.5", badge: "RUNWAY NATIVE",
    width: 228, bg: "#14092e", accent: "#f97316",
    inputs: [
      { id: "system", label: "System Prompt", kind: "text", required: true },
      { id: "prompt", label: "Prompt",        kind: "text", required: true },
      { id: "image",  label: "Image",         kind: "image" },
    ],
    outputs: [{ id: "json", label: "Text (JSON)", kind: "text" }],
    infoLines: ["Official Runway LLM node — Claude Opus 4.5 is the active model selection"],
  }),

  makeNode("parse_json", {
    title: "JSON Parse", subtitle: "Core Render Outputs", badge: "RUNWAY NATIVE",
    width: 312, bg: "#07121d", accent: "#16a34a",
    inputs: [{ id: "json", label: "Text (JSON)", kind: "text", required: true }],
    outputs: [
      { id: "master",     label: "master_image_prompt",   kind: "text" },
      { id: "shot1",      label: "shot1_base_prompt",     kind: "text" },
      { id: "shot2",      label: "shot2_base_prompt",     kind: "text" },
      { id: "shot3",      label: "shot3_base_prompt",     kind: "text" },
      { id: "shot4",      label: "shot4_base_prompt",     kind: "text" },
      { id: "lock",       label: "character_lock_rules",  kind: "text" },
      { id: "continuity", label: "continuity_rules",      kind: "text" },
      { id: "camera",     label: "camera_rules",          kind: "text" },
      { id: "notes",      label: "operator_notes",        kind: "text" },
      { id: "voice",      label: "voiceover_script",      kind: "text" },
      { id: "sfx",        label: "sfx_prompt",            kind: "text" },
      { id: "music_cue",  label: "music_cue",             kind: "text" },
    ],
    infoLines: ["Render-pipeline prompt parts only"],
  }),
  makeNode("parse_json_meta", {
    title: "JSON Parse", subtitle: "Social / Export Outputs", badge: "RUNWAY NATIVE",
    width: 296, bg: "#071520", accent: "#22d3ee",
    inputs: [{ id: "json", label: "Text (JSON)", kind: "text", required: true }],
    outputs: [
      { id: "hook",     label: "hook",     kind: "text" },
      { id: "caption",  label: "caption",  kind: "text" },
      { id: "hashtags", label: "hashtags", kind: "text" },
      { id: "tags",     label: "tags",     kind: "text" },
    ],
    infoLines: ["Reference / export only — not part of the render pipeline"],
  }),
  makeNode("manual_master", {
    title: "Text", subtitle: "Optional Manual Master Image Prompt", badge: "WSTV CUSTOM",
    width: 236, bg: "#1a1207", accent: "#f97316",
    inputs: [],
    outputs: [{ id: "text", label: "Text", kind: "text" }],
    infoLines: ["Optional override — type master_image_prompt directly here"],
  }),
  makeNode("manual_hook", {
    title: "Text", subtitle: "Optional Manual Hook", badge: "WSTV CUSTOM",
    width: 214, bg: "#1a1207", accent: "#f97316",
    inputs: [],
    outputs: [{ id: "text", label: "Text", kind: "text" }],
    infoLines: ["Optional export-text override — direct hook entry"],
  }),
  makeNode("manual_caption", {
    title: "Text", subtitle: "Optional Manual Caption", badge: "WSTV CUSTOM",
    width: 214, bg: "#1a1207", accent: "#f97316",
    inputs: [],
    outputs: [{ id: "text", label: "Text", kind: "text" }],
    infoLines: ["Optional export-text override — direct caption entry"],
  }),
  makeNode("manual_hashtags", {
    title: "Text", subtitle: "Optional Manual Hashtags", badge: "WSTV CUSTOM",
    width: 214, bg: "#1a1207", accent: "#f97316",
    inputs: [],
    outputs: [{ id: "text", label: "Text", kind: "text" }],
    infoLines: ["Optional export-text override — direct hashtag entry"],
  }),
  makeNode("manual_tags", {
    title: "Text", subtitle: "Optional Manual Tags", badge: "WSTV CUSTOM",
    width: 214, bg: "#1a1207", accent: "#f97316",
    inputs: [],
    outputs: [{ id: "text", label: "Text", kind: "text" }],
    infoLines: ["Optional export-text override — direct tag entry"],
  }),

  makeNode("nano_banana_2", {
    title: "Nano Banana 2", subtitle: "Canonical still build", badge: "THIRD-PARTY",
    width: 228, bg: "#051a0e", accent: "#16a34a",
    inputs: [
      { id: "prompt", label: "Prompt", kind: "text",  required: true },
      { id: "image",  label: "Image",  kind: "image" },
    ],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
    infoLines: ["Reference image + master prompt build the clean anchor still"],
  }),
  makeNode("gen4_anchor", {
    title: "Gen-4 Image", subtitle: "Canonical Anchor (WSTV)", badge: "RUNWAY NATIVE",
    width: 214, bg: "#1a0544", accent: "#c084fc",
    inputs: [{ id: "image", label: "Image", kind: "image", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
    infoLines: ["Official Gen-4 Image node — WSTV treats its output as a fixed identity source across all four shots"],
  }),

  makeNode("combine1", {
    title: "Combine Text", subtitle: "Shot 1 Prompt Pack", badge: "WSTV CUSTOM",
    width: 236, bg: "#09111e", accent: "#2563eb",
    inputs: [
      { id: "base",       label: "shot1_base_prompt",    kind: "text", required: true },
      { id: "lock",       label: "character_lock_rules", kind: "text", required: true },
      { id: "continuity", label: "continuity_rules",     kind: "text", required: true },
      { id: "camera",     label: "camera_rules",         kind: "text", required: true },
      { id: "notes",      label: "operator_notes",       kind: "text" },
    ],
    outputs: [{ id: "text", label: "Text", kind: "text" }],
    infoLines: ["Build final motion-only prompt pack for Shot 1", "No official Runway equivalent — WSTV prompt assembly step"],
  }),
  makeNode("manual_shot1", {
    title: "Text", subtitle: "Optional Manual Shot 1 Prompt Pack", badge: "WSTV CUSTOM",
    width: 236, bg: "#1a1207", accent: "#f97316",
    inputs: [],
    outputs: [{ id: "text", label: "Text", kind: "text" }],
    infoLines: ["Optional override — use instead of Combine Text Shot 1"],
  }),
  // ── SHOT 1: Gen-4.5 I2V ─────────────────────────────────────────────────
  makeNode("shot1", {
    title: "Gen-4.5", subtitle: "Shot 1 — I2V", badge: "RUNWAY NATIVE",
    width: 244, bg: "#1a0544", accent: "#c084fc",
    inputs: [
      { id: "image",  label: "Image",  kind: "image", required: true },
      { id: "prompt", label: "Prompt", kind: "text",  required: true },
    ],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
    infoLines: ["Gen-4.5 I2V — Shot 1 opener for the primary hybrid lane (model name confirmed; Workflows node variant inferred)"],
  }),
  makeNode("extract1", {
    title: "Extract Frame", subtitle: "Preferred Handoff 1", badge: "RUNWAY NATIVE",
    width: 214, bg: "#041420", accent: "#34d399",
    inputs: [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
    infoLines: ["Preferred continuity — choose the cleanest handoff frame"],
  }),
  makeNode("trim1", {
    title: "Trim Video", subtitle: "Fallback Prep 1", badge: "RUNWAY NATIVE",
    width: 190, bg: "#071318", accent: "#38bdf8",
    inputs: [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
    infoLines: ["Fallback prep before Last Frame"],
  }),
  makeNode("last1", {
    title: "Last Frame", subtitle: "Fallback Handoff 1", badge: "RUNWAY NATIVE",
    width: 204, bg: "#160202", accent: "#fb923c", dim: true,
    inputs: [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
    infoLines: ["Fallback only — never the preferred handoff"],
  }),
  makeNode("qa1", {
    title: "First Frame", subtitle: "QA 1", badge: "RUNWAY NATIVE",
    width: 186, bg: "#100c00", accent: "#fbbf24", dim: true,
    inputs: [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
    infoLines: ["QA only — do not use as a handoff node"],
  }),

  makeNode("combine2", {
    title: "Combine Text", subtitle: "Shot 2 Prompt Pack", badge: "WSTV CUSTOM",
    width: 236, bg: "#09111e", accent: "#2563eb",
    inputs: [
      { id: "base",       label: "shot2_base_prompt",    kind: "text", required: true },
      { id: "lock",       label: "character_lock_rules", kind: "text", required: true },
      { id: "continuity", label: "continuity_rules",     kind: "text", required: true },
      { id: "camera",     label: "camera_rules",         kind: "text", required: true },
      { id: "notes",      label: "operator_notes",       kind: "text" },
    ],
    outputs: [{ id: "text", label: "Text", kind: "text" }],
    infoLines: ["Build final motion-only prompt pack for Shot 2", "No official Runway equivalent — WSTV prompt assembly step"],
  }),
  makeNode("manual_shot2", {
    title: "Text", subtitle: "Optional Manual Shot 2 Prompt Pack", badge: "WSTV CUSTOM",
    width: 236, bg: "#1a1207", accent: "#f97316",
    inputs: [],
    outputs: [{ id: "text", label: "Text", kind: "text" }],
    infoLines: ["Optional override — use instead of Combine Text Shot 2"],
  }),
  // ── SHOT 2: Kling 3.0 ───────────────────────────────────────────────────
  makeNode("shot2", {
    title: "Kling 3.0", subtitle: "Shot 2 — Action Build", badge: "THIRD-PARTY",
    width: 244, bg: "#030d1e", accent: "#3b82f6",
    inputs: [
      { id: "image",  label: "Image",  kind: "image", required: true },
      { id: "prompt", label: "Prompt", kind: "text",  required: true },
    ],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
    infoLines: ["Kling 3.0 — stalk + build, fur detail, muscle tension realistic"],
  }),
  makeNode("extract2", {
    title: "Extract Frame", subtitle: "Preferred Handoff 2", badge: "RUNWAY NATIVE",
    width: 214, bg: "#041420", accent: "#34d399",
    inputs: [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
    infoLines: ["Preferred continuity handoff into Shot 3"],
  }),
  makeNode("trim2", {
    title: "Trim Video", subtitle: "Fallback Prep 2", badge: "RUNWAY NATIVE",
    width: 190, bg: "#071318", accent: "#38bdf8",
    inputs: [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
    infoLines: ["Fallback prep before Last Frame"],
  }),
  makeNode("last2", {
    title: "Last Frame", subtitle: "Fallback Handoff 2", badge: "RUNWAY NATIVE",
    width: 204, bg: "#160202", accent: "#fb923c", dim: true,
    inputs: [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
    infoLines: ["Fallback only — use after Trim when needed"],
  }),
  makeNode("qa2", {
    title: "First Frame", subtitle: "QA 2", badge: "RUNWAY NATIVE",
    width: 186, bg: "#100c00", accent: "#fbbf24", dim: true,
    inputs: [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
    infoLines: ["QA only — continuity check before Shot 3"],
  }),

  makeNode("combine3", {
    title: "Combine Text", subtitle: "Shot 3 Prompt Pack", badge: "WSTV CUSTOM",
    width: 236, bg: "#09111e", accent: "#2563eb",
    inputs: [
      { id: "base",       label: "shot3_base_prompt",    kind: "text", required: true },
      { id: "lock",       label: "character_lock_rules", kind: "text", required: true },
      { id: "continuity", label: "continuity_rules",     kind: "text", required: true },
      { id: "camera",     label: "camera_rules",         kind: "text", required: true },
      { id: "notes",      label: "operator_notes",       kind: "text" },
    ],
    outputs: [{ id: "text", label: "Text", kind: "text" }],
    infoLines: ["Build final motion-only prompt pack for Shot 3", "No official Runway equivalent — WSTV prompt assembly step"],
  }),
  makeNode("manual_shot3", {
    title: "Text", subtitle: "Optional Manual Shot 3 Prompt Pack", badge: "WSTV CUSTOM",
    width: 236, bg: "#1a1207", accent: "#f97316",
    inputs: [],
    outputs: [{ id: "text", label: "Text", kind: "text" }],
    infoLines: ["Optional override — use instead of Combine Text Shot 3"],
  }),
  // ── SHOT 3: Kling 3.0 ───────────────────────────────────────────────────
  makeNode("shot3", {
    title: "Kling 3.0", subtitle: "Shot 3 — Impact", badge: "THIRD-PARTY",
    width: 244, bg: "#030d1e", accent: "#3b82f6",
    inputs: [
      { id: "image",  label: "Image",  kind: "image", required: true },
      { id: "prompt", label: "Prompt", kind: "text",  required: true },
    ],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
    infoLines: ["Kling 3.0 — peak action beat, strong physics fidelity for predator-prey contact"],
  }),
  makeNode("extract3", {
    title: "Extract Frame", subtitle: "Preferred Handoff 3", badge: "RUNWAY NATIVE",
    width: 214, bg: "#041420", accent: "#34d399",
    inputs: [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
    infoLines: ["Preferred continuity handoff into Shot 4"],
  }),
  makeNode("trim3", {
    title: "Trim Video", subtitle: "Fallback Prep 3", badge: "RUNWAY NATIVE",
    width: 190, bg: "#071318", accent: "#38bdf8",
    inputs: [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
    infoLines: ["Fallback prep before Last Frame"],
  }),
  makeNode("last3", {
    title: "Last Frame", subtitle: "Fallback Handoff 3", badge: "RUNWAY NATIVE",
    width: 204, bg: "#160202", accent: "#fb923c", dim: true,
    inputs: [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
    infoLines: ["Fallback only — use after Trim when needed"],
  }),
  makeNode("qa3", {
    title: "First Frame", subtitle: "QA 3", badge: "RUNWAY NATIVE",
    width: 186, bg: "#100c00", accent: "#fbbf24", dim: true,
    inputs: [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
    infoLines: ["QA only — continuity check before Shot 4"],
  }),

  makeNode("combine4", {
    title: "Combine Text", subtitle: "Shot 4 Prompt Pack", badge: "WSTV CUSTOM",
    width: 236, bg: "#09111e", accent: "#2563eb",
    inputs: [
      { id: "base",       label: "shot4_base_prompt",    kind: "text", required: true },
      { id: "lock",       label: "character_lock_rules", kind: "text", required: true },
      { id: "continuity", label: "continuity_rules",     kind: "text", required: true },
      { id: "camera",     label: "camera_rules",         kind: "text", required: true },
      { id: "notes",      label: "operator_notes",       kind: "text" },
    ],
    outputs: [{ id: "text", label: "Text", kind: "text" }],
    infoLines: ["Build final motion-only prompt pack for Shot 4", "No official Runway equivalent — WSTV prompt assembly step"],
  }),
  makeNode("manual_shot4", {
    title: "Text", subtitle: "Optional Manual Shot 4 Prompt Pack", badge: "WSTV CUSTOM",
    width: 236, bg: "#1a1207", accent: "#f97316",
    inputs: [],
    outputs: [{ id: "text", label: "Text", kind: "text" }],
    infoLines: ["Optional override — use instead of Combine Text Shot 4"],
  }),
  // ── SHOT 4: Gen-4.5 I2V ─────────────────────────────────────────────────
  makeNode("shot4", {
    title: "Gen-4.5", subtitle: "Shot 4 — I2V", badge: "RUNWAY NATIVE",
    width: 244, bg: "#1a0544", accent: "#c084fc",
    inputs: [
      { id: "image",  label: "Image",  kind: "image", required: true },
      { id: "prompt", label: "Prompt", kind: "text",  required: true },
    ],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
    infoLines: ["Gen-4.5 I2V — Shot 4 closer for the primary hybrid lane (model name confirmed; Workflows node variant inferred)"],
  }),
  makeNode("qa4", {
    title: "First Frame", subtitle: "QA 4", badge: "RUNWAY NATIVE",
    width: 186, bg: "#100c00", accent: "#fbbf24", dim: true,
    inputs: [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
    infoLines: ["QA only — final opening-frame check"],
  }),

  makeNode("stitch", {
    title: "Stitch", subtitle: "4-shot assembly", badge: "RUNWAY NATIVE",
    width: 220, bg: "#0d0220", accent: "#16a34a",
    inputs: [
      { id: "s1", label: "Input 1", kind: "video", required: true },
      { id: "s2", label: "Input 2", kind: "video", required: true },
      { id: "s3", label: "Input 3", kind: "video", required: true },
      { id: "s4", label: "Input 4", kind: "video", required: true },
    ],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
    infoLines: ["Assemble Shot 1 → Shot 4 in playback order"],
  }),
  makeNode("trim_final", {
    title: "Trim Video", subtitle: "Final Cleanup", badge: "RUNWAY NATIVE",
    width: 190, bg: "#071318", accent: "#38bdf8",
    inputs: [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
    infoLines: ["Tighten runtime after stitch"],
  }),
  makeNode("upscale", {
    title: "Upscale Video", subtitle: "Native Final Polish", badge: "RUNWAY NATIVE",
    width: 244, bg: "#030d1a", accent: "#38bdf8",
    inputs: [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
    infoLines: ["Native upscale lane before final audio layering"],
  }),
  makeNode("music_input", {
    title: "Audio Input", subtitle: "Optional Music Bed", badge: "RUNWAY NATIVE",
    width: 214, bg: "#151208", accent: "#eab308",
    inputs: [],
    outputs: [{ id: "audio", label: "Audio", kind: "audio" }],
    infoLines: ["Upload or select music for the final mix"],
  }),
  makeNode("manual_music", {
    title: "Text", subtitle: "Optional Music Cue Override", badge: "WSTV CUSTOM",
    width: 236, bg: "#1a1207", accent: "#f97316",
    inputs: [],
    outputs: [{ id: "text", label: "Text", kind: "text" }],
    infoLines: ["Optional cue note for choosing a music bed"],
  }),
  makeNode("tts", {
    title: "Text to Speech", subtitle: "Voiceover", badge: "RUNWAY AUDIO",
    width: 228, bg: "#151208", accent: "#eab308",
    inputs: [{ id: "text", label: "Text", kind: "text", required: true }],
    outputs: [{ id: "audio", label: "Audio", kind: "audio" }],
    infoLines: ["Runway audio node for narration / voiceover"],
  }),
  makeNode("manual_voice", {
    title: "Text", subtitle: "Optional Voiceover Override", badge: "WSTV CUSTOM",
    width: 236, bg: "#1a1207", accent: "#f97316",
    inputs: [],
    outputs: [{ id: "text", label: "Text", kind: "text" }],
    infoLines: ["Optional direct voiceover script override"],
  }),
  makeNode("text_to_sfx", {
    title: "Text to SFX", subtitle: "Cinematic Wildlife SFX", badge: "RUNWAY AUDIO",
    width: 236, bg: "#151208", accent: "#eab308",
    inputs: [{ id: "text", label: "Text", kind: "text", required: true }],
    outputs: [{ id: "audio", label: "Audio", kind: "audio" }],
    infoLines: ["Runway audio node for scene-specific effects"],
  }),
  makeNode("manual_sfx", {
    title: "Text", subtitle: "Optional SFX Prompt Override", badge: "WSTV CUSTOM",
    width: 236, bg: "#1a1207", accent: "#f97316",
    inputs: [],
    outputs: [{ id: "text", label: "Text", kind: "text" }],
    infoLines: ["Optional direct SFX prompt override"],
  }),
  makeNode("extract_audio_ref", {
    title: "Extract Audio", subtitle: "Optional Reference Audio", badge: "RUNWAY NATIVE",
    width: 224, bg: "#151208", accent: "#eab308", dim: true,
    inputs: [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "audio", label: "Audio", kind: "audio" }],
    infoLines: ["Reference lane only — not the main final source"],
  }),
  makeNode("add_audio_music", {
    title: "Add Audio", subtitle: "Layer 1 — Music", badge: "RUNWAY NATIVE",
    width: 214, bg: "#071318", accent: "#38bdf8",
    inputs: [
      { id: "video", label: "Video", kind: "video", required: true },
      { id: "audio", label: "Audio", kind: "audio", required: true },
    ],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
    infoLines: ["Apply the base music bed after upscale"],
  }),
  makeNode("add_audio_sfx", {
    title: "Add Audio", subtitle: "Layer 2 — SFX", badge: "RUNWAY NATIVE",
    width: 214, bg: "#071318", accent: "#38bdf8",
    inputs: [
      { id: "video", label: "Video", kind: "video", required: true },
      { id: "audio", label: "Audio", kind: "audio", required: true },
    ],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
    infoLines: ["Layer wildlife SFX onto the music pass"],
  }),
  makeNode("add_audio_voice", {
    title: "Add Audio", subtitle: "Layer 3 — Voice", badge: "RUNWAY NATIVE",
    width: 214, bg: "#071318", accent: "#38bdf8",
    inputs: [
      { id: "video", label: "Video", kind: "video", required: true },
      { id: "audio", label: "Audio", kind: "audio", required: true },
    ],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
    infoLines: ["Final narration layer before export"],
  }),
  makeNode("final_output", {
    title: "Final Video", subtitle: "WSTV Render Output", badge: "EXPORT",
    width: 214, bg: "#071520", accent: "#22d3ee",
    inputs: [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
    infoLines: ["Ready for upload, packaging, and social export"],
  }),
];

// ─── POSITIONS ───────────────────────────────────────────────────────────────
const DEFAULT_POSITIONS: Record<string, Point> = {
  text_system: { x: 30,   y: 108 },
  text_story:  { x: 30,   y: 226 },
  image_ref:   { x: 30,   y: 344 },

  claude:          { x: 290,  y: 180 },
  parse_json:      { x: 560,  y: 72  },
  parse_json_meta: { x: 560,  y: 414 },
  manual_hook:     { x: 560,  y: 642 },
  manual_caption:  { x: 560,  y: 754 },
  manual_hashtags: { x: 560,  y: 866 },
  manual_tags:     { x: 560,  y: 978 },

  manual_master: { x: 920,  y: 452 },
  nano_banana_2: { x: 920,  y: 152 },
  gen4_anchor:   { x: 1188, y: 152 },

  combine1:     { x: 1450, y: 372 },
  manual_shot1: { x: 1450, y: 770 },
  shot1:        { x: 1480, y: 144 },
  extract1:     { x: 1788, y: 152 },
  trim1:        { x: 1788, y: 396 },
  last1:        { x: 2012, y: 396 },
  qa1:          { x: 1480, y: 624 },

  combine2:     { x: 2280, y: 372 },
  manual_shot2: { x: 2280, y: 770 },
  shot2:        { x: 2310, y: 144 },
  extract2:     { x: 2618, y: 152 },
  trim2:        { x: 2618, y: 396 },
  last2:        { x: 2842, y: 396 },
  qa2:          { x: 2310, y: 624 },

  combine3:     { x: 3110, y: 372 },
  manual_shot3: { x: 3110, y: 770 },
  shot3:        { x: 3140, y: 144 },
  extract3:     { x: 3448, y: 152 },
  trim3:        { x: 3448, y: 396 },
  last3:        { x: 3672, y: 396 },
  qa3:          { x: 3140, y: 624 },

  combine4:     { x: 3940, y: 372 },
  manual_shot4: { x: 3940, y: 770 },
  shot4:        { x: 3970, y: 144 },
  qa4:          { x: 3970, y: 624 },

  stitch:     { x: 4300, y: 230 },
  trim_final: { x: 4584, y: 230 },
  upscale:    { x: 4858, y: 230 },
  music_input:       { x: 4858, y: 498 },
  manual_music:      { x: 4858, y: 668 },
  tts:               { x: 5148, y: 668 },
  manual_voice:      { x: 5148, y: 842 },
  text_to_sfx:       { x: 5148, y: 498 },
  manual_sfx:        { x: 5148, y: 1016 },
  extract_audio_ref: { x: 4858, y: 842 },
  add_audio_music:   { x: 5160, y: 230 },
  add_audio_sfx:     { x: 5450, y: 230 },
  add_audio_voice:   { x: 5740, y: 230 },
  final_output:      { x: 6030, y: 230 },
};

// ─── WIRES ───────────────────────────────────────────────────────────────────
const WIRES: WireDef[] = [
  { from: ["text_system", "text"], to: ["claude", "system"], style: "main" },
  { from: ["text_story",  "text"], to: ["claude", "prompt"], style: "main" },
  { from: ["image_ref", "image"],  to: ["claude", "image"],  style: "main" },

  { from: ["claude", "json"], to: ["parse_json",      "json"], style: "main" },
  { from: ["claude", "json"], to: ["parse_json_meta", "json"], style: "meta", route: "v" },

  { from: ["parse_json",   "master"], to: ["nano_banana_2", "prompt"], style: "main" },
  { from: ["manual_master", "text"],  to: ["nano_banana_2", "prompt"], style: "manual", route: "v" },
  { from: ["image_ref",  "image"],    to: ["nano_banana_2", "image"],  style: "main" },
  { from: ["nano_banana_2", "image"], to: ["gen4_anchor",   "image"],  style: "main" },

  { from: ["gen4_anchor", "image"], to: ["shot1", "image"], style: "main" },
  { from: ["gen4_anchor", "image"], to: ["shot2", "image"], style: "anchor", route: "pipe", pipeY: 934 },
  { from: ["gen4_anchor", "image"], to: ["shot3", "image"], style: "anchor", route: "pipe", pipeY: 968 },
  { from: ["gen4_anchor", "image"], to: ["shot4", "image"], style: "anchor", route: "pipe", pipeY: 1002 },

  { from: ["parse_json", "shot1"], to: ["combine1", "base"], style: "main" },
  { from: ["parse_json", "shot2"], to: ["combine2", "base"], style: "main" },
  { from: ["parse_json", "shot3"], to: ["combine3", "base"], style: "main" },
  { from: ["parse_json", "shot4"], to: ["combine4", "base"], style: "main" },

  { from: ["parse_json", "lock"],       to: ["combine1", "lock"],       style: "rules", route: "pipe", pipeY: 668 },
  { from: ["parse_json", "continuity"], to: ["combine1", "continuity"], style: "rules", route: "pipe", pipeY: 684 },
  { from: ["parse_json", "camera"],     to: ["combine1", "camera"],     style: "rules", route: "pipe", pipeY: 700 },
  { from: ["parse_json", "notes"],      to: ["combine1", "notes"],      style: "rules", route: "pipe", pipeY: 716 },

  { from: ["parse_json", "lock"],       to: ["combine2", "lock"],       style: "rules", route: "pipe", pipeY: 748 },
  { from: ["parse_json", "continuity"], to: ["combine2", "continuity"], style: "rules", route: "pipe", pipeY: 764 },
  { from: ["parse_json", "camera"],     to: ["combine2", "camera"],     style: "rules", route: "pipe", pipeY: 780 },
  { from: ["parse_json", "notes"],      to: ["combine2", "notes"],      style: "rules", route: "pipe", pipeY: 796 },

  { from: ["parse_json", "lock"],       to: ["combine3", "lock"],       style: "rules", route: "pipe", pipeY: 828 },
  { from: ["parse_json", "continuity"], to: ["combine3", "continuity"], style: "rules", route: "pipe", pipeY: 844 },
  { from: ["parse_json", "camera"],     to: ["combine3", "camera"],     style: "rules", route: "pipe", pipeY: 860 },
  { from: ["parse_json", "notes"],      to: ["combine3", "notes"],      style: "rules", route: "pipe", pipeY: 876 },

  { from: ["parse_json", "lock"],       to: ["combine4", "lock"],       style: "rules", route: "pipe", pipeY: 892 },
  { from: ["parse_json", "continuity"], to: ["combine4", "continuity"], style: "rules", route: "pipe", pipeY: 908 },
  { from: ["parse_json", "camera"],     to: ["combine4", "camera"],     style: "rules", route: "pipe", pipeY: 924 },
  { from: ["parse_json", "notes"],      to: ["combine4", "notes"],      style: "rules", route: "pipe", pipeY: 940 },

  { from: ["combine1", "text"], to: ["shot1", "prompt"], style: "main" },
  { from: ["manual_shot1", "text"], to: ["shot1", "prompt"], style: "manual", route: "v" },
  { from: ["combine2", "text"], to: ["shot2", "prompt"], style: "main" },
  { from: ["manual_shot2", "text"], to: ["shot2", "prompt"], style: "manual", route: "v" },
  { from: ["combine3", "text"], to: ["shot3", "prompt"], style: "main" },
  { from: ["manual_shot3", "text"], to: ["shot3", "prompt"], style: "manual", route: "v" },
  { from: ["combine4", "text"], to: ["shot4", "prompt"], style: "main" },
  { from: ["manual_shot4", "text"], to: ["shot4", "prompt"], style: "manual", route: "v" },

  { from: ["shot1", "video"], to: ["extract1", "video"], style: "preferred" },
  { from: ["extract1", "image"], to: ["shot2", "image"], style: "preferred" },
  { from: ["shot2", "video"], to: ["extract2", "video"], style: "preferred" },
  { from: ["extract2", "image"], to: ["shot3", "image"], style: "preferred" },
  { from: ["shot3", "video"], to: ["extract3", "video"], style: "preferred" },
  { from: ["extract3", "image"], to: ["shot4", "image"], style: "preferred" },

  { from: ["shot1", "video"], to: ["trim1", "video"], style: "fallback" },
  { from: ["trim1",  "video"], to: ["last1", "video"], style: "fallback" },
  { from: ["last1",  "image"], to: ["shot2", "image"], style: "fallback" },
  { from: ["shot2", "video"], to: ["trim2", "video"], style: "fallback" },
  { from: ["trim2",  "video"], to: ["last2", "video"], style: "fallback" },
  { from: ["last2",  "image"], to: ["shot3", "image"], style: "fallback" },
  { from: ["shot3", "video"], to: ["trim3", "video"], style: "fallback" },
  { from: ["trim3",  "video"], to: ["last3", "video"], style: "fallback" },
  { from: ["last3",  "image"], to: ["shot4", "image"], style: "fallback" },

  { from: ["shot1", "video"], to: ["qa1", "video"], style: "qa", route: "v" },
  { from: ["shot2", "video"], to: ["qa2", "video"], style: "qa", route: "v" },
  { from: ["shot3", "video"], to: ["qa3", "video"], style: "qa", route: "v" },
  { from: ["shot4", "video"], to: ["qa4", "video"], style: "qa", route: "v" },

  { from: ["shot1", "video"], to: ["stitch", "s1"], style: "post", route: "pipe", pipeY: 1060 },
  { from: ["shot2", "video"], to: ["stitch", "s2"], style: "post", route: "pipe", pipeY: 1090 },
  { from: ["shot3", "video"], to: ["stitch", "s3"], style: "post", route: "pipe", pipeY: 1120 },
  { from: ["shot4", "video"], to: ["stitch", "s4"], style: "post", route: "pipe", pipeY: 1150 },

  { from: ["stitch",     "video"], to: ["trim_final", "video"], style: "post" },
  { from: ["trim_final", "video"], to: ["upscale",    "video"], style: "post" },

  // AUDIO PROMPT GENERATION
  { from: ["parse_json", "voice"], to: ["tts", "text"], style: "audio", route: "pipe", pipeY: 1210 },
  { from: ["manual_voice", "text"], to: ["tts", "text"], style: "manual", route: "v" },

  { from: ["parse_json", "sfx"], to: ["text_to_sfx", "text"], style: "audio", route: "pipe", pipeY: 1250 },
  { from: ["manual_sfx", "text"], to: ["text_to_sfx", "text"], style: "manual", route: "v" },

  { from: ["parse_json", "music_cue"], to: ["manual_music", "text"], style: "meta", route: "pipe", pipeY: 1290 },

  // Optional reference lane only
  { from: ["upscale", "video"], to: ["extract_audio_ref", "video"], style: "audio", route: "v" },

  // FINAL AUDIO LAYERING AFTER UPSCALE
  { from: ["upscale", "video"], to: ["add_audio_music", "video"], style: "post" },
  { from: ["music_input", "audio"], to: ["add_audio_music", "audio"], style: "audio", route: "v" },

  { from: ["add_audio_music", "video"], to: ["add_audio_sfx", "video"], style: "post" },
  { from: ["text_to_sfx", "audio"], to: ["add_audio_sfx", "audio"], style: "audio", route: "v" },

  { from: ["add_audio_sfx", "video"], to: ["add_audio_voice", "video"], style: "post" },
  { from: ["tts", "audio"], to: ["add_audio_voice", "audio"], style: "audio", route: "v" },

  { from: ["add_audio_voice", "video"], to: ["final_output", "video"], style: "post" },
];

// ─── WIRE MARKER ID ──────────────────────────────────────────────────────────
function markerId(style: WireStyle) {
  const m: Record<WireStyle, string> = {
    main:      "arr-main",
    rules:     "arr-rules",
    preferred: "arr-preferred",
    fallback:  "arr-fallback",
    anchor:    "arr-anchor",
    qa:        "arr-qa",
    post:      "arr-post",
    meta:      "arr-meta",
    manual:    "arr-manual",
    audio:     "arr-audio",
  };
  return m[style];
}

// ─── NODE BOX ────────────────────────────────────────────────────────────────
function NodeBox({
  spec, pos, onPointerDown,
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
        position: "absolute", left: pos.x, top: pos.y,
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
      <div style={{
        height: BAR_H,
        background: spec.accent
          ? `linear-gradient(90deg, ${spec.accent}, ${spec.accent}99)`
          : "rgba(255,255,255,0.06)",
      }} />
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
        <div style={headStyle}>Node classification</div>
        <p style={bodyStyle}>
          This diagram uses three tiers. Runway Native nodes use official Runway
          Workflows names as they appear in the picker: LLM, JSON Parse, Image input,
          Gen-4 Image, Gen-4.5, Extract Frame, Last Frame, First Frame, Trim Video,
          Stitch, Upscale Video, Audio Input, Text to Speech, Text to SFX,
          Extract Audio, and Add Audio. Third-Party Model nodes — Nano Banana 2
          and Kling 3.0 — are available inside Runway Workflows and labeled with
          their official model names. WSTV Custom nodes — the Combine Text prompt
          assemblers and manual override Text nodes — implement production logic
          with no direct Runway equivalent and are clearly marked as such.
        </p>
      </div>
      <div style={divider} />
      <div style={{ flex: "1 1 0", padding: "16px 18px", minWidth: 220 }}>
        <div style={headStyle}>Identity &amp; continuity</div>
        <p style={bodyStyle}>
          Character identity is carried by the Image input node across all four shots.
          The Gen-4 Image node produces a clean canonical still that feeds Shot 1
          directly and acts as a WSTV anchor fallback for Shots 2–4. The preferred
          inter-shot handoff is Extract Frame: select the cleanest full-body frame
          from the outgoing clip and use it as the Image input for the next shot.
          Last Frame after Trim Video is the fallback when no clean mid-clip frame
          can be selected. First Frame nodes are QA-only — they expose the opening
          frame of a shot for inspection and should not be used as continuity sources.
        </p>
      </div>
      <div style={divider} />
      <div style={{ flex: "1 1 0", padding: "16px 18px", minWidth: 220 }}>
        <div style={headStyle}>Prompt assembly</div>
        <p style={bodyStyle}>
          JSON Parse breaks the LLM node&apos;s structured response into reusable
          parts for the render lane: one base prompt per shot plus shared character
          lock, continuity, camera, and operator note fields. Each WSTV Combine Text
          node merges these fields into a single motion-focused prompt pack for the
          corresponding shot. This assembly step is WSTV custom logic with no official
          Runway equivalent. Manual override Text nodes let you type any field
          directly. For each shot, use either the automatic path or the manual
          override — not both at the same time.
        </p>
      </div>
      <div style={divider} />
      <div style={{ flex: "1 1 0", padding: "16px 18px", minWidth: 220 }}>
        <div style={headStyle}>Social lane</div>
        <p style={bodyStyle}>
          A second JSON Parse node extracts social fields — hook, caption, hashtags,
          and tags — from the same LLM response. This lane is export-only and does
          not feed the video render path. Optional manual Text nodes below that lane
          allow direct entry when writing social copy without running the full LLM
          generation. Use either the JSON Parse output or the matching manual Text
          node for each field, not both.
        </p>
      </div>
      <div style={divider} />
      <div style={{ flex: "1 1 0", padding: "16px 18px", minWidth: 220 }}>
        <div style={headStyle}>Pipeline scope</div>
        <p style={bodyStyle}>
          The primary path is a hybrid 4-shot sequence: Shot 1 and Shot 4 use
          Gen-4.5 I2V for first-frame readability and stable closing composition.
          Shots 2 and 3 use Kling 3.0 for physics-realistic predator-prey action.
          All four shots feed Stitch, then Trim Video, then Upscale Video. After
          upscale, audio is layered in order: Music bed, SFX, Voiceover, then
          Final Video export. Text to Speech and Text to SFX are Runway audio
          nodes. Audio Input handles uploaded or selected music. Extract Audio
          is an optional reference lane only, not the main final source. The
          Social JSON Parse lane remains export-only.
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
  data?:   GeneratedPackage;
  onCopy?: (t: string) => void;
}) {
  void _data;
  void _onCopy;

  const specMap = useMemo(
    () => Object.fromEntries(NODE_SPECS.map((n) => [n.id, n] as const)),
    []
  );

  const [positions, setPositions] = useState<Record<string, Point>>(DEFAULT_POSITIONS);
  const [zoom, setZoom]           = useState(0.34);
  const [pan,  setPan]            = useState<Point>({ x: 20, y: 20 });
  const [dragKind, setDragKind]   = useState<"canvas" | "node" | null>(null);
  const [hoveredWireIdx,  setHoveredWireIdx]  = useState<number | null>(null);
  const [selectedWireIdx, setSelectedWireIdx] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef      = useRef(0.34);
  const panRef       = useRef<Point>({ x: 20, y: 20 });

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
      color:      WIRE_COLORS[wire.style],
      styleLabel: WIRE_STYLE_LABELS[wire.style],
      from:     getPortPoint(wire.from[0], wire.from[1], "right"),
      to:       getPortPoint(wire.to[0],   wire.to[1],   "left"),
      fromNode: getNodeLabel(wire.from[0]),
      fromPort: getPortLabel(wire.from[0], wire.from[1], "right"),
      toNode:   getNodeLabel(wire.to[0]),
      toPort:   getPortLabel(wire.to[0],   wire.to[1],   "left"),
    };
  }, [activeWireIdx, getNodeLabel, getPortLabel, getPortPoint]);

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
    const pad     = 60;
    const newZoom = Math.max(0.12, Math.min(1.4, Math.min(
      (cw - pad * 2) / (maxX - minX),
      (ch - pad * 2) / (maxY - minY),
    )));
    const newPan  = {
      x: (cw - (maxX - minX) * newZoom) / 2 - minX * newZoom,
      y: (ch - (maxY - minY) * newZoom) / 2 - minY * newZoom,
    };
    zoomRef.current = newZoom;
    panRef.current  = newPan;
    setZoom(newZoom);
    setPan(newPan);
  }, [positions]);

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

  const onWheel = useCallback((e: ReactWheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const el = containerRef.current;
    if (!el) return;
    const rect    = el.getBoundingClientRect();
    const mx      = e.clientX - rect.left;
    const my      = e.clientY - rect.top;
    const oldZoom = zoomRef.current;
    const oldPan  = panRef.current;
    const factor  = 1 - e.deltaY * 0.001;
    const newZoom = Math.max(0.12, Math.min(2.0, oldZoom * factor));
    const worldX  = (mx - oldPan.x) / oldZoom;
    const worldY  = (my - oldPan.y) / oldZoom;
    const newPan  = { x: mx - worldX * newZoom, y: my - worldY * newZoom };
    zoomRef.current = newZoom;
    panRef.current  = newPan;
    setZoom(newZoom);
    setPan(newPan);
  }, []);

  const resetView = useCallback(() => {
    const z = 0.34;
    const p = { x: 20, y: 20 };
    zoomRef.current = z;
    panRef.current  = p;
    setZoom(z);
    setPan(p);
    setPositions(DEFAULT_POSITIONS);
    setHoveredWireIdx(null);
    setSelectedWireIdx(null);
    setDragKind(null);
    dragRef.current = null;
  }, []);

  const zoomBy = useCallback((delta: number) => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const cx = el.clientWidth  / 2;
    const cy = el.clientHeight / 2;
    const oz = zoomRef.current;
    const op = panRef.current;
    const nz = Math.max(0.12, Math.min(2.0, oz + delta));
    const wx = (cx - op.x) / oz;
    const wy = (cy - op.y) / oz;
    const np = { x: cx - wx * nz, y: cy - wy * nz };
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
          width: "100%", height: "clamp(860px, 82vh, 1040px)",
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
          position: "absolute", right: 16, bottom: 16, zIndex: 30,
          color: TEXT_FAINT, fontSize: 9, lineHeight: 1.45,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          background: "rgba(9,17,27,0.76)", border: `1px solid ${BORDER}`,
          padding: "10px 12px", borderRadius: 10, backdropFilter: "blur(6px)",
          maxWidth: 250,
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
              <div><span style={{ color: "#cbd5e1" }}>From:</span> {activeWireDetails.fromNode}</div>
              <div style={{ color: TEXT_SUB }}>Output: {activeWireDetails.fromPort}</div>
              <div style={{ margin: "5px 0", color: activeWireDetails.color }}>→</div>
              <div><span style={{ color: "#cbd5e1" }}>To:</span> {activeWireDetails.toNode}</div>
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
              {(["main","rules","preferred","fallback","anchor","qa","post","meta","manual","audio"] as WireStyle[]).map((style) => (
                <marker key={style} id={`arr-${style}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L7,3 z" fill={WIRE_COLORS[style]} />
                </marker>
              ))}
            </defs>

            {WIRES.map((wire, idx) => {
              const from  = getPortPoint(wire.from[0], wire.from[1], "right");
              const to    = getPortPoint(wire.to[0],   wire.to[1],   "left");
              const color = WIRE_COLORS[wire.style];
              const isActive  = activeWireIdx === idx;
              const hasFocus  = activeWireIdx !== null;

              let d = "";
              if      (wire.route === "v")    d = vCurve(from, to);
              else if (wire.route === "pipe") d = pipeCurve(from, to, wire.pipeY ?? 840);
              else                            d = hCurve(from, to, 72);

              const dashed = wire.style === "fallback" || wire.style === "anchor" || wire.style === "qa" || wire.style === "meta" || wire.style === "manual";
              const opacity =
                wire.style === "qa"       ? 0.58 :
                wire.style === "anchor"   ? 0.72 :
                wire.style === "fallback" ? 0.82 :
                wire.style === "meta"     ? 0.76 :
                wire.style === "manual"   ? 0.82 :
                wire.style === "audio"    ? 0.92 :
                wire.style === "rules"    ? 0.92 :
                wire.style === "preferred"? 0.90 :
                wire.style === "post"     ? 0.88 : 1;
              const strokeWidth =
                wire.style === "main"      ? 1.9  :
                wire.style === "meta"      ? 1.1  :
                wire.style === "manual"    ? 1.45 :
                wire.style === "audio"     ? 1.35 :
                wire.style === "rules"     ? 1.25 :
                wire.style === "preferred" ? 1.6  :
                wire.style === "post"      ? 1.45 : 1.05;

              const visibleOpacity    = hasFocus && !isActive ? Math.max(0.06, opacity * 0.16) : opacity;
              const currentStrokeWidth = isActive ? strokeWidth + 1.2 : strokeWidth;
              const glowWidth  = isActive ? currentStrokeWidth + 6 : currentStrokeWidth + (wire.style === "main" ? 2.2 : 1.4);
              const glowOpacity = isActive ? 0.24 : hasFocus ? 0.015 : wire.style === "rules" ? 0.025 : 0.05;

              return (
                <g key={idx}>
                  {(wire.style === "main" || wire.style === "rules" || wire.style === "preferred" || wire.style === "post" || wire.style === "manual" || wire.style === "audio" || isActive) && (
                    <path d={d} fill="none" stroke={color} strokeWidth={glowWidth} opacity={glowOpacity} strokeLinecap="round" strokeLinejoin="round" />
                  )}
                  <path d={d} fill="none" stroke={color}
                    strokeWidth={currentStrokeWidth}
                    strokeDasharray={dashed ? "6 4" : undefined}
                    opacity={visibleOpacity}
                    markerEnd={`url(#${markerId(wire.style)})`}
                    strokeLinecap="round" strokeLinejoin="round"
                    style={{ filter: isActive ? `drop-shadow(0 0 8px ${color})` : undefined, transition: "opacity 120ms ease, stroke-width 120ms ease, filter 120ms ease" }}
                  />
                  <path
                    d={d} fill="none" stroke="transparent"
                    strokeWidth={Math.max(12, currentStrokeWidth + 10)}
                    strokeLinecap="round" strokeLinejoin="round"
                    style={{ cursor: "pointer" }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onPointerEnter={(e) => { e.stopPropagation(); setHoveredWireIdx(idx); }}
                    onPointerLeave={(e) => { e.stopPropagation(); setHoveredWireIdx((prev) => (prev === idx ? null : prev)); }}
                    onClick={(e) => { e.stopPropagation(); setSelectedWireIdx((prev) => (prev === idx ? null : idx)); setHoveredWireIdx(idx); }}
                  />
                  {isActive && (
                    <>
                      <circle cx={from.x} cy={from.y} r={8} fill={color} opacity={0.16} />
                      <circle cx={to.x}   cy={to.y}   r={8} fill={color} opacity={0.16} />
                      <circle cx={from.x} cy={from.y} r={4.2} fill={color} stroke="#f8fafc" strokeWidth={1.1} />
                      <circle cx={to.x}   cy={to.y}   r={4.2} fill={color} stroke="#f8fafc" strokeWidth={1.1} />
                    </>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Section labels */}
          <SectionLabel x={30}   y={88}  text="Inputs" />
          <SectionLabel x={290}  y={154} text="LLM + JSON" color="#1e5a70" />
          <SectionLabel x={560}  y={388} text="Social export" color="#0ea5b7" />
          <SectionLabel x={560}  y={618} text="Optional manual social text" color="#b45309" />
          <SectionLabel x={920}  y={120} text="Anchor image" color="#9d71ff" />
          <SectionLabel x={920}  y={426} text="Optional manual master prompt" color="#b45309" />
          <SectionLabel x={1480} y={118} text="Shot 1" color="#c084fc" />
          <SectionLabel x={1788} y={118} text="Preferred Extract Frame continuity" color="#1f8a70" />
          <SectionLabel x={1788} y={372} text="Last Frame fallback continuity" color="#b45309" />
          <SectionLabel x={1480} y={598} text="First Frame QA" color="#8c6a10" />
          <SectionLabel x={1450} y={744} text="Manual override lanes" color="#b45309" />
          <SectionLabel x={2310} y={118} text="Shot 2" color="#3b82f6" />
          <SectionLabel x={3140} y={118} text="Shot 3" color="#3b82f6" />
          <SectionLabel x={3970} y={118} text="Shot 4" color="#c084fc" />
          <SectionLabel x={4300} y={182} text="Assembly" color="#1e5a70" />
          <SectionLabel x={4858} y={182} text="Upscale + audio" color="#1e5a70" />
          <SectionLabel x={4858} y={470} text="Audio generation" color="#a16207" />

          {/* Title watermark */}
          <div style={{
            position: "absolute", left: 30, top: 20,
            color: "#1e2f42", fontSize: 11, fontWeight: 700,
            letterSpacing: "0.12em", textTransform: "uppercase",
          }}>
            Wild Stories TV · hybrid 4-shot production workflow · continuity, audio layering, and social side outputs
          </div>

          <div style={{
            position: "absolute", left: 860, top: 566, width: 344,
            padding: "10px 12px", borderRadius: 12,
            border: `1px solid ${WIRE_COLORS.manual}44`,
            background: "rgba(26,18,7,0.78)", color: "#fdba74",
            fontSize: 9, lineHeight: 1.55,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)", pointerEvents: "none",
          }}>
            Master image prompt source rule:
            <br />
            use either <span style={{ color: "#e0f2fe" }}>JSON Parse → master_image_prompt</span> or
            the matching <span style={{ color: "#fed7aa" }}>Optional Manual Master Image Prompt</span>.
            Do not feed both into Nano Banana 2 at the same time.
          </div>

          <div style={{
            position: "absolute", left: 1450, top: 932, width: 1080,
            padding: "10px 12px", borderRadius: 12,
            border: `1px solid ${WIRE_COLORS.manual}44`,
            background: "rgba(26,18,7,0.78)", color: "#fdba74",
            fontSize: 9, lineHeight: 1.55,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)", pointerEvents: "none", whiteSpace: "nowrap",
          }}>
            Shot prompt source rule: each shot Prompt input uses either the blue
            <span style={{ color: "#bfdbfe" }}> Prompt Assembler (WSTV)</span> output or the orange
            <span style={{ color: "#fed7aa" }}> Manual Override Text</span> node for that shot, not both at once.
          </div>

          <div style={{
            position: "absolute", left: 560, top: 1104, width: 296,
            padding: "10px 12px", borderRadius: 12,
            border: `1px solid ${WIRE_COLORS.meta}44`,
            background: "rgba(7,21,32,0.82)", color: "#67e8f9",
            fontSize: 9, lineHeight: 1.55,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)", pointerEvents: "none",
          }}>
            Social lane is export-only.
            <br />
            Copy hook, caption, hashtags, and tags from either the JSON Parse social
            outputs or the matching optional manual Text node.
          </div>

          {RULE_ROUTE_ANNOTATIONS.map((item) => (
            <div key={item.key} style={{
              position: "absolute", left: item.x, top: item.y,
              padding: "6px 10px", borderRadius: 12,
              border: `1px solid ${WIRE_COLORS.rules}55`,
              background: "rgba(6,12,20,0.88)", color: "#dcfffb",
              fontSize: 11, fontWeight: 800, lineHeight: 1.2, letterSpacing: "0.03em",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              boxShadow: "0 6px 18px rgba(0,0,0,0.22)", pointerEvents: "none", whiteSpace: "nowrap",
            }}>
              {item.label}
              <span style={{ marginLeft: 8, color: "#7bddd1", fontSize: 8.5, fontWeight: 600 }}>
                {item.note}
              </span>
            </div>
          ))}

          {STITCH_ROUTE_ANNOTATIONS.map((item) => (
            <div key={item.key} style={{
              position: "absolute", left: item.x, top: item.y,
              padding: "6px 10px", borderRadius: 12,
              border: `1px solid ${WIRE_COLORS.post}55`,
              background: "rgba(6,12,20,0.88)", color: "#e0f2fe",
              fontSize: 11, fontWeight: 800, lineHeight: 1.2, letterSpacing: "0.03em",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              boxShadow: "0 6px 18px rgba(0,0,0,0.22)", pointerEvents: "none", whiteSpace: "nowrap",
            }}>
              {item.label}
              <span style={{ marginLeft: 8, color: "#7dd3fc", fontSize: 8.5, fontWeight: 600 }}>
                {item.note}
              </span>
            </div>
          ))}

          {RULE_START_BADGES.map((item) => {
            const point = getPortPoint("parse_json", item.port, "right");
            return (
              <div key={item.key} style={{
                position: "absolute", left: point.x + 14, top: point.y - 10,
                padding: "3px 7px", borderRadius: 999,
                border: `1px solid ${WIRE_COLORS.rules}55`,
                background: "rgba(6,12,20,0.94)", color: "#9cefe4",
                fontSize: 8.5, fontWeight: 800, lineHeight: 1, letterSpacing: "0.06em",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                boxShadow: "0 4px 12px rgba(0,0,0,0.18)", pointerEvents: "none", whiteSpace: "nowrap",
              }}>
                {item.label}
              </div>
            );
          })}

          {STITCH_START_BADGES.map((item) => {
            const point = getPortPoint(item.node, "video", "right");
            return (
              <div key={item.key} style={{
                position: "absolute", left: point.x + 14, top: point.y - 10,
                padding: "3px 7px", borderRadius: 999,
                border: `1px solid ${WIRE_COLORS.post}55`,
                background: "rgba(6,12,20,0.94)", color: "#bae6fd",
                fontSize: 8.5, fontWeight: 800, lineHeight: 1, letterSpacing: "0.06em",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                boxShadow: "0 4px 12px rgba(0,0,0,0.18)", pointerEvents: "none", whiteSpace: "nowrap",
              }}>
                {item.label}
              </div>
            );
          })}

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
              { label: "Main pipeline",               color: WIRE_COLORS.main,      dashed: false },
              { label: "Prompt-rule links (WSTV)",    color: WIRE_COLORS.rules,     dashed: false },
              { label: "Extract Frame handoff",       color: WIRE_COLORS.preferred, dashed: false },
              { label: "Last Frame handoff (fallback)",color: WIRE_COLORS.fallback, dashed: true  },
              { label: "WSTV anchor fallback",        color: WIRE_COLORS.anchor,    dashed: true  },
              { label: "First Frame QA only",         color: WIRE_COLORS.qa,        dashed: true  },
              { label: "Assembly + post",             color: WIRE_COLORS.post,      dashed: false },
              { label: "WSTV manual override",        color: WIRE_COLORS.manual,    dashed: true  },
              { label: "Social export only",          color: WIRE_COLORS.meta,      dashed: true  },
              { label: "Audio generation + layering", color: WIRE_COLORS.audio,     dashed: false },
            ] as const).map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <svg width={34} height={10}>
                  <line x1={0} y1={5} x2={34} y2={5}
                    stroke={item.color}
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

      {/* Info Panel */}
      <InfoPanel />
    </div>
  );
}
