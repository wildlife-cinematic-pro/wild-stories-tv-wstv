export type ScenicImageRegion = "USA" | "Canada" | "USA / Canada";
export type ScenicImageAspectRatio = "9:16" | "4:5" | "1:1";
export type ScenicImageMood =
  | "Peaceful Wildlife"
  | "Epic National Park"
  | "Luxury Travel Poster"
  | "Documentary Realism"
  | "Facebook Viral Nature Post"
  | "Wallpaper / Lock Screen"
  | "Thumbnail-safe Scenic Photo";

export type ScenicWildlifeOverride =
  | "Default preset wildlife"
  | "Elk"
  | "Mule Deer"
  | "White-tailed Deer"
  | "Bison"
  | "Moose"
  | "Mountain Goat"
  | "Bighorn Sheep"
  | "Black Bear"
  | "Grizzly Bear"
  | "Caribou"
  | "Bald Eagle"
  | "Great Blue Heron"
  | "Alligator"
  | "No wildlife / landscape only";

export type ScenicImagePreset = {
  id: string;
  region: ScenicImageRegion;
  country: "USA" | "Canada" | "USA / Canada";
  stateOrProvince: string;
  parkName: string;
  title: string;
  landmarkStyle: string;
  locationStyle: string;
  compositionSignature: string;
  background: string;
  midground: string;
  foreground: string;
  defaultWildlife: ScenicWildlifeOverride;
  wildlifeBehavior: string;
  bestSeason: string;
  bestLight: string;
  cameraLook: string;
  realismLocks: string;
  avoidTerms: string;
  caption: string;
  hashtags: string[];
  viralScore: number;
};

export type ScenicImagePromptOptions = {
  preset: ScenicImagePreset;
  aspectRatio?: ScenicImageAspectRatio;
  mood?: ScenicImageMood;
  wildlifeOverride?: ScenicWildlifeOverride;
  customNote?: string;
};

export type ScenicImagePromptPackage = {
  title: string;
  prompt: string;
  negativePrompt: string;
  caption: string;
  hashtags: string;
  hashtagList: string[];
  altText: string;
  copyAll: string;
};

const GLOBAL_NEGATIVE_TERMS = [
  "text",
  "caption text",
  "watermark",
  "logo",
  "signature",
  "tourists",
  "people",
  "cars",
  "roads",
  "parking lots",
  "fences",
  "power lines",
  "buildings",
  "fake HDR",
  "oversaturated color",
  "AI artifacts",
  "plastic vegetation",
  "distorted mountains",
  "wrong animal anatomy",
  "extra legs",
  "extra antlers",
  "deformed horns",
  "duplicate wildlife",
  "cropped animal body",
  "muddy blur",
  "dust clouds",
  "debris spray",
  "predator-prey attack",
  "blood",
  "violence",
  "hunting scene",
].join(", ");

const WILDLIFE_DETAILS: Record<ScenicWildlifeOverride, string> = {
  "Default preset wildlife": "",
  Elk: "elk with realistic tan-brown coats, clean shoulder anatomy, natural leg proportions, accurate antlers when male, calm grazing or standing behavior",
  "Mule Deer": "mule deer with large ears, natural gray-brown coat, slim legs, realistic face detail, calm meadow or shoreline behavior",
  "White-tailed Deer": "white-tailed deer with warm brown coat, white throat and tail underside, delicate legs, realistic ears and alert peaceful stance",
  Bison: "American bison with massive shoulders, shaggy dark mane, grounded hooves, natural herd spacing, calm grazing behavior",
  Moose: "moose with long legs, dark chocolate coat, broad muzzle, dewlap, realistic palmate antlers if male, calm shallow-water or willow-edge behavior",
  "Mountain Goat": "mountain goats with white coats, black horns, sure-footed stance on safe alpine rock or meadow ledge, no impossible cliff pose",
  "Bighorn Sheep": "bighorn sheep with tan coat, white rump patch, realistic curled horns, grounded hooves on rocky terrain, calm non-fighting behavior",
  "Black Bear": "black bear with glossy dark fur, tan muzzle, rounded ears, compact body, peaceful foraging posture at safe distance",
  "Grizzly Bear": "grizzly bear with shoulder hump, silver-tipped brown fur, dish-shaped facial profile, calm foraging or distant walking behavior, non-aggressive",
  Caribou: "caribou with layered brown coat, pale neck, accurate antlers, natural tundra walking posture, clean hoof contact",
  "Bald Eagle": "bald eagle with white head and tail, dark body, yellow beak, perched on a snag or flying calmly over water with realistic wing anatomy",
  "Great Blue Heron": "great blue heron with long legs, blue-gray feathers, spear-like bill, calm wetland wading posture and accurate neck curve",
  Alligator: "American alligator partly visible in shallow wetland water, realistic armored back, calm non-threatening behavior, correct scale",
  "No wildlife / landscape only": "",
};

