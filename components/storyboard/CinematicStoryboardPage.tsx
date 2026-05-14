"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import CopyButton from "@/components/storyboard/copy-button";
import {
  buildCinematicStoryboard,
  type CinematicStoryboardInput,
  type StoryboardShot,
} from "@/lib/storyboard-shot-builder";
import {
  EncounterMode,
  EndingMode,
  HabitatRegion,
  StoryMode,
  ViralLane,
  ViolenceLevel,
  type ActionStylePreset,
  type AnimalVibe,
  type Arc,
  type CameraAnglePreset,
  type ContentLane,
  type DepthMode,
  type EmotionalTone,
  type EscapeDirection,
  type HookFamily,
  type OffspringLabel,
  type Season,
  type StrikeMethod,
  type TimeOfDay,
  type Weather,
  type WeatherHazard,
} from "@/types";

const STORYBOARD_HANDOFF_KEY = "wstv-storyboard-handoff";

type HandoffPayload = CinematicStoryboardInput & {
  source?: string;
  leadAnimal?: string;
  opposingAnimal?: string;
  environment?: string;
  lighting?: string;
  createdAt?: string;
};

function enumValue<T extends Record<string, string | number>>(
  source: T,
  value: string | null | undefined
): T[keyof T] | undefined {
  if (!value) return undefined;
  return Object.values(source).includes(value as T[keyof T]) ? (value as T[keyof T]) : undefined;
}

function textValue(value: string | null | undefined) {
  return value?.trim() || undefined;
}

