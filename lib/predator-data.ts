// ─────────────────────────────────────────────────────────────
// lib/predator-data.ts
// WSTV — All Static Data + Data-Derived Functions
//
// Contains:
//   • predatorData      — full animal database
//   • weatherVariants   — weather → prompt string
//   • emotionalTones/emotionalTonePrompt
//   • animalVibes/animalVibePrompt
//   • suggestArc, coerceArc, capitalizeFirst
//   • calculateViralScore, buildBulkItems
//   • buildFiveShotCinematic, buildFiveShotViral
//   • buildWatchTimeReport
//   • getUSAPostingTimes, generateMonthlyCalendar,
//     generateUSAViral30DayCalendar
//   • getOriginalityChecklist, getCMPEarningsTable
//
// RULES: Pure data + pure functions only. No React. No UI.
// ─────────────────────────────────────────────────────────────

import type {
  PredatorInfo,
  EmotionalTone,
  AnimalVibe,
  Weather,
  Arc,
  RunwayModel,
  KlingModel,
  QualityOptions,
  GeneratedPackage,
  FiveShotPlan,
  BulkItem,
  ViralScore,
  WatchTimeReport,
  OriginalityItem,
  EarningsEstimate,
  PostingDay,
  CalendarDay,
} from "@/types";

import {
  RUNWAY_STYLE_NOTE,
  KLING_STYLE_NOTE,
  arcs,
} from "@/lib/model-specs";

import { buildQualityLead } from "@/lib/quality-lead";

