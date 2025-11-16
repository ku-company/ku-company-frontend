export type NotificationItem = {
  id: string;
  type: "application" | "announcement" | string;
  title: string;
  body: string;
  status?: string;
  timestamp?: string;
  version: string;
};

type NotificationResponse = {
  notifications?: NotificationItem[];
};

export async function fetchNotifications(signal?: AbortSignal): Promise<NotificationItem[]> {
  const res = await fetch("/api/notifications", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    signal,
  });

  const json: NotificationResponse = await res
    .json()
    .catch(() => ({ notifications: [] }));

  const list = Array.isArray(json?.notifications) ? json.notifications : [];
  return list
    .filter((item): item is NotificationItem => Boolean(item && item.id && item.version))
    .map((item) => ({
      ...item,
      id: String(item.id),
      version: String(item.version),
    }));
}
