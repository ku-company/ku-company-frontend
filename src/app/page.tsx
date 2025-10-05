// // import JobCard from "../components/jobcard";
// // import { Job } from "../types/job";

// // async function getJobs(): Promise<Job[]> {
// //   const res = await fetch("http://localhost:8000/api/mock/findjob", {
// //     cache: "no-store", 
// //   });
// //   if (!res.ok) throw new Error("Failed to fetch jobs");
// //   return res.json();
// // }

// // export default async function HomePage() {
// //   const jobs = await getJobs();

// //   return (
// //     <main className="p-4 space-y-4">
// //       {jobs.map((job) => (
// //         <JobCard key={job.id} job={job} />
// //       ))}
// //     </main>
// //   );
// // }

// "use client";
// import { useEffect, useState } from "react";
// import JobCard from "../components/jobcard";
// import { Job } from "../types/job";

// export default function HomePage() {
//   const [jobs, setJobs] = useState<Job[]>([]);

//   useEffect(() => {
//     (async () => {
//       const res = await fetch("/api/jobs", { cache: "no-store" });
//       if (!res.ok) throw new Error("Failed to fetch jobs");
//       setJobs(await res.json());
//     })();
//   }, []);

//   return (
//     <main className="p-4 space-y-4">
//       {jobs.map((job) => (
//         <JobCard key={job.id} job={job} />
//       ))}
//     </main>
//   );
// }
"use client";
import { useEffect, useState } from "react";
import JobCard from "../components/jobcard";
import { Job } from "../types/job";

// ----- Mock Data -----
const MOCK_JOBS: Job[] = [
  {
    id: "scb-ml-eng",
    title: "Machine Learning Engineer",
    company: "Siam Commercial Bank Public Co., Ltd.",
    location: "Bangkok (Hybrid)",
    postedDaysAgo: 11,
    bullets: [
      "Design & Deploy ML Systems",
      "MLOps Setup & Optimization",
      "Collaborate widely with teams",
    ],
    category: "AI/ML",
  },
  {
    id: "30s-dev",
    title: "Full Stack Developer",
    company: "30 SECONDSTOFY (THAILAND) CO., LTD.",
    location: "Phra Khanong, Bangkok (Hybrid) ฿95,000 – 140,000",
    postedDaysAgo: 24,
    bullets: ["Hybrid working environment.", "Challenging tasks."],
    category: "Full-stack",
  },
];

export default function HomePage() {
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    (async () => {
      try {
        // 🔹 ถ้ามี backend จริง (เช่น Django 8000) ให้เปลี่ยน URL นี้
        const res = await fetch("http://localhost:8000/api/mock/findjob", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("API Error");
        const data = await res.json();
        setJobs(data);
      } catch (err) {
        console.warn("⚠️ ใช้ mock data แทนเพราะ API ไม่ตอบ:", err);
        setJobs(MOCK_JOBS);
      }
    })();
  }, []);

  return (
    <main className="p-4 space-y-4">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </main>
  );
}
