"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BellIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/context/AuthContext";
import { fetchNotifications, type NotificationItem } from "@/api/notifications";

type NotificationsBellProps = {
  onUnreadChange?: (count: number) => void;
};

const STORAGE_KEY = "notif.latestMap"; // id -> version

function loadSeen(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const obj = JSON.parse(raw);
    return obj && typeof obj === "object" ? obj : {};
  } catch {
    return {};
  }
}

function saveSeen(map: Record<string, string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

function formatTimestamp(ts?: string) {
  if (!ts) return "";
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function statusChipClasses(status?: string) {
  const normalized = (status ?? "").toLowerCase();
  if (normalized === "confirmed") return "text-emerald-700 bg-emerald-100 border border-emerald-200";
  if (normalized === "declined" || normalized === "rejected") return "text-rose-700 bg-rose-100 border border-rose-200";
  if (normalized === "approved") return "text-amber-700 bg-amber-100 border border-amber-200";
  return "text-gray-700 bg-gray-100 border border-gray-200";
}

function typePillClasses(type: string) {
  if (type === "announcement") return "bg-sky-100 text-sky-700 border border-sky-200";
  return "bg-emerald-100 text-emerald-700 border border-emerald-200";
}

export default function NotificationsBell({ onUnreadChange }: NotificationsBellProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [hasOpened, setHasOpened] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    try {
      const list = await fetchNotifications();
      setItems(list);
      const seen = loadSeen();
      let cnt = 0;
      for (const item of list) {
        const prev = seen[item.id];
        if (!prev || prev !== item.version) cnt++;
      }
      setUnread(cnt);
      onUnreadChange?.(cnt);
      return list;
    } catch (error) {
      console.warn("Failed to refresh notifications", error);
      setItems([]);
      setUnread(0);
      onUnreadChange?.(0);
      return [];
    }
  }, [onUnreadChange]);

  // bootstrap + polling and focus refresh
  useEffect(() => {
    if (!user || !(user.role || "").toLowerCase().includes("student")) return;
    let timer: number | null = null;
    refresh();
    const onFocus = () => refresh();
    if (typeof window !== "undefined") {
      window.addEventListener("focus", onFocus);
      timer = window.setInterval(refresh, 30000) as unknown as number;
    }
    return () => {
      if (typeof window !== "undefined") window.removeEventListener("focus", onFocus);
      if (timer) window.clearInterval(timer);
    };
  }, [user, refresh]);

  // click outside to close
  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (open && ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  useEffect(() => {
    if (open) {
      setHasOpened(true);
      setUnread(0);
      onUnreadChange?.(0);
    }
  }, [open, onUnreadChange]);

  // mark as read after dropdown closes post-open
  useEffect(() => {
    if (!hasOpened || open) return;
    const seen = loadSeen();
    let updated = false;
    for (const item of items) {
      if (seen[item.id] !== item.version) {
        seen[item.id] = item.version;
        updated = true;
      }
    }
    if (updated) saveSeen(seen);
  }, [open, items, hasOpened]);

  if (!user || !(user.role || "").toLowerCase().includes("student")) return null;

  const seenMap = useMemo(() => loadSeen(), [items]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) refresh();
        }}
        className="relative inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100"
        aria-label="Notifications"
        title="Notifications"
      >
        <BellIcon className="h-5 w-5 text-gray-700" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-600" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border bg-white shadow-lg overflow-hidden z-50">
          <div className="flex items-center justify-between px-3 py-2 border-b bg-gray-50">
            <div className="text-sm font-semibold">Notifications</div>
          </div>
          <div className="max-h-80 overflow-auto">
            {items.length === 0 ? (
              <div className="px-3 py-6 text-sm text-gray-500">No recent activity.</div>
            ) : (
              items.map((item) => {
                const changed = seenMap[item.id] !== item.version;
                return (
                  <div key={item.id} className="px-3 py-2 text-sm flex items-start gap-2">
                    {changed && <span className="mt-1 w-2 h-2 rounded-full bg-red-600" />}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-gray-800 font-medium">{item.title}</p>
                        <span className="text-[11px] text-gray-400 whitespace-nowrap">
                          {formatTimestamp(item.timestamp)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-gray-600 text-sm line-clamp-2">{item.body}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${typePillClasses(item.type)}`}>
                          {item.type === "announcement" ? "Announcement" : "Application"}
                        </span>
                        {item.status && (
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${statusChipClasses(item.status)}`}>
                            {item.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="px-3 py-2 border-t bg-gray-50 text-right">
            <a href="/status" className="text-xs text-emerald-700 hover:underline">View all</a>
          </div>
        </div>
      )}
    </div>
  );
}
