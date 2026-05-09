"use client";

import type { GeneratedPackage, StructuredPromptBundle } from "@/types";

import {
  buildAnimalMasterReferencePrompt,
  buildEnvironmentMasterReferencePrompt,
} from "@/components/output-cards/reference-image-prompts";
import {
  buildStoryModePromptContext,
  isNonPredatorStoryMode,
  type StoryModePromptContext,
} from "@/lib/story-mode-prompt-context";

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
  composition: string;
};

const OPTIONAL_GPT_IMAGE_2_BACKUP_NOTE =
  "Optional GPT Image 2 backup: use the same prompt if Nano Banana 2 output drifts or anatomy fails.";

const OPTIONAL_RUNWAY_REFERENCE_NOTE =
  "If using Runway Gen-4 References later, save references as @lead_animal, @opposite_animal, and @environment, then use exactly 3 active references.";

const FINAL_MERGE_NEGATIVE_PROMPT =
  "Negative prompt: blood, gore, visible wounds, torn flesh, exposed injury, broken bones, dead animal, graphic injury, extra limbs, duplicate animals, fused bodies, melted anatomy, distorted face, floating animals, wrong scale, wrong habitat, humans, vehicles, fences, zoo enclosure, text, subtitles, watermark, logo, cartoon, CGI, plastic texture, excessive blur, excessive camera shake.";