// ─────────────────────────────────────────────────────────────
// PREDATOR DATABASE
// ─────────────────────────────────────────────────────────────
export const predatorData: Record<string, PredatorInfo> = {
  Lion: {
    prey: ["Buffalo", "Zebra", "Antelope", "Deer", "Wild Boar"],
    environment: "African savanna",
    lighting: "natural golden hour sunlight, realistic shadow direction, warm rim light on the mane, soft atmospheric haze",
    cameraGear: "Canon EOS R5, 200mm wildlife lens, natural telephoto perspective",
    texture: "ultra detailed fur, dust on coat, visible muscle tension, realistic dry grass interaction",
    defaultArc: "Chase and takedown",
    driftRisk: "HIGH",
  },
  Tiger: {
    prey: ["Deer", "Wild Boar", "Goat", "Antelope"],
    environment: "dense jungle with mist and wet ground",
    lighting: "natural jungle light, soft volumetric rays through foliage, wet highlights, realistic atmospheric mist",
    cameraGear: "Sony A1, 200mm wildlife lens, natural cinematic compression",
    texture: "wet fur detail, visible whiskers, jungle moisture on coat, realistic muscle definition",
    defaultArc: "Ambush attack",
    driftRisk: "HIGH",
  },
  "Siberian Tiger": {
    prey: ["Wild Boar", "Deer", "Elk", "Brown Bear Cub"],
    environment: "deep Siberian taiga forest in heavy snowfall",
    lighting: "dim winter taiga light, soft snowfall diffusion, cold blue shadows, stripe contrast against white snow",
    cameraGear: "Nikon Z9, 300mm wildlife lens, slow exposure snowfall atmosphere",
    texture: "thick winter orange-white coat, snow accumulation on fur, massive paw prints, visible exhale vapor",
    defaultArc: "Ambush attack",
    driftRisk: "HIGH",
  },
      Wolf: {
    prey: ["Elk", "White-tailed Deer", "Mule Deer", "Moose Calf"],
    environment: "northern Rocky Mountain forest edge, sage valley, and open meadow",
    lighting: "cold dawn light, pale gold horizon glow, thin ground mist, visible breath vapor, soft side light across grass, brush, and tree line",
    cameraGear: "Nikon Z9, 400mm wildlife lens, long-lens documentary tracking across meadow and forest edge",
    texture: "natural grey wolf coat, layered guard hairs, lean muscle definition, sharp muzzle detail, realistic paw contact on dirt, grass, frost, and uneven ground",
    defaultArc: "Chase and takedown",
    driftRisk: "MEDIUM",
  },
"Wolf Pack": {
  prey: ["Elk", "White-tailed Deer", "Mule Deer", "Moose Calf"],
  environment: "northern Rocky Mountain forest edge, sage valley, and open meadow",
  lighting: "cold dawn light, pale gold horizon glow, thin ground mist, visible breath vapor, soft side light across grass, brush, and tree line",
  cameraGear: "Nikon Z9, 400mm wildlife lens, long-lens documentary tracking across meadow and forest edge",
  texture: "natural grey wolf coats, layered guard hairs, lean pack-built bodies, clean muzzle detail, realistic paw contact on dirt, grass, frost, and uneven ground",
  driftRisk: "MEDIUM",
  defaultArc: "Pack hunting strategy",
},
  Jaguar: {
    prey: ["Caiman", "Deer", "Fish", "Wild Boar"],
    environment: "tropical jungle riverbank",
    lighting: "humid natural jungle light, reflected river glow, soft filtered sunlight, deep realistic contrast",
    cameraGear: "Canon EOS R3, 250mm wildlife lens, rich environmental depth",
    texture: "wet spotted coat, water droplets, sharp whiskers, powerful shoulders, realistic riverbank mud detail",
    defaultArc: "Ambush attack",
    driftRisk: "HIGH",
  },
  Leopard: {
    prey: ["Antelope", "Deer", "Goat", "Rabbit"],
    environment: "rocky canyon",
    lighting: "natural sunset side light, realistic warm edge light, long shadows, dry atmospheric haze",
    cameraGear: "Sony A7R V, 200mm wildlife lens, natural cinematic perspective",
    texture: "coarse fur texture, dusty paws, sharp facial detail, realistic canyon dust",
    defaultArc: "Ambush attack",
    driftRisk: "HIGH",
  },
  Cheetah: {
  prey: ["Gazelle", "Antelope", "Rabbit", "Deer"],
  environment: "open East African savanna with short grass",
  lighting: "warm side light across short grass, soft rim light on coat, long shadow readability, subtle dust haze in the air",
  cameraGear: "Sony A1, 300mm wildlife lens, tracking shot specialist framing",
  texture: "sleek spotted coat, deep chest expansion, tear mark facial detail, aerodynamic muscle definition",
  defaultArc: "Chase and takedown",
  driftRisk: "HIGH",
  },
  "Snow Leopard": {
    prey: ["Blue Sheep", "Marmot", "Ibex", "Mountain Goat"],
    environment: "high altitude Himalayan rocky terrain with snow",
    lighting: "crisp high altitude mountain light, cold blue shadows, sharp contrast on white snow",
    cameraGear: "Canon EOS R5, 400mm super-telephoto, extreme reach wildlife framing",
    texture: "thick spotted winter coat, snow crystals on fur, large padded paws, visible breath vapor",
    defaultArc: "Ambush attack",
    driftRisk: "HIGH",
  },
  Crocodile: {
    prey: ["Zebra", "Buffalo", "Antelope", "Fish", "Goat"],
    environment: "muddy riverbank in tropical swamp",
    lighting: "humid swamp light, natural reflections on wet skin, realistic water highlights",
    cameraGear: "Canon EOS R5, 135mm wildlife lens, low angle natural documentary framing",
    texture: "wet armored scales, muddy splash detail, sharp eye reflections, realistic rippling water",
    defaultArc: "Ambush attack",
    driftRisk: "LOW",
  },
  "Nile Crocodile": {
    prey: ["Wildebeest", "Zebra", "Buffalo", "Antelope"],
    environment: "wide African river crossing with murky water",
    lighting: "harsh midday African sun, mirror water surface reflections, dramatic spray backlight",
    cameraGear: "Canon EOS R3, 500mm wildlife lens, river bank ambush framing",
    texture: "ancient rough scales, yellow muddy water streaming off body, explosive splash detail",
    defaultArc: "Ambush attack",
    driftRisk: "LOW",
  },
  Bear: {
    prey: ["Fish", "Goat", "Deer", "Rabbit"],
    environment: "mountain wilderness with cold air",
    lighting: "misty dawn light, cool natural shadows, subtle backlight, drifting fog",
    cameraGear: "Nikon Z8, 200mm telephoto lens, natural environmental framing",
    texture: "dense fur texture, visible breath, rugged body detail, realistic moisture in fur",
    defaultArc: "Territory dominance battle",
    driftRisk: "LOW",
  },
  "Polar Bear": {
    prey: ["Seal", "Fish", "Arctic Fox"],
    environment: "Arctic sea ice with open water leads",
    lighting: "polar day flat white light, cold blue ice shadows, warm amber horizon glow",
    cameraGear: "Nikon Z9, 400mm super-telephoto, extreme cold weather wildlife framing",
    texture: "thick layered white fur, wet muzzle, massive paws on ice, visible breath in extreme cold",
    defaultArc: "Ambush attack",
    driftRisk: "LOW",
  },
      "Grizzly Bear": {
    prey: ["Bison", "Moose", "Salmon", "Elk Calf"],
    environment: "Yellowstone meadow, river corridor, and open wilderness in late summer",
    lighting: "dramatic overcast mountain light, open-air clarity, dry grass movement, heavy cloud diffusion, natural cold contrast",
    cameraGear: "Canon EOS R3, 400mm wildlife lens, ground-level wildlife documentary framing",
    texture: "massive shaggy brown coat, muscular shoulder hump, scarred muzzle detail, dry earth on claws, wind-tossed fur",
    defaultArc: "Territory dominance battle",
    driftRisk: "LOW",
  },
  Hyena: {
    prey: ["Antelope", "Zebra", "Deer", "Wild Boar"],
    environment: "dry grassland",
    lighting: "natural dusk light, dusty atmosphere, realistic edge light, warm low sun direction",
    cameraGear: "Sony A1, 200mm wildlife lens, documentary compression",
    texture: "rough fur texture, dust on muzzle, sharp teeth detail, lean muscular form",
    defaultArc: "Chase and takedown",
    driftRisk: "MEDIUM",
  },
  "African Wild Dog": {
    prey: ["Antelope", "Gazelle", "Deer", "Rabbit"],
    environment: "open bushveld savanna at dawn",
    lighting: "cool pre-dawn blue light transitioning to warm first sun, long golden shadows",
    cameraGear: "Sony A1, 200mm wildlife lens, wide pack framing",
    texture: "patchy painted coat detail, large round ears, lean athletic build, red dust on paws",
    defaultArc: "Pack hunting strategy",
    driftRisk: "MEDIUM",
  },
  Eagle: {
    prey: ["Fish", "Rabbit", "Goat"],
    environment: "high mountain cliffs above open sky",
    lighting: "clean natural mountain light, crisp high-altitude contrast, realistic golden edge light",
    cameraGear: "Canon EOS R3, 300mm wildlife lens, sharp aerial wildlife framing",
    texture: "intricate feather detail, sharp beak reflections, wind through feathers",
    defaultArc: "Chase and takedown",
    driftRisk: "MEDIUM",
  },
  "Golden Eagle": {
    prey: ["Rabbit", "Fox", "Marmot", "Pheasant"],
    environment: "open highland moorland with dramatic sky",
    lighting: "stormy highland light, shafts of gold through dark clouds, fierce wind in grass and feathers",
    cameraGear: "Canon EOS R5, 600mm super-telephoto, sky-to-ground dive tracking",
    texture: "golden nape feathers, powerful talon detail, wing feather separation in dive",
    defaultArc: "Chase and takedown",
    driftRisk: "MEDIUM",
  },
  "Harpy Eagle": {
    prey: ["Monkey", "Sloth", "Iguana", "Large Snake"],
    environment: "dense Amazon rainforest canopy",
    lighting: "filtered equatorial light through thick canopy, dappled green glow, deep forest contrast",
    cameraGear: "Canon EOS R3, 400mm wildlife lens, canopy-level framing",
    texture: "dramatic grey and black crest feathers, massive talons, piercing yellow eyes",
    defaultArc: "Ambush attack",
    driftRisk: "MEDIUM",
  },
     "Bald Eagle": {
    prey: ["Salmon", "Trout", "Duck", "Rabbit"],
    environment: "Alaskan river mouth, lakeshore, and conifer-lined shallows under cold open sky",
    lighting: "clean northern daylight, silver-blue water reflections, crisp feather edge light, cold atmospheric clarity, natural contrast",
    cameraGear: "Canon EOS R5, 500mm super-telephoto, low-angle riverside wildlife framing",
    texture: "bright white head feathers against dark brown body, sharp yellow talons, hooked golden beak, layered feather detail, wind through wings",
    defaultArc: "Chase and takedown",
    driftRisk: "MEDIUM",
  },
  Shark: {
    prey: ["Fish", "Seal", "Sea Turtle"],
    environment: "deep ocean blue water",
    lighting: "natural underwater light rays, suspended particles, realistic ocean diffusion, deep blue atmosphere",
    cameraGear: "Canon EOS R5, 24mm wide-angle, natural underwater documentary framing",
    texture: "smooth grey skin with subtle texture, powerful tail movement, realistic underwater particle suspension",
    defaultArc: "Ambush attack",
    driftRisk: "LOW",
  },
  Orca: {
    prey: ["Seal", "Fish", "Dolphin", "Sea Lion"],
    environment: "cold Arctic or Pacific coastal waters",
    lighting: "dramatic overcast Pacific light, white spray backlight, dark water surface reflections",
    cameraGear: "Nikon Z9, 300mm wildlife lens, surface and underwater split framing",
    texture: "bold black and white markings, powerful breach trajectory, realistic water spray and wake",
    defaultArc: "Pack hunting strategy",
    driftRisk: "LOW",
  },
  "Komodo Dragon": {
    prey: ["Deer", "Goat", "Wild Boar", "Water Buffalo"],
    environment: "arid Indonesian island scrubland",
    lighting: "harsh equatorial midday sun, deep shadow contrast, heat shimmer, bleached earth tones",
    cameraGear: "Sony A1, 300mm wildlife lens, ground-level reptile documentary framing",
    texture: "armored scale texture, forked tongue detail, heavy clawed feet, prehistoric skin pattern",
    defaultArc: "Ambush attack",
    driftRisk: "LOW",
  },
  "Saltwater Crocodile": {
    prey: ["Water Buffalo", "Wild Boar", "Deer", "Large Fish"],
    environment: "tropical Australian river mouth and mangrove estuary",
    lighting: "tropical dry season light, mirror water surface, crocodile eye reflection, deep shadow under mangroves",
    cameraGear: "Canon EOS R3, 400mm wildlife lens, water-level estuary framing",
    texture: "massive prehistoric scale armor, olive-grey mottled pattern, bone-crushing jaw detail",
    defaultArc: "Ambush attack",
    driftRisk: "LOW",
  },
  "Leopard Seal": {
    prey: ["Penguin", "Seal Pup", "Fish", "Squid"],
    environment: "Antarctic ice floe and freezing open water",
    lighting: "polar flat white overcast light, ice reflection glow, steel-blue water reflections",
    cameraGear: "Nikon Z9, 500mm wildlife lens, ice-level framing",
    texture: "spotted grey pattern, massive jaw width, powerful neck, ice crystals on wet skin",
    defaultArc: "Ambush attack",
    driftRisk: "LOW",
  },
  "Black Mamba": {
    prey: ["Rat", "Bird", "Small Mammal", "Lizard"],
    environment: "rocky African savanna with sparse brush",
    lighting: "midday African sun, dappled shadow under sparse acacia, high contrast on black scales",
    cameraGear: "Canon EOS R5, 200mm macro-telephoto, ground-level serpentine framing",
    texture: "iridescent dark olive-grey scales, coffin-shaped head detail, jet black mouth interior",
    defaultArc: "Ambush attack",
    driftRisk: "MEDIUM",
  },
  "African Lion Male": {
    prey: ["Buffalo", "Zebra", "Rival Lion", "Wild Boar"],
    environment: "open African savanna with scattered acacia trees",
    lighting: "golden hour side light, rim light on dark mane, deep shadow under mane, amber dust in air",
    cameraGear: "Canon EOS R3, 300mm wildlife lens, eye-level ground framing",
    texture: "massive dark mane, scarred muzzle detail, heavy paw definition, golden coat contrast",
    defaultArc: "Territory dominance battle",
    driftRisk: "HIGH",
  },
  "Tasmanian Devil": {
    prey: ["Wallaby", "Rabbit", "Bird", "Carrion"],
    environment: "Tasmanian temperate forest and scrubland",
    lighting: "overcast Tasmanian light, damp forest floor, diffuse soft shadows",
    cameraGear: "Sony A7R V, 200mm wildlife lens, ground-level documentary framing",
    texture: "coarse black fur with white chest marking, powerful jaw detail, pink ear flush when stressed",
    defaultArc: "Predator vs predator fight",
    driftRisk: "MEDIUM",
  },
  Chimpanzee: {
    prey: ["Colobus Monkey", "Bushbuck Fawn", "Red River Hog Piglet"],
    environment: "dense equatorial African rainforest",
    lighting: "filtered equatorial canopy light, dappled floor shadows, humid green atmosphere",
    cameraGear: "Canon EOS R5, 300mm wildlife lens, forest floor and canopy framing",
    texture: "coarse dark hair, expressive facial skin detail, powerful forearm muscle definition",
    defaultArc: "Pack hunting strategy",
    driftRisk: "HIGH",
  },
  Wolverine: {
    prey: ["Reindeer", "Rabbit", "Beaver", "Moose Calf"],
    environment: "boreal forest and tundra in deep snow",
    lighting: "low subarctic sun, long blue shadows across snow, silver overcast boreal light",
    cameraGear: "Nikon Z9, 300mm wildlife lens, snow-level boreal framing",
    texture: "dense two-layer fur with frost, powerful low build, wide paw spread on snow",
    defaultArc: "Territory dominance battle",
    driftRisk: "MEDIUM",
  },
  Puma: {
    prey: ["Deer", "Bighorn Sheep", "Wild Boar", "Rabbit"],
    environment: "rugged mountain terrain with mixed forest",
    lighting: "mountain afternoon light, dappled forest edge, golden hour on open slope",
    cameraGear: "Sony A1, 300mm wildlife lens, mountain terrain framing",
    texture: "tawny smooth coat, deep chest, long powerful tail, mountain dust on paws",
    defaultArc: "Ambush attack",
    driftRisk: "HIGH",
  },
      "Mountain Lion": {
    prey: ["Mule Deer", "White-tailed Deer", "Elk Calf", "Bighorn Sheep"],
    environment: "Rocky Mountain forest edge, rocky ridgeline, and open meadow at golden hour",
    lighting: "warm mountain golden hour, long ridge shadows, pine-filtered light, amber highlights on tawny coat, dry high-altitude air clarity",
    cameraGear: "Canon EOS R5, 400mm super-telephoto, ridge-level long-lens wildlife framing",
    texture: "tawny smooth coat, muscular rear haunches, long balancing tail, dust and pine needles on paws, sharp whisker detail",
    defaultArc: "Ambush attack",
    driftRisk: "HIGH",
  },
    Cougar: {
        prey: ["Mule Deer", "Elk Calf", "White-tailed Deer", "Bighorn Sheep"],
    environment: "Pacific Northwest forest edge with mossy ground and dark conifers",
    lighting: "cool overcast forest light, soft mist through trees, mossy green bounce light, deep natural shadow separation",
    cameraGear: "Nikon Z8, 300mm wildlife lens, forest-floor documentary framing",
    texture: "solid tawny coat, muscular shoulders, pale underbelly, damp forest debris on paws, sleek powerful body detail",
    defaultArc: "Ambush attack",
    driftRisk: "HIGH",
  },
    Bobcat: {
        prey: ["Wild Turkey", "Rabbit", "Quail", "Squirrel"],
    environment: "Southwestern desert scrub and rocky brushland at dusk",
    lighting: "deep desert dusk light, warm earth tones, cool blue brush shadows, last horizon glow, fine dust in the air",
    cameraGear: "Sony A1, 300mm wildlife lens, low-angle scrubland wildlife framing",
    texture: "short spotted tawny coat, sharp ear tufts, compact muscular build, black-tipped tail, dust on paws and whiskers",
    defaultArc: "Ambush attack",
    driftRisk: "HIGH",
  },
    "Black Bear": {
       prey: ["Salmon", "White-tailed Deer Fawn", "Ground Squirrel", "Rabbit"],
    environment: "Appalachian forest and Smoky Mountain creekside in morning fog",
    lighting: "soft fog-filtered dawn light, diffuse forest shadows, green canopy bounce light, damp air and low mist",
    cameraGear: "Nikon Z8, 300mm wildlife lens, forest-edge documentary framing",
    texture: "glossy black fur with moisture on coat, tan muzzle detail, broad shoulder mass, claws on wet moss and roots",
    defaultArc: "Territory dominance battle",
    driftRisk: "LOW",
  },
      Coyote: {
    prey: ["Jackrabbit", "Rabbit", "White-tailed Deer Fawn", "Quail"],
    environment: "open prairie, sagebrush flats, and scrub desert edge at first light",
    lighting: "cold dawn light, pale gold horizon glow, soft side light across dry grass, long early-morning shadows",
    cameraGear: "Sony A1, 300mm wildlife lens, ground-level pursuit framing",
    texture: "lean grey-brown coat, alert ears, narrow muzzle, dusty paws, wiry tail fur, subtle wind movement through coat",
    defaultArc: "Chase and takedown",
    driftRisk: "MEDIUM",
  },
      Alligator: {
    prey: ["Wild Boar", "White-tailed Deer", "Raccoon", "Large Fish"],
    environment: "Florida Everglades marsh and cypress-lined swamp with dark tannin water",
    lighting: "humid wetland light, reflective black water surface, soft rim light through cypress cover, swamp haze and subtle mist",
    cameraGear: "Canon EOS R5, 200mm wildlife lens, water-surface ambush framing",
    texture: "dark armored scales with algae patches, yellow-green eyes above waterline, powerful jaw detail, rippling wake behind tail",
    defaultArc: "Ambush attack",
    driftRisk: "LOW",
  },
        Bison: {
    prey: ["Grizzly Bear", "Wolf Pack", "Wolf", "Mountain Lion"],
    environment: "Yellowstone grassland with geothermal steam and wide open prairie",
    lighting: "dramatic golden hour backlight, dust clouds in the air, geothermal haze, strong rim light on horns and shoulder mass",
    cameraGear: "Nikon Z9, 400mm super-telephoto, wide Yellowstone prairie framing",
    texture: "massive shaggy dark-brown front coat, lighter hindquarters, horn boss detail, dust on hooves, heavy muscle weight in shoulders",
    defaultArc: "Defender stands ground",
    driftRisk: "LOW",
  },
        Moose: {
    prey: ["Wolf Pack", "Wolf", "Grizzly Bear", "Mountain Lion"],
    environment: "northern lake edge and willow marsh in cold autumn air",
    lighting: "low northern golden light, reflected lake glow, visible breath mist, long shadows over wet ground and reeds",
    cameraGear: "Nikon Z9, 500mm wildlife lens, lake-edge long-lens documentary framing",
    texture: "massive dark-brown body, broad palmate antlers, dewlap detail, wet lower legs, thick autumn coat, visible breath in cold air",
    defaultArc: "Defender stands ground",
    driftRisk: "LOW",
  },
        "Bull Elk": {
    prey: ["Wolf Pack", "Wolf", "Mountain Lion", "Grizzly Bear"],
    environment: "Rocky Mountain meadow in autumn with frost and distant peaks",
    lighting: "golden autumn dawn light, amber glow on antlers, visible breath mist, long shadows over frost-covered grass",
    cameraGear: "Sony A1, 300mm wildlife lens, wide mountain meadow wildlife framing",
    texture: "deep auburn coat, massive antler rack, heavy neck muscle detail, churned frost under hooves, breath clouds in cold air",
    defaultArc: "Defender stands ground",
    driftRisk: "MEDIUM",
  },
  "Musk Ox": {
    prey: ["Arctic Wolf", "Polar Bear", "Wolf Pack", "Wolverine"],
    environment: "open Arctic tundra with snowstorm and ice plains",
    lighting: "flat arctic blizzard light, zero visibility atmosphere, snow driving horizontally, cold blue-white 4000K palette",
    cameraGear: "Nikon Z9, 400mm super-telephoto, extreme weather wildlife framing",
    texture: "prehistoric shaggy dark brown qiviut coat hanging to ground, curved boss horns, snow embedded in fur, massive lowered head",
    defaultArc: "Defender stands ground",
    driftRisk: "LOW",
  },
  "Cape Buffalo": {
    prey: ["Lion Pack", "Crocodile", "Leopard", "Hyena Pack"],
    environment: "African savanna waterhole at golden hour with dust and dry grass",
    lighting: "warm African golden hour, backlit dust clouds, rim light on curved horns, long dramatic shadows",
    cameraGear: "Canon EOS R3, 500mm wildlife lens, waterhole ground-level framing",
    texture: "dark scarred hide with mud and dust, massive curved boss horn, battle-worn body, red clay on legs",
    defaultArc: "Defender stands ground",
    driftRisk: "LOW",
  },
    Dolphin: {
    prey: ["Fish", "Sardines", "Mackerel", "Squid"],
    environment: "coastal ocean shallows and estuary mouth with sunbeams and surface chop",
    lighting: "bright underwater sun rays, caustic patterns on skin, realistic surface reflections, suspended particles in blue-green water",
    cameraGear: "Canon EOS R5, underwater housing, 24mm wide-angle, split-shot surface and underwater framing",
    texture: "smooth grey skin with subtle scars, water droplets in a breach, sleek dorsal fin cutting surface, realistic bubbles and spray",
    defaultArc: "Pack hunting strategy",
    driftRisk: "LOW",
  },
  Raccoon: {
    prey: ["Crayfish", "Fish", "Frog", "Bird Egg", "Mouse"],
    environment: "suburban backyard and creekside storm drain at night",
    lighting: "mixed porch light and moonlight, realistic low-light grain, wet highlights on fur, soft bokeh street lights in background",
    cameraGear: "Sony A7S III, 70-200mm telephoto zoom, handheld low-light documentary framing",
    texture: "grey fur with black facial mask, ringed tail detail, wet paw prints on concrete, whiskers catching light, subtle mud and water droplets",
    defaultArc: "Ambush attack",
    driftRisk: "MEDIUM",
  },
  Skunk: {
    prey: ["Mouse", "Grasshopper", "Grubs", "Bird Egg", "Snake"],
    environment: "suburban garden edge and brushy field transition at dusk",
    lighting: "soft overcast dusk light, porch-light spill on grass, warm highlights on black fur, deep shadows under shrubs",
    cameraGear: "Canon EOS R5, 200mm wildlife lens, ground-level stalking perspective",
    texture: "glossy black fur with crisp white stripes, raised tail plume, dust on paws, fine scent-spray mist visible when threatened",
    defaultArc: "Defender stands ground",
    driftRisk: "MEDIUM",
  },
  Opossum: {
    prey: ["Insects", "Snake", "Rat", "Bird Egg", "Carrion"],
    environment: "forested creek corridor near neighbourhood backyards at midnight",
    lighting: "cold moonlight with flashlight bounce, hard specular eye-shine, damp leaf-litter reflections, deep shadow falloff",
    cameraGear: "Canon EOS R5, 100mm macro-telephoto, close nocturnal wildlife framing with shallow depth of field",
    texture: "coarse grey fur with white guard hairs, pink nose and ears, long whiskers, scaly prehensile tail detail, wet leaf debris on coat",
    defaultArc: "Escape from danger",
    driftRisk: "MEDIUM",
  },
  "Red Fox": {
    prey: ["Rabbit", "Mouse", "Vole", "Squirrel"],
    environment: "snowy forest edge and suburban park trail at dawn",
    lighting: "cold winter dawn light, soft pink horizon glow, crisp rim light on fur, drifting snow particles, long blue shadows on snow",
    cameraGear: "Nikon Z8, 300mm wildlife lens, fast shutter pounce tracking",
    texture: "rust-red winter coat with white chest, black legs, white-tipped tail, fine frost on whiskers, paw prints pressed into fresh snow",
    defaultArc: "Chase and takedown",
    driftRisk: "MEDIUM",
  },
  Beaver: {
        prey: ["Black Bear", "Coyote", "Wolf", "River Otter"],
    environment: "freshwater riverbank beside a beaver dam and lodge at golden hour",
    lighting: "warm golden hour reflections on slow water, backlit spray droplets, soft haze over reeds, realistic shadow falloff under willows",
    cameraGear: "Canon EOS R5, 200mm wildlife lens, low riverbank framing at waterline",
    texture: "dark wet fur clumped in strands, flat paddle tail with scaly detail, orange incisors, water droplets beading on coat, mud on claws and whiskers",
    defaultArc: "Defender stands ground",
    driftRisk: "MEDIUM",
  },
  "River Otter": {
    prey: ["Fish", "Crayfish", "Frog", "Duckling"],
    environment: "rocky river rapids and lakeshore reeds in cool morning fog",
    lighting: "soft overcast light, silver water reflections, mist drifting above surface, natural splash highlights on wet fur",
    cameraGear: "Nikon Z9, 300mm wildlife lens, high shutter speed splash tracking",
    texture: "sleek waterproof brown fur, whiskers with water beads, webbed feet detail, smooth sliding motion on wet rocks, ripples and spray realism",
    defaultArc: "Chase and takedown",
    driftRisk: "MEDIUM",
  },
  Badger: {
    prey: ["Ground Squirrel", "Pocket Gopher", "Prairie Dog", "Snake"],
    environment: "open Great Plains grassland and prairie dog town in dusty afternoon heat",
    lighting: "harsh midday prairie sun, deep crisp shadows in burrow mounds, heat shimmer over grass, dust motes catching light",
    cameraGear: "Sony A1, 400mm super-telephoto, low-angle tracking across short grass",
    texture: "stocky low body, black-and-white facial stripe, coarse grizzled coat, powerful digging claws throwing soil, dust on nose and whiskers",
    defaultArc: "Territory dominance battle",
    driftRisk: "MEDIUM",
  },
  "Great Horned Owl": {
        prey: ["Rabbit", "Squirrel", "Skunk", "Mouse"],
    environment: "forest edge and open field under a bright moon with scattered clouds",
    lighting: "moonlit silhouette framing, faint blue ambient fill, subtle cloud-shadow movement, soft rim light on feather tufts",
    cameraGear: "Canon EOS R5, 600mm super-telephoto, silent flight dive tracking from treeline",
    texture: "intricate mottled brown feathers, prominent ear tufts, piercing yellow eyes, talons extended with feather separation, breath mist in cold air",
    defaultArc: "Ambush attack",
    driftRisk: "MEDIUM",
  },
    "White-tailed Deer": {
        prey: ["Mountain Lion", "Alligator", "Coyote", "Bobcat"],
    environment: "Midwestern forest edge and cornfield at dawn with low ground fog",
    lighting: "cold dawn fog, warm first sunlight through trees, dew highlights on coat, soft atmospheric haze across fields",
    cameraGear: "Canon EOS R5, 400mm super-telephoto, field-edge documentary framing",
    texture: "reddish-brown coat with grey winter tones, bright white tail flag raised in alarm, alert ear detail, wet grass brushing legs, breath visible in cool air",
    defaultArc: "Escape from danger",
    driftRisk: "MEDIUM",
  },
    "Wild Boar": {
    prey: ["Alligator", "Mountain Lion", "Black Bear", "Coyote"],
    environment: "Southern US pine woods and swamp edge with muddy wallows at dusk",
    lighting: "humid dusk light, warm amber sidelighting through pine trunks, wet mud reflections, heavy shadow pockets in brush",
    cameraGear: "Sony A1, 300mm wildlife lens, low ground tracking with aggressive motion blur on charge",
    texture: "coarse bristly dark hair, mud-caked hide, sharp tusk detail, foam on snout, churned-up wet soil and splashes",
    defaultArc: "Territory dominance battle",
    driftRisk: "MEDIUM",
  },
};

