import type {
  GeneratedPackage,
  PackageLockKey,
  PackageLockState,
  PlatformPack,
  ShotPlan,
  StructuredPrompt,
  StructuredPromptBundle,
} from "@/types";

export type PackageLockItem = {
  key: PackageLockKey;
  label: string;
  description: string;
};

export type PackageLockGroup = {
  title: string;
  description: string;
  items: PackageLockItem[];
};

export const PACKAGE_LOCK_GROUPS: PackageLockGroup[] = [
  {
    title: "Packaging",
    description: "Keep publish copy stable while refreshing the rest.",
    items: [
      {
        key: "hook",
        label: "Hook",
        description: "Primary hook, hook variants, and platform hook fields.",
      },
      {
        key: "caption",
        label: "Caption",
        description: "Short, long, and platform caption fields.",
      },
      {
        key: "hashtags",
        label: "Hashtags",
        description: "Hashtags, tags, and platform tag fields.",
      },
    ],
  },
  {
    title: "Scene",
    description: "Keep visual setup prompts exactly as generated.",
    items: [
      {
        key: "sceneDescription",
        label: "Scene description",
        description: "The scene direction used to build the package.",
      },
      {
        key: "masterImagePrompt",
        label: "Master image prompt",
        description: "Nano Banana / Gemini master image prompt.",
      },
      {
        key: "thumbnailPrompt",
        label: "Thumbnail prompt",
        description: "Standalone thumbnail prompt.",
      },
    ],
  },
  {
    title: "Motion",
    description: "Preserve engine-specific motion prompts.",
    items: [
      {
        key: "runwayPrompts",
        label: "Runway prompts",
        description: "Runway shots, bundle, and hybrid Runway beats.",
      },
      {
        key: "klingPrompts",
        label: "Kling prompts",
        description: "Kling shots, direct cards, and hybrid Kling beats.",
      },
      {
        key: "seedancePrompts",
        label: "Seedance prompts",
        description: "Seedance shot pack and multi-shot prompt.",
      },
    ],
  },
  {
    title: "Edit / Export",
    description: "Keep the edit structure stable while testing prompt changes.",
    items: [
      {
        key: "twoPartViralPreset",
        label: "Two-part viral preset",
        description: "Part 1 / Part 2 preset hooks, captions, drafts, and finals.",
      },
      {
        key: "capCutScript",
        label: "CapCut script",
        description: "CapCut plan and beat-by-beat edit script.",
      },
    ],
  },
];

export const PACKAGE_LOCK_KEYS = PACKAGE_LOCK_GROUPS.flatMap((group) =>
  group.items.map((item) => item.key)
);

export function createDefaultPackageLockState(
  overrides: Partial<PackageLockState> = {}
): PackageLockState {
  return PACKAGE_LOCK_KEYS.reduce((state, key) => {
    state[key] = overrides[key] ?? false;
    return state;
  }, {} as PackageLockState);
}

export function countLockedPackageSections(locks: PackageLockState): number {
  return PACKAGE_LOCK_KEYS.filter((key) => locks[key]).length;
}

export function hasLockedPackageSections(locks: PackageLockState): boolean {
  return countLockedPackageSections(locks) > 0;
}

export function setAllPackageLocks(locked: boolean): PackageLockState {
  return createDefaultPackageLockState(
    PACKAGE_LOCK_KEYS.reduce((state, key) => {
      state[key] = locked;
      return state;
    }, {} as Partial<PackageLockState>)
  );
}

function preserveIfDefined<T, K extends keyof T>(target: T, source: T, key: K) {
  if (source[key] !== undefined) {
    target[key] = source[key];
  }
}

