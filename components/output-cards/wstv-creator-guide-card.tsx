const workflowSteps = [
  "Choose Story Mode.",
  "Apply a USA Story Mode Preset.",
  "Adjust Subject Setup.",
  "Review Scene Relationship and Production Controls.",
  "Generate the package.",
  "Use Nano Banana 2 Primary for image generation.",
  "Use GPT Image 2 as the backup image workflow.",
  "Use the Runway/Kling hybrid handoff for video.",
  "Copy a Facebook hook and caption.",
  "Track performance after posting manually.",
  "Save A/B experiment results.",
  "Use Auto Recommendations for the next idea.",
];

export default function WSTVCreatorGuideCard() {
  return (
    <section className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-200">
            WSTV Creator Workflow Guide
          </p>
          <h3 className="mt-1 text-base font-black text-[color:var(--text)]">
            Daily build path from idea to learning loop
          </h3>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[color:var(--muted)]">
            A compact checklist for using the full creator system without
            changing prompt generation behavior.
          </p>
        </div>
        <span className="rounded-full border border-amber-400/30 bg-[color:var(--surface-elevated)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-amber-700 dark:text-amber-200">
          Manual workflow
        </span>
      </div>

      <details className="mt-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-3">
        <summary className="cursor-pointer text-xs font-black uppercase tracking-[0.08em] text-[color:var(--text)]">
          Open 12-step creator checklist
        </summary>
        <ol className="mt-3 grid gap-2 text-xs leading-relaxed text-[color:var(--muted)] md:grid-cols-2">
          {workflowSteps.map((step, index) => (
            <li
              key={step}
              className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-2"
            >
              <span className="mr-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-black text-amber-700 dark:text-amber-200">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}
