export const API_BASE = "http://localhost:8000";

const CSRF_COOKIE = "csrf_token";
const CSRF_HEADER = "x-csrf-token";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const API_BASE_URL = (() => {
  try {
    return new URL(API_BASE);
  } catch {
    return null;
  }
})();

let csrfPrefetchPromise: Promise<void> | null = null;
let fetchPatched = false;

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = document.cookie
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return value ? decodeURIComponent(value.split("=").slice(1).join("=")) : null;
}

export function getCsrfTokenFromCookie(): string | null {
  return getCookie(CSRF_COOKIE);
}

export async function ensureCsrfToken(): Promise<void> {
  if (typeof window === "undefined") return;
  if (getCsrfTokenFromCookie()) return;
  if (!csrfPrefetchPromise) {
    csrfPrefetchPromise = fetch(`${API_BASE}/api/auth/me`, {
      method: "GET",
      credentials: "include",
    })
      .catch(() => undefined)
      .finally(() => {
        csrfPrefetchPromise = null;
      });
  }
  await csrfPrefetchPromise;
}

function toHeaders(initHeaders?: HeadersInit): Headers {
  return new Headers(initHeaders || {});
}

function appendCsrfHeader(headers: Headers) {
  const token = getCsrfTokenFromCookie();
  if (token && !headers.has(CSRF_HEADER)) {
    headers.set(CSRF_HEADER, token);
  }
}

// Helper to include authorization headers (if tokens exist)
export function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Wrapper for fetch initialization
export function buildInit(init: RequestInit = {}): RequestInit {
  const headers = toHeaders();
  const auth = getAuthHeaders();
  if (!(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  Object.entries(auth).forEach(([k, v]) => headers.set(k, v));

  if (init.headers) {
    const extra = toHeaders(init.headers);
    extra.forEach((value, key) => {
      headers.set(key, value);
    });
  }

  appendCsrfHeader(headers);

  return {
    credentials: init.credentials ?? "include",
    ...init,
    headers,
  };
}

function shouldAttachCsrf(url: string | undefined, method: string | undefined) {
  if (!url || !API_BASE_URL) return false;
  const upperMethod = (method || "GET").toUpperCase();
  if (SAFE_METHODS.has(upperMethod)) return false;
  let target: URL | null = null;
  try {
    target = new URL(url);
  } catch {
    try {
      target = new URL(url, API_BASE_URL);
    } catch {
      target = null;
    }
  }
  if (!target) return false;
  if (target.origin !== API_BASE_URL.origin) return false;
  const basePath = API_BASE_URL.pathname.endsWith("/")
    ? API_BASE_URL.pathname
    : `${API_BASE_URL.pathname}/`;
  return target.pathname.startsWith(basePath);
}

function patchFetchWithCsrf() {
  if (fetchPatched || typeof window === "undefined" || typeof window.fetch !== "function") return;
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
          ? input.href
          : input instanceof Request
          ? input.url
          : undefined;
      const method =
        init?.method ||
        (input instanceof Request ? input.method : undefined) ||
        "GET";
      if (shouldAttachCsrf(url, method)) {
        const token = getCsrfTokenFromCookie();
        if (token) {
          const headers = toHeaders(
            init?.headers || (input instanceof Request ? input.headers : undefined),
          );
          if (!headers.has(CSRF_HEADER)) {
            headers.set(CSRF_HEADER, token);
            if (input instanceof Request) {
              const nextRequest = new Request(input, { ...init, headers });
              return originalFetch(nextRequest);
            }
            return originalFetch(input as any, { ...init, headers });
          }
        }
      }
    } catch {
      // fall through to original fetch on any errors
    }
    return originalFetch(input as any, init);
  };
  fetchPatched = true;
}

patchFetchWithCsrf();

// Some APIs wrap data under a "data" field — this safely unwraps it
export function unwrap<T = any>(json: any): T {
  if (!json) return {} as T;
  return (json.data ?? json) as T;
}
