import { describe, expect, it } from "vitest";

import {
  getLaneBiasedArc,
  isContentLaneCompatible,
  rankPreyOptionsForContentLane,
  scoreContentLaneFit,
} from "@/lib/content-lanes";
import {
  build2026HookByFamily,
  buildHashtags,
  buildPinnedComment,
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


  it("keeps lane-specific hooks distinct instead of drifting into generic copy", () => {
    const packHook = build2026HookByFamily(
      "Gray Wolf",
      "Bull Elk",
      "Pack hunting strategy",
      "danger",
      { contentLane: "Pack Hunt" }
    );
    const defenderHook = build2026HookByFamily(
      "Bison",
      "Gray Wolf",
      "Defender stands ground",
      "danger",
      { contentLane: "Defender" }
    );
    const fishingHook = build2026HookByFamily(
      "Bald Eagle",
      "Salmon",
      "Ambush attack",
      "danger",
      { contentLane: "Fishing Strike" }
    );
    const rutHook = build2026HookByFamily(
      "Bull Elk",
      "Bull Elk",
      "Territory dominance battle",
      "danger",
      { contentLane: "Rut Battle" }
    );
    const escapeHook = build2026HookByFamily(
      "Mountain Lion",
      "White-tailed Deer",
      "Escape from danger",
      "danger",
      { contentLane: "Escape" }
    );

    expect(packHook.toLowerCase()).toMatch(/pack|escape path/);
    expect(defenderHook.toLowerCase()).toMatch(/yield|warning step/);
    expect(fishingHook.toLowerCase()).toMatch(/waterline|strike window/);
    expect(rutHook.toLowerCase()).toMatch(/antler line|shoulders|standoff/);
    expect(escapeHook.toLowerCase()).toMatch(/breakaway|survival/);
  });

  it("keeps Step 1 lane copy from falling back into repetitive generic phrasing", () => {
    const rutHook = build2026HookByFamily(
      "Bull Elk",
      "Bull Elk",
      "Territory dominance battle",
      "danger",
      { contentLane: "Rut Battle" }
    );
    const packHook = build2026HookByFamily(
      "Gray Wolf",
      "Bull Elk",
      "Pack hunting strategy",
      "reversal",
      { contentLane: "Pack Hunt" }
    );
    const defenderHook = build2026HookByFamily(
      "Bison",
      "Gray Wolf",
      "Defender stands ground",
      "reversal",
      { contentLane: "Defender" }
    );

    expect(rutHook.toLowerCase()).toMatch(/antler|shoulder|standoff|footing/);
    expect(packHook.toLowerCase()).toContain("narrowing trap");
    expect(defenderHook.toLowerCase()).toContain("planted stance");
    expect(`${rutHook} ${packHook} ${defenderHook}`.toLowerCase()).not.toMatch(
      /what looked|changed the read|pressure line/
    );
  });

  it("gates rut battle copy and scoring when the species pair is not rut-compatible", () => {
    const predator = "Grizzly Bear";
    const prey = "Bison";
    const environment = "Yellowstone open meadow and dry grassland";

    expect(
      isContentLaneCompatible("Rut Battle", predator, prey, "Giant vs giant clash")
    ).toBe(false);

    const hook = build2026HookByFamily(
      predator,
      prey,
      "Giant vs giant clash",
      "danger",
      { contentLane: "Rut Battle" }
    );
    const caption = buildShortCaption(
      predator,
      prey,
      environment,
      "Giant vs giant clash",
      { mode: "us-only", contentLane: "Rut Battle" }
    );
    const fitScore = scoreContentLaneFit({
      contentLane: "Rut Battle",
      predator,
      prey,
      arc: "Giant vs giant clash",
      habitat: "Auto",
      hookFamily: "curiosity",
      environment,
    });
    const baseScore = scoreUSAudience({
      predator,
      prey,
      environment,
      arc: "Giant vs giant clash",
    });
    const laneScore = scoreUSAudience({
      predator,
      prey,
      environment,
      arc: "Giant vs giant clash",
      contentLane: "Rut Battle",
    });

    expect(`${hook} ${caption}`.toLowerCase()).not.toMatch(/antler|rut-season/);
    expect(fitScore).toBeLessThan(50);
    expect(laneScore.total).toBe(baseScore.total);
  });


  it("treats heavy-body mirror matches like bison as non-rut fits", () => {
    const predator = "Bison";
    const prey = "Bison";
    const hook = build2026HookByFamily(
      predator,
      prey,
      "Giant vs giant clash",
      "danger",
      { contentLane: "Rut Battle" }
    );
    const hashtags = buildHashtags(predator, prey, "Giant vs giant clash", {
      count: 5,
      contentLane: "Rut Battle",
    });

    expect(
      isContentLaneCompatible("Rut Battle", predator, prey, "Giant vs giant clash")
    ).toBe(false);
    expect(hook.toLowerCase()).not.toMatch(/antler|rut-season/);
    expect(hashtags).not.toContain("#rutbattle");
  });


  it("uses curiosity-led short captions for key Facebook us-only arcs", () => {
    const ambush = buildShortCaption(
      "Mountain Lion",
      "White-tailed Deer",
      "Rocky Mountain forest edge and open meadow",
      "Ambush attack",
      { mode: "us-only" }
    );
    const escape = buildShortCaption(
      "Gray Wolf",
      "Pronghorn",
      "Wyoming grassland and open sage plain",
      "Escape from danger",
      { mode: "us-only" }
    );
    const pack = buildShortCaption(
      "Gray Wolf",
      "Bull Elk",
      "Northern forest opening and snow-packed edge",
      "Pack hunting strategy",
      { mode: "us-only" }
    );

    expect(ambush).toContain("escape lane");
    expect(ambush).not.toContain("Wild Watchers");
    expect(ambush.toLowerCase()).not.toMatch(/who wins|killed|blood|gore/);
    expect(escape.toLowerCase()).toMatch(/warning sign|almost no time to turn/);
    expect(escape).not.toContain("Wild Watchers");
    expect(pack.toLowerCase()).toContain("open space");
    expect(pack).not.toContain("Wild Watchers");
    expect(ambush.length).toBeLessThanOrEqual(150);
    expect(escape.length).toBeLessThanOrEqual(150);
    expect(pack.length).toBeLessThanOrEqual(150);
  });

  it("keeps fallback captions outside us-only mode and builds Wild Watchers pinned comments", () => {
    const nonUs = buildShortCaption(
      "Mountain Lion",
      "White-tailed Deer",
      "Rocky Mountain forest edge and open meadow",
      "Ambush attack",
      { mode: "default" }
    );
    const giant = buildShortCaption(
      "Bison",
      "Moose",
      "Open river meadow and dry grassland",
      "Giant vs giant clash",
      { mode: "us-only" }
    );
    const ambushPinned = buildPinnedComment("Ambush attack");
    const escapePinned = buildPinnedComment("Escape from danger");

    expect(nonUs).not.toContain("escape lane");
    expect(nonUs).not.toContain("Wild Watchers");
    expect(giant).toContain("body shift");
    expect(giant).not.toContain("Wild Watchers");
    expect(giant.length).toBeLessThanOrEqual(150);
    expect(nonUs.length).toBeLessThanOrEqual(150);
    expect(ambushPinned).toContain("Wild Watchers");
    expect(escapePinned).toContain("Wild Watchers");
    expect(`${ambushPinned} ${escapePinned}`.toLowerCase()).not.toMatch(
      /like|share|follow|comment yes/
    );
  });

});
