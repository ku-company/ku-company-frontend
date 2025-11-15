import Hero from "@/components/home";
import JobCard from "@/components/jobcard";
import { fetchTopCompanies, fetchTopJobPostings, type TopCompany } from "@/api/home";
import type { Job } from "@/types/job";
import { cookies } from "next/headers";
import CompanyCarousel from "@/components/CompanyCarousel";

const FALLBACK_COMPANIES: TopCompany[] = [
  {
    id: -1,
    rank: 1,
    user_id: null,
    company_name: "TCC TECHNOLOGY",
    description: "Enterprise digital infrastructure partner for SEA enterprises.",
    location: "Bangkok",
    country: "Thailand",
    job_post_count: 24,
    profile_image_url: "/tcc.svg",
  },
  {
    id: -2,
    rank: 2,
    user_id: null,
    company_name: "AGODA",
    description: "Leading travel platform that ships weekly to millions of travelers.",
    location: "Bangkok",
    country: "Thailand",
    job_post_count: 18,
    profile_image_url: "/agoda.svg",
  },
  {
    id: -3,
    rank: 3,
    user_id: null,
    company_name: "LINEMAN Wongnai",
    description: "Thailand's super-app powering food, ride and merchant services.",
    location: "Bangkok",
    country: "Thailand",
    job_post_count: 15,
    profile_image_url: "/lineman.svg",
  },
];

const FALLBACK_JOBS: Job[] = [
  {
    id: -101,
    job_title: "Full Stack Developer",
    position: "Software Engineer",
    description: "React, Node.js, Cloud-native services, CI/CD",
    jobType: "FullTime",
    available_position: 4,
    created_at: new Date().toISOString(),
    work_place: "Hybrid",
    minimum_expected_salary: 60000,
    maximum_expected_salary: 90000,
    expired_at: null,
    status: "Active",
    company_id: -1,
    company_name: "SCB TechX",
    company_location: "Bangkok",
    company_user_id: null,
    company_profile_image: "/tcc.svg",
    posted_ago: "2 days ago",
  },
  {
    id: -102,
    job_title: "Frontend Developer",
    position: "Product Engineer",
    description: "Next.js, TailwindCSS, Analytics tools",
    jobType: "FullTime",
    available_position: 2,
    created_at: new Date().toISOString(),
    work_place: "Hybrid",
    minimum_expected_salary: 50000,
    maximum_expected_salary: 80000,
    expired_at: null,
    status: "Active",
    company_id: -2,
    company_name: "Agoda",
    company_location: "Bangkok",
    company_user_id: null,
    company_profile_image: "/agoda.svg",
    posted_ago: "5 days ago",
  },
  {
    id: -103,
    job_title: "Business Analyst",
    position: "Business Analyst",
    description: "SQL, Requirements, Communication, Agile ceremonies",
    jobType: "FullTime",
    available_position: 3,
    created_at: new Date().toISOString(),
    work_place: "OnSite",
    minimum_expected_salary: 45000,
    maximum_expected_salary: 70000,
    expired_at: null,
    status: "Active",
    company_id: -3,
    company_name: "LineMan",
    company_location: "Bangkok",
    company_user_id: null,
    company_profile_image: "/lineman.svg",
    posted_ago: "1 week ago",
  },
];

async function getHomeData(cookieHeader?: string) {
  const [companiesRes, jobsRes] = await Promise.all([
    fetchTopCompanies({ cookieHeader, limit: 9 }),
    fetchTopJobPostings({ cookieHeader, limit: 6 }),
  ]);

  let companies = companiesRes.data.length ? companiesRes.data : FALLBACK_COMPANIES;
  let jobs = jobsRes.data.length ? jobsRes.data : FALLBACK_JOBS;

  const useFallbackCompanies = companiesRes.fallback || companiesRes.data.length === 0;
  const useFallbackJobs = jobsRes.fallback || jobsRes.data.length === 0;

  return { companies, jobs, useFallbackCompanies, useFallbackJobs };
}

export default async function Homepage() {
  const cookieHeader = cookies().toString() || undefined;
  const { companies, jobs, useFallbackCompanies, useFallbackJobs } = await getHomeData(cookieHeader);

  return (
    <main className="pb-16">
      <Hero />
      <TopCompaniesSection companies={companies} showPlaceholder={useFallbackCompanies} />
      <RecentJobsSection jobs={jobs} showPlaceholder={useFallbackJobs} />
    </main>
  );
}

function TopCompaniesSection({ companies, showPlaceholder }: { companies: TopCompany[]; showPlaceholder: boolean }) {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-10">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-semibold">Find your next employer</h2>
      </div>
      {showPlaceholder && (
        <p className="mt-6 text-sm text-gray-600">Showing featured companies while we wait for live job data.</p>
      )}
      <div className="mt-6">
        <CompanyCarousel companies={companies} />
      </div>
    </section>
  );
}

function RecentJobsSection({ jobs, showPlaceholder }: { jobs: Job[]; showPlaceholder: boolean }) {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-10">
      <h2 className="text-xl sm:text-2xl font-semibold">Recent Job Openings</h2>
      {showPlaceholder && (
        <p className="mt-6 text-sm text-gray-600">Preview roles from featured employers. Live postings will appear once companies publish jobs.</p>
      )}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} href="/find-job" />
        ))}
      </div>
    </section>
  );
}
