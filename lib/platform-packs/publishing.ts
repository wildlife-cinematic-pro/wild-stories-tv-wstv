import type { Arc } from "@/types";

import {
  AI_GENERATED_LABEL_REMINDER,
  BRAND_NAME,
  COMMUNITY_NAME,
  FACEBOOK_PAGE_BIO,
  FACEBOOK_PAGE_TAGLINE,
  NO_FAKE_REAL_FOOTAGE_CLAIM,
  NO_REPOST_WATERMARK_WARNING,
  ORIGINALITY_LINE,
} from "@/lib/brand";

import {
  buildContentLaneLongCaptionLead,
  buildContentLaneShortCaptionLead,
  getContentLaneHashtag,
} from "@/lib/content-lanes";

import {
  normalizeCopy,
  sanitizeSocialEnv,
  splitSentences,
  toHashtag,
  toTag,
  trimAtWordBoundary,
  type CaptionOptions,
  type HashtagOptions,
} from "@/lib/platform-packs/shared";

const VIRAL_CAPTIONS: Partial<Record<Arc, (predator: string, prey: string, env: string) => string>> = {
  "Ambush attack": (predator, prey, env) =>
    `In the ${env}, the ${prey.toLowerCase()} lost one second and the ${predator.toLowerCase()} used it. The danger becomes clear before the full move lands.`,
  "Chase and takedown": (predator, prey, env) =>
    `Across the ${env}, the ${predator.toLowerCase()} committed early and the ${prey.toLowerCase()} had almost no time to recover. The closing angle is the real story beat.`,
  "Defender stands ground": (predator, prey, env) =>
    `In the ${env}, every instinct said move. This ${predator.toLowerCase()} stayed put, and that choice shifted the encounter once the ${prey.toLowerCase()} kept pressing.`,
  "Giant vs giant clash": (predator, prey, env) =>
    `Two heavy animals met in the ${env}, and neither wanted to give space. The shoulder weight and footing show the impact before it arrives.`,
  "Territory dominance battle": (predator, prey, env) =>
    `In the ${env}, the claim was already clear before the response landed. The ${prey.toLowerCase()} stepped into it, and the ${predator.toLowerCase()} answered right away.`,
  "Pack hunting strategy": (predator, prey, env) =>
    `At first, the ${prey.toLowerCase()} looked free. Then the trap shape appeared. In the ${env}, the ${predator.toLowerCase()} wins position before full contact.`,
  "Predator vs predator fight": (predator, prey, env) =>
    `A ${predator.toLowerCase()} and a ${prey.toLowerCase()} in the ${env} create a slower kind of tension. Both animals understand the cost of a bad step, so every movement matters more.`,
  "Escape from danger": (predator, prey, env) =>
    `Everything in the ${env} changed in a second. The ${prey.toLowerCase()} had almost no time to process the danger before the ${predator.toLowerCase()} was already moving.`,
};

const SHORT_CAPTIONS_2026: Partial<Record<Arc, (predator: string, prey: string, env: string) => string>> = {
  "Ambush attack": (predator, prey) =>
    `The ${prey.toLowerCase()} looked up too late. The ${predator.toLowerCase()} was already inside the danger zone.`,
  "Chase and takedown": (predator, prey) =>
    `The ${predator.toLowerCase()} committed first. The ${prey.toLowerCase()} had no time to reset.`,
  "Defender stands ground": (predator, prey) =>
    `The ${prey.toLowerCase()} kept pressing. This ${predator.toLowerCase()} never gave ground.`,
  "Giant vs giant clash": (predator, prey) =>
    `${predator} and ${prey} got too close. One heavy step broke the standoff.`,
  "Territory dominance battle": (predator, prey) =>
    `The ${prey.toLowerCase()} crossed the wrong line. The ${predator.toLowerCase()} answered immediately.`,
  "Pack hunting strategy": (predator, prey) =>
    `The ${prey.toLowerCase()} looked free for a second. Then the ${predator.toLowerCase()} folded the angles inward.`,
  "Predator vs predator fight": (predator, prey) =>
    `${predator} and ${prey} met too close. One bad step shifted control fast.`,
  "Escape from danger": (predator, prey) =>
    `The ${predator.toLowerCase()} moved first. The ${prey.toLowerCase()} had almost no time to turn.`,
};