const MERGE_STAGES: MergeStage[] = [
  {
    number: 1,
    title: "Merge Master Image 1 — Opening Tension",
    subStage: "First-frame hook",
    stageDirection:
      "opening tension with both animals visible, a readable attack or escape lane, and the first clear survival pressure beat.",
    composition:
      "Lead animal on the left in a readable pressure-ready posture, opposite animal on the right in a readable survival-reaction posture, both full-body visible with no contact, one clear open attack/escape corridor between them, strong first-frame hook, quiet tension before movement.",
  },
  {
    number: 2,
    title: "Merge Master Image 2 — Build Pressure",
    subStage: "Spacing tightens",
    stageDirection:
      "pressure build as spacing tightens, body angles become more committed, and the terrain still leaves clean full-body readability.",
    composition:
      "Lead animal lower and more forward, opposite animal braced and turning into escape, spacing tighter but still clean, full bodies readable, pressure lane narrowing through terrain, no collision, no injury, rising survival tension.",
  },
  {
    number: 3,
    title: "Merge Master Image 3 — Peak Action",
    subStage: "Strongest non-graphic action beat",
    stageDirection:
      "peak action with the strongest non-graphic motion implication, near-clash pressure, grounded anatomy, and no visible injury.",
    composition:
      "Highest intensity near-clash frame, lead animal surging through the lane, opposite animal dodging or pivoting away, powerful body mechanics, clean separation, no bite, no blood, no visible injury, realistic scale and grounded contact.",
  },
  {
    number: 4,
    title: "Merge Master Image 4 — Resolve / Aftermath",
    subStage: "Unresolved tension",
    stageDirection:
      "resolve or aftermath with unresolved survival tension, stable spacing, and a replay-worthy final composition.",
    composition:
      "Aftermath or unresolved exit frame, both animals still readable in the same environment, lead animal holding pressure or slowing, opposite animal partially escaped but still threatened, clean final source frame, unresolved tension that invites replay.",
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

function slugifyReferenceName(value: string, fallback: string, suffix?: string) {
  const normalized = String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/white[-\s]+tailed/g, "white tailed");

  if (normalized.includes("mountain lion")) return "mountain_lion";
  if (normalized.includes("white tailed deer")) return "white_tailed_deer";
  if (
    suffix === "env" &&
    normalized.includes("forest") &&
    normalized.includes("brush") &&
    normalized.includes("opening")
  ) {
    return "forest_edge_brush_opening_env";
  }

  const slug =
    normalized
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || fallback;

  return suffix && !slug.endsWith(`_${suffix}`) ? `${slug}_${suffix}` : slug;
}

function buildRunwayReferenceHelperNote({
  leadAnimalName,
  oppositeAnimalName,
  environmentName,
}: {
  leadAnimalName: string;
  oppositeAnimalName: string;
  environmentName: string;
}) {
  const leadTag = `@${slugifyReferenceName(leadAnimalName, "mountain_lion")}`;
  const oppositeTag = `@${slugifyReferenceName(oppositeAnimalName, "white_tailed_deer")}`;
  const environmentTag = `@${slugifyReferenceName(environmentName, "forest_edge_brush_opening", "env")}`;

  return `Optional Runway Gen-4 References note: save references as ${leadTag}, ${oppositeTag}, and ${environmentTag}; use exactly 3 active references only inside the separate Runway reference workflow.`;
}

function strengthenReferencePrompt(prompt: string, role: "lead" | "opposite" | "environment") {
  const roleLine =
    role === "environment"
      ? "Master reference target: empty habitat plate, strong terrain readability, natural lighting direction, foreground/midground/background depth, open central action lane, no animals."
      : "Master reference target: single animal only, clean full-body silhouette, accurate species anatomy, readable face profile, natural coat/skin texture, grounded contact, uncluttered habitat-compatible ground, no action clash.";

  return [
    prompt,
    "",
    roleLine,
    "Write as a clear natural-language visual brief, not a keyword pile. Prioritize identity fidelity, anatomy, clean spacing, realistic scale, and a reusable production reference frame.",
  ].join("\n");
}

function buildMergeMasterPrompt({
  leadAnimalName,
  oppositeAnimalName,
  environmentName,
  lightingName,
  stage,
  modeContext,
}: {
  leadAnimalName: string;
  oppositeAnimalName: string;
  environmentName: string;
  lightingName: string;
  stage: MergeStage;
  modeContext?: StoryModePromptContext;
}) {
  return [
    "Final merge master-image prompt. Use a natural-language cinematic brief with clear reference roles, layered scene construction, and photographic direction.",
    "",
    "Use the 3 prepared reference images:",
    `1. Lead animal reference image for ${leadAnimalName} identity: coat/skin pattern, head profile, body scale, species markers, natural anatomy, and grounded paw/foot contact.`,
    `2. Opposite animal reference image for ${oppositeAnimalName} identity: coat pattern, body scale, legs, hoof/paw shape, head angle, natural anatomy, and grounded hoof/foot contact.`,
    `3. Environment reference image for ${environmentName}: background, lighting direction, ground texture, terrain depth, habitat structure, and atmosphere.`,
    "",
    `Final image goal: ${stage.title}. Photorealistic wildlife documentary final scene master image, video-ready source frame for a hybrid wildlife reel.`,
    modeContext ? `Story mode: ${modeContext.modeLabel}. ${modeContext.sceneGoal} ${modeContext.relationshipLine}` : "",
    modeContext ? `${modeContext.modeSpecificActionLine} ${modeContext.violenceLine}` : "",
    `Layer the scene from background to foreground: first preserve ${environmentName} as the habitat plate with ${lightingName}, terrain depth, ambush lanes, ground plane, atmospheric depth, and natural color temperature; then place the two identity-locked animals into that environment with believable scale and spacing.`,
    `${stage.composition}`,
    `Keep ${leadAnimalName} and ${oppositeAnimalName} full-body readable from ears/head through legs/feet/tail, with stable anatomy, correct limb count, realistic muscle/bone landmarks, grounded paw and hoof contact, clean silhouettes, no fused bodies, and no duplicated animals.`,
    "Cinematic telephoto documentary framing, low natural camera height, strong subject separation, clear attack/escape corridor, realistic body mass, habitat-accurate terrain contact, natural depth of field, sharp animal detail, controlled background detail, no over-stylized CGI look.",
    `Purpose: ${stage.stageDirection}`,
    "Safety and realism: clean survival tension only, no visible injury, no graphic outcome, no humans, no vehicles, no fences, no zoo enclosure, no text, no watermark.",
    "",
    FINAL_MERGE_NEGATIVE_PROMPT,
  ].filter(Boolean).join("\n");
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
  const modeContext = isNonPredatorStoryMode(data)
    ? buildStoryModePromptContext({
        storyMode: data.storyMode,
        encounterMode: data.encounterMode,
        endingMode: data.endingMode,
        viralLane: data.viralLane,
        violenceLevel: data.violenceLevel,
        habitatRegion: data.habitatRegion,
        season: data.season,
        timeOfDay: data.timeOfDay,
        subjectA: data.subjectA ?? leadAnimalName,
        subjectB: data.subjectB ?? oppositeAnimalName,
        groupCount: data.groupCount,
        offspringLabel: data.offspringLabel,
        strikeMethod: data.strikeMethod,
        escapeDirection: data.escapeDirection,
        weatherHazard: data.weatherHazard,
        rutSeason: data.rutSeason,
        foodItem: data.foodItem,
        predator: leadAnimalName,
        prey: oppositeAnimalName,
        finalEnvironment: environmentName,
        weather: data.weatherName,
      })
    : undefined;
  const modeReferenceLine = modeContext
    ? `\n\nStory-mode reference goal: ${modeContext.modeLabel}. ${modeContext.sceneGoal} ${modeContext.relationshipLine} ${modeContext.safetyLine}`
    : "";

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
    modeContext,
    referencePrompts: [
      {
        number: 1,
        title: "Lead Animal Master Image",
        helper: "Create the reusable lead animal reference in Nano Banana 2 first.",
        badge: "Nano Banana 2 Primary · GPT Image 2 Backup",
        prompt: strengthenReferencePrompt(
          (leadPrompt + modeReferenceLine).replace(
            /production-ready [^.]+ reference\./,
            "production-ready wildlife master reference image."
          ),
          "lead"
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
        prompt: strengthenReferencePrompt(
          (oppositePrompt + modeReferenceLine).replace(
            /production-ready [^.]+ reference\./,
            "production-ready wildlife master reference image."
          ),
          "opposite"
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
        prompt: strengthenReferencePrompt(environmentPrompt + modeReferenceLine, "environment"),
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
    modeContext,
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
      modeContext,
    }),
    copyLabel: `Merge ${stage.number}`,
    tone: "emerald",
    backupNote: OPTIONAL_GPT_IMAGE_2_BACKUP_NOTE,
    runwayNote: buildRunwayReferenceHelperNote({
      leadAnimalName,
      oppositeAnimalName,
      environmentName,
    }),
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
