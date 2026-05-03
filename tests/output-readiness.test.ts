import { describe, expect, it } from "vitest";

import { analyzeOutputReadiness } from "@/lib/output-readiness";

describe("analyzeOutputReadiness", () => {
  it("marks a strong output pack as ready", () => {
    const report = analyzeOutputReadiness({
      predatorName: "Crocodile",
      preyName: "Warthog",
      imagePrompt:
        "Crocodile and Warthog full body in the same frame, push-in camera, raw documentary tension, no blood, no gore, no visible wounds.",
      runwayShots: [
        "Slow push-in as the crocodile surges once and the warthog reacts backward.",
      ],
      klingShots: [
        "Handheld pressure beat as the crocodile lunges and the warthog turns to escape.",
      ],
      caption: "Crocodile vs warthog at the waterline.",
      hashtags: "#wildlife #crocodile #warthog #documentary #reels",
      routingNote: "Primary workflow: hybrid 4-shot route.",
    });

    expect(report.status).toBe("Ready");
    expect(report.items.every((item) => item.status === "pass")).toBe(true);
  });

  it("warns when camera cues are missing", () => {
    const report = analyzeOutputReadiness({
      predatorName: "Wolf Pack",
      preyName: "Bull Elk",
      imagePrompt:
        "Wolf Pack and Bull Elk in the same frame, no blood, no gore, no visible wounds.",
      runwayShots: ["The pack moves forward and the elk reacts."],
      caption: "Wolf pack pressure on a bull elk.",
      hashtags: "#wolfpack #elk #wildlife #documentary #reels",
    });

    const cameraItem = report.items.find(
      (item) => item.label === "Camera cue included"
    );

    expect(cameraItem?.status).toBe("warning");
    expect(report.status).toBe("Needs review");
  });

  it("warns when caption or hashtags are missing", () => {
    const report = analyzeOutputReadiness({
      predatorName: "Bald Eagle",
      preyName: "Salmon",
      imagePrompt:
        "Bald Eagle and Salmon with a locked camera, clean anatomy, no blood, no gore.",
      runwayShots: ["Locked camera as the eagle dives and the salmon turns."],
      klingShots: ["Fast glide as the eagle strikes and the salmon reacts."],
      caption: "",
      hashtags: "",
    });

    const socialItem = report.items.find(
      (item) => item.label === "Caption and hashtags available"
    );

    expect(socialItem?.status).toBe("warning");
    expect(report.status).toBe("Needs review");
  });

  it("detects animal identity by pair names", () => {
    const report = analyzeOutputReadiness({
      predatorName: "Black Bear",
      preyName: "Salmon",
      imagePrompt:
        "Black Bear and Salmon at the riverbank with a slow push-in, no blood, no gore.",
      runwayShots: ["The black bear steps forward once and the salmon surges."],
      caption: "Black Bear vs Salmon river strike.",
      hashtags: "#blackbear #salmon #wildlife #river #reels",
    });

    const identityItem = report.items.find(
      (item) => item.label === "Animal identity included"
    );

    expect(identityItem?.status).toBe("pass");
  });

  it("flags missing safety wording", () => {
    const report = analyzeOutputReadiness({
      predatorName: "Golden Eagle",
      preyName: "Rabbit",
      imagePrompt:
        "Golden Eagle and Rabbit in a locked camera setup with clear spacing.",
      runwayShots: ["Locked camera as the eagle turns and the rabbit runs."],
      caption: "Golden Eagle pressure on rabbit.",
      hashtags: "#goldeneagle #rabbit #wildlife #reels #nature",
    });

    const safetyItem = report.items.find(
      (item) => item.label === "Safety wording present"
    );

    expect(safetyItem?.status).toBe("warning");
    expect(report.status).toBe("Needs review");
  });
});
