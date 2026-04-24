import { describe, expect, it } from "vitest";

import { getClientIp } from "@/app/api/enhance/request-utils";

describe("getClientIp", () => {
  it("prefers validated single-value headers before the forwarded chain", () => {
    const req = new Request("https://example.com/api/enhance", {
      headers: {
        "x-real-ip": "198.51.100.7",
        "x-forwarded-for": "203.0.113.9, 198.51.100.8",
      },
    });

    expect(getClientIp(req)).toBe("198.51.100.7");
  });

  it("returns the first validated forwarded address and strips an IPv4 port", () => {
    const req = new Request("https://example.com/api/enhance", {
      headers: {
        "x-forwarded-for": "unknown, bad-value, 203.0.113.9:443, 198.51.100.8",
      },
    });

    expect(getClientIp(req)).toBe("203.0.113.9");
  });

  it("falls back to unknown when no valid address is present", () => {
    const req = new Request("https://example.com/api/enhance", {
      headers: {
        "x-forwarded-for": "garbage, still-bad",
      },
    });

    expect(getClientIp(req)).toBe("unknown");
  });
});
