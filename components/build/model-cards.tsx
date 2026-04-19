"use client";

type ModelTone = "green" | "blue";

export function ModelCard({
  active,
  tag,
  title,
  subtitle,
  onClick,
  tone,
  activeLabel = "✓ Selected",
}: {
  active: boolean;
  tag: string;
  title: string;
  subtitle: string;
  onClick: () => void;
  tone: ModelTone;
  activeLabel?: string;
}) {
  const isGreen = tone === "green";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border px-3.5 py-3.5 text-left transition-all active:scale-[0.99] ${
        active
          ? isGreen
            ? "border-green-200 bg-green-50/80 shadow-sm shadow-green-100/70"
            : "border-blue-200 bg-blue-50/80 shadow-sm shadow-blue-100/70"
          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/80"
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span
          className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
            isGreen ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
          }`}
        >
          {tag}
        </span>
        {active && (
          <span
            className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
              isGreen ? "bg-green-600 text-white" : "bg-blue-600 text-white"
            }`}
          >
            {activeLabel}
          </span>
        )}
      </div>
      <div className="text-sm font-semibold tracking-tight text-gray-900">{title}</div>
      <div className="mt-1 text-xs leading-relaxed text-gray-500">{subtitle}</div>
    </button>
  );
}

export function FeaturedModelCard({
  active,
  tag,
  title,
  subtitle,
  note,
  onClick,
  activeLabel = "✓ Selected",
  inactiveLabel = "Select",
}: {
  active: boolean;
  tag: string;
  title: string;
  subtitle: string;
  note: string;
  onClick: () => void;
  activeLabel?: string;
  inactiveLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`w-full overflow-hidden rounded-[24px] border text-left transition-all active:scale-[0.99] ${
        active
          ? "border-violet-200 bg-violet-50/80 shadow-sm shadow-violet-100/80"
          : "border-gray-200 bg-white hover:border-violet-200 hover:bg-violet-50/40"
      }`}
    >
      {active && <div className="h-[3px] w-full bg-violet-400/90" />}
      <div className="p-4">
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
              active ? "bg-violet-100 text-violet-700" : "bg-gray-100 text-gray-500"
            }`}
          >
            {tag}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
              active ? "bg-violet-600 text-white" : "bg-gray-200 text-gray-600"
            }`}
          >
            {active ? activeLabel : inactiveLabel}
          </span>
        </div>
        <div className="text-sm font-semibold tracking-tight text-gray-900">{title}</div>
        <div className="mt-1 text-xs leading-relaxed text-gray-600">{subtitle}</div>
        <div
          className={`mt-3 rounded-2xl border px-3 py-2.5 text-[11px] font-medium leading-relaxed ${
            active
              ? "border-violet-100 bg-white/80 text-violet-700"
              : "border-gray-200 bg-gray-50 text-gray-500"
          }`}
        >
          {note}
        </div>
      </div>
    </button>
  );
}
