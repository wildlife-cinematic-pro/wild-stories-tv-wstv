import { describe, expect, it } from "vitest";

import {
  buildAlephRepairPrompt,
  buildFailureRepairPrompt,
  diagnoseOutputFailure,
} from "@/lib/output-failure-fixer";

describe("output failure fixer", () => {
  it("diagnoses common wildlife generation failures from complaint text", () => {
    const fixes = diagnoseOutputFailure(
      "Too much dhulo, extra limbs, floating hooves, and the body got cropped."
    );

    expect(fixes.map((fix) => fix.type)).toEqual([
      "dust",
      "extra-limbs",
      "bad-ground-contact",
      "cropped-body",
    ]);
  });

  it("builds a concise repair prompt", () => {
    const fixes = diagnoseOutputFailure(
      "dust cloud, duplicate animals, wrong habitat"
    );
    const repair = buildFailureRepairPrompt(
      fixes,
      "Preserve the same wolf and bison in a snowy valley."
    );

    expect(repair).toContain("Repair pass:");
    expect(repair).toContain("no dust clouds");
    expect(repair).toContain("Exactly one lead animal and one opposing animal only");
    expect(repair).toContain("Preserve the same habitat");
  });

  it("builds a future-ready continuity repair prompt", () => {
    const fixes = diagnoseOutputFailure("camera shake, gore, lighting drift");
    const repair = buildAlephRepairPrompt(
      fixes,
      "Keep the same shark and seal in cold coastal water."
    );

    expect(repair).toContain("Continuity repair prompt");
    expect(repair).toContain("No blood, no gore, no visible wounds");
    expect(repair).toContain("Preserve the same lighting direction");
  });
});
