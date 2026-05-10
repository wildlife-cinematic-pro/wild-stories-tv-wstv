"use client";

import { useMemo, useState } from "react";

type AnimalSearchSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  helper?: string;
  manualOverride?: boolean;
};

function normalizeOption(value: string) {
  return value.trim().toLowerCase();
}

function uniqueOptions(options: string[]) {
  const seen = new Set<string>();

  return options.filter((option) => {
    const normalized = normalizeOption(option);
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

function ManualOverrideBadge({ show }: { show?: boolean }) {
  if (!show) return null;

  return (
    <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-amber-200">
      Manual override
    </span>
  );
}

export default function AnimalSearchSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Search animal...",
  helper,
  manualOverride,
}: AnimalSearchSelectProps) {
  const [search, setSearch] = useState("");
  const trimmedValue = value.trim();
  const trimmedSearch = search.trim();
  const query = trimmedSearch.toLowerCase();

  const filteredOptions = useMemo(() => {
    const searchableOptions = uniqueOptions([
      ...(trimmedValue ? [trimmedValue] : []),
      ...options,
    ]);

    if (!query) return searchableOptions;

    return searchableOptions.filter((option) =>
      option.toLowerCase().includes(query)
    );
  }, [options, query, trimmedValue]);

  const selectOptions = filteredOptions.length
    ? filteredOptions
    : trimmedValue
      ? [trimmedValue]
      : [];
  const canUseCustom =
    Boolean(trimmedSearch) &&
    normalizeOption(trimmedSearch) !== normalizeOption(trimmedValue) &&
    !options.some(
      (option) => normalizeOption(option) === normalizeOption(trimmedSearch)
    );

  return (
    <label className="block">
      <span className="mb-1.5 flex min-h-[20px] flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
        <span>{label}</span>
        <ManualOverrideBadge show={manualOverride} />
      </span>
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={placeholder}
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm font-semibold text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-amber-400/70"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs font-bold text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-100"
            >
              Clear
            </button>
          ) : null}
        </div>

        <select
          value={trimmedValue}
          onChange={(event) => {
            onChange(event.target.value);
            setSearch("");
          }}
          className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm font-semibold text-zinc-100 outline-none transition focus:border-amber-400/70"
        >
          {selectOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        {canUseCustom ? (
          <button
            type="button"
            onClick={() => {
              onChange(trimmedSearch);
              setSearch("");
            }}
            className="w-full rounded-xl border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-left text-xs font-bold text-amber-100 transition hover:border-amber-300/70 hover:bg-amber-400/15"
          >
            Use custom text: {trimmedSearch}
          </button>
        ) : null}
      </div>

      {query && filteredOptions.length === 0 ? (
        <span className="mt-1 block text-[11px] leading-relaxed text-amber-300">
          No preset match. Current value is kept, or use the custom text above.
        </span>
      ) : helper ? (
        <span className="mt-1 block text-[11px] leading-relaxed text-zinc-500">
          {helper}
        </span>
      ) : null}
    </label>
  );
}
