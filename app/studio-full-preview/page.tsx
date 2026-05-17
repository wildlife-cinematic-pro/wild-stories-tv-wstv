"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type CSSProperties, type ReactNode } from "react";

import RunwayOfficialWorkflowDiagram from "@/components/RunwayOfficialWorkflowDiagram";
import WSTVWorkflowDiagram from "@/components/WSTVWorkflowDiagram";
import { BRAND_NAME } from "@/lib/brand";

type SectionId = "overview" | "build" | "workflows" | "image" | "storyboard" | "fourshot" | "prompts" | "export" | "brand" | "repo";
type PromptId = "nano" | "gpt" | "runway" | "kling" | "seedance";
type WorkflowDiagramId = "wstv" | "runway";
type LayoutMode = "overview" | "three-column" | "full-width" | "two-column" | "workspace" | "prompt-workbench" | "review";
type BrandAsset = {
  src: string;
  title: string;
  role: string;
  classification: string;
  note?: string;
  currentUse: string;
  problem: string;
  productionRecommendation: string;
  futurePlacement: string;
};

type CleanAssetGuide = {
  file: string;
  title: string;
  purpose: string;
  dimensions: string;
  placement: string;
  prompt: string;
  negativePrompt?: string;
};

const sections: { id: SectionId; label: string; eyebrow: string }[] = [
  { id: "overview", label: "Overview", eyebrow: "Studio" },
  { id: "build", label: "Build", eyebrow: "Setup" },
  { id: "workflows", label: "Workflows", eyebrow: "Routes" },
  { id: "image", label: "Image", eyebrow: "Refs" },
  { id: "storyboard", label: "Storyboard", eyebrow: "Shots" },
  { id: "fourshot", label: "Four-Shot Photo", eyebrow: "Stills" },
  { id: "prompts", label: "Prompt Pack", eyebrow: "Engines" },
  { id: "export", label: "Export", eyebrow: "Review" },
  { id: "brand", label: "Brand Assets", eyebrow: "Identity" },
  { id: "repo", label: "Repo Map", eyebrow: "Inventory" },
];

const sectionMeta: Record<SectionId, { layout: LayoutMode; purpose: string; badges: Array<"Production Reused" | "Mock Only" | "Preview Safe" | "Needs Wiring Later"> }> = {
  overview: {
    layout: "overview",
    purpose: "Understand the complete Wild Stories TV product flow before production integration.",
    badges: ["Mock Only", "Preview Safe"],
  },
  build: {
    layout: "three-column",
    purpose: "Build the wildlife setup, check provider readiness, and choose the next production action.",
    badges: ["Mock Only", "Preview Safe", "Needs Wiring Later"],
  },
  workflows: {
    layout: "full-width",
    purpose: "See the actual production workflow maps.",
    badges: ["Production Reused", "Preview Safe"],
  },
  image: {
    layout: "workspace",
    purpose: "Explore the Image Studio structure for scenic presets, image prompts, captions, and quality checks.",
    badges: ["Mock Only", "Needs Wiring Later"],
  },
  storyboard: {
    layout: "two-column",
    purpose: "Plan 4 cinematic beats and engine prompts.",
    badges: ["Mock Only", "Needs Wiring Later"],
  },
  fourshot: {
    layout: "two-column",
    purpose: "Create same-environment image continuity.",
    badges: ["Mock Only", "Needs Wiring Later"],
  },
  prompts: {
    layout: "prompt-workbench",
    purpose: "Copy platform-specific prompts and Facebook packaging.",
    badges: ["Mock Only", "Preview Safe"],
  },
  export: {
    layout: "review",
    purpose: "Review the final package summary before owner approval.",
    badges: ["Mock Only", "Needs Wiring Later"],
  },
  brand: {
    layout: "full-width",
    purpose: "Review copied creator/cover assets and where they should be used safely.",
    badges: ["Mock Only", "Preview Safe", "Needs Wiring Later"],
  },
  repo: {
    layout: "full-width",
    purpose: "Understand routes, components, handoffs, APIs, and tests.",
    badges: ["Preview Safe"],
  },
};

const sectionActions: Record<SectionId, string[]> = {
  overview: ["Review Product Flow", "Open Build", "Open Repo Map"],
  build: ["Generate Setup", "Continue", "Open Storyboard", "4-Shot Photo"],
  workflows: ["View WSTV Diagram", "View Runway Diagram", "Fit Diagram", "Reset View"],
  image: ["Copy Nano Prompt", "Copy GPT Prompt", "Copy Caption", "Quality Check"],
  storyboard: ["Copy All Storyboard Prompts", "Copy All Kling", "Export Storyboard"],
  fourshot: ["Copy All Nano", "Copy All GPT", "Export Photo Pack"],
  prompts: ["Copy Active Prompt", "Copy All", "Export Pack"],
  export: ["Export Prompt Pack", "Copy All", "Save Review", "Owner Approved"],
  brand: ["Review Hero Assets", "Review Posters", "Request Clean No-Text Versions"],
  repo: ["Search Files", "Expand All", "Collapse All"],
};

const contextPills = [
  "Current setup: Bison mother + wolf pack",
  "Habitat: Yellowstone",
  "Mode: Mother protection",
  "Output: 9:16 Reel",
];

const workflowLegend = ["Canonical Anchor", "Extract Frame Handoff", "Last Frame Fallback", "First Frame QA", "Audio Layering", "Social Side Outputs"];
const repoMiniNav = ["Routes", "Components", "API", "Lib", "Hooks", "Tests", "Handoffs"];

const setupItems = [
  { label: "Animal Pair", value: "Bison mother + wolf pack" },
  { label: "Story Mode", value: "Mother protection" },
  { label: "Habitat Region", value: "Yellowstone meadow" },
  { label: "Season", value: "Early autumn" },
  { label: "Time of Day", value: "Dawn golden hour" },
  { label: "Wildlife Scope", value: "North American behavior" },
  { label: "Content Lane", value: "Facebook Reel" },
  { label: "Action Style", value: "Grounded pressure" },
  { label: "Camera Angle", value: "Low documentary telephoto" },
  { label: "Provider Status", value: "Gemini ready, Groq fallback" },
];

const pipelineCards = [
  { step: "01", title: "Build setup", detail: "Step 1 gathers animals, habitat, season, story mode, action style, camera angle, and platform target." },
  { step: "02", title: "Engine & quality", detail: "Step 2 selects model routes, media analysis, quality guardrails, and reference strategy." },
  { step: "03", title: "Generate", detail: "Step 3 creates the package, provider-polishes copy when available, and preserves local output if AI fails." },
  { step: "04", title: "Image + storyboard", detail: "Image Studio, Cinematic Storyboard, and Four-Shot Photo receive setup via localStorage and query params." },
  { step: "05", title: "Prompt pack + export", detail: "Nano Banana 2, GPT Image 2, Runway, Kling, Seedance, caption, exactly 5 hashtags, and QA checks." },
];

const buildSteps = [
  { title: "Step 1 Wildlife Setup", meta: "components/build/step-1-setup.tsx", detail: "Animal pair, story mode, habitat, season, content lane, action style, workflow presets, current setup, and handoff buttons." },
  { title: "Step 2 Engine & Quality", meta: "components/build/step-2-engine-quality.tsx", detail: "Runway, Kling, Seedance model groups, provider routing, media analysis, scene description, and quality panel." },
  { title: "Step 3 Generate", meta: "components/build/step-3-generate.tsx", detail: "Generated package, provider/API readiness, Gemini default, Groq fallback, copy buttons, locks, versions, output readiness." },
];

const nextActions = ["Generate Setup", "Continue to Engine & Quality", "Open Storyboard for Current Setup", "4-Shot Photo"];

const workflows = [
  { title: "WSTV custom workflow", meta: "Production guide", detail: "House workflow for wildlife setup, social-first story beats, QA, caption, prompt pack, and export readiness.", status: "Core" },
  { title: "Runway official workflow", meta: "Motion route", detail: "Official-style Runway preparation with reference image strategy, image-to-video prompts, and motion notes.", status: "Mapped" },
  { title: "4-shot workflow", meta: "Storyboard", detail: "Hook, trigger, escalation, peak with continuity notes and prompt-ready status locked per shot.", status: "Primary" },
  { title: "Kling 15s workflow", meta: "Action physics", detail: "Compact motion-led prompt path for pressure build, readable behavior, and stable final frames.", status: "Fast lane" },
  { title: "Runway 3-reference workflow", meta: "Refs first", detail: "Lead animal, opposing animal, and habitat reference sequence before motion generation.", status: "Stable" },
  { title: "Seedance workflow", meta: "Optional", detail: "Short-form alternate video route with simplified cinematic motion and continuity guardrails.", status: "Draft" },
  { title: "Facebook Reel packaging workflow", meta: "Publish", detail: "Caption, exactly 5 hashtags, hook framing, publish readiness, and creator performance notes.", status: "Ready" },
];

const referenceSlots = ["Lead animal", "Opposing animal", "Environment plate", "Master vertical still"];

const shots = [
  {
    id: 1,
    beat: "Hook",
    time: "0:00-0:03",
    role: "Instant readable threat",
    title: "The Herd Freezes",
    description: "Low prairie-wide frame: mother bison turns toward movement while the calf stays behind her shoulder.",
    lock: "Identity + habitat locked",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 2,
    beat: "Trigger",
    time: "0:03-0:07",
    role: "Pressure begins",
    title: "Wolves Split The Grass",
    description: "The pack crosses the yellow grass in a shallow arc, visible but never crowding the protected calf.",
    lock: "Spacing safe",
    image: "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 3,
    beat: "Escalation",
    time: "0:07-0:12",
    role: "Behavioral tension",
    title: "Pressure At The Flank",
    description: "Documentary handheld tension, dust and breath in the light, one readable action beat only.",
    lock: "Behavior checked",
    image: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 4,
    beat: "Peak",
    time: "0:12-0:15",
    role: "Resolution frame",
    title: "The Mother Holds",
    description: "Final settle with the mother between pack and calf, strong silhouette, stable end frame.",
    lock: "End frame stable",
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=80",
  },
];

