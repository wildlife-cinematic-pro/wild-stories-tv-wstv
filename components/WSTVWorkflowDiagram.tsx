"use client";

// ─────────────────────────────────────────────────────────────
// components/WSTVWorkflowDiagram.tsx
// WSTV — Runway-Style Node-Based Workflow Diagram
//
// Visual grammar matches official Runway Workflows:
//   • Content-type color coding: Text=orange, Image=blue, Audio=yellow, Video=green
//   • Node-based editor feel with typed ports + bezier wires
//   • Left-to-right data flow (inputs→processing→output)
//   • Zoom / pan / drag navigation
//
// Engine distinction:
//   • Green accent bar = Runway-native node
//   • Blue accent bar  = Kling (WSTV action workflow)
//   • Purple accent bar = WSTV Custom (not pretending to be Runway)
//
// Negative prompt is wired ONLY to Kling — NOT to Runway (official: not supported).
// ─────────────────────────────────────────────────────────────

import { useCallback, useMemo, useRef, useState } from "react";
import type { GeneratedPackage } from "@/types";

// ─── Content Type Colors (Official Runway Workflows) ─────────
const TYPE_COLORS: Record<string, { port: string; wire: string; label: string }> = {
  text:  { port: "#f59e0b", wire: "#f59e0b", label: "Text" },
  image: { port: "#3b82f6", wire: "#3b82f6", label: "Image" },
  audio: { port: "#eab308", wire: "#eab308", label: "Audio" },
  video: { port: "#22c55e", wire: "#22c55e", label: "Video" },
};

// ─── Engine Visual Styles ────────────────────────────────────
const ENGINE_STYLES: Record<string, { accent: string; badge: string; badgeText: string; label: string; icon: string }> = {
  runway: { accent: "#16a34a", badge: "#166534", badgeText: "#bbf7d0", label: "Runway",      icon: "▶" },
  kling:  { accent: "#2563eb", badge: "#1e3a5f", badgeText: "#93c5fd", label: "Kling",       icon: "◆" },
  wstv:   { accent: "#9333ea", badge: "#3b1764", badgeText: "#d8b4fe", label: "WSTV Custom", icon: "★" },
};

// ─── Layout Constants ────────────────────────────────────────
const NODE_W = 252;
const PORT_R = 6;
const PORT_SPACING = 28;
const HEADER_H = 42;
const PORT_START_Y = HEADER_H + 18;

type PortDef = { id: string; type: string; label: string };
type NodeDef = {
  id: string; x: number; y: number;
  title: string; subtitle: string;
  engine: string; category: string;
  info: string;
  inputs: PortDef[]; outputs: PortDef[];
};
type WireDef = { from: string; to: string; type: string; dashed?: boolean };

function nodeHeight(n: NodeDef): number {
  const portCount = Math.max(n.inputs.length, n.outputs.length);
  return PORT_START_Y + portCount * PORT_SPACING + 18;
}

