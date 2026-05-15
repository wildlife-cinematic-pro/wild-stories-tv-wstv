"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import CopyButton from "@/components/storyboard/copy-button";
import {
  buildAllGptImage2Text,
  buildAllNanoBanana2Text,
  buildFourShotPhotoPrompts,
  type FourShotPhotoInput,
} from "@/lib/four-shot-photo-system";

type FieldKey = keyof Pick<
  FourShotPhotoInput,
  "predator" | "prey" | "environment" | "lighting" | "season" | "aspectRatio" | "predatorIdentityNotes" | "preyIdentityNotes"
>;

const DEFAULT_FORM: Record<FieldKey, string> = {
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
  const commonClass = "w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-sm text-[color:var(--text)] outline-none transition focus:border-cyan-400";

  return (
    <label className="space-y-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--muted)]">
      <span>{label}</span>
      {rows > 1 ? (
        <textarea value={value} onChange={(event) => onChange(field, event.target.value)} rows={rows} className={commonClass} />
      ) : (
        <input value={value} onChange={(event) => onChange(field, event.target.value)} className={commonClass} />
      )}
    </label>
  );
}

function PromptPanel({ title, engine, text }: { title: string; engine: string; text: string }) {
  return (
    <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-cyan-400">{engine}</p>
          <h3 className="mt-1 text-sm font-black text-[color:var(--text)]">{title}</h3>
          <p className="mt-1 text-xs text-[color:var(--muted)]">{text.length.toLocaleString()} chars</p>
        </div>
        <CopyButton text={text} label={title + " " + engine} idleText="Copy Prompt" size="sm" />
      </div>
      <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3 text-xs leading-5 text-[color:var(--text)]">
        {text}
      </pre>
    </section>
  );
}

function OutputBlock({ title, nano, gpt }: { title: string; nano: string; gpt: string }) {
  return (
    <article className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4 shadow-[var(--surface-shadow)] sm:p-5">
      <h2 className="text-xl font-semibold tracking-tight text-[color:var(--text)]">{title}</h2>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <PromptPanel title={title} engine="Nano Banana 2" text={nano} />
        <PromptPanel title={title} engine="GPT Image 2" text={gpt} />
      </div>
    </article>
  );
}

export default function FourShotPhotoPage() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const output = useMemo(() => buildFourShotPhotoPrompts(form), [form]);
  const allNano = useMemo(() => buildAllNanoBanana2Text(output), [output]);
  const allGpt = useMemo(() => buildAllGptImage2Text(output), [output]);

  function updateField(field: FieldKey, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <main className="min-h-screen bg-[color:var(--bg)] px-4 py-8 text-[color:var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-5 shadow-[var(--surface-shadow)] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-400">Photo prompt system</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[color:var(--text)] sm:text-4xl">
                4-Shot Same Environment Photo Generator
              </h1>
              <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
                Generate a master environment plate plus four connected photorealistic wildlife image prompts for Nano Banana 2 and GPT Image 2. This is separate from the Pencil Wildlife 4-Shot Storyboard Planner.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/storyboard" className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm font-semibold text-[color:var(--text)] transition hover:border-cyan-400/60 hover:text-cyan-300">
                Pencil Storyboard Planner
              </Link>
              <Link href="/" className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm font-semibold text-[color:var(--text)] transition hover:border-cyan-400/60 hover:text-cyan-300">
                Back to Build
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-5 shadow-[var(--surface-shadow)] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-400">Setup</p>
              <h2 className="mt-2 text-2xl font-semibold text-[color:var(--text)]">Same-environment continuity inputs</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <CopyButton text={allNano} label="All Nano Banana 2 prompts" idleText="Copy All Nano Banana 2" size="md" />
              <CopyButton text={allGpt} label="All GPT Image 2 prompts" idleText="Copy All GPT Image 2" size="md" />
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
          </div>
        </section>

        <section className="space-y-5">
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
