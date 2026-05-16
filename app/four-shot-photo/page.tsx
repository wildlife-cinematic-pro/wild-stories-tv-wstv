"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import CopyButton from "@/components/storyboard/copy-button";
import {
  buildAllGptImage2Text,
  buildAllNanoBanana2Text,
  buildFourShotPhotoPrompts,
  type FourShotPhotoOutput,
  type FourShotPhotoInput,
} from "@/lib/four-shot-photo-system";
import {
  loadFourShotPhotoHandoffPayload,
  resolveFourShotPhotoInitialInput,
} from "@/lib/four-shot-photo-handoff";
import type { AIProvider } from "@/types";

type ProviderPolishConfig = {
  activeProvider: AIProvider;
  autoFallback: boolean;
};

const DEFAULT_PROVIDER_POLISH_CONFIG: ProviderPolishConfig = {
  activeProvider: "gemini",
  autoFallback: false,
};

type FieldKey = keyof Pick<
  FourShotPhotoInput,
  "predator" | "prey" | "environment" | "lighting" | "season" | "aspectRatio" | "predatorIdentityNotes" | "preyIdentityNotes" | "storyDirection" | "predatorPlacement" | "preyPlacement" | "identityLockStrength" | "groundIntegrationStrength"
>;

const DEFAULT_FORM: FourShotPhotoInput = {
  predator: "Mountain Lion",
  prey: "Mule Deer",
  environment:
    "Yellowstone sagebrush meadow with a narrow dirt game trail, tawny grass, scattered sagebrush, dark pine treeline, and a distant blue-gray mountain ridge",
  lighting: "low golden-hour side light from camera left with soft natural rim light",
  season: "early autumn",
  aspectRatio: "9:16",
  predatorIdentityNotes:
    "adult mountain lion, lean muscular body mass, tawny coat, pale muzzle, rounded ears, long tail carried low, full-body readable, grounded paws",
  preyIdentityNotes:
    "adult mule deer doe, large ears, tan-gray coat, slim legs, black-tipped tail, alert posture, full-body readable, grounded hooves",
  storyDirection: "predator stays behind, prey stays ahead, same action lane across all shots",
  predatorPlacement: "behind or rear side of the action lane",
  preyPlacement: "ahead or front side of the action lane",
  identityLockStrength: "strict",
  groundIntegrationStrength: "strong",
};

function Field({
  label,
  field,
  value,
  onChange,
  rows = 1,
}: {
  label: string;
  field: FieldKey;
  value: string;
  onChange: (field: FieldKey, value: string) => void;
  rows?: number;
}) {
  const commonClass = "w-full min-w-0 rounded-xl border border-[color:var(--border)] bg-[#070d08]/90 px-3 py-2.5 text-sm leading-6 text-[color:var(--text)] outline-none transition [overflow-wrap:anywhere] placeholder:text-[color:var(--muted)] focus:border-cyan-400 focus:bg-black/30";

  return (
    <label className="min-w-0 space-y-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--muted)]">
      <span>{label}</span>
      {rows > 1 ? (
        <textarea value={value} onChange={(event) => onChange(field, event.target.value)} rows={rows} className={`${commonClass} resize-y`} />
      ) : (
        <input value={value} onChange={(event) => onChange(field, event.target.value)} className={commonClass} />
      )}
    </label>
  );
}

function PromptPanel({ title, engine, text }: { title: string; engine: string; text: string }) {
  return (
    <section className="min-w-0 rounded-2xl border border-[color:var(--border)] bg-[#0d140d]/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-cyan-400/35 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="break-words text-[11px] font-black uppercase tracking-[0.16em] text-cyan-300 [overflow-wrap:anywhere]">{engine}</p>
          <h3 className="mt-1 break-words text-sm font-black text-[color:var(--text)] [overflow-wrap:anywhere]">{title}</h3>
          <p className="mt-1 text-xs text-[color:var(--muted)]">{text.length.toLocaleString()} chars</p>
        </div>
        <CopyButton text={text} label={title + " " + engine} idleText="Copy Prompt" size="sm" />
      </div>
      <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-white/5 bg-black/25 p-3 text-xs leading-5 text-[color:var(--text)] [overflow-wrap:anywhere] sm:text-sm sm:leading-6">
        {text}
      </pre>
    </section>
  );
}
function OutputBlock({ title, nano, gpt }: { title: string; nano: string; gpt: string }) {
  const isMaster = title === "Master Environment";

  return (
    <article className="min-w-0 overflow-hidden rounded-[28px] border border-[color:var(--border)] bg-[linear-gradient(135deg,rgba(18,29,18,0.96),rgba(9,13,9,0.98))] shadow-[var(--surface-shadow)]">
      <div className="grid gap-5 border-b border-[color:var(--border)] p-5 sm:p-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="relative min-h-36 overflow-hidden rounded-2xl border border-amber-300/20 bg-[radial-gradient(circle_at_30%_20%,rgba(245,193,91,0.22),transparent_34%),linear-gradient(145deg,rgba(16,27,16,0.95),rgba(4,8,5,0.98))] p-4">
          <div className="absolute inset-x-4 top-4 flex flex-wrap items-center justify-between gap-2">
            <span className="rounded-full border border-amber-300/35 bg-amber-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-200">
              {isMaster ? "Master" : title.split(" ").slice(0, 2).join(" ")}
            </span>
            <span className="rounded-full border border-emerald-400/35 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-200">
              Prompt-ready
            </span>
          </div>
          <div className="absolute inset-x-4 bottom-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200/80">
              {isMaster ? "Environment plate" : "Connected photo beat"}
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--text)]">
              {isMaster ? "Plate" : title.split(" ")[1]}
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
              Same environment lock
            </p>
          </div>
        </div>

        <div className="min-w-0 self-center">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-300">
            {isMaster ? "Master Environment" : "Four-Shot Photo Output"}
          </p>
          <h2 className="mt-2 break-words text-2xl font-semibold tracking-tight text-[color:var(--text)] [overflow-wrap:anywhere] sm:text-3xl">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--muted)]">
            {isMaster
              ? "Reference plate for the shared habitat, lighting, lens feel, and ground continuity across all four photos."
              : "Connected same-environment image prompt pair for Nano Banana 2 and GPT Image 2."}
          </p>
        </div>
      </div>

      <div className="grid gap-4 p-5 sm:p-6 xl:grid-cols-2">
        <PromptPanel title={title} engine="Nano Banana 2" text={nano} />
        <PromptPanel title={title} engine="GPT Image 2" text={gpt} />
      </div>
    </article>
  );
}

