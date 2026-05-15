import { describe, expect, it } from "vitest";

import type { FourShotPhotoInput } from "@/lib/four-shot-photo-system";
import {
  buildFourShotPhotoHandoffPayloadFromBuildSetup,
  handoffToFourShotInput,
  resolveFourShotPhotoInitialInput,
} from "@/lib/four-shot-photo-handoff";

const defaults: FourShotPhotoInput = {
  predator: "Mountain Lion",
  prey: "Mule Deer",
  environment: "Default meadow",
  lighting: "Default golden hour",
  season: "early autumn",
  aspectRatio: "9:16",
  predatorIdentityNotes: "default predator notes",
  preyIdentityNotes: "default prey notes",
};

describe("four-shot photo Build handoff", () => {
  it("maps Build predator and prey into four-shot photo input", () => {
    const payload = buildFourShotPhotoHandoffPayloadFromBuildSetup({
      predator: "Wolf Pack",
      prey: "Bull Elk",
      finalEnvironment: "Yellowstone valley",
      weather: "Golden Hour",
      season: "Winter",
    }, "2026-05-15T00:00:00.000Z");

    const input = handoffToFourShotInput(payload);

    expect(input.predator).toBe("Wolf Pack");
    expect(input.prey).toBe("Bull Elk");
    expect(input.predatorIdentityNotes).toContain("Wolf Pack");
    expect(input.preyIdentityNotes).toContain("Bull Elk");
  });

  it("maps habitat and region into environment when final environment is absent", () => {
    const input = handoffToFourShotInput({
      source: "build",
      habitatRegion: "Yellowstone",
      habitat: "sagebrush meadow",
      sceneDescription: "narrow dirt game trail beside a pine treeline",
      createdAt: "2026-05-15T00:00:00.000Z",
    });

    expect(input.environment).toContain("Yellowstone");
    expect(input.environment).toContain("sagebrush meadow");
    expect(input.environment).toContain("narrow dirt game trail");
  });

  it("maps weather and time of day into lighting and keeps season", () => {
    const input = handoffToFourShotInput({
      source: "build",
      predator: "Bald Eagle",
      prey: "Trout",
      weather: "Clear cold air",
      timeOfDay: "sunrise",
      season: "spring",
      createdAt: "2026-05-15T00:00:00.000Z",
    });

    expect(input.lighting).toBe("sunrise, Clear cold air");
    expect(input.season).toBe("spring");
  });

  it("lets URL params override localStorage handoff values", () => {
    const handoff = buildFourShotPhotoHandoffPayloadFromBuildSetup({
      predator: "Wolf",
      prey: "Elk",
      finalEnvironment: "Rocky Mountain meadow",
      weather: "overcast",
      season: "winter",
    }, "2026-05-15T00:00:00.000Z");
    const params = new URLSearchParams({
      predator: "Mountain Lion",
      prey: "Mule Deer",
      finalEnvironment: "Arizona canyon wash",
      lighting: "late-afternoon rim light",
      season: "dry summer",
    });

    const input = resolveFourShotPhotoInitialInput(defaults, handoff, params);

    expect(input.predator).toBe("Mountain Lion");
    expect(input.prey).toBe("Mule Deer");
    expect(input.environment).toBe("Arizona canyon wash");
    expect(input.lighting).toBe("late-afternoon rim light");
    expect(input.season).toBe("dry summer");
  });

  it("passes explicit continuity controls while leaving defaults manual when absent", () => {
    const withControls = handoffToFourShotInput({
      source: "build",
      predator: "Wolf",
      prey: "Elk",
      storyDirection: "wolf remains behind elk along the same snowy trail",
      predatorPlacement: "rear-left side of the trail",
      preyPlacement: "front-right side of the trail",
      identityLockStrength: "extra strict",
      groundIntegrationStrength: "maximum",
      createdAt: "2026-05-15T00:00:00.000Z",
    });

    expect(withControls.storyDirection).toBe("wolf remains behind elk along the same snowy trail");
    expect(withControls.predatorPlacement).toBe("rear-left side of the trail");
    expect(withControls.preyPlacement).toBe("front-right side of the trail");
    expect(withControls.identityLockStrength).toBe("extra strict");
    expect(withControls.groundIntegrationStrength).toBe("maximum");

    const withoutControls = handoffToFourShotInput({
      source: "build",
      predator: "Wolf",
      prey: "Elk",
      createdAt: "2026-05-15T00:00:00.000Z",
    });
    expect(withoutControls.storyDirection).toBeUndefined();
    expect(withoutControls.identityLockStrength).toBeUndefined();
  });

  it("keeps manual defaults when no handoff or URL params exist", () => {
    const input = resolveFourShotPhotoInitialInput(defaults, null, new URLSearchParams());

    expect(input).toEqual(defaults);
  });
});
