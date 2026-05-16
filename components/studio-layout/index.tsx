import type { ReactNode } from "react";

type StudioPanelProps = {
  children: ReactNode;
  className?: string;
  variant?: "default" | "muted" | "gold";
};

type StudioStatusPillProps = {
  children: ReactNode;
  tone?: "default" | "gold" | "green" | "muted" | "cyan";
};

type StudioSectionHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  badges?: ReactNode;
};

type StudioTabsProps<T extends string> = {
  tabs: Array<{ id: T; label: string; description?: string; badge?: string }>;
  activeId: T;
  onChange: (id: T) => void;
  className?: string;
};

type StudioActionBarProps = {
  children: ReactNode;
  className?: string;
};

type StudioDiagramFrameProps = {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
};

const panelVariants = {
  default:
    "border-[#263820] bg-[#071009]/90 shadow-[0_24px_80px_rgba(0,0,0,0.3)]",
  muted: "border-[#22351f] bg-[#0a120b]/82 shadow-[0_18px_60px_rgba(0,0,0,0.22)]",
  gold: "border-[#d9a94f]/35 bg-[#111207]/88 shadow-[0_20px_70px_rgba(217,169,79,0.08)]",
};

const pillTones = {
  default: "border-[#314428] bg-[#0b130c] text-[#dce8d1]",
  gold: "border-[#d9a94f]/35 bg-[#d9a94f]/12 text-[#f3c766]",
  green: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  muted: "border-[#314428] bg-[#101a10] text-[#9da892]",
  cyan: "border-cyan-400/30 bg-cyan-500/10 text-cyan-200",
};

export function StudioPanel({ children, className = "", variant = "default" }: StudioPanelProps) {
  return (
    <section className={["rounded-[28px] border", panelVariants[variant], className].join(" ")}>
      {children}
    </section>
  );
}

export function StudioStatusPill({ children, tone = "default" }: StudioStatusPillProps) {
  return (
    <span className={["inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-[11px] font-black", pillTones[tone]].join(" ")}>
      {children}
    </span>
  );
}

export function StudioSectionHeader({ eyebrow, title, description, actions, badges }: StudioSectionHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 max-w-4xl">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#d9a94f]">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-[#c9d2bd]">{description}</p>
        ) : null}
        {badges ? <div className="mt-3 flex flex-wrap gap-2">{badges}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap justify-end gap-2">{actions}</div> : null}
    </div>
  );
}

export function StudioTabs<T extends string>({ tabs, activeId, onChange, className = "" }: StudioTabsProps<T>) {
  return (
    <div className={["rounded-[24px] border border-[#263820] bg-[#071009]/82 p-1.5", className].join(" ")}>
      <div className="flex flex-wrap gap-1.5">
        {tabs.map((tab) => {
          const active = activeId === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={[
                "flex min-w-[220px] flex-1 items-center justify-between gap-3 rounded-[18px] border px-4 py-3 text-left transition active:scale-[0.99] sm:min-w-[250px]",
                active
                  ? "border-[#d9a94f]/45 bg-[#d9a94f] text-[#111207] shadow-[0_12px_30px_rgba(217,169,79,0.16)]"
                  : "border-transparent bg-[#0d180f] text-[#c7d0bd] hover:border-[#314428] hover:text-white",
              ].join(" ")}
            >
              <span className="min-w-0">
                <span className="block text-sm font-black">{tab.label}</span>
                {tab.description ? (
                  <span className={["mt-0.5 block text-[11px] leading-relaxed", active ? "text-[#34270d]/70" : "text-[#9da892]"].join(" ")}>
                    {tab.description}
                  </span>
                ) : null}
              </span>
              {tab.badge ? (
                <span className={["rounded-full px-2.5 py-1 text-[10px] font-black", active ? "bg-[#111207]/12 text-[#111207]" : "bg-[#142113] text-[#9da892]"].join(" ")}>
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function StudioActionBar({ children, className = "" }: StudioActionBarProps) {
  return (
    <div className={["flex flex-wrap gap-2 rounded-[22px] border border-[#263820] bg-[#071009]/82 p-2", className].join(" ")}>
      {children}
    </div>
  );
}

export function StudioDiagramFrame({ eyebrow, title, description, children }: StudioDiagramFrameProps) {
  return (
    <StudioPanel className="overflow-hidden" variant="muted">
      <div className="border-b border-[#263820] px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#d9a94f]">
              {eyebrow}
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">{title}</h2>
            {description ? <p className="mt-1 max-w-5xl text-xs leading-5 text-[#9da892]">{description}</p> : null}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#d9a94f]/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          </div>
        </div>
      </div>
      <div className="min-w-0 overflow-hidden bg-[#050806] p-2 sm:p-3 lg:p-4">
        <div className="min-w-0 overflow-hidden rounded-[22px] border border-[#22351f] bg-[#060c14]">
          {children}
        </div>
      </div>
    </StudioPanel>
  );
}
