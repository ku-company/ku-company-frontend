const DEFAULT_BACKEND = "http://localhost:8000";
const BLOCKED_HOST_REGEX = /(googleapis|googleusercontent|google\.com)/i;

function sanitize(value: string) {
  return value.replace(/\/+$/, "");
}

export function getApiBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!raw) return DEFAULT_BACKEND;

  const allowExternal = process.env.NEXT_PUBLIC_ALLOW_EXTERNAL_API === "true";
  if (!allowExternal && BLOCKED_HOST_REGEX.test(raw)) {
    if (typeof window !== "undefined") {
      console.warn(
        `[api] NEXT_PUBLIC_API_BASE_URL="${raw}" requires API keys. Falling back to ${DEFAULT_BACKEND}. Set NEXT_PUBLIC_ALLOW_EXTERNAL_API=true to force it.`
      );
    }
    return DEFAULT_BACKEND;
  }

  try {
    const url = new URL(raw);
    return sanitize(url.toString());
  } catch {
    return sanitize(raw);
  }
}
