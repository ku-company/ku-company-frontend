import { buildInit } from "./base";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const API_URL = `${BASE_URL}/api/professor/announcements/`;
const API_URL_ALL = `${BASE_URL}/api/professor/announcements/all/`;
const API_URL_POSTS = `${BASE_URL}/api/professor/posts/`;

/* ---------------- Fetch all announcements ---------------- */
export async function fetchProfessorAnnouncements() {
  const res = await fetch(API_URL_ALL, buildInit({ method: "GET" }));
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch announcements: ${res.status} - ${text}`);
  }
  return res.json();
}

/* ---------------- Create new announcement ---------------- */
export async function createProfessorAnnouncement(data: {
  content: string;
  is_connection?: boolean;
}) {
  const res = await fetch(API_URL, buildInit({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }));
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create announcement: ${res.status} - ${text}`);
  }
  return res.json();
}

/* ---------------- Delete announcement ---------------- */
export async function deleteProfessorAnnouncement(id: number) {
  const res = await fetch(`${API_URL_POSTS}${id}/`, buildInit({ method: "DELETE" }));
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to delete announcement: ${res.status} - ${text}`);
  }
  return true;
}
