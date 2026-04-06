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
// WSTV — Enhanced Runway-Style Node Graph
//
// Visual / logic intent:
// - Runway-style node UI grammar
// - Text = orange, Image = blue, Audio = yellow, Video = green
// - Shot flow = Scene → Gemini → JSON Parse → NB2/Ref Framing
//              → Shot 1 Runway + Shot 2 Kling + Shot 3 Runway
//              → CapCut
//
// Important:
// - This is a visual workflow graph inside your app
// - It is NOT the actual embedded official Runway editor
// - Negative prompt is wired ONLY to Kling
// ─────────────────────────────────────────────────────────────

const TC: Record<string, { port: string; wire: string }> = {
  text: { port: "#f59e0b", wire: "#f59e0b" },
  image: { port: "#3b82f6", wire: "#3b82f6" },
  audio: { port: "#eab308", wire: "#eab308" },
  video: { port: "#22c55e", wire: "#22c55e" },
};

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
  kling: {
    accent: "#2563eb",
    badge: "#1e3a5f",
    badgeText: "#93c5fd",
    label: "Kling",
    icon: "◆",
  },
  wstv: {
    accent: "#9333ea",
    badge: "#3b1764",
    badgeText: "#d8b4fe",
    label: "WSTV Custom",
    icon: "★",
  },
};

const NW = 240;
const PR = 5.5;
const PS = 26;
const HH = 40;
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
  engine: string;
  cat: "input" | "model" | "utility";
  info: string;
  inputs: Port[];
  outputs: Port[];
};

type Wire = {
  from: string;
  to: string;
  type: string;
  dashed?: boolean;
};

const nH = (n: Node) =>
  PY0 + Math.max(n.inputs.length, n.outputs.length) * PS + 16;

