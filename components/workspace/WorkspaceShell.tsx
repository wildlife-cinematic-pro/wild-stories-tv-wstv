"use client";

import type { ReactNode } from "react";

import WorkspaceSidebar, { type WorkspaceSidebarItem } from "@/components/workspace/WorkspaceSidebar";

type WorkspaceShellProps = {
  sidebarTitle: string;
  sidebarSubtitle?: string;
  title: string;
  subtitle?: string;
  sidebarItems: WorkspaceSidebarItem[];
  activeItem: string;
  onActiveItemChange: (id: string) => void;
  topActions?: ReactNode;
  headerMeta?: ReactNode;
  children: ReactNode;
};

export default function WorkspaceShell({
  sidebarTitle,
  sidebarSubtitle,
  title,
  subtitle,
  sidebarItems,
  activeItem,
  onActiveItemChange,
  topActions,
  headerMeta,
  children,
}: WorkspaceShellProps) {
  return (
    <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-start">
      <WorkspaceSidebar
        title={sidebarTitle}
        subtitle={sidebarSubtitle}
        items={sidebarItems}
        activeItem={activeItem}
        onActiveItemChange={onActiveItemChange}
      />

      <div className="min-w-0 space-y-5">
        <section className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-6 shadow-[var(--surface-shadow)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300/80">
                {sidebarTitle}
              </div>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--text)] sm:text-3xl">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-3 max-w-3xl text-sm leading-6 text-[color:var(--muted)]">
                  {subtitle}
                </p>
              ) : null}
            </div>
            {topActions ? <div className="flex flex-wrap gap-2">{topActions}</div> : null}
          </div>
          {headerMeta ? <div className="mt-4">{headerMeta}</div> : null}
        </section>

        <div
          id={`workspace-panel-${activeItem}`}
          role="tabpanel"
          aria-labelledby={`workspace-tab-${activeItem}`}
          className="min-w-0"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
