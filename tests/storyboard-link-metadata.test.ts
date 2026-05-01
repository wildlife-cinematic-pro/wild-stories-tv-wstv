import { describe, expect, it } from "vitest";

import { buildStoryboardPreviewLinkMetadata } from "@/lib/storyboard-link-metadata";

describe("storyboard preview link metadata", () => {
  it("tracks the current animal pair in accessibility metadata", () => {
    const metadata = buildStoryboardPreviewLinkMetadata({
      predator: "Grizzly Bear",
      prey: "Bison",
    });

    expect(metadata.key).toBe("grizzly-bear__bison");
    expect(metadata.ariaLabel).toContain("Grizzly Bear vs Bison");
    expect(metadata.title).toBe("Open storyboard preview for Grizzly Bear vs Bison");
  });

  it("includes the current environment when available", () => {
    const metadata = buildStoryboardPreviewLinkMetadata({
      predator: "Great White Shark",
      prey: "Seal",
      finalEnvironment: "surf line and open ocean seal-colony edge",
    });

    expect(metadata.key).toBe(
      "great-white-shark__seal__surf-line-and-open-ocean-seal-colony-edge"
    );
    expect(metadata.ariaLabel).toContain(
      "Environment: surf line and open ocean seal-colony edge."
    );
  });
});
