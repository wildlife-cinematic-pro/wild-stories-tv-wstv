import { describe, expect, it } from "vitest";

import { predatorData } from "@/lib/predator-data";
import {
  filterPredatorOptionsByWildlifeScope,
  filterPreyOptionsByWildlifeScope,
  getRegionalWildlifeStep1Hint,
  getSupportedWildlifeFocusAnimals,
  getWildlifeScopeDefaultSelection,
  getWildlifeFocusEnvironmentSuggestion,
  getWildlifeFocusPairings,
  getWildlifeHabitatCompatibilityGuidance,
  isPairCompatibleWithWildlifeScope,
  normalizeWildlifeScopeMode,
  wildlifeScopeOptions,
} from "@/lib/wildlife-focus";

const visibleModes = wildlifeScopeOptions.filter(
  (mode) => mode !== "World Wildlife"
);

describe("regional wildlife focus", () => {
  it("keeps every regional wildlife focus populated", () => {
    for (const mode of visibleModes) {
      expect(getSupportedWildlifeFocusAnimals(mode).length).toBeGreaterThan(0);
    }
  });

  it("keeps World Wildlife as the full built-in list", () => {
    const builtInAnimals = Object.keys(predatorData);
    const filtered = filterPredatorOptionsByWildlifeScope(
      builtInAnimals,
      "World Wildlife"
    );

    expect(filtered).toEqual(expect.arrayContaining(builtInAnimals));
  });

  it("supports the old USA Wildlife value as an alias", () => {
    expect(normalizeWildlifeScopeMode("USA Wildlife")).toBe(
      "USA / Canada Wildlife"
    );
  });

  it("returns safe regional defaults when the selected animal drifts out of scope", () => {
    expect(getWildlifeScopeDefaultSelection("Europe Wildlife")).toEqual({
      predator: "Wolf",
      prey: "Red Deer",
      environment: "misty forest clearing",
    });
  });

  it("keeps prey options region-compatible for curated pairings", () => {
    expect(
      filterPreyOptionsByWildlifeScope(
        "Dingo",
        ["Kangaroo", "Rabbit", "Wombat"],
        "Australia Wildlife"
      )
    ).toEqual(["Kangaroo"]);
  });

  it("gives every recommended pairing an environment suggestion", () => {
    for (const mode of visibleModes) {
      for (const pairing of getWildlifeFocusPairings(mode)) {
        expect(pairing.environments[0].length).toBeGreaterThan(0);
      }
    }
  });

  it("accepts alias-style Europe pairings where the focus uses the modeled species name", () => {
    expect(
      isPairCompatibleWithWildlifeScope(
        "Bison",
        "Wolf Pack",
        "Europe Wildlife"
      )
    ).toBe(true);
  });

  it("warns when a manual habitat likely mismatches the regional animal profile", () => {
    const guidance = getWildlifeHabitatCompatibilityGuidance({
      mode: "Australia Wildlife",
      predator: "Kangaroo",
      prey: "Dingo",
      habitat: "Everglades Marsh",
    });

    expect(guidance).toMatchObject({
      isWarning: true,
      label: "Likely habitat mismatch",
    });
    expect(guidance?.message).toContain("dusty outback grassland");
  });

  it("returns a compatible default environment for region-aware auto habitat", () => {
    expect(
      getWildlifeFocusEnvironmentSuggestion(
        "Norway / Scandinavia Wildlife",
        "Brown Bear",
        "Moose",
        "fallback"
      )
    ).toBe("boreal lake edge");
  });

  it("builds a region-aware Step 1 hint referencing the compatible environment", () => {
    expect(
      getRegionalWildlifeStep1Hint(
        "Global Viral Wildlife",
        "Lion",
        "Wildebeest"
      )
    ).toContain("savanna golden hour grassland");
  });
});
