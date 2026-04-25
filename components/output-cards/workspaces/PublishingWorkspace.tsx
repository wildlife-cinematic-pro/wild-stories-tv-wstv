"use client";

import { Card, SectionLabel } from "@/components/output-cards/shared-panels";
import { FacebookPublishReadinessPanel } from "@/components/output-cards/facebook-publish-readiness-panel";
import {
  Caption2026Panel,
  Hook2026Panel,
  PlatformPackPanel,
  PostingTimesPanel,
} from "@/components/output-cards/publishing-panels";

import type { GeneratedPackage } from "@/types";

import { trackUsage } from "@/lib/usage-tracker";

export function PublishingWorkspace({
  data,
  onCopy,
}: {
  data: GeneratedPackage;
  onCopy: (text: string) => void | Promise<unknown>;
}) {
  const trackedCaptionCopy = (text: string) => {
    trackUsage({
      hook: data.hookFamily,
      score: data.usViewsModeReport?.audienceScore.total ?? data.usAudienceScore?.total,
      publish: data.usViewsModeReport?.shouldPublish,
    });

    return onCopy(text);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/12 p-4 text-sm text-emerald-900 shadow-sm dark:text-emerald-100">
        Posting ready assets यहाँ राखिएको छ: hook, caption, voiceover, CTA,
        hashtags, platform pack, अनि posting time guidance.
      </div>

      <FacebookPublishReadinessPanel data={data} />

      <SectionLabel label="Hooks & Copy" />

      {data.hook2026 && data.hook2026.length > 0 ? (
        <Hook2026Panel
          hooks={data.hook2026}
          oldHook={data.hook}
          onCopy={onCopy}
          recommendedIndex={data.recommendedHookIndex}
        />
      ) : data.hook ? (
        <Card
          title="🔥 Hook"
          value={data.hook}
          onCopy={onCopy}
          accent="border-l-orange-500"
        />
      ) : null}

      {data.caption2026 ? (
        <Caption2026Panel
          caption2026={data.caption2026}
          captionOld={data.caption}
          onCopy={trackedCaptionCopy}
        />
      ) : data.caption ? (
        <Card
          title="📝 Caption"
          value={data.caption}
          onCopy={trackedCaptionCopy}
          accent="border-l-emerald-500"
        />
      ) : null}

      {data.voiceoverLine && (
        <Card
          title="🎙️ Voiceover"
          value={data.voiceoverLine}
          onCopy={onCopy}
          accent="border-l-indigo-500"
          aiEnhanced={data.aiEnhanced}
        />
      )}

      {data.cta && <Card title="📢 CTA" value={data.cta} onCopy={onCopy} />}

      {data.hashtags && (
        <Card title="# Hashtags" value={data.hashtags} onCopy={onCopy} />
      )}

      {data.tags && <Card title="Tags" value={data.tags} onCopy={onCopy} />}

      {data.platformPack && (
        <>
          <SectionLabel label="Platform Packs" />
          <PlatformPackPanel pack={data.platformPack} onCopy={onCopy} />
        </>
      )}

      <SectionLabel label="Posting Strategy" />
      <PostingTimesPanel />
    </div>
  );
}
