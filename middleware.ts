import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const SECURITY_HEADERS: Record<string, string> = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

const SANDBOX_CSP = "sandbox allow-same-origin allow-scripts";
const DEFAULT_ALLOWED_METHODS = "GET,POST,PUT,PATCH,DELETE,OPTIONS";
const PREFLIGHT_MAX_AGE = 600; // 10 minutes
const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const SAFE_METHODS = new Set(["GET", "HEAD"]);
const CSRF_HEADER_NAME = "x-ku-csrf";
const CSRF_HEADER_VALUE = "1";
const DISALLOWED_READ_DESTINATIONS = new Set([
  "document",
  "iframe",
  "frame",
  "embed",
  "object",
  "image",
  "img",
  "audio",
  "video",
  "track",
  "style",
  "font",
]);

const RAW_ALLOWED_ORIGINS = (process.env.CORS_ALLOWLIST || process.env.NEXT_PUBLIC_APP_URL || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const STATIC_ALLOWED_ORIGINS = new Map<string, string>();

function normalizeOrigin(value?: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.origin.toLowerCase();
  } catch {
    return null;
  }
}

function registerAllowedOrigin(origin: string) {
  const normalized = normalizeOrigin(origin);
  if (normalized) {
    const canonical = new URL(origin).origin;
    STATIC_ALLOWED_ORIGINS.set(normalized, canonical);
  }
}

RAW_ALLOWED_ORIGINS.forEach((origin) => {
  try {
    registerAllowedOrigin(origin);
  } catch {
    console.warn(`[middleware] Ignoring invalid origin in CORS_ALLOWLIST: ${origin}`);
  }
});

