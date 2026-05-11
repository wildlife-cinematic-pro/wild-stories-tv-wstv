import { describe, expect, it } from "vitest";

import { buildSetupReadinessChecklist } from "@/lib/setup-readiness-checklist";
import {
  HabitatRegion,
  StoryMode,
  ViolenceLevel,
  type Season,
} from "@/types";

const animalOptions = [
  "American Bison",
  "Bald Eagle",
  "Bison Herd",
  "Bull Elk A",
  "Bull Elk B",
  "Coyote",
  "Mountain Lion",
  "Trout",
  "White-tailed Deer",
  "Wolf Pack",
];

function checklist(input: {
  storyMode?: StoryMode;
  subjectA?: string;
  subjectB?: string;
  habitatRegion?: HabitatRegion;
  season?: Season;
  violenceLevel?: ViolenceLevel;
}) {
  return buildSetupReadinessChecklist({
    storyMode: input.storyMode ?? StoryMode.HERD_DEFENSE,
    subjectA: input.subjectA ?? "Bison Herd",
    subjectB: input.subjectB ?? "Wolf Pack",
    habitatRegion: input.habitatRegion ?? HabitatRegion.YELLOWSTONE,
    season: input.season ?? "FALL",
    timeOfDay: "GOLDEN_HOUR",
    animalOptions,
    violenceLevel: input.violenceLevel ?? ViolenceLevel.DISPLAY_ONLY,
    actionStyle: "Natural tension",
    activeProvider: "gemini",
    runwayModel: "Gen-4.5",
    klingModel: "Kling 3.0 Pro",
  });
}

describe("buildSetupReadinessChecklist", () => {
  it("returns ready for strong pair, strong habitat, and safe violence", () => {
    const result = checklist({});

    expect(result.overall).toBe("ready");
    expect(result.items.find((item) => item.id === "pair-quality")?.status).toBe(
      "pass"
    );
    expect(result.items.find((item) => item.id === "habitat-fit")?.status).toBe(
      "pass"
    );
    expect(result.items.find((item) => item.id === "safety")?.status).toBe(
      "pass"
    );
  });

  it("marks a weak pair as needing review", () => {
    const result = checklist({
      storyMode: StoryMode.RIVAL_CLASH,
      subjectA: "Bull Elk A",
      subjectB: "Bald Eagle",
      habitatRegion: HabitatRegion.YELLOWSTONE,
    });

    expect(result.overall).toBe("needs-review");
    expect(result.items.find((item) => item.id === "pair-quality")?.status).toBe(
      "fail"
    );
  });

  it("marks a weak habitat as needing review", () => {
    const result = checklist({
      subjectA: "American Bison",
      subjectB: "Wolf Pack",
      habitatRegion: HabitatRegion.COASTAL_WETLANDS,
    });

    expect(result.overall).toBe("needs-review");
    expect(result.items.find((item) => item.id === "habitat-fit")?.status).toBe(
      "fail"
    );
  });

  it("fails story mode completeness when subjectB is missing in a two-subject mode", () => {
    const result = buildSetupReadinessChecklist({
      storyMode: StoryMode.HERD_DEFENSE,
      subjectA: "Bison Herd",
      subjectB: "",
      habitatRegion: HabitatRegion.YELLOWSTONE,
      season: "FALL",
      timeOfDay: "GOLDEN_HOUR",
      animalOptions,
      violenceLevel: ViolenceLevel.DISPLAY_ONLY,
      activeProvider: "gemini",
      runwayModel: "Gen-4.5",
      klingModel: "Kling 3.0 Pro",
    });

    expect(
      result.items.find((item) => item.id === "story-mode-completeness")?.status
    ).toBe("fail");
  });

  it("does not fail Weather Survival because subjectB is hazard text", () => {
    const result = checklist({
      storyMode: StoryMode.WEATHER_SURVIVAL,
      subjectA: "American Bison",
      subjectB: "Blizzard Wind",
      season: "WINTER",
    });

    expect(
      result.items.find((item) => item.id === "story-mode-completeness")?.status
    ).toBe("pass");
    expect(result.items.find((item) => item.id === "pair-quality")?.status).toBe(
      "pass"
    );
  });

  it("does not fail Migration because subjectB is crossing text", () => {
    const result = checklist({
      storyMode: StoryMode.MIGRATION,
      subjectA: "Bison Herd",
      subjectB: "River Crossing",
    });

    expect(
      result.items.find((item) => item.id === "story-mode-completeness")?.status
    ).toBe("pass");
    expect(result.items.find((item) => item.id === "pair-quality")?.status).toBe(
      "pass"
    );
  });

  it("passes DISPLAY_ONLY and IMPLIED_PRESSURE safety levels", () => {
    expect(
      checklist({ violenceLevel: ViolenceLevel.DISPLAY_ONLY }).items.find(
        (item) => item.id === "safety"
      )?.status
    ).toBe("pass");
    expect(
      checklist({ violenceLevel: ViolenceLevel.IMPLIED_PRESSURE }).items.find(
        (item) => item.id === "safety"
      )?.status
    ).toBe("pass");
  });

  it("returns deterministic output", () => {
    const first = checklist({});
    const second = checklist({});

    expect(second).toEqual(first);
  });
});
