const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  const cookies = document.cookie ? document.cookie.split(";") : [];
  for (const raw of cookies) {
    const cookie = raw.trim();
    if (cookie.startsWith(prefix)) {
      try {
        const decoded = decodeURIComponent(cookie.slice(prefix.length));
        return decoded.replace(/^"+|"+$/g, "").replace(/^'+|'+$/g, "");
      } catch {
        const value = cookie.slice(prefix.length);
        return value.replace(/^"+|"+$/g, "").replace(/^'+|'+$/g, "");
      }
    }
  }
  return null;
}

function ensureToken(name: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const fromStorage = localStorage.getItem(name);
    if (fromStorage) return fromStorage;
  } catch {
    // Ignore storage failures (e.g., private browsing)
  }
  const fromCookie = readCookie(name);
  if (fromCookie) {
    try {
      localStorage.setItem(name, fromCookie);
    } catch {
      // Swallow quota or privacy errors
    }
    return fromCookie;
  }
  return null;
}

export function getAccessToken(): string | null {
  return ensureToken(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return ensureToken(REFRESH_KEY);
}

export function ensureTokensFromCookies() {
  return {
    access_token: getAccessToken(),
    refresh_token: getRefreshToken(),
  };
}