// ─────────────────────────────────────────────────────────────
// WEATHER VARIANTS
// ─────────────────────────────────────────────────────────────
export const weatherVariants: Record<Weather, string> = {
  "Golden Hour":    "golden hour, warm backlight, long shadows, warm 3200K colour temperature",
  "Storm":          "approaching storm, dramatic sky, god-rays breaking through clouds, desaturated palette, high contrast",
  "Overcast":       "soft overcast light, even diffuse illumination, no harsh shadows, true-to-life neutral colours",
  "Dawn":           "blue hour pre-dawn, cool 5500K ambient, low mist at ground level, first light on horizon",
  "Midday Heat":    "harsh midday sun, short crisp shadows, heat shimmer rising from ground, high contrast",
  "Winter Blizzard":"heavy snowfall, cold blue-white light, breath steam visible, snow-capped mountains in background, icy ground, 4200K arctic colour temperature",
  "Frozen Dusk":    "deep purple-orange frozen dusk, last light on snow, long blue shadows across white ground, breath mist catching fading sunlight",
};

// ─────────────────────────────────────────────────────────────
// EMOTIONAL TONES
// ─────────────────────────────────────────────────────────────
export const emotionalTones: EmotionalTone[] = [
  "Raw Tension", "Silent Dread", "Explosive Energy",
  "Calm Dominance", "Desperate Survival", "Haunting Stillness", "Primal Instinct",
];

