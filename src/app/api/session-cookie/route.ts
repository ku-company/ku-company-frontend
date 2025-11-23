import { NextRequest, NextResponse } from "next/server";

const ACCESS_TOKEN_COOKIES = [
  { name: "__Secure-access_token", requireSecure: true },
  { name: "access_token", requireSecure: false },
];

const DEFAULT_MAX_AGE = 15 * 60;

type Payload = {
  token?: string;
  maxAge?: number;
  mode?: "set" | "clear";
};

function resolveMaxAge(payload: Payload, mode: "set" | "clear") {
  if (mode === "clear") return 0;
  const candidate = Number(payload.maxAge);
  if (!Number.isFinite(candidate) || candidate <= 0) return DEFAULT_MAX_AGE;
  return Math.round(candidate);
}

function canUseSecureCookies(request: NextRequest) {
  if (request.nextUrl.protocol === "https:") return true;
  const forwardedProto = request.headers.get("x-forwarded-proto");
  return (forwardedProto || "").split(",").map((v) => v.trim().toLowerCase()).includes("https");
}

export async function POST(request: NextRequest) {
  const payload: Payload | null = await request.json().catch(() => null);
  if (!payload) {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }

  const mode: "set" | "clear" = payload.mode === "clear" ? "clear" : "set";
  const token = typeof payload.token === "string" ? payload.token : "";
  if (mode === "set" && !token) {
    return NextResponse.json({ message: "token is required" }, { status: 400 });
  }

  const secureOrigin = canUseSecureCookies(request);
  const response = NextResponse.json({ ok: true });
  const maxAge = resolveMaxAge(payload, mode);

  for (const cookie of ACCESS_TOKEN_COOKIES) {
    if (cookie.requireSecure && !secureOrigin) {
      console.warn(`[session-cookie] Skipping "${cookie.name}" because the request is not secure.`);
      continue;
    }

    response.cookies.set({
      name: cookie.name,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      maxAge,
      path: "/",
      secure: cookie.requireSecure ? true : secureOrigin,
    });
  }

  return response;
}
