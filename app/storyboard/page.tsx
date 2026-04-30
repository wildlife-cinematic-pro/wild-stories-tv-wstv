import Link from "next/link";

import StoryboardWorkspace from "@/components/storyboard/StoryboardWorkspace";
import {
  buildStoryboardJsonFromBuild,
  buildStoryboardPreviewFromBuild,
  type BuildStoryboardInput,
  type StoryboardPreviewData,
} from "@/lib/storyboard-from-build";
import { loadStoryboardPreviewData } from "@/lib/storyboard-preview";

type SearchParams = Record<string, string | string[] | undefined>;

type StoryboardPageProps = {
  searchParams?: Promise<SearchParams>;
};

function formatDuration(seconds: number): string {
  return String(seconds) + "s";
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
        {label}
      </div>
      <div className="mt-2 text-lg font-semibold text-[color:var(--text)]">{value}</div>
    </div>
  );
}

function getFirst(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function readBuildStoryboardInput(params: SearchParams): BuildStoryboardInput | null {
  if (getFirst(params.source) !== "build") return null;

  const predator = getFirst(params.predator).trim();
  const prey = getFirst(params.prey).trim();

  if (!predator || !prey) return null;

  return {
    predator,
    prey,
    habitat: (getFirst(params.habitat) || "Auto") as BuildStoryboardInput["habitat"],
    weather: (getFirst(params.weather) || "Golden Hour") as BuildStoryboardInput["weather"],
    arc: (getFirst(params.arc) || "Ambush attack") as BuildStoryboardInput["arc"],
    contentLane: (getFirst(params.contentLane) || "Auto") as BuildStoryboardInput["contentLane"],
    cameraAnglePreset: (getFirst(params.cameraAnglePreset) || "Auto") as BuildStoryboardInput["cameraAnglePreset"],
    durationLane: (getFirst(params.durationLane) || "short") as BuildStoryboardInput["durationLane"],
    sceneDescription: getFirst(params.sceneDescription),
    finalEnvironment: getFirst(params.finalEnvironment) || null,
  };
}

function buildStoryboardJsonDownload(storyboardInput: BuildStoryboardInput): {
  href: string;
  filename: string;
} {
  const exportPayload = buildStoryboardJsonFromBuild(storyboardInput);

  return {
    href: `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(exportPayload, null, 2))}`,
    filename: `${exportPayload.project}.storyboard.json`,
  };
}

export default async function StoryboardPage({ searchParams }: StoryboardPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const buildStoryboardInput = readBuildStoryboardInput(resolvedSearchParams);

  let storyboard: StoryboardPreviewData | null = null;
  let downloadStoryboardJsonHref: string | null = null;
  let downloadStoryboardJsonFilename: string | null = null;

  if (buildStoryboardInput) {
    storyboard = buildStoryboardPreviewFromBuild(buildStoryboardInput);
    const downloadBundle = buildStoryboardJsonDownload(buildStoryboardInput);
    downloadStoryboardJsonHref = downloadBundle.href;
    downloadStoryboardJsonFilename = downloadBundle.filename;
  } else {
    storyboard = await loadStoryboardPreviewData();
  }

  if (!storyboard) {
    return (
      <main className="min-h-screen bg-[color:var(--bg)] px-4 py-10 text-[color:var(--text)] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-8 shadow-[var(--surface-shadow)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-400/80">
                Storyboard
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[color:var(--text)]">
                Storyboard exports not found
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
                This page is a read-only preview of the isolated storyboard system. Run
                <code className="mx-1 rounded bg-black/20 px-1.5 py-0.5 text-xs">npm run storyboard</code>
                to refresh the export JSON files, then reload this page.
              </p>
            </div>
            <Link
              href="/"
              className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm font-semibold text-[color:var(--text)] transition hover:border-cyan-400/60 hover:text-cyan-300"
            >
              Back to Build
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[color:var(--bg)] px-4 py-10 text-[color:var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-8 shadow-[var(--surface-shadow)]">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-400/80">
                Storyboard
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[color:var(--text)] sm:text-4xl">
                {storyboard.project}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[color:var(--muted)]">
                Read-only creator preview for storyboard planning prompts. The Mac-style workspace keeps scene review, prompt families, and export actions visible without forcing one long scroll wall.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <span
                className={"inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold " +
                  (storyboard.valid
                    ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
                    : "border-amber-400/40 bg-amber-500/10 text-amber-200")}
              >
                {storyboard.valid ? "Validation passed" : "Needs attention"}
              </span>
              <span className="inline-flex items-center rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                {storyboard.sourceLabel}
              </span>
              <Link
                href="/"
                className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm font-semibold text-[color:var(--text)] transition hover:border-cyan-400/60 hover:text-cyan-300"
              >
                Back to Build
              </Link>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
              Master Image Strategy
            </div>
            <p className="mt-2 text-sm leading-6 text-cyan-50/90">
              Nano Banana 2 is recommended for wildlife documentary master stills. GPT Image 2 is recommended as backup for thumbnail, cover, alternate clean frame, or strict layout refinement. Use the master image first, then send it to Runway/Kling for video motion.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <StatCard label="Total Duration" value={formatDuration(storyboard.duration)} />
            <StatCard label="Scene Count" value={String(storyboard.sceneCount)} />
            <StatCard label="Valid Scenes" value={String(storyboard.summary.validScenes) + "/" + String(storyboard.summary.sceneCount)} />
            <StatCard label="Valid Prompts" value={String(storyboard.summary.validPrompts) + "/" + String(storyboard.summary.promptCount)} />
          </div>
        </section>

        <StoryboardWorkspace
          storyboard={storyboard}
          downloadStoryboardJsonHref={downloadStoryboardJsonHref}
          downloadStoryboardJsonFilename={downloadStoryboardJsonFilename}
        />
      </div>
    </main>
  );
}
