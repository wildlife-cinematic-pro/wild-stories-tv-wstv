import { describe, expect, it } from "vitest";

import {
  buildFixWeakSectionPrompt,
  buildPolishOnlyPrompt,
  buildReviewOnlyPrompt,
} from "@/lib/ai-handoff-prompts";

const baseInput = {
  predator: "Bison Herd",
  prey: "Wolf Pack",
  subjectPairLabel: "Herd Defense: Bison Herd vs Wolf Pack",
  storyMode: "HERD_DEFENSE",
  habitatRegion: "Yellowstone",
  season: "Fall",
  timeOfDay: "Golden Hour",
  environmentName: "Yellowstone meadow with sagebrush and open herd line",
  sceneDescription:
    "Slow low push-in across a Yellowstone meadow as Bison Herd forms a wall and Wolf Pack tests the edge, keeping both animals readable with grounded motion and clean spacing.",
  workflowLabel: "Hybrid / selected workflow • SHORT",
  qaScore: 88,
  qaStatus: "Needs review" as const,
  qaTopFixes: [
    "Keep one cleaner camera lane in the video prompt.",
    "Trim extra instruction stacking before export.",
  ],
  imagePrompt:
    "Bison Herd and Wolf Pack, clean meadow spacing, grounded contact, no blood, no gore, no visible wounds.",
  gptImage2Prompt:
    "Documentary master image of Bison Herd holding a defensive line as Wolf Pack watches from the meadow edge.",
  thumbnailPrompt: "Bison Herd vs Wolf Pack readable at first glance.",
  negativePrompt: "no blood, no gore, no visible injury, no humans, no vehicles",
  videoPrompt:
    "Slow low push-in as the bison herd tightens and the wolf pack tests the edge.",
  runwayPrompts: [
    "Runway Shot 1: Bison Herd and Wolf Pack visible, herd edge pressure, slow push-in.",
    "Runway Shot 2: Wolf Pack tests the lane while Bison Herd holds formation.",
  ],
  klingPrompts: [
    "Kling Shot 1: controlled lateral drift as Bison Herd braces and Wolf Pack pauses outside the line.",
  ],
  seedancePrompts: ["Seedance: simple herd defense motion, Bison Herd vs Wolf Pack."],
  hybridShots: [
    "Shot 1: Bison Herd wall and Wolf Pack edge readable.",
    "Shot 2: pressure builds without contact.",
    "Shot 3: strongest herd-edge pressure beat.",
    "Shot 4: Wolf Pack held outside the line.",
  ],
  shotLabels: [
    "runway: Opening Tension • 5s",
    "kling: Pressure Build • 5s",
    "kling: Peak Viral Beat • 5s",
    "runway: Resolve • 5s",
  ],
  hook: "A bison wall changes everything.",
  hook2026: ["The wolves test the wrong line.", "Yellowstone pressure in one frame."],
  caption: "Bison herd holds the line as wolves test the edge.",
  cta: "Watch the standoff hold.",
  hashtags: "#bison #wolves #wildlife #yellowstone #reels",
};

