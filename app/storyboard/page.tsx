"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type ReelSettings = {
  subject: string;
  opponent: string;
  environment: string;
  lighting: string;
  visualStyle: string;
  aspectRatio: string;
  reelType: string;
  totalDuration: string;
  safetyRule: string;
};

type Shot = {
  id: number;
  label: string;
  title: string;
  frameDescription: string;
  nanoBananaPrompt: string;
  gptImage2Prompt: string;
  runwayPrompt: string;
  bestFrameReuse: string;
  continuityLock: string;
};

const workflowSteps = [
  "ChatGPT Storyboard",
  "Master Frames (Runway / Nano Banana / GPT Image 2)",
  "Runway Gen-4 Image to Video",
  "Best Frame Reuse for Next Shot",
  "CapCut / Facebook Editor Final Reel",
];

type PresetShotTemplate = {
  label: Shot["label"];
  frameDescription: string;
  masterFrame: string;
  motion: string;
  bestFrameReuse: string;
};

type WildlifePreset = {
  id: string;
  name: string;
  subject: string;
  opponent: string;
  environment: string;
  lighting: string;
  visualStyle: string;
  reelType: string;
  terrainContinuity: string;
  shotTemplates: [
    PresetShotTemplate,
    PresetShotTemplate,
    PresetShotTemplate,
    PresetShotTemplate,
    PresetShotTemplate,
  ];
};

