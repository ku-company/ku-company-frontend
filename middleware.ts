import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const SECURITY_HEADERS: Record<string, string> = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

const SANDBOX_CSP = "sandbox allow-same-origin allow-scripts";

function applySecurityHeaders(response: NextResponse) {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
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
    return applySecurityHeaders(blocked);
  }

  const response = NextResponse.next();
  return applySecurityHeaders(response);
}

export const config = {
  matcher: ["/api/:path*"],
};
