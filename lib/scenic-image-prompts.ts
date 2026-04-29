export type ScenicImageRegion = "USA" | "Canada" | "USA / Canada";
export type ScenicImageAspectRatio = "9:16" | "4:5" | "1:1";
export type ScenicImageMood =
  | "Peaceful Wildlife"
  | "Epic National Park"
  | "Luxury Travel Poster"
  | "Documentary Realism";

export type ScenicImagePreset = {
  id: string;
  region: ScenicImageRegion;
  title: string;
  locationStyle: string;
  landscape: string;
  wildlife: string;
  foreground: string;
  light: string;
  season: string;
  caption: string;
  hashtags: string[];
};

export type ScenicImagePromptOptions = {
  preset: ScenicImagePreset;
  aspectRatio?: ScenicImageAspectRatio;
  mood?: ScenicImageMood;
  includeWildlife?: boolean;
  platform?: "Facebook" | "Instagram" | "Pinterest" | "General";
  customNote?: string;
};

export type ScenicImagePromptPackage = {
  title: string;
  prompt: string;
  negativePrompt: string;
  caption: string;
  hashtags: string;
  altText: string;
};

const NEGATIVE_PROMPT = [
  "text",
  "watermark",
  "logo",
  "tourist crowds",
  "buildings unless naturally distant",
  "roads unless hidden",
  "cars",
  "fences",
  "AI artifacts",
  "oversaturated HDR",
  "fake plastic grass",
  "distorted mountains",
  "distorted antlers",
  "extra limbs",
  "duplicate animals",
  "cropped wildlife",
  "muddy blur",
  "dust clouds",
  "debris spray",
  "low-detail animal faces",
].join(", ");