const wildlifePresets: [WildlifePreset, ...WildlifePreset[]] = [
  {
    id: "alligator-deer-riverbank",
    name: "Alligator vs White-tailed Deer — North American Riverbank",
    subject: "American alligator",
    opponent: "White-tailed deer",
    environment:
      "muddy North American riverbank with shallow brown water, reeds, exposed roots, and an open escape lane along the bank",
    lighting: "warm golden-hour side light reflecting off wet mud and rippled water",
    visualStyle:
      "Photorealistic wildlife documentary, cinematic realism, strong survival tension, grounded riverbank physics",
    reelType: "25s riverbank ambush survival reel",
    terrainContinuity: "muddy river edge, reed line, shallow water strip, exposed roots, and the open escape lane",
    shotTemplates: [
      {
        label: "Hook",
        frameDescription:
          "Both animals are visible in a vertical documentary frame: the alligator lies half-submerged near the reeds while the deer steps close to the muddy bank, with a clear open escape lane behind the deer.",
        masterFrame:
          "American alligator half-hidden at the left waterline, white-tailed deer fully visible on the right muddy bank, open escape lane between reeds and exposed roots, tense eye-line, full-body readability for both animals",
        motion:
          "The deer lowers its head toward the bank while the alligator stays nearly still, only the eyes and waterline shifting subtly.",
        bestFrameReuse: "Use the clearest end frame with both animals visible and the deer near the open bank as the image base for Shot 2.",
      },
      {
        label: "Trigger",
        frameDescription:
          "The alligator begins a sudden forward surge from the waterline; the deer snaps its head up and starts to spring backward into the escape lane.",
        masterFrame:
          "American alligator breaking from shallow water with front body visible, white-tailed deer reacting fast with raised head and tense legs, splash starting at the river edge, escape lane still readable",
        motion:
          "From the reused frame, the alligator lunges forward with a short water splash as the deer jolts backward and pivots toward the open lane.",
        bestFrameReuse: "Reuse the sharpest frame where the alligator surge and deer reaction are both readable as the image base for Shot 3.",
      },
      {
        label: "Escalation",
        frameDescription:
          "The deer accelerates along the muddy bank while the alligator surges partly out of the water, creating a near-collision without contact or injury.",
        masterFrame:
          "white-tailed deer mid-dodge with hooves grounded in wet mud, American alligator surging behind from the waterline, mud spray and shallow splash, strong subject separation, no contact shown",
        motion:
          "Animate a grounded deer dodge and short alligator surge, with mud and water reacting naturally while both bodies stay anatomically stable.",
        bestFrameReuse: "Reuse the most stable dodge frame with clear animal spacing as the image base for Shot 4.",
      },
      {
        label: "Peak Action",
        frameDescription:
          "The highest intensity moment: the alligator reaches the edge of the bank as the deer narrowly clears the pressure zone, framed as a clean survival near-miss.",
        masterFrame:
          "peak near-miss at muddy riverbank, alligator fully readable at the edge of shallow water, deer stretched into an escape leap, strong golden rim light, intense non-graphic survival pressure",
        motion:
          "The deer pushes off and clears the pressure zone while the alligator stops short at the muddy edge; keep the action clean and readable.",
        bestFrameReuse: "Reuse the strongest readable near-miss end frame as the image base for Shot 5.",
      },
      {
        label: "Exit / Unresolved Ending",
        frameDescription:
          "The deer escapes into the open lane while the alligator remains at the waterline; the ending holds unresolved tension instead of showing a final outcome.",
        masterFrame:
          "white-tailed deer retreating down the muddy riverbank escape lane, alligator holding at the waterline in the foreground, reeds and water behind, unresolved wildlife documentary ending",
        motion:
          "Pull back slightly as the deer exits deeper into the bank path and the alligator holds still at the waterline, leaving the outcome tense and unresolved.",
        bestFrameReuse: "Use the clean final frame as the thumbnail or continuity reference for a follow-up reel.",
      },
    ],
  },
  {
    id: "grizzly-elk-yellowstone",
    name: "Grizzly Bear vs Bull Elk — Yellowstone Creek Meadow",
    subject: "Grizzly bear",
    opponent: "Bull elk",
    environment:
      "Yellowstone creek meadow with frost grass, a narrow creek bend, pine tree line, and a clear escape corridor through open grass",
    lighting: "cold sunrise side light with pale mist and soft highlights on wet grass",
    visualStyle:
      "Photorealistic Yellowstone wildlife documentary, cinematic realism, strong survival tension, natural animal scale",
    reelType: "25s Yellowstone meadow survival reel",
    terrainContinuity: "frost grass, creek bend, pine tree line, mist layer, and open meadow escape corridor",
    shotTemplates: [
      {
        label: "Hook",
        frameDescription:
          "A bull elk stands near the creek while the grizzly is already visible across the meadow, creating immediate tension with a clear escape corridor between creek and grass.",
        masterFrame:
          "grizzly bear visible low in the left meadow, bull elk full-body on the right near a narrow Yellowstone creek, antlers readable, open escape corridor through frost grass, misty sunrise depth",
        motion:
          "The elk lifts its head and turns toward the grizzly while the bear advances one slow, heavy step through the frost grass.",
        bestFrameReuse: "Use the clearest frame with both animals visible and the creek meadow spacing established as the image base for Shot 2.",
      },
      {
        label: "Trigger",
        frameDescription:
          "The grizzly increases pressure with a sudden forward push; the elk reacts by shifting weight and preparing to break toward the open meadow lane.",
        masterFrame:
          "grizzly bear pushing forward through frost grass, bull elk bracing near the creek edge, readable antlers and legs, open escape lane behind elk, cold sunrise rim light",
        motion:
          "Animate the bear surging from a walk into a short rush while the elk pivots sharply away from the creek.",
        bestFrameReuse: "Reuse the best frame where the elk pivot and bear pressure are both clean for Shot 3.",
      },
      {
        label: "Escalation",
        frameDescription:
          "The elk breaks into a fast dodge along the creek meadow while the grizzly follows with heavy grounded momentum, keeping both animals fully readable.",
        masterFrame:
          "bull elk dodging across wet frost grass with hooves grounded, grizzly bear behind in pursuit, creek bend and pine line visible, strong depth separation, no contact",
        motion:
          "The elk bounds sideways and forward while the bear follows with heavy body weight; grass bends and creek mist moves subtly.",
        bestFrameReuse: "Reuse the most stable chase frame with clear bear-to-elk spacing as the base for Shot 4.",
      },
      {
        label: "Peak Action",
        frameDescription:
          "A peak near-clash beside the creek: the elk narrowly clears the grizzly pressure with antlers and body posture readable, no gore or injury shown.",
        masterFrame:
          "peak survival near-clash beside Yellowstone creek, grizzly bear reaching pressure distance, bull elk leaping away with antlers clear, frost grass kicked up, clean non-graphic intensity",
        motion:
          "The elk launches across the wet grass as the bear checks its momentum at the creek edge, creating a dramatic near-miss.",
        bestFrameReuse: "Reuse the strongest end frame after the near-clash as the image base for Shot 5.",
      },
      {
        label: "Exit / Unresolved Ending",
        frameDescription:
          "The elk disappears toward the tree line while the grizzly remains in the meadow foreground, leaving the outcome unresolved for replay tension.",
        masterFrame:
          "bull elk retreating toward pine tree line, grizzly bear holding in frost meadow foreground near creek, mist and cold sunrise light, unresolved documentary ending",
        motion:
          "Slowly pull back as the elk moves toward the tree line and the bear pauses, watching in clean survival tension.",
        bestFrameReuse: "Use the final wide unresolved frame as a thumbnail or next-reel continuity reference.",
      },
    ],
  },
  {
    id: "lion-zebra-savanna",
    name: "Lion Pack vs Zebra — African Savanna",
    subject: "Lion pack",
    opponent: "Zebra",
    environment: "African savanna with tall dry grass, acacia silhouettes, dust, and a clear escape lane across open ground",
    lighting: "late golden-hour savanna light with warm dust haze and long shadows",
    visualStyle:
      "Photorealistic African wildlife documentary, cinematic realism, pack pressure, strong survival tension",
    reelType: "25s savanna pack-pressure reel",
    terrainContinuity: "dry grass lane, acacia silhouettes, dust haze, open savanna ground, and long-shadow light direction",
    shotTemplates: [
      {
        label: "Hook",
        frameDescription:
          "The zebra is visible in open savanna while the lion pack is already readable in the grass line, establishing a clean chase lane and immediate pack pressure.",
        masterFrame:
          "zebra full-body in open dry grass, lion pack partially visible but readable along the left grass line, acacia trees in background, clear escape lane, warm dust haze",
        motion:
          "The zebra freezes and turns its head as the lion pack shifts forward subtly in the grass line.",
        bestFrameReuse: "Use the strongest frame with zebra, lion pack, and escape lane readable as the image base for Shot 2.",
      },
      {
        label: "Trigger",
        frameDescription:
          "The lead lion breaks from the grass and the zebra reacts instantly, beginning a fast turn into the open lane while the pack pressure builds.",
        masterFrame:
          "lead lion emerging from tall grass with pack shapes behind, zebra pivoting into escape lane, dust starting at hooves, full-body readability, golden savanna light",
        motion:
          "Animate the lead lion bursting forward while the zebra pivots and kicks up dust, with the pack following as background pressure.",
        bestFrameReuse: "Reuse the best pivot frame with lead lion and zebra spacing intact as the base for Shot 3.",
      },
      {
        label: "Escalation",
        frameDescription:
          "The zebra accelerates across open savanna with the lion pack closing distance; dust and body motion create high survival tension without contact.",
        masterFrame:
          "zebra galloping across open savanna, lion pack pursuing behind in staggered spacing, dust trail, clear legs and grounded hooves, strong depth separation",
        motion:
          "The zebra surges forward and dodges slightly while the lions close in a coordinated pack chase, dust moving naturally.",
        bestFrameReuse: "Reuse the clearest chase frame with stable pack spacing as the image base for Shot 4.",
      },
      {
        label: "Peak Action",
        frameDescription:
          "The lead lion reaches peak pressure beside the zebra in a near-clash frame, but the zebra remains upright and no injury is shown.",
        masterFrame:
          "peak near-clash, lead lion close beside zebra without contact, zebra twisting into a dodge, pack behind in dust, warm rim light, clean non-graphic survival tension",
        motion:
          "The zebra cuts sharply across the frame as the lead lion nearly reaches it but misses, while dust briefly fills the background.",
        bestFrameReuse: "Reuse the most readable near-miss end frame as the image base for Shot 5.",
      },
      {
        label: "Exit / Unresolved Ending",
        frameDescription:
          "The zebra breaks toward the horizon while the lion pack continues in the dust, ending before the outcome is resolved.",
        masterFrame:
          "zebra escaping toward open savanna horizon, lion pack in trailing dust, acacia silhouettes and long golden shadows, unresolved Facebook Reels ending",
        motion:
          "Pull back slightly as the zebra gains a few steps and the pack keeps moving through dust, ending on unresolved tension.",
        bestFrameReuse: "Use the final dusty wide frame as the thumbnail or next-reel continuity reference.",
      },
    ],
  },
  {
    id: "boar-bear-everglades",
    name: "Wild Boar vs Black Bear — Everglades Marsh",
    subject: "Wild boar",
    opponent: "Black bear",
    environment:
      "Everglades marsh edge with sawgrass, shallow reflective water, cypress roots, mud patches, and a narrow escape channel",
    lighting: "humid late-afternoon marsh light with warm reflections and soft green shadows",
    visualStyle:
      "Photorealistic marsh wildlife documentary, cinematic realism, muddy grounded action, strong survival tension",
    reelType: "25s Everglades marsh standoff reel",
    terrainContinuity: "sawgrass wall, shallow reflective water, cypress roots, mud patches, and narrow escape channel",
    shotTemplates: [
      {
        label: "Hook",
        frameDescription:
          "The wild boar and black bear are both visible at the marsh edge, facing the same narrow mud channel with water and sawgrass creating a tight escape route.",
        masterFrame:
          "wild boar full-body in muddy foreground, black bear visible near sawgrass and cypress roots, shallow reflective water between them, narrow marsh escape channel, tense documentary framing",
        motion:
          "The boar snorts and shifts its stance while the black bear steps cautiously from the sawgrass edge.",
        bestFrameReuse: "Use the clearest marsh standoff frame with both animals and the escape channel visible as the image base for Shot 2.",
      },
      {
        label: "Trigger",
        frameDescription:
          "The boar suddenly charges through the mud channel and the black bear reacts with a sharp defensive shift, splashing shallow water.",
        masterFrame:
          "wild boar beginning a muddy charge, black bear reacting near cypress roots, shallow water splash, sawgrass framing, full-body readability, humid marsh light",
        motion:
          "Animate the boar bursting forward with muddy spray while the bear shifts back and raises its body posture defensively.",
        bestFrameReuse: "Reuse the strongest charge frame with readable boar and bear spacing as the base for Shot 3.",
      },
      {
        label: "Escalation",
        frameDescription:
          "The boar surges and dodges through shallow marsh water while the black bear moves laterally, creating a tense near-collision in tight terrain.",
        masterFrame:
          "wild boar dodging through shallow reflective water, black bear moving laterally beside sawgrass, mud spray and cypress roots, realistic anatomy and grounded contact, no injury",
        motion:
          "The boar cuts through the mud while the bear sidesteps; water and mud react naturally without unstable body shapes.",
        bestFrameReuse: "Reuse the most stable near-collision dodge frame as the image base for Shot 4.",
      },
      {
        label: "Peak Action",
        frameDescription:
          "A high-intensity pressure moment in the marsh channel: the boar passes close to the bear, splashing water, with no gore or visible injury.",
        masterFrame:
          "peak marsh pressure, wild boar passing close in front of black bear without graphic contact, water splash, sawgrass and cypress roots, cinematic non-graphic survival tension",
        motion:
          "The boar powers through the channel as the bear braces and turns, creating a close clean near-miss with heavy water splash.",
        bestFrameReuse: "Reuse the clearest peak action end frame as the image base for Shot 5.",
      },
      {
        label: "Exit / Unresolved Ending",
        frameDescription:
          "The boar vanishes into sawgrass while the black bear remains at the marsh edge, leaving a tense unresolved ending in the reflective water.",
        masterFrame:
          "wild boar disappearing into sawgrass channel, black bear standing at reflective marsh edge, cypress roots and mud visible, humid late light, unresolved survival ending",
        motion:
          "Slow pull-back as the boar disappears into the sawgrass and the bear holds position, ending before the outcome is explained.",
        bestFrameReuse: "Use the final unresolved marsh frame as a thumbnail or follow-up continuity reference.",
      },
    ],
  },
  {
    id: "moose-grizzly-winter",
    name: "Moose vs Grizzly Bear — Snowy Winter Wetland",
    subject: "Bull moose",
    opponent: "Grizzly bear",
    environment:
      "snowy winter wetland with frozen reeds, shallow icy water, packed snow banks, and a narrow path through white grass",
    lighting: "blue-hour winter light with soft snow reflection and cold rim highlights",
    visualStyle:
      "Photorealistic winter wildlife documentary, cinematic realism, cold survival tension, stable animal scale",
    reelType: "25s snowy wetland survival reel",
    terrainContinuity: "frozen reeds, icy wetland water, packed snow banks, white grass path, and cold blue-hour light direction",
    shotTemplates: [
      {
        label: "Hook",
        frameDescription:
          "The bull moose stands in a snowy wetland channel while the grizzly is visible beyond the frozen reeds, with a narrow white escape path between them.",
        masterFrame:
          "bull moose full-body in snowy wetland channel, grizzly bear visible beyond frozen reeds, icy water and packed snow banks, narrow escape path, cold blue-hour documentary framing",
        motion:
          "The moose exhales in cold air and shifts its weight while the grizzly appears behind the reeds with slow pressure.",
        bestFrameReuse: "Use the clearest frame with moose, grizzly, frozen reeds, and escape path visible as the image base for Shot 2.",
      },
      {
        label: "Trigger",
        frameDescription:
          "The grizzly breaks through frozen reeds and the moose reacts with a fast body turn, kicking snow from the wetland edge.",
        masterFrame:
          "grizzly bear pushing through frozen reeds, bull moose turning sharply on packed snow, icy water splash and snow spray, full-body readability, cold rim light",
        motion:
          "Animate the grizzly pushing through reeds as the moose snaps into a turn and snow scatters under its hooves.",
        bestFrameReuse: "Reuse the strongest turn frame with both animals stable and readable as the base for Shot 3.",
      },
      {
        label: "Escalation",
        frameDescription:
          "The moose surges down the snowy path while the grizzly follows through icy water, creating strong grounded winter chase tension.",
        masterFrame:
          "bull moose surging through snowy wetland path, grizzly bear behind in shallow icy water, frozen reeds bending, snow spray, realistic anatomy and grounded hoof contact",
        motion:
          "The moose bounds forward through snow while the bear follows with heavy steps through icy water; preserve realistic weight and spacing.",
        bestFrameReuse: "Reuse the clearest winter chase frame with stable spacing as the image base for Shot 4.",
      },
      {
        label: "Peak Action",
        frameDescription:
          "A peak near-clash at the frozen reed line: the moose clears the pressure zone while the grizzly reaches the snowy channel edge, no injury shown.",
        masterFrame:
          "peak winter near-clash, bull moose clearing snowy channel edge, grizzly bear reaching pressure distance, frozen reeds and icy water spray, clean non-graphic survival intensity",
        motion:
          "The moose lunges across the snowy path as the bear stops short in the icy channel, snow and water moving naturally.",
        bestFrameReuse: "Reuse the strongest readable near-miss frame as the image base for Shot 5.",
      },
      {
        label: "Exit / Unresolved Ending",
        frameDescription:
          "The moose disappears into snowy reeds while the grizzly stands in the icy channel, ending on a cold unresolved survival beat.",
        masterFrame:
          "bull moose retreating into snowy reed path, grizzly bear holding in icy wetland foreground, blue-hour winter haze, packed snow banks, unresolved documentary ending",
        motion:
          "Slow pull-back as the moose fades into the reeds and the bear holds in the icy channel, leaving the ending unresolved.",
        bestFrameReuse: "Use the final cold wide frame as the thumbnail or next-reel continuity reference.",
      },
    ],
  },
];

