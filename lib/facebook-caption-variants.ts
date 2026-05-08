import { HabitatRegion, StoryMode } from "@/types";

import type { GeneratedPackage } from "@/types";

export type FacebookCaptionVariant = {
  rank: number;
  caption: string;
  hashtags: string[];
  score: number;
  reason: string;
};

type CaptionDraft = Omit<FacebookCaptionVariant, "rank">;

const MAX_CAPTION_CHARS = 150;

const ENGAGEMENT_BAIT_PATTERN =
  /\b(comment yes|comment no|like if|tag a friend|share this|react to vote)\b/i;

const UNSAFE_PATTERN =
  /\b(gore|blood|bloody|visible injury|torn flesh|exposed injury|broken bones|graphic injury)\b/i;

const HABITAT_HASHTAGS: Partial<Record<HabitatRegion, string>> = {
  [HabitatRegion.YELLOWSTONE]: "#YellowstoneWildlife",
  [HabitatRegion.ALASKA]: "#AlaskaWildlife",
  [HabitatRegion.EVERGLADES]: "#EvergladesWildlife",
  [HabitatRegion.ROCKY_MOUNTAINS]: "#RockyMountainWildlife",
  [HabitatRegion.GREAT_PLAINS]: "#GreatPlainsWildlife",
  [HabitatRegion.PACIFIC_NORTHWEST]: "#PNWWildlife",
  [HabitatRegion.APPALACHIA]: "#AppalachianWildlife",
};

function safeSubject(value: string | undefined, fallback: string) {
  return value?.trim() || fallback;
}

function trimCaption(caption: string) {
  return caption
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_CAPTION_CHARS)
    .trim()
    .replace(/[,.!?;:]+$/g, "");
}

function buildHashtags(pkg: GeneratedPackage, modeTag: string) {
  const regionTag =
    (pkg.habitatRegion && HABITAT_HASHTAGS[pkg.habitatRegion]) || "#USAReels";
  const tags = Array.from(new Set([
    "#WildlifeReels",
    modeTag,
    regionTag,
    "#NatureReels",
    "#WildlifeDocumentary",
    "#AnimalStories",
    "#WildAnimals",
    "#NatureShorts",
    "#USAReels",
  ]));

  return tags.slice(0, 5);
}

function makeCaption(
  caption: string,
  modeTag: string,
  score: number,
  reason: string,
  pkg: GeneratedPackage
): CaptionDraft {
  return {
    caption: trimCaption(caption),
    hashtags: buildHashtags(pkg, modeTag),
    score,
    reason,
  };
}

