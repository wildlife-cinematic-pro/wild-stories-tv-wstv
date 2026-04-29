import Link from "next/link";

import StoryboardSceneList from "@/components/storyboard/storyboard-scene-list";
import {
  buildStoryboardDownloadFilename,
  buildStoryboardPreviewFromBuild,
} from "@/lib/storyboard-from-build";
import { loadStoryboardPreviewData } from "@/lib/storyboard-preview";
import { normalizeWorkflowPresetSnapshot } from "@/lib/workflow-presets";

type SearchParamValue = string | string[] | undefined;

type StoryboardPageProps = {
  searchParams?: Promise<Record<string, SearchParamValue>>;
};

function formatDuration(seconds: number): string {
  return String(seconds) + "s";
}

function flattenSearchParams(
  searchParams: Record<string, SearchParamValue>
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(searchParams).flatMap(([key, value]) => {
      if (typeof value === "string") return [[key, value]];
      if (Array.isArray(value) && value[0]) return [[key, value[0]]];
      return [];
    })
  );
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

export default async function StoryboardPage({ searchParams }: StoryboardPageProps) {
  const resolvedSearchParams = await (searchParams ?? Promise.resolve({}));
  const flattenedSearchParams = flattenSearchParams(resolvedSearchParams);
  const snapshot = normalizeWorkflowPresetSnapshot(flattenedSearchParams);
  const useBuildMode =
    flattenedSearchParams.source === "build" && snapshot !== null;

  const storyboard = useBuildMode
    ? buildStoryboardPreviewFromBuild({
        predator: snapshot.predator,
        prey: snapshot.prey,
        habitat: snapshot.habitat,
        weather: snapshot.weather,
        arc: snapshot.arc,
        contentLane: snapshot.contentLane,
        cameraAnglePreset: snapshot.cameraAnglePreset,
        durationLane: snapshot.durationLane,
        sceneDescription: snapshot.sceneDescription,
      })
    : await loadStoryboardPreviewData();

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
                to refresh the export JSON files, then reload this page. You can also open this
                page from Build using the current setup adapter.
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

  const downloadHref =
    storyboard.mode === "build" && storyboard.exportData
      ? `data:application/json;charset=utf-8,${encodeURIComponent(
          JSON.stringify(storyboard.exportData, null, 2)
        )}`
      : null;
  const downloadFileName =
    storyboard.mode === "build" ? buildStoryboardDownloadFilename(storyboard) : null;

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
                {storyboard.mode === "build"
                  ? "Read-only storyboard preview generated from the current Build setup. This mode never writes repo files and is safe for quick creator planning."
                  : "Read-only creator preview sourced from storyboard_system exports. This page displays storyboard planning prompts only and never generates final shots or writes production outputs."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                {storyboard.sourceLabel}
              </span>
              <span
                className={"inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold " +
                  (storyboard.valid
                    ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
                    : "border-amber-400/40 bg-amber-500/10 text-amber-200")}
              >
                {storyboard.valid ? "Validation passed" : "Needs attention"}
              </span>
              <Link
                href="/"
                className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm font-semibold text-[color:var(--text)] transition hover:border-cyan-400/60 hover:text-cyan-300"
              >
                Back to Build
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <StatCard label="Total Duration" value={formatDuration(storyboard.duration)} />
            <StatCard label="Scene Count" value={String(storyboard.sceneCount)} />
            <StatCard
              label="Valid Scenes"
              value={String(storyboard.summary.validScenes) + "/" + String(storyboard.summary.sceneCount)}
            />
            <StatCard
              label="Valid Prompts"
              value={String(storyboard.summary.validPrompts) + "/" + String(storyboard.summary.promptCount)}
            />
          </div>
        </section>

        <StoryboardSceneList
          storyboard={storyboard}
          downloadStoryboardJsonHref={downloadHref}
          downloadStoryboardJsonFilename={downloadFileName}
        />
      </div>
    </main>
  );
}
