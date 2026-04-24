import { describe, expect, it } from "vitest";

import { normalizeGeminiVisionMimeType } from "@/app/api/enhance/media-analysis";

describe("normalizeGeminiVisionMimeType", () => {
  it("accepts supported Gemini image and video MIME types", () => {
    expect(normalizeGeminiVisionMimeType("image", "image/jpg")).toBe("image/jpeg");
    expect(normalizeGeminiVisionMimeType("image", "image/png")).toBe("image/png");
    expect(normalizeGeminiVisionMimeType("video", "video/mov")).toBe("video/quicktime");
    expect(normalizeGeminiVisionMimeType("video", "video/webm")).toBe("video/webm");
  });

  it("rejects unsupported Gemini MIME types", () => {
    expect(normalizeGeminiVisionMimeType("image", "image/svg+xml")).toBeUndefined();
    expect(normalizeGeminiVisionMimeType("video", "application/octet-stream")).toBeUndefined();
  });
});
