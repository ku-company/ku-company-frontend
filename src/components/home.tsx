import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6">
      <div className="hero min-h-64 sm:min-h-80 lg:min-h-96 rounded-2xl overflow-hidden">
        <Image src="/home.png" alt="Home background" fill className="object-cover" priority sizes="100vw" />
        <div className="hero-overlay bg-gradient-to-r from-base-100/10 via-primary/30 to-transparent" />
        <div className="hero-content justify-end w-full">
          <div className="max-w-xl text-base-100">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold drop-shadow">
              GET YOUR BEST PROFESSION
            </h1>
            <p className="mt-3 opacity-90 text-sm sm:text-base">
              EXCLUSIVE FOR CPE AND SKE STUDENTS
            </p>
            <div className="mt-6">
              <Link href="/find-job" className="btn btn-primary rounded-full text-white">
                FIND JOB
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

