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

describe("World Wide Wildlife catalog behavior", () => {
  const animals = getSupportedWildlifeFocusAnimals("World Wide Wildlife");

  it("expands to a broad worldwide lead catalog with USA-first ranking", () => {
    expect(animals.length).toBeGreaterThanOrEqual(101);
    expect(animals.slice(0, 12)).toEqual([
      "Grizzly Bear",
      "Black Bear",
      "Wolf Pack",
      "Mountain Lion",
      "Bald Eagle",
      "Alligator",
      "Great White Shark",
      "Orca",
      "Bison",
      "Moose",
      "Bull Elk",
      "Polar Bear",
    ]);
  });


  it("keeps the first 30 focused on stronger USA-facing viral wildlife", () => {
    const top30 = animals.slice(0, 30);
    expect(top30).toEqual(expect.arrayContaining([
      "Grizzly Bear",
      "Black Bear",
      "Wolf Pack",
      "Mountain Lion",
      "Bald Eagle",
      "Alligator",
      "Great White Shark",
      "Orca",
      "Bison",
      "Moose",
      "Bull Elk",
      "Polar Bear",
    ]));
    expect(top30).not.toEqual(expect.arrayContaining([
      "Salmon",
      "Rabbit",
      "Jackrabbit",
      "Quail",
      "Black Mamba",
    ]));
  });

  it("removes duplicate-concept filler like Stag and replaces it with Pronghorn", () => {
    expect(animals).toContain("Pronghorn");
    expect(animals).not.toContain("Stag");
  });

  it("adds Tortoise as a lower-ranked world-wide documentary lead", () => {
    expect(animals).toContain("Tortoise");
    expect(animals.indexOf("Tortoise")).toBeGreaterThan(29);
  });

  it("keeps USA Viral Wildlife free of non-USA filler like Black Mamba", () => {
    expect(getSupportedWildlifeFocusAnimals("USA Viral Wildlife")).not.toContain(
      "Black Mamba"
    );
  });

  it("keeps canonical leads unique without surfacing alias duplicates", () => {
    expect(new Set(animals).size).toBe(animals.length);
    const filtered = filterPredatorOptionsByWildlifeScope(
      [
        "Bear",
        "Brown Bear",
        "Cougar",
        "Mountain Lion",
        "Shark",
        "Great White Shark",
        "Turtle",
        "Tortoise",
      ],
      "World Wide Wildlife"
    );

    expect(filtered).toEqual([
      "Mountain Lion",
      "Great White Shark",
      "Brown Bear",
      "Tortoise",
    ]);
  });

  it("keeps custom/manual animals possible outside the built-in ordering filter", () => {
    const builtInAnimals = filterPredatorOptionsByWildlifeScope(
      Object.keys(predatorData),
      "World Wide Wildlife"
    );

    expect(builtInAnimals).not.toContain("Bear");
    expect(builtInAnimals).not.toContain("Cougar");
    expect(builtInAnimals).toContain("Mountain Lion");
  });

  it("gives every world-wide lead between one and five matched opposing animals", () => {
    for (const animal of animals) {
      const matches = getWildlifeFocusPairings("World Wide Wildlife").filter(
        (item) => item.predator === animal
      );
      expect(matches.length, animal).toBeGreaterThanOrEqual(1);
      expect(matches.length, animal).toBeLessThanOrEqual(5);
    }
  });

  it("returns pair-specific documentary environments instead of the fallback", () => {
    expect(
      getWildlifeFocusEnvironmentSuggestion(
        "World Wide Wildlife",
        "Tiger",
        "Wild Boar",
        "fallback habitat"
      )
    ).toMatch(/jungle|mangrove|forest/i);
  });


  it("removes implausible Australian rattlesnake pairings and fixes Salmon realism", () => {
    expect(
      filterPreyOptionsByWildlifeScope(
        "Koala",
        ["Python", "Rattlesnake", "Dingo", "Monitor Lizard"],
        "World Wide Wildlife"
      )
    ).toEqual(["Python", "Dingo", "Monitor Lizard"]);

    expect(
      getWildlifeFocusEnvironmentSuggestion(
        "World Wide Wildlife",
        "Salmon",
        "Bald Eagle",
        "fallback habitat"
      )
    ).toMatch(/salmon ladder|riffle|river mouth/i);

    expect(
      isPairCompatibleWithWildlifeScope(
        "Salmon",
        "Orca",
        "World Wide Wildlife"
      )
    ).toBe(false);
  });

  it("provides compatibility guidance for world-wide habitat overrides", () => {
    const guidance = getWildlifeHabitatCompatibilityGuidance({
      mode: "World Wide Wildlife",
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
});

describe("Global Viral Wildlife focus", () => {
  const pairings = getWildlifeFocusPairings("Global Viral Wildlife");
  const animals = getSupportedWildlifeFocusAnimals("Global Viral Wildlife");

  it("includes Tortoise only as a lower-ranked niche lead", () => {
    expect(animals).toContain("Tortoise");
    expect(animals.slice(0, 10)).not.toContain("Tortoise");
  });

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

    expect(
      isPairCompatibleWithWildlifeScope(
        "Crocodile",
        "Warthog",
        "Global Viral Wildlife"
      )
    ).toBe(true);
    expect(highlights.safeArcLabel).toBe("Waterhole ambush");
    expect(highlights.badges).toEqual(
      expect.arrayContaining([
        "Kling 15s",
        "Facebook-safe",
        "No gore",
        "Water ambush",
      ])
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

  it("keeps Tortoise pairings documentary-plausible and prompt-ready", () => {
    expect(
      filterPreyOptionsByWildlifeScope(
        "Tortoise",
        ["Monitor Lizard", "Golden Eagle", "Coyote", "Alligator", "Jaguar", "Wolf Pack"],
        "World Wide Wildlife"
      )
    ).toEqual(["Monitor Lizard", "Golden Eagle", "Coyote", "Alligator", "Jaguar"]);

    expect(
      getWildlifeFocusEnvironmentSuggestion(
        "World Wide Wildlife",
        "Tortoise",
        "Monitor Lizard",
        "fallback habitat"
      )
    ).toMatch(/sun-baked desert scrub|rocky dry wash/i);
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
    ).toMatch(/dry grassland|savanna/i);
  });
});
