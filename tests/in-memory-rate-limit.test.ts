import { describe, expect, it } from "vitest";

import { createFixedWindowRateLimiter } from "@/lib/in-memory-rate-limit";

describe("in-memory rate limiter", () => {
  it("blocks after the limit is exceeded and reports retry timing", () => {
    const limiter = createFixedWindowRateLimiter({
      limit: 2,
      windowMs: 60_000,
      maxEntries: 10,
    });

    expect(limiter.check("wolf-pack", 0).allowed).toBe(true);
    expect(limiter.check("wolf-pack", 1_000).allowed).toBe(true);

    const blocked = limiter.check("wolf-pack", 2_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBe(58_000);
    expect(blocked.retryAfterSeconds).toBe(58);
  });

  it("resets the window cleanly after expiry", () => {
    const limiter = createFixedWindowRateLimiter({
      limit: 1,
      windowMs: 10_000,
      maxEntries: 10,
    });

    expect(limiter.check("elk", 0).allowed).toBe(true);
    expect(limiter.check("elk", 5_000).allowed).toBe(false);

    const reset = limiter.check("elk", 10_000);
    expect(reset.allowed).toBe(true);
    expect(reset.remaining).toBe(0);
  });

  it("prunes expired entries before growing and caps retained keys", () => {
    const limiter = createFixedWindowRateLimiter({
      limit: 2,
      windowMs: 10_000,
      maxEntries: 2,
    });

    limiter.check("alpha", 0);
    limiter.check("beta", 1);
    expect(limiter.size()).toBe(2);

    limiter.check("gamma", 10_002);
    expect(limiter.size()).toBe(1);

    limiter.check("delta", 10_003);
    limiter.check("epsilon", 10_004);
    expect(limiter.size()).toBe(2);
  });
});
