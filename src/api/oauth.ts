// src/api/oauth.ts

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:8000";

export type GoogleSignupRole = "Student" | "Company" | "Professor";

export type GoogleSignupOptions = {
  studentId?: string;
  consent?: boolean;
  extraParams?: Record<string, string | number | boolean | null | undefined>;
};

export function buildGoogleSignupUrl(
  role: GoogleSignupRole = "Student",
  options?: GoogleSignupOptions
) {
  const url = new URL(`${API_BASE}/api/auth/google`);
  url.searchParams.set("role", role);

  if (options?.studentId) {
    url.searchParams.set("stdId", options.studentId);
  }

  if (options?.consent !== undefined) {
    url.searchParams.set("consent", options.consent ? "true" : "false");
  }

  if (options?.extraParams) {
    for (const [key, value] of Object.entries(options.extraParams)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

export type OAuthTokens = {
  access_token: string;
  refresh_token?: string;
  user_name?: string;
  email?: string;
  role?: string;  // normalized single role
};

// Parse tokens and user info from URL (search or hash)
export function parseTokensFromLocation(
  loc: Location = window.location
): Partial<OAuthTokens> {
  const result: Record<string, string | undefined> = {};

  const fromSearch = new URLSearchParams(loc.search);
  const fromHash = new URLSearchParams(loc.hash.replace(/^#/, ""));

  const get = (k: string) => fromSearch.get(k) ?? fromHash.get(k) ?? undefined;

  result.access_token = get("access_token") ?? undefined;
  result.refresh_token = get("refresh_token") ?? undefined;
  result.user_name = get("user_name") ?? undefined;
  result.email = get("email") ?? undefined;

  const rawRole = get("roles") ?? get("role") ?? undefined;
  if (rawRole) {
    const r = rawRole.trim().toLowerCase();
    result.role = r.includes("company") ? "Company" : r.includes("student") ? "Student" : rawRole;
  }

  return result as Partial<OAuthTokens>;
}

// Clear tokens from URL so they don't linger in history
export function stripTokensFromUrl() {
  const { origin, pathname } = window.location;
  window.history.replaceState({}, "", `${origin}${pathname}`);
}
