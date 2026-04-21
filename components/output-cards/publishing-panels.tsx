"use client";

import { useState } from "react";

import type {
  FacebookFrameHeuristics,
  PlatformPack,
  PlatformTarget,
} from "@/types";

import { getUSAPostingTimes } from "@/lib/predator-data";

const HOOK_FAMILY_LABELS = ["Danger", "Curiosity", "Reversal"] as const;

function FacebookFrameHeuristicsSummary({
  heuristics,
}: {
  heuristics?: FacebookFrameHeuristics;
}) {
  if (!heuristics) return null;

  return (
    <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[11px] leading-5 text-gray-700">
      <div className="grid gap-1 sm:grid-cols-2">
        <p>
          <strong>Species readability:</strong> {heuristics.speciesReadability}
        </p>
        <p>
          <strong>Text collision risk:</strong> {heuristics.textAnimalCollisionRisk}
        </p>
        <p>
          <strong>Silhouette conflict:</strong> {heuristics.silhouetteConflictRisk}
        </p>
        <p>
          <strong>Subject fit:</strong> {heuristics.leftRightSubjectFit}
        </p>
        <p className="sm:col-span-2">
          <strong>Frame-1 call:</strong> {heuristics.frame1Choice}
        </p>
      </div>
      <p className="mt-2 text-[11px] text-gray-600">{heuristics.summary}</p>
    </div>
  );
}

export function Hook2026Panel({
  hooks,
  oldHook,
  onCopy,
  recommendedIndex = 0,
}: {
  hooks: string[];
  oldHook: string;
  onCopy: (text: string) => void;
  recommendedIndex?: number;
}) {
  const joined = hooks
    .map(
      (hook, index) =>
        `V${index + 1}${index === recommendedIndex ? " (Recommended)" : ""}: ${hook}`
    )
    .join("\n");

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900">
            🔥 Auto Hook Variations ×3
          </span>
          <span className="rounded bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700">
            Generated Automatically
          </span>
        </div>
        <button
          onClick={() => onCopy(joined)}
          className="rounded bg-orange-600 px-3 py-1 text-xs font-bold text-white hover:bg-orange-700 active:scale-95"
          type="button"
        >
          Copy All 3
        </button>
      </div>

      <p className="mb-3 text-xs leading-5 text-orange-800">
        Animal, prey, arc change गरेपछि hook variations पनि आफैँ बदलिन्छन्।
        Recommended badge भएको hook पहिला test गर्नुस्।
      </p>

      <div className="mb-3 space-y-2">
        {hooks.map((hook, index) => (
          <div
            key={index}
            className={`flex items-start gap-2 rounded-lg border p-3 ${
              index === recommendedIndex
                ? "border-orange-400 bg-white shadow-sm"
                : "border-orange-200 bg-white"
            }`}
          >
            <span
              className={`mt-0.5 rounded px-1.5 py-0.5 text-xs font-bold ${
                index === recommendedIndex
                  ? "bg-orange-500 text-white"
                  : "bg-orange-100 text-orange-600"
              }`}
            >
              V{index + 1}
            </span>
            <div className="flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                {index === recommendedIndex && (
                  <span className="rounded bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                    Recommended
                  </span>
                )}
                <span className="text-[11px] font-semibold text-gray-500">
                  {HOOK_FAMILY_LABELS[index] ?? ""}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-800">{hook}</p>
            </div>
            <button
              onClick={() => onCopy(hook)}
              className="shrink-0 rounded bg-gray-900 px-2 py-1 text-xs text-white hover:bg-black active:scale-95"
              type="button"
            >
              Copy
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-2">
        <p className="mb-1 text-xs text-gray-500">Fallback / old hook:</p>
        <div className="flex items-start gap-2">
          <p className="flex-1 text-xs text-gray-600">{oldHook}</p>
          <button
            onClick={() => onCopy(oldHook)}
            className="shrink-0 rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 active:scale-95"
            type="button"
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  );
}

