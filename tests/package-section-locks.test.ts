import { describe, expect, it } from "vitest";

import {
  applyPackageSectionLocks,
  createDefaultPackageLockState,
  setAllPackageLocks,
} from "@/lib/package-section-locks";
import type { GeneratedPackage } from "@/types";

function makePackage(prefix: string): GeneratedPackage {
  return {
    predatorName: `${prefix} predator`,
    preyName: `${prefix} prey`,
    arcName: "Ambush attack",
    imagePrompt: `${prefix} master image prompt`,
    negativePrompt: `${prefix} negative`,
    thumbnailPrompt: `${prefix} thumbnail`,
    voiceoverLine: `${prefix} voiceover`,
    structuredPrompts: {
      imagePrompt: {
        fullText: `${prefix} structured image full`,
        pasteReady: `${prefix} structured image paste`,
        metadata: { engine: "image" },
      },
      runwayShots: [
        {
          fullText: `${prefix} runway structured 1`,
          pasteReady: `${prefix} runway paste 1`,
          metadata: { engine: "runway", shotKey: "shot1" },
        },
      ],
      klingShots: [
        {
          fullText: `${prefix} kling structured 1`,
          pasteReady: `${prefix} kling paste 1`,
          metadata: { engine: "kling", shotKey: "shot2" },
        },
      ],
      seedanceShots: [
        {
          fullText: `${prefix} seedance structured 1`,
          pasteReady: `${prefix} seedance paste 1`,
          metadata: { engine: "seedance", shotKey: "shot1" },
        },
      ],
      seedanceMultiShot: {
        fullText: `${prefix} seedance multi full`,
        pasteReady: `${prefix} seedance multi paste`,
        metadata: { engine: "seedance", variant: "multi-shot" },
      },
      workflowShots: [
        {
          fullText: `${prefix} workflow runway 1`,
          pasteReady: `${prefix} workflow runway paste 1`,
          metadata: { engine: "runway", shotKey: "shot1" },
        },
        {
          fullText: `${prefix} workflow kling 2`,
          pasteReady: `${prefix} workflow kling paste 2`,
          metadata: { engine: "kling", shotKey: "shot2" },
        },
        {
          fullText: `${prefix} workflow kling 3`,
          pasteReady: `${prefix} workflow kling paste 3`,
          metadata: { engine: "kling", shotKey: "shot3" },
        },
        {
          fullText: `${prefix} workflow runway 4`,
          pasteReady: `${prefix} workflow runway paste 4`,
          metadata: { engine: "runway", shotKey: "shot4" },
        },
      ],
      klingNative15s: {
        fullText: `${prefix} kling native`,
        pasteReady: `${prefix} kling native paste`,
        metadata: { engine: "kling", variant: "native-15s" },
      },
      klingSixShot: {
        fullText: `${prefix} kling six`,
        pasteReady: `${prefix} kling six paste`,
        metadata: { engine: "kling", variant: "six-shot" },
      },
    },
    runwayShots: [
      `${prefix} runway 1`,
      `${prefix} runway 2`,
      `${prefix} runway 3`,
      `${prefix} runway 4`,
    ],
    klingShots: [
      `${prefix} kling 1`,
      `${prefix} kling 2`,
      `${prefix} kling 3`,
      `${prefix} kling 4`,
    ],
    seedanceShots: [
      `${prefix} seedance 1`,
      `${prefix} seedance 2`,
      `${prefix} seedance 3`,
      `${prefix} seedance 4`,
    ],
    seedanceMultiShotPrompt: `${prefix} seedance multi`,
    seedanceWorkflowGuide: `${prefix} seedance guide`,
    klingNative15s: `${prefix} kling native text`,
    klingSixShot: `${prefix} kling six text`,
    motionStrength: 70,
    capCutPlan: `${prefix} capcut plan`,
    clipChaining: `${prefix} clip chaining`,
    hook: `${prefix} hook`,
    hook2026: [`${prefix} hook a`, `${prefix} hook b`],
    recommendedHookIndex: 1,
    caption: `${prefix} caption`,
    caption2026: `${prefix} long caption`,
    cta: `${prefix} cta`,
    hashtags: `#${prefix} #wildlife`,
    tags: `${prefix},wildlife`,
    tenIdeas: [`${prefix} idea`],
    shotPlan: [
      {
        engine: "RUNWAY",
        title: `${prefix} shot 1`,
        prompt: `${prefix} workflow runway 1`,
        motionStrength: 70,
      },
      {
        engine: "KLING",
        title: `${prefix} shot 2`,
        prompt: `${prefix} workflow kling 2`,
        motionStrength: 70,
      },
      {
        engine: "KLING",
        title: `${prefix} shot 3`,
        prompt: `${prefix} workflow kling 3`,
        motionStrength: 70,
      },
      {
        engine: "RUNWAY",
        title: `${prefix} shot 4`,
        prompt: `${prefix} workflow runway 4`,
        motionStrength: 70,
      },
    ],
    runwayBundle: `${prefix} runway bundle`,
    klingBundle: `${prefix} kling bundle`,
    routingNote: `${prefix} routing`,
    platformPack: {
      facebook: {
        hook: `${prefix} fb hook`,
        caption: `${prefix} fb caption`,
        hashtags: `${prefix} fb hashtags`,
        tags: `${prefix} fb tags`,
        bestTime: "7 PM",
        cmpNote: "cmp",
        overlayGuidance: {
          placement: `${prefix} placement`,
          textLength: `${prefix} text length`,
          opener: `${prefix} opener`,
          audio: `${prefix} audio`,
          tone: `${prefix} tone`,
        },
        hookFormattingPresets: [
          {
            preset: "species_first",
            label: `${prefix} fb preset`,
            text: `${prefix} fb overlay`,
            lines: [`${prefix} fb line 1`, `${prefix} fb line 2`],
            note: `${prefix} fb note`,
          },
        ],
        facebookOverlayPresets: [
          {
            preset: "facebook_species_first",
            label: `${prefix} facebook overlay preset`,
            text: `${prefix} facebook overlay text`,
            lines: [`${prefix} facebook overlay line`],
            note: `${prefix} facebook overlay note`,
          },
        ],
        facebookCoverFramePresets: [
          {
            preset: "species_pressure",
            label: `${prefix} facebook cover preset`,
            text: `${prefix} facebook cover text`,
            lines: [`${prefix} facebook cover line`],
            note: `${prefix} facebook cover note`,
          },
        ],
      },
      instagram: {
        hook: `${prefix} ig hook`,
        caption: `${prefix} ig caption`,
        hashtags: `${prefix} ig hashtags`,
        tags: `${prefix} ig tags`,
        bestTime: "7 PM",
        overlayGuidance: {
          placement: `${prefix} ig placement`,
          textLength: `${prefix} ig text length`,
          opener: `${prefix} ig opener`,
          audio: `${prefix} ig audio`,
          tone: `${prefix} ig tone`,
        },
        hookFormattingPresets: [
          {
            preset: "documentary_tension",
            label: `${prefix} ig preset`,
            text: `${prefix} ig overlay`,
            lines: [`${prefix} ig line 1`, `${prefix} ig line 2`],
            note: `${prefix} ig note`,
          },
        ],
      },
      tiktok: {
        hook: `${prefix} tt hook`,
        caption: `${prefix} tt caption`,
        hashtags: `${prefix} tt hashtags`,
        tags: `${prefix} tt tags`,
        bestTime: "7 PM",
        overlayGuidance: {
          placement: `${prefix} tt placement`,
          textLength: `${prefix} tt text length`,
          opener: `${prefix} tt opener`,
          audio: `${prefix} tt audio`,
          tone: `${prefix} tt tone`,
        },
        hookFormattingPresets: [
          {
            preset: "short_pressure",
            label: `${prefix} tt preset`,
            text: `${prefix} tt overlay`,
            lines: [`${prefix} tt line 1`],
            note: `${prefix} tt note`,
          },
        ],
      },
      youtube_shorts: {
        title: `${prefix} yt title`,
        description: `${prefix} yt description`,
        tags: `${prefix} yt tags`,
        bestTime: "7 PM",
      },
    },
    sceneDesc: `${prefix} scene`,
    twoPartViralOverview: `${prefix} two part overview`,
    twoPartWorkflowGuide: `${prefix} two part guide`,
    twoPartPart1Hook: `${prefix} part 1 hook`,
    twoPartPart1Caption: `${prefix} part 1 caption`,
    twoPartPart1Draft: `${prefix} part 1 draft`,
    twoPartPart1Final: `${prefix} part 1 final`,
    twoPartPart2Hook: `${prefix} part 2 hook`,
    twoPartPart2Caption: `${prefix} part 2 caption`,
    twoPartPart2Draft: `${prefix} part 2 draft`,
    twoPartPart2Final: `${prefix} part 2 final`,
    capCutScript: {
      totalDuration: "20 seconds",
      aspectRatio: "9:16",
      fps: 30,
      beats: [
        {
          timeIn: "0:00",
          timeOut: "0:04",
          shotRef: `${prefix} shot`,
          onScreenText: `${prefix} text`,
          transition: `${prefix} transition`,
          sfx: `${prefix} sfx`,
          musicNote: `${prefix} music`,
        },
      ],
      exportSettings: `${prefix} export`,
      musicMood: `${prefix} music mood`,
    },
  };
}

