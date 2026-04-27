// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MonetizedPagePerformancePanel } from "@/components/output-cards/monetized-page-performance-panel";
import {
  clearMonetizedPagePerformanceHistory,
  readMonetizedPagePerformanceHistory,
} from "@/lib/storage";
import type { GeneratedPackage } from "@/types";

function makePackage(overrides: Partial<GeneratedPackage> = {}): GeneratedPackage {
  return {
    generationId: "generation_1",
    imagePrompt:
      "Mountain lion and mule deer hold one readable opening frame in a dry meadow edge.",
    negativePrompt: "",
    thumbnailPrompt: "Mountain lion vs mule deer",
    voiceoverLine: "The deer has one clean exit lane left.",
    runwayShots: ["Shot 1"],
    klingShots: ["Shot 1"],
    motionStrength: 64,
    capCutPlan: "Cut on the turn.",
    clipChaining: "Hold the left-to-right line.",
    predatorName: "Mountain Lion",
    preyName: "Mule Deer",
    arcName: "Escape from danger",
    hook: "Mountain lion pressure closes before the mule deer clears the break.",
    hook2026: ["Mountain lion pressure closes before the mule deer clears the break."],
    caption:
      "Mountain lion pressure closes before the mule deer finds a clean turn.\n\nWhat changed the outcome first?",
    caption2026:
      "Mountain lion pressure closes before the mule deer finds a clean turn.\n\nWhat changed the outcome first?",
    cta: "What changed the outcome first?",
    hashtags: "#MountainLion #MuleDeer #WildlifeReel #PredatorPrey #NatureShorts",
    tenIdeas: [],
    shotPlan: [],
    runwayBundle: "Runway bundle",
    klingBundle: "Kling bundle",
    routingNote: "Default route.",
    durationLane: "short",
    hookFamily: "danger",
    ...overrides,
  };
}

describe("MonetizedPagePerformancePanel", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearMonetizedPagePerformanceHistory();
  });

  it("imports uploaded csv files locally and refreshes the current package match", async () => {
    render(
      <MonetizedPagePerformancePanel data={makePackage()} onCopy={vi.fn()} />
    );

    const csv = [
      "generation_id,permalink,description,people_reached,3-second video views,1-minute video views,average watch time,shares,comments,new_followers,estimated earnings,rpm,monetized plays",
      'generation_1,https://facebook.com/post/1,"Mountain lion pressure closes fast",120000,62000,14000,18,260,170,95,31,5.8,21000',
    ].join("\n");

    const input = screen.getByLabelText(/Upload Facebook Insights CSV file/i);
    const file = new File([csv], "facebook-insights.csv", { type: "text/csv" });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() =>
      expect(
        screen.getByText(/Uploaded and analyzed 1 Facebook Insights record\./i)
      ).toBeInTheDocument()
    );

    await waitFor(() =>
      expect(readMonetizedPagePerformanceHistory()).toHaveLength(1)
    );

    expect(
      screen.getByText(/Matched by generation ID/i)
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Paste CSV text/i)
    ).toHaveValue(csv);
    expect(readMonetizedPagePerformanceHistory()[0]).toMatchObject({
      generationId: "generation_1",
      postUrl: "https://facebook.com/post/1",
      title: "Mountain lion pressure closes fast",
      source: "facebook_csv",
    });
  });

  it("rejects non-csv uploads with a clear notice", async () => {
    render(
      <MonetizedPagePerformancePanel data={makePackage()} onCopy={vi.fn()} />
    );

    const input = screen.getByLabelText(/Upload Facebook Insights CSV file/i);
    const file = new File(["not csv"], "facebook-insights.txt", {
      type: "text/plain",
    });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() =>
      expect(
        screen.getByText(/Please upload a valid Facebook Insights CSV file\./i)
      ).toBeInTheDocument()
    );

    expect(readMonetizedPagePerformanceHistory()).toHaveLength(0);
  });
});
