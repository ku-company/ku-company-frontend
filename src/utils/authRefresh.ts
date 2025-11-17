"use client";

import { fetchAuthMe } from "@/api/session";
import { getAuthMe } from "@/api/user";

type LoginFn = (data: {
  access_token: string;
  refresh_token: string;
  user_name: string;
  email: string;
  roles?: string;
  role?: string;
  id?: number | string | null;
}) => void;

function extractAccessToken(payload?: any): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  return (
    payload?.access_token ??
    payload?.accessToken ??
    payload?.token ??
    payload?.tokens?.access_token ??
    payload?.data?.access_token ??
    payload?.data?.token
  );
}

function extractRefreshToken(payload?: any): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  return (
    payload?.refresh_token ??
    payload?.refreshToken ??
    payload?.tokens?.refresh_token ??
    payload?.data?.refresh_token
  );
}

function persistTokensFromPayload(payload?: any) {
  if (typeof window === "undefined" || !payload || typeof payload !== "object") return;
  const accessToken = extractAccessToken(payload);
  const refreshToken = extractRefreshToken(payload);

  if (typeof accessToken === "string" && accessToken.length > 0) {
    localStorage.setItem("access_token", accessToken);
  }
  if (typeof refreshToken === "string" && refreshToken.length > 0) {
    localStorage.setItem("refresh_token", refreshToken);
  }
}

export async function reloginAfterAiReview(login: LoginFn, payload?: any) {
  try {
    persistTokensFromPayload(payload);
    const tokenOverride = extractAccessToken(payload);
    let latest = null;
    try {
      if (tokenOverride) {
        latest = await getAuthMe(tokenOverride);
      }
    } catch (err) {
      console.warn("Failed to fetch auth using override token:", err);
    }
    if (!latest) {
      latest = await fetchAuthMe();
    }
    if (latest) {
      persistTokensFromPayload(latest);
    }
    if (!latest?.user_name) return;

    login({
      access_token: localStorage.getItem("access_token") ?? "",
      refresh_token: localStorage.getItem("refresh_token") ?? "",
      user_name: latest.user_name ?? "",
      email: latest.email ?? "",
      roles: latest.role ?? latest.roles ?? undefined,
      id: latest.id,
    });
  } catch (err) {
    console.warn("Failed to refresh auth after AI review:", err);
  }
}
