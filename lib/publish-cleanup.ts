import { runFacebookPublishGuard } from "@/lib/facebookPublishGuard";
import {
  build2026HookByFamily,
  buildCTA,
  buildHashtags,
  buildShortCaption,
  evaluateHookCopyQuality,
  hasBaitLikeCopy,
  hasForcedEngagementCopy,
} from "@/lib/platform-packs";
import { sanitizeSocialCopyText } from "@/lib/prompt-builders/sanitizers";

import type {
  ConceptVariant,
  ContentLane,
  PublishCleanupField,
} from "@/types";

const MAX_CAPTION_LENGTH = 180;

function normalizeCopy(text: string): string {
  return String(text ?? "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;!?])/g, "$1")
    .trim();
}

function trimAtWordBoundary(text: string, maxChars: number): string {
  const compact = normalizeCopy(text);
  if (compact.length <= maxChars) return compact;

  const words = compact.split(/\s+/).filter(Boolean);
  let resolved = "";

  for (const word of words) {
    const next = resolved ? `${resolved} ${word}` : word;
    if (next.length > maxChars) break;
    resolved = next;
  }

  return normalizeCopy(resolved.replace(/[,:;/-]+$/g, ""));
}

function cleanHashtagToken(tag: string): string | null {
  const cleaned = String(tag ?? "")
    .replace(/^#+/g, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase()
    .trim();

  if (!cleaned) return null;
  return `#${cleaned}`;
}

function buildCleanHashtagString(
  currentHashtags: string,
  predator: string,
  prey: string,
  arc: ConceptVariant["arc"],
  contentLane: ContentLane
): string {
  const current = currentHashtags
    .split(/\s+/)
    .map(cleanHashtagToken)
    .filter((tag): tag is string => Boolean(tag));
  const fallback = buildHashtags(predator, prey, arc, {
    count: 5,
    contentLane,
  })
    .split(/\s+/)
    .map(cleanHashtagToken)
    .filter((tag): tag is string => Boolean(tag));

  const resolved: string[] = [];
  for (const candidate of [...current, ...fallback]) {
    if (!resolved.includes(candidate)) resolved.push(candidate);
    if (resolved.length >= 5) break;
  }

  return resolved.slice(0, 5).join(" ");
}

function buildCleanupSummary(
  changedFields: PublishCleanupField[],
  isPass: boolean,
  warningsResolved: number,
  remainingWarnings: number
): { summary: string; notes: string[] } {
  const notes: string[] = [];

  if (changedFields.includes("hook")) {
    notes.push("Hook now leads with a cleaner species-or-behavior read.");
  }
  if (changedFields.includes("caption")) {
    notes.push("Caption now reads faster for the Facebook feed.");
  }
  if (changedFields.includes("hashtags")) {
    notes.push("Hashtags were normalized to 5 distinct publish-safe tags.");
  }
  if (changedFields.includes("cta")) {
    notes.push("CTA now stays discussion-safe instead of pushing engagement.");
  }

  if (isPass) {
    notes.push("Publish guard now passes after cleanup.");
  } else if (warningsResolved > 0) {
    notes.push(
      `Publish guard warnings dropped by ${warningsResolved}, but ${remainingWarnings} still need review.`
    );
  } else if (remainingWarnings > 0) {
    notes.push("Manual review is still recommended before publish.");
  }

  const fieldList =
    changedFields.length === 0
      ? ""
      : changedFields.length === 1
        ? changedFields[0]
        : `${changedFields.slice(0, -1).join(", ")} and ${changedFields.at(-1)}`;

  if (isPass && changedFields.length > 0) {
    return {
      summary: `Auto cleanup tightened ${fieldList} and cleared the publish-safe review.`,
      notes,
    };
  }

  if (changedFields.length > 0) {
    return {
      summary: `Auto cleanup tightened ${fieldList} and reduced publish-risk copy.`,
      notes,
    };
  }

  return {
    summary: isPass
      ? "Copy already reads publish-safe without extra cleanup."
      : "Auto cleanup could not improve the current publish status.",
    notes,
  };
}

export function autoCleanupConceptVariantCopy(input: {
  variant: ConceptVariant;
  predator: string;
  prey: string;
  contentLane: ContentLane;
  originalityConfirmed: boolean;
}): ConceptVariant {
  const { variant, predator, prey, contentLane, originalityConfirmed } = input;

  const originalHook = normalizeCopy(variant.primaryHook);
  const originalCaption = normalizeCopy(variant.caption);
  const originalHashtags = normalizeCopy(variant.hashtags);
  const defaultCta = buildCTA(variant.arc);

  const sanitizedHook = normalizeCopy(sanitizeSocialCopyText(originalHook));
  const hookQuality = evaluateHookCopyQuality(sanitizedHook, predator, prey);
  const cleanedHook =
    !sanitizedHook ||
    hasForcedEngagementCopy(sanitizedHook) ||
    hookQuality.hasBait ||
    hookQuality.score < 65
      ? build2026HookByFamily(predator, prey, variant.arc, variant.hookFamily, {
          contentLane,
        })
      : sanitizedHook;

  const sanitizedCaption = trimAtWordBoundary(
    normalizeCopy(sanitizeSocialCopyText(originalCaption)),
    MAX_CAPTION_LENGTH
  );
  const cleanedCaption =
    !sanitizedCaption ||
    sanitizedCaption.length > MAX_CAPTION_LENGTH ||
    hasBaitLikeCopy(sanitizedCaption) ||
    hasForcedEngagementCopy(sanitizedCaption)
      ? buildShortCaption(predator, prey, variant.finalEnvironment, variant.arc, {
          mode: "us-only",
          contentLane,
        })
      : sanitizedCaption;

  const cleanedHashtags = buildCleanHashtagString(
    originalHashtags,
    predator,
    prey,
    variant.arc,
    contentLane
  );
  const cleanedCta =
    hasForcedEngagementCopy(defaultCta) || hasBaitLikeCopy(defaultCta)
      ? "What behavior changed the outcome first?"
      : defaultCta;

  const changedFields: PublishCleanupField[] = [];
  if (cleanedHook !== originalHook) changedFields.push("hook");
  if (cleanedCaption !== originalCaption) changedFields.push("caption");
  if (cleanedHashtags !== originalHashtags) changedFields.push("hashtags");
  if (cleanedCta !== defaultCta) changedFields.push("cta");

  const report = runFacebookPublishGuard({
    hookText: cleanedHook,
    caption: cleanedCaption,
    hashtags: cleanedHashtags.split(/\s+/).filter(Boolean),
    originalityConfirmed,
    ctaText: cleanedCta,
    predator,
    prey,
  });

  const warningsResolved = Math.max(
    0,
    variant.publishGuardReport.warnings.length - report.warnings.length
  );
  const cleanupCopy = buildCleanupSummary(
    changedFields,
    report.isPass,
    warningsResolved,
    report.warnings.length
  );

  return {
    ...variant,
    primaryHook: cleanedHook,
    caption: cleanedCaption,
    hashtags: cleanedHashtags,
    publishGuardReport: report,
    publishCleanup: {
      applied: changedFields.length > 0,
      changedFields,
      summary: cleanupCopy.summary,
      notes: cleanupCopy.notes,
      warningsResolved,
      remainingWarnings: report.warnings.length,
    },
  };
}
