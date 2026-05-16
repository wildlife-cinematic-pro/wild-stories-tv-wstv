"use client";

export default function ChipGrid<T extends string>({
  label,
  items,
  value,
  onChange,
  columns = "grid-cols-2",
}: {
  label: string;
  items: readonly T[];
  value: T;
  onChange: (value: T) => void;
  columns?: string;
}) {
  return (
    <section className="min-w-0 rounded-[24px] border border-white/[0.08] bg-white/[0.035] p-3 sm:rounded-3xl sm:p-4">
      <label className="mb-2.5 block text-xs font-black uppercase tracking-[0.16em] text-white/45">
        {label}
      </label>
      <div className={`grid min-w-0 gap-2 ${columns}`}>
        {items.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            className={`min-w-0 rounded-2xl border px-3 py-2 text-left text-xs font-bold leading-snug transition [overflow-wrap:anywhere] ${
              value === item
                ? "border-white bg-white text-gray-950"
                : "border-white/[0.08] bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </section>
  );
}
