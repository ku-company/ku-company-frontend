"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adminListAllUsers, adminFilterUsersByStatus, adminVerifyUser, adminRejectUser, type AdminUser } from "@/api/admin";
import { useAuth } from "@/context/AuthContext";

// ---- Types ----
type Status = "approved" | "rejected" | "pending";
type Role = "Student" | "Company" | "Professor";

type Row = {
  id?: number;
  username: string;
  role: Role | "Admin";
  email: string;
  dateRegistered: string; // display string
  status: Status;
};

function mapUser(u: AdminUser): Row {
  const statusRaw = (u.status || "Pending").toString();
  const status: Status = statusRaw.toLowerCase() as Status;
  const roleRaw = (u.role || "Student").toString();
  const created = u.created_at ? new Date(u.created_at) : null;
  return {
    id: (u as any).id, // backend may not include id; handle undefined
    username: u.user_name || "",
    role: (roleRaw.charAt(0).toUpperCase() + roleRaw.slice(1)) as any,
    email: u.email || "",
    dateRegistered: created ? created.toLocaleDateString() : "",
    status,
  };
}

// ---- Brand color ----
const GREEN = "#5b8f5b";

// ---- Small UI helpers ----
function StatusDropdown({
  value,
  onChange,
}: {
  value: Status;
  onChange: (v: Status) => void;
}) {
  const base =
    "rounded-md border px-2 py-1 text-xs font-medium focus:outline-none focus:ring";
  const colorClass =
    value === "approved"
      ? "bg-green-100 text-green-800 border-green-300"
      : value === "rejected"
      ? "bg-rose-100 text-rose-800 border-rose-300"
      : "bg-blue-100 text-blue-800 border-blue-300";

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Status)}
      className={`${base} ${colorClass}`}
    >
      <option value="approved">Approved</option>
      <option value="rejected">Rejected</option>
      <option value="pending">Pending</option>
    </select>
  );
}

type Tab = "all" | "approved" | "rejected" | "pending";

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isReady } = useAuth();
  // main data state (so dropdown updates persist)
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>("all");
  const [role, setRole] = useState<"All" | Role>("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  // filters
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const okTab =
        tab === "all"
          ? true
          : tab === "approved"
          ? r.status === "approved"
          : tab === "rejected"
          ? r.status === "rejected"
          : r.status === "pending";
      const okRole = role === "All" ? true : r.role === role;
      const okSearch =
        !q ||
        r.username.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.role.toLowerCase().includes(q);
      return okTab && okRole && okSearch;
    });
  }, [rows, tab, role, search]);

  // pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = filtered.slice((page - 1) * pageSize, page * pageSize);

  // bootstrap: auth guard and initial load
  useEffect(() => {
    (async () => {
      if (!isReady) return;
      if (!user || (user.role || "").toLowerCase() !== "admin") {
        router.replace("/admin/login");
        return;
      }
      try {
        setLoading(true);
        const list = await adminListAllUsers();
        setRows(list.map(mapUser));
      } catch (e: any) {
        setErr(e?.message || "Failed to load users");
      } finally {
        setLoading(false);
      }
    })();
  }, [isReady, user, router]);

  // handlers
  const resetPage = () => setPage(1);
  const handleChangeStatus = async (id: number | undefined, status: Status) => {
    if (typeof id !== 'number') return; // do not alter UI if we cannot persist
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    try {
      if (status === 'approved') await adminVerifyUser(id);
      else if (status === 'rejected') await adminRejectUser(id);
      // 'pending' has no dedicated endpoint; leaving as-is
    } catch (e) {
      // on error, we could reload to sync
    }
  };

  // server-side filter by status when switching tabs
  useEffect(() => {
    (async () => {
      if (!isReady) return;
      if (!user || (user.role || "").toLowerCase() !== "admin") return;
      try {
        if (tab === 'all') {
          const list = await adminListAllUsers();
          setRows(list.map(mapUser));
        } else if (tab === 'approved') {
          const list = await adminFilterUsersByStatus('Approved');
          setRows(list.map(mapUser));
        } else if (tab === 'rejected') {
          const list = await adminFilterUsersByStatus('Rejected');
          setRows(list.map(mapUser));
        } else if (tab === 'pending') {
          const list = await adminFilterUsersByStatus('Pending');
          setRows(list.map(mapUser));
        }
      } catch (e) {
        // ignore; keep current view
      }
    })();
  }, [tab, isReady, user]);

  if (loading || !isReady) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        {/* <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetPage();
            }}
            placeholder="SEARCH"
            className="h-9 w-56 rounded-full border px-4 text-sm"
          />
          <button
            className="h-9 rounded-full px-4 text-sm text-white"
            style={{ backgroundColor: GREEN }}
          >
            APPROVE ACCOUNT
          </button>
        </div> */}
      </header>

      {/* Tabs */}
      <div className="mt-5 flex flex-wrap gap-3">
        {([
          { id: "all", label: "All Positions" },
          { id: "approved", label: "Approved" },
          { id: "rejected", label: "Rejected" },
          { id: "pending", label: "Pending" },
        ] as { id: Tab; label: string }[]).map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                resetPage();
              }}
              className={`rounded-full px-4 py-2 text-sm border ${
                active ? "text-white" : "hover:bg-gray-50"
              }`}
              style={{
                backgroundColor: active ? GREEN : "white",
                borderColor: active ? GREEN : "#e5e7eb",
              }}
            >
              {t.label}
            </button>
          );
        })}

        {/* Role filter */}
        <div className="ml-auto flex items-center gap-2 text-sm text-gray-600">
          <span>Select Role</span>
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value as any);
              resetPage();
            }}
            className="rounded-md border px-2 py-1"
          >
            <option>All</option>
            <option>Student</option>
            <option>Company</option>
            <option>Professor</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-hidden rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead style={{ backgroundColor: GREEN }} className="text-white">
            <tr className="[&>th]:px-3 [&>th]:py-3 [&>th]:text-left">
              <th className="w-48">Username</th>
              <th className="w-32">Role</th>
              <th className="w-[26rem]">Email</th>
              <th className="w-40">Date Registered</th>
              <th className="w-48">Status</th>
            </tr>
          </thead>
          <tbody className="[&>tr:nth-child(even)]:bg-gray-50">
            {current.map((r) => (
              <tr key={(r.id ?? r.email) + r.username} className="[&>td]:px-3 [&>td]:py-3">
                <td className="font-medium">{r.username}</td>
                <td>{r.role}</td>
                <td className="text-gray-700">{r.email}</td>
                <td>
                  <span className="inline-flex items-center rounded-md border bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                    {r.dateRegistered}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <StatusDropdown
                      value={r.status}
                      onChange={(s) => handleChangeStatus(r.id, s)}
                    />
                    {typeof r.id !== 'number' && (
                      <span className="text-[11px] text-gray-400">(id unavailable)</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {current.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-gray-500">
                  No results.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-3 flex items-center justify-end gap-1 text-sm">
        <button
          className="rounded-md px-3 py-1 hover:bg-gray-100 disabled:opacity-50"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => setPage(n)}
            className={`rounded-md px-2 py-1 ${
              page === n ? "font-semibold underline" : "hover:bg-gray-100"
            }`}
          >
            {n}
          </button>
        ))}
        <button
          className="rounded-md px-3 py-1 hover:bg-gray-100 disabled:opacity-50"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        >
          Next
        </button>
      </div>
    </main>
  );
}
