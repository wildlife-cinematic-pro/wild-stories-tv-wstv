import Link from "next/link";

import { loadStoryboardPreviewData } from "@/lib/storyboard-preview";

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

function PromptBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
        {label}
      </div>
      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[color:var(--text)]">
        {value}
      </p>
    </div>
  );
}

export default async function StoryboardPage() {
  const storyboard = await loadStoryboardPreviewData();

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
                Read-only creator preview sourced from storyboard_system exports. This page
                displays storyboard planning prompts only and never generates final shots or
                writes production outputs.
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

        <section className="space-y-6">
          {storyboard.sequence.map((scene) => (
            <article
              key={scene.id}
              className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-6 shadow-[var(--surface-shadow)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-400/80">
                    Scene {String(scene.id).padStart(2, "0")}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--text)]">
                    {scene.displayName}
                  </h2>
                </div>
                <div className="space-y-2 text-right text-xs text-[color:var(--muted)]">
                  <div>Duration: {formatDuration(scene.duration)}</div>
                  <div>
                    Final shot reference: {scene.finalShotReference ? scene.finalShotReference : "None"}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <StatCard label="Camera" value={scene.camera} />
                <StatCard label="Motion" value={scene.motion} />
                <StatCard label="Start Time" value={formatDuration(scene.startTime)} />
              </div>

              <div className="mt-6 grid gap-4 xl:grid-cols-2">
                <PromptBlock label="Image Prompt" value={scene.imagePrompt} />
                <PromptBlock label="Video Prompt" value={scene.videoPrompt} />
                <PromptBlock label="Runway Prompt" value={scene.runwayPrompt} />
                <PromptBlock label="Kling Prompt" value={scene.klingPrompt} />
                <PromptBlock
                  label="Negative Prompt"
                  value={scene.negativePrompt || "No negative prompt provided."}
                />
                <PromptBlock
                  label="Continuity Rules"
                  value={
                    scene.continuityRules.length > 0
                      ? scene.continuityRules.join("\n")
                      : "No continuity rules provided."
                  }
                />
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