function buildNodes(): Node[] {
  return [
    {
      id: "scene_input",
      x: 30,
      y: 60,
      title: "Scene Description",
      sub: "Text Input",
      engine: "wstv",
      cat: "input",
      info: "Animal pair, arc, weather, environment",
      inputs: [],
      outputs: [{ id: "text", type: "text", label: "Scene" }],
    },
    {
      id: "sys_prompt",
      x: 30,
      y: 220,
      title: "System Prompt",
      sub: "Text Input — LLM Instructions",
      engine: "runway",
      cat: "input",
      info: "WSTV prompt-engineering rules for Gemini",
      inputs: [],
      outputs: [{ id: "text", type: "text", label: "Instructions" }],
    },

    {
      id: "gemini_llm",
      x: 320,
      y: 80,
      title: "Gemini Flash 2.5",
      sub: "LLM Node — Prompt Enhancement",
      engine: "runway",
      cat: "model",
      info: "Runway-style LLM step · returns structured JSON",
      inputs: [
        { id: "prompt", type: "text", label: "Scene *" },
        { id: "system", type: "text", label: "System" },
      ],
      outputs: [{ id: "json", type: "text", label: "JSON Output" }],
    },

    {
      id: "json_parse",
      x: 600,
      y: 30,
      title: "JSON Parse",
      sub: "Utility — Extract Fields",
      engine: "runway",
      cat: "utility",
      info: "JSONPath-style field extraction",
      inputs: [{ id: "json", type: "text", label: "JSON *" }],
      outputs: [
        { id: "img_prompt", type: "text", label: "$.img_prompt" },
        { id: "s1_motion", type: "text", label: "$.shot1_motion" },
        { id: "s2_action", type: "text", label: "$.shot2_action" },
        { id: "s3_motion", type: "text", label: "$.shot3_motion" },
        { id: "char_lock", type: "text", label: "$.char_lock" },
        { id: "negative", type: "text", label: "$.negative" },
      ],
    },

    {
      id: "nb2_gen",
      x: 900,
      y: 20,
      title: "NB2 / Flux / MJ",
      sub: "Master Still Generator",
      engine: "wstv",
      cat: "model",
      info: "Generates the identity-anchor hero image",
      inputs: [{ id: "prompt", type: "text", label: "Prompt *" }],
      outputs: [{ id: "image", type: "image", label: "Master Still" }],
    },
    {
      id: "combine_1",
      x: 900,
      y: 170,
      title: "Combine Text",
      sub: "Shot 1 — Identity + Motion",
      engine: "runway",
      cat: "utility",
      info: "Merge char lock + shot 1 motion prompt",
      inputs: [
        { id: "a", type: "text", label: "Char Lock" },
        { id: "b", type: "text", label: "S1 Motion" },
      ],
      outputs: [{ id: "combined", type: "text", label: "Combined" }],
    },
    {
      id: "combine_2",
      x: 900,
      y: 330,
      title: "Combine Text",
      sub: "Shot 2 — Identity + Action",
      engine: "runway",
      cat: "utility",
      info: "Merge char lock + shot 2 action prompt",
      inputs: [
        { id: "a", type: "text", label: "Char Lock" },
        { id: "b", type: "text", label: "S2 Action" },
      ],
      outputs: [{ id: "combined", type: "text", label: "Combined" }],
    },
    {
      id: "combine_3",
      x: 900,
      y: 490,
      title: "Combine Text",
      sub: "Shot 3 — Identity + Motion",
      engine: "runway",
      cat: "utility",
      info: "Merge char lock + shot 3 motion prompt",
      inputs: [
        { id: "a", type: "text", label: "Char Lock" },
        { id: "b", type: "text", label: "S3 Motion" },
      ],
      outputs: [{ id: "combined", type: "text", label: "Combined" }],
    },

    {
      id: "ref_split",
      x: 1180,
      y: 100,
      title: "Reference Framing",
      sub: "Master → 3 Shot-Specific Refs",
      engine: "wstv",
      cat: "utility",
      info: "Shot-specific framing from one master still",
      inputs: [{ id: "master", type: "image", label: "Master *" }],
      outputs: [
        { id: "ref1", type: "image", label: "Ref 1 — Open" },
        { id: "ref2", type: "image", label: "Ref 2 — Action" },
        { id: "ref3", type: "image", label: "Ref 3 — Resolve" },
      ],
    },

    {
      id: "runway_s1",
      x: 1470,
      y: 20,
      title: "Runway Gen-4.5 I2V",
      sub: "Shot 1 — Opening Tension",
      engine: "runway",
      cat: "model",
      info: "5–10s · 24/25fps · 720p · No negatives",
      inputs: [
        { id: "ref", type: "image", label: "Reference *" },
        { id: "prompt", type: "text", label: "Combined *" },
      ],
      outputs: [
        { id: "video", type: "video", label: "Video" },
        { id: "last_frame", type: "image", label: "Last Frame" },
      ],
    },
    {
      id: "kling_s2",
      x: 1470,
      y: 240,
      title: "Kling 3.0 Pro",
      sub: "Shot 2 — Action Pressure",
      engine: "kling",
      cat: "model",
      info: "3–15s · 4K/60fps · Bind Subject · Neg OK",
      inputs: [
        { id: "ref", type: "image", label: "Reference *" },
        { id: "prompt", type: "text", label: "Combined *" },
        { id: "negative", type: "text", label: "Negative" },
      ],
      outputs: [
        { id: "video", type: "video", label: "Video" },
        { id: "audio", type: "audio", label: "Native Audio" },
        { id: "last_frame", type: "image", label: "Last Frame" },
      ],
    },
    {
      id: "runway_s3",
      x: 1470,
      y: 510,
      title: "Runway Gen-4.5 I2V",
      sub: "Shot 3 — Resolved Tension",
      engine: "runway",
      cat: "model",
      info: "5–10s · 24/25fps · 720p · No negatives",
      inputs: [
        { id: "ref", type: "image", label: "Reference *" },
        { id: "prompt", type: "text", label: "Combined *" },
      ],
      outputs: [{ id: "video", type: "video", label: "Video" }],
    },

    {
      id: "capcut",
      x: 1780,
      y: 280,
      title: "CapCut Stitch",
      sub: "Final Assembly → 9:16 Export",
      engine: "wstv",
      cat: "utility",
      info: "Audio on · safe zone text · vertical",
      inputs: [
        { id: "v1", type: "video", label: "Shot 1 *" },
        { id: "v2", type: "video", label: "Shot 2 *" },
        { id: "a2", type: "audio", label: "Audio" },
        { id: "v3", type: "video", label: "Shot 3 *" },
      ],
      outputs: [{ id: "reel", type: "video", label: "Final Reel" }],
    },
  ];
}

