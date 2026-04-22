export type FixedWindowRateLimitOptions = {
  limit: number;
  windowMs: number;
  maxEntries: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
  touchedAt: number;
};

export type RateLimitCheckResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterMs: number;
  retryAfterSeconds: number;
};

export type FixedWindowRateLimiter = {
  check: (key: string, now?: number) => RateLimitCheckResult;
  size: () => number;
};

function clampRemaining(value: number) {
  return value > 0 ? value : 0;
}

export function createFixedWindowRateLimiter(
  options: FixedWindowRateLimitOptions
): FixedWindowRateLimiter {
  const entries = new Map<string, RateLimitEntry>();

  function trimToMaxEntries() {
    if (entries.size <= options.maxEntries) {
      return;
    }

    const overflow = entries.size - options.maxEntries;
    const oldestEntries = [...entries.entries()]
      .sort(([, left], [, right]) => {
        if (left.touchedAt !== right.touchedAt) {
          return left.touchedAt - right.touchedAt;
        }
        return left.resetAt - right.resetAt;
      })
      .slice(0, overflow);

    for (const [key] of oldestEntries) {
      entries.delete(key);
    }
  }

  function prune(now: number) {
    for (const [key, entry] of entries) {
      if (now >= entry.resetAt) {
        entries.delete(key);
      }
    }

    trimToMaxEntries();
  }

  return {
    check(key: string, now = Date.now()) {
      prune(now);

      const current = entries.get(key);
      if (!current) {
        const resetAt = now + options.windowMs;
        entries.set(key, { count: 1, resetAt, touchedAt: now });
        trimToMaxEntries();
        return {
          allowed: true,
          remaining: clampRemaining(options.limit - 1),
          resetAt,
          retryAfterMs: 0,
          retryAfterSeconds: 0,
        };
      }

      if (current.count >= options.limit) {
        const retryAfterMs = Math.max(current.resetAt - now, 0);
        current.touchedAt = now;
        return {
          allowed: false,
          remaining: 0,
          resetAt: current.resetAt,
          retryAfterMs,
          retryAfterSeconds: Math.max(Math.ceil(retryAfterMs / 1000), 1),
        };
      }

      current.count += 1;
      current.touchedAt = now;
      return {
        allowed: true,
        remaining: clampRemaining(options.limit - current.count),
        resetAt: current.resetAt,
        retryAfterMs: 0,
        retryAfterSeconds: 0,
      };
    },
    size() {
      return entries.size;
    },
  };
}
