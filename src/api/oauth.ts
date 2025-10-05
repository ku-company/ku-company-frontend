// src/api/oauth.ts

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:8000";

export function buildGoogleSignupUrl(role: "Student" | "Company" | "Professor" = "Student") {
  // Backend endpoint you gave:
  // http://localhost:8000/google/sign-up?role=Student
  const url = new URL(`${API_BASE}/api/auth/google?role=Student`);
  url.searchParams.set("role", role);
  return url.toString();
}

export type OAuthTokens = {
  access_token: string;
  refresh_token?: string;
  user_name?: string;
  email?: string;
  role?: string;  // normalized single role
};

// Parse tokens/fields from either ?query or #hash (many IdPs use hash fragments)
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

  // backend may return "roles" or "role"
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
