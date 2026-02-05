import { logoutAndClear } from "@/utils/logoutClient";

let autoLogoutTriggered = false;

export async function autoLogout(): Promise<void> {
  if (autoLogoutTriggered) return;
  autoLogoutTriggered = true;
  try {
    await logoutAndClear({ redirectToLogin: true });
  } finally {
    // allow future triggers after a short delay (avoid storms)
    setTimeout(() => { autoLogoutTriggered = false; }, 3000);
  }
}

export function shouldDeferAutoLogout(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const path = window.location?.pathname || "";
    if (path.startsWith("/login")) return true;
    const role = (localStorage.getItem("role") || "").toLowerCase();
    if (!role || role.includes("unknown") || role.includes("unset")) return true;
  } catch {}
  return false;
}

function isExpiredAuthMessage(m: string): boolean {
  const s = (m || "").toLowerCase();
  return (
    s.includes("jwt expired") ||
    s.includes("token expired") ||
    s.includes("expired token") ||
    s.includes("invalid token") ||
    s.includes("invalid or expired") ||
    s.includes("signature has expired")
  );
}

export async function extractErrorMessage(res: Response): Promise<string> {
  const status = res.status;
  let text = "";
  let json: any = undefined;
  try {
    text = await res.text();
    try { json = text ? JSON.parse(text) : undefined; } catch { /* not json */ }
  } catch { /* ignore */ }

  let msg =
    (json && (json.message || json.error || json.detail || json.msg)) ||
    (typeof json === "string" ? json : "");

  if (!msg) {
    const looksJson = /^\s*[\[{]/.test(text);
    if (text && !looksJson) msg = text;
  }

  if (!msg) {
    msg = status >= 500
      ? "Server error"
      : status === 404
      ? "Not found"
      : status === 401
      ? "Unauthorized"
      : status === 403
      ? "Forbidden"
      : status === 400
      ? "Bad request"
      : (res.statusText || "Request failed");
  }

  if (status === 401) {
    const lower = String(msg || text || "").toLowerCase();
    if (isExpiredAuthMessage(lower) && !shouldDeferAutoLogout()) {
      await autoLogout();
    }
  }

  msg = String(msg).trim().replace(/^"|"$/g, "");
  if (msg.length) msg = msg.charAt(0).toUpperCase() + msg.slice(1);
  return msg;
}

export async function assertOk(res: Response): Promise<void> {
  if (!res.ok) {
    const message = await extractErrorMessage(res);
    throw new Error(message);
  }
}

