"use client";

import { useEffect, useRef, useState } from "react";
import { BellIcon } from "@heroicons/react/24/outline";
import { API_BASE, buildInit } from "@/api/base";
import { useAuth } from "@/context/AuthContext";

type UIStatus = "Approved" | "Confirmed" | "Declined" | "Pending";
type Application = {
  id: number;
  position: string;
  company_name: string;
  status: UIStatus;
};

const STORAGE_KEY = "notif.appStatusMap"; // id -> status

function loadSeen(): Record<string, UIStatus> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {} as any;
    const obj = JSON.parse(raw);
    return obj && typeof obj === "object" ? obj : {};
  } catch {
    return {} as any;
  }
}

function saveSeen(map: Record<string, UIStatus>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(map)); } catch {}
}

async function fetchMyApplications(): Promise<Application[]> {
  const res = await fetch(`${API_BASE}/api/employee/my-applications`, buildInit({ method: "GET", credentials: "include" }));
  const text = await res.text();
  let json: any = {};
  try { json = JSON.parse(text); } catch {}
  const data: any[] = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
  return data.map((a) => {
    const position = a?.job_post?.position ?? a?.job_post?.job_title ?? a?.position ?? "—";
    const companyName = a?.job_post?.company?.company_name ?? a?.job_post?.company_name ?? `Company #${a?.job_post?.company_id ?? "-"}`;
    const emp = (a?.employee_send_status ?? "").toString().toLowerCase();
    const comp = (a?.company_send_status ?? "").toString().toLowerCase();
    let status: UIStatus = "Pending";
    if (emp === "confirmed") status = "Confirmed";
    else if (emp === "rejected") status = "Declined";
    else if (comp === "approved" || comp === "confirmed") status = "Approved";
    return { id: Number(a?.id ?? 0), position, company_name: String(companyName), status } as Application;
  });
}

export default function NotificationsBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Application[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  // compute unread by comparing to storage
  async function refresh() {
    try {
      const list = await fetchMyApplications();
      setItems(list);
      const seen = loadSeen();
      let cnt = 0;
      for (const app of list) {
        const prev = seen[String(app.id)];
        if (!prev) continue; // treat unseen apps as baseline (no notification)
        if (prev !== app.status) cnt++;
      }
      setUnread(cnt);
      return list;
    } catch {
      // ignore
    }
  }

  // bootstrap + polling and focus refresh
  useEffect(() => {
    if (!user || !(user.role || "").toLowerCase().includes("student")) return;
    let timer: number | null = null;
    refresh();
    const onFocus = () => refresh();
    if (typeof window !== "undefined") {
      window.addEventListener("focus", onFocus);
      timer = window.setInterval(refresh, 30000) as unknown as number; // 30s
    }
    return () => {
      if (typeof window !== "undefined") window.removeEventListener("focus", onFocus);
      if (timer) window.clearInterval(timer);
    };
  }, [user]);

  // click outside to close
  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (open && ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  // Mark all as read when closing dropdown
  useEffect(() => {
    if (!open) {
      const seen = loadSeen();
      for (const it of items) seen[String(it.id)] = it.status;
      saveSeen(seen);
    } else {
      // opening: clear bell indicator immediately
      setUnread(0);
    }
  }, [open, items]);

  if (!user || !(user.role || "").toLowerCase().includes("student")) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); if (!open) refresh(); }}
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
              items.map((it) => {
                const seen = loadSeen();
                const changed = seen[String(it.id)] && seen[String(it.id)] !== it.status;
                const status = it.status;
                const statusColor = status === 'Confirmed' ? 'text-emerald-700 bg-emerald-100 border border-emerald-200'
                  : status === 'Declined' ? 'text-rose-700 bg-rose-100 border border-rose-200'
                  : status === 'Approved' ? 'text-amber-700 bg-amber-100 border border-amber-200'
                  : 'text-gray-700 bg-gray-100 border border-gray-200';
                return (
                  <div key={it.id} className={`px-3 py-2 text-sm ${changed ? '' : ''} flex items-start gap-2`}>
                    {changed && <span className="mt-1 w-2 h-2 rounded-full bg-red-600" />}
                    <div className="min-w-0">
                      <div className="text-gray-800 truncate">Application for {it.position} at {it.company_name}</div>
                      <div className="mt-1">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${statusColor}`}>{status}</span>
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