const storyboardOutputLabels = [
  "Copy GPT Image 2 Long",
  "Copy GPT Image 2 Short",
  "Copy Nano Banana 2 Long",
  "Copy Nano Banana 2 Short",
  "Copy Kling Motion",
];

const photoShots = [
  { title: "Shot 1 Hook", prompt: "Bison mother in left third, calf behind shoulder, wolf shapes distant at pine edge, full bodies readable and natural lens compression." },
  { title: "Shot 2 Trigger", prompt: "Same lane and light, wolf pack entering from rear side, calf position protected, no species drift or environment change." },
  { title: "Shot 3 Escalation", prompt: "Same environment plate, pressure at flank, grounded hooves, dust, no graphic contact, full bodies visible." },
  { title: "Shot 4 Peak", prompt: "Resolved final still, mother facing threat, calf protected, pack receding, golden mist and stable horizon." },
];

const masterEnvironmentPlate = "Yellowstone meadow lane, pine edge, low dawn mist, golden grass, stable 9:16 documentary plate with no animals drifting between shots.";

const promptTabs: { id: PromptId; label: string; limit: string }[] = [
  { id: "nano", label: "Nano Banana", limit: "Image primary" },
  { id: "gpt", label: "GPT Image", limit: "Image backup" },
  { id: "runway", label: "Runway", limit: "I2V motion" },
  { id: "kling", label: "Kling", limit: "Action motion" },
  { id: "seedance", label: "Seedance", limit: "Optional route" },
];

const promptPreviews: Record<PromptId, string> = {
  nano: "Nano Banana 2 prompt: photorealistic wildlife documentary still, bison mother guarding calf in misty Yellowstone meadow, dawn golden side light, 85mm natural lens compression, full-body readability, grounded hooves, pine edge and yellow prairie grass preserved for every shot, no species drift, 9:16 composition.",
  gpt: "GPT Image 2 prompt: create a cinematic 9:16 wildlife photo plate with the same bison mother, calf, and distant wolf pack. Keep habitat, season, lighting, animal scale, and ground contact consistent. Natural documentary realism, crisp subject separation, no graphic violence.",
  runway: "Runway prompt: image to video. Slow documentary push-in as the mother bison turns toward subtle movement at the pine edge. Keep the uploaded frame composition and animal identities unchanged. Natural dawn mist, controlled camera, one clean motion beat.",
  kling: "Kling prompt: wide readable action shot. Wolf pack pressure builds from the rear side while mother bison blocks the lane. Dust lifts, calf remains behind her shoulder, no collision, no extra animals, stable 5 second motion, realistic wildlife behavior.",
  seedance: "Seedance prompt: short cinematic wildlife reel beat, same meadow, same bison mother and calf, wolf pack at safe distance, golden mist, simple motion, clear subject positions, vertical social framing, continuity-safe final frame.",
};

const checklist = ["Species locked", "Habitat locked", "9:16 safe crop", "Single action beat", "Prompt ready"];
const hashtags = ["#WildStoriesTV", "#WildlifeReels", "#NatureDrama", "#AnimalBehavior", "#AIVideo"];
const platformTags = ["AI-generated content label", "wildlife documentary", "Facebook Reels", "safe animal behavior", "WSTV original"];

const brandAssets: { wide: BrandAsset[]; posters: BrandAsset[] } = {
  wide: [
    {
      src: "/brand-assets/hero-wide-creator-01.png",
      title: "Hero Wide Creator 01",
      role: "Preview card only",
      classification: "Text-heavy / not suitable behind UI text",
      currentUse: "Preview card only",
      problem: "Baked-in Wildlife Content Creator title and social/footer text compete with live UI copy.",
      productionRecommendation: "Create a clean no-text landscape version before using it as a true product hero/background asset.",
      futurePlacement: "Overview hero or Build hero after clean no-text version is created.",
      note: "Wide creator landscape with strong cinematic wildlife atmosphere. Keep as a brand reference until a clean version exists.",
    },
    {
      src: "/brand-assets/hero-wide-creator-02.png",
      title: "Hero Wide Creator 02",
      role: "Preview card only",
      classification: "Text-heavy / not suitable behind UI text",
      currentUse: "Preview card only",
      problem: "Baked-in lower-frame creator title would collide with dashboard headings, buttons, and status chips.",
      productionRecommendation: "Create a clean no-text landscape version with safe negative space for live interface text.",
      futurePlacement: "Build hero or Overview hero after clean no-text version is created.",
      note: "Wide creator landscape with a calmer composition. Good candidate for a future clean Build summary image.",
    },
    {
      src: "/brand-assets/facebook-cover-creator-wide.png",
      title: "Creator Facebook Cover",
      role: "Preview card only",
      classification: "Text-heavy / not suitable behind UI text",
      currentUse: "Preview card only",
      problem: "Baked-in title, Facebook label, and tagline make it unsuitable behind live controls or headings.",
      productionRecommendation: "Keep this as a finished social cover preview; create a separate no-text derivative for product UI backgrounds.",
      futurePlacement: "Facebook cover preview or Brand Assets cover library.",
      note: "Creator banner with social text and footer details. Use as a cover asset preview, not behind controls.",
    },
    {
      src: "/brand-assets/wild-stories-tv-cover-lion.png",
      title: "Wild Stories TV Lion Cover",
      role: "Preview card only",
      classification: "Text-heavy / not suitable behind UI text",
      currentUse: "Preview card only",
      problem: "Baked-in WILD STORIES TV logo, tagline, and cover text are already the primary message.",
      productionRecommendation: "Use as a Facebook cover/logo preview. Request a clean lion-only plate for any app-background usage.",
      futurePlacement: "Facebook cover preview, Logo/Cover Preview, or owner brand kit card.",
      note: "Lion cover with baked-in WILD STORIES TV branding. Best as a Facebook cover preview card.",
    },
  ],
  posters: [
    {
      src: "/brand-assets/creator-poster-01.png",
      title: "Creator Poster 01",
      role: "Preview card only",
      classification: "Preview card only",
      currentUse: "Preview card only",
      problem: "Baked-in creator name, social label, and poster typography make it too busy for UI backgrounds.",
      productionRecommendation: "Keep as a finished poster preview; create a clean portrait/creator cutout if needed for UI cards.",
      futurePlacement: "Creator profile or vertical poster preview.",
    },
    {
      src: "/brand-assets/creator-poster-02.png",
      title: "Creator Poster 02",
      role: "Preview card only",
      classification: "Preview card only",
      currentUse: "Preview card only",
      problem: "Baked-in creator name and tagline leave no safe space for live UI labels.",
      productionRecommendation: "Keep as a poster preview; generate a no-text portrait version for creator profile modules.",
      futurePlacement: "Creator profile or mobile poster preview.",
    },
    {
      src: "/brand-assets/creator-poster-03.png",
      title: "Creator Poster 03",
      role: "Preview card only",
      classification: "Preview card only",
      currentUse: "Preview card only",
      problem: "Baked-in name, social handle area, and bottom copy make it unsuitable behind live app content.",
      productionRecommendation: "Use as a finished brand poster. Request a clean no-text mobile crop for app hero experiments.",
      futurePlacement: "Creator profile or mobile poster preview.",
    },
    {
      src: "/brand-assets/creator-poster-04.png",
      title: "Mobile Poster",
      role: "Preview card only",
      classification: "Preview card only",
      currentUse: "Preview card only",
      problem: "Large baked-in creator name and Facebook Page text are intended as final poster content, not UI background texture.",
      productionRecommendation: "Keep as mobile poster/brand preview; create a clean portrait plate for production UI placement.",
      futurePlacement: "Mobile poster preview or Creator profile card.",
    },
  ],
};

