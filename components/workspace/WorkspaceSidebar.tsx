"use client";

import { useEffect, useRef } from "react";

export type WorkspaceSidebarItem = {
  id: string;
  label: string;
  icon?: string;
  detail?: string;
  badge?: string;
};

type WorkspaceSidebarProps = {
  title?: string;
  subtitle?: string;
  items: WorkspaceSidebarItem[];
  activeItem: string;
  onActiveItemChange: (id: string) => void;
  className?: string;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  desktopSticky?: boolean;
};

function SidebarButton({
  item,
  active,
  collapsed,
  onClick,
}: {
  item: WorkspaceSidebarItem;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      id={`workspace-tab-${item.id}`}
      role="tab"
      aria-selected={active}
      aria-controls={`workspace-panel-${item.id}`}
      aria-label={`${item.label} workspace`}
      data-workspace-tab={item.id}
      title={collapsed ? item.label : undefined}
      className={`group flex w-full items-start gap-2.5 rounded-2xl border px-2.5 py-2 text-left transition ${
        collapsed ? "justify-center" : ""
      } ${
        active
          ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
          : "border-transparent bg-transparent text-[color:var(--muted)] hover:border-white/[0.08] hover:bg-white/[0.04] hover:text-[color:var(--text)]"
      }`}
    >
      <span
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl border text-xs font-semibold transition ${
          active
            ? "border-cyan-300/30 bg-cyan-400/15 text-cyan-100"
            : "border-white/[0.08] bg-white/[0.04] text-white/70 group-hover:border-white/[0.12] group-hover:text-white"
        }`}
      >
        {item.icon ?? "•"}
      </span>
      {!collapsed ? (
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold">{item.label}</span>
            {item.badge ? (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  active
                    ? "bg-cyan-300/15 text-cyan-100"
                    : "bg-white/[0.06] text-white/55"
                }`}
              >
                {item.badge}
              </span>
            ) : null}
          </span>
          {item.detail ? (
            <span className="mt-0.5 hidden text-[11px] leading-4 text-current/75 2xl:block">{item.detail}</span>
          ) : null}
        </span>
      ) : null}
    </button>
  );
}

export default function WorkspaceSidebar({
  title,
  subtitle,
  items,
  activeItem,
  onActiveItemChange,
  className = "",
  collapsible = false,
  collapsed = false,
  onToggleCollapsed,
  desktopSticky = true,
}: WorkspaceSidebarProps) {
  const mobileTabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (typeof window === "undefined" || window.innerWidth >= 1024) return;

    mobileTabRefs.current[activeItem]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, [activeItem]);

  return (
    <>
      <section className="lg:hidden">
        <div className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-1.5 shadow-[var(--surface-shadow)] sm:p-2">
          <div
            className="max-w-full min-w-0 overflow-x-auto scroll-px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label={title ? `${title} navigation` : "Workspace navigation"}
          >
            <div className="flex w-max min-w-full flex-nowrap gap-2 pr-3">
              {items.map((item) => {
                const active = item.id === activeItem;
                return (
                  <button
                    key={item.id}
                    ref={(node) => {
                      mobileTabRefs.current[item.id] = node;
                    }}
                    type="button"
                    onClick={() => onActiveItemChange(item.id)}
                    role="tab"
                    aria-selected={active}
                    aria-controls={`workspace-panel-${item.id}`}
                    aria-label={`${item.label} workspace`}
                    id={`workspace-tab-${item.id}`}
                    className={`shrink-0 whitespace-nowrap rounded-2xl border px-3 py-1.5 text-[13px] font-semibold transition ${
                      active
                        ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-100"
                        : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--muted)] hover:border-cyan-400/50 hover:text-cyan-200"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2 whitespace-nowrap">
                      <span className="text-xs">{item.icon ?? "•"}</span>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <aside className={`hidden lg:block lg:self-start ${className}`.trim()}>
        <div
          className={[
            "rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-3 shadow-[var(--surface-shadow)] lg:overflow-y-auto lg:overscroll-contain",
            desktopSticky ? "sticky top-[calc(var(--app-header-height)+1rem)] max-h-[calc(100vh-var(--app-header-height)-2rem)]" : "",
          ].join(" ")}
        >
          {(title || subtitle || collapsible) && (
            <div className="border-b border-[color:var(--border)] pb-3">
              <div className="flex items-start justify-between gap-2">
                {!collapsed ? (
                  <div className="min-w-0 flex-1">
                    {title ? (
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
                        {title}
                      </div>
                    ) : null}
                    {subtitle ? (
                      <p className="mt-1 hidden text-xs leading-5 text-[color:var(--muted)] 2xl:block">{subtitle}</p>
                    ) : null}
                  </div>
                ) : title ? (
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
                    Nav
                  </div>
                ) : <div /> }
                {collapsible ? (
                  <button
                    type="button"
                    onClick={onToggleCollapsed}
                    aria-label={collapsed ? "Open workspace sidebar" : "Collapse workspace sidebar"}
                    aria-expanded={!collapsed}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] text-sm font-semibold text-[color:var(--text)] transition hover:border-cyan-400/60 hover:text-cyan-200"
                  >
                    {collapsed ? "→" : "←"}
                  </button>
                ) : null}
              </div>
            </div>
          )}

          <nav className="mt-3 space-y-1" aria-label={title ? `${title} navigation` : "Workspace navigation"} role="tablist">
            {items.map((item) => (
              <SidebarButton
                key={item.id}
                item={item}
                active={item.id === activeItem}
                collapsed={collapsed}
                onClick={() => onActiveItemChange(item.id)}
              />
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
