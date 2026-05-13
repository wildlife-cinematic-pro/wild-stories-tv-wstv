import type {
  ImageReferenceKind,
  StoryModeImageReferenceRoles,
} from "@/lib/story-mode-image-reference-roles";
import { StoryMode } from "@/types";
import { buildReferenceTag } from "@/lib/reference-tags";

export type NanoBananaReferenceTags = {
  primary: string;
  offspring?: string;
  secondary: string;
  environment: string;
};

export function buildNanoBananaReferenceTags({
  leadAnimalName,
  oppositeAnimalName,
  roles,
}: {
  leadAnimalName: string;
  oppositeAnimalName: string;
  roles: Pick<StoryModeImageReferenceRoles, "storyMode" | "secondaryKind" | "environmentKind">;
}): NanoBananaReferenceTags {
  if (roles.storyMode === StoryMode.MOTHER_BABY) {
    return {
      primary: "@mother",
      offspring: "@offspring",
      secondary: "@threat",
      environment: "@environment",
    };
  }

  const secondaryFallback =
    roles.secondaryKind === "food-source"
      ? "fish_food_reference"
      : roles.secondaryKind === "hazard"
        ? "weather_hazard_reference"
        : roles.secondaryKind === "route"
          ? "crossing_route_reference"
          : "secondary_reference";

  return {
    primary: buildReferenceTag(leadAnimalName, "primary_reference"),
    secondary:
      roles.secondaryKind === "food-source" ||
      roles.secondaryKind === "hazard" ||
      roles.secondaryKind === "route"
        ? buildReferenceTag("", secondaryFallback)
        : buildReferenceTag(oppositeAnimalName, secondaryFallback),
    environment:
      roles.environmentKind === "food-zone"
        ? buildReferenceTag("", "food_zone_environment")
        : buildReferenceTag("", "environment"),
  };
}

export function withReferenceName(prompt: string, referenceTag: string) {
  return [`Prepared reference name: ${referenceTag}.`, "", prompt].join("\n");
}

export function buildPreparedReferenceLine({
  tag,
  subject,
  kind,
  preserveLine,
  fallbackLabel,
}: {
  tag: string;
  subject: string;
  kind: ImageReferenceKind;
  preserveLine: string;
  fallbackLabel: string;
}) {
  if (kind === "animal") {
    return `${tag} — ${subject} identity only: species markers, coat/feathers/fur, head profile, body scale, legs/wings, grounded contact, clean silhouette, stable anatomy.`;
  }

  if (kind === "offspring") {
    return `${tag} — ${subject} identity only: correctly scaled young animal, same species as mother when applicable, smaller than mother, sheltered posture, clean full-body silhouette, stable anatomy, grounded contact, no injury, and readable separation from the mother.`;
  }

  if (kind === "group") {
    return `${tag} — ${subject} identity only: species markers, coat/fur, herd/pack formation, body scale, legs, grounded contact, clean silhouettes, stable anatomy.`;
  }

  if (kind === "food-zone") {
    return `${tag} — animal-free food-zone/environment only: non-graphic food claim zone, obscured food source, grass and terrain cover, lighting, spacing lanes, claim-line geography, no visible carcass detail, no blood, no gore.`;
  }

  if (kind === "environment") {
    return `${tag} — environment only: habitat, lighting, terrain, ground texture, atmosphere, background depth, spacing lanes, and scene geography.`;
  }

  return `${tag} — ${fallbackLabel} only: ${preserveLine}.`;
}

export function buildPreparedReferenceBlock({
  referenceTags,
  leadAnimalName,
  offspringName,
  oppositeAnimalName,
  environmentReferenceName,
  roles,
}: {
  referenceTags: NanoBananaReferenceTags;
  leadAnimalName: string;
  offspringName?: string;
  oppositeAnimalName: string;
  environmentReferenceName: string;
  roles: StoryModeImageReferenceRoles;
}) {
  const lines = [
    `1. ${buildPreparedReferenceLine({
      tag: referenceTags.primary,
      subject: leadAnimalName,
      kind: roles.primaryKind,
      preserveLine: roles.primaryPreserveLine,
      fallbackLabel: roles.primaryReferenceLabel,
    })}`,
  ];

  if (referenceTags.offspring && roles.offspringKind && roles.offspringPreserveLine && roles.offspringReferenceLabel) {
    lines.push(`2. ${buildPreparedReferenceLine({
      tag: referenceTags.offspring,
      subject: offspringName ?? roles.offspringReferenceLabel,
      kind: roles.offspringKind,
      preserveLine: roles.offspringPreserveLine,
      fallbackLabel: roles.offspringReferenceLabel,
    })}`);
  }

  const secondaryNumber = lines.length + 1;
  lines.push(`${secondaryNumber}. ${buildPreparedReferenceLine({
    tag: referenceTags.secondary,
    subject: oppositeAnimalName,
    kind: roles.secondaryKind,
    preserveLine: roles.secondaryPreserveLine,
    fallbackLabel: roles.secondaryReferenceLabel,
  })}`);
  lines.push(`${secondaryNumber + 1}. ${buildPreparedReferenceLine({
    tag: referenceTags.environment,
    subject: environmentReferenceName,
    kind: roles.environmentKind,
    preserveLine: roles.environmentPreserveLine,
    fallbackLabel: roles.environmentReferenceLabel,
  })}`);

  return lines;
}

export function buildPreparedReferenceRoleLockBlock(input: Parameters<typeof buildPreparedReferenceBlock>[0]) {
  return [
    "Use prepared Nano Banana 2 references:",
    ...buildPreparedReferenceBlock(input),
  ].join("\n");
}
