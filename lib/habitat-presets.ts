import type { HabitatPreset } from "@/types";

export const habitatPromptMap: Record<Exclude<HabitatPreset, "Auto">, string> = {
  "Open Green Grassland":
    "open green grassland with lush natural grass, scattered low shrubs, thin thorny bushes, lightly uneven ground, clean wildlife field depth",

  "Dry Savanna Plain":
    "dry savanna plain with tawny grass, scattered low shrubs, dusty open field depth, authentic wildlife terrain",

  "Marsh Wetland":
    "marsh wetland with reeds, shallow reflective water, muddy banks, swamp vegetation, humid natural atmosphere",

  "Riverbank Reeds":
    "riverbank with tall reeds, muddy edge, fresh vegetation, open natural waterline habitat",

  "Forest Clearing":
    "forest clearing with natural grass patches, broken light through trees, open wildlife corridor, realistic undergrowth",

  "Dense Jungle Edge":
    "dense jungle edge with layered foliage, tangled brush, humid ground cover, realistic tropical habitat depth",

  "Rocky Mountain Meadow":
    "rocky mountain meadow with alpine grass, scattered stones, distant ridgeline feel, open highland habitat",

  "Snow Field Tundra":
    "snow field tundra with icy ground, sparse frozen brush, open cold-air depth, realistic arctic habitat",

  "Desert Scrubland":
    "desert scrubland with dry brush, sandy soil, scattered rocks, open harsh terrain",

  "Coastal Cliffline":
    "coastal cliffline with rugged grass, wind-shaped shrubs, ocean-edge terrain, natural rocky coastal habitat",
};