export const SCENIC_IMAGE_PRESETS: ScenicImagePreset[] = [
  {
    id: "grand-teton-schwabacher-elk",
    region: "USA",
    country: "USA",
    stateOrProvince: "Wyoming",
    parkName: "Grand Teton National Park",
    title: "Grand Teton / Snake River Elk Meadow",
    landmarkStyle: "Schwabacher Landing and Snake River meadow inspired viewpoint",
    locationStyle: "Grand Teton National Park inspired Wyoming mountain valley, not a copy of any real photograph",
    compositionSignature: "vertical foreground wildflowers, winding river in the lower third, elk in the midground, jagged Teton-style peaks dominating the background",
    background: "jagged snow-capped Teton-style granite peaks, dark pine-aspen foothills, large white cumulus clouds against clean blue sky",
    midground: "clear winding river, cottonwoods, willow pockets, lush green meadow corridor, calm elk near the riverbank",
    foreground: "yellow balsamroot wildflowers, purple lupine, tall green grass, smooth river stones, clean water highlights",
    defaultWildlife: "Elk",
    wildlifeBehavior: "two elk standing calmly near the riverbank, small-to-medium in frame, natural spacing, realistic antlers and coats",
    bestSeason: "late spring / early summer wildflower bloom",
    bestLight: "crisp morning or late-day side light with clean mountain contrast",
    cameraLook: "professional national park landscape photography, wide-angle vertical, deep scenic depth, sharp foreground and detailed mountains",
    realismLocks: "correct elk scale, believable river flow, accurate alpine meadow vegetation, natural color, no fake HDR",
    avoidTerms: "no tourists, no road, no buildings, no cropped antlers, no duplicate elk",
    caption: "Wild peace below the Tetons.",
    hashtags: ["#GrandTeton", "#Wyoming", "#WildlifePhotography", "#NationalParks", "#NatureLovers"],
    viralScore: 99,
  },
  {
    id: "yellowstone-lamar-bison-dawn",
    region: "USA",
    country: "USA",
    stateOrProvince: "Wyoming / Montana",
    parkName: "Yellowstone National Park",
    title: "Yellowstone Lamar Valley Bison Dawn",
    landmarkStyle: "Lamar Valley open wildlife corridor inspired scene",
    locationStyle: "Yellowstone Lamar Valley inspired open bison country",
    compositionSignature: "wide sage valley, misty creek, bison herd in midground, blue mountain ridges layered behind",
    background: "distant blue ridges, soft dawn haze, rolling Yellowstone plateau, scattered dark conifer patches",
    midground: "meandering creek, open grassland, sagebrush flats, small bison herd grazing naturally",
    foreground: "dew-covered grass, sage, frost-tipped stems, low yellow wildflowers, clean creek edge",
    defaultWildlife: "Bison",
    wildlifeBehavior: "small herd of bison grazing peacefully with one large bull readable in profile, grounded hooves, realistic shaggy coats",
    bestSeason: "early summer dawn",
    bestLight: "soft golden dawn mist with gentle rim light",
    cameraLook: "documentary wildlife landscape still, telephoto-compressed valley depth, natural color and atmosphere",
    realismLocks: "accurate bison anatomy, natural herd spacing, realistic sagebrush valley, no dust clouds",
    avoidTerms: "no road, no cars, no people, no charging bison, no aggressive behavior",
    caption: "Morning moves slowly through Yellowstone.",
    hashtags: ["#Yellowstone", "#Bison", "#Wildlife", "#NationalParks", "#USA"],
    viralScore: 98,
  },
  {
    id: "yellowstone-hayden-valley-river",
    region: "USA",
    country: "USA",
    stateOrProvince: "Wyoming",
    parkName: "Yellowstone National Park",
    title: "Yellowstone Hayden Valley River Wildlife",
    landmarkStyle: "Hayden Valley river meadow inspired scene",
    locationStyle: "Yellowstone Hayden Valley inspired river meadow and thermal plateau",
    compositionSignature: "slow river curve, open golden meadow, distant steam wisps, wildlife small in frame",
    background: "rolling Yellowstone hills, sparse pine ridges, subtle geothermal steam columns, broad sky",
    midground: "slow reflective river bend, willow-lined banks, open meadow with grazing wildlife",
    foreground: "wet meadow grass, river stones, pale sage, clean reflections, soft morning mist",
    defaultWildlife: "Bison",
    wildlifeBehavior: "bison grazing near the river with peaceful posture and natural scale",
    bestSeason: "late spring / summer",
    bestLight: "low amber morning light through valley mist",
    cameraLook: "quiet national park documentary still with layered valley depth",
    realismLocks: "believable steam, natural river reflections, accurate animal scale, no overprocessing",
    avoidTerms: "no tourists, no boardwalks, no parking area, no violent wildlife interaction",
    caption: "A quiet river morning in Yellowstone country.",
    hashtags: ["#Yellowstone", "#WildlifePhotography", "#Nature", "#NationalParks", "#Bison"],
    viralScore: 94,
  },
  {
    id: "glacier-logan-pass-goats",
    region: "USA",
    country: "USA",
    stateOrProvince: "Montana",
    parkName: "Glacier National Park",
    title: "Glacier Logan Pass Mountain Goats",
    landmarkStyle: "Logan Pass alpine meadow inspired scene",
    locationStyle: "Glacier National Park inspired high alpine meadow overlook",
    compositionSignature: "beargrass foreground, safe rocky ledge, mountain goats midground, serrated glacial peaks and turquoise lake far below",
    background: "serrated Rocky Mountain peaks, patchy snowfields, distant turquoise alpine lake, dramatic high-country sky",
    midground: "safe grassy alpine ledge, talus slope, mountain goats standing calmly with natural spacing",
    foreground: "beargrass plumes, alpine wildflowers, short grass, lichen-covered rock, melting snow patches",
    defaultWildlife: "Mountain Goat",
    wildlifeBehavior: "two mountain goats standing calmly on a safe alpine ledge, white coats detailed, realistic black horns and grounded hooves",
    bestSeason: "summer alpine bloom",
    bestLight: "crisp cool morning light with clean mountain contrast",
    cameraLook: "high-resolution alpine wildlife landscape, deep depth of field, no impossible cliff geometry",
    realismLocks: "safe natural ledge, accurate goat legs and horns, realistic snowfields, restrained color",
    avoidTerms: "no falling animals, no cliff danger exaggeration, no tourists, no road",
    caption: "High above the alpine silence.",
    hashtags: ["#GlacierNationalPark", "#MountainGoats", "#Montana", "#Alpine", "#Wildlife"],
    viralScore: 95,
  },
  {
    id: "yosemite-valley-deer-meadow",
    region: "USA",
    country: "USA",
    stateOrProvince: "California",
    parkName: "Yosemite National Park",
    title: "Yosemite Valley Deer Meadow",
    landmarkStyle: "Yosemite Valley meadow and granite wall inspired scene",
    locationStyle: "Yosemite Valley inspired Sierra Nevada meadow",
    compositionSignature: "soft meadow foreground, mule deer in midground, granite cliffs and waterfall mist behind",
    background: "towering granite walls, distant waterfall mist, pine forest edge, clean Sierra sky",
    midground: "broad green valley meadow, shallow reflective stream, calm deer grazing naturally",
    foreground: "meadow grass, small white and yellow flowers, stream pebbles, soft sunlit blades",
    defaultWildlife: "Mule Deer",
    wildlifeBehavior: "two mule deer grazing peacefully, natural size, full bodies readable, realistic ears and coat markings",
    bestSeason: "late spring",
    bestLight: "warm sunset side light touching granite walls",
    cameraLook: "classic national park landscape still, clean vertical framing, soft but detailed meadow depth",
    realismLocks: "accurate deer scale, natural granite texture, realistic stream reflection, no fantasy glow",
    avoidTerms: "no tourists, no cabins, no roads, no exaggerated waterfall",
    caption: "A quiet evening inside a granite valley.",
    hashtags: ["#Yosemite", "#California", "#Deer", "#NationalParks", "#NaturePhotography"],
    viralScore: 93,
  },
  {
    id: "rocky-mountain-elk-aspen",
    region: "USA",
    country: "USA",
    stateOrProvince: "Colorado",
    parkName: "Rocky Mountain National Park",
    title: "Rocky Mountain Elk Aspen Valley",
    landmarkStyle: "Moraine Park / Estes Valley elk meadow inspired scene",
    locationStyle: "Rocky Mountain National Park inspired aspen valley",
    compositionSignature: "golden aspen foreground and side meadow, bull elk midground, snow-streaked peaks behind",
    background: "distant snow-streaked Rocky Mountain peaks, dark pine forest, gold aspen grove",
    midground: "open meadow with clear stream, peaceful elk group, natural autumn spacing",
    foreground: "autumn grass, yellow aspen leaves, stream stones, warm meadow texture",
    defaultWildlife: "Elk",
    wildlifeBehavior: "a bull elk and two cows standing peacefully in the meadow, natural scale, antlers clean and symmetrical",
    bestSeason: "fall color season",
    bestLight: "warm autumn golden hour with long shadows",
    cameraLook: "documentary landscape photograph with crisp fall color and natural wildlife scale",
    realismLocks: "no antler distortion, no rut fight, no fake color saturation, grounded hooves",
    avoidTerms: "no roads, no tourists, no buildings, no fighting elk",
    caption: "Autumn gold in the Rockies.",
    hashtags: ["#RockyMountainNationalPark", "#Colorado", "#Elk", "#Autumn", "#WildlifePhotography"],
    viralScore: 96,
  },
  {
    id: "denali-tundra-caribou",
    region: "USA",
    country: "USA",
    stateOrProvince: "Alaska",
    parkName: "Denali National Park",
    title: "Denali Tundra Caribou Vista",
    landmarkStyle: "Denali tundra and braided river valley inspired scene",
    locationStyle: "Denali National Park inspired Alaskan tundra wilderness",
    compositionSignature: "red-gold tundra foreground, caribou crossing midground, giant snow-covered Denali-style peak far behind",
    background: "massive snow-covered Alaska Range peak, braided river flats, distant boreal tree line, crisp subarctic sky",
    midground: "rolling tundra, gravel bars, three caribou walking calmly with natural spacing",
    foreground: "red and gold tundra plants, low shrubs, stones, clean braided stream texture",
    defaultWildlife: "Caribou",
    wildlifeBehavior: "three caribou walking calmly across the tundra, realistic antlers, natural spacing, full bodies visible",
    bestSeason: "early autumn tundra color",
    bestLight: "cold clear golden-hour light with long shadows",
    cameraLook: "vast wilderness landscape, long-lens mountain compression, restrained documentary color",
    realismLocks: "accurate caribou anatomy, natural tundra vegetation, realistic glacial river scale",
    avoidTerms: "no roads, no buses, no people, no fantasy mountain scale",
    caption: "Alaska’s open wilderness, calm and endless.",
    hashtags: ["#Alaska", "#Denali", "#Caribou", "#Wilderness", "#USA"],
    viralScore: 92,
  },
  {
    id: "mount-rainier-wildflower-meadow",
    region: "USA",
    country: "USA",
    stateOrProvince: "Washington",
    parkName: "Mount Rainier National Park",
    title: "Mount Rainier Wildflower Meadow Wildlife",
    landmarkStyle: "Paradise / subalpine wildflower meadow inspired scene",
    locationStyle: "Mount Rainier inspired Pacific Northwest volcano meadow",
    compositionSignature: "dense wildflower carpet, deer or black bear small in midground, snow-covered volcanic peak centered behind",
    background: "massive snow-covered volcanic peak, dark evergreen slopes, clean blue summer sky with soft clouds",
    midground: "subalpine meadow, winding trail hidden by flowers, peaceful wildlife at safe distance",
    foreground: "purple lupine, red paintbrush, avalanche lilies, lush green meadow grass",
    defaultWildlife: "Mule Deer",
    wildlifeBehavior: "mule deer standing calmly among subalpine flowers, small in frame and naturally scaled",
    bestSeason: "peak summer wildflower bloom",
    bestLight: "soft golden evening backlight with clear mountain air",
    cameraLook: "viral wallpaper-style national park image with deep scenic layers and realistic color",
    realismLocks: "accurate wildflower density, no trail crowds, natural animal scale, no fake HDR",
    avoidTerms: "no hikers, no roads, no visitor center, no oversaturation",
    caption: "Wildflowers under the mountain.",
    hashtags: ["#MountRainier", "#Washington", "#Wildflowers", "#NationalParks", "#Nature"],
    viralScore: 97,
  },
  {
    id: "olympic-rainforest-elk",
    region: "USA",
    country: "USA",
    stateOrProvince: "Washington",
    parkName: "Olympic National Park",
    title: "Olympic Rainforest Roosevelt Elk",
    landmarkStyle: "Hoh rainforest inspired temperate old-growth clearing",
    locationStyle: "Olympic National Park inspired temperate rainforest clearing",
    compositionSignature: "fern and moss foreground, Roosevelt elk at forest edge, giant moss-draped trees in mist",
    background: "towering Sitka spruce and western hemlock, moss-draped branches, deep green misty forest",
    midground: "soft river bend behind a rainforest clearing, Roosevelt elk standing quietly at the forest edge",
    foreground: "ferns, moss, wet stones, soft green ground cover, subtle water reflections",
    defaultWildlife: "Elk",
    wildlifeBehavior: "Roosevelt elk standing quietly at the forest edge, damp coat detail, realistic antlers, natural scale",
    bestSeason: "rainy spring",
    bestLight: "soft overcast rainforest light with gentle mist",
    cameraLook: "moody documentary rainforest still, soft contrast, rich natural greens, no fantasy glow",
    realismLocks: "wet moss texture, correct elk scale, natural rainforest clutter, readable subject silhouette",
    avoidTerms: "no boardwalk, no tourists, no cabins, no cartoon greens",
    caption: "Deep green silence in the Pacific Northwest.",
    hashtags: ["#OlympicNationalPark", "#RooseveltElk", "#PNW", "#Rainforest", "#Wildlife"],
    viralScore: 90,
  },
  {
    id: "zion-canyon-bighorn",
    region: "USA",
    country: "USA",
    stateOrProvince: "Utah",
    parkName: "Zion National Park",
    title: "Zion Canyon Desert Bighorn",
    landmarkStyle: "Zion red-rock canyon wash inspired scene",
    locationStyle: "Zion National Park inspired red-rock canyon wash",
    compositionSignature: "sandstone and desert bloom foreground, bighorn sheep on wash edge, towering red canyon walls behind",
    background: "towering red sandstone canyon walls, cottonwood pockets, warm layered rock, blue desert sky",
    midground: "shallow desert creek, canyon wash, desert bighorn sheep standing calmly near rock ledge",
    foreground: "sandstone stones, desert grasses, small yellow flowers, clear shallow water",
    defaultWildlife: "Bighorn Sheep",
    wildlifeBehavior: "desert bighorn sheep standing calmly on the canyon wash edge, realistic horns and hooves, natural scale",
    bestSeason: "spring desert bloom",
    bestLight: "warm late afternoon canyon light with reflected glow",
    cameraLook: "clean desert national park photo, warm natural color, vertical social composition",
    realismLocks: "accurate bighorn horns, real sandstone texture, no impossible cliff pose, no oversaturation",
    avoidTerms: "no hikers, no roads, no signs, no fighting sheep",
    caption: "Red-rock silence with wild desert life.",
    hashtags: ["#ZionNationalPark", "#Utah", "#BighornSheep", "#DesertWildlife", "#USA"],
    viralScore: 91,
  },
  {
    id: "grand-canyon-elk-rim",
    region: "USA",
    country: "USA",
    stateOrProvince: "Arizona",
    parkName: "Grand Canyon National Park",
    title: "Grand Canyon Rim Elk Pine Forest",
    landmarkStyle: "South Rim ponderosa pine and canyon overlook inspired scene",
    locationStyle: "Grand Canyon rim inspired high desert pine forest overlook",
    compositionSignature: "ponderosa pine foreground, elk near rim meadow, layered canyon depth behind",
    background: "vast layered canyon walls, distant buttes, warm red-orange rock strata, hazy desert sky",
    midground: "rim meadow with scattered ponderosa pine, elk standing calmly away from edge",
    foreground: "pine needles, dry grasses, juniper, warm limestone rocks",
    defaultWildlife: "Elk",
    wildlifeBehavior: "elk standing calmly in a rim meadow, safely away from cliff edge, realistic antlers and natural posture",
    bestSeason: "autumn or spring",
    bestLight: "sunrise side light warming canyon layers",
    cameraLook: "epic but believable canyon wildlife landscape, high detail, safe natural composition",
    realismLocks: "safe distance from rim, correct elk scale, realistic canyon haze, no fantasy colors",
    avoidTerms: "no tourists, no railings, no roads, no cliff danger scene",
    caption: "Quiet wildlife above a canyon morning.",
    hashtags: ["#GrandCanyon", "#Arizona", "#Elk", "#NationalParks", "#Nature"],
    viralScore: 88,
  },
  {
    id: "great-smoky-black-bear",
    region: "USA",
    country: "USA",
    stateOrProvince: "Tennessee / North Carolina",
    parkName: "Great Smoky Mountains National Park",
    title: "Great Smoky Mountains Black Bear Forest",
    landmarkStyle: "misty Appalachian cove forest inspired scene",
    locationStyle: "Great Smoky Mountains inspired misty Appalachian forest",
    compositionSignature: "mossy creek foreground, black bear foraging midground, layered blue-green ridges behind forest gap",
    background: "layered blue-green ridges fading into morning haze, dense deciduous canopy, soft fog in hollows",
    midground: "rhododendron thicket, forest clearing, black bear foraging peacefully at safe distance",
    foreground: "smooth creek stones, moss, autumn leaf litter or spring wildflowers, shallow mountain stream",
    defaultWildlife: "Black Bear",
    wildlifeBehavior: "black bear foraging calmly near a creek, glossy fur, tan muzzle, natural non-aggressive posture",
    bestSeason: "spring bloom or autumn color",
    bestLight: "hazy diffuse morning light",
    cameraLook: "natural Appalachian wildlife photo with mist layers and restrained color",
    realismLocks: "accurate bear shape, no aggressive pose, natural forest density, realistic stream stones",
    avoidTerms: "no cabins, no roads, no tourists, no bear attack",
    caption: "Morning haze in the Smokies.",
    hashtags: ["#GreatSmokyMountains", "#BlackBear", "#Tennessee", "#Wildlife", "#Nature"],
    viralScore: 89,
  },
  {
    id: "north-cascades-alpine-lake",
    region: "USA",
    country: "USA",
    stateOrProvince: "Washington",
    parkName: "North Cascades National Park",
    title: "North Cascades Alpine Lake Wildlife",
    landmarkStyle: "jagged Cascade peaks and turquoise alpine lake inspired scene",
    locationStyle: "North Cascades inspired rugged alpine lake wilderness",
    compositionSignature: "turquoise lake foreground, mountain goat or deer midground, sharp snowy peaks behind",
    background: "jagged snowy Cascade peaks, dark evergreen slopes, glacier patches, dramatic clouds",
    midground: "turquoise alpine lake shoreline, rocky meadow, peaceful wildlife near water",
    foreground: "granite rocks, heather, lupine, clear lake edge, bright green alpine grass",
    defaultWildlife: "Mountain Goat",
    wildlifeBehavior: "mountain goat standing calmly near a rocky alpine lake shore, realistic black horns and white coat",
    bestSeason: "summer alpine thaw",
    bestLight: "clear morning mountain light with clean reflections",
    cameraLook: "crisp adventure landscape photo, detailed peaks, realistic lake color, mobile wallpaper composition",
    realismLocks: "believable lake color, accurate goat anatomy, no fake HDR, no impossible ridge pose",
    avoidTerms: "no hikers, no tents, no roads, no oversaturated water",
    caption: "Blue water under the wild Cascades.",
    hashtags: ["#NorthCascades", "#Washington", "#AlpineLake", "#MountainGoat", "#Nature"],
    viralScore: 93,
  },
  {
    id: "badlands-bison-prairie",
    region: "USA",
    country: "USA",
    stateOrProvince: "South Dakota",
    parkName: "Badlands National Park",
    title: "Badlands Bison Prairie Layers",
    landmarkStyle: "Badlands eroded buttes and prairie inspired scene",
    locationStyle: "Badlands National Park inspired mixed-grass prairie and eroded clay formations",
    compositionSignature: "prairie grass foreground, bison midground, striped badlands buttes behind",
    background: "layered eroded clay buttes, pale tan and rose bands, big prairie sky with soft clouds",
    midground: "mixed-grass prairie, lone bison grazing, rolling dry hills, natural open space",
    foreground: "prairie grass, small yellow flowers, dry soil crust held clean with no dust clouds",
    defaultWildlife: "Bison",
    wildlifeBehavior: "lone bison grazing calmly in open prairie, realistic shaggy coat, grounded hooves",
    bestSeason: "late spring or early summer",
    bestLight: "warm sunrise light across butte layers",
    cameraLook: "clean American prairie landscape photo, natural colors, readable animal silhouette",
    realismLocks: "accurate bison scale, realistic grassland, no dust plume, no cartoon rock layers",
    avoidTerms: "no road, no cars, no tourists, no charging animal",
    caption: "A quiet giant in the prairie layers.",
    hashtags: ["#Badlands", "#SouthDakota", "#Bison", "#Prairie", "#USA"],
    viralScore: 87,
  },
  {
    id: "everglades-heron-alligator",
    region: "USA",
    country: "USA",
    stateOrProvince: "Florida",
    parkName: "Everglades National Park",
    title: "Everglades Wetland Heron Scene",
    landmarkStyle: "sawgrass wetland and cypress dome inspired scene",
    locationStyle: "Everglades inspired subtropical wetland and sawgrass marsh",
    compositionSignature: "water lilies and sawgrass foreground, heron or alligator midground, cypress and sunset sky behind",
    background: "cypress dome silhouettes, wide subtropical sky, warm clouds reflected in still marsh water",
    midground: "sawgrass channels, calm wetland wildlife, shallow water with natural reflections",
    foreground: "water lilies, reeds, glassy water surface, small ripples, wetland grasses",
    defaultWildlife: "Great Blue Heron",
    wildlifeBehavior: "great blue heron wading calmly in shallow water, accurate long legs and neck curve",
    bestSeason: "dry season winter / spring",
    bestLight: "warm sunset glow with clean water reflections",
    cameraLook: "peaceful wetland wildlife photo, low waterline composition, natural color and realistic birds",
    realismLocks: "accurate wetland species scale, realistic water reflections, no swamp fantasy color",
    avoidTerms: "no airboats, no docks, no people, no aggressive alligator attack",
    caption: "Still water, wild Florida light.",
    hashtags: ["#Everglades", "#Florida", "#Wetlands", "#BirdPhotography", "#Wildlife"],
    viralScore: 90,
  },
  {
    id: "banff-moraine-lake-deer",
    region: "Canada",
    country: "Canada",
    stateOrProvince: "Alberta",
    parkName: "Banff National Park",
    title: "Banff Moraine Lake Deer Shoreline",
    landmarkStyle: "Moraine Lake and Valley of the Ten Peaks inspired scene",
    locationStyle: "Banff National Park inspired Canadian Rockies turquoise lake",
    compositionSignature: "smooth lake stones foreground, deer near shoreline, turquoise lake and towering peaks behind",
    background: "towering Canadian Rockies peaks, dark evergreen forest, snow patches, clean alpine air",
    midground: "turquoise glacial lake shoreline, calm mule deer near water, soft mountain reflections",
    foreground: "smooth lake stones, wildflowers, bright green shoreline grass, clear water edge",
    defaultWildlife: "Mule Deer",
    wildlifeBehavior: "two mule deer near the shoreline, calm posture, natural scale, full bodies readable without dominating the landscape",
    bestSeason: "summer",
    bestLight: "clean morning light with soft mountain reflections",
    cameraLook: "premium Canadian Rockies travel-poster realism, polished but natural, no fake saturation",
    realismLocks: "believable turquoise glacial water, correct deer scale, natural reflection, no tourist canoes",
    avoidTerms: "no people, no canoes, no road, no buildings, no oversaturated lake",
    caption: "Canadian Rockies calm beside turquoise water.",
    hashtags: ["#Banff", "#CanadianRockies", "#Wildlife", "#Canada", "#Nature"],
    viralScore: 97,
  },
  {
    id: "jasper-maligne-moose",
    region: "Canada",
    country: "Canada",
    stateOrProvince: "Alberta",
    parkName: "Jasper National Park",
    title: "Jasper Maligne Lake Moose Morning",
    landmarkStyle: "Maligne Lake wilderness shoreline inspired scene",
    locationStyle: "Jasper National Park inspired Maligne Lake wilderness",
    compositionSignature: "reeds foreground, moose in shallow water, long blue alpine lake and snow-dusted peaks behind",
    background: "long blue alpine lake, forested slopes, snow-dusted peaks, quiet shoreline cove, clean cold air",
    midground: "one moose standing in shallow water near reeds, soft mist over lake surface",
    foreground: "reeds, lake stones, clear shallow water, small purple wildflowers",
    defaultWildlife: "Moose",
    wildlifeBehavior: "one moose standing in shallow water near the reeds, natural scale, realistic long legs and broad muzzle",
    bestSeason: "early summer",
    bestLight: "soft cool dawn light with subtle mist over the lake",
    cameraLook: "quiet Canadian Rockies wildlife documentary still, natural waterline perspective",
    realismLocks: "accurate moose legs and muzzle, realistic shallow water, clean mist, no fantasy antlers",
    avoidTerms: "no boats, no tourists, no docks, no aggressive animal posture",
    caption: "A quiet moose morning in the Canadian Rockies.",
    hashtags: ["#Jasper", "#Moose", "#CanadianRockies", "#WildlifePhotography", "#Canada"],
    viralScore: 94,
  },
  {
    id: "lake-louise-bighorn",
    region: "Canada",
    country: "Canada",
    stateOrProvince: "Alberta",
    parkName: "Banff National Park",
    title: "Lake Louise Bighorn Sheep Alpine Frame",
    landmarkStyle: "Lake Louise emerald glacial lake overlook inspired scene",
    locationStyle: "Lake Louise inspired Canadian Rockies overlook",
    compositionSignature: "rocky foreground slope, bighorn sheep calmly posed, emerald lake and glacier peaks behind",
    background: "emerald glacial lake, glacier-touched peaks, evergreen slopes, clean rocky overlook, dramatic alpine depth",
    midground: "safe rocky slope above the lake, two bighorn sheep standing calmly with natural spacing",
    foreground: "alpine rocks, low flowers, short grass, lake viewpoint textures",
    defaultWildlife: "Bighorn Sheep",
    wildlifeBehavior: "two bighorn sheep standing calmly on a safe rocky foreground slope, realistic horns, grounded hooves",
    bestSeason: "summer",
    bestLight: "late afternoon mountain light with clean rim on horns and rocks",
    cameraLook: "high-end alpine wildlife travel image, vertical framing, detailed lake and horns",
    realismLocks: "accurate bighorn horn curls, realistic lake color, safe slope, no cliff exaggeration",
    avoidTerms: "no tourists, no hotel, no canoe, no fake emerald oversaturation",
    caption: "Rocky Mountain stillness above emerald water.",
    hashtags: ["#LakeLouise", "#BighornSheep", "#Banff", "#Canada", "#Wildlife"],
    viralScore: 92,
  },
  {
    id: "yoho-emerald-lake-eagle",
    region: "Canada",
    country: "Canada",
    stateOrProvince: "British Columbia",
    parkName: "Yoho National Park",
    title: "Yoho Emerald Lake Bald Eagle",
    landmarkStyle: "Emerald Lake and Canadian Rockies forest inspired scene",
    locationStyle: "Yoho National Park inspired emerald alpine lake and forest",
    compositionSignature: "lake stones foreground, bald eagle on driftwood snag, emerald water and forested peaks behind",
    background: "emerald alpine lake, forested slopes, rugged Canadian Rockies peaks, soft cloud reflections",
    midground: "driftwood snag near shoreline with bald eagle perched calmly, water reflection below",
    foreground: "wet stones, clear lake edge, moss, small shoreline flowers",
    defaultWildlife: "Bald Eagle",
    wildlifeBehavior: "bald eagle perched on driftwood near the lake, sharp eyes, realistic feathers, calm posture",
    bestSeason: "summer or early autumn",
    bestLight: "soft morning light with clean water reflections",
    cameraLook: "photoreal Canadian Rockies wildlife landscape, crisp bird detail and scenic lake depth",
    realismLocks: "accurate eagle feather anatomy, realistic perch, natural lake color, no artificial glow",
    avoidTerms: "no tourists, no cabins, no canoes, no oversaturated water",
    caption: "Emerald water and wild mountain silence.",
    hashtags: ["#YohoNationalPark", "#EmeraldLake", "#BaldEagle", "#Canada", "#Nature"],
    viralScore: 89,
  },
  {
    id: "vancouver-island-rainforest-bear",
    region: "Canada",
    country: "Canada",
    stateOrProvince: "British Columbia",
    parkName: "Vancouver Island Rainforest",
    title: "Vancouver Island Rainforest Black Bear",
    landmarkStyle: "coastal temperate rainforest and salmon creek inspired scene",
    locationStyle: "Vancouver Island inspired coastal rainforest creek",
    compositionSignature: "mossy creek foreground, black bear foraging midground, giant cedar rainforest behind",
    background: "towering cedar and hemlock rainforest, moss-draped limbs, coastal fog filtering through trees",
    midground: "clear salmon creek bend, black bear foraging peacefully on gravel bar",
    foreground: "moss-covered logs, wet stones, ferns, shallow moving water",
    defaultWildlife: "Black Bear",
    wildlifeBehavior: "black bear foraging calmly beside a creek, glossy damp fur, natural non-aggressive posture",
    bestSeason: "late summer / autumn salmon season atmosphere without graphic predation",
    bestLight: "soft overcast rainforest light",
    cameraLook: "moody coastal rainforest documentary photo, detailed moss and realistic bear fur",
    realismLocks: "wet fur detail, accurate bear scale, natural rainforest density, no aggressive scene",
    avoidTerms: "no people, no cabins, no blood, no fish gore, no attack",
    caption: "Rainforest quiet on the wild coast.",
    hashtags: ["#VancouverIsland", "#BlackBear", "#BritishColumbia", "#Rainforest", "#Wildlife"],
    viralScore: 88,
  },
];

