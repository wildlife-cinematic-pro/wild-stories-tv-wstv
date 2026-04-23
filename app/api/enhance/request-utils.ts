import { NextResponse } from "next/server";

export type Provider = "gemini" | "claude";

export function getClientIp(req: Request) {
  const h = req.headers;
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export function sanitizeString(v: unknown, maxLen = 8000): string {
  const s = typeof v === "string" ? v : "";
  return s.slice(0, maxLen);
}

export function jsonError(
  message: string,
  status = 400,
  details?: unknown,
  headers?: HeadersInit
) {
  const detailsText =
    typeof details === "string"
      ? details
      : details == null
        ? undefined
        : (() => {
            try {
              return JSON.stringify(details);
            } catch {
              return String(details);
            }
          })();

  return NextResponse.json(
    { error: message, details: detailsText },
    { status, headers }
  );
}
