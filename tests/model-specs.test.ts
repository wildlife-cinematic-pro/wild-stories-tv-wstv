import { describe, it, expect } from "vitest";
import {
  KLING_STYLE_NOTE,
  KLING_MODEL_NOTES,
  RUNWAY_STYLE_NOTE,
  RUNWAY_MODEL_NOTES,
} from "@/lib/model-specs";

describe("model-specs wording regression guards", () => {
  it("Kling style notes keep the cleaned readability-first wording", () => {
    expect(KLING_STYLE_NOTE["Kling 3.0 Pro"]).toMatch(/1–3 seconds/i);
    expect(KLING_STYLE_NOTE["Kling 3.0 Pro"]).toMatch(/visible tension/i);
    expect(KLING_STYLE_NOTE["Kling 3.0 Pro"]).toMatch(/full-body (clarity|readability)/i);

        expect(KLING_STYLE_NOTE["Kling 3.0 Standard"]).toMatch(/frame one/i);
    expect(KLING_STYLE_NOTE["Kling 3.0 Standard"]).toMatch(/both animals.*readable/i);
    expect(KLING_STYLE_NOTE["Kling 3.0 Standard"]).toMatch(/subject spacing/i);

        expect(KLING_STYLE_NOTE["Kling 2.6 Pro"]).toMatch(/opening frames.*tension instantly/i);
        expect(KLING_STYLE_NOTE["Kling 2.5 Turbo Pro"]).toMatch(/opening frames.*clear.*tense/i);
    expect(KLING_STYLE_NOTE["Kling 2.5 Turbo"]).toContain("fully visible subjects");
  });

  it("Kling dropdown notes keep the cleaned house wording", () => {
    expect(KLING_MODEL_NOTES["Kling 3.0 Pro"].house).toContain("readable action openings");
    expect(KLING_MODEL_NOTES["Kling 3.0 Standard"].house).toContain("clear full-subject readability");
    expect(KLING_MODEL_NOTES["Kling 2.6 Pro"].house).toContain("keep prompts simple and readable");
    expect(KLING_MODEL_NOTES["Kling 2.5 Turbo Pro"].house).toContain("one clear action beat");
    expect(KLING_MODEL_NOTES["Kling 2.5 Turbo"].house).toContain("rough opening tests only");
  });

  it("Runway wording stays aligned with first-frame readability cleanup", () => {
    expect(RUNWAY_STYLE_NOTE["Gen-4.5"]).toMatch(/first 1–3 seconds are critical/i);
    expect(RUNWAY_STYLE_NOTE["Gen-4.5"]).toMatch(/first.?frame readability/i);
    expect(RUNWAY_STYLE_NOTE["Gen-4.5"]).toMatch(/predator.?to.?survival.?animal spacing/i);

    expect(RUNWAY_STYLE_NOTE["Gen-4 Turbo"]).toContain("readable openings");
    expect(RUNWAY_STYLE_NOTE["Gen-4 Turbo"]).toContain("visible predator pressure");

        expect(RUNWAY_STYLE_NOTE["Gen-4"]).toMatch(/opening clear, readable and tension.?forward/i);
    expect(RUNWAY_MODEL_NOTES["Gen-4.5"].house).toContain("strong first-frame readability");
  });
});