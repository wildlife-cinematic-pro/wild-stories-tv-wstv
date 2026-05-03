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
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/12 p-4 text-sm text-emerald-900 shadow-sm dark:text-emerald-100">
        Posting ready assets यहाँ राखिएको छ: hook, caption, voiceover, CTA,
        hashtags, platform pack, अनि posting time guidance.
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
        />
      )}

      {data.cta && <Card title="📢 CTA" value={data.cta} onCopy={handleCopy} copyLabel="Copy CTA" />}

      {data.hashtags && (
        <Card title="# Hashtags" value={data.hashtags} onCopy={handleCopy} copyLabel="Copy Hashtags" />
      )}

      {data.tags && <Card title="Tags" value={data.tags} onCopy={handleCopy} copyLabel="Copy Tags" />}

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