export const SCENIC_IMAGE_PRESETS: ScenicImagePreset[] = [
  {
    id: "grand-teton-snake-river-elk",
    region: "USA",
    title: "Grand Teton / Snake River Elk Meadow",
    locationStyle: "Grand Teton National Park inspired Wyoming mountain valley",
    landscape:
      "jagged snow-capped Teton-style peaks in the far background, winding clear river in the midground, cottonwoods, pine-aspen forest edge, lush meadow corridor",
    wildlife:
      "two natural-scale elk standing calmly near the riverbank, small but readable in frame, realistic antlers and warm brown coats",
    foreground:
      "yellow wildflowers, purple lupine, tall green grass, river stones, clean water reflections",
    light: "crisp late-spring daylight with soft side light, blue sky and large white clouds",
    season: "late spring / early summer",
    caption: "Wild peace in a Wyoming mountain valley.",
    hashtags: ["#Wyoming", "#GrandTeton", "#WildlifePhotography", "#NatureLovers", "#USA"],
  },
  {
    id: "yellowstone-lamar-bison",
    region: "USA",
    title: "Yellowstone Lamar Valley Bison Dawn",
    locationStyle: "Yellowstone Lamar Valley inspired open wildlife corridor",
    landscape:
      "wide sagebrush valley, distant blue mountain ridges, winding creek, open grassland, scattered willow patches",
    wildlife:
      "small herd of bison grazing naturally with one large bull readable in profile, grounded hooves and realistic shaggy coats",
    foreground: "dew-covered grass, sage, low wildflowers, clean creek edge",
    light: "soft golden dawn mist with gentle rim light and clear readable air",
    season: "early summer",
    caption: "Morning in America’s wild valley.",
    hashtags: ["#Yellowstone", "#Bison", "#Wildlife", "#NationalParks", "#USA"],
  },
  {
    id: "glacier-hidden-lake-goats",
    region: "USA",
    title: "Glacier Alpine Meadow Mountain Goats",
    locationStyle: "Glacier National Park inspired alpine meadow overlook",
    landscape:
      "dramatic glacial peaks, turquoise alpine lake far below, rugged cliffs, patchy snowfields, clean high-country sky",
    wildlife:
      "two mountain goats standing calmly on a safe grassy ledge, white coats detailed, natural scale, no dangerous cliff distortion",
    foreground: "alpine wildflowers, short grass, rock textures, melting snow patches",
    light: "clear cool morning light with crisp mountain contrast",
    season: "summer alpine bloom",
    caption: "High above the wild alpine silence.",
    hashtags: ["#GlacierNationalPark", "#MountainGoats", "#Alpine", "#NaturePhotography", "#USA"],
  },
  {
    id: "yosemite-valley-deer",
    region: "USA",
    title: "Yosemite Valley Deer Meadow",
    locationStyle: "Yosemite Valley inspired Sierra Nevada meadow",
    landscape:
      "towering granite cliffs, distant waterfall mist, pine forest edge, broad green valley meadow, clean mountain air",
    wildlife:
      "two mule deer grazing peacefully in the meadow, natural size, full bodies readable, realistic ears and coat markings",
    foreground: "meadow grass, small white and yellow flowers, shallow reflective stream",
    light: "warm sunset side light touching granite walls and meadow grass",
    season: "late spring",
    caption: "A quiet evening inside a granite valley.",
    hashtags: ["#Yosemite", "#California", "#Deer", "#NationalParks", "#USA"],
  },
  {
    id: "denali-caribou-tundra",
    region: "USA",
    title: "Denali Tundra Caribou Vista",
    locationStyle: "Denali National Park inspired Alaskan tundra wilderness",
    landscape:
      "massive snow-covered Denali-style peak in the far distance, rolling tundra, braided river flats, open subarctic valley",
    wildlife:
      "three caribou walking calmly across the tundra, realistic antlers, natural spacing, full bodies visible",
    foreground: "red and gold tundra plants, low shrubs, stones, clean braided stream texture",
    light: "cold clear golden-hour light with long shadows and crisp air",
    season: "early autumn",
    caption: "Alaska’s open wilderness, calm and endless.",
    hashtags: ["#Alaska", "#Denali", "#Caribou", "#Wilderness", "#USA"],
  },
  {
    id: "olympic-rainforest-roosevelt-elk",
    region: "USA",
    title: "Olympic Rainforest Roosevelt Elk",
    locationStyle: "Olympic National Park inspired temperate rainforest clearing",
    landscape:
      "mossy old-growth rainforest, fern-covered ground, cedar and spruce trunks, soft river bend behind the clearing",
    wildlife:
      "Roosevelt elk standing quietly at the forest edge, damp coat detail, realistic antlers, natural scale",
    foreground: "ferns, moss, wet stones, soft green ground cover, subtle water reflections",
    light: "soft overcast rainforest light with gentle mist and no harsh contrast",
    season: "rainy spring",
    caption: "Deep green silence in the Pacific Northwest.",
    hashtags: ["#OlympicNationalPark", "#RooseveltElk", "#PNW", "#Rainforest", "#USA"],
  },
  {
    id: "banff-moraine-lake-deer",
    region: "Canada",
    title: "Banff Moraine Lake Deer Shoreline",
    locationStyle: "Banff National Park inspired Canadian Rockies turquoise lake",
    landscape:
      "turquoise glacial lake, towering Canadian Rockies peaks, dark evergreen forest, rocky shoreline, clean alpine air",
    wildlife:
      "two mule deer near the shoreline, calm posture, natural scale, full bodies readable without dominating the landscape",
    foreground: "smooth lake stones, wildflowers, bright green shoreline grass, clear water edge",
    light: "clean morning light with soft mountain reflections on the lake",
    season: "summer",
    caption: "Canadian Rockies calm beside turquoise water.",
    hashtags: ["#Banff", "#CanadianRockies", "#Wildlife", "#Canada", "#Nature"],
  },
  {
    id: "jasper-maligne-moose",
    region: "Canada",
    title: "Jasper Maligne Lake Moose Morning",
    locationStyle: "Jasper National Park inspired Maligne Lake wilderness",
    landscape:
      "long blue alpine lake, forested slopes, snow-dusted peaks, quiet shoreline cove, clean cold air",
    wildlife:
      "one moose standing in shallow water near the reeds, natural scale, realistic long legs and broad muzzle",
    foreground: "reeds, lake stones, clear shallow water, small purple wildflowers",
    light: "soft cool dawn light with subtle mist over the lake",
    season: "early summer",
    caption: "A quiet moose morning in the Canadian Rockies.",
    hashtags: ["#Jasper", "#Moose", "#CanadianRockies", "#WildlifePhotography", "#Canada"],
  },
  {
    id: "lake-louise-bighorn-sheep",
    region: "Canada",
    title: "Lake Louise Bighorn Sheep Alpine Frame",
    locationStyle: "Lake Louise inspired Canadian Rockies overlook",
    landscape:
      "emerald glacial lake, glacier-touched peaks, evergreen slopes, clean rocky overlook, dramatic alpine depth",
    wildlife:
      "two bighorn sheep standing calmly on a safe rocky foreground slope, realistic horns, grounded hooves",
    foreground: "alpine rocks, low flowers, short grass, lake viewpoint textures",
    light: "late afternoon mountain light with clean rim on horns and rocks",
    season: "summer",
    caption: "Rocky Mountain stillness above emerald water.",
    hashtags: ["#LakeLouise", "#BighornSheep", "#Banff", "#Canada", "#Wildlife"],
  },
  {
    id: "rocky-mountain-elk-aspen",
    region: "USA",
    title: "Rocky Mountain Elk Aspen Valley",
    locationStyle: "Rocky Mountain National Park inspired aspen valley",
    landscape:
      "golden aspen grove, distant snow-streaked peaks, open meadow, small clear stream, pine forest edge",
    wildlife:
      "a bull elk and two cows standing peacefully in the meadow, natural scale, antlers clean and symmetrical",
    foreground: "autumn grass, yellow aspen leaves, stream stones, clean meadow texture",
    light: "warm autumn golden hour with long shadows and crisp air",
    season: "fall rut season, peaceful non-fighting moment",
    caption: "Autumn gold in the Rocky Mountains.",
    hashtags: ["#RockyMountainNationalPark", "#Elk", "#Colorado", "#Autumn", "#USA"],
  },
  {
    id: "pacific-northwest-cascade-black-bear",
    region: "USA / Canada",
    title: "Pacific Northwest Cascade Black Bear Meadow",
    locationStyle: "Pacific Northwest Cascade Range inspired mountain meadow",
    landscape:
      "snowy volcanic-style peak in the far background, evergreen forest, bright meadow, small mountain creek",
    wildlife:
      "one black bear foraging calmly at a safe distance, natural scale, detailed fur, non-aggressive posture",
    foreground: "summer wildflowers, green meadow grass, creek stones, clean water highlights",
    light: "soft golden evening backlight with clear mountain air",
    season: "summer",
    caption: "A calm bear moment under the Cascades.",
    hashtags: ["#PacificNorthwest", "#BlackBear", "#Cascades", "#Wildlife", "#Nature"],
  },
  {
    id: "zions-canyon-bighorn",
    region: "USA",
    title: "Zion Canyon Desert Bighorn",
    locationStyle: "Zion National Park inspired red-rock canyon wash",
    landscape:
      "towering red sandstone canyon walls, cottonwood pockets, shallow desert creek, warm rock layers",
    wildlife:
      "desert bighorn sheep standing calmly on the canyon wash edge, realistic horns and hooves, natural scale",
    foreground: "sandstone stones, desert grasses, small yellow flowers, clear shallow water",
    light: "warm late afternoon canyon light with soft reflected glow",
    season: "spring desert bloom",
    caption: "Red-rock silence with wild desert life.",
    hashtags: ["#ZionNationalPark", "#BighornSheep", "#Utah", "#DesertWildlife", "#USA"],
  },
];