function getPresetById(presetId: string): WildlifePreset {
  return wildlifePresets.find((preset) => preset.id === presetId) ?? wildlifePresets[0];
}

function buildPresetSettings(preset: WildlifePreset): ReelSettings {
  return {
    subject: preset.subject,
    opponent: preset.opponent,
    environment: preset.environment,
    lighting: preset.lighting,
    visualStyle: preset.visualStyle,
    aspectRatio: "9:16",
    reelType: preset.reelType,
    totalDuration: "25s",
    safetyRule:
      "Photorealistic wildlife documentary tension only. No blood, no gore, no visible injury; keep all action clean, realistic, and non-graphic.",
  };
}

function buildNanoBananaPrompt(preset: WildlifePreset, shot: PresetShotTemplate): string {
  return [
    "Nano Banana master frame prompt:",
    "9:16 vertical photorealistic wildlife documentary frame.",
    shot.masterFrame + ".",
    "Main subject: " + preset.subject + "; opponent: " + preset.opponent + "; habitat: " + preset.environment + ".",
    preset.lighting + ". Cinematic realism, clear full-body readability, realistic animal anatomy, grounded paw/hoof/contact, clear habitat detail, strong depth and subject separation, no text, no watermark, no gore, no blood, no visible injury.",
  ].join(" ");
}

