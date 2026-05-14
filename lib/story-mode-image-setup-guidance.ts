import { StoryMode } from "@/types";

export const STORY_MODE_IMAGE_SETUP_GUIDANCE: Partial<Record<StoryMode, string>> = {
  [StoryMode.HERD_DEFENSE]:
    "Master image needs a readable herd formation, clear threat-animal spacing, group scale, an open defensive lane, and no chaotic crowding.",
  [StoryMode.MOTHER_BABY]:
    "Master image needs a dominant protective mother, sheltered visible offspring, distant or optional threat pressure, emotional safety, and no graphic conflict.",
  [StoryMode.RIVAL_CLASH]:
    "Master image needs two similar rivals facing off, balanced scale, readable antlers, horns, or shoulders, rut-season pressure when enabled, and no injury.",
  [StoryMode.NEAR_MISS]:
    "Master image needs escape animal and threat animal both readable, one clear escape lane, near-contact tension without impact, and a strong first-frame hook.",
  [StoryMode.FISHING_STRIKE]:
    "Master image needs the strike animal, fish or waterline target, readable splash or river surface, clean strike direction, and no graphic fish injury.",
  [StoryMode.WEATHER_SURVIVAL]:
    "Master image needs weather or terrain hazard as the antagonist, subject animal readability, visible survival conditions, and no predator requirement.",
  [StoryMode.MIGRATION]:
    "Master image needs group movement scale, visible crossing obstacle, readable lead animals, route compression pressure, and clean depth.",
  [StoryMode.SCAVENGER_CONFLICT]:
    "Master image needs a mostly obscured non-graphic food claim zone, owner/challenger spacing, a readable claim boundary, and no carcass detail or blood.",
};

export function getStoryModeImageSetupGuidance(storyMode: StoryMode) {
  return STORY_MODE_IMAGE_SETUP_GUIDANCE[storyMode];
}