// ─── Build Node Definitions ──────────────────────────────────
function buildNodes(): NodeDef[] {
  return [
    // Column 0 — Input Nodes
    { id: "img_prompt", x: 40, y: 30, title: "Image Prompt", subtitle: "Text Input", engine: "wstv", category: "input", info: "Step 1 — Master Still identity anchor", inputs: [], outputs: [{ id: "text", type: "text", label: "Prompt" }] },
    { id: "shot1_prompt", x: 40, y: 190, title: "Shot 1 Motion Prompt", subtitle: "Text Input — Motion Only", engine: "runway", category: "input", info: "Runway I2V: motion, camera, physics only", inputs: [], outputs: [{ id: "text", type: "text", label: "Motion" }] },
    { id: "char_lock", x: 40, y: 350, title: "Character Lock", subtitle: "Identity Preservation (T5)", engine: "runway", category: "input", info: "Step 5 — Locks subject identity across clips", inputs: [], outputs: [{ id: "text", type: "text", label: "Identity" }] },
    { id: "shot2_prompt", x: 40, y: 510, title: "Shot 2 Action Prompt", subtitle: "Text Input — Director Narrative", engine: "kling", category: "input", info: "Kling paste-ready director-style prompt", inputs: [], outputs: [{ id: "text", type: "text", label: "Action" }] },
    { id: "neg_prompt", x: 40, y: 670, title: "Negative Prompt", subtitle: "Kling / Image Models Only", engine: "kling", category: "input", info: "Step 6 — NOT supported in Runway Gen-4.5", inputs: [], outputs: [{ id: "text", type: "text", label: "Negative" }] },
    { id: "shot3_prompt", x: 40, y: 830, title: "Shot 3 Motion Prompt", subtitle: "Text Input — Motion Only", engine: "runway", category: "input", info: "Runway I2V: motion, camera, physics only", inputs: [], outputs: [{ id: "text", type: "text", label: "Motion" }] },

    // Column 1 — Image Generation
    { id: "nb2_gen", x: 380, y: 30, title: "NB2 / Flux / MJ", subtitle: "Master Still Generator", engine: "wstv", category: "model", info: "Generates the identity-anchor reference image", inputs: [{ id: "prompt", type: "text", label: "Prompt *" }], outputs: [{ id: "image", type: "image", label: "Master Still" }] },

    // Column 2 — Video Generation
    { id: "runway_s1", x: 720, y: 100, title: "Runway Gen-4.5 I2V", subtitle: "Shot 1 — Opening Tension", engine: "runway", category: "model", info: "5–10s · 24/25fps · 720p · No negative prompt", inputs: [{ id: "ref", type: "image", label: "Reference *" }, { id: "prompt", type: "text", label: "Motion *" }, { id: "identity", type: "text", label: "Char Lock" }], outputs: [{ id: "video", type: "video", label: "Video" }, { id: "last_frame", type: "image", label: "Last Frame" }] },
    { id: "kling_s2", x: 720, y: 400, title: "Kling 3.0 Pro", subtitle: "Shot 2 — Action Pressure", engine: "kling", category: "model", info: "3–15s · 4K/60fps · Bind Subject · Neg OK", inputs: [{ id: "ref", type: "image", label: "Reference *" }, { id: "prompt", type: "text", label: "Action *" }, { id: "negative", type: "text", label: "Negative" }, { id: "identity", type: "text", label: "Bind Subj" }], outputs: [{ id: "video", type: "video", label: "Video" }, { id: "audio", type: "audio", label: "Native Audio" }, { id: "last_frame", type: "image", label: "Last Frame" }] },
    { id: "runway_s3", x: 720, y: 750, title: "Runway Gen-4.5 I2V", subtitle: "Shot 3 — Resolved Tension", engine: "runway", category: "model", info: "5–10s · 24/25fps · 720p · No negative prompt", inputs: [{ id: "ref", type: "image", label: "Reference *" }, { id: "prompt", type: "text", label: "Motion *" }, { id: "identity", type: "text", label: "Char Lock" }], outputs: [{ id: "video", type: "video", label: "Video" }] },

    // Handoff Decision Nodes (WSTV custom — not a real Runway node)
    { id: "handoff_1", x: 540, y: 260, title: "Handoff Check", subtitle: "WSTV Continuity Gate", engine: "wstv", category: "utility", info: "Clean full-body frame? → use it. Otherwise → master still.", inputs: [{ id: "last_frame", type: "image", label: "Last Frame" }, { id: "master", type: "image", label: "Master Still" }], outputs: [{ id: "clean_ref", type: "image", label: "Clean Ref" }] },
    { id: "handoff_2", x: 540, y: 610, title: "Handoff Check", subtitle: "WSTV Continuity Gate", engine: "wstv", category: "utility", info: "Clean full-body frame? → use it. Otherwise → master still.", inputs: [{ id: "last_frame", type: "image", label: "Last Frame" }, { id: "master", type: "image", label: "Master Still" }], outputs: [{ id: "clean_ref", type: "image", label: "Clean Ref" }] },

    // Column 3 — Final Assembly
    { id: "capcut", x: 1080, y: 370, title: "CapCut Stitch", subtitle: "Final Assembly → Export", engine: "wstv", category: "utility", info: "9:16 vertical · audio on · safe zone text", inputs: [{ id: "v1", type: "video", label: "Shot 1 *" }, { id: "v2", type: "video", label: "Shot 2 *" }, { id: "a2", type: "audio", label: "Audio" }, { id: "v3", type: "video", label: "Shot 3 *" }], outputs: [{ id: "reel", type: "video", label: "Final Reel" }] },
  ];
}

