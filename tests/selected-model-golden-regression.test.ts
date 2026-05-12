import { describe, expect, it } from "vitest";

import { getOrderedOutputTabs, type PrimaryVideoRouteKind } from "@/lib/video-output-routing";
import { getProductionChecklistForRoute } from "@/lib/video-production-checklist";
import { buildProductionPackExport } from "@/lib/video-production-pack-export";
import { getRouteAwareCopyActions } from "@/lib/video-route-copy-actions";
import { getWorkflowQAForRoute, type VideoWorkflowQAStatus } from "@/lib/video-workflow-qa";
import type { GeneratedPackage } from "@/types";

import {
  buildGoldenPackage,
  GOLDEN_BUILD_INPUTS,
  type GoldenBuildInput,
} from "./fixtures/golden-build-inputs";

type SelectedModelGoldenCase = {
  name: string;
  selectedVideoModelId: string;
  pipelineStyle: string;
  expectedRouteKind: PrimaryVideoRouteKind;
  expectedPrimaryRoute: string;
  expectedFirstTab: string;
  expectedSelectedModel: string;
  expectedCopyTip: RegExp;
  expectedChecklistTitle: string;
  expectedWorkflowQAStatus: VideoWorkflowQAStatus;
  expectedBestNextAction: string;
  expectedRouteCopyLabels: string[];
  expectedShortPack: RegExp[];
  expectedFullPack: RegExp[];
};

function buildSelectedModelGoldenInput(
  overrides: Pick<SelectedModelGoldenCase, "selectedVideoModelId" | "pipelineStyle">
): GoldenBuildInput {
  return {
    ...GOLDEN_BUILD_INPUTS[0],
    name: `Selected model golden - ${overrides.selectedVideoModelId}`,
    selectedVideoModelId: overrides.selectedVideoModelId,
    selectedPipelineStyle: overrides.pipelineStyle as GoldenBuildInput["selectedPipelineStyle"],
  };
}

function normalizeGeneratedPackageForGolden(pkg: GeneratedPackage) {
  const route = pkg.primaryVideoRoute;
  const guidance = pkg.modelPromptGuidance;
  const checklist = getProductionChecklistForRoute({ route, guidance });
  const workflowQA = getWorkflowQAForRoute({ route, guidance });
  const productionPack = buildProductionPackExport(pkg);
  const copyActions = getRouteAwareCopyActions(pkg);

  return {
    selectedVideoModel: pkg.selectedVideoModel,
    primaryVideoRoute: route,
    modelPromptGuidance: guidance,
    orderedTabs: getOrderedOutputTabs(route),
    checklist,
    workflowQA,
    productionPack,
    copyActions,
    legacyModels: pkg.modelsUsed,
    bundles: {
      hybrid: pkg.structuredPrompts?.workflowShots ?? [],
      runway: pkg.structuredPrompts?.runwayShots ?? [],
      kling: pkg.structuredPrompts?.klingShots ?? [],
      seedance: pkg.structuredPrompts?.seedanceShots ?? [],
      runwayBundle: pkg.runwayBundle,
      klingBundle: pkg.klingBundle,
      seedanceMultiShot: pkg.structuredPrompts?.seedanceMultiShot,
    },
  };
}

function expectExistingBundlesPreserved(
  golden: ReturnType<typeof normalizeGeneratedPackageForGolden>
) {
  expect(golden.bundles.hybrid).toHaveLength(4);
  expect(golden.bundles.runway).toHaveLength(4);
  expect(golden.bundles.kling).toHaveLength(4);
  expect(golden.bundles.seedance).toHaveLength(4);
  expect(golden.bundles.runwayBundle).toContain("Runway");
  expect(golden.bundles.klingBundle).toContain("Kling");
  expect(golden.bundles.seedanceMultiShot?.pasteReady).toBeTruthy();
}

