// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import WSTVCreatorGuideCard from "@/components/output-cards/wstv-creator-guide-card";

describe("WSTVCreatorGuideCard", () => {
  it("renders the daily creator workflow guidance", () => {
    render(<WSTVCreatorGuideCard />);

    expect(screen.getByText("WSTV Creator Workflow Guide")).toBeTruthy();
    expect(screen.getByText(/Nano Banana 2 Primary/i)).toBeTruthy();
    expect(screen.getByText(/Track performance after posting manually/i)).toBeTruthy();
    expect(screen.getByText(/Use Auto Recommendations for the next idea/i)).toBeTruthy();
  });
});
