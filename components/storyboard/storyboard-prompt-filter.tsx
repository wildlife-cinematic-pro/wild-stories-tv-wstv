"use client";

export type StoryboardPromptFilterValue =
  | "all"
  | "image"
  | "video"
  | "runway"
  | "kling"
  | "support";

type StoryboardPromptFilterProps = {
  value: StoryboardPromptFilterValue;
  onChange: (value: StoryboardPromptFilterValue) => void;
};

const FILTER_OPTIONS: Array<{
  value: StoryboardPromptFilterValue;
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
  { value: "runway", label: "Runway" },
  { value: "kling", label: "Kling" },
  { value: "support", label: "Negative / Continuity" },
];

export default function StoryboardPromptFilter({
  value,
  onChange,
}: StoryboardPromptFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTER_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
            value === option.value
              ? "border-cyan-400/50 bg-cyan-500/10 text-cyan-200"
              : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text)] hover:border-cyan-400/60 hover:text-cyan-200"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
