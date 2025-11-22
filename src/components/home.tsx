import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6">
      <div className="relative h-64 sm:h-80 lg:h-[28rem] overflow-hidden rounded-2xl shadow-lg border" style={{ borderColor: '#5D9252' }}>
        {/* Background image */}
        <Image
          src="/home.png"
          alt="Students and professionals working together"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />

        {/* Green overlay gradient to improve legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/80 via-emerald-900/50 to-transparent" />

        {/* Content */}
        <div className="absolute inset-0 flex items-center">
          <div className="ml-auto p-6 sm:p-10 text-white max-w-xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
              GET YOUR BEST PROFESSION
            </h1>
            <p className="mt-3 text-white/90 text-sm sm:text-base lg:text-lg tracking-wide">
              EXCLUSIVE FOR CPE AND SKE STUDENTS
            </p>
            <div className="mt-6">
              <Link
                href="/find-job"
                className="inline-flex items-center gap-2 rounded-full bg-white text-emerald-800 px-5 py-2 text-sm font-semibold shadow hover:bg-gray-100 transition"
              >
                FIND JOB
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
