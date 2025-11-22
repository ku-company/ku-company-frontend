import { API_BASE, buildInit } from "./base";

export async function attachStudentId(stdId: string) {
  const trimmed = (stdId || "").trim();
  if (!trimmed) {
    throw new Error("Student ID is required");
  }

  const res = await fetch(
    `${API_BASE}/api/employee/stdId`,
    buildInit({
      method: "PATCH",
      body: JSON.stringify({ stdId: trimmed }),
    })
  );

  const text = await res.text().catch(() => "");
  if (!res.ok) {
    throw new Error(text || `Failed to attach student ID (${res.status})`);
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