const CAPTIONS_2026: Partial<Record<Arc, (predator: string, prey: string, env: string) => string>> = {
  "Ambush attack": (predator, prey, env) =>
    `In the ${env}, the danger was visible before the full move.

The ${prey.toLowerCase()} looked up too late and the ${predator.toLowerCase()} was already inside striking distance. That is what makes a real ambush land on screen: no long setup, just one bad second and immediate danger.

Which second gave the ambush away?`,
  "Chase and takedown": (predator, prey, env) =>
    `Across the ${env}, the escape window disappeared fast.

The ${predator.toLowerCase()} committed cleanly and the ${prey.toLowerCase()} had almost no time to reset. What makes this kind of chase work on short-form is how clearly the closing angle shows from the first stride.

Which turn mattered most?`,
  "Defender stands ground": (predator, prey, env) =>
    `In the ${env}, every instinct said move. This ${predator.toLowerCase()} did the opposite.

When the ${prey.toLowerCase()} kept moving forward, the encounter stopped feeling like a bluff and started feeling like a real stand. The hold is what makes the moment memorable.

What told you the stand would hold?`,
  "Giant vs giant clash": (predator, prey, env) =>
    `Two huge animals met in the ${env}, and neither wanted to give space.

A ${predator.toLowerCase()} and a ${prey.toLowerCase()} create a slower kind of tension: heavy shoulders, set footing, and posture before the full contact lands.

Which body shift made contact feel inevitable?`,
  "Territory dominance battle": (predator, prey, env) =>
    `In the ${env}, territory is never symbolic.

The ${prey.toLowerCase()} stepped into the wrong space and the ${predator.toLowerCase()} answered immediately. The whole encounter works because the claim is visible before the full reaction lands.

Would you have noticed the claim earlier?`,
  "Pack hunting strategy": (predator, prey, env) =>
    `At first, the ${prey.toLowerCase()} looked mobile. Then the space started disappearing.

In the ${env}, the ${predator.toLowerCase()} becomes dangerous before full contact because the pursuit is already organized. It is timing, spacing, angle control, and a closing path.

Which angle closed the escape first?`,
  "Predator vs predator fight": (predator, prey, env) =>
    `Two apex predators. No easy reset.

A ${predator.toLowerCase()} facing a ${prey.toLowerCase()} in the ${env} feels intense because both animals understand the cost of a bad decision. These encounters escalate fast once control starts to shift.

Which animal gave up position first?`,
  "Escape from danger": (predator, prey, env) =>
    `Everything changed in under a second in the ${env}.

The ${prey.toLowerCase()} had almost no time to react before the ${predator.toLowerCase()} moved. In moments like this, survival comes down to one decision made fast enough.

Would you have spotted the danger in time?`,
};

const CAPTIONS_2026_US_ONLY: Partial<Record<Arc, (predator: string, prey: string, env: string) => string>> = {
  "Ambush attack": (predator, prey, env) =>
    `In the ${env}, the ambush gives itself away early.

The ${prey.toLowerCase()} looked up too late and the ${predator.toLowerCase()} was already inside striking distance. The moment lands because the setup stays clear and the danger arrives without a long windup.

Which second gave the ambush away?`,
  "Chase and takedown": (predator, prey, env) =>
    `Across the ${env}, the running room disappeared fast.

The ${predator.toLowerCase()} committed early and the ${prey.toLowerCase()} never looked fully reset. The sequence works because the closing angle is obvious right away.

Which turn mattered most?`,
  "Defender stands ground": (predator, prey, env) =>
    `In the ${env}, every instinct said move. This ${predator.toLowerCase()} stayed planted.

Once the ${prey.toLowerCase()} kept pressing forward, the encounter shifted from a push to a stand. The refusal to give ground is the whole story beat.

What told you the stand would hold?`,
  "Giant vs giant clash": (predator, prey, env) =>
    `Two huge animals met in the ${env}, and neither gave ground.

A ${predator.toLowerCase()} and a ${prey.toLowerCase()} create a slower kind of tension because shoulder weight and footing show the hit before it arrives.

Which body shift made contact feel inevitable?`,
  "Territory dominance battle": (predator, prey, env) =>
    `In the ${env}, the claim was visible before the answer came.

The ${prey.toLowerCase()} stepped onto held ground and the ${predator.toLowerCase()} answered right away. The moment works because the warning is visible before the reaction peaks.

Would you have noticed the claim earlier?`,
  "Pack hunting strategy": (predator, prey, env) =>
    `At first, the ${prey.toLowerCase()} looked free. Then the opening started shrinking.

In the ${env}, the ${predator.toLowerCase()} feels dangerous because the angles organize before contact. The chase shape does most of the work.

Which angle closed the escape first?`,
  "Predator vs predator fight": (predator, prey, env) =>
    `Two apex predators met in the ${env}, and neither had room for a harmless mistake.

The tension works because both animals understand the cost of giving up position. Once control shifts, the whole clip changes.

Which animal gave up position first?`,
  "Escape from danger": (predator, prey, env) =>
    `Everything changed fast in the ${env}.

The ${prey.toLowerCase()} had almost no time to react before the ${predator.toLowerCase()} moved. The whole beat depends on one breakaway decision made fast enough.

Would you have spotted the danger in time?`,
};

