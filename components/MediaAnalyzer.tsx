"use client";

// ─────────────────────────────────────────────────────────────
// components/MediaAnalyzer.tsx
// WSTV — Media Upload + AI Analysis Panel
// ─────────────────────────────────────────────────────────────

import { useRef, useState } from "react";
import type { AIProvider, MediaAnalysisResult } from "@/types";

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
const SUPPORTED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]); // raw base64, no data-URL prefix
    };
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const DRIFT_COLORS: Record<"HIGH" | "MEDIUM" | "LOW", string> = {
  HIGH: "text-red-600 bg-red-50 border-red-200",
  MEDIUM: "text-yellow-600 bg-yellow-50 border-yellow-200",
  LOW: "text-green-600 bg-green-50 border-green-200",
};

// ✅ ALWAYS convert unknown -> string (prevents [object Object])
function toErrorMessage(err: unknown): string {
  if (typeof err === "string") return err;

  if (err instanceof Error) return err.message || "Unknown error";

  if (err && typeof err === "object") {
    const anyErr = err as Record<string, unknown>;
    if (typeof anyErr.message === "string") return anyErr.message;
    if (typeof anyErr.error === "string") return anyErr.error;
    if (typeof anyErr.details === "string") return anyErr.details;
    if (typeof anyErr.detail === "string") return anyErr.detail;

    try {
      return JSON.stringify(err);
    } catch {
      return "Unknown error";
    }
  }

  return "Unknown error";
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────
export type MediaAnalyzerProps = {
  onAnalysisComplete: (result: MediaAnalysisResult) => void;
  onClear: () => void;
  activeProvider: AIProvider;
  analysis: MediaAnalysisResult | null;
};

export default function MediaAnalyzer({
  onAnalysisComplete,
  onClear,
  activeProvider,
  analysis,
}: MediaAnalyzerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string>(""); // ✅ keep string only
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isVideoFile = file ? SUPPORTED_VIDEO_TYPES.includes(file.type) : false;

  // ── Validation ──────────────────────────────────────────────
  function validateFile(f: File): string | null {
    const isImg = SUPPORTED_IMAGE_TYPES.includes(f.type);
    const isVid = SUPPORTED_VIDEO_TYPES.includes(f.type);
    if (!isImg && !isVid) return `Unsupported: ${f.type}. JPG, PNG, GIF, WebP, MP4, WebM मात्र।`;
    if (isImg && f.size > MAX_IMAGE_BYTES) return `Image too large: ${formatFileSize(f.size)}. Max 10MB।`;
    if (isVid && f.size > MAX_VIDEO_BYTES) return `Video too large: ${formatFileSize(f.size)}. Max 50MB।`;
    return null;
  }

  // ── File selection ──────────────────────────────────────────
  function handleFileSelect(f: File) {
    setError("");
    const err = validateFile(f);
    if (err) {
      setError(err);
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  // ── Analyze ─────────────────────────────────────────────────
  async function handleAnalyze() {
    if (!file) return;
    setIsAnalyzing(true);
    setError("");

    try {
      const base64Data = await fileToBase64(file);
      const isVid = SUPPORTED_VIDEO_TYPES.includes(file.type);

      // Video → always Gemini (Claude Vision does not support video files)
      // Image → use activeProvider if claude, else gemini
      const provider = !isVid && activeProvider === "claude" ? "claude" : "gemini";

      const res = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analyzeMedia: true,
          mediaType: isVid ? "video" : "image",
          base64Data,
          mimeType: file.type,
          provider,
        }),
      });

      if (!res.ok) {
        let message: unknown = `HTTP ${res.status}`;
        try {
          const d = await res.json();
          message = d?.details ?? d?.error ?? d?.message ?? message; // might be object
        } catch {
          try {
            message = await res.text();
          } catch {
            // keep status
          }
        }
        throw new Error(toErrorMessage(message));
      }

      const data = await res.json();
      if (!data?.analysis) throw new Error("No analysis returned");
      onAnalysisComplete(data.analysis as MediaAnalysisResult);
    } catch (err) {
      // ✅ This is the main fix: never store object in error state
      setError(toErrorMessage(err));
    } finally {
      setIsAnalyzing(false);
    }
  }

  // ── Clear ───────────────────────────────────────────────────
  function handleClear() {
    setFile(null);
    setPreview(null);
    setError("");
    onClear();
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 shadow-sm">
      {/* ── Header ── */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-gray-900">📎 Upload Wildlife Media</span>
        <span className="rounded bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
          Image + Video → Auto Analyze → Same Look Prompts
        </span>
        {analysis && (
          <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
            ✓ {analysis.animalName} Analyzed
          </span>
        )}
      </div>

      {/* ── Upload zone (shown when no file and no analysis) ── */}
      {!file && !analysis && (
        <>
          <div
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) handleFileSelect(f);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all ${
              dragOver
                ? "border-violet-500 bg-violet-100"
                : "border-violet-300 bg-white hover:border-violet-400 hover:bg-violet-50"
            }`}
          >
            <div className="mb-2 text-4xl">🦁</div>
            <p className="mb-1 text-sm font-semibold text-gray-700">Drop your wildlife photo or video here</p>
            <p className="mb-3 text-xs text-gray-400">
              JPG, PNG, GIF, WebP (max 10MB) &nbsp;|&nbsp; MP4, WebM (max 50MB)
            </p>
            <span className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white">Browse Files</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileSelect(f);
              }}
              className="hidden"
            />
          </div>

          <p className="mt-3 text-xs text-violet-600">
            तपाईंको wildlife photo वा video upload गर्नुस् — AI ले same animal, same environment, same lighting को prompts
            automatically generate गर्छ।
          </p>
        </>
      )}

      {/* ── File preview + Analyze button (file selected, not yet analyzed) ── */}
      {file && preview && !analysis && (
        <div className="rounded-xl border border-violet-200 bg-white p-3">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{isVideoFile ? "🎬" : "🖼️"}</span>
              <div>
                <p className="max-w-[200px] truncate text-sm font-semibold text-gray-800">{file.name}</p>
                <p className="text-xs text-gray-400">
                  {formatFileSize(file.size)} ·{" "}
                  {isVideoFile
                    ? "Video — Gemini Vision"
                    : `Image — ${activeProvider === "claude" ? "Claude Vision" : "Gemini Vision"}`}
                </p>
              </div>
            </div>
            <button
              onClick={handleClear}
              className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
            >
              ✕ Remove
            </button>
          </div>

          {/* Preview */}
          <div className="mb-3 overflow-hidden rounded-lg bg-black">
            {isVideoFile ? (
              <video src={preview} controls className="max-h-48 w-full object-contain" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Wildlife preview" className="max-h-48 w-full object-contain" />
            )}
          </div>

          {/* Analyze button */}
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full rounded-lg bg-violet-600 py-2.5 text-sm font-bold text-white transition-all hover:bg-violet-700 disabled:opacity-60 active:scale-95"
          >
            {isAnalyzing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                {isVideoFile ? "Video analyze गर्दैछ..." : "Image analyze गर्दैछ..."}
              </span>
            ) : (
              `✦ Analyze ${isVideoFile ? "Video" : "Image"} → Same Look Prompts Generate गर्नुस्`
            )}
          </button>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-xs font-semibold text-red-700">⚠️ {error}</p>
        </div>
      )}

      {/* ── Analysis result ── */}
      {analysis && (
        <div className="space-y-3">
          {/* Animal Card */}
          <div className="rounded-xl border border-green-200 bg-green-50 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-base font-bold text-green-900">✓ {analysis.animalName} Detected</p>
                <p className="text-xs text-green-600">
                  {analysis.isVideo ? "🎬 Video" : "🖼️ Image"} analyzed · {analysis.timeOfDay} · {analysis.weather}
                </p>
              </div>
              <span className={`rounded border px-2 py-1 text-xs font-bold ${DRIFT_COLORS[analysis.driftRisk]}`}>
                DRIFT {analysis.driftRisk}
              </span>
            </div>

            <div className="grid gap-2 text-xs md:grid-cols-2">
              <div className="rounded-lg bg-white p-2">
                <p className="font-semibold text-gray-500">🐾 Coat/Markings</p>
                <p className="mt-0.5 text-gray-700">{analysis.coatDescription}</p>
              </div>
              <div className="rounded-lg bg-white p-2">
                <p className="font-semibold text-gray-500">🌿 Environment</p>
                <p className="mt-0.5 text-gray-700">{analysis.environment}</p>
              </div>
              <div className="rounded-lg bg-white p-2">
                <p className="font-semibold text-gray-500">💡 Lighting</p>
                <p className="mt-0.5 text-gray-700">{analysis.lighting}</p>
              </div>
              <div className="rounded-lg bg-white p-2">
                <p className="font-semibold text-gray-500">🎯 Suggested Arc</p>
                <p className="mt-0.5 font-medium text-violet-700">{analysis.suggestedArc}</p>
              </div>
            </div>

            {analysis.isVideo && analysis.videoAction && (
              <div className="mt-2 rounded-lg bg-white p-2 text-xs">
                <p className="font-semibold text-gray-500">🎬 Video Action</p>
                <p className="mt-0.5 text-gray-700">{analysis.videoAction}</p>
              </div>
            )}
          </div>

          {/* Auto-applied badges */}
          <div className="rounded-lg border border-violet-200 bg-white p-3 text-xs text-violet-700">
            <p className="mb-1 font-semibold">✦ Auto-applied to prompts:</p>
            <div className="flex flex-wrap gap-1">
              <span className="rounded bg-violet-100 px-2 py-0.5">Weather: {analysis.weather}</span>
              <span className="rounded bg-violet-100 px-2 py-0.5">Depth: {analysis.suggestedDepth}</span>
              <span className="rounded bg-violet-100 px-2 py-0.5">Arc: {analysis.suggestedArc}</span>
              <span className="rounded bg-green-100 px-2 py-0.5 text-green-700">Full description injected ✓</span>
            </div>
          </div>

          {/* Image Prompt Inject */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800">📸 Image Prompt Inject</span>
              <button
                onClick={() => navigator.clipboard.writeText(analysis.imagePromptInject)}
                className="rounded bg-amber-600 px-2 py-1 text-xs text-white hover:bg-amber-700 active:scale-95"
              >
                Copy
              </button>
            </div>
            <p className="line-clamp-3 text-xs leading-relaxed text-amber-900">{analysis.imagePromptInject}</p>
          </div>

          {/* Video Motion Inject */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-blue-800">🎬 Video Motion Inject</span>
              <button
                onClick={() => navigator.clipboard.writeText(analysis.videoMotionInject)}
                className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 active:scale-95"
              >
                Copy
              </button>
            </div>
            <p className="text-xs leading-relaxed text-blue-900">{analysis.videoMotionInject}</p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleClear}
              className="flex-1 rounded-lg border border-violet-300 bg-white py-2 text-xs font-semibold text-violet-700 hover:bg-violet-50 active:scale-95"
            >
              ↺ New Upload
            </button>
            <button
              onClick={handleClear}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 active:scale-95"
            >
              ✕ Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
