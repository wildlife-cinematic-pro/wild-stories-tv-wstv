import type { HabitatPreset } from "@/types";

export const habitatPromptMap: Record<Exclude<HabitatPreset, "Auto">, string> = {
    "Open Green Grassland":
    "North American open meadow and prairie grassland with mixed native grass, low brush pockets, lightly uneven ground, clean wildlife field depth, realistic travel lanes, natural U.S. open-country habitat",

  "Dry Savanna Plain":
    "dry savanna plain with tawny grass, scattered low shrubs, dusty open field depth, authentic wildlife terrain",

    "Marsh Wetland":
    "North American marsh wetland with reeds, shallow reflective water, muddy banks, cattails, swamp vegetation, humid air, grounded shoreline detail, realistic ambush and crossing habitat",

    "Riverbank Reeds":
    "North American riverbank with tall reeds, muddy edge, shallow waterline, trampled grass, fresh riparian vegetation, realistic wildlife approach path, wet soil and grounded shoreline detail",

    "Forest Clearing":
    "North American forest clearing with patchy grass, brush edge, broken light through pines or hardwoods, open wildlife corridor, realistic undergrowth, dirt, leaves, and uneven natural footing",

  "Dense Jungle Edge":
    "dense jungle edge with layered foliage, tangled brush, humid ground cover, realistic tropical habitat depth",

    "Rocky Mountain Meadow":
    "Rocky Mountain meadow with native grass, sage patches, scattered stones, dry uneven ground, pine treeline or ridgeline in the distance, open U.S. high-country habitat, realistic wildlife travel corridor",

    "Snow Field Tundra":
    "North American snow field and tundra with icy ground, sparse frozen brush, wind-shaped snow, open cold-air depth, realistic winter wildlife habitat, strong footing and exposure detail",

    "Desert Scrubland":
    "North American desert scrubland with dry brush, sandy soil, scattered rocks, cactus-free open harsh terrain, realistic Southwest wildlife footing, heat-baked ground and sparse cover",

  "Coastal Cliffline":
    "coastal cliffline with rugged grass, wind-shaped shrubs, ocean-edge terrain, natural rocky coastal habitat",
};
