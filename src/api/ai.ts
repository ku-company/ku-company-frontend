import { API_BASE, buildInit } from "./base";

type AiReviewResponse = {
  message?: string;
  data?: any;
};

export async function requestAiRegistrationReview(userId: number) {
  const url = `${API_BASE}/api/ai/verify-user/${userId}`;
  const init = buildInit({ method: "POST" });

  try {
    console.groupCollapsed(`[AI Review] POST ${url}`);
    console.log("request", { userId });
    console.groupEnd();
  } catch {}

  const res = await fetch(url, init);
  const text = await res.text().catch(() => "");

  try {
    console.groupCollapsed(`[AI Review] Response ${url}`);
    console.log("status", res.status, "preview", text.slice(0, 400));
    console.groupEnd();
  } catch {}

  if (!res.ok) {
    let message: string | undefined;
    try {
      const parsed = JSON.parse(text);
      message = parsed?.message || parsed?.error;
    } catch {
      message = text;
    }
    throw new Error(message || `AI review failed (${res.status})`);
  }

  try {
    return JSON.parse(text) as AiReviewResponse;
  } catch {
    return { data: text } as AiReviewResponse;
  }
}
