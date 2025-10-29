// "use client";

// import { useState } from "react";

// export default function JobPostForm({ onSubmit }: { onSubmit: (data: any) => void }) {
//   const [position, setPosition] = useState("");
//   const [title, setTitle] = useState("");
//   const [details, setDetails] = useState("");
//   const [positionsAvailable, setPositionsAvailable] = useState<number | "">("");

//   function handleSubmit(e: React.FormEvent) {
//     e.preventDefault();

//     if (!position || !title || !details || !positionsAvailable) return;

//     onSubmit({
//       position,
//       title,
//       details,
//       positionsAvailable,
//     });

//     // Reset form
//     setPosition("");
//     setTitle("");
//     setDetails("");
//     setPositionsAvailable("");
//   }

//   const isFormValid = position && title && details && positionsAvailable;

//   return (
//     <form
//       onSubmit={handleSubmit}
//       className="border border-midgreen-500 rounded-md p-4 space-y-4 bg-white"
//     >
//       {/* Position selector + Title */}
//       <div className="flex items-center border rounded-md overflow-hidden">
//         <select
//           value={position}
//           onChange={(e) => {
//             const selected = e.target.value;
//             setPosition(selected);
//             // Auto-fill the title when choosing a position
//             if (selected) {
//               setTitle(selected);
//             }
//           }}
//           className="px-3 py-2 border-r focus:outline-none"
//         >
//           <option value="">Choose Position</option>
//           <option value="Machine Learning Engineer">Machine Learning Engineer</option>
//           <option value="Software Engineer">Software Engineer</option>
//           <option value="Data Scientist">Data Scientist</option>
//         </select>
//         <input
//           type="text"
//           placeholder="Enter job title"
//           className="flex-1 px-3 py-2 focus:outline-none"
//           value={title}
//           onChange={(e) => setTitle(e.target.value)}
//         />
//       </div>

//       {/* Details */}
//       <textarea
//         placeholder="More Details here......."
//         className="w-full rounded-md border px-3 py-2 focus:outline-none h-28"
//         value={details}
//         onChange={(e) => setDetails(e.target.value)}
//       />

//       {/* Number of positions + Post button */}
//       <div className="flex items-center justify-between">
//         <label className="text-sm font-medium text-gray-800">
//           Number of Positions Available
//         </label>
//         <div className="flex items-center gap-3">
//           <input
//             type="number"
//             min={1}
//             className="w-20 rounded-md border px-3 py-1 focus:outline-none"
//             value={positionsAvailable}
//             onChange={(e) =>
//               setPositionsAvailable(e.target.value ? Number(e.target.value) : "")
//             }
//           />
//           <button
//             type="submit"
//             disabled={!isFormValid}
//             className={`px-4 py-2 rounded-md font-semibold transition ${
//               isFormValid
//                 ? "bg-midgreen text-white hover:bg-green-700"
//                 : "bg-gray-300 text-gray-500 cursor-not-allowed"
//             }`}
//           >
//             Post
//           </button>
//         </div>
//       </div>
//     </form>
//   );
// }
"use client";

import { useState } from "react";
import { Select } from "@/ui/select";
import { Textarea } from "@/ui/textarea";
import Button from "@/ui/button";

export default function JobPostForm({ onSubmit }: { onSubmit: (job: any) => void }) {
  // enums           Prisma (                     )
  const jobTypes = [
    { label: "Full Time", value: "FullTime" },
    { label: "Part Time", value: "PartTime" },
    { label: "Internship", value: "Internship" },
    { label: "Contract", value: "Contract" },
  ];

  const positions = [
    { label: "Backend Developer", value: "Backend_Developer" },
    { label: "Frontend Developer", value: "Frontend_Developer" },
    { label: "Fullstack Developer", value: "Fullstack_Developer" },
  ];

  const [jobType, setJobType] = useState("Internship");
  const [position, setPosition] = useState("Backend_Developer");
  const [details, setDetails] = useState("");
  const [positionsAvailable, setPositionsAvailable] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      jobType,               //                    enum           Prisma
      title: position,       //                    enum           Prisma
      details,
      positionsAvailable,
    });
    setDetails("");
    setPositionsAvailable(1);
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border p-5 shadow-sm bg-white">
      <div className="flex flex-col gap-3 mb-3">
        {/* Job Type */}
        <div>
          <label className="block text-sm font-semibold mb-1">Job Type</label>
          <Select value={jobType} onChange={(e) => setJobType(e.target.value)}>
            {jobTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Position */}
        <div>
          <label className="block text-sm font-semibold mb-1">Position</label>
          <Select value={position} onChange={(e) => setPosition(e.target.value)}>
            {positions.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold mb-1">Description</label>
          <Textarea placeholder="More Details here..." rows={4} value={details} onChange={(e) => setDetails(e.target.value)} required />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold">
          Number of Positions Available
        </label>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            min={1}
            className="border rounded-md px-2 py-1 w-20 text-center"
            value={positionsAvailable}
            onChange={(e) => setPositionsAvailable(Number(e.target.value))}
          />
          <Button type="submit">Post</Button>
        </div>
      </div>
    </form>
  );
}
