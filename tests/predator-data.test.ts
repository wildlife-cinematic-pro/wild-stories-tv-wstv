import { describe, expect, it } from "vitest";
import {
  filterPredatorOptionsByWildlifeScope,
  generateMonthlyCalendar,
  generateUSAViral30DayCalendar,
  predatorData,
  suggestArc,
  suggestHabitat,
} from "@/lib/predator-data";

describe("wildlife scope filtering", () => {
  it("keeps USA mode centered on U.S.-recognizable lead animals", () => {
    const filtered = filterPredatorOptionsByWildlifeScope(
      ["Lion", "Mountain Lion", "Wolf Pack", "Bald Eagle", "Jaguar", "Bull Elk"],
      "USA / Canada Wildlife"
    );

    expect(filtered).toEqual(
      expect.arrayContaining(["Mountain Lion", "Wolf Pack", "Bald Eagle", "Bull Elk"])
    );
    expect(filtered).not.toContain("Lion");
    expect(filtered).not.toContain("Jaguar");
  });

  it("keeps World Wide Wildlife broad while still using curated USA-first ordering", () => {
    const filtered = filterPredatorOptionsByWildlifeScope(
      ["Lion", "Mountain Lion", "Wolf Pack", "Bald Eagle", "Jaguar", "Bull Elk"],
      "World Wide Wildlife"
    );

    expect(filtered).toEqual([
      "Wolf Pack",
      "Mountain Lion",
      "Bald Eagle",
      "Bull Elk",
      "Jaguar",
      "Lion",
    ]);
  });
});

describe("viral wildlife prey support", () => {
  it("adds Warthog support to Crocodile and Nile Crocodile exactly once", () => {
    expect(predatorData.Crocodile.prey.filter((item) => item === "Warthog")).toHaveLength(1);
    expect(predatorData["Nile Crocodile"].prey.filter((item) => item === "Warthog")).toHaveLength(1);
  });

  it("adds Tortoise with the same opposing set for the Turtle alias", () => {
    expect(predatorData.Tortoise.prey).toEqual([
      "Monitor Lizard",
      "Golden Eagle",
      "Coyote",
      "Alligator",
      "Jaguar",
    ]);
    expect(predatorData.Turtle.prey).toEqual(predatorData.Tortoise.prey);
    expect(predatorData.Tortoise.environment).toMatch(/desert scrub|sandbar/i);
  });

  it("keeps Great White Shark ready for seal-colony pairings", () => {
    expect(predatorData["Great White Shark"].prey).toEqual(
      expect.arrayContaining(["Seal", "Sea Lion"])
    );
  });
});

describe("suggestArc realism matching", () => {
  it("matches Grizzly Bear vs Bull Elk to giant clash", () => {
    expect(suggestArc("Grizzly Bear", "Bull Elk", "Chase and takedown")).toBe("Giant vs giant clash");
  });

  it("matches Wolf Pack vs Bull Elk to pack hunting strategy", () => {
    expect(suggestArc("Wolf Pack", "Bull Elk", "Chase and takedown")).toBe("Pack hunting strategy");
  });

  it("matches Mountain Lion vs White-tailed Deer to ambush attack", () => {
    expect(suggestArc("Mountain Lion", "White-tailed Deer", "Chase and takedown")).toBe("Ambush attack");
  });

  it("matches Coyote vs White-tailed Deer to escape from danger", () => {
    expect(suggestArc("Coyote", "White-tailed Deer", "Chase and takedown")).toBe("Escape from danger");
  });

  it("keeps Lion Pack using pack-pressure-safe arcs", () => {
    expect(suggestArc("Lion Pack", "Zebra", "Chase and takedown")).toBe(
      "Pack hunting strategy"
    );
  });

  it("supports normalized Brown Bear naming", () => {
    expect(suggestArc("Brown Bear", "Bull Elk", "Chase and takedown")).toBe("Giant vs giant clash");
  });
});

describe("suggestHabitat pair matching", () => {
  it("returns Yellowstone clash habitat for Grizzly Bear vs Bull Elk", () => {
    expect(
      suggestHabitat("Grizzly Bear", "Bull Elk", "fallback habitat")
    ).toBe(
      "Yellowstone meadow and open wilderness with strong clash readability and clean subject spacing"
    );
  });

  it("returns pack-pressure habitat for Wolf Pack vs Bull Elk", () => {
    expect(
      suggestHabitat("Wolf Pack", "Bull Elk", "fallback habitat")
    ).toBe(
      "northern Rocky Mountain forest edge, sage valley, and open meadow with clean pack-pressure lanes and readable prey spacing"
    );
  });

  it("returns ambush habitat for Mountain Lion vs White-tailed Deer", () => {
    expect(
      suggestHabitat("Mountain Lion", "White-tailed Deer", "fallback habitat")
    ).toBe(
      "forest edge, brush opening, and broken ridge cover with clean ambush lanes and readable prey spacing"
    );
  });

  it("returns escape-lane habitat for Coyote vs White-tailed Deer", () => {
    expect(
      suggestHabitat("Coyote", "White-tailed Deer", "fallback habitat")
    ).toBe(
      "open prairie, brush edge, and field transition with clear escape lanes and readable survival-animal spacing"
    );
  });

  it("returns the exact muddy waterhole habitat for Crocodile vs Warthog", () => {
    expect(suggestHabitat("Crocodile", "Warthog", "fallback habitat")).toContain(
      "dry-season African muddy waterhole"
    );
  });

  it("returns surf-line habitat for Great White Shark vs Seal", () => {
    expect(suggestHabitat("Great White Shark", "Seal", "fallback habitat")).toContain(
      "surf line"
    );
  });

  it("falls back when no pair-specific habitat exists", () => {
    expect(suggestHabitat("Lion", "Gazelle", "fallback habitat")).toBe(
      "fallback habitat"
    );
  });
});

describe("calendar rotations use stronger elk naming", () => {
  it("includes Wolf Pack vs Bull Elk in monthly calendar rotations", () => {
    const days = generateMonthlyCalendar(
      "Mountain Lion",
      "White-tailed Deer",
      "Ambush attack",
      new Date("2026-10-01")
    );

    const entries = days.flatMap((day) => [day.reel1, day.reel2]);

    expect(
      entries.some(
        (item) => item.predator === "Wolf Pack" && item.prey === "Bull Elk"
      )
    ).toBe(true);
  });

  it("includes Wolf Pack vs Bull Elk in USA viral 30-day calendar rotations", () => {
    const days = generateUSAViral30DayCalendar(
      "Mountain Lion",
      "White-tailed Deer",
      "Ambush attack",
      new Date("2026-10-01")
    );

    const entries = days.flatMap((day) => [day.reel1, day.reel2]);

    expect(
      entries.some(
        (item) => item.predator === "Wolf Pack" && item.prey === "Bull Elk"
      )
    ).toBe(true);
  });
});
