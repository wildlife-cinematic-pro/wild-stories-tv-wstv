import { describe, expect, it } from "vitest";

import {
  buildAllGptImage2Text,
  buildAllNanoBanana2Text,
  buildFourShotPhotoPrompts,
} from "@/lib/four-shot-photo-system";

describe("four-shot photo system UI builder", () => {
  it("builds a master environment and exactly four connected shots", () => {
    const output = buildFourShotPhotoPrompts({
      predator: "Mountain Lion",
      prey: "Mule Deer",
      environment: "Yellowstone sagebrush meadow, dirt game trail, pine treeline, distant ridge",
      lighting: "golden-hour side light from camera left",
      season: "early autumn",
      aspectRatio: "9:16",
      predatorIdentityNotes: "adult mountain lion with tawny coat and long low tail",
      preyIdentityNotes: "adult mule deer doe with large ears and grounded hooves",
    });

    expect(output.masterEnvironment.nanoBanana2Prompt).toContain("No animals in this master plate");
    expect(output.masterEnvironment.gptImage2Prompt).toContain("Premium photorealistic wildlife documentary");
    expect(output.shots).toHaveLength(4);
    expect(output.shots.map((shot) => shot.name)).toEqual([
      "Wide Hook",
      "Predator Push-in",
      "Prey Reaction",
      "Chase / Action",
    ]);

    for (const shot of output.shots) {
      expect(shot.nanoBanana2Prompt).toContain("Environment lock");
      expect(shot.gptImage2Prompt).toContain("telephoto wildlife lens feel");
      expect(shot.continuityChecklist.length).toBeGreaterThan(8);
    }
  });

  it("adds identity, story direction, gaze, and ground integration locks to shot prompts", () => {
    const output = buildFourShotPhotoPrompts({
      predator: "Mountain Lion",
      prey: "Mule Deer",
      environment: "sagebrush trail",
      lighting: "golden side light",
      season: "early autumn",
      aspectRatio: "9:16",
      predatorIdentityNotes: "same tawny mountain lion with long low tail",
      preyIdentityNotes: "same mule deer doe with large ears",
    });
    const shotOne = output.shots[0].nanoBanana2Prompt;
    const shotFour = output.shots[3].gptImage2Prompt;

    expect(shotOne).toContain("same predator and same prey identities");
    expect(shotOne).toContain("Predator stays behind, prey stays ahead");
    expect(shotOne).toContain("Gaze / attention lock");
    expect(shotOne).toContain("predator eyes, head, and body intention stay locked toward the prey");
    expect(shotOne).toContain("contact shadows");
    expect(shotOne).toContain("grass brushing legs");
    expect(shotFour).toContain("Shot 4 chase lock");
    expect(shotFour).toContain("both moving in the same direction");
    expect(shotFour).toContain("no contact, no injury");
    expect(shotFour).toContain("animal faces and bodies must remain readable");
  });

  it("builds copy-all text for both engines", () => {
    const output = buildFourShotPhotoPrompts();
    const nano = buildAllNanoBanana2Text(output);
    const gpt = buildAllGptImage2Text(output);

    expect(nano).toContain("MASTER ENVIRONMENT - NANO BANANA 2");
    expect(nano).toContain("SHOT 4 - CHASE / ACTION - NANO BANANA 2");
    expect(gpt).toContain("MASTER ENVIRONMENT - GPT IMAGE 2");
    expect(gpt).toContain("SHOT 4 - CHASE / ACTION - GPT IMAGE 2");
  });
});
