"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import CopyButton from "@/components/storyboard/copy-button";
import {
  buildCinematicStoryboardCopy,
  buildCinematicStoryboard,
  type CinematicStoryboard,
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
  type AIProvider,
} from "@/types";

const STORYBOARD_HANDOFF_KEY = "wstv-storyboard-handoff";

type HandoffPayload = CinematicStoryboardInput & {
  source?: string;
  leadAnimal?: string;
  opposingAnimal?: string;
  environment?: string;
  lighting?: string;
  activeProvider?: AIProvider;
  autoFallback?: boolean;
  createdAt?: string;
};

type ProviderPolishConfig = {
  activeProvider: AIProvider;
  autoFallback: boolean;
};

const DEFAULT_PROVIDER_POLISH_CONFIG: ProviderPolishConfig = {
  activeProvider: "gemini",
  autoFallback: false,
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

function providerConfigFromHandoff(payload: HandoffPayload | null): ProviderPolishConfig {
  return {
    activeProvider: payload?.activeProvider ?? DEFAULT_PROVIDER_POLISH_CONFIG.activeProvider,
    autoFallback: payload?.autoFallback === true,
  };
}

function rebuildStoryboardCopy(storyboard: CinematicStoryboard): CinematicStoryboard {
  return {
    ...storyboard,
    copy: buildCinematicStoryboardCopy(storyboard.summary, storyboard.shots),
  };
}

async function requestStoryboardProviderPolish(
  base: CinematicStoryboard,
  config: ProviderPolishConfig,
  signal: AbortSignal
): Promise<CinematicStoryboard | null> {
  if (config.activeProvider === "none") return null;

  const res = await fetch("/api/enhance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      packPolish: true,
      packKind: "storyboard",
      provider: config.activeProvider,
      autoFallback: config.autoFallback,
      base,
    }),
  });

  if (!res.ok) return null;
  const data = await res.json().catch(() => null) as { output?: CinematicStoryboard } | null;
  if (!data?.output || data.output.polished !== true) return null;
  if (data.output.summary?.totalShots !== 4 || data.output.shots?.length !== 4) return null;
  return rebuildStoryboardCopy(data.output);
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
    <div className="min-w-0 rounded-2xl border border-[color:var(--border)] bg-[#0d140d]/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-cyan-400/35 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="break-words text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)] [overflow-wrap:anywhere]">
            {title}
          </p>
          <p
            className={[
              "mt-1 text-xs leading-5",
              isNearLimit ? "text-[color:var(--warning-text)]" : "text-[color:var(--muted)]",
            ].join(" ")}
          >
            Copyable prompt body · {maxChars ? `Kling: ${characterLabel}` : characterLabel}
          </p>
        </div>
        <CopyButton text={text} label={copyLabel} idleText={copyLabel} size="sm" />
      </div>
      <p className="mt-3 whitespace-pre-wrap break-words rounded-xl border border-white/5 bg-black/20 p-3 text-sm leading-6 text-[color:var(--text)] [overflow-wrap:anywhere]">
        {text}
      </p>
    </div>
  );
}
function ShotCard({ shot }: { shot: StoryboardShot }) {
  return (
    <article className="min-w-0 overflow-hidden rounded-[28px] border border-[color:var(--border)] bg-[linear-gradient(135deg,rgba(18,29,18,0.96),rgba(9,13,9,0.98))] shadow-[var(--surface-shadow)]">
      <div className="grid gap-5 border-b border-[color:var(--border)] p-5 sm:p-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="relative min-h-40 overflow-hidden rounded-2xl border border-amber-300/20 bg-[radial-gradient(circle_at_30%_20%,rgba(245,193,91,0.22),transparent_34%),linear-gradient(145deg,rgba(16,27,16,0.95),rgba(4,8,5,0.98))] p-4">
          <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-2">
            <span className="rounded-full border border-amber-300/35 bg-amber-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-200">
              Shot {shot.shotNumber}
            </span>
            <span className="rounded-full border border-emerald-400/35 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-200">
              Prompt-ready
            </span>
          </div>
          <div className="absolute inset-x-4 bottom-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200/80">
              Production slate
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-[color:var(--text)]">
              {shot.timeRangeLabel}
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
              Continuity locked · 5s beat
            </p>
          </div>
        </div>

        <div className="min-w-0">
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
          <h2 className="mt-3 break-words text-2xl font-semibold tracking-tight text-[color:var(--text)] [overflow-wrap:anywhere] sm:text-3xl">
            {shot.title}
          </h2>
          <p className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
            Role: {shot.role}
          </p>
          <p className="mt-3 max-w-4xl text-base leading-7 text-[color:var(--text)]">{shot.summary}</p>
        </div>
      </div>

      <div className="grid gap-5 p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.82fr)]">
        <section className="min-w-0 space-y-4">
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
              Image Prompt Pack
            </p>
            <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">
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

        <section className="min-w-0 space-y-4">
          <div className="rounded-2xl border border-amber-300/20 bg-amber-300/5 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200">
              Video Motion Prompt Pack
            </p>
            <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">
              One controlled 5-second Kling beat for this shot.
            </p>
          </div>
          <PromptBlock
            title="Kling Motion Prompt"
            text={shot.motionPrompts.kling}
            copyLabel="Copy Kling Motion Prompt"
            maxChars={2500}
          />

          <div className="rounded-2xl border border-[color:var(--border)] bg-[#0d140d]/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
              Shot Notes
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-[color:var(--text)]">
              {shot.notes.map((note) => (
                <li key={note} className="break-words [overflow-wrap:anywhere]">- {note}</li>
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
  const [providerPolishConfig, setProviderPolishConfig] = useState<ProviderPolishConfig>(
    DEFAULT_PROVIDER_POLISH_CONFIG
  );
  const [polishedStoryboard, setPolishedStoryboard] = useState<CinematicStoryboard | null>(null);
  const [isProviderPolishing, setIsProviderPolishing] = useState(false);
  const [loadedFromBuild, setLoadedFromBuild] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const handoff = loadHandoffPayload();
    const nextInput = {
      ...handoffToInput(handoff),
      ...paramsToInput(params),
    };

    setInput(nextInput);
    setProviderPolishConfig(providerConfigFromHandoff(handoff));
    setLoadedFromBuild(params.get("source") === "build" || handoff?.source === "build");
  }, []);

  const localStoryboard = useMemo(() => buildCinematicStoryboard(input), [input]);
  const storyboard = polishedStoryboard ?? localStoryboard;

  useEffect(() => {
    const controller = new AbortController();
    setPolishedStoryboard(null);
    setIsProviderPolishing(providerPolishConfig.activeProvider !== "none");

    void requestStoryboardProviderPolish(
      localStoryboard,
      providerPolishConfig,
      controller.signal
    )
      .then((result) => {
        if (!controller.signal.aborted && result) setPolishedStoryboard(result);
      })
      .catch(() => {
        // The local storyboard is already rendered; provider failures stay non-blocking.
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsProviderPolishing(false);
      });

    return () => {
      controller.abort();
      setIsProviderPolishing(false);
    };
  }, [localStoryboard, providerPolishConfig]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#071009] px-3 py-6 text-[color:var(--text)] sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-6 sm:space-y-8">
        <section className="overflow-hidden rounded-[30px] border border-emerald-300/15 bg-[linear-gradient(135deg,rgba(17,26,17,0.98),rgba(7,12,7,0.98))] shadow-[0_24px_80px_rgba(0,0,0,0.42)]">
          <div className="border-b border-emerald-300/10 bg-[radial-gradient(circle_at_top_left,rgba(245,193,91,0.13),transparent_34%),linear-gradient(135deg,rgba(13,20,13,0.96),rgba(7,12,7,0.94))] p-5 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="min-w-0 max-w-4xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200">
                  Production Storyboard Board
                </p>
                <h1 className="mt-2 break-words text-3xl font-semibold tracking-tight text-[color:var(--text)] [overflow-wrap:anywhere] sm:text-4xl">
                  Pencil Wildlife 4-Shot Storyboard Planner
                </h1>
                <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
                  Build setup to GPT Image 2 and Nano Banana 2 long/short pencil storyboard prompts, plus four Kling motion prompts.
                </p>
              </div>
              <div className="flex min-w-0 flex-wrap items-center justify-start gap-2 sm:justify-end">
                {loadedFromBuild ? (
                  <span className="rounded-full border border-cyan-400/35 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                    Loaded from Build setup
                  </span>
                ) : null}
                <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
                  Provider: {storyboard.providerUsed} {storyboard.polished ? "polished" : "local"}
                  {storyboard.fallbackUsed ? " fallback" : ""}
                </span>
                {isProviderPolishing ? (
                  <span className="rounded-full border border-amber-400/35 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
                    Polishing in background
                  </span>
                ) : null}
                <Link
                  href="/four-shot-photo"
                  className="inline-flex min-h-10 max-w-full items-center justify-center rounded-xl border border-cyan-400/35 bg-cyan-500/10 px-4 py-2 text-center text-sm font-semibold leading-snug text-cyan-200 transition [overflow-wrap:anywhere] hover:border-cyan-300/70 hover:bg-cyan-500/15 hover:text-cyan-100"
                >
                  4-Shot Same Environment Photo Generator
                </Link>
                <Link
                  href="/"
                  className="inline-flex min-h-10 max-w-full items-center justify-center rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-center text-sm font-semibold leading-snug text-[color:var(--text)] transition [overflow-wrap:anywhere] hover:border-cyan-400/60 hover:text-cyan-300"
                >
                  Back to Build
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-3 p-5 sm:p-8 md:grid-cols-2 xl:grid-cols-4">
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

        <section className="rounded-[28px] border border-[color:var(--border)] bg-[linear-gradient(135deg,rgba(18,29,18,0.96),rgba(9,13,9,0.98))] p-5 shadow-[var(--surface-shadow)] sm:p-6">
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
            <div className="grid w-full min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 xl:w-auto xl:grid-cols-3 2xl:grid-cols-5">
              <CopyButton text={storyboard.copy.allGptImage2Long} label="All GPT Image 2 Long Prompts" idleText="Copy All GPT Image 2 Long" size="md" />
              <CopyButton text={storyboard.copy.allGptImage2Short} label="All GPT Image 2 Short Prompts" idleText="Copy All GPT Image 2 Short" size="md" />
              <CopyButton text={storyboard.copy.allNanoBanana2Long} label="All Nano Banana 2 Long Prompts" idleText="Copy All Nano Banana 2 Long" size="md" />
              <CopyButton text={storyboard.copy.allNanoBanana2Short} label="All Nano Banana 2 Short Prompts" idleText="Copy All Nano Banana 2 Short" size="md" />
              <CopyButton text={storyboard.copy.allKling} label="All Kling Motion Prompts" idleText="Copy All Kling Motion Prompts" size="md" />
            </div>
          </div>
        </section>

        <section className="space-y-6 pb-6">
          {storyboard.shots.map((shot) => (
            <ShotCard key={shot.id} shot={shot} />
          ))}
        </section>
      </div>
    </main>
  );
}
