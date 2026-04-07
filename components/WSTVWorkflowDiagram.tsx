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

type WireStyle = "main" | "fallback" | "anchor" | "qa" | "helper";

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
  helper: "#42566f",
};

const BG = "#060c14";
const GRID_MINOR = "#101827";
const GRID_MAJOR = "#172335";
const BORDER = "rgba(255,255,255,0.08)";
const TEXT_MAIN = "#edf2f8";
const TEXT_SUB = "#7b8ca3";
const TEXT_FAINT = "#526579";

const VIEW_W = 3560;
const VIEW_H = 1120;

const HEADER_H = 44;
const ROW_H = 20;
const BODY_TOP = 12;
const FOOTER_PAD = 10;

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

function getNodeHeight(spec: NodeSpec) {
  const rowCount = Math.max(spec.inputs.length, spec.outputs.length, 1);
  const infoExtra = (spec.infoLines?.length ?? 0) * 11;
  return HEADER_H + BODY_TOP + rowCount * ROW_H + (infoExtra ? infoExtra + 10 : 0) + FOOTER_PAD;
}

function makeNode(id: string, cfg: Omit<NodeSpec, "id">): NodeSpec {
  return { id, ...cfg };
}

const NODE_SPECS: NodeSpec[] = [
  makeNode("text_system", {
    title: "Text",
    subtitle: "System Prompt",
    badge: "INPUT",
    width: 176,
    bg: "#0c1520",
    inputs: [],
    outputs: [{ id: "text", label: "Text", kind: "text" }],
  }),
  makeNode("text_user", {
    title: "Text",
    subtitle: "User Story Prompt",
    badge: "INPUT",
    width: 176,
    bg: "#0c1520",
    inputs: [],
    outputs: [{ id: "text", label: "Text", kind: "text" }],
  }),
  makeNode("image_ref", {
    title: "Image",
    subtitle: "Reference Image",
    badge: "INPUT",
    width: 176,
    bg: "#0c1520",
    inputs: [],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
  }),

  makeNode("claude", {
    title: "Claude",
    subtitle: "Prompt Planner",
    badge: "MODEL",
    width: 220,
    bg: "#14092e",
    accent: "#f97316",
    inputs: [
      { id: "system", label: "System Prompt", kind: "text", required: true },
      { id: "prompt", label: "Prompt", kind: "text", required: true },
      { id: "image", label: "Image", kind: "image" },
    ],
    outputs: [{ id: "json", label: "JSON", kind: "text" }],
  }),

  makeNode("json_core", {
    title: "JSON Parse",
    subtitle: "Core Outputs",
    badge: "UTILITY",
    width: 282,
    bg: "#070c18",
    accent: "#16a34a",
    inputs: [{ id: "json", label: "JSON", kind: "text", required: true }],
    outputs: [
      { id: "master", label: "master_image_prompt", kind: "text" },
      { id: "shot1", label: "shot1_video_prompt", kind: "text" },
      { id: "shot2", label: "shot2_video_prompt", kind: "text" },
      { id: "audio_prompt", label: "shot2_audio_prompt", kind: "text" },
      { id: "shot3", label: "shot3_video_prompt", kind: "text" },
      { id: "negative", label: "kling_negative_prompt", kind: "text" },
      { id: "char_lock", label: "character_lock", kind: "text" },
      { id: "op_notes", label: "operator_notes", kind: "text" },
    ],
    infoLines: ["Core prompt pack fields"],
  }),

  makeNode("json_meta", {
    title: "JSON Parse",
    subtitle: "Meta Outputs",
    badge: "UTILITY",
    width: 282,
    bg: "#070c18",
    accent: "#16a34a",
    inputs: [{ id: "json", label: "JSON", kind: "text", required: true }],
    outputs: [
      { id: "mi1", label: "motion_intensity.shot1", kind: "text" },
      { id: "mi2", label: "motion_intensity.shot2", kind: "text" },
      { id: "mi3", label: "motion_intensity.shot3", kind: "text" },
      { id: "hook", label: "hook", kind: "text" },
      { id: "caption", label: "caption", kind: "text" },
    ],
    infoLines: ["Second JSON Parse keeps the full pack within the documented JSON Parse output limit."],
  }),

  makeNode("nano_banana_2", {
    title: "Nano Banana 2",
    subtitle: "Master Still Generator",
    badge: "MODEL",
    width: 214,
    bg: "#051a0e",
    accent: "#16a34a",
    inputs: [
      { id: "prompt", label: "Prompt", kind: "text", required: true },
      { id: "image", label: "Image", kind: "image" },
    ],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
  }),

  makeNode("gen4_anchor", {
    title: "Gen-4 Image",
    subtitle: "Canonical Anchor",
    badge: "MODEL",
    width: 232,
    bg: "#1a0544",
    accent: "#c084fc",
    inputs: [{ id: "image", label: "Image", kind: "image", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
    infoLines: ["Strongest identity fallback for the full sequence."],
  }),

  makeNode("shot1", {
    title: "Gen-4.5",
    subtitle: "Shot 1 — Opening Tension",
    badge: "MODEL",
    width: 228,
    bg: "#060f28",
    accent: "#16a34a",
    inputs: [
      { id: "image", label: "Image", kind: "image", required: true },
      { id: "prompt", label: "Prompt", kind: "text", required: true },
    ],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
  }),

  makeNode("trim1", {
    title: "Trim Video",
    subtitle: "Fallback prep",
    badge: "UTILITY",
    width: 188,
    bg: "#071318",
    accent: "#16a34a",
    inputs: [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
  }),

  makeNode("extract1", {
    title: "Extract Frame",
    subtitle: "Preferred handoff",
    badge: "UTILITY",
    width: 188,
    bg: "#041420",
    accent: "#16a34a",
    inputs: [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
  }),

  makeNode("kling_s2", {
    title: "Kling 3.0 Pro",
    subtitle: "Shot 2 — Action Pressure",
    badge: "MODEL",
    width: 244,
    bg: "#1e0b00",
    accent: "#2563eb",
    inputs: [
      { id: "image", label: "Image", kind: "image", required: true },
      { id: "prompt", label: "Prompt", kind: "text", required: true },
      { id: "negative", label: "Negative", kind: "text" },
    ],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
  }),

  makeNode("trim2", {
    title: "Trim Video",
    subtitle: "Fallback prep",
    badge: "UTILITY",
    width: 188,
    bg: "#071318",
    accent: "#16a34a",
    inputs: [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
  }),

  makeNode("extract2", {
    title: "Extract Frame",
    subtitle: "Preferred handoff",
    badge: "UTILITY",
    width: 188,
    bg: "#041420",
    accent: "#16a34a",
    inputs: [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
  }),

  makeNode("shot3", {
    title: "Gen-4.5",
    subtitle: "Shot 3 — Resolved Tension",
    badge: "MODEL",
    width: 228,
    bg: "#060f28",
    accent: "#16a34a",
    inputs: [
      { id: "image", label: "Image", kind: "image", required: true },
      { id: "prompt", label: "Prompt", kind: "text", required: true },
    ],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
  }),

  makeNode("stitch", {
    title: "Stitch",
    subtitle: "Final Sequence",
    badge: "UTILITY",
    width: 198,
    bg: "#0d0220",
    accent: "#16a34a",
    inputs: [
      { id: "s1", label: "Input 1", kind: "video", required: true },
      { id: "s2", label: "Input 2", kind: "video", required: true },
      { id: "s3", label: "Input 3", kind: "video", required: true },
    ],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
  }),

  makeNode("last1", {
    title: "Last Frame",
    subtitle: "Fallback only",
    badge: "UTILITY",
    width: 184,
    bg: "#160202",
    accent: "#fb923c",
    dim: true,
    inputs: [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
  }),

  makeNode("last2", {
    title: "Last Frame",
    subtitle: "Fallback only",
    badge: "UTILITY",
    width: 184,
    bg: "#160202",
    accent: "#fb923c",
    dim: true,
    inputs: [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
  }),

  makeNode("qa1", {
    title: "First Frame",
    subtitle: "QA — Shot 1 Start",
    badge: "UTILITY",
    width: 184,
    bg: "#100c00",
    accent: "#fbbf24",
    dim: true,
    inputs: [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
  }),

  makeNode("qa2", {
    title: "First Frame",
    subtitle: "QA — Shot 2 Start",
    badge: "UTILITY",
    width: 184,
    bg: "#100c00",
    accent: "#fbbf24",
    dim: true,
    inputs: [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
  }),

  makeNode("qa3", {
    title: "First Frame",
    subtitle: "QA — Shot 3 Start",
    badge: "UTILITY",
    width: 184,
    bg: "#100c00",
    accent: "#fbbf24",
    dim: true,
    inputs: [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
  }),

  makeNode("continuity_notes", {
    title: "Continuity Notes",
    subtitle: "character_lock + motion plan + operator guidance",
    badge: "NOTES",
    width: 338,
    bg: "#08101c",
    dim: true,
    inputs: [
      { id: "char_lock", label: "character_lock", kind: "text" },
      { id: "mi1", label: "motion_intensity.shot1", kind: "text" },
      { id: "mi2", label: "motion_intensity.shot2", kind: "text" },
      { id: "mi3", label: "motion_intensity.shot3", kind: "text" },
      { id: "op_notes", label: "operator_notes", kind: "text" },
    ],
    outputs: [],
    infoLines: [
      "Fallback order: Extract Frame → Last Frame after Trim → Canonical Anchor",
      "Lock good nodes after QA and keep seeds consistent on retries.",
      "This is guidance only, not a fake media node.",
    ],
  }),

  makeNode("audio_notes", {
    title: "Audio Notes",
    subtitle: "shot2_audio_prompt",
    badge: "NOTES",
    width: 260,
    bg: "#08101c",
    dim: true,
    inputs: [{ id: "audio_prompt", label: "shot2_audio_prompt", kind: "text" }],
    outputs: [],
    infoLines: [
      "Paste into Kling audio if available.",
      "Keep ambience matched to habitat and action.",
    ],
  }),

  makeNode("social_pack", {
    title: "Social Pack",
    subtitle: "hook + caption",
    badge: "NOTES",
    width: 248,
    bg: "#08101c",
    dim: true,
    inputs: [
      { id: "hook", label: "hook", kind: "text" },
      { id: "caption", label: "caption", kind: "text" },
    ],
    outputs: [],
    infoLines: [
      "Use hook as opening overlay text.",
      "Use caption as post copy.",
    ],
  }),

  makeNode("anchor_guide", {
    title: "How to use Canonical Anchor",
    subtitle: "Practical fallback rule",
    badge: "GUIDE",
    width: 640,
    bg: "#08101c",
    dim: true,
    inputs: [],
    outputs: [],
    infoLines: [
      "1. Generate the master still, then normalize it into the Gen-4 Image Canonical Anchor.",
      "2. Use the Canonical Anchor as the main image source for Shot 1.",
      "3. Between shots, prefer Extract Frame. Use Last Frame only after Trim Video.",
      "4. If a handoff frame is weak, fall back to the Canonical Anchor instead of forcing drift.",
      "5. Lock strong nodes after QA and use consistent seeds on retries.",
    ],
  }),
];

const DEFAULT_POSITIONS: Record<string, Point> = {
  text_system: { x: 30, y: 120 },
  text_user: { x: 30, y: 228 },
  image_ref: { x: 30, y: 336 },

  claude: { x: 270, y: 200 },

  json_core: { x: 590, y: 68 },
  json_meta: { x: 590, y: 412 },

  nano_banana_2: { x: 930, y: 152 },
  gen4_anchor: { x: 1195, y: 144 },

  shot1: { x: 1508, y: 152 },
  trim1: { x: 1770, y: 166 },
  extract1: { x: 2012, y: 166 },

  kling_s2: { x: 2254, y: 144 },
  trim2: { x: 2558, y: 166 },
  extract2: { x: 2800, y: 166 },

  shot3: { x: 3042, y: 152 },
  stitch: { x: 3306, y: 150 },

  last1: { x: 1770, y: 410 },
  last2: { x: 2558, y: 410 },

  qa1: { x: 1508, y: 410 },
  qa2: { x: 2254, y: 410 },
  qa3: { x: 3042, y: 410 },

  continuity_notes: { x: 930, y: 660 },
  audio_notes: { x: 1770, y: 686 },
  social_pack: { x: 2558, y: 686 },
  anchor_guide: { x: 30, y: 900 },
};

const WIRES: WireDef[] = [
  { from: ["text_system", "text"], to: ["claude", "system"], style: "main" },
  { from: ["text_user", "text"], to: ["claude", "prompt"], style: "main" },
  { from: ["image_ref", "image"], to: ["claude", "image"], style: "main" },

  { from: ["claude", "json"], to: ["json_core", "json"], style: "main" },
  { from: ["claude", "json"], to: ["json_meta", "json"], style: "helper" },

  { from: ["json_core", "master"], to: ["nano_banana_2", "prompt"], style: "main" },
  { from: ["image_ref", "image"], to: ["nano_banana_2", "image"], style: "main" },

  { from: ["nano_banana_2", "image"], to: ["gen4_anchor", "image"], style: "main" },

  { from: ["gen4_anchor", "image"], to: ["shot1", "image"], style: "main" },
  { from: ["json_core", "shot1"], to: ["shot1", "prompt"], style: "main" },

  { from: ["shot1", "video"], to: ["trim1", "video"], style: "main" },
  { from: ["trim1", "video"], to: ["extract1", "video"], style: "main" },
  { from: ["extract1", "image"], to: ["kling_s2", "image"], style: "main" },

  { from: ["json_core", "shot2"], to: ["kling_s2", "prompt"], style: "main" },
  { from: ["json_core", "negative"], to: ["kling_s2", "negative"], style: "main" },

  { from: ["kling_s2", "video"], to: ["trim2", "video"], style: "main" },
  { from: ["trim2", "video"], to: ["extract2", "video"], style: "main" },
  { from: ["extract2", "image"], to: ["shot3", "image"], style: "main" },
  { from: ["json_core", "shot3"], to: ["shot3", "prompt"], style: "main" },

  { from: ["shot1", "video"], to: ["stitch", "s1"], style: "main" },
  { from: ["kling_s2", "video"], to: ["stitch", "s2"], style: "main" },
  { from: ["shot3", "video"], to: ["stitch", "s3"], style: "main" },

  { from: ["trim1", "video"], to: ["last1", "video"], style: "fallback", route: "v" },
  { from: ["trim2", "video"], to: ["last2", "video"], style: "fallback", route: "v" },
  { from: ["last1", "image"], to: ["kling_s2", "image"], style: "fallback" },
  { from: ["last2", "image"], to: ["shot3", "image"], style: "fallback" },

  { from: ["gen4_anchor", "image"], to: ["kling_s2", "image"], style: "anchor", route: "pipe", pipeY: 556 },
  { from: ["gen4_anchor", "image"], to: ["shot3", "image"], style: "anchor", route: "pipe", pipeY: 584 },

  { from: ["shot1", "video"], to: ["qa1", "video"], style: "qa", route: "v" },
  { from: ["kling_s2", "video"], to: ["qa2", "video"], style: "qa", route: "v" },
  { from: ["shot3", "video"], to: ["qa3", "video"], style: "qa", route: "v" },

  { from: ["json_core", "audio_prompt"], to: ["audio_notes", "audio_prompt"], style: "helper" },
  { from: ["json_core", "char_lock"], to: ["continuity_notes", "char_lock"], style: "helper" },
  { from: ["json_core", "op_notes"], to: ["continuity_notes", "op_notes"], style: "helper" },
  { from: ["json_meta", "mi1"], to: ["continuity_notes", "mi1"], style: "helper" },
  { from: ["json_meta", "mi2"], to: ["continuity_notes", "mi2"], style: "helper" },
  { from: ["json_meta", "mi3"], to: ["continuity_notes", "mi3"], style: "helper" },
  { from: ["json_meta", "hook"], to: ["social_pack", "hook"], style: "helper" },
  { from: ["json_meta", "caption"], to: ["social_pack", "caption"], style: "helper" },
];

function getPortY(index: number) {
  return HEADER_H + BODY_TOP + index * ROW_H + ROW_H / 2;
}

function markerId(style: WireStyle) {
  switch (style) {
    case "main":
      return "arr-main";
    case "fallback":
      return "arr-fallback";
    case "anchor":
      return "arr-anchor";
    case "qa":
      return "arr-qa";
    case "helper":
      return "arr-helper";
  }
}

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
  const rows = Math.max(spec.inputs.length, spec.outputs.length, 1);

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
      <div
        style={{
          height: 4,
          background: spec.accent
            ? `linear-gradient(90deg, ${spec.accent}, ${spec.accent}99)`
            : "rgba(255,255,255,0.06)",
        }}
      />
      <div
        style={{
          padding: "8px 10px 8px",
          height: `calc(100% - 4px)`,
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

        <div
          style={{
            position: "relative",
            marginTop: 10,
            minHeight: rows * ROW_H,
          }}
        >
          {Array.from({ length: rows }).map((_, i) => {
            const input = spec.inputs[i];
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
  const [zoom, setZoom] = useState(0.40);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [dragKind, setDragKind] = useState<"canvas" | "node" | null>(null);

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
      const pos = positions[id];
      return {
        x: pos.x,
        y: pos.y,
        w: spec.width,
        h: getNodeHeight(spec),
      };
    },
    [positions, specMap]
  );

  const getPortPoint = useCallback(
    (nodeId: string, portId: string, side: Side): Point => {
      const spec = specMap[nodeId];
      const rect = getRect(nodeId);
      const ports = side === "left" ? spec.inputs : spec.outputs;
      const index = ports.findIndex((p) => p.id === portId);
      const y = rect.y + getPortY(Math.max(index, 0));
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
    setZoom(0.40);
    setPan({ x: 0, y: 0 });
    setPositions(DEFAULT_POSITIONS);
    setDragKind(null);
    dragRef.current = null;
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: 780,
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
        <svg
          width={VIEW_W}
          height={VIEW_H}
          style={{ position: "absolute", inset: 0, overflow: "visible" }}
        >
          <defs>
            {Object.entries({
              "arr-main": WIRE_COLORS.main,
              "arr-fallback": WIRE_COLORS.fallback,
              "arr-anchor": WIRE_COLORS.anchor,
              "arr-qa": WIRE_COLORS.qa,
              "arr-helper": WIRE_COLORS.helper,
            }).map(([id, color]) => (
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
            const from = getPortPoint(wire.from[0], wire.from[1], "right");
            const to = getPortPoint(wire.to[0], wire.to[1], "left");
            const color = WIRE_COLORS[wire.style];

            let d = "";
            if (wire.route === "v") d = vCurve(from, to);
            else if (wire.route === "pipe") d = pipeCurve(from, to, wire.pipeY ?? 560);
            else d = hCurve(from, to, 72);

            const dashed = wire.style !== "main";
            const opacity =
              wire.style === "helper" ? 0.46 :
              wire.style === "qa" ? 0.60 :
              wire.style === "anchor" ? 0.74 :
              wire.style === "fallback" ? 0.80 : 1;

            const strokeWidth =
              wire.style === "main" ? 2.35 :
              wire.style === "helper" ? 1.15 :
              1.35;

            return (
              <g key={idx}>
                {wire.style === "main" && (
                  <path
                    d={d}
                    fill="none"
                    stroke={color}
                    strokeWidth={5}
                    opacity={0.12}
                  />
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

        <SectionLabel x={30} y={96} text="Inputs" />
        <SectionLabel x={270} y={178} text="AI Director" />
        <SectionLabel x={590} y={42} text="Structured Output" />
        <SectionLabel x={930} y={126} text="Image Chain" />
        <SectionLabel x={1195} y={116} text="Canonical Anchor" color="#9d71ff" />
        <SectionLabel x={1508} y={126} text="Shot 1 — Gen-4.5" />
        <SectionLabel x={2254} y={118} text="Shot 2 — Kling 3.0 Pro" />
        <SectionLabel x={3042} y={126} text="Shot 3 — Gen-4.5" />
        <SectionLabel x={1508} y={388} text="Fallback · QA Lane" color="#8c6a10" />
        <SectionLabel x={930} y={638} text="Helper Lane" color="#3f5772" />

        {NODE_SPECS.map((spec) => (
          <NodeBox
            key={spec.id}
            spec={spec}
            pos={positions[spec.id]}
            onPointerDown={onNodePointerDown(spec.id)}
          />
        ))}

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
          {([
            { label: "Main pipeline", color: WIRE_COLORS.main, dashed: false },
            { label: "Last Frame fallback", color: WIRE_COLORS.fallback, dashed: true },
            { label: "Canonical Anchor fallback", color: WIRE_COLORS.anchor, dashed: true },
            { label: "First Frame QA", color: WIRE_COLORS.qa, dashed: true },
            { label: "Helper notes", color: WIRE_COLORS.helper, dashed: true },
          ] as const).map((item) => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <svg width={34} height={10}>
                <line
                  x1={0}
                  y1={5}
                  x2={34}
                  y2={5}
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
  );
}
