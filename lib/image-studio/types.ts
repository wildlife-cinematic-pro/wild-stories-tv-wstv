import type {
  ScenicImageAspectRatio,
  ScenicImageMood,
  ScenicWildlifeOverride,
} from "@/lib/scenic-image-prompts";
import type {
  ExpandedScenicImagePreset,
  ScenicCollection,
} from "@/lib/scenic-expanded-presets";

import type {
  CAMERA_LOOKS,
  CAPTION_STYLES,
  COUNTRY_FILTERS,
  HASHTAG_MODES,
  IMAGE_STUDIO_WORKSPACE_ITEMS,
  LIGHT_OPTIONS,
  NEGATIVE_MODES,
  PROMPT_STRENGTHS,
  SEASON_OPTIONS,
  WORLD_WILDLIFE_OPTIONS,
} from "@/lib/image-studio/constants";

export type CopyKey =
  | "nano"
  | "gpt"
  | "negative"
  | "caption"
  | "alt"
  | "all"
  | "variations"
  | "batch"
  | "quality"
  | "hashtags"
  | null;

export type CollectionFilter = ScenicCollection | "All";
export type CountryFilter = (typeof COUNTRY_FILTERS)[number];
export type ExtendedWildlifeOverride =
  | ScenicWildlifeOverride
  | (typeof WORLD_WILDLIFE_OPTIONS)[number];
export type SeasonOverride = (typeof SEASON_OPTIONS)[number];
export type LightOverride = (typeof LIGHT_OPTIONS)[number];
export type CaptionStyle = (typeof CAPTION_STYLES)[number];
export type PromptStrength = (typeof PROMPT_STRENGTHS)[number];
export type CameraLook = (typeof CAMERA_LOOKS)[number];
export type NegativeMode = (typeof NEGATIVE_MODES)[number];
export type HashtagMode = (typeof HASHTAG_MODES)[number];
export type ImageStudioWorkspaceSection = (typeof IMAGE_STUDIO_WORKSPACE_ITEMS)[number]["id"];

export type ImageStudioControlsValue = {
  selectedPresetId: string;
  collectionFilter: CollectionFilter;
  countryFilter: CountryFilter;
  aspectRatio: ScenicImageAspectRatio;
  mood: ScenicImageMood;
  wildlifeOverride: ExtendedWildlifeOverride;
  seasonOverride: SeasonOverride;
  lightOverride: LightOverride;
  captionStyle: CaptionStyle;
  promptStrength: PromptStrength;
  cameraLook: CameraLook;
  negativeMode: NegativeMode;
  hashtagMode: HashtagMode;
  customNote: string;
};

export type ImageStudioOutputsValue = {
  nanoPrompt: string;
  gptPrompt: string;
  negativePrompt: string;
  facebookCaption: string;
  facebookCaptionWithHashtags: string;
  variationPrompts: string;
  fivePostPack: string;
  qualityChecklist: string;
  altText: string;
  copyAll: string;
  usaHashtags: string;
};

export type ImageStudioDerivedPackage = {
  filteredPresets: ExpandedScenicImagePreset[];
  selectedPreset: ExpandedScenicImagePreset;
  effectiveWildlife: string;
  structuredPrompt: string;
  nanoPrompt: string;
  gptPrompt: string;
  negativePrompt: string;
  usaHashtags: string;
  facebookCaption: string;
  facebookCaptionWithHashtags: string;
  qualityChecklist: string;
  variationPrompts: string;
  fivePostPack: string;
  copyAll: string;
  altText: string;
};
