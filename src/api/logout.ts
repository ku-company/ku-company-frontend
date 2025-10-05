const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:8000";

/**
 * Logs the user out from the backend (clears cookie)
 */
export async function logoutServerSession(): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/api/user/logout`, {
      method: "GET",
      credentials: "include", // send cookie so backend can clear it
    });
    if (!res.ok) {
      console.warn("Logout failed:", await res.text());
    }
  } catch (err) {
    console.error("Logout error:", err);
  }
}
