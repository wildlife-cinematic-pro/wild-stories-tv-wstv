"use client";

/* ════════════════════════════════════════════════════════════════════
   WSTVWorkflowDiagram.tsx
   Wild Stories TV — AI Video Production Pipeline

   Official Runway node names used throughout (per help.runwayml.com):
     Text · Image · Claude · JSON Parse · Gen-4 Image
     Gen-4.5 · Extract Frame · First Frame · Trim Video · Last Frame · Stitch

   Third-party nodes available inside Runway Workflows UI:
     Kling 3.0 Pro · Nano Banana 2

   Node locking and seed discipline are workflow actions, not separate
   media nodes. They are documented inside Continuity Notes only.
════════════════════════════════════════════════════════════════════ */

import {
  useState,
  useRef,
  useCallback,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import type { GeneratedPackage } from "@/types";

// ── Canvas geometry ─────────────────────────────────────────────────
const CW = 2460;
const CH = 720;

// ── Colour palette ───────────────────────────────────────────────────
const PAL = {
  input: "#0C1520",
  ai: "#14092E",
  json: "#070C18",
  nano: "#051A0E",
  anchor: "#1A0544",
  video: "#060F28",
  kling: "#1E0B00",
  util: "#041420",
  trim: "#071318",
  last: "#160202",
  qa: "#100C00",
  stitch: "#0D0220",
  note: "#08101C",

  main: "#60A5FA",
  fall: "#FB923C",
  anch: "#C084FC",
  qaW: "#FBBF24",
  help: "#1D2A3A",
} as const;

// ── Layout constants ─────────────────────────────────────────────────
type Rect = { x: number; y: number; w: number; h: number };
type Pt = [number, number];
type Side = "right" | "left" | "top" | "bottom";

const N: Record<string, Rect> = {
  sys: { x: 20, y: 88, w: 122, h: 44 },
  usr: { x: 20, y: 144, w: 122, h: 44 },
  imgRef: { x: 20, y: 200, w: 122, h: 44 },

  claude: { x: 196, y: 124, w: 134, h: 74 },

  jsonParse: { x: 382, y: 36, w: 160, h: 290 },

  nano: { x: 600, y: 136, w: 138, h: 58 },
  gen4img: { x: 796, y: 128, w: 152, h: 72 },

  shot1: { x: 1008, y: 136, w: 140, h: 58 },
  trim1: { x: 1210, y: 141, w: 124, h: 48 },
  extract1: { x: 1390, y: 141, w: 124, h: 48 },

  kling: { x: 1572, y: 128, w: 144, h: 72 },
  trim2: { x: 1774, y: 141, w: 124, h: 48 },
  extract2: { x: 1954, y: 141, w: 124, h: 48 },

  shot3: { x: 2136, y: 136, w: 140, h: 58 },
  stitch: { x: 2334, y: 140, w: 106, h: 48 },

  lastFrame1: { x: 1210, y: 330, w: 124, h: 48 },
  lastFrame2: { x: 1774, y: 330, w: 124, h: 48 },

  qa1: { x: 1008, y: 330, w: 134, h: 48 },
  qa2: { x: 1572, y: 330, w: 134, h: 48 },
  qa3: { x: 2136, y: 330, w: 134, h: 48 },

  contNote: { x: 600, y: 510, w: 208, h: 174 },
  audioNote: { x: 1210, y: 510, w: 162, h: 100 },
  socialPack: { x: 1774, y: 510, w: 156, h: 100 },
};

// ── Geometry helpers ─────────────────────────────────────────────────
function port(r: Rect, s: Side): Pt {
  switch (s) {
    case "right":
      return [r.x + r.w, r.y + r.h / 2];
    case "left":
      return [r.x, r.y + r.h / 2];
    case "top":
      return [r.x + r.w / 2, r.y];
    case "bottom":
      return [r.x + r.w / 2, r.y + r.h];
  }
}

function hbez(a: Pt, b: Pt, c = 54): string {
  const [x1, y1] = a;
  const [x2, y2] = b;
  return `M ${x1} ${y1} C ${x1 + c} ${y1}, ${x2 - c} ${y2}, ${x2} ${y2}`;
}

function vbez(a: Pt, b: Pt): string {
  const [x1, y1] = a;
  const [x2, y2] = b;
  const m = (y1 + y2) / 2;
  return `M ${x1} ${y1} C ${x1} ${m}, ${x2} ${m}, ${x2} ${y2}`;
}

function pipePath(a: Pt, b: Pt, pipeY: number, r = 36): string {
  const [x1, y1] = a;
  const [x2, y2] = b;
  return [
    `M ${x1} ${y1}`,
    `C ${x1} ${y1 + r}, ${x1} ${pipeY - r}, ${x1} ${pipeY}`,
    `L ${x2} ${pipeY}`,
    `C ${x2} ${pipeY + r}, ${x2} ${y2 - r}, ${x2} ${y2}`,
  ].join(" ");
}

// ── Lane section labels ──────────────────────────────────────────────
function Cap({ x, y, text, color = "#2B3B50" }: { x: number; y: number; text: string; color?: string }) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        fontSize: 8,
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color,
        whiteSpace: "nowrap",
        pointerEvents: "none",
      }}
    >
      {text}
    </div>
  );
}

