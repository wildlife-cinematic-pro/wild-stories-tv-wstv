import { describe, expect, it } from "vitest";

import {
  buildCameraActionCleanPromptPreview,
  buildFinalQaCleanupItems,
} from "@/lib/final-qa-cleanup";
import type { WorkflowQaSummary } from "@/lib/workflow-qa";

const baseWorkflowQa: WorkflowQaSummary = {
  status: "Needs review",
  score: 74,
  items: [
    {
      label: "Scene setup",
      status: "pass",
      detail: "Scene inputs look compatible.",
    },
    {
      label: "Prompt health",
      status: "warning",
      detail: "Scene description needs a cleaner camera/action lane.",
    },
    {
      label: "Output readiness",
      status: "pass",
      detail: "Output includes named animals and engine-ready sections.",
    },
    {
      label: "Copy/export readiness",
      status: "pass",
      detail: "Copy and export surfaces are ready.",
    },
    {
      label: "Safety wording",
      status: "pass",
      detail: "Non-graphic safety wording is present.",
    },
  ],
  topFixes: ["Simplify the scene description."],
};

describe("final QA cleanup", () => {
  it("builds a clean before/after prompt for camera and action conflicts", () => {
    const preview = buildCameraActionCleanPromptPreview({
      predator: "Grizzly Bear",
      prey: "Bull Elk",
      finalEnvironment: "Yellowstone meadow edge at golden hour",
      cameraAnglePreset: "low-angle telephoto wide aerial cinematic push-in",
      actionStyle: "Natural tension",
      sceneDescription:
        "Shot 1 camera push-in, then cut to zoom and pan while the bear runs, reacts, lunges, no gore, avoid blur.",
    });

    expect(preview.hasConflict).toBe(true);
    expect(preview.before).toContain("Shot 1 camera push-in");
    expect(preview.after).toContain("Wildlife documentary scene");
    expect(preview.after).toContain("Grizzly Bear and Bull Elk");
    expect(preview.after).toContain("Camera: slow low-angle cinematic push-in");
  });

  it("returns cleanup assistant items with apply text and related step targets", () => {
    const items = buildFinalQaCleanupItems({
      workflowQa: baseWorkflowQa,
      outputReadiness: {
        status: "Needs review",
        items: [
          {
            label: "Camera cue included",
            status: "warning",
            detail: "Add a simple camera cue.",
          },
        ],
      },
      predator: "Grizzly Bear",
      prey: "Bull Elk",
      finalEnvironment: "Yellowstone meadow edge",
      cameraAnglePreset: "front full-body",
      actionStyle: "Forced retreat",
      sceneDescription: "camera pan, zoom, cut to shot 2, animal moves and reacts",
    });

    const promptHealth = items.find((item) => item.id === "prompt-health");
    const cameraCue = items.find((item) => item.id === "camera-cue-cleanup");

    expect(promptHealth?.relatedStep).toBe(2);
    expect(promptHealth?.relatedTargetId).toBe("qa-scene-description-controls");
    expect(promptHealth?.applyPromptValue).toContain("retreats through a clean escape lane");
    expect(cameraCue?.relatedStep).toBe(2);
    expect(cameraCue?.relatedTargetId).toBe("qa-scene-description-controls");
  });

  it("routes missing subject clarity to the Subject Setup controls", () => {
    const items = buildFinalQaCleanupItems({
      workflowQa: { ...baseWorkflowQa, items: baseWorkflowQa.items.map((item) => ({ ...item, status: "pass" })) },
      outputReadiness: {
        status: "Needs review",
        items: [
          {
            label: "Animal identity included",
            status: "warning",
            detail: "Add clear subject names before generating.",
          },
        ],
      },
      predator: "Grizzly Bear",
      prey: "Bull Elk",
      finalEnvironment: "Yellowstone meadow edge",
      cameraAnglePreset: "front full-body",
      actionStyle: "Natural tension",
      sceneDescription: "Grassy meadow, clean distance.",
    });

    const subjectClarity = items.find((item) => item.id === "subject-clarity");

    expect(subjectClarity?.relatedStep).toBe(1);
    expect(subjectClarity?.relatedTargetId).toBe("qa-subject-setup");
    expect(subjectClarity?.suggestedCleanerWording).toContain("Grizzly Bear and Bull Elk");
  });
});
