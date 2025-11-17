import Hero from "@/components/home";
import JobCard from "@/components/jobcard";
import { fetchTopCompanies, fetchTopJobPostings, type TopCompany } from "@/api/home";
import type { Job } from "@/types/job";
import { cookies } from "next/headers";
import CompanyCarousel from "@/components/CompanyCarousel";
import CompanyHomeRedirect from "@/components/CompanyHomeRedirect";


async function getHomeData(cookieHeader?: string) {
  const [companiesRes, jobsRes] = await Promise.all([
    fetchTopCompanies({ cookieHeader, limit: 9 }),
    fetchTopJobPostings({ cookieHeader, limit: 6 }),
  ]);

  const companies = companiesRes.data;
  const jobs = jobsRes.data;
  const useFallbackCompanies = companiesRes.fallback || companies.length === 0;
  const useFallbackJobs = jobsRes.fallback || jobs.length === 0;

  return { companies, jobs, useFallbackCompanies, useFallbackJobs };
}

export default async function Homepage() {
  const cookieStore = await cookies();
  const serialized = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  const cookieHeader = serialized.length ? serialized : undefined;
  const { companies, jobs, useFallbackCompanies, useFallbackJobs } = await getHomeData(cookieHeader);

  return (
    <>
      <CompanyHomeRedirect />
      <main className="pb-16">
        <Hero />
        <TopCompaniesSection companies={companies} showPlaceholder={useFallbackCompanies} />
        <RecentJobsSection jobs={jobs} showPlaceholder={useFallbackJobs} />
      </main>
    </>
  );
}

function TopCompaniesSection({ companies, showPlaceholder }: { companies: TopCompany[]; showPlaceholder: boolean }) {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-10">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-semibold">Find your next employer</h2>
      </div>
      {showPlaceholder && companies.length === 0 && (
        <p className="mt-6 text-sm text-gray-600">There are no companies to show yet.</p>
      )}
      {companies.length > 0 && (
        <div className="mt-6">
          <CompanyCarousel companies={companies} />
        </div>
      )}
    </section>
  );
}

function RecentJobsSection({ jobs, showPlaceholder }: { jobs: Job[]; showPlaceholder: boolean }) {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-10">
      <h2 className="text-xl sm:text-2xl font-semibold">Recent Job Openings</h2>
      {showPlaceholder && jobs.length === 0 && (
        <p className="mt-6 text-sm text-gray-600">There are no job postings yet.</p>
      )}
      {jobs.length > 0 && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} href="/find-job" />
          ))}
        </div>
      )}
    </section>
  );
}