// ─── Wire Definitions ────────────────────────────────────────
const WIRES: WireDef[] = [
  { from: "img_prompt.text", to: "nb2_gen.prompt", type: "text" },
  { from: "nb2_gen.image", to: "runway_s1.ref", type: "image" },
  { from: "nb2_gen.image", to: "handoff_1.master", type: "image" },
  { from: "nb2_gen.image", to: "handoff_2.master", type: "image" },
  { from: "runway_s1.last_frame", to: "handoff_1.last_frame", type: "image", dashed: true },
  { from: "handoff_1.clean_ref", to: "kling_s2.ref", type: "image" },
  { from: "kling_s2.last_frame", to: "handoff_2.last_frame", type: "image", dashed: true },
  { from: "handoff_2.clean_ref", to: "runway_s3.ref", type: "image" },
  { from: "shot1_prompt.text", to: "runway_s1.prompt", type: "text" },
  { from: "shot2_prompt.text", to: "kling_s2.prompt", type: "text" },
  { from: "shot3_prompt.text", to: "runway_s3.prompt", type: "text" },
  { from: "char_lock.text", to: "runway_s1.identity", type: "text" },
  { from: "char_lock.text", to: "kling_s2.identity", type: "text" },
  { from: "char_lock.text", to: "runway_s3.identity", type: "text" },
  { from: "neg_prompt.text", to: "kling_s2.negative", type: "text" },
  { from: "runway_s1.video", to: "capcut.v1", type: "video" },
  { from: "kling_s2.video", to: "capcut.v2", type: "video" },
  { from: "kling_s2.audio", to: "capcut.a2", type: "audio" },
  { from: "runway_s3.video", to: "capcut.v3", type: "video" },
];

// ─── Helpers ─────────────────────────────────────────────────
function getPortPos(nodes: NodeDef[], nodeId: string, portId: string, side: "input" | "output") {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return { x: 0, y: 0 };
  const ports = side === "output" ? node.outputs : node.inputs;
  const idx = ports.findIndex((p) => p.id === portId);
  if (idx < 0) return { x: 0, y: 0 };
  return {
    x: side === "output" ? node.x + NODE_W : node.x,
    y: node.y + PORT_START_Y + idx * PORT_SPACING,
  };
}

function bezierPath(x1: number, y1: number, x2: number, y2: number) {
  const cpOffset = Math.max(60, Math.abs(x2 - x1) * 0.45);
  return `M ${x1} ${y1} C ${x1 + cpOffset} ${y1}, ${x2 - cpOffset} ${y2}, ${x2} ${y2}`;
}

// ─── Wire SVG ────────────────────────────────────────────────
function WireSVG({ wire, nodes }: { wire: WireDef; nodes: NodeDef[] }) {
  const [fromNode, fromPort] = wire.from.split(".");
  const [toNode, toPort] = wire.to.split(".");
  const from = getPortPos(nodes, fromNode, fromPort, "output");
  const to = getPortPos(nodes, toNode, toPort, "input");
  const color = TYPE_COLORS[wire.type]?.wire || "#555";
  const d = bezierPath(from.x, from.y, to.x, to.y);

  return (
    <g>
      <path d={d} fill="none" stroke={color} strokeWidth={4} opacity={0.1} />
      <path d={d} fill="none" stroke={color} strokeWidth={1.8} opacity={wire.dashed ? 0.4 : 0.65} strokeDasharray={wire.dashed ? "6 4" : "none"} />
      {!wire.dashed && (
        <circle r={2.5} fill={color} opacity={0.85}>
          <animateMotion dur="3s" repeatCount="indefinite" path={d} />
        </circle>
      )}
    </g>
  );
}

