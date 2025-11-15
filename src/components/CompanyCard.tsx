import Image from "next/image";
import Link from "next/link";
import type { TopCompany } from "@/api/home";

interface CompanyCardProps {
  company: TopCompany;
}

function stripPlaceholder(value?: string | null) {
  if (!value) return null;
  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && !/^to be added$/i.test(part));
  if (parts.length === 0) return null;
  return parts.join(", ");
}

function formatLocation(company: TopCompany) {
  const cleanedLocation = stripPlaceholder(company.location);
  const cleanedCountry = stripPlaceholder(company.country);
  if (cleanedLocation && cleanedCountry && cleanedLocation !== cleanedCountry) {
    return `${cleanedLocation}, ${cleanedCountry}`;
  }
  return cleanedLocation || cleanedCountry || null;
}

export default function CompanyCard({ company }: CompanyCardProps) {
  const name = company.company_name || "Company";
  const location = formatLocation(company);

  return (
    <div className="group relative rounded-2xl border-2 bg-white shadow-sm overflow-hidden transition-shadow hover:shadow-lg" style={{ borderColor: "#5D9252" }}>
      <div className="relative h-48 bg-gradient-to-br from-emerald-50 via-white to-emerald-100">
        {company.profile_image_url ? (
          <Image
            src={company.profile_image_url}
            alt={`${name} logo`}
            fill
            className="object-contain p-6 transition-transform duration-300 group-hover:scale-105"
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-4xl font-semibold text-emerald-900/70">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="p-4 space-y-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-600">Top Employer</p>
        <div className="text-lg sm:text-xl font-semibold text-gray-800 truncate">{name}</div>
        {location && <p className="text-sm text-gray-500 truncate">{location}</p>}
        <p className="text-sm text-gray-600">
          {company.job_post_count} job{company.job_post_count === 1 ? "" : "s"} posted
        </p>
        {company.user_id ? (
          <Link href={`/profile/${company.user_id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:gap-2 transition-all">
            View profile
            <span aria-hidden className="text-base">&rarr;</span>
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-gray-400 cursor-not-allowed">
            Profile unavailable
          </span>
        )}
      </div>
    </div>
  );
}