const FACEBOOK_SAFE_HASHTAGS = [
  "#WildlifeReels",
  "#AnimalEncounter",
  "#NatureDrama",
  "#WildStoriesTV",
  "#FacebookReels",
] as const;

const ARC_TAG_LABEL: Record<Arc, string> = {
  "Ambush attack": "ambush predator",
  "Chase and takedown": "wildlife chase",
  "Defender stands ground": "defensive stand",
  "Giant vs giant clash": "giant animal clash",
  "Territory dominance battle": "territory clash",
  "Pack hunting strategy": "pack hunting",
  "Predator vs predator fight": "predator clash",
  "Escape from danger": "escape moment",
};

function finalizeShortCaption(raw: string): string {
  const structuredLines = raw
    .split(/\r?\n/)
    .map((line) => normalizeCopy(line))
    .filter(Boolean)
    .slice(0, 3);

  if (structuredLines.length > 1) {
    const [hook = "", intrigue = "", cta = ""] = structuredLines;
    const cleanedHook = hook.replace(/\.$/, "");
    const line1 = trimAtWordBoundary(cleanedHook, 54).replace(/\.$/, "");
    const line2 = trimAtWordBoundary(intrigue, 62);
    const line3 = trimAtWordBoundary(cta, 54);
    const caption = [line1, line2, line3].filter(Boolean).join("\n");

    return caption.length <= 150
      ? caption
      : [line1, trimAtWordBoundary(line2, 52), trimAtWordBoundary(line3, 42)]
          .filter(Boolean)
          .join("\n");
  }

  const compact = normalizeCopy(raw);
  const sentences = splitSentences(compact);
  const limited = (sentences.length ? sentences : [compact]).slice(0, 2).join(" ");

  if (limited.length <= 150) return limited;

  const firstSentence = sentences[0] ?? limited;
  if (firstSentence.length <= 150) return firstSentence;

  return trimAtWordBoundary(firstSentence, 150);
}

function prependContentLaneLead(raw: string, lead: string | null): string {
  if (!lead) return raw;
  const compactLead = normalizeCopy(lead);
  const lines = raw
    .split(/\r?\n/)
    .map((line) => normalizeCopy(line))
    .filter(Boolean);

  if (lines.length > 1) {
    if (lines.some((line) => line.toLowerCase().includes(compactLead.toLowerCase()))) {
      return lines.join("\n");
    }

    return [lines[0], compactLead, lines[2] ?? lines[1]].filter(Boolean).join("\n");
  }

  const compactRaw = normalizeCopy(raw);
  if (compactRaw.toLowerCase().startsWith(compactLead.toLowerCase())) {
    return compactRaw;
  }

  return `${compactLead} ${compactRaw}`.replace(/\s+/g, " ").trim();
}

