"use client";

import type { GeneratedPackage, StructuredPromptBundle } from "@/types";

import {
  buildAnimalMasterReferencePrompt,
  buildEnvironmentMasterReferencePrompt,
} from "@/components/output-cards/reference-image-prompts";

type WorkflowPrompt = {
  number: number;
  title: string;
  helper: string;
  badge: string;
  prompt: string;
  copyLabel: string;
  tone: "amber" | "emerald" | "indigo";
  subStage?: string;
  backupNote?: string;
  runwayNote?: string;
};

type MergeStage = {
  number: number;
  title: string;
  subStage: string;
  stageDirection: string;
};

const OPTIONAL_GPT_IMAGE_2_BACKUP_NOTE =
  "Optional GPT Image 2 backup: use the same prompt if Nano Banana 2 output drifts or anatomy fails.";

const OPTIONAL_RUNWAY_REFERENCE_NOTE =
  "If using Runway Gen-4 References later, save references as @lead_animal, @opposite_animal, and @environment, then use exactly 3 active references.";

const MERGE_STAGES: MergeStage[] = [
  {
    number: 1,
    title: "Merge Master Image 1 — Opening Tension",
    subStage: "First-frame hook",
    stageDirection:
      "opening tension with both animals visible, a readable attack or escape lane, and the first clear survival pressure beat.",
  },
  {
    number: 2,
    title: "Merge Master Image 2 — Build Pressure",
    subStage: "Spacing tightens",
    stageDirection:
      "pressure build as spacing tightens, body angles become more committed, and the terrain still leaves clean full-body readability.",
  },
  {
    number: 3,
    title: "Merge Master Image 3 — Peak Action",
    subStage: "Strongest non-graphic action beat",
    stageDirection:
      "peak action with the strongest non-graphic motion implication, near-clash pressure, grounded anatomy, and no visible injury.",
  },
  {
    number: 4,
    title: "Merge Master Image 4 — Resolve / Aftermath",
    subStage: "Unresolved tension",
    stageDirection:
      "resolve or aftermath with unresolved survival tension, stable spacing, and a replay-worthy final composition.",
  },
];

const HANDOFF_ROWS = [
  { image: "Merge Master Image 1", shot: "Hybrid Shot 1", engine: "Runway" },
  { image: "Merge Master Image 2", shot: "Hybrid Shot 2", engine: "Kling" },
  { image: "Merge Master Image 3", shot: "Hybrid Shot 3", engine: "Kling" },
  { image: "Merge Master Image 4", shot: "Hybrid Shot 4", engine: "Runway" },
] as const;

