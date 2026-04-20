import { describe, expect, it } from "vitest";

import {
  getLaneBiasedArc,
  rankPreyOptionsForContentLane,
} from "@/lib/content-lanes";
import {
  build2026HookByFamily,
  buildHashtags,
  buildShortCaption,
} from "@/lib/platform-packs";
import { scoreUSAudience } from "@/lib/usAudienceProfile";

describe("Content Lane system", () => {
  it("biases escape lane pairings toward the escape arc without replacing the arc engine", () => {
    expect(
      getLaneBiasedArc(
        "Escape",
        "Mountain Lion",
        "White-tailed Deer",
        "Ambush attack"
      )
    ).toBe("Escape from danger");
  });

  it("reorders prey options for fishing strike setups without hard-locking the list", () => {
    expect(
      rankPreyOptionsForContentLane("Fishing Strike", "Bald Eagle", [
        "Rabbit",
        "Salmon",
        "Duck",
      ])
    ).toEqual(["Salmon", "Duck", "Rabbit"]);
  });

  it("adds a U.S. audience bonus when the content lane matches a strong wildlife reel pattern", () => {
    const baseScore = scoreUSAudience({
      predator: "Bald Eagle",
      prey: "Salmon",
      environment:
        "Alaskan river mouth, lakeshore, and open conifer-lined shallows with strong strike readability and clean subject spacing",
      arc: "Chase and takedown",
    });
    const laneScore = scoreUSAudience({
      predator: "Bald Eagle",
      prey: "Salmon",
      environment:
        "Alaskan river mouth, lakeshore, and open conifer-lined shallows with strong strike readability and clean subject spacing",
      arc: "Chase and takedown",
      contentLane: "Fishing Strike",
    });

    expect(laneScore.total).toBeGreaterThan(baseScore.total);
  });

  it("applies lane-aware hook, caption, and hashtag direction when compatible", () => {
    const hook = build2026HookByFamily(
      "Bald Eagle",
      "Salmon",
      "Chase and takedown",
      "danger",
      { contentLane: "Fishing Strike" }
    );
    const caption = buildShortCaption(
      "Bald Eagle",
      "Salmon",
      "Alaskan river mouth and open shallows",
      "Chase and takedown",
      { mode: "us-only", contentLane: "Fishing Strike" }
    );
    const hashtags = buildHashtags("Bald Eagle", "Salmon", "Chase and takedown", {
      count: 5,
      contentLane: "Fishing Strike",
    });

    expect(hook.toLowerCase()).toContain("strike");
    expect(caption.toLowerCase()).toMatch(/strike|waterline/);
    expect(hashtags).toContain("#fishingstrike");
  });
});
