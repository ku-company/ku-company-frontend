import Image from "next/image";

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
        <path d="M3 17.25V21h3.75L18.81 8.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" fill="currentColor" />
      </svg>
    </span>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid h-8 w-8 place-items-center rounded-full bg-gray-100 text-gray-700">
        {icon}
      </span>
      <div className="text-sm">
        <div className="text-gray-500">{label}</div>
        <div className="font-medium text-gray-800">{value}</div>
      </div>
    </div>
  );
}

const MOCK = {
  company_name: "Agoda Travel Co.",
  description: "We provide amazing travel experiences around the world.",
  industry: "Travel & Tourism",
  tel: "021234567",
  location: "Bangkok, Thailand",
};

export default function CompanyProfileView() {
  const GREEN = "#5D9252";
  const company = MOCK; // TODO: replace with API data later

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Company card (mirrors student profile left card) */}
            <aside className="relative rounded-2xl border bg-white p-6 shadow-sm">
              <CornerIcon title="Edit company profile" />
              <div className="flex flex-col items-center">
                <div className={`relative h-28 w-28 overflow-hidden rounded-full ring-4`} style={{ boxShadow: `inset 0 0 0 0 rgba(0,0,0,0.04)`, outline: `4px solid ${GREEN}22`, outlineOffset: 0 }}>
                  <Image
                    src="/company-logo.png"
                    alt={`${company.company_name} logo`}
                    fill
                    className="object-cover"
                  />
                </div>
    
                <h2 className="mt-4 text-xl font-extrabold" style={{ color: GREEN }}>
                  {company.company_name}
                </h2>
                <p className="text-sm text-gray-600">{company.industry}</p>
              </div>
    
              <div className="mt-6 space-y-4">
                <InfoRow icon={<span className="text-xs">📍</span>} label="Location" value={company.location} />
                <InfoRow icon={<span className="text-xs">📞</span>} label="Telephone" value={company.tel} />
              </div>
            </aside>
    
            {/* Description only (like Personal Summary card) */}
            <section className="md:col-span-2 space-y-6">
              <div
                className="relative rounded-2xl border bg-white p-6 shadow-sm"
                style={{ borderColor: GREEN }}
              >
                <CornerIcon title="Edit company description" />
                <PillHeading>Company's Description</PillHeading>
                <p className="mt-3 text-sm leading-6 text-gray-700">
                  {company.description}
                </p>
              </div>
            </section>
          </div>
        </main>
      );
    }