export function Caption2026Panel({
  caption2026,
  captionOld,
  onCopy,
}: {
  caption2026: string;
  captionOld: string;
  onCopy: (text: string) => void;
}) {
  const bothCaptions = [
    captionOld ? `SHORT CAPTION\n${captionOld}` : "",
    caption2026 ? `LONG CAPTION\n${caption2026}` : "",
  ]
    .filter(Boolean)
    .join("\n\n---\n\n");

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-gray-900">
            📝 Publishing Captions
          </span>
          <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
            Short + long variants
          </span>
        </div>
        <button
          onClick={() => onCopy(bothCaptions)}
          className="rounded bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700 active:scale-95"
          type="button"
        >
          Copy Both
        </button>
      </div>

      <p className="mb-3 text-xs leading-5 text-emerald-800">
        Short caption छिटो post/test को लागि, long caption story-led publish वा
        description slot को लागि ready राखिएको छ.
      </p>

      <div className="space-y-3">
        {captionOld && (
          <div className="rounded-lg border border-emerald-100 bg-white p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                  Short Caption
                </p>
                <p className="text-[11px] text-gray-500">
                  Fast publishing / default caption
                </p>
              </div>
              <button
                onClick={() => onCopy(captionOld)}
                className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-100 active:scale-95"
                type="button"
              >
                Copy Short
              </button>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-7 text-gray-800">
              {captionOld}
            </p>
          </div>
        )}

        {caption2026 && (
          <div className="rounded-lg border border-emerald-100 bg-white p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                  Long Caption
                </p>
                <p className="text-[11px] text-gray-500">
                  Story-led publish / description variant
                </p>
              </div>
              <button
                onClick={() => onCopy(caption2026)}
                className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-100 active:scale-95"
                type="button"
              >
                Copy Long
              </button>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-7 text-gray-800">
              {caption2026}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function PostingTimesPanel() {
  const times = getUSAPostingTimes();
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-gray-900">
            🕐 USA Optimal Posting Times
          </span>
          <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
            EST · CST · PST
          </span>
          <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
            Planning Panel ✓
          </span>
        </div>
        <button
          onClick={() => setOpen((value) => !value)}
          className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 active:scale-95"
          type="button"
        >
          {open ? "Hide ▲" : "Show ▼"}
        </button>
      </div>

      {open && (
        <div className="mt-3 space-y-3">
          <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-800">
            🔥 <strong>Start here:</strong> Test morning and midday windows
            first, then keep the winners from your own Facebook Insights.
          </div>

          {times.map((day, index) => (
            <div
              key={index}
              className="rounded-lg border border-blue-200 bg-white p-3"
            >
              <p className="mb-2 text-xs font-bold text-blue-800">{day.day}</p>
              <div className="space-y-1.5">
                {day.slots.map((slot, slotIndex) => (
                  <div
                    key={slotIndex}
                    className="flex flex-wrap items-start gap-2"
                  >
                    <span className="text-sm">{slot.priority}</span>
                    <span
                      className={`shrink-0 rounded px-2 py-0.5 text-xs font-bold ${
                        slotIndex === 0
                          ? "bg-red-100 text-red-700"
                          : slotIndex === 1
                            ? "bg-orange-100 text-orange-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {slot.zone}
                    </span>
                    <span className="text-xs font-semibold text-gray-800">
                      {slot.time}
                    </span>
                    <span className="text-xs text-gray-500">— {slot.why}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-2 text-xs text-yellow-800">
            💡 <strong>Pro tip:</strong> Reply quickly to early comments so the
            reel feels active and conversational while it is fresh.
          </div>
        </div>
      )}
    </div>
  );
}

export function PlatformPackPanel({
  pack,
  onCopy,
}: {
  pack: PlatformPack;
  onCopy: (text: string) => void;
}) {
  const [platform, setPlatform] = useState<PlatformTarget>("facebook");
  const platforms: PlatformTarget[] = [
    "facebook",
    "instagram",
    "tiktok",
    "youtube_shorts",
  ];

  const labels: Record<PlatformTarget, string> = {
    facebook: "📘 Facebook",
    instagram: "📷 Instagram",
    tiktok: "🎵 TikTok",
    youtube_shorts: "▶ YouTube Shorts",
  };

  const colors: Record<PlatformTarget, string> = {
    facebook: "bg-blue-600",
    instagram: "bg-pink-600",
    tiktok: "bg-gray-900",
    youtube_shorts: "bg-red-600",
  };

  const data = pack[platform];
  const facebookOverlayRecommendation =
    platform === "facebook" ? pack.facebook.facebookOverlayRecommendation : undefined;
  const facebookCoverFrameRanking =
    platform === "facebook" ? pack.facebook.facebookCoverFrameRanking : undefined;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex overflow-hidden rounded-lg border border-gray-200">
        {platforms.map((entry) => (
          <button
            key={entry}
            onClick={() => setPlatform(entry)}
            className={`flex-1 py-2 text-xs font-bold transition-all ${
              platform === entry
                ? `${colors[entry]} text-white`
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
            type="button"
          >
            {labels[entry]}
          </button>
        ))}
      </div>

      {platform === "facebook" && (
        <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-2 text-xs text-blue-800">
          🏷️ <strong>Meta note:</strong> {pack.facebook.cmpNote}
        </div>
      )}

      <div className="space-y-2">
        {"title" in data ? (
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs font-bold text-gray-500">Title</p>
            <p className="mt-1 text-sm text-gray-800">{data.title}</p>
            <button
              onClick={() => onCopy(data.title)}
              className="mt-2 rounded bg-gray-900 px-2 py-1 text-xs text-white"
              type="button"
            >
              Copy
            </button>
          </div>
        ) : (
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs font-bold text-gray-500">Hook</p>
            <p className="mt-1 text-sm font-semibold text-gray-800">
              {data.hook}
            </p>
            <button
              onClick={() => onCopy(data.hook)}
              className="mt-2 rounded bg-gray-900 px-2 py-1 text-xs text-white"
              type="button"
            >
              Copy
            </button>
          </div>
        )}

        {data.overlayGuidance ? (
          <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-sky-700">
              First-Frame Overlay Guidance
            </p>
            <div className="mt-2 space-y-2 leading-5">
              <p>
                <strong>Placement:</strong> {data.overlayGuidance.placement}
              </p>
              <p>
                <strong>Text length:</strong> {data.overlayGuidance.textLength}
              </p>
              <p>
                <strong>Opener:</strong> {data.overlayGuidance.opener}
              </p>
              <p>
                <strong>Audio:</strong> {data.overlayGuidance.audio}
              </p>
              <p>
                <strong>Tone:</strong> {data.overlayGuidance.tone}
              </p>
            </div>
          </div>
        ) : null}

        {data.hookFormattingPresets?.length ? (
          <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-indigo-700">
                Hook Text Formatting Presets
              </p>
              <span className="rounded bg-white px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                Overlay-ready
              </span>
            </div>
            <div className="space-y-2">
              {data.hookFormattingPresets.map((preset) => (
                <div
                  key={preset.preset}
                  className="rounded-lg border border-indigo-100 bg-white p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-gray-800">{preset.label}</p>
                      <p className="mt-1 text-[11px] leading-5 text-gray-500">
                        {preset.note}
                      </p>
                    </div>
                    <button
                      onClick={() => onCopy(preset.text)}
                      className="shrink-0 rounded bg-gray-900 px-2 py-1 text-xs text-white"
                      type="button"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="mt-2 rounded bg-gray-50 px-3 py-2">
                    <p className="whitespace-pre-line text-sm font-semibold leading-6 text-gray-900">
                      {preset.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {facebookOverlayRecommendation ? (
          <div className="rounded-lg border border-blue-300 bg-blue-50 p-3">
            <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-blue-700">
                  Recommended Facebook Overlay
                </p>
                <p className="mt-1 text-[11px] leading-5 text-blue-900">
                  {facebookOverlayRecommendation.reason}
                </p>
              </div>
              <span className="rounded bg-white px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                Score {facebookOverlayRecommendation.recommended.score}
              </span>
            </div>
            <div className="rounded bg-white px-3 py-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-gray-800">
                    {facebookOverlayRecommendation.recommended.label}
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm font-semibold leading-6 text-gray-900">
                    {facebookOverlayRecommendation.recommended.text}
                  </p>
                </div>
                <button
                  onClick={() =>
                    onCopy(facebookOverlayRecommendation.recommended.text)
                  }
                  className="shrink-0 rounded bg-blue-700 px-2 py-1 text-xs text-white"
                  type="button"
                >
                  Copy
                </button>
              </div>
              <FacebookFrameHeuristicsSummary
                heuristics={
                  facebookOverlayRecommendation.recommended.frameHeuristics
                }
              />
            </div>
            {facebookOverlayRecommendation.alternatives.length ? (
              <p className="mt-2 text-[11px] leading-5 text-blue-900">
                Secondary tests: {facebookOverlayRecommendation.alternatives
                  .map((entry) => `${entry.label} (${entry.score})`)
                  .join(", ")}
              </p>
            ) : null}
          </div>
        ) : null}

        {platform === "facebook" && pack.facebook.facebookOverlayPresets?.length ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-blue-700">
                Facebook First-Frame Overlay Presets
              </p>
              <span className="rounded bg-white px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                Reels-ready
              </span>
            </div>
            <div className="space-y-2">
              {pack.facebook.facebookOverlayPresets.map((preset) => (
                <div
                  key={preset.preset}
                  className="rounded-lg border border-blue-100 bg-white p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-gray-800">{preset.label}</p>
                      <p className="mt-1 text-[11px] leading-5 text-gray-500">
                        {preset.note}
                      </p>
                    </div>
                    <button
                      onClick={() => onCopy(preset.text)}
                      className="shrink-0 rounded bg-blue-700 px-2 py-1 text-xs text-white"
                      type="button"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="mt-2 rounded bg-gray-50 px-3 py-2">
                    <p className="whitespace-pre-line text-sm font-semibold leading-6 text-gray-900">
                      {preset.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {facebookCoverFrameRanking ? (
          <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3">
            <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-emerald-700">
                  Best Facebook Cover-Frame Choice
                </p>
                <p className="mt-1 text-[11px] leading-5 text-emerald-900">
                  {facebookCoverFrameRanking.reason}
                </p>
              </div>
              <span className="rounded bg-white px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                Score {facebookCoverFrameRanking.best.score}
              </span>
            </div>
            <div className="rounded bg-white px-3 py-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-gray-800">
                    {facebookCoverFrameRanking.best.label}
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm font-semibold leading-6 text-gray-900">
                    {facebookCoverFrameRanking.best.text}
                  </p>
                </div>
                <button
                  onClick={() => onCopy(facebookCoverFrameRanking.best.text)}
                  className="shrink-0 rounded bg-emerald-700 px-2 py-1 text-xs text-white"
                  type="button"
                >
                  Copy
                </button>
              </div>
              <FacebookFrameHeuristicsSummary
                heuristics={facebookCoverFrameRanking.best.frameHeuristics}
              />
            </div>
            <ol className="mt-2 space-y-1 text-[11px] leading-5 text-emerald-950">
              {facebookCoverFrameRanking.ranked.map((entry, index) => (
                <li key={entry.preset} className="flex justify-between gap-3">
                  <span>
                    #{index + 1} {entry.label}
                  </span>
                  <span className="font-semibold">{entry.score}</span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        {platform === "facebook" && pack.facebook.facebookCoverFramePresets?.length ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-emerald-700">
                Facebook Cover-Frame Text Presets
              </p>
              <span className="rounded bg-white px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                Grid/share preview
              </span>
            </div>
            <div className="space-y-2">
              {pack.facebook.facebookCoverFramePresets.map((preset) => (
                <div
                  key={preset.preset}
                  className="rounded-lg border border-emerald-100 bg-white p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-gray-800">{preset.label}</p>
                      <p className="mt-1 text-[11px] leading-5 text-gray-500">
                        {preset.note}
                      </p>
                    </div>
                    <button
                      onClick={() => onCopy(preset.text)}
                      className="shrink-0 rounded bg-emerald-700 px-2 py-1 text-xs text-white"
                      type="button"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="mt-2 rounded bg-gray-50 px-3 py-2">
                    <p className="whitespace-pre-line text-sm font-semibold leading-6 text-gray-900">
                      {preset.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs font-bold text-gray-500">
            {"description" in data ? "Description" : "Caption"}
          </p>
          <p className="mt-1 whitespace-pre-wrap text-xs leading-6 text-gray-700">
            {"description" in data ? data.description : data.caption}
          </p>
          <button
            onClick={() =>
              onCopy("description" in data ? data.description : data.caption)
            }
            className="mt-2 rounded bg-gray-900 px-2 py-1 text-xs text-white"
            type="button"
          >
            Copy
          </button>
        </div>

        {"hashtags" in data && data.hashtags ? (
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs font-bold text-gray-500">Hashtags</p>
            <p className="mt-1 text-xs text-gray-700">{data.hashtags}</p>
            <button
              onClick={() => onCopy(data.hashtags)}
              className="mt-2 rounded bg-gray-900 px-2 py-1 text-xs text-white"
              type="button"
            >
              Copy
            </button>
          </div>
        ) : null}

        {"tags" in data && typeof data.tags === "string" && data.tags.trim() ? (
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs font-bold text-gray-500">Tags</p>
            <p className="mt-1 text-xs text-gray-700">{data.tags}</p>
            <button
              onClick={() => onCopy(String(data.tags))}
              className="mt-2 rounded bg-gray-900 px-2 py-1 text-xs text-white"
              type="button"
            >
              Copy
            </button>
          </div>
        ) : null}

        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-700">
          🕐 <strong>Best time to test:</strong> {data.bestTime}
        </div>

        {data.strategyNote && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800">
            💡 <strong>Strategy:</strong> {data.strategyNote}
          </div>
        )}
      </div>
    </div>
  );
}
