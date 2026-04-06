"use client";

import {
  useCallback,
  useMemo,
  useState,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import type { GeneratedPackage } from "@/types";

// ─────────────────────────────────────────────────────────────
// components/WSTVWorkflowDiagram.tsx
// WSTV — Strong Final Workflow Diagram (Runway-Aligned Edition)
//
// Runway official best practices applied (help.runwayml.com):
//   • Input image quality is critical — artifact-free, high-res
//   • I2V prompt = motion only — don't restate image content
//   • Use positional language for multiple subjects
//   • Sequential timestamps supported for temporal control
//   • Extract Frame = preferred handoff (choose cleanest frame)
//   • Last Frame = fallback only (if final frame happens to be clean)
//   • Fixed Seed available for consistent motion across retries
//   • JSON formatting ignored by model — plain text prompts only
//   • Avoid negative phrasing — describe what SHOULD happen
//   • Duration 2–10s — longer for complex sequential actions
//
// Node naming (real Runway Workflows names):
//   Text, Image, Claude, JSON Parse, Nano Banana 2,
//   Gen-4.5, Kling 3.0 Pro, Extract Frame, Last Frame, Stitch
//
// Workflow:
//   Text(System) + Text(User) + Image(Ref) → Claude → JSON Parse
//   → Nano Banana 2 → Master Still
//   → Gen-4.5 Shot 1 → Extract Frame → Kling Shot 2
//   → Extract Frame → Gen-4.5 Shot 3 → Stitch
//
// Negative prompt wired ONLY to Kling (Runway: not supported).
// Last Frame nodes have dashed fallback wires to next shots.
// ─────────────────────────────────────────────────────────────

/* ── Content-type color coding (official Runway Workflows) ── */
const TC: Record<string, { port: string; wire: string }> = {
  text: { port: "#f59e0b", wire: "#f59e0b" },   // Orange
  image: { port: "#3b82f6", wire: "#3b82f6" },   // Blue
  audio: { port: "#eab308", wire: "#eab308" },   // Yellow
  video: { port: "#22c55e", wire: "#22c55e" },   // Green
};

/* ── Engine accent colors ──────────────────────────────────── */
const ENG: Record<
  string,
  {
    accent: string;
    badge: string;
    badgeText: string;
    label: string;
    icon: string;
  }
> = {
  runway: {
    accent: "#16a34a",
    badge: "#14532d",
    badgeText: "#bbf7d0",
    label: "Runway",
    icon: "▶",
  },
  claude: {
    accent: "#f97316",
    badge: "#4a240d",
    badgeText: "#fdba74",
    label: "Claude",
    icon: "✦",
  },
  kling: {
    accent: "#2563eb",
    badge: "#1e3a5f",
    badgeText: "#93c5fd",
    label: "Kling",
    icon: "◆",
  },
};

/* ── Layout constants ──────────────────────────────────────── */
const NW = 252;
const PR = 5.5;
const PS = 26;
const HH = 42;
const PY0 = HH + 16;

type Port = {
  id: string;
  type: string;
  label: string;
};

type Node = {
  id: string;
  x: number;
  y: number;
  title: string;
  sub: string;
  engine: keyof typeof ENG;
  cat: "input" | "model" | "utility";
  info: string;
  inputs: Port[];
  outputs: Port[];
};

type Wire = {
  from: string;
  to: string;
  type: keyof typeof TC;
  dashed?: boolean;
};

const nodeHeight = (n: Node) =>
  PY0 + Math.max(n.inputs.length, n.outputs.length) * PS + 18;

// ─────────────────────────────────────────────────────────────
// NODE DEFINITIONS
// Info lines now carry Runway official guidance per node role.
// ─────────────────────────────────────────────────────────────
function buildNodes(): Node[] {
  return [
    /* ══ COLUMN 0 — Input nodes ═══════════════════════════════ */
    {
      id: "text_system",
      x: 40,
      y: 40,
      title: "Text",
      sub: "System Prompt",
      engine: "runway",
      cat: "input",
      // System prompt tells Claude HOW to structure its JSON output
      info: "WSTV rules · JSON schema · motion-only I2V instructions",
      inputs: [],
      outputs: [{ id: "text", type: "text", label: "Text" }],
    },
    {
      id: "text_user",
      x: 40,
      y: 190,
      title: "Text",
      sub: "User Story Prompt",
      engine: "runway",
      cat: "input",
      // The creative brief: what animals, what arc, what world
      info: "Predator · prey · arc · habitat · weather · tone",
      inputs: [],
      outputs: [{ id: "text", type: "text", label: "Text" }],
    },
    {
      id: "image_ref",
      x: 40,
      y: 340,
      title: "Image",
      sub: "Reference Image (optional)",
      engine: "runway",
      cat: "input",
      // Runway: input image quality is critical for I2V output
      info: "High-res · artifact-free · clear subject separation",
      inputs: [],
      outputs: [{ id: "image", type: "image", label: "Image" }],
    },

    /* ══ COLUMN 1 — LLM planning ═════════════════════════════ */
    {
      id: "claude",
      x: 360,
      y: 150,
      title: "Claude",
      sub: "LLM Prompt Planner",
      engine: "claude",
      cat: "model",
      // Claude generates the full structured prompt pack as JSON
      info: "Returns JSON · image prompt + 3 shots + negative",
      inputs: [
        { id: "system", type: "text", label: "System Prompt" },
        { id: "prompt", type: "text", label: "Prompt *" },
        { id: "image", type: "image", label: "Image" },
      ],
      outputs: [{ id: "text", type: "text", label: "Text" }],
    },

    /* ══ COLUMN 2 — JSON Parse ═══════════════════════════════ */
    {
      id: "json_parse",
      x: 700,
      y: 110,
      title: "JSON Parse",
      sub: "Structured Prompt Split",
      engine: "runway",
      cat: "utility",
      // Official Runway utility node — JSONPath extraction
      info: "Official Runway node · splits JSON into typed fields",
      inputs: [{ id: "json", type: "text", label: "JSON *" }],
      outputs: [
        { id: "master", type: "text", label: "master_image_prompt" },
        { id: "shot1", type: "text", label: "shot1_video_prompt" },
        { id: "shot2", type: "text", label: "shot2_video_prompt" },
        { id: "shot3", type: "text", label: "shot3_video_prompt" },
        { id: "negative", type: "text", label: "kling_negative_prompt" },
      ],
    },

    /* ══ COLUMN 3 — Image generation ════════════════════════= */
    {
      id: "nano_banana_2",
      x: 1060,
      y: 40,
      title: "Nano Banana 2",
      sub: "Master Still Generator",
      engine: "runway",
      cat: "model",
      // Runway: "Use a high-quality input image, free of visual
      // artifacts, for best results" — this node must produce that
      info: "High-res · artifact-free · clear full-body · clean BG",
      inputs: [
        { id: "text", type: "text", label: "Text *" },
        { id: "image", type: "image", label: "Image" },
      ],
      outputs: [{ id: "image", type: "image", label: "Image" }],
    },

    /* ══ COLUMN 4 — Shot 1 video generation ═════════════════ */
    {
      id: "gen45_s1",
      x: 1060,
      y: 280,
      title: "Gen-4.5",
      sub: "Shot 1 — Opening Tension",
      engine: "runway",
      cat: "model",
      // Runway official: "Image carries identity. Prompt = MOTION ONLY.
      // Restating image elements → reduced motion / unexpected results."
      info: "I2V motion-only · don't restate image · 5–10s · 24/25fps",
      inputs: [
        { id: "image", type: "image", label: "Image *" },
        { id: "text", type: "text", label: "Text *" },
      ],
      outputs: [{ id: "video", type: "video", label: "Video" }],
    },

    /* ══ COLUMN 5 — Handoff: Shot 1 → Shot 2 ═══════════════ */
    {
      id: "extract_1",
      x: 1400,
      y: 250,
      title: "Extract Frame",
      sub: "Preferred — Shot 1 → Shot 2",
      engine: "runway",
      cat: "utility",
      // Runway: "extracting the last frame of a completed generation
      // and using that as the image input for a new video" — but we
      // choose the CLEANEST frame, not blindly the last one
      info: "Scrub to cleanest full-body frame · main path",
      inputs: [{ id: "video", type: "video", label: "Video *" }],
      outputs: [{ id: "image", type: "image", label: "Image" }],
    },
    {
      id: "last_1",
      x: 1400,
      y: 420,
      title: "Last Frame",
      sub: "Fallback — Shot 1 → Shot 2",
      engine: "runway",
      cat: "utility",
      // Last frame is automatic but may not be the cleanest option
      info: "Auto final frame · use only if clean full-body",
      inputs: [{ id: "video", type: "video", label: "Video *" }],
      outputs: [{ id: "image", type: "image", label: "Image" }],
    },

    /* ══ COLUMN 6 — Shot 2 (Kling action lane) ═════════════ */
    {
      id: "kling_s2",
      x: 1740,
      y: 280,
      title: "Kling 3.0 Pro",
      sub: "Shot 2 — Action Pressure",
      engine: "kling",
      cat: "model",
      // Kling: supports negative prompts, Bind Subject, native audio
      info: "I2V · Bind Subject · negative OK · 3–15s · 4K/60fps",
      inputs: [
        { id: "image", type: "image", label: "Image *" },
        { id: "text", type: "text", label: "Text *" },
        { id: "negative", type: "text", label: "Negative" },
      ],
      outputs: [{ id: "video", type: "video", label: "Video" }],
    },

    /* ══ COLUMN 7 — Handoff: Shot 2 → Shot 3 ═══════════════ */
    {
      id: "extract_2",
      x: 2080,
      y: 250,
      title: "Extract Frame",
      sub: "Preferred — Shot 2 → Shot 3",
      engine: "runway",
      cat: "utility",
      info: "Scrub to cleanest full-body frame · main path",
      inputs: [{ id: "video", type: "video", label: "Video *" }],
      outputs: [{ id: "image", type: "image", label: "Image" }],
    },
    {
      id: "last_2",
      x: 2080,
      y: 420,
      title: "Last Frame",
      sub: "Fallback — Shot 2 → Shot 3",
      engine: "runway",
      cat: "utility",
      info: "Auto final frame · use only if clean full-body",
      inputs: [{ id: "video", type: "video", label: "Video *" }],
      outputs: [{ id: "image", type: "image", label: "Image" }],
    },

    /* ══ COLUMN 8 — Shot 3 video generation ═════════════════ */
    {
      id: "gen45_s3",
      x: 2420,
      y: 280,
      title: "Gen-4.5",
      sub: "Shot 3 — Resolved Tension",
      engine: "runway",
      cat: "model",
      // Same Runway I2V motion-only rule as Shot 1
      info: "I2V motion-only · don't restate image · 5–10s · 24/25fps",
      inputs: [
        { id: "image", type: "image", label: "Image *" },
        { id: "text", type: "text", label: "Text *" },
      ],
      outputs: [{ id: "video", type: "video", label: "Video" }],
    },

    /* ══ COLUMN 9 — Final assembly ══════════════════════════ */
    {
      id: "stitch",
      x: 2760,
      y: 290,
      title: "Stitch",
      sub: "Final Sequence",
      engine: "runway",
      cat: "utility",
      // Runway: "combine both clips in a video editor to adjust
      // timing and remove the shared frame"
      info: "Combine S1+S2+S3 · remove shared handoff frames",
      inputs: [
        { id: "input1", type: "video", label: "Input 1 *" },
        { id: "input2", type: "video", label: "Input 2 *" },
        { id: "input3", type: "video", label: "Input 3 *" },
      ],
      outputs: [{ id: "video", type: "video", label: "Video" }],
    },
  ];
}

// ─────────────────────────────────────────────────────────────
// WIRE DEFINITIONS
//
// Key change: Last Frame nodes now have dashed fallback wires
// to the next shot's image input, making the alternative path
// visible instead of leaving dead-end output ports.
// ─────────────────────────────────────────────────────────────
const WIRES: Wire[] = [
  /* ── Inputs → Claude ────────────────────────────────────── */
  { from: "text_system.text", to: "claude.system", type: "text" },
  { from: "text_user.text", to: "claude.prompt", type: "text" },
  { from: "image_ref.image", to: "claude.image", type: "image" },

  /* ── Claude → JSON Parse ────────────────────────────────── */
  { from: "claude.text", to: "json_parse.json", type: "text" },

  /* ── JSON Parse → NB2 (master image prompt) ────────────── */
  { from: "json_parse.master", to: "nano_banana_2.text", type: "text" },
  // Optional ref image also feeds NB2 for style guidance
  { from: "image_ref.image", to: "nano_banana_2.image", type: "image" },

  /* ── NB2 master still → Gen-4.5 Shot 1 ────────────────── */
  { from: "nano_banana_2.image", to: "gen45_s1.image", type: "image" },
  { from: "json_parse.shot1", to: "gen45_s1.text", type: "text" },

  /* ── Shot 1 → Extract Frame (main) + Last Frame (fallback) */
  { from: "gen45_s1.video", to: "extract_1.video", type: "video" },
  { from: "gen45_s1.video", to: "last_1.video", type: "video", dashed: true },

  /* ── Extract Frame 1 → Kling Shot 2 (main continuity path) */
  { from: "extract_1.image", to: "kling_s2.image", type: "image" },
  // Last Frame 1 → Kling Shot 2 (fallback — dashed)
  { from: "last_1.image", to: "kling_s2.image", type: "image", dashed: true },

  /* ── JSON Parse → Kling Shot 2 (action prompt + negative) ─ */
  { from: "json_parse.shot2", to: "kling_s2.text", type: "text" },
  { from: "json_parse.negative", to: "kling_s2.negative", type: "text" },

  /* ── Shot 2 → Extract Frame (main) + Last Frame (fallback) */
  { from: "kling_s2.video", to: "extract_2.video", type: "video" },
  { from: "kling_s2.video", to: "last_2.video", type: "video", dashed: true },

  /* ── Extract Frame 2 → Gen-4.5 Shot 3 (main continuity) ── */
  { from: "extract_2.image", to: "gen45_s3.image", type: "image" },
  // Last Frame 2 → Gen-4.5 Shot 3 (fallback — dashed)
  { from: "last_2.image", to: "gen45_s3.image", type: "image", dashed: true },

  /* ── JSON Parse → Gen-4.5 Shot 3 (motion prompt) ────────── */
  { from: "json_parse.shot3", to: "gen45_s3.text", type: "text" },

  /* ── All 3 shot videos → Stitch (final assembly) ────────── */
  { from: "gen45_s1.video", to: "stitch.input1", type: "video" },
  { from: "kling_s2.video", to: "stitch.input2", type: "video" },
  { from: "gen45_s3.video", to: "stitch.input3", type: "video" },
];

// ─────────────────────────────────────────────────────────────
// SVG HELPERS
// ─────────────────────────────────────────────────────────────
function getPortPos(
  nodes: Node[],
  nodeId: string,
  portId: string,
  side: "in" | "out"
) {
  const n = nodes.find((item) => item.id === nodeId);
  if (!n) return { x: 0, y: 0 };

  const ports = side === "out" ? n.outputs : n.inputs;
  const idx = ports.findIndex((p) => p.id === portId);
  if (idx < 0) return { x: 0, y: 0 };

  return {
    x: side === "out" ? n.x + NW : n.x,
    y: n.y + PY0 + idx * PS,
  };
}

function bezierPath(x1: number, y1: number, x2: number, y2: number) {
  const cp = Math.max(60, Math.abs(x2 - x1) * 0.38);
  return `M${x1},${y1} C${x1 + cp},${y1} ${x2 - cp},${y2} ${x2},${y2}`;
}

// ─────────────────────────────────────────────────────────────
// SVG COMPONENTS
// ─────────────────────────────────────────────────────────────
function WireEl({ wire, nodes }: { wire: Wire; nodes: Node[] }) {
  const [fromNode, fromPort] = wire.from.split(".");
  const [toNode, toPort] = wire.to.split(".");

  const a = getPortPos(nodes, fromNode, fromPort, "out");
  const b = getPortPos(nodes, toNode, toPort, "in");
  const c = TC[wire.type].wire;
  const d = bezierPath(a.x, a.y, b.x, b.y);

  return (
    <g>
      {/* Soft glow behind the wire */}
      <path d={d} fill="none" stroke={c} strokeWidth={3.5} opacity={0.09} />
      {/* Main wire — solid for primary path, dashed for fallback */}
      <path
        d={d}
        fill="none"
        stroke={c}
        strokeWidth={1.7}
        opacity={wire.dashed ? 0.38 : 0.72}
        strokeDasharray={wire.dashed ? "7 5" : "none"}
      />
      {/* Animated flow dot (primary path only) */}
      {!wire.dashed && (
        <circle r={2.1} fill={c} opacity={0.85}>
          <animateMotion dur="3.4s" repeatCount="indefinite" path={d} />
        </circle>
      )}
    </g>
  );
}

function PortEl({
  x,
  y,
  type,
  label,
  side,
}: {
  x: number;
  y: number;
  type: keyof typeof TC;
  label: string;
  side: "in" | "out";
}) {
  const c = TC[type].port;

  return (
    <g>
      <circle cx={x} cy={y} r={PR} fill="#171728" stroke={c} strokeWidth={1.8} />
      <circle cx={x} cy={y} r={2.5} fill={c} opacity={0.5} />
      <text
        x={side === "in" ? x + 12 : x - 12}
        y={y + 3.5}
        fill="#8b8fa3"
        fontSize={9}
        fontFamily="'JetBrains Mono', monospace"
        textAnchor={side === "in" ? "start" : "end"}
        style={{ userSelect: "none" }}
      >
        {label}
      </text>
    </g>
  );
}

function NodeEl({ node }: { node: Node }) {
  const h = nodeHeight(node);
  const e = ENG[node.engine];

  return (
    <g transform={`translate(${node.x},${node.y})`}>
      {/* Drop shadow */}
      <rect x={2} y={2} width={NW} height={h} rx={9} fill="rgba(0,0,0,0.26)" />
      {/* Node body */}
      <rect width={NW} height={h} rx={9} fill="#181830" stroke="#282848" strokeWidth={1} />
      {/* Engine accent bar (top edge) */}
      <rect width={NW} height={3.5} rx={9} ry={9} fill={e.accent} />
      <rect y={1.5} width={NW} height={2} fill={e.accent} />
      {/* Header background tint */}
      <rect x={0.5} y={3.5} width={NW - 1} height={HH - 4} fill="rgba(255,255,255,0.02)" />

      {/* Engine badge */}
      <rect x={8} y={10} width={e.label.length * 7 + 20} height={16} rx={4} fill={e.badge} />
      <text
        x={17}
        y={21}
        fill={e.badgeText}
        fontSize={9}
        fontWeight={700}
        fontFamily="'JetBrains Mono', monospace"
        style={{ userSelect: "none" }}
      >
        {e.icon} {e.label}
      </text>

      {/* Category tag (INPUT / UTILITY / MODEL) */}
      {node.cat === "input" && (
        <>
          <rect x={NW - 48} y={10} width={40} height={16} rx={4} fill="rgba(255,255,255,0.05)" />
          <text x={NW - 28} y={21} fill="#5b5f73" fontSize={8} fontWeight={700}
                textAnchor="middle" fontFamily="monospace" style={{ userSelect: "none" }}>INPUT</text>
        </>
      )}
      {node.cat === "utility" && (
        <>
          <rect x={NW - 58} y={10} width={50} height={16} rx={4} fill="rgba(147,51,234,0.11)" />
          <text x={NW - 33} y={21} fill="#c084fc" fontSize={8} fontWeight={700}
                textAnchor="middle" fontFamily="monospace" style={{ userSelect: "none" }}>UTILITY</text>
        </>
      )}
      {node.cat === "model" && (
        <>
          <rect x={NW - 52} y={10} width={44} height={16} rx={4} fill="rgba(34,197,94,0.08)" />
          <text x={NW - 30} y={21} fill="#4ade80" fontSize={8} fontWeight={700}
                textAnchor="middle" fontFamily="monospace" style={{ userSelect: "none" }}>MODEL</text>
        </>
      )}

      {/* Node title */}
      <text x={9} y={42} fill="#e5e7eb" fontSize={11.5} fontWeight={700}
            fontFamily="'Inter', system-ui, sans-serif" style={{ userSelect: "none" }}>{node.title}</text>

      {/* Subtitle */}
      <text x={9} y={56} fill="#7b8097" fontSize={8.5} fontWeight={500}
            fontFamily="'Inter', system-ui, sans-serif" style={{ userSelect: "none" }}>{node.sub}</text>

      {/* Info line (bottom of node — carries the Runway best-practice note) */}
      {node.info && (
        <text x={9} y={h - 6} fill="#49506a" fontSize={7.4}
              fontFamily="'JetBrains Mono', monospace" style={{ userSelect: "none" }}>{node.info}</text>
      )}

      {/* Input ports (left side) */}
      {node.inputs.map((p, i) => (
        <PortEl key={`in-${node.id}-${p.id}`} x={0} y={PY0 + i * PS}
                type={p.type as keyof typeof TC} label={p.label} side="in" />
      ))}

      {/* Output ports (right side) */}
      {node.outputs.map((p, i) => (
        <PortEl key={`out-${node.id}-${p.id}`} x={NW} y={PY0 + i * PS}
                type={p.type as keyof typeof TC} label={p.label} side="out" />
      ))}
    </g>
  );
}

// ─────────────────────────────────────────────────────────────
// LEGEND — updated with Runway official notes
// ─────────────────────────────────────────────────────────────
function LegendEl({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect width={710} height={116} rx={8} fill="#12122a" stroke="#282848" strokeWidth={0.8} />

      {/* Row 1: Content types */}
      <text x={12} y={18} fill="#7b7f96" fontSize={9} fontWeight={700}
            fontFamily="'Inter', sans-serif" style={{ userSelect: "none" }}>CONTENT TYPES (Official Runway)</text>
      {(
        [
          ["text", "Text (Orange)"],
          ["image", "Image (Blue)"],
          ["audio", "Audio (Yellow)"],
          ["video", "Video (Green)"],
        ] as const
      ).map(([t, l], i) => (
        <g key={t} transform={`translate(${12 + i * 100},28)`}>
          <circle cx={5} cy={6} r={4} fill={TC[t].port} />
          <text x={14} y={10} fill="#a0a4b8" fontSize={8.5}
                fontFamily="'JetBrains Mono', monospace" style={{ userSelect: "none" }}>{l}</text>
        </g>
      ))}

      <line x1={12} y1={46} x2={698} y2={46} stroke="#282848" strokeWidth={0.4} />

      {/* Row 2: Wire logic */}
      <text x={12} y={62} fill="#7b7f96" fontSize={9} fontWeight={700}
            fontFamily="'Inter', sans-serif" style={{ userSelect: "none" }}>WIRE LOGIC</text>
      {[
        "Solid = main production path",
        "Dashed = fallback option only",
        "Dots = data flow direction",
      ].map((item, i) => (
        <text key={item} x={12 + i * 195} y={78} fill="#a0a4b8" fontSize={7.2}
              fontFamily="'JetBrains Mono', monospace" style={{ userSelect: "none" }}>{item}</text>
      ))}

      <line x1={12} y1={88} x2={698} y2={88} stroke="#282848" strokeWidth={0.4} />

      {/* Row 3: Key Runway rules */}
      <text x={12} y={104} fill="#7b7f96" fontSize={9} fontWeight={700}
            fontFamily="'Inter', sans-serif" style={{ userSelect: "none" }}>KEY RULES</text>
      {[
        "Gen-4.5 I2V = motion-only prompt",
        "No negative prompts in Runway",
        "Extract Frame > Last Frame",
        "Fixed Seed for retries",
      ].map((item, i) => (
        <text key={item} x={12 + i * 175} y={114} fill="#a0a4b8" fontSize={6.8}
              fontFamily="'JetBrains Mono', monospace" style={{ userSelect: "none" }}>{item}</text>
      ))}
    </g>
  );
}

// ═════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════
export default function WSTVWorkflowDiagram({
  data: _data,
  onCopy: _onCopy,
}: {
  data?: GeneratedPackage;
  onCopy?: (t: string) => void;
}) {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.46);
  const [drag, setDrag] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isOpen, setIsOpen] = useState(true);

  const nodes = useMemo(() => buildNodes(), []);

  const onWheel = useCallback((e: ReactWheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    setZoom((z) => Math.min(2.5, Math.max(0.2, z + (e.deltaY > 0 ? -0.05 : 0.05))));
  }, []);

  const onMouseDown = useCallback(
    (e: ReactMouseEvent<SVGSVGElement>) => {
      if (e.button !== 0) return;
      setDrag(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setPanStart({ ...pan });
    },
    [pan]
  );

  const onMouseMove = useCallback(
    (e: ReactMouseEvent<SVGSVGElement>) => {
      if (!drag) return;
      setPan({
        x: panStart.x + (e.clientX - dragStart.x),
        y: panStart.y + (e.clientY - dragStart.y),
      });
    },
    [drag, dragStart, panStart]
  );

  const onMouseUp = useCallback(() => setDrag(false), []);

  const onTouchStart = useCallback(
    (e: ReactTouchEvent<SVGSVGElement>) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      setDrag(true);
      setDragStart({ x: t.clientX, y: t.clientY });
      setPanStart({ ...pan });
    },
    [pan]
  );

  const onTouchMove = useCallback(
    (e: ReactTouchEvent<SVGSVGElement>) => {
      if (!drag || e.touches.length !== 1) return;
      const t = e.touches[0];
      setPan({
        x: panStart.x + (t.clientX - dragStart.x),
        y: panStart.y + (t.clientY - dragStart.y),
      });
    },
    [drag, dragStart, panStart]
  );

  const reset = () => {
    setPan({ x: 0, y: 0 });
    setZoom(0.46);
  };

  /* Pipeline flow summary badges */
  const flowBadges = [
    { l: "Text", c: "#f59e0b" },
    { l: "→", c: "#3e4258" },
    { l: "Claude", c: "#f97316" },
    { l: "→", c: "#3e4258" },
    { l: "JSON Parse", c: "#16a34a" },
    { l: "→", c: "#3e4258" },
    { l: "NB2", c: "#16a34a" },
    { l: "→", c: "#3e4258" },
    { l: "Gen-4.5 S1", c: "#16a34a" },
    { l: "→", c: "#3e4258" },
    { l: "Extract", c: "#16a34a" },
    { l: "→", c: "#3e4258" },
    { l: "Kling S2", c: "#2563eb" },
    { l: "→", c: "#3e4258" },
    { l: "Extract", c: "#16a34a" },
    { l: "→", c: "#3e4258" },
    { l: "Gen-4.5 S3", c: "#16a34a" },
    { l: "→", c: "#3e4258" },
    { l: "Stitch", c: "#16a34a" },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-700 bg-[#0b0b1a] shadow-lg">
      {/* ── Header toggle bar ──────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1e1e38] px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-green-600 to-blue-600 text-xs font-extrabold text-white">
            W
          </div>
          <span className="text-sm font-bold text-gray-200">
            WSTV Pipeline — Runway-Aligned Node Graph
          </span>
          <span className="rounded bg-[rgba(255,255,255,0.05)] px-2 py-0.5 text-[9px] font-semibold text-gray-500">
            Extract Frame first · Last Frame fallback · Motion-only I2V
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((o) => !o)}
          className="rounded-lg border border-[#282848] bg-[rgba(255,255,255,0.05)] px-3 py-1.5 text-xs font-semibold text-gray-400 hover:bg-[rgba(255,255,255,0.08)] active:scale-95"
        >
          {isOpen ? "Hide Diagram ▲" : "Show Node Graph ▼"}
        </button>
      </div>

      {/* ── Diagram canvas ─────────────────────────────────── */}
      {isOpen && (
        <div className="relative" style={{ height: 620, cursor: drag ? "grabbing" : "grab" }}>
          {/* Zoom controls (top-right) */}
          <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-lg border border-[#282848] bg-[rgba(11,11,26,0.9)] px-2 py-1.5 backdrop-blur-sm">
            <span className="text-[9px] text-gray-500" style={{ fontFamily: "monospace" }}>
              {Math.round(zoom * 100)}%
            </span>
            <button type="button" onClick={() => setZoom((z) => Math.max(0.2, z - 0.1))}
              className="flex h-6 w-6 items-center justify-center rounded border border-[#282848] bg-[rgba(255,255,255,0.05)] text-sm font-bold text-gray-400">−</button>
            <button type="button" onClick={() => setZoom((z) => Math.min(2.5, z + 0.1))}
              className="flex h-6 w-6 items-center justify-center rounded border border-[#282848] bg-[rgba(255,255,255,0.05)] text-sm font-bold text-gray-400">+</button>
            <button type="button" onClick={reset}
              className="rounded border border-[#282848] bg-[rgba(255,255,255,0.05)] px-2 py-0.5 text-[9px] font-semibold text-gray-400">Reset</button>
          </div>

          {/* Navigation hint (top-left) */}
          <div
            className="absolute left-3 top-3 z-10 rounded-lg border border-[#1e1e38] bg-[rgba(11,11,26,0.88)] px-3 py-2 text-[9px] text-gray-600 backdrop-blur-sm"
            style={{ fontFamily: "monospace", lineHeight: 1.6 }}
          >
            Drag to pan · Scroll to zoom
            <br />
            Solid wire = main path · Dashed = fallback only
          </div>

          {/* Pipeline flow bar (bottom-center) */}
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-lg border border-[#1e1e38] bg-[rgba(11,11,26,0.92)] px-3 py-1.5 backdrop-blur-sm">
            {flowBadges.map((s, i) => (
              <span
                key={i}
                className="text-[9px]"
                style={{
                  color: s.c,
                  fontFamily: "monospace",
                  fontWeight: s.l === "→" ? 400 : 700,
                }}
              >
                {s.l}
              </span>
            ))}
          </div>

          {/* SVG canvas */}
          <svg
            width="100%"
            height="100%"
            onWheel={onWheel}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onMouseUp}
          >
            <defs>
              <pattern id="wstv-sg" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M20 0L0 0 0 20" fill="none" stroke="#151530" strokeWidth="0.4" />
              </pattern>
              <pattern id="wstv-g" width="100" height="100" patternUnits="userSpaceOnUse">
                <rect width="100" height="100" fill="url(#wstv-sg)" />
                <path d="M100 0L0 0 0 100" fill="none" stroke="#1a1a35" strokeWidth="0.6" />
              </pattern>
            </defs>

            <rect width="7000" height="5000" x="-3500" y="-2500" fill="url(#wstv-g)" />

            <g transform={`translate(${pan.x + 20},${pan.y + 18}) scale(${zoom})`}>
              {WIRES.map((wire, i) => (
                <WireEl key={i} wire={wire} nodes={nodes} />
              ))}
              {nodes.map((node) => (
                <NodeEl key={node.id} node={node} />
              ))}
              <LegendEl x={1120} y={620} />
            </g>
          </svg>
        </div>
      )}
    </div>
  );
}