function booleanValue(value: string | null | undefined) {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function numberValue(value: string | null | undefined) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function handoffToInput(payload: HandoffPayload | null): CinematicStoryboardInput {
  if (!payload) return {};

  return {
    storyMode: payload.storyMode,
    subjectA: payload.subjectA ?? payload.leadAnimal ?? payload.predator,
    subjectB: payload.subjectB ?? payload.opposingAnimal ?? payload.prey,
    predator: payload.predator ?? payload.leadAnimal,
    prey: payload.prey ?? payload.opposingAnimal,
    habitatRegion: payload.habitatRegion,
    season: payload.season,
    timeOfDay: payload.timeOfDay,
    actionStyle: payload.actionStyle,
    animalVibe: payload.animalVibe,
    arc: payload.arc,
    cameraAnglePreset: payload.cameraAnglePreset,
    contentLane: payload.contentLane,
    depthMode: payload.depthMode,
    emotionalTone: payload.emotionalTone,
    encounterMode: payload.encounterMode,
    endingMode: payload.endingMode,
    hookMode: payload.hookMode,
    viralLane: payload.viralLane,
    violenceLevel: payload.violenceLevel,
    weather: (payload.weather ?? payload.lighting) as Weather | undefined,
    groupCount: payload.groupCount,
    offspringLabel: payload.offspringLabel,
    strikeMethod: payload.strikeMethod,
    escapeDirection: payload.escapeDirection,
    weatherHazard: payload.weatherHazard,
    rutSeason: payload.rutSeason,
    foodItem: payload.foodItem,
    finalEnvironment: payload.finalEnvironment ?? payload.environment,
    sceneDescription: payload.sceneDescription,
    strictOriginalityGuard: payload.strictOriginalityGuard,
  };
}

function paramsToInput(params: URLSearchParams): CinematicStoryboardInput {
  const violence = numberValue(params.get("violenceLevel"));

  return {
    storyMode: enumValue(StoryMode, params.get("storyMode")) as StoryMode | undefined,
    subjectA: textValue(params.get("subjectA")),
    subjectB: textValue(params.get("subjectB")),
    predator: textValue(params.get("predator")),
    prey: textValue(params.get("prey")),
    habitatRegion: enumValue(HabitatRegion, params.get("habitatRegion")) as HabitatRegion | undefined,
    season: textValue(params.get("season")) as Season | undefined,
    timeOfDay: textValue(params.get("timeOfDay")) as TimeOfDay | undefined,
    actionStyle: textValue(params.get("actionStyle")) as ActionStylePreset | undefined,
    animalVibe: textValue(params.get("animalVibe")) as AnimalVibe | undefined,
    arc: textValue(params.get("arc")) as Arc | undefined,
    cameraAnglePreset: textValue(params.get("cameraAnglePreset")) as CameraAnglePreset | undefined,
    contentLane: textValue(params.get("contentLane")) as ContentLane | undefined,
    depthMode: textValue(params.get("depthMode")) as DepthMode | undefined,
    emotionalTone: textValue(params.get("emotionalTone")) as EmotionalTone | undefined,
    encounterMode: enumValue(EncounterMode, params.get("encounterMode")) as EncounterMode | undefined,
    endingMode: enumValue(EndingMode, params.get("endingMode")) as EndingMode | undefined,
    hookMode: textValue(params.get("hookMode")) as HookFamily | "all" | undefined,
    viralLane: enumValue(ViralLane, params.get("viralLane")) as ViralLane | undefined,
    violenceLevel:
      violence === ViolenceLevel.DISPLAY_ONLY ||
      violence === ViolenceLevel.IMPLIED_PRESSURE ||
      violence === ViolenceLevel.NON_GRAPHIC_STRUGGLE
        ? violence
        : undefined,
    weather: textValue(params.get("weather")) as Weather | undefined,
    groupCount: numberValue(params.get("groupCount")),
    offspringLabel: textValue(params.get("offspringLabel")) as OffspringLabel | undefined,
    strikeMethod: textValue(params.get("strikeMethod")) as StrikeMethod | undefined,
    escapeDirection: textValue(params.get("escapeDirection")) as EscapeDirection | undefined,
    weatherHazard: textValue(params.get("weatherHazard")) as WeatherHazard | undefined,
    rutSeason: booleanValue(params.get("rutSeason")),
    foodItem: textValue(params.get("foodItem")),
    finalEnvironment: textValue(params.get("finalEnvironment")),
    sceneDescription: textValue(params.get("sceneDescription")),
    strictOriginalityGuard: booleanValue(params.get("strictOriginalityGuard")),
  };
}

function loadHandoffPayload(): HandoffPayload | null {
  try {
    const raw = window.localStorage.getItem(STORYBOARD_HANDOFF_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as HandoffPayload;
  } catch {
    return null;
  }
}

function PromptBlock({
  title,
  text,
  copyLabel,
  maxChars,
}: {
  title: string;
  text: string;
  copyLabel: string;
  maxChars?: number;
}) {
  const isNearLimit = typeof maxChars === "number" && text.length > maxChars * 0.88;
  const characterLabel = maxChars ? `${text.length.toLocaleString()} / ${maxChars.toLocaleString()}` : `${text.length.toLocaleString()} chars`;

  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
            {title}
          </p>
          <p className={[
            "mt-1 text-xs",
            isNearLimit ? "text-[color:var(--warning-text)]" : "text-[color:var(--muted)]",
          ].join(" ")}
          >
            Copyable prompt body · {maxChars ? `Kling: ${characterLabel}` : characterLabel}
          </p>
        </div>
        <CopyButton text={text} label={copyLabel} idleText={copyLabel} size="sm" />
      </div>
      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[color:var(--text)]">
        {text}
      </p>
    </div>
  );
}

function ShotCard({ shot }: { shot: StoryboardShot }) {
  return (
    <article className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-5 shadow-[var(--surface-shadow)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[color:var(--border)] pb-5">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-cyan-400/35 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
              Shot {shot.shotNumber}
            </span>
            <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs font-semibold text-[color:var(--text)]">
              {shot.timeRangeLabel}
            </span>
            <span className="rounded-full border border-emerald-400/35 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
              5s
            </span>
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[color:var(--text)]">
            {shot.title}
          </h2>
          <p className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
            Role: {shot.role}
          </p>
          <p className="mt-3 text-base leading-7 text-[color:var(--text)]">{shot.summary}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <section className="space-y-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-400">
              Image Prompt Pack
            </p>
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              Copy a long production-ready prompt or a compact fast-use prompt, then use the matching Kling motion prompt.
            </p>
          </div>
          <PromptBlock
            title="GPT Image 2 — Long Version"
            text={shot.imagePrompts.gptImage2Long}
            copyLabel="Copy GPT Image 2 Long Version"
          />
          <PromptBlock
            title="GPT Image 2 — Short Version"
            text={shot.imagePrompts.gptImage2Short}
            copyLabel="Copy GPT Image 2 Short Version"
          />
          <PromptBlock
            title="Nano Banana 2 — Long Version"
            text={shot.imagePrompts.nanoBanana2Long}
            copyLabel="Copy Nano Banana 2 Long Version"
          />
          <PromptBlock
            title="Nano Banana 2 — Short Version"
            text={shot.imagePrompts.nanoBanana2Short}
            copyLabel="Copy Nano Banana 2 Short Version"
          />
        </section>

        <section className="space-y-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-400">
              Video Motion Prompt Pack
            </p>
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              One controlled 5-second Kling beat for this shot.
            </p>
          </div>
          <PromptBlock
            title="Kling Motion Prompt"
            text={shot.motionPrompts.kling}
            copyLabel="Copy Kling Motion Prompt"
            maxChars={2500}
          />

          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
              Shot Notes
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-[color:var(--text)]">
              {shot.notes.map((note) => (
                <li key={note}>- {note}</li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </article>
  );
}

export default function CinematicStoryboardPage() {
  const [input, setInput] = useState<CinematicStoryboardInput>({});
  const [loadedFromBuild, setLoadedFromBuild] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const handoff = loadHandoffPayload();
    const nextInput = {
      ...handoffToInput(handoff),
      ...paramsToInput(params),
    };

    setInput(nextInput);
    setLoadedFromBuild(params.get("source") === "build" || handoff?.source === "build");
  }, []);

  const storyboard = useMemo(() => buildCinematicStoryboard(input), [input]);

  return (
    <main className="min-h-screen bg-[color:var(--bg)] px-4 py-10 text-[color:var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="overflow-hidden rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface-elevated)] shadow-[var(--surface-shadow)]">
          <div className="border-b border-[color:var(--border)] bg-[color:var(--surface)] p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="max-w-3xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-400">
                  Storyboard
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[color:var(--text)] sm:text-4xl">
                  Pencil Wildlife 4-Shot Storyboard Planner
                </h1>
                <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
                  Build setup to GPT Image 2 and Nano Banana 2 long/short pencil storyboard prompts, plus four Kling motion prompts.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {loadedFromBuild ? (
                  <span className="rounded-full border border-cyan-400/35 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                    Loaded from Build setup
                  </span>
                ) : null}
                <Link
                  href="/"
                  className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm font-semibold text-[color:var(--text)] transition hover:border-cyan-400/60 hover:text-cyan-300"
                >
                  Back to Build
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-6 sm:p-8 lg:grid-cols-4">
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">Story Mode</p>
              <p className="mt-2 text-lg font-semibold text-[color:var(--text)]">{storyboard.summary.storyModeLabel}</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">Subject Pair</p>
              <p className="mt-2 text-lg font-semibold text-[color:var(--text)]">{storyboard.summary.subjectPair}</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">Habitat</p>
              <p className="mt-2 text-lg font-semibold text-[color:var(--text)]">{storyboard.summary.habitat}</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">Duration</p>
              <p className="mt-2 text-lg font-semibold text-[color:var(--text)]">
                {storyboard.summary.totalShots} shots · {storyboard.summary.totalMotionDurationLabel}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-5 shadow-[var(--surface-shadow)] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-400">
                Storyboard Summary
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[color:var(--text)]">
                {storyboard.summary.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                Image variants: {storyboard.summary.imagePromptVariants.join(", ")} · Motion engine: {storyboard.summary.motionEngine} · Every shot is 5 seconds.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <CopyButton text={storyboard.copy.allGptImage2Long} label="All GPT Image 2 Long Prompts" idleText="Copy All GPT Image 2 Long" size="md" />
              <CopyButton text={storyboard.copy.allGptImage2Short} label="All GPT Image 2 Short Prompts" idleText="Copy All GPT Image 2 Short" size="md" />
              <CopyButton text={storyboard.copy.allNanoBanana2Long} label="All Nano Banana 2 Long Prompts" idleText="Copy All Nano Banana 2 Long" size="md" />
              <CopyButton text={storyboard.copy.allNanoBanana2Short} label="All Nano Banana 2 Short Prompts" idleText="Copy All Nano Banana 2 Short" size="md" />
              <CopyButton text={storyboard.copy.allKling} label="All Kling Motion Prompts" idleText="Copy All Kling Motion Prompts" size="md" />
            </div>
          </div>
        </section>

        <section className="space-y-6">
          {storyboard.shots.map((shot) => (
            <ShotCard key={shot.id} shot={shot} />
          ))}
        </section>
      </div>
    </main>
  );
}

