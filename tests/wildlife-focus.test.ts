import { describe, expect, it } from "vitest";

import { predatorData } from "@/lib/predator-data";
import {
  FACEBOOK_SAFE_SURVIVAL_HINT,
  filterPredatorOptionsByWildlifeScope,
  filterPreyOptionsByWildlifeScope,
  getRegionalWildlifeStep1Hint,
  getSupportedWildlifeFocusAnimals,
  getWildlifeFocusEnvironmentSuggestion,
  getWildlifeFocusPairingHighlights,
  getWildlifeFocusPairingKey,
  getWildlifeFocusPairings,
  getWildlifeFocusSafetyDefaults,
  getWildlifeFocusSafetyHint,
  getWildlifeHabitatCompatibilityGuidance,
  getWildlifeScopeDefaultSelection,
  isAttackFocusedWildlifeScope,
  isPairCompatibleWithWildlifeScope,
  normalizeWildlifeScopeMode,
  wildlifeScopeOptions,
} from "@/lib/wildlife-focus";

describe("wildlife focus modes", () => {
  it("includes the creator-facing wildlife focus split", () => {
    expect(wildlifeScopeOptions).toEqual(
      expect.arrayContaining([
        "USA Viral Wildlife",
        "Global Viral Wildlife",
        "World Wide Wildlife",
      ])
    );
  });

  it("keeps every visible wildlife focus populated", () => {
    for (const mode of wildlifeScopeOptions) {
      expect(getSupportedWildlifeFocusAnimals(mode).length).toBeGreaterThan(0);
    }
  });

  it("keeps World Wide Wildlife broad while still allowing the built-in list", () => {
    const builtInAnimals = Object.keys(predatorData);
    const filtered = filterPredatorOptionsByWildlifeScope(
      builtInAnimals,
      "World Wide Wildlife"
    );

    expect(getSupportedWildlifeFocusAnimals("World Wide Wildlife").length).toBeGreaterThan(20);
    expect(filtered).toEqual(expect.arrayContaining(builtInAnimals));
  });

  it("supports legacy wildlife focus aliases", () => {
    expect(normalizeWildlifeScopeMode("USA Wildlife")).toBe(
      "USA / Canada Wildlife"
    );
    expect(normalizeWildlifeScopeMode("World Wildlife")).toBe(
      "World Wide Wildlife"
    );
  });

  it("keeps USA Viral Wildlife compatible for curated prey filtering", () => {
    expect(
      filterPreyOptionsByWildlifeScope(
        "Alligator",
        ["White-tailed Deer", "Wild Boar", "Rabbit"],
        "USA Viral Wildlife"
      )
    ).toEqual(["White-tailed Deer", "Wild Boar"]);
  });
});

describe("Global Viral Wildlife focus", () => {
  const pairings = getWildlifeFocusPairings("Global Viral Wildlife");
  const animals = getSupportedWildlifeFocusAnimals("Global Viral Wildlife");

  it("is explicitly attack/survival focused", () => {
    expect(isAttackFocusedWildlifeScope("Global Viral Wildlife")).toBe(true);
    expect(getWildlifeFocusSafetyHint("Global Viral Wildlife")).toBe(
      FACEBOOK_SAFE_SURVIVAL_HINT
    );
  });

  it("keeps the default global setup on crocodile vs warthog", () => {
    expect(getWildlifeScopeDefaultSelection("Global Viral Wildlife")).toEqual({
      predator: "Crocodile",
      prey: "Warthog",
      environment: "dry-season African muddy waterhole",
    });
  });

  it("includes Crocodile vs Warthog as a Facebook-safe waterhole ambush", () => {
    const highlights = getWildlifeFocusPairingHighlights(
      "Global Viral Wildlife",
      "Crocodile",
      "Warthog"
    );

    expect(isPairCompatibleWithWildlifeScope("Crocodile", "Warthog", "Global Viral Wildlife")).toBe(true);
    expect(highlights.safeArcLabel).toBe("Waterhole ambush");
    expect(highlights.badges).toEqual(
      expect.arrayContaining(["Kling 15s", "Facebook-safe", "No gore", "Water ambush"])
    );
  });

  it("gives every global viral lead at least two matched opposing animals", () => {
    for (const animal of animals) {
      const matches = pairings.filter(
        (item) => item.predator === animal || item.prey === animal
      );
      expect(matches.length, animal).toBeGreaterThanOrEqual(2);
    }
  });

  it("keeps pairings unique by normalized lead/opposing key", () => {
    const normalized = pairings.map(getWildlifeFocusPairingKey);
    expect(new Set(normalized).size).toBe(normalized.length);
  });

  it("exposes Facebook-safe survival defaults for non-graphic wildlife tension", () => {
    expect(getWildlifeFocusSafetyDefaults()).toEqual(
      expect.arrayContaining([
        "No blood",
        "No gore",
        "No visible wounds",
        "Documentary survival tension",
      ])
    );
  });

  it("warns on habitat mismatch with safer shark guidance", () => {
    const guidance = getWildlifeHabitatCompatibilityGuidance({
      mode: "Global Viral Wildlife",
      predator: "Great White Shark",
      prey: "Seal",
      habitat: "Riverbank Reeds",
    });

    expect(guidance).toMatchObject({
      isWarning: true,
      label: "Likely habitat mismatch",
    });
    expect(guidance?.message).toMatch(/surf line|coastal water|open ocean/i);
  });

  it("builds a Step 1 hint from the matching encounter habitat", () => {
    expect(
      getRegionalWildlifeStep1Hint(
        "Global Viral Wildlife",
        "Lion",
        "Wildebeest"
      )
    ).toMatch(/dry grassland run lane|savanna golden hour grassland/i);
  });
});

describe("World Wide Wildlife helper behavior", () => {
  it("keeps custom animals usable in the broad documentary mode", () => {
    expect(
      filterPredatorOptionsByWildlifeScope(
        ["Custom Marsh Beast", "Lion", "Moose"],
        "World Wide Wildlife"
      )
    ).toEqual(expect.arrayContaining(["Custom Marsh Beast", "Lion", "Moose"]));
  });

  it("returns a compatible environment for curated world-wide documentary setups", () => {
    expect(
      getWildlifeFocusEnvironmentSuggestion(
        "World Wide Wildlife",
        "Tiger",
        "Deer",
        "fallback habitat"
      )
    ).toBe("fallback habitat");
  });
});
