import type { DurationLane, Engine, KlingModel, RunwayModel } from "@/types";

export type DurationLaneShotConfig = {
  shot: 1 | 2 | 3 | 4;
  engine: Engine;
  generationSeconds: 5 | 10;
  editTimeline: string;
  title: string;
  why: string;
};

export type DurationLaneConfig = {
  lane: DurationLane;
  shortLabel: string;
  selectLabel: string;
  totalEditLabel: string;
  routeTimingLabel: string;
  summary: string;
  optionalFinalEditNote?: string;
  shots: [
    DurationLaneShotConfig,
    DurationLaneShotConfig,
    DurationLaneShotConfig,
    DurationLaneShotConfig,
  ];
};

export const LONG_LANE_OPTIONAL_EDIT_NOTE =
  "Optional final edit can reach 45–50s using clean holds, slow pull-back, sound design, and selected frame holds.";

const DURATION_LANE_CONFIGS: Record<DurationLane, DurationLaneConfig> = {
  short: {
    lane: "short",
    shortLabel: "Short",
    selectLabel: "Short — 20s final edit",
    totalEditLabel: "20s final edit",
    routeTimingLabel: "Runway 5 / Kling 5 / Kling 5 / Runway 5",
    summary:
      "Fast daily hybrid lane for clear first-frame readability, quick escalation, and a clean 20-second finish.",
    shots: [
      {
        shot: 1,
        engine: "RUNWAY",
        generationSeconds: 5,
        editTimeline: "0–5s",
        title: "Shot 1 — Opening Tension",
        why: "Use Image 1 from the master image for the clean first-frame opening.",
      },
      {
        shot: 2,
        engine: "KLING",
        generationSeconds: 5,
        editTimeline: "5–10s",
        title: "Shot 2 — Pressure Build",
        why: "Use Image 2 edited from Shot 1 image for a stronger physics-safe pressure build without losing identity.",
      },
      {
        shot: 3,
        engine: "KLING",
        generationSeconds: 5,
        editTimeline: "10–15s",
        title: "Shot 3 — Peak Action",
        why: "Use Image 3 edited from Shot 2 image for the strongest full-body action beat.",
      },
      {
        shot: 4,
        engine: "RUNWAY",
        generationSeconds: 5,
        editTimeline: "15–20s",
        title: "Shot 4 — Resolved Tension",
        why: "Use Image 4 edited from Shot 3 image for the readable aftermath or final tension hold.",
      },
    ],
  },
  medium: {
    lane: "medium",
    shortLabel: "Medium",
    selectLabel: "Medium — 35s final edit",
    totalEditLabel: "35s final edit",
    routeTimingLabel: "Runway 10 / Kling 10 / Kling 10 / Runway 5",
    summary:
      "Balanced hybrid lane for stronger setup and action buildup while still keeping the daily edit fast to finish.",
    shots: [
      {
        shot: 1,
        engine: "RUNWAY",
        generationSeconds: 10,
        editTimeline: "0–10s",
        title: "Shot 1 — Opening Tension",
        why: "Use Image 1 from the master image for the longer readable opening tension and first-frame clarity beat.",
      },
      {
        shot: 2,
        engine: "KLING",
        generationSeconds: 10,
        editTimeline: "10–20s",
        title: "Shot 2 — Pressure Build",
        why: "Use Image 2 edited from Shot 1 image for a slower readable pressure build with stronger spacing collapse and continuity-safe body language.",
      },
      {
        shot: 3,
        engine: "KLING",
        generationSeconds: 10,
        editTimeline: "20–30s",
        title: "Shot 3 — Main Action Payoff",
        why: "Use Image 3 edited from Shot 2 image for the clearest readable payoff with one dominant action beat and a safe handoff into the resolve.",
      },
      {
        shot: 4,
        engine: "RUNWAY",
        generationSeconds: 5,
        editTimeline: "30–35s",
        title: "Shot 4 — Aftermath Resolve",
        why: "Use Image 4 edited from Shot 3 image for a clean 5-second aftermath hold, retreat, or stare-down resolve.",
      },
    ],
  },
  long: {
    lane: "long",
    shortLabel: "Long",
    selectLabel: "Long — 40s safe generation",
    totalEditLabel: "40s safe generation",
    routeTimingLabel: "Runway 10 / Kling 10 / Kling 10 / Runway 10",
    summary:
      "Extended hybrid lane for slower readable setup, longer pressure build, cleaner payoff, and a true 40-second generated base.",
    optionalFinalEditNote: LONG_LANE_OPTIONAL_EDIT_NOTE,
    shots: [
      {
        shot: 1,
        engine: "RUNWAY",
        generationSeconds: 10,
        editTimeline: "0–10s",
        title: "Shot 1 — Opening Tension",
        why: "Use Image 1 from the master image for the readable 10-second opening tension and first-frame clarity beat.",
      },
      {
        shot: 2,
        engine: "KLING",
        generationSeconds: 10,
        editTimeline: "10–20s",
        title: "Shot 2 — Pressure Build",
        why: "Use Image 2 edited from Shot 1 image for the slower 10-second pressure build with wider spacing collapse and stronger continuity-safe body language.",
      },
      {
        shot: 3,
        engine: "KLING",
        generationSeconds: 10,
        editTimeline: "20–30s",
        title: "Shot 3 — Main Action Payoff",
        why: "Use Image 3 edited from Shot 2 image for the 10-second main action payoff with the clearest readable force transfer.",
      },
      {
        shot: 4,
        engine: "RUNWAY",
        generationSeconds: 10,
        editTimeline: "30–40s",
        title: "Shot 4 — Aftermath Resolve",
        why: "Use Image 4 edited from Shot 3 image for the 10-second aftermath hold, winner or retreat resolve, and clean final-frame handoff.",
      },
    ],
  },
};

export function isDurationLane(value: unknown): value is DurationLane {
  return value === "short" || value === "medium" || value === "long";
}

export function getDurationLaneConfig(lane: DurationLane): DurationLaneConfig {
  return DURATION_LANE_CONFIGS[lane];
}

export function formatDurationLaneLabel(lane: DurationLane): string {
  return getDurationLaneConfig(lane).shortLabel;
}

export function getDurationLanePerformanceTargets(lane: DurationLane): {
  averageWatchTimeSeconds: number;
  completionRate: number;
} {
  switch (lane) {
    case "medium":
      return { averageWatchTimeSeconds: 28, completionRate: 0.66 };
    case "long":
      return { averageWatchTimeSeconds: 45, completionRate: 0.62 };
    default:
      return { averageWatchTimeSeconds: 18, completionRate: 0.7 };
  }
}

export function buildDurationLaneRoutingNote(
  lane: DurationLane,
  runwayModel: RunwayModel,
  klingModel: KlingModel
): string {
  const config = getDurationLaneConfig(lane);
  const sentence = `Primary workflow: hybrid 4-shot routing uses Runway ${runwayModel} for Shot 1 (${config.shots[0].generationSeconds}s) and Shot 4 (${config.shots[3].generationSeconds}s), and ${klingModel} for Shot 2 (${config.shots[1].generationSeconds}s) and Shot 3 (${config.shots[2].generationSeconds}s). ${config.summary}`;

  return config.optionalFinalEditNote
    ? `${sentence} ${config.optionalFinalEditNote}`
    : sentence;
}
