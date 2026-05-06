import { describe, expect, it } from "vitest";

import {
  buildFixWeakSectionPrompt,
  buildPolishOnlyPrompt,
  buildReviewOnlyPrompt,
} from "@/lib/ai-handoff-prompts";

const baseInput = {
  predator: "Crocodile",
  prey: "Warthog",
  sceneDescription:
    "Slow low push-in near the waterline as Crocodile surges once and Warthog recoils toward open ground, keeping both animals readable with grounded motion and clean spacing.",
  workflowLabel: "Hybrid / selected workflow • SHORT",
  qaScore: 88,
  qaStatus: "Needs review" as const,
  qaTopFixes: [
    "Keep one cleaner camera lane in the video prompt.",
    "Trim extra instruction stacking before export.",
  ],
  imagePrompt:
    "Crocodile and Warthog, clean waterline spacing, grounded contact, no blood, no gore, no visible wounds.",
  videoPrompt:
    "Slow low push-in as the crocodile surges once and the warthog recoils toward open ground.",
  caption: "Crocodile vs warthog at the waterline.",
  hashtags: "#crocodile #warthog #wildlife #documentary #reels",
};

describe("AI handoff prompts", () => {
  it("builds a review-only prompt with guardrails and QA context", () => {
    const prompt = buildReviewOnlyPrompt(baseInput);

    expect(prompt).toContain("Review only.");
    expect(prompt).toContain("Do not rewrite the package.");
    expect(prompt).toContain("Return concise findings only.");
    expect(prompt).toContain("Crocodile vs Warthog");
    expect(prompt).toContain("Final QA: Needs review (88/100)");
    expect(prompt).toContain("Keep one cleaner camera lane");
    expect(prompt).toContain("Do not change animal identities.");
    expect(prompt).not.toContain("{");
  });

  it("builds a polish-only prompt that preserves structure and returns polished text only", () => {
    const prompt = buildPolishOnlyPrompt(baseInput);

    expect(prompt).toContain("Polish only.");
    expect(prompt).toContain("Preserve structure.");
    expect(prompt).toContain("Preserve headings.");
    expect(prompt).toContain("Preserve engine names and sections.");
    expect(prompt).toContain("Return polished text only.");
    expect(prompt).toContain("No explanation.");
    expect(prompt).toContain("Do not add or remove shots.");
    expect(prompt).not.toContain("{");
  });

  it("builds a weak-section fix prompt without rewriting the full package", () => {
    const prompt = buildFixWeakSectionPrompt(baseInput);

    expect(prompt).toContain("Fix only the weakest section.");
    expect(prompt).toContain("Do not rewrite the full package.");
    expect(prompt).toContain("Return only the revised weak section.");
    expect(prompt).toContain("Weak section focus:");
    expect(prompt).toContain("Hybrid / selected workflow");
    expect(prompt).toContain("Do not add timestamps or multi-shot structure unless already present.");
    expect(prompt).not.toContain("{");
  });
});
