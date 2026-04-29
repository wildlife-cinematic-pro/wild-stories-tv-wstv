import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  deriveMasterImagePrompts,
  formatSceneName,
  getStoryboardMasterImageStrategy,
  type StoryboardPreviewData,
  type StoryboardPreviewScene,
  type StoryboardValidationCheck,
  type StoryboardValidationSummary,
} from "@/lib/storyboard-from-build";

type StoryboardSequenceScene = Omit<
  StoryboardPreviewScene,
  "displayName" | "negativePrompt" | "continuityRules"
> & {
  nanoBananaPrompt?: string;
  gptImagePrompt?: string;
};

type StoryboardSequenceExport = {
  project: string;
  duration: number;
  sceneCount: number;
  sequence: StoryboardSequenceScene[];
};

type StoryboardValidationExport = {
  project: string;
  valid: boolean;
  summary: StoryboardValidationSummary;
  sceneChecks: StoryboardValidationCheck[];
  promptChecks: StoryboardValidationCheck[];
};

type StoryboardSourceScene = {
  id: number;
  description?: string;
  subject?: string;
  action?: string;
  lighting?: string;
  environment?: string;
};

type StoryboardSource = {
  negativePrompt?: string;
  continuityRules?: string[];
  scenes?: StoryboardSourceScene[];
};

const STORYBOARD_ROOT = path.join(process.cwd(), "storyboard_system");
const EXPORTS_ROOT = path.join(STORYBOARD_ROOT, "exports");
const STORYBOARD_SOURCE_FILE = path.join(STORYBOARD_ROOT, "storyboard.json");
const STORYBOARD_SEQUENCE_FILE = path.join(EXPORTS_ROOT, "storyboard_sequence.json");
const STORYBOARD_VALIDATION_FILE = path.join(EXPORTS_ROOT, "validation_report.json");

async function readJsonFile<T>(filePath: string): Promise<T> {
  const contents = await readFile(filePath, "utf8");
  return JSON.parse(contents) as T;
}

function inferPairFromScene(scene: StoryboardSequenceScene): {
  predator: string;
  prey: string;
} {
  const text = `${scene.subject ?? ""} ${scene.action ?? ""} ${scene.imagePrompt ?? ""} ${scene.videoPrompt ?? ""}`.trim();
  const lowerText = text.toLowerCase();
  const leftMatch = /(?:a |an |the )?([a-z][a-z -]+?) on the left/.exec(lowerText);
  const rightMatch = /(?:a |an |the )?([a-z][a-z -]+?) on the right/.exec(lowerText);

  if (leftMatch && rightMatch) {
    return {
      predator: leftMatch[1].trim(),
      prey: rightMatch[1].trim(),
    };
  }

  const whileMatch = /(?:a |an |the )?([a-z][a-z -]+?) .* while (?:the |a |an )?([a-z][a-z -]+?) /.exec(
    lowerText
  );

  if (whileMatch) {
    return {
      predator: whileMatch[1].trim(),
      prey: whileMatch[2].trim(),
    };
  }

  return {
    predator: "wild predator",
    prey: "wild prey",
  };
}

export async function loadStoryboardPreviewData(): Promise<StoryboardPreviewData | null> {
  try {
    const [source, sequenceExport, validationExport] = await Promise.all([
      readJsonFile<StoryboardSource>(STORYBOARD_SOURCE_FILE),
      readJsonFile<StoryboardSequenceExport>(STORYBOARD_SEQUENCE_FILE),
      readJsonFile<StoryboardValidationExport>(STORYBOARD_VALIDATION_FILE),
    ]);

    const negativePrompt = source.negativePrompt ?? "";
    const continuityRules = source.continuityRules ?? [];
    const sourceSceneMap = new Map((source.scenes ?? []).map((scene) => [scene.id, scene] as const));
    const masterImageStrategy = getStoryboardMasterImageStrategy();

    return {
      project: sequenceExport.project,
      duration: sequenceExport.duration,
      sceneCount: sequenceExport.sceneCount,
      valid: validationExport.valid,
      sourceLabel: "Static storyboard",
      summary: validationExport.summary,
      sceneChecks: validationExport.sceneChecks,
      promptChecks: validationExport.promptChecks,
      negativePrompt,
      continuityRules,
      sequence: sequenceExport.sequence.map((scene) => {
        const sourceScene = sourceSceneMap.get(scene.id);
        const pair = inferPairFromScene(scene);
        const description = sourceScene?.description ?? scene.description ?? formatSceneName(scene.name);
        const subject = sourceScene?.subject ?? scene.subject ?? `${pair.predator} left, ${pair.prey} right`;
        const action = sourceScene?.action ?? scene.action ?? "hold readable wildlife spacing";
        const environment = sourceScene?.environment ?? scene.environment ?? "natural wildlife habitat with readable spacing";
        const lighting = sourceScene?.lighting ?? scene.lighting ?? "natural wildlife documentary light";
        const derivedPrompts = deriveMasterImagePrompts({
          predator: pair.predator,
          prey: pair.prey,
          scene: {
            camera: scene.camera,
            description,
            action,
            environment,
            lighting,
          },
          continuityRules,
          negativePrompt,
        });

        return {
          ...scene,
          displayName: formatSceneName(scene.name),
          description,
          subject,
          action,
          environment,
          lighting,
          nanoBananaPrompt: scene.nanoBananaPrompt ?? derivedPrompts.nanoBananaPrompt,
          gptImagePrompt: scene.gptImagePrompt ?? derivedPrompts.gptImagePrompt,
          negativePrompt,
          continuityRules,
        };
      }),
      ...masterImageStrategy,
    };
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      return null;
    }

    throw error;
  }
}
