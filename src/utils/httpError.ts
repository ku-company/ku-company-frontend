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

function pickErrorFromArray(errors: any[]): string | undefined {
  for (const entry of errors) {
    if (typeof entry === "string" && entry.trim().length) return entry;
    if (entry && typeof entry === "object") {
      const maybeMessage = typeof entry.message === "string" ? entry.message : entry.msg;
      if (maybeMessage && maybeMessage.trim().length) return maybeMessage;
    }
  }
  return undefined;
}

export type ExtractedError = {
  message: string;
  text: string;
  json: any;
};

type HttpErrorInit = {
  message: string;
  status: number;
  statusText?: string;
  body?: string;
  payload?: any;
};

export class HttpError extends Error {
  status: number;
  statusText: string;
  body?: string;
  payload?: any;

  constructor(init: HttpErrorInit) {
    super(init.message);
    this.name = "HttpError";
    this.status = init.status;
    this.statusText = init.statusText ?? "";
    this.body = init.body;
    this.payload = init.payload;
  }
}

export async function extractError(res: Response): Promise<ExtractedError> {
  const status = res.status;
  let text = "";
  let json: any = undefined;
  try {
    text = await res.text();
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        json = undefined;
      }
    }
  } catch { /* ignore */ }

  const arrayError = Array.isArray(json?.errors) ? pickErrorFromArray(json.errors as any[]) : undefined;

  let msg =
    (json && (json.message || json.error || json.detail || json.msg || json?.details)) ||
    arrayError ||
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
  return { message: msg, text, json };
}

export async function extractErrorMessage(res: Response): Promise<string> {
  const { message } = await extractError(res);
  return message;
}

export async function assertOk(res: Response): Promise<void> {
  if (!res.ok) {
    const { message, text, json } = await extractError(res);
    throw new HttpError({
      message,
      status: res.status,
      statusText: res.statusText,
      body: text,
      payload: json,
    });
  }
}