function expectSelectedModelRouteGolden(testCase: SelectedModelGoldenCase) {
  const input = buildSelectedModelGoldenInput(testCase);
  const pkg = buildGoldenPackage(input);
  const golden = normalizeGeneratedPackageForGolden(pkg);

  expect(golden.selectedVideoModel).toMatchObject({
    id: testCase.selectedVideoModelId,
    label: testCase.expectedSelectedModel,
  });
  expect(golden.primaryVideoRoute).toMatchObject({
    kind: testCase.expectedRouteKind,
    label: testCase.expectedPrimaryRoute,
  });
  expect(golden.modelPromptGuidance).toMatchObject({
    selectedModel: testCase.expectedSelectedModel,
    primaryRoute: testCase.expectedPrimaryRoute,
  });
  expect(golden.modelPromptGuidance?.copyTip).toMatch(testCase.expectedCopyTip);
  expect(golden.orderedTabs[0]).toBe(testCase.expectedFirstTab);
  expect(golden.checklist.title).toBe(testCase.expectedChecklistTitle);
  expect(golden.checklist.steps.length).toBeGreaterThan(0);
  expect(golden.workflowQA.status).toBe(testCase.expectedWorkflowQAStatus);
  expect(golden.workflowQA.bestNextAction).toBe(testCase.expectedBestNextAction);
  expect(golden.productionPack.title).toBe("Production Pack Export");
  expect(golden.productionPack.shortText).toContain(
    `Selected Model: ${testCase.expectedSelectedModel}`
  );
  expect(golden.productionPack.shortText).toContain(
    testCase.expectedPrimaryRoute
  );
  for (const pattern of testCase.expectedShortPack) {
    expect(golden.productionPack.shortText).toMatch(pattern);
  }
  expect(golden.productionPack.fullText).toContain("Workflow QA Status:");
  expect(golden.productionPack.fullText).toContain("Production Checklist:");
  for (const pattern of testCase.expectedFullPack) {
    expect(golden.productionPack.fullText).toMatch(pattern);
  }
  expect(golden.copyActions.map((action) => action.label)).toEqual(
    expect.arrayContaining(testCase.expectedRouteCopyLabels)
  );
  expectExistingBundlesPreserved(golden);

  return { input, pkg, golden };
}