function applySecurityHeaders(response: NextResponse) {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

function resolveAllowlist(request: NextRequest) {
  const currentOrigin = request.nextUrl.origin;
  const normalizedCurrent = normalizeOrigin(currentOrigin);
  const allowlist = new Map(STATIC_ALLOWED_ORIGINS);
  if (normalizedCurrent) {
    allowlist.set(normalizedCurrent, currentOrigin);
  }
  return { allowlist, normalizedCurrent, currentOrigin };
}

function getAllowedOrigin(request: NextRequest): string | null {
  const requestOriginHeader = request.headers.get("origin");
  const normalizedHeader = normalizeOrigin(requestOriginHeader);
  const { allowlist, normalizedCurrent, currentOrigin } = resolveAllowlist(request);

  if (normalizedHeader && allowlist.has(normalizedHeader)) {
    return allowlist.get(normalizedHeader) ?? null;
  }

  if (!requestOriginHeader && normalizedCurrent) {
    return allowlist.get(normalizedCurrent) ?? currentOrigin;
  }

  return normalizedCurrent ? allowlist.get(normalizedCurrent) ?? currentOrigin : currentOrigin;
}

function appendVary(response: NextResponse, value: string) {
  const existing = response.headers.get("Vary");
  if (!existing) {
    response.headers.set("Vary", value);
    return;
  }
  if (!existing.includes(value)) {
    response.headers.set("Vary", `${existing}, ${value}`);
  }
}

function applyCorsHeaders(request: NextRequest, response: NextResponse, { preflight = false } = {}) {
  const allowedOrigin = getAllowedOrigin(request);
  if (!allowedOrigin) return response;

  response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  appendVary(response, "Origin");

  if (preflight) {
    const requestedHeaders = request.headers.get("access-control-request-headers");
    const requestedMethod = request.headers.get("access-control-request-method");

    response.headers.set(
      "Access-Control-Allow-Headers",
      requestedHeaders || "Authorization, Content-Type, Accept",
    );
    response.headers.set(
      "Access-Control-Allow-Methods",
      requestedMethod || DEFAULT_ALLOWED_METHODS,
    );
    response.headers.set("Access-Control-Max-Age", `${PREFLIGHT_MAX_AGE}`);
  }

  return response;
}

function finalizeResponse(request: NextRequest, response: NextResponse, options?: { preflight?: boolean }) {
  applySecurityHeaders(response);
  applyCorsHeaders(request, response, { preflight: options?.preflight ?? false });
  return response;
}

function hasRequiredCsrfHeader(request: NextRequest) {
  return (request.headers.get(CSRF_HEADER_NAME) ?? "").toLowerCase() === CSRF_HEADER_VALUE;
}

function isTrustedStateChangingRequest(request: NextRequest): boolean {
  if (!hasRequiredCsrfHeader(request)) {
    return false;
  }

  const fetchSite = (request.headers.get("sec-fetch-site") ?? "").toLowerCase();
  if (fetchSite === "same-origin" || fetchSite === "same-site" || fetchSite === "none") {
    return true;
  }

  const { allowlist } = resolveAllowlist(request);
  const normalizedOrigin = normalizeOrigin(request.headers.get("origin"));
  if (normalizedOrigin && allowlist.has(normalizedOrigin)) {
    return true;
  }

  const referer = request.headers.get("referer");
  const normalizedReferer = normalizeOrigin(referer);
  if (normalizedReferer && allowlist.has(normalizedReferer)) {
    return true;
  }

  return false;
}

function isTrustedReadRequest(request: NextRequest): boolean {
  const dest = (request.headers.get("sec-fetch-dest") ?? "").toLowerCase();
  if (DISALLOWED_READ_DESTINATIONS.has(dest)) {
    return false;
  }

  const mode = (request.headers.get("sec-fetch-mode") ?? "").toLowerCase();
  if (mode && mode !== "cors" && mode !== "same-origin") {
    return false;
  }

  const site = (request.headers.get("sec-fetch-site") ?? "").toLowerCase();
  if (site === "cross-site") {
    const { allowlist } = resolveAllowlist(request);
    const normalizedOrigin = normalizeOrigin(request.headers.get("origin"));
    if (!normalizedOrigin || !allowlist.has(normalizedOrigin)) {
      return false;
    }
  }

  return true;
}

function isNavigationAttempt(request: NextRequest) {
  const dest = (request.headers.get("sec-fetch-dest") ?? "").toLowerCase();
  const mode = (request.headers.get("sec-fetch-mode") ?? "").toLowerCase();
  const accept = request.headers.get("accept") ?? "";

  const navigationalDestinations = new Set(["document", "iframe", "frame"]);
  const isDocumentLike = navigationalDestinations.has(dest);
  const isNavigationMode = mode === "navigate" || mode === "nested-navigate";
  const requestsHtml = accept.includes("text/html");

  return isDocumentLike || isNavigationMode || requestsHtml;
}

export function middleware(request: NextRequest) {
  if (SAFE_METHODS.has(request.method.toUpperCase()) && !isTrustedReadRequest(request)) {
    const denied = NextResponse.json(
      { message: "Untrusted read request blocked." },
      { status: 403 },
    );
    return finalizeResponse(request, denied);
  }

  if (
    STATE_CHANGING_METHODS.has(request.method.toUpperCase())
    && !isTrustedStateChangingRequest(request)
  ) {
    const denied = NextResponse.json(
      { message: "Cross-site requests are not allowed for this endpoint." },
      { status: 403 },
    );
    return finalizeResponse(request, denied);
  }

  if (request.method === "OPTIONS") {
    const preflight = new NextResponse(null, { status: 204 });
    return finalizeResponse(request, preflight, { preflight: true });
  }

  if (isNavigationAttempt(request)) {
    const blocked = NextResponse.json(
      { message: "API endpoints cannot be rendered directly." },
      { status: 406 },
    );
    blocked.headers.set(
      "Content-Disposition",
      'attachment; filename="api-response.json"',
    );
    blocked.headers.set(
      "Content-Security-Policy",
      `${SANDBOX_CSP}; default-src 'none'`,
    );
    return finalizeResponse(request, blocked);
  }

  const response = NextResponse.next();
  return finalizeResponse(request, response);
}

export const config = {
  matcher: ["/api/:path*"],
};