function buildCuriosityShortCaption(
  predator: string,
  prey: string,
  env: string,
  arc: Arc
): string | null {
  const predatorLower = predator.toLowerCase();
  const preyLower = prey.toLowerCase();
  const waterlineCue = /\b(water|river|marsh|swamp|bank|shore|lake|creek|channel)\b/i.test(
    env
  );

  switch (arc) {
    case "Ambush attack":
      return `One escape lane stayed open
The ${predatorLower} noticed before the ${preyLower} turned
What did you read first? 👀`;
    case "Escape from danger":
      return waterlineCue
        ? `The water looked calm
One ripple changed the whole read
Did the warning show early? 👀`
        : `The ${predatorLower} moved first
The ${preyLower} had almost no time to turn
Did the warning show early? 👀`;
    case "Pack hunting strategy":
      return `Open space started shrinking
The ${predatorLower} shaped the escape lane
Which angle closed first? 👀`;
    case "Chase and takedown":
      return `The chase angle closed fast
The ${preyLower} lost clean running room
Which move took away space? 👀`;
    case "Giant vs giant clash":
      return `One body shift changed everything
The standoff tightened before contact
Which posture gave it away? 👀`;
    case "Defender stands ground":
      return `The pressure kept building
This ${predatorLower} never gave ground
What made the stand believable? 👀`;
    case "Territory dominance battle":
      return `The warning was visible early
One step crossed the claim line
Did you spot the tell? 👀`;
    case "Predator vs predator fight":
      return `Two predators met too close
One bad step shifted control fast
Who gave up position first? 👀`;
    default:
      return null;
  }
}

function getDiscussionQuestion(arc: Arc): string {
  switch (arc) {
    case "Ambush attack":
      return "Where did the ambush give itself away?";
    case "Chase and takedown":
      return "Which move closed the escape lane first?";
    case "Escape from danger":
      return "Predator read it first or prey almost escaped?";
    case "Pack hunting strategy":
      return "Which angle closed the escape lane first?";
    case "Defender stands ground":
      return "Did you spot the tell before it happened?";
    case "Giant vs giant clash":
      return "Which body shift made contact feel inevitable?";
    case "Territory dominance battle":
      return "Would you have noticed the claim earlier?";
    case "Predator vs predator fight":
      return "Which animal gave up position first?";
    default:
      return "Did you spot the tell before it happened?";
  }
}

export function buildPinnedComment(arc: Arc): string {
  switch (arc) {
    case "Ambush attack":
      return `${COMMUNITY_NAME} — where did the ambush give itself away?`;
    case "Chase and takedown":
      return `${COMMUNITY_NAME} — which move closed the escape lane first?`;
    case "Escape from danger":
      return `${COMMUNITY_NAME} — predator read it first or prey almost escaped?`;
    case "Pack hunting strategy":
      return `${COMMUNITY_NAME} — which move closed the escape lane first?`;
    case "Defender stands ground":
      return `${COMMUNITY_NAME} — did you spot the tell before it happened?`;
    case "Giant vs giant clash":
      return `${COMMUNITY_NAME} — which move closed the escape lane first?`;
    case "Territory dominance battle":
      return `${COMMUNITY_NAME} — did you spot the tell before it happened?`;
    case "Predator vs predator fight":
      return `${COMMUNITY_NAME} — predator read it first or prey almost escaped?`;
    default:
      return `${COMMUNITY_NAME} — did you spot the tell before it happened?`;
  }
}

export function buildCommunityPackage(arc: Arc) {
  const discussionQuestion = getDiscussionQuestion(arc);

  return {
    communityName: COMMUNITY_NAME,
    pinnedComment: buildPinnedComment(arc),
    seriesCTA: `${BRAND_NAME} field note for the ${COMMUNITY_NAME}: watch the tension line, then compare the next scene.`,
    followCTA: `Follow ${BRAND_NAME} for the next ${COMMUNITY_NAME} wildlife story.`,
    discussionQuestion,
  };
}

export function buildOriginalityPublishChecklist() {
  return {
    aiGeneratedLabelReminder: AI_GENERATED_LABEL_REMINDER,
    originalProductionSignal: ORIGINALITY_LINE,
    noRepostWatermarkWarning: NO_REPOST_WATERMARK_WARNING,
    noFakeRealFootageClaim: NO_FAKE_REAL_FOOTAGE_CLAIM,
  };
}

export function buildFacebookPageOptimizationCopy() {
  return {
    pageBio: FACEBOOK_PAGE_BIO,
    tagline: FACEBOOK_PAGE_TAGLINE,
  };
}