async function requestFourShotProviderPolish(
  base: FourShotPhotoOutput,
  config: ProviderPolishConfig,
  signal: AbortSignal
): Promise<FourShotPhotoOutput | null> {
  if (config.activeProvider === "none") return null;

  const res = await fetch("/api/enhance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      packPolish: true,
      packKind: "fourShotPhoto",
      provider: config.activeProvider,
      autoFallback: config.autoFallback,
      base,
    }),
  });

  if (!res.ok) return null;
  const data = await res.json().catch(() => null) as { output?: FourShotPhotoOutput } | null;
  if (!data?.output || data.output.polished !== true) return null;
  if (data.output.input?.aspectRatio !== base.input.aspectRatio || data.output.shots?.length !== 4) return null;
  return data.output;
}

export default function FourShotPhotoPage() {
  const [form, setForm] = useState<FourShotPhotoInput>(DEFAULT_FORM);
  const [providerPolishConfig, setProviderPolishConfig] = useState<ProviderPolishConfig>(
    DEFAULT_PROVIDER_POLISH_CONFIG
  );
  const [polishedOutput, setPolishedOutput] = useState<FourShotPhotoOutput | null>(null);
  const [isProviderPolishing, setIsProviderPolishing] = useState(false);
  const [loadedFromBuild, setLoadedFromBuild] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const handoff = loadFourShotPhotoHandoffPayload();
    setForm(resolveFourShotPhotoInitialInput(DEFAULT_FORM, handoff, params));
    setProviderPolishConfig({
      activeProvider: handoff?.activeProvider ?? DEFAULT_PROVIDER_POLISH_CONFIG.activeProvider,
      autoFallback: handoff?.autoFallback === true,
    });
    setLoadedFromBuild(params.get("source") === "build" || handoff?.source === "build");
  }, []);
  const localOutput = useMemo(() => buildFourShotPhotoPrompts(form), [form]);
  const output = polishedOutput ?? localOutput;
  const allNano = useMemo(() => buildAllNanoBanana2Text(output), [output]);
  const allGpt = useMemo(() => buildAllGptImage2Text(output), [output]);

  useEffect(() => {
    const controller = new AbortController();
    setPolishedOutput(null);
    setIsProviderPolishing(providerPolishConfig.activeProvider !== "none");

    void requestFourShotProviderPolish(localOutput, providerPolishConfig, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted && result) setPolishedOutput(result);
      })
      .catch(() => {
        // The local four-shot pack is already rendered; provider failures stay non-blocking.
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsProviderPolishing(false);
      });

    return () => {
      controller.abort();
      setIsProviderPolishing(false);
    };
  }, [localOutput, providerPolishConfig]);

  function updateField(field: FieldKey, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#071009] px-3 py-6 text-[color:var(--text)] sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-6 sm:space-y-8">
        <section className="overflow-hidden rounded-[30px] border border-emerald-300/15 bg-[linear-gradient(135deg,rgba(17,26,17,0.98),rgba(7,12,7,0.98))] shadow-[0_24px_80px_rgba(0,0,0,0.42)]">
          <div className="border-b border-emerald-300/10 bg-[radial-gradient(circle_at_top_left,rgba(245,193,91,0.13),transparent_34%),linear-gradient(135deg,rgba(13,20,13,0.96),rgba(7,12,7,0.94))] p-5 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0 max-w-4xl">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-200">Same-Environment Photo Board</p>
              <h1 className="mt-2 break-words text-3xl font-semibold tracking-tight text-[color:var(--text)] [overflow-wrap:anywhere] sm:text-4xl">
                4-Shot Same Environment Photo Generator
              </h1>
              <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
                Generate a master environment plate plus four connected photorealistic wildlife image prompts for Nano Banana 2 and GPT Image 2. This is separate from the Pencil Wildlife 4-Shot Storyboard Planner.
              </p>
            </div>
            <div className="flex min-w-0 flex-wrap items-center justify-start gap-2 sm:justify-end">
              {loadedFromBuild ? (
                <span className="rounded-full border border-cyan-400/35 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-300">
                  Loaded from Build setup
                </span>
              ) : null}
              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-xs font-semibold text-[color:var(--muted)]">
                Provider: {output.providerUsed} {output.polished ? "polished" : "local"}
                {output.fallbackUsed ? " fallback" : ""}
              </span>
              {isProviderPolishing ? (
                <span className="rounded-full border border-amber-400/35 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300">
                  Polishing in background
                </span>
              ) : null}
              <Link href="/storyboard" className="inline-flex min-h-10 max-w-full items-center justify-center rounded-xl border border-cyan-400/35 bg-cyan-500/10 px-4 py-2 text-center text-sm font-semibold leading-snug text-cyan-200 transition [overflow-wrap:anywhere] hover:border-cyan-300/70 hover:bg-cyan-500/15 hover:text-cyan-100">
                Pencil Storyboard Planner
              </Link>
              <Link href="/" className="inline-flex min-h-10 max-w-full items-center justify-center rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-center text-sm font-semibold leading-snug text-[color:var(--text)] transition [overflow-wrap:anywhere] hover:border-cyan-400/60 hover:text-cyan-300">
                Back to Build
              </Link>
            </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-[color:var(--border)] bg-[linear-gradient(135deg,rgba(18,29,18,0.96),rgba(9,13,9,0.98))] p-5 shadow-[var(--surface-shadow)] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0 max-w-3xl">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-300">Continuity Setup</p>
              <h2 className="mt-2 text-2xl font-semibold text-[color:var(--text)]">Same-environment continuity inputs</h2>
            </div>
            <div className="grid w-full min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 xl:w-auto">
              <CopyButton text={allNano} label="All Nano Banana 2 prompts" idleText="Copy All Nano Banana 2" size="md" />
              <CopyButton text={allGpt} label="All GPT Image 2 prompts" idleText="Copy All GPT Image 2" size="md" />
            </div>
          </div>
          <div className="mt-5 grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Predator" field="predator" value={form.predator} onChange={updateField} />
            <Field label="Prey" field="prey" value={form.prey} onChange={updateField} />
            <Field label="Lighting" field="lighting" value={form.lighting} onChange={updateField} />
            <Field label="Season" field="season" value={form.season} onChange={updateField} />
            <Field label="Aspect Ratio" field="aspectRatio" value={form.aspectRatio} onChange={updateField} />
            <div className="md:col-span-2 xl:col-span-3">
              <Field label="Environment" field="environment" value={form.environment} onChange={updateField} rows={3} />
            </div>
            <div className="md:col-span-2">
              <Field label="Predator Identity Notes" field="predatorIdentityNotes" value={form.predatorIdentityNotes} onChange={updateField} rows={3} />
            </div>
            <div className="md:col-span-2">
              <Field label="Prey Identity Notes" field="preyIdentityNotes" value={form.preyIdentityNotes} onChange={updateField} rows={3} />
            </div>
            <details className="min-w-0 rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-4 md:col-span-2 xl:col-span-4">
              <summary className="cursor-pointer text-sm font-black text-cyan-200">Continuity Controls</summary>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <div className="md:col-span-2 xl:col-span-3">
                  <Field label="Story Direction" field="storyDirection" value={form.storyDirection ?? ""} onChange={updateField} rows={2} />
                </div>
                <Field label="Predator Placement" field="predatorPlacement" value={form.predatorPlacement ?? ""} onChange={updateField} rows={2} />
                <Field label="Prey Placement" field="preyPlacement" value={form.preyPlacement ?? ""} onChange={updateField} rows={2} />
                <Field label="Identity Lock Strength" field="identityLockStrength" value={form.identityLockStrength ?? ""} onChange={updateField} />
                <Field label="Ground Integration Strength" field="groundIntegrationStrength" value={form.groundIntegrationStrength ?? ""} onChange={updateField} />
              </div>
            </details>
          </div>
        </section>

        <section className="space-y-5 pb-6">
          <OutputBlock
            title="Master Environment"
            nano={output.masterEnvironment.nanoBanana2Prompt}
            gpt={output.masterEnvironment.gptImage2Prompt}
          />
          {output.shots.map((shot) => (
            <OutputBlock
              key={shot.id}
              title={"Shot " + shot.id + " " + shot.name}
              nano={shot.nanoBanana2Prompt}
              gpt={shot.gptImage2Prompt}
            />
          ))}
        </section>
      </div>
    </main>
  );
}
