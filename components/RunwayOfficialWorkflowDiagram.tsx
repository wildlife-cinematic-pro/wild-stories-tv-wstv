"use client";

import React from "react";

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
};

type WireStyle = "main" | "qa" | "continuity" | "optional";

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
  qa: "#fbbf24",
  continuity: "#c084fc",
  optional: "#94a3b8",
};

const BG = "#060c14";
const GRID_MINOR = "#101827";
const GRID_MAJOR = "#172335";
const BORDER = "rgba(255,255,255,0.08)";
const TEXT_MAIN = "#edf2f8";
const TEXT_SUB = "#8fa3bd";
const TEXT_FAINT = "#5f738e";

const VIEW_W = 3600;
const VIEW_H = 980;

const ROW_H = 20;
const FOOTER_PAD = 10;
const BAR_H = 4;
const PAD_TOP = 8;
const BADGE_H = 21;
const TITLE_H = 14;
const SUBTITLE_H = 14;
const PORT_MARGIN = 10;
const DOT_OFFSET = 5.5;

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

function getNodeHeight(spec: NodeSpec): number {
  const rows = Math.max(spec.inputs.length, spec.outputs.length, 1);
  return nodeHeaderH(spec) + rows * ROW_H + FOOTER_PAD;
}

function getPortDotY(spec: NodeSpec, index: number): number {
  return nodeHeaderH(spec) + index * ROW_H + DOT_OFFSET;
}

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

