"use client";

import { arcs } from "@/lib/model-specs";
import { habitatPromptMap } from "@/lib/habitat-presets";

type CustomAnimalModalProps = {
  open: boolean;
  form: {
    name: string;
    prey: string;
    environment: string;
    defaultArc: string;
    driftRisk: "LOW" | "MEDIUM" | "HIGH";
  };
  onClose: () => void;
  onNameChange: (value: string) => void;
  onPreyChange: (value: string) => void;
  onEnvironmentChange: (value: string) => void;
  onDefaultArcChange: (value: string) => void;
  onDriftRiskChange: (value: "LOW" | "MEDIUM" | "HIGH") => void;
  onSave: () => void;
  onDelete: () => void;
};

export default function CustomAnimalModal({
  open,
  form,
  onClose,
  onNameChange,
  onPreyChange,
  onEnvironmentChange,
  onDefaultArcChange,
  onDriftRiskChange,
  onSave,
  onDelete,
}: CustomAnimalModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-gray-950/60 p-4 backdrop-blur-md">
      <div className="w-full max-w-xl overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
        <div className="border-b border-gray-200 bg-gradient-to-b from-gray-50 to-white px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                Custom Animal
              </div>
              <div className="mt-1 text-lg font-bold text-gray-900">
                Add or update a saved entry
              </div>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-gray-500">
                Store a reusable animal preset locally without changing the current
                generation flow.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm shadow-gray-200/70 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-5 rounded-2xl border border-violet-100 bg-violet-50/70 px-4 py-3">
            <div className="text-xs font-semibold text-violet-700">Saved locally</div>
            <div className="mt-1 text-[11px] leading-relaxed text-violet-600">
              This preset appears in the animal dropdown and remains available in
              future sessions on this device.
            </div>
          </div>

          <div className="mb-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">
              Preset Details
            </div>
            <div className="mt-1 text-sm font-medium text-gray-500">
              Use the fields below to save a new animal or update an existing custom
              entry.
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500">
                Animal name
              </label>
              <input
                value={form.name}
                onChange={(event) => onNameChange(event.target.value)}
                placeholder="e.g., Mountain Lion"
                className="w-full rounded-2xl border border-gray-200 bg-gray-50/80 px-3.5 py-3 text-sm text-gray-800 shadow-sm shadow-gray-100/80 transition focus:border-gray-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-gray-200/60"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500">
                Opposing animals (comma-separated)
              </label>
              <input
                value={form.prey}
                onChange={(event) => onPreyChange(event.target.value)}
                placeholder="e.g., White-tailed Deer, Elk"
                className="w-full rounded-2xl border border-gray-200 bg-gray-50/80 px-3.5 py-3 text-sm text-gray-800 shadow-sm shadow-gray-100/80 transition focus:border-gray-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-gray-200/60"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500">
                Environment
              </label>
              <select
                value={form.environment}
                onChange={(event) => onEnvironmentChange(event.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50/80 px-3.5 py-3 text-sm text-gray-800 shadow-sm shadow-gray-100/80 transition focus:border-gray-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-gray-200/60"
              >
                {Object.entries(habitatPromptMap).map(([label, prompt]) => (
                  <option key={label} value={prompt}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500">
                Default Arc
              </label>
              <select
                value={form.defaultArc}
                onChange={(event) => onDefaultArcChange(event.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50/80 px-3.5 py-3 text-sm text-gray-800 shadow-sm shadow-gray-100/80 transition focus:border-gray-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-gray-200/60"
              >
                {arcs.map((arc) => (
                  <option key={arc} value={arc}>
                    {arc}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500">
                Drift Risk
              </label>
              <select
                value={form.driftRisk}
                onChange={(event) =>
                  onDriftRiskChange(event.target.value as "LOW" | "MEDIUM" | "HIGH")
                }
                className="w-full rounded-2xl border border-gray-200 bg-gray-50/80 px-3.5 py-3 text-sm text-gray-800 shadow-sm shadow-gray-100/80 transition focus:border-gray-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-gray-200/60"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-5">
            <button
              type="button"
              onClick={onSave}
              className="rounded-2xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-gray-300/70 hover:bg-black active:scale-[0.98]"
            >
              Save & Select
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="rounded-2xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 active:scale-[0.98]"
            >
              Delete
            </button>
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-gray-400">
            Save गरेपछि यो animal dropdown मा add हुन्छ र future sessions मा पनि रहन्छ
            (localStorage).
          </p>
        </div>
      </div>
    </div>
  );
}