const cleanAssetGuides: CleanAssetGuide[] = [
  {
    file: "public/brand-assets/clean/hero-wide-wild-stories-tv-no-text.png",
    title: "Wide app hero background",
    purpose: "Overview / Build top hero",
    dimensions: "21:9 or 16:9, minimum 2400px wide",
    placement: "Future Build / Overview hero after the clean no-text file exists and passes visual review.",
    prompt: "Premium cinematic wildlife creator control-room atmosphere, North American wilderness, lion and eagle wildlife storytelling mood, dark forest green and black color palette, warm golden rim light, realistic documentary style, subtle camera gear and creator-studio energy, clean negative space for UI overlay, dramatic but believable, high-end editorial wildlife brand background, no text, no logo, no watermark, no UI, no poster typography, no captions, no social media icons.",
    negativePrompt: "text, logo, watermark, words, letters, captions, UI elements, poster typography, blurry animals, cartoon, fantasy, low quality, overexposed background, crowded composition, cropped faces, distorted camera gear.",
  },
  {
    file: "public/brand-assets/clean/build-hero-wildlife-creator-no-text.png",
    title: "Build command-center background",
    purpose: "Subtle Build summary art",
    dimensions: "16:9",
    placement: "Future Build command-center summary strip, never behind form fields or buttons.",
    prompt: "Dark cinematic wildlife field studio, professional camera gear, wilderness background, realistic documentary production mood, deep forest shadows, warm rim light, dark empty side areas for UI cards, no text, no logo, no watermark, no buttons, no interface.",
  },
  {
    file: "public/brand-assets/clean/creator-profile-no-text.png",
    title: "Creator profile no-text poster",
    purpose: "Small creator identity card",
    dimensions: "4:5 or 9:16",
    placement: "Future Build rail creator profile or owner brand card.",
    prompt: "Realistic wildlife content creator profile portrait style, cinematic but believable, documentary creator mood, natural wilderness background, clean premium lighting, no text, no logo, no watermark, face-safe composition if a real reference photo is provided later.",
  },
  {
    file: "public/brand-assets/clean/mobile-hero-no-text.png",
    title: "Mobile hero no-text",
    purpose: "Mobile landing/header",
    dimensions: "9:16",
    placement: "Future mobile header with safe top/bottom overlay zones.",
    prompt: "Vertical premium wildlife creator hero background, dark cinematic wilderness, warm golden rim light, safe empty top and bottom areas for UI text, realistic documentary atmosphere, no text, no logo, no watermark, no poster words.",
  },
  {
    file: "public/brand-assets/clean/facebook-cover-clean-no-text.png",
    title: "Clean Facebook Cover / Lion Brand Banner",
    purpose: "Facebook cover preview base",
    dimensions: "1640x624 or equivalent wide banner",
    placement: "Future Facebook cover base where HTML/Canva text is added separately.",
    prompt: "Premium cinematic wildlife landscape, powerful lion on the left, eagle in dramatic sky on the right, mountain or sunset wilderness atmosphere, dark-gold documentary color grade, safe empty right area for real HTML/Canva text later, no text, no logo, no watermark.",
  },
];

const repoRoutes = [
  { path: "/", purpose: "Production Build and Workflows home", type: "Production" },
  { path: "/image", purpose: "Image Studio with WorkspaceShell", type: "Production" },
  { path: "/storyboard", purpose: "CinematicStoryboardPage handoff target", type: "Production" },
  { path: "/four-shot-photo", purpose: "Same-environment 4-shot photo generator", type: "Production" },
  { path: "/studio-full-preview", purpose: "Full repo/workflow prototype for owner review", type: "Preview" },
  { path: "/api/enhance", purpose: "Provider enhancement, media analysis, copy polish", type: "API" },
  { path: "/api/enhance/provider-pack-polish", purpose: "Internal pack polish handler for storyboard and four-shot photo schema preservation", type: "API" },
  { path: "/api/enhance/provider-status", purpose: "Provider readiness from env names only", type: "API" },
  { path: "/api/preset-library", purpose: "Personal preset library catalog and sync", type: "API" },
  { path: "/api/preset-library/session", purpose: "Preset library auth/session state", type: "API" },
  { path: "/api/preset-library/shared", purpose: "Shared preset library create/list flow", type: "API" },
  { path: "/api/preset-library/shared/[libraryId]/members", purpose: "Shared library member role management", type: "API" },
];

const componentGroups = [
  { group: "Build", files: "step-1-setup, step-2-engine-quality, step-3-generate, workflow presets, story modes, animal search, QA cards", note: "Production state hub in app/page.tsx." },
  { group: "Workspace", files: "WorkspaceShell, WorkspaceSidebar, WorkspaceCard, WorkspaceSection", note: "Reusable shell already used by Image Studio." },
  { group: "Storyboard", files: "CinematicStoryboardPage, StoryboardWorkspace, scene list, prompt filter, copy buttons", note: "Receives handoff and builds local storyboard pack." },
  { group: "Image", files: "ImageStudioControls, ImageStudioOutputs, OutputCard, ChipGrid", note: "Preset/location controls, image prompts, captions, hashtags." },
  { group: "Four-Shot Photo", files: "app/four-shot-photo/page.tsx, four-shot-photo-handoff, four-shot-photo-system", note: "Same environment photo prompt system with provider polish metadata." },
  { group: "Prompt/Output", files: "OutputCards, PromptVersionsPanel, QualityPanel, output-card workspaces, prompt builders", note: "Copy/export/review surfaces and generated package display." },
  { group: "Shared UI", files: "CopyButton, SettingsDrawer, MediaAnalyzer, workflow diagrams, content calendar", note: "Utility surfaces that appear across production workflows." },
];

const systemCards = [
  { title: "Provider/Gemini/Fallback flow", detail: "Gemini default, Groq Free fallback, provider pack polish, provider status, copy polish, local fallback metadata. Env names are shown only as names: GEMINI_API_KEY, GROQ_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY." },
  { title: "LocalStorage handoff flow", detail: "Build stores/share state and hands setup to /storyboard and /four-shot-photo through localStorage plus query params." },
  { title: "Generated package/output flow", detail: "build-package, generated-package, output readiness, prompt versions, section locks, caption and hashtag exports." },
  { title: "Presets and workflow system", detail: "Workflow presets, cloud/shared preset APIs, custom animals, habitat/camera/content lane data, WSTV and Runway workflow diagrams." },
  { title: "QA/readiness/checklist systems", detail: "Setup readiness, workflow QA, creator QA, prompt health, Facebook readiness, reels optimizer, performance insights, and regression tests." },
  { title: "storyboard_system scripts", detail: "Node scripts generate local storyboard artifacts, Runway/Kling prompts, HTML preview, and four-shot photo prompt exports." },
];

function StatusPill({ children, tone = "gold" }: { children: ReactNode; tone?: "gold" | "green" | "muted" }) {
  const colors = {
    gold: "border-[#5b4724] bg-[#d9a94f]/14 text-[#f3c766]",
    green: "border-[#33512d] bg-[#547d40]/18 text-[#b7e5a8]",
    muted: "border-[#304229] bg-[#071009] text-[#bcc8b1]",
  };

  return <span className={["rounded-full border px-2.5 py-1 text-[11px] font-black", colors[tone]].join(" ")}>{children}</span>;
}

function CopyButton({ children = "Copy" }: { children?: ReactNode }) {
  return (
    <button type="button" className="rounded-xl border border-[#314428] bg-[#101a10] px-3 py-2 text-xs font-black text-[#eef1e7] transition hover:border-[#d9a94f]/55 hover:text-[#f3c766]">
      {children}
    </button>
  );
}

function Panel({ children, className = "", style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return <section style={style} className={["rounded-[24px] border border-[#2a3a25] bg-[#0b130c]/92 shadow-[0_20px_70px_rgba(0,0,0,0.26)]", className].join(" ")}>{children}</section>;
}

function SectionHeading({ eyebrow, title, detail }: { eyebrow: string; title: string; detail?: string }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#d9a94f]">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h1>
        {detail ? <p className="mt-2 max-w-3xl text-sm leading-6 text-[#c9d2bd]">{detail}</p> : null}
      </div>
      <StatusPill tone="muted">Mock data only</StatusPill>
    </div>
  );
}

function HashtagPreview({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1.5" aria-label="Five hashtag preview" data-hashtag-count={hashtags.length}>
      {hashtags.map((tag) => (
        <span key={tag} className={["rounded-full border border-[#314428] bg-[#071009] font-bold text-[#f3c766]", compact ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs"].join(" ")}>{tag}</span>
      ))}
    </div>
  );
}

function ReviewBadges({ badges }: { badges: Array<"Production Reused" | "Mock Only" | "Preview Safe" | "Needs Wiring Later"> }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((badge) => (
        <StatusPill key={badge} tone={badge === "Production Reused" || badge === "Preview Safe" ? "green" : badge === "Needs Wiring Later" ? "gold" : "muted"}>{badge}</StatusPill>
      ))}
    </div>
  );
}

function ContextRail() {
  return (
    <div className="flex flex-wrap gap-1.5 rounded-[22px] border border-[#2a3a25] bg-[#071009]/74 p-2">
      {contextPills.map((pill) => (
        <span key={pill} className="rounded-full border border-[#314428] bg-[#0b130c] px-3 py-1.5 text-[11px] font-black text-[#dce8d1]">{pill}</span>
      ))}
    </div>
  );
}

function SectionActionRow({ activeSection, activeDiagram, setActiveDiagram }: { activeSection: SectionId; activeDiagram: WorkflowDiagramId; setActiveDiagram: (value: WorkflowDiagramId) => void }) {
  const actions = sectionActions[activeSection];
  return (
    <div className="flex flex-wrap gap-2 rounded-[20px] border border-[#2a3a25] bg-[#071009]/82 p-2" data-section-actions={activeSection}>
      {actions.map((action, index) => {
        const isWorkflowAction = activeSection === "workflows" && (action.includes("WSTV") || action.includes("Runway"));
        const isActiveWorkflow = (action.includes("WSTV") && activeDiagram === "wstv") || (action.includes("Runway") && activeDiagram === "runway");
        const isPrimaryAction = activeSection !== "workflows" && index === 0;
        return (
          <button
            key={action}
            type="button"
            data-diagram-choice={isWorkflowAction ? (action.includes("WSTV") ? "wstv" : "runway") : undefined}
            onClick={() => {
              if (action.includes("WSTV")) setActiveDiagram("wstv");
              if (action.includes("Runway")) setActiveDiagram("runway");
            }}
            className={[
              "rounded-2xl px-3 py-2 text-xs font-black transition",
              isPrimaryAction || isActiveWorkflow
                ? "bg-[#d9a94f] text-[#101007] hover:bg-[#e7bc62]"
                : "border border-[#314428] bg-[#101a10] text-[#eef1e7] hover:border-[#d9a94f]/55 hover:text-[#f3c766]",
              isWorkflowAction ? "min-w-[170px]" : "",
            ].join(" ")}
          >
            {action}
            {activeSection !== "workflows" ? <span className="ml-2 text-[10px] opacity-60">Prototype</span> : null}
          </button>
        );
      })}
    </div>
  );
}

