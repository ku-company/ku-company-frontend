const SECURE_COOKIE_NAME = "__Secure-access_token";
const LEGACY_COOKIE_NAME = "access_token";

type SameSiteMode = "Strict" | "Lax" | "None";

type CookiePolicy = {
  sameSite: SameSiteMode;
};

const COOKIE_POLICIES: Record<string, CookiePolicy> = {
  [SECURE_COOKIE_NAME]: { sameSite: "Lax" },
  [LEGACY_COOKIE_NAME]: { sameSite: "Lax" }, // legacy cookie remains aligned with backend expectation
};

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${name}=([^;]+)`),
  );
  return match && match[1] ? decodeURIComponent(match[1]) : null;
}

function resolveSameSite(name: string): SameSiteMode {
  const policy = COOKIE_POLICIES[name];
  if (!policy) {
    console.warn(`[cookie] Missing SameSite policy for "${name}". Defaulting to Lax.`);
    return "Lax";
  }
  return policy.sameSite;
}

function writeCookie(name: string, value: string, maxAge: number, secure: boolean) {
  if (typeof document === "undefined") return;
  const attributes = [
    `path=/`,
    `max-age=${maxAge}`,
    `SameSite=${resolveSameSite(name)}`,
  ];
  if (secure) attributes.push("Secure");
  document.cookie = `${name}=${encodeURIComponent(value)}; ${attributes.join("; ")}`;
}

function canUseSecureAttribute(): boolean {
  if (typeof window === "undefined") return false;
  if (window.isSecureContext) return true;
  try {
    return window.location?.protocol === "https:";
  } catch {
    return false;
  }
}

export function readAccessTokenCookie(): string | null {
  return getCookie(SECURE_COOKIE_NAME) ?? getCookie(LEGACY_COOKIE_NAME);
}

export function writeAccessTokenCookie(value: string, maxAgeSeconds: number) {
  const secure = canUseSecureAttribute();
  writeCookie(SECURE_COOKIE_NAME, value, maxAgeSeconds, secure);
  if (!secure) {
    console.warn(
      "[cookie] Secure context unavailable. Falling back to legacy cookie name without Secure attribute for local development.",
    );
    writeCookie(LEGACY_COOKIE_NAME, value, maxAgeSeconds, false);
  } else {
    // Keep legacy cookie in sync (Secure attribute included) until backend stops requiring it.
    writeCookie(LEGACY_COOKIE_NAME, value, maxAgeSeconds, true);
  }
}

export function clearAccessTokenCookies() {
  writeCookie(SECURE_COOKIE_NAME, "", 0, canUseSecureAttribute());
  writeCookie(LEGACY_COOKIE_NAME, "", 0, canUseSecureAttribute());
}

export const ACCESS_TOKEN_COOKIE_NAMES = {
  secure: SECURE_COOKIE_NAME,
  legacy: LEGACY_COOKIE_NAME,
} as const;
