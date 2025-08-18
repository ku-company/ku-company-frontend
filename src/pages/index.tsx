import { useEffect, useState } from "react";
import JobCard from "../components/jobcard";
import { Job } from "../types/job";

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    fetch("http://localhost:8000/api/mock/findjob")
      .then((res) => res.json())
      .then((data: Job[]) => setJobs(data));
  }, []);

  return (
    <main className="p-4 space-y-4">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </main>
  );
}