// ─── Port SVG ────────────────────────────────────────────────
function PortSVG({ x, y, type, label, side }: { x: number; y: number; type: string; label: string; side: "input" | "output" }) {
  const color = TYPE_COLORS[type]?.port || "#888";
  return (
    <g>
      <circle cx={x} cy={y} r={PORT_R} fill="#1a1a2e" stroke={color} strokeWidth={2} />
      <circle cx={x} cy={y} r={3} fill={color} opacity={0.55} />
      <text
        x={side === "input" ? x + 14 : x - 14}
        y={y + 4}
        fill="#9ca3af"
        fontSize={10}
        fontFamily="'JetBrains Mono', 'SF Mono', 'Fira Code', monospace"
        textAnchor={side === "input" ? "start" : "end"}
        style={{ userSelect: "none" }}
      >
        {label}
      </text>
    </g>
  );
}

// ─── Node SVG ────────────────────────────────────────────────
function NodeSVG({ node }: { node: NodeDef }) {
  const h = nodeHeight(node);
  const es = ENGINE_STYLES[node.engine] || ENGINE_STYLES.wstv;
  const isInput = node.category === "input";
  const isUtility = node.category === "utility";

  return (
    <g transform={`translate(${node.x}, ${node.y})`}>
      <rect x={3} y={3} width={NODE_W} height={h} rx={10} fill="rgba(0,0,0,0.3)" />
      <rect x={0} y={0} width={NODE_W} height={h} rx={10} fill="#1c1c2e" stroke="#2d2d44" strokeWidth={1.2} />
      <rect x={0} y={0} width={NODE_W} height={4} rx={10} ry={10} fill={es.accent} />
      <rect x={0} y={2} width={NODE_W} height={2} fill={es.accent} />
      <rect x={1} y={4} width={NODE_W - 2} height={HEADER_H - 4} fill="rgba(255,255,255,0.03)" />

      {/* Engine badge */}
      <rect x={8} y={10} width={es.label.length * 7.5 + 20} height={18} rx={4} fill={es.badge} />
      <text x={18} y={23} fill={es.badgeText} fontSize={10} fontWeight={700} fontFamily="'JetBrains Mono', monospace" style={{ userSelect: "none" }}>
        {es.icon} {es.label}
      </text>

      {/* Category tag */}
      {isInput && (
        <>
          <rect x={NODE_W - 52} y={10} width={44} height={18} rx={4} fill="rgba(255,255,255,0.06)" />
          <text x={NODE_W - 30} y={23} fill="#6b7280" fontSize={9} fontWeight={600} textAnchor="middle" fontFamily="monospace" style={{ userSelect: "none" }}>INPUT</text>
        </>
      )}
      {isUtility && (
        <>
          <rect x={NODE_W - 62} y={10} width={54} height={18} rx={4} fill="rgba(147,51,234,0.15)" />
          <text x={NODE_W - 35} y={23} fill="#a855f7" fontSize={9} fontWeight={600} textAnchor="middle" fontFamily="monospace" style={{ userSelect: "none" }}>UTILITY</text>
        </>
      )}

      {/* Title */}
      <text x={10} y={HEADER_H + 2} fill="#e5e7eb" fontSize={12} fontWeight={700} fontFamily="'Inter', system-ui, sans-serif" style={{ userSelect: "none" }}>
        {node.title}
      </text>

      {/* Info */}
      {node.info && (
        <text x={10} y={h - 6} fill="#4b5563" fontSize={8.5} fontFamily="monospace" style={{ userSelect: "none" }}>
          {node.info}
        </text>
      )}

      {/* Ports */}
      {node.inputs.map((port, i) => (
        <PortSVG key={`in-${port.id}`} x={0} y={PORT_START_Y + i * PORT_SPACING} type={port.type} label={port.label} side="input" />
      ))}
      {node.outputs.map((port, i) => (
        <PortSVG key={`out-${port.id}`} x={NODE_W} y={PORT_START_Y + i * PORT_SPACING} type={port.type} label={port.label} side="output" />
      ))}
    </g>
  );
}

