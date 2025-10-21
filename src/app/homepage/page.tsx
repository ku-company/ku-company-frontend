import Hero from "../../components/home";
import CompanyCard from "../../components/CompanyCard";

const companies = [
  { id: "tcc", name: "TCC TECHNOLOGY", number: "01", logo: "/tcc.svg", accent: "bg-emerald-50" },
  { id: "agoda", name: "AGODA", number: "02", logo: "/agoda.svg", accent: "bg-sky-50" },
  { id: "lineman", name: "LINEMAN", number: "03", logo: "/lineman.svg", accent: "bg-green-50" },
];

export default function Homepage() {
  return (
    <main className="pb-16">
      <Hero />
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-semibold">Company Highlight</h2>
          <a href="/companies" className="text-xs text-gray-500 hover:text-gray-700">See More…</a>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {companies.map((c) => <CompanyCard key={c.id} company={c} />)}
        </div>
      </section>
    </main>
  );
}

