import { StoryMode } from "@/types";

export const STORY_MODE_OPTIONS: Array<{
  value: StoryMode;
  icon: string;
  label: string;
  example: string;
}> = [
  {
    value: StoryMode.PREDATOR_VS_PREY,
    icon: "P/P",
    label: "Predator vs Prey",
    example: "Mountain Lion vs Mule Deer",
  },
  {
    value: StoryMode.HERD_DEFENSE,
    icon: "HD",
    label: "Herd Defense",
    example: "Bison Herd vs Wolf Pack",
  },
  {
    value: StoryMode.MOTHER_BABY,
    icon: "MB",
    label: "Mother & Baby",
    example: "Grizzly Mother Protects Cubs",
  },
  {
    value: StoryMode.RIVAL_CLASH,
    icon: "RC",
    label: "Rival Clash",
    example: "Bull Elk Rut Standoff",
  },
  {
    value: StoryMode.NEAR_MISS,
    icon: "NM",
    label: "Near-Miss Escape",
    example: "Deer Last-Second Brush Escape",
  },
  {
    value: StoryMode.FISHING_STRIKE,
    icon: "FS",
    label: "Fishing Strike",
    example: "Bald Eagle River Strike",
  },
  {
    value: StoryMode.WEATHER_SURVIVAL,
    icon: "WS",
    label: "Weather Survival",
    example: "Yellowstone Bison Blizzard",
  },
  {
    value: StoryMode.MIGRATION,
    icon: "MG",
    label: "Migration Crossing",
    example: "Elk Herd Migration Lane",
  },
  {
    value: StoryMode.SCAVENGER_CONFLICT,
    icon: "SC",
    label: "Scavenger Conflict",
    example: "Bald Eagle vs Coyote Claim",
  },
];

export function getStoryModeLabel(value: StoryMode) {
  return (
    STORY_MODE_OPTIONS.find((option) => option.value === value)?.label ??
    "Predator vs Prey"
  );
}