function modeCaptionDrafts(pkg: GeneratedPackage): CaptionDraft[] {
  const storyMode = pkg.storyMode ?? StoryMode.PREDATOR_VS_PREY;
  const subjectA = safeSubject(pkg.subjectA ?? pkg.predatorName, "the lead animal");
  const subjectB = safeSubject(pkg.subjectB ?? pkg.preyName, "the second animal");
  const offspring = pkg.offspringLabel ?? "offspring";

  switch (storyMode) {
    case StoryMode.MOTHER_BABY:
      return [
        makeCaption(
          `A ${subjectA} shields her ${offspring} as ${subjectB} closes the distance. Protection starts early.`,
          "#AnimalStories",
          95,
          "Emotional protection angle with clean survival tension.",
          pkg
        ),
        makeCaption(
          `The smallest movement tells the whole story: ${subjectA}, ${offspring}, and one approaching threat.`,
          "#NatureShorts",
          91,
          "Searchable wildlife language with replay value.",
          pkg
        ),
        makeCaption(
          `${subjectA} reads the danger before the rush begins. A quiet survival moment for Facebook Reels.`,
          "#WildAnimals",
          88,
          "Clear Reels positioning without engagement bait.",
          pkg
        ),
        makeCaption(
          `Mother and ${offspring} stay readable while the pressure builds at the edge of the frame.`,
          "#AnimalStories",
          85,
          "Highlights first-frame readability.",
          pkg
        ),
        makeCaption(
          `A protective wildlife standoff with clean tension, clear spacing, and no unsafe outcome.`,
          "#NatureReels",
          82,
          "Monetization-safe caption for the mode.",
          pkg
        ),
      ];
    case StoryMode.HERD_DEFENSE:
      return [
        makeCaption(
          `${subjectA} forms a defensive wall as ${subjectB} tests the edge. The group saw it first.`,
          "#AnimalStories",
          94,
          "Group-defense hook with strong subject clarity.",
          pkg
        ),
        makeCaption(
          `The herd tightens, the open lane shrinks, and the pressure stays clean and readable.`,
          "#WildAnimals",
          90,
          "Spatial tension and platform-safe wording.",
          pkg
        ),
        makeCaption(
          `A USA wildlife standoff built on formation, spacing, and one dangerous outside edge.`,
          "#NatureShorts",
          87,
          "Good search phrasing for herd defense.",
          pkg
        ),
        makeCaption(
          `${subjectB} presses from the outside, but ${subjectA} changes the whole shape of the scene.`,
          "#WildlifeDocumentary",
          84,
          "Emphasizes original visual story structure.",
          pkg
        ),
        makeCaption(
          `No chaos, just a powerful herd-defense moment with real survival tension.`,
          "#NatureReels",
          81,
          "Safety-forward caption.",
          pkg
        ),
      ];
    case StoryMode.RIVAL_CLASH:
      return [
        makeCaption(
          `${subjectA} and ${subjectB} square off in a dominance standoff where posture says everything.`,
          "#WildAnimals",
          93,
          "Rival-clash language with no graphic promise.",
          pkg
        ),
        makeCaption(
          `Two rivals hold the frame while the pressure builds through body language and spacing.`,
          "#NatureShorts",
          90,
          "Readable and documentary-focused.",
          pkg
        ),
        makeCaption(
          `The meadow goes still before either rival commits. A clean wildlife dominance beat.`,
          "#WildlifeDocumentary",
          87,
          "Mystery and replay value around the first tell.",
          pkg
        ),
        makeCaption(
          `A non-graphic rut-season standoff built for 9:16 wildlife Reels tension.`,
          "#NatureReels",
          84,
          "Format and safety fit.",
          pkg
        ),
        makeCaption(
          `The strongest move is the one both animals almost make first.`,
          "#AnimalStories",
          81,
          "Compact debate angle without engagement bait.",
          pkg
        ),
      ];
    case StoryMode.NEAR_MISS:
      return [
        makeCaption(
          `${subjectA} finds one clean escape lane as ${subjectB} closes fast. The turn matters.`,
          "#AnimalStories",
          95,
          "Near-miss survival caption with clear subjects.",
          pkg
        ),
        makeCaption(
          `A last-second wildlife escape where brush, timing, and spacing do all the work.`,
          "#NatureShorts",
          91,
          "Strong search and replay phrasing.",
          pkg
        ),
        makeCaption(
          `The chase stays readable, the pressure stays clean, and the escape lane disappears fast.`,
          "#WildAnimals",
          88,
          "Motion-first and non-graphic.",
          pkg
        ),
        makeCaption(
          `One quick turn changes the whole frame in this USA wildlife near-miss.`,
          "#NatureReels",
          85,
          "Short, clear Reels caption.",
          pkg
        ),
        makeCaption(
          `No contact shown, just clean survival tension and a narrow opening through the brush.`,
          "#WildlifeDocumentary",
          82,
          "Safety-compliant near-miss language.",
          pkg
        ),
      ];
    case StoryMode.FISHING_STRIKE:
      return [
        makeCaption(
          `${subjectA} waits at the waterline as the strike moment appears between two splashes.`,
          "#NatureShorts",
          93,
          "Motion-first fishing strike caption.",
          pkg
        ),
        makeCaption(
          `A clean river strike beat with readable water, wildlife timing, and no unsafe outcome.`,
          "#WildAnimals",
          90,
          "Searchable and monetization-safe.",
          pkg
        ),
        makeCaption(
          `The surface moves first, then ${subjectA} commits. Wildlife timing in one vertical frame.`,
          "#NatureReels",
          87,
          "Video-ready caption with strong first-frame focus.",
          pkg
        ),
        makeCaption(
          `River pressure, splash detail, and one clean strike lane for a documentary-style Reel.`,
          "#WildlifeDocumentary",
          84,
          "Clear image/video workflow fit.",
          pkg
        ),
        makeCaption(
          `The whole shot depends on the waterline tell.`,
          "#AnimalStories",
          81,
          "Compact replay-value phrasing.",
          pkg
        ),
      ];
    case StoryMode.WEATHER_SURVIVAL:
      return [
        makeCaption(
          `${subjectA} pushes through the hazard while the weather becomes the real opponent.`,
          "#NatureShorts",
          94,
          "Strong natural-hazard story angle.",
          pkg
        ),
        makeCaption(
          `A USA wildlife survival moment built on wind, terrain, and steady movement.`,
          "#WildAnimals",
          90,
          "Clear non-fight survival language.",
          pkg
        ),
        makeCaption(
          `The storm tightens the frame, but the route stays readable.`,
          "#NatureReels",
          87,
          "Replayable route and first-frame clarity.",
          pkg
        ),
        makeCaption(
          `No predator needed here. The weather carries the full survival tension.`,
          "#WildlifeDocumentary",
          84,
          "Mode-specific and memorable.",
          pkg
        ),
        makeCaption(
          `A clean 9:16 wildlife Reel about endurance, terrain, and one open path forward.`,
          "#AnimalStories",
          81,
          "Platform-format and story clarity signals.",
          pkg
        ),
      ];
    case StoryMode.MIGRATION:
      return [
        makeCaption(
          `${subjectA} reaches the crossing as the route narrows. One wrong step changes everything.`,
          "#AnimalStories",
          95,
          "High-stakes migration crossing caption.",
          pkg
        ),
        makeCaption(
          `A clean migration pressure beat with herd scale, route clarity, and vertical Reels framing.`,
          "#NatureShorts",
          91,
          "Search and format fit.",
          pkg
        ),
        makeCaption(
          `The crossing line forms before the first animal fully commits.`,
          "#WildAnimals",
          88,
          "Replayable first-frame hook.",
          pkg
        ),
        makeCaption(
          `Big movement, clear terrain, and one route that decides the whole scene.`,
          "#NatureReels",
          85,
          "Readable large-group story.",
          pkg
        ),
        makeCaption(
          `A USA wildlife migration moment built for scale, spacing, and clean survival tension.`,
          "#WildlifeDocumentary",
          82,
          "Documentary and monetization-safe.",
          pkg
        ),
      ];
    case StoryMode.SCAVENGER_CONFLICT:
      return [
        makeCaption(
          `${subjectA} holds the food zone while ${subjectB} tests the edge. The line is clear.`,
          "#AnimalStories",
          92,
          "Ownership conflict with clean detail.",
          pkg
        ),
        makeCaption(
          `A non-graphic wildlife food claim where spacing, posture, and patience create the tension.`,
          "#NatureShorts",
          89,
          "Platform-safe scavenger conflict wording.",
          pkg
        ),
        makeCaption(
          `The challenger circles, but the owner controls the frame.`,
          "#WildAnimals",
          86,
          "Clear conflict roles and readable action.",
          pkg
        ),
        makeCaption(
          `Clean standoff around a contested wildlife food zone.`,
          "#NatureReels",
          83,
          "Safety-forward and mode-specific.",
          pkg
        ),
        makeCaption(
          `One step too close changes the whole claim.`,
          "#WildlifeDocumentary",
          80,
          "Compact replay-value caption.",
          pkg
        ),
      ];
    case StoryMode.PREDATOR_VS_PREY:
    default:
      return [
        makeCaption(
          `${subjectA} closes the lane as ${subjectB} searches for one clean way out.`,
          "#AnimalStories",
          94,
          "Classic predator/prey pressure without graphic outcome.",
          pkg
        ),
        makeCaption(
          `A clean wildlife chase beat with readable spacing, fast pressure.`,
          "#NatureShorts",
          90,
          "Safe and Reels-ready.",
          pkg
        ),
        makeCaption(
          `The first move decides whether the escape lane stays open.`,
          "#WildAnimals",
          87,
          "Replayable first-frame tension.",
          pkg
        ),
        makeCaption(
          `Predator pressure, prey reaction, and one narrow path through the frame.`,
          "#NatureReels",
          84,
          "Searchable wildlife keywords.",
          pkg
        ),
        makeCaption(
          `A motion-first USA wildlife Reel built around chase timing and clean survival tension.`,
          "#WildlifeDocumentary",
          81,
          "Platform and safety fit.",
          pkg
        ),
      ];
  }
}

export function buildFacebookCaptionVariants(pkg: GeneratedPackage): FacebookCaptionVariant[] {
  return modeCaptionDrafts(pkg)
    .filter((variant) => variant.caption.length <= MAX_CAPTION_CHARS)
    .filter((variant) => variant.hashtags.length === 5)
    .filter((variant) => !ENGAGEMENT_BAIT_PATTERN.test(variant.caption))
    .filter((variant) => !UNSAFE_PATTERN.test(variant.caption))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((variant, index) => ({
      ...variant,
      rank: index + 1,
    }));
}
