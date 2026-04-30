import type { ReactNode } from "react";

type WorkspaceSectionProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export default function WorkspaceSection({
  title,
  description,
  actions,
  children,
  className = "",
}: WorkspaceSectionProps) {
  return (
    <section
      className={`rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-6 shadow-[var(--surface-shadow)] ${className}`.trim()}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold tracking-tight text-[color:var(--text)] sm:text-2xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--muted)]">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
