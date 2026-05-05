"use client";

import { useState, type ReactNode } from "react";

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
  desktopScrollMode?: "page" | "workspace";
  desktopSidebarCollapsible?: boolean;
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
  desktopScrollMode = "page",
  desktopSidebarCollapsible = false,
}: WorkspaceShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const isWorkspaceScroll = desktopScrollMode === "workspace";
  const desktopGridClass = isSidebarCollapsed
    ? "lg:grid-cols-[92px_minmax(0,1fr)]"
    : "lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]";

  return (
    <div
      className={[
        "grid min-w-0 max-w-full overflow-hidden gap-5",
        desktopGridClass,
        isWorkspaceScroll
          ? "lg:h-[calc(100vh-var(--app-header-height)-1.5rem)] lg:items-start lg:gap-5"
          : "lg:items-start lg:gap-4",
      ].join(" ")}
    >
      <WorkspaceSidebar
        title={sidebarTitle}
        subtitle={sidebarSubtitle}
        items={sidebarItems}
        activeItem={activeItem}
        onActiveItemChange={onActiveItemChange}
        collapsible={desktopSidebarCollapsible}
        collapsed={desktopSidebarCollapsible ? isSidebarCollapsed : false}
        onToggleCollapsed={
          desktopSidebarCollapsible ? () => setIsSidebarCollapsed((previous) => !previous) : undefined
        }
        desktopSticky={isWorkspaceScroll}
      />

      <div
        className={[
          "min-w-0 max-w-full overflow-hidden space-y-5 lg:space-y-4",
          isWorkspaceScroll
            ? "lg:max-h-[calc(100vh-var(--app-header-height)-1.5rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-2"
            : "lg:pr-1 xl:pr-2",
        ].join(" ")}
      >
        <section className="min-w-0 max-w-full overflow-hidden rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4 shadow-[var(--surface-shadow)] sm:p-6 lg:p-4 xl:p-5">
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-3 xl:gap-4">
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300/80">
                {sidebarTitle}
              </div>
              <h1 className="mt-2 max-w-full break-words text-2xl font-semibold tracking-tight text-[color:var(--text)] xl:text-3xl">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-2 max-w-3xl break-words text-sm leading-6 text-[color:var(--muted)] [overflow-wrap:anywhere]">
                  {subtitle}
                </p>
              ) : null}
            </div>
            {topActions ? (
              <div className="grid w-full min-w-0 max-w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
                {topActions}
              </div>
            ) : null}
          </div>
          {headerMeta ? <div className="mt-3 min-w-0 max-w-full overflow-hidden">{headerMeta}</div> : null}
        </section>

        <div
          id={`workspace-panel-${activeItem}`}
          role="tabpanel"
          aria-labelledby={`workspace-tab-${activeItem}`}
          className="min-w-0 max-w-full overflow-hidden pb-[calc(env(safe-area-inset-bottom)+1.5rem)]"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
