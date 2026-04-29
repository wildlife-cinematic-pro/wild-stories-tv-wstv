"use client";

export type StoryboardPromptFilter =
  | "all"
  | "image"
  | "master-image"
  | "nano-banana"
  | "gpt-image"
  | "video"
  | "runway"
  | "kling"
  | "support";

type StoryboardPromptFilterProps = {
  value: StoryboardPromptFilter;
  onChange: (value: StoryboardPromptFilter) => void;
};

const FILTER_OPTIONS: Array<{
  value: StoryboardPromptFilter;
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "image", label: "Image" },
  { value: "master-image", label: "Master Image" },
  { value: "nano-banana", label: "Nano Banana 2" },
  { value: "gpt-image", label: "GPT Image 2" },
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
      {FILTER_OPTIONS.map((option) => {
        const isActive = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
              isActive
                ? "border-cyan-400/60 bg-cyan-500/10 text-cyan-200"
                : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text)] hover:border-cyan-400/60 hover:text-cyan-200"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
