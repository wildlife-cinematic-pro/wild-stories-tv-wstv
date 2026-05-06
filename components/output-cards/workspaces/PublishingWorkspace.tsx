"use client";

import { Card, SectionLabel } from "@/components/output-cards/shared-panels";
import { buildUsagePayload, trackUsage } from "@/lib/usage-tracker";
import { getRealGenerationEvidenceGenerationId } from "@/lib/real-generation-evidence";
import { FacebookPublishReadinessPanel } from "@/components/output-cards/facebook-publish-readiness-panel";
import { MonetizedPagePerformancePanel } from "@/components/output-cards/monetized-page-performance-panel";
import {
  Caption2026Panel,
  Hook2026Panel,
  PlatformPackPanel,
  PostingTimesPanel,
} from "@/components/output-cards/publishing-panels";

import type { GeneratedPackage } from "@/types";

export function PublishingWorkspace({
  data,
  onCopy,
}: {
  data: GeneratedPackage;
  onCopy: (text: string) => void | Promise<unknown>;
}) {
  const handleCopy = async (text: string) => {
    await onCopy(text);

    trackUsage("publish_action", buildUsagePayload(data));
  };
  const monetizedPanelKey = getRealGenerationEvidenceGenerationId(data);

  return (
    <div className="space-y-6">
      <div className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-emerald-500/30 bg-emerald-500/12 p-4 text-sm text-emerald-900 shadow-sm dark:text-emerald-100">
        Posting ready assets यहाँ राखिएको छ: hook, caption, voiceover, CTA,
        hashtags, platform pack, अनि posting time guidance.
      </div>

      <div className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-rose-200/70 bg-white/80 p-4 text-sm text-rose-950 shadow-sm dark:border-rose-200/20 dark:bg-white/5 dark:text-rose-100">
        Publishing copy stays separate from the engine prompts here, so caption, hashtags, hook, and CTA remain lightweight editorial surfaces you can copy fast.
      </div>

      <FacebookPublishReadinessPanel data={data} />
      <MonetizedPagePerformancePanel key={monetizedPanelKey} data={data} onCopy={handleCopy} />

      <SectionLabel label="Hooks & Copy" />

      {data.hook2026 && data.hook2026.length > 0 ? (
        <Hook2026Panel
          hooks={data.hook2026}
          oldHook={data.hook}
          onCopy={handleCopy}
          recommendedIndex={data.recommendedHookIndex}
        />
      ) : data.hook ? (
        <Card
          title="🔥 Hook"
          value={data.hook}
          onCopy={handleCopy}
          accent="border-l-orange-500"
          copyLabel="Copy Hook"
          className="border-orange-200/70 bg-orange-50/60"
          valueClassName="text-orange-950 dark:text-orange-50"
          copyButtonClassName="rounded-xl bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700 active:scale-95"
        />
      ) : null}

      {data.caption2026 ? (
        <Caption2026Panel
          caption2026={data.caption2026}
          captionOld={data.caption}
          onCopy={handleCopy}
        />
      ) : data.caption ? (
        <Card
          title="📝 Caption"
          value={data.caption}
          onCopy={handleCopy}
          accent="border-l-emerald-500"
          copyLabel="Copy Caption"
          className="border-emerald-200/70 bg-emerald-50/60"
          valueClassName="text-emerald-950 dark:text-emerald-50"
          copyButtonClassName="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-95"
        />
      ) : null}

      {data.voiceoverLine && (
        <Card
          title="🎙️ Voiceover"
          value={data.voiceoverLine}
          onCopy={handleCopy}
          accent="border-l-indigo-500"
          aiEnhanced={data.aiEnhanced}
          copyLabel="Copy Voiceover"
          className="border-indigo-200/70 bg-indigo-50/55"
          valueClassName="text-indigo-950 dark:text-indigo-50"
          copyButtonClassName="rounded-xl border border-indigo-300 bg-white/85 px-3 py-2 text-sm font-semibold text-indigo-900 hover:bg-indigo-50 active:scale-95 dark:border-indigo-200/40 dark:bg-transparent dark:text-indigo-100"
        />
      )}

      {data.cta && (
        <Card
          title="📢 CTA"
          value={data.cta}
          onCopy={handleCopy}
          copyLabel="Copy CTA"
          className="border-rose-200/70 bg-rose-50/55"
          valueClassName="text-rose-950 dark:text-rose-50"
          copyButtonClassName="rounded-xl border border-rose-300 bg-white/85 px-3 py-2 text-sm font-semibold text-rose-900 hover:bg-rose-50 active:scale-95 dark:border-rose-200/40 dark:bg-transparent dark:text-rose-100"
        />
      )}

      {(data.pinnedComment ?? data.platformPack?.facebook.pinnedComment) && (
        <Card
          title="💬 Pinned Comment"
          value={data.pinnedComment ?? data.platformPack?.facebook.pinnedComment ?? ""}
          onCopy={handleCopy}
          copyLabel="Copy Pinned Comment"
          accent="border-l-sky-500"
          className="border-sky-200/70 bg-sky-50/55"
          valueClassName="text-sky-950 dark:text-sky-50"
          copyButtonClassName="rounded-xl border border-sky-300 bg-white/85 px-3 py-2 text-sm font-semibold text-sky-900 hover:bg-sky-50 active:scale-95 dark:border-sky-200/40 dark:bg-transparent dark:text-sky-100"
        />
      )}

      {data.hashtags && (
        <Card
          title="# Hashtags"
          value={data.hashtags}
          onCopy={handleCopy}
          copyLabel="Copy Hashtags"
          className="border-sky-200/70 bg-sky-50/55"
          valueClassName="text-sky-950 dark:text-sky-50"
          copyButtonClassName="rounded-xl border border-sky-300 bg-white/85 px-3 py-2 text-sm font-semibold text-sky-900 hover:bg-sky-50 active:scale-95 dark:border-sky-200/40 dark:bg-transparent dark:text-sky-100"
        />
      )}

      {data.tags && (
        <Card
          title="Tags"
          value={data.tags}
          onCopy={handleCopy}
          copyLabel="Copy Tags"
          className="border-slate-200/70 bg-slate-50/55"
          valueClassName="text-slate-900 dark:text-slate-100"
          copyButtonClassName="rounded-xl border border-slate-300 bg-white/85 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 active:scale-95 dark:border-slate-200/40 dark:bg-transparent dark:text-slate-100"
        />
      )}

      {data.platformPack && (
        <>
          <SectionLabel label="Platform Packs" />
          <PlatformPackPanel pack={data.platformPack} onCopy={handleCopy} />
        </>
      )}

      <SectionLabel label="Posting Strategy" />
      <PostingTimesPanel />
    </div>
  );
}
