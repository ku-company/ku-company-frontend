import Link from "next/link";

export default function Hero() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900 to-emerald-600">
        <div className="p-10 text-white">
          <h1 className="text-4xl font-extrabold leading-tight">
            GET YOUR BEST PROFESSION
          </h1>
          <p className="mt-4 text-white/80 text-sm sm:text-base">
            EXCLUSIVE FOR CPE AND SKE STUDENTS
          </p>
          <div className="mt-6">
            <Link href="/find-job" className="rounded-full bg-white text-emerald-700 px-5 py-2 text-sm font-medium hover:bg-gray-100">
              FIND JOB →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
