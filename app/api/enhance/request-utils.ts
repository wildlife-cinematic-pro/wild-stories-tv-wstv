import { isIP } from "node:net";
import { NextResponse } from "next/server";

export type Provider = "gemini" | "claude" | "openai";

function normalizeIpCandidate(value: string | null): string | undefined {
  if (!value) return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const bracketedMatch = trimmed.match(/^\[([^\]]+)\](?::\d+)?$/);
  const bracketNormalized = bracketedMatch?.[1] ?? trimmed;
  if (isIP(bracketNormalized)) return bracketNormalized;

  const ipv4WithPortMatch = bracketNormalized.match(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/);
  if (ipv4WithPortMatch && isIP(ipv4WithPortMatch[1])) {
    return ipv4WithPortMatch[1];
  }

  return undefined;
}

export function getClientIp(req: Request) {
  const headers = req.headers;

  for (const headerName of ["x-real-ip", "x-vercel-forwarded-for", "cf-connecting-ip"]) {
    const trustedIp = normalizeIpCandidate(headers.get(headerName));
    if (trustedIp) return trustedIp;
  }

  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    for (const part of forwardedFor.split(",")) {
      const candidate = normalizeIpCandidate(part);
      if (candidate) return candidate;
    }
  }

  return "unknown";
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
