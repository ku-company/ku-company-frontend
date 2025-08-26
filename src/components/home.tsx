import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6">
      {/* relative + กำหนดความสูง */}
      <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden rounded-2xl">
        {/* background */}
        <Image
          src="/home.png"          
          alt="Home background"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />

        {/* overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent" />

        {/* word details */}
        <div className="absolute inset-0 flex items-center">
          <div className="ml-auto p-6 sm:p-10 text-white max-w-xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight">
              GET YOUR BEST PROFESSION
            </h1>
            <p className="mt-3 text-white/90 text-sm sm:text-base">
              EXCLUSIVE FOR CPE AND SKE STUDENTS
            </p>
            <div className="mt-6">
              <Link
                href="/find-job"
                className="inline-block rounded-full bg-white text-emerald-800 px-5 py-2 text-sm font-semibold hover:bg-gray-100"
              >
                FIND JOB →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