export const emotionalTonePrompt: Record<EmotionalTone, { image: string; video: string; voiceover: string }> = {
  "Raw Tension": {
    image:     "palpable raw tension — both animals at the edge of movement, muscles coiled, the air itself feels dangerous",
    video:     "stillness broken only by micro-movements — breathing, ear flicks, weight shifts. Every frame loaded with impending motion.",
    voiceover: "The tension is unbearable. Every second could be the last moment of silence.",
  },
  "Silent Dread": {
    image:     "deep atmospheric dread — silence heavier than sound, shadows pressing in, a stillness that feels like a held breath",
    video:     "slow creeping dread — camera barely moves, subject pauses, environment reacts with subtle wind and distant sounds.",
    voiceover: "In this silence, something ancient stirs. The forest holds its breath.",
  },
  "Explosive Energy": {
    image:     "explosive kinetic energy — motion blur on extremities, muscles fully extended, environment reacting at full force",
    video:     "maximum kinetic force — full body acceleration, environmental scatter, ground reaction, limbs at full extension.",
    voiceover: "In a split second, everything erupts. Pure force. Pure instinct.",
  },
  "Calm Dominance": {
    image:     "quiet absolute dominance — predator utterly composed, zero urgency, radiating total control of its environment",
    video:     "unhurried deliberate movement — predator controls every step, eyes forward, environment parting around it.",
    voiceover: "No rush. No hesitation. This animal owns every inch of this land.",
  },
  "Desperate Survival": {
    image:     "raw survival desperation — wide eyes, full muscle engagement, survival instinct overriding everything else",
    video:     "desperate full-body flight — every muscle engaged for survival, ground churning, maximum speed.",
    voiceover: "This is not a choice. This is survive or perish — nothing in between.",
  },
  "Haunting Stillness": {
    image:     "haunting motionless presence — predator standing like a statue in mist, eyes glowing with quiet ancient intelligence",
    video:     "ghostly stillness — predator barely moves, mist drifts around it, environment falls eerily quiet.",
    voiceover: "It just stands there. Watching. Patient as time itself.",
  },
  "Primal Instinct": {
    image:     "pure primal instinct — raw animal energy, no thought, only reflex and evolutionary programming at work",
    video:     "pure instinctive movement — no hesitation, body acts before mind, ancient muscle memory in full execution.",
    voiceover: "Millions of years of evolution — all of it, firing at once.",
  },
};

