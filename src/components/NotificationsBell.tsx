"use client";

import { useEffect, useRef, useState } from "react";

export type NotificationItem = {
  id: string;
  title: string;
  description?: string;
  createdAt: string; // ISO string
  read?: boolean;
  href?: string;
};

function timeAgo(iso: string) {
  const d = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - d);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

export default function NotificationsBell({
  initial = [],
  onOpenChange,
}: {
  initial?: NotificationItem[];
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>(initial);
  const menuRef = useRef<HTMLDivElement>(null);

  // demo seed if none provided
  useEffect(() => {
    if (initial.length === 0) {
      setItems([
        {
          id: "1",
          title: "New applicant",
          description: "John Doe applied for Software Engineer",
          createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
          read: false,
        },
        {
          id: "2",
          title: "Profile approved",
          description: "Your company profile is now visible",
          createdAt: new Date(Date.now() - 2 * 60 * 60_000).toISOString(),
          read: true,
        },
      ]);
    }
  }, [initial]);

  // click outside to close
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        onOpenChange?.(false);
      }
    }
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open, onOpenChange]);

  const unreadCount = items.filter((i) => !i.read).length;

  function toggle() {
    const next = !open;
    setOpen(next);
    onOpenChange?.(next);
  }

  function markAllRead() {
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
  }

  function onItemClick(id: string, href?: string) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, read: true } : i))
    );
    if (href) window.location.href = href;
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={toggle}
        aria-label="Notifications"
        aria-haspopup="menu"
        aria-expanded={open ? "true" : "false"}
        className="relative grid h-9 w-9 place-items-center rounded-full border bg-white text-gray-700 hover:bg-gray-50"
      >
        {/* bell icon */}
        <svg width="18" height="18" viewBox="0 0 24 24" className="opacity-80">
          <path
            d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2zm6-6V11a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2z"
            fill="currentColor"
          />
        </svg>

        {/* unread red dot */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 w-80 rounded-xl border bg-white shadow-lg"
        >
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <div className="text-sm font-semibold text-gray-800">Notifications</div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-emerald-700 hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">No notifications.</div>
          ) : (
            <ul className="max-h-80 overflow-auto py-1">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => onItemClick(n.id, n.href)}
                    className={`group block w-full px-4 py-3 text-left hover:bg-gray-50 ${
                      n.read ? "opacity-75" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && (
                        <span className="mt-1 inline-block h-2 w-2 rounded-full bg-emerald-600" />
                      )}
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-gray-900">
                          {n.title}
                        </div>
                        {n.description && (
                          <div className="truncate text-xs text-gray-600">
                            {n.description}
                          </div>
                        )}
                        <div className="mt-0.5 text-[11px] text-gray-400">
                          {timeAgo(n.createdAt)}
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
