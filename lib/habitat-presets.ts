import type { HabitatPreset } from "@/types";

export const habitatPromptMap: Record<Exclude<HabitatPreset, "Auto">, string> = {
  "Rocky Mountain Meadow":
    "Rocky Mountain meadow in the American West, native grass, sage patches, scattered stones, dry uneven ground, pine treeline or ridgeline in the distance, open high-country habitat, realistic wildlife travel corridor, clean long-range visibility",

  "Riverbank Reeds":
    "North American riverbank with tall reeds, muddy edge, shallow waterline, trampled grass, riparian vegetation, realistic wildlife approach path, wet soil, grounded shoreline detail, clean predator-to-prey movement lane",

  "Forest Clearing":
    "North American forest clearing with patchy grass, brush edge, broken light through pines or hardwoods, open wildlife corridor, realistic undergrowth, dirt, leaves, uneven natural footing, clear subject visibility",

  "Snow Field Tundra":
    "North American snow field and tundra with icy ground, sparse frozen brush, wind-shaped snow, open cold-air depth, realistic winter wildlife habitat, strong footing detail, exposed terrain, clean long-range readability",

  "Open Green Grassland":
    "North American open meadow and prairie grassland with mixed native grass, low brush pockets, lightly uneven ground, clean wildlife field depth, realistic travel lanes, natural open-country habitat, strong full-body visibility",

  "Marsh Wetland":
    "North American marsh wetland with reeds, shallow reflective water, muddy banks, cattails, swamp vegetation, grounded shoreline detail, realistic ambush and crossing habitat, readable water-edge tension zone",

  "Coastal Cliffline":
    "North American coastal cliffline with rugged grass, wind-shaped shrubs, rocky ocean-edge terrain, seabird-worn ledges, cold salt-air exposure, realistic Pacific or Atlantic wildlife habitat, steep readable terrain separation",

  "Dry Savanna Plain":
    "North American dry prairie and sage plain with tawny grass, scattered low shrubs, dusty open field depth, realistic dry-country wildlife terrain, open movement lanes, sun-baked uneven ground, strong tension visibility",

  "Dense Jungle Edge":
    "Dense jungle edge with layered foliage, tangled cover, shadowed ground, realistic habitat depth, hidden approach lanes, strong concealment for ambush setups, but still enough open space for readable animal interaction",

  "Desert Scrubland":
    "North American desert scrubland with dry brush, sandy soil, scattered rocks, open harsh terrain, realistic Southwest wildlife footing, heat-baked ground, sparse cover, clean silhouette separation",
};