describe("AI handoff prompts", () => {
  it("builds a review-only prompt with concise QA priorities and scoring", () => {
    const prompt = buildReviewOnlyPrompt(baseInput);

    expect(prompt).toContain("Review Only mode for WSTV wildlife cinematic QA.");
    expect(prompt).toContain("Do not rewrite the package.");
    expect(prompt).toContain("Do not regenerate prompts.");
    expect(prompt).toContain("Return concise findings only.");
    expect(prompt).toContain("animal consistency");
    expect(prompt).toContain("first-frame hook clarity");
    expect(prompt).toContain("Facebook replay weakness");
    expect(prompt).toContain("Hook clarity: __/100");
    expect(prompt).toContain("Animal consistency: __/100");
    expect(prompt).toContain("Viral readability: __/100");
    expect(prompt).toContain("Motion clarity: __/100");
    expect(prompt).toContain("Facebook replay potential: __/100");
    expect(prompt).toContain("Claude Sonnet, ChatGPT GPT-5, and Codex refinement workflows");
    expect(prompt).toContain("report mismatches as findings instead of rewriting them");
    expect(prompt).toContain("Global animal source of truth: Bison Herd vs Wolf Pack");
    expect(prompt).toContain("Habitat region: Yellowstone");
    expect(prompt).toContain("Final QA: Needs review (88/100)");
    expect(prompt).not.toContain("{");
  });

  it("builds a polish-only prompt for the full package, not just captions", () => {
    const prompt = buildPolishOnlyPrompt(baseInput);

    expect(prompt).toContain("Polish Only mode for WSTV wildlife cinematic workflow refinement.");
    expect(prompt).toContain("Polish the actual full package, not just captions.");
    expect(prompt).toContain("Hybrid 4-shot prompts");
    expect(prompt).toContain("Runway prompts");
    expect(prompt).toContain("Kling prompts");
    expect(prompt).toContain("image prompts");
    expect(prompt).toContain("scene description");
    expect(prompt).toContain("hooks");
    expect(prompt).toContain("captions");
    expect(prompt).toContain("National Geographic / BBC Earth");
    expect(prompt).toContain("Preserve shot count.");
    expect(prompt).toContain("Preserve engine names and sections.");
    expect(prompt).toContain("Before returning, run this silent validation pass:");
    expect(prompt).toContain("Claude Sonnet, ChatGPT GPT-5, and Codex refinement workflows");
    expect(prompt).toContain("no random species injection");
    expect(prompt).not.toContain("{");
  });

  it("builds a weak-section fix prompt that validates every drift-sensitive section", () => {
    const prompt = buildFixWeakSectionPrompt(baseInput);

    expect(prompt).toContain("Fix Weak Section mode for WSTV wildlife cinematic QA.");
    expect(prompt).toContain("Repair only the weakest inconsistent section without rewriting the package.");
    expect(prompt).toContain("Do not rewrite the full package.");
    expect(prompt).toContain("Return only the revised weak section.");
    expect(prompt).toContain("Weak section focus:");
    expect(prompt).toContain("scene description");
    expect(prompt).toContain("image prompt");
    expect(prompt).toContain("Runway prompts");
    expect(prompt).toContain("Kling prompts");
    expect(prompt).toContain("captions");
    expect(prompt).toContain("hooks");
    expect(prompt).toContain("shot labels");
    expect(prompt).toContain("animal mismatch");
    expect(prompt).toContain("habitat drift");
    expect(prompt).toContain("engine drift");
    expect(prompt).toContain("workflow drift");
    expect(prompt).not.toContain("{");
  });

  it("locks the allowed animal identities against species hallucination", () => {
    const prompt = buildFixWeakSectionPrompt(baseInput);

    expect(prompt).toContain("Animal lock: Bison Herd vs Wolf Pack.");
    expect(prompt).toContain("Allowed animal identities: Bison Herd; Wolf Pack.");
    expect(prompt).toContain("If any other animal appears as a subject, treat it as drift.");
    expect(prompt).toContain("Do not introduce random species, substitute animals, or background animal cameos.");
  });

  it("includes engine and hybrid package context for handoff continuity", () => {
    const prompt = buildPolishOnlyPrompt(baseInput);

    expect(prompt).toContain("Hybrid 4-shot / shot plan labels:");
    expect(prompt).toContain("runway: Opening Tension");
    expect(prompt).toContain("Hybrid 4-shot prompts:");
    expect(prompt).toContain("Runway prompts:");
    expect(prompt).toContain("Kling prompts:");
    expect(prompt).toContain("Seedance prompts:");
    expect(prompt).toContain("Primary hook: A bison wall changes everything.");
    expect(prompt).toContain("CTA: Watch the standoff hold.");
  });
});