const SELECTED_MODEL_GOLDEN_CASES: SelectedModelGoldenCase[] = [
  {
    name: "Hybrid default",
    selectedVideoModelId: "runway-gen-4-5",
    pipelineStyle: "long-hybrid-4-shot",
    expectedRouteKind: "hybrid",
    expectedPrimaryRoute: "Primary Route: Hybrid 4-shot",
    expectedFirstTab: "hybrid",
    expectedSelectedModel: "Gen-4.5",
    expectedCopyTip: /Hybrid 4-Shot Paste Pack/i,
    expectedChecklistTitle: "Hybrid Production Checklist",
    expectedWorkflowQAStatus: "Ready",
    expectedBestNextAction: "Use the Hybrid copy package first.",
    expectedRouteCopyLabels: ["Copy Hybrid Package", "Copy Runway Shot", "Copy Kling Shot"],
    expectedShortPack: [/Hybrid primary/i],
    expectedFullPack: [/Hybrid 4-shot package first/i, /Shot 1 and Shot 4 use Runway/i],
  },
  {
    name: "Gen-4.5 Runway native",
    selectedVideoModelId: "runway-gen-4-5",
    pipelineStyle: "direct",
    expectedRouteKind: "runway-native",
    expectedPrimaryRoute: "Primary Route: Runway Gen-4.5 final hero",
    expectedFirstTab: "runway",
    expectedSelectedModel: "Gen-4.5",
    expectedCopyTip: /Runway I2V/i,
    expectedChecklistTitle: "Runway Native Production Checklist",
    expectedWorkflowQAStatus: "Ready",
    expectedBestNextAction: "Copy the Runway native prompt and settings.",
    expectedRouteCopyLabels: ["Copy Runway Native Prompt", "Copy Runway Settings"],
    expectedShortPack: [/Runway native/i],
    expectedFullPack: [/motion-focused/i, /Runway native route/i],
  },
  {
    name: "Gen-4 Turbo Runway test route",
    selectedVideoModelId: "runway-gen-4-turbo",
    pipelineStyle: "direct",
    expectedRouteKind: "runway-native",
    expectedPrimaryRoute: "Primary Route: Runway Gen-4 Turbo final hero",
    expectedFirstTab: "runway",
    expectedSelectedModel: "Gen-4 Turbo",
    expectedCopyTip: /Runway I2V/i,
    expectedChecklistTitle: "Runway Native Production Checklist",
    expectedWorkflowQAStatus: "Ready",
    expectedBestNextAction: "Copy the Runway native prompt and settings.",
    expectedRouteCopyLabels: ["Copy Runway Native Prompt", "Copy Runway Settings"],
    expectedShortPack: [/Runway native/i],
    expectedFullPack: [/motion-focused/i, /Runway native route/i],
  },
  {
    name: "Seedance 2",
    selectedVideoModelId: "seedance-2",
    pipelineStyle: "direct",
    expectedRouteKind: "seedance-direct",
    expectedPrimaryRoute: "Primary Route: Seedance 2 fast action",
    expectedFirstTab: "seedance",
    expectedSelectedModel: "Seedance 2",
    expectedCopyTip: /Seedance Prompts/i,
    expectedChecklistTitle: "Seedance 2 Production Checklist",
    expectedWorkflowQAStatus: "Ready",
    expectedBestNextAction: "Copy the Seedance 2 shot bundle.",
    expectedRouteCopyLabels: ["Copy Seedance 2 Prompt", "Copy Seedance Shot Bundle"],
    expectedShortPack: [/Seedance direct/i],
    expectedFullPack: [/Seedance 2 route/i, /fast-action beats compact/i],
  },
  {
    name: "Direct Kling 3.0 Pro",
    selectedVideoModelId: "kling-3-0-pro",
    pipelineStyle: "direct",
    expectedRouteKind: "kling-direct",
    expectedPrimaryRoute: "Primary Route: Direct Kling action",
    expectedFirstTab: "kling",
    expectedSelectedModel: "Kling 3.0 Pro",
    expectedCopyTip: /Kling Prompts/i,
    expectedChecklistTitle: "Direct Kling Production Checklist",
    expectedWorkflowQAStatus: "Ready",
    expectedBestNextAction: "Copy the Direct Kling prompt.",
    expectedRouteCopyLabels: ["Copy Kling Prompt", "Copy Kling Settings"],
    expectedShortPack: [/Direct Kling/i],
    expectedFullPack: [/director-style action prompt/i, /one clear action beat/i],
  },
  {
    name: "Kling 03 4K / Runway third-party",
    selectedVideoModelId: "kling-03-4k",
    pipelineStyle: "direct",
    expectedRouteKind: "runway-third-party",
    expectedPrimaryRoute: "Primary Route: Runway Third-Party Kling 03 4K",
    expectedFirstTab: "runway",
    expectedSelectedModel: "Kling 03 4K",
    expectedCopyTip: /third-party route/i,
    expectedChecklistTitle: "Runway Third-Party Production Checklist",
    expectedWorkflowQAStatus: "Needs attention",
    expectedBestNextAction: "Verify the third-party model settings, then copy the route setup.",
    expectedRouteCopyLabels: ["Copy Runway Third-Party Route", "Copy Kling 03 4K Prompt"],
    expectedShortPack: [/Runway third-party/i],
    expectedFullPack: [/needsVerification/i, /Verify exact Runway third-party settings/i],
  },
  {
    name: "Kling 3.0 Motion Control / Runway third-party",
    selectedVideoModelId: "kling-3-0-motion-control",
    pipelineStyle: "direct",
    expectedRouteKind: "runway-third-party",
    expectedPrimaryRoute: "Primary Route: Runway Third-Party Motion Control",
    expectedFirstTab: "runway",
    expectedSelectedModel: "Kling 3.0 Motion Control",
    expectedCopyTip: /third-party route/i,
    expectedChecklistTitle: "Runway Third-Party Production Checklist",
    expectedWorkflowQAStatus: "Needs attention",
    expectedBestNextAction: "Verify the third-party model settings, then copy the route setup.",
    expectedRouteCopyLabels: ["Copy Runway Third-Party Route", "Copy Motion Control Setup"],
    expectedShortPack: [/Runway third-party/i],
    expectedFullPack: [/Motion Control/i, /Motion\/reference footage/i],
  },
  {
    name: "Aleph existing-footage edit",
    selectedVideoModelId: "runway-aleph",
    pipelineStyle: "direct",
    expectedRouteKind: "aleph-edit",
    expectedPrimaryRoute: "Primary Route: Aleph existing-footage edit",
    expectedFirstTab: "runway",
    expectedSelectedModel: "Aleph",
    expectedCopyTip: /source footage/i,
    expectedChecklistTitle: "Aleph Edit Production Checklist",
    expectedWorkflowQAStatus: "Needs attention",
    expectedBestNextAction: "Upload source footage first.",
    expectedRouteCopyLabels: ["Copy Aleph Edit Prompt", "Copy Source Footage Note"],
    expectedShortPack: [/Aleph edit/i],
    expectedFullPack: [/source-footage required/i, /Upload source footage first/i],
  },
];

