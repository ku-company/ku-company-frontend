import Image from "next/image";
import Link from "next/link";

function PillHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center rounded-full border border-gray-300 bg-white px-3 py-1 text-sm font-semibold shadow-[inset_0_-2px_0_rgba(0,0,0,0.04)]">
      {children}
    </div>
  );
}

function CornerIcon({ title }: { title: string }) {
  return (
    <span
      title={title}
      className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-lg border bg-white text-gray-600 hover:bg-gray-50"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-80">
        <path
          d="M3 17.25V21h3.75L18.81 8.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}

function InfoRow({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid h-8 w-8 place-items-center rounded-full bg-gray-100 text-gray-700">
        {icon}
      </span>
      <div className="text-sm">
        <div className="text-gray-500">{label}</div>
        {href ? (
          <a href={href} className="font-medium text-gray-800 hover:underline">
            {value}
          </a>
        ) : (
          <div className="font-medium text-gray-800">{value}</div>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const GREEN = "#5b8f5b";

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid md:grid-cols-3 gap-6">
        {/* LEFT: Profile card */}
        <aside className="relative rounded-2xl border bg-white p-6 shadow-sm">
          <CornerIcon title="Edit profile" />
          <div className="flex flex-col items-center">
            <div className={`relative h-28 w-28 overflow-hidden rounded-full ring-4 ring-[${GREEN}]\/15`}>
              <Image
                src="/profile.png" 
                alt="Profile"
                fill
                className="object-cover"
              />
            </div>

            <h2 className={`mt-4 text-xl font-extrabold`} style={{ color: GREEN }}>
              Smith Samantha
            </h2>
            <p className="text-sm text-gray-600">Software Engineering Student</p>
          </div>

          <div className="mt-6 space-y-4">
            <InfoRow icon={<span className="text-xs">👤</span>} label="Username" value="Smith_op" />
            <InfoRow
              icon={<span className="text-xs">✉️</span>}
              label="Mail"
              value="jt23.97@gmail.com"
              href="mailto:jt23.97@gmail.com"
            />
            <InfoRow icon={<span className="text-xs">🎂</span>} label="Birthday" value="23 Dec 1997" />
          </div>
        </aside>

        {/* RIGHT: Summary + Work history */}
        <section className="md:col-span-2 space-y-6">
          {/* Personal Summary */}
          <div
            className={`relative rounded-2xl border bg-white p-6 shadow-sm`}
            style={{ borderColor: GREEN }}
          >
            <CornerIcon title="Edit summary" />
            <PillHeading>Personal Summary</PillHeading>
            <p className="mt-3 text-sm leading-6 text-gray-700">
              Results-driven software engineering student with a strong interest in data science and
              machine learning. Experienced in Python, SQL, and web development, with proven ability
              to deliver practical solutions for real-world problems. Passionate about learning new
              technologies and working in collaborative environments.
            </p>
          </div>

          {/* Work History */}
          <div
            className={`relative rounded-2xl border bg-white p-6 shadow-sm`}
            style={{ borderColor: GREEN }}
          >
            <CornerIcon title="Edit work history" />
            <PillHeading>Work History</PillHeading>

            <div className="mt-4 text-sm">
              <p className="font-semibold">
                Data Science Intern{" "}
                <span className="font-normal">— BrightWave Solutions Co., Ltd., Bangkok</span>
              </p>
              <ul className="mt-2 list-disc pl-5 space-y-1 text-gray-700">
                <li>June 2024 – November 2024</li>
                <li>
                  Developed a content-based recommendation system for the Employee Networking System
                  project.
                </li>
                <li>
                  Built a resume extractor tool to parse and format candidate information
                  automatically.
                </li>
              </ul>

              <div className="mt-3 flex items-center justify-between">
                <Link href="#" className="text-xs hover:underline" style={{ color: GREEN }}>
                  See More…
                </Link>

                {/* Upload resume button */}
                <button
                  className="inline-flex items-center gap-2 rounded-md border px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
                  title="Upload Resume"
                  style={{ borderColor: GREEN }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 20h14a1 1 0 0 0 1-1v-6h-2v5H6v-5H4v6a1 1 0 0 0 1 1zm7-16 5 5h-3v4h-4v-4H7l5-5z"
                      fill="currentColor"
                    />
                  </svg>
                  <span style={{ color: GREEN }}>Upload Resume</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* BOTTOM: Four cards */}
      <div className="mt-6 grid md:grid-cols-2 gap-6">
        {/* Education */}
        <div className="relative rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: GREEN }}>
          <PillHeading>Education</PillHeading>
          <ul className="mt-3 list-disc pl-5 space-y-1 text-sm text-gray-700">
            <li>
              Kasetsart University — Bachelor of Engineering in Software and Knowledge Engineering
            </li>
            <li>Expected Graduation: 2025</li>
            <li>Relevant Courses: Data Mining, Machine Learning, Web Programming, Database Systems</li>
          </ul>
        </div>

        {/* Skills */}
        <div className="relative rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: GREEN }}>
          <PillHeading>Skills</PillHeading>
          <ul className="mt-3 list-disc pl-5 space-y-1 text-sm text-gray-700">
            <li>Technical: Python, SQL, HTML, CSS, JavaScript, Flask, Pandas, NumPy, Scikit-learn</li>
            <li>Tools: VS Code, Jupyter Notebook, Figma, Tableau</li>
            <li>Soft Skills: Problem-solving, teamwork, adaptability, communication</li>
          </ul>
        </div>

        {/* Licenses */}
        <div className="relative rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: GREEN }}>
          <PillHeading>Licenses or Certifications</PillHeading>
          <ul className="mt-3 list-disc pl-5 space-y-1 text-sm text-gray-700">
            <li>Google Data Analytics Professional Certificate — Coursera (2024)</li>
            <li>Python for Everybody — University of Michigan (2023)</li>
          </ul>
        </div>

        {/* Languages */}
        <div className="relative rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: GREEN }}>
          <PillHeading>Languages</PillHeading>
          <ul className="mt-3 list-disc pl-5 space-y-1 text-sm text-gray-700">
            <li>Thai — Native</li>
            <li>English — Professional working proficiency (TOEIC 870)</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