function SideSetup() {
  return (
    <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
      <Panel className="p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#d9a94f]">Project setup</p>
            <h2 className="mt-1 text-lg font-semibold text-[#f8f0da]">Current setup</h2>
          </div>
          <StatusPill tone="green">Preview</StatusPill>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {setupItems.slice(0, 8).map((item) => (
            <div key={item.label} className="rounded-2xl border border-[#273720] bg-[#071009] p-2.5">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#889580]">{item.label}</p>
              <p className="mt-1 text-xs font-semibold leading-4 text-[#f4eedc]">{item.value}</p>
            </div>
          ))}
        </div>
        <button type="button" className="mt-3 w-full rounded-2xl bg-[#d9a94f] px-4 py-2.5 text-sm font-black text-[#101007] shadow-[0_12px_32px_rgba(217,169,79,0.2)] transition hover:bg-[#e7bc62]">
          Generate Setup
        </button>
      </Panel>

      <Panel className="p-3">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#d9a94f]">Gemini/API status</p>
        <div className="mt-3 grid gap-2">
          <div className="flex items-center justify-between rounded-2xl border border-[#2f4d34] bg-[#0f1e12] px-3 py-2">
            <span className="text-sm font-semibold text-[#dce8d1]">Gemini Default</span>
            <StatusPill tone="green">Ready</StatusPill>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-[#3c3420] bg-[#181407] px-3 py-2">
            <span className="text-sm font-semibold text-[#dce8d1]">Fallback</span>
            <StatusPill>Groq Free</StatusPill>
          </div>
          <p className="text-xs leading-5 text-[#9da892]">Mock status mirrors the existing provider state concept. No API key values are read or shown.</p>
        </div>
      </Panel>
    </aside>
  );
}

function RightInspector({ promptId, setPromptId }: { promptId: PromptId; setPromptId: (value: PromptId) => void }) {
  const activePrompt = promptTabs.find((tab) => tab.id === promptId) ?? promptTabs[0];

  return (
    <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
      <Panel className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#d9a94f]">Prompt Pack</p>
            <h2 className="mt-1 text-xl font-semibold text-[#f8f0da]">Engine preview</h2>
          </div>
          <CopyButton>Copy</CopyButton>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5 pb-1">
          {promptTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              data-prompt-tab={tab.id}
              onClick={() => setPromptId(tab.id)}
              className={[
                "min-w-[102px] flex-1 rounded-xl border px-2.5 py-1.5 text-[11px] font-black transition",
                tab.id === promptId
                  ? "border-[#d9a94f]/55 bg-[#d9a94f] text-[#101007]"
                  : "border-[#2d3f27] bg-[#0a100a] text-[#bcc7b3] hover:border-[#d9a94f]/45 hover:text-[#f8f0da]",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="mt-3 rounded-[20px] border border-[#314428] bg-[#050806] p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#a2ae97]">{activePrompt.label}</p>
            <StatusPill tone="muted">{activePrompt.limit}</StatusPill>
          </div>
          <p className="mt-2 text-xs leading-5 text-[#e8eadf]">{promptPreviews[promptId]}</p>
        </div>
      </Panel>

      <Panel className="p-3 sm:p-4">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#d9a94f]">Quality checklist</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          {checklist.map((item) => (
            <div key={item} className="flex items-center gap-2 rounded-2xl border border-[#283a22] bg-[#071009] px-2.5 py-2">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-[#547d40]/25 text-[10px] font-black text-[#b7e5a8]">OK</span>
              <span className="text-xs font-semibold text-[#dce8d1]">{item}</span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="p-3 sm:p-4">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#d9a94f]">Facebook caption</p>
        <p className="mt-2 text-xs leading-5 text-[#e8eadf]">She heard the grass move before the herd did. One mother, one calf, and four shots of survival tension.</p>
        <div className="mt-3"><HashtagPreview compact /></div>
      </Panel>
    </aside>
  );
}

function OverviewScreen() {
  return (
    <div className="space-y-4">
      <Panel className="relative min-h-[260px] overflow-hidden p-4 sm:p-6" style={{ backgroundImage: "linear-gradient(90deg,rgba(5,8,6,0.88),rgba(5,8,6,0.52),rgba(5,8,6,0.18)),url(https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1800&q=85)", backgroundPosition: "center", backgroundSize: "cover" }}>
        <div className="max-w-3xl">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#f3c766]">Wild Stories TV AI Wildlife Reel Studio</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-5xl">Build setup to cinematic wildlife reel package.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#e8eadf]">Owner-review prototype for the full repo: build setup, image prompts, storyboard, video engine prompts, provider fallback, QA, and Facebook Reel packaging.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <StatusPill tone="green">Preview-only route</StatusPill>
            <StatusPill>Production logic untouched</StatusPill>
            <StatusPill tone="muted">Mock data</StatusPill>
          </div>
        </div>
      </Panel>
      <Panel className="grid gap-3 p-3 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#d9a94f]">Brand asset policy</p>
          <h2 className="mt-2 text-xl font-semibold text-[#f8f0da]">Uploaded creator art is available as preview cards.</h2>
          <p className="mt-2 text-sm leading-6 text-[#c9d2bd]">All supplied images include baked-in text, so this preview does not place live UI text over them. A clean no-text landscape version is recommended before using creator art as a production hero background.</p>
        </div>
        <div className="relative min-h-[140px] overflow-hidden rounded-[20px] border border-[#314428] bg-[#050806]">
          <Image src={brandAssets.wide[1].src} alt="Creator landscape brand preview" fill sizes="260px" className="object-cover opacity-80" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050806] via-transparent to-transparent" />
          <span className="absolute bottom-3 left-3 rounded-full border border-[#d9a94f]/45 bg-black/55 px-3 py-1 text-[11px] font-black text-[#f3c766]">Preview card only</span>
        </div>
      </Panel>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {pipelineCards.map((card) => (
          <Panel key={card.step} className="p-4 transition hover:-translate-y-1 hover:border-[#d9a94f]/55">
            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[#d9a94f]">{card.step}</span>
            <h2 className="mt-2 text-base font-semibold text-[#f8f0da]">{card.title}</h2>
            <p className="mt-2 text-xs leading-5 text-[#b8c4ad]">{card.detail}</p>
          </Panel>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {systemCards.slice(0, 6).map((card) => (
          <Panel key={card.title} className="p-4">
            <h2 className="text-base font-semibold text-[#f8f0da]">{card.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#c9d2bd]">{card.detail}</p>
          </Panel>
        ))}
      </div>
    </div>
  );
}

function BuildScreen() {
  return (
    <div className="space-y-4">
      <SectionHeading eyebrow="Build screen" title="Step 1 to Step 3 command center" detail="A compact future Build layout that preserves the existing Step1Setup, Step2EngineQuality, and Step3Generate responsibilities." />
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel className="overflow-hidden">
          <div className="relative min-h-[250px] p-4 sm:p-5" style={{ backgroundImage: "linear-gradient(180deg,rgba(5,8,6,0.08),rgba(5,8,6,0.84)),url(https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1600&q=85)", backgroundPosition: "center", backgroundSize: "cover" }}>
            <div className="max-w-xl">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#f3c766]">Master setup preview</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">Bison mother protects calf at dawn</h2>
              <p className="mt-3 text-sm leading-6 text-[#e8eadf]">Same setup feeds Image Studio, Storyboard, Four-Shot Photo, engine prompts, caption, hashtags, and export review.</p>
            </div>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
            {setupItems.map((item) => (
              <div key={item.label} className="rounded-[20px] border border-[#2d3f27] bg-[#071009] p-3">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#889580]">{item.label}</p>
                <p className="mt-2 text-sm font-semibold text-[#f8f0da]">{item.value}</p>
              </div>
            ))}
          </div>
        </Panel>
        <div className="space-y-3">
          <Panel className="p-4 sm:p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#d9a94f]">Readiness checklist</p>
            <div className="mt-3 grid gap-2">
              {["Setup complete", "Engine route selected", "Provider fallback ready", "Storyboard handoff ready", "Export package pending"].map((item) => (
                <div key={item} className="flex items-center justify-between rounded-2xl border border-[#283a22] bg-[#071009] px-3 py-2">
                  <span className="text-sm font-semibold text-[#dce8d1]">{item}</span>
                  <StatusPill tone={item.includes("pending") ? "muted" : "green"}>OK</StatusPill>
                </div>
              ))}
            </div>
          </Panel>
          <Panel className="p-4 sm:p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#d9a94f]">Next actions</p>
            <div className="mt-3 grid gap-2">
              {nextActions.map((action, index) => (
                <button key={action} type="button" className={["rounded-2xl px-4 py-3 text-left text-sm font-black transition", index === 0 ? "bg-[#d9a94f] text-[#101007] hover:bg-[#e7bc62]" : "border border-[#314428] bg-[#101a10] text-[#eef1e7] hover:border-[#d9a94f]/55"].join(" ")}>{action}</button>
              ))}
            </div>
          </Panel>
        </div>
      </div>
      <Panel className="grid gap-3 p-3 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="relative min-h-[130px] overflow-hidden rounded-[20px] border border-[#314428] bg-[#050806]">
          <Image src={brandAssets.wide[0].src} alt="Build brand asset preview" fill sizes="220px" className="object-cover opacity-75" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050806] via-[#050806]/25 to-transparent" />
        </div>
        <div className="self-center">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#d9a94f]">Build brand preview</p>
          <h2 className="mt-2 text-lg font-semibold text-[#f8f0da]">Creator art can support owner review without becoming the dashboard background.</h2>
          <p className="mt-2 text-sm leading-6 text-[#c9d2bd]">This card references the copied wide asset only as a darkened preview tile. Workflows and Repo Map remain clean, diagram-first, and architecture-first.</p>
        </div>
      </Panel>
      <div className="grid gap-3 md:grid-cols-3">
        {buildSteps.map((step) => (
          <Panel key={step.title} className="p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#d9a94f]">{step.meta}</p>
            <h2 className="mt-2 text-lg font-semibold text-[#f8f0da]">{step.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#c9d2bd]">{step.detail}</p>
          </Panel>
        ))}
      </div>
    </div>
  );
}

function WorkflowsScreen({ activeDiagram, setActiveDiagram }: { activeDiagram: WorkflowDiagramId; setActiveDiagram: (value: WorkflowDiagramId) => void }) {
  return (
    <div className="space-y-4">
      <Panel className="overflow-hidden">
        <div className="border-b border-[#253421] bg-[#071009]/86 p-3 sm:p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#d9a94f]">Premium diagram frame</p>
              <h2 className="mt-1 text-xl font-semibold text-[#f8f0da]">
                {activeDiagram === "wstv" ? "WSTV · 4-shot production workflow · hybrid primary lane" : "Runway Official · 4-shot safe handoff · Gen-4.5 native"}
              </h2>
              <p className="mt-1 text-xs leading-5 text-[#9da892]">
                {activeDiagram === "wstv"
                  ? "Production continuity viewer with canonical anchor, preferred Extract Frame handoff, Last Frame fallback, First Frame QA, audio layering, and social side outputs."
                  : "Runway-native reference viewer with safe handoff, manual override lanes, stitched final assembly, and export-only social outputs."}
              </p>
            </div>
            <div className="grid gap-2 rounded-[22px] border border-[#2b3e25] bg-[#050806] p-1.5 sm:flex sm:flex-wrap" aria-label="Workflow diagram selector">
              {([
                { id: "wstv" as WorkflowDiagramId, label: "WSTV Custom Workflow", badge: "Primary" },
                { id: "runway" as WorkflowDiagramId, label: "Runway Official Workflow", badge: "Reference" },
              ]).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  data-workflow-diagram-tab={tab.id}
                  onClick={() => setActiveDiagram(tab.id)}
                  className={[
                    "flex min-w-0 items-center justify-between gap-3 rounded-2xl border px-3 py-2.5 text-left text-xs font-black transition sm:min-w-[240px]",
                    activeDiagram === tab.id
                      ? "border-[#d9a94f]/65 bg-[#d9a94f] text-[#101007]"
                      : "border-transparent bg-[#0c150d] text-[#c7d0bd] hover:border-[#d9a94f]/35 hover:text-[#f7f1df]",
                  ].join(" ")}
                >
                  <span>{tab.label}</span>
                  <span className="rounded-full bg-black/15 px-2 py-1 text-[10px]">{tab.badge}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="min-w-0 overflow-hidden bg-[#050806] p-2 sm:p-3" data-workflow-diagram-panel data-active-workflow-diagram={activeDiagram}>
          <div className="min-w-0 overflow-hidden rounded-[20px] border border-[#22351f] bg-[#060c14]">
            {activeDiagram === "wstv" ? <WSTVWorkflowDiagram /> : <RunwayOfficialWorkflowDiagram />}
          </div>
        </div>
      </Panel>

      <div className="flex flex-wrap gap-2 rounded-[22px] border border-[#2a3a25] bg-[#071009]/74 p-3" aria-label="Workflow legend">
        {workflowLegend.map((item) => (
          <span key={item} className="rounded-full border border-[#314428] bg-[#0b130c] px-3 py-1.5 text-[11px] font-black text-[#f3c766]">{item}</span>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {workflows.map((workflow) => (
          <Panel key={workflow.title} className="p-4 transition hover:-translate-y-1 hover:border-[#d9a94f]/55">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#d9a94f]">{workflow.meta}</p>
                <h2 className="mt-2 text-lg font-semibold text-[#f8f0da]">{workflow.title}</h2>
              </div>
              <StatusPill tone={workflow.status === "Primary" || workflow.status === "Ready" || workflow.status === "Core" ? "green" : "muted"}>{workflow.status}</StatusPill>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#c9d2bd]">{workflow.detail}</p>
          </Panel>
        ))}
      </div>
    </div>
  );
}

function ImageScreen({ promptId, setPromptId }: { promptId: PromptId; setPromptId: (value: PromptId) => void }) {
  return (
    <div className="space-y-4">
      <SectionHeading eyebrow="Image screen" title="WorkspaceShell-inspired image studio" detail="A wider mock of the real /image route: workspace rail, scenic preset controls, Nano Banana 2, GPT Image 2, captions, hashtags, and quality checks." />
      <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
        <Panel className="p-3">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#d9a94f]">Image workspace</p>
          <div className="mt-3 grid gap-2">
            {["Location", "Style", "Wildlife", "Camera", "Season & Light", "Caption", "Random", "Outputs", "Variations", "5-Post Pack", "Quality", "Alt Text"].map((item, index) => (
              <button key={item} type="button" className={["rounded-2xl border px-3 py-2 text-left text-xs font-black transition", index === 7 ? "border-[#d9a94f] bg-[#d9a94f] text-[#101007]" : "border-[#314428] bg-[#071009] text-[#dce8d1] hover:border-[#d9a94f]/50"].join(" ")}>{item}</button>
            ))}
          </div>
        </Panel>
        <div className="grid gap-4 xl:grid-cols-[1fr_0.82fr]">
          <Panel className="p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {["Location preset", "Camera preset", "Quality target"].map((label) => (
              <div key={label} className="rounded-2xl border border-[#2d3f27] bg-[#071009] p-3">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#889580]">{label}</p>
                <p className="mt-1 text-sm font-semibold text-[#f8f0da]">Yellowstone / telephoto / cinematic</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[promptTabs[0], promptTabs[1], { id: "nano" as PromptId, label: "Environment Plate", limit: "Plate" }].map((tab) => (
              <button key={tab.label} type="button" onClick={() => setPromptId(tab.id)} className={["shrink-0 rounded-xl border px-3 py-2 text-xs font-black", tab.id === promptId ? "border-[#d9a94f] bg-[#d9a94f] text-[#101007]" : "border-[#2d3f27] bg-[#071009] text-[#dce8d1]"].join(" ")}>{tab.label}</button>
            ))}
          </div>
          <div className="mt-3 rounded-[22px] border border-[#314428] bg-[#050806] p-4">
            <p className="text-sm leading-6 text-[#e8eadf]">{promptPreviews[promptId]}</p>
            <div className="mt-4 flex flex-wrap gap-2"><CopyButton>Copy prompt</CopyButton><CopyButton>Copy negative guard</CopyButton><CopyButton>Copy caption</CopyButton></div>
          </div>
          </Panel>
          <Panel className="p-4 sm:p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#d9a94f]">Reference image slots</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {referenceSlots.map((slot, index) => (
              <div key={slot} className="flex items-center gap-3 rounded-[20px] border border-[#2d3f27] bg-[#071009] p-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[#5b4724] bg-[#d9a94f]/12 text-sm font-black text-[#f3c766]">0{index + 1}</div>
                <div><p className="text-sm font-semibold text-[#f8f0da]">{slot}</p><p className="mt-1 text-xs text-[#9da892]">Mock upload placeholder</p></div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-[#314428] bg-[#050806] p-3">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#d9a94f]">Facebook caption + hashtags</p>
            <p className="mt-2 text-sm leading-6 text-[#e8eadf]">She heard the grass move before the herd did.</p>
            <div className="mt-3"><HashtagPreview /></div>
          </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function StoryboardScreen({ selectedShot, setSelectedShot }: { selectedShot: number; setSelectedShot: (value: number) => void }) {
  return (
    <div className="space-y-4">
      <Panel className="relative min-h-[260px] overflow-hidden p-4 sm:p-5" style={{ backgroundImage: "linear-gradient(180deg,rgba(5,8,6,0.08),rgba(5,8,6,0.78)),url(https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1800&q=85)", backgroundPosition: "center", backgroundSize: "cover" }}>
        <div className="max-w-2xl">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#f3c766]">Storyboard screen</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">4-shot wildlife storyboard</h1>
          <p className="mt-3 text-sm leading-6 text-[#e8eadf]">Maps to CinematicStoryboardPage later: localStorage setup, complete local pack first, provider polish metadata, copy buttons, and engine sections.</p>
        </div>
      </Panel>
      <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-4">
        {shots.map((shot) => (
          <div
            key={shot.id}
            role="button"
            tabIndex={0}
            data-storyboard-shot={shot.id}
            onClick={() => setSelectedShot(shot.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") setSelectedShot(shot.id);
            }}
            className={["group overflow-hidden rounded-[20px] border bg-[#0d160d] text-left transition hover:-translate-y-1", selectedShot === shot.id ? "border-[#d9a94f] shadow-[0_20px_60px_rgba(217,169,79,0.12)]" : "border-[#293922]"].join(" ")}
          >
            <div className="relative h-28 overflow-hidden"><div className="h-full bg-cover bg-center opacity-[0.82] transition group-hover:scale-105" style={{ backgroundImage: `url(${shot.image})` }} /><div className="absolute left-2.5 top-2.5 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[11px] font-black text-white">Shot {shot.id} {shot.beat}</div></div>
            <div className="p-3">
              <div className="flex items-center justify-between gap-2"><h2 className="text-sm font-semibold text-[#f8f0da]">{shot.title}</h2><span className="text-[11px] font-black text-[#d9a94f]">{shot.time}</span></div>
              <p className="mt-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#889580]">{shot.role}</p>
              <p className="mt-1.5 text-xs leading-5 text-[#b8c4ad]">{shot.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5"><StatusPill tone="green">{shot.lock}</StatusPill><StatusPill>Prompt ready</StatusPill></div>
              <div className="mt-3 grid gap-1.5">
                {storyboardOutputLabels.map((label) => (
                  <CopyButton key={label}>{label}</CopyButton>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FourShotPhotoScreen({ selectedShot, setSelectedShot }: { selectedShot: number; setSelectedShot: (value: number) => void }) {
  return (
    <div className="space-y-4">
      <SectionHeading eyebrow="Four-Shot Photo screen" title="Same-environment photo pack" detail="A mock of the production /four-shot-photo route: master environment plate, four vertical photo prompts, provider polish metadata, and copy/export controls." />
      <Panel className="p-4"><p className="text-sm leading-6 text-[#dce8d1]"><span className="font-black text-[#f3c766]">Continuity lock summary:</span> same animal identities, same meadow lane, same dawn lighting, same 9:16 framing, no environment or story-mode changes across the vertical cards.</p><div className="mt-3 flex flex-wrap gap-2"><CopyButton>Regenerate selected shot</CopyButton><CopyButton>Copy all image prompts</CopyButton><CopyButton>Export storyboard pack</CopyButton></div></Panel>
      <Panel className="grid gap-3 p-4 lg:grid-cols-[240px_minmax(0,1fr)_320px]">
        <div className="aspect-[9/16] rounded-[18px] border border-[#5b4724] bg-[linear-gradient(180deg,#26351a,#050806)] p-3"><StatusPill>Master plate</StatusPill></div>
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#d9a94f]">Master Environment</p>
          <h2 className="mt-2 text-xl font-semibold text-[#f8f0da]">Same-environment continuity plate</h2>
          <p className="mt-2 text-sm leading-6 text-[#dce8d1]">{masterEnvironmentPlate}</p>
          <div className="mt-3 flex flex-wrap gap-2"><CopyButton>Copy master Nano Banana 2</CopyButton><CopyButton>Copy master GPT Image 2</CopyButton></div>
        </div>
        <div className="rounded-2xl border border-[#314428] bg-[#050806] p-3">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#d9a94f]">Provider polish</p>
          <p className="mt-2 text-sm leading-6 text-[#dce8d1]">Local pack stays active first. Gemini/Groq polish can improve wording later without changing animals, environment, aspect ratio, or shot count.</p>
          <div className="mt-3 flex flex-wrap gap-2"><StatusPill tone="green">providerUsed: local</StatusPill><StatusPill tone="muted">polished: false</StatusPill></div>
        </div>
      </Panel>
      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
        {photoShots.map((shot, index) => (
          <button key={shot.title} type="button" data-fourshot-photo-card={index + 1} onClick={() => setSelectedShot(index + 1)} className={["rounded-[22px] border bg-[#0b130c] p-3 text-left transition hover:-translate-y-1", selectedShot === index + 1 ? "border-[#d9a94f]" : "border-[#293922]"].join(" ")}>
            <div className="aspect-[9/16] rounded-[18px] border border-[#314428] bg-[linear-gradient(180deg,#172414,#050806)] p-3"><StatusPill>{`Shot ${index + 1}`}</StatusPill><h2 className="mt-4 text-sm font-semibold text-[#f8f0da]">{shot.title}</h2><p className="mt-2 text-xs leading-5 text-[#e8eadf]">{shot.prompt}</p></div>
          </button>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Panel className="p-4"><p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#d9a94f]">Nano Banana 2 prompt block</p><p className="mt-2 text-sm leading-6 text-[#e8eadf]">{promptPreviews.nano}</p></Panel>
        <Panel className="p-4"><p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#d9a94f]">GPT Image 2 prompt block</p><p className="mt-2 text-sm leading-6 text-[#e8eadf]">{promptPreviews.gpt}</p></Panel>
      </div>
    </div>
  );
}

function PromptPackScreen({ promptId, setPromptId }: { promptId: PromptId; setPromptId: (value: PromptId) => void }) {
  return (
    <div className="grid gap-4 2xl:grid-cols-[1fr_0.85fr]">
      <Panel className="p-4 sm:p-5"><p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#d9a94f]">Prompt Pack screen</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Engine-specific prompts</h1><div className="mt-4 flex flex-wrap gap-2 pb-1">{promptTabs.map((tab) => <button key={tab.id} type="button" data-prompt-tab={tab.id} onClick={() => setPromptId(tab.id)} className={["min-w-[116px] flex-1 rounded-xl border px-3 py-2 text-xs font-black", tab.id === promptId ? "border-[#d9a94f] bg-[#d9a94f] text-[#101007]" : "border-[#2d3f27] bg-[#071009] text-[#dce8d1]"].join(" ")}>{tab.label}</button>)}</div><div className="mt-3 rounded-[22px] border border-[#314428] bg-[#050806] p-4"><p className="text-sm leading-6 text-[#e8eadf]">{promptPreviews[promptId]}</p><div className="mt-4 flex flex-wrap gap-2"><CopyButton>Copy prompt</CopyButton><CopyButton>Copy all {promptTabs.find((tab) => tab.id === promptId)?.label}</CopyButton><CopyButton>Export Pack</CopyButton></div></div></Panel>
      <Panel className="p-4 sm:p-5"><p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#d9a94f]">Publish + QA preview</p><p className="mt-3 text-sm leading-6 text-[#e8eadf]">She heard the grass move before the herd did. One mother, one calf, and four shots of survival tension.</p><div className="mt-4"><HashtagPreview /></div><div className="mt-4 flex flex-wrap gap-1.5" aria-label="Platform tags preview">{platformTags.map((tag) => <span key={tag} className="rounded-full border border-[#314428] bg-[#071009] px-2.5 py-1 text-[11px] font-bold text-[#c9d2bd]">{tag}</span>)}</div><div className="mt-4 grid gap-2">{checklist.map((item) => <div key={item} className="flex items-center justify-between rounded-2xl border border-[#283a22] bg-[#071009] px-3 py-2"><span className="text-sm font-semibold text-[#dce8d1]">{item}</span><StatusPill tone="green">OK</StatusPill></div>)}</div></Panel>
    </div>
  );
}

function ExportReviewScreen() {
  return (
    <div className="mx-auto grid max-w-5xl gap-4 xl:grid-cols-[1fr_0.8fr]">
      <Panel className="p-4 sm:p-5"><p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#d9a94f]">Export / Review screen</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Final package summary</h1><div className="mt-4 grid gap-3 sm:grid-cols-2">{["Setup", "Storyboard", "Prompts", "Caption", "5 hashtags", "Engine handoff"].map((item) => <div key={item} className="rounded-2xl border border-[#2d3f27] bg-[#071009] p-3"><StatusPill tone="green">Included</StatusPill><p className="mt-2 text-sm font-semibold text-[#f8f0da]">{item}</p></div>)}</div><div className="mt-4 rounded-2xl border border-[#314428] bg-[#050806] p-3"><p className="text-sm leading-6 text-[#e8eadf]">Engine-specific prompts include Nano Banana 2, GPT Image 2, Runway, Kling, and Seedance. Exports remain visual-only in this prototype.</p></div></Panel>
      <Panel className="p-4 sm:p-5"><p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#d9a94f]">Owner approval note</p><p className="mt-3 text-sm leading-6 text-[#dce8d1]">This mock package is ready for design review only. Production integration would connect these panels to existing Build state, provider readiness, storyboard handoff, four-shot photo output, copy actions, and export functions.</p><div className="mt-4 grid gap-2"><CopyButton>Export Prompt Pack</CopyButton><CopyButton>Copy All</CopyButton><CopyButton>Save Review</CopyButton><CopyButton>Owner Approved</CopyButton></div></Panel>
    </div>
  );
}

function CleanProductionAssetCard({ asset, aspect = "aspect-[16/7]" }: { asset: CleanAssetGuide; aspect?: string }) {
  const src = asset.file.replace("public", "");
  const fileName = asset.file.split("/").pop() ?? asset.file;

  return (
    <Panel className="overflow-hidden border-[#33512d]">
      <div className={["relative overflow-hidden bg-[#050806]", aspect].join(" ")}>
        <Image src={src} alt={asset.title} fill sizes="(max-width: 768px) 100vw, 520px" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050806]/88 via-[#050806]/18 to-[#050806]/35" />
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
          <StatusPill tone="green">Status: Added</StatusPill>
          <StatusPill tone="gold">Production-ready / overlay-safe</StatusPill>
        </div>
      </div>
      <div className="p-4">
        <h2 className="break-words font-mono text-sm font-semibold text-[#f8f0da]">{fileName}</h2>
        <div className="mt-4 grid gap-2">
          {[
            ["Purpose", asset.purpose],
            ["Recommended placement", asset.placement],
            ["Status", "Added"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-[#2d3f27] bg-[#071009] p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#889580]">{label}</p>
              <p className="mt-1 text-xs leading-5 text-[#e8eadf]">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function BrandImageCard({ asset, aspect = "aspect-[16/7]" }: { asset: BrandAsset; aspect?: string }) {
  return (
    <Panel className="overflow-hidden">
      <div className={["relative overflow-hidden bg-[#050806]", aspect].join(" ")}>
        <Image src={asset.src} alt={asset.title} fill sizes="(max-width: 768px) 100vw, 480px" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050806]/92 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
          <StatusPill>{asset.role}</StatusPill>
          <StatusPill tone="muted">{asset.classification}</StatusPill>
        </div>
      </div>
      <div className="p-4">
        <h2 className="text-base font-semibold text-[#f8f0da]">{asset.title}</h2>
        {asset.note ? <p className="mt-2 text-sm leading-6 text-[#c9d2bd]">{asset.note}</p> : null}
        <div className="mt-4 grid gap-2">
          {[
            ["Current use", asset.currentUse],
            ["Problem", asset.problem],
            ["Production recommendation", asset.productionRecommendation],
            ["Best future placement", asset.futurePlacement],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-[#2d3f27] bg-[#071009] p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#889580]">{label}</p>
              <p className="mt-1 text-xs leading-5 text-[#e8eadf]">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function BrandAssetsScreen() {
  const allAssets = [...brandAssets.wide, ...brandAssets.posters];

  return (
    <div className="space-y-4">
      <SectionHeading eyebrow="Brand Assets" title="Creator image integration preview" detail="All eight existing images are shown as owner-review brand cards. Text-heavy files stay out of live UI backgrounds until clean no-text versions are produced." />

      <Panel className="grid gap-3 p-4 lg:grid-cols-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#d9a94f]">Current asset decision</p>
          <h2 className="mt-2 text-xl font-semibold text-[#f8f0da]">Use current images as premium previews, not UI backgrounds.</h2>
          <p className="mt-2 text-sm leading-6 text-[#c9d2bd]">The lion cover and creator posters make the studio feel branded, but baked-in typography means HTML/UI should provide the real text. Clean no-text assets are planned below.</p>
        </div>
        <div className="rounded-[20px] border border-[#5b4724] bg-[#d9a94f]/10 p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#f3c766]">Rules</p>
          <ul className="mt-2 space-y-1.5 text-sm leading-6 text-[#eadfca]">
            <li>No baked-in text for UI backgrounds.</li>
            <li>No clutter behind buttons, forms, or prompt cards.</li>
            <li>No cropped faces, stretched images, logos, or watermarks.</li>
          </ul>
        </div>
        <div className="rounded-[20px] border border-[#33512d] bg-[#547d40]/12 p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#b7e5a8]">Preview Safe</p>
          <p className="mt-2 text-sm leading-6 text-[#dce8d1]">Current assets are loaded from <span className="font-mono text-[#f3c766]">/public/brand-assets</span>. Workflows and Repo Map remain image-free.</p>
        </div>
      </Panel>

      <Panel className="overflow-hidden border-[#d9a94f]/35 bg-[#100f07]/90 p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.72fr)_minmax(320px,1fr)] lg:items-stretch">
          <div className="rounded-[24px] border border-dashed border-[#d9a94f]/45 bg-[#070b07] p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#f3c766]">Clean Hero Asset — Added</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#f8f0da]">hero-wide-wild-stories-tv-no-text.png</h2>
            <p className="mt-3 text-sm leading-6 text-[#c9d2bd]">Status: Added. The clean no-text file is now available and can be used with dark overlays for future Build / Overview hero placement.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#314428] bg-[#0b130c] p-3"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#889580]">Purpose</p><p className="mt-1 text-xs leading-5 text-[#e8eadf]">Overview / Build hero background</p></div>
              <div className="rounded-2xl border border-[#314428] bg-[#0b130c] p-3"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#889580]">Recommended size</p><p className="mt-1 text-xs leading-5 text-[#e8eadf]">21:9 or 16:9, minimum 2400px wide</p></div>
              <div className="rounded-2xl border border-[#314428] bg-[#0b130c] p-3"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#889580]">Placement</p><p className="mt-1 text-xs leading-5 text-[#e8eadf]">Future Build / Overview hero</p></div>
              <div className="rounded-2xl border border-[#314428] bg-[#0b130c] p-3"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#889580]">Safety</p><p className="mt-1 text-xs leading-5 text-[#e8eadf]">Do not use behind forms unless a dark overlay keeps text readable.</p></div>
            </div>
          </div>
          <div className="rounded-[24px] border border-[#4b3816] bg-[#1a1307] p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#f3c766]">Generation prompt</p>
            <p className="mt-2 text-sm leading-6 text-[#eadfca]">Premium cinematic wildlife creator control-room atmosphere, North American wilderness, lion and eagle wildlife storytelling mood, dark forest green and black color palette, warm golden rim light, realistic documentary style, subtle camera gear and creator-studio energy, clean negative space for UI overlay, dramatic but believable, high-end editorial wildlife brand background, no text, no logo, no watermark, no UI, no poster typography, no captions, no social media icons.</p>
            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.14em] text-[#f3c766]">Optional negative prompt</p>
            <p className="mt-2 text-sm leading-6 text-[#eadfca]">text, logo, watermark, words, letters, captions, UI elements, poster typography, blurry animals, cartoon, fantasy, low quality, overexposed background, crowded composition, cropped faces, distorted camera gear.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <StatusPill tone="gold">No baked-in text</StatusPill>
              <StatusPill tone="green">Added</StatusPill>
            </div>
          </div>
        </div>
      </Panel>

      <div className="space-y-3">
        <SectionHeading eyebrow="Clean Production Assets" title="No-text brand assets now added" detail="These five clean files are production-ready source assets for overlay-safe hero, Build mood, creator identity, mobile, and Facebook cover treatments. They stay out of Workflows and Repo Map." />
        <div className="grid gap-3 xl:grid-cols-2">
          {cleanAssetGuides.map((asset) => (
            <CleanProductionAssetCard key={asset.file} asset={asset} aspect={asset.file.includes("creator-profile") || asset.file.includes("mobile-hero") ? "aspect-[9/16]" : "aspect-[16/7]"} />
          ))}
        </div>
      </div>

      <Panel className="overflow-hidden p-0">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div className="relative min-h-[260px] overflow-hidden bg-[#050806]">
            <Image src="/brand-assets/wild-stories-tv-cover-lion.png" alt="Wild Stories TV lion cover preview" fill sizes="(max-width: 1024px) 100vw, 58vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#050806]/25 via-[#050806]/10 to-[#050806]/70" />
          </div>
          <div className="self-center p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#d9a94f]">Facebook Cover / Page Banner</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#f8f0da]">Best current production preview: lion cover card.</h2>
            <p className="mt-3 text-sm leading-6 text-[#c9d2bd]">Use the lion banner as a brand kit preview or Facebook cover preview only. A clean no-text lion/eagle landscape should be created before any app hero/background use.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <StatusPill tone="gold">Preview card only</StatusPill>
              <StatusPill tone="muted">Clean version needed</StatusPill>
            </div>
          </div>
        </div>
      </Panel>

      <div className="space-y-3">
        <SectionHeading eyebrow="Hero / Wide Covers" title="Wide creator assets" detail="Use only as small preview cards until clean negative-space, no-text versions exist." />
        <div className="grid gap-3 xl:grid-cols-2">
          {brandAssets.wide.map((asset) => (
            <BrandImageCard key={asset.src} asset={asset} />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <SectionHeading eyebrow="Creator Posters" title="Vertical identity previews" detail="These are best as creator identity cards, mobile poster previews, or brand-kit references, not dashboard backgrounds." />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {brandAssets.posters.map((asset) => (
            <BrandImageCard key={asset.src} asset={asset} aspect="aspect-[9/16]" />
          ))}
        </div>
      </div>

      <Panel className="p-4 sm:p-5">
        <SectionHeading eyebrow="Recommended Usage" title="Current-image placement matrix" detail="Every current file remains preview-only because the artwork already contains typography." />
        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {allAssets.map((asset) => (
            <div key={asset.src} className="rounded-2xl border border-[#2d3f27] bg-[#071009] p-3">
              <p className="text-sm font-black text-[#f8f0da]">{asset.title}</p>
              <p className="mt-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#d9a94f]">Current use: preview card only</p>
              <p className="mt-2 text-xs leading-5 text-[#c9d2bd]">{asset.futurePlacement}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="p-4 sm:p-5">
        <SectionHeading eyebrow="Brand Asset Production Guide" title="Clean no-text assets needed" detail="These clean files now exist and are documented for safe overlay use. Production usage remains visual-only and avoids Workflows / Repo Map backgrounds." />
        <div className="mt-4 grid gap-3 xl:grid-cols-2">
          {cleanAssetGuides.map((asset) => (
            <div key={asset.file} className="rounded-[22px] border border-[#2d3f27] bg-[#071009] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#d9a94f]">Status: Added</p>
                  <h3 className="mt-1 text-lg font-semibold text-[#f8f0da]">{asset.title}</h3>
                </div>
                <StatusPill tone="green">Added</StatusPill>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#314428] bg-[#0b130c] p-3"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#889580]">Future file</p><p className="mt-1 break-words font-mono text-xs leading-5 text-[#f3c766]">{asset.file}</p></div>
                <div className="rounded-2xl border border-[#314428] bg-[#0b130c] p-3"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#889580]">Dimensions</p><p className="mt-1 text-xs leading-5 text-[#e8eadf]">{asset.dimensions}</p></div>
                <div className="rounded-2xl border border-[#314428] bg-[#0b130c] p-3"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#889580]">Purpose</p><p className="mt-1 text-xs leading-5 text-[#e8eadf]">{asset.purpose}</p></div>
                <div className="rounded-2xl border border-[#314428] bg-[#0b130c] p-3"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#889580]">Placement</p><p className="mt-1 text-xs leading-5 text-[#e8eadf]">{asset.placement}</p></div>
              </div>
              <div className="mt-3 rounded-2xl border border-[#4b3816] bg-[#1a1307] p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#f3c766]">Generation prompt</p>
                <p className="mt-2 text-xs leading-5 text-[#eadfca]">{asset.prompt}</p>
              </div>
              {asset.negativePrompt ? (
                <div className="mt-3 rounded-2xl border border-[#46301d] bg-[#130d08] p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#f3c766]">Optional negative prompt</p>
                  <p className="mt-2 text-xs leading-5 text-[#eadfca]">{asset.negativePrompt}</p>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
        {["HTML/UI provides real text", "Hero art needs dark empty space", "No image backgrounds in Workflows", "Repo Map stays architecture-first"].map((rule) => (
          <div key={rule} className="rounded-2xl border border-[#314428] bg-[#071009] p-3 text-sm font-semibold text-[#dce8d1]">{rule}</div>
        ))}
      </Panel>
    </div>
  );
}

function RepoMapScreen() {
  return (
    <div className="space-y-4">
      <SectionHeading eyebrow="Repo Map" title="Local repo inventory visualized" detail="Compact owner-facing map of production routes, APIs, component groups, provider flow, storage/handoff flow, generated outputs, presets, QA systems, and preview-only files." />
      <div className="sticky top-20 z-20 flex gap-2 overflow-x-auto rounded-[22px] border border-[#2a3a25] bg-[#071009]/92 p-2 backdrop-blur-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Repo map mini nav">
        {repoMiniNav.map((item) => (
          <button key={item} type="button" className="shrink-0 rounded-2xl border border-[#314428] bg-[#0b130c] px-3 py-2 text-xs font-black text-[#dce8d1] hover:border-[#d9a94f]/55 hover:text-[#f3c766]">{item}</button>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {repoRoutes.map((route) => (
          <Panel key={route.path} className="p-4">
            <div className="flex items-start justify-between gap-3"><h2 className="font-mono text-sm font-black text-[#f8f0da]">{route.path}</h2><StatusPill tone={route.type === "Production" ? "green" : route.type === "Preview" ? "gold" : "muted"}>{route.type}</StatusPill></div>
            <p className="mt-2 text-sm leading-6 text-[#c9d2bd]">{route.purpose}</p>
          </Panel>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {componentGroups.map((group) => (
          <Panel key={group.group} className="p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#d9a94f]">{group.group}</p>
            <p className="mt-2 text-sm leading-6 text-[#e8eadf]">{group.files}</p>
            <p className="mt-2 text-xs leading-5 text-[#9da892]">{group.note}</p>
          </Panel>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {systemCards.map((card) => (
          <Panel key={card.title} className="p-4">
            <h2 className="text-base font-semibold text-[#f8f0da]">{card.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#c9d2bd]">{card.detail}</p>
          </Panel>
        ))}
      </div>
      <Panel className="p-4">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#d9a94f]">Inspected but not layout-critical</p>
        <p className="mt-2 text-sm leading-6 text-[#c9d2bd]">Generated storyboard_system prompts, image/video placeholder artifacts, and broad regression/golden test files are represented here as repo systems rather than full visual UI surfaces. They stay out of the main prototype because they are data/build artifacts, not owner-facing studio screens.</p>
      </Panel>
    </div>
  );
}

function ActiveScreen({ activeSection, promptId, setPromptId, selectedShot, setSelectedShot, activeDiagram, setActiveDiagram }: { activeSection: SectionId; promptId: PromptId; setPromptId: (value: PromptId) => void; selectedShot: number; setSelectedShot: (value: number) => void; activeDiagram: WorkflowDiagramId; setActiveDiagram: (value: WorkflowDiagramId) => void }) {
  if (activeSection === "overview") return <OverviewScreen />;
  if (activeSection === "build") return <BuildScreen />;
  if (activeSection === "workflows") return <WorkflowsScreen activeDiagram={activeDiagram} setActiveDiagram={setActiveDiagram} />;
  if (activeSection === "image") return <ImageScreen promptId={promptId} setPromptId={setPromptId} />;
  if (activeSection === "storyboard") return <StoryboardScreen selectedShot={selectedShot} setSelectedShot={setSelectedShot} />;
  if (activeSection === "fourshot") return <FourShotPhotoScreen selectedShot={selectedShot} setSelectedShot={setSelectedShot} />;
  if (activeSection === "prompts") return <PromptPackScreen promptId={promptId} setPromptId={setPromptId} />;
  if (activeSection === "brand") return <BrandAssetsScreen />;
  if (activeSection === "repo") return <RepoMapScreen />;
  return <ExportReviewScreen />;
}

export default function StudioFullPreviewPage() {
  const [activeSection, setActiveSection] = useState<SectionId>("overview");
  const [promptId, setPromptId] = useState<PromptId>("nano");
  const [selectedShot, setSelectedShot] = useState(1);
  const [activeDiagram, setActiveDiagram] = useState<WorkflowDiagramId>("wstv");
  const activeMeta = useMemo(() => sections.find((section) => section.id === activeSection) ?? sections[0], [activeSection]);
  const activeConfig = sectionMeta[activeSection];
  const showLeftSetup = activeConfig.layout === "three-column";
  const showRightInspector = activeConfig.layout === "three-column" || activeConfig.layout === "prompt-workbench";
  const showContextRail = activeSection !== "build";
  const showBottomActionBar = activeSection !== "workflows" && activeSection !== "repo";
  const layoutClass = showLeftSetup && showRightInspector
    ? "lg:grid-cols-[282px_minmax(0,1fr)_360px]"
    : showRightInspector
      ? "lg:grid-cols-[minmax(0,1fr)_380px]"
      : "lg:grid-cols-1";
  const contentMaxClass = activeConfig.layout === "full-width" || activeConfig.layout === "workspace"
    ? "max-w-[calc(100vw-2rem)] xl:max-w-[1880px]"
    : "max-w-[1840px]";

  return (
    <main className={["min-h-screen overflow-x-hidden bg-[#050806] text-[#f7f1df]", showBottomActionBar ? "pb-44" : "pb-10"].join(" ")} data-layout-mode={activeConfig.layout}>
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_16%_8%,rgba(52,96,61,0.34),transparent_30%),radial-gradient(circle_at_84%_0%,rgba(217,169,79,0.16),transparent_28%),linear-gradient(135deg,#050806_0%,#09120d_44%,#111609_100%)]" />

      <header className="sticky top-0 z-40 border-b border-[#253421]/80 bg-[#071009]/92 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-[1840px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="Back to Build">
            <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[#d9a94f]/45 bg-[#d9a94f]/15 text-sm font-black text-[#f3c766]">WS</span>
            <span><span className="block text-[11px] font-black uppercase tracking-[0.28em] text-[#d9a94f]">{BRAND_NAME}</span><span className="block text-xs font-semibold text-[#9da892]">Full repo studio prototype</span></span>
          </Link>
          <nav className="flex max-w-full gap-1.5 overflow-x-auto rounded-2xl border border-[#263620] bg-[#0c150d] p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Full preview navigation">
            {sections.map((section) => (
              <button key={section.id} type="button" data-section-nav={section.id} onClick={() => setActiveSection(section.id)} className={["shrink-0 rounded-xl px-3 py-2 text-xs font-black transition sm:px-4", activeSection === section.id ? "bg-[#d9a94f] text-[#101007] shadow-[0_8px_26px_rgba(217,169,79,0.2)]" : "text-[#c7d0bd] hover:bg-[#172214] hover:text-[#f7f1df]"].join(" ")}>{section.label}</button>
            ))}
          </nav>
        </div>
      </header>

      <div className={["mx-auto grid gap-4 px-4 pb-6 pt-4 sm:px-6 lg:px-8", contentMaxClass, layoutClass].join(" ")}>
        {showLeftSetup ? <SideSetup /> : null}
        <section className="min-w-0 space-y-4">
          <div className="space-y-3 rounded-[24px] border border-[#2a3a25] bg-[#0b130c]/88 p-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#d9a94f]">{activeMeta.eyebrow}</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{activeMeta.label} prototype</h1>
                <p className="mt-2 max-w-4xl text-sm leading-6 text-[#c9d2bd]">{activeConfig.purpose}</p>
              </div>
              <ReviewBadges badges={activeConfig.badges} />
            </div>
            {showContextRail ? <ContextRail /> : null}
            <SectionActionRow activeSection={activeSection} activeDiagram={activeDiagram} setActiveDiagram={setActiveDiagram} />
          </div>
          <ActiveScreen activeSection={activeSection} promptId={promptId} setPromptId={setPromptId} selectedShot={selectedShot} setSelectedShot={setSelectedShot} activeDiagram={activeDiagram} setActiveDiagram={setActiveDiagram} />
        </section>
        {showRightInspector ? <RightInspector promptId={promptId} setPromptId={setPromptId} /> : null}
      </div>

      {showBottomActionBar ? <div className="sticky bottom-0 z-50 px-3 pb-3 pt-1 sm:px-5">
        <div className="mx-auto flex max-w-[1180px] flex-wrap justify-center gap-2 rounded-[18px] border border-[#2c3d25] bg-[#071009]/88 p-2 shadow-[0_18px_70px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          {sectionActions[activeSection].map((action, index) => (
            <button key={action} type="button" data-bottom-action={action} className={["min-h-10 min-w-[118px] flex-1 whitespace-normal rounded-xl px-3 py-2 text-center text-[11px] font-black leading-tight transition active:scale-[0.98] sm:min-w-[160px]", index === 1 ? "bg-[#d9a94f] text-[#101007] hover:bg-[#e7bc62]" : "border border-[#314428] bg-[#101a10] text-[#eef1e7] hover:border-[#d9a94f]/55 hover:text-[#f3c766]"].join(" ")}>{action}</button>
          ))}
        </div>
      </div> : null}
    </main>
  );
}