function cleanText(value: unknown, fallback: string) {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function buildMergeMasterPrompt({
  leadAnimalName,
  oppositeAnimalName,
  environmentName,
  lightingName,
  stage,
}: {
  leadAnimalName: string;
  oppositeAnimalName: string;
  environmentName: string;
  lightingName: string;
  stage: MergeStage;
}) {
  return [
    "Use the 3 reference images:",
    "",
    "1. Lead animal reference image",
    "2. Opposite animal reference image",
    "3. Environment reference image",
    "",
    `Merge these into one continuity-safe 9:16 wildlife documentary master image for ${stage.title}.`,
    `Preserve ${leadAnimalName} identity from the lead animal reference, ${oppositeAnimalName} identity from the opposite animal reference, and habitat / lighting / terrain from the environment reference: ${environmentName}, ${lightingName}.`,
    `Stage direction: ${stage.stageDirection}`,
    "Keep photorealistic wildlife documentary realism, grounded contact, full-body readability, clean spacing, realistic animal scale, no text, no watermark, no gore, no blood, no visible injury.",
  ].join("\n");
}


function buildReferencePrompts(data: GeneratedPackage) {
  const leadAnimalName = cleanText(data.predatorName, "lead animal");
  const oppositeAnimalName = cleanText(data.preyName, "opposite animal");
  const environmentName = cleanText(
    data.environmentName,
    "natural wildlife habitat"
  );
  const lightingName = cleanText(
    data.weatherName,
    "scene-appropriate natural lighting"
  );

  const leadPrompt = buildAnimalMasterReferencePrompt({
    subjectName: leadAnimalName,
    stanceLabel: "alert pressure-ready wildlife posture",
    identityMarkers:
      "species-specific identity, readable head profile, coat/skin/marking detail, clear body-scale cues",
    contactLabel:
      "grounded paw/hoof/foot contact or natural perch contact for bird species",
    role: "lead",
  });

  const oppositePrompt = buildAnimalMasterReferencePrompt({
    subjectName: oppositeAnimalName,
    stanceLabel: "alert survival-reaction wildlife posture",
    identityMarkers:
      "species-specific identity, readable side profile, coat/skin/marking detail, clear body-scale cues",
    contactLabel:
      "grounded paw/hoof/foot contact or natural perch contact for bird species",
    role: "opposite",
  });

  const environmentPrompt = buildEnvironmentMasterReferencePrompt({
    environmentName,
    leadAnimalName,
    oppositeAnimalName,
    arcName: data.arcName,
    cameraAnglePreset: data.cameraAnglePreset,
  });

  return {
    leadAnimalName,
    oppositeAnimalName,
    environmentName,
    lightingName,
    referencePrompts: [
      {
        number: 1,
        title: "Lead Animal Master Image",
        helper: "Create the reusable lead animal reference in Nano Banana 2 first.",
        badge: "Nano Banana 2 Primary · GPT Image 2 Backup",
        prompt: leadPrompt.replace(
          /production-ready [^.]+ reference\./,
          "production-ready Nano Banana 2 primary master reference with GPT Image 2 backup support."
        ),
        copyLabel: "Lead Reference",
        tone: "amber",
        backupNote: OPTIONAL_GPT_IMAGE_2_BACKUP_NOTE,
        runwayNote: OPTIONAL_RUNWAY_REFERENCE_NOTE,
      },
      {
        number: 2,
        title: "Opposite Animal Master Image",
        helper: "Create the reusable opposite animal reference in Nano Banana 2 first.",
        badge: "Nano Banana 2 Primary · GPT Image 2 Backup",
        prompt: oppositePrompt.replace(
          /production-ready [^.]+ reference\./,
          "production-ready Nano Banana 2 primary master reference with GPT Image 2 backup support."
        ),
        copyLabel: "Opposite Reference",
        tone: "amber",
        backupNote: OPTIONAL_GPT_IMAGE_2_BACKUP_NOTE,
        runwayNote: OPTIONAL_RUNWAY_REFERENCE_NOTE,
      },
      {
        number: 3,
        title: "Environment Master Image",
        helper: "Create the reusable habitat, terrain, and lighting reference in Nano Banana 2 first.",
        badge: "Nano Banana 2 Primary · GPT Image 2 Backup",
        prompt: environmentPrompt,
        copyLabel: "Environment Reference",
        tone: "indigo",
        backupNote: OPTIONAL_GPT_IMAGE_2_BACKUP_NOTE,
        runwayNote: OPTIONAL_RUNWAY_REFERENCE_NOTE,
      },
    ] satisfies WorkflowPrompt[],
  };
}

function PromptPreview({ prompt }: { prompt: string }) {
  return (
    <pre className="max-h-52 min-h-[132px] max-w-full overflow-y-auto whitespace-pre-wrap break-words rounded-xl border border-zinc-700/55 bg-zinc-950/70 p-3 font-mono text-[11px] leading-relaxed text-zinc-200 shadow-inner shadow-black/30 [overflow-wrap:anywhere]">
      {prompt}
    </pre>
  );
}

function CopyAction({
  label,
  prompt,
  onCopy,
}: {
  label: string;
  prompt: string;
  onCopy: (text: string) => void | Promise<unknown>;
}) {
  return (
    <button
      type="button"
      onClick={() => onCopy(prompt)}
      className="w-full rounded-lg border border-amber-400/35 bg-amber-500/15 px-3 py-2 text-xs font-extrabold text-amber-200 transition hover:border-amber-300/70 hover:bg-amber-500/25 active:scale-[0.99] sm:w-auto"
    >
      Copy {label}
    </button>
  );
}

function ToneBadge({ tone, children }: { tone: WorkflowPrompt["tone"]; children: string }) {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-200"
      : tone === "indigo"
        ? "border-indigo-400/30 bg-indigo-500/15 text-indigo-200"
        : "border-amber-400/30 bg-amber-500/15 text-amber-200";

  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${toneClass}`}
    >
      {children}
    </span>
  );
}

function WorkflowCard({
  item,
  onCopy,
}: {
  item: WorkflowPrompt;
  onCopy: (text: string) => void | Promise<unknown>;
}) {
  const borderClass =
    item.tone === "emerald"
      ? "border-emerald-500/25 bg-emerald-950/10"
      : item.tone === "indigo"
        ? "border-indigo-500/25 bg-indigo-950/10"
        : "border-amber-500/25 bg-amber-950/10";

  return (
    <article
      className={`min-w-0 overflow-hidden rounded-2xl border p-4 shadow-lg shadow-black/20 ${borderClass}`}
    >
      <div className="mb-3 flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-zinc-950 text-xs font-black text-amber-300 ring-1 ring-amber-400/30">
            {item.number}
          </span>
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h3 className="break-words text-sm font-extrabold text-zinc-100 [overflow-wrap:anywhere]">
                {item.title}
              </h3>
              {item.subStage && (
                <span className="rounded bg-zinc-800/80 px-2 py-0.5 text-[10px] font-bold text-zinc-300">
                  {item.subStage}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">
              {item.helper}
            </p>
          </div>
        </div>
        <ToneBadge tone={item.tone}>{item.badge}</ToneBadge>
      </div>

      <PromptPreview prompt={item.prompt} />

      {(item.backupNote || item.runwayNote) && (
        <div className="mt-3 space-y-2">
          {item.backupNote && (
            <p className="rounded-lg border border-cyan-400/25 bg-cyan-500/10 px-3 py-2 text-[11px] font-semibold leading-relaxed text-cyan-100">
              {item.backupNote}
            </p>
          )}
          {item.runwayNote && (
            <p className="rounded-lg border border-zinc-700/60 bg-zinc-900/60 px-3 py-2 text-[11px] leading-relaxed text-zinc-400">
              {item.runwayNote}
            </p>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
          {item.prompt.length.toLocaleString()} chars
        </span>
        <CopyAction label={item.copyLabel} prompt={item.prompt} onCopy={onCopy} />
      </div>
    </article>
  );
}

export default function ImageReferenceMergeWorkflow({
  data,
  structuredPrompts,
  onCopy,
}: {
  data: GeneratedPackage;
  structuredPrompts?: StructuredPromptBundle;
  onCopy: (text: string) => void | Promise<unknown>;
}) {
  const {
    leadAnimalName,
    oppositeAnimalName,
    environmentName,
    lightingName,
    referencePrompts,
  } = buildReferencePrompts(data);
  const structuredSourceNote = structuredPrompts?.imagePrompt?.pasteReady
    ? "The existing full-scene image prompt stays available below; this workflow splits it into Nano Banana 2 primary references first."
    : "Reference prompts are derived from the current package animals and environment.";

  const mergePrompts: WorkflowPrompt[] = MERGE_STAGES.map((stage) => ({
    number: stage.number,
    title: stage.title,
    subStage: stage.subStage,
    helper: `Merge the 3 reference images with ${stage.subStage.toLowerCase()} composition.`,
    badge: "Nano Banana 2 Primary · GPT Image 2 Backup",
    prompt: buildMergeMasterPrompt({
      leadAnimalName,
      oppositeAnimalName,
      environmentName,
      lightingName,
      stage,
    }),
    copyLabel: `Merge ${stage.number}`,
    tone: "emerald",
    backupNote: OPTIONAL_GPT_IMAGE_2_BACKUP_NOTE,
    runwayNote: OPTIONAL_RUNWAY_REFERENCE_NOTE,
  }));

  const allPrompts = [
    "WSTV IMAGE REFERENCE MERGE WORKFLOW",
    "",
    "STEP 1 — MASTER REFERENCE IMAGES",
    ...referencePrompts.flatMap((item) => [
      "",
      `${item.number}. ${item.title}`,
      item.prompt,
      item.backupNote ? `Note: ${item.backupNote}` : "",
      item.runwayNote ? `Optional Runway note: ${item.runwayNote}` : "",
    ].filter(Boolean)),
    "",
    "STEP 2 — FINAL MERGE MASTER IMAGES",
    ...mergePrompts.flatMap((item) => [
      "",
      `${item.number}. ${item.title}`,
      item.prompt,
      item.backupNote ? `Note: ${item.backupNote}` : "",
      item.runwayNote ? `Optional Runway note: ${item.runwayNote}` : "",
    ].filter(Boolean)),
    "",
    "STEP 3 — HYBRID VIDEO HANDOFF",
    ...HANDOFF_ROWS.map((row) => `${row.image} -> ${row.shot} (${row.engine})`),
  ].join("\n");

  return (
    <section className="overflow-hidden rounded-2xl border border-amber-500/20 bg-zinc-950/70 shadow-xl shadow-black/35">
      <div className="border-b border-amber-500/15 bg-gradient-to-r from-amber-950/40 via-zinc-950 to-emerald-950/25 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.26em] text-amber-400/80">
              IMAGE PROMPTS
            </p>
            <h2 className="mt-1 text-base font-black text-zinc-50">
              Nano Banana 2 Reference Merge Workflow
            </h2>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-zinc-400">
              Build three Nano Banana 2 primary references first, then generate four merge master
              images for the hybrid video handoff. {structuredSourceNote}
            </p>
          </div>
          <CopyAction label="All Image Workflow" prompt={allPrompts} onCopy={onCopy} />
        </div>
      </div>

      <div className="space-y-6 p-4 sm:p-5">
        <div>
          <StepHeader
            step="STEP 1"
            title="MASTER REFERENCE IMAGES"
            note="Create the separate Nano Banana 2 primary references before merging scenes."
          />
          <div className="grid gap-4 lg:grid-cols-3">
            {referencePrompts.map((item) => (
              <WorkflowCard key={item.title} item={item} onCopy={onCopy} />
            ))}
          </div>
        </div>

        <FlowDivider label="Use the 3 reference images in Nano Banana 2, then merge" />

        <div>
          <StepHeader
            step="STEP 2"
            title="FINAL MERGE MASTER IMAGES"
            note="Each merge prompt uses the lead animal, opposite animal, and environment reference images."
          />
          <div className="grid gap-4 xl:grid-cols-2">
            {mergePrompts.map((item) => (
              <WorkflowCard key={item.title} item={item} onCopy={onCopy} />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-indigo-500/25 bg-indigo-950/20 p-4">
          <StepHeader
            step="STEP 3"
            title="HYBRID VIDEO HANDOFF"
            note="Use the matching merge master image as the source frame for each hybrid shot."
          />
          <div className="grid gap-2 md:grid-cols-2">
            {HANDOFF_ROWS.map((row) => (
              <div
                key={row.image}
                className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-700/50 bg-zinc-950/55 px-3 py-2"
              >
                <span className="break-words text-xs font-bold text-zinc-200 [overflow-wrap:anywhere]">
                  {row.image} -&gt; {row.shot}
                </span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                    row.engine === "Runway"
                      ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-200"
                      : "border-cyan-400/30 bg-cyan-500/15 text-cyan-200"
                  }`}
                >
                  {row.engine}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function StepHeader({
  step,
  title,
  note,
}: {
  step: string;
  title: string;
  note: string;
}) {
  return (
    <div className="mb-3 flex min-w-0 flex-wrap items-end justify-between gap-2">
      <div>
        <div className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-400/75">
          {step}
        </div>
        <h3 className="mt-1 text-sm font-black text-zinc-100">{title}</h3>
      </div>
      <p className="max-w-xl text-xs leading-relaxed text-zinc-500">{note}</p>
    </div>
  );
}

function FlowDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px min-w-0 flex-1 bg-gradient-to-r from-transparent via-zinc-700/70 to-transparent" />
      <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-center text-[10px] font-bold uppercase leading-relaxed tracking-wide text-amber-300">
        {label}
      </span>
      <div className="h-px min-w-0 flex-1 bg-gradient-to-r from-transparent via-zinc-700/70 to-transparent" />
    </div>
  );
}
