"use client";

import {
  countLockedPackageSections,
  PACKAGE_LOCK_GROUPS,
  setAllPackageLocks,
} from "@/lib/package-section-locks";
import type { PackageLockKey, PackageLockState } from "@/types";

type SectionLockControlsProps = {
  locks: PackageLockState;
  isRegenerating: boolean;
  onToggleLock: (key: PackageLockKey) => void;
  onSetLocks: (locks: PackageLockState) => void;
  onRegenerateUnlocked: () => void;
};

export default function SectionLockControls({
  locks,
  isRegenerating,
  onToggleLock,
  onSetLocks,
  onRegenerateUnlocked,
}: SectionLockControlsProps) {
  const lockedCount = countLockedPackageSections(locks);
  const totalCount = PACKAGE_LOCK_GROUPS.reduce(
    (total, group) => total + group.items.length,
    0
  );
  const hasLockedSections = lockedCount > 0;
  const allLocked = lockedCount === totalCount;

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.05] p-3.5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-white/40">
            Section Locks
          </div>
          <div className="mt-1 max-w-2xl text-[11px] leading-relaxed text-white/35">
            Lock strong sections, adjust inputs if needed, then regenerate only
            the unlocked output areas. Locked content is preserved exactly in
            the updated package.
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
              hasLockedSections
                ? "bg-emerald-400/15 text-emerald-200"
                : "bg-white/[0.06] text-white/35"
            }`}
          >
            {lockedCount}/{totalCount} locked
          </span>
          <button
            type="button"
            onClick={() => onSetLocks(setAllPackageLocks(!allLocked))}
            className="rounded-xl border border-white/[0.12] px-3 py-1.5 text-[11px] font-semibold text-white/45 transition-all hover:bg-white/[0.06] hover:text-white/70 active:scale-[0.98]"
          >
            {allLocked ? "Unlock all" : "Lock all"}
          </button>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-4">
        {PACKAGE_LOCK_GROUPS.map((group) => (
          <div
            key={group.title}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3"
          >
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/35">
              {group.title}
            </div>
            <div className="mb-3 text-[10px] leading-relaxed text-white/25">
              {group.description}
            </div>
            <div className="space-y-2">
              {group.items.map((item) => {
                const isLocked = locks[item.key];

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onToggleLock(item.key)}
                    className={`w-full rounded-xl border p-2.5 text-left transition-all active:scale-[0.99] ${
                      isLocked
                        ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-100"
                        : "border-white/[0.08] bg-black/10 text-white/45 hover:bg-white/[0.05] hover:text-white/65"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold">{item.label}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
                          isLocked
                            ? "bg-emerald-300/15 text-emerald-100"
                            : "bg-white/[0.06] text-white/30"
                        }`}
                      >
                        {isLocked ? "Locked" : "Open"}
                      </span>
                    </div>
                    <div className="mt-1 text-[10px] leading-relaxed opacity-70">
                      {item.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onRegenerateUnlocked}
        disabled={isRegenerating}
        className="mt-3 w-full rounded-2xl border border-emerald-300/25 bg-emerald-300/10 py-3 text-sm font-bold text-emerald-100 transition-all hover:bg-emerald-300/15 disabled:opacity-50 active:scale-[0.98]"
      >
        {isRegenerating ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-100/20 border-t-emerald-100" />
            Regenerating unlocked sections...
          </span>
        ) : hasLockedSections ? (
          "Regenerate Unlocked Sections"
        ) : (
          "Regenerate Package"
        )}
      </button>
    </div>
  );
}
