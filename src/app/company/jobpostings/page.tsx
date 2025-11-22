"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import EditJobModal, { EditableJob } from "@/components/EditJobModal";
import { buildInit, API_BASE } from "@/api/base";
import { useAuth } from "@/context/AuthContext";
import notify from "@/lib/toast";
import LoadingOverlay from "@/components/LoadingOverlay";

const BASE_URL = API_BASE;
const API_URL_BASE = `${BASE_URL}/api/company/job-postings`;
const API_URL_GET_ALL = `${API_URL_BASE}/all`;

async function fetchAuthedJson(url: string, init: RequestInit = {}) {
  const res = await fetch(url, buildInit({ credentials: "include", ...init }));
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${text}`);
  }
  return res.json();
}

function formatThaiDate(dateStr?: string) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isReady } = useAuth();
  const isCompany = useMemo(
    () => (user?.role || "").toLowerCase().includes("company"),
    [user]
  );

  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [creatingJob, setCreatingJob] = useState(false);

  // CREATE FORM STATES
  const [cTitle, setCTitle] = useState("");
  const [cPosition, setCPosition] = useState("");
  const [cDetails, setCDetails] = useState("");
  const [cPositionsAvailable, setCPositionsAvailable] = useState<number | "">("");
  const [cJobType, setCJobType] = useState("");
  const [cLocation, setCLocation] = useState("");
  const [cSalaryMin, setCSalaryMin] = useState<string>("");
  const [cSalaryMax, setCSalaryMax] = useState<string>("");
  const [cWorkType, setCWorkType] = useState<string>("");
  const [cExpiredAt, setCExpiredAt] = useState<string>("");

  function toBackendJobType(label?: string): string | undefined {
    if (!label) return undefined;
    const t = label.replace(/\s+/g, "").toLowerCase();
    if (t.includes("full")) return "FullTime";
    if (t.includes("part")) return "PartTime";
    if (t.includes("intern")) return "Internship";
    if (t.includes("contract")) return "Contract";
    return label;
  }

  /* ---------------------------------
     LOAD JOBS
  ---------------------------------- */
  useEffect(() => {
    if (!isReady) return;
    if (!isCompany) {
      router.replace("/");
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const headers: HeadersInit = user?.access_token
          ? { Authorization: `Bearer ${user.access_token}` }
          : {};

        const data = await fetchAuthedJson(API_URL_GET_ALL, {
          method: "GET",
          headers,
        });

        setJobs(data.data || data || []);
      } catch (err) {
        console.error("Failed to fetch jobs:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isReady, isCompany, router]);

  /* ---------------------------------
     CREATE JOB
  ---------------------------------- */
  const handleAddJob = async (job: any) => {
    setCreatingJob(true);
    try {
      const body = {
        job_title: job.title.trim() || job.position.trim(),
        description: job.details,
        location: job.location || "",
        work_place: job.workType || undefined,
        minimum_expected_salary: job.minimum_expected_salary ?? undefined,
        maximum_expected_salary: job.maximum_expected_salary ?? undefined,
        expired_at: job.expired_at || undefined,
        jobType: toBackendJobType(job.jobType),
        position: job.position,
        available_position: job.positionsAvailable,
      };

      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(user?.access_token ? { Authorization: `Bearer ${user.access_token}` } : {}),
      };

      const data = await fetchAuthedJson(API_URL_BASE, {
        method: "POST",
        body: JSON.stringify(body),
        headers,
      });

      const newJob = data.data || data;
      setJobs((prev) => [newJob, ...prev]);

      // reset form
      setCTitle("");
      setCPosition("");
      setCDetails("");
      setCPositionsAvailable("");
      setCJobType("");
      setCLocation("");
      setCSalaryMin("");
      setCSalaryMax("");
      setCWorkType("");
      setCExpiredAt("");

      notify.success("Job posted successfully.");
    } catch (err) {
      console.error("Failed to add job:", err);
      notify.error("Failed to add job posting.");
    } finally {
      setCreatingJob(false);
    }
  };

  /* ---------------------------------
     UPDATE (EDIT)
  ---------------------------------- */
  const handleSaveEdit = async (updated: EditableJob) => {
    if (editIndex === null) return;
    const job = jobs[editIndex];

    try {
      const body = {
        job_title: updated.title.trim() || updated.position.trim(),
        description: updated.details,
        location: updated.location || job.location,
        work_place: updated.workType || job.work_place,
        minimum_expected_salary:
          updated.minimum_expected_salary ?? job.minimum_expected_salary,
        maximum_expected_salary:
          updated.maximum_expected_salary ?? job.maximum_expected_salary,
        expired_at: updated.expired_at || job.expired_at,
        jobType: toBackendJobType(updated.jobType),
        position: updated.position,
        available_position: updated.positionsAvailable,
      };

      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(user?.access_token ? { Authorization: `Bearer ${user.access_token}` } : {}),
      };

      const data = await fetchAuthedJson(`${API_URL_BASE}/${job.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(body),
      });

      const updatedJob = data.data || data;

      setJobs((prev) => prev.map((j, idx) => (idx === editIndex ? updatedJob : j)));

      closeEdit();
      notify.success("Job updated successfully.");
    } catch (err) {
      console.error("Failed to update job:", err);
      notify.error("Failed to update job posting.");
    }
  };

  const openEdit = (index: number) => {
    setEditIndex(index);
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditIndex(null);
  };

  const editInitial: EditableJob | null =
    editIndex !== null
      ? {
          title: jobs[editIndex].job_title || jobs[editIndex].position || "",
          position: jobs[editIndex].position ?? "",
          jobType: jobs[editIndex].jobType ?? "",
          details: jobs[editIndex].description ?? "",
          positionsAvailable: Number(jobs[editIndex].available_position ?? 1),
          location: jobs[editIndex].location ?? "",
          minimum_expected_salary: jobs[editIndex].minimum_expected_salary,
          maximum_expected_salary: jobs[editIndex].maximum_expected_salary,
          workType: jobs[editIndex].work_place ?? "",
          expired_at: jobs[editIndex].expired_at
            ? String(jobs[editIndex].expired_at).slice(0, 10)
            : "",
        }
      : null;

  /* ---------------------------------
     CREATE FORM VALIDATION
  ---------------------------------- */
  const salaryMinValue = cSalaryMin === "" ? null : Number(cSalaryMin);
  const salaryMaxValue = cSalaryMax === "" ? null : Number(cSalaryMax);
  const salaryNotPositive =
    (salaryMinValue !== null && salaryMinValue <= 0) ||
    (salaryMaxValue !== null && salaryMaxValue <= 0);
  const salaryOrderInvalid =
    salaryMinValue !== null &&
    salaryMaxValue !== null &&
    salaryMinValue >= salaryMaxValue;
  const salaryErrorMessage =
    salaryNotPositive
      ? "Salary must be greater than zero."
      : salaryOrderInvalid
      ? "Minimum salary must be lower than maximum salary."
      : "";

  const canCreate = Boolean(
    cTitle &&
      cPosition &&
      cDetails &&
      cPositionsAvailable &&
      cJobType &&
      cLocation &&
      cWorkType &&
      salaryMinValue !== null &&
      salaryMaxValue !== null &&
      !salaryNotPositive &&
      !salaryOrderInvalid
  );

  const createSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;

    handleAddJob({
      title: cTitle,
      position: cPosition,
      details: cDetails,
      positionsAvailable: Number(cPositionsAvailable),
      jobType: cJobType,
      location: cLocation,
      minimum_expected_salary: Number(cSalaryMin),
      maximum_expected_salary: Number(cSalaryMax),
      workType: cWorkType,
      expired_at: cExpiredAt || null,
    });
  };

  /* ---------------------------------
     DELETE JOB
  ---------------------------------- */
  const handleDelete = async (id: any) => {
    try {
      const headers: HeadersInit = user?.access_token
        ? { Authorization: `Bearer ${user.access_token}` }
        : {};

      await fetchAuthedJson(`${API_URL_BASE}/${id}`, {
        method: "DELETE",
        headers,
      });

      setJobs((prev) => prev.filter((j) => j.id !== id));
    } catch (err) {
      console.error("Failed to delete job:", err);
      alert("Failed to delete job posting.");
    }
  };

  /* ---------------------------------
     UI RENDER
  ---------------------------------- */
  return (
    <div className="mx-auto max-w-6xl p-6">
      {creatingJob && (
        <LoadingOverlay
          title="Publishing job posting…"
          subtitle="Sit tight while we save and share your job listing."
        />
      )}

      <h1 className="mb-6 text-2xl font-bold">Job Openings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* CREATE FORM */}
        <form onSubmit={createSubmit} className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="grid gap-3">
            {/* Position + Title */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={cPosition}
                onChange={(e) => setCPosition(e.target.value)}
                placeholder="Position (e.g., Backend Developer)"
                className="w-1/2 rounded-md border px-3 py-2 text-sm focus:ring-black"
              />
              <input
                type="text"
                value={cTitle}
                onChange={(e) => setCTitle(e.target.value)}
                placeholder="Job Title"
                className="flex-1 rounded-md border px-3 py-2 text-sm focus:ring-black"
              />
            </div>

            {/* Description */}
            <textarea
              value={cDetails}
              onChange={(e) => setCDetails(e.target.value)}
              placeholder="Enter Job Description..."
              className="h-32 w-full rounded-md border px-3 py-2 text-sm focus:ring-black"
            />

            <div className="text-xs text-gray-500">
              Description supports basic Markdown.
            </div>

            {/* Positions Available */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Positions Available</label>
              <input
                type="number"
                min={1}
                className="w-24 rounded-md border px-3 py-2 text-sm text-center focus:ring-black"
                value={cPositionsAvailable}
                onChange={(e) => setCPositionsAvailable(e.target.value ? Number(e.target.value) : "")}
              />
            </div>

            {/* Job Type */}
            <div className="grid gap-1">
              <label className="text-sm font-medium text-gray-700">Job Type</label>
              <select
                className="rounded-md border px-3 py-2 text-sm focus:ring-black"
                value={cJobType}
                onChange={(e) => setCJobType(e.target.value)}
              >
                <option value="">Select type</option>
                <option>Full Time</option>
                <option>Part Time</option>
                <option>Internship</option>
                <option>Contract</option>
              </select>
            </div>

            {/* Location + Salary */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="grid gap-1">
                <label className="text-sm font-medium text-gray-700">Location</label>
                <input
                  value={cLocation}
                  onChange={(e) => setCLocation(e.target.value)}
                  placeholder="City / Remote"
                  className="rounded-md border px-3 py-2 text-sm focus:ring-black"
                />
              </div>

              <div className="grid gap-1">
                <label className="text-sm font-medium text-gray-700">Salary (Min – Max)</label>
                <div className="flex items-center gap-2">
                  <input
                    value={cSalaryMin}
                    onChange={(e) => setCSalaryMin(e.target.value.replace(/\D+/g, ""))}
                    placeholder="18000"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="w-28 rounded-md border px-3 py-2 text-sm focus:ring-black"
                    aria-invalid={Boolean(salaryErrorMessage)}
                  />
                  <span>-</span>
                  <input
                    value={cSalaryMax}
                    onChange={(e) => setCSalaryMax(e.target.value.replace(/\D+/g, ""))}
                    placeholder="30000"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="w-28 rounded-md border px-3 py-2 text-sm focus:ring-black"
                    aria-invalid={Boolean(salaryErrorMessage)}
                  />
                </div>
                {salaryErrorMessage && (
                  <p className="text-xs text-red-600 mt-1">{salaryErrorMessage}</p>
                )}
              </div>
            </div>

            {/* Workplace + Expired Date */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="grid gap-1">
                <label className="text-sm font-medium text-gray-700">Workplace</label>
                <select
                  value={cWorkType}
                  onChange={(e) => setCWorkType(e.target.value)}
                  className="rounded-md border px-3 py-2 text-sm focus:ring-black"
                >
                  <option value="">Select</option>
                  <option value="OnSite">On-site</option>
                  <option value="Online">Online</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              <div className="grid gap-1">
                <label className="text-sm font-medium text-gray-700">
                  Expiration Date <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="date"
                  value={cExpiredAt}
                  onChange={(e) => setCExpiredAt(e.target.value)}
                  className="rounded-md border px-3 py-2 text-sm focus:ring-black"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => {
                  setCTitle("");
                  setCPosition("");
                  setCDetails("");
                  setCPositionsAvailable("");
                  setCJobType("");
                  setCLocation("");
                  setCSalaryMin("");
                  setCSalaryMax("");
                  setCWorkType("");
                  setCExpiredAt("");
                }}
                className="rounded-full border px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                disabled={!canCreate || creatingJob}
                className="rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: "#5D9252" }}
              >
                {creatingJob ? "Posting…" : "Create Job"}
              </button>
            </div>
          </div>
        </form>

        {/* Job List */}
        <div className="space-y-4">
          {loading ? (
            <p className="text-gray-500">Loading jobs...</p>
          ) : jobs.length === 0 ? (
            <p className="text-gray-500">No job postings yet.</p>
          ) : (
            jobs.map((job: any, i: number) => (
              <div key={job.id || i} className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="flex justify-between">
                  
                  {/* LEFT */}
                  <div className="flex-1 text-left">
                    <div className="text-lg font-semibold">
                      {job.job_title || job.position || "Untitled"}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      {job.jobType && (
                        <span className="rounded-full border px-2 py-0.5">{job.jobType}</span>
                      )}
                      {job.work_place && (
                        <span className="rounded-full border px-2 py-0.5">{job.work_place}</span>
                      )}
                    </div>

                    <div className="mt-2 text-sm text-gray-700">
                      Positions: {job.available_position ?? 1}
                    </div>

                    {(job.minimum_expected_salary || job.maximum_expected_salary) && (
                      <div className="text-sm text-gray-700">
                        Expected Salary: {job.minimum_expected_salary ?? "-"} –{" "}
                        {job.maximum_expected_salary ?? "-"}
                      </div>
                    )}

                    <div className="mt-2 text-xs text-gray-500">
                      {job.created_at && (
                        <div>Posted: {formatThaiDate(job.created_at)}</div>
                      )}

                      {job.expired_at && (
                        <div className="text-red-600 font-medium">
                          Expires: {formatThaiDate(job.expired_at)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RIGHT BUTTONS */}
                  <div className="flex flex-col items-end justify-between ml-4">
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => openEdit(i)}
                        className="rounded-full border px-3 py-1 text-sm hover:bg-gray-100"
                        style={{ borderColor: "#5D9252", color: "#2c4d2a" }}
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => job.id && handleDelete(job.id)}
                        className="rounded-full border px-3 py-1 text-sm hover:bg-red-50 text-red-700 border-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* EDIT MODAL */}
      <EditJobModal
        isOpen={editOpen}
        onClose={closeEdit}
        initial={editInitial}
        onSave={handleSaveEdit}
        brandColor="#5D9252"
      />
    </div>
  );
}
