import Hero from "../../components/home";
import CompanyCard from "../../components/CompanyCard";
import JobCard from "../../components/jobcard";
import type { Job } from "../../types/job";

const companies = [
  { id: "tcc", name: "TCC TECHNOLOGY", number: "01", logo: "/tcc.svg", accent: "bg-emerald-50" },
  { id: "agoda", name: "AGODA", number: "02", logo: "/agoda.svg", accent: "bg-sky-50" },
  { id: "lineman", name: "LINEMAN", number: "03", logo: "/lineman.svg", accent: "bg-green-50" },
];

export default function Homepage() {
  return (
    <main className="pb-16">
      <Hero />
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-semibold">Find your next employer</h2>
          <a href="/companies" className="text-xs text-gray-500 hover:text-gray-700">See more...</a>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {companies.map((c) => (
            <CompanyCard key={c.id} company={c} />
          ))}
        </div>
      </section>

      <RecentJobsSection />
    </main>
  );
}

function RecentJobsSection() {
  const jobs: Job[] = [
    {
      id: "job-1",
      position: "Full Stack Developer",
      company: "SCB",
      location: "Hybrid",
      type: "Fulltime",
      logo: "/tcc.svg",
      posteddayagos: 2,
      description: "React, Node.js, Cloud",
    },
    {
      id: "job-2",
      position: "Frontend Developer",
      company: "Agoda",
      location: "Hybrid",
      type: "Fulltime",
      logo: "/agoda.svg",
      posteddayagos: 5,
      description: "Next.js, TailwindCSS, TypeScript",
    },
    {
      id: "job-3",
      position: "Business Analyst",
      company: "LineMan",
      location: "Onsite",
      type: "Fulltime",
      logo: "/lineman.svg",
      posteddayagos: 7,
      description: "SQL, Requirements, Communication",
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-10">
      <h2 className="text-xl sm:text-2xl font-semibold">Recent Job Openings</h2>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {jobs.map((j) => (
          <JobCard key={j.id} job={j} />
        ))}
      </div>
    </section>
  );
}