const WIRES: Wire[] = [
  { from: "scene_input.text", to: "gemini_llm.prompt", type: "text" },
  { from: "sys_prompt.text", to: "gemini_llm.system", type: "text" },

  { from: "gemini_llm.json", to: "json_parse.json", type: "text" },

  { from: "json_parse.img_prompt", to: "nb2_gen.prompt", type: "text" },

  { from: "json_parse.s1_motion", to: "combine_1.b", type: "text" },
  { from: "json_parse.s2_action", to: "combine_2.b", type: "text" },
  { from: "json_parse.s3_motion", to: "combine_3.b", type: "text" },

  { from: "json_parse.char_lock", to: "combine_1.a", type: "text" },
  { from: "json_parse.char_lock", to: "combine_2.a", type: "text" },
  { from: "json_parse.char_lock", to: "combine_3.a", type: "text" },

  { from: "json_parse.negative", to: "kling_s2.negative", type: "text" },

  { from: "nb2_gen.image", to: "ref_split.master", type: "image" },

  { from: "ref_split.ref1", to: "runway_s1.ref", type: "image" },
  { from: "ref_split.ref2", to: "kling_s2.ref", type: "image" },
  { from: "ref_split.ref3", to: "runway_s3.ref", type: "image" },

  { from: "combine_1.combined", to: "runway_s1.prompt", type: "text" },
  { from: "combine_2.combined", to: "kling_s2.prompt", type: "text" },
  { from: "combine_3.combined", to: "runway_s3.prompt", type: "text" },

  { from: "runway_s1.video", to: "capcut.v1", type: "video" },
  { from: "kling_s2.video", to: "capcut.v2", type: "video" },
  { from: "kling_s2.audio", to: "capcut.a2", type: "audio" },
  { from: "runway_s3.video", to: "capcut.v3", type: "video" },
];

function pp(nodes: Node[], nid: string, pid: string, side: "in" | "out") {
  const n = nodes.find((nd) => nd.id === nid);
  if (!n) return { x: 0, y: 0 };

  const ports = side === "out" ? n.outputs : n.inputs;
  const idx = ports.findIndex((p) => p.id === pid);
  if (idx < 0) return { x: 0, y: 0 };

  return {
    x: side === "out" ? n.x + NW : n.x,
    y: n.y + PY0 + idx * PS,
  };
}

function bp(x1: number, y1: number, x2: number, y2: number) {
  const cp = Math.max(50, Math.abs(x2 - x1) * 0.4);
  return `M${x1},${y1} C${x1 + cp},${y1} ${x2 - cp},${y2} ${x2},${y2}`;
}

