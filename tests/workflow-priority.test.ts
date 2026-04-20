import { describe, expect, it } from "vitest";

import {
  buildCapCutScript,
  buildRunwayCameraPlan,
  buildTwoPartViralPreset,
} from "@/lib/workflow-packs";
import { buildWatchTimeReport, calculateViralScore } from "@/lib/predator-data";
import type { GeneratedPackage } from "@/types";

describe("workflow priority cleanup", () => {
  const pkg = {
    hook: "Bison reacts in seconds",
  } as GeneratedPackage;

  it("uses 4-shot wording instead of the removed 3-shot path in helper guidance", () => {
    const plan = buildRunwayCameraPlan("Ambush attack", "Golden Hour", "4-shot");

    expect(plan).toContain("4-shot reels");
    expect(plan).not.toContain("3-shot reels");
  });

  it("builds a four-beat CapCut script for the primary non-5-shot path", () => {
    const script = buildCapCutScript(
      "Bison",
      "Grizzly Bear",
      "Ambush attack",
      "Golden Hour",
      pkg,
      "4-shot"
    );

    expect(script.totalDuration).toBe("0:20");
    expect(script.beats).toHaveLength(4);
    expect(script.beats[3]?.shotRef).toContain("Shot 4");
    expect(script.exportSettings).toContain("24fps edit timeline");
    expect(script.exportSettings).toContain("optional 30fps platform export");
  });

  it("reports 4-shot retention language in viral/watch-time helpers", () => {
    const score = calculateViralScore(
      pkg,
      "Bison",
      "Grizzly Bear",
      "Ambush attack",
      "Golden Hour",
      "4-shot"
    );
    const watchTime = buildWatchTimeReport("4-shot", 2);

    expect(score.breakdown.some((item) => item.tip.includes("4-shot pipeline"))).toBe(true);
    expect(watchTime.currentDuration).toContain("20");
    expect(watchTime.targetDuration).toContain("4-shot primary runs");
  });

  it("switches the two-part preset into ambush-specific storytelling when the arc is ambush attack", () => {
    const preset = buildTwoPartViralPreset(
      "Mountain Lion",
      "White-tailed Deer",
      "Rocky Mountain forest edge and open meadow",
      "Golden Hour",
      "Ambush attack",
      "Gen-4.5"
    );

    expect(preset.overview).toContain("late awareness and closing danger");
    expect(preset.workflowGuide).toContain("Late awareness + closing danger cliffhanger");
    expect(preset.workflowGuide).not.toContain("winner walk");
    expect(preset.part2Caption).toContain("unresolved survival payoff");
    expect(preset.part2Final).toContain("end without forcing a winner reveal");
  });
});