// ─────────────────────────────────────────────────────────────
// ANIMAL VIBES
// ─────────────────────────────────────────────────────────────
export const animalVibes: AnimalVibe[] = [
  "BBC Earth Documentary", "National Geographic Wild", "Raw Nature Unfiltered",
  "David Attenborough Style", "Slow Motion Nature",
];

export const animalVibePrompt: Record<AnimalVibe, { style: string; camera: string; texture: string }> = {
  "BBC Earth Documentary": {
    style:   "BBC Earth cinematic documentary realism — perfect natural lighting, zero artifice, every detail anatomically precise",
    camera:  "professional wildlife documentary camera team — patient long-lens observation, animals completely unaware of camera",
    texture: "ultra-realistic fur/scale/feather detail — individual hairs visible, natural oils on coat, environmental debris on body",
  },
  "National Geographic Wild": {
    style:   "National Geographic Wild — dramatic composition, peak moment capture, story-driven framing",
    camera:  "National Geographic field camera — 400mm+ telephoto, maximum compression, subject isolation in natural environment",
    texture: "magazine-quality detail — razor-sharp on subject, natural environmental context visible, biological authenticity",
  },
  "Raw Nature Unfiltered": {
    style:   "raw unfiltered nature — no cinematic polish, this is nature as it actually is, imperfect and real",
    camera:  "handheld wildlife observation — slight natural shake, reactive framing, documentary truth over aesthetics",
    texture: "gritty authentic texture — mud, blood, saliva, environmental debris — nature is not clean",
  },
  "David Attenborough Style": {
    style:   "David Attenborough documentary aesthetic — warm educational gravitas, patient observation, reverence for nature",
    camera:  "classic wildlife documentary lens — wide establishing, slow zoom, patient observational framing",
    texture: "rich natural texture — warm colour grading, soft diffuse detail, nature presented with dignity and awe",
  },
  "Slow Motion Nature": {
    style:   "phantom camera slow motion wildlife — every micro-movement visible, physics of nature revealed at 1000fps aesthetic",
    camera:  "high-speed wildlife cinematography — motion blur on fast elements, crystalline clarity on impact moments",
    texture: "hyper-detailed slow-motion texture — water droplets mid-air, fur rippling in slow waves, muscle fibre definition",
  },
};

// ─────────────────────────────────────────────────────────────
// ARC UTILITIES
// ─────────────────────────────────────────────────────────────
export function coerceArc(x: string): Arc {
  return (arcs.includes(x as Arc) ? x : "Chase and takedown") as Arc;
}

export function suggestArc(predator: string, prey: string, fallback: string): string {
    const normalize = (v: string) => {
    if (v === "American Alligator") return "Alligator";
    if (v === "Coyote Pack") return "Coyote";
    if (v === "Brown Bear") return "Grizzly Bear";
    return v;
  };
  const p = normalize(predator);
  const r = normalize(prey);
  if (!p || !r) return fallback;
    if (p === "Wolf Pack" && ["Elk", "Deer", "White-tailed Deer", "Mule Deer", "Moose Calf"].includes(r)) return "Pack hunting strategy";
  if (p === "Wolf" && ["Elk", "Deer", "White-tailed Deer", "Mule Deer"].includes(r)) return "Chase and takedown";
  if (p === "Orca" || p === "African Wild Dog" || p === "Dolphin") return "Pack hunting strategy";
  if (p === "Jaguar" && r === "Caiman") return "Ambush attack";
  if (p === "Crocodile" && ["Zebra", "Buffalo", "Antelope"].includes(r)) return "Ambush attack";
  if (p === "Nile Crocodile") return "Ambush attack";
  if (p === "Eagle" || p === "Golden Eagle" || p === "Bald Eagle") return "Chase and takedown";
  if (p === "Harpy Eagle") return "Ambush attack";
  if (p === "Shark" || p === "Cheetah") return "Chase and takedown";
  if (p === "Lion" && r === "Buffalo") return "Territory dominance battle";
  if (["Tiger", "Siberian Tiger", "Snow Leopard", "Komodo Dragon", "Jaguar", "Puma", "Polar Bear", "Cougar", "Mountain Lion", "Bobcat", "Alligator"].includes(p)) return "Ambush attack";
  if ((p === "Grizzly Bear" && r === "Bison") || (p === "Grizzly Bear" && r === "Moose")) return "Giant vs giant clash";
if ((p === "Grizzly Bear" || p === "Black Bear") && r === "Salmon") return "Chase and takedown";
if (p === "Wolverine" || p === "Grizzly Bear" || p === "Black Bear") return "Territory dominance battle";
  if (p === "Saltwater Crocodile" || p === "Leopard Seal" || p === "Black Mamba") return "Ambush attack";
  if (p === "African Lion Male") return "Territory dominance battle";
  if (p === "Tasmanian Devil") return "Predator vs predator fight";
    if (p === "Chimpanzee") return "Pack hunting strategy";
  if (p === "Bison" && r === "Grizzly Bear") return "Giant vs giant clash";
  if (p === "Moose" && r === "Grizzly Bear") return "Giant vs giant clash";
  if (["Bison", "Moose", "Bull Elk", "Musk Ox", "Cape Buffalo"].includes(p)) return "Defender stands ground";
  return fallback;
}

export function capitalizeFirst(t: string): string {
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
}

