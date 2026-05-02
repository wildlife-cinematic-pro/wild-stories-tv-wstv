import { describe, expect, it } from "vitest";

import {
  clampPrompt,
  reduceNegativePrompt,
  makeKlingSafePrompt,
  makeFacebookCaption,
} from "@/lib/prompt-tools";

describe("prompt tools", () => {
  it("clamps prompts on sentence boundaries when possible", () => {
    const clamped = clampPrompt(
      "Sentence one stays. Sentence two is also useful. Sentence three should be dropped for the limit.",
      42
    );

    expect(clamped).toBe("Sentence one stays.");
  });

  it("reduces negative prompts to prioritized unique terms", () => {
    const reduced = reduceNegativePrompt(
      "watermark, blood, duplicate animals, gore, text, blood, wrong habitat, extra limbs, cartoon, humans, fences, floating animals",
      6
    );

    expect(reduced).toBe(
      "blood, gore, extra limbs, duplicate animals, floating animals, humans"
    );
  });

  it("keeps Kling prompts compact and removes repeated negative phrasing", () => {
    const safe = makeKlingSafePrompt(
      "Scene idea: wolf chases elk, wolf chases elk, raw pressure. Negative prompt: gore, blood. Camera pushes in, camera pushes in."
    );

    expect(safe.toLowerCase()).not.toContain("negative prompt");
    expect(safe.toLowerCase()).not.toContain("gore");
    expect(safe.toLowerCase()).toContain("camera pushes in");
  });

  it("builds a Facebook caption under 150 chars with exactly five hashtags", () => {
    const pack = makeFacebookCaption({
      predatorName: "Alligator",
      preyName: "Wild Boar",
      arcName: "Ambush attack",
      environmentName: "Everglades marsh edge",
      tone: "danger",
    });

    expect(pack.caption.length).toBeLessThanOrEqual(150);
    expect(pack.hashtags).toHaveLength(5);
    expect(pack.caption.toLowerCase()).not.toMatch(/gore|blood|injury/);
  });
});
