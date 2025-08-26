import JobCard from "../components/jobcard";
import { Job } from "../types/job";

async function getJobs(): Promise<Job[]> {
  const res = await fetch("http://localhost:8000/api/mock/findjob", {
    cache: "no-store", 
  });
  if (!res.ok) throw new Error("Failed to fetch jobs");
  return res.json();
}

export default async function HomePage() {
  const jobs = await getJobs();

  return (
    <main className="p-4 space-y-4">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </main>
  );
}