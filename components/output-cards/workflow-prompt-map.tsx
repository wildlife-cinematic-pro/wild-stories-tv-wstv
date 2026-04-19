"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";

import type { GeneratedPackage } from "@/types";

import {
  getImagePromptCard,
  getPromptCardForEngine,
  getWorkflowPromptCard,
  safeText,
} from "@/components/output-cards/prompt-utils";

function deriveDriftLabel(
  clipChaining?: string
): { label: string; pill: string } {
  const text = (clipChaining ?? "").toUpperCase();

  if (text.includes("HIGH")) {
    return {
      label: "HIGH Drift — use all 6 steps",
      pill: "bg-red-100 text-red-700",
    };
  }

  if (text.includes("LOW")) {
    return {
      label: "LOW Drift — 3 steps ok",
      pill: "bg-green-100 text-green-700",
    };
  }

  if (text.includes("MEDIUM")) {
    return {
      label: "MEDIUM Drift — recommend all steps",
      pill: "bg-amber-100 text-amber-800",
    };
  }

  return { label: "Drift — unknown", pill: "bg-gray-100 text-gray-700" };
}

function WorkflowCard({
  step,
  title,
  badge,
  color,
  help,
  children,
  done,
  onToggle,
}: {
  step: number;
  title: string;
  badge: string;
  color: { border: string; bg: string; badge: string };
  help: string;
  children: ReactNode;
  done: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`rounded-2xl border-2 ${color.border} ${color.bg} p-4 shadow-sm`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">
            {step}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-extrabold text-gray-900">{title}</h3>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${color.badge}`}
              >
                {badge}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-600">{help}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggle}
          title="Mark done"
          aria-label="Mark done"
          className={`h-5 w-5 rounded border ${
            done ? "border-gray-900 bg-gray-900" : "border-gray-300 bg-white"
          }`}
        />
      </div>

      {children}
    </div>
  );
}

function TextBox({ value }: { value: string }) {
  return (
    <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-xl border border-gray-200 bg-white p-3 text-xs leading-relaxed text-gray-800">
      {value || "—"}
    </pre>
  );
}

