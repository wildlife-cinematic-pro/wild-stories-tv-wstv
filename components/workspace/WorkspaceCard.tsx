import type { ReactNode } from "react";

type WorkspaceCardProps = {
  title?: string;
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export default function WorkspaceCard({
  title,
  eyebrow,
  description,
  actions,
  children,
  className = "",
}: WorkspaceCardProps) {
  return (
    <section
      className={`rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface)] shadow-[var(--surface-shadow)] ${className}`.trim()}
    >
      {(title || eyebrow || description || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[color:var(--border)] px-4 py-3 sm:gap-4 sm:px-5 sm:py-4">
          <div className="min-w-0 flex-1">
            {eyebrow ? (
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
                {eyebrow}
              </div>
            ) : null}
            {title ? (
              <h3 className="mt-1 text-base font-semibold text-[color:var(--text)] sm:text-lg">{title}</h3>
            ) : null}
            {description ? (
              <p className="mt-1.5 max-w-3xl text-sm leading-6 text-[color:var(--muted)] sm:mt-2">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      )}
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}