function cleanList(items: string[]): string[] {
  return items.map((item) => item.trim()).filter(Boolean).slice(0, 5);
}

function aspectLine(aspectRatio: ScenicImageAspectRatio): string {
  switch (aspectRatio) {
    case "4:5":
      return "social feed framing, strong center composition for Facebook and Instagram";
    case "1:1":
      return "balanced scenic social post framing with layered composition";
    case "9:16":
    default:
      return "mobile-first framing, wallpaper-safe and reel-cover safe";
  }
}

function moodLine(mood: ScenicImageMood): string {
  switch (mood) {
    case "Epic National Park":
      return "epic national park landscape realism, grand scale, deep scenic layers, majestic but believable";
    case "Luxury Travel Poster":
      return "premium travel-poster realism, polished but natural, rich scenic detail, clean social-media composition";
    case "Documentary Realism":
      return "true wildlife documentary still, restrained color, natural field optics, realistic animal scale, no overprocessing";
    case "Facebook Viral Nature Post":
      return "Facebook viral nature-post style, instantly readable first frame, rich but natural color, strong foreground-to-background depth, shareable peaceful wildlife moment";
    case "Wallpaper / Lock Screen":
      return "premium phone wallpaper composition, clean negative space near the upper third, crisp scenic detail, elegant vertical balance";
    case "Thumbnail-safe Scenic Photo":
      return "thumbnail-safe scenic photo, clear main subject silhouette, bold readable landscape layers, clean crop margins for social preview";
    case "Peaceful Wildlife":
    default:
      return "peaceful wildlife landscape realism, calm natural behavior, postcard-safe composition, quiet national park mood";
  }
}

