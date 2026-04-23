// file: app/api/enhance/route.ts
import { createFixedWindowRateLimiter } from "@/lib/in-memory-rate-limit";
import { handleCopyPolishRequest } from "./copy-polish";
import { handleMediaAnalysisRequest } from "./media-analysis";
import { getClientIp, jsonError } from "./request-utils";

const RATE_LIMIT_MAX = 25;
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX_ENTRIES = 1000;
const enhanceRateLimiter = createFixedWindowRateLimiter({
  limit: RATE_LIMIT_MAX,
  windowMs: RATE_LIMIT_WINDOW,
  maxEntries: RATE_LIMIT_MAX_ENTRIES,
});

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rateLimit = enhanceRateLimiter.check(ip);
  if (!rateLimit.allowed) {
    return jsonError("Rate limit exceeded", 429, undefined, {
      "Retry-After": String(rateLimit.retryAfterSeconds),
    });
  }

  const body = await req.json().catch(() => null);
  if (!body) return jsonError("Invalid JSON body");

  if (body?.analyzeMedia === true) {
    return handleMediaAnalysisRequest(body);
  }

  return handleCopyPolishRequest(body);
}
