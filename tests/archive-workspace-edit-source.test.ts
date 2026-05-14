import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("ArchiveWorkspace edit workflow source", () => {
  const source = readFileSync("components/output-cards/workspaces/ArchiveWorkspace.tsx", "utf8");

  it("populates the form, scrolls, focuses, and shows edit mode controls", () => {
    expect(source).toContain("function editEntry(entry: VideoArchiveEntry)");
    expect(source).toContain("setForm(formFromEntry(entry, packageFallback))");
    expect(source).toContain("scrollIntoView");
    expect(source).toContain("facebookUrlInputRef.current?.focus");
    expect(source).toContain("Editing saved archive entry");
    expect(source).toContain("Cancel Edit");
  });

  it("updates existing entries through archiveId instead of regenerating package metadata", () => {
    expect(source).toContain("updateVideoArchiveEntry(existing.archiveId, archivePatchFromForm(form))");
    expect(source).toContain(`refreshEntries("Archive entry updated locally.")`);
    expect(source).toContain(`refreshEntries("Generation archived locally.")`);
    expect(source).toContain(`setStatus("Edit cancelled.")`);
  });
});
