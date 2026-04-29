import { readFile } from "node:fs/promises";
import path from "node:path";

export type StoryboardSequenceScene = {
  id: number;
  name: string;
  startTime: number;
  duration: number;
  camera: string;
  motion: string;
  finalShotReference: string | null;
  previewImage: string | null;
  previewVideo: string | null;
  promptReference: string;
  runwayPromptReference: string;
  klingPromptReference: string;
  imagePrompt: string;
  videoPrompt: string;
  runwayPrompt: string;
  klingPrompt: string;
};

type StoryboardSequenceExport = {
  project: string;
  duration: number;
  sceneCount: number;
  sequence: StoryboardSequenceScene[];
};

export type StoryboardValidationSummary = {
  sceneCount: number;
  promptCount: number;
  validScenes: number;
  validPrompts: number;
};

export type StoryboardSceneCheck = {
  sceneId: number;
  sceneName: string;
  valid: boolean;
  errors?: string[];
};

export type StoryboardPromptCheck = {
  sceneId: number;
  sceneName: string;
  promptType?: string;
  valid: boolean;
  failedChecks?: string[];
};

type StoryboardValidationExport = {
  project: string;
  valid: boolean;
  summary: StoryboardValidationSummary;
  sceneChecks: StoryboardSceneCheck[];
  promptChecks: StoryboardPromptCheck[];
};

type StoryboardSource = {
  negativePrompt?: string;
  continuityRules?: string[];
};

export type StoryboardPreviewScene = StoryboardSequenceScene & {
  displayName: string;
  negativePrompt: string;
  continuityRules: string[];
};

export type StoryboardPreviewData = {
  mode: "static" | "build";
  sourceLabel: "Static storyboard" | "Generated from current Build setup";
  project: string;
  duration: number;
  sceneCount: number;
  valid: boolean;
  summary: StoryboardValidationSummary;
  sceneChecks: StoryboardSceneCheck[];
  promptChecks: StoryboardPromptCheck[];
  sequence: StoryboardPreviewScene[];
  exportData?: unknown;
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

export function formatStoryboardSceneName(name: string): string {
  return name
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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

    return {
      mode: "static",
      sourceLabel: "Static storyboard",
      project: sequenceExport.project,
      duration: sequenceExport.duration,
      sceneCount: sequenceExport.sceneCount,
      valid: validationExport.valid,
      summary: validationExport.summary,
      sceneChecks: validationExport.sceneChecks,
      promptChecks: validationExport.promptChecks,
      sequence: sequenceExport.sequence.map((scene) => ({
        ...scene,
        displayName: formatStoryboardSceneName(scene.name),
        negativePrompt,
        continuityRules,
      })),
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