export function buildCaption(
  predator: string,
  prey: string,
  env: string,
  arc: Arc,
  options: CaptionOptions = {}
): string {
  const cleanEnv = sanitizeSocialEnv(env);

  const baseRaw =
    SHORT_CAPTIONS_2026[arc]?.(predator, prey, cleanEnv) ??
    VIRAL_CAPTIONS[arc]?.(predator, prey, cleanEnv) ??
    `${predator} and ${prey} collide in the ${cleanEnv}, and the whole sequence turns on one immediate control shift.`;
  const curiosityRaw =
    options.mode === "us-only"
      ? buildCuriosityShortCaption(predator, prey, cleanEnv, arc)
      : null;
  const raw = curiosityRaw ?? baseRaw;

  const caption = options.mode === "us-only" ? raw.replace(/\s+—\s+/g, ": ") : raw;

  return finalizeShortCaption(
    prependContentLaneLead(
      caption,
      buildContentLaneShortCaptionLead(
        options.contentLane ?? "Auto",
        predator,
        prey,
        arc
      )
    )
  );
}

export function build2026Caption(
  predator: string,
  prey: string,
  env: string,
  arc: Arc,
  options: CaptionOptions = {}
): string {
  const cleanEnv = sanitizeSocialEnv(env);

  const baseCaption =
    (options.mode === "us-only" ? CAPTIONS_2026_US_ONLY[arc] : CAPTIONS_2026[arc])?.(
      predator,
      prey,
      cleanEnv
    ) ??
    `${predator} and ${prey} collide in the ${cleanEnv}. The moment feels immediate, physical, and unforgiving from the first move.\n\nWhich part of the sequence changed the outcome for you?`;

  const laneLead = buildContentLaneLongCaptionLead(
    options.contentLane ?? "Auto",
    predator,
    prey,
    arc
  );

  return laneLead ? `${laneLead}\n\n${baseCaption}` : baseCaption;
}

export function buildShortCaption(
  predator: string,
  prey: string,
  env: string,
  arc: Arc,
  options: CaptionOptions = {}
): string {
  return buildCaption(predator, prey, env, arc, options);
}

export function buildLongCaption(
  predator: string,
  prey: string,
  env: string,
  arc: Arc,
  options: CaptionOptions = {}
): string {
  return build2026Caption(predator, prey, env, arc, options);
}

function getArcHashtag(arc: Arc): string {
  return (
    {
      "Ambush attack": "#ambush",
      "Chase and takedown": "#wildlifechase",
      "Defender stands ground": "#animalbehavior",
      "Giant vs giant clash": "#animalclash",
      "Territory dominance battle": "#territory",
      "Pack hunting strategy": "#packhunting",
      "Predator vs predator fight": "#predatorclash",
      "Escape from danger": "#survival",
    }[arc] ?? "#wildlife"
  );
}

export function buildHashtags(
  predator: string,
  prey: string,
  arc: Arc,
  options: HashtagOptions = {}
): string {
  const requestedCount = Math.min(5, Math.max(1, options.count ?? 5));
  const laneTag = getContentLaneHashtag(
    options.contentLane ?? "Auto",
    predator,
    prey,
    arc
  );
  const candidates = [
    laneTag,
    ...FACEBOOK_SAFE_HASHTAGS,
    getArcHashtag(arc),
    toHashtag(predator),
    toHashtag(prey),
  ].filter((tag): tag is string => Boolean(tag));
  const tags: string[] = [];

  for (const candidate of candidates) {
    if (!tags.includes(candidate)) tags.push(candidate);
    if (tags.length >= requestedCount) break;
  }

  return tags.slice(0, requestedCount).join(" ");
}

export function buildTags(predator: string, prey: string, arc: Arc): string {
  const tags = [
    toTag(predator),
    toTag(prey),
    ARC_TAG_LABEL[arc],
    "wildlife",
    "usa nature",
  ].filter(Boolean);

  return [...new Set(tags)].slice(0, 5).join(", ");
}

export function buildSEOTitle(predator: string, prey: string, arc: Arc): string {
  return `${predator} vs ${prey} — ${arc} | ${BRAND_NAME}`;
}

export function buildAltTextPrompt(
  predator: string,
  prey: string,
  env: string,
  arc: Arc
): string {
  const cleanEnv = sanitizeSocialEnv(env);
  return `AI-generated cinematic wildlife scene showing ${predator} and ${prey} in ${cleanEnv} during a ${arc.toLowerCase()} sequence. ${ORIGINALITY_LINE}`;
}