function moodLine(mood: ScenicImageMood): string {
  switch (mood) {
    case "Luxury Travel Poster":
      return "premium travel-poster realism, polished but natural, rich detail, clean social-media composition";
    case "Epic National Park":
      return "epic national park landscape realism, grand scale, deep scenic layers, majestic but believable";
    case "Documentary Realism":
      return "true wildlife documentary still, restrained color, natural field optics, realistic animal scale";
    case "Peaceful Wildlife":
    default:
      return "peaceful wildlife landscape realism, calm natural behavior, postcard-safe composition";
  }
}

function aspectLine(aspectRatio: ScenicImageAspectRatio): string {
  switch (aspectRatio) {
    case "4:5":
      return "4:5 vertical social feed framing";
    case "1:1":
      return "1:1 square social post framing";
    case "9:16":
    default:
      return "9:16 vertical mobile-first framing";
  }
}

export function buildScenicImagePromptPackage({
  preset,
  aspectRatio = "9:16",
  mood = "Peaceful Wildlife",
  includeWildlife = true,
  platform = "Facebook",
  customNote = "",
}: ScenicImagePromptOptions): ScenicImagePromptPackage {
  const wildlifeLine = includeWildlife
    ? `Wildlife: ${preset.wildlife}. Keep wildlife peaceful, naturally small-to-medium in frame, fully readable, and correctly scaled to the landscape.`
    : "No prominent wildlife subject; focus on a pure scenic national park landscape with natural habitat detail.";

  const platformLine =
    platform === "Facebook"
      ? "Leave clean negative space near the upper third for Facebook preview cropping, but do not add text."
      : platform === "Instagram"
        ? "Center the strongest scenic subject for Instagram feed readability, but do not add text."
        : platform === "Pinterest"
          ? "Use tall poster-like composition with strong foreground-to-background depth, but do not add text."
          : "Keep a clean general social-media composition with no text.";

  const prompt = [
    `Photorealistic ${preset.locationStyle}, ${aspectLine(aspectRatio)}.`,
    `Landscape: ${preset.landscape}.`,
    `Foreground: ${preset.foreground}.`,
    wildlifeLine,
    `Light and atmosphere: ${preset.light}, ${preset.season}, clean air, realistic shadows, natural color, no artificial HDR.`,
    `Style: ${moodLine(mood)}, crisp mountain or habitat detail, realistic water, believable vegetation, natural depth of field, sharp foreground texture, readable midground, detailed background.`,
    platformLine,
    customNote.trim() ? `Extra direction: ${customNote.trim()}.` : "",
    "No chase, no fight, no predator-prey confrontation, no cinematic violence, no dust, no debris spray, no text, no watermark.",
  ]
    .filter(Boolean)
    .join(" ");

  const altText = includeWildlife
    ? `${preset.title}: ${preset.locationStyle} with ${preset.wildlife.toLowerCase()}.`
    : `${preset.title}: ${preset.locationStyle} scenic landscape.`;

  return {
    title: preset.title,
    prompt,
    negativePrompt: NEGATIVE_PROMPT,
    caption: preset.caption,
    hashtags: preset.hashtags.join(" "),
    altText,
  };
}

export function getScenicPresetById(id: string): ScenicImagePreset {
  return SCENIC_IMAGE_PRESETS.find((preset) => preset.id === id) ?? SCENIC_IMAGE_PRESETS[0];
}
