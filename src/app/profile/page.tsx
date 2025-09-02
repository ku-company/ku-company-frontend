import Image from "next/image";
import Link from "next/link";

export default function ProfilePage() {
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left column: profile card */}
        <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center">
          <Image
            src="/profile.png" 
            alt="Profile"
            width={120}
            height={120}
            className="rounded-full"
          />
          <h2 className="mt-4 text-lg font-bold text-emerald-800">Smith Samantha</h2>
          <p className="text-sm text-gray-600">Software Engineering Student</p>

          <div className="mt-4 w-full text-sm space-y-2">
            <div>
              <span className="font-semibold">Username:</span> Smith_op
            </div>
            <div>
              <span className="font-semibold">Mail:</span>{" "}
              <a href="mailto:jt23.97@gmail.com" className="text-emerald-700">
                jt23.97@gmail.com
              </a>
            </div>
            <div>
              <span className="font-semibold">Birthday:</span> 23 Dec 1997
            </div>
          </div>
        </div>

        {/* Right column: summary + work history */}
        <div className="md:col-span-2 space-y-6">
          {/* Personal Summary */}
          <section className="bg-white rounded-2xl shadow p-6 border border-emerald-200">
            <h3 className="font-semibold text-emerald-800 mb-2">Personal Summary</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Results-driven software engineering student with a strong interest in data science
              and machine learning. Experienced in Python, SQL, and web development, with proven
              ability to deliver practical solutions for real-world problems. Passionate about
              learning new technologies and working in collaborative environments.
            </p>
          </section>

          {/* Work History */}
          <section className="bg-white rounded-2xl shadow p-6 border border-yellow-200">
            <h3 className="font-semibold text-yellow-700 mb-2">Work History</h3>
            <p className="text-sm font-medium">
              Data Science Intern – BrightWave Solutions Co., Ltd. — Bangkok, Thailand.
            </p>
            <ul className="list-disc list-inside text-sm text-gray-700 mt-2 space-y-1">
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
            <Link href="#" className="text-xs text-emerald-700 hover:underline block mt-2">
              See More…
            </Link>
          </section>
        </div>
      </div>

      {/* Bottom section: 4 cards */}
      <div className="mt-6 grid md:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl shadow p-6">
          <h3 className="font-semibold mb-2">Education</h3>
          <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
            <li>
              Kasetsart University — Bachelor of Engineering in Software and Knowledge Engineering
            </li>
            <li>Expected Graduation: 2025</li>
            <li>Relevant Courses: Data Mining, Machine Learning, Web Programming, Database Systems</li>
          </ul>
        </section>

        <section className="bg-white rounded-2xl shadow p-6">
          <h3 className="font-semibold mb-2">Skills</h3>
          <p className="text-sm text-gray-700">
            Technical: Python, SQL, HTML, CSS, JavaScript, Flask, Pandas, NumPy, Scikit-learn
            <br />
            Tools: VS Code, Jupyter Notebook, Figma, Tableau
            <br />
            Soft Skills: Problem-solving, teamwork, adaptability, communication
          </p>
        </section>

        <section className="bg-white rounded-2xl shadow p-6">
          <h3 className="font-semibold mb-2">Licenses or Certifications</h3>
          <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
            <li>Google Data Analytics Professional Certificate — Coursera (2024)</li>
            <li>Python for Everybody — University of Michigan (2023)</li>
          </ul>
        </section>

        <section className="bg-white rounded-2xl shadow p-6">
          <h3 className="font-semibold mb-2">Languages</h3>
          <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
            <li>Thai — Native</li>
            <li>English — Professional working proficiency (TOEIC 870)</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
