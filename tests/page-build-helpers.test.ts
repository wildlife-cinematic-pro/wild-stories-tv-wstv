import { describe, expect, it } from "vitest";

import { normalizeArcValue, normalizePreset, type NormalizedPreset } from "@/lib/page-build-helpers";

describe("page build helper arc normalization", () => {
  const fallback: NormalizedPreset = {
    prey: ["White-tailed Deer"],
    environment: "Rocky Mountain Meadow",
    lighting: "Golden hour rim light",
    cameraGear: "Canon EOS R5",
    texture: "Natural fur detail",
    defaultArc: "Pack hunting strategy",
    driftRisk: "MEDIUM",
  };

  it("falls back to a safe Arc when the input is invalid", () => {
    expect(normalizeArcValue("not-a-real-arc", "Pack hunting strategy")).toBe(
      "Pack hunting strategy"
    );
  });

  it("keeps normalized presets on a valid Arc union", () => {
    expect(
      normalizePreset(
        {
          ...fallback,
          defaultArc: "bad arc input",
        },
        fallback
      ).defaultArc
    ).toBe("Pack hunting strategy");
  });
});
