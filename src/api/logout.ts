import { API_BASE } from "./base";

/**
 * Logs the user out from the backend (clears cookie)
 */
export async function logoutServerSession(): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/api/user/logout`, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) {
      console.warn("Logout failed:", await res.text());
    }
  } catch (err) {
    console.error("Logout error:", err);
  }
}
