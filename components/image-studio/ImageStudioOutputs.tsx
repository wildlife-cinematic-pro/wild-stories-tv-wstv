"use client";

import OutputCard from "@/components/image-studio/OutputCard";
import WorkspaceCard from "@/components/workspace/WorkspaceCard";
import WorkspaceSection from "@/components/workspace/WorkspaceSection";
import type { CopyKey, ImageStudioWorkspaceSection } from "@/lib/image-studio/types";

function CopyAllButton({
  value,
  copiedKey,
  onCopied,
}: {
  value: string;
  copiedKey: CopyKey;
  onCopied: (key: CopyKey) => void;
}) {
  async function copy() {
    await navigator.clipboard.writeText(value);
    onCopied("all");
    window.setTimeout(() => onCopied(null), 1400);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`rounded-2xl border px-3 py-1.5 text-xs font-bold transition ${
        copiedKey === "all"
          ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
          : "border-white/10 bg-white/[0.04] text-white/65 hover:bg-white/[0.08] hover:text-white"
      }`}
    >
      {copiedKey === "all" ? "Copied" : "Copy All"}
    </button>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <WorkspaceCard className="h-full bg-[color:var(--surface-elevated)]" title={value} eyebrow={label}>
      <div className="hidden" />
    </WorkspaceCard>
  );
}

export default function ImageStudioOutputs({
  activeSection,
  selectedCollection,
  usaHashtags,
  facebookCaption,
  copyAll,
  copiedKey,
  setCopiedKey,
  nanoPrompt,
  gptPrompt,
  negativePrompt,
  facebookCaptionWithHashtags,
  variationPrompts,
  fivePostPack,
  qualityChecklist,
  altText,
}: {
  activeSection: ImageStudioWorkspaceSection;
  selectedCollection: string;
  usaHashtags: string;
  facebookCaption: string;
  copyAll: string;
  copiedKey: CopyKey;
  setCopiedKey: (key: CopyKey) => void;
  nanoPrompt: string;
  gptPrompt: string;
  negativePrompt: string;
  facebookCaptionWithHashtags: string;
  variationPrompts: string;
  fivePostPack: string;
  qualityChecklist: string;
  altText: string;
}) {
  const showStats = activeSection === "outputs" || activeSection === "caption";

  return (
    <div className="space-y-5">
      {showStats ? (
        <WorkspaceSection
          title="Studio at a glance"
          description={
            activeSection === "caption"
              ? "Keep the caption lane, hashtag rules, and posting context readable before you edit or copy the social output."
              : "Keep the collection, model lane, caption rule, and hashtag constraint visible before you dive into the full prompt stack."
          }
          actions={<CopyAllButton value={copyAll} copiedKey={copiedKey} onCopied={setCopiedKey} />}
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Collection" value={selectedCollection} />
            <StatCard label="Model outputs" value="Nano Banana 2 + GPT Image 2" />
            <StatCard label="Caption" value="American English" />
            <StatCard label="Hashtags" value={usaHashtags} />
          </div>
        </WorkspaceSection>
      ) : null}

      {activeSection === "outputs" ? (
        <div className="space-y-5">
          <WorkspaceSection
            title="Master still prompts"
            description="Keep Nano Banana 2 prominent as the primary wildlife still lane, with GPT Image 2 ready as the backup cover and layout-safe alternate."
          >
            <div className="space-y-4">
              <OutputCard label="Nano Banana 2 prompt" value={nanoPrompt} copyKey="nano" copiedKey={copiedKey} onCopied={setCopiedKey} />
              <OutputCard label="GPT Image 2 prompt" value={gptPrompt} copyKey="gpt" copiedKey={copiedKey} onCopied={setCopiedKey} />
            </div>
          </WorkspaceSection>

          <WorkspaceSection
            title="Negative constraints"
            description="Keep the support lane separate so cleanup constraints stay easy to review and copy without competing with the main prompts."
          >
            <OutputCard label="Negative prompt" value={negativePrompt} copyKey="negative" copiedKey={copiedKey} onCopied={setCopiedKey} />
          </WorkspaceSection>
        </div>
      ) : null}

      {activeSection === "caption" ? (
        <div className="space-y-5">
          <WorkspaceSection
            title="Caption lane"
            description="American English only, with the Facebook caption and exact five-tag output separated so posting prep feels cleaner."
          >
            <div className="space-y-4">
              <OutputCard label="Facebook caption" value={facebookCaption} copyKey="caption" copiedKey={copiedKey} onCopied={setCopiedKey} />
              <OutputCard label="USA viral hashtags" value={usaHashtags} copyKey="hashtags" copiedKey={copiedKey} onCopied={setCopiedKey} />
            </div>
          </WorkspaceSection>

          <WorkspaceSection
            title="Combined posting copy"
            description="Use the combined block when you want the ready-to-paste Facebook caption and hashtag output together."
          >
            <div className="space-y-4">
              <OutputCard label="Facebook caption + USA viral hashtags" value={facebookCaptionWithHashtags} copyKey="caption" copiedKey={copiedKey} onCopied={setCopiedKey} />
              <WorkspaceCard
                title="Caption notes"
                description="This lane stays American English only and keeps the USA viral output at exactly five hashtags."
                className="bg-[color:var(--surface-elevated)]"
              >
                <p className="text-sm leading-6 text-[color:var(--text)]">Use this section when you want caption editing and copy tools without the rest of the prompt stack in the way.</p>
              </WorkspaceCard>
            </div>
          </WorkspaceSection>
        </div>
      ) : null}

      {activeSection === "variations" ? (
        <WorkspaceSection
          title="Prompt variations"
          description="Three alternate directions stay isolated here so you can compare them without the core prompt stack crowding the page."
        >
          <OutputCard label="3 prompt variations" value={variationPrompts} copyKey="variations" copiedKey={copiedKey} onCopied={setCopiedKey} />
        </WorkspaceSection>
      ) : null}

      {activeSection === "five-post-pack" ? (
        <WorkspaceSection
          title="5-post pack"
          description="Keep the ready-made Facebook batch pack separate from the single-post prompt lane."
        >
          <OutputCard label="5-post Facebook pack" value={fivePostPack} copyKey="batch" copiedKey={copiedKey} onCopied={setCopiedKey} />
        </WorkspaceSection>
      ) : null}

      {activeSection === "quality" ? (
        <WorkspaceSection
          title="Quality checklist"
          description="This checklist stays in its own lane so prompt QA does not get buried under the main output cards."
        >
          <OutputCard label="Prompt quality checklist" value={qualityChecklist} copyKey="quality" copiedKey={copiedKey} onCopied={setCopiedKey} />
        </WorkspaceSection>
      ) : null}

      {activeSection === "alt-text" ? (
        <WorkspaceSection
          title="Alt text"
          description="Accessible post description stays separate so you can review it on its own before publishing."
        >
          <OutputCard label="Alt text" value={altText} copyKey="alt" copiedKey={copiedKey} onCopied={setCopiedKey} />
        </WorkspaceSection>
      ) : null}
    </div>
  );
}
