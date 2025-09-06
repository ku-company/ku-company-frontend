"use client";

import { useMemo, useState } from "react";

// ---- Types ----
type Status = "approved" | "rejected" | "pending";
type Role = "Student" | "Company" | "Professor";

type Row = {
  id: string;
  username: string;
  role: Role;
  email: string;
  dateRegistered: string; // display string
  status: Status;
};

// ---- Mock data (replace with API later) ----
const INITIAL_ROWS: Row[] = [
  { id: "1", username: "JohnSmith", role: "Student", email: "johndoe@ku.th", dateRegistered: "24 Aug 2025", status: "approved" },
  { id: "2", username: "Jenny127", role: "Student", email: "jennita@gmail.com", dateRegistered: "29 Aug 2025", status: "rejected" },
  { id: "3", username: "Samantha", role: "Student", email: "samantaa@ku.th", dateRegistered: "29 Aug 2025", status: "approved" },
  { id: "4", username: "Jennifer", role: "Student", email: "jenista@ku.th", dateRegistered: "30 Aug 2025", status: "pending" },
  { id: "5", username: "Alexis1234", role: "Student", email: "alexiswang@ku.th", dateRegistered: "30 Aug 2025", status: "pending" },
  { id: "6", username: "SophiaW", role: "Company", email: "sophia.work@gmail.com", dateRegistered: "30 Aug 2025", status: "pending" },
  { id: "7", username: "Daniel99", role: "Professor", email: "daniel_lee99@ku.th", dateRegistered: "31 Aug 2025", status: "pending" },
  { id: "8", username: "Mint", role: "Student", email: "mint@ku.th", dateRegistered: "31 Aug 2025", status: "approved" },
  { id: "9", username: "Beam", role: "Company", email: "beam@company.com", dateRegistered: "31 Aug 2025", status: "rejected" },
];

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
  // main data state (so dropdown updates persist)
  const [rows, setRows] = useState<Row[]>(INITIAL_ROWS);

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

  // handlers
  const resetPage = () => setPage(1);
  const handleChangeStatus = (id: string, status: Status) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    // TODO: call your API to persist the change
  };

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
              <tr key={r.id} className="[&>td]:px-3 [&>td]:py-3">
                <td className="font-medium">{r.username}</td>
                <td>{r.role}</td>
                <td className="text-gray-700">{r.email}</td>
                <td>
                  <span className="inline-flex items-center rounded-md border bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                    {r.dateRegistered}
                  </span>
                </td>
                <td>
                  <StatusDropdown
                    value={r.status}
                    onChange={(s) => handleChangeStatus(r.id, s)}
                  />
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