describe("package section locks", () => {
  it("keeps locked packaging and scene sections byte-stable while unlocked fields update", () => {
    const lockedPackage = makePackage("locked");
    const candidatePackage = makePackage("candidate");
    const locks = createDefaultPackageLockState({
      hook: true,
      caption: true,
      hashtags: true,
      sceneDescription: true,
      masterImagePrompt: true,
      thumbnailPrompt: true,
    });

    const merged = applyPackageSectionLocks(
      lockedPackage,
      candidatePackage,
      locks
    );

    expect(merged.hook).toBe(lockedPackage.hook);
    expect(merged.hook2026).toEqual(lockedPackage.hook2026);
    expect(merged.caption).toBe(lockedPackage.caption);
    expect(merged.caption2026).toBe(lockedPackage.caption2026);
    expect(merged.hashtags).toBe(lockedPackage.hashtags);
    expect(merged.tags).toBe(lockedPackage.tags);
    expect(merged.sceneDesc).toBe(lockedPackage.sceneDesc);
    expect(merged.imagePrompt).toBe(lockedPackage.imagePrompt);
    expect(merged.thumbnailPrompt).toBe(lockedPackage.thumbnailPrompt);
    expect(merged.structuredPrompts?.imagePrompt).toEqual(
      lockedPackage.structuredPrompts?.imagePrompt
    );
    expect(merged.platformPack?.facebook.hook).toBe(
      lockedPackage.platformPack?.facebook.hook
    );
    expect(merged.platformPack?.facebook.hookFormattingPresets).toEqual(
      lockedPackage.platformPack?.facebook.hookFormattingPresets
    );
    expect(merged.platformPack?.facebook.facebookOverlayPresets).toEqual(
      lockedPackage.platformPack?.facebook.facebookOverlayPresets
    );
    expect(merged.platformPack?.facebook.facebookCoverFramePresets).toEqual(
      lockedPackage.platformPack?.facebook.facebookCoverFramePresets
    );
    expect(merged.platformPack?.instagram.overlayGuidance).toEqual(
      lockedPackage.platformPack?.instagram.overlayGuidance
    );
    expect(merged.platformPack?.instagram.caption).toBe(
      lockedPackage.platformPack?.instagram.caption
    );
    expect(merged.platformPack?.tiktok.hashtags).toBe(
      lockedPackage.platformPack?.tiktok.hashtags
    );
    expect(merged.platformPack?.tiktok.hookFormattingPresets).toEqual(
      lockedPackage.platformPack?.tiktok.hookFormattingPresets
    );
    expect(merged.voiceoverLine).toBe(candidatePackage.voiceoverLine);
  });

  it("preserves only the locked engine prompts inside the hybrid route", () => {
    const lockedPackage = makePackage("locked");
    const candidatePackage = makePackage("candidate");
    const locks = createDefaultPackageLockState({
      runwayPrompts: true,
      seedancePrompts: true,
    });

    const merged = applyPackageSectionLocks(
      lockedPackage,
      candidatePackage,
      locks
    );

    expect(merged.runwayShots).toEqual(lockedPackage.runwayShots);
    expect(merged.runwayBundle).toBe(lockedPackage.runwayBundle);
    expect(merged.seedanceShots).toEqual(lockedPackage.seedanceShots);
    expect(merged.seedanceMultiShotPrompt).toBe(
      lockedPackage.seedanceMultiShotPrompt
    );
    expect(merged.klingShots).toEqual(candidatePackage.klingShots);
    expect(merged.klingBundle).toBe(candidatePackage.klingBundle);
    expect(merged.shotPlan.map((shot) => shot.prompt)).toEqual([
      "locked workflow runway 1",
      "candidate workflow kling 2",
      "candidate workflow kling 3",
      "locked workflow runway 4",
    ]);
    expect(
      merged.structuredPrompts?.workflowShots?.map((shot) => shot.fullText)
    ).toEqual([
      "locked workflow runway 1",
      "candidate workflow kling 2",
      "candidate workflow kling 3",
      "locked workflow runway 4",
    ]);
  });

  it("can lock the full first-release section set", () => {
    const lockedPackage = makePackage("locked");
    const candidatePackage = makePackage("candidate");
    const locks = setAllPackageLocks(true);

    const merged = applyPackageSectionLocks(
      lockedPackage,
      candidatePackage,
      locks
    );

    expect(merged.hook).toBe(lockedPackage.hook);
    expect(merged.caption).toBe(lockedPackage.caption);
    expect(merged.hashtags).toBe(lockedPackage.hashtags);
    expect(merged.sceneDesc).toBe(lockedPackage.sceneDesc);
    expect(merged.imagePrompt).toBe(lockedPackage.imagePrompt);
    expect(merged.thumbnailPrompt).toBe(lockedPackage.thumbnailPrompt);
    expect(merged.runwayShots).toEqual(lockedPackage.runwayShots);
    expect(merged.klingShots).toEqual(lockedPackage.klingShots);
    expect(merged.seedanceShots).toEqual(lockedPackage.seedanceShots);
    expect(merged.twoPartPart1Final).toBe(lockedPackage.twoPartPart1Final);
    expect(merged.capCutPlan).toBe(lockedPackage.capCutPlan);
    expect(merged.capCutScript).toEqual(lockedPackage.capCutScript);
  });
});
