import Image from "next/image";
import Link from "next/link";

type Company = {
  id: string;
  name: string;
  number: string;
  logo: string;    // Path to logo image inside /public
  accent?: string; 
};

export default function CompanyCard({ company }: { company: Company }) {
  return (
    <div className="card bg-base-100 border shadow-sm rounded-2xl overflow-hidden">
      <div className={`relative h-48 ${company.accent ?? "bg-base-200"} overflow-hidden`}>
        <Image
          src={company.logo}
          alt={company.name}
          fill
          className="object-contain p-6"
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        />
      </div>
      <div className="p-4">
        <div className="font-semibold truncate">{company.name}</div>
        <Link href={`/company/${company.id}`} className="btn btn-xs btn-primary mt-2 rounded-full text-white">
          View Detail
        </Link>
      </div>
    </div>
  );
}

