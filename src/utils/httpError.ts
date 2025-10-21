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
    // If plain text and not JSON-looking, use it
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

