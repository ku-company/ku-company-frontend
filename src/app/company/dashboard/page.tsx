"use client";

import { useState } from "react";
import JobPostForm from "@/components/JobPostForm";

export default function DashboardPage() {
  const [showForm, setShowForm] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);

  const handleAddJob = (job: any) => {
    setJobs([job, ...jobs]);
    setShowForm(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Job Openings</h1>

      {/* Button to toggle form */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="bg-midgreen text-white px-4 py-2 rounded-md font-semibold hover:bg-green-700 transition"
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
              className="border rounded-md p-4 shadow-sm bg-white"
            >
              <h2 className="text-lg font-semibold">{job.title}</h2>
              <p className="text-sm text-gray-600">{job.position}</p>
              <p className="mt-2 text-gray-800">{job.details}</p>
              <p className="mt-1 text-sm text-gray-600">
                Positions Available: {job.positionsAvailable}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