function mergePlatformPackLocks(
  locked: GeneratedPackage,
  candidate: GeneratedPackage,
  locks: PackageLockState
): PlatformPack | undefined {
  const lockedPack = locked.platformPack;
  const candidatePack = candidate.platformPack;
  if (!lockedPack && !candidatePack) return undefined;
  if (!candidatePack) return lockedPack;
  if (!lockedPack) return candidatePack;

  return {
    facebook: {
      ...candidatePack.facebook,
      ...(locks.hook
        ? {
            hook: lockedPack.facebook.hook,
            overlayGuidance: lockedPack.facebook.overlayGuidance,
            hookFormattingPresets: lockedPack.facebook.hookFormattingPresets,
            facebookOverlayPresets: lockedPack.facebook.facebookOverlayPresets,
            facebookCoverFramePresets:
              lockedPack.facebook.facebookCoverFramePresets,
          }
        : {}),
      ...(locks.caption ? { caption: lockedPack.facebook.caption } : {}),
      ...(locks.hashtags
        ? {
            hashtags: lockedPack.facebook.hashtags,
            tags: lockedPack.facebook.tags,
          }
        : {}),
    },
    instagram: {
      ...candidatePack.instagram,
      ...(locks.hook
        ? {
            hook: lockedPack.instagram.hook,
            overlayGuidance: lockedPack.instagram.overlayGuidance,
            hookFormattingPresets: lockedPack.instagram.hookFormattingPresets,
          }
        : {}),
      ...(locks.caption ? { caption: lockedPack.instagram.caption } : {}),
      ...(locks.hashtags
        ? {
            hashtags: lockedPack.instagram.hashtags,
            tags: lockedPack.instagram.tags,
          }
        : {}),
    },
    tiktok: {
      ...candidatePack.tiktok,
      ...(locks.hook
        ? {
            hook: lockedPack.tiktok.hook,
            overlayGuidance: lockedPack.tiktok.overlayGuidance,
            hookFormattingPresets: lockedPack.tiktok.hookFormattingPresets,
          }
        : {}),
      ...(locks.caption ? { caption: lockedPack.tiktok.caption } : {}),
      ...(locks.hashtags
        ? {
            hashtags: lockedPack.tiktok.hashtags,
            tags: lockedPack.tiktok.tags,
          }
        : {}),
    },
    youtube_shorts: {
      ...candidatePack.youtube_shorts,
      ...(locks.hook ? { title: lockedPack.youtube_shorts.title } : {}),
      ...(locks.caption
        ? { description: lockedPack.youtube_shorts.description }
        : {}),
      ...(locks.hashtags ? { tags: lockedPack.youtube_shorts.tags } : {}),
    },
  };
}

function mergeHybridShotPlanLocks(
  locked: GeneratedPackage,
  candidate: GeneratedPackage,
  locks: PackageLockState
): ShotPlan[] {
  return (candidate.shotPlan ?? []).map((candidateShot, index) => {
    const lockedShot = locked.shotPlan?.[index];
    if (!lockedShot || lockedShot.engine !== candidateShot.engine) {
      return candidateShot;
    }

    if (candidateShot.engine === "RUNWAY" && locks.runwayPrompts) {
      return lockedShot;
    }

    if (candidateShot.engine === "KLING" && locks.klingPrompts) {
      return lockedShot;
    }

    return candidateShot;
  });
}

function mergeWorkflowPromptLocks(
  locked: GeneratedPackage,
  candidate: GeneratedPackage,
  locks: PackageLockState
): StructuredPrompt[] | undefined {
  const candidateWorkflow = candidate.structuredPrompts?.workflowShots;
  if (!candidateWorkflow) return undefined;

  return candidateWorkflow.map((candidatePrompt, index) => {
    const lockedPrompt = locked.structuredPrompts?.workflowShots?.[index];
    const engine =
      candidatePrompt.metadata?.engine ??
      (candidate.shotPlan?.[index]?.engine === "RUNWAY" ? "runway" : "kling");

    if (engine === "runway" && locks.runwayPrompts && lockedPrompt) {
      return lockedPrompt;
    }

    if (engine === "kling" && locks.klingPrompts && lockedPrompt) {
      return lockedPrompt;
    }

    return candidatePrompt;
  });
}

function mergeStructuredPromptLocks(
  locked: GeneratedPackage,
  candidate: GeneratedPackage,
  locks: PackageLockState
): StructuredPromptBundle | undefined {
  const lockedPrompts = locked.structuredPrompts;
  const candidatePrompts = candidate.structuredPrompts;
  if (!lockedPrompts && !candidatePrompts) return undefined;

  const merged: StructuredPromptBundle = {
    ...(candidatePrompts ?? {}),
  };

  if (locks.masterImagePrompt && lockedPrompts?.imagePrompt) {
    merged.imagePrompt = lockedPrompts.imagePrompt;
  }
  if (locks.runwayPrompts && lockedPrompts?.runwayShots) {
    merged.runwayShots = lockedPrompts.runwayShots;
  }
  if (locks.klingPrompts && lockedPrompts?.klingShots) {
    merged.klingShots = lockedPrompts.klingShots;
  }
  if (locks.seedancePrompts && lockedPrompts?.seedanceShots) {
    merged.seedanceShots = lockedPrompts.seedanceShots;
  }
  if (locks.seedancePrompts && lockedPrompts?.seedanceMultiShot) {
    merged.seedanceMultiShot = lockedPrompts.seedanceMultiShot;
  }
  if (locks.klingPrompts && lockedPrompts?.klingNative15s) {
    merged.klingNative15s = lockedPrompts.klingNative15s;
  }
  if (locks.klingPrompts && lockedPrompts?.klingSixShot) {
    merged.klingSixShot = lockedPrompts.klingSixShot;
  }

  const mergedWorkflow = mergeWorkflowPromptLocks(locked, candidate, locks);
  if (mergedWorkflow) {
    merged.workflowShots = mergedWorkflow;
  }

  return merged;
}

