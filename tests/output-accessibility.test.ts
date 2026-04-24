import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(__dirname, "..");

describe("output workspace accessibility source guards", () => {
  it("keeps semantic tab roles on the output workspace rail", () => {
    const outputCards = readFileSync(
      path.join(repoRoot, "components/OutputCards.tsx"),
      "utf8"
    );
    const sharedPanels = readFileSync(
      path.join(repoRoot, "components/output-cards/shared-panels.tsx"),
      "utf8"
    );

    expect(outputCards).toContain('role="tablist"');
    expect(sharedPanels).toContain('role="tab"');
    expect(sharedPanels).toContain('aria-selected={active}');
    expect(sharedPanels).toContain('aria-controls={panelId}');
  });
});
