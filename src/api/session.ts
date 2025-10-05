// src/api/session.ts

export type MeResponse = {
  message?: string;
  data?: {
    user_name: string;
    email: string;
    role?: string;
    roles?: string;
    access_token?: string;   // some backends may also echo tokens
    refresh_token?: string;
  };
} | {
  user_name: string;
  email: string;
  role?: string;
  roles?: string;
  access_token?: string;
  refresh_token?: string;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:8000";

function unwrap<T>(payload: any): T {
  if (payload && typeof payload === "object" && "data" in payload && payload.data) {
    return payload.data as T;
  }
  return payload as T;
}

export async function fetchMe() {
  const res = await fetch(`${API_BASE}/api/user/me`, {
    method: "GET",
    credentials: "include", // IMPORTANT: send cookies
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Failed to fetch session: ${res.statusText}`);
  }

  const json = await res.json().catch(() => ({}));
  return unwrap<{
    user_name: string;
    email: string;
    role?: string;
    roles?: string;
    access_token?: string;
    refresh_token?: string;
  }>(json);
}