export function applyPackageSectionLocks(
  lockedPackage: GeneratedPackage,
  candidatePackage: GeneratedPackage,
  locks: PackageLockState
): GeneratedPackage {
  const merged: GeneratedPackage = {
    ...candidatePackage,
    structuredPrompts: mergeStructuredPromptLocks(
      lockedPackage,
      candidatePackage,
      locks
    ),
    shotPlan: mergeHybridShotPlanLocks(lockedPackage, candidatePackage, locks),
    platformPack: mergePlatformPackLocks(lockedPackage, candidatePackage, locks),
  };

  if (locks.hook) {
    preserveIfDefined(merged, lockedPackage, "hook");
    preserveIfDefined(merged, lockedPackage, "hook2026");
    preserveIfDefined(merged, lockedPackage, "recommendedHookIndex");
    preserveIfDefined(merged, lockedPackage, "cta");
    preserveIfDefined(merged, lockedPackage, "hookFamily");
  }

  if (locks.caption) {
    preserveIfDefined(merged, lockedPackage, "caption");
    preserveIfDefined(merged, lockedPackage, "caption2026");
  }

  if (locks.hashtags) {
    preserveIfDefined(merged, lockedPackage, "hashtags");
    preserveIfDefined(merged, lockedPackage, "tags");
  }

  if (locks.sceneDescription) {
    preserveIfDefined(merged, lockedPackage, "sceneDesc");
  }

  if (locks.masterImagePrompt) {
    preserveIfDefined(merged, lockedPackage, "imagePrompt");
    preserveIfDefined(merged, lockedPackage, "wstvImagePrompt");
  }

  if (locks.thumbnailPrompt) {
    preserveIfDefined(merged, lockedPackage, "thumbnailPrompt");
  }

  if (locks.runwayPrompts) {
    preserveIfDefined(merged, lockedPackage, "runwayShots");
    preserveIfDefined(merged, lockedPackage, "runwayBundle");
    preserveIfDefined(merged, lockedPackage, "runwayCameraPlan");
    preserveIfDefined(merged, lockedPackage, "motionBrushPlan");
    preserveIfDefined(merged, lockedPackage, "runwayWorkflowPack");
    preserveIfDefined(merged, lockedPackage, "runwayStepGuide");
    preserveIfDefined(merged, lockedPackage, "wstvMotionPromptDraft");
    preserveIfDefined(merged, lockedPackage, "wstvMotionPromptFinal");
  }

  if (locks.klingPrompts) {
    preserveIfDefined(merged, lockedPackage, "klingShots");
    preserveIfDefined(merged, lockedPackage, "klingBundle");
    preserveIfDefined(merged, lockedPackage, "klingNative15s");
    preserveIfDefined(merged, lockedPackage, "klingSixShot");
  }

  if (locks.seedancePrompts) {
    preserveIfDefined(merged, lockedPackage, "seedanceShots");
    preserveIfDefined(merged, lockedPackage, "seedanceMultiShotPrompt");
    preserveIfDefined(merged, lockedPackage, "seedanceWorkflowGuide");
  }

  if (locks.twoPartViralPreset) {
    preserveIfDefined(merged, lockedPackage, "twoPartViralOverview");
    preserveIfDefined(merged, lockedPackage, "twoPartWorkflowGuide");
    preserveIfDefined(merged, lockedPackage, "twoPartPart1Hook");
    preserveIfDefined(merged, lockedPackage, "twoPartPart1Caption");
    preserveIfDefined(merged, lockedPackage, "twoPartPart1Draft");
    preserveIfDefined(merged, lockedPackage, "twoPartPart1Final");
    preserveIfDefined(merged, lockedPackage, "twoPartPart2Hook");
    preserveIfDefined(merged, lockedPackage, "twoPartPart2Caption");
    preserveIfDefined(merged, lockedPackage, "twoPartPart2Draft");
    preserveIfDefined(merged, lockedPackage, "twoPartPart2Final");
  }

  if (locks.capCutScript) {
    preserveIfDefined(merged, lockedPackage, "capCutPlan");
    preserveIfDefined(merged, lockedPackage, "capCutScript");
  }

  return merged;
}