export function WorkflowPromptMap({
  data,
  onCopy,
}: {
  data: GeneratedPackage;
  onCopy: (text: string) => void;
}) {
  type WorkflowMode = "seedance" | "runway" | "kling" | "hybrid";
  type WorkflowAction = {
    label: string;
    value: string;
    secondary?: boolean;
  };
  type WorkflowItem = {
    step: number;
    title: string;
    badge: string;
    color: { border: string; bg: string; badge: string };
    help: string;
    value: string;
    actions: WorkflowAction[];
  };
  type WorkflowConfig = {
    pipeline: string;
    bannerTitle: string;
    bannerBody: string;
    steps: WorkflowItem[];
  };

  const seedanceShots = (data.seedanceShots ?? []).map(safeText);
  const runwayShots = (data.runwayShots ?? []).map(safeText);
  const klingShots = (data.klingShots ?? []).map(safeText);
  const imagePrompt = safeText(data.imagePrompt);
  const imagePromptCard = getImagePromptCard(data);
  const seedancePromptCards = seedanceShots.map((_, index) =>
    getPromptCardForEngine(data, "seedance", index)
  );
  const runwayPromptCards = runwayShots.map((_, index) =>
    getPromptCardForEngine(data, "runway", index)
  );
  const klingPromptCards = klingShots.map((_, index) =>
    getPromptCardForEngine(data, "kling", index)
  );
  const workflowPromptCards = (data.shotPlan ?? []).map((_, index) =>
    getWorkflowPromptCard(data, index)
  );
  const seedanceWorkflowGuide = safeText(data.seedanceWorkflowGuide ?? "");
  const routingNote = safeText(data.routingNote ?? "");

  const drift = deriveDriftLabel(data.clipChaining);

  const emptyDone = {
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false,
  };

  const [mode, setMode] = useState<WorkflowMode>("hybrid");
  const [doneByMode, setDoneByMode] = useState<
    Record<WorkflowMode, Record<number, boolean>>
  >({
    seedance: { ...emptyDone },
    runway: { ...emptyDone },
    kling: { ...emptyDone },
    hybrid: { ...emptyDone },
  });
  const [activeStepByMode, setActiveStepByMode] = useState<
    Record<WorkflowMode, number>
  >({
    seedance: 1,
    runway: 1,
    kling: 1,
    hybrid: 1,
  });

  const stepRefs = useRef<Record<number, HTMLDivElement | null>>({
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
    6: null,
  });

  const done = doneByMode[mode];

  const copiedCount = useMemo(
    () => Object.values(done).filter(Boolean).length,
    [done]
  );

  const workflows = useMemo<Record<WorkflowMode, WorkflowConfig>>(() => {
    const imageCardColor = {
      border: "border-amber-400",
      bg: "bg-amber-50",
      badge: "bg-amber-100 text-amber-700",
    };
    const seedanceColor = {
      border: "border-orange-400",
      bg: "bg-orange-50",
      badge: "bg-orange-100 text-orange-700",
    };
    const runwayColor = {
      border: "border-green-400",
      bg: "bg-green-50",
      badge: "bg-green-100 text-green-700",
    };
    const klingColor = {
      border: "border-blue-400",
      bg: "bg-blue-50",
      badge: "bg-blue-100 text-blue-700",
    };
    const guideColor = {
      border: "border-sky-400",
      bg: "bg-sky-50",
      badge: "bg-sky-100 text-sky-700",
    };
    const hybridColor = {
      border: "border-indigo-400",
      bg: "bg-indigo-50",
      badge: "bg-indigo-100 text-indigo-700",
    };

    const imageStep: WorkflowItem = {
      step: 1,
      title: "Image Prompt",
      badge: "Nano Banana 2 / Gemini",
      color: imageCardColor,
      help: "Generate the master hero still first with the Nano Banana image prompt, then use that image or a continuity-safe edited frame as the visual base for the next engine.",
      value: imagePrompt,
      actions: [
        { label: "Copy Image Prompt", value: imagePrompt },
        {
          label: "Copy BODY",
          value: imagePromptCard.pasteReady,
          secondary: true,
        },
      ],
    };

    const runwayGuide = [
      "OPTIONAL RUNWAY 4-SHOT WORKFLOW",
      "Use this when you intentionally want the optional full Runway 4-shot bundle.",
      "1. Upload the master still or a clean continuity-safe handoff frame into Runway I2V.",
      "2. Keep the prompt motion-first: motion, camera, physics, and spacing.",
      "3. Default WSTV Runway flow is 4 separate shots at 5 seconds each.",
      "4. Use Shot 1 for opening tension, Shot 2 for pressure build, Shot 3 for peak action, Shot 4 for resolved tension.",
      "5. Chain from the previous last frame only when the outgoing frame is still a clean full-body handoff frame.",
      "6. Use 24 or 25 FPS.",
      "7. Negative prompts do not work in Runway.",
    ].join("\n");

    const klingGuide = [
      "OPTIONAL KLING 4-SHOT WORKFLOW",
      "Use this when you intentionally want the optional full Kling 4-shot bundle.",
      "1. Use the continuity image as the motion reference and keep visual restatement light.",
      "2. Enable Bind Subject when identity lock matters.",
      "3. Default WSTV Kling flow is 4 separate shots at 5 seconds each.",
      "4. Keep framing wide and full-body readable across all four shots.",
      "5. Shot 1 = opening tension, Shot 2 = pressure build, Shot 3 = peak action, Shot 4 = resolved tension.",
      "6. Motion intensity can rise from Shot 1 to Shot 3, then settle in Shot 4.",
      "7. Kling negative prompts are optional, but only use them when actually needed.",
    ].join("\n");

    const hybridGuide = [
      "PRIMARY HYBRID 4-SHOT ROUTING",
      "This is the main WSTV production path.",
      "1. Generate the master still first.",
      "2. Shot 1 uses Runway for the clean readable opening tension.",
      "3. Shot 2 uses Kling for pressure build.",
      "4. Shot 3 uses Kling for peak action.",
      "5. Shot 4 returns to Runway for the clean readable resolved tension.",
      "6. Keep continuity-safe edited images between every shot handoff.",
      routingNote || "Routing note: Runway 1 → Kling 2-3 → Runway 4.",
    ].join("\n");

    return {
      seedance: {
        pipeline:
          "Image Prompt → Master Still → Seedance Shot 1 Opening Tension → Seedance Shot 2 Pressure Build → Seedance Shot 3 Peak Action → Seedance Shot 4 Resolved Tension → CapCut",
        bannerTitle: "Optional Seedance 2.0 bundle",
        bannerBody:
          "Optional full Seedance 4-shot bundle. Keep prompts motion-first, simple, and direct. Use Prompt + First Frame as the base, add Ref Image / Ref Video only when needed, and default to 4 separate 5-second shots.",
        steps: [
          imageStep,
          {
            step: 2,
            title: "Seedance Shot 1 — Opening Tension",
            badge: "Seedance 2.0",
            color: seedanceColor,
            help: "Use the clean opening frame in First Frame. Keep Prompt focused on subject movement, background movement, and camera movement only.",
            value: seedanceShots[0] ?? "",
            actions: [
              {
                label: "Copy Seedance Shot 1 BODY",
                value: seedancePromptCards[0]?.pasteReady ?? "",
              },
            ],
          },
          {
            step: 3,
            title: "Seedance Shot 2 — Pressure Build",
            badge: "Seedance 2.0",
            color: seedanceColor,
            help: "Let the tension rise without chaotic overlap. Use clear motion adverbs and camera language so the pressure build stays readable and forceful.",
            value: seedanceShots[1] ?? "",
            actions: [
              {
                label: "Copy Seedance Shot 2 BODY",
                value: seedancePromptCards[1]?.pasteReady ?? "",
              },
            ],
          },
          {
            step: 4,
            title: "Seedance Shot 3 — Peak Action",
            badge: "Seedance 2.0",
            color: seedanceColor,
            help: "This is the strongest action beat. Keep body mechanics readable, motion grounded, and spacing clear even when the scene speeds up.",
            value: seedanceShots[2] ?? "",
            actions: [
              {
                label: "Copy Seedance Shot 3 BODY",
                value: seedancePromptCards[2]?.pasteReady ?? "",
              },
            ],
          },
          {
            step: 5,
            title: "Seedance Shot 4 — Resolved Tension",
            badge: "Seedance 2.0",
            color: seedanceColor,
            help: "Resolve the motion cleanly and keep the closing frame continuity-safe. Use a simple readable settle instead of adding a new major action.",
            value: seedanceShots[3] ?? "",
            actions: [
              {
                label: "Copy Seedance Shot 4 BODY",
                value: seedancePromptCards[3]?.pasteReady ?? "",
              },
            ],
          },
          {
            step: 6,
            title: "Seedance Prompt Rules",
            badge: "WSTV guide",
            color: guideColor,
            help: "Use these rules while editing Seedance 2.0 prompts. Public prompt guidance is limited, so keep the wording simple, movement-led, and continuity-safe.",
            value: seedanceWorkflowGuide,
            actions: [
              {
                label: "Copy Seedance Rules",
                value: seedanceWorkflowGuide,
              },
            ],
          },
        ],
      },
      runway: {
        pipeline:
          "Image Prompt → Master Still → Runway Shot 1 Opening Tension → Runway Shot 2 Pressure Build → Runway Shot 3 Peak Action → Runway Shot 4 Resolved Tension → CapCut",
        bannerTitle: "Optional Runway bundle",
        bannerBody:
          "Optional full Runway 4-shot bundle. Runway I2V is motion-first and identity comes from the uploaded image. Keep prompts continuity-safe, use 4 separate 5-second shots, and do not use negative prompts.",
        steps: [
          imageStep,
          {
            step: 2,
            title: "Runway Shot 1 — Opening Tension",
            badge: "Runway",
            color: runwayColor,
            help: "Use the clean master still or opening continuity frame. Keep both subjects readable from frame one.",
            value: runwayShots[0] ?? "",
            actions: [
              {
                label: "Copy Runway Shot 1 BODY",
                value: runwayPromptCards[0]?.pasteReady ?? "",
              },
            ],
          },
          {
            step: 3,
            title: "Runway Shot 2 — Pressure Build",
            badge: "Runway",
            color: runwayColor,
            help: "Build forward pressure gradually with clean spacing and a controlled tracking move.",
            value: runwayShots[1] ?? "",
            actions: [
              {
                label: "Copy Runway Shot 2 BODY",
                value: runwayPromptCards[1]?.pasteReady ?? "",
              },
            ],
          },
          {
            step: 4,
            title: "Runway Shot 3 — Peak Action",
            badge: "Runway",
            color: runwayColor,
            help: "This is the strongest Runway action beat. Keep motion forceful but still readable and continuity-safe.",
            value: runwayShots[2] ?? "",
            actions: [
              {
                label: "Copy Runway Shot 3 BODY",
                value: runwayPromptCards[2]?.pasteReady ?? "",
              },
            ],
          },
          {
            step: 5,
            title: "Runway Shot 4 — Resolved Tension",
            badge: "Runway",
            color: runwayColor,
            help: "Use a clean readable settle with stable spacing for the final frame family.",
            value: runwayShots[3] ?? "",
            actions: [
              {
                label: "Copy Runway Shot 4 BODY",
                value: runwayPromptCards[3]?.pasteReady ?? "",
              },
            ],
          },
          {
            step: 6,
            title: "Runway Prompt Rules",
            badge: "WSTV guide",
            color: guideColor,
            help: "Use these rules while editing Runway prompts. Identity lives in the image and negative prompts do not work.",
            value: runwayGuide,
            actions: [{ label: "Copy Runway Rules", value: runwayGuide }],
          },
        ],
      },
      kling: {
        pipeline:
          "Image Prompt → Master Still → Kling Shot 1 Opening Tension → Kling Shot 2 Pressure Build → Kling Shot 3 Peak Action → Kling Shot 4 Resolved Tension → CapCut",
        bannerTitle: "Optional Kling bundle",
        bannerBody:
          "Optional full Kling 4-shot bundle. Keep prompts movement-led, keep wide full-body readability, enable Bind Subject when needed, and use 4 separate 5-second shots.",
        steps: [
          imageStep,
          {
            step: 2,
            title: "Kling Shot 1 — Opening Tension",
            badge: "Kling",
            color: klingColor,
            help: "Start with a readable wide opening and immediate visible tension from frame one.",
            value: klingShots[0] ?? "",
            actions: [
              {
                label: "Copy Kling Shot 1 BODY",
                value: klingPromptCards[0]?.pasteReady ?? "",
              },
            ],
          },
          {
            step: 3,
            title: "Kling Shot 2 — Pressure Build",
            badge: "Kling",
            color: klingColor,
            help: "Use Kling for stronger physics-safe pressure build while keeping full-body readability.",
            value: klingShots[1] ?? "",
            actions: [
              {
                label: "Copy Kling Shot 2 BODY",
                value: klingPromptCards[1]?.pasteReady ?? "",
              },
            ],
          },
          {
            step: 4,
            title: "Kling Shot 3 — Peak Action",
            badge: "Kling",
            color: klingColor,
            help: "This is the strongest Kling action beat. Let the force rise, but keep spacing and body mechanics readable.",
            value: klingShots[2] ?? "",
            actions: [
              {
                label: "Copy Kling Shot 3 BODY",
                value: klingPromptCards[2]?.pasteReady ?? "",
              },
            ],
          },
          {
            step: 5,
            title: "Kling Shot 4 — Resolved Tension",
            badge: "Kling",
            color: klingColor,
            help: "Settle the action cleanly and keep the end pose readable and continuity-safe.",
            value: klingShots[3] ?? "",
            actions: [
              {
                label: "Copy Kling Shot 4 BODY",
                value: klingPromptCards[3]?.pasteReady ?? "",
              },
            ],
          },
          {
            step: 6,
            title: "Kling Prompt Rules",
            badge: "WSTV guide",
            color: guideColor,
            help: "Use these rules while editing Kling prompts. Keep it wide, readable, and continuity-safe.",
            value: klingGuide,
            actions: [{ label: "Copy Kling Rules", value: klingGuide }],
          },
        ],
      },
      hybrid: {
        pipeline:
          "Image Prompt → Master Still → Runway Shot 1 Opening Tension → Kling Shot 2 Pressure Build → Kling Shot 3 Peak Action → Runway Shot 4 Resolved Tension → CapCut",
        bannerTitle: "Primary hybrid 4-shot route",
        bannerBody:
          "This is the main WSTV production path. Use Runway for the clean opening and final settle, and Kling for Shot 2-3 pressure/action physics.",
        steps: [
          imageStep,
          {
            step: 2,
            title: "Hybrid Shot 1 — Runway Opening Tension",
            badge: "Runway",
            color: runwayColor,
            help: "Start with Runway for the cleanest first-frame readability and opening tension.",
            value: runwayShots[0] ?? "",
            actions: [
              {
                label: "Copy Hybrid Shot 1 BODY",
                value:
                  workflowPromptCards[0]?.pasteReady ??
                  runwayPromptCards[0]?.pasteReady ??
                  "",
              },
            ],
          },
          {
            step: 3,
            title: "Hybrid Shot 2 — Kling Pressure Build",
            badge: "Kling",
            color: klingColor,
            help: "Switch to Kling here for pressure build with stronger physics and readable body mechanics.",
            value: klingShots[1] ?? "",
            actions: [
              {
                label: "Copy Hybrid Shot 2 BODY",
                value:
                  workflowPromptCards[1]?.pasteReady ??
                  klingPromptCards[1]?.pasteReady ??
                  "",
              },
            ],
          },
          {
            step: 4,
            title: "Hybrid Shot 3 — Kling Peak Action",
            badge: "Kling",
            color: klingColor,
            help: "Keep Kling for the strongest action beat before handing the final settle back to Runway.",
            value: klingShots[2] ?? "",
            actions: [
              {
                label: "Copy Hybrid Shot 3 BODY",
                value:
                  workflowPromptCards[2]?.pasteReady ??
                  klingPromptCards[2]?.pasteReady ??
                  "",
              },
            ],
          },
          {
            step: 5,
            title: "Hybrid Shot 4 — Runway Resolved Tension",
            badge: "Runway",
            color: runwayColor,
            help: "Return to Runway for the clean readable final resolve and stable continuity-safe ending.",
            value: runwayShots[3] ?? "",
            actions: [
              {
                label: "Copy Hybrid Shot 4 BODY",
                value:
                  workflowPromptCards[3]?.pasteReady ??
                  runwayPromptCards[3]?.pasteReady ??
                  "",
              },
            ],
          },
          {
            step: 6,
            title: "Hybrid Routing Rules",
            badge: "Hybrid guide",
            color: hybridColor,
            help: "This pane shows the recommended engine handoff for the current WSTV hybrid workflow.",
            value: hybridGuide,
            actions: [{ label: "Copy Hybrid Rules", value: hybridGuide }],
          },
        ],
      },
    };
  }, [
    imagePrompt,
    imagePromptCard,
    klingPromptCards,
    klingShots,
    routingNote,
    runwayPromptCards,
    runwayShots,
    seedancePromptCards,
    seedanceShots,
    seedanceWorkflowGuide,
    workflowPromptCards,
  ]);

  const currentWorkflow = workflows[mode];
  const pipeline = currentWorkflow.pipeline;

  function scrollToStep(step: number) {
    const element = stepRefs.current[step];
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function nextStepOf(step: number) {
    if (step >= 6) return 6;
    return step + 1;
  }

  function toggle(step: number) {
    const nextValue = !done[step];

    setDoneByMode((previous) => ({
      ...previous,
      [mode]: { ...previous[mode], [step]: nextValue },
    }));

    const nextStep = nextValue ? nextStepOf(step) : step;
    setActiveStepByMode((previous) => ({ ...previous, [mode]: nextStep }));
    window.setTimeout(() => scrollToStep(nextStep), 50);
  }

  function resetAll() {
    setDoneByMode((previous) => ({ ...previous, [mode]: { ...emptyDone } }));
    setActiveStepByMode((previous) => ({ ...previous, [mode]: 1 }));
    window.setTimeout(() => scrollToStep(1), 50);
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-extrabold text-gray-900">
            WSTV Prompt Workflow Tracker
          </h2>
          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
            {copiedCount}/6 done
          </span>
          <span
            className={`inline-flex items-center gap-2 rounded px-2 py-0.5 text-xs font-bold ${drift.pill}`}
          >
            <span className="inline-block h-3 w-3 rounded-full bg-current opacity-30" />
            {drift.label}
          </span>
        </div>

        <button
          type="button"
          onClick={resetAll}
          className="text-xs font-semibold text-gray-500 hover:text-gray-800"
        >
          Reset
        </button>
      </div>

      <div className="mb-3 rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-xs text-indigo-800">
        <strong>Pipeline:</strong> {pipeline}
      </div>

      <div className="mb-4 rounded-xl border border-orange-200 bg-orange-50 p-3 text-xs text-orange-800">
        <strong>{currentWorkflow.bannerTitle}:</strong>{" "}
        {currentWorkflow.bannerBody}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {currentWorkflow.steps.map((item) => (
          <div
            key={`${mode}-${item.step}`}
            ref={(element) => {
              stepRefs.current[item.step] = element;
            }}
          >
            <WorkflowCard
              step={item.step}
              title={item.title}
              badge={item.badge}
              color={item.color}
              help={item.help}
              done={done[item.step]}
              onToggle={() => toggle(item.step)}
            >
              <TextBox value={item.value} />
              <div className="mt-3 flex flex-wrap gap-2">
                {item.actions.map((action) => (
                  <button
                    key={`${mode}-${item.step}-${action.label}`}
                    type="button"
                    onClick={() => onCopy(action.value)}
                    className={
                      action.secondary
                        ? "flex-1 rounded-lg border border-amber-300 bg-white py-2 text-xs font-bold text-amber-800 hover:bg-amber-50 active:scale-[0.99]"
                        : `${item.actions.length > 1 ? "flex-1 " : "w-full "}rounded-lg bg-gray-900 py-2 text-xs font-bold text-white hover:bg-black active:scale-[0.99]`
                    }
                  >
                    📋 {action.label}
                  </button>
                ))}
              </div>
            </WorkflowCard>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {[
          { key: "hybrid", label: "Hybrid Primary" },
          { key: "seedance", label: "Seedance Optional" },
          { key: "runway", label: "Runway Optional" },
          { key: "kling", label: "Kling Optional" },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => {
              const nextMode = item.key as WorkflowMode;
              setMode(nextMode);
              window.setTimeout(() => {
                scrollToStep(activeStepByMode[nextMode] ?? 1);
              }, 50);
            }}
            className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${
              mode === item.key
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
