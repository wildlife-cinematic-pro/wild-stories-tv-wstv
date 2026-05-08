import { StoryMode } from "@/types";

import type { GeneratedPackage } from "@/types";

export type FacebookHookVariant = {
  rank: number;
  hook: string;
  style: "danger" | "mystery" | "survival" | "emotion" | "spectacle";
  score: number;
  reason: string;
};

type HookDraft = Omit<FacebookHookVariant, "rank">;

const MAX_HOOK_CHARS = 90;

const ENGAGEMENT_BAIT_PATTERN =
  /\b(comment yes|comment no|like if|tag a friend|share this|react to vote)\b/i;

function labelFromValue(value: string | undefined, fallback: string) {
  return value?.trim() || fallback;
}

function getModeSubjects(pkg: GeneratedPackage) {
  const subjectA = labelFromValue(pkg.subjectA ?? pkg.predatorName, "the lead animal");
  const subjectB = labelFromValue(pkg.subjectB ?? pkg.preyName, "the other animal");

  return {
    subjectA,
    subjectB,
    offspring: pkg.offspringLabel ?? "offspring",
    foodItem: pkg.foodItem ?? "the food zone",
  };
}

function cleanHook(hook: string) {
  return hook
    .replace(/\s+/g, " ")
    .replace(/[.]+$/g, "")
    .trim()
    .slice(0, MAX_HOOK_CHARS)
    .trim();
}

function makeVariant(
  hook: string,
  style: FacebookHookVariant["style"],
  score: number,
  reason: string
): HookDraft {
  return {
    hook: cleanHook(hook),
    style,
    score,
    reason,
  };
}