// ─── Legend SVG ───────────────────────────────────────────────
function LegendSVG({ x, y }: { x: number; y: number }) {
  const types = [
    { type: "text", label: "Text" },
    { type: "image", label: "Image" },
    { type: "audio", label: "Audio" },
    { type: "video", label: "Video" },
  ];
  const engines = [
    { key: "runway", label: "Runway Native" },
    { key: "kling", label: "Kling (WSTV)" },
    { key: "wstv", label: "WSTV Custom" },
  ];

  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x={0} y={0} width={290} height={170} rx={10} fill="#13132a" stroke="#2d2d44" strokeWidth={1} />
      <text x={12} y={22} fill="#9ca3af" fontSize={11} fontWeight={700} fontFamily="'Inter', sans-serif" style={{ userSelect: "none" }}>LEGEND — Content Types</text>
      {types.map((t, i) => (
        <g key={t.type} transform={`translate(${14 + i * 68}, 34)`}>
          <circle cx={6} cy={8} r={5} fill={TYPE_COLORS[t.type].port} />
          <text x={16} y={12} fill="#d1d5db" fontSize={10} fontFamily="monospace" style={{ userSelect: "none" }}>{t.label}</text>
        </g>
      ))}
      <line x1={12} y1={56} x2={278} y2={56} stroke="#2d2d44" strokeWidth={0.5} />
      <text x={12} y={74} fill="#9ca3af" fontSize={11} fontWeight={700} fontFamily="'Inter', sans-serif" style={{ userSelect: "none" }}>LEGEND — Engine Types</text>
      {engines.map((e, i) => (
        <g key={e.key} transform={`translate(14, ${86 + i * 24})`}>
          <rect x={0} y={-3} width={10} height={10} rx={2} fill={ENGINE_STYLES[e.key].accent} />
          <text x={16} y={6} fill="#d1d5db" fontSize={10} fontFamily="monospace" style={{ userSelect: "none" }}>{e.label}</text>
        </g>
      ))}
      <line x1={12} y1={154} x2={278} y2={154} stroke="#2d2d44" strokeWidth={0.5} />
      <text x={12} y={166} fill="#4b5563" fontSize={8} fontFamily="monospace" style={{ userSelect: "none" }}>╌╌ Dashed wire = conditional handoff (clean frame only)</text>
    </g>
  );
}