describe("selected model golden regression", () => {
  it.each(SELECTED_MODEL_GOLDEN_CASES)(
    "$name preserves selected-model routing, guidance, pack exports, and bundles",
    (testCase) => {
      expectSelectedModelRouteGolden(testCase);
    }
  );

  it("keeps Seedance primary only for non-Hybrid workflows", () => {
    const hybridPkg = buildGoldenPackage(
      buildSelectedModelGoldenInput({
        selectedVideoModelId: "seedance-2",
        pipelineStyle: "long-hybrid-4-shot",
      })
    );
    const directPkg = buildGoldenPackage(
      buildSelectedModelGoldenInput({
        selectedVideoModelId: "seedance-2",
        pipelineStyle: "direct",
      })
    );

    expect(hybridPkg.primaryVideoRoute?.kind).toBe("hybrid");
    expect(hybridPkg.primaryVideoRoute?.label).toBe("Primary Route: Hybrid 4-shot");
    expect(directPkg.primaryVideoRoute?.kind).toBe("seedance-direct");
    expect(directPkg.primaryVideoRoute?.label).toBe("Primary Route: Seedance 2 fast action");
  });

  it("keeps route-specific prompt guidance stable", () => {
    const runway = buildGoldenPackage(
      buildSelectedModelGoldenInput({
        selectedVideoModelId: "runway-gen-4-5",
        pipelineStyle: "direct",
      })
    );
    const kling = buildGoldenPackage(
      buildSelectedModelGoldenInput({
        selectedVideoModelId: "kling-3-0-pro",
        pipelineStyle: "direct",
      })
    );
    const aleph = buildGoldenPackage(
      buildSelectedModelGoldenInput({
        selectedVideoModelId: "runway-aleph",
        pipelineStyle: "direct",
      })
    );

    expect(runway.modelPromptGuidance?.promptNote).toContain("Runway native I2V guidance");
    expect(runway.modelPromptGuidance?.copyTip).toContain("motion-focused");
    expect(kling.modelPromptGuidance?.promptNote).toContain("Direct Kling guidance");
    expect(kling.modelPromptGuidance?.promptNote).toContain("director-style action wording");
    expect(aleph.modelPromptGuidance?.sourceFootageRequired).toBe(true);
    expect(aleph.modelPromptGuidance?.promptNote).toContain("existing-footage edit route");
  });

  it("does not write expanded third-party selections into legacy model fields", () => {
    for (const selectedVideoModelId of [
      "seedance-2",
      "runway-aleph",
      "kling-03-4k",
      "kling-3-0-motion-control",
    ]) {
      const input = buildSelectedModelGoldenInput({
        selectedVideoModelId,
        pipelineStyle: "direct",
      });
      const pkg = buildGoldenPackage(input);

      expect(pkg.modelsUsed).toEqual({
        runway: input.runwayModel,
        kling: input.klingModel,
      });
      expect(pkg.modelsUsed?.runway).not.toMatch(/Aleph|Kling 03|Motion Control|Seedance/i);
      expect(pkg.modelsUsed?.kling).not.toMatch(/Aleph|Kling 03|Motion Control|Seedance/i);
    }
  });
});