function modeHookDrafts(pkg: GeneratedPackage): HookDraft[] {
  const storyMode = pkg.storyMode ?? StoryMode.PREDATOR_VS_PREY;
  const { subjectA, subjectB, offspring, foodItem } = getModeSubjects(pkg);

  switch (storyMode) {
    case StoryMode.MOTHER_BABY:
      return [
        makeVariant(
          `The mother moved before ${subjectB} got closer`,
          "emotion",
          95,
          "Leads with protection and immediate first-frame tension."
        ),
        makeVariant(
          `One small ${offspring} changes the whole standoff`,
          "emotion",
          91,
          "Adds emotional stakes with safe wording."
        ),
        makeVariant(
          `${subjectA} saw the threat before the camera did`,
          "mystery",
          88,
          "Creates replay value around the tell."
        ),
        makeVariant(
          `The safest path opens for one second`,
          "survival",
          85,
          "Frames the short escape window clearly."
        ),
        makeVariant(
          `Protection starts before the rush begins`,
          "survival",
          82,
          "Strong survival angle for a clean survival story."
        ),
      ];
    case StoryMode.HERD_DEFENSE:
      return [
        makeVariant("The herd saw the danger first", "survival", 94, "Simple group-defense hook."),
        makeVariant(
          `${subjectA} turned into a wall`,
          "spectacle",
          90,
          "Highlights formation power in a readable way."
        ),
        makeVariant(
          `${subjectB} never owned the open lane`,
          "mystery",
          87,
          "Builds curiosity around spacing and strategy."
        ),
        makeVariant(
          "The outside edge became the danger zone",
          "danger",
          84,
          "Directs attention to the first-frame pressure point."
        ),
        makeVariant(
          "One formation changed the whole chase",
          "spectacle",
          81,
          "Keeps the group movement clear and replayable."
        ),
      ];
    case StoryMode.RIVAL_CLASH:
      return [
        makeVariant("Neither rival wanted to step back", "spectacle", 93, "Dominance hook with safe wildlife tension."),
        makeVariant(
          "The standoff tightened before either animal moved",
          "mystery",
          89,
          "Points viewers toward posture changes."
        ),
        makeVariant(
          `${subjectA} and ${subjectB} held the whole meadow still`,
          "spectacle",
          86,
          "Makes the setting and rival energy clear."
        ),
        makeVariant(
          "One lowered head changed the pressure",
          "danger",
          84,
          "Uses a realistic body-language tell."
        ),
        makeVariant(
          "The dominance line was drawn in silence",
          "mystery",
          81,
          "Gives the clip a replayable visual clue."
        ),
      ];
    case StoryMode.NEAR_MISS:
      return [
        makeVariant("The escape lane closes fast", "danger", 95, "Direct near-miss first-frame tension."),
        makeVariant(
          "One last-second turn saved the whole run",
          "survival",
          91,
          "Sharp survival promise without false outcome language."
        ),
        makeVariant(
          `${subjectA} had one opening left`,
          "survival",
          88,
          "Makes the viewer search for the open lane."
        ),
        makeVariant(
          `${subjectB} almost read the move in time`,
          "mystery",
          85,
          "Creates replay value around timing."
        ),
        makeVariant(
          "The brush changed everything",
          "mystery",
          82,
          "Habitat-led hook for a clean escape story."
        ),
      ];
    case StoryMode.FISHING_STRIKE:
      return [
        makeVariant("The strike happens between two splashes", "spectacle", 93, "Clean action timing hook."),
        makeVariant(
          `${subjectA} waited for the water to move first`,
          "mystery",
          90,
          "Makes timing feel intentional and replayable."
        ),
        makeVariant(
          `One flash near the surface changes the shot`,
          "spectacle",
          87,
          "Uses waterline movement as the visual hook."
        ),
        makeVariant(
          `${foodItem} stayed readable for one second`,
          "survival",
          84,
          "Keeps the food-source action clean and practical."
        ),
        makeVariant(
          "The river gave away the moment first",
          "mystery",
          81,
          "Encourages a real viewer read, not engagement bait."
        ),
      ];
    case StoryMode.WEATHER_SURVIVAL:
      return [
        makeVariant("The weather became the real opponent", "survival", 94, "Strong natural-hazard hook."),
        makeVariant(
          `${subjectA} kept moving when the storm closed in`,
          "survival",
          90,
          "Shows endurance without fight language."
        ),
        makeVariant(
          "One path through the storm stays open",
          "mystery",
          87,
          "Creates replay value around route readability."
        ),
        makeVariant(
          "The wind changed the whole survival line",
          "spectacle",
          84,
          "Centers the hazard as the story engine."
        ),
        makeVariant(
          "The hardest shot is just staying upright",
          "emotion",
          81,
          "Adds empathy while staying wildlife-documentary safe."
        ),
      ];
    case StoryMode.MIGRATION:
      return [
        makeVariant("One wrong step changes the whole crossing", "danger", 95, "Clear migration pressure."),
        makeVariant(
          `${subjectA} reached the crossing line first`,
          "spectacle",
          90,
          "Gives the audience a readable lead subject."
        ),
        makeVariant(
          "The whole route depends on the first move",
          "mystery",
          87,
          "Makes a large-group scene feel focused."
        ),
        makeVariant(
          "The crossing narrows faster than it looks",
          "danger",
          84,
          "Highlights spatial tension and replay value."
        ),
        makeVariant(
          "The herd commits before the water settles",
          "survival",
          82,
          "Motion-first migration hook."
        ),
      ];
    case StoryMode.SCAVENGER_CONFLICT:
      return [
        makeVariant("The food claim line is already drawn", "mystery", 92, "Ownership tension with clean detail."),
        makeVariant(
          `${subjectB} circles but never owns the space`,
          "danger",
          89,
          "Focuses on spacing and pressure."
        ),
        makeVariant(
          `${subjectA} guards the zone without moving first`,
          "mystery",
          86,
          "Replayable body-language hook."
        ),
        makeVariant(
          "One step too close changes the standoff",
          "danger",
          83,
          "Strong conflict line without bait."
        ),
        makeVariant(
          "The tension starts outside the food zone",
          "survival",
          80,
          "Keeps the scene non-graphic and readable."
        ),
      ];
    case StoryMode.PREDATOR_VS_PREY:
    default:
      return [
        makeVariant("The escape lane closes fast", "danger", 94, "Predator/prey pressure is immediate."),
        makeVariant(
          `${subjectA} read the opening before ${subjectB} moved`,
          "mystery",
          90,
          "Adds a replayable first-frame tell."
        ),
        makeVariant(
          `${subjectB} has one clean way out`,
          "survival",
          87,
          "Clear survival stakes without unsafe detail."
        ),
        makeVariant(
          "The first step decides the whole chase",
          "danger",
          84,
          "Simple motion-first Reels hook."
        ),
        makeVariant(
          "Watch the open lane before it disappears",
          "mystery",
          81,
          "Viewer-read CTA without engagement bait."
        ),
      ];
  }
}

export function buildFacebookHookVariants(pkg: GeneratedPackage): FacebookHookVariant[] {
  return modeHookDrafts(pkg)
    .filter((variant) => variant.hook.length <= MAX_HOOK_CHARS)
    .filter((variant) => !ENGAGEMENT_BAIT_PATTERN.test(variant.hook))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((variant, index) => ({
      ...variant,
      rank: index + 1,
    }));
}
