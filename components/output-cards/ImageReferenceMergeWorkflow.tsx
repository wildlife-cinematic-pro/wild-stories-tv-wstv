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
import {
  buildNanoBananaReferenceTags,
  buildPreparedReferenceRoleLockBlock,
  type NanoBananaReferenceTags,
  withReferenceName,
} from "@/lib/nano-banana-reference-tags";
import { normalizeScavengerFoodZone } from "@/lib/scavenger-food-zone";
import {
  buildModeAwareImageReferencePrompt,
  getStoryModeImageReferenceRoles,
  type StoryModeImageReferenceRoles,
} from "@/lib/story-mode-image-reference-roles";

export type WorkflowPrompt = {
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

const FINAL_MERGE_NEGATIVE_PROMPT =
  "Negative prompt: no blood, no gore, no visible wounds, no visible injury, no graphic feeding, no exposed flesh, no graphic carcass detail, no extra limbs, no duplicate animals, no fused bodies, no melted anatomy, no distorted face, no floating animals, no wrong scale, no wrong habitat, no humans, no vehicles, no fences, no zoo enclosure, no text, no subtitles, no watermark, no logo, no cartoon, no CGI, no plastic texture, no excessive blur, no excessive camera shake.";

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

function buildOffspringMasterReferencePrompt({
  offspringLabel,
  motherName,
  roleTitle,
  preserveLine,
  relationshipLine,
  sceneGoal,
}: {
  offspringLabel: string;
  motherName: string;
  roleTitle: string;
  preserveLine: string;
  relationshipLine: string;
  sceneGoal: string;
}) {
  return [
    "Photorealistic wildlife documentary master reference image.",
    `single ${offspringLabel}, correctly scaled young animal, sheltered posture, same species as mother when applicable, clean silhouette, full-body readable, no injury.`,
    `${roleTitle} for WSTV Mother & Baby.`,
    `${preserveLine}`,
    `Mother species anchor: ${motherName}; keep the young animal smaller than the mother in later merge prompts.`,
    `${sceneGoal} ${relationshipLine}`,
    "Simple uncluttered natural background, grounded contact, readable young-animal anatomy, no adult duplicate, no second offspring, no fusion with any parent body.",
    "Production-ready wildlife master reference image for Nano Banana 2 primary image generation.",
    "No blood, no gore, no visible wounds, no duplicate animals, no humans, no text, no watermark, no graphic injury.",
  ].join(" ");
}

export function buildMergeMasterPrompt({
  leadAnimalName,
  oppositeAnimalName,
  offspringName = "offspring",
  environmentName,
  environmentReferenceName,
  lightingName,
  stage,
  modeContext,
  roles,
  referenceTags,
}: {
  leadAnimalName: string;
  oppositeAnimalName: string;
  offspringName?: string;
  environmentName: string;
  environmentReferenceName: string;
  lightingName: string;
  stage: MergeStage;
  modeContext?: StoryModePromptContext;
  roles: StoryModeImageReferenceRoles;
  referenceTags: NanoBananaReferenceTags;
}) {
  const roleLockBlock = buildPreparedReferenceRoleLockBlock({
    referenceTags,
    leadAnimalName,
    oppositeAnimalName,
    offspringName,
    environmentReferenceName,
    roles,
  });
  const compositionLine = roles.isPredatorVsPrey ? stage.composition : roles.mergeCompositionLine;
  const explicitReferenceLine = referenceTags.offspring
    ? `Use all four prepared references explicitly: ${referenceTags.primary}, ${referenceTags.offspring}, ${referenceTags.secondary}, ${referenceTags.environment}.`
    : "";
  const offspringScaleLine = referenceTags.offspring
    ? `Mother & Baby blocking: keep ${referenceTags.offspring} close to ${referenceTags.primary}, partially sheltered behind or under her body line, visibly smaller than the mother, readable as its own subject, and not fused into ${referenceTags.primary}; keep ${referenceTags.secondary} separated at readable distance with no contact.`
    : "";
  const secondaryIsAnimal = roles.secondaryKind === "animal" || roles.secondaryKind === "group";
  const readabilityLine = roles.isPredatorVsPrey
    ? `Keep ${leadAnimalName} and ${oppositeAnimalName} with full-body readability from ears/head through legs/feet/tail, with stable anatomy, correct limb count, realistic muscle/bone landmarks, grounded paw and hoof contact, clean silhouettes, no fused bodies, and no duplicated animals.`
    : secondaryIsAnimal
      ? `Keep ${roles.mergeStageSubjectLine} with full-body readability and correct scale, with stable anatomy where animals are present, grounded contact, clean silhouettes, no fused bodies, no duplicated animals, and no graphic outcome.`
      : `Keep ${leadAnimalName} with full-body readability, correct scale, stable anatomy, and grounded contact. Treat ${oppositeAnimalName} as ${roles.secondaryReferenceLabel.toLowerCase()}, not as an animal opponent; preserve natural scale, terrain interaction, clean spacing, and no graphic outcome.`;

  return [
    "Final merge master-image prompt. Use a natural-language cinematic brief with clear reference roles, layered scene construction, and photographic direction.",
    "",
    roleLockBlock,
    explicitReferenceLine,
    offspringScaleLine,
    "",
    `Final image goal: ${stage.title}. Photorealistic wildlife documentary final scene master image, video-ready source frame for a hybrid wildlife reel.`,
    modeContext ? `Story mode: ${modeContext.modeLabel}. ${modeContext.sceneGoal} ${modeContext.relationshipLine}` : "",
    modeContext ? `${modeContext.modeSpecificActionLine} ${modeContext.violenceLine}` : "",
    roles.isPredatorVsPrey
      ? `Layer the scene from background to foreground: first preserve ${environmentName} as the habitat plate with ${lightingName}, terrain depth, ambush lanes, ground plane, atmospheric depth, and natural color temperature; then place the two identity-locked animals into that environment with believable scale and spacing.`
      : `Layer the scene from background to foreground: first preserve ${environmentName} as the habitat or scene-pressure reference with ${lightingName}, terrain depth, ground plane, atmospheric depth, and natural color temperature; then place the mode-specific subjects into that environment with believable scale and spacing.`,
    compositionLine,
    readabilityLine,
    roles.isPredatorVsPrey
      ? "Cinematic telephoto documentary framing, low natural camera height, strong subject separation, clear attack/escape corridor, realistic body mass, habitat-accurate terrain contact, natural depth of field, sharp animal detail, controlled background detail, no over-stylized CGI look."
      : "Cinematic telephoto documentary framing, low natural camera height, strong subject separation, clear action/escape/pressure corridor, realistic body mass, habitat-accurate terrain contact, natural depth of field, sharp subject detail, controlled background detail, no over-stylized CGI look.",
    `Purpose: ${roles.mergeStageDirections[stage.number] ?? stage.stageDirection}`,
    "Safety and realism: clean survival tension only, no visible injury, no graphic outcome, no humans, no vehicles, no fences, no zoo enclosure, no text, no watermark.",
    "",
    referenceTags.offspring ? "Mother & Baby safety: no blood, no gore, no visible injury, no contact, correct young-animal scale, no fused mother-offspring bodies." : "",
    FINAL_MERGE_NEGATIVE_PROMPT,
  ].filter(Boolean).join("\n");
}

export function buildReferencePrompts(data: GeneratedPackage) {
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
  const roles = getStoryModeImageReferenceRoles(data);
  const offspringName = cleanText(data.offspringLabel, "cub");
  const environmentSubjectName = roles.environmentKind === "food-zone"
    ? normalizeScavengerFoodZone(data.foodItem)
    : environmentName;
  const referenceTags = buildNanoBananaReferenceTags({
    leadAnimalName,
    oppositeAnimalName,
    roles,
  });

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

  const primaryPrompt = roles.isPredatorVsPrey
    ? strengthenReferencePrompt(
        (leadPrompt + modeReferenceLine).replace(
          /production-ready [^.]+ reference\./,
          "production-ready wildlife master reference image."
        ),
        "lead"
      )
    : buildModeAwareImageReferencePrompt({
        subjectName: leadAnimalName,
        roleTitle: roles.primaryTitle,
        kind: roles.primaryKind,
        preserveLine: roles.primaryPreserveLine,
        modeLabel: roles.modeLabel,
        relationshipLine: modeContext?.relationshipLine ?? roles.mergeCompositionLine,
        sceneGoal: modeContext?.sceneGoal ?? roles.mergeCompositionLine,
      });

  const secondaryPrompt = roles.isPredatorVsPrey
    ? strengthenReferencePrompt(
        (oppositePrompt + modeReferenceLine).replace(
          /production-ready [^.]+ reference\./,
          "production-ready wildlife master reference image."
        ),
        "opposite"
      )
    : buildModeAwareImageReferencePrompt({
        subjectName: oppositeAnimalName,
        roleTitle: roles.secondaryTitle,
        kind: roles.secondaryKind,
        preserveLine: roles.secondaryPreserveLine,
        modeLabel: roles.modeLabel,
        relationshipLine: modeContext?.relationshipLine ?? roles.mergeCompositionLine,
        sceneGoal: modeContext?.sceneGoal ?? roles.mergeCompositionLine,
      });

  const habitatPrompt = roles.isPredatorVsPrey
    ? strengthenReferencePrompt(environmentPrompt + modeReferenceLine, "environment")
    : buildModeAwareImageReferencePrompt({
        subjectName: environmentSubjectName,
        roleTitle: roles.environmentTitle,
        kind: roles.environmentKind,
        preserveLine: roles.environmentPreserveLine,
        modeLabel: roles.modeLabel,
        relationshipLine: modeContext?.relationshipLine ?? roles.mergeCompositionLine,
        sceneGoal: modeContext?.sceneGoal ?? roles.mergeCompositionLine,
      });
  const nanoBadge = roles.isPredatorVsPrey
    ? "Nano Banana 2 Primary · GPT Image 2 Backup"
    : "Nano Banana 2 Primary";

  const offspringPrompt = referenceTags.offspring && roles.offspringTitle && roles.offspringPreserveLine
    ? buildOffspringMasterReferencePrompt({
        offspringLabel: offspringName,
        motherName: leadAnimalName,
        roleTitle: roles.offspringTitle,
        preserveLine: roles.offspringPreserveLine,
        relationshipLine: modeContext?.relationshipLine ?? roles.mergeCompositionLine,
        sceneGoal: modeContext?.sceneGoal ?? roles.mergeCompositionLine,
      })
    : undefined;

  const referencePrompts: WorkflowPrompt[] = [
    {
      number: 1,
      title: `${referenceTags.primary} — ${roles.primaryTitle}`,
      helper: roles.primaryHelper,
      badge: nanoBadge,
      prompt: withReferenceName(primaryPrompt, referenceTags.primary),
      copyLabel: roles.primaryCopyLabel,
      tone: "amber",
      backupNote: roles.isPredatorVsPrey ? OPTIONAL_GPT_IMAGE_2_BACKUP_NOTE : undefined,
    },
  ];

  if (referenceTags.offspring && offspringPrompt && roles.offspringTitle && roles.offspringCopyLabel) {
    referencePrompts.push({
      number: 2,
      title: `${referenceTags.offspring} — ${roles.offspringTitle}`,
      helper: roles.offspringHelper ?? "Create the reusable offspring reference in Nano Banana 2 first.",
      badge: nanoBadge,
      prompt: withReferenceName(offspringPrompt, referenceTags.offspring),
      copyLabel: roles.offspringCopyLabel,
      tone: "amber",
      backupNote: roles.isPredatorVsPrey ? OPTIONAL_GPT_IMAGE_2_BACKUP_NOTE : undefined,
    });
  }

  referencePrompts.push(
    {
      number: referencePrompts.length + 1,
      title: `${referenceTags.secondary} — ${roles.secondaryTitle}`,
      helper: roles.secondaryHelper,
      badge: nanoBadge,
      prompt: withReferenceName(secondaryPrompt, referenceTags.secondary),
      copyLabel: roles.secondaryCopyLabel,
      tone: "amber",
      backupNote: roles.isPredatorVsPrey ? OPTIONAL_GPT_IMAGE_2_BACKUP_NOTE : undefined,
    },
    {
      number: referencePrompts.length + 2,
      title: `${referenceTags.environment} — ${roles.environmentTitle}`,
      helper: roles.environmentHelper,
      badge: nanoBadge,
      prompt: withReferenceName(habitatPrompt, referenceTags.environment),
      copyLabel: roles.environmentCopyLabel,
      tone: "indigo",
      backupNote: roles.isPredatorVsPrey ? OPTIONAL_GPT_IMAGE_2_BACKUP_NOTE : undefined,
    }
  );

  return {
    leadAnimalName,
    oppositeAnimalName,
    offspringName,
    environmentName,
    environmentReferenceName: environmentSubjectName,
    lightingName,
    modeContext,
    roles,
    referencePrompts,
    referenceTags,
  };
}

export function buildNanoBananaMergePrompts(data: GeneratedPackage): WorkflowPrompt[] {
  const {
    leadAnimalName,
    oppositeAnimalName,
    offspringName,
    environmentName,
    environmentReferenceName,
    lightingName,
    modeContext,
    roles,
    referenceTags,
  } = buildReferencePrompts(data);

  return MERGE_STAGES.map((stage) => ({
    number: stage.number,
    title: roles.isPredatorVsPrey
      ? stage.title
      : roles.modeLabel + " Merge Master Image " + stage.number + " — " + (stage.title.split(" — ")[1] ?? stage.subStage),
    subStage: stage.subStage,
    helper: roles.isPredatorVsPrey
      ? "Merge the 3 reference images with " + stage.subStage.toLowerCase() + " composition."
      : "Merge the mode-aware Nano Banana 2 references for " + roles.modeLabel.toLowerCase() + " with " + stage.subStage.toLowerCase() + " composition.",
    badge: roles.isPredatorVsPrey
      ? "Nano Banana 2 Primary · GPT Image 2 Backup"
      : "Nano Banana 2 Primary",
    prompt: buildMergeMasterPrompt({
      leadAnimalName,
      oppositeAnimalName,
      offspringName,
      environmentName,
      environmentReferenceName,
      lightingName,
      stage,
      modeContext,
      roles,
      referenceTags,
    }),
    copyLabel: "Merge " + stage.number,
    tone: "emerald",
    backupNote: roles.isPredatorVsPrey ? OPTIONAL_GPT_IMAGE_2_BACKUP_NOTE : undefined,
  }));
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
    roles,
    referencePrompts,
  } = buildReferencePrompts(data);
  const structuredSourceNote = structuredPrompts?.imagePrompt?.pasteReady
    ? "The existing full-scene image prompt stays available below; this workflow splits it into Nano Banana 2 primary references first."
    : "Reference prompts are derived from the current package story mode, subjects, and environment.";

  const mergePrompts = buildNanoBananaMergePrompts(data);
  const referenceCountLabel = referencePrompts.length === 4 ? "four" : "three";

  const allPrompts = [
    "WSTV IMAGE REFERENCE MERGE WORKFLOW",
    "",
    "STEP 1 — MASTER REFERENCE IMAGES",
    ...referencePrompts.flatMap((item) => [
      "",
      `${item.number}. ${item.title}`,
      item.prompt,
      item.backupNote ? `Note: ${item.backupNote}` : "",
    ].filter(Boolean)),
    "",
    "STEP 2 — FINAL MERGE MASTER IMAGES",
    ...mergePrompts.flatMap((item) => [
      "",
      `${item.number}. ${item.title}`,
      item.prompt,
      item.backupNote ? `Note: ${item.backupNote}` : "",
    ].filter(Boolean)),
    "",
    "STEP 3 — HYBRID VIDEO HANDOFF",
    ...HANDOFF_ROWS.map((row) => `${row.image} -> ${row.shot}`),
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
              Build {referenceCountLabel} Nano Banana 2 primary references first, then generate four mode-aware merge
              master images for the hybrid video handoff. {structuredSourceNote}
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
            note={roles.isPredatorVsPrey ? "Create the separate Nano Banana 2 primary references before merging scenes." : "Create the separate Nano Banana 2 primary references for " + roles.modeLabel.toLowerCase() + " before merging scenes."}
          />
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            {referencePrompts.map((item) => (
              <WorkflowCard key={item.title} item={item} onCopy={onCopy} />
            ))}
          </div>
        </div>

        <FlowDivider label={roles.isPredatorVsPrey ? "Use the 3 reference images in Nano Banana 2, then merge" : "Use the " + referencePrompts.length + " " + roles.modeLabel + " references in Nano Banana 2, then merge"} />

        <div>
          <StepHeader
            step="STEP 2"
            title="FINAL MERGE MASTER IMAGES"
            note={roles.isPredatorVsPrey ? "Each merge prompt uses the lead animal, opposite animal, and environment reference images." : referencePrompts.length === 4 ? "Each merge prompt uses the mother, offspring/cub, threat, and environment references." : "Each merge prompt uses the mode-specific subject, pressure, and environment references."}
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
