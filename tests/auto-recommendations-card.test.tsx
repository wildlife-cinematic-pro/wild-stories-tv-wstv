// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import AutoRecommendationsCard from "@/components/output-cards/auto-recommendations-card";
import { HabitatRegion, StoryMode, ViralLane } from "@/types";

import type { GeneratedPackage } from "@/types";

function makePackage() {
  return {
    imagePrompt:
      "Photorealistic Yellowstone wildlife first-frame hook with Grizzly Mother, cub, and Male Grizzly in clean survival tension.",
    negativePrompt: "no gore, no blood, no visible injury",
    thumbnailPrompt: "Grizzly Mother protection moment",
    voiceoverLine: "The mother moved before the threat got closer.",
    runwayShots: ["establish", "pressure", "peak", "resolve"],
    klingShots: ["establish", "pressure", "peak", "resolve"],
    motionStrength: 5,
    capCutPlan: "20-second Reels edit",
    clipChaining: "Runway/Kling/Kling/Runway",
    hook: "The mother moved before the threat got closer",
    hook2026: ["The mother moved before the threat got closer"],
    caption: "A grizzly mother shields her cub as the Yellowstone standoff tightens.",
    caption2026: "A grizzly mother shields her cub as the Yellowstone standoff tightens.",
    cta: "What did you notice first?",
    hashtags: "#WildlifeReels #AnimalStories #YellowstoneWildlife #NatureReels #WildlifeDocumentary",
    tenIdeas: [],
    shotPlan: [
      { engine: "RUNWAY", duration: 5, prompt: "establish first-frame hook" },
      { engine: "KLING", duration: 5, prompt: "pressure build" },
      { engine: "KLING", duration: 5, prompt: "peak survival beat" },
      { engine: "RUNWAY", duration: 5, prompt: "unresolved final frame" },
    ],
    runwayBundle: "Runway shot 1 and 4",
    klingBundle: "Kling shot 2 and 3",
    routingNote: "Hybrid Runway/Kling/Kling/Runway Reels workflow",
    storyMode: StoryMode.MOTHER_BABY,
    viralLane: ViralLane.TENDERNESS,
    habitatRegion: HabitatRegion.YELLOWSTONE,
    subjectA: "Grizzly Mother",
    subjectB: "Male Grizzly",
    offspringLabel: "cub",
  } as GeneratedPackage;
}

describe("AutoRecommendationsCard", () => {
  it("renders safely without an apply callback", () => {
    render(<AutoRecommendationsCard data={makePackage()} onCopy={() => undefined} />);

    expect(screen.getByText("Auto Recommendations")).toBeTruthy();
    expect(screen.getByText("Next A/B Test Plan")).toBeTruthy();
    expect(screen.getByText(/Apply manually from USA Story Mode Presets/i)).toBeTruthy();
  });
});
