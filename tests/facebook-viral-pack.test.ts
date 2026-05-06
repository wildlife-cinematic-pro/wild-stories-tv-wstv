import { describe, expect, it } from "vitest";

import { buildFacebookViralPack } from "@/lib/facebook-viral-pack";

describe("facebook viral pack", () => {
  it("builds a short caption, five hashtags, and optional disclosure", () => {
    const pack = buildFacebookViralPack({
      predatorName: "Crocodile",
      preyName: "Warthog",
      arcName: "Ambush attack",
      environmentName: "muddy African waterhole",
      tone: "danger",
      aiDisclosure: true,
    });

    expect(pack.caption150.length).toBeLessThanOrEqual(150);
    expect(pack.hashtags).toHaveLength(5);
    expect(pack.hookText.length).toBeLessThanOrEqual(45);
    expect(pack.aiDisclosureLine).toBe("AI-generated cinematic wildlife scene.");
    expect(pack.safetyNote).toContain("No blood, no gore, no visible wounds");
  });
});
