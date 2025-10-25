"use client";

import { useEffect, useState } from "react";

/* -------------------- Hero Section with Auto Slide -------------------- */
function Hero() {
  const slides = [
    {
      id: 1,
      image: "/home.png",
      title: "GET YOUR BEST PROFESSION",
      subtitle: "EXCLUSIVE FOR CPE AND SKE STUDENTS",
      button: { text: "FIND JOB →", href: "/find-job" },
    },
    {
      id: 2,
      image: "/hero2.jpg",
      title: "EXPLORE TOP COMPANIES",
      subtitle: "CONNECT WITH INDUSTRY LEADERS AND OPPORTUNITIES",
      button: { text: "EXPLORE →", href: "/companies" },
    },
    {
      id: 3,
      image: "/hero3.jpg",
      title: "START YOUR CAREER JOURNEY",
      subtitle: "BUILD CONNECTIONS. FIND YOUR DREAM JOB.",
      button: { text: "JOIN NOW →", href: "/register" },
    },
  ];

  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="mt-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="relative w-full h-[420px] rounded-3xl overflow-hidden shadow-2xl">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out transform ${
              index === current
                ? "opacity-100 scale-100 z-10"
                : "opacity-0 scale-105 z-0"
            }`}
          >
            {/* 🔹 Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${slide.image})` }}
            ></div>

            {/* 🔹 Gradient overlay (right → left for white text) */}
            <div className="absolute inset-0 bg-gradient-to-l from-primary/85 via-primary/60 to-transparent"></div>

            {/* 🔹 Text (Right-aligned, vertical center) */}
            <div className="relative z-10 flex flex-col justify-center items-end pr-10 sm:pr-16 text-right text-white h-full">
              <h1 className="text-3xl md:text-4xl font-extrabold leading-snug drop-shadow-lg tracking-tight">
                {slide.title}
              </h1>
              <p className="mt-4 text-base font-light text-gray-100 tracking-wide max-w-md">
                {slide.subtitle}
              </p>
              <a
                href={slide.button.href}
                className="btn btn-md bg-white/90 text-primary font-semibold rounded-full mt-6 border-none hover:bg-primary hover:text-white shadow-lg hover:shadow-primary/40 transition-all duration-300"
              >
                {slide.button.text}
              </a>
            </div>
          </div>
        ))}

        {/* 🔹 Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                i === current ? "bg-white scale-125" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------- Company Data -------------------- */
const companies = [
  { id: "tcc", name: "TCC TECHNOLOGY", logo: "/tcc.svg" },
  { id: "agoda", name: "AGODA", logo: "/agoda.svg" },
  { id: "lineman", name: "LINEMAN", logo: "/lineman.svg" },
];

/* -------------------- Homepage Main -------------------- */
export default function Homepage() {
  return (
    <main className="bg-gradient-to-b from-white to-primary-light/20 min-h-screen text-gray-800">
      {/* ───── Hero Section ───── */}
      <Hero />

      {/* ───── Company Highlights ───── */}
      <section className="mx-auto max-w-7xl px-6 mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 text-center sm:text-left">
          <h2 className="text-3xl font-extrabold text-primary tracking-tight">
            Company Highlights
          </h2>
          <a
            href="/companies"
            className="mt-3 sm:mt-0 text-sm font-medium text-primary hover:text-midgreen-600 flex items-center justify-center sm:justify-start gap-1 transition"
          >
            See More
            <span className="material-symbols-outlined text-base">

            </span>
          </a>
        </div>

        {/* ───── Company Cards ───── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {companies.map((c) => (
            <div
              key={c.id}
              className="group card bg-white border border-emerald-100 shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-500 rounded-2xl"
            >
              <div className="card-body items-center text-center">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition">
                  <img
                    src={c.logo}
                    alt={c.name}
                    className="w-16 h-16 object-contain"
                  />
                </div>
                <h3 className="card-title text-lg font-semibold text-primary uppercase">
                  {c.name}
                </h3>
                <div className="card-actions mt-4">
                  <a
                    href={`/companies/${c.id}`}
                    className="btn btn-sm bg-primary text-white border-none rounded-full px-5 hover:bg-midgreen-600 shadow-md transition"
                  >
                    View Detail
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ───── Divider ───── */}
      <div className="mx-auto max-w-5xl my-24 border-t border-emerald-200"></div>

      {/* ───── CTA Section ───── */}
      <section className="text-center bg-gradient-to-l from-primary-light/60 to-white py-20 rounded-3xl mx-4 sm:mx-8 lg:mx-16 shadow-inner">
        <h3 className="text-3xl font-bold text-primary mb-4">
          Want to explore more companies?
        </h3>
        <p className="text-gray-600 mb-8 text-base sm:text-lg max-w-xl mx-auto">
          Discover hundreds of companies looking for talented CPE & SKE
          students ready to shine.
        </p>
        <a
          href="/companies"
          className="btn bg-primary text-white border-none rounded-full px-10 py-2 hover:bg-midgreen-600 shadow-lg hover:shadow-primary/40 transition-all duration-300"
        >
          Explore Companies →
        </a>
      </section>

      {/* ───── Footer Spacer ───── */}
      <div className="h-24"></div>
    </main>
  );
}