function buildGptImage2Prompt(preset: WildlifePreset, shot: PresetShotTemplate): string {
  return [
    "GPT Image 2 master frame prompt:",
    "Create a 9:16 vertical photorealistic wildlife documentary master frame of " + preset.subject + " and " + preset.opponent + ".",
    shot.masterFrame + ".",
    "Preserve believable animal scale, natural anatomy, grounded contact with " + preset.terrainContinuity + ", clear full-body readability, strong foreground-background separation, " + preset.lighting + ", no text, no watermark, no gore, no blood, no visible injury.",
  ].join(" ");
}

function buildRunwayPrompt(preset: WildlifePreset, shot: PresetShotTemplate): string {
  return [
    "Image-to-video from the generated master frame.",
    "Preserve the same " + preset.subject + " and " + preset.opponent + " identities, habitat, lighting, scale, spacing, and first-frame composition.",
    shot.motion,
    "Keep motion grounded and documentary-realistic with clean survival tension, no visible injury shown.",
  ].join(" ");
}

function buildContinuityLock(preset: WildlifePreset, shot: PresetShotTemplate): string {
  return [
    "Preserve same " + preset.subject + " and " + preset.opponent + " identities across shots.",
    "Preserve " + preset.terrainContinuity + ".",
    "Preserve " + preset.lighting + " and consistent camera height.",
    "Keep both animals readable, full-body scale logical, spacing believable, anatomy stable, grounded contact clear, and action non-graphic.",
    shot.bestFrameReuse,
  ].join(" ");
}

