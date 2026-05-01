type StoryboardPreviewLinkMetadataInput = {
  predator: string;
  prey: string;
  finalEnvironment?: string;
};

function normalizeSegment(value: string | undefined): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildStoryboardPreviewLinkMetadata({
  predator,
  prey,
  finalEnvironment,
}: StoryboardPreviewLinkMetadataInput) {
  const pairLabel = `${predator} vs ${prey}`;
  const environmentLabel = finalEnvironment?.trim()
    ? ` Environment: ${finalEnvironment.trim()}.`
    : "";

  return {
    key: [
      normalizeSegment(predator),
      normalizeSegment(prey),
      normalizeSegment(finalEnvironment),
    ]
      .filter(Boolean)
      .join("__"),
    ariaLabel: `Open storyboard preview for ${pairLabel} from the current Build setup.${environmentLabel}`,
    title: `Open storyboard preview for ${pairLabel}`,
  };
}
