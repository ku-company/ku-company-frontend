"use client";

import { useState } from "react";
import JobPostForm from "@/components/JobPostForm";
import EditJobModal, { EditableJob } from "@/components/EditJobModal";

export default function DashboardPage() {
  const [showForm, setShowForm] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);

  // Modal state
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const handleAddJob = (job: any) => {
    setJobs([job, ...jobs]);
    setShowForm(false);
  };

  const openEdit = (index: number) => {
    setEditIndex(index);
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditIndex(null);
  };

  const handleSaveEdit = async (updated: EditableJob) => {
    // Temporary behavior (no backend yet): just update local state
    if (editIndex === null) return;
    setJobs((prev) =>
      prev.map((j, i) => (i === editIndex ? { ...j, ...updated } : j))
    );

    // If you want to simulate an API call, you could wrap this in a setTimeout.

    closeEdit();
  };

  const editInitial: EditableJob | null =
    editIndex !== null
      ? {
          title: jobs[editIndex]?.title ?? "",
          position: jobs[editIndex]?.position ?? "",
          details: jobs[editIndex]?.details ?? "",
          positionsAvailable: Number(jobs[editIndex]?.positionsAvailable ?? 1),
        }
      : null;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Job Openings</h1>

      {/* Button to toggle form */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="rounded-md bg-midgreen px-4 py-2 font-semibold text-white transition hover:bg-green-700"
        >
          + Post a Job
        </button>
      )}

      {/* Job Post Form */}
      {showForm && (
        <div className="mt-4">
          <JobPostForm onSubmit={handleAddJob} />
        </div>
      )}

      {/* Job Listings */}
      <div className="mt-6 space-y-4">
        {jobs.length === 0 ? (
          <p className="text-gray-500">No job postings yet.</p>
        ) : (
          jobs.map((job, i) => (
            <div
              key={i}
              className="bg-white rounded-md border p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{job.title}</h2>
                  <p className="text-sm text-gray-600">{job.position}</p>
                </div>
                <button
                  onClick={() => openEdit(i)}
                  className="rounded-full border px-3 py-1 text-sm font-medium hover:bg-gray-50"
                  title="Edit job"
                >
                  Edit
                </button>
              </div>

              <p className="mt-2 text-gray-800">{job.details}</p>
              <p className="mt-1 text-sm text-gray-600">
                Positions Available: {job.positionsAvailable}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
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