function buildPresetShots(preset: WildlifePreset): Shot[] {
  return preset.shotTemplates.map((shot, index) => {
    const shotNumber = index + 1;

    return {
      id: shotNumber,
      label: shot.label,
      title: "Shot " + shotNumber + " — " + shot.label,
      frameDescription: shot.frameDescription,
      nanoBananaPrompt: buildNanoBananaPrompt(preset, shot),
      gptImage2Prompt: buildGptImage2Prompt(preset, shot),
      runwayPrompt: buildRunwayPrompt(preset, shot),
      bestFrameReuse: shot.bestFrameReuse,
      continuityLock: buildContinuityLock(preset, shot),
    };
  });
}

const defaultPreset = wildlifePresets[0];
const defaultSettings = buildPresetSettings(defaultPreset);
const templateShots = buildPresetShots(defaultPreset);

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
      {children}
    </label>
  );
}

function TextInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <FieldLabel>{label}</FieldLabel>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl px-3 text-sm"
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  placeholder,
  rows = 4,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  rows?: number;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <FieldLabel>{label}</FieldLabel>
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-y rounded-2xl px-3 py-3 text-sm leading-6"
      />
    </div>
  );
}

function buildShotCopy(shot: Shot) {
  return [
    `Shot ${shot.id} — 5s (${shot.label})`,
    `Storyboard Frame Description:\n${shot.frameDescription}`,
    `Nano Banana Prompt:\n${shot.nanoBananaPrompt}`,
    `GPT Image 2 Prompt:\n${shot.gptImage2Prompt}`,
    `Runway Gen-4 Image-to-Video Prompt:\n${shot.runwayPrompt}`,
    `Best Frame Reuse / Continuity Note:\n${shot.bestFrameReuse}`,
    `Continuity Lock / Consistency Rules:\n${shot.continuityLock}`,
  ].join("\n\n");
}

