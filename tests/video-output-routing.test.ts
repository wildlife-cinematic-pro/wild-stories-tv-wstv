import { describe, expect, it } from "vitest";

import {
  buildPrimaryRouteRoutingNote,
  getOrderedOutputTabs,
  getPrimaryRouteLabel,
  getPrimaryVideoRoute,
  isHybridWorkflow,
} from "@/lib/video-output-routing";

describe("video output routing", () => {
  it("keeps Hybrid primary over any selected video model", () => {
    const route = getPrimaryVideoRoute({
      pipelineStyle: "4-shot",
      selectedVideoModelId: "seedance-2",
    });

    expect(route).toMatchObject({
      kind: "hybrid",
      label: "Primary Route: Hybrid 4-shot",
      workspaceTab: "hybrid",
      hybridProtected: true,
    });
    expect(route.detail).toContain("Hybrid output remains primary");
    expect(getOrderedOutputTabs(route)[0]).toBe("hybrid");
    expect(buildPrimaryRouteRoutingNote(route, "Hybrid route note.")).toBe(
      "Hybrid route note."
    );
  });

  it("treats both current pipeline styles as Hybrid workflows", () => {
    expect(isHybridWorkflow({ pipelineStyle: "4-shot" })).toBe(true);
    expect(isHybridWorkflow({ pipelineStyle: "long-hybrid-4-shot" })).toBe(true);
    expect(isHybridWorkflow({ pipelineStyle: "direct-seedance" })).toBe(false);
  });

  it("makes Seedance primary when selected in a non-hybrid workflow", () => {
    const route = getPrimaryVideoRoute({
      pipelineStyle: "direct-seedance",
      selectedVideoModelId: "seedance-2",
    });

    expect(route).toMatchObject({
      kind: "seedance-direct",
      label: "Primary Route: Seedance 2 fast action",
      workspaceTab: "seedance",
      hybridProtected: false,
    });
    expect(getOrderedOutputTabs(route)).toEqual(["seedance", "hybrid", "runway", "kling"]);
  });

  it("makes Aleph an existing-footage edit route", () => {
    const route = getPrimaryVideoRoute({
      pipelineStyle: "existing-footage-edit",
      selectedVideoModelId: "runway-aleph",
    });

    expect(route).toMatchObject({
      kind: "aleph-edit",
      label: "Primary Route: Aleph existing-footage edit",
      workspaceTab: "runway",
    });
    expect(route.detail).toMatch(/existing-footage|source footage/i);
  });

  it("makes Runway native models primary for non-hybrid workflows", () => {
    const route = getPrimaryVideoRoute({
      pipelineStyle: "runway-native",
      selectedVideoModelId: "runway-gen-4-5",
    });

    expect(route).toMatchObject({
      kind: "runway-native",
      label: "Primary Route: Runway Gen-4.5 final hero",
      workspaceTab: "runway",
    });
    expect(getPrimaryRouteLabel(route)).toBe("Primary Route: Runway Gen-4.5 final hero");
  });

  it("makes Direct Kling models primary for non-hybrid workflows", () => {
    const route = getPrimaryVideoRoute({
      pipelineStyle: "direct-kling",
      selectedVideoModelId: "kling-3-0-pro",
    });

    expect(route).toMatchObject({
      kind: "kling-direct",
      label: "Primary Route: Direct Kling action",
      workspaceTab: "kling",
    });
  });

  it("makes Kling 03 4K a Runway third-party primary route", () => {
    const route = getPrimaryVideoRoute({
      pipelineStyle: "runway-third-party",
      selectedVideoModelId: "kling-03-4k",
    });

    expect(route).toMatchObject({
      kind: "runway-third-party",
      label: "Primary Route: Runway Third-Party Kling 03 4K",
      workspaceTab: "runway",
    });
  });

  it("makes Kling Motion Control a Runway third-party primary route", () => {
    const route = getPrimaryVideoRoute({
      pipelineStyle: "runway-third-party",
      selectedVideoModelId: "kling-3-0-motion-control",
    });

    expect(route).toMatchObject({
      kind: "runway-third-party",
      label: "Primary Route: Runway Third-Party Motion Control",
      workspaceTab: "runway",
    });
  });

  it("keeps existing output tabs available after primary ordering", () => {
    const route = getPrimaryVideoRoute({
      pipelineStyle: "direct-kling",
      selectedVideoModelId: "kling-3-0-pro",
    });

    expect(getOrderedOutputTabs(route).sort()).toEqual(
      ["hybrid", "seedance", "runway", "kling"].sort()
    );
  });
});
