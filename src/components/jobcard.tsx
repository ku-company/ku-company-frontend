import { Job } from "../types/job";

interface JobCardProps {
  job: Job;
}

export default function JobCard({ job }: JobCardProps) {
  return (
    <div className="flex justify-between items-center border border-green-500 rounded-2xl p-4 bg-white shadow-sm">
      <div className="flex-1 pr-4">
        <h2 className="font-semibold text-black">{job.position}</h2>
        <p className="text-sm text-black">{job.company}</p>
        <p className="text-sm text-gray-600">{job.location}</p>
        <p className="text-xs text-gray-500">{job.posteddayagos} days ago</p>
        {job.description && (
          <ul className="list-disc list-inside mt-2 text-sm text-gray-700">
            {job.description.split(",").map((d, i) => (
              <li key={i}>{d.trim()}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center">
        {job.logo ? (
          <img
            src={job.logo}
            alt={job.company}
            className="w-14 h-14 object-contain"
          />
        ) : (
          <div className="w-14 h-14 flex items-center justify-center text-xs text-gray-500 border rounded">
            No Logo
          </div>
        )}
      </div>
    </div>
  );
}