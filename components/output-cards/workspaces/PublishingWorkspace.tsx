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
      <div className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--success-bg)] p-4 text-sm text-[color:var(--success-text)] shadow-sm">
        Posting ready assets यहाँ राखिएको छ: hook, caption, voiceover, CTA,
        hashtags, platform pack, अनि posting time guidance.
      </div>

      <div className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4 text-sm text-[color:var(--text)] shadow-sm">
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
          className="border-orange-400/45"
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
          className="border-emerald-400/45"
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
          className="border-indigo-400/45"
          copyButtonClassName="wstv-copy-button wstv-copy-button-secondary rounded-xl px-3 py-2 text-sm font-semibold active:scale-95"
        />
      )}

      {data.cta && (
        <Card
          title="📢 CTA"
          value={data.cta}
          onCopy={handleCopy}
          copyLabel="Copy CTA"
          className="border-rose-400/45"
          copyButtonClassName="wstv-copy-button wstv-copy-button-secondary rounded-xl px-3 py-2 text-sm font-semibold active:scale-95"
        />
      )}

      {(data.pinnedComment ?? data.platformPack?.facebook.pinnedComment) && (
        <Card
          title="💬 Pinned Comment"
          value={data.pinnedComment ?? data.platformPack?.facebook.pinnedComment ?? ""}
          onCopy={handleCopy}
          copyLabel="Copy Pinned Comment"
          accent="border-l-sky-500"
          className="border-sky-400/45"
          copyButtonClassName="wstv-copy-button wstv-copy-button-secondary rounded-xl px-3 py-2 text-sm font-semibold active:scale-95"
        />
      )}

      {data.hashtags && (
        <Card
          title="# Hashtags"
          value={data.hashtags}
          onCopy={handleCopy}
          copyLabel="Copy Hashtags"
          className="border-sky-400/45"
          copyButtonClassName="wstv-copy-button wstv-copy-button-secondary rounded-xl px-3 py-2 text-sm font-semibold active:scale-95"
        />
      )}

      {data.tags && (
        <Card
          title="Tags"
          value={data.tags}
          onCopy={handleCopy}
          copyLabel="Copy Tags"
          className="border-[color:var(--border)]"
          copyButtonClassName="wstv-copy-button wstv-copy-button-secondary rounded-xl px-3 py-2 text-sm font-semibold active:scale-95"
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
