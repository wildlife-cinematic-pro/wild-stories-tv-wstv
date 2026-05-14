import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

import {
  BRAND_NAME,
  COMMUNITY_NAME,
  FACEBOOK_PAGE_BIO,
  FACEBOOK_PAGE_TAGLINE,
  ORIGINALITY_LINE,
  SIGNATURE_LINE,
} from "@/lib/brand";
import { contentLaneOptions } from "@/lib/content-lanes";
import { buildPlatformPack } from "@/lib/platform-packs";

const repoRoot = process.cwd();
const skippedDirs = new Set([".git", "node_modules", ".next", "coverage", "playwright-report"]);
const scannedExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".md",
  ".css",
  ".example",
]);

function hasScannedExtension(filePath: string) {
  return [...scannedExtensions].some((extension) => filePath.endsWith(extension));
}

function collectFiles(dir: string, files: string[] = []) {
  for (const entry of readdirSync(dir)) {
    if (skippedDirs.has(entry)) continue;

    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      collectFiles(fullPath, files);
      continue;
    }

    if (hasScannedExtension(fullPath)) files.push(fullPath);
  }

  return files;
}

describe("brand consistency", () => {
  it("keeps retired community naming out of source and tests", () => {
    const retiredCommunityName = ["Wild", "Watchers"].join(" ");
    const matches = collectFiles(repoRoot)
      .map((filePath) => ({
        filePath,
        text: readFileSync(filePath, "utf8"),
      }))
      .filter(({ text }) => text.includes(retiredCommunityName))
      .map(({ filePath }) => relative(repoRoot, filePath));

    expect(matches).toEqual([]);
  });

  it("uses shared brand constants for community, signature, and page copy", () => {
    expect(BRAND_NAME).toBe("Wild Stories TV");
    expect(COMMUNITY_NAME).toBe("Wild Crew");
    expect(SIGNATURE_LINE).toBe("Watch the wild before it moves.");
    expect(FACEBOOK_PAGE_BIO).toBe(
      "Cinematic AI wildlife stories. Original wild-animal moments for the Wild Crew."
    );
    expect(FACEBOOK_PAGE_TAGLINE).toBe(SIGNATURE_LINE);
    expect(ORIGINALITY_LINE).toContain("original AI wildlife scene");
  });

  it("builds Wild Crew community package and originality checklist outputs", () => {
    const pack = buildPlatformPack(
      "Mountain Lion",
      "Mule Deer",
      "Escape from danger",
      "Rocky Mountain meadow edge",
      "Escape Lane"
    );
    const hashtags = pack.facebook.hashtags.split(/s+/).filter(Boolean);

    expect(pack.facebook.communityPackage?.communityName).toBe("Wild Crew");
    expect(pack.facebook.communityPackage?.pinnedComment).toContain("Wild Crew");
    expect(pack.facebook.communityPackage?.seriesCTA).toContain("Wild Stories TV");
    expect(pack.facebook.communityPackage?.followCTA).toContain("Wild Crew");
    expect(pack.facebook.originalityChecklist?.aiGeneratedLabelReminder).toMatch(/AI-generated label/i);
    expect(pack.facebook.originalityChecklist?.originalProductionSignal).toBe(ORIGINALITY_LINE);
    expect(pack.facebook.originalityChecklist?.noRepostWatermarkWarning).toMatch(/no reposted clips/i);
    expect(pack.facebook.originalityChecklist?.noFakeRealFootageClaim).toMatch(/Do not claim/i);
    expect(pack.facebook.pageOptimization?.pageBio).toBe(FACEBOOK_PAGE_BIO);
    expect(pack.facebook.pageOptimization?.tagline).toBe("Watch the wild before it moves.");
    expect(hashtags.length).toBeGreaterThanOrEqual(4);
    expect(pack.facebook.caption.length).toBeLessThanOrEqual(560);
  });

  it("exposes the upgraded content lane presets without removing legacy lanes", () => {
    expect(contentLaneOptions).toEqual(
      expect.arrayContaining([
        "Pack Hunt",
        "Defender",
        "Fishing Strike",
        "Rut Battle",
        "Escape",
        "Mother Defense",
        "Herd Defense",
        "Giant Standoff",
        "Predator Pressure",
        "Escape Lane",
        "Swamp Ambush",
        "Winter Survival",
        "Territory Clash",
      ])
    );
  });
});