function buildAllCopy(settings: ReelSettings, shots: Shot[], presetName: string) {
  return [
    "WSTV 5-Shot Wildlife Reel Storyboard",
    "",
    "Workflow:",
    workflowSteps.join(" -> "),
    "",
    "Global Reel Settings:",
    `Selected Preset: ${presetName}`,
    "Total Duration: 25 seconds",
    `Main Subject / Animal 1: ${settings.subject}`,
    `Opponent / Animal 2: ${settings.opponent}`,
    `Environment / Habitat: ${settings.environment}`,
    `Lighting: ${settings.lighting}`,
    `Visual Style: ${settings.visualStyle}`,
    `Aspect Ratio: ${settings.aspectRatio}`,
    `Reel Type: ${settings.reelType}`,
    `Total Duration: ${settings.totalDuration}`,
    `Safety / Content Rule: ${settings.safetyRule}`,
    "",
    "Shots:",
    shots.map(buildShotCopy).join("\n\n---\n\n"),
  ].join("\n");
}

export default function StoryboardPage() {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(defaultPreset.id);
  const [settings, setSettings] = useState<ReelSettings>(defaultSettings);
  const [shots, setShots] = useState<Shot[]>(templateShots);
  const [copyStatus, setCopyStatus] = useState<string>("");

  const selectedPreset = getPresetById(selectedPresetId);
  const allStoryboardText = useMemo(
    () => buildAllCopy(settings, shots, selectedPreset.name),
    [settings, shots, selectedPreset.name]
  );

  function updateSetting(key: keyof ReelSettings, value: string) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  function updateShot(id: number, key: keyof Shot, value: string) {
    setShots((current) => current.map((shot) => (shot.id === id ? { ...shot, [key]: value } : shot)));
  }

  async function copyText(text: string, status: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(status);
      window.setTimeout(() => setCopyStatus(""), 1800);
    } catch {
      setCopyStatus("Copy failed");
      window.setTimeout(() => setCopyStatus(""), 1800);
    }
  }

  function generateTemplate() {
    const preset = getPresetById(selectedPresetId);

    setSettings(buildPresetSettings(preset));
    setShots(buildPresetShots(preset));
    setCopyStatus("Template generated");
    window.setTimeout(() => setCopyStatus(""), 1800);
  }

  function resetStoryboard() {
    setSelectedPresetId(defaultPreset.id);
    setSettings(defaultSettings);
    setShots(templateShots);
    setCopyStatus("Template restored");
    window.setTimeout(() => setCopyStatus(""), 1800);
  }

  return (
    <main className="min-h-screen bg-[color:var(--bg)] px-4 py-10 text-[color:var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="overflow-hidden rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface-elevated)] shadow-[var(--surface-shadow)]">
          <div className="border-b border-[color:var(--border)] bg-white/[0.03] p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="max-w-3xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-400/80">
                  Storyboard
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[color:var(--text)] sm:text-4xl">
                  Wildlife AI Reel Workflow Builder
                </h1>
                <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
                  ChatGPT storyboard planning, master-frame prompting, Runway Gen-4 motion,
                  best-frame continuity, and final reel handoff in one fixed 25-second structure.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {copyStatus ? (
                  <span className="rounded-full border border-emerald-400/35 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                    {copyStatus}
                  </span>
                ) : null}
                <Link
                  href="/"
                  className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm font-semibold text-[color:var(--text)] transition hover:border-cyan-400/60 hover:text-cyan-300"
                >
                  Back to Build
                </Link>
              </div>
            </div>

            <div className="mt-8 grid gap-3 lg:grid-cols-5">
              {workflowSteps.map((step, index) => (
                <div key={step} className="relative">
                  <div className="h-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-cyan-400/15 text-xs font-bold text-cyan-300 ring-1 ring-cyan-300/25">
                        {index + 1}
                      </span>
                      <p className="text-sm font-semibold leading-5 text-[color:var(--text)]">{step}</p>
                    </div>
                  </div>
                  {index < workflowSteps.length - 1 ? (
                    <div className="hidden lg:block absolute -right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-cyan-300/20 bg-[color:var(--surface-elevated)] px-2 py-1 text-xs font-bold text-cyan-300">
                      -&gt;
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] sm:p-8">
            <div className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-400/80">
                    Global Reel Settings
                  </p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight text-[color:var(--text)]">
                    25s Wildlife Reel Controls
                  </h2>
                </div>
                <span className="rounded-full border border-[color:var(--border)] bg-black/10 px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
                  5 x 5s
                </span>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <TextInput label="Main Subject / Animal 1" value={settings.subject} onChange={(value) => updateSetting("subject", value)} />
                <TextInput label="Opponent / Animal 2" value={settings.opponent} onChange={(value) => updateSetting("opponent", value)} />
                <TextInput label="Environment / Habitat" value={settings.environment} onChange={(value) => updateSetting("environment", value)} />
                <TextInput label="Lighting" value={settings.lighting} onChange={(value) => updateSetting("lighting", value)} />
                <TextInput label="Visual Style" value={settings.visualStyle} onChange={(value) => updateSetting("visualStyle", value)} />
                <TextInput label="Aspect Ratio" value={settings.aspectRatio} onChange={(value) => updateSetting("aspectRatio", value)} />
                <TextInput label="Reel Type" value={settings.reelType} onChange={(value) => updateSetting("reelType", value)} />
                <TextInput label="Total Duration" value={settings.totalDuration} onChange={(value) => updateSetting("totalDuration", value)} />
              </div>
              <div className="mt-4">
                <TextArea
                  label="Safety / Content Rule"
                  value={settings.safetyRule}
                  rows={3}
                  placeholder="No blood, no gore, no visible injury"
                  onChange={(value) => updateSetting("safetyRule", value)}
                />
              </div>
            </div>

            <div className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-400/80">
                Storyboard Actions
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-[color:var(--text)]">
                Creator Handoff
              </h2>
              <div className="mt-5 space-y-2">
                <FieldLabel>Wildlife Scene Preset</FieldLabel>
                <select
                  value={selectedPresetId}
                  onChange={(event) => setSelectedPresetId(event.target.value)}
                  className="h-11 w-full rounded-xl px-3 text-sm"
                >
                  {wildlifePresets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => copyText(allStoryboardText, "Storyboard copied")}
                  className="rounded-2xl border border-cyan-300/30 bg-cyan-400/12 px-4 py-3 text-sm font-semibold text-cyan-200 hover:border-cyan-300/60"
                >
                  Copy All Storyboard
                </button>
                <button
                  type="button"
                  onClick={generateTemplate}
                  className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 text-sm font-semibold text-[color:var(--text)] hover:border-cyan-400/50"
                >
                  Generate 5-Shot Template
                </button>
                <button
                  type="button"
                  onClick={resetStoryboard}
                  className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 text-sm font-semibold text-[color:var(--text)] hover:border-rose-300/45 hover:text-rose-200"
                >
                  Reset Storyboard
                </button>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-[color:var(--border)] bg-black/10 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">Total Structure</p>
                  <p className="mt-2 text-2xl font-semibold text-[color:var(--text)]">25s</p>
                </div>
                <div className="rounded-2xl border border-[color:var(--border)] bg-black/10 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">Shots</p>
                  <p className="mt-2 text-2xl font-semibold text-[color:var(--text)]">5</p>
                </div>
                <div className="rounded-2xl border border-[color:var(--border)] bg-black/10 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">Duration Each</p>
                  <p className="mt-2 text-2xl font-semibold text-[color:var(--text)]">5s</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          {shots.map((shot) => (
            <article
              key={shot.id}
              className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-5 shadow-[var(--surface-shadow)] sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[color:var(--border)] pb-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-400/80">
                    Shot {shot.id} — 5s
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--text)]">
                    Shot {shot.id} — 5s: {shot.label}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => copyText(buildShotCopy(shot), `Shot ${shot.id} copied`)}
                  className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm font-semibold text-[color:var(--text)] hover:border-cyan-400/50 hover:text-cyan-300"
                >
                  Copy Shot
                </button>
              </div>

              <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                <div className="space-y-4">
                  <TextInput
                    label="Shot Title"
                    value={shot.title}
                    onChange={(value) => updateShot(shot.id, "title", value)}
                  />
                  <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
                    <FieldLabel>Duration</FieldLabel>
                    <p className="mt-2 text-lg font-semibold text-[color:var(--text)]">5s</p>
                  </div>
                  <TextArea
                    label="Storyboard Frame Description"
                    value={shot.frameDescription}
                    placeholder="Describe the visual frame for this shot"
                    rows={6}
                    onChange={(value) => updateShot(shot.id, "frameDescription", value)}
                  />
                  <TextArea
                    label="Best Frame Reuse / Continuity Note"
                    value={shot.bestFrameReuse}
                    placeholder="Describe which best frame should be reused for the next shot"
                    rows={4}
                    onChange={(value) => updateShot(shot.id, "bestFrameReuse", value)}
                  />
                </div>

                <div className="space-y-4">
                  <div className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-400/80">
                          Master Frame Prompts
                        </p>
                        <h3 className="mt-1 text-lg font-semibold text-[color:var(--text)]">
                          Nano Banana + GPT Image 2
                        </h3>
                      </div>
                      <span className="rounded-full border border-[color:var(--border)] bg-black/10 px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
                        Runway-ready stills
                      </span>
                    </div>
                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      <TextArea
                        label="Nano Banana Prompt"
                        value={shot.nanoBananaPrompt}
                        placeholder="Write the Nano Banana master frame prompt"
                        rows={8}
                        onChange={(value) => updateShot(shot.id, "nanoBananaPrompt", value)}
                      />
                      <TextArea
                        label="GPT Image 2 Prompt"
                        value={shot.gptImage2Prompt}
                        placeholder="Write the GPT Image 2 master frame prompt"
                        rows={8}
                        onChange={(value) => updateShot(shot.id, "gptImage2Prompt", value)}
                      />
                    </div>
                  </div>

                  <TextArea
                    label="Runway Gen-4 Image-to-Video Prompt"
                    value={shot.runwayPrompt}
                    placeholder="Write the Runway Gen-4 motion prompt"
                    rows={5}
                    onChange={(value) => updateShot(shot.id, "runwayPrompt", value)}
                  />
                  <TextArea
                    label="Continuity Lock / Consistency Rules"
                    value={shot.continuityLock}
                    placeholder="List continuity rules to preserve identity and environment"
                    rows={5}
                    onChange={(value) => updateShot(shot.id, "continuityLock", value)}
                  />
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
