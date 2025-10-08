export type Job = {
  id: number;
  title: string;
  company: string;
  location: string;
  description: string;
  createdAt: string;
  positions: number;
};

let jobs: Job[] = [
  {
    id: 1,
    title: "Machine Learning Engineer",
    company: "Siam Commercial Bank Public Co., Ltd.",
    location: "Bangkok (Hybrid)",
    description:
      "We are looking for a Machine Learning Engineer with experience in AI/ML pipelines.",
    createdAt: new Date().toISOString(),
    positions: 3,
  },
];

export async function fetchJobs(): Promise<Job[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(jobs), 500); // simulate network delay
  });
}

export async function createJob(job: Omit<Job, "id" | "createdAt">): Promise<Job> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newJob: Job = {
        id: jobs.length + 1,
        createdAt: new Date().toISOString(),
        ...job,
      };
      jobs = [newJob, ...jobs];
      resolve(newJob);
    }, 500);
  });
}