function wildlifeLine(preset: ScenicImagePreset, wildlifeOverride: ScenicWildlifeOverride): string {
  if (wildlifeOverride === "No wildlife / landscape only") {
    return "No prominent wildlife subject; focus on a pure scenic national park landscape with natural habitat detail.";
  }

  const selected = wildlifeOverride === "Default preset wildlife" ? preset.defaultWildlife : wildlifeOverride;
  const detail = WILDLIFE_DETAILS[selected] || selected.toLowerCase();
  const behavior = wildlifeOverride === "Default preset wildlife" ? preset.wildlifeBehavior : `${detail}, adapted naturally to this habitat, peaceful non-aggressive behavior, small-to-medium in frame, full body readable, correct scale to the landscape`;

  return `Wildlife: ${behavior}. Keep the wildlife peaceful, unstaged, naturally scaled, anatomically correct, with grounded hoof, paw, claw, or foot contact as appropriate.`;
}

export function buildScenicImagePromptPackage({
  preset,
  aspectRatio = "9:16",
  mood = "Facebook Viral Nature Post",
  wildlifeOverride = "Default preset wildlife",
  customNote = "",
}: ScenicImagePromptOptions): ScenicImagePromptPackage {
  const prompt = [
    `Photorealistic ${preset.locationStyle}, ${aspectLine(aspectRatio)}.`,
    `Location identity: ${preset.parkName}, ${preset.stateOrProvince}, ${preset.landmarkStyle}, clearly inspired by the real region but not copied from any existing photograph.`,
    `Composition signature: ${preset.compositionSignature}.`,
    `Background: ${preset.background}.`,
    `Midground: ${preset.midground}.`,
    `Foreground: ${preset.foreground}.`,
    wildlifeLine(preset, wildlifeOverride),
    `Season and light: ${preset.bestSeason}, ${preset.bestLight}, realistic shadows, natural color, clean air, believable sky and cloud detail where visible.`,
    `Camera look: ${preset.cameraLook}.`,
    `Style: ${moodLine(mood)}.`,
    `Realism locks: ${preset.realismLocks}.`,
    customNote.trim() ? `Extra direction: ${customNote.trim()}.` : "",
    "No text, no watermark, no roads, no cars, no tourists, no buildings, no fake HDR, no predator-prey conflict, no dust clouds, no debris spray.",
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  const negativePrompt = [GLOBAL_NEGATIVE_TERMS, preset.avoidTerms].filter(Boolean).join(", ");
  const hashtagList = cleanList(preset.hashtags);
  const hashtags = hashtagList.join(" ");
  const caption = preset.caption;
  const altText = `${preset.title}: ${preset.parkName} inspired scenic wildlife image with ${wildlifeOverride === "No wildlife / landscape only" ? "a landscape-only view" : wildlifeOverride === "Default preset wildlife" ? preset.defaultWildlife.toLowerCase() : wildlifeOverride.toLowerCase()} in ${preset.bestSeason.toLowerCase()}.`;

  const copyAll = [
    "IMAGE PROMPT:",
    prompt,
    "",
    "NEGATIVE PROMPT:",
    negativePrompt,
    "",
    "FACEBOOK CAPTION:",
    caption,
    "",
    "HASHTAGS:",
    hashtags,
    "",
    "ALT TEXT:",
    altText,
  ].join("\n");

  return {
    title: preset.title,
    prompt,
    negativePrompt,
    caption,
    hashtags,
    hashtagList,
    altText,
    copyAll,
  };
}

export function getScenicPresetById(id: string): ScenicImagePreset {
  return SCENIC_IMAGE_PRESETS.find((preset) => preset.id === id) ?? SCENIC_IMAGE_PRESETS[0];
}

export function getRandomScenicPreset(region?: "USA" | "Canada"): ScenicImagePreset {
  const pool = region ? SCENIC_IMAGE_PRESETS.filter((preset) => preset.region === region) : SCENIC_IMAGE_PRESETS;
  return pool[Math.floor(Math.random() * pool.length)] ?? SCENIC_IMAGE_PRESETS[0];
}

export function getViralScenicPreset(): {
  preset: ScenicImagePreset;
  mood: ScenicImageMood;
  aspectRatio: ScenicImageAspectRatio;
} {
  const sorted = [...SCENIC_IMAGE_PRESETS].sort((a, b) => b.viralScore - a.viralScore);
  const top = sorted.slice(0, 8);
  return {
    preset: top[Math.floor(Math.random() * top.length)] ?? SCENIC_IMAGE_PRESETS[0],
    mood: "Facebook Viral Nature Post",
    aspectRatio: Math.random() > 0.5 ? "9:16" : "4:5",
  };
}