// ── Node box ─────────────────────────────────────────────────────────
function Box({
  r,
  title,
  sub,
  bg,
  accent,
  badge,
  dim,
  fields,
  infoLines,
}: {
  r: Rect;
  title: string;
  sub?: string;
  bg: string;
  accent?: boolean;
  badge?: string;
  dim?: boolean;
  fields?: string[];
  infoLines?: string[];
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: r.x,
        top: r.y,
        width: r.w,
        height: r.h,
        background: bg,
        border: accent
          ? "1.5px solid rgba(192,132,252,0.55)"
          : "1px solid rgba(255,255,255,0.07)",
        borderRadius: 8,
        boxShadow: accent
          ? "0 0 0 3px rgba(192,132,252,0.09), 0 4px 20px rgba(0,0,0,0.70)"
          : "0 2px 10px rgba(0,0,0,0.55)",
        overflow: "hidden",
        opacity: dim ? 0.44 : 1,
        userSelect: "none",
      }}
    >
      <div
        style={{
          height: 3,
          flexShrink: 0,
          background: accent
            ? "linear-gradient(90deg,#C084FC 0%,#818CF8 100%)"
            : "rgba(255,255,255,0.05)",
        }}
      />
      <div
        style={{
          padding: "5px 9px 6px",
          height: "calc(100% - 3px)",
          boxSizing: "border-box",
          overflowY: "hidden",
        }}
      >
        {badge && (
          <span
            style={{
              display: "inline-block",
              fontSize: 7,
              fontWeight: 700,
              letterSpacing: "0.09em",
              color: "#4A5568",
              background: "rgba(255,255,255,0.05)",
              borderRadius: 3,
              padding: "1px 5px",
              marginBottom: 3,
            }}
          >
            {badge}
          </span>
        )}

        <div
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            color: accent ? "#E9D5FF" : "#EDF2F8",
            lineHeight: 1.25,
            letterSpacing: "0.01em",
          }}
        >
          {title}
        </div>

        {sub && (
          <div style={{ fontSize: 9, color: "#3D5068", lineHeight: 1.3, marginTop: 2 }}>
            {sub}
          </div>
        )}

        {fields && (
          <div style={{ marginTop: 5 }}>
            {fields.map((f, i) => (
              <div
                key={f}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 8.5,
                  lineHeight: 1.7,
                  color: i === 0 ? "#93C5FD" : "#2E3D52",
                  borderTop: i > 0 ? "1px solid rgba(255,255,255,0.03)" : undefined,
                }}
              >
                <span style={{ color: "#1D2B3A", flexShrink: 0 }}>▸</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {f}
                </span>
              </div>
            ))}
          </div>
        )}

        {infoLines && (
          <div style={{ marginTop: 5 }}>
            {infoLines.map((ln, i) => (
              <div
                key={i}
                style={{
                  fontSize: 8,
                  lineHeight: 1.6,
                  color: i === 0 ? "#4A6380" : "#2B3A4C",
                }}
              >
                {ln}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Connector dot ────────────────────────────────────────────────────
function Dot({ pt, color }: { pt: Pt; color: string }) {
  return <circle cx={pt[0]} cy={pt[1]} r={3.5} fill={color} stroke="#0A0F18" strokeWidth={1.5} />;
}

// ── Arrow-head marker defs ───────────────────────────────────────────
function MarkerDefs() {
  const defs: Array<{ id: string; color: string }> = [
    { id: "arrMain", color: PAL.main },
    { id: "arrFall", color: PAL.fall },
    { id: "arrAnch", color: PAL.anch },
    { id: "arrQA", color: PAL.qaW },
    { id: "arrHelp", color: "#364A62" },
  ];
  return (
    <defs>
      {defs.map(({ id, color }) => (
        <marker key={id} id={id} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L7,3 z" fill={color} />
        </marker>
      ))}
    </defs>
  );
}

export default function WSTVWorkflowDiagram({
  data: _data,
  onCopy: _onCopy,
}: {
  data?: GeneratedPackage;
  onCopy?: (t: string) => void;
}) {
  const [zoom, setZoom] = useState(0.60);
  const [pan, setPan] = useState<Pt>([0, 0]);
  const dragging = useRef(false);
  const lastPos = useRef<Pt>([0, 0]);

  const onWheel = useCallback((e: ReactWheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    setZoom((z) => Math.min(2, Math.max(0.20, z - e.deltaY * 0.0008)));
  }, []);

  const onMouseDown = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    dragging.current = true;
    lastPos.current = [e.clientX, e.clientY];
  }, []);

  const onMouseMove = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current[0];
    const dy = e.clientY - lastPos.current[1];
    lastPos.current = [e.clientX, e.clientY];
    setPan((p) => [p[0] + dx, p[1] + dy]);
  }, []);

  const onMouseUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const onTouchStart = useCallback((e: ReactTouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    dragging.current = true;
    lastPos.current = [t.clientX, t.clientY];
  }, []);

  const onTouchMove = useCallback((e: ReactTouchEvent<HTMLDivElement>) => {
    if (!dragging.current || e.touches.length !== 1) return;
    const t = e.touches[0];
    const dx = t.clientX - lastPos.current[0];
    const dy = t.clientY - lastPos.current[1];
    lastPos.current = [t.clientX, t.clientY];
    setPan((p) => [p[0] + dx, p[1] + dy]);
  }, []);

  const onTouchEnd = useCallback(() => {
    dragging.current = false;
  }, []);

  const p = (id: keyof typeof N, s: Side) => port(N[id], s);
  const PIPE_Y = 460;

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: "#060C14",
        overflow: "hidden",
        cursor: "grab",
        fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
      }}
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        style={{
          position: "fixed",
          bottom: 22,
          right: 22,
          zIndex: 10,
          display: "flex",
          gap: 6,
        }}
      >
        {([
          ["+", () => setZoom((z) => Math.min(2, z + 0.10))],
          ["−", () => setZoom((z) => Math.max(0.20, z - 0.10))],
          ["⊡", () => {
            setZoom(0.60);
            setPan([0, 0]);
          }],
        ] as [string, () => void][]).map(([lbl, fn]) => (
          <button
            key={lbl}
            onClick={fn}
            style={{
              width: 32,
              height: 32,
              background: "#0F1928",
              color: "#607898",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 7,
              fontSize: 15,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {lbl}
          </button>
        ))}
        <span
          style={{
            lineHeight: "32px",
            fontSize: 10,
            color: "#2E4055",
            paddingLeft: 4,
          }}
        >
          {Math.round(zoom * 100)}%
        </span>
      </div>

      <div
        style={{
          transformOrigin: "0 0",
          transform: `translate(${pan[0]}px,${pan[1]}px) scale(${zoom})`,
          width: CW,
          height: CH,
          position: "relative",
        }}
      >
        <svg
          style={{ position: "absolute", top: 0, left: 0, overflow: "visible" }}
          width={CW}
          height={CH}
        >
          <MarkerDefs />

          <path d={hbez(p("sys", "right"), p("claude", "left"))} fill="none" stroke={PAL.main} strokeWidth={1.5} markerEnd="url(#arrMain)" />
          <path d={hbez(p("usr", "right"), p("claude", "left"))} fill="none" stroke={PAL.main} strokeWidth={1.5} markerEnd="url(#arrMain)" />
          <path d={hbez(p("imgRef", "right"), p("claude", "left"))} fill="none" stroke={PAL.main} strokeWidth={1.5} markerEnd="url(#arrMain)" />

          <path d={hbez(p("claude", "right"), p("jsonParse", "left"))} fill="none" stroke={PAL.main} strokeWidth={1.5} markerEnd="url(#arrMain)" />
          <path d={hbez(p("jsonParse", "right"), p("nano", "left"))} fill="none" stroke={PAL.main} strokeWidth={1.5} markerEnd="url(#arrMain)" />
          <path d={hbez(p("nano", "right"), p("gen4img", "left"))} fill="none" stroke={PAL.main} strokeWidth={2} markerEnd="url(#arrMain)" />
          <path d={hbez(p("gen4img", "right"), p("shot1", "left"))} fill="none" stroke={PAL.main} strokeWidth={2} markerEnd="url(#arrMain)" />

          <path d={hbez(p("shot1", "right"), p("trim1", "left"))} fill="none" stroke={PAL.main} strokeWidth={1.5} markerEnd="url(#arrMain)" />
          <path d={hbez(p("trim1", "right"), p("extract1", "left"))} fill="none" stroke={PAL.main} strokeWidth={2} markerEnd="url(#arrMain)" />
          <path d={hbez(p("extract1", "right"), p("kling", "left"))} fill="none" stroke={PAL.main} strokeWidth={2} markerEnd="url(#arrMain)" />

          <path d={hbez(p("kling", "right"), p("trim2", "left"))} fill="none" stroke={PAL.main} strokeWidth={1.5} markerEnd="url(#arrMain)" />
          <path d={hbez(p("trim2", "right"), p("extract2", "left"))} fill="none" stroke={PAL.main} strokeWidth={2} markerEnd="url(#arrMain)" />
          <path d={hbez(p("extract2", "right"), p("shot3", "left"))} fill="none" stroke={PAL.main} strokeWidth={2} markerEnd="url(#arrMain)" />
          <path d={hbez(p("shot3", "right"), p("stitch", "left"))} fill="none" stroke={PAL.main} strokeWidth={2} markerEnd="url(#arrMain)" />

          <path
            d={vbez(p("trim1", "bottom"), p("lastFrame1", "top"))}
            fill="none"
            stroke={PAL.fall}
            strokeWidth={1.2}
            strokeDasharray="5,3"
            markerEnd="url(#arrFall)"
          />
          <path
            d={vbez(p("trim2", "bottom"), p("lastFrame2", "top"))}
            fill="none"
            stroke={PAL.fall}
            strokeWidth={1.2}
            strokeDasharray="5,3"
            markerEnd="url(#arrFall)"
          />

          <path
            d={hbez(p("lastFrame1", "right"), p("kling", "left"), 60)}
            fill="none"
            stroke={PAL.fall}
            strokeWidth={1.2}
            strokeDasharray="5,3"
            markerEnd="url(#arrFall)"
          />

          <path
            d={hbez(p("lastFrame2", "right"), p("shot3", "left"), 60)}
            fill="none"
            stroke={PAL.fall}
            strokeWidth={1.2}
            strokeDasharray="5,3"
            markerEnd="url(#arrFall)"
          />

          <path
            d={pipePath(
              p("gen4img", "bottom"),
              [N.kling.x + 28, N.kling.y + N.kling.h],
              PIPE_Y
            )}
            fill="none"
            stroke={PAL.anch}
            strokeWidth={1.1}
            strokeDasharray="6,4"
            markerEnd="url(#arrAnch)"
          />

          <path
            d={pipePath(
              [N.gen4img.x + N.gen4img.w - 28, N.gen4img.y + N.gen4img.h],
              [N.shot3.x + 28, N.shot3.y + N.shot3.h],
              PIPE_Y + 18
            )}
            fill="none"
            stroke={PAL.anch}
            strokeWidth={1.1}
            strokeDasharray="6,4"
            markerEnd="url(#arrAnch)"
          />

          <path
            d={vbez(p("shot1", "bottom"), p("qa1", "top"))}
            fill="none"
            stroke={PAL.qaW}
            strokeWidth={1}
            strokeDasharray="4,4"
            opacity={0.55}
            markerEnd="url(#arrQA)"
          />
          <path
            d={vbez(p("kling", "bottom"), p("qa2", "top"))}
            fill="none"
            stroke={PAL.qaW}
            strokeWidth={1}
            strokeDasharray="4,4"
            opacity={0.55}
            markerEnd="url(#arrQA)"
          />
          <path
            d={vbez(p("shot3", "bottom"), p("qa3", "top"))}
            fill="none"
            stroke={PAL.qaW}
            strokeWidth={1}
            strokeDasharray="4,4"
            opacity={0.55}
            markerEnd="url(#arrQA)"
          />

          <path
            d={vbez(p("jsonParse", "bottom"), p("contNote", "top"))}
            fill="none"
            stroke={PAL.help}
            strokeWidth={1}
            strokeDasharray="4,4"
            markerEnd="url(#arrHelp)"
          />
          <path
            d={hbez(p("contNote", "right"), p("audioNote", "left"), 40)}
            fill="none"
            stroke={PAL.help}
            strokeWidth={1}
            strokeDasharray="4,4"
            markerEnd="url(#arrHelp)"
          />
          <path
            d={hbez(p("audioNote", "right"), p("socialPack", "left"), 40)}
            fill="none"
            stroke={PAL.help}
            strokeWidth={1}
            strokeDasharray="4,4"
            markerEnd="url(#arrHelp)"
          />

          <Dot pt={p("trim1", "bottom")} color={PAL.fall} />
          <Dot pt={p("trim2", "bottom")} color={PAL.fall} />
          <Dot pt={p("gen4img", "bottom")} color={PAL.anch} />
          <Dot pt={p("shot1", "bottom")} color={PAL.qaW} />
          <Dot pt={p("kling", "bottom")} color={PAL.qaW} />
          <Dot pt={p("shot3", "bottom")} color={PAL.qaW} />
        </svg>

        <Cap x={20} y={64} text="Inputs" />
        <Cap x={196} y={100} text="AI Director" />
        <Cap x={382} y={14} text="Structured Output" />
        <Cap x={600} y={112} text="Image Chain" />
        <Cap x={796} y={104} text="Canonical Anchor" color="#7B5EA7" />
        <Cap x={1008} y={112} text="Shot 1 — Gen-4.5" />
        <Cap x={1572} y={104} text="Shot 2 — Kling 3.0 Pro" />
        <Cap x={2136} y={112} text="Shot 3 — Gen-4.5" />
        <Cap x={2334} y={116} text="Output" />
        <Cap x={1008} y={308} text="Fallback · QA Lane" color="#4A3A10" />
        <Cap x={600} y={488} text="Helper Notes" color="#1D2A3A" />

        <Box r={N.sys} bg={PAL.input} badge="Text" title="System" sub="Director persona · rules" />
        <Box r={N.usr} bg={PAL.input} badge="Text" title="User" sub="Scene brief · keywords" />
        <Box r={N.imgRef} bg={PAL.input} badge="Image" title="Reference" sub="Hero subject ref image" />

        <Box r={N.claude} bg={PAL.ai} badge="Claude" title="Claude" sub="Cinematic Sequence Generator" />

        <Box
          r={N.jsonParse}
          bg={PAL.json}
          badge="JSON Parse"
          title="JSON Parse"
          sub="13 structured outputs"
          fields={[
            "master_image_prompt",
            "shot1_video_prompt",
            "shot2_video_prompt",
            "shot2_audio_prompt",
            "shot3_video_prompt",
            "kling_negative_prompt",
            "character_lock",
            "motion_intensity.shot1",
            "motion_intensity.shot2",
            "motion_intensity.shot3",
            "operator_notes",
            "hook",
            "caption",
          ]}
        />

        <Box
          r={N.nano}
          bg={PAL.nano}
          badge="Nano Banana 2"
          title="Nano Banana 2"
          sub="Image gen · master still"
        />

        <Box
          r={N.gen4img}
          bg={PAL.anchor}
          accent
          badge="Gen-4 Image"
          title="Gen-4 Image"
          sub="Canonical Anchor · hero frame"
        />

        <Box
          r={N.shot1}
          bg={PAL.video}
          badge="Gen-4.5"
          title="Gen-4.5  Shot 1"
          sub="I2V · anchor image input"
        />

        <Box
          r={N.trim1}
          bg={PAL.trim}
          badge="Trim Video"
          title="Trim Video"
          sub="Clean clip before frame extract"
        />

        <Box
          r={N.extract1}
          bg={PAL.util}
          badge="Extract Frame"
          title="Extract Frame"
          sub="Preferred continuity handoff →"
        />

        <Box
          r={N.kling}
          bg={PAL.kling}
          badge="Kling 3.0 Pro"
          title="Kling 3.0 Pro"
          sub="Shot 2 · I2V"
        />

        <Box
          r={N.trim2}
          bg={PAL.trim}
          badge="Trim Video"
          title="Trim Video"
          sub="Clean clip before frame extract"
        />

        <Box
          r={N.extract2}
          bg={PAL.util}
          badge="Extract Frame"
          title="Extract Frame"
          sub="Preferred continuity handoff →"
        />

        <Box
          r={N.shot3}
          bg={PAL.video}
          badge="Gen-4.5"
          title="Gen-4.5  Shot 3"
          sub="I2V · closing beat"
        />

        <Box
          r={N.stitch}
          bg={PAL.stitch}
          badge="Stitch"
          title="Stitch"
          sub="Final sequence"
        />

        <Box
          r={N.lastFrame1}
          bg={PAL.last}
          badge="Last Frame"
          title="Last Frame"
          sub="Fallback after Trim Video"
          dim
        />
        <Box
          r={N.lastFrame2}
          bg={PAL.last}
          badge="Last Frame"
          title="Last Frame"
          sub="Fallback after Trim Video"
          dim
        />

        <Box
          r={N.qa1}
          bg={PAL.qa}
          badge="First Frame"
          title="First Frame"
          sub="QA — Shot 1 Start"
          dim
        />
        <Box
          r={N.qa2}
          bg={PAL.qa}
          badge="First Frame"
          title="First Frame"
          sub="QA — Shot 2 Start"
          dim
        />
        <Box
          r={N.qa3}
          bg={PAL.qa}
          badge="First Frame"
          title="First Frame"
          sub="QA — Shot 3 Start"
          dim
        />

        <Box
          r={N.contNote}
          bg={PAL.note}
          badge="Notes"
          dim
          title="Continuity Notes"
          sub="Character lock · motion plan · operator guidance"
          infoLines={[
            "character_lock  ·  verify before each shot",
            "motion_intensity.shot1 / .shot2 / .shot3",
            "operator_notes  ·  read before retry",
            "─────────────────────────────────",
            "Lock good nodes via ⋯ menu after QA pass.",
            "Seed-consistent retries: note seed in operator_notes.",
            "Anchor fallback order:",
            "  1 Extract Frame  (preferred)",
            "  2 Last Frame after Trim Video",
            "  3 Return to Gen-4 Image anchor",
          ]}
        />

        <Box
          r={N.audioNote}
          bg={PAL.note}
          badge="Notes"
          dim
          title="Audio Notes"
          sub="Kling native audio direction"
          infoLines={[
            "Use shot2_audio_prompt for Kling Shot 2.",
            "Paste into Kling audio field if available.",
            "Match ambience to habitat and action beat.",
          ]}
        />

        <Box
          r={N.socialPack}
          bg={PAL.note}
          badge="Notes"
          dim
          title="Social Pack"
          sub="hook · caption · format"
          infoLines={[
            "hook  →  first 1.5 s overlay text",
            "caption  →  post body copy",
            "Export: 9:16 · 1080p · ≤ 60 s",
          ]}
        />

        <div
          style={{
            position: "absolute",
            left: 20,
            bottom: 18,
            display: "flex",
            gap: 20,
            alignItems: "center",
          }}
        >
          {(
            [
              { color: PAL.main, dash: false, label: "Main pipeline" },
              { color: PAL.fall, dash: true, label: "Last Frame fallback" },
              { color: PAL.anch, dash: true, label: "Canonical Anchor fallback" },
              { color: PAL.qaW, dash: true, label: "First Frame QA" },
              { color: PAL.help, dash: true, label: "Helper notes" },
            ] as { color: string; dash: boolean; label: string }[]
          ).map(({ color, dash, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg width={28} height={10}>
                <line
                  x1={0}
                  y1={5}
                  x2={28}
                  y2={5}
                  stroke={color}
                  strokeWidth={dash ? 1.2 : 1.8}
                  strokeDasharray={dash ? "5,3" : undefined}
                />
              </svg>
              <span style={{ fontSize: 8.5, color: "#2C3D50" }}>{label}</span>
            </div>
          ))}
        </div>

        <div
          style={{
            position: "absolute",
            left: 20,
            top: 14,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#1E2F42",
          }}
        >
          Wild Stories TV · AI Cinematic Pipeline
        </div>
      </div>
    </div>
  );
}