function WireEl({ w, nodes }: { w: Wire; nodes: Node[] }) {
  const [fn, fp] = w.from.split(".");
  const [tn, tp] = w.to.split(".");

  const a = pp(nodes, fn, fp, "out");
  const b = pp(nodes, tn, tp, "in");
  const c = TC[w.type]?.wire || "#555";
  const d = bp(a.x, a.y, b.x, b.y);

  return (
    <g>
      <path d={d} fill="none" stroke={c} strokeWidth={3.5} opacity={0.08} />
      <path
        d={d}
        fill="none"
        stroke={c}
        strokeWidth={1.6}
        opacity={w.dashed ? 0.35 : 0.6}
        strokeDasharray={w.dashed ? "5 3" : "none"}
      />
      {!w.dashed && (
        <circle r={2.2} fill={c} opacity={0.8}>
          <animateMotion dur="3.5s" repeatCount="indefinite" path={d} />
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
  type: string;
  label: string;
  side: "in" | "out";
}) {
  const c = TC[type]?.port || "#888";

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
  const h = nH(node);
  const e = ENG[node.engine] || ENG.wstv;

  return (
    <g transform={`translate(${node.x},${node.y})`}>
      <rect x={2} y={2} width={NW} height={h} rx={8} fill="rgba(0,0,0,0.25)" />
      <rect width={NW} height={h} rx={8} fill="#181830" stroke="#282848" strokeWidth={1} />
      <rect width={NW} height={3.5} rx={8} ry={8} fill={e.accent} />
      <rect y={1.5} width={NW} height={2} fill={e.accent} />
      <rect x={0.5} y={3.5} width={NW - 1} height={HH - 4} fill="rgba(255,255,255,0.02)" />

      <rect x={7} y={9} width={e.label.length * 7 + 18} height={16} rx={3.5} fill={e.badge} />
      <text
        x={16}
        y={20.5}
        fill={e.badgeText}
        fontSize={9}
        fontWeight={700}
        fontFamily="'JetBrains Mono', monospace"
        style={{ userSelect: "none" }}
      >
        {e.icon} {e.label}
      </text>

      {node.cat === "input" && (
        <>
          <rect x={NW - 48} y={9} width={40} height={16} rx={3.5} fill="rgba(255,255,255,0.05)" />
          <text
            x={NW - 28}
            y={20.5}
            fill="#5b5f73"
            fontSize={8}
            fontWeight={600}
            textAnchor="middle"
            fontFamily="monospace"
            style={{ userSelect: "none" }}
          >
            INPUT
          </text>
        </>
      )}

      {node.cat === "utility" && (
        <>
          <rect x={NW - 55} y={9} width={47} height={16} rx={3.5} fill="rgba(147,51,234,0.1)" />
          <text
            x={NW - 32}
            y={20.5}
            fill="#a855f7"
            fontSize={8}
            fontWeight={600}
            textAnchor="middle"
            fontFamily="monospace"
            style={{ userSelect: "none" }}
          >
            UTILITY
          </text>
        </>
      )}

      {node.cat === "model" && (
        <>
          <rect x={NW - 52} y={9} width={44} height={16} rx={3.5} fill="rgba(34,197,94,0.08)" />
          <text
            x={NW - 30}
            y={20.5}
            fill="#4ade80"
            fontSize={8}
            fontWeight={600}
            textAnchor="middle"
            fontFamily="monospace"
            style={{ userSelect: "none" }}
          >
            MODEL
          </text>
        </>
      )}

      <text
        x={8}
        y={HH}
        fill="#dcdee6"
        fontSize={11}
        fontWeight={700}
        fontFamily="'Inter', system-ui, sans-serif"
        style={{ userSelect: "none" }}
      >
        {node.title}
      </text>

      {node.info && (
        <text
          x={8}
          y={h - 5}
          fill="#3e4258"
          fontSize={7.5}
          fontFamily="monospace"
          style={{ userSelect: "none" }}
        >
          {node.info}
        </text>
      )}

      {node.inputs.map((p, i) => (
        <PortEl key={`i-${p.id}`} x={0} y={PY0 + i * PS} type={p.type} label={p.label} side="in" />
      ))}
      {node.outputs.map((p, i) => (
        <PortEl key={`o-${p.id}`} x={NW} y={PY0 + i * PS} type={p.type} label={p.label} side="out" />
      ))}
    </g>
  );
}

function LegendEl({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect width={520} height={88} rx={8} fill="#12122a" stroke="#282848" strokeWidth={0.8} />

      <text
        x={12}
        y={17}
        fill="#7b7f96"
        fontSize={9}
        fontWeight={700}
        fontFamily="'Inter', sans-serif"
        style={{ userSelect: "none" }}
      >
        CONTENT TYPES
      </text>

      {(
        [
          ["text", "Text (Orange)"],
          ["image", "Image (Blue)"],
          ["audio", "Audio (Yellow)"],
          ["video", "Video (Green)"],
        ] as const
      ).map(([t, l], i) => (
        <g key={t} transform={`translate(${12 + i * 125},26)`}>
          <circle cx={5} cy={6} r={4} fill={TC[t].port} />
          <text
            x={14}
            y={10}
            fill="#a0a4b8"
            fontSize={8.5}
            fontFamily="monospace"
            style={{ userSelect: "none" }}
          >
            {l}
          </text>
        </g>
      ))}

      <line x1={12} y1={44} x2={508} y2={44} stroke="#282848" strokeWidth={0.4} />

      <text
        x={12}
        y={60}
        fill="#7b7f96"
        fontSize={9}
        fontWeight={700}
        fontFamily="'Inter', sans-serif"
        style={{ userSelect: "none" }}
      >
        ENGINE TYPES
      </text>

      {(
        [
          ["runway", "Runway Native (LLM, Gen-4.5, JSON Parse, Combine Text)"],
          ["kling", "Kling (WSTV Action Workflow)"],
          ["wstv", "WSTV Custom (NB2, Ref Framing, CapCut)"],
        ] as const
      ).map(([k, l], i) => (
        <g key={k} transform={`translate(${12 + i * 175},68)`}>
          <rect width={8} height={8} rx={2} fill={ENG[k].accent} />
          <text
            x={12}
            y={8}
            fill="#a0a4b8"
            fontSize={7}
            fontFamily="monospace"
            style={{ userSelect: "none" }}
          >
            {l}
          </text>
        </g>
      ))}
    </g>
  );
}

export default function WSTVWorkflowDiagram({
  data: _data,
  onCopy: _onCopy,
}: {
  data?: GeneratedPackage;
  onCopy?: (t: string) => void;
}) {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.54);
  const [drag, setDrag] = useState(false);
  const [ds, setDs] = useState({ x: 0, y: 0 });
  const [ps, setPs] = useState({ x: 0, y: 0 });
  const [isOpen, setIsOpen] = useState(false);

  const nodes = useMemo(() => buildNodes(), []);

  const onWheel = useCallback((e: ReactWheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    setZoom((z) => Math.min(2.5, Math.max(0.2, z + (e.deltaY > 0 ? -0.05 : 0.05))));
  }, []);

  const onMD = useCallback(
    (e: ReactMouseEvent<SVGSVGElement>) => {
      if (e.button !== 0) return;
      setDrag(true);
      setDs({ x: e.clientX, y: e.clientY });
      setPs({ ...pan });
    },
    [pan]
  );

  const onMM = useCallback(
    (e: ReactMouseEvent<SVGSVGElement>) => {
      if (!drag) return;
      setPan({
        x: ps.x + (e.clientX - ds.x),
        y: ps.y + (e.clientY - ds.y),
      });
    },
    [drag, ds, ps]
  );

  const onMU = useCallback(() => setDrag(false), []);

  const onTS = useCallback(
    (e: ReactTouchEvent<SVGSVGElement>) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      setDrag(true);
      setDs({ x: t.clientX, y: t.clientY });
      setPs({ ...pan });
    },
    [pan]
  );

  const onTM = useCallback(
    (e: ReactTouchEvent<SVGSVGElement>) => {
      if (!drag || e.touches.length !== 1) return;
      const t = e.touches[0];
      setPan({
        x: ps.x + (t.clientX - ds.x),
        y: ps.y + (t.clientY - ds.y),
      });
    },
    [drag, ds, ps]
  );

  const reset = () => {
    setPan({ x: 0, y: 0 });
    setZoom(0.54);
  };

  const flowBadges = [
    { l: "Scene", c: "#f59e0b" },
    { l: "→", c: "#3e4258" },
    { l: "Gemini", c: "#16a34a" },
    { l: "→", c: "#3e4258" },
    { l: "JSON", c: "#16a34a" },
    { l: "→", c: "#3e4258" },
    { l: "NB2", c: "#9333ea" },
    { l: "→", c: "#3e4258" },
    { l: "3 Refs", c: "#3b82f6" },
    { l: "→", c: "#3e4258" },
    { l: "S1 Runway", c: "#16a34a" },
    { l: "+", c: "#3e4258" },
    { l: "S2 Kling", c: "#2563eb" },
    { l: "+", c: "#3e4258" },
    { l: "S3 Runway", c: "#16a34a" },
    { l: "→", c: "#3e4258" },
    { l: "CapCut", c: "#9333ea" },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-700 bg-[#0b0b1a] shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1e1e38] px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-green-600 to-purple-600 text-xs font-extrabold text-white">
            W
          </div>
          <span className="text-sm font-bold text-gray-200">WSTV Pipeline — Node Graph</span>
          <span className="rounded bg-[rgba(255,255,255,0.05)] px-2 py-0.5 text-[9px] font-semibold text-gray-500">
            LLM → JSON Parse → Combine Text → Ref Framing
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

      {isOpen && (
        <div className="relative" style={{ height: 580, cursor: drag ? "grabbing" : "grab" }}>
          <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-lg border border-[#282848] bg-[rgba(11,11,26,0.9)] px-2 py-1.5 backdrop-blur-sm">
            <span className="text-[9px] text-gray-500" style={{ fontFamily: "monospace" }}>
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.2, z - 0.1))}
              className="flex h-6 w-6 items-center justify-center rounded border border-[#282848] bg-[rgba(255,255,255,0.05)] text-sm font-bold text-gray-400"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.1))}
              className="flex h-6 w-6 items-center justify-center rounded border border-[#282848] bg-[rgba(255,255,255,0.05)] text-sm font-bold text-gray-400"
            >
              +
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded border border-[#282848] bg-[rgba(255,255,255,0.05)] px-2 py-0.5 text-[9px] font-semibold text-gray-400"
            >
              Reset
            </button>
          </div>

          <div
            className="absolute left-3 top-3 z-10 rounded-lg border border-[#1e1e38] bg-[rgba(11,11,26,0.88)] px-3 py-2 text-[9px] text-gray-600 backdrop-blur-sm"
            style={{ fontFamily: "monospace", lineHeight: 1.6 }}
          >
            Drag to pan · Scroll to zoom
          </div>

          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-lg border border-[#1e1e38] bg-[rgba(11,11,26,0.92)] px-3 py-1.5 backdrop-blur-sm">
            {flowBadges.map((s, i) => (
              <span
                key={i}
                className="text-[9px]"
                style={{
                  color: s.c,
                  fontFamily: "monospace",
                  fontWeight: s.l === "→" || s.l === "+" ? 400 : 700,
                }}
              >
                {s.l}
              </span>
            ))}
          </div>

          <svg
            width="100%"
            height="100%"
            onWheel={onWheel}
            onMouseDown={onMD}
            onMouseMove={onMM}
            onMouseUp={onMU}
            onMouseLeave={onMU}
            onTouchStart={onTS}
            onTouchMove={onTM}
            onTouchEnd={onMU}
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

            <rect width="6000" height="4000" x="-3000" y="-2000" fill="url(#wstv-g)" />

            <g transform={`translate(${pan.x + 24},${pan.y + 16}) scale(${zoom})`}>
              {WIRES.map((w, i) => (
                <WireEl key={i} w={w} nodes={nodes} />
              ))}
              {nodes.map((n) => (
                <NodeEl key={n.id} node={n} />
              ))}
              <LegendEl x={1280} y={680} />
            </g>
          </svg>
        </div>
      )}
    </div>
  );
}