// ═════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════
export default function WSTVWorkflowDiagram({
  data,
  onCopy,
}: {
  data?: GeneratedPackage;
  onCopy?: (text: string) => void;
}) {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.72);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isOpen, setIsOpen] = useState(false);

  const nodes = useMemo(() => buildNodes(), []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.min(2, Math.max(0.25, z + (e.deltaY > 0 ? -0.06 : 0.06))));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setPanStart({ ...pan });
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    setPan({ x: panStart.x + (e.clientX - dragStart.x), y: panStart.y + (e.clientY - dragStart.y) });
  }, [dragging, dragStart, panStart]);

  const handleMouseUp = useCallback(() => setDragging(false), []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    setDragging(true);
    setDragStart({ x: t.clientX, y: t.clientY });
    setPanStart({ ...pan });
  }, [pan]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging || e.touches.length !== 1) return;
    const t = e.touches[0];
    setPan({ x: panStart.x + (t.clientX - dragStart.x), y: panStart.y + (t.clientY - dragStart.y) });
  }, [dragging, dragStart, panStart]);

  const zoomIn = () => setZoom((z) => Math.min(2, z + 0.15));
  const zoomOut = () => setZoom((z) => Math.max(0.25, z - 0.15));
  const resetView = () => { setPan({ x: 0, y: 0 }); setZoom(0.72); };

  return (
    <div className="rounded-2xl border border-gray-700 bg-[#0d0d1a] shadow-lg overflow-hidden">
      {/* ── Toggle Header ──────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1f1f35] px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-green-600 to-purple-600 text-xs font-extrabold text-white">
            W
          </div>
          <span className="text-sm font-bold text-gray-200">WSTV Prompt Workflow</span>
          <span className="rounded bg-[rgba(255,255,255,0.06)] px-2 py-0.5 text-[10px] font-semibold text-gray-500">
            3-Shot Hybrid Pipeline
          </span>
          <span className="rounded bg-[rgba(22,163,106,0.12)] px-2 py-0.5 text-[10px] font-bold text-green-400">
            Runway → Kling → Runway
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((o) => !o)}
          className="rounded-lg border border-[#2d2d44] bg-[rgba(255,255,255,0.06)] px-3 py-1.5 text-xs font-semibold text-gray-400 hover:bg-[rgba(255,255,255,0.1)] active:scale-95"
        >
          {isOpen ? "Hide Diagram ▲" : "Show Node Graph ▼"}
        </button>
      </div>

      {/* ── Diagram Canvas ─────────────────────────────────── */}
      {isOpen && (
        <div className="relative" style={{ height: 600, cursor: dragging ? "grabbing" : "grab" }}>
          {/* Zoom controls */}
          <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-lg border border-[#2d2d44] bg-[rgba(13,13,26,0.9)] px-2 py-1.5 backdrop-blur-sm">
            <span className="text-[10px] text-gray-500" style={{ fontFamily: "monospace" }}>
              {Math.round(zoom * 100)}%
            </span>
            <button type="button" onClick={zoomOut} className="flex h-6 w-6 items-center justify-center rounded border border-[#2d2d44] bg-[rgba(255,255,255,0.06)] text-sm font-bold text-gray-400 hover:bg-[rgba(255,255,255,0.1)]">−</button>
            <button type="button" onClick={zoomIn} className="flex h-6 w-6 items-center justify-center rounded border border-[#2d2d44] bg-[rgba(255,255,255,0.06)] text-sm font-bold text-gray-400 hover:bg-[rgba(255,255,255,0.1)]">+</button>
            <button type="button" onClick={resetView} className="rounded border border-[#2d2d44] bg-[rgba(255,255,255,0.06)] px-2 py-0.5 text-[10px] font-semibold text-gray-400 hover:bg-[rgba(255,255,255,0.1)]">Reset</button>
          </div>

          {/* Navigation hint */}
          <div className="absolute left-3 top-3 z-10 rounded-lg border border-[#1f1f35] bg-[rgba(13,13,26,0.85)] px-3 py-2 text-[10px] text-gray-500 backdrop-blur-sm" style={{ fontFamily: "monospace", lineHeight: 1.5 }}>
            Drag to pan · Scroll to zoom<br />
            Solid = direct · Dashed = conditional
          </div>

          {/* Pipeline flow bar */}
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-lg border border-[#1f1f35] bg-[rgba(13,13,26,0.9)] px-3 py-2 backdrop-blur-sm">
            {[
              { l: "Image Prompt", c: "#f59e0b" },
              { l: "→", c: "#4b5563" },
              { l: "Master Still", c: "#3b82f6" },
              { l: "→", c: "#4b5563" },
              { l: "Shot 1 (Runway)", c: "#16a34a" },
              { l: "→", c: "#4b5563" },
              { l: "Shot 2 (Kling)", c: "#2563eb" },
              { l: "→", c: "#4b5563" },
              { l: "Shot 3 (Runway)", c: "#16a34a" },
              { l: "→", c: "#4b5563" },
              { l: "CapCut", c: "#9333ea" },
            ].map((item, i) => (
              <span key={i} className="text-[10px] font-bold" style={{ color: item.c, fontFamily: "monospace", fontWeight: item.l === "→" ? 400 : 700 }}>
                {item.l}
              </span>
            ))}
          </div>

          {/* SVG */}
          <svg
            width="100%"
            height="100%"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          >
            <defs>
              <pattern id="wstv-smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1a1a30" strokeWidth="0.5" />
              </pattern>
              <pattern id="wstv-grid" width="100" height="100" patternUnits="userSpaceOnUse">
                <rect width="100" height="100" fill="url(#wstv-smallGrid)" />
                <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#1f1f38" strokeWidth="0.8" />
              </pattern>
            </defs>

            <rect width="5000" height="5000" x="-2500" y="-2500" fill="url(#wstv-grid)" />

            <g transform={`translate(${pan.x + 30}, ${pan.y + 20}) scale(${zoom})`}>
              {WIRES.map((w, i) => (
                <WireSVG key={i} wire={w} nodes={nodes} />
              ))}
              {nodes.map((node) => (
                <NodeSVG key={node.id} node={node} />
              ))}
              <LegendSVG x={1080} y={700} />
            </g>
          </svg>
        </div>
      )}
    </div>
  );
}
