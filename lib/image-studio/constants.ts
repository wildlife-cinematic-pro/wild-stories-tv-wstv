import type {
  ScenicImageAspectRatio,
  ScenicImageMood,
  ScenicWildlifeOverride,
} from "@/lib/scenic-image-prompts";

export const ASPECT_RATIOS: ScenicImageAspectRatio[] = ["9:16", "4:5", "1:1"];

export const MOODS: ScenicImageMood[] = [
  "Peaceful Wildlife",
  "Epic National Park",
  "Luxury Travel Poster",
  "Documentary Realism",
  "Facebook Viral Nature Post",
  "Wallpaper / Lock Screen",
  "Thumbnail-safe Scenic Photo",
];

export const BASE_WILDLIFE_OPTIONS: ScenicWildlifeOverride[] = [
  "Default preset wildlife",
  "Elk",
  "Mule Deer",
  "White-tailed Deer",
  "Bison",
  "Moose",
  "Mountain Goat",
  "Bighorn Sheep",
  "Black Bear",
  "Grizzly Bear",
  "Caribou",
  "Bald Eagle",
  "Great Blue Heron",
  "Alligator",
  "No wildlife / landscape only",
];

export const WORLD_WILDLIFE_OPTIONS = [
  "Ezo Red Fox",
  "Red-crowned Crane",
  "Japanese Macaque",
  "Yakushima Deer",
  "Alpine Ibex",
  "Chamois",
  "Musk Ox",
  "Reindeer",
  "Puffin",
  "Kea",
  "Kangaroo",
  "Penguin",
  "Polar Bear",
  "Sea Eagle",
] as const;

export const SEASON_OPTIONS = [
  "Default",
  "Spring",
  "Summer",
  "Autumn",
  "Winter",
  "Snow",
  "Wildflower bloom",
  "Golden fall",
] as const;

export const LIGHT_OPTIONS = [
  "Default",
  "Sunrise",
  "Golden hour",
  "Blue hour",
  "Overcast",
  "Storm clearing",
  "Snowy soft light",
  "Aurora night",
] as const;

export const CAPTION_STYLES = [
  "Short Viral",
  "Peaceful Nature",
  "Travel Page",
  "Question Hook",
  "Educational",
] as const;

export const PROMPT_STRENGTHS = ["Balanced", "Short", "Detailed", "Ultra Detailed"] as const;

export const COUNTRY_FILTERS = ["All", "USA", "Canada", "Japan", "Europe", "World"] as const;

export const CAMERA_LOOKS = [
  "24mm wide landscape",
  "35mm documentary",
  "70mm scenic compression",
  "100-400mm wildlife telephoto",
  "Drone-like high scenic angle",
  "Low waterline angle",
] as const;

export const NEGATIVE_MODES = [
  "Clean Short",
  "Wildlife Anatomy",
  "Landscape Realism",
  "Strict Social Safe",
] as const;

export const HASHTAG_MODES = [
  "USA Viral",
  "Travel",
  "Wildlife Photography",
  "National Parks",
  "Minimal 5",
] as const;

export const COPY_RESET_MS = 1400;

export const IMAGE_STUDIO_FEATURE_BADGES = [
  "Nano Banana 2",
  "GPT Image 2",
  "USA Viral Captions",
  "5-Post Pack",
] as const;

export const IMAGE_STUDIO_WORKSPACE_ITEMS = [
  {
    id: "location",
    label: "Location",
    icon: "⌂",
    detail: "Country, collection, and preset selection",
    badge: "Start",
  },
  {
    id: "style",
    label: "Style",
    icon: "✦",
    detail: "Aspect ratio, mood, and prompt strength",
    badge: "Look",
  },
  {
    id: "wildlife",
    label: "Wildlife",
    icon: "♞",
    detail: "Override the featured animal safely",
    badge: "Subject",
  },
  {
    id: "camera",
    label: "Camera",
    icon: "◉",
    detail: "Lens feel and composition bias",
    badge: "Framing",
  },
  {
    id: "season-light",
    label: "Season & Light",
    icon: "☼",
    detail: "Season, hour, and atmosphere",
    badge: "Mood",
  },
  {
    id: "caption",
    label: "Caption",
    icon: "✎",
    detail: "American English copy and 5-tag output",
    badge: "Social",
  },
  {
    id: "random",
    label: "Random",
    icon: "↺",
    detail: "Quick preset jumps by region or viral bias",
    badge: "Fast",
  },
  {
    id: "outputs",
    label: "Outputs",
    icon: "▧",
    detail: "Core image prompts and negative prompt",
    badge: "Core",
  },
  {
    id: "variations",
    label: "Variations",
    icon: "⋯",
    detail: "Three alternate prompt directions",
    badge: "3x",
  },
  {
    id: "five-post-pack",
    label: "5-Post Pack",
    icon: "☰",
    detail: "Ready-made Facebook batch planning copy",
    badge: "Batch",
  },
  {
    id: "quality",
    label: "Quality",
    icon: "✓",
    detail: "Checklist for prompt clarity and safety",
    badge: "QA",
  },
  {
    id: "alt-text",
    label: "Alt Text",
    icon: "⌥",
    detail: "Accessible post description output",
    badge: "A11y",
  },
] as const;