const NODE_SPECS: NodeSpec[] = [
  makeNode("text_system", {
    title: "Text",
    subtitle: "System Prompt",
    badge: "INPUT",
    width: 170,
    bg: "#0c1520",
    inputs: [],
    outputs: [{ id: "text", label: "Text", kind: "text" }],
  }),
  makeNode("text_user", {
    title: "Text",
    subtitle: "User Prompt",
    badge: "INPUT",
    width: 170,
    bg: "#0c1520",
    inputs: [],
    outputs: [{ id: "text", label: "Text", kind: "text" }],
  }),
  makeNode("image_input", {
    title: "Image",
    subtitle: "Optional Reference",
    badge: "INPUT",
    width: 176,
    bg: "#0c1520",
    inputs: [],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
  }),

  makeNode("llm", {
    title: "LLM",
    subtitle: "Prompt Planning",
    badge: "LLM",
    width: 210,
    bg: "#14092e",
    accent: "#f97316",
    inputs: [
      { id: "system", label: "System Prompt", kind: "text", required: true },
      { id: "prompt", label: "Prompt", kind: "text", required: true },
    ],
    outputs: [{ id: "json", label: "Text (JSON)", kind: "text" }],
  }),
  makeNode("json", {
    title: "JSON Parse",
    subtitle: "Scene Prompts",
    badge: "UTILITY",
    width: 280,
    bg: "#07121d",
    accent: "#16a34a",
    inputs: [{ id: "json", label: "Text (JSON)", kind: "text", required: true }],
    outputs: [
      { id: "image_prompt", label: "scene.0.image_prompt", kind: "text" },
      { id: "shot1", label: "scene.0.video_prompt", kind: "text" },
      { id: "shot2", label: "scene.1.video_prompt", kind: "text" },
      { id: "shot3", label: "scene.2.video_prompt", kind: "text" },
    ],
  }),

  makeNode("gen4_image", {
    title: "Gen-4 Image",
    subtitle: "Reference Still",
    badge: "MODEL",
    width: 210,
    bg: "#051a0e",
    accent: "#16a34a",
    inputs: [
      { id: "prompt", label: "Prompt", kind: "text", required: true },
      { id: "image", label: "Image", kind: "image" },
    ],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
  }),

  makeNode("shot1", {
    title: "Gen-4 Video",
    subtitle: "Scene 1",
    badge: "MODEL",
    width: 208,
    bg: "#060f28",
    accent: "#60a5fa",
    inputs: [
      { id: "image", label: "Image", kind: "image", required: true },
      { id: "prompt", label: "Prompt", kind: "text", required: true },
    ],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
  }),
  makeNode("qa1", {
    title: "First Frame",
    subtitle: "QA Scene 1",
    badge: "UTILITY",
    width: 180,
    bg: "#100c00",
    accent: "#fbbf24",
    dim: true,
    inputs: [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
  }),
  makeNode("last1", {
    title: "Last Frame",
    subtitle: "Scene 1 → 2",
    badge: "UTILITY",
    width: 184,
    bg: "#1a0544",
    accent: "#c084fc",
    inputs: [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
  }),

  makeNode("shot2", {
    title: "Gen-4 Video",
    subtitle: "Scene 2",
    badge: "MODEL",
    width: 208,
    bg: "#060f28",
    accent: "#60a5fa",
    inputs: [
      { id: "image", label: "Image", kind: "image", required: true },
      { id: "prompt", label: "Prompt", kind: "text", required: true },
    ],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
  }),
  makeNode("qa2", {
    title: "First Frame",
    subtitle: "QA Scene 2",
    badge: "UTILITY",
    width: 180,
    bg: "#100c00",
    accent: "#fbbf24",
    dim: true,
    inputs: [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
  }),
  makeNode("last2", {
    title: "Last Frame",
    subtitle: "Scene 2 → 3",
    badge: "UTILITY",
    width: 184,
    bg: "#1a0544",
    accent: "#c084fc",
    inputs: [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
  }),

  makeNode("shot3", {
    title: "Gen-4 Video",
    subtitle: "Scene 3",
    badge: "MODEL",
    width: 208,
    bg: "#060f28",
    accent: "#60a5fa",
    inputs: [
      { id: "image", label: "Image", kind: "image", required: true },
      { id: "prompt", label: "Prompt", kind: "text", required: true },
    ],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
  }),
  makeNode("qa3", {
    title: "First Frame",
    subtitle: "QA Scene 3",
    badge: "UTILITY",
    width: 180,
    bg: "#100c00",
    accent: "#fbbf24",
    dim: true,
    inputs: [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
  }),

  makeNode("stitch", {
    title: "Stitch",
    subtitle: "Final Sequence",
    badge: "UTILITY",
    width: 190,
    bg: "#0d0220",
    accent: "#16a34a",
    inputs: [
      { id: "s1", label: "Input 1", kind: "video", required: true },
      { id: "s2", label: "Input 2", kind: "video", required: true },
      { id: "s3", label: "Input 3", kind: "video", required: true },
    ],
    outputs: [{ id: "video", label: "Video", kind: "video" }],
  }),
  makeNode("extract", {
    title: "Extract Frame",
    subtitle: "Thumbnail / Reuse",
    badge: "UTILITY",
    width: 200,
    bg: "#041420",
    accent: "#94a3b8",
    inputs: [{ id: "video", label: "Video", kind: "video", required: true }],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
  }),
];

const POSITIONS: Record<string, Point> = {
  text_system: { x: 30, y: 134 },
  text_user: { x: 30, y: 250 },
  image_input: { x: 30, y: 366 },

  llm: { x: 262, y: 192 },
  json: { x: 560, y: 160 },
  gen4_image: { x: 892, y: 160 },

  shot1: { x: 1188, y: 118 },
  qa1: { x: 1188, y: 520 },
  last1: { x: 1450, y: 118 },

  shot2: { x: 1718, y: 118 },
  qa2: { x: 1718, y: 520 },
  last2: { x: 1980, y: 118 },

  shot3: { x: 2248, y: 118 },
  qa3: { x: 2248, y: 520 },

  stitch: { x: 2544, y: 250 },
  extract: { x: 2820, y: 250 },
};

const WIRES: WireDef[] = [
  { from: ["text_system", "text"], to: ["llm", "system"], style: "main" },
  { from: ["text_user", "text"], to: ["llm", "prompt"], style: "main" },
  { from: ["llm", "json"], to: ["json", "json"], style: "main" },

  { from: ["json", "image_prompt"], to: ["gen4_image", "prompt"], style: "main" },
  { from: ["image_input", "image"], to: ["gen4_image", "image"], style: "optional" },

  { from: ["gen4_image", "image"], to: ["shot1", "image"], style: "main" },
  { from: ["json", "shot1"], to: ["shot1", "prompt"], style: "main" },
  { from: ["shot1", "video"], to: ["qa1", "video"], style: "qa", route: "v" },
  { from: ["shot1", "video"], to: ["last1", "video"], style: "continuity" },

  { from: ["last1", "image"], to: ["shot2", "image"], style: "continuity" },
  { from: ["json", "shot2"], to: ["shot2", "prompt"], style: "main" },
  { from: ["shot2", "video"], to: ["qa2", "video"], style: "qa", route: "v" },
  { from: ["shot2", "video"], to: ["last2", "video"], style: "continuity" },

  { from: ["last2", "image"], to: ["shot3", "image"], style: "continuity" },
  { from: ["json", "shot3"], to: ["shot3", "prompt"], style: "main" },
  { from: ["shot3", "video"], to: ["qa3", "video"], style: "qa", route: "v" },

  { from: ["shot1", "video"], to: ["stitch", "s1"], style: "main", route: "pipe", pipeY: 420 },
  { from: ["shot2", "video"], to: ["stitch", "s2"], style: "main", route: "pipe", pipeY: 454 },
  { from: ["shot3", "video"], to: ["stitch", "s3"], style: "main", route: "pipe", pipeY: 488 },
  { from: ["stitch", "video"], to: ["extract", "video"], style: "optional" },
];

function markerId(style: WireStyle) {
  switch (style) {
    case "main":
      return "arr-main";
    case "qa":
      return "arr-qa";
    case "continuity":
      return "arr-continuity";
    case "optional":
      return "arr-optional";
  }
}

function getRect(spec: NodeSpec, pos: Point) {
  return { x: pos.x, y: pos.y, w: spec.width, h: getNodeHeight(spec) };
}

function getPortPoint(
  specMap: Record<string, NodeSpec>,
  positions: Record<string, Point>,
  nodeId: string,
  portId: string,
  side: Side
): Point {
  const spec = specMap[nodeId];
  const rect = getRect(spec, positions[nodeId]);
  const ports = side === "left" ? spec.inputs : spec.outputs;
  const index = Math.max(
    0,
    ports.findIndex((p) => p.id === portId)
  );
  const y = rect.y + getPortDotY(spec, index);
  const x = side === "left" ? rect.x : rect.x + rect.w;
  return { x, y };
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

function NodeBox({ spec, pos }: { spec: NodeSpec; pos: Point }) {
  const height = getNodeHeight(spec);
  const rows = Math.max(spec.inputs.length, spec.outputs.length, 1);

  return (
    <div
      style={{
        position: "absolute",
        left: pos.x,
        top: pos.y,
        width: spec.width,
        height,
        background: spec.bg,
        border: spec.accent ? `1.5px solid ${spec.accent}88` : `1px solid ${BORDER}`,
        borderRadius: 10,
        boxShadow: spec.accent
          ? `0 0 0 3px ${spec.accent}18, 0 8px 26px rgba(0,0,0,0.55)`
          : "0 8px 22px rgba(0,0,0,0.45)",
        opacity: spec.dim ? 0.7 : 1,
        userSelect: "none",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: BAR_H,
          background: spec.accent
            ? `linear-gradient(90deg, ${spec.accent}, ${spec.accent}99)`
            : "rgba(255,255,255,0.06)",
        }}
      />
      <div
        style={{
          padding: "8px 10px 8px",
          height: `calc(100% - ${BAR_H}px)`,
          boxSizing: "border-box",
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
            marginTop: PORT_MARGIN,
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
      </div>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        flex: "1 1 0",
        padding: "16px 18px",
        minWidth: 220,
      }}
    >
      <div
        style={{
          color: "#93b8d8",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.10em",
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      <div style={{ color: TEXT_SUB, fontSize: 10, lineHeight: 1.65 }}>{children}</div>
    </div>
  );
}

export default function RunwayOfficialWorkflowDiagram() {
  const specMap = Object.fromEntries(NODE_SPECS.map((n) => [n.id, n] as const));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%" }}>
      <div
        style={{
          width: "100%",
          overflowX: "auto",
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.07)",
          background: BG,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "relative",
            width: VIEW_W,
            height: VIEW_H,
            backgroundImage: `
              linear-gradient(${GRID_MINOR} 1px, transparent 1px),
              linear-gradient(90deg, ${GRID_MINOR} 1px, transparent 1px),
              linear-gradient(${GRID_MAJOR} 1px, transparent 1px),
              linear-gradient(90deg, ${GRID_MAJOR} 1px, transparent 1px)
            `,
            backgroundSize: "24px 24px, 24px 24px, 120px 120px, 120px 120px",
          }}
        >
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
            Runway Workflows · docs-only reference diagram
          </div>

          <svg
            width={VIEW_W}
            height={VIEW_H}
            style={{ position: "absolute", inset: 0, overflow: "visible" }}
          >
            <defs>
              {(
                [
                  ["arr-main", WIRE_COLORS.main],
                  ["arr-qa", WIRE_COLORS.qa],
                  ["arr-continuity", WIRE_COLORS.continuity],
                  ["arr-optional", WIRE_COLORS.optional],
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
              const from = getPortPoint(specMap, POSITIONS, wire.from[0], wire.from[1], "right");
              const to = getPortPoint(specMap, POSITIONS, wire.to[0], wire.to[1], "left");
              const color = WIRE_COLORS[wire.style];

              let d = "";
              if (wire.route === "v") d = vCurve(from, to);
              else if (wire.route === "pipe") d = pipeCurve(from, to, wire.pipeY ?? 420);
              else d = hCurve(from, to, 72);

              const dashed = wire.style !== "main";
              const opacity =
                wire.style === "qa" ? 0.64 : wire.style === "optional" ? 0.58 : 0.92;
              const strokeWidth =
                wire.style === "main" ? 2.35 : wire.style === "continuity" ? 1.8 : 1.35;

              return (
                <g key={idx}>
                  {wire.style === "main" && (
                    <path d={d} fill="none" stroke={color} strokeWidth={5} opacity={0.12} />
                  )}
                  {wire.style === "continuity" && (
                    <path d={d} fill="none" stroke={color} strokeWidth={4} opacity={0.1} />
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

          <SectionLabel x={30} y={110} text="Inputs" />
          <SectionLabel x={262} y={168} text="LLM + Structured Prompting" />
          <SectionLabel x={892} y={136} text="Initial Reference Generation" />
          <SectionLabel x={1188} y={94} text="Scene 1" />
          <SectionLabel x={1718} y={94} text="Scene 2" />
          <SectionLabel x={2248} y={94} text="Scene 3" />
          <SectionLabel x={1188} y={494} text="First Frame QA" color="#8c6a10" />
          <SectionLabel x={1450} y={94} text="Last Frame Continuity" color="#9d71ff" />
          <SectionLabel x={2544} y={226} text="Final Assembly" color="#1e5a70" />

          {NODE_SPECS.map((spec) => (
            <NodeBox key={spec.id} spec={spec} pos={POSITIONS[spec.id]} />
          ))}

          <div
            style={{
              position: "absolute",
              left: 30,
              bottom: 24,
              display: "flex",
              alignItems: "center",
              gap: 18,
              flexWrap: "wrap",
              padding: "10px 12px",
              borderRadius: 12,
              background: "rgba(9,17,27,0.82)",
              border: `1px solid ${BORDER}`,
            }}
          >
            {(
              [
                { label: "Primary documented flow", color: WIRE_COLORS.main, dashed: false },
                { label: "Scene continuity (Last Frame)", color: WIRE_COLORS.continuity, dashed: true },
                { label: "First-frame QA check", color: WIRE_COLORS.qa, dashed: true },
                { label: "Optional / reusable branch", color: WIRE_COLORS.optional, dashed: true },
              ] as const
            ).map((item) => (
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

      <div
        style={{
          display: "flex",
          gap: 0,
          borderRadius: 14,
          overflow: "hidden",
          border: `1px solid ${BORDER}`,
          background: "rgba(9,17,27,0.88)",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          flexWrap: "wrap",
        }}
      >
        <InfoCard title="What is guaranteed here">
          This component uses only node categories, node names, and relationships that Runway publicly documents: input nodes, LLM nodes, JSON Parse, Gen-4 Image, Gen-4 Video, First Frame, Last Frame, Stitch, and Extract Frame.
        </InfoCard>
        <div style={{ width: 1, background: BORDER, alignSelf: "stretch" }} />
        <InfoCard title="Continuity rule shown">
          Last Frame is used as the handoff from one generated scene to the next. Runway explicitly documents this as a way to create seamless scene-to-scene continuity for longer narratives.
        </InfoCard>
        <div style={{ width: 1, background: BORDER, alignSelf: "stretch" }} />
        <InfoCard title="Why First Frame is separate">
          First Frame is shown as a QA branch rather than a continuity branch. Runway documents it as useful for checking whether your opening frame or variation starting point was applied correctly.
        </InfoCard>
        <div style={{ width: 1, background: BORDER, alignSelf: "stretch" }} />
        <InfoCard title="What was intentionally removed">
          No custom operator labels, no third-party-model-specific routing, no undocumented “canonical anchor” node, and no claim that Trim Video must run before Last Frame. Those were removed to keep this version docs-only.
        </InfoCard>
        <div style={{ width: 1, background: BORDER, alignSelf: "stretch" }} />
        <InfoCard title="How to extend it safely">
          You can add more scene outputs from JSON Parse, branch to additional Gen-4 Video nodes, and expand Stitch inputs. You can also use Extract Frame from any video when you need a hero still, thumbnail, or reusable starting image.
          <div style={{ marginTop: 8, color: TEXT_FAINT }}>
            Not shown here, but also officially supported in Workflows: additional media utility nodes such as Trim Video, Add Audio, and Extract Audio.
          </div>
        </InfoCard>
      </div>
    </div>
  );
}
