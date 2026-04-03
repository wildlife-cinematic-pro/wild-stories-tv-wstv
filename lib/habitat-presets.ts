import type { HabitatPreset } from "@/types";

export const habitatPromptMap: Record<Exclude<HabitatPreset, "Auto">, string> = {
  "Rocky Mountain Meadow":
    "Rocky Mountain meadow in the American West with native bunchgrass, sagebrush patches, scattered stones, dry uneven ground, pine or aspen treeline, a distant ridgeline, open high-country habitat, realistic elk, wolf, and mountain-lion travel corridor, and clean long-range visibility",

  "Open Prairie Grassland":
    "North American open prairie grassland with mixed shortgrass and tallgrass, low sage or brush pockets, lightly uneven ground, clean wildlife field depth, realistic bison, coyote, and wolf travel lanes, natural open-country habitat, and strong full-body visibility",

  "Forest Clearing":
    "North American pine-hardwood forest clearing with patchy grass, brush edge, broken light through pines, oaks, or aspens, open wildlife corridor, realistic undergrowth, leaf litter, dirt, uneven natural footing, and clear subject visibility",

  "Riverbank Reeds":
    "North American riverbank with tall reeds, muddy edge, shallow waterline, trampled grass, cattails, willow or cottonwood edge, realistic wildlife approach path, wet soil, grounded shoreline detail, and a clean predator-to-prey movement lane",

  "Cypress Swamp Edge":
    "Southern U.S. cypress swamp edge with dark tannin-water margins, cypress knees, hanging moss, muddy ground, reeds, swamp brush, shaded ambush cover, realistic alligator, boar, and deer wetland transition terrain, with enough open space for readable predator-to-prey interaction",

  "Everglades Marsh":
    "South Florida Everglades marsh with sawgrass, shallow reflective water, muddy banks, swamp vegetation, low wetland islands, grounded shoreline detail, realistic alligator ambush and crossing habitat, and a readable water-edge tension zone",

  "Snow Field Tundra":
    "North American snow field and subarctic tundra with icy ground, sparse frozen brush, wind-shaped snow, open cold-air depth, realistic winter wildlife habitat, strong footing detail, exposed terrain, and clean long-range readability",

  "Dry Prairie Plain":
    "North American dry prairie and sagebrush plain with tawny grass, scattered sagebrush, dusty open field depth, realistic Great Plains or high-desert wildlife terrain, open movement lanes, sun-baked uneven ground, strong tension visibility",

  "Desert Scrubland":
    "North American desert scrubland with dry brush, sandy soil, scattered rocks, creosote or sagebrush cover, open harsh terrain, realistic Southwest wildlife footing, heat-baked ground, sparse concealment, and clean silhouette separation",

  "Coastal Cliffline":
    "North American coastal cliffline with rugged grass, wind-shaped shrubs, rocky ocean-edge terrain, seabird-worn ledges, cold salt-air exposure, realistic Pacific Northwest or Alaskan wildlife habitat, and steep readable terrain separation",
};