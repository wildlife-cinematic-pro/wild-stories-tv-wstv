import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("storyboard page prompt variant labels", () => {
  it("labels the four storyboard image prompt variants in the output card", () => {
    const pageSource = readFileSync("components/storyboard/CinematicStoryboardPage.tsx", "utf8");

    expect(pageSource).toContain("GPT Image 2 — Long Version");
    expect(pageSource).toContain("GPT Image 2 — Short Version");
    expect(pageSource).toContain("Nano Banana 2 — Long Version");
    expect(pageSource).toContain("Nano Banana 2 — Short Version");
    expect(pageSource).not.toContain("Grok Imagine");
  });
});