// ─────────────────────────────────────────────────────────────
// VIRAL SCORE CALCULATOR
// ─────────────────────────────────────────────────────────────
export function calculateViralScore(
  pkg: GeneratedPackage,
  predator: string,
  prey: string,
  arc: Arc,
  weather: Weather,
  pipelineStyle: "3-shot" | "5-shot"
): ViralScore {
  const scores: { label: string; score: number; tip: string }[] = [];
  const hook = pkg.hook2026?.[0] ?? pkg.hook;
  const hookLower = hook.toLowerCase();

  // Hook strength (0–20)
  const hookScore = Math.max(0, Math.min(20,
    (hook.length <= 68 ? 6 : 3) +
    (/[\u{1F300}-\u{1FFFF}]/u.test(hook) ? 3 : 0) +
    (hookLower.includes(predator.toLowerCase()) || hookLower.includes(prey.toLowerCase()) ? 5 : 1) +
    (/mistake|late|wrong|seconds|territory|surrounded|react|danger|locked|trouble|boundary/.test(hookLower) ? 6 : 1) -
    (/watch the last|nobody expected|once in a lifetime|scientists say|you won't believe/.test(hookLower) ? 4 : 0)
  ));
  scores.push({ label: "Hook Strength", score: hookScore, tip: hookScore >= 16 ? "Strong hook ✓" : "Use animal name + immediate danger + one clear consequence" });

  // Watch time (0–25)
    const wtScore = pipelineStyle === "5-shot" ? 20 : 18;
     scores.push({ label: "Watch Time Setup", score: wtScore, tip: pipelineStyle === "5-shot" ? "5-shot pipeline = strong story retention ✓" : "3-shot pipeline = strong short-form retention ✓" });

  // USA optimization (0–20)
  const usaArcs: Arc[] = ["Defender stands ground", "Giant vs giant clash", "Territory dominance battle", "Pack hunting strategy"];
    const usaAnimals = ["Bison", "Grizzly Bear", "Black Bear", "Bald Eagle", "Mountain Lion", "Wolf", "Wolf Pack", "Bull Elk", "Moose", "Alligator", "White-tailed Deer"];
  const usaWeather: Weather[] = ["Golden Hour", "Winter Blizzard", "Frozen Dusk"];
  const usaScore = Math.min(20,
    (usaArcs.includes(arc) ? 8 : 4) +
        ((usaAnimals.includes(predator) && usaAnimals.includes(prey)) ? 8 : ((usaAnimals.includes(predator) || usaAnimals.includes(prey)) ? 6 : 3)) +
    (usaWeather.includes(weather) ? 5 : 2)
  );
    scores.push({ label: "USA Audience Fit", score: usaScore, tip: usaScore >= 16 ? "USA-optimized ✓" : "Use Wolf Pack/Bison/Alligator/Mountain Lion + strong clash or ambush arcs" });

  // Originality (0–20)
  const origScore = Math.min(20,
    (pkg.veo3Shots ? 7 : 0) + (pkg.qualitySummary ? 6 : 0) + (pkg.sceneDesc ? 7 : 3)
  );
  scores.push({ label: "Originality Signal", score: origScore, tip: origScore >= 16 ? "High originality ✓" : "Enable Quality Controls + add Scene Description" });

  // Emotional impact (0–15)
    const highEmotionArcs: Arc[] = ["Giant vs giant clash", "Defender stands ground", "Escape from danger", "Ambush attack", "Pack hunting strategy"];
  const emotScore = Math.min(15,
    (highEmotionArcs.includes(arc) ? 8 : 5) + ((pkg.caption2026?.length ?? 0) > 200 ? 7 : 4)
  );
    scores.push({ label: "Emotional Impact", score: emotScore, tip: emotScore >= 12 ? "Strong emotional arc ✓" : "Use clash, ambush, pack-pressure, or escape arcs + story-based caption" });

  const total = scores.reduce((s, x) => s + x.score, 0);
  const verdict: ViralScore["verdict"] =
    total >= 80 ? "🔥 Viral Potential" : total >= 65 ? "⭐ Good" : total >= 50 ? "✅ Decent" : "⚠️ Needs Work";
  const weakest = [...scores].sort((a, b) => a.score - b.score)[0];

  return {
    total,
    hookScore: scores[0].score,
    watchTimeScore: scores[1].score,
    usaOptimizationScore: scores[2].score,
    originalityScore: scores[3].score,
    emotionalScore: scores[4].score,
    breakdown: scores,
    verdict,
    topTip: weakest.tip,
  };
}

// ─────────────────────────────────────────────────────────────
// BULK ITEMS BUILDER
// ─────────────────────────────────────────────────────────────
export function buildBulkItems(predator: string, preset: PredatorInfo): BulkItem[] {
  const items: BulkItem[] = [];
    const weathers: Weather[] = ["Dawn", "Golden Hour", "Overcast", "Storm"];
    const topArcs: Arc[] = ["Ambush attack", "Pack hunting strategy", "Defender stands ground", "Giant vs giant clash"];

  preset.prey.slice(0, 3).forEach((prey) => {
    weathers.slice(0, 2).forEach((w) => {
      const arc = coerceArc(suggestArc(predator, prey, preset.defaultArc));
      items.push({
        id: `${predator}-${prey}-${w}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        predator, prey, arc, weather: w, status: "pending",
      });
    });
  });

  topArcs.slice(0, 2).forEach((arc) => {
    if (preset.prey[0]) {
      items.push({
        id: `${predator}-${preset.prey[0]}-arc-${arc}-${Math.random().toString(36).slice(2, 6)}`,
        predator, prey: preset.prey[0], arc, weather: "Golden Hour", status: "pending",
      });
    }
  });

    return items.slice(0, 6);
}

// ─────────────────────────────────────────────────────────────
// FIVE SHOT BUILDERS
// ─────────────────────────────────────────────────────────────
export function buildFiveShotCinematic(
  predator: string, prey: string, env: string, arc: Arc,
  weather: Weather, runwayModel: RunwayModel, klingModel: KlingModel,
  emotionalTone: EmotionalTone, animalVibe: AnimalVibe, quality?: QualityOptions
): FiveShotPlan {
  const w    = weatherVariants[weather];
  const tone = emotionalTonePrompt[emotionalTone];
  const vibe = animalVibePrompt[animalVibe];
  const rN   = RUNWAY_STYLE_NOTE[runwayModel];
  const kN   = KLING_STYLE_NOTE[klingModel];
  const qL   = buildQualityLead(quality);

    return {
    style: "cinematic",
    shot1: `[RUNWAY ${runwayModel}] SHOT 1 — OPENING TENSION (0–4s):\n${rN}\n${qL}\nReadable first frame: ${predator} clearly visible with immediate threat presence and ${prey} also readable in the setup, ${env}, ${w}. No empty setup. Clear subject separation, visible pressure instantly, mobile-friendly composition. ${tone.image}. Motion strength: 38.`,
    shot2: `[RUNWAY ${runwayModel}] SHOT 2 — PRESSURE BUILD (4–12s):\n${rN}\nWide readable setup — ${predator} and ${prey} both clearly visible in ${env}, ${w}. ${predator} closes pressure once or compresses low once. ${prey} reacts once and loses comfort immediately. Slow cinematic push-in only if subject readability stays clean. ${vibe.camera}. Motion strength: 46.`,
    shot3: `[KLING ${klingModel}] SHOT 3 — TENSION LOCK (12–22s):\n${kN}\nKeep both animals readable in ${env}, ${w}. ${predator} loads forward pressure with grounded weight transfer. ${prey} senses danger once, snaps attention up, and holds in visible survival tension. ${tone.video} Clear body language, no chaotic overlap, tension fully readable. CFG Scale: 0.50.`,
    shot4: `[KLING ${klingModel}] SHOT 4 — ACTION PRESSURE (22–36s):\n${kN}\nKeep the action readable in ${env}, ${w}. ${predator} commits with clear grounded biomechanics, visible weight transfer, and one decisive forward release. ${prey} reacts with full survival motion and readable escape pressure. Ground reacts: dust/snow/leaves scatter. [Audio: impact, breathing, SFX] Fixed wide if needed for clean body readability. CFG Scale: 0.65.`,
    shot5: `[RUNWAY ${runwayModel}] SHOT 5 — RESOLVED TENSION (36–48s):\n${rN}\n${predator} remains clearly readable in ${env}, ${w} after the action beat. Keep the ending simple, dominant, and visually clean for mobile. ${emotionalTone === "Calm Dominance" ? "Absolute stillness. Total ownership." : "Heavy breath. Eyes forward. Pressure still lingers."} ${vibe.camera}. End on a strong readable final frame with loop-ready clarity. Motion strength: 30.`,
    totalDuration: "38–48 seconds",
    watchTimeNote: "Balanced story mode: keep the opening instantly readable, keep the middle escalating, and keep the full runtime tight enough for stronger completion on short-form platforms.",
    captionTip: "Keep burned-in captions very short and readable. The first caption should help the opening frame read instantly: LOOK / DANGER / IMPACT / ESCAPE / WHO WON?",
  };
}

export function buildFiveShotViral(
  predator: string, prey: string, env: string, arc: Arc,
  weather: Weather, runwayModel: RunwayModel, klingModel: KlingModel,
  emotionalTone: EmotionalTone, animalVibe: AnimalVibe, quality?: QualityOptions
): FiveShotPlan {
  const w        = weatherVariants[weather];
  const tone     = emotionalTonePrompt[emotionalTone];
  const vibe     = animalVibePrompt[animalVibe];
  const rN       = RUNWAY_STYLE_NOTE[runwayModel];
  const kN       = KLING_STYLE_NOTE[klingModel];
  const qL       = buildQualityLead(quality);
  const isWinter = weather === "Winter Blizzard" || weather === "Frozen Dusk";
  const groundFX = isWinter ? "snow exploding, breath clouds colliding" : "dust scattering, earth churning";

    return {
    style: "viral",
    shot1: `[RUNWAY ${runwayModel}] SHOT 1 — OPENING TENSION (0–3s):\n${rN}\n${qL}\nReadable first frame: ${predator} clearly visible with immediate threat presence, ${prey} also readable in the same setup, ${env}, ${w}. No empty setup. Clear subject separation, visible tension instantly, mobile-friendly composition. ${tone.image}. Camera nearly locked. Motion strength: 36.`,
    shot2: `[RUNWAY ${runwayModel}] SHOT 2 — PRESSURE BUILD (3–10s):\n${rN}\n${predator} and ${prey} remain clearly readable in ${env}, ${w}. ${predator} closes pressure once or compresses low once. ${prey} reacts once and loses visual comfort. Slow push-in only if composition stays clean on mobile. Build tension immediately. ${vibe.camera}. Motion strength: 50.`,
    shot3: `[KLING ${klingModel}] SHOT 3 — ACTION PRESSURE (10–20s):\n${kN}\nFixed wide for full-body readability in ${env}, ${w}. Both animals commit with clear biomechanics, grounded weight transfer, and visible impact path. Full body physics: ${groundFX}. [Audio: deep collision, animal sounds, environmental scatter]. Keep the action readable, not chaotic. CFG Scale: 0.65.`,
    shot4: `[KLING ${klingModel}] SHOT 4 — REACTION PRESSURE (20–34s):\n${kN}\nKeep the frame readable in ${env}, ${w}. ${prey} loses balance, space, or forward confidence once. ${predator} holds pressure without chaotic movement. Ground still settling, momentum shift clearly visible, survival tension still active. CFG Scale: 0.50.`,
    shot5: `[RUNWAY ${runwayModel}] SHOT 5 — RESOLVED TENSION (34–48s):\n${rN}\n${predator} remains clearly readable in ${env}, ${w} with calm control after the pressure shift. Keep the ending simple, dominant, and loop-friendly. Low angle only if subject readability stays clean on mobile. ${vibe.camera}. End on a strong readable winner frame. "Who won? Comment 👇" Motion strength: 28.`,
    totalDuration: "38–48 seconds",
    watchTimeNote: "This 38–48s version keeps the story readable while protecting short-form retention and first-frame impact.",
    captionTip: "Use short burned-in caption beats that read instantly: LOOK / PRESSURE / IMPACT / TURN / COMMENT. Keep the first caption readable in the opening second.",
  };
}

// ─────────────────────────────────────────────────────────────
// WATCH TIME REPORT
// ─────────────────────────────────────────────────────────────
export function buildWatchTimeReport(
  pipelineStyle: "3-shot" | "5-shot",
  dailyReels = 2
): WatchTimeReport {
    const secs            = pipelineStyle === "3-shot" ? 25 : 45;
  const watchMinsPerView = secs / 60;
  const goalMinutes     = 600_000;
  const avgViewsPerReel = 5_000;
  const dailyMins       = Math.round(dailyReels * avgViewsPerReel * watchMinsPerView);
  const daysToGoal      = Math.ceil(goalMinutes / Math.max(dailyMins, 1));

  return {
    currentDuration:          `~${secs} seconds`,
        targetDuration:           "Aim for 22–28s on fast viral runs and 38–48s on stronger story builds",
    watchTimePerView:         `${watchMinsPerView.toFixed(2)} min/view`,
    viewsNeededFor600k:       Math.ceil(goalMinutes / watchMinsPerView),
    daysToGoal,
    estimatedMonthlyEarnings: "Variable — depends on audience, eligibility, format mix, and actual dashboard RPM.",
    usaCPMNote:               "Use revenue estimates only as planning ranges. Meta payout varies by format, region, originality, advertiser demand, and beta access.",
    tipsToIncrease: [
            "Make the first 1–3 seconds instantly readable with visible predator pressure and no slow setup.",
      "Use on-screen captions because many viewers watch muted on mobile.",
            "Keep shot transitions motivated by tension change, collision setup, or escape pressure.",
      "Post consistently and test multiple time windows with Facebook Insights.",
      "Favor original footage/prompt outputs over reposts or low-value edits.",
      "Pin your best-performing welcome reel in the Featured section for conversion.",
      "Mix reels with photo/text/story posts if you gain Content Monetization beta access.",
    ],
  };
}

// ─────────────────────────────────────────────────────────────
// USA POSTING TIMES
// ─────────────────────────────────────────────────────────────
export function getUSAPostingTimes(): PostingDay[] {
  return [
    {
      day: "Weekday test window A",
      slots: [
        { zone: "EST (New York)", time: "8:00 AM – 10:00 AM", why: "Strong weekday morning engagement window in multiple 2025–2026 studies.", priority: "🔥" },
        { zone: "CST (Chicago)",  time: "7:00 AM – 9:00 AM",  why: "Matches commuter + early-work scroll behavior.",                          priority: "⭐" },
        { zone: "PST (Los Angeles)", time: "5:00 AM – 7:00 AM", why: "Useful for reaching East + Central time zones early.",                  priority: "✅" },
      ],
    },
    {
      day: "Weekday test window B",
      slots: [
        { zone: "EST (New York)", time: "12:00 PM – 3:00 PM", why: "Midday window often performs well for Facebook posts and reels.", priority: "🔥" },
        { zone: "CST (Chicago)",  time: "11:00 AM – 2:00 PM", why: "Lunch + break-time viewing window.",                             priority: "⭐" },
        { zone: "PST (Los Angeles)", time: "9:00 AM – 12:00 PM", why: "Keeps the same midday pattern across zones.",                priority: "✅" },
      ],
    },
    {
      day: "Weekend test window",
      slots: [
        { zone: "EST (New York)", time: "10:00 AM – 1:00 PM", why: "Useful starting point for weekend experiments.",       priority: "🔥" },
        { zone: "CST (Chicago)",  time: "9:00 AM – 12:00 PM", why: "Captures relaxed weekend browsing.",                  priority: "⭐" },
        { zone: "PST (Los Angeles)", time: "8:00 AM – 11:00 AM", why: "Lets one upload hit all major US zones reasonably well.", priority: "✅" },
      ],
    },
  ];
}

// ─────────────────────────────────────────────────────────────
// CALENDAR HELPERS
// ─────────────────────────────────────────────────────────────
function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function shiftArray<T>(arr: T[], shift: number): T[] {
  if (!arr.length) return arr;
  const s = ((shift % arr.length) + arr.length) % arr.length;
  return [...arr.slice(s), ...arr.slice(0, s)];
}

export function generateMonthlyCalendar(
  primaryPredator: string,
  primaryPrey: string,
  primaryArc: string,
  monthDate: Date
): CalendarDay[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

      const rotations = [
    { predator: primaryPredator || "Mountain Lion", prey: primaryPrey || "White-tailed Deer", arc: primaryArc || "Ambush attack" },
    { predator: "Bison",         prey: "Grizzly Bear",      arc: "Giant vs giant clash" },
    { predator: "Alligator",     prey: "Wild Boar",         arc: "Ambush attack" },
    { predator: "Wolf Pack",     prey: "Elk",               arc: "Pack hunting strategy" },
    { predator: "Alligator",     prey: "White-tailed Deer", arc: "Ambush attack" },
    { predator: "Coyote",        prey: "Jackrabbit",        arc: "Chase and takedown" },
    { predator: "Bull Elk",      prey: "Mountain Lion",     arc: "Defender stands ground" },
    { predator: "Moose",         prey: "Wolf Pack",         arc: "Defender stands ground" },
    { predator: "Grizzly Bear",  prey: "Salmon",            arc: "Chase and takedown" },
    { predator: "Bald Eagle",    prey: "Rabbit",            arc: "Chase and takedown" },
  ];

    const themes = [
    "🦬 Giants Clash Week", "🐺 Pack Pressure Week", "🐊 Water Ambush Week",
    "🦅 Sky Strike Week", "🫎 Defender Week", "🌲 Forest Edge Week",
    "🏔️ Rocky Mountain Week", "🇺🇸 USA Wildlife Week",
  ];

  const hookTemplates = [
  (_predator: string, prey: string) => `${prey} froze for one second. ⚠️`,
  (_predator: string, prey: string) => `The ${prey.toLowerCase()} looked up too late. 👀`,
  (predator: string, prey: string) => `${predator} vs ${prey} — the pressure starts instantly. 🔥`,
  () => `No slow setup. The threat is immediate. ⚡`,
  () => `This turned dangerous before the chase even started. 🎬`,
  () => `The first second already feels wrong. 👁️`,
  (predator: string) => `This is why ${predator.toLowerCase()}s control the opening frame. 🧠`,
  () => `The trap was already closing. ⚠️`,
  (predator: string) => `${predator} stayed calm and took space fast. 🔥`,
  (_predator: string, prey: string) => `${prey} almost found an escape lane. Almost. 😳`,

  (predator: string) => `This ${predator.toLowerCase()} picked the exact right moment. 🎯`,
  (_predator: string, prey: string) => `${prey} had one safe lane and lost it. 😮`,
  (predator: string, prey: string) => `${predator} was already too close when the ${prey.toLowerCase()} reacted. ⚠️`,
  () => `This sequence gets worse every second. 👀`,
  () => `The danger was readable immediately. 🔥`,
  (predator: string) => `This side of a ${predator.toLowerCase()} feels real fast. 🎬`,
  (_predator: string, prey: string) => `The ${prey.toLowerCase()} hesitated once. That was enough. ⚡`,
  (predator: string, prey: string) => `${predator} vs ${prey} — no wasted motion here. 🧠`,
  () => `You can feel the collision coming from the start. 👁️`,
  (predator: string) => `${predator} never gave up the pressure. ❄️`,

  (_predator: string, prey: string) => `The ${prey.toLowerCase()} saw the threat late. Very late. ⚠️`,
  (predator: string) => `This ${predator.toLowerCase()} never rushed the opening. 🐾`,
  () => `It looked readable for one second, then brutal. 🔥`,
  (_predator: string, prey: string) => `${prey} almost created space, then lost it. 😳`,
  (predator: string, prey: string) => `${predator} vs ${prey} — timing decides everything. ⏱️`,
  () => `The opening disappeared in a second. ⚡`,
  (predator: string) => `This is why ${predator.toLowerCase()}s control encounters early. 👑`,
  (_predator: string, prey: string) => `The ${prey.toLowerCase()} was moving, but never free. 👀`,
  () => `The whole mood changes before full action starts. 🎬`,
  (predator: string, prey: string) => `${predator} boxed the ${prey.toLowerCase()} in before panic fully hit. 🧠`,
];

  const durations = ["22–28s (3-Shot Fast Viral)", "38–48s (5-Shot Viral)"];
  const seed = hashString(`${primaryPredator}|${primaryPrey}|${primaryArc}|${year}|${month}`);
  const rC = shiftArray(rotations, seed % rotations.length);
  const rT = shiftArray(themes, seed % themes.length);
  const rH = shiftArray(hookTemplates, seed % hookTemplates.length);
  const rD = shiftArray(durations, seed % durations.length);

  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const r1 = rC[(day - 1) % rC.length];
    const r2 = rC[day % rC.length];
    const totalVideos = day * 2;
    return {
      day,
      dateLabel: new Date(year, month, day).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      weekday:   new Date(year, month, day).toLocaleDateString(undefined, { weekday: "short" }),
      reel1: { predator: r1.predator, prey: r1.prey, arc: r1.arc, hook: rH[(day - 1) % rH.length](r1.predator, r1.prey), duration: rD[(day - 1) % rD.length] },
      reel2: { predator: r2.predator, prey: r2.prey, arc: r2.arc, hook: rH[day % rH.length](r2.predator, r2.prey),         duration: rD[day % rD.length] },
      theme: rT[Math.floor((day - 1) / 4) % rT.length],
            cmpNote: totalVideos >= 30 ? `🔥 CMP: ${totalVideos} videos — strong consistency signal • first-frame tension priority` : totalVideos >= 5 ? `✅ CMP: ${totalVideos} videos posted • keep openings fast and readable` : `⏳ CMP: ${totalVideos}/5 videos minimum • prioritize immediate readable tension`,
    };
  });
}

function getUSAMonthSeason(monthIndex: number) {
  if ([11, 0, 1].includes(monthIndex)) return { season: "Winter", themes: ["❄️ Snow Survival Week", "🦬 Yellowstone Giants Week", "🐺 Pack Pressure Week", "🧊 Frozen Ambush Week", "🦅 Harsh Elements Week", "🔥 Shock Ending Week"], environment: "snow, cold breath, low-sun tension" };
    if ([2, 3, 4].includes(monthIndex))  return { season: "Spring", themes: ["🌿 Forest Edge Week", "🦌 Deer Pressure Week", "🐊 Wetland Ambush Week", "🦅 Fresh Growth Week", "🐺 Fast Chase Week", "🔥 Shock Ending Week"],           environment: "fresh brush, woodland edge, spring light" };
    if ([5, 6, 7].includes(monthIndex))  return { season: "Summer", themes: ["☀️ Heatwave Week", "🏜️ Dry Ground Week", "🐊 Everglades Ambush Week", "🦬 Dust Clash Week", "🦅 Open Sky Week", "🔥 Shock Ending Week"],              environment: "dust, heat shimmer, dry scrubland" };
    return { season: "Fall", themes: ["🍂 Rut Season Week", "🦌 Elk Pressure Week", "🐺 Migration Pressure Week", "🪨 Rocky Ambush Week", "🦅 Golden Light Week", "🔥 Shock Ending Week"], environment: "golden brush, migration tension, cold dusk" };
}

export function generateUSAViral30DayCalendar(
  primaryPredator: string,
  primaryPrey: string,
  primaryArc: string,
  seedDate: Date
): CalendarDay[] {
  const year = seedDate.getFullYear();
  const month = seedDate.getMonth();
  const seasonPack = getUSAMonthSeason(month);

      const rotations = [
    { predator: primaryPredator || "Mountain Lion", prey: primaryPrey || "White-tailed Deer", arc: primaryArc || "Ambush attack" },
    { predator: "Grizzly Bear",   prey: "Bison",              arc: "Giant vs giant clash" },
    { predator: "Wolf Pack",      prey: "Elk",                arc: "Pack hunting strategy" },
    { predator: "Mountain Lion",  prey: "Mule Deer",          arc: "Ambush attack" },
    { predator: "Bobcat",         prey: "Wild Turkey",        arc: "Ambush attack" },
    { predator: "Bald Eagle",     prey: "Rabbit",             arc: "Chase and takedown" },
    { predator: "Alligator",      prey: "White-tailed Deer",  arc: "Ambush attack" },
    { predator: "Alligator",      prey: "Wild Boar",          arc: "Ambush attack" },
    { predator: "Coyote",         prey: "Jackrabbit",         arc: "Chase and takedown" },
    { predator: "Bull Elk",       prey: "Mountain Lion",      arc: "Defender stands ground" },
    { predator: "Moose",          prey: "Wolf Pack",          arc: "Defender stands ground" },
    { predator: "Black Bear",     prey: "Salmon",             arc: "Chase and takedown" },
  ];

    const hookTemplates = [
  (_predator: string, prey: string) => `${prey} froze for one second. ⚠️`,
  (predator: string, prey: string) => `${predator} was already too close when the ${prey.toLowerCase()} reacted. 👀`,
  (predator: string, prey: string) => `${predator} vs ${prey} — the pressure starts immediately. 🔥`,
  () => `No slow setup. The threat is instant. 🎬`,
  (predator: string) => `This is why ${predator.toLowerCase()}s feel dangerous up close. ⚡`,
  (_predator: string, prey: string) => `The ${prey.toLowerCase()} had almost no escape lane. 😳`,
  () => `The first second already tells you this is bad. 👁️`,
  (predator: string) => `${predator} stayed calm and closed the space fast. 🧠`,
  () => `Comment who controlled the encounter first. 👇`,
  (_predator: string, prey: string) => `${prey} reacted late and paid for it. ⚠️`,
];

const durations = ["22–28s (3-Shot Fast Viral)", "45–55s (5-Shot Viral)"];
  const seed = hashString(`${primaryPredator}|${primaryPrey}|${primaryArc}|usa30|${year}|${month}`);
  const rC = shiftArray(rotations, seed % rotations.length);
  const rT = shiftArray(seasonPack.themes, seed % seasonPack.themes.length);
  const rH = shiftArray(hookTemplates, seed % hookTemplates.length);
  const rD = shiftArray(durations, seed % durations.length);

  return Array.from({ length: 30 }, (_, i) => {
    const day = i + 1;
    const r1 = rC[(day - 1) % rC.length];
    const r2 = rC[(day + 2) % rC.length];
    const totalVideos = day * 2;
    const baseCmpNote = `🇺🇸 USA viral mode • first-frame readable tension • test EST 8–10 AM or 12–3 PM • ${seasonPack.season} angle: ${seasonPack.environment}`;
    return {
      day,
      dateLabel: new Date(year, month, day).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      weekday:   new Date(year, month, day).toLocaleDateString(undefined, { weekday: "short" }),
      reel1: { predator: r1.predator, prey: r1.prey, arc: r1.arc, hook: rH[(day - 1) % rH.length](r1.predator, r1.prey), duration: rD[(day - 1) % rD.length] },
      reel2: { predator: r2.predator, prey: r2.prey, arc: r2.arc, hook: rH[(day + 1) % rH.length](r2.predator, r2.prey), duration: rD[day % rD.length] },
      theme: rT[Math.floor((day - 1) / 5) % rT.length],
      cmpNote: totalVideos >= 30 ? `🔥 ${baseCmpNote} • ${totalVideos} reels planned so far` : baseCmpNote,
    };
  });
}

// ─────────────────────────────────────────────────────────────
// ORIGINALITY CHECKLIST
// ─────────────────────────────────────────────────────────────
export function getOriginalityChecklist(): OriginalityItem[] {
  return [
    { check: "Original content only",          tip: "Create or meaningfully transform the content yourself. Minor edits to someone else's clip can be deprioritized or demonetized.",                             critical: true,  source: "Meta original content guidelines" },
    { check: "Avoid low-value reuploads",       tip: "Borders, speed changes, stitched clips, or simple reaction overlays are not enough on their own.",                                                          critical: true,  source: "Meta original content guidelines" },
    { check: "Use clear AI transparency",       tip: "When publishing fully synthetic or heavily edited photoreal content, add a clear disclosure or use available AI labels.",                                    critical: true,  source: "Meta AI labeling guidance" },
        { check: "Burned-in captions added",        tip: "Use short burned-in captions that help the first 1–3 seconds read instantly on mute, especially during the opening tension beat.",                           critical: true,  source: "Cross-platform video best practice" },
        { check: "Strong first-frame hook",         tip: "Make the first shot instantly readable with visible predator pressure, clear subject separation, and no slow empty setup.",                                   critical: true,  source: "Creative best practice" },
        { check: "Consistent posting + testing",    tip: "Test 1–2 Facebook reels per day only if opening-frame quality stays high; reduce volume if the first seconds become weak or repetitive.",                    critical: false, source: "Buffer 2026 frequency guidance" },
    { check: "Check Professional Dashboard",    tip: "Facebook Content Monetization beta is invite-based. Keep checking your Professional Dashboard for access and policy status.",                                critical: true,  source: "Meta Content Monetization beta" },
        { check: "Feature your best welcome reel",  tip: "Use the Page Featured section to pin the reel with the clearest first-frame tension and strongest U.S.-readable wildlife setup.",                             critical: false, source: "Meta Business Help Center" },
  ];
}

// ─────────────────────────────────────────────────────────────
// CMP EARNINGS TABLE
// ─────────────────────────────────────────────────────────────
export function getCMPEarningsTable(): EarningsEstimate[] {
  return [
    { views: 10_000,   minEarnings: "$0",    maxEarnings: "$25",    usaOptimized: "planning only" },
    { views: 50_000,   minEarnings: "$10",   maxEarnings: "$125",   usaOptimized: "planning only" },
    { views: 100_000,  minEarnings: "$25",   maxEarnings: "$250",   usaOptimized: "planning only" },
    { views: 500_000,  minEarnings: "$100",  maxEarnings: "$1,250", usaOptimized: "planning only" },
    { views: 1_000_000,minEarnings: "$250",  maxEarnings: "$2,500", usaOptimized: "planning only" },
  ];
}
